import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Edit, Trash2, Printer, Clock, ArrowUpDown, User } from 'lucide-react';
import { resolvePhotoUrl } from '../../../../../utils/photoUtils';
import { useLanguage } from '../../../../../contexts/LanguageContext';

export default function VisitorHistoryTable(props) {
    const { t, tStatus } = useLanguage();
    const [, setSearchParams] = useSearchParams();
    const { histories, selectedHistoryId, sortBy, sortOrder, onSort, onSelectRow, onView, onViewStandalone, onEdit, onDelete, onPrintRow } = props;
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
    const formatTime = (dateStr) => {
        if (!dateStr)
            return 'N/A';
        try {
            return new Date(dateStr).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        catch {
            return dateStr;
        }
    };
    const renderSortIcon = (column) => (<ArrowUpDown className={`h-3 w-3 ms-1 ${sortBy === column ? 'text-blue-500' : 'text-slate-400'}`}/>);
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
            case 'early check-out':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'overstayed':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
            default:
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        }
    };
    return (<div className="table-responsive">
      <table className="table align-middle text-xs mb-0">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 border-bottom border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <th className="px-3 py-3 text-center" style={{ width: '56px' }}>
              {t('table.visitor', 'Visitor')}
            </th>
            <th className="px-3 py-3 cursor-pointer" onClick={() => onSort('history_code')}>
              {t('table.referenceCode', 'Visitor ID / Reference No.')} {renderSortIcon('history_code')}
            </th>
            <th className="px-3 py-3 cursor-pointer" onClick={() => onSort('visitor_name')}>
              {t('table.name', 'Visitor Name / Identity')} {renderSortIcon('visitor_name')}
            </th>
            <th className="px-3 py-3 cursor-pointer" onClick={() => onSort('visitor_category')}>
              {t('table.category', 'Category')} {renderSortIcon('visitor_category')}
            </th>
            <th className="px-3 py-3 cursor-pointer" onClick={() => onSort('host_employee_name')}>
              {t('table.hostDept', 'Host & Dept')} {renderSortIcon('host_employee_name')}
            </th>
            <th className="px-3 py-3">{t('table.purpose', 'Appointment & Purpose')}</th>
            <th className="px-3 py-3 cursor-pointer" onClick={() => onSort('checkin_time')}>
              {t('table.time', 'Check-In / Out')} {renderSortIcon('checkin_time')}
            </th>
            <th className="px-3 py-3 cursor-pointer text-center" onClick={() => onSort('visit_duration_minutes')}>
              {t('table.duration', 'Duration')} {renderSortIcon('visit_duration_minutes')}
            </th>
            <th className="px-3 py-3 cursor-pointer text-center" onClick={() => onSort('visit_status')}>
              {t('table.status', 'Status')} {renderSortIcon('visit_status')}
            </th>
            <th className="px-3 py-3 text-end">{t('table.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {histories.map((h) => {
            const isSelected = selectedHistoryId === h.id;
            return (<tr key={h.id} onClick={() => onViewStandalone(h)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/10 dark:bg-blue-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'}`}>
                {/* Visitor Portrait Photo */}
                <td className="px-3 py-2.5 text-center whitespace-nowrap" style={{ width: '56px' }} title={`Visitor Photo: ${h.visitor_name}\nIdentity Verification: ${h.verification_status || 'Verified'}\nPass Number: ${h.pass_number || 'N/A'}`}>
                  <div className="d-inline-block">
                    {(h.visitor_photo || h.photo_url || h.profile_photo) ? (<img src={resolvePhotoUrl(h.visitor_photo || h.photo_url || h.profile_photo)} alt={h.visitor_name} className="w-10 h-12 rounded-lg object-cover border border-slate-700/80 shadow-md" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && e.target.parentElement.querySelector('.fallback-avatar')?.classList.remove('d-none'); }}/>) : (<div className="w-10 h-12 rounded-lg bg-slate-800 text-slate-300 d-flex align-items-center justify-content-center font-bold text-xs border border-slate-700/80 shadow-md">
                        <User className="h-5 w-5 text-slate-400"/>
                      </div>)}
                  </div>
                </td>

                {/* Visitor ID & Reference No */}
                <td className="px-3 py-2.5 whitespace-nowrap" title={`History Reference Code: ${h.history_code || 'N/A'}\nReference Number: ${h.reference_number || 'N/A'}\nVisitor Pass No: ${h.pass_number || 'N/A'}\nDatabase Record ID: #${h.id}`}>
                  <div>
                    <span className="font-monospace text-[10px] px-2 py-0.5 rounded font-bold d-inline-block mb-1" style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--vms-table-accent-text)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    letterSpacing: '0.5px'
                }}>
                      {h.history_code || `VIS-${h.id}`}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {h.reference_number || `REF-${h.visitor_id}`}
                    </div>
                  </div>
                </td>

                {/* Visitor Name & Identity Number */}
                <td className="px-3 py-2.5 whitespace-nowrap" title={`Full Visitor Name: ${h.visitor_name}\nCompany / Organization: ${h.visitor_company || 'Independent Visitor'}\nIdentity Document: ${h.identity_type || 'ID Card'} - ${h.identity_number || 'N/A'}\nContact Email: ${h.visitor_email || 'N/A'}\nContact Phone: ${h.visitor_phone || 'N/A'}`}>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white d-block text-xs">{h.visitor_name}</span>
                    <div className="text-[10px] text-slate-400 font-semibold">{h.visitor_company || 'Independent Visitor'}</div>
                    {h.identity_number && (<div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {h.identity_number} {h.identity_type ? `(${h.identity_type})` : ''}
                      </div>)}
                  </div>
                </td>

                {/* Category */}
                <td className="px-3 py-2.5 whitespace-nowrap" title={`Category: ${h.visitor_category || 'General Visitor'}\nVerification Status: ${h.verification_status || 'Verified'}`}>
                  <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-700/50">
                    {h.visitor_category || 'General Visitor'}
                  </span>
                </td>

                {/* Host & Department */}
                <td className="px-3 py-2.5 whitespace-nowrap" title={`Host Employee: ${h.host_employee_name || 'Security Officer'}\nDepartment: ${h.department_name || 'Security & Operations'}\nMeeting Location: ${h.meeting_location || 'Main Office Building'}`}>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {h.host_employee_name || 'Security Officer'}
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {h.department_name || 'Security & Operations'}
                  </div>
                </td>

                {/* Appointment & Purpose */}
                <td className="px-3 py-2.5" style={{ maxWidth: 220 }} title={`Appointment No: ${h.appointment_number || 'N/A'}\nVisit Purpose: ${h.visit_purpose || 'General Business Meeting'}\nMeeting Location: ${h.meeting_location || 'Main Office'}`}>
                  <div className="font-mono text-[10px] text-slate-400 font-bold">
                    {h.appointment_number || `APT-${h.appointment_id || '000'}`}
                  </div>
                  <span className="d-block text-truncate text-slate-400 font-medium mt-0.5">
                    {h.visit_purpose || 'Security Clearance & Onsite Audit'}
                  </span>
                </td>

                {/* Check-In / Out Times */}
                <td className="px-3 py-2.5 whitespace-nowrap" title={`Check-In Time: ${formatDate(h.checkin_time)}\nCheck-Out Time: ${formatDate(h.checkout_time)}\nCompleted Date: ${formatDate(h.completed_date)}`}>
                  <div className="d-flex align-items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                    <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400"/>
                    In: {formatTime(h.checkin_time)}
                  </div>
                  <div className="d-flex align-items-center gap-1 text-slate-400 font-mono text-[10px] mt-0.5">
                    Out: {formatTime(h.checkout_time)}
                  </div>
                </td>

                {/* Duration */}
                <td className="px-3 py-2.5 text-center whitespace-nowrap" title={`Visit Duration: ${h.visit_duration_minutes || 30} minutes (${((h.visit_duration_minutes || 30) / 60).toFixed(1)} hrs)\nCheck-In: ${formatDate(h.checkin_time)}\nCheck-Out: ${formatDate(h.checkout_time)}`}>
                  <span className="badge bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold px-2 py-1 text-[10px] rounded-pill">
                    {h.visit_duration_minutes ? `${h.visit_duration_minutes} min` : '30 min'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5 text-center whitespace-nowrap" title={`Status: ${h.visit_status || 'Completed'}\nCompleted Timestamp: ${formatDate(h.completed_date)}\nIdentity Verified: ${h.verification_status || 'Verified'}`}>
                  <span className={`badge ${getStatusBadge(h.visit_status)} text-[9px] px-2.5 py-1 rounded-pill font-bold uppercase tracking-wider`}>
                    {h.visit_status || 'Completed'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-2.5 text-end whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="d-flex justify-content-end gap-1">
                    <button onClick={() => onViewStandalone(h)} className="btn btn-sm btn-outline-secondary p-1.5" title="View Full Details Page">
                      <Eye className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => onEdit(h)} className="btn btn-sm btn-outline-secondary p-1.5" title="Edit History Metadata">
                      <Edit className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => { setSearchParams({ view: 'visitor_profiles', search: h.visitor_name }); }} className="btn btn-sm btn-outline-secondary p-1.5" title="View Visitor Master Profile">
                      <User className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => onPrintRow(h)} className="btn btn-sm btn-outline-secondary p-1.5" title="Print Visit Summary">
                      <Printer className="h-3.5 w-3.5"/>
                    </button>
                    <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    onDelete(h);
                }} className="btn btn-sm btn-outline-danger p-1.5" title="Soft Delete History">
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
