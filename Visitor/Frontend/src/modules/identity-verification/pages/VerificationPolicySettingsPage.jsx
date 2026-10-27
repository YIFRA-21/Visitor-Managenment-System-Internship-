import React, { useState, useEffect } from 'react';
import {
  Shield,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Lock,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import identityVerificationApi from '../api/identityVerificationApi';
import { useToast } from '../../../contexts/ToastContext';

export default function VerificationPolicySettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [policy, setPolicy] = useState({
    require_id_for_appointment: 0,
    gate_visitor_pass_issuance: 0,
    min_face_match_confidence: 0.85,
    min_liveness_confidence: 0.90,
    manual_review_threshold: 0.75,
    auto_approve_high_confidence: 1,
    session_expiry_minutes: 60,
    allowed_document_types: ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT'],
  });

  const fetchPolicy = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await identityVerificationApi.getPolicy();
      if (data) {
        setPolicy({
          ...data,
          allowed_document_types: Array.isArray(data.allowed_document_types)
            ? data.allowed_document_types
            : typeof data.allowed_document_types === 'string'
            ? JSON.parse(data.allowed_document_types)
            : ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT'],
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load policy settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleDocTypeToggle = (type) => {
    const current = [...policy.allowed_document_types];
    const index = current.indexOf(type);
    if (index > -1) {
      if (current.length === 1) {
        toast.error('At least one document type must remain allowed.');
        return;
      }
      current.splice(index, 1);
    } else {
      current.push(type);
    }
    setPolicy({ ...policy, allowed_document_types: current });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await identityVerificationApi.updatePolicy({
        ...policy,
        min_face_match_confidence: parseFloat(policy.min_face_match_confidence),
        min_liveness_confidence: parseFloat(policy.min_liveness_confidence),
        manual_review_threshold: parseFloat(policy.manual_review_threshold),
        session_expiry_minutes: parseInt(policy.session_expiry_minutes, 10),
      });
      toast.success('Identity verification security policies updated.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white">Identity Verification Policies</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Enterprise Rules
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure strictness thresholds, pass-issuance gating, and supported document rules.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPolicy}
          disabled={loading || saving}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Policy Enforcement Gating */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-5 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Workflow Enforcement Gates</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition gap-4">
              <div className="space-y-1 pr-4">
                <span className="font-bold text-white text-xs block">
                  Gate Visitor Pass Issuance on Verified Identity
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When enabled, physical QR passes and digital badges cannot be printed or issued unless visitor status is VERIFIED.
                </p>
              </div>
              <ToggleSwitch
                checked={Boolean(policy.gate_visitor_pass_issuance)}
                onChange={(checked) =>
                  setPolicy({ ...policy, gate_visitor_pass_issuance: checked ? 1 : 0 })
                }
                color="emerald"
                showLabelBadge={true}
              />
            </div>

            <div className="flex items-start justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition gap-4">
              <div className="space-y-1 pr-4">
                <span className="font-bold text-white text-xs block">
                  Require ID Verification to Book Appointments
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Requires external visitors to complete verification before appointment requests are forwarded for employee approval.
                </p>
              </div>
              <ToggleSwitch
                checked={Boolean(policy.require_id_for_appointment)}
                onChange={(checked) =>
                  setPolicy({ ...policy, require_id_for_appointment: checked ? 1 : 0 })
                }
                color="emerald"
                showLabelBadge={true}
              />
            </div>

            <div className="flex items-start justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition gap-4">
              <div className="space-y-1 pr-4">
                <span className="font-bold text-white text-xs block">
                  Auto-Approve High Confidence Submissions
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically set case to VERIFIED if both facial match and liveness surpass target thresholds without human officer bottleneck.
                </p>
              </div>
              <ToggleSwitch
                checked={Boolean(policy.auto_approve_high_confidence)}
                onChange={(checked) =>
                  setPolicy({ ...policy, auto_approve_high_confidence: checked ? 1 : 0 })
                }
                color="emerald"
                showLabelBadge={true}
              />
            </div>
          </div>
        </div>

        {/* Biometric Strictness Thresholds */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-5 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-400" />
            <span>Biometric Strictness Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-300">Minimum Face Match</label>
                <span className="font-mono text-emerald-400 font-bold">
                  {Math.round(policy.min_face_match_confidence * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={policy.min_face_match_confidence}
                onChange={(e) =>
                  setPolicy({ ...policy, min_face_match_confidence: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Geometry similarity required between ID and selfie</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-300">Minimum Liveness</label>
                <span className="font-mono text-teal-400 font-bold">
                  {Math.round(policy.min_liveness_confidence * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={policy.min_liveness_confidence}
                onChange={(e) =>
                  setPolicy({ ...policy, min_liveness_confidence: parseFloat(e.target.value) })
                }
                className="w-full accent-teal-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Anti-spoofing confidence threshold</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-300">Manual Review Routing</label>
                <span className="font-mono text-amber-400 font-bold">
                  {Math.round(policy.manual_review_threshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.01"
                value={policy.manual_review_threshold}
                onChange={(e) =>
                  setPolicy({ ...policy, manual_review_threshold: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Submissions below this score trigger human review</p>
            </div>
          </div>
        </div>

        {/* Allowed Document Types */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-sky-400" />
            <span>Permitted Document Types</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'PASSPORT', label: 'Passport' },
              { id: 'NATIONAL_ID', label: 'National ID' },
              { id: 'DRIVERS_LICENSE', label: "Driver's License" },
              { id: 'RESIDENCE_PERMIT', label: 'Resident Permit' },
            ].map((d) => {
              const active = policy.allowed_document_types.includes(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => handleDocTypeToggle(d.id)}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                    active
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <span>{d.label}</span>
                  {active && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xl shadow-emerald-950/30 transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Policies'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
