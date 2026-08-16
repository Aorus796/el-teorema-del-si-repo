import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ACTIVATE_SFX_PATH,
  INTERACT_SFX_PATH,
  PUZZLE_SUCCESS_SFX_PATH,
} from "../../src/content/sfxAudioConfig.js";

// Bandas de duración: interact (90ms nominal), activate (220ms nominal) y
// puzzle-success (600ms nominal), ver tools/generate-sfx-*.mjs. Igual que
// en tests/content/ambientAudioConfig.test.js, cubren el rango generado sin
// acoplar el test a la duración exacta.
const SFX_FIXTURES = [
  {
    name: "interact",
    path: INTERACT_SFX_PATH,
    minDurationSeconds: 0.06,
    maxDurationSeconds: 0.18,
  },
  {
    name: "activate",
    path: ACTIVATE_SFX_PATH,
    minDurationSeconds: 0.12,
    maxDurationSeconds: 0.35,
  },
  {
    name: "puzzle-success",
    path: PUZZLE_SUCCESS_SFX_PATH,
    minDurationSeconds: 0.35,
    maxDurationSeconds: 0.9,
  },
];

test("las tres rutas de SFX apuntan a archivos .wav bajo src/assets/audio/", () => {
  for (const fixture of SFX_FIXTURES) {
    assert.match(fixture.path, /^\.\/src\/assets\/audio\/.+\.wav$/);
  }
});

test("los tres archivos de SFX existen físicamente y no están vacíos", async () => {
  for (const fixture of SFX_FIXTURES) {
    const fileStats = await stat(resolveSfxPath(fixture.path));

    assert.ok(fileStats.isFile(), `${fixture.name} debe ser un archivo`);
    assert.ok(fileStats.size > 0, `${fixture.name} no debe estar vacío`);
  }
});

test("los tres archivos de SFX tienen una cabecera RIFF/WAVE PCM válida", async () => {
  for (const fixture of SFX_FIXTURES) {
    const wav = await readSfxWav(fixture.path);

    assert.equal(wav.riffTag, "RIFF", `${fixture.name}: RIFF`);
    assert.equal(wav.waveTag, "WAVE", `${fixture.name}: WAVE`);
    assert.equal(wav.fmtTag, "fmt ", `${fixture.name}: fmt `);
    assert.equal(
      wav.audioFormat,
      1,
      `${fixture.name} debe ser PCM sin comprimir (formato 1)`,
    );
    assert.equal(wav.dataTag, "data", `${fixture.name}: data`);
  }
});

test("cada SFX dura dentro de su banda esperada", async () => {
  for (const fixture of SFX_FIXTURES) {
    const wav = await readSfxWav(fixture.path);
    const durationSeconds =
      wav.samples.length / wav.channels / wav.sampleRate;

    assert.ok(
      durationSeconds >= fixture.minDurationSeconds &&
        durationSeconds <= fixture.maxDurationSeconds,
      `${fixture.name} debe durar entre ${fixture.minDurationSeconds}s y ${fixture.maxDurationSeconds}s (duración real: ${durationSeconds}s)`,
    );
  }
});

test("los tres SFX contienen muestras de audio reales, no solo silencio", async () => {
  for (const fixture of SFX_FIXTURES) {
    const wav = await readSfxWav(fixture.path);

    assert.ok(
      wav.samples.length > 0,
      `${fixture.name} debe contener al menos una muestra`,
    );

    const nonZeroCount = wav.samples.filter((sample) => sample !== 0).length;

    assert.ok(
      nonZeroCount > 0,
      `${fixture.name} debe contener muestras distintas de cero`,
    );
  }
});

function resolveSfxPath(sfxPath) {
  const relativePath = sfxPath.replace(/^\.\//, "");
  return resolve(process.cwd(), relativePath);
}

async function readSfxWav(sfxPath) {
  const buffer = await readFile(resolveSfxPath(sfxPath));
  return parseWavPcm16(buffer);
}

/*
 * Parser mínimo de WAV PCM que recorre los chunks del formato RIFF en vez
 * de asumir offsets fijos. Mismo parser que ya usan
 * tests/content/ambientAudioConfig.test.js,
 * tests/content/epilogueAudioConfig.test.js y
 * tests/content/introAudioConfig.test.js, duplicado aquí porque no hay un
 * módulo de utilidades de test compartido en este repositorio.
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
