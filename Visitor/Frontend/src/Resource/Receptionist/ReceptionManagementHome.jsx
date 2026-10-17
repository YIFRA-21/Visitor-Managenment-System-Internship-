import React, { useState } from 'react';
import { LayoutDashboard, UserCheck, CheckCircle2, UserPlus, Clock, QrCode, Bell, Search, FileText, Activity, User } from 'lucide-react';
import ReceptionDashboard from './ReceptionDashboard';
import VisitorArrivalManagement from './VisitorArrivalManagement';
import AppointmentVerification from './AppointmentVerification';
import WalkInVisitorManagement from './WalkInVisitorManagement';
import VisitorQueueManagement from './VisitorQueueManagement';
import VisitorPassIssuance from './VisitorPassIssuance';
import HostNotificationView from './HostNotificationView';
import ReceptionSearchDirectory from './ReceptionSearchDirectory';
import ReceptionReportsView from './ReceptionReportsView';
import ReceptionActivityLogView from './ReceptionActivityLogView';
import ReceptionistProfileSettings from './ReceptionistProfileSettings';
import CheckInOutHistory from './CheckInOutHistory';
export default function ReceptionManagementHome({ initialTab = 'dashboard' }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'arrivals', label: 'Visitor Arrivals', icon: UserCheck },
        { id: 'verification', label: 'Verification', icon: CheckCircle2 },
        { id: 'walkins', label: 'Walk-in Registration', icon: UserPlus },
        { id: 'queue', label: 'Queue Monitor', icon: Clock },
        { id: 'passes', label: 'Pass Issuance', icon: QrCode },
        { id: 'notifications', label: 'Host Alerts', icon: Bell },
        { id: 'history', label: 'Check-In & Check-Out History', icon: Clock },
        { id: 'search', label: 'Directory Search', icon: Search },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'activity', label: 'Activity Log', icon: Activity },
        { id: 'profile', label: 'Profile & Settings', icon: User },
    ];
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <ReceptionDashboard onNavigate={(tab) => setActiveTab(tab)}/>;
            case 'arrivals':
                return <VisitorArrivalManagement onNavigate={(tab) => setActiveTab(tab)}/>;
            case 'verification':
                return <AppointmentVerification onNavigate={(tab) => setActiveTab(tab)}/>;
            case 'walkins':
                return <WalkInVisitorManagement onNavigate={(tab) => setActiveTab(tab)}/>;
            case 'queue':
                return <VisitorQueueManagement />;
            case 'passes':
                return <VisitorPassIssuance />;
            case 'notifications':
                return <HostNotificationView />;
            case 'history':
            case 'checkin_checkout_history':
                return <CheckInOutHistory initialTab="all" />;
            case 'search':
                return <ReceptionSearchDirectory />;
            case 'reports':
                return <ReceptionReportsView />;
            case 'activity':
                return <ReceptionActivityLogView />;
            case 'profile':
                return <ReceptionistProfileSettings />;
            default:
                return <ReceptionDashboard onNavigate={(tab) => setActiveTab(tab)}/>;
        }
    };
    return (<div className="min-h-screen bg-[#080d16] text-slate-100 font-sans flex flex-col">
      {renderTabContent()}
    </div>);
}
