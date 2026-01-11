const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory room storage
const rooms = new Map();

// Create initial board
function createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { player: 'black', type: 'pawn' };
            }
        }
    }

    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { player: 'white', type: 'pawn' };
            }
        }
    }

    return board;
}

function cloneBoard(board) {
    return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getOpponent(player) {
    return player === 'white' ? 'black' : 'white';
}

function executeMove(board, move) {
    const newBoard = cloneBoard(board);
    const piece = newBoard[move.from.row][move.from.col];

    if (!piece) return newBoard;

    for (const capture of move.captures) {
        newBoard[capture.row][capture.col] = null;
    }

    newBoard[move.from.row][move.from.col] = null;

    const isPromotion = (piece.player === 'white' && move.to.row === 0) ||
        (piece.player === 'black' && move.to.row === 7);

    newBoard[move.to.row][move.to.col] = {
        ...piece,
        type: isPromotion ? 'king' : piece.type,
    };

    return newBoard;
}

function checkGameEnd(board) {
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

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        path: '/api/socketio',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

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

        socket.on('create-room', (roomName, playerName) => {
            const roomId = generateRoomId();
            const board = createInitialBoard();

            const room = {
                id: roomId,
                name: roomName || `Sala de ${playerName}`,
                hostId: socket.id,
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

        socket.on('join-room', (roomId, playerName) => {
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

            room.guestId = socket.id;
            room.guestName = playerName;
            room.status = 'playing';

            socket.join(roomId);
            socket.emit('room-joined', room, 'black');

            socket.to(roomId).emit('player-joined', room, playerName, socket.id);

            setTimeout(() => {
                io.to(roomId).emit('game-start', room, room.board, room.currentPlayer);
            }, 500);

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

        socket.on('make-move', (roomId, move) => {
            const room = rooms.get(roomId);
            if (!room) return;

            const isHost = room.hostId === socket.id;
            const expectedPlayer = isHost ? 'white' : 'black';

            if (room.currentPlayer !== expectedPlayer) {
                socket.emit('room-error', 'Não é sua vez');
                return;
            }

            const newBoard = executeMove(room.board, move);
            const nextPlayer = getOpponent(room.currentPlayer);

            const newCapturedWhite = room.capturedWhite +
                (room.currentPlayer === 'black' ? move.captures.length : 0);
            const newCapturedBlack = room.capturedBlack +
                (room.currentPlayer === 'white' ? move.captures.length : 0);

            const gameEnd = checkGameEnd(newBoard);

            room.board = newBoard;
            room.currentPlayer = nextPlayer;
            room.capturedWhite = newCapturedWhite;
            room.capturedBlack = newCapturedBlack;

            if (gameEnd.ended) {
                room.status = 'ended';
            }

            socket.to(roomId).emit('move-made', move, newBoard, nextPlayer, newCapturedWhite, newCapturedBlack, gameEnd.ended, gameEnd.winner);
        });

        socket.on('leave-room', (roomId) => {
            const room = rooms.get(roomId);
            if (!room) return;

            socket.leave(roomId);
            socket.to(roomId).emit('player-left');

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

        socket.on('request-rematch', (roomId) => {
            const room = rooms.get(roomId);
            if (!room) return;

            room.board = createInitialBoard();
            room.currentPlayer = 'white';
            room.capturedWhite = 0;
            room.capturedBlack = 0;
            room.status = 'playing';

            io.to(roomId).emit('rematch-accepted', room, room.board, room.currentPlayer);
        });

        // Chat message handler
        socket.on('send-chat', (roomId, text) => {
            console.log(`[Chat] Message received from ${socket.id} for room ${roomId}: "${text}"`);
            const room = rooms.get(roomId);
            if (!room) {
                console.log(`[Chat] Room ${roomId} not found`);
                return;
            }

            // Determine sender name
            const isHost = room.hostId === socket.id;
            const senderName = isHost ? room.hostName : room.guestName;
            const timestamp = Date.now();

            console.log(`[Chat] Broadcasting to room ${roomId} from ${senderName}`);

            // Broadcast to the OTHER player in the room (not the sender)
            socket.to(roomId).emit('chat-message', socket.id, senderName, text, timestamp);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);

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

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
