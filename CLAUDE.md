# Instrucciones para Claude Code en este repositorio

## Relación con `AGENTS.md`

`AGENTS.md` sigue siendo la fuente de verdad para la arquitectura del juego,
las convenciones de código, el alcance congelado de `v1.0.0` y las reglas de
migración de guardado. Léelo siempre antes de tocar código de juego. Este
documento no lo duplica: añade la capa de automatización y orquestación con
la que Claude debe trabajar en este repositorio. Si algo pareciera
contradecir a `AGENTS.md` en materia de juego (arquitectura, alcance,
convenciones), `AGENTS.md` gana. Si es sobre el flujo de trabajo con Claude
(agentes, quality gate, git, PRs), este documento gana.

## Estructura del repositorio

- `src/` código fuente (módulos ES, sin framework); `tests/` pruebas del
  runner nativo de Node más e2e de Playwright en `tests/e2e/`; `tools/`
  scripts de build/dev/servidor; `docs/` diseño, arquitectura, producción y,
  desde ahora, `docs/development/AUTOMATION.md` para este sistema autónomo.
  Detalle completo en `AGENTS.md` → "Arquitectura actual".
- `compose.yaml` define dos servicios Docker: `game` (Node simple, sirve
  `npm run dev`, no necesita `npm ci` porque test/build no usan
  dependencias en tiempo de ejecución) y `playwright` (imagen oficial de
  Playwright, ejecuta `npm ci && npm run test:e2e`, con volumen propio para
  `node_modules`). No existe un único contenedor con Node simple y
  navegadores de Playwright a la vez: por eso la validación local completa
  son dos comandos, no uno.

## Comandos oficiales

```text
npm run dev       servidor de desarrollo
npm run build     build estático en builds/browser
npm run test      pruebas unitarias (node --test, sin dependencias)
npm run check     test && build
npm run test:e2e  Playwright
npm run verify     check && test:e2e   <- quality gate único y oficial
```

Este repositorio no requiere Node instalado en Windows. Dos formas
equivalentes de ejecutar el quality gate:

- **Con Node disponible** (CI, o un entorno con Node local): `npm run
  verify` en un solo comando.
- **Windows sin Node local (caso habitual de este proyecto)**: la misma
  validación en dos comandos Docker, porque `game` no tiene navegadores de
  Playwright y `playwright` no reinstala nada salvo lo que declare
  `npm ci`:

  ```powershell
  docker compose run --rm game npm run check
  docker compose run --rm playwright
  ```

No inventes una tercera forma de ejecutar las pruebas ni un contenedor
nuevo: reutiliza estos dos servicios tal cual existen.

## Convenciones de código

Ver `AGENTS.md` → "Convenciones de código". Resumen operativo: módulos ES,
sin dependencias ni frameworks nuevos sin aprobación explícita, funciones
pequeñas de una responsabilidad, lógica/estado/contenido/renderizado
separados, validadores de puzles probables sin Canvas ni DOM, cambios de
formato de guardado siempre versionados y migrados con pruebas.

## Flujo obligatorio de implementación

Para cualquier tarea de desarrollo (manual o vía `autopilot`):

1. Leer el roadmap y elegir una única tarea acotada y no bloqueada (ver
   "Gestión del roadmap" más abajo).
2. Invocar al agente `planner` (`.claude/agents/planner.md`) para definir
   criterios de aceptación verificables y riesgos. El planner no escribe
   código.
3. Invocar al agente `developer` (`.claude/agents/developer.md`) para
   implementar exactamente el plan aprobado, manteniendo el alcance y
   añadiendo o actualizando pruebas.
4. Invocar al agente `qa` (`.claude/agents/qa.md`) para ejecutar pruebas
   unitarias y Playwright y buscar errores de consola, estados bloqueados y
   regresiones.
5. Ejecutar `npm run verify` (o su equivalente Docker de dos comandos). Si
   falla, corregir y repetir — máximo 5 ciclos de corrección antes de pedir
   intervención humana.
6. Invocar al agente `reviewer` (`.claude/agents/reviewer.md`) para revisar
   el diff de forma independiente. No se aprueba un cambio solo porque los
   tests pasen.
7. Corregir los hallazgos válidos del reviewer y volver a ejecutar
   `npm run verify`.
8. Solo entonces: commit, y push + Pull Request si hay credenciales
   disponibles (ver "Gestión de Git"). Nunca fusionar la PR.

No te saltes pasos ni combines tareas independientes en un mismo ciclo.

## Estrategia de pruebas

- Pruebas unitarias en `tests/`, con la misma estructura de carpetas que
  `src/` (`tests/puzzles/...`, `tests/scenes/...`, etc.), usando el runner
  nativo de `node --test`. No añadas un framework de test nuevo.
- Pruebas e2e en `tests/e2e/` con Playwright. Deben comprobar
  comportamiento real: cambios de estado en el DOM o el canvas, ausencia de
  errores de consola/página (patrón `collectJavaScriptErrors` ya usado en
  `tests/e2e/game.spec.js`), y no solo que la página cargue. Un test que
  únicamente verifica que la aplicación arranca no es evidencia de QA
  válida para cerrar una tarea.
- Toda funcionalidad nueva o corregida necesita prueba de regresión antes
  de considerarse terminada.

## Criterios de finalización

Una tarea se considera terminada cuando, además de los criterios generales
de `AGENTS.md` → "Criterios de aceptación generales":

- `npm run verify` (o su equivalente Docker) termina en verde.
- El agente `reviewer` no reporta hallazgos sin resolver.
- `git diff --check` no informa errores de espacios o formato.
- El roadmap, el `CHANGELOG.md` y cualquier documento afectado reflejan el
  cambio real.

## Gestión del roadmap

El alcance obligatorio de `v1.0.0` vive en
`docs/production/V1_PRODUCTION_PLAN.md` (§3 "Alcance obligatorio" y §12
"Checklist final de entrega"), cruzado con `docs/production/ROADMAP.md`,
`docs/production/CODEX_HANDOFF.md` y `docs/production/NEXT_CODEX_TASK.md`.

**Aviso importante**: en la auditoría que originó este documento, esos
cuatro archivos describían "Archive Criteria" como bloque pendiente, pero
`git log` mostraba que ya estaba implementado en la punta de la rama
(`f8de07f feat: add archive criteria scene` y los commits de catálogo y
persistencia anteriores). Es decir, estos documentos de planificación
pueden ir por detrás del código real. Antes de elegir una tarea:

1. No confíes en una casilla sin marcar por sí sola. Comprueba contra
   `src/`, `tests/` y `git log` si esa funcionalidad ya existe.
2. Si una casilla está desactualizada, corrígela como mantenimiento
   rutinario de documentación dentro de la misma tarea — no es una
   decisión de alcance ni de diseño.
3. Si el roadmap es ambiguo sobre qué tarea sigue, o dos documentos se
   contradicen sobre una decisión de diseño o alcance, detente y pide
   intervención humana en vez de decidir por interpretación propia.

## Gestión de Git

- Nunca hagas commit ni push directamente sobre `main`.
- Una rama corta por tarea, creada desde el estado limpio de la rama de
  trabajo actual (hoy `main`, ya que `v1.0.0` se integró en `main` el
  2026-08-11 — ver
  [`docs/production/V1_RELEASE_CLOSURE.md`](docs/production/V1_RELEASE_CLOSURE.md);
  `feat/v1-production-scope` cumplió su propósito y ya no es la base de
  nuevas tareas), con nombre descriptivo (`feature/...`, `fix/...`,
  `docs/...`).
- Commits pequeños y revisables; sigue el estilo ya usado en el historial
  (`feat:`, `fix:`, `docs:` + descripción breve en imperativo).
- No hagas rebase, no reescribas historial publicado, no fuerces push.
- No crees tags sin autorización explícita.
- Push y creación de Pull Request solo cuando el quality gate completo haya
  pasado, y solo si hay credenciales de Git/GitHub disponibles en el
  entorno (por ejemplo `gh auth status` correcto). Si no las hay, deja la
  rama y el commit locales, y repórtalo como paso manual pendiente para el
  usuario.
- Nunca fusiones una Pull Request. Eso es siempre una decisión humana.

## Acciones prohibidas

- Añadir dependencias, frameworks, motores o herramientas de empaquetado
  (Electron, Tauri u otras) sin aprobación explícita.
- Cualquier operación destructiva de Git: `push --force`, `reset --hard`,
  `clean -f`, borrar ramas, sobrescribir historial.
- Editar o crear secretos, credenciales, tokens, o los recursos marcados
  como privados en `.gitignore` (`private/`, `combination.txt`, `.env*`).
- Ampliar el alcance de `v1.0.0` (ver `AGENTS.md` → "Fuera de alcance") o
  adelantar epílogo/personalización/Max sin autorización — esta sesión de
  automatización no debe avanzar ninguna funcionalidad de juego.
  `v1.0.0` ya está publicada y congelada (ver
  `docs/production/V1_RELEASE_CLOSURE.md`): cualquier funcionalidad
  nueva pertenece a un ciclo post-v1 con su propia especificación y
  aprobación explícita, nunca a una tarea de mantenimiento documental.
- Crear accesos temporales, teclas secretas, parámetros de URL o menús de
  depuración.
- Ejecutar la suite completa (`npm run verify`) tras cada edición pequeña;
  resérvala para los puntos de control del flujo (pasos 5 y 7 más arriba, o
  los pasos equivalentes de `autopilot`).
- Fusionar Pull Requests automáticamente.

## Casos que requieren aprobación humana

- Requisitos ambiguos o roadmap contradictorio.
- Cualquier decisión narrativa o de diseño de juego.
- Propuestas de ampliar el alcance congelado.
- Necesidad de secretos, credenciales o tokens.
- Cualquier acción destructiva.
- Necesidad de modificar `main`.
- Más de 5 ciclos de corrección fallidos sobre la misma tarea.
- Resultados que las pruebas no puedan determinar de forma objetiva.

## Automatización disponible

- Agentes especializados: `.claude/agents/planner.md`,
  `.claude/agents/developer.md`, `.claude/agents/qa.md`,
  `.claude/agents/reviewer.md`.
- Flujo autónomo completo: skill `autopilot`
  (`.claude/skills/autopilot/SKILL.md`), documentado en
  `docs/development/AUTOMATION.md`.
- Permisos y hooks de protección (bloqueo de ramas `main`, operaciones
  destructivas y edición de secretos) en `.claude/settings.json`.
