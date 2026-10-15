import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { reportsApi, getErrorMessage } from '../../services/api';
export default function CustomReportBuilder() {
    const [reportName, setReportName] = useState('');
    const [category, setCategory] = useState('Operational');
    const [description, setDescription] = useState('');
    const [selectedMetrics, setSelectedMetrics] = useState(['visitorName', 'checkedInAt', 'hostName']);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const toggleMetric = (m) => {
        setSelectedMetrics(arr => arr.includes(m) ? arr.filter(x => x !== m) : [...arr, m]);
    };
    const handleSave = async (e) => {
        e.preventDefault();
        if (!reportName.trim())
            return;
        setLoading(true);
        setError('');
        setSaved(false);
        try {
            await reportsApi.custom({
                name: reportName,
                category,
                description,
                queryConfig: { metrics: selectedMetrics, dateFrom, dateTo },
            });
            setSaved(true);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };
    const availableMetrics = [
        { id: 'visitorName', label: 'Visitor Full Name' },
        { id: 'visitorCompany', label: 'Company / Organization' },
        { id: 'visitorEmail', label: 'Email Address' },
        { id: 'hostName', label: 'Host Employee' },
        { id: 'department', label: 'Department' },
        { id: 'checkedInAt', label: 'Check-In Timestamp' },
        { id: 'checkedOutAt', label: 'Check-Out Timestamp' },
        { id: 'durationMinutes', label: 'Total Duration (Minutes)' },
        { id: 'badgeNumber', label: 'Badge / Pass Number' },
        { id: 'purpose', label: 'Visit Purpose' },
    ];
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sliders className="h-6 w-6 text-indigo-500"/> Interactive Custom Report Builder
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure custom data dimensions, fields, metrics, and save report templates
          </p>
        </div>

        {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0"/> {error}
          </div>)}

        {saved ? (<div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto"/>
            <p className="text-xl font-black text-slate-800 dark:text-white">Custom Report Template Saved</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">"{reportName}" is ready in your saved reports library.</p>
            <button onClick={() => setSaved(false)} className="mt-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition">
              Build Another Report
            </button>
          </div>) : (<form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Report Name *</label>
                <input type="text" value={reportName} onChange={e => setReportName(e.target.value)} required placeholder="e.g. Weekly VIP Host Load Report" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Operational">Operational</option>
                  <option value="Executive">Executive</option>
                  <option value="Security">Security & Compliance</option>
                  <option value="Departmental">Departmental SLA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Report Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief summary of report purpose and target audience..." className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
            </div>

            {/* Field selector */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Select Report Output Columns ({selectedMetrics.length} selected)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableMetrics.map(m => {
                const sel = selectedMetrics.includes(m.id);
                return (<button type="button" key={m.id} onClick={() => toggleMetric(m.id)} className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${sel ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {sel ? '✓ ' : '+ '}{m.label}
                    </button>);
            })}
              </div>
            </div>

            <button type="submit" disabled={loading || !reportName.trim()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Save Report Definition
            </button>
          </form>)}
      </div>
    </div>);
}
