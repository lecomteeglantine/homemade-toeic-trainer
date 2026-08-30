/* Homemade TOEIC Trainer — service worker v19 */
const CACHE = "homemade-toeic-v19";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./ht-kit.css", "./ht-kit.js", "./ht-errors.js", "./toeic-bank.js",
  "./constructeur-de-phrases.html", "./controle-vitesse-audio.html",
  "./detective-game.html", "./escape-game-toeic.html", "./exemple-placement.html",
  "./flashcards.html", "./grammar-time-machine.html", "./phrasal-verb-city.html",
  "./prononciation-ecoute.html", "./corporate-mysteries.html",
  "./successful-toeic-kingdom.html", "./survival-island-listening.html",
  "./zombie-prepositions-survival.html"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(u => c.add(u)))).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const network = fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit);
    return hit || network;
  }));
});
