import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { getOrgHomeData, getDashboardCards, getActivities, getQuickActions, getStatistics, searchOrgData, } from '../services/orgHomeService';
import { mockSystemHealth, } from '../data/mockData';
/**
 * Custom hook for the Organization Management Home page.
 * Manages all data fetching, search state, permission checks, and loading/error states.
 */
export function useOrgHome() {
    const { user, hasPermission: checkPermission } = useAuth();
    const [data, setData] = useState(null);
    const [cards, setCards] = useState([]);
    const [activities, setActivities] = useState([]);
    const [quickActions, setQuickActions] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [systemHealth] = useState(mockSystemHealth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    // Debounce ref for search
    const searchDebounceRef = useRef(null);
    const isSystemAdmin = user?.role === 'admin';
    // ── Load all dashboard data ─────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!isSystemAdmin) {
            setError('Access denied. Only System Administrators can access this page.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [homeData, dashCards, acts, actions, stats] = await Promise.all([
                getOrgHomeData(),
                getDashboardCards(),
                getActivities(8),
                getQuickActions(),
                getStatistics(),
            ]);
            setData(homeData);
            setCards(dashCards);
            setActivities(acts);
            setQuickActions(actions);
            setStatistics(stats);
            // Audit log placeholder: page accessed
            console.info('[AUDIT] Organization Management Home accessed', { userId: user?.id, timestamp: new Date().toISOString() });
        }
        catch (err) {
            setError(err?.message || 'Failed to load organization home data. Please try again.');
            console.error('[ERROR] Failed to load org home data:', err);
        }
        finally {
            setLoading(false);
        }
    }, [isSystemAdmin, user?.id]);
    useEffect(() => {
        loadData();
    }, [loadData]);
    // ── Permission check ────────────────────────────────────────────────
    const hasPermission = useCallback((permission) => {
        return checkPermission(permission);
    }, [checkPermission]);
    // ── Search handler with debounce ────────────────────────────────────
    const handleSearch = useCallback(async (query, type) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        // Clear previous debounce
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        setSearchLoading(true);
        // Debounce search by 300ms
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const results = await searchOrgData(query.trim(), type !== 'all' ? type : undefined);
                setSearchResults(results);
                // Audit log placeholder: search performed
                console.info('[AUDIT] Organization search performed', { query, type, resultCount: results.length, userId: user?.id });
            }
            catch (err) {
                console.error('[ERROR] Search failed:', err);
                setSearchResults([]);
            }
            finally {
                setSearchLoading(false);
            }
        }, 300);
    }, [user?.id]);
    const handleSearchReset = useCallback(() => {
        setSearchQuery('');
        setSearchType('all');
        setSearchResults(null);
        setSearchLoading(false);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
    }, []);
    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, []);
    return {
        data,
        cards,
        activities,
        quickActions,
        statistics,
        systemHealth,
        loading,
        error,
        hasPermission,
        isSystemAdmin,
        refresh: loadData,
        searchQuery,
        searchType,
        searchResults,
        searchLoading,
        setSearchQuery,
        setSearchType,
        handleSearch,
        handleSearchReset,
    };
}
