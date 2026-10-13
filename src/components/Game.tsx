import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import { HINT_LIMIT, digitCounts, hintsLeft, type GameAction, type GameState } from '../state/game';
import { AlmostDoneOverlay } from './AlmostDoneOverlay';
import type { Settings } from '../state/storage';
import { LEVELS, formatTime, positionLabel } from '../labels';
import { Board } from './Board';
import {
  IconBulb,
  IconCheck,
  IconClock,
  IconErase,
  IconHome,
  IconInfo,
  IconPencil,
  IconQuestion,
  IconSettings,
  IconSparkle,
  IconUndo,
  IconWarn,
} from './Icons';

interface Props {
  game: GameState;
  settings: Settings;
  dispatch: Dispatch<GameAction>;
  onHome: () => void;
  onTutorial: () => void;
  onSettings: () => void;
  paused: boolean;
}

type Tone = 'neutral' | 'good' | 'bad' | 'info';
interface Message {
  tone: Tone;
  text: string;
}

const UNIT_NAMES = ['fila', 'columna', 'cuadro'];

export function Game({ game, settings, dispatch, onHome, onTutorial, onSettings, paused }: Props) {
  const [flash, setFlash] = useState<Message | null>(null);
  // Los contadores solo miran lo que hay en el tablero: nunca delatan si un número es correcto.
  const counts = useMemo(() => digitCounts(game.values), [game.values]);
  const remaining = game.values.filter((v) => !v).length;
  const toFill = game.puzzle.filter((v) => !v).length;
  const progress = toFill ? 1 - remaining / toFill : 1;
  const almost = remaining > 0 && remaining <= 5;
  const unlimited = settings.unlimitedHints;
  const left = hintsLeft(game, unlimited);
  const fullButWrong = !game.completed && game.values.every(Boolean);
  const level = LEVELS[game.difficulty];

  // Reloj: avanza cada segundo mientras se juega y la ventana está visible.
  useEffect(() => {
    if (game.completed || paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') dispatch({ type: 'tick', ms: 1000 });
    }, 1000);
    return () => window.clearInterval(id);
  }, [game.completed, paused, dispatch]);

  // Mensajes de ayuda según lo último que ha pasado.
  // Al cambiar de casilla sin un evento nuevo se vuelve al mensaje de guía normal.
  const lastEvent = useRef(game.event?.id);
  useEffect(() => {
    const e = game.event;
    if (!e || e.id === lastEvent.current) {
      setFlash(null);
      return;
    }
    lastEvent.current = e.id;
    let m: Message | null = null;
    if (e.kind === 'place') {
      if (e.completedUnits.length) {
        const names = e.completedUnits.map((u) => UNIT_NAMES[Math.floor(u / 9)]);
        m = { tone: 'neutral', text: `Ha llenado ${names.length > 1 ? 'una ' + names.join(' y una ') : 'una ' + names[0]} sin repetir números.` };
      }
    } else if (e.kind === 'hint') {
      const where = positionLabel(e.cell);
      m =
        e.mode === 'confirm'
          ? { tone: 'info', text: `Pista: el ${e.digit} de la ${where} es correcto.` }
          : e.mode === 'fix'
            ? { tone: 'info', text: `Pista: en la ${where} no iba el ${e.previous}; va el ${e.digit}.` }
            : { tone: 'info', text: `Pista: en la ${where} va el ${e.digit}.` };
    } else if (e.kind === 'given') {
      m = { tone: 'info', text: 'Este número viene puesto desde el principio y no se puede cambiar.' };
    } else if (e.kind === 'nothing-to-undo') {
      m = { tone: 'info', text: 'No hay nada que deshacer todavía.' };
    } else if (e.kind === 'undo') {
      m = { tone: 'neutral', text: 'Se ha deshecho el último paso.' };
    } else if (e.kind === 'no-hints') {
      m = {
        tone: 'bad',
        text: `Ya ha usado las ${HINT_LIMIT[game.difficulty]} pistas de esta partida. ¡Ánimo, usted puede! (En «Ajustes» puede quitar el límite).`,
      };
    } else if (e.kind === 'need-cell') {
      m = { tone: 'info', text: 'Primero toque una casilla vacía del tablero y después el número.' };
    } else if (e.kind === 'erase') {
      m = { tone: 'neutral', text: 'Casilla borrada.' };
    }
    setFlash(m);
  }, [game.event, game.selected, game.notesMode, game.difficulty]);

  const sel = game.selected;
  const guide: Message =
    sel === null
      ? { tone: 'neutral', text: 'Toque una casilla vacía del tablero para empezar.' }
      : game.puzzle[sel]
        ? { tone: 'neutral', text: 'Este número viene puesto. Elija una casilla vacía.' }
        : game.notesMode
          ? { tone: 'info', text: 'Modo notas: toque números para apuntarlos en pequeño. Toque otra vez para quitarlos.' }
          : game.values[sel]
            ? game.hints.includes(sel)
              ? { tone: 'neutral', text: 'Este número está comprobado con una pista.' }
              : { tone: 'neutral', text: 'Puede cambiarlo, quitarlo con «Borrar» o pulsar «Pista» para saber si es correcto.' }
            : { tone: 'neutral', text: 'Ahora toque el número que quiere poner.' };
  const msg: Message =
    flash ??
    (fullButWrong
      ? { tone: 'bad', text: 'El tablero está lleno, pero hay algún número equivocado. Revise o pida una pista.' }
      : guide);

  const onDigit = (d: number) => dispatch({ type: 'input', digit: d });

  const selValue = sel !== null ? game.values[sel] : 0;

  return (
    <div className="game">
      <header className="topbar">
        <button type="button" className="btn" onClick={onHome} aria-label="Volver al inicio">
          <IconHome />
          <span className="btn-label">Inicio</span>
        </button>
        <div className="title">
          <h1>Sudoku</h1>
          <span>
            <i className="level-dot" style={{ background: level.color }} aria-hidden="true" />
            Nivel {level.name.toLowerCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn" onClick={onTutorial} aria-label="Cómo se juega">
            <IconQuestion />
            <span className="btn-label">Ayuda</span>
          </button>
          <button type="button" className="btn" onClick={onSettings} aria-label="Ajustes">
            <IconSettings />
            <span className="btn-label">Ajustes</span>
          </button>
        </div>
      </header>

      <main className="game-main">
        <div className="board-wrap">
          <div className={`status-row${almost ? ' almost' : ''}`}>
            <span className="chip">
              {settings.showTimer && (
                <>
                  <IconClock />
                  <span aria-label={`Tiempo: ${formatTime(game.elapsedMs)}`}>{formatTime(game.elapsedMs)}</span>
                </>
              )}
            </span>
            <span className="chip chip-left">
              {remaining === 0 ? 'Tablero lleno' : `Faltan ${remaining} ${remaining === 1 ? 'casilla' : 'casillas'}`}
            </span>
          </div>
          <div className={`fill-bar${almost ? ' almost' : ''}`} aria-hidden="true">
            <i style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="board-stack">
            <Board game={game} settings={settings} almost={almost} onSelect={(cell) => dispatch({ type: 'select', cell })} />
            <AlmostDoneOverlay puzzleKey={game.puzzle.join('')} remaining={remaining} progress={progress} sound={settings.sound} />
          </div>
        </div>

        <div className={`controls${game.notesMode ? ' notes-on' : ''}`}>
          <div className="numpad" role="group" aria-label="Números">
            {Array.from({ length: 9 }, (_, k) => {
              const d = k + 1;
              const left = 9 - counts[d];
              const done = left <= 0;
              return (
                <button
                  key={d}
                  type="button"
                  className={`num${done ? ' done' : ''}${selValue === d ? ' active' : ''}`}
                  onClick={() => onDigit(d)}
                  aria-label={done ? `${d}, ya están todos` : `${d}, quedan ${left}`}
                >
                  <b>{d}</b>
                  <small>{done ? <IconCheck width={18} height={18} /> : `quedan ${left}`}</small>
                </button>
              );
            })}
          </div>
          <div className="actions">
            <button type="button" className="action" onClick={() => dispatch({ type: 'undo' })}>
              <IconUndo />
              Deshacer
            </button>
            <button type="button" className="action" onClick={() => dispatch({ type: 'erase' })}>
              <IconErase />
              Borrar
            </button>
            <button type="button" className="action" aria-pressed={game.notesMode} onClick={() => dispatch({ type: 'toggle-notes' })}>
              <IconPencil />
              Notas
              <span className="state">{game.notesMode ? 'SÍ' : 'NO'}</span>
            </button>
            <button
              type="button"
              className={`action${left === 0 ? ' spent' : ''}`}
              onClick={() => dispatch({ type: 'hint', unlimited })}
              aria-label={unlimited ? 'Pista: sin límite' : left === 0 ? 'Pista: no quedan pistas' : `Pista: quedan ${left}`}
            >
              <IconBulb />
              Pista
              <span className="state hint-count">{unlimited ? 'SIN LÍMITE' : left === 0 ? 'NINGUNA' : `QUEDAN ${left}`}</span>
            </button>
          </div>
          <div className={`helper tone-${msg.tone}`} role="status" aria-live="polite">
            {msg.tone === 'good' ? <IconSparkle /> : msg.tone === 'bad' ? <IconWarn /> : <IconInfo />}
            <span>{msg.text}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
