import React, { useState } from 'react';
import { X, Save, Eye, EyeOff, LayoutGrid } from 'lucide-react';
export default function WidgetCustomizerModal({ isOpen, onClose, widgets, onSave }) {
    const [list, setList] = useState(widgets);
    if (!isOpen)
        return null;
    const toggle = (id) => {
        setList(arr => arr.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
    };
    const handleSave = () => {
        onSave(list);
        onClose();
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-500"/> Customize Workspace Layout
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enable or disable interactive widgets to tailor your personal role dashboard view.
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {list.map(w => (<div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{w.name}</p>
                <p className="text-[10px] text-slate-400">{w.category}</p>
              </div>
              <button type="button" onClick={() => toggle(w.id)} className={`p-2 rounded-lg font-bold transition flex items-center gap-1.5 ${w.enabled ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {w.enabled ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>}
                {w.enabled ? 'Visible' : 'Hidden'}
              </button>
            </div>))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5">
            <Save className="h-4 w-4"/> Save Layout
          </button>
        </div>
      </div>
    </div>);
}
