# El taller de Juan · Editor de escenas y montaje

## Lo que cambió

El taller pasa de una lista de gestos a un editor con cuatro áreas visibles: biblioteca, visor 3D, inspector de elementos y montaje horizontal. Se conserva el avatar y la biblioteca de 35 movimientos. Los proyectos anteriores de versión 2 se pueden abrir; se completan con un escenario de taller y se guardan como versión 3.

No es una reproducción completa de CapCut. Es un editor local centrado en la puesta en escena de una marioneta 3D. La pista principal sigue siendo secuencial; los elementos pertenecen a cada toma.

## Empezar sin construir todo desde cero

Abrir **Ver proyecto de ejemplo**, o iniciar la web con `?ejemplo=escenarios`. Contiene doce segundos en tres mundos: taller, bosque y pueblo, con perro, conejo, pájaro, gato, plantas, alcancía y cofre. Este modo usa un espacio de guardado local separado y no reemplaza el proyecto principal. Para conservar una copia transportable, descargar su proyecto JSON.

El archivo de ejemplo también se incluye en `ejemplos/editor-3d/Tres-mundos-de-Juan.json`.

## Construir una toma

1. Seleccionar una tarjeta del montaje. El indicador **Editando toma N** muestra dónde se guardan los cambios.
2. Elegir el escenario: estudio, taller, bosque, pueblo, desierto o noche de campo. Cambiarlo conserva los elementos que ya se añadieron.
3. Añadir elementos desde la biblioteca. Hay catorce: cuatro animales —perro, gato, conejo y pájaro— y diez objetos o elementos de paisaje.
4. Seleccionar un elemento desde la lista o directamente sobre el visor. Arrastrarlo por el suelo; para girar la cámara, arrastrar en un espacio vacío. Los campos X, altura, Z, escala y giro permiten ajustar con precisión.
5. Duplicar, eliminar o distribuir los elementos. **Deshacer escena / Rehacer** recupera cambios de composición. Los objetos decorativos del escenario prediseñado forman parte del decorado; los añadidos desde la biblioteca sí aparecen individualmente en el inspector.
6. Abrir **Animar recorrido e interacción**. La posición principal es el inicio y los campos de posición final definen dónde acaba el elemento. También funciona para Juan.
7. Para animales y objetos, elegir permanecer, pasear, seguir a Juan, saltar o mirar hacia él. Las patas, alas y colas de los animales tienen movimiento procedural durante la reproducción. Son interacciones dirigidas, sin detección de obstáculos ni agarres.

Los cambios de escenario y elementos se guardan automáticamente en la toma seleccionada. **Escenario en todas** copia esa composición al resto de tomas. No se aplica automáticamente: cada plano puede tener su propio lugar y reparto.

## Fondos propios

**Importar fondo** admite PNG, JPEG y WebP desde el equipo, hasta 15 MB de entrada. Se reduce a una imagen de hasta 1600 × 1200 y se integra en el proyecto. Se cambia al decorado de estudio para que ninguna pared o edificio tape la imagen. **Quitar imagen** devuelve el fondo del escenario seleccionado.

El fondo importado es 2D; no tiene parallax ni geometría. Los seis decorados procedurales sí contienen mallas 3D. Las imágenes se guardan embebidas en el JSON y no se envían a servicios externos.

## Editar el montaje

- Seleccionar una tarjeta carga sus valores en el editor.
- Modificar movimiento, duración, velocidad, encuadre o título y pulsar **Aplicar cambios a la toma**.
- **Añadir toma** crea otra con la composición actual.
- Arrastrar tarjetas para ordenar, o usar sus flechas.
- **Duplicar toma** conserva su escenario, recorrido, texto y vestuario.
- El cursor permite inspeccionar cualquier momento de la película.
- **Dividir** separa la toma seleccionada en el cursor si está dentro de ella, dejando al menos un segundo a cada lado. Si el cursor está fuera, la divide por la mitad. Conserva la fase del gesto y el punto de unión de los recorridos; la aceleración de cada tramo se vuelve a calcular.
- El título o subtítulo es un texto por toma, hasta 120 caracteres, incluido tanto en el visor como en el video.
- **Guardar cámara actual** captura posición y punto de mira de la cámara 3D para esa toma. Los otros encuadres son cuerpo completo y retrato.

Las tomas tienen entre uno y treinta segundos; hasta cuarenta tomas y cinco minutos por película. No hay todavía pistas independientes para cada objeto, edición de audio multipista, curvas de keyframes arbitrarias ni animación de cámara entre dos encuadres.

## Exportar video

**Exportar video** abre un panel de salida, sin desplazar al usuario a otra sección. Conserva las salidas horizontal, vertical y cuadrada; silencio, muestra de voz o audio propio; y MP4/WebM según soporte del navegador. La grabación es en tiempo real, con objetivo de 24 fps, y usa el escenario y los elementos activos de cada toma. Incluye sus títulos.

El audio comienza en el inicio de la película. No hay sincronización labial precisa. Más información en [PRODUCCION_VIDEO.md](PRODUCCION_VIDEO.md).

## Salir del navegador hacia un render 3D

**Toma animada · GLB** exporta la toma seleccionada con:

- Mallas, materiales y texturas del personaje, escenario y elementos añadidos.
- Cámara actual y luces direccionales compatibles con glTF.
- Un clip con las articulaciones de Juan, sus recorridos y los de los elementos; también cabeza, patas, alas y cola de los animales.
- Muestreo a doce poses por segundo, con interpolación constante si stop motion está activado.

Es una toma individual, no toda la película montada. Las imágenes de fondo 2D, títulos y audio permanecen en el proyecto JSON y en el video; no forman parte del GLB. La luz hemisférica tampoco se conserva en ese formato. El GLB no convierte las piezas rígidas en una malla humana deformable.

Se probó la importación en Blender de una toma con 434 nodos, una cámara y 132 canales de animación. Hay un `.blend` editable y una imagen renderizada en `ejemplos/editor-3d/render/`.

Para renderizar una toma exportada sin depender de la captura en tiempo real:

```sh
blender -b -P render_blender.py -- /ruta/absoluta/Juan-toma-3D.glb --output /ruta/absoluta/render --height 1080
```

Para una sola imagen de prueba:

```sh
blender -b -P render_blender.py -- /ruta/absoluta/Juan-toma-3D.glb --output /ruta/absoluta/render --height 720 --samples 32 --still
```

El script crea un `.blend`, importa la cámara y animación, añade una luz suave y ambiente para render físico, y genera PNG o MP4 con Cycles y ffmpeg. No añade el audio ni los títulos del montaje. La altura puede configurarse entre 240 y 2160; la anchura mantiene la relación de aspecto de la cámara exportada. La iluminación física puede diferir del visor y se puede editar en el `.blend`.

## Estructura para seguir creciendo

| Módulo | Responsabilidad actual | Extensión prevista |
|---|---|---|
| `scene-data.js` | Esquema serializable y validación de escenarios, elementos y recorridos | Registro de recursos y referencias compartidas |
| `scenery.js` | Decorados y catorce elementos procedurales | Importador de modelos GLB y materiales de mayor detalle |
| `scene-editor.js` | Inspector, selección, arrastre, historial, interacción y exportación animada | Gizmos XYZ, keyframes por propiedad, contactos e IK |
| `motions.js` | Biblioteca de actuación independiente del render | Retargeting, expresiones, visemas y contactos de manos |
| `studio.js` | Montaje, cursor, títulos, toma seleccionada y captura | Pistas por objeto, audio multipista y curvas de cámara |
| `render_blender.py` | Render de una toma fuera del navegador | Cola de tomas y composición final con títulos y mezcla de audio |

Las extensiones de la última columna son trabajo futuro, no funciones disponibles. La base para llevar geometría y movimiento al render externo sí está implementada.

## Verificaciones de esta entrega

- Pruebas puras de los 35 movimientos, migración v2, conservación del esquema v3, escenarios y recorridos.
- En navegador: añadir y transformar elementos, interacción de animal, duplicar y deshacer, seleccionar y dividir tomas, importar un fondo local y abrir la salida de video.
- GLB descargado, inspección de su cámara y canales, importación y render en Blender; comprobación de que los objetos cambian al evaluar distintos fotogramas.
- Película de doce segundos con taller, bosque y pueblo, para verificar fondos, elementos y títulos dentro del archivo final.

Referencia del formato y exportador: [Three.js GLTFExporter](https://threejs.org/docs/#examples/en/exporters/GLTFExporter). La geometría y decorados de esta entrega son originales del proyecto.
