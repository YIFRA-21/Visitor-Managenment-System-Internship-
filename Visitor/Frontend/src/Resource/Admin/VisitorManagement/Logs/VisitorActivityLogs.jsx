import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../../services/api';
export default function VisitorActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('ALL');
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/visitor-history', { params: { limit: 100 } });
            const raw = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            const mapped = [];
            raw.forEach((item) => {
                const vName = item.visitor_name || item.visitorName || 'Visitor';
                const vId = item.visitor_code || item.history_code || `VIS-${item.id}`;
                const gate = item.gate_number || item.location || item.terminal || 'Main Entrance Gate';
                const op = item.receptionist_name || item.host_employee_name || 'Front Desk System';
                const badge = item.badge_number || item.badge_barcode || 'N/A';
                if (item.checkin_time) {
                    mapped.push({
                        id: `ci-${item.id}`,
                        timestamp: new Date(item.checkin_time).toLocaleString(),
                        visitorName: vName,
                        visitorId: vId,
                        action: 'CHECK_IN',
                        gateLocation: gate,
                        operator: op,
                        badgeNumber: badge,
                        notes: item.notes || 'Visitor checked in successfully.',
                    });
                }
                if (item.checkout_time) {
                    mapped.push({
                        id: `co-${item.id}`,
                        timestamp: new Date(item.checkout_time).toLocaleString(),
                        visitorName: vName,
                        visitorId: vId,
                        action: 'CHECK_OUT',
                        gateLocation: gate,
                        operator: op,
                        badgeNumber: badge,
                        notes: item.checkout_remarks || 'Badge returned, departure recorded.',
                    });
                }
                if (item.badge_number) {
                    mapped.push({
                        id: `bg-${item.id}`,
                        timestamp: new Date(item.checkin_time || item.created_at || Date.now()).toLocaleString(),
                        visitorName: vName,
                        visitorId: vId,
                        action: 'BADGE_ISSUED',
                        gateLocation: gate,
                        operator: op,
                        badgeNumber: badge,
                        notes: `Badge ${badge} issued to visitor.`,
                    });
                }
            });
            // Sort logs descending by timestamp
            mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(mapped);
        }
        catch (err) {
            console.error('Failed to fetch activity logs:', err);
            setLogs([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);
    const filteredLogs = logs.filter((log) => filterAction === 'ALL' || log.action === filterAction);
    const getActionBadge = (action) => {
        switch (action) {
            case 'CHECK_IN':
                return <span className="badge bg-success text-white">CHECK-IN</span>;
            case 'CHECK_OUT':
                return <span className="badge bg-secondary text-white">CHECK-OUT</span>;
            case 'BADGE_ISSUED':
                return <span className="badge bg-info text-dark">BADGE ISSUED</span>;
            case 'ACCESS_DENIED':
                return <span className="badge bg-danger text-white">ACCESS DENIED</span>;
            case 'NDA_SIGNED':
                return <span className="badge bg-primary text-white">NDA SIGNED</span>;
            default:
                return <span className="badge bg-secondary">{action}</span>;
        }
    };
    return (<div className="vms-visitor-logs space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="bi bi-journal-check text-cyan-400"></i> Real-Time Visitor Movement & Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditable movement trail of all gate scans, check-ins, badge prints, and security turnstile events from the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={fetchLogs} disabled={loading} className="btn btn-outline-info text-xs flex items-center gap-2">
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh
          </button>
          <div>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value="ALL">All Log Events</option>
              <option value="CHECK_IN">Check-Ins</option>
              <option value="CHECK_OUT">Check-Outs</option>
              <option value="BADGE_ISSUED">Badge Issuances</option>
              <option value="ACCESS_DENIED">Access Denied Alerts</option>
              <option value="NDA_SIGNED">NDA Signatures</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Visitor</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Gate / Terminal</th>
                <th className="p-4">Badge #</th>
                <th className="p-4">Operator / System</th>
                <th className="p-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (<tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-cyan-500 border-t-transparent mb-2"></div>
                    <p>Loading real activity audit logs from database...</p>
                  </td>
                </tr>) : filteredLogs.length === 0 ? (<tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <i className="bi bi-inbox fs-2 block mb-2 opacity-50"></i>
                    No visitor activity logs found in the database.
                  </td>
                </tr>) : (filteredLogs.map((log) => (<tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-slate-400 text-[11px]">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">{log.visitorName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.visitorId}</div>
                    </td>
                    <td className="p-4">{getActionBadge(log.action)}</td>
                    <td className="p-4 text-slate-300">{log.gateLocation}</td>
                    <td className="p-4 font-mono text-indigo-400">{log.badgeNumber}</td>
                    <td className="p-4 text-slate-400">{log.operator}</td>
                    <td className="p-4 text-slate-300 italic">"{log.notes}"</td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
