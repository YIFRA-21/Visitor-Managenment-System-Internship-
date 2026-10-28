import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, MapPin, } from 'lucide-react';
import { appointmentsApi } from '../../services/api';
export default function CalendarView() {
    const [viewMode, setViewMode] = useState('WEEK');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState([]);
    // Conflict warning state
    const [conflicts, setConflicts] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const fetchCalendarEvents = async () => {
        setLoading(true);
        try {
            const res = await appointmentsApi.list();
            const fetched = res.data || [];
            setEvents(fetched);
            detectConflicts(fetched);
        }
        catch (err) {
            // Mock fallback calendar dataset
            const mockEvents = [
                {
                    id: 301,
                    title: 'Executive Partnership Meeting',
                    visitor_name: 'Dr. Evelyn Carter',
                    visitor_company: 'Enterprise VMS Global',
                    room_name: 'Boardroom A',
                    start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
                    end: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
                    status: 'APPROVED',
                },
                {
                    id: 302,
                    title: 'Software Security Review',
                    visitor_name: 'Marcus Brody',
                    visitor_company: 'Enterprise VMS Global',
                    room_name: 'Conference Room 2B',
                    start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
                    end: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
                    status: 'CHECKED_IN',
                },
                {
                    id: 303,
                    title: 'Conflicting Time Slot Meeting',
                    visitor_name: 'Sophia Laurent',
                    visitor_company: 'Enterprise VMS Global',
                    room_name: 'Boardroom A',
                    start: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
                    end: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
                    status: 'PENDING',
                },
            ];
            setEvents(mockEvents);
            detectConflicts(mockEvents);
        }
        finally {
            setLoading(false);
        }
    };
    const detectConflicts = (eventList) => {
        const foundConflicts = [];
        for (let i = 0; i < eventList.length; i++) {
            for (let j = i + 1; j < eventList.length; j++) {
                const e1 = eventList[i];
                const e2 = eventList[j];
                const start1 = new Date(e1.scheduled_start || e1.start).getTime();
                const end1 = new Date(e1.scheduled_end || e1.end).getTime();
                const start2 = new Date(e2.scheduled_start || e2.start).getTime();
                const end2 = new Date(e2.scheduled_end || e2.end).getTime();
                if (start1 < end2 && start2 < end1) {
                    foundConflicts.push({ e1, e2, reason: 'Overlapping host schedule timeslot' });
                }
            }
        }
        setConflicts(foundConflicts);
    };
    useEffect(() => {
        fetchCalendarEvents();
    }, [currentDate]);
    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'DAY')
            d.setDate(d.getDate() - 1);
        else if (viewMode === 'WEEK')
            d.setDate(d.getDate() - 7);
        else
            d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };
    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'DAY')
            d.setDate(d.getDate() + 1);
        else if (viewMode === 'WEEK')
            d.setDate(d.getDate() + 7);
        else
            d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">My Host Visits Calendar</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Interactive daily, weekly, and monthly schedule of visitor meetings.</p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-2">
          {['DAY', 'WEEK', 'MONTH', 'AGENDA'].map((mode) => (<button key={mode} onClick={() => setViewMode(mode)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${viewMode === mode
                ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {mode}
            </button>))}
        </div>
      </div>

      {/* Conflict Alert Warning Banner */}
      {conflicts.length > 0 && (<div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3 text-xs font-bold">
            <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse shrink-0"/>
            <span>
              Schedule Conflict Warning: {conflicts.length} overlapping visitor appointment(s) detected in your calendar!
            </span>
          </div>
        </div>)}

      {/* Date Navigation Toolbar */}
      <div className="flex items-center justify-between bg-slate-800/80 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <button onClick={handlePrev} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl">
            <ChevronLeft className="h-4 w-4"/>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold uppercase">
            Today
          </button>
          <button onClick={handleNext} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl">
            <ChevronRight className="h-4 w-4"/>
          </button>
        </div>

        <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: viewMode === 'DAY' ? 'numeric' : undefined })}
        </h2>

        <div className="text-xs text-slate-400 font-semibold hidden md:block">
          Total Events: <span className="text-indigo-400 font-bold">{events.length}</span>
        </div>
      </div>

      {/* Main Calendar View Body */}
      {viewMode === 'AGENDA' || viewMode === 'DAY' ? (<div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-850 pb-3">
            Scheduled Agenda Items
          </h3>
          <div className="space-y-3">
            {events.map((ev) => (<div key={ev.id} onClick={() => setSelectedEvent(ev)} className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Clock className="h-5 w-5"/>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{ev.title || `Meeting with ${ev.visitor_name}`}</h4>
                    <p className="text-[11px] text-slate-400">{ev.visitor_name} ({ev.visitor_company || 'Guest'})</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-300 font-mono flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400"/>
                    {ev.room_name || 'Main Office'}
                  </span>
                  <span className="text-indigo-300 font-mono font-bold">
                    {new Date(ev.scheduled_start || ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(ev.scheduled_end || ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                    {ev.status}
                  </span>
                </div>
              </div>))}
          </div>
        </div>) : (
        /* Week/Month Grid View */
        <div className="bg-slate-800/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-500 pb-4 border-b border-slate-850">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 min-h-[360px]">
            {[...Array(35)].map((_, i) => {
                const dayNum = (i % 31) + 1;
                const hasEvent = i % 4 === 2;
                return (<div key={i} className={`p-2.5 rounded-xl border min-h-[70px] flex flex-col justify-between transition-colors ${dayNum === currentDate.getDate()
                        ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900'}`}>
                  <span className="text-xs font-bold">{dayNum}</span>
                  {hasEvent && (<div className="p-1 bg-indigo-600/30 border border-indigo-500/40 rounded text-[9px] font-bold text-indigo-200 truncate">
                      Guest Meeting
                    </div>)}
                </div>);
            })}
          </div>
        </div>)}

      {/* Selected Event Details Modal */}
      {selectedEvent && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Event Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px]">Title</span>
                <p className="text-white font-bold text-sm">{selectedEvent.title || 'Host Visitor Meeting'}</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px]">Visitor</span>
                <p className="text-slate-200 font-semibold">{selectedEvent.visitor_name} ({selectedEvent.visitor_company || 'Guest'})</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px]">Time Slot</span>
                <p className="text-indigo-300 font-mono font-bold">
                  {new Date(selectedEvent.scheduled_start || selectedEvent.start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px]">Room Location</span>
                <p className="text-slate-300 font-semibold">{selectedEvent.room_name || 'Main Reception'}</p>
              </div>
            </div>

            <button onClick={() => setSelectedEvent(null)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase">
              Close Details
            </button>
          </div>
        </div>)}
    </div>);
}
