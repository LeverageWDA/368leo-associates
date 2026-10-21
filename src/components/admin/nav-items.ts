import type { Permission } from '@/server/auth/permissions';

export interface AdminNavItem {
  href: string;
  label: string;
  /** Hides the link for administrators without it. The page enforces it too. */
  permission?: Permission;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/releases', label: 'Music Library', permission: 'content.edit' },
  { href: '/admin/artists', label: 'Artists', permission: 'content.edit' },
  { href: '/admin/media', label: 'Media', permission: 'media.upload' },
  { href: '/admin/website', label: 'Website', permission: 'content.edit' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/settings', label: 'Settings', permission: 'settings.manage' },
];
