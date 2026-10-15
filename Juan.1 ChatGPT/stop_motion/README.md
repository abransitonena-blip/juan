# Stop motion de Juan

Dos nuevas pruebas de actuación digital a doses, con salida a 24 fps. Cada una dura 4 segundos: 96 fotogramas y 48 exposiciones únicas, sin sonido.

| Archivo | Actuación |
|---|---|
| `03_curiosidad.mp4` / `.blend` | Observar una pieza, examinar, comprender y asentir |
| `04_bienvenida.mp4` / `.blend` | Reconocer a alguien, saludar y dejar espacio para responder |

Ver [DIRECCION_ARTISTICA.md](DIRECCION_ARTISTICA.md) para la investigación, fuentes, psicología del personaje, materiales, cámara, voz y proceso físico/digital.

`actuaciones.json` conserva las poses clave en grados y las intenciones. Los CSV `*_xsheet.csv` registran los fotogramas de exposición. Los Blender incluyen controles, animación escalonada y marcadores. No es captura física de marionetas, no hay seguimiento ocular independiente ni sincronización labial.

## Reconstruir

Desde la raíz del proyecto:

```sh
blender -b -t 4 -P 'Juan.1 ChatGPT/stop_motion/crear_pruebas.py'
python3 'Juan.1 ChatGPT/stop_motion/empaquetar.py'
```

El segundo paso requiere ffmpeg y ffprobe; ensambla a 12 exposiciones por segundo, entrega a 24 fps y verifica 96 fotogramas por clip. También actualiza el manifiesto y el ZIP del módulo. Excluye renders intermedios, registros, archivos temporales y copias extraídas del ZIP.
