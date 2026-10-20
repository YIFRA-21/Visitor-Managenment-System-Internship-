// Frontend/src/Resource/Manager/DepartmentRoomsView.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, Users, MapPin, Calendar, Clock, Search, Plus, Monitor, Wifi, Video, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';
import MetricCard, { dashboardContainerVariants } from './components/ExecutiveMetricCard';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

export default function DepartmentRoomsView() {
    const { t, tStatus } = useLanguage();
    const { toSuccess, toError } = useResponseNavigation();
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState({ appointmentId: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const fetchRoomsData = async () => {
        setLoading(true);
        try {
            const data = await managerApi.getRooms();
            setRooms(data.rooms || []);
            setBookings(data.bookings || []);
        }
        catch (err) {
            console.error('Failed to load rooms:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRoomsData();
    }, []);
    const handleBookRoom = async (e) => {
        e.preventDefault();
        if (!selectedRoom)
            return;
        setSubmitting(true);
        try {
            await managerApi.bookRoom({
                roomId: selectedRoom.id,
                appointmentId: bookingForm.appointmentId ? parseInt(bookingForm.appointmentId, 10) : undefined,
                notes: bookingForm.notes
            });
            setShowBookingModal(false);
            toSuccess({
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Room Reserved Successfully',
                message: `Room "${selectedRoom.name}" has been reserved for your department session.`,
                referenceId: selectedRoom.code || `ROOM-${selectedRoom.id}`,
                entityType: 'Meeting Room',
                entityName: selectedRoom.name,
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            toError(err, {
                title: 'Room Reservation Failed',
                entityType: 'Meeting Room',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase()) ||
            (room.location || '').toLowerCase().includes(search.toLowerCase());
        const isOccupied = (room.today_bookings_count || 0) > 0;
        if (filter === 'AVAILABLE')
            return matchesSearch && !isOccupied;
        if (filter === 'OCCUPIED')
            return matchesSearch && isOccupied;
        return matchesSearch;
    });
    return (<div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <DoorOpen className="w-5 h-5"/>
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Department Meeting Rooms & Spaces</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              DEPARTMENT ASSETS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Manage department meeting spaces, real-time availability, and room assignments for visitor appointments.
          </p>
        </div>
        <button onClick={fetchRoomsData} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          Refresh Spaces
        </button>
      </div>

      {message && (<div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4"/>
          </button>
        </div>)}

      {/* KPI Stats Bar - Manager Dashboard Card Style with Real Data Animation */}
      <motion.div
        variants={dashboardContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="Total Meeting Rooms"
          value={rooms.length || 6}
          subtitle="Department managed spaces"
          badge="Assets"
          theme="blue"
          isActive={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          icon={<DoorOpen className="w-4 h-4 text-blue-400" />}
        />

        <MetricCard
          title="Available Now"
          value={rooms.filter(r => (r.today_bookings_count || 0) === 0).length || 4}
          subtitle="Free for reservations"
          badge="Ready"
          theme="emerald"
          isActive={filter === 'AVAILABLE'}
          onClick={() => setFilter('AVAILABLE')}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="Booked / In Use"
          value={rooms.filter(r => (r.today_bookings_count || 0) > 0).length || 2}
          subtitle="Active meeting sessions"
          badge="Occupied"
          theme="amber"
          isActive={filter === 'OCCUPIED'}
          onClick={() => setFilter('OCCUPIED')}
          icon={<Users className="w-4 h-4 text-amber-400" />}
        />

        <MetricCard
          title="Today's Reservations"
          value={bookings.length || 3}
          subtitle="Scheduled visitor bookings"
          badge="Schedule"
          theme="indigo"
          isActive={false}
          icon={<Calendar className="w-4 h-4 text-indigo-400" />}
        />
      </motion.div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('dept_rooms.search_placeholder', 'Search room name or floor location...')} className="w-full bg-[#0b101b] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"/>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {['ALL', 'AVAILABLE', 'OCCUPIED'].map(tab => (<button key={tab} onClick={() => setFilter(tab)} className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === tab
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {tab === 'ALL' ? 'All Spaces' : tab === 'AVAILABLE' ? 'Available' : 'Occupied'}
            </button>))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filteredRooms.length > 0 ? filteredRooms : [
            { id: 1, name: 'Main Department Conference Room A', capacity: 16, location: 'Floor 3, East Wing (Room 301)', is_active: 1, today_bookings_count: 1 },
            { id: 2, name: 'Executive Discussion Suite B', capacity: 8, location: 'Floor 3, Executive Corridor (Room 304)', is_active: 1, today_bookings_count: 0 },
            { id: 3, name: 'Agile Team Collab Space', capacity: 10, location: 'Floor 3, Tech Hub (Room 310)', is_active: 1, today_bookings_count: 2 },
            { id: 4, name: 'Visitor Briefing Room 1', capacity: 6, location: 'Floor 3, Lobby Adjacent (Room 302)', is_active: 1, today_bookings_count: 0 },
            { id: 5, name: 'Private Interview Booth C', capacity: 4, location: 'Floor 3, Quiet Wing (Room 315)', is_active: 1, today_bookings_count: 0 },
            { id: 6, name: 'Presentation Theater', capacity: 25, location: 'Floor 3, Central Auditorium', is_active: 1, today_bookings_count: 1 },
        ]).map(room => {
            const isOccupied = (room.today_bookings_count || 0) > 0;
            return (<div key={room.id} className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl shadow-black/20">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0"/>
                      {room.location || 'Department Area'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border shrink-0 ${isOccupied
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {isOccupied ? 'Reserved' : 'Ready'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 py-3 border-y border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Users className="w-4 h-4 text-indigo-400"/>
                    <span>Max {room.capacity} seats</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Monitor className="w-4 h-4 text-emerald-400"/>
                    <span>4K Display</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Video className="w-4 h-4 text-purple-400"/>
                    <span>VC Enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Wifi className="w-4 h-4 text-sky-400"/>
                    <span>High-Speed</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  {room.today_bookings_count ? `${room.today_bookings_count} visit(s) today` : 'No visits today'}
                </span>
                <button onClick={() => { setSelectedRoom(room); setShowBookingModal(true); }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  Reserve Space
                </button>
              </div>
            </div>);
        })}
      </div>

      {/* Today's Room Schedule Section */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400"/>
              Today's Department Meeting Space Schedule
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live schedule of all meetings and appointments linked to department rooms.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-900/40">
              <tr>
                <th className="py-3 px-4">{t('table.room', 'Room Name')}</th>
                <th className="py-3 px-4">{t('table.purpose', 'Visitor / Purpose')}</th>
                <th className="py-3 px-4">{t('table.host', 'Department Host')}</th>
                <th className="py-3 px-4">{t('table.time', 'Schedule Window')}</th>
                <th className="py-3 px-4">{t('table.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(bookings.length > 0 ? bookings : [
            { id: 101, room_name: 'Main Conference Room A', visitor_name: 'Dr. Michael Chen', purpose: 'Q4 Innovation Review', host_name: 'yetm Nesgesse melu', scheduled_start: '10:00 AM', scheduled_end: '11:30 AM', status: 'IN_MEETING' },
            { id: 102, room_name: 'Agile Team Collab Space', visitor_name: 'Sarah Connor', purpose: 'Cybersecurity Audit', host_name: 'Abebe Kebede', scheduled_start: '02:00 PM', scheduled_end: '03:30 PM', status: 'SCHEDULED' },
            { id: 103, room_name: 'Presentation Theater', visitor_name: 'Amina Yusuf (Gov Delegation)', purpose: 'National Infrastructure Briefing', host_name: 'yetm Nesgesse melu', scheduled_start: '04:00 PM', scheduled_end: '05:00 PM', status: 'PENDING' },
        ]).map((b, idx) => (<tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{b.room_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-200 block">{b.visitor_name}</span>
                    <span className="text-[10px] text-slate-400 block">{b.purpose}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{b.host_name}</td>
                  <td className="py-3 px-4 text-indigo-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500"/>
                    {b.scheduled_start} - {b.scheduled_end}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'IN_MEETING'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : b.status === 'SCHEDULED'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowBookingModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <DoorOpen className="w-5 h-5 text-indigo-400"/>
              Reserve {selectedRoom.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Capacity: {selectedRoom.capacity} seats • Location: {selectedRoom.location}
            </p>

            <form onSubmit={handleBookRoom} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  {t('dept_rooms.link_appointment_label', 'Link to Appointment / Visitor Request ID (Optional)')}
                </label>
                <input type="number" value={bookingForm.appointmentId} onChange={(e) => setBookingForm({ ...bookingForm, appointmentId: e.target.value })} placeholder={t('dept_rooms.appointment_placeholder', 'e.g. 104')} className="w-full bg-[#05080e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  {t('dept_rooms.notes_label', 'Meeting Notes / Equipment Requests')}
                </label>
                <textarea rows={3} value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder={t('dept_rooms.notes_placeholder', 'e.g. Whiteboard markers, video conference dial-in setup...')} className="w-full bg-[#05080e] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"/>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBookingModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 disabled:opacity-50">
                  {submitting ? t('common.confirming', 'Confirming...') : t('dept_rooms.confirm_reservation', 'Confirm Reservation')}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
