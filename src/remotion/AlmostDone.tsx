import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './shared';

export const ALMOST_W = 800;
export const ALMOST_H = 420;
export const ALMOST_FPS = 30;
export const ALMOST_FRAMES = 96;

export interface AlmostDoneProps {
  /** Casillas vacías que quedan. */
  remaining: number;
  /** Fracción del tablero ya llena (0..1). */
  progress: number;
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Aviso animado que aparece sobre el tablero cuando quedan pocas casillas. */
export function AlmostDone({ remaining, progress }: AlmostDoneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const exit = interpolate(frame, [ALMOST_FRAMES - 16, ALMOST_FRAMES - 1], [1, 0], clamp);
  const ring = interpolate(frame, [8, 40], [Math.max(0, progress - 0.12), progress], clamp);
  const count = spring({ frame: frame - 14, fps, config: { damping: 9, stiffness: 180 } });
  const last = remaining === 1;
  const R = 92;
  const circ = 2 * Math.PI * R;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: exit }}>
      {/* chispas que salen del centro */}
      {Array.from({ length: 22 }, (_, i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const dist = 160 + random(`d${i}`) * 200;
        const t = interpolate(frame, [6, 50], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
        const size = 8 + random(`s${i}`) * 10;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ALMOST_W / 2 + Math.cos(angle) * dist * t - size / 2,
              top: ALMOST_H / 2 + Math.sin(angle) * dist * t * 0.6 - size / 2,
              width: size,
              height: size,
              borderRadius: i % 3 ? '50%' : 3,
              background: i % 2 ? C.warm : C.accent,
              opacity: interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
              transform: `rotate(${frame * 6 + i * 20}deg)`,
            }}
          />
        );
      })}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 34,
          padding: '30px 46px 30px 30px',
          borderRadius: 40,
          background: C.surface,
          border: `5px solid ${C.warm}`,
          boxShadow: '0 30px 70px -20px rgba(20,20,40,.55)',
          transform: `scale(${0.6 + enter * 0.4}) translateY(${(1 - enter) * 40}px)`,
        }}
      >
        <div style={{ position: 'relative', width: 220, height: 220, flex: 'none' }}>
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
            <circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke={C.warm}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - ring)}
              transform="rotate(-90 110 110)"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontFamily: C.display,
              fontWeight: 700,
              fontSize: 110,
              color: C.ink,
              transform: `scale(${0.3 + count * 0.7})`,
            }}
          >
            {remaining}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: C.display, fontWeight: 700, fontSize: 74, lineHeight: 1, color: C.ink }}>
            {last ? '¡La última!' : '¡Ya casi!'}
          </div>
          <div style={{ fontFamily: C.font, fontWeight: 700, fontSize: 38, color: C.soft, marginTop: 12, maxWidth: 360 }}>
            {last ? 'Solo queda una casilla vacía.' : `Solo quedan ${remaining} casillas vacías.`}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
