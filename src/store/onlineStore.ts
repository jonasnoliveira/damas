// Zustand Store for Online Multiplayer State

import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import {
    Room, OnlinePlayer, ConnectionStatus, Player, Move, Piece
} from '@/engine/types';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useGameStore, setOnlineCallbacks, clearOnlineCallbacks } from './gameStore';

interface OnlineStore {
    // State
    connectionStatus: ConnectionStatus;
    room: Room | null;
    rooms: Room[];
    localPlayer: OnlinePlayer | null;
    remotePlayer: OnlinePlayer | null;
    playerName: string;
    error: string | null;
    socket: Socket | null;

    // Actions
    setPlayerName: (name: string) => void;
    connect: () => void;
    disconnect: () => void;
    createRoom: (roomName: string) => void;
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    sendMove: (move: Move) => void;
    requestRematch: () => void;
    reset: () => void;
}

export const useOnlineStore = create<OnlineStore>((set, get) => ({
    // Initial state
    connectionStatus: 'disconnected',
    room: null,
    rooms: [],
    localPlayer: null,
    remotePlayer: null,
    playerName: '',
    error: null,
    socket: null,

    setPlayerName: (name: string) => {
        set({ playerName: name });
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('playerName', name);
        }
    },

    connect: () => {
        const state = get();
        if (state.connectionStatus === 'connected' || state.connectionStatus === 'connecting') {
            return;
        }

        set({ connectionStatus: 'connecting', error: null });

        const socket = getSocket();

        socket.on('connect', () => {
            set({ connectionStatus: 'connected', socket, error: null });
            if (typeof localStorage !== 'undefined') {
                const savedName = localStorage.getItem('playerName');
                if (savedName) {
                    set({ playerName: savedName });
                }
            }
            socket.emit('get-rooms');

            // Set up callbacks for gameStore
            setOnlineCallbacks(
                (move: Move) => get().sendMove(move),
                () => get().leaveRoom(),
                () => get().requestRematch()
            );
        });

        socket.on('disconnect', () => {
            set({ connectionStatus: 'disconnected', socket: null });
            clearOnlineCallbacks();
        });

        socket.on('connect_error', () => {
            set({ connectionStatus: 'error', error: 'Falha ao conectar com o servidor' });
        });

        socket.on('rooms-list', (rooms: Room[]) => {
            set({ rooms });
        });

        socket.on('room-created', (room: Room, color: Player) => {
            const playerName = get().playerName || 'Jogador';
            set({
                room,
                localPlayer: { id: socket.id!, name: playerName, color },
                remotePlayer: null,
            });
        });

        socket.on('room-joined', (room: Room, color: Player) => {
            const playerName = get().playerName || 'Jogador';
            const hostPlayer: OnlinePlayer = {
                id: room.hostId,
                name: room.hostName,
                color: 'white',
            };
            set({
                room,
                localPlayer: { id: socket.id!, name: playerName, color },
                remotePlayer: hostPlayer,
            });
        });

        socket.on('player-joined', (room: Room, guestName: string, guestId: string) => {
            const guestPlayer: OnlinePlayer = {
                id: guestId,
                name: guestName,
                color: 'black',
            };
            set({ room, remotePlayer: guestPlayer });
        });

        socket.on('game-start', (room: Room, board: (Piece | null)[][], currentPlayer: Player) => {
            console.log('[Online] game-start received:', { room: room.id, currentPlayer });
            set({ room });
            const local = get().localPlayer;
            console.log('[Online] localPlayer:', local);
            const localColor = local?.color || 'white';
            console.log('[Online] Starting game with localColor:', localColor);
            useGameStore.getState().startOnlineGame(board, currentPlayer, localColor);
        });

        socket.on('move-made', (move: Move, board: (Piece | null)[][], currentPlayer: Player, capturedWhite: number, capturedBlack: number, gameEnded: boolean, winner: Player | null) => {
            useGameStore.getState().receiveOnlineMove(move, board, currentPlayer, capturedWhite, capturedBlack, gameEnded, winner);
        });

        socket.on('player-left', () => {
            set({ remotePlayer: null, error: 'O outro jogador saiu da partida' });
            useGameStore.getState().goToMenu();
        });

        socket.on('room-error', (message: string) => {
            set({ error: message });
        });

        socket.on('rematch-requested', () => {
            // Could show a notification to the user
        });

        socket.on('rematch-accepted', (room: Room, board: (Piece | null)[][], currentPlayer: Player) => {
            set({ room });
            const local = get().localPlayer;
            useGameStore.getState().startOnlineGame(board, currentPlayer, local?.color || 'white');
        });

        socket.connect();
    },

    disconnect: () => {
        clearOnlineCallbacks();
        disconnectSocket();
        set({
            connectionStatus: 'disconnected',
            socket: null,
            room: null,
            rooms: [],
            localPlayer: null,
            remotePlayer: null,
            error: null,
        });
    },

    createRoom: (roomName: string) => {
        const { socket, playerName } = get();
        if (!socket) return;
        socket.emit('create-room', roomName, playerName || 'Jogador');
    },

    joinRoom: (roomId: string) => {
        const { socket, playerName } = get();
        if (!socket) return;
        socket.emit('join-room', roomId, playerName || 'Jogador');
    },

    leaveRoom: () => {
        const { socket, room } = get();
        if (!socket || !room) return;
        socket.emit('leave-room', room.id);
        set({ room: null, localPlayer: null, remotePlayer: null });
        useGameStore.getState().goToMenu();
    },

    sendMove: (move: Move) => {
        const { socket, room } = get();
        if (!socket || !room) return;
        socket.emit('make-move', room.id, move);
    },

    requestRematch: () => {
        const { socket, room } = get();
        if (!socket || !room) return;
        socket.emit('request-rematch', room.id);
    },

    reset: () => {
        get().disconnect();
        set({
            connectionStatus: 'disconnected',
            room: null,
            rooms: [],
            localPlayer: null,
            remotePlayer: null,
            error: null,
            socket: null,
        });
    },
}));
