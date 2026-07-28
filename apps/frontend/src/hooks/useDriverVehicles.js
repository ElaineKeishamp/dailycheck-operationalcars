import { useCallback, useEffect, useState } from 'react';
import { getActiveVehicles } from '../services/driverVehicleService';

const GENERAL_VEHICLE_ERROR = 'Gagal memuat data kendaraan.';

export function useDriverVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadVehicles() {
      setLoading(true);
      setError(null);

      try {
        const activeVehicles = await getActiveVehicles({ signal: controller.signal });
        if (!isMounted) return;

        setVehicles(activeVehicles);
        setError(null);
      } catch (err) {
        if (!isMounted || err.name === 'CanceledError' || err.name === 'AbortError') return;

        setVehicles([]);
        setError(GENERAL_VEHICLE_ERROR);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadVehicles();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  return {
    vehicles,
    loading,
    error,
    retry,
  };
}
