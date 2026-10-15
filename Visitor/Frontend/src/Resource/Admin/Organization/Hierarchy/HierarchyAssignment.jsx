import { useState, useEffect } from 'react';
import { GitBranch, Save, AlertCircle, CheckCircle2, Network } from 'lucide-react';
import api from '../../../../services/api';
export default function HierarchyAssignment() {
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        targetType: 'DEPARTMENT',
        organizationId: '',
        branchId: '',
        departmentId: '',
        parentBranchId: '',
        hierarchyLevel: '3'
    });
    useEffect(() => {
        Promise.all([
            api.get('/organizations/search?limit=100'),
            api.get('/branches/search?limit=100'),
            api.get('/departments/search?limit=100')
        ]).then(([orgRes, branchRes, deptRes]) => {
            const allOrgs = orgRes.data.data || [];
            const allBranches = branchRes.data.data || [];
            const allDepts = deptRes.data.data || [];
            // STRICT: Only show ACTIVE organizations and their related data
            const activeOrgs = allOrgs.filter((org) => (org.status || '').toUpperCase() === 'ACTIVE');
            const activeOrgNames = new Set(activeOrgs.map((o) => o.name || o.organization_name));
            setOrganizations(activeOrgs);
            setBranches(allBranches.filter((b) => {
                const orgName = (b.organizationName || '').trim();
                return !orgName || activeOrgNames.has(orgName);
            }));
            setDepartments(allDepts.filter((d) => {
                const orgName = (d.organizationName || d.organization_name || '').trim();
                return !orgName || activeOrgNames.has(orgName);
            }));
        }).catch(console.error);
    }, []);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess('');
        setError('');
        if (formData.targetType === 'DEPARTMENT' && (!formData.departmentId || !formData.parentBranchId)) {
            setError('Please select both a department and a parent branch.');
            setSaving(false);
            return;
        }
        if (formData.targetType === 'BRANCH' && (!formData.branchId || !formData.organizationId)) {
            setError('Please select both a branch and a parent organization.');
            setSaving(false);
            return;
        }
        try {
            const payload = {
                id: formData.targetType === 'DEPARTMENT' ? formData.departmentId : formData.branchId,
                nodeType: formData.targetType,
                parentId: formData.targetType === 'DEPARTMENT' ? formData.parentBranchId : formData.organizationId,
                organizationId: formData.organizationId
            };
            await api.post('/hierarchy/assign', payload);
            setSuccess('Hierarchy assignment saved successfully!');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save hierarchy assignment.');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
          <GitBranch className="text-amber-500 h-6 w-6"/> Hierarchy Assignment Configuration
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
          Configure parent-child structural relationships across Organizations, Branches, and Departments.
        </p>
      </div>

      {success && (<div className="alert alert-success d-flex align-items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0"/> {success}
        </div>)}
      {error && (<div className="alert alert-danger d-flex align-items-center gap-2 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Assignment Form Card */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <label className="form-label font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            Assignment Target Type
          </label>
          <div className="d-flex gap-3 mt-1">
            <label className={`btn text-xs font-bold px-4 py-2 border rounded-xl d-flex align-items-center gap-2 ${formData.targetType === 'DEPARTMENT' ? 'btn-primary' : 'btn-outline-secondary'}`}>
              <input type="radio" name="targetType" value="DEPARTMENT" checked={formData.targetType === 'DEPARTMENT'} onChange={handleChange} className="d-none"/>
              <Network className="h-4 w-4"/> Department → Branch
            </label>
            <label className={`btn text-xs font-bold px-4 py-2 border rounded-xl d-flex align-items-center gap-2 ${formData.targetType === 'BRANCH' ? 'btn-primary' : 'btn-outline-secondary'}`}>
              <input type="radio" name="targetType" value="BRANCH" checked={formData.targetType === 'BRANCH'} onChange={handleChange} className="d-none"/>
              <GitBranch className="h-4 w-4"/> Branch → Organization
            </label>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Parent Organization *</label>
            <select name="organizationId" className="form-select text-xs font-semibold" value={formData.organizationId} onChange={handleChange}>
              <option value="">Select Organization...</option>
              {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {formData.targetType === 'DEPARTMENT' ? (<>
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">Parent Branch *</label>
                <select name="parentBranchId" className="form-select text-xs font-semibold" value={formData.parentBranchId} onChange={handleChange}>
                  <option value="">Select Parent Branch...</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode})</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-xxs uppercase text-slate-400">Target Department to Assign *</label>
                <select name="departmentId" className="form-select text-xs font-semibold" value={formData.departmentId} onChange={handleChange}>
                  <option value="">Select Department...</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.departmentName} ({d.departmentCode})</option>)}
                </select>
              </div>
            </>) : (<div className="col-12 col-md-6">
              <label className="form-label font-bold text-xxs uppercase text-slate-400">Target Branch to Assign *</label>
              <select name="branchId" className="form-select text-xs font-semibold" value={formData.branchId} onChange={handleChange}>
                <option value="">Select Target Branch...</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName} ({b.branchCode})</option>)}
              </select>
            </div>)}

          <div className="col-12 col-md-6">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Hierarchy Depth Level</label>
            <input type="text" className="form-control text-xs font-semibold bg-slate-50" value={formData.targetType === 'DEPARTMENT' ? 'Level 3 (Department)' : 'Level 2 (Branch)'} readOnly/>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 border-top pt-4 dark:border-slate-800">
          <button type="button" onClick={() => setFormData({ targetType: 'DEPARTMENT', organizationId: '', branchId: '', departmentId: '', parentBranchId: '', hierarchyLevel: '3' })} className="btn btn-outline-secondary text-xs font-bold px-4 py-2">
            Reset
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary text-xs font-bold px-4 py-2 d-flex align-items-center gap-1.5">
            {saving ? <span className="spinner-border spinner-border-sm"/> : <Save className="h-4 w-4"/>} Save Assignment
          </button>
        </div>
      </form>
    </div>);
}
