import React, { useState } from 'react';
import { Sliders, Moon, Volume2, ShieldAlert, Save } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import ToggleSwitch from '../../../../components/common/ToggleSwitch';

const ReceptionPreferencesView = () => {
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
          <Sliders className="w-5 h-5 text-indigo-400"/> {t('notification.receptionPreferences', 'Reception Notification Preferences')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('notification.receptionPreferencesDesc', 'Configure personal alert channels, sound settings, quiet hours, and emergency overrides.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        {/* Delivery Channels */}
        <div className="space-y-3 pb-4 border-b border-slate-900">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">{t('notification.deliveryChannels', 'Delivery Channels')}</h3>

          {[
            { label: t('notification.emailNotif', 'Email Notifications'), desc: t('notification.emailNotifReceptionDesc', 'Receive check-in summaries and urgent alerts via email'), checked: emailEnabled, onChange: setEmailEnabled },
            { label: t('notification.browserPush', 'Browser Push Notifications'), desc: t('notification.browserPushReceptionDesc', 'Show pop-up toasts when browser tab is active'), checked: browserEnabled, onChange: setBrowserEnabled },
            { label: t('notification.desktopPush', 'Desktop Notifications'), desc: t('notification.desktopPushReceptionDesc', 'System-level notifications even when browser is minimized'), checked: desktopEnabled, onChange: setDesktopEnabled }
        ].map((ch, i) => (<div key={i} onClick={() => ch.onChange(!ch.checked)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
              <div>
                <span className="font-bold text-white block">{ch.label}</span>
                <span className="text-slate-400 text-[11px]">{ch.desc}</span>
              </div>
              <ToggleSwitch checked={ch.checked} onChange={ch.onChange} color="emerald" showLabelBadge={true}/>
            </div>))}
        </div>

        {/* Sound */}
        <div className="space-y-3 pb-4 border-b border-slate-900">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">{t('notification.soundSettings', 'Sound Settings')}</h3>
          <div onClick={() => setSoundEnabled(!soundEnabled)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400"/>
              <div>
                <span className="font-bold text-white block">{t('notification.audioChimeHighPriority', 'Audio Chime on High-Priority Alerts')}</span>
                <span className="text-slate-400 text-[11px]">{t('notification.audioChimeDesc', 'Play desk alert sound for visitor arrivals and queue warnings')}</span>
              </div>
            </div>
            <ToggleSwitch checked={soundEnabled} onChange={setSoundEnabled} color="amber" showLabelBadge={true}/>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">{t('notification.quietHoursAndOverride', 'Quiet Hours & Emergency Override')}</h3>

          <div onClick={() => setQuietHoursEnabled(!quietHoursEnabled)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-400"/>
              <div>
                <span className="font-bold text-white block">{t('notification.enableQuietHoursReception', 'Enable Quiet Hours (22:00 – 06:00)')}</span>
                <span className="text-slate-400 text-[11px]">{t('notification.enableQuietHoursReceptionDesc', 'Mute non-critical desk alerts during off-shift hours')}</span>
              </div>
            </div>
            <ToggleSwitch checked={quietHoursEnabled} onChange={setQuietHoursEnabled} color="purple" showLabelBadge={true}/>
          </div>

          <div onClick={() => setEmergencyBypass(!emergencyBypass)} className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-950/30 cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400"/>
              <div>
                <span className="font-bold text-red-300 block">{t('notification.emergencyOverride', 'Emergency Alerts Always Bypass Quiet Hours')}</span>
                <span className="text-red-400/80 text-[11px]">{t('notification.emergencyOverrideReceptionDesc', 'Fire, lockdown, medical, and panic alerts will ALWAYS sound')}</span>
              </div>
            </div>
            <ToggleSwitch checked={emergencyBypass} onChange={setEmergencyBypass} color="red" showLabelBadge={true}/>
          </div>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20">
          <Save className="w-4 h-4"/> {t('btn.savePreferences', 'Save Preferences')}
        </button>
      </div>
    </div>);
};
export default ReceptionPreferencesView;
