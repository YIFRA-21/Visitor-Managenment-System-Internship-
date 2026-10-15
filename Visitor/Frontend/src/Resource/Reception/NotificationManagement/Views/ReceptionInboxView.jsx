import React, { useState } from 'react';
import { Inbox, Search, Clock, CheckCheck, Archive, Trash2, Pin } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const ReceptionInboxView = () => {
    const { t } = useLanguage();
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const notifications = [
        {
            id: 'rnotif_2001',
            category: 'Visitor Event',
            title: 'VIP Visitor Arrived at Lobby',
            message: 'Ambassador Elena Rostova (Diplomatic Mission) has arrived at Main Plaza Reception.',
            priority: 'High',
            status: 'Unread',
            isPinned: true,
            time: '5 mins ago',
            badgeCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        },
        {
            id: 'rnotif_2002',
            category: 'Check-In Event',
            title: 'Temporary Badge V-1044 Ready for Collection',
            message: 'Badge printed automatically for contractor John Vance (HVAC Services).',
            priority: 'Normal',
            status: 'Unread',
            isPinned: false,
            time: '12 mins ago',
            badgeCol: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
        },
        {
            id: 'rnotif_2003',
            category: 'Waiting Queue Event',
            title: 'Queue Threshold Exceeded (>15 mins)',
            message: '3 visitors waiting over 15 minutes at Main Lobby Desk #1.',
            priority: 'High',
            status: 'Unread',
            isPinned: true,
            time: '18 mins ago',
            badgeCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        },
        {
            id: 'rnotif_2005',
            category: 'Security Event',
            title: 'Security Alert: Watchlist Match Found',
            message: 'Walk-in visitor name matched watchlist entry #WL-804. Security Officer notified.',
            priority: 'Critical',
            status: 'Unread',
            isPinned: true,
            time: '2 mins ago',
            badgeCol: 'bg-red-500/10 text-red-400 border-red-500/30'
        }
    ];
    return (<div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-emerald-400"/> {t('notification.frontDeskNotifCenter', 'Front-Desk Notification Center')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('notification.frontDeskNotifCenterDesc', 'Scoped inbox for assigned reception desk and building lobby.')}</p>
        </div>

        <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium transition-colors">
          <CheckCheck className="w-4 h-4 text-emerald-400"/> {t('btn.markAllRead', 'Mark All Read')}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3"/>
          <input type="text" placeholder={t('placeholder.searchFrontDeskFeed', 'Search front-desk feed...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"/>
        </div>

        <div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
            <option value="All">{t('filter.allEventCategories', 'All Event Categories')}</option>
            <option value="Visitor Event">{t('filter.visitorEvents', 'Visitor Events')}</option>
            <option value="Check-In Event">{t('filter.checkInEvents', 'Check-In Events')}</option>
            <option value="Waiting Queue Event">{t('filter.queueAlerts', 'Queue Alerts')}</option>
            <option value="Security Event">{t('filter.securityAlerts', 'Security Alerts')}</option>
          </select>
        </div>

        <div>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
            <option value="All">{t('filter.allPriorities', 'All Priorities')}</option>
            <option value="Critical">{t('status.critical', 'Critical')}</option>
            <option value="High">{t('status.high', 'High')}</option>
            <option value="Normal">{t('status.normal', 'Normal')}</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.map((n) => (<div key={n.id} className={`bg-slate-950/70 border rounded-xl p-4 transition-all hover:border-slate-700 ${n.status === 'Unread' ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800/80'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {n.isPinned && <Pin className="w-4 h-4 text-amber-400 rotate-45 shrink-0 mt-0.5"/>}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{n.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${n.badgeCol}`}>{n.category}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700">{n.priority}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
                <Clock className="w-3.5 h-3.5"/>
                <span>{n.time}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900 text-xs">
              <button className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">{t('btn.processAction', 'Process Action')}</button>
              <div className="flex items-center gap-2 text-slate-500">
                <button title={t('btn.archive', 'Archive')} className="hover:text-slate-300"><Archive className="w-3.5 h-3.5"/></button>
                <button title={t('btn.delete', 'Delete')} className="hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
};
export default ReceptionInboxView;
