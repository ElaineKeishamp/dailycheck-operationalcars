import { CheckCircle2, ImagePlus, Loader2, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';

function getStatusConfig({ isCaptured, uploadState }) {
  if (uploadState?.status === 'uploading') return { label: 'Mengupload', tone: 'uploading' };
  if (uploadState?.status === 'uploaded') return { label: 'Berhasil Diupload', tone: 'uploaded' };
  if (uploadState?.status === 'failed') return { label: 'Gagal Upload', tone: 'failed' };
  if (isCaptured) return { label: 'Sudah Difoto', tone: 'captured' };
  return { label: 'Belum', tone: 'empty' };
}

export default function OptionalPhotoCard({
  isCaptured,
  disabled,
  deleteDisabled = disabled,
  uploadState,
  onOpenCamera,
  onRetryUpload,
  onDeletePhoto,
}) {
  const status = getStatusConfig({ isCaptured, uploadState });
  const isUploading = status.tone === 'uploading';
  const isUploaded = status.tone === 'uploaded';
  const isFailed = status.tone === 'failed';
  const isDeleting = Boolean(uploadState?.isDeleting);
  const successTone = isUploaded || status.tone === 'captured';
  const actionDisabled = disabled || isUploading || isUploaded;

  return (
    <div
      className={`w-full bg-white border border-dashed rounded-xl p-4 transition-all ${
        isFailed ? 'border-red-300 bg-red-50/30' : successTone ? 'border-green-300 bg-green-50/40' : 'border-slate-300'
      }`}
    >
      <button
        type="button"
        disabled={actionDisabled}
        onClick={onOpenCamera}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isFailed ? 'bg-red-100 text-red-700' : successTone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <ImagePlus size={21} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Foto Tambahan</h2>
              <span className="badge-incomplete">Opsional</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Untuk kerusakan, baret, kondisi tidak biasa, atau temuan lain yang relevan.
            </p>
            <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
              isFailed ? 'text-red-700' : isUploading ? 'text-blue-700' : successTone ? 'text-green-700' : 'text-slate-400'
            }`}>
              {(isUploading || isDeleting) && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {isUploaded && !isDeleting && <CheckCircle2 size={14} aria-hidden="true" />}
              {isFailed && <TriangleAlert size={14} aria-hidden="true" />}
              {status.label}
            </p>
            {isUploaded && <p className="text-xs text-slate-500 mt-1">Foto sudah diupload</p>}
          </div>
        </div>
      </button>

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
