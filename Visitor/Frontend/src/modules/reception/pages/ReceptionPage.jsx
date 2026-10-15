import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, LogOut, User, Clock, Search, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';
import { checkinApi } from '../../../services/api';
import { getBackendBaseUrl } from '../../../utils/apiUrl';
const API_BASE = getBackendBaseUrl();
export default function ReceptionPage() {
    const [visitors, setVisitors] = useState([]);
    const [scanInput, setScanInput] = useState('');
    const [message, setMessage] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const loadBoard = useCallback(() => {
        checkinApi.liveBoard().then((res) => setVisitors(res.data));
    }, []);
    useEffect(() => {
        loadBoard();
        const socket = io(API_BASE);
        socket.on('visitor-arrived', (data) => {
            setToast(`${data.visitorName} has arrived!`);
            loadBoard();
            setTimeout(() => setToast(null), 5000);
        });
        return () => { socket.disconnect(); };
    }, [loadBoard]);
    const handleScan = async () => {
        if (!scanInput.trim())
            return;
        setScanLoading(true);
        setMessage('');
        try {
            const isRef = scanInput.startsWith('VMS-');
            const res = await checkinApi.scan(isRef ? { referenceCode: scanInput.trim() } : { qrToken: scanInput.trim() });
            setMessage(res.data.message + (res.data.badgeNumber ? ` — Badge: ${res.data.badgeNumber}` : ''));
            setScanInput('');
            loadBoard();
        }
        catch (err) {
            const axiosErr = err;
            setMessage(axiosErr.response?.data?.error || 'Scan failed');
        }
        finally {
            setScanLoading(false);
        }
    };
    const handleCheckout = async (appointmentId) => {
        await checkinApi.checkout(parseInt(appointmentId));
        loadBoard();
    };
    const isOverdue = (scheduledEnd) => {
        return new Date(scheduledEnd) < new Date();
    };
    const checkedIn = visitors.filter((v) => v.status === 'checked_in');
    const expected = visitors.filter((v) => v.status === 'approved');
    // Calculate overdue checked in count
    const overdueCount = checkedIn.filter((v) => isOverdue(v.scheduled_end)).length;
    return (<DashboardLayout>
      <AnimatePresence>
        {toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-4 right-4 z-50 rounded-xl bg-emerald-600 px-6 py-3 text-white shadow-lg">
            {toast}
          </motion.div>)}
      </AnimatePresence>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reception Desk</h1>
          <p className="text-slate-500">Live visitor board and check-in management</p>
        </div>
        <button onClick={loadBoard} className="btn-secondary">
          <RefreshCw className="h-4 w-4"/> Refresh
        </button>
      </div>

      {/* Security Alert Banner for Overdue Visitors */}
      {overdueCount > 0 && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5"/>
          <div className="flex-1">
            <h3 className="font-bold text-red-950">Security Compliance Notice</h3>
            <p className="text-red-800/90 text-xs mt-0.5">
              There are {overdueCount} visitor(s) currently checked in who have exceeded their scheduled meeting duration. Please coordinate with security or check out the visitors.
            </p>
          </div>
        </motion.div>)}

      <div className="card mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>
            <input className="input pl-11" placeholder="Scan QR token or enter reference code (VMS-...)" value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScan()}/>
          </div>
          <button onClick={handleScan} disabled={scanLoading} className="btn-primary">
            <Scan className="h-4 w-4"/>
            {scanLoading ? 'Processing...' : 'Check In'}
          </button>
        </div>
        {message && (<p className={`mt-3 text-sm ${message.includes('failed') || message.includes('Cannot') ? 'text-red-600' : 'text-emerald-600'}`}>
            {message}
          </p>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5 text-emerald-600"/>
            On-Site ({checkedIn.length})
          </h2>
          <div className="space-y-3">
            {checkedIn.length === 0 ? (<div className="card text-center py-8 text-slate-400">No visitors currently on-site</div>) : (checkedIn.map((v) => {
            const overdue = isOverdue(v.scheduled_end);
            return (<motion.div key={v.id} layout className={`card flex items-center justify-between !p-4 border-l-4 ${overdue
                    ? 'border-l-red-500 bg-red-50/30 shadow-sm shadow-red-100'
                    : 'border-l-emerald-500'}`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{v.visitor_name}</p>
                        {overdue && (<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
                            <ShieldAlert className="h-3 w-3"/> Overdue
                          </span>)}
                      </div>
                      <p className="text-xs text-slate-500">{v.host_name} · {v.badge_number}</p>
                      <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                        <p>Checked-in: {v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString() : '—'}</p>
                        <p className={overdue ? 'text-red-600 font-medium' : ''}>
                          Scheduled End: {v.scheduled_end ? new Date(v.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleCheckout(v.id)} className={`btn-secondary !py-2 !px-3 text-xs ${overdue ? 'hover:!bg-red-50 hover:!text-red-700 hover:!border-red-200' : ''}`}>
                      <LogOut className="h-3 w-3"/> Check Out
                    </button>
                  </motion.div>);
        }))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-brand-600"/>
            Expected Today ({expected.length})
          </h2>
          <div className="space-y-3">
            {expected.length === 0 ? (<div className="card text-center py-8 text-slate-400">No expected visitors</div>) : (expected.map((v) => (<div key={v.id} className="card !p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{v.visitor_name}</p>
                    <p className="text-xs text-slate-500">{v.reference_code} · {v.host_name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(v.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {v.room_name ? ` · ${v.room_name}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={v.status}/>
                </div>)))}
          </div>
        </div>
      </div>
    </DashboardLayout>);
}
