import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, History, Calendar } from 'lucide-react';
import ActiveDailyCheckStatus from '../../components/driver/ActiveDailyCheckStatus';
import CameraCaptureOverlay from '../../components/driver/CameraCaptureOverlay';
import ChecklistProgress from '../../components/driver/ChecklistProgress';
import DailyCheckCompletedStatus from '../../components/driver/DailyCheckCompletedStatus';
import DeletePhotoConfirmationDialog from '../../components/driver/DeletePhotoConfirmationDialog';
import DriverHeader from '../../components/driver/DriverHeader';
import OptionalPhotoCard from '../../components/driver/OptionalPhotoCard';
import PhotoChecklistCard from '../../components/driver/PhotoChecklistCard';
import SubmitConfirmationDialog from '../../components/driver/SubmitConfirmationDialog';
import SubmitReportSection from '../../components/driver/SubmitReportSection';
import TireChecklistGrid from '../../components/driver/TireChecklistGrid';
import VehicleSelectionCard from '../../components/driver/VehicleSelectionCard';
import { getChecklistLabel, STANDARD_PHOTO_ITEMS, TIRE_CHECKLIST_ITEMS } from '../../config/driverChecklist';
import { useAuth } from '../../context/useAuth';
import { useDailyCheckSession } from '../../hooks/useDailyCheckSession';
import { useDriverOverview } from '../../hooks/useDriverOverview';
import { useDriverVehicles } from '../../hooks/useDriverVehicles';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePhotoChecklistDrafts } from '../../hooks/usePhotoChecklistDrafts';
import { usePhotoUploads } from '../../hooks/usePhotoUploads';
import { canStartDriverChecking } from '../../utils/driverPreparation';
import { formatDate, formatTime } from '../../utils/businessDate';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const {
    vehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    retry: retryVehicles,
  } = useDriverVehicles();
  const {
    status: locationStatus,
    coordinates,
    requestLocation,
    errorMessage: locationErrorMessage,
  } = useGeolocation({ requestOnMount: true });

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [actualDriverName, setActualDriverName] = useState('');
  const { history, historyLoading, historyError, todayCompletedCheck, todayStatus, reload: fetchHistoryAndToday } = useDriverOverview();

  const {
    dailyCheck,
    status: sessionStatus,
    error: sessionError,
    message: sessionMessage,
    missingParts,
    startDailyCheck,
    submitDailyCheck,
    clearError: clearSessionError,
  } = useDailyCheckSession();
  const {
    photoDrafts,
    savePhotoDraft,
    removePhotoDraft,
    requiredCapturedCount,
    requiredTotal,
    allRequiredCaptured,
  } = usePhotoChecklistDrafts();
  const {
    uploadStates,
    uploadPhoto,
    retryUpload,
    retryPhotoConfirmation,
    cancelPendingUpload,
    deleteUploadedPhoto,
    isUploadingAny,
    isDeletingAny,
    hasUploadFailures,
    uploadedRequiredCount,
    allRequiredUploaded,
    loadUploadedPhotos,
    restoreStatus,
    restoreError,
  } = usePhotoUploads();
  const [selectedChecklistItem, setSelectedChecklistItem] = useState(null);
  const [cameraPreparationError, setCameraPreparationError] = useState(null);
  const [deletePhotoError, setDeletePhotoError] = useState(null);
  const [deleteConfirmationItem, setDeleteConfirmationItem] = useState(null);
  const [submitConfirmationOpen, setSubmitConfirmationOpen] = useState(false);
  const isSharedAccount = Boolean(user?.is_shared_account);
  const isSubmitting = sessionStatus === 'submitting';
  const isSessionCompleted = sessionStatus === 'completed' || Boolean(todayCompletedCheck);
  const isSessionActive = sessionStatus === 'active' && Boolean(dailyCheck);
  const isSessionVisible = ['active', 'submitting', 'completed'].includes(sessionStatus) && Boolean(dailyCheck);

  const validChecklistIds = useMemo(() => new Set([
    ...STANDARD_PHOTO_ITEMS.map((item) => item.id),
    ...TIRE_CHECKLIST_ITEMS.map((item) => item.id),
    'lainnya',
  ]), []);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) || null;
  }, [selectedVehicleId, vehicles]);

  const canStartChecking = isOnline && todayStatus === 'success' && canStartDriverChecking({
    selectedVehicleId,
    selectedVehicle,
    isSharedAccount,
    actualDriverName,
    locationStatus,
    coordinates,
    vehiclesLoading,
    vehiclesError,
  });

  useEffect(() => {
    if (!selectedVehicleId) return;

    const selectedVehicleExists = vehicles.some((vehicle) => vehicle.vehicle_id === selectedVehicleId);
    if (!selectedVehicleExists) {
      setSelectedVehicleId('');
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    clearSessionError();
  }, [actualDriverName, clearSessionError, coordinates, locationStatus, selectedVehicleId, vehiclesError, vehiclesLoading]);

  useEffect(() => {
    if (!dailyCheck?.daily_id) return undefined;

    const controller = new AbortController();

    loadUploadedPhotos({
      dailyCheckId: dailyCheck.daily_id,
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [dailyCheck?.daily_id, loadUploadedPhotos]);

  const handlePrepareStartChecking = async () => {
    if (!canStartChecking || !isOnline) return;

    await startDailyCheck({
      vehicleId: selectedVehicle.vehicle_id,
      actualDriverName: isSharedAccount ? actualDriverName : '',
      coordinates,
    });
  };

  const canOpenCamera = isSessionActive
    && isOnline
    && !isSubmitting
    && !isSessionCompleted
    && restoreStatus === 'success'
    && coordinates
    && Number.isFinite(coordinates.latitude)
    && Number.isFinite(coordinates.longitude);
  const checklistDisabled = !canOpenCamera;
  const recoveryDisabled = !isSessionActive || !isOnline || isSubmitting || isSessionCompleted;
  const deletePhotoDisabled = !isSessionActive || isSubmitting || isSessionCompleted;
  const canSubmitReport = isSessionActive
    && isOnline
    && restoreStatus === 'success'
    && allRequiredUploaded
    && uploadedRequiredCount === requiredTotal
    && !isUploadingAny
    && !isDeletingAny
    && !hasUploadFailures
    && !isSubmitting;

  const handleRetryPhotoStatus = () => {
    if (!dailyCheck?.daily_id || !isOnline) return;

    const controller = new AbortController();
    loadUploadedPhotos({
      dailyCheckId: dailyCheck.daily_id,
      signal: controller.signal,
    }).catch(() => undefined);
  };

  const handleOpenCamera = (checklistItem) => {
    if (isSubmitting || isSessionCompleted) {
      setCameraPreparationError(null);
      return;
    }

    if (!dailyCheck?.daily_id) {
      setCameraPreparationError('Sesi checking belum tersedia. Kamera belum dapat dibuka.');
      return;
    }

    if (!isOnline) {
      setCameraPreparationError('Koneksi internet diperlukan untuk mengambil dan mengupload foto.');
      return;
    }

    if (restoreStatus !== 'success') {
      setCameraPreparationError('Memuat status foto. Kamera belum dapat dibuka.');
      return;
    }

    if (!validChecklistIds.has(checklistItem?.checklistId)) {
      setCameraPreparationError('Bagian foto tidak valid.');
      return;
    }

    if (uploadStates[checklistItem.checklistId]?.status === 'uploaded') {
      setCameraPreparationError(null);
      return;
    }

    if (!canOpenCamera) {
      setCameraPreparationError('Lokasi checking belum tersedia. Kamera belum dapat dibuka.');
      return;
    }

    setCameraPreparationError(null);
    setSelectedChecklistItem(checklistItem);
  };

  const handleOpenDeleteConfirmation = (checklistItem) => {
    setCameraPreparationError(null);

    if (!dailyCheck?.daily_id) {
      setDeletePhotoError('Sesi checking belum tersedia. Foto belum dapat dihapus.');
      return;
    }

    if (isSubmitting || isSessionCompleted) {
      setDeletePhotoError('Laporan sudah dikirim atau sedang dikirim. Foto tidak dapat dihapus.');
      return;
    }

    if (!isOnline) {
      setDeletePhotoError('Anda sedang offline. Sambungkan kembali internet sebelum menghapus foto.');
      return;
    }

    if (!validChecklistIds.has(checklistItem?.checklistId)) {
      setDeletePhotoError('Bagian foto tidak valid.');
      return;
    }

    if (uploadStates[checklistItem.checklistId]?.status !== 'uploaded') {
      setDeletePhotoError('Foto belum tersimpan di server.');
      return;
    }

    setDeletePhotoError(null);
    setDeleteConfirmationItem(checklistItem);
  };

  const handleCloseCamera = () => {
    setSelectedChecklistItem(null);
  };

  const handleAcceptPhoto = ({ blob, capturedAt }) => {
    if (
      isSubmitting
      || isSessionCompleted
      || !selectedChecklistItem
      || uploadStates[selectedChecklistItem.checklistId]?.status === 'uploaded'
    ) {
      return;
    }

    const acceptedDraft = {
      checklistId: selectedChecklistItem.checklistId,
      partType: selectedChecklistItem.partType,
      partIndex: selectedChecklistItem.partIndex,
      label: selectedChecklistItem.label,
      blob,
      capturedAt,
    };

    savePhotoDraft(acceptedDraft);
    uploadPhoto({
      dailyCheckId: dailyCheck?.daily_id,
      draft: acceptedDraft,
    });
  };

  const handleRetryUpload = (draft) => {
    if (!draft || isSubmitting || isSessionCompleted || !isOnline) return;

    retryUpload({
      dailyCheckId: dailyCheck?.daily_id,
      draft,
    });
  };

  const handleRetryPhotoConfirmation = async (checklistId) => {
    if (!dailyCheck?.daily_id) {
      setCameraPreparationError('Sesi checking belum tersedia. Foto belum dapat dikonfirmasi.');
      return;
    }

    const result = await retryPhotoConfirmation({
      dailyCheckId: dailyCheck.daily_id,
      checklistId,
      isOnline,
      isSubmitting,
    });

    if (!result.ok) {
      setCameraPreparationError(result.errorMessage || 'Gagal mengonfirmasi foto. Silakan coba lagi.');
    } else {
      setCameraPreparationError(null);
    }
  };

  const handleCancelPendingUpload = async (checklistId) => {
    if (!dailyCheck?.daily_id) {
      setCameraPreparationError('Sesi checking belum tersedia. Upload belum dapat dibatalkan.');
      return;
    }

    const result = await cancelPendingUpload({
      dailyCheckId: dailyCheck.daily_id,
      checklistId,
      hasLocalDraft: Boolean(photoDrafts[checklistId]),
      isOnline,
      isSubmitting,
    });

    if (!result.ok) {
      setCameraPreparationError(result.errorMessage || 'Gagal membatalkan upload tertunda.');
      return;
    }

    setCameraPreparationError(null);
  };

  const handleCloseDeleteConfirmation = () => {
    if (deleteConfirmationItem && uploadStates[deleteConfirmationItem.checklistId]?.isDeleting) return;
    setDeleteConfirmationItem(null);
  };

  const handleConfirmDeletePhoto = async () => {
    if (!deleteConfirmationItem || !dailyCheck?.daily_id) return;

    const result = await deleteUploadedPhoto({
      dailyCheckId: dailyCheck.daily_id,
      checklistId: deleteConfirmationItem.checklistId,
      isOnline,
      isSubmitting,
    });

    if (result.ok) {
      removePhotoDraft(deleteConfirmationItem.checklistId);
      setDeletePhotoError(null);
      setDeleteConfirmationItem(null);
      return;
    }

    setDeletePhotoError(result.errorMessage || 'Gagal menghapus foto. Silakan coba lagi.');
    setDeleteConfirmationItem(null);
  };

  const handleOpenSubmitConfirmation = () => {
    if (!canSubmitReport || !isOnline) return;
    setSubmitConfirmationOpen(true);
  };

  const handleCloseSubmitConfirmation = () => {
    if (isSubmitting) return;
    setSubmitConfirmationOpen(false);
  };

  const handleConfirmSubmit = async () => {
    if (!canSubmitReport || !dailyCheck?.daily_id) return;

    setSelectedChecklistItem(null);
    const submitted = await submitDailyCheck({ dailyCheckId: dailyCheck.daily_id });
    if (submitted) {
      setSubmitConfirmationOpen(false);
      fetchHistoryAndToday();
      return;
    }

    setSubmitConfirmationOpen(false);
    loadUploadedPhotos({
      dailyCheckId: dailyCheck.daily_id,
    }).catch(() => undefined);
  };

  return (
    <div className="driver-workspace min-h-screen bg-[#F3F6FB]">
      <main className="mx-auto w-full max-w-2xl px-4 py-4 sm:py-8">
        <div className="space-y-4 pb-4">
          <DriverHeader />

          {todayStatus === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
              <p className="text-sm text-red-700">Gagal memeriksa laporan hari ini. Coba lagi sebelum memulai checking.</p>
              <button
                type="button"
                onClick={fetchHistoryAndToday}
                disabled={!isOnline}
                className="mt-3 min-h-11 cursor-pointer rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 active:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Coba Lagi
              </button>
            </div>
          )}          {todayCompletedCheck && !isSessionVisible && (
            <div className="bg-emerald-600 text-white rounded-xl p-5 shadow-lg flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 size={26} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white">Terima Kasih, Checking Hari Ini Selesai!</h3>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Anda telah menyelesaikan seluruh 11 foto pemeriksaan fisik kendaraan{' '}
                  <span className="font-bold underline">{todayCompletedCheck.plate_number}</span> hari ini pada {formatTime(todayCompletedCheck.created_at)}.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                    ✓ Status: Laporan Disubmit
                  </span>
                </div>
              </div>
            </div>
          )}

          {!todayCompletedCheck && (
            <VehicleSelectionCard
              vehicles={vehicles}
              vehiclesLoading={vehiclesLoading}
              vehiclesError={vehiclesError}
              selectedVehicleId={selectedVehicleId}
              onVehicleChange={setSelectedVehicleId}
              onRetryVehicles={retryVehicles}
              locationStatus={locationStatus}
              coordinates={coordinates}
              locationErrorMessage={locationErrorMessage}
              onRetryLocation={requestLocation}
              isSharedAccount={isSharedAccount}
              actualDriverName={actualDriverName}
              onActualDriverNameChange={setActualDriverName}
              canStartChecking={canStartChecking}
              onPrepareStartChecking={handlePrepareStartChecking}
              preparationMessage={sessionMessage}
              sessionStatus={sessionStatus}
              sessionError={sessionError}
              isSessionActive={isSessionVisible}
            />
          )}

          {isSessionVisible && (
            <>
              {isSessionCompleted ? (
                <DailyCheckCompletedStatus dailyCheck={dailyCheck} selectedVehicle={selectedVehicle} />
              ) : (
                <ActiveDailyCheckStatus selectedVehicle={selectedVehicle} />
              )}

              {cameraPreparationError && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3" role="status" aria-live="polite">
                  <p className="text-sm text-red-600">{cameraPreparationError}</p>
                </div>
              )}

              {deletePhotoError && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3" role="status" aria-live="polite">
                  <p className="text-sm text-red-600">{deletePhotoError}</p>
                </div>
              )}

              {sessionError && sessionStatus === 'active' && missingParts.length > 0 && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3" role="status" aria-live="polite">
                  <p className="text-sm font-semibold text-amber-800">
                    Laporan belum dapat dikirim. Masih ada foto wajib yang belum tersimpan.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700">
                    {missingParts.map((part) => (
                      <li key={`${part.checklist_id}-${part.part_index ?? 'x'}`}>
                        {getChecklistLabel(part.checklist_id)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {restoreStatus === 'loading' && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3" role="status" aria-live="polite">
                  <p className="text-sm text-blue-700">Memuat status foto...</p>
                </div>
              )}

              {restoreStatus === 'error' && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3" role="status" aria-live="polite">
                  <p className="text-sm text-amber-700">{restoreError}</p>
                  <button
                    type="button"
                    onClick={handleRetryPhotoStatus}
                    className="mt-3 min-h-10 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
                  >
                    Retry Status Foto
                  </button>
                </div>
              )}

              <ChecklistProgress
                capturedCount={requiredCapturedCount}
                uploadedCount={uploadedRequiredCount}
                totalCount={requiredTotal}
              />

              <section className="space-y-3" aria-label="Checklist foto standar">
                {STANDARD_PHOTO_ITEMS.map((item) => (
                  <PhotoChecklistCard
                    key={item.id}
                    item={item}
                    isCaptured={Boolean(photoDrafts[item.id])}
                    disabled={checklistDisabled}
                    recoveryDisabled={recoveryDisabled}
                    deleteDisabled={deletePhotoDisabled}
                    uploadState={uploadStates[item.id]}
                    onOpenCamera={() => handleOpenCamera({
                      checklistId: item.id,
                      partType: item.id,
                      partIndex: null,
                      label: item.label,
                      isOptional: false,
                    })}
                    onRetryUpload={() => handleRetryUpload(photoDrafts[item.id])}
                    onRetryConfirmation={() => handleRetryPhotoConfirmation(item.id)}
                    onCancelPendingUpload={() => handleCancelPendingUpload(item.id)}
                    onDeletePhoto={() => handleOpenDeleteConfirmation({
                      checklistId: item.id,
                      partType: item.id,
                      partIndex: null,
                      label: item.label,
                      isOptional: false,
                    })}
                  />
                ))}
              </section>

              <TireChecklistGrid
                photoDrafts={photoDrafts}
                disabled={checklistDisabled}
                recoveryDisabled={recoveryDisabled}
                deleteDisabled={deletePhotoDisabled}
                uploadStates={uploadStates}
                onOpenCamera={handleOpenCamera}
                onRetryUpload={handleRetryUpload}
                onRetryConfirmation={handleRetryPhotoConfirmation}
                onCancelPendingUpload={handleCancelPendingUpload}
                onDeletePhoto={handleOpenDeleteConfirmation}
              />

              <OptionalPhotoCard
                isCaptured={Boolean(photoDrafts.lainnya)}
                disabled={checklistDisabled}
                recoveryDisabled={recoveryDisabled}
                deleteDisabled={deletePhotoDisabled}
                uploadState={uploadStates.lainnya}
                onOpenCamera={() => handleOpenCamera({
                  checklistId: 'lainnya',
                  partType: 'lainnya',
                  partIndex: null,
                  label: 'Foto Tambahan',
                  isOptional: true,
                })}
                onRetryUpload={() => handleRetryUpload(photoDrafts.lainnya)}
                onRetryConfirmation={() => handleRetryPhotoConfirmation('lainnya')}
                onCancelPendingUpload={() => handleCancelPendingUpload('lainnya')}
                onDeletePhoto={() => handleOpenDeleteConfirmation({
                  checklistId: 'lainnya',
                  partType: 'lainnya',
                  partIndex: null,
                  label: 'Foto Tambahan',
                  isOptional: true,
                })}
              />
            </>
          )}          <section className="bg-white border border-slate-100 rounded-xl shadow-card p-4 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <History size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Riwayat Pengecekan 7 Hari Terakhir</h3>
            </div>

            {historyLoading ? (
              <div className="p-4 text-center text-xs text-slate-600" role="status">Memuat riwayat pengecekan...</div>
            ) : historyError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
                <p className="text-sm text-red-700">{historyError}</p>
                <button
                  type="button"
                  onClick={fetchHistoryAndToday}
                  disabled={!isOnline}
                  className="mt-3 min-h-11 cursor-pointer rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 active:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Muat Ulang Riwayat
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                <Calendar size={28} className="text-slate-300" />
                <p className="text-xs font-medium">Belum ada riwayat pengecekan dalam 7 hari terakhir.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((rep) => (
                  <div key={rep.daily_id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rep.plate_number} ({rep.brand} {rep.model})</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(rep.check_date || rep.created_at)} • {formatTime(rep.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">{rep.photo_count} Foto</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rep.status === 'submitted' ? 'Selesai' : 'Proses'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {isSessionVisible && !isSessionCompleted && (
          <SubmitReportSection
            allRequiredCaptured={allRequiredCaptured}
            canSubmit={canSubmitReport}
            submitting={isSubmitting}
            completed={isSessionCompleted}
            restoreStatus={restoreStatus}
            isUploadingAny={isUploadingAny}
            hasUploadFailures={hasUploadFailures}
            onSubmitClick={handleOpenSubmitConfirmation}
          />
        )}
      </main>

      {selectedChecklistItem && canOpenCamera && !isSubmitting && !isSessionCompleted && (
        <CameraCaptureOverlay
          checklistItem={selectedChecklistItem}
          coordinates={coordinates}
          onClose={handleCloseCamera}
          onAcceptPhoto={handleAcceptPhoto}
        />
      )}

      <SubmitConfirmationDialog
        open={submitConfirmationOpen}
        submitting={isSubmitting}
        onCancel={handleCloseSubmitConfirmation}
        onConfirm={handleConfirmSubmit}
      />

      <DeletePhotoConfirmationDialog
        open={Boolean(deleteConfirmationItem)}
        deleting={Boolean(deleteConfirmationItem && uploadStates[deleteConfirmationItem.checklistId]?.isDeleting)}
        photoLabel={deleteConfirmationItem?.label}
        onCancel={handleCloseDeleteConfirmation}
        onConfirm={handleConfirmDeletePhoto}
      />
    </div>
  );
}
