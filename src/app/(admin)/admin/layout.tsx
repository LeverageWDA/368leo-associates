import { AdminShell } from '@/components/admin/AdminShell';
import { gateAdminPage } from '@/server/auth/page-guard';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await gateAdminPage();
  if (!gate.ok) return gate.view;
  return <AdminShell principal={gate.principal}>{children}</AdminShell>;
}
