import { AMBIENT_THEME_PATH } from "../content/ambientAudioConfig.js";
import { OPENING_THEME_PATH } from "../content/introAudioConfig.js";
import { INTERACT_SFX_PATH } from "../content/sfxAudioConfig.js";
import { getWorldMap } from "../content/worldMaps.js";
import {
  WEDDING_TABLE_PALETTE,
  WEDDING_TABLE_PIXEL_HEIGHT,
  WEDDING_TABLE_PIXEL_WIDTH,
  WEDDING_TABLE_PIXELS,
  WEDDING_TABLE_TRANSPARENT,
} from "../content/weddingTablePixelArt.js";
import {
  WEDDING_ARCH_PALETTE,
  WEDDING_ARCH_PIXEL_HEIGHT,
  WEDDING_ARCH_PIXEL_WIDTH,
  WEDDING_ARCH_PIXELS,
  WEDDING_ARCH_TRANSPARENT,
} from "../content/weddingArchPixelArt.js";
import {
  buildFountainPalette,
  FOUNTAIN_PIXEL_HEIGHT,
  FOUNTAIN_PIXEL_WIDTH,
  FOUNTAIN_PIXELS,
  FOUNTAIN_TRANSPARENT,
} from "../content/fountainPixelArt.js";
import {
  FLOWER_PLANTER_PALETTE,
  FLOWER_PLANTER_PIXEL_HEIGHT,
  FLOWER_PLANTER_PIXEL_WIDTH,
  FLOWER_PLANTER_PIXELS,
  FLOWER_PLANTER_TRANSPARENT,
} from "../content/flowerPlanterPixelArt.js";
import {
  FLOWER_POT_PALETTE,
  FLOWER_POT_PIXEL_HEIGHT,
  FLOWER_POT_PIXEL_WIDTH,
  FLOWER_POT_PIXELS,
  FLOWER_POT_TRANSPARENT,
} from "../content/flowerPotPixelArt.js";
import {
  BUSH_PALETTE,
  BUSH_ROUND_CORNER_PIXEL_HEIGHT,
  BUSH_ROUND_CORNER_PIXEL_WIDTH,
  BUSH_ROUND_CORNER_PIXELS,
  BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT,
  BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH,
  BUSH_ROUND_FOUNTAIN_PIXELS,
  BUSH_TRANSPARENT,
  CYPRESS_PIXEL_HEIGHT,
  CYPRESS_PIXEL_WIDTH,
  CYPRESS_PIXELS,
} from "../content/bushPixelArt.js";
import {
  BENCH_PALETTE,
  BENCH_PIXEL_HEIGHT,
  BENCH_PIXEL_WIDTH,
  BENCH_PIXELS,
  BENCH_TRANSPARENT,
} from "../content/benchPixelArt.js";
import {
  LAMP_POST_PALETTE,
  LAMP_POST_PIXEL_HEIGHT,
  LAMP_POST_PIXEL_WIDTH,
  LAMP_POST_PIXELS,
  LAMP_POST_TRANSPARENT,
} from "../content/lampPostPixelArt.js";
import {
  MARKET_STALL_PALETTE,
  MARKET_STALL_PIXEL_HEIGHT,
  MARKET_STALL_PIXEL_WIDTH,
  MARKET_STALL_PIXELS,
  MARKET_STALL_TRANSPARENT,
} from "../content/marketStallPixelArt.js";
import {
  WEDDING_CRATE_PALETTE,
  WEDDING_CRATE_PIXEL_HEIGHT,
  WEDDING_CRATE_PIXEL_WIDTH,
  WEDDING_CRATE_PIXELS,
  WEDDING_CRATE_TRANSPARENT,
} from "../content/weddingCratePixelArt.js";
import {
  FABRIC_ROLL_PALETTE,
  FABRIC_ROLL_PIXEL_HEIGHT,
  FABRIC_ROLL_PIXEL_WIDTH,
  FABRIC_ROLL_PIXELS,
  FABRIC_ROLL_TRANSPARENT,
} from "../content/fabricRollPixelArt.js";
import {
  PARTNER_NAME,
  PROTAGONIST_NAME,
} from "../content/personalizationConfig.js";
import {
  BRIDE_FATHER_PALETTE,
  BRIDE_PALETTE,
  DEFAULT_NPC_PALETTE,
  MAYOR_PALETTE,
  NAMED_NPC_PALETTES,
  NPC_HEAD,
  NPC_SILHOUETTE,
  SILOGIO_PALETTE,
} from "../content/characterPalettes.js";
import { P2_PHASE } from "../puzzles/p2-bridges/P2State.js";
import {
  LIBRARY_CATALOGUE_PHASE,
} from "../puzzles/library-catalogue/LibraryCatalogueState.js";
import {
  ARCHIVE_CRITERIA_PHASE,
} from "../puzzles/archive-criteria/ArchiveCriteriaState.js";
import { MAX_DIMENSIONS } from "../render/MaxRenderer.js";
import { Camera } from "../world/Camera.js";
import { CollisionMap } from "../world/CollisionMap.js";
import {
  computeMaxSpawnCandidates,
  MaxCompanion,
} from "../world/MaxCompanion.js";
import { Player } from "../world/Player.js";

const VIEWPORT_WIDTH = 480;
const VIEWPORT_HEIGHT = 270;

const BRIDE_NOTE_ENTRY = {
  id: "bride-note",
  title: "Nota encontrada en la habitación",
  text:
    "Antes de mañana tengo que comprobar una cosa. Si no he vuelto al anochecer, sigue el camino de los siete puentes. No confíes en el mapa completo: uno de ellos nunca estuvo abierto.",
};

const LIBRARY_CLUE_ENTRY = {
  id: "library-clue",
  title: "La marca de la biblioteca",
  text:
    "La anotación encontrada junto al embarcadero contiene dos arcos entrelazados y una referencia al archivo de mapas de la Biblioteca del Margen.",
};

const BRIDE_EPILOGUE_DIALOGUE_TURNS = [
  {
    speaker: "Novia",
    lines: [
      "No quería saber si serías capaz de encontrarme. Quería que supieras que podías dejar de buscar.",
    ],
  },
  {
    speaker: "Protagonista",
    lines: ["Y aun así he venido."],
  },
  {
    speaker: "Novia",
    lines: ["Entonces dime qué demuestra el teorema."],
  },
  {
    speaker: "Protagonista",
    lines: [
      "Que ningún sí vale para siempre solo porque se pronunció una vez. Vale porque, pudiendo decir que no, hoy volvemos a elegirlo.",
    ],
  },
  {
    speaker: "Novia",
    lines: ["Eso era lo único que necesitaba comprobar antes de mañana."],
  },
];

const OBJECTIVE_LABELS = {
  "review-preparations-board": "Revisa el tablón de preparativos",
  "speak-to-corolaria": "Habla con la alcaldesa Corolaria",
  "speak-to-bride-father": "Habla con el padre de la novia",
  "investigate-seven-bridges": "Investiga el Paseo de los Siete Puentes",
  "inspect-p2-evidence": "Busca la pista junto al embarcadero",
  "go-to-library": "Dirígete a la Biblioteca del Margen",
  "inspect-archive-criteria-table":
    "Entra en el Archivo y examina la mesa de criterios.",
  "start-epilogue": "Regresa al lugar donde comenzó la demostración.",
  "epilogue-meet-bride": `Acércate a ${PARTNER_NAME} en la Plaza.`,
  "epilogue-completed": "La demostración ha terminado.",
};

export class WorldScene {
  constructor({ scenes, input, storage, state, ui, audio }) {
    this.scenes = scenes;
    this.input = input;
    this.storage = storage;
    this.state = state;
    this.ui = ui;
    this.audio = audio;
    this.map = null;
    this.player = null;
    this.camera = null;
    this.collisionMap = null;
    this.nearbyObject = null;
    this.maxCompanion = null;
    /*
     * Foto del estado resuelto de los tres puzles tomada justo antes de
     * cambiar a su escena, para poder distinguir -- al volver a
     * setupCurrentMap() -- una resolución real (false -> true) de una
     * reentrada a un puzle ya resuelto o de una carga de partida (que
     * nunca arma este campo). Ver getPuzzleSolvedSnapshot().
     */
    this.pendingPuzzleSolvedSnapshot = null;
  }

  enter({
    restoreFromState = false,
    mapId = null,
    entryPlayerState = null,
  } = {}) {
    this.ui.closeAll();

    if (restoreFromState) {
      this.load();
    }

    if (mapId !== null) {
      this.state.changeMap(mapId, entryPlayerState);
    } else if (entryPlayerState !== null) {
      this.state.setPlayerState(entryPlayerState);
    }

    this.setupCurrentMap();
    this.syncMusicToFlags();
  }

  exit() {
    this.syncPlayerState();
    this.ui.closeAll();
  }

  setupCurrentMap() {
    this.map = getWorldMap(this.state.world.currentMapId);

    this.collisionMap = new CollisionMap({
      width: this.map.width,
      height: this.map.height,
      tileSize: this.map.tileSize,
      solidTiles: this.map.solidTiles,
    });

    this.player = new Player(this.state.getPlayerState());

    this.camera = new Camera({
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
      worldWidth: this.map.worldWidth,
      worldHeight: this.map.worldHeight,
    });

    this.camera.follow(this.player);

    /*
     * Reposiciona a Max en cada reconstrucción del mapa (carga inicial,
     * cambio de mapa, regreso desde cualquier sub-escena de puzzle o
     * carga de partida en curso). Le pasamos su posición actual (si ya
     * existía una instancia previa, típicamente tras volver de un puzle en
     * el mismo mapa) como último recurso adicional: resolveMaxSpawnPosition()
     * la valida igual que cualquier otro candidato antes de usarla, así que
     * nunca se reutiliza una posición que hoy colisiona en el mapa actual.
     *
     * resolveMaxSpawnPosition() puede devolver null en el caso extremo de
     * que ningún candidato local ni la posición previa sean válidos -- en
     * ese ciclo Max simplemente no se reconstruye (this.maxCompanion queda
     * null) en vez de colocarlo visualmente dentro de geometría sólida;
     * ver el resto de usos de this.maxCompanion, todos con `?.` por este
     * motivo.
     */
    const previousMaxPosition = this.maxCompanion
      ? { x: this.maxCompanion.x, y: this.maxCompanion.y }
      : null;
    const maxSpawnPosition = resolveMaxSpawnPosition(
      this.player,
      this.collisionMap,
      previousMaxPosition,
    );
    this.maxCompanion = maxSpawnPosition
      ? new MaxCompanion(maxSpawnPosition)
      : null;

    /*
     * Si esta reconstrucción llega justo después de una resolución real
     * de puzle (pendingPuzzleSolvedSnapshot armado antes del
     * scenes.change() correspondiente), dispara la reacción de Max
     * exactamente una vez por resolución real -- nunca al reentrar a un
     * puzle ya resuelto ni al cargar una partida (que nunca arma este
     * campo).
     */
    if (this.pendingPuzzleSolvedSnapshot !== null) {
      const currentSnapshot = this.getPuzzleSolvedSnapshot();
      const hasNewlySolvedPuzzle = Object.keys(
        this.pendingPuzzleSolvedSnapshot,
      ).some(
        (puzzleId) =>
          !this.pendingPuzzleSolvedSnapshot[puzzleId] &&
          currentSnapshot[puzzleId],
      );

      if (hasNewlySolvedPuzzle) {
        this.maxCompanion?.triggerReaction();
      }
    }

    this.pendingPuzzleSolvedSnapshot = null;
    this.nearbyObject = null;
  }

  getPuzzleSolvedSnapshot() {
    return {
      p2: this.state.puzzles.p2.phase === P2_PHASE.SOLVED,
      libraryCatalogue:
        this.state.puzzles.libraryCatalogue.phase ===
        LIBRARY_CATALOGUE_PHASE.SOLVED,
      archiveCriteria:
        this.state.puzzles.archiveCriteria.phase ===
        ARCHIVE_CRITERIA_PHASE.SOLVED,
    };
  }

  update(deltaSeconds) {
    this.maxCompanion?.tickReaction(deltaSeconds);

    if (this.ui.isDialogueOpen()) {
      if (this.input.wasPressed("interact")) {
        this.ui.advanceDialogue();
      }
      return;
    }

    if (this.ui.isNotebookOpen()) {
      if (
        this.input.wasPressed("notebook") ||
        this.input.wasPressed("cancel")
      ) {
        this.ui.hideNotebook();
      }
      return;
    }

    if (this.input.wasPressed("cancel")) {
      this.syncPlayerState();
      this.audio.stopMusic();
      this.scenes.change("title");
      return;
    }

    if (this.input.wasPressed("notebook")) {
      this.ui.showNotebook(this.state.notebook);
      return;
    }

    if (this.input.wasPressed("save")) {
      this.save();
    }

    if (this.input.wasPressed("load")) {
      if (this.load()) {
        this.setupCurrentMap();
        this.reconcileAudioAfterLoad();
        this.ui.showToast("Partida cargada");
      }
      return;
    }

    const axis = this.input.getAxis();
    this.player.update(deltaSeconds, axis, this.collisionMap);
    this.camera.follow(this.player);
    this.maxCompanion?.follow(deltaSeconds, this.player.x, this.player.y);

    this.nearbyObject = findNearbyObject(
      this.player,
      this.map.objects,
      this.state,
    );

    if (this.nearbyObject) {
      this.ui.showPrompt(getInteractionPrompt(this.nearbyObject));

      if (this.input.wasPressed("interact")) {
        this.interact(this.nearbyObject);
      }
    } else {
      this.ui.hidePrompt();
    }
  }

  /*
   * Único punto de despacho de todas las interacciones válidas del mundo
   * (guardado por nearbyObject + wasPressed("interact") en update()), así
   * que dispara el SFX de interacción exactamente una vez por cada
   * interacción real, sin importar el tipo de objeto. El avance de
   * diálogo no pasa por aquí (update() hace return antes si
   * ui.isDialogueOpen()), así que reproducir el SFX aquí nunca se repite
   * al avanzar un diálogo ya abierto.
   */
  interact(object) {
    this.audio.playSfx(INTERACT_SFX_PATH);
    this.ui.hidePrompt();

    /*
     * Reacción ligera de Max ante cualquier interacción real salvo las
     * salidas (con o sin bloquear): cruzar un portal ya dispara su propia
     * reacción en el destino, en interactWithExit(), y una salida
     * bloqueada no representa ningún avance narrativo.
     */
    if (object.type !== "exit" && object.type !== "blocked-exit") {
      this.maxCompanion?.triggerReaction();
    }

    if (object.id === "preparations-board") {
      this.interactWithPreparationsBoard();
      return;
    }

    if (object.id === "mayor-corolaria") {
      this.interactWithCorolaria();
      return;
    }

    if (object.id === "bride-father") {
      this.interactWithBrideFather();
      return;
    }

    if (object.id === "plaza-worker") {
      this.ui.beginDialogue({
        speaker: "Ayudante de la ceremonia",
        lines: [
          "He contado las sillas tres veces.",
          "Siempre sobra una, pero nunca es la misma.",
          "La alcaldesa dice que eso no es un problema matemático sino logístico.",
        ],
      });
      return;
    }

    if (object.id === "library-silogio") {
      this.interactWithSilogio();
      return;
    }

    if (object.id === "archive-criteria-table") {
      this.interactWithArchiveCriteriaTable();
      return;
    }

    if (object.id === "epilogue-gift-mechanism") {
      this.interactWithEpilogueGiftMechanism();
      return;
    }

    if (object.id === "bride-epilogue") {
      this.interactWithBrideEpilogue();
      return;
    }

    if (object.type === "exit") {
      this.interactWithExit(object);
      return;
    }

    if (object.type === "blocked-exit") {
      this.interactWithBlockedExit(object);
      return;
    }

    if (object.id === "p2-bridge-board") {
      this.interactWithP2Board();
      return;
    }

    if (object.id === "p2-evidence") {
      this.interactWithP2Evidence();
    }
  }

  interactWithPreparationsBoard() {
    const isFirstRead = !this.state.flags.preparationsBoardRead;

    this.ui.beginDialogue({
      speaker: "Tablón de preparativos",
      lines: [
        "Víspera de la boda. Quedan por colocar flores, mesas y varias filas de sillas.",
        "Muévete con WASD o las flechas. Pulsa E para hablar o examinar.",
        "Pulsa Q para consultar el cuaderno y K para guardar la partida.",
        "Una nota añadida al margen indica: «Hablar con Corolaria antes del mediodía».",
      ],
      onComplete: () => {
        if (!isFirstRead) {
          return;
        }

        this.state.flags.preparationsBoardRead = true;
        this.state.objectiveId = "speak-to-corolaria";
        this.ui.showToast("Objetivo actualizado");
      },
    });
  }

  interactWithCorolaria() {
    if (!this.state.flags.preparationsBoardRead) {
      this.ui.beginDialogue({
        speaker: "Alcaldesa Corolaria",
        lines: [
          `Llegas justo a tiempo, ${PROTAGONIST_NAME}.`,
          "Antes de que alguien mueva otra silla, revisa el tablón de preparativos.",
          "La última persona que improvisó una fila creó tres pasillos y ninguna entrada.",
        ],
      });
      return;
    }

    if (!this.state.flags.brideNoteReceived) {
      this.ui.beginDialogue({
        speaker: "Alcaldesa Corolaria",
        lines: [
          "Bien. Ya conoces las normas básicas de esta operación.",
          "Ahora necesito que hables con el padre de la novia.",
          "Ha venido buscándote y, por una vez, el retraso no parece culpa de las flores.",
        ],
        onComplete: () => {
          this.state.objectiveId = "speak-to-bride-father";
        },
      });
      return;
    }

    this.ui.beginDialogue({
      speaker: "Alcaldesa Corolaria",
      lines: [
        "Mantendré los preparativos en marcha para no alarmar al pueblo.",
        "Investiga el Paseo de los Siete Puentes.",
        "Y procura no desmontar ninguno: todavía figuran en el presupuesto municipal.",
      ],
    });
  }

  interactWithBrideFather() {
    if (!this.state.flags.preparationsBoardRead) {
      this.ui.beginDialogue({
        speaker: "Padre de la novia",
        lines: [
          "Necesito hablar contigo, pero primero termina con Corolaria.",
          "No quiero que toda la plaza escuche esto.",
        ],
      });
      return;
    }

    if (this.state.flags.brideNoteReceived) {
      this.ui.beginDialogue({
        speaker: "Padre de la novia",
        lines: [
          `La nota era lo único extraño en la habitación de ${PARTNER_NAME}.`,
          "No había señales de violencia ni de que hubiera preparado un viaje.",
          "Confío en ti. Encuentra el lugar del que habla.",
        ],
      });
      return;
    }

    this.ui.beginDialogue({
      speaker: "Padre de la novia",
      lines: [
        `${PARTNER_NAME} no está en su habitación y nadie la ha visto salir esta mañana.`,
        "No hay señales de violencia. Solo encontré esta nota sobre la mesa.",
        "«Antes de mañana tengo que comprobar una cosa.»",
        "«Si no he vuelto al anochecer, sigue el camino de los siete puentes.»",
        "«No confíes en el mapa completo: uno de ellos nunca estuvo abierto.»",
      ],
      onComplete: () => {
        this.state.flags.brideNoteReceived = true;
        this.syncMusicToFlags();
        this.state.flags.sevenBridgesUnlocked = true;
        this.state.objectiveId = "investigate-seven-bridges";

        const wasAdded = this.state.addNotebookEntry(
          BRIDE_NOTE_ENTRY,
        );

        if (wasAdded) {
          this.ui.showToast("Nota añadida al cuaderno");
        }
      },
    });
  }

  interactWithExit(object) {
    if (
      object.id === "plaza-to-seven-bridges" &&
      !this.state.flags.sevenBridgesUnlocked
    ) {
      this.ui.beginDialogue({
        speaker: "Camino oriental",
        lines: [
          "El camino conduce al Paseo de los Siete Puentes.",
          "No tienes todavía ningún motivo para abandonar los preparativos.",
        ],
      });
      return;
    }

    if (
      object.id === "seven-bridges-to-library" &&
      !this.state.flags.libraryObjectiveUnlocked
    ) {
      this.ui.beginDialogue({
        speaker: "Camino de la biblioteca",
        lines: [
          "Todavía no tengo ningún motivo para ir a la Biblioteca.",
        ],
      });
      return;
    }

    if (
      object.id === "library-to-archive" &&
      !this.state.flags.archiveUnlocked
    ) {
      this.ui.beginDialogue({
        speaker: "Acceso al Archivo",
        lines: ["El acceso al Archivo sigue cerrado."],
      });
      return;
    }

    this.syncPlayerState();
    this.state.changeMap(
      object.targetMapId,
      object.targetPlayerState,
    );
    this.setupCurrentMap();
    this.maxCompanion?.triggerReaction();
    this.ui.showToast(this.map.name);
  }

  interactWithSilogio() {
    this.syncPlayerState();
    this.pendingPuzzleSolvedSnapshot = this.getPuzzleSolvedSnapshot();
    this.scenes.change("library-catalogue");
  }

  interactWithArchiveCriteriaTable() {
    this.syncPlayerState();
    this.pendingPuzzleSolvedSnapshot = this.getPuzzleSolvedSnapshot();
    this.scenes.change("archive-criteria");
  }

  interactWithEpilogueGiftMechanism() {
    if (!this.state.flags.epilogueUnlocked) {
      this.ui.beginDialogue({
        speaker: "Mecanismo del regalo",
        lines: [
          "Una pieza metálica descansa sobre un soporte de piedra, cerrada con un mecanismo de anillos.",
          "No hay nada que examinar todavía.",
        ],
      });
      return;
    }

    this.syncPlayerState();

    if (this.state.flags.giftCodeSolved) {
      this.scenes.change("epilogue-gift-code", { readOnly: true });
      return;
    }

    this.scenes.change("epilogue-gift-code");
  }

  interactWithBrideEpilogue() {
    if (!this.state.flags.giftCodeSolved) {
      return;
    }

    if (this.state.flags.epilogueCompleted) {
      return;
    }

    this.syncPlayerState();
    this.playBrideDialogueTurn(0);
  }

  playBrideDialogueTurn(turnIndex) {
    const turn = BRIDE_EPILOGUE_DIALOGUE_TURNS[turnIndex];
    const isLastTurn = turnIndex === BRIDE_EPILOGUE_DIALOGUE_TURNS.length - 1;

    this.ui.beginDialogue({
      speaker: turn.speaker,
      lines: turn.lines,
      onComplete: () => {
        if (isLastTurn) {
          this.completeBrideDialogue();
          return;
        }

        this.playBrideDialogueTurn(turnIndex + 1);
      },
    });
  }

  completeBrideDialogue() {
    this.audio.playEpilogueTheme();
    this.syncPlayerState();
    this.scenes.change("credits");
  }

  interactWithBlockedExit(object) {
    if (
      object.id === "blocked-library" &&
      this.state.flags.libraryObjectiveUnlocked
    ) {
      this.ui.beginDialogue({
        speaker: "Camino de la biblioteca",
        lines: [
          "El símbolo de la anotación coincide con el emblema de la Biblioteca del Margen.",
          "Ese será el siguiente lugar que investigar.",
        ],
      });
      return;
    }

    this.ui.beginDialogue({
      speaker: object.label,
      lines: [
        "Este camino no está disponible durante el prólogo.",
        "Todavía quedan pistas por investigar en la ruta actual.",
      ],
    });
  }

  interactWithP2Board() {
    if (this.state.puzzles.p2.phase === P2_PHASE.SOLVED) {
      this.ui.beginDialogue({
        speaker: "Mapa de los siete puentes",
        lines: [
          "El recorrido correcto permanece trazado sobre el mapa.",
          "Uno de los siete puentes nunca estuvo abierto.",
          "Algo ha quedado visible junto al embarcadero.",
        ],
        onComplete: () => {
          if (!this.state.flags.p2EvidenceFound) {
            this.state.objectiveId = "inspect-p2-evidence";
          }
        },
      });
      return;
    }

    this.ui.beginDialogue({
      speaker: "Mapa de los siete puentes",
      lines: [
        "Cinco lugares aparecen unidos por siete puentes.",
        `${PARTNER_NAME} marcó que uno de ellos estaba cerrado.`,
        "Encuentra un recorrido que cruce todos los demás una sola vez.",
      ],
      onComplete: () => {
        this.syncPlayerState();
        this.pendingPuzzleSolvedSnapshot = this.getPuzzleSolvedSnapshot();
        this.scenes.change("p2-bridges", {
          returnScene: "world",
        });
      },
    });
  }

  interactWithP2Evidence() {
    if (this.state.puzzles.p2.phase !== P2_PHASE.SOLVED) {
      this.ui.beginDialogue({
        speaker: "Embarcadero",
        lines: [
          "Entre las tablas hay una marca incompleta.",
          "Sin comprender el mapa de los puentes no puedes interpretarla.",
        ],
      });
      return;
    }

    if (this.state.flags.p2EvidenceFound) {
      this.ui.beginDialogue({
        speaker: "Anotación de la novia",
        lines: [
          "Dos arcos entrelazados rodean una referencia al archivo de mapas.",
          "La siguiente pista se encuentra en la Biblioteca del Margen.",
        ],
      });
      return;
    }

    this.ui.beginDialogue({
      speaker: "Anotación de la novia",
      lines: [
        "La solución del mapa señala una tabla concreta del embarcadero.",
        "Debajo encuentras dos arcos entrelazados y una referencia al archivo de mapas.",
        "La marca coincide con el emblema de la Biblioteca del Margen.",
      ],
      onComplete: () => {
        this.state.flags.p2EvidenceFound = true;
        this.state.flags.libraryObjectiveUnlocked = true;
        this.state.objectiveId = "go-to-library";

        const wasAdded = this.state.addNotebookEntry(
          LIBRARY_CLUE_ENTRY,
        );

        if (wasAdded) {
          this.ui.showToast("Nueva pista registrada");
        }
      },
    });
  }

  save() {
    try {
      this.syncPlayerState();
      this.storage.save(this.state.toSaveData());
      this.ui.showToast("Partida guardada");
    } catch (error) {
      console.error(error);
      this.ui.showToast("No se pudo guardar la partida", 3000);
    }
  }

  load() {
    try {
      const saveData = this.storage.load();

      if (saveData === null) {
        this.ui.showToast("No existe una partida guardada");
        return false;
      }

      this.state.restore(saveData);
      return true;
    } catch (error) {
      console.error(error);
      this.ui.showToast("No se pudo cargar la partida", 3000);
      return false;
    }
  }

  /*
   * Reconcilia el audio con el estado restaurado tras una carga exitosa
   * dentro del mundo. Comparte exactamente la misma lógica de tres casos
   * excluyentes que enter() -- ver syncMusicToFlags() -- para que el
   * resultado de cargar una partida nunca dependa de si la carga ocurrió
   * al entrar en el mundo o durante una partida ya en curso.
   */
  reconcileAudioAfterLoad() {
    this.syncMusicToFlags();
  }

  /*
   * Única autoridad de qué música principal debe sonar, según los flags
   * narrativos ya persistidos en el estado, con tres casos excluyentes:
   * (1) epílogo completado: silencio total, deteniendo explícitamente
   * cualquier música que pudiera seguir sonando de un estado anterior de
   * esta misma instancia de escena (por ejemplo, el opening de una
   * partida nueva iniciada antes de cargar una partida ya terminada);
   * (2) diálogo con el padre de la novia ya completado sin el epílogo
   * completado: ambiental en loop; (3) ningún hito narrativo alcanzado
   * todavía (partida nueva o muy temprana): opening en loop. Se usa tanto
   * desde enter() como desde reconcileAudioAfterLoad().
   *
   * TitleScene también dispara el opening de forma optimista antes de
   * cambiar a esta escena (ver el comentario de update() en
   * TitleScene.js), pero esta función sigue siendo la única fuente de
   * verdad: se ejecuta en el mismo tick síncrono y siempre corrige o
   * confirma lo que corresponde según los flags. El disparo optimista de
   * TitleScene nunca puede dejar sonando algo incorrecto, y cuando ya
   * dejó activa la pista correcta, la llamada a playMusic() de aquí es un
   * no-op (AudioService.playMusic() no reinicia una pista ya activa).
   */
  syncMusicToFlags() {
    if (this.state.flags.epilogueCompleted) {
      this.audio.stopMusic();
      return;
    }

    if (this.state.flags.brideNoteReceived) {
      this.audio.playMusic(AMBIENT_THEME_PATH, { loop: true });
      return;
    }

    this.audio.playMusic(OPENING_THEME_PATH, { loop: true });
  }

  syncPlayerState() {
    if (!this.player) {
      return;
    }

    this.state.scene = "world";
    this.state.setPlayerState({
      x: this.player.x,
      y: this.player.y,
      facing: this.player.facing,
    });
  }

  render(context) {
    const map =
      this.map.id === "axiom-plaza" &&
      this.state.flags.giftCodeSolved &&
      this.map.dawnPalette
        ? { ...this.map, palette: this.map.dawnPalette }
        : this.map;

    renderGround(context, this.camera, map);
    renderBackgroundDecorations(context, this.camera, map);
    renderSolidTiles(context, this.camera, map);
    renderForegroundDecorations(context, this.camera, map);
    renderObjects(context, this.camera, map.objects, this.state);
    this.maxCompanion?.render(context, this.camera);
    this.player.render(context, this.camera);
    renderHud(context, map, this.state.objectiveId);
  }
}

/*
 * Recolocación segura del spawn de Max (no pathfinding, no búsqueda global):
 * prueba, en orden, cada uno de los 13 candidatos locales de
 * computeMaxSpawnCandidates() -- tres anillos fijos alrededor de Gonzalo más
 * su posición exacta, ver el comentario de esa función en MaxCompanion.js --
 * contra el CollisionMap real del mapa actual, usando el tamaño real de Max
 * (MAX_DIMENSIONS), y devuelve el primero que no colisione con un tile
 * sólido (muro, o escenografía sólida como la fuente o las mesas, que ya se
 * representan como región sólida en worldMaps.js).
 *
 * Si ninguno de los 13 candidatos locales es válido, se intenta como último
 * recurso `previousMaxPosition` -- la posición donde ya estaba Max antes de
 * esta reconstrucción, si WorldScene.setupCurrentMap() la pasó porque ya
 * existía una instancia previa (por ejemplo, al volver de un puzle sin
 * cambiar de mapa) -- validándola exactamente igual contra el CollisionMap
 * actual, nunca asumiéndola válida por haberlo sido antes ni por venir de
 * otro mapa.
 *
 * Si tampoco eso funciona (o no hay `previousMaxPosition`), esta función
 * devuelve `null` en vez de fabricar una posición que sabe que colisiona:
 * WorldScene.setupCurrentMap() no reconstruye a Max ese ciclo en ese caso,
 * así que nunca queda dibujado dentro de geometría sólida. En la práctica
 * esto es una red de seguridad teórica -- los mapas reales del juego, ya
 * verificados, siempre dejan al menos un candidato libre cerca del
 * jugador -- y solo se ejercita en tests con un CollisionMap sintético
 * diseñado a propósito para bloquear los 13 candidatos y la posición
 * previa (ver "todos los anillos bloqueados" en
 * tests/scenes/WorldScene.test.js).
 *
 * Exportada (a diferencia del resto de funciones auxiliares de este
 * módulo) para poder probarla de forma aislada con un CollisionMap
 * sintético en tests/scenes/WorldScene.test.js, sin depender de las
 * coordenadas reales de ningún mapa de worldMaps.js.
 */
export function resolveMaxSpawnPosition(
  player,
  collisionMap,
  previousMaxPosition = null,
) {
  const isSafe = (position) =>
    !collisionMap.collides(getMaxCollisionBox(position));

  const safeCandidate = computeMaxSpawnCandidates(player).find(isSafe);

  if (safeCandidate) {
    return safeCandidate;
  }

  if (previousMaxPosition && isSafe(previousMaxPosition)) {
    return previousMaxPosition;
  }

  return null;
}

function getMaxCollisionBox(position) {
  return {
    x: position.x - MAX_DIMENSIONS.width / 2,
    y: position.y - MAX_DIMENSIONS.height / 2,
    width: MAX_DIMENSIONS.width,
    height: MAX_DIMENSIONS.height,
  };
}

function findNearbyObject(player, objects, state) {
  const center = player.getCenter();

  return (
    objects.find((object) => {
      if (object.requiresFlag && !state.flags[object.requiresFlag]) {
        return false;
      }

      const objectCenterX = object.x + object.width / 2;
      const objectCenterY = object.y + object.height / 2;

      return (
        Math.hypot(
          center.x - objectCenterX,
          center.y - objectCenterY,
        ) <= object.interactionRadius
      );
    }) ?? null
  );
}

function getInteractionPrompt(object) {
  if (object.type === "npc") {
    return `[E] Hablar con ${object.label}`;
  }

  if (object.type === "exit") {
    return `[E] Ir a ${object.label}`;
  }

  return `[E] Examinar ${object.label}`;
}

/*
 * Tercer tono de suelo, exclusivo de axiom-plaza (§4.A del encargo de
 * "Plaza Visual Polish"): derivado del propio palette del mapa (mezcla de
 * groundA y wallTop) en vez de un color fijo, para que se adapte solo al
 * palette normal y al dawnPalette sin necesidad de una tercera clave nueva
 * en ninguno de los dos (evita romper el test que exige exactamente cinco
 * claves iguales entre palette y dawnPalette). Ningún otro mapa cambia:
 * accentColor es null salvo que map.id === "axiom-plaza".
 */
function renderGround(context, camera, map) {
  context.fillStyle = map.palette.groundA;
  context.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  const accentColor =
    map.id === "axiom-plaza"
      ? mixHexColors(map.palette.groundA, map.palette.wallTop, 0.35)
      : null;

  for (let tileY = 0; tileY < map.height; tileY += 1) {
    for (let tileX = 0; tileX < map.width; tileX += 1) {
      const screenX = Math.floor(
        tileX * map.tileSize - camera.x,
      );
      const screenY = Math.floor(
        tileY * map.tileSize - camera.y,
      );

      if (!isVisible(screenX, screenY, map.tileSize)) {
        continue;
      }

      /*
       * Pequeñas agrupaciones de 2 baldosas contiguas (no puntos sueltos):
       * un tile se acenta si ÉL MISMO es una "semilla" determinista, o si
       * su vecino inmediato a la izquierda lo es -- así cada semilla pinta
       * un par horizontal real (semilla + vecino), en vez de un punto
       * aislado. Se comprueba ANTES que el patrón de tablero de ajedrez
       * (groundA/groundB) y, cuando aplica, lo sustituye por completo --
       * de lo contrario dos tiles contiguos nunca podrían compartir color,
       * porque siempre tienen paridad opuesta en (tileX+tileY). Sigue
       * siendo determinista, nunca aleatorio en tiempo real.
       */
      const isAccentSeed = (tx, ty) => (tx * 5 + ty * 3) % 9 === 0;

      if (
        accentColor &&
        (isAccentSeed(tileX, tileY) || isAccentSeed(tileX - 1, tileY))
      ) {
        context.fillStyle = accentColor;
        context.fillRect(
          screenX,
          screenY,
          map.tileSize,
          map.tileSize,
        );
        continue;
      }

      if ((tileX + tileY) % 2 === 0) {
        context.fillStyle = map.palette.groundB;
        context.fillRect(
          screenX,
          screenY,
          map.tileSize,
          map.tileSize,
        );
      }
    }
  }
}

function mixHexColors(colorA, colorB, ratio) {
  const a = parseHexColor(colorA);
  const b = parseHexColor(colorB);
  const mix = (channelA, channelB) =>
    Math.round(channelA + (channelB - channelA) * ratio);

  return `rgb(${mix(a.r, b.r)} ${mix(a.g, b.g)} ${mix(a.b, b.b)})`;
}

function parseHexColor(hex) {
  const value = hex.replace("#", "");

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function renderSolidTiles(context, camera, map) {
  for (const index of map.solidTiles) {
    const tileX = index % map.width;
    const tileY = Math.floor(index / map.width);
    const screenX = Math.floor(
      tileX * map.tileSize - camera.x,
    );
    const screenY = Math.floor(
      tileY * map.tileSize - camera.y,
    );

    if (!isVisible(screenX, screenY, map.tileSize)) {
      continue;
    }

    context.fillStyle = map.palette.wall;
    context.fillRect(
      screenX,
      screenY,
      map.tileSize,
      map.tileSize,
    );

    context.fillStyle = map.palette.wallTop;
    context.fillRect(screenX, screenY, map.tileSize, 4);
  }
}

function renderBackgroundDecorations(context, camera, map) {
  for (const decoration of map.decorations) {
    if (decoration.type !== "river") {
      continue;
    }

    const x = Math.round(decoration.x - camera.x);
    const y = Math.round(decoration.y - camera.y);

    context.fillStyle = map.palette.water;
    context.fillRect(
      x,
      y,
      decoration.width,
      decoration.height,
    );

    context.fillStyle = "rgb(255 255 255 / 18%)";

    for (let lineY = y + 8; lineY < y + decoration.height; lineY += 18) {
      context.fillRect(x + 8, lineY, decoration.width - 16, 2);
    }
  }
}

function renderForegroundDecorations(context, camera, map) {
  for (const decoration of map.decorations) {
    if (decoration.type === "river") {
      continue;
    }

    const x = Math.round(decoration.x - camera.x);
    const y = Math.round(decoration.y - camera.y);

    if (
      x + decoration.width < 0 ||
      y + decoration.height < 0 ||
      x > VIEWPORT_WIDTH ||
      y > VIEWPORT_HEIGHT
    ) {
      continue;
    }

    if (decoration.type === "altar") {
      drawWeddingArch(context, x, y);
      continue;
    }

    if (decoration.type === "fountain") {
      drawFountain(context, x, y, map.palette.water);
      continue;
    }

    // "tables" (mesas rectangulares de banquete): sigue usándose tal cual
    // en library/archive -- NO tocar esta rama para no afectar esos dos
    // mapas, fuera de alcance de esta tarea (solo axiom-plaza).
    if (decoration.type === "tables") {
      context.fillStyle = "#7c5134";

      for (
        let tableX = x;
        tableX < x + decoration.width;
        tableX += 48
      ) {
        context.fillRect(tableX, y + 8, 38, 22);
        context.fillStyle = "#efe2bf";
        context.fillRect(tableX + 3, y + 5, 32, 8);
        context.fillStyle = "#7c5134";
      }
      continue;
    }

    // "wedding-table" (mesas redondas con manteles, centro floral y
    // sillas): tipo exclusivo de axiom-plaza, no comparte rama con
    // "tables" a propósito -- ver el comentario de arriba.
    if (decoration.type === "wedding-table") {
      drawWeddingTable(context, x, y);
      continue;
    }

    if (decoration.type === "planter") {
      drawFlowerPlanter(context, x, y);
      continue;
    }

    if (decoration.type === "bench") {
      drawBench(context, x, y);
      continue;
    }

    if (decoration.type === "lamp-post") {
      drawLampPost(context, x, y);
      continue;
    }

    if (decoration.type === "garland") {
      drawGarland(context, x, y, decoration.width);
      continue;
    }

    if (decoration.type === "market-stall") {
      drawMarketStall(context, x, y);
      continue;
    }

    if (decoration.type === "flower-pot") {
      drawFlowerPot(context, x, y);
      continue;
    }

    if (decoration.type === "bush") {
      drawDecorativeBush(
        context,
        x,
        y,
        decoration.width,
        decoration.height,
      );
      continue;
    }

    if (decoration.type === "petals") {
      drawPetals(context, x, y);
      continue;
    }

    if (decoration.type === "crate") {
      drawWeddingCrate(context, x, y);
      continue;
    }

    if (decoration.type === "fabric-roll") {
      drawFabricRoll(context, x, y);
      continue;
    }

    if (decoration.type === "dock") {
      context.fillStyle = "#765038";

      for (
        let plankX = x;
        plankX < x + decoration.width;
        plankX += 12
      ) {
        context.fillRect(
          plankX,
          y,
          10,
          decoration.height,
        );
      }
    }
  }
}

/*
 * Helpers de dibujo visual para la decoración de axiom-plaza (Plaza Visual
 * Polish -- boda en preparación). Todas reciben ya la posición absoluta en
 * pantalla (post-cámara) y dibujan con primitivas de canvas puras, mismo
 * lenguaje visual que el resto del renderer (sin sprites externos, sin
 * dependencias nuevas). Ninguna toca colisión: decoration nunca alimenta
 * solidTiles (ver createMap() en worldMaps.js), así que son puramente
 * cosméticas por construcción.
 *
 * Pasada de fidelidad pixel-art (ronda 4 de Plaza Visual Polish,
 * autorizada explícitamente por el responsable del producto): cada prop
 * se rasteriza UNA sola vez en un <canvas> pequeño y descartable, nunca el
 * canvas principal del juego, y se reutiliza con drawImage() en cada
 * frame posterior -- sin PNG externos, sin asset de terceros, sin sistema
 * de tiles genérico ni asset manager: es literalmente un Map de
 * `"tipo:ancho:alto"` a un `HTMLCanvasElement` ya dibujado.
 *
 * getCachedPropSprite() devuelve `null` si `document` no existe (el caso
 * del entorno de test, `node --test`, que no tiene DOM) -- en ese caso el
 * llamador dibuja directamente sobre el `context` real recibido, con
 * exactamente la misma función `drawXSprite()` que se usa para rasterizar
 * el sprite cacheado en el navegador real. La lógica de dibujo nunca se
 * duplica entre ambos caminos: solo cambia si el resultado se guarda en
 * un canvas aparte o se pinta directamente.
 */
const propSpriteCache = new Map();

function getCachedPropSprite(key, width, height, draw) {
  if (typeof document === "undefined") {
    return null;
  }

  const cached = propSpriteCache.get(key);

  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  propSpriteCache.set(key, canvas);
  return canvas;
}

// Dibuja un prop cacheable: si hay DOM disponible, rasteriza (una única
// vez por combinación tipo+tamaño) en un canvas aparte y lo reutiliza con
// drawImage(); si no (tests), llama a `draw` directamente sobre `context`.
function drawCachedProp(context, key, x, y, width, height, draw) {
  const sprite = getCachedPropSprite(key, width, height, draw);

  if (sprite) {
    context.imageSmoothingEnabled = false;
    context.drawImage(sprite, Math.round(x), Math.round(y));
    return;
  }

  draw(context, x, y);
}

/*
 * Spike de estrategia de representación (Plaza Visual Polish -- pixel-art
 * indexado, autorizado explícitamente por el responsable de producto):
 * en vez de componer un prop a partir de decenas de fillRect geométricos,
 * este helper rasteriza pixel a pixel una matriz de caracteres ya
 * diseñada a mano (ver src/content/weddingTablePixelArt.js), donde cada
 * carácter indexa un color de una paleta compacta. Devuelve una función
 * `draw(context, x, y)` con la misma forma que espera `drawCachedProp()`,
 * así que reutiliza tal cual toda la infraestructura de cache ya
 * existente (propSpriteCache/getCachedPropSprite): se rasteriza una única
 * vez por combinación tipo+tamaño, nunca por frame.
 */
function createIndexedPixelSprite({
  width,
  height,
  palette,
  pixels,
  transparent = ".",
}) {
  return (context, x, y) => {
    for (let row = 0; row < height; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < width; col += 1) {
        const symbol = line[col];

        if (symbol === transparent) {
          continue;
        }

        context.fillStyle = palette[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawWeddingTableIndexedSprite = createIndexedPixelSprite({
  width: WEDDING_TABLE_PIXEL_WIDTH,
  height: WEDDING_TABLE_PIXEL_HEIGHT,
  palette: WEDDING_TABLE_PALETTE,
  pixels: WEDDING_TABLE_PIXELS,
  transparent: WEDDING_TABLE_TRANSPARENT,
});

const drawWeddingArchIndexedSprite = createIndexedPixelSprite({
  width: WEDDING_ARCH_PIXEL_WIDTH,
  height: WEDDING_ARCH_PIXEL_HEIGHT,
  palette: WEDDING_ARCH_PALETTE,
  pixels: WEDDING_ARCH_PIXELS,
  transparent: WEDDING_ARCH_TRANSPARENT,
});

function drawWeddingArch(context, x, y) {
  // Prop migrado a pixel-art indexado (mismo patrón que wedding-table,
  // aprobado por el responsable de producto): único tamaño real en
  // axiom-plaza (160x48 nominal), así que el sprite ya incluye su propio
  // margen y se ancla directamente en (x, y).
  drawCachedProp(
    context,
    "wedding-arch-indexed",
    x,
    y,
    WEDDING_ARCH_PIXEL_WIDTH,
    WEDDING_ARCH_PIXEL_HEIGHT,
    drawWeddingArchIndexedSprite,
  );
}

// El agua no tiene un color fijo (cada mapa define su propio
// palette.water/dawnPalette.water, ver fountainPixelArt.js), así que a
// diferencia de los demás props migrados no basta con un único
// createIndexedPixelSprite() construido una vez a nivel de módulo.
// Memoizado por waterColor: sin este Map, drawFountain() construiría un
// objeto de paleta + closure nuevos en CADA frame en que la fuente esté
// visible, aunque drawCachedProp() ya evite volver a rasterizar el
// canvas -- trabajo de asignación innecesario en régimen estable que el
// resto de props migrados no tiene.
const fountainDrawByWaterColor = new Map();

function getFountainIndexedDraw(waterColor) {
  const cached = fountainDrawByWaterColor.get(waterColor);

  if (cached) {
    return cached;
  }

  const draw = createIndexedPixelSprite({
    width: FOUNTAIN_PIXEL_WIDTH,
    height: FOUNTAIN_PIXEL_HEIGHT,
    palette: buildFountainPalette(waterColor),
    pixels: FOUNTAIN_PIXELS,
    transparent: FOUNTAIN_TRANSPARENT,
  });

  fountainDrawByWaterColor.set(waterColor, draw);
  return draw;
}

function drawFountain(context, x, y, waterColor) {
  // Prop migrado a pixel-art indexado: único tamaño real en axiom-plaza
  // (96x80 nominal), el sprite ya incluye su propio margen. La clave de
  // cache de drawCachedProp() también incluye waterColor, para no
  // compartir el canvas rasterizado entre mapas con tonos de agua
  // distintos.
  drawCachedProp(
    context,
    `fountain-indexed:${waterColor}`,
    x,
    y,
    FOUNTAIN_PIXEL_WIDTH,
    FOUNTAIN_PIXEL_HEIGHT,
    getFountainIndexedDraw(waterColor),
  );
}

function drawWeddingTable(context, x, y) {
  /*
   * Spike de pixel-art indexado (Plaza Visual Polish): la mesa ya no se
   * compone con decenas de fillRect geométricos por llamada -- se
   * rasteriza, una única vez por cache, desde una matriz de pixel-art
   * diseñada a mano (src/content/weddingTablePixelArt.js, 40x40). El
   * diseño ya contiene todo su contenido real dentro de [0, 40) en ambos
   * ejes (silueta, sillas, sombra de contacto), así que se ancla
   * directamente en (x, y) sin margen adicional -- a diferencia del resto
   * de props geométricos de esta misma sección, que sí necesitan
   * desplazar el ancla porque sus fillRect se salen del bounding box
   * nominal.
   */
  drawCachedProp(
    context,
    "wedding-table-indexed",
    x,
    y,
    WEDDING_TABLE_PIXEL_WIDTH,
    WEDDING_TABLE_PIXEL_HEIGHT,
    drawWeddingTableIndexedSprite,
  );
}

const drawFlowerPlanterIndexedSprite = createIndexedPixelSprite({
  width: FLOWER_PLANTER_PIXEL_WIDTH,
  height: FLOWER_PLANTER_PIXEL_HEIGHT,
  palette: FLOWER_PLANTER_PALETTE,
  pixels: FLOWER_PLANTER_PIXELS,
  transparent: FLOWER_PLANTER_TRANSPARENT,
});

function drawFlowerPlanter(context, x, y) {
  // Prop migrado a pixel-art indexado: único tamaño real en axiom-plaza
  // (24x24 nominal), el sprite ya incluye su propio margen de sombra.
  drawCachedProp(
    context,
    "flower-planter-indexed",
    x,
    y,
    FLOWER_PLANTER_PIXEL_WIDTH,
    FLOWER_PLANTER_PIXEL_HEIGHT,
    drawFlowerPlanterIndexedSprite,
  );
}

const drawFlowerPotIndexedSprite = createIndexedPixelSprite({
  width: FLOWER_POT_PIXEL_WIDTH,
  height: FLOWER_POT_PIXEL_HEIGHT,
  palette: FLOWER_POT_PALETTE,
  pixels: FLOWER_POT_PIXELS,
  transparent: FLOWER_POT_TRANSPARENT,
});

function drawFlowerPot(context, x, y) {
  drawCachedProp(
    context,
    "flower-pot-indexed",
    x,
    y,
    FLOWER_POT_PIXEL_WIDTH,
    FLOWER_POT_PIXEL_HEIGHT,
    drawFlowerPotIndexedSprite,
  );
}

const drawBushRoundFountainIndexedSprite = createIndexedPixelSprite({
  width: BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH,
  height: BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT,
  palette: BUSH_PALETTE,
  pixels: BUSH_ROUND_FOUNTAIN_PIXELS,
  transparent: BUSH_TRANSPARENT,
});

const drawBushRoundCornerIndexedSprite = createIndexedPixelSprite({
  width: BUSH_ROUND_CORNER_PIXEL_WIDTH,
  height: BUSH_ROUND_CORNER_PIXEL_HEIGHT,
  palette: BUSH_PALETTE,
  pixels: BUSH_ROUND_CORNER_PIXELS,
  transparent: BUSH_TRANSPARENT,
});

const drawCypressIndexedSprite = createIndexedPixelSprite({
  width: CYPRESS_PIXEL_WIDTH,
  height: CYPRESS_PIXEL_HEIGHT,
  palette: BUSH_PALETTE,
  pixels: CYPRESS_PIXELS,
  transparent: BUSH_TRANSPARENT,
});

// axiom-plaza usa el tipo "bush" en tres tamaños reales fijos (ver
// worldMaps.js): 20x24 junto a la fuente, 20x20 en las cuatro esquinas, y
// 14x34 para los "cipreses" (misma decoración, proporciones altas y
// estrechas). Cada uno migra a su propia matriz de pixel-art ya
// diseñada (bushPixelArt.js) en vez de generarse proporcionalmente.
//
// Riesgo conocido, no aplicable a los datos actuales: a diferencia de la
// versión geométrica anterior (que generaba el arbusto proporcionalmente
// a cualquier width/height reales), esta función solo reconoce estas 3
// combinaciones exactas -- cualquier otra cae en silencio en la rama por
// defecto (esquina) con la forma/proporción incorrecta, sin ningún aviso.
// Si se añade en el futuro una decoración "bush" con un tamaño nuevo,
// hace falta diseñar y añadir su propia matriz en bushPixelArt.js y su
// propia rama aquí -- no asumir que el tamaño por defecto sirve para
// cualquier caso.
function drawDecorativeBush(context, x, y, width, height) {
  if (width === BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH && height === BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT - 3) {
    drawCachedProp(
      context,
      "bush-round-fountain-indexed",
      x,
      y,
      BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH,
      BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT,
      drawBushRoundFountainIndexedSprite,
    );
    return;
  }

  if (width === CYPRESS_PIXEL_WIDTH && height === CYPRESS_PIXEL_HEIGHT - 3) {
    drawCachedProp(
      context,
      "cypress-indexed",
      x,
      y,
      CYPRESS_PIXEL_WIDTH,
      CYPRESS_PIXEL_HEIGHT,
      drawCypressIndexedSprite,
    );
    return;
  }

  // 20x20 (esquinas): variante por defecto.
  drawCachedProp(
    context,
    "bush-round-corner-indexed",
    x,
    y,
    BUSH_ROUND_CORNER_PIXEL_WIDTH,
    BUSH_ROUND_CORNER_PIXEL_HEIGHT,
    drawBushRoundCornerIndexedSprite,
  );
}

// Pétalos sueltos sobre el suelo: prop pequeño (10x9, 3 fillRect) cuya
// representación actual ya es simple/plana y legible -- no se migra a
// pixel-art indexado en esta ronda (ver CLAUDE.md/tarea: garland/petals
// pueden mantenerse como primitivas si no aportan mejora visual real).
function drawPetals(context, x, y) {
  drawCachedProp(context, "petals", x, y, 10, 9, drawPetalsSprite);
}

function drawPetalsSprite(context, x, y) {
  context.fillStyle = "#e8b7c8";
  context.fillRect(x, y, 3, 3);
  context.fillRect(x + 7, y + 4, 3, 3);
  context.fillStyle = "#d99cb2";
  context.fillRect(x + 1, y + 1, 1, 1);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 3, y + 6, 3, 3);
}

const drawWeddingCrateIndexedSprite = createIndexedPixelSprite({
  width: WEDDING_CRATE_PIXEL_WIDTH,
  height: WEDDING_CRATE_PIXEL_HEIGHT,
  palette: WEDDING_CRATE_PALETTE,
  pixels: WEDDING_CRATE_PIXELS,
  transparent: WEDDING_CRATE_TRANSPARENT,
});

function drawWeddingCrate(context, x, y) {
  // Prop migrado a pixel-art indexado: único tamaño real en axiom-plaza
  // (14x15 nominal), el sprite ya incluye su propio margen (flores 1px
  // por encima, sombra de contacto por debajo).
  drawCachedProp(
    context,
    "crate-indexed",
    x,
    y - 1,
    WEDDING_CRATE_PIXEL_WIDTH,
    WEDDING_CRATE_PIXEL_HEIGHT,
    drawWeddingCrateIndexedSprite,
  );
}

const drawBenchIndexedSprite = createIndexedPixelSprite({
  width: BENCH_PIXEL_WIDTH,
  height: BENCH_PIXEL_HEIGHT,
  palette: BENCH_PALETTE,
  pixels: BENCH_PIXELS,
  transparent: BENCH_TRANSPARENT,
});

function drawBench(context, x, y) {
  // Prop migrado a pixel-art indexado: único tamaño real en axiom-plaza
  // (40x16 nominal), el sprite ya incluye su propio margen de sombra.
  drawCachedProp(
    context,
    "bench-indexed",
    x,
    y,
    BENCH_PIXEL_WIDTH,
    BENCH_PIXEL_HEIGHT,
    drawBenchIndexedSprite,
  );
}

const drawLampPostIndexedSprite = createIndexedPixelSprite({
  width: LAMP_POST_PIXEL_WIDTH,
  height: LAMP_POST_PIXEL_HEIGHT,
  palette: LAMP_POST_PALETTE,
  pixels: LAMP_POST_PIXELS,
  transparent: LAMP_POST_TRANSPARENT,
});

function drawLampPost(context, x, y) {
  // Prop migrado a pixel-art indexado: único tamaño real en axiom-plaza
  // (9x40 nominal), el sprite ya incluye su propio margen (halo 2px a la
  // izquierda, remate superior y sombra de contacto).
  drawCachedProp(
    context,
    "lamp-post-indexed",
    x - 2,
    y - 1,
    LAMP_POST_PIXEL_WIDTH,
    LAMP_POST_PIXEL_HEIGHT,
    drawLampPostIndexedSprite,
  );
}

function drawGarland(context, x, y, width) {
  // El bucle de banderines avanza en pasos de 10px (banderín de 6px) y
  // puede sobresalir hasta 5px más allá de "x + width" en la última
  // iteración cuando `width` no es múltiplo de 10 (por ejemplo el garland
  // de 74px del puesto): el sprite cacheado gana margen extra para no
  // recortar el último banderín contra el borde del canvas.
  drawCachedProp(
    context,
    `garland:${width}`,
    x,
    y - 1,
    width + 10,
    6,
    (spriteContext, sx, sy) =>
      drawGarlandSprite(spriteContext, sx, sy + 1, width),
  );
}

function drawGarlandSprite(context, x, y, width) {
  context.fillStyle = "#7c5134";
  context.fillRect(x, y - 1, width, 1);

  const flagColors = ["#e8b7c8", "#d6b65f", "#f5ece0"];
  let flagIndex = 0;

  for (let flagX = x; flagX < x + width; flagX += 10) {
    context.fillStyle = flagColors[flagIndex % flagColors.length];
    context.fillRect(flagX, y, 6, 5);
    context.fillStyle = "rgb(0 0 0 / 12%)";
    context.fillRect(flagX, y + 4, 6, 1);
    context.fillStyle = "rgb(255 255 255 / 35%)";
    context.fillRect(flagX + 2, y + 1, 2, 2);
    flagIndex += 1;
  }
}

const drawMarketStallIndexedSprite = createIndexedPixelSprite({
  width: MARKET_STALL_PIXEL_WIDTH,
  height: MARKET_STALL_PIXEL_HEIGHT,
  palette: MARKET_STALL_PALETTE,
  pixels: MARKET_STALL_PIXELS,
  transparent: MARKET_STALL_TRANSPARENT,
});

function drawMarketStall(context, x, y) {
  // Prop migrado a pixel-art indexado: único tamaño real en axiom-plaza
  // (100x40 nominal), el sprite ya incluye su propio margen (toldo
  // sobresaliendo a los lados, sombra de contacto). El offset horizontal
  // es -4, NO -9 (la mitad simétrica de 18 = 118 - 100): a propósito,
  // porque el margen real de la matriz es asimétrico -- el borde
  // izquierdo del mostrador está a 4px del borde de la matriz, mientras
  // que el toldo y el arreglo floral de la derecha se extienden más lejos
  // hacia ese lado por diseño. No "corregir" esto a -9 pensando que es un
  // valor huérfano: descentraría el mostrador respecto al `x` nominal.
  drawCachedProp(
    context,
    "market-stall-indexed",
    x - 4,
    y,
    MARKET_STALL_PIXEL_WIDTH,
    MARKET_STALL_PIXEL_HEIGHT,
    drawMarketStallIndexedSprite,
  );
}

const drawFabricRollIndexedSprite = createIndexedPixelSprite({
  width: FABRIC_ROLL_PIXEL_WIDTH,
  height: FABRIC_ROLL_PIXEL_HEIGHT,
  palette: FABRIC_ROLL_PALETTE,
  pixels: FABRIC_ROLL_PIXELS,
  transparent: FABRIC_ROLL_TRANSPARENT,
});

// Rollo de tela decorativo -- prop de preparativos todavía sin usar, para
// reforzar que el montaje sigue en marcha. Migrado a pixel-art indexado:
// único tamaño real en axiom-plaza (16x13 nominal).
function drawFabricRoll(context, x, y) {
  drawCachedProp(
    context,
    "fabric-roll-indexed",
    x,
    y,
    FABRIC_ROLL_PIXEL_WIDTH,
    FABRIC_ROLL_PIXEL_HEIGHT,
    drawFabricRollIndexedSprite,
  );
}

function renderObjects(context, camera, objects, state) {
  for (const object of objects) {
    if (object.requiresFlag && !state.flags[object.requiresFlag]) {
      continue;
    }

    const x = Math.round(object.x - camera.x);
    const y = Math.round(object.y - camera.y);

    if (
      x + object.width < 0 ||
      y + object.height < 0 ||
      x > VIEWPORT_WIDTH ||
      y > VIEWPORT_HEIGHT
    ) {
      continue;
    }

    if (object.type === "npc") {
      renderNpc(context, x, y, object);
      continue;
    }

    if (object.type === "puzzle") {
      context.fillStyle = "#4d3628";
      context.fillRect(x + 8, y + 10, 4, object.height);
      context.fillStyle = "#71d5c6";
      context.fillRect(x, y, object.width, 12);
      context.fillStyle = "#332c36";
      context.fillRect(x + 3, y + 3, object.width - 6, 2);
      context.fillRect(x + 3, y + 7, object.width - 9, 2);
      continue;
    }

    // "sign" hoy solo es el tablón de preparativos (único objeto de este
    // tipo en todo el juego): marco de madera y una esquina prendida, para
    // que se lea como un tablón/cartel real -- misma interacción exacta.
    if (object.type === "sign") {
      context.fillStyle = "#4d3628";
      context.fillRect(x + 8, y + 10, 4, object.height);
      context.fillStyle = "#7c5134";
      context.fillRect(x - 2, y - 2, object.width + 4, 16);
      context.fillStyle = "#d6b65f";
      context.fillRect(x, y, object.width, 12);
      context.fillStyle = "#332c36";
      context.fillRect(x + 3, y + 3, object.width - 6, 2);
      context.fillRect(x + 3, y + 7, object.width - 9, 2);
      context.fillStyle = "#e8b7c8";
      context.fillRect(x + object.width - 6, y - 1, 4, 4);
      continue;
    }

    if (object.type === "table") {
      context.fillStyle = "#553b2d";
      context.fillRect(x, y + 4, object.width, object.height - 4);
      context.fillStyle = "#d6b65f";
      context.fillRect(x + 3, y, object.width - 6, 6);
      continue;
    }

    if (object.type === "exit") {
      context.fillStyle = "#efe2bf";
      context.fillRect(x, y, object.width, object.height);
      context.fillStyle = "#71d5c6";
      context.fillRect(
        x + 4,
        y + 6,
        object.width - 8,
        object.height - 12,
      );
      continue;
    }

    if (object.type === "blocked-exit") {
      context.fillStyle = "#5d5051";
      context.fillRect(x, y, object.width, object.height);
      context.fillStyle = "#b58a70";
      context.fillRect(x + 3, y + 3, object.width - 6, 4);
      continue;
    }

    if (object.type === "evidence") {
      context.fillStyle =
        state.puzzles.p2.phase === P2_PHASE.SOLVED
          ? "#f2d16b"
          : "#6f776d";
      context.fillRect(x, y, object.width, object.height);
      context.fillStyle = "#332c36";
      context.fillRect(x + 4, y + 4, object.width - 8, 2);
      context.fillRect(x + 4, y + 9, object.width - 10, 2);
    }
  }
}

function renderNpc(context, x, y, object) {
  if (object.id === "bride-epilogue") {
    renderElena(context, x, y);
    return;
  }

  if (object.id === "mayor-corolaria") {
    renderCorolaria(context, x, y);
    return;
  }

  if (object.id === "bride-father") {
    renderBrideFather(context, x, y);
    return;
  }

  if (object.id === "library-silogio") {
    renderSilogio(context, x, y);
    return;
  }

  const palette = NAMED_NPC_PALETTES[object.id] ?? DEFAULT_NPC_PALETTE;

  context.fillStyle = NPC_SILHOUETTE;
  context.fillRect(x + 1, y + 5, 12, 14);

  context.fillStyle = NPC_HEAD;
  context.fillRect(x + 3, y, 8, 7);

  context.fillStyle = palette.body;
  context.fillRect(x + 2, y + 7, 10, 11);

  context.fillStyle = palette.accent;
  context.fillRect(x + 5, y + 8, 4, 4);
}

function renderElena(context, x, y) {
  context.fillStyle = BRIDE_PALETTE.silhouette;
  context.fillRect(x + 2, y, 10, 3);
  context.fillRect(x + 1, y + 3, 12, 17);

  context.fillStyle = BRIDE_PALETTE.hair;
  context.fillRect(x + 3, y + 1, 8, 2);

  context.fillStyle = BRIDE_PALETTE.head;
  context.fillRect(x + 3, y + 3, 8, 6);

  context.fillStyle = BRIDE_PALETTE.hair;
  context.fillRect(x + 1, y + 3, 2, 14);
  context.fillRect(x + 11, y + 3, 2, 14);

  context.fillStyle = BRIDE_PALETTE.head;
  context.fillRect(x + 1, y + 10, 2, 6);
  context.fillRect(x + 11, y + 10, 2, 6);

  context.fillStyle = BRIDE_PALETTE.body;
  context.fillRect(x + 3, y + 10, 8, 6);

  context.fillStyle = BRIDE_PALETTE.bodyAccent;
  context.fillRect(x + 2, y + 16, 10, 4);
}

function renderCorolaria(context, x, y) {
  context.fillStyle = MAYOR_PALETTE.silhouette;
  context.fillRect(x + 2, y + 5, 9, 2);
  context.fillRect(x + 0, y + 6, 13, 7);
  context.fillRect(x + 1, y + 12, 11, 8);

  context.fillStyle = MAYOR_PALETTE.hair;
  context.fillRect(x + 3, y + 0, 7, 2);

  context.fillStyle = MAYOR_PALETTE.head;
  context.fillRect(x + 3, y + 2, 7, 5);

  context.fillStyle = MAYOR_PALETTE.head;
  context.fillRect(x + 0, y + 7, 2, 6);
  context.fillRect(x + 11, y + 7, 2, 6);

  context.fillStyle = MAYOR_PALETTE.body;
  context.fillRect(x + 2, y + 7, 9, 6);

  context.fillStyle = MAYOR_PALETTE.bodyAccent;
  context.fillRect(x + 2, y + 13, 9, 6);
  context.fillRect(x + 6, y + 7, 2, 2);
}

function renderBrideFather(context, x, y) {
  context.fillStyle = BRIDE_FATHER_PALETTE.silhouette;
  context.fillRect(x + 3, y + 0, 10, 3);
  context.fillRect(x + 3, y + 3, 10, 7);
  context.fillRect(x + 1, y + 10, 14, 6);
  context.fillRect(x + 4, y + 16, 8, 6);

  context.fillStyle = BRIDE_FATHER_PALETTE.hair;
  context.fillRect(x + 4, y + 1, 8, 2);

  context.fillStyle = BRIDE_FATHER_PALETTE.head;
  context.fillRect(x + 4, y + 3, 8, 7);

  context.fillStyle = BRIDE_FATHER_PALETTE.head;
  context.fillRect(x + 1, y + 10, 2, 6);
  context.fillRect(x + 13, y + 10, 2, 6);

  context.fillStyle = BRIDE_FATHER_PALETTE.body;
  context.fillRect(x + 3, y + 10, 10, 6);

  context.fillStyle = BRIDE_FATHER_PALETTE.bodyAccent;
  context.fillRect(x + 5, y + 17, 2, 5);
  context.fillRect(x + 9, y + 17, 2, 5);
}

function renderSilogio(context, x, y) {
  context.fillStyle = SILOGIO_PALETTE.silhouette;
  context.fillRect(x + 4, y + 0, 5, 3);
  context.fillRect(x + 2, y + 3, 9, 9);
  context.fillRect(x + 0, y + 12, 12, 10);

  context.fillStyle = SILOGIO_PALETTE.hair;
  context.fillRect(x + 5, y + 0, 4, 2);

  context.fillStyle = SILOGIO_PALETTE.head;
  context.fillRect(x + 3, y + 2, 6, 5);

  context.fillStyle = SILOGIO_PALETTE.head;
  context.fillRect(x + 1, y + 7, 1, 7);
  context.fillRect(x + 10, y + 7, 1, 7);

  context.fillStyle = SILOGIO_PALETTE.body;
  context.fillRect(x + 3, y + 7, 6, 6);

  context.fillStyle = SILOGIO_PALETTE.bodyAccent;
  context.fillRect(x + 3, y + 13, 6, 4);
  context.fillRect(x + 5, y + 8, 2, 2);
}

function renderHud(context, map, objectiveId) {
  context.fillStyle = "rgb(16 16 26 / 78%)";
  context.fillRect(0, 242, VIEWPORT_WIDTH, 28);

  context.fillStyle = "#efe2bf";
  context.font = "bold 8px monospace";
  context.fillText(map.name, 8, 253);

  context.fillStyle = "#fff7df";
  context.font = "8px monospace";
  context.fillText(
    `Objetivo: ${OBJECTIVE_LABELS[objectiveId] ?? objectiveId}`,
    8,
    264,
  );
}

function isVisible(screenX, screenY, size) {
  return !(
    screenX + size < 0 ||
    screenY + size < 0 ||
    screenX > VIEWPORT_WIDTH ||
    screenY > VIEWPORT_HEIGHT
  );
}
