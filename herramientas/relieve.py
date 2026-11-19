"""Genera las imágenes de relieve (tintas hipsométricas + sombreado) sin nombres.

Fuente de alturas: Terrain Tiles (Mapzen/AWS, formato terrarium).
Uso: python3 herramientas/relieve.py   (necesita internet la primera vez)
"""
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from proyeccion import MAPAS, CAN

AQUI = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get('TESELAS', os.path.join(AQUI, '_teselas'))
ESCALA = 2  # píxeles por unidad del SVG


def tesela(z, x, y):
    ruta = os.path.join(CACHE, f'{z}_{x}_{y}.png')
    if not os.path.exists(ruta):
        os.makedirs(CACHE, exist_ok=True)
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        subprocess.run(['curl', '-sS', '-m', '60', '--retry', '3', '-o', ruta, url], check=True)
    a = np.asarray(Image.open(ruta).convert('RGB'), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def alturas(lon, lat, z):
    """Altura (m) para mallas lon/lat, muestreando teselas Mercator. Admite longitudes fuera de ±180."""
    from concurrent.futures import ThreadPoolExecutor
    n = 2 ** z
    lat = np.clip(lat, -84.9, 84.9)
    fx = (lon + 180) / 360 * n * 256
    s = np.sin(np.radians(lat))
    fy = (0.5 - np.log((1 + s) / (1 - s)) / (4 * math.pi)) * n * 256
    tx0, tx1 = int(fx.min() // 256), int(fx.max() // 256)
    ty0, ty1 = max(0, int(fy.min() // 256)), min(n - 1, int(fy.max() // 256))
    mos = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    lista = [(tx, ty) for ty in range(ty0, ty1 + 1) for tx in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(12) as ex:
        teselas = list(ex.map(lambda q: tesela(z, q[0] % n, q[1]), lista))
    for (tx, ty), t in zip(lista, teselas):
        mos[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = t
    px = np.clip(fx - tx0 * 256, 0, mos.shape[1] - 1.001)
    py = np.clip(fy - ty0 * 256, 0, mos.shape[0] - 1.001)
    x0, y0 = px.astype(int), py.astype(int)
    dx, dy = px - x0, py - y0
    return (mos[y0, x0] * (1 - dx) * (1 - dy) + mos[y0, x0 + 1] * dx * (1 - dy)
            + mos[y0 + 1, x0] * (1 - dx) * dy + mos[y0 + 1, x0 + 1] * dx * dy)


TIERRA = [(0, (150, 186, 124)), (150, (176, 203, 135)), (350, (208, 216, 150)), (600, (235, 224, 158)),
          (900, (236, 203, 136)), (1300, (222, 172, 112)), (1800, (198, 138, 92)), (2400, (168, 108, 78)),
          (2900, (150, 96, 76)), (3300, (236, 232, 228))]
MAR = [(-4000, (118, 164, 206)), (-2000, (138, 181, 216)), (-800, (160, 198, 226)), (-200, (184, 214, 235)),
       (0, (205, 228, 242))]
FUERA = [(0, (236, 234, 226)), (800, (228, 225, 216)), (2500, (214, 210, 200))]


def tinta(h, tabla):
    xs = [t[0] for t in tabla]
    return np.stack([np.interp(h, xs, [t[1][i] for t in tabla]) for i in range(3)], -1)


def sombreado(h, metros_px, fuerza):
    gy, gx = np.gradient(h, metros_px)
    az, alt = math.radians(315), math.radians(45)
    pend = np.arctan(fuerza * np.hypot(gx, gy))
    asp = np.arctan2(-gx, gy)
    s = np.sin(alt) * np.cos(pend) + np.cos(alt) * np.sin(pend) * np.cos(az - asp)
    return np.clip(s, 0, 1)


def pinta(h, metros_px, fuerza, dentro, tabla=None):
    """dentro: máscara booleana del territorio que se estudia (color pleno)."""
    tierra = h > 0.5
    img = np.where(tierra[..., None], tinta(h, tabla or TIERRA), tinta(h, MAR))
    img = np.where((tierra & ~dentro)[..., None], tinta(h, FUERA), img)
    s = sombreado(np.where(tierra, h, 0), metros_px, fuerza)
    luz = 0.62 + 0.52 * s
    luz = np.where(tierra & dentro, luz, np.where(tierra, 0.9 + 0.14 * s, 1.0))
    return np.clip(img * luz[..., None], 0, 255)


def mascara(ancho, alto, anillos_px):
    m = Image.new('L', (ancho, alto), 0)
    d = ImageDraw.Draw(m)
    for ext, huecos in anillos_px:
        d.polygon(ext, fill=255)
        for hu in huecos:
            d.polygon(hu, fill=0)
    return np.asarray(m) > 127


def poligonos(geom):
    return [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']


def malla(m, ancho, alto):
    xs = (np.arange(ancho) + 0.5) / ESCALA
    ys = (np.arange(alto) + 0.5) / ESCALA
    lon = m['lon0'] + xs / (m['kx'] * m['S'])
    lat = m['lat1'] - ys / m['S']
    return np.meshgrid(lon, lat)


def genera(mapa, z, fuerza, filtro):
    m = MAPAS[mapa]
    ancho, alto = int(m['W'] * ESCALA), int(round(m['H'] * ESCALA))
    lon, lat = malla(m, ancho, alto)
    h = alturas(lon, lat, z)
    prov = json.load(open(os.path.join(AQUI, 'datos', 'provincias.geojson')))
    anillos = []
    for f in prov['features']:
        if not filtro(f['properties']['name']):
            continue
        for pol in poligonos(f['geometry']):
            px = [[((x - m['lon0']) * m['kx'] * m['S'] * ESCALA, (m['lat1'] - y) * m['S'] * ESCALA) for x, y in r] for r in pol]
            anillos.append((px[0], px[1:]))
    dentro = mascara(ancho, alto, anillos)
    metros_px = 111320 / m['S'] / ESCALA
    img = pinta(h, metros_px, fuerza, dentro)
    if mapa == 'esp':
        c = CAN
        cw, ch = int(round(c['W'] * ESCALA)), int(round(c['H'] * ESCALA))
        clon, clat = malla(c, cw, ch)
        hc = alturas(clon, clat, 8)
        ic = pinta(hc, 111320 / c['S'] / ESCALA, fuerza * 0.6, np.ones(hc.shape, bool))
        x0, y0 = int(round(c['x0'] * ESCALA)), int(round(c['y0'] * ESCALA))
        img[y0:y0 + ch, x0:x0 + cw] = ic
    return Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))


ANDALUCIA = {'Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'}

if __name__ == '__main__':
    salida = os.path.join(AQUI, '..', 'img')
    genera('esp', 8, 2.2, lambda n: not n.startswith('Gibraltar')).save(
        os.path.join(salida, 'relieve-espana.jpg'), quality=80, optimize=True, progressive=True)
    genera('and', 9, 1.6, lambda n: n in ANDALUCIA).save(
        os.path.join(salida, 'relieve-andalucia.jpg'), quality=80, optimize=True, progressive=True)
    print('ok')
