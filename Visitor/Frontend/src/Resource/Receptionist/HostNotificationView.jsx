import React, { useState } from 'react';
import { Bell, Send, Mail, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
export default function HostNotificationView() {
    const [hostId, setHostId] = useState('');
    const [notificationType, setNotificationType] = useState('VISITOR_ARRIVED');
    const [customMsg, setCustomMsg] = useState('');
    const [channels, setChannels] = useState(['SYSTEM', 'EMAIL']);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const toggleChannel = (ch) => {
        if (channels.includes(ch)) {
            setChannels(channels.filter((c) => c !== ch));
        }
        else {
            setChannels([...channels, ch]);
        }
    };
    const handleSend = async (e) => {
        e.preventDefault();
        if (!hostId) {
            setMessage({ type: 'error', text: 'Host User ID is required.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const res = await api.post('/reception/notifications/send', {
                host_id: parseInt(hostId),
                notification_type: notificationType,
                message_custom: customMsg,
                channels,
            });
            setMessage({ type: 'success', text: res.data.message || 'Host notification dispatched successfully.' });
            setCustomMsg('');
        }
        catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to dispatch host notification.' });
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center space-x-2">
              <Bell className="h-6 w-6 text-amber-400"/>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Host Notification Dispatch</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dispatch multi-channel arrival notifications, walk-in approval alerts, and delay updates directly to host employees.
            </p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (<div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center space-x-2 text-xs font-bold">
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
        </div>)}

      {/* Dispatch Form */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto space-y-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Send className="h-4 w-4 text-amber-400"/>
          <span>Dispatch Host Alert</span>
        </h2>

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold uppercase mb-1">Host Employee User ID *</label>
            <input type="number" required placeholder="e.g. 2 (Sarah Johnson), 4 (Emily Davis)..." value={hostId} onChange={(e) => setHostId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"/>
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase mb-1">Notification Category</label>
            <select value={notificationType} onChange={(e) => setNotificationType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none">
              <option value="VISITOR_ARRIVED">Visitor Arrived at Lobby</option>
              <option value="WALK_IN_REQUEST">Walk-in Visitor Approval Needed</option>
              <option value="VISITOR_WAITING">Visitor Waiting Alert (&gt;15 mins)</option>
              <option value="APPOINTMENT_DELAY">Appointment Schedule Delay Notification</option>
              <option value="APPOINTMENT_CANCELLED">Appointment Cancelled Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase mb-1">Custom Message / Note (Optional)</label>
            <textarea rows={3} placeholder="Add optional notes for the host..." value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"/>
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase mb-2">Notification Delivery Channels</label>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => toggleChannel('SYSTEM')} className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase flex items-center gap-1.5 ${channels.includes('SYSTEM') ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                <Bell className="h-3.5 w-3.5"/>
                <span>System App Alert</span>
              </button>
              <button type="button" onClick={() => toggleChannel('EMAIL')} className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase flex items-center gap-1.5 ${channels.includes('EMAIL') ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                <Mail className="h-3.5 w-3.5"/>
                <span>Email Notification</span>
              </button>
              <button type="button" onClick={() => toggleChannel('SMS')} className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase flex items-center gap-1.5 ${channels.includes('SMS') ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                <Smartphone className="h-3.5 w-3.5"/>
                <span>SMS Alert</span>
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button type="submit" disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
              <Send className="h-4 w-4"/>
              <span>{loading ? 'Dispatching...' : 'Dispatch Notification Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>);
}
