/* Atlas de estudio: mapa táctil con dos modos, Aprender y Jugar. Sin dependencias. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ATLAS = window.ATLAS, IMG = window.ATLAS_IMG || {};
  var $ = function (s) { return document.querySelector(s); };

  function h(tag, attrs, hijos) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'on') for (var ev in attrs.on) e.addEventListener(ev, attrs.on[ev]);
      else if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    }
    (hijos || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function s(tag, attrs, padre, texto) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (texto !== undefined) e.textContent = texto;
    if (padre) padre.appendChild(e);
    return e;
  }
  function baraja(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ── Progreso guardado en el dispositivo ── */
  var CLAVE = 'atlas-estudio-v1';
  var progreso = {};
  try { progreso = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { progreso = {}; }
  function guarda() { try { localStorage.setItem(CLAVE, JSON.stringify(progreso)); } catch (e) { /* sin almacenamiento: se juega igual */ } }
  function racha(m, id) { return (progreso[m.id] || {})[id] || 0; }
  function sabido(m, id) { return racha(m, id) >= 2; }
  function anota(m, id, bien) {
    var p = progreso[m.id] = progreso[m.id] || {};
    p[id] = bien ? Math.min(3, (p[id] || 0) + 1) : 0;
    guarda();
  }
  // Lugares que el alumno ha sacado del juego porque ya se los sabe
  var fuera = {};
  try { fuera = JSON.parse(localStorage.getItem(CLAVE + '-fuera')) || {}; } catch (e) { fuera = {}; }
  function estaFuera(m, id) { return !!(fuera[m.id] || {})[id]; }
  function ponFuera(m, id, si) {
    var f = fuera[m.id] = fuera[m.id] || {};
    if (si) f[id] = 1; else delete f[id];
    try { localStorage.setItem(CLAVE + '-fuera', JSON.stringify(fuera)); } catch (e) { /* se pierde al cerrar, nada más */ }
  }
  function cuenta(m, items) { return items.filter(function (it) { return sabido(m, it.id); }).length; }

  /* ── Colores de las formas ── */
  var COLOR = { monte: '#7a3d12', meseta: '#a35f00', llano: '#1b7a3c', mar: '#0f5fb3', isla: '#8a2c8f', costa: '#c9580a', rio: '#0a5fc0', ciudad: '#b3261e', nacional: '#177a2b', natural: '#0f5fa8' };
  var PROV = ['#c2410c', '#b45309', '#0e7490', '#15803d', '#7e22ce', '#be123c', '#1d4ed8', '#a16207'];
  function color(m, it) {
    if (it.pico) return '#4a2a12';
    if (it.c === 'prov') return PROV[it.col || 0];
    return COLOR[it.c] || '#7a3d12';
  }

  /* ── Geometría: distancia de un punto a un elemento (unidades del mapa) ── */
  function dSeg(px, py, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    var t = l ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0;
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  }
  function dLinea(px, py, pts, cerrada) {
    var d = Infinity;
    for (var i = 0; i < pts.length - 1; i++) d = Math.min(d, dSeg(px, py, pts[i], pts[i + 1]));
    if (cerrada) d = Math.min(d, dSeg(px, py, pts[pts.length - 1], pts[0]));
    return d;
  }
  function dentro(px, py, ring) {
    var c = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var a = ring[i], b = ring[j];
      if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function distancia(it, px, py) {
    if (it.k === 'p') return Math.max(0, Math.hypot(px - it.x, py - it.y) - it.r);
    if (it.k === 'l') {
      var dl = dLinea(px, py, it.pts);
      (it.mas || []).forEach(function (q) { dl = Math.min(dl, dLinea(px, py, q)); });
      return Math.max(0, dl - it.w);
    }
    var rings = it.k === 'a' ? it.pols : it.rings, n = 0, d = Infinity;
    rings.forEach(function (r) { if (dentro(px, py, r)) n++; d = Math.min(d, dLinea(px, py, r, true)); });
    return (it.k === 'a' ? n > 0 : n % 2 === 1) ? 0 : d;
  }
  function caja(it) {
    var pts = it.k === 'p' ? [[it.x - it.r, it.y - it.r], [it.x + it.r, it.y + it.r]]
      : it.k === 'l' ? it.pts : [].concat.apply([], it.k === 'a' ? it.pols : it.rings);
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, g = it.k === 'l' ? it.w : 0;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0] - g); y0 = Math.min(y0, p[1] - g); x1 = Math.max(x1, p[0] + g); y1 = Math.max(y1, p[1] + g); });
    return [x0, y0, x1, y1];
  }
  function tamano(it) { var c = caja(it); return (c[2] - c[0]) * (c[3] - c[1]); }
  function centroDe(it) { if (it.k === 'p') return [it.x, it.y]; if (it.lab) return [it.lab[0], it.lab[1]]; var c = caja(it); return [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2]; }

  /* ── Trazados ── */
  function recta(pts, cerrar) { return 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join('L') + (cerrar ? 'Z' : ''); }
  function curva(pts, cerrada) {
    // Catmull-Rom -> Bézier: contornos suaves para cordilleras y zonas dibujadas a mano.
    var n = pts.length, d = 'M' + pts[0][0] + ',' + pts[0][1];
    var en = function (i) { return cerrada ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; };
    for (var i = 0; i < (cerrada ? n : n - 1); i++) {
      var p0 = en(i - 1), p1 = en(i), p2 = en(i + 1), p3 = en(i + 2);
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' '
        + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0] + ',' + p2[1];
    }
    return d + (cerrada ? 'Z' : '');
  }

  /* ── Estado ── */
  var E = { mapa: null, tema: null, modo: 'aprender', sel: null, nombres: true, z: 1, tx: 0, ty: 0, ppu: 1, juego: null,
    ajustes: { que: 'tema', tipo: 'mezcla', nivel: 'normal', pc: 'si' } };
  try { var aj = JSON.parse(localStorage.getItem(CLAVE + '-ajustes')); if (aj) { E.ajustes = aj; if (!aj.pc) E.ajustes.pc = 'si'; } } catch (e) { /* por defecto */ }

  var svg = $('#svg'), lineasProv, vista, capaFormas, capaRotulos, capaMarcas;
  function u() { return 1 / (E.ppu * E.z); } // unidades del mapa por píxel de pantalla

  function itemsTema() { return E.mapa.items.filter(function (it) { return E.temas.indexOf(it.g) >= 0; }); }
  function hayRelieve() { return itemsTema().some(function (x) { return x.pico || x.c === 'monte' || x.c === 'meseta' || x.c === 'llano'; }); }
  function item(id) { return E.mapa.items.filter(function (it) { return it.id === id; })[0]; }

  /* ── Inicio ── */
  function pintaInicio() {
    var cont = $('#tarjetas');
    cont.replaceChildren();
    ATLAS.forEach(function (m) {
      var n = cuenta(m, m.items), tot = m.items.length;
      var foto = h('div', { class: 'foto', style: 'background-image:url(' + (IMG[m.img] || 'img/' + m.img) + ')' });
      if (m.id === 'ren') {
        var mini = s('svg', { viewBox: '0 0 ' + m.w + ' ' + m.h, preserveAspectRatio: 'xMidYMid slice' }, foto);
        m.items.forEach(function (it) { s('path', { d: it.rings.map(function (r) { return recta(r, true); }).join(''), fill: COLOR[it.c], 'fill-opacity': .75, 'fill-rule': 'evenodd' }, mini); });
      }
      cont.appendChild(h('button', { class: 'tarjeta', on: { click: function () { location.hash = m.id; } } }, [
        foto,
        h('div', { class: 'texto' }, [
          h('h2', { text: m.titulo }),
          h('div', { class: 'barrita' }, [h('i', { style: 'width:' + Math.round(100 * n / tot) + '%' })]),
          h('div', { class: 'cuenta', text: n ? n + ' de ' + tot + ' aprendidos' : tot + ' lugares para aprender' })
        ])
      ]));
    });
  }

  /* ── Pantalla de mapa ── */
  function abreMapa(m) {
    E.mapa = m; E.temas = [m.temas[0].id]; E.prov = false; E.modo = 'aprender'; E.sel = null; E.juego = null; E.nombres = true;
    $('#inicio').hidden = true; $('#mapa').hidden = false;
    $('#tituloMapa').textContent = m.titulo;
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 ' + m.w + ' ' + m.h);
    $('#mapa').style.setProperty('--ar', m.w + ' / ' + m.h);
    vista = s('g', {}, svg);
    if (m.id === 'ren') s('rect', { x: 0, y: 0, width: m.w, height: m.h, fill: '#fff' }, vista);
    s('image', { opacity: m.id === 'ren' ? .62 : 1, href: IMG[m.img] || 'img/' + m.img, x: 0, y: 0, width: m.w, height: m.h, preserveAspectRatio: 'none' }, vista);
    lineasProv = s('path', { class: 'prov', d: m.prov.map(function (r) { return recta(r, true); }).join('') }, vista);
    if (m.recuadro) s('rect', { class: 'recuadro', x: m.recuadro[0], y: m.recuadro[1], width: m.recuadro[2], height: m.recuadro[3] }, vista);
    capaFormas = s('g', {}, vista); capaRotulos = s('g', {}, vista); capaMarcas = s('g', {}, vista);
    reencuadra();
    pinta();
  }
  function mideEscenario() {
    var r = svg.getBoundingClientRect();
    if (r.width && E.mapa) E.ppu = Math.min(r.width / E.mapa.w, r.height / E.mapa.h);
  }
  function aplicaVista() {
    var m = E.mapa;
    E.z = Math.max(1, Math.min(8, E.z));
    E.tx = Math.min(0, Math.max(m.w * (1 - E.z), E.tx));
    E.ty = Math.min(0, Math.max(m.h * (1 - E.z), E.ty));
    vista.setAttribute('transform', 'translate(' + E.tx.toFixed(2) + ' ' + E.ty.toFixed(2) + ') scale(' + E.z.toFixed(4) + ')');
    var k = u();
    capaRotulos.querySelectorAll('[data-esc]').forEach(function (e) { e.setAttribute('transform', 'scale(' + k + ')'); });
    capaFormas.querySelectorAll('.pico').forEach(function (e) { e.setAttribute('transform', 'translate(' + e.dataset.x + ' ' + e.dataset.y + ') scale(' + k + ')'); });
    if (E.z !== despeje.z || capaRotulos.childNodes.length !== despeje.n) despeja();
  }
  // Si dos nombres se pisan, se queda el primero (el elegido y los grandes van antes); al ampliar aparecen los demás.
  var despeje = { z: 0, n: 0 };
  function despeja() {
    var puestos = [], grupos = Array.prototype.slice.call(capaRotulos.childNodes);
    grupos.forEach(function (g) { g.style.visibility = ''; });
    grupos.sort(function (a, b) { return (b.dataset.pri || 0) - (a.dataset.pri || 0); }).forEach(function (g) {
      var r = g.getBoundingClientRect(), m = 2;
      var choca = puestos.some(function (q) { return r.left < q.right - m && r.right > q.left + m && r.top < q.bottom - m && r.bottom > q.top + m; });
      if (choca && !(g.dataset.pri >= 9)) g.style.visibility = 'hidden'; else puestos.push(r);
    });
    despeje.z = E.z; despeje.n = grupos.length;
  }
  function reencuadra() { E.z = 1; E.tx = 0; E.ty = 0; mideEscenario(); aplicaVista(); }
  function zoomEn(f, cx, cy) { // cx, cy en unidades del viewBox
    var z0 = E.z, z1 = Math.max(1, Math.min(8, z0 * f));
    E.tx = cx - (cx - E.tx) * z1 / z0; E.ty = cy - (cy - E.ty) * z1 / z0; E.z = z1; aplicaVista();
  }
  function aMapa(ev) { // píxel de pantalla -> unidades del mapa
    var p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(vista.getScreenCTM().inverse());
    return [p.x, p.y];
  }
  function aCaja(ev) { var p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; }
  function asegura(it) { // si el elemento no se ve entero, vuelve a la vista completa
    var c = caja(it), m = E.mapa;
    var x0 = -E.tx / E.z, y0 = -E.ty / E.z, x1 = x0 + m.w / E.z, y1 = y0 + m.h / E.z;
    if (c[0] < x0 || c[1] < y0 || c[2] > x1 || c[3] > y1) reencuadra();
  }

  /* ── Dibujo de formas y rótulos ── */
  function forma(it, clase) {
    var g = s('g', { class: 'forma ' + (clase || ''), style: '--c:' + color(E.mapa, it), 'data-id': it.id }, capaFormas);
    if (it.c === 'rio') {
      var dr = [it.pts].concat(it.mas || []).map(function (q) { return recta(q, false); }).join('');
      s('path', { class: 'rio orilla', d: dr }, g); s('path', { class: 'rio', d: dr }, g);
    } else if (it.k === 'l') s('path', { class: 'eje', d: curva(it.pts, false), 'stroke-width': it.w * 2 }, g);
    else if (it.k === 'a') it.pols.forEach(function (p) {
      s('path', { class: 'zona' + (it.c === 'mar' ? ' marz' : it.marco ? ' marco' : ''), d: it.c === 'mar' ? recta(p, true) : curva(p, true) }, g);
    });
    else if (it.k === 'g') s('path', { class: 'zona' + (it.ha ? ' fuerte' : it.c !== 'prov' ? '' : E.modo === 'aprender' && hayRelieve() ? (E.mapa.ccaa ? ' borde fina' : ' borde') : E.mapa.ccaa ? ' deprov' : ''), 'fill-rule': 'evenodd', d: it.rings.map(function (r) { return recta(r, true); }).join('') }, g);
    else if (it.pico) {
      var t = s('path', { class: 'pico', d: 'M0,-10L9,7L-9,7Z' }, g);
      t.dataset.x = it.x; t.dataset.y = it.y;
    } else if (it.pto) {
      var pt = s('path', { class: 'pico', d: 'M0,-6.5A6.5,6.5 0 1,0 0,6.5A6.5,6.5 0 1,0 0,-6.5Z' }, g);
      pt.dataset.x = it.x; pt.dataset.y = it.y;
    } else s('circle', { class: 'aro' + (it.c === 'mar' ? ' marz' : ''), cx: it.x, cy: it.y, r: it.r }, g);
    return g;
  }
  var LADO = { C: [0, 0], N: [0, -1], S: [0, 1], E: [1, 0], O: [-1, 0], NE: [.8, -.6], NO: [-.8, -.6], SE: [.8, .6], SO: [-.8, .6] };
  function parte(txt) { // nombres largos en dos líneas
    if (txt.length < 20) return [txt];
    var m = Math.floor(txt.length / 2), i = txt.lastIndexOf(' ', m + 2), j = txt.indexOf(' ', m);
    var c = (i < 0 || (j >= 0 && j - m < m - i)) ? j : i;
    return c < 0 ? [txt] : [txt.slice(0, c), txt.slice(c + 1)];
  }
  function rotulo(it, clase) {
    var x, y, rot = 0, l = [0, 0], sep = 0;
    if (it.k === 'p') {
      var punta = it.pico || it.pto;
      l = LADO[it.lado || 'E']; sep = punta ? 13 : 7;
      x = it.x + l[0] * (punta ? 0 : it.r); y = it.y + l[1] * (punta ? 0 : it.r);
    } else if (it.bb && it.lado && it.lado !== 'C') {
      l = LADO[it.lado]; sep = 6;
      x = l[0] > .3 ? it.bb[2] : l[0] < -.3 ? it.bb[0] : (it.bb[0] + it.bb[2]) / 2;
      y = l[1] > .3 ? it.bb[3] : l[1] < -.3 ? it.bb[1] : (it.bb[1] + it.bb[3]) / 2;
    } else { x = it.lab[0]; y = it.lab[1]; rot = it.lab[2] || 0; }
    var ancla = l[0] > .3 ? 'start' : l[0] < -.3 ? 'end' : 'middle';
    var g = s('g', { class: 'rotulo ' + (clase || '') + (it.c === 'mar' ? ' mar' : it.c === 'rio' ? ' agua' : '') + (it.g !== 'unidades' && it.c !== 'mar' ? ' chico' : ''),
      transform: 'translate(' + x + ' ' + y + ') rotate(' + rot + ')' }, capaRotulos);
    var t = s('text', { 'data-esc': 1, 'text-anchor': ancla });
    g.appendChild(t);
    g.dataset.pri = clase === 'ok' || E.sel === it.id ? 9 : it.g === 'unidades' ? 3 : it.c === 'prov' ? 1 : 2;
    var lineas = parte(it.n).map(function (ln) { return [ln, '']; });
    if (it.alt) lineas.push([it.alt + ' m', 'alt']);
    var n = lineas.length, alto = 15;
    var y0 = l[1] < -.3 ? -(n - 1) * alto - 4 : l[1] > .3 ? 13 : 5 - (n - 1) * alto / 2;
    lineas.forEach(function (ln, i) { s('tspan', { class: ln[1], x: l[0] * sep, y: y0 + l[1] * sep + i * alto }, t, ln[0]); });
    return g;
  }

  function pinta() {
    var m = E.mapa, j = E.juego;
    document.querySelectorAll('.segmento button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.modo === E.modo); });
    // Temas
    var nav = $('#temas'); nav.replaceChildren();
    m.temas.forEach(function (t) {
      var its = m.items.filter(function (it) { return it.g === t.id; }), n = cuenta(m, its);
      nav.appendChild(h('button', { class: 'tema' + (n === its.length ? ' completo' : ''), 'aria-pressed': E.temas.indexOf(t.id) >= 0, title: t.sub,
        on: { click: function () {
          // Se pueden marcar varios temas a la vez; siempre queda al menos uno.
          var i = E.temas.indexOf(t.id);
          if (i < 0) E.temas.push(t.id); else if (E.temas.length > 1) E.temas.splice(i, 1);
          E.temas = m.temas.map(function (x) { return x.id; }).filter(function (id) { return E.temas.indexOf(id) >= 0; });
          E.sel = null; E.juego = null; pinta(); if (E.modo === 'jugar') hojaJuego();
        } } },
      [t.n, h('small', { text: n + '/' + its.length })]));
    });
    capaFormas.replaceChildren(); capaRotulos.replaceChildren(); capaMarcas.replaceChildren();
    $('#btnNombres').hidden = E.modo !== 'aprender';
    $('#btnImprimir').hidden = E.modo !== 'aprender';
    $('#btnBuscar').hidden = !!(j && !j.fin);
    if (E.modo !== 'aprender') E.amplio = false;
    $('#mapa').classList.toggle('amplio', !!E.amplio);
    $('#zAmplio').setAttribute('aria-pressed', !!E.amplio);
    $('#zAmplio').hidden = E.modo !== 'aprender';
    var fl = $('#flotante'), fit = E.amplio && E.sel && item(E.sel);
    fl.hidden = !fit; fl.replaceChildren();
    if (fit) { fl.appendChild(h('strong', { text: fit.n + (fit.alt ? ' · ' + fit.alt + ' m' : '') })); fl.appendChild(h('span', { text: fit.t + '. ' + fit.d })); }
    $('#btnNombres').textContent = E.nombres ? 'Ocultar nombres' : 'Mostrar nombres';
    var conProv = E.modo === 'aprender' && E.prov;
    if (m.provn && E.modo === 'aprender') nav.appendChild(h('button', { class: 'tema', 'aria-pressed': !!E.prov, title: 'Límites y nombres de las provincias',
      on: { click: function () { E.prov = !E.prov; pinta(); } } }, ['Provincias']));
    lineasProv.setAttribute('class', conProv ? 'prov marcada' : 'prov');
    $('#pregunta').hidden = !(j && !j.fin);
    nav.hidden = !!(j && !j.fin);
    if (E.modo === 'aprender') pintaAprender(); else pintaJuego();
    despeje.n = -1;
    aplicaVista();
  }

  /* ── Aprender ── */
  function pintaAprender() {
    var m = E.mapa, its = itemsTema();
    // Las formas grandes primero para que las pequeñas queden encima
    its.slice().sort(function (a, b) { return tamano(b) - tamano(a); }).forEach(function (it) {
      forma(it, E.sel === it.id ? 'sel' : E.sel ? 'tenue' : '');
    });
    if (m.ccaa && its.some(function (x) { return x.c === 'prov'; }))
      s('path', { class: 'ccaa', d: m.ccaa.map(function (r) { return recta(r, true); }).join('') }, capaFormas);
    its.forEach(function (it) { if (E.nombres || E.sel === it.id) rotulo(it, ''); });
    if (E.prov && m.provn) m.provn.forEach(function (pv) {
      if (its.some(function (x) { return x.c === 'prov' && x.n === pv[0]; })) return;
      var g = s('g', { class: 'rotulo provn', transform: 'translate(' + pv[1] + ' ' + pv[2] + ')' }, capaRotulos);
      s('text', { 'data-esc': 1, 'text-anchor': 'middle', y: 5 }, g, pv[0].toUpperCase());
    });
    var panel = $('#panel'); panel.replaceChildren();
    var it = E.sel && item(E.sel);
    if (it) {
      var chapas = [h('span', { class: 'chapa color', style: '--c:' + color(m, it), text: it.t })];
      if (it.alt) chapas.push(h('span', { class: 'chapa', text: it.alt + ' m' }));
      if (it.grupo) chapas.push(h('span', { class: 'chapa', text: it.grupo }));
      if (it.prov) chapas.push(h('span', { class: 'chapa', text: it.prov }));
      panel.appendChild(h('div', { class: 'ficha' }, [h('div', { class: 'chapas' }, chapas), h('h3', { text: it.n }), h('p', { text: it.d }),
        h('button', { class: 'enlace izq', text: estaFuera(m, it.id) ? 'No entra en el juego. Volver a preguntarlo' : 'Ya me lo sé: no preguntarlo en el juego',
          on: { click: function () { ponFuera(m, it.id, !estaFuera(m, it.id)); pinta(); } } })]));
    } else {
      panel.appendChild(h('p', { class: 'pista', text: E.nombres ? 'Toca una forma del mapa o un nombre de la lista para saber más. Arriba puedes marcar varios temas a la vez.' : 'Sin nombres: toca una forma e intenta decir cómo se llama antes de mirar.' }));
    }
    panel.appendChild(h('div', { class: 'lista' }, its.map(function (x) {
      return h('button', { 'aria-pressed': E.sel === x.id, class: (sabido(m, x.id) ? 'sabido' : '') + (estaFuera(m, x.id) ? ' fuera' : ''), text: x.n,
        on: { click: function () { E.sel = E.sel === x.id ? null : x.id; if (E.sel) asegura(x); pinta(); } } });
    })));
    panel.appendChild(h('button', { class: 'boton principal ancho', text: E.temas.length > 1 ? 'Jugar con los temas marcados' : 'Jugar con este tema', on: { click: function () { cambiaModo('jugar'); } } }));
  }
  function tocaAprender(p) {
    var tol = 14 * u(), mejor = null;
    itemsTema().forEach(function (it) {
      var d = distancia(it, p[0], p[1]);
      if (d <= tol && (!mejor || d < mejor.d - .01 || (Math.abs(d - mejor.d) <= .01 && tamano(it) < tamano(mejor.it)))) mejor = { it: it, d: d };
    });
    E.sel = mejor ? (E.sel === mejor.it.id ? null : mejor.it.id) : null;
    pinta();
  }

  /* ── Jugar ── */
  var NIVEL = { facil: { n: 'Fácil', tol: 30, pista: true }, normal: { n: 'Normal', tol: 16, pista: false }, dificil: { n: 'Difícil', tol: 7, pista: false } };
  function elige(etq, clave, ops) {
    return h('div', { class: 'grupo' }, [h('span', { text: etq }), h('div', { class: 'elige' }, ops.map(function (o) {
      return h('button', { 'aria-pressed': E.ajustes[clave] === o[0], text: o[1], on: { click: function () { E.ajustes[clave] = o[0]; hojaJuego(); } } });
    }))]);
  }
  function abreHoja(hijos) { var hj = $('#hoja'); hj.replaceChildren.apply(hj, hijos.filter(Boolean)); $('#capa').hidden = false; }
  function cierraHoja() { $('#capa').hidden = true; $('#capa').classList.remove('arriba'); }
  function hojaJuego() {
    var m = E.mapa, ts = m.temas.filter(function (x) { return E.temas.indexOf(x.id) >= 0; });
    var pool = E.ajustes.que === 'todo' ? m.items : itemsTema();
    var entran = pool.filter(function (it) { return !estaFuera(m, it.id); });
    var n = Math.min(10, entran.length);
    abreHoja([
      h('h3', { text: 'Vamos a jugar' }),
      elige('¿Qué quieres practicar?', 'que', [['tema', ts.length === 1 ? ts[0].n : 'Los ' + ts.length + ' temas marcados'], ['todo', 'Todo el mapa']]),
      elige('Tipo de pregunta', 'tipo', [['donde', 'Tocar en el mapa'], ['que', 'Elegir el nombre'], ['mezcla', 'Las dos']]),
      elige('Nivel', 'nivel', [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']]),
      h('div', { class: 'grupo' }, [h('span', { text: 'Lugares que entran' }),
        h('button', { class: 'boton', text: (entran.length === pool.length ? 'Entran todos (' + pool.length + ')' : 'Entran ' + entran.length + ' de ' + pool.length) + ' · Elegir', on: { click: function () { hojaElegir(pool); } } })]),
      pcPosible ? elige('Jugar a pantalla completa', 'pc', [['si', 'Sí'], ['no', 'No']]) : null,
      h('p', { text: E.ajustes.nivel === 'facil' ? 'Fácil: se ven las formas y tienes dos intentos.' : E.ajustes.nivel === 'normal' ? 'Normal: no se ven las formas. Un intento.' : 'Difícil: hay que tocar muy cerca. Un intento.' }),
      h('div', { class: 'fila' }, [
        h('button', { class: 'boton', text: 'Ahora no', on: { click: function () { cierraHoja(); cambiaModo('aprender'); } } }),
        n ? h('button', { class: 'boton principal', text: 'Empezar · ' + n + (n === 1 ? ' pregunta' : ' preguntas'), on: { click: function () { if (pcPosible && E.ajustes.pc === 'si') pcEntra(); cierraHoja(); empieza(entran); } } })
          : h('button', { class: 'boton principal', text: 'Elige algún lugar', on: { click: function () { hojaElegir(pool); } } })
      ])
    ]);
    try { localStorage.setItem(CLAVE + '-ajustes', JSON.stringify(E.ajustes)); } catch (e) { /* no importa */ }
  }
  function hojaElegir(pool) {
    var m = E.mapa, cuantos = h('p', {});
    var lista = h('div', { class: 'lista elegir' }, pool.map(function (it) {
      var b = h('button', { 'aria-pressed': !estaFuera(m, it.id), class: sabido(m, it.id) ? 'sabido' : '', text: it.n + (m.id === 'ren' ? ' (' + it.t.toLowerCase() + ')' : ''),
        on: { click: function () { ponFuera(m, it.id, !estaFuera(m, it.id)); b.setAttribute('aria-pressed', !estaFuera(m, it.id)); cuenta2(); } } });
      b.dataset.id = it.id;
      return b;
    }));
    function cuenta2() {
      var k = pool.filter(function (it) { return !estaFuera(m, it.id); }).length;
      cuantos.textContent = 'Entran ' + k + ' de ' + pool.length + '. Toca un nombre para quitarlo o ponerlo. Los que llevan ✓ ya los has acertado dos veces seguidas.';
    }
    function todos(regla) {
      pool.forEach(function (it) { ponFuera(m, it.id, regla(it)); });
      lista.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', !estaFuera(m, b.dataset.id)); });
      cuenta2();
    }
    cuenta2();
    abreHoja([
      h('h3', { text: '¿Qué entra en la partida?' }), cuantos,
      h('div', { class: 'fila' }, [
        h('button', { class: 'boton', text: 'Poner todos', on: { click: function () { todos(function () { return false; }); } } }),
        h('button', { class: 'boton', text: 'Quitar los que tienen ✓', on: { click: function () { todos(function (it) { return sabido(m, it.id); }); } } }),
        h('button', { class: 'boton', text: 'Quitar todos', on: { click: function () { todos(function () { return true; }); } } })
      ]),
      lista,
      h('button', { class: 'boton principal', text: 'Listo', on: { click: hojaJuego } })
    ]);
  }
  function empieza(pool) {
    var m = E.mapa;
    // Primero lo que todavía no se sabe
    var orden = baraja(pool).sort(function (a, b) { return racha(m, a.id) - racha(m, b.id); }).slice(0, 10);
    E.juego = { pool: pool, cola: baraja(orden), i: 0, res: [], fallos: [], fin: false };
    E.modo = 'jugar'; E.sel = null; reencuadra(); siguiente();
  }
  function siguiente() {
    var j = E.juego;
    if (j.i >= j.cola.length) { j.fin = true; pinta(); return hojaFinal(); }
    var it = j.cola[j.i], tipo = E.ajustes.tipo === 'mezcla' ? (Math.random() < .5 ? 'donde' : 'que') : E.ajustes.tipo;
    j.q = { it: it, tipo: tipo, intentos: 0, hecho: false, bien: false, toque: null, elegido: null };
    if (tipo === 'que') {
      var otros = baraja(j.pool.filter(function (x) { return x.id !== it.id && x.n !== it.n; }));
      var mismos = otros.filter(function (x) { return x.t === it.t; }), resto = otros.filter(function (x) { return x.t !== it.t; });
      var extra = baraja(E.mapa.items.filter(function (x) { return x.n !== it.n && j.pool.indexOf(x) < 0; }));
      var ops = [], nombres = {};
      mismos.concat(resto, extra).forEach(function (x) { if (ops.length < 3 && !nombres[x.n]) { nombres[x.n] = 1; ops.push(x); } });
      j.q.ops = baraja(ops.concat([it]));
      asegura(it);
    }
    pinta();
  }
  function pintaJuego() {
    var m = E.mapa, j = E.juego, panel = $('#panel');
    panel.replaceChildren();
    if (!j || j.fin) {
      panel.appendChild(h('p', { class: 'pista', text: 'Elige un tema y empieza una partida.' }));
      panel.appendChild(h('button', { class: 'boton principal ancho', text: 'Empezar partida', on: { click: hojaJuego } }));
      return;
    }
    var q = j.q, it = q.it, niv = NIVEL[E.ajustes.nivel];
    var conTipo = m.id === 'ren' ? it.t + ' · ' : '';
    // Cabecera sobre el mapa
    var pr = $('#pregunta'); pr.replaceChildren();
    if (q.tipo === 'donde') { pr.appendChild(h('small', { text: 'Toca en el mapa' })); pr.appendChild(h('strong', {}, [it.n, m.id === 'ren' ? h('em', { text: it.t }) : null])); }
    else { pr.appendChild(h('small', { text: 'Mira la forma rosa' })); pr.appendChild(h('strong', { text: '¿Cómo se llama?' })); }
    // Mapa
    if (q.tipo === 'donde') {
      if (niv.pista && !q.hecho) j.pool.filter(function (x) { return x.g === it.g || E.ajustes.que === 'tema'; }).sort(function (a, b) { return tamano(b) - tamano(a); }).forEach(function (x) { forma(x, ''); });
      if (q.hecho) { forma(it, 'ok'); rotulo(it, 'ok'); }
      if (q.toque && !q.bien) {
        var r = 9 * u(), x = q.toque[0], y = q.toque[1];
        s('path', { class: 'toque', d: 'M' + (x - r) + ',' + (y - r) + 'L' + (x + r) + ',' + (y + r) + 'M' + (x + r) + ',' + (y - r) + 'L' + (x - r) + ',' + (y + r) }, capaMarcas);
      }
    } else {
      forma(it, q.hecho ? 'ok' : 'objetivo');
      if (q.hecho) rotulo(it, 'ok');
      var c = caja(it), lado = Math.max(c[2] - c[0], c[3] - c[1]);
      if (lado < 46 && !q.hecho) { var cc = centroDe(it); s('circle', { class: 'aviso-anillo', cx: cc[0], cy: cc[1], r: lado / 2 + 22 }, capaMarcas); }
    }
    // Panel
    var puntos = h('div', { class: 'puntos' }, j.cola.map(function (_, i) { return h('i', { class: i < j.res.length ? (j.res[i] ? 'ok' : 'no') : i === j.i ? 'ya' : '' }); }));
    puntos.appendChild(h('span', { text: (j.i + 1) + ' de ' + j.cola.length }));
    panel.appendChild(puntos);
    if (q.tipo === 'que') {
      panel.appendChild(h('div', { class: 'opciones' }, q.ops.map(function (o) {
        var cl = 'opcion' + (q.hecho && o.id === it.id ? ' ok' : q.hecho && q.elegido === o.id ? ' no' : '');
        return h('button', { class: cl, on: { click: function () { if (!q.hecho) responde(o.id === it.id, o); } } }, [o.n, m.id === 'ren' ? h('small', { text: o.t }) : null]);
      })));
    }
    if (q.hecho) {
      var txt = q.bien ? '¡Bien!' : q.tipo === 'donde' ? 'Estaba aquí, en verde.' : 'Era ' + conTipo + it.n + '.';
      var sub = q.bien ? it.d : (q.tocado ? 'Has tocado ' + q.tocado.n + '. ' : '') + it.d;
      panel.appendChild(h('div', { class: 'resultado ' + (q.bien ? 'ok' : 'no') }, [txt, h('small', { text: sub })]));
      panel.appendChild(h('button', { class: 'boton principal ancho', text: j.i + 1 < j.cola.length ? 'Siguiente' : 'Ver resultado', on: { click: function () { j.i++; siguiente(); } } }));
    } else if (q.tipo === 'donde') {
      panel.appendChild(h('p', { class: 'pista', text: q.intentos ? 'Casi. Tienes otro intento.' : 'Puedes ampliar el mapa con dos dedos antes de tocar.' }));
    }
    panel.appendChild(h('button', { class: 'enlace', text: 'Salir de la partida', on: { click: function () { E.juego = null; cambiaModo('aprender'); } } }));
  }
  function tocaJuego(p) {
    var j = E.juego; if (!j || j.fin) return;
    var q = j.q; if (q.hecho || q.tipo !== 'donde') return;
    var niv = NIVEL[E.ajustes.nivel], tol = niv.tol / E.ppu;
    var bien = distancia(q.it, p[0], p[1]) <= tol;
    q.toque = p;
    if (!bien) {
      var cerca = null;
      j.pool.forEach(function (x) { if (x.id !== q.it.id && distancia(x, p[0], p[1]) === 0 && (!cerca || tamano(x) < tamano(cerca))) cerca = x; });
      q.tocado = cerca;
      if (niv.pista && q.intentos === 0) { q.intentos = 1; return pinta(); }
    }
    responde(bien, null);
  }
  function responde(bien, opcion) {
    var j = E.juego, q = j.q;
    q.hecho = true; q.bien = bien; q.elegido = opcion && opcion.id;
    j.res.push(bien); if (!bien) j.fallos.push(q.it);
    anota(E.mapa, q.it.id, bien && q.intentos === 0);
    if (!bien || q.tipo === 'donde') asegura(q.it);
    pinta();
  }
  function hojaFinal() {
    var j = E.juego, n = j.res.filter(Boolean).length, tot = j.res.length, r = n / tot;
    var est = r >= .9 ? 3 : r >= .7 ? 2 : r >= .5 ? 1 : 0;
    var hijos = [
      h('div', { class: 'estrellas' }, [0, 1, 2].map(function (i) { return h('span', { class: i < est ? '' : 'off', text: '★' }); })),
      h('div', { class: 'nota', text: n + ' de ' + tot + ' aciertos' }),
      h('p', { text: est === 3 ? '¡Te lo sabes muy bien!' : est === 2 ? 'Muy bien. Repasa los fallos y lo tienes.' : 'Vuelve a Aprender, mira el mapa con calma y prueba otra vez.' })
    ];
    if (j.fallos.length) hijos.push(h('ul', { class: 'fallos' }, j.fallos.map(function (it) { return h('li', { text: it.n + (E.mapa.id === 'ren' ? ' (' + it.t.toLowerCase() + ')' : '') }); })));
    var botones = [];
    if (j.fallos.length) botones.push(h('button', { class: 'boton principal', text: 'Repasar los fallos', on: { click: function () { cierraHoja(); var f = j.fallos; empieza(j.pool); E.juego.cola = baraja(f); E.juego.i = 0; siguiente(); } } }));
    botones.push(h('button', { class: 'boton' + (j.fallos.length ? '' : ' principal'), text: 'Jugar otra vez', on: { click: function () { cierraHoja(); empieza(j.pool); } } }));
    botones.push(h('button', { class: 'boton', text: 'Volver a aprender', on: { click: function () { cierraHoja(); E.juego = null; cambiaModo('aprender'); } } }));
    hijos.push(h('div', { class: 'fila' }, botones));
    abreHoja(hijos);
  }
  function cambiaModo(modo) {
    E.modo = modo; E.sel = null;
    if (modo === 'aprender') { E.juego = null; cierraHoja(); pinta(); }
    else { pinta(); if (!E.juego) hojaJuego(); }
  }

  /* ── Gestos: arrastrar, dos dedos para ampliar, toque ── */
  var dedos = {}, gesto = null;
  svg.addEventListener('pointerdown', function (ev) {
    if (!E.mapa) return;
    svg.setPointerCapture(ev.pointerId);
    dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var ids = Object.keys(dedos);
    if (ids.length === 1) gesto = { x: ev.clientX, y: ev.clientY, mov: 0, multi: false, t: Date.now() };
    else if (gesto) gesto.multi = true;
  });
  svg.addEventListener('pointermove', function (ev) {
    var d = dedos[ev.pointerId]; if (!d || !gesto) return;
    var ids = Object.keys(dedos), r = svg.getBoundingClientRect(), k = 1 / E.ppu;
    if (ids.length === 1) {
      gesto.mov += Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y);
      E.tx += (ev.clientX - d.x) * k; E.ty += (ev.clientY - d.y) * k;
      d.x = ev.clientX; d.y = ev.clientY; aplicaVista();
    } else if (ids.length === 2) {
      var o = dedos[ids[0] == ev.pointerId ? ids[1] : ids[0]];
      var antes = Math.hypot(d.x - o.x, d.y - o.y), ahora = Math.hypot(ev.clientX - o.x, ev.clientY - o.y);
      var c = aCaja({ clientX: (ev.clientX + o.x) / 2, clientY: (ev.clientY + o.y) / 2 });
      E.tx += (ev.clientX - d.x) * k / 2; E.ty += (ev.clientY - d.y) * k / 2;
      d.x = ev.clientX; d.y = ev.clientY;
      if (antes > 0) zoomEn(ahora / antes, c[0], c[1]); else aplicaVista();
    }
    void r;
  });
  function suelta(ev) {
    if (!dedos[ev.pointerId]) return;
    delete dedos[ev.pointerId];
    if (Object.keys(dedos).length) return;
    var g = gesto; gesto = null;
    if (ev.type === 'pointerup' && g && !g.multi && g.mov < 12 && Date.now() - g.t < 700) {
      var p = aMapa(ev);
      if (E.modo === 'aprender') tocaAprender(p); else tocaJuego(p);
    }
  }
  svg.addEventListener('pointerup', suelta);
  svg.addEventListener('pointercancel', suelta);
  svg.addEventListener('wheel', function (ev) { ev.preventDefault(); var c = aCaja(ev); zoomEn(ev.deltaY < 0 ? 1.2 : 1 / 1.2, c[0], c[1]); }, { passive: false });
  document.addEventListener('gesturestart', function (ev) { ev.preventDefault(); }); // Safari: no ampliar la página entera

  $('#zMas').addEventListener('click', function () { zoomEn(1.5, E.mapa.w / 2, E.mapa.h / 2); });
  $('#zMenos').addEventListener('click', function () { zoomEn(1 / 1.5, E.mapa.w / 2, E.mapa.h / 2); });
  $('#zTodo').addEventListener('click', reencuadra);
  $('#zAmplio').addEventListener('click', function () {
    E.amplio = !E.amplio;
    if (E.amplio) pcEntra(); else pcSale();
    pinta();
  });
  $('#btnPantalla').addEventListener('click', function () { if (pcActiva()) pcSale(); else pcEntra(); });
  $('#btnNombres').addEventListener('click', function () { E.nombres = !E.nombres; E.sel = null; pinta(); });
  /* ── Pantalla completa del navegador (donde exista; en el iPhone no la hay) ── */
  var pcPosible = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  $('#btnPantalla').hidden = !pcPosible;
  function pcActiva() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function pcEntra() {
    var e = document.documentElement, f = e.requestFullscreen || e.webkitRequestFullscreen;
    if (!f || pcActiva()) return;
    try { var p = f.call(e); if (p && p.catch) p.catch(function () { /* la vista no lo permite: el mapa se amplía igual */ }); } catch (x) { /* igual */ }
  }
  function pcSale() {
    var f = document.exitFullscreen || document.webkitExitFullscreen;
    if (!f || !pcActiva()) return;
    try { var p = f.call(document); if (p && p.catch) p.catch(function () {}); } catch (x) { /* nada que hacer */ }
  }

  /* ── Buscar un lugar por su nombre ── */
  var pendiente = null;
  function llano(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function muestra(it) {
    var m = E.mapa;
    E.modo = 'aprender'; E.juego = null; E.nombres = true; E.sel = it.id;
    if (E.temas.indexOf(it.g) < 0) E.temas = [it.g];
    var c = caja(it), bw = Math.max(c[2] - c[0], 70), bh = Math.max(c[3] - c[1], 70);
    E.z = Math.max(1, Math.min(4, .4 * Math.min(m.w / bw, m.h / bh)));
    E.tx = m.w / 2 - (c[0] + c[2]) / 2 * E.z; E.ty = m.h / 2 - (c[1] + c[3]) / 2 * E.z;
    pinta();
  }
  function hojaBuscar() {
    var entradas = [];
    (E.mapa ? [E.mapa] : ATLAS).forEach(function (m) { m.items.forEach(function (it) { entradas.push({ m: m, it: it, k: llano(it.n) }); }); });
    var lista = h('div', { class: 'resultados' });
    var campo = h('input', { id: 'campoBuscar', type: 'search', placeholder: 'Escribe un nombre…', autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'Nombre del lugar' });
    function filtra() {
      var q = llano(campo.value.trim());
      lista.replaceChildren();
      if (!q) { lista.appendChild(h('p', { text: E.mapa ? 'Busca cualquier lugar de este mapa: sierras, ríos, picos, provincias…' : 'Busca en los tres mapas a la vez.' })); return; }
      var sal = entradas.filter(function (e) { return e.k.indexOf(q) >= 0; })
        .sort(function (a, b) { return (a.k.indexOf(q) ? 1 : 0) - (b.k.indexOf(q) ? 1 : 0) || a.k.localeCompare(b.k); }).slice(0, 40);
      if (!sal.length) lista.appendChild(h('p', { text: 'No hay ningún lugar con ese nombre.' }));
      sal.forEach(function (e) {
        var tema = e.m.temas.filter(function (t) { return t.id === e.it.g; })[0];
        lista.appendChild(h('button', { on: { click: function () {
          cierraHoja();
          if (E.mapa === e.m) muestra(e.it); else { pendiente = e.it.id; location.hash = e.m.id; }
        } } }, [e.it.n, h('small', { text: e.it.t + (e.it.alt ? ' · ' + e.it.alt + ' m' : '') + ' · ' + (E.mapa ? tema.n : e.m.titulo) })]));
      });
    }
    campo.addEventListener('input', filtra);
    abreHoja([h('h3', { text: 'Buscar un lugar' }), campo, lista, h('button', { class: 'boton', text: 'Cerrar', on: { click: cierraHoja } })]);
    $('#capa').classList.add('arriba');
    filtra(); campo.focus();
  }
  $('#btnBuscar').addEventListener('click', hojaBuscar);
  $('#btnBuscarInicio').addEventListener('click', hojaBuscar);

  /* ── Imprimir: lámina del mapa con los temas marcados ── */
  var IMP = { que: 'con', blob: null, url: null };
  function cargaImagen(src) {
    return new Promise(function (ok, mal) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = mal; im.src = src; });
  }
  function reglasMapa() { // estilos del dibujo, para llevarlos dentro de la imagen
    var css = '';
    Array.prototype.forEach.call(document.styleSheets, function (hoja) {
      Array.prototype.forEach.call(hoja.cssRules, function (r) {
        if (r.selectorText && /^\.(prov|ccaa|recuadro|forma|rotulo)/.test(r.selectorText) && r.selectorText.indexOf('objetivo') < 0) css += r.cssText;
      });
    });
    return css + 'svg{--fuente:system-ui,-apple-system,"Segoe UI",sans-serif}.ccaa{stroke-width:5}.prov{stroke-width:1.6}';
  }
  function lamina() {
    var m = E.mapa, antes = { nombres: E.nombres, sel: E.sel, z: E.z, tx: E.tx, ty: E.ty, ppu: E.ppu };
    // Se dibuja el mapa entero con el tamaño de letra del papel, se copia y se deja todo como estaba
    E.nombres = IMP.que === 'con'; E.sel = null; E.z = 1; E.tx = 0; E.ty = 0; E.ppu = 1.05;
    pinta(); E.ppu = 1.05; aplicaVista(); despeja();
    var capas = lineasProv.outerHTML + (m.recuadro ? vista.querySelector('.recuadro').outerHTML : '') +
      (IMP.que === 'mudo' ? '' : capaFormas.outerHTML + capaRotulos.outerHTML);
    E.nombres = antes.nombres; E.sel = antes.sel; E.z = antes.z; E.tx = antes.tx; E.ty = antes.ty;
    pinta(); mideEscenario(); aplicaVista();
    var W = 2000, H = Math.round(m.h * 2), cab = 120;
    var svgTxt = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + m.w + ' ' + m.h + '"><style>' +
      reglasMapa().replace(/</g, '&lt;') + '</style>' + capas + '</svg>';
    var temas = m.temas.filter(function (t) { return E.temas.indexOf(t.id) >= 0; }).map(function (t) { return t.n; }).join(', ');
    return Promise.all([cargaImagen(IMG[m.img] || 'img/' + m.img), cargaImagen('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgTxt))]).then(function (im) {
      var c = document.createElement('canvas'); c.width = W; c.height = H + cab;
      var x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H + cab);
      x.fillStyle = '#12324a'; x.textBaseline = 'middle';
      x.font = '800 46px system-ui, sans-serif'; x.fillText(m.titulo, 30, 44);
      x.font = '600 28px system-ui, sans-serif'; x.fillStyle = '#4d6678';
      x.fillText(IMP.que === 'mudo' ? 'Mapa en blanco' : temas + (IMP.que === 'sin' ? ' · sin nombres' : ''), 30, 92);
      x.textAlign = 'right'; x.fillText('Nombre: ______________________   Fecha: ___________', W - 30, 44);
      x.globalAlpha = m.id === 'ren' ? .62 : 1; x.drawImage(im[0], 0, cab, W, H); x.globalAlpha = 1;
      x.drawImage(im[1], 0, cab, W, H);
      return new Promise(function (ok, mal) { c.toBlob(function (b) { b ? ok(b) : mal(new Error('sin imagen')); }, 'image/jpeg', .92); });
    });
  }
  function hojaImprimir() {
    var dentro = !!window.claude; // página alojada en Claude: no puede abrir el diálogo de impresión
    var foto = h('img', { class: 'lamina', alt: 'Vista previa de la lámina' });
    var estado = h('p', { text: 'Preparando la lámina…' });
    var botones = h('div', { class: 'fila' });
    var cerrar = function () { document.body.classList.remove('imprime'); cierraHoja(); };
    abreHoja([
      h('h3', { text: 'Imprimir el mapa' }),
      h('div', { class: 'grupo' }, [h('span', { text: '¿Cómo lo quieres?' }), h('div', { class: 'elige' }, [['con', 'Con nombres'], ['sin', 'Sin nombres'], ['mudo', 'En blanco']].map(function (o) {
        return h('button', { 'aria-pressed': IMP.que === o[0], text: o[1], on: { click: function () { IMP.que = o[0]; hojaImprimir(); } } });
      }))]),
      foto, estado, botones
    ]);
    lamina().then(function (blob) {
      if (IMP.url) URL.revokeObjectURL(IMP.url);
      IMP.blob = blob; IMP.url = URL.createObjectURL(blob); foto.src = IMP.url;
      var nombre = 'mapa-' + E.mapa.id + '-' + IMP.que + '.jpg';
      estado.textContent = dentro ? 'Guarda la imagen y luego imprímela desde Fotos o Archivos. Sale en una hoja apaisada.' : 'Sale en una hoja apaisada.';
      if (!dentro) botones.appendChild(h('button', { class: 'boton principal', text: 'Imprimir', on: { click: function () { document.body.classList.add('imprime'); window.print(); } } }));
      var usa = window.claude && window.claude.use ? window.claude.use('downloads') : Promise.resolve(null);
      usa.then(function (dl) {
        if (dl) botones.insertBefore(h('button', { class: 'boton principal', text: 'Guardar imagen', on: { click: function () {
          dl.save({ filename: nombre, data: IMP.blob }).then(function () { estado.textContent = 'Imagen guardada.'; },
            function (e) { estado.textContent = e && e.code === 'declined' ? 'No se ha guardado.' : 'No se ha podido guardar. Mantén el dedo sobre la imagen y elige «Guardar».'; });
        } } }), botones.firstChild);
        else if (dentro) estado.textContent = 'Mantén el dedo sobre la imagen y elige «Guardar en Fotos»; luego imprímela desde Fotos.';
      });
    }, function () {
      estado.textContent = 'No se ha podido preparar la lámina en este navegador.';
    }).then(function () { botones.appendChild(h('button', { class: 'boton', text: 'Cerrar', on: { click: cerrar } })); });
  }
  $('#btnImprimir').addEventListener('click', hojaImprimir);
  window.addEventListener('afterprint', function () { document.body.classList.remove('imprime'); });
  $('#btnVolver').addEventListener('click', function () { location.hash = ''; });
  document.querySelectorAll('.segmento button').forEach(function (b) { b.addEventListener('click', function () { if (E.modo !== b.dataset.modo) cambiaModo(b.dataset.modo); }); });
  $('#capa').addEventListener('click', function (ev) { if (ev.target === $('#capa') && !(E.juego && E.juego.fin) && (E.modo !== 'jugar' || $('#campoBuscar'))) cierraHoja(); });
  $('#btnAcerca').addEventListener('click', function () {
    abreHoja([
      h('h3', { text: 'De dónde salen los mapas' }),
      h('ul', { class: 'fuentes' }, [
        h('li', { text: 'Contenido: libro de Geografía e Historia de 1.º ESO, unidad 2, «El relieve de España y de Andalucía».' }),
        h('li', {}, ['Parques nacionales y naturales: límites oficiales de la RENPA, Junta de Andalucía (REDIAM), mapa de febrero de 2026.']),
        h('li', { text: 'Provincias: Instituto Geográfico Nacional.' }),
        h('li', { text: 'Relieve: alturas del terreno de Terrain Tiles (Mapzen), con datos SRTM, GMTED y ETOPO1.' }),
        h('li', { text: 'Las cordilleras, mesetas y depresiones están dibujadas a mano sobre el relieve: sirven para estudiar, no para medir.' })
      ]),
      h('button', { class: 'boton principal', text: 'Cerrar', on: { click: cierraHoja } })
    ]);
  });

  var ro = window.ResizeObserver ? new ResizeObserver(function () { if (E.mapa) { mideEscenario(); aplicaVista(); } }) : null;
  if (ro) ro.observe($('#escenario')); else window.addEventListener('resize', function () { if (E.mapa) { mideEscenario(); aplicaVista(); } });

  function ruta() {
    var id = location.hash.replace('#', '');
    var m = ATLAS.filter(function (x) { return x.id === id; })[0];
    cierraHoja();
    if (m) { abreMapa(m); var pit = pendiente && item(pendiente); pendiente = null; if (pit) muestra(pit); }
    else { E.mapa = null; E.juego = null; $('#mapa').hidden = true; $('#inicio').hidden = false; pintaInicio(); }
  }
  window.addEventListener('hashchange', ruta);
  ruta();

  // Web instalable: solo cuando está publicada como web normal (no en el fichero único ni dentro de Claude)
  if ('serviceWorker' in navigator && !window.ATLAS_IMG && !window.claude && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* sin guardado local: la web funciona igual con conexión */ });
  }
})();
