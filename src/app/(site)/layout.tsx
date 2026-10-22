import type { Metadata, Viewport } from 'next';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { PlayerOverlay } from '@/components/player/PlayerOverlay';
import { PlayerProvider } from '@/components/player/PlayerProvider';
import { DevFixtureBanner } from '@/components/site/PageMarkers';
import { SiteEffects } from '@/components/site/SiteEffects';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { fontVariables } from '@/lib/fonts';
import { publicSiteUrl } from '@/lib/site-url';
import { devFixturesEnabled, getSiteSettings } from '@/server/content/repository';
import './site.css';
import './experience.css';
import './pages.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl()),
  title: { default: 'Leo & Associates — Independent Music Label', template: '%s — Leo & Associates' },
  description: 'Leo & Associates — independent music label. Explore the music, the artists and the label.',
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#f7f6f2',
  viewportFit: 'cover',
};

// Marks the document as script-enabled before first paint so reveal styles
// apply without a flash (the prototype did this at the top of script.js).
const JS_FLAG = "document.documentElement.classList.add('js')";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body>
        <PlayerProvider>
          <div className="site-shell">
            {devFixturesEnabled() && <DevFixtureBanner />}
            <SiteHeader socials={settings.socials} />
            {children}
            <SiteFooter socials={settings.socials} />
          </div>
          <MiniPlayer />
          <PlayerOverlay />
        </PlayerProvider>
        <SiteEffects />
      </body>
    </html>
  );
}
