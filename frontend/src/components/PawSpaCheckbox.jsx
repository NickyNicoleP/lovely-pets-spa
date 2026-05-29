import { useState } from 'react';

export default function PawSpaCheckbox({ label, checked, onChange, ...props }) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div className="relative">
          <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
            checked 
              ? 'bg-gradient-to-r from-pawspa-500 to-pawspa-600 border-pawspa-600' 
              : 'border-pawspa-300 bg-white group-hover:border-pawspa-400'
          }`}>
            {checked && (
              <svg className="w-4 h-4 text-white absolute inset-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <span className="ml-2 text-sm text-gray-700 font-poppins">{label}</span>
      </label>
    </div>
  );
}
