import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, ChevronRight, ChevronLeft, X, Lock, Building, Layers, AlertTriangle, Info, Check, Search } from 'lucide-react';
import { roleManagementApi } from '../../../modules/role-management/api/roleManagementApi';
import FieldError from '../../../components/common/FieldError';
import BackButton from '../../../components/common/BackButton';
export default function CreateRoleWizard({ existingRoles, editingRole, onClose, onSuccess }) {
    const isEditMode = Boolean(editingRole);
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    // Form State
    const [roleName, setRoleName] = useState(editingRole?.role_name || '');
    const [roleCode, setRoleCode] = useState(editingRole?.role_code || '');
    const [description, setDescription] = useState(editingRole?.description || '');
    const [roleType, setRoleType] = useState(editingRole?.role_type || 'CUSTOM');
    const [status, setStatus] = useState(editingRole?.status || 'ACTIVE');
    const [scopeType, setScopeType] = useState(editingRole?.scope_type || 'ORGANIZATION');
    const [parentRoleId, setParentRoleId] = useState(editingRole?.parent_role_id || null);
    const [priority, setPriority] = useState(editingRole?.priority || 10);
    const [isAssignmentAllowed, setIsAssignmentAllowed] = useState(editingRole?.is_assignment_allowed ?? true);
    const [isTemporaryAllowed, setIsTemporaryAllowed] = useState(editingRole?.is_temporary_allowed ?? true);
    const [isMultipleAllowed, setIsMultipleAllowed] = useState(editingRole?.is_multiple_allowed ?? true);
    const [requiresApproval, setRequiresApproval] = useState(editingRole?.requires_approval ?? false);
    const [riskLevel, setRiskLevel] = useState(editingRole?.risk_level || 'LOW');
    // Permissions Selection State
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
    const [activeModuleFilter, setActiveModuleFilter] = useState('ALL');
    const [permSearch, setPermSearch] = useState('');
    // Form Validation Errors State
    const [roleErrors, setRoleErrors] = useState({});
    const handleNameChange = (val) => {
        setRoleName(val);
        if (roleErrors.roleName)
            setRoleErrors((prev) => ({ ...prev, roleName: null }));
        if (!roleCode || roleCode === roleName.toUpperCase().replace(/\s+/g, '_')) {
            setRoleCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
            if (roleErrors.roleCode)
                setRoleErrors((prev) => ({ ...prev, roleCode: null }));
        }
    };
    useEffect(() => {
        loadPermissions();
        if (editingRole) {
            loadEditingRolePermissions();
        }
    }, []);
    const loadEditingRolePermissions = async () => {
        if (!editingRole)
            return;
        try {
            const res = await roleManagementApi.getPermissions(editingRole.id);
            if (res.data?.success && Array.isArray(res.data.data)) {
                setSelectedPermissionIds(res.data.data.map((p) => p.id || p.permission_id));
            }
        }
        catch (err) {
            console.error('Failed to load role permissions for editing:', err);
        }
    };
    const loadPermissions = async () => {
        try {
            const res = await roleManagementApi.listAllPermissions({ status: 'ACTIVE' });
            if (res.data?.success) {
                setAllPermissions(res.data.data);
            }
        }
        catch (err) {
            console.error('Failed to load permissions:', err);
        }
    };
    const togglePermission = (id) => {
        if (selectedPermissionIds.includes(id)) {
            setSelectedPermissionIds(selectedPermissionIds.filter((p) => p !== id));
        }
        else {
            setSelectedPermissionIds([...selectedPermissionIds, id]);
        }
    };
    const modules = Array.from(new Set(allPermissions.map((p) => p.module || 'GENERAL')));
    const focusInvalidField = () => {
        setTimeout(() => {
            const firstInvalid = document.querySelector('[data-invalid="true"], [aria-invalid="true"]');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof firstInvalid.focus === 'function')
                    firstInvalid.focus();
            }
        }, 50);
    };
    const validateStep = (step) => {
        setErrorMessage(null);
        const newErrs = { ...roleErrors };
        let isValid = true;
        if (step === 1) {
            if (!roleName.trim()) {
                newErrs.roleName = 'Role Display Name is required.';
                isValid = false;
            }
            else {
                newErrs.roleName = null;
            }
            if (!roleCode.trim()) {
                newErrs.roleCode = 'Unique Role Code is required.';
                isValid = false;
            }
            else {
                newErrs.roleCode = null;
            }
        }
        setRoleErrors(newErrs);
        if (!isValid) {
            setErrorMessage('Please complete the required fields highlighted in red.');
            focusInvalidField();
        }
        return isValid;
    };
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(7, prev + 1));
        }
    };
    const handleBack = () => {
        setErrorMessage(null);
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };
    const handleSubmit = async () => {
        setSubmitting(true);
        setErrorMessage(null);
        try {
            const payload = {
                roleName: roleName.trim(),
                roleCode: roleCode.trim().toUpperCase(),
                description: description.trim(),
                roleType,
                status,
                scopeType,
                parentRoleId: parentRoleId ? Number(parentRoleId) : null,
                priority: Number(priority),
                isAssignmentAllowed,
                isTemporaryAllowed,
                isMultipleAllowed,
                requiresApproval,
                riskLevel,
                permissionIds: selectedPermissionIds,
            };
            let res;
            if (isEditMode && editingRole) {
                res = await roleManagementApi.updateRole(editingRole.id, payload);
            }
            else {
                res = await roleManagementApi.createRole(payload);
            }
            if (res.data?.success) {
                onSuccess();
            }
        }
        catch (err) {
            const msg = err.response?.data?.message || err.message || (isEditMode ? 'Failed to update role' : 'Failed to create role');
            setErrorMessage(msg);
        }
        finally {
            setSubmitting(false);
        }
    };
    const steps = [
        { num: 1, title: 'Basic Info' },
        { num: 2, title: 'Scope' },
        { num: 3, title: 'Hierarchy' },
        { num: 4, title: 'Configuration' },
        { num: 5, title: 'Permissions' },
        { num: 6, title: 'Review' },
        { num: 7, title: 'Confirm' },
    ];
    const filteredPermissions = allPermissions.filter((p) => {
        const matchesModule = activeModuleFilter === 'ALL' || p.module === activeModuleFilter;
        const matchesSearch = !permSearch.trim() ||
            p.permission_name.toLowerCase().includes(permSearch.toLowerCase()) ||
            p.permission_code.toLowerCase().includes(permSearch.toLowerCase());
        return matchesModule && matchesSearch;
    });
    const handleSelectAllFiltered = () => {
        const idsToAdd = filteredPermissions.map((p) => p.id);
        setSelectedPermissionIds(Array.from(new Set([...selectedPermissionIds, ...idsToAdd])));
    };
    const handleDeselectAllFiltered = () => {
        const idsToRemove = new Set(filteredPermissions.map((p) => p.id));
        setSelectedPermissionIds(selectedPermissionIds.filter((id) => !idsToRemove.has(id)));
    };
    return (<div className="w-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
      {/* Wizard Header - In Page Workspace */}
      <div className="px-6 md:px-8 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <BackButton onClick={onClose} title="Back to Roles List"/>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {isEditMode ? `Edit Role: ${editingRole?.role_name}` : 'Enterprise Role Creation Wizard'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
                RBAC ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Step {currentStep} of 7 — {steps[currentStep - 1].title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors" title="Close Wizard">
          <X className="h-5 w-5"/>
        </button>
      </div>

      {/* Stepper Progress Bar - Edge to Edge */}
      <div className="px-6 md:px-10 py-3 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto flex items-center justify-between gap-3 text-xs font-mono shrink-0 shadow-sm">
        {steps.map((s) => (<div key={s.num} onClick={() => {
                if (s.num < currentStep)
                    setCurrentStep(s.num);
            }} className={`flex items-center gap-2.5 min-w-max transition-all ${s.num < currentStep ? 'cursor-pointer hover:opacity-80' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${currentStep === s.num
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-600/30'
                : currentStep > s.num
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
              {currentStep > s.num ? <Check className="h-4 w-4 stroke-[3]"/> : s.num}
            </div>
            <span className={`text-xs ${currentStep === s.num
                ? 'text-white font-bold'
                : currentStep > s.num
                    ? 'text-slate-300'
                    : 'text-slate-500'}`}>
              {s.title}
            </span>
            {s.num < 7 && <ChevronRight className="h-3.5 w-3.5 text-slate-700 ml-1 shrink-0"/>}
          </div>))}
      </div>

      {/* Error Notification */}
      {errorMessage && (<div className="mx-6 md:mx-10 mt-3 p-3 bg-rose-950/80 border border-rose-700/50 rounded-xl text-xs text-rose-300 flex items-center gap-2 shrink-0">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0"/>
          <span>{errorMessage}</span>
        </div>)}

      {/* Wizard Step Content Body - Full Width Spacious Workspace */}
      <div className="p-6 md:p-10 overflow-y-auto flex-1 min-h-0 bg-slate-900/40">
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (<div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">General Role Identification</h3>
                <p className="text-xs text-slate-400 mt-0.5">Specify basic metadata and operational identifiers for this role.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                    Role Display Name *
                  </label>
                  <input type="text" name="roleName" required placeholder="e.g. Senior Security Manager" value={roleName} data-invalid={Boolean(roleErrors.roleName)} aria-invalid={Boolean(roleErrors.roleName)} onChange={(e) => handleNameChange(e.target.value)} className={`w-full px-4 py-2.5 bg-slate-950 rounded-xl text-white text-sm focus:outline-none transition-all ${roleErrors.roleName
                ? 'border-2 border-rose-500 bg-rose-950/20 text-white animate-shake'
                : 'border border-slate-800 focus:border-indigo-500'}`}/>
                  <FieldError error={roleErrors.roleName}/>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                    Unique Role Code *
                  </label>
                  <input type="text" name="roleCode" required placeholder="e.g. SENIOR_SECURITY_MANAGER" value={roleCode} data-invalid={Boolean(roleErrors.roleCode)} aria-invalid={Boolean(roleErrors.roleCode)} onChange={(e) => {
                setRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                if (roleErrors.roleCode)
                    setRoleErrors((prev) => ({ ...prev, roleCode: null }));
            }} className={`w-full px-4 py-2.5 bg-slate-950 rounded-xl text-cyan-400 font-mono text-sm focus:outline-none transition-all ${roleErrors.roleCode
                ? 'border-2 border-rose-500 bg-rose-950/20 text-white animate-shake'
                : 'border border-slate-800 focus:border-indigo-500'}`}/>
                  <FieldError error={roleErrors.roleCode}/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                  Description
                </label>
                <textarea rows={3} placeholder="Describe role responsibilities, functional scope, and operational usage..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                    Role Type
                  </label>
                  <select value={roleType} onChange={(e) => setRoleType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="CUSTOM">CUSTOM (Administrator Created)</option>
                    <option value="SYSTEM">SYSTEM (Infrastructure Protected)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                    Operational Status
                  </label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-3 text-slate-400 text-xs">
                <Info className="h-5 w-5 text-indigo-400 shrink-0"/>
                <span>
                  Role codes act as immutable programmatic keys across policy engines and API authorization guards. Once assigned, keep them consistent.
                </span>
              </div>
            </div>)}

          {/* STEP 2: Scope */}
          {currentStep === 2 && (<div className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Operational Scope Boundary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select the organizational boundary where user assignments under this role will apply.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                { id: 'SYSTEM', title: 'System Wide', desc: 'Applies universally across all facilities and organizations.', icon: Lock },
                { id: 'ORGANIZATION', title: 'Organization Level', desc: 'Scoped to single enterprise organization unit.', icon: Building },
                { id: 'BRANCH', title: 'Branch Level', desc: 'Scoped to specific facility branch site.', icon: Layers },
                { id: 'DEPARTMENT', title: 'Department Level', desc: 'Scoped to assigned functional department unit.', icon: Shield },
                { id: 'BUILDING', title: 'Building Site Level', desc: 'Scoped to physical building entry zone site.', icon: Building },
            ].map((item) => {
                const Icon = item.icon;
                const isSelected = scopeType === item.id;
                return (<div key={item.id} onClick={() => setScopeType(item.id)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                          <Icon className="h-5 w-5"/>
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.title}</div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-1 transition-all ${isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-700 bg-slate-900'}`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]"/>}
                      </div>
                    </div>);
            })}
              </div>
            </div>)}

          {/* STEP 3: Hierarchy */}
          {currentStep === 3 && (<div className="space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Inheritance Hierarchy Tree</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select an optional parent role to establish permission inheritance.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                  Parent Role (Optional)
                </label>
                <select value={parentRoleId || ''} onChange={(e) => setParentRoleId(e.target.value ? Number(e.target.value) : null)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="">None (Root Role - No Parent)</option>
                  {existingRoles.map((r) => (<option key={r.id} value={r.id}>
                      {r.role_name} ({r.role_code})
                    </option>))}
                </select>
              </div>

              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Info className="h-4 w-4"/> Hierarchy Rules & Behavior
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assigning a parent role allows child roles to implicitly inherit permissions granted to the parent.
                  The RBAC engine automatically guards against circular dependencies and self-parenting loops.
                </p>
              </div>
            </div>)}

          {/* STEP 4: Configuration */}
          {currentStep === 4 && (<div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Operational Policy & Risk Configuration</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fine-tune risk evaluation, coexistence rules, and approval workflows.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                    Role Evaluation Priority (1 - 100)
                  </label>
                  <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition-colors"/>
                  <p className="text-[11px] text-slate-500 mt-1">Higher numbers take precedence when resolving conflicting policies.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-xs">
                    Risk Level Assessment
                  </label>
                  <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="LOW">LOW RISK</option>
                    <option value="MEDIUM">MEDIUM RISK</option>
                    <option value="HIGH">HIGH RISK</option>
                    <option value="CRITICAL">CRITICAL RISK</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">High and Critical risk roles trigger heightened audit logging.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                { state: isAssignmentAllowed, setter: setIsAssignmentAllowed, title: 'Assignment Allowed', desc: 'Permit administrators to assign users to this role.' },
                { state: isTemporaryAllowed, setter: setIsTemporaryAllowed, title: 'Temporary Assignments Allowed', desc: 'Allow scheduling start and end expiration dates.' },
                { state: isMultipleAllowed, setter: setIsMultipleAllowed, title: 'Multiple Roles Coexistence', desc: 'Allow user to hold other roles simultaneously.' },
                { state: requiresApproval, setter: setRequiresApproval, title: 'Requires Authorization Approval', desc: 'Assignments trigger approval workflow before becoming active.' },
            ].map((item, idx) => (<div key={idx} onClick={() => item.setter(!item.state)} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all">
                    <div className="pr-3">
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${item.state ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.state ? 'translate-x-5' : 'translate-x-0'}`}/>
                    </div>
                  </div>))}
              </div>
            </div>)}

          {/* STEP 5: Permissions */}
          {currentStep === 5 && (<div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Granular Permission Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select discrete permissions from Permission Management to bind to this role.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-950 border border-indigo-500/30 text-indigo-400 rounded-lg font-mono font-bold text-xs">
                    {selectedPermissionIds.length} Selected
                  </span>
                  <button onClick={handleSelectAllFiltered} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors">
                    Select Filtered
                  </button>
                  <button onClick={handleDeselectAllFiltered} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-colors">
                    Clear Filtered
                  </button>
                </div>
              </div>

              {/* Search & Module Filters */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"/>
                  <input type="text" placeholder="Search permissions by name or code..." value={permSearch} onChange={(e) => setPermSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"/>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
                  <button onClick={() => setActiveModuleFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 ${activeModuleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>
                    All Modules
                  </button>
                  {modules.map((m) => (<button key={m} onClick={() => setActiveModuleFilter(m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 ${activeModuleFilter === m ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>
                      {m}
                    </button>))}
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredPermissions.length === 0 ? (<div className="col-span-full py-12 text-center text-slate-500">
                    No permissions found matching current filter or search criteria.
                  </div>) : (filteredPermissions.map((perm) => {
                const isSelected = selectedPermissionIds.includes(perm.id);
                return (<div key={perm.id} onClick={() => togglePermission(perm.id)} className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-950/30'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200 text-xs">{perm.permission_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-cyan-400 border border-slate-800">
                            {perm.module}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-indigo-400 mb-1">{perm.permission_code}</div>
                        {perm.description && (<p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{perm.description}</p>)}
                      </div>);
            }))}
              </div>
            </div>)}

          {/* STEP 6: Review */}
          {currentStep === 6 && (<div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Role Configuration Review</h3>
                <p className="text-xs text-slate-400 mt-0.5">Verify all role parameters before executing the creation transaction.</p>
              </div>

              <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-slate-500">Role Name:</span> <span className="text-white font-bold ml-2">{roleName}</span></div>
                  <div><span className="text-slate-500">Role Code:</span> <span className="text-cyan-400 font-mono font-bold ml-2">{roleCode}</span></div>
                  <div><span className="text-slate-500">Role Type:</span> <span className="text-slate-200 ml-2">{roleType}</span></div>
                  <div><span className="text-slate-500">Operational Scope:</span> <span className="text-indigo-400 font-bold ml-2">{scopeType}</span></div>
                  <div><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold ml-2">{status}</span></div>
                  <div><span className="text-slate-500">Risk Assessment:</span> <span className="text-amber-400 font-bold ml-2">{riskLevel}</span></div>
                  <div><span className="text-slate-500">Evaluation Priority:</span> <span className="text-white font-mono ml-2">{priority}</span></div>
                  <div><span className="text-slate-500">Permissions Bound:</span> <span className="text-teal-400 font-bold ml-2">{selectedPermissionIds.length} permissions</span></div>
                </div>

                {description && (<div className="pt-3 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-500 block mb-1">Description:</span>
                    <p className="text-slate-300 leading-relaxed">{description}</p>
                  </div>)}
              </div>
            </div>)}

          {/* STEP 7: Confirm */}
          {currentStep === 7 && (<div className="text-center py-10 space-y-5 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-emerald-600/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-900/30">
                <CheckCircle2 className="h-10 w-10"/>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isEditMode ? 'Ready to Update Role in Database' : 'Ready to Commit Role to Database'}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-2 max-w-lg mx-auto">
                  {isEditMode
                ? 'Clicking confirm will execute a MySQL database transaction to update the role record, sync permissions, log audit entries, and broadcast real-time Socket.IO events.'
                : 'Clicking confirm will execute a MySQL database transaction to insert the role record, bind permissions, log audit entries, and broadcast real-time Socket.IO events.'}
                </p>
              </div>
            </div>)}
        </div>
      </div>

      {/* Wizard Footer Controls - Edge to Edge Fixed Bottom Bar */}
      <div className="px-6 md:px-10 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
        <button disabled={currentStep === 1 || submitting} onClick={handleBack} className="h-[42px] px-5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
          <ChevronLeft className="h-4 w-4"/> Back
        </button>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-[42px] px-4 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            Cancel
          </button>
          {currentStep < 7 ? (<button onClick={handleNext} className="h-[42px] px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2">
              Next Step <ChevronRight className="h-4 w-4"/>
            </button>) : (<button disabled={submitting} onClick={handleSubmit} className="h-[42px] px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/30 flex items-center gap-2">
              {submitting ? 'Committing Transaction...' : isEditMode ? 'Confirm & Update Role' : 'Confirm & Create Role'}
            </button>)}
        </div>
      </div>
    </div>);
}
