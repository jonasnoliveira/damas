'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Square } from '@/components/Square/Square';
import { Piece } from '@/components/Piece/Piece';
import { positionsEqual } from '@/engine/board';
import styles from './Board.module.css';

export function Board() {
    const {
        board,
        currentPlayer,
        selectedPiece,
        validMoves,
        history,
        historyIndex,
        aiThinking,
        selectPiece,
    } = useGameStore();

    // Get last move for highlighting
    const lastMove = historyIndex > 0 ? history[historyIndex]?.move : null;

    const handleSquareClick = (row: number, col: number) => {
        if (aiThinking) return;
        selectPiece({ row, col });
    };

    return (
        <div className={styles.boardWrapper}>
            {/* Turn Indicator */}
            <div className={styles.turnIndicator}>
                <div
                    className={`${styles.turnDot} ${currentPlayer === 'white' ? styles.turnDotWhite : styles.turnDotBlack}`}
                />
                <span className={styles.turnText}>
                    {aiThinking ? (
                        <span className={styles.aiThinking}>
                            IA pensando
                            <span className={styles.thinkingDots}>
                                <span className={styles.thinkingDot} />
                                <span className={styles.thinkingDot} />
                                <span className={styles.thinkingDot} />
                            </span>
                        </span>
                    ) : (
                        `Vez das ${currentPlayer === 'white' ? 'Brancas' : 'Pretas'}`
                    )}
                </span>
            </div>

            {/* Board */}
            <motion.div
                className={styles.board}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                        const isDark = (rowIndex + colIndex) % 2 === 1;
                        const position = { row: rowIndex, col: colIndex };
                        const isSelected = selectedPiece && positionsEqual(selectedPiece, position);
                        const validMove = validMoves.find(m => positionsEqual(m.to, position));
                        const isValidMove = !!validMove;
                        const isCapture = validMove ? validMove.captures.length > 0 : false;
                        const isLastMove = lastMove
                            ? positionsEqual(lastMove.from, position) || positionsEqual(lastMove.to, position)
                            : false;

                        return (
                            <Square
                                key={`${rowIndex}-${colIndex}`}
                                row={rowIndex}
                                col={colIndex}
                                isDark={isDark}
                                isSelected={!!isSelected}
                                isValidMove={isValidMove}
                                isCapture={isCapture}
                                isLastMove={isLastMove}
                                onClick={() => handleSquareClick(rowIndex, colIndex)}
                            >
                                <AnimatePresence mode="popLayout">
                                    {piece && (
                                        <motion.div
                                            key={`piece-${rowIndex}-${colIndex}-${piece.player}-${piece.type}`}
                                            layoutId={`piece-${rowIndex}-${colIndex}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            <Piece
                                                piece={piece}
                                                isSelected={!!isSelected}
                                                isCurrentPlayer={piece.player === currentPlayer && !aiThinking}
                                                onClick={() => handleSquareClick(rowIndex, colIndex)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Square>
                        );
                    })
                )}
            </motion.div>
        </div>
    );
}
