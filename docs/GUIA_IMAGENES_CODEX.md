# Guía de integración de imágenes para Codex

**Proyecto:** El aparato locomotor — 5.º de Primaria · GitHub Pages · modo Jugar y modo Estudiar.

**Estado:** 30 ilustraciones solicitadas/generadas en seis tandas; **no todas están validadas ni necesariamente disponibles como 30 archivos distintos**. Las imágenes fueron generadas por IA y no copiadas del libro. No afirmar que son anatómicamente perfectas ni que existe una garantía jurídica absoluta de ausencia de derechos de terceros. No incluir fotografías del libro en el repositorio público.

## 1. Instrucciones prioritarias para Codex

1. Leer este inventario y cotejar cada entrada con los archivos que aporte el usuario **mediante inspección visual**; no confiar solo en el nombre automático.
2. Crear un directorio `public/assets/anatomia/` (o `assets/anatomia/` si no hay herramienta de compilación) y subdirectorios `huesos/`, `musculos/`, `movimiento/`, `salud/`, `portada/`.
3. Renombrar cada archivo verificado al nombre canónico indicado más abajo, conservando un registro de procedencia. **Nunca sobrescribir un archivo silenciosamente.**
4. Optimizar para web en WebP (calidad orientativa 80–88), mantener PNG solo cuando haya transparencia real necesaria. No inventar transparencia: algunos fondos con damero están dibujados y no son transparentes.
5. Crear `src/data/imagenes.json` con ID, ruta relativa, título ES, texto alternativo ES, sección, juegos compatibles, dimensiones, estado QA y origen.
6. No incrustar nombres anatómicos en las imágenes: las etiquetas deben ser HTML/SVG sobrepuesto y traducibles ES/EN.
7. Antes de usar una ilustración en una pregunta de localización, definir coordenadas o polígonos de regiones interactivas en un SVG superpuesto, **manualmente validados**; nunca estimarlos a ciegas.
8. Usar las ilustraciones de posturas como material de estudio y, para los juegos, separar visualmente las opciones A/B. No mostrar ✓/✕ durante la pregunta: revelar la solución después de responder.
9. Comprobar que todas las rutas funcionan con el subdirectorio de GitHub Pages (usar `import.meta.env.BASE_URL` en Vite o rutas relativas compatibles).
10. Mantener el proyecto sin backend, sin claves privadas y sin imágenes de terceros no autorizadas.

## 2. Inventario de las 30 entradas

Los nombres de origen son los observados en la generación. **Atención:** dos pares comparten exactamente el mismo nombre de origen; si el usuario descargó versiones distintas, habrá que identificarlas por miniatura/contenido. En el entorno de trabajo actual un nombre repetido puede haber sustituido a otro.

| Nº | Contenido | Sección | Nombre de archivo observado | Nombre final propuesto | Uso y observaciones |
|---:|---|---|---|---|---|
| 01 | Esqueleto posterior | huesos | `a_clean_detailed_anatomical_illustration_on_a_whi.png` | `01_esqueleto_posterior.webp` | Mapa anatómico dorsal |
| 02 | Brazo y mano óseos | huesos | `a_clean_high_resolution_medical_illustration_on_a.png` | `02_huesos_brazo_mano.webp` | Posible archivo sobrescrito: verificar |
| 03 | Esqueleto frontal | huesos | `a_clean_high_resolution_isolated_medical_illustra.png` | `03_esqueleto_frontal.webp` | Mapa anatómico frontal |
| 04 | Pierna y pie óseos | huesos | `a_clean_high_resolution_medical_illustration_on_a.png` | `04_huesos_pierna_pie.webp` | MISMO nombre que 02: distinguir visualmente |
| 05 | Cráneo frontal | huesos | `a_highly_detailed_realistic_anatomical_illustrati.png` | `05_craneo_frontal.webp` | Detalle óseo |
| 06 | Articulaciones | huesos | `a_clean_high_detail_medical_illustration_on_a_whi.png` | `06_articulaciones_tipos.webp` | Lámina compuesta: dividir si hace falta |
| 07 | Musculatura frontal | musculos | `a_clean_white_background_highly_detailed_anatomic.png` | `07_musculatura_frontal.webp` | Mapa anatómico |
| 08 | Musculatura posterior | musculos | `a_clean_high_detail_anatomical_illustration_on_a.png` | `08_musculatura_posterior.webp` | Mapa anatómico |
| 09 | Tipos de músculos | musculos | `a_clean_white_background_medical_illustration_show.png` | `09_tipos_musculos.webp` | Cuatro subfiguras |
| 10 | Músculos cabeza y cuello | musculos | `a_highly_detailed_medical_illustration_on_a_white.png` | `10_musculos_cabeza_cuello.webp` | Detalle anatómico |
| 11 | Brazo extendido en corte | movimiento | `a_detailed_realistic_anatomical_illustration_of_a.png` | `11_brazo_extendido_anatomia.webp` | Posible archivo sobrescrito: verificar |
| 12 | Secuencia flexión | movimiento | `a_clean_educational_medical_illustration_on_a_whit.png` | `12_secuencia_flexion.webp` | Tres posiciones en una imagen |
| 13 | Flexión y extensión | movimiento | `a_highly_detailed_medical_anatomical_illustration.png` | `13_flexion_extension_comparacion.webp` | Dos paneles |
| 14 | Brazo flexionado | movimiento | `a_highly_detailed_anatomical_illustration_of_a_hum.png` | `14_brazo_flexionado.webp` | Detalle bíceps |
| 15 | Detalle brazo flexionado | movimiento | `a_detailed_realistic_anatomical_illustration_of_a.png` | `15_brazo_flexionado_detalle.webp` | MISMO nombre que 11: distinguir visualmente |
| 16 | Fractura tibia | salud | `a_detailed_medical_illustration_on_a_transparent_c.png` | `16_fractura_tibia.webp` | Comprobar anatomía |
| 17 | Movimiento voluntario pelota | movimiento | `a_detailed_medical_illustration_style_composition.png` | `17_movimiento_voluntario_pelota.webp` | Recorrido nervioso ilustrativo |
| 18 | Esguince tobillo | salud | `a_detailed_medical_illustration_of_an_injured_ankl.png` | `18_esguince_tobillo.webp` | Lesión de ligamento |
| 19 | Esguince tobillo detalle | salud | `a_detailed_medical_anatomical_illustration_of_a_hu.png` | `19_esguince_tobillo_detalle.webp` | Casi duplicado de 18 |
| 20 | Reflejo rotuliano | movimiento | `a_detailed_medical_illustration_infographic_style.png` | `20_reflejo_rotuliano.webp` | Validar flechas y vía nerviosa |
| 21 | Calentamiento y estiramientos | salud | `a_clean_realistic_composite_illustration_photorea.png` | `21_calentamiento_estiramientos.webp` | Lámina compuesta |
| 22 | Hábitos saludables | salud | `a_clean_high_detail_educational_montage_on_a_whit.png` | `22_habitos_saludables.webp` | Lámina compuesta |
| 23 | Postura sentado | salud | `a_clean_realistic_medical_illustration_style_comp.png` | `23_postura_sentado.webp` | Par correcto/incorrecto |
| 24 | Levantar una caja | salud | `a_clean_high_resolution_instructional_split_illus.png` | `24_postura_levantar_caja.webp` | Par correcto/incorrecto |
| 25 | Postura de pie | salud | `a_clean_high_resolution_medical_educational_illus.png` | `25_postura_pie.webp` | Par correcto/incorrecto |
| 26 | Portada corredor | portada | `a_high_quality_realistic_educational_illustration.png` | `26_portada_aparato_locomotor.webp` | Portada compuesta |
| 27 | Contractura muscular | salud | `a_detailed_medical_illustration_scene_a_realistic.png` | `27_contractura_cuello.webp` | Músculos cuello/hombro |
| 28 | Dormir de lado | salud | `a_realistic_educational_style_image_of_a_young_boy.png` | `28_postura_dormir.webp` | Una postura; no par comparativo |
| 29 | Retirada mano por calor | movimiento | `a_detailed_educational_illustration_showing_a_sequ.png` | `29_reflejo_retirada_mano.webp` | Revisar circuito reflejo |
| 30 | Mochila escolar | salud | `a_clean_well_lit_educational_comparison_illustrat.png` | `30_postura_mochila.webp` | Par correcto/incorrecto |

## 3. Mapeo a secciones y mecánicas

- **Huesos:** 01–06. Usar 03 para identificar huesos en vista frontal; 01 para vista posterior; 02/04 para ampliaciones de extremidades; 05 para cabeza; 06 para articulaciones.
- **Músculos:** 07–10. Usar 07/08 para señalar músculos, 09 para clasificar formas, 10 para cabeza y cuello.
- **Movimiento:** 11–15, 17, 20, 29. Explicar antagonistas, voluntarios y reflejos. Las imágenes 11/14/15 son parecidas: elegir la mejor para cada objetivo, no repetir por llenar espacio.
- **Salud:** 16, 18, 19, 21–25, 27, 28, 30. Lesiones, hábitos, posturas y prevención. 18/19 son redundantes; elegir una o asignar función distinta.
- **Inglés:** reutilizar 01, 03, 07, 08, 02, 04 y 10; **no duplicar imágenes por idioma**. Superponer vocabulario desde el banco de contenidos.
- **Juegos/examen:** reutilizar recursos anteriores. Para una pregunta de postura, recortar cada opción o tapar marcas de solución hasta contestar.
- **Portada:** 26. La imagen 26 puede necesitar recorte para hero/banner, sin deformarla.

## 4. Estructura de carpetas sugerida

```text
public/
  assets/
    anatomia/
      huesos/
      musculos/
      movimiento/
      salud/
      portada/
src/
  data/
    imagenes.json
    regiones-anatomicas.json
```

El archivo `imagenes.json` deberá usar IDs estables como `esqueleto_frontal`, rutas **sin dominio**, y campos `titulo_es`, `alt_es`, `seccion`, `origen`, `estado_qa`, `usos`, `ancho`, `alto`, `transparencia_real`.

Ejemplo de entrada:

```json
{
  "id": "esqueleto_frontal",
  "ruta": "assets/anatomia/huesos/03_esqueleto_frontal.webp",
  "titulo_es": "Esqueleto humano visto de frente",
  "alt_es": "Ilustración anatómica de un esqueleto humano completo en vista frontal",
  "seccion": "huesos",
  "origen": "imagen generada para el proyecto, entrada 03",
  "estado_qa": "pendiente",
  "usos": ["estudio", "etiquetas", "identificacion", "examen"],
  "ancho": null,
  "alto": null,
  "transparencia_real": false
}
```

## 5. Reglas de normalización y optimización

- Nombres en minúsculas ASCII, sin espacios ni tildes, con prefijo numérico y extensión real.
- Crear miniaturas opcionales (`_thumb.webp`) para tarjetas; no aumentar artificialmente la resolución.
- Preservar relación de aspecto, metadatos de dimensiones y copia original fuera del directorio público.
- Generar un informe de peso total y peso por recurso; cargar imágenes diferidas (`loading=lazy`) salvo portada.
- Las láminas compuestas pueden recortarse en subimágenes **solo si** cada recorte mantiene contexto suficiente. Si se crean derivados, asignar sufijos `_a`, `_b`, etc. y registrarlos en el manifest.
- Validar fondo transparente con canal alfa; un damero dibujado no equivale a transparencia.

## 6. Control de calidad obligatorio

**Anatomía:** comprobar número y posición de huesos, orientación de radio/cúbito y tibia/peroné, simetría, articulaciones, inserciones musculares, rutas nerviosas, dedos, manos y pies. Revisar especialmente 02/04, 11/15, 16, 20 y 29. Si un dibujo contiene errores, marcarlo `rechazado` y sustituirlo; no usarlo en preguntas evaluables.

**Pedagogía:** 5.º de Primaria, explicaciones cortas en Jugar y ampliadas en Estudiar. No presentar el código de colores verde/rojo como pista antes de elegir. Los reflejos deben explicarse como respuestas involuntarias rápidas, muchas coordinadas por médula espinal.

**Accesibilidad:** texto alternativo informativo, controles accesibles por teclado, opción de responder sin arrastrar, focos visibles, contraste suficiente y etiquetas no dependientes exclusivamente del color.

**Privacidad y derechos:** no incluir nombres ni datos personales de menores. Conservar nota de que los recursos son generados por IA para el proyecto; verificar condiciones de uso aplicables y evitar atribuirles una licencia de terceros sin fundamento. El repositorio público no debe incluir fotos del libro.

## 7. Entregables exigidos a Codex

1. Carpeta de imágenes normalizadas y optimizadas, con originales preservados aparte.
2. `src/data/imagenes.json` válido y completo, sin rutas rotas.
3. `src/data/regiones-anatomicas.json` solo para regiones revisadas visualmente.
4. `docs/QA_IMAGENES.md` con estado `aprobada`, `pendiente` o `rechazada` por imagen, observaciones y acciones.
5. Script repetible para renombrar y convertir, con modo simulación y detección de colisiones.
6. Página de galería interna (opcional en desarrollo) que muestre todos los recursos con su ID y estado.
7. Pruebas de compilación y despliegue de GitHub Pages, con comprobación de carga de cada recurso.

## 8. Incidencias a resolver antes de dar por terminado el paquete

- **Colisión 02/04:** mismo nombre de archivo de origen observado; confirmar qué archivo tiene el usuario y si ambos están disponibles.
- **Colisión 11/15:** mismo nombre de archivo de origen observado; confirmar ambas versiones.
- **Falta de correspondencia perfecta con plan inicial:** se generaron varias imágenes de brazos y esguinces; no se produjo una escena específica de lavadora ni una pantalla de resultados. Si el juego las requiere, crearlas como recursos nuevos, sin falsificar el inventario.
- **Posturas con símbolos:** 23, 24, 25 y 30 pueden mostrar la solución antes de que el alumno responda. Ocultar/recortar los símbolos o generar versiones neutrales.
- **Calidad anatómica:** todas las imágenes generadas requieren revisión antes de evaluaciones de identificación.

**Criterio de aceptación:** el proyecto debe funcionar con las imágenes efectivamente recibidas; si faltan versiones por colisiones, Codex debe informarlo y continuar con un marcador de recurso pendiente, nunca inventar una imagen o asociar una incorrecta.
