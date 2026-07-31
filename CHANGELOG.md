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
