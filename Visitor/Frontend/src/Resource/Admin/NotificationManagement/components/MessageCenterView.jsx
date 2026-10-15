import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Megaphone, Search, Send, CheckCircle2, XCircle, Eye, Sparkles, FileText } from 'lucide-react';
import api from '../../../../services/api';
export default function MessageCenterView({ onTabChange, currentUser }) {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    // Compose State
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [channelEmail, setChannelEmail] = useState(true);
    const [channelSms, setChannelSms] = useState(false);
    const [channelApp, setChannelApp] = useState(true);
    const [priority, setPriority] = useState('medium');
    const [sending, setSending] = useState(false);
    useEffect(() => {
        fetchMessages();
    }, [filter]);
    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/communication/messages', { params: { filter, search: searchQuery } });
            const list = res.data?.messages || [];
            setMessages(list);
            if (list.length > 0 && !selectedMessage) {
                setSelectedMessage(list[0]);
            }
        }
        catch (err) {
            // Fallback sample data matching screenshot 4
            const fallbackList = [
                {
                    id: 1,
                    subject: 'New Appointment Request',
                    category: 'Appointment',
                    priority: 'medium',
                    sender_name: 'Sarah Johnson',
                    sender_email: 'sarah.johnson@globalsupplies.com',
                    sender_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                    company: 'Global Supplies Ltd.',
                    phone: '+251 911 123 456',
                    created_at: new Date().toISOString(),
                    is_read: false,
                    is_starred: true,
                    is_important: true,
                    details: {
                        visitPurpose: 'Business Discussion',
                        date: 'May 22, 2025 (Thursday)',
                        time: '10:00 AM - 11:00 AM',
                        meetingRoom: 'Conference Room A',
                        numberOfVisitors: 2,
                    },
                    body: 'Hello Michael,\n\nSarah Johnson from Global Supplies Ltd. has requested an appointment to meet with you. Please review the details and respond accordingly.\n\nThank you,\nVMS System',
                    attachments: [
                        { name: 'Visitor_Identity.pdf', size: '245 KB' },
                        { name: 'Business_Letter.jpg', size: '1.2 MB' },
                    ]
                },
                {
                    id: 2,
                    subject: 'Appointment Approved',
                    category: 'Appointment',
                    priority: 'medium',
                    sender_name: 'David Wilson',
                    created_at: new Date(Date.now() - 900000).toISOString(),
                    is_read: true,
                    body: 'Your appointment with David Wilson has been approved.'
                },
                {
                    id: 3,
                    subject: 'Visitor Checked-In',
                    category: 'Visitor',
                    priority: 'low',
                    sender_name: 'Emily Williams',
                    created_at: new Date(Date.now() - 2880000).toISOString(),
                    is_read: true,
                    body: 'Emily Williams has checked in for the appointment at 09:45 AM.'
                },
                {
                    id: 4,
                    subject: 'Visitor Pass Generated',
                    category: 'Pass',
                    priority: 'medium',
                    sender_name: 'System Engine',
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    is_read: true,
                    body: 'Visitor pass PASS-2025-8921 has been generated for Robert Brown.'
                }
            ];
            setMessages(fallbackList);
            if (!selectedMessage)
                setSelectedMessage(fallbackList[0]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !messageBody.trim())
            return;
        setSending(true);
        try {
            await api.post('/communication/messages', {
                recipient_role: recipient || 'employee',
                subject: subject.trim(),
                body: messageBody.trim(),
                priority,
                channel: channelApp ? 'in_app' : channelEmail ? 'email' : 'sms',
            });
            setSubject('');
            setMessageBody('');
            fetchMessages();
        }
        catch (err) {
            console.error('Send message error:', err);
        }
        finally {
            setSending(false);
        }
    };
    return (<div className="space-y-4 text-xs font-mono text-slate-300">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-400"/>
            Message Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage all your messages, chats, and announcements from one place.</p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button onClick={() => onTabChange && onTabChange('messages')} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-lg flex items-center gap-2">
            <Mail className="h-3.5 w-3.5"/>
            Messages
            <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded text-[10px]">12</span>
          </button>

          <button onClick={() => onTabChange && onTabChange('chat')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5"/>
            System Chat
          </button>

          <button onClick={() => onTabChange && onTabChange('announcements')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5"/>
            Announcements
          </button>

          <button onClick={() => onTabChange && onTabChange('center')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400"/>
            Notification Center
          </button>
        </div>
      </div>

      {/* Main 4-Column Grid matching Screenshot 4 */}
      <div className="grid grid-cols-12 gap-4">
        {/* Column 1: All Messages List (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-extrabold text-white text-xs">All Messages</span>
            <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">12 Unread</span>
          </div>

          <div className="relative my-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500"/>
            <input type="text" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-950 p-1 rounded-xl text-[10px] text-center font-bold">
            <button onClick={() => setFilter('all')} className={`py-1 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>All 56</button>
            <button onClick={() => setFilter('unread')} className={`py-1 rounded-lg ${filter === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Unread 12</button>
            <button onClick={() => setFilter('starred')} className={`py-1 rounded-lg ${filter === 'starred' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Starred 5</button>
            <button onClick={() => setFilter('important')} className={`py-1 rounded-lg ${filter === 'important' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Important 8</button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {messages.map((m) => {
            const active = selectedMessage?.id === m.id;
            return (<div key={m.id} onClick={() => setSelectedMessage(m)} className={`p-2.5 rounded-xl border transition-all cursor-pointer ${active
                    ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900 text-slate-300'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-white truncate max-w-[130px]">{m.sender_name || 'System Notice'}</span>
                    <span className="text-[9px] text-slate-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="font-bold text-[11px] text-indigo-300 truncate">{m.subject}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.body}</p>
                </div>);
        })}
          </div>
        </div>

        {/* Column 2: Message Details & Actions (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[640px] overflow-y-auto">
          {selectedMessage ? (<div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-black text-sm text-white">{selectedMessage.subject}</h3>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">{selectedMessage.category || 'Appointment'}</span>
              </div>

              {/* Sender Metadata */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <img src={selectedMessage.sender_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-indigo-500 shrink-0"/>
                <div className="flex-1 truncate">
                  <p className="font-bold text-xs text-white">{selectedMessage.sender_name}</p>
                  <p className="text-[10px] text-slate-400">{selectedMessage.company || 'External Organization'}</p>
                  <p className="text-[10px] text-indigo-400 font-mono">{selectedMessage.sender_email || 'sarah.johnson@globalsupplies.com'}</p>
                </div>
              </div>

              {/* Details Card */}
              {selectedMessage.details && (<div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <p className="font-bold text-xs text-indigo-300 mb-1">Appointment Details:</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className="text-slate-400">Visit Purpose:</span>
                    <span className="text-white font-bold">{selectedMessage.details.visitPurpose}</span>
                    <span className="text-slate-400">Date:</span>
                    <span className="text-white font-bold">{selectedMessage.details.date}</span>
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white font-bold">{selectedMessage.details.time}</span>
                    <span className="text-slate-400">Meeting Room:</span>
                    <span className="text-white font-bold">{selectedMessage.details.meetingRoom}</span>
                  </div>
                </div>)}

              {/* Body Text */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                {selectedMessage.body}
              </div>

              {/* Attachments */}
              {selectedMessage.attachments && (<div>
                  <p className="font-bold text-xs text-slate-400 mb-2">Attachments ({selectedMessage.attachments.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMessage.attachments.map((att, idx) => (<div key={idx} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <FileText className="h-5 w-5 text-indigo-400 shrink-0"/>
                        <div className="truncate text-[10px]">
                          <p className="font-bold text-white truncate">{att.name}</p>
                          <p className="text-slate-500">{att.size}</p>
                        </div>
                      </div>))}
                  </div>
                </div>)}

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg">
                  <CheckCircle2 className="h-4 w-4"/> Approve
                </button>
                <button className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg">
                  <XCircle className="h-4 w-4"/> Reject
                </button>
                <button className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                  <Eye className="h-4 w-4"/> View Details
                </button>
              </div>
            </div>) : (<div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Mail className="h-10 w-10 mb-2 opacity-40"/>
              <p>Select a message to view details</p>
            </div>)}
        </div>

        {/* Column 3: Compose New Message (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[640px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-extrabold text-white text-xs">Compose New Message</span>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">To *</label>
                <input type="text" placeholder="Select user, role or department..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Subject *</label>
                <input type="text" placeholder="Enter subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Channel</label>
                <div className="grid grid-cols-3 gap-1">
                  <button type="button" onClick={() => setChannelEmail(!channelEmail)} className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${channelEmail ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    Email
                  </button>
                  <button type="button" onClick={() => setChannelSms(!channelSms)} className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${channelSms ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    SMS
                  </button>
                  <button type="button" onClick={() => setChannelApp(!channelApp)} className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${channelApp ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    In-App
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Message *</label>
                <textarea rows={4} placeholder="Type your message here..." value={messageBody} onChange={(e) => setMessageBody(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
              </div>

              <button type="submit" disabled={sending} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5">
                <Send className="h-4 w-4"/> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* Column 4: Message Center Parts Guide (2 cols) */}
        <div className="col-span-12 lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-[10px] space-y-3">
          <p className="font-extrabold text-indigo-400 uppercase tracking-wider text-[11px]">MESSAGE CENTER PARTS GUIDE</p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">1</span>
              <div>
                <p className="font-bold text-white">TOP TABS</p>
                <p className="text-slate-400">Switch between Messages, System Chat, and Announcements.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">2</span>
              <div>
                <p className="font-bold text-white">MESSAGE LIST</p>
                <p className="text-slate-400">Displays all messages with filters for easy access.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">3</span>
              <div>
                <p className="font-bold text-white">MESSAGE PREVIEW</p>
                <p className="text-slate-400">Shows selected message content, details, and attachments.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">4</span>
              <div>
                <p className="font-bold text-white">ACTIONS & RESPONSES</p>
                <p className="text-slate-400">Approve, reject, or reply directly to the sender.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
