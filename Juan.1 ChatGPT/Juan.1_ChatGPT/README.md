# Juan.1 ChatGPT

Versión independiente; no modifica el trabajo del otro agente.

Prototipo 3D procedural inspirado en la referencia: maniquí de madera articulado con bigote, ojos y cejas. La semejanza es aproximada; no es una reconstrucción fiel ni un modelo final de cine.

## Entregables

- `01_saludo_madera.blend`: modelo sin ropa, sin anatomía íntima, animación de saludo.
- `02_baile_atuendo.blend`: baile con sombrero, chaleco y pañuelo.
- Dos GLB animados para compartir el modelo.
- Carpeta `poses/` con ocho escenas Blender ya posadas.
- Dos MP4 de tres segundos, 24 fps, vista previa 288 × 384.
- Dos voces sintéticas españolas de macOS, cálida y grave; no imitan la voz de una persona.
- `poses.json`: reposo, saludo, presentar, pensar, brazos abiertos, celebrar, inclinar, paso.
- `apply_pose.py`: aplica cualquiera de las ocho poses a un archivo Blender.
- Los objetos `ATUENDO_*` se pueden ocultar independientemente.

## Editar

Los controles son objetos vacíos jerárquicos: Raiz, Torso, Cabeza, Brazo_L/R, Codo_L/R, Pierna_L/R y Rodilla_L/R. Rotarlos mueve las piezas rígidas. No incluye esqueleto humano deformable, IK ni retargeting automático. Las animaciones están horneadas cada fotograma. La ropa sigue los controles.

Ejemplo desde esta carpeta:

```sh
blender -b 01_saludo_madera.blend -P apply_pose.py -- pensar
```

`build.py` reconstruye y renderiza ambos clips; requiere Blender. Las voces son muestras separadas, sin sincronización labial.

## Stock motions: investigación

Mixamo permite aplicar y editar movimientos sobre personajes bípedos, con cuenta Adobe. Su documentación explica el uso royalty free en proyectos personales y comerciales:

- https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
- https://helpx.adobe.com/creative-cloud/help/animate-characters-mixamo.html

Los dos clips incluidos son movimientos procedurales originales creados aquí; no se descargaron ni se incorporaron archivos de Mixamo. Para usar esa biblioteca habrá que crear un rig humano compatible y ajustar los movimientos.

## Publicación

Pendiente de conocer el destino de subida. El ZIP reúne los archivos editables, clips, voces, imágenes y scripts.
