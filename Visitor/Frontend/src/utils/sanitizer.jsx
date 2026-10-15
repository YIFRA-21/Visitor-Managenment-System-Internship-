/**
 * Centralized Enterprise Sanitization Utility
 * Sanitizes user input before client-side validation and API submission.
 */
/**
 * Strips HTML tags and script injection vectors from input strings.
 */
export function stripHtmlTags(input) {
    if (!input)
        return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script blocks
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove inline event handlers (onload, onclick)
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, ''); // Remove javascript: URIs
}
/**
 * Neutralizes common SQL injection patterns in free-text fields.
 */
export function neutralizeSqlPatterns(input) {
    if (!input)
        return '';
    return input
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|ALL|OR|AND)\b)/gi, (match) => match)
        .replace(/(--|;|#|\/\*|\*\/)/g, ''); // Strip SQL comment markers and statement separators
}
/**
 * Sanitizes a single string input based on rules.
 */
export function sanitizeString(value, options = {}) {
    if (typeof value !== 'string')
        return '';
    let result = value;
    // Preserve data URLs (base64 image strings)
    if (result.startsWith('data:image/') || result.startsWith('data:application/')) {
        return result;
    }
    // Remove control characters (except tab, newline)
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (options.trim !== false) {
        result = result.trim();
    }
    if (options.normalizeSpaces !== false) {
        result = result.replace(/[ \t]+/g, ' ');
    }
    if (options.stripHtml !== false) {
        result = stripHtmlTags(result);
    }
    if (options.neutralizeSql) {
        result = neutralizeSqlPatterns(result);
    }
    return result;
}
/**
 * Sanitizes an email address.
 */
export function sanitizeEmail(email) {
    if (!email || typeof email !== 'string')
        return '';
    return sanitizeString(email, { trim: true, stripHtml: true }).toLowerCase();
}
/**
 * Sanitizes a phone number (preserves leading +, digits, and spaces/dashes).
 */
export function sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string')
        return '';
    const trimmed = phone.trim();
    const hasPlus = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/\D/g, '');
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
}
/**
 * Recursively sanitizes all string fields in a form data object.
 */
export function sanitizeFormValues(formData) {
    if (!formData || typeof formData !== 'object')
        return formData;
    const sanitized = Array.isArray(formData) ? [] : {};
    for (const key of Object.keys(formData)) {
        const val = formData[key];
        // Skip passwords, binary files, photos, base64 data URLs
        if (key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('file') ||
            key.toLowerCase().includes('photo') ||
            key.toLowerCase().includes('image') ||
            key.toLowerCase().includes('avatar') ||
            key.toLowerCase().includes('qr')) {
            sanitized[key] = val;
            continue;
        }
        if (typeof val === 'string') {
            if (key.toLowerCase().includes('email')) {
                sanitized[key] = sanitizeEmail(val);
            }
            else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
                sanitized[key] = sanitizePhone(val);
            }
            else {
                sanitized[key] = sanitizeString(val);
            }
        }
        else if (typeof val === 'object' && val !== null && !(val instanceof File) && !(val instanceof Date)) {
            sanitized[key] = sanitizeFormValues(val);
        }
        else {
            sanitized[key] = val;
        }
    }
    return sanitized;
}
