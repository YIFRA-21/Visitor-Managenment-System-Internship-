import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { departmentsApi } from '../../services/api';
import RefreshButton from '../../components/common/RefreshButton';
import useResponseNavigation from '../../modules/response/useResponseNavigation';
import { RESPONSE_TYPES } from '../../modules/response/responseConfig';

export default function DepartmentSettings({ departments = [], setDepartments }) {
    const [departmentCode, setDepartmentCode] = useState('');
    const [departmentName, setDepartmentName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const { toConfirmation, toSuccess, toError } = useResponseNavigation();

    const handleDelete = (id, name) => {
        toConfirmation({
            title: `Delete Department "${name}"`,
            message: `You are about to permanently remove department "${name}" from the enterprise system.`,
            entityType: 'Department',
            entityName: name,
            entityId: id,
            consequences: [
                'Employees assigned to this department will require reassignment.',
                'Sub-units and rooms linked to this department will lose their parent association.',
                'Active visitor appointments mapped to this department will be flagged for review.'
            ],
            confirmLabel: 'Confirm Permanent Deletion',
            confirmVariant: 'danger',
            apiEndpoint: `/departments/${id}`,
            apiMethod: 'DELETE',
            returnUrl: '/admin/departments',
            successConfig: {
                type: RESPONSE_TYPES.SUCCESS,
                title: 'Department Deleted',
                message: `Department "${name}" has been permanently deleted from the database.`,
                entityType: 'Department',
                entityName: name,
            }
        });
    };

    const fetchDepartments = async () => {
        if (setDepartments) {
            const res = await departmentsApi.list();
            setDepartments(res.data);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await departmentsApi.create({ departmentCode, departmentName, description });
            toSuccess({
                title: 'Department Created Successfully',
                message: `Department "${departmentName}" (${departmentCode}) has been successfully created.`,
                entityType: 'Department',
                entityName: departmentName,
                referenceId: res?.data?.id || departmentCode,
                returnUrl: '/admin/departments',
            });
        }
        catch (err) {
            toError(err, {
                title: 'Failed to Create Department',
                entityType: 'Department',
                entityName: departmentName,
                returnUrl: '/admin/departments',
            });
        }
    };
    return (<div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl transition-all duration-300 hover:border-indigo-500/50">
      <div className="mb-8 pb-6 border-b border-slate-800 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/dashboard"/>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Department Management ({departments.length})</h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Configure company divisions and manager assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={fetchDepartments}/>
          <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold uppercase tracking-wider">
            Admin Domain
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800/50 rounded-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-bold">Code</th>
                  <th className="pb-3 pr-4 font-bold">Department</th>
                  <th className="pb-3 pr-4 font-bold">Manager</th>
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 font-bold text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (<tr key={d.id} className="border-b border-slate-900/50 hover:bg-slate-900/10">
                    <td className="py-4 pr-4 text-indigo-400 font-mono font-bold">
                      {d.department_code}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-slate-200">{d.department_name || d.name}</div>
                      <div className="text-slate-500 mt-1 text-[11px]">{d.description || 'No description'}</div>
                    </td>
                    <td className="py-4 pr-4 text-cyan-400 font-medium">
                      {d.managerName || d.manager_name || 'No Manager Assigned'}
                    </td>
                    <td className="py-4 font-bold text-slate-300">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${d.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {d.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 text-end">
                      <button onClick={() => handleDelete(d.id, d.department_name || d.name)} disabled={deletingId === d.id} className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 inline-flex items-center justify-center transition-all shadow-sm" title="Delete Department" aria-label="Delete Department">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/50 rounded-xl p-6 h-fit">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300 mb-4 border-b border-slate-900 pb-2">Add Division</h3>
          {error && <div className="mb-3 text-red-500 text-xs font-bold">{error}</div>}
          {success && <div className="mb-3 text-emerald-500 text-xs font-bold">{success}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department Code</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)} placeholder="e.g. ENG" required/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Division Name</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} placeholder="e.g. Engineering" required/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
              <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono h-24 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Division details..."/>
            </div>
            <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs uppercase tracking-widest font-bold transition-colors">
              Create Department
            </button>
          </form>
        </div>
      </div>
    </div>);
}
