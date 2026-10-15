# Juan: revisión compartida de producción

La función del producto es generar videos terminados. El visor y la edición son pasos de ese flujo. Esta revisión acompaña implementaciones reales; no equivale a que todas las siguientes capacidades estén resueltas.

## Integración que ya existe

Abrir `Abrir producción de Juan.command` en la raíz. Un servidor ofrece:

- `/production.html`: biblioteca, proyectos, serie/temporada/episodio, guion y continuidad.
- `/web/`: dirección de escenas 3D con objetos, animales, cámaras, 35 gestos, iluminación por toma y grabación del montaje.
- `/`: texto, voz, visemas y render rápido.
- `/blocks.html`: acciones, personajes y diálogos por bloques.

Los tres editores comparten `production-bridge.js`: guardar versión, guardar copia, abrir desde biblioteca y conservar el video completo como recurso. Sus formatos de proyecto se mantienen distintos: **una película v3 no se convierte automáticamente en bloques ni en un trabajo de texto**. Evitar ofrecer esa conversión hasta implementar y probar la equivalencia de cámaras, trayectorias, voces y tiempos.

SQLite está en `studio/data/production.sqlite3`. Medios en `studio/data/media`. No subir la base de datos al repositorio. Las revisiones son inmutables, las actualizaciones usan `expectedRevision` y una transacción: dos agentes no deben sobrescribir un proyecto silenciosamente. Archivar es reversible. Respaldar la carpeta de datos con el servidor cerrado, o usar la API `sqlite3.Connection.backup` si está abierto; copiar solamente el `.sqlite3` mientras hay WAL activo puede omitir cambios recientes.

Las notas de intención, identidad y ritmo **orientan a la persona que dirige**. No generan actuaciones psicológicas ni garantizan retención en redes por sí solas. Evitar presentar inferencias emocionales como diagnósticos. Para cada acción definir: objetivo, atención/mirada, anticipación, acción, reacción y pausa. Mostrar un gesto concreto antes que añadir movimiento continuo sin intención.

## Revisión del render existente

El render de voz ya produce MP4 con audio y reportes. Se añadió una huella de fuentes del renderer, avatar, movimientos y vocabulario al nombre de caché, junto con fps/calidad/códec. Así un cambio visual no recupera silenciosamente una exportación anterior. El informe registra `renderer_version`. Sigue pendiente:

1. Estado durable de cada trabajo y su proceso, cancelación, reintento y progreso por fotograma. `queue-status.json` sigue siendo estado de la última cola, no un historial completo; varias instancias pueden competir por ese archivo.
2. Escribir a archivo temporal y renombrar solamente tras verificar audio/video/duración. Un fallo a mitad del MP4 no debe parecer una salida final.
3. Validación adicional de resolución, cuadros faltantes, silencio, clipping, subtítulos fuera de área y coincidencia entre revisión y render.
4. Render por fotogramas del montaje 3D y de bloques. La captura MediaRecorder depende del rendimiento y la pestaña visible; 24 fps es el objetivo, no una garantía.
5. Conservar audio importado asociado a cada toma, mezcla multipista, fundidos, música con volumen reducido bajo diálogo y exportación de subtítulos por palabra. El SRT del editor 3D usa tiempos por toma.

## Para que Juan se vea único y más cercano a la referencia

La imagen cinematográfica aportada orienta iluminación, composición y expresividad; el avatar actual es un modelo geométrico estilizado. Más opciones en un menú no sustituyen estos trabajos:

| Trabajo | Resultado necesario | Estado |
|---|---|---|
| Escultura y topología del rostro | Silueta, nariz, pómulos, bigote y asimetrías propias de Juan | Pendiente de refinamiento artístico |
| Materiales PBR | Mapas de color, normal y rugosidad de madera, tejido y palma a escala coherente | Texturas procedurales de base existentes |
| Rig facial | Párpados, mirada conjunta, mandíbula y formas de boca con transiciones | Cejas y boca aproximada; visemas en estudio de voz |
| Actuación corporal | IK de manos/pies, apoyo sin deslizamiento y contacto con objetos | Articulaciones y trayectorias; sin IK/contacto físico general |
| Fotografía | Luz principal, relleno, contraluz, exposición y lente por toma | Cuatro perfiles y campo de visión implementados en editor 3D |
| Continuidad de serie | Mismo modelo, vestuario, voz, proporciones y reglas de comportamiento | Notas y revisiones guardadas; no bloqueo automático de identidad |
| Render final | Muestreo, sombras, color, ruido y revisión de fotogramas | WebGL actual y exportación de toma GLB a Blender; no servicio automático de render cinematográfico |

Prioridad recomendada: refinar un solo Juan, una interacción convincente con la moneda y una toma con iluminación cuidada; luego ampliar catálogo de actores. Definir un contrato versionado para rigs, nombres de huesos, morph targets y unidades antes de reemplazar el modelo compartido: `createJuan()` es consumido por ambos estudios.

## Contratos y fuentes consultadas

- glTF sirve para intercambiar materiales PBR, transformaciones, animaciones y morph targets: [especificación Khronos](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), [PBR de Khronos](https://www.khronos.org/gltf/pbr). Su archivo no define por sí mismo el comportamiento de una aplicación ni la mezcla de voces.
- Los formatos verticales del taller son presets de exportación; no implican publicación ni aprobación de plataformas. La integración futura de TikTok requiere su flujo de autorización, auditoría y límites vigentes de la cuenta: [Content Sharing Guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines).

## Verificación de esta entrega

`python3 -m unittest discover -s studio -p test_production.py -v` prueba revisiones, recuperación, conflicto entre dos escrituras simultáneas, archivo/restauración y asociación de medios. Los tests JS de movimientos y escenas siguen pasando. En el navegador se creó el piloto de tres mundos, se guardaron versiones y se generó y guardó un MP4 vertical 1080×1920 con H.264 y AAC. Su frecuencia real depende del equipo: no confundir fps solicitados con fps entregados.
