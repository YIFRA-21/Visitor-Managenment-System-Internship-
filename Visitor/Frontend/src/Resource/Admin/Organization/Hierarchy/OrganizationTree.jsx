import { useState, useEffect, lazy, Suspense } from 'react';
import { Network, Info, X, LayoutDashboard, Link2, Search, ShieldCheck, BarChart3, TreePine, Trash2 } from 'lucide-react';
import api from '../../../../services/api';
import TreeNode from './components/TreeNode';
import TreeToolbar from './components/TreeToolbar';
import TreeLegend from './components/TreeLegend';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
// Lazy load sub-views for code splitting
const HierarchyDashboard = lazy(() => import('./HierarchyDashboard'));
const HierarchyAssignment = lazy(() => import('./HierarchyAssignment'));
const HierarchyDetails = lazy(() => import('./HierarchyDetails'));
const HierarchySearch = lazy(() => import('./HierarchySearch'));
const HierarchyValidation = lazy(() => import('./HierarchyValidation'));
const HierarchyStatistics = lazy(() => import('./HierarchyStatistics'));
const SUB_VIEW_BUTTONS = [
    { key: 'tree', label: 'Tree View', icon: <TreePine className="h-4 w-4"/>, description: 'Interactive hierarchy browser', color: '#22c55e' },
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4"/>, description: 'KPI overview & metrics', color: '#3b82f6' },
    { key: 'assignment', label: 'Assignment', icon: <Link2 className="h-4 w-4"/>, description: 'Manage node assignments', color: '#8b5cf6' },
    { key: 'details', label: 'Details', icon: <Info className="h-4 w-4"/>, description: 'Inspect node details', color: '#f59e0b' },
    { key: 'search', label: 'Search', icon: <Search className="h-4 w-4"/>, description: 'Multi-criteria hierarchy search', color: '#06b6d4' },
    { key: 'validation', label: 'Validation', icon: <ShieldCheck className="h-4 w-4"/>, description: 'Structural integrity audit', color: '#10b981' },
    { key: 'statistics', label: 'Statistics', icon: <BarChart3 className="h-4 w-4"/>, description: 'Quantitative analytics', color: '#ef4444' },
];
function LoadingFallback() {
    return (<div className="p-16 text-center">
      <div className="spinner-border text-primary" role="status"/>
      <p className="text-slate-400 text-xs fw-semibold mt-3">Loading view...</p>
    </div>);
}
export default function OrganizationTree() {
    const [activeSubView, setActiveSubView] = useState('tree');
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const fetchTree = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hierarchy/tree');
            setTreeData(res.data.tree || []);
        }
        catch (err) {
            console.error(err);
            setTreeData([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchTree(); }, []);
    const handleSelectNode = (node) => {
        setSelectedNode(node);
    };
    const handleDeleteConfirm = async () => {
        if (!deleteTarget)
            return;
        setDeleting(true);
        try {
            if (deleteTarget.type === 'ORGANIZATION') {
                await api.delete(`/organizations/${deleteTarget.numericId}`);
            }
            else if (deleteTarget.type === 'BRANCH') {
                await api.delete(`/branches/${deleteTarget.numericId}`);
            }
            else if (deleteTarget.type === 'DEPARTMENT') {
                await api.delete(`/departments/${deleteTarget.numericId}`);
            }
            if (selectedNode?.id === deleteTarget.id) {
                setSelectedNode(null);
            }
            setDeleteTarget(null);
            fetchTree();
        }
        catch (err) {
            console.error('Delete hierarchy node failed:', err);
        }
        finally {
            setDeleting(false);
        }
    };
    const renderSubView = () => {
        switch (activeSubView) {
            case 'dashboard':
                return <Suspense fallback={<LoadingFallback />}><HierarchyDashboard /></Suspense>;
            case 'assignment':
                return <Suspense fallback={<LoadingFallback />}><HierarchyAssignment /></Suspense>;
            case 'details':
                return <Suspense fallback={<LoadingFallback />}><HierarchyDetails /></Suspense>;
            case 'search':
                return <Suspense fallback={<LoadingFallback />}><HierarchySearch /></Suspense>;
            case 'validation':
                return <Suspense fallback={<LoadingFallback />}><HierarchyValidation /></Suspense>;
            case 'statistics':
                return <Suspense fallback={<LoadingFallback />}><HierarchyStatistics /></Suspense>;
            case 'tree':
            default:
                return renderTreeView();
        }
    };
    const renderTreeView = () => (<>
      <ConfirmationDialog show={!!deleteTarget} title={`Delete ${deleteTarget?.type === 'ORGANIZATION' ? 'Organization' : deleteTarget?.type === 'BRANCH' ? 'Branch' : 'Department'}`} message={`Are you sure you want to delete "${deleteTarget?.name}"?`} confirmLabel="Delete" danger={true} loading={deleting} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}/>

      {/* Toolbar & Legend */}
      <TreeToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={fetchTree} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}/>
      <TreeLegend />

      {/* Main Tree & Inspector Split View */}
      <div className="row g-4">
        <div className={selectedNode ? 'col-12 col-lg-8' : 'col-12'}>
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm min-h-[480px]">
            {loading ? (<div className="p-16 text-center">
                <div className="spinner-border text-primary" role="status"/>
                <p className="text-slate-400 text-xs fw-semibold mt-3">Assembling hierarchy tree...</p>
              </div>) : treeData.length === 0 ? (<div className="p-16 text-center text-slate-400 font-semibold text-xs">
                <Network className="h-10 w-10 mx-auto mb-2 opacity-50"/>
                <p>No organizational hierarchy nodes available.</p>
              </div>) : (<div className="space-y-2">
                {treeData.map((node) => (<TreeNode key={node.id} node={node} selectedNodeId={selectedNode?.id} onSelectNode={handleSelectNode} onDelete={(n) => setDeleteTarget(n)} searchQuery={searchQuery}/>))}
              </div>)}
          </div>
        </div>

        {/* Selected Node Details Side Inspector */}
        {selectedNode && (<div className="col-12 col-lg-4">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4 sticky top-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500"/> Node Inspection
                </h3>
                <button onClick={() => setSelectedNode(null)} className="btn btn-sm btn-outline-secondary p-1 rounded">
                  <X className="h-4 w-4"/>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Node Name</span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-base">{selectedNode.name}</p>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Code</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedNode.code}</p>
                  </div>
                  <div className="col-6">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Node Type</span>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{selectedNode.type}</p>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Hierarchy Level</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Level {selectedNode.level}</p>
                  </div>
                  <div className="col-6">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Status</span>
                    <p className="font-bold text-emerald-600">{selectedNode.status}</p>
                  </div>
                </div>

                {selectedNode.children && (<div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Direct Children</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedNode.children.length} Units</p>
                  </div>)}

                <div className="pt-2 border-top dark:border-slate-800">
                  <button onClick={() => setDeleteTarget(selectedNode)} className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 text-xs font-bold py-2" title={`Delete ${selectedNode.type}`}>
                    <Trash2 className="h-4 w-4"/> Delete {selectedNode.type === 'ORGANIZATION' ? 'Organization' : selectedNode.type === 'BRANCH' ? 'Branch' : 'Department'}
                  </button>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </>);
    return (<div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <Network className="text-blue-600 h-6 w-6"/> Organization Hierarchy
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold">
            Comprehensive hierarchy management — tree, dashboard, assignments, search, validation & statistics.
          </p>
        </div>
      </div>

      {/* ── Navigation Buttons ── */}
      <div className="d-flex flex-wrap gap-2 p-3 rounded-xl" style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.85) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148,163,184,0.12)',
        }}>
        {SUB_VIEW_BUTTONS.map((btn) => {
            const isActive = activeSubView === btn.key;
            return (<button key={btn.key} onClick={() => setActiveSubView(btn.key)} title={btn.description} className="d-flex align-items-center gap-2 px-3 py-2 rounded-lg border-0 text-xs font-bold" style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isActive
                        ? `linear-gradient(135deg, ${btn.color}22, ${btn.color}44)`
                        : 'rgba(255,255,255,0.04)',
                    color: isActive ? btn.color : 'rgba(203,213,225,0.8)',
                    border: isActive
                        ? `1.5px solid ${btn.color}66`
                        : '1.5px solid rgba(148,163,184,0.1)',
                    boxShadow: isActive
                        ? `0 0 12px ${btn.color}22, inset 0 1px 0 rgba(255,255,255,0.06)`
                        : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                }} onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.background = `${btn.color}11`;
                        e.currentTarget.style.color = btn.color;
                        e.currentTarget.style.borderColor = `${btn.color}33`;
                    }
                }} onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = 'rgba(203,213,225,0.8)';
                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)';
                    }
                }}>
              {btn.icon}
              <span>{btn.label}</span>
            </button>);
        })}
      </div>

      {/* ── Active Sub-View Content ── */}
      <div className="mt-3">
        {renderSubView()}
      </div>
    </div>);
}
