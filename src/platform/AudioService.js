import { EPILOGUE_THEME_PATH } from "../content/epilogueAudioConfig.js";

export class AudioService {
  constructor(AudioConstructor) {
    this.AudioConstructor = AudioConstructor;
    this.audioElement = null;
    this.hasStarted = false;
  }

  playEpilogueTheme() {
    if (this.hasStarted) {
      return;
    }

    this.hasStarted = true;

    if (!this.AudioConstructor) {
      return;
    }

    try {
      if (!this.audioElement) {
        this.audioElement = new this.AudioConstructor();
        this.audioElement.src = EPILOGUE_THEME_PATH;
        this.audioElement.loop = false;
        this.audioElement.addEventListener("error", () => {});
      }

      const playResult = this.audioElement.play();

      if (playResult && typeof playResult.then === "function") {
        playResult.catch(() => {});
      }
    } catch {
      // Degradación segura: fallo al construir el elemento, recurso
      // inexistente, o excepción síncrona de play() (incluido el bloqueo
      // de autoplay del navegador, que normalmente se manifiesta como
      // promesa rechazada, ya cubierta arriba).
    }
  }
}
