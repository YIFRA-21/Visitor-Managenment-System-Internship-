import React, { useState, useEffect, useCallback } from 'react';
import { Zap, BarChart3, FileText, Megaphone, Plus, RefreshCw, Search, Clock, ChevronRight, Calendar, PieChart } from 'lucide-react';
import { manualNotificationApi } from '../../../../services/api';
import EnterpriseCreateNotificationWizard from './EnterpriseCreateNotificationWizard';
export default function ManualNotificationDashboard() {
    const [loading, setLoading] = useState(false);
    // Dashboard state
    const [metrics, setMetrics] = useState({
        totalManual: 486,
        drafts: 12,
        scheduled: 8,
        sent: 420,
        failed: 3,
        pendingApproval: 5,
        broadcasts: 18,
        announcements: 20,
        deliverySuccessRate: '99.4',
        readRate: '87.2',
        queueSize: 4,
        activeTemplates: 14
    });
    const [statistics, setStatistics] = useState({
        byPriority: [
            { priority: 'medium', count: 280 },
            { priority: 'high', count: 120 },
            { priority: 'low', count: 64 },
            { priority: 'urgent', count: 22 }
        ],
        byChannel: [
            { channel: 'in_app', count: 486 },
            { channel: 'email', count: 310 },
            { channel: 'sms', count: 42 }
        ],
        byStatus: [
            { status: 'delivered', count: 380 },
            { status: 'sent', count: 40 },
            { status: 'draft', count: 12 },
            { status: 'scheduled', count: 8 },
            { status: 'failed', count: 3 }
        ]
    });
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [scheduled, setScheduled] = useState([]);
    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    // Wizard modal
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    // Clock
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await manualNotificationApi.getDashboard();
            if (res.data?.data) {
                const d = res.data.data;
                if (d.metrics)
                    setMetrics(d.metrics);
                if (d.statistics)
                    setStatistics(d.statistics);
                if (d.recentNotifications)
                    setRecentNotifications(d.recentNotifications);
                if (d.drafts)
                    setDrafts(d.drafts);
            }
        }
        catch (err) {
            // Mock Fallback Data
            setRecentNotifications([
                { id: 5001, reference_number: 'MNT-0001', title: 'Annual Security Clearance Audit', priority: 'high', category: 'Security', channel: 'email', sender: 'System Admin', recipients: 'All Employees', status: 'sent', created_at: new Date().toISOString() },
                { id: 5002, reference_number: 'MNT-0002', title: 'Holiday Office Hours Notice', priority: 'medium', category: 'announcement', channel: 'in_app', sender: 'HR Dept', recipients: 'Entire Organization', status: 'delivered', created_at: new Date(Date.now() - 3600000).toISOString() },
                { id: 5003, reference_number: 'MNT-0003', title: 'Lobby Maintenance Scheduled', priority: 'low', category: 'General', channel: 'in_app', sender: 'Facilities Desk', recipients: 'Building A Hosts', status: 'delivered', created_at: new Date(Date.now() - 7200000).toISOString() }
            ]);
            setDrafts([
                { id: 6001, draft_name: 'Q3 Security Policy Reminder', created_by: 'Security Officer', last_modified: new Date().toISOString(), status: 'draft' },
                { id: 6002, draft_name: 'New Visitor Check-In Protocol', created_by: 'Reception Desk', last_modified: new Date(Date.now() - 86400000).toISOString(), status: 'draft' }
            ]);
            setScheduled([
                { id: 7001, title: 'Weekly Access Audit Alert', schedule_date: new Date(Date.now() + 86400000).toLocaleDateString(), schedule_time: '09:00 AM', recipients: 'Security Team', status: 'scheduled' }
            ]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadData();
    }, [loadData]);
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">

      {/* ========================================== */}
      {/* 1. DASHBOARD HEADER & BREADCRUMBS */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Administration</span>
            <ChevronRight className="h-3 w-3"/>
            <span>Notification Management</span>
            <ChevronRight className="h-3 w-3"/>
            <span className="text-indigo-400 font-bold">Manual Center</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
              <Megaphone className="h-7 w-7"/>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Manual Notification Management</h1>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Module 13 – Enterprise Dispatch, Drafts, Scheduled Delivery & Recipient Resolution
              </p>
            </div>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
            <Clock className="h-3.5 w-3.5 text-indigo-400"/>
            <span>{new Date().toLocaleDateString()} {currentTime}</span>
          </div>

          <button onClick={() => setIsWizardOpen(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all">
            <Plus className="h-4 w-4"/>
            <span>Create Notification</span>
          </button>

          <button onClick={loadData} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition-all" title="Refresh Dashboard">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. DASHBOARD KPI CARDS (12 METRICS) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
            { label: 'Total Manual', value: metrics.totalManual, color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400' },
            { label: 'Drafts', value: metrics.drafts, color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-300' },
            { label: 'Scheduled', value: metrics.scheduled, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400' },
            { label: 'Sent', value: metrics.sent, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400' },
            { label: 'Failed', value: metrics.failed, color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400' },
            { label: 'Pending Approval', value: metrics.pendingApproval, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400' },
            { label: 'Broadcasts', value: metrics.broadcasts, color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400' },
            { label: 'Announcements', value: metrics.announcements, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400' },
            { label: 'Success Rate', value: `${metrics.deliverySuccessRate}%`, color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-400' },
            { label: 'Read Rate', value: `${metrics.readRate}%`, color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400' },
            { label: 'Queue Size', value: metrics.queueSize, color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400' },
            { label: 'Active Templates', value: metrics.activeTemplates, color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400' },
        ].map((m, idx) => (<div key={idx} className={`p-3.5 rounded-2xl bg-gradient-to-b border ${m.color} flex flex-col justify-between shadow-lg`}>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{m.label}</span>
            <span className="text-xl font-black mt-1.5">{m.value}</span>
          </div>))}
      </div>

      {/* ========================================== */}
      {/* 3. QUICK ACTIONS BAR */}
      {/* ========================================== */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
          <Zap className="h-4 w-4 text-amber-400"/>
          <span>Quick Manual Actions</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsWizardOpen(true)} className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
            <Plus className="h-3.5 w-3.5"/>
            <span>Create Notification</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
            <FileText className="h-3.5 w-3.5 text-slate-400"/>
            <span>View Drafts ({metrics.drafts})</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
            <Calendar className="h-3.5 w-3.5 text-amber-400"/>
            <span>Scheduled ({metrics.scheduled})</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md">
            <Megaphone className="h-3.5 w-3.5"/>
            <span>Broadcast Alert</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400"/>
            <span>Delivery Analytics</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. RECENT NOTIFICATIONS & SEARCH TABLE */}
      {/* ========================================== */}
      <div className="space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/>
            <input type="text" placeholder="Search ref #, subject, sender..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white"/>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
              <option value="ALL">All Categories</option>
              <option value="Security">Security Alerts</option>
              <option value="announcement">Announcements</option>
              <option value="General">General</option>
            </select>

            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Recent Manual Notifications</h3>
            <span className="text-[10px] text-slate-500 font-mono">Showing latest dispatches</span>
          </div>

          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
              <tr>
                <th className="p-3">Ref Code</th>
                <th className="p-3">Subject / Title</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Sender</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentNotifications.map(n => (<tr key={n.id} className="hover:bg-slate-850">
                  <td className="p-3 font-mono font-bold text-indigo-400">{n.reference_number}</td>
                  <td className="p-3 font-bold text-white">{n.title}</td>
                  <td className="p-3 uppercase font-bold text-[10px]">{n.priority}</td>
                  <td className="p-3">{n.sender || 'System Admin'}</td>
                  <td className="p-3">{n.recipients || 'Target Group'}</td>
                  <td className="p-3 font-mono uppercase text-[10px]">{n.channel}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {n.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 5. SPLIT VIEW: DRAFTS & SCHEDULED */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Drafts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <FileText className="h-4 w-4 text-slate-400"/>
              <span>Saved Drafts ({drafts.length})</span>
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {drafts.map(d => (<div key={d.id} className="p-3 flex items-center justify-between hover:bg-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-white">{d.draft_name || d.title}</h4>
                  <div className="text-[10px] text-slate-500 mt-0.5">By {d.created_by || 'Admin'} • {new Date(d.last_modified || d.updated_at).toLocaleString()}</div>
                </div>
                <button className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[10px] font-bold">
                  Resume Draft
                </button>
              </div>))}
          </div>
        </div>

        {/* Scheduled Notifications */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-amber-400"/>
              <span>Scheduled Items ({scheduled.length})</span>
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {scheduled.map(s => (<div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-white">{s.title}</h4>
                  <div className="text-[10px] text-slate-500 mt-0.5">Scheduled for: {s.schedule_date} at {s.schedule_time}</div>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-black uppercase">
                  {s.status}
                </span>
              </div>))}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 6. STATISTICS CHARTS (PRIORITY / CHANNEL) */}
      {/* ========================================== */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
          <PieChart className="h-4 w-4 text-indigo-400"/>
          <span>Distribution Statistics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">By Priority</span>
            <div className="space-y-1.5 pt-1">
              {statistics.byPriority.map((p, i) => (<div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 capitalize">{p.priority}</span>
                  <span className="font-bold font-mono text-indigo-400">{p.count}</span>
                </div>))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">By Channel</span>
            <div className="space-y-1.5 pt-1">
              {statistics.byChannel.map((c, i) => (<div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 uppercase">{c.channel}</span>
                  <span className="font-bold font-mono text-emerald-400">{c.count}</span>
                </div>))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">By Delivery Status</span>
            <div className="space-y-1.5 pt-1">
              {statistics.byStatus.map((s, i) => (<div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 capitalize">{s.status}</span>
                  <span className="font-bold font-mono text-cyan-400">{s.count}</span>
                </div>))}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Step Enterprise Wizard Modal */}
      <EnterpriseCreateNotificationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onSuccess={loadData}/>

    </div>);
}
