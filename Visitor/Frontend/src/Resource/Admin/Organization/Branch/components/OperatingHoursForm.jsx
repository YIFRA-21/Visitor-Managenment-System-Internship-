import { Clock } from 'lucide-react';
const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const SHORT_DAYS = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
    FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};
export default function OperatingHoursForm({ workingDays, openingTime, closingTime, timezone, onChange, errors = {}, readOnly = false, }) {
    const toggleDay = (day) => {
        if (readOnly)
            return;
        const updated = workingDays.includes(day)
            ? workingDays.filter(d => d !== day)
            : [...workingDays, day];
        onChange('workingDays', updated);
    };
    return (<div className="space-y-4">
      {/* Working Days */}
      <div>
        <label className="form-label font-bold text-xxs uppercase text-slate-400 d-flex align-items-center gap-1.5">
          <Clock className="h-3.5 w-3.5"/> Working Days *
        </label>
        <div className="d-flex flex-wrap gap-2 mt-1">
          {ALL_DAYS.map((day) => {
            const isActive = workingDays.includes(day);
            return (<button key={day} type="button" onClick={() => toggleDay(day)} disabled={readOnly} className={`btn btn-sm text-xs fw-bold px-3 py-1.5 rounded-pill ${isActive
                    ? 'btn-primary'
                    : 'btn-outline-secondary'}`}>
                {SHORT_DAYS[day]}
              </button>);
        })}
        </div>
        {errors.workingDays && (<div className="text-danger text-xs mt-1 fw-semibold">{errors.workingDays}</div>)}
      </div>

      {/* Time Range */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <label className="form-label font-bold text-xxs uppercase text-slate-400">Opening Time *</label>
          <input type="time" className={`form-control text-xs font-semibold ${errors.openingTime ? 'is-invalid' : ''}`} value={openingTime} onChange={(e) => onChange('openingTime', e.target.value)} disabled={readOnly}/>
          {errors.openingTime && (<div className="text-danger text-xs mt-1 fw-semibold">{errors.openingTime}</div>)}
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label font-bold text-xxs uppercase text-slate-400">Closing Time *</label>
          <input type="time" className={`form-control text-xs font-semibold ${errors.closingTime ? 'is-invalid' : ''}`} value={closingTime} onChange={(e) => onChange('closingTime', e.target.value)} disabled={readOnly}/>
          {errors.closingTime && (<div className="text-danger text-xs mt-1 fw-semibold">{errors.closingTime}</div>)}
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label font-bold text-xxs uppercase text-slate-400">Time Zone *</label>
          <select className={`form-select text-xs font-semibold ${errors.timezone ? 'is-invalid' : ''}`} value={timezone} onChange={(e) => onChange('timezone', e.target.value)} disabled={readOnly}>
            <option value="Africa/Addis_Ababa">East Africa (EAT / GMT+3)</option>
            <option value="UTC">UTC (GMT+0)</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="America/New_York">New York (EST/EDT)</option>
            <option value="Asia/Dubai">Dubai (GST / GMT+4)</option>
            <option value="Asia/Tokyo">Tokyo (JST / GMT+9)</option>
          </select>
          {errors.timezone && (<div className="text-danger text-xs mt-1 fw-semibold">{errors.timezone}</div>)}
        </div>
      </div>

      {/* Summary */}
      {workingDays.length > 0 && openingTime && closingTime && (<div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-3 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <strong>Schedule Summary:</strong> {workingDays.map(d => SHORT_DAYS[d]).join(', ')} — {openingTime} to {closingTime} ({timezone})
        </div>)}
    </div>);
}
