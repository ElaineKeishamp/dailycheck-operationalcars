/**
 * StatusBadge — displays a colored pill badge based on status value.
 * 
 * Supported statuses:
 *   - submitted → green
 *   - pending_review → amber
 *   - incomplete → slate
 *   - needs_repair / perlu_perbaikan → red
 *   - active → green
 *   - inactive → slate
 */
export function StatusBadge({ status }) {
  const map = {
    submitted: { label: 'Submitted', className: 'badge-submitted' },
    pending_review: { label: 'Pending Review', className: 'badge-pending' },
    incomplete: { label: 'Incomplete', className: 'badge-incomplete' },
    needs_repair: { label: 'Perlu Perbaikan', className: 'badge-needs-repair' },
    perlu_perbaikan: { label: 'Perlu Perbaikan', className: 'badge-needs-repair' },
    active: { label: 'Aktif', className: 'badge-active' },
    inactive: { label: 'Nonaktif', className: 'badge-inactive' },
  };

  const config = map[status] ?? { label: status, className: 'badge-incomplete' };

  return (
    <span className={config.className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

/**
 * RoleBadge — displays role as colored badge.
 */
export function RoleBadge({ role, isShared }) {
  if (isShared) {
    return <span className="badge-shared">Driver Pengganti</span>;
  }
  if (role === 'admin') {
    return <span className="badge-admin">Admin</span>;
  }
  return <span className="badge-driver">Driver Utama</span>;
}

export default StatusBadge;
