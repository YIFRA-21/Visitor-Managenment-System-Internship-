/**
 * VisitorProfileDTO
 * Standardizes Data Transfer Objects for Module 4.3 – Visitor Profile Management
 */

class VisitorProfileDTO {
  static toProfileDetailResponse(visitor, extraData = {}) {
    if (!visitor) return null;

    return {
      id: visitor.id,
      visitor_code: visitor.visitor_code || `VIS-${String(visitor.id).padStart(6, '0')}`,
      reference_number: visitor.reference_number || `REF-${String(visitor.id).padStart(8, '0')}`,
      
      // Personal Info
      first_name: visitor.first_name || '',
      middle_name: visitor.middle_name || '',
      last_name: visitor.last_name || '',
      full_name: visitor.full_name || [visitor.first_name, visitor.middle_name, visitor.last_name].filter(Boolean).join(' '),
      gender: visitor.gender || 'UNSPECIFIED',
      date_of_birth: visitor.date_of_birth ? new Date(visitor.date_of_birth).toISOString().split('T')[0] : null,
      nationality: visitor.nationality || 'Ethiopian',
      occupation: visitor.occupation || '',
      organization: visitor.company || visitor.organization_name || 'N/A',
      company: visitor.company || 'N/A',
      department: visitor.department_name || 'General',
      registration_date: visitor.created_at,

      // Visitor Category
      category: visitor.category || 'General Visitor',
      access_level: visitor.access_level || 'STANDARD',
      approval_requirement: visitor.approval_requirement || 'REQUIRED',
      visit_duration: visitor.visit_duration || '8 Hours',

      // Contact Information
      phone: visitor.phone || '',
      alt_phone: visitor.alt_phone || '',
      email: visitor.email || '',
      preferred_contact_method: visitor.preferred_contact_method || 'Mobile',

      // Address Information
      country: visitor.country || 'Ethiopia',
      region: visitor.region || '',
      city: visitor.city || '',
      woreda: visitor.woreda || '',
      street: visitor.street || visitor.address_line1 || '',
      house_number: visitor.house_number || '',
      full_address: visitor.full_address || [visitor.house_number, visitor.street, visitor.woreda, visitor.city, visitor.region, visitor.country].filter(Boolean).join(', '),

      // Identity Verification
      id_type: visitor.id_type || 'National ID',
      id_number: visitor.id_number || 'N/A',
      id_issue_date: visitor.id_issue_date || null,
      id_expiry_date: visitor.id_expiry_date || null,
      id_verification_status: visitor.id_verification_status || 'UNVERIFIED',

      // Photo Management
      photo_url: visitor.photo_url || null,
      
      // Status & Badging
      status: visitor.status || 'ACTIVE',
      is_blacklisted: Boolean(visitor.is_blacklisted),
      is_archived: Boolean(visitor.is_archived),
      registration_status: visitor.registration_status || 'APPROVED',
      
      // Vehicle Info
      vehicle_plate_number: visitor.vehicle_plate_number || '',
      vehicle_type: visitor.vehicle_type || '',
      vehicle_brand: visitor.vehicle_brand || '',
      vehicle_model: visitor.vehicle_model || '',
      vehicle_color: visitor.vehicle_color || '',
      parking_required: Boolean(visitor.parking_required),

      // Metadata & Relations
      last_visit_date: extraData.visitStatistics?.last_visit_date || visitor.updated_at || visitor.created_at,
      total_visits: extraData.visitStatistics?.total_visits || 0,
      photos: extraData.photos || [],
      notes: extraData.notes || [],
      status_history: extraData.statusHistory || [],
      profile_history: extraData.profileHistory || [],
      audit_history: extraData.auditHistory || [],
      documents: extraData.documents || [],
      addresses: extraData.addresses || [],
    };
  }

  static toNoteDTO(note) {
    return {
      id: note.id,
      visitor_id: note.visitor_id,
      note_type: note.note_type || 'INTERNAL',
      content: note.content || note.note || '',
      created_by: note.created_by,
      created_by_name: note.created_by_name || 'System User',
      created_at: note.created_at,
      updated_at: note.updated_at,
    };
  }

  static toPhotoDTO(photo) {
    return {
      id: photo.id,
      visitor_id: photo.visitor_id,
      photo_path: photo.photo_path,
      upload_date: photo.upload_date || photo.created_at,
      is_active_photo: Boolean(photo.is_active_photo),
      rotation: photo.rotation || 0,
      zoom: photo.zoom || 1.0,
      captured_by: photo.captured_by,
    };
  }
}

module.exports = VisitorProfileDTO;
