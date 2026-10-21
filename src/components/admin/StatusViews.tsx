import { SignOutButton } from '@clerk/nextjs';

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <p className="font-mono text-[11px] tracking-[.14em] text-gold-text">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight">{title}</h1>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </main>
  );
}

export function NotConfigured({ what }: { what: 'authentication' | 'database' }) {
  return (
    <Panel eyebrow="ADMIN / UNAVAILABLE" title="Admin is not configured yet">
      <p>
        The {what === 'authentication' ? 'sign-in service (Clerk)' : 'database connection'} has not been set up for
        this environment, so the admin area is closed. No content can be viewed or changed until it is.
      </p>
      <p>Configuration steps are in the project&apos;s docs/setup.md.</p>
    </Panel>
  );
}

export function NoAccess() {
  return (
    <Panel eyebrow="ADMIN / ACCESS" title="This account doesn't have admin access">
      <p>
        You&apos;re signed in, but this account hasn&apos;t been invited to manage Leo &amp; Associates. Ask the label
        owner to invite the email address you signed in with, then sign in again.
      </p>
      <SignOutButton redirectUrl="/sign-in">
        <button className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold tracking-wide text-white hover:bg-gold-deep">
          Sign out
        </button>
      </SignOutButton>
    </Panel>
  );
}

export function Forbidden() {
  return (
    <section className="rounded-2xl border border-line bg-surface p-8">
      <p className="font-mono text-[11px] tracking-[.14em] text-gold-text">OWNER ONLY</p>
      <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight">You don&apos;t have permission to view this</h1>
      <p className="mt-3 text-sm text-muted">This section is restricted to the label owner.</p>
    </section>
  );
}
