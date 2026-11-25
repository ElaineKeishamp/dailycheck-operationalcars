import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { SUPPORT_CONTACT, getSupportWhatsAppUrl } from '../config/support';

export default function ForgotPasswordPage() {
  const supportUrl = getSupportWhatsAppUrl();
  return (
    <AuthShell>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Lupa Password?</h1>
          <p className="text-sm text-slate-500 mb-5">
            Reset password dilakukan oleh Admin atau IT Support perusahaan Anda.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Kontak Bantuan</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{SUPPORT_CONTACT.name}</p>
                <p className="text-sm text-slate-500">{SUPPORT_CONTACT.displayPhone || 'Nomor bantuan belum diatur. Hubungi admin perusahaan secara langsung.'}</p>
              </div>
            </div>
          </div>

          {supportUrl && <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-green w-full justify-center py-2.5 mb-3"
          >
            <MessageCircle size={17} />
            Hubungi via WhatsApp
          </a>}

          <Link to="/login" className="btn-secondary w-full justify-center py-2.5">
            <ArrowLeft size={17} />
            Kembali ke Login
          </Link>
    </AuthShell>
  );
}
