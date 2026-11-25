import BrandLogo from './BrandLogo';

export default function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <aside className="auth-brand">
          <div>
            <BrandLogo className="w-28" />
            <p className="mt-2 text-sm text-blue-100">Operational Cars</p>
          </div>
          <div className="auth-brand-message">
            <p className="text-4xl font-semibold leading-tight tracking-tight text-white">Awali perjalanan<br />dengan pemeriksaan.</p>
            <p className="mt-5 max-w-xs text-sm leading-7 text-blue-100">Pemeriksaan harian dan laporan kendaraan operasional dalam satu aplikasi.</p>
          </div>
          <p className="hidden text-sm text-blue-100 md:block">Lintasarta · Daily Check</p>
        </aside>
        <div className="auth-content">{children}</div>
      </div>
    </main>
  );
}
