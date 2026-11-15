"""Calcula el curso de los ríos y lo guarda en datos/rios.json.

Dos fuentes:
  - Natural Earth (dominio público) para los ríos que trae: los grandes y varios afluentes.
  - Para el resto, se deja «caer el agua» por el relieve desde el nacimiento
    (relleno de depresiones por inundación con prioridad y descenso por la red de drenaje).

Uso: TESELAS=... python3 herramientas/rios.py carpeta_con_geojson_de_natural_earth
"""
import heapq, json, math, os, sys
import numpy as np
from relieve import alturas

AQUI = os.path.dirname(os.path.abspath(__file__))

# nombre -> (nacimiento lon, lat, final esperado lon, lat). «None» = tomar de Natural Earth.
ESP = dict(caja=(-9.7, 35.9, 3.6, 43.95), paso=0.005, z=8, rios=[
    ('Miño', None), ('Duero', None), ('Tajo', None), ('Guadiana', None), ('Guadalquivir', None), ('Ebro', None),
    ('Júcar', None), ('Segura', None), ('Turia', None),
    ('Sil', None), ('Esla', None), ('Tormes', None), ('Henares', None), ('Alberche', None),
    ('Cinca', None), ('Segre', None), ('Cabriel', None),
    ('Pisuerga', (-4.42, 42.98, -4.87, 41.56, 'Duero')), ('Jalón', (-2.48, 41.12, -1.14, 41.77, 'Ebro')),
    ('Genil', 'and'), ('Odiel', 'and'), ('Tinto', 'and'), ('Guadalete', 'and'),
    ('Nalón', (-5.22, 43.11, -6.08, 43.56)), ('Navia', (-7.02, 42.82, -6.72, 43.55)), ('Nervión', (-2.98, 42.95, -3.02, 43.35)),
    ('Llobregat', (1.99, 42.28, 2.13, 41.30)), ('Ter', (2.25, 42.42, 3.20, 42.02)),
    ('Jarama', (-3.42, 41.13, -3.62, 40.03, 'Tajo')), ('Aragón', (-0.52, 42.78, -1.78, 42.22, 'Ebro')), ('Gállego', (-0.41, 42.80, -0.86, 41.66, 'Ebro')),
])
AND = dict(caja=(-7.75, 35.75, -1.35, 38.85), paso=0.0025, z=9, rios=[
    ('Guadalquivir', None), ('Guadiana', None), ('Guadiana Menor', None), ('Guadalimar', None), ('Segura', None),
    ('Genil', (-3.33, 37.10, -5.28, 37.70, 'Guadalquivir')),
    ('Jándula', (-3.95, 38.45, -3.98, 38.03, 'Guadalquivir')), ('Guadiato', (-5.45, 38.27, -5.03, 37.80, 'Guadalquivir')), ('Bembézar', (-5.72, 38.22, -5.30, 37.72, 'Guadalquivir')),
    ('Viar', (-6.05, 38.18, -5.83, 37.60, 'Guadalquivir')), ('Guadajoz', (-4.02, 37.50, -4.84, 37.84, 'Guadalquivir')), ('Guadaíra', (-5.47, 37.13, -6.00, 37.30, 'Guadalquivir')),
    ('Chanza', (-6.85, 37.92, -7.50, 37.55, 'Guadiana')), ('Odiel', (-6.63, 37.87, -6.95, 37.20)), ('Tinto', (-6.55, 37.72, -6.90, 37.20)),
    ('Guadalete', (-5.37, 36.78, -6.24, 36.60)), ('Barbate', (-5.72, 36.46, -5.92, 36.18)), ('Guadiaro', (-5.15, 36.75, -5.28, 36.28)),
    ('Guadalhorce', (-4.30, 37.03, -4.45, 36.67)), ('Guadalfeo', (-3.18, 36.94, -3.58, 36.72)), ('Andarax', (-2.90, 37.02, -2.43, 36.82)),
    ('Almanzora', (-2.60, 37.33, -1.78, 37.25)),
])
BOCAS = {'Tajo': [(-8.95, 38.93), (-9.05, 38.78), (-9.18, 38.68), (-9.34, 38.67)],
         'Guadalquivir': [(-6.28, 36.87), (-6.35, 36.79), (-6.42, 36.75)],
         'Miño': [(-8.83, 41.90), (-8.88, 41.86)], 'Duero': [(-8.69, 41.145)]}
NE_NOMBRE = {'Mio': 'Miño', 'Minho': 'Miño', 'Tejo': 'Tajo', 'Zncara': 'Záncara'}


def natural_earth(carpeta):
    rios = {}
    for f in ('ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe'):
        for ft in json.load(open(os.path.join(carpeta, f + '.geojson'), encoding='utf-8'))['features']:
            g, n = ft['geometry'], ft['properties'].get('name')
            if not g or not n:
                continue
            lineas = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
            for l in lineas:
                if any(-9.7 < p[0] < 3.6 and 35.9 < p[1] < 43.95 for p in l):
                    rios.setdefault(NE_NOMBRE.get(n, n), []).append([[round(p[0], 4), round(p[1], 4)] for p in l])
    for n, partes in rios.items():  # unir tramos que se tocan por los extremos
        cambio = True
        while cambio:
            cambio = False
            for i in range(len(partes)):
                for j in range(len(partes)):
                    if i == j:
                        continue
                    A, B = partes[i], partes[j]
                    # los tramos pueden venir en cualquier sentido
                    if math.dist(A[-1], B[-1]) < 0.02:
                        B = B[::-1]
                    elif math.dist(A[0], B[0]) < 0.02:
                        A = A[::-1]
                    elif math.dist(A[0], B[-1]) < 0.02:
                        A, B = B, A
                    if math.dist(A[-1], B[0]) < 0.02:
                        partes[i] = A + B[1:]
                        del partes[j]
                        cambio = True
                        break
                if cambio:
                    break
        partes.sort(key=len, reverse=True)
    # Natural Earth corta el río donde empieza el estuario: se prolonga hasta el mar
    for n, extra in BOCAS.items():
        p = rios[n][0]
        if math.dist(p[0], extra[0]) < math.dist(p[-1], extra[0]):
            p.reverse()
        p.extend([list(q) for q in extra])
    # Natural Earth prolonga el Henares por el curso bajo del Jarama: se corta en la confluencia
    h = rios['Henares'][0]
    k = min(range(len(h)), key=lambda i: math.dist(h[i], (-3.50, 40.39)))
    rios['Henares'] = [h[:k + 1]]
    return rios


def drenaje(m):
    x0, y0, x1, y1 = m['caja']
    paso = m['paso']
    lon = np.arange(x0, x1, paso)
    lat = np.arange(y1, y0, -paso)
    LON, LAT = np.meshgrid(lon, lat)
    h = alturas(LON, LAT, m['z'])
    H, W = h.shape
    W2 = W + 2
    e = np.full((H + 2, W2), -1.0, np.float32)  # borde = «mar»
    e[1:-1, 1:-1] = h
    elev = e.ravel().tolist()
    n = len(elev)
    hecho = bytearray(n)
    padre = [-1] * n
    vec = (-W2 - 1, -W2, -W2 + 1, -1, 1, W2 - 1, W2, W2 + 1)
    monton, orden = [], []
    pila = [0]
    hecho[0] = 1
    while pila:  # mar de verdad: cota <= 0 y unido al borde (los embalses también vienen con cota 0)
        i = pila.pop()
        for dd in vec:
            j = i + dd
            if 0 <= j < n and not hecho[j] and elev[j] <= 0.5:
                hecho[j] = 1
                pila.append(j)
    mar = bytes(hecho)
    for r in range(1, H + 1):  # semillas: mar pegado a tierra
        b = r * W2
        for c in range(1, W + 1):
            i = b + c
            if hecho[i] and any(not hecho[i + d] for d in vec):
                monton.append((0.0, i))
    heapq.heapify(monton)
    pop, push = heapq.heappop, heapq.heappush
    while monton:
        el, i = pop(monton)
        for d in vec:
            j = i + d
            if not hecho[j]:
                hecho[j] = 1
                padre[j] = i
                ej = elev[j]
                push(monton, (ej if ej > el else el, j))
                orden.append(j)
    acum = [1] * n
    for j in reversed(orden):
        acum[padre[j]] += acum[j]
    return dict(W2=W2, H=H, W=W, x0=x0, y1=y1, paso=paso, padre=padre, acum=acum, elev=elev, mar=mar)


def traza(d, lon, lat, usados, radio_km=3.0):
    W2, paso = d['W2'], d['paso']
    c0 = int((lon - d['x0']) / paso) + 1
    r0 = int((d['y1'] - lat) / paso) + 1
    rr = max(1, int(radio_km / 111.0 / paso))
    mejor = max(((d['acum'][r * W2 + c], r * W2 + c) for r in range(r0 - rr, r0 + rr + 1) for c in range(c0 - rr, c0 + rr + 1)
                 if 0 < r <= d['H'] and 0 < c <= d['W']))[1]
    i, cam = mejor, []
    while i >= 0 and not d['mar'][i]:
        cam.append(i)
        if i in usados:
            break
        i = d['padre'][i]
    return [[round(d['x0'] + ((k % W2) - 0.5) * paso, 4), round(d['y1'] - ((k // W2) - 0.5) * paso, 4)] for k in cam]


def km(a, b):
    return math.hypot((a[0] - b[0]) * 111.3 * math.cos(math.radians(a[1])), (a[1] - b[1]) * 111.3)


if __name__ == '__main__':
    ne = natural_earth(sys.argv[1])
    sal = {}
    for clave, m in (('and', AND), ('esp', ESP)):
        d, celdas, sal[clave] = None, {}, {}
        # los de Natural Earth marcan por dónde van los ríos principales: sus celdas paran a los afluentes
        for n, v in m['rios']:
            if v is None:
                sal[clave][n] = ne[n]
        d = drenaje(m)
        W2, paso = d['W2'], d['paso']
        for n, partes in sal[clave].items():
            for p in partes:
                for a, b in zip(p, p[1:]):
                    pasos = max(1, int(max(abs(a[0] - b[0]), abs(a[1] - b[1])) / paso * 2))
                    for t in range(pasos + 1):
                        x, y = a[0] + (b[0] - a[0]) * t / pasos, a[1] + (b[1] - a[1]) * t / pasos
                        c, r = int((x - d['x0']) / paso) + 1, int((d['y1'] - y) / paso) + 1
                        if 0 < r <= d['H'] and 0 < c <= d['W']:
                            for dr in (-1, 0, 1):
                                for dc in (-1, 0, 1):
                                    celdas.setdefault(n, set()).add((r + dr) * W2 + c + dc)
        for n, v in m['rios']:
            if v is None:
                continue
            if v == 'and':
                sal[clave][n] = sal['and'][n]
                continue
            cam = traza(d, v[0], v[1], celdas.get(v[4], set()) if len(v) > 4 else set())
            sal[clave][n] = [cam]
            print('%s %-14s %4d km  termina a %5.1f km de lo esperado' % (clave, n, sum(km(a, b) for a, b in zip(cam, cam[1:])), km(cam[-1], v[2:])))
    json.dump(sal, open(os.path.join(AQUI, 'datos', 'rios.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
