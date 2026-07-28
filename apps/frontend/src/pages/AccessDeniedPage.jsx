import { ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <ShieldOff size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini. 
          Halaman ini hanya tersedia untuk admin.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary justify-center py-2.5"
          >
            Ke Halaman Saya
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="btn-secondary justify-center py-2.5"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
