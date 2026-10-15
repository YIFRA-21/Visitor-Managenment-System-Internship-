import React, { useState } from 'react';
import { Save, RefreshCw, Eye, Hash } from 'lucide-react';
export default function NumberingSettingsForm({ initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        visitorIdPrefix: initialData?.visitorIdPrefix || 'VIS',
        employeeIdPrefix: initialData?.employeeIdPrefix || 'EMP',
        appointmentPrefix: initialData?.appointmentPrefix || 'APP',
        visitorPassPrefix: initialData?.visitorPassPrefix || 'PASS',
        referenceNumberPrefix: initialData?.referenceNumberPrefix || 'REF',
        organizationPrefix: initialData?.organizationPrefix || 'ORG'
    });
    const handleInputChange = (field, val) => {
        setFormData({
            ...formData,
            [field]: val.toUpperCase().replace(/[^A-Z]/g, '') // force caps and alphabetical prefixes
        });
    };
    const handleReset = () => {
        setFormData({
            visitorIdPrefix: initialData?.visitorIdPrefix || 'VIS',
            employeeIdPrefix: initialData?.employeeIdPrefix || 'EMP',
            appointmentPrefix: initialData?.appointmentPrefix || 'APP',
            visitorPassPrefix: initialData?.visitorPassPrefix || 'PASS',
            referenceNumberPrefix: initialData?.referenceNumberPrefix || 'REF',
            organizationPrefix: initialData?.organizationPrefix || 'ORG'
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    // Generate formatting previews based on state
    const year = new Date().getFullYear();
    return (<form onSubmit={handleSubmit} className="row g-4">
      {/* Configuration Controls */}
      <div className="col-12 col-lg-7">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <Hash className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Document & Serial Numbering Prefixes
            </h3>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Visitor Profile Prefix</label>
              <input type="text" maxLength={5} className="form-control text-xs font-semibold" value={formData.visitorIdPrefix} onChange={(e) => handleInputChange('visitorIdPrefix', e.target.value)} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Employee Profile Prefix</label>
              <input type="text" maxLength={5} className="form-control text-xs font-semibold" value={formData.employeeIdPrefix} onChange={(e) => handleInputChange('employeeIdPrefix', e.target.value)} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Appointment Code Prefix</label>
              <input type="text" maxLength={5} className="form-control text-xs font-semibold" value={formData.appointmentPrefix} onChange={(e) => handleInputChange('appointmentPrefix', e.target.value)} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Visitor Pass ID Prefix</label>
              <input type="text" maxLength={5} className="form-control text-xs font-semibold" value={formData.visitorPassPrefix} onChange={(e) => handleInputChange('visitorPassPrefix', e.target.value)} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Audit Reference Prefix</label>
              <input type="text" maxLength={5} className="form-control text-xs font-semibold" value={formData.referenceNumberPrefix} onChange={(e) => handleInputChange('referenceNumberPrefix', e.target.value)} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Organization Prefix</label>
              <input type="text" maxLength={5} className="form-control text-xs font-semibold" value={formData.organizationPrefix} onChange={(e) => handleInputChange('organizationPrefix', e.target.value)} required/>
            </div>
          </div>

          <div className="d-flex gap-2 pt-3 border-top dark:border-slate-800">
            <button type="submit" disabled={isSaving} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
              <Save className="h-4 w-4"/> Save Configuration
            </button>
            <button type="button" onClick={handleReset} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 font-bold">
              <RefreshCw className="h-4 w-4"/> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Formatting Live Previews */}
      <div className="col-12 col-lg-5">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0 d-flex align-items-center gap-2">
              <Eye className="text-blue-500 h-4.5 w-4.5"/> Serial Number Templates
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Simulates the generated barcode/serial index format relative to prefix inputs.</p>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <div className="d-flex justify-content-between">
                <span>Visitor Barcode ID</span>
                <span className="font-mono font-extrabold text-slate-950 dark:text-white">
                  {formData.visitorIdPrefix || 'VIS'}-{year}-000001
                </span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 dark:border-slate-800">
                <span>Employee Badge ID</span>
                <span className="font-mono font-extrabold text-slate-950 dark:text-white">
                  {formData.employeeIdPrefix || 'EMP'}-{year}-000005
                </span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 dark:border-slate-800">
                <span>Appointment Confirmation Code</span>
                <span className="font-mono font-extrabold text-slate-950 dark:text-white">
                  {formData.appointmentPrefix || 'APP'}-{year}-000321
                </span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 dark:border-slate-800">
                <span>Visitor pass Serial</span>
                <span className="font-mono font-extrabold text-slate-950 dark:text-white">
                  {formData.visitorPassPrefix || 'PASS'}-{year}-000078
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>);
}
