import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
export default function ReceptionActivityLogView() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reception/activity-logs?limit=50');
            setLogs(Array.isArray(res.data) ? res.data : []);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchLogs();
    }, []);
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-purple-400"/>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Reception Front-Desk Activity Audit Log</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Immutable audit record of all front-desk actions, arrival confirmations, walk-in registrations, and queue modifications.
            </p>
          </div>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
          <RefreshCw className="h-4 w-4"/>
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Log Feed */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Activity History Feed</h2>

        {loading ? (<div className="p-12 text-center text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-500 mb-2"/>
            <p className="text-xs font-bold uppercase tracking-wider">Syncing Audit Logs...</p>
          </div>) : logs.length === 0 ? (<div className="p-12 text-center text-slate-500">
            <Activity className="h-10 w-10 mx-auto text-slate-600 mb-2"/>
            <p className="text-sm font-bold text-slate-400">No Reception Activity Logs Recorded</p>
          </div>) : (<div className="space-y-3">
            {logs.map((log) => (<div key={log.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-4 text-xs">
                <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl shrink-0">
                  <Activity className="h-4 w-4"/>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white uppercase">{log.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400">{log.details}</p>
                  <div className="flex gap-4 text-[10px] text-slate-500 pt-1">
                    <span>Performed by: <strong className="text-slate-300">{log.receptionist_name || 'Front Desk'}</strong></span>
                    {log.visitor_name && <span>Visitor: <strong className="text-slate-300">{log.visitor_name}</strong></span>}
                  </div>
                </div>
              </div>))}
          </div>)}
      </div>
    </div>);
}
