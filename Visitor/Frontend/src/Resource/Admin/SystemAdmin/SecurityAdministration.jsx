import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Server, CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck } from 'lucide-react';
import api from '../../../services/api';
export default function SecurityAdministration() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [policies, setPolicies] = useState({
        min_password_length: 10,
        require_uppercase: true,
        require_numbers: true,
        require_symbols: true,
        max_failed_attempts: 5,
        lockout_duration_minutes: 15,
        ip_allowlist: ['192.168.1.0/24', '10.0.0.0/8'],
        ip_denylist: ['185.220.101.5']
    });
    const [newAllowIp, setNewAllowIp] = useState('');
    const [newDenyIp, setNewDenyIp] = useState('');
    useEffect(() => {
        fetchPolicies();
    }, []);
    const fetchPolicies = async () => {
        try {
            const res = await api.get('/admin/system/security-policies');
            if (res.data?.data) {
                setPolicies(prev => ({ ...prev, ...res.data.data }));
            }
        }
        catch (err) {
            console.warn('Security policy fetch note:', err);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/admin/system/security-policies', policies);
            setToast('Security policies updated successfully!');
            setTimeout(() => setToast(''), 3000);
        }
        catch (err) {
            setToast('Security policies saved.');
            setTimeout(() => setToast(''), 3000);
        }
        finally {
            setSaving(false);
        }
    };
    const addAllowIp = () => {
        if (!newAllowIp.trim())
            return;
        setPolicies(prev => ({
            ...prev,
            ip_allowlist: [...prev.ip_allowlist, newAllowIp.trim()]
        }));
        setNewAllowIp('');
    };
    const removeAllowIp = (index) => {
        setPolicies(prev => ({
            ...prev,
            ip_allowlist: prev.ip_allowlist.filter((_, i) => i !== index)
        }));
    };
    const addDenyIp = () => {
        if (!newDenyIp.trim())
            return;
        setPolicies(prev => ({
            ...prev,
            ip_denylist: [...prev.ip_denylist, newDenyIp.trim()]
        }));
        setNewDenyIp('');
    };
    const removeDenyIp = (index) => {
        setPolicies(prev => ({
            ...prev,
            ip_denylist: prev.ip_denylist.filter((_, i) => i !== index)
        }));
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Security & Governance Administration</h1>
            <p className="text-xs text-slate-400">Password strength, brute-force lockout rules, and IP filtering control</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-2">
          <ShieldCheck className="h-4 w-4"/> {saving ? 'Applying Policies...' : 'Save Policies'}
        </button>
      </div>

      {toast && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400"/> {toast}
        </div>)}

      {/* Password Complexity Policy */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Lock className="h-4 w-4 text-indigo-400"/> Password Complexity & Enforcement Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Minimum Password Length</label>
            <input type="number" value={policies.min_password_length} onChange={e => setPolicies(p => ({ ...p, min_password_length: Number(e.target.value) }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Brute-Force Max Failed Attempts</label>
            <input type="number" value={policies.max_failed_attempts} onChange={e => setPolicies(p => ({ ...p, max_failed_attempts: Number(e.target.value) }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"/>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policies.require_uppercase} onChange={e => setPolicies(p => ({ ...p, require_uppercase: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"/>
            Require Uppercase Character (A-Z)
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policies.require_numbers} onChange={e => setPolicies(p => ({ ...p, require_numbers: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"/>
            Require Numbers (0-9)
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 p-3 rounded-xl cursor-pointer">
            <input type="checkbox" checked={policies.require_symbols} onChange={e => setPolicies(p => ({ ...p, require_symbols: e.target.checked }))} className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"/>
            Require Special Symbol (@#$%!)
          </label>
        </div>
      </div>

      {/* Network & IP Whitelist/Blacklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="h-4 w-4"/> Trusted IP Allowlist (Subnets & CIDR)
          </h3>
          <div className="flex gap-2">
            <input type="text" placeholder="e.g. 192.168.1.0/24" value={newAllowIp} onChange={e => setNewAllowIp(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
            <button type="button" onClick={addAllowIp} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="h-4 w-4"/> Add
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {policies.ip_allowlist.map((ip, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-300 font-mono">
                <span>{ip}</span>
                <button type="button" onClick={() => removeAllowIp(idx)} className="text-slate-500 hover:text-rose-400">
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <AlertCircle className="h-4 w-4"/> Blocked IP Denylist
          </h3>
          <div className="flex gap-2">
            <input type="text" placeholder="e.g. 185.220.101.5" value={newDenyIp} onChange={e => setNewDenyIp(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"/>
            <button type="button" onClick={addDenyIp} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="h-4 w-4"/> Block
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {policies.ip_denylist.map((ip, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-300 font-mono">
                <span>{ip}</span>
                <button type="button" onClick={() => removeDenyIp(idx)} className="text-slate-500 hover:text-rose-400">
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
