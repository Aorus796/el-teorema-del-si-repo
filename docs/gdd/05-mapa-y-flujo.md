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

- P1: ceremonia y fuente.
- P2: calle de la biblioteca.
- P3: calle de los canales.
- P4: camino del jardín.
- P5: escalinata del observatorio.
- P6: calle del molino.

## 5.5. Biblioteca

- B1: sala principal y cuaderno.
- B2: archivo de mapas.
- B3: sección restringida.
- B4: sótano y conexión subterránea.

## 5.6. Puentes

- U1: entrada de canales.
- U2: isla de Maestro Nodo.
- U3: tres pasarelas y compuertas.
- U4: embarcadero.
- U5: conexión al molino.

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

Plaza, calles y sala principal de la biblioteca. Se aprende a investigar y se obtiene el cuaderno.

### Estado 1: primera investigación

Puentes y Jardín disponibles parcialmente y resolubles en cualquier orden.

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
