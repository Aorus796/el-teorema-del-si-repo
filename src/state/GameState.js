import { P2_PHASE, P2State } from "../puzzles/p2-bridges/P2State.js";
import { P2_END_NODE, P2_GRAPH } from "../puzzles/p2-bridges/P2Graph.js";
import { findBridge } from "../puzzles/p2-bridges/P2Validator.js";
import {
  LibraryCatalogueState,
} from "../puzzles/library-catalogue/LibraryCatalogueState.js";
import {
  applyLibraryCatalogueProgression,
} from "../progression/LibraryCatalogueProgression.js";
import {
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../puzzles/archive-criteria/ArchiveCriteriaState.js";
import {
  applyArchiveCriteriaProgression,
} from "../progression/ArchiveCriteriaProgression.js";
import {
  applyDoubtBudgetProgression,
} from "../progression/DoubtBudgetProgression.js";
import {
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_QUESTION_LIMIT,
  DOUBT_BUDGET_TRUE_DOSSIER,
} from "../puzzles/doubt-budget/DoubtBudgetData.js";
import {
  getCompatibleDossiers,
} from "../puzzles/doubt-budget/DoubtBudgetValidator.js";
import {
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "../puzzles/doubt-budget/DoubtBudgetState.js";

export const SAVE_FORMAT_VERSION = 5;

/*
 * Cuatro conceptos distintos, con listas separadas a propósito: reutilizar
 * una sola lista de "formatos legacy" para libraryCatalogue, para
 * archiveCriteria y para doubtBudget reiniciaría por error el catálogo real
 * de una partida de formato 3 (que ya contiene datos reales del catálogo,
 * solo carece de archiveCriteria) o el criterio del Archivo real de una
 * partida de formato 4 (que solo carece de doubtBudget).
 */
const SUPPORTED_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2, 3, 4]);
const LIBRARY_CATALOGUE_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2]);
const ARCHIVE_CRITERIA_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2, 3]);
const DOUBT_BUDGET_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2, 3, 4]);
const LIBRARY_CATALOGUE_SAVE_FIELDS = Object.freeze([
  "order",
  "phase",
  "hintsRead",
  "attemptCount",
  "failureCode",
]);
const ARCHIVE_CRITERIA_SAVE_FIELDS = Object.freeze([
  "verdicts",
  "phase",
  "hintsRead",
  "attemptCount",
  "failureCode",
]);
/*
 * Las respuestas del Custodio no aparecen aquí a propósito: se derivan
 * siempre de las preguntas formuladas y del expediente real, que son
 * contenido inmutable, igual que las evidencias del criterio del Archivo
 * tampoco se persisten.
 */
const DOUBT_BUDGET_SAVE_FIELDS = Object.freeze([
  "askedQuestionIds",
  "identifiedDossierId",
  "phase",
  "hintsRead",
  "attemptCount",
  "failureCode",
]);
const DEFAULT_MAP_ID = "axiom-plaza";

const DEFAULT_PLAYER_BY_MAP = {
  "axiom-plaza": {
    x: 240,
    y: 192,
    facing: "up",
  },
  "seven-bridges-walk": {
    x: 48,
    y: 192,
    facing: "right",
  },
  library: {
    x: 240,
    y: 256,
    facing: "up",
  },
  archive: {
    x: 192,
    y: 192,
    facing: "up",
  },
  "containment-chamber": {
    x: 192,
    y: 208,
    facing: "up",
  },
};

const DEFAULT_NOTEBOOK_ENTRY = {
  id: "dev-room-sign",
  title: "Una sala que todavia no existe",
  text:
    "Este espacio temporal valida movimiento, colisiones, interaccion, cuaderno y guardado.",
};

const P2_NOTEBOOK_ENTRY = {
  id: "p2-bridges-solution",
  title: "El paseo imposible",
  text:
    "No era necesario cruzar los siete puentes. Al reconocer cuál estaba cerrado, los seis restantes formaban un recorrido posible desde la entrada hasta el molino.",
};

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.scene = "world";

    this.world = {
      currentMapId: DEFAULT_MAP_ID,
      playerByMap: cloneDefaultPlayerByMap(),
    };

    /*
     * Alias compatible con partidas y pruebas anteriores. La escena de
     * mundo utiliza getPlayerState() y setPlayerState().
     */
    this.player = this.getPlayerState();

    this.flags = {
      examinedPrototypeSign: false,
      preparationsBoardRead: false,
      brideNoteReceived: false,
      sevenBridgesUnlocked: false,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      containmentUnlocked: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    };

    this.objectiveId = "review-preparations-board";
    this.notebook = [];

    this.puzzles = {
      p2: new P2State(),
      libraryCatalogue: new LibraryCatalogueState(),
      archiveCriteria: new ArchiveCriteriaState(),
      doubtBudget: new DoubtBudgetState(),
    };
  }

  getPlayerState(mapId = this.world.currentMapId) {
    return readPlayerStateFromWorld(this.world, mapId);
  }

  setPlayerState(playerState, mapId = this.world.currentMapId) {
    const fallback = this.getPlayerState(mapId);
    const normalizedState = normalizePlayerState(playerState, fallback);

    this.world.playerByMap[mapId] = normalizedState;

    if (mapId === this.world.currentMapId) {
      this.player = { ...normalizedState };
    }
  }

  changeMap(mapId, entryPlayerState = null) {
    if (typeof mapId !== "string" || mapId.length === 0) {
      throw new Error("El identificador del mapa no es válido.");
    }

    /*
     * Conserva posibles cambios realizados mediante el alias legacy
     * state.player antes de abandonar el mapa actual.
     */
    this.setPlayerState(this.player, this.world.currentMapId);

    this.world.currentMapId = mapId;

    if (entryPlayerState !== null) {
      this.setPlayerState(entryPlayerState, mapId);
      return;
    }

    if (!this.world.playerByMap[mapId]) {
      this.world.playerByMap[mapId] = normalizePlayerState(
        DEFAULT_PLAYER_BY_MAP[mapId],
        DEFAULT_PLAYER_BY_MAP[DEFAULT_MAP_ID],
      );
    }

    this.player = this.getPlayerState(mapId);
  }

  /*
   * Cambia al mapa indicado, dejando siempre una posición segura para
   * él. Si ya se estaba en ese mapa: normaliza la posición en vivo
   * (this.player) contra la propia entrada ya guardada de ese mapa —
   * conserva la posición en vivo si es válida; si no lo es, usa esa
   * entrada ya guardada; y solo si ninguna de las dos es válida cae al
   * spawn seguro por defecto. Una entrada ya guardada corrupta nunca
   * puede pisar una posición en vivo válida, que es la fuente de verdad
   * mientras se permanece en el mismo mapa. Si se llega desde otro
   * mapa: la posición en vivo pertenece al mapa que se abandona y se
   * conserva allí (mismo mecanismo de siempre, sin tocar el mapa de
   * destino); la posición del mapa de destino se toma de su propia
   * entrada ya guardada si es válida, o del spawn seguro si no lo es.
   * Nunca reutiliza la posición de un mapa para otro. A diferencia de
   * changeMap(), no acepta una posición de entrada explícita: está
   * pensado para transiciones que deben aterrizar siempre en un lugar
   * seguro, con independencia del estado previo.
   */
  changeToSafeMap(mapId) {
    this.setPlayerState(this.player, this.world.currentMapId);

    this.world.currentMapId = mapId;

    const fallback =
      DEFAULT_PLAYER_BY_MAP[mapId] ?? DEFAULT_PLAYER_BY_MAP[DEFAULT_MAP_ID];
    const normalizedState = normalizePlayerState(
      this.world.playerByMap[mapId],
      fallback,
    );

    this.world.playerByMap[mapId] = normalizedState;
    this.player = { ...normalizedState };
  }

  addNotebookEntry(entry) {
    if (this.notebook.some((current) => current.id === entry.id)) {
      return false;
    }

    this.notebook.push({ ...entry });
    return true;
  }

  unlockPrototypeEntry() {
    this.flags.examinedPrototypeSign = true;
    return this.addNotebookEntry(DEFAULT_NOTEBOOK_ENTRY);
  }

  unlockP2Entry() {
    return this.addNotebookEntry(P2_NOTEBOOK_ENTRY);
  }

  registerP2Solution() {
    this.objectiveId = "inspect-p2-evidence";
    return this.unlockP2Entry();
  }

  toSaveData() {
    const savedPlayer = normalizePlayerState(
      this.player,
      this.getPlayerState(),
    );
    const savedPlayerByMap = clonePlayerByMap(
      this.world.playerByMap,
    );
    savedPlayerByMap[this.world.currentMapId] = {
      ...savedPlayer,
    };

    return {
      formatVersion: SAVE_FORMAT_VERSION,
      savedAt: new Date().toISOString(),
      scene: this.scene,
      player: { ...savedPlayer },
      world: {
        currentMapId: this.world.currentMapId,
        playerByMap: savedPlayerByMap,
      },
      flags: { ...this.flags },
      objectiveId: this.objectiveId,
      notebook: this.notebook.map((entry) => ({ ...entry })),
      puzzles: {
        p2: this.puzzles.p2.toSaveData(),
        libraryCatalogue:
          this.puzzles.libraryCatalogue.toSaveData(),
        archiveCriteria:
          this.puzzles.archiveCriteria.toSaveData(),
        doubtBudget: this.puzzles.doubtBudget.toSaveData(),
      },
    };
  }

  restore(data) {
    if (
      !data ||
      ![
        ...SUPPORTED_LEGACY_FORMAT_VERSIONS,
        SAVE_FORMAT_VERSION,
      ].includes(data.formatVersion)
    ) {
      throw new Error("La version de la partida guardada no es compatible.");
    }

    /*
     * Construye todos los campos derivados en variables locales antes de
     * mutar `this`. Cualquiera de estas llamadas puede lanzar (formato de
     * catálogo/Archivo corrupto, por ejemplo); si eso ocurre, `this` no
     * debe haberse tocado todavía, para que restore() sea atómico.
     */
    const giftCodeSolved = Boolean(data.flags?.giftCodeSolved);

    const scene = giftCodeSolved
      ? "world"
      : data.scene === "dev-world"
        ? "world"
        : typeof data.scene === "string"
          ? data.scene
          : "world";

    const world = restoreWorldState(data, giftCodeSolved);
    const player = readPlayerStateFromWorld(world);

    /*
     * Los puzles se restauran antes que las banderas porque tanto
     * containmentUnlocked como el estado de la consulta de contención se
     * deducen, en parte, del progreso de los puzles: un guardado anterior al
     * formato 5 no trae ninguno de los dos (ver hasLegacyContainmentProgress
     * y restoreDoubtBudget).
     */
    const p2 = restoreP2(data);
    const libraryCatalogue = restoreLibraryCatalogue(data);
    const archiveCriteria = restoreArchiveCriteria(data);
    const archiveCriteriaSolved =
      archiveCriteria.phase === ARCHIVE_CRITERIA_PHASE.SOLVED;
    const legacyContainmentProgress = hasLegacyContainmentProgress(
      data,
      archiveCriteriaSolved,
    );
    const puzzles = {
      p2,
      libraryCatalogue,
      archiveCriteria,
      doubtBudget: restoreDoubtBudget(data, legacyContainmentProgress),
    };

    const flags = {
      examinedPrototypeSign: Boolean(
        data.flags?.examinedPrototypeSign,
      ),
      preparationsBoardRead: Boolean(
        data.flags?.preparationsBoardRead,
      ),
      brideNoteReceived: Boolean(
        data.flags?.brideNoteReceived,
      ),
      sevenBridgesUnlocked: Boolean(
        data.flags?.sevenBridgesUnlocked,
      ),
      p2EvidenceFound: Boolean(
        data.flags?.p2EvidenceFound,
      ),
      libraryObjectiveUnlocked: Boolean(
        data.flags?.libraryObjectiveUnlocked,
      ),
      archiveUnlocked: Boolean(data.flags?.archiveUnlocked),
      /*
       * Reparación acotada A GUARDADOS LEGACY, no general.
       *
       * Un guardado anterior al formato 5 no puede traer
       * `containmentUnlocked` -- la bandera no existía --, así que hay que
       * deducirla del progreso que sí trae: `legacyContainmentProgress`
       * (epílogo ya desbloqueado, o criterio del Archivo ya resuelto; ver
       * hasLegacyContainmentProgress). `investigationComplete` acompaña por
       * la invariante `containmentUnlocked ⟹ investigationComplete`: sin
       * ella, un guardado de formato 3/4 con el criterio resuelto pero la
       * bandera ausente se volvería irrestaurable.
       *
       * A partir del formato 5, en cambio, ambas banderas se leen tal cual
       * vienen. Deducirlas también aquí (que es lo que hacía la versión
       * anterior de este bloque, con `|| archiveCriteriaSolved` para
       * cualquier versión) enmascararía un bug real de escritura: si
       * applyArchiveCriteriaProgression() dejara alguna vez de fijar
       * `containmentUnlocked` al resolver el Archivo, restore() lo repararía
       * en silencio en cada carga y ninguna prueba lo notaría. Un guardado de
       * formato 5 mal formado -- por ejemplo con `epilogueUnlocked` pero sin
       * `containmentUnlocked` -- debe fallar la invariante, no auto-curarse.
       * El único auto-curado que sigue existiendo para el formato 5 es el ya
       * documentado al final de restore(): applyArchiveCriteriaProgression()
       * y applyDoubtBudgetProgression(), que reparan banderas a partir de
       * puzles resueltos DESPUÉS de comprobar las invariantes.
       */
      investigationComplete:
        Boolean(data.flags?.investigationComplete) ||
        legacyContainmentProgress,
      containmentUnlocked:
        Boolean(data.flags?.containmentUnlocked) || legacyContainmentProgress,
      epilogueUnlocked: Boolean(data.flags?.epilogueUnlocked),
      epilogueStarted: Boolean(data.flags?.epilogueStarted),
      giftCodeSolved,
      epilogueCompleted: Boolean(data.flags?.epilogueCompleted),
    };

    assertEpilogueFlagInvariants(flags);

    const objectiveId = flags.epilogueCompleted
      ? "epilogue-completed"
      : typeof data.objectiveId === "string"
        ? data.objectiveId
        : "review-preparations-board";

    const notebook = Array.isArray(data.notebook)
      ? data.notebook
          .filter(isNotebookEntry)
          .map((entry) => ({ ...entry }))
      : [];

    this.scene = scene;
    this.world = world;
    this.player = player;
    this.flags = flags;
    this.objectiveId = objectiveId;
    this.notebook = notebook;
    this.puzzles = puzzles;

    applyLibraryCatalogueProgression(this);
    applyArchiveCriteriaProgression(this);
    applyDoubtBudgetProgression(this);
  }
}

function assertEpilogueFlagInvariants(flags) {
  if (flags.epilogueUnlocked && !flags.investigationComplete) {
    throw new Error(
      "La partida guardada tiene el epílogo desbloqueado sin haber completado la investigación.",
    );
  }

  if (flags.containmentUnlocked && !flags.investigationComplete) {
    throw new Error(
      "La partida guardada tiene la consulta de contención desbloqueada sin haber completado la investigación.",
    );
  }

  if (flags.epilogueUnlocked && !flags.containmentUnlocked) {
    throw new Error(
      "La partida guardada tiene el epílogo desbloqueado sin haber desbloqueado la consulta de contención.",
    );
  }

  if (flags.epilogueStarted && !flags.epilogueUnlocked) {
    throw new Error(
      "La partida guardada tiene el epílogo iniciado sin estar desbloqueado.",
    );
  }

  if (flags.giftCodeSolved && !flags.epilogueStarted) {
    throw new Error(
      "La partida guardada tiene el código de regalo del epílogo resuelto sin haber iniciado el epílogo.",
    );
  }

  if (flags.epilogueCompleted && !flags.giftCodeSolved) {
    throw new Error(
      "La partida guardada tiene el epílogo completado sin haber resuelto el código de regalo.",
    );
  }
}

function restoreWorldState(data, giftCodeSolved) {
  const originalMapId =
    typeof data.world?.currentMapId === "string"
      ? data.world.currentMapId
      : DEFAULT_MAP_ID;

  const currentMapId = giftCodeSolved ? DEFAULT_MAP_ID : originalMapId;

  const playerByMap = cloneDefaultPlayerByMap();
  const savedPlayerByMap = data.world?.playerByMap;

  if (
    savedPlayerByMap &&
    typeof savedPlayerByMap === "object" &&
    !Array.isArray(savedPlayerByMap)
  ) {
    for (const [mapId, playerState] of Object.entries(
      savedPlayerByMap,
    )) {
      if (typeof mapId !== "string" || mapId.length === 0) {
        continue;
      }

      playerByMap[mapId] = normalizePlayerState(
        playerState,
        DEFAULT_PLAYER_BY_MAP[mapId] ??
          DEFAULT_PLAYER_BY_MAP[DEFAULT_MAP_ID],
      );
    }
  }

  /*
   * `data.player` (el alias legacy de nivel superior) solo representa la
   * posición del mapa que de verdad estaba activo en el guardado
   * (originalMapId) — nunca la de `currentMapId` cuando éste se forzó a
   * un mapa distinto (por ejemplo, axiom-plaza al restaurar
   * giftCodeSolved=true desde un guardado hecho en otro mapa). Usarlo
   * fuera de `originalMapId` mezclaría las coordenadas de un mapa con la
   * geometría de otro. Las partidas de formato 1 solo tenían esta
   * posición global y ningún `world.currentMapId` propio, así que
   * `originalMapId` y `currentMapId` siempre coinciden por definición
   * (ambos caen en `DEFAULT_MAP_ID`) y conservan su comportamiento exacto
   * de siempre; también sirve como fallback para fixtures o guardados
   * incompletos de formato 2.
   */
  const legacyPlayerMatchesCurrentMap =
    data.formatVersion === 1 || originalMapId === currentMapId;

  if (
    legacyPlayerMatchesCurrentMap &&
    (data.formatVersion === 1 || !savedPlayerByMap?.[currentMapId])
  ) {
    playerByMap[currentMapId] = normalizePlayerState(
      data.player,
      playerByMap[currentMapId] ??
        DEFAULT_PLAYER_BY_MAP[DEFAULT_MAP_ID],
    );
  }

  return {
    currentMapId,
    playerByMap,
  };
}

/*
 * P2 no cambia de formato de guardado: los siete identificadores de puente
 * y los cinco nodos siguen existiendo, así que `P2State` acepta sin error
 * cualquier partida anterior. Lo que sí puede haber cambiado es la
 * topología lógica del grafo (qué dos lugares une un puente concreto), y
 * `P2State.validate()` solo comprueba longitudes e identificadores
 * conocidos: nunca revalida que dos nodos consecutivos de la ruta estén
 * realmente unidos por un puente abierto. Un recorrido a medias guardado
 * con la topología antigua puede por tanto restaurarse como historial
 * "semánticamente falso".
 *
 * Regla acotada, sin tocar SAVE_FORMAT_VERSION:
 * - TRAVERSING o FAILED: si el recorrido guardado ya no es coherente con
 *   el grafo actual, se vuelve a la planificación conservando las pistas
 *   leídas (las pistas no dependen de la topología) y el número de intentos
 *   ya realizados, exactamente igual que hace el reinicio dentro del juego
 *   (`P2State.restartTraversal()`, que devuelve el ciclo de vida a "ready"
 *   sin borrar `attemptCount`).
 * - PLANNING: se restaura tal cual. Un `closedBridgeId` que ya no sea la
 *   solución es inocuo: el jugador lo ve marcado y puede cambiarlo.
 * - SOLVED: nunca se toca. Un puzle ya resuelto por un jugador real
 *   permanece resuelto.
 */
function restoreP2(data) {
  const state = new P2State(data.puzzles?.p2 ?? {});

  if (state.phase !== P2_PHASE.TRAVERSING && state.phase !== P2_PHASE.FAILED) {
    return state;
  }

  if (isCoherentP2Traversal(state) && !isStuckP2Traversal(state)) {
    return state;
  }

  return new P2State({
    lifecycle: { attemptCount: state.lifecycle.attemptCount },
    hintsRead: state.hintsRead,
  });
}

function isCoherentP2Traversal(state) {
  if (state.route[0] !== P2_GRAPH.startNode) {
    return false;
  }

  for (let index = 0; index < state.route.length - 1; index += 1) {
    const fromNode = state.route[index];
    const toNode = state.route[index + 1];
    const bridge = findBridge(P2_GRAPH, fromNode, toNode);

    if (!bridge || bridge.id === state.closedBridgeId) {
      return false;
    }

    if (bridge.id !== state.usedBridgeIds[index]) {
      return false;
    }
  }

  return true;
}

/*
 * Un recorrido guardado puede seguir estando formado por aristas reales del
 * grafo nuevo y aun así dejar al jugador en un lugar sin ningún puente
 * abierto por cruzar. Callejones sin salida ha habido siempre: en cualquier
 * versión, cerrar un puente que no fuera el correcto podía dejar al jugador
 * atascado. Lo que cambia con la topología nueva es que también pueden
 * aparecer CON el cierre correcto, que en la topología anterior garantizaba
 * llegar a la solución siguiera el orden que siguiera. Durante el recorrido,
 * quedarse sin salidas es una partida bloqueada: la escena solo atiende
 * girar y avanzar mientras se recorre, y reiniciar pertenece a la fase de
 * fallo, así que el jugador no podría terminar nunca P2 ni desbloquear la
 * Biblioteca. La excepción es el recorrido ya terminado con éxito bajo la
 * topología nueva: no tiene salidas simplemente porque no le queda ningún
 * puente, y es coherente.
 *
 * La comprobación se limita a la fase de recorrido a propósito: quedarse sin
 * salidas es justamente lo que define un fallo, y en esa fase la escena ya
 * ofrece reiniciar, así que aplicarla también allí reiniciaría partidas de
 * fallo perfectamente legítimas.
 */
function isStuckP2Traversal(state) {
  if (state.phase !== P2_PHASE.TRAVERSING) {
    return false;
  }

  if (countAvailableP2Moves(state) > 0) {
    return false;
  }

  return !isCompleteP2Traversal(state);
}

/*
 * Mismo criterio que P2Puzzle.getAvailableMoves(): puentes del lugar actual
 * que no sean el cerrado ni estén ya usados.
 */
function countAvailableP2Moves(state) {
  return P2_GRAPH.bridges.filter(
    (bridge) =>
      bridge.id !== state.closedBridgeId &&
      !state.usedBridgeIds.includes(bridge.id) &&
      bridge.nodes.includes(state.currentNode),
  ).length;
}

function isCompleteP2Traversal(state) {
  const openBridgeCount = P2_GRAPH.bridges.length - 1;

  return (
    state.usedBridgeIds.length === openBridgeCount &&
    state.currentNode === P2_END_NODE
  );
}

function restoreLibraryCatalogue(data) {
  if (
    LIBRARY_CATALOGUE_LEGACY_FORMAT_VERSIONS.includes(data.formatVersion)
  ) {
    return new LibraryCatalogueState();
  }

  const hasCatalogue =
    data.puzzles &&
    typeof data.puzzles === "object" &&
    !Array.isArray(data.puzzles) &&
    Object.hasOwn(data.puzzles, "libraryCatalogue");
  const catalogueData = data.puzzles?.libraryCatalogue;

  if (
    !hasCatalogue ||
    !catalogueData ||
    typeof catalogueData !== "object" ||
    Array.isArray(catalogueData) ||
    !hasExactCatalogueFields(catalogueData)
  ) {
    throw new Error(
      "La partida guardada no contiene un catálogo válido.",
    );
  }

  try {
    return new LibraryCatalogueState(
      catalogueData,
    );
  } catch (error) {
    throw new Error(
      `El catálogo de la partida guardada no es válido: ${error.message}`,
    );
  }
}

function hasExactCatalogueFields(catalogueData) {
  const fields = Object.keys(catalogueData);

  return (
    fields.length === LIBRARY_CATALOGUE_SAVE_FIELDS.length &&
    LIBRARY_CATALOGUE_SAVE_FIELDS.every((field) =>
      Object.hasOwn(catalogueData, field),
    )
  );
}

function restoreArchiveCriteria(data) {
  if (ARCHIVE_CRITERIA_LEGACY_FORMAT_VERSIONS.includes(data.formatVersion)) {
    return new ArchiveCriteriaState();
  }

  const hasArchiveCriteria =
    data.puzzles &&
    typeof data.puzzles === "object" &&
    !Array.isArray(data.puzzles) &&
    Object.hasOwn(data.puzzles, "archiveCriteria");
  const archiveCriteriaData = data.puzzles?.archiveCriteria;

  if (
    !hasArchiveCriteria ||
    !archiveCriteriaData ||
    typeof archiveCriteriaData !== "object" ||
    Array.isArray(archiveCriteriaData) ||
    !hasExactArchiveCriteriaFields(archiveCriteriaData)
  ) {
    throw new Error(
      "La partida guardada no contiene un criterio del Archivo válido.",
    );
  }

  try {
    return new ArchiveCriteriaState(archiveCriteriaData);
  } catch (error) {
    throw new Error(
      `El criterio del Archivo de la partida guardada no es válido: ${error.message}`,
    );
  }
}

function hasExactArchiveCriteriaFields(archiveCriteriaData) {
  const fields = Object.keys(archiveCriteriaData);

  return (
    fields.length === ARCHIVE_CRITERIA_SAVE_FIELDS.length &&
    ARCHIVE_CRITERIA_SAVE_FIELDS.every((field) =>
      Object.hasOwn(archiveCriteriaData, field),
    )
  );
}

/*
 * El caso indultado: guardados anteriores al formato 5 que ya habían pasado
 * de largo por donde ahora vive la consulta de contención.
 *
 * En v1.2 el epílogo se desbloqueaba directamente al resolver el criterio
 * del Archivo; la consulta de contención no existía. Un guardado de formato
 * 4 con `epilogueUnlocked` (o con el criterio del Archivo ya resuelto, que
 * es lo que lo producía) describe una partida que, con las reglas vigentes
 * entonces, se ganó todo lo que viene después. Revertir esas banderas para
 * "obligar" a hacer la consulta nueva no es solo antipático: es imposible
 * sin dejar ilegibles partidas ya terminadas de v1.2. Si `epilogueCompleted`
 * era `true`, bajar `epilogueUnlocked` violaría de inmediato las
 * invariantes de assertEpilogueFlagInvariants() y restore() lanzaría sobre
 * un guardado perfectamente legítimo.
 *
 * Así que se indulta: las banderas del epílogo se conservan tal cual venían,
 * `containmentUnlocked` pasa a `true` y la consulta se restaura como
 * `solved`. Es el mismo tipo de decisión acotada que documenta restoreP2()
 * para los recorridos "semánticamente falsos" guardados con la topología
 * anterior: se prefiere un estado coherente y jugable a uno literal pero
 * roto. La diferencia es que aquí no basta con un estado por defecto: un
 * DoubtBudgetState en `ready` junto a `containmentUnlocked=true` dejaría la
 * progresión creyendo que la consulta está pendiente cuando el epílogo ya
 * está abierto, así que se construye una consulta realmente resuelta.
 */
function hasLegacyContainmentProgress(data, archiveCriteriaSolved) {
  if (!DOUBT_BUDGET_LEGACY_FORMAT_VERSIONS.includes(data.formatVersion)) {
    return false;
  }

  return Boolean(data.flags?.epilogueUnlocked) || archiveCriteriaSolved;
}

function restoreDoubtBudget(data, legacyContainmentProgress) {
  if (DOUBT_BUDGET_LEGACY_FORMAT_VERSIONS.includes(data.formatVersion)) {
    return legacyContainmentProgress
      ? createLegacySolvedDoubtBudgetState()
      : new DoubtBudgetState();
  }

  const hasDoubtBudget =
    data.puzzles &&
    typeof data.puzzles === "object" &&
    !Array.isArray(data.puzzles) &&
    Object.hasOwn(data.puzzles, "doubtBudget");
  const doubtBudgetData = data.puzzles?.doubtBudget;

  if (
    !hasDoubtBudget ||
    !doubtBudgetData ||
    typeof doubtBudgetData !== "object" ||
    Array.isArray(doubtBudgetData) ||
    !hasExactDoubtBudgetFields(doubtBudgetData)
  ) {
    throw new Error(
      "La partida guardada no contiene una consulta de contención válida.",
    );
  }

  try {
    return new DoubtBudgetState(doubtBudgetData);
  } catch (error) {
    throw new Error(
      `La consulta de contención de la partida guardada no es válida: ${error.message}`,
    );
  }
}

function hasExactDoubtBudgetFields(doubtBudgetData) {
  const fields = Object.keys(doubtBudgetData);

  return (
    fields.length === DOUBT_BUDGET_SAVE_FIELDS.length &&
    DOUBT_BUDGET_SAVE_FIELDS.every((field) =>
      Object.hasOwn(doubtBudgetData, field),
    )
  );
}

/*
 * Construye una consulta resuelta que un jugador real podría haber
 * alcanzado: se van formulando preguntas mientras cada una reduzca de
 * verdad el conjunto de expedientes compatibles, hasta que solo quede uno.
 * Se calcula contra los predicados reales en vez de fijar una terna
 * concreta, para que siga siendo coherente si el contenido cambiara; el
 * propio constructor de DoubtBudgetState rechazaría cualquier combinación
 * que no zanjara la consulta.
 */
function createLegacySolvedDoubtBudgetState() {
  const askedQuestionIds = [];

  for (const question of DOUBT_BUDGET_QUESTIONS) {
    const compatibleCount = getCompatibleDossiers({ askedQuestionIds }).length;

    if (
      compatibleCount === 1 ||
      askedQuestionIds.length === DOUBT_BUDGET_QUESTION_LIMIT
    ) {
      break;
    }

    const candidate = [...askedQuestionIds, question.id];
    const candidateCount = getCompatibleDossiers({
      askedQuestionIds: candidate,
    }).length;

    if (candidateCount < compatibleCount) {
      askedQuestionIds.push(question.id);
    }
  }

  return new DoubtBudgetState({
    askedQuestionIds,
    identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
    phase: DOUBT_BUDGET_PHASE.SOLVED,
    attemptCount: 1,
  });
}

function readPlayerStateFromWorld(world, mapId = world.currentMapId) {
  const storedState =
    world.playerByMap[mapId] ??
    DEFAULT_PLAYER_BY_MAP[mapId] ??
    DEFAULT_PLAYER_BY_MAP[DEFAULT_MAP_ID];

  return { ...storedState };
}

function cloneDefaultPlayerByMap() {
  return clonePlayerByMap(DEFAULT_PLAYER_BY_MAP);
}

function clonePlayerByMap(playerByMap) {
  return Object.fromEntries(
    Object.entries(playerByMap).map(([mapId, playerState]) => [
      mapId,
      { ...playerState },
    ]),
  );
}

function normalizePlayerState(value, fallback) {
  return {
    x: readFiniteNumber(value?.x, fallback.x),
    y: readFiniteNumber(value?.y, fallback.y),
    facing: readFacing(value?.facing, fallback.facing),
  };
}

function readFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function readFacing(value, fallback = "down") {
  return ["up", "down", "left", "right"].includes(value)
    ? value
    : fallback;
}

function isNotebookEntry(value) {
  return (
    value &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.text === "string"
  );
}
