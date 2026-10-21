import { PageHeader, PhaseNotice } from '@/components/admin/ui';
import { gateAdminPage } from '@/server/auth/page-guard';

export const metadata = { title: 'Media' };

export default async function MediaPage() {
  const gate = await gateAdminPage('media.upload');
  if (!gate.ok) return gate.view;
  return (
    <>
      <PageHeader eyebrow="ADMIN / MEDIA" title="Media" description="Cover artwork and authorized audio." />
      <PhaseNotice phase={3}>Upload artwork and audio with format and size checks. Private masters are kept separate from public playback files and are never served to visitors.</PhaseNotice>
    </>
  );
}
