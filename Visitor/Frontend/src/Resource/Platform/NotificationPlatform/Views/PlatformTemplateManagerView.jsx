import React from 'react';
import { FileCode } from 'lucide-react';
const PlatformTemplateManagerView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileCode className="w-5 h-5 text-indigo-400"/> Reusable Notification Template Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage templates for Email, SMS, In-App, and Push with dynamic handlebar variables.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Email Template: Visitor Arrival Notice to Host', channel: 'Email (HTML)', vars: '{{visitorName}}, {{hostName}}, {{location}}' },
            { title: 'SMS Template: OTP Verification Code', channel: 'SMS', vars: '{{otpCode}}, {{expiryMinutes}}' }
        ].map((t, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{t.title}</span>
              <span className="text-slate-400 block mt-0.5">{t.channel} • Vars: <code className="text-indigo-300 font-mono">{t.vars}</code></span>
            </div>
            <button className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded font-semibold hover:bg-indigo-600/30">
              Edit Template
            </button>
          </div>))}
      </div>
    </div>);
};
export default PlatformTemplateManagerView;
