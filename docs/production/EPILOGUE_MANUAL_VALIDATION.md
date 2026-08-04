# Validación manual del epílogo — tarea 16

`docs/production/EPILOGUE_SPEC.md` §18.16 exige una revisión manual no
automatizable de duración, legibilidad, audio y empaquetado antes de dar
por completado el epílogo en `docs/production/V1_PRODUCTION_PLAN.md`. Esa
revisión no puede sustituirse por pruebas automatizadas (esas ya están
cubiertas por la tarea 15); este documento registra que se realizó y cuál
fue su resultado.

## Commit y fecha validados

- **Commit revisado:** `e51810e` (punta de `feat/v1-production-scope` en
  el momento de la revisión — incluye las tareas 1–15 del epílogo ya
  fusionadas).
- **Fecha:** 2026-08-04.
- **Responsable:** revisión manual realizada por el responsable del
  producto.

## Resultado, punto por punto

| Punto revisado | Resultado |
|---|---|
| Recorrido funcional completo | Aprobado |
| Selector en `0000` al abrir el mecanismo del regalo | Aprobado |
| Intento incorrecto | Aprobado |
| Combinación correcta | Aprobada |
| Presentación de amanecer de la Plaza | Aprobada |
| Aparición de la novia y diálogo final | Aprobados |
| Tarjetas y créditos | Aprobados |
| Legibilidad a 480×270 | Aprobada |
| Audio real (no simulado) | Aprobado |
| Guardado final | Aprobado |
| Carga de una partida completada | Aprobada |
| Consulta de solo lectura del mecanismo del regalo | Aprobada |
| Build de producción | Aprobado |
| Funcionamiento sin conexión a Internet | Aprobado |
| Errores de consola o respuestas 404 | Ninguno detectado |

## Línea base de pruebas automatizadas al momento de la revisión

- `docker compose run --rm game npm run check`: **423/423** pruebas
  unitarias superadas, build estático correcto.
- `docker compose run --rm playwright`: **15/15** pruebas Playwright
  superadas (incluye el recorrido E2E completo del epílogo de la tarea
  15).
- Árbol de trabajo: limpio.

## Duración — excepción documentada

`docs/production/EPILOGUE_SPEC.md` §11 fija una duración aproximada de
**5–7 minutos** para el recorrido completo del epílogo, a ritmo normal de
juego.

La sesión de validación manual registrada en este documento se completó
en aproximadamente **30 segundos**, porque quien la realizó ya conocía la
combinación y avanzó los diálogos y las tarjetas de créditos con rapidez,
sin el ritmo de lectura de un jugador que se enfrenta al contenido por
primera vez.

**Este documento no afirma que se haya verificado una duración de 5–7
minutos a ritmo normal.** Esa comprobación concreta de ritmo no se
realizó en esta sesión. El responsable del producto acepta expresamente
esta excepción y considera adecuado el resultado final del epílogo pese
a no haber medido la duración a ritmo normal en esta revisión: el
contenido, el orden de la secuencia y la mecánica ya quedan validados
por el resto de los puntos de este documento y por la suite automatizada
(tarea 15). Una medición de duración a ritmo pausado queda como
comprobación futura opcional si se considera necesaria más adelante, sin
que su ausencia bloquee el cierre de esta tarea.

## Empaquetado

`EPILOGUE_SPEC.md` §18.16 limita el alcance de "empaquetado" en esta
tarea a confirmar que el epílogo no rompe el build web estático ni
ningún flujo de guardado existente — no exige un empaquetado de
distribución (por ejemplo, para Windows), que corresponde a fases
posteriores del proyecto, fuera del alcance congelado de `v1.0.0`. Esa
comprobación específica (build de producción y funcionamiento sin
conexión a Internet) queda recogida en la tabla anterior, ambas
aprobadas.

## Conclusión

Con esta revisión, `docs/production/V1_PRODUCTION_PLAN.md` marca la
tarea 16 como completada. El epílogo (tareas 1–16 de
`EPILOGUE_SPEC.md` §18) queda cerrado dentro del alcance congelado de
`v1.0.0`, con la excepción de duración documentada arriba.
