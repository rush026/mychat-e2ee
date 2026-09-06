export default function Avatar({ src, name = '', size = 'md', isOnline, className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const dotSizeMap = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color from name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
  const gradients = [
    'from-primary-500 to-accent-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-violet-500 to-purple-500',
  ];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-surface-600`}
        />
      ) : (
        <div
          className={`
            ${sizeMap[size]}
            rounded-full flex items-center justify-center
            bg-gradient-to-br ${gradients[colorIndex]}
            font-semibold text-white
            ring-2 ring-surface-600
          `}
        >
          {initials || '?'}
        </div>
      )}
      {isOnline !== undefined && (
        <div
          className={`
            absolute -bottom-0.5 -right-0.5
            ${dotSizeMap[size]}
            rounded-full border-2 border-surface-800
            ${isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-surface-400'}
          `}
        />
      )}
    </div>
  );
}
