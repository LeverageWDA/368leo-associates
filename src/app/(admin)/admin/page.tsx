import { Card, PageHeader, QuickLink, Stat } from '@/components/admin/ui';
import { getOverview } from '@/server/admin/overview';
import { gateAdminPage } from '@/server/auth/page-guard';
import { can } from '@/server/auth/permissions';

export const metadata = { title: 'Overview' };

const ACTION_LABELS: Record<string, string> = {
  'admin.owner_provisioned': 'Owner invited',
  'admin.identity_linked': 'Administrator signed in for the first time',
};

export default async function OverviewPage() {
  const gate = await gateAdminPage();
  if (!gate.ok) return gate.view;
  const { principal } = gate;
  const data = await getOverview();
  const dateFmt = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <PageHeader
        eyebrow="ADMIN / OVERVIEW"
        title={`Welcome${principal.displayName ? `, ${principal.displayName}` : ''}.`}
        description="Your label at a glance. Engagement figures appear once analytics is connected."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="PUBLISHED RELEASES" value={data.publishedReleases} note="Releases currently visible on the public site." />
        <Stat label="WEBSITE VISITS" value={data.analytics.pageViews} note="Analytics not connected yet." />
        <Stat label="MUSIC PLAYS" value={data.analytics.plays} note="Tracked once the player and analytics are live." />
        <Stat label="SHOPIFY CLICKS" value={data.analytics.shopifyClicks} note="Outbound clicks to Shopify — not completed purchases." />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title="RECENT CHANGES">
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted">No changes recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recent.map(entry => (
                <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                  <span>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                    {entry.actor && <span className="text-muted"> · {entry.actor}</span>}
                  </span>
                  <time className="font-mono text-[11px] text-muted" dateTime={entry.createdAt.toISOString()}>
                    {dateFmt.format(entry.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="QUICK ACTIONS">
          <div className="grid gap-2">
            {can(principal, 'content.edit') && <QuickLink href="/admin/releases">Music library</QuickLink>}
            {can(principal, 'media.upload') && <QuickLink href="/admin/media">Media library</QuickLink>}
            {can(principal, 'content.edit') && <QuickLink href="/admin/website">Edit website content</QuickLink>}
            {can(principal, 'settings.manage') && <QuickLink href="/admin/settings">Settings &amp; access</QuickLink>}
          </div>
        </Card>
      </div>
    </>
  );
}
