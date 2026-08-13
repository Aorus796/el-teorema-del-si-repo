import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { INTRO_THEME_PATH } from "../../src/content/introAudioConfig.js";
import { AMBIENT_THEME_PATH } from "../../src/content/ambientAudioConfig.js";
import { EPILOGUE_THEME_PATH } from "../../src/content/epilogueAudioConfig.js";

/*
 * Verifica, sobre las muestras PCM reales de las tres pistas, propiedades
 * objetivas de nivel y densidad que traducen los requisitos musicales
 * cualitativos del rediseño de audio de v1.1 (intro ágil y discreta,
 * ambient disperso y perceptualmente mucho más silencioso, ninguna de las
 * dos "la misma pieza a otra velocidad"):
 *
 * - RMS del ambient claramente por debajo del RMS de la intro, y RMS de
 *   la intro por debajo o igual al del epílogo (la pista más protagonista
 *   de las tres).
 * - Ausencia de clipping sostenido (recortes prolongados a fondo de
 *   escala) en las tres pistas.
 * - Tasa de "onsets" (ataques de nota, detectados vía envolvente de
 *   energía de corto plazo) por segundo de la intro varias veces mayor
 *   que la del ambient, confirmando que la intro es rítmicamente activa
 *   y el ambient es disperso -- no la misma idea reproducida más despacio.
 *
 * Nombre de archivo: "audioLevels" en vez de, por ejemplo, "audioMix",
 * porque el foco de este archivo es exclusivamente el nivel (RMS/pico) y
 * la densidad temporal de las tres pistas ya generadas, no ninguna
 * decisión de mezcla en tiempo de ejecución (no existe tal mezcla: cada
 * pista se reproduce en solitario vía AudioService.playMusic()).
 */

// Ventana de análisis de energía de corto plazo para la detección de
// onsets, y umbral relativo (fracción del pico de energía de la propia
// pista) que cuenta como un ataque de nota.
const ONSET_WINDOW_SECONDS = 0.05;
const ONSET_RELATIVE_THRESHOLD = 0.15;

// Ninguna de las tres pistas debe tener una tirada larga de muestras al
// límite exacto de escala (recorte sostenido); una tirada corta de pocas
// muestras podría darse por un pico legítimo cerca de fondo de escala,
// pero no una meseta prolongada.
const MAX_SUSTAINED_CLIPPING_SAMPLES = 4;
const INT16_MAX_ABS = 32767;

test("el RMS del ambient es claramente inferior al de la intro (ambient <= intro * 0.6)", async () => {
  const introRms = rms((await readThemeWav(INTRO_THEME_PATH)).samples);
  const ambientRms = rms((await readThemeWav(AMBIENT_THEME_PATH)).samples);

  assert.ok(
    ambientRms <= introRms * 0.6,
    `el ambient debe sonar claramente más silencioso que la intro (RMS ambient: ${ambientRms}, RMS intro: ${introRms}, límite: ${introRms * 0.6})`,
  );
});

test("el RMS de la intro no supera al del epílogo, la pista más protagonista de las tres", async () => {
  const introRms = rms((await readThemeWav(INTRO_THEME_PATH)).samples);
  const epilogueRms = rms(
    (await readThemeWav(EPILOGUE_THEME_PATH)).samples,
  );

  assert.ok(
    introRms <= epilogueRms,
    `la intro no debe sonar más protagonista que el tema del epílogo (RMS intro: ${introRms}, RMS epílogo: ${epilogueRms})`,
  );
});

test("ninguna de las tres pistas tiene clipping sostenido", async () => {
  for (const path of [
    INTRO_THEME_PATH,
    AMBIENT_THEME_PATH,
    EPILOGUE_THEME_PATH,
  ]) {
    const wav = await readThemeWav(path);
    const run = longestClippingRun(wav.samples);

    assert.ok(
      run <= MAX_SUSTAINED_CLIPPING_SAMPLES,
      `${path} tiene una tirada de ${run} muestras consecutivas al límite de escala, indicio de recorte sostenido`,
    );
  }
});

test("la tasa de onsets por segundo de la intro es varias veces mayor que la del ambient", async () => {
  const intro = await readThemeWav(INTRO_THEME_PATH);
  const ambient = await readThemeWav(AMBIENT_THEME_PATH);

  const introRate = onsetsPerSecond(intro.samples, intro.sampleRate);
  const ambientRate = onsetsPerSecond(ambient.samples, ambient.sampleRate);

  assert.ok(
    introRate >= ambientRate * 3,
    `la intro debe ser rítmicamente mucho más activa que el ambient (tasa intro: ${introRate}/s, tasa ambient: ${ambientRate}/s, mínimo esperado: ${ambientRate * 3}/s)`,
  );
});

function rms(samples) {
  let sumSquares = 0;

  for (const sample of samples) {
    sumSquares += sample * sample;
  }

  return Math.sqrt(sumSquares / samples.length);
}

function longestClippingRun(samples) {
  let longest = 0;
  let current = 0;

  for (const sample of samples) {
    if (Math.abs(sample) >= INT16_MAX_ABS) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

/*
 * Divide la pista en ventanas de ONSET_WINDOW_SECONDS, calcula la energía
 * RMS de cada ventana, y cuenta un "onset" cada vez que la energía cruza
 * de por debajo a por encima de un umbral relativo al pico de energía de
 * la propia pista (ONSET_RELATIVE_THRESHOLD). Es una heurística simple
 * pero objetiva: no depende de conocer de antemano dónde están las notas,
 * solo de la envolvente de energía real de las muestras.
 */
function onsetsPerSecond(samples, sampleRate) {
  const windowSize = Math.round(ONSET_WINDOW_SECONDS * sampleRate);
  const windowCount = Math.floor(samples.length / windowSize);
  const windowEnergies = [];

  for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
    let sumSquares = 0;

    for (let i = 0; i < windowSize; i += 1) {
      const sample = samples[windowIndex * windowSize + i];
      sumSquares += sample * sample;
    }

    windowEnergies.push(Math.sqrt(sumSquares / windowSize));
  }

  const peakEnergy = Math.max(...windowEnergies);
  const threshold = peakEnergy * ONSET_RELATIVE_THRESHOLD;

  let onsets = 0;
  let aboveThreshold = false;

  for (const energy of windowEnergies) {
    if (energy >= threshold && !aboveThreshold) {
      onsets += 1;
      aboveThreshold = true;
    } else if (energy < threshold) {
      aboveThreshold = false;
    }
  }

  const totalSeconds = samples.length / sampleRate;
  return onsets / totalSeconds;
}

async function readThemeWav(themePath) {
  const relativePath = themePath.replace(/^\.\//, "");
  const buffer = await readFile(resolve(process.cwd(), relativePath));
  return parseWavPcm16(buffer);
}

/*
 * Parser mínimo de WAV PCM que recorre los chunks del formato RIFF en vez
 * de asumir offsets fijos. Mismo parser que ya usan
 * tests/content/epilogueAudioConfig.test.js,
 * tests/content/introAudioConfig.test.js y
 * tests/content/ambientAudioConfig.test.js, duplicado aquí porque no hay
 * un módulo de utilidades de test compartido en este repositorio.
 */
function parseWavPcm16(buffer) {
  let offset = 12;
  let channels = null;
  let sampleRate = null;
  let samples = [];

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
    }

    if (chunkId === "data") {
      const sampleCount = chunkSize / 2;
      samples = new Array(sampleCount);

      for (let i = 0; i < sampleCount; i += 1) {
        samples[i] = buffer.readInt16LE(chunkStart + i * 2);
      }
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  return { channels, sampleRate, samples };
}
