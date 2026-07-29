import {
  Armchair,
  Camera,
  CarFront,
  CheckCircle2,
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

export default function PhotoChecklistCard({ item, isCaptured, disabled, onOpenCamera }) {
  const Icon = ICONS[item.icon] || CarFront;

  return (
    <button
      type="button"
      onClick={onOpenCamera}
      disabled={disabled}
      className={`w-full bg-white border rounded-xl shadow-card p-4 flex items-center gap-3 min-h-[76px] text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
        isCaptured ? 'border-green-200 bg-green-50/40' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
      }`}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isCaptured ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-primary'
      }`}>
        <Icon size={21} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
        <p className={`text-xs mt-0.5 ${isCaptured ? 'font-semibold text-green-700' : 'text-slate-500'}`}>
          Status: {isCaptured ? 'Sudah Difoto' : 'Belum'}
        </p>
      </div>

      {isCaptured ? (
        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" aria-hidden="true" />
      ) : (
        <Camera size={20} className="text-slate-300 flex-shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
