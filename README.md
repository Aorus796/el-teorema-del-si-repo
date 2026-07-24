# El Teorema del Sí

Aventura narrativa de puzles matemáticos en pixel art, diseñada como regalo de boda. El jugador explora el pueblo de Axioma, investiga la desaparición de la novia y resuelve una cadena de acertijos que culmina en la combinación de un candado físico.

## Estado del proyecto

**Diseño base completo. Desarrollo todavía no iniciado.**

El concepto, la historia, el mundo, los personajes, el mapa, las mecánicas, los puzles, la dirección artística, la experiencia de usuario, la arquitectura técnica y el plan de producción están documentados. Las decisiones siguen siendo revisables durante los prototipos.

## Documentación principal

- [Game Design Document consolidado](docs/GDD.md)
- [Documento Word](docs/El_Teorema_del_Si_GDD.docx)
- [Catálogo de puzles](docs/puzzles/README.md)
- [Arquitectura técnica](docs/technical/ARCHITECTURE.md)
- [Plan de producción](docs/production/ROADMAP.md)
- [Registro de decisiones](docs/decisions/README.md)
- [Historial de cambios](CHANGELOG.md)

## Próximo hito

Construir los prototipos de papel y la especificación ejecutable de los tres sistemas de mayor riesgo:

1. **P2 - El paseo imposible**: grafos, recorrido físico y soluciones alternativas.
2. **P6 - La máquina que hace demasiado**: estados, invariantes y solución lateral.
3. **P10 - Lo que sabemos que el otro sabe**: tablero de deducción, persistencia y dificultad alta.

Después se desarrollará el prototipo técnico mínimo y el vertical slice del prólogo.

## Tecnología prevista

- HTML, CSS y JavaScript.
- Canvas 2D para el mundo.
- HTML y CSS para menús, diálogos, cuaderno y paneles complejos.
- Tiled para mapas.
- Aseprite o LibreSprite para pixel art.
- Electron como opción provisional para la versión final de Windows.

Las versiones y dependencias concretas se fijarán al iniciar el prototipo técnico.

## Estructura del repositorio

```text
.
├── .github/                Plantillas de colaboración
├── assets/                 Fuentes y exportaciones artísticas
├── builds/                 Builds locales; no se versionan
├── content/                Datos narrativos y de juego
├── docs/                   Diseño, arquitectura y producción
├── src/                    Código fuente
├── tests/                  Pruebas automatizadas y casos de aceptación
└── tools/                  Validadores y utilidades de construcción
```

## Principios del proyecto

- La dificultad debe proceder del razonamiento, no de la interfaz.
- Toda solución obligatoria debe ser deducible con información del juego.
- Los errores no deben destruir progreso.
- La novia participa activamente en su propio rescate.
- La combinación del candado nunca se muestra directamente.
- El alcance se protege antes que añadir contenido secundario.
- El guardado y la entrega física tienen prioridad sobre el pulido opcional.

## Contribución

Consulta [CONTRIBUTING.md](CONTRIBUTING.md). Antes de implementar una decisión que cambie arquitectura, alcance, narrativa o reglas de un puzle, registra una ADR en `docs/decisions/`.

## Licencia

Todavía no se ha elegido una licencia pública. Mientras no exista un archivo `LICENSE`, el proyecto debe considerarse de uso privado y con todos los derechos reservados.

## Publicación en GitHub

Las instrucciones de inicialización, ramas y primera publicación están en [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md).
