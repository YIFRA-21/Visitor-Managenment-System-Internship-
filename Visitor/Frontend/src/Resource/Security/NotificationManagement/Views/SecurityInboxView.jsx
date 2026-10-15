import React, { useState } from 'react';
import { Inbox, Search, CheckCircle2, ArrowUpRight, Pin, Trash2, Archive } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const SecurityInboxView = () => {
    const { t } = useLanguage();
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const notifications = [
        {
            id: 'secnotif_3001',
            category: 'Watchlist Match',
            title: 'Critical Alert: Blacklist Match at Turnstile #3',
            message: 'Visitor Arthur Pendelton (ID-99021-X) matched Restricted Watchlist #WL-804 at Main Lobby Turnstile.',
            severity: 'Critical',
            status: 'Unacknowledged',
            isPinned: true,
            time: '2 mins ago',
            badgeCol: 'bg-red-500/20 text-red-400 border-red-500/40'
        },
        {
            id: 'secnotif_3002',
            category: 'Restricted Area',
            title: 'Access Control Violation: Door Forced Open',
            message: 'Door Sensor #D-402 (Server Room Annex B) triggered forced open alarm.',
            severity: 'High',
            status: 'Unacknowledged',
            isPinned: true,
            time: '8 mins ago',
            badgeCol: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        },
        {
            id: 'secnotif_3003',
            category: 'Visitor Event',
            title: 'Visitor Stay Overdue Warning',
            message: 'Contractor Michael Brown (Badge V-908) exceeded approved duration by 45 minutes in Executive Wing.',
            severity: 'Medium',
            status: 'Acknowledged',
            isPinned: false,
            time: '25 mins ago',
            badgeCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        },
        {
            id: 'secnotif_3004',
            category: 'Equipment & Device',
            title: 'Hardware Alert: Camera CCTV-Lobby-04 Offline',
            message: 'IP Camera CCTV-Lobby-04 failed heartbeat ping for >5 minutes.',
            severity: 'Medium',
            status: 'Acknowledged',
            isPinned: false,
            time: '40 mins ago',
            badgeCol: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
        }
    ];
    return (<div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-red-400"/> {t('notification.secAlertFeed', 'Security Operations Alert Feed')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('notification.secAlertFeedDesc', 'Real-time alert feed bounded by assigned campus building & security zone scope.')}</p>
        </div>

        <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium transition-colors">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/> {t('btn.acknowledgeAll', 'Acknowledge All Alerts')}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3"/>
          <input type="text" placeholder={t('placeholder.searchAlerts', 'Search security alerts...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"/>
        </div>

        <div>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500">
            <option value="All">{t('filter.allSeverities', 'All Severities')}</option>
            <option value="Critical">{t('filter.criticalOnly', 'Critical Only')}</option>
            <option value="High">{t('status.high', 'High')}</option>
            <option value="Medium">{t('status.medium', 'Medium')}</option>
          </select>
        </div>

        <div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500">
            <option value="All">{t('filter.allCategories', 'All Categories')}</option>
            <option value="Watchlist Match">{t('filter.watchlistMatches', 'Watchlist Matches')}</option>
            <option value="Restricted Area">{t('filter.restrictedViolations', 'Restricted Violations')}</option>
            <option value="Visitor Event">{t('filter.visitorEvents', 'Visitor Events')}</option>
            <option value="Equipment & Device">{t('filter.hardwareStatus', 'Hardware Status')}</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-2.5">
        {notifications.map((n) => (<div key={n.id} className={`bg-slate-950/70 border rounded-xl p-4 transition-all hover:border-slate-700 ${n.severity === 'Critical'
                ? 'border-red-500/50 bg-red-950/10'
                : n.status === 'Unacknowledged'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800/80'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {n.isPinned && <Pin className="w-4 h-4 text-amber-400 rotate-45 shrink-0 mt-0.5"/>}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{n.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${n.badgeCol}`}>{n.severity}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700">{n.category}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <span className="text-slate-500 text-xs shrink-0 whitespace-nowrap">{n.time}</span>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-2">
                <button className="bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-1 rounded font-semibold hover:bg-red-600/30">
                  {t('btn.acknowledgeAlert', 'Acknowledge Alert')}
                </button>
                <button className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded font-semibold hover:bg-purple-600/30 flex items-center gap-1">
                  {t('btn.escalate', 'Escalate')} <ArrowUpRight className="w-3 h-3"/>
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <button title={t('btn.archive', 'Archive')} className="hover:text-slate-300"><Archive className="w-3.5 h-3.5"/></button>
                <button title={t('btn.delete', 'Delete')} className="hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
};
export default SecurityInboxView;
