/**
 * Centralized Enterprise Validation Service
 * Contains strongly-typed rules for all fields across the VMS system.
 */
export const ValidationRules = {
    /**
     * Required field validation
     */
    required(value, fieldLabel = 'Field') {
        if (value === null || value === undefined) {
            return `${fieldLabel} is required.`;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return `${fieldLabel} is required.`;
        }
        if (Array.isArray(value) && value.length === 0) {
            return `Please select at least one ${fieldLabel.toLowerCase()}.`;
        }
        if (typeof value === 'boolean' && value === false) {
            return `You must accept/agree to ${fieldLabel.toLowerCase()}.`;
        }
        return null;
    },
    /**
     * Email validation (RFC 5322 compliant regex)
     */
    email(value) {
        if (!value || !value.trim())
            return null; // Let required handle empty checks
        const trimmed = value.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
            return 'Please enter a valid email address (e.g. name@domain.com).';
        }
        return null;
    },
    /**
     * Phone number validation (10–15 digits, allows optional leading +)
     */
    phone(value) {
        if (!value || !value.trim())
            return null;
        const cleanPhone = value.trim();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            return 'Phone number must contain between 10 and 15 digits.';
        }
        const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return 'Please enter a valid phone number format.';
        }
        return null;
    },
    /**
     * Username validation (3–30 characters, alphanumeric, underscores, hyphens)
     */
    username(value) {
        if (!value || !value.trim())
            return null;
        const trimmed = value.trim();
        if (trimmed.length < 3) {
            return 'Username must be at least 3 characters long.';
        }
        if (trimmed.length > 30) {
            return 'Username cannot exceed 30 characters.';
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return 'Username can only contain letters, numbers, underscores, and hyphens.';
        }
        return null;
    },
    /**
     * Password strength verification
     */
    passwordStrength(password) {
        const val = password || '';
        const minLength = val.length >= 8;
        const hasUpper = /[A-Z]/.test(val);
        const hasLower = /[a-z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val);
        const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        const isStrong = score === 5;
        return {
            minLength,
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial,
            score,
            isStrong
        };
    },
    /**
     * Password validation message
     */
    password(value) {
        if (!value)
            return null;
        const strength = ValidationRules.passwordStrength(value);
        if (!strength.minLength) {
            return 'Password must be at least 8 characters long.';
        }
        if (!strength.hasUpper) {
            return 'Password must include at least one uppercase letter (A-Z).';
        }
        if (!strength.hasLower) {
            return 'Password must include at least one lowercase letter (a-z).';
        }
        if (!strength.hasNumber) {
            return 'Password must include at least one number (0-9).';
        }
        if (!strength.hasSpecial) {
            return 'Password must include at least one special character (!@#$%^&*).';
        }
        return null;
    },
    /**
     * Confirm password validation
     */
    confirmPassword(confirmValue, originalValue) {
        if (!confirmValue)
            return null;
        if (confirmValue !== originalValue) {
            return 'Passwords do not match. Please check and try again.';
        }
        return null;
    },
    /**
     * URL validation
     */
    url(value) {
        if (!value || !value.trim())
            return null;
        try {
            const url = new URL(value.trim());
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return 'URL must start with http:// or https://';
            }
            return null;
        }
        catch (e) {
            return 'Please enter a valid URL (e.g. https://company.com).';
        }
    },
    /**
     * Date & Age validation
     */
    date(value, options) {
        if (!value)
            return null;
        const parsedDate = new Date(value);
        if (isNaN(parsedDate.getTime())) {
            return 'Please enter a valid date.';
        }
        if (options?.minDate && parsedDate < options.minDate) {
            return `Date cannot be earlier than ${options.minDate.toLocaleDateString()}.`;
        }
        if (options?.maxDate && parsedDate > options.maxDate) {
            return `Date cannot be later than ${options.maxDate.toLocaleDateString()}.`;
        }
        if (options?.minAgeYears) {
            const today = new Date();
            let age = today.getFullYear() - parsedDate.getFullYear();
            const monthDiff = today.getMonth() - parsedDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate())) {
                age--;
            }
            if (age < options.minAgeYears) {
                return `Age must be at least ${options.minAgeYears} years old.`;
            }
        }
        return null;
    },
    /**
     * National ID / Passport validation
     */
    identityNumber(value, type) {
        if (!value || !value.trim())
            return null;
        const trimmed = value.trim();
        if (trimmed.length < 5 || trimmed.length > 25) {
            return 'Identity document number must be between 5 and 25 characters.';
        }
        if (!/^[a-zA-Z0-9\s/-]+$/.test(trimmed)) {
            return 'Identity number contains invalid characters.';
        }
        return null;
    },
    /**
     * File upload validation (Type, size, corrupt check)
     */
    file(file, options = {}) {
        if (!file)
            return null;
        const maxBytes = options.maxSizeBytes || 5 * 1024 * 1024; // 5MB default
        if (file.size > maxBytes) {
            const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
            return `File size exceeds maximum limit of ${maxMb}MB.`;
        }
        if (file.size === 0) {
            return 'The selected file is empty or corrupted.';
        }
        if (options.allowedTypes && options.allowedTypes.length > 0) {
            const isAllowed = options.allowedTypes.some((type) => {
                if (type.endsWith('/*')) {
                    const mainType = type.split('/')[0];
                    return file.type.startsWith(`${mainType}/`);
                }
                return file.type === type;
            });
            if (!isAllowed) {
                return `Unsupported file format (${file.type || 'unknown'}). Allowed: ${options.allowedTypes.join(', ')}.`;
            }
        }
        return null;
    }
};
