"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Dumbbell, Home, Mic, Settings } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "./ui";

const items = [
  { href: "/", key: "home", icon: Home },
  { href: "/learn", key: "learn", icon: BookOpen },
  { href: "/speak", key: "speak", icon: Mic },
  { href: "/practice", key: "practice", icon: Dumbbell },
  { href: "/progress", key: "progress", icon: BarChart3 },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Desktop side navigation */}
      <nav aria-label="Main" className="hidden md:flex fixed inset-y-0 start-0 w-60 flex-col gap-1 border-e border-border bg-card px-3 py-6">
        <Link href="/" className="px-3 pb-6 text-xl font-bold text-primary">English Coach</Link>
        {items.map(({ href, key, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-colors",
              isActive(href) ? "bg-primary-bg text-primary" : "text-muted hover:bg-surface hover:text-text")}>
            <Icon size={20} aria-hidden /> {t.nav[key]}
          </Link>
        ))}
        <div className="mt-auto">
          <Link href="/settings" aria-current={isActive("/settings") ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-3 font-medium", isActive("/settings") ? "bg-primary-bg text-primary" : "text-muted hover:bg-surface")}>
            <Settings size={20} aria-hidden /> {t.nav.settings}
          </Link>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom">
        <ul className="grid grid-cols-5">
          {items.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? "page" : undefined}
                className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium min-h-14",
                  isActive(href) ? "text-primary" : "text-muted")}>
                <Icon size={22} aria-hidden strokeWidth={isActive(href) ? 2.4 : 1.8} />
                {t.nav[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
