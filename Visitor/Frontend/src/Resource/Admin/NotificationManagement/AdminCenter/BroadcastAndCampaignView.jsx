import React, { useState } from 'react';
import { Send, Megaphone, Search, RotateCcw, Plus } from 'lucide-react';
export default function BroadcastAndCampaignView() {
    const [activeTab, setActiveTab] = useState('broadcast');
    // Broadcast Form State
    const [targetType, setTargetType] = useState('role');
    const [targetValue, setTargetValue] = useState('Employee');
    const [selectedChannels, setSelectedChannels] = useState(['in_app', 'email']);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState('normal');
    const [isDraft, setIsDraft] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');
    // Sample Campaigns
    const [campaigns] = useState([
        { id: 'cmp_1', name: 'Annual Security Audit Notice', type: 'Security Alert', audience: 'All Security & Staff', status: 'Active', delivered: 1420, openRate: '92.4%' },
        { id: 'cmp_2', name: 'National Holiday Visitor Policy', type: 'Holiday Announcement', audience: 'All Receptionists', status: 'Scheduled', delivered: 0, openRate: '0.0%' },
        { id: 'cmp_3', name: 'System Maintenance Window Q3', type: 'Maintenance Notice', audience: 'All Users', status: 'Completed', delivered: 2850, openRate: '98.1%' }
    ]);
    const toggleChannel = (ch) => {
        setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
    };
    return (<div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
        {[
            { id: 'broadcast', label: 'Manual Broadcast (§2)', icon: Send },
            { id: 'campaign', label: 'Campaign Management (§3)', icon: Megaphone },
            { id: 'search', label: 'Enterprise Search (§15)', icon: Search }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <t.icon className="h-4 w-4"/>
            <span>{t.label}</span>
          </button>))}
      </div>

      {/* TAB 1: MANUAL BROADCAST (§2) */}
      {activeTab === 'broadcast' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Send className="h-4 w-4 text-blue-400"/>
              <span>Compose Manual Broadcast Notification</span>
            </h3>

            {/* Target Recipient Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">1. Target Audience & Recipients</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {['role', 'department', 'branch', 'all_users'].map(t => (<button key={t} onClick={() => setTargetType(t)} className={`p-2.5 rounded-xl border text-center font-bold uppercase ${targetType === t ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    {t.replace('_', ' ')}
                  </button>))}
              </div>

              <input type="text" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="Target value (e.g. Employee, Reception, Security, Dept ID)" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"/>
            </div>

            {/* Multi-Channel Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">2. Delivery Channels</label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                { id: 'in_app', label: 'In-App Banner' },
                { id: 'email', label: 'SMTP Email' },
                { id: 'sms', label: 'Bulk SMS' },
                { id: 'browser', label: 'Browser Push' },
                { id: 'desktop', label: 'Desktop Native' }
            ].map(ch => (<button key={ch.id} onClick={() => toggleChannel(ch.id)} className={`px-3.5 py-2 rounded-xl border font-bold transition-all ${selectedChannels.includes(ch.id)
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                    {ch.label}
                  </button>))}
              </div>
            </div>

            {/* Notification Title & Body */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Title / Subject</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Urgent System Maintenance Notice" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"/>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Message Content (Variables Supported: {"{{name}}, {{date}}"})</label>
                <textarea rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="Enter message body..." className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"/>
              </div>
            </div>

            {/* Priority & Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold">
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent / Critical (Bypass Quiet Hours)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Scheduled Delivery (Optional)</label>
                <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"/>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">
                Save as Template
              </button>

              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">
                  Save Draft
                </button>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center space-x-2">
                  <Send className="h-4 w-4"/>
                  <span>{scheduledTime ? 'Schedule Broadcast' : 'Send Immediately'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats / Active Broadcast Recalls */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Broadcast Actions</h4>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-indigo-400 block">Broadcast Recalls (§2)</span>
              <p className="text-slate-400 text-[11px]">
                Administrators can recall previously sent in-app/push broadcasts within 15 minutes of delivery.
              </p>
              <button className="w-full py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold hover:bg-rose-500/30 flex items-center justify-center space-x-2">
                <RotateCcw className="h-3.5 w-3.5"/>
                <span>Recall Active Broadcast</span>
              </button>
            </div>
          </div>
        </div>)}

      {/* TAB 2: CAMPAIGN MANAGEMENT (§3) */}
      {activeTab === 'campaign' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notification Campaigns</h3>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2">
              <Plus className="h-4 w-4"/>
              <span>Create New Campaign</span>
            </button>
          </div>

          <div className="space-y-3">
            {campaigns.map(c => (<div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white text-sm">{c.name}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{c.type} • Audience: {c.audience}</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-bold block">{c.delivered} Delivered</span>
                    <span className="text-indigo-400 text-[11px]">{c.openRate} Open Rate</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-bold uppercase">
                    {c.status}
                  </span>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* TAB 3: ENTERPRISE SEARCH (§15) */}
      {activeTab === 'search' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Notification Search & Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="Search by Notification ID, Keyword..." className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"/>
            <input type="text" placeholder="Recipient / Sender / Event..." className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"/>
            <button className="p-3 bg-blue-600 text-white rounded-xl font-bold">Search Notifications</button>
          </div>
        </div>)}
    </div>);
}
