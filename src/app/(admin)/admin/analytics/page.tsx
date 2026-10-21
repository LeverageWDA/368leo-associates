import { PageHeader, PhaseNotice } from '@/components/admin/ui';
import { gateAdminPage } from '@/server/auth/page-guard';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const gate = await gateAdminPage();
  if (!gate.ok) return gate.view;
  return (
    <>
      <PageHeader eyebrow="ADMIN / ANALYTICS" title="Analytics" description="Visits, plays, completions and outbound clicks." />
      <PhaseNotice phase={5}>Page visits, music plays, track completions, and outbound Apple Music and Shopify clicks, with clear definitions and reporting periods. Outbound clicks are not purchases: sales happen on Shopify.</PhaseNotice>
    </>
  );
}
