/*
 * Genera el efecto de sonido corto de "activación de un mecanismo" (v1.1)
 * mediante síntesis aditiva local, usando exclusivamente las APIs nativas
 * de Node (`node:fs`, `Buffer`) -- sin dependencias nuevas, sin muestras,
 * sin material de terceros y sin conexión a red. Mismo enfoque técnico
 * general que tools/generate-intro-theme.mjs /
 * tools/generate-ambient-theme.mjs / tools/generate-epilogue-theme.mjs
 * (síntesis de tonos senoidales + filtro paso-bajo de un polo), pero
 * reducido a dos tonos breves y secuenciales: se dispara una sola vez, al
 * confirmar la combinación correcta del mecanismo del regalo del epílogo
 * (EpilogueGiftCodeScene.confirmAttempt(), ver
 * src/content/sfxAudioConfig.js), así que debe sonar más presente que el
 * SFX de interacción, pero seguir siendo breve.
 *
 * Dos tonos senoidales puros y secuenciales sin solape, simulando un
 * "clic-encaje" de mecanismo: 415.30 Hz (Ab4/G#4, raíz) seguido de 622.95
 * Hz (Eb5/D#5, quinta justa exacta -- relación 3:2, igual que el par
 * anterior 440->660), cada uno con ataque de 8ms y caída lineal a silencio
 * real en ~100ms (incluido el ataque), separados por un hueco corto de
 * silencio real antes del segundo tono.
 *
 * La raíz y la quinta se eligieron deliberadamente FUERA de las dos
 * escalas diatónicas usadas por toda la música del juego, para evitar
 * cualquier colisión de frecuencia exacta con la pista de fondo activa en
 * el momento en que se dispara este SFX (EpilogueGiftCodeScene, con el
 * ambient sonando de fondo, ver WorldScene.syncMusicToFlags()):
 * - tools/generate-ambient-theme.mjs usa Re mayor/mixolidio: D3=146.83,
 *   F#3=185.0, G3=196.0, A3=220.0 (voz de pulso) y D4=293.66, E4=329.63,
 *   F#4=369.99, A4=440.0 (voz melódica) -- ninguna es Ab/G# ni Eb/D#.
 * - tools/generate-intro-theme.mjs usa Do mayor con color lidio puntual:
 *   acordes C4/E4/G4/C5, F4/A4/C5/F5, G4/B4/D5/G5 y melodía sobre esas
 *   mismas notas más el paso lidio F#4 (369.99) -- tampoco Ab/G# ni Eb/D#.
 * - tools/generate-sfx-puzzle-success.mjs usa la tríada mayor de Do en
 *   octava 5: C5=523.25, E5=659.25, G5=783.99 -- de nuevo ninguna Ab/G#
 *   ni Eb/D#.
 * 415.30 Hz y 622.95 Hz no coinciden con ninguna de esas frecuencias ni
 * con sus octavas (mitad/doble), así que no hay colisión posible con
 * ninguna combinación de música de fondo que pueda sonar simultáneamente.
 *
 * Es un recurso ORIGINAL creado expresamente para este repositorio.
 *
 * Uso: node tools/generate-sfx-activate.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const OUTPUT_PATH = resolve(
  process.cwd(),
  "src/assets/audio/sfx-activate.wav",
);

const ROOT_FREQUENCY = 415.3; // Ab4 / G#4 -- fuera de ambas escalas diatónicas usadas por la música (ver comentario superior)
const FIFTH_FREQUENCY = ROOT_FREQUENCY * 1.5; // Eb5 / D#5 (622.95 Hz), quinta justa exacta (3:2)

const NOTE_SECONDS = 0.1;
const ATTACK_SECONDS = 0.008;
const SECOND_NOTE_START_SECONDS = 0.12;
const TOTAL_SECONDS = SECOND_NOTE_START_SECONDS + NOTE_SECONDS;

const NOTES = [
  { frequency: ROOT_FREQUENCY, start: 0 },
  { frequency: FIFTH_FREQUENCY, start: SECOND_NOTE_START_SECONDS },
];

// Más presente que el SFX de interacción, pero por debajo del de éxito de
// puzle -- orden de importancia perceptual entre los tres SFX. El valor de
// PEAK_FRACTION es deliberadamente bajo (no 0.60, como en una primera
// iteración) por la misma razón documentada en
// tools/generate-sfx-interact.mjs: el pico real de un tono senoidal corto
// se acerca mucho a su propio PEAK_FRACTION, así que debe quedar muy por
// debajo del pico real (no nominal) del tema del epílogo.
const LOW_PASS_ALPHA = 0.42;
const PEAK_FRACTION = 0.3;

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
  `SFX de activación generado en ${OUTPUT_PATH} (${TOTAL_SECONDS.toFixed(3)}s, ${wavBuffer.length} bytes).`,
);

function sampleAt(t, notes) {
  let value = 0;

  for (const note of notes) {
    if (t < note.start || t >= note.start + NOTE_SECONDS) {
      continue;
    }

    const tInNote = t - note.start;

    value +=
      Math.sin(2 * Math.PI * note.frequency * tInNote) *
      noteEnvelope(tInNote, NOTE_SECONDS, ATTACK_SECONDS);
  }

  return value;
}

/*
 * Envolvente por nota: ataque lineal y caída lineal hasta 0 exactamente al
 * final de la propia nota, igual que en los generadores musicales -- cada
 * tono decae por completo antes del siguiente, así que el hueco entre
 * ambos es silencio real, no solapamiento.
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
