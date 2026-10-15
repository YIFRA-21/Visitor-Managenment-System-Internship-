/**
 * UI Slice
 * ─────────
 * Global UI state — sidebar, modals, toasts, theme.
 */
import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    sidebarOpen: true,
    sidebarCollapsed: false,
    activeModal: null,
    modalData: null,
    toasts: [],
    globalLoading: false,
};
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar(state) {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen(state, action) {
            state.sidebarOpen = action.payload;
        },
        toggleSidebarCollapse(state) {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        openModal(state, action) {
            state.activeModal = action.payload.name;
            state.modalData = action.payload.data || null;
        },
        closeModal(state) {
            state.activeModal = null;
            state.modalData = null;
        },
        addToast(state, action) {
            state.toasts.push({
                ...action.payload,
                id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            });
        },
        removeToast(state, action) {
            state.toasts = state.toasts.filter((t) => t.id !== action.payload);
        },
        clearToasts(state) {
            state.toasts = [];
        },
        setGlobalLoading(state, action) {
            state.globalLoading = action.payload;
        },
    },
});
export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapse, openModal, closeModal, addToast, removeToast, clearToasts, setGlobalLoading, } = uiSlice.actions;
export default uiSlice.reducer;
