/**
 * Enterprise Form Error Handling & Step Navigation Utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses backend HTTP 400/409/422 validation and duplicate errors, maps them
 * directly to target input fields, determines the corresponding wizard step,
 * and extracts clean, non-duplicating error messages.
 */
/**
 * Maps field names to their default wizard step number if no custom step map is provided.
 */
export function getStepForFieldDefault(field, customMap) {
    if (customMap) {
        for (const [stepStr, fields] of Object.entries(customMap)) {
            const stepNum = Number(stepStr);
            if (fields.map((f) => f.toLowerCase()).includes(field.toLowerCase())) {
                return stepNum;
            }
        }
    }
    const f = (field || '').toLowerCase();
    // Personal / Step 1
    if (['firstname', 'first_name', 'middlename', 'middle_name', 'lastname', 'last_name', 'gender', 'dateofbirth', 'date_of_birth', 'nationality', 'avatarurl', 'avatar_url', 'photo', 'photo_url'].includes(f)) {
        return 1;
    }
    // Contact / Step 2
    if (['email', 'phone', 'phone_number', 'altphone', 'alt_phone', 'mobile', 'address', 'city', 'country'].includes(f)) {
        return 2;
    }
    // Organization / Details / Step 3
    if (['organization', 'organization_id', 'branch', 'branch_id', 'department', 'department_id', 'departmentid', 'jobtitle', 'job_title', 'code', 'org_code', 'branch_code', 'department_code', 'userid', 'user_id', 'employeeid', 'employee_id', 'building_id', 'room_id'].includes(f)) {
        return 3;
    }
    // Security / Credentials / Step 4
    if (['role', 'user_type', 'usertype', 'username', 'accountstatus', 'account_status', 'credentialmode', 'password', 'confirmpassword', 'confirm_password', 'usercode', 'user_code'].includes(f)) {
        return 4;
    }
    return null;
}
/**
 * Universal Error Message Extractor — Eliminates duplicate string prefixes.
 */
export function extractCleanErrorMessage(err, fallback = 'Operation failed. Please check your input.') {
    if (!err)
        return fallback;
    const errData = err.response?.data || err;
    const detailsList = [];
    if (Array.isArray(errData.details) && errData.details.length > 0) {
        errData.details.forEach((d) => {
            if (typeof d === 'string') {
                if (!detailsList.includes(d))
                    detailsList.push(d);
            }
            else if (d.message) {
                if (!detailsList.includes(d.message))
                    detailsList.push(d.message);
            }
        });
    }
    else if (errData.errors && typeof errData.errors === 'object' && !Array.isArray(errData.errors)) {
        Object.values(errData.errors).forEach((msg) => {
            const msgStr = typeof msg === 'string' ? msg : msg?.message;
            if (msgStr && !detailsList.includes(msgStr)) {
                detailsList.push(msgStr);
            }
        });
    }
    if (detailsList.length > 0) {
        if (errData.message && detailsList.length === 1 && (errData.message.includes(detailsList[0]) || detailsList[0].includes(errData.message))) {
            return detailsList[0];
        }
        return detailsList.join(' | ');
    }
    if (errData.message && errData.message !== 'Validation failed')
        return errData.message;
    if (errData.error && errData.error !== 'Validation failed')
        return errData.error;
    if (errData.message === 'Validation failed' || errData.error === 'Validation failed') {
        return 'Validation Failed: Please check required fields.';
    }
    return fallback;
}
/**
 * Parses backend HTTP error responses into field-level errors and step navigation targets.
 */
export function parseBackendFormErrors(err, customStepMap) {
    const errData = err.response?.data || err;
    const mappedErrors = {};
    let targetStep = null;
    // 1. Parse details array [{ field: 'email', message: '...' }]
    if (Array.isArray(errData?.details)) {
        errData.details.forEach((d) => {
            if (d.field && d.message) {
                mappedErrors[d.field] = d.message;
                if (!targetStep)
                    targetStep = getStepForFieldDefault(d.field, customStepMap);
            }
        });
    }
    // 2. Parse errors object { email: '...' }
    if (errData?.errors && typeof errData.errors === 'object' && !Array.isArray(errData.errors)) {
        Object.entries(errData.errors).forEach(([f, m]) => {
            const msgStr = typeof m === 'string' ? m : m?.message;
            if (msgStr) {
                mappedErrors[f] = msgStr;
                if (!targetStep)
                    targetStep = getStepForFieldDefault(f, customStepMap);
            }
        });
    }
    // 3. Parse top-level field property { field: 'email', message: '...' }
    if (errData?.field && errData?.message) {
        mappedErrors[errData.field] = errData.message;
        if (!targetStep)
            targetStep = getStepForFieldDefault(errData.field, customStepMap);
    }
    // 4. Fallback: Parse error text pattern if field key was omitted
    const rawMsg = errData?.message || err?.message || '';
    if (Object.keys(mappedErrors).length === 0 && rawMsg) {
        const lower = rawMsg.toLowerCase();
        if (lower.includes('email')) {
            mappedErrors['email'] = rawMsg;
            targetStep = getStepForFieldDefault('email', customStepMap);
        }
        else if (lower.includes('phone') || lower.includes('mobile')) {
            mappedErrors['phone'] = rawMsg;
            targetStep = getStepForFieldDefault('phone', customStepMap);
        }
        else if (lower.includes('username')) {
            mappedErrors['username'] = rawMsg;
            targetStep = getStepForFieldDefault('username', customStepMap);
        }
        else if (lower.includes('code') || lower.includes('already exists')) {
            mappedErrors['code'] = rawMsg;
            targetStep = getStepForFieldDefault('code', customStepMap);
        }
        else if (lower.includes('name')) {
            mappedErrors['name'] = rawMsg;
            targetStep = getStepForFieldDefault('name', customStepMap);
        }
    }
    const cleanMessage = extractCleanErrorMessage(err);
    return {
        mappedErrors,
        targetStep,
        cleanMessage,
    };
}
/**
 * Smoothly scrolls to the first invalid field element and places cursor focus inside it.
 */
export function focusFirstInvalidFieldInDom() {
    setTimeout(() => {
        const el = document.querySelector('[data-invalid="true"], [aria-invalid="true"]');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof el.focus === 'function')
                el.focus();
        }
    }, 50);
}
