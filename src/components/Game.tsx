import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import { digitCounts, type GameAction, type GameState } from '../state/game';
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
  // Sin avisos de error, los contadores no deben delatar los números equivocados.
  const counts = useMemo(
    () => digitCounts(game.values, settings.showErrors ? game.solution : null),
    [game.values, game.solution, settings.showErrors],
  );
  const remaining = settings.showErrors
    ? game.values.reduce((n, v, i) => n + (v === game.solution[i] ? 0 : 1), 0)
    : game.values.filter((v) => !v).length;
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
      if (!e.correct && settings.showErrors) m = { tone: 'bad', text: 'Ese número no va ahí. Puede borrarlo o pulsar «Deshacer».' };
      else if (e.completedUnits.length) {
        const names = e.completedUnits.map((u) => UNIT_NAMES[Math.floor(u / 9)]);
        m = { tone: 'good', text: `¡Muy bien! Ha completado ${names.length > 1 ? 'una ' + names.join(' y una ') : 'una ' + names[0]}.` };
      } else if (e.correct && settings.showErrors) m = { tone: 'good', text: '¡Correcto!' };
    } else if (e.kind === 'hint') {
      m = { tone: 'info', text: `Pista: en la ${positionLabel(e.cell)} va el ${e.digit}.` };
    } else if (e.kind === 'given') {
      m = { tone: 'info', text: 'Este número viene puesto desde el principio y no se puede cambiar.' };
    } else if (e.kind === 'nothing-to-undo') {
      m = { tone: 'info', text: 'No hay nada que deshacer todavía.' };
    } else if (e.kind === 'undo') {
      m = { tone: 'neutral', text: 'Se ha deshecho el último paso.' };
    } else if (e.kind === 'need-cell') {
      m = { tone: 'info', text: 'Primero toque una casilla vacía del tablero y después el número.' };
    } else if (e.kind === 'erase') {
      m = { tone: 'neutral', text: 'Casilla borrada.' };
    }
    setFlash(m);
  }, [game.event, game.selected, game.notesMode, settings.showErrors]);

  const sel = game.selected;
  const guide: Message =
    sel === null
      ? { tone: 'neutral', text: 'Toque una casilla vacía del tablero para empezar.' }
      : game.puzzle[sel]
        ? { tone: 'neutral', text: 'Este número viene puesto. Elija una casilla vacía.' }
        : game.notesMode
          ? { tone: 'info', text: 'Modo notas: toque números para apuntarlos en pequeño. Toque otra vez para quitarlos.' }
          : game.values[sel]
            ? { tone: 'neutral', text: 'Puede cambiar el número tocando otro, o quitarlo con «Borrar».' }
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
          <div className="status-row">
            <span className="chip">
              {settings.showTimer && (
                <>
                  <IconClock />
                  <span aria-label={`Tiempo: ${formatTime(game.elapsedMs)}`}>{formatTime(game.elapsedMs)}</span>
                </>
              )}
            </span>
            <span className="chip">
              {remaining === 0 ? 'Completo' : `Faltan ${remaining} ${remaining === 1 ? 'casilla' : 'casillas'}`}
            </span>
          </div>
          <Board game={game} settings={settings} onSelect={(cell) => dispatch({ type: 'select', cell })} />
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
            <button type="button" className="action" onClick={() => dispatch({ type: 'hint' })}>
              <IconBulb />
              Pista
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
