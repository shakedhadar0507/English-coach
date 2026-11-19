import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { FeedbackButton } from "@/components/feedback-button";
import { requireUser } from "@/lib/server/session";
import { withUser } from "@/lib/server/db";
import { getProfile } from "@/lib/server/repo/user";
import { getT } from "@/lib/server/locale";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const profile = await withUser(user.id, getProfile);
  if (!profile.onboarded_at) redirect("/onboarding");
  const { t } = await getT();

  return (
    <div className="min-h-dvh">
      <AppNav />
      <div className="md:ps-60">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur safe-top">
          <Link href="/" className="font-bold text-primary text-lg">English Coach</Link>
          <Link href="/settings" aria-label={t.nav.settings} className="p-2 -m-2 rounded-full text-muted hover:text-text"><Settings size={22} /></Link>
        </header>
        <OfflineBanner />
        <main id="main" className="mx-auto max-w-3xl px-4 pt-2 pb-28 md:pt-8 md:pb-12">{children}</main>
      </div>
      <FeedbackButton />
    </div>
  );
}
