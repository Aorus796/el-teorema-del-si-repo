/*
 * Genera la intro musical breve mediante síntesis aditiva local (un
 * motivo corto de cuatro notas staccato, sin pads sostenidos, con un
 * filtro paso-bajo de un polo para suavizar el timbre), usando
 * exclusivamente las APIs nativas de Node (`node:fs`, `Buffer`) -- sin
 * dependencias nuevas, sin muestras, sin material de terceros y sin
 * conexión a red. Mismo enfoque técnico general que
 * tools/generate-epilogue-theme.mjs, pero con una dirección musical
 * deliberadamente distinta (ágil y curiosa en vez de cálida y sostenida)
 * tras el rechazo humano de la versión anterior de pads largos.
 *
 * Es un recurso ORIGINAL creado expresamente para este repositorio.
 *
 * Uso: node tools/generate-intro-theme.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "src/assets/audio/intro-theme.wav",
);

// Dos motivos de cuatro notas, en registro agudo (octavas 4-5), en un
// modo mayor/lidio -- deliberadamente sin usar Am (evita el carácter
// triste que motivó el rechazo de la versión anterior). El primer motivo
// asciende por los grados 1-3-5-6 de Do mayor (un contorno abierto y
// curioso); el segundo repite ese mismo gesto con una variación que
// introduce el color lidio (4ª aumentada, Fa#) como nota de paso antes de
// resolver en la tónica una octava por encima, cerrando la frase.
const MOTIF_ONE = [261.63, 329.63, 392.0, 440.0]; // C4 E4 G4 A4
const MOTIF_TWO = [329.63, 392.0, 369.99, 523.25]; // E4 G4 F#4 C5

const NOTE_SECONDS = 0.25;
const NOTE_ATTACK_SECONDS = 0.012;
const GAP_SECONDS = 0.08;
const REPEAT_GAP_SECONDS = 3.0;
const TAIL_SECONDS = 0.3;
const NOTE_AMPLITUDE = 0.55;
const LOW_PASS_ALPHA = 0.55;
const OVERALL_FADE_IN_SECONDS = 0.02;
const OVERALL_FADE_OUT_SECONDS = 0.25;
const PEAK_FRACTION = 0.75;

const firstMotif = layoutMotif(MOTIF_ONE, 0);
const secondMotif = layoutMotif(
  MOTIF_TWO,
  firstMotif.endTime + REPEAT_GAP_SECONDS,
);
const notes = [...firstMotif.notes, ...secondMotif.notes];
const totalSeconds = secondMotif.endTime + TAIL_SECONDS;
const totalSamples = Math.round(totalSeconds * SAMPLE_RATE);

const rawSamples = new Float64Array(totalSamples);

for (let i = 0; i < totalSamples; i += 1) {
  rawSamples[i] = sampleAt(i / SAMPLE_RATE, notes);
}

const smoothedSamples = applyOnePoleLowPass(rawSamples, LOW_PASS_ALPHA);
applyOverallFade(smoothedSamples, SAMPLE_RATE, totalSeconds);

const pcmSamples = quantizeToInt16(smoothedSamples, PEAK_FRACTION);
const wavBuffer = encodeWavPcm16({
  sampleRate: SAMPLE_RATE,
  channels: CHANNELS,
  bitsPerSample: BITS_PER_SAMPLE,
  samples: pcmSamples,
});

await writeFile(OUTPUT_PATH, wavBuffer);

console.log(
  `Intro generada en ${OUTPUT_PATH} (${totalSeconds.toFixed(2)}s, ${wavBuffer.length} bytes).`,
);

/*
 * Coloca un motivo de notas en el tiempo, cada una staccato
 * (NOTE_SECONDS) separada por un silencio corto (GAP_SECONDS) de la
 * siguiente. Devuelve tanto las notas colocadas como el instante en que
 * termina la última nota (sin el silencio final), para poder encadenar
 * el siguiente motivo con su propio hueco (REPEAT_GAP_SECONDS).
 */
function layoutMotif(frequencies, startTime) {
  const placedNotes = [];
  let cursor = startTime;

  for (const frequency of frequencies) {
    placedNotes.push({ frequency, start: cursor, duration: NOTE_SECONDS });
    cursor += NOTE_SECONDS + GAP_SECONDS;
  }

  return { notes: placedNotes, endTime: cursor - GAP_SECONDS };
}

function sampleAt(t, placedNotes) {
  for (const note of placedNotes) {
    if (t < note.start || t >= note.start + note.duration) {
      continue;
    }

    const tInNote = t - note.start;

    return (
      Math.sin(2 * Math.PI * note.frequency * tInNote) *
      NOTE_AMPLITUDE *
      noteEnvelope(tInNote)
    );
  }

  return 0;
}

/*
 * Envolvente ADSR corta: ataque casi inmediato (NOTE_ATTACK_SECONDS) y
 * caída lineal hasta 0 exactamente al final de la nota -- sin cola
 * sostenida, para un carácter staccato/pizzicato en vez del pad largo de
 * la versión anterior.
 */
function noteEnvelope(tInNote) {
  if (tInNote < NOTE_ATTACK_SECONDS) {
    return tInNote / NOTE_ATTACK_SECONDS;
  }

  const decayElapsed = tInNote - NOTE_ATTACK_SECONDS;
  const decayDuration = NOTE_SECONDS - NOTE_ATTACK_SECONDS;

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
