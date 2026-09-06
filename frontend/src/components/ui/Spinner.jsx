export default function Spinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeMap[size]}
          rounded-full
          border-2 border-surface-500
          border-t-primary-500
          animate-spin
        `}
      />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 bg-surface-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-surface-600 border-t-primary-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-surface-700 border-b-accent-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-sm text-slate-400 animate-pulse-soft">Loading...</p>
      </div>
    </div>
  );
}
