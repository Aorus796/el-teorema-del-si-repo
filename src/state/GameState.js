import { P2State } from "../puzzles/p2-bridges/P2State.js";
import {
  LibraryCatalogueState,
} from "../puzzles/library-catalogue/LibraryCatalogueState.js";
import {
  applyLibraryCatalogueProgression,
} from "../progression/LibraryCatalogueProgression.js";
import {
  ArchiveCriteriaState,
} from "../puzzles/archive-criteria/ArchiveCriteriaState.js";
import {
  applyArchiveCriteriaProgression,
} from "../progression/ArchiveCriteriaProgression.js";

export const SAVE_FORMAT_VERSION = 4;

/*
 * Tres conceptos distintos, con listas separadas a propósito: reutilizar
 * una sola lista de "formatos legacy" para libraryCatalogue y para
 * archiveCriteria reiniciaría por error el catálogo real de una partida
 * de formato 3 (que ya contiene datos reales del catálogo, solo carece de
 * archiveCriteria).
 */
const SUPPORTED_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2, 3]);
const LIBRARY_CATALOGUE_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2]);
const ARCHIVE_CRITERIA_LEGACY_FORMAT_VERSIONS = Object.freeze([1, 2, 3]);
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
      investigationComplete: Boolean(
        data.flags?.investigationComplete,
      ),
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

    const puzzles = {
      p2: new P2State(data.puzzles?.p2 ?? {}),
      libraryCatalogue: restoreLibraryCatalogue(data),
      archiveCriteria: restoreArchiveCriteria(data),
    };

    this.scene = scene;
    this.world = world;
    this.player = player;
    this.flags = flags;
    this.objectiveId = objectiveId;
    this.notebook = notebook;
    this.puzzles = puzzles;

    applyLibraryCatalogueProgression(this);
    applyArchiveCriteriaProgression(this);
  }
}

function assertEpilogueFlagInvariants(flags) {
  if (flags.epilogueUnlocked && !flags.investigationComplete) {
    throw new Error(
      "La partida guardada tiene el epílogo desbloqueado sin haber completado la investigación.",
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
