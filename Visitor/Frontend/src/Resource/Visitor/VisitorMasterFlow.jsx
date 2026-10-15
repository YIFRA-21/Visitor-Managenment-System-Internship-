import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, PlusCircle, CheckCircle2, Shield, QrCode, Bell, Mail, MessageSquare, History, FileText, User, HelpCircle, LogOut, FileCheck, CheckCircle, X } from 'lucide-react';
// Subcomponents & Views
import RegistrationComplete from './components/RegistrationComplete';
import VisitorDashboard from './VisitorDashboard';
import NewAppointmentForm from './components/NewAppointmentForm';
import VisitorAppointments from './VisitorAppointments';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import VisitorPass from './VisitorPass';
import QRCodeVerification from './components/QRCodeVerification';
import VisitorNotifications from './VisitorNotifications';
import EmailNotificationPreview from './components/EmailNotificationPreview';
import SystemChat from './components/SystemChat';
import VisitHistory from './VisitHistory';
import VisitorDocumentManagement from '../Admin/VisitorManagement/Documents/VisitorDocumentManagement';
import VisitorProfile from './VisitorProfile';
import VisitorSupport from './VisitorSupport';
import VisitorLogout from './components/VisitorLogout';
const FLOW_STEPS = [
    { key: 'registration-complete', label: '1. Registration', num: 1, icon: <CheckCircle2 className="h-3.5 w-3.5"/> },
    { key: 'dashboard', label: '2. Dashboard', num: 2, icon: <LayoutDashboard className="h-3.5 w-3.5"/> },
    { key: 'new-appointment', label: '3. New Appt', num: 3, icon: <PlusCircle className="h-3.5 w-3.5"/> },
    { key: 'my-appointments', label: '4. Appointments', num: 4, icon: <Calendar className="h-3.5 w-3.5"/> },
    { key: 'appointment-details', label: '5. Appt Details', num: 5, icon: <FileCheck className="h-3.5 w-3.5"/> },
    { key: 'visitor-pass', label: '6. Visitor Pass', num: 6, icon: <Shield className="h-3.5 w-3.5"/> },
    { key: 'qr-code', label: '7. QR Verification', num: 7, icon: <QrCode className="h-3.5 w-3.5"/> },
    { key: 'notifications', label: '8. Notifications', num: 8, icon: <Bell className="h-3.5 w-3.5"/> },
    { key: 'email-notification', label: '9. Email Sample', num: 9, icon: <Mail className="h-3.5 w-3.5"/> },
    { key: 'system-chat', label: '10. System Chat', num: 10, icon: <MessageSquare className="h-3.5 w-3.5"/> },
    { key: 'visit-history', label: '11. Visit History', num: 11, icon: <History className="h-3.5 w-3.5"/> },
    { key: 'documents', label: '12. Documents', num: 12, icon: <FileText className="h-3.5 w-3.5"/> },
    { key: 'profile-settings', label: '13. Profile', num: 13, icon: <User className="h-3.5 w-3.5"/> },
    { key: 'help-support', label: '14. Support', num: 14, icon: <HelpCircle className="h-3.5 w-3.5"/> },
    { key: 'logout', label: '15. Logout', num: 15, icon: <LogOut className="h-3.5 w-3.5"/> }
];
export default function VisitorMasterFlow() {
    const [activeScreen, setActiveScreen] = useState('dashboard');
    const [toast, setToast] = useState(null);
    // Auto-dismiss toast after 4 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'registration-complete':
                return <RegistrationComplete onGoToDashboard={() => setActiveScreen('dashboard')}/>;
            case 'new-appointment':
                return (<NewAppointmentForm onSubmit={(data) => {
                        setToast({ message: 'Appointment request submitted successfully! Your booking is now pending approval.', type: 'success' });
                        setActiveScreen('my-appointments');
                    }} onCancel={() => setActiveScreen('dashboard')}/>);
            case 'my-appointments':
                return <VisitorAppointments />;
            case 'appointment-details':
                return <AppointmentDetailsModal onClose={() => setActiveScreen('my-appointments')}/>;
            case 'visitor-pass':
                return <VisitorPass onOpenQRScanner={() => setActiveScreen('qr-code')}/>;
            case 'qr-code':
                return (<QRCodeVerification onRefresh={() => setToast({ message: 'QR Code refreshed successfully!', type: 'success' })} onDownload={() => setToast({ message: 'Downloading QR Code image...', type: 'info' })}/>);
            case 'notifications':
                return <VisitorNotifications />;
            case 'email-notification':
                return <EmailNotificationPreview onGoToDashboard={() => setActiveScreen('dashboard')}/>;
            case 'system-chat':
                return <SystemChat onBack={() => setActiveScreen('dashboard')}/>;
            case 'visit-history':
                return <VisitHistory />;
            case 'documents':
                return <VisitorDocumentManagement />;
            case 'profile-settings':
                return <VisitorProfile />;
            case 'help-support':
                return <VisitorSupport />;
            case 'logout':
                return <VisitorLogout onGoToLogin={() => setActiveScreen('dashboard')}/>;
            case 'dashboard':
            default:
                return <VisitorDashboard />;
        }
    };
    return (<div className="space-y-6 min-h-screen bg-[#090d16] text-white p-4 lg:p-6 font-sans">
      {/* Top Header & Flow Selector Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="d-flex justify-content-between align-items-center border-bottom border-slate-800 pb-3">
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight d-flex align-items-center gap-2 mb-0">
              <Shield className="text-emerald-400 h-5 w-5"/> VISITOR ROLE – COMPLETE FLOW (ALL 15 PAGES)
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mb-0 mt-0.5">
              Interactive navigation console. Click any pill button to preview the full design specification screen.
            </p>
          </div>
          <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
            15 Screens Active
          </span>
        </div>

        {/* Horizontal Scrollable Pill Navigation Bar */}
        <div className="d-flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {FLOW_STEPS.map((step) => {
            const isActive = activeScreen === step.key;
            return (<button key={step.key} onClick={() => setActiveScreen(step.key)} className={`btn btn-xs whitespace-nowrap px-3 py-1.5 rounded-xl border transition-all duration-150 d-flex align-items-center gap-1.5 ${isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 font-extrabold'
                    : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white'}`}>
                {step.icon}
                <span>{step.label}</span>
              </button>);
        })}
        </div>
      </div>

      {/* Screen Render Canvas */}
      <div className="py-2">
        {renderActiveScreen()}
      </div>

      {/* Toast Notification Card */}
      {toast && (<div className="fixed bottom-6 right-6 z-[99999] animate-slideUp">
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl min-w-[340px] max-w-md ${toast.type === 'info'
                ? 'bg-blue-950/90 border-blue-700/60 text-blue-100'
                : 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'info' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
              <CheckCircle className={`h-5 w-5 ${toast.type === 'info' ? 'text-blue-400' : 'text-emerald-400'}`}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-black tracking-wider opacity-70 mb-0.5">
                {toast.type === 'info' ? 'Information' : 'Success'}
              </p>
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>)}
    </div>);
}
