import { useState } from 'react';

export default function PawSpaInputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  eyeIcon = false,
  required = false,
  disabled = false,
  autoComplete = 'off',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = eyeIcon && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
          {label}
          {required && <span className="text-pawspa-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pawspa-400 pointer-events-none transition-colors group-focus-within:text-pawspa-500">
            <Icon size={20} />
          </div>
        )}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full px-4 py-3 ${Icon ? 'pl-12' : ''} ${eyeIcon && type === 'password' ? 'pr-12' : ''} rounded-lg font-poppins text-gray-800 placeholder-gray-400 border-2 transition-all duration-200 focus:outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50'
              : 'border-pawspa-200 focus:border-pawspa-400 focus:ring-2 focus:ring-pawspa-100 bg-white hover:border-pawspa-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
          {...props}
        />

        {eyeIcon && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pawspa-400 hover:text-pawspa-500 transition-colors"
            tabIndex="-1"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.596m16.807 16.807L9.404 9.404m0 0L6.643 6.643" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-poppins flex items-center gap-1">
          <span>✗</span> {error}
        </p>
      )}
    </div>
  );
}
