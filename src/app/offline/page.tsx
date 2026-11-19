import Link from "next/link";
import { WifiOff } from "lucide-react";
import { en } from "@/i18n/messages/en";
import { he } from "@/i18n/messages/he";

// Static (no cookies) so the service worker can precache it; shows both languages.
export default function OfflinePage() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <WifiOff size={40} className="text-muted" />
        <section lang="he" dir="rtl"><h1 className="text-xl font-bold">{he.offline.title}</h1><p className="text-muted">{he.offline.body}</p></section>
        <section lang="en" dir="ltr"><h2 className="text-lg font-semibold">{en.offline.title}</h2><p className="text-muted">{en.offline.body}</p></section>
        <Link href="/" className="text-primary font-semibold">English Coach</Link>
      </div>
    </main>
  );
}
