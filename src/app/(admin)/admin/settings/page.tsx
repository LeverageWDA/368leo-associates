import { Card, PageHeader } from '@/components/admin/ui';
import { integrationStatus, listAdministrators, type IntegrationState } from '@/server/admin/settings';
import { gateAdminPage } from '@/server/auth/page-guard';

export const metadata = { title: 'Settings' };

const STATE_STYLES: Record<IntegrationState, { label: string; className: string }> = {
  connected: { label: 'Connected', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  not_configured: { label: 'Not configured', className: 'bg-red-50 text-danger border-red-200' },
  planned: { label: 'Planned', className: 'bg-canvas text-muted border-line' },
};

export default async function SettingsPage() {
  const gate = await gateAdminPage('settings.manage');
  if (!gate.ok) return gate.view;
  const admins = await listAdministrators();
  const integrations = integrationStatus();

  return (
    <>
      <PageHeader eyebrow="ADMIN / SETTINGS" title="Settings" description="Label information, administrator access and integrations. Visible to owners only." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="ADMINISTRATORS">
          <ul className="divide-y divide-line">
            {admins.map(a => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{a.displayName ?? a.email}</span>
                  {a.displayName && <span className="block truncate text-xs text-muted">{a.email}</span>}
                </span>
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-[.1em]">
                  <span className="text-gold-text">{a.role}</span>
                  {a.role === 'EDITOR' && <span className="text-muted">{a.canPublish ? 'CAN PUBLISH' : 'NEEDS APPROVAL'}</span>}
                  <span className="rounded-full border border-line px-2 py-0.5 text-muted">{a.status.toUpperCase()}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Inviting editors and changing roles arrives with content management (Phase 2).</p>
        </Card>

        <Card title="INTEGRATIONS">
          <ul className="divide-y divide-line">
            {integrations.map(i => (
              <li key={i.name} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="block font-medium">{i.name}</span>
                  <span className="block text-xs text-muted">{i.detail}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATE_STYLES[i.state].className}`}>
                  {STATE_STYLES[i.state].label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="LABEL INFORMATION" className="lg:col-span-2">
          <p className="text-sm text-muted">
            Label name, contact details and branding references will be editable here once the owner supplies them. Nothing
            has been filled in on the label&apos;s behalf.
          </p>
        </Card>
      </div>
    </>
  );
}
