# Juan — personaje 3D para videos de 1 minuto

Pipeline 100% gratuito y local:

| Paso | Herramienta | Script |
|------|-------------|--------|
| Modelo 3D + ropa + visemas | Blender (headless) | `scripts/juan_build.py` |
| Voz (es/zh/en) | edge-tts (voces Microsoft gratuitas) | `scripts/make_episode.py` |
| Movimiento de boca | envolvente de audio → forma de boca `AI` | `scripts/make_episode.py` |
| Render de frames + video | Blender Eevee + ffmpeg | `scripts/render_episode.py` |

## Uso

```bash
# 1. Construir a Juan (una vez, o al cambiar character/juan.json)
blender -b -P scripts/juan_build.py -- character/juan.blend

# 2. Generar audio y línea de tiempo del episodio
python3 scripts/make_episode.py scripts/episodes/demo.json

# 3. Vista previa rápida (540x960, 2 segundos)
blender -b character/juan.blend -P scripts/render_episode.py -- output/demo/timeline.json --preview

# 4. Episodio completo 1080x1920
blender -b character/juan.blend -P scripts/render_episode.py -- output/demo/timeline.json
```

## Cambiar atuendo

Editar `character/juan.json` (sección `outfits`) y reconstruir, o cambiar la clave
`"outfit"` en el episodio (`default`, `fiesta`, `work`).

## Estado

- Modelo: blockout procedural (primitivas). Funciona para probar pipeline, cambio de
  ropa y boca. **No es todavía la calidad de las imágenes de referencia.**
- Boca: solo apertura según volumen (una forma de boca). Visemas completos requieren
  alineación de fonemas (p. ej. Rhubarb Lip Sync, gratuito).
- Guiones: pendiente — `scripts/episodes/*.json` con líneas `{lang, text}`.
