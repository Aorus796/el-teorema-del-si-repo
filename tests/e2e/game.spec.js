import { expect, test } from "@playwright/test";
import { AMBIENT_THEME_PATH } from "../../src/content/ambientAudioConfig.js";
import { GIFT_CODE_DIGITS } from "../../src/content/epilogueConfig.js";
import { GameState } from "../../src/state/GameState.js";
import { getWorldMap } from "../../src/content/worldMaps.js";

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

  await expect(page).toHaveTitle(
    "El Teorema del Si - Prototipo tecnico",
  );

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
    "La novia ha marcado que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  const solutionKeys = [
    "KeyE",
    "Enter",
    "KeyE",
    "KeyE",
    "KeyE",
    "ArrowRight",
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
  expect(savedData.puzzles.p2.closedBridgeId).toBe("B1");
  expect(savedData.puzzles.p2.currentNode).toBe("L");
  expect(savedData.puzzles.p2.route).toEqual([
    "E",
    "R",
    "N",
    "L",
    "R",
    "M",
    "L",
  ]);
  expect(savedData.puzzles.p2.usedBridgeIds).toEqual([
    "B2",
    "B3",
    "B6",
    "B7",
    "B4",
    "B5",
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
        closedBridgeId: "B1",
        currentNode: "R",
        route: ["E", "R"],
        usedBridgeIds: ["B2"],
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
    "La novia ha marcado que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // Cruza B3 (R -> N): en R hay tres salidas disponibles tras excluir B1
  // (cerrado) y B2 (usado) -- B3, B4 y B7 -- pero selectedMoveIndex
  // arranca en 0 y B3 es la primera en el orden de P2_GRAPH.bridges, así
  // que un solo KeyE (sin ArrowLeft/ArrowRight) la selecciona y la cruza.
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
  expect(firstSave.puzzles.p2.closedBridgeId).toBe("B1");
  expect(firstSave.puzzles.p2.currentNode).toBe("N");
  expect(firstSave.puzzles.p2.route).toEqual(["E", "R", "N"]);
  expect(firstSave.puzzles.p2.usedBridgeIds).toEqual(["B2", "B3"]);
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
    "La novia ha marcado que uno de ellos estaba cerrado.",
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
   * Cruza B6 (N -> L): única salida disponible en N tras excluir B1
   * (cerrado) y B3 (usado). Este movimiento solo produce el resultado
   * esperado si el recorrido se restauró de verdad en currentNode "N";
   * de lo contrario el puzle habría reanudado en otro nodo y esta acción
   * fallaría o produciría un resultado distinto.
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
  expect(secondSave.puzzles.p2.closedBridgeId).toBe("B1");
  expect(secondSave.puzzles.p2.currentNode).toBe("L");
  expect(secondSave.puzzles.p2.route).toEqual(["E", "R", "N", "L"]);
  expect(secondSave.puzzles.p2.usedBridgeIds).toEqual([
    "B2",
    "B3",
    "B6",
  ]);
  expect(secondSave.puzzles.p2.lifecycle.status).toBe("active");
  expect(secondSave.puzzles.p2.lifecycle.attemptCount).toBe(1);
  expect(secondSave.puzzles.p2.failureCode).toBe(null);

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
      p2: {
        lifecycle: { status: "active", attemptCount: 1 },
        phase: "traversing",
        closedBridgeId: "B1",
        currentNode: "R",
        route: ["E", "R"],
        usedBridgeIds: ["B2"],
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
    "La novia ha marcado que uno de ellos estaba cerrado.",
  );

  await page.keyboard.press("KeyE");

  await expect(dialogueText).toHaveText(
    "Encuentra un recorrido que cruce todos los demás una sola vez.",
  );

  await page.keyboard.press("KeyE");

  await expect
    .poll(() => canvas.evaluate((element) => element.toDataURL()))
    .not.toBe(worldFrame);

  // Cruza B3 (R -> N): en R hay tres movimientos disponibles tras excluir
  // B2 (usado) -- B3, B4 y B7 (B1 conecta E-N y no toca R, así que no
  // afecta a las opciones desde aquí) -- pero selectedMoveIndex arranca
  // en 0 y B3 es la primera en el orden de P2_GRAPH.bridges, así que un
  // solo KeyE (sin ArrowLeft/ArrowRight) la selecciona y la cruza.
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
  expect(savedData.puzzles.p2.closedBridgeId).toBe("B1");
  expect(savedData.puzzles.p2.currentNode).toBe("N");
  expect(savedData.puzzles.p2.route).toEqual(["E", "R", "N"]);
  expect(savedData.puzzles.p2.usedBridgeIds).toEqual(["B2", "B3"]);
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
  });

  await test.step("falla una combinación y comprueba el mensaje exacto", async () => {
    await clearRenderedTexts();
    await page.keyboard.press("Enter");
    await waitForRenderedText(
      "Esta combinación no es la correcta. Repasa el cuaderno.",
    );
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
  });

  await test.step("confirma y vuelve a la Plaza en su presentación de amanecer", async () => {
    await clearRenderedFillStyles();
    const solvedScreenFrame = await currentFrame();
    await page.keyboard.press("Enter");
    await waitForFrameChangeFrom(solvedScreenFrame);

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
      "[E] Hablar con la novia",
      { timeout: 10_000 },
    );

    await page.keyboard.up("KeyD");
    await page.keyboard.up("KeyW");

    await page.keyboard.press("KeyE");
    await expect(dialoguePanel).toBeVisible();
  });

  await test.step("recorre los cinco turnos exactos del diálogo final", async () => {
    await expect(dialogueSpeaker).toHaveText("Novia");
    await expect(dialogueText).toHaveText(
      "No quería saber si serías capaz de encontrarme. Quería que supieras que podías dejar de buscar.",
    );

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Protagonista");
    await expect(dialogueText).toHaveText("Y aun así he venido.");

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Novia");
    await expect(dialogueText).toHaveText(
      "Entonces dime qué demuestra el teorema.",
    );

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Protagonista");
    await expect(dialogueText).toHaveText(
      "Que ningún sí vale para siempre solo porque se pronunció una vez. Vale porque, pudiendo decir que no, hoy volvemos a elegirlo.",
    );

    await page.keyboard.press("KeyE");
    await expect(dialogueSpeaker).toHaveText("Novia");
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
    // "EL TEOREMA DEL SI" (sin tilde) es el texto literal de TitleScene.js,
    // deliberadamente distinto de "EL TEOREMA DEL SÍ" (con tilde) del paso 2
    // de créditos -- confirma sin ambigüedad que se llegó al título real,
    // no a una reaparición del paso de créditos.
    await waitForRenderedText("EL TEOREMA DEL SI");

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
      "[E] Hablar con la novia",
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
 * Los dos tests siguientes cubren en el navegador real dos correcciones de
 * lifecycle de audio de WorldScene.js que hasta ahora solo tenían
 * cobertura unitaria (con FakeScenes/mock.timers, que no reproducen
 * fielmente que SceneManager.change() invoca el exit() real de la escena
 * saliente): cancelar desde dentro del mundo debe detener la música antes
 * de volver al título, y cargar una partida estando ya dentro del mundo
 * (WorldScene.update(), tecla "load") debe reconciliar el audio contra el
 * estado recién restaurado en vez de dejar sonando lo que hubiera antes.
 *
 * Ambos tests usan un mismo truco para observar una pista "realmente"
 * activa sin esperar los 6 segundos de INTRO_THEME_DURATION_MS: entran al
 * mundo una primera vez (lo que consume TitleScene.playIntroOnce() y
 * dispara la intro), cancelan de inmediato para volver al título, y
 * entran una segunda vez. En esa segunda entrada, playIntroOnce() ya es
 * un no-op, así que WorldScene.enter() arranca el ambiental de inmediato
 * en vez de diferirlo con setTimeout -- evita duplicar aquí la espera
 * real que sí usa el test del epílogo completo para otros fines, y
 * mantiene esta cobertura rápida y determinista.
 */

function stripLeadingDotSlash(path) {
  return path.replace(/^\.\//, "");
}

test("cancelar dentro del mundo detiene la música ambiental antes de volver al título", async ({
  page,
}) => {
  const errors = collectJavaScriptErrors(page);

  await disableAudioPlayback(page, { resolvePlayback: true });
  await page.goto("/");

  const canvas = page.locator("#game-canvas");
  const currentFrame = () =>
    canvas.evaluate((element) => element.toDataURL());
  const readAudioEvents = () => page.evaluate(() => window.__audioEvents);
  const ambientSrcSuffix = stripLeadingDotSlash(AMBIENT_THEME_PATH);

  const titleFrame = await currentFrame();

  /*
   * Primera entrada: TitleScene.playIntroOnce() dispara la intro por
   * primera vez, así que WorldScene.enter() difiere el arranque del
   * ambiental 6 segundos (INTRO_THEME_DURATION_MS) mediante setTimeout.
   * Cancelar de inmediato, antes de que ese temporizador llegue a
   * disparar, ejercita la mitad de la corrección que cancela el arranque
   * diferido pendiente (clearPendingAmbientStart()) sin que todavía haya
   * ninguna música ambiental activa que detener -- la intro, en cambio,
   * sí está sonando en este punto y stopMusic() la pausará, pero el
   * filtro por `ambientSrcSuffix` de más abajo la excluye a propósito.
   */
  await page.keyboard.press("Enter");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  await page.keyboard.press("Escape");
  await expect.poll(currentFrame).toBe(titleFrame);

  /*
   * Segunda entrada: la intro ya se reprodujo una vez en esta página, así
   * que WorldScene.enter() arranca el ambiental de inmediato, sin
   * diferirlo. Con resolvePlayback:true ese play() resuelve en vez de
   * rechazar, así que AudioService.activeMusic permanece asignado al
   * elemento del ambiental hasta que algo lo detenga de verdad -- justo
   * la condición necesaria para comprobar que cancelar lo detiene.
   */
  await page.keyboard.press("Enter");
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
      preparationsBoardRead: false,
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
    objectiveId: "review-preparations-board",
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

  // Primera carga: solo consume TitleScene.playIntroOnce(); el ambiental
  // diferido que dispara no importa aquí, se cancela en el siguiente paso.
  await page.keyboard.press("KeyL");
  await expect.poll(currentFrame).not.toBe(titleFrame);

  await page.keyboard.press("Escape");
  await expect.poll(currentFrame).toBe(titleFrame);

  /*
   * Segunda carga: la intro ya se consumió, así que el ambiental arranca
   * de inmediato -- esta es la partida en curso, real, dentro del mundo,
   * que el test necesita como punto de partida antes de forzar la rama
   * "load" de WorldScene.update() sobre sí misma.
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
