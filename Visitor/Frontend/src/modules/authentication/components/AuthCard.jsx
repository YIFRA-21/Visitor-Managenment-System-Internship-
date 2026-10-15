import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {children}

        {footer && <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">{footer}</div>}
      </div>
    </div>
  );
}
