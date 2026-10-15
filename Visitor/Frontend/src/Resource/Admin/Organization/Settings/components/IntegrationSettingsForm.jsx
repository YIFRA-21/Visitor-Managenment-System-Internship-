import React, { useState } from 'react';
import { Save, RefreshCw, Radio, Settings } from 'lucide-react';
export default function IntegrationSettingsForm({ initialData, onSave, isSaving, onNotify }) {
    const [formData, setFormData] = useState({
        emailProvider: initialData?.emailProvider || 'smtp.gmail.com',
        smsProvider: initialData?.smsProvider || 'Twilio Gateway',
        qrCodeService: initialData?.qrCodeService || 'Internal Generator',
        restApiEndpoint: initialData?.restApiEndpoint || 'https://api.visitor.com/v1',
        webhookUrl: initialData?.webhookUrl || 'https://hooks.visitor.com/events',
        ldapActiveDirectory: initialData?.ldapActiveDirectory || ''
    });
    const [testing, setTesting] = useState(false);
    const handleTestConnection = async () => {
        setTesting(true);
        // Simple mock network delay
        setTimeout(() => {
            setTesting(false);
            onNotify('Gateway Connection Check Passed! Mock Response: HTTP 200 OK.', 'success');
        }, 1500);
    };
    const handleReset = () => {
        setFormData({
            emailProvider: initialData?.emailProvider || 'smtp.gmail.com',
            smsProvider: initialData?.smsProvider || 'Twilio Gateway',
            qrCodeService: initialData?.qrCodeService || 'Internal Generator',
            restApiEndpoint: initialData?.restApiEndpoint || 'https://api.visitor.com/v1',
            webhookUrl: initialData?.webhookUrl || 'https://hooks.visitor.com/events',
            ldapActiveDirectory: initialData?.ldapActiveDirectory || ''
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 dark:border-slate-800">
        <div className="d-flex align-items-center gap-2">
          <Settings className="text-blue-500 h-5 w-5"/>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
            External Gateway Integration Settings
          </h3>
        </div>
        <button type="button" disabled={testing} onClick={handleTestConnection} className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1.5 font-bold">
          <Radio className={`h-3.5 w-3.5 ${testing ? 'animate-pulse' : ''}`}/> 
          {testing ? 'Pinging Gateway...' : 'Test Connection'}
        </button>
      </div>

      <div className="row g-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
        <div className="col-6">
          <label className="form-label text-xxs font-bold uppercase text-slate-400">SMTP Server Host</label>
          <input type="text" className="form-control text-xs font-semibold" value={formData.emailProvider} onChange={(e) => setFormData({ ...formData, emailProvider: e.target.value })} required/>
        </div>

        <div className="col-6">
          <label className="form-label text-xxs font-bold uppercase text-slate-400">SMS Gateway Provider</label>
          <input type="text" className="form-control text-xs font-semibold" value={formData.smsProvider} onChange={(e) => setFormData({ ...formData, smsProvider: e.target.value })} required/>
        </div>

        <div className="col-6">
          <label className="form-label text-xxs font-bold uppercase text-slate-400">QR Generation Service</label>
          <select className="form-select text-xs font-semibold" value={formData.qrCodeService} onChange={(e) => setFormData({ ...formData, qrCodeService: e.target.value })}>
            <option value="Internal Generator">Internal Generator</option>
            <option value="Google Chart API">Google Chart API</option>
          </select>
        </div>

        <div className="col-6">
          <label className="form-label text-xxs font-bold uppercase text-slate-400">Active Directory (AD / LDAP)</label>
          <input type="text" className="form-control text-xs font-semibold" placeholder="e.g. ldap://corp.dir" value={formData.ldapActiveDirectory} onChange={(e) => setFormData({ ...formData, ldapActiveDirectory: e.target.value })}/>
        </div>

        <div className="col-6">
          <label className="form-label text-xxs font-bold uppercase text-slate-400">REST API Target Endpoint</label>
          <input type="url" className="form-control text-xs font-semibold font-mono" value={formData.restApiEndpoint} onChange={(e) => setFormData({ ...formData, restApiEndpoint: e.target.value })} required/>
        </div>

        <div className="col-6">
          <label className="form-label text-xxs font-bold uppercase text-slate-400">Outgoing Webhook Web URL</label>
          <input type="url" className="form-control text-xs font-semibold font-mono" value={formData.webhookUrl} onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })} required/>
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
