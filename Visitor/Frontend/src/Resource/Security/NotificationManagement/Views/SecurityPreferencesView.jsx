import React, { useState } from 'react';
import { Sliders, Volume2, Moon, ShieldAlert, Save } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const SecurityPreferencesView = () => {
    const { t } = useLanguage();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [browserEnabled, setBrowserEnabled] = useState(true);
    const [desktopEnabled, setDesktopEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
    const [emergencyBypass, setEmergencyBypass] = useState(true);
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400"/> {t('notification.securityPreferences', 'Security Officer Notification Preferences')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('notification.securityPreferencesDesc', 'Configure personal alert delivery channels, tactical sound alerts, quiet hours, and emergency override rules.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        {/* Delivery Channels */}
        <div className="space-y-3 pb-4 border-b border-slate-900">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">{t('notification.deliveryChannels', 'Delivery Channels')}</h3>
          {[
            { label: t('notification.emailNotif', 'Email Notifications'), desc: t('notification.emailNotifDesc', 'Receive shift summaries, incident reports, and critical escalations via email'), checked: emailEnabled, onChange: setEmailEnabled },
            { label: t('notification.browserPush', 'Browser Push Notifications'), desc: t('notification.browserPushDesc', 'Show pop-up toasts when SOC dashboard tab is active'), checked: browserEnabled, onChange: setBrowserEnabled },
            { label: t('notification.desktopPush', 'Desktop Notifications'), desc: t('notification.desktopPushDesc', 'System-level alerts even when browser is minimized or on lock screen'), checked: desktopEnabled, onChange: setDesktopEnabled }
        ].map((ch, i) => (<label key={i} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-white block">{ch.label}</span>
                <span className="text-slate-400 text-[11px]">{ch.desc}</span>
              </div>
              <input type="checkbox" checked={ch.checked} onChange={(e) => ch.onChange(e.target.checked)} className="w-4 h-4 accent-red-500"/>
            </label>))}
        </div>

        {/* Tactical Sound */}
        <div className="space-y-3 pb-4 border-b border-slate-900">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">{t('notification.tacticalAlertSounds', 'Tactical Alert Sounds')}</h3>
          <label className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400"/>
              <div>
                <span className="font-bold text-white block">{t('notification.tacticalAudio', 'Tactical Audio on Critical & Emergency Alerts')}</span>
                <span className="text-slate-400 text-[11px]">{t('notification.tacticalAudioDesc', 'Play distinct audio tones for watchlist hits, panic alarms, and door breach events')}</span>
              </div>
            </div>
            <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="w-4 h-4 accent-amber-500"/>
          </label>
        </div>

        {/* Quiet Hours & Emergency Override */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">{t('notification.quietHoursAndOverride', 'Quiet Hours & Emergency Override')}</h3>
          <label className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-400"/>
              <div>
                <span className="font-bold text-white block">{t('notification.enableQuietHoursSecurity', 'Enable Quiet Hours (00:00 – 05:00)')}</span>
                <span className="text-slate-400 text-[11px]">{t('notification.enableQuietHoursDesc', 'Suppress non-critical SOC alerts during off-shift hours')}</span>
              </div>
            </div>
            <input type="checkbox" checked={quietHoursEnabled} onChange={(e) => setQuietHoursEnabled(e.target.checked)} className="w-4 h-4 accent-purple-500"/>
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-950/20 cursor-pointer">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400"/>
              <div>
                <span className="font-bold text-red-300 block">{t('notification.emergencyOverride', 'Emergency Alerts Always Bypass Quiet Hours')}</span>
                <span className="text-red-400/80 text-[11px]">{t('notification.emergencyOverrideDesc', 'Watchlist, panic, lockdown, fire, and door breach alerts will ALWAYS sound')}</span>
              </div>
            </div>
            <input type="checkbox" checked={emergencyBypass} onChange={(e) => setEmergencyBypass(e.target.checked)} className="w-4 h-4 accent-red-500"/>
          </label>
        </div>

        <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/20">
          <Save className="w-4 h-4"/> {t('btn.saveSecurityPreferences', 'Save Security Preferences')}
        </button>
      </div>
    </div>);
};
export default SecurityPreferencesView;
