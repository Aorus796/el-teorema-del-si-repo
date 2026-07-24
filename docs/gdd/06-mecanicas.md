# 6. Mecánicas y sistemas

## 6.1. Principio

La complejidad está en los problemas, no en los controles. El bucle principal es:

> Explorar -> observar -> hablar -> registrar -> formular hipótesis -> probar -> descubrir una conexión -> modificar el mundo.

## 6.2. Controles

| Acción | Principal | Alternativa |
|---|---|---|
| Movimiento | WASD | Flechas |
| Interactuar y confirmar | E | Enter |
| Cancelar | Escape | Retroceso contextual |
| Cuaderno | Q | Tabulador |
| Pausa | Escape | - |

El ratón es opcional. Toda acción obligatoria tendrá equivalente de teclado. El mando queda previsto, no requerido en el primer prototipo.

## 6.3. Movimiento y colisiones

Movimiento libre en cuatro direcciones, sin cuadrícula estricta, energía ni terrenos penalizadores. La velocidad base debe ser cómoda; no se añadirá un botón de correr para compensar un movimiento lento.

Las cajas de colisión coincidirán con lo visible y serán menores que el sprite cuando facilite el paso. No habrá obstáculos invisibles ni NPCs bloqueando rutas importantes.

## 6.4. Interacción contextual

El botón de interacción permite hablar, examinar, leer, recoger, abrir o utilizar. Solo se muestra un indicador contextual a la vez. La prioridad se decide por dirección, distancia y relevancia narrativa.

No todos los elementos decorativos son examinables. Los objetos relevantes se comunican mediante composición, forma, animación o contraste.

## 6.5. Diálogos

Los diálogos incluyen retrato, nombre, texto breve, historial y opciones temáticas. Las elecciones modifican principalmente el tono o la información consultada; no crean ramas argumentales incompatibles.

La velocidad del texto es configurable y las conversaciones importantes pueden repetirse.

## 6.6. Cuaderno

Secciones:

- Investigación.
- Personas.
- Lugares.
- Símbolos.
- Mecanismos.
- Objetos.

El cuaderno registra hechos, testimonios, dibujos y estados observados. No escribe automáticamente conclusiones. Al retomar la partida muestra un resumen limitado a descubrimientos ya alcanzados.

## 6.7. Inventario

Inventario pequeño, sin capacidad ni peso. Incluye objetos narrativos, componentes, herramientas permanentes y evidencias. Los objetos se usan de forma contextual; no se arrastran indiscriminadamente sobre el escenario.

Herramientas posibles:

- Cuaderno.
- Lente del observatorio.
- Pieza de calibración.
- Tiza o marcador.

Cada herramienta permanente debe reutilizarse.

## 6.8. Modelo de puzles

Todo puzle define objetivo, reglas, información, acciones, estados, validación, respuesta ante errores, reflexiones, reinicio, consecuencia y persistencia.

Familias de interacción:

- Selección.
- Reordenación.
- Configuración de mecanismos.
- Navegación espacial.
- Interpretación documental.
- Introducción de códigos.
- Deducción controlada.
- Observación ambiental.

## 6.9. Respuestas y validación

Las respuestas abiertas aceptan mayúsculas, tildes opcionales y variantes previstas. La retroalimentación indica reacciones o contradicciones, pero no permite resolver por fuerza bruta confirmando componentes individuales.

No existe muerte ni derrota global. Los errores son reversibles, las pistas descubiertas no se pierden y no se repiten conversaciones extensas.

## 6.10. Reflexiones

Tres niveles manuales y sin coste. El juego no interrumpe al jugador por tardar horas o días. Las reflexiones se integran como observaciones del protagonista, recomendaciones de Silogio o mensajes de la novia.

## 6.11. Estados del mundo

El estado global incluye fase narrativa, banderas, inventario, cuaderno, accesos y puzles. Los estados locales guardan agua, puentes, flores, rotación, máquinas, libros y atajos.

## 6.12. Guardado

- Automático al cambiar de zona, obtener una pista, resolver un puzle o abrir un atajo.
- Manual desde el menú cuando no existe una secuencia crítica.
- Varias ranuras y copia automática de seguridad.
- Persistencia de anotaciones y descartes dentro de puzles complejos.

## 6.13. Accesibilidad

- Tamaño y velocidad de texto.
- Tipografía legible.
- Contraste y contornos.
- Reducción de destellos, partículas y cámara.
- Indicadores visuales para sonido.
- Formas y patrones además de color.
- Historial y relectura.
- Ausencia de límites temporales.

No habrá modos Fácil, Normal y Difícil. La dificultad se regula mediante reflexiones, no mediante versiones empobrecidas de los acertijos.
