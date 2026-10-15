import React, { useState, useEffect } from 'react';
import { CheckCircle2, User } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function EmployeeFormModal({ employee, onClose, onSave }) {
    const { t, language } = useLanguage();
    const isAm = language === 'am';

    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'Male',
        dob: '1990-01-01',
        nationality: 'Ethiopian',
        marital_status: 'Single',
        photo_url: '',
        employee_number: '',
        employment_type: 'Full-Time',
        job_title: 'Staff',
        position: 'Employee',
        hire_date: new Date().toISOString().split('T')[0],
        employment_status: 'Active',
        organization_id: 1,
        branch_id: 1,
        department_id: 1,
        building_id: 1,
        floor_number: '3',
        office_number: '301',
        manager_id: 1,
        email: '',
        mobile_number: '',
        office_phone: '',
        extension: '',
        emergency_contact_name: '',
        emergency_contact_relation: 'Spouse',
        emergency_contact_phone: '',
        is_host_enabled: true,
        max_visitors_per_day: 10,
        max_concurrent_visitors: 3,
        default_room_id: 1,
        default_approval_role: 'Host',
        availability_status: 'Available'
    });

    useEffect(() => {
        if (employee) {
            setFormData({
                ...employee,
                middle_name: employee.middle_name || '',
                office_phone: employee.office_phone || '',
                extension: employee.extension || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_relation: employee.emergency_contact_relation || 'Spouse',
                emergency_contact_phone: employee.emergency_contact_phone || ''
            });
        } else {
            setFormData((prev) => ({
                ...prev,
                employee_number: `EMP-2026-${Date.now().toString().slice(-5)}`
            }));
        }
    }, [employee]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal fade show d-block font-sans" style={{ backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">

                    {/* Modal Header */}
                    <div className="modal-header border-bottom border-slate-200 dark:border-slate-800 px-4 py-3">
                        <h5 className="modal-title text-base font-extrabold text-slate-900 dark:text-white d-flex align-items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {employee
                                ? (isAm ? 'የሠራተኛ መረጃን ያድሱ' : 'Edit Employee Record')
                                : (isAm ? 'አዲስ ሠራተኛ መዝግብ' : 'Register New Employee')}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} />
                    </div>

                    {/* Step Wizard Bar */}
                    <div className="bg-[#0f172a] border-bottom border-slate-800 p-4">
                        <div className="d-flex justify-content-between align-items-center position-relative">
                            {[
                                { num: 1, key: 'personal', label: isAm ? 'የግል መረጃ' : 'PERSONAL INFO' },
                                { num: 2, key: 'employment', label: isAm ? 'የሥራ ቅጥር' : 'EMPLOYMENT' },
                                { num: 3, key: 'org', label: isAm ? 'ቢሮ እና ኃላፊ' : 'OFFICE & MANAGER' },
                                { num: 4, key: 'contact', label: isAm ? 'እውቂያ እና አደጋ ጊዜ' : 'CONTACT & EMERGENCY' },
                                { num: 5, key: 'host', label: isAm ? 'የእንግዳ አስተናጋጅነት' : 'HOST CONFIG' }
                            ].map((step, idx, arr) => {
                                const isActive = activeTab === step.key;
                                const activeIdx = arr.findIndex(s => s.key === activeTab);
                                const isCompleted = activeIdx > idx;
                                return (
                                    <div key={step.key} onClick={() => setActiveTab(step.key)} className="d-flex flex-column align-items-center cursor-pointer text-center z-1" style={{ flex: 1 }}>
                                        <div className={`h-10 w-10 rounded-full d-flex align-items-center justify-content-center font-black text-sm transition-all duration-200 ${
                                            isActive
                                                ? 'bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20 scale-110'
                                                : isCompleted
                                                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                        }`}>
                                            {step.num}
                                        </div>
                                        <span className={`text-[10px] font-extrabold tracking-wider uppercase mt-2 transition-all ${isActive ? 'text-primary font-black' : isCompleted ? 'text-indigo-300' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4 max-h-[500px] overflow-y-auto">

                            {/* TAB 1: PERSONAL INFO */}
                            {activeTab === 'personal' && (
                                <div className="row g-3">
                                    <div className="col-12 col-md-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'ስም *' : 'First Name *'}
                                        </label>
                                        <input type="text" required className="form-control text-xs font-semibold" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የአባት ስም' : 'Middle Name'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የአያት ስም *' : 'Last Name *'}
                                        </label>
                                        <input type="text" required className="form-control text-xs font-semibold" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'ጾታ' : 'Gender'}
                                        </label>
                                        <select className="form-select text-xs font-semibold" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                                            <option value="Male">{isAm ? 'ወንድ' : 'Male'}</option>
                                            <option value="Female">{isAm ? 'ሴት' : 'Female'}</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የትውልድ ቀን' : 'Date of Birth'}
                                        </label>
                                        <input type="date" className="form-control text-xs font-semibold" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'ዜግነት' : 'Nationality'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: EMPLOYMENT DETAILS */}
                            {activeTab === 'employment' && (
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የሠራተኛ መለያ ቁጥር (Employee ID) *' : 'Employee ID *'}
                                        </label>
                                        <input type="text" required className="form-control text-xs font-semibold" value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የቅጥር ዓይነት' : 'Employment Type'}
                                        </label>
                                        <select className="form-select text-xs font-semibold" value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                                            <option value="Full-Time">{isAm ? 'ሙሉ ጊዜ (Full-Time)' : 'Full-Time'}</option>
                                            <option value="Part-Time">{isAm ? 'ተርን/ትርፍ ጊዜ (Part-Time)' : 'Part-Time'}</option>
                                            <option value="Contractor">{isAm ? 'ኮንትራት (Contractor)' : 'Contractor'}</option>
                                            <option value="Intern">{isAm ? 'ተለማማጅ (Intern)' : 'Intern'}</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የሥራ መደብ (Job Title) *' : 'Job Title *'}
                                        </label>
                                        <input type="text" required className="form-control text-xs font-semibold" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የተቀጠሩበት ቀን' : 'Hire Date'}
                                        </label>
                                        <input type="date" className="form-control text-xs font-semibold" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: OFFICE & MANAGER */}
                            {activeTab === 'org' && (
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የሥራ ክፍል (Department)' : 'Department'}
                                        </label>
                                        <select className="form-select text-xs font-semibold" value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                                            <option value={1}>{isAm ? 'የሥራ አመራር ቢሮ (Executive Office)' : 'Executive Office'}</option>
                                            <option value={2}>{isAm ? 'ሽያጭ እና ገበያ (Sales & Marketing)' : 'Sales & Marketing'}</option>
                                            <option value={3}>{isAm ? 'ፋይናንስ (Finance)' : 'Finance'}</option>
                                            <option value={4}>{isAm ? 'ኦፕሬሽንስ (Operations)' : 'Operations'}</option>
                                            <option value={5}>{isAm ? 'የሰው ኃይል (Human Resources)' : 'Human Resources'}</option>
                                            <option value={6}>{isAm ? 'አይቲ እና ደህንነት (IT & Security)' : 'IT & Security'}</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የቅርብ ኃላፊ (Manager)' : 'Manager'}
                                        </label>
                                        <select className="form-select text-xs font-semibold" value={formData.manager_id} onChange={(e) => setFormData({ ...formData, manager_id: Number(e.target.value) })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}>
                                            <option value={1}>System Admin</option>
                                            <option value={2}>Sarah Johnson (Sales Director)</option>
                                            <option value={4}>Emily Davis (Finance Manager)</option>
                                        </select>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'ፎቅ ቁጥር' : 'Floor Number'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.floor_number} onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የቢሮ ክፍል ቁጥር' : 'Office Room Number'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.office_number} onChange={(e) => setFormData({ ...formData, office_number: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: CONTACT & EMERGENCY */}
                            {activeTab === 'contact' && (
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የድርጅት ኢሜይል *' : 'Corporate Email *'}
                                        </label>
                                        <input type="email" required className="form-control text-xs font-semibold" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የሞባይል ስልክ ቁጥር' : 'Mobile Number'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.mobile_number} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የአደጋ ጊዜ ተጠሪ ስም' : 'Emergency Contact Name'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'የአደጋ ጊዜ ተጠሪ ስልክ ቁጥር' : 'Emergency Phone Number'}
                                        </label>
                                        <input type="text" className="form-control text-xs font-semibold" value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: HOST CONFIGURATION */}
                            {activeTab === 'host' && (
                                <div className="row g-3">
                                    <div className="col-12">
                                        <div className="form-check form-switch bg-slate-900 p-3 rounded-xl border border-slate-800 d-flex align-items-center justify-content-between">
                                            <label className="form-check-label text-xs font-bold text-white mb-0 ms-0" htmlFor="hostSwitch">
                                                {isAm ? 'ሠራተኛው እንግዶችን እንዲቀበልና እንዲያስተናግድ ፍቀድ' : 'Enable Employee as Appointment Host'}
                                            </label>
                                            <input className="form-check-input ms-auto" type="checkbox" id="hostSwitch" checked={formData.is_host_enabled} onChange={(e) => setFormData({ ...formData, is_host_enabled: e.target.checked })} />
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'በቀን የሚፈቀድ ከፍተኛ የእንግዳ ብዛት' : 'Max Visitors Per Day'}
                                        </label>
                                        <input type="number" className="form-control text-xs font-semibold" value={formData.max_visitors_per_day} onChange={(e) => setFormData({ ...formData, max_visitors_per_day: Number(e.target.value) })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                            {isAm ? 'በአንድ ጊዜ የሚስተናገድ ከፍተኛ እንግዳ' : 'Max Concurrent Visitors'}
                                        </label>
                                        <input type="number" className="form-control text-xs font-semibold" value={formData.max_concurrent_visitors} onChange={(e) => setFormData({ ...formData, max_concurrent_visitors: Number(e.target.value) })} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }} />
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="modal-footer border-top border-slate-200 dark:border-slate-800 px-4 py-3 d-flex justify-content-between align-items-center">
                            <button type="button" className="btn btn-sm btn-outline-secondary text-xs font-bold px-3 py-2" onClick={onClose}>
                                {isAm ? 'ሰርዝ' : 'Cancel'}
                            </button>

                            <div className="d-flex gap-2">
                                {activeTab !== 'personal' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const steps = ['personal', 'employment', 'org', 'contact', 'host'];
                                            const currIdx = steps.indexOf(activeTab);
                                            if (currIdx > 0) setActiveTab(steps[currIdx - 1]);
                                        }}
                                        className="btn btn-sm btn-outline-secondary text-xs font-bold px-3 py-2"
                                    >
                                        {isAm ? '← የቀደመ ደረጃ' : '← Previous Step'}
                                    </button>
                                )}

                                {activeTab !== 'host' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const steps = ['personal', 'employment', 'org', 'contact', 'host'];
                                            const currIdx = steps.indexOf(activeTab);
                                            if (currIdx < steps.length - 1) setActiveTab(steps[currIdx + 1]);
                                        }}
                                        className="btn btn-sm btn-primary text-xs font-bold px-4 py-2"
                                    >
                                        {isAm ? 'ቀጣይ ደረጃ →' : 'Next Step →'}
                                    </button>
                                )}

                                <button type="submit" className="btn btn-sm btn-success d-flex align-items-center gap-1.5 text-xs font-bold px-4 py-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {isAm ? 'ሠራተኛውን መዝግብ' : 'Save Employee'}
                                </button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
