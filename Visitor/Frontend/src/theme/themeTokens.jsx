/**
 * VMS Design System — Global Enterprise Theme Tokens
 * ──────────────────────────────────────────────────
 * Single Source of Truth for Enterprise Design System Tokens.
 */
export const themeTokens = {
    colors: {
        // Primary / Brand
        primary: '#4F46E5',
        primaryHover: '#4338CA',
        // Status / Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        // Themes
        light: {
            bg: '#F8FAFC',
            card: '#FFFFFF',
            cardSecondary: '#F1F5F9',
            sidebar: '#0F172A',
            navbar: '#FFFFFF',
            tableHeader: '#F8FAFC',
            border: '#E2E8F0',
            textPrimary: '#0F172A',
            textSecondary: '#475569',
            muted: '#64748B',
            hover: 'rgba(148, 163, 184, 0.15)',
        },
        dark: {
            bg: '#0F172A',
            card: '#1E293B',
            cardSecondary: '#273449',
            sidebar: '#111827',
            navbar: '#111827',
            tableHeader: '#1E293B',
            border: 'rgba(148, 163, 184, 0.18)',
            textPrimary: '#F8FAFC',
            textSecondary: '#CBD5E1',
            muted: '#94A3B8',
            hover: 'rgba(148, 163, 184, 0.25)',
        },
        // Action Button Colors (MANDATORY & UNCHANGEABLE)
        actions: {
            view: '#3B82F6', // Blue
            edit: '#F59E0B', // Amber
            add: '#4F46E5', // Indigo
            register: '#4F46E5', // Indigo
            save: '#10B981', // Green
            delete: '#EF4444', // Red
            refresh: '#64748B', // Slate
            reset: '#6B7280', // Gray
            search: '#8B5CF6', // Purple
            export: '#F97316', // Orange
            import: '#0EA5E9', // Sky Blue
            download: '#2563EB', // Blue
            upload: '#06B6D4', // Cyan
            print: '#71717A', // Zinc
            history: '#14B8A6', // Teal
            security: '#EAB308', // Yellow
            approve: '#10B981', // Green
            reject: '#F43F5E', // Rose
        },
    },
    animation: {
        hoverTransition: 'all 0.25s ease',
        hoverTransform: 'translateY(-2px)',
        hoverShadow: '0 10px 25px rgba(0, 0, 0, 0.18)',
    },
};
