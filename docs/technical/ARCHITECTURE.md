# Arquitectura técnica

Este documento resume la Fase 10 del GDD. La especificación detallada permanece en [`docs/GDD.md`](../GDD.md).

## Decisiones vigentes

- Canvas 2D para mundo y HTML/CSS para interfaz.
- JavaScript moderno sin motor general.
- Tiled para mapas.
- Estado central, banderas y eventos.
- Contenido narrativo separado del código.
- Puzles como módulos con contrato común.
- Validadores de soluciones independientes de la UI.
- Navegador para desarrollo; escritorio para la entrega final.

## Flujo de ejecución

```text
Plataforma
    ↓
Gestor de escenas ── Gestor de entrada
    ↓                       ↓
Estado central ───── Bus de eventos
    ↓
Mundo / Sistemas / Puzles
    ↓
Canvas + Interfaz HTML
```

## Primer incremento técnico

1. Arranque y escalado.
2. Bucle y escenas.
3. Entrada abstracta.
4. Mapa pequeño y cámara.
5. Colisiones e interacción.
6. NPC y diálogo.
7. Cuaderno mínimo.
8. Estado y persistencia.
9. Audio.
10. Pruebas de aceptación.
