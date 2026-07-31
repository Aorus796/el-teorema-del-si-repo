---
name: autopilot
description: Flujo autonomo completo para "El Teorema del Sí" - lee el roadmap, elige una tarea acotada y no bloqueada, la implementa mediante los agentes planner/developer/qa/reviewer, valida con npm run verify, y abre una Pull Request sin fusionarla. Úsalo cuando el usuario pida "ejecuta autopilot", "continúa el roadmap solo" o equivalente. No avanza el epílogo, la personalización ni ninguna decisión narrativa por su cuenta.
---

# autopilot

Orquesta el flujo obligatorio de `CLAUDE.md` de principio a fin para una
única tarea del roadmap, sin intervención humana salvo en los bloqueos
explícitos listados más abajo. Sigue los pasos en orden; no te saltes
ninguno ni combines varias tareas del roadmap en una sola ejecución.

## 0. Antes de empezar

Lee `CLAUDE.md` completo si no está ya en contexto. Confirma:

- rama actual y estado de `git status --short` (debe estar limpio antes de
  crear la rama de la tarea; si no lo está, detente y pregunta qué hacer
  con los cambios existentes en vez de descartarlos);
- que no estás sobre `main`.

## 1. Leer el roadmap y elegir una tarea

Lee `docs/production/V1_PRODUCTION_PLAN.md` (§3 y §12), y cruza contra
`docs/production/ROADMAP.md`, `docs/production/CODEX_HANDOFF.md` y
`docs/production/NEXT_CODEX_TASK.md`. Estos documentos pueden ir por detrás
del código real (ver `CLAUDE.md` → "Gestión del roadmap"): antes de fiarte
de una casilla sin marcar, comprueba contra `src/`, `tests/` y `git log` si
esa funcionalidad ya existe. Corrige una casilla desactualizada como
mantenimiento rutinario si la encuentras, sin tratarlo como una tarea aparte.

Elige **una única** tarea acotada y no bloqueada — nunca varias a la vez.

Si el roadmap es ambiguo, dos documentos se contradicen en una decisión de
diseño, o la tarea implica algo narrativo o de personalización: **detente
aquí** y pide intervención humana (ver "Condiciones de parada").

## 2. Acotar la tarea y crear la rama

Redacta un enunciado breve y acotado de la tarea (qué se hace, qué queda
fuera). Crea una rama nueva desde el estado limpio actual, con nombre
descriptivo (`feature/...`, `fix/...`, `docs/...`).

## 3. Invocar a `planner`

Usa el agente `planner` (`.claude/agents/planner.md`) pasándole el
enunciado de la tarea. Debe devolver criterios de aceptación verificables,
arquitectura afectada y riesgos, sin tocar código.

Si `planner` señala ambigüedad, ampliación de alcance o necesidad de una
decisión de diseño: detente y pide intervención humana.

## 4. Invocar a `developer`

Usa el agente `developer` (`.claude/agents/developer.md`) con el plan
aprobado. Debe implementar exactamente ese plan y añadir/actualizar pruebas.

## 5. Invocar a `qa`

Usa el agente `qa` (`.claude/agents/qa.md`) para ejecutar pruebas unitarias
y Playwright contra los criterios de aceptación, y buscar errores de
consola, estados bloqueados y regresiones.

## 6. Ejecutar el quality gate

Ejecuta `npm run verify` (o su equivalente Docker de dos comandos descrito
en `CLAUDE.md`). Si falla:

- corrige mediante `developer` y repite desde el paso 5;
- lleva la cuenta de ciclos de corrección; **al superar 5 ciclos fallidos,
  detente y pide intervención humana** — no sigas intentando.

## 7. Invocar a `reviewer`

Usa el agente `reviewer` (`.claude/agents/reviewer.md`) sobre el diff
completo de la tarea. No lo saltes aunque el paso 6 haya pasado en verde.

## 8. Corregir hallazgos y revalidar

Si `reviewer` reporta hallazgos válidos, corrígelos mediante `developer` y
vuelve a ejecutar el paso 6 completo. Si un hallazgo implica una decisión de
diseño o alcance, detente y pide intervención humana en vez de decidir tú.

## 9. Actualizar roadmap, changelog y documentación

Marca la tarea como completada en el documento de roadmap correspondiente,
añade una entrada en `CHANGELOG.md`, y actualiza cualquier documento técnico
afectado por el cambio (sin tocar documentos de diseño narrativo salvo que
la tarea sea explícitamente sobre ellos).

## 10. Commit

Crea un commit descriptivo siguiendo el estilo existente del historial
(`feat:`, `fix:`, `docs:` + descripción breve). Un solo commit lógico por
tarea, salvo que el propio plan haya definido pasos separables.

## 11. Push y Pull Request

Comprueba si hay credenciales de Git/GitHub disponibles (por ejemplo, que
`git push` a un remoto autenticado y `gh auth status` — si la CLI de GitHub
está disponible — no fallen). Si las hay:

- haz push de la rama;
- crea la Pull Request describiendo la tarea, los criterios de aceptación y
  el resultado de la validación;
- **nunca la fusiones.**

Si no hay credenciales disponibles, dilo explícitamente en el informe final
y deja el commit y la rama locales listos para que el usuario haga el push
y abra la PR manualmente.

## 12. Informe final

Cierra siempre con un informe que incluya: tarea elegida y por qué, rama y
commit(s) creados, resumen del plan, archivos creados/modificados, resultado
completo de `npm run verify` (o su equivalente Docker), hallazgos de
`reviewer` y cómo se resolvieron, estado de push/PR, y cualquier limitación
o comprobación manual pendiente.

## Condiciones de parada — pide intervención humana y no continúes si:

- los requisitos son ambiguos o el roadmap se contradice;
- la tarea requiere una decisión narrativa o de diseño de juego;
- se propone ampliar el alcance congelado de `v1.0.0`;
- se necesitan secretos, credenciales o tokens;
- se necesita una acción destructiva;
- haría falta modificar `main`;
- se superan 5 ciclos de corrección fallidos sobre la misma tarea;
- las pruebas no pueden determinar de forma objetiva si el resultado es
  correcto.

En cualquiera de estos casos, detente, explica el bloqueo con claridad y
qué decisión concreta necesitas del usuario — no lo resuelvas por tu cuenta
ni sigas avanzando en otra tarea mientras tanto.
