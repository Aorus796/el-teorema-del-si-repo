import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { AMBIENT_THEME_PATH } from "../../src/content/ambientAudioConfig.js";

// El ambient es un bucle de eventos dispersos (ver
// tools/generate-ambient-theme.mjs): 40-60s cubre el rango esperado sin
// acoplar el test a la duración exacta generada.
const MIN_DURATION_SECONDS = 40.0;
const MAX_DURATION_SECONDS = 60.0;

// A diferencia de la intro, el ambient incluye un colchón de fundamental
// casi inaudible que suena de forma prácticamente continua, así que la
// fracción de muestras no-cero es muy alta pese al diseño disperso de
// los eventos principales.
const MINIMUM_NON_ZERO_FRACTION = 0.5;

test("AMBIENT_THEME_PATH apunta a un archivo .wav bajo src/assets/audio/", () => {
  assert.match(AMBIENT_THEME_PATH, /^\.\/src\/assets\/audio\/.+\.wav$/);
});

test("el recurso musical del ambient existe físicamente en la ruta pública centralizada", async () => {
  const resourcePath = resolveAmbientThemePath();
  const fileStats = await stat(resourcePath);

  assert.ok(fileStats.isFile());
  assert.ok(fileStats.size > 0, "el archivo no debe estar vacío");
});

test("el recurso musical del ambient tiene una cabecera RIFF/WAVE PCM válida", async () => {
  const wav = await readAmbientThemeWav();

  assert.equal(wav.riffTag, "RIFF");
  assert.equal(wav.waveTag, "WAVE");
  assert.equal(wav.fmtTag, "fmt ");
  assert.equal(wav.audioFormat, 1, "debe ser PCM sin comprimir (formato 1)");
  assert.equal(wav.dataTag, "data");
});

test("el recurso musical del ambient dura entre 40 y 60 segundos", async () => {
  const wav = await readAmbientThemeWav();
  const durationSeconds =
    wav.samples.length / wav.channels / wav.sampleRate;

  assert.ok(
    durationSeconds >= MIN_DURATION_SECONDS &&
      durationSeconds <= MAX_DURATION_SECONDS,
    `la duración debe estar entre ${MIN_DURATION_SECONDS}s y ${MAX_DURATION_SECONDS}s (duración real: ${durationSeconds}s)`,
  );
});

test("el recurso musical del ambient contiene datos de audio reales, no solo muestras cero", async () => {
  const wav = await readAmbientThemeWav();

  assert.ok(wav.samples.length > 0, "debe contener al menos una muestra");

  let nonZeroCount = 0;
  let peakAmplitude = 0;

  for (const sample of wav.samples) {
    if (sample !== 0) {
      nonZeroCount += 1;
    }
    peakAmplitude = Math.max(peakAmplitude, Math.abs(sample));
  }

  const nonZeroFraction = nonZeroCount / wav.samples.length;

  assert.ok(
    nonZeroFraction > MINIMUM_NON_ZERO_FRACTION,
    `debe haber una fracción alta de muestras distintas de cero, gracias al colchón de fundamental casi continuo (fracción real: ${nonZeroFraction})`,
  );
  assert.ok(
    peakAmplitude > 500,
    `la amplitud de pico debe ser audible en los eventos, aunque discreta (pico real: ${peakAmplitude} de 32767)`,
  );
});

function resolveAmbientThemePath() {
  const relativePath = AMBIENT_THEME_PATH.replace(/^\.\//, "");
  return resolve(process.cwd(), relativePath);
}

async function readAmbientThemeWav() {
  const buffer = await readFile(resolveAmbientThemePath());
  return parseWavPcm16(buffer);
}

/*
 * Parser mínimo de WAV PCM que recorre los chunks del formato RIFF en vez
 * de asumir offsets fijos, para no depender de que "fmt " y "data"
 * aparezcan exactamente en las mismas posiciones que produce el generador
 * local (tools/generate-ambient-theme.mjs). Mismo parser que ya usa
 * tests/content/epilogueAudioConfig.test.js, duplicado aquí porque no hay
 * un módulo de utilidades de test compartido en este repositorio.
 */
function parseWavPcm16(buffer) {
  const riffTag = buffer.toString("ascii", 0, 4);
  const waveTag = buffer.toString("ascii", 8, 12);

  let offset = 12;
  let fmtTag = null;
  let audioFormat = null;
  let channels = null;
  let sampleRate = null;
  let bitsPerSample = null;
  let dataTag = null;
  let samples = [];

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      fmtTag = chunkId;
      audioFormat = buffer.readUInt16LE(chunkStart);
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    }

    if (chunkId === "data") {
      dataTag = chunkId;
      const sampleCount = chunkSize / 2;
      samples = new Array(sampleCount);

      for (let i = 0; i < sampleCount; i += 1) {
        samples[i] = buffer.readInt16LE(chunkStart + i * 2);
      }
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  return {
    riffTag,
    waveTag,
    fmtTag,
    audioFormat,
    channels,
    sampleRate,
    bitsPerSample,
    dataTag,
    samples,
  };
}
