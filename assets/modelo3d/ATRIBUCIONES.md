# Atlas anatómico de referencia

Geometría obtenida de **Z-Anatomy — The libre 3D atlas of anatomy**, por Gauthier Kervyn y colaboradores, basada en **BodyParts3D — The Database Center for Life Science**, Kousaku Okubo.

Repositorio de procedencia: https://github.com/Z-Anatomy/Models-of-human-anatomy

Versión: `d14fa54355a3b484cefd08c33f6e18526d9aea85`, archivo `Z-Anatomy.zip`, `Z-Anatomy/Startup.blend`.

## Licencias y atribución

El proyecto Z-Anatomy declara CC BY-SA 4.0. BodyParts3D declara CC BY-SA 2.1 Japan. Se conserva la declaración original completa en `LICENCIA_ORIGINAL.txt`, incluidas las atribuciones de los componentes adicionales, que no se deben eliminar ni sustituir por una licencia general de la aplicación:

- Brainder y White matter, University of Washington.
- Cranial Nerves and Foramina, University of Dundee, CAHID, CC BY 4.0.
- Anatomy of the Inner Ear, University of Dundee School of Medicine, CC BY-NC-SA 4.0.
- Kidney, Lissie Cowley, CC BY-NC 4.0.

La colección conserva los nombres de las estructuras como nodos separados y sus atribuciones. Las restricciones de uso no comercial de los componentes indicados siguen siendo aplicables. Las adaptaciones de las mallas de Z-Anatomy se ofrecen bajo CC BY-SA 4.0, respetando las condiciones particulares de sus componentes. No se atribuye la autoría anatómica al proyecto escolar.

## Modificaciones realizadas

Conversión en Blender 4.3.2 con la ejecución automática de scripts del archivo desactivada. Se excluyen anotaciones, curvas de control, interfaces del complemento y geometrías auxiliares sin superficie anatómica. Se convierten también las curvas anatómicas con perfil: vasos, nervios y vías viscerales. La conversión se realiza antes de retirar sus perfiles auxiliares; el inventario registra las superficies recuperadas y cualquier omisión. Se optimizan superficies densas, se añaden materiales uniformes para distinguir tejidos y un rig didáctico para cambiar de postura. Se preservan las superficies y nombres del atlas. Los huesos, músculos y órganos importados conservan sus superficies anatómicas. Las reconstrucciones didácticas adicionales se identifican explícitamente en el apartado de órganos pélvicos femeninos.

El archivo `anatomia-datos.js` contiene el glTF en base64 para permitir también abrir el ZIP con `file://`, sin servidor ni solicitudes externas. `manifest.json` recoge el número real de estructuras y polígonos exportados. La geometría puede reproducirse con `herramientas/exportar_anatomia.py` sobre el archivo fuente indicado.

## Alcance

Atlas anatómico de referencia para exploración educativa. El rig, sus pesos y sus movimientos son adaptaciones didácticas; no han sido validados clínicamente. No se calculan fuerzas, flujos sanguíneos, conducción nerviosa real, lesiones ni reparación de tejidos. Las representaciones pertenecen al modelo anatómico original, no a la anatomía particular del niño.

## Superficie femenina

La superficie femenina se genera a partir de `base.obj` y de los targets adultos femeninos de **MakeHuman Community**, commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482` de https://github.com/makehumancommunity/makehuman. Los assets están publicados bajo **CC0 1.0**; se conserva su licencia en `LICENCIA_MAKEHUMAN.txt`. Se combinan por igual los tres targets de ascendencia femenina adulta y el target de musculatura/peso medios, y se adapta la postura de referencia antes de añadir el rig educativo. No procede de una deformación del modelo masculino de Z-Anatomy.

La superficie femenina tiene una anatomía externa propia. El aparato reproductor y la vejiga femeninos se incorporan desde Human Reference Atlas / HuBMAP, con las reconstrucciones diferenciadas que se describen abajo. Los demás sistemas internos utilizan referencias adaptadas de Z-Anatomy. Las estructuras reproductoras masculinas no se copian al cuerpo femenino. Las estructuras de ojos y cabello del atlas se ajustan a los puntos de referencia del modelo femenino y conservan las atribuciones de Z-Anatomy. La interfaz muestra esta limitación de procedencia.

Los materiales del visor añaden texturas procedurales de superficie (grano óseo, fibras visuales y microrelieve de piel) sin fotografías externas. Esas texturas son un acabado visual, no representaciones histológicas ni mapas de fibras validados. Los límites de color entre músculo y tendón se interpolan para evitar bordes de material dentados. Las bolsas articulares y almohadillas grasas se pueden explorar en una capa independiente, evitando confundirlas con músculos superficiales.

## Ampliación digestiva y revisión de capas

Se incorporan **Jejunum (FMA7207), Ileum (FMA7208) y Rectum (FMA14544)** de BodyParts3D 3.0, distribución 20110915. Crédito: **BodyParts3D, © 2008 Database Center for Life Science, licensed under CC BY-SA 2.1 Japan**. Conversión original a STL binario de Kevin Mattheus Moerman: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D, commit `2c83c698788cff57f6317bddcf712e7acfbea7d8`. Se conserva su declaración de licencia en `LICENCIA_BODYPARTS3D.txt`. Las tres superficies adaptadas conservan CC BY-SA 2.1 Japan.

Referencia del conjunto: Mitsuhashi et al., *BodyParts3D: 3D structure database for anatomical concepts*, Nucleic Acids Research (2009), https://doi.org/10.1093/nar/gkn613. Archivo: https://doi.org/10.18908/lsdba.nbdc00837-000.

Las superficies se registran mediante una escala y traslación uniformes, contrastadas con las dos caderas y los dos fémures de ambos conjuntos. Parámetros, piezas y procedencia en `src/data/registro-bodyparts3d.json`. El error máximo de 2,36 mm corresponde a las referencias de registro óseo, **no** a una medición de precisión clínica de los órganos. Se sustituye el yeyuno previo para usar una pareja yeyuno/íleon de la misma distribución. No se añaden tubos inventados para cerrar huecos.

El páncreas, el hipotálamo, los testículos y la faringe conservan afiliaciones compartidas cuando corresponden. La pleura y los epiplones pueden ocultarse para permitir ver los órganos. Los materiales distinguen hígado, bilis, páncreas, riñones, bazo, glándulas, sustancia gris y blanca. El rojo/azul vascular es una convención de oxigenación: las arterias pulmonares son azules y las venas pulmonares rojas; la sangre venosa real es rojo oscuro. El azul claro de las cavidades de LCR y el verde linfático son convenciones del atlas. La fuente disponible no contiene una red periférica de vasos linfáticos completa.

Las texturas de los órganos añaden variación de color y microrelieve muy sutiles; no representan tejido histológico ni enfermedades. Referencia bibliográfica para la organización y las convenciones: *OpenStax Anatomy and Physiology 2e*, capítulos 18–28: https://openstax.org/details/books/anatomy-and-physiology-2e. No se han copiado imágenes de ese libro al modelo.

La revisión técnica y sus límites se recogen en `REVISION_CAPAS.md`; la interfaz ofrece una ficha por sistema. No supone una certificación clínica ni la representación de todas las estructuras del cuerpo humano.

## Superficies animadas y prenda deportiva

Los pesos de piel y fascias se asignan por región y se suavizan por conectividad antes de subdividir. La superficie femenina se coloca con codos extendidos en la referencia; se adaptan los ejes de manos, dedos y pulgares. El detalle de rectos y oblicuos abdominales se reduce menos y se conservan las intersecciones tendinosas. La paleta de piel y la iluminación se ajustan para un tono algo más moreno. Las coordenadas de textura se fijan antes de deformar las mallas.

Las prendas deportivas de diseño propio se ajustan a las referencias de cada modelo y se unen y suavizan en Blender: **Z-Anatomy CC BY-SA 4.0** para la masculina y **MakeHuman CC0** para la femenina. Conserva estas condiciones de procedencia, con geometría, materiales y mapas orientativos añadidos por el proyecto. No se emplean texturas fotográficas externas.

La marcha se adapta de CMU Graphics Lab Motion Capture Database, secuencia **07_01 — walk**, conversión BVH Bruce Hahne (2010). Procedencia, recorte, modificaciones y condiciones se documentan en `docs/MOVIMIENTOS_3D.md` y `LICENCIA_MARCHA_CMU.txt`. Crédito: “The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.” Las manos y los dedos se animan por separado; no se atribuyen a datos capturados.

El aumento moderado del pecho femenino utiliza el target CC0 adulto `female-young-averagemuscle-averageweight-maxcup-averagefirmness.target`, peso 0,35, del commit MakeHuman ya indicado. Es una proporción visual, no una talla de sujetador medida. La superficie de cabello se adapta al cuero cabelludo MakeHuman; los mechones, cola, tejido y paletas de ropa son procedimentales y de diseño propio. La mirada, el parpadeo, la respiración y el movimiento superficial amortiguado se añaden en el visor y se pueden desactivar. No se incorporan fotografías externas ni modelos comerciales.

El conjunto final se compone de camisetas de tirantes, pantalones cortos y zapatillas deportivas de diseño propio. Los tirantes se cosen al torso mediante vértices compartidos; las zapatillas incorporan suelas y cordones. Los colores iniciales son arena y grafito y el resaltado muscular es opcional. Las prendas tienen geometría propia, que conserva cubiertos los genitales en ambos cuerpos.


La revisión de contactos añade la captura **CMU 09_01 — run**, conversión Bruce Hahne (2010), con la misma procedencia y condiciones que 07_01. “The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.” El ciclo adaptado conserva su procedencia en `src/data/carrera-cmu.json`. La retargetización, las manos y los contactos son adaptaciones propias educativas. Las prendas se asientan mediante gravedad y colisión en Blender antes de exportarlas; el navegador anima el resultado mediante el rig. El cabello volumétrico y las cejas femeninas son geometría procedimental propia sobre la superficie MakeHuman CC0.


El vocabulario bilingüe procede del texto **Translations** incluido en el mismo `Startup.blend` de Z-Anatomy citado arriba: 7.284 entradas con nombre inglés y español, conservadas en `src/data/nombres-z-anatomy.json`. Se mantiene la atribución y las condiciones CC BY-SA de la fuente; el proyecto no se atribuye su traducción. `herramientas/extraer_nombres.py` reproduce la extracción sin ejecutar scripts del archivo. El visor conserva el nombre original y muestra ambos idiomas por separado.

`src/data/nombres-complementarios.json` contiene traducciones complementarias propias para las etiquetas abreviadas o modificadas del atlas. Las estructuras no identificadas en la fuente se indican expresamente como tales; no se inventa su identificación.


## Órganos pélvicos femeninos HRA / HuBMAP

Útero (cuerpo, fondo, paredes, cuernos, cuello y orificios cervicales), dos ovarios, dos trompas uterinas y vejiga femenina: **Kristen Browne y Heidi Schlehlein, Human Reference Atlas / HuBMAP CCF 3D Reference Object Library**, distribución v1.3 de https://github.com/hubmapconsortium/ccf-releases, commit `b036a91aaf7234f462b1249d4a5f4fb0e982f412`. Licencia **Creative Commons Attribution 4.0 International (CC BY 4.0)**: https://creativecommons.org/licenses/by/4.0/. Las superficies y sus adaptaciones mantienen esta atribución. No se aplica a estas piezas la licencia de Z-Anatomy.

Se conservan las superficies anatómicas separadas del glTF, se hornean sus transformaciones y se registran mediante las referencias óseas de pelvis y sacro en el cuerpo MakeHuman. Se mantiene su color de referencia, con un tono ovárico más cálido. El rig añadido las une a la pelvis femenina. Los extremos distales de los uréteres se adaptan a los orificios de la vejiga femenina; no se duplica la vejiga ni se conserva la uretra masculina en ese cuerpo. La procedencia, los DOI, las huellas de los archivos originales, el número de superficies y el método están en `reproductor-femenino-manifest.json`. `herramientas/modelo3d/importar-reproductor.mjs` reproduce la conversión a partir de los glTF originales. El registro no es una validación clínica de posición, tamaño ni biomecánica.

**Vagina y uretra femenina:** reconstrucciones didácticas propias, CC BY 4.0. No proceden de una segmentación HRA. El canal vaginal incorpora pared aplanada, fórnices y pliegues internos simplificados y se conecta al cuello uterino HRA. La uretra es un trayecto didáctico independiente desde el cuello vesical hasta una abertura anterior a la vaginal. Sus fichas de fuente indican esta distinción. Referencias descriptivas: *OpenStax Anatomy and Physiology 2e*, 27.2 (sistema reproductor femenino) y 25.3 (transporte de orina). No se representan ciclos, embarazo, histología ni estructuras vulvares seleccionables por separado.
