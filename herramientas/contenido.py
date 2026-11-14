"""Contenido del atlas: lo que entra en el tema (libro de 1.º ESO, unidad 2, apartado 5)
y los parques de la RENPA. Coordenadas en longitud/latitud.

Formas:
  L(puntos, ancho_km)  cordillera o sierra: eje + medio ancho
  A(puntos)            zona (meseta, depresión, mar)
  P(lon, lat, radio_km) pico, isla o comarca pequeña
  ('prov', nombre) y ('renpa', figura, nombre) usan los límites oficiales.
"""


def L(pts, w):
    return ('linea', pts, w)


def A(*pols):
    return ('area', list(pols))


def P(lon, lat, r):
    return ('punto', lon, lat, r)


# ───────────────────────── ESPAÑA ─────────────────────────
ESP = dict(
    id='esp', titulo='Relieve de España', corto='España', imagen='relieve-espana.jpg',
    temas=[
        dict(id='unidades', n='Grandes unidades', sub='Mesetas, cordilleras y depresiones'),
        dict(id='sierras', n='Sierras', sub='Las sierras de cada cordillera'),
        dict(id='picos', n='Picos', sub='Las cumbres más altas'),
        dict(id='islas', n='Islas y mares', sub='Baleares, Canarias y los mares'),
    ],
    items=[
        # a) Unidades interiores de la Meseta
        dict(id='submeseta-norte', n='Submeseta Norte', t='Meseta', g='unidades', c='meseta',
             geo=A([(-6.0, 42.4), (-4.6, 42.6), (-3.7, 42.35), (-3.25, 41.7), (-3.8, 41.25), (-4.9, 40.85), (-6.3, 40.95), (-6.3, 41.7)]),
             lab=(-4.9, 41.75), d='Mitad norte de la Meseta Central. Por ella pasa el río Duero.', grupo='Interior de la Meseta'),
        dict(id='sistema-central', n='Sistema Central', t='Cordillera', g='unidades', c='monte',
             geo=L([(-6.75, 40.3), (-5.8, 40.3), (-5.1, 40.32), (-4.4, 40.55), (-3.9, 40.85), (-3.4, 41.15), (-2.95, 41.25)], 20),
             lab=(-4.75, 40.42), d='Divide la Meseta en dos mitades: la submeseta Norte y la submeseta Sur.', grupo='Interior de la Meseta'),
        dict(id='submeseta-sur', n='Submeseta Sur', t='Meseta', g='unidades', c='meseta',
             geo=A([(-5.2, 39.95), (-3.9, 40.15), (-2.7, 40.0), (-1.9, 39.3), (-2.2, 38.75), (-3.4, 38.65), (-4.6, 38.8), (-5.4, 39.1)]),
             lab=(-3.2, 39.1), d='Mitad sur de la Meseta Central. Por ella pasan el Tajo y el Guadiana.', grupo='Interior de la Meseta'),
        dict(id='montes-toledo', n='Montes de Toledo', t='Cordillera', g='unidades', c='monte',
             geo=L([(-5.45, 39.45), (-4.6, 39.52), (-3.85, 39.45)], 16),
             d='Montes bajos en medio de la submeseta Sur.', grupo='Interior de la Meseta'),
        # b) Unidades que bordean la Meseta
        dict(id='montes-leon', n='Montes de León', t='Cordillera', g='unidades', c='monte',
             geo=L([(-6.85, 42.2), (-6.4, 42.38), (-6.05, 42.7)], 17), lab=(-6.25, 42.25),
             d='Bordean la Meseta por el noroeste.', grupo='Borde de la Meseta'),
        dict(id='cantabrica', n='Cordillera Cantábrica', t='Cordillera', g='unidades', c='monte',
             geo=L([(-6.9, 43.0), (-6.0, 43.05), (-5.0, 43.1), (-4.2, 43.05), (-3.5, 43.05)], 23),
             d='Bordea la Meseta por el norte, junto al mar Cantábrico. Aquí están los Picos de Europa.', grupo='Borde de la Meseta'),
        dict(id='iberico', n='Sistema Ibérico', t='Cordillera', g='unidades', c='monte',
             geo=L([(-3.3, 42.2), (-2.6, 42.0), (-1.85, 41.75), (-1.6, 41.1), (-1.6, 40.5), (-1.0, 40.2), (-0.5, 40.45)], 26),
             lab=(-2.25, 41.6), rot=28, d='Bordea la Meseta por el este y la separa de la depresión del Ebro.', grupo='Borde de la Meseta'),
        dict(id='sierra-morena', n='Sierra Morena', t='Cordillera', g='unidades', c='monte',
             geo=L([(-7.0, 37.95), (-6.0, 38.0), (-5.0, 38.15), (-4.0, 38.3), (-3.2, 38.4), (-2.8, 38.45)], 20),
             d='Bordea la Meseta por el sur y la separa de Andalucía.', grupo='Borde de la Meseta'),
        # c) Unidades exteriores a la Meseta
        dict(id='macizo-galaico', n='Macizo Galaico', t='Macizo', g='unidades', c='monte',
             geo=A([(-8.9, 43.2), (-7.9, 43.6), (-7.1, 43.4), (-6.95, 42.9), (-7.05, 42.2), (-7.7, 42.0), (-8.6, 42.1), (-8.9, 42.6)]),
             lab=(-8.0, 42.9), d='Montañas antiguas y redondeadas de Galicia.', grupo='Exterior a la Meseta'),
        dict(id='montes-vascos', n='Montes Vascos', t='Cordillera', g='unidades', c='monte',
             geo=L([(-3.2, 43.05), (-2.5, 43.0), (-1.85, 43.05)], 18),
             d='Unen la cordillera Cantábrica con los Pirineos.', grupo='Exterior a la Meseta'),
        dict(id='pirineos', n='Pirineos', t='Cordillera', g='unidades', c='monte',
             geo=L([(-1.6, 43.0), (-0.5, 42.8), (0.6, 42.65), (1.6, 42.5), (2.6, 42.4), (3.1, 42.4)], 24),
             lab=(0.4, 42.68), d='Forman la frontera natural con Francia. Tienen picos de más de 3000 m.', grupo='Exterior a la Meseta'),
        dict(id='costero-catalana', n='Cordillera Costero-Catalana', t='Cordillera', g='unidades', c='monte',
             geo=L([(0.6, 40.9), (1.2, 41.25), (1.9, 41.6), (2.5, 41.85), (3.0, 42.15)], 13),
             d='Va paralela a la costa de Cataluña.', grupo='Exterior a la Meseta'),
        dict(id='beticos', n='Sistemas Béticos', t='Cordillera', g='unidades', c='monte',
             geo=L([(-5.35, 36.6), (-4.6, 36.95), (-3.6, 37.33), (-2.7, 37.72), (-1.8, 38.1), (-0.8, 38.5), (-0.1, 38.75)], 40),
             lab=(-3.0, 37.5), rot=-22, d='Van desde el estrecho de Gibraltar hasta el cabo de la Nao. Tienen el pico más alto de la Península.', grupo='Exterior a la Meseta'),
        dict(id='depresion-ebro', n='Depresión del Ebro', t='Depresión', g='unidades', c='llano',
             geo=A([(-2.4, 42.5), (-1.5, 42.45), (-0.3, 42.1), (0.7, 41.75), (0.9, 41.3), (0.3, 41.05), (-0.6, 41.25), (-1.4, 41.6), (-2.0, 42.05)]),
             lab=(-0.65, 41.72), rot=22, d='Llanura con forma de triángulo entre los Pirineos y el sistema Ibérico.', grupo='Exterior a la Meseta'),
        dict(id='depresion-guadalquivir', n='Depresión del Guadalquivir', t='Depresión', g='unidades', c='llano',
             geo=A([(-6.9, 37.25), (-6.2, 37.75), (-5.3, 37.85), (-4.5, 38.0), (-3.6, 38.1), (-3.0, 38.0), (-3.3, 37.85), (-4.2, 37.6), (-5.0, 37.3), (-5.6, 36.95), (-6.1, 36.7), (-6.4, 36.85)]),
             lab=(-5.35, 37.5), rot=-20, d='Llanura con forma de triángulo entre Sierra Morena y los sistemas Béticos.', grupo='Exterior a la Meseta'),

        # Sierras
        dict(id='gata', n='Sierra de Gata', t='Sierra', g='sierras', c='monte', geo=L([(-6.85, 40.32), (-6.3, 40.3)], 11), lab=(-6.55, 40.62), rot=0,
             d='Sierra del sistema Central, la más al oeste.'),
        dict(id='gredos', n='Sierra de Gredos', t='Sierra', g='sierras', c='monte', geo=L([(-5.75, 40.27), (-4.8, 40.3)], 12), lab=(-5.25, 39.98), rot=0,
             d='Sierra del sistema Central. Su cumbre es el Almanzor.'),
        dict(id='guadarrama', n='Sierra de Guadarrama', t='Sierra', g='sierras', c='monte', geo=L([(-4.3, 40.6), (-3.85, 40.92)], 10),
             lab=(-4.45, 40.95), rot=0, d='Sierra del sistema Central, entre Madrid y Segovia.'),
        dict(id='somosierra', n='Somosierra', t='Sierra', g='sierras', c='monte', geo=L([(-3.7, 41.05), (-3.4, 41.2)], 9),
             lab=(-3.2, 41.35), rot=0, d='Sierra del sistema Central, la más al este.'),
        dict(id='albarracin', n='Sierra de Albarracín', t='Sierra', g='sierras', c='monte', geo=L([(-1.8, 40.45), (-1.4, 40.4)], 10),
             lab=(-1.2, 40.7), rot=0, d='Sierra del sistema Ibérico, en Teruel.'),
        dict(id='serrania-cuenca', n='Serranía de Cuenca', t='Sierra', g='sierras', c='monte', geo=L([(-2.1, 40.45), (-1.95, 40.15), (-1.8, 39.95)], 11),
             lab=(-2.55, 40.0), rot=0, d='Sierra del sistema Ibérico, en Cuenca.'),
        dict(id='subbetico', n='Sistema Subbético', t='Cordillera', g='sierras', c='monte',
             geo=L([(-5.3, 36.9), (-4.3, 37.35), (-3.6, 37.65), (-2.8, 37.95), (-2.0, 38.2), (-1.0, 38.5)], 16),
             lab=(-2.9, 38.0), rot=-20, d='Parte norte de los sistemas Béticos.'),
        dict(id='penibetico', n='Sistema Penibético', t='Cordillera', g='sierras', c='monte',
             geo=L([(-5.3, 36.55), (-4.6, 36.75), (-3.9, 36.9), (-3.2, 37.05), (-2.5, 37.15), (-1.9, 37.2)], 16),
             lab=(-4.3, 36.75), rot=-10, d='Parte sur de los sistemas Béticos, pegada a la costa. Es la más alta.'),
        dict(id='sierra-nevada', n='Sierra Nevada', t='Sierra', g='sierras', c='monte', geo=L([(-3.55, 37.08), (-2.9, 37.1)], 11),
             lab=(-2.75, 36.75), rot=0, d='Sierra del sistema Penibético. Tiene las cumbres más altas de la Península.'),

        # Picos
        dict(id='teide', n='Teide', t='Pico', g='picos', pico=1, alt=3718, geo=P(-16.642, 28.272, 9),
             d='El pico más alto de España. Es un volcán de la isla de Tenerife.'),
        dict(id='mulhacen', n='Mulhacén', t='Pico', g='picos', pico=1, alt=3479, geo=P(-3.3115, 37.0534, 7), lado='E',
             d='El pico más alto de la Península. Está en Sierra Nevada.'),
        dict(id='veleta', n='Veleta', t='Pico', g='picos', pico=1, alt=3398, geo=P(-3.3658, 37.0558, 7), lado='O',
             d='Segundo pico de Sierra Nevada.'),
        dict(id='aneto', n='Aneto', t='Pico', g='picos', pico=1, alt=3404, geo=P(0.6571, 42.6311, 8), lado='E',
             d='El pico más alto de los Pirineos.'),
        dict(id='monte-perdido', n='Monte Perdido', t='Pico', g='picos', pico=1, alt=3355, geo=P(0.034, 42.6756, 8), lado='O',
             d='Pico de los Pirineos, en Huesca.'),
        dict(id='puigmal', n='Puigmal', t='Pico', g='picos', pico=1, alt=2913, geo=P(2.1167, 42.3833, 8), lado='S',
             d='Pico de los Pirineos, en Girona.'),
        dict(id='torre-cerredo', n='Torre Cerredo', t='Pico', g='picos', pico=1, alt=2650, geo=P(-4.8533, 43.1978, 8),
             d='El pico más alto de la cordillera Cantábrica, en los Picos de Europa.'),
        dict(id='almanzor', n='Almanzor', t='Pico', g='picos', pico=1, alt=2592, geo=P(-5.2975, 40.2461, 8), lado='S',
             d='El pico más alto del sistema Central, en la sierra de Gredos.'),
        dict(id='penalara', n='Peñalara', t='Pico', g='picos', pico=1, alt=2430, geo=P(-3.9556, 40.8503, 8),
             d='El pico más alto de la sierra de Guadarrama.'),
        dict(id='la-sagra', n='La Sagra', t='Pico', g='picos', pico=1, alt=2381, geo=P(-2.5656, 37.9517, 8),
             d='Pico del sistema Subbético, en Granada.'),

        # Islas y mares
        dict(id='mallorca', n='Mallorca', t='Isla', g='islas', c='isla', geo=P(2.95, 39.62, 36), d='La isla más grande de las Baleares.'),
        dict(id='menorca', n='Menorca', t='Isla', g='islas', c='isla', geo=P(4.07, 39.96, 19), lado='N', d='Isla de las Baleares, la más al este.'),
        dict(id='ibiza', n='Ibiza', t='Isla', g='islas', c='isla', geo=P(1.42, 38.98, 16), lado='O', d='Isla de las Baleares.'),
        dict(id='formentera', n='Formentera', t='Isla', g='islas', c='isla', geo=P(1.46, 38.7, 9), lado='S', d='Isla pequeña de las Baleares, al sur de Ibiza.'),
        dict(id='cabrera', n='Cabrera', t='Isla', g='islas', c='isla', geo=P(2.95, 39.15, 7), lado='S', d='Isla muy pequeña de las Baleares, al sur de Mallorca.'),
        dict(id='lanzarote', n='Lanzarote', t='Isla', g='islas', c='isla', geo=P(-13.63, 29.04, 22), lado='N', d='Isla de las Canarias, la más al este.'),
        dict(id='fuerteventura', n='Fuerteventura', t='Isla', g='islas', c='isla', geo=P(-14.0, 28.4, 30), lado='S', d='Isla alargada de las Canarias.'),
        dict(id='gran-canaria', n='Gran Canaria', t='Isla', g='islas', c='isla', geo=P(-15.6, 27.95, 22), lado='S', d='Isla redonda de las Canarias.'),
        dict(id='tenerife', n='Tenerife', t='Isla', g='islas', c='isla', geo=P(-16.55, 28.3, 30), lado='N', d='La isla más grande de las Canarias. En ella está el Teide.'),
        dict(id='la-gomera', n='La Gomera', t='Isla', g='islas', c='isla', geo=P(-17.23, 28.12, 12), lado='S', d='Isla pequeña y redonda de las Canarias.'),
        dict(id='la-palma', n='La Palma', t='Isla', g='islas', c='isla', geo=P(-17.86, 28.68, 17), lado='N', d='Isla de las Canarias, al noroeste.'),
        dict(id='el-hierro', n='El Hierro', t='Isla', g='islas', c='isla', geo=P(-18.0, 27.74, 12), lado='S', d='La isla más pequeña y más al oeste de las Canarias.'),
        dict(id='cantabrico', n='Mar Cantábrico', t='Mar', g='islas', c='mar',
             geo=A([(-7.7, 43.9), (-5.0, 43.72), (-3.0, 43.56), (-1.75, 43.5), (-1.75, 44.08), (-7.7, 44.08)]),
             lab=(-4.6, 43.88), d='Baña la costa norte. Su costa es recta y con acantilados.'),
        dict(id='atlantico', n='Océano Atlántico', t='Océano', g='islas', c='mar',
             geo=A([(-10.28, 44.08), (-8.3, 44.08), (-9.45, 43.2), (-9.15, 42.0), (-9.7, 40.0), (-9.7, 37.3), (-10.28, 37.3)],
                   [(-7.35, 37.08), (-6.5, 36.72), (-6.1, 36.15), (-6.65, 36.25)]),
             lab=(-9.95, 41.2), rot=-90, d='Baña Galicia y la costa de Huelva y Cádiz, además de las islas Canarias.'),
        dict(id='mediterraneo', n='Mar Mediterráneo', t='Mar', g='islas', c='mar',
             geo=A([(0.55, 40.25), (3.3, 41.65), (4.68, 41.65), (4.68, 36.2), (-1.9, 36.2), (-4.3, 36.42), (-2.2, 36.55), (-1.45, 37.3), (-0.55, 37.6), (0.4, 38.6), (-0.1, 39.4)]),
             lab=(2.3, 37.6), d='Baña la costa este y sur, y las islas Baleares.'),
    ])

# Provincias de España: (nombre en los datos del IGN, nombre que se muestra, comunidad, tema)
_PROV = [
    ('A Coruña', 'A Coruña', 'Galicia', 'pnorte'), ('Lugo', 'Lugo', 'Galicia', 'pnorte'), ('Ourense', 'Ourense', 'Galicia', 'pnorte'),
    ('Pontevedra', 'Pontevedra', 'Galicia', 'pnorte'), ('Asturias', 'Asturias', '', 'pnorte'), ('Cantabria', 'Cantabria', '', 'pnorte'),
    ('Bizkaia', 'Vizcaya', 'País Vasco', 'pnorte'), ('Gipuzkoa', 'Guipúzcoa', 'País Vasco', 'pnorte'), ('Araba/Álava', 'Álava', 'País Vasco', 'pnorte'),
    ('Navarra', 'Navarra', '', 'pnorte'), ('La Rioja', 'La Rioja', '', 'pnorte'), ('Huesca', 'Huesca', 'Aragón', 'pnorte'),
    ('Zaragoza', 'Zaragoza', 'Aragón', 'pnorte'), ('Teruel', 'Teruel', 'Aragón', 'pnorte'), ('Lleida', 'Lleida', 'Cataluña', 'pnorte'),
    ('Girona', 'Girona', 'Cataluña', 'pnorte'), ('Barcelona', 'Barcelona', 'Cataluña', 'pnorte'), ('Tarragona', 'Tarragona', 'Cataluña', 'pnorte'),
    ('León', 'León', 'Castilla y León', 'pcentro'), ('Zamora', 'Zamora', 'Castilla y León', 'pcentro'), ('Salamanca', 'Salamanca', 'Castilla y León', 'pcentro'),
    ('Palencia', 'Palencia', 'Castilla y León', 'pcentro'), ('Valladolid', 'Valladolid', 'Castilla y León', 'pcentro'), ('Ávila', 'Ávila', 'Castilla y León', 'pcentro'),
    ('Burgos', 'Burgos', 'Castilla y León', 'pcentro'), ('Segovia', 'Segovia', 'Castilla y León', 'pcentro'), ('Soria', 'Soria', 'Castilla y León', 'pcentro'),
    ('Madrid', 'Madrid', '', 'pcentro'), ('Guadalajara', 'Guadalajara', 'Castilla-La Mancha', 'pcentro'), ('Cuenca', 'Cuenca', 'Castilla-La Mancha', 'pcentro'),
    ('Toledo', 'Toledo', 'Castilla-La Mancha', 'pcentro'), ('Ciudad Real', 'Ciudad Real', 'Castilla-La Mancha', 'pcentro'), ('Albacete', 'Albacete', 'Castilla-La Mancha', 'pcentro'),
    ('Cáceres', 'Cáceres', 'Extremadura', 'pcentro'), ('Badajoz', 'Badajoz', 'Extremadura', 'pcentro'),
    ('Castelló/Castellón', 'Castellón', 'Comunidad Valenciana', 'psur'), ('València/Valencia', 'Valencia', 'Comunidad Valenciana', 'psur'),
    ('Alacant/Alicante', 'Alicante', 'Comunidad Valenciana', 'psur'), ('Murcia', 'Murcia', '', 'psur'),
    ('Huelva', 'Huelva', 'Andalucía', 'psur'), ('Sevilla', 'Sevilla', 'Andalucía', 'psur'), ('Cádiz', 'Cádiz', 'Andalucía', 'psur'),
    ('Córdoba', 'Córdoba', 'Andalucía', 'psur'), ('Málaga', 'Málaga', 'Andalucía', 'psur'), ('Jaén', 'Jaén', 'Andalucía', 'psur'),
    ('Granada', 'Granada', 'Andalucía', 'psur'), ('Almería', 'Almería', 'Andalucía', 'psur'),
    ('Illes Balears', 'Islas Baleares', '', 'psur'), ('Las Palmas', 'Las Palmas', 'Canarias', 'psur'),
    ('Santa Cruz de Tenerife', 'Santa Cruz de Tenerife', 'Canarias', 'psur'),
    ('Ceuta', 'Ceuta', '*', 'psur'), ('Melilla', 'Melilla', '*', 'psur'),
]
_LADO_PROV = {'Ceuta': 'S', 'Melilla': 'S', 'Guipúzcoa': 'N', 'Vizcaya': 'N'}
for _o, _v, _ca, _g in _PROV:
    ESP['items'].append(dict(
        id='prov-' + _o.lower().replace(' ', '-').replace('/', '-'), n=_v, t='Ciudad autónoma' if _ca == '*' else 'Provincia', g=_g, c='prov',
        geo=('prov', _o), grupo=_ca if _ca not in ('', '*') else None,
        d='Ciudad autónoma en el norte de África.' if _ca == '*' else ('Provincia de ' + _ca + '.' if _ca else 'Es a la vez provincia y comunidad autónoma.'),
        **({'lado': _LADO_PROV[_v]} if _v in _LADO_PROV else {})))
ESP['temas'] += [
    dict(id='pnorte', n='Provincias del norte', sub='Galicia, Cantábrico, Aragón y Cataluña'),
    dict(id='pcentro', n='Provincias del centro', sub='Las dos Castillas, Madrid y Extremadura'),
    dict(id='psur', n='Provincias del sur y las islas', sub='Levante, Andalucía, islas, Ceuta y Melilla'),
]

# ───────────────────────── ANDALUCÍA ─────────────────────────
AND = dict(
    id='and', titulo='Relieve de Andalucía', corto='Andalucía', imagen='relieve-andalucia.jpg',
    temas=[
        dict(id='unidades', n='Grandes unidades', sub='Las partes del relieve andaluz'),
        dict(id='sierras', n='Sierras y picos', sub='Las sierras de cada cordillera'),
        dict(id='llanos', n='Hoyas y campiñas', sub='Las zonas llanas'),
        dict(id='prov', n='Provincias y costas', sub='Las 8 provincias y el mar'),
    ],
    items=[
        dict(id='sierra-morena', n='Sierra Morena', t='Cordillera', g='unidades', c='monte',
             geo=L([(-7.2, 37.9), (-6.5, 37.95), (-5.7, 37.95), (-5.0, 38.15), (-4.2, 38.3), (-3.5, 38.4), (-3.05, 38.42)], 19),
             lab=(-5.1, 38.12), d='Está al norte. Separa Andalucía de la Meseta Central.'),
        dict(id='depresion-guadalquivir', n='Depresión del Guadalquivir', t='Depresión', g='unidades', c='llano',
             geo=A([(-6.95, 37.25), (-6.3, 37.65), (-5.5, 37.75), (-4.8, 37.95), (-4.0, 38.05), (-3.3, 38.05), (-3.0, 37.95), (-3.5, 37.8), (-4.3, 37.55), (-5.0, 37.25), (-5.6, 36.9), (-6.0, 36.6), (-6.35, 36.8), (-6.5, 37.0)]),
             lab=(-5.55, 37.42), rot=-22, d='Gran llanura entre Sierra Morena y las cordilleras Béticas, abierta al océano Atlántico.'),
        dict(id='beticas', n='Cordilleras Béticas', t='Cordillera', g='unidades', c='monte', marco=1,
             geo=A([(-5.75, 36.3), (-5.6, 36.95), (-4.85, 37.33), (-4.1, 37.63), (-3.4, 37.88), (-2.9, 38.2), (-2.3, 38.22), (-1.72, 37.65),
                    (-1.7, 37.2), (-2.15, 36.72), (-3.0, 36.7), (-4.0, 36.68), (-4.6, 36.58), (-5.1, 36.28), (-5.5, 36.05)]),
             lab=(-2.05, 37.5), rot=-20, d='Recorren el sureste, desde el estrecho de Gibraltar hasta Murcia. Son la Subbética y la Penibética.'),
        dict(id='subbetica', n='Cordillera Subbética', t='Cordillera', g='unidades', c='monte',
             geo=L([(-5.55, 36.5), (-5.35, 36.85), (-4.7, 37.2), (-4.0, 37.5), (-3.4, 37.7), (-2.8, 37.95), (-2.3, 38.05)], 14),
             lab=(-3.75, 37.62), rot=-22, d='Parte norte de las cordilleras Béticas.'),
        dict(id='intrabetico', n='Surco Intrabético', t='Depresión', g='unidades', c='llano',
             geo=L([(-4.6, 37.05), (-3.9, 37.2), (-3.4, 37.25), (-3.1, 37.35), (-2.75, 37.5), (-2.4, 37.65)], 8),
             lab=(-3.85, 37.22), rot=-8, d='Pasillo de hoyas que separa la Subbética de la Penibética.'),
        dict(id='penibetica', n='Cordillera Penibética', t='Cordillera', g='unidades', c='monte',
             geo=L([(-5.15, 36.6), (-4.5, 36.75), (-3.9, 36.85), (-3.3, 37.0), (-2.7, 37.1), (-2.1, 37.2)], 14),
             lab=(-4.1, 36.82), rot=-10, d='Parte sur de las cordilleras Béticas. Es la más alta y accidentada.'),

        dict(id='aroche', n='Picos de Aroche', t='Sierra', g='sierras', c='monte', geo=L([(-7.1, 37.95), (-6.87, 37.95)], 6),
             lab=(-7.0, 38.12), rot=0, d='En Sierra Morena, en la provincia de Huelva.'),
        dict(id='aracena', n='Sierra de Aracena', t='Sierra', g='sierras', c='monte', geo=L([(-6.75, 37.9), (-6.35, 37.9)], 7),
             lab=(-6.5, 37.73), rot=0, d='En Sierra Morena, en la provincia de Huelva.'),
        dict(id='andujar', n='Sierra de Andújar', t='Sierra', g='sierras', c='monte', geo=L([(-4.3, 38.3), (-3.85, 38.3)], 9),
             lab=(-4.1, 38.47), rot=0, d='En Sierra Morena, en la provincia de Jaén.'),
        dict(id='despenaperros', n='Despeñaperros', t='Desfiladero', g='sierras', c='monte', geo=P(-3.5, 38.39, 8), lado='N',
             d='Paso natural de Sierra Morena entre Andalucía y la Meseta, en Jaén.'),
        dict(id='cazorla', n='Sierra de Cazorla', t='Sierra', g='sierras', c='monte', geo=L([(-3.0, 37.85), (-2.85, 38.1)], 8),
             lab=(-3.42, 38.0), rot=0, d='En Jaén. Aquí nace el río Guadalquivir.'),
        dict(id='alcornocales', n='Sierra de los Alcornocales', t='Sierra', g='sierras', c='monte', geo=L([(-5.6, 36.25), (-5.5, 36.6)], 8),
             lab=(-6.15, 36.32), rot=0, d='En la Subbética, en la provincia de Cádiz.'),
        dict(id='grazalema', n='Sierra de Grazalema', t='Sierra', g='sierras', c='monte', geo=P(-5.38, 36.77, 9), lado='N',
             d='En la Subbética, entre Cádiz y Málaga. Es el lugar más lluvioso de España.'),
        dict(id='la-sagra', n='La Sagra', t='Pico', g='sierras', pico=1, alt=2381, geo=P(-2.5656, 37.9517, 7), lado='N',
             d='Pico de la Subbética, en el norte de Granada.'),
        dict(id='ronda', n='Serranía de Ronda', t='Sierra', g='sierras', c='monte', geo=L([(-5.25, 36.6), (-4.95, 36.72)], 9),
             lab=(-4.7, 36.5), rot=0, d='En la Penibética, en la provincia de Málaga.'),
        dict(id='sierra-nevada', n='Sierra Nevada', t='Sierra', g='sierras', c='monte', geo=L([(-3.55, 37.08), (-2.9, 37.1)], 10),
             lab=(-3.1, 37.27), rot=0, d='En la Penibética. Tiene las cumbres más altas de la Península.'),
        dict(id='mulhacen', n='Mulhacén', t='Pico', g='sierras', pico=1, alt=3479, geo=P(-3.3115, 37.0534, 5), lado='SE',
             d='El pico más alto de la Península, en Sierra Nevada.'),
        dict(id='veleta', n='Veleta', t='Pico', g='sierras', pico=1, alt=3398, geo=P(-3.3658, 37.0558, 5), lado='SO',
             d='Segundo pico de Sierra Nevada.'),
        dict(id='gador', n='Sierra de Gádor', t='Sierra', g='sierras', c='monte', geo=L([(-3.0, 36.9), (-2.65, 36.92)], 8),
             lab=(-2.8, 36.72), rot=0, d='En la Penibética, en la provincia de Almería.'),
        dict(id='sierra-baza', n='Sierra de Baza', t='Sierra', g='sierras', c='monte', geo=L([(-2.95, 37.32), (-2.72, 37.4)], 7),
             lab=(-2.82, 37.53), rot=0, d='En la Penibética, en la provincia de Granada.'),
        dict(id='filabres', n='Sierra de los Filabres', t='Sierra', g='sierras', c='monte', geo=L([(-2.65, 37.22), (-2.1, 37.25)], 7),
             lab=(-2.2, 37.4), rot=0, d='En la Penibética, en la provincia de Almería.'),

        dict(id='hoya-antequera', n='Hoya de Antequera', t='Hoya', g='llanos', c='llano', geo=P(-4.6, 37.07, 13), lado='S',
             d='Depresión del surco Intrabético, en Málaga.'),
        dict(id='hoya-guadix', n='Hoya de Guadix', t='Hoya', g='llanos', c='llano', geo=P(-3.15, 37.33, 12), lado='O',
             d='Depresión del surco Intrabético, en Granada.'),
        dict(id='hoya-baza', n='Hoya de Baza', t='Hoya', g='llanos', c='llano', geo=P(-2.7, 37.56, 13), lado='E',
             d='Depresión del surco Intrabético, en Granada.'),
        dict(id='alcores', n='Los Alcores', t='Campiña', g='llanos', c='llano', geo=L([(-5.62, 37.48), (-5.85, 37.33)], 5),
             lab=(-5.95, 37.58), rot=0, d='Pequeña elevación en la campiña de Sevilla, entre Carmona y Alcalá de Guadaíra.'),
        dict(id='campina-cordoba', n='Campiña sur cordobesa', t='Campiña', g='llanos', c='llano', geo=P(-4.65, 37.5, 17), lado='N',
             d='Campiña de la depresión del Guadalquivir, al sur de Córdoba.'),
        dict(id='campina-jerez', n='Campiñas de Jerez', t='Campiña', g='llanos', c='llano', geo=P(-6.02, 36.72, 13), lado='N',
             d='Campiña de la depresión del Guadalquivir, en Cádiz.'),
        dict(id='campina-medina', n='Campiña de Medina Sidonia', t='Campiña', g='llanos', c='llano', geo=P(-5.93, 36.46, 10), lado='S',
             d='Campiña de la provincia de Cádiz.'),

        dict(id='p-huelva', n='Huelva', t='Provincia', g='prov', c='prov', geo=('prov', 'Huelva'), d='Provincia más al oeste. Limita con Portugal.'),
        dict(id='p-sevilla', n='Sevilla', t='Provincia', g='prov', c='prov', geo=('prov', 'Sevilla'), d='En ella está la capital de Andalucía.'),
        dict(id='p-cadiz', n='Cádiz', t='Provincia', g='prov', c='prov', geo=('prov', 'Cádiz'), d='La provincia más al sur. Tiene costa atlántica y mediterránea.'),
        dict(id='p-cordoba', n='Córdoba', t='Provincia', g='prov', c='prov', geo=('prov', 'Córdoba'), d='Provincia interior, sin costa.'),
        dict(id='p-malaga', n='Málaga', t='Provincia', g='prov', c='prov', geo=('prov', 'Málaga'), d='En ella está la Costa del Sol.'),
        dict(id='p-jaen', n='Jaén', t='Provincia', g='prov', c='prov', geo=('prov', 'Jaén'), d='Provincia interior, sin costa. Aquí nace el Guadalquivir.'),
        dict(id='p-granada', n='Granada', t='Provincia', g='prov', c='prov', geo=('prov', 'Granada'), d='En ella está Sierra Nevada.'),
        dict(id='p-almeria', n='Almería', t='Provincia', g='prov', c='prov', geo=('prov', 'Almería'), d='Provincia más al este. Limita con Murcia.'),
        dict(id='costa-luz', n='Costa de la Luz', t='Costa', g='prov', c='costa',
             geo=L([(-7.35, 37.15), (-6.9, 37.13), (-6.45, 36.85), (-6.32, 36.5), (-6.05, 36.2), (-5.65, 36.03)], 6),
             lab=(-7.05, 36.72), rot=0, d='Costa atlántica de Huelva y Cádiz. Es baja, con playas largas.'),
        dict(id='costa-sol', n='Costa del Sol', t='Costa', g='prov', c='costa',
             geo=L([(-5.32, 36.2), (-4.9, 36.5), (-4.4, 36.7), (-3.9, 36.73)], 6),
             lab=(-4.4, 36.45), rot=0, d='Costa mediterránea de Málaga. Es más recortada, con montañas cerca del mar.'),
        dict(id='atlantico', n='Océano Atlántico', t='Océano', g='prov', c='mar',
             geo=A([(-7.72, 36.95), (-7.0, 37.05), (-6.55, 36.7), (-6.2, 36.2), (-6.05, 35.85), (-7.72, 35.85)]),
             lab=(-7.05, 36.25), d='Baña la costa de Huelva y de Cádiz.'),
        dict(id='mediterraneo', n='Mar Mediterráneo', t='Mar', g='prov', c='mar',
             geo=A([(-5.0, 36.25), (-4.4, 36.6), (-3.4, 36.62), (-2.3, 36.58), (-1.75, 37.15), (-1.38, 37.2), (-1.38, 36.0), (-5.0, 36.0)]),
             lab=(-3.2, 36.3), d='Baña la costa de Málaga, Granada y Almería.'),
        dict(id='estrecho', n='Estrecho de Gibraltar', t='Estrecho', g='prov', c='mar', geo=P(-5.6, 35.97, 9), lado='S',
             d='Separa Europa de África y une el Atlántico con el Mediterráneo.'),
    ])

# ───────────────────────── RENPA ─────────────────────────
# (nombre oficial en la capa, nombre para mostrar, provincias, tema, frase)
OCC, ORI = 'occ', 'ori'
_NAT = [
    ('SIERRA DE ARACENA Y PICOS DE AROCHE', 'Sierra de Aracena y Picos de Aroche', 'Huelva', OCC),
    ('DOÑANA', 'Doñana', 'Huelva, Sevilla y Cádiz', OCC),
    ('SIERRA MORENA DE SEVILLA', 'Sierra Morena de Sevilla', 'Sevilla', OCC),
    ('SIERRA DE HORNACHUELOS', 'Sierra de Hornachuelos', 'Córdoba', OCC),
    ('SIERRA DE CARDEÑA Y MONTORO', 'Sierra de Cardeña y Montoro', 'Córdoba', OCC),
    ('SIERRAS SUBBÉTICAS', 'Sierras Subbéticas', 'Córdoba', OCC),
    ('BAHÍA DE CÁDIZ', 'Bahía de Cádiz', 'Cádiz', OCC),
    ('LA BREÑA Y MARISMAS DEL BARBATE', 'La Breña y Marismas del Barbate', 'Cádiz', OCC),
    ('DEL ESTRECHO', 'Del Estrecho', 'Cádiz', OCC),
    ('LOS ALCORNOCALES', 'Los Alcornocales', 'Cádiz y Málaga', OCC),
    ('SIERRA DE GRAZALEMA', 'Sierra de Grazalema', 'Cádiz y Málaga', OCC),
    ('DESPEÑAPERROS', 'Despeñaperros', 'Jaén', ORI),
    ('SIERRA DE ANDÚJAR', 'Sierra de Andújar', 'Jaén', ORI),
    ('SIERRAS DE CAZORLA, SEGURA Y LAS VILLAS', 'Sierras de Cazorla, Segura y Las Villas', 'Jaén', ORI),
    ('SIERRA MÁGINA', 'Sierra Mágina', 'Jaén', ORI),
    ('SIERRA DE CASTRIL', 'Sierra de Castril', 'Granada', ORI),
    ('SIERRA DE BAZA', 'Sierra de Baza', 'Granada', ORI),
    ('SIERRA DE HUÉTOR', 'Sierra de Huétor', 'Granada', ORI),
    ('SIERRA NEVADA', 'Sierra Nevada', 'Granada y Almería', ORI),
    ('SIERRAS DE TEJEDA, ALMIJARA Y ALHAMA', 'Sierras de Tejeda, Almijara y Alhama', 'Málaga y Granada', ORI),
    ('MONTES DE MÁLAGA', 'Montes de Málaga', 'Málaga', ORI),
    ('SIERRA DE LAS NIEVES', 'Sierra de las Nieves', 'Málaga', ORI),
    ('CABO DE GATA-NÍJAR', 'Cabo de Gata-Níjar', 'Almería', ORI),
    ('SIERRA MARÍA - LOS VÉLEZ', 'Sierra María-Los Vélez', 'Almería', ORI),
]
_NAC = [
    ('DOÑANA', 'Doñana', 'Huelva, Sevilla y Cádiz', 'Parque nacional desde 1969. Marismas donde descansan miles de aves.'),
    ('SIERRA NEVADA', 'Sierra Nevada', 'Granada y Almería', 'Parque nacional desde 1999. Alta montaña con el Mulhacén y el Veleta.'),
    ('SIERRA DE LAS NIEVES', 'Sierra de las Nieves', 'Málaga', 'Parque nacional desde 2021. Famoso por sus bosques de pinsapos.'),
]


_LADO = {'Sierra de Hornachuelos': 'N', 'Sierra de Cardeña y Montoro': 'N', 'Bahía de Cádiz': 'O', 'La Breña y Marismas del Barbate': 'O',
         'Los Alcornocales': 'E', 'Sierra de Grazalema': 'N', 'Despeñaperros': 'N', 'Sierra de Andújar': 'O',
         'Sierras de Cazorla, Segura y Las Villas': 'E', 'Sierra Mágina': 'O', 'Sierra de Huétor': 'O', 'Sierra Nevada': 'N',
         'Montes de Málaga': 'O', 'Sierra María-Los Vélez': 'N', 'Doñana': 'O', 'Sierra de Baza': 'E'}


def _slug(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(ch if ch.isalnum() else '-' for ch in s if unicodedata.category(ch) != 'Mn').strip('-').replace('--', '-')


REN = dict(
    id='ren', titulo='Espacios protegidos de Andalucía', corto='RENPA', imagen='relieve-andalucia.jpg', base='and',
    temas=[
        dict(id='nac', n='Parques nacionales', sub='Los 3 parques nacionales'),
        dict(id='occ', n='Parques naturales del oeste', sub='Huelva, Sevilla, Córdoba y Cádiz'),
        dict(id='ori', n='Parques naturales del este', sub='Jaén, Granada, Málaga y Almería'),
    ],
    items=(
        [dict(id='pn-' + _slug(v), n=v, t='Parque nacional', g='nac', c='nacional', geo=('renpa', 'Parque Nacional', o), prov=p, d=d, lado=_LADO.get(v, 'S'))
         for o, v, p, d in _NAC]
        + [dict(id='pnat-' + _slug(v), n=v, t='Parque natural', g=g, c='natural', geo=('renpa', 'Parque Natural', o), prov=p,
                d='Parque natural en ' + p + '.', lado=_LADO.get(v, 'S')) for o, v, p, g in _NAT]
    ))

MAPAS_CONTENIDO = [AND, ESP, REN]
