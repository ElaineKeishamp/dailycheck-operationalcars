export async function loadDriverOverview(client, signal) {
  const [history, today] = await Promise.allSettled([
    client.get('/daily-checks/my-history', { signal }).then(response => {
      if (!Array.isArray(response.data?.reports)) throw new Error('Respons riwayat tidak valid');
      return response.data.reports;
    }),
    client.get('/daily-checks/my-today', { signal }).then(response => {
      if (!Object.hasOwn(response.data || {}, 'daily_check')) throw new Error('Respons checking hari ini tidak valid');
      const check = response.data.daily_check;
      if (check !== null && (!check?.daily_id || !['submitted', 'incomplete'].includes(check.status))) {
        throw new Error('Respons checking hari ini tidak valid');
      }
      return check?.status === 'submitted' ? check : null;
    }),
  ]);
  return { history, today };
}
