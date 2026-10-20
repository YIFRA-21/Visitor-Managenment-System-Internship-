import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Bell, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkoutApi, getErrorMessage } from '../../services/api';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function OverstayManagement() {
    const { toConfirmation, toResponse } = useResponseNavigation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notified, setNotified] = useState({});
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await checkoutApi.overstay();
            setItems(res.data.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const handleAlertHost = (item) => {
        setNotified(prev => ({ ...prev, [item.checkinId]: true }));
        toResponse(RESPONSE_TYPES.INFO, {
            title: 'Host Overstay Alert Dispatched',
            message: `Emergency overstay notice sent to Host ${item.hostName} (${item.hostEmail}) for visitor ${item.visitorName}.`,
            entityType: 'Overstay Notice',
            entityName: item.visitorName,
            returnUrl: window.location.pathname + window.location.search,
        });
    };
    const handleForceCheckout = (item) => {
        toConfirmation({
            title: `Force Check-Out: ${item.visitorName}`,
            message: `Force immediate exit processing and revoke credentials for visitor "${item.visitorName}" due to exceeding authorized stay?`,
            entityType: 'Overstaying Visitor',
            entityName: item.visitorName,
            consequences: [
                'Digital visitor pass and RFID credentials will be terminated immediately.',
                'Security checkpoints will flag this individual if they attempt door access.',
                'An overstay violation entry will be logged into the permanent visitor registry.'
            ],
            confirmLabel: 'Force Check-Out & Revoke Badge',
            confirmVariant: 'danger',
            apiEndpoint: '/checkout/process',
            apiMethod: 'POST',
            apiPayload: {
                code: item.referenceCode || item.badgeNumber || String(item.checkinId),
                remarks: 'Forced overstay checkout'
            },
            returnUrl: window.location.pathname + window.location.search,
            successConfig: {
                type: RESPONSE_TYPES.CHECKOUT_RESULT,
                title: 'Forced Check-Out Processed',
                message: `Visitor "${item.visitorName}" has been checked out and access credentials revoked.`,
            }
        });
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-500"/> Overstay Management & Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor visitors who have exceeded their scheduled visit duration
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Overstays
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {loading ? (<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-400"/></div>) : items.length === 0 ? (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto"/>
          <p className="text-xl font-bold text-slate-800 dark:text-white">No Overstay Violations Detected</p>
          <p className="text-sm text-slate-400">All current visitors are within their scheduled appointment windows.</p>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (<div key={item.checkinId} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-200 dark:border-amber-900/40 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Overstay: +{item.overstayMinutes} mins
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mt-1">{item.visitorName}</h3>
                  <p className="text-xs text-slate-500">{item.visitorCompany || 'Independent Visitor'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-slate-400">{item.badgeNumber || item.referenceCode}</p>
                  <p className="text-xs font-bold text-amber-600">{item.minutesInside}m total inside</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs">
                <div><span className="text-slate-400">Host:</span> <strong className="text-slate-700 dark:text-slate-300">{item.hostName}</strong></div>
                <div><span className="text-slate-400">Department:</span> <strong className="text-slate-700 dark:text-slate-300">{item.department}</strong></div>
                <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-700 dark:text-slate-300">{item.visitorPhone || '—'}</strong></div>
                <div><span className="text-slate-400">Email:</span> <strong className="text-slate-700 dark:text-slate-300 truncate block">{item.visitorEmail || '—'}</strong></div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => handleAlertHost(item)} disabled={notified[item.checkinId]} className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5 ${notified[item.checkinId] ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                  <Bell className="h-3.5 w-3.5"/>
                  {notified[item.checkinId] ? 'Host Notified ✓' : 'Notify Host'}
                </button>
                <button onClick={() => handleForceCheckout(item)} className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition">
                  Force Exit
                </button>
              </div>
            </div>))}
        </div>)}
    </div>);
}
