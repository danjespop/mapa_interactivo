"""Junta todo en un solo fichero: atlas.html (para abrir sin servidor ni internet).

Uso: python3 herramientas/empaquetar.py [destino_cuerpo]
Si se da destino_cuerpo, escribe además solo el contenido (sin <html>/<head>) para publicarlo como página alojada.
"""
import base64, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
lee = lambda r: open(os.path.join(RAIZ, r), encoding='utf-8').read()

# Versión: cambia sola cuando cambia cualquier fichero. Renueva el guardado sin conexión (sw.js) y se enseña en «Acerca de».
import datetime, hashlib
MESES = 'ene feb mar abr may jun jul ago sep oct nov dic'.split()
huella = hashlib.sha1()
from pathlib import Path
raiz = Path(RAIZ).resolve()
ficheros = ['index.html', 'geografia.html', 'locomotor.html', 'manifest.webmanifest']
for directorio in ['css', 'js', 'img', 'iconos', 'assets/anatomia', 'assets/modelo3d', 'vendor']:
    ficheros += [str(p.relative_to(raiz)) for p in sorted((raiz / directorio).rglob('*')) if p.is_file() and p.name != 'version.js']
for r in ficheros:
    huella.update(lee(r).encode() if r.endswith(('.html', '.css', '.js', '.webmanifest')) else (raiz / r).read_bytes())
huella = huella.hexdigest()[:8]
hoy = datetime.date.today()
version = "window.ATLAS_VERSION='%d %s %d (%s)';\n" % (hoy.day, MESES[hoy.month - 1], hoy.year, huella)
open(os.path.join(RAIZ, 'js', 'version.js'), 'w', encoding='utf-8').write(version)
sw = lee('sw.js')
import json
sw = re.sub(r"var FICHEROS = .*?;", lambda _: 'var FICHEROS = ' + json.dumps(['./', 'js/version.js'] + ficheros) + ';', sw, count=1, flags=re.S)
open(os.path.join(RAIZ, 'sw.js'), 'w', encoding='utf-8').write(re.sub(r"var CACHE = '[^']*';", "var CACHE = 'atlas-estudio-%s';" % huella, sw))

html = lee('geografia.html')
css = lee('css/estilos.css') + '\n' + lee('css/fuentes.css')
html = html.replace('<link rel="stylesheet" href="css/fuentes.css">', '')
html = html.replace('<script src="js/fuentes.js"></script>', '<script>' + lee('js/fuentes.js') + '</script>')
imgs = {}
for f in sorted(x for x in os.listdir(os.path.join(RAIZ, 'img')) if x.endswith(('.jpg', '.png'))):
    imgs[f] = 'data:image/' + ('png' if f.endswith('.png') else 'jpeg') + ';base64,' + base64.b64encode(open(os.path.join(RAIZ, 'img', f), 'rb').read()).decode()
js = ('window.ATLAS_IMG={' + ','.join('"%s":"%s"' % kv for kv in imgs.items()) + '};\n' + version + lee('js/datos.js') + lee('js/app.js') + lee('js/globo-datos.js') + lee('js/globo.js'))

uno = html.replace('<link rel="stylesheet" href="css/estilos.css">', '<style>\n' + css + '</style>')
uno = re.sub(r'<script src="js/version.js"></script>\s*<script src="js/datos.js"></script>\s*<script src="js/app.js"></script>\s*<script src="js/globo-datos.js"></script>\s*<script src="js/globo.js"></script>', lambda m: '<script>\n' + js + '</script>', uno)
open(os.path.join(RAIZ, 'atlas.html'), 'w', encoding='utf-8').write(uno)
print('atlas.html', round(len(uno.encode()) / 1024), 'KB')

if len(sys.argv) > 1:
    cuerpo = html[html.index('<!--CUERPO-->'):html.index('<!--/CUERPO-->')]
    pag = ('<title>Atlas de estudio</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n' + css + '</style>\n'
           + cuerpo + '\n<script>\n' + js + '</script>\n')
    open(sys.argv[1], 'w', encoding='utf-8').write(pag)
    print(sys.argv[1], round(len(pag.encode()) / 1024), 'KB')
