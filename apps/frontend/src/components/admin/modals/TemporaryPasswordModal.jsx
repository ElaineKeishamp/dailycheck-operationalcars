import { Copy, Check, KeyRound } from 'lucide-react';
import { useState } from 'react';
import Modal from '../ui/Modal';

/**
 * TemporaryPasswordModal — displays a generated temporary password.
 * Shown after creating a new user OR resetting a user's password.
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   password: string
 *   userName?: string
 *   mode?: 'create' | 'reset'
 */
export default function TemporaryPasswordModal({
  isOpen,
  onClose,
  password,
  userName,
  mode = 'create',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const title = mode === 'reset' ? 'Password Berhasil Direset' : 'User Berhasil Dibuat';
  const subtitle = mode === 'reset'
    ? `Password sementara untuk ${userName || 'user'} telah dibuat.`
    : `Akun untuk ${userName || 'user baru'} telah dibuat.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Icon + instruction */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <KeyRound size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Catat dan sampaikan password sementara ini ke user secara manual (WA/verbal). 
            Password ini <strong>tidak akan ditampilkan lagi</strong> setelah modal ini ditutup.
          </p>
        </div>

        {/* Password display */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">Password Sementara:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-900 text-green-400 font-mono text-lg font-bold tracking-widest px-5 py-3.5 rounded-xl text-center select-all border border-slate-700">
              {password || '—'}
            </div>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border transition-all duration-200 ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title="Salin password"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1.5 text-center">
              ✓ Password disalin ke clipboard
            </p>
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-1">
          <button onClick={onClose} className="btn-primary">
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  );
}
