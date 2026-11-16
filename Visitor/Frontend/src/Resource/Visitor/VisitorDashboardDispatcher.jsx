import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole } from '../../config/routes';
import VisitorDashboard from './VisitorDashboard';
import SecurityDashboard from '../Security/SecurityDashboard';
import EmployeeDashboard from '../Employee/EmployeeDashboard';
import ManagerDashboard from '../Manager/ManagerDashboard';
import ReceptionDashboard from '../Receptionist/ReceptionDashboard';
import AdminDashboard from '../Admin/AdminDashboard';

export default function VisitorDashboardDispatcher() {
    const { user } = useAuth();
    const role = normalizeRole(user);
    switch (role) {
        case 'admin':
            return <AdminDashboard />;
        case 'security':
            return <SecurityDashboard />;
        case 'employee':
            return <EmployeeDashboard />;
        case 'manager':
            return <ManagerDashboard />;
        case 'receptionist':
            return <ReceptionDashboard />;
        case 'visitor':
        default:
            return <VisitorDashboard />;
    }
}
