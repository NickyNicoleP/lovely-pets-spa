import { useState } from 'react';

export default function PawSpaButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  type = 'button',
  ...props
}) {
  const [isHovering, setIsHovering] = useState(false);

  const variants = {
    primary: 'bg-gradient-to-r from-pawspa-500 to-pawspa-600 text-white hover:from-pawspa-600 hover:to-pawspa-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-2 border-gray-200',
    outline: 'border-2 border-pawspa-500 text-pawspa-600 hover:bg-pawspa-50',
    social: 'bg-white border-2 border-gray-200 hover:border-pawspa-300 hover:bg-pawspa-50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`
        font-poppins font-semibold rounded-lg transition-all duration-200 
        flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
        ${isHovering && !disabled && !loading ? 'scale-105 -translate-y-0.5' : ''}
        focus:outline-none focus:ring-2 focus:ring-pawspa-300 focus:ring-offset-2
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        </>
      ) : (
        <>
          {Icon && <Icon size={20} />}
          {children}
        </>
      )}
    </button>
  );
}
