import React, { useState } from 'react';
import BackButton from '../../../../components/common/BackButton';
import ToggleSwitch from '../../../../components/common/ToggleSwitch';

export default function VisitorSettings() {
    const [qrExpiryHours, setQrExpiryHours] = useState(24);
    const [welcomeMessage, setWelcomeMessage] = useState('Welcome to IT Park Visitor Portal!');
    const [sendSmsHost, setSendSmsHost] = useState(true);
    const [emailQrPass, setEmailQrPass] = useState(true);
    const [saved, setSaved] = useState(false);
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };
    return (<div className="vms-visitor-settings space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="bi bi-gear-fill text-indigo-400"></i> Admin Visitor Module Settings
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              System configuration for self-service kiosks, QR code pass generation, and notification text.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><i className="bi bi-check-circle-fill"></i> Settings Saved!</span>}
          <button onClick={handleSave} className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-2">
            <i className="bi bi-save"></i> Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* QR Code & Kiosk Config */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
            <i className="bi bi-qr-code me-2"></i> Pass & Kiosk Configuration
          </h3>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">QR Code Pass Validity Duration (Hours):</label>
            <input type="number" value={qrExpiryHours} onChange={(e) => setQrExpiryHours(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Kiosk Banner Welcome Message:</label>
            <input type="text" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"/>
          </div>
        </div>

        {/* Email & SMS Notifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-2">
            <i className="bi bi-bell-fill me-2"></i> Automated Notifications
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white text-xs">Send SMS Arrival Alert to Host</div>
                <div className="text-slate-400 text-[11px]">Instant SMS when visitor checks in at reception</div>
              </div>
              <ToggleSwitch
                checked={sendSmsHost}
                onChange={setSendSmsHost}
                role="admin"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white text-xs">Email Digital QR Pass to Visitor</div>
                <div className="text-slate-400 text-[11px]">Automatic PDF pass with QR code sent upon booking</div>
              </div>
              <ToggleSwitch
                checked={emailQrPass}
                onChange={setEmailQrPass}
                role="admin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>);
}
