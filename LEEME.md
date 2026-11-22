# Atlas de estudio

Web para estudiar el relieve de España y de Andalucía y los parques de la RENPA (1.º ESO).

- `index.html` + `css/` + `js/` + `img/`: la web.
- `atlas.html`: la misma web en un solo fichero, sin internet.
- `Atlas_Geografia_corregido_v3.html`: la versión anterior, sin tocar.
- `herramientas/`: cómo se generan los mapas y los datos.
  - `contenido.py`: lo que se estudia (nombres, formas, frases). Es lo que hay que editar para añadir o quitar lugares.
  - `relieve.py`: dibuja las imágenes de relieve.
  - `generar.py`: crea `js/datos.js`.
  - `empaquetar.py`: crea `atlas.html`.

Tras cambiar `contenido.py`:

```bash
python3 herramientas/generar.py
```

```bash
python3 herramientas/empaquetar.py
```

## Web instalable

Publicada con GitHub Pages, la web se puede añadir a la pantalla de inicio del iPad o del móvil
(`manifest.webmanifest`, `sw.js`, `iconos/`) y funciona sin internet tras la primera visita.
La app instalada busca versión nueva al abrirse y se actualiza sola. Para publicar un cambio hay que ejecutar antes `python3 herramientas/empaquetar.py`, que renueva la versión.

## Fuentes de los datos

Contenido adaptado para alumnos de 1.º de ESO. Los textos y los mapas son propios.

- Límites de provincias y comunidades autónomas: © Instituto Geográfico Nacional (CC BY 4.0), a través de [es-atlas](https://github.com/martgnz/es-atlas) (MIT).
- Parques nacionales y naturales: RENPA, © Junta de Andalucía (REDIAM). Servicio de uso libre y gratuito citando a sus autores.
- Ríos principales y contornos de países: [Natural Earth](https://www.naturalearthdata.com) (dominio público). El resto de ríos, calculados sobre el relieve.
- Relieve: Terrain Tiles (Mapzen). Atribución que piden sus fuentes:
  - ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736;
  - Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017;
  - Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich;
  - Canada terrain data contains information licensed under the Open Government Licence – Canada;
  - Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers;
  - Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration;
  - Mexico terrain data source: INEGI, Continental relief, 2016;
  - New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government (All rights reserved);
  - Norway terrain data © Kartverket;
  - United Kingdom terrain data © Environment Agency copyright and/or database right 2015. All rights reserved;
  - United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey.

## Módulos de estudio

La entrada `index.html` permite elegir **Geografía** (`geografia.html`, con los nueve mapas y el globo existentes) o **Aparato locomotor** (`locomotor.html`, 5.º de Primaria). Se mantiene `atlas.html` como edición geográfica en un fichero. La nueva sección funciona sin conexión mediante el service worker tras la primera carga completa; no está incorporada al fichero geográfico `atlas.html`.

Para desarrollar, sin npm ni compilación:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

La sección de aparato locomotor tiene seis temas, lectura, glosario ES/EN, 14 marcadores anatómicos revisados, preguntas rápidas, respuestas abiertas autoevaluables, ordenar pasos y examen configurable. Las imágenes de posturas con soluciones dibujadas solo se usan en estudio. Las dos ilustraciones de circuitos reflejos se conservan en la galería de revisión, fuera del estudio y la evaluación visual. Los resultados se guardan en el navegador, con exportación e importación JSON. La ampliación del vocabulario inglés no entra en el examen por defecto. No se puntúan automáticamente las respuestas abiertas.

`src/data/banco_contenidos.json` conserva el banco recibido. `herramientas/preparar_locomotor.py` valida y transforma las opciones, añade vocabulario inverso en inglés y prepara `js/locomotor-datos.js`, que permite cargar datos sin peticiones de servidor. Después de editar los datos:

```bash
python3 herramientas/preparar_locomotor.py
python3 herramientas/empaquetar.py
```

El segundo comando actualiza la versión y los recursos de la caché de ambos módulos, además de regenerar la edición geográfica autocontenida. Las rutas son relativas y admiten el subdirectorio de GitHub Pages.

Consulta `docs/QA_IMAGENES.md` para conocer la revisión y procedencia de las 30 ilustraciones optimizadas. Los originales quedan fuera del repositorio público. La galería de revisión se abre en `locomotor.html#galeria`. La conversión reproducible requiere Pillow; el desarrollo y la generación de datos solo requieren Python estándar.

Prueba funcional con Playwright instalado y Chromium en `/usr/bin/chromium`:

```bash
node pruebas/locomotor.cjs
```

Se puede cambiar la ruta con `ATLAS_TEST_URL`, incluyendo una barra final. Las pruebas cubren navegación, recursos, datos, tipos de actividades, examen, persistencia, geografía, móvil y caché sin conexión. No realizan un despliegue ni publican el sitio.

## Segunda edición: actividades y atlas 3D

Las preguntas abiertas siguen disponibles en el estudio como soluciones explicadas. En práctica y examen se sustituyen por frases para completar eligiendo palabras: tres niveles, hasta dos huecos, corrección automática y revisión al terminar. La fuente se abre con un botón «i» común a los módulos. Las imágenes de estudio tienen un visor con descripción, flechas, teclado y cierre. El glosario destaca el inglés y permite ver la localización y abrir la estructura en el atlas 3D.

`locomotor.html#laboratorio` carga **Z-Anatomy / BodyParts3D**, convertido con Blender, con capas por sistema, búsqueda, selección, giro, zoom y rig didáctico. La maqueta de primitivas ha sido retirada. `assets/modelo3d/ATRIBUCIONES.md` conserva autores y condiciones, incluidas las de componentes adicionales. Los movimientos no se presentan como simulación biomecánica o clínica.

La web distribuye el modelo optimizado en base64 dentro de un script que se carga solo al entrar al laboratorio; esto permite también abrir el ZIP sin servidor. El service worker conserva ese recurso para usarlo sin conexión tras finalizar la descarga inicial. El modelo requiere WebGL y tiene un coste de memoria y descarga mayor que las actividades 2D.

Para reconstruir el visor:

```bash
npm ci --prefix herramientas/modelo3d
node herramientas/modelo3d/build.cjs
```

La aplicación publicada ya incluye el bundle y no necesita npm en ejecución. `src/cuerpo3d.js` contiene el visor y el rig; `herramientas/exportar_anatomia.py` transforma el archivo Blender fuente indicado en las atribuciones con la ejecución automática de scripts desactivada. `herramientas/modelo3d/optimizar.mjs` comprime el glTF, conserva nodos anatómicos y genera el script de datos.

Validación adicional: `node pruebas/interaccion.cjs` comprueba fuentes, galería, glosario, 30 frases con corrección exacta, niveles, WebGL, sistemas, controles y móvil.

El selector corporal permite elegir la superficie masculina del atlas o la femenina MakeHuman CC0. En la versión femenina, los sistemas internos se identifican como referencia compartida y el reproductor masculino está deshabilitado. Las capas de fascias y tejidos articulares se separan de las vistas principales. El buscador ES/EN permite seleccionar con Enter, agrupa las partes de una misma estructura y la resalta y encuadra completa. Los botones de movimiento quedan junto al visor también en móvil.

El atlas incluye texturas **procedurales** de superficie, no fotografías médicas ni mapas de fibras validados. Los originales y los glTF intermedios de Blender no se distribuyen en la web; solo los scripts de datos optimizados y sus manifiestos. Para reconstruir la superficie femenina, se usa `herramientas/exportar_femenino.py` con los archivos fuente descritos en las atribuciones. La prueba opcional `file://` puede ser bloqueada por políticas del navegador administrado; el flujo validado es HTTP/HTTPS, también sin conexión tras guardar la caché.
