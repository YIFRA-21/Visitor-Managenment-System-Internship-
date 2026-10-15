import React, { useState } from 'react';
import { Save, RefreshCw, Eye, Globe } from 'lucide-react';
export default function GeneralSettingsForm({ initialData, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        orgCode: initialData?.orgCode || 'VMS',
        defaultLanguage: initialData?.defaultLanguage || 'en',
        defaultCountry: initialData?.defaultCountry || 'Ethiopia',
        defaultCurrency: initialData?.defaultCurrency || 'ETB',
        dateFormat: initialData?.dateFormat || 'YYYY-MM-DD',
        timeFormat: initialData?.timeFormat || '24h',
        timeZone: initialData?.timeZone || 'Africa/Addis_Ababa',
        businessWeekStart: initialData?.businessWeekStart || 'Monday',
        fiscalYearStart: initialData?.fiscalYearStart || 'July'
    });
    const handleReset = () => {
        setFormData({
            orgCode: initialData?.orgCode || 'VMS',
            defaultLanguage: initialData?.defaultLanguage || 'en',
            defaultCountry: initialData?.defaultCountry || 'Ethiopia',
            defaultCurrency: initialData?.defaultCurrency || 'ETB',
            dateFormat: initialData?.dateFormat || 'YYYY-MM-DD',
            timeFormat: initialData?.timeFormat || '24h',
            timeZone: initialData?.timeZone || 'Africa/Addis_Ababa',
            businessWeekStart: initialData?.businessWeekStart || 'Monday',
            fiscalYearStart: initialData?.fiscalYearStart || 'July'
        });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    // Formats preview text reactively based on options
    const getFormattedDatePreview = () => {
        const today = new Date();
        if (formData.dateFormat === 'YYYY-MM-DD')
            return today.toISOString().split('T')[0];
        if (formData.dateFormat === 'DD/MM/YYYY')
            return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        return today.toLocaleDateString();
    };
    const getFormattedTimePreview = () => {
        return formData.timeFormat === '24h' ? '14:30' : '02:30 PM';
    };
    const getFormattedCurrencyPreview = () => {
        return formData.defaultCurrency === 'ETB' ? '1,500.00 ETB' : '$1,500.00 USD';
    };
    return (<form onSubmit={handleSubmit} className="row g-4">
      {/* Parameters Panel */}
      <div className="col-12 col-lg-7">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <Globe className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              General & Localization Configuration
            </h3>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Organization Code</label>
              <input type="text" className="form-control text-xs font-semibold" value={formData.orgCode} onChange={(e) => setFormData({ ...formData, orgCode: e.target.value.toUpperCase() })} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Default System Language</label>
              <select className="form-select text-xs font-semibold" value={formData.defaultLanguage} onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}>
                <option value="en">English (US)</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="fr">Français (French)</option>
              </select>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Default Currency</label>
              <select className="form-select text-xs font-semibold" value={formData.defaultCurrency} onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}>
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD (United States Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Default Country</label>
              <input type="text" className="form-control text-xs font-semibold" value={formData.defaultCountry} onChange={(e) => setFormData({ ...formData, defaultCountry: e.target.value })} required/>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Date Format</label>
              <select className="form-select text-xs font-semibold" value={formData.dateFormat} onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-07-21)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (21/07/2026)</option>
              </select>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Time Format</label>
              <select className="form-select text-xs font-semibold" value={formData.timeFormat} onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}>
                <option value="24h">24 Hour (14:30)</option>
                <option value="12h">12 Hour (02:30 PM)</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">System baseline TimeZone</label>
              <select className="form-select text-xs font-semibold" value={formData.timeZone} onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (GMT+3)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="Europe/London">Europe/London (GMT+0/1)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              </select>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">First Day of Week</label>
              <select className="form-select text-xs font-semibold" value={formData.businessWeekStart} onChange={(e) => setFormData({ ...formData, businessWeekStart: e.target.value })}>
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div className="col-6">
              <label className="form-label text-xxs font-bold uppercase text-slate-400">Fiscal Year Start Month</label>
              <select className="form-select text-xs font-semibold" value={formData.fiscalYearStart} onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}>
                <option value="January">January</option>
                <option value="July">July</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-2 pt-3 border-top dark:border-slate-800">
            <button type="submit" disabled={isSaving} className="btn btn-sm btn-success d-flex align-items-center gap-1.5 font-bold">
              <Save className="h-4 w-4"/> Save Mappings
            </button>
            <button type="button" onClick={handleReset} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 font-bold">
              <RefreshCw className="h-4 w-4"/> Reset Form
            </button>
          </div>
        </div>
      </div>

      {/* Formatting Preview Sidebar Panel (Localization settings Page 3 Preview Panel) */}
      <div className="col-12 col-lg-5">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0 d-flex align-items-center gap-2">
              <Eye className="text-blue-500 h-4.5 w-4.5"/> Regional Preview Panel
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Live simulation of numerical, currency, and date/time formats across report modules.</p>

            <div className="space-y-3 font-semibold text-xs text-slate-650 dark:text-slate-350">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                <div className="d-flex justify-content-between">
                  <span>Numeric Decimal Format</span>
                  <span className="font-extrabold text-slate-950 dark:text-white">1,234,567.89</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 dark:border-slate-800">
                  <span>Date Format</span>
                  <span className="font-extrabold text-slate-950 dark:text-white">{getFormattedDatePreview()}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 dark:border-slate-800">
                  <span>Time Value</span>
                  <span className="font-extrabold text-slate-950 dark:text-white">{getFormattedTimePreview()}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 dark:border-slate-800">
                  <span>Currency Representation</span>
                  <span className="font-extrabold text-slate-950 dark:text-white">{getFormattedCurrencyPreview()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>);
}
