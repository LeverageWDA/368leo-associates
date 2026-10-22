import type { Metadata } from 'next';
import { SocialLinks } from '@/components/site/SocialLinks';
import { CONTACT_LABEL, type ContactRoute } from '@/lib/catalog';
import { getSiteSettings } from '@/server/content/repository';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Bookings, press, collaboration and licensing enquiries for Leo & Associates.',
  alternates: { canonical: '/contact' },
};

const ROUTES: { kind: ContactRoute['kind']; about: string }[] = [
  { kind: 'bookings', about: 'Live performances and appearances.' },
  { kind: 'press', about: 'Interviews, features and press assets.' },
  { kind: 'collaboration', about: 'Artists, producers and creative partners.' },
  { kind: 'licensing', about: 'Sync, film, TV and advertising.' },
  { kind: 'general', about: 'Everything else.' },
];

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const emailFor = (kind: ContactRoute['kind']) => settings.contact.find(c => c.kind === kind)?.email ?? null;

  return (
    <main id="main" className="pg pg-contact">
      <header className="contact-head">
        <p className="pg-kicker">Contact</p>
        <h1 className="contact-word">LET&apos;S <em>talk.</em></h1>
      </header>

      <ul className="contact-routes">
        {ROUTES.map(({ kind, about }) => {
          const email = emailFor(kind);
          return (
            <li key={kind} className="contact-route">
              <h2>{CONTACT_LABEL[kind]}</h2>
              <p>{about}</p>
              {email ? (
                <a href={`mailto:${email}`} className="contact-email">{email}</a>
              ) : (
                <span className="contact-pending">Address to follow</span>
              )}
            </li>
          );
        })}
      </ul>

      <section className="contact-social" aria-labelledby="follow">
        <h2 id="follow" className="pg-label">Follow</h2>
        <SocialLinks links={settings.socials} className="contact-social-list" showHandles empty={<p className="muted-note muted-light">Social channels will be listed here once verified.</p>} />
      </section>
    </main>
  );
}
