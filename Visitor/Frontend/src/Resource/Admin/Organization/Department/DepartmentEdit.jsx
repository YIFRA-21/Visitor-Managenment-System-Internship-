import { useEffect, useState } from 'react';
import { ArrowLeft, Network, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../../services/api';
const SHORT_DAYS = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun' };
const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
export default function DepartmentEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const deptId = urlParams.get('deptId') || '';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [original, setOriginal] = useState(null);
    const [formData, setFormData] = useState({
        departmentName: '', departmentCode: '', organizationId: '', branchId: '',
        departmentType: 'ADMINISTRATIVE',
        officeLocation: '', floor: '', officeNumber: '', telephoneExtension: '', description: '',
        workingDays: [], openingTime: '', closingTime: '',
    });
    useEffect(() => {
        Promise.all([
            api.get(`/departments/${deptId}`),
            api.get('/organizations/search?limit=100'),
        ]).then(([deptRes, orgRes]) => {
            const d = deptRes.data;
            const state = {
                departmentName: d.departmentName || '', departmentCode: d.departmentCode || '',
                organizationId: String(d.organizationId || ''), branchId: String(d.branchId || ''),
                departmentType: d.departmentType || 'ADMINISTRATIVE',
                officeLocation: d.officeLocation || '', floor: d.floor || '',
                officeNumber: d.officeNumber || '', telephoneExtension: d.telephoneExtension || '',
                description: d.description || '', workingDays: d.workingDays || [],
                openingTime: d.openingTime || '', closingTime: d.closingTime || '',
            };
            setFormData(state);
            setOriginal(state);
            // STRICT: Only show ACTIVE organizations
            const allOrgs = orgRes.data.data || [];
            setOrganizations(allOrgs.filter((org) => (org.status || '').toUpperCase() === 'ACTIVE'));
            // Load branch list for this org
            if (d.organizationId) {
                api.get(`/branches/search?organizationId=${d.organizationId}&limit=100`)
                    .then(r => {
                    const list = r.data.data || [];
                    if (list.length > 0)
                        setBranches(list);
                    else
                        api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([]));
                })
                    .catch(() => api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([])));
            }
            else {
                api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([]));
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, [deptId]);
    // Load branches dynamically on org select
    useEffect(() => {
        if (!loading && formData.organizationId) {
            api.get(`/branches/search?organizationId=${formData.organizationId}&limit=100`)
                .then(r => {
                const list = r.data.data || [];
                if (list.length > 0)
                    setBranches(list);
                else
                    api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([]));
            })
                .catch(() => api.get('/branches/search?limit=100').then(res => setBranches(res.data.data || [])).catch(() => setBranches([])));
        }
    }, [formData.organizationId, loading]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name])
            setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };
    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            workingDays: prev.workingDays.includes(day) ? prev.workingDays.filter(d => d !== day) : [...prev.workingDays, day],
        }));
    };
    const handleReset = () => {
        if (original)
            setFormData(original);
        setFieldErrors({});
        setError('');
        setSuccess('');
    };
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        // Validation
        const errors = {};
        if (!formData.departmentName.trim())
            errors.departmentName = 'Department Name is required.';
        if (!formData.officeLocation.trim())
            errors.officeLocation = 'Office location is required.';
        if (formData.workingDays.length === 0)
            errors.workingDays = 'Select at least one working day.';
        if (formData.openingTime && formData.closingTime) {
            const [oH, oM] = formData.openingTime.split(':').map(Number);
            const [cH, cM] = formData.closingTime.split(':').map(Number);
            if (cH * 60 + cM <= oH * 60 + oM)
                errors.closingTime = 'Closing time must be after opening time.';
        }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setSaving(false);
            return;
        }
        try {
            await api.put(`/departments/${deptId}`, {
                ...formData,
                organizationId: Number(formData.organizationId),
                branchId: Number(formData.branchId)
            });
            setSuccess('Department profile updated successfully.');
            setTimeout(() => setSuccess(''), 5000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update department profile.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleNav = (viewKey) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewKey);
        window.location.search = `?${params.toString()}`;
    };
    const renderFieldError = (field) => {
        if (!fieldErrors[field])
            return null;
        return <div className="text-danger text-xs mt-1 fw-semibold">{fieldErrors[field]}</div>;
    };
    if (loading) {
        return (<div className="p-20 text-center">
        <div className="spinner-border text-primary" role="status"/>
        <p className="text-slate-400 text-xs fw-semibold mt-3">Loading department data...</p>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => handleNav('dept_details')} className="btn btn-outline-secondary btn-sm p-2">
            <ArrowLeft className="h-4.5 w-4.5"/>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <Network className="text-indigo-600 h-7 w-7"/> Edit Department
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Update profile for <span className="font-mono text-primary font-bold">{formData.departmentCode}</span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleReset} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <RotateCcw className="h-4 w-4"/> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2">
            <Save className="h-4 w-4"/> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger text-xs font-semibold py-2.5 d-flex align-items-center gap-2"><AlertCircle className="h-4 w-4"/>{error}</div>}
      {success && <div className="alert alert-success text-xs font-semibold py-2.5 d-flex align-items-center gap-2"><CheckCircle className="h-4 w-4"/>{success}</div>}

      {/* General Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">General Information</h4>
        <div className="row g-3">
          <div className="col-12 col-md-5">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Department Name *</label>
            <input type="text" name="departmentName" className={`form-control text-xs font-semibold ${fieldErrors.departmentName ? 'is-invalid' : ''}`} value={formData.departmentName} onChange={handleChange}/>
            {renderFieldError('departmentName')}
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Department Code</label>
            <input type="text" name="departmentCode" className="form-control text-xs font-semibold font-monospace text-uppercase" value={formData.departmentCode} disabled/>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Department Type</label>
            <select name="departmentType" className="form-select text-xs font-semibold" value={formData.departmentType} onChange={handleChange}>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OPERATIONS">Operations</option>
              <option value="SUPPORT">Support</option>
              <option value="FINANCE">Finance</option>
              <option value="HR">HR</option>
              <option value="LEGAL">Legal</option>
              <option value="EXECUTIVE">Executive</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Organization</label>
            <select name="organizationId" className="form-select text-xs font-semibold" value={formData.organizationId} onChange={handleChange}>
              <option value="">Select...</option>
              {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Branch</label>
            <select name="branchId" className="form-select text-xs font-semibold" value={formData.branchId} onChange={handleChange} disabled={!formData.organizationId}>
              <option value="">Select Branch...</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Operational Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">Operational Information</h4>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Office Location *</label>
            <input type="text" name="officeLocation" className={`form-control text-xs font-semibold ${fieldErrors.officeLocation ? 'is-invalid' : ''}`} value={formData.officeLocation} onChange={handleChange}/>
            {renderFieldError('officeLocation')}
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Floor</label>
            <input type="text" name="floor" className="form-control text-xs font-semibold" value={formData.floor} onChange={handleChange}/>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Office Number</label>
            <input type="text" name="officeNumber" className="form-control text-xs font-semibold" value={formData.officeNumber} onChange={handleChange}/>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Telephone Extension</label>
            <input type="text" name="telephoneExtension" className="form-control text-xs font-semibold" value={formData.telephoneExtension} onChange={handleChange}/>
          </div>
          <div className="col-12 col-md-8">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Description</label>
            <textarea name="description" className="form-control text-xs font-semibold" rows={3} value={formData.description} onChange={handleChange}/>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">Working Schedule</h4>
        <div className="space-y-4">
          <div>
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Working Days *</label>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {ALL_DAYS.map(day => (<button key={day} type="button" onClick={() => toggleDay(day)} className={`btn btn-sm text-xs fw-bold px-3 py-1.5 rounded-pill ${formData.workingDays.includes(day) ? 'btn-primary' : 'btn-outline-secondary'}`}>
                  {SHORT_DAYS[day]}
                </button>))}
            </div>
            {renderFieldError('workingDays')}
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label font-bold text-xxs uppercase text-slate-400">Opening Time</label>
              <input type="time" name="openingTime" className="form-control text-xs font-semibold" value={formData.openingTime} onChange={handleChange}/>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label font-bold text-xxs uppercase text-slate-400">Closing Time</label>
              <input type="time" name="closingTime" className={`form-control text-xs font-semibold ${fieldErrors.closingTime ? 'is-invalid' : ''}`} value={formData.closingTime} onChange={handleChange}/>
              {renderFieldError('closingTime')}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
