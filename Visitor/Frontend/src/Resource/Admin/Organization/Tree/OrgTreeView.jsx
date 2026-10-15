import { useEffect, useState } from 'react';
import { Building, GitBranch, Network, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import api from '../../../../services/api';
import BackButton from '../../../../components/common/BackButton';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
export default function OrgTreeView() {
    const [orgs, setOrgs] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    // Tree nodes expanded tracking state
    const [expandedNodes, setExpandedNodes] = useState({
        'org-1': true // Expand first organization by default
    });
    useEffect(() => {
        fetchTreeData();
    }, []);
    const fetchTreeData = async () => {
        setLoading(true);
        try {
            const orgRes = await api.get('/organizations');
            setOrgs(orgRes.data || []);
            const branchRes = await api.get('/organizations/1/branches');
            setBranches(branchRes.data || []);
            const deptRes = await api.get('/departments');
            setDepartments(deptRes.data || []);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteConfirm = async () => {
        if (!deleteTarget)
            return;
        setDeleting(true);
        try {
            if (deleteTarget.type === 'org') {
                await api.delete(`/organizations/${deleteTarget.id}`);
            }
            else if (deleteTarget.type === 'branch') {
                await api.delete(`/branches/${deleteTarget.id}`);
            }
            else if (deleteTarget.type === 'dept') {
                await api.delete(`/departments/${deleteTarget.id}`);
            }
            setDeleteTarget(null);
            fetchTreeData();
        }
        catch (err) {
            console.error('Delete from tree failed:', err);
        }
        finally {
            setDeleting(false);
        }
    };
    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };
    if (loading) {
        return (<div className="flex justify-center items-center py-20">
        <div className="spinner-border text-primary" role="status"/>
      </div>);
    }
    return (<div className="space-y-6">
      <ConfirmationDialog show={!!deleteTarget} title={`Delete ${deleteTarget?.type === 'org' ? 'Organization' : deleteTarget?.type === 'branch' ? 'Branch' : 'Department'}`} message={`Are you sure you want to delete "${deleteTarget?.name}"?`} confirmLabel="Delete" danger={true} loading={deleting} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}/>

      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton fallbackUrl="/admin/dashboard?view=branches"/>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Network className="text-blue-600 h-7 w-7"/> Organization Chart Tree
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Hierarchical tree structure of organizations, branches, and departments.
          </p>
        </div>
      </div>

      {/* Visual Tree */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="space-y-3 font-semibold text-xs text-slate-700 dark:text-slate-200">
          
          {orgs.map((org) => {
            const orgNodeId = `org-${org.id}`;
            const orgExpanded = expandedNodes[orgNodeId];
            const orgBranches = branches.filter(b => b.organization_id === org.id);
            return (<div key={org.id} className="space-y-2">
                {/* Org Node */}
                <div onClick={() => toggleNode(orgNodeId)} className="d-flex align-items-center justify-content-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit gap-3">
                  <div className="d-flex align-items-center gap-2">
                    {orgExpanded ? <ChevronDown className="h-4 w-4 text-slate-400"/> : <ChevronRight className="h-4 w-4 text-slate-400"/>}
                    <Building className="h-4.5 w-4.5 text-blue-600"/>
                    <span className="font-extrabold">{org.name}</span>
                    <span className="badge bg-primary-subtle text-primary text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">{org.code}</span>
                  </div>
                  <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ type: 'org', id: org.id, name: org.name });
                }} className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 transition-all" title="Delete Organization" aria-label="Delete Organization">
                    <Trash2 className="h-3.5 w-3.5"/>
                  </button>
                </div>

                {/* Branches Container */}
                {orgExpanded && (<div className="ps-6 space-y-2 border-start border-slate-200 dark:border-slate-800 ms-4">
                    {orgBranches.length === 0 ? (<span className="text-slate-400 text-xxs block py-1">No branches registered.</span>) : (orgBranches.map((branch) => {
                        const branchNodeId = `branch-${branch.id}`;
                        const branchExpanded = expandedNodes[branchNodeId];
                        // Map branches relationship using branch_id (or fallback to facility_id if legacy)
                        const branchDepts = departments.filter(d => d.branch_id === branch.id || d.facility_id === branch.id);
                        return (<div key={branch.id} className="space-y-2">
                            {/* Branch Node */}
                            <div onClick={() => toggleNode(branchNodeId)} className="d-flex align-items-center justify-content-between p-1.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors w-fit gap-3">
                              <div className="d-flex align-items-center gap-2">
                                {branchExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400"/> : <ChevronRight className="h-3.5 w-3.5 text-slate-400"/>}
                                <GitBranch className="h-4 w-4 text-emerald-600"/>
                                <span className="font-extrabold">{branch.branch_name}</span>
                              </div>
                              <button type="button" onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ type: 'branch', id: branch.id, name: branch.branch_name });
                            }} className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 transition-all" title="Delete Branch" aria-label="Delete Branch">
                                <Trash2 className="h-3 w-3"/>
                              </button>
                            </div>

                            {/* Departments Container */}
                            {branchExpanded && (<div className="ps-6 space-y-2 border-start border-slate-200 dark:border-slate-800 ms-3">
                                {branchDepts.length === 0 ? (<span className="text-slate-400 text-xxs block py-1">No departments assigned.</span>) : (branchDepts.map((dept) => (<div key={dept.id} className="d-flex align-items-center justify-content-between py-1 text-slate-600 dark:text-slate-300 w-fit gap-3">
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="border-bottom border-slate-200 dark:border-slate-800 w-3 h-0.5 inline-block shrink-0"/>
                                        <Network className="h-3.5 w-3.5 text-purple-600 shrink-0"/>
                                        <span>{dept.department_name}</span>
                                        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] uppercase font-bold px-1.5 py-0.5 rounded">
                                          {dept.department_code}
                                        </span>
                                      </div>
                                      <button type="button" onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTarget({ type: 'dept', id: dept.id, name: dept.department_name });
                                    }} className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 transition-all" title="Delete Department" aria-label="Delete Department">
                                        <Trash2 className="h-3 w-3"/>
                                      </button>
                                    </div>)))}
                              </div>)}
                          </div>);
                    }))}
                  </div>)}
              </div>);
        })}

        </div>
      </div>

    </div>);
}
