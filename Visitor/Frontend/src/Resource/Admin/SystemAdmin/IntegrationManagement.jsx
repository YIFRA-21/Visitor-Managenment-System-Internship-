import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
export default function IntegrationManagement() {
    const [integrations] = useState([
        { id: 1, name: 'Twilio SMS Gateway', type: 'SMS', status: 'CONNECTED', endpoint: 'https://api.twilio.com', last_sync: '2 mins ago' },
        { id: 2, name: 'SendGrid Email Service', type: 'EMAIL', status: 'CONNECTED', endpoint: 'smtp.sendgrid.net', last_sync: '5 mins ago' },
        { id: 3, name: 'Active Directory / LDAP', type: 'AUTH', status: 'CONNECTED', endpoint: 'ldap://ad.company.internal', last_sync: '10 mins ago' },
        { id: 4, name: 'Hikvision Gate Control', type: 'IOT_ACCESS', status: 'DISCONNECTED', endpoint: 'http://192.168.1.100:8080', last_sync: '3 days ago' }
    ]);
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Share2 className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Integrations & Third-Party Services</h1>
            <p className="text-xs text-slate-400">Configure Gate Hardware, LDAP/AD, SMS/Email Providers, and Webhooks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(item => (<div key={item.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">{item.name}</h3>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${item.status === 'CONNECTED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Endpoint: <span className="text-indigo-300">{item.endpoint}</span></p>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              <span>Type: <strong className="text-slate-300">{item.type}</strong></span>
              <span>Last Sync: {item.last_sync}</span>
            </div>
          </div>))}
      </div>
    </div>);
}
