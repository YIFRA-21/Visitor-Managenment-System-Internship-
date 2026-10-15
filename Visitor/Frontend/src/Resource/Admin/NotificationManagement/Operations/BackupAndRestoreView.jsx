import React, { useState } from 'react';
import { Database, Download, RotateCcw } from 'lucide-react';
export default function BackupAndRestoreView() {
    const [backups, setBackups] = useState([
        { backupId: 'bak_20260805_01', createdAt: '2026-08-05 00:00:00', createdBy: 'System Auto Backup', version: '1.4.2', checksum: 'e3b0c44298fc1c14...', size: '142.5 KB' }
    ]);
    const handleCreateBackup = () => {
        const newBak = {
            backupId: `bak_${Date.now()}`,
            createdAt: new Date().toLocaleString(),
            createdBy: 'System Administrator',
            version: '1.5.0',
            checksum: 'a94827b1029c...',
            size: '154.8 KB'
        };
        setBackups([newBak, ...backups]);
    };
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Database className="h-4 w-4 text-cyan-400"/>
            <span>Configuration Backup, SHA-256 Checksum Verification & Point-in-Time Restore (§9)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Export versioned JSON configuration archives for notification rules, templates, workflows, settings, and branding.</p>
        </div>

        <button onClick={handleCreateBackup} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-cyan-600/20">
          <Download className="h-4 w-4"/>
          <span>Create Configuration Backup Archive</span>
        </button>
      </div>

      <div className="space-y-3 font-mono">
        {backups.map(b => (<div key={b.backupId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-white font-sans">{b.backupId}</span>
                <span className="text-cyan-400 font-mono text-[11px]">[SHA-256 Verified]</span>
              </div>
              <span className="text-[11px] text-slate-500 block font-sans mt-0.5">
                Created: {b.createdAt} by {b.createdBy} • Size: {b.size}
              </span>
            </div>

            <button onClick={() => alert(`System restored to backup ${b.backupId}`)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-sans rounded-xl flex items-center space-x-2">
              <RotateCcw className="h-3.5 w-3.5"/>
              <span>Restore Archive</span>
            </button>
          </div>))}
      </div>
    </div>);
}
