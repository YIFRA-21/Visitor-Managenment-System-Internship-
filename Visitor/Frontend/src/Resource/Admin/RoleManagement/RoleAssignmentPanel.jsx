import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
import api from '../../../services/api';
export default function RoleAssignmentPanel({ roles, preselectedRoleId, onClose, onSuccess, }) {
    const [selectedRoleId, setSelectedRoleId] = useState(preselectedRoleId || (roles[0]?.id || 0));
    const [selectedUserId, setSelectedUserId] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [orgId, setOrgId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [deptId, setDeptId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [assignmentReason, setAssignmentReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users', { params: { limit: 100 } });
            if (res.data?.data) {
                setUsersList(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to load users:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAssign = async () => {
        if (!selectedRoleId || !selectedUserId) {
            setErrorMsg('Please select both a role and a target user.');
            return;
        }
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const payload = {
                userId: Number(selectedUserId),
                organizationId: orgId ? Number(orgId) : null,
                branchId: branchId ? Number(branchId) : null,
                departmentId: deptId ? Number(deptId) : null,
                startDate: startDate ? new Date(startDate).toISOString() : null,
                endDate: endDate ? new Date(endDate).toISOString() : null,
                assignmentReason: assignmentReason.trim() || null,
            };
            const res = await roleManagementApi.assignUser(selectedRoleId, payload);
            if (res.data?.success) {
                onSuccess();
            }
        }
        catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to assign role';
            setErrorMsg(msg);
        }
        finally {
            setSubmitting(false);
        }
    };
    const targetRole = roles.find((r) => r.id === Number(selectedRoleId));
    return createPortal(<div className="fixed top-[64px] bottom-0 right-0 left-0 md:left-[260px] z-[1070] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono text-xs text-slate-300 overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Users className="h-5 w-5"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Assign Security Role</h2>
              <p className="text-xs text-slate-400">Grant permissions & scoped access to an active user</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (<div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0"/>
              <span>{errorMsg}</span>
            </div>)}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Security Role *
            </label>
            <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
              {roles.map((r) => (<option key={r.id} value={r.id}>
                  {r.role_name} ({r.role_code}) — {r.risk_level || 'LOW'} RISK
                </option>))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Target User *
            </label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value="">-- Choose User --</option>
              {usersList.map((u) => (<option key={u.id} value={u.id}>
                  {u.username || u.name} ({u.email})
                </option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Effective Start Date
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Expiration / End Date
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"/>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Assignment Reason / Ticket Reference
            </label>
            <textarea rows={2} value={assignmentReason} onChange={(e) => setAssignmentReason(e.target.value)} placeholder="e.g. Approved under Access Request #4810 for temporary audit coverage" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"/>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase">
            Cancel
          </button>
          <button disabled={submitting || !selectedUserId || !selectedRoleId} onClick={handleAssign} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2">
            {submitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </motion.div>
    </div>, document.body);
}
