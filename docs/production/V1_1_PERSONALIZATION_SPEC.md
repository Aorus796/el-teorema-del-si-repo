# Especificación v1.1 — personalización y ambientación

Documento de **definición de alcance y especificación**, no de
implementación. No se ha escrito ni modificado ningún código de juego
como parte de esta tarea (ni de la ampliación posterior descrita más
abajo). La numeración `v1.1` es provisional — se confirma solo cuando se
apruebe este alcance; `package.json` sigue en `1.0.0`.

**Ampliación de alcance (2026-08-11, misma fecha de la versión
original)**: el responsable del producto ha ampliado explícitamente el
alcance de `v1.1` más allá de la personalización textual inicial. Este
documento reemplaza y engloba la versión anterior de esta misma
especificación (commit `324cf22`), sin descartar ninguna decisión ya
tomada en ella — la personalización textual sigue siendo válida y ahora
se integra dentro de un alcance más amplio, estructurado en dos pilares:

1. **Personalización visual/narrativa + mundo más vivo.**
2. **Ambientación sonora.**

Explícitamente **no** se añaden: mapas nuevos, puzles nuevos, ni
sistemas jugables grandes.

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
posterior a `v1.0.0`, estructurado en dos pilares:

1. **Personalización visual/narrativa y mundo más vivo**: convertir el
   recorrido genérico en el regalo de boda real para el que se concibió
   el proyecto — personalización textual (dedicatoria, nomenclatura),
   diseño visual personalizado de los tres protagonistas (Gonzalo, Elena,
   Max) a partir de referencias reales todavía no disponibles, diseño
   diferenciado de los NPCs secundarios ya existentes, y NPCs
   ambientales nuevos para que los mapas ya existentes se perciban más
   vivos.
2. **Ambientación sonora**: intro musical breve, una pista ambiental
   principal para el recorrido, una transición coherente hacia el tema
   ya aprobado del epílogo, y efectos de sonido básicos — sin rehacer el
   sistema de audio actual, solo extenderlo lo mínimo necesario.

Explícitamente fuera de este ciclo: mapas nuevos, puzles nuevos, y
cualquier sistema jugable grande — ver §13.

`v1.0.0` se publicó el 2026-08-11, con margen sobre ambas fechas
relevantes: el objetivo de entrega original (10 de septiembre de 2026,
ver §26 para un calendario provisional hasta esa fecha) y la boda real
(26 de septiembre de 2026, dato aprobado en §4) — hay tiempo para
especificar bien antes de implementar.

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
- **No es un rediseño gráfico completo.** Resolución, escala,
  proporciones, pipeline de render y animaciones necesarias se mantienen
  aproximadamente como están hoy (100% `<canvas>` procedimental, sin
  sprites externos) — la personalización visual se produce dentro de ese
  mismo lenguaje, no sustituyéndolo (§4 del pilar visual, ver §6/§10).
- **Identidad visual propia, sin copiar propiedad intelectual ajena.**
  Se permiten referencias generales de estilo a la era de aventuras/RPG
  clásicos de pixel art, nunca copia de sprites, personajes, paletas
  distintivas ni intento de reproducir directamente una IP concreta.
- **Todo audio nuevo debe tener procedencia y licencia verificables**
  (original, dominio público, CC0, o licencia explícitamente compatible
  con distribuir el ejecutable) — mismo estándar que ya se aplicó al
  tema provisional del epílogo (`src/assets/audio/README.md`). Sin
  excepciones para "solo mientras se decide"; ver §19/§24.
- **Extensión mínima, no reconstrucción, del `AudioService` existente**
  — ver §23/§24: se parte de lo que ya funciona (un método,
  degradación segura, sin dependencias) y se añade solo lo
  estrictamente necesario para los tres pilares de audio (intro,
  ambiente, SFX), no un sistema de audio general.
- **Ningún dato personal se introduce en el repositorio a través de
  material bruto sin decisión explícita** — las fotografías de
  referencia son insumo de diseño, no un asset del juego; ver §11.

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

**Referencias visuales (fotografías reales) — NO disponibles en esta
tarea.** El responsable proporcionará posteriormente fotografías reales
de Gonzalo, Elena y Max como referencia de diseño. Ningún rasgo físico
de los tres (color de pelo, complexión, forma de la cara, pelaje de
Max, etc.) está aprobado todavía — no se inventa ninguno en este
documento (§6, Nivel A).

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
3. **Función exacta de Max (comportamiento, no su diseño visual).** Los
   datos aprobados dicen "compañero visual seguro, sin pathfinding
   complejo", pero no especifican si aparece como objeto/NPC en el
   mapa, en qué localización, ni si es interactivo — ver §8 (nota: la
   representación visual de Max sí pasa a ser `MUST`, ver §8; lo que
   sigue pendiente es su ubicación/comportamiento exacto en el mundo
   jugable). **PENDIENTE DE DECISIÓN DEL RESPONSABLE.**
4. **Dónde (si acaso) se muestra la fecha de boda.** No hay ningún
   consumidor identificado en el contenido actual para
   `{{WEDDING_DATE}}`/`{{WEDDING_DATE_ISO}}` — ni la pantalla de
   título, ni los créditos, ni el diálogo la mencionan hoy. Ver §13.
   **PENDIENTE DE DECISIÓN DEL RESPONSABLE.**
5. **Privacidad de los datos aprobados.** Ver §11 — necesita una
   decisión explícita sobre si los nombres reales siguen versionados en
   el repositorio público tal como ya lo están hoy, o si se cambia el
   mecanismo antes de `v1.1`.
6. **Si se corrige alguno de los cuatro defectos menores de `v1.0.0`
   fuera del propio trabajo de nomenclatura de `v1.1`** (§7) — por
   defecto, no: se tratan solo los que la propia reforma resuelve de
   forma natural.
7. ~~Mecanismo de aprobación del "Visual Style Lock" (§6, Nivel A)~~ —
   **resuelta (aprobación directa del responsable del proyecto,
   2026-08-12)**: el responsable aprobó directamente los rasgos físicos
   simplificados de Gonzalo, Elena y Max, ya trasladados a
   `characterPalettes.js` en esta misma tarea (§6).
8. ~~Confirmación del roster exacto del Nivel B~~ — **resuelta
   (decisión de producto, 2026-08-11)**: Nivel B queda cerrado a
   Alcaldesa Corolaria, Padre de la novia y Silogio; `plaza-worker` se
   reclasifica como Nivel C enriquecido (§6).
9. **Ubicación y cantidad exactas de los NPCs ambientales del Nivel C**
   (§6): esta especificación propone una distribución por mapa (§25)
   como punto de partida, no como asignación cerrada — las posiciones
   concretas se deciden al implementar, respetando la geometría real de
   cada mapa.
10. **Cuáles de los NPCs ambientales (1-3 en total) reciben movimiento
    simple**, y qué trayectoria — no se decide aquí cuáles ni por qué,
    solo que el total debe mantenerse entre 1 y 3 (§8 del pilar
    visual/mundo vivo, sección "Comportamiento de NPCs ambientales").
11. **Si la música ambiental continúa sonando durante los tres puzles
    focales** (P2, Biblioteca, Archivo) o se limita al recorrido en
    `WorldScene`. Ver §24 — la arquitectura actual permite ambas
    opciones con coste similar; no hay una fuente que decida esto
    todavía.
12. **Origen concreto de los assets de audio nuevos** (intro, ambiente,
    SFX): quién los compone/selecciona y bajo qué licencia exacta —
    ver §19. Esta especificación exige que la licencia sea verificable
    antes de integrar cualquier asset, pero no elige la fuente.
13. **Tratamiento del desbordamiento de texto de la dedicatoria real**
    (§18 del pilar de personalización textual, ya identificado en la
    versión anterior de este documento) — si requiere ajuste de
    `wrapText`/presupuesto de líneas, eso es una decisión técnica de
    implementación, no de esta especificación.
14. El calendario provisional de §26 es una guía de margen de
    seguridad, no un compromiso de fechas intermedias — cualquier
    fecha ahí puede ajustarse sin que eso represente una decisión
    pendiente de aprobación.

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
- **Roster completo de NPCs con nombre existentes hoy** (auditado
  contra `src/content/worldMaps.js`, no citado de memoria):

  | `id` | `label` actual | Mapa | Rol narrativo actual |
  |---|---|---|---|
  | `mayor-corolaria` | "Alcaldesa Corolaria" | Plaza del Axioma | Guía de progresión (gatea `preparationsBoardRead`/`brideNoteReceived`); no es persona real. |
  | `bride-father` | "Padre de la Investigadora" | Plaza del Axioma | Guía de progresión hacia el Paseo/Archivo; hablante real en diálogo: "Padre de la novia". No es persona real (sin nombre propio aprobado). |
  | `plaza-worker` | "Ayudante de la ceremonia" | Plaza del Axioma | Diálogo de ambiente puro (3 líneas fijas), sin gating de progresión. |
  | `library-silogio` | "Silogio" | Biblioteca del Margen | Abre la escena `library-catalogue` (segundo puzle). |
  | `bride-epilogue` | "La Investigadora" | Plaza del Axioma (solo epílogo) | Es Elena — tratado en Nivel A, no en Nivel B/C. |

### Nivel A — Protagonistas (personas/animal reales)

**MUST**: Gonzalo, Elena y Max reciben diseño visual personalizado a
partir de referencia real — hoy **no disponible** (§4). Ningún rasgo
físico se inventa en esta especificación.

**Nota (2026-08-12)**: el responsable del proyecto aprobó directamente
un conjunto de rasgos físicos simplificados para los tres personajes de
Nivel A, ya implementados en `characterPalettes.js` (ver §22): Gonzalo
(pelo oscuro, peinado lateral, silueta delgada, prenda azul), Elena
(pelo castaño largo, silueta propia, paleta cálida/elegante) y Max
(cuerpo canino, orejas erguidas, tonos tostados, máscara oscura, collar
opcional). Esta lista no añade ningún rasgo adicional a los ya
descritos aquí.

Estos tres personajes fijan
el lenguaje visual de todo `v1.1`; antes de producir el resto del
roster (Niveles B y C) debe existir una fase explícita de aprobación
humana:

**VISUAL STYLE LOCK**: tras producir/prototipar los tres personajes de
Nivel A (a partir de las referencias reales, cuando existan) y antes de
**producir el arte final** de cualquier NPC secundario o ambiental, el
estilo visual resultante debe aprobarse explícitamente por el
responsable del producto. Ningún sprite definitivo de Nivel B o C se
produce antes de este punto de control — evita rehacer trabajo si el
estilo cambia. El mecanismo exacto de esa aprobación es una decisión
pendiente (§5.7).

**Matiz explícito para mitigar el riesgo de calendario de §26**: como
los NPCs de Nivel B (§6) no están basados en personas reales y no
dependen de ninguna fotografía, su **exploración conceptual** (bocetos,
propuestas de silueta/paleta dentro del sistema modular de §10) puede
empezar en paralelo a la espera del Visual Style Lock — solo su
**producción final** (el sprite definitivo que se integra en el juego)
queda gateada por él, igual que el resto del Nivel B/C. Esto no cambia
la regla general ("ningún sprite definitivo antes del lock"); solo
aclara que el trabajo preparatorio de estilo para personajes inventados
no tiene que esperar a que existan las fotografías de Gonzalo/Elena/Max,
a diferencia del propio Nivel A.

Esta especificación **no** produce ni prototipa estos tres personajes
— solo define la fase y su orden de dependencia (§22).

### Nivel B — Secundarios importantes (no basados en personas reales)

**Confirmado (decisión de producto, 2026-08-11)**: Nivel B queda
cerrado a exactamente tres NPCs, los que el roster auditado demuestra
que gatean progresión real: **Alcaldesa Corolaria**, **Padre de la
novia** (`bride-father`) y **Silogio** (`library-silogio`). Ninguno de
los tres está basado en una persona real según ninguna fuente — sus
diseños visuales pueden definirse libremente dentro del estilo aprobado
en el Visual Style Lock, sin necesidad de referencia fotográfica. No se
proponen animaciones adicionales a las ya existentes para ellos.

`plaza-worker` ("Ayudante de la ceremonia") **no** entra en Nivel B —
ver Nivel C.

### Nivel C — NPCs ambientales (nuevos, de relleno, y uno ya existente)

**`plaza-worker` reclasificado (decisión de producto, 2026-08-11)**: el
roster auditado (§6, tabla) confirma que `plaza-worker` es diálogo de
ambiente puro (3 líneas fijas) sin ningún gating de progresión — el
mismo perfil que un NPC ambiental, no el de un secundario relevante
para puzles. Se reclasifica de Nivel B a **Nivel C enriquecido**: ya
tiene nombre propio e identidad establecida desde `v1.0.0`, así que
puede conservar un diseño identificable dentro del sistema visual
modular (§10) — pero **no** debe consumir el mismo esfuerzo artístico
individual que Alcaldesa Corolaria, Padre de la novia o Silogio (Nivel
B). Esto sustituye la clasificación "caso límite, decisión pendiente
§5.8" de la versión anterior de este documento — queda resuelta.

Ver §25 para la auditoría de mapas y la distribución propuesta
(objetivo total: 8-15, sin cambios — `plaza-worker` ya existe y no
cuenta como un NPC ambiental nuevo adicional a ese total), y la sección
"Comportamiento de NPCs ambientales" más abajo (§8 del pilar visual)
para las reglas de movimiento/estado.

Clasificación de los datos personales pedida (A: genérico durante el
juego / B: revelación progresiva / C: solo epílogo / D: solo
créditos/dedicatoria):

| Elemento | Clasificación propuesta | Justificación |
|---|---|---|
| Nombre de la novia (`{{PARTNER_NAME}}`) | **C** (solo epílogo) o **D** (solo créditos/dedicatoria) según §5.1 | El resto del juego ya la trata de forma genérica ("la novia"); revelar el nombre antes rompería el diseño actual del misterio sin necesidad. |
| Nombre del protagonista (`{{PROTAGONIST_NAME}}`) | **D** (solo dedicatoria), si se aprueba usarlo en absoluto | Ver §5.2 — nunca se ha nombrado; introducirlo en diálogo jugable sería la opción de mayor riesgo narrativo. |
| Nombre del padre de la novia | Sin dato aprobado — no se personaliza | No hay ningún nombre aprobado para este personaje en las fuentes. |
| `{{DOG_NAME}}`/`{{DOG_SPECIES}}`/`{{DOG_BREED}}` (Max, datos textuales) | **D** como mínimo (ya incluido en la dedicatoria aprobada); **C** o fuera del recorrido jugable según §5.3 | Ver §8 — el diseño visual de Max es distinto de estos datos textuales y ya es `MUST` (§8). |
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

**Hallazgo incidental (no es uno de los cuatro defectos catalogados de
`v1.0.0`, encontrado durante la auditoría de código de esta tarea)**:
`src/scenes/TitleScene.js:37` muestra el subtítulo `"Vertical slice
narrativo"` en la pantalla de título — texto residual de una etapa de
desarrollo muy anterior a `v1.0.0` (el juego ya no es un vertical slice
desde hace mucho). No tiene relación con personalización ni con los
cuatro defectos menores ya documentados; se deja igual que los defectos
3-4: **candidato a tarea de pulido independiente**, no se corrige aquí.

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

**Actualización de clasificación (ampliación de scope, 2026-08-11)**:
la representación visual de Max **ya no es `COULD`** — pasa a **`MUST`**
para `v1.1`, como parte del Nivel A de protagonistas (§6): debe existir
un diseño/sprite personalizado de Max, a partir de referencia real
cuando esté disponible (§4), igual que Gonzalo y Elena. Esto es
estrictamente su **diseño visual**, no su comportamiento en el mundo
jugable:

- Su comportamiento sigue limitado exactamente a lo aprobado:
  "compañero visual seguro, sin pathfinding complejo". No se inventa
  mecánica, puzle, diálogo propio, inventario, estado persistente ni
  misión alguna para Max — ninguna fuente aprueba nada de eso.
- **Dónde aparece en el mundo jugable** (mapa, posición, frecuencia):
  sigue siendo una decisión de diseño abierta (§5.3) — ninguna fuente
  la resuelve. Cuando se decida, el patrón técnico más simple y
  coherente con lo ya implementado es el mismo `requiresFlag` genérico
  ya usado por `bride-epilogue` (`EPILOGUE_SPEC.md` §11, implementado en
  `WorldScene.js`): un objeto de mapa estático, visible u oculto según
  una bandera, sin estado propio adicional — ver §9 (impacto en
  guardado) y §22 (tarea 8 del breakdown).

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
| Sprites personalizados de Gonzalo/Elena/Max y NPCs secundarios/ambientales (Niveles A/B/C, §6) | **No** | Los sprites son datos de render (paletas/geometría consumidos por las funciones de dibujo existentes, mismo patrón que `PROTAGONIST_PALETTE`/`BRIDE_PALETTE` ya usadas en `CreditsScene.js`), no estado de `GameState`. |
| NPCs ambientales nuevos (§25) | **No** | Son objetos estáticos de `worldMaps.js`, igual que los NPCs ya existentes — ninguno de los NPCs actuales tiene entrada en `GameState`. |
| Movimiento simple de 1-3 NPCs ambientales | **No**, si el movimiento se deriva en tiempo de render (por ejemplo, un patrón determinista basado en el tiempo transcurrido) en vez de guardarse | Debe implementarse sin persistir posición/fase del movimiento — igual que la cámara o cualquier otro estado puramente visual hoy. Confirmarlo explícitamente en la tarea que lo implemente. |
| Música/SFX nuevos (intro, ambiente, transición, SFX) | **No** | El precedente ya existente (`playEpilogueTheme()`) no persiste ningún estado de audio en `GameState` — `AudioService` mantiene su propio estado transitorio (`hasStarted`) en memoria, no en el guardado. La extensión propuesta en §24 sigue el mismo patrón. |

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

### Sistema visual modular para NPCs secundarios/ambientales (Niveles B/C)

Auditado el render actual: los personajes se dibujan con funciones de
composición sobre paletas de color (`PROTAGONIST_PALETTE`,
`BRIDE_PALETTE` en `src/scenes/CreditsScene.js`, mismo patrón usado por
las paletas de NPC ya existentes en `WorldScene.js`, por ejemplo
`"mayor-corolaria"`/`"plaza-worker"` con campos `body`/`accent`). Esto
ya es, de facto, un sistema mínimamente modular: silueta/geometría
compartida + paleta distinta por personaje.

**Estrategia mínima propuesta** para producir 8-15 NPCs ambientales sin
crear 8-15 diseños completamente independientes: reutilizar la misma
función de dibujo de silueta ya existente, variando únicamente un
conjunto pequeño de parámetros por NPC — paleta (cuerpo/accesorio,
mismo patrón `body`/`accent` ya usado), y opcionalmente una variación
mínima de silueta (por ejemplo, con/sin un accesorio simple) si el
render actual lo permite sin complejidad añadida. **No** se propone:

- un generador procedural de personajes (character creator);
- combinatoria de piezas independientes (peinados/ropa intercambiables
  como capas separadas) salvo que una implementación futura demuestre
  que sale más barato que variar paletas — no pre-aprobado aquí;
- ninguna herramienta de edición visual nueva.

El objetivo es variedad visual barata reutilizando exactamente el
patrón que el propio código ya demuestra que funciona, no un sistema
nuevo de mayor alcance.

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

### Fotografías de referencia (nuevo, ampliación de scope)

Distinto del análisis anterior: las **fotografías reales** de Gonzalo,
Elena y Max que el responsable proporcionará (§4, §6 Nivel A) son
**material de referencia de diseño**, no texto ya público como los
datos de `CODEX_HANDOFF.md`. Reglas explícitas para cuando existan:

- Las fotografías originales **no se incorporan al repositorio por
  defecto** — no se versiona ninguna imagen bruta.
- Las fotografías originales **no se convierten automáticamente en
  assets del juego** — su único uso es servir de referencia visual
  durante el diseño de los sprites.
- **Solo los sprites/resultados derivados** (los diseños de pixel art
  finales, ya transformados y estilizados) se versionan en el
  repositorio — salvo que el responsable decida expresamente lo
  contrario para alguna fotografía concreta.
- No se asume autorización para publicar las fotografías originales en
  ningún caso — esa autorización, si se necesitara, es una decisión
  separada y explícita, no implícita por haber aprobado esta
  especificación.

No se implementa ningún mecanismo técnico para esto en esta tarea (no
hay fotografías todavía) — queda como regla de proceso para cuando
existan.

## 12. Añadidos post-`v1` mencionados en las fuentes

| Añadido | Fuente | Estado | Valor | Coste | Riesgo | Propuesta |
|---|---|---|---|---|---|---|
| Personalización (nombres, fecha, dedicatoria) | `CODEX_HANDOFF.md` → "Personalización futura"; `AGENTS.md` → "Fuera de alcance" | Aprobada explícitamente para el ciclo post-v1 | Alto (es el propósito original del regalo) | Bajo-medio si se limita a `{{FINAL_DEDICATION}}` + nomenclatura (§7) | Bajo si no se toca el diálogo cerrado del epílogo | **v1.1 obligatorio (MUST)**, alcance mínimo — ver §13 |
| Max — diseño visual | `CODEX_HANDOFF.md` → "Personalización futura" y "Orden de trabajo posterior" punto 5; ampliación de scope 2026-08-11 | Aprobado explícitamente como `MUST` visual (§8); su comportamiento en el mundo jugable sigue sin aprobar (§5.3) | Alto (protagonista visual del regalo) | Bajo-medio: sprite/paleta reutilizando el sistema modular (§10) | Bajo si se limita a diseño visual sin comportamiento nuevo | **v1.1 obligatorio (MUST)** para el diseño; su aparición/comportamiento en el mundo, **v1.1 opcional (COULD)** — ver §13 |
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

Orientado a máximo impacto emocional/personal con mínimo riesgo
técnico. Personalización coherente y pulida antes que sistemas nuevos.
Ningún mapa nuevo, ningún puzle nuevo, ningún sistema jugable grande.

**Nota de honestidad sobre el tamaño de este MUST (hallazgo de la
revisión de calidad de scope de esta misma tarea)**: la versión anterior
de esta especificación (commit `324cf22`) tenía un MUST de 4 ítems,
limitado a personalización textual. Tras la ampliación de alcance a los
dos pilares (visual + audio), el MUST de abajo tiene del orden de 15-16
ítems. "Mínimo" aquí significa **el subconjunto más pequeño que
satisface los dos pilares ya aprobados explícitamente por el
responsable** (§1, "Ampliación de alcance"), no "pequeño en términos
absolutos" — sería deshonesto presentarlo como equivalente en esfuerzo a
la versión anterior. En términos de horas de producción, el MUST
implica del orden de 6-7 diseños de personaje individuales (3
protagonistas + 3 secundarios de Nivel B) más un sistema de variantes
para 8-15 NPCs ambientales de Nivel C (que ahora incluye a
`plaza-worker` reclasificado, §6) — un volumen de trabajo real de
ilustración/diseño de
personajes, aunque no equivalga a rehacer el pipeline gráfico completo
del juego (§3, §4 del pilar visual siguen siendo ciertos en ese sentido
técnico específico: misma resolución, misma escala, mismo render
`<canvas>` procedimental). Ver también §26 para el riesgo de calendario
asociado a este volumen.

### MUST

**Personalización textual (ya especificada, sin cambios de fondo):**

- Crear `src/content/personalizationConfig.js` con, como mínimo,
  `COUPLE_DEDICATION` (texto exacto de `{{FINAL_DEDICATION}}`, §4).
- Sustituir `DEDICATION_TEXT` de `CreditsScene.js` por ese valor
  configurado — único punto de integración ya anticipado explícitamente
  por `EPILOGUE_SPEC.md` §12.
- Unificar `label: "La Investigadora"` → `"la novia"` y
  `label: "Padre de la Investigadora"` → `"Padre de la novia"` en
  `worldMaps.js` (§7, puntos 1-2) — resuelve dos de los cuatro defectos
  menores de `v1.0.0` como parte natural de este trabajo.

**Pilar 1 — visual/mundo más vivo:**

- Diseño/sprite personalizado de Gonzalo, a partir de referencia real
  (§6 Nivel A, §8) — bloqueado hasta recibir la fotografía.
- Diseño/sprite personalizado de Elena, mismo tratamiento.
- Diseño/sprite personalizado de Max, mismo tratamiento (§8).
- Diseño visual individual y reconocible para los tres NPCs secundarios
  confirmados (§6 Nivel B: Alcaldesa Corolaria, Padre de la novia,
  Silogio — `plaza-worker` no cuenta aquí, ver Nivel C).
- NPCs ambientales nuevos en los mapas ya existentes (§6 Nivel C, §25),
  objetivo 8-15 en total, mayoritariamente estáticos con frase corta.
- Frases ambientales breves para esos NPCs (texto, reutilizando la
  infraestructura de diálogo ya existente en `UiController`).

**Pilar 2 — audio:**

- Intro musical breve (~3-8 s) al comienzo de la experiencia (§14/§24).
- Música ambiental principal, única, en loop, para el recorrido jugable
  normal (§15/§24).
- Transición definida entre el ambiente normal y el tema ya aprobado
  del epílogo (§16/§24) — sin crossfade sofisticado, sin sustituir el
  tema existente.
- SFX de interacción/hablar con NPC (§17/§24).
- SFX de activar/inspeccionar objeto (§17/§24).
- SFX de resolución correcta de puzle (§17/§24).

**Cierre:**

- Prueba de regresión de compatibilidad: un guardado real con la forma
  de `v1.0.0` (formato `4`) sigue cargando sin cambios de comportamiento
  tras todo lo anterior (§16).

### SHOULD

- Resolver §5.1 (dónde se revela `{{PARTNER_NAME}}`) y, si se aprueba,
  implementarlo respetando la clasificación C/D de §6 — sin tocar el
  texto cerrado de `EPILOGUE_SPEC.md` §10 salvo enmienda narrativa
  explícita separada.
- Resolver §5.2 (`{{PROTAGONIST_NAME}}`) con la misma cautela.
- 1-3 NPCs ambientales con movimiento simple, corto, delimitado,
  predecible, sin pathfinding (§6 Nivel C, §25).
- SFX de acción/respuesta incorrecta (§17/§24).
- Fades musicales simples, solo si `AudioService` lo permite sin
  complejidad añadida (§24) — no justifica por sí solo ampliar la
  arquitectura de audio.
- Revelación de nombres si se aprueba narrativamente (depende de §5.1/§5.2).

### COULD

- Resolver §5.3 (comportamiento/ubicación exacta de Max en el mundo
  jugable) e implementarlo como objeto de mapa estático gateado por
  bandera (mismo patrón que `bride-epilogue`), sin estado propio
  adicional — nota: el **diseño visual** de Max ya es `MUST` (§8); esto
  es solo su aparición/comportamiento en el mundo.
- Mayor variedad visual entre los NPCs ambientales, más allá del mínimo
  del sistema modular de §10.
- Pequeños detalles ambientales adicionales, sin nuevos sistemas.
- Resolver §5.4 (dónde mostrar la fecha de boda), si se identifica un
  lugar coherente.
- Corregir los defectos menores 3 y 4 de `v1.0.0` (§7), y el hallazgo
  incidental del subtítulo "Vertical slice narrativo" en `TitleScene`,
  como tarea(s) independiente(s), en la misma ventana de trabajo si
  conviene.

### OUT (de este ciclo)

- Cualquier elemento de §12 marcado "requiere decisión" o "descartado"
  (Jardín, Molino, Observatorio, interiores secundarios extensos,
  metapuzle largo, migración de motor, rehacer arquitectura).
- Música completa distinta por mapa — los mapas principales comparten
  la misma identidad musical base (§15).
- Sonido de pasos continuo, sonido por cada tecla, sonido por cada
  cambio de interfaz, o cualquier sistema de sonido complejo (§17).
- Mezclador de audio avanzado o menú completo de configuración de
  audio (§18).
- Retratos grandes, aumento importante de resolución de sprites, o
  animaciones emocionales complejas — el objetivo visual es
  personalización de nivel medio dentro del pixel art existente, no un
  rediseño gráfico (§4 del pilar visual).
- IA o pathfinding de NPCs, de cualquier tipo.
- Estado persistente de NPCs ambientales o de Max.
- Max con mecánica, puzle, diálogo dedicado, inventario o misión
  propios.
- Rediseño completo de tiles/mapas, o cambio de motor.
- Sistemas nuevos de gameplay, mapas nuevos, puzles nuevos.
- Cualquier cambio a `SAVE_FORMAT_VERSION`.
- Publicar, etiquetar o generar artifacts de `v1.1` — esto es solo la
  especificación.

## 14. Configuración

Ver §10 (arquitectura de `personalizationConfig.js` y del sistema
visual modular) y §24 (arquitectura mínima de audio). Ningún archivo
creado todavía.

## 15. Persistencia

Ver §9 (tabla de impacto ampliada) — ningún cambio de
`SAVE_FORMAT_VERSION` requerido para el alcance MUST/SHOULD/COULD de
§13, incluidos los NPCs ambientales, el sistema visual y el audio.

## 16. Compatibilidad `v1.0.0`

- Ningún guardado de `v1.0.0` (formato `4`) deja de cargar tras este
  trabajo — ninguna propuesta del alcance mínimo toca `GameState.restore()`.
- Criterio de aceptación explícito: existe una prueba de regresión que
  siembra un guardado con la forma exacta de `v1.0.0` (incluidas las
  banderas del epílogo completas) y confirma que carga sin lanzar y sin
  cambios de comportamiento inesperados tras introducir
  `personalizationConfig.js`, la unificación de nomenclatura, los NPCs
  ambientales nuevos, los sprites personalizados y la extensión de
  `AudioService` (§13 MUST).
- Los NPCs ambientales nuevos y los sprites personalizados no deben
  introducir ninguna nueva clave persistida — verificable comparando la
  forma exacta de un guardado antes/después (§9).

## 17. Privacidad

Ver §11 (datos textuales, ya versionados públicamente hoy) y su
subsección "Fotografías de referencia" (material de diseño, no se
versiona en bruto por defecto). Ninguna acción en esta tarea.

## 18. QA necesario

**Personalización textual y nomenclatura:**

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

**QA visual (futuro, no ejecutado en esta tarea):**

- Lectura correcta de las siluetas de todos los personajes nuevos a la
  resolución real (480×270, escala de juego).
- Gonzalo, Elena y Max coherentes entre sí y con el resto del elenco
  tras el Visual Style Lock (§6 Nivel A).
- Aprobación humana explícita del parecido simplificado de los tres
  protagonistas contra sus referencias reales, antes de considerarlos
  definitivos.
- Los NPCs ambientales nuevos no bloquean rutas de paso ni interfieren
  con objetos interactuables existentes (mismo patrón `assertSpawnIsClear`
  ya usado en `tests/content/WorldMaps.test.js`).
- La densidad de NPCs por mapa (§25) no perjudica la legibilidad general
  de la escena.
- El movimiento simple de los 1-3 NPCs con esa variante no produce
  colisiones problemáticas ni interfiere con puzles/progresión.
- Sin regresión perceptible de rendimiento tras añadir los NPCs y
  sprites nuevos.
- Sprites renderizados correctamente tanto en la versión web como en el
  ejecutable Electron/Windows.

**QA audio (futuro, no ejecutado en esta tarea):**

- Comportamiento offline, en web y en Electron/Windows empaquetado.
- Comportamiento de la intro en la primera interacción del usuario
  (autoplay) — ver §24.
- Comportamiento del audio en cada cambio de escena relevante (título →
  mundo, mundo → puzles → mundo, mundo → créditos).
- La música ambiental hace loop sin error evidente ni duplicación de
  pistas simultáneas.
- La transición ambiente → tema del epílogo ocurre según lo definido en
  §16/§24, sin solapamiento no intencionado.
- Los SFX pueden sonar simultáneamente con la música sin comportamiento
  inesperado.
- Volumen relativo razonable entre música y SFX (sin cifra exacta
  pre-aprobada aquí).
- Ausencia de errores de consola nuevos atribuibles a audio.
- El audio se comporta correctamente tras recargar/reabrir la partida
  (replay).
- Prueba específica en el ejecutable Windows empaquetado, análoga a
  `WINDOWS_PORTABLE_FULL_QA.md`.

**Gate común:**

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
- **Scope creep de Max**: implementar el comportamiento de Max en el
  mundo sin resolver antes §5.3 puede derivar en trabajo no aprobado
  (NPC interactivo completo en vez de "compañero visual seguro"); su
  diseño visual (`MUST`, §8) es independiente de este riesgo.
- **Mezcla con los defectos menores de `v1.0.0`**: solo dos de los
  cuatro (§7, puntos 1-2) están genuinamente ligados a este trabajo;
  incluir los otros dos sin necesidad ampliaría el alcance sin
  justificación.
- **Reabrir contenido narrativo cerrado**: cualquier tarea de
  implementación que toque el texto exacto de `EPILOGUE_SPEC.md` §9-§10
  sin una enmienda explícita separada viola el propio spec aprobado.
- **Aprobación de parecido visual retrasa el resto del roster**: si el
  Visual Style Lock (§6 Nivel A) se demora, todo el trabajo de Niveles B
  y C queda bloqueado por diseño — es una dependencia intencional, no
  accidental, pero debe gestionarse activamente contra el calendario
  (§26).
- **Autoplay de la intro musical — decisión ya resuelta (§24)**: se
  decidió explícitamente que la intro se dispara en la primera
  interacción válida del usuario, no por autoplay al cargar la página —
  el riesgo que queda no es "qué decidir" sino la implementación
  concreta (`TitleScene` no recibe `audio` hoy), a resolver en su propia
  tarea técnica (tarea 14, §22).
- **Sourcing y licencia de audio nuevo**: si no se resuelve §5.12 con
  tiempo, el pilar de audio completo queda bloqueado — mismo tipo de
  riesgo de dependencia externa que las fotografías de referencia
  (§6 Nivel A).
- **Scope creep del sistema de NPCs ambientales**: el objetivo 8-15
  (§25) puede crecer si no se fija como límite explícito durante la
  implementación.
- **Calendario ambicioso**: el margen hasta el 10 de septiembre (§26)
  depende de recibir las referencias visuales con tiempo suficiente;
  ver §5.7 y el propio §26 para el tratamiento de este riesgo.

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
- Ningún sprite de Gonzalo, Elena o Max se produce como definitivo antes
  de que exista la fotografía de referencia correspondiente y se apruebe
  el Visual Style Lock (§6 Nivel A).
- Ninguna fotografía original se versiona en el repositorio; solo los
  sprites/resultados derivados (§11, "Fotografías de referencia").
- El roster de NPCs de Nivel B/C no excede el objetivo aprobado (8-15
  ambientales, §25) sin una decisión explícita que lo amplíe.
- Ningún NPC ambiental ni Max modifican `GameState`, desbloquean
  progreso, ni son necesarios para resolver ningún puzle.
- `AudioService` se extiende, no se reconstruye — el método
  `playEpilogueTheme()` y su comportamiento actual permanecen
  compatibles (§23/§24).
- Todo audio nuevo tiene procedencia y licencia documentadas antes de
  integrarse (§19 del pilar de audio).
- `SAVE_FORMAT_VERSION` permanece en `4` salvo evidencia técnica real
  documentada explícitamente que obligue a otra cosa.

## 22. Task breakdown propuesto

Derivado del alcance MUST/SHOULD/COULD de §13, no vinculante — cada
tarea debe poder implementarse en una PR pequeña con el flujo completo
de `CLAUDE.md` (`planner` → `developer` → `qa` → quality gate →
`reviewer` → commit → PR). Agrupado en cuatro bloques (A. base, B.
visual, C. audio, D. cierre); las dependencias reales entre bloques se
indican explícitamente — B y C son independientes entre sí y pueden
avanzar en paralelo.

### A. Base / personalización textual

1. **Configuración central de personalización** — crear
   `src/content/personalizationConfig.js` con `COUPLE_DEDICATION`
   (MUST). Sin dependencias.
2. **Dedicatoria y nomenclatura** — `CreditsScene.js` consume
   `COUPLE_DEDICATION` (MUST, depende de la tarea 1); unificar `label`
   de `bride-epilogue`/`bride-father` en `worldMaps.js` (MUST, resuelve
   defectos menores 1-2 de `v1.0.0`, §7 — sin dependencias, puede ir en
   paralelo con la tarea 1).
3. **Decisión narrativa: revelación de nombres** — no es una tarea de
   `autopilot`; requiere resolución humana explícita de §5.1/§5.2 antes
   de planificarse como tarea técnica. Si se aprueba, su implementación
   (SHOULD) depende de la tarea 1.

### B. Visual

4. **Auditoría técnica de sprites/render** — confirmar contra el código
   real (ya hecha en esta especificación, §6/§10) el patrón de
   composición por paletas y el punto de partida del sistema modular.
   Sin dependencias; ya completada como parte de este documento.
5. **Definición de estilo** — bocetos/prototipos iniciales de dirección
   de arte dentro del pixel art existente (§4 del pilar visual), sin
   depender todavía de las fotografías reales. Depende de la tarea 4.
6. **Gonzalo/Elena/Max — diseño desde referencia real** (MUST) —
   bloqueado hasta recibir las fotografías (§4, §11). Depende de la
   tarea 5.
7. **VISUAL STYLE LOCK** — aprobación humana explícita del estilo
   resultante de la tarea 6 (§6 Nivel A, §5.7); punto de control
   obligatorio antes de las tareas 8-11. No es una tarea técnica de
   `autopilot`.

   **Nota (2026-08-12)**: las tareas 6 y 7 quedan resueltas. La tarea 6
   (diseño simplificado de Gonzalo, Elena y Max desde los rasgos ya
   aprobados) se implementó en esta PR (`characterPalettes.js`,
   `src/world/Player.js`, `src/scenes/WorldScene.js`,
   `src/scenes/CreditsScene.js`, `src/render/MaxRenderer.js`). La tarea 7
   (Visual Style Lock) fue aprobada directamente por el responsable del
   proyecto el 2026-08-12, fuera del pipeline de `autopilot` — es una
   aprobación humana, no una tarea técnica, tal y como ya aclaraba este
   mismo punto.
8. **Secundarios importantes** — diseño individual de Alcaldesa
   Corolaria, Padre de la novia y Silogio (MUST, §6 Nivel B, roster ya
   confirmado). Depende de la tarea 7.
9. **Sistema mínimo de variantes ambientales** — implementar la
   estrategia de reutilización de paletas/siluetas propuesta en §10.
   Depende de la tarea 7.
10. **Población de mapas con NPCs ambientales** — añadir los objetos de
    mapa según la distribución de §25 (MUST, objetivo 8-15). Depende de
    las tareas 8 y 9.
11. **Movimiento simple opcional** — 1-3 NPCs con movimiento corto,
    delimitado y predecible (SHOULD, §5.10). Depende de la tarea 10.
12. **Max en el mundo jugable** (COULD) — depende de que se resuelva la
    decisión narrativa de §5.3 (no es tarea de `autopilot` por sí sola)
    y de la tarea 7 (Visual Style Lock, para el sprite de Max).

### C. Audio

13. **Auditoría/extensión mínima de `AudioService`** — diseño técnico
    concreto de la extensión propuesta en §24, a partir de la auditoría
    ya realizada en §23. Sin dependencias del bloque B.
14. **Intro musical** (MUST) — depende de la tarea 13 y de que se
    resuelva §5.12 (origen/licencia del asset) y la decisión conceptual
    de §24 sobre cuándo reproducirla de forma segura.
15. **Música ambiental** (MUST) — depende de la tarea 13 y de §5.12/§5.11
    (si persiste durante los puzles focales).
16. **Transición al epílogo** (MUST) — conecta el ambiente (tarea 15)
    con el tema ya existente del epílogo, sin sustituirlo (§16 del
    pilar de audio). Depende de la tarea 15.
17. **SFX básicos** — interact/activate/puzzle-success (MUST) y
    respuesta incorrecta (SHOULD), según §17/§24. Depende de la tarea 13,
    independiente de las tareas 14-16.

### D. Cierre

18. **Prueba de regresión de compatibilidad `v1.0.0`** (MUST, §16) —
    sembrar y cargar un guardado con la forma exacta de `v1.0.0` tras
    todo lo anterior. Depende de al menos las tareas 2, 10 y 13-17.
19. **QA integrado** — recorrido completo con personalización, NPCs y
    audio activos; criterios de §18 (visual y audio). Depende de las
    tareas 2, 10-11, 14-17.
20. **QA en el ejecutable Windows** — análoga a
    `WINDOWS_PORTABLE_FULL_QA.md`, mismo alcance que §18 "QA audio".
    Depende de la tarea 19.
21. **Corrección de los defectos menores 3-4 de `v1.0.0` y del hallazgo
    incidental de `TitleScene`** (COULD, §7, §19) — independiente de
    todo lo anterior, puede ejecutarse en cualquier momento.
22. **Empaquetado/release de `v1.1`** — fuera de esta especificación;
    requiere primero confirmar la numeración definitiva y repetir el
    procedimiento de `RELEASE_PROCEDURE_v1.0.0.md` adaptado. Depende de
    las tareas 18-20. No se planifica en detalle aquí.

## 23. Auditoría del sistema de audio actual

Confirmado contra el código real (`src/platform/AudioService.js`,
`src/content/epilogueAudioConfig.js`, `src/main.js`,
`src/scenes/WorldScene.js`, `tests/platform/AudioService.test.js`,
`tests/content/epilogueAudioConfig.test.js`, `src/assets/audio/README.md`).
No se modificó ningún archivo durante esta auditoría.

- **`AudioService` actual**: una única clase con un único método
  público, `playEpilogueTheme()`. Constructor inyectado
  (`AudioConstructor`) — en producción es `window.Audio`
  (`src/main.js:31`), en tests es un `FakeAudio`/`undefined`.
- **API/capacidades actuales**: solo reproducir el tema del epílogo,
  una vez. No hay `stop()`, `pause()`, control de volumen, cambio de
  pista, ni soporte de SFX. `loop = false` (no repite). Un flag interno
  `hasStarted` evita cualquier reproducción duplicada o reinicio —
  llamadas repetidas a `playEpilogueTheme()` son no-op seguro tras la
  primera.
- **Assets de audio existentes**: exactamente uno —
  `src/assets/audio/epilogue-theme-provisional.wav` (WAV PCM 16 bits,
  mono, 44100 Hz, ~24 s), generado localmente por síntesis con
  `tools/generate-epilogue-theme.mjs`, sin muestras de terceros
  (`src/assets/audio/README.md`). Etiquetado explícitamente como
  provisional y sustituible.
- **Tema actual del epílogo — cómo comienza**: se dispara desde un
  único punto de llamada, `WorldScene.completeBrideDialogue()`
  (`src/scenes/WorldScene.js:482`), justo antes de
  `scenes.change("credits")` — es decir, tras completar el diálogo
  final con la novia, ya muy avanzada la sesión de juego (docenas de
  interacciones previas ya ocurridas, por lo que cualquier restricción
  de autoplay del navegador ya está superada de facto en la práctica).
- **Cómo termina**: no hay ningún código que lo detenga explícitamente;
  al no repetir (`loop: false`), el propio elemento `<audio>` termina
  de forma natural tras los ~24 s del clip. No hay lógica de
  desvanecimiento (fade out).
- **Lifecycle entre escenas**: `AudioService` es una única instancia
  compartida, creada una vez en `main.js` y pasada solo a `WorldScene`
  (`src/main.js:41`) — ni `TitleScene` ni `CreditsScene` reciben `audio`
  hoy. Como los cambios de mapa dentro del recorrido (Plaza ↔ Puentes ↔
  Biblioteca ↔ Archivo) se implementan como mutación interna de estado
  (`this.state.changeMap(...)`), **no** como transición de
  `SceneManager` (`WorldScene.js:92,410`), un audio iniciado en
  `WorldScene` sobrevive automáticamente a todos los cambios de mapa sin
  lógica adicional. Entrar en una escena focal (los tres puzles) sí
  dispara `SceneManager.change()`, lo que ejecuta `WorldScene.exit()` —
  pero como el único uso actual de audio ocurre después de que el
  recorrido jugable normal ya terminó, este caso nunca se ha probado en
  la práctica.
- **Comportamiento web vs. Electron**: no hay ninguna rama de código
  diferenciada — mismo `window.Audio` nativo en ambos, porque Electron
  carga el mismo build web vía `loadFile` (mismo runtime DOM/JS).
- **Autoplay/gesto de usuario**: no hay ningún manejo explícito de
  "gesto de usuario" en el código — funciona hoy porque el único punto
  de reproducción ya ocurre tras mucha interacción previa. Este patrón
  **no** es directamente aplicable a una intro que se reproduciría al
  cargar la pantalla de título, antes de cualquier pulsación — ver §24.
- **Tests existentes**: `tests/platform/AudioService.test.js` (8 tests:
  instancia única incluso tras llamadas repetidas; ruta correcta;
  reproducción exactamente una vez; ausencia de superposición;
  promesa rechazada absorbida sin excepción sin manejar; excepción
  síncrona de `play()` absorbida; fallo de construcción absorbido;
  ausencia de constructor produce no-op seguro) y
  `tests/content/epilogueAudioConfig.test.js` (forma de
  `EPILOGUE_THEME_PATH`). Ninguna prueba E2E automatizada de audio —
  la validación real de audio en el juego completo se hizo manualmente
  (`EPILOGUE_MANUAL_VALIDATION.md`, `WINDOWS_PORTABLE_FULL_QA.md`).
- **Riesgo de audio duplicado o reiniciado entre escenas**: ninguno
  detectado con el diseño actual (un solo track, un solo punto de
  disparo, guardado por `hasStarted`) — pero esa misma simplicidad es
  la razón por la que **no** soporta directamente los tres pilares
  nuevos (intro distinta, ambiente en loop, SFX simultáneos) sin
  extensión real — ver §24.

## 24. Propuesta de audio v1.1

Extensión de `AudioService`, no una reconstrucción — sin modificar
código en esta tarea.

**Nota de honestidad (hallazgo de la revisión de calidad de scope de
esta misma tarea)**: llamar a esto "extensión mínima" en el sentido de
"cambio trivial" sería impreciso. `AudioService` pasa de un único
método que reproduce un único clip una vez, a gestionar varios
elementos de audio con roles distintos (música activa intercambiable,
SFX independientes simultaneables, lógica de transición entre dos
pistas de música) — es un salto real de complejidad respecto al código
actual, no un cambio de una línea. "Mínima" se sostiene en un sentido
más estricto y verificable: es la extensión **más pequeña que cubre
exactamente los tres MUST de audio de §13** (intro, ambiente,
transición al epílogo, 3 SFX) sin convertirse en un mezclador general,
sin configuración expuesta al jugador, y sin estado persistido — no
"pequeña en esfuerzo de implementación".

### Separación conceptual propuesta

```text
MUSIC
- intro
- ambient
- epilogue (ya existe, sin cambios de comportamiento)

SFX
- interact
- activate
- puzzle-success
- invalid (SHOULD)
```

Adaptado al código real: en vez de un mezclador general, se propone que
`AudioService` gane la capacidad de gestionar **varios elementos de
audio con roles distintos** (uno de música activo a la vez, SFX
independientes y de disparo corto), conservando exactamente el mismo
patrón de degradación segura ya probado (`try/catch`, promesa
`.catch(() => {})`, `hasStarted`-equivalente por track para evitar
duplicados). No se propone:

- un mezclador general de volúmenes por categoría;
- ajustes de configuración de audio expuestos al jugador, salvo que una
  necesidad técnica real lo justifique (no identificada aquí);
- ningún estado de audio persistido en `GameState` (§9, §15).

### Intro musical (§14 del pilar de audio)

**Decisión de producto (2026-08-11): resuelta.** La intro musical debe
iniciarse a partir de la **primera interacción válida del usuario** que
permita activar audio — **no** debe depender de autoplay con sonido al
cargar la página. Esto corresponde a la opción B evaluada en la versión
anterior de este documento (descartada la opción A, "intento inmediato
en `TitleScene.enter()`", precisamente por depender de autoplay sin
gesto previo):

La primera vez que `InputManager` registra cualquier tecla dentro de
`TitleScene`, esa misma pulsación sirve de gesto de usuario para
desbloquear la reproducción de la intro. Esto requiere que `TitleScene`
reciba `audio` (hoy no lo recibe, `src/main.js:34`) y algo de lógica
adicional de "primera pulsación", ausente hoy — la implementación
concreta de esa lógica, adaptada al flujo real de `TitleScene` (que ya
distingue `wasPressed("interact")` de `wasPressed("load")`, ver
`TitleScene.js:15-23`), se decide en su propia tarea técnica (tarea 14
del breakdown, §22) — **no se implementa en esta tarea**.

### Música ambiental (§15)

Una única pista, en loop, para todo el recorrido jugable normal. Dado
que los cambios de mapa no disparan `SceneManager.change()` (§23), basta
con iniciarla una vez — el punto más simple es `WorldScene.enter()` (o
el primer `update()` tras la primera entrada real al mundo) — para que
persista automáticamente a través de Plaza/Puentes/Biblioteca/Archivo
sin lógica de reinicio por mapa. Si debe sonar también durante los tres
puzles focales es una decisión pendiente (§5.11): la opción más simple
es que **no** se detenga ni se reinicie al entrar/salir de esas escenas
(si esas escenas no piden nada a `AudioService`, el ambiente sigue
sonando de fondo sin ningún cambio de código adicional).

### Transición al epílogo (§16)

```text
ambiente normal -> detener o fundido breve -> tema del epílogo
```

Se dispara en el mismo punto donde hoy se llama a
`playEpilogueTheme()` (`WorldScene.completeBrideDialogue()`). Sin
crossfade sofisticado: basta con detener (o silenciar con un fundido
corto, si `AudioService` lo soporta sin complejidad) el elemento de
ambiente antes de iniciar el elemento del tema del epílogo, que
conserva exactamente su comportamiento actual. El tema del epílogo no
se sustituye ni se reescribe en esta tarea.

### SFX (§17)

Tres SFX obligatorios (interact, activate, puzzle-success) y uno
opcional (invalid/incorrecto) — clips cortos, reproducidos de forma
independiente al track de música activo, sin loop, sin necesitar el
guardado de estado que sí tiene la música. Nada de pasos continuos,
sonido por cada tecla, ni sonido por cada cambio de interfaz — feedback
discreto y consistente, no un sistema de sonido general.

### Licencias (§19)

Todo asset de audio nuevo (intro, ambiente, SFX) debe ser original,
de dominio público, CC0, o tener una licencia explícitamente compatible
con la distribución del ejecutable — mismo estándar ya aplicado al
tema provisional del epílogo. Ningún fragmento de audio de videojuegos
comerciales, ni imitación reconocible de música protegida. La
procedencia/licencia de cada asset debe documentarse (mismo patrón que
`src/assets/audio/README.md`) antes de integrarse — no se elige la
fuente concreta en esta especificación (§5.12).

## 25. NPCs ambientales — auditoría de mapas y distribución propuesta

Dimensiones reales confirmadas (`src/content/worldMaps.js`):

| Mapa | Dimensiones (tiles) | NPCs con nombre ya existentes |
|---|---|---|
| Plaza del Axioma (`axiom-plaza`) | 48×32 (la más grande) | Alcaldesa Corolaria, Padre de la novia, Ayudante de la ceremonia, la novia (solo epílogo) |
| Paseo de los Siete Puentes (`seven-bridges-walk`) | 44×28 | Ninguno — mapa dominado por el tablero de P2 |
| Biblioteca del Margen (`library`) | 30×20 | Silogio |
| Archivo compacto (`archive`) | 24×16 (la más compacta) | Ninguno |

Distribución propuesta (objetivo total 8-15, coherente con el tamaño
relativo de cada mapa):

| Mapa | NPCs ambientales propuestos |
|---|---|
| Plaza del Axioma | 3-5 |
| Paseo de los Siete Puentes | 1-3 |
| Biblioteca del Margen | 2-4 |
| Archivo compacto | 1-3 |

Ajustada respecto a la referencia inicial del encargo solo en que se
confirma contra la geometría real: la Plaza es efectivamente el mapa
más grande y ya concentra la mayoría de NPCs con nombre existentes, y
el Archivo es efectivamente el más compacto (`ARCHIVE_CRITERIA_SPEC.md`
ya lo describe así) — la distribución propuesta no se aparta del rango
sugerido. Las posiciones exactas dentro de cada mapa quedan como
decisión de implementación (§5.9), respetando colisiones y objetos
interactuables existentes, con el mismo test de mapa (`assertSpawnIsClear`,
`tests/content/WorldMaps.test.js`) ya usado para validar objetos nuevos
(`EPILOGUE_SPEC.md` §6).

## 26. Calendario provisional hasta el 10 de septiembre de 2026

Guía de margen de seguridad, **no compromiso contractual de fechas
intermedias** (§5.14) — cualquier fecha puede ajustarse sin que eso
represente una decisión pendiente de aprobación adicional:

| Hito | Ventana provisional |
|---|---|
| Specification lock (aprobación de este documento) | 12-13 de agosto |
| Referencias reales + Visual Style Lock (§6 Nivel A) | Antes del 17 de agosto |
| Protagonistas y secundarios (Niveles A/B) | ~18-22 de agosto |
| NPCs ambientales (Nivel C) | ~21-24 de agosto |
| Audio funcional (intro, ambiente, transición, SFX) | ~23-27 de agosto |
| Integración y pulido | 27 de agosto - 2 de septiembre |
| QA completo (visual + audio + regresión de guardado) | 2-6 de septiembre |
| Windows / release candidate | 6-8 de septiembre |
| Margen de contingencia | 8-9 de septiembre |
| Fecha límite externa | 10 de septiembre de 2026 |

El propósito de este calendario es exclusivamente preservar margen de
seguridad antes del día 10 — mismo espíritu que las Fases 6-7 de
`V1_PRODUCTION_PLAN.md` para `v1.0.0` (congelación + contingencia),
sin heredar automáticamente ninguna de sus casillas ni su estructura
formal, que pertenecen a un ciclo ya cerrado (§1).

**Riesgos de calendario reconocidos explícitamente (hallazgo de la
revisión de calidad de scope de esta misma tarea)**:

- **Todo el pilar visual depende de un evento externo sin fecha
  comprometida**: la ventana "antes del 17 de agosto" para recibir las
  fotografías reales y cerrar el Visual Style Lock asume una entrega
  rápida (días, no semanas) que ninguna fuente garantiza — este
  documento no puede comprometer una fecha que no controla. Si las
  fotografías llegan más tarde, los sprites finales de Gonzalo, Elena y
  Max permanecen bloqueados hasta recibirlas y superar el Visual Style
  Lock — eso **no se salta bajo ninguna circunstancia** (no se inventan
  rasgos físicos para compensar el retraso, §3, §4).

  **Estrategia explícita de mitigación (decisión de producto,
  2026-08-11)**: un retraso en las fotografías **no bloquea todo el
  desarrollo de `v1.1`** — el siguiente trabajo puede adelantarse en
  paralelo, sin depender de ellas en absoluto:
  - `personalizationConfig.js` (tarea 1, §22);
  - nomenclatura/dedicatoria (tarea 2, §22);
  - auditoría visual y definición de estilo previas al Visual Style Lock
    (tareas 4-5, §22) — bocetos de dirección de arte que no requieren
    todavía la referencia real;
  - **exploración conceptual** (no arte final) de los secundarios ya
    confirmados, que no son personas reales (Alcaldesa Corolaria, Padre
    de la novia, Silogio — Nivel B, §6) — su producción final sigue
    gateada por el Visual Style Lock, igual que el resto de Nivel B/C
    (ver el matiz explícito en §6);
  - sistema de variantes de NPC (tarea 9, §22) y su distribución por
    mapa (§25);
  - arquitectura/extensión de `AudioService` (tarea 13, §22);
  - intro, música ambiental y SFX (tareas 14-17, §22) — todo el pilar de
    audio es independiente del pilar visual.

  Solo quedan bloqueadas por las fotografías: la tarea 6 (sprites
  finales de Gonzalo/Elena/Max) y, en cascada, la tarea 7 (Visual Style
  Lock) y las tareas que dependen de ella (8, 10, 12). El pilar de audio
  (§23-24) es completamente independiente y no se ve afectado por este
  riesgo en ningún caso.
- **El margen de contingencia (8-9 de septiembre, 1-2 días) es nominal,
  no real**, si cualquier hito anterior se retrasa — especialmente el
  primero (fotografías), del que depende la mayoría del calendario. No
  hay margen adicional oculto en ningún otro hito.
- Si el volumen del MUST descrito en §13 (nota de honestidad al inicio
  de esa sección) no encaja en el calendario una vez las fotografías
  lleguen, la respuesta correcta es recortar SHOULD/COULD primero (§13
  ya confirma que ninguno es prerrequisito silencioso del MUST) y, si
  no basta, volver a esta especificación para una decisión explícita de
  recorte del propio MUST — no comprimir QA (§18) ni el margen de
  contingencia.

## 27. Expansion Gate / Scope Freeze

El alcance definido en §13 (MUST/SHOULD/COULD/OUT) constituye el
**SCOPE COMPROMETIDO de `v1.1`**. No se permite añadir ninguna feature
adicional a este alcance hasta superar la Expansion Gate descrita abajo
— y, superada esa gate, solo dentro de los límites estrictos de la
sección "Qué se puede añadir si se supera la gate".

### Expansion Gate

**Ventana provisional**: aproximadamente entre el 27 y el 30 de agosto
de 2026 (coincide con el hito "Integración y pulido" de §26).

La Expansion Gate **solo** puede considerarse superada si **todas** las
condiciones siguientes se cumplen a la vez:

- Todos los MUST de §13 están implementados.
- CI está en verde (`docker compose run --rm game npm run check`, y
  `npm run verify`/Playwright cuando corresponda).
- No existen defectos bloqueantes conocidos.
- La compatibilidad de guardados `v1.0.0` → `v1.1` está verificada
  (§16, prueba de regresión).
- La personalización visual principal (Nivel A: Gonzalo, Elena, Max)
  está integrada.
- El audio principal (intro, ambiente, transición al epílogo, SFX
  básicos) está integrado.
- Los NPCs ambientales (Nivel C) están integrados.
- Existe una build jugable integrada con todo lo anterior junto, no
  piezas sueltas sin ensamblar.
- Sigue existiendo margen real (no solo nominal, ver §26) para QA
  completo y para el ciclo de Windows/release antes del 10 de
  septiembre de 2026.

**"Código terminado" no es, por sí solo, criterio suficiente para
ampliar** — deben cumplirse las nueve condiciones de arriba a la vez,
incluida la existencia de margen real restante.

**La decisión de ampliar el alcance tras superar la gate requiere
aprobación humana explícita** — no se decide por inferencia, ni por
`autopilot`, ni porque una tarea concreta haya ido más rápido de lo
esperado.

### Qué se puede añadir si se supera la gate

Incluso si la Expansion Gate se supera con las nueve condiciones
cumplidas, **solo pueden considerarse 1-2 mejoras pequeñas y
aisladas** — no una reapertura general del alcance.

**Criterio orientativo de tamaño**:

| Estimación | Tratamiento |
|---|---|
| ≤ 0,5 día, riesgo bajo | Buen candidato |
| ~1 día, aislado, sin afectar persistencia/progresión | Puede valorarse |
| ≥ 2 días, o cambios importantes en `GameState`, persistencia, mapas, progresión o arquitectura | Aplazar a una versión posterior — no entra en `v1.1` |

**Ejemplos posibles del tamaño adecuado** (citados como referencia de
escala, **sin aprobar ninguno todavía** — cualquiera de ellos requiere
su propia aprobación explícita si se propone en su momento):

- una variante ambiental pequeña adicional;
- un detalle adicional de Max (dentro de lo ya aprobado, §8);
- un NPC ambiental adicional, dentro o ligeramente por encima del
  objetivo 8-15 (§25);
- un pequeño detalle visual adicional;
- un SFX adicional;
- un pequeño pulido de presentación.

**No se reintroducen como candidatos, bajo ninguna circunstancia**, ni
siquiera tras superar la gate:

- mapas nuevos;
- puzles nuevos;
- sistemas jugables nuevos;
- pathfinding;
- rediseño visual completo;
- un sistema de audio complejo (mezclador general, configuración
  expuesta al jugador, música por mapa — ver OUT en §13).

### Hard Scope Freeze — 2 de septiembre de 2026

A partir del **2 de septiembre de 2026**, con independencia de si la
Expansion Gate se superó o no, y con independencia de si se aprobó
alguna mejora pequeña bajo la sección anterior: **no se añade ninguna
funcionalidad nueva**, de ningún tamaño.

A partir de esa fecha, el trabajo se limita exclusivamente a:

- corregir bugs;
- resolver regresiones;
- pulir contenido ya implementado (sin ampliar su alcance funcional);
- QA;
- verificación de compatibilidad;
- empaquetado (packaging);
- release.

La fecha límite externa sigue siendo, sin cambios, el **10 de
septiembre de 2026** (§26).
