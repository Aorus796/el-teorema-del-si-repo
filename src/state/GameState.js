import { P2State } from "../puzzles/p2-bridges/P2State.js";

export const SAVE_FORMAT_VERSION = 1;

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
    this.scene = "dev-world";
    this.player = {
      x: 48,
      y: 64,
      facing: "down",
    };
    this.flags = {
      examinedPrototypeSign: false,
    };
    this.notebook = [];
    this.puzzles = {
      p2: new P2State(),
    };
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

  toSaveData() {
    return {
      formatVersion: SAVE_FORMAT_VERSION,
      savedAt: new Date().toISOString(),
      scene: this.scene,
      player: { ...this.player },
      flags: { ...this.flags },
      notebook: this.notebook.map((entry) => ({ ...entry })),
      puzzles: {
        p2: this.puzzles.p2.toSaveData(),
      },
    };
  }

  restore(data) {
    if (!data || data.formatVersion !== SAVE_FORMAT_VERSION) {
      throw new Error("La version de la partida guardada no es compatible.");
    }

    this.scene = typeof data.scene === "string" ? data.scene : "dev-world";
    this.player = {
      x: readFiniteNumber(data.player?.x, 48),
      y: readFiniteNumber(data.player?.y, 64),
      facing: readFacing(data.player?.facing),
    };
    this.flags = {
      examinedPrototypeSign: Boolean(data.flags?.examinedPrototypeSign),
    };
    this.notebook = Array.isArray(data.notebook)
      ? data.notebook.filter(isNotebookEntry).map((entry) => ({ ...entry }))
      : [];
    this.puzzles = {
      p2: new P2State(data.puzzles?.p2 ?? {}),
    };
  }
}

function readFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function readFacing(value) {
  return ["up", "down", "left", "right"].includes(value) ? value : "down";
}

function isNotebookEntry(value) {
  return (
    value &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.text === "string"
  );
}
