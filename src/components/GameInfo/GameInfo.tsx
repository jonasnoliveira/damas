'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useOnlineStore } from '@/store/onlineStore';
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
        currentPlayer,
        localPlayerColor,
        undo,
        redo,
        resetGame,
        goToMenu,
    } = useGameStore();

    const { localPlayer, remotePlayer, leaveRoom } = useOnlineStore();

    const canUndo = historyIndex > 0 && gameMode !== 'online';
    const canRedo = historyIndex < history.length - 1 && gameMode !== 'online';
    const isOnline = gameMode === 'online';

    // Convert move to notation
    const getMoveNotation = (moveIndex: number) => {
        const entry = history[moveIndex];
        if (!entry?.move) return null;
        const { from, to, captures } = entry.move;
        const fromNotation = `${String.fromCharCode(97 + from.col)}${8 - from.row}`;
        const toNotation = `${String.fromCharCode(97 + to.col)}${8 - to.row}`;
        return captures.length > 0 ? `${fromNotation}x${toNotation}` : `${fromNotation}-${toNotation}`;
    };

    const handleLeave = () => {
        if (isOnline) {
            leaveRoom();
        } else {
            goToMenu();
        }
    };

    return (
        <div className={styles.gameInfo}>
            {/* Online Player Info */}
            {isOnline && (
                <div className={styles.infoCard}>
                    <div className={styles.cardTitle}>Jogadores</div>
                    <div className={styles.playersInfo}>
                        <div className={`${styles.playerRow} ${currentPlayer === 'white' ? styles.playerActive : ''}`}>
                            <div className={`${styles.playerPiece} ${styles.scoreWhite}`} />
                            <div className={styles.playerDetails}>
                                <span className={styles.playerName}>
                                    {localPlayerColor === 'white' ? `${localPlayer?.name || 'Você'} (você)` : remotePlayer?.name || 'Oponente'}
                                </span>
                                <span className={styles.playerColor}>Brancas</span>
                            </div>
                            {currentPlayer === 'white' && <span className={styles.turnIndicator}>⏳</span>}
                        </div>
                        <div className={`${styles.playerRow} ${currentPlayer === 'black' ? styles.playerActive : ''}`}>
                            <div className={`${styles.playerPiece} ${styles.scoreBlack}`} />
                            <div className={styles.playerDetails}>
                                <span className={styles.playerName}>
                                    {localPlayerColor === 'black' ? `${localPlayer?.name || 'Você'} (você)` : remotePlayer?.name || 'Oponente'}
                                </span>
                                <span className={styles.playerColor}>Pretas</span>
                            </div>
                            {currentPlayer === 'black' && <span className={styles.turnIndicator}>⏳</span>}
                        </div>
                    </div>
                </div>
            )}

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
                    {!isOnline && (
                        <>
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
                        </>
                    )}
                    <button
                        className={`${styles.controlBtn} ${styles.resetBtn}`}
                        onClick={resetGame}
                        title={isOnline ? "Revanche" : "Reiniciar"}
                    >
                        🔄 {isOnline ? 'Revanche' : 'Reiniciar'}
                    </button>
                    <button
                        className={`${styles.controlBtn} ${styles.menuBtn}`}
                        onClick={handleLeave}
                        title={isOnline ? "Sair da Sala" : "Menu"}
                    >
                        🏠 {isOnline ? 'Sair' : 'Menu'}
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
                                {isOnline
                                    ? (winner === localPlayerColor ? 'Você venceu!' : `${remotePlayer?.name || 'Oponente'} venceu!`)
                                    : gameMode === 'pve' && winner === 'black'
                                        ? 'A IA venceu!'
                                        : `As ${winner === 'white' ? 'Brancas' : 'Pretas'} venceram!`}
                            </p>
                            <div className={styles.winnerButtons}>
                                <button
                                    className="btn btn-primary"
                                    onClick={resetGame}
                                >
                                    {isOnline ? 'Revanche' : 'Jogar Novamente'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleLeave}
                                >
                                    {isOnline ? 'Sair da Sala' : 'Menu'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
