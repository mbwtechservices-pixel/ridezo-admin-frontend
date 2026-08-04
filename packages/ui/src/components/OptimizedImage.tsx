import type { ImgHTMLAttributes } from 'react';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Prefer modern formats when CDN supports query transforms */
  quality?: number;
  priority?: boolean;
}

/**
 * Progressive image helper:
 * - lazy loads by default
 * - uses async decoding
 * - optionally rewrites Cloudinary / CDN URLs for width + quality + webp
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 75,
  priority = false,
  className,
  ...rest
}: OptimizedImageProps) {
  const optimizedSrc = optimizeImageUrl(src, { width, quality });

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
      {...rest}
    />
  );
}

function optimizeImageUrl(
  src: string,
  opts: { width?: number; quality: number },
): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // Cloudinary delivery URL transform
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const transforms = [
      'f_auto',
      'q_auto',
      `q_${opts.quality}`,
      opts.width ? `w_${opts.width}` : null,
      'c_limit',
    ]
      .filter(Boolean)
      .join(',');
    return src.replace('/upload/', `/upload/${transforms}/`);
  }

  return src;
}
