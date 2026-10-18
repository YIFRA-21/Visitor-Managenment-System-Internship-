import React, { useState } from 'react';
import { X, User, RefreshCw } from 'lucide-react';
import CountryPhoneInput from '../../../components/common/CountryPhoneInput';
import FieldError from '../../../components/common/FieldError';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateText
} from '../../../utils/formValidation';

export default function EmployeeFormModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    phone: '',
    department: '',
    job_title: '',
    is_host: true
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrs = {};
    const nameErr = validateName(formData.name, 'Full name', true);
    const emailErr = validateEmail(formData.email, 'Email', true);
    const phoneErr = formData.phone ? validatePhone(formData.phone, 'Phone number', false) : null;
    const deptErr = formData.department ? validateText(formData.department, 'Department', 2, 80, false) : null;
    const titleErr = formData.job_title ? validateText(formData.job_title, 'Designation', 2, 80, false) : null;

    if (nameErr) newErrs.name = nameErr;
    if (emailErr) newErrs.email = emailErr;
    if (phoneErr) newErrs.phone = phoneErr;
    if (deptErr) newErrs.department = deptErr;
    if (titleErr) newErrs.job_title = titleErr;

    if (Object.keys(newErrs).length > 0) {
      setErrors(newErrs);
      return;
    }

    onSave?.(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{initialData ? 'Edit Employee' : 'Add Employee'}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              data-invalid={Boolean(errors.name)}
              aria-invalid={Boolean(errors.name)}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                clearError('name');
              }}
              className={`w-full text-sm border rounded-lg p-2.5 focus:outline-none transition-all ${
                errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
              }`}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                data-invalid={Boolean(errors.email)}
                aria-invalid={Boolean(errors.email)}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  clearError('email');
                }}
                className={`w-full text-sm border rounded-lg p-2.5 focus:outline-none transition-all ${
                  errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              <FieldError error={errors.email} />
            </div>
            <div>
              <CountryPhoneInput
                id="employee-modal-phone"
                label="Phone"
                value={formData.phone}
                onChange={(val) => {
                  setFormData({ ...formData, phone: val });
                  clearError('phone');
                }}
                error={errors.phone}
                showValidationHelper={false}
              />
              <FieldError error={errors.phone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                data-invalid={Boolean(errors.department)}
                aria-invalid={Boolean(errors.department)}
                onChange={(e) => {
                  setFormData({ ...formData, department: e.target.value });
                  clearError('department');
                }}
                className={`w-full text-sm border rounded-lg p-2.5 focus:outline-none transition-all ${
                  errors.department ? 'border-rose-500 bg-rose-50/50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              <FieldError error={errors.department} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.job_title}
                data-invalid={Boolean(errors.job_title)}
                aria-invalid={Boolean(errors.job_title)}
                onChange={(e) => {
                  setFormData({ ...formData, job_title: e.target.value });
                  clearError('job_title');
                }}
                className={`w-full text-sm border rounded-lg p-2.5 focus:outline-none transition-all ${
                  errors.job_title ? 'border-rose-500 bg-rose-50/50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              <FieldError error={errors.job_title} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.is_host}
              onChange={(e) => setFormData({ ...formData, is_host: e.target.checked })}
              className="rounded text-blue-600"
            />
            Eligible to receive and host visitors
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 min-h-[40px] px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 min-h-[40px] px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
              <span>{submitting ? 'Saving Employee...' : 'Save Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
