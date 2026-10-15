import { GitBranch, Mail, Phone, MapPin, Eye, Edit, ShieldAlert } from 'lucide-react';
import BranchStatusBadge from './BranchStatusBadge';
export default function BranchCard({ branch, onView, onEdit, onStatus }) {
    return (<div className="org-profile-card">
      <div className="org-profile-card__header">
        <div className="org-profile-card__logo bg-blue-50 dark:bg-blue-900/20 text-blue-600">
          <GitBranch className="h-5 w-5"/>
        </div>
        <div className="org-profile-card__info">
          <h4 className="org-profile-card__name">{branch.branchName}</h4>
          <div className="d-flex align-items-center gap-2">
            <span className="org-profile-card__code">{branch.branchCode}</span>
            <BranchStatusBadge status={branch.status} size="sm"/>
          </div>
        </div>
      </div>

      <div className="org-profile-card__body text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-2">
        <p className="mb-0">
          <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Organization</span>
          <span>{branch.organizationName}</span>
        </p>
        <p className="mb-0">
          <span className="text-slate-400 font-bold uppercase text-[9px] d-block">Branch Type</span>
          <span>{branch.branchType || 'OFFICE'}</span>
        </p>
        {branch.email && (<div className="org-profile-card__detail">
            <Mail className="h-3.5 w-3.5 text-slate-400"/>
            <span>{branch.email}</span>
          </div>)}
        {branch.phone && (<div className="org-profile-card__detail">
            <Phone className="h-3.5 w-3.5 text-slate-400"/>
            <span>{branch.phone}</span>
          </div>)}
        {(branch.city || branch.country) && (<div className="org-profile-card__detail">
            <MapPin className="h-3.5 w-3.5 text-slate-400"/>
            <span>{[branch.city, branch.country].filter(Boolean).join(', ')}</span>
          </div>)}
      </div>

      <div className="org-profile-card__actions">
        {onView && (<button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 text-xs fw-bold px-2 py-1" onClick={() => onView(branch.id)}>
            <Eye className="h-3.5 w-3.5"/> View
          </button>)}
        {onEdit && (<button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 text-xs fw-bold px-2 py-1" onClick={() => onEdit(branch.id)}>
            <Edit className="h-3.5 w-3.5"/> Edit
          </button>)}
        {onStatus && (<button className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 text-xs fw-bold px-2 py-1" onClick={() => onStatus(branch.id)}>
            <ShieldAlert className="h-3.5 w-3.5"/> Status
          </button>)}
      </div>
    </div>);
}
