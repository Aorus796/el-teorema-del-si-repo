import { INTRO_THEME_PATH } from "../content/introAudioConfig.js";

export class TitleScene {
  constructor({ scenes, input, storage, state, ui, audio }) {
    this.scenes = scenes;
    this.input = input;
    this.storage = storage;
    this.state = state;
    this.ui = ui;
    this.audio = audio;
    this.introPlayed = false;
  }

  enter() {
    this.ui.closeAll();
  }

  update() {
    if (this.input.wasPressed("interact")) {
      this.playIntroOnce();
      this.state.reset();
      this.scenes.change("world", { restoreFromState: false });
      return;
    }

    if (this.input.wasPressed("load") && this.storage.hasSave()) {
      this.playIntroOnce();
      this.scenes.change("world", { restoreFromState: true });
    }
  }

  /*
   * Dispara la intro musical la primera vez que se llama; en llamadas
   * posteriores es un no-op. La música ambiental ya no depende de este
   * disparo ni de su duración: arranca por un evento narrativo propio
   * (completar el diálogo con el padre de la novia, ver
   * WorldScene.interactWithBrideFather()), así que AudioService.playMusic()
   * la sustituirá automáticamente si la intro sigue sonando cuando eso
   * ocurra, sin lógica adicional aquí ni en WorldScene.
   */
  playIntroOnce() {
    if (this.introPlayed) {
      return;
    }

    this.introPlayed = true;
    this.audio.playMusic(INTRO_THEME_PATH);
  }

  render(context) {
    context.fillStyle = "#171626";
    context.fillRect(0, 0, 480, 270);

    context.fillStyle = "#efe2bf";
    context.font = "bold 22px monospace";
    context.textAlign = "center";
    context.fillText("EL TEOREMA DEL SI", 240, 70);

    context.fillStyle = "#71d5c6";
    context.font = "11px monospace";
    context.fillText("Vertical slice narrativo", 240, 94);

    context.fillStyle = "#fff7df";
    context.font = "12px monospace";
    context.fillText("E / Enter - Nueva partida", 240, 148);

    context.fillStyle = this.storage.hasSave() ? "#fff7df" : "#716d7a";
    context.fillText("L - Continuar partida", 240, 180);

    context.fillStyle = "#c9bea4";
    context.font = "9px monospace";
    context.fillText(
      "La víspera de la boda en Axioma",
      240,
      230,
    );

    context.textAlign = "left";
  }
}
