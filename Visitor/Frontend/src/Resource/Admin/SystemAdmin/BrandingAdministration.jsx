import React, { useState } from 'react';
import { Palette, Mail, CheckCircle2, Save } from 'lucide-react';
export default function BrandingAdministration() {
    const [toast, setToast] = useState('');
    const [saving, setSaving] = useState(false);
    const [branding, setBranding] = useState({
        primary_color: '#4f46e5',
        secondary_color: '#0f172a',
        accent_color: '#06b6d4',
        font_family: 'Inter, system-ui, sans-serif',
        logo_url: '/logo.png',
        favicon_url: '/favicon.ico',
        email_header_banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
        pdf_watermark_text: 'CONFIDENTIAL ENTERPRISE VISITOR PASS'
    });
    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setToast('Branding settings updated!');
            setTimeout(() => setToast(''), 3000);
        }, 600);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Palette className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Enterprise Branding & Theme Administration</h1>
            <p className="text-xs text-slate-400">Customize logos, color palettes, email banners, and PDF pass watermarks</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="h-4 w-4 text-cyan-400"/> System Color Palette & Theme
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Color Accent</label>
              <div className="flex gap-2">
                <input type="color" value={branding.primary_color} onChange={e => setBranding(b => ({ ...b, primary_color: e.target.value }))} className="h-9 w-12 bg-transparent rounded cursor-pointer border border-slate-800"/>
                <input type="text" value={branding.primary_color} onChange={e => setBranding(b => ({ ...b, primary_color: e.target.value }))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-white font-mono"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Secondary Base Color</label>
              <div className="flex gap-2">
                <input type="color" value={branding.secondary_color} onChange={e => setBranding(b => ({ ...b, secondary_color: e.target.value }))} className="h-9 w-12 bg-transparent rounded cursor-pointer border border-slate-800"/>
                <input type="text" value={branding.secondary_color} onChange={e => setBranding(b => ({ ...b, secondary_color: e.target.value }))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-white font-mono"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Accent Highlight Color</label>
              <div className="flex gap-2">
                <input type="color" value={branding.accent_color} onChange={e => setBranding(b => ({ ...b, accent_color: e.target.value }))} className="h-9 w-12 bg-transparent rounded cursor-pointer border border-slate-800"/>
                <input type="text" value={branding.accent_color} onChange={e => setBranding(b => ({ ...b, accent_color: e.target.value }))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-white font-mono"/>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Mail className="h-4 w-4 text-indigo-400"/> Email & Document PDF Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Header Banner URL</label>
              <input type="text" value={branding.email_header_banner} onChange={e => setBranding(b => ({ ...b, email_header_banner: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PDF Pass Security Watermark Text</label>
              <input type="text" value={branding.pdf_watermark_text} onChange={e => setBranding(b => ({ ...b, pdf_watermark_text: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-2">
            <Save className="h-4 w-4"/> {saving ? 'Applying...' : 'Save Branding Preferences'}
          </button>
        </div>
      </form>
    </div>);
}
