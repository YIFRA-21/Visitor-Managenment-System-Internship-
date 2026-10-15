import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Network, MapPin, User } from 'lucide-react';
import api from '../../../../services/api';
export default function DeptList() {
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    useEffect(() => {
        fetchDepts();
    }, []);
    const fetchDepts = () => {
        setLoading(true);
        api.get('/departments')
            .then((res) => {
            setDepts(Array.isArray(res.data) ? res.data : []);
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    };
    const deleteDept = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?'))
            return;
        try {
            await api.delete(`/departments/${id}`);
            fetchDepts();
        }
        catch (err) {
            console.error(err);
        }
    };
    const filtered = depts.filter(d => d.department_name.toLowerCase().includes(search.toLowerCase()) ||
        d.department_code.toLowerCase().includes(search.toLowerCase()));
    return (<div className="space-y-6">
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Network className="text-blue-600 h-7 w-7"/> Department Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Corporate divisions, structural layouts, and assigned department heads.
          </p>
        </div>
        <button onClick={() => alert('Add department flow')} className="btn btn-primary btn-sm d-flex align-items-center gap-2 text-xs font-bold">
          <Plus className="h-4 w-4"/> Add Department
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="position-relative">
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400 h-4.5 w-4.5"/>
          <input type="text" className="form-control ps-5 text-xs font-semibold" placeholder="Search departments by name or code..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (<div className="p-20 text-center">
            <div className="spinner-border text-primary" role="status"/>
          </div>) : filtered.length === 0 ? (<div className="p-20 text-center text-slate-500 font-semibold">
            No departments found.
          </div>) : (<div className="table-responsive">
            <table className="table align-middle text-xs mb-0">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Code / Name</th>
                  <th className="px-4 py-3">Manager Head</th>
                  <th className="px-4 py-3">Physical Location</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                {filtered.map((d) => (<tr key={d.id}>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono text-primary font-bold text-xxs block">{d.department_code}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{d.department_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400"/>
                        <span>{d.managerName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400"/>
                        <span>{d.location || 'Headquarters Site'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge text-xxs px-2.5 py-1.5 rounded-full font-bold uppercase ${d.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                    d.status === 'SUSPENDED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-success-subtle text-success'}`}>
                        {d.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button onClick={() => alert('Edit department')} className="btn btn-sm btn-outline-secondary p-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit Department">
                          <Edit className="h-4 w-4"/>
                        </button>
                        <button onClick={() => deleteDept(d.id)} className="btn btn-sm btn-outline-danger p-1.5" title="Delete Department">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>

    </div>);
}
