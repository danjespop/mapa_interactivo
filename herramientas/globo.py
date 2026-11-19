"""Textura del globo terráqueo y mapa de continentes. Uso: TESELAS=... python3 herramientas/globo.py

  img/relieve-globo.jpg   relieve de toda la Tierra, 4096x2048, longitud/latitud lineales (-180..180, 90..-90)
  img/continentes.png     2048x1024, mismo encuadre; cada píxel de tierra lleva el número de su continente x 40
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from relieve import alturas, pinta, sombreado, AQUI
from relieve_mundo import TIERRA2, URAL, MEDI, ROJO, GROENLANDIA

W, H = 4096, 2048
CONTINENTES = ['', 'Europa', 'Asia', 'África', 'América', 'Oceanía', 'Antártida']
# Se pintan en este orden; lo último manda donde se pisan.
ZONAS = [
    (4, [(-169.2, 90), (-10, 90), (-10, 70), (-27, 68), (-27, 60), (-33, 55), (-33, -60), (-169.2, -60)]),
    (1, [(69, 81)] + URAL + MEDI + [(-30, 35.5), (-30, 62.5), (-25.5, 62.5), (-25.5, 67), (-12, 67), (-12, 81)]),
    (1, [(31.5, 34.2), (35, 34.2), (35, 36), (31.5, 36)]),
    (3, [(-25, 37)] + MEDI[::-1] + ROJO + [(60, 5), (60, -40), (-25, -40)]),
    (2, URAL + [(31, 33)] + ROJO[1:] + [(60, -15), (129, -15), (129, 0), (134, 5), (180, 5), (180, 86), (69, 86)]),
    (2, [(-180, 62), (-169.2, 62), (-169.2, 72), (-180, 72)]),
    (5, [(129, -11), (129, 0), (134, 5), (180, 25), (180, -55), (110, -55), (110, -11)]),
    (5, [(-180, 25), (-125, 25), (-125, -55), (-180, -55)]),
    (6, [(-180, -60), (180, -60), (180, -90), (-180, -90)]),
]


def px(pol, w, h):
    return [((x + 180) / 360 * w, (90 - y) / 180 * h) for x, y in pol]


if __name__ == '__main__':
    lon, lat = np.meshgrid(-180 + (np.arange(W) + 0.5) * 360 / W, 90 - (np.arange(H) + 0.5) * 180 / H)
    h = alturas(lon, lat, 4)
    img = pinta(h, 9800.0, 26, np.ones(h.shape, bool), TIERRA2)
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    d.polygon(px(GROENLANDIA, W, H), fill=255)
    d.polygon(px([(-180, -60), (180, -60), (180, -90), (-180, -90)], W, H), fill=255)
    hielo = (np.asarray(m) > 127) & (h > 60)
    s = sombreado(np.where(h > 0.5, h, 0), 9800.0, 26)
    img = np.where(hielo[..., None], (236 + 16 * s)[..., None] * np.array([0.985, 0.99, 1.0]), img)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5)).save(
        os.path.join(AQUI, '..', 'img', 'relieve-globo.jpg'), quality=80, optimize=True, progressive=True)

    w2, h2 = W // 2, H // 2
    ids = Image.new('L', (w2, h2), 0)
    d = ImageDraw.Draw(ids)
    for n, pol in ZONAS:
        d.polygon(px(pol, w2, h2), fill=n * 40)
    tierra = h[::2, ::2] > 0.5
    Image.fromarray(np.where(tierra, np.asarray(ids), 0).astype(np.uint8)).save(os.path.join(AQUI, '..', 'img', 'continentes.png'), optimize=True)
    print('ok')
