import { DEV_MAP } from "../content/devMap.js";
import { Camera } from "../world/Camera.js";
import { CollisionMap } from "../world/CollisionMap.js";
import { Player } from "../world/Player.js";

const TILE_COLORS = {
  floorA: "#50765f",
  floorB: "#557e65",
  wall: "#6e655a",
  wallTop: "#91836d",
};

export class DevWorldScene {
  constructor({ scenes, input, storage, state, ui }) {
    this.scenes = scenes;
    this.input = input;
    this.storage = storage;
    this.state = state;
    this.ui = ui;
    this.player = null;
    this.camera = null;
    this.collisionMap = null;
    this.nearbyObject = null;
  }

  enter({ restoreFromState = false } = {}) {
    this.ui.closeAll();

    if (restoreFromState) {
      this.load();
    }

    this.collisionMap = new CollisionMap({
      width: DEV_MAP.width,
      height: DEV_MAP.height,
      tileSize: DEV_MAP.tileSize,
      solidTiles: DEV_MAP.solidTiles,
    });

    this.player = new Player(this.state.player);
    this.camera = new Camera({
      viewportWidth: 480,
      viewportHeight: 270,
      worldWidth: DEV_MAP.worldWidth,
      worldHeight: DEV_MAP.worldHeight,
    });
    this.camera.follow(this.player);
  }

  exit() {
    this.syncPlayerState();
    this.ui.closeAll();
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
      this.load();
      this.player.x = this.state.player.x;
      this.player.y = this.state.player.y;
      this.player.facing = this.state.player.facing;
      this.ui.showToast("Partida cargada");
    }

    const axis = this.input.getAxis();
    this.player.update(deltaSeconds, axis, this.collisionMap);
    this.camera.follow(this.player);

    this.nearbyObject = findNearbyObject(this.player, DEV_MAP.objects);
    if (this.nearbyObject) {
      this.ui.showPrompt("[E] Examinar");
      if (this.input.wasPressed("interact")) {
        this.interact(this.nearbyObject);
      }
    } else {
      this.ui.hidePrompt();
    }
  }

  interact(object) {
    if (object.id !== "prototype-sign") {
      return;
    }

    const wasAdded = this.state.unlockPrototypeEntry();
    this.ui.hidePrompt();
    this.ui.beginDialogue({
      speaker: "Cartel provisional",
      lines: [
        "Esta sala no forma parte de Axioma.",
        "Sirve para comprobar que la base tecnica puede sostener el juego.",
        "Si puedes moverte, chocar, leer esto y guardar, el primer hito funciona.",
      ],
      onComplete: () => {
        if (wasAdded) {
          this.ui.showToast("Nueva observacion registrada");
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
    const saveData = this.storage.load();
    if (saveData === null) {
      this.ui.showToast("No existe una partida guardada");
      return;
    }

    this.state.restore(saveData);
  }

  syncPlayerState() {
    if (!this.player) {
      return;
    }

    this.state.scene = "dev-world";
    this.state.player = {
      x: this.player.x,
      y: this.player.y,
      facing: this.player.facing,
    };
  }

  render(context) {
    renderMap(context, this.camera);
    renderObjects(context, this.camera);
    this.player.render(context, this.camera);

    context.fillStyle = "rgb(16 16 26 / 60%)";
    context.fillRect(0, 248, 480, 22);
    context.fillStyle = "#fff7df";
    context.font = "9px monospace";
    context.fillText(
      `x:${Math.round(this.player.x)} y:${Math.round(this.player.y)}`,
      8,
      263,
    );
  }
}

function findNearbyObject(player, objects) {
  const center = player.getCenter();

  return (
    objects.find((object) => {
      const objectCenterX = object.x + object.width / 2;
      const objectCenterY = object.y + object.height / 2;
      return (
        Math.hypot(center.x - objectCenterX, center.y - objectCenterY) <=
        object.interactionRadius
      );
    }) ?? null
  );
}

function renderMap(context, camera) {
  context.fillStyle = TILE_COLORS.floorA;
  context.fillRect(0, 0, 480, 270);

  for (let tileY = 0; tileY < DEV_MAP.height; tileY += 1) {
    for (let tileX = 0; tileX < DEV_MAP.width; tileX += 1) {
      const worldX = tileX * DEV_MAP.tileSize;
      const worldY = tileY * DEV_MAP.tileSize;
      const screenX = Math.floor(worldX - camera.x);
      const screenY = Math.floor(worldY - camera.y);

      if (
        screenX + DEV_MAP.tileSize < 0 ||
        screenY + DEV_MAP.tileSize < 0 ||
        screenX > 480 ||
        screenY > 270
      ) {
        continue;
      }

      const index = tileY * DEV_MAP.width + tileX;
      if (DEV_MAP.solidTiles.includes(index)) {
        context.fillStyle = TILE_COLORS.wall;
        context.fillRect(
          screenX,
          screenY,
          DEV_MAP.tileSize,
          DEV_MAP.tileSize,
        );
        context.fillStyle = TILE_COLORS.wallTop;
        context.fillRect(screenX, screenY, DEV_MAP.tileSize, 4);
      } else if ((tileX + tileY) % 2 === 0) {
        context.fillStyle = TILE_COLORS.floorB;
        context.fillRect(
          screenX,
          screenY,
          DEV_MAP.tileSize,
          DEV_MAP.tileSize,
        );
      }
    }
  }
}

function renderObjects(context, camera) {
  for (const object of DEV_MAP.objects) {
    const x = Math.round(object.x - camera.x);
    const y = Math.round(object.y - camera.y);

    context.fillStyle = "#4d3628";
    context.fillRect(x + 7, y + 10, 4, 14);

    context.fillStyle = "#d6b65f";
    context.fillRect(x, y, object.width, 12);

    context.fillStyle = "#332c36";
    context.fillRect(x + 3, y + 3, object.width - 6, 2);
    context.fillRect(x + 3, y + 7, object.width - 9, 2);
  }
}
