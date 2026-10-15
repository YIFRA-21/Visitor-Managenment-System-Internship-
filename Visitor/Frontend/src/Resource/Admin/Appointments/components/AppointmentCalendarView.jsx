import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Clock, MapPin, User, Eye } from 'lucide-react';
export default function AppointmentCalendarView({ appointments, onSelectAppointment, onRescheduleClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Navigation
    const handlePrev = () => {
        const next = new Date(currentDate);
        if (viewMode === 'month')
            next.setMonth(next.getMonth() - 1);
        else if (viewMode === 'week')
            next.setDate(next.getDate() - 7);
        else
            next.setDate(next.getDate() - 1);
        setCurrentDate(next);
    };
    const handleNext = () => {
        const next = new Date(currentDate);
        if (viewMode === 'month')
            next.setMonth(next.getMonth() + 1);
        else if (viewMode === 'week')
            next.setDate(next.getDate() + 7);
        else
            next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };
    const handleToday = () => setCurrentDate(new Date());
    const handleMonthSelect = (m) => {
        const d = new Date(currentDate);
        d.setMonth(m);
        setCurrentDate(d);
        setShowMonthPicker(false);
    };
    const handleYearSelect = (y) => {
        const d = new Date(currentDate);
        d.setFullYear(y);
        setCurrentDate(d);
        setShowYearPicker(false);
    };
    // Grid calculations
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const getAppointmentsForDate = (dayNum) => {
        const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return appointments.filter(a => {
            const apptDate = a.scheduled_start ? a.scheduled_start.split('T')[0] : '';
            return apptDate === targetDateStr;
        });
    };
    const getStatusBadge = (status) => {
        const st = (status || '').toUpperCase();
        if (st === 'APPROVED' || st === 'CONFIRMED')
            return 'badge bg-success';
        if (st === 'REQUESTED' || st === 'PENDING')
            return 'badge bg-warning text-dark';
        if (st === 'COMPLETED')
            return 'badge bg-info';
        if (st === 'REJECTED' || st === 'CANCELLED')
            return 'badge bg-danger';
        return 'badge bg-secondary';
    };
    // Generate year range for picker (2015 to 2035)
    const yearRange = useMemo(() => {
        const years = [];
        for (let y = 2015; y <= 2035; y++)
            years.push(y);
        return years;
    }, []);
    return (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

      {/* Custom Scrollbar Styles for Dropdowns */}
      <style>{`
        .custom-picker-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-picker-scroll::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 4px;
        }
        .custom-picker-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-picker-scroll::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Calendar Header with Month/Year Dropdowns */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 p-4 border-bottom border-slate-200 dark:border-slate-800">
        <div className="d-flex align-items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 d-flex align-items-center justify-content-center shrink-0">
            <CalendarIcon className="h-5 w-5"/>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Month Dropdown */}
            <div className="position-relative">
              <button onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2" style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155', minWidth: '130px' }}>
                {monthNames[month]}
                <ChevronDown className="h-3.5 w-3.5 ms-auto"/>
              </button>

              {showMonthPicker && (<div className="position-absolute start-0 mt-1 rounded-xl shadow-lg border border-slate-700 custom-picker-scroll" style={{ backgroundColor: '#0f172a', zIndex: 50, width: '210px', maxHeight: '180px', overflowY: 'auto' }}>
                  <div className="p-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                    {monthShort.map((m, i) => (<button key={i} onClick={() => handleMonthSelect(i)} className={`btn btn-sm text-xs font-semibold py-1.5 ${i === month ? 'btn-primary' : 'btn-outline-secondary'}`} style={i !== month ? { color: '#94a3b8', borderColor: '#334155' } : {}}>
                        {m}
                      </button>))}
                  </div>
                </div>)}
            </div>

            {/* Year Dropdown */}
            <div className="position-relative">
              <button onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }} className="btn btn-outline-secondary d-flex align-items-center gap-1.5 text-xs font-bold px-3 py-2" style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155', minWidth: '100px' }}>
                {year}
                <ChevronDown className="h-3.5 w-3.5 ms-auto"/>
              </button>

              {showYearPicker && (<div className="position-absolute start-0 mt-1 rounded-xl shadow-lg border border-slate-700 custom-picker-scroll" style={{ backgroundColor: '#0f172a', zIndex: 50, width: '160px', maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="p-2 d-flex flex-column gap-1">
                    {yearRange.map(y => (<button key={y} onClick={() => handleYearSelect(y)} className={`btn btn-sm text-xs font-semibold py-1.5 ${y === year ? 'btn-primary' : 'btn-outline-secondary'}`} style={y !== year ? { color: '#94a3b8', borderColor: '#334155' } : {}}>
                        {y}
                      </button>))}
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        {/* View Mode & Nav Controls */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="btn-group" role="group">
            {['month', 'week', 'day', 'agenda'].map(mode => (<button key={mode} onClick={() => setViewMode(mode)} className={`btn btn-sm text-xs font-bold px-3 ${viewMode === mode ? 'btn-primary' : 'btn-outline-secondary'}`}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>))}
          </div>

          <button onClick={handleToday} className="btn btn-sm btn-outline-secondary text-xs font-bold px-3">
            Today
          </button>
          <button onClick={handlePrev} className="btn btn-sm btn-outline-secondary p-1">
            <ChevronLeft className="h-4 w-4"/>
          </button>
          <button onClick={handleNext} className="btn btn-sm btn-outline-secondary p-1">
            <ChevronRight className="h-4 w-4"/>
          </button>
        </div>
      </div>

      {/* Click-away overlay for dropdowns */}
      {(showMonthPicker || showYearPicker) && (<div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 40 }} onClick={() => { setShowMonthPicker(false); setShowYearPicker(false); }}/>)}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (<div className="p-4">
          {/* Day Names Row */}
          <div className="row g-0 text-center mb-2">
            {dayNames.map(day => (<div key={day} className="col">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-2" style={{ backgroundColor: 'rgba(15,23,42,0.4)', borderRadius: '6px' }}>
                  {day}
                </div>
              </div>))}
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Empty padding cells */}
            {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} style={{ minHeight: '100px', backgroundColor: 'rgba(15,23,42,0.2)', borderRadius: '8px', border: '1px solid rgba(51,65,85,0.3)' }}/>))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayAppts = getAppointmentsForDate(dayNum);
                const isToday = new Date().getDate() === dayNum && new Date().getMonth() === month && new Date().getFullYear() === year;
                return (<div key={`day-${dayNum}`} style={{
                        minHeight: '100px',
                        padding: '8px',
                        borderRadius: '8px',
                        border: isToday ? '2px solid rgba(99,102,241,0.6)' : '1px solid rgba(51,65,85,0.5)',
                        backgroundColor: isToday ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }} className="calendar-day-cell">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-xs font-extrabold d-inline-flex align-items-center justify-content-center" style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: isToday ? '#4f46e5' : 'transparent',
                        color: isToday ? '#fff' : '#cbd5e1'
                    }}>
                      {dayNum}
                    </span>
                    {dayAppts.length > 0 && (<span className="badge bg-secondary" style={{ fontSize: '9px' }}>{dayAppts.length}</span>)}
                  </div>

                  <div className="d-flex flex-column gap-1" style={{ maxHeight: '65px', overflowY: 'auto' }}>
                    {dayAppts.map(appt => (<div key={appt.id} onClick={() => onSelectAppointment(appt)} className="px-1.5 py-1 rounded" style={{
                            fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: appt.appointment_status === 'APPROVED' ? 'rgba(16,185,129,0.15)' :
                                appt.appointment_status === 'REQUESTED' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                            color: appt.appointment_status === 'APPROVED' ? '#34d399' :
                                appt.appointment_status === 'REQUESTED' ? '#fbbf24' : '#94a3b8',
                            borderLeft: `3px solid ${appt.appointment_status === 'APPROVED' ? '#10b981' :
                                appt.appointment_status === 'REQUESTED' ? '#f59e0b' : '#64748b'}`
                        }}>
                        <div className="text-truncate">{appt.visitorName}</div>
                        <div style={{ fontSize: '9px', opacity: 0.7 }} className="d-flex align-items-center gap-1">
                          <Clock className="d-inline" style={{ width: '9px', height: '9px' }}/>
                          {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>))}
                  </div>
                </div>);
            })}
          </div>
        </div>)}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (<div className="p-4">
          {appointments.length > 0 ? (<div className="d-flex flex-column gap-3">
              {appointments.map(appt => (<div key={appt.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3" style={{ transition: 'border-color 0.15s' }}>
                  <div className="d-flex align-items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 d-flex align-items-center justify-content-center shrink-0">
                      <User className="h-4 w-4"/>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="font-bold text-white text-sm">{appt.visitorName}</span>
                        <span className={getStatusBadge(appt.appointment_status)} style={{ fontSize: '10px', fontWeight: 700 }}>
                          {appt.appointment_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 mb-0">{appt.purpose || 'No details'}</p>
                      <div className="d-flex flex-wrap align-items-center gap-3 mt-2" style={{ fontSize: '11px', color: '#64748b' }}>
                        <span className="d-flex align-items-center gap-1"><Clock style={{ width: '12px', height: '12px', color: '#818cf8' }}/> {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleString() : 'N/A'}</span>
                        <span className="d-flex align-items-center gap-1"><User style={{ width: '12px', height: '12px', color: '#34d399' }}/> Host: {appt.hostName}</span>
                        <span className="d-flex align-items-center gap-1"><MapPin style={{ width: '12px', height: '12px', color: '#fbbf24' }}/> {appt.roomName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button onClick={() => onSelectAppointment(appt)} className="btn btn-sm btn-outline-primary text-xs font-bold px-3">
                      <Eye className="h-3.5 w-3.5 me-1 d-inline"/> Details
                    </button>
                    <button onClick={() => onRescheduleClick(appt)} className="btn btn-sm btn-outline-secondary text-xs font-bold px-3">
                      Reschedule
                    </button>
                  </div>
                </div>))}
            </div>) : (<div className="text-center py-5 text-slate-500 font-bold text-xs uppercase">
              No appointments scheduled for this period
            </div>)}
        </div>)}

      {/* WEEK & DAY VIEW */}
      {(viewMode === 'week' || viewMode === 'day') && (<div className="p-4">
          <div className="text-center py-4">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2" style={{ color: '#818cf8' }}/>
            <h6 className="text-sm font-bold text-white mb-1">
              {viewMode === 'week' ? 'Weekly Schedule' : 'Daily Schedule'} — {currentDate.toLocaleDateString()}
            </h6>
            <p className="text-xs text-slate-400">Appointments for this {viewMode === 'week' ? 'week' : 'day'}</p>
          </div>
          <div className="d-flex flex-column gap-2 mt-3">
            {appointments.map(appt => (<div key={appt.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg p-3 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-xs font-bold text-white">{appt.visitorName} with {appt.hostName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{appt.purpose} • {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
                <span className={getStatusBadge(appt.appointment_status)} style={{ fontSize: '10px', fontWeight: 700 }}>
                  {appt.appointment_status}
                </span>
              </div>))}
            {appointments.length === 0 && (<div className="text-center py-4 text-slate-500 text-xs font-bold uppercase">No appointments</div>)}
          </div>
        </div>)}
    </div>);
}
