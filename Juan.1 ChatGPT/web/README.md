# El taller de Juan · Avatar web

Web interactiva local con un modelo procedural creado para el navegador a partir de la referencia del proyecto. Es una nueva interpretación estilizada: conserva bigote canoso, sombrero, madera, chaleco, pañuelo y manos articuladas; todavía no reproduce toda la escultura o las texturas de la ilustración. No reemplaza los archivos Blender existentes.

## Abrir

En macOS, doble clic en **Abrir taller de Juan.command**. Requiere Python 3, ya instalado en este equipo. Mantener la ventana de Terminal abierta mientras se usa la web. Ctrl+C cierra el servidor. Si hay otro servidor en el puerto elegido, el lanzador busca otro disponible.

Alternativa desde esta carpeta:

```sh
python3 serve.py
```

No abrir `index.html` mediante `file://`: los módulos JavaScript necesitan HTTP. Todo se sirve en `127.0.0.1`; no hay subida, cuenta, conexión a plataformas ni llamadas externas. Three.js 0.180.0 y su licencia MIT se incluyen en `vendor/`.

## Editor 3D y montaje

La [guía del editor 3D](EDITOR_3D.md) explica los seis escenarios, los catorce elementos, animales, recorridos, importación de fondos, títulos, división de tomas y exportación de una toma animada a GLB. La película de prueba se incluye en `ejemplos/editor-3d/Tres-mundos-de-Juan.mp4`.

## Interacción

- Arrastrar sobre el visor: girar cámara. Rueda o gesto de pinza: acercar o alejar.
- Botones de cámara: vista frontal, detalle de rostro y restablecer pose/cámara.
- Flechas del teclado con foco en el visor, o botones bajo él: desplazar a Juan dentro del área de prueba.
- Seis poses: calma, saludo, pensar, presentar, bienvenida y celebrar.
- 35 animaciones originales con búsqueda y categorías. No se reproducen automáticamente.
- Stop motion activado: las articulaciones se actualizan a 12 poses por segundo. Desactivado: movimiento continuo.
- Tres atuendos, sombrero y moneda independientes, tres ambientes de luz y giro del personaje.
- Articulación: ajustar cabeza, brazos y codos. El ajuste detiene la animación.
- Descargar pose: guarda articulaciones en radianes, atuendo, accesorios, posición y giro en JSON. No hay importación de poses en esta versión.
- Guardar imagen: PNG transparente del avatar y su sombra, con la cámara actual. No incluye los paneles de la web.
- Voz: reproducir las muestras sintéticas cálida y grave. Sin sincronización labial.

Los controles del avatar vuelven al estado inicial al recargar. La secuencia de película se conserva en almacenamiento local cuando está disponible. La caminata es una prueba en el sitio, sin IK ni simulación de contacto. El modelo se genera en `avatar.js`, con grupos jerárquicos y materiales, y es distinto de los GLB previos. El personaje completo, sus poses y las texturas se construyen localmente por código.

## Archivos

- `index.html`, `style.css`: interfaz adaptable y controles con nombres accesibles.
- `avatar.js`: geometría, rig, atuendos y texturas de madera, palma y tejido.
- `app.js`: iluminación, cámara, animación, interacción y exportación.
- `assets/`: referencia y muestras de voz del proyecto.
- `vendor/`: Three.js y OrbitControls, versión fijada.

## Verificación

Comprobados en el navegador: render 3D, seis controles de pose, cambio de atuendo y accesorio, articulación manual, reproducción/pausa, selección de animación, desplazamiento con botón y teclado, audio cálido, descarga PNG, descarga JSON, diálogo de referencia con cierre por Escape y diseño a 390 y 1440 píxeles. JavaScript verificado con `node --check`. El navegador no registró errores durante estas pruebas. La aceleración WebGL 2 debe estar disponible.

Referencias técnicas: [Three.js](https://threejs.org/docs/) y [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls). El diseño y la geometría de Juan son originales de este módulo; la imagen de referencia la aportó el usuario.

## Películas completas

El módulo [Producción de video](PRODUCCION_VIDEO.md) explica la línea de tiempo, encuadres, transiciones, audio, exportación MP4/WebM, guardado de proyectos y la retroalimentación aplicada. Incluye un ejemplo real descargado desde el taller en `ejemplos/Juan-demo-completa.mp4`.
