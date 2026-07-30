# Codex Project Handoff — El Teorema del Sí

## Propósito

Este documento permite continuar el desarrollo de **El Teorema del Sí** desde una nueva conversación de Codex sin depender del historial anterior.

Antes de modificar código, Codex debe leer completamente:

- `/AGENTS.md`
- `/docs/production/CODEX_HANDOFF.md`
- `/docs/production/NEXT_CODEX_TASK.md`
- `/docs/production/V1_PRODUCTION_PLAN.md`
- `/docs/puzzles/LIBRARY_CATALOGUE_SPEC.md`
- `/docs/puzzles/ARCHIVE_CRITERIA_SPEC.md`

No debe editar ningún archivo hasta comprobar el estado Git y explicar lo que ha entendido.

---

## Estado Git esperado

Repositorio:

```text
git@github.com:Aorus796/el-teorema-del-si-repo.git
```

Rama de trabajo:

```text
feat/v1-production-scope
```

Commit mínimo requerido (HEAD puede ser cualquier descendiente):

```text
7a0c13c feat: unlock archive after catalogue puzzle
```

Commits recientes relevantes:

```text
7a0c13c feat: unlock archive after catalogue puzzle
e49571b docs: relax Codex handoff head check
5594216 docs: update Codex handoff head
56c5c57 docs: add Codex handoff and next task
fad4d94 feat: add library world integration
85a9546 feat: add library catalogue scene
29430b7 feat: persist library catalogue state
30eea7f feat: add library catalogue state and controller
de5d6a2 feat: add library catalogue validator
8d88c9b feat: add sequential puzzle hints
93de060 docs: define archive criteria puzzle
8d2885a docs: define library catalogue puzzle
```

El árbol de trabajo debe estar limpio antes de comenzar el siguiente bloque.

---

## Comprobación inicial obligatoria

Antes de editar, ejecutar:

```bash
git branch --show-current
git status --short
git log -10 --oneline
```

Comprobar:

- rama `feat/v1-production-scope`;
- árbol de trabajo limpio;
- HEAD contiene el commit `7a0c13c` en su historial;
- existencia de `AGENTS.md`;
- existencia de los documentos de producción y especificaciones;
- `SAVE_FORMAT_VERSION === 3` (subirá a `4` durante el bloque Archive Criteria, ver más abajo);
- mapas registrados actuales, incluido `archive`;
- escena `library-catalogue` registrada;
- objeto `archive-criteria-table` presente en el mapa `archive` y todavía inerte (sin escena asociada).

La nueva sesión debe explicar lo que ha entendido antes de implementar.

---

## Entorno de desarrollo

- Windows
- PowerShell
- VS Code
- Docker Desktop
- JavaScript ES modules
- Canvas 2D
- Docker Compose
- no se requiere Node instalado directamente en Windows

Servidor local:

```text
http://127.0.0.1:8080
```

Reconstrucción del contenedor de juego:

```powershell
docker compose up -d --build --force-recreate game
```

Validación completa:

```powershell
docker compose run --rm game npm run check
docker compose run --rm playwright
git diff --check
git status --short
```

No afirmar que una validación ha pasado sin ejecutar el comando correspondiente.

---

## Reglas de trabajo

- Implementar un único bloque funcional cada vez.
- No mezclar características independientes en el mismo bloque.
- Revisar el diff real antes de preparar el commit.
- Codex no debe hacer commit ni push.
- El usuario realiza `git add`, commit y push desde PowerShell.
- Mantener los cambios dentro del alcance exacto de `NEXT_CODEX_TASK.md`.
- No crear accesos temporales, teclas secretas, parámetros de URL o menús de depuración.
- No añadir dependencias sin autorización.
- Mantener JavaScript ES modules.
- Usar funciones puras y estado inmutable cuando corresponda.
- Mantener el estado visual transitorio fuera de `GameState`.
- No acceder directamente a `localStorage` fuera del sistema existente.
- No modificar P2, sistemas generales o documentos de diseño salvo autorización expresa.
- Ejecutar pruebas unitarias, build, Playwright y `git diff --check` tras cada bloque.
- No hacer refactors generales durante un bloque funcional.
- Detenerse y explicar el bloqueo si para completar el alcance fuese necesario modificar un archivo expresamente prohibido.

---

## Producto

Título:

```text
El Teorema del Sí
```

Tipo:

Aventura narrativa de puzles matemáticos en pixel art creada como regalo de boda.

Fecha límite:

```text
10 de septiembre de 2026
```

Duración objetivo:

```text
45–90 minutos
```

Resolución lógica principal:

```text
480×270
```

Alcance reducido de v1:

- Plaza del Axioma
- Paseo de los Siete Puentes
- Biblioteca
- Archivo compacto
- tres puzles principales
- cuaderno
- pistas
- guardado y carga
- epílogo personalizado
- ejecutable Windows

Fuera del alcance principal:

- Jardín completo
- Molino completo
- Observatorio completo
- interiores secundarios extensos
- metapuzle largo

---

## Arquitectura actual

Escenas principales:

- `TitleScene`
- `WorldScene`
- `P2BridgesScene`
- `LibraryCatalogueScene`

Mapas registrados:

- `axiom-plaza`
- `seven-bridges-walk`
- `library`

Registro de mapas:

```text
src/content/worldMaps.js
```

Escena de mundo:

```text
src/scenes/WorldScene.js
```

Estado global:

```text
src/state/GameState.js
```

---

## Estado global y persistencia

Formato actual (antes de implementar Archive Criteria):

```js
SAVE_FORMAT_VERSION = 3
```

Formatos históricos soportados:

- 1
- 2

Los formatos 1 y 2 migran al formato actual.

El formato 3 contiene:

- escena;
- jugador;
- mapa actual;
- posiciones por mapa, incluida `archive`;
- banderas, incluida `archiveUnlocked`;
- objetivo;
- cuaderno;
- P2;
- catálogo de Biblioteca (con sus consecuencias narrativas ya aplicadas).

La clave de `StorageAdapter` no cambió.

Posiciones independientes actuales:

- `axiom-plaza`
- `seven-bridges-walk`
- `library`
- `archive`

### Migración prevista para el bloque Archive Criteria

El bloque **Archive Criteria** (siguiente bloque, ver más abajo) subirá
`SAVE_FORMAT_VERSION` de `3` a `4`. Es un cambio de formato aprobado y
necesario, no accidental.

Al implementarlo es obligatorio mantener **tres listas de versiones
separadas**, no una sola:

- versiones legacy generales aceptadas por `GameState.restore()`: `[1, 2, 3]`;
- formatos en los que `libraryCatalogue` **no** tiene datos persistidos
  todavía: solo `[1, 2]` — el formato `3` ya contiene el catálogo real
  (resuelto o no) y debe seguir leyéndose como dato real, nunca
  reinicializarse;
- formatos en los que `archiveCriteria` **no** tiene datos persistidos
  todavía: `[1, 2, 3]` — solo el formato `4` lo contiene.

Reutilizar una única lista compartida para las tres comprobaciones es un
error conocido: si el formato `3` se trata como "legacy" también para el
catálogo, cualquier partida real en formato `3` (catálogo ya resuelto,
`archiveUnlocked = true`) perdería su catálogo al cargar y volvería al
orden inicial sin resolver. El bloque Archive Criteria debe incluir un
test explícito que demuestre que una partida `v3` con el catálogo
resuelto conserva ese catálogo intacto tras migrar a `v4`, inicializando
únicamente `archiveCriteria`.

---

## P2 — Paseo de los Siete Puentes

P2 está implementado, integrado y persistido.

Incluye:

- estado;
- controlador;
- escena jugable;
- pistas secuenciales;
- persistencia;
- consecuencias narrativas;
- acceso posterior a la Biblioteca.

La evidencia del embarcadero activa:

```js
state.flags.libraryObjectiveUnlocked
```

No modificar P2 salvo autorización expresa.

---

## Sistema común de pistas

Utilidad:

```text
src/puzzles/core/HintProgress.js
```

Formato canónico:

```js
[]
[1]
[1, 2]
[1, 2, 3]
```

P2 y el catálogo usan este sistema.

Los textos de pistas no se almacenan dentro del estado persistente.

---

## Segundo puzle — El catálogo perfecto

Ubicación:

```text
Biblioteca
```

Documentos:

- A — Atlas de Órbitas
- D — Diario de Campo
- R — Registro de Compuertas
- C — Catálogo de la Criba
- M — Manual del Molino

Orden inicial:

```text
C-M-A-R-D
```

Solución única:

```text
A-D-R-C-M
```

Reglas:

1. A está inmediatamente a la izquierda de D.
2. C no está en un extremo.
3. M está a la derecha de R.
4. D no está junto a M.
5. R está a la izquierda de C.
6. R no está en un extremo.

Archivos principales:

```text
src/puzzles/library-catalogue/LibraryCatalogueData.js
src/puzzles/library-catalogue/LibraryCatalogueValidator.js
src/puzzles/library-catalogue/LibraryCatalogueHints.js
src/puzzles/library-catalogue/LibraryCatalogueState.js
src/puzzles/library-catalogue/LibraryCataloguePuzzle.js
src/scenes/LibraryCatalogueScene.js
```

Modelo persistente exacto:

```js
{
  order: ["C", "M", "A", "R", "D"],
  phase: "ready",
  hintsRead: [],
  attemptCount: 0,
  failureCode: null,
}
```

Estados válidos:

- `ready`
- `arranging`
- `failed`
- `solved`

`focusedIndex` y `selectedIndex` son exclusivamente transitorios.

Controles:

- E / `selectPuzzleOption`: seleccionar, cancelar o intercambiar;
- Enter / `startPuzzleAttempt`: confirmar;
- Q / `nextPuzzleHint`: revelar pista;
- R / `restartPuzzleAttempt`: reiniciar;
- Escape / `cancel`: volver a `world`.

La escena está registrada como:

```text
library-catalogue
```

Al resolverse por primera vez, el catálogo aplica sus consecuencias
narrativas mediante `applyLibraryCatalogueProgression`
(`src/progression/LibraryCatalogueProgression.js`): establece
`archiveUnlocked`, actualiza `objectiveId` a
`inspect-archive-criteria-table` y añade la entrada de cuaderno
`library-catalogue-solution`. Es idempotente y se aplica también al
restaurar partidas antiguas resueltas sin la bandera.

---

## Biblioteca integrada

Mapa:

```text
id: library
name: Biblioteca
```

Dimensiones:

```text
30×20 tiles
```

Posición inicial:

```js
{ x: 240, y: 256, facing: "up" }
```

La Biblioteca:

- contiene colisiones;
- contiene estanterías provisionales;
- contiene a Silogio;
- tiene salida hacia `seven-bridges-walk`.

El acceso desde el Paseo depende exclusivamente de:

```js
state.flags.libraryObjectiveUnlocked
```

Con la bandera falsa:

- no cambia de mapa;
- no modifica progreso;
- muestra que todavía no hay motivo para ir a la Biblioteca.

Con la bandera verdadera:

- entra en `library`;
- conserva la posición del Paseo;
- aparece fuera del radio del portal de regreso.

Silogio:

- abre `library-catalogue`;
- no modifica catálogo;
- no cambia banderas;
- no cambia objetivo;
- no añade cuaderno;
- sincroniza la posición antes de abandonar `world`.

---

## Archivo integrado

Mapa:

```text
id: archive
name: Archivo
```

Dimensiones:

```text
24×16 tiles (más compacto que la Biblioteca)
```

El Archivo:

- contiene colisiones y límites cerrados;
- contiene estanterías y cajas decorativas reutilizando el tipo `tables`;
- contiene el objeto `archive-criteria-table` (id estable), **visible pero
  todavía inerte**: no abre ninguna escena, no cambia banderas, objetivo
  ni cuaderno, no produce ninguna acción al pulsar E;
- tiene salida hacia `library`.

El acceso desde la Biblioteca depende exclusivamente de:

```js
state.flags.archiveUnlocked
```

Portales:

- `library-to-archive`: con la bandera falsa no cambia de mapa y muestra
  «El acceso al Archivo sigue cerrado.»; con la bandera verdadera cambia a
  `archive` conservando la posición de la Biblioteca y apareciendo fuera
  del radio del portal de regreso.
- `archive-to-library`: vuelve a `library` conservando la posición del
  Archivo, sin reabrir el catálogo ni reaplicar consecuencias.

No existe todavía ninguna escena `archive-criteria`. El bloque siguiente
la añade.

---

## Validación manual ya realizada

Ruta validada (bloques del catálogo):

1. completar P2;
2. examinar la evidencia del embarcadero;
3. entrar en la Biblioteca;
4. caminar hasta Silogio;
5. abrir el catálogo;
6. intercambiar documentos;
7. salir con Escape;
8. reabrir el catálogo;
9. comprobar que el orden persiste;
10. volver al Paseo sin bucle de portales.

No se detectaron bloqueos de colisión en esa ruta.

Ruta validada (bloque `7a0c13c` — Archivo), completada correctamente:

1. cargar una partida guardada con el catálogo ya resuelto;
2. comprobar la entrada de cuaderno «El catálogo perfecto» con el orden
   `A-D-R-C-M`;
3. comprobar el objetivo «Entra en el Archivo y examina la mesa de
   criterios.»;
4. cruzar el portal Biblioteca → Archivo;
5. comprobar que la aparición en el Archivo no produce un bucle de
   reentrada inmediata;
6. caminar hasta `archive-criteria-table` y comprobar el prompt de
   interacción;
7. pulsar E sobre la mesa y comprobar que queda inerte (no abre ninguna
   escena ni modifica banderas, objetivo o cuaderno);
8. volver por el portal Archivo → Biblioteca sin bucle de reentrada.

No se detectaron bloqueos de colisión, errores de consola ni bucles de
portal en esa ruta.

---

## Línea base de pruebas

Tras `7a0c13c`:

- 149 pruebas unitarias superadas;
- 0 pruebas unitarias fallidas;
- build estático correcto;
- 2 pruebas Playwright superadas;
- 0 pruebas Playwright fallidas;
- `git diff --check` correcto.

Pruebas E2E actuales:

- título;
- nueva partida y apertura del cuaderno mediante Q/Tab.

La validación manual en navegador del acceso al Archivo y de
`archive-criteria-table` se completó correctamente — ver «Validación
manual ya realizada».

---

## Siguiente bloque

La siguiente tarea está definida íntegramente en:

```text
docs/production/NEXT_CODEX_TASK.md
```

Resumen: **Archive Criteria — "La pregunta correcta"**, el tercer y
último puzle principal, situado en el Archivo compacto.

Incluye:

- datos, validador, estado y controlador del puzle (6 afirmaciones, 3
  veredictos);
- escena focal `archive-criteria` y su registro en `src/main.js`;
- conexión de `archive-criteria-table` con la nueva escena, sin modificar
  `src/content/worldMaps.js`;
- subida de `SAVE_FORMAT_VERSION` de `3` a `4`, con migración explícita
  desde `1`, `2` y `3`, manteniendo separadas las tres listas de formatos
  descritas en «Estado global y persistencia»;
- consecuencias narrativas idempotentes: banderas `investigationComplete`
  y `epilogueUnlocked`, objetivo `start-epilogue`, entrada de cuaderno
  `archive-final-evidence`.

El tercer puzle **sí** debe implementarse en este bloque. Lo que queda
fuera de alcance es el epílogo en sí (escena, `epilogueStarted`,
`epilogueCompleted`), la personalización y Max — ver «Bloque en curso:
Archive Criteria» más abajo.

---

## Bloque en curso: Archive Criteria

Especificación:

```text
docs/puzzles/ARCHIVE_CRITERIA_SPEC.md
```

Nombre:

```text
La pregunta correcta
```

Concepto: clasificar seis afirmaciones como `confirmed`, `contradicted` o
`undecidable`, con solución única, cerrada en la especificación.

Decisiones ya aprobadas para este bloque (no reabrir sin autorización):

- `SAVE_FORMAT_VERSION` pasa de `3` a `4`;
- `objectiveId` resultante al resolver: `start-epilogue`, solo durante la
  transición real `epilogueUnlocked: false -> true`;
- banderas resultantes: `investigationComplete` y `epilogueUnlocked`
  (reparables de forma independiente, ver `NEXT_CODEX_TASK.md`);
- entrada de cuaderno resultante: `archive-final-evidence`;
- las pistas viven en `ArchiveCriteriaHints.js`, mismo patrón que
  `LibraryCatalogueHints.js`;
- `src/content/worldMaps.js` no se modifica: `archive-criteria-table` ya
  tiene todo lo necesario y el despacho es por `id`, no por `type`.

Todavía **no** están implementados ni forman parte de este bloque:

- el epílogo en sí (escena, `epilogueStarted`, `epilogueCompleted`);
- personalización (`personalization.js`, marcadores);
- Max;
- cambios en P2.

Se implementará por bloques posteriores, en el orden descrito en «Orden de
trabajo posterior».

---

## Personalización futura

No implementar durante el bloque del Archivo.

Datos aprobados:

- protagonista: Gonzalo;
- pareja: Elena;
- pareja completa: Gonzalo y Elena;
- fecha: 26 de septiembre de 2026;
- fecha ISO: 2026-09-26;
- ciudad real: Logroño;
- pueblo ficticio: Axioma;
- compañero: Max;
- especie: perro;
- raza: pastor belga malinois;
- tono del epílogo: emotivo y divertido.

Marcadores previstos:

```text
{{PROTAGONIST_NAME}}
{{PARTNER_NAME}}
{{COUPLE_NAMES}}
{{DOG_NAME}}
{{DOG_SPECIES}}
{{DOG_BREED}}
{{WEDDING_DATE}}
{{WEDDING_DATE_ISO}}
{{WEDDING_CITY}}
{{STORY_TOWN}}
{{FINAL_DEDICATION}}
```

Dedicatoria prevista:

> Gonzalo y Elena: que nunca os falten caminos por recorrer, preguntas que resolver juntos y razones para seguir diciendo sí. Que la vida os encuentre siempre del mismo lado del puente, con Max cerca, muchas risas y la certeza de que el mejor teorema es el que se demuestra cada día: elegiros una y otra vez.

La personalización debe centralizarse posteriormente en un único archivo.

No dispersar nombres o fechas por las escenas.

Max se implementará después del epílogo como compañero visual seguro, inicialmente sin pathfinding complejo.

---

## Orden de trabajo posterior

1. ~~Consecuencias del catálogo y mapa del Archivo~~ — completado en
   `7a0c13c`.
2. Archive Criteria: lógica, escena e integración completas — **bloque
   actual**, ver `NEXT_CODEX_TASK.md`.
3. Resolución final y epílogo.
4. Personalización centralizada.
5. Max como compañero visual.
6. Empaquetado Windows.
7. QA y release final.

---

## Primer mensaje para la nueva conversación de Codex

Usar este texto después de cambiar de cuenta:

```text
Vas a continuar un proyecto existente desde una conversación anterior a la que no tienes acceso.

Antes de modificar cualquier archivo:

1. Lee completamente:
   - AGENTS.md
   - docs/production/CODEX_HANDOFF.md
   - docs/production/NEXT_CODEX_TASK.md

2. Inspecciona el repositorio y ejecuta únicamente:
   - git branch --show-current
   - git status --short
   - git log -10 --oneline

3. Comprueba que:
   - la rama es feat/v1-production-scope;
   - el árbol de trabajo está limpio;
   - HEAD contiene como ancestro el commit mínimo indicado en CODEX_HANDOFF.md;
   - existen todos los archivos importantes indicados en el handoff.

4. No edites todavía.

5. Responde mostrando:
   - rama;
   - HEAD;
   - estado del árbol;
   - arquitectura comprendida;
   - funcionalidades ya implementadas;
   - tarea siguiente;
   - archivos que esperas modificar;
   - elementos expresamente fuera de alcance;
   - dudas o discrepancias encontradas.

No hagas commit ni push.
No empieces la implementación hasta que revise tu respuesta.
```
