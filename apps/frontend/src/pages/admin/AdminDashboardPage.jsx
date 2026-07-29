import { useState, useEffect } from 'react';
import { Users, CheckCircle2, AlertTriangle, MessageSquare, RefreshCw, Car, CheckSquare, XCircle } from 'lucide-react';
import apiClient from '../../api/client';
import Avatar from '../../components/admin/ui/Avatar';
import { SkeletonCard, SkeletonLine } from '../../components/admin/ui/Skeleton';

function StatCard({ icon: Icon, iconBg, label, value, badge, loading, sublabel }) {
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
        {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicle'); // 'vehicle' or 'driver'

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

  const driverStats = data?.driver_stats || {
    total: data?.total_driver ?? 0,
    sudah_checking: data?.sudah_checking ?? 0,
    belum_checking: data?.belum_checking ?? [],
  };

  const vehicleStats = data?.vehicle_stats || {
    total: 0,
    sudah_checking: 0,
    belum_checking: [],
  };

  const driverPct = driverStats.total > 0 ? Math.round((driverStats.sudah_checking / driverStats.total) * 100) : 0;
  const vehiclePct = vehicleStats.total > 0 ? Math.round((vehicleStats.sudah_checking / vehicleStats.total) * 100) : 0;

  const belumVehicles = vehicleStats.belum_checking || [];
  const belumDrivers = driverStats.belum_checking || [];

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

      {/* Vehicle Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Car size={18} className="text-blue-600" />
          <h3 className="font-bold text-slate-800 text-base">Status Mobil Operasional Hari Ini</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <StatCard
            icon={Car}
            iconBg="bg-blue-50 text-blue-600"
            label="Total Mobil Aktif"
            value={vehicleStats.total}
            loading={loading}
          />
          <StatCard
            icon={CheckCircle2}
            iconBg="bg-emerald-50 text-emerald-600"
            label="Mobil Sudah Checked"
            value={vehicleStats.sudah_checking}
            badge={vehicleStats.total > 0 ? `${vehiclePct}%` : null}
            loading={loading}
          />
          <StatCard
            icon={XCircle}
            iconBg="bg-amber-50 text-amber-600"
            label="Mobil Belum Checked"
            value={belumVehicles.length}
            loading={loading}
          />
        </div>
      </div>

      {/* Driver Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} className="text-purple-600" />
          <h3 className="font-bold text-slate-800 text-base">Status Akun Driver Hari Ini</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <StatCard
            icon={Users}
            iconBg="bg-purple-50 text-purple-600"
            label="Total Akun Driver"
            value={driverStats.total}
            loading={loading}
          />
          <StatCard
            icon={CheckCircle2}
            iconBg="bg-green-50 text-green-600"
            label="Driver Sudah Check-in"
            value={driverStats.sudah_checking}
            badge={driverStats.total > 0 ? `${driverPct}%` : null}
            loading={loading}
          />
          <StatCard
            icon={AlertTriangle}
            iconBg="bg-red-50 text-red-500"
            label="Driver Belum Check-in"
            value={belumDrivers.length}
            loading={loading}
          />
        </div>
      </div>

      {/* Belum checking section with Dual Tab */}
      <div className="admin-card overflow-hidden">
        {/* Header with Tab Navigation */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Daftar Belum Checking Hari Ini</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pilih perspektif berdasarkan Mobil Operasional atau Akun Driver</p>
          </div>

          {/* Tab Switch Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vehicle'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Car size={14} />
              Berdasarkan Mobil ({belumVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'driver'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users size={14} />
              Berdasarkan Driver ({belumDrivers.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Vehicle Unchecked List */}
        {activeTab === 'vehicle' && (
          <div>
            {loading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-1">
                      <SkeletonLine className="w-32" />
                      <SkeletonLine className="w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : belumVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
                <p className="font-semibold text-slate-700">Semua mobil operasional sudah checked hari ini!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Seluruh armada mobil aktif telah melewati pemeriksaan fisik harian.
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1.5fr_1.5fr_auto] px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="th-cell p-0 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    Plat Nomor
                  </span>
                  <span className="th-cell p-0 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    Merek & Model
                  </span>
                  <span className="th-cell p-0 text-xs text-slate-400 font-semibold uppercase tracking-wide text-right">
                    Status Inspeksi
                  </span>
                </div>

                {belumVehicles.map((v) => (
                  <div
                    key={v.vehicle_id}
                    className="grid grid-cols-[1.5fr_1.5fr_auto] items-center px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                        <Car size={16} />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{v.plate_number}</span>
                    </div>

                    <span className="text-sm text-slate-600">{v.brand} {v.model}</span>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                        <XCircle size={12} />
                        Belum Di-checking
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Driver Unchecked List */}
        {activeTab === 'driver' && (
          <div>
            {loading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <SkeletonLine className="w-32" />
                      <SkeletonLine className="w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : belumDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <p className="font-semibold text-slate-700">Semua driver sudah check-in hari ini!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Tidak ada driver aktif yang belum melakukan pengecekan hari ini.
                </p>
              </div>
            ) : (
              <div>
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

                {belumDrivers.map((driver) => (
                  <div
                    key={driver.users_id}
                    className="grid grid-cols-[1fr_1fr_auto] items-center px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={driver.name} size="md" />
                      <span className="text-sm font-medium text-slate-800">{driver.name}</span>
                    </div>

                    <span className="text-sm text-slate-500">{driver.email}</span>

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
        )}
      </div>
    </div>
  );
}
