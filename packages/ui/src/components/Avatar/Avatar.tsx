export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, alt = '', initials, size = 'md', className = '' }: AvatarProps) {
  const baseClasses = [
    'inline-flex items-center justify-center rounded-full bg-ridezo-primary-100 font-medium text-ridezo-primary-700 overflow-hidden',
    sizeStyles[size],
    className,
  ].join(' ');

  if (src) {
    return (
      <img src={src} alt={alt} className={baseClasses} loading="lazy" />
    );
  }

  return (
    <span className={baseClasses} aria-label={alt || initials}>
      {initials ?? '?'}
    </span>
  );
}
