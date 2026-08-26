/* Pitää käyttöliittymän auki myös huonolla yhteydellä.
   API-kutsuja EI koskaan tallenneta välimuistiin.

   HUOM: strategia on "verkko ensin, välimuisti varalla" — ei enää
   "välimuisti ensin". Cache-first tallensi aiemmin tiedostot pysyvästi
   eikä koskaan tarkistanut olivatko ne muuttuneet, mikä piilotti uudet
   päivitykset. Nyt jokainen lataus hakee ensin tuoreen version verkosta
   ja päivittää välimuistin sen mukana; välimuistia käytetään vain jos
   verkko ei vastaa lainkaan. */

const CACHE = "jarvis-v3";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Vastaukset ovat aina tuoreita.
  if (url.pathname.startsWith("/api/")) return;
  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((fresh) => {
        const copy = fresh.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return fresh;
      })
      .catch(() => caches.match(e.request))
  );
});
