import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Save } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CountdownAlert from '../../components/common/CountdownAlert';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';
export default function DepartmentManagerProfileView() {
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Form states
    const [phone, setPhone] = useState('');
    const [office, setOffice] = useState('');
    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await managerApi.getProfile();
            setProfile(data);
            setPhone(data?.phone || data?.phone_number || '');
            setOffice(data?.office || 'Office 301, HR Wing');
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch manager profile');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await managerApi.updateProfile({ phone, office });
            setSuccess('Profile updated successfully!');
            fetchProfile();
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to update profile');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Department Manager Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Authorized Executive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review assigned organizational governance, department authority level, and personal contact parameters.
            </p>
          </div>
        </div>
      </div>

      {loading ? (<div className="py-20 text-center text-slate-400 text-xs animate-pulse">
          Loading executive profile...
        </div>) : profile ? (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Scope & Executive ID */}
          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div className="text-center space-y-3 pb-4 border-b border-slate-800">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 mx-auto flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-600/30">
                {profile.first_name?.[0] || 'M'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.full_name || profile.username}</h2>
                <p className="text-xs text-indigo-400 font-medium">{profile.position || 'Department Manager'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Manager ID: {profile.manager_number || `MGR-${profile.id}`}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Department</span>
                <p className="font-bold text-white">{profile.department_name} ({profile.department_code})</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assigned Branch</span>
                <p className="font-semibold text-slate-200">{profile.branch_name || 'Main Campus'}</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Organization</span>
                <p className="font-semibold text-slate-200">{profile.organization_name || 'Enterprise'}</p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Approval Level</span>
                <p className="font-bold text-emerald-300">Level {profile.approval_authority_level || 1} Authority</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Office Settings */}
          <div className="lg:col-span-2 p-6 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-slate-800">
              Personal Information & Settings
            </h3>

            {error && (
              <CountdownAlert
                alert={{ type: 'error', message: error }}
                onClose={() => setError('')}
                duration={10}
              />
            )}

            {success && (
              <CountdownAlert
                alert={{ type: 'success', message: success }}
                onClose={() => setSuccess('')}
                duration={10}
              />
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">{t('form.username', 'Username')}</label>
                  <input type="text" disabled value={profile.username || ''} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"/>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">{t('form.email', 'Corporate Email')}</label>
                  <input type="email" disabled value={profile.email || ''} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"/>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{t('form.phone', 'Office Phone / Mobile')}</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('placeholder.phone', '+251...')} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{t('form.officeLocation', 'Office Location')}</label>
                  <input type="text" value={office} onChange={(e) => setOffice(e.target.value)} placeholder={t('placeholder.address', 'Floor, wing, room number...')} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition">
                  <Save className="w-4 h-4"/>
                  <span>{saving ? t('btn.saving', 'Saving...') : t('btn.save', 'Save Profile Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>) : null}
    </div>);
}
