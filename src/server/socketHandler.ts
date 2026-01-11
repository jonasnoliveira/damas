import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Room, Player, Move, Piece } from '@/engine/types';

// In-memory room storage
const rooms: Map<string, RoomState> = new Map();

interface RoomState extends Room {
    board: (Piece | null)[][];
    currentPlayer: Player;
    capturedWhite: number;
    capturedBlack: number;
}

// Create initial board (same logic as client-side)
function createInitialBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { player: 'black', type: 'pawn' };
            }
        }
    }

    // Place white pieces (bottom)
    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { player: 'white', type: 'pawn' };
            }
        }
    }

    return board;
}

function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
    return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getOpponent(player: Player): Player {
    return player === 'white' ? 'black' : 'white';
}

// Execute move on board (simplified version for server)
function executeMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
    const newBoard = cloneBoard(board);
    const piece = newBoard[move.from.row][move.from.col];

    if (!piece) return newBoard;

    // Remove captured pieces
    for (const capture of move.captures) {
        newBoard[capture.row][capture.col] = null;
    }

    // Move piece
    newBoard[move.from.row][move.from.col] = null;

    // Check for promotion
    const isPromotion = (piece.player === 'white' && move.to.row === 0) ||
        (piece.player === 'black' && move.to.row === 7);

    newBoard[move.to.row][move.to.col] = {
        ...piece,
        type: isPromotion ? 'king' : piece.type,
    };

    return newBoard;
}

// Check game end (simplified)
function checkGameEnd(board: (Piece | null)[][], currentPlayer: Player): { ended: boolean; winner: Player | null } {
    let whitePieces = 0;
    let blackPieces = 0;

    for (const row of board) {
        for (const cell of row) {
            if (cell?.player === 'white') whitePieces++;
            if (cell?.player === 'black') blackPieces++;
        }
    }

    if (whitePieces === 0) return { ended: true, winner: 'black' };
    if (blackPieces === 0) return { ended: true, winner: 'white' };

    return { ended: false, winner: null };
}

function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        path: '/api/socketio',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Send all available rooms
        socket.on('get-rooms', () => {
            const availableRooms = Array.from(rooms.values())
                .filter(r => r.status === 'waiting')
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    hostId: r.hostId,
                    hostName: r.hostName,
                    status: r.status,
                }));
            socket.emit('rooms-list', availableRooms);
        });

        // Create a new room
        socket.on('create-room', (roomName: string, playerName: string) => {
            const roomId = generateRoomId();
            const board = createInitialBoard();

            const room: RoomState = {
                id: roomId,
                name: roomName || `Sala de ${playerName}`,
                hostId: socket.id!,
                hostName: playerName,
                status: 'waiting',
                board,
                currentPlayer: 'white',
                capturedWhite: 0,
                capturedBlack: 0,
            };

            rooms.set(roomId, room);
            socket.join(roomId);
            socket.emit('room-created', room, 'white');

            // Broadcast updated rooms list
            io.emit('rooms-list', Array.from(rooms.values())
                .filter(r => r.status === 'waiting')
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    hostId: r.hostId,
                    hostName: r.hostName,
                    status: r.status,
                })));
        });

        // Join an existing room
        socket.on('join-room', (roomId: string, playerName: string) => {
            const room = rooms.get(roomId);

            if (!room) {
                socket.emit('room-error', 'Sala não encontrada');
                return;
            }

            if (room.status !== 'waiting') {
                socket.emit('room-error', 'Essa sala já está em jogo');
                return;
            }

            if (room.guestId) {
                socket.emit('room-error', 'Sala cheia');
                return;
            }

            room.guestId = socket.id!;
            room.guestName = playerName;
            room.status = 'playing';

            socket.join(roomId);
            socket.emit('room-joined', room, 'black');

            // Notify host that someone joined
            socket.to(roomId).emit('player-joined', room, playerName, socket.id!);

            // Start the game for both players
            setTimeout(() => {
                io.to(roomId).emit('game-start', room, room.board, room.currentPlayer);
            }, 500);

            // Update rooms list
            io.emit('rooms-list', Array.from(rooms.values())
                .filter(r => r.status === 'waiting')
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    hostId: r.hostId,
                    hostName: r.hostName,
                    status: r.status,
                })));
        });

        // Handle move
        socket.on('make-move', (roomId: string, move: Move) => {
            const room = rooms.get(roomId);
            if (!room) return;

            // Verify it's this player's turn
            const isHost = room.hostId === socket.id;
            const expectedPlayer = isHost ? 'white' : 'black';

            if (room.currentPlayer !== expectedPlayer) {
                socket.emit('room-error', 'Não é sua vez');
                return;
            }

            // Execute the move
            const newBoard = executeMove(room.board, move);
            const nextPlayer = getOpponent(room.currentPlayer);

            // Update captured counts
            const newCapturedWhite = room.capturedWhite +
                (room.currentPlayer === 'black' ? move.captures.length : 0);
            const newCapturedBlack = room.capturedBlack +
                (room.currentPlayer === 'white' ? move.captures.length : 0);

            // Check game end
            const gameEnd = checkGameEnd(newBoard, nextPlayer);

            // Update room state
            room.board = newBoard;
            room.currentPlayer = nextPlayer;
            room.capturedWhite = newCapturedWhite;
            room.capturedBlack = newCapturedBlack;

            if (gameEnd.ended) {
                room.status = 'ended';
            }

            // Broadcast the move to the other player
            socket.to(roomId).emit('move-made', move, newBoard, nextPlayer, newCapturedWhite, newCapturedBlack, gameEnd.ended, gameEnd.winner);
        });

        // Leave room
        socket.on('leave-room', (roomId: string) => {
            const room = rooms.get(roomId);
            if (!room) return;

            socket.leave(roomId);
            socket.to(roomId).emit('player-left');

            // Clean up room
            rooms.delete(roomId);

            io.emit('rooms-list', Array.from(rooms.values())
                .filter(r => r.status === 'waiting')
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    hostId: r.hostId,
                    hostName: r.hostName,
                    status: r.status,
                })));
        });

        // Request rematch
        socket.on('request-rematch', (roomId: string) => {
            const room = rooms.get(roomId);
            if (!room) return;

            // Reset the game
            room.board = createInitialBoard();
            room.currentPlayer = 'white';
            room.capturedWhite = 0;
            room.capturedBlack = 0;
            room.status = 'playing';

            io.to(roomId).emit('rematch-accepted', room, room.board, room.currentPlayer);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Find and clean up rooms this player was in
            for (const [roomId, room] of rooms.entries()) {
                if (room.hostId === socket.id || room.guestId === socket.id) {
                    socket.to(roomId).emit('player-left');
                    rooms.delete(roomId);
                }
            }

            io.emit('rooms-list', Array.from(rooms.values())
                .filter(r => r.status === 'waiting')
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    hostId: r.hostId,
                    hostName: r.hostName,
                    status: r.status,
                })));
        });
    });

    return io;
}
