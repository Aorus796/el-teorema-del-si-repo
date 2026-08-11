# El Teorema del Sí

Aventura narrativa de puzles en un pueblo llamado Axioma, diseñada como
regalo de boda. El jugador explora la Plaza del Axioma, el Paseo de los
Siete Puentes, la Biblioteca del Margen y un Archivo compacto,
investigando la desaparición de la novia y resolviendo tres puzles
principales que culminan en un epílogo con la combinación de un candado
real.

## Estado del proyecto

Versión estable actual: **[`v1.0.0`](https://github.com/Aorus796/el-teorema-del-si-repo/releases/tag/v1.0.0)**,
publicada el 2026-08-11. Recorrido principal implementado y jugable de
principio a fin: las cuatro localizaciones, los tres puzles principales,
el cuaderno de pistas, el guardado y carga (con migración entre
formatos), y el epílogo completo. Disponible como versión web estática y
como portable Windows publicado en la GitHub Release. La personalización
final (nombres reales, fecha, mascota, dedicatoria) queda fuera del
alcance de `v1.0.0` y se implementará después, como trabajo posterior.

Ver el detalle completo de evidencia, la matriz de QA, los riesgos
residuales aceptados y el registro de la publicación en
[`docs/production/V1_PRODUCTION_PLAN.md`](docs/production/V1_PRODUCTION_PLAN.md),
[`docs/production/V1_QA_MATRIX.md`](docs/production/V1_QA_MATRIX.md),
[`docs/production/V1_RELEASE_READINESS.md`](docs/production/V1_RELEASE_READINESS.md)
y [`docs/production/V1_RELEASE_CLOSURE.md`](docs/production/V1_RELEASE_CLOSURE.md).

## Documentación principal

- [Game Design Document consolidado](docs/GDD.md)
- [Catálogo de puzles](docs/puzzles/README.md)
- [Arquitectura técnica](docs/technical/ARCHITECTURE.md)
- [Plan de producción de `v1.0.0`](docs/production/V1_PRODUCTION_PLAN.md)
- [Release readiness de `v1.0.0`](docs/production/V1_RELEASE_READINESS.md)
- [Cierre de release de `v1.0.0`](docs/production/V1_RELEASE_CLOSURE.md)
- [Guía operativa del portable Windows](docs/production/WINDOWS_PORTABLE_GUIDE.md)
- [Procedimiento de publicación de `v1.0.0`](docs/production/RELEASE_PROCEDURE_v1.0.0.md)
- [Registro de decisiones](docs/decisions/README.md)
- [Historial de cambios](CHANGELOG.md)
- [Sistema de automatización con Claude Code](docs/development/AUTOMATION.md)

## Desarrollo

Requiere Node.js `>=22.12.0`.

```bash
npm ci                  # instalación reproducible desde package-lock.json
npm run dev              # servidor de desarrollo (versión web)
npm run test              # pruebas unitarias (node --test)
npm run build              # build estático en builds/browser
npm run check              # test + build
npm run test:e2e            # pruebas end-to-end con Playwright
npm run verify              # check + test:e2e — quality gate completo
```

En Windows sin Node instalado localmente, el quality gate equivalente se
ejecuta con Docker:

```powershell
docker compose run --rm game npm run check
docker compose run --rm playwright
```

### Ejecutable de escritorio (Windows)

El portable Windows oficial de `v1.0.0`
(`El-Teorema-del-Si-1.0.0-win-x64-portable.exe`) está publicado como
asset de la
[GitHub Release `v1.0.0`](https://github.com/Aorus796/el-teorema-del-si-repo/releases/tag/v1.0.0),
junto con `SHA256SUMS.txt` para verificar su integridad.

También puede generarse localmente desde el código fuente:

```bash
npm run desktop:dev             # Electron en modo desarrollo
npm run desktop:package:win     # genera el portable Windows x64 en release/
```

El portable Windows es un único `.exe` autocontenido (sin instalador),
sin firma digital. Ver
[`docs/production/WINDOWS_PACKAGING_DECISION.md`](docs/production/WINDOWS_PACKAGING_DECISION.md)
para las decisiones de arquitectura y seguridad, y
[`docs/production/WINDOWS_PORTABLE_GUIDE.md`](docs/production/WINDOWS_PORTABLE_GUIDE.md)
para obtenerlo, verificarlo y ejecutarlo.

## Controles básicos

| Acción | Teclas |
|---|---|
| Moverse | `WASD` o flechas |
| Interactuar / confirmar | `E` o `Enter` |
| Abrir cuaderno | `Q` o `Tab` |
| Guardar | `K` |
| Cargar | `L` |
| Reiniciar intento de puzle | `R` |
| Cancelar / volver | `Escape` |

El juego es completamente operable con teclado — no requiere ratón.

## Estructura del repositorio

```text
.
├── .github/                 Plantillas de colaboración y workflows de CI
├── docs/                    Diseño, arquitectura y producción
├── electron/                Shell mínimo de Electron (proceso principal)
├── src/                     Código fuente del juego (lógica, estado,
│                             contenido, escenas, assets)
├── tests/                   Pruebas unitarias, E2E, de workflows y documentales
└── tools/                   Scripts de build, servidor de desarrollo y validadores
```

`assets/` y `content/` en la raíz son directorios heredados del diseño
inicial y están vacíos: el contenido y los assets reales del juego viven
bajo `src/content/` y `src/assets/` — el arte es 100% renderizado
procedimental sobre `<canvas>`, sin sprites externos.

## Principios del proyecto

- La dificultad debe proceder del razonamiento, no de la interfaz.
- Toda solución obligatoria debe ser deducible con información del juego.
- Los errores no deben destruir progreso.
- La novia participa activamente en su propio rescate.
- La combinación del candado nunca se muestra directamente en el código
  fuente ni en esta documentación.
- El alcance se protege antes que añadir contenido secundario.
- El guardado y la entrega tienen prioridad sobre el pulido opcional.

## Contribución

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) y
[AGENTS.md](AGENTS.md). Antes de implementar una decisión que cambie
arquitectura, alcance, narrativa o reglas de un puzle, registra una ADR
en `docs/decisions/`.

## Licencia

Todavía no se ha elegido una licencia pública. Mientras no exista un
archivo `LICENSE`, el proyecto debe considerarse de uso privado y con
todos los derechos reservados.
