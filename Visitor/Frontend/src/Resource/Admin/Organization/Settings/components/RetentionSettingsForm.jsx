import React, { useState } from 'react';
import { Save, RefreshCw, FileText, ShieldAlert } from 'lucide-react';
export default function RetentionSettingsForm({ initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        visitorRecordRetention: initialData?.visitorRecordRetention || 365,
        auditLogRetention: initialData?.auditLogRetention || 180,
        documentRetention: initialData?.documentRetention || 365,
        automaticArchive: initialData?.automaticArchive ?? true,
        automaticDeletion: initialData?.automaticDeletion ?? false,
        privacyNoticeVersion: initialData?.privacyNoticeVersion || 'v2.1'
    });
    const handleCheckboxChange = (field) => {
        setFormData({
            ...formData,
            [field]: !(formData[field])
        });
    };
    const handleReset = () => {
        setFormData({
            visitorRecordRetention: initialData?.visitorRecordRetention || 365,
            auditLogRetention: initialData?.auditLogRetention || 180,
            documentRetention: initialData?.documentRetention || 365,
            automaticArchive: initialData?.automaticArchive ?? true,
            automaticDeletion: initialData?.automaticDeletion ?? false,
            privacyNoticeVersion: initialData?.privacyNoticeVersion || 'v2.1'
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<form onSubmit={handleSubmit} className="row g-4">
      {/* Configuration Controls */}
      <div className="col-12 col-lg-7">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <FileText className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Data Retention & Privacy Settings
            </h3>
          </div>

          <div className="row g-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Visitor Records Retention (Days)</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.visitorRecordRetention} onChange={(e) => setFormData({ ...formData, visitorRecordRetention: Number(e.target.value) })} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Audit Logs Retention (Days)</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.auditLogRetention} onChange={(e) => setFormData({ ...formData, auditLogRetention: Number(e.target.value) })} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Visitor Documents Retention (Days)</label>
              <input type="number" className="form-control text-xs font-semibold" value={formData.documentRetention} onChange={(e) => setFormData({ ...formData, documentRetention: Number(e.target.value) })} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Privacy Policy Version</label>
              <input type="text" className="form-control text-xs font-semibold" value={formData.privacyNoticeVersion} onChange={(e) => setFormData({ ...formData, privacyNoticeVersion: e.target.value })} required/>
            </div>

            <div className="col-12 space-y-2 pt-2">
              <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
                <div className="space-y-0.5">
                  <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Automatic Records Archiving</label>
                  <span className="text-[10px] text-slate-400 font-semibold block">Archive records after expiration before cleanup.</span>
                </div>
                <input className="form-check-input ms-0" type="checkbox" checked={formData.automaticArchive} onChange={() => handleCheckboxChange('automaticArchive')}/>
              </div>

              <div className="form-check form-switch p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl d-flex justify-content-between align-items-center">
                <div className="space-y-0.5">
                  <label className="form-check-label font-extrabold text-slate-950 dark:text-white block">Automatic Permanent Deletion</label>
                  <span className="text-[10px] text-slate-400 font-semibold block">Purge expired visitor profiles automatically.</span>
                </div>
                <input className="form-check-input ms-0" type="checkbox" checked={formData.automaticDeletion} onChange={() => handleCheckboxChange('automaticDeletion')}/>
              </div>
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

      {/* Retention Policy Summary */}
      <div className="col-12 col-lg-5">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0 d-flex align-items-center gap-2">
              <ShieldAlert className="text-blue-500 h-4.5 w-4.5"/> Retention Policy Overview
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Summary of legal compliance values active for GDPR & NDPA privacy rules.</p>

            <div className="space-y-3 text-xs text-slate-650 dark:text-slate-350">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-2">
                <p className="mb-0">📁 **Audit logs safety**: Logs are locked and held for **{formData.auditLogRetention} days** for audit security.</p>
                <p className="mb-0">🗑 **Automatic Purge**: Expired visitor records are marked as archived for security compliance.</p>
                <p className="mb-0">🛡 **Consent Notice**: Active notice **{formData.privacyNoticeVersion}** displayed during registrations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>);
}
