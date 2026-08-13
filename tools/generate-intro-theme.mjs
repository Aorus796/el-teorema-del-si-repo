/*
 * Genera la intro musical breve mediante síntesis aditiva local (pads de
 * acordes + arpegio suave + un filtro paso-bajo de un polo), usando
 * exclusivamente las APIs nativas de Node (`node:fs`, `Buffer`) -- sin
 * dependencias nuevas, sin muestras, sin material de terceros y sin
 * conexión a red. Mismo enfoque que
 * tools/generate-epilogue-theme.mjs, adaptado a una pieza mucho más
 * breve (curiosa, cálida, ligeramente misteriosa) pensada para sonar
 * una sola vez tras la primera interacción del usuario en TitleScene.
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
const SECONDS_PER_CHORD = 3;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "src/assets/audio/intro-theme.wav",
);

// Dos acordes (Am -> C, i -> III): arranca en el mismo tono menor cálido
// que el tema del epílogo, para dar continuidad temática al conjunto, y
// se abre hacia el relativo mayor en un gesto breve de "inicio de
// aventura" sin resolver del todo -- ligeramente misterioso.
const CHORDS = [
  { root: 220.0, third: 261.63, fifth: 329.63 }, // Am (A3 C4 E4)
  { root: 261.63, third: 329.63, fifth: 392.0 }, // C  (C4 E4 G4)
];

const PAD_TONE_AMPLITUDE = 0.14;
const ARPEGGIO_AMPLITUDE = 0.1;
const ARPEGGIO_NOTE_SECONDS = 0.4;
const LOW_PASS_ALPHA = 0.35;
const OVERALL_FADE_IN_SECONDS = 0.3;
const OVERALL_FADE_OUT_SECONDS = 0.8;

const totalSeconds = CHORDS.length * SECONDS_PER_CHORD;
const totalSamples = Math.round(totalSeconds * SAMPLE_RATE);

const rawSamples = new Float64Array(totalSamples);

for (let i = 0; i < totalSamples; i += 1) {
  const t = i / SAMPLE_RATE;
  const chordIndex = Math.min(
    CHORDS.length - 1,
    Math.floor(t / SECONDS_PER_CHORD),
  );
  const chord = CHORDS[chordIndex];
  const tInChord = t - chordIndex * SECONDS_PER_CHORD;

  rawSamples[i] =
    padValue(chord, t, tInChord) + arpeggioValue(chord, tInChord);
}

const smoothedSamples = applyOnePoleLowPass(rawSamples, LOW_PASS_ALPHA);
applyOverallFade(smoothedSamples, SAMPLE_RATE, totalSeconds);

const pcmSamples = quantizeToInt16(smoothedSamples, 0.8);
const wavBuffer = encodeWavPcm16({
  sampleRate: SAMPLE_RATE,
  channels: CHANNELS,
  bitsPerSample: BITS_PER_SAMPLE,
  samples: pcmSamples,
});

await writeFile(OUTPUT_PATH, wavBuffer);

console.log(
  `Intro generada en ${OUTPUT_PATH} (${totalSeconds}s, ${wavBuffer.length} bytes).`,
);

function padValue(chord, t, tInChord) {
  const envelope = segmentEnvelope(tInChord, SECONDS_PER_CHORD, 0.3);
  const tones = [chord.root, chord.third, chord.fifth];
  const sum = tones.reduce(
    (accumulator, frequency) =>
      accumulator + Math.sin(2 * Math.PI * frequency * t),
    0,
  );

  return (sum / tones.length) * PAD_TONE_AMPLITUDE * tones.length * envelope;
}

function arpeggioValue(chord, tInChord) {
  const tones = [chord.root, chord.third, chord.fifth];
  const noteIndex = Math.floor(tInChord / ARPEGGIO_NOTE_SECONDS);
  const tInNote = tInChord - noteIndex * ARPEGGIO_NOTE_SECONDS;
  const frequency = tones[noteIndex % tones.length] * 2;
  const decayEnvelope = Math.max(
    0,
    1 - tInNote / (ARPEGGIO_NOTE_SECONDS * 0.9),
  );
  const attackEnvelope = Math.min(1, tInNote / 0.02);

  return (
    Math.sin(2 * Math.PI * frequency * tInNote) *
    ARPEGGIO_AMPLITUDE *
    decayEnvelope *
    attackEnvelope
  );
}

function segmentEnvelope(tInSegment, segmentSeconds, rampSeconds) {
  if (tInSegment < rampSeconds) {
    return tInSegment / rampSeconds;
  }

  const tFromEnd = segmentSeconds - tInSegment;
  if (tFromEnd < rampSeconds) {
    return Math.max(0, tFromEnd / rampSeconds);
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
