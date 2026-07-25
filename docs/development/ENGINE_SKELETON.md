# Esqueleto tecnico del motor

## Objetivo

Este hito valida la base del juego antes de implementar P2 o cualquier zona definitiva.

Incluye:

- Canvas logico de 480 x 270.
- Escalado pixel-perfect mediante CSS.
- Bucle principal con `requestAnimationFrame`.
- Gestor de escenas.
- Entrada abstracta por acciones.
- Mapa temporal mayor que la pantalla.
- Camara.
- Movimiento diagonal normalizado.
- Colisiones por tiles.
- Interaccion contextual.
- Dialogo HTML.
- Cuaderno HTML.
- Guardado y carga con version de formato.
- Pruebas unitarias.
- Build estatico.

## Requisitos

- Node.js 20 o posterior.
- npm, incluido con Node.js.

El prototipo no tiene dependencias externas. No es necesario ejecutar `npm install`.

## Desarrollo

```bash
npm run dev
```

El servidor local mostrara la direccion:

```text
http://127.0.0.1:5173
```

## Validacion

```bash
npm run check
```

Este comando ejecuta:

1. Pruebas unitarias.
2. Build de produccion.

## Controles del prototipo

| Accion | Control |
|---|---|
| Movimiento | WASD o flechas |
| Interaccion | E o Enter |
| Cuaderno | Q o Tabulador |
| Guardar | K |
| Cargar | L |
| Volver al titulo | Escape |

## Criterios de aceptacion

- El juego abre en la escena de titulo.
- Enter inicia una partida limpia.
- El personaje se mueve con velocidad independiente de los FPS.
- Las diagonales no son mas rapidas.
- Las paredes detienen al personaje.
- La camara sigue al personaje sin salir del mapa.
- El cartel muestra un indicador contextual.
- El dialogo pausa el movimiento.
- Examinar el cartel crea una unica entrada de cuaderno.
- El cuaderno se abre y se cierra con teclado.
- K guarda la posicion y el cuaderno.
- L restaura la posicion y el cuaderno.
- Escape regresa al titulo.
- `npm run test` termina correctamente.
- `npm run build` genera `builds/browser`.

## Contenido deliberadamente temporal

- Graficos.
- Mapa.
- Colores.
- Dialogos.
- Atajos de guardado.
- Interfaz de titulo.
- Audio, que se incorporara en el siguiente hito.

## Siguiente hito

Tras validar esta base:

1. Crear el contrato comun de puzles.
2. Implementar P2 con datos temporales.
3. Anadir guardado parcial del intento.
4. Probar recorridos alternativos.
