import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const ReceptionSettingsView = () => {
    const { t } = useLanguage();
    const [queueThreshold, setQueueThreshold] = useState(15);
    const [passExpiryLeadMins, setPassExpiryLeadMins] = useState(15);
    const [hostResponseLeadMins, setHostResponseLeadMins] = useState(10);
    const [autoPrintBadge, setAutoPrintBadge] = useState(true);
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400"/> {t('notification.frontDeskConfig', 'Front-Desk Configuration Settings')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('notification.frontDeskConfigDesc', 'Configure desk-specific queue thresholds, badge auto-print rules, and lead-time intervals.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.queueThreshold', 'Queue Long Wait Threshold (Minutes)')}</label>
            <input type="number" value={queueThreshold} onChange={(e) => setQueueThreshold(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"/>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.queueThresholdDesc', 'Visitors waiting beyond this time trigger a queue alert.')}</span>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.passExpiryLeadTime', 'Pass Expiry Lead-Time (Minutes)')}</label>
            <input type="number" value={passExpiryLeadMins} onChange={(e) => setPassExpiryLeadMins(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"/>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.passExpiryLeadTimeDesc', 'Send expiry warning this many minutes before pass expires.')}</span>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.hostResponseLeadTime', 'Host Response Lead-Time (Minutes)')}</label>
            <input type="number" value={hostResponseLeadMins} onChange={(e) => setHostResponseLeadMins(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"/>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.hostResponseLeadTimeDesc', 'Escalate if host does not respond within this time.')}</span>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.autoPrintBadge', 'Auto-Print Badge on Check-In')}</label>
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2.5 cursor-pointer">
              <input type="checkbox" checked={autoPrintBadge} onChange={(e) => setAutoPrintBadge(e.target.checked)} className="w-4 h-4 accent-emerald-500"/>
              <span className="text-white font-semibold">{autoPrintBadge ? t('status.autoPrintActive', 'Enabled – Auto-Print Active') : t('status.manualPrint', 'Disabled – Manual Print')}</span>
            </label>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.autoPrintBadgeDesc', 'Automatically print visitor badge after successful identity verification.')}</span>
          </div>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20">
          <Save className="w-4 h-4"/> {t('btn.saveDeskSettings', 'Save Desk Settings')}
        </button>
      </div>
    </div>);
};
export default ReceptionSettingsView;
