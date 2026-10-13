import type { ReactNode } from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MiniBoard, Pointer, SAMPLE_GIVEN, SAMPLE_SOLUTION, cellBox } from './shared';

export const TUTORIAL_FPS = 30;
export const TUTORIAL_W = 1280;
export const TUTORIAL_H = 720;
// Versión vertical para teléfonos: mismo contenido, colocado en columna.
export const TUTORIAL_VW = 720;
export const TUTORIAL_VH = 1100;

export const CHAPTERS = [
  { title: 'El objetivo', from: 0, duration: 180 },
  { title: 'Filas', from: 180, duration: 210 },
  { title: 'Columnas', from: 390, duration: 180 },
  { title: 'Cuadros', from: 570, duration: 210 },
  { title: 'Cómo jugar', from: 780, duration: 330 },
  { title: 'Ayudas', from: 1110, duration: 330 },
];
export const TUTORIAL_FRAMES = 1440;

const BOARD = 560;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function useVertical() {
  const { width, height } = useVideoConfig();
  return height > width;
}

function Caption({ step, title, text, delay = 0 }: { step: string; title: string; text: ReactNode; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const v = useVertical();
  return (
    <div style={{ opacity: s, transform: `translateY(${(1 - s) * 30}px)`, textAlign: v ? 'center' : undefined }}>
      <div
        style={{
          display: 'inline-block',
          padding: '8px 22px',
          borderRadius: 99,
          background: C.accentSoft,
          color: C.accent,
          fontFamily: C.font,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: '0.04em',
          marginBottom: 22,
        }}
      >
        {step}
      </div>
      <div style={{ fontFamily: C.display, fontWeight: 700, fontSize: v ? 66 : 76, lineHeight: 1.02, color: C.ink, marginBottom: v ? 16 : 24 }}>
        {title}
      </div>
      <div style={{ fontFamily: C.font, fontSize: v ? 36 : 40, lineHeight: 1.3, color: C.soft, fontWeight: 600 }}>{text}</div>
    </div>
  );
}

function Layout({ board, caption }: { board: ReactNode; caption: ReactNode }) {
  if (useVertical()) {
    return (
      <AbsoluteFill style={{ background: C.bg, alignItems: 'center', justifyContent: 'center', padding: '0 60px', gap: 44 }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{caption}</div>
        <div style={{ flex: 'none' }}>{board}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: C.bg, flexDirection: 'row', alignItems: 'center', padding: '0 70px', gap: 70 }}>
      <div style={{ flex: 'none' }}>{board}</div>
      <div style={{ flex: 1 }}>{caption}</div>
    </AbsoluteFill>
  );
}

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
}

/* 1 · El objetivo: el tablero se va llenando */
function Goal() {
  const frame = useCurrentFrame();
  const enter = useEnter();
  const empties = SAMPLE_SOLUTION.map((_, i) => i).filter((i) => !SAMPLE_GIVEN[i]);
  return (
    <Layout
      board={
        <MiniBoard
          size={BOARD}
          style={{ transform: `scale(${0.9 + enter * 0.1})`, opacity: enter }}
          cell={(i) => {
            if (SAMPLE_GIVEN[i]) return { digit: SAMPLE_SOLUTION[i] };
            const k = empties.indexOf(i);
            const t = 40 + (k / empties.length) * 100;
            const p = interpolate(frame, [t, t + 10], [0, 1], clamp);
            return { digit: SAMPLE_SOLUTION[i], opacity: p, scale: 0.5 + p * 0.5, color: C.user, weight: 600 };
          }}
        />
      }
      caption={
        <Caption
          step="PASO 1 DE 6"
          title="El objetivo"
          text={
            <>
              Rellene todas las casillas vacías
              <br />
              con números del <b style={{ color: C.ink }}>1 al 9</b>.
            </>
          }
          delay={6}
        />
      }
    />
  );
}

/* 2-4 · Filas, columnas y cuadros */
function UnitScene({ kind }: { kind: 'row' | 'col' | 'box' }) {
  const frame = useCurrentFrame();
  const cells =
    kind === 'row'
      ? Array.from({ length: 9 }, (_, k) => 4 * 9 + k)
      : kind === 'col'
        ? Array.from({ length: 9 }, (_, k) => k * 9 + 4)
        : [30, 31, 32, 39, 40, 41, 48, 49, 50];
  const band = interpolate(frame, [15, 45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const order = [...cells].sort((a, b) => SAMPLE_SOLUTION[a] - SAMPLE_SOLUTION[b]);
  const reveal = (i: number) => {
    const k = order.indexOf(i);
    return interpolate(frame, [55 + k * 9, 65 + k * 9], [0, 1], clamp);
  };
  const first = cellBox(BOARD, cells[0]);
  const last = cellBox(BOARD, cells[8]);
  const pad = 6;
  const text =
    kind === 'row' ? (
      <>
        En cada <b style={{ color: C.ink }}>fila</b> (de izquierda a derecha) deben estar los 9 números,{' '}
        <b style={{ color: C.ink }}>sin repetir</b> ninguno.
      </>
    ) : kind === 'col' ? (
      <>
        En cada <b style={{ color: C.ink }}>columna</b> (de arriba abajo) pasa lo mismo: del 1 al 9, sin repetir.
      </>
    ) : (
      <>
        Y en cada <b style={{ color: C.ink }}>cuadro</b> de 3 × 3 también: del 1 al 9, sin repetir.
      </>
    );
  return (
    <Layout
      board={
        <MiniBoard
          size={BOARD}
          cell={(i) => {
            const inUnit = cells.includes(i);
            if (inUnit) {
              const p = SAMPLE_GIVEN[i] ? 1 : reveal(i);
              return {
                digit: SAMPLE_SOLUTION[i],
                opacity: SAMPLE_GIVEN[i] ? 1 : p,
                scale: SAMPLE_GIVEN[i] ? 1 : 0.6 + p * 0.4,
                background: C.accentSoft,
                color: SAMPLE_GIVEN[i] ? C.ink : C.user,
              };
            }
            return { digit: SAMPLE_GIVEN[i] ? SAMPLE_SOLUTION[i] : null, opacity: 1 - band * 0.65 };
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: first.x - pad,
              top: first.y - pad,
              width: (last.x + last.size - first.x + pad * 2) * (kind === 'row' ? band : 1),
              height: (last.y + last.size - first.y + pad * 2) * (kind === 'col' ? band : 1),
              border: `6px solid ${C.accent}`,
              borderRadius: 12,
              opacity: kind === 'box' ? band : 1,
              transform: kind === 'box' ? `scale(${1.3 - band * 0.3})` : undefined,
            }}
          />
        </MiniBoard>
      }
      caption={
        <div>
          <Caption
            step={kind === 'row' ? 'PASO 2 DE 6' : kind === 'col' ? 'PASO 3 DE 6' : 'PASO 4 DE 6'}
            title={kind === 'row' ? 'Cada fila' : kind === 'col' ? 'Cada columna' : 'Cada cuadro'}
            text={text}
            delay={6}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 34, justifyContent: 'center' }}>
            {Array.from({ length: 9 }, (_, d) => {
              const i = order[d];
              const p = SAMPLE_GIVEN[i] ? interpolate(frame, [55, 65], [0, 1], clamp) : reveal(i);
              return (
                <div
                  key={d}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: C.font,
                    fontWeight: 800,
                    fontSize: 30,
                    background: p > 0.5 ? C.successSoft : C.surface,
                    color: p > 0.5 ? C.success : C.soft,
                    border: `3px solid ${p > 0.5 ? C.success : 'var(--line)'}`,
                    transform: `scale(${1 + Math.sin(p * Math.PI) * 0.18})`,
                  }}
                >
                  {d + 1}
                </div>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

/* 5 · Cómo jugar: tocar casilla y luego número */
const TARGET = 2 * 9 + 0; // fila 3, columna 1 → va un 1
function HowTo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = useVertical();
  const boardSize = v ? 540 : 520;
  const target = cellBox(boardSize, TARGET);
  const boardX = v ? 90 : 70;
  const boardY = v ? 130 : 140;
  const padX = v ? 60 : 690;
  const padY = v ? 710 : 200;
  const keySize = v ? 84 : 92;
  const keyStep = keySize + 12;
  const key = (d: number) => ({
    x: padX + ((d - 1) % 3) * keyStep + keySize / 2,
    y: padY + Math.floor((d - 1) / 3) * keyStep + keySize / 2,
  });
  const digit = SAMPLE_SOLUTION[TARGET];
  const start = v ? { x: 620, y: 1040 } : { x: 1100, y: 640 };
  const inset = Math.max(3, boardSize / 110);
  const cellPt = { x: boardX + inset + target.x + target.size / 2, y: boardY + inset + target.y + target.size / 2 };
  const keyPt = key(digit);

  const m1 = interpolate(frame, [30, 75], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const m2 = interpolate(frame, [150, 195], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const px = start.x + (cellPt.x - start.x) * m1 + (keyPt.x - cellPt.x) * m2;
  const py = start.y + (cellPt.y - start.y) * m1 + (keyPt.y - cellPt.y) * m2;
  const tap = (t: number) => interpolate(frame, [t, t + 6, t + 16], [0, 1, 0], clamp);
  const pressed = Math.max(tap(82), tap(202));
  const selected = frame >= 86;
  const placed = frame >= 208;
  const pop = spring({ frame: frame - 208, fps, config: { damping: 10, stiffness: 160 } });
  const step2 = frame >= 120;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: 'absolute', left: v ? 60 : 70, top: 36, right: 60, display: 'flex', alignItems: 'baseline', gap: 26, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: C.display, fontSize: 60, fontWeight: 700, color: C.ink }}>Cómo jugar</span>
        <span style={{ fontFamily: C.font, fontSize: 28, fontWeight: 800, color: C.accent, letterSpacing: '0.04em' }}>PASO 5 DE 6</span>
      </div>
      <div style={{ position: 'absolute', left: boardX, top: boardY }}>
        <MiniBoard
          size={boardSize}
          cell={(i) => {
            if (i === TARGET) {
              return {
                digit: placed ? digit : null,
                scale: placed ? 0.4 + pop * 0.6 : 1,
                background: selected ? C.selected : undefined,
                color: C.user,
              };
            }
            const r = Math.floor(i / 9);
            const c = i % 9;
            const peer = selected && (r === 2 || c === 0 || (r < 3 && c < 3));
            return { digit: SAMPLE_GIVEN[i] ? SAMPLE_SOLUTION[i] : null, background: peer ? C.peer : undefined };
          }}
        />
      </div>
      {Array.from({ length: 9 }, (_, k) => {
        const d = k + 1;
        const p = key(d);
        const active = d === digit && frame >= 202 && frame < 222;
        return (
          <div
            key={d}
            style={{
              position: 'absolute',
              left: p.x - keySize / 2,
              top: p.y - keySize / 2,
              width: keySize,
              height: keySize,
              borderRadius: 20,
              background: active ? C.accentSoft : C.surface,
              border: `3px solid ${active ? C.accent : 'var(--line)'}`,
              display: 'grid',
              placeItems: 'center',
              fontFamily: C.font,
              fontWeight: 700,
              fontSize: 46,
              color: C.user,
              boxShadow: '0 6px 14px -8px rgba(0,0,0,.35)',
              opacity: interpolate(frame, [100, 120], [0.35, 1], clamp),
            }}
          >
            {d}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: v ? padX + keyStep * 3 + 20 : padX - 10,
          top: v ? padY : padY + 330,
          width: v ? 720 - (padX + keyStep * 3 + 20) - 40 : 540,
          fontFamily: C.font,
          fontSize: v ? 32 : 36,
          fontWeight: 700,
          lineHeight: 1.3,
          color: C.ink,
        }}
      >
        <div style={{ opacity: step2 ? 0.45 : 1 }}>1. Toque una casilla vacía.</div>
        <div style={{ opacity: interpolate(frame, [120, 135], [0, 1], clamp) }}>2. Toque el número que quiere poner.</div>
        <div style={{ color: C.success, opacity: interpolate(frame, [235, 250], [0, 1], clamp) }}>¡Listo! El número aparece.</div>
      </div>
      <Pointer x={px} y={py} pressed={pressed} />
    </AbsoluteFill>
  );
}

/* 6 · Ayudas */
const HELPS = [
  { name: 'Deshacer', text: 'Vuelve atrás el último paso.', icon: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11' },
  { name: 'Borrar', text: 'Quita el número de la casilla.', icon: 'M20 20H9L4.6 15.6a2 2 0 0 1 0-2.8l8.8-8.8a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 18.4M9.5 9.5l5 5' },
  { name: 'Notas', text: 'Apunte en pequeño los números posibles.', icon: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4' },
  { name: 'Pista', text: 'Le dice un número correcto.', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z' },
];
function Helps() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = spring({ frame: frame - 230, fps, config: { damping: 14 } });
  const v = useVertical();
  return (
    <AbsoluteFill style={{ background: C.bg, padding: v ? '40px 50px' : '50px 70px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginBottom: 34, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: C.display, fontSize: 60, fontWeight: 700, color: C.ink }}>Si necesita ayuda</span>
        <span style={{ fontFamily: C.font, fontSize: 28, fontWeight: 800, color: C.accent, letterSpacing: '0.04em' }}>PASO 6 DE 6</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: v ? '1fr' : '1fr 1fr', gap: v ? 20 : 26, opacity: 1 - end * 0.85 }}>
        {HELPS.map((h, k) => {
          const s = spring({ frame: frame - 15 - k * 40, fps, config: { damping: 16 } });
          return (
            <div
              key={h.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '24px 28px',
                borderRadius: 26,
                background: C.surface,
                border: '3px solid var(--line)',
                opacity: s,
                transform: `translateY(${(1 - s) * 40}px)`,
              }}
            >
              <div
                style={{
                  flex: 'none',
                  width: 104,
                  height: 104,
                  borderRadius: 24,
                  background: C.accentSoft,
                  color: C.accent,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={h.icon} />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: C.font, fontWeight: 800, fontSize: 44, color: C.ink }}>{h.name}</div>
                <div style={{ fontFamily: C.font, fontWeight: 600, fontSize: 30, color: C.soft, lineHeight: 1.25 }}>{h.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div
          style={{
            opacity: end,
            transform: `scale(${0.7 + end * 0.3})`,
            background: C.accent,
            color: 'var(--accent-ink)',
            padding: v ? '40px 40px' : '44px 80px',
            margin: v ? '0 40px' : 0,
            borderRadius: 40,
            textAlign: 'center',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,.45)',
          }}
        >
          <div style={{ fontFamily: C.display, fontWeight: 700, fontSize: v ? 72 : 92 }}>¡Ya puede jugar!</div>
          <div style={{ fontFamily: C.font, fontWeight: 700, fontSize: 36, marginTop: 8 }}>Sin prisa: cada error se puede deshacer.</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Fade({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 12, duration - 10, duration], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

export function Tutorial() {
  const scenes = [<Goal />, <UnitScene kind="row" />, <UnitScene kind="col" />, <UnitScene kind="box" />, <HowTo />, <Helps />];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {CHAPTERS.map((ch, k) => (
        <Sequence key={ch.title} from={ch.from} durationInFrames={ch.duration} name={ch.title}>
          <Fade duration={k === CHAPTERS.length - 1 ? ch.duration + 20 : ch.duration}>{scenes[k]}</Fade>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
