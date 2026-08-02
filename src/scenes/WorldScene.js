import { getWorldMap } from "../content/worldMaps.js";
import { P2_PHASE } from "../puzzles/p2-bridges/P2State.js";
import { Camera } from "../world/Camera.js";
import { CollisionMap } from "../world/CollisionMap.js";
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
};

export class WorldScene {
  constructor({ scenes, input, storage, state, ui }) {
    this.scenes = scenes;
    this.input = input;
    this.storage = storage;
    this.state = state;
    this.ui = ui;
    this.map = null;
    this.player = null;
    this.camera = null;
    this.collisionMap = null;
    this.nearbyObject = null;
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
    this.nearbyObject = null;
  }

  update(deltaSeconds) {
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
        this.ui.showToast("Partida cargada");
      }
      return;
    }

    const axis = this.input.getAxis();
    this.player.update(deltaSeconds, axis, this.collisionMap);
    this.camera.follow(this.player);

    this.nearbyObject = findNearbyObject(
      this.player,
      this.map.objects,
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

  interact(object) {
    this.ui.hidePrompt();

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
          "Llegas justo a tiempo.",
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
          "La nota era lo único extraño en su habitación.",
          "No había señales de violencia ni de que hubiera preparado un viaje.",
          "Confío en ti. Encuentra el lugar del que habla.",
        ],
      });
      return;
    }

    this.ui.beginDialogue({
      speaker: "Padre de la novia",
      lines: [
        "Ella no está en su habitación y nadie la ha visto salir esta mañana.",
        "No hay señales de violencia. Solo encontré esta nota sobre la mesa.",
        "«Antes de mañana tengo que comprobar una cosa.»",
        "«Si no he vuelto al anochecer, sigue el camino de los siete puentes.»",
        "«No confíes en el mapa completo: uno de ellos nunca estuvo abierto.»",
      ],
      onComplete: () => {
        this.state.flags.brideNoteReceived = true;
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
    this.ui.showToast(this.map.name);
  }

  interactWithSilogio() {
    this.syncPlayerState();
    this.scenes.change("library-catalogue");
  }

  interactWithArchiveCriteriaTable() {
    this.syncPlayerState();
    this.scenes.change("archive-criteria");
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
          "Fin del vertical slice narrativo.",
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
        "La novia ha marcado que uno de ellos estaba cerrado.",
        "Encuentra un recorrido que cruce todos los demás una sola vez.",
      ],
      onComplete: () => {
        this.syncPlayerState();
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
    renderGround(context, this.camera, this.map);
    renderBackgroundDecorations(context, this.camera, this.map);
    renderSolidTiles(context, this.camera, this.map);
    renderForegroundDecorations(context, this.camera, this.map);
    renderObjects(context, this.camera, this.map.objects, this.state);
    this.player.render(context, this.camera);
    renderHud(context, this.map, this.state.objectiveId);
  }
}

function findNearbyObject(player, objects) {
  const center = player.getCenter();

  return (
    objects.find((object) => {
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

function renderGround(context, camera, map) {
  context.fillStyle = map.palette.groundA;
  context.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  for (let tileY = 0; tileY < map.height; tileY += 1) {
    for (let tileX = 0; tileX < map.width; tileX += 1) {
      if ((tileX + tileY) % 2 !== 0) {
        continue;
      }

      const screenX = Math.floor(
        tileX * map.tileSize - camera.x,
      );
      const screenY = Math.floor(
        tileY * map.tileSize - camera.y,
      );

      if (!isVisible(screenX, screenY, map.tileSize)) {
        continue;
      }

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
      context.fillStyle = "#efe2bf";
      context.fillRect(x, y + 18, decoration.width, 30);
      context.fillStyle = "#d6b65f";
      context.fillRect(x + 12, y, decoration.width - 24, 22);
      context.fillStyle = "#e8b7c8";
      context.fillRect(x + 24, y + 6, 12, 12);
      context.fillRect(
        x + decoration.width - 36,
        y + 6,
        12,
        12,
      );
      continue;
    }

    if (decoration.type === "fountain") {
      context.fillStyle = "#d8c8a4";
      context.fillRect(
        x,
        y + 24,
        decoration.width,
        decoration.height - 24,
      );
      context.fillStyle = map.palette.water;
      context.fillRect(
        x + 10,
        y + 34,
        decoration.width - 20,
        decoration.height - 44,
      );
      context.fillStyle = "#efe2bf";
      context.fillRect(
        x + decoration.width / 2 - 7,
        y,
        14,
        42,
      );
      continue;
    }

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

function renderObjects(context, camera, objects, state) {
  for (const object of objects) {
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

    if (object.type === "sign" || object.type === "puzzle") {
      context.fillStyle = "#4d3628";
      context.fillRect(x + 8, y + 10, 4, object.height);

      context.fillStyle =
        object.type === "puzzle" ? "#71d5c6" : "#d6b65f";
      context.fillRect(x, y, object.width, 12);

      context.fillStyle = "#332c36";
      context.fillRect(x + 3, y + 3, object.width - 6, 2);
      context.fillRect(x + 3, y + 7, object.width - 9, 2);
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
  const palettes = {
    "mayor-corolaria": {
      body: "#8e4566",
      accent: "#d6b65f",
    },
    "bride-father": {
      body: "#486987",
      accent: "#efe2bf",
    },
    "plaza-worker": {
      body: "#6c8756",
      accent: "#d9a06f",
    },
  };

  const palette = palettes[object.id] ?? {
    body: "#6c6387",
    accent: "#efe2bf",
  };

  context.fillStyle = "#302637";
  context.fillRect(x + 1, y + 5, 12, 14);

  context.fillStyle = "#d9a06f";
  context.fillRect(x + 3, y, 8, 7);

  context.fillStyle = palette.body;
  context.fillRect(x + 2, y + 7, 10, 11);

  context.fillStyle = palette.accent;
  context.fillRect(x + 5, y + 8, 4, 4);
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
