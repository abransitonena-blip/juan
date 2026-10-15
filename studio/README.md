# Estudio de Juan · texto → voz → video

Web local (127.0.0.1) que complementa el avatar de `Juan.1 ChatGPT`. Escribes un texto, Juan lo dice con boca sincronizada y se graba un video con fondo, subtítulos y el formato que elijas. Todo gratis y sin cuentas.

## Abrir

Doble clic en `Abrir estudio.command`, o:

```sh
python3 studio/server.py        # http://127.0.0.1:8800/
```

Requiere `pip3 install edge-tts` (la voz usa las voces neuronales gratuitas de Microsoft Edge; **necesita internet** para generar cada audio nuevo, y se guarda en `studio/cache/`).

## Qué hace

- **Voz:** 7 voces (español México/España/Argentina, chino mandarín, inglés) y 3 velocidades. El servidor devuelve el audio y el tiempo de cada palabra.
- **Boca por palabra:** cada palabra se convierte en una secuencia de formas de boca (vocales abiertas/redondas, labios cerrados en m/b/p/v, dientes en f…) repartidas según el tiempo real de la palabra. Las palabras que Juan dice se **aprenden solas** en `vocab.json`; si una se ve mal la corriges en el panel «Vocabulario de la boca» (ver la boca, guardar, volver al automático) y todos los videos usan tu corrección. Cada video revisa que cada palabra mueva la boca y reporta las que no.
- **Subtítulos:** por frase, con los tiempos reales de cada palabra (si el conteo coincide con la voz; en chino se reparten por longitud).
- **Movimiento:** el texto se divide en frases y se agrupan en tomas de ≥ 3,5 s; cada toma usa un gesto de la biblioteca de ChatGPT (saludo, explicar, curiosidad, despedida…) y la cámara alterna cuerpo completo / retrato.
- **Fondos:** taller, plaza, noche con luna, papel picado, crema, verde chroma y tu propia imagen.
- **Formatos:** vertical 720×1280, horizontal 1280×720, cuadrado 720×720 y presets de plataforma: `tiktok`, `reels`, `shorts` (1080×1920), `youtube` (1920×1080), `instagram` (1080×1350, 4:5). Atuendos: artesano, fiesta, solo madera.
- **Lotes:** una línea por video (`voz | atuendo | fondo | texto`); graba y descarga uno tras otro (en tiempo real). Para volumen usa la cola rápida de abajo.

## Cómo se integra con el módulo de ChatGPT

El servidor sirve **en solo lectura** `Juan.1 ChatGPT/web` bajo `/web/` y reutiliza su `avatar.js` y `motions.js` (por eso, si ese avatar mejora, el estudio mejora solo). No se modifica ningún archivo de esa carpeta.

## Editor de bloques (`/blocks.html`): escenas con paisajes, animales, personas y objetos

Guion en bloques editables, como piezas de Scratch: cada bloque es una acción y el orden es el orden del video. Se reordenan con ↑ ↓ o arrastrando, se duplican o se quitan, y el proyecto se guarda solo en el navegador (también se exporta/importa como `.juan.json`).

| Bloque | Qué hace |
|---|---|
| 🏞 Escena | Paisaje y momento del día (día, atardecer, noche). |
| ➕ Aparece | Un animal, una persona o un objeto, con nombre y posición en metros. |
| 🗣 Dice | Quién habla, con qué voz y velocidad; la boca sigue las palabras y se muestran subtítulos. |
| 🤸 Gesto | Una acción: las 35 de Juan, o las propias de cada animal/persona (ladrar, volar, celebrar, agacharse…). |
| 🚶 Se mueve | Camina a otro punto; gira hacia donde va. |
| 🐾 Interactúa | Acaricia, da su objeto (la moneda pasa de una mano a otra), saluda, sigue o mira a otro personaje. |
| 🎒 Sostiene | Pone un objeto en la mano; los dedos de Juan se cierran sobre él. |
| 👕 Atuendo de Juan | Ropa (artesano, fiesta, solo madera) y sombrero. |
| 🎥 Cámara | Plano general (encuadra a todos), medio, retrato o «sigue al que habla». |
| ⏱ Espera | Pausa. Los bloques con «al mismo tiempo» empiezan junto con el anterior. |

**Catálogo** (`world.js`, todo procedural y a escala: Juan ≈ 1,75 m, 1 m = 1,786 unidades):
- 8 paisajes 3D (pueblo mexicano, campo y milpa, desierto, playa, montañas y lago, bosque/selva, mercado, taller) y 4 fondos pintados (plaza, papel picado, crema, chroma).
- 5 animales (perro, gato, burro, gallina, loro) y 5 personas (niña, niño, vendedora, músico, abuela) articulados: cabeza, mandíbula, patas/alas/cola, brazos con codos, piernas con rodillas.
- 10 objetos (moneda, alcancía, guitarra, canasta de frutas, libro, farol, maceta, regalo, balón, globo).
- Articulación extra de Juan sin tocar su `avatar.js`: parpadeo, giro de cabeza hacia quien habla o mira, muñecas al explicar y agarre de los dedos.

### Un texto → escena lista

Arriba a la izquierda del editor, escribe un texto simple, o un diálogo con líneas `Nombre: texto`, y pulsa **✨ Crear escena y prepararla**. `director.js` decide por palabras clave el paisaje y el momento del día (playa, mercado, noche…), añade los animales y personas mencionados (en un diálogo, un personaje por cada hablante, cada uno con su voz), reparte gestos y planos de cámara (en diálogos «sigue al que habla»), pone stickers y sonidos (🪙 y «ding» al hablar de monedas, 💰, 🇨🇳…) y cierra con aplauso y confeti o lluvia de monedas. Todo queda como bloques que puedes editar.

### Bloques de presentación y carisma

- 🔤 **Texto en pantalla** (título grande, subtítulo, etiqueta con nombre, tarjeta de «dato curioso»), 😀 **Sticker** (22 emojis, 9 lugares, 3 tamaños, 4 animaciones), 🎊 **Efecto** (confeti, lluvia de monedas, corazones, destellos), 🔊 **Sonido** (moneda, aplauso, campana, pop, whoosh, fanfarria; sintetizados, sin archivos).
- 🎭 **Emoción de Juan** (feliz, sorprendido, triste, pensativo, enojado, travieso): cejas, boca y cabeza. Además se deduce sola del texto (`!` → feliz, `?` → pensativo). Juan asiente al enfatizar palabras largas y tiene pequeños movimientos de reposo.
- 🔍 **Cambia de tamaño** (cualquier personaje, ×0,3 a ×3, con transición) y campo **Tamaño** al hacer aparecer a alguien.
- **Línea de tiempo visual** bajo la vista previa (voz, acciones, cámara, extras) con cabezal; al pulsar un segmento salta a ese instante.
- **Arrastrar personajes** sobre la escena para colocarlos (cambia su posición inicial; funciona con el control de tiempo antes de su primer movimiento).
- **Formatos:** vertical 9:16, horizontal 16:9, cuadrado 1:1 y retrato 4:5, en calidad normal (720p) o alta (1080p, pesa más).

Dos ejemplos listos («Juan y el perro», «Un día en el mercado»). La grabación es en tiempo real; la cola rápida de abajo todavía no entiende los bloques.

## Cola rápida (render sin pestaña, más rápido que tiempo real)

```sh
pip3 install playwright          # usa tu Google Chrome instalado; no descarga navegadores
python3 studio/render.py studio/jobs.example.json
```

`jobs.json` es una lista de trabajos; solo `text` es obligatorio: `voice` (jorge, dalia, alvaro, tomas, yunxi, xiaoxiao, guy), `outfit` (artesano, fiesta, madera), `background` (taller, plaza, noche, fiesta, crema, chroma), `format` (portrait, landscape, square, tiktok, reels, shorts, youtube, instagram), `camera`, `captions`, `hat`, `coin`, `rate`, `name`, `music` (archivo en `studio/music/`), `music_volume`. `voice`/`outfit`/`background`/`camera` aceptan `"random"` (siempre el mismo valor para el mismo trabajo). Cada MP4 se nombra por el hash del trabajo: si lo repites, **se salta** lo ya hecho (reanuda colas largas; `--force` lo rehace) y lleva un `.report.json` con palabras nuevas/corregidas/a revisar y la verificación del archivo (duración y pistas de audio+video). Los MP4 salen en `studio/output/` y el avance en `studio/output/queue-status.json`. También se lanza desde la web («Cola rápida»), que acepta líneas `voz | atuendo | fondo | texto` o ese mismo JSON. Un trabajo que falla no detiene la cola.

**Cómo funciona (opción elegida):** Chrome headless dibuja cada cuadro con `drawFrame(t)` (mismo avatar, fondo y subtítulos que la web), lo codifica con `VideoEncoder` de WebCodecs (H.264 por hardware) y `ffmpeg` solo empaqueta ese flujo con el mp3 de `cache/` (sin recodificar, sin muxer JS ni CDN).

**Medición** (Mac con GPU Apple, 5 videos de 33–60 s con 4 voces, 3 formatos y 3 fondos, 266,5 s de video en total):

| Método | Velocidad |
|---|---|
| Grabación en vivo (MediaRecorder) | 1,0× |
| Headless + JPEG por cuadro + libx264 en ffmpeg | 4,3× |
| **Headless + WebCodecs + ffmpeg (elegido)** | **4,2–5,5×** (266,5 s de video en 49–64 s según la carga de la máquina) |
| Igual con 3 procesos en paralelo (JPEG) | 3,6× (peor: la GPU es el cuello de botella) |

Un video de ~1 min tarda ~10–13 s a 720p; mil videos de 1 min ≈ 3–4 horas. Los presets de 1080p son más lentos (no medidos con videos de 1 min). Es 1 proceso por defecto (`--workers`); más procesos no ayudaron en esta máquina.

## Cues: cosas que pasan cuando Juan dice una palabra

Cada trabajo de la cola acepta `"cues"` y `"cinema": true` (viñeta de cine). Un cue se dispara con `{"on":"palabra","nth":1}` (la palabra hablada) o `{"at":segundos}` y hace una cosa: `hat` (`tip` se toca el sombrero, `pop` salta, `toss` lo lanza y lo atrapa, `wobble`), `flower: true` (florecita 3D de cempasúchil en el sombrero desde ese momento), `bg` (cambia de fondo con fundido), `fx` (`petalos`, `confeti`, `estrellas`, `brillo`), `icon` (`flor`, `calavera`, `moneda`, `luna`, `corazon`, `estrella`, `vela`, con `pos:[x,y]`), `cam` (`punch`, `push`, `shake`) y `title` (tarjeta de título de película). Ejemplo completo: `jobs.cine-3-videos.json`. Si una palabra del cue no aparece en el texto, el `.report.json` la lista en `cues_missing`. Fondos nuevos: `muertos`, `mercado`, `biblioteca`, `espacio`. El sombrero animado y la flor son de este estudio: la web de ChatGPT solo muestra u oculta el sombrero.

## Límites conocidos

- La cola necesita **Google Chrome** y GPU (con WebGL por software, SwiftShader, es ~100× más lento) y **ffmpeg**; WebCodecs H.264 es un requisito. `--codec jpeg` es el plan B sin WebCodecs.
- La voz de cada texto nuevo **necesita internet** (edge-tts); los textos repetidos salen de `cache/`. No hay límite de uso documentado, pero miles de textos nuevos pueden toparse con límites del servicio de Microsoft.
- **Corrección:** la primera versión de la cola generaba MP4 **sin audio** (no se había verificado); ya está arreglado y cada video se verifica con ffprobe (duración y pistas) antes de darlo por bueno.
- La boca se mueve con reglas de ortografía española (no fonemas reales): inglés y chino salen aproximados hasta que corrijas palabras en el vocabulario. El modelo del avatar solo tiene una boca que se abre y ensancha, no forma «O» ni dientes.
- Los MP4 pesan ~0,7 MB por segundo (≈40 MB por minuto, bitrate 6 Mbps fijo): mil videos son ~40 GB.
- 24 fps fijos. Los fondos «Mi imagen…» no están disponibles en la cola.
- La grabación en vivo de la pestaña sigue funcionando pero va a **tiempo real** (24 fps) y requiere la pestaña visible.
- La boca no distingue vocales; los subtítulos se reparten por longitud de texto, no por palabra.
- Una sola voz por video (un texto en chino con voz española sonará mal).
- Probado: cola de 5 trabajos desde la línea de comandos (5 MP4 válidos, H.264+AAC, duración correcta) y desde la web (`/api/queue`), formatos vertical/horizontal/cuadrado. **No probado:** colas de miles, otros ordenadores/GPU, Safari/Firefox, ni la interfaz web de la cola en el navegador (solo el API).
