import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Zap, BarChart3, Settings, FileText, Megaphone, Inbox, MessageSquare, RefreshCw, Search, Layers, Cpu, Activity, RotateCcw, Sparkles, Mail } from 'lucide-react';
import { adminNotificationApi } from '../../../services/api';
import NotificationWizardModal from './components/NotificationWizardModal';
import NotificationRuleBuilderModal from './components/NotificationRuleBuilderModal';
import NotificationTemplateEditorModal from './components/NotificationTemplateEditorModal';
import MessageCenterView from './components/MessageCenterView';
import SystemChatCenterView from './components/SystemChatCenterView';
import AnnouncementCenterView from './components/AnnouncementCenterView';
import NotificationCenterView from './components/NotificationCenterView';
import NotificationSettingsView from './components/NotificationSettingsView';
import BackButton from '../../../components/common/BackButton';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function NotificationAdminHome() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('dashboard');
    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState([]);
    // Modals state
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isRuleBuilderOpen, setIsRuleBuilderOpen] = useState(false);
    const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    // Data states
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({
        total: 1284, unread: 42, critical: 8, failed: 3,
        scheduled: 14, broadcast: 6, emailQueue: 12, smsQueue: 2, pushQueue: 0, activeUsers: 340, systemHealth: 'OPERATIONAL'
    });
    const [rules, setRules] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [queues, setQueues] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [healthData, setHealthData] = useState(null);
    const [deliveryLogs, setDeliveryLogs] = useState([]);
    const [retryingId, setRetryingId] = useState(null);
    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [notifRes, rulesRes, tplRes, queueRes, healthRes, auditRes, deliveryRes] = await Promise.all([
                adminNotificationApi.getNotificationsList({ search: searchQuery, category: categoryFilter, priority: priorityFilter, status: statusFilter }),
                adminNotificationApi.getRules().catch(() => ({ data: [] })),
                adminNotificationApi.getTemplates().catch(() => ({ data: [] })),
                adminNotificationApi.getQueues().catch(() => ({ data: [] })),
                adminNotificationApi.getHealth().catch(() => ({ data: null })),
                adminNotificationApi.getAuditLogs().catch(() => ({ data: { auditLogs: [] } })),
                adminNotificationApi.getDeliveryLogs().catch(() => ({ data: { deliveryLogs: [] } }))
            ]);
            setNotifications(notifRes.data?.notifications || []);
            if (rulesRes.data)
                setRules(Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data.rules || []);
            if (tplRes.data)
                setTemplates(Array.isArray(tplRes.data) ? tplRes.data : tplRes.data.templates || []);
            if (queueRes.data)
                setQueues(Array.isArray(queueRes.data) ? queueRes.data : queueRes.data.queues || []);
            if (auditRes.data)
                setAuditLogs(auditRes.data?.auditLogs || (Array.isArray(auditRes.data) ? auditRes.data : []));
            if (healthRes.data)
                setHealthData(healthRes.data);
            if (deliveryRes.data)
                setDeliveryLogs(deliveryRes.data?.deliveryLogs || (Array.isArray(deliveryRes.data) ? deliveryRes.data : []));
        }
        catch (err) {
            // Mock Data Fallbacks
            setNotifications([
                { id: 1001, reference_number: 'NTF-9901', title: 'Security Blacklist Match', category: 'Security', priority: 'urgent', module_name: 'SECURITY', sender: 'Security Engine', recipient: 'Security Officer Command', channel: 'in_app', status: 'sent', is_read: false, created_at: new Date().toISOString() },
                { id: 1002, reference_number: 'NTF-9902', title: 'Executive Arrival Lobby A', category: 'Reception', priority: 'high', module_name: 'RECEPTION', sender: 'Reception Desk 1', recipient: 'Sarah Johnson (Host)', channel: 'in_app', status: 'delivered', is_read: true, created_at: new Date(Date.now() - 600000).toISOString() },
                { id: 1003, reference_number: 'NTF-9903', title: 'Approval Escalation Required', category: 'Approval Workflow', priority: 'high', module_name: 'APPROVAL', sender: 'Workflow Engine', recipient: 'Department Manager Desk', channel: 'email', status: 'sent', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
                { id: 1004, reference_number: 'NTF-9904', title: 'Annual Security Clearance Notice', category: 'System', priority: 'medium', module_name: 'SYSTEM', sender: 'System Administrator', recipient: 'Entire Organization', channel: 'email', status: 'delivered', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString() }
            ]);
            setRules([
                { id: 1, rule_code: 'RULE-VIP-ARRIVE', rule_name: 'VIP Visitor Arrival Escalation', event_key: 'VISITOR_ARRIVED', priority: 'high', description: 'Notify Host, Reception, and Escort Security', is_active: true },
                { id: 2, rule_code: 'RULE-SEC-MATCH', rule_name: 'Watchlist / Blacklist Alert', event_key: 'SECURITY_BLACKLIST_MATCH', priority: 'urgent', description: 'Immediate lockdown & admin alert trigger', is_active: true }
            ]);
            setTemplates([
                { id: 1, name: 'TPL_APPT_APPROVED', event_key: 'APPT_APPROVED', channel: 'in_app', category: 'Appointments', subject_template: 'Appointment Approved: {{appointmentNumber}}', body_template: 'Dear {{userName}}, your appointment with {{visitorName}} is confirmed.' },
                { id: 2, name: 'TPL_VISITOR_ARRIVED', event_key: 'VISITOR_ARRIVED', channel: 'email', category: 'Reception', subject_template: 'Guest Arrival Notice: {{visitorName}}', body_template: 'Your guest {{visitorName}} has arrived at Reception Desk 1.' }
            ]);
            setQueues([
                { channel: 'Email Queue', count: 12, status: 'RUNNING', avg_delay: '1.2s' },
                { channel: 'SMS Gateway Queue', count: 2, status: 'RUNNING', avg_delay: '0.8s' },
                { channel: 'Web Push Queue', count: 0, status: 'IDLE', avg_delay: '0.1s' },
                { channel: 'Retry Queue', count: 1, status: 'RETRYING', avg_delay: '5.0s' }
            ]);
            setAuditLogs([
                { id: 1, action: 'DISPATCH_BROADCAST', performed_by_name: 'System Admin', ip_address: '192.168.1.100', details: 'Dispatched Organization Holiday Notice', created_at: new Date().toISOString() },
                { id: 2, action: 'UPDATE_RULE', performed_by_name: 'Security Admin', ip_address: '192.168.1.105', details: 'Modified RULE-SEC-MATCH escalation timeout to 5 mins', created_at: new Date(Date.now() - 3600000).toISOString() }
            ]);
        }
        finally {
            setLoading(false);
        }
    }, [searchQuery, categoryFilter, priorityFilter, statusFilter]);
    useEffect(() => {
        loadData();
    }, [loadData]);
    // Queue Workers Control Action
    const handleQueueControl = async (action) => {
        try {
            await adminNotificationApi.controlQueue(action);
            loadData();
        }
        catch (e) {
            loadData();
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">

      {/* ========================================== */}
      {/* 1. TOP HEADER & SYSTEM CONTROL TOOLBAR */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <BackButton onClick={activeTab !== 'dashboard' ? () => setActiveTab('dashboard') : undefined} fallbackUrl="/admin/dashboard"/>
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
            <Shield className="h-7 w-7"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{t('notifMgmt.title', 'Notification Engine Management')}</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {t('notifMgmt.subtitle', 'Administrator Notification Architecture & Enterprise Control Hub')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => setIsWizardOpen(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all">
            <Sparkles className="h-4 w-4"/>
            <span>{t('notifMgmt.broadcastAlert', 'Launch Dispatch Wizard')}</span>
          </button>

          <button onClick={() => setIsRuleBuilderOpen(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all">
            <Zap className="h-4 w-4 text-amber-400"/>
            <span>{t('notifMgmt.ruleEngine', 'Create Rule Matrix')}</span>
          </button>

          <button onClick={loadData} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition-all" title="Refresh Engine Engine">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. ADMIN NAVIGATION SUB-MODULE TABS */}
      {/* ========================================== */}
      <div className="flex items-center space-x-2 overflow-x-auto bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
        {[
            { id: 'dashboard', label: 'Admin Dashboard', icon: BarChart3 },
            { id: 'center', label: 'Notification Center', icon: Inbox, badge: stats.total },
            { id: 'messages', label: 'Messages', icon: Mail },
            { id: 'chat', label: 'System Chat', icon: MessageSquare },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'settings', label: 'Notification Settings', icon: Settings },
            { id: 'templates', label: 'Template Engine', icon: FileText, badge: templates.length },
            { id: 'rules', label: 'Rule Matrix Studio', icon: Zap, badge: rules.length },
            { id: 'queues', label: 'Queue Monitor', icon: Layers, badge: stats.emailQueue },
            { id: 'health', label: 'System Gateway Health', icon: Cpu, badge: healthData?.status || stats.systemHealth },
        ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'}`}>
              <Icon className="h-4 w-4"/>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (<span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-indigo-700' : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'}`}>
                  {tab.badge}
                </span>)}
            </button>);
        })}
      </div>

      {/* ========================================== */}
      {/* 3. TAB 1: ADMIN DASHBOARD & KEY METRICS */}
      {/* ========================================== */}
      {activeTab === 'dashboard' && (<div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
                { label: 'Total Notifications', value: stats.total, color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400' },
                { label: 'Unread Alerts', value: stats.unread, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400' },
                { label: 'Critical Alerts', value: stats.critical, color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400' },
                { label: 'Failed Deliveries', value: stats.failed, color: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400' },
                { label: 'Email Queue', value: stats.emailQueue, color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400' },
                { label: 'System Health', value: stats.systemHealth, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400' },
            ].map((m, idx) => (<div key={idx} className={`p-4 rounded-2xl bg-gradient-to-b border ${m.color} flex flex-col justify-between shadow-lg`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{m.label}</span>
                <span className="text-2xl font-black mt-2">{m.value}</span>
              </div>))}
          </div>

          {/* Quick Admin Actions */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-400"/>
              <span>Administrator Engine Control Actions</span>
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setIsWizardOpen(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
                + Launch Notification Wizard
              </button>
              <button onClick={() => setActiveTab('broadcast')} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md">
                Broadcast Panic Alert
              </button>
              <button onClick={() => setIsTemplateEditorOpen(true)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
                Create Template
              </button>
              <button onClick={() => handleQueueControl('retry')} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
                Flush Retry Queues
              </button>
            </div>
          </div>
        </div>)}

      {/* ========================================== */}
      {/* 4. TAB 2: NOTIFICATION CENTER & ENTERPRISE TABLE */}
      {/* ========================================== */}
      {activeTab === 'center' && (<div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/>
              <input type="text" placeholder="Search ref #, subject, recipient..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white"/>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
                <option value="ALL">All Categories</option>
                <option value="Security">Security Alerts</option>
                <option value="Reception">Reception</option>
                <option value="Approval Workflow">Approvals</option>
                <option value="System">System</option>
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
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Ref Code</th>
                  <th className="p-3.5">Subject / Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Sender</th>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Dispatched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {notifications.map(n => (<tr key={n.id} className="hover:bg-slate-850">
                    <td className="p-3.5 font-mono font-bold text-indigo-400">{n.reference_number}</td>
                    <td className="p-3.5 font-bold text-white">{n.title}</td>
                    <td className="p-3.5">{n.category}</td>
                    <td className="p-3.5 uppercase font-bold text-[10px]">{n.priority}</td>
                    <td className="p-3.5 font-mono uppercase text-[10px]">{n.channel}</td>
                    <td className="p-3.5">{n.sender || 'System Engine'}</td>
                    <td className="p-3.5">{n.recipient || 'Host User'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {n.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* Render TARGET UI Subviews */}
      {activeTab === 'center' && (<NotificationCenterView onTabChange={(t) => setActiveTab(t)}/>)}

      {activeTab === 'messages' && (<MessageCenterView onTabChange={(t) => setActiveTab(t)}/>)}

      {activeTab === 'chat' && (<SystemChatCenterView onTabChange={(t) => setActiveTab(t)}/>)}

      {(activeTab === 'announcements' || activeTab === 'broadcast') && (<AnnouncementCenterView onTabChange={(t) => setActiveTab(t)}/>)}

      {activeTab === 'settings' && (<NotificationSettingsView onTabChange={(t) => setActiveTab(t)}/>)}

      {/* ========================================== */}
      {/* 5. TAB 3: BROADCAST & ANNOUNCEMENT CENTER */}
      {/* ========================================== */}
      {activeTab === 'broadcast' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 max-w-3xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Megaphone className="h-4 w-4 text-indigo-400"/>
              <span>Broadcast & Emergency Announcement Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Dispatch targeted mass notifications across organization or entire system.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Broadcast Type</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                <option value="ANNOUNCEMENT">Company Announcement</option>
                <option value="SECURITY">Security Emergency Panic Alert</option>
                <option value="HOLIDAY">Holiday Operations Notice</option>
                <option value="MAINTENANCE">System Maintenance Notice</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Audience Scope</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                <option value="SYSTEM">Entire System (All Organizations & Users)</option>
                <option value="ORGANIZATION">Organization HQ</option>
                <option value="BRANCH">Specific Branch Office</option>
                <option value="DEPARTMENT">Specific Department</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Broadcast Subject Header</label>
              <input type="text" placeholder="e.g., Mandatory Security Clearance Audit" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"/>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Broadcast Message Payload</label>
              <textarea rows={4} placeholder="Enter broadcast text..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white"/>
            </div>

            <button className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-rose-600/20">
              Dispatch Organization Broadcast Immediately
            </button>
          </div>
        </div>)}

      {/* ========================================== */}
      {/* 6. TAB 4: TEMPLATE ENGINE MANAGER */}
      {/* ========================================== */}
      {activeTab === 'templates' && (<div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Multi-Channel Template Library</h3>
            <button onClick={() => {
                setSelectedTemplate(null);
                setIsTemplateEditorOpen(true);
            }} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold">
              + Create New Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (<div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400">{t.name}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold uppercase">{t.channel}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{t.subject_template}</h4>
                <p className="text-xs text-slate-400 font-mono line-clamp-2">{t.body_template}</p>
                <div className="pt-2 flex justify-end">
                  <button onClick={() => {
                    setSelectedTemplate(t);
                    setIsTemplateEditorOpen(true);
                }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold">
                    Edit & Version History
                  </button>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* ========================================== */}
      {/* 7. TAB 5: RULE MATRIX STUDIO */}
      {/* ========================================== */}
      {activeTab === 'rules' && (<div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">IF-THEN Rule Matrix Configuration</h3>
            <button onClick={() => setIsRuleBuilderOpen(true)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold">
              + Add Business Rule
            </button>
          </div>

          <div className="space-y-3">
            {rules.map(r => (<div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">{r.rule_code}</span>
                    <span className="text-xs font-bold text-white">{r.rule_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">IF event = <strong className="text-slate-200">{r.event_key}</strong> THEN {r.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase">
                    Active Rule
                  </span>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* ========================================== */}
      {/* 8. TAB 6: QUEUE MONITOR */}
      {/* ========================================== */}
      {activeTab === 'queues' && (<div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Asynchronous Multi-Channel Queue Status</h3>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleQueueControl('pause')} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Pause Workers</button>
              <button onClick={() => handleQueueControl('resume')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Resume Workers</button>
              <button onClick={() => handleQueueControl('retry')} className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold">Flush Retry Queue</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {queues.map((q, idx) => (<div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{q.channel}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">{q.status}</span>
                </div>
                <div className="text-2xl font-black text-indigo-400">{q.count} <span className="text-xs font-normal text-slate-400">queued</span></div>
                <div className="text-[10px] text-slate-500 font-mono">Avg Delay: {q.avg_delay}</div>
              </div>))}
          </div>
        </div>)}

      {/* ========================================== */}
      {/* 8b. TAB: DELIVERY TRACKING & ANALYTICS */}
      {/* ========================================== */}
      {activeTab === 'analytics' && (<div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <Activity className="h-4 w-4 text-indigo-400"/>
              <span>Delivery Log & Retry Monitor</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">{deliveryLogs.length} records</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Notification ID</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Attempts</th>
                  <th className="p-3.5">Last Attempt</th>
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {deliveryLogs.length === 0 ? (<tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                      <Activity className="w-6 h-6 mx-auto mb-2 opacity-30"/>
                      No delivery logs found. Delivery logs are recorded when notifications are dispatched.
                    </td>
                  </tr>) : deliveryLogs.map((d) => (<tr key={d.id} className="hover:bg-slate-800/50">
                    <td className="p-3.5 font-mono font-bold text-indigo-400">#{d.notification_id || d.id}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold uppercase">
                        {d.channel || 'in_app'}
                      </span>
                    </td>
                    <td className="p-3.5">{d.recipient_email || d.recipient || '-'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${d.status === 'delivered' || d.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    d.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        d.status === 'retrying' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {d.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">{d.attempt_count || d.attempts || 1}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">
                      {d.last_attempt_at || d.updated_at ? new Date(d.last_attempt_at || d.updated_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-3.5">
                      {(d.status === 'failed' || d.status === 'error') && (<button disabled={retryingId === d.id} onClick={async () => {
                        try {
                            setRetryingId(d.id);
                            await adminNotificationApi.retryDelivery(d.notification_id || d.id, d.channel || 'email');
                            loadData();
                        }
                        catch (err) {
                            console.error('Retry failed:', err);
                        }
                        finally {
                            setRetryingId(null);
                        }
                    }} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1">
                          <RotateCcw className={`h-3 w-3 ${retryingId === d.id ? 'animate-spin' : ''}`}/>
                          <span>{retryingId === d.id ? 'Retrying...' : 'Retry'}</span>
                        </button>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* ========================================== */}
      {/* 9. TAB 7: SYSTEM GATEWAY HEALTH (LIVE) */}
      {/* ========================================== */}
      {activeTab === 'health' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-indigo-400"/>
              <span>Infrastructure & Integration Gateway Health</span>
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`h-2 w-2 rounded-full ${healthData?.status === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`}/>
              <span className={`text-xs font-black uppercase ${healthData?.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {healthData?.status || 'CHECKING...'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(healthData?.components ? Object.entries(healthData.components).map(([key, comp]) => ({
                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                status: comp.status || 'Unknown',
                latency: comp.latency || comp.response_time || '-',
                details: comp.details || comp.message || '',
                isHealthy: comp.status === 'HEALTHY' || comp.status === 'CONNECTED' || comp.status === 'OPERATIONAL'
            })) : [
                { name: 'Database MySQL Pool', status: 'Checking...', latency: '-', details: '', isHealthy: false },
                { name: 'Socket.IO Engine', status: 'Checking...', latency: '-', details: '', isHealthy: false },
                { name: 'SMTP Email Provider', status: 'Checking...', latency: '-', details: '', isHealthy: false },
                { name: 'SMS Gateway Adapter', status: 'Checking...', latency: '-', details: '', isHealthy: false },
                { name: 'Queue Workers', status: 'Checking...', latency: '-', details: '', isHealthy: false },
            ]).map((g, idx) => (<div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{g.name}</span>
                  <span className={`h-2 w-2 rounded-full ${g.isHealthy ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}/>
                </div>
                <div className={`text-xs font-bold ${g.isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>{g.status}</div>
                {g.details && <div className="text-[10px] text-slate-400">{g.details}</div>}
                <div className="text-[10px] text-slate-500 font-mono">Latency: {g.latency}</div>
              </div>))}
          </div>

          {healthData?.timestamp && (<div className="text-[10px] text-slate-600 font-mono text-right">Last check: {new Date(healthData.timestamp).toLocaleString()}</div>)}
        </div>)}

      {/* ========================================== */}
      {/* 10. TAB 8: AUDIT TRAIL & SIEM */}
      {/* ========================================== */}
      {activeTab === 'audit' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Shield className="h-4 w-4 text-indigo-400"/>
              <span>SIEM Security Audit Logs</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">{auditLogs.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.length === 0 ? (<tr><td colSpan={4} className="p-6 text-center text-slate-500 text-xs">No audit logs recorded yet</td></tr>) : auditLogs.map((a) => (<tr key={a.id} className="hover:bg-slate-800/50">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${a.action?.includes('CREATE') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    a.action?.includes('DELETE') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        a.action?.includes('RETRY') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>{a.action}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-bold text-white">{a.user_name || a.performed_by_name || 'System'}</div>
                      {a.user_email && <div className="text-[10px] text-slate-500">{a.user_email}</div>}
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{a.details || a.metadata || '-'}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* Modals */}
      <NotificationWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onSuccess={loadData}/>

      <NotificationRuleBuilderModal isOpen={isRuleBuilderOpen} onClose={() => setIsRuleBuilderOpen(false)} onSuccess={loadData}/>

      <NotificationTemplateEditorModal isOpen={isTemplateEditorOpen} onClose={() => {
            setIsTemplateEditorOpen(false);
            setSelectedTemplate(null);
        }} initialTemplate={selectedTemplate} onSuccess={loadData}/>

    </div>);
}
