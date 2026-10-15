import { validatePhoneNumber } from '../data/countriesData';

/**
 * Enterprise Form Validation Engine — Reusable Field Validators
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized, production-grade field validation functions for all VMS forms.
 * Returns null if valid, or a descriptive user-friendly error message if invalid.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;
export const CODE_REGEX = /^[a-zA-Z0-9_-]{2,30}$/;
/**
 * Required text field validator.
 */
export function required(label = 'This field') {
    return (value) => {
        if (value === undefined || value === null) {
            return `${label} is required.`;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return `${label} is required.`;
        }
        if (Array.isArray(value) && value.length === 0) {
            return `${label} is required.`;
        }
        return null;
    };
}
/**
 * Email format validator.
 */
export function email(label = 'Email address') {
    return (value) => {
        if (!value || typeof value !== 'string' || value.trim() === '')
            return null;
        if (!EMAIL_REGEX.test(value.trim())) {
            return `Enter a valid email address.`;
        }
        return null;
    };
}

/**
 * Phone number format validator.
 */
export function phone(label = 'Phone number', defaultDialCode = '+251') {
    return (value) => {
        if (!value || typeof value !== 'string' || value.trim() === '')
            return null;
        const res = validatePhoneNumber(value.trim(), defaultDialCode);
        if (!res.valid) {
            return res.error;
        }
        return null;
    };
}
/**
 * Username format validator.
 */
export function username(label = 'Username') {
    return (value) => {
        if (!value || typeof value !== 'string' || value.trim() === '')
            return null;
        if (!USERNAME_REGEX.test(value.trim())) {
            return `${label} must be 3-30 characters (letters, numbers, underscores, hyphens).`;
        }
        return null;
    };
}
/**
 * Code / Identifier format validator (Organization code, Branch code, Role code, etc.).
 */
export function code(label = 'Code') {
    return (value) => {
        if (!value || typeof value !== 'string' || value.trim() === '')
            return null;
        if (!CODE_REGEX.test(value.trim())) {
            return `${label} must contain only letters, numbers, hyphens or underscores.`;
        }
        return null;
    };
}
/**
 * Password strength validator.
 */
export function passwordStrength(label = 'Password') {
    return (value) => {
        if (!value || typeof value !== 'string')
            return null;
        if (value.length < 8) {
            return `${label} must contain at least 8 characters.`;
        }
        if (!/[A-Z]/.test(value)) {
            return `${label} must contain at least one uppercase letter.`;
        }
        if (!/[a-z]/.test(value)) {
            return `${label} must contain at least one lowercase letter.`;
        }
        if (!/[0-9]/.test(value)) {
            return `${label} must contain at least one number.`;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return `${label} must contain at least one special character.`;
        }
        return null;
    };
}
/**
 * Password confirmation matching validator.
 */
export function confirmPassword(passwordFieldName = 'password', label = 'Confirm password') {
    return (value, allValues) => {
        if (!value || typeof value !== 'string')
            return null;
        const targetVal = allValues ? allValues[passwordFieldName] : '';
        if (value !== targetVal) {
            return `${label} does not match password.`;
        }
        return null;
    };
}
/**
 * Minimum string length validator.
 */
export function minLength(min, label = 'This field') {
    return (value) => {
        if (!value || typeof value !== 'string')
            return null;
        if (value.trim().length < min) {
            return `${label} must be at least ${min} characters.`;
        }
        return null;
    };
}
/**
 * Maximum string length validator.
 */
export function maxLength(max, label = 'This field') {
    return (value) => {
        if (!value || typeof value !== 'string')
            return null;
        if (value.length > max) {
            return `${label} cannot exceed ${max} characters.`;
        }
        return null;
    };
}
/**
 * Date of Birth validator (cannot be in the future, must be at least minAge years old, default 18).
 */
export function dateOfBirth(label = 'Date of birth', minAge = 18) {
    return (value) => {
        if (!value)
            return null;
        const d = new Date(value);
        if (isNaN(d.getTime())) {
            return `Enter a valid date.`;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d > today) {
            return `${label} cannot be in the future.`;
        }
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
            age--;
        }
        if (minAge && age < minAge) {
            return `${label} must indicate an age of at least ${minAge} years (currently ${age} ${age === 1 ? 'year' : 'years'}).`;
        }
        const minAgeDate = new Date();
        minAgeDate.setFullYear(today.getFullYear() - 120);
        if (d < minAgeDate) {
            return `Enter a valid ${label.toLowerCase()}.`;
        }
        return null;
    };
}
/**
 * Future date validator (Appointment date, Start date, Expiration date).
 */
export function futureDate(label = 'Date') {
    return (value) => {
        if (!value)
            return null;
        const d = new Date(value);
        if (isNaN(d.getTime())) {
            return `Enter a valid date.`;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) {
            return `${label} cannot be in the past.`;
        }
        return null;
    };
}
/**
 * Date range validator (End date must be after Start date).
 */
export function dateRange(startFieldName, label = 'End date') {
    return (value, allValues) => {
        if (!value)
            return null;
        const startVal = allValues ? allValues[startFieldName] : null;
        if (!startVal)
            return null;
        const startDate = new Date(startVal);
        const endDate = new Date(value);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
            return null;
        if (endDate <= startDate) {
            return `${label} must be after start date.`;
        }
        return null;
    };
}
/**
 * Dropdown selection required validator.
 */
export function selectRequired(label = 'This field') {
    return (value) => {
        if (value === undefined ||
            value === null ||
            value === '' ||
            value === '0' ||
            value === 0 ||
            (typeof value === 'string' && value.trim() === '')) {
            return `Please select ${label.toLowerCase().startsWith('a ') || label.toLowerCase().startsWith('an ') ? label.toLowerCase() : `a ${label.toLowerCase()}`}.`;
        }
        return null;
    };
}
/**
 * Radio selection required validator.
 */
export function radioRequired(label = 'An option') {
    return (value) => {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            return `Please select ${label.toLowerCase()}.`;
        }
        return null;
    };
}
/**
 * Checkbox agreement required validator.
 */
export function checkboxRequired(label = 'terms') {
    return (value) => {
        if (!value) {
            return `You must accept the ${label.toLowerCase()} to proceed.`;
        }
        return null;
    };
}
/**
 * File upload validation (Required, size limit, allowed MIME types).
 */
export function fileRequired(label = 'File', maxMb = 5, allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) {
    return (value) => {
        if (!value) {
            return `${label} is required.`;
        }
        if (value instanceof File) {
            const maxBytes = maxMb * 1024 * 1024;
            if (value.size > maxBytes) {
                return `${label} file size cannot exceed ${maxMb} MB.`;
            }
            if (allowedMimes.length > 0 && !allowedMimes.includes(value.type)) {
                return `Unsupported file format. Please upload ${allowedMimes.map((m) => m.split('/')[1].toUpperCase()).join(', ')}.`;
            }
        }
        return null;
    };
}
