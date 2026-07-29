import { RotateCcw, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PhotoReview({ photoBlob, checklistItem, onRetake, onAccept }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!photoBlob) return undefined;

    const objectUrl = URL.createObjectURL(photoBlob);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoBlob]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950">
      <div className="flex-1 min-h-0 flex items-center justify-center p-3">
        {previewUrl && (
          <img
            src={previewUrl}
            alt={`Preview foto ${checklistItem.label}`}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        )}
      </div>

      <div className="bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p className="text-sm font-semibold text-slate-900">{checklistItem.label}</p>
        <p className="mt-1 text-xs text-slate-500">Periksa hasil watermark sebelum menggunakan foto ini.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="btn-secondary min-h-12 justify-center"
          >
            <RotateCcw size={18} aria-hidden="true" />
            Ambil Ulang
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="btn-primary min-h-12 justify-center"
          >
            <Check size={18} aria-hidden="true" />
            Gunakan Foto Ini
          </button>
        </div>
      </div>
    </div>
  );
}
