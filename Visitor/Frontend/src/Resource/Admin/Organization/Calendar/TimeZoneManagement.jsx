import React, { useState, useEffect } from 'react';
import { Globe, Save, RotateCcw } from 'lucide-react';
import api from '../../../../services/api';
export default function TimeZoneManagement({ onNotify }) {
    const [timezones, setTimezones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        organizationId: 1,
        branchId: '',
        timeZone: 'Africa/Addis_Ababa',
        utcOffset: '+03:00',
        dst: false
    });
    const fetchTimeZones = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/timezones', {
                params: { organizationId: 1 }
            });
            setTimezones(res.data || []);
        }
        catch {
            onNotify('Failed to fetch timezone configurations.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTimeZones();
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/calendar/timezones', {
                ...formData,
                branchId: formData.branchId ? Number(formData.branchId) : null
            });
            onNotify('Time Zone mapping updated successfully.', 'success');
            fetchTimeZones();
        }
        catch {
            onNotify('Failed to save Time Zone configuration.', 'danger');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleReset = () => {
        setFormData({
            organizationId: 1,
            branchId: '',
            timeZone: 'Africa/Addis_Ababa',
            utcOffset: '+03:00',
            dst: false
        });
    };
    return (<div className="row g-4">
      {/* Configuration Form */}
      <div className="col-12 col-lg-5">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <Globe className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Configure Scope Time Zone
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Target Branch (Optional)</label>
              <select className="form-select text-xs font-semibold" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                <option value="">Organization Default (Entire Org)</option>
                <option value="1">Main Bole Headquarters (HQ)</option>
              </select>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 d-block">
                Leave blank to set the baseline organization-wide timezone.
              </span>
            </div>

            <div>
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Time Zone Identifier</label>
              <select className="form-select text-xs font-semibold" value={formData.timeZone} onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (UTC +03:00)</option>
                <option value="Europe/London">Europe/London (UTC +00:00)</option>
                <option value="America/New_York">America/New_York (UTC -05:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC +04:00)</option>
              </select>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">UTC Offset</label>
                <input type="text" className="form-control text-xs font-semibold" value={formData.utcOffset} onChange={(e) => setFormData({ ...formData, utcOffset: e.target.value })} placeholder="e.g. +03:00" required/>
              </div>
              <div className="col-6 d-flex align-items-end pb-1">
                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" checked={formData.dst} onChange={(e) => setFormData({ ...formData, dst: e.target.checked })}/>
                  <label className="form-check-label text-xxs font-bold uppercase text-slate-400">DST Active</label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 pt-3 border-top dark:border-slate-800">
              <button type="submit" disabled={isSaving} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
                <Save className="h-4 w-4"/> Save Configuration
              </button>
              <button type="button" onClick={handleReset} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 font-bold">
                <RotateCcw className="h-4 w-4"/> Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Configuration List */}
      <div className="col-12 col-lg-7">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
            Active Scope Settings
          </h3>

          {loading ? (<div className="p-16 text-center">
              <div className="spinner-border text-primary" role="status"/>
              <p className="text-slate-400 text-xs fw-semibold mt-3">Fetching mappings...</p>
            </div>) : (<div className="table-responsive">
              <table className="table align-middle text-xs mb-0">
                <thead>
                  <tr className="text-slate-500 uppercase font-bold text-[9px]">
                    <th>Scope Scope</th>
                    <th>Time Zone Key</th>
                    <th>UTC Offset</th>
                    <th>Daylight Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-350">
                  {timezones.map((tz) => (<tr key={tz.id}>
                      <td className="font-extrabold text-slate-900 dark:text-white py-3">
                        {tz.branchId ? `Branch ID: ${tz.branchId}` : 'Organization Baseline'}
                      </td>
                      <td>{tz.timeZone}</td>
                      <td>{tz.utcOffset}</td>
                      <td>
                        <span className={`badge ${tz.dst ? 'bg-info-subtle text-info' : 'bg-slate-200 text-slate-500'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
                          {tz.dst ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>
    </div>);
}
