import api from '../../../../../services/api';
import { mockCards, mockQuickActions, mockActivities, mockStatistics, mockSystemHealth, mockSearchOrganizations, mockSearchBranches, mockSearchDepartments, } from '../data/mockData';
// ── Mock mode toggle (set to false when backend is ready) ───────────────
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true;
/**
 * Generic fetch-with-mock-fallback helper.
 * When USE_MOCK is true, returns mock data with a simulated delay.
 * When false, calls the real API endpoint.
 */
async function fetchWithMock(endpoint, mockData) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return mockData;
    }
    const response = await api.get(endpoint);
    return response.data.data || response.data;
}
// ═══════════════════════════════════════════════════════════════════════════
// API METHODS — Organization Home Module 3.1
// ═══════════════════════════════════════════════════════════════════════════
/** GET /api/organization/home — Full dashboard data */
export async function getOrgHomeData() {
    return fetchWithMock('/organization/home', {
        summary: {
            totalOrganizations: 12,
            activeOrganizations: 10,
            totalBranches: 28,
            totalDepartments: 64,
            totalBuildings: 36,
            totalEmployees: 1240,
            activeUsers: 98,
            todayVisitors: 47,
            todayAppointments: 53,
        },
        cards: mockCards,
        quickActions: mockQuickActions,
        activities: mockActivities,
        systemHealth: mockSystemHealth,
    });
}
/** GET /api/organization/home/cards — Dashboard summary cards */
export async function getDashboardCards() {
    return fetchWithMock('/organization/home/cards', mockCards);
}
/** GET /api/organization/home/statistics — Statistics data for charts */
export async function getStatistics() {
    return fetchWithMock('/organization/home/statistics', mockStatistics);
}
/** GET /api/organization/home/activities — Recent activity timeline */
export async function getActivities(limit = 10) {
    return fetchWithMock(`/organization/home/activities?limit=${limit}`, mockActivities.slice(0, limit));
}
/** GET /api/organization/home/quick-actions — Available quick actions */
export async function getQuickActions() {
    return fetchWithMock('/organization/home/quick-actions', mockQuickActions);
}
/** GET /api/organization/home/search — Search organizations, branches, departments */
export async function searchOrgData(query, type) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const q = query.toLowerCase();
        let results = [];
        // Filter by type or search all
        if (!type || type === 'organization' || type === 'code') {
            results.push(...mockSearchOrganizations.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
        }
        if (!type || type === 'branch') {
            results.push(...mockSearchBranches.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
        }
        if (!type || type === 'department') {
            results.push(...mockSearchDepartments.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
        }
        return results;
    }
    const response = await api.get('/organization/home/search', {
        params: { query, type },
    });
    return response.data.data || response.data;
}
// ── Audit logging placeholder ───────────────────────────────────────────
export function logAuditEvent(event, details) {
    // Placeholder: In production, this will POST to /api/audit/log
    console.info(`[AUDIT] ${event}`, { ...details, timestamp: new Date().toISOString() });
}
