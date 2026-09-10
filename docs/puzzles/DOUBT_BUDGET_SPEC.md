# Especificación: El presupuesto de la duda

## Estado de la decisión

**Decisión vigente para el ciclo post-`v1.2`:** el cuarto puzle principal
es **El presupuesto de la duda** y está situado en la **Cámara de
Contención**, una localización nueva accesible desde el Archivo.

Este documento describe lo implementado, no una propuesta: mecánica, datos,
solución, controles, estado persistente, migración de guardado y
consecuencias narrativas se corresponden con el código de `src/` y con las
pruebas de `tests/`. Sigue el esqueleto de
[`ARCHIVE_CRITERIA_SPEC.md`](ARCHIVE_CRITERIA_SPEC.md).

La implementación mantiene la arquitectura vigente: datos, estado y
validación independientes de Canvas, DOM y almacenamiento; una escena focal
para la presentación; integración narrativa mediante `GameState` y un módulo
de progresión propio.

## 1. Función narrativa de la Cámara de Contención

Resolver el criterio del Archivo (**La pregunta correcta**) ya no habilita el
epílogo: cierra la investigación y **abre la Cámara de Contención**. Allí el
Custodio mantiene abierto el expediente por el que retiene a la novia.

El Custodio no la retiene por hostilidad. La retiene porque no ha conseguido
cerrar el expediente, y su propio protocolo le impide cerrarlo mientras no
sepa qué contiene. El jugador no discute con él: usa el protocolo del
Custodio contra el propio expediente del Custodio.

Resolver la consulta habilita el epílogo. No abre ninguna localización
adicional.

## 2. Objetivo exacto del jugador

Identificar cuál de los **ocho** expedientes de contención posibles es el
real, formulando como máximo **tres** preguntas de sí o no de un menú de
**seis**.

El Custodio solo acepta una identificación que las respuestas ya obtenidas
**obliguen** a sostener. Mientras siga habiendo más de un expediente
compatible, incluso nombrar el expediente correcto es una identificación no
forzada y se rechaza.

La duración objetivo es de **8 a 15 minutos**, incluyendo lectura,
razonamiento y uso opcional de reflexiones.

## 3. Elementos expresamente fuera de alcance

- el P10 histórico de trece parejas, sumas y productos (ver
  [`../gdd/07-puzzles.md`](../gdd/07-puzzles.md) §7.13, superado por esta
  especificación);
- generación procedural, variantes aleatorias o expedientes alternativos;
- más de seis preguntas, más de ocho expedientes o un presupuesto distinto
  de tres;
- drag-and-drop, ratón obligatorio o coordenadas precisas;
- nuevas dependencias, frameworks o cambios de motor;
- un segundo puzle dentro de la Cámara;
- colisión condicional: la celosía es sólida antes y después de resolver
  (ver §11);
- cualquier cambio en el epílogo ya publicado.

## 4. El expediente de contención

Un expediente son **tres asientos binarios**, en este orden fijo:

| Asiento | Identificador       | Qué afirma                               |
| ------- | ------------------- | ---------------------------------------- |
| I       | `occupation`        | que la Cámara está ocupada               |
| II      | `validDoubt`        | que la duda registrada es válida         |
| III     | `archiveCompetence` | que el Archivo es competente sobre el caso |

Cada asiento está **sostenido** (`true`: respaldado por una observación
registrada) o es un **presupuesto** (`false`: aceptado sin observación).

El identificador narrativo de un expediente son sus tres letras en el orden
I-II-III: `S` para sostenido, `P` para presupuesto. Los ocho expedientes
posibles van de `SSS` a `PPP`.

**El expediente real es `SPP`**: la ocupación está sostenida; la duda válida
y la competencia del Archivo son presupuestos.

Todo esto es contenido inmutable (`DOUBT_BUDGET_DOSSIERS`,
`DOUBT_BUDGET_TRUE_DOSSIER`) y **nada de ello se persiste**.

## 5. Las seis preguntas

| Id | Pregunta                                                              |
| -- | --------------------------------------------------------------------- |
| P1 | ¿Comparten naturaleza los asientos I y II?                             |
| P2 | ¿Comparten naturaleza los asientos II y III?                           |
| P3 | ¿Comparten naturaleza los asientos I y III?                            |
| P4 | ¿Sostiene alguna observación registrada el asiento II?                 |
| P5 | ¿Sostiene alguna observación registrada al menos un asiento?           |
| P6 | ¿Comparten naturaleza los tres asientos entre sí?                      |

Cada pregunta es un **predicado** sobre los tres asientos. Las respuestas
**no se guardan nunca**: se derivan siempre aplicando el predicado real al
expediente real (`getDoubtBudgetAnswer`). Guardarlas sería tener dos fuentes
de verdad para el mismo hecho.

## 6. Solución y condición de victoria

No existe ninguna lista de ternas «ganadoras», y no debe existir. La
condición de victoria se **calcula siempre**:

1. se recorren los ocho expedientes posibles;
2. se conservan los que responderían **exactamente lo mismo** que el
   expediente real a las preguntas ya formuladas;
3. si queda **uno solo**, la identificación está forzada y el Custodio la
   acepta.

Una tabla estática de ternas válidas rechazaría partidas legítimas: hay
ternas que no distinguen los ocho expedientes en el peor caso y que, sin
embargo, identifican el expediente real de forma única por las respuestas
concretas que éste da.

`P1`, `P2` y `P4` es un ejemplo de terna que zanja el caso; no es «la»
solución.

## 7. Justificación del presupuesto de tres

El límite no se justifica con «tres bastan para ocho expedientes» — eso
explicaría que tres sean suficientes, no por qué el Custodio no concede una
cuarta. La justificación es autorreferencial y vive en
`DOUBT_BUDGET_RULE_LINES`: cada respuesta queda registrada como una entrada
más del expediente de consulta, sujeta a la misma norma que todo lo demás en
el Archivo; una cuarta entrada no tendría observación que la respaldara y
sería, ella misma, un presupuesto.

La palabra «presupuesto» designa a la vez lo que se asigna y lo que se da
por supuesto. La coincidencia es deliberada.

## 8. Estado persistente mínimo

`DoubtBudgetState` guarda exactamente seis campos:

| Campo                 | Contenido                                        |
| --------------------- | ------------------------------------------------ |
| `askedQuestionIds`    | preguntas formuladas, en orden, sin repetir      |
| `identifiedDossierId` | expediente concluido, o `null`                   |
| `phase`               | `ready` / `consulting` / `failed` / `solved`     |
| `hintsRead`           | reflexiones ya leídas                            |
| `attemptCount`        | identificaciones intentadas                      |
| `failureCode`         | motivo del último rechazo, o `null`              |

Las respuestas del Custodio **no aparecen aquí a propósito** (§5).

El constructor valida coherencia, no solo estructura: la fase `solved` exige
una identificación realmente forzada por las preguntas guardadas, y la fase
`failed` exige que el motivo guardado coincida con el que la validación
produciría hoy. Un guardado manipulado no puede declararse resuelto.

## 9. Flujo completo

### Entrada

Examinar `containment-budget-panel` en `containment-chamber` sincroniza la
posición del jugador, toma la foto del estado resuelto de los puzles y
cambia a la escena `doubt-budget`.

Un jugador puede llegar a este panel sin haber hablado nunca con el
Custodio, así que `DoubtBudgetScene.enter()` abre una introducción propia
(`CONSOLE_BRIEFING_LINES`) siempre que la consulta esté intacta (`ready`,
sin preguntas formuladas). Es prosa corta y distinta tanto de
`DOUBT_BUDGET_RULE_LINES` como del diálogo del Custodio en el mundo
(`CUSTODIAN_PROTOCOL_TURNS`): explica que hay varios expedientes posibles,
que solo uno es real, que las preguntas descartan posibilidades, que hay un
límite de tres y que después hace falta identificar el expediente, sin
listar combinaciones ni nombrar el expediente real. Mientras esa
introducción está abierta, ninguna tecla del panel tiene efecto salvo la de
avanzar el diálogo. Puede reaparecer tras un reinicio (`R`) si el jugador
vuelve a entrar con la consulta otra vez intacta, así que no saluda como un
primer encuentro.

### Navegación

Dos paneles con foco explícito: **preguntas** (6) y **expedientes** (8).
`←`/`→` cambia de panel, `↑`/`↓` mueve dentro del panel activo.

### Formular

`Enter` con el panel de preguntas enfocado formula la pregunta. Se cobra al
formularla, no al entenderla. Repetir una pregunta ya formulada, o pedir una
con el presupuesto agotado, **no cuesta nada**: no llega a formularse.

### Concluir

`Enter` con el panel de expedientes enfocado identifica el expediente
enfocado. Se rechaza por `unforced_identification` si queda más de un
expediente compatible, y por `incorrect_identification` si la consulta ya
está zanjada y el expediente nombrado no es el real.

Retomar la consulta tras un rechazo (formular otra pregunta) descarta esa
identificación: el expediente de consulta vuelve a estar abierto.

### Reinicio

`R` abre una consulta nueva conservando las reflexiones leídas y el número
de intentos ya realizados. No hace nada sobre una consulta ya cerrada.

### Reflexiones

`Q` revela la siguiente de tres reflexiones. Ninguna nombra una pregunta
concreta, una terna completa ni el expediente real.

### Salida

`Esc` vuelve al mundo sin modificar el estado de la consulta.

### Resolución

Aceptar la identificación dispara `PUZZLE_SUCCESS_SFX_PATH`, aplica
`applyDoubtBudgetProgression()` y muestra el aviso «El expediente de
contención se ha cerrado» **una sola vez**.

## 10. Realimentación en tiempo real

La escena muestra en todo momento:

- el presupuesto restante (`n/3 preguntas`);
- el número de expedientes compatibles (`n/8`), recalculado tras cada
  respuesta;
- cada pregunta ya formulada con su respuesta (`SÍ`/`NO`);
- cada expediente marcado como `compatible` o `descartado`.

Ver el conteo de compatibles bajar es la forma en que el jugador entiende la
condición de victoria sin que nadie se la enuncie.

## 11. La Cámara de Contención

`containment-chamber` mide 24 × 16 tiles (384 × 256 px), el mismo tamaño
exacto que `archive`, así que la cámara del juego la muestra siempre
entera. Paleta fría y sin `dawnPalette`.

| Zona   | Elemento                                                           |
| ------ | ------------------------------------------------------------------ |
| Centro | `containment-well`, pozo de expedientes con resplandor turquesa    |
| Norte  | `containment-budget-panel`, abre la consulta                        |
| Norte  | `containment-custodian`, NPC estático                               |
| Este   | `containment-lattice-screen` + `containment-lattice` (diálogo)      |
| Oeste  | dos `sealed-dossier-rack`                                           |
| Sur    | `containment-to-archive`, recíproco de `archive-to-containment`     |

El pozo cubre **exactamente** su región sólida de 2 × 2 tiles: lo que se ve
bloqueado es lo que bloquea. La celosía es una región sólida de 1 × 14 tiles
y **lo sigue siendo después de resolver**: lo que se abre al cerrar el
expediente es narrativo — sale ella, no entra él —, así que no existe
colisión condicional ni versión «abierta» del sprite.

El acceso `archive-to-containment` existe y se dibuja desde el principio,
gateado por `containmentUnlocked` en `interactWithExit()` — mismo patrón que
`library-to-archive` con `archiveUnlocked`.

## 12. El Custodio

Sprite propio de 20 × 32 (`custodianPixelArt.js`), deliberadamente mayor que
los 14 × 22 de los personajes humanos y con la cabeza en trapecio
**invertido**. No reutiliza ningún renderer humano y su paleta no comparte
ningún valor con la de ningún personaje.

`CustodianRenderer.js` sigue el patrón de `ElenaRenderer.js` con una
simplificación documentada: **no expone `facing`**. El Custodio no camina, se
desliza por una guía y siempre encara al visitante. Lo que sí distingue son
dos variantes de su ranura de cristal (`idle` / `contradiction`), dos sprites
estáticos cacheados por separado; el mundo explorable solo usa `idle`.

Qué dice el Custodio se deriva del estado real de la consulta, sin ninguna
bandera nueva de guardado:

| Estado de la consulta        | Bloque de diálogo                        |
| ---------------------------- | ---------------------------------------- |
| `solved`                     | línea de cierre                          |
| `attemptCount > 0`           | por qué no puede usar lo que Gonzalo sabe |
| `ready` y sin preguntas      | primera aparición + protocolo + reacción  |
| consulta ya empezada         | protocolo, sin repetir el saludo          |

**Regla dura del personaje:** el Custodio nunca dice «elegir» ni habla del
futuro de la pareja. Ese registro pertenece en exclusiva al epílogo ya
escrito (`BRIDE_EPILOGUE_DIALOGUE_TURNS`), que esta tarea no toca. Hay una
prueba de regresión dedicada.

## 13. Consecuencias narrativas idempotentes

`applyDoubtBudgetProgression()` es el **único** punto del juego que pone
`epilogueUnlocked` en `true`. Aplicado sobre una consulta resuelta:

- fija `epilogueUnlocked = true`;
- fija el objetivo `start-epilogue` **solo** en la transición real, sin
  retroceder un objetivo posterior ya alcanzado;
- añade la entrada de cuaderno `containment-closure`.

Reaplicarlo no repite nada. `applyArchiveCriteriaProgression()` pasa a fijar
`containmentUnlocked` y el objetivo `enter-containment-chamber` en lugar de
`epilogueUnlocked`.

## 14. Persistencia y migración

`SAVE_FORMAT_VERSION` pasa de 4 a 5. El formato 5 añade
`puzzles.doubtBudget` y la bandera `containmentUnlocked`, con dos
invariantes nuevas:

```text
containmentUnlocked ⟹ investigationComplete
epilogueUnlocked    ⟹ containmentUnlocked
```

**Guardados de formato 1-4.** Se restauran con la consulta en su estado
inicial, salvo el caso indultado: un guardado anterior que ya tuviera el
epílogo desbloqueado (o el criterio del Archivo resuelto, que es lo que lo
producía en `v1.2`) describe una partida que, con las reglas vigentes
entonces, se ganó todo lo que viene después. Revertir esas banderas dejaría
ilegibles partidas ya terminadas de `v1.2`. Se conservan tal cual,
`containmentUnlocked` pasa a `true` y la consulta se restaura como
**realmente resuelta** — con una terna calculada contra los predicados
reales, no un estado por defecto disfrazado.

**Guardados de formato 5.** Las dos banderas se leen **literalmente**. La
deducción a partir de `archiveCriteria.phase === "solved"` queda restringida
a los formatos legacy a propósito: aplicarla también al formato vigente
enmascararía un bug real de escritura (si la progresión dejara de fijar
`containmentUnlocked`, `restore()` lo repararía en silencio en cada carga y
ninguna prueba lo notaría). Un guardado de formato 5 mal formado debe fallar
la invariante, no auto-curarse.

## 15. Pruebas

| Archivo                                              | Cubre                                            |
| ---------------------------------------------------- | ------------------------------------------------ |
| `tests/puzzles/DoubtBudgetData.test.js`              | expedientes, preguntas, predicados                |
| `tests/puzzles/DoubtBudgetValidator.test.js`         | compatibles, respuestas, validación               |
| `tests/puzzles/DoubtBudgetState.test.js`             | campos, fases, coherencia                         |
| `tests/puzzles/DoubtBudgetPuzzle.test.js`            | acciones y códigos                                |
| `tests/puzzles/DoubtBudgetHints.test.js`             | las tres reflexiones                              |
| `tests/state/GameStateDoubtBudgetSaveCompatibility.test.js` | formato 5 y migración desde 1-4           |
| `tests/progression/DoubtBudgetProgression.test.js`   | idempotencia y consecuencias                      |
| `tests/scenes/DoubtBudgetScene.test.js`              | controles, introducción obligatoria, realimentación y render |
| `tests/content/CustodianPixelArt.test.js`            | dimensiones, paleta y exclusividad de color       |
| `tests/render/CustodianRenderer.test.js`             | cache de sprites y variantes                      |
| `tests/scenes/ContainmentChamberPixelArtCache.test.js` | cache de props de la Cámara                     |
| `tests/content/WorldMaps.test.js`                    | geometría, solapes y alcanzabilidad               |
| `tests/scenes/WorldScene.test.js`                    | diálogos, revelación y render del Custodio        |
| `tests/e2e/game.spec.js`                             | recorrido completo en el navegador real           |

## 16. Criterios de aceptación

- La cuarta pregunta se rechaza sin coste con el presupuesto agotado.
- Una identificación no forzada se rechaza aunque nombre el expediente real.
- La identificación forzada del expediente real se acepta y desbloquea el
  epílogo exactamente una vez.
- El estado de la consulta sobrevive a guardar y cargar a mitad.
- Los guardados de `v1.0.0`-`v1.2` siguen cargando sin perder progreso.
- La revelación se reproduce una sola vez por resolución real, nunca al
  reentrar ni al cargar.
- El epílogo ya publicado sigue funcionando sin cambios.
