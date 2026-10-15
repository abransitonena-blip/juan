# Prompt listo para copiar

Estamos trabajando en el mismo proyecto local `/Users/cheeeperez/juan`. La función central de la app es generar videos completos de Juan para TikTok, Instagram y futuros episodios. ChatGPT revisó tu avance y preparó una carpeta separada de dirección artística. Continúa tu implementación en `studio/` y respeta el trabajo simultáneo que ya existe.

Lee primero:

1. `/Users/cheeeperez/juan/Juan.2 - Arte y plan/PLAN_COMPARTIDO.md`
2. `/Users/cheeeperez/juan/Juan.2 - Arte y plan/CATALOGO_SETS.json`
3. `/Users/cheeeperez/juan/studio/RETROALIMENTACION_PRODUCCION.md`

Tu director automático, bloques, pistas, emociones, stickers, sonidos y fondos nuevos ya son parte de la base. No los reconstruyas. Revisa el estado actual del repositorio antes de editar y conserva los cambios sin confirmar de ambos agentes. La carpeta `Juan.2 - Arte y plan/` es el aporte de arte de ChatGPT: consúmela como especificación, sin editarla. El catálogo describe sets pendientes de modelado, no recursos ya terminados.

**Primera prioridad: renderizar el montaje completo de bloques fuera de tiempo real.** `studio/render.py` actualmente invoca `window.__juanStudio`, mientras la historia con animales, diálogos y extras vive en `window.__blocks`. Implementa un adaptador por fotogramas para bloques, reutilizando su compilación y composición visual. Incluye todas las voces, sonidos sintetizados, cámara, actores, objetos, textos, subtítulos y efectos. La salida debe funcionar sin mantener visible la pestaña. No conviertas el montaje en un monólogo ni elimines extras silenciosamente para exportarlo.

**Segunda prioridad: integrar un set con calidad.** Implementa `patio_alfareria` a partir del catálogo: geometría 3D, suelo, luz lateral, mesa y jarra seleccionables con pivotes y anclas propias. Respeta la escala existente de `world.js`. Añade un ejemplo de 15–20 segundos: Juan entra, un perro lo mira, Juan muestra una pieza, hay dos voces, un cambio de plano, título, subtítulos y un sonido. Mantén a Juan reconocible por su rostro, madera, bigote, sombrero, chaleco azul y pañuelo rojo.

Antes de ampliar el catálogo, resuelve estos puntos:

- En `director.js`, evita que `blocks.slice(0, 80)` trunque diálogos o el cierre. Conserva el contenido narrado o muestra un error corregible; comprueba un texto largo con muchos extras.
- Guarda proyecto, revisión y recursos usando los módulos `production_*` ya presentes cuando encajen con tu editor. No crees otra biblioteca independiente. Mantén compatibilidad con los proyectos anteriores y declara los límites de conversión.
- Revisa los cambios recientes de caché y progreso de render: cada cola debe identificar su propio estado. Escribe el video temporalmente y publica el MP4 final solo tras verificarlo.
- No presentes las reglas de palabras clave como una IA que entiende cualquier historia. Permite corregir las decisiones generadas en los bloques.

**Criterio de entrega:** proyecto editable que se guarda y reabre; MP4 vertical de 1080×1920 con H.264 y AAC; duración, audio, resolución y fotogramas revisados con ffprobe; muestra visual de inicio, mitad y final; coincidencia entre previsualización y exportación; sin diálogos perdidos. Distingue funciones implementadas y probadas de pendientes. Si el agarre o contacto aún es aproximado, dilo y no lo presentes como física resuelta.

Entrega el ejemplo exportado y un resumen breve de archivos cambiados, verificaciones y límites reales. Primero cierra este recorrido completo; después incorpora los otros cinco sets.
