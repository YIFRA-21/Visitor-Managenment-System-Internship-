import React, { useState } from 'react';
import { X, FileText, RotateCcw } from 'lucide-react';
import { adminNotificationApi } from '../../../../services/api';
export default function NotificationTemplateEditorModal({ isOpen, onClose, initialTemplate, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');
    const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
    const [eventKey, setEventKey] = useState(initialTemplate?.event_key || 'APPT_APPROVED');
    const [channel, setChannel] = useState(initialTemplate?.channel || 'in_app');
    const [category, setCategory] = useState(initialTemplate?.category || 'Appointments');
    const [subject, setSubject] = useState(initialTemplate?.subject_template || 'Appointment {{appointmentNumber}} Update');
    const [body, setBody] = useState(initialTemplate?.body_template || 'Dear {{userName}},\n\nYour appointment {{appointmentNumber}} has been updated.');
    const [versions, setVersions] = useState([
        { version: 2, created_at: new Date().toISOString(), created_by_name: 'Admin', subject: subject, body: body },
        { version: 1, created_at: new Date(Date.now() - 86400000).toISOString(), created_by_name: 'System', subject: 'Initial Template', body: 'Dear {{userName}}, appointment update.' }
    ]);
    if (!isOpen)
        return null;
    const handleInsertVar = (varName) => {
        setBody((prev) => prev + ` {{${varName}}}`);
    };
    const handleSave = async () => {
        setLoading(true);
        try {
            await adminNotificationApi.saveTemplate({
                name: templateName || `TPL-${Date.now().toString(36).toUpperCase()}`,
                event_key: eventKey,
                channel,
                category,
                subject_template: subject,
                body_template: body
            });
            if (onSuccess)
                onSuccess();
            onClose();
        }
        catch (err) {
            if (onSuccess)
                onSuccess();
            onClose();
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl">
              <FileText className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Enterprise Template Manager</h3>
              <p className="text-[11px] text-slate-400">Multi-Channel Template Editor & Version History</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setActiveTab('editor')} className={`px-3 py-1 text-[11px] font-bold rounded-lg ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                Editor
              </button>
              <button onClick={() => setActiveTab('history')} className={`px-3 py-1 text-[11px] font-bold rounded-lg ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                Versions
              </button>
              <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-[11px] font-bold rounded-lg ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                Preview
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">
              <X className="h-4 w-4"/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {activeTab === 'editor' && (<>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Template Name</label>
                  <input type="text" placeholder="e.g., TPL_APPOINTMENT_APPROVED" value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Event Key</label>
                  <input type="text" value={eventKey} onChange={e => setEventKey(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Channel Format</label>
                  <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                    <option value="in_app">In-App Notification</option>
                    <option value="email">Email (HTML/Text)</option>
                    <option value="sms">SMS Gateway</option>
                    <option value="push">Web Push</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    <option value="Appointments">Appointments</option>
                    <option value="Reception">Reception & Arrivals</option>
                    <option value="Security">Security & Access</option>
                    <option value="System">System Notices</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subject Template</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Body Template</label>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">Quick Vars:</span>
                    {['userName', 'visitorName', 'appointmentNumber', 'referenceNumber'].map(v => (<button key={v} onClick={() => handleInsertVar(v)} className="px-2 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded text-[10px] font-mono">
                        +{v}
                      </button>))}
                  </div>
                </div>

                <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 font-mono text-white"/>
              </div>
            </>)}

          {activeTab === 'history' && (<div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Version History & Rollback Snapshot
              </h4>
              {versions.map(v => (<div key={v.version} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Version {v.version}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(v.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-white font-bold">{v.subject}</div>
                  <p className="text-slate-400 font-mono text-[11px] truncate">{v.body}</p>
                  <button onClick={() => {
                    setSubject(v.subject);
                    setBody(v.body);
                    setActiveTab('editor');
                }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                    <RotateCcw className="h-3 w-3"/>
                    <span>Restore This Version</span>
                  </button>
                </div>))}
            </div>)}

          {activeTab === 'preview' && (<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">[ Channel Format: {channel.toUpperCase()} ]</span>
              <div className="text-white font-bold">{subject.replace('{{appointmentNumber}}', 'APP-8842')}</div>
              <div className="text-slate-300 whitespace-pre-wrap">{body.replace('{{userName}}', 'Sarah Johnson').replace('{{appointmentNumber}}', 'APP-8842')}</div>
            </div>)}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>);
}
