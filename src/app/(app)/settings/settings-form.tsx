"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, LogOut, Share, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Badge, Button, Card, Notice } from "@/components/ui";

type Prefs = {
  locale: "he" | "en"; theme: "system" | "light" | "dark"; daily_minutes: number; accent: "american" | "british" | "australian"; voice_rate: number;
  correction_mode: "immediate" | "end_of_conversation"; timezone: string; reminder_enabled: boolean; reminder_time: string;
  monthly_ai_budget_usd: number; vocab_new_per_day: number;
};
const GOALS = ["everyday", "business", "academic", "travel", "job_interviews", "presentations", "general_fluency"] as const;

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function post(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export function SettingsForm({ prefs: p0, goals: g0, level, levelSource, email, aiSpent, push }: {
  prefs: Prefs; goals: string[]; level: string | null; levelSource: string | null; email: string; aiSpent: number; push: { configured: boolean; publicKey: string | null };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [prefs, setPrefs] = useState(p0);
  const [goals, setGoals] = useState(g0);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [pushState, setPushState] = useState<"unsupported" | "denied" | "off" | "on" | "loading">("loading");
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [standalone, setStandalone] = useState(false);
  const installEvt = useRef<(Event & { prompt: () => Promise<void> }) | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
    const onPrompt = (e: Event) => { e.preventDefault(); installEvt.current = e as Event & { prompt: () => Promise<void> }; setCanInstall(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setPushState("unsupported");
      if (Notification.permission === "denied") return setPushState("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setPushState(sub ? "on" : "off");
    })().catch(() => setPushState("unsupported"));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function save(patch: Partial<Prefs>, delay = 0) {
    setPrefs((cur) => ({ ...cur, ...patch }));
    if (patch.theme) {
      const dark = patch.theme === "dark" || (patch.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await post("/api/preferences", patch);
        setStatus("saved");
        if (patch.locale) router.refresh();
      } catch { setStatus("error"); }
    }, delay);
  }

  async function saveGoals(next: string[]) {
    if (!next.length) return;
    setGoals(next);
    try { await post("/api/goals", { goals: next }); setStatus("saved"); } catch { setStatus("error"); }
  }

  async function enablePush() {
    setPushMsg(null);
    if (!push.configured || !push.publicKey) { setPushMsg(t.settings.pushNotConfigured); return; }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushState(perm === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(push.publicKey) });
      await post("/api/push/subscribe", { subscription: sub.toJSON() });
      setPushState("on");
      if (!prefs.reminder_enabled) save({ reminder_enabled: true });
    } catch { setPushMsg(t.common.error); }
  }

  async function disablePush() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await post("/api/push/subscribe", { endpoint: sub.endpoint }, "DELETE").catch(() => {}); await sub.unsubscribe(); }
    setPushState("off");
  }

  async function testPush() {
    try { const r = await post("/api/push/test", {}); setPushMsg(r.sent ? t.settings.pushEnabled : t.settings.pushNotConfigured); } catch { setPushMsg(t.common.error); }
  }

  async function deleteAll() {
    const typed = window.prompt(t.settings.deleteConfirm);
    if (typed !== "DELETE") return;
    try { await post("/api/data/delete", { confirm: "DELETE" }); router.replace("/onboarding"); } catch { setStatus("error"); }
  }

  async function logout() {
    navigator.serviceWorker?.controller?.postMessage("clear-pages");
    await fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => {});
    window.location.href = "/login";
  }

  const seg = <T extends string>(value: T, options: readonly T[], label: (o: T) => string, onPick: (o: T) => void) => (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => <Button key={o} type="button" variant={value === o ? "primary" : "secondary"} aria-pressed={value === o} className="px-1 text-sm" onClick={() => onPick(o)}>{label(o)}</Button>)}
    </div>
  );
  const row = "flex flex-col gap-2";
  const input = "min-h-11 rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary";

  return (
    <div className="flex flex-col gap-4">
      {status === "error" && <Notice tone="danger">{t.settings.saveError}</Notice>}
      {status === "saved" && <p className="text-sm text-success" role="status">{t.common.saved}</p>}

      <Card className="flex flex-col gap-5">
        <div className={row}><span className="font-semibold">{t.settings.language}</span>
          {seg(prefs.locale, ["he", "en"] as const, (o) => (o === "he" ? "עברית" : "English"), (o) => save({ locale: o }))}</div>
        <div className={row}><span className="font-semibold">{t.settings.theme}</span>
          {seg(prefs.theme, ["system", "light", "dark"] as const, (o) => t.settings.themes[o], (o) => save({ theme: o }))}</div>
      </Card>

      <Card className="flex flex-col gap-5">
        <div className={row}>
          <span className="font-semibold">{t.settings.level}</span>
          <div className="flex items-center gap-2">
            <Badge tone="primary"><span dir="ltr">{level ?? "—"}</span></Badge>
            {levelSource && <span className="text-sm text-muted">{t.settings.levelSource[levelSource as keyof typeof t.settings.levelSource]}</span>}
            <Link href="/placement" className="ms-auto text-sm text-primary font-medium">{t.placement.retake}</Link>
          </div>
        </div>
        <div className={row}><span className="font-semibold">{t.settings.goals}</span>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} type="button" aria-pressed={goals.includes(g)} onClick={() => saveGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g])}
                className={`rounded-full px-3 py-1.5 text-sm border ${goals.includes(g) ? "bg-primary text-on-primary border-primary" : "border-border bg-surface"}`}>{t.goals[g]}</button>
            ))}
          </div></div>
        <label className={row}><span className="font-semibold">{t.settings.dailyMinutes}: <span className="tabular-nums">{prefs.daily_minutes}</span></span>
          <input type="range" min={5} max={90} step={5} value={prefs.daily_minutes} onChange={(e) => save({ daily_minutes: Number(e.target.value) }, 500)} /></label>
        <label className={row}><span className="font-semibold">{t.settings.vocabPerDay}: <span className="tabular-nums">{prefs.vocab_new_per_day}</span></span>
          <input type="range" min={0} max={30} step={1} value={prefs.vocab_new_per_day} onChange={(e) => save({ vocab_new_per_day: Number(e.target.value) }, 500)} /></label>
      </Card>

      <Card className="flex flex-col gap-5">
        <div className={row}><span className="font-semibold">{t.settings.accent}</span>
          {seg(prefs.accent, ["american", "british", "australian"] as const, (o) => t.accents[o], (o) => save({ accent: o }))}</div>
        <label className={row}><span className="font-semibold">{t.settings.voiceRate}: <span className="tabular-nums" dir="ltr">{prefs.voice_rate.toFixed(2)}×</span></span>
          <input type="range" min={0.5} max={1.5} step={0.05} value={prefs.voice_rate} onChange={(e) => save({ voice_rate: Number(e.target.value) }, 500)} /></label>
        <div className={row}><span className="font-semibold">{t.settings.correction}</span>
          {seg(prefs.correction_mode, ["immediate", "end_of_conversation"] as const, (o) => t.speak.correctionModes[o], (o) => save({ correction_mode: o }))}</div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold">{t.settings.notifications}</h2>
        <label className="flex items-center justify-between gap-3"><span>{t.settings.reminderEnabled}</span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" checked={prefs.reminder_enabled} onChange={(e) => save({ reminder_enabled: e.target.checked })} /></label>
        <label className="flex items-center justify-between gap-3"><span>{t.settings.reminderTime}</span>
          <input type="time" className={input} value={prefs.reminder_time} onChange={(e) => e.target.value && save({ reminder_time: e.target.value }, 600)} dir="ltr" /></label>
        <label className="flex items-center justify-between gap-3"><span>{t.settings.timezone}</span>
          <span className="flex items-center gap-2"><span className="text-sm text-muted" dir="ltr">{prefs.timezone}</span>
            <Button type="button" variant="ghost" className="min-h-9 px-2 text-sm" onClick={() => save({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })}>↻</Button></span></label>
        {pushState === "unsupported" && <Notice tone="warning">{t.settings.pushUnsupported}</Notice>}
        {pushState === "denied" && <Notice tone="warning">{t.settings.pushDenied}</Notice>}
        {pushState === "off" && <Button variant="secondary" onClick={enablePush}>{t.settings.pushEnable}</Button>}
        {pushState === "on" && (
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={testPush}>{t.settings.pushTest}</Button><Button variant="ghost" onClick={disablePush}>{t.common.close}</Button></div>
        )}
        {pushMsg && <p className="text-sm text-muted">{pushMsg}</p>}
      </Card>

      <Card className="flex flex-col gap-3">
        <label className={row}><span className="font-semibold">{t.settings.aiBudget}</span>
          <input type="number" min={0} max={15} step={0.5} className={input} value={prefs.monthly_ai_budget_usd} dir="ltr"
            onChange={(e) => { const v = Math.max(0, Math.min(15, Number(e.target.value) || 0)); save({ monthly_ai_budget_usd: v }, 700); }} /></label>
        <p className="text-sm"><span className="text-muted">{t.settings.aiUsage}: </span><span dir="ltr" className="tabular-nums">${aiSpent.toFixed(4)}</span></p>
        <p className="text-xs text-muted">{t.settings.aiNote}</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-bold">{t.install.title}</h2>
        {standalone ? <p className="text-success">{t.install.installed}</p> : (
          <>
            <ol className="list-decimal ps-5 flex flex-col gap-1 text-sm">
              <li>{t.install.step1}</li>
              <li className="flex-inline">{t.install.step2} <Share size={14} className="inline align-text-bottom" aria-hidden /></li>
              <li>{t.install.step3}</li>
              <li>{t.install.step4}</li>
            </ol>
            <p className="text-sm text-muted">{t.install.android}</p>
            {canInstall && <Button variant="secondary" onClick={() => installEvt.current?.prompt()}>{t.install.installButton}</Button>}
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-bold">{t.settings.privacy}</h2>
        <p className="text-sm text-muted leading-relaxed">{t.settings.privacyBody}</p>
        <a href="/api/data/export" className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-border bg-surface font-semibold" download><Download size={18} /> {t.settings.export}</a>
        <Button variant="danger" onClick={deleteAll}><Trash2 size={18} /> {t.settings.deleteAll}</Button>
      </Card>

      <Card className="flex items-center justify-between">
        <span className="text-sm text-muted" dir="ltr">{email}</span>
        <Button variant="ghost" onClick={logout}><LogOut size={18} /> {t.settings.logout}</Button>
      </Card>
    </div>
  );
}
