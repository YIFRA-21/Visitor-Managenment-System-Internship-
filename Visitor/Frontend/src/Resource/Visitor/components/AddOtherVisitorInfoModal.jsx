import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Phone, Shield, FileText, Upload, Check, AlertCircle, Save } from 'lucide-react';
import { visitorPortalApi, authApi } from '../../../services/api';
import { resolvePhotoUrl } from '../../../utils/photoUtils';
import { useLanguage } from '../../../contexts/LanguageContext';
import CountryPhoneInput from '../../../components/common/CountryPhoneInput';

export default function AddOtherVisitorInfoModal({ isOpen, onClose, onSuccess, initialData = {} }) {
    const { t } = useLanguage();
    const [activeSection, setActiveSection] = useState('address');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    // Form State
    const [streetAddress, setStreetAddress] = useState(initialData.streetAddress || initialData.address || '');
    const [city, setCity] = useState(initialData.city || 'Addis Ababa');
    const [subcity, setSubcity] = useState(initialData.subcity || '');
    const [stateProvince, setStateProvince] = useState(initialData.stateProvince || '');
    const [country, setCountry] = useState(initialData.country || 'Ethiopia');
    const [postalCode, setPostalCode] = useState(initialData.postalCode || '');
    // Emergency Info
    const [emergencyName, setEmergencyName] = useState(initialData.emergencyName || initialData.emergency_contact_name || '');
    const [emergencyRelation, setEmergencyRelation] = useState(initialData.emergencyRelation || 'Spouse');
    const [emergencyPhone, setEmergencyPhone] = useState(initialData.emergencyPhone || initialData.emergency_phone || '');
    const [secondaryEmergencyPhone, setSecondaryEmergencyPhone] = useState(initialData.secondaryEmergencyPhone || '');
    // Contact Info
    const [workEmail, setWorkEmail] = useState(initialData.workEmail || '');
    const [altPhone, setAltPhone] = useState(initialData.altPhone || '');
    const [preferredContact, setPreferredContact] = useState(initialData.preferredContact || 'Email');
    // Identity & Photo
    const [identityType, setIdentityType] = useState(initialData.identityType || 'National ID');
    const [identityNumber, setIdentityNumber] = useState(initialData.identityNumber || '');
    const getExistingPhoto = () => {
        return (initialData.photoUrl ||
            initialData.photo_url ||
            sessionStorage.getItem('visitor_uploaded_photo') ||
            localStorage.getItem('visitor_uploaded_photo') ||
            (() => {
                try {
                    const raw = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile');
                    if (raw) {
                        const p = JSON.parse(raw);
                        return p.photoUrl || p.photo_url || p.avatarUrl || p.photo || null;
                    }
                }
                catch { }
                return null;
            })() ||
            null);
    };
    const [photoPreview, setPhotoPreview] = useState(getExistingPhoto());
    useEffect(() => {
        if (isOpen) {
            const ph = getExistingPhoto();
            if (ph)
                setPhotoPreview(ph);
        }
    }, [isOpen]);
    if (!isOpen)
        return null;
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('avatar', file);
                const res = await authApi.uploadAvatar(formData);
                const serverUrl = res.data?.avatarUrl;
                if (serverUrl) {
                    setPhotoPreview(serverUrl);
                    sessionStorage.setItem('visitor_uploaded_photo', serverUrl);
                    localStorage.setItem('visitor_uploaded_photo', serverUrl);
                    return;
                }
            } catch (err) {}

            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                setPhotoPreview(dataUrl);
                sessionStorage.setItem('visitor_uploaded_photo', dataUrl);
                localStorage.setItem('visitor_uploaded_photo', dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');
        const payload = {
            address: `${streetAddress}${subcity ? ', ' + subcity : ''}, ${city}, ${country}`,
            street_address: streetAddress,
            city,
            subcity,
            state_province: stateProvince,
            country,
            postal_code: postalCode,
            emergency_contact_name: emergencyName,
            emergency_relationship: emergencyRelation,
            emergency_phone: emergencyPhone,
            secondary_emergency_phone: secondaryEmergencyPhone,
            work_email: workEmail,
            alternative_phone: altPhone,
            preferred_contact_method: preferredContact,
            identity_type: identityType,
            identity_number: identityNumber,
            id_type: identityType,
            id_number: identityNumber,
            photo_url: photoPreview,
            photoUrl: photoPreview,
            profile_photo: photoPreview
        };
        try {
            await visitorPortalApi.updateProfile(payload);
        }
        catch (err) {
            console.warn('API update fallback to local storage:', err);
        }
        // Save to local session cache and user storage
        try {
            const existing = JSON.parse(sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile') || '{}');
            const uRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
            const uObj = uRaw ? JSON.parse(uRaw) : {};
            const userEmail = (uObj.email || existing.email || '').toLowerCase().trim();
            const updated = {
                ...existing,
                ...payload,
                email: userEmail,
                photo_url: photoPreview,
                photoUrl: photoPreview,
                avatarUrl: photoPreview,
                updatedAt: new Date().toISOString()
            };
            sessionStorage.setItem('active_visitor_profile', JSON.stringify(updated));
            localStorage.setItem('active_visitor_profile', JSON.stringify(updated));
            // Also sync registered_visitor_data
            const regRaw = sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
            if (regRaw) {
                try {
                    const regObj = JSON.parse(regRaw);
                    regObj.photoUrl = photoPreview;
                    regObj.photo_url = photoPreview;
                    sessionStorage.setItem('registered_visitor_data', JSON.stringify(regObj));
                    localStorage.setItem('registered_visitor_data', JSON.stringify(regObj));
                }
                catch (e) { }
            }
            if (photoPreview) {
                sessionStorage.setItem('visitor_uploaded_photo', photoPreview);
                localStorage.setItem('visitor_uploaded_photo', photoPreview);
                if (uObj.id) {
                    sessionStorage.setItem(`user_photo_${uObj.id}`, photoPreview);
                    localStorage.setItem(`user_photo_${uObj.id}`, photoPreview);
                }
                if (uObj.user_id) {
                    sessionStorage.setItem(`user_photo_${uObj.user_id}`, photoPreview);
                    localStorage.setItem(`user_photo_${uObj.user_id}`, photoPreview);
                }
                uObj.avatarUrl = photoPreview;
                uObj.profile_photo = photoPreview;
                localStorage.setItem('user', JSON.stringify(uObj));
                sessionStorage.setItem('user', JSON.stringify(uObj));
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new CustomEvent('user_updated', { detail: { avatarUrl: photoPreview } }));
            }
            // Append to visitor audit history
            const historyList = JSON.parse(localStorage.getItem('vms_history_appointments') || '[]');
            historyList.unshift({
                id: `HIST-${Date.now().toString().slice(-6)}`,
                historyCode: `UPD-${Date.now().toString().slice(-5)}`,
                referenceNumber: existing.referenceNumber || 'REF-REG-2026',
                visitorName: existing.fullName || existing.full_name || uObj.fullName || 'Visitor',
                company: existing.company || 'IT Park',
                identityNumber: identityNumber || existing.identityNumber || 'N/A',
                identityType: identityType,
                category: 'Visitor Profile Update',
                hostName: 'System Audit',
                department: 'Visitor Administration',
                appointmentNumber: 'SYS-PROFILE-UPDATE',
                purpose: 'Extended Profile Info Updated (Address, Emergency & Contact Details)',
                checkInTime: new Date().toLocaleString(),
                checkOutTime: '-',
                duration: 0,
                status: 'Pending',
                email: userEmail,
                phone: existing.phone || uObj.phone
            });
            localStorage.setItem('vms_history_appointments', JSON.stringify(historyList));
            setSuccessMsg('Visitor extended profile details saved successfully!');
            setTimeout(() => {
                onSuccess(updated);
                onClose();
            }, 700);
        }
        catch (e) {
            setErrorMsg('Failed to save visitor information.');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <User className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Add / Update Extended Visitor Info</h3>
              <p className="text-xs text-slate-400 font-semibold">
                Record address, emergency contact, identification, and profile photo details.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5"/>
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto bg-slate-950/40">
          <button type="button" onClick={() => setActiveSection('address')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'address'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <MapPin className="h-3.5 w-3.5"/> {t('visitor.addressInfo', 'Address Info')}
          </button>
          <button type="button" onClick={() => setActiveSection('emergency')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'emergency'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Shield className="h-3.5 w-3.5"/> {t('visitor.emergencyInfo', 'Emergency Info')}
          </button>
          <button type="button" onClick={() => setActiveSection('contact')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'contact'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Phone className="h-3.5 w-3.5"/> {t('visitor.contactDetails', 'Contact Details')}
          </button>
          <button type="button" onClick={() => setActiveSection('identity')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'identity'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <FileText className="h-3.5 w-3.5"/> {t('visitor.idPhoto', 'ID & Photo')}
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (<div className="mx-6 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0"/>
            <span>{successMsg}</span>
          </div>)}
        {errorMsg && (<div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0"/>
            <span>{errorMsg}</span>
          </div>)}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* SECTION 1: ADDRESS INFO */}
          {activeSection === 'address' && (<div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                  {t('form.address', 'Street Address')}
                </label>
                <input type="text" placeholder={t('placeholder.address', 'e.g. Bole Road, House #104')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={streetAddress} onChange={e => setStreetAddress(e.target.value)}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.city', 'City / Town')}
                  </label>
                  <input type="text" placeholder={t('placeholder.city', 'e.g. Addis Ababa')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={city} onChange={e => setCity(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.subcity', 'Subcity / District')}
                  </label>
                  <input type="text" placeholder={t('placeholder.subcity', 'e.g. Kirkos Subcity, Woreda 02')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={subcity} onChange={e => setSubcity(e.target.value)}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.state', 'State / Province')}
                  </label>
                  <input type="text" placeholder={t('placeholder.region', 'State or Region')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={stateProvince} onChange={e => setStateProvince(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.country', 'Country')}
                  </label>
                  <input type="text" placeholder={t('placeholder.country', 'Country')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={country} onChange={e => setCountry(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.postalCode', 'Postal Code')}
                  </label>
                  <input type="text" placeholder={t('placeholder.postalCode', 'Postal Code')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={postalCode} onChange={e => setPostalCode(e.target.value)}/>
                </div>
              </div>
            </div>)}

          {/* SECTION 2: EMERGENCY INFO */}
          {activeSection === 'emergency' && (<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.emergencyContactName', 'Emergency Contact Name')}
                  </label>
                  <input type="text" placeholder={t('placeholder.fullName', 'Contact Full Name')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={emergencyName} onChange={e => setEmergencyName(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.relationship', 'Relationship')}
                  </label>
                  <select className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)}>
                    <option value="Spouse">{t('relation.spouse', 'Spouse')}</option>
                    <option value="Parent">{t('relation.parent', 'Parent')}</option>
                    <option value="Sibling">{t('relation.sibling', 'Sibling')}</option>
                    <option value="Child">{t('relation.child', 'Child')}</option>
                    <option value="Colleague">{t('relation.colleague', 'Colleague')}</option>
                    <option value="Friend">{t('relation.friend', 'Friend')}</option>
                    <option value="Other">{t('relation.other', 'Other')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CountryPhoneInput
                    id="add-other-emergency-phone"
                    label={t('form.emergencyContactPhone', 'Emergency Phone Number')}
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                  />
                </div>
                <div>
                  <CountryPhoneInput
                    id="add-other-sec-emergency-phone"
                    label={t('form.altPhone', 'Secondary Emergency Phone')}
                    value={secondaryEmergencyPhone}
                    onChange={e => setSecondaryEmergencyPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                  />
                </div>
              </div>
            </div>)}

          {/* SECTION 3: CONTACT DETAILS */}
          {activeSection === 'contact' && (<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.email', 'Work Email Address')}
                  </label>
                  <input type="email" placeholder={t('placeholder.email', 'work.email@company.com')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={workEmail} onChange={e => setWorkEmail(e.target.value)}/>
                </div>
                <div>
                  <CountryPhoneInput
                    id="add-other-alt-phone"
                    label={t('form.altPhone', 'Alternative Phone Number')}
                    value={altPhone}
                    onChange={e => setAltPhone(e.target.value)}
                    placeholder="+251 9... or Phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                  {t('form.preferredContact', 'Preferred Contact Method')}
                </label>
                <select className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={preferredContact} onChange={e => setPreferredContact(e.target.value)}>
                  <option value="Email">{t('contact.email', 'Email')}</option>
                  <option value="SMS">{t('contact.sms', 'SMS Notification')}</option>
                  <option value="Phone Call">{t('contact.phone', 'Direct Phone Call')}</option>
                </select>
              </div>
            </div>)}

          {/* SECTION 4: IDENTITY & PHOTO */}
          {activeSection === 'identity' && (<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.documentType', 'Identity Document Type')}
                  </label>
                  <select className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={identityType} onChange={e => setIdentityType(e.target.value)}>
                    <option value="National ID">{t('idType.nationalId', 'National ID Card')}</option>
                    <option value="Passport">{t('idType.passport', 'Passport')}</option>
                    <option value="Driver License">{t('idType.drivingLicense', "Driver's License")}</option>
                    <option value="Work Permit">{t('idType.workPermit', 'Work Permit / Employee ID')}</option>
                    <option value="Other">{t('idType.other', 'Other Official Document')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                    {t('form.documentNumber', 'Identity Document Number')}
                  </label>
                  <input type="text" placeholder={t('placeholder.idNumber', 'ID / Passport Number')} className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500" value={identityNumber} onChange={e => setIdentityNumber(e.target.value)}/>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="border border-dashed border-slate-800 bg-slate-900/50 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {photoPreview ? (<img src={resolvePhotoUrl(photoPreview)} alt="Visitor Photo" className="w-full h-full object-cover"/>) : (<User className="h-8 w-8 text-slate-500"/>)}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h4 className="text-xs font-extrabold text-white">{t('form.photo', 'Upload Visitor Profile Photo')}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    PNG, JPG or WEBP up to 5MB. Will be displayed on digital entrance passes.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl text-xs font-extrabold cursor-pointer border border-blue-500/30 transition-all">
                    <Upload className="h-3.5 w-3.5"/> {t('btn.upload', 'Select Photo File')}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                  </label>
                </div>
              </div>
            </div>)}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
              {t('btn.cancel', 'Cancel')}
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer">
              {saving ? <span className="animate-spin">⏳</span> : <Save className="h-4 w-4"/>}
              {t('btn.save', 'Save Visitor Profile Info')}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
