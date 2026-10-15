import React, { useState } from 'react';
import { Palette } from 'lucide-react';
export default function NotificationBrandingView() {
    const [branding, setBranding] = useState({
        organizationName: 'Enterprise Visitor Management Hub',
        logoUrl: 'https://vms-enterprise.com/assets/logo.png',
        primaryColor: '#2563eb',
        secondaryColor: '#0f172a',
        accentColor: '#10b981',
        smsSignature: '- Sent via VMS Security'
    });
    const [previewTab, setPreviewTab] = useState('email');
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Palette className="h-4 w-4 text-emerald-400"/>
            <span>Enterprise Notification Branding (§2)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Customize corporate logos, email header/footer, brand colors, and SMS signatures with real-time preview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          <div>
            <label className="text-slate-400 block mb-1">Organization Display Name</label>
            <input type="text" value={branding.organizationName} onChange={e => setBranding({ ...branding, organizationName: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"/>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Primary Color</label>
              <input type="color" value={branding.primaryColor} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} className="w-full h-10 p-1 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"/>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Secondary Color</label>
              <input type="color" value={branding.secondaryColor} onChange={e => setBranding({ ...branding, secondaryColor: e.target.value })} className="w-full h-10 p-1 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"/>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Accent Color</label>
              <input type="color" value={branding.accentColor} onChange={e => setBranding({ ...branding, accentColor: e.target.value })} className="w-full h-10 p-1 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"/>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Corporate Logo URL</label>
            <input type="text" value={branding.logoUrl} onChange={e => setBranding({ ...branding, logoUrl: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">SMS Signature</label>
            <input type="text" value={branding.smsSignature} onChange={e => setBranding({ ...branding, smsSignature: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"/>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white uppercase text-[10px]">Real-Time Branding Preview</span>
            <div className="flex space-x-2">
              <button onClick={() => setPreviewTab('email')} className={`px-3 py-1 rounded-lg font-bold ${previewTab === 'email' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Email</button>
              <button onClick={() => setPreviewTab('sms')} className={`px-3 py-1 rounded-lg font-bold ${previewTab === 'sms' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>SMS</button>
            </div>
          </div>

          {previewTab === 'email' ? (<div className="p-4 rounded-xl border border-slate-800 overflow-hidden font-sans space-y-3" style={{ background: branding.secondaryColor }}>
              <div className="p-3 text-center border-b border-slate-800" style={{ borderBottomColor: branding.primaryColor }}>
                <span className="font-black text-white text-base tracking-tight">{branding.organizationName}</span>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl text-slate-200 space-y-2">
                <h4 className="font-bold text-white text-sm" style={{ color: branding.accentColor }}>Visitor Arrival Notification</h4>
                <p className="text-xs text-slate-300">Dear Host, your visitor John Doe has arrived at Main Entrance.</p>
              </div>
              <div className="p-2 text-center text-[10px] text-slate-500 font-mono">
                © 2026 {branding.organizationName}. Confidential & Automated.
              </div>
            </div>) : (<div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-mono">
              <span className="text-[10px] text-slate-500 block">[SMS Preview]</span>
              <p className="text-xs text-slate-200">
                [VMS Alert] Visitor John Doe arrived at Reception. Pass: V-991 {branding.smsSignature}
              </p>
            </div>)}
        </div>
      </div>
    </div>);
}
