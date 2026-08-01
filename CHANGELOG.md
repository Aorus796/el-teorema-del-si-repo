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
