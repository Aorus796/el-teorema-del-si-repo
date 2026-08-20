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
 * el de "vista lateral: 1 ojo visible", en la posición fija (fila 2,
 * columna 4).
 *
 * Construido con una pasada de "outer outline": el relleno (cuerpo,
 * cabeza, orejas, patas, cola) se diseñó primero sin contorno, y la
 * mayoría de los píxeles transparentes 4-adyacentes a un píxel relleno
 * se convirtieron en contorno oscuro ("O") -- así el contorno nunca
 * "engulle" un trazo de 1px de ancho (patas, punta de cola), a
 * diferencia de un contorno que sustituyera píxeles de relleno ya
 * existentes. Única excepción deliberada: el hueco entre las dos orejas
 * (fila 0, columnas 5-7, entre la punta de la oreja cercana en columna
 * 4 y la punta de la oreja lejana en columna 8) se protegió
 * explícitamente de esta pasada para que siguiera transparente -- de lo
 * contrario el propio contorno habría fusionado ambas orejas en una
 * sola mancha oscura.
 *
 * Identidad de Max preservada del render procedural original
 * (WorldScene.js/MaxRenderer.js, antes de la migración a pixel-art
 * indexado): cuerpo tan/marrón, máscara facial oscura, dos orejas
 * erguidas, cuatro patas, cola levantada, sin collar -- MAX_PALETTE ya
 * no tenía un campo "collar" en uso (existía en characterPalettes.js
 * pero renderMax() nunca lo consumía). Bounding box 22x18, igual que el
 * render geométrico anterior (MAX_DIMENSIONS no cambia).
 *
 * Rediseño anatómico completo (esta versión, sustituyendo tanto la
 * migración inicial como la microiteración posterior que solo tocaba la
 * cabeza): tras dos rondas de revisión visual humana que rechazaron el
 * resultado por leerse como "cánido genérico, a veces caballo/ciervo",
 * se rediseñan las 18 filas completas, no solo la cabeza. Cambio de
 * proporción principal: la cabeza pasa de ocupar 8 de las 18 filas
 * (44%) a solo 5 (filas 0-4), y las patas pasan de ocupar 6-7 filas a 8
 * (filas 10-17, 44%) -- un perro con patas largas y cabeza compacta en
 * vez de cabeza grande y patas cortas, que era la principal causa
 * estructural de la lectura equina. Cráneo compacto (relleno tan, fila
 * 2) del que el hocico (relleno de máscara, filas 3-4) se proyecta
 * hacia delante-abajo estrechándose hasta la nariz, en vez de mantener
 * el mismo ancho que el cráneo; pecho alto
 * y redondeado justo tras un cuello corto (fila 5); lomo con highlight
 * (fila 6) y vientre recogido con sombra (fila 8) para dar lectura de
 * "atlético" en vez de bloque rectangular; grupa donde nace la cola
 * (cols 16-18); cuatro patas largas y fáciles de diferenciar entre sí
 * (huecos de contorno reales entre las cuatro), cada una con una
 * ruptura de tono a media altura sugiriendo una articulación
 * (rodilla/corvejón) en vez de un rectángulo uniforme; cola con grosor
 * decreciente y una curva suave que termina ligeramente elevada, no
 * vertical. Ver CHANGELOG.md para el detalle completo y la comparación
 * visual contra las dos versiones anteriores.
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
  "...Ok...dO............",
  "..OkhhbdbO..........O.",
  ".OOOObbbbO.........OmO",
  "OkkkbbbbO..........OdO",
  "OkkOOOOOO..........Odd",
  "OOO.ObbbbOOOOOOOOOObbO",
  "....ObbbbhhhhhhhbbbbO.",
  "....ObbbbbbbbbbbbbbO..",
  ".....OOOssssssssbbbO..",
  "......OOOOOOOOOOOOO...",
  ".....ObbOddO.ObbOddO..",
  ".....ObbOddO.ObbOddO..",
  ".....ObbOddO.ObbOddO..",
  ".....ObbObbO.ObbObbO..",
  ".....OddObbO.OddObbO..",
  ".....OddObbO.OddObbO..",
  ".....OddOssO.OddOssO..",
  ".....OssOOO..OssOOO...",
];
