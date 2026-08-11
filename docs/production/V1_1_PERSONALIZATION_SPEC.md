# Especificación de alcance: personalización post-`v1.0.0` (`v1.1`, provisional)

Documento de **definición de alcance y especificación**, no de
implementación. No se ha escrito ni modificado ningún código de juego
como parte de esta tarea. La numeración `v1.1` es provisional — se
confirma solo cuando se apruebe este alcance; `package.json` sigue en
`1.0.0`.

## 1. Estado de `v1.0.0`

`v1.0.0` está **PUBLISHED / CLOSED / FROZEN**: integrada en `main`
(commit `ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733`), etiquetada `v1.0.0`
(tag inmutable) y publicada como GitHub Release el 2026-08-11 — ver
[`V1_RELEASE_CLOSURE.md`](V1_RELEASE_CLOSURE.md). Nada de lo que sigue
modifica esa release, su tag, su artifact ni su checksum. Los cinco
riesgos residuales aceptados de `v1.0.0` (compatibilidad A→B→A,
duración no cronometrada, pase visual dedicado, rendimiento/escalado
formal, cuatro defectos menores de nomenclatura) siguen exactamente en
el mismo estado — ver §7 para el tratamiento específico de los cuatro
defectos menores, y "Trabajo fuera de alcance" en
[`V1_RELEASE_READINESS.md`](V1_RELEASE_READINESS.md).

## 2. Objetivo de `v1.1`

Definir, sin implementar todavía, el alcance del primer ciclo de trabajo
posterior a `v1.0.0`, orientado principalmente a **personalización**
(convertir el recorrido genérico en el regalo de boda real para el que
se concibió el proyecto) y a los añadidos ya mencionados en fuentes
previas (`Max`). `v1.0.0` se publicó el 2026-08-11, con margen sobre
ambas fechas relevantes: el objetivo de entrega original (10 de
septiembre de 2026) y la boda real (26 de septiembre de 2026, dato
aprobado en §4) — hay tiempo para especificar bien antes de implementar.

Esta tarea **no** decide todavía la numeración definitiva, no cambia
`package.json`, y no implementa ninguna de las tareas propuestas en §22.

## 3. Principios

Heredados de `README.md` → "Principios del proyecto" (sin alterarlos) y
extendidos para este ciclo:

- No se inventa ningún dato personal, narrativo o de diseño que no esté
  ya explícitamente aprobado en las fuentes (§4). Todo lo que falte se
  marca `PENDIENTE DE DECISIÓN DEL RESPONSABLE` (§5), nunca se rellena
  por inferencia.
- `v1.0.0` no se reabre para "arreglar todo lo viejo" — ver §7: los
  cuatro defectos menores solo se tratan si su corrección es un
  subproducto natural del propio trabajo de personalización, no un
  objetivo en sí mismo de este ciclo.
- Preferencia arquitectónica explícita (igual que ya aplicó
  `epilogueConfig.js` para el código del candado): la personalización
  debe poder implementarse como **contenido/configuración estática**,
  consumida en tiempo de presentación, no como estado persistido nuevo
  — ver §9 y §15.
- Coherencia narrativa antes que cobertura: no se asume que un dato
  aprobado deba aparecer en todas partes solo porque está disponible
  (§6). El diálogo final ya aprobado y cerrado en
  [`EPILOGUE_SPEC.md`](EPILOGUE_SPEC.md) §10 no se reescribe por esta
  especificación — cualquier inserción de datos personales dentro de
  ese texto exacto requeriría una enmienda narrativa explícita de
  `EPILOGUE_SPEC.md`, fuera del alcance de esta tarea (ver §9).
- Personalización coherente y pulida antes que sistemas nuevos (Max) —
  criterio explícito de esta tarea, ver §13.

## 4. Datos aprobados disponibles

Extraídos literalmente de
[`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) → "Personalización futura"
(única fuente que contiene datos aprobados concretos; `AGENTS.md` y
`EPILOGUE_SPEC.md` solo remiten a ella). Ningún dato se ha modificado,
completado ni inventado:

| Campo | Valor aprobado |
|---|---|
| Protagonista | Gonzalo |
| Pareja | Elena |
| Pareja completa | Gonzalo y Elena |
| Fecha de la boda | 26 de septiembre de 2026 |
| Fecha ISO | `2026-09-26` |
| Ciudad real | Logroño |
| Pueblo ficticio (sin cambios) | Axioma |
| Compañero (perro) | Max |
| Especie | Perro |
| Raza | Pastor belga malinois |
| Tono del epílogo | Emotivo y divertido |
| Dedicatoria prevista | "Gonzalo y Elena: que nunca os falten caminos por recorrer, preguntas que resolver juntos y razones para seguir diciendo sí. Que la vida os encuentre siempre del mismo lado del puente, con Max cerca, muchas risas y la certeza de que el mejor teorema es el que se demuestra cada día: elegiros una y otra vez." |

Marcadores previstos (mismo origen): `{{PROTAGONIST_NAME}}`,
`{{PARTNER_NAME}}`, `{{COUPLE_NAMES}}`, `{{DOG_NAME}}`,
`{{DOG_SPECIES}}`, `{{DOG_BREED}}`, `{{WEDDING_DATE}}`,
`{{WEDDING_DATE_ISO}}`, `{{WEDDING_CITY}}`, `{{STORY_TOWN}}`,
`{{FINAL_DEDICATION}}`.

Contexto adicional aprobado: "Max se implementará después del epílogo
como compañero visual seguro, inicialmente sin pathfinding complejo."
(`CODEX_HANDOFF.md`). "La personalización debe centralizarse
posteriormente en un único archivo. No dispersar nombres o fechas por
las escenas." (mismo origen — ver §10).

## 5. Decisiones pendientes

Ninguna de estas se decide en esta tarea; se marcan explícitamente como
abiertas:

1. **¿Dónde se revela `{{PARTNER_NAME}}`/`{{PROTAGONIST_NAME}}` durante
   el juego, y con qué texto exacto?** El diálogo final aprobado
   (`EPILOGUE_SPEC.md` §10) no contiene ningún marcador y es contenido
   narrativo cerrado. Insertar un nombre ahí exige una enmienda
   narrativa explícita — no es una decisión técnica de esta
   especificación. **PENDIENTE DE DECISIÓN DEL RESPONSABLE.**
2. **¿El protagonista llega a nombrarse alguna vez?** Hoy el juego no
   nombra nunca al protagonista — ni en diálogo ni en narración; solo
   aparece como "Protagonista" (etiqueta de hablante) o "el
   protagonista" (texto de evidencias del Archivo). Introducir
   `{{PROTAGONIST_NAME}}` sería la primera vez que el juego nombra a su
   propio protagonista, un cambio de tono mayor que sustituir un nombre
   ya usado. **PENDIENTE DE DECISIÓN DEL RESPONSABLE.**
3. **Función exacta de Max.** Los datos aprobados dicen "compañero
   visual seguro, sin pathfinding complejo", pero no especifican si
   aparece como objeto/NPC en el mapa, en qué localización, si es
   interactivo, o si se limita a la mención textual ya incluida en la
   dedicatoria aprobada. Ver §11. **PENDIENTE DE DECISIÓN DEL
   RESPONSABLE.**
4. **Dónde (si acaso) se muestra la fecha de boda.** No hay ningún
   consumidor identificado en el contenido actual para
   `{{WEDDING_DATE}}`/`{{WEDDING_DATE_ISO}}` — ni la pantalla de
   título, ni los créditos, ni el diálogo la mencionan hoy. Ver §13.
   **PENDIENTE DE DECISIÓN DEL RESPONSABLE.**
5. **Privacidad de los datos aprobados.** Ver §17 — necesita una
   decisión explícita sobre si los nombres reales siguen versionados en
   el repositorio público tal como ya lo están hoy, o si se cambia el
   mecanismo antes de `v1.1`.
6. **Si se corrige alguno de los cuatro defectos menores de `v1.0.0`
   fuera del propio trabajo de nomenclatura de `v1.1`** (§7) — por
   defecto, no: se tratan solo los que la propia reforma resuelve de
   forma natural.

## 6. Personajes

Auditoría del estado actual real (código, no documentación):

- **NPC de la novia** (`bride-epilogue`, `src/content/worldMaps.js`):
  `label: "La Investigadora"`, visible solo con `giftCodeSolved=true`.
  El diálogo final que abre (`EPILOGUE_SPEC.md` §10) usa el hablante
  `"Novia"`, no un nombre.
- **NPC del padre** (`bride-father`, mismo archivo):
  `label: "Padre de la Investigadora"`. Los diálogos reales que dispara
  (`src/scenes/WorldScene.js`) usan el hablante `"Padre de la novia"`.
- **Novia durante el resto del juego**: nunca aparece como personaje
  jugable ni interactuable fuera de `bride-epilogue`; se la menciona en
  texto narrativo como "la novia" (objetivo, evidencias del Archivo,
  cuaderno).
- **Protagonista**: nunca nombrado (ver §5.2); aparece como
  "Protagonista" (hablante) o "el protagonista" (texto de evidencias).
- **Epílogo**: contiene el único punto narrativo cerrado que menciona
  explícitamente "novia" y "protagonista" como roles (`EPILOGUE_SPEC.md`
  §9-§10).
- **Créditos** (`src/scenes/CreditsScene.js`): texto 100% genérico, sin
  nombres — `DEDICATION_TEXT`, `CREDITS_LINE_1..3`, `FINAL_CARD_TEXT`
  son constantes de módulo, ya aisladas.
- **Max**: no existe ningún NPC, sprite ni referencia en `src/` hoy.

Clasificación pedida (A: genérico durante el juego / B: revelación
progresiva / C: solo epílogo / D: solo créditos/dedicatoria):

| Elemento | Clasificación propuesta | Justificación |
|---|---|---|
| Nombre de la novia (`{{PARTNER_NAME}}`) | **C** (solo epílogo) o **D** (solo créditos/dedicatoria) según §5.1 | El resto del juego ya la trata de forma genérica ("la novia"); revelar el nombre antes rompería el diseño actual del misterio sin necesidad. |
| Nombre del protagonista (`{{PROTAGONIST_NAME}}`) | **D** (solo dedicatoria), si se aprueba usarlo en absoluto | Ver §5.2 — nunca se ha nombrado; introducirlo en diálogo jugable sería la opción de mayor riesgo narrativo. |
| Nombre del padre de la novia | Sin dato aprobado — no se personaliza | No hay ningún nombre aprobado para este personaje en las fuentes. |
| `{{DOG_NAME}}`/`{{DOG_SPECIES}}`/`{{DOG_BREED}}` (Max) | **D** como mínimo (ya incluido en la dedicatoria aprobada); **C** o fuera del juego jugable según §5.3 | Ver §11. |
| `{{WEDDING_DATE}}` | Sin consumidor identificado — no se clasifica todavía | Ver §5.4. |
| `{{FINAL_DEDICATION}}` (texto completo) | **D** (créditos, tarjeta de dedicatoria) | Punto de integración ya anticipado explícitamente por `EPILOGUE_SPEC.md` §12 — ver §10. |

## 7. Los cuatro defectos menores de `v1.0.0`

Confirmado contra el código real (`src/content/worldMaps.js`,
`src/scenes/WorldScene.js`, `src/scenes/LibraryCatalogueScene.js:269`):

1. `"La Investigadora"` (NPC, `label`) vs `"la novia"` (objetivos,
   cuaderno, evidencias del Archivo) — **corregir como parte de `v1.1`**:
   unificar el `label` de `bride-epilogue` a `"la novia"` alinea el
   prompt de interacción (`WorldScene.js:676`, `` `[E] Hablar con
   ${object.label}` `` → `"[E] Hablar con la novia"`) con la forma en
   que el resto del juego ya la nombra en prosa. **Precisión
   importante**: esto es distinto del hablante del diálogo del epílogo,
   que usa `"Novia"` sin artículo (`EPILOGUE_SPEC.md` §10,
   `WorldScene.js`) — esa etiqueta de hablante es una convención de
   guion (igual que `"Protagonista"`) y **no se toca**; el `label` del
   objeto de mapa y el hablante del diálogo son dos campos distintos con
   convenciones distintas. Es la misma tarea de nomenclatura que ya hace
   falta para introducir `{{PARTNER_NAME}}` de forma consistente (§6) —
   no es trabajo añadido, es el mismo trabajo.
2. `"Padre de la Investigadora"` (NPC) vs `"Padre de la novia"`
   (diálogos) — **corregir como parte de `v1.1`**, mismo motivo exacto
   que el punto 1.
3. `"Biblioteca"` (nombre de mapa) vs `"Biblioteca del Margen"`
   (narrativa) — **resolver en tarea independiente**: no tiene relación
   alguna con datos personales ni con personalización; es un ajuste de
   nomenclatura de localización ficticia que puede corregirse en
   cualquier momento, dentro o fuera de este ciclo.
4. `"Fase: arranging"` sin traducir en `LibraryCatalogueScene.js` —
   **resolver en tarea independiente**, mismo motivo que el punto 3: es
   un defecto de interfaz del puzle de la Biblioteca, sin relación con
   personalización.

Ninguno de los cuatro se corrige en esta tarea (documental).

## 8. Max

Auditoría estricta de lo que las fuentes aprueban (sin inventar función
narrativa):

- **Datos aprobados**: nombre "Max", especie perro, raza pastor belga
  malinois (§4).
- **Dónde estaba previsto incorporarlo**: "después del epílogo" —
  `CODEX_HANDOFF.md` → "Orden de trabajo posterior", punto 5 (todavía
  sin implementar, correctamente, según la actualización 2026-08-11 de
  ese documento).
- **Rol aprobado**: "compañero visual seguro, inicialmente sin
  pathfinding complejo" — nada más está especificado (no se aprueba que
  sea interactivo, que tenga diálogo propio, ni en qué mapa aparece).
- **Mención textual ya aprobada**: la dedicatoria completa (§4) ya
  incluye "con Max cerca" — este uso **no** requiere ninguna decisión
  adicional, ya está aprobado como parte del texto de `{{FINAL_DEDICATION}}`.
- **Función exacta más allá de la mención textual**: decisión abierta
  (§5.3).

## 9. Compatibilidad de guardados

`SAVE_FORMAT_VERSION` actual: **`4`** (`src/state/GameState.js:15`,
`SUPPORTED_LEGACY_FORMAT_VERSIONS = [1, 2, 3]`). **No se modifica en
esta tarea.**

Análisis de impacto por posible añadido de `v1.1`:

| Añadido | ¿Afecta `GameState`/save schema? | Justificación |
|---|---|---|
| `personalizationConfig.js` (nombres, fecha, dedicatoria) consumido en presentación | **No** | Mismo patrón que `epilogueConfig.js`: constantes importadas, nunca persistidas ni leídas desde el guardado. |
| Sustituir `DEDICATION_TEXT` en `CreditsScene.js` por el valor de `{{FINAL_DEDICATION}}` | **No** | Es una constante de módulo, no estado. |
| Unificar `label` de `bride-epilogue`/`bride-father` (§7) | **No** | Dato estático de `worldMaps.js`, no persistido. |
| Max como objeto de mapa estático, visible con `requiresFlag` (mismo patrón ya usado por `bride-epilogue`) | **No** | Reutiliza una bandera existente o, como máximo, añade una bandera booleana nueva con el mismo mecanismo sin lista de formatos legado que ya usan `epilogueStarted`/`giftCodeSolved`/`epilogueCompleted` (`EPILOGUE_SPEC.md` §13) — no requiere incrementar `SAVE_FORMAT_VERSION`. |
| Max con estado propio (posición, interacción persistente, "recordar" haber hablado con él) | **Posiblemente sí** | Si se aprobara esta variante (fuera del alcance mínimo, §13), habría que evaluar entonces si necesita un sub-objeto con campos exactos (como `libraryCatalogue`/`archiveCriteria`, que sí forzaron subir de `3` a `4`) o si basta con una bandera booleana simple. Se identifica aquí como riesgo, no se decide. |

**Preferencia arquitectónica aplicada**: todo el alcance MUST/SHOULD
propuesto en §20 puede implementarse sin incrementar
`SAVE_FORMAT_VERSION`. Si una implementación futura decide una variante
de Max con estado propio, esa decisión debe evaluar el impacto en el
formato de guardado explícitamente antes de implementarse — no está
pre-aprobado por este documento.

## 10. Arquitectura de personalización

No existe hoy ninguna configuración de personalización en `src/`
(`grep` sobre `personalization`/`Personalizaci`/marcadores `{{...}}` no
encuentra ningún resultado). Se propone, **sin crearlo todavía**:

```text
src/content/personalizationConfig.js
```

Mismo patrón que `src/content/epilogueConfig.js` (constantes
`Object.freeze`, sin lógica, consumidas por importación directa):

- **Datos configurables** (subconjunto de §4 que finalmente se apruebe
  usar, según §5): como mínimo `COUPLE_DEDICATION` (texto completo de
  `{{FINAL_DEDICATION}}`); opcionalmente `PARTNER_NAME`,
  `PROTAGONIST_NAME`, `DOG_NAME`/`DOG_SPECIES`/`DOG_BREED`,
  `WEDDING_DATE`, según se resuelvan §5.1, §5.2, §5.3 y §5.4.
- **Consumidores identificados hoy**: `src/scenes/CreditsScene.js`
  (`DEDICATION_TEXT` pasaría a importar `COUPLE_DEDICATION`). Cualquier
  otro consumidor (diálogo del epílogo, NPCs) depende de decisiones
  todavía abiertas (§5).
- **Defaults/comportamiento sin personalización**: no aplica en el
  sentido tradicional — este es un proyecto de un solo destinatario
  (regalo de boda), no un producto genérico distribuible; la
  configuración contendría siempre los datos reales aprobados, igual
  que `epilogueConfig.js` contiene siempre `[7, 1, 5, 2]` y no un
  "modo sin candado". Los tests importan y comparan contra los mismos
  valores exactos, mismo patrón que
  `tests/content/epilogueConfig.test.js` (o equivalente) ya hace para
  `GIFT_CODE_DIGITS`.
- **Tests necesarios**: forma exacta del módulo (valores literales
  correctos, `Object.freeze`); ningún otro archivo de `src/` repite los
  datos personales de forma literal (mismo criterio ya aplicado a
  `GIFT_CODE_DIGITS`/`GIFT_CODE_CLUE_LINES`, comprobable por inspección
  del diff en `reviewer`).

No se crea el archivo en esta tarea.

## 11. Privacidad / repositorio

**Hallazgo obligatorio de esta auditoría**: los datos personales
aprobados (nombres reales, fecha de boda, ciudad, dedicatoria completa)
**ya están versionados públicamente hoy** en
`docs/production/CODEX_HANDOFF.md`, que no está en `.gitignore` y forma
parte del historial de commits público del repositorio (confirmado:
el repositorio tiene Issues de GitHub habilitados y es públicamente
accesible, ver auditorías de tareas anteriores). Mover estos mismos
datos a `src/content/personalizationConfig.js` **no introduce ninguna
exposición nueva** — es el mismo dato, en un archivo distinto, con el
mismo nivel de publicidad.

La decisión real pendiente no es "¿son secretos?" (no se tratan como
secretos técnicos, siguiendo la instrucción explícita de esta tarea) —
es **si se quiere reducir su publicidad actual**, lo cual implicaría
reescribir historial de Git (fuera del alcance de cualquier tarea de
`autopilot`: `CLAUDE.md` prohíbe explícitamente reescribir historial
publicado). Opciones a decidir, sin decidir ninguna aquí:

- **A. Aceptar el estado actual**: los datos siguen versionados
  públicamente como ya lo están; `personalizationConfig.js` los
  versiona igual que `CODEX_HANDOFF.md` ya lo hace. Sin coste adicional,
  sin cambio de exposición.
- **B. Mantenerlos fuera del repositorio ("distintos de lo ya público")**:
  requeriría un archivo no versionado (ignorado por Git) más una
  plantilla versionada de ejemplo, y un paso manual documentado antes
  de cada build de entrega — no elimina la exposición ya existente en
  `CODEX_HANDOFF.md`, solo evita añadir un segundo archivo con los
  mismos datos.
- **C. Inyección en tiempo de build** (variables de entorno / secreto de
  CI): mayor complejidad, solo tendría sentido si se decide además
  purgar `CODEX_HANDOFF.md` del historial (operación destructiva, fuera
  de alcance de `autopilot`).

**Datos que aparecerán en el artifact final** (build web y ejecutable
Windows), si se implementa la personalización aprobada: el texto de la
dedicatoria (`{{FINAL_DEDICATION}}`) como mínimo, en texto plano dentro
del bundle JavaScript — igual de extraíble que cualquier otro texto del
juego hoy (por ejemplo, el propio código de regalo `7152` ya vive en el
bundle sin ofuscar). No se propone ningún mecanismo de ofuscación —
sería inconsistente con cómo ya se trata el resto del contenido del
juego.

No se mueve ningún dato ni se crea ningún secreto en esta tarea.

## 12. Añadidos post-`v1` mencionados en las fuentes

| Añadido | Fuente | Estado | Valor | Coste | Riesgo | Propuesta |
|---|---|---|---|---|---|---|
| Personalización (nombres, fecha, dedicatoria) | `CODEX_HANDOFF.md` → "Personalización futura"; `AGENTS.md` → "Fuera de alcance" | Aprobada explícitamente para el ciclo post-v1 | Alto (es el propósito original del regalo) | Bajo-medio si se limita a `{{FINAL_DEDICATION}}` + nomenclatura (§7) | Bajo si no se toca el diálogo cerrado del epílogo | **v1.1 obligatorio (MUST)**, alcance mínimo — ver §13 |
| Max (compañero visual) | `CODEX_HANDOFF.md` → "Personalización futura" y "Orden de trabajo posterior" punto 5 | Aprobado en concepto; función exacta no aprobada (§5.3, §8) | Medio-alto emocional si se implementa como NPC; ya cubierto parcialmente por la mención textual en la dedicatoria | Medio-alto si se implementa como NPC interactivo nuevo (arte, lógica, tests) | Medio: scope creep si se implementa antes de decidir su función exacta | **v1.1 opcional (SHOULD/COULD)** según se resuelva §5.3 |
| Jardín completo | `AGENTS.md` → "Fuera de alcance" | Nunca aprobado para ninguna versión; solo mencionado como recortado del alcance original | No estimado | Alto (nueva localización completa) | Alto (expande significativamente el alcance) | Requiere decisión explícita del responsable; no asumir para `v1.1` |
| Molino completo | `AGENTS.md` → "Fuera de alcance" | Igual que Jardín | No estimado | Alto | Alto | Requiere decisión explícita; no asumir para `v1.1` |
| Observatorio completo | `AGENTS.md` → "Fuera de alcance" | Igual | No estimado | Alto | Alto | Requiere decisión explícita; no asumir para `v1.1` |
| Interiores secundarios extensos | `AGENTS.md` → "Fuera de alcance" | Igual | No estimado | Medio-alto | Medio | Requiere decisión explícita; no asumir para `v1.1` |
| Metapuzle largo | `AGENTS.md` → "Fuera de alcance" | Igual | No estimado | Alto (nuevo puzle completo) | Alto | Requiere decisión explícita; probablemente versión posterior si se retoma |
| Migración a otro motor | `AGENTS.md` → "Fuera de alcance" | Descartado explícitamente como principio del proyecto | N/A | N/A | Alto | **Descartado** |
| Rehacer la arquitectura | `AGENTS.md` → "Fuera de alcance" | Descartado explícitamente | N/A | N/A | Alto | **Descartado** |

Ninguno de los elementos "requiere decisión"/"descartado" se incorpora
al alcance mínimo de `v1.1` (§13).

## 13. `v1.1` MINIMUM SCOPE

Orientado a máximo impacto emocional con mínimo riesgo técnico —
personalización coherente y pulida antes que sistemas nuevos.

### MUST

- Crear `src/content/personalizationConfig.js` con, como mínimo,
  `COUPLE_DEDICATION` (texto exacto de `{{FINAL_DEDICATION}}`, §4).
- Sustituir `DEDICATION_TEXT` de `CreditsScene.js` por ese valor
  configurado — único punto de integración ya anticipado explícitamente
  por `EPILOGUE_SPEC.md` §12.
- Unificar `label: "La Investigadora"` → `"la novia"` y
  `label: "Padre de la Investigadora"` → `"Padre de la novia"` en
  `worldMaps.js` (§7, puntos 1-2) — resuelve dos de los cuatro defectos
  menores de `v1.0.0` como parte natural de este trabajo.
- Prueba de regresión de compatibilidad: un guardado real con la forma
  de `v1.0.0` (formato `4`) sigue cargando sin cambios de comportamiento
  tras estos añadidos.

### SHOULD

- Resolver §5.1 (dónde se revela `{{PARTNER_NAME}}`) y, si se aprueba,
  implementarlo respetando la clasificación C/D de §6 — sin tocar el
  texto cerrado de `EPILOGUE_SPEC.md` §10 salvo enmienda narrativa
  explícita separada.
- Resolver §5.2 (`{{PROTAGONIST_NAME}}`) con la misma cautela.

### COULD

- Resolver §5.3 (función exacta de Max) e implementarlo como objeto de
  mapa estático gateado por bandera (mismo patrón que `bride-epilogue`),
  sin estado propio adicional.
- Resolver §5.4 (dónde mostrar la fecha de boda), si se identifica un
  lugar coherente.
- Corregir los defectos menores 3 y 4 de `v1.0.0` (§7) como tarea
  independiente, en la misma ventana de trabajo si conviene.

### OUT (de este ciclo)

- Cualquier elemento de §12 marcado "requiere decisión" o "descartado".
- Max con estado propio persistente, pathfinding, o diálogo dedicado.
- Reescribir o enmendar el núcleo narrativo cerrado de
  `EPILOGUE_SPEC.md` §9-§10.
- Cualquier cambio a `SAVE_FORMAT_VERSION`.
- Publicar, etiquetar o generar artifacts de `v1.1` — esto es solo la
  especificación.

## 14. Configuración

Ver §10 (arquitectura) — sin archivo creado todavía.

## 15. Persistencia

Ver §9 — ningún cambio de `SAVE_FORMAT_VERSION` requerido para el
alcance MUST/SHOULD/COULD de §13.

## 16. Compatibilidad `v1.0.0`

- Ningún guardado de `v1.0.0` (formato `4`) deja de cargar tras este
  trabajo — ninguna propuesta del alcance mínimo toca `GameState.restore()`.
- Criterio de aceptación explícito: existe una prueba de regresión que
  siembra un guardado con la forma exacta de `v1.0.0` (incluidas las
  banderas del epílogo completas) y confirma que carga sin lanzar y sin
  cambios de comportamiento inesperados tras introducir
  `personalizationConfig.js` y la unificación de nomenclatura (§13 MUST).

## 17. Privacidad

Ver §11 — decisión pendiente sobre publicidad de los datos, sin acción
en esta tarea.

## 18. QA necesario

- Unitarias: forma exacta de `personalizationConfig.js` (§10); ausencia
  de repetición literal de datos personales fuera de ese archivo.
- Unitarias/E2E: `CreditsScene` muestra el texto de dedicatoria
  configurado, no el genérico anterior.
- Regresión de guardado (§16).
- Manual: legibilidad a 480×270 del texto de dedicatoria real (más
  largo que el genérico actual, "Por todos los síes que aún quedan por
  elegir." — el texto aprobado en §4 es sustancialmente más largo y
  puede necesitar ajuste de `wrapText`/presupuesto de líneas, mismo
  criterio que `ARCHIVE_CRITERIA_SPEC.md` §24 y
  `LibraryCatalogueScene.js`).
- Manual: revisión de que ningún nombre/dato personal aparece antes del
  punto narrativo decidido en §5.1/§5.2.
- `docker compose run --rm game npm run check` y `git diff --check` en
  cada tarea del breakdown (§22), como en cualquier tarea de `autopilot`.

## 19. Riesgos

- **Desbordamiento de texto**: la dedicatoria real (§4) es
  considerablemente más larga que el placeholder actual — riesgo de
  legibilidad a 480×270 (ver §18).
- **Filtración narrativa prematura**: revelar nombres antes del punto
  decidido en §5.1/§5.2 rompería el diseño actual de misterio genérico.
- **Ya-publicidad de los datos**: los datos ya están en el historial de
  Git público (§11) — cualquier expectativa de "mantenerlos privados
  desde `v1.1`" requeriría una decisión sobre historial que excede esta
  tarea.
- **Scope creep de Max**: implementar a Max sin resolver antes §5.3
  puede derivar en trabajo no aprobado (NPC interactivo completo en vez
  de "compañero visual seguro").
- **Mezcla con los defectos menores de `v1.0.0`**: solo dos de los
  cuatro (§7, puntos 1-2) están genuinamente ligados a este trabajo;
  incluir los otros dos sin necesidad ampliaría el alcance sin
  justificación.
- **Reabrir contenido narrativo cerrado**: cualquier tarea de
  implementación que toque el texto exacto de `EPILOGUE_SPEC.md` §9-§10
  sin una enmienda explícita separada viola el propio spec aprobado.

## 20. MUST/SHOULD/COULD/OUT

Ver §13 (contiene la clasificación completa).

## 21. Criterios de aceptación

- `personalizationConfig.js` existe, con `Object.freeze`, sin lógica, y
  ningún dato personal repetido literalmente en otro archivo de `src/`.
- `CreditsScene.js` muestra el texto de dedicatoria configurado.
- El `label` de `bride-father` coincide con el hablante real de sus
  diálogos (`"Padre de la novia"`); el `label` de `bride-epilogue` pasa
  a `"la novia"`, coherente con el resto del juego (objetivos, cuaderno,
  evidencias) y con el prompt de interacción — sin modificar el
  hablante `"Novia"` del diálogo del epílogo, que es un campo distinto
  (§7, puntos 1-2).
- Un guardado de `v1.0.0` (formato `4`) real sigue cargando sin cambios
  de comportamiento.
- `SAVE_FORMAT_VERSION` permanece en `4` (o se documenta explícitamente
  la razón de un cambio, si una tarea de implementación futura lo
  justifica — no pre-aprobado aquí).
- Ningún texto del núcleo narrativo cerrado (`EPILOGUE_SPEC.md` §9-§10)
  se modifica sin una enmienda explícita separada y documentada.
- `docker compose run --rm game npm run check` y `git diff --check` en
  verde para cada tarea del breakdown.
- Ninguna decisión pendiente de §5 se resuelve por inferencia dentro de
  una tarea técnica — cada una requiere su propia aprobación explícita
  antes de implementarse.

## 22. Task breakdown propuesto

Derivado del alcance MUST/SHOULD de §13, no vinculante — cada tarea
debe poder implementarse en una PR pequeña con el flujo completo de
`CLAUDE.md` (`planner` → `developer` → `qa` → quality gate →
`reviewer` → commit → PR):

1. **Configuración central de personalización** — crear
   `src/content/personalizationConfig.js` con `COUPLE_DEDICATION`
   (MUST). Sin dependencias.
2. **Dedicatoria personalizada en créditos** — `CreditsScene.js`
   consume `COUPLE_DEDICATION` en vez de `DEDICATION_TEXT` (MUST).
   Depende de la tarea 1.
3. **Nomenclatura coherente de la novia y su padre** — unificar
   `label` de `bride-epilogue`/`bride-father` en `worldMaps.js` (MUST,
   resuelve defectos menores 1-2 de `v1.0.0`, §7). Sin dependencias,
   independiente de las tareas 1-2.
4. **Prueba de regresión de compatibilidad `v1.0.0`** — sembrar y
   cargar un guardado con la forma exacta de `v1.0.0` tras las tareas
   1-3 (MUST, §16). Depende de las tareas 1-3.
5. **Decisión narrativa: revelación de `{{PARTNER_NAME}}`/
   `{{PROTAGONIST_NAME}}`** — no es una tarea de `autopilot`; requiere
   resolución humana explícita de §5.1/§5.2 antes de poder planificarse
   como tarea técnica.
6. **Implementación de la revelación de nombres** (si la tarea 5 se
   aprueba) — SHOULD. Depende de la tarea 5 y de la tarea 1.
7. **Decisión narrativa: función de Max** — no es una tarea de
   `autopilot`; requiere resolución humana de §5.3.
8. **Max como objeto de mapa estático** (si la tarea 7 se aprueba como
   "compañero visual sin estado propio") — COULD. Depende de la tarea 7.
9. **Corrección de los defectos menores 3-4 de `v1.0.0`** (Biblioteca
   del Margen, fase sin traducir) — COULD, tarea independiente de todo
   lo anterior, puede ejecutarse en cualquier momento.
10. **QA y validación manual del ciclo `v1.1` mínimo** — legibilidad,
    ausencia de errores de consola, recorrido completo con la
    personalización activa (§18). Depende de las tareas 1-4 como mínimo.
11. **Empaquetado/release de `v1.1`** — fuera de esta especificación;
    requiere primero confirmar la numeración definitiva y repetir el
    procedimiento de `RELEASE_PROCEDURE_v1.0.0.md` adaptado. No se
    planifica en detalle aquí.
