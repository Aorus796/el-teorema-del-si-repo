/*
 * Genera el efecto de sonido corto de "interactuar" (v1.1) mediante
 * síntesis aditiva local, usando exclusivamente las APIs nativas de Node
 * (`node:fs`, `Buffer`) -- sin dependencias nuevas, sin muestras, sin
 * material de terceros y sin conexión a red. Mismo enfoque técnico general
 * que tools/generate-intro-theme.mjs / tools/generate-ambient-theme.mjs /
 * tools/generate-epilogue-theme.mjs (síntesis de un tono senoidal + filtro
 * paso-bajo de un polo), pero reducido a un único tono muy corto: se
 * dispara en cada interacción válida dentro del mundo
 * (WorldScene.interact(), ver src/content/sfxAudioConfig.js), así que debe
 * ser breve y discreto, nunca protagonista frente a la música principal.
 *
 * Un único tono senoidal puro a 880 Hz (A5), ataque de 5ms y caída lineal
 * a silencio real dentro de los ~85ms restantes de los 90ms totales, sin
 * sustain sostenido -- un "clic" breve y neutro, no una nota musical.
 *
 * Es un recurso ORIGINAL creado expresamente para este repositorio.
 *
 * Uso: node tools/generate-sfx-interact.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "src/assets/audio/sfx-interact.wav",
);

const TOTAL_SECONDS = 0.09;
const TONE_FREQUENCY = 880.0; // A5
const ATTACK_SECONDS = 0.005;

// El SFX menos protagonista de los tres (interact ocurre en casi cualquier
// paso del juego): pico de cuantización más bajo, para no competir nunca
// con la activación del regalo ni con la resolución de un puzle. El valor
// de PEAK_FRACTION es deliberadamente bajo (no 0.45, como en una primera
// iteración) porque el pico REAL alcanzado por un tono senoidal corto con
// ataque rápido se acerca mucho a su propio PEAK_FRACTION (a diferencia de
// un pad aditivo sostenido como el del epílogo, cuyo pico real queda muy
// por debajo de su PEAK_FRACTION nominal de 0.85 por cancelación de fase
// entre voces) -- ver tools/generate-epilogue-theme.mjs y
// tests/content/audioLevels.test.js, que exige que ningún SFX iguale o
// supere el pico real (medido, no nominal) del tema del epílogo.
const LOW_PASS_ALPHA = 0.4;
const PEAK_FRACTION = 0.2;

const totalSamples = Math.round(TOTAL_SECONDS * SAMPLE_RATE);
const rawSamples = new Float64Array(totalSamples);

for (let i = 0; i < totalSamples; i += 1) {
  const t = i / SAMPLE_RATE;

  rawSamples[i] =
    Math.sin(2 * Math.PI * TONE_FREQUENCY * t) *
    noteEnvelope(t, TOTAL_SECONDS, ATTACK_SECONDS);
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
  `SFX de interacción generado en ${OUTPUT_PATH} (${TOTAL_SECONDS.toFixed(3)}s, ${wavBuffer.length} bytes).`,
);

/*
 * Envolvente de una única nota: ataque lineal y caída lineal hasta 0
 * exactamente al final del clip, igual que noteEnvelope() en
 * tools/generate-intro-theme.mjs / tools/generate-ambient-theme.mjs, para
 * que el archivo empiece y termine en silencio real, sin cola sostenida.
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
