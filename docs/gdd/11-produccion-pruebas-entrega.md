# 11. Producción, pruebas y entrega

## 11.1. Principios

- Validar antes de ampliar.
- Probar puzles antes de programarlos.
- No crear arte final sobre sistemas inestables.
- Mantener siempre una versión jugable.
- Separar dificultad de errores de interfaz.
- No fijar la combinación hasta comprar el candado.
- Preparar contingencias antes del día de entrega.

![Hoja de ruta](../diagrams/production-roadmap.png)

## 11.2. Primer juego de prueba

Incluye una zona pequeña, movimiento, NPC, diálogo, cuaderno, guardado, P2, P6, P10, reflexiones, opciones mínimas y arte temporal. No incluye historia completa, metapuzle real, arte personalizado ni ejecutable definitivo.

## 11.3. Prototipos de papel

Cada puzle se representa mediante tarjetas, tableros, diagramas o imágenes antes de programarse. No se aprueba si necesita una explicación verbal externa para comprender sus reglas.

Estados: concepto, papel, prueba, revisión, aprobado, implementado, validado y cerrado.

## 11.4. Verificación matemática

Se enumeran configuraciones y soluciones en P2, P4, P6, P8, P9, P10 y P11. La lógica se verifica independientemente de la presentación narrativa.

## 11.5. Perfiles de playtest

- Jugador general: controles e interfaz.
- Jugador lógico: ambigüedad y elegancia.
- Matemático: exigencia y atajos conceptuales.
- Observador: humor, ritmo y claridad visual.

Los evaluadores usan nombres y cifras temporales para proteger la sorpresa.

## 11.6. Métricas

- Tiempo hasta comprender el objetivo.
- Primera hipótesis.
- Intentos y reinicios.
- Reflexiones.
- Tiempo total.
- Abandono temporal.
- Explicación posterior.
- Satisfacción.

Se distingue dificultad productiva de bloqueo improductivo.

## 11.7. Incidencias

| Nivel | Descripción |
|---|---|
| Bloqueante | Impide avanzar o pierde progreso |
| Grave | Permite continuar con gran dificultad |
| Moderada | Afecta a claridad o calidad |
| Menor | Pulido visual o sonoro |

Prioridad: pérdida de progreso, bloqueos, soluciones válidas, información incorrecta, interacción, legibilidad, ritmo y pulido.

## 11.8. Definición de terminado

Una funcionalidad está terminada si cumple su objetivo, está integrada, guarda estado, responde ante errores, funciona con teclado, respeta accesibilidad, está documentada y ha sido probada.

## 11.9. Hitos

1. Documento consolidado.
2. Puzles de papel.
3. Prototipo técnico.
4. P2, P6 y P10 digitales.
5. Vertical slice.
6. Alpha completa.
7. Beta con arte y personalización.
8. Release candidate con combinación real.
9. Versión de boda.

## 11.10. Vertical slice

Incluye entrada a Axioma, plaza, desaparición, Alcaldesa, P0, biblioteca, Silogio, P1, cuaderno, guardado, arte y música representativos. Si funciona técnicamente pero no transmite encanto, se corrige antes de producir más zonas.

## 11.11. Producción por zonas

Proceso fijo: diseño, graybox, colisiones, entidades, puzle, validación, diálogos, cuaderno, arte, audio, pruebas, integración y cierre.

Orden: Plaza/Biblioteca, Puentes, Jardín, Molino, Observatorio, Archivo, Epílogo y Metapuzle.

## 11.12. Personalización

Se recopilan fotografías, peinados, ropa, gestos, aficiones, profesión, frases, lugares, viajes, comidas, mascotas y bromas. Se clasifican como esenciales, recomendables, opcionales o excluidas.

No se incluyen referencias que puedan avergonzar, generar tensión o ser interpretadas como una crítica real.

## 11.13. Candado

Requisitos: combinación configurable, ruedas confirmadas, lectura clara, funcionamiento suave, tamaño adecuado y método de emergencia.

Proceso:

1. Comprar.
2. Probar con combinación temporal.
3. Confirmar ruedas.
4. Elegir combinación definitiva.
5. Adaptar P11.
6. Probar cuadrículas.
7. Configurar.
8. Volver a probar.

La combinación no aparece en archivos, commits, incidencias o nombres. Los playtests utilizan cifras temporales.

## 11.14. Validación física

Una persona que no conozca la solución debe completar P11 y abrir físicamente el candado usando solo la información del juego.

## 11.15. Ejecutable

Se prueba en un entorno limpio y sin Internet: arranque, pantalla completa, audio, teclado, ratón, guardado, reapertura, antivirus, resoluciones, escalado de Windows, rutas con espacios y caracteres especiales.

## 11.16. Entrega

Opciones: ordenador del novio, memoria USB o equipo preparado. La recomendación es utilizar un equipo probado y conservar la USB como copia.

El paquete incluye ejecutable, recursos, versión, guardado limpio, copia comprimida, instrucciones mínimas y respaldo de emergencia.

## 11.17. Caja física

La caja, el candado, la nota y el símbolo de los arcos forman parte de la experiencia. La decoración puede utilizar lenguaje del Custodio, pero no revelar el método del metapuzle.

## 11.18. Contingencias

- Ejecutable: copia portátil y equipo alternativo.
- Guardado: exportación y copia automática.
- Bloqueo: reflexiones y pista física sellada.
- Candado: combinación privada y acceso de emergencia.
- Falta de tiempo: eliminar contenido secundario, no guardado, final o pruebas.

## 11.19. Versión de emergencia

Versión simplificada con historia resumida, puzles principales, cuaderno, metapuzle y arte funcional. Debe mantenerse jugable durante el desarrollo.

## 11.20. Copias

Repositorio remoto, copia local, copia externa, ejecutable y memoria USB. La única copia nunca está en el dispositivo de entrega.

## 11.21. Congelación

Antes de estabilizar se congelan historia, zonas, reparto, puzles, textos obligatorios, arte principal y combinación. Después solo se aceptan correcciones, claridad, accesibilidad y rendimiento.

## 11.22. Criterios de entrega

El juego se completa, guarda, acepta soluciones válidas, funciona offline, conserva P10, contiene reflexiones, presenta historia coherente, produce una combinación inequívoca y abre el candado real. No existen errores bloqueantes o graves conocidos y se ha realizado un ensayo general.
