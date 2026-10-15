import React, { useState } from 'react';
import { Globe, CheckCircle2, Languages } from 'lucide-react';
export default function LocalizationLanguage() {
    const [lang, setLang] = useState('en');
    const [toast, setToast] = useState('');
    const handleSave = () => {
        setToast('Localization preferences updated.');
        setTimeout(() => setToast(''), 3000);
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Languages className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Localization & Multi-Language Center</h1>
            <p className="text-xs text-slate-400">Configure default locale, language packs, and translation dictionary files</p>
          </div>
        </div>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Globe className="h-4 w-4 text-sky-400"/> System Language Packs
        </h3>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Default System Interface Language</label>
          <select value={lang} onChange={e => setLang(e.target.value)} className="w-full md:w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white">
            <option value="en">English (US / Enterprise Standard)</option>
            <option value="am">Amharic (አማርኛ)</option>
            <option value="om">Afaan Oromoo</option>
            <option value="fr">French (Français)</option>
          </select>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20">
            Apply Localization Settings
          </button>
        </div>
      </div>
    </div>);
}
