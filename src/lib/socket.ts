'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// In production, connect to an external WebSocket server
// In development, connect to the local server
const getSocketUrl = (): string => {
    // Check if running in browser
    if (typeof window === 'undefined') {
        return '';
    }

    // Use environment variable for production WebSocket server
    // This should be set to your Railway/Render/etc server URL
    const wsServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL;

    if (wsServerUrl) {
        return wsServerUrl;
    }

    // In development, connect to the same host
    return window.location.origin;
};

export const getSocket = (): Socket => {
    if (!socket) {
        const url = getSocketUrl();

        socket = io(url, {
            path: '/api/socketio',
            addTrailingSlash: false,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
