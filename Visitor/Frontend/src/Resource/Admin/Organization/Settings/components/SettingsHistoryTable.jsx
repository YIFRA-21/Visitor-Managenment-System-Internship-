import React, { useState, useEffect } from 'react';
import { History, Eye } from 'lucide-react';
import api from '../../../../../services/api';
export default function SettingsHistoryTable({ onNotify }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings/history');
            setHistory(res.data || []);
        }
        catch {
            onNotify('Failed to retrieve history logs.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchHistory();
    }, []);
    return (<div className="row g-4 text-xs font-semibold">
      {/* Table grid */}
      <div className="col-12 col-lg-8">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <History className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Audit Logs & Configuration History
            </h3>
          </div>

          {loading ? (<div className="p-16 text-center">
              <div className="spinner-border text-primary" role="status"/>
              <p className="text-slate-400 text-xs fw-semibold mt-3">Fetching logs...</p>
            </div>) : history.length === 0 ? (<div className="p-16 text-center text-slate-400">
              No configuration changes recorded in settings history logs.
            </div>) : (<div className="table-responsive">
              <table className="table align-middle text-xs mb-0">
                <thead>
                  <tr className="text-slate-500 uppercase font-bold text-[9px] border-bottom dark:border-slate-800">
                    <th>Configuration Parameter</th>
                    <th>Changed By</th>
                    <th>Change Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-350">
                  {history.map((log) => (<tr key={log.id}>
                      <td className="font-extrabold text-slate-950 dark:text-white py-3">{log.setting}</td>
                      <td>{log.changedBy}</td>
                      <td>{new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="text-end">
                        <button onClick={() => setSelectedLog(log)} className="btn btn-sm btn-outline-secondary p-1 rounded">
                          <Eye className="h-4 w-4"/>
                        </button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </div>
      </div>

      {/* Log Inspector */}
      <div className="col-12 col-lg-4">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
            Log Inspector
          </h3>

          {selectedLog ? (<div className="space-y-4">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase d-block">Modified Field</span>
                <p className="font-extrabold text-slate-950 dark:text-white text-sm mb-0">{selectedLog.setting}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2">
                <div>
                  <span className="text-slate-400 text-[9px] font-bold uppercase d-block">Previous Value</span>
                  <span className="font-mono text-slate-950 dark:text-white">{selectedLog.prevValue}</span>
                </div>
                <div className="border-top pt-2 dark:border-slate-800">
                  <span className="text-slate-400 text-[9px] font-bold uppercase d-block">New Value</span>
                  <span className="font-mono text-emerald-600 font-bold">{selectedLog.newValue}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase d-block">Reason for Change</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 leading-normal">{selectedLog.reason}</p>
              </div>
            </div>) : (<div className="p-16 text-center text-slate-400 font-semibold">
              Select a history entry to view deep snapshot values.
            </div>)}
        </div>
      </div>
    </div>);
}
