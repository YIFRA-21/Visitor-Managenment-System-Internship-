import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import ToggleSwitch from '../../../../components/common/ToggleSwitch';

const SecuritySettingsView = () => {
    const { t } = useLanguage();
    const [patrolIntervalMins, setPatrolIntervalMins] = useState(30);
    const [doorBreachThresholdSec, setDoorBreachThresholdSec] = useState(10);
    const [overstayAlertMins, setOverstayAlertMins] = useState(30);
    const [autoLockTurnstile, setAutoLockTurnstile] = useState(true);
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400"/> {t('notification.securityOpsConfig', 'Security Operations Configuration')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('notification.securityOpsDesc', 'Configure patrol checkpoint intervals, door breach detection thresholds, and turnstile auto-lock rules.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.patrolInterval', 'Patrol Checkpoint Interval (Minutes)')}</label>
            <input type="number" value={patrolIntervalMins} onChange={(e) => setPatrolIntervalMins(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-red-500"/>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.patrolIntervalDesc', 'Send missed checkpoint alert if no scan within this interval.')}</span>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.doorBreachThreshold', 'Door Breach Detection Threshold (Seconds)')}</label>
            <input type="number" value={doorBreachThresholdSec} onChange={(e) => setDoorBreachThresholdSec(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-red-500"/>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.doorBreachThresholdDesc', 'Fire door forced open alarm after this many seconds of sensor contact break.')}</span>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.overstayAlertTime', 'Visitor Overstay Alert Lead-Time (Minutes)')}</label>
            <input type="number" value={overstayAlertMins} onChange={(e) => setOverstayAlertMins(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-red-500"/>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.overstayAlertDesc', 'Trigger overstay security alert this many minutes after approved duration expires.')}</span>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">{t('form.autoLockTurnstile', 'Auto-Lock Turnstile on Blacklist Match')}</label>
            <div onClick={() => setAutoLockTurnstile(!autoLockTurnstile)} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5 cursor-pointer hover:border-slate-700 transition-all">
              <span className="text-white font-semibold text-xs">{autoLockTurnstile ? t('status.autoLockActive', 'Enabled – Auto-Lock Active') : t('status.manualLockOnly', 'Disabled – Manual Lock Only')}</span>
              <ToggleSwitch checked={autoLockTurnstile} onChange={setAutoLockTurnstile} color="red"/>
            </div>
            <span className="text-slate-500 text-[11px] mt-1 block">{t('form.autoLockTurnstileDesc', 'Automatically lock turnstile lane on blacklist or watchlist match.')}</span>
          </div>
        </div>

        <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/20">
          <Save className="w-4 h-4"/> {t('btn.saveSecuritySettings', 'Save Security Settings')}
        </button>
      </div>
    </div>);
};
export default SecuritySettingsView;
