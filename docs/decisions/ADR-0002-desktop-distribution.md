# ADR-0002: distribución final de escritorio

- **Estado:** Aceptada provisionalmente
- **Fecha:** 2026-07-24

## Contexto

La apertura directa de un archivo HTML no ofrece el mismo comportamiento de almacenamiento y recursos en todos los navegadores. La entrega de boda necesita un entorno controlado.

## Decisión

Utilizar el navegador para desarrollo y prototipos. Empaquetar la versión final de Windows mediante una solución de escritorio basada en tecnologías web, provisionalmente Electron.

## Consecuencias

- El código principal continúa siendo HTML, CSS y JavaScript.
- El ejecutable será mayor, pero más predecible.
- Debe exponerse una API mínima y aislada para persistencia y ventana.
- La decisión se revisará al iniciar el prototipo técnico.
