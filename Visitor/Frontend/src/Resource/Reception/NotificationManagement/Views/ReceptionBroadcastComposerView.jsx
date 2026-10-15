import React, { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const ReceptionBroadcastComposerView = () => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState('Host Employee');
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-emerald-400"/> {t('notification.frontDeskAlertComposer', 'Front-Desk Manual Alert Composer')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('notification.frontDeskAlertComposerDesc', 'Send instant alerts or messages to host employees, visitors, security officers, or reception team.')}</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div>
          <label className="text-slate-300 font-bold block mb-1">{t('form.alertTitle', 'Alert Title')}</label>
          <input type="text" placeholder={t('placeholder.lobbyAlertTitle', 'e.g., Visitor Arrived at Lobby / Host Escort Needed')} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"/>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">{t('form.targetRecipient', 'Target Recipient')}</label>
          <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
            <option value="Host Employee">{t('notification.hostEmployeeAlert', 'Host Employee (Direct Alert)')}</option>
            <option value="Visitor">{t('notification.arrivedVisitor', 'Arrived Visitor')}</option>
            <option value="Reception Team">{t('notification.receptionDeskTeam', 'Reception Desk Team')}</option>
            <option value="Security Officer">{t('notification.buildingSecurityOfficers', 'Building Security Officers')}</option>
            <option value="Department Manager">{t('notification.departmentManager', 'Department Manager')}</option>
          </select>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">{t('form.messageContent', 'Message Content')}</label>
          <textarea rows={3} placeholder={t('placeholder.alertContent', 'Type alert message content...')} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"/>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
          <Send className="w-4 h-4"/> {t('btn.sendAlertNow', 'Send Manual Alert Now')}
        </button>
      </div>
    </div>);
};
export default ReceptionBroadcastComposerView;
