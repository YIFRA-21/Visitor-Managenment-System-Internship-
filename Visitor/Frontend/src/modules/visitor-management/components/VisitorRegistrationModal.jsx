import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import CountryPhoneInput from '../../../components/common/CountryPhoneInput';
import FieldError from '../../../components/common/FieldError';
import { validateName, validateEmail, validatePhone } from '../../../utils/formValidation';

export default function VisitorRegistrationModal({ isOpen, onClose, onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    category: 'client'
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const nameErr = validateName(formData.name, 'Full name', true);
    if (nameErr) newErrors.name = nameErr;

    if (formData.email) {
      const emailErr = validateEmail(formData.email, false);
      if (emailErr) newErrors.email = emailErr;
    }

    if (formData.phone) {
      const phoneErr = validatePhone(formData.phone, false);
      if (phoneErr) newErrors.phone = phoneErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onRegister?.(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Register Visitor</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:outline-none transition-all ${
                errors.name
                  ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500/20'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500/20'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError error={errors.email} />
            </div>
            <div>
              <CountryPhoneInput
                id="visitor-modal-phone"
                label="Phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                showValidationHelper={false}
                error={errors.phone}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => updateField('company', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="client">Client</option>
                <option value="vip">VIP Guest</option>
                <option value="contractor">Contractor</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-700 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Register Visitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
