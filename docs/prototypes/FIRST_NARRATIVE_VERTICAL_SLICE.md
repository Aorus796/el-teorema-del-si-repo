# Primer vertical slice narrativo

## Estado

Diseño aprobado provisionalmente para el hito `v0.5.0`.

## Objetivo

Sustituir la sala técnica inicial por un prólogo narrativo jugable que presente el misterio, los controles, el cuaderno, la exploración y el primer puzle integrado en el mundo.

El vertical slice comienza en la Plaza del Axioma y termina cuando el jugador resuelve P2 y descubre que debe dirigirse a la biblioteca.

## Contexto temporal

La historia comienza el día anterior a la boda.

La Plaza del Axioma está siendo preparada para la ceremonia. Hay mesas, sillas orientadas hacia el altar, flores, cajas, guirnaldas y habitantes ultimando detalles.

La novia no aparece y nadie conoce con certeza dónde se encuentra.

## Protagonista

El jugador controla al novio.

Su objetivo inicial es colaborar con los preparativos. La búsqueda comienza cuando el padre de la novia le entrega una nota encontrada en la habitación de ella.

## Estructura

### 1. Apertura en la Plaza del Axioma

Una presentación breve muestra los preparativos de la boda y permite al jugador reconocer el espacio.

El tono inicial es festivo, cotidiano y ligeramente caótico.

### 2. Tutorial contextual

El maestro de ceremonias introduce el movimiento y la interacción mediante una tarea sencilla relacionada con los preparativos.

Un tablón llamado «Plan de preparativos» explica:

- movimiento;
- interacción;
- apertura del cuaderno;
- guardado de la partida.

El tutorial debe ser breve y estar integrado en la ficción.

### 3. Primer momento de humor

Uno de los habitantes comenta:

> Las sillas están perfectamente ordenadas. El hecho de que miren en tres direcciones distintas es una cuestión de perspectiva.

### 4. Encuentro con el padre de la novia

El padre explica que la novia no está en su habitación y que nadie la ha visto desde la tarde anterior.

Ha encontrado una nota destinada al protagonista.

### 5. Nota de la novia

> Antes de mañana tengo que comprobar una cosa.
>
> Si no he vuelto al anochecer, sigue el camino de los siete puentes.
>
> No confíes en el mapa completo: uno de ellos nunca estuvo abierto.

La nota se registra en el cuaderno y activa el objetivo:

> Investiga el Paseo de los Siete Puentes.

### 6. Salida de la plaza

El jugador abandona la plaza mediante una salida delimitada.

La transición puede resolverse mediante:

- fundido;
- nombre de la nueva localización;
- cambio de mapa;
- frase breve del protagonista.

### 7. Paseo de los Siete Puentes

La segunda localización introduce el bucle principal:

1. explorar;
2. encontrar evidencias;
3. consultar el cuaderno;
4. resolver un problema;
5. obtener una nueva pista.

P2 aparece integrado como un mapa, maqueta o plano manipulado por la novia.

### 8. Resolución de P2

Al resolver P2:

- se desbloquea la entrada «El paseo imposible»;
- aparece una anotación dejada por la novia;
- se descubre un símbolo relacionado con la biblioteca;
- se activa el objetivo:

> Busca el origen del símbolo en la Biblioteca del Axioma.

El vertical slice termina dejando la biblioteca como siguiente destino.

## Mapas incluidos

### Plaza del Axioma

Elementos mínimos:

- altar;
- filas de sillas;
- mesas de banquete;
- cajas y flores;
- tablón de preparativos;
- maestro de ceremonias;
- padre de la novia;
- uno o dos habitantes secundarios;
- salida hacia el paseo.

### Paseo de los Siete Puentes

Elementos mínimos:

- acceso desde la plaza;
- ambientación exterior;
- mapa o panel de los puentes;
- punto de interacción con P2;
- evidencia posterior a la resolución;
- salida futura hacia la biblioteca.

## Estados narrativos mínimos

- prólogo iniciado;
- tutorial consultado;
- padre encontrado;
- nota recibida;
- paseo desbloqueado;
- P2 iniciado;
- P2 resuelto;
- pista de la biblioteca obtenida.

## Persistencia

La partida debe conservar:

- mapa actual;
- posición del jugador;
- diálogos y eventos completados;
- nota de la novia;
- objetivos del cuaderno;
- estado completo de P2;
- pista posterior a la resolución.

## Criterios de aceptación

El hito se considerará completo cuando:

1. una nueva partida comience en la plaza;
2. el jugador pueda aprender los controles dentro de la ficción;
3. el padre entregue la nota;
4. la nota quede registrada;
5. el jugador pueda viajar al paseo;
6. P2 se abra desde el escenario;
7. un intento incompleto pueda guardarse y restaurarse;
8. resolver P2 desbloquee la pista de la biblioteca;
9. el estado resuelto se conserve al cargar;
10. el acceso directo público mediante `P` haya sido eliminado.
