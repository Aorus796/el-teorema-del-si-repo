/*
 * Genera el opening musical (rediseño de v1.1, tercera iteración) mediante
 * síntesis aditiva local, usando exclusivamente las APIs nativas de Node
 * (`node:fs`, `Buffer`) -- sin dependencias nuevas, sin muestras, sin
 * material de terceros y sin conexión a red. Mismo enfoque técnico general
 * que tools/generate-epilogue-theme.mjs (síntesis de tonos senoidales +
 * filtro paso-bajo de un polo), pero con una dirección musical
 * deliberadamente distinta tras el rechazo humano de las dos versiones
 * anteriores ("bocina de barco" / sin pulso rítmico regular): esta versión
 * tiene un pulso métrico explícito y regular en 128 BPM, con tres voces
 * cortas y staccato (arpegio, melodía y un "click" de refuerzo del pulso,
 * los tres síntesis de tonos senoidales, nunca ruido ni percusión real).
 *
 * El archivo de salida sigue llamándose "intro-theme.wav" por
 * compatibilidad con la constante ya existente (ver
 * src/content/introAudioConfig.js), pero ya no es un one-shot corto: es
 * un loop de apertura de ~30s que suena en bucle desde la primera
 * interacción del usuario hasta completar el diálogo con el padre de la
 * novia (ver WorldScene.js).
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

// 128 BPM en 4/4: negra y corchea derivadas directamente del tempo, sin
// valores mágicos sueltos.
const BPM = 128;
const SECONDS_PER_BEAT = 60 / BPM;
const SECONDS_PER_EIGHTH = SECONDS_PER_BEAT / 2;
const BEATS_PER_MEASURE = 4;
const SECONDS_PER_MEASURE = SECONDS_PER_BEAT * BEATS_PER_MEASURE;

// Célula de 4 compases (progresión I-IV-V-I en Do mayor, sin ningún acorde
// menor) repetida 4 veces -> 4 * 4 compases * 1.875s = 30.0s, con el punto
// de bucle cayendo exactamente en el downbeat del compás 1 de una
// hipotética quinta repetición, resuelto sobre la tónica (Do mayor).
const MEASURES_PER_CELL = 4;
const CELL_SECONDS = MEASURES_PER_CELL * SECONDS_PER_MEASURE;
const REPEATS = 4;
const TOTAL_SECONDS = REPEATS * CELL_SECONDS;

// Acordes por compás (fundamental, tercera, quinta, octava), en registro
// agudo (octavas 4-5), estrictamente mayores.
const C_CHORD = { root: 261.63, third: 329.63, fifth: 392.0, octave: 523.25 }; // C4 E4 G4 C5
const F_CHORD = { root: 349.23, third: 440.0, fifth: 523.25, octave: 698.46 }; // F4 A4 C5 F5
const G_CHORD = { root: 392.0, third: 493.88, fifth: 587.33, octave: 783.99 }; // G4 B4 D5 G5
const MEASURE_CHORDS = [C_CHORD, F_CHORD, G_CHORD, C_CHORD];

// Melodía de 4 notas por compás (voz 2), diatónica sobre el acorde de cada
// compás. El compás 4 tiene dos variantes: la base resuelve directamente
// en la tónica; la variante (usada cada segunda repetición de la célula)
// introduce Fa# como nota de paso lidia antes de resolver -- el mismo
// color lidio ya usado en la versión anterior, ahora como variación
// periódica en vez de como segundo motivo separado.
const BASE_MELODY_BY_MEASURE = [
  [329.63, 392.0, 523.25, 392.0], // E4 G4 C5 G4
  [349.23, 440.0, 523.25, 440.0], // F4 A4 C5 A4
  [392.0, 493.88, 587.33, 493.88], // G4 B4 D5 B4
  [392.0, 329.63, 293.66, 523.25], // G4 E4 D4 C5 (resolución base)
];
const MEASURE_FOUR_MELODY_VARIATION = [392.0, 369.99, 329.63, 523.25]; // G4 F#4 E4 C5

// Click de refuerzo del pulso (voz 3, opcional): un tono senoidal muy
// corto y bajo en amplitud sobre cada negra, nunca ruido ni percusión
// real.
const CLICK_FREQUENCY = 1046.5; // C6

const ARPEGGIO_NOTE_SECONDS = 0.15;
const ARPEGGIO_ATTACK_SECONDS = 0.01;
const ARPEGGIO_AMPLITUDE = 0.5;

const MELODY_NOTE_SECONDS = 0.2;
const MELODY_ATTACK_SECONDS = 0.012;
const MELODY_AMPLITUDE = 0.32;

const CLICK_NOTE_SECONDS = 0.04;
const CLICK_ATTACK_SECONDS = 0.004;
const CLICK_AMPLITUDE = 0.08;

const LOW_PASS_ALPHA = 0.55;
const PEAK_FRACTION = 0.72;

const notes = buildNotes();
const totalSamples = Math.round(TOTAL_SECONDS * SAMPLE_RATE);
const rawSamples = new Float64Array(totalSamples);

for (let i = 0; i < totalSamples; i += 1) {
  rawSamples[i] = sampleAt(i / SAMPLE_RATE, notes);
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
  `Opening generado en ${OUTPUT_PATH} (${TOTAL_SECONDS.toFixed(2)}s, ${wavBuffer.length} bytes).`,
);

/*
 * Construye la lista completa de notas (las tres voces, en las cuatro
 * repeticiones de la célula de 4 compases) como eventos con instante de
 * inicio absoluto, en vez de generar cada voz por separado, para que
 * sampleAt() solo tenga que sumar contribuciones activas en un instante
 * dado.
 */
function buildNotes() {
  const placedNotes = [];

  for (let repeatIndex = 0; repeatIndex < REPEATS; repeatIndex += 1) {
    const repeatStart = repeatIndex * CELL_SECONDS;
    const isVariationRepeat = repeatIndex % 2 === 1;

    for (
      let measureIndex = 0;
      measureIndex < MEASURES_PER_CELL;
      measureIndex += 1
    ) {
      const measureStart = repeatStart + measureIndex * SECONDS_PER_MEASURE;
      const chord = MEASURE_CHORDS[measureIndex];

      // Voz 1: arpegio ascendente sobre el acorde roto del compás,
      // recorrido dos veces en corcheas (8 eventos por compás).
      const arpeggioSequence = [
        chord.root,
        chord.third,
        chord.fifth,
        chord.octave,
        chord.root,
        chord.third,
        chord.fifth,
        chord.octave,
      ];

      for (let i = 0; i < arpeggioSequence.length; i += 1) {
        placedNotes.push({
          frequency: arpeggioSequence[i],
          start: measureStart + i * SECONDS_PER_EIGHTH,
          duration: ARPEGGIO_NOTE_SECONDS,
          attack: ARPEGGIO_ATTACK_SECONDS,
          amplitude: ARPEGGIO_AMPLITUDE,
        });
      }

      // Voz 2: melodía de 4 notas por compás, en negras.
      const melodySequence =
        measureIndex === MEASURES_PER_CELL - 1
          ? isVariationRepeat
            ? MEASURE_FOUR_MELODY_VARIATION
            : BASE_MELODY_BY_MEASURE[measureIndex]
          : BASE_MELODY_BY_MEASURE[measureIndex];

      for (let i = 0; i < melodySequence.length; i += 1) {
        placedNotes.push({
          frequency: melodySequence[i],
          start: measureStart + i * SECONDS_PER_BEAT,
          duration: MELODY_NOTE_SECONDS,
          attack: MELODY_ATTACK_SECONDS,
          amplitude: MELODY_AMPLITUDE,
        });
      }

      // Voz 3: click de refuerzo del pulso, uno por negra.
      for (let i = 0; i < BEATS_PER_MEASURE; i += 1) {
        placedNotes.push({
          frequency: CLICK_FREQUENCY,
          start: measureStart + i * SECONDS_PER_BEAT,
          duration: CLICK_NOTE_SECONDS,
          attack: CLICK_ATTACK_SECONDS,
          amplitude: CLICK_AMPLITUDE,
        });
      }
    }
  }

  return placedNotes;
}

function sampleAt(t, placedNotes) {
  let value = 0;

  for (const note of placedNotes) {
    if (t < note.start || t >= note.start + note.duration) {
      continue;
    }

    const tInNote = t - note.start;

    value +=
      Math.sin(2 * Math.PI * note.frequency * tInNote) *
      note.amplitude *
      noteEnvelope(tInNote, note.duration, note.attack);
  }

  return value;
}

/*
 * Envolvente por nota: ataque casi inmediato y caída lineal hasta 0
 * exactamente al final de la propia nota -- staccato puro, sin cola
 * sostenida, para que cada voz decaiga por completo antes de que el
 * silencio entre onsets pueda superar el hueco máximo permitido.
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
