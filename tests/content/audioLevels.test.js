import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { OPENING_THEME_PATH } from "../../src/content/introAudioConfig.js";
import { AMBIENT_THEME_PATH } from "../../src/content/ambientAudioConfig.js";
import { EPILOGUE_THEME_PATH } from "../../src/content/epilogueAudioConfig.js";
import {
  ACTIVATE_SFX_PATH,
  INTERACT_SFX_PATH,
  PUZZLE_SUCCESS_SFX_PATH,
} from "../../src/content/sfxAudioConfig.js";

/*
 * Verifica, sobre las muestras PCM reales de las tres pistas, propiedades
 * objetivas de nivel y densidad que traducen los requisitos musicales
 * cualitativos del rediseño de audio de v1.1 (tercera iteración: opening
 * y ambient con pulso rítmico regular en 128 BPM y 96 BPM
 * respectivamente, tras el rechazo humano de las dos versiones
 * anteriores -- "bocina de barco" sin pulso, y después "funeraria" con
 * huecos largos e irregulares entre eventos):
 *
 * - RMS del ambient claramente por debajo del RMS del opening, y RMS del
 *   opening por debajo o igual al del epílogo (la pista más protagonista
 *   de las tres).
 * - Ausencia de clipping sostenido (recortes prolongados a fondo de
 *   escala) en las tres pistas.
 * - Para el opening y el ambient por separado: regularidad del pulso
 *   (coeficiente de variación bajo entre los intervalos de onsets
 *   consecutivos, confirmando que hay métrica real y no solo eventos
 *   dispersos) y un hueco máximo acotado entre onsets consecutivos en
 *   todo el clip (más estricto para el opening, más permisivo pero aun
 *   así corto para el ambient).
 * - Un piso absoluto de onsets por segundo del ambient, que demuestre que
 *   tiene pulso propio y perceptible, no solo una densidad relativa al
 *   opening.
 * - Un ratio moderado de densidad opening/ambient (el opening sigue
 *   siendo la pista rítmicamente más activa de las dos, pero ya no en el
 *   orden de magnitud de la versión anterior, en la que el ambient no
 *   tenía ningún pulso propio).
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

// Umbrales de regularidad y hueco máximo por pista: el opening (128 BPM,
// arpegio en corcheas continuo) es más denso y regular que el ambient (96
// BPM, pulso en negras + figura melódica con huecos deliberados), así que
// cada pista tiene su propio límite de hueco máximo, pero ambas deben
// tener un coeficiente de variación bajo (pulso real, no ruido temporal).
const MAX_ONSET_INTERVAL_CV = 0.5;
const OPENING_MAX_GAP_SECONDS = 1.2;
const AMBIENT_MAX_GAP_SECONDS = 2.0;

// Piso absoluto de densidad del ambient (independiente de la comparación
// con el opening) y ratio moderado opening/ambient -- ya no el ratio
// >=3x de una versión anterior en la que el ambient carecía de pulso
// propio.
const AMBIENT_MIN_ONSETS_PER_SECOND = 1.2;
const MIN_OPENING_TO_AMBIENT_RATIO = 1.3;

test("el RMS del ambient es claramente inferior al del opening (ambient <= opening * 0.6)", async () => {
  const openingRms = rms((await readThemeWav(OPENING_THEME_PATH)).samples);
  const ambientRms = rms((await readThemeWav(AMBIENT_THEME_PATH)).samples);

  assert.ok(
    ambientRms <= openingRms * 0.6,
    `el ambient debe sonar claramente más silencioso que el opening (RMS ambient: ${ambientRms}, RMS opening: ${openingRms}, límite: ${openingRms * 0.6})`,
  );
});

test("el RMS del opening no supera al del epílogo, la pista más protagonista de las tres", async () => {
  const openingRms = rms((await readThemeWav(OPENING_THEME_PATH)).samples);
  const epilogueRms = rms(
    (await readThemeWav(EPILOGUE_THEME_PATH)).samples,
  );

  assert.ok(
    openingRms <= epilogueRms,
    `el opening no debe sonar más protagonista que el tema del epílogo (RMS opening: ${openingRms}, RMS epílogo: ${epilogueRms})`,
  );
});

test("ninguna de las tres pistas tiene clipping sostenido", async () => {
  for (const path of [
    OPENING_THEME_PATH,
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

/*
 * Los tres tests siguientes cubren los tres SFX (interact, activate,
 * puzzle-success, ver src/content/sfxAudioConfig.js y
 * tools/generate-sfx-*.mjs): ausencia de clipping sostenido, igual que las
 * tres pistas musicales, y el orden relativo de pico real esperado
 * (interact < activate < puzzle-success < epílogo). El pico REAL medido
 * sobre las muestras, no el PEAK_FRACTION nominal de cada generador, es lo
 * que importa aquí: un pad aditivo sostenido como el del epílogo (nominal
 * 0.85) rara vez alcanza su propio PEAK_FRACTION por cancelación de fase
 * entre voces, así que los tres SFX usan un PEAK_FRACTION nominal mucho
 * más bajo para garantizar, con margen real, que ninguno iguala ni supera
 * el pico real del epílogo.
 */
test("ninguno de los tres SFX tiene clipping sostenido", async () => {
  for (const path of [
    INTERACT_SFX_PATH,
    ACTIVATE_SFX_PATH,
    PUZZLE_SUCCESS_SFX_PATH,
  ]) {
    const wav = await readThemeWav(path);
    const run = longestClippingRun(wav.samples);

    assert.ok(
      run <= MAX_SUSTAINED_CLIPPING_SAMPLES,
      `${path} tiene una tirada de ${run} muestras consecutivas al límite de escala, indicio de recorte sostenido`,
    );
  }
});

test("el pico real de los tres SFX sigue el orden interact < activate < puzzle-success", async () => {
  const interactPeak = peak((await readThemeWav(INTERACT_SFX_PATH)).samples);
  const activatePeak = peak((await readThemeWav(ACTIVATE_SFX_PATH)).samples);
  const puzzleSuccessPeak = peak(
    (await readThemeWav(PUZZLE_SUCCESS_SFX_PATH)).samples,
  );

  assert.ok(
    interactPeak < activatePeak,
    `interact (${interactPeak}) debe tener un pico menor que activate (${activatePeak})`,
  );
  assert.ok(
    activatePeak < puzzleSuccessPeak,
    `activate (${activatePeak}) debe tener un pico menor que puzzle-success (${puzzleSuccessPeak})`,
  );
});

test("ninguno de los tres SFX iguala ni supera el pico real del tema del epílogo", async () => {
  const epiloguePeak = peak((await readThemeWav(EPILOGUE_THEME_PATH)).samples);

  for (const path of [
    INTERACT_SFX_PATH,
    ACTIVATE_SFX_PATH,
    PUZZLE_SUCCESS_SFX_PATH,
  ]) {
    const sfxPeak = peak((await readThemeWav(path)).samples);

    assert.ok(
      sfxPeak < epiloguePeak,
      `${path} (pico ${sfxPeak}) no debe igualar ni superar el pico real del epílogo (${epiloguePeak})`,
    );
  }
});

test("el opening tiene un pulso regular: coeficiente de variación bajo entre onsets y ningún hueco mayor de 1.2s", async () => {
  const opening = await readThemeWav(OPENING_THEME_PATH);
  const analysis = analyzeOnsets(opening.samples, opening.sampleRate);

  assert.ok(
    analysis.coefficientOfVariation < MAX_ONSET_INTERVAL_CV,
    `el opening debe tener un pulso métrico regular, no solo eventos dispersos (CV real: ${analysis.coefficientOfVariation})`,
  );
  assert.ok(
    analysis.maxGapSeconds <= OPENING_MAX_GAP_SECONDS,
    `ningún hueco entre onsets del opening debe superar ${OPENING_MAX_GAP_SECONDS}s (hueco real máximo: ${analysis.maxGapSeconds}s)`,
  );
});

test("el ambient tiene un pulso regular: coeficiente de variación bajo entre onsets y ningún hueco mayor de 2.0s", async () => {
  const ambient = await readThemeWav(AMBIENT_THEME_PATH);
  const analysis = analyzeOnsets(ambient.samples, ambient.sampleRate);

  assert.ok(
    analysis.coefficientOfVariation < MAX_ONSET_INTERVAL_CV,
    `el ambient debe tener un pulso métrico regular, no solo eventos dispersos (CV real: ${analysis.coefficientOfVariation})`,
  );
  assert.ok(
    analysis.maxGapSeconds <= AMBIENT_MAX_GAP_SECONDS,
    `ningún hueco entre onsets del ambient debe superar ${AMBIENT_MAX_GAP_SECONDS}s (hueco real máximo: ${analysis.maxGapSeconds}s)`,
  );
});

test("el ambient tiene un piso absoluto de densidad de onsets, demostrando pulso propio y no solo relativo al opening", async () => {
  const ambient = await readThemeWav(AMBIENT_THEME_PATH);
  const analysis = analyzeOnsets(ambient.samples, ambient.sampleRate);

  assert.ok(
    analysis.onsetsPerSecond >= AMBIENT_MIN_ONSETS_PER_SECOND,
    `el ambient debe tener al menos ${AMBIENT_MIN_ONSETS_PER_SECOND} onsets/s (tasa real: ${analysis.onsetsPerSecond}/s)`,
  );
});

test("la tasa de onsets por segundo del opening es moderadamente mayor que la del ambient (>= 1.3x, ya no >= 3x)", async () => {
  const opening = await readThemeWav(OPENING_THEME_PATH);
  const ambient = await readThemeWav(AMBIENT_THEME_PATH);

  const openingRate = analyzeOnsets(
    opening.samples,
    opening.sampleRate,
  ).onsetsPerSecond;
  const ambientRate = analyzeOnsets(
    ambient.samples,
    ambient.sampleRate,
  ).onsetsPerSecond;

  assert.ok(
    openingRate >= ambientRate * MIN_OPENING_TO_AMBIENT_RATIO,
    `el opening debe seguir siendo rítmicamente más activo que el ambient, pero de forma moderada (tasa opening: ${openingRate}/s, tasa ambient: ${ambientRate}/s, mínimo esperado: ${ambientRate * MIN_OPENING_TO_AMBIENT_RATIO}/s)`,
  );
});

function rms(samples) {
  let sumSquares = 0;

  for (const sample of samples) {
    sumSquares += sample * sample;
  }

  return Math.sqrt(sumSquares / samples.length);
}

function peak(samples) {
  let peakAmplitude = 0;

  for (const sample of samples) {
    peakAmplitude = Math.max(peakAmplitude, Math.abs(sample));
  }

  return peakAmplitude;
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
 * solo de la envolvente de energía real de las muestras. Devuelve, además
 * de la tasa de onsets por segundo, el coeficiente de variación de los
 * intervalos entre onsets consecutivos (regularidad del pulso) y el hueco
 * máximo entre onsets consecutivos.
 */
function analyzeOnsets(samples, sampleRate) {
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

  let peakEnergy = 0;
  for (const energy of windowEnergies) {
    peakEnergy = Math.max(peakEnergy, energy);
  }
  const threshold = peakEnergy * ONSET_RELATIVE_THRESHOLD;

  const onsetTimesSeconds = [];
  let aboveThreshold = false;

  for (let windowIndex = 0; windowIndex < windowEnergies.length; windowIndex += 1) {
    const energy = windowEnergies[windowIndex];

    if (energy >= threshold && !aboveThreshold) {
      onsetTimesSeconds.push((windowIndex * windowSize) / sampleRate);
      aboveThreshold = true;
    } else if (energy < threshold) {
      aboveThreshold = false;
    }
  }

  const totalSeconds = samples.length / sampleRate;
  const onsetsPerSecond = onsetTimesSeconds.length / totalSeconds;

  const intervals = [];
  for (let i = 1; i < onsetTimesSeconds.length; i += 1) {
    intervals.push(onsetTimesSeconds[i] - onsetTimesSeconds[i - 1]);
  }

  const meanInterval =
    intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const variance =
    intervals.reduce(
      (sum, value) => sum + (value - meanInterval) ** 2,
      0,
    ) / intervals.length;
  const coefficientOfVariation = Math.sqrt(variance) / meanInterval;

  let maxGapSeconds = 0;
  for (const interval of intervals) {
    maxGapSeconds = Math.max(maxGapSeconds, interval);
  }

  return {
    onsetCount: onsetTimesSeconds.length,
    onsetsPerSecond,
    coefficientOfVariation,
    maxGapSeconds,
  };
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
