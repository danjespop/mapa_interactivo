# Revisión de las ilustraciones

Se recibieron 30 archivos distintos en dos ZIP. Los originales se conservan fuera del repositorio en `/tmp/atlas-imagenes/originales` y en los ZIP adjuntos. `src/data/origenes-imagenes.json` registra el nombre recibido y su correspondencia visual; los nombres originales difieren de los previstos en el inventario.

WebP calidad 86, máximo 1600 px, sin ampliar ni recortar, conservando alfa real. Originales: 58.10 MB; versiones web: 4.72 MB; reducción: 91.9 %.

Se inspeccionaron las tres láminas de contacto (30 imágenes) y las vistas frontales completas para colocar 14 marcadores. Los marcadores son puntos de referencia, no polígonos de delimitación. La aprobación es didáctica para estas regiones grandes; no certifica toda la anatomía generada.

Las entradas 02/04 y 11/15 están presentes como archivos distintos: se han distinguido visualmente. Las dos imágenes de tobillo tienen usos de estudio redundantes. Las imágenes de reflejos muestran rutas esquemáticas potencialmente confusas: se conservan en la galería de revisión, excluidas del estudio principal y de toda evaluación visual. Las posturas con ✓/✕ se muestran solo para estudio; los ejercicios de postura usan opciones de texto sin revelar la respuesta. No se recibió escena de lavadora; se estudia y pregunta mediante texto.

| Recurso | QA | Observación | Peso web |
|---|---|---|---|
| flexion_extension_comparacion | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 110 KB |
| esguince_tobillo_detalle | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 159 KB |
| portada_aparato_locomotor | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 211 KB |
| musculos_cabeza_cuello | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 312 KB |
| postura_sentado | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 74 KB |
| postura_pie | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 101 KB |
| contractura_cuello | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 192 KB |
| huesos_pierna_pie | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 74 KB |
| esqueleto_frontal | aprobada | Aprobación didáctica limitada a los marcadores revisados; no certificación anatómica completa. | 177 KB |
| esqueleto_posterior | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 170 KB |
| habitos_saludables | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 165 KB |
| fractura_tibia | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 112 KB |
| esguince_tobillo | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 115 KB |
| brazo_flexionado | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 153 KB |
| brazo_flexionado_detalle | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 125 KB |
| tipos_musculos | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 297 KB |
| movimiento_voluntario_pelota | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 148 KB |
| huesos_brazo_mano | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 98 KB |
| musculatura_frontal | aprobada | Aprobación didáctica limitada a los marcadores revisados; no certificación anatómica completa. | 174 KB |
| musculatura_posterior | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 166 KB |
| brazo_extendido_anatomia | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 78 KB |
| craneo_frontal | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 214 KB |
| calentamiento_estiramientos | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 132 KB |
| articulaciones_tipos | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 316 KB |
| reflejo_rotuliano | pendiente | Circuito nervioso esquemático pendiente de revisión. Excluida de preguntas visuales y del estudio principal. | 159 KB |
| postura_mochila | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 148 KB |
| secuencia_flexion | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 88 KB |
| reflejo_retirada_mano | pendiente | Circuito nervioso esquemático pendiente de revisión. Excluida de preguntas visuales y del estudio principal. | 122 KB |
| postura_dormir | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 96 KB |
| postura_levantar_caja | pendiente | Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio. | 119 KB |

## Límites y procedencia
Las ilustraciones fueron aportadas como generadas por IA. No se han incluido fotografías del libro ni se ha asignado una licencia de terceros. Revisión anatómica especializada pendiente para las láminas no evaluables. No se han inventado polígonos ni regiones para los conceptos sin marcador. Todos los conceptos siguen disponibles en glosario y actividades de texto.

## Reproducción
`python3 herramientas/optimizar_anatomia.py /ruta/originales --dry-run` muestra las conversiones; omitir `--dry-run` las aplica. Requiere Pillow. El programa aborta ante archivos ausentes o destinos existentes, antes de escribir. Los nombres numerados se corresponden con `origenes-imagenes.json`. El manifest registra dimensiones, alfa real, peso y fuente. La galería de revisión se encuentra en `locomotor.html#galeria`.

## Atlas anatómico 3D (segunda edición)

La maqueta de primitivas ha sido retirada. La versión actual carga superficies de Z-Anatomy / BodyParts3D convertidas en Blender y conserva estructuras seleccionables. Véase `assets/modelo3d/ATRIBUCIONES.md` y el manifiesto generado. La anatomía procede del atlas; el rig y los movimientos son una adaptación didáctica no validada clínicamente. Las fascias superficiales se pueden activar como una capa adicional para que no oculten los músculos al estudiar.

## Revisión final del atlas y de la superficie femenina

- Transformaciones de los objetos fijadas antes de retirar restricciones del archivo Blender; las piezas auxiliares y los rótulos tridimensionales del atlas no se exportan.
- Comprobada la presencia de huesos frontal, parietales y temporales, occipital, esternón y rótulas mediante selección y búsqueda del visor.
- Regiones cutáneas unificadas, vértices de borde compartidos y superficie subdividida para retirar costuras del pecho. Cabello y cejas conservan color oscuro; ojos y cabello se ajustan a la superficie femenina.
- Mayor presupuesto de geometría en los huesos craneales. Color de músculo/tendón interpolado en los vértices y texturas procedurales de superficie, sin atribuir exactitud histológica.
- Las bolsas articulares y almohadillas grasas se separan de la musculatura para evitar confundirlas con piezas musculares desplazadas.
- Superficie femenina MakeHuman CC0 con postura y rig propios; anatomía interna de referencia compartida identificada expresamente en la interfaz. No se presenta el sistema reproductor masculino como femenino.
- Pruebas de navegador: actividades, examen, progreso/importación/exportación, caché sin conexión, galería, fuentes, atlas y selector corporal, búsqueda ES/EN, sombreadores, teclado y anchura móvil.
- La comprobación opcional por `file://` queda sin verificar: el navegador administrado la bloquea con `ERR_BLOCKED_BY_ADMINISTRATOR`. Las verificaciones funcionales se ejecutan por HTTP, incluido un subdirectorio equivalente al de GitHub Pages.
