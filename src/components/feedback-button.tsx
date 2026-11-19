"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Trash2, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Button, cn } from "@/components/ui";

interface Note { id: string; note: string; status: "open" | "done"; resolution: string | null; created_at: string }

const SIZE = 52;
const STORE = "ec-feedback-pos";
const strings = {
  he: { open: "הערות למסך הזה", title: "הערה על המסך", screen: "מסך", placeholder: "מה לתקן או לשפר כאן?", save: "שמירה", saving: "שומר…", saved: "נשמר", close: "סגירה", previous: "הערות קודמות במסך הזה", none: "אין עדיין הערות במסך הזה.", done: "טופל", pending: "ממתין", remove: "מחיקה", error: "השמירה נכשלה. נסה שוב.", hint: "אפשר לגרור את הכפתור לכל מקום." },
  en: { open: "Notes for this screen", title: "Note about this screen", screen: "Screen", placeholder: "What should be fixed or improved here?", save: "Save", saving: "Saving…", saved: "Saved", close: "Close", previous: "Earlier notes on this screen", none: "No notes on this screen yet.", done: "Fixed", pending: "Open", remove: "Delete", error: "Saving failed. Try again.", hint: "You can drag the button anywhere." },
};

function readPos(): { x: number; y: number } | null {
  try { const v = JSON.parse(localStorage.getItem(STORE) ?? "null"); return v && typeof v.x === "number" && typeof v.y === "number" ? v : null; } catch { return null; }
}

function clamp(x: number, y: number) {
  const maxX = window.innerWidth - SIZE - 8, maxY = window.innerHeight - SIZE - 8;
  return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
}

/** Draggable floating button that saves notes tied to the current screen. */
export function FeedbackButton() {
  const { locale } = useI18n();
  const s = strings[locale === "en" ? "en" : "he"];
  const path = usePathname() || "/";
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  // Opened for a specific path, so navigating away closes the sheet without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === path;
  const load = async (forPath: string) => {
    try {
      const r = await fetch(`/api/feedback?path=${encodeURIComponent(forPath)}`);
      if (r.ok) setNotes((await r.json()).notes);
    } catch { /* offline: keep the list as is */ }
  };
  const setOpen = (v: boolean) => {
    setOpenFor(v ? path : null);
    if (v) { setState("idle"); setNotes([]); load(path); }
  };
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);

  useEffect(() => {
    const place = () => {
      const saved = readPos();
      // Fraction-based so the button stays in a similar spot after rotation.
      setPos(saved ? clamp(saved.x * window.innerWidth, saved.y * window.innerHeight) : clamp(16, window.innerHeight - SIZE - 104));
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);


  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
    d.moved = true;
    setPos(clamp(e.clientX - d.dx, e.clientY - d.dy));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved && pos) {
      try { localStorage.setItem(STORE, JSON.stringify({ x: pos.x / window.innerWidth, y: pos.y / window.innerHeight })); } catch { /* private mode */ }
    } else setOpen(true);
  };

  const save = async () => {
    const note = text.trim();
    if (!note) return;
    setState("saving");
    const heading = document.querySelector("main h1, main h2")?.textContent?.trim().slice(0, 300);
    const context = {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      theme: document.documentElement.dataset.theme ?? "system",
      locale,
      search: window.location.search.slice(0, 300),
      standalone: window.matchMedia("(display-mode: standalone)").matches,
      userAgent: navigator.userAgent.slice(0, 300),
    };
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path, pageTitle: document.title.slice(0, 200), heading, note, context }) });
      if (!r.ok) throw new Error(String(r.status));
      setText("");
      setState("saved");
      load(path);
    } catch { setState("error"); }
  };

  const remove = async (id: string) => {
    const r = await fetch("/api/feedback", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (r.ok) setNotes((n) => n.filter((x) => x.id !== id));
  };

  if (!pos) return null;
  return (
    <>
      <button
        type="button"
        aria-label={s.open}
        title={s.hint}
        data-feedback-button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; }}
        style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE, touchAction: "none" }}
        className="fixed z-50 grid place-items-center rounded-full bg-primary text-on-primary shadow-lg ring-2 ring-white/70 dark:ring-black/40 opacity-90 active:opacity-100 select-none"
      >
        <MessageSquarePlus size={24} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={s.title} onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-lg max-h-[85dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-card p-5 pb-8 safe-bottom shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{s.title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={s.close} className="p-2 -m-2 rounded-full text-muted hover:text-text"><X size={22} /></button>
            </div>
            <p className="text-sm text-muted mb-3">{s.screen}:</p>
            <p dir="ltr" className="text-sm font-mono bg-surface rounded-lg px-3 py-1.5 mb-4 break-all">{path}</p>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); if (state !== "saving") setState("idle"); }}
              placeholder={s.placeholder}
              rows={4}
              maxLength={4000}
              dir="auto"
              autoFocus
              className="w-full rounded-xl border border-border bg-surface p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={save} disabled={!text.trim() || state === "saving"}>{state === "saving" ? s.saving : s.save}</Button>
              {state === "saved" && <span role="status" className="text-sm text-success">{s.saved}</span>}
              {state === "error" && <span role="alert" className="text-sm text-danger">{s.error}</span>}
            </div>

            <h3 className="mt-6 mb-2 text-sm font-semibold text-muted">{s.previous}</h3>
            {notes.length === 0 ? <p className="text-sm text-muted">{s.none}</p> : (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p dir="auto" className="text-sm whitespace-pre-wrap">{n.note}</p>
                      {n.status === "open" && (
                        <button type="button" onClick={() => remove(n.id)} aria-label={s.remove} className="p-1 text-muted hover:text-danger shrink-0"><Trash2 size={16} /></button>
                      )}
                    </div>
                    <span className={cn("mt-1 inline-block text-xs", n.status === "done" ? "text-success" : "text-muted")}>{n.status === "done" ? s.done : s.pending}</span>
                    {n.resolution && <p dir="auto" className="mt-1 text-xs text-muted">{n.resolution}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
