/* Homemade TOEIC Trainer — service worker v22
   Root-site audit: reliable shell precache + cumulative audited games. */
const CACHE = "homemade-toeic-v22";
const CORE = [
  "./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./ht-kit.css", "./ht-kit.js", "./ht-errors.js", "./toeic-bank.js",
  "./sauvegarde-progression.html"
];
const OPTIONAL = [
  "./constructeur-de-phrases.html", "./controle-vitesse-audio.html",
  "./detective-game.html", "./escape-game-toeic.html", "./exemple-placement.html",
  "./flashcards.html", "./grammar-time-machine.html", "./phrasal-verb-city.html",
  "./prononciation-ecoute.html", "./corporate-mysteries.html",
  "./successful-toeic-kingdom.html", "./survival-island-listening.html",
  "./zombie-prepositions-survival.html", "./modal-galaxy-explorer.html"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(CORE.map(url => cache.add(url)))
        .then(() => Promise.allSettled(OPTIONAL.map(url => cache.add(url)))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(hit => {
      const network = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
