import React, { useState } from 'react';
import { Sliders, Save } from 'lucide-react';
export default function EnterpriseNotificationSettingsView() {
    const [settings, setSettings] = useState({
        defaultSenderEmail: 'notifications@vms-enterprise.com',
        defaultSenderName: 'Enterprise VMS Notification Hub',
        defaultReplyToEmail: 'support@vms-enterprise.com',
        defaultPriority: 'normal',
        defaultLanguage: 'en',
        timeZone: 'UTC+03:00',
        retentionPolicyDays: 90,
        archivePolicyDays: 180,
        retryMax: 3,
        initialBackoffMs: 1000
    });
    const [saved, setSaved] = useState(false);
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-blue-400"/>
            <span>Centralized Enterprise Notification Configuration (§1)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Manage system-wide defaults, sender addresses, retry policies, and retention schedules.</p>
        </div>

        <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/20">
          <Save className="h-4 w-4"/>
          <span>{saved ? 'Saved Successfully!' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Sender Information */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-bold uppercase text-[11px] text-blue-400">1. Default Sender & Reply-To Routing</h4>
          <div>
            <label className="text-slate-400 block mb-1">Default Sender Name</label>
            <input type="text" value={settings.defaultSenderName} onChange={e => setSettings({ ...settings, defaultSenderName: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"/>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Default Sender Email Address</label>
            <input type="email" value={settings.defaultSenderEmail} onChange={e => setSettings({ ...settings, defaultSenderEmail: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Default Reply-To Address</label>
            <input type="email" value={settings.defaultReplyToEmail} onChange={e => setSettings({ ...settings, defaultReplyToEmail: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
        </div>

        {/* Global Locale & Time Zone */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-bold uppercase text-[11px] text-purple-400">2. System Defaults & Timezone</h4>
          <div>
            <label className="text-slate-400 block mb-1">Default Platform Language</label>
            <select value={settings.defaultLanguage} onChange={e => setSettings({ ...settings, defaultLanguage: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold">
              <option value="en">English (US)</option>
              <option value="am">Amharic (አማርኛ)</option>
              <option value="om">Afaan Oromo</option>
              <option value="ti">Tigrinya (ትግርኛ)</option>
              <option value="so">Somali (Soomaali)</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">System Default Timezone</label>
            <input type="text" value={settings.timeZone} onChange={e => setSettings({ ...settings, timeZone: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Default Notification Priority</label>
            <select value={settings.defaultPriority} onChange={e => setSettings({ ...settings, defaultPriority: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold">
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent / Critical</option>
            </select>
          </div>
        </div>

        {/* Retention & Archive Policy */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-bold uppercase text-[11px] text-emerald-400">3. Retention & Archive Policy</h4>
          <div>
            <label className="text-slate-400 block mb-1">Live Database Retention (Days)</label>
            <input type="number" value={settings.retentionPolicyDays} onChange={e => setSettings({ ...settings, retentionPolicyDays: parseInt(e.target.value) })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Cold Archive Storage Duration (Days)</label>
            <input type="number" value={settings.archivePolicyDays} onChange={e => setSettings({ ...settings, archivePolicyDays: parseInt(e.target.value) })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
        </div>

        {/* Retry & Escalation Policy */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-bold uppercase text-[11px] text-cyan-400">4. Retry & Backoff Configuration</h4>

          <div>
            <label className="text-slate-400 block mb-1">Maximum Retry Attempts</label>
            <input type="number" value={settings.retryMax} onChange={e => setSettings({ ...settings, retryMax: parseInt(e.target.value) })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Initial Backoff Interval (ms)</label>
            <input type="number" value={settings.initialBackoffMs} onChange={e => setSettings({ ...settings, initialBackoffMs: parseInt(e.target.value) })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
        </div>
      </div>
    </div>);
}
