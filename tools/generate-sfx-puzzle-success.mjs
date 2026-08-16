/*
 * Genera el efecto de sonido corto de "puzle resuelto" (v1.1) mediante
 * síntesis aditiva local, usando exclusivamente las APIs nativas de Node
 * (`node:fs`, `Buffer`) -- sin dependencias nuevas, sin muestras, sin
 * material de terceros y sin conexión a red. Mismo enfoque técnico general
 * que tools/generate-intro-theme.mjs / tools/generate-ambient-theme.mjs /
 * tools/generate-epilogue-theme.mjs (síntesis de tonos senoidales + filtro
 * paso-bajo de un polo), pero limitado a un arpegio corto de tres notas:
 * se dispara una sola vez por resolución real de cada uno de los tres
 * puzles principales (ArchiveCriteriaScene.applyResult(),
 * LibraryCatalogueScene.applyResult(), P2BridgesScene.handleMoveResult(),
 * ver src/content/sfxAudioConfig.js), así que debe sonar como el más
 * protagonista de los tres SFX, sin llegar a competir con el tema del
 * epílogo.
 *
 * Arpegio ascendente de tres notas en tríada mayor de Do (C5-E5-G5), el
 * mismo lenguaje diatónico que el opening ya aprobado
 * (tools/generate-intro-theme.mjs): cada nota con ataque de 10ms y caída
 * lineal a silencio real, con la última nota sostenida un poco más
 * (~200ms) para dar sensación de "aterrizaje" tras el arpegio.
 *
 * Es un recurso ORIGINAL creado expresamente para este repositorio.
 *
 * Uso: node tools/generate-sfx-puzzle-success.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "src/assets/audio/sfx-puzzle-success.wav",
);

const TOTAL_SECONDS = 0.6;
const ATTACK_SECONDS = 0.01;

// Tríada mayor de Do en registro agudo (octava 5), igual que el arpegio
// del opening.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;

const NOTES = [
  { frequency: C5, start: 0.0, duration: 0.16 },
  { frequency: E5, start: 0.18, duration: 0.17 },
  // Última nota con una cola más larga (~200ms) para la sensación de
  // aterrizaje del arpegio completo.
  { frequency: G5, start: 0.37, duration: 0.2 },
];

// El SFX más protagonista de los tres, pero sin igualar ni superar el pico
// REAL (medido, no nominal) del tema del epílogo. El valor de
// PEAK_FRACTION es deliberadamente bajo (no 0.70, como en una primera
// iteración) por la misma razón documentada en
// tools/generate-sfx-interact.mjs: el pico real de un arpegio corto de
// tonos senoidales se acerca mucho a su propio PEAK_FRACTION, a diferencia
// del pad aditivo sostenido del epílogo (PEAK_FRACTION nominal 0.85, ver
// tools/generate-epilogue-theme.mjs), cuyo pico real queda muy por debajo
// de ese valor nominal por cancelación de fase entre voces.
const LOW_PASS_ALPHA = 0.45;
const PEAK_FRACTION = 0.4;

const totalSamples = Math.round(TOTAL_SECONDS * SAMPLE_RATE);
const rawSamples = new Float64Array(totalSamples);

for (let i = 0; i < totalSamples; i += 1) {
  rawSamples[i] = sampleAt(i / SAMPLE_RATE, NOTES);
}

const smoothedSamples = applyOnePoleLowPass(rawSamples, LOW_PASS_ALPHA);
const pcmSamples = quantizeToInt16(smoothedSamples, PEAK_FRACTION);
const wavBuffer = encodeWavPcm16({
  sampleRate: SAMPLE_RATE,
  channels: CHANNELS,
  bitsPerSample: BITS_PER_SAMPLE,
  samples: pcmSamples,
});

await writeFile(OUTPUT_PATH, wavBuffer);

console.log(
  `SFX de puzle resuelto generado en ${OUTPUT_PATH} (${TOTAL_SECONDS.toFixed(3)}s, ${wavBuffer.length} bytes).`,
);

function sampleAt(t, notes) {
  let value = 0;

  for (const note of notes) {
    if (t < note.start || t >= note.start + note.duration) {
      continue;
    }

    const tInNote = t - note.start;

    value +=
      Math.sin(2 * Math.PI * note.frequency * tInNote) *
      noteEnvelope(tInNote, note.duration, ATTACK_SECONDS);
  }

  return value;
}

/*
 * Envolvente por nota: ataque lineal y caída lineal hasta 0 exactamente al
 * final de la propia nota, igual que en los generadores musicales -- cada
 * nota del arpegio decae por completo antes de la siguiente.
 */
function noteEnvelope(tInNote, duration, attack) {
  if (tInNote < attack) {
    return tInNote / attack;
  }

  const decayElapsed = tInNote - attack;
  const decayDuration = duration - attack;

  return Math.max(0, 1 - decayElapsed / decayDuration);
}

function applyOnePoleLowPass(samples, alpha) {
  let previous = 0;

  for (let i = 0; i < samples.length; i += 1) {
    previous = previous + alpha * (samples[i] - previous);
    samples[i] = previous;
  }

  return samples;
}

function quantizeToInt16(samples, peakFraction) {
  const output = new Int16Array(samples.length);
  const peakScale = peakFraction * 32767;

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    output[i] = Math.round(clamped * peakScale);
  }

  return output;
}

function encodeWavPcm16({ sampleRate, channels, bitsPerSample, samples }) {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i], offset);
    offset += bytesPerSample;
  }

  return buffer;
}
