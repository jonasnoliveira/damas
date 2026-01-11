'use client';

import { motion } from 'framer-motion';
import { Piece as PieceType } from '@/engine/types';
import styles from './Piece.module.css';

interface PieceProps {
    piece: PieceType;
    isSelected: boolean;
    isCurrentPlayer: boolean;
    onClick: () => void;
}

export function Piece({ piece, isSelected, isCurrentPlayer, onClick }: PieceProps) {
    const pieceClass = piece.player === 'white' ? styles.pieceWhite : styles.pieceBlack;
    const selectedClass = isSelected ? styles.selected : '';
    const disabledClass = !isCurrentPlayer ? styles.disabled : '';

    return (
        <motion.div
            className={`${styles.piece} ${pieceClass} ${selectedClass} ${disabledClass}`}
            onClick={onClick}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={isCurrentPlayer && !isSelected ? { scale: 1.08 } : undefined}
            whileTap={isCurrentPlayer ? { scale: 0.95 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            layout
        >
            {piece.type === 'king' && (
                <motion.span
                    className={styles.crown}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    👑
                </motion.span>
            )}
        </motion.div>
    );
}
