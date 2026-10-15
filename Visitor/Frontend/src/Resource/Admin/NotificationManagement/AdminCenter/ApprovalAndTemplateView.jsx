import React, { useState } from 'react';
import { CheckSquare, Smartphone, Monitor, Mail, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
export default function ApprovalAndTemplateView() {
    const [activeSubTab, setActiveSubTab] = useState('approvals');
    // Preview state
    const [previewDevice, setPreviewDevice] = useState('desktop');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    // Multi-language sample text
    const localizedContent = {
        en: { title: 'Visitor Arrival Notice', body: 'Dear Host, your visitor John Doe has arrived at the Main Entrance Reception desk.' },
        am: { title: 'የእንግዳ መድረስ ማስታወቂያ', body: 'ውድ አስተናጋጅ፣ እንግዳዎ ጆን ዶ ዋና መግቢያ አቀባበል ደርሷል።' },
        om: { title: 'Beeksisa Dhufaatii Keessummaa', body: 'Kabajamoo Simataa, keessummaan keessan John Doe balbala guddaa irra gaee jira.' },
        ti: { title: 'ሓበሬታ ምብፃሕ ኣጋይሽ', body: 'ዝኸበርካ ኣተኣናጋዲ፡ ጋሻኻ ጆን ዶ ኣብ ቐንዲ ኣፍደገ ኣትዩ ኣሎ።' },
        so: { title: 'Ogeaysiis Imaanshaha Martida', body: 'Guddoomiye amaan ah, martidaada John Doe waxay timid miiska soo dhoweynta.' }
    };
    return (<div className="space-y-6">
      {/* Sub Tab Bar */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit flex-wrap gap-1">
        {[
            { id: 'approvals', label: 'Approval Workflows (§4)' },
            { id: 'preview', label: 'Multi-Device Preview (§5)' },
            { id: 'templates', label: 'Template Designer (§17)' },
            { id: 'localization', label: 'Localization Engine (§18)' }
        ].map(t => (<button key={t.id} onClick={() => setActiveSubTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <span>{t.label}</span>
          </button>))}
      </div>

      {/* SUB TAB 1: APPROVAL WORKFLOWS (§4) */}
      {activeSubTab === 'approvals' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-indigo-400"/>
            <span>Notification Approval & Publishing Gateways</span>
          </h3>

          <div className="space-y-3">
            {[
                { id: 'app_101', title: 'Q3 Mass Organization Policy Update', author: 'HR Department', step: 'Manager Approval', status: 'Pending Manager' },
                { id: 'app_102', title: 'Emergency Drill Notification Broadcast', author: 'Safety Manager', step: 'Admin Final Sign-off', status: 'Pending Admin' }
            ].map(item => (<div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{item.title}</span>
                  <span className="text-slate-500 font-mono text-[11px]">Submitted by {item.author} • Step: {item.step}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5"/>
                    <span>Approve</span>
                  </button>
                  <button className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold flex items-center space-x-1">
                    <XCircle className="h-3.5 w-3.5"/>
                    <span>Reject</span>
                  </button>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* SUB TAB 2: MULTI-DEVICE PREVIEW (§5) */}
      {activeSubTab === 'preview' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
            <h4 className="text-xs font-bold text-white uppercase">Preview Controls</h4>
            <div>
              <label className="text-slate-400 block mb-1">Target Device / Channel</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                { id: 'desktop', label: 'Desktop Banner', icon: Monitor },
                { id: 'mobile', label: 'Mobile App Push', icon: Smartphone },
                { id: 'email', label: 'HTML Email', icon: Mail },
                { id: 'sms', label: 'SMS Handset', icon: MessageSquare }
            ].map(d => (<button key={d.id} onClick={() => setPreviewDevice(d.id)} className={`p-2.5 rounded-xl border text-center font-bold flex items-center justify-center space-x-2 ${previewDevice === d.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <d.icon className="h-3.5 w-3.5"/>
                    <span>{d.label}</span>
                  </button>))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Language Locale</label>
              <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold">
                <option value="en">English (US)</option>
                <option value="am">Amharic (አማርኛ)</option>
                <option value="om">Afaan Oromo</option>
                <option value="ti">Tigrinya (ትግርኛ)</option>
                <option value="so">Somali (Soomaali)</option>
              </select>
            </div>
          </div>

          {/* Render Frame */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
            <div className={`p-5 rounded-2xl border transition-all ${previewDevice === 'mobile' ? 'max-w-xs bg-slate-900 border-indigo-500/50 shadow-2xl' : 'w-full max-w-lg bg-slate-900 border-slate-800'}`}>
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-2">
                Live Rendering ({previewDevice.toUpperCase()} • {selectedLanguage.toUpperCase()})
              </div>
              <h4 className="text-base font-black text-white mb-2">
                {localizedContent[selectedLanguage]?.title}
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {localizedContent[selectedLanguage]?.body}
              </p>
            </div>
          </div>
        </div>)}

      {/* SUB TAB 3: TEMPLATE DESIGNER (§17) */}
      {activeSubTab === 'templates' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Template Designer & Versioning</h3>
          <p className="text-slate-400">Design HTML & Plain text notification templates with version control and dynamic variable bindings.</p>
        </div>)}

      {/* SUB TAB 4: LOCALIZATION ENGINE (§18) */}
      {activeSubTab === 'localization' && (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Language Localization Engine</h3>
          <p className="text-slate-400">Automated fallback translation & recipient language preference mapping for 5 core languages.</p>
        </div>)}
    </div>);
}
