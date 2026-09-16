/**
 * @file signaling.ts
 * @description Domain logic and timing engines for emergency visual and audible signaling.
 *
 * Operational Principles:
 * 1. Universal SAR Whistle Standard: Search and Rescue teams globally recognize 3 sharp blasts
 *    as the distress signal. Responders reply with 2 blasts. A critical mistake made by lost hikers
 *    is continuously blowing without pausing to listen; this module enforces the mandatory 60-second
 *    listening phase.
 * 2. Optimal Audio Acoustics: Whistle audio synthesis targets 2.8 kHz, the optimal frequency for
 *    sound propagation through dense Pacific Northwest coniferous forests without severe canopy attenuation.
 * 3. International Optical SOS: Morse code optical signaling follows standard ITU-R timing ratios
 *    (1 unit dot, 3 units dash, 1 unit symbol space, 3 units letter space, 7 units word pause).
 */

export interface MorseElement {
  light: boolean;
  durationMs: number;
  label: string;
}

/**
 * Standard Morse SOS optical flash sequence: ... --- ...
 * Unit time (dot) = 200ms.
 */
export function getMorseSOSElements(): MorseElement[] {
  const dot = 200;
  const dash = 600;
  const intraSymbol = 200;
  const intraLetter = 600;
  const wordPause = 2000;

  const elements: MorseElement[] = [];

  // S: dot dot dot
  for (let i = 0; i < 3; i++) {
    elements.push({ light: true, durationMs: dot, label: "S (dot)" });
    elements.push({ light: false, durationMs: i === 2 ? intraLetter : intraSymbol, label: "pause" });
  }

  // O: dash dash dash
  for (let i = 0; i < 3; i++) {
    elements.push({ light: true, durationMs: dash, label: "O (dash)" });
    elements.push({ light: false, durationMs: i === 2 ? intraLetter : intraSymbol, label: "pause" });
  }

  // S: dot dot dot
  for (let i = 0; i < 3; i++) {
    elements.push({ light: true, durationMs: dot, label: "S (dot)" });
    elements.push({ light: false, durationMs: i === 2 ? wordPause : intraSymbol, label: "pause" });
  }

  return elements;
}

export type WhistlePhase =
  | "blast_1"
  | "pause_1"
  | "blast_2"
  | "pause_2"
  | "blast_3"
  | "listening";

export interface WhistleStep {
  phase: WhistlePhase;
  isBlasting: boolean;
  durationSeconds: number;
  displayTitle: string;
  displayInstruction: string;
}

export const WHISTLE_CADENCE_STEPS: WhistleStep[] = [
  {
    phase: "blast_1",
    isBlasting: true,
    durationSeconds: 3,
    displayTitle: "BLAST 1 OF 3",
    displayInstruction: "Blow whistle firmly with steady breath",
  },
  {
    phase: "pause_1",
    isBlasting: false,
    durationSeconds: 1,
    displayTitle: "PAUSE",
    displayInstruction: "Catch breath",
  },
  {
    phase: "blast_2",
    isBlasting: true,
    durationSeconds: 3,
    displayTitle: "BLAST 2 OF 3",
    displayInstruction: "Blow whistle firmly with steady breath",
  },
  {
    phase: "pause_2",
    isBlasting: false,
    durationSeconds: 1,
    displayTitle: "PAUSE",
    displayInstruction: "Catch breath",
  },
  {
    phase: "blast_3",
    isBlasting: true,
    durationSeconds: 3,
    displayTitle: "BLAST 3 OF 3",
    displayInstruction: "Final blast of this cycle",
  },
  {
    phase: "listening",
    isBlasting: false,
    durationSeconds: 60,
    displayTitle: "LISTEN FOR RESCUERS",
    displayInstruction: "Remain completely silent. Responders reply with 2 blasts.",
  },
];

/**
 * Total cycle duration in seconds (3 + 1 + 3 + 1 + 3 + 60 = 71 seconds).
 */
export const TOTAL_WHISTLE_CYCLE_SECONDS = WHISTLE_CADENCE_STEPS.reduce(
  (acc, s) => acc + s.durationSeconds,
  0,
);

/**
 * Play a synthesized piercing 2800 Hz whistle tone via Web Audio API if available.
 * Returns a stop function.
 */
export function playWebWhistleTone(frequencyHz: number = 2800): () => void {
  if (typeof window === "undefined") return () => {};
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return () => {};

  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 2.8 kHz sine wave with slight high-frequency overtone for piercing whistle acoustics
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);

    // Fade in to avoid click
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    return () => {
      try {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            osc.stop();
            void ctx.close();
          } catch {
            // Ignore close errors
          }
        }, 60);
      } catch {
        // Ignore errors
      }
    };
  } catch {
    return () => {};
  }
}
