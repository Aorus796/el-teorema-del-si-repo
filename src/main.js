import { Game } from "./core/Game.js";
import { SceneManager } from "./core/SceneManager.js";
import { InputManager } from "./core/InputManager.js";
import { StorageAdapter } from "./platform/StorageAdapter.js";
import { GameState } from "./state/GameState.js";
import { UiController } from "./ui/UiController.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { DevWorldScene } from "./scenes/DevWorldScene.js";
import { P2BridgesScene } from "./scenes/P2BridgesScene.js";

const canvas = document.querySelector("#game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("No se ha encontrado el canvas principal.");
}

const input = new InputManager(window);
const storage = new StorageAdapter(window.localStorage);
const state = new GameState();
const ui = new UiController(document);
const scenes = new SceneManager();

scenes.register(
  "title",
  new TitleScene({ scenes, input, storage, state, ui }),
);

scenes.register(
  "dev-world",
  new DevWorldScene({ scenes, input, storage, state, ui }),
);

scenes.register(
  "p2-bridges",
  new P2BridgesScene({ scenes, input, ui }),
);

const game = new Game({
  canvas,
  input,
  scenes,
});

scenes.change("title");
game.start();

window.addEventListener("beforeunload", () => {
  input.destroy();
});
