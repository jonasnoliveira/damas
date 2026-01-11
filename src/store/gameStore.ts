// Zustand Store for Game State Management

import { create } from 'zustand';
import {
    GameState, GameMode, AIDifficulty, Player, Position, Move, HistoryEntry, Piece
} from '@/engine/types';
import { createInitialBoard, cloneBoard, getOpponent } from '@/engine/board';
import { getAllValidMoves, executeMove, checkGameEnd } from '@/engine/moves';
import { getBestMoveAsync } from '@/engine/ai';

// Callback for sending moves online (will be set by onlineStore)
let onlineMoveCallback: ((move: Move) => void) | null = null;
let onlineLeaveCallback: (() => void) | null = null;
let onlineRematchCallback: (() => void) | null = null;

export const setOnlineCallbacks = (
    sendMove: (move: Move) => void,
    leaveRoom: () => void,
    requestRematch: () => void
) => {
    onlineMoveCallback = sendMove;
    onlineLeaveCallback = leaveRoom;
    onlineRematchCallback = requestRematch;
};

export const clearOnlineCallbacks = () => {
    onlineMoveCallback = null;
    onlineLeaveCallback = null;
    onlineRematchCallback = null;
};

interface GameStore extends GameState {
    // Additional state
    aiThinking: boolean;
    localPlayerColor: Player | null; // For online mode

    // Actions
    startGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
    startOnlineGame: (board: (Piece | null)[][], currentPlayer: Player, localColor: Player) => void;
    selectPiece: (pos: Position) => void;
    makeMove: (move: Move) => void;
    makeOnlineMove: (move: Move) => void; // For sending moves to server
    receiveOnlineMove: (move: Move, board: (Piece | null)[][], currentPlayer: Player, capturedWhite: number, capturedBlack: number, gameEnded: boolean, winner: Player | null) => void;
    undo: () => void;
    redo: () => void;
    resetGame: () => void;
    goToMenu: () => void;
    setAIThinking: (thinking: boolean) => void;
}

const initialState: Omit<GameState, 'board'> & { board: ReturnType<typeof createInitialBoard> } = {
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPiece: null,
    validMoves: [],
    capturedWhite: 0,
    capturedBlack: 0,
    history: [],
    historyIndex: -1,
    gameStatus: 'menu',
    gameMode: 'pvp',
    aiDifficulty: 'medium',
    winner: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
    ...initialState,
    aiThinking: false,
    localPlayerColor: null,

    startGame: (mode: GameMode, difficulty: AIDifficulty = 'medium') => {
        const board = createInitialBoard();
        const initialHistory: HistoryEntry = {
            board: cloneBoard(board),
            currentPlayer: 'white',
            capturedWhite: 0,
            capturedBlack: 0,
            move: null,
        };

        set({
            board,
            currentPlayer: 'white',
            selectedPiece: null,
            validMoves: [],
            capturedWhite: 0,
            capturedBlack: 0,
            history: [initialHistory],
            historyIndex: 0,
            gameStatus: 'playing',
            gameMode: mode,
            aiDifficulty: difficulty,
            winner: null,
            aiThinking: false,
            localPlayerColor: null,
        });
    },

    startOnlineGame: (board: (Piece | null)[][], currentPlayer: Player, localColor: Player) => {
        const initialHistory: HistoryEntry = {
            board: cloneBoard(board),
            currentPlayer,
            capturedWhite: 0,
            capturedBlack: 0,
            move: null,
        };

        set({
            board: cloneBoard(board),
            currentPlayer,
            selectedPiece: null,
            validMoves: [],
            capturedWhite: 0,
            capturedBlack: 0,
            history: [initialHistory],
            historyIndex: 0,
            gameStatus: 'playing',
            gameMode: 'online',
            winner: null,
            aiThinking: false,
            localPlayerColor: localColor,
        });
    },

    selectPiece: (pos: Position) => {
        const state = get();

        // Debug logging for online mode
        if (state.gameMode === 'online') {
            console.log('[Game] selectPiece called:', {
                pos,
                gameStatus: state.gameStatus,
                gameMode: state.gameMode,
                currentPlayer: state.currentPlayer,
                localPlayerColor: state.localPlayerColor,
                isMyTurn: state.localPlayerColor === state.currentPlayer,
            });
        }

        if (state.gameStatus !== 'playing' || state.aiThinking) {
            console.log('[Game] selectPiece blocked: gameStatus=', state.gameStatus, 'aiThinking=', state.aiThinking);
            return;
        }

        // In online mode, only allow selecting pieces when it's local player's turn
        if (state.gameMode === 'online' && state.localPlayerColor !== state.currentPlayer) {
            console.log('[Game] selectPiece blocked: not your turn');
            return;
        }

        const piece = state.board[pos.row][pos.col];

        // If clicking on a valid move destination, make the move
        if (state.selectedPiece) {
            const move = state.validMoves.find(
                m => m.to.row === pos.row && m.to.col === pos.col
            );
            if (move) {
                if (state.gameMode === 'online') {
                    get().makeOnlineMove(move);
                } else {
                    get().makeMove(move);
                }
                return;
            }
        }

        // If clicking on own piece, select it
        if (piece && piece.player === state.currentPlayer) {
            const allMoves = getAllValidMoves(state.board, state.currentPlayer);
            const pieceMoves = allMoves.filter(
                m => m.from.row === pos.row && m.from.col === pos.col
            );

            console.log('[Game] Piece selected, valid moves:', pieceMoves.length);

            set({
                selectedPiece: pos,
                validMoves: pieceMoves,
            });
        } else {
            set({
                selectedPiece: null,
                validMoves: [],
            });
        }
    },

    makeMove: async (move: Move) => {
        const state = get();
        if (state.gameStatus !== 'playing') return;

        const newBoard = executeMove(state.board, move);
        const nextPlayer = getOpponent(state.currentPlayer);

        // Update captured counts
        const newCapturedWhite = state.capturedWhite +
            (state.currentPlayer === 'black' ? move.captures.length : 0);
        const newCapturedBlack = state.capturedBlack +
            (state.currentPlayer === 'white' ? move.captures.length : 0);

        // Add to history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
            board: cloneBoard(newBoard),
            currentPlayer: nextPlayer,
            capturedWhite: newCapturedWhite,
            capturedBlack: newCapturedBlack,
            move,
        });

        // Check for game end
        const gameEnd = checkGameEnd(newBoard, nextPlayer);

        set({
            board: newBoard,
            currentPlayer: nextPlayer,
            selectedPiece: null,
            validMoves: [],
            capturedWhite: newCapturedWhite,
            capturedBlack: newCapturedBlack,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            gameStatus: gameEnd.ended ? 'ended' : 'playing',
            winner: gameEnd.winner,
        });

        // AI turn
        const updatedState = get();
        if (
            updatedState.gameMode === 'pve' &&
            updatedState.currentPlayer === 'black' &&
            updatedState.gameStatus === 'playing'
        ) {
            set({ aiThinking: true });
            const aiMove = await getBestMoveAsync(
                updatedState.board,
                'black',
                updatedState.aiDifficulty
            );
            if (aiMove) {
                // Small delay for visual feedback
                setTimeout(() => {
                    get().makeMove(aiMove);
                    set({ aiThinking: false });
                }, 200);
            } else {
                set({ aiThinking: false });
            }
        }
    },

    makeOnlineMove: (move: Move) => {
        // Send move to server via callback
        if (onlineMoveCallback) {
            onlineMoveCallback(move);
        }

        // Optimistically update the local state
        const state = get();
        const newBoard = executeMove(state.board, move);
        const nextPlayer = getOpponent(state.currentPlayer);

        const newCapturedWhite = state.capturedWhite +
            (state.currentPlayer === 'black' ? move.captures.length : 0);
        const newCapturedBlack = state.capturedBlack +
            (state.currentPlayer === 'white' ? move.captures.length : 0);

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
            board: cloneBoard(newBoard),
            currentPlayer: nextPlayer,
            capturedWhite: newCapturedWhite,
            capturedBlack: newCapturedBlack,
            move,
        });

        const gameEnd = checkGameEnd(newBoard, nextPlayer);

        set({
            board: newBoard,
            currentPlayer: nextPlayer,
            selectedPiece: null,
            validMoves: [],
            capturedWhite: newCapturedWhite,
            capturedBlack: newCapturedBlack,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            gameStatus: gameEnd.ended ? 'ended' : 'playing',
            winner: gameEnd.winner,
        });
    },

    receiveOnlineMove: (move: Move, board: (Piece | null)[][], currentPlayer: Player, capturedWhite: number, capturedBlack: number, gameEnded: boolean, winner: Player | null) => {
        const state = get();

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
            board: cloneBoard(board),
            currentPlayer,
            capturedWhite,
            capturedBlack,
            move,
        });

        set({
            board: cloneBoard(board),
            currentPlayer,
            selectedPiece: null,
            validMoves: [],
            capturedWhite,
            capturedBlack,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            gameStatus: gameEnded ? 'ended' : 'playing',
            winner,
        });
    },

    undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;
        // Disable undo in online mode
        if (state.gameMode === 'online') return;

        // In PvE mode, undo two moves (player + AI)
        const stepsBack = state.gameMode === 'pve' && state.historyIndex >= 2 ? 2 : 1;
        const newIndex = Math.max(0, state.historyIndex - stepsBack);
        const historyEntry = state.history[newIndex];

        set({
            board: cloneBoard(historyEntry.board),
            currentPlayer: historyEntry.currentPlayer,
            capturedWhite: historyEntry.capturedWhite,
            capturedBlack: historyEntry.capturedBlack,
            historyIndex: newIndex,
            selectedPiece: null,
            validMoves: [],
            gameStatus: 'playing',
            winner: null,
        });
    },

    redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;
        // Disable redo in online mode
        if (state.gameMode === 'online') return;

        const newIndex = state.historyIndex + 1;
        const historyEntry = state.history[newIndex];

        set({
            board: cloneBoard(historyEntry.board),
            currentPlayer: historyEntry.currentPlayer,
            capturedWhite: historyEntry.capturedWhite,
            capturedBlack: historyEntry.capturedBlack,
            historyIndex: newIndex,
            selectedPiece: null,
            validMoves: [],
        });
    },

    resetGame: () => {
        const state = get();
        if (state.gameMode === 'online') {
            // In online mode, request rematch through the callback
            if (onlineRematchCallback) {
                onlineRematchCallback();
            }
            return;
        }
        get().startGame(state.gameMode, state.aiDifficulty);
    },

    goToMenu: () => {
        const state = get();
        if (state.gameMode === 'online') {
            if (onlineLeaveCallback) {
                onlineLeaveCallback();
            }
        }
        clearOnlineCallbacks();
        set({
            ...initialState,
            board: createInitialBoard(),
            localPlayerColor: null,
        });
    },

    setAIThinking: (thinking: boolean) => {
        set({ aiThinking: thinking });
    },
}));
