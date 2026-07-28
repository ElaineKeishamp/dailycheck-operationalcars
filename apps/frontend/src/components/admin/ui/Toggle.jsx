/**
 * Toggle Switch component — iOS-style toggle.
 * 
 * Props:
 *   checked: boolean
 *   onChange: (checked: boolean) => void
 *   disabled?: boolean
 *   label?: string
 *   description?: string
 */
export default function Toggle({ checked, onChange, disabled = false, label, description }) {
  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && <p className="text-sm font-medium text-slate-800">{label}</p>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      <label className="toggle-switch flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}
