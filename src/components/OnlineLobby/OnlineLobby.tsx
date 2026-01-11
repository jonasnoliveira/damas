'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStore } from '@/store/onlineStore';
import { Room } from '@/engine/types';
import styles from './OnlineLobby.module.css';

interface OnlineLobbyProps {
    onBack?: () => void;
}

export function OnlineLobby({ onBack }: OnlineLobbyProps) {
    const {
        connectionStatus,
        rooms,
        room,
        localPlayer,
        remotePlayer,
        playerName,
        error,
        setPlayerName,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        leaveRoom,
    } = useOnlineStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [localName, setLocalName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('playerName');
        if (saved) {
            setLocalName(saved);
            setPlayerName(saved);
        }
    }, [setPlayerName]);

    useEffect(() => {
        connect();
        return () => {
            // Don't disconnect on unmount, we might be transitioning to game
        };
    }, [connect]);

    const handleCreateRoom = () => {
        if (!localName.trim()) return;
        setPlayerName(localName);
        createRoom(roomName || `Sala de ${localName}`);
        setShowCreateModal(false);
        setRoomName('');
    };

    const handleJoinRoom = () => {
        if (!localName.trim() || !roomCode.trim()) return;
        setPlayerName(localName);
        joinRoom(roomCode.toUpperCase());
        setShowJoinModal(false);
        setRoomCode('');
    };

    const handleJoinFromList = (roomId: string) => {
        if (!localName.trim()) {
            setShowJoinModal(true);
            setRoomCode(roomId);
            return;
        }
        setPlayerName(localName);
        joinRoom(roomId);
    };

    const copyRoomCode = () => {
        if (room) {
            navigator.clipboard.writeText(room.id);
        }
    };

    // Show waiting room if we're in a room but no remote player yet
    if (room && !remotePlayer) {
        return (
            <motion.div
                className={styles.lobbyContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className={styles.waitingRoom}>
                    <motion.div
                        className={styles.waitingIcon}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        ⏳
                    </motion.div>
                    <h2 className={styles.waitingTitle}>Aguardando oponente...</h2>
                    <div className={styles.roomCodeSection}>
                        <p className={styles.roomCodeLabel}>Código da sala:</p>
                        <div className={styles.roomCodeBox}>
                            <span className={styles.roomCode}>{room.id}</span>
                            <button
                                className={styles.copyBtn}
                                onClick={copyRoomCode}
                                title="Copiar código"
                            >
                                📋
                            </button>
                        </div>
                        <p className={styles.roomCodeHint}>
                            Compartilhe este código com seu amigo para ele entrar na sala
                        </p>
                    </div>
                    <button className={styles.cancelBtn} onClick={leaveRoom}>
                        Cancelar
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.lobbyContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
                className={styles.header}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <h1 className={styles.title}>🌐 Jogar Online</h1>
                <p className={styles.subtitle}>Jogue damas com jogadores de qualquer lugar</p>
            </motion.div>

            {/* Connection Status */}
            <div className={styles.statusBar}>
                <div className={`${styles.statusDot} ${styles[connectionStatus]}`} />
                <span className={styles.statusText}>
                    {connectionStatus === 'connected' && 'Conectado'}
                    {connectionStatus === 'connecting' && 'Conectando...'}
                    {connectionStatus === 'disconnected' && 'Desconectado'}
                    {connectionStatus === 'error' && 'Erro de conexão'}
                </span>
            </div>

            {error && (
                <motion.div
                    className={styles.errorBox}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    ⚠️ {error}
                </motion.div>
            )}

            {/* Player Name Input */}
            <div className={styles.nameSection}>
                <label className={styles.nameLabel}>Seu nome:</label>
                <input
                    type="text"
                    className={styles.nameInput}
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="Digite seu nome..."
                    maxLength={20}
                />
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
                <motion.button
                    className={`${styles.actionBtn} ${styles.createBtn}`}
                    onClick={() => setShowCreateModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={connectionStatus !== 'connected' || !localName.trim()}
                >
                    ➕ Criar Sala
                </motion.button>
                <motion.button
                    className={`${styles.actionBtn} ${styles.joinCodeBtn}`}
                    onClick={() => setShowJoinModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={connectionStatus !== 'connected' || !localName.trim()}
                >
                    🔑 Entrar com Código
                </motion.button>
            </div>

            {/* Available Rooms */}
            <div className={styles.roomsSection}>
                <h3 className={styles.roomsTitle}>Salas Disponíveis</h3>
                {rooms.length === 0 ? (
                    <div className={styles.emptyRooms}>
                        <span className={styles.emptyIcon}>🏠</span>
                        <p>Nenhuma sala disponível</p>
                        <p className={styles.emptyHint}>Crie uma sala e convide um amigo!</p>
                    </div>
                ) : (
                    <div className={styles.roomsList}>
                        {rooms.map((r: Room) => (
                            <motion.div
                                key={r.id}
                                className={styles.roomCard}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className={styles.roomInfo}>
                                    <span className={styles.roomName}>{r.name}</span>
                                    <span className={styles.roomHost}>Host: {r.hostName}</span>
                                </div>
                                <button
                                    className={styles.joinBtn}
                                    onClick={() => handleJoinFromList(r.id)}
                                    disabled={!localName.trim()}
                                >
                                    Entrar
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Back Button */}
            <motion.button
                className={styles.backBtn}
                onClick={() => {
                    disconnect();
                    onBack?.();
                }}
                whileHover={{ scale: 1.02 }}
            >
                ← Voltar ao Menu
            </motion.button>

            {/* Create Room Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className={styles.modalTitle}>Criar Nova Sala</h3>
                            <input
                                type="text"
                                className={styles.modalInput}
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="Nome da sala (opcional)"
                                maxLength={30}
                            />
                            <div className={styles.modalButtons}>
                                <button
                                    className={styles.modalCancelBtn}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={styles.modalConfirmBtn}
                                    onClick={handleCreateRoom}
                                >
                                    Criar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Join Room Modal */}
            <AnimatePresence>
                {showJoinModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowJoinModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className={styles.modalTitle}>Entrar na Sala</h3>
                            <input
                                type="text"
                                className={styles.modalInput}
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="Código da sala"
                                maxLength={6}
                            />
                            <div className={styles.modalButtons}>
                                <button
                                    className={styles.modalCancelBtn}
                                    onClick={() => setShowJoinModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={styles.modalConfirmBtn}
                                    onClick={handleJoinRoom}
                                    disabled={!roomCode.trim()}
                                >
                                    Entrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
