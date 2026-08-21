/*
 * Pixel-art indexado de Max (perro, pastor belga malinois) -- Max
 * Character Pixel-Art: aplica a Max el mismo NIVEL DE CALIDAD ya
 * aprobado para los cinco personajes humanos (Gonzalo, Elena, Corolaria,
 * el Padre de la novia y Silogio) -- matriz de caracteres + paleta
 * compacta, rasterizada una única vez y cacheada -- sin copiar su
 * arquitectura visual: Max es un cuadrúpedo, no un bípedo con
 * front/back/side + ojos por orientación.
 *
 * UNA sola variante ("side"), no tres. WorldScene.js (MaxCompanion.render())
 * y CreditsScene.js llaman a renderMax(context, x, y) sin ningún
 * parámetro de facing -- Max nunca gira visualmente: siempre se dibuja
 * en la misma pose lateral fija (cabeza a la izquierda, cuerpo y cola a
 * la derecha), igual que el render geométrico anterior que sustituye.
 * Añadir datasets front/back no tendría ningún consumidor real, así que
 * no se crean. Consecuencia directa: MAX_SIDE_PIXELS es la única
 * exportación de pixel-art (no hay MAX_FRONT_PIXELS/MAX_BACK_PIXELS), y
 * el criterio de ojos aplicado es el de "vista lateral: 1 ojo visible",
 * en la posición fija (fila 6, columna 4).
 *
 * Construido con una pasada de "outer outline": el relleno (cuerpo,
 * cabeza, orejas, patas, cola) se diseñó primero sin contorno, y la
 * mayoría de los píxeles transparentes 4-adyacentes a un píxel relleno
 * se convirtieron en contorno oscuro ("O") -- así el contorno nunca
 * "engulle" un trazo de 1px de ancho (patas, punta de cola), a
 * diferencia de un contorno que sustituyera píxeles de relleno ya
 * existentes. El contorno de la cabeza y el de las patas se calculan en
 * sub-cuadrículas separadas (no sobre las 20 filas a la vez): aplicarlo
 * sobre la cuadrícula completa haría que las celdas transparentes de la
 * cabeza se fusionaran con el contorno ya presente en las filas de
 * torso, produciendo una franja oscura sin diseñar entre cabeza y
 * cuerpo. Dos excepciones deliberadas al contorno automático, ambas
 * para preservar huecos que el propio diseño necesita: (1) el hueco
 * entre las dos orejas, protegido en las tres filas que ocupan (fila 0
 * columnas 4 y 8, fila 1 columnas 5 y 7, fila 2 columnas 5 y 6) --
 * solo las celdas inmediatamente adyacentes a una punta/base necesitan
 * protección; las que quedan más adentro del hueco nunca tocan relleno
 * y quedan transparentes por sí solas --, para que sigan leyéndose
 * como dos triángulos separados; (2) el escalón delante del
 * hocico (fila 6, columnas 0-2), protegido para que el hocico (que se
 * proyecta hacia delante en la fila 7) se lea como un bloque realmente
 * adosado por debajo del cráneo, no como una continuación plana de él
 * -- sin esta protección, el contorno del hocico se filtraría hacia
 * arriba en la fila 6 y borraría tanto el escalón como el ojo, que
 * vive justo en esa fila.
 *
 * Identidad de Max preservada del render procedural original
 * (WorldScene.js/MaxRenderer.js, antes de la migración a pixel-art
 * indexado): cuerpo tan/marrón, máscara facial oscura, dos orejas
 * erguidas, cuatro patas, cola levantada, sin collar -- MAX_PALETTE ya
 * no tenía un campo "collar" en uso (existía en characterPalettes.js
 * pero renderMax() nunca lo consumía).
 *
 * Bounding box ampliado a 22x20 (esta versión; antes 22x18 en las diez
 * rondas anteriores, todas dentro de ese límite). Autorización humana
 * explícita: "tras múltiples iteraciones queda demostrado visualmente
 * que 22x18 no ofrece resolución suficiente" para representar cabeza
 * cartoon con masa + frente + hocico + máscara + dos orejas + cuerpo
 * reconocible a la vez. Ancho sin cambios (22); alto +2 filas (18->20),
 * todas cedidas a la cabeza (7 filas -> 9), no al cuerpo. El tamaño no
 * es el sugerido originalmente (26x20/28x20): una auditoría previa al
 * cambio de arte encontró que MAX_DIMENSIONS (MaxRenderer.js) se
 * usaba a la vez para centrar el render visual y como caja de
 * colisión/spawn de Max en WorldScene.js -- crecer el sprite habría
 * crecido también, sin querer, la hitbox. Se DESACOPLARON ambos usos:
 * MAX_HITBOX_DIMENSIONS (nueva constante en MaxCompanion.js, congelada
 * en 22x18, el tamaño lógico de siempre) para colisión/spawn;
 * MAX_DIMENSIONS de MaxRenderer.js (ahora 22x20) solo para centrar el
 * render. El propio tamaño 22x20 se eligió porque es el mayor que, sin
 * tocar MAX_FOLLOW_MIN_DISTANCE (explícitamente fuera de alcance),
 * conserva el margen positivo que evita que la caja visual de Max se
 * solape con la de Gonzalo en el peor caso diagonal (ver el comentario
 * de MAX_FOLLOW_MIN_DISTANCE en MaxCompanion.js, y
 * tests/world/MaxCompanion.test.js para la comprobación automatizada).
 * MaxRenderer.js no necesitó ningún cambio de código: ya era
 * completamente genérico sobre MAX_PIXEL_WIDTH/MAX_PIXEL_HEIGHT.
 *
 * Cabeza redibujada dos veces dentro de las últimas dos rondas, ambas
 * dentro del mismo presupuesto fijo de 9 filas (0-8). Primera pasada
 * (redibujo completo, tras ampliar a 22x20): un cráneo cuyo borde
 * frontal recedía progresivamente fila a fila, combinado con un hocico
 * que saltaba hacia delante, trazaba una única diagonal continua de
 * punta de oreja a punta de nariz -- lectura de llama/ciervo, no de
 * perro. Se corrigió con un borde frontal del cráneo CONSTANTE (una
 * pared vertical, no una rampa) y un salto único y repentino del
 * hocico hacia delante, protegido de que el contorno lo rellene (ver
 * más arriba); y ensanchando la coronilla para que respaldara por
 * completo la base de las orejas sin pinzamiento.
 *
 * Segunda pasada (microiteración anterior): la revisión humana mantuvo
 * el tamaño 22x20 y la masa craneal, pero señaló que las orejas de 2
 * filas seguían sin distinguirse, el hocico se leía como un bloque
 * oscuro y cuadrado, y faltaba separación visual entre las cuatro
 * zonas de la cara. Orejas de 2 filas a 3 (taper punta-cuerpo-base);
 * cráneo de 4 pasos a 3 (coronilla, mejilla, frente+ojo fusionados);
 * hocico de 2 filas a 3 (taper de máscara 3/6/3 columnas). Un pliegue
 * de 1 píxel en el centro de la base de cada oreja (hallazgo de `qa`:
 * la base de la oreja y la coronilla compartían tono sin ningún
 * contorno entre ellas, porque el contorno automático solo actúa
 * sobre el borde EXTERIOR de la silueta, no entre regiones internas
 * contiguas) ayudó, pero `qa` lo calificó de mejora solo "modesta".
 *
 * Tercera pasada (esta versión, rediseño deliberado en vez de
 * micro-ajustes): la revisión humana aceptó la mejora pero mantuvo el
 * rechazo, con tres problemas concretos -- orejas todavía poco
 * distinguibles ("el mayor fallo actual"), cráneo con poca masa
 * visual, hocico demasiado irregular (el taper de 3 niveles de la
 * ronda anterior, 3/6/3, se leía como un zigzag de "demasiados
 * quiebros"). Redistribución del presupuesto de 9 filas, ahora
 * orejas(3) + cráneo(4) + hocico(2) en vez de orejas(3) + cráneo(3) +
 * hocico(3): el cráneo gana una fila real de masa (coronilla 10
 * columnas cols 1-10 sin cambios; mejilla 9 columnas sin cambios;
 * frente 7 columnas y fila del ojo 6 columnas, ahora dos filas
 * distintas en vez de una sola fusionada) a costa de simplificar el
 * hocico a un único escalón limpio en vez de un taper de tres niveles
 * (máscara de 6 columnas en la fila 7, frente a 3/6/3 antes, y 3
 * columnas en la fila 8 para la nariz -- "cráneo grande + morro corto
 * que sobresale" en dos filas, no tres). El pliegue de la base de las
 * orejas se traslada de dentro de la propia oreja (que en un primer
 * intento de esta ronda se probó ensanchar a 2 columnas y acabó
 * partiendo la base en dos mitades separadas, un defecto peor que el
 * que corregía) a la fila de la coronilla justo debajo: un único
 * píxel de contorno en la coronilla, en la columna bajo cada oreja
 * (columna 2 cercana, columna 7 lejana antes de que la separación de
 * orejas se ensanchara -- ver más abajo), que marca el límite sin
 * restar ningún píxel a la propia oreja. Ojo: fila 6, columna 4 (baja
 * una fila respecto a la ronda anterior, al separarse de nuevo frente
 * y fila del ojo). Nariz: fila 8, columna 0 -- sin cambios de
 * posición en ninguna ronda desde su introducción.
 *
 * Separación horizontal de las orejas ensanchada (mismo commit,
 * corrección tras revisión de `qa` de un primer intento de esta ronda
 * que dejaba las orejas sin cambio estructural real): `qa` encontró
 * que el cráneo y el hocico sí cumplían lo pedido, pero las orejas --
 * "el mayor fallo actual" según el propio encargo humano -- apenas
 * habían cambiado: las filas 0-1 eran idénticas a la versión ya
 * rechazada, y el pliegue de la coronilla es un ajuste cosmético de la
 * costura, no un cambio de la separación entre ambas orejas, que
 * seguía siendo de solo 1 columna en la base -- demasiado estrecha
 * para leerse a escala real de juego. Corrección: la punta lejana se
 * desplaza de la columna 7 a la columna 9 (separación entre puntas de
 * 4 a 6 columnas), sin estrechar ninguna base (ambas se mantienen en 4
 * columnas) -- el hueco crece a 2 columnas en la base y 3 en el nivel
 * medio, ganando separación Y manteniendo el volumen de cada oreja, no
 * intercambiando uno por otro. La coronilla (10 columnas, cols 1-10)
 * sigue respaldando por completo la base lejana, que ahora llega hasta
 * la columna 10 en vez de la 9. El pliegue de la coronilla se
 * desplaza junto con la base lejana, de la columna 7 a la columna 8.
 *
 * Cuerpo: sin cambios en esta ronda -- sigue siendo, byte a byte, el
 * cuerpo ya aprobado de 2fda024 (filas 7-17), en las filas 9-19. Sigue
 * sin collar. Ver CHANGELOG.md para el detalle completo, las cifras
 * verificadas de esta ronda y el historial de las once rondas
 * anteriores.
 */

export const MAX_PIXEL_WIDTH = 22;
export const MAX_PIXEL_HEIGHT = 20;
export const MAX_TRANSPARENT = ".";

// Nombrada MAX_PIXEL_PALETTE (no MAX_PALETTE) para no colisionar con la
// constante ya existente del mismo nombre en characterPalettes.js. "k"
// reutiliza exactamente MAX_PALETTE.mask y "b" reutiliza exactamente
// MAX_PALETTE.body -- el resto son tonos derivados nuevos para el
// volumen/sombreado que el render geométrico anterior no tenía. Paleta
// deliberadamente más compacta que la de los personajes humanos (7
// colores, no 10): Max no imita su arquitectura visual.
export const MAX_PIXEL_PALETTE = {
  O: "#1c1410", // contorno + ojo + nariz + uñas de las patas (más oscuro)
  k: "#3b2a1f", // máscara facial oscura (= MAX_PALETTE.mask)
  d: "#8a6339", // tan oscuro (sombra de orejas/patas traseras)
  b: "#b98653", // tan medio, cuerpo principal (= MAX_PALETTE.body)
  h: "#d4a876", // tan claro (highlight del lomo/frente)
  s: "#8f7a63", // sombra de vientre/almohadillas
  m: "#e8c9a0", // highlight cálido (punta de la cola)
};

/*
 * Vista lateral (única). Generada con un script de cuadrícula (relleno
 * + pasada de contorno exterior) y validada programáticamente:
 * conectividad 4-direccional completa (ninguna pieza flota por
 * separado), longitud de fila constante, y cobertura de paleta -- no es
 * un golden-pixel test, es la fuente real del dato.
 */
export const MAX_SIDE_PIXELS = [
  "..Oh.....dO...........",
  ".Ohmh...dmdO..........",
  "Ohhhh..ddddO..........",
  "ObObhhhbObbO..........",
  ".OObbbbbbbbbO.......O.",
  "..ObbbbbbbOO.......OmO",
  "...bObbbbO........OddO",
  "kkkkkkbbO.........OddO",
  "OkkkbOOO..........OddO",
  "OOO.ObbbbbbbbbbbbbbbbO",
  "....ObbbbhhhhhhhbbbbO.",
  "....ObbbbbbbbbbbbbbO..",
  "....ObbbbbbbbbbbbbbO..",
  ".....OOOssssssssbbbO..",
  "......OOOOOOOOOOOOO...",
  ".....ObbOddO.ObbOddO..",
  ".....ObbOddO.ObbOddO..",
  ".....OddObbO.OddObbO..",
  "......OOOssO..OOOssO..",
  ".....OssOOO..OssOOO...",
];
