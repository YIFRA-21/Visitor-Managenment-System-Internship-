import React, { useState, useEffect } from 'react';
import { Megaphone, Mail, MessageSquare, Search, Plus, CheckCircle2, FileText, Eye, Shield, Sparkles, Copy, Archive, Edit3, ChevronRight } from 'lucide-react';
import api from '../../../../services/api';
export default function AnnouncementCenterView({ onTabChange, currentUser }) {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [announcements, setAnnouncements] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchAnnouncements();
    }, [filter]);
    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await api.get('/communication/announcements', { params: { status: filter, search: searchQuery } });
            const list = res.data?.announcements || [];
            setAnnouncements(list);
            if (list.length > 0 && !selectedAnnouncement) {
                setSelectedAnnouncement(list[0]);
            }
        }
        catch (err) {
            // Fallback sample data matching screenshot 1
            const fallback = [
                {
                    id: 1,
                    title: 'New Visitor Policy Update',
                    category: 'Policy Update',
                    priority: 'High',
                    status: 'published',
                    publish_date: 'May 20, 2025 10:15 AM',
                    published_by: 'System Administrator',
                    audience: ['All Employees', 'All Visitors', 'Reception Team', 'Security Team'],
                    views: 156,
                    recipients: 245,
                    read: 142,
                    read_pct: '58%',
                    unread: 103,
                    unread_pct: '42%',
                    likes: 32,
                    comments: 8,
                    body: 'We are pleased to announce the updated visitor policy, effective immediately. All employees and visitors are required to follow the new guidelines to ensure a safe and secure environment.',
                    highlights: [
                        'All visitors must have a pre-approved appointment.',
                        'Valid ID verification is mandatory for all visitors.',
                        'Visitor passes must be visible at all times.',
                        'Check-in and check-out are now digital.',
                        'For more details, please download the full policy document.'
                    ],
                    attachments: [
                        { name: 'Visitor_Policy_Guideline.pdf', size: '1.2 MB' },
                        { name: 'Policy_Change_Summary.docx', size: '256 KB' }
                    ]
                },
                {
                    id: 2,
                    title: 'System Maintenance Notification',
                    category: 'System Maintenance',
                    priority: 'Medium',
                    status: 'published',
                    publish_date: 'May 19, 2025 09:30 AM',
                    published_by: 'IT Admin',
                    audience: ['All Users'],
                    views: 210,
                    recipients: 300,
                    read: 200,
                    unread: 100,
                    body: 'System maintenance scheduled on May 25, 2025 from 12:00 AM to 02:00 AM.'
                },
                {
                    id: 3,
                    title: 'Holiday Announcement',
                    category: 'Holiday Notice',
                    priority: 'Low',
                    status: 'scheduled',
                    publish_date: 'May 21, 2025 08:00 AM',
                    published_by: 'HR Manager',
                    audience: ['All Employees'],
                    body: 'Office will remain closed on upcoming National Holiday.'
                },
                {
                    id: 4,
                    title: 'Security Awareness Training',
                    category: 'Security',
                    priority: 'High',
                    status: 'published',
                    publish_date: 'May 18, 2025 02:45 PM',
                    published_by: 'Security Chief',
                    audience: ['Employees'],
                    body: 'Mandatory annual security awareness training session scheduled for next week.'
                }
            ];
            setAnnouncements(fallback);
            if (!selectedAnnouncement)
                setSelectedAnnouncement(fallback[0]);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="space-y-4 text-xs font-mono text-slate-300">
      {/* Top Header & Tabs matching Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-400"/>
            Announcement Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Create, manage and publish announcements to specific audiences.</p>
        </div>

        {/* Action Controls & Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button onClick={() => onTabChange && onTabChange('messages')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
              <Mail className="h-3.5 w-3.5"/>
              Messages
            </button>

            <button onClick={() => onTabChange && onTabChange('chat')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5"/>
              System Chat
            </button>

            <button onClick={() => onTabChange && onTabChange('announcements')} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-lg flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5"/>
              Announcements
            </button>

            <button onClick={() => onTabChange && onTabChange('center')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400"/>
              Notification Center
            </button>
          </div>

          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2">
            <Plus className="h-4 w-4"/> New Announcement
          </button>
        </div>
      </div>

      {/* Main Grid Layout matching Screenshot 1 */}
      <div className="grid grid-cols-12 gap-4">
        {/* Column 1: Announcements List (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col h-[680px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-extrabold text-white text-xs">All Announcements</span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">18 Total</span>
          </div>

          <div className="relative my-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500"/>
            <input type="text" placeholder="Search announcements..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-950 p-1 rounded-xl text-[10px] text-center font-bold">
            <button onClick={() => setFilter('all')} className={`py-1 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>All 18</button>
            <button onClick={() => setFilter('published')} className={`py-1 rounded-lg ${filter === 'published' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Published 12</button>
            <button onClick={() => setFilter('scheduled')} className={`py-1 rounded-lg ${filter === 'scheduled' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Scheduled 3</button>
            <button onClick={() => setFilter('draft')} className={`py-1 rounded-lg ${filter === 'draft' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Draft 3</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {announcements.map((a) => {
            const active = selectedAnnouncement?.id === a.id;
            return (<div key={a.id} onClick={() => setSelectedAnnouncement(a)} className={`p-3 rounded-xl border transition-all cursor-pointer ${active
                    ? 'bg-indigo-950/50 border-indigo-500/60 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 text-slate-300'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-white truncate max-w-[140px]">{a.title}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{a.status || 'Published'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{a.audience ? a.audience.join(', ') : 'All Users'}</p>
                  <p className="text-[9px] text-slate-500 mt-1">{a.publish_date || 'May 20, 2025'}</p>
                </div>);
        })}
          </div>
        </div>

        {/* Column 2: Selected Announcement Hero Detail (5 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[680px] overflow-y-auto">
          {selectedAnnouncement ? (<div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="text-base font-black text-white">{selectedAnnouncement.title}</h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  {selectedAnnouncement.status || 'Published'}
                </span>
              </div>

              {/* Author & Audience Meta */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px]">
                <div>
                  <span className="text-slate-400">From: </span>
                  <span className="font-bold text-white">{selectedAnnouncement.published_by || 'System Administrator'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Date: </span>
                  <span className="font-bold text-indigo-300">{selectedAnnouncement.publish_date || 'May 20, 2025'}</span>
                </div>
              </div>

              {/* Hero Banner Card matching Screenshot 1 */}
              <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide">NEW VISITOR POLICY</h3>
                  <h4 className="text-sm font-bold text-indigo-200 uppercase tracking-widest mt-1">UPDATE</h4>
                </div>
                <Shield className="h-12 w-12 text-indigo-300 opacity-80"/>
              </div>

              {/* Body Text */}
              <p className="text-xs leading-relaxed text-slate-200">{selectedAnnouncement.body}</p>

              {/* Key Highlights Bullets */}
              {selectedAnnouncement.highlights && (<div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-bold text-xs text-indigo-300">Key Highlights:</p>
                  <ul className="space-y-1 text-[11px] text-slate-300 pl-2">
                    {selectedAnnouncement.highlights.map((h, idx) => (<li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5"/>
                        <span>{h}</span>
                      </li>))}
                  </ul>
                </div>)}

              {/* Attachments */}
              {selectedAnnouncement.attachments && (<div>
                  <p className="font-bold text-xs text-slate-400 mb-2">Attachments (2)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAnnouncement.attachments.map((att, idx) => (<div key={idx} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <FileText className="h-5 w-5 text-indigo-400 shrink-0"/>
                        <div className="truncate text-[10px]">
                          <p className="font-bold text-white truncate">{att.name}</p>
                          <p className="text-slate-500">{att.size}</p>
                        </div>
                      </div>))}
                  </div>
                </div>)}

              {/* Engagement Stats Grid matching Screenshot 1 */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div>
                  <p className="text-slate-400 text-[10px]">Views</p>
                  <p className="font-black text-sm text-white">{selectedAnnouncement.views || 156}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Recipients</p>
                  <p className="font-black text-sm text-indigo-400">{selectedAnnouncement.recipients || 245}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Read</p>
                  <p className="font-black text-sm text-emerald-400">{selectedAnnouncement.read || 142} ({selectedAnnouncement.read_pct || '58%'})</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Unread</p>
                  <p className="font-black text-sm text-rose-400">{selectedAnnouncement.unread || 103} ({selectedAnnouncement.unread_pct || '42%'})</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                  <Edit3 className="h-4 w-4"/> Edit
                </button>
                <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                  <Copy className="h-4 w-4"/> Duplicate
                </button>
                <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                  <Archive className="h-4 w-4"/> Archive
                </button>
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg">
                  <Eye className="h-4 w-4"/> View Recipients
                </button>
              </div>
            </div>) : (<div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Megaphone className="h-10 w-10 mb-2 opacity-40"/>
              <p>Select an announcement to view details</p>
            </div>)}
        </div>

        {/* Column 3: Audience & Quick Templates (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Audience & Announcement Details Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-white text-xs">Target Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {['All Employees', 'All Visitors', 'Reception Team', 'Security Team'].map((aud, idx) => (<span key={idx} className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                  {aud}
                </span>))}
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-1.5 text-[11px]">
              <p className="font-bold text-white">Announcement Details</p>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-slate-400">Priority:</span>
                <span className="text-amber-400 font-bold">High</span>
                <span className="text-slate-400">Category:</span>
                <span className="text-indigo-400 font-bold">Policy Update</span>
                <span className="text-slate-400">Publish Date:</span>
                <span className="text-slate-300">May 20, 2025 10:15 AM</span>
                <span className="text-slate-400">Allow Comments:</span>
                <span className="text-emerald-400 font-bold">Yes</span>
                <span className="text-slate-400">Allow Reactions:</span>
                <span className="text-emerald-400 font-bold">Yes</span>
              </div>
            </div>
          </div>

          {/* Quick Templates Card matching Screenshot 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="font-extrabold text-white text-xs mb-2">Quick Templates</p>
            {['Policy Update', 'Event Announcement', 'Holiday Notice', 'System Maintenance', 'General Notice'].map((tpl, idx) => (<button key={idx} className="w-full text-left p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all">
                <span>{tpl}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500"/>
              </button>))}
          </div>
        </div>
      </div>
    </div>);
}
