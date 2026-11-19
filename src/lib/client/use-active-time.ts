"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Counts *active* learning seconds: the tab must be visible and the learner
 * must have interacted within the last 60 seconds. An idle open tab does not count.
 */
export function useActiveTime() {
  const seconds = useRef(0);
  const lastInteraction = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastInteraction.current = Date.now(); };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInteraction.current < 60_000) seconds.current += 1;
    }, 1000);
    return () => { clearInterval(timer); events.forEach((e) => window.removeEventListener(e, bump)); };
  }, []);

  /** Returns seconds accumulated since the last take() and resets the counter. */
  const take = useCallback(() => { const s = seconds.current; seconds.current = 0; return s; }, []);
  const peek = useCallback(() => seconds.current, []);
  return { take, peek };
}

export function newId(prefix = "c"): string {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${rand.replace(/-/g, "")}`.slice(0, 64);
}
