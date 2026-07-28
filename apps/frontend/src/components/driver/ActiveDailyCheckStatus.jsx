import { CheckCircle2, ClipboardList } from 'lucide-react';

export default function ActiveDailyCheckStatus({ selectedVehicle }) {
  return (
    <section
      className="bg-green-50 border border-green-200 rounded-xl p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-white text-green-700 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-green-800">Sesi checking sedang berlangsung</p>
          {selectedVehicle && (
            <div className="mt-2 flex items-start gap-2 text-sm text-green-800">
              <ClipboardList size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="min-w-0">
                <span className="font-semibold">{selectedVehicle.plate_number}</span>
                <span className="text-green-700"> - {selectedVehicle.brand} {selectedVehicle.model}</span>
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-green-700">Lengkapi seluruh foto kendaraan sebelum submit.</p>
        </div>
      </div>
    </section>
  );
}
