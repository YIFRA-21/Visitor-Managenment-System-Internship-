/**
 * Notification Slice
 * ───────────────────
 * Redux state for in-app notifications with real-time updates.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsApi } from '../../services/api';
const initialState = {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
};
// Async thunks
export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const res = await notificationsApi.list();
        return res.data;
    }
    catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Failed to load notifications');
    }
});
export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
    try {
        await notificationsApi.markRead(id);
        return id;
    }
    catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Failed to mark as read');
    }
});
export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
    try {
        await notificationsApi.markAllRead();
        return true;
    }
    catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Failed to mark all as read');
    }
});
const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        // Real-time notification received via Socket.io
        addNotification(state, action) {
            state.items.unshift(action.payload);
            if (!action.payload.is_read) {
                state.unreadCount += 1;
            }
        },
        clearNotifications(state) {
            state.items = [];
            state.unreadCount = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
            state.loading = false;
            const items = Array.isArray(action.payload) ? action.payload : (action.payload?.notifications || []);
            const unread = action.payload?.counts?.unread !== undefined ? Number(action.payload.counts.unread) : items.filter((n) => !n.is_read).length;
            state.items = items;
            state.unreadCount = unread;
        })
            .addCase(fetchNotifications.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(markAsRead.fulfilled, (state, action) => {
            const item = state.items.find((n) => n.id === action.payload);
            if (item && !item.is_read) {
                item.is_read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        })
            .addCase(markAllAsRead.fulfilled, (state) => {
            state.items.forEach((n) => { n.is_read = true; });
            state.unreadCount = 0;
        });
    },
});
export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
