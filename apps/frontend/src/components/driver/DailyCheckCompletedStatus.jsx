import { CheckCircle2, ClipboardCheck } from 'lucide-react';

export default function DailyCheckCompletedStatus({ dailyCheck, selectedVehicle }) {
  const completedAt = dailyCheck?.submitted_at || dailyCheck?.updated_at;

  return (
    <section
      className="rounded-xl border border-green-200 bg-green-50 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white text-green-700">
          <CheckCircle2 size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-green-800">Laporan checking berhasil dikirim</p>
          {selectedVehicle && (
            <div className="mt-2 flex items-start gap-2 text-sm text-green-800">
              <ClipboardCheck size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="min-w-0">
                <span className="font-semibold">{selectedVehicle.plate_number}</span>
                <span className="text-green-700"> - {selectedVehicle.brand} {selectedVehicle.model}</span>
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-green-700">
            Status: {dailyCheck?.status || 'submitted'}
            {completedAt ? ` - ${new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(completedAt))}` : ''}
          </p>
          <p className="mt-2 text-xs text-green-700">
            Laporan telah tersimpan dan tidak dapat diedit dari halaman ini.
          </p>
        </div>
      </div>
    </section>
  );
}
