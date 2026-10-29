import React, { useState } from 'react';
import { Settings, Info, Save, ArrowLeft, ArrowRight } from 'lucide-react';
export default function WorkingScheduleForm({ initialData, onSave, onCancel }) {
    const [step, setStep] = useState(1);
    const [errorMsg, setErrorMsg] = useState('');
    const [weeklySchedule, setWeeklySchedule] = useState(initialData?.weeklySchedule || {
        Monday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
        Tuesday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
        Wednesday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
        Thursday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
        Friday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
        Saturday: { open: false, openingTime: '09:00', closingTime: '13:00', breakStart: '', breakEnd: '' },
        Sunday: { open: false, openingTime: '', closingTime: '', breakStart: '', breakEnd: '' }
    });
    const [businessInfo, setBusinessInfo] = useState({
        organizationId: initialData?.organizationId || 1,
        timeZone: initialData?.timeZone || 'Africa/Addis_Ababa',
        startDate: initialData?.startDate || '2026-01-01',
        endDate: initialData?.endDate || ''
    });
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
    const validateStep1 = () => {
        setErrorMsg('');
        for (const [day, config] of Object.entries(weeklySchedule)) {
            if (config.open) {
                if (!config.openingTime || !config.closingTime) {
                    setErrorMsg(`${day} is active but has blank operating hours.`);
                    return false;
                }
                if (config.closingTime <= config.openingTime) {
                    setErrorMsg(`${day} closing time (${config.closingTime}) must be after opening time (${config.openingTime}).`);
                    return false;
                }
                if (config.breakStart || config.breakEnd) {
                    if (!config.breakStart || !config.breakEnd) {
                        setErrorMsg(`${day} break start and break end must both be set if lunch break is specified.`);
                        return false;
                    }
                    if (config.breakStart < config.openingTime || config.breakEnd > config.closingTime) {
                        setErrorMsg(`${day} lunch break must fall within operating hours (${config.openingTime} - ${config.closingTime}).`);
                        return false;
                    }
                    if (config.breakEnd <= config.breakStart) {
                        setErrorMsg(`${day} break end must be after break start.`);
                        return false;
                    }
                }
            }
        }
        return true;
    };
    const handleNext = () => {
        if (step === 1) {
            if (validateStep1())
                setStep(2);
        }
        else if (step === 2) {
            if (!businessInfo.startDate) {
                setErrorMsg('Business Start Date is required.');
            }
            else {
                setErrorMsg('');
                setStep(3);
            }
        }
    };
    const handlePrev = () => {
        setErrorMsg('');
        setStep(step - 1);
    };
    const handleFormSubmit = () => {
        onSave({
            organizationId: businessInfo.organizationId,
            weeklySchedule,
            timeZone: businessInfo.timeZone,
            startDate: businessInfo.startDate,
            endDate: businessInfo.endDate || null
        });
    };
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Wizard Step Headers */}
      <div className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-0 d-flex align-items-center gap-2">
            <Settings className="text-blue-500 h-5 w-5"/> Config Working Schedule
          </h2>
          <span className="badge bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-1 text-xxs">
            Step {step} of 3
          </span>
        </div>
        <div className="row g-2 text-center text-xs font-bold text-slate-400">
          <div className={`col-4 pb-2 border-bottom ${step === 1 ? 'border-primary border-3 text-primary' : 'border-slate-200'}`}>
            1. Weekly Operating Hours
          </div>
          <div className={`col-4 pb-2 border-bottom ${step === 2 ? 'border-primary border-3 text-primary' : 'border-slate-200'}`}>
            2. Business Info
          </div>
          <div className={`col-4 pb-2 border-bottom ${step === 3 ? 'border-primary border-3 text-primary' : 'border-slate-200'}`}>
            3. Review & Save
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {errorMsg && (<div className="alert alert-danger text-xs font-semibold py-2.5 px-3 border-0 d-flex align-items-center gap-2">
            <Info className="h-4 w-4 shrink-0"/>
            <span>{errorMsg}</span>
          </div>)}

        {/* STEP 1: WEEKLY SCHEDULE */}
        {step === 1 && (<div className="table-responsive">
            <table className="table align-middle text-xs mb-0">
              <thead>
                <tr className="text-slate-500 uppercase font-bold text-[9px]">
                  <th>Active Day</th>
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
                          <span className={`badge ${conf.open ? 'bg-success-subtle text-success' : 'bg-slate-200 text-slate-500'} text-[9px] uppercase px-2 py-0.5 rounded font-bold`}>
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
          </div>)}

        {/* STEP 2: BUSINESS INFORMATION */}
        {step === 2 && (<div className="space-y-4 max-w-lg mx-auto">
            <div>
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Organization Scope</label>
              <select className="form-select text-xs font-semibold" value={businessInfo.organizationId} onChange={(e) => setBusinessInfo({ ...businessInfo, organizationId: Number(e.target.value) })}>
                <option value={1}>IT park</option>
              </select>
            </div>

            <div>
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Default Calendar Time Zone</label>
              <select className="form-select text-xs font-semibold" value={businessInfo.timeZone} onChange={(e) => setBusinessInfo({ ...businessInfo, timeZone: e.target.value })}>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (UTC +03:00)</option>
                <option value="Europe/London">Europe/London (UTC +00:00)</option>
                <option value="America/New_York">America/New_York (UTC -05:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC +04:00)</option>
              </select>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Business Start Date</label>
                <input type="date" className="form-control text-xs font-semibold" value={businessInfo.startDate} onChange={(e) => setBusinessInfo({ ...businessInfo, startDate: e.target.value })}/>
              </div>
              <div className="col-6">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Business End Date (Optional)</label>
                <input type="date" className="form-control text-xs font-semibold" value={businessInfo.endDate} onChange={(e) => setBusinessInfo({ ...businessInfo, endDate: e.target.value })}/>
              </div>
            </div>
          </div>)}

        {/* STEP 3: REVIEW & SAVE */}
        {step === 3 && (<div className="space-y-4 max-w-2xl mx-auto text-xs font-semibold text-slate-600 dark:text-slate-350">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase mb-2">Scope Summary</h4>
              <p>• **Scope Organization**: IT park</p>
              <p>• **Operational TimeZone**: {businessInfo.timeZone}</p>
              <p>• **Effective Period**: {businessInfo.startDate} {businessInfo.endDate ? `to ${businessInfo.endDate}` : '(Indefinite)'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase mb-2">Shift Configuration</h4>
              <div className="space-y-1.5">
                {Object.keys(weeklySchedule).map((day) => {
                const conf = weeklySchedule[day];
                return (<div key={day} className="d-flex justify-content-between border-bottom pb-1 dark:border-slate-800">
                      <span className="font-bold text-slate-850 dark:text-slate-100">{day}</span>
                      <span>
                        {conf.open ? (<span className="text-emerald-600 font-bold">
                            Open ({conf.openingTime} - {conf.closingTime}) {conf.breakStart ? `| Lunch: ${conf.breakStart}-${conf.breakEnd}` : ''}
                          </span>) : (<span className="text-slate-400">Closed</span>)}
                      </span>
                    </div>);
            })}
              </div>
            </div>
          </div>)}
      </div>

      {/* Buttons Bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border-top border-slate-200 dark:border-slate-800 p-4 d-flex justify-content-between">
        <button type="button" onClick={step === 1 ? onCancel : handlePrev} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 font-bold">
          <ArrowLeft className="h-4 w-4"/> {step === 1 ? 'Cancel' : 'Previous'}
        </button>

        {step < 3 ? (<button type="button" onClick={handleNext} className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 font-bold">
            Next <ArrowRight className="h-4 w-4"/>
          </button>) : (<button type="button" onClick={handleFormSubmit} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
            <Save className="h-4 w-4"/> Save Schedule Configuration
          </button>)}
      </div>
    </div>);
}
