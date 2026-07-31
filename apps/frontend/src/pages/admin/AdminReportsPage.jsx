import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, FileX } from 'lucide-react';
import apiClient from '../../api/client';
import Avatar from '../../components/admin/ui/Avatar';
import { StatusBadge } from '../../components/admin/ui/Badge';
import { SkeletonTable } from '../../components/admin/ui/Skeleton';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const PAGE_SIZE = 10;

export default function AdminReportsPage() {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({ date: '', driver_id: '', vehicle_id: '' });
  const [search, setSearch] = useState('');

  // Data
  const [reports, setReports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Fetch dropdown options on mount
  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/users'),
      apiClient.get('/admin/vehicles'),
    ]).then(([usersRes, vehiclesRes]) => {
      setDrivers((usersRes.data.users || []).filter((u) => u.role === 'driver'));
      setVehicles(vehiclesRes.data.vehicles || []);
    }).catch(() => { /* silently fail for dropdowns */ });
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.driver_id) params.driver_id = filters.driver_id;
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id;
      const res = await apiClient.get('/admin/daily-checks', { params });
      setReports(res.data.reports || []);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({ date: '', driver_id: '', vehicle_id: '' });
    setSearch('');
  };

  // Client-side search filter
  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.driver_name?.toLowerCase().includes(q) ||
      r.plate_number?.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-w-0 space-y-5 animate-fade-in">
      {/* Filters */}
      <div className="admin-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {/* Date */}
          <div className="flex min-w-0 flex-col gap-1 sm:w-44">
            <label className="text-xs font-medium text-slate-500">Filter Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>

          {/* Driver */}
          <div className="flex min-w-0 flex-col gap-1 sm:w-44">
            <label className="text-xs font-medium text-slate-500">Driver</label>
            <select
              className="form-select"
              value={filters.driver_id}
              onChange={(e) => handleFilterChange('driver_id', e.target.value)}
            >
              <option value="">Semua Driver</option>
              {drivers.map((d) => (
                <option key={d.users_id} value={d.users_id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div className="flex min-w-0 flex-col gap-1 sm:w-44">
            <label className="text-xs font-medium text-slate-500">Mobil</label>
            <select
              className="form-select"
              value={filters.vehicle_id}
              onChange={(e) => handleFilterChange('vehicle_id', e.target.value)}
            >
              <option value="">Semua Mobil</option>
              {vehicles.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>{v.plate_number} – {v.brand}</option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button onClick={handleReset} className="btn-secondary h-[42px] justify-center sm:justify-start">
            <RefreshCw size={14} />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Search + table */}
      <div className="admin-card overflow-hidden">
        {/* Search bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="form-input pl-9 py-2"
              placeholder="Cari nama driver atau plat nomor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <span className="text-sm text-slate-400">
            {!loading && `${filtered.length} laporan`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="p-5 flex items-center gap-3 bg-red-50 border-b border-red-100">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchReports} className="btn-secondary ml-auto px-2 py-1 text-xs">
              <RefreshCw size={13} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="th-cell">Tanggal</th>
                <th className="th-cell">Nama Driver</th>
                <th className="th-cell">Mobil</th>
                <th className="th-cell">Status</th>
                <th className="th-cell text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <SkeletonTable rows={6} cols={5} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileX size={36} className="text-slate-300" />
                      <p className="text-slate-500 font-medium">Tidak ada laporan ditemukan</p>
                      <p className="text-sm text-slate-400">Coba ubah filter atau kata kunci pencarian.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((report) => (
                  <tr key={report.daily_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="td-cell font-medium text-slate-700">
                      {formatDate(report.check_date)}
                    </td>
                    <td className="td-cell">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={report.driver_name} size="sm" />
                        <span className="font-medium text-slate-800">{report.driver_name}</span>
                      </div>
                    </td>
                    <td className="td-cell">
                      <div>
                        <p className="font-semibold text-slate-800">{report.plate_number}</p>
                        <p className="text-xs text-slate-400">{report.brand} {report.model}</p>
                      </div>
                    </td>
                    <td className="td-cell">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="td-cell text-right">
                      <button
                        onClick={() => navigate(`/admin/reports/${report.daily_id}`)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
              Menampilkan {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} Laporan
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === pg
                        ? 'bg-primary text-white border border-primary'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 ${page === totalPages ? 'bg-primary text-white border-primary' : ''}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
