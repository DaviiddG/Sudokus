import { describe, expect, it } from 'vitest';
import { countSolutions, DIFFICULTIES, generatePuzzle, gradePuzzle, makeRng, PEERS } from './engine';

describe('generatePuzzle', () => {
  for (const d of DIFFICULTIES) {
    it(`genera sudokus válidos y de solución única: ${d}`, () => {
      const rng = makeRng(1234);
      for (let k = 0; k < 8; k++) {
        const t0 = performance.now();
        const p = generatePuzzle(d, rng);
        const ms = performance.now() - t0;
        const givens = p.puzzle.filter(Boolean).length;
        console.log(d, 'pistas', givens, 'nivel', p.level, `${ms.toFixed(0)}ms`);
        expect(countSolutions(p.puzzle, 2)).toBe(1);
        for (let i = 0; i < 81; i++) {
          if (p.puzzle[i]) expect(p.puzzle[i]).toBe(p.solution[i]);
          for (const j of PEERS[i]) expect(p.solution[i]).not.toBe(p.solution[j]);
        }
        expect(gradePuzzle(p.puzzle)).toBe(p.level);
      }
    });
  }
});
