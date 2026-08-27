import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar, getInitials, sanitizeAvatarUrl } from '../UserAvatar';

describe('UserAvatar', () => {
  it('correctly extracts initials from full names and emails', () => {
    expect(getInitials('Harikanth S S', null)).toBe('HS');
    expect(getInitials('Kavin Kumar', null)).toBe('KK');
    expect(getInitials('Single', null)).toBe('SI');
    expect(getInitials('', 'test@example.com')).toBe('T');
    expect(getInitials(null, null)).toBe('U');
  });

  it('sanitizes invalid or placeholder avatar URLs', () => {
    expect(sanitizeAvatarUrl('')).toBeUndefined();
    expect(sanitizeAvatarUrl('   ')).toBeUndefined();
    expect(sanitizeAvatarUrl('null')).toBeUndefined();
    expect(sanitizeAvatarUrl('undefined')).toBeUndefined();
    expect(sanitizeAvatarUrl('/placeholder.svg')).toBeUndefined();
    expect(sanitizeAvatarUrl('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });

  it('renders fallback initials when no valid avatar URL is provided', () => {
    render(<UserAvatar src="" name="Harikanth S S" email="hari@example.com" />);
    expect(screen.getByText('HS')).toBeInTheDocument();
  });

  it('renders fallback initials when src is undefined or null', () => {
    render(<UserAvatar src={null} name="Alice Wonder" />);
    expect(screen.getByText('AW')).toBeInTheDocument();
  });
});
