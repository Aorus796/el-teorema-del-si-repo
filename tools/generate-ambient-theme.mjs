/*
 * Genera la pista ambiental principal mediante síntesis aditiva local:
 * ya no un pad de acordes casi continuo, sino eventos dispersos (una nota
 * o, como mucho, una díada de dos tonos) separados por silencios largos,
 * más un colchón de fundamental casi inaudible para evitar silencio
 * digital total. Usa exclusivamente las APIs nativas de Node (`node:fs`,
 * `Buffer`) -- sin dependencias nuevas, sin muestras, sin material de
 * terceros y sin conexión a red. Mismo enfoque técnico general que
 * tools/generate-epilogue-theme.mjs, pero con una dirección musical
 * deliberadamente discreta y de baja densidad, distinta en registro y
 * centro tonal de la intro (tools/generate-intro-theme.mjs), tras el
 * rechazo humano de la versión anterior (un pad casi continuo demasiado
 * protagonista).
 *
 * Es un recurso ORIGINAL creado expresamente para este repositorio.
 *
 * Uso: node tools/generate-ambient-theme.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "src/assets/audio/ambient-theme.wav",
);

// Paleta modal en registro grave (octava 3), centrada en Re -- Re menor /
// dorio (grados 1, b3, 4, 5: D3, F3, G3, A3) -- deliberadamente distinta
// del centro tonal mayor/lidio y del registro agudo (octavas 4-5) de la
// intro, para que ambas piezas no se perciban como la misma idea a otra
// velocidad.
const D3 = 146.83;
const F3 = 174.61;
const G3 = 196.0;
const A3 = 220.0;

// Siete eventos dispersos (nota única o díada) a lo largo del bucle, con
// silencios irregulares de 2.5-4 s entre ellos -- sin el patrón rítmico
// regular de la intro. El primer evento deja un hueco inicial de silencio
// y el último termina bastante antes del final del clip, de forma que el
// punto de bucle cae dentro de un tramo de silencio prolongado y no a
// mitad de una nota sostenida.
const EVENTS = [
  { start: 2.0, duration: 2.0, tones: [D3] },
  { start: 7.0, duration: 1.8, tones: [F3, A3] },
  { start: 12.3, duration: 2.3, tones: [A3] },
  { start: 17.4, duration: 2.0, tones: [D3, G3] },
  { start: 23.2, duration: 1.9, tones: [F3] },
  { start: 28.3, duration: 2.4, tones: [A3, D3] },
  { start: 34.3, duration: 2.1, tones: [D3] },
];

const TOTAL_SECONDS = 44.0;
const EVENT_ATTACK_SECONDS = 0.3;
const EVENT_RELEASE_SECONDS = 0.5;
const NOTE_AMPLITUDE = 0.35;
const DRONE_FREQUENCY = D3;
const DRONE_AMPLITUDE = 0.015;
const LOW_PASS_ALPHA = 0.18;
const OVERALL_FADE_IN_SECONDS = 0.05;
const OVERALL_FADE_OUT_SECONDS = 0.3;
const PEAK_FRACTION = 0.32;

const totalSamples = Math.round(TOTAL_SECONDS * SAMPLE_RATE);
const rawSamples = new Float64Array(totalSamples);

for (let i = 0; i < totalSamples; i += 1) {
  rawSamples[i] = sampleAt(i / SAMPLE_RATE);
}

const smoothedSamples = applyOnePoleLowPass(rawSamples, LOW_PASS_ALPHA);
applyOverallFade(smoothedSamples, SAMPLE_RATE, TOTAL_SECONDS);

const pcmSamples = quantizeToInt16(smoothedSamples, PEAK_FRACTION);
const wavBuffer = encodeWavPcm16({
  sampleRate: SAMPLE_RATE,
  channels: CHANNELS,
  bitsPerSample: BITS_PER_SAMPLE,
  samples: pcmSamples,
});

await writeFile(OUTPUT_PATH, wavBuffer);

console.log(
  `Ambient generado en ${OUTPUT_PATH} (${TOTAL_SECONDS.toFixed(2)}s, ${wavBuffer.length} bytes).`,
);

function sampleAt(t) {
  let value = DRONE_AMPLITUDE * Math.sin(2 * Math.PI * DRONE_FREQUENCY * t);

  for (const event of EVENTS) {
    if (t < event.start || t >= event.start + event.duration) {
      continue;
    }

    const envelope = eventEnvelope(t - event.start, event.duration);

    for (const frequency of event.tones) {
      value += NOTE_AMPLITUDE * envelope * Math.sin(2 * Math.PI * frequency * t);
    }
  }

  return value;
}

/*
 * Envolvente de ataque lento (EVENT_ATTACK_SECONDS) y liberación suave
 * (EVENT_RELEASE_SECONDS) con una meseta sostenida entre ambas -- una
 * nota "que aparece y se disuelve" en vez de un ataque percusivo, acorde
 * al carácter atmosférico y no protagonista de esta pista.
 */
function eventEnvelope(tInEvent, duration) {
  if (tInEvent < EVENT_ATTACK_SECONDS) {
    return tInEvent / EVENT_ATTACK_SECONDS;
  }

  const releaseStart = duration - EVENT_RELEASE_SECONDS;

  if (tInEvent >= releaseStart) {
    return Math.max(0, (duration - tInEvent) / EVENT_RELEASE_SECONDS);
  }

  return 1;
}

function applyOnePoleLowPass(samples, alpha) {
  let previous = 0;

  for (let i = 0; i < samples.length; i += 1) {
    previous = previous + alpha * (samples[i] - previous);
    samples[i] = previous;
  }

  return samples;
}

function applyOverallFade(samples, sampleRate, totalSecondsValue) {
  const fadeInSamples = Math.round(OVERALL_FADE_IN_SECONDS * sampleRate);
  const fadeOutSamples = Math.round(OVERALL_FADE_OUT_SECONDS * sampleRate);
  const totalSamplesValue = samples.length;
  const fadeOutStart = Math.round(
    (totalSecondsValue - OVERALL_FADE_OUT_SECONDS) * sampleRate,
  );

  for (let i = 0; i < totalSamplesValue; i += 1) {
    if (i < fadeInSamples) {
      samples[i] *= i / fadeInSamples;
    } else if (i >= fadeOutStart) {
      const tFromFadeOutStart = i - fadeOutStart;
      samples[i] *= Math.max(0, 1 - tFromFadeOutStart / fadeOutSamples);
    }
  }
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
