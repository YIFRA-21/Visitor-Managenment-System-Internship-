import { useState, useEffect } from 'react';
import { Star, Send, Smile, CheckCircle, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { visitorPortalApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VisitorFeedback() {
    const { t } = useLanguage();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Ratings
    const [overall, setOverall] = useState(5);
    const [reception, setReception] = useState(5);
    const [security, setSecurity] = useState(5);
    const [host, setHost] = useState(5);
    // Text fields
    const [comments, setComments] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [complaints, setComplaints] = useState('');
    const loadFeedback = () => {
        setLoading(true);
        visitorPortalApi.getFeedback()
            .then((res) => setFeedbacks(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        loadFeedback();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await visitorPortalApi.submitFeedback({
                overallRating: overall,
                receptionRating: reception,
                securityRating: security,
                hostRating: host,
                suggestions: comments || suggestions,
                complaints: complaints || undefined,
            });
            setSuccess('Feedback submitted successfully. Thank you!');
            setComments('');
            setSuggestions('');
            setComplaints('');
            setOverall(5);
            setReception(5);
            setSecurity(5);
            setHost(5);
            loadFeedback();
            setTimeout(() => setSuccess(''), 4000);
        }
        catch (err) {
            setError(getErrorMessage(err) || 'Failed to submit feedback');
        }
        finally {
            setSubmitting(false);
        }
    };
    const StarRating = ({ value, onChange, label }) => (<div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex gap-1.5 items-center">
        {[1, 2, 3, 4, 5].map((star) => (<button type="button" key={star} onClick={() => onChange(star)} className="focus:outline-none transition-transform hover:scale-110">
            <Star className={`h-5 w-5 ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-350 dark:text-slate-700'}`}/>
          </button>))}
        <span className="text-xs text-slate-500 font-bold ml-2 font-mono">{value}/5</span>
      </div>
    </div>);
    return (<div className="space-y-5 text-slate-800 dark:text-slate-200">
      {/* Breadcrumb */}
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        Dashboard <span className="mx-1.5">{'>'}</span> <span className="text-slate-900 dark:text-white">Visit Feedback</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">Visit Feedback</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
              Help us improve by rating your recent visit experiences.
            </p>
          </div>
        </div>
        <button onClick={loadFeedback} className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm">
          <RefreshCw className="h-4 w-4"/> Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/30 p-3 rounded-lg text-xs font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4"/>{error}</div>}
      {success && <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 p-3 rounded-lg text-xs font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4"/>{success}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Card */}
        <div className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-5 border-b border-slate-100 dark:border-slate-900 pb-2 flex items-center gap-2">
            <Smile className="h-4 w-4 text-blue-650"/> Rate Your Experience
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StarRating label={t('feedback.overallExperience', 'Overall Experience *')} value={overall} onChange={setOverall}/>
              <StarRating label={t('feedback.receptionDesk', 'Reception Desk')} value={reception} onChange={setReception}/>
              <StarRating label={t('feedback.securityStaff', 'Security Staff')} value={security} onChange={setSecurity}/>
              <StarRating label={t('feedback.hostRepresentative', 'Host Representative')} value={host} onChange={setHost}/>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('form.suggestions', 'Suggestions / Comments')}</label>
              <textarea className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 h-20 resize-none font-mono" placeholder={t('placeholder.suggestions', 'What did you like? What can we do better?')} value={comments} onChange={(e) => setComments(e.target.value)}/>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('form.complaints', 'Complaints (If any)')}</label>
              <textarea className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 h-16 resize-none font-mono" placeholder={t('placeholder.complaints', 'Report any issues encountered during check-in or visit...')} value={complaints} onChange={(e) => setComplaints(e.target.value)}/>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              <Send className="h-3.5 w-3.5"/>
              {submitting ? t('btn.submitting', 'Submitting...') : t('btn.submitFeedback', 'Submit Feedback')}
            </button>
          </form>
        </div>

        {/* History Card */}
        <div className="bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-5 border-b border-slate-100 dark:border-slate-900 pb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-600"/> Past Feedback History
          </h3>
          {loading ? (<div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"/>
            </div>) : feedbacks.length > 0 ? (<div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {feedbacks.map((item) => (<div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-905 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] text-blue-650 dark:text-blue-400 font-bold tracking-widest uppercase bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/10 px-2 py-0.5 rounded">
                        {item.reference_code || 'General'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                        Host: {item.host_name || '—'}
                      </p>
                    </div>
                    <div className="flex gap-0.5 text-amber-400 items-center">
                      <Star className="h-3.5 w-3.5 fill-amber-400"/>
                      <span className="text-xs font-bold font-mono">{item.overall_rating}/5</span>
                    </div>
                  </div>
                  {(item.comments || item.suggestions) && (<p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-100 dark:border-slate-800 font-mono">
                      {item.comments || item.suggestions}
                    </p>)}
                  {item.complaints && (<div className="p-2 bg-red-50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/10 rounded">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 block mb-0.5">Complaint filed</span>
                      <p className="text-xs text-red-650 dark:text-red-400/90 font-mono">{item.complaints}</p>
                    </div>)}
                  <span className="text-[8px] text-slate-400 dark:text-slate-650 font-mono block">
                    Submitted: {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>))}
            </div>) : (<div className="py-16 text-center">
              <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-2"/>
              <p className="text-slate-500 text-sm font-bold">No feedback history</p>
            </div>)}
        </div>
      </div>
    </div>);
}
