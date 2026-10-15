import React from 'react';
import { useSearchParams } from 'react-router-dom';
import VisitorProfileDetails from '../Admin/VisitorManagement/Profiles/VisitorProfileDetails';
import { useAuth } from '../../contexts/AuthContext';
export default function VisitorProfile() {
    const { user } = useAuth();
    const [, setSearchParams] = useSearchParams();
    const handleBack = () => {
        setSearchParams({ view: 'dashboard' });
    };
    // Determine visitor ID from session/context or default fallback
    const getVisitorId = () => {
        try {
            const active = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
            if (active) {
                const parsed = JSON.parse(active);
                if (parsed.id)
                    return Number(parsed.id);
            }
        }
        catch (e) { }
        try {
            const reg = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
            if (reg) {
                const parsed = JSON.parse(reg);
                if (parsed.id)
                    return Number(parsed.id);
            }
        }
        catch (e) { }
        return user?.visitorId || user?.visitor_id || user?.id || 1;
    };
    return (<div className="w-full min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8">
      <VisitorProfileDetails visitorId={getVisitorId()} onBack={handleBack} isVisitorRole={true}/>
    </div>);
}
