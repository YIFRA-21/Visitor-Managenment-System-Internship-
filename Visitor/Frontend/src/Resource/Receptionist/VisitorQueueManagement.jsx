import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, Megaphone, RefreshCw, Trash2, Check } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorQueueManagement() {
    const { t, tStatus } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState([]);
    const [message, setMessage] = useState('');
    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reception/queue');
            setQueue(Array.isArray(res.data) ? res.data : []);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchQueue();
        const timer = setInterval(fetchQueue, 8000);
        return () => clearInterval(timer);
    }, []);
    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/reception/queue/${id}`, { status });
            setMessage(`Queue #${id} status updated to ${status}.`);
            fetchQueue();
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleUpdatePriority = async (id, priority) => {
        try {
            await api.put(`/reception/queue/${id}`, { priority });
            setMessage(`Queue #${id} priority set to ${priority}.`);
            fetchQueue();
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleDeleteQueue = async (id, visitorName) => {
        if (!window.confirm(`Are you sure you want to remove "${visitorName || 'this visitor'}" from the queue?`)) return;
        try {
            await api.delete(`/reception/queue/${id}`);
            setMessage(`Visitor removed from queue.`);
            fetchQueue();
        }
        catch (err) {
            console.error(err);
            setMessage(err.response?.data?.error || err.message || 'Failed to remove from queue');
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-purple-400"/>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Visitor Queue Management</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time reception lobby queue monitor. Call next visitor, reorder priorities, and update lounge meeting pipeline.
            </p>
          </div>
        </div>
        <button onClick={fetchQueue} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
          <RefreshCw className="h-4 w-4"/>
          <span>Sync Queue</span>
        </button>
      </div>

      {/* Alert */}
      {message && (<div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold flex justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="opacity-60 hover:opacity-100">✕</button>
        </div>)}

      {/* Queue Data Table */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Active Lobby Queue ({queue.length} Visitors)
          </h2>
        </div>

        {loading ? (<div className="p-12 text-center text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-500 mb-2"/>
            <p className="text-xs font-bold uppercase tracking-wider">Updating Live Queue Data...</p>
          </div>) : queue.length === 0 ? (<div className="p-12 text-center text-slate-500 space-y-2">
            <UserCheck className="h-10 w-10 mx-auto text-slate-600"/>
            <p className="text-sm font-bold text-slate-400">Lobby Queue is Currently Empty</p>
            <p className="text-xs text-slate-600">No visitors waiting at reception.</p>
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">{t('table.queueNumber', 'Queue #')}</th>
                  <th className="p-4">{t('table.visitor', 'Visitor')}</th>
                  <th className="p-4">{t('table.host', 'Host Employee')}</th>
                  <th className="p-4">{t('table.arrivalTime', 'Arrival Time')}</th>
                  <th className="p-4">{t('table.priority', 'Priority')}</th>
                  <th className="p-4">{t('table.status', 'Status')}</th>
                  <th className="p-4 text-right">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {queue.map((q) => {
                const minutesWaiting = Math.max(0, Math.floor((Date.now() - new Date(q.arrival_time).getTime()) / 60000));
                return (<tr key={q.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-4 font-mono font-black text-white text-sm">
                        <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg">
                          {q.queue_number}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white">{q.visitor_name}</div>
                        <div className="text-[11px] text-slate-400">{q.visitor_company || 'Independent'}</div>
                      </td>

                      <td className="p-4 font-semibold text-slate-200">
                        {q.host_name || 'Front Desk Host'}
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {new Date(q.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[10px] text-purple-400 font-bold mt-0.5">
                          Waiting ~{minutesWaiting}m
                        </span>
                      </td>

                      <td className="p-4">
                        <select value={q.priority} onChange={(e) => handleUpdatePriority(q.id, e.target.value)} className={`bg-slate-900 border rounded-lg px-2 py-1 text-[11px] font-bold uppercase ${q.priority === 'VIP' ? 'text-amber-400 border-amber-500/40' :
                        q.priority === 'HIGH' ? 'text-red-400 border-red-500/40' :
                            'text-slate-300 border-slate-700'}`}>
                          <option value="VIP">VIP</option>
                          <option value="HIGH">HIGH</option>
                          <option value="NORMAL">NORMAL</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${q.status === 'CALLED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        q.status === 'MEETING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            q.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                          {q.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === 'WAITING' && (<button onClick={() => handleUpdateStatus(q.id, 'CALLED')} className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition" title="Call Next Visitor">
                              <Megaphone className="h-3.5 w-3.5 inline mr-1"/>
                              Call Next
                            </button>)}
                          {q.status === 'CALLED' && (<button onClick={() => handleUpdateStatus(q.id, 'MEETING')} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition" title="Start Meeting">
                              <UserCheck className="h-3.5 w-3.5 inline mr-1"/>
                              Start Meeting
                            </button>)}
                          {q.status !== 'COMPLETED' && (<button onClick={() => handleUpdateStatus(q.id, 'COMPLETED')} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition" title="Mark Completed">
                              <Check className="h-3.5 w-3.5 text-emerald-400 inline mr-1"/>
                              Done
                            </button>)}
                          <button onClick={() => handleDeleteQueue(q.id, q.visitor_name)} className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm" title="Delete from Queue">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
