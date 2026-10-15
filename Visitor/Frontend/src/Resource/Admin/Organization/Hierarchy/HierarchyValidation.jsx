import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, XCircle, Info, Layers } from 'lucide-react';
import api from '../../../../services/api';
export default function HierarchyValidation() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const fetchValidation = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hierarchy/validate');
            setReport(res.data);
        }
        catch (err) {
            console.error(err);
            setReport(null);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchValidation(); }, []);
    const getSeverityBadge = (sev) => {
        switch (sev) {
            case 'CRITICAL': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200';
            case 'LOW': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };
    let filteredResults = report?.results || [];
    if (filterSeverity !== 'ALL') {
        filteredResults = filteredResults.filter(r => r.severity === filterSeverity);
    }
    if (filterStatus === 'PASSED') {
        filteredResults = filteredResults.filter(r => r.passed);
    }
    else if (filterStatus === 'FAILED') {
        filteredResults = filteredResults.filter(r => !r.passed);
    }
    return (<div className="space-y-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <ShieldCheck className="text-emerald-500 h-6 w-6"/> Hierarchy Structural Validation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Audit hierarchy integrity: orphan detection, circular reference guards, and duplicate code validation.
          </p>
        </div>
        <button onClick={fetchValidation} disabled={loading} className="btn btn-primary text-xs font-bold d-flex align-items-center gap-1.5 px-3 py-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Re-Run Validation
        </button>
      </div>

      {/* Summary Cards */}
      {report?.summary && (<div className="row g-3">
          <div className="col-6 col-md-3">
            <div className={`rounded-xl border p-4 text-center shadow-sm ${report.summary.status === 'HEALTHY'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200'}`}>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Overall Status</p>
              <p className={`text-lg font-extrabold ${report.summary.status === 'HEALTHY' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {report.summary.status === 'HEALTHY' ? <CheckCircle2 className="h-5 w-5 inline me-1"/> : <AlertTriangle className="h-5 w-5 inline me-1"/>}
                {report.summary.status}
              </p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Checks</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{report.summary.totalChecks}</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-emerald-500 mb-1">Passed</p>
              <p className="text-lg font-extrabold text-emerald-600">{report.summary.passedCount}</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-rose-500 mb-1">Failed</p>
              <p className="text-lg font-extrabold text-rose-600">{report.summary.failedCount}</p>
            </div>
          </div>
        </div>)}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm d-flex flex-wrap align-items-center gap-3">
        <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">Filter:</span>
        <select className="form-select form-select-sm text-xs font-semibold w-auto" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="form-select form-select-sm text-xs font-semibold w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Results</option>
          <option value="PASSED">Passed Only</option>
          <option value="FAILED">Failed Only</option>
        </select>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {loading ? (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Running structural validation checks...</p>
          </div>) : filteredResults.length === 0 ? (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2"/>
            <p className="text-slate-400 text-xs font-semibold">No validation results match the current filter.</p>
          </div>) : (filteredResults.map((result) => (<div key={result.id} className={`bg-white dark:bg-[#1e293b] border rounded-xl p-4 shadow-sm d-flex align-items-start gap-3 ${result.passed
                ? 'border-emerald-200 dark:border-emerald-900/40'
                : 'border-rose-200 dark:border-rose-900/40'}`}>
              <div className="shrink-0 mt-0.5">
                {result.passed
                ? <CheckCircle2 className="h-5 w-5 text-emerald-500"/>
                : <XCircle className="h-5 w-5 text-rose-500"/>}
              </div>
              <div className="flex-grow-1 space-y-1">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{result.nodeName}</span>
                  <span className={`badge border text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getSeverityBadge(result.severity)}`}>
                    {result.severity}
                  </span>
                  <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                    {result.rule}
                  </span>
                </div>
                {result.issue && (<p className="text-xs text-rose-600 dark:text-rose-400 font-semibold m-0">{result.issue}</p>)}
                {result.suggestion && (<p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0 d-flex align-items-start gap-1">
                    <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5"/> {result.suggestion}
                  </p>)}
              </div>
            </div>)))}
      </div>
    </div>);
}
