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
