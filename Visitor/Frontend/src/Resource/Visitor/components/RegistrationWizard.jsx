import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, MapPin, Briefcase, Phone, Car, Camera, FileText, ClipboardCheck, CheckCircle2, UploadCloud, Trash2, ChevronLeft, ChevronRight, Save, AlertTriangle, AlertCircle, X, Plus, Check, Copy, Printer, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import visitorRegistrationApi from '../../../modules/visitor-management/api/visitorRegistrationApi';
import { parseBackendFormErrors, focusFirstInvalidFieldInDom } from '../../../utils/formErrorUtils';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNotification } from '../../../contexts/NotificationContext';
import CountryNationalitySelect from '../../../components/common/CountryNationalitySelect';
import CountryPhoneInput from '../../../components/common/CountryPhoneInput';
import {
    validateName,
    validateMiddleName,
    validateGender,
    validateDateOfBirth,
    validateNationality,
    validateMaritalStatus,
    validateEmail,
    validatePhone,
    validateSelection,
    validateText,
    validateVehicle,
    validateIdentityDoc,
    validateFile,
    validateDateTimeRange
} from '../../../utils/formValidation';

const maxAllowedDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

const initialFormState = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    nationality: 'Ethiopian',
    maritalStatus: 'SINGLE',
    email: '',
    altEmail: '',
    phone: '',
    phonePrefix: '+251',
    altPhone: '',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    subCity: '',
    zone: '',
    woreda: '',
    postalCode: '',
    fullAddress: '',
    identityDoc: {
        documentType: 'National ID',
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        issuingCountry: 'Ethiopia',
        issuingAuthority: '',
        documentUrl: '',
        fileName: ''
    },
    idType: 'National ID',
    idNumber: '',
    organizationId: 1,
    branchId: 1,
    departmentId: 1,
    visitorCategory: 'Official',
    company: '',
    purposeOfVisit: 'Official Business',
    expectedVisitType: 'OFFICIAL',
    expectedArrivalTime: new Date().toISOString().slice(0, 16),
    expectedDepartureTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
    hostEmployeeId: 1,
    emergencyContact: {
        contactName: '',
        relationship: 'Relative',
        phone: '',
        email: ''
    },
    emergencyContactName: '',
    emergencyContactPhone: '',
    vehicle: {
        licensePlate: '',
        vehicleType: 'Car',
        brand: '',
        model: '',
        color: '',
        parkingRequired: false
    },
    photoUrl: '',
    documents: []
};

export const RegistrationWizard = ({ onSuccess, onCancel, initialDraftId, departments = [], employees = [] }) => {
    const { t, tStatus, language } = useLanguage();
    const isAm = language === 'am';
    const notify = useNotification();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialFormState);
    const [draftId, setDraftId] = useState(initialDraftId || `DRAFT-${Date.now()}`);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [registeredResult, setRegisteredResult] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    // Vehicle Optional Toggle
    const [hasVehicle, setHasVehicle] = useState(false);
    // Drag & Drop States
    const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
    const [isDraggingDoc, setIsDraggingDoc] = useState(false);
    const photoInputRef = useRef(null);
    const docInputRef = useRef(null);

    // Validate a single field dynamically
    const validateSingleField = (field, value, data = formData) => {
        switch (field) {
            case 'firstName':
                return validateName(value, isAm ? 'የመጀመሪያ ስም' : 'First name', true, isAm);
            case 'middleName':
                return validateMiddleName(value, false, isAm);
            case 'lastName':
                return validateName(value, isAm ? 'የአያት ስም' : 'Last name', true, isAm);
            case 'gender':
                return validateGender(value, isAm);
            case 'dateOfBirth':
                return validateDateOfBirth(value, 18, isAm);
            case 'nationality':
                return validateNationality(value, isAm);
            case 'maritalStatus':
                return validateMaritalStatus(value, isAm);
            case 'email':
                return validateEmail(value, true, isAm);
            case 'altEmail':
                return validateEmail(value, false, isAm);
            case 'phone':
                return validatePhone(value, data.phonePrefix || '+251', true, isAm);
            case 'altPhone':
                return validatePhone(value, data.phonePrefix || '+251', false, isAm);
            case 'country':
                return validateText(value, isAm ? 'ሀገር' : 'Country', 2, 60, true, isAm);
            case 'region':
                return validateText(value, isAm ? 'ክልል' : 'Region', 2, 60, false, isAm);
            case 'city':
                return validateText(value, isAm ? 'ከተማ' : 'City', 2, 60, true, isAm);
            case 'subCity':
                return validateText(value, isAm ? 'ክፍለ ከተማ' : 'Sub City', 2, 60, false, isAm);
            case 'zone':
                return validateText(value, isAm ? 'ዞን' : 'Zone', 2, 60, false, isAm);
            case 'woreda':
                return validateText(value, isAm ? 'ወረዳ' : 'Woreda', 1, 30, false, isAm);
            case 'fullAddress':
                return validateText(value, isAm ? 'ሙሉ አድራሻ' : 'Street address', 3, 255, false, isAm);
            case 'visitorCategory':
                return validateSelection(value, isAm ? 'የጎብኚ ዓይነት' : 'visitor category', isAm);
            case 'company':
                return validateText(value, isAm ? 'ድርጅት' : 'Company name', 2, 100, false, isAm);
            case 'departmentId':
                return validateSelection(value, isAm ? 'መምሪያ' : 'target department', isAm);
            case 'hostEmployeeId':
                return validateSelection(value, isAm ? 'አስተናጋጅ ሠራተኛ' : 'host employee', isAm);
            case 'expectedArrivalTime':
                return validateSelection(value, isAm ? 'የመድረሻ ሰዓት' : 'expected arrival time', isAm);
            case 'expectedDepartureTime':
                return validateSelection(value, isAm ? 'የመነሻ ሰዓት' : 'expected departure time', isAm) || validateDateTimeRange(data.expectedArrivalTime, value, isAm);
            case 'purposeOfVisit':
                return validateText(value, isAm ? 'የጉብኝት ዓላማ' : 'Purpose of visit', 3, 500, false, isAm);
            case 'emergencyContactName':
                return validateName(value, isAm ? 'የአስቸኳይ ጊዜ ተጠሪ ስም' : 'Emergency contact name', true, isAm);
            case 'emergencyContactPhone':
                return validatePhone(value, '+251', true, isAm);
            case 'emergencyEmail':
                return validateEmail(value, false, isAm);
            default:
                return null;
        }
    };

    // Validate all fields for a given step
    const validateStepFields = (targetStep, data = formData, isVeh = hasVehicle) => {
        const stepErrors = {};
        if (targetStep === 1) {
            const fnErr = validateName(data.firstName, isAm ? 'የመጀመሪያ ስም' : 'First name', true, isAm);
            if (fnErr) stepErrors.firstName = fnErr;
            const mnErr = validateMiddleName(data.middleName, false, isAm);
            if (mnErr) stepErrors.middleName = mnErr;
            const lnErr = validateName(data.lastName, isAm ? 'የአያት ስም' : 'Last name', true, isAm);
            if (lnErr) stepErrors.lastName = lnErr;
            const gErr = validateGender(data.gender, isAm);
            if (gErr) stepErrors.gender = gErr;
            const dobErr = validateDateOfBirth(data.dateOfBirth, 18, isAm);
            if (dobErr) stepErrors.dateOfBirth = dobErr;
            const natErr = validateNationality(data.nationality, isAm);
            if (natErr) stepErrors.nationality = natErr;
            const marErr = validateMaritalStatus(data.maritalStatus, isAm);
            if (marErr) stepErrors.maritalStatus = marErr;
        } else if (targetStep === 2) {
            const emErr = validateEmail(data.email, true, isAm);
            if (emErr) stepErrors.email = emErr;
            const altEmErr = validateEmail(data.altEmail, false, isAm);
            if (altEmErr) stepErrors.altEmail = altEmErr;
            const phErr = validatePhone(data.phone, data.phonePrefix || '+251', true, isAm);
            if (phErr) stepErrors.phone = phErr;
            const altPhErr = validatePhone(data.altPhone, data.phonePrefix || '+251', false, isAm);
            if (altPhErr) stepErrors.altPhone = altPhErr;
        } else if (targetStep === 3) {
            const cErr = validateText(data.country, isAm ? 'ሀገር' : 'Country', 2, 60, true, isAm);
            if (cErr) stepErrors.country = cErr;
            const rErr = validateText(data.region, isAm ? 'ክልል' : 'Region', 2, 60, false, isAm);
            if (rErr) stepErrors.region = rErr;
            const ctErr = validateText(data.city, isAm ? 'ከተማ' : 'City', 2, 60, true, isAm);
            if (ctErr) stepErrors.city = ctErr;
            const scErr = validateText(data.subCity, isAm ? 'ክፍለ ከተማ' : 'Sub City', 2, 60, false, isAm);
            if (scErr) stepErrors.subCity = scErr;
            const zErr = validateText(data.zone, isAm ? 'ዞን' : 'Zone', 2, 60, false, isAm);
            if (zErr) stepErrors.zone = zErr;
            const wErr = validateText(data.woreda, isAm ? 'ወረዳ' : 'Woreda', 1, 30, false, isAm);
            if (wErr) stepErrors.woreda = wErr;
            const aErr = validateText(data.fullAddress, isAm ? 'ሙሉ አድራሻ' : 'Street address', 3, 255, false, isAm);
            if (aErr) stepErrors.fullAddress = aErr;
        } else if (targetStep === 4) {
            const catErr = validateSelection(data.visitorCategory, isAm ? 'የጎብኚ ዓይነት' : 'visitor category', isAm);
            if (catErr) stepErrors.visitorCategory = catErr;
            const dErr = validateSelection(data.departmentId, isAm ? 'መምሪያ' : 'target department', isAm);
            if (dErr) stepErrors.departmentId = dErr;
            const hErr = validateSelection(data.hostEmployeeId, isAm ? 'አስተናጋጅ ሠራተኛ' : 'host employee', isAm);
            if (hErr) stepErrors.hostEmployeeId = hErr;
            const arErr = validateSelection(data.expectedArrivalTime, isAm ? 'የመድረሻ ሰዓት' : 'expected arrival time', isAm);
            if (arErr) stepErrors.expectedArrivalTime = arErr;
            const dpErr = validateSelection(data.expectedDepartureTime, isAm ? 'የመነሻ ሰዓት' : 'expected departure time', isAm) || validateDateTimeRange(data.expectedArrivalTime, data.expectedDepartureTime, isAm);
            if (dpErr) stepErrors.expectedDepartureTime = dpErr;
            const purpErr = validateText(data.purposeOfVisit, isAm ? 'የጉብኝት ዓላማ' : 'Purpose of visit', 3, 500, false, isAm);
            if (purpErr) stepErrors.purposeOfVisit = purpErr;
        } else if (targetStep === 5) {
            const contactName = data.emergencyContact?.contactName || data.emergencyContactName;
            const nameErr = validateName(contactName, isAm ? 'የአስቸኳይ ጊዜ ተጠሪ ስም' : 'Emergency contact name', true, isAm);
            if (nameErr) stepErrors.emergencyContactName = nameErr;
            const contactPhone = data.emergencyContact?.phone || data.emergencyContactPhone;
            const phErr = validatePhone(contactPhone, '+251', true, isAm);
            if (phErr) stepErrors.emergencyContactPhone = phErr;
            const emEmail = data.emergencyContact?.email;
            const emErr = validateEmail(emEmail, false, isAm);
            if (emErr) stepErrors.emergencyEmail = emErr;
        } else if (targetStep === 6) {
            if (isVeh) {
                const vErrors = validateVehicle(true, data.vehicle, isAm);
                Object.assign(stepErrors, vErrors);
            }
        } else if (targetStep === 7) {
            if (!data.photoUrl) {
                stepErrors.photoUrl = isAm ? 'እባክዎ የጎብኚውን ፎቶ ያስገቡ ወይም ይቅረጹ.' : 'Visitor photo is required for badge issuance.';
            }
        } else if (targetStep === 8) {
            const idType = data.identityDoc?.documentType || data.idType;
            const idNum = data.identityDoc?.documentNumber || data.idNumber;
            const expDate = data.identityDoc?.expiryDate;
            if (idNum) {
                const idDocErrors = validateIdentityDoc(idType, idNum, expDate, false, isAm);
                Object.assign(stepErrors, idDocErrors);
            }
            if (!data.documents || data.documents.length === 0) {
                stepErrors.documents = isAm ? 'እባክዎ ቢያንስ አንድ ደጋፊ ሰነድ ያያይዙ.' : 'Please upload at least one identification document.';
            }
        }
        return stepErrors;
    };

    // Validate all steps 1 through 8
    const validateAllSteps = (data = formData, isVeh = hasVehicle) => {
        let allErrors = {};
        let firstInvalidStep = null;
        for (let s = 1; s <= 8; s++) {
            const sErrors = validateStepFields(s, data, isVeh);
            if (Object.keys(sErrors).length > 0) {
                allErrors = { ...allErrors, ...sErrors };
                if (firstInvalidStep === null) {
                    firstInvalidStep = s;
                }
            }
        }
        return {
            isValid: firstInvalidStep === null,
            firstInvalidStep,
            errors: allErrors
        };
    };

    // Load draft if initialDraftId is provided
    useEffect(() => {
        if (initialDraftId) {
            visitorRegistrationApi.getDraft(initialDraftId)
                .then((res) => {
                if (res.data && res.data.formData) {
                    setFormData(res.data.formData);
                    if (res.data.formData.vehicle?.licensePlate) {
                        setHasVehicle(true);
                    }
                    if (res.data.current_step)
                        setStep(res.data.current_step);
                }
            })
                .catch(console.error);
        }
    }, [initialDraftId]);

    const handleChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);
        if (errors[field]) {
            const err = validateSingleField(field, value, updated);
            setErrors(prev => {
                const next = { ...prev };
                if (!err) {
                    delete next[field];
                } else {
                    next[field] = err;
                }
                return next;
            });
        }
    };

    const handleNestedChange = (parent, field, value) => {
        const updated = {
            ...formData,
            [parent]: {
                ...formData[parent],
                [field]: value
            }
        };
        setFormData(updated);

        // Clear or update relevant errors
        const directKey = field;
        if (errors[directKey] || errors[parent]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[directKey];
                delete next[parent];
                return next;
            });
        }
    };

    // Drag & Drop Photo Processors (with HTML5 Canvas compression & validation)
    const processPhotoFile = (file) => {
        const fileErr = validateFile(file, { allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes: 5 * 1024 * 1024, fileLabel: 'Photo' }, isAm);
        if (fileErr) {
            setErrors(prev => ({ ...prev, photoUrl: fileErr }));
            if (notify?.showError) notify.showError(fileErr);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const rawDataUrl = e.target?.result;
            if (!rawDataUrl) return;
            // Compress photo using Canvas element
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    handleChange('photoUrl', compressedDataUrl);
                } else {
                    handleChange('photoUrl', rawDataUrl);
                }
                setErrors(prev => {
                    const next = { ...prev };
                    delete next.photoUrl;
                    return next;
                });
            };
            img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoDrop = (e) => {
        e.preventDefault();
        setIsDraggingPhoto(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processPhotoFile(e.dataTransfer.files[0]);
        }
    };

    // Drag & Drop Supporting Document Processors with validation
    const processDocumentFiles = (files) => {
        let hasError = false;
        const validDocs = [];

        Array.from(files).forEach(file => {
            const fileErr = validateFile(file, { allowedTypes: ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'], maxSizeBytes: 15 * 1024 * 1024, fileLabel: 'Document' }, isAm);
            if (fileErr) {
                setErrors(prev => ({ ...prev, documents: fileErr }));
                if (notify?.showError) notify.showError(fileErr);
                hasError = true;
                return;
            }

            const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const mockAssetUrl = `/uploads/documents/doc_${Date.now()}_${cleanFileName}`;
            const newDoc = {
                documentType: file.type.includes('pdf') ? 'PDF Document' : file.type.startsWith('image/') ? 'Scanned Document Image' : 'Supporting Document',
                documentUrl: mockAssetUrl,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                issueDate: new Date().toISOString().slice(0, 10)
            };
            validDocs.push(newDoc);
        });

        if (validDocs.length > 0) {
            setFormData(prev => ({
                ...prev,
                documents: [...(prev.documents || []), ...validDocs]
            }));
            if (!hasError) {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next.documents;
                    return next;
                });
            }
        }
    };

    const handleDocDrop = (e) => {
        e.preventDefault();
        setIsDraggingDoc(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processDocumentFiles(e.dataTransfer.files);
        }
    };

    const validateCurrentStep = async () => {
        setIsValidating(true);
        const stepErrors = validateStepFields(step, formData, hasVehicle);

        if (Object.keys(stepErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...stepErrors }));
            setIsValidating(false);
            setTimeout(() => focusFirstInvalidFieldInDom(), 50);
            return false;
        }

        // Server-side duplicate validation check for email/phone on contact step
        if (step === 2) {
            try {
                const res = await visitorRegistrationApi.validate(formData);
                if (res.data && !res.data.isValid && res.data.errors) {
                    setErrors(prev => ({ ...prev, ...res.data.errors }));
                    setIsValidating(false);
                    setTimeout(() => focusFirstInvalidFieldInDom(), 50);
                    return false;
                }
            } catch (err) {
                console.warn('Server validation note:', err.message);
            }
        }

        setIsValidating(false);
        return true;
    };

    const handleNext = async () => {
        const isValid = await validateCurrentStep();
        if (isValid && step < 9) {
            const nextStep = step + 1;
            setStep(nextStep);
            autoSaveDraft(nextStep);
        }
    };

    const handlePrev = () => {
        if (step > 1) {
            // Moving backward preserves entered data and error state
            setStep(step - 1);
        }
    };

    const autoSaveDraft = async (targetStep = step) => {
        try {
            setIsSavingDraft(true);
            await visitorRegistrationApi.saveDraft(draftId, targetStep, formData);
            setSuccessMessage('Draft auto-saved successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            console.warn('Auto draft save note:', e);
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSubmitRegistration = async () => {
        setIsSubmitting(true);
        setErrors({});

        // Comprehensive validation across ALL steps 1-8 prior to DB commit
        const { isValid, firstInvalidStep, errors: allStepErrors } = validateAllSteps(formData, hasVehicle);
        if (!isValid) {
            setErrors(allStepErrors);
            setStep(firstInvalidStep);
            setIsSubmitting(false);
            if (notify?.showError) {
                notify.showError(isAm
                    ? `እባክዎ በደረጃ ${firstInvalidStep} ያሉትን የማረጋገጫ ስህተቶች ያርሙ.`
                    : `Please resolve all validation errors in Step ${firstInvalidStep} before final submission.`);
            }
            setTimeout(() => focusFirstInvalidFieldInDom(), 60);
            return;
        }

        try {
            const res = await visitorRegistrationApi.register({
                ...formData,
                draftId
            });
            if (notify?.showSuccess) {
                notify.showSuccess(isAm
                    ? 'የጎብኚ ምዝገባው በተሳካ ሁኔታ ተጠናቋል!'
                    : 'Visitor registered successfully!');
            }
            setRegisteredResult({
                ...res.data,
                fullName: res.data?.record?.clean_full_name || res.data?.record?.full_name || `${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim(),
                photoUrl: res.data?.photoUrl || res.data?.record?.photo_url || formData.photoUrl
            });
            setStep(10); // Step 10: Confirmation
            // Clear form inputs and wipe old data immediately after registration completes
            setFormData(JSON.parse(JSON.stringify(initialFormState)));
            setDraftId(`DRAFT-${Date.now()}`);
            if (onSuccess)
                onSuccess(res.data);
        } catch (err) {
            const { mappedErrors, targetStep, cleanMessage } = parseBackendFormErrors(err, {
                1: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'nationality'],
                2: ['email', 'phone', 'altPhone'],
                3: ['country', 'region', 'city', 'subCity', 'woreda', 'postalCode', 'fullAddress'],
                4: ['purposeOfVisit', 'hostEmployeeId', 'departmentId', 'organizationId', 'company'],
                5: ['emergencyContactName', 'emergencyContactPhone'],
                6: ['vehicle'],
                7: ['photoUrl'],
                8: ['identityDoc', 'documents'],
            });
            if (Object.keys(mappedErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...mappedErrors }));
            }
            if (targetStep) {
                setStep(targetStep);
            }
            setErrors((prev) => ({ ...prev, global: cleanMessage }));
            if (notify?.showError) {
                notify.showError(cleanMessage || 'Registration submission failed. Please check your inputs.');
            }
            setTimeout(() => focusFirstInvalidFieldInDom(), 60);
        } finally {
            setIsSubmitting(false);
        }
    };
    const stepsList = [
        { num: 1, title: t('wizard.personal', 'Personal'), desc: t('wizard.personalDesc', 'Enter primary visitor personal demographic details'), icon: User },
        { num: 2, title: t('wizard.contact', 'Contact'), desc: t('wizard.contactDesc', 'Primary communication channels for visit notifications & pass delivery'), icon: Mail },
        { num: 3, title: t('wizard.address', 'Address'), desc: t('wizard.addressDesc', 'Residential location details (Ethiopian address structure supported)'), icon: MapPin },
        { num: 4, title: t('wizard.visit', 'Visit'), desc: t('wizard.visitDesc', 'Select destination department, host employee, and schedule timing'), icon: Briefcase },
        { num: 5, title: t('wizard.emergency', 'Emergency'), desc: t('wizard.emergencyDesc', 'Emergency point of contact for safety & evacuation procedures'), icon: Phone },
        { num: 6, title: t('wizard.vehicle', 'Vehicle'), desc: t('wizard.vehicleDesc', 'Register transport vehicle for automated barrier gate entry & parking'), icon: Car, optional: true },
        { num: 7, title: t('wizard.photo', 'Photo'), desc: t('wizard.photoDesc', 'Live facial capture or passport photo upload for biometric security badge'), icon: Camera },
        { num: 8, title: t('wizard.documents', 'Documents'), desc: t('wizard.documentsDesc', 'Upload government-issued identification document'), icon: FileText },
        { num: 9, title: t('wizard.review', 'Review'), desc: t('wizard.reviewDesc', 'Review and verify all registration details before final submission'), icon: ClipboardCheck },
        { num: 10, title: t('wizard.confirmation', 'Confirmation'), desc: t('wizard.confirmationDesc', 'Registration complete! Digital pass and credentials generated'), icon: CheckCircle2 },
    ];
    return (<div className="bg-[#0b101d] border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-400"/>
              {t('wizard.title', 'Enterprise Visitor Registration Wizard')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => autoSaveDraft()}
            disabled={isSavingDraft || step === 10}
            className="h-9 min-h-[36px] flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-500 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-400 shadow-md hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40"
          >
            {isSavingDraft ? <RefreshCw size={14} className="animate-spin text-indigo-400 shrink-0" /> : <Save size={14} className="text-indigo-400 group-hover:text-white shrink-0" />}
            <span>{isSavingDraft ? t('wizard.savingDraft', 'Saving Draft...') : t('wizard.saveDraft', 'Save Draft')}</span>
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 min-h-[36px] flex items-center gap-1 px-3.5 rounded-xl text-xs font-semibold bg-slate-800/50 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700/50 hover:border-rose-400 hover:shadow-md hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <X size={14} className="shrink-0" />
              <span>{t('common.cancel', 'Cancel')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="p-4 bg-[#080c16] border-b border-slate-800/60 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] max-w-5xl mx-auto px-2">
          {stepsList.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (<div key={s.num} onClick={() => {
                    if (step === 10 || s.num === step) return;
                    if (s.num < step) {
                        // Navigating backward: always allowed, preserves entered data and errors
                        setStep(s.num);
                    } else {
                        // Navigating forward: validate all steps up to target step
                        for (let checkStep = 1; checkStep < s.num; checkStep++) {
                            const stepErrors = validateStepFields(checkStep, formData, hasVehicle);
                            if (Object.keys(stepErrors).length > 0) {
                                setErrors(stepErrors);
                                setStep(checkStep);
                                if (notify?.showWarning) {
                                    notify.showWarning(isAm
                                        ? `እባክዎ ወደ ቀጣይ ደረጃ ከመሄድዎ በፊት በደረጃ ${checkStep} ያሉትን ሁሉንም መስኮች ያጠናቅቁ.`
                                        : `Please complete all required fields in Step ${checkStep} before proceeding.`);
                                }
                                setTimeout(() => focusFirstInvalidFieldInDom(), 50);
                                return;
                            }
                        }
                        setStep(s.num);
                    }
                }} className={`flex flex-col items-center flex-1 cursor-pointer group transition-all ${isActive ? 'scale-105' : ''}`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold border transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/20'
                    : isCompleted
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:border-slate-700'}`}>
                  {isCompleted ? <Check size={16}/> : <Icon size={15}/>}
                </div>
                <span className={`text-[10px] mt-1.5 uppercase font-bold tracking-wider flex items-center gap-0.5 ${isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {s.title}
                  {s.optional && <span className="text-[9px] text-amber-400/80 lowercase">(opt)</span>}
                </span>
              </div>);
        })}
        </div>
      </div>

      {/* Dynamic Alerts */}
      <AnimatePresence>
        {successMessage && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="m-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0"/>
            <span>{successMessage}</span>
          </motion.div>)}
        {errors.global && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="m-4 p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 shadow-lg">
            <AlertTriangle size={18} className="text-rose-400 flex-shrink-0"/>
            <span>{errors.global}</span>
          </motion.div>)}
      </AnimatePresence>

      {/* Main Wizard Body */}
      <div className="p-6 min-h-[460px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (<motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <User size={15}/> Step 1: Personal Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Enter primary visitor personal demographic details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.firstName', 'First Name')} <span className="text-rose-400">*</span></label>
                  <input type="text" data-invalid={errors.firstName ? 'true' : undefined} aria-invalid={errors.firstName ? 'true' : undefined} value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder={t('placeholder.firstName', 'e.g. Abebe')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${errors.firstName ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}/>
                  {errors.firstName && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.firstName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.middleName', 'Middle Name')}</label>
                  <input type="text" data-invalid={errors.middleName ? 'true' : undefined} aria-invalid={errors.middleName ? 'true' : undefined} value={formData.middleName || ''} onChange={(e) => handleChange('middleName', e.target.value)} placeholder={t('placeholder.middleName', 'e.g. Kebede')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${errors.middleName ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}/>
                  {errors.middleName && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.middleName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.lastName', 'Last Name')} <span className="text-rose-400">*</span></label>
                  <input type="text" data-invalid={errors.lastName ? 'true' : undefined} aria-invalid={errors.lastName ? 'true' : undefined} value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder={t('placeholder.lastName', 'e.g. Tessema')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${errors.lastName ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}/>
                  {errors.lastName && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.lastName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.gender', 'Gender')} <span className="text-rose-400">*</span></label>
                  <select data-invalid={errors.gender ? 'true' : undefined} aria-invalid={errors.gender ? 'true' : undefined} value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.gender ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                    <option value="MALE">{t('gender.male', 'Male')}</option>
                    <option value="FEMALE">{t('gender.female', 'Female')}</option>
                    <option value="OTHER">{t('gender.other', 'Other')}</option>
                  </select>
                  {errors.gender && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.gender}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">{t('form.dateOfBirth', 'Date of Birth')} <span className="text-rose-400">*</span></label>
                    <span className="text-[10px] font-semibold text-slate-400">Min. 18 years</span>
                  </div>
                  <input type="date" max={maxAllowedDob} data-invalid={errors.dateOfBirth ? 'true' : undefined} aria-invalid={errors.dateOfBirth ? 'true' : undefined} value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.dateOfBirth ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}/>
                  {errors.dateOfBirth && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.dateOfBirth}</span>
                    </p>
                  )}
                  {formData.dateOfBirth && !errors.dateOfBirth && (() => {
                    const res = validateDateOfBirth(formData.dateOfBirth, 18);
                    return res.valid ? (
                      <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                        <span>✓ Age: {res.age} years old (Eligible, ≥ 18)</span>
                      </p>
                    ) : null;
                  })()}
                </div>

                <div>
                  <CountryNationalitySelect
                    id="wizard-nationality"
                    label={t('form.nationality', 'Nationality')}
                    value={formData.nationality}
                    phone={formData.phone ? `${formData.phonePrefix || '+251'} ${formData.phone}` : ''}
                    autoDetectFromPhone={true}
                    onChange={(e) => handleChange('nationality', e?.target?.value || e?.value || String(e || ''))}
                    error={errors.nationality}
                    placeholder={t('placeholder.searchNationality', 'Search country or nationality...')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.maritalStatus', 'Marital Status')}</label>
                  <select data-invalid={errors.maritalStatus ? 'true' : undefined} aria-invalid={errors.maritalStatus ? 'true' : undefined} value={formData.maritalStatus || 'SINGLE'} onChange={(e) => handleChange('maritalStatus', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.maritalStatus ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                    <option value="SINGLE">{t('marital.single', 'Single')}</option>
                    <option value="MARRIED">{t('marital.married', 'Married')}</option>
                    <option value="DIVORCED">{t('marital.divorced', 'Divorced')}</option>
                    <option value="WIDOWED">{t('marital.widowed', 'Widowed')}</option>
                    <option value="OTHER">{t('marital.other', 'Other')}</option>
                  </select>
                  {errors.maritalStatus && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.maritalStatus}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>)}

          {/* STEP 2: CONTACT INFORMATION */}
          {step === 2 && (<motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Mail size={15}/> Step 2: Contact Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Primary communication channels for visit notifications & pass delivery</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.email', 'Primary Email')} <span className="text-rose-400">*</span></label>
                  <input type="email" data-invalid={errors.email ? 'true' : undefined} aria-invalid={errors.email ? 'true' : undefined} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder={t('placeholder.email', 'e.g. visitor@example.com')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${errors.email ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}/>
                  {errors.email && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.altEmail', 'Alternative Email')}</label>
                  <input type="email" data-invalid={errors.altEmail ? 'true' : undefined} aria-invalid={errors.altEmail ? 'true' : undefined} value={formData.altEmail || ''} onChange={(e) => handleChange('altEmail', e.target.value)} placeholder={t('placeholder.altEmail', 'e.g. alt.visitor@example.com')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${errors.altEmail ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}/>
                  {errors.altEmail && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.altEmail}</span>
                    </p>
                  )}
                </div>

                <div>
                  <CountryPhoneInput
                    id="wizard-phone"
                    label={t('form.phone', 'Mobile Phone Number')}
                    required
                    value={formData.phone}
                    dialCode={formData.phonePrefix || '+251'}
                    onDialCodeChange={(dial) => handleChange('phonePrefix', dial)}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder={t('placeholder.phone', 'Phone number')}
                  />
                </div>

                <div>
                  <CountryPhoneInput
                    id="wizard-alt-phone"
                    label={t('form.altPhone', 'Alternative Phone')}
                    value={formData.altPhone || ''}
                    dialCode={formData.phonePrefix || '+251'}
                    onChange={(e) => handleChange('altPhone', e.target.value)}
                    error={errors.altPhone}
                    placeholder={t('placeholder.altPhone', 'Alternative phone')}
                  />
                </div>
              </div>
            </motion.div>)}

          {/* STEP 3: ADDRESS INFORMATION */}
          {step === 3 && (<motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <MapPin size={15}/> Step 3: Address Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Residential location details (Ethiopian address structure supported)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.country', 'Country')} <span className="text-rose-400">*</span></label>
                  <input type="text" data-invalid={errors.country ? 'true' : undefined} aria-invalid={errors.country ? 'true' : undefined} value={formData.country} onChange={(e) => handleChange('country', e.target.value)} placeholder={t('placeholder.country', 'Ethiopia')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.country ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.country && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.country}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.state', 'Region / State')}</label>
                  <input type="text" data-invalid={errors.region ? 'true' : undefined} aria-invalid={errors.region ? 'true' : undefined} value={formData.region || ''} onChange={(e) => handleChange('region', e.target.value)} placeholder={t('placeholder.region', 'Addis Ababa')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.region ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.region && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.region}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.city', 'City')} <span className="text-rose-400">*</span></label>
                  <input type="text" data-invalid={errors.city ? 'true' : undefined} aria-invalid={errors.city ? 'true' : undefined} value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder={t('placeholder.city', 'Addis Ababa')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.city ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.city && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.city}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.subcity', 'Sub City')}</label>
                  <input type="text" data-invalid={errors.subCity ? 'true' : undefined} aria-invalid={errors.subCity ? 'true' : undefined} value={formData.subCity || ''} onChange={(e) => handleChange('subCity', e.target.value)} placeholder={t('placeholder.subcity', 'Bole')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.subCity ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.subCity && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.subCity}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.zone', 'Zone')}</label>
                  <input type="text" data-invalid={errors.zone ? 'true' : undefined} aria-invalid={errors.zone ? 'true' : undefined} value={formData.zone || ''} onChange={(e) => handleChange('zone', e.target.value)} placeholder={t('placeholder.zone', 'Zone 01')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.zone ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.zone && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.zone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.woreda', 'Woreda')}</label>
                  <input type="text" data-invalid={errors.woreda ? 'true' : undefined} aria-invalid={errors.woreda ? 'true' : undefined} value={formData.woreda || ''} onChange={(e) => handleChange('woreda', e.target.value)} placeholder={t('placeholder.woreda', 'Woreda 03')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.woreda ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.woreda && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.woreda}</span>
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.address', 'Full Street Address')}</label>
                  <input type="text" data-invalid={errors.fullAddress ? 'true' : undefined} aria-invalid={errors.fullAddress ? 'true' : undefined} value={formData.fullAddress || ''} onChange={(e) => handleChange('fullAddress', e.target.value)} placeholder={t('placeholder.address', 'House #123, Bole Road, near Japan Embassy')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.fullAddress ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.fullAddress && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.fullAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>)}

          {/* STEP 4: VISIT INFORMATION */}
          {step === 4 && (<motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Briefcase size={15}/> Step 4: Visit Details &amp; Expectation
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Target department, host assignment, and scheduled visit window</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.visitorCategory', 'Visitor Category')}</label>
                  <select data-invalid={errors.visitorCategory ? 'true' : undefined} aria-invalid={errors.visitorCategory ? 'true' : undefined} value={formData.visitorCategory || 'Official'} onChange={(e) => handleChange('visitorCategory', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.visitorCategory ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                    <option value="Official">{t('category.official', 'Official Guest')}</option>
                    <option value="Vendor">{t('category.vendor', 'Vendor / Contractor')}</option>
                    <option value="Interview">{t('category.interview', 'Job Candidate')}</option>
                    <option value="VIP">{t('category.vip', 'VIP Delegate')}</option>
                    <option value="Personal">{t('category.personal', 'Personal Visit')}</option>
                  </select>
                  {errors.visitorCategory && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.visitorCategory}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.company', 'Company / Organization Name')}</label>
                  <input type="text" data-invalid={errors.company ? 'true' : undefined} aria-invalid={errors.company ? 'true' : undefined} value={formData.company || ''} onChange={(e) => handleChange('company', e.target.value)} placeholder={t('placeholder.company', 'e.g. Acme Corp')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.company ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.company && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.company}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.department', 'Target Department')}</label>
                  <select data-invalid={errors.departmentId ? 'true' : undefined} aria-invalid={errors.departmentId ? 'true' : undefined} value={formData.departmentId || (departments[0]?.id || 1)} onChange={(e) => handleChange('departmentId', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.departmentId ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                    {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    {departments.length === 0 && (<>
                        <option value={1}>Executive Office</option>
                        <option value={2}>Sales &amp; Marketing</option>
                        <option value={3}>Finance</option>
                        <option value={4}>Operations</option>
                      </>)}
                  </select>
                  {errors.departmentId && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.departmentId}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.assignedHost', 'Host Employee')}</label>
                  <select data-invalid={errors.hostEmployeeId ? 'true' : undefined} aria-invalid={errors.hostEmployeeId ? 'true' : undefined} value={formData.hostEmployeeId || (employees[0]?.id || 1)} onChange={(e) => handleChange('hostEmployeeId', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.hostEmployeeId ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                    {(Array.isArray(employees) ? employees : []).map((emp) => (<option key={emp.id} value={emp.id}>{emp.full_name || emp.username} ({emp.job_title || 'Staff'})</option>))}
                    {(!Array.isArray(employees) || employees.length === 0) && (<>
                        <option value={1}>Sarah Johnson (Sales Director)</option>
                        <option value={2}>Michael Chen (Account Manager)</option>
                        <option value={3}>Emily Davis (Finance Manager)</option>
                      </>)}
                  </select>
                  {errors.hostEmployeeId && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.hostEmployeeId}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.expectedArrival', 'Expected Arrival Time')}</label>
                  <input type="datetime-local" data-invalid={errors.expectedArrivalTime ? 'true' : undefined} aria-invalid={errors.expectedArrivalTime ? 'true' : undefined} value={formData.expectedArrivalTime || ''} onChange={(e) => handleChange('expectedArrivalTime', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.expectedArrivalTime ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.expectedArrivalTime && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.expectedArrivalTime}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.expectedDeparture', 'Expected Departure Time')}</label>
                  <input type="datetime-local" data-invalid={errors.expectedDepartureTime ? 'true' : undefined} aria-invalid={errors.expectedDepartureTime ? 'true' : undefined} value={formData.expectedDepartureTime || ''} onChange={(e) => handleChange('expectedDepartureTime', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.expectedDepartureTime ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.expectedDepartureTime && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.expectedDepartureTime}</span>
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.purposeOfVisit', 'Purpose of Visit')}</label>
                  <textarea rows={2} data-invalid={errors.purposeOfVisit ? 'true' : undefined} aria-invalid={errors.purposeOfVisit ? 'true' : undefined} value={formData.purposeOfVisit || ''} onChange={(e) => handleChange('purposeOfVisit', e.target.value)} placeholder={t('placeholder.purpose', 'Explain the purpose of the visit...')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.purposeOfVisit ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}></textarea>
                  {errors.purposeOfVisit && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.purposeOfVisit}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>)}

          {/* STEP 5: EMERGENCY CONTACT */}
          {step === 5 && (<motion.div key="step-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Phone size={15}/> Step 5: Emergency Contact Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Designated contact for urgent medical or safety incidents</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.emergencyContactName', 'Contact Full Name')} <span className="text-rose-400">*</span></label>
                  <input type="text" data-invalid={errors.emergencyContactName ? 'true' : undefined} aria-invalid={errors.emergencyContactName ? 'true' : undefined} value={formData.emergencyContact?.contactName || formData.emergencyContactName || ''} onChange={(e) => {
                handleChange('emergencyContactName', e.target.value);
                handleNestedChange('emergencyContact', 'contactName', e.target.value);
            }} placeholder={t('placeholder.fullName', 'e.g. Almaz Kebede')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.emergencyContactName ? 'border-2 border-rose-500 bg-rose-950/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.emergencyContactName && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.emergencyContactName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.relationship', 'Relationship')} <span className="text-rose-400">*</span></label>
                  <select value={formData.emergencyContact?.relationship || 'Spouse'} onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)} className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-all">
                    <option value="Spouse">{t('relation.spouse', 'Spouse')}</option>
                    <option value="Parent">{t('relation.parent', 'Parent')}</option>
                    <option value="Sibling">{t('relation.sibling', 'Sibling')}</option>
                    <option value="Colleague">{t('relation.colleague', 'Colleague / Manager')}</option>
                    <option value="Relative">{t('relation.relative', 'Relative')}</option>
                    <option value="Other">{t('relation.other', 'Other')}</option>
                  </select>
                </div>

                <div>
                  <CountryPhoneInput
                    id="wizard-emergency-phone"
                    label={t('form.emergencyContactPhone', 'Emergency Telephone Number')}
                    required
                    value={formData.emergencyContact?.phone || formData.emergencyContactPhone || ''}
                    dialCode={formData.phonePrefix || '+251'}
                    onChange={(e) => {
                      handleChange('emergencyContactPhone', e.target.value);
                      handleNestedChange('emergencyContact', 'phone', e.target.value);
                    }}
                    error={errors.emergencyContactPhone}
                    placeholder={t('placeholder.phone', 'Phone number')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.emergencyEmail', 'Emergency Email')}</label>
                  <input type="email" data-invalid={errors.emergencyEmail ? 'true' : undefined} aria-invalid={errors.emergencyEmail ? 'true' : undefined} value={formData.emergencyContact?.email || ''} onChange={(e) => handleNestedChange('emergencyContact', 'email', e.target.value)} placeholder={t('placeholder.email', 'e.g. emergency@example.com')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.emergencyEmail ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {errors.emergencyEmail && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.emergencyEmail}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>)}

          {/* STEP 6: VEHICLE INFORMATION (EXPLICITLY OPTIONAL) */}
          {step === 6 && (<motion.div key="step-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <Car size={15}/> Step 6: Vehicle &amp; Parking Information
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold tracking-wider">
                      (Optional)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill only if visitor is arriving by personal or corporate vehicle</p>
                </div>

                {/* Option Toggle */}
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <button type="button" onClick={() => setHasVehicle(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${!hasVehicle
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                    🚶 Pedestrian / No Vehicle
                  </button>
                  <button type="button" onClick={() => setHasVehicle(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${hasVehicle
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                    🚗 Arriving with Vehicle
                  </button>
                </div>
              </div>

              {!hasVehicle ? (<div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
                    <Car size={24}/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">No Vehicle Entry Required</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Visitor is arriving on foot, by public transport, or taxi. You can skip this step directly.
                    </p>
                  </div>
                  <button type="button" onClick={handleNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 transition-all duration-200">
                    Continue to Photo Step <ArrowRight size={14}/>
                  </button>
                </div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.vehicleNumber', 'License Plate Number')}</label>
                    <input type="text" data-invalid={errors.licensePlate || errors.plate_number ? 'true' : undefined} aria-invalid={errors.licensePlate || errors.plate_number ? 'true' : undefined} value={formData.vehicle?.licensePlate || ''} onChange={(e) => handleNestedChange('vehicle', 'licensePlate', e.target.value.toUpperCase())} placeholder="e.g. AA 3 B 12345" className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.licensePlate || errors.plate_number ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                    {(errors.licensePlate || errors.plate_number) && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{errors.licensePlate || errors.plate_number}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.vehicleCategory', 'Vehicle Category')}</label>
                    <select data-invalid={errors.vehicleType || errors.vehicle_type ? 'true' : undefined} aria-invalid={errors.vehicleType || errors.vehicle_type ? 'true' : undefined} value={formData.vehicle?.vehicleType || 'Car'} onChange={(e) => handleNestedChange('vehicle', 'vehicleType', e.target.value)} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.vehicleType || errors.vehicle_type ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                      <option value="Car">{t('vehicle.car', 'Passenger Car / Sedan')}</option>
                      <option value="SUV">{t('vehicle.suv', 'SUV / 4WD')}</option>
                      <option value="Motorcycle">{t('vehicle.motorcycle', 'Motorcycle')}</option>
                      <option value="Truck">{t('vehicle.truck', 'Delivery Truck')}</option>
                      <option value="Van">{t('vehicle.van', 'Van / Bus')}</option>
                    </select>
                    {(errors.vehicleType || errors.vehicle_type) && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{errors.vehicleType || errors.vehicle_type}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.vehicleBrand', 'Brand / Make')}</label>
                    <input type="text" data-invalid={errors.brand ? 'true' : undefined} aria-invalid={errors.brand ? 'true' : undefined} value={formData.vehicle?.brand || ''} onChange={(e) => handleNestedChange('vehicle', 'brand', e.target.value)} placeholder={t('placeholder.brand', 'e.g. Toyota')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.brand ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                    {errors.brand && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{errors.brand}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.vehicleModel', 'Model')}</label>
                    <input type="text" data-invalid={errors.model ? 'true' : undefined} aria-invalid={errors.model ? 'true' : undefined} value={formData.vehicle?.model || ''} onChange={(e) => handleNestedChange('vehicle', 'model', e.target.value)} placeholder={t('placeholder.model', 'e.g. Vitz / Land Cruiser')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.model ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                    {errors.model && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{errors.model}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.vehicleColor', 'Color')}</label>
                    <input type="text" data-invalid={errors.color ? 'true' : undefined} aria-invalid={errors.color ? 'true' : undefined} value={formData.vehicle?.color || ''} onChange={(e) => handleNestedChange('vehicle', 'color', e.target.value)} placeholder={t('placeholder.color', 'e.g. Silver Metallic')} className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-all ${errors.color ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                    {errors.color && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{errors.color}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center mt-6">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={formData.vehicle?.parkingRequired || false} onChange={(e) => handleNestedChange('vehicle', 'parkingRequired', e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"/>
                      <span>{t('form.requireParking', 'Require Dedicated Parking Slot')}</span>
                    </label>
                  </div>
                </div>)}
            </motion.div>)}

          {/* STEP 7: VISITOR PHOTO (DRAG AND DROP SUPPORTED) */}
          {step === 7 && (<motion.div key="step-7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Camera size={15}/> Step 7: Visitor Photograph Capture &amp; Drag &amp; Drop Upload
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload photo via drag &amp; drop file browser or capture live via webcam</p>
              </div>

              {/* Hidden File Input */}
              <input type="file" ref={photoInputRef} accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                    processPhotoFile(e.target.files[0]);
                }
            }}/>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Drag & Drop Zone */}
                <div onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }} onDragLeave={() => setIsDraggingPhoto(false)} onDrop={handlePhotoDrop} onClick={() => photoInputRef.current?.click()} className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isDraggingPhoto
                ? 'border-indigo-400 bg-indigo-500/10 scale-102 ring-4 ring-indigo-500/20'
                : errors.photoUrl ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-700 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900'}`}>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                    <UploadCloud size={28}/>
                  </div>
                  <p className="text-sm font-bold text-slate-200">Drag &amp; Drop Photo Here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse image file from computer</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 uppercase">PNG, JPG, WEBP • Max 5MB</span>
                </div>

                {/* Photo Preview & Options */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-40 h-40 rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden relative shadow-xl flex items-center justify-center">
                    {formData.photoUrl ? (<img src={formData.photoUrl} alt="Visitor" className="w-full h-full object-cover"/>) : (<div className="text-slate-600 p-4">
                        <Camera size={40} className="mx-auto mb-2 opacity-50"/>
                        <span className="text-[11px] font-medium block">No Photo Selected</span>
                      </div>)}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-200">
                      <UploadCloud size={14} className="inline me-1.5"/> {t('btn.upload', 'Upload File')}
                    </button>
                    <button type="button" onClick={() => {
                const mockUrl = `/uploads/photos/visitor_${Date.now()}.png`;
                handleChange('photoUrl', mockUrl);
            }} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-400 text-xs font-semibold hover:scale-105 active:scale-95 transition-all duration-200">
                      <Camera size={14} className="inline me-1.5 text-indigo-400 group-hover:text-white"/> {t('btn.webcam', 'Webcam Capture')}
                    </button>
                    {formData.photoUrl && (<button type="button" onClick={() => handleChange('photoUrl', '')} className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 hover:border-rose-400 text-xs font-semibold hover:scale-105 active:scale-95 transition-all duration-200">
                        <Trash2 size={14}/>
                      </button>)}
                  </div>

                  {errors.photoUrl && (
                    <p className="text-[11px] text-rose-400 mt-2 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.photoUrl}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>)}

          {/* STEP 8: SUPPORTING DOCUMENTS (DRAG AND DROP SUPPORTED) */}
          {step === 8 && (<motion.div key="step-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <FileText size={15}/> Step 8: Supporting Document Attachments (Drag &amp; Drop)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Attach National ID scans, Passports, Invitation letters, or NDA forms</p>
              </div>

              {/* Identity Document Verification Sub-form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.docType', 'Document / ID Type')} <span className="text-rose-400">*</span></label>
                  <select data-invalid={errors.documentType || errors.id_type ? 'true' : undefined} aria-invalid={errors.documentType || errors.id_type ? 'true' : undefined} value={formData.identityDoc?.documentType || formData.idType || 'National ID'} onChange={(e) => {
                    handleNestedChange('identityDoc', 'documentType', e.target.value);
                    handleChange('idType', e.target.value);
                  }} className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none transition-all ${errors.documentType || errors.id_type ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}>
                    <option value="National ID">National ID / Kebele ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver License">Driver's License</option>
                    <option value="Employee Badge">Corporate / Employee ID</option>
                    <option value="Student ID">Student ID</option>
                    <option value="Other">Other Government ID</option>
                  </select>
                  {(errors.documentType || errors.id_type) && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.documentType || errors.id_type}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.docNumber', 'Document / ID Number')}</label>
                  <input type="text" data-invalid={errors.documentNumber || errors.id_number ? 'true' : undefined} aria-invalid={errors.documentNumber || errors.id_number ? 'true' : undefined} value={formData.identityDoc?.documentNumber || formData.idNumber || ''} onChange={(e) => {
                    handleNestedChange('identityDoc', 'documentNumber', e.target.value);
                    handleChange('idNumber', e.target.value);
                  }} placeholder="e.g. ET-ID-9921448" className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none transition-all ${errors.documentNumber || errors.id_number ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {(errors.documentNumber || errors.id_number) && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.documentNumber || errors.id_number}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.expiryDate', 'Document Expiry Date')}</label>
                  <input type="date" data-invalid={errors.expiryDate || errors.expiry_date ? 'true' : undefined} aria-invalid={errors.expiryDate || errors.expiry_date ? 'true' : undefined} value={formData.identityDoc?.expiryDate || ''} onChange={(e) => handleNestedChange('identityDoc', 'expiryDate', e.target.value)} className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none transition-all ${errors.expiryDate || errors.expiry_date ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-indigo-500'}`}/>
                  {(errors.expiryDate || errors.expiry_date) && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{errors.expiryDate || errors.expiry_date}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Hidden File Input */}
              <input type="file" ref={docInputRef} multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                    processDocumentFiles(e.target.files);
                }
            }}/>

              {/* Drag & Drop Zone */}
              <div onDragOver={(e) => { e.preventDefault(); setIsDraggingDoc(true); }} onDragLeave={() => setIsDraggingDoc(false)} onDrop={handleDocDrop} onClick={() => docInputRef.current?.click()} className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isDraggingDoc
                ? 'border-indigo-400 bg-indigo-500/10 scale-102 ring-4 ring-indigo-500/20'
                : errors.documents ? 'border-2 border-rose-500 bg-rose-950/20' : 'border-slate-700 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900'}`}>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <UploadCloud size={28}/>
                </div>
                <p className="text-sm font-bold text-slate-200">Drag &amp; Drop Document Files Here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse files from your computer</p>
                <span className="text-[10px] text-slate-500 font-mono mt-2 uppercase">PDF, PNG, JPG, DOCX • Max 15MB each</span>
              </div>

              {errors.documents && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold" role="alert">
                  <AlertCircle size={12} className="flex-shrink-0" />
                  <span>{errors.documents}</span>
                </p>
              )}

              {/* Uploaded Documents List */}
              <div className="space-y-2 mt-4">
                {(formData.documents || []).map((doc, idx) => (<div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                        <FileText size={18}/>
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{doc.fileName || doc.documentType}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {doc.documentType} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : '500 KB'}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => {
                    setFormData(prev => ({
                        ...prev,
                        documents: (prev.documents || []).filter((_, i) => i !== idx)
                    }));
                }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 hover:scale-110 transition-all duration-200">
                      <Trash2 size={16}/>
                    </button>
                  </div>))}
                {(!formData.documents || formData.documents.length === 0) && (<p className="text-center text-xs text-slate-500 py-3">No documents attached yet. Drag &amp; drop files above.</p>)}
              </div>
            </motion.div>)}

          {/* STEP 9: REGISTRATION REVIEW */}
          {step === 9 && (<motion.div key="step-9" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <ClipboardCheck size={15}/> Step 9: Registration Summary Review
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Carefully verify all master record details prior to final DB submission</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>Personal Details</span>
                    <button onClick={() => setStep(1)} className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400 text-[11px] font-semibold hover:scale-105 transition-all duration-200">{t('btn.edit', 'Edit')}</button>
                  </div>
                  <div><span className="text-slate-400">Full Name:</span> <strong className="text-white">{formData.firstName} {formData.middleName} {formData.lastName}</strong></div>
                  <div><span className="text-slate-400">Gender &amp; DOB:</span> {formData.gender} • {formData.dateOfBirth}</div>
                  <div><span className="text-slate-400">Nationality:</span> {formData.nationality} • {formData.maritalStatus}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>Contact &amp; Address</span>
                    <button onClick={() => setStep(2)} className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400 text-[11px] font-semibold hover:scale-105 transition-all duration-200">{t('btn.edit', 'Edit')}</button>
                  </div>
                  <div><span className="text-slate-400">Email:</span> <strong className="text-slate-200">{formData.email}</strong></div>
                  <div><span className="text-slate-400">Mobile Phone:</span> <strong className="text-slate-200">{formData.phone}</strong></div>
                  <div><span className="text-slate-400">City/Country:</span> {formData.city}, {formData.country} ({formData.subCity || 'N/A'})</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>Emergency Contact</span>
                    <button onClick={() => setStep(5)} className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400 text-[11px] font-semibold hover:scale-105 transition-all duration-200">{t('btn.edit', 'Edit')}</button>
                  </div>
                  <div><span className="text-slate-400">Emergency Contact:</span> {formData.emergencyContactName || formData.emergencyContact?.contactName} ({formData.emergencyContactPhone || formData.emergencyContact?.phone})</div>
                  <div><span className="text-slate-400">Relationship:</span> {formData.emergencyContact?.relationship || 'Relative'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>Visit Expectation &amp; Vehicle</span>
                    <button onClick={() => setStep(4)} className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400 text-[11px] font-semibold hover:scale-105 transition-all duration-200">{t('btn.edit', 'Edit')}</button>
                  </div>
                  <div><span className="text-slate-400">Category &amp; Purpose:</span> {formData.visitorCategory} • {formData.purposeOfVisit}</div>
                  <div><span className="text-slate-400">Vehicle Plate:</span> {formData.vehicle?.licensePlate || 'Pedestrian / No Vehicle'}</div>
                </div>
              </div>
            </motion.div>)}

          {/* STEP 10: REGISTRATION CONFIRMATION */}
          {step === 10 && registeredResult && (<motion.div key="step-10" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center py-6 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-4xl shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 size={42}/>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Visitor Master Record Created Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The visitor profile has been permanently saved to the MySQL database.
                </p>
              </div>

              {/* Master Confirmation Card with Visitor Photo Display */}
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4 font-mono text-xs shadow-xl">
                {/* Visitor Photo Frame on Card */}
                <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-800">
                  <div className="relative group">
                    {(registeredResult.photoUrl || registeredResult.record?.photo_url) ? (<img src={registeredResult.photoUrl || registeredResult.record?.photo_url} alt="Visitor Portrait" className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10"/>) : (<div className="w-28 h-28 rounded-2xl bg-indigo-950/40 border-2 border-indigo-500/40 flex flex-col items-center justify-center text-indigo-400 shadow-xl ring-4 ring-indigo-500/10">
                        <User size={48} className="text-indigo-400 mb-1"/>
                        <span className="text-[10px] font-sans font-semibold text-slate-400">Visitor Photo</span>
                      </div>)}
                    <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900">
                      <CheckCircle2 size={16}/>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Visitor ID:</span>
                  <span className="font-bold text-indigo-300 text-sm">{registeredResult.visitorCode}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Reference Number:</span>
                  <span className="font-bold text-emerald-400 text-sm">{registeredResult.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Visitor Full Name:</span>
                  <span className="text-slate-200 font-semibold">{registeredResult.fullName || registeredResult.record?.clean_full_name || registeredResult.record?.full_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Registration Date:</span>
                  <span className="text-slate-300">{new Date(registeredResult.registrationDate || Date.now()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase text-[10px]">
                    APPROVED MASTER RECORD
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button type="button" onClick={() => {
                navigator.clipboard.writeText(registeredResult.visitorCode);
                setCopiedField('id');
                setTimeout(() => setCopiedField(null), 2000);
            }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 shadow-md hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200">
                  {copiedField === 'id' ? <Check size={14}/> : <Copy size={14}/>} {copiedField === 'id' ? 'Copied ID!' : t('btn.copyId', 'Copy Visitor ID')}
                </button>
                <button type="button" onClick={() => {
                navigator.clipboard.writeText(registeredResult.referenceNumber);
                setCopiedField('ref');
                setTimeout(() => setCopiedField(null), 2000);
            }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400 shadow-md hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200">
                  {copiedField === 'ref' ? <Check size={14}/> : <Copy size={14}/>} {copiedField === 'ref' ? 'Copied Ref!' : t('btn.copyRef', 'Copy Ref Number')}
                </button>
                <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-400 shadow-md hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200">
                  <Printer size={14}/> {t('btn.print', 'Print Confirmation')}
                </button>
                <button type="button" onClick={() => {
                setStep(1);
                setFormData(initialFormState);
                setRegisteredResult(null);
                setDraftId(`DRAFT-${Date.now()}`);
            }} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-purple-600 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-200">
                  <Plus size={14}/> {t('btn.registerAnother', 'Register Another Visitor')}
                </button>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Footer Navigation Controls */}
      {step < 10 && (
        <div className="bg-slate-900/90 border-t border-slate-800/80 p-4 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="h-10 min-h-[40px] flex items-center gap-1.5 px-5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-gradient-to-r hover:from-indigo-700 hover:to-indigo-500 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-400 shadow-md hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:scale-100"
          >
            <ChevronLeft size={16} className="shrink-0" />
            <span>{t('form.previousStep', 'Previous Step')}</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            {step === 6 && !hasVehicle && (
              <button
                type="button"
                onClick={handleNext}
                className="h-10 min-h-[40px] flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold bg-amber-600/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 shadow-md hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <span>{t('wizard.skipVehicle', 'Skip Vehicle Details')}</span>
                <ChevronRight size={16} className="shrink-0" />
              </button>
            )}

            {step < 9 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={isValidating}
                className="h-10 min-h-[40px] flex items-center gap-1.5 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:via-indigo-500 hover:to-blue-600 text-white border border-indigo-400/40 hover:border-purple-300 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isValidating ? <RefreshCw size={15} className="animate-spin shrink-0" /> : null}
                <span>{isValidating ? 'Validating...' : t('form.nextStep', 'Next Step')}</span>
                {!isValidating && <ChevronRight size={16} className="shrink-0" />}
              </button>
            )}

            {step === 9 && (
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting}
                className="h-10 min-h-[40px] flex items-center gap-1.5 px-6 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-600/40 hover:shadow-emerald-500/70 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin shrink-0" />
                    <span>{t('wizard.submitting', 'Submitting Record...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{t('wizard.submitAndGeneratePass', 'Submit Master Registration Record')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>);
};
export default RegistrationWizard;
