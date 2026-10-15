import React, { useState } from 'react';
import { ToggleLeft, Save, RefreshCw, AlertTriangle } from 'lucide-react';
export default function FeatureTogglePanel({ initialData, onSave, isSaving }) {
    const [features, setFeatures] = useState(initialData?.features || {
        selfRegistration: true,
        qrPass: true,
        multiBranch: true,
        vehicleManagement: false,
        emergencyMode: false,
        analyticsDashboard: true,
        facialRecognition: false
    });
    const [warningMsg, setWarningMsg] = useState('');
    const handleToggle = (key) => {
        setWarningMsg('');
        const currentVal = features[key];
        // Dependency checks and warning alerts
        if (key === 'qrPass' && currentVal === true) {
            setWarningMsg('Warning: Disabling QR Visitor Passes will block email confirmation scans and auto gate access.');
        }
        else if (key === 'selfRegistration' && currentVal === true) {
            setWarningMsg('Warning: Disabling Self Registration will lock lobby kiosk check-in terminals.');
        }
        else if (key === 'emergencyMode' && currentVal === false) {
            setWarningMsg('Important: Turning on Emergency Mode will immediately lock all visitor access checkpoints.');
        }
        setFeatures({
            ...features,
            [key]: !currentVal
        });
    };
    const handleReset = () => {
        setFeatures(initialData?.features || {
            selfRegistration: true,
            qrPass: true,
            multiBranch: true,
            vehicleManagement: false,
            emergencyMode: false,
            analyticsDashboard: true,
            facialRecognition: false
        });
        setWarningMsg('');
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ features });
    };
    return (<form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
        <ToggleLeft className="text-blue-500 h-5 w-5"/>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
          Enterprise Feature Switchboard & Toggles
        </h3>
      </div>

      {warningMsg && (<div className="alert alert-warning text-xs font-semibold py-2.5 px-3 border-0 d-flex align-items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0"/>
          <span>{warningMsg}</span>
        </div>)}

      <div className="row g-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
        <div className="col-12 col-md-6">
          <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5">
              <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Visitor Self Registration</label>
              <span className="text-[10px] text-slate-400 font-semibold block">Toggle tablet self check-in layouts.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.selfRegistration} onChange={() => handleToggle('selfRegistration')}/>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5">
              <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">QR Code Passes</label>
              <span className="text-[10px] text-slate-400 font-semibold block">Enable scanning entry codes at guard checkpoints.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.qrPass} onChange={() => handleToggle('qrPass')}/>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5">
              <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Multi-Branch Management</label>
              <span className="text-[10px] text-slate-400 font-semibold block">Support branch level configurations.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.multiBranch} onChange={() => handleToggle('multiBranch')}/>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5">
              <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Vehicle Gate Management</label>
              <span className="text-[10px] text-slate-400 font-semibold block">Track license plates and visitor parking logs.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.vehicleManagement} onChange={() => handleToggle('vehicleManagement')}/>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5">
              <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Active Analytics Dashboard</label>
              <span className="text-[10px] text-slate-400 font-semibold block">Render graphical statistics for checkout ratios.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.analyticsDashboard} onChange={() => handleToggle('analyticsDashboard')}/>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5">
              <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Facial Recognition (Biometrics)</label>
              <span className="text-[10px] text-slate-400 font-semibold block">Verify visitor profile matches during checkins.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.facialRecognition} onChange={() => handleToggle('facialRecognition')}/>
          </div>
        </div>

        <div className="col-12">
          <div className="form-check form-switch p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl d-flex justify-content-between align-items-center">
            <div className="space-y-0.5 text-red-900 dark:text-red-400">
              <label className="form-check-label font-extrabold block">🚨 Emergency Lockout Mode</label>
              <span className="text-[10px] text-red-750 dark:text-red-300 font-semibold block">Immediately freeze all active visitor passes and seal gate credentials.</span>
            </div>
            <input className="form-check-input ms-0" type="checkbox" checked={features.emergencyMode} onChange={() => handleToggle('emergencyMode')}/>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 pt-3 border-top dark:border-slate-800">
        <button type="submit" disabled={isSaving} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
          <Save className="h-4 w-4"/> Save Mappings
        </button>
        <button type="button" onClick={handleReset} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 font-bold">
          <RefreshCw className="h-4 w-4"/> Reset
        </button>
      </div>
    </form>);
}
