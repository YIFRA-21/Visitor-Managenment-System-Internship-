import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ShieldCheck, Plus, RefreshCw, Search, Download, Eye, Edit2, Archive, Loader2, AlertCircle, Play } from 'lucide-react';
import { blacklistWatchlistApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BlacklistWatchlistVerification() {
    const { t } = useLanguage();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [listTypeFilter, setListTypeFilter] = useState('ALL');
    const [riskFilter, setRiskFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showArchived, setShowArchived] = useState(false);
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showClearanceModal, setShowClearanceModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    // Form states
    const [addForm, setAddForm] = useState({
        visitorName: '', email: '', phone: '', idNumber: '', idType: 'National ID',
        listType: 'WATCHLIST', riskLevel: 'MEDIUM', reason: '', description: '',
        effectiveDate: new Date().toISOString().split('T')[0], expiryDate: '', internalNotes: ''
    });
    const [editForm, setEditForm] = useState({
        reason: '', description: '', riskLevel: 'MEDIUM', status: 'ACTIVE', expiryDate: '', internalNotes: ''
    });
    const [clearanceForm, setClearanceForm] = useState({ decision: 'APPROVE_CLEARANCE', notes: '' });
    const [verifyForm, setVerifyForm] = useState({ idNumber: '', email: '', phone: '', referenceNumber: '' });
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const loadDirectory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await blacklistWatchlistApi.getDirectory({
                search, listType: listTypeFilter, riskLevel: riskFilter,
                status: statusFilter, isArchived: showArchived ? 'true' : 'false'
            });
            setRecords(res.data.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, [search, listTypeFilter, riskFilter, statusFilter, showArchived]);
    useEffect(() => { loadDirectory(); }, [loadDirectory]);
    // Handlers
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.reason.trim())
            return;
        try {
            await blacklistWatchlistApi.createRecord(addForm);
            setShowAddModal(false);
            loadDirectory();
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
    };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRecord)
            return;
        try {
            await blacklistWatchlistApi.updateRecord(selectedRecord.id, editForm);
            setShowEditModal(false);
            loadDirectory();
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
    };
    const handleClearanceSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRecord)
            return;
        try {
            await blacklistWatchlistApi.reviewClearance(selectedRecord.id, clearanceForm.decision, clearanceForm.notes);
            setShowClearanceModal(false);
            loadDirectory();
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
    };
    const handleArchiveToggle = async (rec) => {
        try {
            if (rec.status === 'ARCHIVED') {
                await blacklistWatchlistApi.restoreRecord(rec.id);
            }
            else {
                await blacklistWatchlistApi.archiveRecord(rec.id);
            }
            loadDirectory();
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
    };
    const runVerification = async () => {
        setVerifying(true);
        setVerifyResult(null);
        try {
            const res = await blacklistWatchlistApi.verifyVisitor(verifyForm);
            setVerifyResult(res.data.data);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setVerifying(false);
        }
    };
    const exportCSV = () => {
        if (!records.length)
            return;
        const header = ['Visitor Code', 'Visitor Name', 'ID Number', 'List Type', 'Risk Level', 'Reason', 'Status', 'Effective Date'];
        const rows = records.map(r => [
            r.visitorCode || 'N/A', r.visitorName || 'N/A', r.idNumber || 'N/A',
            r.listType, r.riskLevel, JSON.stringify(r.reason), r.status, r.effectiveDate || 'N/A'
        ]);
        const csv = [header, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blacklist-watchlist-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500"/> {t('security.blacklistTitle', 'Blacklist & Watchlist Verification')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('security.blacklistSub', 'Automated identity screening & threat risk assessment engine')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowVerifyModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow transition">
            <Play className="h-4 w-4 text-emerald-400"/> {t('security.sandbox', 'Verification Sandbox')}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition">
            <Plus className="h-4 w-4"/> {t('security.addRecord', 'Add Security Record')}
          </button>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Global Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('security.searchPlaceholder', 'Search Name, ID Number, Phone...')} className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"/>
          </div>

          <select value={listTypeFilter} onChange={e => setListTypeFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl">
            <option value="ALL">All List Types</option>
            <option value="BLACKLIST">Blacklist Only</option>
            <option value="WATCHLIST">Watchlist Only</option>
          </select>

          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl">
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <button onClick={() => setShowArchived(!showArchived)} className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${showArchived ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-600' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Download className="h-4 w-4"/>
          </button>
          <button onClick={loadDirectory} disabled={loading} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Security Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (<div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-red-500 mx-auto"/></div>) : records.length === 0 ? (<div className="p-12 text-center text-slate-400 text-sm">No security records match criteria</div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="px-4 py-3">{t('table.visitor', 'Visitor')}</th>
                  <th className="px-4 py-3">{t('table.identityNumber', 'Identity Number')}</th>
                  <th className="px-4 py-3">{t('table.listType', 'List Type')}</th>
                  <th className="px-4 py-3">{t('table.riskLevel', 'Risk Level')}</th>
                  <th className="px-4 py-3">{t('table.reason', 'Reason')}</th>
                  <th className="px-4 py-3">{t('table.status', 'Status')}</th>
                  <th className="px-4 py-3">{t('table.createdDate', 'Added Date')}</th>
                  <th className="px-4 py-3 text-right">{t('table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {records.map(rec => (<tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {rec.visitorName?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{rec.visitorName || 'Unregistered Profile'}</p>
                          <p className="text-[10px] text-slate-400">{rec.visitorCode || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{rec.idNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${rec.listType === 'BLACKLIST' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                        {rec.listType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${rec.riskLevel === 'CRITICAL' ? 'bg-red-600 text-white' : rec.riskLevel === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        {rec.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">{rec.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => { setSelectedRecord(rec); setShowDetailsModal(true); }} className="p-1 text-slate-400 hover:text-indigo-600"><Eye className="h-4 w-4"/></button>
                      <button onClick={() => { setSelectedRecord(rec); setEditForm({ reason: rec.reason, description: rec.description || '', riskLevel: rec.riskLevel, status: rec.status, expiryDate: rec.expiryDate || '', internalNotes: rec.internalNotes || '' }); setShowEditModal(true); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4"/></button>
                      <button onClick={() => { setSelectedRecord(rec); setShowClearanceModal(true); }} className="p-1 text-slate-400 hover:text-emerald-600"><ShieldCheck className="h-4 w-4"/></button>
                      <button onClick={() => handleArchiveToggle(rec)} className="p-1 text-slate-400 hover:text-amber-600"><Archive className="h-4 w-4"/></button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500"/> Add Security Blacklist / Watchlist Record
            </h2>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('form.listType', 'List Type')} *</label>
                  <select value={addForm.listType} onChange={e => setAddForm(f => ({ ...f, listType: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs">
                    <option value="WATCHLIST">{t('form.watchlist', 'Watchlist (Screening Required)')}</option>
                    <option value="BLACKLIST">{t('form.blacklist', 'Blacklist (Immediate Block)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('form.riskLevel', 'Risk Level')} *</label>
                  <select value={addForm.riskLevel} onChange={e => setAddForm(f => ({ ...f, riskLevel: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs">
                    <option value="LOW">{t('risk.low', 'Low Risk')}</option>
                    <option value="MEDIUM">{t('risk.medium', 'Medium Risk')}</option>
                    <option value="HIGH">{t('risk.high', 'High Risk')}</option>
                    <option value="CRITICAL">{t('risk.critical', 'Critical Risk')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('form.visitorName', 'Visitor Full Name')}</label>
                  <input type="text" value={addForm.visitorName} onChange={e => setAddForm(f => ({ ...f, visitorName: e.target.value }))} placeholder={t('placeholder.fullName', 'e.g. John Doe')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('form.idNumber', 'Identity Number')}</label>
                  <input type="text" value={addForm.idNumber} onChange={e => setAddForm(f => ({ ...f, idNumber: e.target.value }))} placeholder={t('placeholder.idNumber', 'Passport or NID...')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs"/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('form.reason', 'Reason')} *</label>
                <input type="text" value={addForm.reason} onChange={e => setAddForm(f => ({ ...f, reason: e.target.value }))} required placeholder={t('placeholder.reason', 'Security incident, trespass warning, etc.')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl text-xs"/>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold rounded-xl text-xs">{t('btn.cancel', 'Cancel')}</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow">{t('btn.create', 'Add Record')}</button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Verification Sandbox Modal */}
      {showVerifyModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-500"/> Identity Screening Sandbox
            </h2>
            <div className="space-y-3 text-xs">
              <input type="text" value={verifyForm.idNumber} onChange={e => setVerifyForm(f => ({ ...f, idNumber: e.target.value }))} placeholder={t('placeholder.idNumber', 'Identity / Passport Number')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl"/>
              <input type="text" value={verifyForm.email} onChange={e => setVerifyForm(f => ({ ...f, email: e.target.value }))} placeholder={t('placeholder.email', 'Email Address')} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl"/>
              <button onClick={runVerification} disabled={verifying} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4"/>} {t('btn.verify', 'Run Screening Engine')}
              </button>

              {verifyResult && (<div className={`p-4 rounded-xl border space-y-1 ${verifyResult.verificationResult === 'CLEARED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p className="font-black text-sm uppercase">Status: {verifyResult.verificationResult}</p>
                  <p>Risk Score: {verifyResult.riskScore}/100 ({verifyResult.riskLevel})</p>
                  <p>Matching Hits: {verifyResult.hitsCount}</p>
                </div>)}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button onClick={() => setShowVerifyModal(false)} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold rounded-xl text-xs">{t('btn.close', 'Close')}</button>
            </div>
          </div>
        </div>)}
    </div>);
}
