import { validateDateOfBirth as countryValidateDob, validatePhoneNumber as countryValidatePhone } from '../data/countriesData';

/**
 * Universal Multi-Step Form Validation Rules & Engine
 * Enforces rigorous field validation, length limits, character restrictions,
 * conditional field logic, and file validation.
 */

// Name character pattern: allows Latin letters, Ge'ez / Amharic letters (\u1200-\u137F), hyphens, apostrophes, and spaces.
export const NAME_REGEX = /^[a-zA-Z\u1200-\u137F\s'.-]+$/;

// Standard strict email pattern
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// License plate pattern: alphanumeric characters, spaces, and hyphens (min 3 chars)
export const PLATE_REGEX = /^[a-zA-Z0-9\s\-_/]{3,20}$/;

// Document ID number: alphanumeric, hyphens, slashes (min 3 chars)
export const DOC_NUM_REGEX = /^[a-zA-Z0-9\s\-_/]{3,30}$/;

/**
 * Validate First Name or Last Name
 */
export function validateName(value, fieldLabel = 'First name', isRequired = true, isAm = false) {
    const val = (value || '').trim();
    if (!val) {
        if (!isRequired) return null;
        return isAm ? `${fieldLabel} ያስፈልጋል.` : `${fieldLabel} is required.`;
    }
    if (val.length < 2) {
        return isAm 
            ? `${fieldLabel} ቢያንስ 2 ፊደላት መሆን አለበት.` 
            : `${fieldLabel} must be at least 2 characters.`;
    }
    if (val.length > 50) {
        return isAm 
            ? `${fieldLabel} ከ 50 ፊደላት መብለጥ የለበትም.` 
            : `${fieldLabel} cannot exceed 50 characters.`;
    }
    if (!NAME_REGEX.test(val)) {
        return isAm 
            ? `${fieldLabel} ትክክለኛ ፊደላት ብቻ መያዝ አለበት.` 
            : `${fieldLabel} can only contain letters, spaces, hyphens, and apostrophes.`;
    }
    return null;
}

/**
 * Validate Middle Name (Optional by default, but validated if entered)
 */
export function validateMiddleName(value, isRequired = false, isAm = false) {
    const val = (value || '').trim();
    if (!val) {
        if (isRequired) {
            return isAm ? 'የአባት ስም ያስፈልጋል.' : 'Middle name is required.';
        }
        return null;
    }
    if (val.length > 50) {
        return isAm ? 'የአባት ስም ከ 50 ፊደላት መብለጥ የለበትም.' : 'Middle name cannot exceed 50 characters.';
    }
    if (!NAME_REGEX.test(val)) {
        return isAm 
            ? 'የአባት ስም ትክክለኛ ፊደላት ብቻ መያዝ አለበት.' 
            : 'Middle name can only contain letters, spaces, hyphens, and apostrophes.';
    }
    return null;
}

/**
 * Validate Gender
 */
export function validateGender(value, isAm = false) {
    if (!value || !value.toString().trim()) {
        return isAm ? 'እባክዎ ጾታ ይምረጡ.' : 'Please select gender.';
    }
    const normalized = value.toString().trim().toLowerCase();
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(normalized)) {
        return isAm ? 'ትክክለኛ ጾታ ይምረጡ.' : 'Please select a valid gender option.';
    }
    return null;
}

/**
 * Validate Date of Birth (Not in future, minimum 18 years old, maximum 120 years)
 */
export function validateDateOfBirth(value, minAge = 18, isAm = false) {
    if (!value || !value.toString().trim()) {
        return isAm ? 'የትውልድ ቀን ያስፈልጋል.' : 'Date of birth is required.';
    }
    const dobString = value.toString().trim();
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
        return isAm ? 'ትክክለኛ የትውልድ ቀን ያስገቡ.' : 'Please enter a valid date of birth.';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dob > today) {
        return isAm ? 'የትውልድ ቀን ወደፊት መሆን አይችልም.' : 'Date of birth cannot be in the future.';
    }

    const res = countryValidateDob(dobString, minAge);
    if (!res.valid) {
        if (res.age !== undefined && res.age < minAge) {
            return isAm ? `ዕድሜ ቢያንስ ${minAge} ዓመት መሆን አለበት.` : `You must be at least ${minAge} years old.`;
        }
        return res.error || (isAm ? 'ትክክለኛ የትውልድ ቀን ያስገቡ.' : 'Please enter a valid date of birth.');
    }
    return null;
}

/**
 * Validate Nationality
 */
export function validateNationality(value, isAm = false) {
    if (!value || !value.toString().trim()) {
        return isAm ? 'እባክዎ ዜግነት ይምረጡ.' : 'Please select your nationality.';
    }
    return null;
}

/**
 * Validate Marital Status
 */
export function validateMaritalStatus(value, isAm = false) {
    if (!value || !value.toString().trim()) {
        return isAm ? 'እባክዎ የጋብቻ ሁኔታ ይምረጡ.' : 'Please select marital status.';
    }
    const normalized = value.toString().trim().toLowerCase();
    const validStatuses = ['single', 'married', 'divorced', 'widowed', 'other'];
    if (!validStatuses.includes(normalized)) {
        return isAm ? 'ትክክለኛ የጋብቻ ሁኔታ ይምረጡ.' : 'Please select a valid marital status.';
    }
    return null;
}

/**
 * Validate Email Address
 */
export function validateEmail(value, isRequired = true, isAm = false) {
    const val = (value || '').trim();
    if (!val) {
        if (!isRequired) return null;
        return isAm ? 'ኢሜይል አድራሻ ያስፈልጋል.' : 'Email address is required.';
    }
    if (!EMAIL_REGEX.test(val)) {
        return isAm ? 'ትክክለኛ የኢሜይል አድራሻ ያስገቡ.' : 'Please enter a valid email address.';
    }
    return null;
}

/**
 * Validate Phone Number with Dial Code
 */
export function validatePhone(phone, dialCode = '+251', isRequired = true, isAm = false) {
    const val = (phone || '').trim();
    if (!val) {
        if (!isRequired) return null;
        return isAm ? 'ስልክ ቁጥር ያስፈልጋል.' : 'Phone number is required.';
    }
    const res = countryValidatePhone(val, dialCode);
    if (!res.valid) {
        return isAm ? 'ትክክለኛ ስልክ ቁጥር ያስገቡ.' : (res.error || 'Please enter a valid phone number.');
    }
    return null;
}

/**
 * Validate Required Selection / Dropdown
 */
export function validateSelection(value, fieldLabel = 'an option', isAm = false) {
    if (value === null || value === undefined || value === '' || value.toString().trim() === '') {
        return isAm ? `እባክዎ ${fieldLabel} ይምረጡ.` : `Please select ${fieldLabel}.`;
    }
    return null;
}

/**
 * Validate Generic Text Field (e.g. City, Subcity, Woreda, Address, Company, Job Title, Purpose)
 */
export function validateText(value, fieldLabel = 'Field', minLength = 2, maxLength = 255, isRequired = true, isAm = false) {
    const val = (value || '').trim();
    if (!val) {
        if (!isRequired) return null;
        return isAm ? `${fieldLabel} ያስፈልጋል.` : `${fieldLabel} is required.`;
    }
    if (val.length < minLength) {
        return isAm 
            ? `${fieldLabel} ቢያንስ ${minLength} ፊደላት መሆን አለበት.` 
            : `${fieldLabel} must be at least ${minLength} characters.`;
    }
    if (val.length > maxLength) {
        return isAm 
            ? `${fieldLabel} ከ ${maxLength} ፊደላት መብለጥ የለበትም.` 
            : `${fieldLabel} cannot exceed ${maxLength} characters.`;
    }
    return null;
}

/**
 * Validate Vehicle Information (Conditional)
 */
export function validateVehicle(hasVehicle, vehicleData = {}, isAm = false) {
    const errors = {};
    if (!hasVehicle) return errors;

    const plate = (vehicleData.licensePlate || vehicleData.plate_number || '').trim();
    if (!plate) {
        errors.plate_number = isAm ? 'የተሽከርካሪ ታርጋ ቁጥር ያስፈልጋል.' : 'Vehicle plate number is required.';
        errors.licensePlate = errors.plate_number;
    } else if (plate.length < 3) {
        errors.plate_number = isAm ? 'ታርጋ ቁጥር ቢያንስ 3 ፊደላት መሆን አለበት.' : 'Plate number must be at least 3 characters.';
        errors.licensePlate = errors.plate_number;
    } else if (!PLATE_REGEX.test(plate)) {
        errors.plate_number = isAm ? 'ትክክለኛ የታርጋ ቁጥር ያስገቡ.' : 'Please enter a valid vehicle plate number.';
        errors.licensePlate = errors.plate_number;
    }

    const type = (vehicleData.vehicleType || vehicleData.vehicle_type || '').trim();
    if (!type) {
        errors.vehicle_type = isAm ? 'የተሽከርካሪ ዓይነት ይምረጡ.' : 'Please select vehicle type.';
        errors.vehicleType = errors.vehicle_type;
    }

    return errors;
}

/**
 * Validate Identity Document Information
 */
export function validateIdentityDoc(docType, docNumber, expiryDate, isRequired = true, isAm = false) {
    const errors = {};
    const type = (docType || '').trim();
    const num = (docNumber || '').trim();

    if (isRequired && !type) {
        errors.id_type = isAm ? 'የመታወቂያ ዓይነት ይምረጡ.' : 'Please select identity document type.';
        errors.documentType = errors.id_type;
    }

    if (isRequired && !num) {
        errors.id_number = isAm ? 'የመታወቂያ ቁጥር ያስፈልጋል.' : 'Document / ID number is required.';
        errors.documentNumber = errors.id_number;
    } else if (num && num.length < 3) {
        errors.id_number = isAm ? 'የመታወቂያ ቁጥር ቢያንስ 3 ፊደላት መሆን አለበት.' : 'ID number must be at least 3 characters.';
        errors.documentNumber = errors.id_number;
    } else if (num && !DOC_NUM_REGEX.test(num)) {
        errors.id_number = isAm ? 'ትክክለኛ የመታወቂያ ቁጥር ያስገቡ.' : 'Please enter a valid document / ID number.';
        errors.documentNumber = errors.id_number;
    }

    if (expiryDate) {
        const exp = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(exp.getTime()) && exp < today) {
            errors.expiry_date = isAm ? 'መታወቂያው ጊዜው ያለፈበት ነው.' : 'Identification document has expired.';
            errors.expiryDate = errors.expiry_date;
        }
    }

    return errors;
}

/**
 * Validate File Upload (Photo or Document)
 */
export function validateFile(file, { allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSizeBytes = 5 * 1024 * 1024, fileLabel = 'Photo' } = {}, isAm = false) {
    if (!file) return null;

    // Check file type
    const isAllowedType = allowedTypes.some(type => {
        if (type.startsWith('.')) {
            return file.name && file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type && file.type.toLowerCase() === type.toLowerCase();
    });

    if (!isAllowedType) {
        const prettyTypes = allowedTypes.map(t => t.replace('image/', '').replace('.', '').toUpperCase()).join(', ');
        return isAm 
            ? `የተፈቀዱ የፋይል ዓይነቶች: ${prettyTypes} ብቻ ናቸው.` 
            : `Only permitted file types (${prettyTypes}) are allowed.`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
        const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        return isAm 
            ? `የፋይሉ መጠን ከ ${maxMb}MB መብለጥ የለበትም.` 
            : `${fileLabel} file size exceeds ${maxMb}MB limit.`;
    }

    return null;
}

/**
 * Validate Password Policy (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)
 */
export function validatePassword(password, isAm = false) {
    if (!password) {
        return isAm ? 'የይለፍ ቃል ያስፈልጋል.' : 'Password is required.';
    }
    if (password.length < 8) {
        return isAm ? 'የይለፍ ቃል ቢያንስ 8 ፊደላት መሆን አለበት.' : 'Password must be at least 8 characters.';
    }
    if (!/[A-Z]/.test(password)) {
        return isAm ? 'የይለፍ ቃል ቢያንስ አንድ አቢይ ፊደል (A-Z) መያዝ አለበት.' : 'Password must include at least one uppercase letter.';
    }
    if (!/[a-z]/.test(password)) {
        return isAm ? 'የይለፍ ቃል ቢያንስ አንድ ንዑስ ፊደል (a-z) መያዝ አለበት.' : 'Password must include at least one lowercase letter.';
    }
    if (!/[0-9]/.test(password)) {
        return isAm ? 'የይለፍ ቃል ቢያንስ አንድ ቁጥር (0-9) መያዝ አለበት.' : 'Password must include at least one number.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return isAm ? 'የይለፍ ቃል ቢያንስ አንድ ልዩ ምልክት (@#$%) መያዝ አለበት.' : 'Password must include at least one special character.';
    }
    return null;
}

/**
 * Validate Password Confirmation Match
 */
export function validatePasswordConfirmation(password, confirmPassword, isAm = false) {
    if (!confirmPassword) {
        return isAm ? 'እባክዎ የይለፍ ቃልዎን ያረጋግጡ.' : 'Please confirm your password.';
    }
    if (password !== confirmPassword) {
        return isAm ? 'የይለፍ ቃሎች አይዛመዱም.' : 'Passwords do not match.';
    }
    return null;
}

/**
 * Validate Date/Time Range (End must be after Start)
 */
export function validateDateTimeRange(startTime, endTime, isAm = false) {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        return isAm 
            ? 'የመነሻ ሰዓት ከደረሱበት ሰዓት በኋላ መሆን አለበት.' 
            : 'Expected departure time must be after expected arrival time.';
    }
    return null;
}
