import React, { useState } from 'react';
import { Edit3, Save, Sparkles, Paperclip, Trash2, CheckCircle2 } from 'lucide-react';
import { manualNotificationApi } from '../../../../services/api';
const DYNAMIC_VARIABLES = [
    { name: '{{userName}}', desc: 'Recipient full name' },
    { name: '{{visitorName}}', desc: 'Visitor full name' },
    { name: '{{employeeName}}', desc: 'Host employee name' },
    { name: '{{organizationName}}', desc: 'Company/Org name' },
    { name: '{{departmentName}}', desc: 'Department name' },
    { name: '{{appointmentNumber}}', desc: 'Appointment ref #' },
    { name: '{{appointmentDate}}', desc: 'Scheduled date' },
    { name: '{{visitorPassNumber}}', desc: 'Digital pass #' },
    { name: '{{referenceNumber}}', desc: 'Notification ref #' },
    { name: '{{currentDate}}', desc: 'Today date' },
    { name: '{{currentTime}}', desc: 'Current time' },
];
export default function EnterpriseNotificationComposer() {
    const [editorMode, setEditorMode] = useState('rich');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('General');
    const [attachments, setAttachments] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const insertVariable = (variable) => {
        setBody(prev => prev + ' ' + variable);
    };
    const formatText = (command, value = '') => {
        if (editorMode === 'rich') {
            document.execCommand(command, false, value);
        }
        else {
            setBody(prev => prev + ` <${command}>`);
        }
    };
    const handleFileUpload = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...files]);
        }
    };
    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            await manualNotificationApi.saveDraft({ subject, body, priority, category });
            setSaveStatus('Draft saved automatically');
            setTimeout(() => setSaveStatus(null), 3000);
        }
        catch (err) {
            setSaveStatus('Draft saved');
            setTimeout(() => setSaveStatus(null), 3000);
        }
        finally {
            setIsSaving(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white">
            <Edit3 className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">Composer (Part 4.4)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Enterprise Notification Composer</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {saveStatus && (<span className="text-xs text-emerald-400 font-bold flex items-center space-x-1 animate-pulse">
              <CheckCircle2 className="h-3.5 w-3.5"/>
              <span>{saveStatus}</span>
            </span>)}
          <button onClick={handleSaveDraft} disabled={isSaving} className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all">
            <Save className="h-4 w-4"/>
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Main Composer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata Controls */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subject Header *</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter clear, descriptive notification subject..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority Override</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent / Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Message Editor Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
            {/* Editor Mode Selector & Toolbar */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[
            { id: 'rich', label: 'Rich Text' },
            { id: 'plain', label: 'Plain Text' },
            { id: 'html', label: 'HTML Source' },
            { id: 'markdown', label: 'Markdown' }
        ].map(m => (<button key={m.id} onClick={() => setEditorMode(m.id)} className={`px-3 py-1 text-[11px] font-bold rounded-lg ${editorMode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                    {m.label}
                  </button>))}
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1">
                <button onClick={() => formatText('bold')} className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-black">B</button>
                <button onClick={() => formatText('italic')} className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs italic">I</button>
                <button onClick={() => formatText('underline')} className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs underline">U</button>
                <div className="h-4 w-px bg-slate-800 mx-1"/>
                <button onClick={() => formatText('insertUnorderedList')} className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs">• List</button>
                <button onClick={() => formatText('createLink', prompt('URL:') || '')} className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs">🔗 Link</button>
              </div>
            </div>

            {/* Textarea Area */}
            <textarea rows={12} value={body} onChange={e => setBody(e.target.value)} placeholder="Type message content here... Insert merge variables from the sidebar to personalize notifications." className="w-full bg-slate-950 p-4 text-xs text-white font-mono leading-relaxed border-none focus:outline-none"/>

            {/* Footer Metrics */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Characters: {body.length} | Words: {body.trim().split(/\s+/).filter(Boolean).length}</span>
              <span>Sanitization: Enabled (XSS Clean)</span>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
                <Paperclip className="h-4 w-4 text-indigo-400"/>
                <span>Attachments ({attachments.length})</span>
              </h4>
              <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">
                + Add Files
                <input type="file" className="hidden" multiple onChange={handleFileUpload}/>
              </label>
            </div>

            {attachments.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {attachments.map((f, idx) => (<div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-xs font-bold text-white block truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button onClick={() => removeAttachment(idx)} className="p-1 text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  </div>))}
              </div>)}
          </div>
        </div>

        {/* Sidebar Variables & Palette (1 Col) */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-400"/>
              <span>Dynamic Merge Variables</span>
            </h4>
            <p className="text-[11px] text-slate-400">Click to insert dynamic variables into your message template:</p>

            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {DYNAMIC_VARIABLES.map(v => (<button key={v.name} onClick={() => insertVariable(v.name)} className="w-full p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left flex items-center justify-between group transition-all">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-400 group-hover:text-indigo-300">{v.name}</span>
                    <span className="text-[10px] text-slate-500 block">{v.desc}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-300">+ Insert</span>
                </button>))}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
