'use client';

import { ReactNode } from 'react';
import styles from './Square.module.css';

interface SquareProps {
    row: number;
    col: number;
    isDark: boolean;
    isSelected: boolean;
    isValidMove: boolean;
    isCapture: boolean;
    isLastMove: boolean;
    onClick: () => void;
    children?: ReactNode;
}

export function Square({
    row,
    col,
    isDark,
    isSelected,
    isValidMove,
    isCapture,
    isLastMove,
    onClick,
    children,
}: SquareProps) {
    const colorClass = isDark ? styles.dark : styles.light;
    const selectedClass = isSelected ? styles.selected : '';
    const validMoveClass = isValidMove ? styles.validMove : '';
    const captureClass = isCapture ? styles.captureMove : '';
    const lastMoveClass = isLastMove ? styles.lastMove : '';

    // Show coordinates on edge squares
    const showRowCoord = col === 0;
    const showColCoord = row === 7;

    return (
        <div
            className={`${styles.square} ${colorClass} ${selectedClass} ${validMoveClass} ${captureClass} ${lastMoveClass}`}
            onClick={onClick}
        >
            {showRowCoord && (
                <span className={`${styles.coordinate} ${styles.coordinateRow}`}>
                    {8 - row}
                </span>
            )}
            {showColCoord && (
                <span className={`${styles.coordinate} ${styles.coordinateCol}`}>
                    {String.fromCharCode(97 + col)}
                </span>
            )}
            {children}
        </div>
    );
}
