export default function ErrorMessage({ message, type = 'error', onClose }) {
  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      icon: '⚠️'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      icon: '⚡'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      icon: 'ℹ️'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      icon: '✓'
    }
  };

  const style = colors[type] || colors.error;

  return (
    <div className={`mb-4 p-4 ${style.bg} border ${style.border} rounded-2xl ${style.text} text-sm flex items-start justify-between`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{style.icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-lg opacity-50 hover:opacity-100 transition"
        >
          ×
        </button>
      )}
    </div>
  );
}
