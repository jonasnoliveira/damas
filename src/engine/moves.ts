// Move generation and execution for Brazilian Checkers

import {
    Piece, Position, Move, Player, BOARD_SIZE
} from './types';
import {
    cloneBoard, getPieceAt, setPieceAt, isValidPosition,
    getPlayerPieces, positionsEqual, getOpponent
} from './board';

/**
 * Diagonal directions for movement
 */
const DIRECTIONS = [
    { row: -1, col: -1 }, // up-left
    { row: -1, col: 1 },  // up-right
    { row: 1, col: -1 },  // down-left
    { row: 1, col: 1 },   // down-right
];

/**
 * Gets all valid moves for a player
 * In Brazilian Checkers, if capture is available, it's mandatory
 */
export function getAllValidMoves(board: (Piece | null)[][], player: Player): Move[] {
    const pieces = getPlayerPieces(board, player);
    let allMoves: Move[] = [];
    let allCaptures: Move[] = [];

    for (const pos of pieces) {
        const piece = getPieceAt(board, pos);
        if (!piece) continue;

        const moves = getMovesForPiece(board, pos, piece);
        const captures = moves.filter(m => m.captures.length > 0);
        const nonCaptures = moves.filter(m => m.captures.length === 0);

        allCaptures.push(...captures);
        allMoves.push(...nonCaptures);
    }

    // If any captures are available, only captures are valid (mandatory capture rule)
    if (allCaptures.length > 0) {
        // In Brazilian Checkers, must capture the maximum number
        const maxCaptures = Math.max(...allCaptures.map(m => m.captures.length));
        return allCaptures.filter(m => m.captures.length === maxCaptures);
    }

    return allMoves;
}

/**
 * Gets all valid moves for a specific piece
 */
export function getMovesForPiece(board: (Piece | null)[][], pos: Position, piece: Piece): Move[] {
    const captures = getCapturesForPiece(board, pos, piece, []);

    if (captures.length > 0) {
        // Find the maximum capture sequence
        const maxCaptures = Math.max(...captures.map(c => c.captures.length));
        return captures.filter(c => c.captures.length === maxCaptures);
    }

    return getNonCaptureMovesForPiece(board, pos, piece);
}

/**
 * Gets non-capture moves for a piece
 */
function getNonCaptureMovesForPiece(board: (Piece | null)[][], pos: Position, piece: Piece): Move[] {
    const moves: Move[] = [];
    const directions = getDirections(piece);

    if (piece.type === 'pawn') {
        // Pawns move one square diagonally
        for (const dir of directions) {
            const newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
            if (isValidPosition(newPos) && !getPieceAt(board, newPos)) {
                moves.push({
                    from: pos,
                    to: newPos,
                    captures: [],
                    isPromotion: shouldPromote(newPos, piece.player),
                });
            }
        }
    } else {
        // Kings can move multiple squares diagonally
        for (const dir of directions) {
            let newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
            while (isValidPosition(newPos) && !getPieceAt(board, newPos)) {
                moves.push({
                    from: pos,
                    to: newPos,
                    captures: [],
                    isPromotion: false,
                });
                newPos = { row: newPos.row + dir.row, col: newPos.col + dir.col };
            }
        }
    }

    return moves;
}

/**
 * Gets all capture sequences for a piece (recursive for multi-captures)
 */
function getCapturesForPiece(
    board: (Piece | null)[][],
    pos: Position,
    piece: Piece,
    capturedSoFar: Position[]
): Move[] {
    const captures: Move[] = [];
    const directions = DIRECTIONS; // Captures can be in any direction

    if (piece.type === 'pawn') {
        // Pawn captures one square over the opponent
        for (const dir of directions) {
            const enemyPos = { row: pos.row + dir.row, col: pos.col + dir.col };
            const landPos = { row: pos.row + dir.row * 2, col: pos.col + dir.col * 2 };

            if (!isValidPosition(enemyPos) || !isValidPosition(landPos)) continue;

            // Check for already captured piece
            if (capturedSoFar.some(c => positionsEqual(c, enemyPos))) continue;

            const enemyPiece = getPieceAt(board, enemyPos);
            const landPiece = getPieceAt(board, landPos);

            if (enemyPiece && enemyPiece.player !== piece.player && !landPiece) {
                const newCaptured = [...capturedSoFar, enemyPos];
                const willPromote = shouldPromote(landPos, piece.player);

                // Try to continue capturing
                const tempBoard = cloneBoard(board);
                setPieceAt(tempBoard, pos, null);
                setPieceAt(tempBoard, enemyPos, null);

                const movedPiece = willPromote ? { ...piece, type: 'king' as const } : piece;
                setPieceAt(tempBoard, landPos, movedPiece);

                const continuedCaptures = getCapturesForPiece(tempBoard, landPos, movedPiece, newCaptured);

                if (continuedCaptures.length > 0) {
                    // Continue the chain
                    for (const continued of continuedCaptures) {
                        captures.push({
                            from: pos,
                            to: continued.to,
                            captures: newCaptured.concat(continued.captures.filter(
                                c => !newCaptured.some(nc => positionsEqual(nc, c))
                            )),
                            isPromotion: continued.isPromotion || willPromote,
                        });
                    }
                } else {
                    // End of capture sequence
                    captures.push({
                        from: pos,
                        to: landPos,
                        captures: newCaptured,
                        isPromotion: willPromote,
                    });
                }
            }
        }
    } else {
        // King captures - can land anywhere after the captured piece
        for (const dir of directions) {
            let distance = 1;
            let foundEnemy: Position | null = null;

            while (true) {
                const checkPos = { row: pos.row + dir.row * distance, col: pos.col + dir.col * distance };
                if (!isValidPosition(checkPos)) break;

                const checkPiece = getPieceAt(board, checkPos);

                if (checkPiece) {
                    if (foundEnemy) break; // Can't jump over two pieces
                    if (checkPiece.player === piece.player) break; // Can't jump own piece
                    if (capturedSoFar.some(c => positionsEqual(c, checkPos))) {
                        distance++;
                        continue;
                    }
                    foundEnemy = checkPos;
                } else if (foundEnemy) {
                    // Valid landing position after capturing
                    const newCaptured = [...capturedSoFar, foundEnemy];

                    const tempBoard = cloneBoard(board);
                    setPieceAt(tempBoard, pos, null);
                    setPieceAt(tempBoard, foundEnemy, null);
                    setPieceAt(tempBoard, checkPos, piece);

                    const continuedCaptures = getCapturesForPiece(tempBoard, checkPos, piece, newCaptured);

                    if (continuedCaptures.length > 0) {
                        for (const continued of continuedCaptures) {
                            captures.push({
                                from: pos,
                                to: continued.to,
                                captures: newCaptured.concat(continued.captures.filter(
                                    c => !newCaptured.some(nc => positionsEqual(nc, c))
                                )),
                                isPromotion: false,
                            });
                        }
                    } else {
                        captures.push({
                            from: pos,
                            to: checkPos,
                            captures: newCaptured,
                            isPromotion: false,
                        });
                    }
                }

                distance++;
            }
        }
    }

    return captures;
}

/**
 * Gets valid movement directions for a piece
 */
function getDirections(piece: Piece): { row: number; col: number }[] {
    if (piece.type === 'king') {
        return DIRECTIONS;
    }
    // Pawns: white moves down (positive row), black moves up (negative row)
    if (piece.player === 'white') {
        return [{ row: 1, col: -1 }, { row: 1, col: 1 }];
    }
    return [{ row: -1, col: -1 }, { row: -1, col: 1 }];
}

/**
 * Checks if a pawn should be promoted
 */
function shouldPromote(pos: Position, player: Player): boolean {
    if (player === 'white') {
        return pos.row === BOARD_SIZE - 1;
    }
    return pos.row === 0;
}

/**
 * Executes a move and returns the new board state
 */
export function executeMove(board: (Piece | null)[][], move: Move): (Piece | null)[][] {
    const newBoard = cloneBoard(board);
    const piece = getPieceAt(newBoard, move.from);

    if (!piece) return newBoard;

    // Remove piece from origin
    setPieceAt(newBoard, move.from, null);

    // Remove captured pieces
    for (const capturedPos of move.captures) {
        setPieceAt(newBoard, capturedPos, null);
    }

    // Place piece at destination (promote if needed)
    const finalPiece: Piece = move.isPromotion
        ? { ...piece, type: 'king' }
        : piece;
    setPieceAt(newBoard, move.to, finalPiece);

    return newBoard;
}

/**
 * Checks if the game has ended
 */
export function checkGameEnd(board: (Piece | null)[][], currentPlayer: Player): { ended: boolean; winner: Player | null } {
    const opponent = getOpponent(currentPlayer);
    const opponentPieces = getPlayerPieces(board, opponent);

    // If opponent has no pieces, current player wins
    if (opponentPieces.length === 0) {
        return { ended: true, winner: currentPlayer };
    }

    // Check if current player has any valid moves
    const currentMoves = getAllValidMoves(board, currentPlayer);
    if (currentMoves.length === 0) {
        // Current player can't move, they lose
        return { ended: true, winner: opponent };
    }

    return { ended: false, winner: null };
}
