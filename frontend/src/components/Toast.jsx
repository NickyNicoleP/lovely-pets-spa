import { useEffect, useState } from 'react';

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const colorClasses = toast.type === 'success'
    ? 'bg-green-50 border-green-200 text-green-900'
    : toast.type === 'error'
    ? 'bg-red-50 border-red-200 text-red-900'
    : 'bg-blue-50 border-blue-200 text-blue-900';

  useEffect(() => {
    const enterTimeout = setTimeout(() => setVisible(true), 10);
    const exitTimer = setTimeout(() => {
      if (!closing) {
        setClosing(true);
        setVisible(false);
        setTimeout(() => onClose(), 250);
      }
    }, 5000);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(exitTimer);
    };
  }, [closing, onClose]);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    setTimeout(() => onClose(), 250);
  };

  return (
    <div
      className={`rounded-3xl border p-4 shadow-lg ring-1 ring-inset ring-slate-200 transition-all duration-300 ease-out ${colorClasses} ${visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'}`}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">{toast.title || 'Notificación'}</p>
          <p className="mt-1 text-sm leading-6">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-slate-500 hover:text-slate-900 transition"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </div>
  );
}
