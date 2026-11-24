/* Cardume · service worker: guarda os arquivos do app para abrir rápido e sem internet.
   Dados (Firebase, Open-Meteo, Mapbox, IA) sempre vão para a rede. */
const CACHE = 'cardume-v1';
const FILES = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'js/config.js', 'js/platform.js', 'js/astro.js', 'js/moon.js', 'js/env.js', 'js/species.js', 'js/app.js', 'js/realmap.js', 'js/map.js', 'js/social.js', 'data/rio_land.json', 'data/spots.json', 'icons/icon.svg', 'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // APIs externas: direto na rede
  // rede primeiro (pega atualizações), cache como reserva sem internet
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
