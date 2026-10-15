import React, { useState } from 'react';
import { Settings, Save, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const PlatformPreferencesView = () => {
    const { t } = useLanguage();
    const [emergencyBypass, setEmergencyBypass] = useState(true);
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400"/> {t('platform.system_wide_default_preferences', 'System-Wide Default Preferences')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('platform.system_wide_default_preferences_desc', 'Configure global default quiet hours and emergency quiet-hour bypass policies.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <label className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-950/20 cursor-pointer">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400"/>
            <div>
              <span className="font-bold text-red-300 block">{t('platform.emergency_events_bypass_quiet_hours', 'Emergency Events Always Bypass Quiet Hours')}</span>
              <span className="text-red-400/80 text-[11px]">{t('platform.emergency_events_bypass_desc', 'Fire, panic, lockdown, and watchlist alerts will ALWAYS deliver immediately regardless of user quiet hours')}</span>
            </div>
          </div>
          <input type="checkbox" checked={emergencyBypass} onChange={(e) => setEmergencyBypass(e.target.checked)} className="w-4 h-4 accent-red-500"/>
        </label>

        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Save className="w-4 h-4"/> {t('platform.save_global_defaults', 'Save Global Platform Defaults')}
        </button>
      </div>
    </div>);
};
export default PlatformPreferencesView;
