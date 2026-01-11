// Board initialization and utilities for Brazilian Checkers

import { Piece, Position, BOARD_SIZE, Player } from './types';

/**
 * Creates the initial board setup for Brazilian Checkers
 * White pieces on rows 0-2, Black pieces on rows 5-7
 * Pieces only on dark squares (where row + col is odd)
 */
export function createInitialBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null));

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // Only place pieces on dark squares
            if ((row + col) % 2 === 1) {
                if (row < 3) {
                    // White pieces on top
                    board[row][col] = { player: 'white', type: 'pawn' };
                } else if (row > 4) {
                    // Black pieces on bottom
                    board[row][col] = { player: 'black', type: 'pawn' };
                }
            }
        }
    }

    return board;
}

/**
 * Creates a deep copy of the board
 */
export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
    return board.map(row =>
        row.map(piece => (piece ? { ...piece } : null))
    );
}

/**
 * Gets cell at position
 */
export function getPieceAt(board: (Piece | null)[][], pos: Position): Piece | null {
    if (!isValidPosition(pos)) return null;
    return board[pos.row][pos.col];
}

/**
 * Sets piece at position
 */
export function setPieceAt(board: (Piece | null)[][], pos: Position, piece: Piece | null): void {
    if (isValidPosition(pos)) {
        board[pos.row][pos.col] = piece;
    }
}

/**
 * Checks if position is within board bounds
 */
export function isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/**
 * Checks if a square is a dark square (playable)
 */
export function isDarkSquare(pos: Position): boolean {
    return (pos.row + pos.col) % 2 === 1;
}

/**
 * Gets all pieces for a player
 */
export function getPlayerPieces(board: (Piece | null)[][], player: Player): Position[] {
    const pieces: Position[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && piece.player === player) {
                pieces.push({ row, col });
            }
        }
    }
    return pieces;
}

/**
 * Counts pieces for a player
 */
export function countPieces(board: (Piece | null)[][], player: Player): number {
    return getPlayerPieces(board, player).length;
}

/**
 * Checks if position equals another position
 */
export function positionsEqual(a: Position, b: Position): boolean {
    return a.row === b.row && a.col === b.col;
}

/**
 * Gets the opponent player
 */
export function getOpponent(player: Player): Player {
    return player === 'white' ? 'black' : 'white';
}
