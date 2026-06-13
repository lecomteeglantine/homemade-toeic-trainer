/* Homemade TOEIC Trainer — service worker (mode hors-ligne, sans cache "collant")
 *
 * Principe :
 *  - LA PAGE est servie "reseau d'abord" : en ligne, on a toujours la
 *    derniere version (tes modifs s'affichent tout de suite) ; hors ligne,
 *    on retombe sur la copie mise en cache.
 *  - Les AUTRES fichiers (icone, manifeste) sont servis depuis le cache,
 *    puis rafraichis en arriere-plan.
 *  - A chaque mise a jour, les anciens caches sont supprimes automatiquement
 *    et le nouveau service worker prend la main : plus de cache fantome.
 *
 * Pour une modif de CONTENU (index.html), rien a faire : la page est
 * rechargee depuis le reseau et la copie hors-ligne se met a jour seule.
 * Ne change le numero ci-dessous (v11 -> v12...) que si tu modifies la
 * liste ASSETS ou que tu veux forcer un grand nettoyage.
 */

const CACHE = "homemade-toeic-v11";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

// Installation : on met la "coquille" du site en cache pour le hors-ligne.
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())   // appliquer la mise a jour sans attendre
      .catch(() => {})
  );
});

// Activation : suppression des anciens caches + prise de controle des onglets.
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

  // On ne gere que les fichiers du site lui-meme (meme origine).
  if (new URL(req.url).origin !== self.location.origin) return;

  const isPage =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isPage) {
    // PAGE : reseau d'abord, cache en secours si hors ligne.
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  // AUTRES FICHIERS : cache d'abord, rafraichi en arriere-plan.
  e.respondWith(
    caches.match(req).then(hit => {
      const network = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
