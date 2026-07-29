import { useEffect, useMemo, useState } from 'react';
import ActiveDailyCheckStatus from '../../components/driver/ActiveDailyCheckStatus';
import CameraCaptureOverlay from '../../components/driver/CameraCaptureOverlay';
import ChecklistProgress from '../../components/driver/ChecklistProgress';
import DriverHeader from '../../components/driver/DriverHeader';
import OptionalPhotoCard from '../../components/driver/OptionalPhotoCard';
import PhotoChecklistCard from '../../components/driver/PhotoChecklistCard';
import SubmitReportSection from '../../components/driver/SubmitReportSection';
import TireChecklistGrid from '../../components/driver/TireChecklistGrid';
import VehicleSelectionCard from '../../components/driver/VehicleSelectionCard';
import { STANDARD_PHOTO_ITEMS } from '../../config/driverChecklist';
import { useAuth } from '../../context/useAuth';
import { useDailyCheckSession } from '../../hooks/useDailyCheckSession';
import { useDriverVehicles } from '../../hooks/useDriverVehicles';
import { useGeolocation } from '../../hooks/useGeolocation';
import { usePhotoChecklistDrafts } from '../../hooks/usePhotoChecklistDrafts';
import { usePhotoUploads } from '../../hooks/usePhotoUploads';
import { canStartDriverChecking } from '../../utils/driverPreparation';

export default function DriverDashboardPage() {
  const { user } = useAuth();
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
  const {
    dailyCheck,
    status: sessionStatus,
    error: sessionError,
    startDailyCheck,
    clearError: clearSessionError,
  } = useDailyCheckSession();
  const {
    photoDrafts,
    savePhotoDraft,
    requiredCapturedCount,
    requiredTotal,
    allRequiredCaptured,
  } = usePhotoChecklistDrafts();
  const {
    uploadStates,
    uploadPhoto,
    retryUpload,
    isUploadingAny,
    hasUploadFailures,
    uploadedRequiredCount,
    allRequiredUploaded,
  } = usePhotoUploads();
  const [selectedChecklistItem, setSelectedChecklistItem] = useState(null);
  const [cameraPreparationError, setCameraPreparationError] = useState(null);
  const isSharedAccount = Boolean(user?.is_shared_account);
  const isSessionActive = sessionStatus === 'active' && Boolean(dailyCheck);
  const selectedVehicle = useMemo(() => {
    return vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) || null;
  }, [selectedVehicleId, vehicles]);

  const canStartChecking = canStartDriverChecking({
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

  const handlePrepareStartChecking = async () => {
    if (!canStartChecking) return;

    await startDailyCheck({
      vehicleId: selectedVehicle.vehicle_id,
      actualDriverName: isSharedAccount ? actualDriverName : '',
      coordinates,
    });
  };

  const canOpenCamera = isSessionActive
    && coordinates
    && Number.isFinite(coordinates.latitude)
    && Number.isFinite(coordinates.longitude);

  const handleOpenCamera = (checklistItem) => {
    if (!canOpenCamera) {
      setCameraPreparationError('Lokasi checking belum tersedia. Kamera belum dapat dibuka.');
      return;
    }

    setCameraPreparationError(null);
    setSelectedChecklistItem(checklistItem);
  };

  const handleCloseCamera = () => {
    setSelectedChecklistItem(null);
  };

  const handleAcceptPhoto = ({ blob, capturedAt }) => {
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
    if (!draft) return;

    retryUpload({
      dailyCheckId: dailyCheck?.daily_id,
      draft,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
        <div className="space-y-4 pb-4">
          <DriverHeader />

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
            sessionStatus={sessionStatus}
            sessionError={sessionError}
            isSessionActive={isSessionActive}
          />

          {isSessionActive && (
            <>
              <ActiveDailyCheckStatus selectedVehicle={selectedVehicle} />

              {cameraPreparationError && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3" role="status" aria-live="polite">
                  <p className="text-sm text-red-600">{cameraPreparationError}</p>
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
                    disabled={!canOpenCamera}
                    uploadState={uploadStates[item.id]}
                    onOpenCamera={() => handleOpenCamera({
                      checklistId: item.id,
                      partType: item.id,
                      partIndex: null,
                      label: item.label,
                      isOptional: false,
                    })}
                    onRetryUpload={() => handleRetryUpload(photoDrafts[item.id])}
                  />
                ))}
              </section>

              <TireChecklistGrid
                photoDrafts={photoDrafts}
                disabled={!canOpenCamera}
                uploadStates={uploadStates}
                onOpenCamera={handleOpenCamera}
                onRetryUpload={handleRetryUpload}
              />

              <OptionalPhotoCard
                isCaptured={Boolean(photoDrafts.lainnya)}
                disabled={!canOpenCamera}
                uploadState={uploadStates.lainnya}
                onOpenCamera={() => handleOpenCamera({
                  checklistId: 'lainnya',
                  partType: 'lainnya',
                  partIndex: null,
                  label: 'Foto Tambahan',
                  isOptional: true,
                })}
                onRetryUpload={() => handleRetryUpload(photoDrafts.lainnya)}
              />
            </>
          )}
        </div>

        {isSessionActive && (
          <SubmitReportSection
            allRequiredCaptured={allRequiredCaptured}
            allRequiredUploaded={allRequiredUploaded}
            isUploadingAny={isUploadingAny}
            hasUploadFailures={hasUploadFailures}
          />
        )}
      </main>

      {selectedChecklistItem && canOpenCamera && (
        <CameraCaptureOverlay
          checklistItem={selectedChecklistItem}
          coordinates={coordinates}
          onClose={handleCloseCamera}
          onAcceptPhoto={handleAcceptPhoto}
        />
      )}
    </div>
  );
}
