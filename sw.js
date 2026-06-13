/* Homemade TOEIC Trainer — service worker (mode hors-ligne) */
const CACHE = "homemade-toeic-v10";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // La PAGE (HTML) : réseau d'abord → toujours à jour quand on est en ligne,
  // repli sur le cache si hors-ligne. Plus besoin de changer la version
  // du cache à chaque modif de contenu.
  const isPage =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isPage) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (_) {} }).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  // Les autres ressources (icônes, manifeste…) : cache d'abord, c'est suffisant.
  e.respondWith(
    caches.match(req).then(hit =>
      hit ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (_) {} }).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
