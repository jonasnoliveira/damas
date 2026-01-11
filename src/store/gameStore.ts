// Zustand Store for Game State Management

import { create } from 'zustand';
import {
    GameState, GameMode, AIDifficulty, Player, Position, Move, HistoryEntry
} from '@/engine/types';
import { createInitialBoard, cloneBoard, getOpponent } from '@/engine/board';
import { getAllValidMoves, executeMove, checkGameEnd } from '@/engine/moves';
import { getBestMoveAsync } from '@/engine/ai';

interface GameStore extends GameState {
    // Actions
    startGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
    selectPiece: (pos: Position) => void;
    makeMove: (move: Move) => void;
    undo: () => void;
    redo: () => void;
    resetGame: () => void;
    goToMenu: () => void;
    setAIThinking: (thinking: boolean) => void;
    aiThinking: boolean;
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
        });
    },

    selectPiece: (pos: Position) => {
        const state = get();
        if (state.gameStatus !== 'playing' || state.aiThinking) return;

        const piece = state.board[pos.row][pos.col];

        // If clicking on a valid move destination, make the move
        if (state.selectedPiece) {
            const move = state.validMoves.find(
                m => m.to.row === pos.row && m.to.col === pos.col
            );
            if (move) {
                get().makeMove(move);
                return;
            }
        }

        // If clicking on own piece, select it
        if (piece && piece.player === state.currentPlayer) {
            const allMoves = getAllValidMoves(state.board, state.currentPlayer);
            const pieceMoves = allMoves.filter(
                m => m.from.row === pos.row && m.from.col === pos.col
            );

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

    undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;

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
        get().startGame(state.gameMode, state.aiDifficulty);
    },

    goToMenu: () => {
        set({
            ...initialState,
            board: createInitialBoard(),
        });
    },

    setAIThinking: (thinking: boolean) => {
        set({ aiThinking: thinking });
    },
}));
