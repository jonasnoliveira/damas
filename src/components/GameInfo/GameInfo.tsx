'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import styles from './GameInfo.module.css';

export function GameInfo() {
    const {
        capturedWhite,
        capturedBlack,
        history,
        historyIndex,
        gameStatus,
        winner,
        gameMode,
        undo,
        redo,
        resetGame,
        goToMenu,
    } = useGameStore();

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // Convert move to notation
    const getMoveNotation = (moveIndex: number) => {
        const entry = history[moveIndex];
        if (!entry?.move) return null;
        const { from, to, captures } = entry.move;
        const fromNotation = `${String.fromCharCode(97 + from.col)}${8 - from.row}`;
        const toNotation = `${String.fromCharCode(97 + to.col)}${8 - to.row}`;
        return captures.length > 0 ? `${fromNotation}x${toNotation}` : `${fromNotation}-${toNotation}`;
    };

    return (
        <div className={styles.gameInfo}>
            {/* Captured Pieces */}
            <div className={styles.infoCard}>
                <div className={styles.cardTitle}>Capturas</div>
                <div className={styles.scores}>
                    <div className={styles.scoreItem}>
                        <div className={`${styles.scorePiece} ${styles.scoreWhite}`} />
                        <span className={styles.scoreNumber}>{capturedBlack}</span>
                    </div>
                    <div className={styles.scoreItem}>
                        <div className={`${styles.scorePiece} ${styles.scoreBlack}`} />
                        <span className={styles.scoreNumber}>{capturedWhite}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.infoCard}>
                <div className={styles.cardTitle}>Controles</div>
                <div className={styles.controls}>
                    <button
                        className={`${styles.controlBtn} ${styles.undoBtn}`}
                        onClick={undo}
                        disabled={!canUndo}
                        title="Desfazer"
                    >
                        ↩️ Voltar
                    </button>
                    <button
                        className={`${styles.controlBtn} ${styles.redoBtn}`}
                        onClick={redo}
                        disabled={!canRedo}
                        title="Refazer"
                    >
                        Avançar ↪️
                    </button>
                    <button
                        className={`${styles.controlBtn} ${styles.resetBtn}`}
                        onClick={resetGame}
                        title="Reiniciar"
                    >
                        🔄 Reiniciar
                    </button>
                    <button
                        className={`${styles.controlBtn} ${styles.menuBtn}`}
                        onClick={goToMenu}
                        title="Menu"
                    >
                        🏠 Menu
                    </button>
                </div>
            </div>

            {/* Move History */}
            <div className={styles.infoCard}>
                <div className={styles.cardTitle}>Histórico</div>
                <div className={styles.historyList}>
                    {history.length <= 1 ? (
                        <span className={styles.emptyHistory}>Nenhum movimento ainda</span>
                    ) : (
                        history.slice(1).map((_, index) => {
                            const notation = getMoveNotation(index + 1);
                            if (!notation) return null;
                            return (
                                <div key={index} className={styles.historyItem}>
                                    <span className={styles.historyNumber}>{index + 1}.</span>
                                    <span className={styles.historyMove}>{notation}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Winner Modal */}
            <AnimatePresence>
                {gameStatus === 'ended' && winner && (
                    <motion.div
                        className={styles.winnerOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={styles.winnerModal}
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                        >
                            <h2 className={styles.winnerTitle}>🎉 Vitória!</h2>
                            <div
                                className={`${styles.winnerPiece} ${winner === 'white' ? styles.scoreWhite : styles.scoreBlack}`}
                            />
                            <p className={styles.winnerText}>
                                {gameMode === 'pve' && winner === 'black'
                                    ? 'A IA venceu!'
                                    : `As ${winner === 'white' ? 'Brancas' : 'Pretas'} venceram!`}
                            </p>
                            <div className={styles.winnerButtons}>
                                <button
                                    className="btn btn-primary"
                                    onClick={resetGame}
                                >
                                    Jogar Novamente
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={goToMenu}
                                >
                                    Menu
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
