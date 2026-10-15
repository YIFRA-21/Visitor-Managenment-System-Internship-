import React, { useState, useEffect } from 'react';
import { User, Building, Phone, Mail, Globe } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
export default function ReceptionistProfileSettings() {
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [message, setMessage] = useState(null);
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reception/profile');
            setProfileData(res.data);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, []);
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setMessage(null);
        try {
            await api.put('/reception/profile', profileData?.settings || {});
            setMessage({ type: 'success', text: 'Reception officer preferences updated.' });
        }
        catch (err) {
            setMessage({ type: 'error', text: 'Failed to update preferences.' });
        }
    };
    if (loading) {
        return <div className="p-12 text-center text-slate-400">Loading Reception Officer Profile...</div>;
    }
    const profile = profileData?.profile || {};
    const settings = profileData?.settings || {};
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center gap-3">
        <BackButton fallbackUrl="/dashboard"/>
        <div>
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6 text-indigo-400"/>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Reception Officer Profile & Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Front desk officer details, counter assignment, shift schedule, theme, and authentication settings.
          </p>
        </div>
      </div>

      {/* Alert */}
      {message && (<div className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <span className="text-xs font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
        </div>)}

      {/* Profile Overview Card */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="h-24 w-24 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 p-1 flex items-center justify-center shrink-0">
          <User className="h-12 w-12 text-slate-500"/>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl font-black text-white">{profile.full_name || 'Lisa Thompson'}</h2>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold rounded-full uppercase">
              {profile.user_code || 'REC000001'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold">{profile.job_title || 'Front Desk Reception Officer'} • {profile.org_name || 'HQ Silicon Valley Campus'}</p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-indigo-400"/>{profile.email || 'lisa.t@visitor.com'}</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-indigo-400"/>{profile.phone || '+1-555-0105'}</span>
          </div>
        </div>
      </div>

      {/* Grid Details & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Duty Assignment */}
        <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Building className="h-4 w-4 text-indigo-400"/>
            <span>Duty Assignment</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-850">
              <span className="text-slate-500">Reception Counter:</span>
              <strong className="text-white">{profile.reception_counter || 'Main Lobby Counter 1'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <span className="text-slate-500">Shift Schedule:</span>
              <strong className="text-indigo-400">{profile.shift_schedule || 'Morning Shift (07:00 - 15:00)'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <span className="text-slate-500">Branch Office:</span>
              <strong className="text-white">{profile.branch_name || 'HQ Silicon Valley Campus'}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Role Authority:</span>
              <strong className="text-emerald-400">Reception Officer (Front Desk Operational)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Workspace Preferences */}
        <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400"/>
            <span>Workspace Preferences</span>
          </h3>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold uppercase mb-1">Interface Theme</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none">
                <option value="dark">Enterprise Dark Mode</option>
                <option value="light">Enterprise Light Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold uppercase mb-1">Language</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none">
                <option value="en">English (US)</option>
                <option value="am">Amharic</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase">
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>);
}
