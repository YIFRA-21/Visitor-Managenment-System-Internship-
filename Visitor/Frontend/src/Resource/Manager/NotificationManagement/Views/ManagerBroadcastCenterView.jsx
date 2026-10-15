import React, { useState } from 'react';
import { Megaphone, Send, Clock, Mail, Bell, Monitor } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const ManagerBroadcastCenterView = () => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('Department Employees');
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-400"/> {t('manager_broadcast.title', 'Manager Broadcast Center')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('manager_broadcast.subtitle', 'Send targeted announcements and security alerts to your department employees or assigned visitors.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer Form */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">{t('manager_broadcast.broadcast_title', 'Broadcast Title')}</label>
            <input type="text" placeholder={t('manager_broadcast.broadcast_title_placeholder', 'e.g., Mandatory Department Meeting / Emergency Notice')} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"/>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">{t('manager_broadcast.target_group', 'Target Recipient Group')}</label>
            <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
              <option value="Department Employees">{t('manager_broadcast.opt_employees', 'Department Employees (42 Recipients)')}</option>
              <option value="Assigned Visitors">{t('manager_broadcast.opt_visitors', 'Assigned Department Visitors (18 Active)')}</option>
              <option value="Reception Officers">{t('manager_broadcast.opt_reception', 'Reception & Desk Officers')}</option>
              <option value="Security Guards">{t('manager_broadcast.opt_security', 'Department Security Officers')}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">{t('manager_broadcast.body_message', 'Broadcast Body Message')}</label>
            <textarea rows={4} placeholder={t('manager_broadcast.body_placeholder', 'Type your message content here...')} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"/>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">{t('manager_broadcast.delivery_channels', 'Delivery Channels')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" defaultChecked className="accent-blue-500"/>
                <Bell className="w-3.5 h-3.5 text-blue-400"/> {t('common.in_app', 'In-App')}
              </label>
              <label className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" defaultChecked className="accent-blue-500"/>
                <Mail className="w-3.5 h-3.5 text-emerald-400"/> {t('common.email', 'Email')}
              </label>
              <label className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" defaultChecked className="accent-blue-500"/>
                <Monitor className="w-3.5 h-3.5 text-purple-400"/> {t('common.browser', 'Browser')}
              </label>
              <label className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" className="accent-blue-500"/>
                <Monitor className="w-3.5 h-3.5 text-cyan-400"/> {t('common.desktop', 'Desktop')}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all">
              <Send className="w-4 h-4"/> {t('manager_broadcast.dispatch_now', 'Dispatch Broadcast Now')}
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 border border-slate-700">
              <Clock className="w-4 h-4"/> {t('common.schedule', 'Schedule')}
            </button>
          </div>
        </div>

        {/* Live Broadcast Preview */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Broadcast Preview</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">{title || 'Broadcast Title Placeholder'}</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-semibold">PREVIEW</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{message || 'Your message text will be displayed here as it appears on recipient screens.'}</p>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
              <span>Target: {targetAudience}</span>
              <span>Scope: Operations & Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
export default ManagerBroadcastCenterView;
