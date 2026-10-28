import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, FileText, Users, Radio, Edit3, Paperclip, Eye, Send, Clock, Save, Sparkles, Mail, Smartphone, Bell, Monitor, Globe, Upload, Trash2 } from 'lucide-react';
import { manualNotificationApi } from '../../../../services/api';
import RecipientResolutionCenter from './RecipientResolutionCenter';
const STEPS = [
    { id: 1, label: 'Information', icon: FileText },
    { id: 2, label: 'Recipients', icon: Users },
    { id: 3, label: 'Channels', icon: Radio },
    { id: 4, label: 'Compose', icon: Edit3 },
    { id: 5, label: 'Attachments', icon: Paperclip },
    { id: 6, label: 'Preview', icon: Eye },
    { id: 7, label: 'Confirm', icon: Check },
];
const MERGE_VARIABLES = [
    '{{userName}}', '{{visitorName}}', '{{employeeName}}', '{{organizationName}}',
    '{{appointmentNumber}}', '{{appointmentDate}}', '{{visitorPassNumber}}', '{{referenceNumber}}'
];
export default function EnterpriseCreateNotificationWizard({ isOpen, onClose, onSuccess }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    // Step 1: Info
    const [subject, setSubject] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [priority, setPriority] = useState('medium');
    const [importance, setImportance] = useState('normal');
    const [notificationType, setNotificationType] = useState('notification');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    // Step 2: Recipients
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    // Step 3: Channels
    const [channels, setChannels] = useState(['in_app']);
    // Step 4: Compose
    const [body, setBody] = useState('');
    // Step 5: Attachments
    const [attachments, setAttachments] = useState([]);
    if (!isOpen)
        return null;
    const toggleChannel = (ch) => {
        setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
    };
    const insertMergeVar = (variable) => {
        setBody(prev => prev + ' ' + variable);
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
    const handleSendNow = async () => {
        setLoading(true);
        try {
            await manualNotificationApi.dispatch({
                subject, title, category, priority, importance, notificationType,
                body, channels,
                recipientIds: selectedRecipients.map(r => r.id),
                tags: tags.split(',').map(t => t.trim()).filter(Boolean)
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
    const handleSaveDraft = async () => {
        setLoading(true);
        try {
            await manualNotificationApi.saveDraft({
                subject, title, category, priority, body, channels,
                recipientIds: selectedRecipients.map(r => r.id)
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
    const canProceed = () => {
        switch (currentStep) {
            case 1: return subject.trim().length > 0;
            case 2: return selectedRecipients.length > 0;
            case 3: return channels.length > 0;
            case 4: return body.trim().length > 0;
            default: return true;
        }
    };
    const renderPreviewBody = () => {
        return body
            .replace(/\{\{userName\}\}/g, 'Sarah Johnson')
            .replace(/\{\{visitorName\}\}/g, 'John Smith')
            .replace(/\{\{employeeName\}\}/g, 'Michael Chen')
            .replace(/\{\{organizationName\}\}/g, 'Enterprise VMS Global')
            .replace(/\{\{appointmentNumber\}\}/g, 'VMS-APT-8842')
            .replace(/\{\{appointmentDate\}\}/g, new Date().toLocaleDateString())
            .replace(/\{\{visitorPassNumber\}\}/g, 'PASS-XK8842')
            .replace(/\{\{referenceNumber\}\}/g, 'REF-MNT-001');
    };
    return (<div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Enterprise Create Notification Wizard</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
            <X className="h-4 w-4"/>
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            return (<React.Fragment key={step.id}>
                  <button onClick={() => isComplete && setCurrentStep(step.id)} className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30'
                        : 'text-slate-500'}`}>
                    {isComplete ? <Check className="h-3 w-3"/> : <Icon className="h-3 w-3"/>}
                    <span className="hidden md:inline">{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (<div className={`h-px flex-1 mx-1 ${isComplete ? 'bg-emerald-500/50' : 'bg-slate-800'}`}/>)}
                </React.Fragment>);
        })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* STEP 1: Information */}
          {currentStep === 1 && (<div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subject *</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter notification subject..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"/>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification display title..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold">
                    <option value="General">General</option>
                    <option value="Security">Security</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Reception">Reception</option>
                    <option value="System">System</option>
                    <option value="broadcast">Broadcast</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent / Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Importance</label>
                  <select value={importance} onChange={e => setImportance(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white">
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notification Type</label>
                  <select value={notificationType} onChange={e => setNotificationType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white">
                    <option value="notification">Standard Notification</option>
                    <option value="alert">Alert</option>
                    <option value="broadcast">Broadcast</option>
                    <option value="announcement">Announcement</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description or internal notes..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tags (comma separated)</label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="security, urgent, audit..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expiration Date</label>
                  <input type="datetime-local" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"/>
                </div>
              </div>
            </div>)}

          {/* STEP 2: Recipients */}
          {currentStep === 2 && (<RecipientResolutionCenter selectedRecipients={selectedRecipients} onRecipientsChange={setSelectedRecipients}/>)}

          {/* STEP 3: Channels */}
          {currentStep === 3 && (<div className="space-y-4 max-w-2xl">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Select Delivery Channels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                { id: 'in_app', label: 'In-App Notification', desc: 'Bell icon, notification drawer, toast', icon: Bell, enabled: true },
                { id: 'email', label: 'Email (SMTP)', desc: 'HTML email via SMTP gateway', icon: Mail, enabled: true },
                { id: 'sms', label: 'SMS Gateway', desc: 'Text message via SMS provider', icon: Smartphone, enabled: true },
                { id: 'browser', label: 'Browser Push', desc: 'Web push notification', icon: Globe, enabled: true },
                { id: 'desktop', label: 'Desktop Notification', desc: 'OS-level desktop alert', icon: Monitor, enabled: false },
            ].map(ch => (<button key={ch.id} onClick={() => ch.enabled && toggleChannel(ch.id)} disabled={!ch.enabled} className={`p-4 rounded-2xl border text-left transition-all ${channels.includes(ch.id)
                    ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-600/10'
                    : ch.enabled
                        ? 'bg-slate-950 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-950/50 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                    <div className="flex items-center space-x-3">
                      <ch.icon className={`h-5 w-5 ${channels.includes(ch.id) ? 'text-indigo-400' : 'text-slate-500'}`}/>
                      <div>
                        <div className={`text-xs font-bold ${channels.includes(ch.id) ? 'text-white' : 'text-slate-300'}`}>
                          {ch.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ch.desc}</div>
                      </div>
                      {channels.includes(ch.id) && (<Check className="h-4 w-4 text-emerald-400 ml-auto"/>)}
                    </div>
                  </button>))}
              </div>
            </div>)}

          {/* STEP 4: Compose */}
          {currentStep === 4 && (<div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Compose Message Body</h4>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-500 font-bold">Merge Variables:</span>
                  <div className="flex flex-wrap gap-1">
                    {MERGE_VARIABLES.map(v => (<button key={v} onClick={() => insertMergeVar(v)} className="px-2 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded text-[10px] font-mono hover:bg-slate-700 transition-all">
                        +{v.replace(/\{\{|\}\}/g, '')}
                      </button>))}
                  </div>
                </div>
              </div>

              {/* Simple Rich Text Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                <button onClick={() => setBody((p) => p + '<b></b>')} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-black hover:bg-slate-700">B</button>
                <button onClick={() => setBody((p) => p + '<i></i>')} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] italic hover:bg-slate-700">I</button>
                <button onClick={() => setBody((p) => p + '<u></u>')} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] underline hover:bg-slate-700">U</button>
                <div className="h-4 w-px bg-slate-700 mx-1"/>
                <button onClick={() => setBody((p) => p + '\n• ')} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] hover:bg-slate-700">• List</button>
                <button onClick={() => setBody((p) => p + '\n| Col1 | Col2 |\n|------|------|\n| | |')} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] hover:bg-slate-700">Table</button>
                <button onClick={() => setBody((p) => p + '<a href="">link</a>')} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] hover:bg-slate-700">🔗 Link</button>
              </div>

              <textarea rows={10} value={body} onChange={e => setBody(e.target.value)} placeholder="Compose your notification message here. Use merge variables like {{userName}} for dynamic content..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white font-mono leading-relaxed"/>
            </div>)}

          {/* STEP 5: Attachments */}
          {currentStep === 5 && (<div className="space-y-4 max-w-2xl">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Attachments & Documents</h4>

              <div className="p-6 bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-3">
                <Upload className="h-8 w-8 text-slate-500 mx-auto"/>
                <p className="text-xs text-slate-400">Drop files here or click to upload</p>
                <p className="text-[10px] text-slate-500">Supported: PDF, Word, Excel, PowerPoint, Images (Max 10MB each)</p>
                <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">
                  Browse Files
                  <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.png,.jpg,.jpeg" onChange={handleFileUpload}/>
                </label>
              </div>

              {attachments.length > 0 && (<div className="space-y-2">
                  {attachments.map((file, idx) => (<div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-4 w-4 text-indigo-400"/>
                        <div>
                          <span className="text-xs font-bold text-white">{file.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      </div>
                      <button onClick={() => removeAttachment(idx)} className="p-1 text-rose-400 hover:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    </div>))}
                </div>)}
            </div>)}

          {/* STEP 6: Preview */}
          {currentStep === 6 && (<div className="space-y-4 max-w-2xl">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Multi-Channel Preview</h4>

              {channels.map(ch => (<div key={ch} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-black uppercase">
                      {ch.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">Preview</span>
                  </div>
                  <div className="text-xs font-bold text-white">{subject || 'Untitled Notification'}</div>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{renderPreviewBody()}</div>
                  {attachments.length > 0 && (<div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                      📎 {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                    </div>)}
                </div>))}
            </div>)}

          {/* STEP 7: Confirmation */}
          {currentStep === 7 && (<div className="space-y-4 max-w-2xl">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Dispatch Confirmation Summary</h4>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Subject</span>
                    <p className="text-xs text-white font-bold mt-0.5">{subject}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Category</span>
                    <p className="text-xs text-white mt-0.5">{category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Priority</span>
                    <p className="text-xs text-white mt-0.5 capitalize">{priority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Recipients</span>
                    <p className="text-xs text-indigo-400 font-bold mt-0.5">{selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Channels</span>
                    <p className="text-xs text-white mt-0.5">{channels.map(c => c.replace('_', ' ')).join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Attachments</span>
                    <p className="text-xs text-white mt-0.5">{attachments.length} file{attachments.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={handleSaveDraft} disabled={loading} className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold">
                  <Save className="h-4 w-4"/>
                  <span>Save as Draft</span>
                </button>
                <button onClick={handleSendNow} disabled={loading} className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20">
                  <Send className="h-4 w-4"/>
                  <span>{loading ? 'Dispatching...' : 'Send Now'}</span>
                </button>
                <button className="flex items-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md">
                  <Clock className="h-4 w-4"/>
                  <span>Schedule Later</span>
                </button>
              </div>
            </div>)}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1} className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold disabled:opacity-30">
            <ChevronLeft className="h-4 w-4"/>
            <span>Previous</span>
          </button>

          <div className="text-[10px] text-slate-500 font-bold">
            Step {currentStep} / {STEPS.length}
          </div>

          {currentStep < STEPS.length ? (<button onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))} disabled={!canProceed()} className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-30 shadow-md">
              <span>Next</span>
              <ChevronRight className="h-4 w-4"/>
            </button>) : (<div />)}
        </div>
      </div>
    </div>);
}
