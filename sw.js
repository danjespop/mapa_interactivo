/* Guarda la web en el aparato para que funcione sin internet y la mantiene al día.
   Con conexión se sirve siempre lo último (y se guarda); sin conexión, o si la red tarda, lo guardado.
   El nombre de CACHE lo cambia herramientas/empaquetar.py cada vez que cambia algún fichero. */
var CACHE = 'atlas-estudio-1c7f2ff7';
var FICHEROS = ["./", "js/version.js", "index.html", "geografia.html", "locomotor.html", "manifest.webmanifest", "css/estilos.css", "css/fuentes.css", "css/modulos.css", "js/app.js", "js/cuerpo3d.js", "js/datos.js", "js/fuentes.js", "js/globo-datos.js", "js/globo.js", "js/locomotor-datos.js", "js/locomotor.js", "js/offline.js", "img/continentes.png", "img/relieve-africa.jpg", "img/relieve-america.jpg", "img/relieve-andalucia.jpg", "img/relieve-asia.jpg", "img/relieve-espana.jpg", "img/relieve-europa.jpg", "img/relieve-globo.jpg", "img/relieve-mundo.jpg", "img/relieve-oceania.jpg", "iconos/icono-180.png", "iconos/icono-192.png", "iconos/icono-512.png", "assets/anatomia/huesos/01_esqueleto_posterior.webp", "assets/anatomia/huesos/02_huesos_brazo_mano.webp", "assets/anatomia/huesos/03_esqueleto_frontal.webp", "assets/anatomia/huesos/04_huesos_pierna_pie.webp", "assets/anatomia/huesos/05_craneo_frontal.webp", "assets/anatomia/huesos/06_articulaciones_tipos.webp", "assets/anatomia/movimiento/11_brazo_extendido_anatomia.webp", "assets/anatomia/movimiento/12_secuencia_flexion.webp", "assets/anatomia/movimiento/13_flexion_extension_comparacion.webp", "assets/anatomia/movimiento/14_brazo_flexionado.webp", "assets/anatomia/movimiento/15_brazo_flexionado_detalle.webp", "assets/anatomia/movimiento/17_movimiento_voluntario_pelota.webp", "assets/anatomia/movimiento/20_reflejo_rotuliano.webp", "assets/anatomia/movimiento/29_reflejo_retirada_mano.webp", "assets/anatomia/musculos/07_musculatura_frontal.webp", "assets/anatomia/musculos/08_musculatura_posterior.webp", "assets/anatomia/musculos/09_tipos_musculos.webp", "assets/anatomia/musculos/10_musculos_cabeza_cuello.webp", "assets/anatomia/portada/26_portada_aparato_locomotor.webp", "assets/anatomia/salud/16_fractura_tibia.webp", "assets/anatomia/salud/18_esguince_tobillo.webp", "assets/anatomia/salud/19_esguince_tobillo_detalle.webp", "assets/anatomia/salud/21_calentamiento_estiramientos.webp", "assets/anatomia/salud/22_habitos_saludables.webp", "assets/anatomia/salud/23_postura_sentado.webp", "assets/anatomia/salud/24_postura_levantar_caja.webp", "assets/anatomia/salud/25_postura_pie.webp", "assets/anatomia/salud/27_contractura_cuello.webp", "assets/anatomia/salud/28_postura_dormir.webp", "assets/anatomia/salud/30_postura_mochila.webp", "assets/modelo3d/ATRIBUCIONES.md", "assets/modelo3d/LICENCIA_BODYPARTS3D.txt", "assets/modelo3d/LICENCIA_MAKEHUMAN.txt", "assets/modelo3d/LICENCIA_MARCHA_CMU.txt", "assets/modelo3d/LICENCIA_ORIGINAL.txt", "assets/modelo3d/REVISION_CAPAS.md", "assets/modelo3d/anatomia-datos.js", "assets/modelo3d/femenino-datos.js", "assets/modelo3d/femenino-manifest.json", "assets/modelo3d/manifest.json", "assets/modelo3d/ropa-datos.js", "vendor/THREE-LICENSE.txt"];

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
  var imagen = /\.(jpg|png|webp)$/.test(url.pathname);
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
