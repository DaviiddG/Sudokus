import type { CSSProperties, ReactNode } from 'react';

// Tablero de ejemplo (resuelto) y qué casillas se muestran como "fijas".
export const SAMPLE_SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];
const GIVEN_MASK =
  '110010000' +
  '100111000' +
  '011000010' +
  '100010001' +
  '100101001' +
  '100010001' +
  '010000110' +
  '000111001' +
  '000010011';
export const SAMPLE_GIVEN = SAMPLE_SOLUTION.map((_, i) => GIVEN_MASK[i] === '1');

export const C = {
  bg: 'var(--surface-2)',
  surface: 'var(--surface)',
  ink: 'var(--ink)',
  soft: 'var(--ink-soft)',
  line: 'var(--line-strong)',
  cell: 'var(--cell)',
  accent: 'var(--accent)',
  accentSoft: 'var(--accent-soft)',
  user: 'var(--digit-user)',
  success: 'var(--success)',
  successSoft: 'var(--success-soft)',
  peer: 'var(--cell-peer)',
  selected: 'var(--cell-selected)',
  warm: 'var(--warm)',
  font: 'var(--font)',
  display: 'var(--display)',
};

export interface CellLook {
  digit?: number | null;
  /** 0..1 */
  opacity?: number;
  scale?: number;
  background?: string;
  color?: string;
  weight?: number;
}

export function MiniBoard({
  size,
  cell,
  style,
  children,
}: {
  size: number;
  cell: (i: number) => CellLook;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const { border, inner } = metrics(size);
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        background: C.line,
        borderRadius: size / 36,
        padding: border,
        boxShadow: '0 20px 50px -20px rgba(20,20,40,.45)',
        ...style,
      }}
    >
      <div style={{ position: 'relative', width: inner, height: inner }}>
        {Array.from({ length: 81 }, (_, i) => {
          const b = cellBox(size, i);
          const look = cell(i);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                background: look.background ?? C.cell,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: C.font,
                fontSize: b.size * 0.6,
                fontWeight: look.weight ?? 700,
                color: look.color ?? C.ink,
              }}
            >
              {look.digit ? (
                <span style={{ opacity: look.opacity ?? 1, transform: `scale(${look.scale ?? 1})`, display: 'block' }}>
                  {look.digit}
                </span>
              ) : null}
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

/** Posición (dentro del tablero) de la esquina superior izquierda de una casilla. */
function metrics(size: number) {
  const border = Math.max(3, size / 110);
  const inner = size - border * 2;
  const thick = Math.max(2.5, size / 170);
  const cs = (inner - 6 - thick * 2) / 9;
  return { border, inner, thick, cs };
}

/** Posición (dentro del tablero) de la esquina superior izquierda de una casilla. */
export function cellBox(size: number, i: number) {
  const { thick, cs } = metrics(size);
  const pos = (k: number) => k * cs + k + (k > 2 ? thick - 1 : 0) + (k > 5 ? thick - 1 : 0);
  return { x: pos(i % 9), y: pos(Math.floor(i / 9)), size: cs };
}

export function Pointer({ x, y, pressed }: { x: number; y: number; pressed: number }) {
  // Mano que señala; `pressed` 0..1 hace el gesto de tocar.
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 10 }}>
      <div
        style={{
          position: 'absolute',
          left: -40,
          top: -40,
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: `5px solid ${C.warm}`,
          opacity: pressed * 0.9,
          transform: `scale(${0.4 + pressed * 0.8})`,
        }}
      />
      <svg
        width="86"
        height="86"
        viewBox="0 0 24 24"
        style={{ position: 'absolute', left: -20, top: -6, transform: `scale(${1 - pressed * 0.12})`, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.3))' }}
      >
        <path
          d="M8.5 11V4.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V10m0-.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v4.5a7 7 0 0 1-7 7h-1a6 6 0 0 1-4.6-2.2L4.1 15a1.6 1.6 0 0 1 2.3-2.2l2.1 1.7"
          fill="#fff"
          stroke="#1b2333"
          strokeWidth="1.3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
