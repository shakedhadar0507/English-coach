"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { flush, pending } from "@/lib/client/offline-queue";

export function OfflineBanner() {
  const { t } = useI18n();
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const refresh = async () => setQueued((await pending()).length);
    const goOnline = async () => { setOnline(true); await flush(); refresh(); };
    const goOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    refresh();
    if (navigator.onLine) flush().then(refresh);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("ec-outbox-changed", refresh);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("ec-outbox-changed", refresh);
    };
  }, []);

  if (online && queued === 0) return null;
  return (
    <div role="status" className="mx-4 mt-2 rounded-xl bg-warning-bg px-4 py-2 text-sm">
      {online ? t.common.online : t.common.offline}
    </div>
  );
}
