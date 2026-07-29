import { Send } from 'lucide-react';

function getSubmitHint({ allRequiredCaptured, allRequiredUploaded, isUploadingAny, hasUploadFailures }) {
  if (!allRequiredCaptured) {
    return 'Selesaikan semua foto wajib untuk melanjutkan.';
  }

  if (hasUploadFailures) {
    return 'Beberapa foto gagal diupload. Coba ulangi upload yang gagal.';
  }

  if (isUploadingAny || !allRequiredUploaded) {
    return 'Tunggu hingga seluruh foto selesai diupload.';
  }

  return 'Semua foto berhasil diupload. Submit laporan akan diaktifkan pada tahap berikutnya.';
}

export default function SubmitReportSection({
  allRequiredCaptured,
  allRequiredUploaded,
  isUploadingAny,
  hasUploadFailures,
}) {
  return (
    <section className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-slate-50/95 backdrop-blur border-t border-slate-200">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          disabled
          className="w-full min-h-12 rounded-xl bg-slate-200 text-slate-500 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Send size={18} aria-hidden="true" />
          Submit Laporan
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          {getSubmitHint({ allRequiredCaptured, allRequiredUploaded, isUploadingAny, hasUploadFailures })}
        </p>
      </div>
    </section>
  );
}
