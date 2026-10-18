import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Send, Search, ChevronRight, Calendar, MessageSquare, FileText, Megaphone, Mail, User, Users, Paperclip, Download, X, Plus, CheckCircle2, Sparkles, Smile, Shield, CornerUpLeft, Forward, Trash2, Edit3, UserCheck, ArrowLeft, ShieldCheck } from 'lucide-react';
import { employeeNotificationApi } from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
// Initial Stored Chat Messages History for Each Unique Channel
const INITIAL_CHAT_HISTORIES = {
    201: [
        {
            id: 1,
            thread_id: 201,
            sender_id: 2,
            sender_role: 'admin',
            recipient_id: 1,
            recipient_role: 'employee',
            body: 'Tanks you!!!',
            is_read: true,
            created_at: '2026-08-08 21:05:34',
            sender_name: 'Abebe Kebede'
        },
        {
            id: 2,
            thread_id: 201,
            sender_id: 1,
            sender_role: 'employee',
            recipient_id: 2,
            recipient_role: 'admin',
            body: '😊',
            is_read: true,
            created_at: '01:25 AM',
            sender_name: 'Michael John (You)'
        }
    ],
    202: [
        {
            id: 101,
            thread_id: 202,
            sender_id: 5,
            sender_role: 'receptionist',
            recipient_id: 1,
            recipient_role: 'employee',
            body: 'Visitor Mr. David Wilson from IT Park has arrived at Reception Desk A.',
            is_read: true,
            created_at: '10:30 AM',
            sender_name: 'Emily Williams (Reception)'
        },
        {
            id: 102,
            thread_id: 202,
            sender_id: 5,
            sender_role: 'receptionist',
            recipient_id: 1,
            recipient_role: 'employee',
            body: 'Please confirm if you are ready to receive him in Executive Room 3B.',
            is_read: true,
            created_at: '10:31 AM',
            sender_name: 'Emily Williams (Reception)'
        },
        {
            id: 103,
            thread_id: 202,
            sender_id: 1,
            sender_role: 'employee',
            recipient_id: 5,
            recipient_role: 'receptionist',
            body: 'Thank you Emily, I am heading down to reception now.',
            is_read: true,
            created_at: '10:32 AM',
            sender_name: 'Michael John (You)'
        }
    ],
    203: [
        {
            id: 201,
            thread_id: 203,
            sender_id: 6,
            sender_role: 'security',
            recipient_id: 1,
            recipient_role: 'employee',
            body: 'Gate 1 access log verified for visitor vehicle #AA-9821.',
            is_read: true,
            created_at: '10:14 AM',
            sender_name: 'James Anderson (Security)'
        },
        {
            id: 202,
            thread_id: 203,
            sender_id: 6,
            sender_role: 'security',
            recipient_id: 1,
            recipient_role: 'employee',
            body: 'All clear at the main entrance gate.',
            is_read: true,
            created_at: '10:16 AM',
            sender_name: 'James Anderson (Security)'
        }
    ],
    204: [
        {
            id: 301,
            thread_id: 204,
            sender_id: 7,
            sender_role: 'admin',
            recipient_id: 1,
            recipient_role: 'employee',
            body: 'Notice: Scheduled VMS system update tonight from 12:00 AM to 01:00 AM.',
            is_read: true,
            created_at: '09:45 AM',
            sender_name: 'IT Support Team'
        },
        {
            id: 302,
            thread_id: 204,
            sender_id: 1,
            sender_role: 'employee',
            recipient_id: 7,
            recipient_role: 'admin',
            body: 'Understood, thank you for the advance notice.',
            is_read: true,
            created_at: '09:48 AM',
            sender_name: 'Michael John (You)'
        }
    ]
};
export default function EmployeeNotifications({ initialTab }) {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Toast alert system routed to global notification
    const showToast = (text, type = 'success') => {
        showNotification(text, type);
    };
    // Primary Tab state: 'messages' | 'chat' | 'announcements'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || initialTab || 'messages');
    // Messages Tab Drilldown Steps
    const [msgStep, setMsgStep] = useState('list');
    // FULL PAGE PROFILE DETAILS OVERLAY STATE (WHEN PROFILE AVATAR IS CLICKED)
    const [showFullProfilePage, setShowFullProfilePage] = useState(false);
    // Dropdown Overlays & Actions
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showKebabMenu, setShowKebabMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    // REPLIES & EDITS STATE
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMsgId, setEditingMsgId] = useState(null);
    // Hidden File Input Ref
    const fileInputRef = useRef(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['messages', 'chat', 'announcements'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);
    // Messages List states & filters
    const [messageFilter, setMessageFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotifId, setSelectedNotifId] = useState(null);
    // Data states
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    // Threads state with unread counts
    const [threads, setThreads] = useState([
        {
            id: 201,
            visitor_id: 1,
            recipient_id: 1,
            recipient_role: 'admin',
            subject: 'Girume Admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recipient_name: 'Girume Admin',
            recipient_email: 'admin@vms.com',
            last_message_body: 'You: 😊',
            last_message_time: 'Just now',
            unread_count: 0,
            is_group: false,
            member_count: 2
        },
        {
            id: 202,
            visitor_id: 2,
            recipient_id: 2,
            recipient_role: 'receptionist',
            subject: 'Reception Team',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recipient_name: 'Reception Team',
            recipient_email: 'reception@vms.com',
            last_message_body: 'Emily: Visitor Mr. David Wilson has arrived.',
            last_message_time: '10:32 AM',
            unread_count: 3,
            is_group: true,
            member_count: 8,
            members: [
                { name: 'Sarah Johnson (You)', role: 'Host Employee', online: true, email: 'sarah@vms.com' },
                { name: 'Emily Williams', role: 'Reception Officer', online: true, email: 'emily@vms.com' },
                { name: 'James Anderson', role: 'Security Officer', online: true, email: 'james@vms.com' },
                { name: 'Michael John', role: 'System Admin', online: true, email: 'michael@vms.com' },
                { name: 'David Wilson', role: 'Guest Visitor', online: false, email: 'david@itpark.et' }
            ]
        },
        {
            id: 203,
            visitor_id: 3,
            recipient_id: 3,
            recipient_role: 'security',
            subject: 'Security Team',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recipient_name: 'Security Team',
            recipient_email: 'security@vms.com',
            last_message_body: 'James: All good at the main gate.',
            last_message_time: '10:16 AM',
            unread_count: 2,
            is_group: true,
            member_count: 5
        },
        {
            id: 204,
            visitor_id: 4,
            recipient_id: 4,
            recipient_role: 'admin',
            subject: 'IT Support',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recipient_name: 'IT Support',
            recipient_email: 'itsupport@vms.com',
            last_message_body: 'System update tonight at 12 AM.',
            last_message_time: '09:45 AM',
            unread_count: 0,
            is_group: true,
            member_count: 6
        }
    ]);
    const [activeThreadId, setActiveThreadId] = useState(201);
    const [chatFilter, setChatFilter] = useState('all');
    const [chatSearch, setChatSearch] = useState('');
    // PERMANENT DEDICATED STORED CHAT HISTORIES PER THREAD ID
    const [messagesByThread, setMessagesByThread] = useState(INITIAL_CHAT_HISTORIES);
    const [newMessageText, setNewMessageText] = useState('');
    const [contacts, setContacts] = useState([]);
    // Compose Modal State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeRecipientId, setComposeRecipientId] = useState(null);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    // Forward Modal State
    const [isForwardOpen, setIsForwardOpen] = useState(false);
    const [forwardEmail, setForwardEmail] = useState('');
    const [forwardingMsgText, setForwardingMsgText] = useState('');
    // Announcements state
    const [announcements, setAnnouncements] = useState([]);
    const messageEndRef = useRef(null);
    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    // ==========================================
    // DATA INITIALIZATION & FALLBACKS
    // ==========================================
    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await employeeNotificationApi.getNotifications({});
            const fetched = res.data?.notifications || res.data || [];
            if (Array.isArray(fetched)) {
                setNotifications(fetched);
                if (fetched.length > 0 && !selectedNotifId)
                    setSelectedNotifId(fetched[0].id);
            }
            else {
                setNotifications([]);
            }
        }
        catch {
            setNotifications([]);
        }
        finally {
            setLoading(false);
        }
    }, [selectedNotifId]);
    const loadAnnouncements = useCallback(async () => {
        try {
            const res = await employeeNotificationApi.getAnnouncements();
            setAnnouncements(res.data || []);
        }
        catch {
            setAnnouncements([
                { id: 1, title: 'Annual Security Clearance Audit on Friday', content: 'All employee hosts must complete annual visitor protocol compliance verification by Friday.', type: 'Important', date: 'Today' },
                { id: 2, title: 'New Visitor ID Kiosk Operational at Lobby B', content: 'Lobby B digital pass scanners are now fully operational.', type: 'Update', date: 'Yesterday' }
            ]);
        }
    }, []);
    const loadContacts = useCallback(async () => {
        try {
            const res = await employeeNotificationApi.getAuthorizedContacts();
            setContacts(res.data || []);
        }
        catch {
            setContacts([
                { id: 1, full_name: 'Girume Admin', email: 'admin@vms.com', role_type: 'admin', role_label: 'System Admin' },
                { id: 2, full_name: 'Sarah Connor (Reception Desk)', email: 'reception@vms.com', role_type: 'receptionist', role_label: 'Reception Officer' },
                { id: 3, full_name: 'Officer Davis (Security)', email: 'security@vms.com', role_type: 'security', role_label: 'Security Officer' },
                { id: 4, full_name: 'Dr. Evelyn Carter', email: 'evelyn@itpark.et', role_type: 'visitor', role_label: 'Guest Visitor' },
            ]);
        }
    }, []);
    useEffect(() => {
        loadNotifications();
        loadAnnouncements();
        loadContacts();
    }, [loadNotifications, loadAnnouncements, loadContacts]);
    // ==========================================
    // HANDLERS FOR CHANNEL SELECT (AUTO REMOVE UNREAD BADGE COUNT & STORE CHAT)
    // ==========================================
    const handleSelectThread = (threadId, threadName) => {
        setActiveThreadId(threadId);
        setReplyingTo(null);
        setEditingMsgId(null);
        setNewMessageText('');
        // AUTOMATICALLY REMOVE UNREAD BADGE COUNT TO 0
        setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, unread_count: 0 } : t)));
        showToast(`Opened ${threadName || 'Channel'} • Unread cleared!`, 'info');
        setTimeout(scrollToBottom, 100);
    };
    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true, status: 'read' })));
        setThreads(prev => prev.map(t => ({ ...t, unread_count: 0 })));
        showToast('All notifications and chat badges cleared!', 'success');
    };
    const handleRefreshData = async () => {
        await loadNotifications();
        await loadAnnouncements();
        showToast('Refreshed live data!', 'info');
    };
    // SEND OR EDIT MESSAGE (SAVES PERMANENTLY IN THIS CHANNEL'S CHAT HISTORY)
    const handleSendMessage = async () => {
        if (!newMessageText.trim() || !activeThreadId)
            return;
        if (editingMsgId) {
            // EDIT EXISTING MESSAGE IN PLACE
            setMessagesByThread(prev => ({
                ...prev,
                [activeThreadId]: (prev[activeThreadId] || []).map(m => m.id === editingMsgId ? { ...m, body: newMessageText, isEdited: true } : m)
            }));
            showToast('Message edited successfully!', 'success');
            setEditingMsgId(null);
            setNewMessageText('');
            return;
        }
        const currentHistory = messagesByThread[activeThreadId] || [];
        const newMsg = {
            id: Date.now(),
            thread_id: activeThreadId,
            sender_id: 1,
            sender_role: 'employee',
            recipient_id: 2,
            recipient_role: 'admin',
            body: newMessageText,
            is_read: true,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender_name: 'Michael John (You)',
            replyTo: replyingTo ? { sender_name: replyingTo.sender_name || 'User', body: replyingTo.body } : undefined
        };
        // UPDATE DEDICATED STORED CHAT HISTORY
        setMessagesByThread(prev => ({
            ...prev,
            [activeThreadId]: [...currentHistory, newMsg]
        }));
        // UPDATE LAST MESSAGE SUMMARY IN SIDEBAR THREAD
        setThreads(prev => prev.map(t => t.id === activeThreadId
            ? { ...t, last_message_body: `You: ${newMessageText}`, last_message_time: 'Just now', unread_count: 0 }
            : t));
        setNewMessageText('');
        setReplyingTo(null);
        setTimeout(scrollToBottom, 100);
    };
    // MESSAGE ACTIONS: DELETE, EDIT, REPLY, FORWARD
    const handleDeleteMessage = (msgId) => {
        setMessagesByThread(prev => ({
            ...prev,
            [activeThreadId]: (prev[activeThreadId] || []).filter(m => m.id !== msgId)
        }));
        showToast('Message deleted from channel history.', 'warning');
    };
    const handleStartEditMessage = (msg) => {
        setEditingMsgId(msg.id);
        setNewMessageText(msg.body);
        setReplyingTo(null);
        showToast('Editing message... update text and hit Send.', 'info');
    };
    const handleStartReplyMessage = (msg) => {
        setReplyingTo(msg);
        setEditingMsgId(null);
        showToast(`Replying to ${msg.sender_name}...`, 'info');
    };
    const handleStartForwardMessage = (msg) => {
        setForwardingMsgText(msg.body);
        setIsForwardOpen(true);
    };
    // REAL PHOTO & DOCUMENT FILE SELECTION ATTACHMENT HANDLER
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeThreadId)
            return;
        const isImage = file.type.startsWith('image/');
        const fileUrl = URL.createObjectURL(file);
        const fileSizeStr = `${(file.size / 1024).toFixed(1)} KB`;
        const attachment = {
            name: file.name,
            size: fileSizeStr,
            type: isImage ? 'image' : 'document',
            url: fileUrl
        };
        const currentHistory = messagesByThread[activeThreadId] || [];
        const newMsg = {
            id: Date.now(),
            thread_id: activeThreadId,
            sender_id: 1,
            sender_role: 'employee',
            recipient_id: 2,
            recipient_role: 'admin',
            body: isImage ? `Sent a photo: ${file.name}` : `Attached document: ${file.name}`,
            is_read: true,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender_name: 'Michael John (You)',
            attachment: attachment
        };
        setMessagesByThread(prev => ({
            ...prev,
            [activeThreadId]: [...currentHistory, newMsg]
        }));
        setThreads(prev => prev.map(t => t.id === activeThreadId
            ? { ...t, last_message_body: `Attachment: ${file.name}`, last_message_time: 'Just now', unread_count: 0 }
            : t));
        showToast(`Attached ${file.name} successfully!`, 'success');
        setTimeout(scrollToBottom, 100);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const handleSendForwardMessage = () => {
        if (!forwardEmail.trim())
            return;
        showToast(`Message forwarded to ${forwardEmail}!`, 'success');
        setForwardEmail('');
        setIsForwardOpen(false);
    };
    const handleCreateNewThread = async () => {
        if (!composeBody.trim())
            return;
        const targetRecipientId = composeRecipientId || (contacts.length > 0 ? contacts[0].id : 1);
        const recipient = contacts.find((c) => c.id === targetRecipientId);
        const recipientName = recipient ? `${recipient.full_name}` : 'Girume Admin';
        const newThreadId = Date.now();
        const newThread = {
            id: newThreadId,
            visitor_id: 1,
            recipient_id: targetRecipientId,
            recipient_role: recipient?.role_type || 'admin',
            subject: composeSubject || 'Direct Communication Inquiry',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recipient_name: recipientName,
            last_message_body: composeBody,
            last_message_time: 'Just now',
            unread_count: 0
        };
        const newMsg = {
            id: Date.now() + 1,
            thread_id: newThreadId,
            sender_id: 1,
            sender_role: 'employee',
            recipient_id: targetRecipientId,
            recipient_role: recipient?.role_type || 'admin',
            body: composeBody,
            is_read: true,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender_name: 'Michael John (You)'
        };
        setThreads(prev => [newThread, ...prev]);
        setMessagesByThread(prev => ({ ...prev, [newThreadId]: [newMsg] }));
        setActiveThreadId(newThreadId);
        setIsComposeOpen(false);
        setComposeSubject('');
        setComposeBody('');
        setActiveTab('chat');
        showToast('New communication thread created!', 'success');
    };
    const handleNotifClick = (id) => {
        setSelectedNotifId(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setMsgStep('detail');
    };
    // Filtered notifications
    const filteredNotifs = notifications.filter(n => {
        if (messageFilter === 'unread' && n.is_read)
            return false;
        if (messageFilter === 'starred' && !n.is_starred)
            return false;
        if (messageFilter === 'important' && !n.is_important)
            return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (n.title.toLowerCase().includes(q) ||
                n.message.toLowerCase().includes(q) ||
                (n.sender_name && n.sender_name.toLowerCase().includes(q)));
        }
        return true;
    });
    // Filtered threads for chat
    const filteredThreads = threads.filter(t => {
        if (chatFilter === 'groups' && !t.is_group)
            return false;
        if (chatFilter === 'direct' && t.is_group)
            return false;
        if (chatSearch.trim()) {
            const q = chatSearch.toLowerCase();
            return ((t.recipient_name && t.recipient_name.toLowerCase().includes(q)) ||
                (t.last_message_body && t.last_message_body.toLowerCase().includes(q)));
        }
        return true;
    });
    const selectedNotif = notifications.find(n => n.id === selectedNotifId) || notifications[0];
    const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
    const currentMessages = messagesByThread[activeThreadId] || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const getCategoryIcon = (type) => {
        switch (type) {
            case 'APPOINTMENT_REQUEST': return <Calendar className="h-5 w-5 text-blue-400"/>;
            case 'APPOINTMENT_APPROVED': return <CheckCircle2 className="h-5 w-5 text-emerald-400"/>;
            case 'VISITOR_CHECKED_IN': return <UserCheck className="h-5 w-5 text-amber-400"/>;
            case 'PASS_GENERATED': return <Shield className="h-5 w-5 text-purple-400"/>;
            default: return <Bell className="h-5 w-5 text-indigo-400"/>;
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans relative">
      {/* Hidden Working File Input for Real Photos/Docs Upload */}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.png,.jpg" className="hidden"/>

      {/* Toast Alert Banner */}
      {toastMsg && (<div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center space-x-3 transition-all animate-bounce ${toastMsg.type === 'success'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                : toastMsg.type === 'warning'
                    ? 'bg-rose-950 border-rose-500 text-rose-200'
                    : 'bg-blue-950 border-blue-500 text-blue-200'}`}>
          <Sparkles className="h-5 w-5 shrink-0"/>
          <span className="text-xs font-bold">{toastMsg.text}</span>
        </div>)}



      {/* Top Pill Sub-Navigation Bar */}
      <div className="flex items-center space-x-3 bg-slate-900/80 p-1.5 border border-slate-800 rounded-2xl w-fit">
        <button onClick={() => {
            setActiveTab('messages');
            setMsgStep('list');
        }} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'messages'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Mail className="h-4 w-4"/>
          <span>Messages</span>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded-full border border-blue-400/30 font-bold">
            {unreadCount}
          </span>
        </button>

        <button onClick={() => setActiveTab('chat')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'chat'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <MessageSquare className="h-4 w-4"/>
          <span>System Chat</span>
        </button>

        <button onClick={() => setActiveTab('announcements')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'announcements'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Megaphone className="h-4 w-4"/>
          <span>Announcements</span>
        </button>
      </div>

      {/* TAB 1: MESSAGES LIST & DRILLDOWN */}
      {activeTab === 'messages' && (<div className="w-full">
          {msgStep === 'list' && (<div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">All Notification Messages</h3>
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-black rounded-full">
                    {unreadCount} Unread
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {filteredNotifs.map((n) => (<div key={n.id} onClick={() => handleNotifClick(n.id)} className="p-4 border border-slate-800 bg-slate-950/70 rounded-2xl transition-all cursor-pointer flex items-center justify-between group">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                        {getCategoryIcon(n.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">{n.title}</h4>
                        <p className="text-xs text-slate-400 truncate max-w-2xl">{n.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">{n.reference_number}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white"/>
                    </div>
                  </div>))}
              </div>
            </div>)}

          {msgStep === 'detail' && selectedNotif && (<div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <button onClick={() => setMsgStep('list')} className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4 text-blue-400"/>
                  <span>Back to All Messages</span>
                </button>
              </div>
              <h2 className="text-xl font-black text-white">{selectedNotif.title}</h2>
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-300 leading-relaxed">
                {selectedNotif.message}
              </div>
            </div>)}
        </div>)}

      {/* ========================================== */}
      {/* TAB 2: SYSTEM CHAT (PER-CHANNEL CHAT HISTORY, AUTO UNREAD BADGE CLEARING, MESSAGE ACTIONS, FULL PAGE PROFILE REDIRECT) */}
      {/* ========================================== */}
      {activeTab === 'chat' && (<div className="w-full bg-[#1e293b] border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[680px]">
          {/* LEFT CHANNELS SIDEBAR: SLATE BLUE (#1e293b) WITH BOLD RIGHT DIVIDER */}
          <div className="w-full md:w-80 lg:w-96 shrink-0 border-b md:border-b-0 md:border-r-2 border-slate-700 bg-[#1e293b] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">System Chat Channels</h3>
                <button onClick={() => setIsComposeOpen(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1 active:scale-95">
                  <Plus className="h-3.5 w-3.5"/>
                  <span>New Chat</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400"/>
                <input type="text" placeholder={t('chat.search_channels', 'Search channels...')} value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"/>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5">
                {['all', 'groups', 'direct'].map((f) => (<button key={f} onClick={() => setChatFilter(f)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${chatFilter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-[#0f172a] text-slate-300 border border-slate-700/80 hover:text-white'}`}>
                    {f}
                  </button>))}
              </div>

              {/* Chat Thread Cards List (AUTOMATIC UNREAD BADGE REMOVAL & UNIQUE STORED CHAT SELECTION) */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredThreads.map((t) => {
                const isActive = t.id === activeThreadId;
                return (<div key={t.id} onClick={() => handleSelectThread(t.id, t.recipient_name)} className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-center space-x-3 ${isActive
                        ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-xl shadow-blue-600/40'
                        : 'bg-[#0f172a] border border-slate-700/60 hover:bg-[#334155] text-slate-200'}`}>
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${isActive ? 'bg-white text-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                        {t.is_group ? <Users className="h-5 w-5"/> : (t.recipient_name || 'U').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-100'}`}>{t.recipient_name}</h4>
                          <span className={`text-[10px] font-mono shrink-0 ml-1 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{t.last_message_time || '10:32 AM'}</span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{t.last_message_body}</p>
                      </div>
                      {/* UNREAD BADGE COUNT AUTOMATICALLY REMOVED (reset to 0 on click) */}
                      {t.unread_count && t.unread_count > 0 ? (<span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shrink-0">
                          {t.unread_count}
                        </span>) : (<ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 opacity-60'}`}/>)}
                    </div>);
            })}
              </div>
            </div>
          </div>

          {/* RIGHT ACTIVE CONVERSATION PANEL: MIDNIGHT BLACK (#090d16) */}
          <div className="flex-1 bg-[#090d16] p-5 md:p-6 space-y-4 flex flex-col justify-between">
            {activeThread ? (<>
                {/* Active Chat Header (PROFILE AVATAR CLICKED REDIRECTS TO FULL PAGE PROFILE - NO PROFILE INFO BUTTON - NO CALL ICONS) */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div onClick={() => setShowFullProfilePage(true)} className="flex items-center space-x-3 cursor-pointer group" title="Click profile avatar to view full profile details page">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md group-hover:scale-105 group-hover:ring-2 ring-blue-500 transition-all">
                      {activeThread.is_group ? <Users className="h-6 w-6"/> : activeThread.recipient_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">{activeThread.recipient_name}</h3>
                        <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 border border-blue-400/40 text-[10px] font-bold rounded-md flex items-center space-x-1">
                          <User className="h-3 w-3"/>
                          <span>View Full Profile</span>
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{activeThread.member_count || 8} members • Online</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400 text-xs">
                    <span className="px-3 py-1 bg-[#1e293b] text-slate-300 font-mono font-bold rounded-xl border border-slate-700">
                      Channel #{activeThread.id}
                    </span>
                  </div>
                </div>

                {/* Timeline Messages with Actions (Delete, Edit, Reply, Forward) */}
                <div className="flex-1 max-h-[460px] overflow-y-auto space-y-4 pr-1">
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-[#1e293b] text-slate-300 text-xs font-bold rounded-full border border-slate-700">
                      Today
                    </span>
                  </div>

                  {currentMessages.map((m) => {
                    const isMe = m.sender_role === 'employee' || m.sender_name?.includes('You') || m.sender_name === 'Me';
                    return (<div key={m.id} className={`flex items-start space-x-3 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (<div onClick={() => setShowFullProfilePage(true)} className="h-9 w-9 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1 shadow-md cursor-pointer hover:bg-blue-600 transition-colors" title="Click to view full profile details">
                            {m.sender_name?.charAt(0) || 'U'}
                          </div>)}

                        <div className={`max-w-[78%] space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                          {!isMe && (<span className="text-xs font-bold text-slate-400 block">{m.sender_name}</span>)}

                          {/* Quoted Reply Banner inside Message Bubble */}
                          {m.replyTo && (<div className="p-2 bg-slate-950/80 border-l-4 border-blue-500 rounded-lg text-[11px] text-slate-300 text-left mb-1">
                              <span className="font-bold text-blue-400 block">{m.replyTo.sender_name}</span>
                              <span className="truncate block opacity-80">{m.replyTo.body}</span>
                            </div>)}

                          <div className={`p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-md relative ${isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-[#1e293b] text-slate-100 border border-slate-700 rounded-bl-none'}`}>
                            <div>{m.body}</div>
                            {m.isEdited && <span className="text-[9px] text-blue-200 block mt-1 italic">(edited)</span>}

                            {/* RENDER ATTACHED PHOTO OR DOCUMENT */}
                            {m.attachment && (<div className="mt-2.5 pt-2 border-t border-white/20 space-y-2">
                                {m.attachment.type === 'image' ? (<div className="rounded-xl overflow-hidden border border-white/30 max-w-xs shadow-lg relative">
                                    <img src={m.attachment.url} alt={m.attachment.name} className="w-full h-auto max-h-48 object-cover"/>
                                    <div className="p-2 bg-slate-900/90 text-[10px] font-bold text-white flex items-center justify-between">
                                      <span className="truncate">{m.attachment.name}</span>
                                      <span className="text-blue-300 font-mono">{m.attachment.size}</span>
                                    </div>
                                  </div>) : (<div className="p-3 bg-slate-900/80 border border-white/20 rounded-xl flex items-center justify-between text-xs space-x-3">
                                    <div className="flex items-center space-x-2 truncate">
                                      <FileText className="h-5 w-5 text-rose-400 shrink-0"/>
                                      <div className="truncate">
                                        <span className="font-bold text-white block truncate">{m.attachment.name}</span>
                                        <span className="text-[10px] text-slate-300 font-mono">{m.attachment.size}</span>
                                      </div>
                                    </div>
                                    <a href={m.attachment.url} download={m.attachment.name} className="p-1.5 hover:bg-slate-800 rounded-lg text-white">
                                      <Download className="h-4 w-4"/>
                                    </a>
                                  </div>)}
                              </div>)}

                            {/* HOVER MESSAGE ACTIONS TOOLBAR (REPLY, EDIT, FORWARD, DELETE) */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-1 flex items-center space-x-1.5 shadow-xl z-20">
                              <button onClick={() => handleStartReplyMessage(m)} className="p-1 hover:text-blue-400 text-slate-300" title="Reply to message">
                                <CornerUpLeft className="h-3.5 w-3.5"/>
                              </button>
                              
                              {isMe && (<button onClick={() => handleStartEditMessage(m)} className="p-1 hover:text-amber-400 text-slate-300" title="Edit message">
                                  <Edit3 className="h-3.5 w-3.5"/>
                                </button>)}

                              <button onClick={() => handleStartForwardMessage(m)} className="p-1 hover:text-indigo-400 text-slate-300" title="Forward message">
                                <Forward className="h-3.5 w-3.5"/>
                              </button>

                              <button onClick={() => handleDeleteMessage(m.id)} className="p-1 hover:text-rose-400 text-slate-300" title="Delete message">
                                <Trash2 className="h-3.5 w-3.5"/>
                              </button>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono block">
                            {m.created_at} {isMe ? '✓✓' : ''}
                          </span>
                        </div>
                      </div>);
                })}
                  <div ref={messageEndRef}/>
                </div>

                {/* Reply Banner Indicator over Chat Input */}
                {replyingTo && (<div className="p-3 bg-[#1e293b] border-l-4 border-blue-500 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                    <div className="truncate">
                      <span className="font-bold text-blue-400 block">Replying to {replyingTo.sender_name}</span>
                      <span className="text-slate-300 truncate block">{replyingTo.body}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white">
                      <X className="h-4 w-4"/>
                    </button>
                  </div>)}

                {/* Edit Indicator Banner over Chat Input */}
                {editingMsgId && (<div className="p-3 bg-amber-950/40 border-l-4 border-amber-500 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                    <div>
                      <span className="font-bold text-amber-400 block">Editing Message</span>
                      <span className="text-slate-300 text-[11px]">Update the text below and click Send</span>
                    </div>
                    <button onClick={() => { setEditingMsgId(null); setNewMessageText(''); }} className="p-1 text-slate-400 hover:text-white">
                      <X className="h-4 w-4"/>
                    </button>
                  </div>)}

                {/* Emoji Quick Picker Bar */}
                {showEmojiPicker && (<div className="p-3 bg-[#1e293b] border border-slate-700 rounded-2xl flex items-center space-x-3 z-30 animate-fadeIn">
                    {['👍', '✅', '👋', '😊', '📁', '🎉', '📍', '⏳'].map((emoji, idx) => (<button key={idx} onClick={() => {
                            setNewMessageText(prev => prev + emoji);
                            setShowEmojiPicker(false);
                        }} className="text-lg hover:scale-125 transition-transform">
                        {emoji}
                      </button>))}
                  </div>)}

                {/* Chat Input Bar */}
                <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-[#1e293b] hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 active:scale-95 shadow-sm transition-all" title="Upload Photo or Document File">
                    <Paperclip className="h-4 w-4 text-blue-400"/>
                  </button>
                  <input type="text" placeholder={editingMsgId ? t('chat.placeholder_edit_message', 'Edit your message...') : t('chat.placeholder_type_message', 'Type a message...')} value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"/>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 bg-[#1e293b] hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-xl border border-slate-700 active:scale-95" title="Add Emoji">
                    <Smile className="h-4 w-4"/>
                  </button>
                  <button onClick={handleSendMessage} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95">
                    <Send className="h-4 w-4"/>
                  </button>
                </div>
              </>) : (<div className="text-center py-36 text-slate-500 font-bold text-xs">Select a channel from the left sidebar to start chatting.</div>)}
          </div>
        </div>)}

      {/* ========================================== */}
      {/* FULL-PAGE PROFILE & CHANNEL DETAILS OVERLAY (WHEN CLICKING PROFILE AVATAR ICON) */}
      {/* ========================================== */}
      {showFullProfilePage && activeThread && (<div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-10 animate-fadeIn">
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-6 w-6 text-blue-500"/>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Channel & Recipient Profile Details</h2>
              </div>
              <button onClick={() => setShowFullProfilePage(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2">
                <X className="h-4 w-4"/>
                <span>Close Profile</span>
              </button>
            </div>

            {/* Banner Header */}
            <div className="p-8 bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-500/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center space-x-5">
                <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                  {activeThread.is_group ? <Users className="h-10 w-10"/> : activeThread.recipient_name?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">{activeThread.recipient_name}</h1>
                  <p className="text-xs text-blue-200 font-semibold mt-1">Official Authorized VMS Communication Channel</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-full">
                    ● Channel Active & Online
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-mono space-y-1">
                <div>Channel ID: <span className="text-blue-400 font-bold">#CHAN-{activeThread.id}</span></div>
                <div>Role: <span className="text-purple-400 font-bold uppercase">{activeThread.recipient_role}</span></div>
                <div>Created: <span className="text-slate-300">May 2025</span></div>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">Direct Contact Metadata</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400 font-medium">Recipient Name</span>
                    <span className="font-bold text-white">{activeThread.recipient_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400 font-medium">Email Address</span>
                    <span className="font-mono text-blue-300 font-semibold">{activeThread.recipient_email || 'contact@vms.com'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400 font-medium">Department</span>
                    <span className="font-semibold text-slate-200">Visitor Operations & Security</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-medium">Direct Line</span>
                    <span className="font-mono text-slate-200">+251 911 000 777</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">Security & Clearance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400 font-medium">Clearance Level</span>
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold rounded-md">Tier 1 Internal</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400 font-medium">Access Scope</span>
                    <span className="font-bold text-white">Full Gate & Reception Desk</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-medium">Encryption Status</span>
                    <span className="text-emerald-400 font-bold">256-bit TLS Encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Member Directory List */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2">Channel Members ({activeThread.member_count || 8})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(activeThread.members || [
                { name: 'Sarah Johnson (You)', role: 'Host Employee', online: true, email: 'sarah@vms.com' },
                { name: 'Emily Williams', role: 'Reception Officer', online: true, email: 'emily@vms.com' },
                { name: 'James Anderson', role: 'Security Officer', online: true, email: 'james@vms.com' },
                { name: 'Michael John', role: 'System Admin', online: true, email: 'michael@vms.com' }
            ]).map((m, idx) => (<div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${m.online ? 'bg-emerald-400' : 'bg-slate-600'}`}/>
                      <div>
                        <span className="text-xs font-bold text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">{m.email || 'user@vms.com'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{m.role}</span>
                  </div>))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowFullProfilePage(false)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95">
                Return to Live Chat
              </button>
            </div>
          </div>
        </div>)}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (<div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3">System Bulletins</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((a) => (<div key={a.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 shadow-md">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                  {a.type}
                </span>
                <h4 className="text-sm font-bold text-white">{a.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{a.content}</p>
              </div>))}
          </div>
        </div>)}

      {/* COMPOSE NEW MESSAGE MODAL */}
      {isComposeOpen && (<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider">{t('notifications.compose_communication', 'Compose Communication')}</h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5"/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('notifications.select_recipient', 'Select Recipient')}</label>
                <select value={composeRecipientId || ''} onChange={(e) => setComposeRecipientId(Number(e.target.value))} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500">
                  {contacts.map((c) => (<option key={c.id} value={c.id}>
                      {c.full_name} ({c.role_label})
                    </option>))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('notifications.subject', 'Subject')}</label>
                <input type="text" placeholder={t('notifications.placeholder_subject', 'e.g. Visitor Pass Verification Request')} value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"/>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('notifications.message_body', 'Message Body')}</label>
                <textarea rows={4} placeholder={t('notifications.placeholder_message_body', 'Type your official inquiry or notice...')} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"/>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button onClick={() => setIsComposeOpen(false)} className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl border border-slate-800">
                {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={handleCreateNewThread} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2">
                <Send className="h-4 w-4"/>
                <span>{t('notifications.send_communication', 'Send Communication')}</span>
              </button>
            </div>
          </div>
        </div>)}

      {/* FORWARD MESSAGE MODAL */}
      {isForwardOpen && (<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider">{t('notifications.forward_chat_message', 'Forward Chat Message')}</h3>
              <button onClick={() => setIsForwardOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5"/>
              </button>
            </div>

            {forwardingMsgText && (<div className="p-3 bg-slate-950 border-l-4 border-indigo-500 rounded-xl text-xs text-slate-300">
                <span className="font-bold text-indigo-400 block mb-0.5">{t('notifications.message_content', 'Message Content:')}</span>
                "{forwardingMsgText}"
              </div>)}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">{t('notifications.recipient_email_address', 'Recipient Email Address')}</label>
              <input type="email" placeholder={t('notifications.placeholder_email', 'colleague@company.com')} value={forwardEmail} onChange={(e) => setForwardEmail(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"/>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button onClick={() => setIsForwardOpen(false)} className="px-4 py-2 bg-slate-950 text-slate-400 text-xs font-bold rounded-xl border border-slate-800">
                {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={handleSendForwardMessage} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md">
                {t('notifications.forward_message', 'Forward Message')}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
