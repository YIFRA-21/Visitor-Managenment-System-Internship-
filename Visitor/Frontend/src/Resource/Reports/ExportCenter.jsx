import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { reportsApi, getErrorMessage } from '../../services/api';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function ExportCenter() {
    const { toResponse, toError } = useResponseNavigation();
    const [downloading, setDownloading] = useState(false);
    const [reportType, setReportType] = useState('visitors');
    const [format, setFormat] = useState('csv');
    const handleDownload = async () => {
        setDownloading(true);
        try {
            let res;
            if (reportType === 'visitors')
                res = await reportsApi.visitors();
            else if (reportType === 'audit')
                res = await reportsApi.auditLogs();
            else
                res = await reportsApi.visitors();
            const dataset = Array.isArray(res.data) ? res.data : res.data.data || [];
            if (!dataset.length) {
                toResponse(RESPONSE_TYPES.INFO, {
                    title: 'No Data Available for Export',
                    message: `The selected report category (${reportType}) does not contain any exportable entries.`,
                    returnUrl: window.location.pathname,
                });
                setDownloading(false);
                return;
            }
            const header = Object.keys(dataset[0]);
            const rows = dataset.map((obj) => header.map(k => JSON.stringify(obj[k] ?? '')));
            const csv = [header, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        }
        catch (err) {
            toError(err, {
                title: 'Data Export Failed',
                returnUrl: window.location.pathname,
            });
        }
        finally {
            setDownloading(false);
        }
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Download className="h-6 w-6 text-indigo-500"/> Enterprise Export Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Download raw data extracts, executive summaries, and compliance audit files
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Select Report Dataset</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="visitors">Visitor Directory & Profile Log</option>
              <option value="checkins">Check-In & Exit Session Log</option>
              <option value="security">Security Incident & Watchlist Log</option>
              <option value="audit">System Audit Log & User Activities</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">File Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setFormat('csv')} className={`p-3 rounded-xl border text-sm font-bold text-center transition ${format === 'csv' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                CSV Data File (.csv)
              </button>
              <button type="button" onClick={() => setFormat('json')} className={`p-3 rounded-xl border text-sm font-bold text-center transition ${format === 'json' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                JSON Data Format (.json)
              </button>
            </div>
          </div>

          <button onClick={handleDownload} disabled={downloading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            <Download className="h-4 w-4"/> {downloading ? 'Preparing Download...' : `Download ${reportType.toUpperCase()} Export`}
          </button>
        </div>
      </div>
    </div>);
}
