import { Player } from '@remotion/player';
import { LEVELS, formatTimeWords } from '../labels';
import { HINT_LIMIT, type GameState } from '../state/game';
import { VICTORY_FPS, VICTORY_FRAMES, VICTORY_H, VICTORY_W, Victory } from '../remotion/Victory';
import { IconHome, IconPlus } from './Icons';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  game: GameState;
  isRecord: boolean;
  onAgain: () => void;
  onHome: () => void;
}

export function VictoryDialog({ open, game, isRecord, onAgain, onHome }: Props) {
  const level = LEVELS[game.difficulty];
  return (
    <Modal open={open} title="¡Sudoku completado!" onClose={onHome} wide hideClose dismissable={false}>
      {open && (
        <>
          <div className="player-frame victory-frame" style={{ aspectRatio: `${VICTORY_W} / ${VICTORY_H}` }}>
            <Player
              component={Victory}
              inputProps={{ levelName: level.name.toLowerCase(), levelColor: level.color }}
              durationInFrames={VICTORY_FRAMES}
              fps={VICTORY_FPS}
              compositionWidth={VICTORY_W}
              compositionHeight={VICTORY_H}
              style={{ width: '100%', height: '100%' }}
              autoPlay
              controls={false}
              clickToPlay={false}
              acknowledgeRemotionLicense
            />
          </div>
          <div className="victory-stats">
            <div>
              <span>Tiempo</span>
              <strong>{formatTimeWords(game.elapsedMs)}</strong>
              {isRecord && <span style={{ color: 'var(--success)', fontWeight: 800 }}>¡Su mejor marca!</span>}
            </div>
            <div>
              <span>Pistas usadas</span>
              <strong>
                {game.hintsUsed} de {HINT_LIMIT[game.difficulty]}
              </strong>
            </div>
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn btn-lg" onClick={onHome}>
              <IconHome />
              Volver al inicio
            </button>
            <button type="button" className="btn btn-lg btn-primary" onClick={onAgain} data-autofocus>
              <IconPlus />
              Jugar otro {level.name.toLowerCase()}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
