# Sistema de automatización con Claude Code

Este documento describe la capa de automatización añadida sobre el
desarrollo de "El Teorema del Sí": cómo está compuesta, cómo arrancarla,
qué validaciones ejecuta y qué sigue requiriendo una persona. Complementa a
`CLAUDE.md` (instrucciones normativas) y a `AGENTS.md` (arquitectura y
convenciones del juego); este documento es descriptivo, no normativo — ante
cualquier contradicción, `CLAUDE.md` gana.

## Arquitectura

```text
autopilot (skill, .claude/skills/autopilot/SKILL.md)
    │
    ├── 1. lee el roadmap y elige una tarea acotada
    ├── 2. crea una rama de tarea
    ├── 3. planner   (.claude/agents/planner.md)   -> criterios de aceptación, sin código
    ├── 4. developer  (.claude/agents/developer.md) -> implementación + pruebas
    ├── 5. qa         (.claude/agents/qa.md)        -> ejecuta pruebas, busca regresiones
    ├── 6. npm run verify  (quality gate único)
    ├── 7. reviewer   (.claude/agents/reviewer.md)  -> revisión independiente del diff
    ├── 8. corrige hallazgos válidos y repite 6-7 si hace falta
    ├── 9. actualiza roadmap/changelog/docs
    ├── 10. commit
    ├── 11. push + Pull Request (solo si hay credenciales) — nunca fusiona
    └── 12. informe final
```

`.claude/settings.json` añade una capa de protección independiente del
flujo anterior: hooks que bloquean operaciones de Git destructivas, la
instalación de dependencias nuevas sin aprobación, commits/push directos
sobre `main`, y la edición de rutas marcadas como secretas.

`.github/workflows/ci.yml` ejecuta el mismo quality gate (`npm run verify`)
en cada Pull Request usando Node nativo en el runner de GitHub Actions (no
Docker) — ver "Notas de CI" más abajo.

## Cómo iniciar `autopilot`

Desde una sesión de Claude Code abierta en este repositorio:

```text
/autopilot
```

o, de forma equivalente, invocando la skill directamente:

```text
Skill(skill: "autopilot")
```

Ejecuta **una sola tarea** del roadmap por invocación. Para continuar con la
siguiente tarea, vuelve a invocarlo.

## Agentes que intervienen

| Agente | Herramientas | Responsabilidad | No hace |
|---|---|---|---|
| `planner` | Glob, Grep, Read | Define criterios de aceptación y riesgos | No edita código |
| `developer` | Read, Edit, Write, Glob, Grep, Bash | Implementa el plan y añade pruebas | No decide alcance ni ambigüedades |
| `qa` | Read, Grep, Glob, Bash | Ejecuta pruebas y busca regresiones | No edita código |
| `reviewer` | Read, Grep, Glob, Bash, ReportFindings | Revisión independiente del diff | No aprueba solo porque los tests pasen |

## Qué se valida y cuándo

- `npm run verify` (`npm run check && npm run test:e2e`) es el quality gate
  único, ejecutado en el paso 6 y de nuevo tras cualquier corrección — no en
  cada edición menor de `developer`.
- Localmente, sin Node instalado en Windows, el equivalente es:
  ```powershell
  docker compose run --rm game npm run check
  docker compose run --rm playwright
  ```
- En GitHub Actions, `npm ci` + `npx playwright install --with-deps
  chromium` + `npm run verify`, con capturas, trazas y reporte HTML/JSON de
  Playwright subidos como artefactos solo si algo falla.

## Operaciones que siguen requiriendo aprobación humana

- Fusionar cualquier Pull Request — `autopilot` nunca lo hace.
- Cualquier decisión narrativa, de diseño de puzles, o de personalización.
- Ampliar el alcance congelado de `v1.0.0`.
- Cualquier acción destructiva de Git (force push, reset --hard, clean -f,
  borrado de ramas) — bloqueadas también a nivel de hook, no solo de
  instrucción.
- Instalar dependencias nuevas — bloqueado a nivel de hook salvo
  `npm ci`/`npm install` sin paquetes.
- Tocar `main` directamente — bloqueado a nivel de hook para `commit`/`push`.
- Uso de secretos, credenciales o tokens.
- Más de 5 ciclos de corrección fallidos sobre la misma tarea.
- Resultados que las pruebas no puedan determinar de forma objetiva.

## Cómo detener o recuperar una ejecución

- `autopilot` se detiene solo ante cualquiera de los bloqueos anteriores y
  explica qué decisión necesita.
- Para detener manualmente una ejecución en curso, interrumpe la sesión de
  Claude Code como harías con cualquier tarea; los cambios ya escritos
  quedan en el working tree (o en la rama de tarea si ya se creó) — no se
  pierde nada automáticamente.
- Para recuperar: revisa `git status` y `git log` de la rama de tarea, y
  decide si continuar manualmente, volver a invocar `/autopilot` (retomará
  desde el estado real del roadmap y del código, no desde memoria de la
  ejecución anterior), o descartar la rama si el enfoque no era el
  correcto.

## Cómo interpretar el informe final

El informe de `autopilot` (paso 12) siempre incluye: la tarea elegida y por
qué, la rama y commit(s), un resumen del plan de `planner`, los archivos
creados/modificados, el resultado íntegro de `npm run verify`, los
hallazgos de `reviewer` y cómo se resolvieron, el estado de push/PR, y
cualquier limitación o comprobación manual pendiente. Si el informe indica
un bloqueo en vez de una tarea completada, no hay commit ni PR — el bloqueo
mismo es el resultado que hay que atender.

## Notas de CI

`ci.yml` usa Node nativo (`actions/setup-node`) en vez de reproducir los
contenedores Docker locales. Es una excepción técnica deliberada: los
runners de GitHub Actions no necesitan el aislamiento que Docker aporta en
el Windows del equipo de desarrollo (donde no hay Node instalado), y usar
Node nativo es más rápido y estándar. Ejecuta exactamente los mismos
scripts de `package.json` (`npm run verify`), así que el resultado es
equivalente al de la validación local en Docker.

## Costes y riesgos de dejar agentes corriendo sin supervisión

- **Coste de tokens**: cada ciclo `developer` → `qa` → `verify` →
  `reviewer` consume contexto y llamadas a modelo; el límite de 5 ciclos de
  corrección (paso 6) existe para evitar bucles caros sin fin.
- **Nada se fusiona solo**: aunque `autopilot` complete todos los pasos y
  abra una Pull Request, esta sigue necesitando revisión y merge humanos —
  no hay riesgo de que código no revisado llegue a `main` de forma
  automática.
- **Alcance controlado, no eliminado**: los hooks bloquean las acciones más
  peligrosas (Git destructivo, dependencias nuevas, `main` directo, edición
  de secretos), pero no sustituyen el criterio humano sobre decisiones de
  diseño, narrativa o alcance — por eso existen las condiciones de parada
  explícitas en `autopilot`.
- **Ejecuciones largas desatendidas**: si se deja `autopilot` corriendo por
  periodos largos (por ejemplo, en background), revisa periódicamente que
  no esté atascado repitiendo el mismo ciclo de corrección cerca del límite
  de 5 intentos, y que las Pull Requests abiertas no se acumulen sin
  revisión.
