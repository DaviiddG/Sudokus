import { describe, expect, it } from 'vitest';
import { digitCounts, gameReducer, newGame, type GameState } from './game';

const firstEmpty = (g: GameState) => g.puzzle.findIndex((v) => !v);
const wrongDigit = (g: GameState, i: number) => (g.solution[i] % 9) + 1;

describe('el juego no delata si un número es correcto', () => {
  it('poner un número equivocado no produce ninguna señal de error', () => {
    let g = newGame('facil');
    const i = firstEmpty(g);
    g = gameReducer(g, { type: 'select', cell: i });
    g = gameReducer(g, { type: 'input', digit: wrongDigit(g, i) });
    expect(g.event).toMatchObject({ kind: 'place', cell: i });
    expect(g.event && 'correct' in g.event).toBe(false);
    // los contadores cuentan lo que hay en el tablero, acertado o no
    expect(digitCounts(g.values)[wrongDigit(g, i)]).toBe(g.values.filter((v) => v === wrongDigit(g, i)).length);
  });

  it('la pista corrige un número equivocado de la casilla elegida', () => {
    let g = newGame('facil');
    const i = firstEmpty(g);
    const wrong = wrongDigit(g, i);
    g = gameReducer(g, { type: 'select', cell: i });
    g = gameReducer(g, { type: 'input', digit: wrong });
    g = gameReducer(g, { type: 'hint' });
    expect(g.values[i]).toBe(g.solution[i]);
    expect(g.event).toMatchObject({ kind: 'hint', mode: 'fix', previous: wrong, cell: i });
    expect(g.hintsUsed).toBe(1);
  });

  it('la pista confirma un número correcto sin moverse a otra casilla', () => {
    let g = newGame('facil');
    const i = firstEmpty(g);
    g = gameReducer(g, { type: 'select', cell: i });
    g = gameReducer(g, { type: 'input', digit: g.solution[i] });
    g = gameReducer(g, { type: 'hint' });
    expect(g.event).toMatchObject({ kind: 'hint', mode: 'confirm', cell: i });
    expect(g.hints).toContain(i);
    expect(g.selected).toBe(i);
  });

  it('sin casilla elegida, la pista rellena una casilla vacía (no una equivocada)', () => {
    let g = newGame('facil');
    const i = firstEmpty(g);
    g = gameReducer(g, { type: 'select', cell: i });
    g = gameReducer(g, { type: 'input', digit: wrongDigit(g, i) });
    g = gameReducer(g, { type: 'select', cell: null });
    g = gameReducer(g, { type: 'hint' });
    expect(g.event).toMatchObject({ kind: 'hint', mode: 'fill' });
    expect(g.values[i]).toBe(wrongDigit(g, i)); // el número equivocado sigue sin delatarse
  });
});
