# Procedimiento de publicación de `v1.0.0`

Documento puramente procedimental: describe los pasos que quedan
**después** de que la PR `release/v1.0.0` → `main` se fusione. Ninguno de
estos pasos se ejecuta en la tarea que crea este documento (2026-08-11).
Todos requieren una decisión humana explícita.

## 0. Estado previo a este procedimiento

- `release/v1.0.0` tiene la versión fijada en `1.0.0`
  (`package.json`/`package-lock.json`), `CHANGELOG.md` cerrado para
  `1.0.0`, y una PR abierta contra `main`, sin fusionar.
- No existe ningún tag `v1.0.0`.
- No existe ningún GitHub Release.
- El artifact `El-Teorema-del-Si-0.5.0-win-x64-portable.exe` (run de
  GitHub Actions `31369511579`) es evidencia histórica de QA/packaging,
  **no** el artifact final de `v1.0.0`.

## 1. Fusionar la PR en `main`

Decisión humana explícita, fuera del alcance de este procedimiento
automatizado. Tras la fusión, identificar el commit resultante en `main`
(el merge commit, o el commit de `release/v1.0.0` si se hace fast-forward
o squash).

## 2. Crear el tag `v1.0.0` sobre el commit definitivo de `main`

El tag debe apuntar al commit de **`main`** post-merge, no a un commit de
`release/v1.0.0`:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "El Teorema del Sí v1.0.0"
git push origin v1.0.0
```

## 3. Generar el ejecutable Windows final

El workflow `.github/workflows/windows-portable.yml` ya soporta esto sin
modificaciones: además de disparase en `pull_request` (con filtro de
paths), declara `workflow_dispatch`, que permite ejecutarlo manualmente
sobre cualquier ref — incluida `main` post-merge o el tag `v1.0.0` recién
creado.

El paso `Validate packaged artifact` del workflow lee la versión
directamente de `package.json` en el ref ejecutado y exige que el `.exe`
generado se llame exactamente
`El-Teorema-del-Si-$version-win-x64-portable.exe`. Como `package.json`
en `main`/`v1.0.0` ya declara `"version": "1.0.0"`, el artifact resultante
se llamará automáticamente:

```
El-Teorema-del-Si-1.0.0-win-x64-portable.exe
```

Para dispararlo manualmente:

```bash
gh workflow run windows-portable.yml --ref v1.0.0
```

(o `--ref main`, si se prefiere generar el artifact antes de crear el
tag; ambos ref apuntan al mismo commit una vez completados los pasos 1-2).

Descargar el artifact `el-teorema-del-si-windows-x64-portable` de esa
ejecución, y registrar en el momento de la publicación:

- número de run de GitHub Actions;
- nombre exacto del artifact;
- tamaño en bytes;
- SHA-256 (el propio workflow lo calcula y lo muestra en el log del paso
  `Validate packaged artifact`).

No reutilizar el hash ni el tamaño del artifact histórico `0.5.0` como si
correspondieran a `1.0.0` — son builds distintas.

## 4. Verificar el artifact antes de publicarlo

Mismo procedimiento que
[`WINDOWS_PORTABLE_GUIDE.md`](WINDOWS_PORTABLE_GUIDE.md) §2: descargar el
`.exe`, calcular su SHA-256 localmente
(`Get-FileHash -Algorithm SHA256`), y compararlo contra el que aparece en
el log de esa misma ejecución del workflow — nunca contra un valor fijo
de una build anterior.

## 5. Crear el GitHub Release

Solo después de completar los pasos 1-4:

- **Tag**: `v1.0.0` (ya creado en el paso 2).
- **Título**: `El Teorema del Sí v1.0.0`.
- **Notas de la release**: derivadas de la entrada
  `## [1.0.0] - 2026-08-11` de [`CHANGELOG.md`](../../CHANGELOG.md) — no
  inventar contenido adicional; puede incluirse un enlace a
  [`V1_RELEASE_READINESS.md`](V1_RELEASE_READINESS.md) para el detalle
  completo de evidencia y riesgos residuales aceptados.
- **Artifact adjunto**: `El-Teorema-del-Si-1.0.0-win-x64-portable.exe`
  del paso 3, ya verificado en el paso 4.
- No publicar como borrador indefinido ni como prerelease salvo decisión
  explícita en sentido contrario — este repositorio no tiene una política
  documentada que exija un draft previo.

```bash
gh release create v1.0.0 \
  --title "El Teorema del Sí v1.0.0" \
  --notes-file <archivo-con-las-notas-derivadas-del-changelog> \
  <ruta-al-exe-verificado>
```

## 6. Después de publicar

- Actualizar `docs/production/V1_PRODUCTION_PLAN.md` §12 "Artefactos y
  entrega" con los artefactos finales reales (build web = commit fusionado
  en `main`; ejecutable Windows = el `.exe` del paso 3).
- Actualizar `docs/production/V1_RELEASE_READINESS.md` si se quiere dejar
  constancia explícita de la fecha de publicación real.
- Ninguno de estos pasos de cierre está incluido en el procedimiento
  descrito aquí arriba (1-5); son mantenimiento documental posterior.
