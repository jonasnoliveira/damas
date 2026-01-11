'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStore, ChatMessage } from '@/store/onlineStore';
import styles from './Chat.module.css';

// Quick emoji options
const QUICK_EMOJIS = ['👋', '😄', '😂', '🎉', '👍', '👏', '🔥', '😎', '🤔', '😅', '💪', '🏆'];

export function Chat() {
    const [message, setMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notification, setNotification] = useState<ChatMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevMessagesLength = useRef(0);

    const {
        chatMessages,
        sendChatMessage,
        connectionStatus
    } = useOnlineStore();

    // Scroll to bottom when new message arrives
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUnreadCount(0);
        }
    }, [chatMessages, isOpen]);

    // Show notification popup and count unread when chat is closed
    useEffect(() => {
        if (chatMessages.length > prevMessagesLength.current) {
            const lastMessage = chatMessages[chatMessages.length - 1];
            if (!lastMessage.isLocal) {
                if (!isOpen) {
                    setUnreadCount(prev => prev + 1);
                    setNotification(lastMessage);
                    setTimeout(() => {
                        setNotification(null);
                    }, 4000);
                }
            }
        }
        prevMessagesLength.current = chatMessages.length;
    }, [chatMessages, isOpen]);

    const handleSend = () => {
        if (!message.trim() || connectionStatus !== 'connected') return;
        sendChatMessage(message.trim());
        setMessage('');
        setShowEmojis(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiClick = (emoji: string) => {
        // Send emoji directly as a message
        if (connectionStatus === 'connected') {
            sendChatMessage(emoji);
        }
        setShowEmojis(false);
    };

    const addEmojiToMessage = (emoji: string) => {
        setMessage(prev => prev + emoji);
        inputRef.current?.focus();
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleNotificationClick = () => {
        setNotification(null);
        setIsOpen(true);
        setUnreadCount(0);
    };

    return (
        <div className={styles.chatContainer}>
            {/* Notification Popup */}
            <AnimatePresence>
                {notification && !isOpen && (
                    <motion.div
                        className={styles.notification}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        onClick={handleNotificationClick}
                    >
                        <div className={styles.notificationHeader}>
                            <span className={styles.notificationSender}>
                                💬 {notification.sender}
                            </span>
                        </div>
                        <div className={styles.notificationText}>
                            {notification.text}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Toggle Button */}
            <motion.button
                className={styles.chatToggle}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setUnreadCount(0);
                        setNotification(null);
                    }
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

                        {/* Quick Emoji Bar */}
                        <AnimatePresence>
                            {showEmojis && (
                                <motion.div
                                    className={styles.emojiBar}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <div className={styles.emojiGrid}>
                                        {QUICK_EMOJIS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                className={styles.emojiBtn}
                                                onClick={() => handleEmojiClick(emoji)}
                                                title="Enviar emoji"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.emojiHint}>
                                        Clique para enviar ou{' '}
                                        <button
                                            className={styles.emojiAddBtn}
                                            onClick={() => {
                                                if (QUICK_EMOJIS[0]) addEmojiToMessage(QUICK_EMOJIS[0]);
                                            }}
                                        >
                                            adicionar à mensagem
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={styles.inputContainer}>
                            <button
                                className={`${styles.emojiToggle} ${showEmojis ? styles.emojiToggleActive : ''}`}
                                onClick={() => setShowEmojis(!showEmojis)}
                                title="Emojis"
                            >
                                😊
                            </button>
                            <input
                                ref={inputRef}
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
