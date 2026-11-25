import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import { loadDriverOverview } from '../utils/driverOverview';

export function useDriverOverview() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [todayCompletedCheck, setTodayCompletedCheck] = useState(null);
  const [todayStatus, setTodayStatus] = useState('loading');
  const requestRef = useRef(null);

  const reload = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setHistoryLoading(true);
    setHistoryError(null);
    setTodayStatus('loading');

    const result = await loadDriverOverview(apiClient, controller.signal);
    if (controller.signal.aborted) return;

    if (result.history.status === 'fulfilled') {
      setHistory(result.history.value);
    } else {
      setHistoryError('Gagal memuat riwayat pengecekan. Silakan coba lagi.');
    }
    if (result.today.status === 'fulfilled') {
      setTodayCompletedCheck(result.today.value);
      setTodayStatus('success');
    } else {
      setTodayStatus('error');
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    reload();
    return () => requestRef.current?.abort();
  }, [reload]);

  return { history, historyLoading, historyError, todayCompletedCheck, todayStatus, reload };
}
