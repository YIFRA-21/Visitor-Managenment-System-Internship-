import { useState, useEffect } from 'react';
import { Settings, LayoutDashboard, Globe, Shield, Bell, Hash, RefreshCw, FileText, ToggleLeft, HardDriveDownload, ShieldCheck, History, Database, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import BackButton from '../../../../components/common/BackButton';
// Subcomponents
import SettingsDashboard from './components/SettingsDashboard';
import GeneralSettingsForm from './components/GeneralSettingsForm';
import VisitorPreferencesForm from './components/VisitorPreferencesForm';
import SecurityPreferencesForm from './components/SecurityPreferencesForm';
import NotificationPreferencesForm from './components/NotificationPreferencesForm';
import NumberingSettingsForm from './components/NumberingSettingsForm';
import IntegrationSettingsForm from './components/IntegrationSettingsForm';
import RetentionSettingsForm from './components/RetentionSettingsForm';
import FeatureTogglePanel from './components/FeatureTogglePanel';
import ImportExportPanel from './components/ImportExportPanel';
import ValidationReport from './components/ValidationReport';
import SettingsHistoryTable from './components/SettingsHistoryTable';
import BackupManager from './components/BackupManager';
const SIDEBAR_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4"/> },
    { key: 'general', label: 'General Settings', icon: <Settings className="h-4 w-4"/> },
    { key: 'localization', label: 'Localization', icon: <Globe className="h-4 w-4"/> },
    { key: 'visitor', label: 'Visitor Preferences', icon: <Shield className="h-4 w-4"/> },
    { key: 'security', label: 'Security Preferences', icon: <ShieldCheck className="h-4 w-4"/> },
    { key: 'notifications', label: 'Notifications Matrix', icon: <Bell className="h-4 w-4"/> },
    { key: 'numbering', label: 'Numbering Formats', icon: <Hash className="h-4 w-4"/> },
    { key: 'integrations', label: 'Integration Prefs', icon: <RefreshCw className="h-4 w-4"/> },
    { key: 'retention', label: 'Data Retention & GDPR', icon: <FileText className="h-4 w-4"/> },
    { key: 'features', label: 'Feature Toggles', icon: <ToggleLeft className="h-4 w-4"/> },
    { key: 'import-export', label: 'Import / Export JSON', icon: <HardDriveDownload className="h-4 w-4"/> },
    { key: 'validation', label: 'Validation Diagnostic', icon: <ShieldCheck className="h-4 w-4"/> },
    { key: 'history', label: 'Mutation History Log', icon: <History className="h-4 w-4"/> },
    { key: 'backups', label: 'Snapshots Backup', icon: <Database className="h-4 w-4"/> }
];
export default function OrgSettings() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backupsCount, setBackupsCount] = useState(0);
    const [historyCount, setHistoryCount] = useState(0);
    // Notification Toast alert state
    const [toast, setToast] = useState(null);
    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 5000);
    };
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
            const backups = await api.get('/settings/backups');
            setBackupsCount(backups.data?.length || 0);
            const history = await api.get('/settings/history');
            setHistoryCount(history.data?.length || 0);
        }
        catch (err) {
            console.error(err);
            showToast('Failed to load system settings configuration.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSettings();
    }, []);
    const handleSaveCategory = async (category, payload) => {
        setSaving(true);
        try {
            await api.put(`/settings/${category}`, payload);
            showToast(`${category.toUpperCase()} settings successfully saved.`, 'success');
            fetchSettings();
        }
        catch (err) {
            const msg = err.response?.data?.error || `Failed to update ${category} settings.`;
            showToast(msg, 'danger');
        }
        finally {
            setSaving(false);
        }
    };
    const renderActiveContent = () => {
        switch (activeTab) {
            case 'general':
            case 'localization':
                return (<GeneralSettingsForm initialData={settings?.general} onSave={(data) => handleSaveCategory('general', data)} isSaving={saving}/>);
            case 'visitor':
                return (<VisitorPreferencesForm initialData={settings?.visitor} onSave={(data) => handleSaveCategory('visitor', data)} isSaving={saving}/>);
            case 'security':
                return (<SecurityPreferencesForm initialData={settings?.security} onSave={(data) => handleSaveCategory('security', data)} isSaving={saving}/>);
            case 'notifications':
                return (<NotificationPreferencesForm initialData={settings} onSave={(data) => handleSaveCategory('notifications', data)} isSaving={saving}/>);
            case 'numbering':
                return (<NumberingSettingsForm initialData={settings?.numbering} onSave={(data) => handleSaveCategory('numbering', data)} isSaving={saving}/>);
            case 'integrations':
                return (<IntegrationSettingsForm initialData={settings?.integrations} onSave={(data) => handleSaveCategory('integrations', data)} isSaving={saving} onNotify={showToast}/>);
            case 'retention':
                return (<RetentionSettingsForm initialData={settings?.retention} onSave={(data) => handleSaveCategory('retention', data)} isSaving={saving}/>);
            case 'features':
                return (<FeatureTogglePanel initialData={settings} onSave={(data) => handleSaveCategory('features', data)} isSaving={saving}/>);
            case 'import-export':
                return <ImportExportPanel onNotify={showToast} onRefresh={fetchSettings}/>;
            case 'validation':
                return <ValidationReport onNotify={showToast}/>;
            case 'history':
                return <SettingsHistoryTable onNotify={showToast}/>;
            case 'backups':
                return <BackupManager onNotify={showToast} onRefresh={fetchSettings}/>;
            case 'dashboard':
            default:
                return (<SettingsDashboard settings={settings} onNavigate={(view) => setActiveTab(view)} backupsCount={backupsCount} historyCount={historyCount}/>);
        }
    };
    return (<div className="space-y-6">
      {/* Toast Alert Banner */}
      {toast && (<div className={`position-fixed bottom-0 end-0 m-4 z-50 p-3 rounded-lg border text-xs font-semibold shadow-lg d-flex align-items-center gap-2 ${toast.type === 'success' ? 'bg-success text-white border-success' : 'bg-danger text-white border-danger'}`} style={{ minWidth: '280px' }}>
          <AlertCircle className="h-4.5 w-4.5"/>
          <span>{toast.message}</span>
        </div>)}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton onClick={activeTab !== 'dashboard' ? () => setActiveTab('dashboard') : undefined} fallbackUrl="/admin/dashboard"/>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Settings className="text-blue-600 h-7 w-7"/> Organization Settings Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Centralized console to manage localizations, visitor guidelines, SMTP/SMS integrations, GDPR rules, backups, and feature flags.
            </p>
          </div>
        </div>
      </div>

      {loading ? (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-sm">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Loading settings metadata...</p>
        </div>) : (<div className="row g-4 align-items-start">
          {/* Sidebar Menu navigation */}
          <div className="col-12 col-lg-3">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-1.5 sticky top-4">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = activeTab === item.key;
                return (<button key={item.key} onClick={() => setActiveTab(item.key)} className={`w-100 text-start border-0 text-xs font-bold px-3 py-2.5 rounded-lg d-flex align-items-center gap-2.5 transition-all duration-150 ${isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-transparent text-slate-550 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-white'}`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </button>);
            })}
            </div>
          </div>

          {/* Active Settings Panel Context */}
          <div className="col-12 col-lg-9">
            {renderActiveContent()}
          </div>
        </div>)}
    </div>);
}
