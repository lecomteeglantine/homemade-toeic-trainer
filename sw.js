/* Homemade TOEIC Trainer — service worker (mode hors-ligne)
 *
 * Principe :
 *  - LES PAGES sont servies "reseau d'abord" : en ligne, on a toujours la
 *    derniere version (tes modifs s'affichent tout de suite) ; hors ligne,
 *    on retombe sur la copie mise en cache.
 *  - A l'installation, on precache TOUTES les pages + les scripts partages,
 *    pour que tout le site soit utilisable hors ligne des la 1re visite.
 *  - Les GROS MEDIAS (images, audio) sont mis en cache au fur et a mesure
 *    qu'ils sont consultes (pour ne pas tout telecharger d'un coup).
 *  - A chaque mise a jour, les anciens caches sont supprimes et le nouveau
 *    service worker prend la main : plus de cache fantome.
 *
 * Pour une modif de CONTENU (index.html...), rien a faire : la page est
 * rechargee depuis le reseau et la copie hors-ligne se met a jour seule.
 * Monte le numero ci-dessous (v12 -> v13...) si tu ajoutes/retires un
 * fichier dans la liste ASSETS, ou pour forcer un grand nettoyage.
 */

const CACHE = "homemade-toeic-v12";

/* Coquille du site precachee (petits fichiers : pages + scripts/styles). */
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./ht-kit.css", "./ht-kit.js", "./ht-errors.js", "./toeic-bank.js",
  "./constructeur-de-phrases.html", "./controle-vitesse-audio.html",
  "./detective-game.html", "./escape-game-toeic.html", "./exemple-placement.html",
  "./flashcards.html", "./grammar-time-machine.html", "./phrasal-verb-city.html",
  "./prononciation-ecoute.html"
];

/* Installation : on met chaque fichier en cache individuellement.
   (allSettled : si un fichier manque, l'installation reussit quand meme.) */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

/* Activation : suppression des anciens caches + prise de controle des onglets. */
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

  // AUTRES FICHIERS (scripts, styles, images, audio) :
  // cache d'abord, rafraichi en arriere-plan ; mis en cache a la 1re consultation.
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
