# Especificación definitiva: La pregunta correcta

## Estado de la decisión

**Decisión definitiva para `v1.0.0`:** el tercer y último puzle principal
será **La pregunta correcta** y estará situado en el Archivo compacto.

La decisión fija la mecánica, los datos, la solución, la interacción, el
estado y las consecuencias narrativas. La redacción final de afirmaciones y
evidencias deberá superar los tres playtests definidos en la sección 30 sin
cambiar su significado lógico.

La implementación mantendrá la arquitectura actual: datos, estado y
validación independientes de Canvas, DOM y almacenamiento; una escena focal
para la presentación; e integración narrativa mediante `GameState`.

## 1. Función narrativa del Archivo compacto

El Archivo compacto concentra el cierre de la investigación. No reproduce las
múltiples cámaras del Archivo histórico ni introduce una nueva cadena de
puzles.

El Custodio de las Certezas retiene a la novia porque intenta validar esta
afirmación:

> Estas dos personas permanecerán unidas bajo cualquier circunstancia futura.

El Archivo solo registra hechos observados hasta el momento presente. El
jugador debe demostrar que el Custodio confunde tres situaciones distintas:
una afirmación confirmada por los registros, una afirmación contradicha por
ellos y una afirmación que no puede decidirse con la información disponible.

La clasificación final permite sustituir la exigencia universal por una
afirmación presente y verificable:

> Con la información que poseen ahora, ambas personas eligen avanzar juntas.

Resolver el puzle termina la investigación y habilita el epílogo. No abre
ninguna localización adicional.

## 2. Objetivo exacto del jugador

Clasificar seis afirmaciones del expediente del Custodio asignando a cada una
exactamente uno de tres veredictos:

- `confirmed`;
- `contradicted`;
- `undecidable`.

La clasificación debe basarse exclusivamente en las diez evidencias
disponibles. El jugador confirma el conjunto completo y demuestra por qué el
protocolo original no puede exigir certeza sobre hechos futuros todavía no
observables.

La duración objetivo es de **8 a 15 minutos**, incluyendo lectura, razonamiento
y uso opcional de pistas.

## 3. Elementos expresamente fuera de alcance

Esta decisión no incluye:

- el P10 histórico de trece parejas, sumas, productos y eliminación
  epistémica;
- P8, grafos dirigidos, recorridos por nodos o detección de líneas;
- P9, transformaciones de cuadrículas o señales visuales;
- P11, combinación física o metapuzle largo;
- ordenar, intercambiar o arrastrar objetos;
- drag-and-drop, ratón obligatorio, OCR, física o coordenadas precisas;
- generación procedural, variantes aleatorias o soluciones alternativas;
- más de seis afirmaciones o más de tres veredictos;
- nuevas dependencias, frameworks o cambios de motor;
- reestructurar `PuzzleLifecycle`, `GameState`, `WorldScene` o
  `UiController`;
- Jardín, Molino, Observatorio, interiores secundarios o nuevas zonas;
- un segundo puzle dentro del Archivo;
- una secuencia extensa posterior a la resolución antes del epílogo.

## 4. Definición de los tres veredictos

### `confirmed`

Los registros disponibles establecen directamente la afirmación. No basta con
que sea plausible o compatible con ellos.

Etiqueta de interfaz: **Confirmada**.

### `contradicted`

Al menos un registro disponible es incompatible con la afirmación. No
significa simplemente que falte una prueba.

Etiqueta de interfaz: **Contradicha**.

### `undecidable`

Los registros disponibles no permiten confirmar ni contradecir la afirmación.
El Archivo debe reconocer el límite de la información en lugar de inventar
una conclusión.

Etiqueta de interfaz: **No decidible**.

La diferencia entre `contradicted` y `undecidable` constituye la idea central
del puzle y debe explicarse antes de permitir la primera confirmación.

## 5. Evidencias

Los IDs son estables y forman parte de los datos narrativos:

| ID | Nombre | Contenido lógico |
|---|---|---|
| `E1` | Registro de acceso | La credencial de la novia abrió el Archivo; no consta ninguna otra. |
| `E2` | Registro del recorrido | El protagonista siguió la anotación del embarcadero, el catálogo y el acceso al Archivo. |
| `E3` | Acta de preparativos | El acta de preparativos registra la propuesta de la novia: la ceremonia en el patio. |
| `E4` | Declaración del protagonista | «Con lo que sé hoy, vuelvo a elegir lo mismo que elegí contigo». |
| `E5` | Declaración de la novia | «Nada de lo que he leído aquí me hace cambiar de decisión». |
| `E6` | Límite del Archivo | Todo asiento del Archivo cita la fecha en que se observó; no admite asientos sin observación. |
| `E7` | Aviso de revisión | El acceso quedó bajo revisión después de la entrada de la novia; el aviso no dice cómo se produjo. |
| `E8` | Anotación de propósito | Nota de la novia junto al acceso: «Entro a revisar el protocolo. Vuelvo pronto». |
| `E9` | Enmienda de preparativos | El protagonista propuso celebrar la ceremonia en el embarcadero; después ambos firmaron una sola versión. |
| `E10` | Expediente anterior | El sistema conserva otro caso del mismo tipo de afirmación, todavía sin resolver. |

Cada afirmación muestra las evidencias que el expediente asocia a ese punto,
que no son necesariamente solo las necesarias para evaluarla: parte del
trabajo del jugador es descartar registros pertinentes en apariencia pero
inertes para el veredicto (§6). Los textos deben ser breves y no deben
esconder información obligatoria en decoración, audio o animación.

Cada evidencia debe leerse de forma autónoma en cualquier afirmación donde
se muestre: sin pronombres ni referencias que dependan de haber leído antes
otra evidencia, porque el mismo registro aparece en pantallas distintas y con
vecinos distintos (`E3` y `E9` son el caso claro). Los textos tampoco pueden
estrenar personajes ni premisas que el juego publicado no muestre en ningún
texto jugable: el Custodio y la retención de la novia pertenecen al material
de diseño de §3, no al expediente en pantalla.

## 6. Afirmaciones y solución

| ID | Afirmación | Solución |
|---|---|---|
| `voluntary-entry` | La novia entró voluntariamente en el Archivo. | `confirmed` |
| `followed-trail` | El protagonista llegó al Archivo siguiendo las pistas. | `confirmed` |
| `never-disagreed` | La pareja nunca ha discrepado. | `contradicted` |
| `someone-refuses-now` | Al menos una de las dos personas no elige avanzar ahora. | `contradicted` |
| `present-choice` | Con la información actual, ambas personas eligen avanzar juntas. | `confirmed` |
| `universal-future` | Permanecerán unidas bajo cualquier circunstancia futura. | `undecidable` |

La correspondencia entre ID y veredicto es la única solución válida y no ha
cambiado desde `v1.0.0`.

### Evidencias mostradas por afirmación

`ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE` declara, afirmación por afirmación, qué
evidencias se muestran y qué papel juega cada una. `claim.evidenceIds` se
deriva de esa matriz, en ese mismo orden de presentación, para que datos y
presentación no puedan divergir.

| Papel | Significado |
|---|---|
| `supports` | Aporta el apoyo decisivo de la afirmación. |
| `contradicts` | Aporta la incompatibilidad decisiva con la afirmación. |
| `relevant-but-insufficient` | Aporta información real, pero no decide nada sin cruzarla con otra evidencia de la misma afirmación. Es **portante**: el veredicto de esa afirmación no queda fundamentado sin ella. |
| `irrelevant` | **Distractor genuino** y único papel distractor: se muestra, parece pertinente y no interviene en el veredicto. |

Una evidencia `relevant-but-insufficient` nunca es un distractor. `E6` y
`E10` en `universal-future` son el ejemplo claro: son exactamente las que
fundamentan el `undecidable`, no ruido que descartar. Los distractores
genuinos del expediente son tres relaciones: `E7` en `voluntary-entry`, `E3`
en `someone-refuses-now` y `E9` en `present-choice`.

«Decisivo» no significa «aislado». La única evidencia que decide su
afirmación en solitario es `E2` en `followed-trail`; `E9` solo contradice
`never-disagreed` leído junto a `E3`, que es precisamente lo que hace de
`E3` una evidencia insuficiente y no una irrelevante en esa afirmación.

| Afirmación | Evidencias mostradas | Papeles |
|---|---|---|
| `voluntary-entry` | `E1`, `E7`, `E8` | `E1` y `E8` insuficientes por separado y suficientes juntas; `E7` irrelevante (la revisión del acceso es posterior a la entrada y no explica cómo se produjo). |
| `followed-trail` | `E2` | `E2` la establece directamente; es el ancla de aprendizaje del puzle y la única afirmación que se decide con un solo registro. |
| `never-disagreed` | `E3`, `E9` | `E3` insuficiente por sí sola; junto a `E9` documenta dos propuestas incompatibles de la misma decisión, hechas por personas distintas, así que `E9` contradice el «nunca». La firma conjunta posterior corrige la decisión, no borra que hubo dos propuestas. |
| `someone-refuses-now` | `E3`, `E4`, `E5` | `E4` y `E5` insuficientes por separado; juntas muestran que las dos personas eligen avanzar ahora, lo que contradice la afirmación. `E3` irrelevante (una propuesta pasada sobre la ceremonia no dice quién elige qué ahora). |
| `present-choice` | `E4`, `E5`, `E9` | `E4` y `E5` insuficientes por separado y suficientes juntas; `E9` irrelevante (la enmienda es un acuerdo pasado sobre la ceremonia, no una elección presente). |
| `universal-future` | `E6`, `E10` | Ambas insuficientes y ambas portantes: `E6` fija que el Archivo solo asienta lo observado y `E10` muestra un caso del mismo tipo todavía abierto. Juntas fundamentan un `undecidable` real, no una simple ausencia de registros. |

## 7. Reglas completas de clasificación

1. Cada afirmación recibe exactamente un veredicto.
2. `confirmed` solo se usa cuando una o más evidencias establecen
   directamente la afirmación.
3. `contradicted` solo se usa cuando una o más evidencias son incompatibles
   con la afirmación.
4. `undecidable` se usa cuando no existe evidencia suficiente para confirmar
   ni contradecir.
5. La ausencia de confirmación no equivale a contradicción.
6. La ausencia de contradicción no equivale a confirmación.
7. Solo se consideran los registros mostrados; no se permiten suposiciones
   sobre hechos futuros o información externa.
8. Las seis afirmaciones deben evaluarse de forma independiente.
9. El orden de navegación no afecta al resultado.
10. El conjunto solo se valida al pulsar `Enter`.
11. Un fallo normal no revela qué afirmaciones están bien o mal.
12. Después de resolver, ningún veredicto puede modificarse.

## 8. Estado inicial

El estado persistente inicial es:

```js
{
  verdicts: {
    "voluntary-entry": null,
    "followed-trail": null,
    "never-disagreed": null,
    "someone-refuses-now": null,
    "present-choice": null,
    "universal-future": null,
  },
  phase: "ready",
  hintsRead: [],
  attemptCount: 0,
  failureCode: null,
}
```

El orden de presentación de las afirmaciones es el de la sección 6 y se
define como contenido inmutable, no dentro del guardado.

## 9. Flujo completo

### Entrada

La interacción con el terminal del Custodio muestra una explicación breve de
los tres veredictos y cambia a una escena focal. La escena reconstruye su
presentación desde el estado persistente.

En una entrada nueva se enfoca `voluntary-entry`. Al cargar o reentrar se
conservan los veredictos, pistas, intentos y fallo, pero se reinicia el estado
transitorio.

### Navegación

Izquierda/derecha o `A/D` recorre circularmente las seis afirmaciones. La
pantalla muestra una sola afirmación, su posición `n/6`, sus evidencias
asociadas y el veredicto actual.

Moverse no modifica la fase ni cuenta un intento.

### Cambio de veredicto

Abajo o `S` avanza por el ciclo de veredictos. Arriba o `W` lo recorre en
sentido inverso. El primer cambio desde `ready` pasa a `classifying`.

Después de un fallo, cambiar cualquier veredicto pasa a `classifying` y
limpia `failureCode`.

### Confirmación incompleta

`Enter` con uno o más valores `null`:

- incrementa `attemptCount` una vez;
- conserva todos los veredictos;
- pasa a `failed`;
- establece `failureCode` en `incomplete_classification`;
- informa cuántas afirmaciones quedan sin revisar, pero no sugiere
  veredictos.

### Confirmación incorrecta

`Enter` con seis veredictos permitidos, pero una solución incorrecta:

- incrementa `attemptCount` una vez;
- conserva todos los veredictos;
- pasa a `failed`;
- establece `failureCode` en `incorrect_verdicts`;
- muestra una contradicción genérica;
- no identifica afirmaciones correctas o incorrectas.

### Reinicio

`R` aplica el comportamiento definido en la sección 19.

### Pistas

`Q` revela la siguiente reflexión disponible. Las pistas se consultan
manualmente, en orden y sin coste. Permanecen registradas al salir, cargar o
reiniciar.

### Salida

`Escape` vuelve al Archivo conservando todo el estado persistente. No
completa, revierte ni cambia un veredicto.

### Resolución

Una confirmación correcta incrementa `attemptCount`, pasa a `solved`, limpia
`failureCode` y aplica una sola vez las consecuencias de la sección 22.

La escena muestra un diálogo estable del Custodio antes de permitir el paso
al epílogo.

### Reentrada después de resolver

La escena muestra la clasificación final y la reformulación aceptada. Los
controles de cambio, confirmación, pista y reinicio no modifican el estado.
Solo se permite revisar la conclusión o salir.

## 10. Controles definitivos

| Tecla | Acción |
|---|---|
| Flecha izquierda o `A` | Cambiar a la afirmación anterior. |
| Flecha derecha o `D` | Cambiar a la afirmación siguiente. |
| Flecha arriba o `W` | Cambiar el veredicto en sentido inverso. |
| Flecha abajo o `S` | Cambiar el veredicto en sentido directo. |
| `Enter` | Confirmar la clasificación completa. |
| `Q` | Consultar la siguiente reflexión. |
| `R` | Reiniciar mientras no esté resuelto. |
| `Escape` | Salir conservando el progreso. |

Se reutilizan `moveLeft`, `moveRight`, `moveUp`, `moveDown`,
`startPuzzleAttempt`, `restartPuzzleAttempt` y `cancel`.

El código actual enlaza `notebook` tanto a `Q` como a `Tab`. La especificación
del catálogo prevé una acción acotada `nextPuzzleHint: ["KeyQ"]`. Este puzle
debe reutilizar esa acción si ya existe; si todavía no existe al implementarlo,
debe añadirse una sola vez. No se reutiliza `notebook`, porque revelaría pistas
también con `Tab` y daría a la acción una semántica distinta.

## 11. Ciclo reversible de veredictos

El ciclo incluye siempre el valor inicial `null`.

Avance mediante abajo o `S`:

```text
null → confirmed → contradicted → undecidable → null
```

Retroceso mediante arriba o `W`:

```text
null → undecidable → contradicted → confirmed → null
```

Cada pulsación produce exactamente una transición. No hay aceleración,
repetición automática ni dependencia del tiempo mantenido.

## 12. Máquina de estados

### Fases

| Fase | Significado |
|---|---|
| `ready` | Estado inicial o reiniciado; todos los veredictos son `null`. |
| `classifying` | Al menos un veredicto ha sido modificado y no existe un fallo vigente. |
| `failed` | La última confirmación fue incompleta o incorrecta. |
| `solved` | La clasificación fue validada; estado terminal. |

### Transiciones

| Origen | Acción o resultado | Destino | Efecto |
|---|---|---|---|
| `ready` | cambiar un veredicto | `classifying` | Actualiza un valor. |
| `ready` | confirmar incompleto | `failed` | Incrementa intento y fija fallo. |
| `classifying` | cambiar un veredicto | `classifying` | Actualiza un valor. |
| `classifying` | confirmar incompleto | `failed` | Incrementa intento y fija fallo. |
| `classifying` | confirmar incorrecto | `failed` | Incrementa intento y fija fallo. |
| `classifying` | confirmar correcto | `solved` | Incrementa intento y resuelve. |
| `failed` | cambiar un veredicto | `classifying` | Actualiza un valor y limpia fallo. |
| `failed` | confirmar incompleto o incorrecto | `failed` | Incrementa intento y actualiza fallo. |
| `failed` | confirmar correcto | `solved` | Incrementa intento y resuelve. |
| `ready`, `classifying`, `failed` | reiniciar | `ready` | Restaura veredictos y fallo. |
| `solved` | reentrar, revisar o salir | `solved` | Ningún cambio persistente. |

Navegar, consultar una pista y salir no cambian la fase.

## 13. Estado persistente mínimo

| Campo | Tipo | Valor inicial | Propósito |
|---|---|---|---|
| `verdicts` | objeto con seis claves conocidas | Todos los valores `null` | Clasificación actual. |
| `phase` | `ready`, `classifying`, `failed` o `solved` | `ready` | Estado lógico y terminalidad. |
| `hintsRead` | `number[]` | `[]` | Pistas consultadas, únicas, ordenadas y limitadas a `1..3`. |
| `attemptCount` | entero no negativo | `0` | Número de pulsaciones de confirmación procesadas. |
| `failureCode` | `null`, `incomplete_classification` o `incorrect_verdicts` | `null` | Último fallo normal persistente. |

`attemptCount` es un campo directo porque aquí un intento comienza y termina
al confirmar. P2 lo almacena dentro de `PuzzleLifecycle` y lo incrementa al
iniciar un recorrido; reutilizar esa semántica produciría un contador
incorrecto y obligaría a cambiar un componente compartido.

## 14. Estado transitorio

| Campo | Tipo | Valor de entrada | Propósito |
|---|---|---|---|
| `focusedClaimIndex` | entero `0..5` | `0` | Afirmación visible y operable. |
| `statusMessage` | `string` | Derivado de fase y fallo | Instrucción o resultado visual actual. |
| `visibleHintLevel` | `null` o entero `1..3` | Último nivel de `hintsRead`, si existe | Reflexión visible; se deriva y no se serializa. |

Al cargar o reentrar, el foco vuelve a `0`, el mensaje se reconstruye y la
pista visible se deriva. Ninguno de estos campos puede cambiar la solución o
la migración.

## 15. Campos explícitos

No se usa `lifecycle: {}` ni ningún contenedor ambiguo. Tampoco se persisten
campos de foco, animación, colores, texto renderizado o resultados que puedan
derivarse.

No se añade una marca local `rewardApplied`: `phase === "solved"` impide una
segunda resolución. Las banderas globales del epílogo tienen funciones
distintas y se definen en la sección 23.

## 16. Validación estructural

El validador es una función pura que recibe `verdicts` y no importa Canvas,
DOM, `GameState`, `localStorage` ni temporizadores.

Debe comprobar, en este orden:

1. `verdicts` es un objeto no nulo y no es un array.
2. Existen exactamente seis claves.
3. Están presentes los seis IDs de la sección 6.
4. No existen claves adicionales o desconocidas.
5. Cada valor es `null`, `confirmed`, `contradicted` o `undecidable`.
6. Si existe algún `null`, la clasificación es incompleta.
7. Si está completa, se compara cada ID con su solución.

Resultado recomendado:

```js
{
  valid: false,
  code: "incorrect_verdicts",
  incorrectClaimIds: ["universal-future"],
}
```

`incorrectClaimIds` existe para pruebas y diagnóstico. La escena nunca lo
muestra durante un fallo normal.

## 17. Códigos de error

| Código | Tipo | Significado |
|---|---|---|
| `valid` | Resultado | Clasificación completa y correcta. |
| `invalid_verdicts` | Estructural | La entrada no es un objeto válido. |
| `invalid_claim_count` | Estructural | No existen exactamente seis claves. |
| `missing_claim` | Estructural | Falta un ID obligatorio. |
| `unknown_claim` | Estructural | Existe un ID adicional o desconocido. |
| `invalid_verdict` | Estructural | Un valor no pertenece al conjunto permitido. |
| `incomplete_classification` | Jugador | Al menos un valor sigue en `null`. |
| `incorrect_verdicts` | Jugador | La clasificación está completa, pero es incorrecta. |
| `invalid_phase` | Acción | Se intenta modificar o reiniciar un estado `solved`. |

Los fallos estructurales indican un error técnico, de contenido o de guardado
y deben fallar de manera controlada. No son alcanzables usando los controles
normales.

## 18. Intentos incompletos e incorrectos

Toda pulsación de `Enter` procesada antes de `solved` incrementa
`attemptCount` exactamente una vez.

### Incompleto

- Conserva los seis valores.
- Pasa a `failed`.
- Fija `incomplete_classification`.
- Puede indicar el número de afirmaciones pendientes.
- No identifica cuáles ni propone un veredicto.

Mensaje:

> El expediente todavía contiene afirmaciones sin revisar.

### Incorrecto

- Conserva los seis valores.
- Pasa a `failed`.
- Fija `incorrect_verdicts`.
- No muestra aciertos, fallos ni evidencias concretas.
- Permite continuar cambiando veredictos.

Mensaje:

> Al menos un veredicto exige más —o menos— evidencia de la que contienen los registros.

## 19. Reinicio

Mientras la fase no sea `solved`, `R`:

- asigna `null` a los seis veredictos;
- establece `phase` en `ready`;
- establece `failureCode` en `null`;
- conserva `hintsRead`;
- conserva `attemptCount`;
- reinicia `focusedClaimIndex` a `0`;
- reconstruye el mensaje transitorio.

En `solved`, `R` no altera el estado ni revierte consecuencias. Muestra un
aviso breve de que el criterio ya fue registrado.

## 20. Reflexiones

1. **Diferencia entre veredictos:** «No poder confirmar una afirmación no
   significa haber demostrado lo contrario».
2. **Lectura de los registros:** «Salvo el recorrido hasta el Archivo,
   ninguna otra afirmación se decide con un solo registro: mira de quién es
   cada anotación, en qué momento se hizo y si dos registros del mismo hecho
   pueden ser ciertos a la vez».

   La excepción es obligatoria: `followed-trail` sí se decide con `E2` sola,
   así que la reflexión no puede negarlo con un cuantificador universal
   falso.
3. **Criterios de descarte:** «Un registro posterior no explica cómo empezó
   lo anterior; una corrección firmada no borra que hubo dos propuestas
   incompatibles; y una declaración de hoy no alcanza a mañana».

La tercera reflexión ya no revela la clasificación completa. Entrega los tres
criterios de descarte que resuelven los puntos duros del expediente
(distractor posterior, corrección que no anula la discrepancia y límite
temporal de las declaraciones) sin nombrar ninguna afirmación ni ningún
veredicto: sigue siendo una medida de accesibilidad fuerte contra el bloqueo
del último tramo, pero exige aplicar los criterios al expediente.

Pulsar `Q` después de la tercera no cambia `hintsRead` y muestra que no quedan
más reflexiones.

## 21. Persistencia y migración

Esta especificación no fija un número de formato futuro. El repositorio actual
usa el formato `2`, pero el catálogo se implementará antes y puede haber
incrementado esa versión.

Cuando se implemente este puzle:

- se incrementará en uno la versión vigente en ese momento;
- se enumerarán explícitamente todos los formatos todavía soportados;
- cada formato anterior creará el puzle con su estado inicial;
- la migración conservará P2, catálogo, mapas, posición, banderas, objetivo y
  cuaderno;
- el formato nuevo exigirá el estado completo y estructuralmente válido;
- un estado nuevo inválido fallará de forma controlada;
- el estado transitorio nunca se guardará.

No se eliminará compatibilidad con ningún formato soportado sin una migración
aprobada y sus pruebas.

Una partida restaurada con:

```text
epilogueUnlocked = true
epilogueStarted = true
epilogueCompleted = false
```

se considera situada dentro del epílogo, no en el Archivo normal. La carga
debe enviarla a un punto estable del epílogo y no volver a ejecutar la
resolución del tercer puzle, registrar sus consecuencias ni añadir
`archive-final-evidence`.

Si el epílogo persiste pasos intermedios, se reanuda desde el último punto
estable registrado. Si no los persiste, se reinicia de forma segura desde el
comienzo de su presentación, pero sin volver a aplicar recompensas, entradas
de cuaderno o banderas. Una introducción ya consumida no debe reproducirse
cuando pueda repetir efectos; si necesita mostrarse por continuidad, debe ser
una presentación sin efectos laterales.

`epilogueCompleted` permanece en `false` hasta que termine realmente la
última secuencia obligatoria.

## 22. Consecuencias narrativas idempotentes

La primera transición a `solved` debe:

- registrar la evidencia final con el ID estable
  `archive-final-evidence`;
- añadirla mediante `GameState.addNotebookEntry`, sin duplicados;
- establecer `investigationComplete` en `true`;
- establecer `epilogueUnlocked` en `true`;
- actualizar `objectiveId` hacia el inicio del epílogo o el regreso a la
  Plaza, según su flujo definitivo;
- no activar Jardín, Molino, Observatorio ni ninguna zona fuera de alcance.

Contenido recomendado para el cuaderno:

> El Archivo conserva dos declaraciones presentes que mantienen la misma decisión y confirma que no dispone de observaciones futuras.

La entrada registra evidencia observada, no escribe automáticamente la
solución del puzle.

La resolución no establece directamente `epilogueCompleted`. El inicio y el
final del epílogo deben ocurrir en sus transiciones reales.

## 23. Función de las banderas del epílogo

Cada bandera representa un hecho diferente:

| Bandera | Se establece cuando | Función |
|---|---|---|
| `investigationComplete` | Se resuelve el puzle. | Indica que la investigación y el tercer puzle terminaron. |
| `epilogueUnlocked` | Se resuelve el puzle. | Autoriza el acceso al epílogo; no implica que haya comenzado. |
| `epilogueStarted` | Justo antes de cambiar por primera vez al epílogo. | Evita iniciar o reproducir dos veces su apertura. |
| `epilogueCompleted` | Termina la última secuencia obligatoria. | Identifica una partida completada y restaurable. |

El iniciador del epílogo debe comprobar:

```text
epilogueUnlocked && !epilogueStarted
```

y establecer `epilogueStarted = true` antes del cambio de escena.

Reentrar al puzle, cargar una partida o repetir una interacción no modifica
banderas ya verdaderas ni retrocede el objetivo.

La combinación `epilogueUnlocked = true`, `epilogueStarted = true` y
`epilogueCompleted = false` identifica una partida en curso dentro del
epílogo. No autoriza un segundo inicio ni una vuelta automática al Archivo.
La restauración debe continuar desde un punto estable o repetir únicamente
la presentación segura definida en la sección 21. En ambos casos se
conservan las banderas existentes y no se repiten consecuencias del puzle.

## 24. Diseño mínimo a 480 × 270

La escena muestra una afirmación cada vez:

- **Cabecera, `y=6..26`:** nombre del mecanismo y objetivo breve.
- **Progreso, `y=30..42`:** «Afirmación `n/6`» y seis indicadores.
- **Afirmación, `y=48..78`:** máximo de tres líneas.
- **Evidencias, `y=84..160`:** de uno a tres registros breves asociados, de
  como máximo dos líneas envueltas cada uno; la última línea dibujada nunca
  pasa de `y=160` para no invadir las cajas de veredicto.
- **Veredictos, `y=164..204`:** tres opciones grandes y el estado `null`.
- **Mensaje o pista, `y=210..238`:** máximo de tres líneas.
- **Controles, `y=246..266`:** ayuda contextual.

Requisitos:

- foco visible por marco, símbolo y texto;
- `null`, `confirmed`, `contradicted` y `undecidable` distinguibles sin
  depender solo del color;
- textos legibles a la resolución lógica, no solo tras escalar;
- evidencias disponibles sin desplazamiento ni pantalla secundaria;
- ninguna animación obligatoria para comprender el estado;
- indicadores de las seis afirmaciones compactos, sin mostrar sus textos a
  la vez;
- el resultado `solved` mantiene visible la reformulación final.

## 25. Criterio de resolución

La resolución requiere:

1. un objeto estructuralmente válido;
2. los seis IDs exactos;
3. ningún valor `null`;
4. coincidencia exacta con los seis veredictos de la sección 6;
5. una fase distinta de `solved`.

Al cumplirse:

- `attemptCount` aumenta una vez;
- `phase` pasa a `solved`;
- `failureCode` pasa a `null`;
- la clasificación queda bloqueada;
- las consecuencias narrativas se registran una sola vez;
- se muestra el diálogo del Custodio;
- el epílogo queda habilitado.

## 26. Reentrada después de resolver

Al volver a la escena:

- se conserva la solución completa;
- `focusedClaimIndex` vuelve a `0`;
- se muestra el estado «Criterio aceptado»;
- puede navegarse para revisar las seis conclusiones;
- arriba, abajo, `Q`, `R` y `Enter` no modifican datos;
- `Escape` retorna al Archivo o al flujo final aprobado;
- no se duplica `archive-final-evidence`;
- no se vuelve a iniciar el epílogo;
- no se modifica una partida con `epilogueCompleted = true`.

## 27. Pruebas unitarias

### Datos y validador

- existen exactamente diez evidencias y seis afirmaciones;
- los IDs son únicos;
- la matriz de relevancia coincide con la tabla de la sección 6 y
  `claim.evidenceIds` se deriva de ella;
- cinco de las seis afirmaciones exigen cruzar al menos dos evidencias, con
  `followed-trail` como única excepción;
- los distractores genuinos declarados (papel `irrelevant`) se muestran
  realmente en su afirmación, y ninguna evidencia portante se cuenta como
  distractor;
- ninguna evidencia repite ni parafrasea casi literalmente la afirmación que
  ayuda a resolver, ni recupera el texto anterior a `v1.2`;
- ninguna evidencia ni la intro estrenan personajes o premisas ajenas a los
  textos jugables publicados;
- la solución de las seis afirmaciones no cambia;
- la solución completa es válida;
- cada afirmación rechaza sus otros dos veredictos;
- rechaza entrada no objeto y arrays;
- rechaza cantidad distinta de seis;
- rechaza IDs ausentes, adicionales y desconocidos;
- rechaza valores fuera del conjunto permitido;
- distingue clasificación incompleta de incorrecta;
- devuelve IDs incorrectos solo para diagnóstico;
- no importa Canvas, DOM ni almacenamiento.

### Estado

- crea exactamente el estado inicial;
- recorre el ciclo directo, incluido el retorno a `null`;
- recorre el ciclo inverso, incluido el retorno a `null`;
- cambia a `classifying` con la primera modificación;
- incrementa el contador en confirmaciones incompletas, incorrectas y
  correctas;
- conserva veredictos después de fallar;
- limpia el fallo al modificar;
- reinicia veredictos y fase sin borrar pistas ni intentos;
- añade pistas en orden y sin duplicados;
- impide editar, confirmar o reiniciar después de `solved`;
- serializa y restaura cada fase;
- rechaza fases, pistas, contadores y fallos inválidos.

### Controlador

- devuelve resultados concretos para cambio, confirmación, reinicio, pista y
  resolución;
- aplica la resolución una sola vez;
- no contiene renderizado ni acceso a plataforma.

## 28. Pruebas de `GameState` y migración

- `reset()` incluye el puzle en estado inicial.
- El nuevo formato serializa los cinco campos persistentes.
- Todos los formatos soportados al implementar continúan cargando.
- Cada migración crea los seis valores `null`.
- Migrar no altera P2 ni el catálogo.
- Se restauran estados `ready`, `classifying`, `failed` y `solved`.
- Se conservan pistas, intentos y fallo.
- `archive-final-evidence` se añade una vez.
- Repetir el registro de resolución no duplica la entrada.
- Se conservan y validan las cuatro banderas del epílogo.
- Una partida con epílogo iniciado no repite su apertura.
- La combinación `epilogueUnlocked = true`, `epilogueStarted = true` y
  `epilogueCompleted = false` restaura el flujo dentro del epílogo, no en el
  Archivo normal.
- Esa restauración reanuda un punto estable o reinicia únicamente la
  presentación segura cuando no existen pasos intermedios persistentes.
- Restaurar el epílogo en curso no repite consecuencias del tercer puzle,
  no duplica `archive-final-evidence` y no vuelve a aplicar banderas.
- Una introducción ya consumida no se reproduce con efectos laterales.
- `epilogueCompleted` continúa en `false` hasta completar realmente la
  última secuencia.
- Una partida con epílogo completado sigue completada al cargar.
- Un objetivo narrativo posterior no retrocede.
- Ninguna migración desbloquea zonas fuera de alcance.
- Un estado nuevo inválido produce un error controlado.

## 29. Prueba Playwright mínima

Debe añadirse una prueba aislada:

1. Registrar `pageerror` y `console.error`.
2. Inyectar antes de cargar un guardado válido situado junto al terminal del
   Archivo, con catálogo resuelto y epílogo todavía bloqueado.
3. Abrir `/`, pulsar `L` para continuar y `E` para entrar.
4. Clasificar exclusivamente con teclado:
   - afirmación 1: una pulsación abajo, `confirmed`;
   - afirmación 2: una pulsación abajo, `confirmed`;
   - afirmación 3: dos pulsaciones abajo, `contradicted`;
   - afirmación 4: dos pulsaciones abajo, `contradicted`;
   - afirmación 5: una pulsación abajo, `confirmed`;
   - afirmación 6: tres pulsaciones abajo, `undecidable`.
5. Usar derecha entre afirmaciones y pulsar `Enter`.
6. Comprobar con `#dialogue-panel` que el Custodio acepta la reformulación o
   que el epílogo ha quedado habilitado.
7. Confirmar que no hubo errores JavaScript.

La prueba usa `page.keyboard.press`, locators y aserciones con reintento
automático. No usa coordenadas, `page.waitForTimeout`, OCR, lectura de
píxeles ni snapshots visuales exactas.

## 30. Playtests de papel o graybox

Antes de considerar definitiva la redacción de evidencias, afirmaciones y
mensajes deben realizarse **tres playtests** con personas que no conozcan la
solución.

En cada prueba se registra:

- tiempo total;
- veredictos iniciales;
- intentos;
- pistas consultadas;
- diferencia comprendida entre `contradicted` y `undecidable`;
- frases que necesitaron explicación externa;
- capacidad de explicar la solución con sus propias palabras.

La redacción se acepta cuando:

- la mediana está entre 8 y 15 minutos;
- las tres personas comprenden el objetivo sin explicación externa;
- al menos dos resuelven sin la tercera pista;
- las tres distinguen contradicción de información insuficiente después del
  puzle;
- ninguna evidencia necesaria se interpreta de dos formas lógicamente
  incompatibles.

Si falla un criterio, se corrigen textos y presentación antes de añadir arte.
La mecánica y la solución permanecen cerradas salvo que los playtests
demuestren una ambigüedad lógica real.

## 31. Criterios de aceptación

- La pregunta correcta está declarada como tercer puzle definitivo.
- Las diez evidencias y las seis afirmaciones coinciden con esta
  especificación.
- La clasificación tiene una única solución.
- Se comprende la diferencia entre los tres veredictos.
- No usa grafos, recorridos, líneas ni ordenación de objetos.
- Se completa íntegramente con teclado.
- El ciclo directo e inverso incluye `null`.
- Un fallo conserva las respuestas y permite continuar.
- Reiniciar conserva pistas e intentos y no revierte `solved`.
- Salir y cargar conservan todo el progreso lógico.
- El estado transitorio se reconstruye de forma segura.
- La lógica y el validador no dependen de presentación o plataforma.
- La escena es legible a 480 × 270.
- Las tres pistas son manuales y la última entrega los criterios de descarte
  que evitan un bloqueo, sin revelar la clasificación.
- Todos los formatos soportados se migran explícitamente.
- La evidencia final no se duplica.
- Las cuatro banderas del epílogo cumplen funciones distintas y coherentes.
- Resolver activa el epílogo una sola vez.
- Una partida con epílogo iniciado pero no completado se restaura dentro del
  epílogo desde un punto estable.
- Si no existen pasos intermedios persistentes, esa partida reinicia de forma
  segura la presentación sin repetir recompensas, evidencia ni banderas.
- La restauración no reproduce con efectos laterales una introducción ya
  consumida y mantiene `epilogueCompleted = false` hasta el final real.
- Una partida terminada se restaura correctamente.
- No se abre ninguna zona fuera de alcance.
- Los tres playtests aprueban la redacción.
- Las pruebas unitarias, de estado y Playwright pasan.
- `npm run check` y E2E pasan mediante Docker cuando exista implementación.
- La consola permanece sin errores y la versión web sigue funcionando.

## 32. Orden de implementación

1. **Datos inmutables:** evidencias, afirmaciones, soluciones, veredictos y
   códigos.
2. **Validador puro:** estructura, completitud y solución.
3. **Pruebas del validador:** todos los IDs, valores y errores.
4. **Estado:** ciclos, fases, pistas, intentos, fallo y reinicio.
5. **Controlador:** acciones y resultados sin presentación.
6. **Pruebas de estado y controlador.**
7. **Prototipo de papel:** primera revisión de redacción.
8. **Migración de `GameState`:** formato vigente, fixtures e idempotencia.
9. **Banderas de epílogo:** desbloqueo, inicio y finalización separados.
10. **Escena focal provisional:** teclado y presentación a 480 × 270.
11. **Integración con el Archivo:** terminal, diálogo y retorno.
12. **Epílogo mínimo:** activación única y restauración de partida terminada.
13. **Playwright:** solución completa con teclado.
14. **Tres playtests:** medir, revisar textos y repetir lo necesario.
15. **Arte y pulido:** solo después de aprobar lógica y redacción.
16. **Validación completa mediante Docker.**

Cada bloque debe ser pequeño, revisable y probado antes de avanzar.

## 33. Archivos estimados para la implementación posterior

### Crear

- `src/puzzles/archive-criteria/ArchiveCriteriaData.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaValidator.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaState.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaPuzzle.js`
- `src/scenes/ArchiveCriteriaScene.js`
- `src/scenes/EpilogueScene.js`
- `tests/puzzles/ArchiveCriteriaValidator.test.js`
- `tests/puzzles/ArchiveCriteriaState.test.js`
- `tests/puzzles/ArchiveCriteriaPuzzle.test.js`

### Modificar

- `src/main.js`
- `src/core/InputManager.js`, solo si `nextPuzzleHint` aún no existe
- `src/state/GameState.js`
- `src/content/worldMaps.js`
- `src/scenes/WorldScene.js`
- `tests/core/InputManager.test.js`, si se prueba la acción de pista
- `tests/state/GameState.test.js`
- `tests/state/GameStateWorld.test.js`
- `tests/content/WorldMaps.test.js`
- `tests/e2e/game.spec.js`

`UiController.js` no debería necesitar cambios: el diálogo, el aviso y el
cuaderno actuales proporcionan consecuencias narrativas y selectores DOM
estables. Cualquier ampliación deberá justificarse antes y mantenerse fuera
de la lógica.

No se prevén cambios en `package.json`, `compose.yaml`, dependencias ni
arquitectura general.
