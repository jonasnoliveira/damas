'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStore } from '@/store/onlineStore';
import styles from './Chat.module.css';

interface ChatMessage {
    id: string;
    sender: string;
    senderId: string;
    text: string;
    timestamp: number;
    isLocal: boolean;
}

export function Chat() {
    const [message, setMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        chatMessages,
        sendChatMessage,
        localPlayer,
        connectionStatus
    } = useOnlineStore();

    // Scroll to bottom when new message arrives
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUnreadCount(0);
        }
    }, [chatMessages, isOpen]);

    // Count unread messages when chat is closed
    useEffect(() => {
        if (!isOpen && chatMessages.length > 0) {
            const lastMessage = chatMessages[chatMessages.length - 1];
            if (!lastMessage.isLocal) {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [chatMessages, isOpen]);

    const handleSend = () => {
        if (!message.trim() || connectionStatus !== 'connected') return;
        sendChatMessage(message.trim());
        setMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={styles.chatContainer}>
            {/* Chat Toggle Button */}
            <motion.button
                className={styles.chatToggle}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setUnreadCount(0);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                💬
                {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.chatWindow}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={styles.chatHeader}>
                            <span>💬 Chat</span>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.messagesContainer}>
                            {chatMessages.length === 0 ? (
                                <div className={styles.emptyChat}>
                                    <span>Nenhuma mensagem ainda</span>
                                    <span className={styles.emptyHint}>
                                        Diga olá para seu oponente! 👋
                                    </span>
                                </div>
                            ) : (
                                chatMessages.map((msg: ChatMessage) => (
                                    <motion.div
                                        key={msg.id}
                                        className={`${styles.message} ${msg.isLocal ? styles.messageLocal : styles.messageRemote}`}
                                        initial={{ opacity: 0, x: msg.isLocal ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div className={styles.messageSender}>
                                            {msg.isLocal ? 'Você' : msg.sender}
                                        </div>
                                        <div className={styles.messageText}>{msg.text}</div>
                                        <div className={styles.messageTime}>
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className={styles.inputContainer}>
                            <input
                                type="text"
                                className={styles.chatInput}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite uma mensagem..."
                                maxLength={200}
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={handleSend}
                                disabled={!message.trim()}
                            >
                                ➤
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
