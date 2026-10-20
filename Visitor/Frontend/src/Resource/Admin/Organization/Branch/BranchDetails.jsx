import { useEffect, useState } from 'react';
import { ArrowLeft, GitBranch, Mail, Phone, Globe, MapPin, Clock, Edit, ShieldAlert, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import api from '../../../../services/api';
import BranchStatusBadge from './components/BranchStatusBadge';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
import useResponseNavigation from '../../../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../../../modules/response/responseConfig';

const SHORT_DAYS = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
    FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};
export default function BranchDetails() {
    const { toConfirmation } = useResponseNavigation();
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get('branchId') || '1';
    useEffect(() => {
        setLoading(true);
        api.get(`/branches/${branchId}`)
            .then(res => setBranch(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [branchId]);
    const handleNav = (viewKey, id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        if (id)
            params.set('branchId', String(id));
        else
            params.delete('branchId');
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        catch {
            return dateStr;
        }
    };
    const handleDelete = () => {
        if (!branch) return;
        toConfirmation({
            title: `Delete Branch "${branch.branchName}"`,
            message: `Are you sure you want to permanently delete branch "${branch.branchName}" (${branch.branchCode})?`,
            entityType: 'Branch Office',
            entityName: branch.branchName,
            entityId: branch.id,
            consequences: [
                'Departments and personnel associated with this branch must be reassigned.',
                'Active visitor pass checkpoints for this branch facility will be deactivated.'
            ],
            confirmLabel: 'Delete Branch',
            confirmVariant: 'danger',
            apiEndpoint: `/branches/${branch.id}`,
            apiMethod: 'DELETE',
            returnUrl: '/admin/dashboard?view=branches',
            successConfig: {
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Branch Deleted',
                message: `Branch "${branch.branchName}" was permanently removed from the organization.`,
            }
        });
    };
    if (loading) {
        return <div className="p-20 text-center"><div className="spinner-border text-primary" role="status"/><p className="text-slate-400 text-xs fw-semibold mt-3">Loading branch details...</p></div>;
    }
    if (!branch) {
        return <div className="alert alert-danger text-xs font-semibold">Branch not found or could not be loaded.</div>;
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => handleNav('branches')} className="btn btn-outline-secondary btn-sm p-2">
            <ArrowLeft className="h-4.5 w-4.5"/>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <GitBranch className="text-blue-600 h-7 w-7"/> {branch.branchName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Read-only profile for branch: <span className="font-mono text-primary font-bold">{branch.branchCode}</span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => handleNav('branch_status', branch.id)} className="btn btn-outline-warning d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <ShieldAlert className="h-4 w-4"/> Manage Status
          </button>
          <button onClick={() => handleNav('branch_edit', branch.id)} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Edit className="h-4 w-4"/> Edit Branch
          </button>
          <button onClick={handleDelete} className="btn btn-outline-danger d-flex align-items-center gap-2 text-xs font-bold px-3 py-2" title="Delete Branch" aria-label="Delete Branch">
            <Trash2 className="h-4 w-4"/> Delete Branch
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="row g-4">
        {/* General Info */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">General Information</h3>
            <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Branch Name</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.branchName}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Branch Code</span><span className="badge bg-primary-subtle text-primary font-mono text-xxs px-2 py-0.5 rounded">{branch.branchCode}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Organization</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.organizationName || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Branch Type</span><span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">{branch.branchType || 'OFFICE'}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Status</span><BranchStatusBadge status={branch.status || 'ACTIVE'} size="sm"/></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Created</span><span className="text-slate-800 dark:text-slate-100 font-bold">{formatDate(branch.created_at)}</span></p>
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">Contact & Address</h3>
            <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="d-flex align-items-start gap-2"><Mail className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Email</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.email || 'N/A'}</span></div></div>
              <div className="d-flex align-items-start gap-2"><Phone className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Phone</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.phone || 'N/A'}</span></div></div>
              <div className="d-flex align-items-start gap-2"><Globe className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Website</span>{branch.website ? <a href={branch.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold d-inline-flex align-items-center gap-1">{branch.website} <ExternalLink className="h-3 w-3"/></a> : <span className="font-bold">N/A</span>}</div></div>
              <div className="d-flex align-items-start gap-2"><MapPin className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Address</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.address || 'N/A'}</span><span className="text-slate-500 d-block text-xxs mt-0.5">{[branch.subCity, branch.woreda && `Woreda ${branch.woreda}`, branch.city, branch.region, branch.country].filter(Boolean).join(', ')}</span></div></div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="col-12">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">Operating Hours</h3>
            <div className="row g-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-start gap-2"><Calendar className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Working Days</span><div className="d-flex flex-wrap gap-1 mt-1">{(branch.workingDays || []).map((d) => <span key={d} className="badge bg-primary-subtle text-primary text-[9px] font-bold px-2 py-0.5 rounded-pill">{SHORT_DAYS[d] || d}</span>)}</div></div></div>
              </div>
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-start gap-2"><Clock className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Schedule</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.openingTime || '08:30'} — {branch.closingTime || '17:30'}</span></div></div>
              </div>
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-start gap-2"><Globe className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Time Zone</span><span className="text-slate-800 dark:text-slate-100 font-bold">{branch.timezone || 'Africa/Addis_Ababa'}</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
