import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { CHAPTERS, TUTORIAL_FPS, TUTORIAL_FRAMES, TUTORIAL_H, TUTORIAL_VH, TUTORIAL_VW, TUTORIAL_W, Tutorial } from '../remotion/Tutorial';
import { IconBack, IconNext, IconPause, IconPlay, IconRestart } from './Icons';
import { Modal } from './Modal';

export function TutorialDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Cómo se juega" onClose={onClose} wide closeLabel="Cerrar">
      {open && <TutorialPlayer onFinish={onClose} />}
    </Modal>
  );
}

function TutorialPlayer({ onFinish }: { onFinish: () => void }) {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  // En pantallas estrechas se usa la versión vertical del vídeo, con letras más grandes.
  const [vertical] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const w = vertical ? TUTORIAL_VW : TUTORIAL_W;
  const h = vertical ? TUTORIAL_VH : TUTORIAL_H;

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => {
      setPlaying(true);
      setEnded(false);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setEnded(true);
    };
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    p.addEventListener('ended', onEnded);
    setPlaying(p.isPlaying());
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
      p.removeEventListener('ended', onEnded);
    };
  }, []);

  const current = Math.max(0, CHAPTERS.findLastIndex((c) => frame >= c.from));
  const goTo = (k: number) => {
    const ch = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, k))];
    ref.current?.seekTo(ch.from);
    ref.current?.play();
  };

  return (
    <div>
      <div className="player-frame" style={{ aspectRatio: `${w} / ${h}` }}>
        <Player
          ref={ref}
          component={Tutorial}
          durationInFrames={TUTORIAL_FRAMES}
          fps={TUTORIAL_FPS}
          compositionWidth={w}
          compositionHeight={h}
          style={{ width: '100%', height: '100%' }}
          clickToPlay
          autoPlay
          initiallyMuted
          moveToBeginningWhenEnded={false}
          acknowledgeRemotionLicense
        />
      </div>
      <div className="chapters" aria-label="Partes del tutorial">
        {CHAPTERS.map((c, k) => {
          const p = Math.max(0, Math.min(1, (frame - c.from) / c.duration));
          return (
            <button key={c.title} type="button" className={k === current ? 'current' : ''} onClick={() => goTo(k)} aria-label={c.title} aria-current={k === current ? 'step' : undefined}>
              <i>
                <b style={{ width: `${p * 100}%` }} />
              </i>
              <span>{c.title}</span>
            </button>
          );
        })}
      </div>
      <div className="tutorial-controls">
        <div className="group">
          <button type="button" className="btn" onClick={() => goTo(current - 1)} disabled={current === 0}>
            <IconBack />
            <span>Anterior</span>
          </button>
          {ended ? (
            <button type="button" className="btn btn-primary" onClick={() => goTo(0)}>
              <IconRestart />
              <span>Repetir</span>
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => ref.current?.toggle()}>
              {playing ? <IconPause /> : <IconPlay />}
              <span>{playing ? 'Pausa' : 'Reproducir'}</span>
            </button>
          )}
          <button type="button" className="btn" onClick={() => goTo(current + 1)} disabled={current === CHAPTERS.length - 1}>
            <span>Siguiente</span>
            <IconNext />
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={onFinish}>
          ¡Entendido, a jugar!
        </button>
      </div>
    </div>
  );
}
