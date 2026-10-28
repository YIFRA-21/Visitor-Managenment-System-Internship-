import React, { useState } from 'react';
import { Inbox, Search, Pin, Archive, Trash2, Clock, CheckCheck } from 'lucide-react';
const ManagerInboxView = () => {
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const notifications = [
        {
            id: 'mnotif_1001',
            category: 'Visitor',
            title: 'New VIP Visitor Registered',
            message: 'VIP Visitor Sarah Jenkins (Enterprise VMS Global) registered for host David Miller.',
            priority: 'High',
            status: 'Unread',
            isPinned: true,
            time: '15 mins ago',
            badgeCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        },
        {
            id: 'mnotif_1002',
            category: 'Approval Workflow',
            title: 'After-Hours Access Request Pending Approval',
            message: 'Contractor Team (5 members) requested after-hours facility access for Server Room maintenance.',
            priority: 'Critical',
            status: 'Unread',
            isPinned: true,
            time: '45 mins ago',
            badgeCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        },
        {
            id: 'mnotif_1003',
            category: 'Visitor',
            title: 'Temporary Badge V-908 Expiring Soon',
            message: 'Visitor Michael Brown has exceeded expected stay by 30 minutes in Operations Zone B.',
            priority: 'High',
            status: 'Unread',
            isPinned: false,
            time: '1.5 hours ago',
            badgeCol: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        },
        {
            id: 'mnotif_1004',
            category: 'Employee',
            title: 'Host Out of Office Notice',
            message: 'Employee Robert Chen is marked on sick leave. 2 upcoming visitor appointments need reassignment.',
            priority: 'Medium',
            status: 'Read',
            isPinned: false,
            time: '3 hours ago',
            badgeCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
        }
    ];
    return (<div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-400"/> Manager Notification Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Scoped inbox for assigned department, employees, and visitors.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium transition-colors">
            <CheckCheck className="w-4 h-4 text-emerald-400"/> Mark All Read
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3"/>
          <input type="text" placeholder="Search notifications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
        </div>

        <div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
            <option value="All">All Categories</option>
            <option value="Visitor">Visitor</option>
            <option value="Appointment">Appointment</option>
            <option value="Approval Workflow">Approval Workflow</option>
            <option value="Employee">Employee</option>
            <option value="Department">Department</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        <div>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.map((n) => (<div key={n.id} className={`bg-slate-950/70 border rounded-xl p-4 transition-all hover:border-slate-700 ${n.status === 'Unread' ? 'border-blue-500/40 bg-blue-950/10' : 'border-slate-800/80'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {n.isPinned && <Pin className="w-4 h-4 text-amber-400 rotate-45 shrink-0 mt-0.5"/>}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{n.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${n.badgeCol}`}>{n.category}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700">{n.priority} Priority</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
                <Clock className="w-3.5 h-3.5"/>
                <span>{n.time}</span>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-3">
                <button className="text-blue-400 hover:text-blue-300 font-medium transition-colors">View Related Page</button>
                <span className="text-slate-700">•</span>
                <button className="text-slate-400 hover:text-white transition-colors">Mark Read</button>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <button title="Archive" className="hover:text-slate-300"><Archive className="w-3.5 h-3.5"/></button>
                <button title="Delete" className="hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
};
export default ManagerInboxView;
