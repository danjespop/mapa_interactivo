"""Convierte contenido.py + los límites oficiales en js/datos.js (coordenadas del SVG).

Uso: python3 herramientas/generar.py
"""
import json, math, os
from proyeccion import MAPAS, CAN, proyecta, km, es_canarias
import contenido_mundo  # noqa: F401  (añade los mapas de continentes a MAPAS_CONTENIDO)
from contenido import MAPAS_CONTENIDO

AQUI = os.path.dirname(os.path.abspath(__file__))
ANDALUCIA = ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla']


NOMBRE = {'Bizkaia': 'Vizcaya', 'Gipuzkoa': 'Guipúzcoa', 'Araba/Álava': 'Álava', 'Castelló/Castellón': 'Castellón',
          'València/Valencia': 'Valencia', 'Alacant/Alicante': 'Alicante', 'Illes Balears': 'Islas Baleares'}


def carga(nombre):
    return json.load(open(os.path.join(AQUI, 'datos', nombre), encoding='utf-8'))


def r1(v):
    return round(v, 1)


def simplifica(pts, tol):
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    pila = [(0, len(pts) - 1)]
    while pila:
        a, b = pila.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        n = math.hypot(dx, dy) or 1e-9
        dmax, imax = 0, -1
        for i in range(a + 1, b):
            d = abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / n
            if d > dmax:
                dmax, imax = d, i
        if dmax > tol:
            keep[imax] = True
            pila += [(a, imax), (imax, b)]
    return [p for p, k in zip(pts, keep) if k]


def area(ring):
    return abs(sum(ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1] for i in range(len(ring) - 1))) / 2


def centro(ring):
    a = cx = cy = 0
    for i in range(len(ring) - 1):
        f = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
        a += f
        cx += (ring[i][0] + ring[i + 1][0]) * f
        cy += (ring[i][1] + ring[i + 1][1]) * f
    return (cx / (3 * a), cy / (3 * a)) if a else ring[0]


def anillos(mapa, geom, tol, amin):
    """Proyecta y simplifica. Devuelve lista de anillos (exteriores y huecos) en unidades."""
    pols = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    sal = []
    for pol in pols:
        for ring in pol:
            p = [proyecta(mapa, x, y) for x, y in ring]
            if area(p) < amin:
                continue
            # anillo cerrado: se parte por el punto más lejano del primero
            j = max(range(len(p)), key=lambda i: math.dist(p[0], p[i]))
            p = simplifica(p[:j + 1], tol) + simplifica(p[j:], tol)[1:]
            if len(p) >= 4:
                sal.append([[r1(x), r1(y)] for x, y in p])
    sal.sort(key=area, reverse=True)
    return sal


def angulo(a, b):
    g = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
    while g > 90:
        g -= 180
    while g < -90:
        g += 180
    return g


def medio(pts):
    largos = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    obj, ac = sum(largos) / 2, 0
    for i, l in enumerate(largos):
        if ac + l >= obj:
            t = (obj - ac) / l
            return ([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t], angulo(pts[i], pts[i + 1]))
        ac += l
    return (pts[-1], 0)


def cerca(pts, p):
    """Ángulo del tramo más cercano a p."""
    mejor, ang = 1e9, 0
    for i in range(len(pts) - 1):
        mx, my = (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2
        d = math.hypot(mx - p[0], my - p[1])
        if d < mejor:
            mejor, ang = d, angulo(pts[i], pts[i + 1])
    return ang


def construye(c, prov, renpa):
    base = c.get('base', c['id'])
    m = MAPAS[base]
    P = lambda lon, lat: proyecta(base, lon, lat)
    sal = dict(id=c['id'], titulo=c['titulo'], corto=c['corto'], img=c['imagen'], w=m['W'], h=m['H'], temas=c['temas'], items=[])
    # Líneas de provincias (orientación)
    lineas = []
    for f in (prov['features'] if base in ('esp', 'and') else []):
        n = f['properties']['name']
        if n.startswith('Gibraltar'):
            continue
        if base == 'and' and n not in ANDALUCIA:
            continue
        lineas += anillos(base, f['geometry'], 0.5 if base == 'esp' else 0.35, 3 if base == 'esp' else 1)
    sal['prov'] = lineas
    if c['id'] == 'ren':  # nombres de provincia para la capa «Provincias» para la capa «Provincias»
        sal['provn'] = []
        for f in prov['features']:
            n = f['properties']['name']
            if (n in ANDALUCIA) if base == 'and' else not n.startswith('Gibraltar'):
                cx, cy = centro(anillos(base, f['geometry'], 0.35, 1)[0])
                sal['provn'].append([NOMBRE.get(n, n), r1(cx), r1(cy)])
    if base == 'esp':
        sal['recuadro'] = [r1(CAN['x0']), r1(CAN['y0']), r1(CAN['W']), r1(CAN['H'])]
    for it in c['items']:
        g = it['geo']
        o = dict(id=it['id'], n=it['n'], t=it['t'], g=it['g'], d=it.get('d', ''))
        for k in ('alt', 'prov', 'grupo', 'c', 'pico', 'lado', 'marco', 'pto'):
            if k in it:
                o[k] = it[k]
        lab, rot = it.get('lab'), it.get('rot')
        if g[0] == 'linea':
            pts = [P(*p) for p in g[1]]
            o.update(k='l', pts=[[r1(x), r1(y)] for x, y in pts], w=r1(km(base, g[2])))
            (lx, ly), a = medio(pts)
            if lab:
                lx, ly = P(*lab)
                a = cerca(pts, (lx, ly)) if rot is None else rot
            o['lab'] = [r1(lx), r1(ly), round(rot if rot is not None else a)]
        elif g[0] == 'area':
            pols = [[P(*p) for p in pol] for pol in g[1]]
            o.update(k='a', pols=[[[r1(x), r1(y)] for x, y in pol] for pol in pols])
            lx, ly = P(*lab) if lab else centro(pols[0] + [pols[0][0]])
            o['lab'] = [r1(lx), r1(ly), rot or 0]
        elif g[0] == 'punto':
            can = base == 'esp' and es_canarias(g[1], g[2])
            x, y = P(g[1], g[2])
            o.update(k='p', x=r1(x), y=r1(y), r=r1(km(base, g[3], can)))
        elif g[0] == 'rio':
            partes = []
            for parte in RIOS[base][g[1]]:
                pp = simplifica([P(x, y) for x, y in parte], 0.45)
                if len(pp) > 1:
                    partes.append(pp)
            partes.sort(key=lambda q: sum(math.dist(q[i], q[i + 1]) for i in range(len(q) - 1)), reverse=True)
            o.update(k='l', pts=[[r1(x), r1(y)] for x, y in partes[0]], w=3.5)
            if len(partes) > 1:
                o['mas'] = [[[r1(x), r1(y)] for x, y in q] for q in partes[1:]]
            (lx, ly), a = medio(partes[0])
            if lab:
                lx, ly = P(*lab)
            o['lab'] = [r1(lx), r1(ly), round(rot if rot is not None else a)]
        elif g[0] == 'prov':
            f = next(f for f in prov['features'] if f['properties']['name'] == g[1])
            rings = anillos(base, f['geometry'], 0.35, 1)
            xs = [q[0] for q in rings[0]]
            ys = [q[1] for q in rings[0]]
            o.update(k='g', rings=rings, bb=[min(xs), min(ys), max(xs), max(ys)])
            lx, ly = P(*lab) if lab else centro(rings[0])
            o['lab'] = [r1(lx), r1(ly), 0]
        elif g[0] == 'renpa':
            fs = [f for f in renpa['features'] if f['properties']['figura'] == g[1] and f['properties']['nombre'] == g[2]]
            assert fs, g
            rings = []
            for f in fs:
                rings += anillos(base, f['geometry'], 0.3, 0.6)
            rings.sort(key=area, reverse=True)
            xs = [q[0] for q in rings[0]]
            ys = [q[1] for q in rings[0]]
            o.update(k='g', rings=rings, ha=sum(f['properties']['ha'] for f in fs), bb=[min(xs), min(ys), max(xs), max(ys)])
            lx, ly = P(*lab) if lab else centro(rings[0])
            o['lab'] = [r1(lx), r1(ly), 0]
        sal['items'].append(o)
    pv = [o for o in sal['items'] if o.get('c') == 'prov']
    def vecinas(a, b):
        A, B = a['bb'], b['bb']
        if A[0] > B[2] + 1 or B[0] > A[2] + 1 or A[1] > B[3] + 1 or B[1] > A[3] + 1:
            return False
        pb = [q for r in b['rings'] for q in r]
        return any(abs(p[0] - q[0]) < 1.5 and abs(p[1] - q[1]) < 1.5 for r in a['rings'] for p in r for q in pb)
    if c['id'] == 'esp':
        # Un color por comunidad autónoma (vecinas distintas) y su contorno para trazarlo grueso
        coms, sal['ccaa'] = [], []
        for f in carga('comunidades.geojson')['features']:
            if f['properties']['name'].startswith('Gibraltar'):
                continue
            rings = anillos(base, f['geometry'], 0.35, 1)
            xs = [q[0] for r in rings for q in r]
            ys = [q[1] for r in rings for q in r]
            coms.append(dict(rings=rings, bb=[min(xs), min(ys), max(xs), max(ys)]))
            sal['ccaa'] += rings
        for i, o in enumerate(coms):
            usados = {x['col'] for x in coms[:i] if vecinas(o, x)}
            o['col'] = next(k for k in [(i * 3 + j) % 8 for j in range(8)] if k not in usados)
        def dentro(pt, ring):
            x, y, d = pt[0], pt[1], False
            for i in range(len(ring) - 1):
                a, b = ring[i], ring[i + 1]
                if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
                    d = not d
            return d
        for o in pv:
            pt = centro(o['rings'][0])
            o['col'] = next((k['col'] for k in coms if any(dentro(pt, r) for r in k['rings'])), 0)
    else:
        for i, o in enumerate(pv):
            usados = {x['col'] for x in pv[:i] if vecinas(o, x)}
            o['col'] = next(k for k in [(i + j) % 8 for j in range(8)] if k not in usados)
    return sal


RIOS = carga('rios.json')

if __name__ == '__main__':
    prov = carga('provincias.geojson')
    renpa = carga('renpa_parques.geojson')
    datos = [construye(c, prov, renpa) for c in MAPAS_CONTENIDO]
    txt = 'window.ATLAS=' + json.dumps(datos, ensure_ascii=False, separators=(',', ':')) + ';\n'
    with open(os.path.join(AQUI, '..', 'js', 'datos.js'), 'w', encoding='utf-8') as f:
        f.write(txt)
    for d in datos:
        print(d['id'], len(d['items']), 'elementos')
    print(round(len(txt.encode()) / 1024), 'KB')
