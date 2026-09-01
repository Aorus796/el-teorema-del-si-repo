# P2 — El paseo imposible

## Especificación funcional del primer prototipo

**Proyecto:** El Teorema del Sí
**Tipo:** Prototipo de puzle
**Versión:** 0.1
**Estado:** Aprobado para prototipo en papel
**Dificultad objetivo:** 3/5
**Duración estimada:** 10–25 minutos

---

## 1. Objetivo del prototipo

Este prototipo validará los primeros sistemas complejos del juego:

* Representación de un grafo mediante un entorno físico.
* Selección de una conexión que debe cerrarse.
* Movimiento del jugador por una red.
* Seguimiento de conexiones utilizadas.
* Detección de recorridos válidos e inválidos.
* Reinicio inmediato.
* Aceptación de cualquier solución matemáticamente válida.
* Persistencia del estado al abandonar el puzle.
* Integración con diálogo, cuaderno y sistema de reflexiones.

El objetivo no es producir todavía la zona artística definitiva del Barrio de los Puentes.

---

## 2. Contexto narrativo

La novia fue vista atravesando el Barrio de los Puentes.

Maestro Nodo afirma que recorrió todos los puentes que estaban abiertos exactamente una vez, comenzando en la entrada del barrio y terminando junto al camino del molino.

El problema es que el mapa actual no permite reproducir ese recorrido.

Uno de los puentes estaba cerrado cuando ella pasó.

El jugador deberá determinar cuál era y reconstruir un recorrido posible.

---

## 3. Objetivo mostrado al jugador

> Cierra el puente que no estaba disponible y cruza todos los puentes restantes exactamente una vez. Empieza en la entrada y termina junto al molino.

---

## 4. Mapa lógico

> **Nota histórica.** La topología concreta, los grados y la solución que se
> describen de aquí en adelante corresponden al prototipo original, vigente en
> `v1.0.0` y `v1.1.0`. En `v1.2` el puzle se recableó (B5 dejó de unir
> Mercado-Molino para unir Entrada-Mercado), con lo que la solución pasó a ser
> cerrar B6 (N-L) y los recorridos de ejemplo de este documento dejaron de ser
> válidos. Este documento se conserva como registro del prototipo y no se
> actualiza cifra a cifra: la topología vigente es la de
> `src/puzzles/p2-bridges/P2Graph.js`, descrita en el GDD (§7.5), y el motivo
> del cambio está en el `CHANGELOG.md`.

### Nodos

| ID | Localización      | Función                   |
| -- | ----------------- | ------------------------- |
| E  | Entrada           | Punto inicial obligatorio |
| N  | Isla de Nodo      | Zona de Maestro Nodo      |
| R  | Isla del Reloj    | Intersección principal    |
| M  | Mercado           | Zona intermedia           |
| L  | Camino del Molino | Destino obligatorio       |

### Conexiones

| ID | Conexión |
| -- | -------- |
| B1 | E–N      |
| B2 | E–R      |
| B3 | N–R      |
| B4 | R–M      |
| B5 | M–L      |
| B6 | N–L      |
| B7 | R–L      |

### Diagrama

```text
        N
      / | \
     E--R--L
        | /
        M
```

Conexiones exactas:

```text
E-N
E-R
N-R
N-L
R-L
R-M
M-L
```

---

## 5. Análisis matemático

### Grados iniciales

| Nodo | Grado |
| ---- | ----: |
| E    |     2 |
| N    |     3 |
| R    |     4 |
| M    |     2 |
| L    |     3 |

Los nodos impares son:

* N
* L

Por tanto, con todos los puentes abiertos existe un recorrido euleriano que comienza en N y termina en L, o viceversa.

Sin embargo, el recorrido solicitado debe comenzar en E y terminar en L.

Para que eso sea posible, los únicos nodos de grado impar deben ser E y L.

### Puente que debe cerrarse

Cerrar una conexión cambia la paridad de sus dos extremos.

Para convertir:

```text
N y L
```

en:

```text
E y L
```

es necesario cambiar la paridad de N y E.

La única conexión cuyos extremos son E y N es:

```text
E–N
```

### Solución estructural única

El puente que debe cerrarse es:

**B1 — E–N**

Ningún otro puente cerrado genera exactamente los nodos impares E y L.

---

## 6. Recorridos válidos

Después de cerrar E–N, permanecen estos seis puentes:

```text
E-R
N-R
N-L
R-L
R-M
M-L
```

Un recorrido válido es:

```text
E → R → N → L → R → M → L
```

Puentes utilizados:

1. E–R
2. R–N
3. N–L
4. L–R
5. R–M
6. M–L

Cada puente se utiliza exactamente una vez.

El recorrido:

* Comienza en E.
* Termina en L.
* Utiliza todas las conexiones disponibles.
* No repite ninguna conexión.

### Regla de validación

El prototipo no comprobará una secuencia concreta.

Aceptará cualquier recorrido que cumpla todas las condiciones.

---

## 7. Fases del puzle

### Fase 1 — Investigación

El jugador puede:

* Hablar con Maestro Nodo.
* Consultar el mapa.
* Examinar los puentes.
* Consultar testimonios.
* Revisar el cuaderno.

Todavía puede moverse libremente por la zona.

### Fase 2 — Selección del puente cerrado

Desde el mapa o una compuerta de control, el jugador selecciona un único puente para marcarlo como cerrado.

Solo puede cerrarse un puente por intento.

### Fase 3 — Recorrido

El protagonista aparece en E.

Al cruzar un puente:

* Queda marcado como utilizado.
* No puede volver a cruzarse durante ese intento.
* Se actualiza el mapa.
* Se actualiza el contador de puentes restantes.

### Fase 4 — Validación

El intento termina cuando:

* Se utilizan todos los puentes.
* El jugador llega a un nodo sin movimientos disponibles.
* Intenta finalizar manualmente.
* Reinicia el recorrido.

### Fase 5 — Resolución

El puzle se considera resuelto cuando:

* El puente cerrado es E–N.
* El recorrido empieza en E.
* Termina en L.
* Utiliza todos los puentes abiertos.
* No repite conexiones.

---

## 8. Estados funcionales

### Estado general

```text
NOT_DISCOVERED
DISCOVERED
PLANNING
TRAVERSING
FAILED
SOLVED
```

### Estado persistente

```text
selectedClosedBridge
currentNode
usedBridges
visitedNodes
attemptCount
hintsRead
isSolved
```

### Estado que debe conservarse al salir

Durante planificación:

* Puente seleccionado.
* Reflexiones consultadas.
* Observaciones del cuaderno.

Durante recorrido:

* Se recomienda conservar también el intento actual.
* El jugador podrá retomarlo exactamente donde lo dejó.

---

## 9. Reglas de interacción

### Seleccionar puente

* Solo un puente puede estar cerrado.
* Seleccionar otro reabre el anterior.
* El puente cerrado debe identificarse visualmente.
* El cambio debe poder deshacerse antes de iniciar el recorrido.

### Iniciar recorrido

Solo se permite cuando existe un puente seleccionado.

El protagonista comienza siempre en E.

### Cruzar puente

Una conexión puede cruzarse desde cualquiera de sus extremos.

Después de utilizarla:

* Se bloquea para ese intento.
* Cambia su apariencia.
* Permanece visible.

### Visitar nodo

Los nodos pueden visitarse varias veces.

La restricción afecta a los puentes, no a las localizaciones.

### Finalizar

El sistema valida automáticamente cuando ya se utilizaron todas las conexiones abiertas.

---

## 10. Condiciones de fallo

### Callejón sin salida

El jugador llega a un nodo sin puentes disponibles y todavía quedan conexiones sin utilizar.

Respuesta:

> “Todavía quedan puentes sin recorrer.”

### Destino incorrecto

Utiliza todos los puentes, pero termina en un nodo diferente de L.

Respuesta:

> “El recorrido está completo, pero la novia terminó junto al molino.”

### Inicio incorrecto

No debería ser posible, porque el sistema coloca al protagonista en E.

### Puente cerrado incorrecto

El recorrido terminará siendo imposible o finalizará en un punto incorrecto.

El juego no revelará directamente que el puente seleccionado es incorrecto.

### Puente repetido

El sistema impedirá volver a utilizarlo.

No provocará una pantalla de error.

---

## 11. Reinicio

El jugador podrá:

* Reiniciar solo el recorrido.
* Regresar a planificación y cambiar el puente.
* Salir del puzle.

### Reiniciar recorrido

Conserva:

* Puente cerrado.
* Reflexiones.
* Cuaderno.
* Número de intentos.

Restablece:

* Posición a E.
* Puentes utilizados.
* Nodos visitados durante el intento.

### Regresar a planificación

Restablece el recorrido y permite cambiar el puente cerrado.

---

## 12. Respuesta visual

### Puente disponible

* Apariencia normal.
* Línea completa en el mapa.

### Puente seleccionado como cerrado

* Barrera física.
* Línea interrumpida.
* Símbolo de cierre.
* No depender únicamente del color.

### Puente utilizado

* Marcas de pasos.
* Línea atenuada o sellada.
* Estado claramente diferente del cerrado.

### Nodo actual

* Resaltado.
* Marcador del protagonista.

### Destino

* Símbolo del molino.
* Debe ser reconocible sin leer la letra L.

---

## 13. Información de interfaz

Durante planificación:

```text
Objetivo: cierra un puente y encuentra un recorrido válido.
Puente cerrado: E–N
[E] Seleccionar
[Enter] Iniciar recorrido
[Q] Cuaderno
[P] Reflexionar
[Esc] Salir
```

Durante recorrido:

```text
Inicio: Entrada
Destino: Molino
Puentes restantes: 4
[R] Reiniciar
[Q] Cuaderno
[P] Reflexionar
[Esc] Abandonar intento
```

Las letras de los nodos solo se utilizarán en desarrollo o como apoyo opcional.

En el juego final deberán predominar:

* Nombres.
* Símbolos.
* Elementos físicos.

---

## 14. Reflexiones

### Reflexión 1 — Recuerdo

> “Cada vez que llego a una isla necesito otro puente para salir, salvo al principio y al final.”

### Reflexión 2 — Orientación

> “Quizá deba contar cuántos puentes llegan a cada lugar. Casi todos necesitarán conexiones emparejadas.”

### Reflexión 3 — Impulso

> “El comienzo y el final deben ser los únicos lugares con un número impar de puentes. Busca qué cierre convierte a la entrada y al molino en esos dos lugares.”

Ninguna reflexión indicará directamente:

> “Cierra E–N.”

---

## 15. Consecuencia narrativa

Al completar el recorrido:

* Maestro Nodo reconoce que su mapa actual no representaba el estado anterior.
* Se confirma el camino seguido por la novia.
* Se activa una compuerta.
* Cambia el nivel del agua.
* Se abre parcialmente la conexión al molino.
* Se habilita una ruta secundaria hacia el jardín.
* Se añade el recorrido al cuaderno.
* Se registra la cuadrícula de mantenimiento vinculada al metapuzle.
* La partida se guarda automáticamente.

---

## 16. Diálogo provisional de resolución

**Maestro Nodo:**

> “Naturalmente. El puente estaba cerrado.”

**Protagonista:**

> “Llevas todo este tiempo enseñándome un mapa incorrecto.”

**Maestro Nodo:**

> “No era incorrecto. Era actual.”

**Protagonista:**

> “Eso no es lo mismo.”

**Maestro Nodo:**

> “Exactamente. Ya estás aprendiendo.”

---

## 17. Casos de prueba matemáticos

### CP-P2-001 — Solución válida principal

**Puente cerrado:** E–N
**Recorrido:** E–R–N–L–R–M–L
**Resultado esperado:** válido.

### CP-P2-002 — Solución válida alternativa

**Puente cerrado:** E–N
**Recorrido:** cualquier camino euleriano de E a L.
**Resultado esperado:** válido.

### CP-P2-003 — Todos los puentes abiertos

**Resultado esperado:** no se permite iniciar o no puede satisfacerse el objetivo desde E hasta L.

### CP-P2-004 — Puente E–R cerrado

**Resultado esperado:** imposible comenzar un recorrido completo desde E.

### CP-P2-005 — Puente N–R cerrado

**Resultado esperado:** no existe recorrido válido de E a L que use todos los puentes restantes.

### CP-P2-006 — Puente N–L cerrado

**Resultado esperado:** no existe recorrido válido de E a L.

### CP-P2-007 — Puente R–M cerrado

**Resultado esperado:** la paridad final no corresponde a E y L.

### CP-P2-008 — Puente M–L cerrado

**Resultado esperado:** la paridad final no corresponde a E y L.

### CP-P2-009 — Puente R–L cerrado

**Resultado esperado:** la paridad final no corresponde a E y L.

### CP-P2-010 — Callejón sin salida

El jugador utiliza una secuencia que deja conexiones aisladas.

**Resultado esperado:**

* Mensaje de intento incompleto.
* Posibilidad de reiniciar.
* Ninguna pérdida de progreso.

### CP-P2-011 — Salir durante planificación

**Resultado esperado:**

* Puente seleccionado conservado.
* Reflexiones conservadas.

### CP-P2-012 — Salir durante recorrido

**Resultado esperado:**

* Nodo actual conservado.
* Puentes utilizados conservados.
* Intento recuperable al volver.

### CP-P2-013 — Reiniciar recorrido

**Resultado esperado:**

* Posición restaurada a E.
* Puentes abiertos restaurados.
* Puente cerrado conservado.

### CP-P2-014 — Cargar partida

**Resultado esperado:**

* Restauración exacta del tablero.
* Ausencia de conexiones duplicadas.
* Contador correcto.

---

## 18. Validación automática requerida

La función de validación deberá comprobar conceptualmente:

```text
1. Existe exactamente un puente cerrado.
2. El recorrido comienza en E.
3. El recorrido termina en L.
4. Cada paso corresponde a una conexión real.
5. Ningún paso utiliza el puente cerrado.
6. Ninguna conexión se repite.
7. Todas las conexiones abiertas se utilizan.
```

No deberá comprobar:

```text
recorrido == secuencia_predefinida
```

---

## 19. Prototipo de papel

### Materiales

* Cinco tarjetas de localización.
* Siete tiras que representan puentes.
* Una ficha de protagonista.
* Marcadores para puentes utilizados.
* Una ficha de “cerrado”.
* Hoja de observaciones.
* Tres tarjetas de reflexión.

### Procedimiento

1. Colocar los cinco nodos.
2. Conectarlos con las siete tiras.
3. Explicar el objetivo.
4. Permitir cerrar una conexión.
5. Mover la ficha.
6. Retirar o marcar cada puente utilizado.
7. Registrar comentarios y errores.
8. Presentar reflexiones solo bajo petición.

---

## 20. Preguntas para el playtest

Después de la prueba:

1. ¿Entendiste el objetivo sin explicación adicional?
2. ¿Qué fue lo primero que intentaste?
3. ¿En qué momento comprendiste que importaba la cantidad de conexiones?
4. ¿La solución te pareció lógica después de verla?
5. ¿Alguna regla resultó ambigua?
6. ¿Intentaste repetir un puente?
7. ¿El mapa ayudó o confundió?
8. ¿La tercera reflexión fue suficiente?
9. ¿Sentiste que resolvías un problema o que probabas caminos?
10. ¿Aceptarías volver a una zona anterior para aplicar esta idea de otra forma?

---

## 21. Criterios de aceptación del prototipo de papel

P2 se aprobará para implementación digital cuando:

* El objetivo se comprende sin intervención del diseñador.
* Al menos un evaluador encuentra la solución sin pistas.
* Un evaluador general puede resolverlo utilizando las reflexiones.
* Nadie encuentra una segunda elección válida de puente cerrado.
* Todas las rutas eulerianas válidas son aceptables.
* El jugador comprende que los nodos pueden repetirse.
* El jugador comprende que los puentes no pueden repetirse.
* La solución provoca una sensación de revelación.
* La interfaz física no genera más dificultad que el problema.
* El tiempo medio no supera claramente el rango previsto.

---

## 22. Criterios de aceptación digital

La implementación se considerará completa cuando:

* Puede manejarse únicamente con teclado.
* El puente cerrado se distingue visualmente.
* Los puentes utilizados se distinguen de los cerrados.
* No se puede repetir un puente.
* El sistema acepta recorridos alternativos válidos.
* El sistema rechaza recorridos incompletos.
* Reiniciar es inmediato.
* Salir conserva el estado.
* Guardar y cargar conserva el intento.
* Las tres reflexiones funcionan.
* La resolución produce cambios persistentes.
* No existe una incidencia bloqueante conocida.
* Las pruebas automáticas cubren todas las conexiones cerradas.

---

## 23. Contenido no incluido en el primer prototipo

* Arte final.
* Agua dinámica definitiva.
* Animaciones completas.
* Mapa final de la zona.
* Música final.
* Todos los diálogos de Maestro Nodo.
* Cuadrícula definitiva del metapuzle.
* Personalización de la pareja.
* Conexión real con Molino y Jardín.
* Iluminación final.

Se utilizarán recursos temporales hasta validar la mecánica.

---

## 24. Estructura futura de archivos

```text
src/
  puzzles/
    p2-bridges/
      P2BridgesPuzzle.js
      P2BridgesState.js
      P2BridgesValidator.js
      P2BridgesView.js

content/
  puzzles/
    p2-bridges.json

tests/
  puzzles/
    p2-bridges-validator.test.js

docs/
  prototypes/
    P2_EL_PASEO_IMPOSIBLE.md
```

Esta estructura es orientativa y podrá ajustarse al comenzar la arquitectura real.

---

## 25. Estado final

**Estado actual:** listo para prototipo en papel.

### Siguiente acción

Construir una versión física sencilla y ejecutar al menos:

* Una prueba interna.
* Una prueba con jugador general.
* Una prueba con jugador lógico.

No se comenzará la implementación digital de P2 hasta revisar los resultados de estas pruebas.
