"""Junta todo en un solo fichero: atlas.html (para abrir sin servidor ni internet).

Uso: python3 herramientas/empaquetar.py [destino_cuerpo]
Si se da destino_cuerpo, escribe además solo el contenido (sin <html>/<head>) para publicarlo como página alojada.
"""
import base64, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
lee = lambda r: open(os.path.join(RAIZ, r), encoding='utf-8').read()

html = lee('index.html')
css = lee('css/estilos.css')
imgs = {}
for f in sorted(x for x in os.listdir(os.path.join(RAIZ, 'img')) if x.endswith('.jpg')):
    imgs[f] = 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(RAIZ, 'img', f), 'rb').read()).decode()
js = ('window.ATLAS_IMG={' + ','.join('"%s":"%s"' % kv for kv in imgs.items()) + '};\n' + lee('js/datos.js') + lee('js/app.js'))

uno = html.replace('<link rel="stylesheet" href="css/estilos.css">', '<style>\n' + css + '</style>')
uno = re.sub(r'<script src="js/datos.js"></script>\s*<script src="js/app.js"></script>', lambda m: '<script>\n' + js + '</script>', uno)
open(os.path.join(RAIZ, 'atlas.html'), 'w', encoding='utf-8').write(uno)
print('atlas.html', round(len(uno.encode()) / 1024), 'KB')

if len(sys.argv) > 1:
    cuerpo = html[html.index('<!--CUERPO-->'):html.index('<!--/CUERPO-->')]
    pag = ('<title>Atlas de estudio</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n' + css + '</style>\n'
           + cuerpo + '\n<script>\n' + js + '</script>\n')
    open(sys.argv[1], 'w', encoding='utf-8').write(pag)
    print(sys.argv[1], round(len(pag.encode()) / 1024), 'KB')
