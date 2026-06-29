export default function Avatar({ src, name, size = 'md' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src.startsWith('/') ? src : `/${src}`}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  );
}
