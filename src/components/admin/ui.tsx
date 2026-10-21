import Link from 'next/link';

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="mb-8">
      <p className="font-mono text-[11px] tracking-[.14em] text-gold-text">{eyebrow}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
    </header>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 font-mono text-[11px] font-medium tracking-[.12em] text-muted">{title}</h2>}
      {children}
    </section>
  );
}

/** A metric tile. `value: null` renders as unavailable, never as zero. */
export function Stat({ label, value, note }: { label: string; value: number | null; note: string }) {
  return (
    <Card>
      <p className="font-mono text-[11px] tracking-[.12em] text-muted">{label}</p>
      {value === null ? (
        <p className="mt-3 font-heading text-lg font-semibold text-muted">Unavailable</p>
      ) : (
        <p className="mt-2 font-heading text-4xl font-bold tracking-tight">{value.toLocaleString('en')}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>
    </Card>
  );
}

export function PhaseNotice({ phase, children }: { phase: number; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gold/60 bg-gold/5 p-6 text-sm leading-relaxed">
      <p className="font-mono text-[11px] tracking-[.12em] text-gold-text">ARRIVES IN PHASE {phase}</p>
      <div className="mt-2 text-ink/80">{children}</div>
    </div>
  );
}

export function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm font-medium transition-colors hover:border-gold hover:bg-gold/5"
    >
      {children} <span aria-hidden="true">↗</span>
    </Link>
  );
}
