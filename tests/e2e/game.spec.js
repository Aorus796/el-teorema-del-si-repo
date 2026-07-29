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
