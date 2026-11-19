"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { Button, Card, Notice } from "@/components/ui";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email")).trim(), password: String(form.get("password")), rememberMe: true }),
      });
      if (res.status === 429) setError(t.auth.rateLimited);
      else if (!res.ok) setError(t.auth.invalid);
      else { router.replace("/"); router.refresh(); return; }
    } catch {
      setError(t.common.offline);
    }
    setBusy(false);
  }

  return (
    <Card className="w-full max-w-sm p-7">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center text-2xl font-bold" aria-hidden>E</div>
        <h1 className="text-2xl font-bold">{t.app.name}</h1>
        <p className="text-muted mt-1 text-sm">{t.app.tagline}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.auth.email}</span>
          <input name="email" type="email" required autoComplete="email" dir="ltr" inputMode="email"
            className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base focus:border-primary outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.auth.password}</span>
          <input name="password" type="password" required autoComplete="current-password" dir="ltr"
            className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base focus:border-primary outline-none" />
        </label>
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" disabled={busy} block>{busy ? t.auth.signingIn : t.auth.signIn}</Button>
      </form>
      <p className="mt-6 text-xs text-muted text-center leading-relaxed">{t.auth.privateApp}<br />{t.auth.forgot}</p>
    </Card>
  );
}
