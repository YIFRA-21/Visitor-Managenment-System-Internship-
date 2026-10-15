import { useEffect, useState } from 'react';
import { Layers, Edit, ShieldAlert, Clock, Users, ShieldCheck, FileCheck, Key, CheckCircle, XCircle } from 'lucide-react';
import { visitorCategoryApi } from '../../../../modules/visitor-management/api/visitorCategoryApi';
import CategoryStatusBadge from './components/CategoryStatusBadge';
import BackButton from '../../../../components/common/BackButton';
export default function CategoryDetails() {
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId') || '1';
    useEffect(() => {
        setLoading(true);
        visitorCategoryApi.getById(Number(categoryId))
            .then(res => setCategory(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [categoryId]);
    const handleBack = () => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', 'visitor_categories');
        params.delete('categoryId');
        window.location.search = `?${params.toString()}`;
    };
    const handleEdit = () => {
        if (!category)
            return;
        const params = new URLSearchParams(window.location.search);
        params.set('view', 'visitor_categories');
        params.set('editCategoryId', String(category.id));
        window.location.search = `?${params.toString()}`;
    };
    const handleToggleStatus = async () => {
        if (!category)
            return;
        setTogglingStatus(true);
        try {
            if (category.status === 'Archived' || category.is_archived) {
                await visitorCategoryApi.restore(category.id);
            }
            else {
                await visitorCategoryApi.archive(category.id);
            }
            const updated = await visitorCategoryApi.getById(category.id);
            setCategory(updated.data);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setTogglingStatus(false);
        }
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
    if (loading) {
        return <div className="p-20 text-center"><div className="spinner-border text-primary" role="status"/><p className="text-slate-400 text-xs fw-semibold mt-3">Loading category details...</p></div>;
    }
    if (!category) {
        return <div className="alert alert-danger text-xs font-semibold">Category not found or could not be loaded.</div>;
    }
    const boolBadge = (val) => val
        ? <span className="badge bg-success-subtle text-success d-inline-flex align-items-center gap-1 text-[9px] px-2 py-0.5"><CheckCircle className="h-3 w-3"/> Yes</span>
        : <span className="badge bg-danger-subtle text-danger d-inline-flex align-items-center gap-1 text-[9px] px-2 py-0.5"><XCircle className="h-3 w-3"/> No</span>;
    const isArchived = category.status === 'Archived' || category.is_archived;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <BackButton onClick={handleBack} title="Back to Categories" fallbackUrl="/admin/dashboard?view=visitor_categories"/>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Layers className="text-blue-600 h-7 w-7"/> {category.category_name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Category profile: <span className="font-mono text-primary font-bold">{category.category_code}</span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleToggleStatus} disabled={togglingStatus} className="btn btn-outline-warning d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <ShieldAlert className="h-4 w-4"/> {isArchived ? 'Restore Category' : 'Archive Category'}
          </button>
          <button onClick={handleEdit} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Edit className="h-4 w-4"/> Edit Category
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="row g-4">
        {/* General Information */}
        <div className="col-12 col-lg-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">General Information</h3>
            <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Category Name</span><span className="text-slate-800 dark:text-slate-100 font-bold">{category.category_name}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Category Code</span><span className="badge bg-primary-subtle text-primary font-mono text-xxs px-2 py-0.5 rounded">{category.category_code}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Description</span><span className="text-slate-800 dark:text-slate-100 font-bold">{category.description || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Status</span><CategoryStatusBadge status={category.status || 'Active'} size="sm"/></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Display Order</span><span className="text-slate-800 dark:text-slate-100 font-bold">{category.display_order}</span></p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] d-block mb-0.5">Created</span><span className="text-slate-800 dark:text-slate-100 font-bold">{formatDate(category.created_at)}</span></p>
            </div>
          </div>
        </div>

        {/* Duration & Access */}
        <div className="col-12 col-lg-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4">Duration & Access</h3>
            <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="d-flex align-items-start gap-2"><Clock className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Default Visit Duration</span><span className="text-slate-800 dark:text-slate-100 font-bold">{category.default_visit_duration}</span></div></div>
              <div className="d-flex align-items-start gap-2"><Clock className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Maximum Visit Duration</span><span className="text-slate-800 dark:text-slate-100 font-bold">{category.max_visit_duration}</span></div></div>
              <div className="d-flex align-items-start gap-2"><Key className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Access Level</span><span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded">{category.access_level}</span></div></div>
              <div className="d-flex align-items-start gap-2"><Users className="h-4 w-4 text-slate-400 mt-0.5"/><div><span className="text-slate-400 font-bold uppercase text-[9px] d-block">Visitor Count</span><span className="text-slate-800 dark:text-slate-100 font-bold">{category.visitor_count ?? 0} visitors assigned</span></div></div>
            </div>
          </div>
        </div>

        {/* Rules & Permissions */}
        <div className="col-12 col-lg-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4 d-flex align-items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-500"/> Rules & Permissions
            </h3>
            <div className="row g-2 text-xs">
              {[
            { label: 'Approval Required', value: category.approval_required },
            { label: 'Walk-in Allowed', value: category.allow_walkin_visitor },
            { label: 'Repeat Visit', value: category.allow_repeat_visit },
            { label: 'Appointment Required', value: category.appointment_required },
            { label: 'Host Approval', value: category.host_approval_required },
            { label: 'Department Approval', value: category.department_approval_required },
            { label: 'Security Approval', value: category.security_approval_required },
            { label: 'Visitor Pass', value: category.visitor_pass_required },
            { label: 'ID Verification', value: category.identity_verification_required },
            { label: 'Face Verification', value: category.face_verification_required },
            { label: 'Document Verification', value: category.document_verification_required },
            { label: 'Escort Required', value: category.escort_required },
            { label: 'Vehicle Registration', value: category.vehicle_registration_required },
            { label: 'Emergency Contact', value: category.emergency_contact_required },
        ].map((rule, i) => (<div key={i} className="col-6">
                  <div className="d-flex align-items-center justify-content-between bg-slate-900/60 border border-slate-800">
                    <span className="fw-semibold text-slate-500 dark:text-slate-400">{rule.label}</span>
                    {boolBadge(Boolean(rule.value))}
                  </div>
                </div>))}
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="col-12 col-lg-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white pb-2 border-bottom dark:border-slate-800 mb-4 d-flex align-items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-cyan-500"/> Required Documents ({category.documents?.length || 0})
            </h3>
            {category.documents && category.documents.length > 0 ? (<div className="space-y-2">
                {category.documents.map((doc, i) => (<div key={i} className="d-flex align-items-center justify-content-between bg-slate-900/60 rounded p-2.5 border border-slate-800 text-xs">
                    <div>
                      <span className="fw-bold text-slate-100">{doc.document_type}</span>
                      {doc.description && <span className="d-block text-slate-400 text-[9px] mt-0.5">{doc.description}</span>}
                    </div>
                    {doc.is_mandatory
                    ? <span className="badge bg-danger-subtle text-danger text-[9px] px-2 py-0.5">Mandatory</span>
                    : <span className="badge bg-slate-800 text-slate-300 text-[9px] px-2 py-0.5">Optional</span>}
                  </div>))}
              </div>) : (<p className="text-slate-400 text-xs fw-semibold">No documents configured.</p>)}
          </div>
        </div>

        {/* Approval Workflow */}
        <div className="col-12 col-lg-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white pb-2 border-bottom border-slate-800 mb-4 d-flex align-items-center gap-1.5">
              <Layers className="h-4 w-4 text-purple-500"/> Approval Workflow ({category.workflows?.length || 0} Steps)
            </h3>
            {category.workflows && category.workflows.length > 0 ? (<div className="space-y-2">
                {category.workflows.map((wf, i) => (<div key={i} className="d-flex align-items-center gap-3 bg-slate-900/60 rounded p-2.5 border border-slate-800 text-xs">
                    <span className="badge bg-primary fw-bold">#{wf.step_order}</span>
                    <div className="flex-grow-1">
                      <span className="fw-bold text-slate-100">{wf.step_name}</span>
                      <span className="d-block text-slate-400 text-[9px] mt-0.5">Approver: {wf.approver_role}</span>
                    </div>
                    {wf.is_auto_approved
                    ? <span className="badge bg-success-subtle text-success text-[9px] px-2 py-0.5">Auto</span>
                    : <span className="badge bg-warning-subtle text-warning text-[9px] px-2 py-0.5">Manual</span>}
                  </div>))}
              </div>) : (<p className="text-slate-400 text-xs fw-semibold">No workflow configured.</p>)}
          </div>
        </div>

        {/* Access Zones */}
        <div className="col-12 col-lg-6">
          <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white pb-2 border-bottom border-slate-800 mb-4 d-flex align-items-center gap-1.5">
              <Key className="h-4 w-4 text-amber-500"/> Access Zones ({category.access_levels?.length || 0})
            </h3>
            {category.access_levels && category.access_levels.length > 0 ? (<div className="row g-2">
                {category.access_levels.map((acc, i) => (<div key={i} className="col-6">
                    <div className={`d-flex align-items-center justify-content-between rounded p-2 border text-xs fw-semibold ${acc.is_granted ? 'bg-success-subtle border-success text-success' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
                      <span>{acc.location_name}</span>
                      {acc.is_granted ? <CheckCircle className="h-3.5 w-3.5"/> : <XCircle className="h-3.5 w-3.5"/>}
                    </div>
                  </div>))}
              </div>) : (<p className="text-slate-400 text-xs fw-semibold">No access zones configured.</p>)}
          </div>
        </div>
      </div>
    </div>);
}
