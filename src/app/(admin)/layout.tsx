import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { fontVariables } from '@/lib/fonts';
import { isClerkConfigured } from '@/server/env';
import './admin.css';

// Admin and sign-in pages are never indexed or cached.
export const metadata: Metadata = {
  title: { default: 'Admin — Leo & Associates', template: '%s — Leo & Associates Admin' },
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const page = (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
  if (!isClerkConfigured()) return page;
  return (
    <ClerkProvider signInUrl="/sign-in" signInFallbackRedirectUrl="/admin" afterSignOutUrl="/sign-in">
      {page}
    </ClerkProvider>
  );
}
