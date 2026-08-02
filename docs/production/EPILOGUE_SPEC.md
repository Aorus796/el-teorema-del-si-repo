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
   con la pista de la combinación, consumiendo `GIFT_CODE_CLUE_LINES`
   (sección 5) en vez de un texto literal aparte. Título propuesto:
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

Este texto se centraliza como `GIFT_CODE_CLUE_LINES` (sección 5), junto a
la propia combinación — no se escribe de forma literal en la lógica de la
entrada de cuaderno (tarea 2, sección 18).

## 5. Configuración centralizada de la combinación

**Decisión técnica propuesta** (tarea 4, sección 18): un único módulo,
por ejemplo `src/content/epilogueConfig.js`, centraliza todo el contenido
que depende de la combinación aprobada — no solo los dígitos:

```js
export const GIFT_CODE_DIGITS = Object.freeze([7, 1, 5, 2]);

export const GIFT_CODE_CLUE_LINES = Object.freeze([
  "Siete caminos parecían posibles.",
  "Uno nunca lo fue.",
  "Cinco nombres recuperaron su lugar.",
  "Solo dos verdades resistieron al Archivo.",
]);
```

Ningún otro archivo de `src/` (lógica del selector, comparación de la
combinación, texto de la pantalla de acierto, entrada de cuaderno) debe
repetir los dígitos ni las líneas de la pista de forma literal; todos
deben importar estas constantes. Cambiar la combinación o su pista en el
futuro se reduce a editar este único archivo.

La representación visual de la pantalla de acierto (`"7 · 1 · 5 · 2"`,
sección 8) se **deriva** de `GIFT_CODE_DIGITS` en tiempo de ejecución
(por ejemplo `GIFT_CODE_DIGITS.join(" · ")`), nunca como una segunda
cadena literal escrita aparte. La lógica de producción no debe contener
ninguna segunda copia de los dígitos ni del texto de la pista.

Esta regla se aplica solo a `src/`. Este documento, sus ejemplos, los
comentarios de código y los propios tests sí pueden y deben mostrar el
valor aprobado de forma literal (`7152`, `"7 · 1 · 5 · 2"`, el texto
completo de la pista) para que quede claro qué se está verificando — la
prohibición de repetición es sobre el comportamiento de producción, no
sobre la documentación ni sobre las aserciones de las pruebas, que deben
poder citar el valor exacto para comprobarlo.

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
- Si `giftCodeSolved` es `true` (incluido cuando `epilogueCompleted`
  también lo es): `interact()` abre la pantalla «COMBINACIÓN DEL CANDADO
  REAL» (sección 8) en un **modo de solo lectura** — la misma
  combinación derivada de `GIFT_CODE_DIGITS` (sección 5), sin volver a
  pedir en ningún caso que se introduzcan las cuatro cifras. Confirmar o
  cancelar desde esa pantalla vuelve al mundo sin modificar ninguna
  bandera, el `objectiveId` ni ningún otro progreso — es una consulta,
  no una reapertura del selector de la tarea 5. Esta es la decisión
  cerrada (sección 8, «Reconsulta en modo de solo lectura»); sustituye a
  la ambigüedad anterior entre reabrir el selector en solo lectura o no
  ofrecer ninguna acción.

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
| `Escape` | `cancel` | Cancela y vuelve al mundo. |

`Escape` no modifica `giftCodeSolved` ni ninguna otra bandera, ni guarda
los dígitos transitorios. `epilogueStarted` no se ve afectada por
`Escape`: ya quedó establecida (una sola vez) al **entrar** en la
escena, no al cancelarla (sección 6); ver la tarea 5 (sección 18) para
el detalle exacto de esta secuencia.

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

  La segunda línea se deriva de `GIFT_CODE_DIGITS` (sección 5) en tiempo
  de ejecución; no es una cadena literal duplicada en la escena.

- Esta pantalla permanece hasta una confirmación explícita del jugador
  (por ejemplo `Enter` o `E`/`interact`, a definir en implementación) —
  no se cierra sola ni por temporizador.
- Tras confirmar, la escena vuelve al mundo. La Plaza adopta la
  presentación de amanecer (sección 11) y el objetivo cambia (ver más
  abajo).

**Objetivo tras resolver:** se propone un identificador nuevo,
`epilogue-meet-bride`, con etiqueta `"Acércate a ella en la Plaza."`,
asignado en el mismo punto en que `giftCodeSolved` pasa a `true`.

### Reconsulta en modo de solo lectura

Una vez `giftCodeSolved` es `true` (incluido tras `epilogueCompleted`),
volver a interactuar con `epilogue-gift-mechanism` (sección 6) abre esta
misma pantalla («COMBINACIÓN DEL CANDADO REAL» / `"7 · 1 · 5 · 2"`,
derivada de `GIFT_CODE_DIGITS`) en un **modo de solo lectura**: sin la
comparación de la subsección anterior, sin cambiar ninguna bandera, el
`objectiveId` ni ningún otro progreso. Confirmar o cancelar desde esta
reconsulta vuelve al mundo. El selector de cuatro cifras (sección 7) no
vuelve a mostrarse nunca después de `giftCodeSolved=true` — esta es la
decisión cerrada que sustituye a la ambigüedad anterior sobre el
comportamiento del mecanismo tras resolverlo.

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

**Decisión técnica propuesta — aparición (tarea 9, sección 18):** un
objeto NPC nuevo en `AXIOM_PLAZA.objects`, `id` propuesto
`bride-epilogue`, `type: "npc"`, en una posición transitable, accesible
y sin solapes (mismo requisito de test de mapa que la sección 6). La
tarea 9 cubre exclusivamente su aparición condicionada, renderizado,
posición y accesibilidad — **no** implementa todavía su diálogo (eso es
la tarea 10).

Como el objeto vive en datos estáticos (`worldMaps.js`) pero solo debe
ser visible y accesible después de `giftCodeSolved`, se propone una
convención declarativa nueva y genérica en la forma del objeto: un campo
opcional `requiresFlag` (por ejemplo `requiresFlag: "giftCodeSolved"`),
que `WorldScene.js` consulta tanto en `findNearbyObject()`/el bucle de
interacción como en `renderObjects()` para omitir el objeto por completo
mientras la bandera indicada sea `false`. Es una generalización mínima y
reutilizable (no un caso especial hardcodeado por `id`), coherente con
cómo ya se gatean otras interacciones por bandera dentro de `interact()`
— pero al tratarse de un cambio en la lógica compartida de
`WorldScene.js` (no solo en datos), debe revisarse explícitamente en el
`planner`/`reviewer` de esa tarea antes de darse por buena.

**Decisión técnica propuesta — interacción y diálogo (tarea 10, sección
18):** el manejador de `interact()` para `bride-epilogue` (añadido en
esta tarea, no en la 9) hace `syncPlayerState()` y arranca el diálogo
final (sección 10) mediante `UiController.beginDialogue()`, con la
guarda de `epilogueCompleted` descrita en la sección 15 («Estado
terminal sin objetivo ni diálogo pendientes»). Al completarse el diálogo
(`onComplete`), la tarea 10 debe exponer o ejecutar la transición hacia
el cierre — es decir, iniciar la música (tarea 12) y encadenar hacia la
escena de créditos (tarea 13) — **no** hacia la pantalla de la
combinación del candado (tarea 11), que ya ocurrió cronológicamente
antes, al resolver el mecanismo (sección 8).

### Estado visual de amanecer

**Decisión técnica propuesta** (tarea 8, sección 18): la presentación de
amanecer de `axiom-plaza` se deriva puramente de `giftCodeSolved` (sin
bandera visual nueva) — evita duplicar estado que ya existe. Alcance
mínimo: iluminación/paleta de amanecer y, opcionalmente, efectos
ambientales discretos ya mencionados en la especificación aprobada; sin
nuevos assets grandes ni cambios de geometría del mapa.

## 12. Cierre

*(Contenido narrativo cerrado.)*

La secuencia de cierre avanza **únicamente** mediante la misma acción de
interacción/confirmación ya usada en el resto del juego (`interact`/
`startPuzzleAttempt`, según defina la implementación) — sin
temporizadores obligatorios ni avance automático. El jugador controla el
ritmo de cada tarjeta.

Orden exacto:

1. **Plano de cierre:** un breve plano — sin cinemática compleja ni
   ilustraciones nuevas, reutilizando el mapa `axiom-plaza` y los
   sprites existentes — muestra al protagonista y a la novia juntos en
   la Plaza del Axioma al amanecer, con una composición o movimiento
   mínimo (por ejemplo, ambos personajes caminando juntos hacia una
   salida de la Plaza) que indique que se encaminan hacia la boda, y la
   última frase:

   > No existe un sí para siempre. Existen dos personas que pueden
   > volver a elegirse cada día.

2. **Título:**

   > EL TEOREMA DEL SÍ

3. **Tarjeta de dedicatoria:**

   > Por todos los síes que aún quedan por elegir.

4. **Créditos genéricos** (texto exacto, sin nombres ni fechas):

   ```text
   CREADO CON CARIÑO
   COMO REGALO DE BODA

   GRACIAS POR JUGAR
   ```

5. **Tarjeta final:**

   > Pulsa para guardar y volver al menú

Todos los textos deben ser legibles a 480×270. Ninguno de ellos —
incluidos los créditos y la tarjeta final— incluye nombres, fechas ni la
dedicatoria personalizada futura.

**Nota de consistencia con `CODEX_HANDOFF.md`:** la tarjeta de
dedicatoria (paso 3) es distinta y anterior a la dedicatoria
personalizada prevista para más adelante (marcador
`{{FINAL_DEDICATION}}`, con los nombres reales de la pareja). No deben
mezclarse: la tarjeta de esta sección es el texto genérico aprobado para
`v1.0.0` sin personalizar; la dedicatoria personalizada es trabajo
futuro explícitamente fuera de alcance de esta tarea (`CODEX_HANDOFF.md`
→ «Personalización futura», paso 4 de «Orden de trabajo posterior»).

Confirmar la tarjeta final (paso 5) solicita a la tarea 14 la transición
terminal y el autoguardado bloqueante descritos en la sección 15. Solo
un guardado exitoso cambia a la escena `"title"`; un fallo mantiene esta
misma tarjeta final visible y permite reintentar (sección 15).

**Decisión técnica propuesta** (tarea 13, sección 18): una escena nueva,
por ejemplo `src/scenes/CreditsScene.js` (registrada como `"credits"`),
que presenta en secuencia los cinco pasos anteriores, avanzando solo por
confirmación del jugador. Esta escena presenta la secuencia visual y de
texto, y expone la acción de confirmación de la tarjeta final — **no**
es responsable de marcar `epilogueCompleted`, guardar la partida ni
decidir el retorno al título: esa transición atómica completa es
responsabilidad de la tarea 14 (sección 15).

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

### Invariantes obligatorias entre banderas

Las cuatro banderas del epílogo, además de ser monótonas (sección 14),
forman una cadena de implicación lógica estricta:

```text
epilogueUnlocked   ⟹ investigationComplete
epilogueStarted    ⟹ epilogueUnlocked
giftCodeSolved     ⟹ epilogueStarted
epilogueCompleted  ⟹ giftCodeSolved
```

`GameState.restore()` debe comprobar estas cuatro implicaciones como
parte de la validación estructural de las banderas, en la misma fase de
construcción de variables locales que ya usa hoy para el resto de la
validación atómica (`src/state/GameState.js`, el mismo patrón usado para
`formatVersion`, `libraryCatalogue` y `archiveCriteria`: construir y
validar todo antes de mutar `this`). Un guardado que viole cualquiera de
las cuatro implicaciones debe **rechazarse como inválido de forma
atómica** — lanzar antes de tocar `this`, dejando el estado previo de
`GameState` completamente intacto, igual que ya hace la validación de
`formatVersion` o de los campos exactos de `libraryCatalogue`/
`archiveCriteria`. No se «repara» silenciosamente una combinación
imposible (por ejemplo, forzando `epilogueUnlocked = true` cuando
`epilogueStarted` ya llegó en `true` pero `epilogueUnlocked` llegó en
`false`) — eso ocultaría una corrupción de guardado real en vez de
rechazarla.

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
restaurará como `false` sin lanzar ni requerir ninguna lista nueva —
las cuatro invariantes anteriores se cumplen trivialmente cuando todo
está en `false`. Comprobar esas invariantes tampoco requiere una lista
de formatos legado adicional: es una validación cruzada entre campos que
vive enteramente dentro de la lógica de `restore()`, no ligada a
`formatVersion`. Si en la implementación aparece una razón real para
incrementar la versión de todos modos (por ejemplo, si se decide añadir
un sub-objeto adicional no previsto aquí), debe tratarse como una
decisión técnica explícita de esa tarea, no como algo ya decidido por
este documento.

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

## 15. Transición final y conducta de una partida ya completada (decisión técnica explícita)

### Transición atómica al terminar los créditos

Al confirmar la tarjeta final de créditos («Pulsa para guardar y volver
al menú», sección 12) mediante la misma acción de interacción/
confirmación ya usada en el resto de la escena (tarea 14, no la 13 — ver
más abajo por qué), debe ejecutarse la siguiente secuencia:

1. Se preparan en memoria, sobre el `GameState` actual, los cambios
   terminales: `epilogueCompleted` pasa a `true` (una sola vez; si ya
   era `true` por un reintento anterior, no se repite ningún efecto
   adicional); se establece un estado terminal coherente en
   `world`/`axiom-plaza` (`scene = "world"`,
   `world.currentMapId = "axiom-plaza"`); se sincronizan el alias raíz
   `player` y `world.playerByMap` con la posición final válida (ver
   «Posición al restaurar una partida completada» más abajo), usando el
   mismo mecanismo que ya mantiene ambos sincronizados
   (`src/state/GameState.js`) — no se introduce un mecanismo nuevo de
   sincronización; y se elimina el objetivo pendiente
   `epilogue-meet-bride`, sustituido por el identificador terminal
   `epilogue-completed` con etiqueta propuesta
   `"La demostración ha terminado."` — la representación terminal
   mínima compatible con la arquitectura actual, ya que `WorldScene`
   siempre requiere un `objectiveId` con etiqueta (`OBJECTIVE_LABELS`)
   y hoy no existe ningún estado «sin objetivo». Estos cambios
   preparados en memoria **no** se consideran persistidos todavía — ver
   el punto 3.
2. Se intenta guardar con el mismo `StorageAdapter` ya usado por
   `WorldScene.save()`, capturando cualquier error dentro de un
   `try/catch` propio, sin dejar escapar ninguna excepción sin
   capturar.
3. **Si el guardado tiene éxito**, solo entonces se ejecuta
   `scenes.change("title")`. El recorrido se considera persistido y
   terminado exactamente en este punto, no antes: mientras el guardado
   no se ha confirmado, el jugador permanece en `CreditsScene` aunque
   `GameState` ya tenga los cambios terminales preparados en memoria
   desde el paso 1.
4. **Si el guardado falla**, la transición se detiene por completo:
   - `CreditsScene` permanece en la tarjeta final («Pulsa para guardar y
     volver al menú»), sin avanzar a `"title"`;
   - se muestra un mensaje visible y estable:
     `"No se pudo guardar el final. Vuelve a intentarlo."`;
   - la misma acción de confirmación permite reintentar: el reintento
     repite únicamente el paso 2 (el guardado); la preparación en
     memoria del paso 1 ya es idempotente y no se rehace;
   - el guardado anterior en `localStorage` (el último guardado válido
     previo a esta transición) no se sobrescribe ni queda en un estado
     parcial o corrupto — un intento fallido de `StorageAdapter.save()`
     debe dejar `localStorage` exactamente como estaba antes del
     intento, el mismo requisito de atomicidad que esta especificación
     ya exige (sección 13) para `GameState.restore()`.

Esta secuencia completa es responsabilidad de la **tarea 14**, no de la
tarea 13. `CreditsScene` (tarea 13) se limita a presentar los cinco
pasos de la sección 12 y a exponer la acción de confirmación de la
tarjeta final; no debe afirmar por sí sola que completa ni persiste el
epílogo — esa responsabilidad, incluida la propia transición de
`epilogueCompleted` y el guardado bloqueante con reintento, pertenece
íntegramente a la tarea 14, que orquesta el paso de «tarjeta final
confirmada» a «vuelta al título» de forma atómica y solo tras un
guardado exitoso.

### Posición al restaurar una partida completada

Para `epilogueCompleted = true`, la partida debe restaurarse siempre en
una posición **válida** de `axiom-plaza`:

- Si la posición guardada en `world.playerByMap["axiom-plaza"]` es
  válida (numéricamente finita y con una orientación reconocida), se
  conserva tal cual — no se fuerza una posición fija distinta de donde
  el jugador terminó la partida.
- Si no es válida (guardado corrupto o incompleto), se usa el spawn
  seguro por defecto de `axiom-plaza`
  (`DEFAULT_PLAYER_BY_MAP["axiom-plaza"]`, `src/state/GameState.js`) —
  el mismo mecanismo de reserva que `normalizePlayerState()` ya aplica
  hoy a cualquier posición inválida, sin necesitar lógica nueva.
- El alias raíz `player` y `world.playerByMap` deben quedar
  sincronizados tras la restauración — ya lo garantiza
  `GameState.restore()` actual (`this.player =
  readPlayerStateFromWorld(world)`, ejecutado después de construir
  `world`); esta especificación no introduce una segunda fuente de
  verdad para la posición.
- `world.currentMapId` se fuerza a `"axiom-plaza"` para cualquier
  guardado con `epilogueCompleted = true`, con independencia de lo que
  contenga literalmente ese campo — es una corrección defensiva, no un
  rechazo: a diferencia de las cuatro invariantes de banderas (sección
  13, que si se violan rechazan el guardado), aquí el objetivo es que
  una partida completada sea siempre jugable en la Plaza, incluso ante
  un dato de mapa inconsistente.

### Estado terminal sin objetivo ni diálogo pendientes

Una partida con `epilogueCompleted = true` **no** debe:

- mostrar como objetivo visible `"Acércate a ella en la Plaza."`
  (`epilogue-meet-bride`) — ya fue sustituido por `epilogue-completed`
  en el paso 4 de la transición atómica anterior;
- volver a ofrecer el diálogo final al interactuar con `bride-epilogue`.

**Decisión técnica propuesta:** el manejador de interacción con
`bride-epilogue` (tarea 10) debe comprobar `state.flags.epilogueCompleted`
antes de iniciar el diálogo. Si ya es `true`, la interacción no reabre
`UiController.beginDialogue()` con el núcleo aprobado (sección 10) — se
limita, como máximo, a una respuesta neutra sin contenido narrativo
nuevo (mismo patrón ya usado para el mecanismo antes de
`epilogueUnlocked`, sección 6), o directamente no ofrece ningún prompt de
interacción. `bride-epilogue` sigue siendo visible (su renderizado
permanece gobernado por `giftCodeSolved`, tarea 9, que ya es `true` en
este punto) — lo que cambia es exclusivamente si su interacción puede
volver a disparar el diálogo, no su presencia visual en la escena final
ya vista.

### Conducta al cargar una partida ya completada

La especificación aprobada exige que **no exista ningún bucle que
reproduzca automáticamente los créditos al cargar una partida
completada**, y pide que la conducta exacta quede documentada como
decisión técnica antes de implementarse, recomendando la opción mínima
compatible con la arquitectura actual.

**Decisión recomendada:** cuando `epilogueCompleted === true`, cargar la
partida (`KeyL`, tanto desde el título como desde dentro del mundo) debe
restaurar siempre en la escena `"world"`, en el mapa `axiom-plaza`, en la
posición descrita arriba, con el objetivo terminal `epilogue-completed`
— **nunca** en `"epilogue-gift-code"` ni en `"credits"`. La partida queda
jugable en un estado terminal estable: el jugador puede moverse por la
Plaza, abrir el cuaderno y volver a guardar, pero no hay ya ninguna
secuencia que se reproduzca sola.

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
  Plaza; la única diferencia es si la novia sigue ofreciendo el diálogo
  final (no completada) o ya no lo ofrece (completada, ver «Estado
  terminal sin objetivo ni diálogo pendientes» más arriba).

Si una implementación futura decide en cambio que una partida completada
deba poder «volver a ver» los créditos bajo demanda (por ejemplo, una
opción explícita en el menú, no automática), eso sería una ampliación de
alcance nueva y debe tratarse como tal, no como parte de esta tarea.

### Verificación exigida

Debe existir al menos una prueba (unitaria o E2E, tarea 14/15) que:

- guarde o siembre una partida con `epilogueCompleted = true` y lea de
  vuelta el guardado en `localStorage` confirmando ese valor exacto;
- cargue esa partida y confirme que la escena resultante es `"world"` en
  `axiom-plaza`, sin ningún cambio de escena posterior hacia `"credits"`
  ni ninguna reproducción de la secuencia de créditos;
- simule un fallo de `StorageAdapter` en la confirmación de la tarjeta
  final de créditos y confirme que la escena permanece en `"credits"`,
  que se muestra el mensaje `"No se pudo guardar el final. Vuelve a
  intentarlo."`, y que un reintento posterior con `StorageAdapter`
  funcionando completa la transición hacia `"title"`.

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
  (sección 13), incluida la validación atómica de las cuatro invariantes
  de implicación entre banderas (sección 13, «Invariantes obligatorias
  entre banderas»).
- **Depende de:** nada (puede implementarse antes que el resto).
- **Criterios de aceptación:**
  - Las tres banderas existen en el estado por defecto (`false`).
  - `toSaveData()` las serializa; `restore()` las lee con `Boolean(...)`
    y valor por defecto `false`.
  - Guardados de formato `1`–`4` sin estas claves restauran las tres en
    `false` sin lanzar (las cuatro invariantes se cumplen trivialmente
    con todo en `false`).
  - Un guardado de formato `4` que ya incluya una combinación válida de
    las cuatro banderas (por ejemplo, la cadena completa hasta
    `epilogueCompleted=true`) la conserva exactamente.
  - Un guardado con una combinación imposible según las invariantes de
    la sección 13 (por ejemplo `epilogueStarted=true` con
    `epilogueUnlocked=false`, o `epilogueCompleted=true` con
    `giftCodeSolved=false`) hace que `restore()` lance, sin excepción
    silenciada.
  - Tras un `restore()` fallido por una invariante violada, el estado
    previo del `GameState` (mapa, posición, banderas, cuaderno, puzles)
    permanece exactamente igual que antes de la llamada — mismo patrón
    de atomicidad ya verificado en `tests/state/GameState.test.js` para
    los rechazos de formato existentes.
  - Pruebas unitarias nuevas en `tests/state/GameState.test.js` cubren
    los cinco casos anteriores.
- **No incluye:** ninguna lógica de activación, escena ni interacción.

### 2. Desbloqueo del epílogo y actualización del objetivo/cuaderno al resolver el Archivo

- **Qué hace:** actualiza la etiqueta de `start-epilogue` en
  `OBJECTIVE_LABELS` (sección 3) y añade la entrada de cuaderno con la
  pista de la combinación, consumiendo `GIFT_CODE_CLUE_LINES` (sección 5)
  en vez de un texto literal, en el mismo punto donde
  `applyArchiveCriteriaProgression` ya añade `archive-final-evidence`.
- **Depende de:** tareas 1 y 4 (necesita las banderas de la tarea 1 y la
  pista centralizada de la tarea 4).
- **Criterios de aceptación:**
  - Resolver el Archivo muestra en el HUD
    `"Regresa al lugar donde comenzó la demostración."`.
  - El cuaderno contiene, sin duplicados, la nueva entrada con el texto
    exacto de `GIFT_CODE_CLUE_LINES` (sección 4), no un literal aparte.
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
  `GIFT_CODE_DIGITS` y `GIFT_CODE_CLUE_LINES` (sección 5).
- **Depende de:** nada.
- **Criterios de aceptación:**
  - Un único archivo exporta ambos datos.
  - Test unitario confirma la forma exacta de `GIFT_CODE_DIGITS`
    (array de 4 dígitos `[7, 1, 5, 2]`) y de `GIFT_CODE_CLUE_LINES` (las
    cuatro líneas exactas de la sección 4).
  - Ningún otro archivo de `src/` repite los dígitos ni las líneas de la
    pista de forma literal (comprobable por inspección del diff en
    `reviewer`).

### 5. Interfaz y lógica del selector de cuatro cifras

- **Qué hace:** crea `EpilogueGiftCodeScene` (sección 7): navegación,
  ajuste de dígitos, confirmación/cancelación, registro en `src/main.js`.
  Al entrar en la escena por primera vez (`epilogueStarted` todavía
  `false`), la propia escena establece `epilogueStarted = true` antes de
  mostrar la interfaz (sección 6) — una sola vez; en entradas
  posteriores no vuelve a escribirla porque ya es `true`.
- **Depende de:** tareas 1, 3, 4.
- **Criterios de aceptación:**
  - Se completa íntegramente con teclado, reutilizando bindings
    existentes, sin tocar `InputManager.js`.
  - Entrar por primera vez establece `epilogueStarted = true`; entrar de
    nuevo con `epilogueStarted` ya `true` no repite ningún efecto.
  - El estado inicial de los dígitos es siempre `0000`, tanto en la
    primera entrada como en cualquier reentrada — el selector nunca
    reconstruye una combinación a medio introducir.
  - `Escape` vuelve al mundo sin cambiar `giftCodeSolved` ni ninguna
    otra bandera del epílogo; `epilogueStarted` permanece `true` (ya
    quedó establecida al entrar, no la modifica `Escape`).
  - Ninguna parte del estado transitorio del selector
    (`focusedDigitIndex`, `digits`) se guarda en `GameState`, ni al
    cancelar ni al confirmar.
  - Pruebas unitarias de la escena (sin Canvas) para navegación, ciclo
    de dígitos, el establecimiento de `epilogueStarted` en la primera
    entrada, y la ausencia de cambios de estado al cancelar.

### 6. Comportamiento de combinación incorrecta y correcta

- **Qué hace:** compara la combinación introducida contra
  `GIFT_CODE_DIGITS`; implementa las respuestas de la sección 8.
- **Depende de:** tarea 5.
- **Criterios de aceptación:**
  - Una combinación incorrecta no reinicia progreso ni penaliza, y
    remite al cuaderno/pistas.
  - La combinación correcta muestra el texto exacto
    `"COMBINACIÓN DEL CANDADO REAL"` / `"7 · 1 · 5 · 2"`, esta última
    derivada de `GIFT_CODE_DIGITS` (sección 5, tarea 4) y no repetida de
    forma literal, estable hasta confirmación explícita.
  - `giftCodeSolved` pasa a `true` una sola vez.
  - Esta misma pantalla se reutiliza, sin duplicar lógica, para la
    reconsulta en modo de solo lectura tras `giftCodeSolved=true`
    (sección 8, «Reconsulta en modo de solo lectura»; implementación
    completa de la reconsulta en la tarea 11).
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

### 9. Aparición de la novia en la Plaza

- **Qué hace:** objeto `bride-epilogue` (sección 11): aparición
  condicionada, renderizado, posición y accesibilidad, mediante el
  mecanismo declarativo `requiresFlag` (o el que decida el `planner` de
  esa tarea). **No** implementa su interacción ni su diálogo — eso es la
  tarea 10.
- **Depende de:** tareas 6, 8.
- **Criterios de aceptación:**
  - Test de mapa análogo al de la tarea 3.
  - El objeto no aparece ni es accesible antes de `giftCodeSolved`.
  - No añade ningún manejador de `interact()` para `bride-epilogue`
    todavía — esa lógica es explícitamente responsabilidad de la tarea
    10.

### 10. Interacción con la novia y diálogo final aprobado

- **Qué hace:** añade el manejador de `interact()` para
  `bride-epilogue` (`syncPlayerState()` + `UiController.beginDialogue()`
  con el texto exacto de la sección 10), incluida la guarda de
  `epilogueCompleted` (sección 15, «Estado terminal sin objetivo ni
  diálogo pendientes») que impide reabrir el diálogo en una partida ya
  completada.
- **Depende de:** tarea 9.
- **Criterios de aceptación:**
  - El texto coincide exactamente con la sección 10 (o una revisión
    autorizada que conserve las mismas ideas, ver nota de esa sección).
  - Interactuar con `bride-epilogue` antes de `epilogueCompleted` abre
    el diálogo; interactuar después no lo reabre (sección 15).
  - Al completarse el diálogo por primera vez, se expone o ejecuta la
    transición hacia la música (tarea 12) y los créditos (tarea 13) —
    no hacia la pantalla de la combinación (tarea 11), que ya ocurrió
    antes en el recorrido.

### 11. Pantalla inequívoca con la combinación del candado real

- **Qué hace:** aunque descrita junto a la tarea 6, si la implementación
  la separa por claridad de UI, esta tarea cubre específicamente que la
  pantalla de la sección 8 permanezca hasta confirmación explícita y sea
  legible a 480×270. Ocurre cronológicamente al resolver el mecanismo,
  **antes** del encuentro con la novia (tareas 9–10), no después.
  También implementa la reconsulta en modo de solo lectura (sección 8,
  «Reconsulta en modo de solo lectura»): interactuar con
  `epilogue-gift-mechanism` (sección 6) con `giftCodeSolved=true`
  (incluido `epilogueCompleted=true`) reabre esta misma pantalla sin
  comparar nada ni modificar ningún estado.
- **Depende de:** tarea 6.
- **Criterios de aceptación:**
  - Igual que el segundo bloque de la tarea 6; puede fusionarse con ella
    si el `planner` correspondiente lo considera más simple.
  - Con `giftCodeSolved=true`, interactuar con el mecanismo abre la
    pantalla en modo de solo lectura, sin repetir la comparación de la
    tarea 6.
  - Confirmar o cancelar desde el modo de solo lectura no modifica
    ninguna bandera, el `objectiveId` ni ningún otro progreso.
  - El mismo comportamiento de solo lectura se mantiene con
    `epilogueCompleted=true`.
  - El selector de cuatro cifras (tarea 5) nunca vuelve a mostrarse tras
    `giftCodeSolved=true`.

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

- **Qué hace:** `CreditsScene` (sección 12): implementa los cinco pasos
  exactos (plano de cierre, título, tarjeta de dedicatoria, créditos,
  tarjeta final), avanzando únicamente mediante la acción de
  interacción/confirmación ya existente, sin temporizadores
  obligatorios. Presenta la secuencia visual y de texto, y expone la
  acción de confirmación de la tarjeta final — no marca
  `epilogueCompleted` ni decide el retorno al título (eso es la tarea
  14).
- **Depende de:** tarea 10.
- **Criterios de aceptación:**
  - Los cinco pasos aparecen en el orden exacto de la sección 12; cada
    uno avanza solo por confirmación del jugador (ninguna transición
    ocurre por temporizador).
  - El plano de cierre muestra a ambos personajes juntos en la Plaza al
    amanecer, con una composición o movimiento mínimo que indique que se
    encaminan hacia la boda, y la última frase exacta de la sección 12
    — sin cinemática compleja ni ilustraciones nuevas.
  - El título, la tarjeta de dedicatoria, el texto exacto de los
    créditos («CREADO CON CARIÑO» / «COMO REGALO DE BODA» / «GRACIAS POR
    JUGAR») y la tarjeta final («Pulsa para guardar y volver al menú»)
    coinciden exactamente con la sección 12.
  - Todos los textos son legibles a 480×270 y ninguno incluye nombres,
    fechas ni la dedicatoria personalizada futura.
  - No reutiliza ni anticipa el marcador `{{FINAL_DEDICATION}}`
    personalizado.
  - Confirmar la tarjeta final solicita a la tarea 14 la transición
    terminal (sección 15); `CreditsScene` no establece
    `epilogueCompleted`, no guarda la partida y no decide la transición
    a `"title"` por sí sola — delega esa responsabilidad y su resultado
    (éxito o reintento) en la tarea 14.

### 14. Transición atómica de cierre y retorno seguro al menú

- **Qué hace:** al confirmar la tarjeta final de `CreditsScene` (tarea
  13), ejecuta la transición bloqueante descrita en la sección 15
  («Transición atómica al terminar los créditos»): prepara en memoria
  los cambios terminales (`epilogueCompleted = true`, sincronización de
  `scene`/`currentMapId`/`player`/`playerByMap`, sustitución del
  objetivo `epilogue-meet-bride` por `epilogue-completed`), intenta
  guardar con `StorageAdapter`, y solo si el guardado tiene éxito
  ejecuta `scenes.change("title")`. Si el guardado falla, mantiene
  `CreditsScene` en la tarjeta final, muestra
  `"No se pudo guardar el final. Vuelve a intentarlo."` y permite
  reintentar con la misma acción de confirmación. También implementa la
  conducta de carga de una partida completada (sección 15, «Conducta al
  cargar una partida ya completada»).
- **Depende de:** tareas 1, 13.
- **Criterios de aceptación:**
  - Confirmar la tarjeta final con un guardado exitoso ejecuta la
    transición completa de la sección 15 y solo entonces cambia a
    `"title"`.
  - Confirmar la tarjeta final con un `StorageAdapter` que falla no
    lanza ninguna excepción sin capturar, mantiene la escena en la
    tarjeta final, muestra el mensaje exacto
    `"No se pudo guardar el final. Vuelve a intentarlo."` y no cambia a
    `"title"`.
  - Tras un guardado fallido, el guardado previo en `localStorage`
    permanece exactamente igual que antes del intento (sin
    sobrescritura parcial ni corrupción).
  - Reintentar con la misma acción de confirmación, tras un fallo
    previo, no repite la preparación en memoria (idempotente) y solo
    reintenta el guardado; un reintento exitoso completa la transición
    igual que en el primer intento.
  - El guardado resultante, tras un guardado exitoso, contiene
    `flags.epilogueCompleted === true`, `scene === "world"`,
    `world.currentMapId === "axiom-plaza"` y
    `objectiveId === "epilogue-completed"`.
  - Cargar una partida con `epilogueCompleted=true` restaura en
    `"world"`/`axiom-plaza`, en una posición válida (sección 15,
    «Posición al restaurar una partida completada»), sin reproducir los
    créditos ni reabrir el diálogo final.
  - Test de `GameState`/`WorldScene`/E2E que carga ese estado y confirma
    la ausencia de cualquier transición automática hacia `"credits"` ni
    `"epilogue-gift-code"`.
  - Prueba E2E (o de integración de escena) que simule un fallo de
    `StorageAdapter` en la confirmación de la tarjeta final, compruebe
    el mensaje visible y la permanencia en la tarjeta final, y que un
    reintento posterior con `StorageAdapter` funcionando complete la
    transición y cambie a `"title"`.

### 15. Pruebas unitarias, de contenido y E2E del recorrido completo

- **Qué hace:** cierra huecos de cobertura no cubiertos por los
  criterios de aceptación de las tareas 1–14 individualmente; añade al
  menos una prueba Playwright que recorra, con teclado y desde un
  guardado con el Archivo ya resuelto, el camino completo: volver a la
  Plaza, abrir el mecanismo, fallar una combinación, acertarla, ver la
  pantalla del candado, hablar con la novia, completar el diálogo,
  confirmar cada uno de los cinco pasos de la secuencia de créditos
  (sección 12) hasta la tarjeta final, y volver al título tras el
  guardado automático — siguiendo el mismo patrón ya establecido en
  `tests/e2e/game.spec.js` (verificación por DOM para diálogos,
  `expect.poll` sobre `canvas.toDataURL()` para transiciones, sin
  `page.waitForTimeout`).
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
