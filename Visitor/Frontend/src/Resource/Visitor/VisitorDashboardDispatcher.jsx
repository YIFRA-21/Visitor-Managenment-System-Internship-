import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VisitorDashboard from './VisitorDashboard';
import EnterpriseVisitorDashboard from '../Admin/VisitorManagement/EnterpriseVisitorDashboard';
export default function VisitorDashboardDispatcher() {
    const { user } = useAuth();
    if (user?.role === 'visitor') {
        return <VisitorDashboard />;
    }
    return <EnterpriseVisitorDashboard />;
}
