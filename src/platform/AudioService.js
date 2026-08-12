import { EPILOGUE_THEME_PATH } from "../content/epilogueAudioConfig.js";

/*
 * Infraestructura mínima de audio para v1.1: como máximo una pista
 * musical principal activa a la vez (playMusic/stopMusic), y efectos
 * cortos independientes de esa música (playSfx). playEpilogueTheme()
 * conserva exactamente el contrato ya existente y usado por
 * WorldScene.completeBrideDialogue(), implementado ahora sobre
 * playMusic() en vez de tener su propia lógica duplicada.
 *
 * Esta clase no decide todavía cuándo suena la intro, la música
 * ambiental ni ningún SFX real -- eso corresponde a tareas futuras que
 * consumirán esta misma API sin necesitar otro refactor estructural.
 */
export class AudioService {
  constructor(AudioConstructor) {
    this.AudioConstructor = AudioConstructor;
    this.activeMusic = null;
    this.activeMusicSrc = null;
  }

  /*
   * Reproduce `src` como la única música principal activa. Si `src` ya
   * es la música activa (con reproducción en curso), es un no-op. Si
   * había otra música activa, se detiene primero mediante stopMusic().
   *
   * Una pista que no consigue reproducirse -- fallo síncrono al
   * construir el elemento, `play()` síncrono que lanza, o su Promise
   * rechazada de forma asíncrona -- nunca queda registrada como música
   * activa: `activeMusic`/`activeMusicSrc` vuelven a null, permitiendo
   * reintentar el mismo `src` más adelante. El rechazo asíncrono solo
   * limpia el estado si el elemento fallido sigue siendo exactamente
   * `this.activeMusic` en ese momento, para no borrar una pista B que ya
   * sustituyó a la A cuyo rechazo llega tarde.
   */
  playMusic(src, { loop = false } = {}) {
    if (this.activeMusicSrc === src) {
      return;
    }

    this.stopMusic();
    this.activeMusicSrc = src;
    this.activeMusic = this.tryCreateAndPlay(src, { loop }, (element) => {
      if (this.activeMusic === element) {
        this.activeMusic = null;
        this.activeMusicSrc = null;
      }
    });

    if (!this.activeMusic) {
      this.activeMusicSrc = null;
    }
  }

  /*
   * Detiene la música principal activa, si la hay: pausa el elemento y
   * restablece su posición a 0 de forma segura (pause()/currentTime
   * pueden no estar disponibles en toda implementación de audio, por
   * ejemplo en un mock de test incompleto). Siempre libera la
   * referencia activa, para que una llamada posterior a playMusic()
   * con el mismo `src` pueda volver a reproducirlo desde el principio.
   */
  stopMusic() {
    if (this.activeMusic) {
      try {
        this.activeMusic.pause();
        this.activeMusic.currentTime = 0;
      } catch {
        // Degradación segura: no rompe el juego si el elemento activo
        // no soporta pause()/currentTime tal como se espera.
      }
    }

    this.activeMusic = null;
    this.activeMusicSrc = null;
  }

  /*
   * Reproduce un efecto corto independiente de la música principal:
   * no sustituye ni se guarda como música activa, puede solaparse con
   * ella, y no se conserva ninguna referencia tras dispararse.
   */
  playSfx(src) {
    this.tryCreateAndPlay(src, { loop: false });
  }

  /*
   * Mantiene el contrato ya existente: la primera llamada reproduce el
   * tema del epílogo exactamente una vez; llamadas repetidas son un
   * no-op mientras siga siendo la música activa.
   */
  playEpilogueTheme() {
    this.playMusic(EPILOGUE_THEME_PATH, { loop: false });
  }

  tryCreateAndPlay(src, { loop }, onAsyncFailure) {
    if (!this.AudioConstructor) {
      return null;
    }

    try {
      const element = new this.AudioConstructor();
      element.src = src;
      element.loop = loop;
      element.addEventListener("error", () => {});

      const playResult = element.play();

      if (playResult && typeof playResult.then === "function") {
        playResult.catch(() => {
          if (onAsyncFailure) {
            onAsyncFailure(element);
          }
        });
      }

      return element;
    } catch {
      // Degradación segura: fallo al construir el elemento, recurso
      // inexistente, o excepción síncrona de play() (incluido el
      // bloqueo de autoplay del navegador, que normalmente se
      // manifiesta como promesa rechazada, ya cubierta arriba).
      return null;
    }
  }
}
