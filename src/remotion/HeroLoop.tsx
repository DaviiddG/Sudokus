import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, MiniBoard, SAMPLE_GIVEN, SAMPLE_SOLUTION } from './shared';

export const HERO_SIZE = 600;
export const HERO_FPS = 30;
export const HERO_FRAMES = 300;

const empties = SAMPLE_SOLUTION.map((_, i) => i).filter((i) => !SAMPLE_GIVEN[i]);
// Orden "aleatorio" fijo para que el bucle sea siempre igual.
const order = [...empties].sort((a, b) => ((a * 37) % 53) - ((b * 37) % 53));

/** Animación decorativa en bucle para la portada: el tablero se resuelve solo con calma. */
export function HeroLoop() {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [255, 290], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Una banda luminosa recorre las filas cuando el tablero está completo.
  const sweep = interpolate(frame, [200, 250], [-1, 9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.surface, alignItems: 'center', justifyContent: 'center' }}>
      <MiniBoard
        size={520}
        cell={(i) => {
          const r = Math.floor(i / 9);
          const glow = Math.max(0, 1 - Math.abs(r - sweep));
          const background = glow > 0.05 ? `color-mix(in srgb, var(--success-soft) ${Math.round(glow * 100)}%, var(--cell))` : undefined;
          if (SAMPLE_GIVEN[i]) return { digit: SAMPLE_SOLUTION[i], background };
          const k = order.indexOf(i);
          const t = 15 + k * 3.6;
          const p = interpolate(frame, [t, t + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * fadeOut;
          return {
            digit: SAMPLE_SOLUTION[i],
            opacity: p,
            scale: 0.6 + p * 0.4,
            color: C.user,
            weight: 600,
            background,
          };
        }}
      />
    </AbsoluteFill>
  );
}
