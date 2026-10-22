/** Shown on every page while development fixtures are enabled. */
export function DevFixtureBanner() {
  return (
    <div className="dev-banner" role="note">
      DEVELOPMENT FIXTURES ENABLED — sample data and a synthesised test signal, not label content.
    </div>
  );
}

/** A clearly labelled slot for content the label has not supplied yet. */
export function Pending({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return <p className={`pending pending-${tone}`}><span>To be supplied</span>{children}</p>;
}
