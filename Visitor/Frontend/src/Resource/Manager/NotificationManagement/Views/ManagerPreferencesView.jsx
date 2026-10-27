import React, { useState } from 'react';
import { Sliders, Moon, Volume2, ShieldAlert, Save } from 'lucide-react';
import ToggleSwitch from '../../../../components/common/ToggleSwitch';

const ManagerPreferencesView = () => {
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [browserEnabled, setBrowserEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
    const [emergencyBypass, setEmergencyBypass] = useState(true);
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400"/> Manager Notification Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Customize your personal alert channels, sound settings, and quiet hours.</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        {/* Delivery Channels */}
        <div className="space-y-3 pb-4 border-b border-slate-900">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">Delivery Channels</h3>
          
          <div onClick={() => setEmailEnabled(!emailEnabled)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
            <div>
              <span className="font-bold text-white block">Email Notifications</span>
              <span className="text-slate-400 text-[11px]">Receive summary & urgent notifications via registered email</span>
            </div>
            <ToggleSwitch checked={emailEnabled} onChange={setEmailEnabled} color="blue" showLabelBadge={true}/>
          </div>

          <div onClick={() => setBrowserEnabled(!browserEnabled)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
            <div>
              <span className="font-bold text-white block">Browser Desktop Push</span>
              <span className="text-slate-400 text-[11px]">Show pop-up notification toasts when browser is active</span>
            </div>
            <ToggleSwitch checked={browserEnabled} onChange={setBrowserEnabled} color="blue" showLabelBadge={true}/>
          </div>

          <div onClick={() => setSoundEnabled(!soundEnabled)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
            <div>
              <span className="font-bold flex items-center gap-1.5 text-white">
                <Volume2 className="w-3.5 h-3.5 text-amber-400"/> Audio Sound Chime
              </span>
              <span className="text-slate-400 text-[11px]">Play audio alert on incoming high-priority notifications</span>
            </div>
            <ToggleSwitch checked={soundEnabled} onChange={setSoundEnabled} color="amber" showLabelBadge={true}/>
          </div>
        </div>

        {/* Quiet Hours & Emergency Bypass */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-400">Quiet Hours Schedule</h3>

          <div onClick={() => setQuietHoursEnabled(!quietHoursEnabled)} className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
            <div>
              <span className="font-bold text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-purple-400"/> Enable Quiet Hours (22:00 - 07:00)
              </span>
              <span className="text-slate-400 text-[11px]">Mute non-essential notifications during non-working hours</span>
            </div>
            <ToggleSwitch checked={quietHoursEnabled} onChange={setQuietHoursEnabled} color="purple" showLabelBadge={true}/>
          </div>

          <div onClick={() => setEmergencyBypass(!emergencyBypass)} className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-950/30 cursor-pointer transition-all">
            <div>
              <span className="font-bold text-red-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400"/> Emergency Alerts Bypass Quiet Hours
              </span>
              <span className="text-red-400/80 text-[11px]">Critical security, fire, and lockdown alerts will ALWAYS notify you</span>
            </div>
            <ToggleSwitch checked={emergencyBypass} onChange={setEmergencyBypass} color="red" showLabelBadge={true}/>
          </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
          <Save className="w-4 h-4"/> Save Preferences
        </button>
      </div>
    </div>);
};
export default ManagerPreferencesView;
