import { CircleDotDashed } from 'lucide-react';
import { TIRE_CHECKLIST_ITEMS } from '../../config/driverChecklist';

export default function TireChecklistGrid() {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 mb-3">Kondisi Ban</h2>
      <div className="grid grid-cols-2 gap-3">
        {TIRE_CHECKLIST_ITEMS.map((item) => (
          <div key={item.id} className="bg-white border border-slate-100 rounded-xl shadow-card p-4 min-h-[118px]">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-3">
              <CircleDotDashed size={20} aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            <p className="text-xs font-medium text-slate-500 mt-3">Status: Belum</p>
          </div>
        ))}
      </div>
    </section>
  );
}
