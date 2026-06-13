/* Homemade TOEIC Trainer — service worker de RÉINITIALISATION
 *
 * But : effacer l'ancien cache hors-ligne qui restait "collé" sur les
 * appareils et empêchait les nouveautés (dont l'onglet Grammaire) de
 * s'afficher. Ce fichier supprime tous les caches, se désinstalle
 * lui-même, puis recharge les onglets ouverts. Après son passage, le
 * site se comporte comme un site web normal : il charge toujours la
 * dernière version en ligne. (Le mode hors-ligne est désactivé, ce qui
 * n'a aucun impact pour un usage normal.)
 */

self.addEventListener("install", function (e) {
  // Prendre la main immédiatement, sans attendre.
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    (async function () {
      // 1) Effacer TOUS les caches existants (y compris les anciens).
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      } catch (err) {}

      // 2) Se desinstaller : plus aucun service worker ne controlera le site.
      try { await self.registration.unregister(); } catch (err) {}

      // 3) Recharger les pages ouvertes pour qu'elles repartent du reseau.
      try {
        var clients = await self.clients.matchAll({ type: "window" });
        clients.forEach(function (client) {
          try { client.navigate(client.url); } catch (err) {}
        });
      } catch (err) {}
    })()
  );
});

// Pendant ce passage, ne rien servir depuis le cache : tout vient du reseau.
self.addEventListener("fetch", function (e) {
  e.respondWith(fetch(e.request).catch(function () {
    return new Response("", { status: 504, statusText: "Hors ligne" });
  }));
});
