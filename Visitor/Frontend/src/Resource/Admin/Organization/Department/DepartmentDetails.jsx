import { useEffect, useState } from 'react';
import { ArrowLeft, Network, ShieldAlert, Edit, Phone, MapPin, Clock, Calendar, Trash2 } from 'lucide-react';
import api from '../../../../services/api';
import DepartmentStatusBadge from './components/DepartmentStatusBadge';
import ConfirmationDialog from '../Profile/components/ConfirmationDialog';
const SHORT_DAYS = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
    FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};
export default function DepartmentDetails() {
    const [dept, setDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const deptId = urlParams.get('deptId') || '1';
    useEffect(() => {
        setLoading(true);
        api.get(`/departments/${deptId}`)
            .then(res => setDept(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [deptId]);
    const handleNav = (viewKey, id) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        if (id)
            params.set('deptId', String(id));
        else
            params.delete('deptId');
        window.location.search = `?${params.toString()}`;
    };
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        catch {
            return dateStr;
        }
    };
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/departments/${dept.id}`);
            setShowDeleteModal(false);
            handleNav('departments_mgmt');
        }
        catch (err) {
            console.error('Delete department failed:', err);
        }
        finally {
            setDeleting(false);
        }
    };
    if (loading) {
        return (<div className="p-20 text-center">
        <div className="spinner-border text-primary" role="status"/>
        <p className="text-slate-400 text-xs fw-semibold mt-3">Loading department details...</p>
      </div>);
    }
    if (!dept) {
        return <div className="alert alert-danger text-xs font-semibold">Department not found or could not be loaded.</div>;
    }
    return (<div className="space-y-6">
      <ConfirmationDialog show={showDeleteModal} title="Delete Department" message={`Are you sure you want to delete department "${dept.departmentName}"?`} confirmLabel="Delete Department" danger={true} loading={deleting} onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)}/>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => handleNav('departments_mgmt')} className="btn btn-outline-secondary btn-sm p-2">
            <ArrowLeft className="h-4.5 w-4.5"/>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Network className="text-indigo-600 h-7 w-7"/> {dept.departmentName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Read-only profile for department: <span className="font-mono text-primary font-bold">{dept.departmentCode}</span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => handleNav('dept_status', dept.id)} className="btn btn-outline-warning d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <ShieldAlert className="h-4 w-4"/> Manage Status
          </button>
          <button onClick={() => handleNav('dept_edit', dept.id)} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Edit className="h-4 w-4"/> Edit Department
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-outline-danger d-flex align-items-center gap-2 text-xs font-bold px-3 py-2" title="Delete Department" aria-label="Delete Department">
            <Trash2 className="h-4 w-4"/> Delete Department
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
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Department Name</span><span className="text-slate-800 dark:text-slate-100 font-bold">{dept.departmentName}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Department Code</span><span className="badge bg-primary-subtle text-primary font-mono text-xxs px-2 py-0.5 rounded">{dept.departmentCode}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Organization</span><span className="text-slate-800 dark:text-slate-100 font-bold">{dept.organizationName || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Branch</span><span className="text-slate-800 dark:text-slate-100 font-bold">{dept.branchName || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Department Type</span><span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">{dept.departmentType || 'OTHER'}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Status</span><DepartmentStatusBadge status={dept.status || 'ACTIVE'} size="sm"/></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Created</span><span className="text-slate-800 dark:text-slate-100 font-bold">{formatDate(dept.created_at)}</span></p>
            </div>
          </div>
        </div>

        {/* Operational Info */}
        <div className="col-12 col-lg-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">Operational Information</h3>
            <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="d-flex align-items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5"/>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Office Location</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{dept.officeLocation || 'N/A'}</span>
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Floor</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{dept.floor || 'N/A'}</span>
                </div>
                <div className="col-6">
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Office Number</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{dept.officeNumber || 'N/A'}</span>
                </div>
              </div>
              <div className="d-flex align-items-start gap-2">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5"/>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Telephone Extension</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{dept.telephoneExtension || 'N/A'}</span>
                </div>
              </div>
              {dept.description && (<div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-1">Description</span>
                  <p className="text-slate-600 dark:text-slate-300 mb-0 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-100 dark:border-slate-800">{dept.description}</p>
                </div>)}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="col-12">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">Working Schedule</h3>
            <div className="row g-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="col-12 col-md-6">
                <div className="d-flex align-items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Working Days</span>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {(dept.workingDays || []).map((d) => (<span key={d} className="badge bg-primary-subtle text-primary text-[9px] font-bold px-2 py-0.5 rounded-pill">
                          {SHORT_DAYS[d] || d}
                        </span>))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="d-flex align-items-start gap-2">
                  <Clock className="h-4 w-4 text-slate-400 mt-0.5"/>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Schedule Hours</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold">{dept.openingTime || '08:30'} — {dept.closingTime || '17:30'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
