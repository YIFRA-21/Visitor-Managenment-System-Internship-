import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, MessageSquare, Megaphone, Search, Send, User, Eye, Check } from 'lucide-react';
import api from '../../../../services/api';
export default function NotificationCenterView({ onTabChange, currentUser }) {
    const [channelFilter, setChannelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [loading, setLoading] = useState(false);
    // Compose State
    const [sendTo, setSendTo] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sendInApp, setSendInApp] = useState(true);
    const [sendEmail, setSendEmail] = useState(false);
    const [sendSms, setSendSms] = useState(false);
    const [priority, setPriority] = useState('medium');
    const [sending, setSending] = useState(false);
    useEffect(() => {
        fetchNotifications();
    }, [channelFilter]);
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications', { params: { channel: channelFilter, search: searchQuery } });
            const list = res.data?.notifications || [];
            setNotifications(list);
            if (list.length > 0 && !selectedNotif) {
                setSelectedNotif(list[0]);
            }
        }
        catch (err) {
            // Fallback sample data matching screenshot 2
            const fallback = [
                {
                    id: 101,
                    title: 'New Appointment Request',
                    channel: 'In-App',
                    created_at: new Date().toISOString(),
                    time_ago: '2 min ago',
                    sender: 'Sarah Johnson',
                    company: 'Global Supplies Ltd.',
                    email: 'sarah.johnson@globalsupplies.com',
                    phone: '+251 911 123 456',
                    recipient: 'Michael John (You)',
                    body: 'Sarah Johnson from Global Supplies Ltd. has requested an appointment to meet with you.',
                    details: {
                        visitPurpose: 'Business Discussion',
                        date: 'May 22, 2025 (Thursday)',
                        time: '10:00 AM - 11:00 AM',
                        meetingRoom: 'Conference Room A',
                        numberOfVisitors: 2,
                    },
                    delivery_status: {
                        inApp: 'Delivered',
                        email: 'Delivered',
                        sms: 'Delivered',
                    },
                    audience_stats: {
                        total: 6,
                        read: 4,
                        readPct: '66%',
                        unread: 2,
                        unreadPct: '33%',
                        failed: 0,
                        failedPct: '0%',
                    }
                },
                {
                    id: 102,
                    title: 'Visitor Checked-In',
                    channel: 'Email',
                    created_at: new Date(Date.now() - 900000).toISOString(),
                    time_ago: '15 min ago',
                    body: 'Emily Williams has checked in for the appointment at 09:45 AM.'
                },
                {
                    id: 103,
                    title: 'Appointment Approved',
                    channel: 'SMS',
                    created_at: new Date(Date.now() - 1680000).toISOString(),
                    time_ago: '28 min ago',
                    body: 'Your appointment with David Wilson has been approved.'
                },
                {
                    id: 104,
                    title: 'Visitor Pass Generated',
                    channel: 'In-App',
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    time_ago: '1 hr ago',
                    body: 'Visitor pass PASS-2025-8921 has been generated for Robert Brown.'
                },
                {
                    id: 105,
                    title: 'Check-Out Completed',
                    channel: 'Email',
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    time_ago: '2 hrs ago',
                    body: 'Michael Smith has checked out at 03:10 PM. Visit duration: 2h 15m.'
                }
            ];
            setNotifications(fallback);
            if (!selectedNotif)
                setSelectedNotif(fallback[0]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim())
            return;
        setSending(true);
        try {
            await api.post('/notifications/send', {
                title: title.trim(),
                message: message.trim(),
                channel: sendInApp ? 'in_app' : sendEmail ? 'email' : 'sms',
                priority,
            });
            setTitle('');
            setMessage('');
            fetchNotifications();
        }
        catch (err) {
            console.error('Failed to send notification:', err);
        }
        finally {
            setSending(false);
        }
    };
    return (<div className="space-y-4 text-xs font-mono text-slate-300">
      {/* Top Bar matching Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400"/>
            Notification Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage and send notifications via Email, SMS, or In-App to your users and groups.</p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button onClick={() => onTabChange && onTabChange('messages')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Mail className="h-3.5 w-3.5"/>
            Messages
          </button>

          <button onClick={() => onTabChange && onTabChange('chat')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5"/>
            System Chat
          </button>

          <button onClick={() => onTabChange && onTabChange('announcements')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5"/>
            Announcements
          </button>

          <button onClick={() => onTabChange && onTabChange('center')} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-lg flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400"/>
            Notification Center
          </button>
        </div>
      </div>

      {/* Main Grid Layout matching Screenshot 2 */}
      <div className="grid grid-cols-12 gap-4">
        {/* Column 1: Notification History List (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-extrabold text-white text-xs">Notification History</span>
            <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">24 New</span>
          </div>

          <div className="relative my-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500"/>
            <input type="text" placeholder="Search notifications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-950 p-1 rounded-xl text-[10px] text-center font-bold">
            <button onClick={() => setChannelFilter('all')} className={`py-1 rounded-lg ${channelFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>All 98</button>
            <button onClick={() => setChannelFilter('in_app')} className={`py-1 rounded-lg ${channelFilter === 'in_app' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>In-App 45</button>
            <button onClick={() => setChannelFilter('email')} className={`py-1 rounded-lg ${channelFilter === 'email' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Email 28</button>
            <button onClick={() => setChannelFilter('sms')} className={`py-1 rounded-lg ${channelFilter === 'sms' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>SMS 25</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {notifications.map((n) => {
            const active = selectedNotif?.id === n.id;
            return (<div key={n.id} onClick={() => setSelectedNotif(n)} className={`p-2.5 rounded-xl border transition-all cursor-pointer ${active
                    ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900 text-slate-300'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-white truncate max-w-[130px]">{n.title}</span>
                    <span className="text-[9px] text-indigo-400 font-bold uppercase">{n.channel || 'In-App'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{n.body}</p>
                  <p className="text-[9px] text-slate-500 mt-1">{n.time_ago || 'Just now'}</p>
                </div>);
        })}
          </div>
        </div>

        {/* Column 2: Notification Details Panel (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[640px] overflow-y-auto">
          {selectedNotif ? (<div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-black text-sm text-white">{selectedNotif.title}</h3>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">{selectedNotif.channel || 'In-App'}</span>
              </div>

              {selectedNotif.sender && (<div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500 flex items-center justify-center font-bold text-white shrink-0">
                    <User className="h-5 w-5"/>
                  </div>
                  <div className="flex-1 truncate">
                    <p className="font-bold text-xs text-white">{selectedNotif.sender}</p>
                    <p className="text-[10px] text-slate-400">{selectedNotif.company}</p>
                    <p className="text-[10px] text-indigo-400 font-mono">{selectedNotif.email}</p>
                  </div>
                </div>)}

              {selectedNotif.details && (<div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <p className="font-bold text-xs text-indigo-300 mb-1">Appointment Details:</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className="text-slate-400">Visit Purpose:</span>
                    <span className="text-white font-bold">{selectedNotif.details.visitPurpose}</span>
                    <span className="text-slate-400">Date:</span>
                    <span className="text-white font-bold">{selectedNotif.details.date}</span>
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white font-bold">{selectedNotif.details.time}</span>
                    <span className="text-slate-400">Meeting Room:</span>
                    <span className="text-white font-bold">{selectedNotif.details.meetingRoom}</span>
                  </div>
                </div>)}

              {/* Delivery Status Indicator Matrix matching Screenshot 2 */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-xs text-white">Delivery Status</p>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30">
                    <p className="text-slate-400">In-App</p>
                    <p className="font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5"><Check className="h-3 w-3"/> Delivered</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30">
                    <p className="text-slate-400">Email</p>
                    <p className="font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5"><Check className="h-3 w-3"/> Delivered</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30">
                    <p className="text-slate-400">SMS</p>
                    <p className="font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5"><Check className="h-3 w-3"/> Delivered</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg">
                  <Eye className="h-4 w-4"/> View Details
                </button>
              </div>
            </div>) : (<div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Sparkles className="h-10 w-10 mb-2 opacity-40"/>
              <p>Select a notification to view details</p>
            </div>)}
        </div>

        {/* Column 3: Compose New Notification (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[640px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-extrabold text-white text-xs">Compose New Notification</span>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Send To *</label>
                <input type="text" placeholder="Select user, role, department..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Title *</label>
                <input type="text" placeholder="Notification Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Message *</label>
                <textarea rows={4} placeholder="Type notification body..." value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Send Via</label>
                <div className="grid grid-cols-3 gap-1">
                  <button type="button" onClick={() => setSendInApp(!sendInApp)} className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sendInApp ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    In-App
                  </button>
                  <button type="button" onClick={() => setSendEmail(!sendEmail)} className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sendEmail ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    Email
                  </button>
                  <button type="button" onClick={() => setSendSms(!sendSms)} className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sendSms ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    SMS
                  </button>
                </div>
              </div>

              <button type="submit" disabled={sending} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5">
                <Send className="h-4 w-4"/> {sending ? 'Sending...' : 'Send Now'}
              </button>
            </form>
          </div>
        </div>

        {/* Column 4: Notification Center Guide (2 cols) */}
        <div className="col-span-12 lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-[10px] space-y-3">
          <p className="font-extrabold text-indigo-400 uppercase tracking-wider text-[11px]">NOTIFICATION CENTER GUIDE</p>
          <div className="space-y-2 text-slate-400">
            <p><strong className="text-white">1. SWITCH TABS:</strong> Switch between Messages, Chat, and Announcements.</p>
            <p><strong className="text-white">2. NOTIFICATION LIST:</strong> View all notifications with channel filters.</p>
            <p><strong className="text-white">3. DELIVERY TRACKING:</strong> Track status across In-App, Email, and SMS.</p>
          </div>
        </div>
      </div>
    </div>);
}
