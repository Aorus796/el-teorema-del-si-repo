/*
 * Pixel-art indexado del mecanismo del regalo final del epílogo
 * (`epilogue-gift-mechanism`, Plaza del Axioma -- Visual Polish, v1.2).
 * Sustituye el bloque geométrico de dos `fillRect` (cuerpo marrón madera
 * + franja dorada) que este objeto heredaba de la rama compartida
 * `type === "table"` de renderObjects() y que no se leía como nada
 * concreto sobre el suelo cálido de la plaza.
 *
 * El diseño sigue literalmente el diálogo ya existente del objeto
 * (`interactWithEpilogueGiftMechanism()` en WorldScene.js: "Una pieza
 * metálica descansa sobre un soporte de piedra, cerrada con un mecanismo
 * de anillos"), sin tocar ese texto:
 *   - Pedestal de piedra en tres piezas (capitel "S"/"s"/"d", fuste con
 *     una junta de sillería y basa más ancha), en gama fría gris para
 *     contrastar con el suelo arenoso cálido de axiom-plaza.
 *   - Cuerpo del mecanismo en metal frío oscuro ("m") con tapa superior
 *     más clara ("M" + resalte "h") y junta marcada, bisel izquierdo
 *     iluminado ("M") y canto derecho en sombra ("n").
 *   - Aros concéntricos de bronce ("B" iluminado arriba-izquierda, "b" en
 *     sombra abajo-derecha) centrados en la cara frontal, con el hueco
 *     interior oscuro ("n"): la forma circular es la única figura de la
 *     cara, así que se lee a escala de juego sin depender de detalle fino
 *     y sin el riesgo de "cara" que ya señaló QA cuando dos óvalos
 *     contiguos comparten un frente (ver archiveDeskPixelArt.js).
 *   - Contorno oscuro "O" completo, mismo patrón que el resto de props
 *     indexados del juego, para que se lea como objeto sólido.
 *
 * El sprite (40x40) desborda a propósito el hitbox real del objeto (32x24,
 * ver `epilogue-gift-mechanism` en worldMaps.js) 16px hacia arriba y 4px a
 * cada lado -- mismo precedente que library-ladder y archive-desk: solape
 * visual intencional y documentado, sin afectar interacción (el objeto
 * sigue siendo 32x24 con su interactionRadius de 30 sin cambios). A
 * diferencia de archive-desk, aquí no hay `solidRegion` propio que
 * compensar, así que el sprite se ancla al fondo del hitbox sin desborde
 * inferior -- ver drawEpilogueGiftMechanism() en WorldScene.js.
 *
 * Verificado contra los vecinos de axiom-plaza (worldMaps.js): en
 * coordenadas de mundo el sprite ocupa x556-596, y280-320. El objeto más
 * cercano, `bride-epilogue` (x650), queda a 54px; `wedding-table-north-right`
 * (x494-542, y348-394) y `wedding-table-south-right` (x574-622, y340-386)
 * quedan por debajo de y340, fuera del sprite; y el `solidRegion` de la
 * fila sur (tiles x31-38,y21-22 -> x496-624, y336-368) empieza 16px por
 * debajo del borde inferior del sprite.
 *
 * Generado (ver scratch-generate-epilogue-gift-mechanism.mjs, script de un
 * solo uso, no forma parte del repositorio) para garantizar las
 * dimensiones exactas 40x40 sin errores de transcripción manual.
 */

export const EPILOGUE_GIFT_MECHANISM_TRANSPARENT = ".";

export const EPILOGUE_GIFT_MECHANISM_PALETTE = {
  O: "#191820", // contorno
  h: "#8b98ac", // resalte superior de la tapa metálica
  M: "#5b6675", // metal medio (tapa y bisel izquierdo del cuerpo)
  m: "#3f4652", // metal oscuro de la cara frontal del cuerpo
  n: "#2a2f38", // metal en sombra (canto derecho y hueco de los aros)
  B: "#c8a154", // bronce iluminado de los aros
  b: "#8a6630", // bronce en sombra de los aros
  S: "#9d9a90", // piedra iluminada del pedestal
  s: "#7e7b73", // piedra media del pedestal
  d: "#5f5c55", // piedra en sombra y juntas de sillería
  j: "#221f1c", // sombra de contacto con el suelo
};

export const EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH = 40;
export const EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT = 40;

export const EPILOGUE_GIFT_MECHANISM_PIXELS = [
  "........................................",
  "........................................",
  "........OOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OhhhhhhhhhhhhhhhhhhhhhhO........",
  "........OMMMMMMMMMMMMMMMMMMMMMMO........",
  "........OMMMMMMMMMMMMMMMMMMMMMMO........",
  "........OMMMMMMMMMMMMMMMMMMMMMMO........",
  "........OOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OMmmmmmmmmmmmmmmmmmmmmnO........",
  "........OMmmmmmmmOOOOOOmmmmmmmnO........",
  "........OMmmmmmmOOBBBBOOmmmmmmnO........",
  "........OMmmmmmOOBBOOBBOOmmmmmnO........",
  "........OMmmmmmOBBOnnObbOmmmmmnO........",
  "........OMmmmmOOBOnnnnObOOmmmmnO........",
  "........OMmmmmOBBOnnnnObbOmmmmnO........",
  "........OMmmmmOOBOnnnnObOOmmmmnO........",
  "........OMmmmmmOBBOnnObbOmmmmmnO........",
  "........OMmmmmmOObbOObbOOmmmmmnO........",
  "........OMmmmmmmOObbbbOOmmmmmmnO........",
  "........OMmmmmmmmOOOOOOmmmmmmmnO........",
  "........OMmmmmmmmmmmmmmmmmmmmmnO........",
  "....OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO....",
  "....OSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO....",
  "....OssssssssssssssssssssssssssssssO....",
  "....OssssssssssssssssssssssssssssssO....",
  "....OddddddddddddddddddddddddddddddO....",
  "....OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO....",
  "......OSSssssssssssssssssssssssddO......",
  "......OSSssssssssssssssssssssssddO......",
  "......OSSssssssssssssssssssssssddO......",
  "......OddddddddddddddddddddddddddO......",
  "......OSSssssssssssssssssssssssddO......",
  "......OSSssssssssssssssssssssssddO......",
  "......OSSssssssssssssssssssssssddO......",
  "...OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO...",
  "...OSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO...",
  "...OssssssssssssssssssssssssssssssssO...",
  "...OddddddddddddddddddddddddddddddddO...",
  "...OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO...",
  "....jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj....",
];
