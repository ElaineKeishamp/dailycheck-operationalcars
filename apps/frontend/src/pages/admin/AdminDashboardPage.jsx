import { useState, useEffect } from 'react';
import { Users, CheckCircle2, AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import Avatar from '../../components/admin/ui/Avatar';
import { SkeletonCard, SkeletonLine } from '../../components/admin/ui/Skeleton';

function StatCard({ icon: Icon, iconBg, label, value, badge, loading }) {
  if (loading) return <SkeletonCard className="flex-1 min-w-[200px]" />;

  return (
    <div className="admin-card p-5 flex items-center gap-4 flex-1 min-w-[200px]">
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-current" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-3xl font-bold text-slate-900">{value ?? '—'}</span>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/dashboard/today');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalDriver = data?.total_driver ?? 0;
  const sudahChecking = data?.sudah_checking ?? 0;
  const belumList = data?.belum_checking ?? [];
  const belumCount = belumList.length;
  const pct = totalDriver > 0 ? Math.round((sudahChecking / totalDriver) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="ml-auto btn-secondary text-xs py-1 px-2"
          >
            <RefreshCw size={14} />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="flex flex-wrap gap-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
          label="Total Driver Aktif"
          value={totalDriver}
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-green-50 text-green-600"
          label="Sudah Checking Hari Ini"
          value={sudahChecking}
          badge={totalDriver > 0 ? `${pct}%` : null}
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-red-50 text-red-500"
          label="Belum Checking"
          value={belumCount}
          loading={loading}
        />
      </div>

      {/* Driver belum checking table */}
      <div className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Driver Belum Checking Hari Ini</h2>
          {!loading && belumList.length > 0 && (
            <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
              Lihat Semua
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonLine className="w-32" />
                  <SkeletonLine className="w-48" />
                </div>
                <div className="skeleton w-20 h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : belumList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-slate-700">Semua driver sudah checking!</p>
            <p className="text-sm text-slate-400 mt-1">
              Tidak ada driver yang belum melakukan pengecekan hari ini.
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto] px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="th-cell p-0 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Nama Driver
              </span>
              <span className="th-cell p-0 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Email
              </span>
              <span className="th-cell p-0 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Aksi
              </span>
            </div>

            {/* Table rows */}
            {belumList.map((driver) => (
              <div
                key={driver.users_id}
                className="grid grid-cols-[1fr_1fr_auto] items-center px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
              >
                {/* Name with avatar */}
                <div className="flex items-center gap-3">
                  <Avatar name={driver.name} size="md" />
                  <span className="text-sm font-medium text-slate-800">{driver.name}</span>
                </div>

                {/* Email */}
                <span className="text-sm text-slate-500">{driver.email}</span>

                {/* Contact button */}
                <a
                  href={`mailto:${driver.email}`}
                  className="btn-green text-xs py-2 px-3"
                >
                  <MessageSquare size={14} />
                  Hubungi
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
