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


class Proy:
    """Proyección de los mapas de continentes y del mundo.

    'equi': cilíndrica sencilla (longitud escalada por el coseno de una latitud media).
    'conica': cónica equidistante con dos paralelos; da a Europa y Asia la forma de los atlas.
    Trabaja en «grados»: una unidad en bruto equivale a 111,32 km.
    """

    def __init__(self, tipo, lon0, lon1, lat0, lat1, latm=0.0, f1=None, f2=None, lc=None, envuelve=False):
        self.tipo, self.env = tipo, envuelve
        self.caja = (lon0, lon1, lat0, lat1)
        if tipo == 'equi':
            self.kx = math.cos(math.radians(latm))
        else:
            r1, r2 = math.radians(f1), math.radians(f2)
            self.n = (math.cos(r1) - math.cos(r2)) / (r2 - r1)
            self.G = math.degrees(math.cos(r1) / self.n) + f1
            self.lc = lc
        us, vs = [], []
        for i in range(61):
            t = i / 60
            for lon, lat in ((lon0 + (lon1 - lon0) * t, lat0), (lon0 + (lon1 - lon0) * t, lat1), (lon0, lat0 + (lat1 - lat0) * t), (lon1, lat0 + (lat1 - lat0) * t)):
                u, v = self._bruto(lon, lat)
                us.append(u)
                vs.append(v)
        self.u0, self.v1 = min(us), max(vs)
        self.S = 1000 / (max(us) - min(us))
        self.W, self.H = 1000.0, round((max(vs) - min(vs)) * self.S, 1)

    def _bruto(self, lon, lat):
        if self.env and lon < 0:
            lon += 360
        if self.tipo == 'equi':
            return lon * self.kx, lat
        th = math.radians(self.n * (lon - self.lc))
        rho = self.G - lat
        return rho * math.sin(th), -rho * math.cos(th)

    def proyecta(self, lon, lat):
        u, v = self._bruto(lon, lat)
        return (u - self.u0) * self.S, (self.v1 - v) * self.S

    def inversa(self, x, y):
        """x, y: matrices numpy en unidades del SVG -> (lon, lat)."""
        import numpy as np
        u, v = x / self.S + self.u0, self.v1 - y / self.S
        if self.tipo == 'equi':
            return u / self.kx, v
        rho = np.hypot(u, v)
        return self.lc + np.degrees(np.arctan2(u, -v)) / self.n, self.G - rho


NUEVOS = {
    'eur': Proy('conica', -24, 62, 27, 73, f1=40, f2=62, lc=17),
    'ame': Proy('equi', -170, -12, -57, 84, latm=38),
    'afr': Proy('equi', -22, 55, -37, 39, latm=5),
    'asi': Proy('conica', 24, 180, -11, 80, f1=15, f2=58, lc=98),
    'oce': Proy('equi', 110, 192, -49, 14, latm=20, envuelve=True),
    'mun': Proy('equi', -180, 180, -80, 84, latm=40),
}
for _k, _p in NUEVOS.items():
    MAPAS[_k] = dict(W=_p.W, H=_p.H, S=_p.S, obj=_p)


def es_canarias(lon, lat):
    return lon < -12.5 and lat < 30.5


def proyecta(mapa, lon, lat):
    if mapa in NUEVOS:
        return NUEVOS[mapa].proyecta(lon, lat)
    if mapa == 'esp' and es_canarias(lon, lat):
        c = CAN
        return (c['x0'] + (lon - c['lon0']) * c['kx'] * c['S'], c['y0'] + (c['lat1'] - lat) * c['S'])
    m = MAPAS[mapa]
    return ((lon - m['lon0']) * m['kx'] * m['S'], (m['lat1'] - lat) * m['S'])


def km(mapa, k, canarias=False):
    """Kilómetros -> unidades del SVG."""
    S = CAN['S'] if canarias else MAPAS[mapa]['S']
    return k * S / 111.32
