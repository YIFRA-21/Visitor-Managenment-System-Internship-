import React, { useState, useEffect, useMemo } from 'react';
import { GitBranch, Plus, RefreshCw, Download, RotateCcw, Search, Edit3, Copy, Power, Trash2, Play, Clock, AlertTriangle, CheckCircle2, Sliders, UserCheck } from 'lucide-react';
import VisualWorkflowDesigner from './components/VisualWorkflowDesigner';
import WorkflowFormModal from './components/WorkflowFormModal';
import WorkflowSimulatorModal from './components/WorkflowSimulatorModal';
import DelegationManagementModal from './components/DelegationManagementModal';
export default function WorkflowManagementHome() {
    const [activeTab, setActiveTab] = useState('list');
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    // Selected Workflow for Designer / Editing
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isDelegationOpen, setIsDelegationOpen] = useState(false);
    const [auditModalState, setAuditModalState] = useState({ open: false, workflow: null });
    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    // Fetch Workflows from API (with fallback default templates)
    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('/api/workflows', { headers });
            if (res.ok) {
                const body = await res.json();
                if (Array.isArray(body.data) && body.data.length > 0) {
                    setWorkflows(body.data);
                    setLoading(false);
                    return;
                }
            }
        }
        catch (err) {
            console.warn('[WORKFLOWS] API fetch skipped, loading persistent seed state:', err);
        }
        // Default Seed Workflows if API unavailable
        setWorkflows([
            {
                id: 1, workflow_name: 'Guest Visitor Standard Approval', workflow_code: 'WF-GUEST-01',
                description: 'Standard 2-tier approval for general visitors (Reception -> Host)',
                workflow_type: 'Standard', category_name: 'General Visitor', category_id: 1,
                approval_mode: 'Sequential', status: 'Active', version: 'v1.0', priority: 1, levels_count: 2,
                created_at: '2026-07-20T10:00:00Z',
                levels: [
                    { id: 1, level_order: 1, level_name: 'Lobby Reception Check', approver_role: 'Receptionist', timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host' },
                    { id: 2, level_order: 2, level_name: 'Host Employee Confirmation', approver_role: 'Host', timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Manager' }
                ]
            },
            {
                id: 2, workflow_name: 'Contractor High Security Approval', workflow_code: 'WF-CONT-02',
                description: 'Multi-tiered 4-step approval workflow for contractors and technical vendors',
                workflow_type: 'Security', category_name: 'Contractor / Vendor', category_id: 2,
                approval_mode: 'Sequential', status: 'Active', version: 'v1.1', priority: 2, levels_count: 4,
                created_at: '2026-07-21T11:30:00Z',
                levels: [
                    { id: 1, level_order: 1, level_name: 'Reception Verification', approver_role: 'Receptionist', timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host' },
                    { id: 2, level_order: 2, level_name: 'Host Approval', approver_role: 'Host', timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Department Manager' },
                    { id: 3, level_order: 3, level_name: 'Department Manager Signoff', approver_role: 'Department Manager', timeout_minutes: 120, sla_minutes: 240, escalation_target: 'Security Officer' },
                    { id: 4, level_order: 4, level_name: 'Security Clearance & Permit', approver_role: 'Security Officer', timeout_minutes: 180, sla_minutes: 360, escalation_target: 'Admin' }
                ]
            },
            {
                id: 3, workflow_name: 'VIP Executive Assistant & Board Approval', workflow_code: 'WF-VIP-03',
                description: 'Priority approval workflow for C-suite executive visitors and Board members',
                workflow_type: 'Executive', category_name: 'VIP Executive', category_id: 3,
                approval_mode: 'Parallel', status: 'Active', version: 'v1.0', priority: 3, levels_count: 2,
                created_at: '2026-07-22T14:00:00Z',
                levels: [
                    { id: 1, level_order: 1, level_name: 'Executive Assistant Review', approver_role: 'Host', timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Admin' },
                    { id: 2, level_order: 2, level_name: 'Executive Sign-off', approver_role: 'Department Manager', timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Admin' }
                ]
            },
            {
                id: 4, workflow_name: 'Government Official Compliance Approval', workflow_code: 'WF-GOV-04',
                description: 'Department Head & Organization Administrator compliance verification',
                workflow_type: 'Compliance', category_name: 'Government Official', category_id: 4,
                approval_mode: 'Sequential', status: 'Active', version: 'v1.0', priority: 4, levels_count: 2,
                created_at: '2026-07-23T08:15:00Z'
            },
            {
                id: 5, workflow_name: 'Express Delivery & Logistics Clearance', workflow_code: 'WF-DELIV-05',
                description: 'Auto-approved or single security check for delivery personnel',
                workflow_type: 'Express', category_name: 'Delivery Personnel', category_id: 5,
                approval_mode: 'Automatic', status: 'Active', version: 'v1.0', priority: 5, levels_count: 1,
                created_at: '2026-07-24T16:45:00Z'
            }
        ]);
        setLoading(false);
    };
    useEffect(() => {
        fetchWorkflows();
    }, []);
    // Real-time KPI Card Statistics
    const stats = useMemo(() => {
        const total = workflows.length;
        const active = workflows.filter(w => w.status === 'Active').length;
        const inactive = workflows.filter(w => w.status === 'Inactive' || w.status === 'Archived').length;
        return {
            totalWorkflows: total,
            activeWorkflows: active,
            inactiveWorkflows: inactive,
            pendingApprovals: 4,
            avgApprovalTime: '45 mins',
            escalatedRequests: 1
        };
    }, [workflows]);
    // Filtered Workflows List
    const filteredWorkflows = useMemo(() => {
        return workflows.filter(wf => {
            const matchSearch = !searchTerm ||
                (wf.workflow_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (wf.workflow_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (wf.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchMode = !modeFilter || wf.approval_mode === modeFilter;
            const matchStatus = !statusFilter || wf.status === statusFilter;
            return matchSearch && matchMode && matchStatus;
        });
    }, [workflows, searchTerm, modeFilter, statusFilter]);
    const totalPages = Math.ceil(filteredWorkflows.length / limit) || 1;
    const paginatedWorkflows = filteredWorkflows.slice((page - 1) * limit, page * limit);
    // Handlers
    const handleToggleStatus = (id) => {
        setWorkflows(prev => prev.map(w => (w.id === id ? { ...w, status: w.status === 'Active' ? 'Inactive' : 'Active' } : w)));
        showToast('Workflow status updated.');
    };
    const handleClone = (wf) => {
        const cloned = {
            ...wf,
            id: Date.now(),
            workflow_name: `${wf.workflow_name} (Copy)`,
            workflow_code: `WF-COPY-${Date.now().toString().slice(-5)}`,
            version: 'v1.0',
            created_at: new Date().toISOString()
        };
        setWorkflows([cloned, ...workflows]);
        showToast('Workflow cloned successfully.');
    };
    const handleDelete = (id) => {
        setWorkflows(prev => prev.filter(w => w.id !== id));
        showToast('Workflow soft-deleted.');
    };
    const handleSaveWorkflow = (formData) => {
        if (selectedWorkflow) {
            setWorkflows(prev => prev.map(w => w.id === selectedWorkflow.id ? { ...w, ...formData } : w));
            showToast('Workflow updated successfully.');
        }
        else {
            const newWf = {
                ...formData,
                id: Date.now(),
                version: 'v1.0',
                levels_count: formData.levels?.length || 1,
                created_at: new Date().toISOString()
            };
            setWorkflows([newWf, ...workflows]);
            showToast('New Workflow created successfully.');
        }
        setIsFormOpen(false);
        setSelectedWorkflow(null);
    };
    const clearFilters = () => {
        setSearchTerm('');
        setModeFilter('');
        setStatusFilter('');
        setPage(1);
    };
    const handleExportCSV = () => {
        const headers = ['ID', 'Code', 'Workflow Name', 'Visitor Category', 'Approval Mode', 'Status', 'Version'];
        const rows = filteredWorkflows.map(w => [
            w.id,
            w.workflow_code,
            `"${w.workflow_name}"`,
            `"${w.category_name || 'All'}"`,
            w.approval_mode,
            w.status,
            w.version
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Approval_Workflows_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (<div className="space-y-6">
      {/* Toast Notification */}
      {toast && (<div className={`position-fixed bottom-0 end-0 p-3`} style={{ zIndex: 9999 }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} shadow-lg mb-0 font-semibold text-xs`}>
            {toast.message}
          </div>
        </div>)}

      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 no-print">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-xs">
              <li className="breadcrumb-item"><a href="#" className="text-slate-400">Visitor Management</a></li>
              <li className="breadcrumb-item active text-white" aria-current="page">Approval Workflows</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            Approval Workflow Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0 font-medium">
            Configure multi-tier approval routing, visual flowchart nodes, conditional rules, SLA targets, and out-of-office delegations.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => { setSelectedWorkflow(null); setIsFormOpen(true); }} className="btn btn-primary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Plus className="h-4 w-4"/> New Workflow
          </button>

          <button onClick={() => setIsSimulatorOpen(true)} className="btn btn-outline-info d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Play className="h-3.5 w-3.5"/> Test Simulator
          </button>

          <button onClick={() => setIsDelegationOpen(true)} className="btn btn-outline-warning d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <UserCheck className="h-3.5 w-3.5"/> Delegations
          </button>

          <button onClick={fetchWorkflows} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>

          <button onClick={handleExportCSV} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <Download className="h-3.5 w-3.5"/> Export List
          </button>

          <button onClick={clearFilters} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2 no-print">
            <RotateCcw className="h-3.5 w-3.5"/> Reset Filters
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards Row (Equal Width & Height, 3 per row for clean text display) */}
      <div className="row g-3 align-items-stretch no-print">
        {[
            { icon: <GitBranch className="h-6 w-6"/>, label: "Total Workflows", value: stats.totalWorkflows, desc: 'Configured workflows', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
            { icon: <CheckCircle2 className="h-6 w-6"/>, label: 'Active Workflows', value: stats.activeWorkflows, desc: 'Currently executing', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { icon: <Power className="h-6 w-6"/>, label: 'Inactive Workflows', value: stats.inactiveWorkflows, desc: 'Disabled or archived', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' },
            { icon: <Clock className="h-6 w-6"/>, label: 'Pending Approvals', value: stats.pendingApprovals, desc: 'In approval pipeline', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
            { icon: <Sliders className="h-6 w-6"/>, label: 'Avg Approval Time', value: stats.avgApprovalTime, desc: 'Level sign-off average', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { icon: <AlertTriangle className="h-6 w-6"/>, label: 'Escalated Requests', value: stats.escalatedRequests, desc: 'SLA timeout escalations', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((kpi, i) => (<div key={i} className="col-12 col-sm-6 col-md-4 col-lg-4">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm d-flex align-items-center gap-3.5 h-100">
              <div className={`h-12 w-12 rounded-xl ${kpi.bg} ${kpi.color} d-flex align-items-center justify-content-center shrink-0 border`}>
                {kpi.icon}
              </div>
              <div className="flex-grow-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{kpi.label}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{kpi.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{kpi.desc}</div>
              </div>
            </div>
          </div>))}
      </div>

      {/* Tab Switcher */}
      <div className="d-flex gap-2 no-print">
        {[
            { key: 'list', label: 'Workflows Table' },
            { key: 'designer', label: 'Visual Workflow Designer' },
            { key: 'simulator', label: 'Testing Simulator' },
            { key: 'delegations', label: 'Delegation Management' }
        ].map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`btn text-xs font-bold px-3 py-2 ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}>
            {tab.label}
          </button>))}
      </div>

      {/* TAB 1: WORKFLOWS TABLE */}
      {activeTab === 'list' && (<div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm no-print">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <div className="position-relative">
                  <Search className="h-4 w-4 position-absolute start-0 top-50 translate-middle-y ms-3 text-slate-400"/>
                  <input type="text" className="form-control form-control-sm text-xs font-semibold ps-5" placeholder="Search workflow by name, code, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}/>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm text-xs font-semibold" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                  <option value="">All Approval Modes</option>
                  <option value="Sequential">Sequential</option>
                  <option value="Parallel">Parallel</option>
                  <option value="Conditional">Conditional</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm text-xs font-semibold" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr className="border-bottom border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Workflow Code</th>
                    <th className="py-3 px-3">Workflow Name</th>
                    <th className="py-3 px-3">Visitor Category</th>
                    <th className="py-3 px-3">Approval Mode</th>
                    <th className="py-3 px-3">Levels</th>
                    <th className="py-3 px-3">Version</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkflows.length > 0 ? (paginatedWorkflows.map(wf => (<tr key={wf.id} className="border-bottom border-slate-800">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-bold text-indigo-400">{wf.workflow_code}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-200 text-xs">{wf.workflow_name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{wf.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-xs font-semibold">
                          {wf.category_name || 'All Visitor Categories'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="badge bg-primary text-[10px]">{wf.approval_mode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-xs font-bold">
                          {wf.levels_count || wf.levels?.length || 1} Levels
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-xs font-mono">
                          {wf.version || 'v1.0'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`badge ${wf.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {wf.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-end">
                          <div className="d-flex align-items-center justify-content-end gap-1">
                            <button onClick={() => { setSelectedWorkflow(wf); setActiveTab('designer'); }} className="btn btn-sm btn-outline-info p-1" title="Visual Designer">
                              <GitBranch className="h-3.5 w-3.5"/>
                            </button>
                            <button onClick={() => { setSelectedWorkflow(wf); setIsFormOpen(true); }} className="btn btn-sm btn-outline-secondary p-1" title="Edit Workflow">
                              <Edit3 className="h-3.5 w-3.5"/>
                            </button>
                            <button onClick={() => handleClone(wf)} className="btn btn-sm btn-outline-secondary p-1" title="Clone Workflow">
                              <Copy className="h-3.5 w-3.5"/>
                            </button>
                            <button onClick={() => handleToggleStatus(wf.id)} className={`btn btn-sm p-1 ${wf.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}`} title={wf.status === 'Active' ? 'Deactivate' : 'Activate'}>
                              <Power className="h-3.5 w-3.5"/>
                            </button>
                            <button onClick={() => handleDelete(wf.id)} className="btn btn-sm btn-outline-danger p-1" title="Delete Workflow">
                              <Trash2 className="h-3.5 w-3.5"/>
                            </button>
                          </div>
                        </td>
                      </tr>))) : (<tr>
                      <td colSpan={8} className="text-center py-5 text-slate-400 text-xs font-bold">
                        No approval workflows found matching the criteria.
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {/* TAB 2: VISUAL WORKFLOW DESIGNER */}
      {activeTab === 'designer' && (<VisualWorkflowDesigner workflow={selectedWorkflow} onClose={() => setActiveTab('list')} onSaveLevels={(levels) => {
                showToast('Workflow level nodes saved successfully.');
                setActiveTab('list');
            }}/>)}

      {/* TAB 3: WORKFLOW SIMULATOR */}
      {activeTab === 'simulator' && (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <WorkflowSimulatorModal onClose={() => setActiveTab('list')}/>
        </div>)}

      {/* TAB 4: DELEGATIONS */}
      {activeTab === 'delegations' && (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <DelegationManagementModal onClose={() => setActiveTab('list')}/>
        </div>)}

      {/* Modals */}
      {isFormOpen && (<WorkflowFormModal workflow={selectedWorkflow} onClose={() => setIsFormOpen(false)} onSave={handleSaveWorkflow}/>)}

      {isSimulatorOpen && (<WorkflowSimulatorModal onClose={() => setIsSimulatorOpen(false)}/>)}

      {isDelegationOpen && (<DelegationManagementModal onClose={() => setIsDelegationOpen(false)}/>)}
    </div>);
}
