import { useEffect, useState } from 'react';
import { ArrowLeft, Building, Mail, Phone, Globe, MapPin, Clock, Edit, ShieldAlert, Compass, ExternalLink, Trash2 } from 'lucide-react';
import api from '../../../../services/api';
import OrganizationStatusBadge from '../Profile/components/OrganizationStatusBadge';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
export default function OrgDetails() {
    const [org, setOrg] = useState(null);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get('orgId') || '1';
    useEffect(() => {
        fetchDetails();
    }, [orgId]);
    const fetchDetails = async () => {
        setLoading(true);
        try {
            const orgRes = await api.get(`/organizations/${orgId}`);
            setOrg(orgRes.data);
            const branchRes = await api.get(`/organizations/${orgId}/branches`);
            setBranches(branchRes.data || []);
            const deptRes = await api.get('/departments');
            // Filter departments related to this organization's branches
            const branchIds = (branchRes.data || []).map((b) => b.id);
            const filteredDepts = (deptRes.data || []).filter((d) => branchIds.includes(d.branch_id));
            setDepartments(filteredDepts);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleNav = (viewKey, id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        if (id) {
            params.set('orgId', String(id));
        }
        else {
            params.delete('orgId');
        }
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        catch {
            return dateStr;
        }
    };
    const handleDeleteConfirm = async () => {
        if (!deleteTarget)
            return;
        setDeleting(true);
        try {
            if (deleteTarget.type === 'org') {
                await api.delete(`/organizations/${deleteTarget.id}`);
                setDeleteTarget(null);
                handleNav('organizations');
                return;
            }
            else if (deleteTarget.type === 'branch') {
                await api.delete(`/branches/${deleteTarget.id}`);
                setDeleteTarget(null);
                fetchDetails();
            }
            else if (deleteTarget.type === 'dept') {
                await api.delete(`/departments/${deleteTarget.id}`);
                setDeleteTarget(null);
                fetchDetails();
            }
        }
        catch (err) {
            console.error('Delete failed:', err);
        }
        finally {
            setDeleting(false);
        }
    };
    if (loading) {
        return (<div className="p-20 text-center">
        <div className="spinner-border text-primary" role="status"/>
        <p className="text-slate-400 text-xs fw-semibold mt-3">Loading details...</p>
      </div>);
    }
    if (!org) {
        return (<div className="alert alert-danger text-xs font-semibold" role="alert">
        Organization profile could not be resolved.
      </div>);
    }
    return (<div className="space-y-6">
      <ConfirmationDialog show={!!deleteTarget} title={`Delete ${deleteTarget?.type === 'org' ? 'Organization' : deleteTarget?.type === 'branch' ? 'Branch' : 'Department'}`} message={`Are you sure you want to delete "${deleteTarget?.name}"?`} confirmLabel="Delete" danger={true} loading={deleting} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)}/>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => handleNav('organizations')} className="btn btn-outline-secondary btn-sm p-2">
            <ArrowLeft className="h-4.5 w-4.5"/>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              {org.logo_url ? (<img src={org.logo_url} alt={org.name} className="w-8 h-8 object-contain rounded-lg p-0.5 bg-white border border-slate-200 dark:border-slate-700 shadow-sm"/>) : (<Building className="text-blue-600 h-7 w-7"/>)}
              {org.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Read-only profile specifications for node: <span className="font-mono text-primary font-bold">{org.code}</span>.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => handleNav('org_status', org.id)} className="btn btn-outline-warning d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <ShieldAlert className="h-4 w-4"/> Manage Status
          </button>
          <button onClick={() => handleNav('org_edit', org.id)} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Edit className="h-4 w-4"/> Edit Profile
          </button>
          <button onClick={() => setDeleteTarget({ type: 'org', id: org.id, name: org.name })} className="btn btn-outline-danger d-flex align-items-center gap-2 text-xs font-bold px-3 py-2" title="Delete Organization" aria-label="Delete Organization">
            <Trash2 className="h-4 w-4"/> Delete Organization
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-bottom border-slate-200 dark:border-slate-800">
        <div className="d-flex gap-4">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'branches', label: `Branches (${branches.length})` },
            { key: 'departments', label: `Departments (${departments.length})` },
            { key: 'audit', label: 'Audit Trail' }
        ].map((t) => (<button key={t.key} onClick={() => setActiveTab(t.key)} className={`pb-2 text-xs font-bold uppercase tracking-wider ${activeTab === t.key
                ? 'border-bottom border-2 border-primary text-primary'
                : 'text-slate-400 hover:text-slate-600 border-bottom border-2 border-transparent'}`}>
              {t.label}
            </button>))}
        </div>
      </div>

      {/* Tab Area Content */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        {/* Overview Tab */}
        {activeTab === 'overview' && (<div className="row g-4">
            {/* General Info */}
            <div className="col-12 col-md-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800">
                General Profile
              </h3>
              <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <p>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Official Name</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{org.name}</span>
                </p>
                {org.short_name && (<p>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Short / Alias</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold">{org.short_name}</span>
                  </p>)}
                <p>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Organization Code</span>
                  <span className="badge bg-primary-subtle text-primary font-mono text-xxs px-2 py-0.5 rounded">{org.code}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Business Type</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{org.business_type || 'CORPORATION'}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Registration Number</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{org.registration_number || 'N/A'}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Tax Card TIN</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{org.tax_number || 'N/A'}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">System Status</span>
                  <OrganizationStatusBadge status={org.status || 'ACTIVE'} size="sm"/>
                </p>
              </div>
            </div>

            {/* Contact & Address */}
            <div className="col-12 col-md-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800">
                Contact & Address
              </h3>
              <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="d-flex align-items-start gap-2">
                  <Mail className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Official Email</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold">{org.email || 'N/A'}</span>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Contact Phone</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold">{org.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <Globe className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Website Address</span>
                    {org.website ? (<a href={org.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold d-inline-flex align-items-center gap-1">
                        {org.website} <ExternalLink className="h-3 w-3"/>
                      </a>) : (<span className="text-slate-800 dark:text-slate-100 font-bold">N/A</span>)}
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Street Address</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold">{org.address || 'N/A'}</span>
                    <span className="text-slate-500 d-block text-xxs mt-0.5">
                      {[org.city, org.region, org.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <Compass className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Time Zone & Language</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold">
                      {org.timezone || 'Africa/Addis_Ababa'} ({org.language === 'am' ? 'Amharic' : 'English'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>)}

        {/* Branches Tab (Read Only Reference) */}
        {activeTab === 'branches' && (<div className="space-y-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
                Campus Branches (Read Only Reference)
              </h3>
              <button onClick={() => handleNav('branches')} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 text-xxs font-bold">
                Go to Branch Management <ExternalLink className="h-3 w-3"/>
              </button>
            </div>

            {branches.length === 0 ? (<p className="text-slate-400 text-xs fw-semibold">No branches configured for this organization.</p>) : (<div className="table-responsive">
                <table className="table align-middle text-xs mb-0">
                  <thead>
                    <tr className="text-slate-500 uppercase font-bold text-[9px]">
                      <th>Code</th>
                      <th>Branch Name</th>
                      <th>Physical Location</th>
                      <th>Time Zone</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    {branches.map((b) => (<tr key={b.id}>
                        <td className="font-mono text-primary font-bold">{b.branch_code}</td>
                        <td className="font-extrabold">{b.branch_name}</td>
                        <td>{b.address || 'Headquarters'}</td>
                        <td>{b.timezone}</td>
                        <td>
                          <span className={`badge text-xxs px-2 py-0.5 rounded font-bold uppercase ${b.status === 'INACTIVE'
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        : b.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-success-subtle text-success'}`}>
                            {b.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button onClick={() => setDeleteTarget({ type: 'branch', id: b.id, name: b.branch_name })} className="btn btn-sm btn-outline-danger p-1" title="Delete Branch" aria-label="Delete Branch">
                            <Trash2 className="h-3.5 w-3.5"/>
                          </button>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>)}
          </div>)}

        {/* Departments Tab (Read Only Reference) */}
        {activeTab === 'departments' && (<div className="space-y-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
                Divisions & Departments (Read Only Reference)
              </h3>
              <button onClick={() => handleNav('departments_mgmt')} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 text-xxs font-bold">
                Go to Department Management <ExternalLink className="h-3 w-3"/>
              </button>
            </div>

            {departments.length === 0 ? (<p className="text-slate-400 text-xs fw-semibold">No departments resolved for this organization's campuses.</p>) : (<div className="table-responsive">
                <table className="table align-middle text-xs mb-0">
                  <thead>
                    <tr className="text-slate-500 uppercase font-bold text-[9px]">
                      <th>Code</th>
                      <th>Department Name</th>
                      <th>Description</th>
                      <th>Location Coordinate</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    {departments.map((d) => (<tr key={d.id}>
                        <td className="font-mono text-primary font-bold">{d.department_code}</td>
                        <td className="font-extrabold">{d.department_name}</td>
                        <td>{d.description || 'N/A'}</td>
                        <td>{d.location || 'HQ Office'}</td>
                        <td>
                          <span className={`badge text-xxs px-2 py-0.5 rounded font-bold uppercase ${d.status === 'INACTIVE'
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        : d.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-success-subtle text-success'}`}>
                            {d.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button onClick={() => setDeleteTarget({ type: 'dept', id: d.id, name: d.department_name })} className="btn btn-sm btn-outline-danger p-1" title="Delete Department" aria-label="Delete Department">
                            <Trash2 className="h-3.5 w-3.5"/>
                          </button>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>)}
          </div>)}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (<div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800">
              System Audit Timeline (Read Only)
            </h3>
            <div className="space-y-3">
              <div className="d-flex gap-3 align-items-start border-bottom dark:border-slate-800 pb-2.5">
                <Clock className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0"/>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                    Organization Profile <span className="font-bold text-primary">{org.code}</span> registered.
                  </p>
                  <span className="text-[10px] text-slate-400 block">{formatDate(org.created_at)} — User: Admin</span>
                </div>
              </div>
              <div className="d-flex gap-3 align-items-start">
                <Clock className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0"/>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                    System profile initialization finalized.
                  </p>
                  <span className="text-[10px] text-slate-400 block">{formatDate(org.created_at)} — User: System</span>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}
