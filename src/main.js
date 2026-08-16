import { Game } from "./core/Game.js";
import { SceneManager } from "./core/SceneManager.js";
import { InputManager } from "./core/InputManager.js";
import { StorageAdapter } from "./platform/StorageAdapter.js";
import { AudioService } from "./platform/AudioService.js";
import { GameState } from "./state/GameState.js";
import { UiController } from "./ui/UiController.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { WorldScene } from "./scenes/WorldScene.js";
import { P2BridgesScene } from "./scenes/P2BridgesScene.js";
import {
  LibraryCatalogueScene,
} from "./scenes/LibraryCatalogueScene.js";
import {
  ArchiveCriteriaScene,
} from "./scenes/ArchiveCriteriaScene.js";
import {
  EpilogueGiftCodeScene,
} from "./scenes/EpilogueGiftCodeScene.js";
import { CreditsScene } from "./scenes/CreditsScene.js";

const canvas = document.querySelector("#game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("No se ha encontrado el canvas principal.");
}

const input = new InputManager(window);
const storage = new StorageAdapter(window.localStorage);
const state = new GameState();
const ui = new UiController(document);
const audio = new AudioService(window.Audio);
const scenes = new SceneManager();

scenes.register(
  "title",
  new TitleScene({ scenes, input, storage, state, ui, audio }),
);

scenes.register(
  "world",
  new WorldScene({ scenes, input, storage, state, ui, audio }),
);

scenes.register(
  "p2-bridges",
  new P2BridgesScene({ scenes, input, state, ui, audio }),
);

scenes.register(
  "library-catalogue",
  new LibraryCatalogueScene({ scenes, input, state, ui, audio }),
);

scenes.register(
  "archive-criteria",
  new ArchiveCriteriaScene({ scenes, input, state, ui, audio }),
);

scenes.register(
  "epilogue-gift-code",
  new EpilogueGiftCodeScene({ scenes, input, state, ui, audio }),
);

scenes.register(
  "credits",
  new CreditsScene({ input, ui, state, storage, scenes }),
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
