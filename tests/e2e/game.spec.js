import { expect, test } from "@playwright/test";
import { AMBIENT_THEME_PATH } from "../../src/content/ambientAudioConfig.js";
import { OPENING_THEME_PATH } from "../../src/content/introAudioConfig.js";
import { EPILOGUE_THEME_PATH } from "../../src/content/epilogueAudioConfig.js";
import {
  ACTIVATE_SFX_PATH,
  INTERACT_SFX_PATH,
  PUZZLE_SUCCESS_SFX_PATH,
} from "../../src/content/sfxAudioConfig.js";
import {
  GIFT_CODE_CLUE_LINES,
  GIFT_CODE_DIGITS,
} from "../../src/content/epilogueConfig.js";
import { GameState } from "../../src/state/GameState.js";
import { getWorldMap } from "../../src/content/worldMaps.js";
import { PARTNER_NAME } from "../../src/content/personalizationConfig.js";

function collectJavaScriptErrors(page) {
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  return errors;
}

/*
 * Neutraliza la reproducción real de audio en el navegador de test: evita
 * depender de que el entorno CI pueda reproducir sonido (autoplay,
 * dispositivos de audio, etc.) para los flujos que ahora disparan la
 * intro musical o la música ambiental.
 *
 * Además registra en `window.__audioEvents` una entrada por cada llamada
 * real a `play()`/`pause()` sobre cualquier HTMLMediaElement, incluido el
 * `src` resuelto del elemento en el momento de la llamada. Esto permite a
 * los tests comprobar desde fuera qué pista sonó o se detuvo y en qué
 * orden, interceptando únicamente los métodos nativos del DOM que
 * AudioService ya usa -- sin instrumentar src/platform/AudioService.js ni
 * introducir ningún acceso de depuración en la aplicación real.
 *
 * Por defecto (`resolvePlayback: false`, comportamiento histórico de este
 * helper) `play()` sigue rechazando siempre su promesa, para conservar la
 * cobertura ya existente de la ruta de degradación segura de
 * AudioService ante un fallo de reproducción (ver el test del epílogo
 * completo más abajo). Los tests que necesitan observar una pista
 * "realmente" activa -- para comprobar después que algo la detiene de
 * verdad -- pasan `resolvePlayback: true`: `play()` resuelve en vez de
 * rechazar, así que AudioService.activeMusic permanece asignado hasta que
 * el propio código de producción llame a stopMusic()/pause(), en vez de
 * que un rechazo asíncrono lo limpie por su cuenta antes de que el test
 * pueda comprobar nada.
 */
async function disableAudioPlayback(page, { resolvePlayback = false } = {}) {
  await page.addInitScript((resolvePlayback) => {
    window.__audioEvents = [];

    const nativePause = HTMLMediaElement.prototype.pause;

    HTMLMediaElement.prototype.play = function patchedPlay() {
      window.__audioEvents.push({ type: "play", src: this.src });

      return resolvePlayback
        ? Promise.resolve()
        : Promise.reject(
            new Error("audio deshabilitado en el entorno de test"),
          );
    };

    HTMLMediaElement.prototype.pause = function patchedPause() {
      window.__audioEvents.push({ type: "pause", src: this.src });
      return nativePause.call(this);
    };
  }, resolvePlayback);
}

/*
 * Cuenta, sobre window.__audioEvents (ya poblado por disableAudioPlayback()),
 * cuántas veces se ha disparado un play() real para el SFX indicado --
 * identificado por el nombre de archivo final de la ruta, ya que el
 * navegador resuelve `src` a una URL absoluta.
 */
async function countSfxPlayEvents(page, sfxPath) {
  const fileName = sfxPath.split("/").pop();

  return page.evaluate(
    (needle) =>
      window.__audioEvents.filter(
        (event) => event.type === "play" && event.src.includes(needle),
      ).length,
    fileName,
  );
}

function buildGiftCodeKeystrokes(digits) {
  const keys = [];

  digits.forEach((digit, index) => {
    if (index > 0) {
      keys.push("ArrowRight");
    }

    for (let step = 0; step < digit; step += 1) {
      keys.push("ArrowUp");
    }
  });

  keys.push("Enter");
  return keys;
}

test("carga la pantalla de título sin errores", async ({ page }) => {
  const errors = collectJavaScriptErrors(page);

  await disableAudioPlayback(page);
  await page.goto("/");

  await expect(page).toHaveTitle("El Teorema del Sí");

  const canvas = page.locator("#game-canvas");

  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("width", "480");
  await expect(canvas).toHaveAttribute("height", "270");
  expect(errors).toEqual([]);
});

test("inicia una partida y abre y cierra el cuaderno", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Enter");

  await expect
    .poll(() =>
      canvas.evaluate((element) => element.toDataURL()),
    )
    .not.toBe(titleFrame);

  const notebook = page.locator("#notebook-panel");

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeVisible();

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeHidden();

  await page.keyboard.press("Tab");
  await expect(notebook).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(notebook).toBeHidden();

  expect(errors).toEqual([]);
});

test("entra en la escena archive-criteria desde un guardado existente y vuelve al mundo", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 192, y: 145, facing: "up" },
    world: {
      currentMapId: "archive",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "inspect-archive-criteria-table",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  const archiveCriteriaFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .toBe(worldFrame);

  expect(errors).toEqual([]);
});

test("resuelve el tercer puzle del Archivo con teclado y desbloquea el epílogo", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 192, y: 145, facing: "up" },
    world: {
      currentMapId: "archive",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "inspect-archive-criteria-table",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // voluntary-entry (foco inicial): null -> confirmed
  await pressAndWaitForFrameChange("ArrowDown");

  await pressAndWaitForFrameChange("ArrowRight");

  // followed-trail: null -> confirmed
  await pressAndWaitForFrameChange("ArrowDown");

  await pressAndWaitForFrameChange("ArrowRight");

  // never-disagreed: null -> confirmed -> contradicted
  await pressAndWaitForFrameChange("ArrowDown");
  await pressAndWaitForFrameChange("ArrowDown");

  await pressAndWaitForFrameChange("ArrowRight");

  // someone-refuses-now: null -> confirmed -> contradicted
  await pressAndWaitForFrameChange("ArrowDown");
  await pressAndWaitForFrameChange("ArrowDown");

  await pressAndWaitForFrameChange("ArrowRight");

  // present-choice: null -> confirmed
  await pressAndWaitForFrameChange("ArrowDown");

  await pressAndWaitForFrameChange("ArrowRight");

  // universal-future: null -> confirmed -> contradicted -> undecidable
  await pressAndWaitForFrameChange("ArrowDown");
  await pressAndWaitForFrameChange("ArrowDown");
  await pressAndWaitForFrameChange("ArrowDown");

  await page.keyboard.press("Enter");

  const toast = page.locator("#toast");

  await expect(toast).not.toBeEmpty();
  await expect(toast).toHaveText("La investigación ha terminado");

  // Resolución real del tercer puzle por teclado: dispara el SFX de puzle
  // resuelto exactamente una vez, comprobado en el navegador real vía
  // window.__audioEvents (instrumentado por disableAudioPlayback()).
  expect(await countSfxPlayEvents(page, PUZZLE_SUCCESS_SFX_PATH)).toBe(1);

  const solvedSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(solvedSceneFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const savedRaw = await page.evaluate(() =>
    localStorage.getItem("el-teorema-del-si.save.v1"),
  );
  const savedData = JSON.parse(savedRaw);

  expect(savedData.flags.investigationComplete).toBe(true);
  expect(savedData.flags.epilogueUnlocked).toBe(true);
  expect(savedData.objectiveId).toBe("start-epilogue");
  expect(savedData.puzzles.archiveCriteria.phase).toBe("solved");
  expect(savedData.puzzles.archiveCriteria.attemptCount).toBe(1);
  expect(savedData.puzzles.archiveCriteria.verdicts).toEqual({
    "voluntary-entry": "confirmed",
    "followed-trail": "confirmed",
    "never-disagreed": "contradicted",
    "someone-refuses-now": "contradicted",
    "present-choice": "confirmed",
    "universal-future": "undecidable",
  });
  expect(
    savedData.notebook.some(
      (entry) => entry.id === "archive-final-evidence",
    ),
  ).toBe(true);

  const notebook = page.locator("#notebook-panel");

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeVisible();

  const entryTitle = page.locator(
    "#notebook-content article.notebook-entry h2",
    { hasText: "La pregunta correcta" },
  );

  await expect(entryTitle).toHaveText("La pregunta correcta");

  /*
   * La pista de la combinación se guarda como cuatro líneas separadas por
   * saltos de línea. El HTML los colapsa, así que el cuaderno debe pintar un
   * párrafo por línea: si volviera a haber un solo <p>, el jugador leería
   * las cuatro frases como una sola oración corrida, sin separación visual.
   * El texto esperado se importa de GIFT_CODE_CLUE_LINES, no se duplica.
   */
  const clueEntry = page.locator("#notebook-content article.notebook-entry", {
    has: page.locator("h2", { hasText: "La combinación del candado" }),
  });

  await expect(clueEntry).toHaveCount(1);
  await expect(clueEntry.locator("p")).toHaveCount(
    GIFT_CODE_CLUE_LINES.length,
  );
  await expect(clueEntry.locator("p")).toHaveText([...GIFT_CODE_CLUE_LINES]);

  // Regresión del resto del cuaderno: una entrada de una sola línea sigue
  // produciendo exactamente un párrafo.
  const finalEvidenceEntry = page.locator(
    "#notebook-content article.notebook-entry",
    { has: page.locator("h2", { hasText: "La pregunta correcta" }) },
  );

  await expect(finalEvidenceEntry.locator("p")).toHaveCount(1);

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeHidden();

  expect(errors).toEqual([]);
});

test("resuelve el segundo puzle del catálogo de la Biblioteca con teclado y desbloquea el Archivo", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 240, y: 155, facing: "up" },
    world: {
      currentMapId: "library",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 155, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "go-to-library",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  const solutionKeys = [
    "KeyE",
    "ArrowRight",
    "ArrowRight",
    "KeyE",
    "ArrowLeft",
    "KeyE",
    "ArrowLeft",
    "ArrowLeft",
    "KeyE",
    "ArrowLeft",
    "ArrowLeft",
    "KeyE",
    "ArrowRight",
    "KeyE",
  ];

  for (const key of solutionKeys) {
    await pressAndWaitForFrameChange(key);
  }

  await page.keyboard.press("Enter");

  const toast = page.locator("#toast");

  await expect(toast).not.toBeEmpty();
  await expect(toast).toHaveText("El Archivo ha quedado accesible");

  const solvedSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(solvedSceneFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const savedRaw = await page.evaluate(() =>
    localStorage.getItem("el-teorema-del-si.save.v1"),
  );
  const savedData = JSON.parse(savedRaw);

  expect(savedData.flags.archiveUnlocked).toBe(true);
  expect(savedData.objectiveId).toBe(
    "inspect-archive-criteria-table",
  );
  expect(savedData.puzzles.libraryCatalogue.phase).toBe("solved");
  expect(savedData.puzzles.libraryCatalogue.attemptCount).toBe(1);
  expect(savedData.puzzles.libraryCatalogue.order).toEqual([
    "A",
    "D",
    "R",
    "C",
    "M",
  ]);
  expect(
    savedData.notebook.some(
      (entry) => entry.id === "library-catalogue-solution",
    ),
  ).toBe(true);

  const notebook = page.locator("#notebook-panel");

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeVisible();

  const entryTitle = page.locator(
    "#notebook-content article.notebook-entry h2",
    { hasText: "El catálogo perfecto" },
  );

  await expect(entryTitle).toHaveText("El catálogo perfecto");

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeHidden();

  expect(errors).toEqual([]);
});

test("resuelve el primer puzle de los Siete Puentes con teclado", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 348, y: 145, facing: "down" },
    world: {
      currentMapId: "seven-bridges-walk",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 348, y: 145, facing: "down" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");

  await page.keyboard.press("KeyE");

  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  /*
   * B6 es el sexto puente de P2_GRAPH.bridges, así que hacen falta cinco
   * ArrowRight para resaltarlo antes de cerrarlo con KeyE. Tras Enter, el
   * cursor de salida arranca en 0 y se reinicia a 0 tras cada cruce, pero
   * confirmar seis veces seguidas ya NO resuelve el puzle: en la Isla del
   * Reloj la primera salida disponible es B2 (Reloj-Molino) y es la trampa
   * del grafo. Para completar E-N-R-E-M-R-L hay que girar el cursor dos
   * posiciones en ese tercer paso y cruzar B7 (Entrada-Reloj) en su lugar.
   */
  const solutionKeys = [
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "KeyE",
    "Enter",
    "KeyE",
    "KeyE",
    "ArrowRight",
    "ArrowRight",
    "KeyE",
    "KeyE",
    "KeyE",
    "KeyE",
  ];

  for (const key of solutionKeys) {
    await pressAndWaitForFrameChange(key);
  }

  const toast = page.locator("#toast");

  await expect(toast).not.toBeEmpty();
  await expect(toast).toHaveText("Nueva observacion registrada");

  const solvedSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(solvedSceneFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const savedRaw = await page.evaluate(() =>
    localStorage.getItem("el-teorema-del-si.save.v1"),
  );
  const savedData = JSON.parse(savedRaw);

  expect(savedData.puzzles.p2.phase).toBe("solved");
  expect(savedData.puzzles.p2.closedBridgeId).toBe("B6");
  expect(savedData.puzzles.p2.currentNode).toBe("L");
  expect(savedData.puzzles.p2.route).toEqual([
    "E",
    "N",
    "R",
    "E",
    "M",
    "R",
    "L",
  ]);
  expect(savedData.puzzles.p2.usedBridgeIds).toEqual([
    "B1",
    "B3",
    "B7",
    "B5",
    "B4",
    "B2",
  ]);
  expect(savedData.puzzles.p2.lifecycle.status).toBe("solved");
  expect(savedData.puzzles.p2.lifecycle.attemptCount).toBe(1);
  expect(savedData.objectiveId).toBe("inspect-p2-evidence");
  expect(
    savedData.notebook.some(
      (entry) => entry.id === "p2-bridges-solution",
    ),
  ).toBe(true);

  const notebook = page.locator("#notebook-panel");

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeVisible();

  const entryTitle = page.locator(
    "#notebook-content article.notebook-entry h2",
    { hasText: "El paseo imposible" },
  );

  await expect(entryTitle).toHaveText("El paseo imposible");

  await page.keyboard.press("KeyQ");
  await expect(notebook).toBeHidden();

  expect(errors).toEqual([]);
});

/*
 * Regresión de la validación humana de PR #77: con el etiquetado anterior,
 * acertar el puente cerrado y luego pulsar la tecla de confirmar seis veces
 * seguidas -- sin girar nunca el cursor de salida -- resolvía el puzle
 * entero sin razonar el orden del recorrido. Este test comprueba con
 * teclado real que esa estrategia ya termina en fallo tras solo tres
 * cruces, dejando puentes sin usar.
 */
test("confirmar sin girar el cursor ya no resuelve el puzle de los Siete Puentes", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);

  await page.addInitScript(() => {
    window.__renderedTexts = [];

    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function patchedFillText(
      text,
      x,
      y,
      maxWidth,
    ) {
      window.__renderedTexts.push(String(text));
      return originalFillText.call(this, text, x, y, maxWidth);
    };
  });

  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 348, y: 145, facing: "down" },
    world: {
      currentMapId: "seven-bridges-walk",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 348, y: 145, facing: "down" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");
  const toast = page.locator("#toast");

  const currentFrame = () => canvas.evaluate((element) => element.toDataURL());
  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await currentFrame();

    await page.keyboard.press(key);

    await expect.poll(currentFrame).not.toBe(previousFrame);
  };

  const titleFrame = await currentFrame();

  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  const worldFrame = await currentFrame();

  await page.keyboard.press("KeyE");
  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");
  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");
  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");
  await expect.poll(currentFrame).not.toBe(worldFrame);

  // Cierra B6, el puente correcto (sexto de P2_GRAPH.bridges), y arranca.
  for (let i = 0; i < 5; i += 1) {
    await pressAndWaitForFrameChange("ArrowRight");
  }

  await pressAndWaitForFrameChange("KeyE");
  await pressAndWaitForFrameChange("Enter");

  // Tres confirmaciones seguidas: E-N, N-R y, ya en la trampa, R-L. La
  // tercera deja al jugador en el Molino sin ninguna salida abierta.
  for (let i = 0; i < 3; i += 1) {
    await pressAndWaitForFrameChange("KeyE");
  }

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__renderedTexts.includes(
          "Te has quedado sin puentes disponibles antes de cruzarlos todos. Pulsa R para reiniciar.",
        ),
      ),
    )
    .toBe(true);

  // Las tres confirmaciones restantes de la ráfaga ya no hacen nada: en fase
  // de fallo la escena solo atiende reiniciar.
  const failedFrame = await currentFrame();

  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press("KeyE");
  }

  await expect.poll(currentFrame).toBe(failedFrame);
  await expect(toast).toBeEmpty();

  await page.keyboard.press("Escape");
  await expect.poll(currentFrame).not.toBe(failedFrame);

  await page.keyboard.press("KeyK");
  await expect(toast).toHaveText("Partida guardada");

  const savedRaw = await page.evaluate(() =>
    localStorage.getItem("el-teorema-del-si.save.v1"),
  );
  const savedData = JSON.parse(savedRaw);

  expect(savedData.puzzles.p2.phase).toBe("failed");
  expect(savedData.puzzles.p2.failureCode).toBe("incomplete_route");
  expect(savedData.puzzles.p2.closedBridgeId).toBe("B6");
  expect(savedData.puzzles.p2.route).toEqual(["E", "N", "R", "L"]);
  expect(savedData.puzzles.p2.usedBridgeIds).toEqual(["B1", "B3", "B2"]);
  expect(savedData.puzzles.p2.lifecycle.status).not.toBe("solved");
  expect(savedData.flags.p2EvidenceFound).toBe(false);
  expect(
    savedData.notebook.some(
      (entry) => entry.id === "p2-bridges-solution",
    ),
  ).toBe(false);

  expect(errors).toEqual([]);
});

// Regresión de dos hallazgos de QA/reviewer sobre P2BridgesScene:
// (1) la pista de nivel 2 corregida (más larga que la anterior) debe verse
// completa, envuelta en varias líneas, sin desbordar el canvas de 480px; y
// (2) leer una pista antes de fallar no debe seguir tapando el mensaje de
// fallo diferenciado tras el fallo real. Usa el mismo patrón de parche de
// fillText que "recorre el epílogo completo..." más abajo en este archivo,
// para leer el texto real dibujado en el canvas sin tocar src/.
test("la pista de nivel 2 de P2 se lee completa sin cortarse y ya no tapa el mensaje de fallo tras leerla", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);

  await page.addInitScript(() => {
    window.__renderedTexts = [];

    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function patchedFillText(
      text,
      x,
      y,
      maxWidth,
    ) {
      window.__renderedTexts.push(String(text));
      return originalFillText.call(this, text, x, y, maxWidth);
    };
  });

  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 348, y: 145, facing: "down" },
    world: {
      currentMapId: "seven-bridges-walk",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 348, y: 145, facing: "down" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");

  const currentFrame = () => canvas.evaluate((element) => element.toDataURL());
  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await currentFrame();

    await page.keyboard.press(key);

    await expect.poll(currentFrame).not.toBe(previousFrame);
  };
  const clearRenderedTexts = () =>
    page.evaluate(() => {
      window.__renderedTexts.length = 0;
    });
  const waitForRenderedText = (text) =>
    expect
      .poll(() =>
        page.evaluate(
          (needle) => window.__renderedTexts.includes(needle),
          text,
        ),
      )
      .toBe(true);
  const measureTextWidth = (text, font) =>
    page.evaluate(
      ({ text, font }) => {
        const context = document
          .querySelector("#game-canvas")
          .getContext("2d");

        context.font = font;
        return context.measureText(text).width;
      },
      { text, font },
    );

  const titleFrame = await currentFrame();

  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  const worldFrame = await currentFrame();

  await page.keyboard.press("KeyE");
  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");
  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");
  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");
  await expect.poll(currentFrame).not.toBe(worldFrame);

  // El cuadro de estado ocupa de x=10 a x=470 (460px de ancho), centrado en
  // x=240: cada línea individual debe caber holgadamente en esa mitad de
  // ancho disponible (230px) a cada lado del centro, o se saldría del
  // cuadro/canvas.
  const STATUS_BOX_HALF_WIDTH = 230;

  await test.step("la pista de nivel 1 se lee completa, sin envolver", async () => {
    await clearRenderedTexts();
    await page.keyboard.press("KeyQ");

    const level1Text =
      "R1/3: Empieza por los lugares con un número impar de puentes disponibles.";

    await waitForRenderedText(level1Text);

    const width = await measureTextWidth(level1Text, "7px monospace");
    expect(width).toBeLessThan(STATUS_BOX_HALF_WIDTH * 2);
  });

  const level2Line1 =
    "R2/3: Antes de cerrar nada, cuenta las conexiones de cada lugar. El puente correcto es el";
  const level2Line2 =
    "que deja el inicio y el final como los únicos dos con un número impar de conexiones.";

  await test.step("la pista de nivel 2 (más larga, con el criterio corregido) se envuelve en dos líneas completas, sin cortes", async () => {
    await clearRenderedTexts();
    await page.keyboard.press("KeyQ");

    await waitForRenderedText(level2Line1);
    await waitForRenderedText(level2Line2);

    // Ninguna línea individual debe seguir conteniendo la pista completa sin
    // envolver: si esto fallara, significaría que wrapText() dejó de
    // aplicarse y el texto largo volvería a desbordarse como antes.
    const renderedTexts = await page.evaluate(() => window.__renderedTexts);

    expect(
      renderedTexts.some((text) => text.startsWith("R2/3:") && text.includes("conexiones.") && text.length > 100),
    ).toBe(false);

    const width1 = await measureTextWidth(level2Line1, "7px monospace");
    const width2 = await measureTextWidth(level2Line2, "7px monospace");

    expect(width1).toBeLessThan(STATUS_BOX_HALF_WIDTH * 2);
    expect(width2).toBeLessThan(STATUS_BOX_HALF_WIDTH * 2);
  });

  const level3Line1 =
    "R3/3: Cerrado el puente correcto, al lugar de llegada solo le queda una conexión abierta.";
  const level3Line2 =
    "Guárdala para el final: si la cruzas antes, quedarás varado con puentes sin recorrer.";

  await test.step("la pista de nivel 3 (ya no un walkthrough) se envuelve en dos líneas completas, sin cortes", async () => {
    await clearRenderedTexts();
    await page.keyboard.press("KeyQ");

    await waitForRenderedText(level3Line1);
    await waitForRenderedText(level3Line2);

    // drawStatus() dibuja como mucho dos líneas (messageLines.slice(0, 2)):
    // si la pista creciera hasta necesitar una tercera, el final se perdería
    // en silencio. Comprobar aquí las dos líneas completas detecta ese corte.
    const renderedTexts = await page.evaluate(() => window.__renderedTexts);

    expect(
      renderedTexts.some((text) => text.startsWith("R3/3:") && text.length > 100),
    ).toBe(false);

    const width1 = await measureTextWidth(level3Line1, "7px monospace");
    const width2 = await measureTextWidth(level3Line2, "7px monospace");

    expect(width1).toBeLessThan(STATUS_BOX_HALF_WIDTH * 2);
    expect(width2).toBeLessThan(STATUS_BOX_HALF_WIDTH * 2);
  });

  await test.step("tras leer la pista, un intento fallido muestra el mensaje diferenciado, no la pista antigua", async () => {
    const incompleteRouteMessage =
      "Te has quedado sin puentes disponibles antes de cruzarlos todos. Pulsa R para reiniciar.";

    // Cierra B2 (segundo puente del grafo: un ArrowRight lo resalta) y
    // recorre N, R, M, E, R -- mismo caso ya cubierto a nivel de unidad en
    // tests/scenes/P2BridgesScene.test.js ("un callejón sin salida por
    // agotar puentes muestra el mensaje de puentes agotados"), aquí
    // reproducido con teclado real. Al volver a la Isla del Reloj quedan B2
    // (cerrado) y B6 sin cruzar y ninguna salida disponible.
    await pressAndWaitForFrameChange("ArrowRight");
    await pressAndWaitForFrameChange("KeyE");
    await pressAndWaitForFrameChange("Enter");

    for (let i = 0; i < 4; i += 1) {
      await pressAndWaitForFrameChange("KeyE");
    }

    await clearRenderedTexts();
    await pressAndWaitForFrameChange("KeyE");

    await waitForRenderedText(incompleteRouteMessage);

    const textsAfterFailure = await page.evaluate(
      () => window.__renderedTexts,
    );

    expect(
      textsAfterFailure.some(
        (text) => text.startsWith("R2/3:") || text.startsWith("R3/3:"),
      ),
    ).toBe(false);
  });

  expect(errors).toEqual([]);
});

test("cambia de mapa desde una salida ya desbloqueada sin errores de consola", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  // Jugador colocado en el centro exacto de la salida
  // "plaza-to-seven-bridges" (x:720, y:224, width:16, height:64 -> centro
  // 728,256), ya desbloqueada, para que un único "KeyE" cruce el portal sin
  // ningún diálogo intermedio.
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 728, y: 256, facing: "right" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 728, y: 256, facing: "right" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");

  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  await expect(toast).toHaveText("Paseo de los Siete Puentes");

  expect(errors).toEqual([]);
});

test("Max reacciona de forma autónoma, sin pulsar ninguna tecla, tras resolver el primer puzle de los Siete Puentes", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 348, y: 145, facing: "down" },
    world: {
      currentMapId: "seven-bridges-walk",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 348, y: 145, facing: "down" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");

  await page.keyboard.press("KeyE");

  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  /*
   * Cinco ArrowRight resaltan B6 (sexto puente de P2_GRAPH.bridges) y KeyE
   * lo cierra. El recorrido E-N-R-E-M-R-L necesita girar el cursor dos
   * posiciones en la Isla del Reloj (la primera salida disponible allí es
   * B2, la trampa del grafo): confirmar seis veces seguidas no resuelve.
   */
  const solutionKeys = [
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "KeyE",
    "Enter",
    "KeyE",
    "KeyE",
    "ArrowRight",
    "ArrowRight",
    "KeyE",
    "KeyE",
    "KeyE",
    "KeyE",
  ];

  for (const key of solutionKeys) {
    await pressAndWaitForFrameChange(key);
  }

  const toast = page.locator("#toast");

  await expect(toast).not.toBeEmpty();
  await expect(toast).toHaveText("Nueva observacion registrada");

  const solvedSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(solvedSceneFrame);

  /*
   * Único punto de este archivo donde se comprueba un cambio de frame sin
   * ningún input del jugador: el mundo no tiene ninguna otra animación en
   * reposo (fondo estático, marcador de orientación fijo, HUD estático),
   * así que un cambio autónomo del canvas en esta ventana corta solo puede
   * deberse al rebote de la reacción de Max, disparada al volver al mundo
   * justo después de resolver el puzle -- sin exponer ningún estado de
   * depuración de Max al navegador.
   * La reacción dura MAX_REACTION_DURATION_SECONDS (0.4s), así que en vez
   * de esperar una única desigualdad (que podría agotar su plazo si la
   * animación ya hubiera terminado al capturar el primer frame), se
   * muestrea el canvas repetidamente durante una ventana algo más amplia
   * que la duración de la reacción, inmediatamente después de confirmar el
   * regreso al mundo, y se comprueba que no todos los frames capturados
   * son idénticos.
   */
  const sampledFrames = [];

  for (let sample = 0; sample < 20; sample += 1) {
    sampledFrames.push(
      await canvas.evaluate((element) => element.toDataURL()),
    );
    await page.waitForTimeout(25);
  }

  expect(new Set(sampledFrames).size).toBeGreaterThan(1);

  expect(errors).toEqual([]);
});

test("guarda y carga la partida en la Plaza del Axioma tras recargar la página", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 400, y: 350, facing: "left" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 400, y: 350, facing: "left" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: false,
      sevenBridgesUnlocked: false,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "speak-to-corolaria",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await disableAudioPlayback(page);
  await page.goto("/");

  /*
   * A diferencia de los demás tests de este archivo, el fixture inicial se
   * siembra con `page.evaluate` (no `page.addInitScript`) porque este test
   * hace un `page.reload()` real: `addInitScript` se re-ejecuta en cada
   * navegación posterior, incluida la del reload, y sobrescribiría en
   * silencio el guardado real producido por "KeyK" antes de que el
   * segundo "KeyL" pudiera leerlo. `page.evaluate` se ejecuta una sola
   * vez, así que el localStorage sobrevive al reload sin intervención del
   * test, que es justo lo que este test necesita demostrar.
   */
  await page.evaluate((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const readSave = async () => {
    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );

    return JSON.parse(savedRaw);
  };

  const firstSave = await readSave();

  expect(firstSave.world.currentMapId).toBe("axiom-plaza");
  expect(firstSave.world.playerByMap["axiom-plaza"]).toEqual({
    x: 400,
    y: 350,
    facing: "left",
  });
  expect(firstSave.flags.preparationsBoardRead).toBe(true);
  expect(firstSave.flags.brideNoteReceived).toBe(false);
  expect(firstSave.flags.examinedPrototypeSign).toBe(false);
  expect(firstSave.flags.sevenBridgesUnlocked).toBe(false);
  expect(firstSave.objectiveId).toBe("speak-to-corolaria");

  await page.reload();

  const reloadedTitleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedTitleFrame);

  /*
   * Releer localStorage aquí solo demostraría que "KeyL" no lo tocó, no
   * que GameState se restauró de verdad en memoria. Para probar la
   * restauración real, se vuelve a guardar desde el estado recién
   * cargado y se comprueban explícitamente los campos relevantes del
   * guardado resultante (sin comparar el objeto completo: `savedAt`
   * cambia en cada guardado).
   */
  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const secondSave = await readSave();

  expect(secondSave.world.currentMapId).toBe("axiom-plaza");
  expect(secondSave.world.playerByMap["axiom-plaza"]).toEqual({
    x: 400,
    y: 350,
    facing: "left",
  });
  expect(secondSave.flags.preparationsBoardRead).toBe(true);
  expect(secondSave.flags.brideNoteReceived).toBe(false);
  expect(secondSave.flags.examinedPrototypeSign).toBe(false);
  expect(secondSave.flags.sevenBridgesUnlocked).toBe(false);
  expect(secondSave.objectiveId).toBe("speak-to-corolaria");

  expect(errors).toEqual([]);
});

test("restaura un intento fallido del catálogo de la Biblioteca tras recargar la página", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 240, y: 155, facing: "up" },
    world: {
      currentMapId: "library",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 155, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "go-to-library",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await disableAudioPlayback(page);
  await page.goto("/");

  /*
   * A diferencia de la mayoría de tests de este archivo, el fixture inicial
   * se siembra con `page.evaluate` (no `page.addInitScript`) porque este
   * test hace un `page.reload()` real: `addInitScript` se re-ejecuta en
   * cada navegación posterior, incluida la del reload, y sobrescribiría en
   * silencio el guardado real producido por "KeyK" antes de que el segundo
   * "KeyL" pudiera leerlo. `page.evaluate` se ejecuta una sola vez, así que
   * el localStorage sobrevive al reload sin intervención del test, que es
   * justo lo que este test necesita demostrar.
   */
  await page.evaluate((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const readSave = async () => {
    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );

    return JSON.parse(savedRaw);
  };

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // Selecciona el documento en el índice 0 ("C").
  await pressAndWaitForFrameChange("KeyE");

  // Mueve el foco al índice 1 ("M").
  await pressAndWaitForFrameChange("ArrowRight");

  // Intercambia los índices 0 y 1: el orden pasa a ["M","C","A","R","D"].
  await pressAndWaitForFrameChange("KeyE");

  // Revela la primera pista sin resolver el puzle.
  await pressAndWaitForFrameChange("KeyQ");

  // Confirma un orden que no cumple las seis reglas: la fase pasa a
  // "failed", se consume un intento y el orden no cambia.
  await pressAndWaitForFrameChange("Enter");

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .toBe(worldFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const firstSave = await readSave();

  expect(firstSave.puzzles.libraryCatalogue.phase).toBe("failed");
  expect(firstSave.puzzles.libraryCatalogue.order).toEqual([
    "M",
    "C",
    "A",
    "R",
    "D",
  ]);
  expect(firstSave.puzzles.libraryCatalogue.hintsRead).toEqual([1]);
  expect(firstSave.puzzles.libraryCatalogue.attemptCount).toBe(1);
  expect(firstSave.puzzles.libraryCatalogue.failureCode).toBe(
    "constraints_not_satisfied",
  );

  await page.reload();

  const reloadedTitleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedTitleFrame);

  const reloadedWorldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  // Reentra en el catálogo para confirmar que reconstruir un intento
  // "failed" desde el guardado no lanza ninguna excepción.
  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedWorldFrame);

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .toBe(reloadedWorldFrame);

  /*
   * Releer localStorage aquí solo demostraría que "KeyL" no lo tocó, no
   * que GameState se restauró de verdad en memoria. Para probar la
   * restauración real, se vuelve a guardar desde el estado recién cargado
   * y se comprueban explícitamente los campos del puzle en el guardado
   * resultante (sin comparar el objeto completo: `savedAt` cambia en cada
   * guardado).
   */
  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const secondSave = await readSave();

  expect(secondSave.puzzles.libraryCatalogue.phase).toBe("failed");
  expect(secondSave.puzzles.libraryCatalogue.order).toEqual([
    "M",
    "C",
    "A",
    "R",
    "D",
  ]);
  expect(secondSave.puzzles.libraryCatalogue.hintsRead).toEqual([1]);
  expect(secondSave.puzzles.libraryCatalogue.attemptCount).toBe(1);
  expect(secondSave.puzzles.libraryCatalogue.failureCode).toBe(
    "constraints_not_satisfied",
  );

  expect(errors).toEqual([]);
});

// También sirve como regresión de compatibilidad con guardados reales de
// v1.0.0 (tag `v1.0.0`) para el Caso B de
// tests/state/GameStateV1SaveCompatibility.test.js: mismo punto de
// progreso (P2 a medias, `traversing`, B2 cerrado, dos pasos registrados).
test("restaura un intento a medias del primer puzle de los Siete Puentes tras recargar la página", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 348, y: 145, facing: "down" },
    world: {
      currentMapId: "seven-bridges-walk",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 348, y: 145, facing: "down" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: {
      p2: {
        phase: "traversing",
        closedBridgeId: "B2",
        currentNode: "R",
        route: ["E", "N", "R"],
        usedBridgeIds: ["B1", "B3"],
        hintsRead: [],
        failureCode: null,
        lifecycle: { status: "active", attemptCount: 1 },
      },
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await disableAudioPlayback(page);
  await page.goto("/");

  /*
   * A diferencia de la mayoría de tests de este archivo, el fixture inicial
   * se siembra con `page.evaluate` (no `page.addInitScript`) porque este
   * test hace un `page.reload()` real: `addInitScript` se re-ejecuta en
   * cada navegación posterior, incluida la del reload, y sobrescribiría en
   * silencio el guardado real producido por "KeyK" antes de que el segundo
   * "KeyL" pudiera leerlo. `page.evaluate` se ejecuta una sola vez, así que
   * el localStorage sobrevive al reload sin intervención del test, que es
   * justo lo que este test necesita demostrar.
   */
  await page.evaluate((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const readSave = async () => {
    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );

    return JSON.parse(savedRaw);
  };

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // Cruza B4 (R -> M): en R hay dos salidas disponibles tras excluir B2
  // (cerrado) y B3 (usado) -- B4 y B7 -- pero selectedMoveIndex arranca en
  // 0 y B4 es la primera en el orden de P2_GRAPH.bridges, así que un solo
  // KeyE (sin ArrowLeft/ArrowRight) la selecciona y la cruza.
  await pressAndWaitForFrameChange("KeyE");

  const puzzleSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(puzzleSceneFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const firstSave = await readSave();

  expect(firstSave.puzzles.p2.phase).toBe("traversing");
  expect(firstSave.puzzles.p2.closedBridgeId).toBe("B2");
  expect(firstSave.puzzles.p2.currentNode).toBe("M");
  expect(firstSave.puzzles.p2.route).toEqual(["E", "N", "R", "M"]);
  expect(firstSave.puzzles.p2.usedBridgeIds).toEqual(["B1", "B3", "B4"]);
  expect(firstSave.puzzles.p2.lifecycle.status).toBe("active");
  expect(firstSave.puzzles.p2.lifecycle.attemptCount).toBe(1);
  expect(firstSave.puzzles.p2.failureCode).toBe(null);

  await page.reload();

  const reloadedTitleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedTitleFrame);

  const reloadedWorldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  // Reabre el diálogo del mapa: sigue apareciendo porque phase !== "solved".
  await page.keyboard.press("KeyE");

  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedWorldFrame);

  /*
   * Cruza B5 (M -> E): única salida disponible en M tras excluir B4
   * (usado). Este movimiento solo produce el resultado esperado si el
   * recorrido se restauró de verdad en currentNode "M"; de lo contrario el
   * puzle habría reanudado en otro nodo y esta acción fallaría o
   * produciría un resultado distinto.
   */
  await pressAndWaitForFrameChange("KeyE");

  const secondPuzzleSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(secondPuzzleSceneFrame);

  /*
   * Releer localStorage aquí solo demostraría que "KeyL" no lo tocó, no
   * que GameState se restauró de verdad en memoria. Para probar la
   * restauración real, se vuelve a guardar desde el estado recién cargado
   * y se comprueban explícitamente los campos del puzle en el guardado
   * resultante (sin comparar el objeto completo: `savedAt` cambia en cada
   * guardado).
   */
  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const secondSave = await readSave();

  expect(secondSave.puzzles.p2.phase).toBe("traversing");
  expect(secondSave.puzzles.p2.closedBridgeId).toBe("B2");
  expect(secondSave.puzzles.p2.currentNode).toBe("E");
  expect(secondSave.puzzles.p2.route).toEqual(["E", "N", "R", "M", "E"]);
  expect(secondSave.puzzles.p2.usedBridgeIds).toEqual([
    "B1",
    "B3",
    "B4",
    "B5",
  ]);
  expect(secondSave.puzzles.p2.lifecycle.status).toBe("active");
  expect(secondSave.puzzles.p2.lifecycle.attemptCount).toBe(1);
  expect(secondSave.puzzles.p2.failureCode).toBe(null);

  expect(errors).toEqual([]);
});

/*
 * Compatibilidad con guardados reales de v1.0.0 (tag `v1.0.0`, commit
 * ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733), Caso A de
 * tests/state/GameStateV1SaveCompatibility.test.js: un guardado con la
 * forma exacta que produciría GameState.toSaveData() justo tras leer el
 * tablón de preparativos (preparationsBoardRead:true, resto de banderas
 * en false). Comprueba en el navegador real, no solo a nivel unitario,
 * que esa bandera restaurada cambia de verdad el diálogo real de
 * Corolaria (WorldScene.interactWithCorolaria()), no solo el dato en
 * memoria.
 */
test("Caso A de compatibilidad con guardados de v1.0.0: preparationsBoardRead restaurado cambia el diálogo real de Corolaria", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: "2026-08-11T00:00:00.000Z",
    scene: "world",
    player: { x: 240, y: 192, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 192, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: false,
      sevenBridgesUnlocked: false,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "speak-to-corolaria",
    notebook: [],
    puzzles: {
      p2: {
        lifecycle: { id: "p2-bridges", status: "ready", attemptCount: 0 },
        phase: "planning",
        closedBridgeId: null,
        currentNode: "E",
        route: ["E"],
        usedBridgeIds: [],
        hintsRead: [],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueSpeaker = page.locator("#dialogue-speaker");
  const dialogueText = page.locator("#dialogue-text");

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );
  await page.keyboard.press("KeyL");
  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  /*
   * El jugador ya restaura dentro del radio de interacción de
   * mayor-corolaria (x:256 y:176 width:14 height:18 interactionRadius:28
   * en src/content/worldMaps.js, centro en x:263 y:185; distancia desde
   * el spawn restaurado x:240 y:192 es ~24.04, menor que 28) -- no hace
   * falta caminar para comprobar la interacción real.
   */
  await page.keyboard.press("KeyE");
  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueSpeaker).toHaveText("Alcaldesa Corolaria");
  await expect(dialogueText).toHaveText(
    "Bien. Ya conoces las normas básicas de esta operación.",
  );

  const firstLine = await dialogueText.textContent();
  expect(firstLine).not.toContain(
    "revisa el tablón de preparativos",
  );

  await page.keyboard.press("KeyE");
  await expect(dialogueText).toHaveText(
    "Ahora necesito que hables con el padre de la novia.",
  );

  expect(errors).toEqual([]);
});

test("restaura una clasificación incompleta del Archivo tras recargar la página", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 192, y: 145, facing: "up" },
    world: {
      currentMapId: "archive",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: false,
      epilogueUnlocked: false,
    },
    objectiveId: "inspect-archive-criteria-table",
    notebook: [],
    puzzles: {
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  await disableAudioPlayback(page);
  await page.goto("/");

  /*
   * A diferencia de la mayoría de tests de este archivo, el fixture inicial
   * se siembra con `page.evaluate` (no `page.addInitScript`) porque este
   * test hace un `page.reload()` real: `addInitScript` se re-ejecuta en
   * cada navegación posterior, incluida la del reload, y sobrescribiría en
   * silencio el guardado real producido por "KeyK" antes de que el segundo
   * "KeyL" pudiera leerlo. `page.evaluate` se ejecuta una sola vez, así que
   * el localStorage sobrevive al reload sin intervención del test, que es
   * justo lo que este test necesita demostrar.
   */
  await page.evaluate((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const readSave = async () => {
    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );

    return JSON.parse(savedRaw);
  };

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // voluntary-entry (foco inicial): null -> confirmed
  await pressAndWaitForFrameChange("ArrowDown");

  // Mueve el foco al índice 1 (followed-trail).
  await pressAndWaitForFrameChange("ArrowRight");

  // followed-trail: null -> confirmed
  await pressAndWaitForFrameChange("ArrowDown");

  // Revela la primera pista sin confirmar la clasificación.
  await pressAndWaitForFrameChange("KeyQ");

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .toBe(worldFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const firstSave = await readSave();

  expect(firstSave.puzzles.archiveCriteria.phase).toBe("classifying");
  expect(firstSave.puzzles.archiveCriteria.verdicts).toEqual({
    "voluntary-entry": "confirmed",
    "followed-trail": "confirmed",
    "never-disagreed": null,
    "someone-refuses-now": null,
    "present-choice": null,
    "universal-future": null,
  });
  expect(firstSave.puzzles.archiveCriteria.hintsRead).toEqual([1]);
  expect(firstSave.puzzles.archiveCriteria.attemptCount).toBe(0);
  expect(firstSave.puzzles.archiveCriteria.failureCode).toBe(null);

  await page.reload();

  const reloadedTitleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedTitleFrame);

  const reloadedWorldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  // Reentra en el Archivo para confirmar que reconstruir un intento
  // "classifying" desde el guardado no lanza ninguna excepción.
  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedWorldFrame);

  /*
   * El foco (focusedClaimIndex) se reinicia a 0 en cada `enter()`: es
   * estado transitorio de la escena, no persistido en el guardado. Navega
   * desde ahí: 0 (voluntary-entry) -> 1 (followed-trail) -> 2
   * (never-disagreed).
   */
  await pressAndWaitForFrameChange("ArrowRight");
  await pressAndWaitForFrameChange("ArrowRight");

  /*
   * never-disagreed: null -> confirmed. Este movimiento solo produce el
   * resultado esperado en el guardado final si los dos veredictos
   * anteriores se restauraron de verdad en memoria; de lo contrario el
   * guardado resultante no contendría las tres clasificaciones juntas.
   */
  await pressAndWaitForFrameChange("ArrowDown");

  await pressAndWaitForFrameChange("Escape");

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const secondSave = await readSave();

  expect(secondSave.puzzles.archiveCriteria.phase).toBe("classifying");
  expect(secondSave.puzzles.archiveCriteria.verdicts).toEqual({
    "voluntary-entry": "confirmed",
    "followed-trail": "confirmed",
    "never-disagreed": "confirmed",
    "someone-refuses-now": null,
    "present-choice": null,
    "universal-future": null,
  });
  expect(secondSave.puzzles.archiveCriteria.hintsRead).toEqual([1]);
  expect(secondSave.puzzles.archiveCriteria.attemptCount).toBe(0);
  expect(secondSave.puzzles.archiveCriteria.failureCode).toBe(null);

  expect(errors).toEqual([]);
});

test("conserva mapa, posición, banderas, objetivo, cuaderno y los tres puzles combinados tras recargar la página", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    scene: "world",
    player: { x: 192, y: 145, facing: "up" },
    world: {
      currentMapId: "archive",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "inspect-archive-criteria-table",
    notebook: [
      {
        id: "bride-note",
        title: "Nota encontrada en la habitación",
        text: "Antes de mañana tengo que comprobar una cosa. Si no he vuelto al anochecer, sigue el camino de los siete puentes. No confíes en el mapa completo: uno de ellos nunca estuvo abierto.",
      },
      {
        id: "library-clue",
        title: "La marca de la biblioteca",
        text: "La anotación encontrada junto al embarcadero contiene dos arcos entrelazados y una referencia al archivo de mapas de la Biblioteca del Margen.",
      },
      {
        id: "p2-bridges-solution",
        title: "El paseo imposible",
        text: "No era necesario cruzar los siete puentes. Al reconocer cuál estaba cerrado, los seis restantes formaban un recorrido posible desde la entrada hasta el molino.",
      },
      {
        id: "library-catalogue-solution",
        title: "El catálogo perfecto",
        text: "El orden A-D-R-C-M ha restaurado el catálogo y revelado el acceso al Archivo.",
      },
    ],
    puzzles: {
      p2: {
        lifecycle: { status: "solved", attemptCount: 1 },
        phase: "solved",
        closedBridgeId: "B1",
        currentNode: "L",
        route: ["E", "R", "N", "L", "R", "M", "L"],
        usedBridgeIds: ["B2", "B3", "B6", "B7", "B4", "B5"],
        hintsRead: [1],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": "confirmed",
          "followed-trail": "confirmed",
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "classifying",
        hintsRead: [1],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };

  const assertCombinedState = (savedData) => {
    expect(savedData.formatVersion).toBe(savedGame.formatVersion);
    expect(savedData.scene).toBe(savedGame.scene);
    expect(savedData.player).toEqual(savedGame.player);
    expect(savedData.world).toEqual(savedGame.world);
    expect(savedData.flags).toEqual(savedGame.flags);
    expect(savedData.objectiveId).toBe(savedGame.objectiveId);
    expect(savedData.notebook).toEqual(savedGame.notebook);

    /*
     * Compara la estructura persistida completa de los tres puzles contra
     * el propio fixture de entrada, en vez de listar campos sueltos: así
     * queda cubierto explícitamente cada campo de cada puzle (incluidos
     * currentNode/hintsRead/failureCode de P2, hintsRead/attemptCount/
     * failureCode del catálogo, y attemptCount/failureCode del Archivo),
     * sin depender de que alguien recuerde añadir una aserción nueva si el
     * formato de guardado gana un campo en el futuro.
     *
     * La única salvedad real es P2State: su lifecycle.toSaveData() añade
     * el campo calculado `id` (siempre P2_GRAPH.id = "p2-bridges"),
     * ausente del fixture de entrada porque no se lee de él. Se añade aquí
     * explícitamente para poder seguir comparando el resto de la
     * estructura con toEqual.
     */
    expect(savedData.puzzles).toEqual({
      ...savedGame.puzzles,
      p2: {
        ...savedGame.puzzles.p2,
        lifecycle: {
          ...savedGame.puzzles.p2.lifecycle,
          id: "p2-bridges",
        },
      },
    });
  };

  await disableAudioPlayback(page);
  await page.goto("/");

  /*
   * A diferencia de la mayoría de tests de este archivo, el fixture inicial
   * se siembra con `page.evaluate` (no `page.addInitScript`) porque este
   * test hace un `page.reload()` real: `addInitScript` se re-ejecuta en
   * cada navegación posterior, incluida la del reload, y sobrescribiría en
   * silencio el guardado real producido por "KeyK" antes de que el segundo
   * "KeyL" pudiera leerlo. `page.evaluate` se ejecuta una sola vez, así que
   * el localStorage sobrevive al reload sin intervención del test, que es
   * justo lo que este test necesita demostrar.
   */
  await page.evaluate((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");

  const readSave = async () => {
    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );

    return JSON.parse(savedRaw);
  };

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const firstSave = await readSave();

  assertCombinedState(firstSave);

  await page.reload();

  const reloadedTitleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(reloadedTitleFrame);

  /*
   * Releer localStorage aquí solo demostraría que "KeyL" no lo tocó, no
   * que GameState se restauró de verdad en memoria. Para probar la
   * restauración real, se vuelve a guardar desde el estado recién cargado
   * y se ejecuta la misma comprobación completa sobre el guardado
   * resultante (sin comparar el objeto completo: `savedAt` cambia en cada
   * guardado).
   */
  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const secondSave = await readSave();

  assertCombinedState(secondSave);

  expect(errors).toEqual([]);
});

test("migra un guardado de formato 1 y continúa el recorrido de P2 con teclado", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const legacySavedGame = {
    formatVersion: 1,
    scene: "world",
    player: { x: 348, y: 145, facing: "down" },
    world: { currentMapId: "seven-bridges-walk" },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
    },
    objectiveId: "legacy-objective",
    notebook: [
      {
        id: "legacy-entry",
        title: "Entrada histórica",
        text: "Contenido conservado",
      },
    ],
    puzzles: {
      /*
       * B1 (Entrada-Isla del Nodo) y B6 (Isla del Nodo-Molino) son dos de
       * los cuatro puentes que nunca se han recableado (los otros son B3 y
       * B4), así que este recorrido a medias significa exactamente lo mismo
       * en el formato 1 que con la topología vigente: es un guardado que un
       * jugador real de aquella versión pudo producir y que sigue siendo
       * coherente hoy.
       */
      p2: {
        lifecycle: { status: "active", attemptCount: 1 },
        phase: "traversing",
        closedBridgeId: "B6",
        currentNode: "N",
        route: ["E", "N"],
        usedBridgeIds: ["B1"],
        hintsRead: [1],
        failureCode: null,
      },
      libraryCatalogue: {
        invalid: "Los formatos anteriores no leen este campo.",
      },
    },
  };

  /*
   * Este test no hace page.reload(), así que addInitScript es la técnica
   * correcta (a diferencia de los tests de reload de este archivo, que
   * usan page.evaluate para que el guardado sobreviva a la navegación).
   */
  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, legacySavedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");
  const toast = page.locator("#toast");

  const pressAndWaitForFrameChange = async (key) => {
    const previousFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press(key);

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(previousFrame);
  };

  const initialFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  // Carga el guardado de formato 1: dispara la migración al formato vigente.
  await page.keyboard.press("KeyL");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(initialFrame);

  const worldFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("KeyE");

  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // Cruza B3 (N -> R): desde la Isla del Nodo, tras excluir B1 (usado) y
  // B6 (cerrado), B3 es la única salida disponible, así que un solo KeyE
  // (sin ArrowLeft/ArrowRight) la selecciona y la cruza.
  await pressAndWaitForFrameChange("KeyE");

  const puzzleSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(puzzleSceneFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const savedRaw = await page.evaluate(() =>
    localStorage.getItem("el-teorema-del-si.save.v1"),
  );
  const savedData = JSON.parse(savedRaw);

  expect(savedData.formatVersion).toBe(4);
  expect(savedData.puzzles.p2.phase).toBe("traversing");
  expect(savedData.puzzles.p2.closedBridgeId).toBe("B6");
  expect(savedData.puzzles.p2.currentNode).toBe("R");
  expect(savedData.puzzles.p2.route).toEqual(["E", "N", "R"]);
  expect(savedData.puzzles.p2.usedBridgeIds).toEqual(["B1", "B3"]);
  expect(savedData.puzzles.p2.lifecycle.status).toBe("active");
  expect(savedData.puzzles.p2.lifecycle.attemptCount).toBe(1);
  expect(savedData.puzzles.p2.failureCode).toBe(null);
  expect(savedData.puzzles.libraryCatalogue.phase).toBe("ready");
  expect(savedData.puzzles.libraryCatalogue.order).toEqual([
    "C",
    "M",
    "A",
    "R",
    "D",
  ]);
  expect(savedData.puzzles.archiveCriteria.phase).toBe("ready");
  expect(savedData.objectiveId).toBe("legacy-objective");
  expect(
    savedData.notebook.some(
      (entry) =>
        entry.id === "legacy-entry" &&
        entry.text === "Contenido conservado",
    ),
  ).toBe(true);
  expect(savedData.flags.p2EvidenceFound).toBe(true);
  expect(savedData.flags.libraryObjectiveUnlocked).toBe(true);
  expect(savedData.flags.archiveUnlocked).toBe(false);
  expect(savedData.flags.investigationComplete).toBe(false);
  expect(savedData.flags.epilogueUnlocked).toBe(false);

  /*
   * El recorrido migrado no solo continúa: termina de verdad. Se vuelve al
   * mapa de los puentes y se completa el paseo desde la Isla del Reloj con
   * la topología vigente (E-N-R-M-E-R-L, con B6 cerrado).
   */
  await page.keyboard.press("KeyE");

  await expect(dialoguePanel).toBeVisible();
  await expect(dialogueText).toHaveText(
    "Cinco lugares aparecen unidos por siete puentes.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Elena marcó que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  /*
   * Desde la Isla del Reloj quedan tres salidas (B2 a Molino, B4 a Mercado
   * y B7 a Entrada, en el orden de P2_GRAPH.bridges) y el cursor arranca en
   * 0: hay que girarlo una posición para cruzar B4 en vez de la trampa B2.
   * Después, cada lugar deja una única salida abierta, así que basta con
   * confirmar: M-E por B5, E-R por B7 y R-L por B2.
   */
  const remainingSolutionKeys = [
    "ArrowRight",
    "KeyE",
    "KeyE",
    "KeyE",
    "KeyE",
  ];

  for (const key of remainingSolutionKeys) {
    await pressAndWaitForFrameChange(key);
  }

  await expect(toast).toHaveText("Nueva observacion registrada");

  const solvedSceneFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );

  await page.keyboard.press("Escape");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(solvedSceneFrame);

  await page.keyboard.press("KeyK");

  await expect(toast).toHaveText("Partida guardada");

  const solvedRaw = await page.evaluate(() =>
    localStorage.getItem("el-teorema-del-si.save.v1"),
  );
  const solvedData = JSON.parse(solvedRaw);

  expect(solvedData.puzzles.p2.phase).toBe("solved");
  expect(solvedData.puzzles.p2.closedBridgeId).toBe("B6");
  expect(solvedData.puzzles.p2.route).toEqual([
    "E",
    "N",
    "R",
    "M",
    "E",
    "R",
    "L",
  ]);
  expect(solvedData.puzzles.p2.usedBridgeIds).toEqual([
    "B1",
    "B3",
    "B4",
    "B5",
    "B7",
    "B2",
  ]);

  expect(errors).toEqual([]);
});

const INVALID_SAVE_VARIANTS = [
  {
    name: "JSON inválido",
    rawValue: "{ esto no es JSON valido",
  },
  {
    name: "formatVersion incompatible",
    rawValue: JSON.stringify({ formatVersion: 999 }),
  },
];

for (const variant of INVALID_SAVE_VARIANTS) {
  test(`carga un guardado inválido (${variant.name}) sin excepciones sin capturar`, async ({
    page,
  }) => {
    const errors = collectJavaScriptErrors(page);

    await page.addInitScript((rawValue) => {
      localStorage.setItem("el-teorema-del-si.save.v1", rawValue);
    }, variant.rawValue);

    await disableAudioPlayback(page);
    await page.goto("/");

    const canvas = page.locator("#game-canvas");
    const initialFrame = await canvas.evaluate((element) =>
      element.toDataURL(),
    );

    await page.keyboard.press("KeyL");

    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(initialFrame);

    const toast = page.locator("#toast");

    await expect(toast).not.toBeEmpty();

    /*
     * WorldScene.load() registra su propio console.error(error) dentro
     * del catch por diseño (mismo patrón que save()): eso es
     * comportamiento correcto, no un fallo. Lo que este test verifica es
     * que ninguna excepción escapó sin capturar al runtime del
     * navegador (pageerror), no la ausencia total de entradas en
     * `errors`.
     */
    const uncaughtExceptions = errors.filter((entry) =>
      entry.startsWith("pageerror:"),
    );
    expect(uncaughtExceptions).toEqual([]);
  });
}

function buildEpilogueReadySaveData() {
  const seedState = new GameState();

  seedState.restore({
    formatVersion: 4,
    scene: "world",
    player: { x: 576, y: 325, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 576, y: 325, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "inspect-archive-criteria-table",
    notebook: [
      {
        id: "bride-note",
        title: "Nota encontrada en la habitación",
        text: "Antes de mañana tengo que comprobar una cosa. Si no he vuelto al anochecer, sigue el camino de los siete puentes. No confíes en el mapa completo: uno de ellos nunca estuvo abierto.",
      },
      {
        id: "library-clue",
        title: "La marca de la biblioteca",
        text: "La anotación encontrada junto al embarcadero contiene dos arcos entrelazados y una referencia al archivo de mapas de la Biblioteca del Margen.",
      },
      {
        id: "p2-bridges-solution",
        title: "El paseo imposible",
        text: "No era necesario cruzar los siete puentes. Al reconocer cuál estaba cerrado, los seis restantes formaban un recorrido posible desde la entrada hasta el molino.",
      },
    ],
    puzzles: {
      p2: {
        lifecycle: { status: "solved", attemptCount: 1 },
        phase: "solved",
        closedBridgeId: "B1",
        currentNode: "L",
        route: ["E", "R", "N", "L", "R", "M", "L"],
        usedBridgeIds: ["B2", "B3", "B6", "B7", "B4", "B5"],
        hintsRead: [1],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": "confirmed",
          "followed-trail": "confirmed",
          "never-disagreed": "contradicted",
          "someone-refuses-now": "contradicted",
          "present-choice": "confirmed",
          "universal-future": "undecidable",
        },
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
    },
  });

  /*
   * GameState.restore() ya ejecuta applyLibraryCatalogueProgression() y
   * applyArchiveCriteriaProgression() (src/state/GameState.js), que con
   * los tres puzles ya "solved" añaden automáticamente
   * "library-catalogue-solution", "archive-final-evidence" y
   * "epilogue-combination-clue" al cuaderno, y fijan
   * investigationComplete/epilogueUnlocked/objectiveId — nada de eso se
   * duplica a mano aquí, es la misma lógica de producción real que se
   * ejecutaría al cargar un guardado auténtico en ese punto de la partida.
   *
   * Guarda focalizada: si este helper alguna vez dejara de producir el
   * punto de partida exacto que el recorrido E2E necesita, debe fallar
   * aquí mismo, con un mensaje claro, no dejar que el test avance con un
   * fixture incoherente y falle más tarde de forma confusa en mitad del
   * recorrido.
   */
  const expectedNotebookIds = [
    "bride-note",
    "library-clue",
    "p2-bridges-solution",
    "library-catalogue-solution",
    "archive-final-evidence",
    "epilogue-combination-clue",
  ];
  const actualNotebookIds = seedState.notebook.map((entry) => entry.id);
  const isCoherent =
    seedState.scene === "world" &&
    seedState.world.currentMapId === "axiom-plaza" &&
    seedState.objectiveId === "start-epilogue" &&
    seedState.flags.investigationComplete === true &&
    seedState.flags.epilogueUnlocked === true &&
    seedState.flags.epilogueStarted === false &&
    seedState.flags.giftCodeSolved === false &&
    seedState.flags.epilogueCompleted === false &&
    expectedNotebookIds.every((id) => actualNotebookIds.includes(id)) &&
    seedState.puzzles.p2.phase === "solved" &&
    seedState.puzzles.libraryCatalogue.phase === "solved" &&
    seedState.puzzles.archiveCriteria.phase === "solved";

  if (!isCoherent) {
    throw new Error(
      "buildEpilogueReadySaveData() produjo un fixture incoherente con el punto de partida esperado del recorrido E2E del epílogo.",
    );
  }

  return seedState.toSaveData();
}

// También sirve como regresión de compatibilidad con guardados reales de
// v1.0.0 (tag `v1.0.0`) para el Caso C de
// tests/state/GameStateV1SaveCompatibility.test.js: mismo punto de
// progreso (los tres puzles resueltos), aunque este recorrido parte de
// antes de resolver el código del regalo.
test("recorre el epílogo completo con teclado, desde el Archivo resuelto hasta volver al título", async ({
  page,
}) => {
  test.setTimeout(60_000);

  const errors = collectJavaScriptErrors(page);

  const savedGame = buildEpilogueReadySaveData();

  // Captura de texto renderizado directamente en canvas (EpilogueGiftCodeScene
  // y CreditsScene no usan el DOM, así que expect.poll sobre canvas.toDataURL()
  // solo prueba "cambió", no "dice lo aprobado" — este parche de fillText,
  // inyectado en el navegador real antes de que cargue el juego, sí lo prueba,
  // sin tocar ningún archivo de src/. Mismo patrón que FakeCanvasContext ya usa
  // a nivel unitario en tests/scenes/CreditsScene.test.js.
  await page.addInitScript(() => {
    window.__renderedTexts = [];
    window.__renderedFillStyles = [];

    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function patchedFillText(
      text,
      x,
      y,
      maxWidth,
    ) {
      window.__renderedTexts.push(String(text));
      return originalFillText.call(this, text, x, y, maxWidth);
    };

    const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function patchedFillRect(
      x,
      y,
      width,
      height,
    ) {
      window.__renderedFillStyles.push(String(this.fillStyle));
      return originalFillRect.call(this, x, y, width, height);
    };
  });

  // Esto además ejercita a propósito la ruta de degradación segura de
  // AudioService.playEpilogueTheme() (ya cubierta a nivel unitario, aquí se
  // confirma en el navegador real que un fallo de play() no bloquea la
  // entrada en créditos). No se modifica src/platform/AudioService.js.
  await disableAudioPlayback(page);

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const interactionPrompt = page.locator("#interaction-prompt");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueSpeaker = page.locator("#dialogue-speaker");
  const dialogueText = page.locator("#dialogue-text");

  const currentFrame = () => canvas.evaluate((element) => element.toDataURL());
  const clearRenderedTexts = () =>
    page.evaluate(() => {
      window.__renderedTexts.length = 0;
    });
  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;
  const clearRenderedFillStyles = () =>
    page.evaluate(() => {
      window.__renderedFillStyles.length = 0;
    });
  const waitForRenderedText = (text) =>
    expect
      .poll(() =>
        page.evaluate(
          (needle) => window.__renderedTexts.includes(needle),
          text,
        ),
      )
      .toBe(true);
  const waitForFrameChangeFrom = async (previousFrame) => {
    await expect.poll(currentFrame).not.toBe(previousFrame);
    return currentFrame();
  };

  const titleFrame = await currentFrame();

  await test.step("cargar el guardado y abrir el mecanismo del regalo", async () => {
    await page.keyboard.press("KeyL");
    await waitForFrameChangeFrom(titleFrame);

    await expect(interactionPrompt).toHaveText(
      "[E] Examinar Mecanismo del regalo",
    );

    await clearRenderedTexts();
    const worldFrame = await currentFrame();
    await page.keyboard.press("KeyE");
    await waitForFrameChangeFrom(worldFrame);
    await waitForRenderedText("MECANISMO DEL REGALO");

    const renderedTexts = await page.evaluate(() => window.__renderedTexts);
    const editableDigits = renderedTexts.filter((text) => /^\d$/.test(text));

    /*
     * EpilogueGiftCodeScene dibuja cada cifra como un carácter único
     * ("0"-"9") con fillText — el mismo criterio que ya usa
     * tests/scenes/EpilogueGiftCodeScene.test.js para distinguir las cuatro
     * cajas de dígito de cualquier otro texto (el candado resuelto muestra
     * "7 · 1 · 5 · 2" como una sola cadena con separadores, no como cuatro
     * fillText de un solo carácter, así que /^\d$/ no puede confundirlos).
     * Como window.__renderedTexts acumula todas las llamadas desde el
     * último clearRenderedTexts(), y pueden haber ocurrido varios frames
     * antes de leerlo, el número total de coincidencias es un múltiplo de
     * 4, no necesariamente 4 exactos.
     */
    expect(editableDigits.length).toBeGreaterThan(0);
    expect(editableDigits.length % 4).toBe(0);
    expect(editableDigits.every((digit) => digit === "0")).toBe(true);

    // Abrir el mecanismo del regalo pasa por WorldScene.interact(), que
    // dispara el SFX de interacción como primera sentencia -- comprobado
    // aquí en el navegador real vía window.__audioEvents, instrumentado por
    // disableAudioPlayback().
    expect(await countSfxPlayEvents(page, INTERACT_SFX_PATH)).toBe(1);
    expect(await countSfxPlayEvents(page, ACTIVATE_SFX_PATH)).toBe(0);
  });

  await test.step("falla una combinación y comprueba el mensaje exacto", async () => {
    await clearRenderedTexts();
    await page.keyboard.press("Enter");
    await waitForRenderedText(
      "Esta combinación no es la correcta. Repasa el cuaderno.",
    );

    // Un intento fallido no debe disparar el SFX de activación.
    expect(await countSfxPlayEvents(page, ACTIVATE_SFX_PATH)).toBe(0);
  });

  await test.step("introduce la combinación correcta y ve la pantalla del candado", async () => {
    await clearRenderedTexts();
    const keys = buildGiftCodeKeystrokes(GIFT_CODE_DIGITS);

    /*
     * A diferencia del resto de pulsaciones sueltas de este test, aquí se
     * repite la misma tecla (ArrowUp) muchas veces seguidas sin ninguna
     * aserción intermedia que ceda tiempo al bucle de render
     * (requestAnimationFrame). InputManager acumula las teclas pulsadas en
     * un Set por código (pressedCodes) que se vacía una sola vez por
     * frame: dos keydown del mismo código dentro del mismo frame colapsan
     * en una sola pulsación efectiva y se pierde un incremento de cifra
     * (comprobado empíricamente: sin esta espera, la combinación
     * introducida llegaba incompleta). Esperar a que el frame cambie tras
     * cada pulsación -- mismo patrón que pressAndWaitForFrameChange ya usa
     * en el resto de este archivo -- evita la colisión sin recurrir a
     * page.waitForTimeout.
     */
    for (const key of keys) {
      const previousFrame = await currentFrame();
      await page.keyboard.press(key);
      await waitForFrameChangeFrom(previousFrame);
    }

    await waitForRenderedText("COMBINACIÓN DEL CANDADO REAL");
    await waitForRenderedText(GIFT_CODE_DIGITS.join(" · "));

    // El último Enter de buildGiftCodeKeystrokes() confirma la combinación
    // correcta -- activación real del mecanismo del regalo -- disparando el
    // SFX de activación exactamente una vez.
    expect(await countSfxPlayEvents(page, ACTIVATE_SFX_PATH)).toBe(1);
  });

  await test.step("confirma y vuelve a la Plaza en su presentación de amanecer", async () => {
    await clearRenderedFillStyles();
    const solvedScreenFrame = await currentFrame();
    await page.keyboard.press("Enter");
    await waitForFrameChangeFrom(solvedScreenFrame);

    // Confirmar de nuevo en modo de solo lectura (ya resuelto) no repite el
    // SFX de activación.
    expect(await countSfxPlayEvents(page, ACTIVATE_SFX_PATH)).toBe(1);

    /*
     * WorldScene.render() sustituye this.map.palette por
     * this.map.dawnPalette cuando giftCodeSolved es verdadero en
     * axiom-plaza (src/scenes/WorldScene.js) — renderGround() pinta el
     * fondo con dawnPalette.groundA y el patrón de baldosas con
     * dawnPalette.groundB. Comparar contra la propia paleta importada
     * evita cualquier color hardcodeado en el test.
     */
    const renderedFillStyles = await page.evaluate(
      () => window.__renderedFillStyles,
    );
    const normalizedFillStyles = renderedFillStyles.map((style) =>
      style.toLowerCase(),
    );

    expect(normalizedFillStyles).toContain(dawnPalette.groundA.toLowerCase());
    expect(normalizedFillStyles).toContain(dawnPalette.groundB.toLowerCase());
  });

  await test.step("camina hasta la novia e interactúa", async () => {
    await page.keyboard.down("KeyD");
    await page.keyboard.down("KeyW");

    await expect(interactionPrompt).toHaveText(
      "[E] Hablar con Elena",
      { timeout: 10_000 },
    );

    await page.keyboard.up("KeyD");
    await page.keyboard.up("KeyW");

    await page.keyboard.press("KeyE");
    await expect(dialoguePanel).toBeVisible();

    // Segunda interacción real del recorrido (mecanismo del regalo +
    // novia): el SFX de interacción vuelve a dispararse, sin acumular el de
    // activación (que sigue en 1).
    expect(await countSfxPlayEvents(page, INTERACT_SFX_PATH)).toBe(2);
    expect(await countSfxPlayEvents(page, ACTIVATE_SFX_PATH)).toBe(1);
  });

  await test.step("recorre los cinco turnos exactos del diálogo final", async () => {
    await expect(dialogueSpeaker).toHaveText("Elena");
    await expect(dialogueText).toHaveText(
      "No quería saber si serías capaz de encontrarme. Quería que supieras que podías dejar de buscar.",
    );

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Gonzalo");
    await expect(dialogueText).toHaveText("Y aun así he venido.");

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Elena");
    await expect(dialogueText).toHaveText(
      "Entonces dime qué demuestra el teorema.",
    );

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Gonzalo");
    await expect(dialogueText).toHaveText(
      "Que ningún sí vale para siempre solo porque se pronunció una vez. Vale porque, pudiendo decir que no, hoy volvemos a elegirlo.",
    );

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Elena");
    await expect(dialogueText).toHaveText(
      "Eso era lo único que necesitaba comprobar antes de mañana.",
    );

    // Todavía dentro del quinto turno: no debe haberse entrado en credits.
    await expect(dialoguePanel).toBeVisible();
    const worldFrameBeforeCredits = await currentFrame();

    // Sexta pulsación: cierra el quinto turno -> completeBrideDialogue().
    await page.keyboard.press("KeyE");
    await expect(dialoguePanel).toBeHidden();
    await waitForFrameChangeFrom(worldFrameBeforeCredits);
  });

  await test.step("recorre los cinco pasos de CreditsScene con el texto exacto de cada uno", async () => {
    const closingShotTexts = await page.evaluate(
      () => window.__renderedTexts,
    );
    const closingLine = closingShotTexts
      .filter((text) => text !== "E / Enter: continuar")
      .join(" ");
    expect(closingLine).toContain(
      "No existe un sí para siempre. Existen dos personas que pueden volver a elegirse cada día.",
    );

    await clearRenderedTexts();
    await page.keyboard.press("KeyE");
    await waitForRenderedText("EL TEOREMA DEL SÍ");

    await clearRenderedTexts();
    await page.keyboard.press("KeyE");
    await waitForRenderedText("Gonzalo y Elena: que nunca os falten caminos");
    const dedicationTexts = await page.evaluate(() => window.__renderedTexts);
    expect(dedicationTexts).toContain(
      "demuestra cada día: elegiros una y otra vez.",
    );

    await clearRenderedTexts();
    await page.keyboard.press("KeyE");
    await waitForRenderedText("CREADO CON CARIÑO");
    const creditsTexts = await page.evaluate(() => window.__renderedTexts);
    expect(creditsTexts).toContain("COMO REGALO DE BODA");
    expect(creditsTexts).toContain("GRACIAS POR JUGAR");

    await clearRenderedTexts();
    await page.keyboard.press("KeyE");
    await waitForRenderedText("Pulsa para guardar y volver al menú");
  });

  await test.step("confirma la tarjeta final y comprueba el guardado tras volver al título", async () => {
    await clearRenderedTexts();
    await page.keyboard.press("KeyE");
    // El título principal "EL TEOREMA DEL SÍ" ahora coincide literalmente
    // entre TitleScene.js y el paso 2 de créditos, así que ya no sirve por
    // sí solo para distinguir ambas escenas. "Un regalo de boda" es el
    // subtítulo exclusivo de TitleScene.js (CreditsScene nunca lo dibuja),
    // así que confirma sin ambigüedad que se llegó al título real, no a una
    // reaparición del paso de créditos.
    await waitForRenderedText("Un regalo de boda");

    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );
    const savedData = JSON.parse(savedRaw);

    expect(savedData.formatVersion).toBe(4);
    expect(savedData.flags.investigationComplete).toBe(true);
    expect(savedData.flags.epilogueUnlocked).toBe(true);
    expect(savedData.flags.epilogueStarted).toBe(true);
    expect(savedData.flags.giftCodeSolved).toBe(true);
    expect(savedData.flags.epilogueCompleted).toBe(true);
    expect(savedData.scene).toBe("world");
    expect(savedData.world.currentMapId).toBe("axiom-plaza");
    expect(savedData.objectiveId).toBe("epilogue-completed");
    expect(savedData.player).toEqual(
      savedData.world.playerByMap["axiom-plaza"],
    );
    expect(Number.isFinite(savedData.player.x)).toBe(true);
    expect(Number.isFinite(savedData.player.y)).toBe(true);
    expect(["up", "down", "left", "right"]).toContain(
      savedData.player.facing,
    );

    const serializedSaveData = JSON.stringify(savedData);
    expect(serializedSaveData).not.toContain("{{FINAL_DEDICATION}}");
  });

  await test.step("carga la partida completada y confirma que no se reproduce nada automáticamente", async () => {
    await clearRenderedTexts();
    const titleAfterCreditsFrame = await currentFrame();
    await page.keyboard.press("KeyL");
    await waitForFrameChangeFrom(titleAfterCreditsFrame);

    await waitForRenderedText("Objetivo: La demostración ha terminado.");

    // No debe haber entrado automáticamente en credits ni en
    // epilogue-gift-code: si lo hubiera hecho, el texto del mundo
    // ("Objetivo: ...") nunca habría llegado a renderizarse, o el prompt de
    // interacción de más abajo no existiría (ambas escenas no muestran
    // #interaction-prompt).
    await expect(dialoguePanel).toBeHidden();

    await expect(interactionPrompt).toHaveText(
      "[E] Hablar con Elena",
    );

    // Interactuar con la novia ya completada la partida es un no-op: no
    // debe abrirse el panel de diálogo.
    await page.keyboard.press("KeyE");
    await expect(dialoguePanel).toBeHidden();

    // El jugador conserva movimiento.
    const frameBeforeMove = await currentFrame();
    await page.keyboard.down("KeyS");
    await expect.poll(currentFrame).not.toBe(frameBeforeMove);
    await page.keyboard.up("KeyS");

    // El cuaderno puede abrirse y cerrarse con normalidad.
    const notebook = page.locator("#notebook-panel");
    await page.keyboard.press("KeyQ");
    await expect(notebook).toBeVisible();

    // Regresión de presentación: la nota de la novia no tiene saltos de
    // línea, así que sigue ocupando un único párrafo, mientras que la pista
    // de la combinación se reparte en un párrafo por línea.
    const brideNoteEntry = page.locator(
      "#notebook-content article.notebook-entry",
      {
        has: page.locator("h2", {
          hasText: "Nota encontrada en la habitación",
        }),
      },
    );

    await expect(brideNoteEntry.locator("p")).toHaveCount(1);

    const clueEntry = page.locator("#notebook-content article.notebook-entry", {
      has: page.locator("h2", { hasText: "La combinación del candado" }),
    });

    await expect(clueEntry.locator("p")).toHaveText([...GIFT_CODE_CLUE_LINES]);

    await page.keyboard.press("KeyQ");
    await expect(notebook).toBeHidden();

    // El guardado normal sigue operativo.
    const toast = page.locator("#toast");
    await page.keyboard.press("KeyK");
    await expect(toast).toHaveText("Partida guardada");

    const savedAfterNormalSaveRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );
    const savedAfterNormalSave = JSON.parse(savedAfterNormalSaveRaw);
    expect(savedAfterNormalSave.flags.epilogueCompleted).toBe(true);
    expect(savedAfterNormalSave.objectiveId).toBe("epilogue-completed");
  });

  await test.step("el mecanismo del regalo conserva su consulta de solo lectura", async () => {
    const worldFrameBeforeMechanism = await currentFrame();

    await page.keyboard.down("KeyA");
    await page.keyboard.down("KeyS");
    await expect(interactionPrompt).toHaveText(
      "[E] Examinar Mecanismo del regalo",
      { timeout: 10_000 },
    );
    await page.keyboard.up("KeyA");
    await page.keyboard.up("KeyS");

    await clearRenderedTexts();
    await page.keyboard.press("KeyE");
    await waitForRenderedText("COMBINACIÓN DEL CANDADO REAL");
    await waitForRenderedText(GIFT_CODE_DIGITS.join(" · "));

    const stateBeforeCancel = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );

    const readOnlyFrame = await currentFrame();
    await page.keyboard.press("Escape");
    await waitForFrameChangeFrom(readOnlyFrame);

    const stateAfterCancel = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );
    expect(stateAfterCancel).toBe(stateBeforeCancel);

    void worldFrameBeforeMechanism;
  });

  expect(errors).toEqual([]);
});

/*
 * Compatibilidad con guardados reales de v1.0.0 (tag `v1.0.0`, commit
 * ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733), Caso C de
 * tests/state/GameStateV1SaveCompatibility.test.js: un guardado con la
 * forma exacta que produciría GameState.toSaveData() con los tres
 * puzles y el código del regalo ya resueltos (giftCodeSolved:true) pero
 * el epílogo sin completar. No recorre el diálogo completo ni los
 * créditos -- eso ya lo cubre el test anterior de este archivo -- solo
 * confirma que, tras restaurar ese guardado histórico en el runtime
 * v1.1 (mapas y NPCs ambientales rediseñados), `bride-epilogue` sigue
 * siendo alcanzable: requiresFlag:"giftCodeSolved" se evalúa
 * correctamente y el prompt de interacción real muestra el nombre de la
 * novia.
 */
test("Caso C de compatibilidad con guardados de v1.0.0: giftCodeSolved restaurado hace alcanzable a la novia en la Plaza", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const savedGame = {
    formatVersion: 4,
    savedAt: "2026-08-11T00:00:00.000Z",
    scene: "world",
    player: { x: 576, y: 325, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 576, y: 325, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        // (224,176) en vez de (192,145): la última posición colisiona con
        // archive-criteria-table tanto hoy como en v1.0.0 (ver
        // tests/state/GameStateV1SaveCompatibility.test.js,
        // buildCaseCFixture()) -- este dato es inerte en este test concreto
        // (currentMapId sigue en axiom-plaza), pero se alinea con el
        // fixture unitario para que la misma "instantánea" de guardado no
        // quede representada con una posición físicamente imposible aquí y
        // corregida allí.
        archive: { x: 224, y: 176, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: true,
      giftCodeSolved: true,
      epilogueCompleted: false,
    },
    objectiveId: "epilogue-meet-bride",
    notebook: [
      {
        id: "bride-note",
        title: "Nota encontrada en la habitación",
        text:
          "Antes de mañana tengo que comprobar una cosa. Si no he vuelto al anochecer, sigue el camino de los siete puentes. No confíes en el mapa completo: uno de ellos nunca estuvo abierto.",
      },
      {
        id: "library-clue",
        title: "La marca de la biblioteca",
        text:
          "La anotación encontrada junto al embarcadero contiene dos arcos entrelazados y una referencia al archivo de mapas de la Biblioteca del Margen.",
      },
      {
        id: "p2-bridges-solution",
        title: "El paseo imposible",
        text:
          "No era necesario cruzar los siete puentes. Al reconocer cuál estaba cerrado, los seis restantes formaban un recorrido posible desde la entrada hasta el molino.",
      },
      {
        id: "library-catalogue-solution",
        title: "El catálogo perfecto",
        text:
          "El orden A-D-R-C-M ha restaurado el catálogo y revelado el acceso al Archivo.",
      },
      {
        id: "archive-final-evidence",
        title: "La pregunta correcta",
        text:
          "El Archivo conserva dos declaraciones presentes coincidentes y confirma que no dispone de observaciones futuras.",
      },
      {
        id: "epilogue-combination-clue",
        title: "La combinación del candado",
        text: GIFT_CODE_CLUE_LINES.join("\n"),
      },
    ],
    puzzles: {
      p2: {
        lifecycle: { id: "p2-bridges", status: "solved", attemptCount: 1 },
        phase: "solved",
        closedBridgeId: "B1",
        currentNode: "L",
        route: ["E", "R", "N", "L", "R", "M", "L"],
        usedBridgeIds: ["B2", "B3", "B6", "B7", "B4", "B5"],
        hintsRead: [1],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": "confirmed",
          "followed-trail": "confirmed",
          "never-disagreed": "contradicted",
          "someone-refuses-now": "contradicted",
          "present-choice": "confirmed",
          "universal-future": "undecidable",
        },
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
    },
  };

  await page.addInitScript((data) => {
    localStorage.setItem(
      "el-teorema-del-si.save.v1",
      JSON.stringify(data),
    );
  }, savedGame);

  await disableAudioPlayback(page);
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const interactionPrompt = page.locator("#interaction-prompt");

  const titleFrame = await canvas.evaluate((element) =>
    element.toDataURL(),
  );
  await page.keyboard.press("KeyL");
  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(titleFrame);

  /*
   * Misma posición y misma combinación de movimiento (KeyD+KeyW
   * mantenidas) que ya usa con éxito, en este mismo archivo, el test
   * "recorre el epílogo completo..." para alcanzar bride-epilogue
   * (x:650 y:260 interactionRadius:28 en src/content/worldMaps.js) desde
   * axiom-plaza x:576 y:325 -- reutilizar un recorrido ya probado en el
   * runtime v1.1 actual reduce el riesgo de que este test dependa de una
   * ruta de colisión inventada sin verificar.
   */
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyW");

  await expect(interactionPrompt).toHaveText(
    `[E] Hablar con ${PARTNER_NAME}`,
    { timeout: 10_000 },
  );

  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyW");

  expect(errors).toEqual([]);
});

/*
 * Los tests siguientes cubren en el navegador real el ciclo de vida de
 * audio de WorldScene.js que hasta ahora solo tenía cobertura unitaria
 * (con FakeScenes, que no reproduce fielmente que SceneManager.change()
 * invoca el exit() real de la escena saliente): el disparo narrativo real
 * de la música ambiental (completar el diálogo con el padre de la novia),
 * cancelar desde dentro del mundo (debe detener la música antes de volver
 * al título), cargar una partida estando ya dentro del mundo
 * (WorldScene.update(), tecla "load", debe reconciliar el audio contra el
 * estado recién restaurado en vez de dejar sonando lo que hubiera antes),
 * cargar directamente desde el título una partida con el epílogo ya
 * completado (no debe dejar nada sonando en loop), y que el opening suena
 * de forma continua y sin re-disparo desde el título hasta entrar al
 * mundo en una partida nueva.
 *
 * WorldScene.enter() (ver syncMusicToFlags() en src/scenes/WorldScene.js)
 * sigue siendo la única autoridad final de qué música suena, pero
 * TitleScene también dispara el opening de forma optimista antes de
 * cambiar a "world" (salvo que un peek del save indique que corresponde
 * saltárselo -- ver TitleScene.savedGameSkipsOpening()). Como
 * WorldScene.enter() corrige o confirma en el mismo tick síncrono, y
 * AudioService.playMusic() es un no-op cuando el src ya está activo,
 * ninguno de estos tests depende de ningún temporizador ni de entrar dos
 * veces en una escena para forzar un estado de audio concreto -- siembran
 * directamente `localStorage` con el guardado que corresponda y comprueban
 * el resultado observable a través de `window.__audioEvents`.
 */

function stripLeadingDotSlash(path) {
  return path.replace(/^\.\//, "");
}

test("completar el diálogo con el padre de la novia dispara la música ambiental, sustituyendo al opening", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const SAVE_KEY = "el-teorema-del-si.save.v1";

  const readyPuzzles = {
    libraryCatalogue: {
      order: ["C", "M", "A", "R", "D"],
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
    archiveCriteria: {
      verdicts: {
        "voluntary-entry": null,
        "followed-trail": null,
        "never-disagreed": null,
        "someone-refuses-now": null,
        "present-choice": null,
        "universal-future": null,
      },
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
  };

  /*
   * Jugador ya colocado dentro del radio de interacción de bride-father
   * (x:304 y:176 width:14 height:18 interactionRadius:28 en
   * src/content/worldMaps.js, centro en x:311 y:185) y con el tablón de
   * preparativos ya leído, para ejercitar solo el paso que importa a este
   * test -- completar el diálogo del padre -- sin tener que recorrer a
   * pie el resto de la Plaza del Axioma primero.
   */
  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 311, y: 185, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 311, y: 185, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: false,
      sevenBridgesUnlocked: false,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "speak-to-bride-father",
    notebook: [],
    puzzles: readyPuzzles,
  };

  await page.addInitScript((data) => {
    localStorage.setItem("el-teorema-del-si.save.v1", JSON.stringify(data));
  }, savedGame);

  await disableAudioPlayback(page, { resolvePlayback: true });
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");
  const currentFrame = () =>
    canvas.evaluate((element) => element.toDataURL());
  const readAudioEvents = () => page.evaluate(() => window.__audioEvents);
  const ambientSrcSuffix = stripLeadingDotSlash(AMBIENT_THEME_PATH);
  const openingSrcSuffix = stripLeadingDotSlash(OPENING_THEME_PATH);

  const titleFrame = await currentFrame();

  // La tecla "L" (cargar) restaura una partida sin brideNoteReceived ni
  // epilogueCompleted, así que WorldScene.enter() arranca el opening en
  // loop por su propia autoridad (syncMusicToFlags()) al restaurar el
  // estado -- justo la condición que este test necesita para comprobar
  // después que el disparo narrativo del padre de la novia lo sustituye.
  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  await expect
    .poll(async () => {
      const events = await readAudioEvents();
      return events.some(
        (event) =>
          event.type === "play" && event.src.endsWith(openingSrcSuffix),
      );
    })
    .toBe(true);

  const ambientPlayedBeforeDialogue = (await readAudioEvents()).some(
    (event) => event.type === "play" && event.src.endsWith(ambientSrcSuffix),
  );
  expect(ambientPlayedBeforeDialogue).toBe(false);

  // Abre el diálogo del padre de la novia (primera vez, sin
  // brideNoteReceived): interactWithBrideFather() lo compone con cinco
  // líneas, así que hacen falta cinco pulsaciones más para completarlo.
  await page.keyboard.press("KeyE");

  const dialogueSpeaker = page.locator("#dialogue-speaker");
  const dialogueTextLocator = page.locator("#dialogue-text");
  const dialoguePanel = page.locator("#dialogue-panel");
  await expect(dialogueSpeaker).toHaveText("Padre de la novia");

  /*
   * InputManager acumula las teclas pulsadas en un Set por código que se
   * vacía una sola vez por frame (requestAnimationFrame): pulsar la misma
   * tecla varias veces seguidas sin ceder tiempo entre medias colapsa
   * varias pulsaciones en una sola efectiva (mismo problema, y misma
   * solución, que ya documenta buildGiftCodeKeystrokes() más arriba en
   * este archivo). Espera a que cambie el texto de la línea de diálogo
   * entre pulsación y pulsación en vez de encadenarlas sin más.
   */
  const brideFatherLineCount = 5;
  for (let i = 0; i < brideFatherLineCount - 1; i += 1) {
    const previousLine = await dialogueTextLocator.textContent();
    await page.keyboard.press("KeyE");
    await expect
      .poll(() => dialogueTextLocator.textContent())
      .not.toBe(previousLine);
  }

  // Última pulsación: completa el diálogo, cierra el panel y ejecuta
  // interactWithBrideFather().onComplete().
  await page.keyboard.press("KeyE");
  await expect(dialoguePanel).toBeHidden();

  await expect(toast).toHaveText("Nota añadida al cuaderno");

  await expect
    .poll(async () => {
      const events = await readAudioEvents();
      return events.some(
        (event) => event.type === "play" && event.src.endsWith(ambientSrcSuffix),
      );
    })
    .toBe(true);

  // El diálogo completado no autoguarda -- confirma que brideNoteReceived
  // pasó a true guardando ahora la partida (tecla "K") y leyendo el
  // guardado real resultante, en vez de depender solo del efecto
  // observable en audio.
  await page.keyboard.press("KeyK");
  await expect(toast).toHaveText("Partida guardada");

  const savedAfterCompletion = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    SAVE_KEY,
  );
  expect(savedAfterCompletion.flags.brideNoteReceived).toBe(true);

  expect(errors).toEqual([]);
});

test("cancelar dentro del mundo detiene la música ambiental antes de volver al título", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);

  const readyPuzzles = {
    libraryCatalogue: {
      order: ["C", "M", "A", "R", "D"],
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
    archiveCriteria: {
      verdicts: {
        "voluntary-entry": null,
        "followed-trail": null,
        "never-disagreed": null,
        "someone-refuses-now": null,
        "present-choice": null,
        "universal-future": null,
      },
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
  };

  const savedGame = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 240, y: 192, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: readyPuzzles,
  };

  await page.addInitScript((data) => {
    localStorage.setItem("el-teorema-del-si.save.v1", JSON.stringify(data));
  }, savedGame);

  await disableAudioPlayback(page, { resolvePlayback: true });
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const currentFrame = () =>
    canvas.evaluate((element) => element.toDataURL());
  const readAudioEvents = () => page.evaluate(() => window.__audioEvents);
  const ambientSrcSuffix = stripLeadingDotSlash(AMBIENT_THEME_PATH);

  const titleFrame = await currentFrame();

  /*
   * brideNoteReceived:true en el guardado sembrado hace que
   * WorldScene.enter() arranque el ambiental de inmediato al restaurar la
   * partida, sin depender de la intro ni de ningún temporizador. Con
   * resolvePlayback:true ese play() resuelve en vez de rechazar, así que
   * AudioService.activeMusic permanece asignado al elemento del ambiental
   * hasta que algo lo detenga de verdad -- justo la condición necesaria
   * para comprobar que cancelar lo detiene.
   */
  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  await expect
    .poll(async () => {
      const events = await readAudioEvents();
      return events.some(
        (event) =>
          event.type === "play" && event.src.endsWith(ambientSrcSuffix),
      );
    })
    .toBe(true);

  /*
   * WorldScene.update() llama a audio.stopMusic() de forma síncrona antes
   * de scenes.change("title"), así que la llamada a pause() ya ha
   * ocurrido en el momento en que el frame vuelve a coincidir con el del
   * título -- aunque la comprobación de window.__audioEvents se lea
   * después en este test, el evento en sí quedó registrado antes.
   */
  await page.keyboard.press("Escape");
  await expect.poll(currentFrame).toBe(titleFrame);

  const audioEvents = await readAudioEvents();
  const ambientPauseEvents = audioEvents.filter(
    (event) => event.type === "pause" && event.src.endsWith(ambientSrcSuffix),
  );

  expect(ambientPauseEvents.length).toBeGreaterThan(0);

  expect(errors).toEqual([]);
});

test("cargar una partida con epílogo completado desde dentro del mundo detiene el ambiental sin reanudarlo", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);
  const SAVE_KEY = "el-teorema-del-si.save.v1";

  const readyPuzzles = {
    libraryCatalogue: {
      order: ["C", "M", "A", "R", "D"],
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
    archiveCriteria: {
      verdicts: {
        "voluntary-entry": null,
        "followed-trail": null,
        "never-disagreed": null,
        "someone-refuses-now": null,
        "present-choice": null,
        "universal-future": null,
      },
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
  };

  const inProgressSave = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 240, y: 192, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [],
    puzzles: readyPuzzles,
  };

  /*
   * Mismos valores de bandera que ya usa buildEpilogueReadySaveData() más
   * arriba en este archivo para un epílogo completado, pero construidos
   * a mano: GameState.restore() exige que epilogueCompleted implique
   * giftCodeSolved, que a su vez implique epilogueStarted, que a su vez
   * implique epilogueUnlocked, que a su vez implique
   * investigationComplete (assertEpilogueFlagInvariants en
   * src/state/GameState.js) -- si alguna quedara en false, restore()
   * lanzaría y el test fallaría con un error claro en vez de una
   * aserción confusa más adelante.
   */
  const completedSave = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 240, y: 192, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: true,
      giftCodeSolved: true,
      epilogueCompleted: true,
    },
    objectiveId: "epilogue-completed",
    notebook: [],
    puzzles: readyPuzzles,
  };

  await page.addInitScript((data) => {
    localStorage.setItem("el-teorema-del-si.save.v1", JSON.stringify(data));
  }, inProgressSave);

  await disableAudioPlayback(page, { resolvePlayback: true });
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const toast = page.locator("#toast");
  const currentFrame = () =>
    canvas.evaluate((element) => element.toDataURL());
  const readAudioEvents = () => page.evaluate(() => window.__audioEvents);
  const ambientSrcSuffix = stripLeadingDotSlash(AMBIENT_THEME_PATH);

  const titleFrame = await currentFrame();

  /*
   * brideNoteReceived:true en inProgressSave hace que WorldScene.enter()
   * arranque el ambiental de inmediato al restaurar la partida -- esta es
   * la partida en curso, real, dentro del mundo, que el test necesita
   * como punto de partida antes de forzar la rama "load" de
   * WorldScene.update() sobre sí misma.
   */
  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  await expect
    .poll(async () => {
      const events = await readAudioEvents();
      return events.some(
        (event) =>
          event.type === "play" && event.src.endsWith(ambientSrcSuffix),
      );
    })
    .toBe(true);

  /*
   * Sin salir del mundo, sustituye el guardado por uno con
   * epilogueCompleted:true -- mismo mecanismo que ya usan los tests de
   * reload de este archivo para manipular localStorage directamente en
   * vez de jugar el epílogo completo. El siguiente "KeyL" lo carga desde
   * dentro de WorldScene.update() (una ruta distinta de restaurar al
   * entrar desde el título) y debe forzar la rama de
   * reconcileAudioAfterLoad() que detiene la música en vez de arrancar
   * el ambiental.
   */
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: SAVE_KEY, data: completedSave },
  );

  await page.keyboard.press("KeyL");
  await expect(toast).toHaveText("Partida cargada");

  const audioEvents = await readAudioEvents();
  const lastAmbientPauseIndex = audioEvents.findLastIndex(
    (event) => event.type === "pause" && event.src.endsWith(ambientSrcSuffix),
  );

  expect(lastAmbientPauseIndex).toBeGreaterThan(-1);

  const ambientPlayEventsAfterLastPause = audioEvents
    .slice(lastAmbientPauseIndex + 1)
    .filter(
      (event) =>
        event.type === "play" && event.src.endsWith(ambientSrcSuffix),
    );

  expect(ambientPlayEventsAfterLastPause).toEqual([]);

  expect(errors).toEqual([]);
});

test("cargar desde el título una partida con el epílogo ya completado no deja ningún opening ni ambiental sonando en loop", async ({
  page,
}) => {
  test.setTimeout(60_000);

  const errors = collectJavaScriptErrors(page);

  const readyPuzzles = {
    libraryCatalogue: {
      order: ["C", "M", "A", "R", "D"],
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
    archiveCriteria: {
      verdicts: {
        "voluntary-entry": null,
        "followed-trail": null,
        "never-disagreed": null,
        "someone-refuses-now": null,
        "present-choice": null,
        "universal-future": null,
      },
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
  };

  /*
   * Este guardado NO tiene epilogueCompleted:true todavía -- a propósito.
   * Sembrar directamente epilogueCompleted:true y cargarlo desde un
   * título recién llegado (versión anterior de este test) es trivialmente
   * cierto incluso sin this.audio.stopMusic() en la rama epilogueCompleted
   * de syncMusicToFlags(): si nunca sonó nada en la página, ninguna
   * aserción de "nada suena" puede distinguir "se detuvo explícitamente"
   * de "nunca hubo nada que detener".
   *
   * En su lugar, este guardado deja al jugador justo junto a la novia
   * (giftCodeSolved:true) para que el propio flujo real del juego --no
   * este test-- dispare audio.playEpilogueTheme() al completar el
   * diálogo final (WorldScene.completeBrideDialogue()), lo deje activo
   * durante CreditsScene y TitleScene (ninguna de las dos tiene lógica de
   * audio propia -- ver sus comentarios) y solo entonces se cargue, con
   * la tecla "L" desde el título -- la misma ruta
   * TitleScene -> WorldScene.enter({restoreFromState:true}) que cubre la
   * regresión-- el guardado real que CreditsScene.confirmFinalCard() ya
   * generó con epilogueCompleted:true. Si se quitara
   * this.audio.stopMusic() de esa rama, el tema del epílogo que quedó
   * activo desde el paso anterior nunca se pausaría al hacer esa última
   * carga, y la aserción final de este test fallaría.
   */
  const readyToMeetBrideSave = {
    formatVersion: 4,
    savedAt: new Date(0).toISOString(),
    scene: "world",
    player: { x: 650, y: 270, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 650, y: 270, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 145, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: true,
      giftCodeSolved: true,
      epilogueCompleted: false,
    },
    objectiveId: "epilogue-meet-bride",
    notebook: [],
    puzzles: readyPuzzles,
  };

  // Parche de fillText igual al que ya usa el test "recorre el epílogo
  // completo...", inyectado antes de que cargue el juego, sin tocar
  // ningún archivo de src/: EpilogueGiftCodeScene y CreditsScene no usan
  // el DOM, así que es la única forma de confirmar por texto exacto que
  // se llegó de verdad al título real.
  await page.addInitScript(() => {
    window.__renderedTexts = [];

    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function patchedFillText(
      text,
      x,
      y,
      maxWidth,
    ) {
      window.__renderedTexts.push(String(text));
      return originalFillText.call(this, text, x, y, maxWidth);
    };
  });

  await page.addInitScript((data) => {
    localStorage.setItem("el-teorema-del-si.save.v1", JSON.stringify(data));
  }, readyToMeetBrideSave);

  await disableAudioPlayback(page, { resolvePlayback: true });
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const interactionPrompt = page.locator("#interaction-prompt");
  const dialoguePanel = page.locator("#dialogue-panel");
  const dialogueText = page.locator("#dialogue-text");
  const currentFrame = () =>
    canvas.evaluate((element) => element.toDataURL());
  const readAudioEvents = () => page.evaluate(() => window.__audioEvents);
  const ambientSrcSuffix = stripLeadingDotSlash(AMBIENT_THEME_PATH);
  const openingSrcSuffix = stripLeadingDotSlash(OPENING_THEME_PATH);
  const epilogueThemeSrcSuffix = stripLeadingDotSlash(EPILOGUE_THEME_PATH);
  const waitForRenderedText = (text) =>
    expect
      .poll(() =>
        page.evaluate(
          (needle) => window.__renderedTexts.includes(needle),
          text,
        ),
      )
      .toBe(true);

  const titleFrame = await currentFrame();

  await test.step("cargar la partida en curso, con la novia ya alcanzable", async () => {
    await page.keyboard.press("KeyL");
    await expect.poll(currentFrame).not.toBe(titleFrame);

    await expect(interactionPrompt).toHaveText("[E] Hablar con Elena");

    // brideNoteReceived:true dispara el ambiental de inmediato al
    // restaurar (WorldScene.enter() -> syncMusicToFlags()) -- confirma
    // que esta primera carga sí dejó algo sonando de verdad, la base
    // necesaria para que la comprobación final de este test sea un
    // guardián real.
    await expect
      .poll(async () => {
        const events = await readAudioEvents();
        return events.some(
          (event) =>
            event.type === "play" && event.src.endsWith(ambientSrcSuffix),
        );
      })
      .toBe(true);
  });

  await test.step("completa el diálogo final con la novia", async () => {
    await page.keyboard.press("KeyE");
    await expect(dialoguePanel).toBeVisible();

    let previousLine = await dialogueText.textContent();

    for (let turn = 0; turn < 5; turn += 1) {
      await page.keyboard.press("KeyE");

      if (turn < 4) {
        await expect.poll(() => dialogueText.textContent()).not.toBe(
          previousLine,
        );
        previousLine = await dialogueText.textContent();
      } else {
        await expect(dialoguePanel).toBeHidden();
      }
    }

    // completeBrideDialogue() llama a audio.playEpilogueTheme() antes de
    // cambiar a "credits" -- confirma que de verdad quedó sonando.
    await expect
      .poll(async () => {
        const events = await readAudioEvents();
        return events.some(
          (event) =>
            event.type === "play" &&
            event.src.endsWith(epilogueThemeSrcSuffix),
        );
      })
      .toBe(true);
  });

  await test.step("recorre CreditsScene y confirma la tarjeta final", async () => {
    for (let step = 0; step < 5; step += 1) {
      const frameBeforeStep = await currentFrame();
      await page.keyboard.press("KeyE");
      await expect.poll(currentFrame).not.toBe(frameBeforeStep);
    }

    // El título principal "EL TEOREMA DEL SÍ" ahora coincide literalmente
    // entre TitleScene.js y el paso de título de CreditsScene, así que ya
    // no sirve por sí solo para distinguir ambas escenas. "Un regalo de
    // boda" es el subtítulo exclusivo de TitleScene.js (CreditsScene nunca
    // lo dibuja), así que confirma sin ambigüedad que confirmFinalCard()
    // completó el guardado real y volvió al título real, no que se quedó
    // en algún paso de créditos.
    await waitForRenderedText("Un regalo de boda");

    const savedRaw = await page.evaluate(() =>
      localStorage.getItem("el-teorema-del-si.save.v1"),
    );
    const savedData = JSON.parse(savedRaw);
    expect(savedData.flags.epilogueCompleted).toBe(true);
  });

  const audioEventsBeforeFinalLoad = await readAudioEvents();

  /*
   * Ni CreditsScene ni TitleScene tienen ninguna lógica de audio propia
   * (ver sus comentarios) -- confirma que, justo antes de la carga final,
   * el tema del epílogo sigue activo, sin ningún pause() de por medio.
   * Si esta comprobación fallara, el resto del test no demostraría nada:
   * ya no quedaría nada sonando que this.audio.stopMusic() tuviera que
   * detener.
   */
  const epilogueThemePauseEventsBeforeFinalLoad =
    audioEventsBeforeFinalLoad.filter(
      (event) =>
        event.type === "pause" &&
        event.src.endsWith(epilogueThemeSrcSuffix),
    );
  expect(epilogueThemePauseEventsBeforeFinalLoad).toEqual([]);

  const titleFrameBeforeFinalLoad = await currentFrame();

  // Última carga: título -> WorldScene.enter({restoreFromState:true}) ->
  // load() -> syncMusicToFlags() con epilogueCompleted:true, exactamente
  // la ruta que este test debe vigilar.
  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrameBeforeFinalLoad);

  // Da tiempo a que cualquier disparo de audio erróneo tuviera ocasión de
  // ocurrir (un par de frames de margen) antes de comprobar los eventos.
  await page.waitForTimeout(200);

  const audioEventsAfterFinalLoad = await readAudioEvents();
  const newAudioEvents = audioEventsAfterFinalLoad.slice(
    audioEventsBeforeFinalLoad.length,
  );

  const epilogueThemePauseEventsAfterFinalLoad = newAudioEvents.filter(
    (event) =>
      event.type === "pause" && event.src.endsWith(epilogueThemeSrcSuffix),
  );

  // La comprobación que de verdad depende de this.audio.stopMusic() en la
  // rama epilogueCompleted de syncMusicToFlags(): sin esa línea, el tema
  // del epílogo que quedó activo desde el paso anterior nunca se
  // pausaría al cargar desde el título.
  expect(epilogueThemePauseEventsAfterFinalLoad.length).toBeGreaterThan(0);

  const loopingPlayEvents = newAudioEvents.filter(
    (event) =>
      event.type === "play" &&
      (event.src.endsWith(ambientSrcSuffix) ||
        event.src.endsWith(openingSrcSuffix)),
  );

  expect(loopingPlayEvents).toEqual([]);

  expect(errors).toEqual([]);
});

test("el opening suena de forma continua, sin re-disparo, desde el título hasta entrar al mundo en una partida nueva", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);

  await disableAudioPlayback(page, { resolvePlayback: true });
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const currentFrame = () =>
    canvas.evaluate((element) => element.toDataURL());
  const readAudioEvents = () => page.evaluate(() => window.__audioEvents);
  const openingSrcSuffix = stripLeadingDotSlash(OPENING_THEME_PATH);

  const titleFrame = await currentFrame();

  const audioEventsAtTitle = await readAudioEvents();
  expect(audioEventsAtTitle).toEqual([]);

  // "E" en el título inicia una partida nueva: TitleScene.update() dispara
  // el opening en loop de forma optimista en la misma pasada síncrona en
  // que cambia a WorldScene, que confirma la misma pista vía
  // syncMusicToFlags() -- un no-op por AudioService.playMusic(), así que
  // solo debe registrarse un único evento "play" del opening, no dos.
  await page.keyboard.press("KeyE");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  await expect
    .poll(async () => {
      const events = await readAudioEvents();
      return events.filter(
        (event) =>
          event.type === "play" && event.src.endsWith(openingSrcSuffix),
      ).length;
    })
    .toBe(1);

  // Ningún evento "pause" del opening debería haber ocurrido todavía: la
  // pista sigue sonando de forma continua, sin interrupción ni
  // re-disparo, mientras el jugador permanece dentro del mundo antes de
  // completar el diálogo con el padre de la novia.
  const audioEventsAfterEntry = await readAudioEvents();
  const openingPauseEvents = audioEventsAfterEntry.filter(
    (event) => event.type === "pause" && event.src.endsWith(openingSrcSuffix),
  );
  expect(openingPauseEvents).toEqual([]);

  expect(errors).toEqual([]);
});
