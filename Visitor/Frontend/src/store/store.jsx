/**
 * Redux Toolkit Store Configuration
 * ──────────────────────────────────
 * Central state management for the Enterprise VMS frontend.
 */
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
export const store = configureStore({
    reducer: {
        notifications: notificationReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // Ignore non-serializable values in notification timestamps
            ignoredPaths: ['notifications.items'],
        },
    }),
    devTools: import.meta.env.DEV,
});
// Typed hooks for use throughout the app
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
