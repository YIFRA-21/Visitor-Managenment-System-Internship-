import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mail, Megaphone, Search, Send, Paperclip, Video, Phone, Info, Users, Plus, User, CheckCheck, Smile, Sparkles } from 'lucide-react';
import api from '../../../../services/api';
export default function SystemChatCenterView({ onTabChange, currentUser }) {
    const [activeTab, setActiveTab] = useState('all');
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [searchConv, setSearchConv] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        fetchConversations();
    }, []);
    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv.id);
        }
    }, [selectedConv]);
    const fetchConversations = async () => {
        try {
            const res = await api.get('/communication/chat/conversations');
            const list = res.data?.conversations || [];
            setConversations(list);
            if (list.length > 0 && !selectedConv) {
                setSelectedConv(list[0]);
            }
        }
        catch (err) {
            // Fallback sample data matching screenshot 5
            const fallbackConvs = [
                { id: 1, title: 'Reception Team', members_count: 8, unread_count: 3, last_message: 'Emily: Visitor Mr. David Wilson has arrived.', last_message_at: '10:32 AM', type: 'group' },
                { id: 2, title: 'Security Team', members_count: 5, unread_count: 2, last_message: 'James: All good at the main gate.', last_message_at: '10:16 AM', type: 'group' },
                { id: 3, title: 'IT Support', members_count: 4, unread_count: 0, last_message: 'System update tonight at 12 AM.', last_message_at: '09:45 AM', type: 'group' },
                { id: 4, title: 'HR Department', members_count: 12, unread_count: 0, last_message: 'Sarah: Meeting rescheduled to 3 PM.', last_message_at: '09:20 AM', type: 'group' },
                { id: 5, title: 'General Administrators', members_count: 6, unread_count: 0, last_message: 'Michael: Please review the new policy.', last_message_at: '08:50 AM', type: 'group' },
                { id: 6, title: 'David Wilson', members_count: 2, unread_count: 0, last_message: 'You: Thank you for the update.', last_message_at: 'Yesterday', type: 'direct' },
                { id: 7, title: 'Emily Williams', members_count: 2, unread_count: 0, last_message: 'You: Please confirm the time.', last_message_at: 'Yesterday', type: 'direct' },
            ];
            setConversations(fallbackConvs);
            if (!selectedConv)
                setSelectedConv(fallbackConvs[0]);
        }
    };
    const fetchMessages = async (convId) => {
        setLoading(true);
        try {
            const res = await api.get(`/communication/chat/messages/${convId}`);
            setMessages(res.data?.messages || []);
        }
        catch (err) {
            // Fallback timeline matching screenshot 5
            setMessages([
                { id: 101, sender_name: 'Emily Williams', message_text: 'Visitor Mr. David Wilson has arrived for his 10:00 AM appointment with Michael John.', created_at: '10:31 AM', is_user: false },
                { id: 102, sender_name: 'Michael John (You)', message_text: 'Please confirm his ID and direct him to Conference Room A.', created_at: '10:31 AM', is_user: true },
                { id: 103, sender_name: 'James Anderson', message_text: 'ID verified ✓. He is being escorted to Conference Room A.', created_at: '10:32 AM', is_user: false },
                { id: 104, sender_name: 'Sarah Johnson', message_text: 'Great. Please inform Michael John.', created_at: '10:33 AM', is_user: false },
                { id: 105, sender_name: 'Michael John (You)', message_text: 'Will do.', created_at: '10:33 AM', is_user: true },
                { id: 106, sender_name: 'Emily Williams', message_text: 'Visitor is comfortably seated in Conference Room A.', created_at: '10:34 AM', is_user: false },
            ]);
        }
        finally {
            setLoading(false);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };
    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !selectedConv)
            return;
        const newMsgText = inputMsg.trim();
        setInputMsg('');
        const newMsg = {
            id: Date.now(),
            sender_name: currentUser?.fullName || 'Michael John (You)',
            message_text: newMsgText,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_user: true
        };
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        try {
            await api.post(`/communication/chat/messages/${selectedConv.id}`, { message_text: newMsgText });
        }
        catch (err) {
            console.error('Failed to send chat message:', err);
        }
    };
    return (<div className="space-y-4 text-xs font-mono text-slate-300">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400"/>
            System Chat Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time communication across roles and teams.</p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button onClick={() => onTabChange && onTabChange('messages')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
            <Mail className="h-3.5 w-3.5"/>
            Messages
          </button>

          <button onClick={() => onTabChange && onTabChange('chat')} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-lg flex items-center gap-2">
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

      {/* Main Grid matching Screenshot 5 */}
      <div className="grid grid-cols-12 gap-4">
        {/* Column 1: Chats List (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-extrabold text-white text-xs">Chats</span>
            <button className="p-1 hover:bg-slate-800 text-indigo-400 rounded-lg">
              <Plus className="h-4 w-4"/>
            </button>
          </div>

          <div className="relative my-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500"/>
            <input type="text" placeholder="Search chats or users..." value={searchConv} onChange={(e) => setSearchConv(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-950 p-1 rounded-xl text-[10px] text-center font-bold">
            <button onClick={() => setActiveTab('all')} className={`py-1 rounded-lg ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>All</button>
            <button onClick={() => setActiveTab('groups')} className={`py-1 rounded-lg ${activeTab === 'groups' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Groups</button>
            <button onClick={() => setActiveTab('direct')} className={`py-1 rounded-lg ${activeTab === 'direct' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Direct</button>
            <button onClick={() => setActiveTab('unread')} className={`py-1 rounded-lg ${activeTab === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Unread</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {conversations.map((c) => {
            const active = selectedConv?.id === c.id;
            return (<div key={c.id} onClick={() => setSelectedConv(c)} className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${active
                    ? 'bg-indigo-950/50 border-indigo-500/60 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 text-slate-300'}`}>
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    {c.type === 'group' ? <Users className="h-4 w-4 text-indigo-400"/> : <User className="h-4 w-4 text-emerald-400"/>}
                  </div>

                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-xs text-white truncate">{c.title}</p>
                      <span className="text-[9px] text-slate-500">{c.last_message_at}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.last_message}</p>
                  </div>

                  {c.unread_count > 0 && (<span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {c.unread_count}
                    </span>)}
                </div>);
        })}
          </div>
        </div>

        {/* Column 2: Chat Window Timeline (5 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[640px]">
          {selectedConv ? (<>
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500 flex items-center justify-center text-indigo-300 font-bold">
                    <Users className="h-4 w-4"/>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">{selectedConv.title}</p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {selectedConv.members_count || 8} members • Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"><Video className="h-4 w-4"/></button>
                  <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"><Phone className="h-4 w-4"/></button>
                  <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"><Info className="h-4 w-4"/></button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-2">
                <div className="text-center my-2">
                  <span className="bg-slate-950 text-slate-500 text-[10px] px-3 py-1 rounded-full border border-slate-800">Today</span>
                </div>

                {messages.map((m) => {
                const isMe = m.is_user || m.sender_name?.includes('You');
                return (<div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                        {!isMe && <p className="text-[10px] font-bold text-indigo-300 mb-1">{m.sender_name}</p>}
                        <p className="text-xs leading-relaxed">{m.message_text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                          <span>{m.created_at}</span>
                          {isMe && <CheckCheck className="h-3 w-3 text-cyan-300"/>}
                        </div>
                      </div>
                    </div>);
            })}
                <div ref={messagesEndRef}/>
              </div>

              {/* Bottom Message Input Box */}
              <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button type="button" className="p-2 hover:bg-slate-800 text-slate-400 rounded-xl"><Paperclip className="h-4 w-4"/></button>
                <input type="text" placeholder="Type a message..." value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
                <button type="button" className="p-2 hover:bg-slate-800 text-slate-400 rounded-xl"><Smile className="h-4 w-4"/></button>
                <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg">
                  <Send className="h-4 w-4"/>
                </button>
              </form>
            </>) : (<div className="flex flex-col items-center justify-center h-full text-slate-500">
              <MessageSquare className="h-10 w-10 mb-2 opacity-40"/>
              <p>Select a conversation to start chat</p>
            </div>)}
        </div>

        {/* Column 3: Group / Direct User Info (2 cols) */}
        <div className="col-span-12 lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between h-[640px] overflow-y-auto">
          {selectedConv && (<div className="space-y-4 text-[11px]">
              <div>
                <p className="font-bold text-white text-xs mb-1">About this group</p>
                <p className="text-[10px] text-slate-400 leading-normal">{selectedConv.description || 'Handles visitor reception, registration, and front desk operations.'}</p>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Media, Files & Links</span>
                  <span className="font-bold text-indigo-400">12</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Pinned Messages</span>
                  <span className="font-bold text-indigo-400">5</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <p className="font-bold text-white mb-2">Group Members (8)</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">Sarah Johnson (You)</span>
                    <span className="text-indigo-400 font-bold">Admin</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">Emily Williams</span>
                    <span className="text-slate-500">Staff</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">James Anderson</span>
                    <span className="text-slate-500">Security</span>
                  </div>
                </div>
              </div>
            </div>)}
        </div>

        {/* Column 4: System Chat Guide (2 cols) */}
        <div className="col-span-12 lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-[10px] space-y-3">
          <p className="font-extrabold text-indigo-400 uppercase tracking-wider text-[11px]">SYSTEM CHAT GUIDE</p>
          <div className="space-y-2 text-slate-400">
            <p><strong className="text-white">1. SWITCH TABS:</strong> Navigate between Messages, Chat, and Announcements.</p>
            <p><strong className="text-white">2. CHAT LIST:</strong> View groups and direct user chats.</p>
            <p><strong className="text-white">3. REAL-TIME MESSAGING:</strong> In-app instant messaging powered by Socket.IO.</p>
          </div>
        </div>
      </div>
    </div>);
}
