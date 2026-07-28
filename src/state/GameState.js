import { P2State } from "../puzzles/p2-bridges/P2State.js";

export const SAVE_FORMAT_VERSION = 2;

const LEGACY_SAVE_FORMAT_VERSION = 1;
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
    };

    this.objectiveId = "review-preparations-board";
    this.notebook = [];

    this.puzzles = {
      p2: new P2State(),
    };
  }

  getPlayerState(mapId = this.world.currentMapId) {
    const storedState =
      this.world.playerByMap[mapId] ??
      DEFAULT_PLAYER_BY_MAP[mapId] ??
      DEFAULT_PLAYER_BY_MAP[DEFAULT_MAP_ID];

    return { ...storedState };
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
    this.setPlayerState(this.player);

    return {
      formatVersion: SAVE_FORMAT_VERSION,
      savedAt: new Date().toISOString(),
      scene: this.scene,
      player: { ...this.player },
      world: {
        currentMapId: this.world.currentMapId,
        playerByMap: clonePlayerByMap(this.world.playerByMap),
      },
      flags: { ...this.flags },
      objectiveId: this.objectiveId,
      notebook: this.notebook.map((entry) => ({ ...entry })),
      puzzles: {
        p2: this.puzzles.p2.toSaveData(),
      },
    };
  }

  restore(data) {
    if (
      !data ||
      ![
        LEGACY_SAVE_FORMAT_VERSION,
        SAVE_FORMAT_VERSION,
      ].includes(data.formatVersion)
    ) {
      throw new Error("La version de la partida guardada no es compatible.");
    }

    this.scene =
      data.scene === "dev-world"
        ? "world"
        : typeof data.scene === "string"
          ? data.scene
          : "world";

    this.world = restoreWorldState(data);
    this.player = this.getPlayerState();

    this.flags = {
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
    };

    this.objectiveId =
      typeof data.objectiveId === "string"
        ? data.objectiveId
        : "review-preparations-board";

    this.notebook = Array.isArray(data.notebook)
      ? data.notebook
          .filter(isNotebookEntry)
          .map((entry) => ({ ...entry }))
      : [];

    this.puzzles = {
      p2: new P2State(data.puzzles?.p2 ?? {}),
    };
  }
}

function restoreWorldState(data) {
  const currentMapId =
    typeof data.world?.currentMapId === "string"
      ? data.world.currentMapId
      : DEFAULT_MAP_ID;

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
   * Las partidas de formato 1 solo tenían una posición global. También
   * sirve como fallback para fixtures o guardados incompletos de formato 2.
   */
  if (
    data.formatVersion === LEGACY_SAVE_FORMAT_VERSION ||
    !savedPlayerByMap?.[currentMapId]
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
