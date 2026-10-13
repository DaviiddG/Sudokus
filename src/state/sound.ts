// Sonidos suaves generados con Web Audio (sin archivos externos).
let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain = 0.12, type: OscillatorType = 'sine') {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sounds = {
  tap: () => tone(660, 0, 0.12, 0.06),
  place: () => tone(784, 0, 0.18, 0.09),
  unit: () => [659, 784, 988].forEach((f, k) => tone(f, k * 0.09, 0.35, 0.08)),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, k * 0.12, 0.6, 0.1)),
};
