import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { can, type AdminPrincipal } from '@/server/auth/permissions';
import { AdminNav } from './AdminNav';
import { ADMIN_NAV } from './nav-items';

export function AdminShell({ principal, children }: { principal: AdminPrincipal; children: React.ReactNode }) {
  const items = ADMIN_NAV.filter(i => !i.permission || can(principal, i.permission)).map(({ href, label }) => ({ href, label }));
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:h-screen lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
        <div className="mb-3 flex items-center justify-between lg:mb-8 lg:block">
          <Link href="/admin" className="font-heading text-lg font-bold tracking-tight">
            LEO <span className="text-gold-deep">&amp;</span> ASSOCIATES
            <span className="block font-mono text-[9px] font-medium tracking-[.16em] text-muted">LABEL ADMIN</span>
          </Link>
          <div className="lg:hidden">
            <UserButton />
          </div>
        </div>
        <AdminNav items={items} />
        <div className="mt-8 hidden border-t border-line pt-6 lg:block">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium">{principal.displayName ?? principal.email}</p>
              <p className="font-mono text-[10px] tracking-[.12em] text-gold-text">{principal.role}</p>
            </div>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" className="mt-4 block text-xs text-muted hover:text-ink">
            View public site ↗
          </a>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</main>
    </div>
  );
}
