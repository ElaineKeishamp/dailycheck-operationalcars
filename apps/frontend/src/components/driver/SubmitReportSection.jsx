import { Loader2, Send } from 'lucide-react';

function getSubmitHint({
  allRequiredCaptured,
  canSubmit,
  restoreStatus,
  isUploadingAny,
  hasUploadFailures,
}) {
  if (restoreStatus === 'loading' || restoreStatus === 'idle') {
    return 'Memuat status foto sebelum laporan dapat dikirim.';
  }

  if (canSubmit) {
    return 'Semua foto wajib berhasil diupload. Laporan siap dikirim.';
  }

  if (!allRequiredCaptured) {
    return 'Selesaikan semua foto wajib untuk melanjutkan.';
  }

  if (hasUploadFailures) {
    return 'Beberapa foto gagal diupload. Coba ulangi upload yang gagal.';
  }

  if (isUploadingAny || !canSubmit) {
    return 'Tunggu hingga seluruh foto selesai diupload.';
  }

  return 'Tunggu hingga seluruh foto selesai diupload.';
}

export default function SubmitReportSection({
  allRequiredCaptured,
  canSubmit,
  submitting,
  completed,
  restoreStatus,
  isUploadingAny,
  hasUploadFailures,
  onSubmitClick,
}) {
  if (completed) return null;

  return (
    <section className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-slate-50/95 backdrop-blur border-t border-slate-200">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={onSubmitClick}
          className={`w-full min-h-12 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
            canSubmit && !submitting
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
          {submitting ? 'Mengirim Laporan...' : 'Submit Laporan'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          {getSubmitHint({ allRequiredCaptured, canSubmit, restoreStatus, isUploadingAny, hasUploadFailures })}
        </p>
      </div>
    </section>
  );
}
