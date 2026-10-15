import React, { useState } from 'react';
import { Download, Upload, CheckCircle2, FileJson } from 'lucide-react';
import api from '../../../../../services/api';
export default function ImportExportPanel({ onNotify, onRefresh }) {
    const [fileContent, setFileContent] = useState(null);
    const [fileName, setFileName] = useState('');
    const [importPreview, setImportPreview] = useState(false);
    const [validating, setValidating] = useState(false);
    const handleExport = () => {
        // Navigate to backend export url which sets headers for download
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const exportUrl = `${api.defaults.baseURL}/settings/export?token=${token}`;
        window.open(exportUrl, '_blank');
        onNotify('JSON Configuration profile exported successfully.', 'success');
    };
    const handleFileChange = (e) => {
        setFileContent(null);
        setImportPreview(false);
        const file = e.target.files?.[0];
        if (!file)
            return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result);
                setFileContent(json);
                setImportPreview(true);
            }
            catch {
                onNotify('Invalid File format: Failed to parse uploaded JSON configuration profile.', 'danger');
            }
        };
        reader.readAsText(file);
    };
    const handleImportSubmit = async () => {
        setValidating(true);
        try {
            const res = await api.post('/settings/import', { config: fileContent });
            if (res.data.success) {
                onNotify('Organization configuration settings successfully applied.', 'success');
                setFileContent(null);
                setImportPreview(false);
                setFileName('');
                onRefresh();
            }
        }
        catch (err) {
            const msg = err.response?.data?.error || 'Configuration import failed validation checks.';
            onNotify(msg, 'danger');
        }
        finally {
            setValidating(false);
        }
    };
    return (<div className="row g-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
      {/* Export Panel */}
      <div className="col-12 col-md-6">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <Download className="text-blue-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Export System Settings Profile
            </h3>
          </div>
          <p className="text-xxs text-slate-400 font-semibold mb-4">Export all active localization formats, numbering prefixes, and feature settings to JSON.</p>
          <button onClick={handleExport} className="btn btn-primary d-flex align-items-center gap-2 font-bold">
            <FileJson className="h-4.5 w-4.5"/> Download Configuration JSON
          </button>
        </div>
      </div>

      {/* Import Panel */}
      <div className="col-12 col-md-6">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-100">
          <div className="d-flex align-items-center gap-2 border-bottom pb-2 dark:border-slate-800">
            <Upload className="text-purple-500 h-5 w-5"/>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-0">
              Import Configuration Profile
            </h3>
          </div>
          <p className="text-xxs text-slate-400 font-semibold mb-3">Upload a previously exported settings profile in JSON format.</p>

          <div className="space-y-3">
            <input type="file" accept=".json" id="file-import-input" className="d-none" onChange={handleFileChange}/>
            <label htmlFor="file-import-input" className="w-100 p-4 border border-dashed border-slate-200 dark:border-slate-850 hover:border-primary rounded-xl text-center bg-slate-50 dark:bg-slate-900/50 cursor-pointer transition-all duration-150">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2"/>
              <span>{fileName ? `Uploaded: ${fileName}` : 'Click to upload settings JSON profile'}</span>
            </label>

            {importPreview && fileContent && (<div className="border border-slate-200 dark:border-slate-850 rounded-xl p-3 space-y-3 bg-slate-50 dark:bg-slate-950/20">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-450">Configuration Scan Summary</span>
                  <span className="text-[9px] badge bg-success-subtle text-success">Scan Success</span>
                </div>
                <div className="space-y-1 text-xxs font-semibold">
                  <p className="mb-0">✔ TimeZone: {fileContent.general?.timeZone || 'Inherit'}</p>
                  <p className="mb-0">✔ Currency: {fileContent.localization?.currency || 'Inherit'}</p>
                  <p className="mb-0">✔ Number Prefixes: {fileContent.numbering?.visitorIdPrefix ? 'Yes' : 'No'}</p>
                </div>
                <button type="button" disabled={validating} onClick={handleImportSubmit} className="btn btn-sm btn-success w-100 d-flex align-items-center justify-content-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4"/> Confirm & Apply Configuration
                </button>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
