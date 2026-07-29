import { useEffect, useMemo, useState } from 'react';
import ActiveDailyCheckStatus from '../../components/driver/ActiveDailyCheckStatus';
import ChecklistProgress from '../../components/driver/ChecklistProgress';
import DriverHeader from '../../components/driver/DriverHeader';
import OptionalPhotoCard from '../../components/driver/OptionalPhotoCard';
import PhotoChecklistCard from '../../components/driver/PhotoChecklistCard';
import SubmitReportSection from '../../components/driver/SubmitReportSection';
import TireChecklistGrid from '../../components/driver/TireChecklistGrid';
import VehicleSelectionCard from '../../components/driver/VehicleSelectionCard';
import { STANDARD_PHOTO_ITEMS, REQUIRED_CHECKLIST_TOTAL } from '../../config/driverChecklist';
import { useAuth } from '../../context/useAuth';
import { useDailyCheckSession } from '../../hooks/useDailyCheckSession';
import { useDriverVehicles } from '../../hooks/useDriverVehicles';
import { useGeolocation } from '../../hooks/useGeolocation';
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

              <ChecklistProgress completedCount={0} totalCount={REQUIRED_CHECKLIST_TOTAL} />

              <section className="space-y-3" aria-label="Checklist foto standar">
                {STANDARD_PHOTO_ITEMS.map((item) => (
                  <PhotoChecklistCard key={item.id} item={item} />
                ))}
              </section>

              <TireChecklistGrid />

              <OptionalPhotoCard />
            </>
          )}
        </div>

        {isSessionActive && <SubmitReportSection />}
      </main>
    </div>
  );
}
