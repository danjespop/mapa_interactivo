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
