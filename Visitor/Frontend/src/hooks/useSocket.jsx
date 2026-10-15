/**
 * useSocket Hook
 * ───────────────
 * Manages Socket.io connection with auto-reconnect,
 * role/user room joining, and real-time notification dispatch.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch } from '../store/store';
import { addNotification } from '../store/slices/notificationSlice';
import { getSocketUrl } from '../utils/apiUrl';
const SOCKET_URL = getSocketUrl();
export function useSocket() {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const socketRef = useRef(null);
    useEffect(() => {
        if (!user)
            return;
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });
        socketRef.current = socket;
        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            // Authenticate and join rooms
            socket.emit('authenticate', {
                userId: user.id,
                role: user.role,
                orgId: user.organization_id || 1,
                email: user.email || ''
            });
            // Join role-based room
            socket.emit('join-role', user.role);
            // Join personal room
            socket.emit('join-user', user.id);
        });
        // Listen for real-time notifications
        const handleNotif = (data) => {
            if (data) {
                dispatch(addNotification(data));
                window.dispatchEvent(new CustomEvent('vms-socket-notification', { detail: data }));
            }
        };
        socket.on('notification', handleNotif);
        socket.on('new_notification', handleNotif);
        socket.on('live_notification', handleNotif);

        // Listen for real-time chat messages to update unread badge counts
        const handleChatMessageEvent = (data) => {
            window.dispatchEvent(new CustomEvent('vms-chat-unread-updated', { detail: data }));
            window.dispatchEvent(new CustomEvent('vms-socket-chat-message', { detail: data }));
        };
        socket.on('chat_message', handleChatMessageEvent);
        socket.on('new_chat_message', handleChatMessageEvent);
        socket.on('chat_unread_count', handleChatMessageEvent);
        socket.on('chat_unread_updated', handleChatMessageEvent);
        // Listen for live board updates (reception/security)
        socket.on('liveboard-update', (data) => {
            // Dispatch to appropriate slice when implemented
            console.log('[Socket] Liveboard update:', data);
        });
        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });
        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });
        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, dispatch]);
    const emit = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);
    return {
        socket: socketRef.current,
        connected: socketRef.current?.connected ?? false,
        emit,
    };
}
