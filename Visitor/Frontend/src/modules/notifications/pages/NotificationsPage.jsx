import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';
import UnifiedNotificationCenter from '../components/UnifiedNotificationCenter';
export default function NotificationsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const viewParam = searchParams.get('tab') || searchParams.get('view') || 'messages';
    const validTab = (['messages', 'system_chat', 'announcements', 'dashboard', 'settings'].includes(viewParam)
        ? viewParam
        : 'messages');
    return (<DashboardLayout>
      <div className="w-full">
        <UnifiedNotificationCenter initialTab={validTab} onNavigate={(targetView) => {
            if (targetView.startsWith('/')) {
                navigate(targetView);
            }
            else {
                navigate(`/dashboard?view=${targetView}`);
            }
        }}/>
      </div>
    </DashboardLayout>);
}
