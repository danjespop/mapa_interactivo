"""Proyección de los dos mapas (unidades del SVG, 1000 de ancho).

'esp' lleva las Canarias en un recuadro abajo a la izquierda, como el libro.
"""
import math

MAPAS = {
    'esp': dict(lon0=-10.3, lon1=4.7, lat0=34.9, lat1=44.1, latm=39.5),
    'and': dict(lon0=-7.75, lon1=-1.35, lat0=35.75, lat1=38.85, latm=37.3),
}
for m in MAPAS.values():
    m['kx'] = math.cos(math.radians(m['latm']))
    m['S'] = 1000 / ((m['lon1'] - m['lon0']) * m['kx'])
    m['W'] = 1000.0
    m['H'] = round((m['lat1'] - m['lat0']) * m['S'], 1)

# Recuadro de Canarias dentro del mapa de España
CAN = dict(lon0=-18.4, lon1=-13.2, lat0=27.45, lat1=29.55, latm=28.5, S=50.0, x0=26.0)
CAN['kx'] = math.cos(math.radians(CAN['latm']))
CAN['W'] = (CAN['lon1'] - CAN['lon0']) * CAN['kx'] * CAN['S']
CAN['H'] = (CAN['lat1'] - CAN['lat0']) * CAN['S']
CAN['y0'] = MAPAS['esp']['H'] - CAN['H'] - 26.0


def es_canarias(lon, lat):
    return lon < -12.5 and lat < 30.5


def proyecta(mapa, lon, lat):
    if mapa == 'esp' and es_canarias(lon, lat):
        c = CAN
        return (c['x0'] + (lon - c['lon0']) * c['kx'] * c['S'], c['y0'] + (c['lat1'] - lat) * c['S'])
    m = MAPAS[mapa]
    return ((lon - m['lon0']) * m['kx'] * m['S'], (m['lat1'] - lat) * m['S'])


def km(mapa, k, canarias=False):
    """Kilómetros -> unidades del SVG."""
    S = CAN['S'] if canarias else MAPAS[mapa]['S']
    return k * S / 111.32
