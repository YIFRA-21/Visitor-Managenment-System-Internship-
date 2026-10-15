import { Building, Mail, Phone, MapPin, Eye, Edit } from 'lucide-react';
import OrganizationStatusBadge from './OrganizationStatusBadge';
export default function OrganizationCard({ org, onView, onEdit }) {
    return (<div className="org-profile-card">
      {/* Card Header */}
      <div className="org-profile-card__header">
        <div className="org-profile-card__logo">
          {org.logo_url ? (<img src={org.logo_url} alt={`${org.name} logo`}/>) : (<Building className="h-6 w-6"/>)}
        </div>
        <div className="org-profile-card__info">
          <h4 className="org-profile-card__name">{org.name}</h4>
          <div className="d-flex align-items-center gap-2">
            <span className="org-profile-card__code">{org.code}</span>
            <OrganizationStatusBadge status={org.status || 'ACTIVE'} size="sm"/>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="org-profile-card__body">
        {org.email && (<div className="org-profile-card__detail">
            <Mail className="h-3.5 w-3.5 text-slate-400"/>
            <span>{org.email}</span>
          </div>)}
        {org.phone && (<div className="org-profile-card__detail">
            <Phone className="h-3.5 w-3.5 text-slate-400"/>
            <span>{org.phone}</span>
          </div>)}
        {(org.city || org.country) && (<div className="org-profile-card__detail">
            <MapPin className="h-3.5 w-3.5 text-slate-400"/>
            <span>{[org.city, org.country].filter(Boolean).join(', ')}</span>
          </div>)}
        {org.registration_number && (<div className="org-profile-card__detail">
            <span className="text-slate-400 text-[10px] fw-bold">REG#</span>
            <span>{org.registration_number}</span>
          </div>)}
      </div>

      {/* Card Actions */}
      <div className="org-profile-card__actions">
        {onView && (<button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 text-xs fw-bold" onClick={() => onView(org.id)}>
            <Eye className="h-3.5 w-3.5"/> View
          </button>)}
        {onEdit && (<button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 text-xs fw-bold" onClick={() => onEdit(org.id)}>
            <Edit className="h-3.5 w-3.5"/> Edit
          </button>)}
      </div>
    </div>);
}
