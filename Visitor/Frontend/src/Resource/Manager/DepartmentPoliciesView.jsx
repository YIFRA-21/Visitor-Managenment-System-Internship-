import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, Clock, Users, AlertTriangle, Save, RotateCcw, CheckCircle2, AlertCircle, Info, Lock, ShieldAlert, FileText } from 'lucide-react';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DepartmentPoliciesView() {
    const { t } = useLanguage();
    const [policies, setPolicies] = useState(null);
    const [originalPolicies, setOriginalPolicies] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const data = await managerApi.getPolicies();
            setPolicies(data);
            setOriginalPolicies(data);
        }
        catch (err) {
            console.error('Failed to load policies:', err);
            setStatusMessage({ type: 'error', text: 'Failed to load department policies.' });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPolicies();
    }, []);
    const handleChange = (field, value) => {
        if (!policies)
            return;
        setPolicies({ ...policies, [field]: value });
    };
    const handleSave = async (e) => {
        e.preventDefault();
        if (!policies)
            return;
        setSaving(true);
        setStatusMessage(null);
        try {
            const updated = (await managerApi.updatePolicies(policies));
            setPolicies(updated);
            setOriginalPolicies(updated);
            setStatusMessage({ type: 'success', text: 'Department hosting policies updated successfully!' });
        }
        catch (err) {
            console.error('Failed to update policies:', err);
            setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update department policies.' });
        }
        finally {
            setSaving(false);
        }
    };
    const handleReset = () => {
        if (originalPolicies) {
            setPolicies({ ...originalPolicies });
            setStatusMessage(null);
        }
    };
    const hasChanges = JSON.stringify(policies) !== JSON.stringify(originalPolicies);
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"/>
        <p className="text-slate-400 font-medium text-sm">Loading hosting policies & visitor rules...</p>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sliders className="w-5 h-5"/>
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Hosting Policies & Visitor Rules</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              DEPT POLICY
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Configure visitor quotas, host workload thresholds, VIP protocols, and escalation rules for {policies?.departmentName || 'your department'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={handleReset} disabled={!hasChanges || saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-40 text-sm font-medium border border-slate-700/60">
            <RotateCcw className="w-4 h-4"/>
            {t('common.reset', 'Reset')}
          </button>
          <button type="button" onClick={handleSave} disabled={!hasChanges || saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-violet-500/20 disabled:opacity-50">
            {saving ? (<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>) : (<Save className="w-4 h-4"/>)}
            {t('dept_policies.save_btn', 'Save Policies')}
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {statusMessage && (<div className={`flex items-center gap-3 p-4 rounded-xl border text-sm animate-fade-in ${statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {statusMessage.type === 'success' ? (<CheckCircle2 className="w-5 h-5 flex-shrink-0"/>) : (<AlertCircle className="w-5 h-5 flex-shrink-0"/>)}
          <span>{statusMessage.text}</span>
        </div>)}

      {/* Overview Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">Host Daily Cap</span>
            <Users className="w-4 h-4 text-violet-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{policies?.maxVisitorsPerHostPerDay || 5} <span className="text-xs text-slate-400 font-normal">visitors / day</span></div>
          <p className="text-xs text-slate-500 mt-1">Prevents staff burnout</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">Advance Notice</span>
            <Clock className="w-4 h-4 text-cyan-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{policies?.advanceNoticeHours || 2} <span className="text-xs text-slate-400 font-normal">hours prior</span></div>
          <p className="text-xs text-slate-500 mt-1">Lead time for scheduling</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">Auto-Escalation</span>
            <AlertTriangle className="w-4 h-4 text-amber-400"/>
          </div>
          <div className="text-2xl font-bold text-white">{policies?.escalationTimeoutHours || 2} <span className="text-xs text-slate-400 font-normal">hours SLA</span></div>
          <p className="text-xs text-slate-500 mt-1">Unanswered host routing</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">Security Escort</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="text-2xl font-bold text-white">
            {policies?.requireEscortAllVisitors ? (<span className="text-emerald-400">Mandatory</span>) : (<span className="text-slate-300">Zone-Specific</span>)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Department building rule</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Quotas & Workload Rules */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Capacity & Workload Quotas</h2>
              <p className="text-xs text-slate-400">Manage employee visitor loads and department limits</p>
            </div>
          </div>

          {/* Max visitors per host */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-200">{t('dept_policies.max_visitors_per_host_per_day', 'Max Visitors Per Host Per Day')}</label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {policies?.maxVisitorsPerHostPerDay} {t('common.visitors', 'visitors')}
              </span>
            </div>
            <input type="range" min="1" max="20" value={policies?.maxVisitorsPerHostPerDay || 5} onChange={(e) => handleChange('maxVisitorsPerHostPerDay', parseInt(e.target.value, 10))} className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"/>
            <p className="text-xs text-slate-500">
              {t('dept_policies.max_visitors_desc', 'Limits the maximum number of confirmed visitors assigned to a single host in a single working day.')}
            </p>
          </div>

          {/* Max concurrent visitors per host */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-200">{t('dept_policies.max_concurrent_visitors_per_host', 'Max Concurrent Visitors Per Host')}</label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {policies?.maxConcurrentVisitors} {t('dept_policies.simultaneous', 'simultaneous')}
              </span>
            </div>
            <input type="range" min="1" max="10" value={policies?.maxConcurrentVisitors || 3} onChange={(e) => handleChange('maxConcurrentVisitors', parseInt(e.target.value, 10))} className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"/>
            <p className="text-xs text-slate-500">
              {t('dept_policies.concurrent_desc', 'Threshold of overlapping checked-in visits before host is flagged as "Busy" in triage.')}
            </p>
          </div>

          {/* Department daily total cap */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-200">{t('dept_policies.daily_dept_visitor_cap', 'Daily Department Visitor Cap')}</label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {policies?.dailyDepartmentVisitorCap} {t('dept_policies.max_day', 'max / day')}
              </span>
            </div>
            <input type="number" min="5" max="500" value={policies?.dailyDepartmentVisitorCap || 50} onChange={(e) => handleChange('dailyDepartmentVisitorCap', parseInt(e.target.value, 10))} className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"/>
            <p className="text-xs text-slate-500">
              {t('dept_policies.daily_cap_desc', 'Total maximum appointments accepted for the entire department per calendar date.')}
            </p>
          </div>
        </div>

        {/* Section 2: Scheduling & SLAs */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('dept_policies.scheduling_sla_timelines', 'Scheduling & SLA Timelines')}</h2>
              <p className="text-xs text-slate-400">{t('dept_policies.scheduling_sla_desc', 'Define booking notice requirements and response timeouts')}</p>
            </div>
          </div>

          {/* Advance notice hours */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-200">{t('dept_policies.advance_notice_requirement', 'Advance Notice Requirement')}</label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {policies?.advanceNoticeHours} {t('common.hours', 'hours')}
              </span>
            </div>
            <select value={policies?.advanceNoticeHours || 2} onChange={(e) => handleChange('advanceNoticeHours', parseInt(e.target.value, 10))} className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition">
              <option value="1">{t('dept_policies.opt_1h_adv', '1 hour in advance (Urgent allowed)')}</option>
              <option value="2">{t('dept_policies.opt_2h_adv', '2 hours in advance (Standard)')}</option>
              <option value="4">{t('dept_policies.opt_4h_adv', '4 hours in advance (Recommended)')}</option>
              <option value="12">{t('dept_policies.opt_12h_adv', '12 hours in advance (Half day)')}</option>
              <option value="24">{t('dept_policies.opt_24h_adv', '24 hours in advance (1 Business Day)')}</option>
              <option value="48">{t('dept_policies.opt_48h_adv', '48 hours in advance (Strict Security)')}</option>
            </select>
            <p className="text-xs text-slate-500">
              {t('dept_policies.advance_notice_note', 'Visits booked with less notice than this will be rejected or require urgent Manager triage.')}
            </p>
          </div>

          {/* Escalation timeout */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-200">{t('dept_policies.host_sla_timeout', 'Host SLA Response Timeout')}</label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                {policies?.escalationTimeoutHours} {t('common.hours', 'hours')}
              </span>
            </div>
            <select value={policies?.escalationTimeoutHours || 2} onChange={(e) => handleChange('escalationTimeoutHours', parseInt(e.target.value, 10))} className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition">
              <option value="1">{t('dept_policies.opt_1h_resp', '1 hour (Fast response)')}</option>
              <option value="2">{t('dept_policies.opt_2h_resp', '2 hours (Standard SLA)')}</option>
              <option value="4">{t('dept_policies.opt_4h_resp', '4 hours (Extended SLA)')}</option>
              <option value="8">{t('dept_policies.opt_8h_resp', '8 hours (End of shift)')}</option>
              <option value="24">{t('dept_policies.opt_24h_resp', '24 hours (Next day)')}</option>
            </select>
            <p className="text-xs text-slate-500">
              {t('dept_policies.escalation_desc', 'If an assigned host does not accept or decline within this timeframe, request escalates to Manager.')}
            </p>
          </div>

          {/* Weekend allowance toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="pr-4">
                <p className="text-sm font-medium text-slate-200">{t('dept_policies.allow_weekend_visits', 'Allow Weekend & Holiday Visits')}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('dept_policies.allow_weekend_desc', 'Permits visitors to be booked on Saturdays and Sundays')}</p>
              </div>
              <button type="button" onClick={() => handleChange('allowWeekendVisits', !policies?.allowWeekendVisits)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${policies?.allowWeekendVisits ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${policies?.allowWeekendVisits ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Approval Governance */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('dept_policies.approval_governance', 'Approval Governance & Security Rules')}</h2>
              <p className="text-xs text-slate-400">{t('dept_policies.approval_governance_desc', 'Elevated authorization checkpoints and escort policies')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* VIP Approval */}
            <div className={`p-4 rounded-xl border transition cursor-pointer ${policies?.requireManagerApprovalVip ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950/40 border-slate-800'}`} onClick={() => handleChange('requireManagerApprovalVip', !policies?.requireManagerApprovalVip)}>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                  <ShieldAlert className="w-4 h-4"/>
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${policies?.requireManagerApprovalVip ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                  {policies?.requireManagerApprovalVip ? t('common.active', 'ACTIVE') : t('common.off', 'OFF')}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{t('dept_policies.manager_approval_vip', 'Manager Approval for VIPs')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('dept_policies.manager_approval_vip_desc', 'Any visitor tagged as VIP or Executive requires direct sign-off from the Department Manager before badge issuance.')}
              </p>
            </div>

            {/* Contractor Approval */}
            <div className={`p-4 rounded-xl border transition cursor-pointer ${policies?.requireManagerApprovalContractor ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950/40 border-slate-800'}`} onClick={() => handleChange('requireManagerApprovalContractor', !policies?.requireManagerApprovalContractor)}>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <FileText className="w-4 h-4"/>
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${policies?.requireManagerApprovalContractor ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                  {policies?.requireManagerApprovalContractor ? t('common.active', 'ACTIVE') : t('common.off', 'OFF')}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{t('dept_policies.contractor_gate', 'Contractor & Vendor Gate')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('dept_policies.contractor_gate_desc', 'External contractors and technical vendors require Department Manager authorization to access department facilities.')}
              </p>
            </div>

            {/* Escort All Visitors */}
            <div className={`p-4 rounded-xl border transition cursor-pointer ${policies?.requireEscortAllVisitors ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950/40 border-slate-800'}`} onClick={() => handleChange('requireEscortAllVisitors', !policies?.requireEscortAllVisitors)}>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Lock className="w-4 h-4"/>
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${policies?.requireEscortAllVisitors ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {policies?.requireEscortAllVisitors ? t('dept_policies.mandatory', 'MANDATORY') : t('dept_policies.standard', 'STANDARD')}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{t('dept_policies.mandatory_escort', 'Mandatory Staff Escort')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('dept_policies.mandatory_escort_desc', 'All visitors must be escorted by an authorized host employee at all times when inside the department perimeter.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5"/>
            <p>
              {t('dept_policies.note_immediate', 'Note: Changes made here take effect immediately across all employee dashboards, reception kiosks, and visitor booking portals within your department scope. All changes are logged to the security audit repository.')}
            </p>
          </div>
        </div>
      </form>
    </div>);
}
