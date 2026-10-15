import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
/**
 * Hook to check if current user has a specific role.
 */
export function useRole(roleCode) {
    const { hasRole } = useAuth();
    return useMemo(() => hasRole(roleCode), [hasRole, roleCode]);
}
/**
 * Multi-role check with 'any' or 'all' mode.
 */
export function useRoles(codes, mode = 'any') {
    const { hasRole } = useAuth();
    return useMemo(() => {
        if (mode === 'all') {
            return codes.every((code) => hasRole(code));
        }
        return codes.some((code) => hasRole(code));
    }, [hasRole, codes, mode]);
}
export default useRole;
