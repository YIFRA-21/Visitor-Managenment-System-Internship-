import React, { useState } from 'react';
import { Users, Radio, Shield, Globe, Smartphone, Bell, Mail, ArrowRight, Check } from 'lucide-react';
const RECIPIENT_SCOPES = [
    { id: 'user', label: 'Specific User', desc: 'Target individual by User ID or Email' },
    { id: 'role', label: 'By Role', desc: 'Target all users possessing a specific role' },
    { id: 'permission', label: 'By Permission', desc: 'Target users assigned specific permission' },
    { id: 'department', label: 'By Department', desc: 'Target entire department staff' },
    { id: 'branch', label: 'By Branch / Site', desc: 'Target all personnel at location' },
    { id: 'organization', label: 'By Organization', desc: 'Target entire organization' },
    { id: 'employee', label: 'Host Employee', desc: 'Target designated appointment host' },
    { id: 'visitor', label: 'Visitor', desc: 'Target registered visitor contact' },
    { id: 'reception', label: 'Reception Officers', desc: 'Target lobby reception desk' },
    { id: 'security', label: 'Security Officers', desc: 'Target site security team' },
    { id: 'manager', label: 'Department Managers', desc: 'Target department management' },
    { id: 'admin', label: 'System Administrators', desc: 'Target system admins' },
    { id: 'org_admin', label: 'Organization Admins', desc: 'Target org level admins' },
    { id: 'custom_group', label: 'Custom User Group', desc: 'Target custom distribution group' }
];
export default function RecipientAndChannelRules() {
    const [activeTab, setActiveTab] = useState('recipients');
    // Recipient Scopes Selection (§5.10)
    const [selectedScopes, setSelectedScopes] = useState(['role', 'employee']);
    // Channel Rules State (§5.11)
    const [selectedChannels, setSelectedChannels] = useState(['in_app', 'email']);
    const [enableFallback, setEnableFallback] = useState(true);
    const toggleScope = (id) => {
        setSelectedScopes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };
    const toggleChannel = (id) => {
        setSelectedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-500 rounded-2xl shadow-xl text-white">
            <Users className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Rule Engine</span>
              <span>/</span>
              <span className="text-cyan-400 font-bold">Recipients & Channels (§5.10, §5.11)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Recipient & Channel Rule Matrix</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'recipients', label: 'Recipient Resolution (§5.10)', badge: selectedScopes.length },
            { id: 'channels', label: 'Channel Fallback Rules (§5.11)', badge: selectedChannels.length }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>{t.label}</span>
              {t.badge !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === t.id ? 'bg-white text-cyan-700' : 'bg-slate-800 text-cyan-400'}`}>
                  {t.badge}
                </span>)}
            </button>))}
        </div>
      </div>

      {/* TAB 1: Recipient Resolution (§5.10) */}
      {activeTab === 'recipients' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Users className="h-4 w-4 text-cyan-400"/>
              <span>Multi-Target Recipient Resolution Rules (14 Scopes)</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold">✓ Automatic Duplicate Filter Enabled</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {RECIPIENT_SCOPES.map(sc => {
                const isSelected = selectedScopes.includes(sc.id);
                return (<div key={sc.id} onClick={() => toggleScope(sc.id)} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                        ? 'bg-cyan-600/20 border-cyan-500/50 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                  <div>
                    <span className="text-xs font-bold text-white block">{sc.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{sc.desc}</span>
                  </div>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ml-2 ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="h-3 w-3"/>
                  </div>
                </div>);
            })}
          </div>
        </div>)}

      {/* TAB 2: Channel Rules & Fallback (§5.11) */}
      {activeTab === 'channels' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
              <Radio className="h-4 w-4 text-cyan-400"/>
              <span>Delivery Channel Matrix & Intelligent Fallback</span>
            </h3>
          </div>

          {/* Active Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
                { id: 'in_app', label: 'In-App Notification', icon: Bell },
                { id: 'email', label: 'Email (SMTP)', icon: Mail },
                { id: 'sms', label: 'SMS Gateway', icon: Smartphone },
                { id: 'browser', label: 'Browser Web Push', icon: Globe },
                { id: 'desktop', label: 'Desktop OS Alert', icon: Shield }
            ].map(ch => {
                const isSelected = selectedChannels.includes(ch.id);
                const Icon = ch.icon;
                return (<div key={ch.id} onClick={() => toggleChannel(ch.id)} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                        ? 'bg-cyan-600/20 border-cyan-500/50 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}/>
                    <span className="text-xs font-bold text-white">{ch.label}</span>
                  </div>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="h-3 w-3"/>
                  </div>
                </div>);
            })}
          </div>

          {/* Fallback Rules Visualizer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase">Automatic Channel Fallback Chain</span>
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={enableFallback} onChange={e => setEnableFallback(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-cyan-600"/>
                <span>Enable Fallback</span>
              </label>
            </div>

            {enableFallback && (<div className="flex items-center space-x-2 text-xs text-slate-300 font-mono p-3 bg-slate-900 rounded-xl">
                <span className="text-cyan-400 font-bold">Email Fails</span>
                <ArrowRight className="h-4 w-4 text-slate-500"/>
                <span className="text-indigo-400 font-bold">Send In-App Notification</span>
                <ArrowRight className="h-4 w-4 text-slate-500"/>
                <span className="text-emerald-400 font-bold">Send SMS Alert</span>
              </div>)}
          </div>
        </div>)}
    </div>);
}
