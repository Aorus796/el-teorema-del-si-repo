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
 * entre las dos orejas, protegido en las dos filas que ocupan (fila 0
 * columnas 4-6, fila 1 columna 5), para que sigan leyéndose como dos
 * triángulos separados; (2) el escalón delante del hocico (fila 6,
 * columnas 0-2), protegido para que el hocico (que se proyecta hacia
 * delante en la fila 7) se lea como un bloque realmente adosado por
 * debajo del cráneo, no como una continuación plana de él -- sin esta
 * protección, el contorno del hocico se filtraría hacia arriba en la
 * fila 6 y borraría tanto el escalón como el ojo, que vive justo en
 * esa fila.
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
 * Cabeza redibujada por completo (filas 0-8, 9 filas). Lección de un
 * primer intento fallido dentro de esta misma ronda: un cráneo cuyo
 * borde frontal recede progresivamente fila a fila, combinado con un
 * hocico que salta hacia delante, traza una única diagonal continua de
 * punta de oreja a punta de nariz -- lectura de llama/ciervo, no de
 * perro, confirmada visualmente. Corrección: el borde frontal del
 * cráneo (columna 3) es CONSTANTE en las filas 3-6 -- una pared
 * vertical, no una rampa -- y la redondez viene del borde trasero
 * abultándose hacia atrás (9, 8, 7 y 6 columnas de ancho en las filas
 * 3, 4, 5 y 6), nunca del frontal moviéndose. El hocico (filas 7-8)
 * salta hacia delante hasta la columna 0 en un único paso repentino,
 * protegido de que el contorno lo rellene (ver más arriba). Segundo
 * defecto encontrado en esta misma ronda: la coronilla (fila 2) era
 * más estrecha que la base de las orejas que la coronaban, creando un
 * "pinzamiento" que se leía como cuello delgado -- corregido
 * ensanchando la coronilla a 10 columnas (cols 1-10) para respaldar
 * ambas bases sin que sobresalgan. Orejas acortadas de 3 filas a 2
 * (punta + base, sin fila intermedia) con base ensanchada: 3 filas
 * seguían leyéndose como astas incluso ya resuelto el pinzamiento;
 * acortar el alcance vertical relativo a una base ancha se lee más
 * como triángulo corto de perro. Highlight interior ("m") en la base
 * de la oreja cercana. Ojo: fila 6, columna 4, con tan a ambos lados
 * (una posición inicial en columna 3, pegada al escalón del hocico, se
 * fundía con el fondo transparente en la evidencia generada, y se
 * corrigió antes de darla por buena). Nariz: fila 8, columna 0.
 * Máscara amplia (8 columnas en la fila 7), sin alcanzar la coronilla.
 *
 * Cuerpo: se reutiliza, byte a byte, el cuerpo ya aprobado de 2fda024
 * (filas 7-17), desplazado a las filas 9-19 -- no había motivo para
 * tocar un cuerpo ya aceptado solo por cambiar de resolución. Sigue
 * sin collar. Ver CHANGELOG.md para el detalle completo, las cifras
 * verificadas de esta ronda y el historial de las diez rondas
 * anteriores dentro del límite de 22x18.
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
  ".OOh...dOO............",
  "Ohmhh.ddddO...........",
  "ObbbhhhbbbbO..........",
  ".OObbbbbbbbbO.........",
  "..ObbbbbbbbO........O.",
  "..ObbbbbbbO........OmO",
  "...bObbbbO........OddO",
  "kkkkkkkkbbO.......OddO",
  "OkkkkkbbOO........OddO",
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
