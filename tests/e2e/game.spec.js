import { expect, test } from "@playwright/test";

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

test("carga la pantalla de título sin errores", async ({ page }) => {
  const errors = collectJavaScriptErrors(page);

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
