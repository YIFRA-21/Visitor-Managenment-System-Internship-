import React, { useState } from 'react';
import { Bell, Globe, CheckCircle2, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import ToggleSwitch from '../../components/common/ToggleSwitch';

export default function EmployeeSettings() {
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [settings, setSettings] = useState({
        theme: 'dark',
        language: 'English',
        timezone: 'UTC-05:00 (Eastern Time)',
        emailAlerts: true,
        smsAlerts: false,
        desktopAlerts: true,
        autoApproveVIP: false,
        escortRequired: true,
    });
    const handleSaveSettings = (e) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setMessage(t('msg.preferencesUpdated', 'Workspace preferences updated successfully!'));
            setTimeout(() => setMessage(null), 3000);
        }, 500);
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('employee.settingsTitle', 'Host Workspace Settings')}</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">{t('employee.settingsDesc', 'Configure your personal host notifications, theme preferences, and privacy rules.')}</p>
        </div>

        <button onClick={handleSaveSettings} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95">
          <Save className="h-4 w-4"/>
          <span>{saving ? t('form.loading', 'Saving...') : t('btn.saveSettings', 'Save Settings')}</span>
        </button>
      </div>

      {/* Success Message Banner */}
      {message && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-3 text-xs font-bold">
          <CheckCircle2 className="h-5 w-5"/>
          <span>{message}</span>
        </div>)}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Notification Preferences */}
        <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-850 pb-3">
            <Bell className="h-5 w-5 text-indigo-400"/>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">{t('notification.alerts', 'Notification Alerts')}</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div 
              onClick={() => setSettings(s => ({ ...s, emailAlerts: !s.emailAlerts }))}
              className="flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div>
                <span className="text-white font-bold block">{t('notification.emailNotif', 'Email Notifications')}</span>
                <span className="text-slate-400 text-[10px]">{t('notification.emailNotifHostDesc', 'Receive email when visitors request appointments')}</span>
              </div>
              <ToggleSwitch
                checked={settings.emailAlerts}
                onChange={(checked) => setSettings(s => ({ ...s, emailAlerts: checked }))}
                color="indigo"
              />
            </div>

            <div 
              onClick={() => setSettings(s => ({ ...s, desktopAlerts: !s.desktopAlerts }))}
              className="flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div>
                <span className="text-white font-bold block">{t('notification.desktopPush', 'Desktop Push Notifications')}</span>
                <span className="text-slate-400 text-[10px]">{t('notification.desktopPushHostDesc', 'Instant alert when guest arrives at lobby kiosk')}</span>
              </div>
              <ToggleSwitch
                checked={settings.desktopAlerts}
                onChange={(checked) => setSettings(s => ({ ...s, desktopAlerts: checked }))}
                color="indigo"
              />
            </div>

            <div 
              onClick={() => setSettings(s => ({ ...s, smsAlerts: !s.smsAlerts }))}
              className="flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div>
                <span className="text-white font-bold block">{t('notification.smsMobileAlerts', 'SMS Mobile Alerts')}</span>
                <span className="text-slate-400 text-[10px]">{t('notification.smsMobileAlertsDesc', 'Send SMS for urgent guest check-ins')}</span>
              </div>
              <ToggleSwitch
                checked={settings.smsAlerts}
                onChange={(checked) => setSettings(s => ({ ...s, smsAlerts: checked }))}
                color="indigo"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Workspace & Regional Preferences */}
        <div className="bg-[#0a0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-850 pb-3">
            <Globe className="h-5 w-5 text-purple-400"/>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">{t('settings.regionalDisplay', 'Regional & Display')}</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold uppercase mb-1">{t('settings.language', 'Language')}</label>
              <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                <option value="English">English (US)</option>
                <option value="French">Français</option>
                <option value="Spanish">Español</option>
                <option value="German">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase mb-1">{t('settings.timezone', 'Timezone')}</label>
              <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                <option value="UTC+00:00 (London)">UTC+00:00 (London GMT)</option>
                <option value="UTC+03:00 (Riyadh/East Africa)">UTC+03:00 (Riyadh/East Africa)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
