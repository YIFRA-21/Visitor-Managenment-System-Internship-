import React from 'react';
import { 
  ArrowUpDown, Eye, Edit, Trash2, Users, Package, Wrench, UserCheck, 
  GraduationCap, Heart, Truck, User, Building, Lock, RotateCcw,
  Briefcase, Award, HelpCircle, ShieldAlert
} from 'lucide-react';
import CategoryStatusBadge from './CategoryStatusBadge';
import { useLanguage } from '../../../../../contexts/LanguageContext';

export const getCategoryIcon = (categoryName = '', categoryCode = '') => {
    const name = String(categoryName).toLowerCase();
    const code = String(categoryCode).toLowerCase();

    if (name.includes('vip') || code.includes('vip')) {
        return { icon: <Award className="h-4 w-4 text-amber-400"/>, bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (name.includes('business') || code.includes('bus')) {
        return { icon: <Briefcase className="h-4 w-4 text-blue-400"/>, bg: 'bg-blue-500/10 border-blue-500/20' };
    }
    if (name.includes('contractor') || name.includes('maintenance') || code.includes('cont') || code.includes('tech')) {
        return { icon: <Wrench className="h-4 w-4 text-purple-400"/>, bg: 'bg-purple-500/10 border-purple-500/20' };
    }
    if (name.includes('vendor') || name.includes('supplier') || code.includes('ven') || code.includes('sup')) {
        return { icon: <Package className="h-4 w-4 text-emerald-400"/>, bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
    if (name.includes('gov') || name.includes('official') || code.includes('gov')) {
        return { icon: <Building className="h-4 w-4 text-cyan-400"/>, bg: 'bg-cyan-500/10 border-cyan-500/20' };
    }
    if (name.includes('interview') || name.includes('candidate') || code.includes('hr') || code.includes('int')) {
        return { icon: <UserCheck className="h-4 w-4 text-violet-400"/>, bg: 'bg-violet-500/10 border-violet-500/20' };
    }
    if (name.includes('client') || name.includes('customer') || code.includes('cli') || code.includes('cust')) {
        return { icon: <Users className="h-4 w-4 text-indigo-400"/>, bg: 'bg-indigo-500/10 border-indigo-500/20' };
    }
    if (name.includes('student') || name.includes('intern') || code.includes('stu')) {
        return { icon: <GraduationCap className="h-4 w-4 text-teal-400"/>, bg: 'bg-teal-500/10 border-teal-500/20' };
    }
    if (name.includes('guest') || code.includes('gst')) {
        return { icon: <Heart className="h-4 w-4 text-rose-400"/>, bg: 'bg-rose-500/10 border-rose-500/20' };
    }
    if (name.includes('delivery') || code.includes('del')) {
        return { icon: <Truck className="h-4 w-4 text-amber-500"/>, bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (name.includes('general') || code.includes('gen')) {
        return { icon: <User className="h-4 w-4 text-sky-400"/>, bg: 'bg-sky-500/10 border-sky-500/20' };
    }
    if (name.includes('other') || code.includes('oth')) {
        return { icon: <HelpCircle className="h-4 w-4 text-slate-400"/>, bg: 'bg-slate-500/10 border-slate-500/20' };
    }
    return { icon: <Users className="h-4 w-4 text-indigo-500"/>, bg: 'bg-indigo-500/10 border-indigo-500/20' };
};
export default function CategoryTable({ categories, selectedCategoryId, sortBy, sortOrder, onSort, onSelectRow, onView, onEdit, onStatus, onDelete, }) {
    const { t, tStatus } = useLanguage();
    const formatDate = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        catch {
            return dateStr;
        }
    };
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 ${sortBy === column ? 'text-blue-500' : 'text-slate-400'}`}/>);
    return (<div className="table-responsive">
      <table className="table align-middle text-xs mb-0">
        <thead>
          <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('category_name')}>
              {t('table.name', 'Category Name')} {renderSortIcon('category_name')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('category_code')}>
              {t('table.category', 'Category Code')} {renderSortIcon('category_code')}
            </th>
            <th className="px-4 py-3">{t('table.description', 'Description')}</th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('default_visit_duration')}>
              {t('table.duration', 'Default Duration')} {renderSortIcon('default_visit_duration')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('max_visit_duration')}>
              {t('table.duration', 'Max Duration')} {renderSortIcon('max_visit_duration')}
            </th>
            <th className="px-4 py-3 cursor-pointer text-center" onClick={() => onSort('approval_required')}>
              {t('table.status', 'Approval Required')} {renderSortIcon('approval_required')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('access_level')}>
              {t('table.zone', 'Access Level')} {renderSortIcon('access_level')}
            </th>
            <th className="px-4 py-3 cursor-pointer text-center" onClick={() => onSort('status')}>
              {t('table.status', 'Status')} {renderSortIcon('status')}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => onSort('created_at')}>
              {t('table.createdDate', 'Created Date')} {renderSortIcon('created_at')}
            </th>
            <th className="px-4 py-3 text-end">{t('table.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {categories.map((c) => {
            const isSelected = selectedCategoryId === c.id;
            const iconConfig = getCategoryIcon(c.category_name, c.category_code);
            return (<tr key={c.id} onClick={() => onSelectRow(c)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600/15 border-indigo-500/30' : 'hover:bg-slate-800/40 text-slate-300'}`}>
                <td className="px-4 py-3">
                  <div className="d-flex align-items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg d-flex align-items-center justify-content-center shrink-0 border ${iconConfig.bg}`}>
                      {iconConfig.icon}
                    </div>
                    <span className="font-extrabold text-white d-block">{c.category_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-monospace text-[10px] px-2 py-1 rounded fw-bold" style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    letterSpacing: '0.5px',
                }}>{c.category_code}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 font-semibold" style={{ maxWidth: 200 }}>
                  <span className="d-block text-truncate">{c.description || 'N/A'}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-300">
                  {c.default_visit_duration}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-300">
                  {c.max_visit_duration}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.approval_required ? (<span className="badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">Yes</span>) : (<span className="badge bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold">No</span>)}
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-slate-900 border border-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded">
                    {c.access_level}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <CategoryStatusBadge status={c.status} size="sm"/>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-400 whitespace-nowrap">
                  {formatDate(c.created_at)}
                </td>
                <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="d-flex justify-content-end gap-1.5">
                    <button onClick={() => onView(c)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="View Standalone Details Page">
                      <Eye className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="Edit Category">
                      <Edit className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => onStatus(c)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors" title={c.status === 'Archived' || c.is_archived ? 'Restore Category' : 'Archive Category'}>
                      {c.status === 'Archived' || c.is_archived ? <RotateCcw className="h-3.5 w-3.5"/> : <Lock className="h-3.5 w-3.5"/>}
                    </button>
                    <button onClick={() => onDelete(c)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 text-rose-400 hover:text-rose-300 transition-colors" title="Delete Category">
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                </td>
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
}
