import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../../../services/api';
export default function CalendarValidation({ onNotify }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const runAudit = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/validation', {
                params: { organizationId: 1 }
            });
            setReport(res.data);
            onNotify('Calendar integrity audit completed successfully.', 'success');
        }
        catch {
            onNotify('Integrity validation check failed to complete.', 'danger');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        runAudit();
    }, []);
    const summary = report?.summary || { totalChecks: 0, passed: 0, warnings: 0, failed: 0, status: 'UNKNOWN' };
    const issues = report?.issues || [];
    return (<div className="space-y-4">
      {/* Run Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className={`p-2.5 rounded-xl ${summary.status === 'PASSED' ? 'bg-success-subtle' :
            summary.status === 'WARNING' ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
            {summary.status === 'PASSED' ? <ShieldCheck className="text-emerald-500 h-6 w-6"/> :
            summary.status === 'WARNING' ? <AlertTriangle className="text-amber-500 h-6 w-6"/> :
                <ShieldAlert className="text-red-500 h-6 w-6"/>}
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase mb-0.5">
              Integrity Checker Status: {summary.status}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mb-0">
              Audit calculated at: {report?.auditTimestamp ? new Date(report.auditTimestamp).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        <button onClick={runAudit} disabled={loading} className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 font-bold">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>} Run Calendar Audit
        </button>
      </div>

      {/* Results grid */}
      <div className="row g-4">
        {/* KPI Counter */}
        <div className="col-12 col-lg-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              Audit Summaries
            </h3>

            <div className="space-y-3 font-semibold text-xs text-slate-600 dark:text-slate-350">
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-slate-50 dark:bg-slate-900">
                <span>Total Mapped Tests</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{summary.totalChecks}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-350">
                <span>Passed / Compliant</span>
                <span className="font-extrabold">{summary.passed}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-350">
                <span>Warnings Mapped</span>
                <span className="font-extrabold">{summary.warnings}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded bg-danger-50 dark:bg-danger-950 text-danger-700 dark:text-danger-350">
                <span>Critical Failures</span>
                <span className="font-extrabold">{summary.failed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="col-12 col-lg-8">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              Audit Logs & Findings
            </h3>

            {loading ? (<div className="p-16 text-center">
                <div className="spinner-border text-primary" role="status"/>
                <p className="text-slate-400 text-xs fw-semibold mt-3">Analyzing calendars...</p>
              </div>) : issues.length === 0 ? (<div className="p-16 text-center text-slate-400 font-semibold text-xs space-y-2">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500"/>
                <p className="font-extrabold text-slate-900 dark:text-white">Validation Passed Successfully!</p>
                <p className="text-xxs">No scheduling overlaps, duplicate items, or operational anomalies were found.</p>
              </div>) : (<div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                {issues.map((iss, i) => (<div key={i} className={`border rounded-xl p-3 text-xs space-y-1.5 ${iss.severity === 'FAILED' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge ${iss.severity === 'FAILED' ? 'bg-danger text-white' : 'bg-warning text-dark'} text-[8px] uppercase font-bold px-1.5 py-0.5 rounded`}>
                        {iss.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{iss.target}</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white mb-0.5">{iss.message}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                        <strong>Correction Tip</strong>: {iss.suggestion}
                      </p>
                    </div>
                  </div>))}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
