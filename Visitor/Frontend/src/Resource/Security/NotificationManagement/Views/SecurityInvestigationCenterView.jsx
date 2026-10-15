import React from 'react';
import { Briefcase, Paperclip, Plus } from 'lucide-react';
const SecurityInvestigationCenterView = () => {
    return (<div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-400"/> Security Investigation Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage case timelines, linked security alerts, evidence files, and resolution workflows.</p>
        </div>

        <button className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-violet-600/20">
          <Plus className="w-4 h-4"/> Open New Investigation Case
        </button>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="flex justify-between items-start pb-4 border-b border-slate-900">
          <div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block">Case #CASE-8001</span>
            <h3 className="text-sm font-bold text-white mt-1">Watchlist Visitor Detection & Turnstile Attempt</h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Subject: Arthur Pendelton (ID-99021-X) • Officer: Officer Marcus Vance</p>
          </div>
          <span className="bg-violet-500/10 text-violet-400 border border-violet-500/30 px-3 py-1 rounded font-bold">Active Investigation</span>
        </div>

        <div>
          <h4 className="font-bold text-white mb-2">Evidence Files Attached (2)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-400"/>
                <span>snap_turnstile_3001.jpg</span>
              </div>
              <span className="text-slate-500 text-[11px]">CCTV Image</span>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-400"/>
                <span>ocr_national_id_804.pdf</span>
              </div>
              <span className="text-slate-500 text-[11px]">OCR PDF Scan</span>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
export default SecurityInvestigationCenterView;
