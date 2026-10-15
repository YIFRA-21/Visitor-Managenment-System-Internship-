/**
 * NotificationBell Component
 * ───────────────────────────
 * Real-time notification bell with unread badge and dropdown panel.
 * Integrates with Redux store + Socket.IO for live updates.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, ExternalLink } from 'lucide-react';
import { visitorNotificationApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    // Redux state for real-time Socket.IO notifications
    const reduxNotifications = useAppSelector((state) => state.notifications.items);
    const reduxUnread = useAppSelector((state) => state.notifications.unreadCount);
    const [open, setOpen] = useState(false);
    const [localNotifications, setLocalNotifications] = useState([]);
    const [localUnread, setLocalUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const panelRef = useRef(null);
    // Merge Redux (socket-pushed) + API-fetched notifications
    const mergedNotifications = useCallback(() => {
        const map = new Map();
        // API-fetched first
        localNotifications.forEach((n) => map.set(n.id, n));
        // Redux overwrites (fresher from socket)
        reduxNotifications.forEach((n) => map.set(n.id, n));
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.created_at || b.sent_at).getTime() - new Date(a.created_at || a.sent_at).getTime());
        return merged;
    }, [localNotifications, reduxNotifications]);
    const notifications = mergedNotifications();
    const unreadCount = Math.max(localUnread, reduxUnread);
    // Fetch notifications from API
    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await visitorNotificationApi.getNotifications();
            const data = res.data;
            const items = data.notifications || data || [];
            setLocalNotifications(items);
            setLocalUnread(data.counts?.unread ?? items.filter((n) => !n.is_read).length);
            setInitialLoaded(true);
        }
        catch (err) {
            console.error('Error fetching notifications in bell:', err);
        }
        finally {
            setLoading(false);
        }
    };
    // Initial load + periodic poll (fallback if Socket.IO disconnects)
    useEffect(() => {
        loadNotifications();
        // Also populate Redux store
        dispatch(fetchNotifications());
        const interval = setInterval(loadNotifications, 30000); // 30s polling fallback
        return () => clearInterval(interval);
    }, [dispatch]);
    // Re-sync when panel opens for fresh data
    useEffect(() => {
        if (open && initialLoaded) {
            loadNotifications();
        }
    }, [open]);
    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        if (open)
            document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);
    const handleMarkRead = async (id) => {
        try {
            await visitorNotificationApi.markNotificationRead(id);
            // Update local state
            setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setLocalUnread((prev) => Math.max(0, prev - 1));
            // Update Redux state
            dispatch(markAsRead(id));
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleMarkAllRead = async () => {
        try {
            await visitorNotificationApi.markAllNotificationsRead();
            setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setLocalUnread(0);
            // Update Redux state
            dispatch(markAllAsRead());
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleItemClick = (notif) => {
        if (!notif.is_read)
            handleMarkRead(notif.id);
        const role = user?.role?.toLowerCase() || 'visitor';
        let rolePrefix = '/visitor';
        if (role === 'admin')
            rolePrefix = '/admin';
        else if (role === 'staff' || role === 'employee')
            rolePrefix = '/employee';
        else if (role === 'manager')
            rolePrefix = '/manager';
        else if (role === 'receptionist')
            rolePrefix = '/reception';
        else if (role === 'security_officer' || role === 'security')
            rolePrefix = '/security';
        
        // Open the related Message/Conversation page (NOT a separate notification page)
        if (notif.action_url && notif.action_url.includes('view=')) {
            navigate(`${rolePrefix}/dashboard${notif.action_url.startsWith('?') ? notif.action_url : '?' + notif.action_url}`);
        } else if (notif.record_id) {
            navigate(`${rolePrefix}/dashboard?view=messages&convId=${notif.record_id}`);
        } else {
            navigate(`${rolePrefix}/dashboard?view=messages`);
        }
        setOpen(false);
    };
    const formatTime = (dateStr) => {
        if (!dateStr)
            return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1)
            return 'Just now';
        if (diffMin < 60)
            return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24)
            return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay}d ago`;
    };
    const getCategoryIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'appointment': return '📅';
            case 'security': return '🔒';
            case 'system': return '⚙️';
            case 'message': return '💬';
            case 'visitor': return '👤';
            case 'approval': return '✅';
            case 'alert': return '⚠️';
            default: return '🔔';
        }
    };
    return (<div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button id="notification-bell-button" onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
        <Bell className="w-5 h-5"/>
        {unreadCount > 0 && (<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>)}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (<motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                Notifications
                {unreadCount > 0 && (<span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-full">
                    {unreadCount} new
                  </span>)}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (<button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    <CheckCheck className="w-3.5 h-3.5"/>
                    Mark all read
                  </button>)}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[380px]">
              {loading && notifications.length === 0 ? (<div className="p-8 text-center text-slate-500 text-sm">Loading notifications...</div>) : notifications.length === 0 ? (<div className="p-8 text-center text-slate-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                  No notifications yet
                </div>) : (notifications.slice(0, 20).map((notif) => (<div key={notif.id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors cursor-pointer ${!notif.is_read ? 'bg-indigo-500/5' : ''}`} onClick={() => handleItemClick(notif)}>
                    {/* Category icon */}
                    <div className="mt-0.5 text-base">
                      {!notif.is_read ? (<span className="relative">
                          {getCategoryIcon(notif.type || notif.category)}
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>
                        </span>) : (<span className="opacity-50">{getCategoryIcon(notif.type || notif.category)}</span>)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold truncate ${!notif.is_read ? 'text-white' : 'text-slate-300'}`}>{notif.title}</p>
                        {notif.priority && (<span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${notif.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                            {notif.priority}
                          </span>)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[9px] text-slate-600 mt-1">{formatTime(notif.created_at || notif.sent_at)}</p>
                    </div>

                    {!notif.is_read && (<button onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notif.id);
                    }} className="mt-1 p-1 text-slate-500 hover:text-indigo-400 transition-colors" title="Mark as read">
                        <Check className="w-3.5 h-3.5"/>
                      </button>)}
                  </div>)))}
            </div>

            {/* Footer */}
            <div className="p-2.5 text-center border-t border-slate-800 bg-slate-950">
              <button onClick={() => {
                const role = user?.role?.toLowerCase() || 'visitor';
                let rolePrefix = '/visitor';
                if (role === 'admin')
                    rolePrefix = '/admin';
                else if (role === 'staff' || role === 'employee')
                    rolePrefix = '/employee';
                else if (role === 'manager')
                    rolePrefix = '/manager';
                else if (role === 'receptionist')
                    rolePrefix = '/reception';
                else if (role === 'security_officer' || role === 'security')
                    rolePrefix = '/security';
                navigate(`${rolePrefix}/dashboard?view=messages`);
                setOpen(false);
            }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 w-full py-1">
                Open Message Center <ExternalLink className="w-3 h-3"/>
              </button>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
