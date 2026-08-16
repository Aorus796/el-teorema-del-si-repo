/*
 * Compañero visual de Max dentro del mundo -- sigue al jugador con una zona
 * muerta y una velocidad de alcance, sin colisión, IA ni pathfinding propios
 * (ver docs/production/V1_1_PERSONALIZATION_SPEC.md, bloque "Human-approved
 * scope expansion -- Max companion"). Reutiliza el render procedural ya
 * existente de MaxRenderer.js sin modificarlo. No participa en el guardado:
 * WorldScene reconstruye una instancia nueva en cada setupCurrentMap().
 */
import { MAX_DIMENSIONS, renderMax } from "../render/MaxRenderer.js";

/*
 * Zona muerta: por debajo de esta distancia Max no se mueve.
 *
 * Calculada para que la caja visual de Max (22x18, MAX_DIMENSIONS de
 * MaxRenderer.js) y la de Gonzalo (según los fillRect() reales de
 * Player.render()) nunca se solapen, ni siquiera en la aproximación
 * diagonal más desfavorable durante el seguimiento normal.
 *
 * El sprite de Gonzalo NO es simétrico respecto a su ancla (this.x,
 * this.y): el pelo llega hasta 14px por encima del ancla, mientras que las
 * piernas/bodyAccent solo llegan hasta 8px por debajo. Un cálculo que
 * asuma un semi-alto simétrico (por ejemplo 11/11) subestima el caso en el
 * que Max se acerca por arriba (donde el pelo de Gonzalo es lo que hay que
 * despejar), que es el peor caso real:
 *   semiAnchoSuma = MaxAncho/2 + GonzaloAncho/2 = 11 + 7 = 18
 *   semiAltoSuma  = MaxAlto/2 + GonzaloArriba   = 9 + 14 = 23  (peor caso)
 *   distanciaSegura = sqrt(18^2 + 23^2) ≈ 29.21
 * Se redondea hacia arriba a 31 (margen de ~1.79px sobre el peor caso
 * real) y se ha verificado visualmente con capturas de pantalla reales
 * que, con este valor, el sprite de Max ya no se solapa con el de Gonzalo
 * durante el seguimiento normal ni en el spawn tras un cambio de mapa.
 * Ver tests/world/MaxCompanion.test.js para la comprobación geométrica
 * automatizada de esta garantía usando los fillRect() reales de Player.js.
 */
export const MAX_FOLLOW_MIN_DISTANCE = 31;
// A partir de esta distancia, Max usa la velocidad de alcance en vez de la
// velocidad normal de seguimiento. Se mantiene muy por encima de la zona
// muerta (31) para conservar dos zonas claramente separadas en vez de un
// único umbral casi indistinguible.
export const MAX_FOLLOW_CATCHUP_DISTANCE = 90;
// Menor que Player.speed (72 px/s) para que Max normalmente vaya un paso
// por detrás del jugador en vez de pisarle los talones.
export const MAX_NORMAL_SPEED = 60;
// Mayor que Player.speed para que Max pueda recuperar terreno perdido tras
// un desplazamiento brusco (por ejemplo, un cambio de mapa reciente).
export const MAX_CATCHUP_SPEED = 108;
export const MAX_REACTION_DURATION_SECONDS = 0.4;
export const MAX_REACTION_BOUNCE_HEIGHT = 4;

/*
 * La magnitud de cada offset coincide deliberadamente con
 * MAX_FOLLOW_MIN_DISTANCE (31): así Max nace ya dentro de la zona muerta de
 * follow() y no se desplaza ni un solo frame justo después de que
 * WorldScene.setupCurrentMap() lo reconstruya (carga, cambio de mapa o
 * regreso de un puzle). Un offset mayor que la zona muerta dejaría a Max
 * en tránsito varios frames tras cada reconstrucción -- indetectable a
 * simple vista, pero suficiente para que dos capturas de canvas
 * consecutivas del mismo estado "en reposo" (por ejemplo, antes de entrar
 * a un puzle y justo después de volver sin mover al jugador) dejen de ser
 * bit a bit idénticas, rompiendo las comprobaciones de estabilidad de
 * frame ya existentes en tests/e2e/game.spec.js.
 */
const MAX_SPAWN_OFFSETS = Object.freeze({
  up: Object.freeze({ x: 0, y: MAX_FOLLOW_MIN_DISTANCE }),
  down: Object.freeze({ x: 0, y: -MAX_FOLLOW_MIN_DISTANCE }),
  left: Object.freeze({ x: MAX_FOLLOW_MIN_DISTANCE, y: 0 }),
  right: Object.freeze({ x: -MAX_FOLLOW_MIN_DISTANCE, y: 0 }),
});

// Dirección opuesta a cada facing, usada por computeMaxSpawnCandidates()
// para probar el offset contrario cuando el offset normal queda bloqueado
// (por ejemplo, un punto de entrada estrecho junto a un muro).
const OPPOSITE_FACING = Object.freeze({
  up: "down",
  down: "up",
  left: "right",
  right: "left",
});

function offsetPosition(player, facing) {
  const offset = MAX_SPAWN_OFFSETS[facing] ?? MAX_SPAWN_OFFSETS.down;

  return {
    x: player.x + offset.x,
    y: player.y + offset.y,
  };
}

export class MaxCompanion {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.reactionTimer = 0;
  }

  /*
   * Diseño de dos zonas (no tres): por debajo de MAX_FOLLOW_MIN_DISTANCE no
   * se mueve; por encima, avanza a MAX_NORMAL_SPEED o, si la distancia ya
   * alcanzó MAX_FOLLOW_CATCHUP_DISTANCE, a MAX_CATCHUP_SPEED. El paso se
   * recorta para no sobrepasar el anillo mínimo en un mismo frame (evita
   * jitter). deltaSeconds llega ya acotado a 0.1 desde Game.js y
   * MAX_CATCHUP_SPEED siempre supera a Player.speed, así que Max nunca
   * queda atascado de forma permanente por lag de fotogramas una vez en
   * modo de alcance -- no hace falta ningún "snap" adicional aquí. El único
   * reposicionamiento instantáneo ocurre en WorldScene.setupCurrentMap(),
   * al reconstruir esta instancia tras un cambio de mapa o una carga.
   */
  follow(deltaSeconds, targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= MAX_FOLLOW_MIN_DISTANCE) {
      return;
    }

    const speed =
      distance >= MAX_FOLLOW_CATCHUP_DISTANCE
        ? MAX_CATCHUP_SPEED
        : MAX_NORMAL_SPEED;
    const step = Math.min(
      speed * deltaSeconds,
      distance - MAX_FOLLOW_MIN_DISTANCE,
    );

    this.x += dx * (step / distance);
    this.y += dy * (step / distance);
  }

  // Reentrante: reiniciar una reacción ya activa simplemente le da otros
  // MAX_REACTION_DURATION_SECONDS completos.
  triggerReaction() {
    this.reactionTimer = MAX_REACTION_DURATION_SECONDS;
  }

  tickReaction(deltaSeconds) {
    this.reactionTimer = Math.max(0, this.reactionTimer - deltaSeconds);
  }

  render(context, camera) {
    const screenX = Math.round(
      this.x - camera.x - MAX_DIMENSIONS.width / 2,
    );
    const screenY = Math.round(
      this.y -
        camera.y -
        MAX_DIMENSIONS.height / 2 -
        this.getBounceOffset(),
    );

    renderMax(context, screenX, screenY);
  }

  // Curva simple (medio seno) que arranca y termina en 0 -- sin
  // animación en reposo -- y alcanza MAX_REACTION_BOUNCE_HEIGHT a mitad de
  // la reacción.
  getBounceOffset() {
    if (this.reactionTimer <= 0) {
      return 0;
    }

    const progress = 1 - this.reactionTimer / MAX_REACTION_DURATION_SECONDS;
    return Math.sin(progress * Math.PI) * MAX_REACTION_BOUNCE_HEIGHT;
  }
}

export function computeMaxSpawnPosition(player) {
  return offsetPosition(player, player.facing);
}

/*
 * Lista corta y fija de posiciones candidatas para el spawn de Max, en
 * orden de preferencia -- no es pathfinding, solo una secuencia fija de
 * alternativas ya conocidas. WorldScene.js prueba cada una, en este
 * mismo orden, contra el CollisionMap del mapa actual (con el tamaño real
 * de Max, MAX_DIMENSIONS) hasta encontrar la primera que no colisione:
 *   1. El offset normal, detrás de Gonzalo según su facing actual (el
 *      resultado de computeMaxSpawnPosition()).
 *   2. El offset opuesto al facing actual -- cubre el caso de un punto de
 *      entrada estrecho junto a un muro, donde el offset normal empuja a
 *      Max justo contra ese muro.
 *   3 y 4. Offsets laterales fijos (izquierda y derecha), independientes
 *      del facing, para el caso poco probable de que tanto el offset
 *      normal como el opuesto queden bloqueados.
 *   5. La posición exacta de Gonzalo, como último recurso determinista.
 *      OJO: esto NO garantiza ausencia de colisión para la caja de Max.
 *      El jugador cabe ahí porque su propia caja de colisión (10x14,
 *      Player.getCollisionBox()) es más pequeña que la de Max
 *      (MAX_DIMENSIONS, 22x18): un hueco justo del tamaño de Gonzalo (por
 *      ejemplo, muy pegado a una pared o cerca del borde del mapa) puede
 *      no tener sitio para la caja mayor de Max. Es un best-effort
 *      determinista, no una garantía matemática -- resolveMaxSpawnPosition()
 *      en WorldScene.js siempre devuelve este último candidato si los
 *      cuatro anteriores colisionan, incluso si también colisiona, en vez
 *      de seguir buscando (evita cualquier forma de pathfinding). Ver el
 *      test "el último recurso puede colisionar en casos extremos" en
 *      tests/scenes/WorldScene.test.js, que documenta este caso límite
 *      aceptado en vez de afirmar una garantía más fuerte de la real.
 * MaxCompanion.js no importa CollisionMap a propósito: ese acoplamiento
 * vive solo en WorldScene.js, que ya es quien construye el CollisionMap
 * del mapa actual.
 */
export function computeMaxSpawnCandidates(player) {
  return [
    offsetPosition(player, player.facing),
    offsetPosition(player, OPPOSITE_FACING[player.facing] ?? "up"),
    offsetPosition(player, "left"),
    offsetPosition(player, "right"),
    { x: player.x, y: player.y },
  ];
}
