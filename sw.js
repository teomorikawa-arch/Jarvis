/* Salkku — palvelutyöntekijä: sovelluskuori välimuistiin, data aina verkosta */
const NIMI = "salkku-v2";
const KUORI = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(NIMI).then((c) => c.addAll(KUORI)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((avaimet) => Promise.all(avaimet.filter((a) => a !== NIMI).map((a) => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Rajapintakutsut menevät aina verkkoon, jotta kurssit ovat tuoreita
  if (url.hostname.includes("coingecko") || url.hostname.includes("finnhub") ||
      url.hostname.includes("cryptocompare") || url.hostname.includes("frankfurter")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((osuma) =>
      osuma || fetch(e.request).then((vastaus) => {
        if (vastaus.ok && url.origin === location.origin) {
          const kopio = vastaus.clone();
          caches.open(NIMI).then((c) => c.put(e.request, kopio));
        }
        return vastaus;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
