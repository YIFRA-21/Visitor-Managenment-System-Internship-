import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import api from '../../../../../services/api';
export default function ValidationReport({ onNotify }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings/validation');
            setReport(res.data);
        }
        catch {
            onNotify('Failed to execute configuration validator.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReport();
    }, []);
    const summary = report?.summary || { totalChecks: 0, passed: 0, failed: 0, status: 'UNKNOWN' };
    const issues = report?.issues || [];
    return (<div className="space-y-4 text-xs font-semibold">
      {/* Status Bar */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className={`p-2 rounded-lg ${summary.status === 'PASSED' ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
            {summary.status === 'PASSED' ? <ShieldCheck className="h-5 w-5 text-emerald-500"/> : <ShieldAlert className="h-5 w-5 text-red-500"/>}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white mb-0.5">Settings Audit Status: {summary.status}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mb-0">Analyzed date, numbering codes, retention limits, and API connections.</p>
          </div>
        </div>
        <button onClick={fetchReport} disabled={loading} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 font-bold">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Re-Run Diagnostic
        </button>
      </div>

      <div className="row g-4">
        {/* Statistics Breakdown */}
        <div className="col-12 col-lg-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              Audit Statistics
            </h3>

            <div className="space-y-3">
              <div className="d-flex justify-content-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                <span>Total Checks Executed</span>
                <span className="font-extrabold text-slate-950 dark:text-white">{summary.totalChecks}</span>
              </div>
              <div className="d-flex justify-content-between p-2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-350">
                <span>Passed Constraints</span>
                <span className="font-extrabold">{summary.passed}</span>
              </div>
              <div className="d-flex justify-content-between p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-350">
                <span>Critical Exclusions / Errors</span>
                <span className="font-extrabold">{summary.failed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="col-12 col-lg-8">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              Auditor Recommendations Log
            </h3>

            {loading ? (<div className="p-16 text-center">
                <div className="spinner-border text-primary" role="status"/>
                <p className="text-slate-400 text-xs fw-semibold mt-3">Evaluating systems configuration profiles...</p>
              </div>) : issues.length === 0 ? (<div className="p-16 text-center text-slate-450 font-bold space-y-2">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto"/>
                <p className="text-slate-950 dark:text-white">Validation Passed Successfully!</p>
                <p className="text-[10px] text-slate-400 font-semibold">Zero settings errors detected.</p>
              </div>) : (<div className="space-y-3">
                {issues.map((iss, i) => (<div key={i} className="border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 rounded-xl p-3 space-y-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-danger text-white text-[8px] uppercase font-bold px-1.5 py-0.5 rounded">FAILED</span>
                      <span className="text-[10px] text-slate-400 font-bold">{iss.target}</span>
                    </div>
                    <p className="font-extrabold text-slate-950 dark:text-white mb-0">{iss.message}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0 leading-normal">
                      <strong>Correction Suggestion</strong>: {iss.suggestion}
                    </p>
                  </div>))}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
