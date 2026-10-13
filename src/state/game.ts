import { generatePuzzle, PEERS, UNITS, CELL_UNITS, type Difficulty, type Grid } from '../sudoku/engine';
import type { SavedGame } from './storage';

export interface GameState extends SavedGame {
  selected: number | null;
  notesMode: boolean;
  history: { values: Grid; notes: number[]; hints: number[] }[];
  /** Último evento, para animaciones, sonidos y mensajes. `id` cambia en cada evento. */
  event: GameEvent | null;
}

export type GameEvent =
  | { id: number; kind: 'place'; cell: number; completedUnits: number[] }
  /** fill: casilla vacía rellenada · fix: número equivocado corregido · confirm: el número del jugador era correcto */
  | { id: number; kind: 'hint'; cell: number; digit: number; mode: 'fill' | 'fix' | 'confirm'; previous: number; completedUnits: number[] }
  | { id: number; kind: 'erase'; cell: number }
  | { id: number; kind: 'undo' }
  | { id: number; kind: 'nothing-to-undo' }
  | { id: number; kind: 'given'; cell: number }
  | { id: number; kind: 'need-cell' }
  | { id: number; kind: 'no-hints' }
  | { id: number; kind: 'win' };

export type GameAction =
  | { type: 'select'; cell: number | null }
  | { type: 'move'; dr: number; dc: number }
  | { type: 'input'; digit: number }
  | { type: 'erase' }
  | { type: 'undo' }
  | { type: 'toggle-notes' }
  /** `unlimited`: el ajuste «Pistas sin límite» está activado. */
  | { type: 'hint'; unlimited?: boolean }
  | { type: 'tick'; ms: number };

/** Pistas disponibles en cada partida según la dificultad. */
export const HINT_LIMIT: Record<Difficulty, number> = { 'muy-facil': 5, facil: 4, medio: 3, dificil: 3 };

export const hintsLeft = (s: Pick<GameState, 'difficulty' | 'hintsUsed'>, unlimited = false) =>
  unlimited ? Infinity : Math.max(0, HINT_LIMIT[s.difficulty] - s.hintsUsed);

let eventId = 0;
const ev = <T extends Omit<GameEvent, 'id'>>(e: T) => ({ ...e, id: ++eventId }) as GameEvent;

export function newGame(difficulty: Difficulty): GameState {
  const { puzzle, solution } = generatePuzzle(difficulty);
  return {
    version: 1,
    difficulty,
    puzzle,
    solution,
    values: puzzle.slice(),
    notes: new Array(81).fill(0),
    hints: [],
    mistakes: 0,
    hintsUsed: 0,
    elapsedMs: 0,
    completed: false,
    selected: null,
    notesMode: false,
    history: [],
    event: null,
  };
}

export function fromSaved(saved: SavedGame): GameState {
  return { ...saved, selected: null, notesMode: false, history: [], event: null };
}

export function toSaved(s: GameState): SavedGame {
  const { version, difficulty, puzzle, solution, values, notes, hints, mistakes, hintsUsed, elapsedMs, completed } = s;
  return { version, difficulty, puzzle, solution, values, notes, hints, mistakes, hintsUsed, elapsedMs, completed };
}

export function isSolved(values: Grid, solution: Grid) {
  for (let i = 0; i < 81; i++) if (values[i] !== solution[i]) return false;
  return true;
}

/**
 * Unidades (fila/columna/caja) de la casilla que han quedado llenas con los 9 números sin repetir.
 * Solo usa lo que el jugador ve en el tablero, nunca la solución, para no delatar si acertó.
 */
function completedUnitsAt(cell: number, values: Grid): number[] {
  return CELL_UNITS[cell].filter((u) => new Set(UNITS[u].map((i) => values[i]).filter(Boolean)).size === 9);
}

function snapshot(s: GameState) {
  return { values: s.values, notes: s.notes, hints: s.hints };
}

function withHistory(s: GameState): GameState['history'] {
  const h = [...s.history, snapshot(s)];
  return h.length > 200 ? h.slice(-200) : h;
}

function place(s: GameState, cell: number, digit: number): GameState {
  const values = s.values.slice();
  const notes = s.notes.slice();
  values[cell] = digit;
  notes[cell] = 0;
  // Al poner un número se quitan las notas de ese número en su fila, columna y caja.
  for (const p of PEERS[cell]) notes[p] &= ~(1 << (digit - 1));
  const solved = isSolved(values, s.solution);
  return {
    ...s,
    history: withHistory(s),
    values,
    notes,
    hints: s.hints.filter((h) => h !== cell),
    mistakes: s.mistakes + (s.solution[cell] === digit ? 0 : 1),
    completed: solved,
    event: solved ? ev({ kind: 'win' }) : ev({ kind: 'place', cell, completedUnits: completedUnitsAt(cell, values) }),
  };
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  if (s.completed && a.type !== 'select') return s;
  switch (a.type) {
    case 'select':
      return { ...s, selected: a.cell };
    case 'move': {
      const cur = s.selected ?? 40;
      const r = (Math.floor(cur / 9) + a.dr + 9) % 9;
      const c = ((cur % 9) + a.dc + 9) % 9;
      return { ...s, selected: r * 9 + c };
    }
    case 'toggle-notes':
      return { ...s, notesMode: !s.notesMode };
    case 'tick':
      return { ...s, elapsedMs: s.elapsedMs + a.ms };
    case 'input': {
      const cell = s.selected;
      if (cell === null) return { ...s, event: ev({ kind: 'need-cell' }) };
      if (s.puzzle[cell]) return { ...s, event: ev({ kind: 'given', cell }) };
      if (s.notesMode) {
        if (s.values[cell]) return s;
        const notes = s.notes.slice();
        notes[cell] ^= 1 << (a.digit - 1);
        return { ...s, history: withHistory(s), notes };
      }
      if (s.values[cell] === a.digit) return s;
      return place(s, cell, a.digit);
    }
    case 'erase': {
      const cell = s.selected;
      if (cell === null) return s;
      if (s.puzzle[cell]) return { ...s, event: ev({ kind: 'given', cell }) };
      if (!s.values[cell] && !s.notes[cell]) return s;
      const values = s.values.slice();
      const notes = s.notes.slice();
      values[cell] = 0;
      notes[cell] = 0;
      return {
        ...s,
        history: withHistory(s),
        values,
        notes,
        hints: s.hints.filter((h) => h !== cell),
        event: ev({ kind: 'erase', cell }),
      };
    }
    case 'undo': {
      const prev = s.history[s.history.length - 1];
      if (!prev) return { ...s, event: ev({ kind: 'nothing-to-undo' }) };
      return { ...s, ...prev, history: s.history.slice(0, -1), event: ev({ kind: 'undo' }) };
    }
    case 'hint': {
      // La pista es la única forma de saber si un número va en una casilla:
      // casilla vacía → se rellena; número del jugador → se comprueba (y se corrige si está mal).
      if (hintsLeft(s, a.unlimited) === 0) return { ...s, event: ev({ kind: 'no-hints' }) };
      let cell = s.selected;
      const isUserCell = (i: number) => !s.puzzle[i] && !s.hints.includes(i);
      if (cell === null || !isUserCell(cell)) {
        // Sin casilla válida elegida: la vacía más fácil (la que tiene menos posibilidades).
        // Si el tablero está lleno, una de las equivocadas.
        const pool = s.values.some((v) => !v)
          ? (i: number) => !s.values[i]
          : (i: number) => s.values[i] !== s.solution[i];
        let best = -1;
        let bestN = 10;
        for (let i = 0; i < 81; i++) {
          if (!pool(i)) continue;
          const n = 9 - new Set(PEERS[i].map((p) => s.values[p]).filter(Boolean)).size;
          if (n < bestN) {
            best = i;
            bestN = n;
          }
        }
        if (best === -1) return s;
        cell = best;
      }
      const digit = s.solution[cell];
      const previous = s.values[cell];
      const mode = !previous ? 'fill' : previous === digit ? 'confirm' : 'fix';
      if (mode === 'confirm') {
        return {
          ...s,
          selected: cell,
          history: withHistory(s),
          hints: [...s.hints, cell],
          hintsUsed: s.hintsUsed + 1,
          event: ev({ kind: 'hint', cell, digit, mode, previous, completedUnits: [] }),
        };
      }
      const next = place({ ...s, selected: cell }, cell, digit);
      return {
        ...next,
        mistakes: s.mistakes,
        hints: [...next.hints, cell],
        hintsUsed: s.hintsUsed + 1,
        event: next.completed
          ? next.event
          : ev({ kind: 'hint', cell, digit, mode, previous, completedUnits: completedUnitsAt(cell, next.values) }),
      };
    }
  }
}

/** Cuántas veces está puesto cada número en el tablero (índice 1..9), acertado o no. */
export function digitCounts(values: Grid): number[] {
  const counts = new Array(10).fill(0);
  for (let i = 0; i < 81; i++) if (values[i]) counts[values[i]]++;
  return counts;
}
