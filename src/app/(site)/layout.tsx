import type { Metadata, Viewport } from 'next';
import { PlayerChrome } from '@/components/site/PlayerChrome';
import { SiteEffects } from '@/components/site/SiteEffects';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { publicSiteUrl } from '@/lib/site-url';
import { fontVariables } from '@/lib/fonts';
import './site.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl()),
  title: 'Leo & Associates — Independent Music Label',
  description: 'Leo & Associates — independent music label. Explore the featured release.',
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#f7f6f2',
  viewportFit: 'cover',
};

// Marks the document as script-enabled before first paint so reveal styles
// apply without a flash (the prototype did this at the top of script.js).
const JS_FLAG = "document.documentElement.classList.add('js')";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
          <PlayerChrome />
        </div>
        <SiteEffects />
      </body>
    </html>
  );
}
