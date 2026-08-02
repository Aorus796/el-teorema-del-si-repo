# Historial de cambios

Todos los cambios relevantes se registrarán siguiendo una adaptación de Keep a Changelog.

## [No publicado]

### Añadido

- Game Design Document consolidado.
- Documento técnico y plan de producción.
- Catálogo de once puzles principales.
- Estructura inicial del repositorio.
- Plantillas de incidencias y pull requests.
- Capa de automatización con Claude Code: `CLAUDE.md`, agentes
  especializados (`planner`, `developer`, `qa`, `reviewer`), skill
  `autopilot`, quality gate único `npm run verify`, workflow de CI en
  GitHub Actions y hooks de protección en `.claude/settings.json`. Ver
  [`docs/development/AUTOMATION.md`](docs/development/AUTOMATION.md).
- Prueba Playwright que resuelve realmente el tercer puzle del Archivo
  ("La pregunta correcta") con la secuencia de teclado completa, en vez
  de solo abrir y cerrar la escena: clasifica las seis afirmaciones,
  confirma, y comprueba el avance narrativo resultante (banderas
  `investigationComplete`/`epilogueUnlocked`, objetivo `start-epilogue`,
  entrada de cuaderno `archive-final-evidence` y el guardado persistido
  en `localStorage`).
- Prueba Playwright que resuelve realmente el segundo puzle de la
  Biblioteca ("El catálogo perfecto") con la secuencia de teclado
  completa: intercambia los documentos hasta el orden `A-D-R-C-M`,
  confirma, y comprueba el avance narrativo resultante (bandera
  `archiveUnlocked`, objetivo `inspect-archive-criteria-table`, entrada
  de cuaderno `library-catalogue-solution` y el guardado persistido en
  `localStorage`).
- Prueba Playwright que resuelve realmente el primer puzle de los Siete
  Puentes ("El paseo imposible") con la secuencia de teclado completa:
  avanza el diálogo de apertura verificando cada línea en el DOM, cierra
  el puente B1, y recorre los seis puentes restantes (`B2-B3-B6-B7-B4-B5`)
  desde la entrada hasta el molino, y comprueba el avance narrativo
  resultante (objetivo `inspect-p2-evidence`, entrada de cuaderno
  `p2-bridges-solution` y el guardado persistido en `localStorage`).
- Prueba Playwright que guarda y carga la partida en la Plaza del Axioma,
  la cuarta y última de las localizaciones obligatorias sin esta
  cobertura: siembra un guardado, lo carga, guarda de nuevo con "K", hace
  el primer `page.reload()` real del repositorio, vuelve a cargar con "L"
  y guarda una segunda vez, comprobando en el guardado resultante que
  mapa, posición, orientación, banderas relevantes y objetivo coinciden
  con lo esperado — demostrando que `GameState` se restauró de verdad en
  memoria tras el ciclo completo de guardar → recargar la página →
  cargar, no solo que el `localStorage` quedó intacto.
- Prueba Playwright que restaura un intento incompleto y fallido del
  catálogo de la Biblioteca (fase `failed`, orden inválido, una pista
  leída, un intento consumido) tras un `page.reload()` real: siembra el
  guardado, entra al catálogo, intercambia dos documentos y confirma un
  orden que incumple las reglas, guarda con "K", recarga la página, carga
  de nuevo con "L", reentra en el catálogo para confirmar que reconstruir
  un intento `failed` no lanza excepciones, y guarda una segunda vez,
  comprobando que `phase`, `order`, `hintsRead`, `attemptCount` y
  `failureCode` del guardado resultante coinciden con el intento original —
  demostrando que `GameState` restauró de verdad el intento incompleto en
  memoria, no solo que sobrevivió en `localStorage`.
- Prueba Playwright que restaura un intento a medias del primer puzle de
  los Siete Puentes (fase `traversing`, recorrido `E-R` con un puente ya
  cruzado) tras un `page.reload()` real: siembra el guardado, entra al
  puzle, cruza un segundo puente (`B3`, `R`→`N`), guarda con "K", recarga
  la página, carga de nuevo con "L", reabre el diálogo del mapa (sigue
  disponible porque el recorrido no está resuelto), cruza un tercer puente
  (`B6`, `N`→`L`) — movimiento que solo produce el resultado correcto si el
  recorrido se reanudó de verdad en el nodo `N` — y guarda una segunda vez,
  comprobando que `phase`, `currentNode`, `route`, `usedBridgeIds` y
  `lifecycle` del guardado resultante reflejan el recorrido acumulado en
  ambas rondas — demostrando que `GameState` restauró de verdad un intento
  de P2 a medio camino en memoria, no solo que sobrevivió en `localStorage`.
- Prueba Playwright que restaura una clasificación incompleta del Archivo
  (fase `classifying`, dos de las seis afirmaciones ya clasificadas, una
  pista leída, sin confirmar nunca) tras un `page.reload()` real: siembra
  el guardado, entra a "La pregunta correcta", clasifica dos afirmaciones
  (`voluntary-entry` y `followed-trail`, ambas `confirmed`), guarda con
  "K", recarga la página, carga de nuevo con "L", reentra en el Archivo
  para confirmar que reconstruir un intento `classifying` no lanza
  excepciones, clasifica una tercera afirmación (`never-disagreed`) —
  movimiento que solo produce el resultado correcto si las dos anteriores
  se restauraron de verdad en memoria — y guarda una segunda vez,
  comprobando que `phase`, `verdicts`, `hintsRead`, `attemptCount` y
  `failureCode` del guardado resultante contienen las tres clasificaciones
  juntas — demostrando que `GameState` restauró de verdad la clasificación
  incompleta en memoria, no solo que sobrevivió en `localStorage`. Con esta
  cobertura queda completo el criterio de "intento incompleto restaurable"
  para los tres puzles del juego (catálogo de la Biblioteca en `failed`,
  primer puzle de los Siete Puentes en `traversing`, y el Archivo en
  `classifying`).
- Prueba Playwright que migra en un navegador real un guardado del formato
  legado más antiguo soportado (`formatVersion: 1`, sin `world.playerByMap`
  ni `puzzles.archiveCriteria`, con un `puzzles.libraryCatalogue` inválido
  para el formato vigente) al cargarlo con "L": comprueba que el progreso
  de P2 migrado (fase `traversing`, recorrido `E-R` a mitad de camino) es
  funcionalmente continuable cruzando un tercer puente (`B3`, `R`→`N`) con
  teclado, y que el guardado resultante reescribe siempre `formatVersion: 4`
  con `libraryCatalogue` y `archiveCriteria` reiniciados a su estado por
  defecto — ya que el formato 1 no los contenía —, conservando a la vez el
  `objectiveId` y la entrada de cuaderno heredados del formato legado. Sin
  errores de consola ni excepciones sin capturar durante la migración.
- Prueba Playwright que combina en un único guardado avanzado las seis
  dimensiones de estado a la vez (mapa, posición, las nueve banderas, el
  objetivo, un cuaderno de cuatro entradas, y los tres puzles: P2 y el
  catálogo de la Biblioteca resueltos, y el Archivo a medio clasificar) y
  demuestra que sobreviven juntas a un `page.reload()` real: siembra el
  guardado, carga con "L", guarda con "K" y comprueba campo a campo el
  resultado, recarga la página sin sembrar nada de nuevo, carga de nuevo
  con "L", guarda una segunda vez con "K" y repite la misma comprobación
  completa sobre el nuevo guardado mediante una función auxiliar
  reutilizable — demostrando que `GameState` restauró de verdad las seis
  dimensiones combinadas en memoria, no solo que sobrevivieron por
  separado en `localStorage`. Con esta cobertura queda cerrado el
  criterio de "Estado y guardado" del plan de producción.
- Pruebas unitarias que verifican que la posición inicial de aparición en
  la Plaza del Axioma y el Paseo de los Siete Puentes es transitable y no
  solapa ningún objeto del mapa, replicando en `tests/content/WorldMaps.test.js`
  el mismo patrón ya usado para la Biblioteca y el Archivo — las cuatro
  localizaciones obligatorias quedan así cubiertas por igual frente a
  bloqueos accidentales en el punto de aparición.

### Corregido

- El manejo de guardados inválidos o incompatibles al cargar ("L" en el
  título y en el mundo) es ahora atómico y no propaga excepciones sin
  capturar: `GameState.restore()` construye escena, mundo, jugador,
  banderas, objetivo, cuaderno y los tres puzles en variables locales
  antes de mutar el estado, de modo que un guardado con JSON corrupto,
  `formatVersion` incompatible o datos de catálogo/Archivo inválidos deja
  el progreso previo intacto; `WorldScene.load()` captura cualquier error
  de `storage.load()` o `state.restore()` y muestra un aviso claro en
  lugar de romper el juego.

### Pendiente

- Prototipos de papel de P2, P6 y P10.
- Prototipo técnico mínimo.
- Vertical slice del prólogo.
- Selección del candado y parametrización de P11.
