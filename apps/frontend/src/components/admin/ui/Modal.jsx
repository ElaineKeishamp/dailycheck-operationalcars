import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const panel = panelRef.current;
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
    (panel.querySelector('input:not([disabled]), select:not([disabled])') || panel).focus();
    const trapFocus = event => {
      if (event.key !== 'Tab') return;
      const controls = [...panel.querySelectorAll(selector)].filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    panel.addEventListener('keydown', trapFocus);
    return () => { panel.removeEventListener('keydown', trapFocus); previousFocus?.focus(); };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full bg-white rounded-2xl shadow-2xl ${maxWidth} max-h-[90dvh] overflow-y-auto animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >        <div className="flex items-start justify-between border-b border-slate-100 p-4 pb-3 sm:p-6 sm:pb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 break-words text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
