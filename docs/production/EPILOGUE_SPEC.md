# Especificación aprobada: el epílogo

## Estado de la decisión

**Decisión aprobada para `v1.0.0`:** el epílogo cierra la investigación,
explica el significado de «El Teorema del Sí» y entrega al jugador una
combinación numérica de cuatro cifras («**7152**») pensada para un candado
físico real asociado al regalo de boda.

Este documento fija la narrativa aprobada, el contrato de estado
persistente, el flujo de interacción y la descomposición en tareas
pequeñas para implementarlo con el flujo obligatorio de `CLAUDE.md`
(`planner` → `developer` → `qa` → `reviewer`) en varias ejecuciones de
`autopilot`. **No implementa nada todavía.** Ningún archivo de `src/` ni
`tests/` se modifica como parte de esta tarea.

Sigue la misma convención que
[`../puzzles/LIBRARY_CATALOGUE_SPEC.md`](../puzzles/LIBRARY_CATALOGUE_SPEC.md)
y [`../puzzles/ARCHIVE_CRITERIA_SPEC.md`](../puzzles/ARCHIVE_CRITERIA_SPEC.md):
mecánica, datos, estado persistente y consecuencias narrativas quedan
cerrados; la redacción final de diálogos puede pulirse sin contradecir el
núcleo aprobado (sección 10).

### Relación con `ARCHIVE_CRITERIA_SPEC.md`

`ARCHIVE_CRITERIA_SPEC.md` §21–23 ya anticipó parcialmente esta pieza antes
de que existiera un diseño completo del epílogo: definió `epilogueStarted`
y `epilogueCompleted` (además de las ya implementadas `investigationComplete`
y `epilogueUnlocked`), su semántica de guarda contra reinicios duplicados, y
un archivo `src/scenes/EpilogueScene.js` todavía no creado. Este documento
**reutiliza esa semántica sin contradecirla** y la completa con el diseño
real ahora aprobado. La única bandera nueva que ese documento no anticipaba
es `giftCodeSolved` (sección 13).

Verificado contra el código real antes de escribir esto: `src/state/GameState.js`
todavía no contiene `epilogueStarted`, `giftCodeSolved` ni `epilogueCompleted`
(solo existen `investigationComplete` y `epilogueUnlocked`); no existe
ninguna escena de epílogo, ningún sistema de audio (`src/` no tiene ningún
gestor de audio ni el `index.html` un elemento `<audio>`), y no existe
ninguna pantalla de créditos. Todo lo que sigue es una propuesta para
construir esas piezas, no una descripción de algo ya implementado.

## 1. Objetivo del epílogo

Cerrar la investigación, explicar el significado de «El Teorema del Sí» y
entregar al jugador la combinación **7152** para un candado físico real.

La combinación vive en una única configuración técnica (sección 5) para
poder cambiarla en el futuro sin tocar lógica ni diálogos.

## 2. Elementos expresamente fuera de alcance

- Otro puzle adicional.
- Finales alternativos o decisiones que los generen.
- Decisiones narrativas nuevas no incluidas en este documento.
- Personalización de nombres, fechas o mensajes privados de la pareja
  (sigue centralizada como trabajo futuro; ver
  [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) → «Personalización futura»).
- Cinemáticas complejas o ilustraciones a pantalla completa.
- Cambiar el significado aprobado del teorema (sección 9) o el núcleo del
  diálogo final (sección 10).
- Cambiar la combinación provisional `7152`.
- Implementar todo el epílogo en una única tarea (ver sección 18).
- Max, empaquetado Windows o cualquier otro elemento de
  «Orden de trabajo posterior» de `CODEX_HANDOFF.md` posterior al epílogo.

## 3. Activación

Resolver el Archivo (ya implementado, sin cambios) sigue estableciendo
`investigationComplete = true` y `epilogueUnlocked = true` mediante
`applyArchiveCriteriaProgression` (`src/progression/ArchiveCriteriaProgression.js`).
El epílogo **no** empieza automáticamente en ese momento.

**Decisión técnica propuesta:** en ese mismo instante, además de lo que ya
hace `applyArchiveCriteriaProgression`, deben ocurrir dos cosas nuevas
(tarea 2, sección 18):

1. Actualizar la etiqueta del objetivo ya existente `start-epilogue`
   (`OBJECTIVE_LABELS` en `src/scenes/WorldScene.js`) de
   `"La investigación ha terminado."` a
   `"Regresa al lugar donde comenzó la demostración."`. Se reutiliza el
   mismo identificador para no ampliar el contrato existente sin
   necesidad — el identificador no se muestra al jugador, solo la
   etiqueta.
2. Añadir al cuaderno, junto a `archive-final-evidence`, una entrada nueva
   con la pista de la combinación (sección 4). Título propuesto:
   `"La combinación del candado"`, `id` propuesto:
   `epilogue-combination-clue`. Ambos son detalles de interfaz, no
   narrativos; pueden ajustarse en la implementación sin volver a esta
   revisión.

El jugador debe regresar por su cuenta a la Plaza del Axioma (mapa
`axiom-plaza`, ya siempre accesible desde el inicio de la partida, a
diferencia del Paseo/Biblioteca/Archivo que están detrás de portales
narrativos).

## 4. Significado de la combinación

- **7**: los siete puentes representados inicialmente.
- **1**: el puente que nunca estuvo abierto.
- **5**: los cinco elementos ordenados en el catálogo.
- **2**: los dos criterios que representan un sí válido.

Pista para el cuaderno (texto narrativo aprobado, no debe alterarse):

> Siete caminos parecían posibles.
> Uno nunca lo fue.
> Cinco nombres recuperaron su lugar.
> Solo dos verdades resistieron al Archivo.

## 5. Configuración centralizada de la combinación

**Decisión técnica propuesta** (tarea 4, sección 18): un único módulo,
por ejemplo `src/content/epilogueConfig.js`, exporta la combinación como
dato inmutable:

```js
export const GIFT_CODE_DIGITS = Object.freeze([7, 1, 5, 2]);
```

Ningún otro archivo (lógica del selector, diálogos, pistas) debe repetir
los dígitos de forma literal; todos deben importar esta constante. Cambiar
la combinación en el futuro se reduce a editar este único archivo. El
texto de la pista (sección 4) puede seguir siendo prosa libre en el
cuaderno — no depende de esta constante — porque describe el significado,
no los dígitos en sí.

## 6. Punto interactivo del mecanismo en la Plaza

**Decisión técnica propuesta** (tarea 3, sección 18): un objeto nuevo en
`AXIOM_PLAZA.objects` (`src/content/worldMaps.js`), con `id` propuesto
`epilogue-gift-mechanism`, reutilizando el `type: "table"` ya usado por
`archive-criteria-table` (mismo renderizado de caja/mesa; sustituible por
un sprite propio más adelante sin tocar lógica, igual que ya ocurre con
la mesa del Archivo).

Requisitos que la implementación debe cumplir (no fijados aquí como
coordenadas concretas, según pide la especificación aprobada):

- Posición transitable, accesible a pie desde la entrada habitual de la
  Plaza, sin solapar ningún objeto ni decoración existente
  (`preparations-board`, `mayor-corolaria`, `bride-father`,
  `plaza-worker`, las cuatro salidas bloqueadas, la salida real al Paseo,
  el altar, la fuente y las mesas del banquete).
- Cubierta por un test de mapa que replique exactamente el patrón
  `assertSpawnIsClear` ya usado en `tests/content/WorldMaps.test.js`
  (adaptado a la posición del objeto en vez de al punto de aparición del
  jugador) — no basta con inspección visual.

El objeto está siempre presente en el mapa (igual que el resto de
objetos de `axiom-plaza`, que no aparecen ni desaparecen dinámicamente).
Su comportamiento al interactuar sí depende del estado:

- Si `epilogueUnlocked` es `false`: `interact()` muestra una respuesta
  narrativa breve y neutra (mismo patrón que `interactWithBlockedExit`),
  sin adelantar nada del epílogo. Texto exacto a definir en la
  implementación siguiendo el tono ya usado por el resto de respuestas
  bloqueadas del juego; no es una decisión narrativa nueva, es una
  reutilización de un patrón ya aprobado.
- Si `epilogueUnlocked` es `true` y `giftCodeSolved` es `false`:
  `interact()` hace `syncPlayerState()` y cambia a la escena del
  selector de cuatro cifras (sección 7). Si es la primera vez
  (`epilogueStarted` todavía `false`), la escena establece
  `epilogueStarted = true` antes de mostrar la interfaz, siguiendo la
  guarda ya definida en `ARCHIVE_CRITERIA_SPEC.md` §23.
- Si `giftCodeSolved` es `true`: `interact()` puede seguir abriendo la
  misma escena en un estado de solo lectura (mismo patrón de reentrada
  que ya usan `LibraryCatalogueScene`/`ArchiveCriteriaScene` tras
  resolver), o simplemente no ofrecer ya ninguna acción relevante porque
  el objetivo ha avanzado hacia buscar a la novia (sección 8). Decisión
  de implementación menor, sin impacto narrativo.

## 7. Mecanismo de cuatro cifras

**Decisión técnica propuesta** (tarea 5, sección 18): una escena focal
nueva, registrada por ejemplo como `"epilogue-gift-code"` en
`src/main.js` (mismo patrón que `"archive-criteria"` o
`"library-catalogue"`), con su propio archivo
`src/scenes/EpilogueGiftCodeScene.js`.

### Estado transitorio (no persistido)

```js
{
  focusedDigitIndex: 0,      // 0..3
  digits: [0, 0, 0, 0],      // valor mostrado en cada posición
}
```

El valor inicial de `digits` es siempre `[0, 0, 0, 0]` al entrar en la
escena — «el valor inicial puede ser `0000`» según la especificación
aprobada. No se reconstruye desde ningún guardado: **el selector temporal
no necesita persistirse**, tal como exige la especificación.

### Controles (reutiliza bindings ya existentes, ninguno nuevo)

| Tecla | Acción (`InputManager`) | Efecto |
|---|---|---|
| Flecha izquierda / `A` | `moveLeft` | Mueve el foco a la cifra anterior (circular, `0..3`). |
| Flecha derecha / `D` | `moveRight` | Mueve el foco a la cifra siguiente (circular, `0..3`). |
| Flecha arriba / `W` | `moveUp` | Aumenta en 1 la cifra enfocada (circular, `9 → 0`). |
| Flecha abajo / `S` | `moveDown` | Reduce en 1 la cifra enfocada (circular, `0 → 9`). |
| `Enter` | `startPuzzleAttempt` | Confirma la combinación completa. |
| `Escape` | `cancel` | Cancela y vuelve al mundo sin modificar ningún estado persistente. |

No se necesita ninguna tecla ni acción nueva en `src/core/InputManager.js`
— las seis acciones ya existen y ya se usan con esta misma semántica en
`P2BridgesScene`/`LibraryCatalogueScene`/`ArchiveCriteriaScene`. Esto es
lo que la especificación aprobada pide como «controles coherentes con el
resto del juego».

### Diseño mínimo a 480 × 270 (mismo presupuesto que los otros puzles)

- **Cabecera:** nombre del mecanismo.
- **Cuatro cifras grandes**, con la cifra enfocada resaltada por marco,
  no solo por color (mismo criterio de accesibilidad que
  `ARCHIVE_CRITERIA_SPEC.md` §24 y `docs/gdd/09-interfaz-ux.md` §9.20).
- **Ayuda contextual** con los controles disponibles.
- **Mensaje de estado**, usado para la respuesta a una combinación
  incorrecta (sección 8).

## 8. Comportamiento de combinación incorrecta y correcta

**Decisión técnica propuesta** (tarea 6, sección 18):

### Incorrecta

- No reinicia ningún progreso ni aplica penalización (ni siquiera un
  contador de intentos persistente: no lo pide la especificación
  aprobada y añadir uno sería ampliar el alcance).
- No revela qué cifras están bien o mal.
- Muestra un mensaje que remite al cuaderno o a revisar las pistas, por
  ejemplo: `"Esta combinación no es la correcta. Repasa el cuaderno."`
  (texto de interfaz, ajustable en implementación sin volver a esta
  revisión).
- El jugador permanece en la escena y puede seguir ajustando cifras o
  cancelar con `Escape`.

### Correcta

Comparación exacta contra `GIFT_CODE_DIGITS` (sección 5), los cuatro
dígitos en orden.

Al acertar:

- `giftCodeSolved` pasa a `true` (una sola vez; ver sección 13).
- Se muestra, de forma inequívoca y estable:

  ```text
  COMBINACIÓN DEL CANDADO REAL
  7 · 1 · 5 · 2
  ```

- Esta pantalla permanece hasta una confirmación explícita del jugador
  (por ejemplo `Enter` o `E`/`interact`, a definir en implementación) —
  no se cierra sola ni por temporizador.
- Tras confirmar, la escena vuelve al mundo. La Plaza adopta la
  presentación de amanecer (sección 11) y el objetivo cambia (ver más
  abajo).

**Objetivo tras resolver:** se propone un identificador nuevo,
`epilogue-meet-bride`, con etiqueta `"Acércate a ella en la Plaza."`,
asignado en el mismo punto en que `giftCodeSolved` pasa a `true`.

## 9. Resolución narrativa aprobada

*(Contenido narrativo cerrado — no debe alterarse ni ampliarse con nuevos
giros, peligros, antagonistas o revelaciones.)*

La novia no fue secuestrada ni estuvo en peligro.

Ella descubrió en el Archivo una formulación llamada «El Teorema del Sí»
que pretendía convertir una decisión voluntaria en una certeza
permanente. Comprendió que la demostración era falsa porque confundía
haber dicho sí una vez, haber seguido adelante o no haber protestado con
seguir queriendo lo mismo para siempre.

La novia preparó el recorrido para que el protagonista pudiera llegar a
esa conclusión por sí mismo.

No era una prueba de amor, una amenaza ni una manipulación. Era una
invitación antes de la boda para que ambos entendieran que su
compromiso no depende del destino, de una demostración ni de una
obligación.

El significado final es:

> Un sí solo tiene valor cuando sigue existiendo la posibilidad de decir
> no.

El protagonista acepta que no puede demostrar que el futuro será
perfecto ni garantizar que ninguna de las dos personas cambiará. Lo que
sí puede hacer es elegir libremente a la otra persona en el presente y
respetar que ambos seguirán siendo libres mañana.

No descubre que estaban destinados a casarse. Descubre que, pudiendo
elegir cualquier camino, ambos se eligen mutuamente.

## 10. Núcleo aprobado del diálogo

*(El texto definitivo puede pulirse antes de la implementación narrativa
si hay cambios sustanciales, pero debe conservar estas ideas exactas sin
contradecirlas — no es una decisión abierta.)*

> **Novia:** «No quería saber si serías capaz de encontrarme.
> Quería que supieras que podías dejar de buscar.»
>
> **Protagonista:** «Y aun así he venido.»
>
> **Novia:** «Entonces dime qué demuestra el teorema.»
>
> **Protagonista:** «Que ningún sí vale para siempre solo porque se
> pronunció una vez.
> Vale porque, pudiendo decir que no, hoy volvemos a elegirlo.»
>
> **Novia:** «Eso era lo único que necesitaba comprobar antes de
> mañana.»

**Decisión técnica propuesta** (tarea 10, sección 18): se reutiliza
`UiController.beginDialogue()` tal cual existe hoy (caja con hablante,
texto y avance mediante `interact`), sin necesidad de cambios en
`UiController.js` — el mismo mecanismo ya usado por todos los diálogos
del juego.

## 11. Formato del epílogo

- Duración aproximada: 5–7 minutos.
- Combinación de escena jugable (recorrido corto en la Plaza, con el
  jugador conservando el control) y diálogos.
- Final único, sin finales alternativos ni decisiones que los generen.
- Sin puzles adicionales más allá del selector de cuatro cifras.
- Se reutilizan el mapa `axiom-plaza` y el estilo visual existente — no
  se crea una localización nueva.

### Aparición e interacción con la novia

**Decisión técnica propuesta** (tarea 9, sección 18): un objeto NPC
nuevo en `AXIOM_PLAZA.objects`, `id` propuesto `bride-epilogue`, `type:
"npc"`, en una posición transitable, accesible y sin solapes (mismo
requisito de test de mapa que la sección 6).

Como el objeto vive en datos estáticos (`worldMaps.js`) pero solo debe
ser interactuable — y visualmente presente — después de
`giftCodeSolved`, se propone una convención declarativa nueva y genérica
en la forma del objeto: un campo opcional `requiresFlag` (por ejemplo
`requiresFlag: "giftCodeSolved"`), que `WorldScene.js` consulta tanto en
`findNearbyObject()`/el bucle de interacción como en `renderObjects()`
para omitir el objeto por completo mientras la bandera indicada sea
`false`. Es una generalización mínima y reutilizable (no un caso
especial hardcodeado por `id`), coherente con cómo ya se gatean otras
interacciones por bandera dentro de `interact()` — pero al tratarse de
un cambio en la lógica compartida de `WorldScene.js` (no solo en datos),
debe revisarse explícitamente en el `planner`/`reviewer` de esa tarea
antes de darse por buena.

Al interactuar con `bride-epilogue` (una vez visible): `syncPlayerState()`
y arranque del diálogo final (sección 10), seguido del cierre (sección
12).

### Estado visual de amanecer

**Decisión técnica propuesta** (tarea 8, sección 18): la presentación de
amanecer de `axiom-plaza` se deriva puramente de `giftCodeSolved` (sin
bandera visual nueva) — evita duplicar estado que ya existe. Alcance
mínimo: iluminación/paleta de amanecer y, opcionalmente, efectos
ambientales discretos ya mencionados en la especificación aprobada; sin
nuevos assets grandes ni cambios de geometría del mapa.

## 12. Cierre

*(Contenido narrativo cerrado.)*

La última escena muestra a ambos personajes juntos en la Plaza del
Axioma al amanecer, encaminándose hacia la boda.

Última frase:

> No existe un sí para siempre. Existen dos personas que pueden volver a
> elegirse cada día.

Después aparece el título:

> EL TEOREMA DEL SÍ

Tarjeta final:

> Por todos los síes que aún quedan por elegir.

**Nota de consistencia con `CODEX_HANDOFF.md`:** esta tarjeta final es
distinta y anterior a la dedicatoria personalizada prevista para más
adelante (marcador `{{FINAL_DEDICATION}}`, con los nombres reales de la
pareja). No deben mezclarse: la tarjeta de esta sección es el texto
genérico aprobado para `v1.0.0` sin personalizar; la dedicatoria
personalizada es trabajo futuro explícitamente fuera de alcance de esta
tarea (`CODEX_HANDOFF.md` → «Personalización futura», paso 4 de «Orden de
trabajo posterior»).

Después se muestran los créditos y se vuelve al menú principal (escena
`"title"`, ya existente).

**Decisión técnica propuesta** (tareas 13–14, sección 18): una escena
nueva, por ejemplo `src/scenes/CreditsScene.js` (registrada como
`"credits"`), que presenta en secuencia la frase final, el título, la
tarjeta de dedicatoria y los créditos, y termina con
`scenes.change("title")`. `epilogueCompleted` pasa a `true` exactamente
cuando esta secuencia termina, no antes.

## 13. Estado persistente

Se añaden tres banderas nuevas a `GameState.flags`
(`src/state/GameState.js`), junto a las nueve ya existentes:

| Bandera | Se establece cuando | Función |
|---|---|---|
| `investigationComplete` *(ya existe)* | Se resuelve el Archivo. | Investigación y tercer puzle terminados. |
| `epilogueUnlocked` *(ya existe)* | Se resuelve el Archivo. | Autoriza el acceso al epílogo; no implica que haya comenzado. |
| `epilogueStarted` **(nueva)** | Justo antes de abrir por primera vez el selector de cuatro cifras. | Evita reiniciar o repetir la apertura del epílogo. |
| `giftCodeSolved` **(nueva)** | Se confirma la combinación correcta. | Identifica que el candado ya fue resuelto; habilita el encuentro final sin repetir el selector. |
| `epilogueCompleted` **(nueva)** | Termina la secuencia de créditos. | Identifica una partida completada y restaurable de forma segura. |

Cada bandera representa un hecho distinto y no debe combinarse ni
inferirse de otra. `epilogueStarted`/`giftCodeSolved`/`epilogueCompleted`
forman, junto con `epilogueUnlocked`, una progresión estrictamente lineal
(sección 14) — no se necesita ningún campo `phase` adicional ni un
sub-objeto `puzzles.epilogue`: el propio conjunto de banderas booleanas
ya identifica sin ambigüedad en qué punto del epílogo está la partida.

**Decisión técnica propuesta sobre el formato de guardado:** las tres
banderas nuevas pueden añadirse **sin incrementar `SAVE_FORMAT_VERSION`**
(se mantiene en `4`). A diferencia de `libraryCatalogue`/`archiveCriteria`
(que exigen un sub-objeto con campos exactos y por eso sí forzaron el
salto de `3` a `4`), `GameState.restore()` ya lee cada bandera de forma
individual con `Boolean(data.flags?.campo)`, con `false` como valor
seguro por defecto — el mismo mecanismo que ya hizo innecesaria una lista
de «formatos legado» separada para las banderas al añadir
`investigationComplete`/`epilogueUnlocked`. Una partida de cualquier
formato ya soportado (`1`–`4`) que no contenga estas tres claves las
restaurará como `false` sin lanzar ni requerir ninguna lista nueva. Si en
la implementación aparece una razón real para incrementar la versión de
todos modos (por ejemplo, si se decide añadir un sub-objeto adicional no
previsto aquí), debe tratarse como una decisión técnica explícita de esa
tarea, no como algo ya decidido por este documento.

El selector temporal de cuatro cifras (sección 7) **no** se guarda en
ningún campo — no existe hoy y esta especificación no lo introduce.

## 14. Máquina de estados del epílogo (derivada de las banderas)

| Combinación de banderas | Significado | Comportamiento al cargar |
|---|---|---|
| `epilogueUnlocked=false` | Investigación sin terminar. | Continúa el recorrido normal; el mecanismo de la Plaza responde de forma neutra si se interactúa con él. |
| `epilogueUnlocked=true`, `epilogueStarted=false` | Epílogo desbloqueado, mecanismo aún no abierto. | El jugador puede explorar libremente; interactuar con el mecanismo lo abre por primera vez. |
| `epilogueStarted=true`, `giftCodeSolved=false` | Selector abierto o abandonado sin resolver. | Reanuda en el mundo, cerca del mecanismo; el selector siempre arranca en `0000` (sección 7), nunca se restaura a medio introducir. |
| `giftCodeSolved=true`, `epilogueCompleted=false` | Combinación resuelta, encuentro final pendiente. | **Debe continuar directamente hacia el encuentro final sin volver a pedir la combinación** — requisito explícito de la especificación aprobada. La Plaza se presenta en su estado de amanecer y la novia es interactuable. |
| `epilogueCompleted=true` | Partida completada. | Ver sección 15 — decisión técnica explícita sobre la conducta exacta. |

Transiciones: cada bandera solo pasa de `false` a `true`, nunca al
revés, y cada transición ocurre en un único punto del código (sección
13). Reentrar a cualquier escena, recargar o repetir una interacción no
retrocede ni repite banderas ya verdaderas — mismo principio ya aplicado
por `applyLibraryCatalogueProgression`/`applyArchiveCriteriaProgression`.

## 15. Conducta de una partida ya completada (decisión técnica explícita)

La especificación aprobada exige que **no exista ningún bucle que
reproduzca automáticamente los créditos al cargar una partida
completada**, y pide que la conducta exacta quede documentada como
decisión técnica antes de implementarse, recomendando la opción mínima
compatible con la arquitectura actual.

**Decisión recomendada:** cuando `epilogueCompleted === true`, cargar la
partida (`KeyL`, tanto desde el título como desde dentro del mundo) debe
restaurar siempre en la escena `"world"`, en el mapa `axiom-plaza`, en su
estado de amanecer (derivado de `giftCodeSolved`, ya `true` en este
punto) — **nunca** en `"epilogue-gift-code"` ni en `"credits"`. La
partida queda jugable en un estado terminal estable: el jugador puede
moverse por la Plaza, abrir el cuaderno y volver a guardar, pero no hay
ya ninguna secuencia que se reproduzca sola.

Justificación de por qué es la opción mínima compatible:

- `GameState.scene` casi siempre vale `"world"` en la práctica actual
  (`WorldScene.syncPlayerState()` lo fija en cada salida del mundo); no
  existe hoy ningún mecanismo para "restaurar dentro de" una escena
  focal salvo mediante el propio `objectiveId`/banderas que ya se
  comprueban al entrar en el mundo. Añadir una redirección especial
  únicamente para `epilogueCompleted` reutiliza ese mismo patrón sin
  introducir un caso nuevo de "restaurar en escena X".
- No requiere que la escena de créditos sea reanudable ni que persista
  ningún paso intermedio de sí misma — la única precondición dura de la
  especificación aprobada (no reproducir créditos en bucle) se cumple
  trivialmente porque los créditos nunca se disparan automáticamente al
  cargar, solo al completar la secuencia por primera vez en tiempo real.
- Es simétrica con el caso `giftCodeSolved=true, epilogueCompleted=false`
  (sección 14): ambos casos terminan aterrizando en el mundo, en la
  Plaza en su estado de amanecer; la única diferencia es si la novia
  sigue ofreciendo el diálogo final (no completada) o ya no hay ninguna
  interacción narrativa pendiente (completada).

Si una implementación futura decide en cambio que una partida completada
deba poder «volver a ver» los créditos bajo demanda (por ejemplo, una
opción explícita en el menú, no automática), eso sería una ampliación de
alcance nueva y debe tratarse como tal, no como parte de esta tarea.

## 16. Recursos

- Debe existir música específica para el epílogo: instrumental, cálida y
  contenida; puede reutilizar o reinterpretar el tema principal.
- No se requieren ilustraciones completas ni cinemáticas nuevas.
- Se reutiliza la Plaza del Axioma; puede añadirse iluminación de
  amanecer y efectos ambientales discretos.
- Se reutilizan los sprites existentes cuando sea posible.
- Recursos gráficos mínimos nuevos permitidos: el mecanismo o caja, la
  novia (si aún no existe su representación), la interfaz del selector
  numérico, y las tarjetas/créditos finales.
- **La ausencia del archivo musical definitivo no debe bloquear la
  implementación técnica.**

**Decisión técnica propuesta** (tarea 12, sección 18): hoy no
existe ninguna infraestructura de audio en el repositorio (`src/` no
tiene ningún gestor de audio; `index.html` no tiene ningún elemento
`<audio>`; no hay dependencias de audio en `package.json`). Implementar
la música del epílogo requiere, como parte de esa misma tarea, un
mecanismo mínimo de reproducción usando `HTMLAudioElement` nativo (sin
añadir ninguna dependencia nueva, conforme a `CLAUDE.md` → «Acciones
prohibidas»), con una ruta de recurso claramente marcada como
provisional/sustituible (por ejemplo un archivo corto en
`src/assets/audio/epilogue-theme-placeholder.ogg`, documentado como tal
en un comentario o en el propio nombre del archivo) hasta que exista el
recurso definitivo aprobado. La ausencia física del archivo, o un fallo
al reproducirlo, no debe lanzar una excepción no capturada ni bloquear
ninguna transición de escena — debe degradar de forma silenciosa y
segura, igual que ya exige la especificación aprobada («la ausencia o
fallo de audio no bloquea el recorrido», `docs/gdd/09-interfaz-ux.md` no
contradice esto para v1.0.0).

## 17. Restricciones de alcance (resumen operativo)

- No implementar otro puzle.
- No añadir finales alternativos.
- No introducir decisiones narrativas nuevas.
- No personalizar todavía nombres, fechas o mensajes privados.
- No añadir cinemáticas complejas ni ilustraciones a pantalla completa.
- No modificar el significado aprobado del teorema (sección 9).
- No cambiar la combinación provisional `7152`.
- No implementar todo el epílogo en una única tarea futura — usar
  exactamente la descomposición de la sección 18.

## 18. Descomposición en tareas para `autopilot`

Cada tarea debe ejecutarse de forma independiente con el flujo completo
de `CLAUDE.md` (`planner` → `developer` → `qa` → quality gate →
`reviewer` → commit → PR), en el orden de dependencias indicado. Ninguna
tarea de esta lista está marcada como completada en
`docs/production/V1_PRODUCTION_PLAN.md` — ver sección 19.

### 1. Estado persistente y migración de las nuevas banderas

- **Qué hace:** añade `epilogueStarted`, `giftCodeSolved`,
  `epilogueCompleted` a `GameState.reset()`, `toSaveData()` y `restore()`
  (sección 13).
- **Depende de:** nada (puede implementarse antes que el resto).
- **Criterios de aceptación:**
  - Las tres banderas existen en el estado por defecto (`false`).
  - `toSaveData()` las serializa; `restore()` las lee con `Boolean(...)`
    y valor por defecto `false`.
  - Guardados de formato `1`–`4` sin estas claves restauran las tres en
    `false` sin lanzar.
  - Un guardado de formato `4` que ya las incluya las conserva
    exactamente.
  - Pruebas unitarias nuevas en `tests/state/GameState.test.js` cubren
    ambos casos.
- **No incluye:** ninguna lógica de activación, escena ni interacción.

### 2. Desbloqueo del epílogo y actualización del objetivo/cuaderno al resolver el Archivo

- **Qué hace:** actualiza la etiqueta de `start-epilogue` en
  `OBJECTIVE_LABELS` (sección 3) y añade la entrada de cuaderno de la
  pista de la combinación (sección 4) en el mismo punto donde
  `applyArchiveCriteriaProgression` ya añade `archive-final-evidence`.
- **Depende de:** tarea 1.
- **Criterios de aceptación:**
  - Resolver el Archivo muestra en el HUD
    `"Regresa al lugar donde comenzó la demostración."`.
  - El cuaderno contiene, sin duplicados, la nueva entrada con el texto
    exacto de la sección 4.
  - No se toca ninguna consecuencia ya existente de
    `applyArchiveCriteriaProgression` (idempotencia conservada).
  - Test unitario y de progresión actualizados.

### 3. Punto interactivo del mecanismo en la Plaza

- **Qué hace:** añade el objeto `epilogue-gift-mechanism` a
  `axiom-plaza` (sección 6) y su respuesta neutra en `WorldScene.interact()`
  mientras `epilogueUnlocked` sea `false`.
- **Depende de:** tarea 1.
- **Criterios de aceptación:**
  - Test de mapa (`tests/content/WorldMaps.test.js`) prueba que el
    objeto no colisiona ni se solapa con nada, replicando
    `assertSpawnIsClear`.
  - Interactuar con el objeto antes de `epilogueUnlocked` no cambia de
    escena ni de estado.
  - No abre todavía el selector de cifras (eso es la tarea 5).

### 4. Configuración centralizada de la combinación

- **Qué hace:** crea `src/content/epilogueConfig.js` con
  `GIFT_CODE_DIGITS` (sección 5).
- **Depende de:** nada.
- **Criterios de aceptación:**
  - Un único archivo exporta la combinación.
  - Test unitario confirma la forma exacta del dato (array de 4 dígitos
    `[7, 1, 5, 2]`).

### 5. Interfaz y lógica del selector de cuatro cifras

- **Qué hace:** crea `EpilogueGiftCodeScene` (sección 7): navegación,
  ajuste de dígitos, confirmación/cancelación, registro en `src/main.js`.
- **Depende de:** tareas 3, 4.
- **Criterios de aceptación:**
  - Se completa íntegramente con teclado, reutilizando bindings
    existentes, sin tocar `InputManager.js`.
  - El estado inicial es siempre `0000`.
  - `Escape` vuelve al mundo sin modificar ningún estado persistente.
  - Ninguna parte del selector se guarda en `GameState`.
  - Pruebas unitarias de la escena (sin Canvas) para navegación y ciclo
    de dígitos.

### 6. Comportamiento de combinación incorrecta y correcta

- **Qué hace:** compara la combinación introducida contra
  `GIFT_CODE_DIGITS`; implementa las respuestas de la sección 8.
- **Depende de:** tarea 5.
- **Criterios de aceptación:**
  - Una combinación incorrecta no reinicia progreso ni penaliza, y
    remite al cuaderno/pistas.
  - La combinación correcta muestra el texto exacto
    `"COMBINACIÓN DEL CANDADO REAL"` / `"7 · 1 · 5 · 2"`, estable hasta
    confirmación explícita.
  - `giftCodeSolved` pasa a `true` una sola vez.
  - Pruebas unitarias cubren ambos casos y la idempotencia.

### 7. Persistencia y restauración de `giftCodeSolved`

- **Qué hace:** implementa la sección 14 — cargar una partida con
  `giftCodeSolved=true` y `epilogueCompleted=false` continúa directamente
  hacia el encuentro final sin reabrir el selector.
- **Depende de:** tareas 1, 6.
- **Criterios de aceptación:**
  - Test de `GameState`/`WorldScene` que carga ese estado exacto y
    confirma que no se reabre `epilogue-gift-code`.
  - No se repite ninguna consecuencia de la tarea 6.

### 8. Estado visual de amanecer en la Plaza

- **Qué hace:** variante visual de `axiom-plaza` derivada de
  `giftCodeSolved` (sección 11).
- **Depende de:** tarea 6.
- **Criterios de aceptación:**
  - El cambio visual solo depende de `giftCodeSolved`, sin bandera
    nueva.
  - No modifica geometría, colisiones ni objetos del mapa.
  - Prueba manual o de render documentada (no requiere snapshot
    de píxeles exacto).

### 9. Aparición e interacción con la novia

- **Qué hace:** objeto `bride-epilogue` (sección 11), visible e
  interactuable solo con `giftCodeSolved=true`, mediante el mecanismo
  declarativo `requiresFlag` (o el que decida el `planner` de esa tarea).
- **Depende de:** tareas 6, 8.
- **Criterios de aceptación:**
  - Test de mapa análogo al de la tarea 3.
  - El objeto no aparece ni es interactuable antes de `giftCodeSolved`.
  - Interactuar con ella dispara el diálogo final (tarea 10).

### 10. Diálogo final aprobado

- **Qué hace:** implementa el diálogo exacto de la sección 10 mediante
  `UiController.beginDialogue()`.
- **Depende de:** tarea 9.
- **Criterios de aceptación:**
  - El texto coincide exactamente con la sección 10 (o una revisión
    autorizada que conserve las mismas ideas, ver nota de esa sección).
  - Al completarse, encadena hacia el cierre (tarea 11 en adelante).

### 11. Pantalla inequívoca con la combinación del candado real

- **Qué hace:** aunque descrita junto a la tarea 6, si la implementación
  la separa por claridad de UI, esta tarea cubre específicamente que la
  pantalla de la sección 8 permanezca hasta confirmación explícita y sea
  legible a 480×270.
- **Depende de:** tarea 6.
- **Criterios de aceptación:** igual que el segundo bloque de la tarea 6;
  puede fusionarse con ella si el `planner` correspondiente lo considera
  más simple.

### 12. Música del epílogo con recurso sustituible

- **Qué hace:** mecanismo mínimo de reproducción de audio (sección 16)
  y su disparo al entrar en la secuencia final.
- **Depende de:** tarea 10 (o puede adelantarse de forma independiente).
- **Criterios de aceptación:**
  - No añade dependencias nuevas.
  - Un archivo de audio ausente o que falle al reproducirse no lanza
    ninguna excepción sin capturar ni bloquea ninguna transición.
  - El recurso usado está claramente marcado como provisional.

### 13. Tarjetas finales y créditos

- **Qué hace:** `CreditsScene` (sección 12): frase final, título,
  tarjeta de dedicatoria genérica, créditos.
- **Depende de:** tarea 10.
- **Criterios de aceptación:**
  - Los tres textos coinciden exactamente con la sección 12.
  - No reutiliza ni anticipa el marcador `{{FINAL_DEDICATION}}`
    personalizado.
  - Al terminar, establece `epilogueCompleted = true` una sola vez.

### 14. Retorno seguro al menú

- **Qué hace:** al terminar los créditos, `scenes.change("title")`; y la
  conducta de carga de una partida completada (sección 15).
- **Depende de:** tareas 1, 13.
- **Criterios de aceptación:**
  - Terminar los créditos vuelve siempre a `"title"`.
  - Cargar una partida con `epilogueCompleted=true` restaura en
    `"world"`/`axiom-plaza` (amanecer), nunca reproduce los créditos
    automáticamente.
  - Test de `GameState`/e2e que carga ese estado y confirma la ausencia
    de cualquier transición automática hacia `"credits"`.

### 15. Pruebas unitarias, de contenido y E2E del recorrido completo

- **Qué hace:** cierra huecos de cobertura no cubiertos por los
  criterios de aceptación de las tareas 1–14 individualmente; añade al
  menos una prueba Playwright que recorra, con teclado y desde un
  guardado con el Archivo ya resuelto, el camino completo: volver a la
  Plaza, abrir el mecanismo, fallar una combinación, acertarla, ver la
  pantalla del candado, hablar con la novia, completar el diálogo, ver
  el cierre y los créditos, y volver al título — siguiendo el mismo
  patrón ya establecido en `tests/e2e/game.spec.js` (verificación por
  DOM para diálogos, `expect.poll` sobre `canvas.toDataURL()` para
  transiciones, sin `page.waitForTimeout`).
- **Depende de:** tareas 1–14.
- **Criterios de aceptación:** los ya descritos en cada tarea anterior,
  más un recorrido E2E único de extremo a extremo sin errores de
  consola.

### 16. Revisión manual de duración, legibilidad, audio y empaquetado

- **Qué hace:** validación manual no automatizable: duración real
  (5–7 minutos), legibilidad a 480×270, comportamiento con y sin el
  archivo de audio definitivo, y que el epílogo no rompe el build web
  estático ni ningún flujo de guardado existente.
- **Depende de:** tarea 15.
- **Criterios de aceptación:** documentados como checklist manual, no
  automatizable por su propia naturaleza; debe ejecutarse antes de
  marcar el epílogo como completo en `docs/production/V1_PRODUCTION_PLAN.md`.

## 19. Actualización de `V1_PRODUCTION_PLAN.md`

Este documento por sí solo **no marca ninguna casilla de implementación**
como completada — solo introduce, en la Fase 3 de
`docs/production/V1_PRODUCTION_PLAN.md`, referencias a esta especificación
y una nota de estado para que las 16 tareas de la sección 18 puedan
seleccionarse una a una en futuras ejecuciones de `autopilot`. Ver el
diff de ese archivo en esta misma Pull Request.
</content>
