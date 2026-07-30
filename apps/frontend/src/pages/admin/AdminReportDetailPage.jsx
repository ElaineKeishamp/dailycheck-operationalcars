import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  Clock,
  User,
  Car,
  Camera,
  AlertTriangle,
  Gauge,
  Image as ImageIcon,
  X,
  Maximize2,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge, RoleBadge } from '../../components/admin/ui/Badge';
import { SkeletonLine } from '../../components/admin/ui/Skeleton';

// Map part_type to human-readable Indonesian labels
const PART_LABELS = {
  odo: 'Odometer (KM)',
  body_kiri: 'Body Kiri',
  body_kanan: 'Body Kanan',
  kap: 'Kap Depan',
  depan: 'Tampak Depan',
  belakang: 'Tampak Belakang',
  interior: 'Interior (Dashboard)',
  ban: 'Ban',
  lainnya: 'Lainnya',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
}

/**
 * PhotoCard — displays a single photo entry with MinIO Presigned URL & click-to-preview.
 */
function PhotoCard({ photo, onPreview }) {
  const hasNote = photo.note && photo.note.trim();
  const label = photo.part_type === 'ban' && photo.part_index
    ? `Ban ${photo.part_index}`
    : PART_LABELS[photo.part_type] || photo.part_type;
  const photoUrl = photo.url;

  return (
    <div 
      className="admin-card overflow-hidden group cursor-pointer hover:border-blue-300 transition-all duration-200"
      onClick={() => photoUrl && onPreview && onPreview(photo)}
    >
      {/* Photo area */}
      <div className="relative bg-slate-100 aspect-[4/3] flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={label} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy" 
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300 p-4 text-center">
            <ImageIcon size={36} />
            <span className="text-xs text-slate-400">Foto belum tersedia</span>
          </div>
        )}

        {/* Hover zoom overlay */}
        {photoUrl && (
          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/90 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
              <Maximize2 size={13} />
              Perbesar Foto
            </span>
          </div>
        )}

        {/* Damage badge overlay */}
        {hasNote && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow z-10">
            <AlertTriangle size={11} />
            CATATAN
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hasNote ? (
          <p className="text-xs text-red-600 mt-0.5 line-clamp-2">{photo.note}</p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5">Kondisi Normal</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{formatTime(photo.created_at)}</p>
      </div>
    </div>
  );
}

function InfoCard({ label, children }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/admin/daily-checks/${id}`);
        setReport(res.data.report);
        setPhotos(res.data.photos || []);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Laporan tidak ditemukan.');
        } else {
          setError(err.response?.data?.error || 'Gagal memuat detail laporan.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const banPhotos = photos.filter((p) => p.part_type === 'ban');
  const otherPhotos = photos.filter((p) => p.part_type !== 'ban');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={16} />
          Laporan Harian
        </button>
        <span className="text-slate-300">›</span>
        <span className="text-blue-600 font-medium uppercase text-xs tracking-wide">
          Detail View
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="admin-card p-8 flex flex-col items-center text-center gap-3">
          <AlertTriangle size={32} className="text-red-400" />
          <p className="font-semibold text-slate-700">{error}</p>
          <button
            onClick={() => navigate('/admin/reports')}
            className="btn-secondary"
          >
            Kembali ke Laporan
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="admin-card p-5 space-y-4">
            <SkeletonLine className="w-48 h-6" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && report && (
        <>
          {/* Info card */}
          <div className="admin-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Informasi Pemeriksaan
              </h2>
              <StatusBadge status={report.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Driver */}
              <InfoCard label="Driver">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span>
                    {report.actual_driver_name
                      ? `${report.actual_driver_name} (${report.driver_name || 'akun shared'})`
                      : report.driver_name || '—'}
                  </span>
                  {report.actual_driver_name && (
                    <RoleBadge role="driver" isShared />
                  )}
                </div>
              </InfoCard>

              {/* Vehicle */}
              <InfoCard label="Mobil Operasional">
                <div className="flex items-center gap-2">
                  <Car size={14} className="text-blue-500" />
                  <span className="font-bold">{report.plate_number}</span>
                  <span className="text-slate-500">({report.brand} {report.model})</span>
                </div>
              </InfoCard>

              {/* Location */}
              <InfoCard label="Lokasi Check-In">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-red-500" />
                  <span>{report.gps_address || `${report.gps_lat}, ${report.gps_long}` || '—'}</span>
                </div>
                {report.gps_lat && report.gps_long && (
                  <a
                    href={`https://maps.google.com/?q=${report.gps_lat},${report.gps_long}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 text-xs mt-2 hover:underline"
                  >
                    Lihat Map ↗
                  </a>
                )}
              </InfoCard>

              {/* Time */}
              <InfoCard label="Waktu Laporan">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span>{formatDateTime(report.created_at || report.check_date)}</span>
                </div>
              </InfoCard>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total photos */}
            <div className="admin-card p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Camera size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Foto Inspeksi</p>
                <p className="text-xl font-bold text-slate-900">{photos.length} <span className="text-sm font-normal text-slate-400">Upload MinIO</span></p>
              </div>
            </div>

            {/* Verification Status */}
            <div className="admin-card p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Status Pengecekan</p>
                <p className="text-base font-bold text-emerald-700 mt-0.5">Pemeriksaan Lengkap</p>
              </div>
            </div>
          </div>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="admin-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h3 className="font-semibold text-slate-900">Foto Pengecekan MinIO</h3>
                </div>
              </div>

              {/* Main photos grid */}
              {otherPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {otherPhotos.map((photo) => (
                    <PhotoCard key={photo.check_photos_id} photo={photo} onPreview={setSelectedPhoto} />
                  ))}
                </div>
              )}

              {/* Tire section */}
              {banPhotos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 pt-2 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">
                      🔄 Pengecekan Ban ({banPhotos.length} Sisi)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {banPhotos.map((photo) => (
                      <PhotoCard key={photo.check_photos_id} photo={photo} onPreview={setSelectedPhoto} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {photos.length === 0 && (
            <div className="admin-card p-8 flex flex-col items-center gap-3 text-center">
              <Camera size={32} className="text-slate-300" />
              <p className="text-slate-500 font-medium">Belum ada foto yang diupload</p>
            </div>
          )}
        </>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 text-white">
              <div>
                <h4 className="font-bold text-base">
                  {PART_LABELS[selectedPhoto.part_type] || selectedPhoto.part_type}
                </h4>
                <p className="text-xs text-slate-400">{formatDateTime(selectedPhoto.created_at)}</p>
              </div>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/50 min-h-[300px]">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.part_type} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Modal Footer Note */}
            {selectedPhoto.note && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-red-500 uppercase tracking-wide">Catatan/Kerusakan:</p>
                  <p className="text-slate-200">{selectedPhoto.note}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
