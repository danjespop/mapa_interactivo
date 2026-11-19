/* Guarda la web en el aparato para que funcione sin internet.
   Sirve primero lo guardado y, si hay conexión, lo renueva por detrás para la próxima vez. */
var CACHE = 'atlas-estudio-2';
var FICHEROS = ['./', 'index.html', 'css/estilos.css', 'js/datos.js', 'js/app.js', 'img/relieve-espana.jpg', 'img/relieve-andalucia.jpg',
  'manifest.webmanifest', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/icono-180.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHEROS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (guardado) {
      var red = fetch(e.request).then(function (r) { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(function () { return guardado; });
      return guardado || red;
    });
  }));
});
