import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { authApi } from '../services/api';
const AuthContext = createContext(null);
// JWT decode helper (payload only, no verification)
function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    }
    catch {
        return null;
    }
}
// Session timeout: 5 minutes before JWT expiry, attempt refresh
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
export const BLOCKED_ACCOUNT_STATUSES = ['BLOCKED', 'SUSPENDED', 'DEACTIVATED', 'ARCHIVED', 'INACTIVE', 'LOCKED', 'DISABLED'];
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email !== 'developer@visitor.com') {
                    const statusUpper = String(parsed.accountStatus || parsed.status || '').toUpperCase();
                    if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        sessionStorage.removeItem('token');
                        return null;
                    }
                    return parsed;
                }
            }
            catch { }
        }
        return null;
    });
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (storedToken && storedToken !== 'mock-jwt-token-for-dev')
            return storedToken;
        return null;
    });
    const [loading, setLoading] = useState(true);
    const refreshTimerRef = useRef(null);
    // Persist helper based on rememberMe preference
    const getStorage = useCallback(() => {
        const remember = localStorage.getItem('rememberMe') === 'true';
        return remember ? localStorage : sessionStorage;
    }, []);
    const persistAuth = useCallback((newToken, userData, refreshToken) => {
        const storage = getStorage();
        storage.setItem('token', newToken);
        storage.setItem('user', JSON.stringify(userData));
        if (refreshToken) {
            storage.setItem('refreshToken', refreshToken);
        }
        // Also ensure the other storage is clean
        const altStorage = storage === localStorage ? sessionStorage : localStorage;
        altStorage.removeItem('token');
        altStorage.removeItem('user');
        altStorage.removeItem('refreshToken');
    }, [getStorage]);
    const clearAuth = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('remembered_identifier');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('login_identifier');
    }, []);
    // Schedule token refresh before expiry
    const scheduleRefresh = useCallback((currentToken) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }
        const payload = decodeJwtPayload(currentToken);
        if (!payload?.exp)
            return;
        const expiresAt = payload.exp * 1000;
        const refreshAt = expiresAt - REFRESH_BUFFER_MS;
        const delay = refreshAt - Date.now();
        if (delay > 0) {
            refreshTimerRef.current = setTimeout(async () => {
                const storedRefresh = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
                if (storedRefresh) {
                    try {
                        const res = await authApi.refreshToken(storedRefresh);
                        const { token: newToken, refreshToken: newRefresh } = res.data;
                        persistAuth(newToken, user, newRefresh);
                        setToken(newToken);
                        scheduleRefresh(newToken);
                    }
                    catch {
                        // Refresh failed — force logout
                        clearAuth();
                        setToken(null);
                        setUser(null);
                    }
                }
            }, delay);
        }
    }, [user, persistAuth, clearAuth]);
    // Verify session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (storedToken && storedToken !== 'mock-jwt-token-for-dev') {
            authApi
                .me()
                .then((res) => {
                const statusUpper = String(res.data.accountStatus || res.data.status || '').toUpperCase();
                if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
                    clearAuth();
                    setToken(null);
                    setUser(null);
                    return;
                }
                const isChangeRequired = Boolean(res.data.firstLoginRequired ||
                    res.data.passwordChangeRequired ||
                    res.data.mustChangePassword ||
                    res.data.user?.firstLoginRequired ||
                    res.data.user?.passwordChangeRequired);
                const combinedUser = {
                    ...res.data,
                    firstLoginRequired: isChangeRequired,
                    passwordChangeRequired: isChangeRequired,
                };
                persistAuth(storedToken, combinedUser);
                setUser(combinedUser);
                scheduleRefresh(storedToken);
            })
                .catch(() => {
                clearAuth();
                setToken(null);
                setUser(null);
            })
                .finally(() => setLoading(false));
            return;
        }
        if (token) {
            authApi
                .me()
                .then((res) => {
                const statusUpper = String(res.data.accountStatus || res.data.status || '').toUpperCase();
                if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
                    clearAuth();
                    setToken(null);
                    setUser(null);
                    return;
                }
                const isChangeRequired = Boolean(res.data.firstLoginRequired ||
                    res.data.passwordChangeRequired ||
                    res.data.mustChangePassword ||
                    res.data.user?.firstLoginRequired ||
                    res.data.user?.passwordChangeRequired);
                const combinedUser = {
                    ...res.data,
                    passwordChangeRequired: isChangeRequired,
                    firstLoginRequired: isChangeRequired,
                };
                persistAuth(token, combinedUser);
                setUser(combinedUser);
                scheduleRefresh(token);
            })
                .catch(() => {
                clearAuth();
                setToken(null);
                setUser(null);
            })
                .finally(() => setLoading(false));
        }
        else {
            setLoading(false);
        }
        // cleanup timer on unmount
        return () => {
            if (refreshTimerRef.current)
                clearTimeout(refreshTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const login = async (email, password, rememberMe = false) => {
        // Store preference first so persistAuth uses the right storage
        localStorage.setItem('rememberMe', String(rememberMe));
        const res = await authApi.login(email, password);
        const { token: newToken, refreshToken: newRefresh, user: newUser, identity, firstLoginRequired, passwordChangeRequired, mustChangePassword, } = res.data;
        const statusUpper = String(newUser?.accountStatus || newUser?.status || res.data?.accountStatus || res.data?.status || '').toUpperCase();
        if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
            clearAuth();
            setToken(null);
            setUser(null);
            const err = new Error('This user is blocked. Please call the admin.');
            err.code = 'ACCOUNT_BLOCKED';
            err.isBlocked = true;
            throw err;
        }
        const isChangeRequired = Boolean(firstLoginRequired ||
            passwordChangeRequired ||
            mustChangePassword ||
            newUser?.firstLoginRequired ||
            newUser?.passwordChangeRequired ||
            newUser?.mustChangePassword);
        const combinedUser = {
            ...newUser,
            firstLoginRequired: isChangeRequired,
            passwordChangeRequired: isChangeRequired,
            identity,
        };
        persistAuth(newToken, combinedUser, newRefresh);
        setToken(newToken);
        setUser(combinedUser);
        scheduleRefresh(newToken);
        return { passwordChangeRequired: isChangeRequired };
    };
    const completePasswordChange = async (currentPassword, newPassword) => {
        const res = await authApi.changePassword(currentPassword, newPassword);
        const session = res.data?.session || res.data?.data?.session;
        if (session) {
            const { token: newToken, refreshToken: newRefresh, user: sessionUser, identity: sessionIdentity } = session;
            const combinedUser = {
                ...(sessionUser || user),
                firstLoginRequired: false,
                passwordChangeRequired: false,
                identity: sessionIdentity || user?.identity,
            };
            persistAuth(newToken, combinedUser, newRefresh);
            setToken(newToken);
            setUser(combinedUser);
            scheduleRefresh(newToken);
        }
        else {
            // No fresh session returned — clear the flag and let the user continue
            const storage = getStorage();
            const storedUser = storage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.firstLoginRequired = false;
                parsed.passwordChangeRequired = false;
                storage.setItem('user', JSON.stringify(parsed));
            }
            setUser((prev) => (prev ? { ...prev, firstLoginRequired: false, passwordChangeRequired: false } : prev));
        }
    };
    const logout = () => {
        const storedRefresh = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        // Fire and forget server-side logout
        authApi.logout(storedRefresh || undefined).catch(() => { });
        if (refreshTimerRef.current)
            clearTimeout(refreshTimerRef.current);
        clearAuth();
        setToken(null);
        setUser(null);
    };
    const updateUser = (fields) => {
        setUser((prev) => {
            if (!prev)
                return null;
            const updated = { ...prev, ...fields };
            const storage = getStorage();
            storage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };
    const refreshSession = async () => {
        const storedRefresh = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        if (!storedRefresh)
            return false;
        try {
            const res = await authApi.refreshToken(storedRefresh);
            const { token: newToken, refreshToken: newRefresh } = res.data;
            persistAuth(newToken, user, newRefresh);
            setToken(newToken);
            scheduleRefresh(newToken);
            return true;
        }
        catch {
            return false;
        }
    };
    const isSessionExpired = () => {
        if (!token)
            return true;
        const payload = decodeJwtPayload(token);
        if (!payload?.exp)
            return true;
        return Date.now() >= payload.exp * 1000;
    };
    const hasPermission = (permissionCode) => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        if (user.role?.toLowerCase() === 'admin')
            return true;
        if (!user.identity?.permissions)
            return false;
        return user.identity.permissions.some((p) => p.code.toLowerCase() === permissionCode.toLowerCase());
    };
    const hasRole = (roleCode) => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        const userRole = user.role?.toLowerCase();
        const reqRole = roleCode.toLowerCase();
        if (reqRole === 'visitor') {
            return userRole === 'visitor';
        }
        if (reqRole === 'admin') {
            return userRole === 'admin';
        }
        if (reqRole === 'employee' || reqRole === 'staff') {
            return userRole === 'employee' || userRole === 'staff' || userRole === 'admin';
        }
        if (reqRole === 'manager' || reqRole === 'department_manager') {
            return userRole === 'manager' || userRole === 'department_manager' || userRole?.includes('manager') || userRole === 'admin';
        }
        if (reqRole === 'receptionist' || reqRole === 'reception') {
            return userRole === 'receptionist' || userRole === 'admin';
        }
        if (reqRole === 'security' || reqRole === 'security_officer') {
            return userRole === 'security_officer' || userRole === 'security' || userRole === 'admin';
        }
        if (userRole === 'admin')
            return true;
        if (userRole === reqRole)
            return true;
        if (!user.identity?.roles)
            return false;
        return user.identity.roles.some((r) => r.code.toLowerCase() === reqRole);
    };
    const sessionExpiresAt = useMemo(() => {
        if (!token)
            return null;
        const payload = decodeJwtPayload(token);
        return payload?.exp ? payload.exp * 1000 : null;
    }, [token]);
    const hasResource = (routeUrl) => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        if (user.role === 'admin')
            return true;
        if (!user.identity?.resources)
            return false;
        return user.identity.resources.some((r) => r.routeUrl.toLowerCase() === routeUrl.toLowerCase());
    };
    const getMenuItems = () => {
        if (!user?.identity?.resources)
            return [];
        return [...user.identity.resources].sort((a, b) => {
            if (a.menuGroup !== b.menuGroup) {
                return a.menuGroup.localeCompare(b.menuGroup);
            }
            return (a.displayOrder || 0) - (b.displayOrder || 0);
        });
    };
    return (<AuthContext.Provider value={{
            user,
            token,
            sessionExpiresAt,
            login,
            logout,
            updateUser,
            hasPermission,
            hasRole,
            hasResource,
            getMenuItems,
            refreshSession,
            isSessionExpired,
            completePasswordChange,
            loading,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
