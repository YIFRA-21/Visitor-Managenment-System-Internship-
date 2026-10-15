import { useState } from 'react';
import { Info, Building2, GitBranch, Network, Layers, ShieldCheck, ShieldAlert, MapPin, Hash } from 'lucide-react';
import api from '../../../../services/api';
import HierarchyBreadcrumb from './components/HierarchyBreadcrumb';
export default function HierarchyDetails() {
    const [nodeId, setNodeId] = useState('');
    const [nodeType, setNodeType] = useState('ORGANIZATION');
    const [nodeData, setNodeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fetchNode = async () => {
        if (!nodeId)
            return;
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/hierarchy/${nodeId}?type=${nodeType}`);
            setNodeData(res.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Node not found.');
            setNodeData(null);
        }
        finally {
            setLoading(false);
        }
    };
    const getIcon = (type) => {
        switch (type) {
            case 'ORGANIZATION': return <Building2 className="h-5 w-5 text-blue-500"/>;
            case 'BRANCH': return <GitBranch className="h-5 w-5 text-amber-500"/>;
            case 'DEPARTMENT': return <Network className="h-5 w-5 text-indigo-500"/>;
            default: return <Layers className="h-5 w-5 text-slate-500"/>;
        }
    };
    return (<div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
          <Info className="text-blue-500 h-6 w-6"/> Hierarchy Node Details
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
          Inspect full details and hierarchy position for any organizational unit.
        </p>
      </div>

      {/* Lookup Controls */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Node Type</label>
            <select className="form-select text-xs font-semibold" value={nodeType} onChange={e => setNodeType(e.target.value)}>
              <option value="ORGANIZATION">Organization</option>
              <option value="BRANCH">Branch</option>
              <option value="DEPARTMENT">Department</option>
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Node ID</label>
            <input type="number" className="form-control text-xs font-semibold" placeholder="Enter node numeric ID..." value={nodeId} onChange={e => setNodeId(e.target.value)}/>
          </div>
          <div className="col-12 col-md-4">
            <button onClick={fetchNode} disabled={loading || !nodeId} className="btn btn-primary text-xs font-bold w-100 d-flex align-items-center justify-content-center gap-1.5 py-2">
              {loading ? <span className="spinner-border spinner-border-sm"/> : <Info className="h-4 w-4"/>} Inspect Node
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (<div className="alert alert-danger text-xs font-semibold d-flex align-items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Node Detail Card */}
      {nodeData && (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5">
            <div className="d-flex align-items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 d-flex align-items-center justify-content-center shrink-0">
                {getIcon(nodeData.nodeType)}
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">{nodeData.name}</h2>
                <p className="text-white/70 text-xs font-semibold">{nodeData.nodeType} • Level {nodeData.level} • {nodeData.code}</p>
              </div>
            </div>
          </div>

          {/* Breadcrumb Path */}
          <div className="p-4 border-bottom dark:border-slate-800">
            <HierarchyBreadcrumb organizationName={nodeData.nodeType === 'ORGANIZATION' ? nodeData.name : (nodeData.grandparent?.name || nodeData.parent?.name || 'N/A')} branchName={nodeData.nodeType === 'BRANCH' ? nodeData.name : (nodeData.nodeType === 'DEPARTMENT' ? (nodeData.parent?.name || 'N/A') : undefined)} departmentName={nodeData.nodeType === 'DEPARTMENT' ? nodeData.name : undefined}/>
          </div>

          {/* Detail Grid */}
          <div className="p-5 space-y-4">
            <div className="row g-4">
              <div className="col-6 col-md-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Node ID</span>
                <span className="font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-slate-400"/> {nodeData.id}
                </span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Code</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{nodeData.code}</span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Hierarchy Level</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Level {nodeData.level}</span>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Status</span>
                <span className={`badge text-xs font-bold px-2 py-1 rounded-full ${(nodeData.status || '').toUpperCase() === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                  {(nodeData.status || '').toUpperCase() === 'ACTIVE' ? <ShieldCheck className="h-3 w-3 inline me-1"/> : <ShieldAlert className="h-3 w-3 inline me-1"/>}
                  {nodeData.status}
                </span>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-6 col-md-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Children Count</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{nodeData.childrenCount ?? 0}</span>
              </div>

              {nodeData.parent && (<div className="col-6 col-md-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Parent</span>
                  <span className="font-bold text-amber-600 d-flex align-items-center gap-1">
                    {getIcon(nodeData.parent.type)} {nodeData.parent.name}
                  </span>
                </div>)}

              {nodeData.grandparent && (<div className="col-6 col-md-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Grandparent</span>
                  <span className="font-bold text-blue-600 d-flex align-items-center gap-1">
                    {getIcon(nodeData.grandparent.type)} {nodeData.grandparent.name}
                  </span>
                </div>)}

              {nodeData.city && (<div className="col-6 col-md-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">City</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 d-flex align-items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400"/> {nodeData.city}
                  </span>
                </div>)}

              {nodeData.location && (<div className="col-6 col-md-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider d-block mb-1">Office Location</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 d-flex align-items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400"/> {nodeData.location}
                  </span>
                </div>)}
            </div>
          </div>
        </div>)}
    </div>);
}
