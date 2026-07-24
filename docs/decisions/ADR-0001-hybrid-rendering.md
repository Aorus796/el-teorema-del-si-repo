# ADR-0001: arquitectura híbrida Canvas y HTML

- **Estado:** Aceptada provisionalmente
- **Fecha:** 2026-07-24

## Contexto

El mundo necesita cámara, tiles, sprites y animaciones. Las interfaces necesitan texto escalable, accesibilidad, formularios y navegación mediante teclado.

## Decisión

Renderizar el mundo mediante Canvas 2D y construir diálogos, cuaderno, opciones y paneles complejos con HTML y CSS superpuestos.

## Consecuencias

- Se separan mundo e interfaz.
- La accesibilidad y el texto mejoran.
- Debe existir un gestor claro de foco y escenas.
- Los estilos visuales de ambos sistemas deben mantenerse coherentes.
