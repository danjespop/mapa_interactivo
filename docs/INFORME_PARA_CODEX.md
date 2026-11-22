# Especificación maestra para Codex — Aparato locomotor

> Versión 1.0 · 5.º de Primaria · Web estática en GitHub Pages

## 1. Objetivo
Web educativa para aprender jugando, con **Modo Jugar** y **Modo Estudiar**, temas independientes, vocabulario bilingüe y examen final. No programar aún sin validar esta especificación.

## 2. Fuentes y trazabilidad
Las diez fotografías aportadas corresponden a las páginas 46–53 del libro y dos fichas de inglés. El archivo `banco_contenidos.json` contiene `source` por pregunta y concepto.

| Fuente | Contenido |
|---|---|
| 46-47 | Huesos y esqueleto |
| 48-49 | Sistema muscular |
| 50 | Cómo nos movemos |
| 50-51 | Movimientos voluntarios y reflejos |
| 52-53 | Salud del aparato locomotor |
| Fichas de inglés | Science in English |

## 3. Arquitectura pedagógica
**Modo Jugar:** anatomía interactiva, parejas, arrastrar etiquetas, verdadero/falso, preguntas rápidas, posturas, ordenar pasos, traducciones, audio opcional.
**Modo Estudiar:** teoría breve y ampliada, diagramas con etiquetas, tarjetas ES/EN, preguntas razonadas, autoevaluación y examen por tema.
Ambos modos comparten contenidos, resultados y progreso. Las recompensas nunca deben bloquear el estudio.

## 4. Contenido fuente por sección
### Huesos y esqueleto
Huesos: órganos vivos, rígidos y resistentes; contienen calcio, crecen y necesitan nutrientes. Tipos del libro: largos (extremidades), cortos (vértebras según el libro), planos (cráneo). Articulaciones móviles y fijas. Cartílago reduce rozamiento; ligamentos unen huesos. Cabeza, tronco y extremidades; funciones protectoras del cráneo, columna, costillas y esternón.
### Sistema muscular
Músculos elásticos: contracción y relajación; tendones. Tipos: largos, cortos, planos y anulares. Musculatura de cabeza, tronco y extremidades.
### Movimiento
Huesos y músculos responden al sistema nervioso. Bíceps y tríceps antagonistas: flexión = bíceps contraído/tríceps relajado; extensión = tríceps contraído/bíceps relajado.
### Voluntarios y reflejos
Voluntario: estímulo → cerebro interpreta y decide → nervios motores → músculos. Reflejo: estímulo → médula espinal → orden inmediata a músculos (en muchos reflejos). Comparar voluntariedad, conciencia y centro de respuesta.
### Salud
Fractura, esguince y contractura; ejercicio, calentamiento, estiramientos, calcio, fósforo, vitamina D, exposición solar prudente y posturas al sentarse, llevar mochila, levantar cargas, dormir y usar lavadora.

## 5. Banco de datos
`banco_contenidos.json` incluye **39 conceptos** y **130 preguntas semilla** con respuestas, explicaciones, idioma, dificultad y fuente. No confundir estas preguntas semilla con un examen listo para mostrar: algunas son abiertas y las de opción múltiple requieren distractores reales y únicos.

## 6. Vocabulario bilingüe
### Huesos
| Español | Inglés | Obligatorio en ficha |
|---|---|---|
| Cráneo | Skull | Sí |
| Esternón | Sternum | Sí |
| Costillas | Ribs | Sí |
| Vértebras | Vertebrae | Sí |
| Clavícula | Clavicle | Sí |
| Húmero | Humerus | Sí |
| Radio | Radius | Sí |
| Cúbito | Ulna | Sí |
| Pelvis | Pelvis | Sí |
| Fémur | Femur | Sí |
| Rótula | Patella / kneecap | Sí |
| Peroné | Fibula | Sí |
| Tibia | Tibia | Sí |
| Carpo | Carpals | Sí |
| Metacarpo | Metacarpals | Sí |
| Tarso | Tarsals | Sí |
| Metatarso | Metatarsals | Sí |
| Falanges | Phalanges | Ampliación |
| Omóplato | Scapula / shoulder blade | Ampliación |
| Frontal | Frontal bone | Ampliación |
| Parietal | Parietal bone | Ampliación |
| Temporal | Temporal bone | Ampliación |
| Maxilar | Maxilla | Ampliación |

### Músculos
| Español | Inglés | Obligatorio en ficha |
|---|---|---|
| Masetero | Masseter | Sí |
| Pectoral | Pectoral / pectoralis | Sí |
| Abdominal | Abdominal / abdominals | Sí |
| Cuádriceps | Quadriceps | Sí |
| Gemelo | Calf muscle / gastrocnemius | Sí |
| Deltoides | Deltoid | Sí |
| Tríceps | Triceps | Sí |
| Bíceps | Biceps | Sí |
| Glúteo | Gluteal / gluteus | Sí |
| Bíceps femoral | Biceps femoris | Sí |
| Orbicular de los párpados | Orbicularis oculi | Ampliación |
| Orbicular de los labios | Orbicularis oris | Ampliación |
| Esternocleidomastoideo | Sternocleidomastoid | Ampliación |
| Trapecio | Trapezius | Ampliación |
| Dorsal | Latissimus dorsi | Ampliación |
| Tibial | Tibialis anterior | Ampliación |

## 7. Actividades originales que deben preservarse
- p47: justificar que los huesos están vivos; clasificar huesos en cabeza/tronco/extremidades; observar costillas y tipos de huesos.
- p49: explicar el movimiento muscular; nombrar músculos por zona; observar pectoral, masetero, gemelo y orbiculares.
- p51: movimientos de cuádriceps, masetero, bíceps femoral, orbicular de párpados, gemelo y abdominales; comparar movimientos voluntarios/reflejos; describir secuencias.
- p53: proponer ejercicio no deportivo; comparar posturas al usar lavadora; reconocer pares de posturas; explicar la vitamina D en leche.
- Ficha inglesa: etiquetar huesos en inglés y clasificarlos en Head, Trunk, Arms y Legs. Ficha muscular: identificar diez músculos en inglés.

## 8. Modos y examen
**Jugar:** dificultad gradual, retroalimentación inmediata, puntos y repetición espaciada de errores. **Estudiar:** teoría, glosario, autoevaluación, soluciones razonadas. **Examen:** 10/20/30 preguntas; español/inglés/mixto; opción múltiple, identificación visual y clasificación; mostrar nota, errores y explicaciones al finalizar. Para preguntas abiertas, usar autoevaluación con solución modelo, no comparación literal.

## 9. Requisitos técnicos GitHub Pages
- Aplicación 100 % cliente: HTML/CSS/JS o framework con build estático y base path configurable.
- Sin backend, secretos, API keys, autenticación ni datos personales en repositorio público.
- `localStorage` para progreso y exportar/importar JSON; aclarar que es específico del navegador.
- Diseño responsive y accesible (teclado, contraste, textos alternativos, objetivos táctiles).
- SVG propios con regiones clicables para huesos y músculos; no reutilizar sin permiso las ilustraciones del libro.
- Audio inglés opcional con síntesis de voz del navegador; pronunciación puede variar según dispositivo.
- Aleatorizar preguntas/opciones sin repetir opciones idénticas. Validar que cada respuesta existe entre opciones.
- No subir las fotos del libro al repositorio público salvo autorización de derechos.

## 10. Notas de fidelidad y revisión
1. El libro clasifica vértebras como huesos cortos; en anatomía se suelen clasificar como irregulares. Preservar formulación del libro con nota aclaratoria.
2. La ficha inglesa escribe «Ball» en la rodilla; no usar como traducción de rótula. Enseñar «patella / kneecap» y registrar la discrepancia.
3. La ficha usa «Calves» para gemelos; es una denominación de región corporal, mientras «gastrocnemius» es nombre anatómico.
4. «Esguince» en el libro se explica por elongación de ligamentos; la explicación de la web puede aclarar que se trata de una lesión ligamentosa.
5. No presentar vocabulario ampliado como materia obligatoria de examen.
6. La postura para dormir no es universalmente una única posición correcta: priorizar alineación y comodidad.

## 11. Criterios de aceptación
- Cada uno de los conceptos del JSON aparece en el glosario y puede usarse en al menos una actividad.
- Cada pregunta tiene solución visible y trazabilidad.
- Modo Jugar y Modo Estudiar accesibles desde inicio y desde cada tema.
- El examen permite escoger idioma y número de preguntas, y ofrece revisión de errores.
- El sitio funciona desplegado en ruta de subdirectorio de GitHub Pages, sin llamadas a servidor.
- Funciona sin cuenta; los datos no se envían fuera del navegador.

## 12. Instrucción inicial sugerida a Codex
«Lee íntegramente `INFORME_PARA_CODEX.md` y `banco_contenidos.json`. Primero valida la integridad de los datos y propón arquitectura, pantallas, modelos de datos y plan de implementación; no omitas contenidos ni conviertas ampliaciones en obligatorias. Después desarrolla la web estática compatible con GitHub Pages.»
