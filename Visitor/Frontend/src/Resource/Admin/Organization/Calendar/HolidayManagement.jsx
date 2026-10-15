import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
export default function HolidayManagement({ onNotify }) {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: 'PUBLIC',
        date: '',
        appliesTo: 'ALL',
        organizationId: 1,
        branchId: '',
        status: 'ACTIVE'
    });
    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/holidays', { params: { organizationId: 1 } });
            setHolidays(res.data || []);
        }
        catch {
            onNotify('Failed to fetch holidays calendar.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchHolidays();
    }, []);
    const handleOpenAdd = () => {
        setFormData({
            id: '',
            name: '',
            type: 'PUBLIC',
            date: '',
            appliesTo: 'ALL',
            organizationId: 1,
            branchId: '',
            status: 'ACTIVE'
        });
        setShowModal(true);
    };
    const handleOpenEdit = (h) => {
        setFormData({
            id: h.id,
            name: h.name,
            type: h.type,
            date: h.date,
            appliesTo: h.appliesTo,
            organizationId: h.organizationId,
            branchId: h.branchId || '',
            status: h.status
        });
        setShowModal(true);
    };
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                branchId: formData.appliesTo === 'BRANCH_ONLY' && formData.branchId ? Number(formData.branchId) : null
            };
            if (formData.id) {
                await api.put(`/calendar/holidays/${formData.id}`, payload);
                onNotify('Holiday details updated successfully.', 'success');
            }
            else {
                await api.post('/calendar/holidays', payload);
                onNotify('New holiday event added successfully.', 'success');
            }
            setShowModal(false);
            fetchHolidays();
        }
        catch (err) {
            const msg = err.response?.data?.error || 'Failed to save holiday details.';
            onNotify(msg, 'danger');
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday? This action cannot be undone.'))
            return;
        try {
            await api.delete(`/calendar/holidays/${id}`);
            onNotify('Holiday deleted successfully.', 'success');
            fetchHolidays();
        }
        catch {
            onNotify('Failed to delete holiday.', 'danger');
        }
    };
    const handleToggleStatus = async (h) => {
        try {
            const newStatus = h.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await api.put(`/calendar/holidays/${h.id}`, { ...h, status: newStatus });
            onNotify(`Holiday status set to ${newStatus}.`, 'success');
            fetchHolidays();
        }
        catch {
            onNotify('Failed to toggle holiday status.', 'danger');
        }
    };
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-1">
            Registered Holidays & Operating Closures
          </h3>
          <p className="text-xxs text-slate-400 font-semibold mb-0">Holidays block scheduled appointments and trigger check-in warnings.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 text-xxs font-bold">
          <Plus className="h-4 w-4"/> Add New Holiday
        </button>
      </div>

      {loading ? (<div className="p-16 text-center">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Loading holiday schedule...</p>
        </div>) : holidays.length === 0 ? (<div className="p-16 text-center text-slate-400 font-semibold text-xs space-y-2">
          <AlertCircle className="h-10 w-10 mx-auto opacity-40 text-slate-400"/>
          <p>No holiday events are registered for this calendar range.</p>
        </div>) : (<div className="table-responsive">
          <table className="table align-middle text-xs mb-0">
            <thead>
              <tr className="text-slate-500 uppercase font-bold text-[9px]">
                <th>Holiday Name</th>
                <th>Holiday Type</th>
                <th>Calendar Date</th>
                <th>Applies Scope</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-350">
              {holidays.map((h) => (<tr key={h.id}>
                  <td className="font-extrabold text-slate-900 dark:text-white">{h.name}</td>
                  <td>
                    <span className={`badge ${h.type === 'PUBLIC' ? 'bg-primary-subtle text-primary' :
                    h.type === 'ORGANIZATION' ? 'bg-purple-subtle text-purple' :
                        h.type === 'BRANCH' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
                      {h.type}
                    </span>
                  </td>
                  <td>{new Date(h.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                  <td>{h.appliesTo === 'ALL' ? 'Organization Wide' : `Branch ID: ${h.branchId}`}</td>
                  <td>
                    <button onClick={() => handleToggleStatus(h)} className={`badge border-0 ${h.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-slate-200 text-slate-500'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`} title="Click to toggle status">
                      {h.status}
                    </button>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1.5">
                      <button onClick={() => handleOpenEdit(h)} className="btn btn-sm btn-outline-secondary p-1 rounded">
                        <Edit className="h-4 w-4"/>
                      </button>
                      <button onClick={() => handleDelete(h.id)} className="btn btn-sm btn-outline-danger p-1 rounded">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}

      {/* Add/Edit Modal */}
      {showModal && (<div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg dark:bg-[#1e293b]">
              <form onSubmit={handleFormSubmit}>
                <div className="modal-header border-bottom dark:border-slate-800">
                  <h5 className="modal-title text-sm font-extrabold text-slate-900 dark:text-white">
                    {formData.id ? 'Modify Holiday Event' : 'Schedule Operational Closure'}
                  </h5>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-close dark:btn-close-white"/>
                </div>
                <div className="modal-body space-y-3">
                  <div>
                    <label className="form-label text-xxs font-bold uppercase text-slate-400">Event Title / Name</label>
                    <input type="text" className="form-control text-xs font-semibold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-xxs font-bold uppercase text-slate-400">Closure Category</label>
                      <select className="form-select text-xs font-semibold" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                        <option value="PUBLIC">Public Holiday</option>
                        <option value="ORGANIZATION">Organization Holiday</option>
                        <option value="BRANCH">Branch Override Closure</option>
                        <option value="EMERGENCY">Emergency Closure</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-xxs font-bold uppercase text-slate-400">Calendar Date</label>
                      <input type="date" className="form-control text-xs font-semibold" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required/>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-xxs font-bold uppercase text-slate-400">Application Scope</label>
                      <select className="form-select text-xs font-semibold" value={formData.appliesTo} onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}>
                        <option value="ALL">Entire Organization (Org-wide)</option>
                        <option value="BRANCH_ONLY">Specific Branch Overrides</option>
                      </select>
                    </div>
                    {formData.appliesTo === 'BRANCH_ONLY' && (<div className="col-6">
                        <label className="form-label text-xxs font-bold uppercase text-slate-400">Target Branch ID</label>
                        <input type="number" className="form-control text-xs font-semibold" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} placeholder="e.g. 1" required/>
                      </div>)}
                  </div>
                </div>
                <div className="modal-footer border-top dark:border-slate-800">
                  <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowModal(false)}>Close</button>
                  <button type="submit" className="btn btn-primary text-xs d-flex align-items-center gap-1.5 font-bold">
                    <ShieldCheck className="h-4 w-4"/> Save Holiday Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>)}
    </div>);
}
