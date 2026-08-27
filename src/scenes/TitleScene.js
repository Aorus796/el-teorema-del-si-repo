import { OPENING_THEME_PATH } from "../content/introAudioConfig.js";

export class TitleScene {
  constructor({ scenes, input, storage, state, ui, audio }) {
    this.scenes = scenes;
    this.input = input;
    this.storage = storage;
    this.state = state;
    this.ui = ui;
    this.audio = audio;
  }

  enter() {
    this.ui.closeAll();
  }

  /*
   * TitleScene dispara el opening de forma optimista: al empezar una
   * partida nueva siempre corresponde, y al cargar una partida existente
   * se dispara salvo que un peek del save crudo (savedGameSkipsOpening())
   * indique que ya se superó ese punto de la historia (nota de la novia
   * recibida o epílogo completado). WorldScene.enter()/syncMusicToFlags()
   * sigue siendo la única autoridad final: se ejecuta en el mismo tick
   * síncrono en el que se resuelve scenes.change("world", ...)
   * (SceneManager.change() es síncrono) y corrige o confirma lo que
   * TitleScene disparó. Como AudioService.playMusic() es un no-op cuando
   * el src coincide con la pista ya activa, este diseño nunca produce un
   * segundo play() real ni deja sonando algo incorrecto.
   */
  update() {
    if (this.input.wasPressed("interact")) {
      this.state.reset();
      this.audio.playMusic(OPENING_THEME_PATH, { loop: true });
      this.scenes.change("world", { restoreFromState: false });
      return;
    }

    if (this.input.wasPressed("load") && this.storage.hasSave()) {
      if (!this.savedGameSkipsOpening()) {
        this.audio.playMusic(OPENING_THEME_PATH, { loop: true });
      }
      this.scenes.change("world", { restoreFromState: true });
    }
  }

  savedGameSkipsOpening() {
    try {
      const saveData = this.storage.load();

      return (
        Boolean(saveData?.flags?.brideNoteReceived) ||
        Boolean(saveData?.flags?.epilogueCompleted)
      );
    } catch {
      return false;
    }
  }

  render(context) {
    context.fillStyle = "#171626";
    context.fillRect(0, 0, 480, 270);

    context.fillStyle = "#efe2bf";
    context.font = "bold 22px monospace";
    context.textAlign = "center";
    context.fillText("EL TEOREMA DEL SÍ", 240, 70);

    context.fillStyle = "#71d5c6";
    context.font = "11px monospace";
    context.fillText("Un regalo de boda", 240, 94);

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
