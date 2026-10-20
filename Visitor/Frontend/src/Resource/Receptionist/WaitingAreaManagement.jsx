import React, { useState, useEffect } from 'react';
import { Armchair, Clock, User, Bell, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function WaitingAreaManagement() {
    const { toConfirmation } = useResponseNavigation();
    const [loading, setLoading] = useState(true);
    const [waitingList, setWaitingList] = useState([]);
    const [message, setMessage] = useState('');
    const fetchWaiting = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reception/waiting-area');
            setWaitingList(Array.isArray(res.data) ? res.data : []);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchWaiting();
        const interval = setInterval(fetchWaiting, 10000);
        return () => clearInterval(interval);
    }, []);
    const handleNotifyHostAgain = async (hostId, visitorName) => {
        try {
            await api.post('/reception/notifications/send', {
                host_id: hostId,
                notification_type: 'VISITOR_WAITING',
                message_custom: `Reminder: Your visitor ${visitorName} is currently waiting in the reception lounge.`,
            });
            setMessage(`Host reminder re-sent for visitor ${visitorName}.`);
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleRemove = (queueId) => {
        toConfirmation({
            title: 'Remove from Waiting Lounge',
            message: 'Remove visitor from the reception waiting lounge and release their seat allocation?',
            entityType: 'Waiting Area Queue',
            entityName: `Queue #${queueId}`,
            consequences: [
                'The visitor status will be marked as departed or cancelled.',
                'The reception dashboard waiting counter will be decremented.'
            ],
            confirmLabel: 'Remove Visitor',
            confirmVariant: 'warning',
            apiEndpoint: `/reception/queue/${queueId}`,
            apiMethod: 'PUT',
            apiPayload: { status: 'CANCELLED' },
            returnUrl: window.location.pathname + window.location.search,
            successConfig: {
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Visitor Removed',
                message: 'Visitor was removed from the reception waiting area.',
            }
        });
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center space-x-2">
              <Armchair className="h-6 w-6 text-indigo-400"/>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Reception Waiting Area Management</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monitor visitors currently seated in the reception lobby lounge. Track elapsed waiting duration and issue host reminders.
            </p>
          </div>
        </div>
        <button onClick={fetchWaiting} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
          <RefreshCw className="h-4 w-4"/>
          <span>Refresh Lounge</span>
        </button>
      </div>

      {/* Alert Banner */}
      {message && (<div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold flex justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="opacity-60 hover:opacity-100">✕</button>
        </div>)}

      {/* Waiting Visitors Grid */}
      {loading ? (<div className="p-12 text-center text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2"/>
          <p className="text-xs font-bold uppercase tracking-wider">Syncing Lounge Visitors...</p>
        </div>) : waitingList.length === 0 ? (<div className="p-12 bg-[#0a0f19] border border-slate-800 rounded-2xl text-center text-slate-500 space-y-2">
          <Armchair className="h-10 w-10 mx-auto text-slate-600"/>
          <p className="text-sm font-bold text-slate-400">Reception Lounge is Clear</p>
          <p className="text-xs text-slate-600">No visitors currently waiting in the lounge.</p>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {waitingList.map((item, idx) => {
                const isLongWait = (item.waiting_minutes || 0) > 15;
                return (<div key={item.id} className={`bg-[#0a0f19] border rounded-2xl p-5 shadow-xl space-y-4 relative flex flex-col justify-between ${isLongWait ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'}`}>
                <div>
                  {/* Position & Time */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold">
                      Queue #{item.queue_number} (Pos {idx + 1})
                    </span>
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 ${isLongWait ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                      <Clock className="h-3.5 w-3.5"/>
                      {item.waiting_minutes || 0} mins waiting
                    </span>
                  </div>

                  {/* Visitor details */}
                  <div className="pt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-400"/>
                      <span className="font-bold text-white text-sm">{item.visitor_name}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-6">{item.visitor_company || 'Independent Visitor'}</p>

                    <div className="pt-2 border-t border-slate-850 space-y-1">
                      <p className="text-slate-400"><span className="text-slate-500">Host:</span> <strong className="text-slate-200">{item.host_name}</strong></p>
                      <p className="text-slate-400"><span className="text-slate-500">Scheduled:</span> {item.scheduled_start ? new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Walk-in'}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex gap-2">
                  <button onClick={() => handleNotifyHostAgain(item.host_id, item.visitor_name)} className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Bell className="h-3.5 w-3.5"/>
                    <span>Re-Notify Host</span>
                  </button>
                  <button onClick={() => handleRemove(item.id)} className="px-3 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-xl text-xs font-bold" title="Remove from queue">
                    Remove
                  </button>
                </div>
              </div>);
            })}
        </div>)}
    </div>);
}
