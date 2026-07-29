import { Link } from 'react-router-dom';
import { ArrowLeft, Car, MessageCircle, Phone } from 'lucide-react';
import { SUPPORT_CONTACT, getSupportWhatsAppUrl } from '../config/support';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/50">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Daily Check</h1>
          <p className="text-blue-300 text-sm mt-1">Operational Cars</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lupa Password?</h2>
          <p className="text-sm text-slate-500 mb-5">
            Reset password dilakukan oleh Admin atau IT Support. Hubungi kontak di bawah ini untuk mendapatkan password sementara.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Kontak Bantuan</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{SUPPORT_CONTACT.name}</p>
                <p className="text-sm text-slate-500">{SUPPORT_CONTACT.displayPhone}</p>
              </div>
            </div>
          </div>

          <a
            href={getSupportWhatsAppUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn-green w-full justify-center py-2.5 mb-3"
          >
            <MessageCircle size={17} />
            Hubungi via WhatsApp
          </a>

          <Link to="/login" className="btn-secondary w-full justify-center py-2.5">
            <ArrowLeft size={17} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
