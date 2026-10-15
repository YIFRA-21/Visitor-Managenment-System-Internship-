import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
export default function RoleCloneModal({ role, onClose, onSuccess }) {
    const [newRoleName, setNewRoleName] = useState(`${role.role_name} (Copy)`);
    const [newRoleCode, setNewRoleCode] = useState(`${role.role_code}_COPY`);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const handleClone = async () => {
        if (!newRoleName.trim() || !newRoleCode.trim()) {
            setErrorMsg('Both new Role Name and Role Code are required');
            return;
        }
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await roleManagementApi.cloneRole(role.id, {
                newRoleCode: newRoleCode.trim().toUpperCase(),
                newRoleName: newRoleName.trim(),
            });
            if (res.data?.success) {
                onSuccess();
            }
        }
        catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to clone role');
        }
        finally {
            setSubmitting(false);
        }
    };
    return createPortal(<div className="fixed top-[64px] bottom-0 right-0 left-0 md:left-[260px] z-[1070] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono text-xs text-slate-300 overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Copy className="h-5 w-5"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Clone Security Role</h2>
              <p className="text-xs text-slate-400">Source: {role.role_name} ({role.role_code})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {errorMsg && (<div className="mx-6 mt-4 p-3 bg-rose-950/80 border border-rose-700/50 rounded-xl text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0"/>
            <span>{errorMsg}</span>
          </div>)}

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider">New Role Display Name *</label>
            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"/>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider">New Unique Role Code *</label>
            <input type="text" value={newRoleCode} onChange={(e) => setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-mono focus:outline-none focus:border-indigo-500"/>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            Cloning duplicates role description, scope type, configurations, priority, and permission bindings. It does NOT copy user assignments or audit logs.
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase">
            Cancel
          </button>
          <button disabled={submitting} onClick={handleClone} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center gap-2">
            {submitting ? 'Cloning...' : 'Confirm & Clone Role'}
          </button>
        </div>
      </motion.div>
    </div>, document.body);
}
