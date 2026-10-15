import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Check, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
export default function RoleTemplatesModal({ onClose, onSuccess }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateCode, setSelectedTemplateCode] = useState('');
    const [customName, setCustomName] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        loadTemplates();
    }, []);
    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await roleManagementApi.listTemplates();
            if (res.data?.success) {
                setTemplates(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedTemplateCode(res.data.data[0].template_code);
                }
            }
        }
        catch (err) {
            console.error('Failed to load templates:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInstantiate = async () => {
        if (!selectedTemplateCode)
            return;
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await roleManagementApi.instantiateTemplate({
                templateCode: selectedTemplateCode,
                customName: customName.trim() || undefined,
            });
            if (res.data?.success) {
                onSuccess();
            }
        }
        catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to instantiate template');
        }
        finally {
            setSubmitting(false);
        }
    };
    return createPortal(<div className="fixed top-[64px] bottom-0 right-0 left-0 md:left-[260px] z-[1070] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs text-slate-300">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Sparkles className="h-5 w-5"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Enterprise Role Templates Catalog</h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950/80 text-purple-400 border border-purple-500/30">
                  PRE-CONFIGURED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Instantiate pre-configured industry role standards into your RBAC system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors" title="Close Template Catalog">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {errorMsg && (<div className="mx-6 mt-3 p-3 bg-rose-950/80 border border-rose-700/50 rounded-xl text-rose-300 shrink-0">
            {errorMsg}
          </div>)}

        {/* Content Body - flex-1 with internal scrolling so footer is never pushed out */}
        <div className="p-5 md:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {loading ? (<div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
              <span>Loading role templates catalog...</span>
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplateCode === tmpl.template_code;
                return (<div key={tmpl.id} onClick={() => setSelectedTemplateCode(tmpl.template_code)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${isSelected
                        ? 'bg-purple-950/50 border-purple-500 text-white shadow-lg shadow-purple-900/20'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950'}`}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 transition-colors ${isSelected ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                        <Shield className="h-5 w-5"/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-xs leading-snug">{tmpl.template_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-cyan-400 border border-slate-800">
                            {tmpl.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{tmpl.description}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-purple-400 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                            Scope: {tmpl.scope_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-1 transition-all ${isSelected ? 'border-purple-400 bg-purple-600 text-white shadow-sm' : 'border-slate-700 bg-slate-900'}`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]"/>}
                    </div>
                  </div>);
            })}
            </div>)}

          <div className="pt-2">
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Custom Role Title (Optional)
            </label>
            <input type="text" placeholder="Override template title (e.g. Senior Branch Host, Front Desk Supervisor)..." value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"/>
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to use the standard template title, or provide a tailored business role name.
            </p>
          </div>
        </div>

        {/* Footer - shrink-0 pinned at bottom so it is always 100% visible */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="h-[42px] px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors">
            Cancel
          </button>
          <button disabled={submitting || !selectedTemplateCode} onClick={handleInstantiate} className="h-[42px] px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all">
            <Sparkles className="h-4 w-4"/>
            {submitting ? 'Instantiating...' : 'Instantiate Template'}
          </button>
        </div>
      </motion.div>
    </div>, document.body);
}
