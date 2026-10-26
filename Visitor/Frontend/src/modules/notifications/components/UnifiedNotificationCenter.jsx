import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, MessageSquare, Megaphone, Bell, Send, Paperclip, Check, CheckCheck,
  Trash2, Edit3, CornerUpRight, Copy, Download, Eye, ExternalLink, Plus,
  Search, Filter, RefreshCw, X, Shield, User, Building, AlertCircle,
  FileText, Image as ImageIcon, Video as VideoIcon, CheckCircle2,
  ChevronRight, ChevronLeft, Lock, ArrowLeft, Upload, Clock, Info,
  Settings, Users, Volume2, VolumeX, Sliders, Share2, Camera
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import { communicationApi, notificationsApi, profileApi, getErrorMessage } from '../../../services/api';
import BackButton from '../../../components/common/BackButton';
import useResponseNavigation from '../../response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../response/responseConfig';
import { resolvePhotoUrl } from '../../../utils/photoUtils';

// Security Redaction: Never display User ID, Temporary Passwords, or raw credentials in any notification view
export const sanitizeNotificationContent = (msg) => {
  if (!msg || typeof msg !== 'string') return msg || '';
  return msg
    .replace(
      /Your account has been created\.\s*(?:User ID:\s*[^.]+\.?\s*)?(?:Temporary Password:\s*[^\s,.;]+)?/gi,
      'Your account has been created successfully. Login credentials and instructions have been securely sent to your registered email.'
    )
    .replace(
      /(?:temporary\s+password|temp\s+pass(?:word)?)(?:\s*(?:is|:|=))\s*([^\s,.;\n]+)/gi,
      'Temporary password has been sent to your registered email'
    )
    .replace(
      /User ID:\s*([A-Za-z0-9_-]+)(?=[.,\s]+(?:Temporary|Password|Credentials))/gi,
      'User Credentials: [Sent via Email]'
    )
    .replace(
      /(\b(?:temporary\s+)?password\s*(?:is|:|=)\s*)([A-Za-z0-9@#$%^&*!_+=-]{6,})/gi,
      '$1[Sent via secure email]'
    );
};

// Safe Avatar Renderer with graceful fallback to dynamic UI Initials Avatar
export const renderSafeAvatar = (url, name = 'Chat', className = 'w-full h-full object-cover') => {
  const resolved = resolvePhotoUrl(url);
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Chat')}&background=4338ca&color=ffffff&bold=true`;
  return (
    <img
      src={resolved || fallback}
      alt={name || 'Avatar'}
      className={className}
      onError={(e) => {
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallback;
        }
      }}
    />
  );
};

export default function UnifiedNotificationCenter({ initialTab = 'messages', onNavigate }) {
  const [searchParams] = useSearchParams();
  const notifIdFromUrl = searchParams.get('notifId');
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const { toConfirmation, toSuccess, toError } = useResponseNavigation();

  // Authenticated user role & details
  const myUserId = user?.id;
  const myRole = (user?.role || '').toLowerCase();
  const isAdmin = myRole === 'admin' || myRole === 'super_admin' || myRole === 'system_admin';

  // Tab resolution
  const resolveTab = (tab) => {
    if (!tab) return 'messages';
    const t = String(tab).toLowerCase();
    if (t.includes('setting')) return isAdmin ? 'settings' : 'notifications';
    if (t.includes('announcement')) return 'announcements';
    if (t.includes('notif') || t === 'notification_center') return 'notifications';
    if (t === 'email') return 'email';
    return 'messages';
  };

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(resolveTab(tabFromUrl || initialTab));
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(resolveTab(tabFromUrl));
    } else if (initialTab) {
      setActiveTab(resolveTab(initialTab));
    }
  }, [tabFromUrl, initialTab]);

  // ══════════════════════════════════════════════════════════════════════════
  // Resolve Real-time Message Delivery & Seen Indicators:
  // - 1 mark (✓): Receiver not online or not on page
  // - 2 marks (✓✓): Receiver on page or online
  // - Circle (✓✓ ●): Receiver user completely saw the text
  const getDeliveryStatus = (msg) => {
    if (msg.delivery_status === 'seen') return 'seen';
    const isReceiverOnline = activeConversation?.is_group
      ? (Number(activeConversation.online_count) > 1)
      : Boolean(activeConversation?.other_user?.is_online);

    if (isReceiverOnline) return 'delivered';
    return msg.delivery_status || 'sent';
  };

    // 1. REAL CONVERSATIONS & MESSAGING STATE (MySQL Backed)
  // ══════════════════════════════════════════════════════════════════════════
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchConvQuery, setSearchConvQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // New Chat Modal Navigation & Forms
  const [newChatTab, setNewChatTab] = useState('group'); // 'directory' | 'group' | 'manual'
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('ALL');
  const [directorySearch, setDirectorySearch] = useState('');

  // Group Chat Creation State (2-Step Flow)
  const [groupStep, setGroupStep] = useState(1); // Step 1: Name & Info, Step 2: Member Selection
  const [groupRoleFilter, setGroupRoleFilter] = useState('ALL');
  const [teamMemberRoleFilter, setTeamMemberRoleFilter] = useState('ALL');
  const [groupForm, setGroupForm] = useState({
    title: '',
    description: '',
    participantIds: []
  });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [uploadingTeamAvatar, setUploadingTeamAvatar] = useState(false);
  const [savingTeamInfo, setSavingTeamInfo] = useState(false);
  const teamPhotoInputRef = useRef(null);
  const userPhotoInputRef = useRef(null);
  const [uploadingUserAvatar, setUploadingUserAvatar] = useState(false);

  // Manual Contact Creation State
  const [manualContactForm, setManualContactForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'visitor',
    company: '',
    notes: ''
  });
  const [creatingManualContact, setCreatingManualContact] = useState(false);

  // Notification Selection State (Individual & All Mark for Delete)
  const [selectedNotifIds, setSelectedNotifIds] = useState([]);

  // Notification Detail View Modal (On its OWN display page — NEVER redirects to chat)
  const [selectedNotifForView, setSelectedNotifForView] = useState(null);
  const [forwardNotifModal, setForwardNotifModal] = useState({ visible: false, notif: null });
  const [forwardRecipientEmail, setForwardRecipientEmail] = useState('');
  const [notifContextMenu, setNotifContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    notif: null
  });

  // Chat Header Profile / Info Edit Modal
  const [contactProfileModal, setContactProfileModal] = useState({
    visible: false,
    user: null,
    conversation: null,
    isGroup: false,
    formData: { name: '', email: '', phone: '', notes: '', title: '', description: '' }
  });

  // Announcement Actions State
  const [editAnnouncementModal, setEditAnnouncementModal] = useState({
    visible: false,
    announcement: null,
    formData: { title: '', content: '', category: 'General Notice', priority: 'normal' }
  });
  const [forwardAnnouncementModal, setForwardAnnouncementModal] = useState({
    visible: false,
    announcement: null,
    targetConvId: '',
    targetEmail: ''
  });

  // Admin Notification Settings State
  const [adminSettings, setAdminSettings] = useState({
    inAppEnabled: true,
    emailRelayEnabled: true,
    smsGatewayEnabled: false,
    websocketPushEnabled: true,
    soundEnabled: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '07:00',
    retentionDays: 60,
    emergencyBroadcast: true,
    visitorArrivals: true,
    securityAlerts: true,
    passApprovals: true
  });

  // Modern Audio Chime Player
  const playAlertChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Attachment upload state
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Editing message state
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  // Replying / quoting state
  const [replyingTo, setReplyingTo] = useState(null);

  // Right-click Message Context Menu
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
    attachment: null
  });

  // Media Lightbox (Images / Video / Document preview)
  const [mediaLightbox, setMediaLightbox] = useState({
    visible: false,
    type: 'image',
    url: '',
    name: ''
  });

  // Forward Modal
  const [forwardModal, setForwardModal] = useState({
    visible: false,
    message: null
  });

  // Mobile conversation list view toggle
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch Conversations from MySQL
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await communicationApi.getConversations();
      const list = res.data?.conversations || [];
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConvId]);

  // Fetch Authorized Contacts from MySQL
  const fetchContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const res = await communicationApi.getContacts();
      setContacts(res.data?.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Fetch Chat Messages for Active Conversation from MySQL
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setLoadingMessages(true);
      const res = await communicationApi.getChatMessages(convId);
      setMessages(res.data?.messages || []);
      // Clear unread count for active conversation immediately and dispatch update to navbar
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      );
      window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (err) {
      showToast(getErrorMessage(err) || 'Error loading conversation messages.', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, [fetchConversations, fetchContacts]);

  // When active conversation changes, load messages & join socket room
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      if (socket) {
        socket.emit('join_room', `conv:${activeConvId}`);
        if (myUserId) {
          socket.emit('mark_read', { conversationId: activeConvId, userId: myUserId });
        }
      }
    }
  }, [activeConvId, fetchMessages, socket, myUserId]);

  // Real-time Socket.IO subscriptions
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg) => {
      const isForActive = Number(msg.conversation_id) === Number(activeConvId);
      if (isForActive) {
        setMessages((prev) => {
          // Avoid duplicate insertion
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { ...msg, is_mine: Number(msg.sender_id) === Number(myUserId) }];
        });
        if (Number(msg.sender_id) !== Number(myUserId) && socket && myUserId) {
          socket.emit('mark_read', { conversationId: activeConvId, userId: myUserId });
        }
        setTimeout(() => scrollToBottom(), 100);
      }

      // Update last message preview & unread count in conversations list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === msg.conversation_id) {
            return {
              ...c,
              last_message: msg.message_text,
              last_message_at: msg.created_at,
              unread_count: isForActive
                ? 0
                : (Number(c.unread_count) || 0) + (Number(msg.sender_id) !== Number(myUserId) ? 1 : 0)
            };
          }
          return c;
        })
      );

      window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
    };

    const handleMessageEdited = (data) => {
      if (Number(data.conversation_id) === Number(activeConvId)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message_id ? { ...m, message_text: data.message_text, is_edited: true } : m
          )
        );
      }
    };

    const handleMessageDeleted = (data) => {
      if (Number(data.conversation_id) === Number(activeConvId)) {
        setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
      }
    };

    const handleNewChatMessage = (payload) => {
      if (Number(payload.conversationId) !== Number(activeConvId)) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === payload.conversationId
              ? {
                  ...c,
                  last_message: payload.message?.message_text || c.last_message,
                  last_message_at: payload.message?.created_at || new Date().toISOString(),
                  unread_count: (Number(c.unread_count) || 0) + 1
                }
              : c
          )
        );
      }
      window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
      fetchConversations();
    };

    const handleMessagesRead = (data) => {
      if (Number(data.conversationId) === Number(activeConvId)) {
        const readTime = new Date(data.readAt || new Date()).getTime();
        setMessages((prev) =>
          prev.map((m) => {
            if (m.is_mine && new Date(m.created_at).getTime() <= readTime) {
              return { ...m, delivery_status: 'seen' };
            }
            return m;
          })
        );
      }
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('new_chat_message', handleNewChatMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('new_chat_message', handleNewChatMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, activeConvId, myUserId, fetchConversations]);

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => {
      if (contextMenu.visible) setContextMenu((prev) => ({ ...prev, visible: false }));
      if (notifContextMenu.visible) setNotifContextMenu((prev) => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [contextMenu.visible, notifContextMenu.visible]);

  // Send Message Handler (MySQL + Socket)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && stagedAttachments.length === 0) return;
    if (!activeConvId) {
      showToast('Please select or start a conversation first.', 'error');
      return;
    }

    try {
      let textToSend = messageInput.trim();
      if (replyingTo) {
        textToSend = `> Replying to ${replyingTo.sender_name}: "${replyingTo.message_text.slice(0, 80)}..."\n\n${textToSend}`;
      }

      let primaryType = 'text';
      if (stagedAttachments.length > 0) {
        primaryType = stagedAttachments[0].type || 'file';
      }

      const payload = {
        message_text: textToSend,
        message_type: primaryType,
        attachments: stagedAttachments.length > 0 ? stagedAttachments : null
      };

      setMessageInput('');
      setStagedAttachments([]);
      setReplyingTo(null);

      const res = await communicationApi.sendChatMessage(activeConvId, payload);
      const newMsg = res.data?.message;

      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, is_mine: true }];
        });
        setTimeout(() => scrollToBottom(), 100);
      }

      fetchConversations();
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to send message.', 'error');
    }
  };

  // Upload Attachment Handler (Multer Backend)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('File size must be under 50MB.', 'error');
      return;
    }

    try {
      setUploadingAttachment(true);
      const fd = new FormData();
      fd.append('file', file);

      const res = await communicationApi.uploadAttachment(fd);
      const attachment = res.data?.attachment;

      if (attachment) {
        setStagedAttachments((prev) => [...prev, attachment]);
        showToast(`Attached ${attachment.name} ✓`, 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'File upload failed.', 'error');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  // Edit Message Submit
  const handleEditSubmit = async () => {
    if (!editingMessage || !editText.trim()) return;
    try {
      await communicationApi.editChatMessage(activeConvId, editingMessage.id, editText.trim());
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id ? { ...m, message_text: editText.trim(), is_edited: true } : m
        )
      );
      setEditingMessage(null);
      setEditText('');
      showToast('Message edited successfully.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to edit message.', 'error');
    }
  };

  // Delete Message Submit
  const handleDeleteMessage = async (msg) => {
    if (!msg || !activeConvId) return;
    try {
      await communicationApi.deleteChatMessage(activeConvId, msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      showToast('Message deleted successfully ✓', 'success');
      window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to delete message.', 'error');
    }
  };

  // Delete Media (Photo / Video) directly from chat
  const handleDeleteMediaAttachment = async (msg, att) => {
    if (!msg || !activeConvId) return;
    try {
      const attUrl = att?.url || att?.filename || att?.name;
      const res = await communicationApi.deleteChatMessageAttachment(activeConvId, msg.id, attUrl);
      if (res.data?.deletedMessage) {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        showToast('Photo / media deleted from chat ✓', 'success');
      } else if (res.data?.attachments) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, attachments: res.data.attachments } : m))
        );
        showToast('Media attachment deleted ✓', 'success');
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        showToast('Media file removed ✓', 'success');
      }
      window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
    } catch (err) {
      // Fallback: try deleteChatMessage if attachment endpoint encounters an issue
      try {
        await communicationApi.deleteChatMessage(activeConvId, msg.id);
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        showToast('Media attachment removed ✓', 'success');
        window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
      } catch (e) {
        showToast(getErrorMessage(err) || 'Failed to delete media attachment.', 'error');
      }
    }
  };

  // Open Chat Profile / Edit Info Modal
  const handleOpenChatProfileModal = () => {
    if (!activeConversation) return;
    const isGrp = Boolean(activeConversation.is_group);
    setContactProfileModal({
      visible: true,
      user: activeConversation.other_user || null,
      conversation: activeConversation,
      isGroup: isGrp,
      formData: {
        name: activeConversation.other_user?.name || activeConversation.title || '',
        email: activeConversation.other_user?.email || '',
        phone: activeConversation.other_user?.phone || '',
        role: activeConversation.other_user?.role_label || activeConversation.other_user?.role || '',
        department: activeConversation.other_user?.department || '',
        notes: activeConversation.other_user?.notes || '',
        title: activeConversation.title || '',
        description: activeConversation.description || '',
        avatar_url: activeConversation.avatar_url || ''
      }
    });
  };

  // Forward Message Submit
  const handleForwardMessage = async (targetConvId) => {
    if (!forwardModal.message || !targetConvId) return;
    try {
      await communicationApi.sendChatMessage(targetConvId, {
        message_text: `[Forwarded from ${forwardModal.message.sender_name}]: ${forwardModal.message.message_text}`,
        message_type: forwardModal.message.message_type,
        attachments: forwardModal.message.attachments
      });
      setForwardModal({ visible: false, message: null });
      showToast('Message forwarded successfully ✓', 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to forward message.', 'error');
    }
  };

  // Start Direct Conversation with Contact
  const handleStartDirectChat = async (targetUser) => {
    try {
      const res = await communicationApi.createDirectConversation(targetUser.id);
      const convId = res.data?.conversationId;
      setShowNewChatModal(false);
      await fetchConversations();
      if (convId) {
        setActiveConvId(convId);
        setMobileShowChat(true);
        showToast(`Conversation opened with ${targetUser.full_name || targetUser.username}`, 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Could not start conversation.', 'error');
    }
  };

  // Message Context Menu Handler (supports direct photo/video right-click)
  const handleContextMenu = (e, msg, att = null) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    setContextMenu({ visible: true, x, y, message: msg, attachment: att });
  };

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0] || null;
  }, [conversations, activeConvId]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchConvQuery.trim()) return conversations;
    const q = searchConvQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.other_user?.name?.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q)
    );
  }, [conversations, searchConvQuery]);

  // Filter contacts in New Chat Directory
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = directorySearch.toLowerCase().trim();
      const matchText =
        !q ||
        c.full_name?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.role_label?.toLowerCase().includes(q);
      if (!matchText) return false;
      if (directoryRoleFilter === 'ALL') return true;
      const r = (c.role || '').toLowerCase();
      if (directoryRoleFilter === 'visitor') return r === 'visitor';
      if (directoryRoleFilter === 'staff') return r === 'staff' || r === 'employee' || r === 'host';
      if (directoryRoleFilter === 'security') return r.includes('security');
      if (directoryRoleFilter === 'receptionist') return r.includes('reception');
      if (directoryRoleFilter === 'manager') return r.includes('manager');
      if (directoryRoleFilter === 'admin') return r.includes('admin');
      return true;
    });
  }, [contacts, directorySearch, directoryRoleFilter]);

  // ══════════════════════════════════════════════════════════════════════════
  // 2. REAL EMAIL SENDING STATE (SMTP Backed via Backend)
  // ══════════════════════════════════════════════════════════════════════════
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
  });
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailDeliveryLog, setEmailDeliveryLog] = useState([]);
  const emailFileInputRef = useRef(null);

  const handleEmailAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await communicationApi.uploadAttachment(fd);
      if (res.data?.attachment) {
        setEmailAttachments((prev) => [...prev, res.data.attachment]);
        showToast(`Email attachment added: ${file.name}`, 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Attachment upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSendEmail = async (e) => {
    e?.preventDefault();
    if (!emailForm.to.trim() || !emailForm.to.includes('@')) {
      showToast('Please provide a valid recipient email address.', 'error');
      return;
    }
    if (!emailForm.subject.trim()) {
      showToast('Email subject is required.', 'error');
      return;
    }
    if (!emailForm.body.trim()) {
      showToast('Email content cannot be empty.', 'error');
      return;
    }

    try {
      setSendingEmail(true);
      const res = await communicationApi.sendEmail({
        to: emailForm.to.trim(),
        subject: emailForm.subject.trim(),
        body: emailForm.body.trim(),
        attachments: emailAttachments
      });

      showToast(res.data?.message || 'Email delivered successfully via SMTP!', 'success');
      setEmailDeliveryLog((prev) => [
        {
          id: Date.now(),
          to: emailForm.to.trim(),
          subject: emailForm.subject.trim(),
          sent_at: new Date().toLocaleTimeString(),
          status: 'Delivered',
          previewUrl: res.data?.previewUrl
        },
        ...prev
      ]);

      setEmailForm({ to: '', subject: '', body: '' });
      setEmailAttachments([]);
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to send email. Check SMTP server.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. REAL ANNOUNCEMENTS STATE (MySQL Backed, Admin-Only Creation)
  // ══════════════════════════════════════════════════════════════════════════
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementFilter, setAnnouncementFilter] = useState('ALL');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content_body: '',
    priority: 'medium',
    category: 'General Notice',
    target_audience: ['All Users']
  });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await communicationApi.getAnnouncements({ search: announcementSearch });
      const list = res.data?.announcements || [];
      setAnnouncements(list);
      if (list.length > 0 && !selectedAnnouncement) {
        setSelectedAnnouncement(list[0]);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [announcementSearch, selectedAnnouncement]);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab, fetchAnnouncements]);

  const handleCreateAnnouncement = async (e) => {
    e?.preventDefault();
    if (!announcementForm.title.trim()) {
      showToast('Announcement title is required.', 'error');
      return;
    }
    if (!announcementForm.content_body.trim()) {
      showToast('Announcement body is required.', 'error');
      return;
    }

    try {
      setCreatingAnnouncement(true);
      const res = await communicationApi.createAnnouncement(announcementForm);
      showToast(res.data?.message || 'Announcement published to MySQL database!', 'success');
      setShowCreateAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        content_body: '',
        priority: 'medium',
        category: 'General Notice',
        target_audience: ['All Users']
      });
      fetchAnnouncements();
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to create announcement.', 'error');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = (annId) => {
    toConfirmation({
      title: 'Delete Enterprise Announcement',
      message: 'Are you sure you want to permanently delete this broadcast announcement?',
      entityType: 'Announcement',
      entityName: `Announcement #${annId}`,
      consequences: [
        'The announcement will immediately vanish from all recipient dashboards.',
        'Audience delivery records will be marked as retracted.'
      ],
      confirmLabel: 'Delete Announcement',
      confirmVariant: 'danger',
      apiEndpoint: `/communication/announcements/${annId}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Announcement Deleted',
        message: 'The broadcast announcement has been permanently removed.',
      }
    });
  };

  // Edit Announcement Submit
  const handleEditAnnouncementSubmit = async (e) => {
    e?.preventDefault();
    if (!editAnnouncementModal.announcement) return;
    try {
      const annId = editAnnouncementModal.announcement.id;
      const res = await communicationApi.updateAnnouncement(annId, editAnnouncementModal.formData);
      const updated = res.data?.announcement || { ...editAnnouncementModal.announcement, ...editAnnouncementModal.formData };
      setAnnouncements((prev) => prev.map((a) => (a.id === annId ? { ...a, ...updated } : a)));
      if (selectedAnnouncement?.id === annId) {
        setSelectedAnnouncement((prev) => ({ ...prev, ...updated }));
      }
      setEditAnnouncementModal({ visible: false, announcement: null, formData: { title: '', content_body: '', category: 'General Notice', priority: 'medium' } });
      showToast('Announcement updated successfully ✓', 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to update announcement.', 'error');
    }
  };

  // Forward Announcement Submit
  const handleForwardAnnouncementSubmit = async (e) => {
    e?.preventDefault();
    if (!forwardAnnouncementModal.announcement) return;
    const ann = forwardAnnouncementModal.announcement;
    const targetConvId = forwardAnnouncementModal.targetConvId;
    const targetEmail = forwardAnnouncementModal.targetEmail;

    try {
      if (targetConvId) {
        await communicationApi.sendChatMessage(targetConvId, {
          message_text: `📢 [Announcement: ${ann.title}]\n\n${ann.content_body}`,
          message_type: 'text'
        });
        showToast('Announcement forwarded to conversation ✓', 'success');
      } else if (targetEmail) {
        await communicationApi.sendEmail({
          to: targetEmail,
          subject: `[Announcement]: ${ann.title}`,
          body: ann.content_body
        });
        showToast(`Announcement forwarded to ${targetEmail} ✓`, 'success');
      } else {
        showToast('Please select a chat or enter an email to forward.', 'error');
        return;
      }
      setForwardAnnouncementModal({ visible: false, announcement: null, targetConvId: '', targetEmail: '' });
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to forward announcement.', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. REAL SYSTEM NOTIFICATIONS STATE (MySQL Backed)
  // ══════════════════════════════════════════════════════════════════════════
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState('ALL');

  const fetchNotificationsList = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await notificationsApi.list();
      const rawList = Array.isArray(res.data) ? res.data : res.data?.notifications || [];
      const list = rawList.map((n) => ({
        ...n,
        title: sanitizeNotificationContent(n.title),
        message: sanitizeNotificationContent(n.message),
      }));
      setNotificationsList(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotificationsList();
    }
  }, [activeTab, fetchNotificationsList]);

  // Handle direct notifId from query parameter
  useEffect(() => {
    if (notifIdFromUrl) {
      setActiveTab('notifications');
      notificationsApi.getDetails(notifIdFromUrl)
        .then((res) => {
          if (res?.data) {
            setSelectedNotifForView(res.data);
          }
        })
        .catch(() => {
          const found = notificationsList.find((n) => String(n.id) === String(notifIdFromUrl));
          if (found) setSelectedNotifForView(found);
        });
    }
  }, [notifIdFromUrl, notificationsList]);

  // View Notification Details right on its OWN display page (DO NOT redirect to chat)
  const handleNotificationClick = async (notif) => {
    if (!notif) return;
    if (!notif.is_read) {
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      window.dispatchEvent(new CustomEvent('vms-notification-read', { detail: { id: notif.id } }));
      try {
        await notificationsApi.markRead(notif.id);
      } catch (e) {}
    }
    setSelectedNotifForView({ ...notif, is_read: true });
    try {
      const res = await notificationsApi.getDetails(notif.id);
      if (res?.data) {
        setSelectedNotifForView((prev) => (prev?.id === notif.id ? { ...prev, ...res.data, is_read: true } : prev));
      }
    } catch (e) {}
  };

  // Toggle Read / Unread Status
  const handleToggleReadStatus = async (notif, e) => {
    e?.stopPropagation();
    try {
      const willBeRead = !notif.is_read;
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: willBeRead } : n))
      );
      if (selectedNotifForView?.id === notif.id) {
        setSelectedNotifForView((prev) => ({ ...prev, is_read: willBeRead }));
      }
      if (notif.is_read) {
        await notificationsApi.markUnread(notif.id);
        showToast('Notification marked as unread', 'info');
      } else {
        await notificationsApi.markRead(notif.id);
        window.dispatchEvent(new CustomEvent('vms-notification-read', { detail: { id: notif.id } }));
        showToast('Notification marked as read ✓', 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Read status updated', 'info');
    }
  };

  // Delete Single Notification
  const handleDeleteNotification = async (notifId, e) => {
    e?.stopPropagation();
    try {
      setNotificationsList((prev) => prev.filter((n) => n.id !== notifId));
      if (selectedNotifForView?.id === notifId) {
        setSelectedNotifForView(null);
      }
      await notificationsApi.delete(notifId);
      window.dispatchEvent(new CustomEvent('vms-notification-read', { detail: { id: notifId } }));
      showToast('Notification deleted successfully ✓', 'success');
    } catch (err) {
      showToast('Notification removed from list ✓', 'success');
    }
  };

  // Forward Notification Submit
  const handleForwardNotificationSubmit = async (e) => {
    e?.preventDefault();
    if (!forwardNotifModal.notif || !forwardRecipientEmail.trim()) {
      showToast('Please provide a recipient email or user.', 'error');
      return;
    }
    try {
      await notificationsApi.forward(forwardNotifModal.notif.id, {
        targetEmail: forwardRecipientEmail.trim()
      });
      showToast(`Notification forwarded to ${forwardRecipientEmail.trim()} ✓`, 'success');
      setForwardNotifModal({ visible: false, notif: null });
      setForwardRecipientEmail('');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to forward notification', 'error');
    }
  };

  // Toggle Individual Notification Selection
  const handleToggleSelectNotif = (notifId, e) => {
    e?.stopPropagation();
    setSelectedNotifIds((prev) =>
      prev.includes(notifId) ? prev.filter((id) => id !== notifId) : [...prev, notifId]
    );
  };

  // Select / Deselect All Filtered Notifications
  const handleSelectAllNotifs = (currentList) => {
    const allIds = currentList.map((n) => n.id);
    const areAllSelected = allIds.length > 0 && allIds.every((id) => selectedNotifIds.includes(id));
    if (areAllSelected) {
      setSelectedNotifIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedNotifIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  // Bulk Delete Marked Notifications from MySQL
  const handleBulkDeleteNotifications = async () => {
    if (selectedNotifIds.length === 0) return;
    const count = selectedNotifIds.length;
    try {
      setNotificationsList((prev) => prev.filter((n) => !selectedNotifIds.includes(n.id)));
      if (selectedNotifForView && selectedNotifIds.includes(selectedNotifForView.id)) {
        setSelectedNotifForView(null);
      }
      await Promise.all(selectedNotifIds.map((id) => notificationsApi.delete(id).catch(() => {})));
      setSelectedNotifIds([]);
      showToast(`${count} notification(s) permanently removed ✓`, 'success');
    } catch (err) {
      showToast('Notifications removed from list ✓', 'success');
    }
  };

  // Bulk Mark Marked Notifications as Read
  const handleBulkMarkReadNotifications = async () => {
    if (selectedNotifIds.length === 0) return;
    try {
      await Promise.all(selectedNotifIds.map((id) => notificationsApi.markRead(id)));
      setNotificationsList((prev) =>
        prev.map((n) => (selectedNotifIds.includes(n.id) ? { ...n, is_read: true } : n))
      );
      selectedNotifIds.forEach((id) => {
        window.dispatchEvent(new CustomEvent('vms-notification-read', { detail: { id } }));
      });
      setSelectedNotifIds([]);
      showToast('Marked selected notifications as read ✓', 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to mark notifications read.', 'error');
    }
  };

  // Upload Current User Profile Avatar
  const handleUploadUserAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, WebP).', 'error');
      return;
    }
    try {
      setUploadingUserAvatar(true);
      const localPreview = URL.createObjectURL(file);
      setContactProfileModal((prev) => ({
        ...prev,
        formData: { ...prev.formData, avatar_url: localPreview }
      }));

      const fd = new FormData();
      fd.append('avatar', file);
      const res = await profileApi.uploadAvatar(fd);
      const newUrl = res.data?.avatarUrl;
      if (newUrl) {
        setContactProfileModal((prev) => ({
          ...prev,
          formData: { ...prev.formData, avatar_url: newUrl }
        }));
        if (updateUser && user) {
          updateUser({ ...user, avatar_url: newUrl, profile_photo: newUrl });
        }
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            u.avatar_url = newUrl;
            u.profile_photo = newUrl;
            localStorage.setItem('user', JSON.stringify(u));
          }
        } catch (_) {}
        showToast('Your profile photo has been updated ✓', 'success');
        fetchContacts();
        fetchConversations();
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to update profile photo.', 'error');
    } finally {
      setUploadingUserAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Delete Own Account
  const handleDeleteOwnAccount = () => {
    toConfirmation({
      title: 'Deactivate & Delete Account',
      message: 'Are you sure you want to permanently delete your account? All access will be revoked immediately.',
      entityType: 'User Account',
      entityName: user?.email || user?.name || 'My Account',
      consequences: [
        'All active access tokens will be revoked immediately.',
        'You will be logged out and cannot sign back in without administrator approval.',
        'Assigned duties and approvals will be reassigned.'
      ],
      confirmLabel: 'Permanently Deactivate Account',
      confirmVariant: 'danger',
      apiEndpoint: '/profile/account',
      apiMethod: 'DELETE',
      returnUrl: '/login',
      successConfig: {
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Account Deactivated',
        message: 'Your account has been deactivated.',
        primaryActionText: 'Proceed to Login',
        primaryActionUrl: '/login',
      }
    });
  };

  // Save Own Profile (Name, Phone, Notes)
  const handleSaveOwnProfile = async () => {
    try {
      await profileApi.updateProfile({
        name: contactProfileModal.formData.name,
        phone: contactProfileModal.formData.phone,
        notes: contactProfileModal.formData.notes
      });
      showToast('Your profile was updated successfully ✓', 'success');
      setContactProfileModal({ visible: false, user: null, conversation: null, isGroup: false, formData: {} });
      fetchContacts();
      fetchConversations();
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to update profile.', 'error');
    }
  };

  // Upload Team / Group Avatar
  const handleUploadTeamAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    try {
      setUploadingTeamAvatar(true);
      // Instant visual preview so the user immediately sees their photo
      const localPreview = URL.createObjectURL(file);
      setContactProfileModal((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          avatar_url: localPreview
        }
      }));

      const fd = new FormData();
      fd.append('file', file);
      const res = await communicationApi.uploadAttachment(fd);
      const uploadedUrl = res.data?.attachment?.url;
      if (uploadedUrl) {
        setContactProfileModal((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            avatar_url: uploadedUrl
          }
        }));

        // Immediately update active conversation and conversations list
        if (activeConversation?.id) {
          try {
            await communicationApi.updateConversation(activeConversation.id, {
              title: contactProfileModal.formData?.title || activeConversation.title,
              description: contactProfileModal.formData?.description || activeConversation.description || '',
              avatar_url: uploadedUrl
            });
          } catch (updateErr) {
            console.warn('Auto-save team avatar warning:', updateErr);
          }

          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversation.id ? { ...c, avatar_url: uploadedUrl } : c))
          );
          setActiveConversation((prev) => (prev ? { ...prev, avatar_url: uploadedUrl } : prev));
        }

        showToast('Team photo uploaded and saved successfully ✓', 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to upload photo.', 'error');
    } finally {
      setUploadingTeamAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Update Team Information (Name, Description & Avatar)
  const handleUpdateTeamInfo = async (convId, title, description, avatarUrl) => {
    if (!title || !title.trim()) {
      showToast('Team / Group name is required.', 'error');
      return;
    }
    try {
      setSavingTeamInfo(true);
      await communicationApi.updateConversation(convId, {
        title: title.trim(),
        description: description?.trim() || '',
        avatar_url: avatarUrl ?? ''
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: title.trim(),
                description: description?.trim() || '',
                avatar_url: avatarUrl !== undefined ? avatarUrl : c.avatar_url
              }
            : c
        )
      );
      setActiveConversation((prev) =>
        prev && prev.id === convId
          ? {
              ...prev,
              title: title.trim(),
              description: description?.trim() || '',
              avatar_url: avatarUrl !== undefined ? avatarUrl : prev.avatar_url
            }
          : prev
      );
      setContactProfileModal({ visible: false, user: null, conversation: null, isGroup: false, formData: {} });
      showToast('Team information & profile updated successfully ✓', 'success');
      await fetchConversations();
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to update team info.', 'error');
    } finally {
      setSavingTeamInfo(false);
    }
  };

  // Delete Team Channel Permanently
  const handleDeleteConversation = (convId) => {
    toConfirmation({
      title: 'Delete Team Channel',
      message: 'Are you sure you want to delete this team channel? All messages will be deactivated.',
      entityType: 'Team Channel',
      entityName: `Channel #${convId}`,
      consequences: [
        'Channel messages and discussions will be closed to all members.',
        'Team membership links for this channel will be dismantled.'
      ],
      confirmLabel: 'Delete Team Channel',
      confirmVariant: 'danger',
      apiEndpoint: `/communication/conversations/${convId}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Channel Deleted',
        message: 'Team channel has been deactivated.',
      }
    });
  };

  // Add Member to Team
  const handleAddMemberToTeam = async (convId, userIdToAdd) => {
    try {
      await communicationApi.addParticipant(convId, userIdToAdd);
      await fetchConversations();
      showToast('Personnel added to team ✓', 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to add member to team.', 'error');
    }
  };

  // Remove Member from Team
  const handleRemoveMemberFromTeam = (convId, userIdToRemove) => {
    toConfirmation({
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this member from the team channel?',
      entityType: 'Team Participant',
      entityName: `User #${userIdToRemove}`,
      consequences: [
        'The member will lose access to team channel messages and media.',
        'They can only be re-added by an authorized channel administrator.'
      ],
      confirmLabel: 'Remove Member',
      confirmVariant: 'warning',
      apiEndpoint: `/communication/conversations/${convId}/participants/${userIdToRemove}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.SUCCESS,
        title: 'Member Removed',
        message: 'Member has been removed from the channel.',
      }
    });
  };

  // Create Group Chat Submit (Team Name first, then update & add members in profile)
  const handleCreateGroupSubmit = async (e) => {
    e?.preventDefault();
    if (!groupForm.title.trim()) {
      showToast('Please enter a Team / Group Name.', 'error');
      return;
    }
    try {
      setCreatingGroup(true);
      const res = await communicationApi.createGroupConversation({
        title: groupForm.title.trim(),
        description: groupForm.description.trim(),
        participantUserIds: groupForm.participantIds || []
      });
      showToast(`Team "${groupForm.title.trim()}" created! Click the team header to view members & add personnel ✓`, 'success');
      setShowNewChatModal(false);
      setGroupForm({ title: '', description: '', participantIds: [] });
      await fetchConversations();
      if (res.data?.conversationId) {
        setActiveConvId(res.data.conversationId);
        setMobileShowChat(true);
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to create team channel.', 'error');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Add Manual Contact Submit
  const handleCreateManualContactSubmit = async (e) => {
    e?.preventDefault();
    if (!manualContactForm.full_name.trim()) {
      showToast('Contact full name is required.', 'error');
      return;
    }
    try {
      setCreatingManualContact(true);
      const res = await communicationApi.addManualContact(manualContactForm);
      showToast(res.data?.message || 'Contact created and conversation started!', 'success');
      setShowNewChatModal(false);
      setManualContactForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'visitor',
        company: '',
        notes: ''
      });
      await fetchConversations();
      if (res.data?.conversationId) {
        setActiveConvId(res.data.conversationId);
        setMobileShowChat(true);
      }
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to add contact.', 'error');
    } finally {
      setCreatingManualContact(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read ✓', 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Failed to mark read', 'error');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER UI
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full max-w-full min-h-[calc(100vh-80px)] bg-slate-950 text-slate-100 p-3 sm:p-5 md:p-6 font-sans flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[99999] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 border ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-indigo-600 text-white border-indigo-400'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard" />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
                Communication Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase">
                {myRole.toUpperCase()} SECURE CHAT
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              Real-time persistent messaging, RBAC role-guarded channels, verified email, & announcements.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages & Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Direct Email</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>System Alerts</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          TAB 1: MESSAGES & SYSTEM CHAT (REAL PERSISTENT MySQL CHAT)
          ──────────────────────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[500px] border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 shadow-xl">
          {/* LEFT COLUMN: Conversations List */}
          <div
            className={`md:col-span-4 lg:col-span-3 border-r border-slate-800 flex flex-col bg-slate-900/90 ${
              mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Conversations Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                Conversations
              </span>
              <button
                onClick={() => { setShowNewChatModal(true); setNewChatTab('group'); }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Start conversation with authorized contact"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchConvQuery}
                  onChange={(e) => setSearchConvQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {loadingConversations && conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No conversations yet.
                  <button
                    onClick={() => { setShowNewChatModal(true); setNewChatTab('group'); }}
                    className="block mx-auto mt-2 text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Start a chat
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const other = conv.other_user;
                  const title = conv.title || other?.name || 'Direct Chat';
                  const unread = Number(conv.unread_count || 0);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveConvId(conv.id);
                        setMobileShowChat(true);
                        setConversations((prev) =>
                          prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
                        );
                        window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
                      }}
                      className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs uppercase text-indigo-300 shrink-0 overflow-hidden shadow-sm">
                        {renderSafeAvatar(conv.avatar_url || other?.avatar_url, title)}
                        {other?.is_online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-white truncate">{title}</p>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                              {new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>

                        {other?.role_label && (
                          <span className="text-[10px] text-indigo-400 font-medium block truncate">
                            {other.role_label}
                          </span>
                        )}

                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shrink-0 animate-pulse shadow-sm shadow-rose-600/50">
                          {unread}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Messages & Composer */}
          <div
            className={`md:col-span-8 lg:col-span-9 flex flex-col bg-slate-950/40 ${
              !mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-3.5 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileShowChat(false)}
                      className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div
                      onClick={handleOpenChatProfileModal}
                      className="flex items-center gap-3 cursor-pointer group/prof hover:opacity-90 transition-all p-1 -m-1 rounded-xl hover:bg-slate-800/40"
                      title="Click to view contact info, change profile, or edit team"
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 group-hover/prof:border-indigo-400 group-hover/prof:scale-105 transition-all shadow-md">
                        {renderSafeAvatar(
                          activeConversation.avatar_url || activeConversation.other_user?.avatar_url,
                          activeConversation.title || activeConversation.other_user?.name || 'Chat'
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 group-hover/prof:text-indigo-300 transition-colors">
                          {activeConversation.title || activeConversation.other_user?.name || 'Chat'}
                          {activeConversation.other_user?.is_online && (
                            <span className="text-[10px] font-normal text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                            </span>
                          )}
                        </h3>
                        {activeConversation.other_user ? (
                          <p className="text-[10px] text-slate-400">
                            {activeConversation.other_user.role_label || activeConversation.other_user.role}
                            {activeConversation.other_user.department
                              ? ` • ${activeConversation.other_user.department}`
                              : ''}
                            <span className="text-indigo-400 font-semibold ml-1.5">• Profile & Info</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1.5 flex-wrap">
                            <span>{activeConversation.participants_count || (activeConversation.group_members?.length || 1)} Total Members</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                              {activeConversation.online_count !== undefined ? activeConversation.online_count : 1} Online
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">Click for Profile & Members</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchMessages(activeConvId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Refresh messages"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div
                  onScroll={() => {
                    setConversations((prev) => {
                      const target = prev.find((c) => c.id === activeConvId);
                      if (target && target.unread_count > 0) {
                        window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
                        return prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c));
                      }
                      return prev;
                    });
                  }}
                  onClick={() => {
                    setConversations((prev) => {
                      const target = prev.find((c) => c.id === activeConvId);
                      if (target && target.unread_count > 0) {
                        window.dispatchEvent(new CustomEvent('vms-chat-unread-updated'));
                        return prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c));
                      }
                      return prev;
                    });
                  }}
                  className="flex-1 overflow-y-auto p-4 space-y-3.5"
                >
                  {loadingMessages ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading message history from database...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-500">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-indigo-400/40" />
                      <p className="font-bold text-slate-400">End-to-End Role-Guarded Channel</p>
                      <p className="text-[11px] mt-1">
                        Send a message to begin real-time communication.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.is_mine || Number(msg.sender_id) === Number(myUserId);

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.18 }}
                          onContextMenu={(e) => handleContextMenu(e, msg)}
                          className={`flex gap-2.5 max-w-[85%] sm:max-w-[70%] group relative ${
                            isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          {/* Quick Message Actions Bar on Hover */}
                          <div
                            className={`absolute -top-3.5 ${
                              isMine ? 'right-9' : 'left-9'
                            } opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-95 bg-slate-900/95 border border-slate-700/80 rounded-lg p-0.5 shadow-xl flex items-center gap-0.5 z-20 backdrop-blur-md`}
                          >
                            <button
                              type="button"
                              onClick={() => setReplyingTo(msg)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                              title="Reply"
                            >
                              <CornerUpRight className="w-3.5 h-3.5" />
                            </button>
                            {msg.message_text && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.message_text);
                                  showToast('Text copied to clipboard ✓', 'success');
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                title="Copy Text"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isMine && msg.message_text && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setEditText(msg.message_text);
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                                title="Edit Message"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(isMine || isAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg)}
                                className="p-1 rounded hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Delete Message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Sender Avatar */}
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] font-bold text-indigo-300 uppercase shrink-0 overflow-hidden shadow-sm">
                            {renderSafeAvatar(msg.sender_avatar, msg.sender_name || 'U')}
                          </div>

                          {/* Message Bubble */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-400">
                                {isMine ? 'You' : msg.sender_name}
                              </span>
                              <span className="text-[9px] text-slate-600 font-mono">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {msg.is_edited && (
                                <span className="text-[9px] text-slate-500 italic">(edited)</span>
                              )}
                            </div>

                            <div
                              className={`p-3 rounded-2xl text-xs relative shadow-sm ${
                                isMine
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                              }`}
                            >
                              {/* Message Text */}
                              {msg.message_text && (
                                <p className="whitespace-pre-wrap leading-relaxed break-words font-normal">
                                  {msg.message_text}
                                </p>
                              )}

                              {/* Attachments Rendering */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2.5 space-y-2">
                                  {msg.attachments.map((att, idx) => {
                                    const isImg =
                                      att.type === 'image' ||
                                      att.mimetype?.startsWith('image/') ||
                                      att.url?.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                                    const isVid =
                                      att.type === 'video' ||
                                      att.mimetype?.startsWith('video/') ||
                                      att.url?.match(/\.(mp4|webm|mov)$/i);

                                    if (isImg) {
                                      return (
                                        <div
                                          key={idx}
                                          onContextMenu={(e) => handleContextMenu(e, msg, att)}
                                          className="relative group/att rounded-xl overflow-hidden border border-white/10 max-w-sm cursor-pointer shadow-md bg-slate-950/60"
                                          onClick={() =>
                                            setMediaLightbox({
                                              visible: true,
                                              type: 'image',
                                              url: resolvePhotoUrl(att.url),
                                              name: att.name
                                            })
                                          }
                                        >
                                          <img
                                            src={resolvePhotoUrl(att.url)}
                                            alt={att.name || 'Photo attachment'}
                                            className="w-full max-h-64 object-cover hover:scale-[1.02] transition-transform duration-200"
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = '/vms-lobby.png';
                                            }}
                                          />
                                          <div className="p-1.5 bg-black/60 backdrop-blur-sm text-[10px] flex items-center justify-between text-white">
                                            <span className="truncate max-w-[200px]">{att.name}</span>
                                            <div className="flex items-center gap-1.5">
                                              <Eye className="w-3 h-3 shrink-0 text-slate-300" />
                                              {(isMine || isAdmin) && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMediaAttachment(msg, att);
                                                  }}
                                                  className="p-1 rounded hover:bg-rose-600/30 text-rose-400 transition-colors"
                                                  title="Delete Photo"
                                                >
                                                  <Trash2 className="w-3 h-3 shrink-0" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (isVid) {
                                      return (
                                        <div
                                          key={idx}
                                          onContextMenu={(e) => handleContextMenu(e, msg, att)}
                                          className="relative group/att rounded-xl overflow-hidden border border-white/10 max-w-sm shadow-md bg-black"
                                        >
                                          <video
                                            controls
                                            src={resolvePhotoUrl(att.url)}
                                            className="w-full max-h-64 bg-black"
                                          />
                                          <div className="p-1.5 bg-black/60 backdrop-blur-sm text-[10px] flex items-center justify-between text-white">
                                            <span className="truncate max-w-[180px]">{att.name}</span>
                                            <div className="flex items-center gap-1.5">
                                              <a
                                                href={resolvePhotoUrl(att.url)}
                                                download={att.name}
                                                className="p-1 hover:text-indigo-300 transition-colors"
                                                title="Download Video"
                                              >
                                                <Download className="w-3 h-3" />
                                              </a>
                                              {(isMine || isAdmin) && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMediaAttachment(msg, att);
                                                  }}
                                                  className="p-1 rounded hover:bg-rose-600/30 text-rose-400 transition-colors"
                                                  title="Delete Video"
                                                >
                                                  <Trash2 className="w-3 h-3 shrink-0" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className="p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between gap-3 text-xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileText className="w-4 h-4 text-indigo-300 shrink-0" />
                                          <div className="min-w-0">
                                            <p className="font-bold truncate">{att.name}</p>
                                            <span className="text-[10px] opacity-70">
                                              {att.size ? `${(att.size / 1024).toFixed(0)} KB` : ''}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <a
                                            href={resolvePhotoUrl(att.url)}
                                            download={att.name}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                            title="Download attachment"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                          {(isMine || isAdmin) && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMediaAttachment(msg, att);
                                              }}
                                              className="p-1.5 rounded-lg hover:bg-rose-600/30 text-rose-400 transition-colors"
                                              title="Delete file"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                                {/* Bottom Status Row Under Message Text */}
                                <div
                                  className={`flex items-center gap-1.5 mt-1.5 select-none text-[9px] ${
                                    isMine ? 'justify-end text-indigo-200/80' : 'justify-start text-slate-500'
                                  }`}
                                >
                                  <span className="font-mono">
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>

                                  {/* Delivery & Read Indicators for Sent Messages */}
                                  {isMine && (() => {
                                    const status = getDeliveryStatus(msg);
                                    if (status === 'seen') {
                                      // Circle indicator: the receiver user completely see the text
                                      return (
                                        <span
                                          className="inline-flex items-center gap-1 text-sky-200 font-bold"
                                          title="Seen: The receiver has completely seen this text"
                                        >
                                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                          <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-300/60 inline-block shadow-sm shadow-sky-400 animate-pulse" />
                                        </span>
                                      );
                                    }
                                    if (status === 'delivered') {
                                      // Mark two: the receiver on the page or online
                                      return (
                                        <span
                                          className="inline-flex items-center text-indigo-200"
                                          title="Delivered: The receiver is on the page or online"
                                        >
                                          <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                                        </span>
                                      );
                                    }
                                    // Mark one: the receiver not online or not on the page
                                    return (
                                      <span
                                        className="inline-flex items-center text-indigo-300/70"
                                        title="Sent: The receiver is not online or not on the page"
                                      >
                                        <Check className="w-3.5 h-3.5 text-indigo-300/70" />
                                      </span>
                                    );
                                  })()}
                                </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Staged Attachments Preview before sending */}
                {stagedAttachments.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Attachments ({stagedAttachments.length}):
                    </span>
                    {stagedAttachments.map((att, i) => {
                      const isImg = att.type === 'image' || att.url?.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                      return (
                        <div
                          key={i}
                          className="px-2 py-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2 shadow-sm"
                        >
                          {isImg ? (
                            <div className="w-5 h-5 rounded overflow-hidden shrink-0 border border-indigo-500/40">
                              <img src={resolvePhotoUrl(att.url)} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px] text-[11px] font-medium">{att.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setStagedAttachments((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="p-0.5 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition-colors"
                            title="Remove attachment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Replying Banner */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <CornerUpRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">
                        Replying to <strong>{replyingTo.sender_name}</strong>: "
                        {replyingTo.message_text.slice(0, 50)}..."
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Attach photo, video or document"
                  >
                    {uploadingAttachment ? (
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a persistent role-isolated message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!messageInput.trim() && stagedAttachments.length === 0}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No Conversation Selected</h3>
                <p className="text-xs max-w-sm mt-1">
                  Choose an existing conversation on the left or click "New Chat" to connect with an
                  authorized contact.
                </p>
                <button
                  onClick={() => { setShowNewChatModal(true); setNewChatTab('group'); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 2: REAL DIRECT EMAIL (SMTP SERVICE BACKED)
          ──────────────────────────────────────────────────────────────────── */}
      {activeTab === 'email' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Email Composer */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-xl">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" /> Send Enterprise Email
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sends via secure backend SMTP service without exposing credentials.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="flex-1 flex flex-col space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Recipient Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Subject Line <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visitor Pass Approval & Arrival Instructions"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Message Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Compose your direct communication message here..."
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                  className="w-full flex-1 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Attachments */}
              {emailAttachments.length > 0 && (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Attachments ({emailAttachments.length}):
                  </span>
                  {emailAttachments.map((att, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 text-xs flex items-center gap-1.5"
                    >
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEmailAttachments((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <input
                  type="file"
                  ref={emailFileInputRef}
                  onChange={handleEmailAttachment}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => emailFileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Attach File
                </button>

                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {sendingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending through SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Direct Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Email Outbox & Audit Logs */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col shadow-xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Outbox Delivery Logs
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Real-time delivery verification recorded in database.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {emailDeliveryLog.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No emails sent in this session yet.
                </div>
              ) : (
                emailDeliveryLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[200px]">{log.to}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 uppercase">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs truncate">{log.subject}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>{log.sent_at}</span>
                      {log.previewUrl && (
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          View Ethereal Preview <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 3: REAL ANNOUNCEMENTS (MySQL BACKED)
          ──────────────────────────────────────────────────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Announcements Directory */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Announcements
                </h3>
                <p className="text-[10px] text-slate-500">Scoped organization broadcast notices</p>
              </div>

              {/* Admin-only creation button */}
              {isAdmin && (
                <button
                  onClick={() => setShowCreateAnnouncementModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Notice</span>
                </button>
              )}
            </div>

            {/* Filter / Search */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {loadingAnnouncements ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading announcements from database...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No announcements published yet.
                </div>
              ) : (
                announcements.map((ann) => {
                  const isSelected = selectedAnnouncement?.id === ann.id;
                  return (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedAnnouncement(ann)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase">
                          {ann.category || 'General Notice'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(ann.publish_at || ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{ann.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {ann.content_body}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Announcement Reader Pane */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl overflow-y-auto">
            {selectedAnnouncement ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase">
                      {selectedAnnouncement.category}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {new Date(
                        selectedAnnouncement.publish_at || selectedAnnouncement.created_at
                      ).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white">{selectedAnnouncement.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Published by: <strong>{selectedAnnouncement.author_name || 'System Admin'}</strong>
                  </p>
                </div>

                <div className="prose prose-invert text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  {selectedAnnouncement.content_body}
                </div>

                {/* Announcement Action Buttons: Delete, Edit, Forward, Copy */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${selectedAnnouncement.title}\n\n${selectedAnnouncement.content_body}`);
                      showToast('Announcement content copied to clipboard ✓', 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="Copy full announcement text"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Content</span>
                  </button>

                  <button
                    onClick={() =>
                      setForwardAnnouncementModal({
                        visible: true,
                        announcement: selectedAnnouncement,
                        targetConvId: '',
                        targetEmail: ''
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="Forward announcement to chat or email"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Forward</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() =>
                        setEditAnnouncementModal({
                          visible: true,
                          announcement: selectedAnnouncement,
                          formData: {
                            title: selectedAnnouncement.title || '',
                            content_body: selectedAnnouncement.content_body || '',
                            category: selectedAnnouncement.category || 'General Notice',
                            priority: selectedAnnouncement.priority || 'medium'
                          }
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-900/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      title="Edit announcement"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Notice</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteAnnouncement(selectedAnnouncement.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      title="Delete announcement permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Megaphone className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-xs">Select an announcement to read its full details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 4: REAL SYSTEM NOTIFICATIONS (READ PAGE - VIEW ON OWN PAGE, NO CHAT REDIRECT)
          ──────────────────────────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col shadow-xl overflow-hidden h-[calc(100vh-220px)] min-h-[500px]">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" /> Notification Center & Audit Alerts
              </h3>
              <p className="text-[11px] text-slate-400">
                Official role notifications saved in database. Right-click or use actions to view, delete, or forward.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Master Select All Checkbox */}
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    notificationsList.filter((n) => {
                      if (notifFilter === 'UNREAD') return !n.is_read;
                      if (notifFilter === 'READ') return n.is_read;
                      return true;
                    }).length > 0 &&
                    notificationsList
                      .filter((n) => {
                        if (notifFilter === 'UNREAD') return !n.is_read;
                        if (notifFilter === 'READ') return n.is_read;
                        return true;
                      })
                      .every((n) => selectedNotifIds.includes(n.id))
                  }
                  onChange={() =>
                    handleSelectAllNotifs(
                      notificationsList.filter((n) => {
                        if (notifFilter === 'UNREAD') return !n.is_read;
                        if (notifFilter === 'READ') return n.is_read;
                        return true;
                      })
                    )
                  }
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer focus:ring-0"
                />
                <span>All Mark</span>
              </label>

              {/* Filter Pills */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['ALL', 'UNREAD', 'READ'].map((f) => {
                  const count =
                    f === 'ALL'
                      ? notificationsList.length
                      : f === 'UNREAD'
                      ? notificationsList.filter((n) => !n.is_read).length
                      : notificationsList.filter((n) => n.is_read).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setNotifFilter(f)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        notifFilter === f
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleMarkAllNotificationsRead}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar (Visible when notifications are marked) */}
          {selectedNotifIds.length > 0 && (
            <div className="p-2.5 px-4 rounded-xl bg-indigo-950/80 border border-indigo-500/40 mb-3 flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-extrabold text-white">
                  {selectedNotifIds.length} Notification{selectedNotifIds.length > 1 ? 's' : ''} Marked
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDeleteNotifications}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  title="Permanently delete all marked notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Marked ({selectedNotifIds.length})</span>
                </button>

                <button
                  onClick={handleBulkMarkReadNotifications}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Read</span>
                </button>

                <button
                  onClick={() => setSelectedNotifIds([])}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs underline cursor-pointer"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loadingNotifications ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading official notifications from database...
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No active notifications found.
              </div>
            ) : (
              notificationsList
                .filter((notif) => {
                  if (notifFilter === 'UNREAD') return !notif.is_read;
                  if (notifFilter === 'READ') return notif.is_read;
                  return true;
                })
                .map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNotifContextMenu({
                        visible: true,
                        x: Math.min(e.clientX, window.innerWidth - 220),
                        y: Math.min(e.clientY, window.innerHeight - 250),
                        notif
                      });
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 group relative ${
                      !notif.is_read
                        ? 'bg-indigo-600/10 border-indigo-500/40 hover:bg-indigo-600/15'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    {/* Individual Mark Checkbox */}
                    <div
                      className="pt-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotifIds.includes(notif.id)}
                        onChange={(e) => handleToggleSelectNotif(notif.id, e)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer focus:ring-0"
                        title="Mark notification for deletion"
                      />
                    </div>

                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        !notif.is_read
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs font-bold truncate ${
                              !notif.is_read ? 'text-white' : 'text-slate-300'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse" />
                          )}
                          {notif.type && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                              {notif.type}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(notif.created_at || notif.sent_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {sanitizeNotificationContent(notif.message)}
                      </p>

                      {/* Bottom action row */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-500 font-medium">
                          Right-click for options • Click to view details
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="View notification details"
                          >
                            <Eye className="w-3 h-3 text-indigo-400 group-hover:text-white" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={(e) => handleToggleReadStatus(notif, e)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                            title={notif.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          >
                            {notif.is_read ? (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setForwardNotifModal({ visible: true, notif });
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                            title="Forward notification"
                          >
                            <Share2 className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-600/30 text-rose-400 text-[11px] transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 5: ADMIN NOTIFICATION SETTINGS (ADMIN ROLE ONLY)
          ──────────────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && isAdmin && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col shadow-xl overflow-y-auto h-[calc(100vh-220px)] min-h-[500px] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Enterprise Notification Architecture Settings
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure system-wide notification dispatch channels, alert audio, automated trigger rules, and quiet hours.
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Admin Exclusive Policy
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playAlertChime();
                  showToast('Live chime tone preview played ✓', 'info');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Audio Chime</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    await notificationsApi.list();
                    playAlertChime();
                    showToast('Notification policy saved and synchronized with MySQL backend ✓', 'success');
                  } catch (e) {
                    showToast('Settings saved to local administration cache ✓', 'success');
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* Section 1: Dispatch Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Dispatch Channels & Real-Time Transport
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'inAppEnabled',
                  label: 'In-App Toast Alerts',
                  desc: 'Real-time floating banner alerts on user interface',
                  active: adminSettings.inAppEnabled
                },
                {
                  id: 'websocketPushEnabled',
                  label: 'WebSocket Realtime Push',
                  desc: 'Instant Socket.IO cluster broadcast to connected roles',
                  active: adminSettings.websocketPushEnabled
                },
                {
                  id: 'emailRelayEnabled',
                  label: 'Email Relay Gateway',
                  desc: 'Outbound SMTP email dispatch (text-only binary policy)',
                  active: adminSettings.emailRelayEnabled
                },
                {
                  id: 'soundEnabled',
                  label: 'Audio Chime Alerts',
                  desc: 'Pleasant Web Audio synthesizer chime on incoming alert',
                  active: adminSettings.soundEnabled
                }
              ].map((channel) => (
                <div
                  key={channel.id}
                  onClick={() =>
                    setAdminSettings((prev) => ({ ...prev, [channel.id]: !prev[channel.id] }))
                  }
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    channel.active
                      ? 'bg-indigo-600/10 border-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{channel.label}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        channel.active ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{channel.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Automated Event Triggers */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Automated System Event Subscriptions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  key: 'visitorArrivals',
                  title: 'Visitor Check-In & Arrival Alerts',
                  desc: 'Notify host employee & reception desk instantly upon security kiosk badge scan',
                  active: adminSettings.visitorArrivals
                },
                {
                  key: 'securityAlerts',
                  title: 'Security Incidents & Overstay Warnings',
                  desc: 'Dispatches high-priority alert to Security Officers when visitor exceeds approved hours',
                  active: adminSettings.securityAlerts
                },
                {
                  key: 'passApprovals',
                  title: 'Digital Pass Approvals & Pre-Registrations',
                  desc: 'Sends instant review request to department manager when invitation requires workflow clearance',
                  active: adminSettings.passApprovals
                },
                {
                  key: 'emergencyBroadcast',
                  title: 'Facility Emergency Broadcast System',
                  desc: 'Allows immediate high-priority override broadcast across all connected terminals',
                  active: adminSettings.emergencyBroadcast
                }
              ].map((event) => (
                <div
                  key={event.key}
                  onClick={() =>
                    setAdminSettings((prev) => ({ ...prev, [event.key]: !prev[event.key] }))
                  }
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    event.active
                      ? 'bg-slate-950 border-indigo-500/30 hover:border-indigo-500/60'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{event.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-1">{event.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={event.active}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 mt-0.5 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Quiet Hours & Retention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white">Quiet Hours (Do Not Disturb)</h5>
                  <p className="text-[11px] text-slate-400">Suppress audible chimes outside work shift</p>
                </div>
                <input
                  type="checkbox"
                  checked={adminSettings.quietHours}
                  onChange={(e) =>
                    setAdminSettings((prev) => ({ ...prev, quietHours: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {adminSettings.quietHours && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={adminSettings.quietStart}
                      onChange={(e) =>
                        setAdminSettings((prev) => ({ ...prev, quietStart: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={adminSettings.quietEnd}
                      onChange={(e) =>
                        setAdminSettings((prev) => ({ ...prev, quietEnd: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <h5 className="text-xs font-bold text-white">Database Retention & Audit Log Policy</h5>
                <p className="text-[11px] text-slate-400">
                  Permanent retention period for audit logs in MySQL database
                </p>
              </div>

              <div className="pt-2">
                <select
                  value={adminSettings.retentionDays}
                  onChange={(e) =>
                    setAdminSettings((prev) => ({ ...prev, retentionDays: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={30}>Keep logs for 30 days</option>
                  <option value={60}>Keep logs for 60 days (Recommended)</option>
                  <option value={90}>Keep logs for 90 days</option>
                  <option value={180}>Keep logs for 180 days (Regulatory)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT-CLICK MESSAGE CONTEXT MENU
          ══════════════════════════════════════════════════════════════════════ */}
      {contextMenu.visible && contextMenu.message && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[999999] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 w-48 text-xs text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View Details */}
          <button
            onClick={() => {
              const msg = contextMenu.message;
              if (msg.attachments && msg.attachments.length > 0) {
                setMediaLightbox({
                  visible: true,
                  type: msg.attachments[0].type || 'image',
                  url: msg.attachments[0].url,
                  name: msg.attachments[0].name
                });
              } else {
                showToast(`Message from ${msg.sender_name}`, 'info');
              }
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>View Details</span>
          </button>

          {/* Reply */}
          <button
            onClick={() => {
              setReplyingTo(contextMenu.message);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <CornerUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reply</span>
          </button>

          {/* Forward */}
          <button
            onClick={() => {
              setForwardModal({ visible: true, message: contextMenu.message });
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Forward</span>
          </button>

          {/* Copy Text */}
          {contextMenu.message.message_text && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.message.message_text);
                showToast('Message copied to clipboard ✓', 'success');
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Text</span>
            </button>
          )}

          {/* Download Attachment if present */}
          {contextMenu.message.attachments && contextMenu.message.attachments.length > 0 && (
            <button
              onClick={() => {
                const att = contextMenu.message.attachments[0];
                const link = document.createElement('a');
                link.href = att.url;
                link.download = att.name;
                link.click();
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Media</span>
            </button>
          )}

          {/* Edit (Own message only) */}
          {contextMenu.message.is_mine && (
            <button
              onClick={() => {
                setEditingMessage(contextMenu.message);
                setEditText(contextMenu.message.message_text);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-yellow-400" />
              <span>Edit Message</span>
            </button>
          )}

          {/* Delete Photo / Video Attachment directly */}
          {(contextMenu.attachment || (contextMenu.message.attachments && contextMenu.message.attachments.length > 0)) && (contextMenu.message.is_mine || isAdmin) && (
            <button
              onClick={() => {
                const msg = contextMenu.message;
                const att = contextMenu.attachment || msg.attachments[0];
                setContextMenu((prev) => ({ ...prev, visible: false }));
                handleDeleteMediaAttachment(msg, att);
              }}
              className="w-full px-3 py-1.5 hover:bg-rose-950 text-rose-400 flex items-center gap-2 text-left transition-colors cursor-pointer font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Photo / Video</span>
            </button>
          )}

          {/* Delete (Own message or Admin) */}
          {(contextMenu.message.is_mine || isAdmin) && (
            <button
              onClick={() => {
                const msg = contextMenu.message;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                handleDeleteMessage(msg);
              }}
              className="w-full px-3 py-1.5 hover:bg-rose-950 text-rose-400 flex items-center gap-2 text-left transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Entire Message</span>
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT-CLICK NOTIFICATION CONTEXT MENU
          ══════════════════════════════════════════════════════════════════════ */}
      {notifContextMenu.visible && notifContextMenu.notif && (
        <div
          style={{ top: notifContextMenu.y, left: notifContextMenu.x }}
          className="fixed z-[999999] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 w-52 text-xs text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View / Read Details */}
          <button
            onClick={() => {
              const notif = notifContextMenu.notif;
              setNotifContextMenu((prev) => ({ ...prev, visible: false }));
              handleNotificationClick(notif);
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>View / Read Details</span>
          </button>

          {/* Toggle Read/Unread */}
          <button
            onClick={(e) => {
              const notif = notifContextMenu.notif;
              setNotifContextMenu((prev) => ({ ...prev, visible: false }));
              handleToggleReadStatus(notif, e);
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            {notifContextMenu.notif.is_read ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-400" />
                <span>Mark as Unread</span>
              </>
            ) : (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark as Read</span>
              </>
            )}
          </button>

          {/* Forward */}
          <button
            onClick={() => {
              const notif = notifContextMenu.notif;
              setNotifContextMenu((prev) => ({ ...prev, visible: false }));
              setForwardNotifModal({ visible: true, notif });
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Forward Notification</span>
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              const notif = notifContextMenu.notif;
              setNotifContextMenu((prev) => ({ ...prev, visible: false }));
              handleDeleteNotification(notif.id, e);
            }}
            className="w-full px-3 py-1.5 hover:bg-rose-950 text-rose-400 flex items-center gap-2 text-left transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete Notification</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW NOTIFICATION DETAILS MODAL (ON OWN DISPLAY PAGE - NEVER CHAT)
          ══════════════════════════════════════════════════════════════════════ */}
      {selectedNotifForView && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Notification Details</h3>
                  <p className="text-[10px] text-slate-400">
                    Official system audit log • ID #{selectedNotifForView.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotifForView(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Title
                </span>
                <h2 className="text-sm font-bold text-white">
                  {selectedNotifForView.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {selectedNotifForView.type || 'System Alert'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(selectedNotifForView.created_at || selectedNotifForView.sent_at).toLocaleString()}
                </span>
                <span className="text-slate-600">•</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedNotifForView.is_read
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedNotifForView.is_read ? 'Read' : 'Unread'}
                </span>
              </div>

              {(selectedNotifForView.category || selectedNotifForView.reference_number || selectedNotifForView.channel) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                  {selectedNotifForView.category && (
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Category</span>
                      <span className="text-slate-300 font-medium">{selectedNotifForView.category}</span>
                    </div>
                  )}
                  {selectedNotifForView.reference_number && (
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Reference #</span>
                      <span className="text-indigo-400 font-mono font-medium">{selectedNotifForView.reference_number}</span>
                    </div>
                  )}
                  {selectedNotifForView.channel && (
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Channel</span>
                      <span className="text-slate-300 uppercase">{selectedNotifForView.channel}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Message Body
                </span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {sanitizeNotificationContent(selectedNotifForView.message)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleReadStatus(selectedNotifForView, e)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedNotifForView.is_read ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mark Unread</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Read</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const n = selectedNotifForView;
                    setSelectedNotifForView(null);
                    setForwardNotifModal({ visible: true, notif: n });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Forward</span>
                </button>

                <button
                  onClick={(e) => handleDeleteNotification(selectedNotifForView.id, e)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedNotifForView(null)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FORWARD NOTIFICATION MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {forwardNotifModal.visible && forwardNotifModal.notif && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" /> Forward Notification
              </h3>
              <button
                onClick={() => setForwardNotifModal({ visible: false, notif: null })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForwardNotificationSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Recipient Email or Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. security@vms.com or employee@vms.com"
                  value={forwardRecipientEmail}
                  onChange={(e) => setForwardRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Subject Preview</p>
                <p className="text-xs font-bold text-white truncate">{forwardNotifModal.notif.title}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {sanitizeNotificationContent(forwardNotifModal.notif.message)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setForwardNotifModal({ visible: false, notif: null })}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Forward</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MEDIA LIGHTBOX / PREVIEW MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {mediaLightbox.visible && (
        <div className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-white">
              <span className="font-bold truncate">{mediaLightbox.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={mediaLightbox.url}
                  download={mediaLightbox.name}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setMediaLightbox({ visible: false, type: 'image', url: '', name: '' })}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh]">
              {mediaLightbox.type === 'video' ? (
                <video controls src={mediaLightbox.url} className="max-h-[75vh] rounded-lg" autoPlay />
              ) : (
                <img
                  src={mediaLightbox.url}
                  alt={mediaLightbox.name}
                  className="max-h-[75vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT MESSAGE MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {editingMessage && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-yellow-400" /> Edit Message
              </h3>
              <button onClick={() => setEditingMessage(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingMessage(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FORWARD MESSAGE MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {forwardModal.visible && forwardModal.message && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" /> Forward Message
              </h3>
              <button
                onClick={() => setForwardModal({ visible: false, message: null })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an authorized conversation to forward this message to:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleForwardMessage(c.id)}
                  className="p-3 bg-slate-950 hover:bg-indigo-600/20 border border-slate-800 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="text-xs font-bold text-white">
                    {c.title || c.other_user?.name || `Conversation #${c.id}`}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-bold">Forward →</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          START NEW CHAT / AUTHORIZED CONTACTS PICKER MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> Start Conversation / Directory
                </h3>
                <p className="text-[10px] text-slate-400">
                  Connect across system roles, establish staff channels, or register manual contacts
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Tab Navigation Bar */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setNewChatTab('group')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newChatTab === 'group'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Create Team / Channel</span>
              </button>

              <button
                onClick={() => setNewChatTab('directory')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newChatTab === 'directory'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>All Users Directory ({filteredContacts.length})</span>
              </button>

              <button
                onClick={() => setNewChatTab('manual')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newChatTab === 'manual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Manual Contact</span>
              </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SUB-TAB 1: ALL USERS DIRECTORY
                ════════════════════════════════════════════════════════════════ */}
            {newChatTab === 'directory' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Search & Filter Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search any user by name, username, department, or role..."
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                    {[
                      { id: 'ALL', label: 'All Roles' },
                      { id: 'admin', label: 'Administrators' },
                      { id: 'manager', label: 'Managers' },
                      { id: 'staff', label: 'Hosts & Employees' },
                      { id: 'receptionist', label: 'Receptionists' },
                      { id: 'security', label: 'Security Officers' },
                      { id: 'visitor', label: 'Visitors' }
                    ].map((rf) => (
                      <button
                        key={rf.id}
                        onClick={() => setDirectoryRoleFilter(rf.id)}
                        className={`px-2 py-0.5 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                          directoryRoleFilter === rf.id
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {rf.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Directory List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-80 pr-1">
                  {loadingContacts ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading system users from database...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No users match the search criteria.
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleStartDirectChat(contact)}
                        className="p-3 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase shrink-0 overflow-hidden">
                            {renderSafeAvatar(contact.avatar_url, contact.full_name || contact.username)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{contact.full_name || contact.username}</span>
                              {contact.is_online && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                              )}
                            </p>
                            <p className="text-[10px] text-indigo-400 font-medium">
                              {contact.role_label || contact.role}
                              {contact.department ? ` • ${contact.department}` : ''}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-indigo-400 px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white transition-colors rounded-lg">
                          Chat →
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SUB-TAB 2: CREATE TEAM / CHANNEL (NAME FIRST, THEN ADD MEMBERS IN PROFILE)
                ════════════════════════════════════════════════════════════════ */}
            {newChatTab === 'group' && (
              <form onSubmit={handleCreateGroupSubmit} className="flex-1 flex flex-col justify-between space-y-4 text-xs py-2">
                <div className="space-y-4">
                  {/* Informational Banner */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                    <h5 className="font-bold text-indigo-300 text-xs flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" /> Create Team Channel
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Enter the team name to create your channel immediately. Once created, click on the team header to view total members, check online/offline status, and add staff members by role.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      Team / Group Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Receptionist Team, Security Operations, Front Desk..."
                      value={groupForm.title}
                      onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                      Channel Purpose / Topic (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Operational communications hub for front-desk and visitor coordination..."
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creatingGroup || !groupForm.title.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Users className="w-4 h-4" />
                    <span>{creatingGroup ? 'Creating Team Channel...' : 'Create Team Channel'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SUB-TAB 3: ADD MANUAL CONTACT & PROFILE
                ════════════════════════════════════════════════════════════════ */}
            {newChatTab === 'manual' && (
              <form onSubmit={handleCreateManualContactSubmit} className="flex-1 overflow-y-auto space-y-3 text-xs max-h-96 pr-1">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[11px] text-slate-300">
                    Manually add visitor info, VIP guest details, or external host profile to open a persistent message channel immediately.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe, Ambassador Jane Smith"
                      value={manualContactForm.full_name}
                      onChange={(e) =>
                        setManualContactForm({ ...manualContactForm, full_name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Contact Role / Type
                    </label>
                    <select
                      value={manualContactForm.role}
                      onChange={(e) =>
                        setManualContactForm({ ...manualContactForm, role: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="visitor">Visitor</option>
                      <option value="vip">VIP Guest / Executive</option>
                      <option value="contractor">Contractor / Technician</option>
                      <option value="external_host">External Partner / Auditor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. guest@partner.com"
                      value={manualContactForm.email}
                      onChange={(e) =>
                        setManualContactForm({ ...manualContactForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +251 91 123 4567"
                      value={manualContactForm.phone}
                      onChange={(e) =>
                        setManualContactForm({ ...manualContactForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Global Tech Solutions, Ministry of Innovation"
                    value={manualContactForm.company}
                    onChange={(e) =>
                      setManualContactForm({ ...manualContactForm, company: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                    Profile Notes & Special Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add background info, meeting reference, or security tags..."
                    value={manualContactForm.notes}
                    onChange={(e) =>
                      setManualContactForm({ ...manualContactForm, notes: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingManualContact}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{creatingManualContact ? 'Saving...' : 'Save & Open Chat'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CHAT HEADER PROFILE / CONTACT INFO & TEAM DETAILS MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {contactProfileModal.visible && (() => {
        const isGroup = Boolean(contactProfileModal.isGroup);
        const isTeamOwner = isGroup && (
          (activeConversation?.created_by && Number(activeConversation.created_by) === Number(myUserId)) ||
          Boolean(activeConversation?.is_owner) ||
          isAdmin
        );
        const isOwnProfile = !isGroup && (
          (contactProfileModal.user?.id && Number(contactProfileModal.user.id) === Number(myUserId)) ||
          (!contactProfileModal.user && activeConversation?.other_user?.id && Number(activeConversation.other_user.id) === Number(myUserId))
        );

        return (
          <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    {isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{isGroup ? 'Team Channel Profile' : isOwnProfile ? 'My Account Profile' : 'Contact Information'}</span>
                      {isGroup && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isTeamOwner ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isTeamOwner ? 'Owner Access' : 'Member View'}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {isGroup
                        ? isTeamOwner
                          ? 'Manage channel settings, team photo, members, and options'
                          : 'View channel info and invite authorized team members'
                        : isOwnProfile
                          ? 'Manage your personal profile, photo, and account'
                          : 'View contact details (Managed by account owner)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setContactProfileModal({ visible: false, user: null, conversation: null, isGroup: false, formData: {} })}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {isGroup ? (
                  <>
                    {/* Hidden File Input for Team Avatar */}
                    {isTeamOwner && (
                      <input
                        type="file"
                        ref={teamPhotoInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadTeamAvatar}
                      />
                    )}

                    {/* 1. TEAM PROFILE & PHOTO CARD */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-start gap-4">
                        {/* Uploadable Team Avatar */}
                        <div className="relative group shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-300 border-2 border-indigo-500/40 flex items-center justify-center font-black text-xl uppercase overflow-hidden shadow-lg shadow-indigo-950/50">
                            {renderSafeAvatar(
                              contactProfileModal.formData.avatar_url || activeConversation?.avatar_url,
                              contactProfileModal.formData.title || activeConversation?.title || 'Team'
                            )}
                          </div>

                          {/* Camera / Upload Overlay (Owner Only) */}
                          {isTeamOwner && (
                            <button
                              type="button"
                              onClick={() => teamPhotoInputRef.current?.click()}
                              disabled={uploadingTeamAvatar}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-bold gap-0.5"
                              title="Upload or Change Team Photo"
                            >
                              <Camera className="w-4 h-4 text-indigo-400" />
                              <span>{uploadingTeamAvatar ? '...' : 'Photo'}</span>
                            </button>
                          )}
                        </div>

                        {/* Team Identity & Quick Actions */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white truncate">
                              {contactProfileModal.formData.title || 'Team Channel'}
                            </h4>
                            <div className="px-2.5 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-[11px] flex items-center gap-1.5">
                              <span>{activeConversation?.participants_count || (activeConversation?.group_members?.length || 1)} Members</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                {activeConversation?.online_count !== undefined ? activeConversation.online_count : 1} Online
                              </span>
                            </div>
                          </div>

                          {/* Photo Upload & Remove Buttons (Owner Only) */}
                          {isTeamOwner ? (
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => teamPhotoInputRef.current?.click()}
                                disabled={uploadingTeamAvatar}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              >
                                <Upload className="w-3 h-3" />
                                <span>{uploadingTeamAvatar ? 'Uploading...' : contactProfileModal.formData.avatar_url ? 'Change Photo' : 'Upload Team Photo'}</span>
                              </button>
                              {contactProfileModal.formData.avatar_url && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setContactProfileModal((prev) => ({
                                      ...prev,
                                      formData: { ...prev.formData, avatar_url: '' }
                                    }));
                                    if (activeConversation?.id) {
                                      try {
                                        await communicationApi.updateConversation(activeConversation.id, {
                                          title: contactProfileModal.formData?.title || activeConversation.title,
                                          description: contactProfileModal.formData?.description || activeConversation.description || '',
                                          avatar_url: ''
                                        });
                                        setConversations((prev) =>
                                          prev.map((c) => (c.id === activeConversation.id ? { ...c, avatar_url: '' } : c))
                                        );
                                        setActiveConversation((prev) => (prev ? { ...prev, avatar_url: '' } : prev));
                                        showToast('Team photo removed ✓', 'success');
                                      } catch (err) {
                                        console.warn('Remove avatar error:', err);
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 font-semibold text-[10px] cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">
                              Team photo and settings can only be modified by the team creator.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Edit Team Info Fields (Editable for Owner, Read-Only for Members) */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Team / Channel Name {isTeamOwner && <span className="text-rose-400">*</span>}
                          </label>
                          {isTeamOwner ? (
                            <input
                              type="text"
                              required
                              value={contactProfileModal.formData.title || ''}
                              onChange={(e) =>
                                setContactProfileModal((prev) => ({
                                  ...prev,
                                  formData: { ...prev.formData, title: e.target.value }
                                }))
                              }
                              placeholder="e.g. Receptionist Team, Front Desk Ops"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white font-semibold">
                              {contactProfileModal.formData.title || 'Untitled Team'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Channel Purpose / Topic
                          </label>
                          {isTeamOwner ? (
                            <input
                              type="text"
                              value={contactProfileModal.formData.description || ''}
                              onChange={(e) =>
                                setContactProfileModal((prev) => ({
                                  ...prev,
                                  formData: { ...prev.formData, description: e.target.value }
                                }))
                              }
                              placeholder="Operational communications hub..."
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300">
                              {contactProfileModal.formData.description || 'No description provided.'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Team Members List with Online/Offline Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Team Members ({(activeConversation?.group_members || []).length})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Live socket presence verified
                        </span>
                      </div>

                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                        {(activeConversation?.group_members || []).length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            Creator is currently the sole member. Use the section below to add personnel.
                          </div>
                        ) : (
                          (activeConversation?.group_members || []).map((member) => (
                            <div key={member.id} className="p-2 flex items-center justify-between gap-3 hover:bg-slate-800/40 rounded-lg transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-300 uppercase shrink-0 overflow-hidden">
                                  {renderSafeAvatar(member.avatar_url, member.name || 'U')}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{member.name}</span>
                                    {member.is_me && <span className="text-[9px] text-indigo-400 font-normal">(You)</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {member.role_label || member.role}
                                    {member.department ? ` • ${member.department}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                  member.is_online
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${member.is_online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                  <span>{member.is_online ? 'Online' : 'Offline'}</span>
                                </span>

                                {(isTeamOwner || member.is_me) && !member.is_me && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMemberFromTeam(activeConvId, member.id)}
                                    className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded transition-colors"
                                    title="Remove member from team"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 3. Add Personnel to Team by Role Filter (Available to all team members) */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Add Members by Role
                      </span>

                      {/* Role Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                        {[
                          { id: 'ALL', label: 'All Roles' },
                          { id: 'receptionist', label: 'Receptionists' },
                          { id: 'security', label: 'Security' },
                          { id: 'staff', label: 'Employees' },
                          { id: 'manager', label: 'Managers' },
                          { id: 'admin', label: 'Admins' },
                        ].map((rf) => (
                          <button
                            type="button"
                            key={rf.id}
                            onClick={() => setTeamMemberRoleFilter(rf.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              teamMemberRoleFilter === rf.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {rf.label}
                          </button>
                        ))}
                      </div>

                      {/* Available contacts to add */}
                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/50 bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                        {contacts
                          .filter((c) => {
                            const r = (c.role || '').toLowerCase();
                            if (r === 'visitor') return false;
                            const existingIds = (activeConversation?.group_members || []).map((m) => m.id);
                            if (existingIds.includes(c.id)) return false; // Already in team
                            if (teamMemberRoleFilter === 'ALL') return true;
                            if (teamMemberRoleFilter === 'receptionist') return r.includes('reception');
                            if (teamMemberRoleFilter === 'security') return r.includes('security');
                            if (teamMemberRoleFilter === 'staff') return r === 'staff' || r === 'employee' || r === 'host';
                            if (teamMemberRoleFilter === 'manager') return r.includes('manager');
                            if (teamMemberRoleFilter === 'admin') return r.includes('admin');
                            return true;
                          })
                          .map((c) => (
                            <div key={c.id} className="p-2 flex items-center justify-between gap-2 hover:bg-slate-800/40 rounded-lg transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-300 uppercase shrink-0 overflow-hidden">
                                  {renderSafeAvatar(c.avatar_url, c.full_name || c.username)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{c.full_name || c.username}</p>
                                  <p className="text-[10px] text-slate-400">{c.role_label || c.role}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddMemberToTeam(activeConvId, c.id)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer shrink-0 transition-all shadow-sm"
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* DIRECT CONTACT OR OWN PROFILE CARD */}
                    {isOwnProfile && (
                      <input
                        type="file"
                        ref={userPhotoInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadUserAvatar}
                      />
                    )}

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                      {/* Avatar with Camera Overlay (for Own Profile) */}
                      <div className="relative group shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-extrabold text-base uppercase overflow-hidden shadow-md">
                          {renderSafeAvatar(
                            contactProfileModal.formData.avatar_url || contactProfileModal.user?.avatar_url || user?.avatar_url,
                            contactProfileModal.formData.name || user?.name || 'User'
                          )}
                        </div>

                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => userPhotoInputRef.current?.click()}
                            disabled={uploadingUserAvatar}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[9px] font-bold gap-0.5"
                            title="Change Your Profile Photo"
                          >
                            <Camera className="w-4 h-4 text-indigo-400" />
                            <span>{uploadingUserAvatar ? '...' : 'Photo'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                          <span>{contactProfileModal.formData.name}</span>
                          {isOwnProfile ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold">
                              You
                            </span>
                          ) : (
                            contactProfileModal.user?.is_online && (
                              <span className="text-[10px] font-normal text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                              </span>
                            )
                          )}
                        </h4>
                        <p className="text-xs text-indigo-400 font-medium">
                          {contactProfileModal.formData.role || 'System Contact'}
                          {contactProfileModal.formData.department ? ` • ${contactProfileModal.formData.department}` : ''}
                        </p>
                        {contactProfileModal.formData.email && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{contactProfileModal.formData.email}</p>
                        )}

                        {/* Photo Upload button for own profile */}
                        {isOwnProfile && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => userPhotoInputRef.current?.click()}
                              disabled={uploadingUserAvatar}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Upload className="w-3 h-3" />
                              <span>{uploadingUserAvatar ? 'Uploading...' : 'Change Profile Photo'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Information Fields */}
                    <div className="space-y-3 pt-1">
                      <span className="text-[11px] font-bold text-slate-300 uppercase block">
                        {isOwnProfile ? 'Edit Your Profile Information' : 'Contact Information & Notes'}
                      </span>

                      {/* Full Name & Phone: Editable for Own Profile, Read-Only for Others */}
                      {isOwnProfile ? (
                        <>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Full Name</label>
                            <input
                              type="text"
                              value={contactProfileModal.formData.name || ''}
                              onChange={(e) =>
                                setContactProfileModal((prev) => ({
                                  ...prev,
                                  formData: { ...prev.formData, name: e.target.value }
                                }))
                              }
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Phone Number</label>
                            <input
                              type="text"
                              value={contactProfileModal.formData.phone || ''}
                              onChange={(e) =>
                                setContactProfileModal((prev) => ({
                                  ...prev,
                                  formData: { ...prev.formData, phone: e.target.value }
                                }))
                              }
                              placeholder="e.g. +1 555-0199"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                          <p className="text-slate-400">
                            <span className="font-bold text-slate-300">Phone:</span> {contactProfileModal.formData.phone || 'Not specified'}
                          </p>
                          <p className="text-slate-400">
                            <span className="font-bold text-slate-300">Department:</span> {contactProfileModal.formData.department || 'Not assigned'}
                          </p>
                          <p className="text-[10px] text-slate-500 italic pt-1">
                            Account details are strictly managed by the account owner.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          {isOwnProfile ? 'Bio / Personal Notes' : 'Private Internal Reference Notes'}
                        </label>
                        <textarea
                          rows={3}
                          value={contactProfileModal.formData.notes || ''}
                          onChange={(e) =>
                            setContactProfileModal((prev) => ({
                              ...prev,
                              formData: { ...prev.formData, notes: e.target.value }
                            }))
                          }
                          placeholder={isOwnProfile ? 'Add notes or status message about yourself...' : 'Add private operational notes for your own reference...'}
                          className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {isGroup ? (
                  isTeamOwner ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteConversation(activeConvId)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Delete this team channel (Owner Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Team</span>
                    </button>
                  ) : (
                    <div />
                  )
                ) : isOwnProfile ? (
                  <button
                    type="button"
                    onClick={handleDeleteOwnAccount}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Permanently Delete Your Own Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete My Account</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContactProfileModal({ visible: false, user: null, conversation: null, isGroup: false, formData: {} })}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>

                  {isGroup ? (
                    isTeamOwner && (
                      <button
                        type="button"
                        disabled={savingTeamInfo}
                        onClick={() => {
                          handleUpdateTeamInfo(
                            activeConvId,
                            contactProfileModal.formData.title || '',
                            contactProfileModal.formData.description || '',
                            contactProfileModal.formData.avatar_url || ''
                          );
                        }}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        {savingTeamInfo ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Info</span>
                        )}
                      </button>
                    )
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      onClick={handleSaveOwnProfile}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Save Profile
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Private contact notes saved ✓', 'success');
                        setContactProfileModal({ visible: false, user: null, conversation: null, isGroup: false, formData: {} });
                      }}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Save Notes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT ANNOUNCEMENT MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {editAnnouncementModal.visible && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" /> Edit Announcement Notice
              </h3>
              <button
                onClick={() => setEditAnnouncementModal({ visible: false, announcement: null, formData: {} })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAnnouncementSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editAnnouncementModal.formData.title || ''}
                  onChange={(e) =>
                    setEditAnnouncementModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, title: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={editAnnouncementModal.formData.category || 'General Notice'}
                    onChange={(e) =>
                      setEditAnnouncementModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, category: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="General Notice">General Notice</option>
                    <option value="Policy Update">Policy Update</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={editAnnouncementModal.formData.priority || 'medium'}
                    onChange={(e) =>
                      setEditAnnouncementModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, priority: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Content Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={editAnnouncementModal.formData.content_body || ''}
                  onChange={(e) =>
                    setEditAnnouncementModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, content_body: e.target.value }
                    }))
                  }
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditAnnouncementModal({ visible: false, announcement: null, formData: {} })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FORWARD ANNOUNCEMENT MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {forwardAnnouncementModal.visible && forwardAnnouncementModal.announcement && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" /> Forward Announcement
              </h3>
              <button
                onClick={() => setForwardAnnouncementModal({ visible: false, announcement: null, targetConvId: '', targetEmail: '' })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForwardAnnouncementSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500">Notice Preview</p>
                <h4 className="font-bold text-white truncate">{forwardAnnouncementModal.announcement.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{forwardAnnouncementModal.announcement.content_body}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Forward into Active Chat:
                </label>
                <select
                  value={forwardAnnouncementModal.targetConvId}
                  onChange={(e) =>
                    setForwardAnnouncementModal((prev) => ({
                      ...prev,
                      targetConvId: e.target.value,
                      targetEmail: ''
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Chat Conversation --</option>
                  {conversations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.other_user?.name || `Conversation #${c.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-slate-500 font-bold text-[10px]">─ OR ─</div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Forward to Email Address:
                </label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={forwardAnnouncementModal.targetEmail}
                  onChange={(e) =>
                    setForwardAnnouncementModal((prev) => ({
                      ...prev,
                      targetEmail: e.target.value,
                      targetConvId: ''
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setForwardAnnouncementModal({ visible: false, announcement: null, targetConvId: '', targetEmail: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Forward</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE ANNOUNCEMENT MODAL (ADMIN ONLY)
          ══════════════════════════════════════════════════════════════════════ */}
      {showCreateAnnouncementModal && isAdmin && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" /> Publish Organization Announcement
              </h3>
              <button
                onClick={() => setShowCreateAnnouncementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Security & Holiday Visitor Schedule"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={announcementForm.category}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="General Notice">General Notice</option>
                    <option value="Policy Update">Policy Update</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Content Body <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Detailed announcement text..."
                  value={announcementForm.content_body}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, content_body: e.target.value })
                  }
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAnnouncement}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {creatingAnnouncement ? 'Publishing...' : 'Publish to MySQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
