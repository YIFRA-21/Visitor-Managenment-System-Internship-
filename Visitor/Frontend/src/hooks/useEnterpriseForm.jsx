import { useState, useCallback, useRef } from 'react';
import { sanitizeFormValues } from '../utils/sanitizer';
export function useEnterpriseForm({ initialValues, validationSchema = {}, onSubmit, sanitizeOnSubmit = true, }) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState(() => {
        const errs = {};
        for (const key of Object.keys(initialValues)) {
            errs[key] = null;
        }
        return errs;
    });
    const [touched, setTouched] = useState(() => {
        const tch = {};
        for (const key of Object.keys(initialValues)) {
            tch[key] = false;
        }
        return tch;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const initialValuesRef = useRef(initialValues);
    /**
     * Auto-Scroll and Cursor Focus Engine
     * Finds the first invalid input in DOM order, smoothly scrolls to it, and sets focus.
     */
    const focusFirstInvalidField = useCallback(() => {
        setTimeout(() => {
            // Find elements marked as invalid
            const selector = '[data-invalid="true"], [aria-invalid="true"]';
            const invalidElements = Array.from(document.querySelectorAll(selector));
            if (invalidElements.length > 0) {
                const firstInvalid = invalidElements[0];
                // Scroll smoothly to first invalid field
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Set cursor focus into the invalid input element
                if (typeof firstInvalid.focus === 'function') {
                    firstInvalid.focus();
                }
            }
        }, 50);
    }, []);
    /**
     * Validates a single field.
     */
    const validateField = useCallback((name, valToTest) => {
        const rule = validationSchema[name];
        if (!rule)
            return null;
        const testVal = valToTest !== undefined ? valToTest : values[name];
        return rule(testVal, values);
    }, [validationSchema, values]);
    /**
     * Validates a subset of fields (e.g. for multi-step wizard step transition).
     */
    const validateStep = useCallback((stepFields) => {
        let isStepValid = true;
        const stepTouchedUpdates = {};
        setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            for (const name of stepFields) {
                stepTouchedUpdates[name] = true;
                const rule = validationSchema[name];
                if (rule) {
                    const err = rule(values[name], values);
                    nextErrors[name] = err;
                    if (err)
                        isStepValid = false;
                }
            }
            return nextErrors;
        });
        setTouched((prevTouched) => ({ ...prevTouched, ...stepTouchedUpdates }));
        if (!isStepValid) {
            focusFirstInvalidField();
        }
        return isStepValid;
    }, [validationSchema, values, focusFirstInvalidField]);
    /**
     * Validates all fields in the form.
     */
    const validateForm = useCallback(() => {
        const newErrors = {};
        let isValid = true;
        for (const key of Object.keys(values)) {
            const rule = validationSchema[key];
            if (rule) {
                const err = rule(values[key], values);
                newErrors[key] = err;
                if (err)
                    isValid = false;
            }
            else {
                newErrors[key] = null;
            }
        }
        setErrors(newErrors);
        return isValid;
    }, [validationSchema, values]);
    /**
     * Handles input changes with immediate validation & error removal.
     */
    const handleChange = useCallback((name, value) => {
        setIsDirty(true);
        setValues((prev) => {
            const nextValues = { ...prev, [name]: value };
            // Run real-time validation if field was touched or submit was attempted
            const rule = validationSchema[name];
            if (rule) {
                const err = rule(value, nextValues);
                setErrors((prevErr) => ({ ...prevErr, [name]: err }));
            }
            return nextValues;
        });
    }, [validationSchema]);
    /**
     * Handles input blur event.
     */
    const handleBlur = useCallback((name) => {
        setTouched((prev) => ({ ...prev, [name]: true }));
        const err = validateField(name);
        setErrors((prev) => ({ ...prev, [name]: err }));
    }, [validateField]);
    /**
     * Direct field value setter.
     */
    const setFieldValue = useCallback((name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    }, []);
    /**
     * Direct field error setter.
     */
    const setFieldError = useCallback((name, error) => {
        setErrors((prev) => ({ ...prev, [name]: error }));
    }, []);
    /**
     * Maps backend validation response (`{ errors: { email: '...' } }` or `{ field: 'email', message: '...' }`)
     * directly to input fields and triggers auto-focus on the first invalid field.
     */
    const setBackendErrors = useCallback((backendPayload) => {
        if (!backendPayload)
            return;
        const newErrors = { ...errors };
        let hasError = false;
        // Case 1: Structured errors object { errors: { email: "Already taken", phone: "Invalid" } }
        if (backendPayload.errors && typeof backendPayload.errors === 'object') {
            for (const [key, msg] of Object.entries(backendPayload.errors)) {
                if (typeof msg === 'string') {
                    newErrors[key] = msg;
                    hasError = true;
                }
            }
        }
        // Case 2: Single field error response { field: "email", message: "Already registered" }
        if (backendPayload.field && backendPayload.message) {
            newErrors[backendPayload.field] = backendPayload.message;
            hasError = true;
        }
        // Case 3: Response data directly inside error response
        if (backendPayload.response?.data) {
            const data = backendPayload.response.data;
            if (data.field && data.message) {
                newErrors[data.field] = data.message;
                hasError = true;
            }
            if (data.errors && typeof data.errors === 'object') {
                for (const [key, msg] of Object.entries(data.errors)) {
                    if (typeof msg === 'string') {
                        newErrors[key] = msg;
                        hasError = true;
                    }
                }
            }
        }
        if (hasError) {
            setErrors(newErrors);
            focusFirstInvalidField();
        }
    }, [errors, focusFirstInvalidField]);
    /**
     * Resets form state.
     */
    const resetForm = useCallback((newValues) => {
        const resetVal = { ...initialValuesRef.current, ...newValues };
        setValues(resetVal);
        const cleanErrs = {};
        const cleanTch = {};
        for (const key of Object.keys(resetVal)) {
            cleanErrs[key] = null;
            cleanTch[key] = false;
        }
        setErrors(cleanErrs);
        setTouched(cleanTch);
        setIsSubmitting(false);
        setIsSubmitted(false);
        setIsDirty(false);
    }, []);
    /**
     * Form Submission Handler
     * Sanitizes values, validates all fields, auto-focuses first invalid field if errors exist,
     * or invokes `onSubmit` with sanitized data.
     */
    const handleSubmit = useCallback(async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsSubmitted(true);
        // Mark all fields as touched
        const allTouched = {};
        for (const key of Object.keys(values)) {
            allTouched[key] = true;
        }
        setTouched(allTouched);
        // Validate all fields
        const isValid = validateForm();
        if (!isValid) {
            focusFirstInvalidField();
            return;
        }
        // Sanitize values if enabled
        const finalValues = sanitizeOnSubmit ? sanitizeFormValues(values) : values;
        try {
            setIsSubmitting(true);
            await onSubmit(finalValues);
        }
        catch (err) {
            setBackendErrors(err);
        }
        finally {
            setIsSubmitting(false);
        }
    }, [values, validateForm, focusFirstInvalidField, sanitizeOnSubmit, onSubmit, setBackendErrors]);
    return {
        values,
        errors,
        touched,
        isSubmitting,
        isSubmitted,
        isDirty,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        setBackendErrors,
        handleSubmit,
        resetForm,
        validateField,
        validateStep,
        validateForm,
        focusFirstInvalidField,
    };
}
