import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Copy } from 'lucide-react';
import api from '../../../../services/api';
export default function BranchScheduleManager({ onNotify }) {
    const [branches, setBranches] = useState([
        { id: 1, name: 'Main Bole Headquarters', code: 'HQ' }
    ]);
    const [selectedBranchId, setSelectedBranchId] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [weeklySchedule, setWeeklySchedule] = useState({
        Monday: { open: true, openingTime: '08:00', closingTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        Tuesday: { open: true, openingTime: '08:00', closingTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        Wednesday: { open: true, openingTime: '08:00', closingTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        Thursday: { open: true, openingTime: '08:00', closingTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        Friday: { open: true, openingTime: '08:00', closingTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
        Saturday: { open: true, openingTime: '08:30', closingTime: '12:30', breakStart: '', breakEnd: '' },
        Sunday: { open: false, openingTime: '', closingTime: '', breakStart: '', breakEnd: '' }
    });
    const [timeZone, setTimeZone] = useState('Africa/Addis_Ababa');
    const [status, setStatus] = useState('OVERRIDDEN');
    const fetchBranchSchedule = async (branchId) => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/schedules/branch', {
                params: { organizationId: 1, branchId }
            });
            if (res.data) {
                setWeeklySchedule(res.data.weeklySchedule);
                setTimeZone(res.data.timeZone);
                setStatus(res.data.status);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBranchSchedule(selectedBranchId);
    }, [selectedBranchId]);
    const handleDayToggle = (day) => {
        setWeeklySchedule({
            ...weeklySchedule,
            [day]: {
                ...weeklySchedule[day],
                open: !weeklySchedule[day].open,
                openingTime: !weeklySchedule[day].open ? '08:30' : '',
                closingTime: !weeklySchedule[day].open ? '17:30' : '',
                breakStart: !weeklySchedule[day].open ? '12:30' : '',
                breakEnd: !weeklySchedule[day].open ? '13:30' : ''
            }
        });
    };
    const handleTimeChange = (day, field, val) => {
        setWeeklySchedule({
            ...weeklySchedule,
            [day]: {
                ...weeklySchedule[day],
                [field]: val
            }
        });
    };
    const handleCopyOrg = async () => {
        try {
            const res = await api.get('/calendar/schedules/org', { params: { organizationId: 1 } });
            if (res.data) {
                setWeeklySchedule(res.data.weeklySchedule);
                setTimeZone(res.data.timeZone);
                setStatus('OVERRIDDEN');
                onNotify('Copied organization weekly schedule settings.', 'success');
            }
        }
        catch {
            onNotify('Failed to copy organization schedule.', 'danger');
        }
    };
    const handleReset = async () => {
        if (!window.confirm('Are you sure you want to delete this branch schedule override and inherit defaults?'))
            return;
        try {
            const res = await api.post('/calendar/schedules/branch/reset', {
                organizationId: 1,
                branchId: selectedBranchId
            });
            if (res.data) {
                setWeeklySchedule(res.data.data.weeklySchedule);
                setTimeZone(res.data.data.timeZone);
                setStatus('INHERITED');
                onNotify('Branch override cleared. Inheriting organization default schedule.', 'success');
            }
        }
        catch {
            onNotify('Failed to reset branch schedule.', 'danger');
        }
    };
    const handleSaveOverride = async () => {
        // Validate shift ranges
        for (const [day, config] of Object.entries(weeklySchedule)) {
            if (config.open) {
                if (!config.openingTime || !config.closingTime) {
                    onNotify(`${day} is marked open but lacks valid shift bounds.`, 'danger');
                    return;
                }
                if (config.closingTime <= config.openingTime) {
                    onNotify(`${day} closing time must exceed opening time.`, 'danger');
                    return;
                }
            }
        }
        setIsSaving(true);
        try {
            const res = await api.post('/calendar/schedules/branch', {
                organizationId: 1,
                branchId: selectedBranchId,
                weeklySchedule,
                timeZone
            });
            if (res.data) {
                setStatus('OVERRIDDEN');
                onNotify('Branch operational hours override successfully saved.', 'success');
            }
        }
        catch {
            onNotify('Failed to save branch schedule override.', 'danger');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (<div className="space-y-4">
      {/* Branch Selector Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <label className="form-label text-xxs font-bold uppercase text-slate-400">Select Target Branch</label>
            <select className="form-select text-xs font-semibold" value={selectedBranchId} onChange={(e) => setSelectedBranchId(Number(e.target.value))}>
              {branches.map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.code})</option>))}
            </select>
          </div>
          <div className="col-12 col-md-8 d-flex justify-content-md-end gap-2 pt-md-4">
            <button onClick={handleCopyOrg} className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1.5 font-bold">
              <Copy className="h-3.5 w-3.5"/> Copy Org Default
            </button>
            <button onClick={handleReset} disabled={status === 'INHERITED'} className="btn btn-xs btn-outline-danger d-flex align-items-center gap-1.5 font-bold">
              <RotateCcw className="h-3.5 w-3.5"/> Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
            Branch Schedule Overrides
          </h3>
          <span className={`badge ${status === 'OVERRIDDEN' ? 'bg-amber-subtle text-amber' : 'bg-success-subtle text-success'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
            {status}
          </span>
        </div>

        {loading ? (<div className="p-16 text-center">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Fetching branch settings...</p>
          </div>) : (<>
            <div className="table-responsive">
              <table className="table align-middle text-xs mb-0">
                <thead>
                  <tr className="text-slate-500 uppercase font-bold text-[9px]">
                    <th>Operating Day</th>
                    <th>Open / Closed</th>
                    <th>Opening Time</th>
                    <th>Closing Time</th>
                    <th>Break Start</th>
                    <th>Break End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-350">
                  {Object.keys(weeklySchedule).map((day) => {
                const conf = weeklySchedule[day];
                return (<tr key={day}>
                        <td className="font-extrabold text-slate-900 dark:text-white py-3">{day}</td>
                        <td>
                          <div className="form-check form-switch mb-0">
                            <input className="form-check-input" type="checkbox" checked={conf.open} onChange={() => handleDayToggle(day)} style={{ cursor: 'pointer' }}/>
                            <span className={`badge ${conf.open ? 'bg-emerald-subtle text-emerald' : 'bg-slate-200 text-slate-500'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
                              {conf.open ? 'OPEN' : 'CLOSED'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <input type="time" className="form-control text-xs font-semibold p-1" value={conf.openingTime} disabled={!conf.open} onChange={(e) => handleTimeChange(day, 'openingTime', e.target.value)}/>
                        </td>
                        <td>
                          <input type="time" className="form-control text-xs font-semibold p-1" value={conf.closingTime} disabled={!conf.open} onChange={(e) => handleTimeChange(day, 'closingTime', e.target.value)}/>
                        </td>
                        <td>
                          <input type="time" className="form-control text-xs font-semibold p-1" value={conf.breakStart} disabled={!conf.open} onChange={(e) => handleTimeChange(day, 'breakStart', e.target.value)}/>
                        </td>
                        <td>
                          <input type="time" className="form-control text-xs font-semibold p-1" value={conf.breakEnd} disabled={!conf.open} onChange={(e) => handleTimeChange(day, 'breakEnd', e.target.value)}/>
                        </td>
                      </tr>);
            })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end border-top pt-4 dark:border-slate-800">
              <button onClick={handleSaveOverride} disabled={isSaving} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
                <Save className="h-4 w-4"/> Save Branch Override
              </button>
            </div>
          </>)}
      </div>
    </div>);
}
