// Frontend/src/Resource/Manager/DepartmentVisitorsView.tsx
import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, RefreshCw } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { managerApi } from '../../modules/employee-management/api/managerApi';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DepartmentVisitorsView() {
    const { t, tStatus } = useLanguage();
    const [visitors, setVisitors] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const fetchVisitors = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await managerApi.getVisitors({ search });
            setVisitors(res.visitors);
            setTotal(res.total);
        }
        catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch department visitors');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchVisitors();
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        fetchVisitors();
    };
    return (<div className="p-6 space-y-6 bg-[#080d16] min-h-screen text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Department Visitor Registry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-500/30 text-sky-400">
                Department Scoped
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly isolated history of guests who have appointments with this department.
            </p>
          </div>
        </div>

        <button onClick={fetchVisitors} disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search visitor by name, company, email..." className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"/>
        </form>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-white">{visitors.length}</strong> of {total} registered guests
        </span>
      </div>

      {/* Visitors Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (<div className="py-20 text-center text-slate-400 text-xs animate-pulse">
            Querying department visitor archive...
          </div>) : visitors.length === 0 ? (<div className="py-16 text-center text-slate-500 text-xs italic">
            No visitors found for this department.
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">{t('table.visitor', 'Visitor')}</th>
                  <th className="py-3.5 px-4">{t('table.company', 'Organization / Company')}</th>
                  <th className="py-3.5 px-4">{t('table.contact', 'Contact')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.visitsInDept', 'Visits in Dept')}</th>
                  <th className="py-3.5 px-4">{t('table.lastVisit', 'Last Visit')}</th>
                  <th className="py-3.5 px-4">{t('table.host', 'Last Host')}</th>
                  <th className="py-3.5 px-4 text-center">{t('table.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visitors.map((v) => (<tr key={v.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-bold text-sky-400 text-xs">
                          {v.full_name?.[0] || 'V'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{v.full_name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {v.visitor_code || `VIS-${v.id}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {v.company || 'Individual / Non-corporate'}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500"/> {v.email || 'N/A'}
                      </p>
                      {v.phone && (<p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500"/> {v.phone}
                        </p>)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-800 rounded-full font-bold text-slate-200">
                        {v.department_visits_count || 1}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {v.last_visit_date ? (<>
                          <p className="font-medium">
                            {new Date(v.last_visit_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(v.last_visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>) : (<span className="text-slate-500">No date recorded</span>)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {v.last_host_name || 'Staff Member'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {v.registration_status || v.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
