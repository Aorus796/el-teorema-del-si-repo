import { AMBIENT_THEME_PATH } from "../content/ambientAudioConfig.js";
import { OPENING_THEME_PATH } from "../content/introAudioConfig.js";
import { INTERACT_SFX_PATH } from "../content/sfxAudioConfig.js";
import { getWorldMap } from "../content/worldMaps.js";
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
      drawWeddingArch(
        context,
        x,
        y,
        decoration.width,
        decoration.height,
      );
      continue;
    }

    if (decoration.type === "fountain") {
      drawFountain(
        context,
        x,
        y,
        decoration.width,
        decoration.height,
        map.palette.water,
      );
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
      drawFlowerPlanter(
        context,
        x,
        y,
        decoration.width,
        decoration.height,
      );
      continue;
    }

    if (decoration.type === "bench") {
      drawBench(context, x, y, decoration.width);
      continue;
    }

    if (decoration.type === "lamp-post") {
      drawLampPost(context, x, y, decoration.height);
      continue;
    }

    if (decoration.type === "garland") {
      drawGarland(context, x, y, decoration.width);
      continue;
    }

    if (decoration.type === "market-stall") {
      drawMarketStall(
        context,
        x,
        y,
        decoration.width,
        decoration.height,
      );
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
 */
function drawWeddingArch(context, x, y, width, height) {
  // sombra bajo la plataforma, para que se lea con más profundidad.
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x + 5, y + height, width - 10, 4);

  // plataforma/escalón visual, más ancho que la alfombra central, para
  // que se lea como el sitio exacto donde se celebrará la ceremonia.
  context.fillStyle = "#d8c8a4";
  context.fillRect(x + 6, y + height - 14, width - 12, 14);
  context.fillStyle = "#c9b78e";
  context.fillRect(x + 6, y + height - 14, width - 12, 3);

  context.fillStyle = "#7c5134";
  context.fillRect(x + 6, y + 4, 10, height - 8);
  context.fillRect(x + width - 16, y + 4, 10, height - 8);

  context.fillStyle = "#d6b65f";
  context.fillRect(x + 12, y, width - 24, 10);

  context.fillStyle = "#efe2bf";
  context.fillRect(x + width / 2 - 14, y + 8, 28, 22);

  // flores densas en la parte superior, con follaje verde detrás de las
  // flores rosas y un acento blanco.
  context.fillStyle = "#7fa860";
  context.fillRect(x + 12, y, 8, 6);
  context.fillRect(x + width - 20, y, 8, 6);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 16, y + 2, 10, 10);
  context.fillRect(x + width - 26, y + 2, 10, 10);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 21, y + 5, 4, 4);
  context.fillRect(x + width - 31, y + 5, 4, 4);

  // flores laterales a media altura de cada poste, además de las
  // superiores -- el arco debe leerse florido de arriba abajo, no solo en
  // la cresta.
  context.fillStyle = "#7fa860";
  context.fillRect(x + 4, y + height / 2 - 6, 7, 12);
  context.fillRect(x + width - 11, y + height / 2 - 6, 7, 12);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 5, y + height / 2 - 4, 5, 5);
  context.fillRect(x + width - 10, y + height / 2 - 4, 5, 5);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 5, y + height / 2 + 3, 5, 4);
  context.fillRect(x + width - 10, y + height / 2 + 3, 5, 4);

  // pequeños bouquets atados a la base de cada poste.
  context.fillStyle = "#7fa860";
  context.fillRect(x + 3, y + height - 18, 8, 5);
  context.fillRect(x + width - 11, y + height - 18, 8, 5);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 4, y + height - 22, 6, 6);
  context.fillRect(x + width - 10, y + height - 22, 6, 6);

  // alfombra corta / pasillo, con pétalos, en la franja transitable frente
  // al arco (fuera del solidRegion, que solo cubre la mitad superior).
  context.fillStyle = "#c9536a";
  context.fillRect(x + width / 2 - 11, y + height - 10, 22, 10);
  context.fillStyle = "#d6b65f";
  context.fillRect(x + width / 2 - 10, y + height - 10, 20, 10);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + width / 2 - 17, y + height - 6, 3, 3);
  context.fillRect(x + width / 2 + 14, y + height - 6, 3, 3);
  context.fillRect(x + width / 2 - 4, y + height - 4, 3, 3);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + width / 2 + 6, y + height - 5, 3, 3);
  context.fillRect(x + width / 2 - 20, y + height - 3, 3, 3);
}

function drawFountain(context, x, y, width, height, waterColor) {
  // sombra de contacto con el suelo, para más profundidad del borde.
  context.fillStyle = "rgb(0 0 0 / 12%)";
  context.fillRect(x + 2, y + height + 1, width - 4, 3);

  // borde exterior de piedra (más oscuro en el filo, para dar contraste
  // de piedra real) y reborde interior más claro.
  context.fillStyle = "#b3a07a";
  context.fillRect(x, y + 22, width, height - 22);
  context.fillStyle = "#c9b78e";
  context.fillRect(x + 2, y + 24, width - 4, height - 26);
  context.fillStyle = "#d8c8a4";
  context.fillRect(x + 4, y + 27, width - 8, height - 31);

  // agua en dos tonos: base y un reflejo superior más claro.
  context.fillStyle = waterColor;
  context.fillRect(x + 10, y + 34, width - 20, height - 44);
  context.fillStyle = "rgb(255 255 255 / 14%)";
  context.fillRect(x + 10, y + 34, width - 20, 5);

  // columna central, con un cuello más oscuro que la separa del agua.
  context.fillStyle = "#efe2bf";
  context.fillRect(x + width / 2 - 7, y, 14, 42);
  context.fillStyle = "#d8c8a4";
  context.fillRect(x + width / 2 - 7, y + 34, 14, 6);

  // salida de agua: boquilla de piedra oscura y un breve chorro visible
  // cayendo hacia la taza. Un tono deliberadamente distinto del
  // palette.wall/dawnPalette.wall de cualquier mapa, para no interferir
  // con los tests que comprueban qué paleta está activa por los colores
  // exactos que aparecen en pantalla.
  context.fillStyle = "#4d4238";
  context.fillRect(x + width / 2 - 3, y + 38, 6, 8);
  context.fillStyle = waterColor;
  context.fillRect(x + width / 2 - 2, y + 44, 4, 6);
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x + width / 2 - 6, y + height - 8, 12, 4);

  // rizos de superficie y un pequeño reflejo, mismo tono translúcido que
  // ya usa el río.
  context.fillStyle = "rgb(255 255 255 / 22%)";
  context.fillRect(x + 16, y + height / 2 - 6, width - 32, 2);
  context.fillRect(x + 20, y + height / 2 + 8, width - 40, 2);
  context.fillStyle = "rgb(255 255 255 / 30%)";
  context.fillRect(x + width - 26, y + 40, 5, 5);
}

function drawWeddingTable(context, x, y) {
  // sombra bajo la mesa.
  context.fillStyle = "rgb(0 0 0 / 16%)";
  context.fillRect(x + 8, y + 40, 32, 5);

  // sillas: asiento y respaldo diferenciados en dos tonos de madera.
  context.fillStyle = "#5a3d2b";
  context.fillRect(x + 16, y - 2, 16, 4);
  context.fillRect(x + 16, y + 40, 16, 4);
  context.fillRect(x - 2, y + 16, 4, 16);
  context.fillRect(x + 40, y + 16, 4, 16);
  context.fillStyle = "#7c5134";
  context.fillRect(x + 17, y + 1, 14, 6);
  context.fillRect(x + 17, y + 35, 14, 6);
  context.fillRect(x + 1, y + 17, 6, 14);
  context.fillRect(x + 35, y + 17, 6, 14);

  // mesa redonda: más capas que un simple rectángulo, para que se lea
  // como un octógono/círculo en vez de una forma geométrica plana.
  context.fillStyle = "#efe2bf";
  context.fillRect(x + 14, y + 8, 20, 2);
  context.fillRect(x + 10, y + 10, 28, 4);
  context.fillRect(x + 8, y + 14, 32, 20);
  context.fillRect(x + 10, y + 34, 28, 4);
  context.fillRect(x + 14, y + 38, 20, 2);

  // caída del mantel, visible bajo el filo.
  context.fillStyle = "#d8c8a4";
  context.fillRect(x + 9, y + 31, 30, 3);

  // lazo rosa a un lado.
  context.fillStyle = "#c9536a";
  context.fillRect(x + 8, y + 17, 3, 8);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 6, y + 18, 3, 2);
  context.fillRect(x + 6, y + 23, 3, 2);

  // centro floral, con follaje y dos colores de flor.
  context.fillStyle = "#7fa860";
  context.fillRect(x + 19, y + 19, 10, 8);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 20, y + 20, 4, 4);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 25, y + 21, 3, 3);
  context.fillStyle = "#d6b65f";
  context.fillRect(x + 22, y + 24, 3, 3);

  // pequeña vela junto al centro floral -- pequeño elemento decorativo
  // adicional pedido para dar más volumen a la mesa.
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 31, y + 20, 3, 6);
  context.fillStyle = "#f7e6a8";
  context.fillRect(x + 32, y + 19, 1, 2);
}

function drawFlowerPlanter(context, x, y, width, height) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x, y + height, width, 3);
  context.fillStyle = "#6d4b37";
  context.fillRect(x, y + height - 10, width, 10);
  context.fillStyle = "#553a2a";
  context.fillRect(x, y + height - 10, width, 3);
  context.fillStyle = "#5a7d45";
  context.fillRect(x + 2, y, width - 4, height - 10);
  context.fillStyle = "#7fa860";
  context.fillRect(x + 2, y, width - 4, 4);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 3, y + 1, 3, 3);
  context.fillRect(x + width - 6, y + 1, 3, 3);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + width / 2 - 2, y, 4, 4);
}

// Maceta ornamental pequeña -- variante redondeada de la jardinera
// rectangular, para dar variedad visual sin un helper nuevo pesado.
function drawFlowerPot(context, x, y) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x, y + 15, 12, 2);
  context.fillStyle = "#8a5a3c";
  context.fillRect(x + 2, y + 8, 8, 7);
  context.fillRect(x + 1, y + 7, 10, 2);
  context.fillStyle = "#5a7d45";
  context.fillRect(x + 2, y + 1, 8, 7);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 2, y, 4, 4);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 6, y + 1, 4, 4);
}

// Arbusto/pequeño árbol decorativo -- follaje en dos tonos de verde con
// una pequeña copa más clara arriba.
function drawDecorativeBush(context, x, y, width, height) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x + 1, y + height - 2, width - 2, 3);
  context.fillStyle = "#4d6b3a";
  context.fillRect(x, y + height / 2, width, height / 2);
  context.fillStyle = "#5a7d45";
  context.fillRect(x + 2, y + 2, width - 4, height - 4);
  context.fillStyle = "#7fa860";
  context.fillRect(x + width / 2 - 4, y, 8, 7);
}

// Pétalos sueltos sobre el suelo -- puramente decorativo, sin base ni
// sombra, para marcar que la boda todavía se está preparando.
function drawPetals(context, x, y) {
  context.fillStyle = "#e8b7c8";
  context.fillRect(x, y, 3, 3);
  context.fillRect(x + 7, y + 4, 3, 3);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 3, y + 6, 3, 3);
}

// Caja/cesta de preparativos todavía sin colocar -- transmite que el
// montaje sigue en marcha, no que la plaza ya está lista y vacía.
function drawWeddingCrate(context, x, y) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x, y + 13, 14, 2);
  context.fillStyle = "#8a5a3c";
  context.fillRect(x, y + 4, 14, 10);
  context.fillStyle = "#6d4530";
  context.fillRect(x, y + 4, 14, 2);
  context.fillRect(x, y + 11, 14, 2);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 2, y, 4, 6);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + 8, y, 4, 6);
}

function drawBench(context, x, y, width) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x, y + 17, width, 3);
  context.fillStyle = "#5a3d2b";
  context.fillRect(x, y, width, 5);
  context.fillRect(x + 3, y + 1, width - 6, 2);
  context.fillStyle = "#7c5134";
  context.fillRect(x, y + 6, width, 5);
  context.fillRect(x + 2, y + 11, 3, 6);
  context.fillRect(x + width - 5, y + 11, 3, 6);
}

function drawLampPost(context, x, y, height) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x - 1, y + height - 2, 11, 3);
  context.fillStyle = "#3a2c22";
  context.fillRect(x + 1, y + height - 6, 7, 4);
  context.fillStyle = "#4d3628";
  context.fillRect(x + 3, y + 10, 3, height - 16);
  context.fillStyle = "#3a2c22";
  context.fillRect(x - 1, y, 11, 3);
  context.fillStyle = "#d6b65f";
  context.fillRect(x, y + 2, 9, 8);
  context.fillStyle = "rgb(247 230 168 / 35%)";
  context.fillRect(x - 1, y + 3, 11, 7);
  context.fillStyle = "#f7e6a8";
  context.fillRect(x + 2, y + 4, 5, 5);
}

function drawGarland(context, x, y, width) {
  context.fillStyle = "#7c5134";
  context.fillRect(x, y - 1, width, 1);

  const flagColors = ["#e8b7c8", "#d6b65f", "#f5ece0"];
  let flagIndex = 0;

  for (let flagX = x; flagX < x + width; flagX += 10) {
    context.fillStyle = flagColors[flagIndex % flagColors.length];
    context.fillRect(flagX, y, 6, 5);
    context.fillStyle = "rgb(255 255 255 / 35%)";
    context.fillRect(flagX + 2, y + 1, 2, 2);
    flagIndex += 1;
  }
}

function drawMarketStall(context, x, y, width, height) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x, y + height, width, 3);

  context.fillStyle = "#7c5134";
  context.fillRect(x, y + height - 16, width, 16);
  context.fillStyle = "#6d4530";
  context.fillRect(x, y + height - 16, width, 3);
  context.fillStyle = "#efe2bf";
  context.fillRect(x + 4, y + height - 12, width - 8, 4);

  // toldo en dos paños de color, para que se lea como tienda/carpa en vez
  // de una barra dorada plana, con un ribete de lazo en el borde inferior
  // para integrarlo mejor con el resto de la decoración de boda.
  context.fillStyle = "#d6b65f";
  context.fillRect(x - 4, y, width + 8, 4);
  context.fillStyle = "#c9536a";
  context.fillRect(x - 4, y + 4, (width + 8) / 2, 4);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x - 4 + (width + 8) / 2, y + 4, (width + 8) / 2, 4);
  context.fillStyle = "#f5ece0";
  for (let flagX = x - 4; flagX < x + width + 4; flagX += 8) {
    context.fillRect(flagX, y + 8, 4, 2);
  }

  // objetos sobre el mostrador: cesta con flores a un lado, ramo al otro.
  context.fillStyle = "#8a5a3c";
  context.fillRect(x + 8, y + height - 25, 12, 9);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + 9, y + height - 28, 10, 4);
  context.fillStyle = "#7fa860";
  context.fillRect(x + width - 26, y + height - 22, 14, 6);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x + width - 24, y + height - 25, 4, 4);
  context.fillStyle = "#f5ece0";
  context.fillRect(x + width - 16, y + height - 25, 4, 4);
}

// Rollo de tela decorativo -- prop de preparativos todavía sin usar, para
// reforzar que el montaje sigue en marcha.
function drawFabricRoll(context, x, y) {
  context.fillStyle = "rgb(0 0 0 / 15%)";
  context.fillRect(x, y + 11, 16, 2);
  context.fillStyle = "#e8b7c8";
  context.fillRect(x, y + 2, 16, 9);
  context.fillStyle = "#f5ece0";
  context.fillRect(x, y + 2, 3, 9);
  context.fillRect(x + 13, y + 2, 3, 9);
  context.fillStyle = "#c9536a";
  context.fillRect(x + 6, y, 4, 4);
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
