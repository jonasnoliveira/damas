'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { AIDifficulty } from '@/engine/types';
import styles from './Menu.module.css';

export function Menu() {
    const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium');
    const startGame = useGameStore((state) => state.startGame);

    const handlePVP = () => {
        startGame('pvp');
    };

    const handlePVE = () => {
        startGame('pve', selectedDifficulty);
    };

    const difficulties: { key: AIDifficulty; label: string }[] = [
        { key: 'easy', label: 'Fácil' },
        { key: 'medium', label: 'Médio' },
        { key: 'hard', label: 'Difícil' },
    ];

    return (
        <motion.div
            className={styles.menuContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className={styles.logo}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {/* Mini Board Preview */}
                <div className={styles.boardPreview}>
                    {[...Array(16)].map((_, i) => {
                        const row = Math.floor(i / 4);
                        const col = i % 4;
                        const isDark = (row + col) % 2 === 1;
                        const showWhite = isDark && row < 1;
                        const showBlack = isDark && row > 2;

                        return (
                            <div
                                key={i}
                                className={`${styles.previewSquare} ${isDark ? styles.previewDark : styles.previewLight}`}
                            >
                                {showWhite && <div className={`${styles.previewPiece} ${styles.previewWhite}`} />}
                                {showBlack && <div className={`${styles.previewPiece} ${styles.previewBlack}`} />}
                            </div>
                        );
                    })}
                </div>

                <h1 className={styles.title}>Damas Brasileiras</h1>
                <p className={styles.subtitle}>O clássico jogo de estratégia</p>
            </motion.div>

            <motion.div
                className={styles.menuCard}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <div className={styles.menuButtons}>
                    <motion.button
                        className={`${styles.menuBtn} ${styles.pvpBtn}`}
                        onClick={handlePVP}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        👥 Jogar vs Amigo
                    </motion.button>

                    <motion.button
                        className={`${styles.menuBtn} ${styles.pveBtn}`}
                        onClick={handlePVE}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        🤖 Jogar vs Máquina
                    </motion.button>
                </div>

                {/* Difficulty Selection */}
                <div className={styles.difficultySection}>
                    <div className={styles.difficultyTitle}>Dificuldade da IA</div>
                    <div className={styles.difficultyButtons}>
                        {difficulties.map(({ key, label }) => (
                            <button
                                key={key}
                                className={`${styles.difficultyBtn} ${selectedDifficulty === key ? styles.difficultyBtnActive : ''}`}
                                onClick={() => setSelectedDifficulty(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            <motion.p
                className={styles.rulesLink}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                Regras: Damas Brasileiras • Tabuleiro 8x8 • Captura obrigatória
            </motion.p>
        </motion.div>
    );
}
