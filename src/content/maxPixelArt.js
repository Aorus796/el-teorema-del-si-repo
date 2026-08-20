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
 * no se crean -- ver el criterio explícito de la propia tarea: "no
 * inventar cuatro datasets si no hacen falta". Consecuencia directa:
 * MAX_SIDE_PIXELS es la única exportación de pixel-art (no hay
 * MAX_FRONT_PIXELS/MAX_BACK_PIXELS), y el criterio de ojos aplicado es
 * el de "vista lateral: 1 ojo visible", en la posición fija (fila 5,
 * columna 3).
 *
 * Construido con una pasada de "outer outline": el relleno (cuerpo,
 * cabeza, orejas, patas, cola) se diseñó primero sin contorno, y la
 * mayoría de los píxeles transparentes 4-adyacentes a un píxel relleno
 * se convirtieron en contorno oscuro ("O") -- así el contorno nunca
 * "engulle" un trazo de 1px de ancho (patas, punta de cola), a
 * diferencia de un contorno que sustituyera píxeles de relleno ya
 * existentes. Única excepción deliberada: el hueco entre las dos orejas
 * (columna 3, filas 0-1) se protegió explícitamente de esta pasada para
 * que siguiera transparente -- de lo contrario el propio contorno
 * habría fusionado ambas orejas en una sola mancha oscura.
 *
 * Identidad de Max preservada del render procedural anterior
 * (WorldScene.js/MaxRenderer.js): cuerpo tan/marrón, máscara facial
 * oscura, dos orejas erguidas, cuatro patas, cola levantada, sin collar
 * -- MAX_PALETTE ya no tenía un campo "collar" en uso (existía en
 * characterPalettes.js pero renderMax() nunca lo consumía). Bounding
 * box 22x18, igual que el render geométrico anterior (MAX_DIMENSIONS no
 * cambia).
 *
 * Microiteración visual (filas 0-7 únicamente, cabeza/orejas/hocico/
 * cuello): tras la primera aprobación provisional del cuerpo, la cabeza
 * se rediseñó para que el hocico (cols 0-2) sea claramente más estrecho
 * que el cráneo (cols 3-6, antes ambos medían 4 columnas y se
 * solapaban, sin ninguna transición real) -- ver CHANGELOG.md para el
 * detalle de la corrección.
 * Filas 8-17 (torso, highlight de lomo, vientre, patas, almohadillas,
 * cola) permanecen byte a byte idénticas a la versión anterior: no se
 * tocaron en esta microiteración.
 */

export const MAX_PIXEL_WIDTH = 22;
export const MAX_PIXEL_HEIGHT = 18;
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
  "OkO.OdO..........OO...",
  "Okk.ddO.........OmmO..",
  ".OOOOO..........OmmO..",
  "..OhhOO.........OddO..",
  "OOkbbbbO........OddO..",
  "kkkObbbOO......OddO...",
  "kkkOOObbbOOOO..OddO...",
  "OkkO.ObbbhhhhOObbO....",
  "OOOOOObbbbbbbbbbbO....",
  ".....ObbbbbbbbbOO.....",
  ".....ObbbbbbbbbOO.....",
  "......ObbddssbbddO....",
  "......ObbddOObbddO....",
  "......ObbddOObbddO....",
  "......ObbddOObbddO....",
  "......ObbssOObbssO....",
  "......OssOO.OssOO.....",
  ".......OO....OO.......",
];
