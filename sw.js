/* Guarda la web en el aparato para que funcione sin internet y la mantiene al día.
   Con conexión se sirve siempre lo último (y se guarda); sin conexión, o si la red tarda, lo guardado.
   El nombre de CACHE lo cambia herramientas/empaquetar.py cada vez que cambia algún fichero. */
var CACHE = 'atlas-estudio-312a7fee';
var FICHEROS = ['./', 'index.html', 'css/estilos.css', 'js/version.js', 'js/datos.js', 'js/app.js', 'js/globo-datos.js', 'js/globo.js', 'manifest.webmanifest',
  'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/icono-180.png',
  'img/relieve-espana.jpg', 'img/relieve-andalucia.jpg', 'img/relieve-europa.jpg', 'img/relieve-america.jpg', 'img/relieve-africa.jpg',
  'img/relieve-asia.jpg', 'img/relieve-oceania.jpg', 'img/relieve-mundo.jpg', 'img/relieve-globo.jpg', 'img/continentes.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FICHEROS.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function conPlazo(promesa, ms) {
  return new Promise(function (ok, mal) { var t = setTimeout(function () { mal(new Error('lento')); }, ms); promesa.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); mal(e); }); });
}
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  var imagen = /\.(jpg|png)$/.test(url.pathname);
  e.respondWith(caches.open(CACHE).then(function (c) {
    var guardado = function () { return c.match(e.request, { ignoreSearch: true }); };
    if (imagen) return guardado().then(function (g) { return g || fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; }); });
    return conPlazo(fetch(e.request, { cache: 'no-cache' }), 3500).then(function (r) {
      if (!r.ok) throw new Error('respuesta ' + r.status);
      c.put(e.request, r.clone());
      return r;
    }).catch(function () { return guardado().then(function (g) { return g || fetch(e.request); }); });
  }));
});
