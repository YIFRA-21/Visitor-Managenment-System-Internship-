import React, { useState } from 'react';
import { ShieldCheck, Info, Save, RefreshCw } from 'lucide-react';
export default function SecurityPreferencesForm({ initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        sessionTimeout: initialData?.sessionTimeout || 30,
        autoLogoutTime: initialData?.autoLogoutTime || 15,
        passwordExpiration: initialData?.passwordExpiration || 90,
        maxLoginAttempts: initialData?.maxLoginAttempts || 5,
        deviceRestrictions: initialData?.deviceRestrictions ?? false,
        ipRestrictions: initialData?.ipRestrictions || '',
        securityAlerts: initialData?.securityAlerts ?? true,
        twoFactorAuth: initialData?.twoFactorAuth ?? false
    });
    const handleCheckboxChange = (field) => {
        setFormData({
            ...formData,
            [field]: !(formData[field])
        });
    };
    const handleReset = () => {
        setFormData({
            sessionTimeout: initialData?.sessionTimeout || 30,
            autoLogoutTime: initialData?.autoLogoutTime || 15,
            passwordExpiration: initialData?.passwordExpiration || 90,
            maxLoginAttempts: initialData?.maxLoginAttempts || 5,
            deviceRestrictions: initialData?.deviceRestrictions ?? false,
            ipRestrictions: initialData?.ipRestrictions || '',
            securityAlerts: initialData?.securityAlerts ?? true,
            twoFactorAuth: initialData?.twoFactorAuth ?? false
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<form onSubmit={handleSubmit} className="row g-4">
      {/* Configuration Input Controls */}
      <div className="col-12 col-lg-7">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <ShieldCheck className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Administrative Security Preferences
            </h3>
          </div>

          <div className="row g-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Idle Session Timeout (Minutes)</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.sessionTimeout} onChange={(e) => setFormData({ ...formData, sessionTimeout: Number(e.target.value) })} required/>
            </div>
            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Auto Logout Window (Minutes)</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.autoLogoutTime} onChange={(e) => setFormData({ ...formData, autoLogoutTime: Number(e.target.value) })} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Password Age Expiration (Days)</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.passwordExpiration} onChange={(e) => setFormData({ ...formData, passwordExpiration: Number(e.target.value) })} required/>
            </div>
            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Max Login Lockout Attempts</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.maxLoginAttempts} onChange={(e) => setFormData({ ...formData, maxLoginAttempts: Number(e.target.value) })} required/>
            </div>

            <div className="col-12">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">IP Filtering Whitelist Restrictions (Optional)</label>
              <input type="text" className="form-control text-xs font-semibold font-mono" placeholder="e.g. 192.168.1.1, 10.0.0.0/24" value={formData.ipRestrictions} onChange={(e) => setFormData({ ...formData, ipRestrictions: e.target.value })}/>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 d-block">
                Leave blank to allow all check-in terminal connections.
              </span>
            </div>

            <div className="col-12 space-y-2 pt-2">
              <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
                <div className="space-y-0.5">
                  <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Device Bind Restrictions</label>
                  <span className="text-[10px] text-slate-400 font-semibold block">Restrict logins to registered staff devices.</span>
                </div>
                <input className="form-check-input ms-0" type="checkbox" checked={formData.deviceRestrictions} onChange={() => handleCheckboxChange('deviceRestrictions')}/>
              </div>

              <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
                <div className="space-y-0.5">
                  <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Security Breach Alerts</label>
                  <span className="text-[10px] text-slate-400 font-semibold block">Send push alerts for lockout triggers.</span>
                </div>
                <input className="form-check-input ms-0" type="checkbox" checked={formData.securityAlerts} onChange={() => handleCheckboxChange('securityAlerts')}/>
              </div>

              <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
                <div className="space-y-0.5">
                  <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Two-Factor Authentication (MFA)</label>
                  <span className="text-[10px] text-slate-400 font-semibold block">Enforce authentication codes for admin actions (MFA placeholder).</span>
                </div>
                <input className="form-check-input ms-0" type="checkbox" checked={formData.twoFactorAuth} onChange={() => handleCheckboxChange('twoFactorAuth')}/>
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
        </div>
      </div>

      {/* Security recommendations banner */}
      <div className="col-12 col-lg-5">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0 d-flex align-items-center gap-2">
              <Info className="text-blue-500 h-4.5 w-4.5"/> Security Compliance Advisor
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Recommended system lockout limits matching NIST identity guidelines.</p>

            <div className="space-y-3 text-xs text-slate-650 dark:text-slate-350">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-2">
                <p className="mb-0">🔑 **Password Policies**: Require rotations every 90 days. Avoid reuse of last 5 pass hashes.</p>
                <p className="mb-0">⏳ **Idle Timout limits**: Session timeouts should not exceed 30 minutes on public terminals.</p>
                <p className="mb-0">🚪 **Maximum Attempts**: Lockdown users for 15 minutes after 5 consecutive password failure logs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>);
}
