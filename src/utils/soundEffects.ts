// RupeeRookie Native Web Audio Synthesizer
// Zero external dependencies - uses the browser's built-in AudioContext
// Generates authentic financial exchange sounds, order chimes, and coin clinks mathematically.

const SOUND_KEY = 'rr_sound_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_KEY) !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('rr_sound_toggle', { detail: { enabled } }));
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * 1. Order Executed Chime: Harmonic double-tone chime with gentle brightness
 */
export function playOrderFilledSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    masterGain.connect(ctx.destination);

    // Primary bell tone (C6 = ~1046.5 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12); // slides up to E6

    // Shimmer harmonic (G6 = ~1567.98 Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1567.98, now + 0.05);

    osc1.connect(masterGain);
    osc2.connect(masterGain);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  } catch {
    // Fail silently if audio blocked
  }
}

/**
 * 2. 3D Coin Landing Clink: Heavy brass metallic contact with subtle resonant ring
 */
export function playCoinLandingSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Contact thud
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.35, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thudGain.connect(ctx.destination);

    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(280, now);
    thudOsc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    thudOsc.connect(thudGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.12);

    // Brass coin ping (Metallic ring ~2100Hz + ~3200Hz)
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.22, now + 0.02);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    ringGain.connect(ctx.destination);

    const ringOsc1 = ctx.createOscillator();
    ringOsc1.type = 'sine';
    ringOsc1.frequency.setValueAtTime(2093, now + 0.02);

    const ringOsc2 = ctx.createOscillator();
    ringOsc2.type = 'sine';
    ringOsc2.frequency.setValueAtTime(3135.96, now + 0.02);

    ringOsc1.connect(ringGain);
    ringOsc2.connect(ringGain);

    ringOsc1.start(now + 0.02);
    ringOsc2.start(now + 0.02);
    ringOsc1.stop(now + 0.7);
    ringOsc2.stop(now + 0.7);
  } catch {
    // Fail silently
  }
}

/**
 * 3. Stop-Loss Triggered Sound: Cautionary descending dual-tone
 */
export function playStopLossTriggeredSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.15); // E4 dip

    // Low-pass filter to smooth harsh sawtooth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    osc.connect(filter);
    filter.connect(gain);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Fail silently
  }
}

/**
 * 4. NSE Opening Gong Bell: Deep reverberant exchange brass bell (440Hz + harmonics)
 */
export function playNseBellSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0.3, now);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    bellGain.connect(ctx.destination);

    // Fundamental + overtone harmonics of a brass bell
    const harmonics = [440, 880, 1320, 1760];
    const amplitudes = [0.15, 0.08, 0.04, 0.02];

    harmonics.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime(amplitudes[idx], now);
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + (2.4 / (idx + 1)));

      osc.connect(hGain);
      hGain.connect(bellGain);

      osc.start(now);
      osc.stop(now + 2.5);
    });
  } catch {
    // Fail silently
  }
}

/**
 * 5. Success / Achievement Chime: Ascending pentatonic flourish
 */
export function playSuccessChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const noteTime = now + (i * 0.07);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.connect(gain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  } catch {
    // Fail silently
  }
}
