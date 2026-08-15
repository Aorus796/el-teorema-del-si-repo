/*
 * Genera la pista ambiental principal (rediseño de v1.1, tercera
 * iteración) mediante síntesis aditiva local, usando exclusivamente las
 * APIs nativas de Node (`node:fs`, `Buffer`) -- sin dependencias nuevas,
 * sin muestras, sin material de terceros y sin conexión a red. Mismo
 * enfoque técnico general que tools/generate-intro-theme.mjs (síntesis de
 * tonos senoidales + filtro paso-bajo de un polo), pero con una dirección
 * musical deliberadamente más discreta: solo dos voces, un registro más
 * grave y un filtro más oscuro, tras el rechazo humano de las dos
 * versiones anteriores (un pad casi continuo demasiado protagonista, y
 * después una versión de eventos dispersos en modo menor/dorio
 * percibida como "funeraria", con huecos de 2.5-4s entre eventos).
 *
 * Esta versión sí tiene un pulso métrico regular y audible en 96 BPM
 * (negra + una figura melódica corta en corcheas), en Re mayor -- sin
 * ninguna nota menor de color -- para evitar el carácter fúnebre de la
 * versión anterior, y sin ningún colchón de fundamental de relleno: con
 * el pulso regular ya no hace falta nada para evitar silencio digital.
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

// 96 BPM en 4/4: notablemente más lento que el opening (128 BPM), para
// que ambas pistas no se perciban como la misma idea a otra velocidad.
const BPM = 96;
const SECONDS_PER_BEAT = 60 / BPM;
const SECONDS_PER_EIGHTH = SECONDS_PER_BEAT / 2;
const BEATS_PER_MEASURE = 4;
const SECONDS_PER_MEASURE = SECONDS_PER_BEAT * BEATS_PER_MEASURE;

// Célula de 4 compases repetida 6 veces -> 6 * 4 compases * 2.5s = 60.0s,
// con el punto de bucle cayendo exactamente en el downbeat del compás 1
// de una hipotética séptima repetición.
const MEASURES_PER_CELL = 4;
const CELL_SECONDS = MEASURES_PER_CELL * SECONDS_PER_MEASURE;
const REPEATS = 6;
const TOTAL_SECONDS = REPEATS * CELL_SECONDS;

// Re mayor / mixolidio, sin ninguna nota menor de color -- centro tonal
// deliberadamente distinto del modo menor/dorio de la versión anterior,
// causa objetiva del carácter "funerario" rechazado.
const D3 = 146.83;
const F_SHARP_3 = 185.0;
const G3 = 196.0;
const A3 = 220.0;

const D4 = 293.66;
const E4 = 329.63;
const F_SHARP_4 = 369.99;
const A4 = 440.0;

// Voz 1: pulso de raíz en negras (registro octava 3), mismo patrón de
// cuatro notas en cada compás -- regularidad métrica explícita.
const PULSE_PITCHES = [D3, F_SHARP_3, G3, A3];

// Voz 2: figura melódica corta en corcheas (registro octava 4), con
// huecos deliberados (posiciones de corchea 2 y 5 del compás en silencio)
// para no ser legato. Dos variantes con una diferencia mínima (las notas
// intermedias intercambiadas), usada la variante en la tercera de cada
// tres repeticiones de la célula.
const MELODY_EIGHTH_POSITIONS = [0, 1, 3, 4, 6, 7];
const MELODY_BASE = [D4, E4, F_SHARP_4, A4, F_SHARP_4, D4];
const MELODY_VARIATION = [D4, F_SHARP_4, E4, A4, E4, D4];

const PULSE_NOTE_SECONDS = 0.15;
const PULSE_ATTACK_SECONDS = 0.05;
const PULSE_AMPLITUDE = 0.3;

const MELODY_NOTE_SECONDS = 0.18;
const MELODY_ATTACK_SECONDS = 0.02;
const MELODY_AMPLITUDE = 0.25;

const LOW_PASS_ALPHA = 0.32;
const PEAK_FRACTION = 0.55;

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
  `Ambient generado en ${OUTPUT_PATH} (${TOTAL_SECONDS.toFixed(2)}s, ${wavBuffer.length} bytes).`,
);

/*
 * Construye la lista completa de notas (las dos voces, en las seis
 * repeticiones de la célula de 4 compases) como eventos con instante de
 * inicio absoluto, igual que buildNotes() en
 * tools/generate-intro-theme.mjs.
 */
function buildNotes() {
  const placedNotes = [];

  for (let repeatIndex = 0; repeatIndex < REPEATS; repeatIndex += 1) {
    const repeatStart = repeatIndex * CELL_SECONDS;
    const isVariationRepeat = (repeatIndex + 1) % 3 === 0;
    const melodySequence = isVariationRepeat ? MELODY_VARIATION : MELODY_BASE;

    for (
      let measureIndex = 0;
      measureIndex < MEASURES_PER_CELL;
      measureIndex += 1
    ) {
      const measureStart = repeatStart + measureIndex * SECONDS_PER_MEASURE;

      // Voz 1: pulso de raíz, una nota por negra, nunca solapada con la
      // siguiente (PULSE_NOTE_SECONDS < SECONDS_PER_BEAT).
      for (let beatIndex = 0; beatIndex < BEATS_PER_MEASURE; beatIndex += 1) {
        placedNotes.push({
          frequency: PULSE_PITCHES[beatIndex],
          start: measureStart + beatIndex * SECONDS_PER_BEAT,
          duration: PULSE_NOTE_SECONDS,
          attack: PULSE_ATTACK_SECONDS,
          amplitude: PULSE_AMPLITUDE,
        });
      }

      // Voz 2: figura melódica corta en corcheas, con huecos entre notas.
      for (let i = 0; i < MELODY_EIGHTH_POSITIONS.length; i += 1) {
        const eighthIndex = MELODY_EIGHTH_POSITIONS[i];

        placedNotes.push({
          frequency: melodySequence[i],
          start: measureStart + eighthIndex * SECONDS_PER_EIGHTH,
          duration: MELODY_NOTE_SECONDS,
          attack: MELODY_ATTACK_SECONDS,
          amplitude: MELODY_AMPLITUDE,
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
 * Envolvente por nota: ataque corto y caída hasta 0 antes de que llegue
 * el siguiente onset de la misma voz -- un pulso audible y regular, nunca
 * un drone sostenido.
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
