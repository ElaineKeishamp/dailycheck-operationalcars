/**
 * Skeleton loading components.
 */

export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`admin-card p-5 ${className}`}>
      <SkeletonLine className="w-1/3 mb-3" />
      <SkeletonLine className="w-1/2 h-8" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="td-cell">
          <SkeletonLine className={i === 0 ? 'w-24' : 'w-32'} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  );
}

export default SkeletonLine;
