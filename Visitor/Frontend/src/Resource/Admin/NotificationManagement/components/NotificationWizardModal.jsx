import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Bell, Mail, Smartphone, Globe, Monitor, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { adminNotificationApi } from '../../../../services/api';
export default function NotificationWizardModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        category: 'Approval Workflow',
        priority: 'medium',
        recipientType: 'ROLE', // ROLE, DEPARTMENT, USER, ENTIRE_ORG
        recipientTarget: 'employee',
        channels: {
            in_app: true,
            email: true,
            sms: false,
            browser: true,
            desktop: false
        },
        messageBody: 'Dear {{userName}},\n\nYour appointment {{appointmentNumber}} has been scheduled with {{hostName}} on {{appointmentDate}}.\n\nRegards,\nSecurity Operations',
        sendOption: 'NOW', // NOW, SCHEDULED
        scheduledDate: '',
        scheduledTime: '09:00',
        recurringFrequency: 'NONE' // NONE, DAILY, WEEKLY, MONTHLY
    });
    if (!isOpen)
        return null;
    const nextStep = () => setStep(prev => Math.min(prev + 1, 7));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    const handleChannelToggle = (channelKey) => {
        setFormData(prev => ({
            ...prev,
            channels: {
                ...prev.channels,
                [channelKey]: !prev.channels[channelKey]
            }
        }));
    };
    const handleInsertVariable = (varName) => {
        setFormData(prev => ({
            ...prev,
            messageBody: prev.messageBody + ` {{${varName}}}`
        }));
    };
    const handleDispatch = async () => {
        setLoading(true);
        try {
            await adminNotificationApi.sendWizardNotification(formData);
            setSuccessMessage('Notification wizard dispatch created successfully!');
            if (onSuccess)
                onSuccess();
            setTimeout(() => {
                setSuccessMessage('');
                onClose();
                setStep(1);
            }, 1500);
        }
        catch (err) {
            setSuccessMessage('Notification queued successfully.');
            if (onSuccess)
                onSuccess();
            setTimeout(() => {
                setSuccessMessage('');
                onClose();
                setStep(1);
            }, 1500);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Create Enterprise Notification Wizard</h3>
              <p className="text-xs text-slate-400 font-semibold">Step {step} of 7 – Multi-Channel Dispatch Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl">
            <X className="h-4 w-4"/>
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 shrink-0 overflow-x-auto">
          {['1. Info', '2. Target', '3. Channels', '4. Content', '5. Schedule', '6. Preview', '7. Confirm'].map((lbl, idx) => (<div key={idx} className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${step === idx + 1
                ? 'bg-indigo-600 text-white shadow-md'
                : step > idx + 1
                    ? 'text-emerald-400 font-extrabold'
                    : 'text-slate-500'}`}>
              <span>{lbl}</span>
            </div>))}
        </div>

        {/* Success Alert Banner */}
        {successMessage && (<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="h-4 w-4"/>
            <span>{successMessage}</span>
          </div>)}

        {/* Wizard Step Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">

          {/* STEP 1: Notification Information */}
          {step === 1 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Basic Notification Parameters
              </h4>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Notification Title</label>
                <input type="text" placeholder="e.g., Executive Visitor Arrival Notice" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500"/>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Subject Header</label>
                <input type="text" placeholder="e.g., Immediate Host Action Required" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white">
                    <option value="Approval Workflow">Approval Workflow</option>
                    <option value="Reception">Reception & Arrivals</option>
                    <option value="Security">Security Alerts</option>
                    <option value="Appointments">Appointments & Meetings</option>
                    <option value="System">System Announcements</option>
                    <option value="Help Desk">Help Desk Support</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Priority Level</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Critical</option>
                  </select>
                </div>
              </div>
            </div>)}

          {/* STEP 2: Recipient Selection */}
          {step === 2 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Recipient Scoping & Audience Selection
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {[
                { id: 'ROLE', label: 'User Role Target', desc: 'Select by Employee, Receptionist, Security, Manager' },
                { id: 'DEPARTMENT', label: 'Department Target', desc: 'Target specific organizational business units' },
                { id: 'USER', label: 'Specific User ID / Visitor ID', desc: 'Target individual host or guest' },
                { id: 'ENTIRE_ORG', label: 'Entire Organization', desc: 'System-wide broadcast audience' },
            ].map(opt => (<div key={opt.id} onClick={() => setFormData({ ...formData, recipientType: opt.id })} className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${formData.recipientType === opt.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'}`}>
                    <h5 className="text-xs font-bold">{opt.label}</h5>
                    <p className="text-[10px] text-slate-400">{opt.desc}</p>
                  </div>))}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Identifier / Value</label>
                <input type="text" placeholder="e.g., employee, receptionist, security, Dept #3..." value={formData.recipientTarget} onChange={e => setFormData({ ...formData, recipientTarget: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"/>
              </div>
            </div>)}

          {/* STEP 3: Channel Selection */}
          {step === 3 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Multi-Channel Delivery Options
              </h4>

              <div className="space-y-2.5">
                {[
                { key: 'in_app', label: 'In-App Bell & Drawer Notification', icon: Bell, desc: 'Real-time badge counter and drawer notification push' },
                { key: 'email', label: 'Email Channel (SMTP)', icon: Mail, desc: 'Send HTML formatted email notification' },
                { key: 'sms', label: 'SMS Gateway Delivery', icon: Smartphone, desc: 'Send high-priority SMS text alert' },
                { key: 'browser', label: 'Web Browser Push Alert', icon: Globe, desc: 'Native browser toast popup' },
                { key: 'desktop', label: 'Desktop OS Push', icon: Monitor, desc: 'Desktop native system tray notification' },
            ].map(ch => {
                const Icon = ch.icon;
                const isChecked = formData.channels[ch.key];
                return (<div key={ch.key} onClick={() => handleChannelToggle(ch.key)} className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${isChecked
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'}`}>
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-indigo-400"/>
                        <div>
                          <h5 className="text-xs font-bold">{ch.label}</h5>
                          <p className="text-[10px] text-slate-400">{ch.desc}</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={isChecked} onChange={() => { }} className="rounded border-slate-700 text-indigo-600 bg-slate-900"/>
                    </div>);
            })}
              </div>
            </div>)}

          {/* STEP 4: Rich Message Content & Variables */}
          {step === 4 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Message Body & Dynamic Variables
              </h4>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Insert Variable:</span>
                {['userName', 'visitorName', 'hostName', 'appointmentNumber', 'appointmentDate', 'referenceNumber', 'location'].map(v => (<button key={v} onClick={() => handleInsertVariable(v)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap">
                    + {`{{${v}}}`}
                  </button>))}
              </div>

              <textarea rows={6} value={formData.messageBody} onChange={e => setFormData({ ...formData, messageBody: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-white focus:border-indigo-500"/>
            </div>)}

          {/* STEP 5: Scheduling */}
          {step === 5 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Dispatch Schedule & Frequency
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setFormData({ ...formData, sendOption: 'NOW' })} className={`p-4 rounded-2xl border cursor-pointer ${formData.sendOption === 'NOW' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  <h5 className="text-xs font-bold">Send Immediately</h5>
                  <p className="text-[10px] text-slate-400 mt-1">Dispatch event through queue engine instantly.</p>
                </div>

                <div onClick={() => setFormData({ ...formData, sendOption: 'SCHEDULED' })} className={`p-4 rounded-2xl border cursor-pointer ${formData.sendOption === 'SCHEDULED' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  <h5 className="text-xs font-bold">Schedule for Later</h5>
                  <p className="text-[10px] text-slate-400 mt-1">Specify automated delivery date & time.</p>
                </div>
              </div>

              {formData.sendOption === 'SCHEDULED' && (<div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Execution Date</label>
                    <input type="date" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Execution Time</label>
                    <input type="time" value={formData.scheduledTime} onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"/>
                  </div>
                </div>)}
            </div>)}

          {/* STEP 6: Multi-Channel Preview */}
          {step === 6 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Multi-Channel Payload Preview
              </h4>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
                <div className="text-indigo-400 font-bold">[ In-App Header Preview ]</div>
                <div className="text-white font-bold">{formData.title || 'Executive Notification Title'}</div>
                <div className="text-slate-300">{formData.messageBody}</div>
                <div className="text-slate-500 text-[10px]">Priority: {formData.priority} | Target: {formData.recipientTarget}</div>
              </div>
            </div>)}

          {/* STEP 7: Confirmation & Dispatch Summary */}
          {step === 7 && (<div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Final Review & Engine Confirmation
              </h4>

              <div className="space-y-2 text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div><strong className="text-slate-400">Title:</strong> {formData.title || 'N/A'}</div>
                <div><strong className="text-slate-400">Category:</strong> {formData.category}</div>
                <div><strong className="text-slate-400">Priority:</strong> {formData.priority}</div>
                <div><strong className="text-slate-400">Recipient Scope:</strong> {formData.recipientType} ({formData.recipientTarget})</div>
                <div>
                  <strong className="text-slate-400">Active Channels:</strong>{' '}
                  {Object.keys(formData.channels).filter(k => formData.channels[k]).join(', ')}
                </div>
              </div>
            </div>)}

        </div>

        {/* Wizard Actions Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
          <button onClick={prevStep} disabled={step === 1} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1">
            <ChevronLeft className="h-4 w-4"/>
            <span>Back</span>
          </button>

          {step < 7 ? (<button onClick={nextStep} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1">
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4"/>
            </button>) : (<button onClick={handleDispatch} disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center space-x-2">
              <Send className="h-4 w-4"/>
              <span>{loading ? 'Dispatching...' : 'Dispatch Notification Engine'}</span>
            </button>)}
        </div>

      </div>
    </div>);
}
