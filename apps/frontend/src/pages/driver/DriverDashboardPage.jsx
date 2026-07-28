import { useState } from 'react';
import ChecklistProgress from '../../components/driver/ChecklistProgress';
import DriverHeader from '../../components/driver/DriverHeader';
import OptionalPhotoCard from '../../components/driver/OptionalPhotoCard';
import PhotoChecklistCard from '../../components/driver/PhotoChecklistCard';
import SubmitReportSection from '../../components/driver/SubmitReportSection';
import TireChecklistGrid from '../../components/driver/TireChecklistGrid';
import VehicleSelectionCard from '../../components/driver/VehicleSelectionCard';
import { STANDARD_PHOTO_ITEMS, REQUIRED_CHECKLIST_TOTAL } from '../../config/driverChecklist';
import { TEMPORARY_VEHICLES } from '../../config/driverVehicles';
import { useAuth } from '../../context/useAuth';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [selectedVehicleId, setSelectedVehicleId] = useState(TEMPORARY_VEHICLES[0]?.id || '');
  const [sharedDriverName, setSharedDriverName] = useState('');

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-2xl px-4 py-4 sm:py-6">
        <div className="space-y-4 pb-4">
          <DriverHeader />

          <VehicleSelectionCard
            selectedVehicleId={selectedVehicleId}
            onVehicleChange={setSelectedVehicleId}
            isSharedAccount={Boolean(user?.is_shared_account)}
            driverName={sharedDriverName}
            onDriverNameChange={setSharedDriverName}
          />

          <ChecklistProgress completedCount={0} totalCount={REQUIRED_CHECKLIST_TOTAL} />

          <section className="space-y-3" aria-label="Checklist foto standar">
            {STANDARD_PHOTO_ITEMS.map((item) => (
              <PhotoChecklistCard key={item.id} item={item} />
            ))}
          </section>

          <TireChecklistGrid />

          <OptionalPhotoCard />
        </div>

        <SubmitReportSection />
      </main>
    </div>
  );
}
