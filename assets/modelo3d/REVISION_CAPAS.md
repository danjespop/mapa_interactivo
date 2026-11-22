# Revisión de las capas del atlas

Revisión de exportación, clasificación, materiales y visualización de las 13 capas. El atlas contiene 2.896 estructuras; una misma estructura puede pertenecer a varias capas. No se interpreta la suma de nombres como una medida de exhaustividad o precisión clínica.

## Hallazgos y cambios

La exportación anterior descartaba las curvas y exportaba solo mallas. Se recuperan **944 superficies anatómicas**, incluidas arterias, venas, nervios, bronquios, esófago y uréteres. No hubo curvas seleccionadas sin superficie en la conversión final. Se añaden yeyuno, íleon y recto del conjunto BodyParts3D, manteniendo su procedencia por estructura.

| Capa | Contenido revisado y materiales | Límite de representación |
| --- | --- | --- |
| Óseo | Huesos y cartílagos; tono marfil frente a cartílago gris azulado | Sin trabéculas ni microarquitectura |
| Muscular | Músculos, tendones y transiciones de color; fascias separadas | Sin orientación de fibras validada ni deformación fisiológica |
| Nervioso y sentidos | Encéfalo gris rosado, sustancia blanca marfil, nervios amarillo pálido; retina y cubiertas corregidas | Sin todas las terminaciones; cavidades de LCR con color convencional |
| Circulatorio | 400 arterias sistémicas, 212 venas sistémicas, 27 arterias y 20 venas pulmonares; corazón y válvulas | Sin capilares ni flujos; rojo/azul es convención docente |
| Respiratorio | Cinco lóbulos, tráquea, bronquios y cartílagos; pleura opcional | Sin todos los bronquiolos ni alvéolos |
| Digestivo | Vías y glándulas, esófago, estómago, intestino delgado, colon y recto; hígado marrón rojizo, bilis oliva y páncreas ocre | Ciego y canal anal sin individualizar; no se afirma continuidad terminal completa |
| Urinario | Riñones rojizos, pelvis, uréteres, vejiga y uretra | Sin nefronas ni anatomía urinaria femenina específica |
| Linfático | Ganglios, bazo violáceo, timo y amígdalas rosados | Red periférica de conductos incompleta en la fuente |
| Endocrino | Hipófisis, pineal, hipotálamo, tiroides, paratiroides, suprarrenales; páncreas y testículos compartidos | Sin ovarios; testículos ocultos en modelo femenino |
| Reproductor | Anatomía masculina de la referencia | Sin aparato reproductor femenino; capa desactivada en cuerpo femenino |
| Piel | Superficie continua, pelo, uñas; modelo externo femenino propio | Tono y textura ilustrativos, sin histología; internos de referencia compartidos |
| Fascias | Envolturas separadas de músculos | No incluye todos los planos conectivos |
| Articulaciones y soporte | Ligamentos, discos, bolsas, cartílagos y almohadillas | No reproduce deformación ni propiedades mecánicas |

Las cubiertas opacas de pleura y epiplones se ocultan inicialmente para evitar que impidan ver pulmones e intestino; pueden activarse con su propio control. Cada capa dispone de una ficha de contenido, límites y fuente, y puede aislarse con encuadre automático. El inventario íntegro está en `manifest.json`.

## Reproducción y comprobaciones

1. Obtener `Startup.blend` de la versión Z-Anatomy indicada en `ATRIBUCIONES.md`.
2. Obtener los tres STL digestivos de `assets/BodyParts3D_data/stl` del commit BodyParts3D indicado en ese documento y colocarlos en `/tmp/bp3d-models` (o definir `BODYPARTS3D_STL_DIR`).
3. Ejecutar Blender con `--background --factory-startup --disable-autoexec`, el archivo fuente y `--python herramientas/exportar_anatomia.py`.
4. Ejecutar `node herramientas/modelo3d/optimizar.mjs`; retirar `anatomia.glb` del directorio público antes de ejecutar `python3 herramientas/empaquetar.py`.
5. Ejecutar `python3 pruebas/capas_anatomicas.py`, `node herramientas/modelo3d/auditar-capas.mjs`, `node herramientas/modelo3d/verificar-rig.mjs` y las pruebas del visor en `pruebas`.

Las pruebas comprueban el modelo realmente distribuido, superficies de las curvas, órganos añadidos, límites espaciales del registro, pertenencia a capas, convenciones pulmonares, influencias del rig y controles en navegador. La inspección visual no reemplaza una revisión profesional de anatomía o biomecánica.
