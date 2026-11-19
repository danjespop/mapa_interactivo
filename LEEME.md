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
