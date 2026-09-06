export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-600 text-slate-300',
    primary: 'bg-primary-500/15 text-primary-400 border border-primary-500/20',
    success: 'bg-green-500/15 text-green-400 border border-green-500/20',
    warning: 'bg-warning-500/15 text-warning-500 border border-warning-500/20',
    danger: 'bg-danger-500/15 text-danger-500 border border-danger-500/20',
    encrypted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
