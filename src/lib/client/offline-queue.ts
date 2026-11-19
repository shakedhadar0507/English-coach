"use client";

/**
 * Durable outbox for learning results produced while offline (exercise
 * attempts, vocabulary reviews). Every queued request carries its own
 * idempotency key, so replaying it after a partial failure never double-counts.
 */
const DB_NAME = "english-coach";
const STORE = "outbox";

export interface QueuedRequest { id: string; url: string; body: unknown; createdAt: number; attempts: number }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>, store = STORE): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function enqueue(url: string, body: unknown, id: string) {
  await tx("readwrite", (s) => s.put({ id, url, body, createdAt: Date.now(), attempts: 0 } satisfies QueuedRequest));
  window.dispatchEvent(new CustomEvent("ec-outbox-changed"));
}

export async function pending(): Promise<QueuedRequest[]> {
  try { return await tx("readonly", (s) => s.getAll() as IDBRequest<QueuedRequest[]>); } catch { return []; }
}

let flushing = false;
/** Replays queued requests in order. 4xx (except 401/408/429) drops the item; network or 5xx keeps it. */
export async function flush(): Promise<number> {
  if (flushing || !navigator.onLine) return 0;
  flushing = true;
  let sent = 0;
  try {
    const items = (await pending()).sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      try {
        const res = await fetch(item.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(item.body) });
        if (res.ok || (res.status >= 400 && res.status < 500 && ![401, 408, 429].includes(res.status))) {
          await tx("readwrite", (s) => s.delete(item.id));
          sent++;
        } else break;
      } catch { break; }
    }
  } finally {
    flushing = false;
    window.dispatchEvent(new CustomEvent("ec-outbox-changed"));
  }
  return sent;
}

/** POST JSON; if the network fails, queue it and report `queued`. */
export async function postOrQueue<T>(url: string, body: Record<string, unknown>, idempotencyKey: string): Promise<{ ok: true; data: T } | { ok: false; queued: true } | { ok: false; queued: false; status: number; error?: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return { ok: true, data: (await res.json()) as T };
    const err = await res.json().catch(() => ({}));
    return { ok: false, queued: false, status: res.status, error: (err as { error?: string }).error };
  } catch {
    await enqueue(url, body, idempotencyKey);
    return { ok: false, queued: true };
  }
}

export async function cacheSet(key: string, value: unknown) {
  try { await tx("readwrite", (s) => s.put(value, key), "cache"); } catch { /* storage unavailable */ }
}
export async function cacheGet<T>(key: string): Promise<T | undefined> {
  try { return (await tx("readonly", (s) => s.get(key), "cache")) as T | undefined; } catch { return undefined; }
}
