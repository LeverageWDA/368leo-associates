import { describe, expect, it } from 'vitest';
import { PERMISSIONS, can, type Permission } from '@/server/auth/permissions';

const owner = { role: 'OWNER' as const, canPublish: false };
const editor = { role: 'EDITOR' as const, canPublish: false };
const publishingEditor = { role: 'EDITOR' as const, canPublish: true };

const OWNER_ONLY: Permission[] = [
  'content.archive',
  'media.delete',
  'platform_links.manage',
  'admins.manage',
  'settings.manage',
  'integrations.view',
  'audit.view',
];

describe('permission matrix', () => {
  it('grants owners every permission', () => {
    for (const p of PERMISSIONS) expect(can(owner, p)).toBe(true);
  });

  it('lets editors work on drafts, media and previews', () => {
    expect(can(editor, 'content.edit')).toBe(true);
    expect(can(editor, 'content.preview')).toBe(true);
    expect(can(editor, 'media.upload')).toBe(true);
  });

  it.each(OWNER_ONLY)('denies editors the owner-only permission %s', p => {
    expect(can(editor, p)).toBe(false);
    expect(can(publishingEditor, p)).toBe(false);
  });

  it('defaults editors to owner approval for publishing', () => {
    expect(can(editor, 'content.publish')).toBe(false);
  });

  it('lets an editor publish only when explicitly granted', () => {
    expect(can(publishingEditor, 'content.publish')).toBe(true);
  });

  it('denies unknown roles everything', () => {
    const bogus = { role: 'ADMIN' as unknown as 'OWNER', canPublish: true };
    for (const p of PERMISSIONS) expect(can(bogus, p)).toBe(false);
  });
});
