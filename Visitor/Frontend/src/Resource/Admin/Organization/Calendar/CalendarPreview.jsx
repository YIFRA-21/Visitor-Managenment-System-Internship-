import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import api from '../../../../services/api';
export default function CalendarPreview({ onNotify }) {
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(7); // July default
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const fetchCalendar = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/preview', {
                params: { organizationId: 1, year, month }
            });
            setDays(res.data.days || []);
        }
        catch {
            onNotify('Failed to fetch calendar preview details.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCalendar();
        setSelectedDay(null);
    }, [year, month]);
    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        }
        else {
            setMonth(month - 1);
        }
    };
    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        }
        else {
            setMonth(month + 1);
        }
    };
    const getMonthName = (m) => {
        return new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' });
    };
    return (<div className="row g-4">
      {/* Calendar Grid */}
      <div className="col-12 col-lg-8">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          {/* Controls */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-3 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0 d-flex align-items-center gap-2">
              <Calendar className="text-blue-500 h-4.5 w-4.5"/> Calendar Grid Preview
            </h3>
            <div className="d-flex align-items-center gap-2">
              <button onClick={handlePrevMonth} className="btn btn-xs btn-outline-secondary p-1">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              <span className="text-xs font-extrabold text-slate-950 dark:text-white px-2">
                {getMonthName(month)} {year}
              </span>
              <button onClick={handleNextMonth} className="btn btn-xs btn-outline-secondary p-1">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>

          {loading ? (<div className="p-16 text-center">
              <div className="spinner-border text-primary" role="status"/>
              <p className="text-slate-400 text-xs fw-semibold mt-3">Rendering calendar grid...</p>
            </div>) : (<div className="space-y-4">
              {/* Day headers */}
              <div className="row row-cols-7 text-center text-slate-400 text-[10px] font-bold uppercase border-bottom pb-1 dark:border-slate-800">
                <div className="col">Mon</div>
                <div className="col">Tue</div>
                <div className="col">Wed</div>
                <div className="col">Thu</div>
                <div className="col">Fri</div>
                <div className="col">Sat</div>
                <div className="col">Sun</div>
              </div>

              {/* Day cards grid */}
              <div className="row row-cols-7 g-1">
                {/* Find day offset (e.g. leading empty boxes) */}
                {(() => {
                if (days.length === 0)
                    return null;
                const firstDayName = days[0].dayOfWeek;
                const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const offset = dayOrder.indexOf(firstDayName);
                const elements = [];
                for (let i = 0; i < offset; i++) {
                    elements.push(<div key={`empty-${i}`} className="col border border-transparent min-h-[60px]"/>);
                }
                return elements;
            })()}

                {days.map((d) => {
                const isSel = selectedDay?.date === d.date;
                let borderStyle = 'border-slate-100 dark:border-slate-800';
                let bgStyle = 'bg-slate-50 dark:bg-slate-900 text-slate-400';
                if (d.type === 'STANDARD' && d.isOpen) {
                    borderStyle = 'border-emerald-200 dark:border-emerald-900/40';
                    bgStyle = 'bg-emerald-50/40 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300';
                }
                else if (d.type === 'HOLIDAY') {
                    borderStyle = 'border-red-200 dark:border-red-900/40';
                    bgStyle = 'bg-red-50/40 dark:bg-red-950/10 text-red-800 dark:text-red-300';
                }
                else if (d.type === 'SPECIAL_WORKING_DAY') {
                    borderStyle = 'border-blue-200 dark:border-blue-900/40';
                    bgStyle = 'bg-blue-50/40 dark:bg-blue-950/10 text-blue-800 dark:text-blue-300';
                }
                if (isSel) {
                    borderStyle = 'border-primary ring-2 ring-primary ring-opacity-25';
                }
                return (<button key={d.date} onClick={() => setSelectedDay(d)} className={`col border rounded-lg text-start p-1.5 min-h-[65px] transition-all duration-150 d-flex flex-column justify-content-between ${bgStyle} ${borderStyle}`} style={{ cursor: 'pointer' }}>
                      <span className="font-extrabold text-xs">{new Date(d.date).getDate()}</span>
                      <div className="text-[8px] font-bold truncate uppercase tracking-tighter opacity-80 mt-1">
                        {d.type.replace(/_/g, ' ')}
                      </div>
                    </button>);
            })}
              </div>
            </div>)}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="col-12 col-lg-4">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0 d-flex align-items-center gap-2">
            <Info className="text-blue-500 h-4 w-4"/> Day Inspector
          </h3>

          {selectedDay ? (<div className="space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-300">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase d-block">Selected Date</span>
                <p className="font-extrabold text-slate-900 dark:text-white text-base">
                  {new Date(selectedDay.date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                </p>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <span className="text-slate-400 text-[10px] font-bold uppercase d-block">Operating Status</span>
                  <span className={`badge ${selectedDay.isOpen ? 'bg-success text-white' : 'bg-secondary text-white'} text-[9px] uppercase font-bold px-2 py-0.5 rounded`}>
                    {selectedDay.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="col-6">
                  <span className="text-slate-400 text-[10px] font-bold uppercase d-block">Calendar Day Type</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedDay.type}</span>
                </div>
              </div>

              {selectedDay.reason && (<div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase d-block">Exemption / Details</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">{selectedDay.reason}</p>
                </div>)}

              {selectedDay.isOpen && selectedDay.hours && (<div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-slate-400 text-[9px] font-bold uppercase d-block mb-1">Shift Hours</span>
                  <div className="d-flex justify-content-between">
                    <span>Opening Time</span>
                    <span className="font-extrabold text-slate-950 dark:text-white">{selectedDay.hours.openingTime}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Closing Time</span>
                    <span className="font-extrabold text-slate-950 dark:text-white">{selectedDay.hours.closingTime}</span>
                  </div>
                  {selectedDay.hours.breakStart && (<div className="d-flex justify-content-between border-top pt-1.5 dark:border-slate-800">
                      <span>Break Window</span>
                      <span className="font-extrabold text-slate-950 dark:text-white">
                        {selectedDay.hours.breakStart} - {selectedDay.hours.breakEnd}
                      </span>
                    </div>)}
                </div>)}
            </div>) : (<div className="p-16 text-center text-slate-400 text-xs font-semibold">
              Select a day in the calendar grid to inspect its active operational rules.
            </div>)}
        </div>
      </div>
    </div>);
}
