import { Download, X } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function PwaInstallPrompt() {
  const { canInstall, promptInstall, dismissInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <div
      className="fixed left-4 right-4 top-56 z-40 mx-auto max-w-md rounded-xl border border-blue-100 bg-white p-4 text-slate-900 shadow-card-md"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Download size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install Daily Check</p>
          <p className="mt-1 text-sm text-slate-600">
            Akses aplikasi lebih cepat dari layar utama perangkat.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissInstall}
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Tutup prompt install"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={dismissInstall}
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Nanti
        </button>
        <button
          type="button"
          onClick={promptInstall}
          className="min-h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Install Aplikasi
        </button>
      </div>
    </div>
  );
}
