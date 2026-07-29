import { Camera, CheckCircle2, CircleDotDashed } from 'lucide-react';
import { TIRE_CHECKLIST_ITEMS } from '../../config/driverChecklist';

export default function TireChecklistGrid({ photoDrafts, disabled, onOpenCamera }) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 mb-3">Kondisi Ban</h2>
      <div className="grid grid-cols-2 gap-3">
        {TIRE_CHECKLIST_ITEMS.map((item) => {
          const isCaptured = Boolean(photoDrafts[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onOpenCamera({
                checklistId: item.id,
                partType: 'ban',
                partIndex: item.partIndex,
                label: `${item.title} - ${item.label}`,
                isOptional: false,
              })}
              className={`bg-white border rounded-xl shadow-card p-4 min-h-[118px] text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                isCaptured ? 'border-green-200 bg-green-50/40' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isCaptured ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-primary'
              }`}>
                <CircleDotDashed size={20} aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
              <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
                isCaptured ? 'text-green-700' : 'text-slate-500'
              }`}>
                {isCaptured ? <CheckCircle2 size={14} aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
                {isCaptured ? 'Sudah Difoto' : 'Belum'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
