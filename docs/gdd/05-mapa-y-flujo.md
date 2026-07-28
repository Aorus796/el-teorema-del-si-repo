# 5. Mapa y flujo de exploración

## 5.1. Arquitectura espacial

Axioma utiliza un núcleo central con rutas laterales. La Plaza conecta las zonas, pero las conexiones secundarias convierten el conjunto en una red y reducen el backtracking.

![Mapa conceptual de Axioma](../diagrams/world-map.png)

## 5.2. Capas

- **Nivel superior:** observatorio, mirador y senderos elevados.
- **Superficie:** plaza, biblioteca, jardín, canales y molino.
- **Subsuelo:** sótano, conductos y Archivo.

Las alturas se representan mediante mapas separados y transiciones; no existe geometría 3D real.

## 5.3. Pantallas aproximadas

| Área | Espacios estimados |
|---|---:|
| Plaza y calles | 6 |
| Biblioteca | 4 |
| Puentes | 5 |
| Jardín | 5 |
| Observatorio | 4 |
| Molino | 4 |
| Archivo | 7 |
| Secundarios | 3 |
| **Total máximo provisional** | **38** |

Los interiores secundarios son el primer recorte si la producción artística supera el alcance.

## 5.4. Plaza

La Plaza del Axioma funciona como introducción narrativa y núcleo central del pueblo. Durante el prólogo se encuentra en preparación para la boda del día siguiente.

- **PL1: centro ceremonial.** Altar, fuente y espacio principal de la plaza.
- **PL2: zona de invitados.** Filas de sillas, mesas de banquete, flores y cajas pendientes de colocar.
- **PL3: tablón de preparativos.** Introduce movimiento, interacción, cuaderno y guardado dentro de la ficción.
- **PL4: zona de organización.** Maestro de ceremonias y habitantes que preparan el evento.
- **PL5: punto de encuentro.** El padre de la novia entrega la nota que inicia la búsqueda.
- **PL6: accesos.** Caminos hacia la biblioteca, el Paseo de los Siete Puentes, el jardín, el observatorio y el molino.

Durante el vertical slice solo estarán operativos el centro de la plaza y la salida hacia el Paseo de los Siete Puentes. Los demás accesos podrán verse, pero permanecerán narrativamente bloqueados.

## 5.5. Biblioteca

- B1: sala principal y cuaderno.
- B2: archivo de mapas.
- B3: sección restringida.
- B4: sótano y conexión subterránea.

## 5.6. Paseo de los Siete Puentes

Esta zona constituye la primera localización de investigación y contiene P2, «El paseo imposible».

- **U1: acceso desde la plaza.** Presentación de la localización y orientación básica.
- **U2: mirador del mapa.** Panel o maqueta manipulada por la novia desde la que se abre P2.
- **U3: islas y pasarelas.** Representación ambiental de los lugares y conexiones del problema.
- **U4: embarcadero.** Contiene la evidencia que aparece o puede interpretarse después de resolver P2.
- **U5: conexión futura al molino.** Permanece cerrada durante el prólogo.

Al resolver P2, el jugador obtiene una anotación de la novia y un símbolo que señala la Biblioteca del Axioma como siguiente destino.

## 5.7. Jardín

- J1: entrada ornamental.
- J2: senderos de clasificación.
- J3: invernadero.
- J4: estanque de ciclos.
- J5: mirador y sendero al observatorio.

## 5.8. Observatorio

- O1: sendero elevado.
- O2: sala de instrumentos.
- O3: cámara de lentes.
- O4: cúpula.

## 5.9. Molino

- M1: patio de mecanismos.
- M2: taller de Permuto.
- M3: sala de configuración.
- M4: cámara de energía.

## 5.10. Archivo

- A1: acceso de validación.
- A2: galería de proposiciones.
- A3: red de dependencias.
- A4: cámara de interpretaciones.
- A5: sala de criterios.
- A6: cámara de comunicación.
- A7: núcleo del Custodio.

## 5.11. Estados de progresión

### Estado 0: prólogo

Plaza del Axioma y Paseo de los Siete Puentes. Se presentan los preparativos de la boda, los controles y el cuaderno. El padre de la novia entrega la primera nota y el jugador resuelve P2. La pista obtenida señala la biblioteca como siguiente destino.

### Estado 1: primera investigación

La Biblioteca del Axioma queda disponible y comienza la reconstrucción del recorrido de la novia. El Jardín se abre parcialmente y puede investigarse junto con las nuevas pistas de la biblioteca.

### Estado 2: apertura del pueblo

Se abren Observatorio y Molino. La novia envía una señal inequívoca.

### Estado 3: reactivación

Observatorio y Molino completados. Cambian fuente, luces, biblioteca y subsuelo.

### Estado 4: apertura del archivo

Regresos breves a las zonas, síntesis de información y acceso bajo la plaza.

### Estado 5: archivo

Progresión controlada, puzles avanzados y contacto con la novia.

### Estado 6: epílogo

Mundo abierto para consultar información y resolver el metapuzle.

## 5.12. Barreras

Las barreras serán mecánicas, informativas, sociales, ambientales o lógicas. Toda barrera debe mostrar qué falta o por qué no puede atravesarse. Se evitan puertas arbitrarias que el protagonista podría rodear.

## 5.13. Atajos

- Puentes a Molino.
- Jardín a Observatorio.
- Puentes a Jardín.
- Biblioteca a Plaza.
- Molino a subsuelo.
- Archivo a Plaza.

## 5.14. Navegación

Una vez abiertos los atajos, cualquier zona estará a menos de treinta segundos de la plaza. No habrá viaje rápido mediante menús ni minimapa permanente. El mapa del cuaderno muestra zonas visitadas, conexiones y accesos conocidos, pero no soluciones ni marcadores constantes de misión.

## 5.15. Puntos de no retorno

No existen puntos de no retorno permanentes. El jugador puede regresar al pueblo durante el tramo final y consultar información anterior.
