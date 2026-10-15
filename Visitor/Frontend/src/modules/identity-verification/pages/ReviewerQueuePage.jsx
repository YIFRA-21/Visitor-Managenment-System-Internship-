import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import StatusBadge from '../components/StatusBadge';
import identityVerificationApi from '../api/identityVerificationApi';
import { useToast } from '../../../contexts/ToastContext';

export default function ReviewerQueuePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await identityVerificationApi.getReviewerQueue({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setCases(res || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch reviewer queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  const pendingCount = cases.filter((c) => c.status === 'IN_REVIEW' || c.status === 'PENDING').length;
  const verifiedCount = cases.filter((c) => c.status === 'VERIFIED').length;
  const rejectedCount = cases.filter((c) => c.status === 'REJECTED').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white">Identity Verification Queue</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Security Officer Workbench
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit visitor identity submissions, inspect OCR extraction, and approve or reject access credentials.
            </p>
          </div>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Awaiting Review</p>
            <p className="text-2xl font-black text-white mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Verified Cases</p>
            <p className="text-2xl font-black text-white mt-1">{verifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Rejected / Flagged</p>
            <p className="text-2xl font-black text-white mt-1">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor name, email, or case number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="IN_REVIEW">In Review (Priority)</option>
            <option value="PENDING">Pending Automated</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Case #</th>
                <th className="py-3.5 px-4">Visitor</th>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Scores</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>Loading verification cases...</span>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-400">No identity cases found.</p>
                    <p className="text-[11px]">All submissions have been cleared or match no filters.</p>
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => navigate(`/security/identity-reviews/${c.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {c.case_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {c.visitor_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Visitor'}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.visitor_email || 'No email'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">
                        {c.document_type ? c.document_type.replace('_', ' ') : 'National ID'}
                      </span>
                      <div className="text-[10px] text-slate-400">{c.issuing_country || 'Ethiopia'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="text-emerald-400">
                          Face: {c.face_match_confidence ? `${Math.round(c.face_match_confidence * 100)}%` : 'N/A'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-teal-400">
                          Live: {c.liveness_score ? `${Math.round(c.liveness_score * 100)}%` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(c.created_at || c.started_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/security/identity-reviews/${c.id}`);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ml-auto"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
