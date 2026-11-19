/* Globo terráqueo: la Tierra en 3D con los lugares de estudio de todos los mapas.
   El relieve se pinta con WebGL; los lugares y los nombres, en un lienzo 2D encima. */
(function () {
  'use strict';
  var APP = window.ATLAS_APP, CAPAS = window.ATLAS_GLOBO || [], h = APP.h;
  var $ = function (s) { return document.querySelector(s); };
  var RAD = Math.PI / 180;
  var CONT = [null,
    { n: 'Europa', m: 'eur', c: [15, 50] }, { n: 'Asia', m: 'asi', c: [95, 42] }, { n: 'África', m: 'afr', c: [20, 5] },
    { n: 'América', m: 'ame', c: [-80, 12] }, { n: 'Oceanía', m: 'oce', c: [140, -24] }, { n: 'Antártida', m: null, c: [20, -80] }];
  var COLOR = { monte: '#7a3d12', meseta: '#a35f00', llano: '#1b7a3c', mar: '#0f5fb3', isla: '#8a2c8f', costa: '#c9580a', rio: '#0a5fc0', ciudad: '#b3261e' };

  var sec = $('#globo'), esc = $('#gEsc'), cGL = $('#gGL'), c2 = $('#g2D'), ctx = c2.getContext('2d');
  var V = { lon: -8, lat: 28, z: 1 }, W = 0, H = 0, dpr = 1, R = 1;
  var sel = 0, sobre = 0, elegido = null, nombres = true, lugares = true;
  var gl = null, uni = null, abierto = false, pedido = 0, girando = true, vuelo = null;
  var ids = null, idW = 0, idH = 0, dibujados = [];

  /* ── Proyección ortográfica ── */
  function adelante(lon, lat) {
    var f = lat * RAD, f0 = V.lat * RAD, dl = (lon - V.lon) * RAD, cf = Math.cos(f);
    var x = cf * Math.sin(dl), y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * cf * Math.cos(dl), z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * cf * Math.cos(dl);
    return [W / 2 + R * x, H / 2 - R * y, z];
  }
  function atras(px, py) {
    var x = (px - W / 2) / R, y = -(py - H / 2) / R, r2 = x * x + y * y;
    if (r2 > 1) return null;
    var z = Math.sqrt(1 - r2), f0 = V.lat * RAD, sf = Math.sin(f0), cf = Math.cos(f0);
    var lat = Math.asin(Math.max(-1, Math.min(1, y * cf + z * sf))), lon = V.lon * RAD + Math.atan2(x, z * cf - y * sf);
    lon = ((lon / RAD + 540) % 360) - 180;
    return [lon, lat / RAD];
  }
  function continenteEn(ll) {
    if (!ll || !ids) return 0;
    var x = Math.min(idW - 1, Math.floor((ll[0] + 180) / 360 * idW)), y = Math.min(idH - 1, Math.max(0, Math.floor((90 - ll[1]) / 180 * idH)));
    return Math.round(ids[(y * idW + x) * 4] / 40);
  }

  /* ── WebGL: la esfera con el relieve ── */
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = 'precision highp float;uniform sampler2D uT,uI;uniform vec2 uC;uniform float uR,uL,uF,uS,uK;' +
    'void main(){vec2 p=(gl_FragCoord.xy-uC)/uR;float r2=dot(p,p);vec3 fondo=vec3(.03,.08,.14);' +
    'if(r2>1.){float d=sqrt(r2);float g=smoothstep(1.09,1.,d);gl_FragColor=vec4(mix(fondo,vec3(.45,.7,1.),g*.55),1.);return;}' +
    'float z=sqrt(1.-r2),sf=sin(uF),cf=cos(uF);float lat=asin(clamp(p.y*cf+z*sf,-1.,1.));float lon=uL+atan(p.x,z*cf-p.y*sf);' +
    'vec2 uv=vec2(fract(lon/6.2831853+.5),.5-lat/3.14159265);vec3 c=texture2D(uT,uv).rgb;' +
    'float id=floor(texture2D(uI,uv).r*255./40.+.5);if(uS>.5&&abs(id-uS)<.5)c=mix(c,vec3(1.,.82,.15),uK);' +
    'c*=.7+.3*z;c=mix(c,vec3(.6,.8,1.),pow(1.-z,3.)*.35);gl_FragColor=vec4(c,1.);}';
  function textura(img, lineal, maximo) {
    var fuente = img;
    if (img.width > maximo) { // aparatos con poca memoria gráfica
      fuente = document.createElement('canvas'); fuente.width = maximo; fuente.height = maximo / 2;
      fuente.getContext('2d').drawImage(img, 0, 0, fuente.width, fuente.height);
    }
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fuente);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, lineal ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, lineal ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function imagen(src) { return new Promise(function (ok, mal) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = mal; i.src = src; }); }
  var preparado = null;
  function prepara() {
    if (preparado) return preparado;
    preparado = Promise.all([imagen(APP.img('relieve-globo.jpg')), imagen(APP.img('continentes.png'))]).then(function (im) {
      try { // el mapa de continentes también se lee desde el programa, para saber qué se toca
        var k = document.createElement('canvas'); k.width = idW = im[1].width; k.height = idH = im[1].height;
        var kc = k.getContext('2d'); kc.drawImage(im[1], 0, 0);
        ids = kc.getImageData(0, 0, idW, idH).data;
      } catch (e) { ids = null; }
      gl = cGL.getContext('webgl', { antialias: false, alpha: false }) || cGL.getContext('experimental-webgl');
      if (!gl) throw new Error('sin WebGL');
      var prog = gl.createProgram();
      [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]].forEach(function (q) {
        var s = gl.createShader(q[0]); gl.shaderSource(s, q[1]); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(prog, s);
      });
      gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      var max = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
      gl.activeTexture(gl.TEXTURE0); textura(im[0], true, max);
      gl.activeTexture(gl.TEXTURE1); textura(im[1], false, Math.min(2048, max));
      uni = {}; ['uT', 'uI', 'uC', 'uR', 'uL', 'uF', 'uS', 'uK'].forEach(function (n) { uni[n] = gl.getUniformLocation(prog, n); });
      gl.uniform1i(uni.uT, 0); gl.uniform1i(uni.uI, 1);
    });
    return preparado;
  }

  /* ── Dibujo ── */
  function mide() {
    var r = esc.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    [cGL, c2].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    pide();
  }
  function pide() { if (!pedido && abierto) pedido = requestAnimationFrame(cuadro); }
  function nivel() { return V.z < 1.7 ? 0 : V.z < 4.5 ? 1 : V.z < 8 ? 2 : 3; }
  function color(it) { return it.pico ? '#4a2a12' : COLOR[it.c] || '#7a3d12'; }

  function traza(pts) { // línea sobre la esfera, cortada donde pasa a la cara oculta
    var dentro = false, n = 0, sx = 0, sy = 0;
    for (var i = 0; i < pts.length; i++) {
      var q = adelante(pts[i][0], pts[i][1]);
      if (q[2] > 0.03) { if (dentro) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); dentro = true; n++; sx += q[0]; sy += q[1]; }
      else dentro = false;
    }
    return n ? [sx / n, sy / n, n] : null;
  }
  function cuadro(t) {
    pedido = 0;
    if (!abierto || !gl) return;
    if (vuelo) { // giro suave hasta el continente tocado
      var k = Math.min(1, (t - vuelo.t0) / 450), e = 1 - Math.pow(1 - k, 3);
      V.lon = vuelo.lon0 + vuelo.dlon * e; V.lat = vuelo.lat0 + vuelo.dlat * e;
      if (k >= 1) vuelo = null;
      pide();
    } else if (girando) { V.lon += 0.06; pide(); }
    R = Math.min(W, H) * 0.44 * V.z;
    gl.viewport(0, 0, cGL.width, cGL.height);
    gl.uniform2f(uni.uC, cGL.width / 2, cGL.height / 2); gl.uniform1f(uni.uR, R * dpr);
    gl.uniform1f(uni.uL, V.lon * RAD); gl.uniform1f(uni.uF, V.lat * RAD); gl.uniform1f(uni.uS, sobre || sel); gl.uniform1f(uni.uK, Math.max(0.14, 0.5 / V.z));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var nv = nivel(), rotulos = [], chico = nv === 0 && Math.min(W, H) < 520; // en pantallas pequeñas, de lejos solo continentes y océanos
    dibujados = [];
    if (nv === 0 || !lugares) CONT.forEach(function (c, i) { // nombres de los continentes
      if (!c) return;
      var q = adelante(c.c[0], c.c[1]);
      if (q[2] > 0.25) rotulos.push({ x: q[0], y: q[1], t: c.n.toUpperCase(), pri: i === (sobre || sel) ? 9 : 5, cont: 1 });
    });
    if (lugares) CAPAS.forEach(function (capa) {
      if (nv === 0 ? capa.nivel !== 0 : capa.nivel === 0 || capa.nivel > nv) return;
      capa.items.forEach(function (it) {
        if (it.c === 'cont' || (chico && it.c !== 'mar')) return;
        var col = color(it), es = elegido === it, ancla = null, soloNombre = it.c === 'mar' && it.k !== 'l';
        ctx.strokeStyle = col; ctx.fillStyle = col;
        if (it.k === 'l') {
          ctx.beginPath();
          var a1 = traza(it.pts); (it.mas || []).forEach(traza);
          ctx.globalAlpha = it.c === 'rio' ? 0.95 : es ? 0.8 : 0.45;
          ctx.lineWidth = it.c === 'rio' ? (es ? 4.5 : 2.2) : Math.max(4, Math.min(22, 2 * it.w / 6371 * R));
          ctx.stroke();
          if (a1) { var mq = adelante(it.pts[it.pts.length >> 1][0], it.pts[it.pts.length >> 1][1]); ancla = mq[2] > 0.05 ? mq : null; }
        } else if (it.k === 'a') {
          var cx = 0, cy = 0, cn = 0, oculto = false;
          if (!soloNombre) ctx.beginPath();
          it.pols.forEach(function (pol) {
            pol.forEach(function (p, i) {
              var q = adelante(p[0], p[1]);
              if (q[2] <= 0.03) oculto = true;
              if (!soloNombre) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
              cx += q[0]; cy += q[1]; cn++;
            });
            if (!soloNombre) ctx.closePath();
          });
          if (!oculto) {
            if (!soloNombre) { ctx.globalAlpha = es ? 0.55 : 0.3; ctx.fill(); ctx.globalAlpha = 0.85; ctx.lineWidth = es ? 3 : 1.5; ctx.stroke(); }
            ancla = [cx / cn, cy / cn, 1];
          }
        } else {
          var q = adelante(it.x, it.y);
          if (q[2] > 0.05) {
            ancla = q;
            if (it.pico) { ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(q[0], q[1] - 8); ctx.lineTo(q[0] + 7, q[1] + 5); ctx.lineTo(q[0] - 7, q[1] + 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
            else if (it.pto) { ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(q[0], q[1], es ? 7 : 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
            else if (!soloNombre) { var rr = Math.max(5, Math.min(34, it.r / 6371 * R)); ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, 7); ctx.globalAlpha = es ? 0.5 : 0.22; ctx.fill(); ctx.globalAlpha = 0.9; ctx.lineWidth = es ? 3.5 : 2; ctx.stroke(); }
          }
        }
        ctx.globalAlpha = 1;
        if (it.lab && it.k !== 'p') { var ql = adelante(it.lab[0], it.lab[1]); if (ql[2] > 0.05 && ancla) ancla = ql; }
        if (!ancla || ancla[0] < -40 || ancla[0] > W + 40 || ancla[1] < -40 || ancla[1] > H + 40) return;
        dibujados.push({ it: it, capa: capa, x: ancla[0], y: ancla[1] });
        var baja = it.pico || it.pto ? 20 : 0;
        rotulos.push({ x: ancla[0], y: ancla[1] + baja, t: it.n + (it.alt && nv > 0 ? ' · ' + it.alt + ' m' : ''), pri: es ? 9 : it.pico ? 2 : it.k === 'a' || (it.k === 'l' && it.c !== 'rio') ? 3 : 1, mar: it.c === 'mar' || it.c === 'rio' });
      });
    });
    if (nombres || elegido) { // nombres: si dos se pisan, se queda el más importante
      var puestos = [];
      rotulos.sort(function (a, b) { return b.pri - a.pri; }).forEach(function (r) {
        if (!nombres && r.pri < 9) return;
        ctx.font = (r.mar ? 'italic ' : '') + '800 ' + (r.cont ? 15 : 13) + 'px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
        var an = ctx.measureText(r.t).width + (r.cont ? r.t.length * 2 : 0), caja = [r.x - an / 2 - 3, r.y - 10, r.x + an / 2 + 3, r.y + 8];
        if (r.pri < 9 && puestos.some(function (p) { return caja[0] < p[2] && caja[2] > p[0] && caja[1] < p[3] && caja[3] > p[1]; })) return;
        puestos.push(caja);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (r.cont && ctx.letterSpacing !== undefined) ctx.letterSpacing = '2px';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(r.t, r.x, r.y);
        ctx.fillStyle = r.mar ? '#0a4a9a' : '#10293b'; ctx.fillText(r.t, r.x, r.y);
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
      });
    }
  }

  /* ── Panel ── */
  function panel() {
    var p = $('#gPanel'); p.replaceChildren();
    var c = CONT[sel];
    if (elegido) {
      var it = elegido.it, capa = elegido.capa;
      p.appendChild(h('div', { class: 'ficha' }, [
        h('div', { class: 'chapas' }, [h('span', { class: 'chapa color', style: '--c:' + color(it), text: it.t }), it.alt ? h('span', { class: 'chapa', text: it.alt + ' m' }) : null, h('span', { class: 'chapa', text: capa.titulo })]),
        h('h3', { text: it.n }), h('p', { text: it.d })]));
      p.appendChild(h('button', { class: 'boton principal ancho', text: 'Verlo en su mapa', on: { click: function () { APP.abre(capa.m, it.id); } } }));
      if (c && c.m && c.m !== capa.m) p.appendChild(h('button', { class: 'enlace', text: 'Abrir el mapa de ' + c.n, on: { click: function () { APP.abre(c.m); } } }));
    } else if (c) {
      p.appendChild(h('div', { class: 'ficha' }, [h('div', { class: 'chapas' }, [h('span', { class: 'chapa', text: 'Continente' })]), h('h3', { text: c.n }),
        h('p', { text: c.m ? 'Amplía el globo para ver sus montañas, mares y ríos, o abre su mapa para aprender y jugar.' : 'Continente helado alrededor del polo sur. No tiene mapa de estudio propio.' })]));
      if (c.m) p.appendChild(h('button', { class: 'boton principal ancho', text: 'Abrir el mapa de ' + c.n, on: { click: function () { APP.abre(c.m); } } }));
    } else {
      p.appendChild(h('p', { class: 'pista', text: 'Gira la Tierra con el dedo y amplíala con dos. Toca un continente para ver su nombre; tócalo dos veces para abrir su mapa.' }));
    }
    p.appendChild(h('button', { class: 'enlace', text: 'Abrir el mapa del mundo', on: { click: function () { APP.abre('mun'); } } }));
    $('#gNombres').textContent = nombres ? 'Ocultar nombres' : 'Mostrar nombres';
    $('#gLugares').textContent = lugares ? 'Ocultar lugares' : 'Mostrar lugares';
  }
  function vuelaA(c) {
    var dlon = ((c[0] - V.lon + 540) % 360) - 180;
    vuelo = { t0: performance.now(), lon0: V.lon, lat0: V.lat, dlon: dlon, dlat: Math.max(-60, Math.min(60, c[1])) - V.lat };
    pide();
  }
  function rotulo(n) { var r = $('#gRotulo'); r.hidden = !n; if (n) { r.replaceChildren(h('strong', { text: CONT[n].n }), h('span', { text: CONT[n].m ? 'Dos toques para abrir su mapa' : 'Sin mapa de estudio' })); } }

  /* ── Gestos ── */
  var dedos = {}, gesto = null, ultimo = null;
  function local(ev) { var r = c2.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
  function toca(p) {
    var ahora = Date.now(), doble = ultimo && ahora - ultimo.t < 380 && Math.hypot(p[0] - ultimo.x, p[1] - ultimo.y) < 34;
    ultimo = { t: ahora, x: p[0], y: p[1] };
    var cerca = null;
    dibujados.forEach(function (d) { var dist = Math.hypot(d.x - p[0], d.y - p[1]); if (dist < (nivel() ? 26 : 14) && (!cerca || dist < cerca.dist)) cerca = { d: d, dist: dist }; });
    var cn = continenteEn(atras(p[0], p[1]));
    if (doble) { // dos toques: se abre el mapa
      if (cerca && nivel() > 0) return APP.abre(cerca.d.capa.m, cerca.d.it.id);
      if (cn && CONT[cn].m) return APP.abre(CONT[cn].m);
      return;
    }
    elegido = cerca ? cerca.d : null;
    sel = cn; if (!elegido && cn) vuelaA(CONT[cn].c);
    rotulo(elegido ? 0 : sel); panel(); pide();
  }
  c2.addEventListener('pointerdown', function (ev) {
    if (ev.isPrimary || ev.pointerType === 'mouse') { dedos = {}; gesto = null; }
    if (Object.keys(dedos).length >= 2) return;
    try { c2.setPointerCapture(ev.pointerId); } catch (e) { /* se sigue sin captura */ }
    dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    girando = false; vuelo = null;
    if (Object.keys(dedos).length === 1) gesto = { mov: 0, multi: false, t: Date.now() }; else if (gesto) gesto.multi = true;
  });
  c2.addEventListener('pointermove', function (ev) {
    var d = dedos[ev.pointerId];
    if (!d) { // ratón sin pulsar: resalta y nombra el continente
      if (ev.pointerType === 'mouse') { var n = continenteEn(atras.apply(null, local(ev))); if (n !== sobre) { sobre = n; rotulo(n || (elegido ? 0 : sel)); pide(); } }
      return;
    }
    if (!gesto) return;
    var k = Object.keys(dedos);
    if (k.length === 1) {
      gesto.mov += Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y);
      V.lon -= (ev.clientX - d.x) / R / RAD; V.lat = Math.max(-88, Math.min(88, V.lat + (ev.clientY - d.y) / R / RAD));
    } else if (k.length === 2) {
      var o = dedos[k[0] == ev.pointerId ? k[1] : k[0]], antes = Math.hypot(d.x - o.x, d.y - o.y), ahora = Math.hypot(ev.clientX - o.x, ev.clientY - o.y);
      if (antes > 0) V.z = Math.max(1, Math.min(12, V.z * ahora / antes));
    }
    d.x = ev.clientX; d.y = ev.clientY; pide();
  });
  function suelta(ev) {
    if (!dedos[ev.pointerId]) return;
    delete dedos[ev.pointerId];
    if (Object.keys(dedos).length) return;
    var g = gesto; gesto = null;
    if (ev.type === 'pointerup' && g && !g.multi && g.mov < 12 && Date.now() - g.t < 700) toca(local(ev));
    else panel();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { c2.addEventListener(n, suelta); });
  c2.addEventListener('pointerleave', function () { if (sobre) { sobre = 0; rotulo(elegido ? 0 : sel); pide(); } });
  c2.addEventListener('wheel', function (ev) { ev.preventDefault(); girando = false; V.z = Math.max(1, Math.min(12, V.z * (ev.deltaY < 0 ? 1.15 : 1 / 1.15))); pide(); }, { passive: false });
  function amplia(f) { girando = false; V.z = Math.max(1, Math.min(12, V.z * f)); pide(); }
  $('#gMas').addEventListener('click', function () { amplia(1.6); });
  $('#gMenos').addEventListener('click', function () { amplia(1 / 1.6); });
  $('#gTodo').addEventListener('click', function () { V.z = 1; sel = 0; elegido = null; rotulo(0); panel(); pide(); });
  $('#gNombres').addEventListener('click', function () { nombres = !nombres; panel(); pide(); });
  $('#gLugares').addEventListener('click', function () { lugares = !lugares; elegido = null; panel(); pide(); });
  $('#gVolver').addEventListener('click', function () { location.hash = ''; });
  if (window.ResizeObserver) new ResizeObserver(function () { if (abierto) mide(); }).observe(esc); else window.addEventListener('resize', function () { if (abierto) mide(); });

  window.ATLAS_GLOBO_VISTA = {
    abre: function () {
      abierto = true; sec.hidden = false;
      girando = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      panel();
      prepara().then(function () { $('#gAviso').hidden = true; mide(); }, function () {
        $('#gAviso').hidden = false; $('#gAviso').textContent = 'Este navegador no puede dibujar el globo en 3D. Puedes usar el mapa del mundo.';
      });
    },
    cierra: function () { abierto = false; sec.hidden = true; if (pedido) { cancelAnimationFrame(pedido); pedido = 0; } }
  };
  if (location.hash === '#globo') window.ATLAS_GLOBO_VISTA.abre();
})();
