import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineNotice() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed left-4 right-4 top-4 z-40 mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-card-md"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <WifiOff size={20} className="mt-0.5 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Anda sedang offline.</p>
          <p className="mt-1 text-sm text-amber-800">
            Data kendaraan, upload foto, dan pengiriman laporan membutuhkan koneksi internet.
          </p>
        </div>
      </div>
    </div>
  );
}
