"""Imágenes de relieve de los continentes y del mundo. Uso: TESELAS=... python3 herramientas/relieve_mundo.py [ids]"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from proyeccion import NUEVOS
from relieve import alturas, pinta, sombreado, ESCALA, AQUI

# Escala de alturas para montañas de hasta 8000 m
TIERRA2 = [(0, (150, 186, 124)), (200, (176, 203, 135)), (500, (214, 218, 150)), (1000, (236, 214, 148)), (1500, (228, 186, 122)),
           (2500, (200, 142, 96)), (3500, (170, 112, 84)), (4500, (150, 104, 92)), (5500, (198, 186, 182)), (6500, (244, 242, 240))]

# Límites aproximados entre continentes (lon, lat). Solo importan donde hay tierra.
URAL = [(69, 76), (68, 69.5), (66, 68), (60, 64), (59.5, 60), (59, 56), (59.5, 53), (58.5, 51.2), (55, 51.5), (51.5, 50.5), (51.9, 47), (50, 45),
        (49.8, 40.5), (46.5, 41.8), (42.5, 43.2), (39.5, 43.5), (35, 43), (29.2, 41.3), (26.7, 40.4), (26.2, 39.5), (27.5, 36.5), (27, 34.3)]
MEDI = [(20, 34.3), (14, 35.5), (12, 36.3), (11.3, 37.6), (8, 37.9), (3, 37.5), (-2, 36.5), (-5.6, 35.95), (-12, 35.5)]
ROJO = [(31, 33), (32.3, 31.3), (32.6, 29.9), (35.5, 26), (38.5, 21), (41.5, 16), (43.3, 12.6), (48, 12.5), (55, 13.5)]
GROENLANDIA = [(-52, 61.5), (-42, 60), (-22, 69.5), (-18, 76), (-20, 81.5), (-35, 83.7), (-60, 82.3), (-72, 78.5), (-60, 75.5), (-54, 68)]
ZONAS = {
    'eur': dict(z=5, fuerza=9, dentro=[URAL + MEDI + [(-30, 35.5), (-30, 76)], [(31.5, 34.2), (35, 34.2), (35, 36), (31.5, 36)],
                                         [(-19, 27.3), (-13, 27.3), (-13, 29.6), (-19, 29.6)]]),
    'ame': dict(z=5, fuerza=14, fuera=[[(-10, 86), (-10, 70), (-27, 68), (-27, 60), (-33, 55), (-33, -60), (0, -60), (0, 86)]], hielo=[GROENLANDIA]),
    'afr': dict(z=5, fuerza=12, dentro=[[(-25, 37)] + MEDI[::-1] + ROJO + [(60, 5), (60, -40), (-25, -40)]]),
    'asi': dict(z=5, fuerza=14, dentro=[URAL + [(31, 33)] + ROJO[1:] + [(60, -15), (129, -15), (129, 0), (134, 5), (200, 5), (200, 86), (69, 86)]]),
    'oce': dict(z=5, fuerza=12, fuera=[[(100, 20), (132, 20), (132, 3), (129, 0), (129, -11), (100, -11)]]),
    'mun': dict(z=4, fuerza=30, hielo=[GROENLANDIA, [(-180, -60), (180, -60), (180, -86), (-180, -86)]]),
}


def mascara(p, ancho, alto, pols):
    m = Image.new('L', (ancho, alto), 0)
    d = ImageDraw.Draw(m)
    for pol in pols:
        d.polygon([tuple(c * ESCALA for c in p.proyecta(x, y)) for x, y in pol], fill=255)
    return np.asarray(m) > 127


def genera(clave):
    p, zo = NUEVOS[clave], ZONAS[clave]
    ancho, alto = int(p.W * ESCALA), int(round(p.H * ESCALA))
    X, Y = np.meshgrid((np.arange(ancho) + 0.5) / ESCALA, (np.arange(alto) + 0.5) / ESCALA)
    lon, lat = p.inversa(X, Y)
    h = alturas(lon, lat, zo['z'])
    dentro = np.ones(h.shape, bool)
    if 'dentro' in zo:
        dentro = mascara(p, ancho, alto, zo['dentro'])
    if 'fuera' in zo:
        dentro &= ~mascara(p, ancho, alto, zo['fuera'])
    metros_px = 111320 / p.S / ESCALA
    img = pinta(h, metros_px, zo['fuerza'], dentro, TIERRA2)
    if 'hielo' in zo:  # casquetes de hielo en blanco
        hielo = mascara(p, ancho, alto, zo['hielo']) & (h > 60)
        s = sombreado(np.where(h > 0.5, h, 0), metros_px, zo['fuerza'])
        img = np.where(hielo[..., None], (236 + 16 * s)[..., None] * np.array([0.985, 0.99, 1.0]), img)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))


NOMBRE = {'eur': 'europa', 'ame': 'america', 'afr': 'africa', 'asi': 'asia', 'oce': 'oceania', 'mun': 'mundo'}
if __name__ == '__main__':
    for clave in (sys.argv[1:] or list(NUEVOS)):
        genera(clave).save(os.path.join(AQUI, '..', 'img', 'relieve-%s.jpg' % NOMBRE[clave]), quality=78, optimize=True, progressive=True)
        print(clave, 'ok', NUEVOS[clave].W, NUEVOS[clave].H)
