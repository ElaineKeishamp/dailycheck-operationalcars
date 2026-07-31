import { RefreshCw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const dismissButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!needRefresh) return undefined;

    previousFocusRef.current = document.activeElement;
    dismissButtonRef.current?.focus();

    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [needRefresh]);

  if (!needRefresh) return null;

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <div
      className="fixed left-3 right-3 top-3 z-40 mx-auto max-w-md rounded-xl border border-blue-100 bg-white p-3 text-slate-900 shadow-card-md sm:left-4 sm:right-4 sm:top-24 sm:p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <RefreshCw size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold">Versi baru tersedia</p>
          <p className="mt-1 break-words text-sm text-slate-600">
            Selesaikan proses checking dan pastikan tidak ada foto yang sedang diunggah sebelum memperbarui aplikasi.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          ref={dismissButtonRef}
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Tutup prompt pembaruan"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Nanti
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          className="min-h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Perbarui Sekarang
        </button>
      </div>
    </div>
  );
}
