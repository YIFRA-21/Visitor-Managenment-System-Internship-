import React, { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const SecurityManualDispatchView = () => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState('All Security Officers');
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-red-400"/> {t('notification.manualDispatchTitle', 'SOC Manual Alert Dispatcher')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('notification.manualDispatchDesc', 'Broadcast security alerts or instructions to reception desk, hosts, security guards, or emergency teams.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div>
          <label className="text-slate-300 font-bold block mb-1">{t('form.alertTitle', 'Dispatch Alert Title')}</label>
          <input type="text" placeholder={t('placeholder.alertTitle', 'e.g., Hold Check-In Order / Perimeter Security Inspection')} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"/>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">{t('form.targetGroup', 'Target Recipient Group')}</label>
          <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500">
            <option value="All Security Officers">{t('notification.allSecurity', 'All On-Duty Security Officers')}</option>
            <option value="Reception Team">{t('notification.receptionTeam', 'Front-Desk Receptionists')}</option>
            <option value="Host Employee">{t('notification.hostEmployee', 'Host Employees')}</option>
            <option value="Emergency Response Teams">{t('notification.emergencyTeams', 'Emergency Response Teams')}</option>
            <option value="System Administrators">{t('notification.systemAdmins', 'System Administrators')}</option>
          </select>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">{t('form.messageContent', 'Message Content')}</label>
          <textarea rows={3} placeholder={t('placeholder.messageContent', 'Type alert dispatch instructions...')} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 resize-none"/>
        </div>

        <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all">
          <Send className="w-4 h-4"/> {t('btn.sendDispatch', 'Send Security Dispatch Alert')}
        </button>
      </div>
    </div>);
};
export default SecurityManualDispatchView;
