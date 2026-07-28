export function getAuthenticatedHomePath(user) {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.role === 'driver') return '/dashboard';
  return '/access-denied';
}
