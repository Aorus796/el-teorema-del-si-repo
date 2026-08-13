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
      const introStarted = this.playIntroOnce();
      this.state.reset();
      this.scenes.change("world", {
        restoreFromState: false,
        introStarted,
      });
      return;
    }

    if (this.input.wasPressed("load") && this.storage.hasSave()) {
      const introStarted = this.playIntroOnce();
      this.scenes.change("world", {
        restoreFromState: true,
        introStarted,
      });
    }
  }

  /*
   * Dispara la intro musical la primera vez que se llama y devuelve
   * `true` en ese caso; en llamadas posteriores es un no-op y devuelve
   * `false`. El valor devuelto le permite a WorldScene saber si debe
   * retrasar el arranque de la música ambiental para no cortar la intro
   * a mitad de reproducción (ver WorldScene.enter()).
   */
  playIntroOnce() {
    if (this.introPlayed) {
      return false;
    }

    this.introPlayed = true;
    this.audio.playMusic(INTRO_THEME_PATH);
    return true;
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
