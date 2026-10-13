import { Player } from '@remotion/player';
import { DIFFICULTIES, type Difficulty } from '../sudoku/engine';
import { LEVELS, formatTime } from '../labels';
import type { SavedGame, Stats } from '../state/storage';
import { HINT_LIMIT } from '../state/game';
import { HERO_FPS, HERO_FRAMES, HERO_SIZE, HeroLoop } from '../remotion/HeroLoop';
import { IconPlay, IconQuestion, IconSettings } from './Icons';

interface Props {
  saved: SavedGame | null;
  stats: Stats;
  onContinue: () => void;
  onNew: (d: Difficulty) => void;
  onTutorial: () => void;
  onSettings: () => void;
}

export function Home({ saved, stats, onContinue, onNew, onTutorial, onSettings }: Props) {
  const resumable = saved && !saved.completed ? saved : null;
  const progress = resumable
    ? (() => {
        const empty = resumable.puzzle.filter((v) => !v).length;
        const filled = resumable.values.filter((v, i) => v && !resumable.puzzle[i]).length;
        return empty ? filled / empty : 0;
      })()
    : 0;

  return (
    <main className="home">
      <section className="home-hero">
        <div>
          <h1>
            Mi <em>Sudoku</em>
          </h1>
          <p className="lead">Números grandes, colores claros y ayudas siempre a mano. Juegue a su ritmo.</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-lg" onClick={onTutorial}>
              <IconQuestion />
              Cómo se juega
            </button>
            <button type="button" className="btn btn-lg" onClick={onSettings}>
              <IconSettings />
              Ajustes
            </button>
          </div>
        </div>
        <div className="hero-player" aria-hidden="true">
          <Player
            component={HeroLoop}
            durationInFrames={HERO_FRAMES}
            fps={HERO_FPS}
            compositionWidth={HERO_SIZE}
            compositionHeight={HERO_SIZE}
            style={{ width: '100%', height: '100%' }}
            autoPlay
            loop
            controls={false}
            clickToPlay={false}
            initiallyMuted
            acknowledgeRemotionLicense
          />
        </div>
      </section>

      {resumable && (
        <button type="button" className="continue-card" onClick={onContinue}>
          <span className="icon-circle">
            <IconPlay />
          </span>
          <span style={{ flex: 1 }}>
            <strong>Continuar mi partida</strong>
            <span>
              {LEVELS[resumable.difficulty].name} · {Math.round(progress * 100)} % completado · {formatTime(resumable.elapsedMs)}
            </span>
            <div className="progress" aria-hidden="true">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
          </span>
        </button>
      )}

      <h2 className="section-title">{resumable ? 'O empiece uno nuevo' : 'Elija la dificultad para empezar'}</h2>
      <div className="level-grid">
        {DIFFICULTIES.map((d) => {
          const L = LEVELS[d];
          const st = stats[d];
          return (
            <button
              key={d}
              type="button"
              className="level-card"
              style={{ '--level-color': L.color } as React.CSSProperties}
              onClick={() => onNew(d)}
              aria-label={`Jugar un sudoku ${L.name}. ${L.desc}`}
            >
              <span className="dots" aria-hidden="true">
                {[1, 2, 3, 4].map((k) => (
                  <i key={k} className={k <= L.dots ? 'on' : ''} />
                ))}
              </span>
              <span className="level-name">{L.name}</span>
              <span className="level-desc">
                {L.desc} Tiene {HINT_LIMIT[d]} pistas.
              </span>
              <span className="level-meta">
                {st.won
                  ? `Completados: ${st.won}${st.bestMs ? ` · Mejor tiempo: ${formatTime(st.bestMs)}` : ''}`
                  : 'Aún no ha completado ninguno'}
              </span>
              <span className="play-pill" aria-hidden="true">
                Jugar
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
