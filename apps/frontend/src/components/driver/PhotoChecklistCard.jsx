import {
  Armchair,
  Camera,
  CarFront,
  CheckCircle2,
  Loader2,
  Gauge,
  MoveDown,
  MoveUp,
  PanelLeft,
  PanelRight,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

const ICONS = {
  armchair: Armchair,
  carFront: CarFront,
  gauge: Gauge,
  moveDown: MoveDown,
  moveUp: MoveUp,
  panelLeft: PanelLeft,
  panelRight: PanelRight,
};

function getStatusConfig({ isCaptured, uploadState }) {
  if (uploadState?.status === 'uploading') {
    return { label: 'Mengupload', tone: 'uploading' };
  }
  if (uploadState?.status === 'confirming') {
    return { label: 'Mengonfirmasi', tone: 'confirming' };
  }
  if (uploadState?.status === 'canceling') {
    return { label: 'Membatalkan', tone: 'confirming' };
  }
  if (uploadState?.status === 'confirmation_failed') {
    return { label: 'Menunggu konfirmasi', tone: 'pending' };
  }
  if (uploadState?.status === 'uploaded') {
    return { label: 'Berhasil Diupload', tone: 'uploaded' };
  }
  if (uploadState?.status === 'failed') {
    return { label: 'Gagal Upload', tone: 'failed' };
  }
  if (isCaptured) {
    return { label: 'Sudah Difoto', tone: 'captured' };
  }
  return { label: 'Belum', tone: 'empty' };
}

export default function PhotoChecklistCard({
  item,
  isCaptured,
  disabled,
  recoveryDisabled = disabled,
  deleteDisabled = disabled,
  uploadState,
  onOpenCamera,
  onRetryUpload,
  onDeletePhoto,
  onRetryConfirmation,
  onCancelPendingUpload,
}) {
  const Icon = ICONS[item.icon] || CarFront;
  const status = getStatusConfig({ isCaptured, uploadState });
  const isUploaded = status.tone === 'uploaded';
  const isUploading = status.tone === 'uploading';
  const isFailed = status.tone === 'failed';
  const isPending = status.tone === 'pending';
  const isConfirming = status.tone === 'confirming';
  const isDeleting = Boolean(uploadState?.isDeleting);
  const actionDisabled = disabled || isUploaded || isUploading || isPending || isConfirming;
  const successTone = isUploaded || status.tone === 'captured';

  return (
    <div className={`w-full bg-white border rounded-xl shadow-card p-4 transition-all ${
      isFailed ? 'border-red-200 bg-red-50/30' : isPending ? 'border-amber-200 bg-amber-50/30' : successTone ? 'border-green-200 bg-green-50/40' : 'border-slate-100'
    }`}>
      <button
        type="button"
        onClick={onOpenCamera}
        disabled={actionDisabled}
        className="w-full flex items-center gap-3 min-h-[48px] text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isFailed ? 'bg-red-100 text-red-700' : isPending ? 'bg-amber-100 text-amber-700' : successTone ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-primary'
        }`}>
          <Icon size={21} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
          <p className={`text-xs mt-0.5 font-semibold ${
            isFailed ? 'text-red-700' : isUploading || isConfirming ? 'text-blue-700' : isPending ? 'text-amber-700' : successTone ? 'text-green-700' : 'text-slate-500'
          }`}>
            Status: {status.label}
          </p>
          {isUploaded && <p className="text-xs text-slate-500 mt-1">Foto sudah diupload</p>}
        </div>

        {(isUploading || isDeleting || isConfirming) && <Loader2 size={20} className="text-blue-600 flex-shrink-0 animate-spin" aria-hidden="true" />}
        {isUploaded && !isDeleting && <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" aria-hidden="true" />}
        {isFailed && <TriangleAlert size={20} className="text-red-600 flex-shrink-0" aria-hidden="true" />}
        {!isCaptured && !isUploading && !isUploaded && !isFailed && (
          <Camera size={20} className="text-slate-300 flex-shrink-0" aria-hidden="true" />
        )}
      </button>

      {isPending && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-amber-700">Foto sudah terkirim ke penyimpanan, tetapi belum tercatat di laporan.</p>
          {uploadState?.errorMessage && <p className="text-xs text-amber-700">{uploadState.errorMessage}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onRetryConfirmation}
              disabled={recoveryDisabled}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Coba Konfirmasi Lagi
            </button>
            <button
              type="button"
              onClick={onCancelPendingUpload}
              disabled={recoveryDisabled}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batalkan Upload
            </button>
          </div>
        </div>
      )}

      {isUploaded && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onDeletePhoto}
            disabled={deleteDisabled || isDeleting}
            className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
            {isDeleting ? 'Menghapus...' : 'Hapus & Ambil Ulang'}
          </button>
        </div>
      )}

      {isFailed && (
        <div className="mt-3 flex flex-col gap-2">
          {uploadState?.errorMessage && <p className="text-xs text-red-700">{uploadState.errorMessage}</p>}
          <button
            type="button"
            onClick={onRetryUpload}
            disabled={disabled}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Retry Upload
          </button>
        </div>
      )}
    </div>
  );
}
