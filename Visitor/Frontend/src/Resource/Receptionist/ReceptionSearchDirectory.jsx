import React, { useState } from 'react';
import { Search, User, Building, Clock, UserCheck, LogOut, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { checkinApi, checkoutApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
export default function ReceptionSearchDirectory() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [filterType, setFilterType] = useState('ALL');
    const [actionLoading, setActionLoading] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const handleSearch = async (e) => {
        if (e)
            e.preventDefault();
        if (!query.trim())
            return;
        setLoading(true);
        setActionMessage(null);
        try {
            const res = await api.get(`/reception/search?q=${encodeURIComponent(query.trim())}`);
            setResults(Array.isArray(res.data) ? res.data : []);
            setSearched(true);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleQuickCheckIn = async (item) => {
        const code = item.reference_code || item.identifier || String(item.appointment_id || item.id);
        setActionLoading(item.id);
        setActionMessage(null);
        try {
            const res = await checkinApi.scan({
                referenceCode: code,
                qrToken: code,
                badgeNumber: 'BDG-' + Math.floor(1000 + Math.random() * 9000),
                notes: 'Checked in via Reception Global Search'
            });
            setActionMessage({
                type: 'success',
                text: `✓ Checked in ${item.visitor_name}! Assigned Badge: ${res.data?.badgeNumber || 'BDG'}`
            });
            handleSearch();
        }
        catch (err) {
            setActionMessage({ type: 'error', text: getErrorMessage(err) });
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleQuickCheckOut = async (item) => {
        const code = item.badge_number || item.reference_code || item.identifier || String(item.checkin_id || item.id);
        setActionLoading(item.id);
        setActionMessage(null);
        try {
            const res = await checkoutApi.process({
                code,
                remarks: 'Checked out via Reception Global Search'
            });
            setActionMessage({
                type: 'success',
                text: `✓ Checked out ${item.visitor_name}! Total duration: ${res.data?.data?.totalVisitDuration || '—'} minutes.`
            });
            handleSearch();
        }
        catch (err) {
            setActionMessage({ type: 'error', text: getErrorMessage(err) });
        }
        finally {
            setActionLoading(null);
        }
    };
    const filteredResults = results.filter((r) => {
        if (filterType === 'ALL')
            return true;
        return r.record_type === filterType;
    });
    return (<div className="p-4 md:p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
            <Search className="h-6 w-6 text-blue-400"/>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Reception Directory & Search All Ways</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified lookup across Active Guests Inside, Scheduled Appointments, Pass Codes, and Visitor Profiles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard?view=checkin')} className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5"/> Check-In Console
          </button>
          <button onClick={() => navigate('/dashboard?view=checkout')} className="px-3 py-1.5 bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5"/> Check-Out Console
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (<div className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg ${actionMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400"/> : <AlertCircle className="h-5 w-5 text-red-400"/>}
            <span className="text-xs font-bold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
        </div>)}

      {/* Search Input Box */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl max-w-3xl mx-auto space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-400"/>
            <input type="text" placeholder="Search by Visitor Name, Ref # (VMS-XXXX), Visitor ID (#42), Badge, Phone, Email, Host, Company..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus className="w-full bg-slate-900 border-2 border-slate-750 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition"/>
          </div>
          <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 shrink-0 transition">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
            <span>Search All Ways</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 pt-1">
          <span className="font-semibold text-slate-500">Searches:</span>
          {['Visitor Name', 'Reference Code', 'Visitor ID', 'Badge #', 'Phone', 'Email', 'Company', 'Host Name'].map((t) => (<span key={t} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              {t}
            </span>))}
        </div>
      </div>

      {/* Results Section */}
      {searched && (<div className="space-y-4 max-w-5xl mx-auto">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Results ({filteredResults.length} of {results.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { key: 'ALL', label: 'All Results' },
                { key: 'INSIDE', label: 'Inside Now' },
                { key: 'APPOINTMENT', label: 'Appointments' },
                { key: 'VISITOR', label: 'Visitor Profiles' },
            ].map((tab) => (<button key={tab.key} onClick={() => setFilterType(tab.key)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterType === tab.key
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
                  {tab.label}
                </button>))}
            </div>
          </div>

          {filteredResults.length === 0 ? (<div className="p-12 bg-[#0a0f19] border border-slate-800 rounded-2xl text-center text-slate-500 space-y-2">
              <Search className="h-10 w-10 mx-auto text-slate-600 mb-2"/>
              <p className="text-sm font-bold text-slate-300">No Records Found</p>
              <p className="text-xs text-slate-500">No records matched "{query}" under the current filter.</p>
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredResults.map((rec, i) => {
                    const isInside = rec.record_type === 'INSIDE';
                    const isAppointment = rec.record_type === 'APPOINTMENT';
                    const isVisitor = rec.record_type === 'VISITOR';
                    const isActionBusy = actionLoading === rec.id;
                    return (<div key={i} className={`bg-[#0a0f19] border rounded-2xl p-4 shadow-xl space-y-3 transition ${isInside
                            ? 'border-rose-500/40 bg-rose-950/5'
                            : isAppointment
                                ? 'border-indigo-500/30'
                                : 'border-slate-800'}`}>
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${isInside
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : isAppointment
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {isInside ? '● INSIDE BUILDING' : isAppointment ? 'APPOINTMENT' : 'VISITOR PROFILE'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">{rec.identifier}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-sm font-black text-white flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-400 shrink-0"/>
                        {rec.visitor_name}
                      </p>
                      <p className="text-slate-400 pl-6 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        {rec.visitor_company || 'Independent'}
                      </p>
                      {rec.host_name && rec.host_name !== 'N/A' && (<p className="text-slate-400 pl-6 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                          Host: <strong className="text-slate-200">{rec.host_name}</strong> ({rec.department_name})
                        </p>)}
                      {rec.scheduled_time && (<p className="text-slate-400 pl-6 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                          {isInside ? 'Checked-in: ' : 'Scheduled: '}
                          {new Date(rec.scheduled_time).toLocaleString()}
                        </p>)}
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Status: <strong className="text-slate-300 uppercase">{rec.status}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {isInside ? (<button disabled={isActionBusy} onClick={() => handleQuickCheckOut(rec)} className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50">
                            {isActionBusy ? <RefreshCw className="h-3.5 w-3.5 animate-spin"/> : <LogOut className="h-3.5 w-3.5"/>}
                            <span>Check-Out</span>
                          </button>) : isAppointment && rec.status !== 'CHECKED_OUT' && rec.status !== 'CANCELLED' ? (<button disabled={isActionBusy} onClick={() => handleQuickCheckIn(rec)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50">
                            {isActionBusy ? <RefreshCw className="h-3.5 w-3.5 animate-spin"/> : <UserCheck className="h-3.5 w-3.5"/>}
                            <span>Check-In</span>
                          </button>) : isVisitor ? (<button onClick={() => navigate(`/dashboard?view=checkin`)} className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition">
                            <span>Start Check-In</span>
                          </button>) : null}
                      </div>
                    </div>
                  </div>);
                })}
            </div>)}
        </div>)}
    </div>);
}
