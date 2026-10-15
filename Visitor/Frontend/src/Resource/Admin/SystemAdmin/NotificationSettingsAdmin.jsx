import React, { useState } from 'react';
import { Bell, Mail, CheckCircle2, Save } from 'lucide-react';
export default function NotificationSettingsAdmin() {
    const [toast, setToast] = useState('');
    const [settings, setSettings] = useState({
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        smtp_user: 'yetmul8@gmail.com',
        twilio_sid: 'AC_mock_twilio_account_sid_enterprise',
        push_enabled: true
    });
    const handleSave = () => {
        setToast('Notification Gateway Configurations Saved!');
        setTimeout(() => setToast(''), 3000);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bell className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notification Infrastructure Settings</h1>
            <p className="text-xs text-slate-400">Configure SMTP Mail, Twilio SMS Credentials, and Push Dispatch Gateways</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Mail className="h-4 w-4 text-indigo-400"/> SMTP Mail Gateway Config
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">SMTP Host</label>
            <input type="text" value={settings.smtp_host} onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
            <input type="text" value={settings.smtp_port} onChange={e => setSettings(s => ({ ...s, smtp_port: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Email</label>
            <input type="text" value={settings.smtp_user} onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <Save className="h-4 w-4"/> Save Gateways
          </button>
        </div>
      </div>
    </div>);
}
