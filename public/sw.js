/* English Coach service worker: offline shell, page cache for visited lessons, push notifications. */
const VERSION = "ec-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  // Sent on sign-out so cached personal pages don't outlive the session.
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES));
});

async function trimPages(max = 60) {
  const cache = await caches.open(PAGES);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // API data is never cached here; the app has its own offline queue.

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && !res.redirected && !url.pathname.startsWith("/login")) {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy)).then(() => trimPages());
        }
        return res;
      } catch {
        return (await caches.match(req, { ignoreSearch: false })) || (await caches.match(req, { ignoreSearch: true })) || (await caches.match("/offline"));
      }
    })());
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "English Coach", body: "", url: "/" };
  try { data = { ...data, ...event.data.json() }; } catch { /* plain text */ }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: data.url }, lang: "he", dir: "auto" }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if ("focus" in c) { c.navigate(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
