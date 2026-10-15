import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { dashboardApi } from '../../services/api';
export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen)
                    onClose();
                else
                    setQuery('');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await dashboardApi.search(query);
                setResults(res.data.data || []);
            }
            catch (err) {
                setResults([]);
            }
            finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-0">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0"/>
          <input type="text" autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search visitors, appointments, users, passes, security alerts..." className="w-full bg-transparent text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none"/>
          {loading ? (<Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0"/>) : (<button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4"/>
            </button>)}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() ? (<p className="text-center text-xs text-slate-400 py-6">Type a search query or press Ctrl+K</p>) : results.length === 0 && !loading ? (<p className="text-center text-xs text-slate-400 py-6">No matching records found for "{query}"</p>) : (<div className="space-y-1">
              {results.map((item, i) => (<button key={i} onClick={() => {
                    onNavigate(item.link || '/');
                    onClose();
                }} className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{item.title}</p>
                    <span className="text-[10px] text-indigo-500 uppercase font-semibold">{item.category}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition"/>
                </button>))}
            </div>)}
        </div>
      </div>
    </div>);
}
