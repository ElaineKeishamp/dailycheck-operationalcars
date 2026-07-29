import {
  Armchair,
  CarFront,
  ChevronRight,
  Gauge,
  MoveDown,
  MoveUp,
  PanelLeft,
  PanelRight,
} from 'lucide-react';

const ICONS = {
  armchair: Armchair,
  carFront: CarFront,
  gauge: Gauge,
  moveDown: MoveDown,
  moveUp: MoveUp,
  panelLeft: PanelLeft,
  panelRight: PanelRight,
};

export default function PhotoChecklistCard({ item }) {
  const Icon = ICONS[item.icon] || CarFront;

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-card p-4 flex items-center gap-3 min-h-[76px]">
      <div className="w-11 h-11 rounded-lg bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
        <Icon size={21} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">Status: Belum</p>
      </div>

      <ChevronRight size={18} className="text-slate-300 flex-shrink-0" aria-hidden="true" />
    </div>
  );
}
