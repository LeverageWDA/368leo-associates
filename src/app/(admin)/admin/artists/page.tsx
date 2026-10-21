import { PageHeader, PhaseNotice } from '@/components/admin/ui';
import { gateAdminPage } from '@/server/auth/page-guard';

export const metadata = { title: 'Artists' };

export default async function ArtistsPage() {
  const gate = await gateAdminPage('content.edit');
  if (!gate.ok) return gate.view;
  return (
    <>
      <PageHeader eyebrow="ADMIN / ARTISTS" title="Artists" description="Artist profiles shown alongside their releases." />
      <PhaseNotice phase={2}>Create and edit artist profiles. Nothing is published until an owner (or an editor with publishing rights) publishes it.</PhaseNotice>
    </>
  );
}
