import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Building, User, CheckCircle2, XCircle, QrCode, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorArrivalManagement({ onNavigate }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [arrivals, setArrivals] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [message, setMessage] = useState(null);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const fetchArrivals = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reception/arrivals?search=${encodeURIComponent(search)}&filter=${filter}`);
            setArrivals(Array.isArray(res.data) ? res.data : []);
        }
        catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to load arriving visitors.' });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchArrivals();
    }, [filter]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchArrivals();
    };
    const handleConfirmArrival = async (id) => {
        setActionLoading(true);
        try {
            const res = await api.post(`/reception/arrivals/${id}/confirm`);
            setMessage({ type: 'success', text: res.data.message || 'Arrival confirmed and host notified.' });
            fetchArrivals();
        }
        catch (err) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleCancelArrival = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this visitor arrival?'))
            return;
        setActionLoading(true);
        try {
            await api.post(`/reception/arrivals/${id}/cancel`, { reason: 'Cancelled at Reception' });
            setMessage({ type: 'success', text: 'Visitor arrival process cancelled.' });
            fetchArrivals();
        }
        catch (err) {
            setMessage({ type: 'error', text: 'Failed to cancel arrival.' });
        }
        finally {
            setActionLoading(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onNavigate ? () => onNavigate('dashboard') : undefined} fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="h-6 w-6 text-emerald-400"/>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">{t('reception.arrivalTitle', 'Visitor Arrival Management')}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('reception.arrivalSub', 'Coordinate arriving visitors, record lobby entry timestamp, and notify host employees instantly.')}
            </p>
          </div>
        </div>
        <button onClick={fetchArrivals} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
          <RefreshCw className="h-4 w-4"/>
          <span>{t('reception.refreshList', 'Refresh List')}</span>
        </button>
      </div>

      {/* Alert Banner */}
      {message && (<div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <span className="text-xs font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
        </div>)}

      {/* Search & Filter Bar */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
            <input type="text" placeholder={t('reception.searchArrivals', 'Search by Visitor Name, Appointment #, Company, or Host...')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"/>
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase">
            {t('common.search', 'Search')}
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400"/>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none">
            <option value="ALL">{t('reception.allScheduled', 'All Scheduled Visitors')}</option>
            <option value="TODAY">{t('reception.todayScheduled', "Today's Scheduled")}</option>
            <option value="EXPECTED">{t('reception.expectedPending', 'Expected (Pending Arrival)')}</option>
            <option value="ARRIVED">{t('reception.arrivedReception', 'Arrived at Reception')}</option>
          </select>
        </div>
      </div>

      {/* Arrival Grid Cards */}
      {loading ? (<div className="p-12 text-center text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-2"/>
          <p className="text-xs font-bold uppercase tracking-wider">Syncing Arriving Visitors...</p>
        </div>) : arrivals.length === 0 ? (<div className="p-12 bg-[#0a0f19] border border-slate-800 rounded-2xl text-center text-slate-500 space-y-3">
          <AlertCircle className="h-10 w-10 mx-auto text-slate-600"/>
          <p className="text-sm font-bold text-slate-400">No Arriving Visitors Found</p>
          <p className="text-xs text-slate-600">Try adjusting search query or filter selection.</p>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arrivals.map((appt) => {
                const isArrived = !!appt.arrival_time;
                return (<div key={appt.id} className="bg-[#0a0f19] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 relative flex flex-col justify-between">
                <div>
                  {/* Top Status Badge */}
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      {appt.appointment_number}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isArrived ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {isArrived ? 'Lobby Arrived' : 'Expected'}
                    </span>
                  </div>

                  {/* Visitor Profile Info */}
                  <div className="flex items-center gap-3 pt-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
                      {(appt.visitor_photo || appt.photo_url || appt.profile_photo) ? (<img src={resolvePhotoUrl(appt.visitor_photo || appt.photo_url || appt.profile_photo)} alt={appt.visitor_name} className="h-full w-full object-cover rounded-lg"/>) : (<User className="h-6 w-6 text-slate-500"/>)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{appt.visitor_name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Building className="h-3 w-3 text-slate-500"/>
                        {appt.visitor_company || 'Independent Visitor'}
                      </p>
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div className="mt-4 space-y-2 text-xs border-t border-slate-850 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Host Employee:</span>
                      <span className="text-slate-200 font-bold">{appt.host_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Department:</span>
                      <span className="text-slate-300">{appt.department_name || 'Executive Office'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Scheduled Time:</span>
                      <span className="text-indigo-400 font-mono font-bold">
                        {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>
                    {isArrived && (<div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Arrival Recorded:</span>
                        <span className="font-mono">{new Date(appt.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>)}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                  {!isArrived ? (<button disabled={actionLoading} onClick={() => handleConfirmArrival(appt.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="h-4 w-4"/>
                      <span>Confirm Arrival</span>
                    </button>) : (<button onClick={() => onNavigate && onNavigate('passes')} className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <QrCode className="h-4 w-4"/>
                      <span>Issue Pass</span>
                    </button>)}

                  <button disabled={actionLoading} onClick={() => handleCancelArrival(appt.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-bold transition-all" title="Cancel Arrival">
                    <XCircle className="h-4 w-4"/>
                  </button>
                </div>
              </div>);
            })}
        </div>)}
    </div>);
}
