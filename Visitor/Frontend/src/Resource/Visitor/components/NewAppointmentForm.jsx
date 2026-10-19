import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, MapPin, User, Building, Send, Check, FileText, ArrowLeft, UploadCloud, FolderUp, FileCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { appointmentsApi, organizationsApi, departmentsApi, employeesApi, roomsApi, visitorPortalApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useEnterpriseForm } from '../../../hooks/useEnterpriseForm';
import { ValidationRules } from '../../../services/validationService';
export default function NewAppointmentForm({ onSubmit, onCancel }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [success, setSuccess] = useState(false);
    // File Upload State
    const [attachedFile, setAttachedFile] = useState(null);
    const [attachedFileName, setAttachedFileName] = useState('');
    // ── Dynamic Database State (Real API Data) ──
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [loadingEmps, setLoadingEmps] = useState(false);
    // ── Form Hook ──
    const { values, errors, handleChange, handleBlur, handleSubmit, setBackendErrors, isSubmitting, } = useEnterpriseForm({
        initialValues: {
            organization: '',
            orgId: '',
            branch: '',
            branchId: '',
            department: '',
            departmentId: '',
            hostName: '',
            hostId: '',
            location: '',
            meetingRoom: '',
            purpose: '',
            visitDate: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '11:30',
            notes: ''
        },
        validationSchema: {
            organization: (val) => ValidationRules.required(val, 'Organization'),
            branch: (val) => ValidationRules.required(val, 'Branch'),
            department: (val) => ValidationRules.required(val, 'Department'),
            hostName: (val) => ValidationRules.required(val, 'Host Employee'),
            purpose: (val) => ValidationRules.required(val, 'Visit Purpose'),
            visitDate: (val) => ValidationRules.required(val, 'Visit Date') || ValidationRules.date(val),
            startTime: (val) => ValidationRules.required(val, 'Start Time'),
            endTime: (val) => ValidationRules.required(val, 'End Time'),
            location: (val) => ValidationRules.required(val, 'Building / Location'),
            meetingRoom: (val) => ValidationRules.required(val, 'Room / Office'),
        },
        onSubmit: async (formData) => {
            const formatTimeStr = (time24) => {
                const parts = (time24 || '09:00').split(':');
                let h = parseInt(parts[0], 10);
                const m = parts[1] || '00';
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
            };
            const startFormatted = formatTimeStr(formData.startTime);
            const endFormatted = formatTimeStr(formData.endTime);
            const timeDisplay = `${startFormatted} - ${endFormatted}`;
            let uploadedDocUrl = null;
            let uploadedDocName = attachedFileName || null;
            if (attachedFile) {
                try {
                    const uploadRes = await visitorPortalApi.uploadDocument(attachedFile, 'Invitation / Appointment Attachment', 'DOC-' + Date.now().toString().slice(-6));
                    const uploadData = uploadRes?.data;
                    uploadedDocUrl = uploadData?.file_url || uploadData?.fileUrl || uploadData?.url || null;
                    if (!uploadedDocName && uploadData?.file_name) {
                        uploadedDocName = uploadData.file_name;
                    }
                }
                catch (uploadErr) {
                    console.warn('[NewAppointmentForm] Document upload warning:', uploadErr);
                }
            }
            const newAppointment = {
                id: `APT-${Date.now().toString().slice(-6)}`,
                referenceCode: `APT-${Date.now().toString().slice(-6)}`,
                organization: formData.organization,
                branch: formData.branch,
                title: formData.purpose,
                purpose: formData.purpose,
                host: formData.hostName,
                hostName: formData.hostName,
                department: formData.department,
                location: formData.location,
                meetingRoom: formData.meetingRoom,
                date: formData.visitDate,
                time: timeDisplay,
                scheduled_start: `${formData.visitDate}T${formData.startTime}:00`,
                scheduled_end: `${formData.visitDate}T${formData.endTime}:00`,
                durationText: calculatedDuration.text,
                durationMinutes: calculatedDuration.totalMinutes,
                status: 'PENDING',
                type: 'pending',
                notes: formData.notes,
                attachedFileName: uploadedDocName || attachedFileName || null,
                attachment_url: uploadedDocUrl,
                attachment_name: uploadedDocName,
                visitorName: user?.fullName || user?.full_name || 'Visitor',
                visitorEmail: user?.email || '',
                visitor_email: user?.email || '',
                created_at: new Date().toISOString()
            };
            try {
                await appointmentsApi.create({
                    visitorId: user?.visitorId || user?.id || undefined,
                    visitorName: user?.fullName || user?.full_name || user?.username || 'Visitor',
                    visitorEmail: user?.email || '',
                    visitorPhone: user?.phone || user?.phoneNumber || '',
                    organization_name: formData.organization,
                    branch_name: formData.branch,
                    hostId: formData.hostId ? Number(formData.hostId) : undefined,
                    host_name: formData.hostName,
                    department_name: formData.department,
                    purpose: formData.purpose,
                    scheduled_start: `${formData.visitDate} ${formData.startTime}:00`,
                    scheduled_end: `${formData.visitDate} ${formData.endTime}:00`,
                    expected_duration_minutes: calculatedDuration.totalMinutes || 60,
                    durationMinutes: calculatedDuration.totalMinutes || 60,
                    location: formData.location,
                    room_name: formData.meetingRoom,
                    notes: formData.notes,
                    attachment_url: uploadedDocUrl,
                    attachment_name: uploadedDocName,
                    document_url: uploadedDocUrl
                });
            }
            catch (err) {
                console.warn('API submission error:', err);
                setBackendErrors(err);
            }
            try {
                const existingAppts = JSON.parse(localStorage.getItem('vms_visitor_appointments') || '[]');
                existingAppts.unshift(newAppointment);
                localStorage.setItem('vms_visitor_appointments', JSON.stringify(existingAppts));
                const existingHistory = JSON.parse(localStorage.getItem('vms_history_appointments') || '[]');
                existingHistory.unshift({
                    ...newAppointment,
                    check_in_time: startFormatted,
                    check_out_time: endFormatted,
                    duration: calculatedDuration.totalMinutes,
                    status: 'PENDING'
                });
                localStorage.setItem('vms_history_appointments', JSON.stringify(existingHistory));
            }
            catch (e) {
                console.error('Local storage update error:', e);
            }
            window.dispatchEvent(new CustomEvent('appointment_status_changed', { detail: newAppointment }));
            window.dispatchEvent(new CustomEvent('appointment_updated', { detail: newAppointment }));
            setSuccess(true);
            setTimeout(() => {
                onSubmit(newAppointment);
            }, 600);
        }
    });
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1: On mount → Fetch ALL Organizations from DB, filter ACTIVE only
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        let cancelled = false;
        async function loadOrgs() {
            setLoadingOrgs(true);
            try {
                const res = await organizationsApi.list();
                const orgList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                if (!cancelled) {
                    // STRICT: Keep ONLY organizations where status === 'ACTIVE'
                    const activeOrgs = orgList.filter((o) => (o.status || '').toUpperCase() === 'ACTIVE');
                    setAllOrganizations(activeOrgs);
                    // Auto-select if only one active org
                    if (activeOrgs.length === 1) {
                        const org = activeOrgs[0];
                        handleChange('organization', org.name || org.organization_name);
                        handleChange('orgId', String(org.id));
                    }
                }
            }
            catch (err) {
                console.warn('Failed to fetch organizations:', err);
            }
            finally {
                if (!cancelled)
                    setLoadingOrgs(false);
            }
        }
        loadOrgs();
        return () => { cancelled = true; };
    }, []);
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 2: When Organization changes → Fetch its ACTIVE Branches from DB
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!values.orgId) {
            setAllBranches([]);
            return;
        }
        let cancelled = false;
        async function loadBranches() {
            setLoadingBranches(true);
            try {
                // Try public endpoint first, then authenticated
                let branchList = [];
                try {
                    const res = await organizationsApi.publicBranches(values.orgId);
                    branchList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                }
                catch {
                    const res = await organizationsApi.branches(values.orgId);
                    branchList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                }
                if (!cancelled) {
                    // STRICT: Keep ONLY branches where status === 'ACTIVE'
                    const activeBranches = branchList.filter((b) => (b.status || '').toUpperCase() === 'ACTIVE');
                    setAllBranches(activeBranches);
                }
            }
            catch (err) {
                console.warn('Failed to fetch branches:', err);
                if (!cancelled)
                    setAllBranches([]);
            }
            finally {
                if (!cancelled)
                    setLoadingBranches(false);
            }
        }
        loadBranches();
        return () => { cancelled = true; };
    }, [values.orgId]);
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 3: When Branch changes → Fetch ACTIVE Departments from DB
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!values.branch) {
            setAllDepartments([]);
            return;
        }
        let cancelled = false;
        async function loadDepts() {
            setLoadingDepts(true);
            try {
                const res = await departmentsApi.publicList();
                const deptList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                if (!cancelled) {
                    // STRICT: Keep ONLY departments where status === 'ACTIVE'
                    // AND that belong to the selected branch (by branch_name match)
                    const selectedBranch = (values.branch || '').toLowerCase();
                    const activeDepts = deptList.filter((d) => {
                        const isActive = (d.status || '').toUpperCase() === 'ACTIVE';
                        const deptBranch = (d.branch_name || d.branchName || '').toLowerCase();
                        // If department has branch info, match it; otherwise include it
                        const branchMatch = !deptBranch || deptBranch.includes(selectedBranch) || selectedBranch.includes(deptBranch);
                        return isActive && branchMatch;
                    });
                    setAllDepartments(activeDepts);
                }
            }
            catch (err) {
                console.warn('Failed to fetch departments:', err);
                if (!cancelled)
                    setAllDepartments([]);
            }
            finally {
                if (!cancelled)
                    setLoadingDepts(false);
            }
        }
        loadDepts();
        return () => { cancelled = true; };
    }, [values.branch]);
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 4: When Department changes → Fetch ACTIVE + Host Enabled Employees from DB
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!values.department) {
            setAllEmployees([]);
            return;
        }
        let cancelled = false;
        async function loadEmployees() {
            setLoadingEmps(true);
            try {
                // Try department-specific endpoint first
                let empList = [];
                if (values.departmentId) {
                    try {
                        const res = await departmentsApi.employees(Number(values.departmentId));
                        empList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    }
                    catch {
                        // fall through to public list
                    }
                }
                // Fallback to public employee list
                if (empList.length === 0) {
                    const res = await employeesApi.publicList();
                    empList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                }
                if (!cancelled) {
                    const selectedDept = (values.department || '').toLowerCase();
                    // STRICT: Keep ONLY employees where:
                    //   1. employment_status === 'Active'
                    //   2. is_host_enabled === true OR host_status contains 'Enable'
                    //   3. Department matches the selected department
                    //   4. Role is 'employee' or 'staff' (excludes admin, manager, receptionist, security, visitor)
                    const activeHosts = empList.filter((e) => {
                        const empStatus = (e.employment_status || e.status || '').toUpperCase();
                        const isActive = empStatus === 'ACTIVE';
                        const hostEnabled = e.is_host_enabled === true || e.is_host_enabled === 1 ||
                            (e.host_status || '').toUpperCase().includes('ENABLE');
                        const empDept = (e.department_name || e.department || '').toLowerCase();
                        const deptMatch = !empDept || empDept.includes(selectedDept) || selectedDept.includes(empDept);
                        // Role-based filter: Only show users with 'employee' or 'staff' role
                        const userRole = (e.user_role || e.role || '').toLowerCase();
                        const isEmployeeRole = !userRole || userRole === 'employee' || userRole === 'staff';
                        return isActive && hostEnabled && deptMatch && isEmployeeRole;
                    });
                    setAllEmployees(activeHosts);
                }
            }
            catch (err) {
                console.warn('Failed to fetch employees:', err);
                if (!cancelled)
                    setAllEmployees([]);
            }
            finally {
                if (!cancelled)
                    setLoadingEmps(false);
            }
        }
        loadEmployees();
        return () => { cancelled = true; };
    }, [values.department, values.departmentId]);
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 5: On mount → Fetch Rooms from DB
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        let cancelled = false;
        async function loadRooms() {
            try {
                const res = await roomsApi.list();
                const roomList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                if (!cancelled)
                    setAllRooms(roomList);
            }
            catch (err) {
                console.warn('Failed to fetch rooms:', err);
            }
        }
        loadRooms();
        return () => { cancelled = true; };
    }, []);
    // ── Computed Dropdown Options (derived from real DB data) ──
    const activeOrganizations = useMemo(() => {
        return allOrganizations.length > 0 ? allOrganizations : [];
    }, [allOrganizations]);
    const activeBranches = useMemo(() => {
        return allBranches;
    }, [allBranches]);
    const activeDepartments = useMemo(() => {
        return allDepartments;
    }, [allDepartments]);
    const activeEmployees = useMemo(() => {
        return allEmployees.map((e) => {
            const empName = e.full_name || e.fullName || e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim();
            const jobTitle = e.job_title || e.jobTitle || 'Staff';
            return { id: e.id, name: `${empName} (${jobTitle})` };
        });
    }, [allEmployees]);
    // Buildings filtered by selected branch
    const availableBuildings = useMemo(() => {
        if (!values.branch)
            return [];
        const selectedBranch = (values.branch || '').toLowerCase();
        // Use branch location data if available
        const branchObj = allBranches.find((b) => (b.branchName || b.branch_name || b.name || '') === values.branch);
        if (branchObj) {
            const location = branchObj.city || branchObj.location || branchObj.address || '';
            if (location) {
                return [{ id: 1, name: `${values.branch} - ${location}` }];
            }
        }
        // Check rooms for building info matching branch
        const branchBuildings = allRooms
            .filter((r) => {
            const roomBranch = (r.branch_name || r.branchName || '').toLowerCase();
            return roomBranch.includes(selectedBranch) || selectedBranch.includes(roomBranch);
        })
            .map((r) => r.building_name || r.buildingName || r.building || '')
            .filter(Boolean);
        const uniqueBuildings = [...new Set(branchBuildings)];
        if (uniqueBuildings.length > 0) {
            return uniqueBuildings.map((b, idx) => ({ id: idx + 1, name: b }));
        }
        // Fallback: use branch name as building
        return [{ id: 1, name: `${values.branch} Building` }];
    }, [values.branch, allBranches, allRooms]);
    // Rooms filtered by selected building
    const availableRooms = useMemo(() => {
        if (!values.location)
            return [];
        const selectedBuilding = (values.location || '').toLowerCase();
        const matchingRooms = allRooms.filter((r) => {
            const roomBuilding = (r.building_name || r.buildingName || r.building || '').toLowerCase();
            return roomBuilding.includes(selectedBuilding) || selectedBuilding.includes(roomBuilding);
        });
        if (matchingRooms.length > 0) {
            return matchingRooms.map((r) => ({
                id: r.id,
                name: r.room_name || r.name || `Room ${r.id}`
            }));
        }
        // Fallback
        return [{ id: 1, name: 'Conference Room 101' }, { id: 2, name: 'Meeting Room 201' }];
    }, [values.location, allRooms]);
    // Automatic Live Duration Calculation
    const calculatedDuration = useMemo(() => {
        if (!values.startTime || !values.endTime) {
            return { text: '0 mins', isValid: true, totalMinutes: 0 };
        }
        const [startH, startM] = values.startTime.split(':').map(Number);
        const [endH, endM] = values.endTime.split(':').map(Number);
        const startTotal = (startH || 0) * 60 + (startM || 0);
        const endTotal = (endH || 0) * 60 + (endM || 0);
        const diff = endTotal - startTotal;
        if (diff <= 0)
            return { text: 'End time must be after start time', isValid: false, totalMinutes: 0 };
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        let text = '';
        if (hours > 0 && mins > 0)
            text = `${hours} Hour${hours > 1 ? 's' : ''} ${mins} Minute${mins > 1 ? 's' : ''}`;
        else if (hours > 0)
            text = `${hours} Hour${hours > 1 ? 's' : ''}`;
        else
            text = `${mins} Minutes`;
        return { text, isValid: true, totalMinutes: diff };
    }, [values.startTime, values.endTime]);
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedFile(file);
            setAttachedFileName(file.name);
        }
    };
    // ── Event Handlers for Cascading Resets ──
    const handleOrgChange = useCallback((orgName, orgId) => {
        handleChange('organization', orgName);
        handleChange('orgId', orgId);
        handleChange('branch', '');
        handleChange('branchId', '');
        handleChange('department', '');
        handleChange('departmentId', '');
        handleChange('hostName', '');
        handleChange('hostId', '');
        handleChange('location', '');
        handleChange('meetingRoom', '');
    }, [handleChange]);
    const handleBranchChange = useCallback((branchName, branchId) => {
        handleChange('branch', branchName);
        handleChange('branchId', branchId);
        handleChange('department', '');
        handleChange('departmentId', '');
        handleChange('hostName', '');
        handleChange('hostId', '');
        handleChange('location', '');
        handleChange('meetingRoom', '');
    }, [handleChange]);
    const handleDeptChange = useCallback((deptName, deptId) => {
        handleChange('department', deptName);
        handleChange('departmentId', deptId);
        handleChange('hostName', '');
        handleChange('hostId', '');
    }, [handleChange]);
    return (<div className="w-full max-w-full bg-[#0a0f1d] border border-slate-800 text-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl space-y-6 relative box-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <button onClick={onCancel} type="button" title={t('form.back', 'Back to Appointments')} className="w-11 h-11 flex items-center justify-center text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-2xl border border-slate-700/80 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer">
          <ArrowLeft className="h-5 w-5"/>
        </button>
        <div className="flex-1">
          <span className="text-[11px] uppercase font-black tracking-widest text-blue-400 block mb-1">
            {t('appt.portalTitle', 'Visitor Booking Portal')}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-0">
            {t('appt.requestNew', 'Request a New Appointment')}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1 mb-0">
            {t('appt.portalSubtitle', 'Only active organizations, branches, departments & host-enabled employees are shown.')}
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {success && (<div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn shadow-lg">
          <Check className="h-5 w-5 text-emerald-400 shrink-0"/>
          <span>{t('appt.success', 'Appointment created successfully! Added to your History & Appointments list.')}</span>
        </div>)}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs md:text-sm font-semibold" noValidate>
        
        {/* ROW 1: Organization & Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organization (ACTIVE ONLY from DB) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase font-extrabold text-slate-400">
                {t('appt.organization', 'Organization')} <span className="text-rose-500">*</span>
              </label>
              {activeOrganizations.length === 1 && (<span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg">
                  <ShieldCheck className="h-3 w-3"/> {t('status.active', 'Active')}
                </span>)}
            </div>
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><Building className="h-5 w-5 text-blue-400"/></span>
              {loadingOrgs ? (<div className="w-full px-4 py-3.5 flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Loading organizations...')}
                </div>) : activeOrganizations.length === 1 ? (<input type="text" readOnly className="w-full bg-slate-900 text-white text-xs md:text-sm font-black px-4 py-3.5 outline-none cursor-default" value={values.organization || activeOrganizations[0]?.name || ''}/>) : (<select id="appt-organization" name="organization" className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer" value={values.organization} onChange={(e) => {
                const selected = activeOrganizations.find((o) => (o.name || o.organization_name) === e.target.value);
                handleOrgChange(e.target.value, String(selected?.id || ''));
            }}>
                  <option value="">{t('appt.selectOrgFirst', 'Select Active Organization...')}</option>
                  {activeOrganizations.map((org) => (<option key={org.id} value={org.name || org.organization_name}>
                      {org.name || org.organization_name}
                    </option>))}
                </select>)}
            </div>
            {errors.organization && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.organization}</p>}
          </div>

          {/* Branch (ACTIVE Branches of Selected Active Org) */}
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">
              {t('appt.branch', 'Branch')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><Building className="h-5 w-5 text-indigo-400"/></span>
              {loadingBranches ? (<div className="w-full px-4 py-3.5 flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Loading branches...')}
                </div>) : (<select id="appt-branch" name="branch" disabled={!values.organization} className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" value={values.branch} onChange={(e) => {
                const selected = activeBranches.find((b) => (b.branchName || b.branch_name || b.name) === e.target.value);
                handleBranchChange(e.target.value, String(selected?.id || ''));
            }}>
                  <option value="">
                    {!values.organization ? t('appt.selectOrgFirst', 'Select Organization First...') : activeBranches.length === 0 ? t('appt.noBranches', 'No active branches found') : t('appt.selectBranch', 'Select Branch...')}
                  </option>
                  {activeBranches.map((b) => (<option key={b.id} value={b.branchName || b.branch_name || b.name}>
                      {b.branchName || b.branch_name || b.name}
                    </option>))}
                </select>)}
            </div>
            {errors.branch && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.branch}</p>}
          </div>
        </div>

        {/* ROW 2: Department & Host Employee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department (ACTIVE Departments of Selected Branch) */}
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">
              {t('appt.department', 'Department')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><Building className="h-5 w-5 text-emerald-400"/></span>
              {loadingDepts ? (<div className="w-full px-4 py-3.5 flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Loading departments...')}
                </div>) : (<select id="appt-department" name="department" disabled={!values.branch} className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" value={values.department} onChange={(e) => {
                const selected = activeDepartments.find((d) => (d.department_name || d.departmentName || d.name) === e.target.value);
                handleDeptChange(e.target.value, String(selected?.id || ''));
            }}>
                  <option value="">
                    {!values.branch ? t('appt.selectBranchFirst', 'Select Branch First...') : activeDepartments.length === 0 ? t('appt.noDepts', 'No active departments found') : t('appt.selectDept', 'Select Department...')}
                  </option>
                  {activeDepartments.map((d) => (<option key={d.id} value={d.department_name || d.departmentName || d.name}>
                      {d.department_name || d.departmentName || d.name}
                    </option>))}
                </select>)}
            </div>
            {errors.department && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.department}</p>}
          </div>

          {/* Host / Employee (ACTIVE + Host Enabled ONLY) */}
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">
              {t('appt.hostEmployee', 'Host / Employee')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><User className="h-5 w-5 text-purple-400"/></span>
              {loadingEmps ? (<div className="w-full px-4 py-3.5 flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Loading host employees...')}
                </div>) : (<select id="appt-hostName" name="hostName" disabled={!values.department} className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" value={values.hostId || ''} onChange={(e) => {
                const selectedId = e.target.value;
                const selectedEmp = activeEmployees.find((emp) => String(emp.id) === selectedId);
                handleChange('hostId', selectedId);
                handleChange('hostName', selectedEmp ? selectedEmp.name : '');
            }}>
                  <option value="">
                    {!values.department ? t('appt.selectDeptFirst', 'Select Department First...') : activeEmployees.length === 0 ? t('appt.noHosts', 'No host-enabled employees found') : t('appt.selectHost', 'Select Host / Employee...')}
                  </option>
                  {activeEmployees.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>)}
            </div>
            {errors.hostName && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.hostName}</p>}
          </div>
        </div>

        {/* ROW 3: Building / Location & Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">
              {t('appt.buildingLocation', 'Building / Location')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><MapPin className="h-5 w-5 text-rose-400"/></span>
              <select id="appt-location" name="location" disabled={!values.branch} className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" value={values.location} onChange={(e) => { handleChange('location', e.target.value); handleChange('meetingRoom', ''); }}>
                <option value="">
                  {!values.branch ? t('appt.selectBranchFirst', 'Select Branch First...') : t('appt.selectLocation', 'Select Building / Location...')}
                </option>
                {availableBuildings.map((b) => (<option key={b.id} value={b.name}>{b.name}</option>))}
              </select>
            </div>
            {errors.location && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">
              {t('appt.meetingRoom', 'Room / Office Number')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><MapPin className="h-5 w-5 text-amber-400"/></span>
              <select id="appt-meetingRoom" name="meetingRoom" disabled={!values.location} className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" value={values.meetingRoom} onChange={(e) => handleChange('meetingRoom', e.target.value)}>
                <option value="">
                  {!values.location ? t('appt.selectBuildingFirst', 'Select Building First...') : t('appt.selectRoom', 'Select Room / Office...')}
                </option>
                {availableRooms.map((r) => (<option key={r.id} value={r.name}>{r.name}</option>))}
              </select>
            </div>
            {errors.meetingRoom && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.meetingRoom}</p>}
          </div>
        </div>

        {/* VISIT PURPOSE (FULL WIDTH) */}
        <div className="w-full">
          <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">
            {t('appt.purpose', 'Visit Purpose')} <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm w-full">
            <span className="px-4 text-slate-400 border-r border-slate-800"><FileText className="h-5 w-5 text-emerald-400"/></span>
            <input id="appt-purpose" name="purpose" type="text" className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none placeholder:text-slate-500" placeholder={t('appt.purposePlaceholder', 'Type your visit purpose (e.g. Business Meeting, Official Project Review, Contract Discussion...)')} value={values.purpose} onChange={(e) => handleChange('purpose', e.target.value)}/>
          </div>
          {errors.purpose && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.purpose}</p>}
        </div>

        {/* DATE & TIME ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">{t('appt.visitDate', 'Appointment Date')} <span className="text-rose-500">*</span></label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><Calendar className="h-5 w-5 text-amber-400"/></span>
              <input id="appt-visitDate" name="visitDate" type="date" className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer" value={values.visitDate} onChange={(e) => handleChange('visitDate', e.target.value)}/>
            </div>
            {errors.visitDate && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.visitDate}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">{t('appt.startTime', 'Start Time')} <span className="text-rose-500">*</span></label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><Clock className="h-5 w-5 text-purple-400"/></span>
              <input id="appt-startTime" name="startTime" type="time" className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer" value={values.startTime} onChange={(e) => handleChange('startTime', e.target.value)}/>
            </div>
            {errors.startTime && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.startTime}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">{t('appt.endTime', 'End Time')} <span className="text-rose-500">*</span></label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <span className="px-4 text-slate-400 border-r border-slate-800"><Clock className="h-5 w-5 text-indigo-400"/></span>
              <input id="appt-endTime" name="endTime" type="time" className="w-full bg-slate-900 text-white text-xs md:text-sm font-bold px-4 py-3.5 outline-none cursor-pointer" value={values.endTime} onChange={(e) => handleChange('endTime', e.target.value)}/>
            </div>
            {errors.endTime && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.endTime}</p>}
          </div>
        </div>

        {/* DURATION BOX */}
        <div className={`p-4 rounded-2xl border text-xs md:text-sm font-black flex items-center justify-between transition-all ${calculatedDuration.isValid ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-400 shrink-0"/>
            <span>{t('appt.calculatedDuration', 'Calculated Visit Duration:')}</span>
          </div>
          <span className="px-4 py-1.5 bg-blue-600/30 border border-blue-500/40 rounded-xl uppercase tracking-wider font-black">
            {calculatedDuration.text}
          </span>
        </div>

        {/* FILE UPLOADER */}
        <div>
          <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">{t('appt.attachDoc', 'Attach Document / Invitation Copy (Optional)')}</label>
          <div className="border border-dashed border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 rounded-3xl p-8 text-center transition-all group">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-8 w-8"/>
            </div>
            <h4 className="text-base font-black text-white mb-1">
              {attachedFileName ? (<span className="text-emerald-400 flex items-center justify-center gap-2">
                  <FileCheck className="h-5 w-5"/> {attachedFileName}
                </span>) : t('wizard.dragDoc', 'Choose a file or drag & drop it here.')}
            </h4>
            <p className="text-xs text-slate-400 font-semibold mb-5">JPEG, PNG, PDF formats, up to 50 MB.</p>
            <label className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-2xl text-xs md:text-sm font-extrabold cursor-pointer border border-blue-500/30 transition-all shadow-md active:scale-95">
              <FolderUp className="h-4 w-4"/> {t('form.document', 'Browse File')}
              <input type="file" className="hidden" onChange={handleFileUpload}/>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs uppercase font-extrabold text-slate-400 mb-2">{t('form.notes', 'Additional Notes / Remarks')}</label>
          <textarea id="appt-notes" name="notes" rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500" placeholder={t('appt.notesPlaceholder', 'Enter any additional information or visit instructions...')} value={values.notes} onChange={(e) => handleChange('notes', e.target.value)}/>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-2xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all cursor-pointer">
            {t('form.cancel', 'Cancel')}
          </button>
          <button type="submit" disabled={isSubmitting || !calculatedDuration.isValid} className="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-2xl flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all border border-blue-500/30 cursor-pointer disabled:opacity-50">
            <Send className="h-4 w-4"/>
            <span>{isSubmitting ? t('appt.submitting', 'Submitting...') : t('appt.submitRequest', 'Submit Appointment Request')}</span>
          </button>
        </div>
      </form>
    </div>);
}
