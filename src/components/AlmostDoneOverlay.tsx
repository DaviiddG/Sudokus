import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { ALMOST_FPS, ALMOST_FRAMES, ALMOST_H, ALMOST_W, AlmostDone } from '../remotion/AlmostDone';
import { sounds } from '../state/sound';

/** Momentos en que se celebra que falta poco: al bajar a 5 casillas vacías y a la última. */
const MILESTONES = [5, 1];

interface Props {
  /** Identifica la partida, para no repetir los avisos de la misma. */
  puzzleKey: string;
  remaining: number;
  progress: number;
  sound: boolean;
}

export function AlmostDoneOverlay({ puzzleKey, remaining, progress, sound }: Props) {
  const [show, setShow] = useState<{ remaining: number; progress: number; id: number } | null>(null);
  const prev = useRef({ puzzleKey, remaining });
  const shown = useRef(new Set<number>());
  const player = useRef<PlayerRef>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = { puzzleKey, remaining };
    if (before.puzzleKey !== puzzleKey) {
      shown.current.clear();
      setShow(null);
      return;
    }
    // Solo al ir llenando (no al cargar una partida ni al deshacer hacia atrás).
    const hit = MILESTONES.find((m) => before.remaining > m && remaining === m && !shown.current.has(m));
    if (hit === undefined) return;
    shown.current.add(hit);
    setShow({ remaining, progress, id: Date.now() });
    if (sound) sounds.unit();
  }, [puzzleKey, remaining, progress, sound]);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onEnded = () => setShow(null);
    p.addEventListener('ended', onEnded);
    return () => p.removeEventListener('ended', onEnded);
  }, [show]);

  if (!show) return null;
  return (
    <div className="almost-overlay" aria-hidden="true">
      <Player
        key={show.id}
        ref={player}
        component={AlmostDone}
        inputProps={{ remaining: show.remaining, progress: show.progress }}
        durationInFrames={ALMOST_FRAMES}
        fps={ALMOST_FPS}
        compositionWidth={ALMOST_W}
        compositionHeight={ALMOST_H}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        autoPlay
        initiallyMuted
        controls={false}
        clickToPlay={false}
        moveToBeginningWhenEnded={false}
        acknowledgeRemotionLicense
      />
    </div>
  );
}
