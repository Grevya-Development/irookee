import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

/** Deterministic palette for initials avatar fallbacks */
const GRADIENT_PALETTES = [
  'from-indigo-600 to-purple-600',
  'from-blue-600 to-indigo-600',
  'from-purple-600 to-pink-600',
  'from-teal-600 to-emerald-600',
  'from-rose-600 to-orange-600',
  'from-cyan-600 to-blue-600',
  'from-amber-600 to-orange-600',
  'from-violet-600 to-indigo-600',
];

export function getInitials(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }

  const cleanEmail = email?.trim();
  if (cleanEmail) {
    return cleanEmail.charAt(0).toUpperCase();
  }

  return 'U';
}

function getGradientForName(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}

export function sanitizeAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '/placeholder.svg') {
    return undefined;
  }
  return trimmed;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  email,
  className,
  fallbackClassName,
  alt,
}) => {
  const cleanSrc = useMemo(() => sanitizeAvatarUrl(src), [src]);
  const initials = useMemo(() => getInitials(name, email), [name, email]);
  const gradient = useMemo(() => getGradientForName(name || email || 'irookee'), [name, email]);

  return (
    <Avatar className={cn('relative h-10 w-10 shrink-0 select-none overflow-hidden rounded-full', className)}>
      {cleanSrc && (
        <AvatarImage
          src={cleanSrc}
          alt={alt || name || 'User Avatar'}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarFallback
        className={cn(
          'flex h-full w-full items-center justify-center font-bold text-white bg-gradient-to-tr',
          gradient,
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
