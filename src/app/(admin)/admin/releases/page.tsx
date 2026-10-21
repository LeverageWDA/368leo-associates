import { PageHeader, PhaseNotice } from '@/components/admin/ui';
import { gateAdminPage } from '@/server/auth/page-guard';

export const metadata = { title: 'Music Library' };

export default async function ReleasesPage() {
  const gate = await gateAdminPage('content.edit');
  if (!gate.ok) return gate.view;
  return (
    <>
      <PageHeader eyebrow="ADMIN / MUSIC LIBRARY" title="Music Library" description="Singles, EPs and albums: details, artwork, tracklists, drafts and publishing." />
      <PhaseNotice phase={2}>Create and edit releases and tracks, reorder tracklists, save drafts, preview, publish and archive. The database tables for this are already in place.</PhaseNotice>
    </>
  );
}
