import { ImagePlus } from 'lucide-react';

export default function OptionalPhotoCard() {
  return (
    <section className="bg-white border border-dashed border-slate-300 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
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
          <p className="text-xs font-medium text-slate-400 mt-3">Belum tersedia di fase ini</p>
        </div>
      </div>
    </section>
  );
}
