import React, { useState } from 'react';
import ToggleSwitch from '../../../../components/common/ToggleSwitch';
export default function VisitorPolicySettings() {
    const [config, setConfig] = useState({
        requireIdUpload: true,
        requireFaceSelfie: true,
        requireNdaSignature: true,
        requireEscortForVendors: false,
        maxVisitorStayHours: 8,
        autoCheckoutTimeoutHours: 12,
        qrTokenValidityMinutes: 1440,
        allowWalkInRegistration: true,
        notifyHostOnArrival: true,
        enableBadgePrinting: true,
    });
    const [saved, setSaved] = useState(false);
    const handleToggle = (key) => {
        setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };
    return (<div className="vms-visitor-policy space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="bi bi-shield-lock-fill text-indigo-400"></i> Visitor Security & Access Rules
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure system-wide security requirements, NDA compliance, badge printing, and auto-expiration rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><i className="bi bi-check-circle-fill"></i> Saved!</span>}
          <button onClick={handleSave} className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-2">
            <i className="bi bi-save"></i> Save Rules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification & Compliance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <i className="bi bi-person-bounding-box"></i> Identity & Compliance Rules
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Require Government ID Upload</div>
                <div className="text-slate-400 text-[11px]">Visitors must attach Passport / National ID photo during booking</div>
              </div>
              <ToggleSwitch
                checked={config.requireIdUpload}
                onChange={() => handleToggle('requireIdUpload')}
                role="admin"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Require Face Selfie Verification</div>
                <div className="text-slate-400 text-[11px]">Webcam / live camera photo capture required for AI match</div>
              </div>
              <ToggleSwitch
                checked={config.requireFaceSelfie}
                onChange={() => handleToggle('requireFaceSelfie')}
                role="admin"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Mandatory Digital NDA Signature</div>
                <div className="text-slate-400 text-[11px]">Enforce e-signature on confidentiality agreement prior to entry</div>
              </div>
              <ToggleSwitch
                checked={config.requireNdaSignature}
                onChange={() => handleToggle('requireNdaSignature')}
                role="admin"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Mandatory Security Escort</div>
                <div className="text-slate-400 text-[11px]">Require assigned escort for Contractor / Vendor access</div>
              </div>
              <ToggleSwitch
                checked={config.requireEscortForVendors}
                onChange={() => handleToggle('requireEscortForVendors')}
                color="amber"
              />
            </div>
          </div>
        </div>

        {/* Operational & Badge Controls Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-2 flex items-center gap-2">
            <i className="bi bi-clock-history"></i> Access Limits & Expirations
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Max Continuous Stay Limit (Hours):</label>
              <input type="number" value={config.maxVisitorStayHours} onChange={(e) => setConfig({ ...config, maxVisitorStayHours: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"/>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Auto-Checkout Timeout (Hours):</label>
              <input type="number" value={config.autoCheckoutTimeoutHours} onChange={(e) => setConfig({ ...config, autoCheckoutTimeoutHours: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"/>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Enable Walk-In Registration</div>
                <div className="text-slate-400 text-[11px]">Allow Reception desk to create instant walk-in passes</div>
              </div>
              <ToggleSwitch
                checked={config.allowWalkInRegistration}
                onChange={() => handleToggle('allowWalkInRegistration')}
                color="emerald"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-white">Automatic Badge Thermal Printing</div>
                <div className="text-slate-400 text-[11px]">Trigger badge label printer upon reception check-in</div>
              </div>
              <ToggleSwitch
                checked={config.enableBadgePrinting}
                onChange={() => handleToggle('enableBadgePrinting')}
                color="purple"
              />
            </div>
          </div>
        </div>
      </div>
    </div>);
}
