import { memo } from 'react';
import { UNITS, boxOf, colOf, rowOf } from '../sudoku/engine';
import type { GameState } from '../state/game';
import type { Settings } from '../state/storage';

interface Props {
  game: GameState;
  settings: Settings;
  onSelect: (cell: number) => void;
}

function describe(game: GameState, i: number, showErrors: boolean) {
  const pos = `Fila ${rowOf(i) + 1}, columna ${colOf(i) + 1}`;
  const v = game.values[i];
  if (game.puzzle[i]) return `${pos}: ${v}, número fijo`;
  if (v) {
    const wrong = showErrors && v !== game.solution[i];
    return `${pos}: ${v}${wrong ? ', incorrecto' : ''}`;
  }
  const notes = [];
  for (let d = 1; d <= 9; d++) if (game.notes[i] & (1 << (d - 1))) notes.push(d);
  return notes.length ? `${pos}: vacía, notas ${notes.join(', ')}` : `${pos}: vacía`;
}

export const Board = memo(function Board({ game, settings, onSelect }: Props) {
  const sel = game.selected;
  const selValue = sel !== null ? game.values[sel] : 0;
  const ev = game.event;

  // Animación de "ola" en las filas/columnas/cajas recién completadas.
  const wave = new Map<number, number>();
  if (ev && (ev.kind === 'place' || ev.kind === 'hint')) {
    for (const u of ev.completedUnits) {
      UNITS[u].forEach((cell, k) => {
        if (!wave.has(cell)) wave.set(cell, k);
      });
    }
  }

  return (
    <div className="board" role="group" aria-label="Tablero de sudoku">
      {game.values.map((v, i) => {
        const given = !!game.puzzle[i];
        const isSel = sel === i;
        const peer =
          sel !== null && !isSel && (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel));
        const same = settings.highlightSame && !isSel && selValue !== 0 && v === selValue;
        const error = settings.showErrors && v !== 0 && v !== game.solution[i];
        const hint = game.hints.includes(i);
        const animate =
          ev && 'cell' in ev && ev.cell === i
            ? ev.kind === 'place' && !ev.correct && settings.showErrors
              ? 'shake'
              : ev.kind === 'place' || ev.kind === 'hint'
                ? 'pop'
                : ev.kind === 'given'
                  ? 'shake'
                  : ''
            : '';
        const k = wave.get(i);
        const cls = [
          'cell',
          given && 'given',
          hint && 'hint',
          peer && 'peer',
          same && 'same',
          isSel && 'selected',
          error && 'error',
          animate,
          k !== undefined && 'wave',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={i}
            type="button"
            className={cls}
            data-r={rowOf(i)}
            data-c={colOf(i)}
            style={
              k !== undefined
                ? ({ '--k': k, '--wave-name': ev!.id % 2 ? 'wave' : 'wave2' } as React.CSSProperties)
                : undefined
            }
            tabIndex={isSel || (sel === null && i === 0) ? 0 : -1}
            aria-label={describe(game, i, settings.showErrors)}
            aria-pressed={isSel}
            onPointerDown={(e) => {
              e.preventDefault();
              onSelect(i);
              (e.currentTarget as HTMLButtonElement).focus({ preventScroll: true });
            }}
            onClick={() => onSelect(i)}
            onFocus={() => sel === null && onSelect(i)}
          >
            {v ? (
              <span className="digit" key={animate ? ev!.id : 'd'}>
                {v}
              </span>
            ) : game.notes[i] ? (
              <span className="notes" aria-hidden="true">
                {Array.from({ length: 9 }, (_, d) => (
                  <span key={d} className={selValue === d + 1 && settings.highlightSame ? 'match' : undefined}>
                    {game.notes[i] & (1 << d) ? d + 1 : ''}
                  </span>
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
});
