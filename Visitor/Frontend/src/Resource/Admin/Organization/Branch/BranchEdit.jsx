import { useEffect, useState } from 'react';
import { ArrowLeft, GitBranch, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../../services/api';
import OperatingHoursForm from './components/OperatingHoursForm';
import CountryNationalitySelect from '../../../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../../../components/common/CountryPhoneInput';
export default function BranchEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get('branchId') || '';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [organizations, setOrganizations] = useState([]);
    const [original, setOriginal] = useState(null);
    const [formData, setFormData] = useState({
        branchName: '', branchCode: '', organizationId: '', branchType: 'OFFICE',
        email: '', phone: '', website: '',
        country: '', region: '', city: '', subCity: '', woreda: '', postalCode: '', address: '',
        workingDays: [], openingTime: '', closingTime: '', timezone: 'Africa/Addis_Ababa',
    });
    useEffect(() => {
        Promise.all([
            api.get(`/branches/${branchId}`),
            api.get('/organizations/search?limit=100'),
        ]).then(([branchRes, orgRes]) => {
            const b = branchRes.data;
            const state = {
                branchName: b.branchName || '', branchCode: b.branchCode || '',
                organizationId: String(b.organizationId || ''), branchType: b.branchType || 'OFFICE',
                email: b.email || '', phone: b.phone || '', website: b.website || '',
                country: b.country || '', region: b.region || '', city: b.city || '',
                subCity: b.subCity || '', woreda: b.woreda || '', postalCode: b.postalCode || '', address: b.address || '',
                workingDays: b.workingDays || [], openingTime: b.openingTime || '', closingTime: b.closingTime || '',
                timezone: b.timezone || 'Africa/Addis_Ababa',
            };
            setFormData(state);
            setOriginal(state);
            // STRICT: Only show ACTIVE organizations
            const allOrgs = orgRes.data.data || [];
            setOrganizations(allOrgs.filter((org) => (org.status || '').toUpperCase() === 'ACTIVE'));
        }).catch(console.error).finally(() => setLoading(false));
    }, [branchId]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name])
            setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };
    const handleHoursChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
        try {
            await api.put(`/branches/${branchId}`, { ...formData, organizationId: Number(formData.organizationId) });
            setSuccess('Branch profile updated successfully.');
            setTimeout(() => setSuccess(''), 5000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update branch profile.');
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
    if (loading) {
        return <div className="p-20 text-center"><div className="spinner-border text-primary" role="status"/><p className="text-slate-400 text-xs fw-semibold mt-3">Loading branch data...</p></div>;
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => handleNav('branch_details')} className="btn btn-outline-secondary btn-sm p-2"><ArrowLeft className="h-4.5 w-4.5"/></button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
              <GitBranch className="text-blue-600 h-7 w-7"/> Edit Branch
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Update profile for <span className="font-mono text-primary font-bold">{formData.branchCode}</span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleReset} className="btn btn-outline-secondary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2"><RotateCcw className="h-4 w-4"/> Reset</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary d-flex align-items-center gap-2 text-xs font-bold px-3 py-2"><Save className="h-4 w-4"/> {saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>

      {error && <div className="alert alert-danger text-xs font-semibold py-2.5 d-flex align-items-center gap-2"><AlertCircle className="h-4 w-4"/>{error}</div>}
      {success && <div className="alert alert-success text-xs font-semibold py-2.5 d-flex align-items-center gap-2"><CheckCircle className="h-4 w-4"/>{success}</div>}

      {/* General Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">General Information</h4>
        <div className="row g-3">
          <div className="col-12 col-md-5"><label className="form-label font-bold text-xxs uppercase text-slate-400">Branch Name *</label><input type="text" name="branchName" className="form-control text-xs font-semibold" value={formData.branchName} onChange={handleChange}/></div>
          <div className="col-12 col-md-3"><label className="form-label font-bold text-xxs uppercase text-slate-400">Branch Code</label><input type="text" name="branchCode" className="form-control text-xs font-semibold font-monospace text-uppercase" value={formData.branchCode} disabled/></div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Branch Type</label><select name="branchType" className="form-select text-xs font-semibold" value={formData.branchType} onChange={handleChange}><option value="HEADQUARTERS">Headquarters</option><option value="OFFICE">Office</option><option value="CAMPUS">Campus</option><option value="RETAIL">Retail</option><option value="WAREHOUSE">Warehouse</option></select></div>
          <div className="col-12"><label className="form-label font-bold text-xxs uppercase text-slate-400">Organization</label><select name="organizationId" className="form-select text-xs font-semibold" value={formData.organizationId} onChange={handleChange}><option value="">Select...</option>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}</select></div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">Contact Information</h4>
        <div className="row g-3">
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Email</label><input type="email" name="email" className="form-control text-xs font-semibold" value={formData.email} onChange={handleChange}/></div>
          <div className="col-12 col-md-4">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Phone</label>
            <CountryPhoneInput
              id="branch-edit-phone"
              name="phone"
              value={formData.phone}
              onChange={(val) => {
                const phoneStr = typeof val === 'string' ? val
                  : (val?.target?.value || val?.value || String(val || ''));
                setFormData(prev => ({ ...prev, phone: phoneStr }));
              }}
              showValidationHelper={false}
            />
          </div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Website</label><input type="text" name="website" className="form-control text-xs font-semibold" value={formData.website} onChange={handleChange}/></div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">Address</h4>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label font-bold text-xxs uppercase text-slate-400">Country</label>
            <CountryNationalitySelect
              id="branch-edit-country"
              name="country"
              value={formData.country}
              returnMode="country"
              onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
              placeholder="Select Country..."
            />
          </div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Region</label><input type="text" name="region" className="form-control text-xs font-semibold" value={formData.region} onChange={handleChange}/></div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">City</label><input type="text" name="city" className="form-control text-xs font-semibold" value={formData.city} onChange={handleChange}/></div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Sub-City</label><input type="text" name="subCity" className="form-control text-xs font-semibold" value={formData.subCity} onChange={handleChange}/></div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Woreda</label><input type="text" name="woreda" className="form-control text-xs font-semibold" value={formData.woreda} onChange={handleChange}/></div>
          <div className="col-12 col-md-4"><label className="form-label font-bold text-xxs uppercase text-slate-400">Postal Code</label><input type="text" name="postalCode" className="form-control text-xs font-semibold" value={formData.postalCode} onChange={handleChange}/></div>
          <div className="col-12"><label className="form-label font-bold text-xxs uppercase text-slate-400">Full Address</label><textarea name="address" className="form-control text-xs font-semibold" rows={2} value={formData.address} onChange={handleChange}/></div>
        </div>
      </div>

      {/* Operating Hours Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-4">Operating Hours</h4>
        <OperatingHoursForm workingDays={formData.workingDays} openingTime={formData.openingTime} closingTime={formData.closingTime} timezone={formData.timezone} onChange={handleHoursChange} errors={fieldErrors}/>
      </div>
    </div>);
}
