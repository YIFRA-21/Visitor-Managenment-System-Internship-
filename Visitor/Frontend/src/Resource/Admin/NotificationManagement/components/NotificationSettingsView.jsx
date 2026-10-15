import React, { useState } from 'react';
import { Settings, Mail, MessageSquare, Megaphone, CheckCircle2, Bell, Smartphone, Save, Send, FileText } from 'lucide-react';
import api from '../../../../services/api';
export default function NotificationSettingsView({ onTabChange, currentUser }) {
    const [activeCategory, setActiveCategory] = useState('email');
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [inAppEnabled, setInAppEnabled] = useState(true);
    const [userEmail, setUserEmail] = useState(currentUser?.email || 'michael.john@company.com');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    // Preference Matrix State
    const [preferences, setPreferences] = useState({
        appointment_updates: 'all',
        visitor_checkin: 'all',
        visitor_pass: 'important',
        system_announcements: 'all',
        security_alerts: 'all',
        system_maintenance: 'important',
        reports_analytics: 'none',
    });
    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg('');
        try {
            await api.put('/notifications/preferences', {
                email_enabled: emailEnabled,
                sms_enabled: smsEnabled,
                in_app_enabled: inAppEnabled,
                preferences_json: preferences,
            });
            setSuccessMsg('Notification preferences saved successfully.');
            setTimeout(() => setSuccessMsg(''), 4000);
        }
        catch (err) {
            console.error('Failed to save notification preferences:', err);
        }
        finally {
            setSaving(false);
        }
    };
    const notificationTypes = [
        { id: 'appointment_updates', name: 'Appointment Updates', sub: 'New, rescheduled, cancelled appointments' },
        { id: 'visitor_checkin', name: 'Visitor Check-in / Check-out', sub: 'Visitor check-in and check-out alerts' },
        { id: 'visitor_pass', name: 'Visitor Pass Alerts', sub: 'New pass, expired pass, invalid pass' },
        { id: 'system_announcements', name: 'System Announcements', sub: 'Organization announcements' },
        { id: 'security_alerts', name: 'Security Alerts', sub: 'Security events and access alerts' },
        { id: 'system_maintenance', name: 'System Maintenance', sub: 'Maintenance and system updates' },
        { id: 'reports_analytics', name: 'Reports & Analytics', sub: 'Scheduled reports and analytics' },
    ];
    return (<div className="space-y-4 text-xs font-mono text-slate-300">
      {/* Top Bar matching Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400"/>
            Notification Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage how and when you receive notifications across the system.</p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button onClick={() => onTabChange && onTabChange('messages')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Mail className="h-3.5 w-3.5"/>
            Messages
          </button>

          <button onClick={() => onTabChange && onTabChange('chat')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5"/>
            System Chat
          </button>

          <button onClick={() => onTabChange && onTabChange('announcements')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5"/>
            Announcements
          </button>

          <button onClick={() => onTabChange && onTabChange('settings')} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-lg flex items-center gap-2">
            <Settings className="h-3.5 w-3.5"/>
            Notification Settings
          </button>
        </div>
      </div>

      {successMsg && (<div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 p-3 rounded-xl flex items-center gap-2 font-bold text-xs">
          <CheckCircle2 className="h-4 w-4"/> {successMsg}
        </div>)}

      {/* Main Grid Layout matching Screenshot 3 */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar: Categories (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 h-[640px]">
          <p className="font-extrabold text-white text-xs px-2 py-1 border-b border-slate-800">Settings Categories</p>
          {[
            { id: 'email', name: 'Email Notifications', sub: 'Configure email notification preferences', icon: Mail },
            { id: 'sms', name: 'SMS Notifications', sub: 'Configure SMS notification preferences', icon: Smartphone },
            { id: 'in_app', name: 'In-App Notifications', sub: 'Configure in-app notification preferences', icon: Bell },
            { id: 'types', name: 'Notification Types', sub: 'Choose which events trigger notifications', icon: Settings },
            { id: 'quiet', name: 'Quiet Hours', sub: 'Set quiet hours for notifications', icon: Bell },
            { id: 'digest', name: 'Digest Settings', sub: 'Configure notification digest frequency', icon: FileText },
        ].map((cat) => {
            const active = activeCategory === cat.id;
            const IconComp = cat.icon;
            return (<button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${active ? 'bg-indigo-950/50 border-indigo-500/60 text-white' : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 text-slate-300'}`}>
                <IconComp className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0"/>
                <div>
                  <p className="font-bold text-xs text-white">{cat.name}</p>
                  <p className="text-[10px] text-slate-400">{cat.sub}</p>
                </div>
              </button>);
        })}
        </div>

        {/* Middle Panel: Preference Matrix Table (6 cols) */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[640px] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-white">Email Notifications</h3>
                <p className="text-[10px] text-slate-400">Manage your email notification preferences</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Enable Email Notifications</span>
                <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"/>
              </div>
            </div>

            {/* Matrix Table matching Screenshot 3 */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-[11px]">
              <div className="grid grid-cols-12 bg-slate-900 p-2.5 font-bold text-slate-400 border-b border-slate-800">
                <div className="col-span-5">Notification Type</div>
                <div className="col-span-2 text-center">All Emails</div>
                <div className="col-span-2 text-center">Important Only</div>
                <div className="col-span-1 text-center">None</div>
                <div className="col-span-2 text-center">Email Address</div>
              </div>

              {notificationTypes.map((t) => (<div key={t.id} className="grid grid-cols-12 p-3 items-center border-b border-slate-800/80 hover:bg-slate-900/50">
                  <div className="col-span-5">
                    <p className="font-bold text-white text-xs">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.sub}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <input type="radio" name={`pref_${t.id}`} checked={preferences[t.id] === 'all'} onChange={() => setPreferences({ ...preferences, [t.id]: 'all' })} className="accent-indigo-600 cursor-pointer"/>
                  </div>
                  <div className="col-span-2 text-center">
                    <input type="radio" name={`pref_${t.id}`} checked={preferences[t.id] === 'important'} onChange={() => setPreferences({ ...preferences, [t.id]: 'important' })} className="accent-indigo-600 cursor-pointer"/>
                  </div>
                  <div className="col-span-1 text-center">
                    <input type="radio" name={`pref_${t.id}`} checked={preferences[t.id] === 'none'} onChange={() => setPreferences({ ...preferences, [t.id]: 'none' })} className="accent-indigo-600 cursor-pointer"/>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[10px] text-slate-400 font-mono truncate block">{userEmail}</span>
                  </div>
                </div>))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2">
              <Save className="h-4 w-4"/> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Right Panel: Overview & Quick Actions (3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-white text-xs">Notification Channels Overview</p>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Email</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">SMS</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">In-App</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
            </div>

            <button className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all">
              <Send className="h-3.5 w-3.5"/> Test All Channels
            </button>
          </div>
        </div>
      </div>
    </div>);
}
