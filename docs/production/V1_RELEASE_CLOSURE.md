# Cierre de release — `v1.0.0`

Registro compacto y definitivo de la publicación real de `v1.0.0`.
Documento puramente factual: no reabre ninguna decisión de alcance, no
reinterpreta ningún riesgo residual, no modifica el producto ni la
release ya publicada.

## Publicación

- **Versión**: `v1.0.0`.
- **Fecha de publicación**: 2026-08-11.
- **Commit definitivo en `main`**: `ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733`
  (merge de PR #44, `release/v1.0.0` → `main`).
- **Tag**: `v1.0.0`, apuntando exactamente a ese commit
  (`v1.0.0^{}` resuelve a `ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733`).
- **`package.json`/`package-lock.json`** en ese commit: `"version": "1.0.0"`.
- **GitHub Release**: "El Teorema del Sí v1.0.0", publicada, **no
  draft**, **no prerelease**.

## Generación del artifact oficial

- **Workflow**: `.github/workflows/windows-portable.yml` ("Windows portable").
- **Run**: `31517093742`.
- **Trigger**: `workflow_dispatch`.
- **Ref**: `v1.0.0`.
- **`headSha` del run**: `ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733` (coincide
  exactamente con el commit definitivo de `main` y con el tag).
- **Conclusión**: `success`.

## Artifact oficial

- **Nombre**: `El-Teorema-del-Si-1.0.0-win-x64-portable.exe`.
- **Bytes**: `99604577`.
- **SHA-256**: `5F7CB4D0085E4ADE5C2BCCFCE2DC8AD5FF31DD1D5225334949AAB688C6373669`.
- **Authenticode**: `NotSigned` (decisión de arquitectura ya documentada
  en [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md);
  no es una omisión de esta tarea).
- **`SHA256SUMS.txt`**: publicado como segundo asset de la Release.

Ambos valores (nombre, bytes, SHA-256) fueron calculados por el propio
paso `Validate packaged artifact` del workflow durante el run
`31517093742`, y confirmados de forma independiente en esta tarea contra
el log real de ese run.

## Verificación posterior a la publicación

El artifact fue descargado de nuevo desde la GitHub Release ya publicada
y verificado contra los valores registrados en el run de origen:

- **`PublishedLength`**: `99604577`.
- **`PublishedSHA256`**: `5F7CB4D0085E4ADE5C2BCCFCE2DC8AD5FF31DD1D5225334949AAB688C6373669`.
- **`HashMatch`**: `True`.
- **`LengthMatch`**: `True`.

El artifact publicado es, por tanto, exactamente el mismo que generó y
validó el workflow — no hubo sustitución ni corrupción entre la
generación y la publicación.

## Documentación de QA/readiness relacionada

- [`V1_RELEASE_READINESS.md`](V1_RELEASE_READINESS.md) — auditoría de
  readiness pre-release (conclusión histórica: **READY FOR v1.0.0**) y su
  sección posterior "Resultado de publicación".
- [`V1_QA_MATRIX.md`](V1_QA_MATRIX.md) — matriz formal de evidencia por
  requisito.
- [`RELEASE_PROCEDURE_v1.0.0.md`](RELEASE_PROCEDURE_v1.0.0.md) — runbook
  seguido paso a paso, con su sección "Resultado de ejecución".
- [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md) y
  [`WINDOWS_PACKAGING_PHASE5_CLOSURE.md`](WINDOWS_PACKAGING_PHASE5_CLOSURE.md)
  — empaquetado Windows, 8/8 tareas completadas.

## Riesgos residuales aceptados (siguen vigentes, sin reinterpretar)

La publicación de `v1.0.0` **no** convierte ninguno de estos riesgos en
`PASS`. Siguen exactamente en el mismo estado que antes de la publicación:

- **Compatibilidad/sustitución entre dos builds distintas (A→B→A)**: no
  ejecutada. Riesgo residual aceptado.
- **Duración completa del recorrido**: no cronometrada formalmente.
  Riesgo aceptado.
- **Pase visual dedicado**: no ejecutado. Presentación actual aceptada
  para `v1.0.0`.
- **Rendimiento y escalado pixel-perfect (medición formal)**: no
  medido. Riesgo aceptado.
- **Cuatro defectos menores de nomenclatura/presentación**: conocidos,
  no corregidos, aceptados, no bloqueantes para `v1.0.0` (detalle en
  [`V1_PRODUCTION_PLAN.md`](V1_PRODUCTION_PLAN.md) §5 "Defectos menores
  conocidos").

Esta lista no es una afirmación de que `v1.0.0` no tenga bugs — es el
registro de los riesgos ya conocidos y explícitamente aceptados antes de
publicar.

## Trabajo fuera del alcance de `v1.0.0`

- **Personalización final** (nombres reales, fecha, mascota, dedicatoria)
  — no implementada, no aplicada retroactivamente a `v1.0.0`. Pertenece
  al ciclo post-v1, con especificación y aprobación propias.
- **Max** (compañero visual) — no implementado, mismo tratamiento.
- Cualquier otro elemento del "Orden de trabajo posterior" de
  [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) no cerrado en `v1.0.0`.

## Estado operativo tras el cierre

- `v1.0.0`: **PUBLICADA / CERRADA / CONGELADA**. El tag `v1.0.0` es
  inmutable — no se mueve, no se borra, no se recrea, y el artifact y
  `SHA256SUMS.txt` publicados no se sustituyen ni se regeneran.
- `main`: rama base para el desarrollo de versiones futuras.
- Ciclo de trabajo `v1`: cerrado. Cualquier trabajo nuevo (incluida la
  personalización o Max) parte de `main`, en ramas y versiones nuevas,
  con su propia especificación.

## Declaración de cierre

**El ciclo de desarrollo, validación, empaquetado y publicación de El
Teorema del Sí v1.0.0 queda cerrado.**
