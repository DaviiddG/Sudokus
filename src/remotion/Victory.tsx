import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './shared';

export const VICTORY_W = 1000;
export const VICTORY_H = 520;
export const VICTORY_FPS = 30;
export const VICTORY_FRAMES = 180;

export interface VictoryProps {
  levelName: string;
  levelColor: string;
}

const COLORS = ['#264bc2', '#e9a23b', '#13724a', '#d4553f', '#7b5cc4', '#2d9cdb', '#f2c94c'];

function Confetti() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 90 }, (_, i) => {
        const x0 = random(`x${i}`) * VICTORY_W;
        const delay = random(`d${i}`) * 50;
        const speed = 3 + random(`s${i}`) * 4;
        const sway = 20 + random(`w${i}`) * 50;
        const t = frame - delay;
        if (t < 0) return null;
        const y = -30 + t * speed;
        if (y > VICTORY_H + 40) return null;
        const x = x0 + Math.sin(t / (8 + random(`f${i}`) * 10)) * sway;
        const rot = t * (4 + random(`r${i}`) * 10);
        const w = 10 + random(`sz${i}`) * 10;
        const round = random(`sh${i}`) > 0.7;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: round ? w : w * 0.45,
              borderRadius: round ? '50%' : 3,
              background: COLORS[i % COLORS.length],
              transform: `rotate(${rot}deg) rotateX(${rot * 1.3}deg)`,
              opacity: interpolate(t, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function Star({ progress }: { progress: number }) {
  const frame = useCurrentFrame();
  const glow = 0.5 + Math.sin(frame / 10) * 0.5;
  return (
    <div style={{ position: 'relative', width: 190, height: 190, transform: `scale(${progress}) rotate(${(1 - progress) * -90}deg)` }}>
      <div
        style={{
          position: 'absolute',
          inset: -30,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(242,182,94,${0.35 + glow * 0.25}), transparent 65%)`,
        }}
      />
      {Array.from({ length: 12 }, (_, k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 95 - 3,
            top: 95 - 110,
            width: 6,
            height: 26,
            borderRadius: 3,
            background: '#e9a23b',
            transformOrigin: '3px 110px',
            transform: `rotate(${k * 30 + frame * 0.6}deg)`,
            opacity: 0.55,
          }}
        />
      ))}
      <svg viewBox="0 0 24 24" width="190" height="190" style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 10px 18px rgba(160,100,10,.4))' }}>
        <path
          d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z"
          fill="#f2b23a"
          stroke="#b5741a"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M12 5.5l1.9 3.9 4.3.6" fill="none" stroke="#fff3d1" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  );
}

export function Victory({ levelName, levelColor }: VictoryProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const star = spring({ frame: frame - 4, fps, config: { damping: 9, stiffness: 90 } });
  const title = spring({ frame: frame - 22, fps, config: { damping: 14 } });
  const sub = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const words = '¡Enhorabuena!'.split('');
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, var(--surface), var(--surface-2) 70%)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Confetti />
      <Star progress={star} />
      <div style={{ display: 'flex', marginTop: 18 }}>
        {words.map((ch, k) => {
          const s = spring({ frame: frame - 22 - k * 2, fps, config: { damping: 12, stiffness: 140 } });
          return (
            <span
              key={k}
              style={{
                fontFamily: C.display,
                fontWeight: 700,
                fontSize: 96,
                color: C.ink,
                display: 'inline-block',
                transform: `translateY(${(1 - s) * 50}px)`,
                opacity: Math.min(1, s * 1.4) * title,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          opacity: sub,
          transform: `translateY(${(1 - sub) * 16}px)`,
          fontFamily: C.font,
          fontSize: 38,
          fontWeight: 700,
          color: C.soft,
          marginTop: 6,
        }}
      >
        Ha completado un sudoku{' '}
        <span style={{ color: '#fff', background: levelColor, padding: '2px 18px', borderRadius: 99 }}>{levelName}</span>
      </div>
    </AbsoluteFill>
  );
}
