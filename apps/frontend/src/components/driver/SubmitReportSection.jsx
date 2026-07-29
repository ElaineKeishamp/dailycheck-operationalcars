import { Send } from 'lucide-react';

export default function SubmitReportSection({ allRequiredCaptured }) {
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
          {allRequiredCaptured
            ? 'Semua foto sudah diambil. Upload foto akan dilakukan pada tahap berikutnya.'
            : 'Selesaikan semua foto wajib untuk melanjutkan.'}
        </p>
      </div>
    </section>
  );
}
