import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Building2, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { securityApi, getErrorMessage } from '../../services/api';
export default function AccessControlRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await securityApi.accessRules();
            setRules(res.data.data || res.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const LevelBadge = ({ level }) => {
        const map = {
            PUBLIC: 'bg-emerald-950 text-emerald-400 border-emerald-800',
            RESTRICTED: 'bg-amber-950 text-amber-400 border-amber-800',
            HIGH_SECURITY: 'bg-red-950 text-red-400 border-red-800',
        };
        return (<span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${map[level] || map.RESTRICTED}`}>
        {level}
      </span>);
    };
    return (<div className="min-h-screen bg-slate-950 text-white p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Lock className="h-6 w-6 text-indigo-500"/> Building & Zone Access Control Rules
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage floor clearance, restricted zones, and door security policies
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Rules
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {loading ? (<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400"/></div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rules.map(rule => (<div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/50 text-indigo-400">
                  <Building2 className="h-5 w-5"/>
                </div>
                <LevelBadge level={rule.accessLevel}/>
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{rule.ruleName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{rule.zoneName}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Status: <strong className="text-emerald-400">Active ✓</strong></span>
                <span>Rule #{rule.id}</span>
              </div>
            </div>))}
        </div>)}
    </div>);
}
