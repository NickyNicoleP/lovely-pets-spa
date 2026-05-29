export default function PawSpaLogo({ size = 'lg', showText = true }) {
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-sm' },
    md: { container: 'w-16 h-16', text: 'text-base' },
    lg: { container: 'w-24 h-24', text: 'text-2xl' },
  };

  return (
    <div className="flex flex-col items-center gap-3 animate-slide-in-down">
      <div className={`${sizes[size].container} bg-gradient-to-br from-pawspa-400 to-pawspa-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow`}>
        <svg className="w-2/3 h-2/3 text-white" fill="currentColor" viewBox="0 0 24 24">
          {/* Paw print icon */}
          <circle cx="12" cy="8" r="2.5" />
          <circle cx="7" cy="14" r="2" />
          <circle cx="12" cy="16" r="2" />
          <circle cx="17" cy="14" r="2" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      
      {showText && (
        <div className={`text-center ${sizes[size].text}`}>
          <h1 className="font-poppins font-black text-gray-900 tracking-tight">
            PawSpa
          </h1>
          <p className="text-xs text-pawspa-500 font-medium mt-1">Spa para tu mascota</p>
        </div>
      )}
    </div>
  );
}
