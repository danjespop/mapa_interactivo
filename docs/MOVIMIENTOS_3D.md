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

Las transiciones se interpolan y se puede pausar y recorrer una fase con el deslizador. Los ángulos y tiempos son parámetros educativos, no rangos clínicos medidos ni datos de captura de movimiento. No se calculan fuerzas o tensiones ni se proporciona una simulación de tejidos validada.

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

`node herramientas/modelo3d/verificar-rig.mjs` inspecciona los pesos del modelo realmente distribuido, descomprime sus datos y comprueba 42 músculos axiales, 378 músculos de las extremidades sin influencias cruzadas y 28 falanges con articulación propia.

`node pruebas/movimiento-guiado.cjs` comprueba selección por clic y búsqueda, nombre flotante, resaltados por fase, etiquetas sin solapamiento, pausa, exploración, apertura/agarre, ambos modelos y anchura móvil.
