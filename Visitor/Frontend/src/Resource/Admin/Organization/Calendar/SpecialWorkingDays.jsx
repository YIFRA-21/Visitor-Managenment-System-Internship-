import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calendar } from 'lucide-react';
import api from '../../../../services/api';
import useResponseNavigation from '../../../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../../../modules/response/responseConfig';

export default function SpecialWorkingDays({ onNotify }) {
    const { toConfirmation } = useResponseNavigation();
    const [specialDays, setSpecialDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        date: '',
        reason: '',
        openingTime: '08:30',
        closingTime: '13:00',
        appliesTo: 'ALL',
        organizationId: 1,
        branchId: ''
    });
    const fetchSpecialDays = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/special-days', { params: { organizationId: 1 } });
            setSpecialDays(res.data || []);
        }
        catch {
            onNotify('Failed to fetch special working days.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSpecialDays();
    }, []);
    const handleOpenAdd = () => {
        setFormData({
            id: '',
            date: '',
            reason: '',
            openingTime: '08:30',
            closingTime: '13:00',
            appliesTo: 'ALL',
            organizationId: 1,
            branchId: ''
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
            await api.post('/calendar/special-days', payload);
            onNotify('Special working day setting registered successfully.', 'success');
            setShowModal(false);
            fetchSpecialDays();
        }
        catch {
            onNotify('Failed to save special working day settings.', 'danger');
        }
    };
    const handleDelete = (id) => {
        toConfirmation({
            title: 'Delete Special Working Day Rule',
            message: 'Are you sure you want to delete this special working day schedule override?',
            entityType: 'Calendar Schedule Override',
            entityName: `Special Day Rule #${id}`,
            entityId: id,
            consequences: [
                'The system calendar will revert to standard organizational operating hours.',
                'Visitor booking slots on this date will recalculate based on standard operating hours.'
            ],
            confirmLabel: 'Delete Schedule Override',
            confirmVariant: 'danger',
            apiEndpoint: `/calendar/special-days/${id}`,
            apiMethod: 'DELETE',
            returnUrl: window.location.pathname,
            successConfig: {
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Schedule Override Removed',
                message: 'Special working day rule was deleted.',
            }
        });
    };
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-1">
            Special Working Days & Operational Exceptions
          </h3>
          <p className="text-xxs text-slate-400 font-semibold mb-0">Configure weekend makeup shifts, emergency openings, or half-day events.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 text-xxs font-bold">
          <Plus className="h-4 w-4"/> Add Special Working Day
        </button>
      </div>

      {loading ? (<div className="p-16 text-center">
          <div className="spinner-border text-primary" role="status"/>
          <p className="text-slate-400 text-xs fw-semibold mt-3">Loading exceptions...</p>
        </div>) : specialDays.length === 0 ? (<div className="p-16 text-center text-slate-400 font-semibold text-xs space-y-2">
          <Calendar className="h-10 w-10 mx-auto opacity-40 text-slate-400"/>
          <p>No special working day exemptions are active in the database.</p>
        </div>) : (<div className="table-responsive">
          <table className="table align-middle text-xs mb-0">
            <thead>
              <tr className="text-slate-500 uppercase font-bold text-[9px]">
                <th>Exemption Date</th>
                <th>Exemption Description / Reason</th>
                <th>Working Hours</th>
                <th>Applies To</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-350">
              {specialDays.map((d) => (<tr key={d.id}>
                  <td className="font-extrabold text-slate-900 dark:text-white">
                    {new Date(d.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </td>
                  <td>{d.reason}</td>
                  <td>
                    <span className="badge bg-emerald-subtle text-emerald text-[9px] px-2 py-0.5 rounded font-bold">
                      {d.openingTime} - {d.closingTime}
                    </span>
                  </td>
                  <td>{d.appliesTo === 'ALL' ? 'Organization Wide' : `Branch ID: ${d.branchId}`}</td>
                  <td className="text-end">
                    <button onClick={() => handleDelete(d.id)} className="btn btn-sm btn-outline-danger p-1 rounded">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}

      {/* Exemption Modal */}
      {showModal && (<div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg dark:bg-[#1e293b]">
              <form onSubmit={handleFormSubmit}>
                <div className="modal-header border-bottom dark:border-slate-800">
                  <h5 className="modal-title text-sm font-extrabold text-slate-900 dark:text-white">
                    Schedule Special Working Day
                  </h5>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-close dark:btn-close-white"/>
                </div>
                <div className="modal-body space-y-3">
                  <div>
                    <label className="form-label text-xxs font-bold uppercase text-slate-400">Target Date</label>
                    <input type="date" className="form-control text-xs font-semibold" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required/>
                  </div>

                  <div>
                    <label className="form-label text-xxs font-bold uppercase text-slate-400">Reason / Exemption Description</label>
                    <input type="text" className="form-control text-xs font-semibold" value={formData.reason} placeholder="e.g. Weekend Makeup Day, half-day schedule" onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required/>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-xxs font-bold uppercase text-slate-400">Opening Time</label>
                      <input type="time" className="form-control text-xs font-semibold" value={formData.openingTime} onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })} required/>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-xxs font-bold uppercase text-slate-400">Closing Time</label>
                      <input type="time" className="form-control text-xs font-semibold" value={formData.closingTime} onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })} required/>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-xxs font-bold uppercase text-slate-400">Exemption Scope</label>
                      <select className="form-select text-xs font-semibold" value={formData.appliesTo} onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}>
                        <option value="ALL">Org-wide (All Branches)</option>
                        <option value="BRANCH_ONLY">Specific Branch</option>
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
                    <Save className="h-4 w-4"/> Save Exception Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>)}
    </div>);
}
