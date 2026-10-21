import { PageHeader, PhaseNotice } from '@/components/admin/ui';
import { gateAdminPage } from '@/server/auth/page-guard';

export const metadata = { title: 'Website' };

export default async function WebsitePage() {
  const gate = await gateAdminPage('content.edit');
  if (!gate.ok) return gate.view;
  return (
    <>
      <PageHeader eyebrow="ADMIN / WEBSITE" title="Website" description="Homepage copy, featured release, about page, footer and social links." />
      <PhaseNotice phase={4}>Edit the public site&apos;s text in structured fields, preview changes, then publish.</PhaseNotice>
    </>
  );
}
