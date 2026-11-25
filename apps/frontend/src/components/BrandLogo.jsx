export default function BrandLogo({ className = '' }) {
  return (
    <div className={`relative aspect-[7/4] shrink-0 overflow-hidden rounded-lg ${className}`}>
      <img
        src="/brand/dailycheck-logo.jpg"
        alt="DailyCheck"
        width="2752"
        height="1536"
        className="absolute left-1/2 top-1/2 h-auto w-[190%] max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}
