import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import CountryNationalitySelect from '../../../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../../../components/common/CountryPhoneInput';
// Complete list of all world countries / nationalities with flag emojis
const ALL_NATIONALITIES = [
    { label: 'Afghan', flag: '🇦🇫' },
    { label: 'Albanian', flag: '🇦🇱' },
    { label: 'Algerian', flag: '🇩🇿' },
    { label: 'American', flag: '🇺🇸' },
    { label: 'Andorran', flag: '🇦🇩' },
    { label: 'Angolan', flag: '🇦🇴' },
    { label: 'Antiguan', flag: '🇦🇬' },
    { label: 'Argentine', flag: '🇦🇷' },
    { label: 'Armenian', flag: '🇦🇲' },
    { label: 'Australian', flag: '🇦🇺' },
    { label: 'Austrian', flag: '🇦🇹' },
    { label: 'Azerbaijani', flag: '🇦🇿' },
    { label: 'Bahamian', flag: '🇧🇸' },
    { label: 'Bahraini', flag: '🇧🇭' },
    { label: 'Bangladeshi', flag: '🇧🇩' },
    { label: 'Barbadian', flag: '🇧🇧' },
    { label: 'Belarusian', flag: '🇧🇾' },
    { label: 'Belgian', flag: '🇧🇪' },
    { label: 'Belizean', flag: '🇧🇿' },
    { label: 'Beninese', flag: '🇧🇯' },
    { label: 'Bhutanese', flag: '🇧🇹' },
    { label: 'Bolivian', flag: '🇧🇴' },
    { label: 'Bosnian', flag: '🇧🇦' },
    { label: 'Botswanan', flag: '🇧🇼' },
    { label: 'Brazilian', flag: '🇧🇷' },
    { label: 'British', flag: '🇬🇧' },
    { label: 'Bruneian', flag: '🇧🇳' },
    { label: 'Bulgarian', flag: '🇧🇬' },
    { label: 'Burkinabe', flag: '🇧🇫' },
    { label: 'Burundian', flag: '🇧🇮' },
    { label: 'Cambodian', flag: '🇰🇭' },
    { label: 'Cameroonian', flag: '🇨🇲' },
    { label: 'Canadian', flag: '🇨🇦' },
    { label: 'Cape Verdean', flag: '🇨🇻' },
    { label: 'Central African', flag: '🇨🇫' },
    { label: 'Chadian', flag: '🇹🇩' },
    { label: 'Chilean', flag: '🇨🇱' },
    { label: 'Chinese', flag: '🇨🇳' },
    { label: 'Colombian', flag: '🇨🇴' },
    { label: 'Comoran', flag: '🇰🇲' },
    { label: 'Congolese', flag: '🇨🇬' },
    { label: 'Costa Rican', flag: '🇨🇷' },
    { label: 'Croatian', flag: '🇭🇷' },
    { label: 'Cuban', flag: '🇨🇺' },
    { label: 'Cypriot', flag: '🇨🇾' },
    { label: 'Czech', flag: '🇨🇿' },
    { label: 'Danish', flag: '🇩🇰' },
    { label: 'Djiboutian', flag: '🇩🇯' },
    { label: 'Dominican', flag: '🇩🇴' },
    { label: 'Dutch', flag: '🇳🇱' },
    { label: 'Ecuadorian', flag: '🇪🇨' },
    { label: 'Egyptian', flag: '🇪🇬' },
    { label: 'Emirati', flag: '🇦🇪' },
    { label: 'Equatorial Guinean', flag: '🇬🇶' },
    { label: 'Eritrean', flag: '🇪🇷' },
    { label: 'Estonian', flag: '🇪🇪' },
    { label: 'Eswatini', flag: '🇸🇿' },
    { label: 'Ethiopian', flag: '🇪🇹' },
    { label: 'Fijian', flag: '🇫🇯' },
    { label: 'Filipino', flag: '🇵🇭' },
    { label: 'Finnish', flag: '🇫🇮' },
    { label: 'French', flag: '🇫🇷' },
    { label: 'Gabonese', flag: '🇬🇦' },
    { label: 'Gambian', flag: '🇬🇲' },
    { label: 'Georgian', flag: '🇬🇪' },
    { label: 'German', flag: '🇩🇪' },
    { label: 'Ghanaian', flag: '🇬🇭' },
    { label: 'Greek', flag: '🇬🇷' },
    { label: 'Grenadian', flag: '🇬🇩' },
    { label: 'Guatemalan', flag: '🇬🇹' },
    { label: 'Guinean', flag: '🇬🇳' },
    { label: 'Guyanese', flag: '🇬🇾' },
    { label: 'Haitian', flag: '🇭🇹' },
    { label: 'Honduran', flag: '🇭🇳' },
    { label: 'Hungarian', flag: '🇭🇺' },
    { label: 'Icelandic', flag: '🇮🇸' },
    { label: 'Indian', flag: '🇮🇳' },
    { label: 'Indonesian', flag: '🇮🇩' },
    { label: 'Iranian', flag: '🇮🇷' },
    { label: 'Iraqi', flag: '🇮🇶' },
    { label: 'Irish', flag: '🇮🇪' },
    { label: 'Israeli', flag: '🇮🇱' },
    { label: 'Italian', flag: '🇮🇹' },
    { label: 'Ivorian', flag: '🇨🇮' },
    { label: 'Jamaican', flag: '🇯🇲' },
    { label: 'Japanese', flag: '🇯🇵' },
    { label: 'Jordanian', flag: '🇯🇴' },
    { label: 'Kazakh', flag: '🇰🇿' },
    { label: 'Kenyan', flag: '🇰🇪' },
    { label: 'Korean', flag: '🇰🇷' },
    { label: 'Kuwaiti', flag: '🇰🇼' },
    { label: 'Kyrgyz', flag: '🇰🇬' },
    { label: 'Lao', flag: '🇱🇦' },
    { label: 'Latvian', flag: '🇱🇻' },
    { label: 'Lebanese', flag: '🇱🇧' },
    { label: 'Liberian', flag: '🇱🇷' },
    { label: 'Libyan', flag: '🇱🇾' },
    { label: 'Lithuanian', flag: '🇱🇹' },
    { label: 'Luxembourgish', flag: '🇱🇺' },
    { label: 'Malagasy', flag: '🇲🇬' },
    { label: 'Malawian', flag: '🇲🇼' },
    { label: 'Malaysian', flag: '🇲🇾' },
    { label: 'Maldivian', flag: '🇲🇻' },
    { label: 'Malian', flag: '🇲🇱' },
    { label: 'Maltese', flag: '🇲🇹' },
    { label: 'Mauritanian', flag: '🇲🇷' },
    { label: 'Mauritian', flag: '🇲🇺' },
    { label: 'Mexican', flag: '🇲🇽' },
    { label: 'Moldovan', flag: '🇲🇩' },
    { label: 'Monacan', flag: '🇲🇨' },
    { label: 'Mongolian', flag: '🇲🇳' },
    { label: 'Montenegrin', flag: '🇲🇪' },
    { label: 'Moroccan', flag: '🇲🇦' },
    { label: 'Mozambican', flag: '🇲🇿' },
    { label: 'Myanmar', flag: '🇲🇲' },
    { label: 'Namibian', flag: '🇳🇦' },
    { label: 'Nepalese', flag: '🇳🇵' },
    { label: 'New Zealander', flag: '🇳🇿' },
    { label: 'Nicaraguan', flag: '🇳🇮' },
    { label: 'Nigerien', flag: '🇳🇪' },
    { label: 'Nigerian', flag: '🇳🇬' },
    { label: 'Norwegian', flag: '🇳🇴' },
    { label: 'Omani', flag: '🇴🇲' },
    { label: 'Pakistani', flag: '🇵🇰' },
    { label: 'Palestinian', flag: '🇵🇸' },
    { label: 'Panamanian', flag: '🇵🇦' },
    { label: 'Papua New Guinean', flag: '🇵🇬' },
    { label: 'Paraguayan', flag: '🇵🇾' },
    { label: 'Peruvian', flag: '🇵🇪' },
    { label: 'Polish', flag: '🇵🇱' },
    { label: 'Portuguese', flag: '🇵🇹' },
    { label: 'Qatari', flag: '🇶🇦' },
    { label: 'Romanian', flag: '🇷🇴' },
    { label: 'Russian', flag: '🇷🇺' },
    { label: 'Rwandan', flag: '🇷🇼' },
    { label: 'Saudi', flag: '🇸🇦' },
    { label: 'Senegalese', flag: '🇸🇳' },
    { label: 'Serbian', flag: '🇷🇸' },
    { label: 'Seychellois', flag: '🇸🇨' },
    { label: 'Sierra Leonean', flag: '🇸🇱' },
    { label: 'Singaporean', flag: '🇸🇬' },
    { label: 'Slovak', flag: '🇸🇰' },
    { label: 'Slovenian', flag: '🇸🇮' },
    { label: 'Somali', flag: '🇸🇴' },
    { label: 'South African', flag: '🇿🇦' },
    { label: 'South Sudanese', flag: '🇸🇸' },
    { label: 'Spanish', flag: '🇪🇸' },
    { label: 'Sri Lankan', flag: '🇱🇰' },
    { label: 'Sudanese', flag: '🇸🇩' },
    { label: 'Surinamese', flag: '🇸🇷' },
    { label: 'Swedish', flag: '🇸🇪' },
    { label: 'Swiss', flag: '🇨🇭' },
    { label: 'Syrian', flag: '🇸🇾' },
    { label: 'Taiwanese', flag: '🇹🇼' },
    { label: 'Tajik', flag: '🇹🇯' },
    { label: 'Tanzanian', flag: '🇹🇿' },
    { label: 'Thai', flag: '🇹🇭' },
    { label: 'Togolese', flag: '🇹🇬' },
    { label: 'Trinidadian', flag: '🇹🇹' },
    { label: 'Tunisian', flag: '🇹🇳' },
    { label: 'Turkish', flag: '🇹🇷' },
    { label: 'Turkmen', flag: '🇹🇲' },
    { label: 'Ugandan', flag: '🇺🇬' },
    { label: 'Ukrainian', flag: '🇺🇦' },
    { label: 'Uruguayan', flag: '🇺🇾' },
    { label: 'Uzbek', flag: '🇺🇿' },
    { label: 'Venezuelan', flag: '🇻🇪' },
    { label: 'Vietnamese', flag: '🇻🇳' },
    { label: 'Yemeni', flag: '🇾🇪' },
    { label: 'Zambian', flag: '🇿🇲' },
    { label: 'Zimbabwean', flag: '🇿🇼' }
];
// Helper to get max date string for 18 years ago today
function getMax18YearsAgoDate() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
}
// Helper to calculate exact age in years from DOB string
function calculateAge(dobString) {
    if (!dobString)
        return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}
// Helper to auto-generate sequential Employee ID (e.g. EMP-2026-00001)
function generateSequentialEmployeeId(existingEmployeesList = []) {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    if (Array.isArray(existingEmployeesList)) {
        existingEmployeesList.forEach((emp) => {
            if (emp && emp.employee_number) {
                const match = String(emp.employee_number).match(/EMP-\d{4}-(\d+)/i);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxSeq) {
                        maxSeq = num;
                    }
                }
            }
        });
    }
    const nextSeq = maxSeq > 0 ? maxSeq + 1 : (existingEmployeesList.length || 0) + 1;
    const padded = String(nextSeq).padStart(5, '0');
    return `EMP-${year}-${padded}`;
}
// Live typing sanitization: Strips HTML tags/scripts, keeps spaces intact
function sanitizeLive(val) {
    if (!val)
        return '';
    return val.replace(/<[^>]*>?/gm, '');
}
// Final/Blur sanitization: Strips HTML tags and trims whitespace
function sanitizeFinal(val) {
    if (!val)
        return '';
    return val.replace(/<[^>]*>?/gm, '').trim();
}
function sanitizeEmail(val) {
    return sanitizeLive(val).toLowerCase().trim();
}
function sanitizePhone(val) {
    return val.replace(/[^0-9+\-\s()]/g, '');
}
export default function EmployeeRegistrationWizard({ employee, existingEmployees = [], onClose, onSave }) {
    const [activeStep, setActiveStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const isInitializedRef = useRef(false);
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        dob: '',
        nationality: '',
        marital_status: '',
        photo_url: '',
        employee_number: '',
        employment_type: 'Full-Time',
        job_title: '',
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
    // Initialize form data ONCE on mount or when editing employee to preserve typed data across step switches
    useEffect(() => {
        if (isInitializedRef.current)
            return;
        if (employee) {
            setFormData({
                ...employee,
                first_name: employee.first_name || '',
                middle_name: employee.middle_name || '',
                last_name: employee.last_name || '',
                employee_number: employee.employee_number || generateSequentialEmployeeId(existingEmployees),
                job_title: employee.job_title || '',
                gender: employee.gender || '',
                dob: employee.dob || '',
                nationality: employee.nationality || '',
                email: employee.email || '',
                mobile_number: employee.mobile_number || '',
                office_phone: employee.office_phone || '',
                extension: employee.extension || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_relation: employee.emergency_contact_relation || 'Spouse',
                emergency_contact_phone: employee.emergency_contact_phone || ''
            });
        }
        else {
            setFormData((prev) => ({
                ...prev,
                employee_number: generateSequentialEmployeeId(existingEmployees),
                job_title: ''
            }));
        }
        isInitializedRef.current = true;
    }, [employee, existingEmployees]);
    // Helper to check if email is duplicate
    const checkDuplicateEmail = (emailVal) => {
        if (!emailVal || !emailVal.trim())
            return false;
        const cleanMail = emailVal.trim().toLowerCase();
        if (!Array.isArray(existingEmployees) || existingEmployees.length === 0)
            return false;
        return existingEmployees.some((emp) => {
            if (!emp || !emp.email)
                return false;
            // Exclude current employee being edited
            if (employee && (emp.id === employee.id || emp.employee_number === employee.employee_number)) {
                return false;
            }
            return emp.email.trim().toLowerCase() === cleanMail;
        });
    };
    // Step-level validation rules
    const validateStep = (stepNum) => {
        const newErrors = {};
        if (stepNum === 1) {
            const cleanFirst = sanitizeFinal(formData.first_name);
            if (!cleanFirst) {
                newErrors.first_name = 'Please enter first name';
            }
            else if (cleanFirst.length < 2) {
                newErrors.first_name = 'First name must be at least 2 characters.';
            }
            const cleanLast = sanitizeFinal(formData.last_name);
            if (!cleanLast) {
                newErrors.last_name = 'Please enter last name';
            }
            else if (cleanLast.length < 2) {
                newErrors.last_name = 'Last name must be at least 2 characters.';
            }
            if (!formData.gender || !formData.gender.trim()) {
                newErrors.gender = 'Please select a gender';
            }
            if (!formData.dob || !formData.dob.trim()) {
                newErrors.dob = 'Please fill in a complete birthday';
            }
            else {
                const age = calculateAge(formData.dob);
                if (age < 18) {
                    newErrors.dob = 'Employee must be at least 18 years old.';
                }
            }
            if (!formData.nationality || !formData.nationality.trim()) {
                newErrors.nationality = 'Please select a nationality';
            }
        }
        if (stepNum === 2) {
            if (!formData.employee_number) {
                const autoId = generateSequentialEmployeeId(existingEmployees);
                setFormData((prev) => ({ ...prev, employee_number: autoId }));
            }
            const cleanTitle = sanitizeFinal(formData.job_title);
            if (!cleanTitle) {
                newErrors.job_title = 'Please enter job title';
            }
        }
        if (stepNum === 3) {
            if (!formData.department_id) {
                newErrors.department_id = 'Please select a department';
            }
        }
        if (stepNum === 4) {
            const cleanMail = formData.email ? formData.email.trim().toLowerCase() : '';
            if (!cleanMail) {
                newErrors.email = 'Corporate Email address is required. Please enter your real email.';
            }
            else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(cleanMail)) {
                    newErrors.email = 'Please enter a valid email format (e.g. name@company.com).';
                }
                else if (checkDuplicateEmail(cleanMail)) {
                    newErrors.email = `Email address '${cleanMail}' is already registered to another employee. Please enter a unique email address.`;
                }
            }
        }
        if (stepNum === 5) {
            if (!formData.max_visitors_per_day || Number(formData.max_visitors_per_day) < 1) {
                newErrors.max_visitors_per_day = 'Max visitors per day must be at least 1.';
            }
            if (!formData.max_concurrent_visitors || Number(formData.max_concurrent_visitors) < 1) {
                newErrors.max_concurrent_visitors = 'Max concurrent visitors must be at least 1.';
            }
        }
        setErrors(prev => {
            // Remove step-specific old errors and merge new ones
            const filtered = { ...prev };
            if (stepNum === 1) {
                delete filtered.first_name;
                delete filtered.last_name;
                delete filtered.gender;
                delete filtered.dob;
                delete filtered.nationality;
            }
            if (stepNum === 2) {
                delete filtered.employee_number;
                delete filtered.job_title;
            }
            if (stepNum === 3) {
                delete filtered.department_id;
            }
            if (stepNum === 4) {
                delete filtered.email;
            }
            if (stepNum === 5) {
                delete filtered.max_visitors_per_day;
                delete filtered.max_concurrent_visitors;
            }
            return { ...filtered, ...newErrors };
        });
        if (Object.keys(newErrors).length > 0) {
            const touchedMap = {};
            Object.keys(newErrors).forEach(k => { touchedMap[k] = true; });
            setTouched(prev => ({ ...prev, ...touchedMap }));
            setTimeout(() => {
                const firstInvalidEl = document.querySelector('[data-invalid="true"]');
                if (firstInvalidEl) {
                    firstInvalidEl.focus();
                }
            }, 50);
            return false;
        }
        return true;
    };
    const handleNextStep = () => {
        const isValid = validateStep(activeStep);
        if (isValid) {
            setActiveStep(s => Math.min(5, s + 1));
        }
    };
    const handleStepTabClick = (targetStep) => {
        if (targetStep === activeStep)
            return;
        if (targetStep < activeStep) {
            setActiveStep(targetStep);
            return;
        }
        // Validate current step before allowing forward navigation
        let allValid = true;
        for (let i = 1; i < targetStep; i++) {
            if (!validateStep(i)) {
                allValid = false;
                setActiveStep(i);
                break;
            }
        }
        if (allValid) {
            setActiveStep(targetStep);
        }
    };
    const handleFieldChange = (field, rawVal) => {
        let val = rawVal;
        if (field === 'first_name' || field === 'middle_name' || field === 'last_name' || field === 'nationality' || field === 'job_title' || field === 'position') {
            val = sanitizeLive(rawVal);
        }
        else if (field === 'email') {
            val = sanitizeLive(rawVal).toLowerCase();
        }
        else if (field === 'mobile_number' || field === 'office_phone' || field === 'emergency_contact_phone') {
            val = sanitizePhone(rawVal);
        }
        setFormData((prev) => ({ ...prev, [field]: val }));
        // Real-time error clearing & duplicate email check
        if (field === 'email') {
            const cleanMail = val.trim().toLowerCase();
            if (!cleanMail) {
                setErrors(prev => ({
                    ...prev,
                    email: 'Corporate Email address is required. Please enter your real email.'
                }));
                setTouched(prev => ({ ...prev, email: true }));
            }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanMail)) {
                setErrors(prev => ({
                    ...prev,
                    email: 'Please enter a valid email format (e.g. name@company.com).'
                }));
                setTouched(prev => ({ ...prev, email: true }));
            }
            else if (checkDuplicateEmail(cleanMail)) {
                setErrors(prev => ({
                    ...prev,
                    email: `Email address '${cleanMail}' is already registered to another employee. Please enter a unique email address.`
                }));
                setTouched(prev => ({ ...prev, email: true }));
            }
            else {
                setErrors(prev => {
                    const updated = { ...prev };
                    delete updated.email;
                    return updated;
                });
            }
        }
        else if (field === 'dob') {
            if (val) {
                const age = calculateAge(val);
                if (age < 18) {
                    setErrors(prev => ({ ...prev, dob: 'Employee must be at least 18 years old.' }));
                    setTouched(prev => ({ ...prev, dob: true }));
                }
                else if (errors.dob) {
                    setErrors(prev => {
                        const updated = { ...prev };
                        delete updated.dob;
                        return updated;
                    });
                }
            }
        }
        else if (errors[field]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        // Sanitize whitespace on blur
        if (typeof formData[field] === 'string') {
            setFormData((prev) => ({
                ...prev,
                [field]: sanitizeFinal(prev[field])
            }));
        }
        validateStep(activeStep);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate all 5 steps before saving
        for (let i = 1; i <= 5; i++) {
            if (!validateStep(i)) {
                setActiveStep(i);
                return;
            }
        }
        // Final sanitized payload
        const sanitizedPayload = {
            ...formData,
            first_name: sanitizeFinal(formData.first_name),
            middle_name: sanitizeFinal(formData.middle_name),
            last_name: sanitizeFinal(formData.last_name),
            full_name: `${sanitizeFinal(formData.first_name)} ${sanitizeFinal(formData.last_name)}`.trim(),
            email: sanitizeFinal(formData.email).toLowerCase(),
            mobile_number: sanitizeFinal(formData.mobile_number),
            office_phone: sanitizeFinal(formData.office_phone),
            emergency_contact_phone: sanitizeFinal(formData.emergency_contact_phone),
            job_title: sanitizeFinal(formData.job_title),
            position: sanitizeFinal(formData.position)
        };
        onSave(sanitizedPayload);
    };
    const steps = [
        { num: 1, label: 'GENERAL' },
        { num: 2, label: 'EMPLOYMENT' },
        { num: 3, label: 'OFFICE & MANAGER' },
        { num: 4, label: 'CONTACT & EMERGENCY' },
        { num: 5, label: 'HOST CONFIG' }
    ];
    // Google-Style Red Border & Red Glow Helper (matching screenshot)
    const getInputClass = (field) => {
        const isInvalid = touched[field] && Boolean(errors[field]);
        if (isInvalid) {
            return 'form-control form-control-lg text-xs font-semibold py-2.5 px-3 w-100 bg-[#201013] text-white border-rose-400 ring-2 ring-rose-500/20 focus:border-rose-400 focus:ring-rose-500/30 transition-all';
        }
        return 'form-control form-control-lg text-xs font-semibold py-2.5 px-3 w-100 bg-slate-950 text-slate-200 border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';
    };
    const getSelectClass = (field) => {
        const isInvalid = touched[field] && Boolean(errors[field]);
        if (isInvalid) {
            return 'form-select form-select-lg text-xs font-semibold py-2.5 ps-3 pe-8 w-100 bg-[#201013] text-white border-rose-400 ring-2 ring-rose-500/20 focus:border-rose-400 focus:ring-rose-500/30 transition-all';
        }
        return 'form-select form-select-lg text-xs font-semibold py-2.5 ps-3 pe-8 w-100 bg-slate-950 text-slate-200 border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all';
    };
    return (<div className="space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="d-flex align-items-center gap-3">
        <button type="button" onClick={onClose} className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 d-flex align-items-center justify-content-center transition-all shadow-sm shrink-0" title="Back to Directory">
          <ArrowLeft className="h-5 w-5"/>
        </button>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-0.5">
            {employee ? 'Edit Employee Record' : 'Employee Registration Wizard'}
          </h1>
          <p className="text-xs text-slate-400 mb-0 font-medium">
            Follow the steps below to {employee ? 'update existing employee information' : 'register a new employee record across branches and departments'}.
          </p>
        </div>
      </div>

      {/* Step Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="d-flex justify-content-between align-items-center position-relative">
          {steps.map((step) => {
            const isActive = activeStep === step.num;
            const isCompleted = activeStep > step.num;
            return (<div key={step.num} className="d-flex flex-column align-items-center cursor-default text-center z-1" style={{ flex: 1 }}>
                <div className={`h-11 w-11 rounded-full d-flex align-items-center justify-content-center font-black text-sm transition-all duration-200 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-4 ring-indigo-500/20 scale-110'
                    : isCompleted
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'}`}>
                  {step.num}
                </div>
                <span className={`text-[10px] font-extrabold tracking-wider uppercase mt-2.5 transition-all ${isActive ? 'text-indigo-400 font-black' : isCompleted ? 'text-indigo-300' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>);
        })}
        </div>
      </div>

      {/* Main Full-Width Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleSubmit} noValidate>

          {/* STEP 1: GENERAL INFORMATION */}
          {activeStep === 1 && (<div className="space-y-4">
              <div className="border-bottom border-slate-800 pb-3 mb-4">
                <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0">
                  GENERAL INFORMATION
                </h2>
              </div>

              <div className="row g-3">
                {/* First Name */}
                <div className="col-12 col-md-4">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.first_name && errors.first_name ? 'text-rose-400' : 'text-slate-400'}`}>
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" required data-invalid={Boolean(touched.first_name && errors.first_name)} className={getInputClass('first_name')} value={formData.first_name} onChange={(e) => handleFieldChange('first_name', e.target.value)} onBlur={() => handleBlur('first_name')} placeholder="Enter first name"/>
                  {touched.first_name && errors.first_name && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.first_name}
                    </span>)}
                </div>

                {/* Middle Name */}
                <div className="col-12 col-md-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Middle Name</label>
                  <input type="text" className={getInputClass('middle_name')} value={formData.middle_name} onChange={(e) => handleFieldChange('middle_name', e.target.value)} onBlur={() => handleBlur('middle_name')} placeholder="Enter middle name (optional)"/>
                </div>

                {/* Last Name */}
                <div className="col-12 col-md-4">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.last_name && errors.last_name ? 'text-rose-400' : 'text-slate-400'}`}>
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" required data-invalid={Boolean(touched.last_name && errors.last_name)} className={getInputClass('last_name')} value={formData.last_name} onChange={(e) => handleFieldChange('last_name', e.target.value)} onBlur={() => handleBlur('last_name')} placeholder="Enter last name"/>
                  {touched.last_name && errors.last_name && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.last_name}
                    </span>)}
                </div>

                {/* Gender */}
                <div className="col-12 col-md-4">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.gender && errors.gender ? 'text-rose-400' : 'text-slate-400'}`}>
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select data-invalid={Boolean(touched.gender && errors.gender)} className={getSelectClass('gender')} value={formData.gender} onChange={(e) => handleFieldChange('gender', e.target.value)} onBlur={() => handleBlur('gender')}>
                    <option value="">Select Gender *</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {touched.gender && errors.gender && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.gender}
                    </span>)}
                </div>

                {/* Date of Birth (Enforces 18+ years old) */}
                <div className="col-12 col-md-4">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.dob && errors.dob ? 'text-rose-400' : 'text-slate-400'}`}>
                    Date of Birth (18+ Years) <span className="text-rose-500">*</span>
                  </label>
                  <input type="date" data-invalid={Boolean(touched.dob && errors.dob)} className={getInputClass('dob')} value={formData.dob} onChange={(e) => handleFieldChange('dob', e.target.value)} onBlur={() => handleBlur('dob')}/>
                  {touched.dob && errors.dob && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.dob}
                    </span>)}
                </div>

                {/* Nationality (Searchable Standard Component) */}
                <div className="col-12 col-md-4 position-relative">
                  <CountryNationalitySelect
                    id="emp-nationality-select"
                    label="Nationality"
                    required
                    value={formData.nationality}
                    onChange={(e) => handleFieldChange('nationality', e.target.value)}
                    error={touched.nationality && errors.nationality ? errors.nationality : ''}
                    placeholder="Select Nationality *"
                  />
                </div>
              </div>
            </div>)}

          {/* STEP 2: EMPLOYMENT DETAILS */}
          {activeStep === 2 && (<div className="space-y-4">
              <div className="border-bottom border-slate-800 pb-3 mb-4">
                <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0">
                  EMPLOYMENT DETAILS
                </h2>
              </div>

              <div className="row g-3">
                {/* Employee ID (Auto-Generated by System) */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Employee ID <span className="text-indigo-400 font-medium lowercase">(auto-generated)</span>
                  </label>
                  <input type="text" readOnly disabled className="form-control form-control-lg text-xs font-extrabold py-2.5 px-3 w-100 bg-slate-950/70 text-indigo-300 border-slate-800 cursor-not-allowed opacity-90 tracking-wider" value={formData.employee_number || generateSequentialEmployeeId(existingEmployees)}/>
                </div>

                {/* Employment Type */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Employment Type</label>
                  <select className={getSelectClass('employment_type')} value={formData.employment_type} onChange={(e) => handleFieldChange('employment_type', e.target.value)}>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                {/* Job Title */}
                <div className="col-12 col-md-6">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.job_title && errors.job_title ? 'text-rose-400' : 'text-slate-400'}`}>
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" required data-invalid={Boolean(touched.job_title && errors.job_title)} className={getInputClass('job_title')} value={formData.job_title} onChange={(e) => handleFieldChange('job_title', e.target.value)} onBlur={() => handleBlur('job_title')} placeholder="Enter job title"/>
                  {touched.job_title && errors.job_title && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.job_title}
                    </span>)}
                </div>

                {/* Hire Date */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Hire Date</label>
                  <input type="date" className={getInputClass('hire_date')} value={formData.hire_date} onChange={(e) => handleFieldChange('hire_date', e.target.value)}/>
                </div>
              </div>
            </div>)}

          {/* STEP 3: OFFICE ASSIGNMENT & MANAGER */}
          {activeStep === 3 && (<div className="space-y-4">
              <div className="border-bottom border-slate-800 pb-3 mb-4">
                <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0">
                  OFFICE ASSIGNMENT & MANAGER
                </h2>
              </div>

              <div className="row g-3">
                {/* Department */}
                <div className="col-12 col-md-6">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.department_id && errors.department_id ? 'text-rose-400' : 'text-slate-400'}`}>
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select data-invalid={Boolean(touched.department_id && errors.department_id)} className={getSelectClass('department_id')} value={formData.department_id} onChange={(e) => handleFieldChange('department_id', Number(e.target.value))}>
                    <option value={1}>Executive Office</option>
                    <option value={2}>Sales & Marketing</option>
                    <option value={3}>Finance</option>
                    <option value={4}>Operations</option>
                    <option value={5}>Human Resources</option>
                    <option value={6}>IT & Security</option>
                  </select>
                  {touched.department_id && errors.department_id && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.department_id}
                    </span>)}
                </div>

                {/* Reporting Manager */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Reporting Manager</label>
                  <select className={getSelectClass('manager_id')} value={formData.manager_id} onChange={(e) => handleFieldChange('manager_id', Number(e.target.value))}>
                    <option value={1}>System Admin</option>
                    <option value={2}>Sarah Johnson (Sales Director)</option>
                    <option value={4}>Emily Davis (Finance Manager)</option>
                  </select>
                </div>

                {/* Floor Number */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Floor Number</label>
                  <input type="text" className={getInputClass('floor_number')} value={formData.floor_number} onChange={(e) => handleFieldChange('floor_number', e.target.value)}/>
                </div>

                {/* Office Room Number */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Office Room Number</label>
                  <input type="text" className={getInputClass('office_number')} value={formData.office_number} onChange={(e) => handleFieldChange('office_number', e.target.value)}/>
                </div>
              </div>
            </div>)}

          {/* STEP 4: CONTACT & EMERGENCY */}
          {activeStep === 4 && (<div className="space-y-4">
              <div className="border-bottom border-slate-800 pb-3 mb-4">
                <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0">
                  CONTACT & EMERGENCY CONTACTS
                </h2>
              </div>

              <div className="row g-3">
                {/* Corporate Email */}
                <div className="col-12 col-md-6">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.email && errors.email ? 'text-rose-400' : 'text-slate-400'}`}>
                    Corporate Email <span className="text-rose-400">*</span>
                  </label>
                  <input type="email" data-invalid={Boolean(touched.email && errors.email)} className={getInputClass('email')} value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} onBlur={() => handleBlur('email')} placeholder="e.g. employee@company.com"/>
                  {touched.email && errors.email && (<span className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-500 shrink-0"/> {errors.email}
                    </span>)}
                </div>

                {/* Mobile Phone Number */}
                <div className="col-12 col-md-6">
                  <CountryPhoneInput
                    id="emp-mobile-number"
                    label="Mobile Phone Number"
                    value={formData.mobile_number}
                    onChange={(e) => handleFieldChange('mobile_number', e.target.value)}
                    placeholder="+251 9..."
                  />
                </div>

                {/* Emergency Contact Name */}
                <div className="col-12 col-md-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Emergency Contact Name</label>
                  <input type="text" className={getInputClass('emergency_contact_name')} value={formData.emergency_contact_name} onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}/>
                </div>

                {/* Emergency Contact Phone */}
                <div className="col-12 col-md-6">
                  <CountryPhoneInput
                    id="emp-emergency-contact-phone"
                    label="Emergency Contact Phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                    placeholder="+251 9..."
                  />
                </div>
              </div>
            </div>)}

          {/* STEP 5: HOST CONFIGURATION */}
          {activeStep === 5 && (<div className="space-y-4">
              <div className="border-bottom border-slate-800 pb-3 mb-4">
                <h2 className="text-xs font-black text-white uppercase tracking-wider mb-0">
                  HOST CONFIGURATION & VISITOR QUOTAS
                </h2>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="form-check form-switch bg-slate-950 p-3 rounded-xl border border-slate-800 d-flex align-items-center justify-content-between">
                    <label className="form-check-label text-xs font-bold text-white mb-0 ms-0" htmlFor="fullHostSwitch">
                      Enable Employee as Appointment Host
                    </label>
                    <input className="form-check-input ms-auto" type="checkbox" id="fullHostSwitch" checked={formData.is_host_enabled} onChange={(e) => setFormData({ ...formData, is_host_enabled: e.target.checked })}/>
                  </div>
                </div>

                {/* Max Visitors Per Day */}
                <div className="col-12 col-md-6">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.max_visitors_per_day && errors.max_visitors_per_day ? 'text-rose-400' : 'text-slate-400'}`}>
                    Max Visitors Per Day
                  </label>
                  <input type="number" data-invalid={Boolean(touched.max_visitors_per_day && errors.max_visitors_per_day)} className={getInputClass('max_visitors_per_day')} value={formData.max_visitors_per_day} onChange={(e) => handleFieldChange('max_visitors_per_day', Number(e.target.value))} onBlur={() => handleBlur('max_visitors_per_day')}/>
                  {touched.max_visitors_per_day && errors.max_visitors_per_day && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.max_visitors_per_day}
                    </span>)}
                </div>

                {/* Max Concurrent Visitors */}
                <div className="col-12 col-md-6">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${touched.max_concurrent_visitors && errors.max_concurrent_visitors ? 'text-rose-400' : 'text-slate-400'}`}>
                    Max Concurrent Visitors
                  </label>
                  <input type="number" data-invalid={Boolean(touched.max_concurrent_visitors && errors.max_concurrent_visitors)} className={getInputClass('max_concurrent_visitors')} value={formData.max_concurrent_visitors} onChange={(e) => handleFieldChange('max_concurrent_visitors', Number(e.target.value))} onBlur={() => handleBlur('max_concurrent_visitors')}/>
                  {touched.max_concurrent_visitors && errors.max_concurrent_visitors && (<span className="text-[11px] font-semibold text-rose-300 mt-1.5 d-flex align-items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400 shrink-0"/> {errors.max_concurrent_visitors}
                    </span>)}
                </div>
              </div>
            </div>)}

          {/* Bottom Action Footer */}
          <div className="border-top border-slate-800 pt-4 mt-5 d-flex justify-content-between align-items-center">
            <button type="button" className="btn btn-link text-slate-400 hover:text-white text-xs font-bold text-decoration-none px-0" onClick={onClose}>
              Cancel
            </button>

            <div className="d-flex gap-2">
              {activeStep > 1 && (<button type="button" onClick={() => setActiveStep(s => Math.max(1, s - 1))} className="btn btn-outline-secondary text-xs font-bold px-4 py-2.5 rounded-xl">
                  ← Previous
                </button>)}

              {activeStep < 5 ? (<button type="button" onClick={handleNextStep} className="btn btn-primary text-xs font-bold px-4 py-2.5 rounded-xl d-flex align-items-center gap-2 shadow-lg shadow-indigo-600/30">
                  Next <ArrowRight className="h-4 w-4"/>
                </button>) : (<button type="submit" className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-xl d-flex align-items-center gap-2 shadow-lg shadow-indigo-600/30">
                  <CheckCircle2 className="h-4 w-4"/> Save Employee
                </button>)}
            </div>
          </div>

        </form>
      </div>
    </div>);
}
