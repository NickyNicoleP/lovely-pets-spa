export default function PasswordStrengthIndicator({ password = '', showCriteria = true }) {
  const criteria = [
    { label: '8+ caracteres', valid: password.length >= 8 },
    { label: 'Mayúscula (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Minúscula (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Número (0-9)', valid: /\d/.test(password) },
    { label: 'Carácter especial (!@#$...)', valid: /[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]/.test(password) }
  ];

  const score = criteria.filter(item => item.valid).length;
  const levels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Excelente'];
  const strengthLevel = levels[score];

  const strengthColors = {
    0: { bg: 'bg-red-500', text: 'text-red-600', lightBg: 'bg-red-50' },
    1: { bg: 'bg-red-500', text: 'text-red-600', lightBg: 'bg-red-50' },
    2: { bg: 'bg-orange-500', text: 'text-orange-600', lightBg: 'bg-orange-50' },
    3: { bg: 'bg-yellow-500', text: 'text-yellow-600', lightBg: 'bg-yellow-50' },
    4: { bg: 'bg-lime-500', text: 'text-lime-600', lightBg: 'bg-lime-50' },
    5: { bg: 'bg-green-500', text: 'text-green-600', lightBg: 'bg-green-50' }
  };

  const colors = strengthColors[score];

  return (
    <div className="mt-3">
      {/* Strength bar */}
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < score ? colors.bg : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.lightBg} ${colors.text}`}>
        {strengthLevel}
      </div>

      {/* Requirements checklist */}
      {showCriteria && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requisitos:</p>
          {criteria.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                item.valid 
                  ? 'bg-green-100' 
                  : 'bg-slate-100'
              }`}>
                {item.valid && (
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={item.valid ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
