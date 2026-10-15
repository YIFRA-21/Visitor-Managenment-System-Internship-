import React, { useState } from 'react';
import { Save, RefreshCw, Eye, ShieldAlert } from 'lucide-react';
export default function VisitorPreferencesForm({ initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        allowWalkIn: initialData?.allowWalkIn ?? true,
        requireAppointment: initialData?.requireAppointment ?? false,
        photoRequired: initialData?.photoRequired ?? true,
        govIdRequired: initialData?.govIdRequired ?? true,
        selfRegEnabled: initialData?.selfRegEnabled ?? true,
        qrEnabled: initialData?.qrEnabled ?? true,
        defaultPassDuration: initialData?.defaultPassDuration || 8,
        maxVisitorsPerDay: initialData?.maxVisitorsPerDay || 500
    });
    const handleCheckboxChange = (field) => {
        setFormData({
            ...formData,
            [field]: !(formData[field])
        });
    };
    const handleReset = () => {
        setFormData({
            allowWalkIn: initialData?.allowWalkIn ?? true,
            requireAppointment: initialData?.requireAppointment ?? false,
            photoRequired: initialData?.photoRequired ?? true,
            govIdRequired: initialData?.govIdRequired ?? true,
            selfRegEnabled: initialData?.selfRegEnabled ?? true,
            qrEnabled: initialData?.qrEnabled ?? true,
            defaultPassDuration: initialData?.defaultPassDuration || 8,
            maxVisitorsPerDay: initialData?.maxVisitorsPerDay || 500
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<form onSubmit={handleSubmit} className="row g-4">
      {/* Configuration Inputs */}
      <div className="col-12 col-lg-7">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <ShieldAlert className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Visitor Management Rules
            </h3>
          </div>

          <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
            <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
              <div className="space-y-0.5">
                <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Allow Walk-In Visitors</label>
                <span className="text-[10px] text-slate-400 font-semibold block">Enable reception desk walk-in registration.</span>
              </div>
              <input className="form-check-input ms-0" type="checkbox" checked={formData.allowWalkIn} onChange={() => handleCheckboxChange('allowWalkIn')}/>
            </div>

            <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
              <div className="space-y-0.5">
                <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Strict Pre-Scheduled Appointments</label>
                <span className="text-[10px] text-slate-400 font-semibold block">Only pre-registered visitors with active bookings are allowed.</span>
              </div>
              <input className="form-check-input ms-0" type="checkbox" checked={formData.requireAppointment} onChange={() => handleCheckboxChange('requireAppointment')}/>
            </div>

            <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
              <div className="space-y-0.5">
                <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Capture Badge Photo</label>
                <span className="text-[10px] text-slate-400 font-semibold block">Require camera capture during kiosk self registration.</span>
              </div>
              <input className="form-check-input ms-0" type="checkbox" checked={formData.photoRequired} onChange={() => handleCheckboxChange('photoRequired')}/>
            </div>

            <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
              <div className="space-y-0.5">
                <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Require Gov ID Document</label>
                <span className="text-[10px] text-slate-400 font-semibold block">Verify passport/driver license numbering logs.</span>
              </div>
              <input className="form-check-input ms-0" type="checkbox" checked={formData.govIdRequired} onChange={() => handleCheckboxChange('govIdRequired')}/>
            </div>

            <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
              <div className="space-y-0.5">
                <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Kiosk Self Registration Mode</label>
                <span className="text-[10px] text-slate-400 font-semibold block">Enable public visitor tablet/iPad lobby check-ins.</span>
              </div>
              <input className="form-check-input ms-0" type="checkbox" checked={formData.selfRegEnabled} onChange={() => handleCheckboxChange('selfRegEnabled')}/>
            </div>

            <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
              <div className="space-y-0.5">
                <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Email QR Code Entry Passes</label>
                <span className="text-[10px] text-slate-400 font-semibold block">Send QR pass access links to confirmed visitors.</span>
              </div>
              <input className="form-check-input ms-0" type="checkbox" checked={formData.qrEnabled} onChange={() => handleCheckboxChange('qrEnabled')}/>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Default Pass Duration (Hours)</label>
                <input type="number" className="form-control text-xs font-semibold" value={formData.defaultPassDuration} onChange={(e) => setFormData({ ...formData, defaultPassDuration: Number(e.target.value) })} required/>
              </div>
              <div className="col-6">
                <label className="form-label text-xxs font-bold uppercase text-slate-400">Max Visitors Daily Limit</label>
                <input type="number" className="form-control text-xs font-semibold" value={formData.maxVisitorsPerDay} onChange={(e) => setFormData({ ...formData, maxVisitorsPerDay: Number(e.target.value) })} required/>
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

      {/* pass/registration live preview simulator */}
      <div className="col-12 col-lg-5">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0 d-flex align-items-center gap-2">
              <Eye className="text-blue-500 h-4.5 w-4.5"/> Pass Preview Simulator
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Simulates how check-in kiosk forms and confirmation passes render with these preferences.</p>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">ENTRY PASS DETAILED</span>
                <span className="text-[10px] uppercase font-bold text-emerald-500">VALID</span>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-350 dark:border-slate-800 d-flex align-items-center justify-content-center text-[10px] text-slate-400 font-bold text-center">
                  {formData.photoRequired ? '📷 PHOTO\nCAPTURED' : '📷 PHOTO\nSKIPPED'}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-slate-950 dark:text-white mb-0">Abraham Lincoln</p>
                  <p className="text-[10px] text-slate-400 mb-0">Visitor ID: VIS-2026-000452</p>
                  <p className="text-[10px] text-slate-400 mb-0">Duration: {formData.defaultPassDuration} Hours max validity</p>
                </div>
              </div>

              {formData.qrEnabled && (<div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-center space-y-1.5">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 mx-auto rounded d-flex align-items-center justify-content-center text-[10px] font-bold text-white dark:text-black">
                    QR
                  </div>
                  <p className="text-[9px] text-slate-400 mb-0">Authorized QR Scan Entry Gate Enabled</p>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </form>);
}
