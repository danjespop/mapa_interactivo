/* El service worker conserva ambos módulos después de la primera visita. */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(function () { /* El estudio sigue disponible sin caché. */ });
}
// Conservar enlaces antiguos a mapas que apuntaban a index.html#and, etc.
if (/\/(?:index\.html)?$/.test(location.pathname) && ['and','esp','ren','eur','ame','afr','asi','oce','mun','globo'].includes(location.hash.slice(1))) {
  location.replace('geografia.html'+location.hash);
}
