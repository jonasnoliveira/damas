// AI Engine using Minimax with Alpha-Beta Pruning

import { Piece, Position, Move, Player, AIDifficulty, BOARD_SIZE } from './types';
import { getPlayerPieces, getOpponent, cloneBoard } from './board';
import { getAllValidMoves, executeMove } from './moves';

// Depth levels for each difficulty
const DIFFICULTY_DEPTH: Record<AIDifficulty, number> = {
    easy: 2,
    medium: 4,
    hard: 6,
};

// Piece values for evaluation
const PAWN_VALUE = 100;
const KING_VALUE = 300;

// Position bonuses (center control, advancement)
const POSITION_BONUS: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 5, 0, 5, 0, 5],
    [5, 0, 10, 0, 10, 0, 5, 0],
    [0, 10, 0, 15, 0, 10, 0, 5],
    [5, 0, 10, 0, 15, 0, 10, 0],
    [0, 5, 0, 10, 0, 10, 0, 5],
    [5, 0, 5, 0, 5, 0, 5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
];

/**
 * Gets the best move for the AI player
 */
export function getBestMove(
    board: (Piece | null)[][],
    player: Player,
    difficulty: AIDifficulty
): Move | null {
    const depth = DIFFICULTY_DEPTH[difficulty];
    const moves = getAllValidMoves(board, player);

    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    let bestMove: Move | null = null;
    let bestScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // Add some randomness for easy mode
    if (difficulty === 'easy') {
        const randomIndex = Math.floor(Math.random() * Math.min(3, moves.length));
        // Sometimes pick a random move in easy mode
        if (Math.random() < 0.3) {
            return moves[randomIndex];
        }
    }

    for (const move of moves) {
        const newBoard = executeMove(board, move);
        const score = minimax(
            newBoard,
            depth - 1,
            alpha,
            beta,
            false,
            player,
            getOpponent(player)
        );

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

/**
 * Minimax algorithm with Alpha-Beta Pruning
 */
function minimax(
    board: (Piece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: Player,
    currentPlayer: Player
): number {
    // Terminal conditions
    if (depth === 0) {
        return evaluateBoard(board, aiPlayer);
    }

    const moves = getAllValidMoves(board, currentPlayer);

    // No moves = loss for current player
    if (moves.length === 0) {
        return isMaximizing ? -10000 + depth : 10000 - depth;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const newBoard = executeMove(board, move);
            const evaluation = minimax(
                newBoard,
                depth - 1,
                alpha,
                beta,
                false,
                aiPlayer,
                getOpponent(currentPlayer)
            );
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break; // Prune
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const newBoard = executeMove(board, move);
            const evaluation = minimax(
                newBoard,
                depth - 1,
                alpha,
                beta,
                true,
                aiPlayer,
                getOpponent(currentPlayer)
            );
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break; // Prune
        }
        return minEval;
    }
}

/**
 * Evaluates the board from the perspective of the AI player
 */
function evaluateBoard(board: (Piece | null)[][], aiPlayer: Player): number {
    let score = 0;
    const opponent = getOpponent(aiPlayer);

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (!piece) continue;

            const pieceValue = piece.type === 'king' ? KING_VALUE : PAWN_VALUE;
            const positionBonus = POSITION_BONUS[row][col];

            // Advancement bonus for pawns
            let advancementBonus = 0;
            if (piece.type === 'pawn') {
                if (piece.player === 'white') {
                    advancementBonus = row * 5; // Closer to promotion = better
                } else {
                    advancementBonus = (BOARD_SIZE - 1 - row) * 5;
                }
            }

            const totalValue = pieceValue + positionBonus + advancementBonus;

            if (piece.player === aiPlayer) {
                score += totalValue;
            } else {
                score -= totalValue;
            }
        }
    }

    // Mobility bonus - having more moves is generally good
    const aiMoves = getAllValidMoves(board, aiPlayer).length;
    const opponentMoves = getAllValidMoves(board, opponent).length;
    score += (aiMoves - opponentMoves) * 5;

    return score;
}

/**
 * Async wrapper for AI move to avoid blocking UI
 */
export function getBestMoveAsync(
    board: (Piece | null)[][],
    player: Player,
    difficulty: AIDifficulty
): Promise<Move | null> {
    return new Promise((resolve) => {
        // Small delay to allow UI to update
        setTimeout(() => {
            const move = getBestMove(board, player, difficulty);
            resolve(move);
        }, 300);
    });
}
