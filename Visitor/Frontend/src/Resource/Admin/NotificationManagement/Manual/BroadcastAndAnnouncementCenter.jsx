import React, { useState, useEffect } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
export default function BroadcastAndAnnouncementCenter() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    // New Broadcast Form State
    const [broadcastType, setBroadcastType] = useState('Emergency Alert');
    const [targetScope, setTargetScope] = useState('Entire Building');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [bannerColor, setBannerColor] = useState('red');
    const [isPinned, setIsPinned] = useState(true);
    const [isPopup, setIsPopup] = useState(true);
    useEffect(() => {
        setBroadcasts([
            { id: 8001, reference_number: 'BRD-001', title: 'Emergency Fire Drill Announcement', broadcast_type: 'Emergency Alert', target_scope: 'Entire Building', banner_color: 'red', priority: 'urgent', approval_status: 'APPROVED', status: 'sent', created_at: new Date().toISOString() },
            { id: 8002, reference_number: 'BRD-002', title: 'Annual Holiday Office Closure', broadcast_type: 'Holiday Notice', target_scope: 'Entire Organization', banner_color: 'blue', priority: 'medium', approval_status: 'APPROVED', status: 'delivered', created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: 8003, reference_number: 'BRD-003', title: 'Server Upgrade Maintenance', broadcast_type: 'Maintenance Notice', target_scope: 'System', banner_color: 'amber', priority: 'high', approval_status: 'PENDING', status: 'pending_approval', created_at: new Date(Date.now() - 3600000).toISOString() }
        ]);
    }, []);
    const handleApprove = (id) => {
        setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, approval_status: 'APPROVED', status: 'sent' } : b));
        setIsApprovalModalOpen(false);
    };
    const handleReject = (id) => {
        setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, approval_status: 'REJECTED', status: 'failed' } : b));
        setIsApprovalModalOpen(false);
    };
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-xl text-white">
            <Megaphone className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Notification Center</span>
              <span>/</span>
              <span className="text-rose-400 font-bold">Broadcast & Announcement (Part 4.6)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Broadcast & Announcement Center</h1>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
            { label: 'Total Broadcasts', value: broadcasts.length, color: 'text-indigo-400 border-indigo-500/30' },
            { label: 'Pending Approval', value: broadcasts.filter(b => b.approval_status === 'PENDING').length, color: 'text-amber-400 border-amber-500/30' },
            { label: 'Approved & Sent', value: broadcasts.filter(b => b.approval_status === 'APPROVED').length, color: 'text-emerald-400 border-emerald-500/30' },
            { label: 'Rejected', value: broadcasts.filter(b => b.approval_status === 'REJECTED').length, color: 'text-rose-400 border-rose-500/30' },
            { label: 'Active Banners', value: broadcasts.filter(b => b.status === 'sent').length, color: 'text-cyan-400 border-cyan-500/30' }
        ].map((m, idx) => (<div key={idx} className={`p-4 bg-slate-900 border ${m.color} rounded-2xl`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
            <div className={`text-2xl font-black mt-1 ${m.color.split(' ')[0]}`}>{m.value}</div>
          </div>))}
      </div>

      {/* Create Broadcast Form */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-3xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-rose-400"/>
          <span>Publish Mass Announcement / Emergency Broadcast</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Broadcast Type</label>
            <select value={broadcastType} onChange={e => setBroadcastType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
              <option value="Emergency Alert">Emergency Panic Alert</option>
              <option value="Security Alert">Security Watchlist Alert</option>
              <option value="Holiday Notice">Holiday Office Notice</option>
              <option value="Maintenance Notice">System Maintenance Notice</option>
              <option value="General Announcement">General Announcement</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Scope</label>
            <select value={targetScope} onChange={e => setTargetScope(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
              <option value="Entire Building">Entire Building</option>
              <option value="Entire Organization">Entire Organization</option>
              <option value="System">System-Wide</option>
              <option value="Security Team">Security Team Only</option>
              <option value="Reception Officers">Reception Desk Only</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Header Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Mandatory Building Evacuation Drill" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"/>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Message Content</label>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Broadcast payload message..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white"/>
          </div>

          <div className="flex items-center space-x-4 md:col-span-2 pt-1">
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="rounded bg-slate-950 text-rose-600"/>
              <span>Pin Banner to Top</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input type="checkbox" checked={isPopup} onChange={e => setIsPopup(e.target.checked)} className="rounded bg-slate-950 text-rose-600"/>
              <span>Trigger Modal Popup</span>
            </label>
          </div>
        </div>

        <button className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20">
          Publish Broadcast Immediately
        </button>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Broadcast History & Approval Workflow</h3>
        </div>

        <table className="w-full text-left text-xs font-medium">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
            <tr>
              <th className="p-3">Ref Code</th>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Target Scope</th>
              <th className="p-3">Approval</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {broadcasts.map(b => (<tr key={b.id} className="hover:bg-slate-850">
                <td className="p-3 font-mono font-bold text-rose-400">{b.reference_number}</td>
                <td className="p-3 font-bold text-white">{b.title}</td>
                <td className="p-3">{b.broadcast_type}</td>
                <td className="p-3 text-slate-400">{b.target_scope}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${b.approval_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {b.approval_status}
                  </span>
                </td>
                <td className="p-3 uppercase font-bold text-[10px]">{b.status}</td>
                <td className="p-3">
                  {b.approval_status === 'PENDING' && (<button onClick={() => { setSelectedBroadcast(b); setIsApprovalModalOpen(true); }} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold">
                      Review Approval
                    </button>)}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Approval Modal */}
      {isApprovalModalOpen && selectedBroadcast && (<div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Review Broadcast Approval</h3>
            <p className="text-xs text-slate-300">{selectedBroadcast.title}</p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button onClick={() => handleReject(selectedBroadcast.id)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
                Reject
              </button>
              <button onClick={() => handleApprove(selectedBroadcast.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                Approve & Send
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
