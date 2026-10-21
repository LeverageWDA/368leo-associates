import { SignIn } from '@clerk/nextjs';
import { NotConfigured } from '@/components/admin/StatusViews';
import { isClerkConfigured } from '@/server/env';

export const metadata = { title: 'Sign in' };

export default function SignInPage() {
  if (!isClerkConfigured()) return <NotConfigured what="authentication" />;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="flex flex-col items-center gap-8">
        <p className="font-heading text-2xl font-bold tracking-tight">
          LEO <span className="text-gold-deep">&amp;</span> ASSOCIATES
        </p>
        {/* Sign-up is disabled in Clerk (restricted mode); access is by owner invitation only. */}
        <SignIn routing="path" path="/sign-in" withSignUp={false} />
      </div>
    </main>
  );
}
