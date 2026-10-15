# Plan compartido: Juan como generador de videos

Revisión de los archivos locales del 14 de octubre de 2026. Este paquete contiene planificación y especificaciones de arte. No contiene nuevos fondos renderizados ni modifica el código del estudio.

## Qué está construyendo Cloudcot

Se consideran aquí sus archivos en `studio/`, los scripts de Blender de la raíz y los últimos cambios encontrados en Git. La atribución se basa en el contexto del usuario y en las carpetas; Git por sí solo no identifica al agente que escribió cada cambio.

| Módulo revisado | Lo que ya contiene el código | Implicación para mi aporte |
|---|---|---|
| `studio/static/director.js` | Texto y diálogo → bloques; elección de paisaje, personajes, objetos, cámara, stickers y sonidos mediante reglas de palabras clave | No construir otro director automático. Es un sistema de reglas, no comprensión narrativa general. |
| `studio/static/blocks.js`, `blocks.html`, `blocks.css` | Compilación de bloques a tiempos, pistas de diálogo/acción/cámara/extras, arrastre de actores, emoción y tamaño, calidad 720/1080, grabación | Tomarlo como editor principal de historias con varios personajes. Lo leído requiere validación visual completa. |
| `studio/static/overlays.js` | Textos, stickers, partículas y efectos sonoros sintetizados | No duplicar stickers ni confeti. Priorizar composición, actuación y continuidad. |
| `studio/static/world.js` | Ocho paisajes, animales, personas y objetos; escala aproximada de Juan de 1,75 m | Mantener sus unidades al diseñar nuevos sets. |
| `studio/static/backgrounds.js` | Fondos pintados; se añadieron Día de Muertos y mercado | No volver a proponer esos dos fondos como novedad. Un fondo pintado y un set 3D son recursos diferentes. |
| `studio/render.py` | Render por fotogramas de la página de texto/voz con WebCodecs/ffmpeg | Actualmente invoca `__juanStudio`, no el montaje completo de `__blocks`. Este es el siguiente trabajo técnico de mayor valor. |
| `scripts/`, `character/` | Pipeline alternativo de Blender y modelo procedural | Conservarlo para pruebas y render; no asumir que ambos modelos tienen el mismo rig. |

También existen mis aportes previos: `Juan.1 ChatGPT/web/` y los módulos `production_*` de `studio/` para biblioteca y SQLite. Revisar esos cambios pendientes antes de editar: el repositorio contiene trabajo simultáneo sin confirmar. No deshacerlo ni presentarlo como código original de Cloudcot.

## Reparto a partir de ahora

**Mi carpeta:** `Juan.2 - Arte y plan/`. Dirección artística, catálogo de sets, especificaciones de recursos, guiones de prueba y revisión de resultados. Cualquier implementación visual que se autorice después comienza aquí, sin modificar archivos del otro agente.

**Carpeta de Cloudcot:** `studio/`. Integración en su editor, compilador, audio, servidor, render y controles. Recibe un prompt concreto y usa mis archivos como entradas.

**Contrato compartido:** catálogo JSON con identificadores estables, metros, eje Y vertical y frente +Z. Registrar por separado fondo 2D, set 3D y objetos interactivos. Un elemento decorativo no se anuncia como interactivo hasta poder seleccionarlo y animarlo.

## Próxima entrega visual propuesta

Seis sets originales descritos en `CATALOGO_SETS.json`: patio de alfarería, cocina de la abuela, azotea del pueblo, estación de tren, ribera con molino y archivo de curiosidades.

Primer set a producir: **patio de alfarería**. Es cercano a la identidad de Juan, permite probar una acción concreta y evita ampliar el catálogo sin resolver la calidad. Llevará zona para caminar, mesa, pieza de barro y luz lateral; separar todos los objetos que deban moverse.

Criterio artístico: conservar la madera tallada, el bigote, la palma, el tejido azul y el pañuelo rojo. La referencia cinematográfica orienta materiales, escala, iluminación y expresividad. No implica copiar sus personajes ni afirmar que el modelo actual tiene ese acabado.

## Orden de integración

1. **Exportar la historia completa.** Adaptar render por fotogramas al editor de bloques, incluyendo todos los diálogos, sonidos, cámara, animales, textos y efectos. Debe coincidir con la previsualización y funcionar con la pestaña cerrada.
2. **Integrar un solo set terminado.** Consumir el catálogo como especificación; implementar `patio_alfareria` en el motor de Cloudcot. Una imagen puede ser un respaldo visual, pero no sustituye el set 3D.
3. **Cerrar una interacción.** Juan toma o entrega una pieza; la mano, el objeto y la mirada se coordinan. No prometer contacto físico por una simple proximidad entre modelos.
4. **Guardar y reabrir.** Usar la biblioteca/SQLite ya existente cuando sea compatible. Identificar proyecto, revisión y recursos; conservar los formatos antiguos y explicar cualquier migración incompleta.
5. **Ampliar a series.** Identidad de Juan y voz consistentes, vestuario y localización registrados por episodio, música/subtítulos por pistas y exportaciones reproducibles.

## Riesgos concretos que Cloudcot debe comprobar

- `autoDirect()` termina con `blocks.slice(0, 80)`. Una narración aceptada de hasta 40 frases puede producir más de 80 bloques al sumar cámara y extras, y perder silenciosamente el final. Conservar todo el diálogo o detenerse con un error que permita corregirlo; recortar primero extras opcionales.
- No equiparar “palabras aprendidas en vocabulario” con aprendizaje de un modelo de IA. Es una tabla de patrones de boca; el personaje aún necesita mejor rig facial.
- Las notas de emoción e intención ayudan a dirigir. No garantizan una emoción percibida ni resultados de audiencia.
- No equiparar calidad 1080 con realismo. Se necesita refinamiento artístico del personaje, materiales, mirada, contacto y fotografía.
- La frecuencia solicitada en MediaRecorder puede diferir de la real. Verificar el MP4 con ffprobe y revisar cuadros; el render por fotogramas debe ser la salida final.
- Las distintas instancias de colas y servidores deben conservar su propio progreso. Verificar los cambios recientes de `--status` y no confundir el progreso de otro proceso con el del usuario.

## Demostración para dar por terminado el siguiente paso

Un corto de 15–20 segundos en 1080×1920: Juan entra al patio, un perro lo mira, Juan muestra una pieza, hay dos voces, un corte de cámara, título, subtítulos y un efecto sonoro. Debe exportar MP4 H.264/AAC completo, poder reabrirse y producir los mismos tiempos. Verificar inicio, mitad y final; ningún diálogo truncado ni objeto que desaparezca por un fallo de exportación.

El prompt listo para entregar está en `PROMPT_PARA_CLOUDCOT.md`.
