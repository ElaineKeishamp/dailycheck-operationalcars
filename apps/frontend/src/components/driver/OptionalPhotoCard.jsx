import { CheckCircle2, ImagePlus } from 'lucide-react';

export default function OptionalPhotoCard({ isCaptured, disabled, onOpenCamera }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpenCamera}
      className={`w-full bg-white border border-dashed rounded-xl p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
        isCaptured ? 'border-green-300 bg-green-50/40' : 'border-slate-300 hover:border-blue-300 hover:bg-blue-50/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCaptured ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
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
            isCaptured ? 'text-green-700' : 'text-slate-400'
          }`}>
            {isCaptured && <CheckCircle2 size={14} aria-hidden="true" />}
            {isCaptured ? 'Sudah Difoto' : 'Belum'}
          </p>
        </div>
      </div>
    </button>
  );
}
