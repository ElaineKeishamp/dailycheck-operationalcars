import { Camera, CheckCircle2, CircleDotDashed, Loader2, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { TIRE_CHECKLIST_ITEMS } from '../../config/driverChecklist';

function getStatusConfig({ isCaptured, uploadState }) {
  if (uploadState?.status === 'uploading') return { label: 'Mengupload', tone: 'uploading' };
  if (uploadState?.status === 'confirming') return { label: 'Mengonfirmasi', tone: 'confirming' };
  if (uploadState?.status === 'canceling') return { label: 'Membatalkan', tone: 'confirming' };
  if (uploadState?.status === 'confirmation_failed') return { label: 'Menunggu konfirmasi', tone: 'pending' };
  if (uploadState?.status === 'uploaded') return { label: 'Berhasil Diupload', tone: 'uploaded' };
  if (uploadState?.status === 'failed') return { label: 'Gagal Upload', tone: 'failed' };
  if (isCaptured) return { label: 'Sudah Difoto', tone: 'captured' };
  return { label: 'Belum', tone: 'empty' };
}

export default function TireChecklistGrid({
  photoDrafts,
  disabled,
  recoveryDisabled = disabled,
  deleteDisabled = disabled,
  uploadStates,
  onOpenCamera,
  onRetryUpload,
  onDeletePhoto,
  onRetryConfirmation,
  onCancelPendingUpload,
}) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 mb-3">Kondisi Ban</h2>
      <div className="grid grid-cols-2 gap-3">
        {TIRE_CHECKLIST_ITEMS.map((item) => {
          const isCaptured = Boolean(photoDrafts[item.id]);
          const uploadState = uploadStates[item.id];
          const status = getStatusConfig({ isCaptured, uploadState });
          const isUploading = status.tone === 'uploading';
          const isUploaded = status.tone === 'uploaded';
          const isFailed = status.tone === 'failed';
          const isPending = status.tone === 'pending';
          const isConfirming = status.tone === 'confirming';
          const isDeleting = Boolean(uploadState?.isDeleting);
          const successTone = isUploaded || status.tone === 'captured';
          const actionDisabled = disabled || isUploading || isUploaded || isPending || isConfirming;
          const draft = photoDrafts[item.id];

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-xl shadow-card p-4 min-h-[142px] transition-all ${
                isFailed ? 'border-red-200 bg-red-50/30' : isPending ? 'border-amber-200 bg-amber-50/30' : successTone ? 'border-green-200 bg-green-50/40' : 'border-slate-100'
              }`}
            >
              <button
                type="button"
                disabled={actionDisabled}
                onClick={() => onOpenCamera({
                  checklistId: item.id,
                  partType: 'ban',
                  partIndex: item.partIndex,
                  label: `${item.title} - ${item.label}`,
                  isOptional: false,
                })}
                className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  isFailed ? 'bg-red-100 text-red-700' : isPending ? 'bg-amber-100 text-amber-700' : successTone ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-primary'
                }`}>
                  <CircleDotDashed size={20} aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
                  isFailed ? 'text-red-700' : isUploading || isConfirming ? 'text-blue-700' : isPending ? 'text-amber-700' : successTone ? 'text-green-700' : 'text-slate-500'
                }`}>
                  {(isUploading || isDeleting || isConfirming) && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                  {isUploaded && !isDeleting && <CheckCircle2 size={14} aria-hidden="true" />}
                  {isFailed && <TriangleAlert size={14} aria-hidden="true" />}
                  {!isCaptured && !isUploading && !isUploaded && !isFailed && <Camera size={14} aria-hidden="true" />}
                  {status.label}
                </p>
                {isUploaded && <p className="text-xs text-slate-500 mt-1">Foto sudah diupload</p>}
              </button>

              {isPending && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-amber-700">Foto sudah terkirim, tetapi belum tercatat.</p>
                  {uploadState?.errorMessage && <p className="text-xs text-amber-700">{uploadState.errorMessage}</p>}
                  <button
                    type="button"
                    onClick={() => onRetryConfirmation(item.id)}
                    disabled={recoveryDisabled}
                    className="inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw size={13} aria-hidden="true" />
                    Konfirmasi Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelPendingUpload(item.id)}
                    disabled={recoveryDisabled}
                    className="inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Batalkan Upload
                  </button>
                </div>
              )}

              {isUploaded && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onDeletePhoto({
                      checklistId: item.id,
                      partType: 'ban',
                      partIndex: item.partIndex,
                      label: `${item.title} - ${item.label}`,
                      isOptional: false,
                    })}
                    disabled={deleteDisabled || isDeleting}
                    className="inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
                    {isDeleting ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              )}

              {isFailed && (
                <div className="mt-3 space-y-2">
                  {uploadState?.errorMessage && <p className="text-xs text-red-700">{uploadState.errorMessage}</p>}
                  <button
                    type="button"
                    onClick={() => onRetryUpload(draft)}
                    disabled={disabled}
                    className="inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw size={13} aria-hidden="true" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
