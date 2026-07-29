export default function ChecklistProgress({ completedCount = 0, totalCount }) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Checklist Foto</h2>
          <p className="text-sm text-slate-500">{completedCount} dari {totalCount} bagian wajib selesai</p>
          <p className="text-xs text-slate-400 mt-1">Foto tersimpan sementara di perangkat sampai proses upload dilakukan.</p>
        </div>
        <span className="badge-incomplete self-start sm:self-center">
          {completedCount === totalCount ? 'Lengkap Lokal' : 'Belum Lengkap'}
        </span>
      </div>

      <div className="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
