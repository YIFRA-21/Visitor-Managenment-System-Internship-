import React from 'react';
import { Check, X } from 'lucide-react';
import { ValidationRules } from '../../services/validationService';
export default function PasswordStrengthMeter({ password, className = '' }) {
    if (!password)
        return null;
    const strength = ValidationRules.passwordStrength(password);
    const getStrengthLabel = (score) => {
        switch (score) {
            case 0:
            case 1:
                return { label: 'Very Weak', color: 'bg-rose-500', textColor: 'text-rose-500' };
            case 2:
                return { label: 'Weak', color: 'bg-amber-500', textColor: 'text-amber-500' };
            case 3:
                return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
            case 4:
                return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' };
            case 5:
                return { label: 'Enterprise Grade', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
            default:
                return { label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-500' };
        }
    };
    const info = getStrengthLabel(strength.score);
    const checklistItems = [
        { key: 'minLength', label: 'Minimum 8 characters', met: strength.minLength },
        { key: 'hasUpper', label: 'Uppercase letter (A-Z)', met: strength.hasUpper },
        { key: 'hasLower', label: 'Lowercase letter (a-z)', met: strength.hasLower },
        { key: 'hasNumber', label: 'Number (0-9)', met: strength.hasNumber },
        { key: 'hasSpecial', label: 'Special character (!@#$%^&*)', met: strength.hasSpecial },
    ];
    return (<div className={`mt-2 space-y-2 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] font-medium">
          <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
          <span className={`font-semibold ${info.textColor}`}>{info.label}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3, 4, 5].map((step) => (<div key={step} className={`h-full flex-1 transition-all duration-300 rounded-full ${step <= strength.score ? info.color : 'bg-slate-200 dark:bg-slate-800'}`}/>))}
        </div>
      </div>

      {/* Live Requirement Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {checklistItems.map((item) => (<div key={item.key} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-200 ${item.met
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'}`}>
            {item.met ? (<Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"/>) : (<X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0"/>)}
            <span>{item.label}</span>
          </div>))}
      </div>
    </div>);
}
