# Juan como marioneta para videos

## Crear y descargar una película

1. Abrir el taller y bajar a **Crear video / Dirige tu próxima escena**.
2. Elegir uno de los 35 movimientos, duración entre 1 y 30 segundos, velocidad y encuadre. Añadir la toma. El atuendo actual queda asociado a esa toma.
3. Reordenar con ↑ y ↓ o quitar con ×. El ejemplo inicial contiene saludo, explicación y despedida: 12 segundos.
4. Usar **Ver secuencia** para revisar intención, encuadres y transiciones. El monitor pequeño permite verla desde el editor.
5. Elegir horizontal (1280 × 720), vertical (720 × 1280) o cuadrado (720 × 720).
6. Elegir silencio, una muestra de voz de Juan o un archivo de audio propio. El audio empieza al inicio y se reproduce una sola vez; si es más corto, el resto del video queda en silencio. Si es más largo que la película, se corta al terminar. Máximo 50 MB y 5 minutos de audio.
7. Pulsar **Grabar película completa** y mantener visible la pestaña. La grabación se hace en tiempo real, con objetivo de 24 fps; el rendimiento depende del dispositivo. El modo stop motion mantiene 12 poses por segundo dentro de esa salida.
8. Al terminar, revisar el reproductor y pulsar **Descargar video**. MP4 cuando el navegador lo admite; en otros casos WebM. La extensión corresponde al contenedor realmente generado.

No se graba la pantalla, cámara ni micrófono. El archivo contiene el render del personaje con fondo de estudio, más el audio elegido. Las muestras de voz y el audio cargado se procesan localmente. Los archivos no se suben a ningún servicio.

**Terminar y guardar lo grabado** conserva la parte realizada. Si se oculta la pestaña durante la grabación, se detiene y permite descargar esa parte para evitar seguir grabando sin fotogramas. No recargar ni cerrar el taller antes de descargar: el video preparado vive en la memoria del navegador.

## Conservar el trabajo

La secuencia se guarda en el almacenamiento local del navegador cuando este lo permite. **Guardar proyecto** crea un JSON con tomas, velocidad, encuadre, atuendo por toma, cadencia, nombre, tamaño y selección de audio. **Abrir proyecto** restaura esos datos. Los archivos de audio propios no se incrustan: hay que volver a elegirlos.

Hasta 40 tomas y cinco minutos por película. Estos límites mantienen manejable una grabación local en memoria. La descarga de proyecto no es un video; el botón de descarga del resultado sí entrega la película.

## Biblioteca de actuación

35 movimientos originales agrupados en pausas, conversación, reacciones, acciones y movimiento. Incluye escuchar, despedirse, explicar, enumerar ideas, señalar, pensar, asentir, negar, sorprenderse, alegrarse, reír, entristecerse, frustrarse, aliviarse, dudar, agradecer, hacer reverencia, ofrecer, recoger, trabajar, aplaudir, bailar, caminar, marchar y estirarse.

Las acciones de ofrecer, recoger y trabajar son gestos de actuación, sin contacto físico calculado con herramientas. La caminata es en el sitio. La gesticulación de boca no es sincronización de fonemas con audio.

## Retroalimentación aplicada

| Lo observado en la versión anterior | Cambio realizado | Cómo se comprobó |
|---|---|---|
| Cuatro movimientos no cubrían escenas de diálogo | 35 acciones clasificadas y búsqueda por nombre | Pruebas de muestreo de todos los movimientos: rotaciones finitas y cambios reales |
| Cambiar de acción podía causar un salto brusco | Mezcla de poses durante 0,35 s al inicio de cada toma | Vista previa de varias tomas y video exportado |
| Solo se podían descargar imágenes y poses | Grabación de la secuencia completa con audio y fondo | MP4 horizontal descargado y examinado con ffprobe y un fotograma extraído |
| El encuadre del visor dependía del ancho de la página | Cámara de exportación independiente con tamaño fijo | Video 1280 × 720; segunda exportación 720 × 720 |
| El trabajo no se podía retomar como secuencia | Guardado local y proyecto JSON importable | Añadir, ordenar, quitar, descargar y reabrir un proyecto |
| El editor quedaba lejos del avatar en pantallas pequeñas | Monitor de la toma dentro del editor y acceso directo a Crear video | Revisión de interfaz y vista previa |

La revisión detectó además que al desbloquear la interfaz después de grabar se podían habilitar flechas inválidas de la primera y última toma. Se corrigió reconstruyendo sus controles al finalizar.

## Evidencia y límites

`ejemplos/Juan-demo-completa.mp4`: película real creada desde la web, H.264, 1280 × 720, 24 fps, duración medida de 11,929 segundos para una secuencia de 12 segundos, con pista AAC de la muestra de voz. La pequeña diferencia de duración corresponde a la captura en tiempo real. `ejemplos/Juan-pelicula.json` conserva su secuencia. También se verificaron exportaciones cuadrada y vertical sin sonido y la finalización manual anticipada.

Esto sigue siendo un rig procedural de piezas rígidas. Para actuación facial fina y trabajos finales conviene mejorar párpados, dirección independiente de ojos, visemas, manos, contactos y silueta. No se implementaron captura de movimiento ni retargeting. Las emociones son propuestas de actuación contextual, no diagnósticos ni mecanismos para garantizar una reacción del espectador.

Para repetir las verificaciones puras: `node test-motions.mjs`. La grabación se verifica en un navegador con WebGL y MediaRecorder.

Referencias técnicas: [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) y [captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream). La selección de formato se realiza con `MediaRecorder.isTypeSupported`, sin asumir que todos los navegadores generan MP4.

## Ampliación del editor 3D

La interfaz de esta guía se amplió con biblioteca, visor, inspector y montaje. La salida de video está ahora en **Exportar video**. [EDITOR_3D.md](EDITOR_3D.md) documenta las funciones actuales, el nuevo esquema de proyectos v3 y los límites del editor. El montaje admite seleccionar y editar tomas, dividir, duplicar y guardar sus escenarios, objetos, animales, recorridos y títulos. La toma GLB conserva su animación para render fuera del navegador.
