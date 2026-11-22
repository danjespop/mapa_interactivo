# Movimiento articulado y guía de participación

La revisión sustituye los pesos de deformación que mezclaban regiones próximas por reglas anatómicas. La proximidad entre manos y caderas en reposo no implica conexión: los músculos del tronco conservan sus anclajes, los de las extremidades solo siguen su región y las inserciones del pectoral mayor y del dorsal se mezclan con el húmero, sin arrastrar su origen. Deltoides y cintura escapular usan las articulaciones correspondientes. En la superficie femenina, la región de cada vértice se identifica en la postura de referencia separada y se conserva al relajar los brazos, evitando que muslos o pecho sigan dedos cercanos.

El rig masculino incluye 28 articulaciones de falanges obtenidas de sus mallas reales, además de clavículas, hombros, codos, muñecas, caderas, rodillas, tobillos, pelvis, columna, cuello y cabeza. La superficie femenina utiliza los puntos articulares de su referencia MakeHuman. El agarre combina flexión gradual de los dedos y movimiento del pulgar; las mancuernas se fijan a la mano del modelo elegido.

## Fases y coordinación

- Marcha: apoyo, impulso y oscilación; brazos en sentido opuesto a las piernas del mismo lado, flexión de rodilla durante el avance, compensación del tobillo y contacto del pie con el suelo.
- Carrera: apoyo más breve, mayor amplitud, codos flexionados y fases de vuelo.
- Salto: preparación, impulso, vuelo, recepción y recuperación. La elevación de los brazos se reparte entre cintura escapular y hombro. Las rodillas amortiguan la recepción.
- Carga: elevación, sostén y bajada controlada. El bíceps se muestra también en la bajada, como control del alargamiento, no simplemente como un músculo inactivo.
- Sentarse: descenso, apoyo e incorporación, coordinando caderas, rodillas, tobillos, tronco y brazos.
- Teclado: caminar al desplazarse, orientar el cuerpo hacia el avance y ejecutar un salto completo al pulsar espacio. Los botones permiten repetir ciclos para estudiar.

Las transiciones se interpolan y se puede pausar y recorrer una fase con el deslizador. La marcha y la carrera se adaptan de capturas reales; las amplitudes, la retargetización y el resto de acciones siguen siendo parámetros educativos, no rangos clínicos validados. No se calculan fuerzas o tensiones ni se proporciona una simulación de tejidos validada.

## Nombres y participación

Pulsar una pieza o elegirla en el buscador muestra su nombre junto al modelo y resalta todas sus partes. La etiqueta sigue su anclaje durante el movimiento. La guía opcional explica la fase, resalta músculos implicados y muestra globos con líneas de referencia sin superponerlos. Si la capa activa oculta el músculo, la etiqueta lo indica y hay un botón para descubrirlo. Las estructuras internas de la versión femenina siguen siendo la referencia compartida identificada en la interfaz.

Los resaltados son una selección explicativa de participantes, no una lista exhaustiva ni una lectura de electromiografía.

## Fuentes anatómicas consultadas

OpenStax, *Anatomy and Physiology 2e*, secciones consultadas en su repositorio oficial, commit `f273762340768a5f50e833c876e40b5a9c565da1`:

- [11.1 Interactions of Skeletal Muscles, Their Fascicle Arrangement, and Their Lever Systems](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-1-interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems): origen, inserción, agonistas, antagonistas y fijadores.
- [11.5 Muscles of the Pectoral Girdle and Upper Limbs](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs): pectoral mayor, dorsal, cintura escapular, flexores del codo y musculatura extrínseca e intrínseca de la mano.
- [9.4 Synovial Joints](https://openstax.org/books/anatomy-and-physiology-2e/pages/9-4-synovial-joints): hombro, codo, muñeca, dedos y articulaciones del pulgar.

Los textos de la aplicación son resúmenes didácticos propios. Las superficies anatómicas conservan las fuentes y condiciones indicadas en `assets/modelo3d/ATRIBUCIONES.md`.

## Validación

`node pruebas/cinematica.mjs` verifica continuidad de apoyos de la marcha, coordinación contralateral, valores finitos de articulaciones, apertura/agarre y fases del salto y la carga.

`node herramientas/modelo3d/verificar-rig.mjs` inspecciona los pesos del modelo realmente distribuido, descomprime sus datos y comprueba 40 músculos axiales, 270 músculos de las extremidades sin influencias cruzadas y 28 falanges con articulación propia.

`node pruebas/movimiento-guiado.cjs` comprueba selección por clic y búsqueda, nombre flotante, resaltados por fase, etiquetas sin solapamiento, pausa, exploración, apertura/agarre, ambos modelos y anchura móvil.

## Revisión de superficies, marcha y manos

La piel y las fascias se vinculan por región anatómica y conectividad de la malla. Los pesos se suavizan **antes** de subdividir; así las fronteras de las regiones no generan saltos de articulación entre dos vértices vecinos. El suavizado sigue las aristas de la superficie, no la distancia entre partes que se tocan: una mano próxima a la cadera no se une al muslo. Uñas y perioniquios siguen la región de la mano o del pie correspondiente. Las fascias conservan la cobertura parcial del atlas original: no se añade una envoltura ficticia como si fuera una fascia anatómica completa.

La postura de referencia femenina se corrige para retirar la flexión previa de los codos del modelo base antes de animarlos. La palma termina en la fila metacarpofalángica. El modelo masculino incorpora articulaciones carpometacarpianas de los pulgares; las flexiones de muñecas y dedos emplean ejes calculados desde sus referencias geométricas. El agarre usa flexiones distintas por dedo y articulación, oposición del pulgar, extensión ligera de muñeca y una transición de agarre neutro a supinado en la carga. Estos gestos de manos son animación propia; no proceden de la captura CMU.

La textura se evalúa en coordenadas métricas de referencia de cada malla antes de la deformación. Poros, grano y fibras acompañan al tejido, sin deslizarse al girar el cuerpo o caminar. Se utiliza una base cutánea algo más morena y luz menos intensa. Los rectos y oblicuos abdominales conservan más geometría; en los rectos se preserva la separación de color de las intersecciones tendinosas sin el suavizado que la difuminaba.

### Captura de marcha

Se consulta y adapta **CMU Graphics Lab Motion Capture Database, 07_01 — walk**, a través de la conversión BVH de **Bruce Hahne (2010)** conservada en https://github.com/una-dinosauria/cmu-mocap, commit `09a07f54f3bbb58797325f009282d0b2048a2871`. El índice de la distribución identifica esa secuencia como marcha. La fuente se muestrea a 120 Hz; se descarta la pose T inicial y se recorta un ciclo de 1,1 segundos. Se extraen direcciones de muslos, piernas, brazos y antebrazos, rotación y oscilación pélvicas. El desplazamiento global se retira para previsualizar la marcha en el sitio.

Los datos se adaptan al tamaño y postura del rig, se ajustan amplitudes y se suaviza el cierre del bucle. Se combinan con apoyo talón–planta–antepié y compensación de tobillos para este modelo. No es una reproducción íntegra o clínicamente validada del actor. El README de CMU advierte que **no se capturaron los movimientos de dedos ni pulgares**; no se atribuyen esos gestos a esta captura.

Crédito solicitado por la distribución: **“The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.”** CMU no impone restricciones al uso de los datos y Bruce Hahne no añade restricciones a su conversión. Se conserva el texto íntegro de la distribución en `assets/modelo3d/LICENCIA_MARCHA_CMU.txt`.

Generación: extraer `data/007/07_01.bvh` del commit indicado y ejecutar `node herramientas/modelo3d/preparar-marcha.mjs /ruta/07_01.bvh`. El resultado reproducible se guarda en `src/data/marcha-cmu.json` y se incorpora al bundle; el navegador no descarga BVH ni depende de servicios externos.

### Ropa deportiva y ayuda

La camiseta de tirantes y el pantalón corto tienen mallas propias con holgura. Se añaden zapatillas con suelas, cuello de tobillo y cordones, ligadas a cada pie. Los patrones se ajustan a las secciones del cuerpo, se unen por volumen en Blender, se suavizan las costuras y se abren cuello, sisas, cintura y bajos. El torso y los tirantes comparten vértices; cada prenda es una superficie conectada. El pantalón se ajusta a la sección de cintura de cada cuerpo y las zapatillas siguen las articulaciones de los pies. La malla se reduce para la web. La revisión de caída asienta la tela mediante pequeños pasos de gravedad, restricciones de longitud de aristas y contacto con el cuerpo en Blender. El pantalón se cose con una cintura compartida y una bifurcación continua hacia cada pierna, evitando las aberturas y pliegues del volumen anterior. El drapeado queda congelado y la animación web usa el esqueleto compartido; no hay simulación textil dinámica. Su textura se mantiene en el espacio de referencia. Los mapas de bíceps, cuádriceps, abdominales y glúteos, o de participantes del movimiento, se ubican a partir de los músculos del atlas. Son áreas orientativas sobre la tela, no una medición de esfuerzo ni delimitaciones de fibras. Esta capa sirve como base de las futuras tablas de ejercicios; no se crea todavía un plan de entrenamiento.

Las trece capas disponen de ayuda accesible mediante «?», con la función de cada sistema, su cobertura y fuente. Abrir la ayuda no cambia las capas seleccionadas; se cierra con botón o Escape.

### Verificación adicional

- `node herramientas/modelo3d/probar-superficies.cjs`: carga los dos modelos realmente distribuidos, comprueba influencias en piel y fascias, ejes digitales, deformación en doce poses por cuerpo y la independencia del pantalón al mover solo los brazos. También audita vértices de piernas y pelvis en todas las capas, incluidos vasos y nervios. Registra estiramiento de aristas; no mide deformación fisiológica.
- `node pruebas/cinematica.mjs`: comprueba continuidad del ciclo y correlación contralateral en marcha capturada, permitiendo el desfase real entre brazos y piernas.
- `node pruebas/superficies3d.cjs`: ayuda de trece sistemas, ambos cuerpos, ropa, mapas musculares, acciones, abdominales, shaders y anchura móvil.

## Acabado final y detalles naturales

«De pie» usa ahora una postura de descanso con ligera flexión de codos y dedos y palmas hacia los muslos. La postura base de exportación conserva sus coordenadas de referencia para el rig. Se eliminan también influencias pequeñas de clavículas, cuello o cabeza sobre las estructuras inferiores: los candidatos para vasos y nervios axiales se restringen por altura y región.

La superficie femenina incorpora al 35 % el target CC0 `female-young-averagemuscle-averageweight-maxcup-averagefirmness.target` de la misma versión MakeHuman. Se aumenta el volumen del pecho sin atribuir al modelo una talla de sujetador medida. La referencia 90–100 indicada por el usuario no determina por sí sola contorno y copa. La cabeza usa una superficie capilar adaptada al cuero cabelludo, mechones y cola larga de diseño propio, con movimiento secundario leve ligado a la cabeza.

El visor añade dos articulaciones superficiales del pecho a cada cuerpo. Una respuesta amortiguada a la aceleración y una oscilación respiratoria muy pequeña dan continuidad visual; la amplitud se contiene al vestir el modelo. No se aplican estos desplazamientos al esqueleto ni a los órganos internos. Es un acabado de animación y no una simulación fisiológica.

La mirada utiliza pivotes de globo ocular y pupilas oscuras; los párpados se cierran con un morph de la superficie cutánea. Hay parpadeo espontáneo, un botón para provocarlo, una vista de rostro y un control para mantener los ojos cerrados al observar los párpados. El usuario puede desactivar los detalles naturales.

La ropa no copia la geometría de genitales: tiene una entrepierna propia y se oculta la piel y anatomía reproductora cubierta. El diseño inicial es arena y grafito, con alternativas de color. El mapa muscular está desactivado por defecto. Las zonas se proyectan sobre la tela a partir del atlas y se adaptan a las referencias articulares femeninas; no son mediciones de esfuerzo.

Reproducción de prendas: `node herramientas/modelo3d/probar-superficies.cjs herramientas/modelo3d/exportar-ropa.mjs`, después Blender con `--background --factory-startup --disable-autoexec --python herramientas/confeccionar_ropa.py` después el mismo comando con `herramientas/simplificar_ropa.py`, luego `herramientas/adaptar_ropa_verano.py` y finalmente `node herramientas/modelo3d/probar-superficies.cjs herramientas/modelo3d/confeccionar-tirantes.mjs`. El resultado es `assets/modelo3d/ropa-datos.js` y no requiere servicios externos. Para volver a generar patrones se utiliza `patternSportswear` de `herramientas/modelo3d/patrones-ropa.js`. El visor carga únicamente la ropa terminada de `ropa-datos.js`; no utiliza los patrones intermedios.

La prueba de superficies verifica la conectividad de ambas prendas y que ningún vértice muestreado de piernas o pelvis recibe influencia de brazos, manos o clavículas, incluso con pesos pequeños. Comprueba también que el pantalón permanece inmóvil al mover solo los miembros superiores. La ropa cubierta conserva la anatomía original para su estudio al quitarla, pero la piel y el sistema reproductor que quedan bajo la ropa se ocultan durante su uso.


## Corrección de superficies y contactos

La región mamaria femenina se protege utilizando los índices del target MakeHuman y tres anillos de vecinos. Esa máscara impide que la relajación de brazos y la proximidad al hombro arrastren el pecho. Las comisuras masculinas se suavizan por conectividad y el labio derecho se contrasta con la superficie izquierda reflejada. El cabello femenino tiene una cubierta volumétrica con transición al nacimiento, borde suavizado, mechones, cola y paleta castaña; las cejas son mallas finas arqueadas adaptadas a su frente.

La carrera usa **CMU 09_01 — run**, conversión BVH de Bruce Hahne (2010), del mismo repositorio y condiciones de la marcha. `herramientas/modelo3d/preparar-carrera.mjs` recorta los frames 1–89 a 120 Hz, obtiene un ciclo de 0,733 s, suaviza el cierre y adapta amplitudes y ejes. Datos: `src/data/carrera-cmu.json`. Los tobillos conservan ángulos locales limitados durante el vuelo; ya no compensan todo el giro de cadera y rodilla. La marcha interpola el tobillo al entrar y salir del apoyo. El salto lleva los brazos hacia delante y arriba en el plano sagital, con separación lateral, en lugar de aducirlos contra las caderas durante la preparación.

`src/contactos-cuerpo.js` obtiene dos cápsulas de muslo de la piel y articulaciones reales de cada modelo. Comprueba muñeca, palma, nudillos y extremos digitales contra ambos muslos y corrige suavemente la separación del hombro cuando existe intersección. Es un sistema local de separación mano–muslo, no un motor de colisión general de órganos o ropa. El apoyo vertical se calcula con muestras de las plantas o del contorno de las suelas reales; durante el vuelo se añade la altura del salto o carrera.

`verificar-superficies.mjs` recorre 400 poses adicionales por cuerpo (marcha, carrera, salto, carga y sentarse) y exige separación positiva con el margen de ropa y apoyo de suela coherente con la fase. También comprueba continuidad de cada prenda. Estas comprobaciones verifican el rig educativo y no validan biomecánica clínica.

Para reproducir la caída de la ropa, después de confeccionar los tirantes se ejecuta `node herramientas/modelo3d/probar-superficies.cjs herramientas/modelo3d/exportar-colision-ropa.mjs` y Blender con `--background --factory-startup --disable-autoexec --python herramientas/caida_ropa.py`. Usa 60 iteraciones de restricciones con anclajes de hombros/cintura, contacto contra una superficie simplificada y un límite de desplazamiento de 25 mm. Se conserva la topología para no abrir agujeros en la entrepierna. Después se ejecuta `node herramientas/modelo3d/confeccionar-pantalon.mjs`, que sustituye los paneles anteriores del pantalón por una superficie continua con cintura común y costura de entrepierna compartida, y `node herramientas/modelo3d/probar-superficies.cjs herramientas/modelo3d/cobertura-ropa.mjs`: calcula la piel oculta mediante intersecciones de rayos con la prenda terminada, respetando cuello y sisas. No necesita descargas en el navegador.
