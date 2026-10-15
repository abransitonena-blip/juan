# Juan: dirección de stop motion y actuación

## Decisión de producción

Todo se conserva en el proyecto local `juan/Juan.1 ChatGPT/`. No hay plataforma de publicación. Esta carpeta es el módulo de trabajo y la fuente de sus entregables; el ZIP es una copia transportable. Se mantienen separados los archivos originales que está modificando otro agente.

Las pruebas actuales son animación 3D digital con estética de stop motion. No son fotografías de una marioneta física. El objetivo es construir una actuación legible y un lenguaje artesanal antes de invertir en detalle de superficies, vestuario y escenarios.

## Quién es Juan

Juan es un artesano curioso que escucha antes de explicar. Le da satisfacción entender una pieza, arreglarla y compartir lo aprendido. Puede dudar, equivocarse o pedir ayuda. La edad, el sombrero y el acento no definen su inteligencia ni su personalidad.

Su conflicto recurrente: quiere hacerlo todo solo, pero aprende a colaborar. Cada escena debe permitir responder: qué quiere, qué observa, qué interpreta, qué decide y qué cambia. No basta con mover brazos o añadir una sonrisa.

Su firma corporal propuesta: primero orienta la cabeza, después prepara el brazo y finalmente realiza el gesto. En reposo deja los hombros bajos. Cuando comprende algo, sostiene una pausa breve y asiente una sola vez. Son decisiones artísticas de este personaje, no reglas sobre cómo se comporta toda persona.

## Perspectivas psicológicas y traducción a escena

| Perspectiva | Qué aporta | Aplicación propuesta en Juan | Límite |
|---|---|---|---|
| Expresión emocional y reglas culturales de exhibición | Observar familias de movimientos faciales y diferencias de contexto [1] | Separar cejas, mirada, boca y postura; evitar que todas cambien al mismo tiempo | Una cara aislada no permite conocer con certeza un estado interior |
| Percepción contextual de la emoción | El entorno y la situación ayudan a interpretar una expresión [2] | Mostrar la pieza que Juan observa antes de su reacción; comparar una misma pausa con dos situaciones | No equiparar un gesto con un diagnóstico ni tratar las emociones como códigos universales |
| Teoría de la autodeterminación | Autonomía, competencia y vínculo como necesidades estudiadas dentro de este marco [3] | Darle decisiones, tareas que aprende y relaciones donde pide u ofrece ayuda | El arco de Juan es ficción; la teoría no garantiza una reacción del público |

Estas perspectivas se complementan como referencias para escribir y dirigir, aunque no son teorías idénticas. La traducción de cada una a poses, ritmos o paletas es una propuesta creativa del proyecto. No se usan colores como pruebas de personalidad ni se promete inducir emociones específicas.

### Arcos de actuación para la biblioteca

| Estado narrativo | Objetivo de Juan | Cuerpo y ritmo propuestos | Contexto necesario |
|---|---|---|---|
| Curiosidad | Entender la pieza | Cabeza orientada, acercamiento pequeño, pausa de examen | Pieza visible y atención dirigida hacia ella |
| Bienvenida | Reconocer y dar espacio al visitante | Anticipación corta, brazo abierto, saludo lento, espera | Alguien llega fuera de campo |
| Frustración | Resolver un fallo | Intenta, se detiene, suelta tensión y cambia de estrategia | Mostrar el fallo; evitar enfado sin causa |
| Orgullo sereno | Reconocer un logro | Se endereza ligeramente, observa el resultado y lo ofrece | El trabajo terminado debe verse |
| Inseguridad | Decidir si pedir ayuda | Gesto incompleto, pausa, mirada al interlocutor | Debe existir una decisión real |
| Alivio | Descubrir que puede continuar | Descenso de hombros y apertura de la postura | Antes debe haber tensión identificable |

Solo curiosidad y bienvenida se han animado en esta entrega. Los otros cuatro arcos son especificaciones para desarrollo posterior.

## Lenguaje de movimiento

La base de revisión es timing y spacing: cuánto dura una acción y cuánto cambia la pose entre exposiciones [4]. El acabado no debe depender de introducir ruido aleatorio.

- **Cadencia:** salida a 24 fps. En estas pruebas cada pose dura dos fotogramas: 12 poses por segundo. Esto es una elección estética, no una definición obligatoria del stop motion.
- **Anticipación:** antes de levantar la mano, se recoge un poco el brazo. El espectador debe entender hacia dónde irá el movimiento.
- **Arcos:** cabeza y mano describen trayectorias coherentes. Revisar desde la cámara, no solo desde la vista frontal del modelo.
- **Peso:** los pies permanecen apoyados en estas pruebas. Una futura caminata debe separar apoyo, despegue, paso y contacto, con compensación de pelvis.
- **Pausas:** mantener una idea permite leerla. No introducir oscilación continua de cabeza y brazos cuando Juan está pensando.
- **Acción secundaria:** bigote, pañuelo o sombrero pueden retrasarse ligeramente; primero debe funcionar la acción principal. No está implementada todavía esa simulación.
- **Asimetría:** variar mano y hombro según la intención, sin desbalancear el apoyo.
- **Carácter artesanal:** conservar textura y pequeñas diferencias diseñadas. Cámara y exposición estables; no añadir parpadeo o temblor sin motivo.

Para pasar de un movimiento de biblioteca a este estilo: identificar intención, elegir poses clave, corregir apoyos y silueta, reajustar anticipación y pausas, y decidir las exposiciones. Reducir la frecuencia de un clip por sí solo no produce una actuación de stop motion convincente.

## Diseño, materiales y cámara

La referencia conserva valor como objetivo: madera tallada, bigote canoso, sombrero de palma, tela de chaleco y ambiente cálido de taller. El modelo actual es un blockout: faltan escultura facial, arrugas, pelo definido, tejido, costuras y manos más expresivas.

Trabajar primero en silueta y proporciones. Después separar madera, metal de articulación, tela y palma por rugosidad y escala de detalle. La veta debe acompañar la pieza tallada; un ruido uniforme no sustituye una dirección de veta. Mantener variaciones controladas entre objetos, sin cambiar materiales entre fotogramas.

El vestuario sigue siendo removible. El cuerpo base es un maniquí sin detalles íntimos. El atuendo de prueba contiene chaleco simplificado, pañuelo y sombrero; todavía no es un conjunto de ropa completo.

La cámara de prueba permanece fija. Para escenas finales: definir tamaño del plano, espacio para las manos y dirección de mirada; bloquear la puesta antes de elegir lente o profundidad de campo. Evitar que el bigote tape toda la boca y que las manos se fundan con el torso. El tono cálido es una elección de mundo y material, no una afirmación psicológica universal.

## Voz y sonido

Las muestras existentes son voces sintéticas de demostración, separadas del video. No hay clonación ni sincronización labial. Dirigir una frase por intención: escuchar, explicar, bromear o tranquilizar. Comparar velocidad, duración de las pausas y énfasis, además del tono grave o agudo.

Grabar o sintetizar una lectura provisional antes de animar diálogo. Marcar respiraciones, sílabas acentuadas y silencios en la hoja de exposición. Construir visemas y cierres de labios a partir de fonemas y revisar a velocidad real; la apertura por volumen solo sirve como aproximación. Añadir ambientes y efectos de madera por acciones concretas, sin llenar todos los silencios.

## Producción completa: digital y física

| Etapa | Entregable concreto | Criterio para avanzar |
|---|---|---|
| Idea y guion | Objetivo, obstáculo y cambio de Juan | Puede explicarse sin una lista de emociones |
| Referencias | Actuación propia grabada y materiales del taller | Cada referencia responde a un problema concreto |
| Storyboard y animática | Encuadres, duración, audio provisional | La historia se comprende antes del render |
| Marioneta o modelo | Proporciones, articulaciones, cara y ropa | Rango de movimiento suficiente, sin choques evidentes |
| Blocking | Poses clave y apoyos | Silueta y acción legibles sin texturas |
| Hoja de exposición | Fotograma, intención, acción y sonido | Duración y poses coinciden con la toma |
| Animación | Anticipación, gesto, reacción y pausa | No hay deslizamiento o movimiento gratuito |
| Iluminación y captura | Prueba de materiales y exposición | Continuidad entre exposiciones |
| Composición y sonido | Limpieza, edición y mezcla | Ritmo y lectura funcionan con y sin diálogo |
| Entrega | Editable, fuentes, video y manifiesto | Todos los archivos abren y tienen procedencia |

En stop motion físico hacen falta armadura estable, fijación de pies al set, acceso del animador y soportes para poses. Bloquear foco, exposición y balance de blancos; evitar cambios de luz ambiental. Usar comparación de fotogramas y hoja de exposición para continuidad; Dragonframe documenta estas herramientas [5]. Hacer pruebas de resistencia de tela, pintura y articulaciones antes de una toma larga. Planear placas limpias para retirar soportes en composición. Estos pasos físicos se documentan como guía; no se ha construido una marioneta física.

## Pruebas entregadas

`03_curiosidad`: detectar → anticipar → examinar → sostener → comprender → asentir.

`04_bienvenida`: escuchar → reconocer → anticipar → abrir saludo → saludar → invitar → esperar.

Cada toma dura cuatro segundos, 96 fotogramas de salida, con 48 exposiciones distintas. El archivo Blender contiene interpolación constante y marcadores de intención. El CSV registra cada pareja de fotogramas. El motor renderiza una imagen por exposición y el ensamblado la mantiene dos fotogramas; la pose no se interpola entre medias.

## Próximos pasos concretos

1. Corregir parecido y mirada con vistas frontal, lateral y tres cuartos de la referencia.
2. Añadir controles de pupilas y párpados; la prueba actual no tiene seguimiento ocular independiente.
3. Mejorar manos y contactos con objetos; actualmente no hay agarre de la pieza.
4. Preparar un rig humano con IK si se incorporarán caminatas o movimientos de biblioteca.
5. Hacer una escena de diez segundos con un problema y una solución visible antes de ampliar el repertorio.

## Fuentes consultadas

[1] Paul Ekman Group, expresión y contexto cultural: https://www.paulekman.com/resources/universal-facial-expressions/

[2] Barrett y colaboradores, *Context in Emotion Perception*, 2011, artículo desde el laboratorio de las autoras: https://www.affective-science.org/pubs/2011/CD_face_in_context_2011.pdf

[3] Center for Self-Determination Theory, necesidades psicológicas básicas: https://selfdeterminationtheory.org/topics/application-basic-psychological-needs/

[4] Animation Mentor, Jason Martinsen, timing y spacing: https://www.animationmentor.com/blog/tutorial-animate-with-timing-and-spacing-in-mind/

[5] Dragonframe, manual 2024, captura y hoja de exposición: https://www.dragonframe.com/download/Using%20Dragonframe%202024.pdf

[6] Aardman Academy, formación en animación y fabricación de marionetas como referencia de disciplinas de producción: https://academy.aardman.com/

Consulta: 14 de octubre de 2026. Las instrucciones específicas de Juan son diseño original del proyecto, no citas literales ni conclusiones experimentales de estas fuentes.
