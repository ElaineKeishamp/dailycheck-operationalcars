import { CheckCircle2, Loader2, LocateFixed, MapPinOff, RotateCcw } from 'lucide-react';

function getStatusTone(status) {
  if (status === 'granted') return 'border-green-200 bg-green-50 text-green-700';
  if (status === 'requesting') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'idle') return 'border-slate-200 bg-slate-50 text-slate-600';
  return 'border-red-200 bg-red-50 text-red-700';
}

function getStatusIcon(status) {
  if (status === 'granted') return CheckCircle2;
  if (status === 'requesting') return Loader2;
  if (status === 'idle') return LocateFixed;
  return MapPinOff;
}

function getStatusMessage(status, coordinates, errorMessage) {
  if (status === 'requesting') return 'Mengambil lokasi perangkat...';
  if (status === 'granted') return 'Lokasi berhasil diperoleh.';
  if (status === 'idle') return 'Menyiapkan permintaan lokasi perangkat.';
  return errorMessage || 'Gagal mengambil lokasi. Silakan coba lagi.';
}

export default function LocationPermissionStatus({
  status,
  coordinates,
  errorMessage,
  onRetry,
}) {
  const Icon = getStatusIcon(status);
  const canRetry = ['denied', 'unavailable', 'timeout', 'unsupported', 'error'].includes(status);
  const accuracy = coordinates?.accuracy ? Math.round(coordinates.accuracy) : null;

  return (
    <div
      className={`rounded-xl border p-3 ${getStatusTone(status)}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          className={`mt-0.5 flex-shrink-0 ${status === 'requesting' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{getStatusMessage(status, coordinates, errorMessage)}</p>
          {accuracy && (
            <p className="mt-1 text-xs text-green-700">Akurasi sekitar {accuracy} meter</p>
          )}
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 min-h-10 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
