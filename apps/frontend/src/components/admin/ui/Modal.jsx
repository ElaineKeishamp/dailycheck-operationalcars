import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Generic Modal wrapper.
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   title: string
 *   subtitle?: string
 *   children: ReactNode
 *   maxWidth?: string (Tailwind class, default 'max-w-lg')
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className={`relative w-full max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl ${maxWidth} max-h-[90vh] overflow-y-auto animate-fade-in sm:max-w-[calc(100vw-2rem)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-4 pb-3 sm:p-6 sm:pb-4">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 break-words text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
