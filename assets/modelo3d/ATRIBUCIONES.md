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

Conversión en Blender 4.3.2 con la ejecución automática de scripts del archivo desactivada. Se excluyen anotaciones, curvas de control, interfaces del complemento y geometrías auxiliares sin superficie anatómica. Se optimizan superficies densas, se añaden materiales uniformes para distinguir tejidos y un rig didáctico para cambiar de postura. Se preservan las superficies y nombres del atlas. No se usan primitivas geométricas como sustitutos de huesos, músculos u órganos.

El archivo `anatomia-datos.js` contiene el glTF en base64 para permitir también abrir el ZIP con `file://`, sin servidor ni solicitudes externas. `manifest.json` recoge el número real de estructuras y polígonos exportados. La geometría puede reproducirse con `herramientas/exportar_anatomia.py` sobre el archivo fuente indicado.

## Alcance

Atlas anatómico de referencia para exploración educativa. El rig, sus pesos y sus movimientos son adaptaciones didácticas; no han sido validados clínicamente. No se calculan fuerzas, flujos sanguíneos, conducción nerviosa real, lesiones ni reparación de tejidos. Las representaciones pertenecen al modelo anatómico original, no a la anatomía particular del niño.

## Superficie femenina

La superficie femenina se genera a partir de `base.obj` y de los targets adultos femeninos de **MakeHuman Community**, commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482` de https://github.com/makehumancommunity/makehuman. Los assets están publicados bajo **CC0 1.0**; se conserva su licencia en `LICENCIA_MAKEHUMAN.txt`. Se combinan por igual los tres targets de ascendencia femenina adulta y el target de musculatura/peso medios, y se adapta la postura de referencia antes de añadir el rig educativo. No procede de una deformación del modelo masculino de Z-Anatomy.

La superficie femenina tiene una anatomía externa propia. Los sistemas internos que se pueden activar son los de referencia compartidos de Z-Anatomy y no representan diferencias anatómicas específicas de sexo. El sistema reproductor masculino se desactiva al seleccionar el cuerpo femenino; no se inventa ni se presenta como femenino. Las estructuras de ojos y cabello del atlas se ajustan a los puntos de referencia del modelo femenino y conservan las atribuciones de Z-Anatomy. La interfaz muestra esta limitación de procedencia.

Los materiales del visor añaden texturas procedurales de superficie (grano óseo, fibras visuales y microrelieve de piel) sin fotografías externas. Esas texturas son un acabado visual, no representaciones histológicas ni mapas de fibras validados. Los límites de color entre músculo y tendón se interpolan para evitar bordes de material dentados. Las bolsas articulares y almohadillas grasas se pueden explorar en una capa independiente, evitando confundirlas con músculos superficiales.
