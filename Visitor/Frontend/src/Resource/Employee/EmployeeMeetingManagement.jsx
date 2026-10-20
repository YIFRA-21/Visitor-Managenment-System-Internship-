import React, { useState, useEffect } from 'react';
import { Building, Users, CheckCircle2, Plus, AlertCircle, RefreshCw, } from 'lucide-react';
import { employeePortalApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

export default function EmployeeMeetingManagement() {
    const { t } = useLanguage();
    const { toSuccess, toError } = useResponseNavigation();
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    // Reservation Modal State
    const [showReserveModal, setShowReserveModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [reserveForm, setReserveForm] = useState({
        title: '',
        scheduledStart: '',
        scheduledEnd: '',
        meetingNotes: '',
    });
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await employeePortalApi.getRooms();
            setRooms(res.data?.rooms || []);
            setBookings(res.data?.bookings || []);
        }
        catch (err) {
            // Mock room dataset fallback
            const mockRooms = [
                { id: 1, room_name: 'Executive Boardroom A', capacity: 16, location: 'Building 1, Fl 4', is_available: true, features: ['4K TV', 'Video Conf', 'Wi-Fi'] },
                { id: 2, room_name: 'Innovation Hub B', capacity: 8, location: 'Building 1, Fl 3', is_available: true, features: ['Whiteboard', '4K TV', 'Wi-Fi'] },
                { id: 3, room_name: 'Conference Suite 3C', capacity: 12, location: 'Building 2, Fl 2', is_available: false, features: ['Projector', 'Video Conf'] },
                { id: 4, room_name: 'Creative Studio 4D', capacity: 6, location: 'Building 1, Fl 2', is_available: true, features: ['Wi-Fi', 'Smart Board'] },
            ];
            setRooms(mockRooms);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRooms();
    }, []);
    const handleReserveRoom = async (e) => {
        e.preventDefault();
        if (!selectedRoom)
            return;
        setSubmitting(true);
        try {
            await employeePortalApi.reserveRoom({
                roomId: selectedRoom.id,
                title: reserveForm.title,
                scheduledStart: reserveForm.scheduledStart,
                scheduledEnd: reserveForm.scheduledEnd,
                meetingNotes: reserveForm.meetingNotes,
            });
            setShowReserveModal(false);
            toSuccess({
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Room Reserved Successfully',
                message: `Room "${selectedRoom.room_name}" has been reserved for "${reserveForm.title || 'Guest Meeting'}".`,
                referenceId: `ROOM-${selectedRoom.id}`,
                entityType: 'Conference Room',
                entityName: selectedRoom.room_name,
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        catch (err) {
            toError(err, {
                title: 'Room Reservation Failed',
                entityType: 'Conference Room',
                returnUrl: window.location.pathname + window.location.search,
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Meeting & Room Management</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Check conference room availability and reserve facilities for guest meetings.</p>
        </div>

        <button onClick={fetchRooms} className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
          <span>Refresh Rooms</span>
        </button>
      </div>

      {/* Message Banner */}
      {message && (<div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center space-x-3 text-xs font-bold">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>)}

      {/* Room Directory Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room) => (<div key={room.id} className="bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">{room.room_name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{room.location}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full border ${room.is_available !== false
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {room.is_available !== false ? 'Available' : 'Occupied'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Capacity</span>
                  <span className="text-white font-mono font-bold flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-400"/>
                    {room.capacity || 10} Persons
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 font-bold uppercase block text-[10px] mb-1.5">Equipment & Features</span>
                  <div className="flex flex-wrap gap-1">
                    {(room.features || ['4K TV', 'Wi-Fi', 'Video Conf']).map((f, idx) => (<span key={idx} className="px-2 py-0.5 bg-slate-900 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800">
                        {f}
                      </span>))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-850">
              <button onClick={() => { setSelectedRoom(room); setShowReserveModal(true); }} disabled={room.is_available === false} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center space-x-1.5 transition-all">
                <Plus className="h-3.5 w-3.5"/>
                <span>Reserve Room</span>
              </button>
            </div>
          </div>))}
      </div>

      {/* Reserve Room Form Modal */}
      {showReserveModal && selectedRoom && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-400"/>
                <span>Reserve Facility: {selectedRoom.room_name}</span>
              </h3>
              <button onClick={() => setShowReserveModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleReserveRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">{t('meeting.title', 'Meeting Title')}</label>
                <input type="text" value={reserveForm.title} onChange={(e) => setReserveForm({ ...reserveForm, title: e.target.value })} placeholder={t('meeting.placeholder_title', 'e.g. Host Client Strategy Session')} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" required/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('meeting.start_time', 'Start Time')}</label>
                  <input type="datetime-local" value={reserveForm.scheduledStart} onChange={(e) => setReserveForm({ ...reserveForm, scheduledStart: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" required/>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">{t('meeting.end_time', 'End Time')}</label>
                  <input type="datetime-local" value={reserveForm.scheduledEnd} onChange={(e) => setReserveForm({ ...reserveForm, scheduledEnd: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" required/>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">{t('meeting.notes_equipment', 'Meeting Notes & Equipment Request')}</label>
                <textarea rows={3} value={reserveForm.meetingNotes} onChange={(e) => setReserveForm({ ...reserveForm, meetingNotes: e.target.value })} placeholder={t('meeting.placeholder_notes', 'Special instructions, seating layout, AV assistance...')} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowReserveModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase">
                  {submitting ? t('common.reserving', 'Reserving...') : t('meeting.confirm_reservation', 'Confirm Reservation')}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
