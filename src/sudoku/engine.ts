// Motor de sudoku: generación de tableros completos, calificación "humana"
// y creación de puzzles con solución única para cada dificultad.

export type Grid = number[]; // 81 casillas, 0 = vacía

export type Difficulty = 'muy-facil' | 'facil' | 'medio' | 'dificil';

export const DIFFICULTIES: Difficulty[] = ['muy-facil', 'facil', 'medio', 'dificil'];

const ALL = 0x1ff;

// Unidades: 9 filas, 9 columnas, 9 cajas. PEERS[i] = casillas que comparten unidad con i.
export const UNITS: number[][] = [];
for (let r = 0; r < 9; r++) UNITS.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) {
  const r0 = Math.floor(b / 3) * 3;
  const c0 = (b % 3) * 3;
  UNITS.push(Array.from({ length: 9 }, (_, k) => (r0 + Math.floor(k / 3)) * 9 + c0 + (k % 3)));
}
export const CELL_UNITS: number[][] = Array.from({ length: 81 }, (_, i) => [
  Math.floor(i / 9),
  9 + (i % 9),
  18 + boxOf(i),
]);
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>();
  for (const u of CELL_UNITS[i]) for (const j of UNITS[u]) if (j !== i) set.add(j);
  return [...set];
});

export function rowOf(i: number) {
  return Math.floor(i / 9);
}
export function colOf(i: number) {
  return i % 9;
}
export function boxOf(i: number) {
  return Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
}

const bit = (d: number) => 1 << (d - 1);
function popcount(m: number) {
  let n = 0;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
}
function single(m: number) {
  return 31 - Math.clz32(m) + 1;
}
function digitsOf(m: number) {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d);
  return out;
}

export type Rng = () => number;

export function makeRng(seed = Date.now() ^ (Math.random() * 1e9)): Rng {
  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Cuenta soluciones (hasta `limit`) con backtracking y heurística de casilla más restringida. */
export function countSolutions(grid: Grid, limit = 2, rng?: Rng, out?: Grid): number {
  const g = grid.slice();
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const d = g[i];
    if (!d) continue;
    const b = bit(d);
    if (rows[rowOf(i)] & b || cols[colOf(i)] & b || boxes[boxOf(i)] & b) return 0;
    rows[rowOf(i)] |= b;
    cols[colOf(i)] |= b;
    boxes[boxOf(i)] |= b;
  }
  let count = 0;
  const search = (): boolean => {
    let best = -1;
    let bestMask = 0;
    let bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = popcount(m);
      if (n < bestN) {
        best = i;
        bestMask = m;
        bestN = n;
        if (n <= 1) break;
      }
    }
    if (best === -1) {
      count++;
      if (out && count === 1) for (let i = 0; i < 81; i++) out[i] = g[i];
      return count >= limit;
    }
    if (bestN === 0) return false;
    const ds = digitsOf(bestMask);
    if (rng) shuffle(ds, rng);
    const r = rowOf(best);
    const c = colOf(best);
    const bx = boxOf(best);
    for (const d of ds) {
      const b = bit(d);
      g[best] = d;
      rows[r] |= b;
      cols[c] |= b;
      boxes[bx] |= b;
      if (search()) return true;
      rows[r] &= ~b;
      cols[c] &= ~b;
      boxes[bx] &= ~b;
    }
    g[best] = 0;
    return false;
  };
  search();
  return count;
}

export function solve(grid: Grid): Grid | null {
  const out = new Array(81).fill(0);
  return countSolutions(grid, 1, undefined, out) === 1 ? out : null;
}

export function generateFullGrid(rng: Rng): Grid {
  const out = new Array(81).fill(0);
  countSolutions(new Array(81).fill(0), 1, rng, out);
  return out;
}

/**
 * Niveles de técnica (como los resolvería una persona):
 * 1 = único candidato en la casilla, 2 = único lugar en fila/columna/caja,
 * 3 = candidatos bloqueados (apuntando / reclamando), 4 = parejas desnudas u ocultas.
 * Devuelve el nivel máximo necesario, o Infinity si no se puede resolver con ellas.
 */
export function gradePuzzle(grid: Grid, maxLevel = 4): number {
  const g = grid.slice();
  const cand = new Array(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    let m = ALL;
    for (const p of PEERS[i]) if (g[p]) m &= ~bit(g[p]);
    cand[i] = m;
  }
  let remaining = g.filter((v) => !v).length;
  let hardest = 0;

  const place = (i: number, d: number) => {
    g[i] = d;
    cand[i] = 0;
    remaining--;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  };

  while (remaining > 0) {
    // Nivel 1: casilla con un único candidato
    let progressed = false;
    for (let i = 0; i < 81; i++) {
      if (!g[i] && popcount(cand[i]) === 1) {
        place(i, single(cand[i]));
        progressed = true;
      } else if (!g[i] && cand[i] === 0) return Infinity; // contradicción
    }
    if (progressed) {
      hardest = Math.max(hardest, 1);
      continue;
    }
    if (maxLevel < 2) return Infinity;

    // Nivel 2: el dígito solo cabe en un lugar de la unidad
    for (const unit of UNITS) {
      for (let d = 1; d <= 9 && !progressed; d++) {
        const b = bit(d);
        let pos = -1;
        let n = 0;
        for (const i of unit) {
          if (g[i] === d) {
            n = -1;
            break;
          }
          if (cand[i] & b) {
            pos = i;
            n++;
          }
        }
        if (n === 1) {
          place(pos, d);
          progressed = true;
        }
      }
      if (progressed) break;
    }
    if (progressed) {
      hardest = Math.max(hardest, 2);
      continue;
    }
    if (maxLevel < 3) return Infinity;

    // Nivel 3: candidatos bloqueados
    for (let u = 0; u < 27 && !progressed; u++) {
      const unit = UNITS[u];
      for (let d = 1; d <= 9 && !progressed; d++) {
        const b = bit(d);
        const cells = unit.filter((i) => cand[i] & b);
        if (cells.length < 2) continue;
        // ¿Todas las posiciones comparten otra unidad?
        const shared = CELL_UNITS[cells[0]].filter(
          (ou) => ou !== u && cells.every((i) => CELL_UNITS[i].includes(ou)),
        );
        for (const ou of shared) {
          for (const j of UNITS[ou]) {
            if (!cells.includes(j) && cand[j] & b) {
              cand[j] &= ~b;
              progressed = true;
            }
          }
        }
      }
    }
    if (progressed) {
      hardest = Math.max(hardest, 3);
      continue;
    }
    if (maxLevel < 4) return Infinity;

    // Nivel 4: parejas desnudas y ocultas
    for (let u = 0; u < 27 && !progressed; u++) {
      const unit = UNITS[u].filter((i) => !g[i]);
      // desnudas
      for (let a = 0; a < unit.length && !progressed; a++) {
        const ma = cand[unit[a]];
        if (popcount(ma) !== 2) continue;
        for (let k = a + 1; k < unit.length; k++) {
          if (cand[unit[k]] !== ma) continue;
          for (const j of unit) {
            if (j !== unit[a] && j !== unit[k] && cand[j] & ma) {
              cand[j] &= ~ma;
              progressed = true;
            }
          }
        }
      }
      // ocultas
      for (let d1 = 1; d1 <= 8 && !progressed; d1++) {
        for (let d2 = d1 + 1; d2 <= 9 && !progressed; d2++) {
          const p1 = unit.filter((i) => cand[i] & bit(d1));
          const p2 = unit.filter((i) => cand[i] & bit(d2));
          if (p1.length === 2 && p2.length === 2 && p1[0] === p2[0] && p1[1] === p2[1]) {
            const keep = bit(d1) | bit(d2);
            for (const i of p1) {
              if (cand[i] & ~keep) {
                cand[i] &= keep;
                progressed = true;
              }
            }
          }
        }
      }
    }
    if (progressed) {
      hardest = Math.max(hardest, 4);
      continue;
    }
    return Infinity;
  }
  return hardest;
}

interface Profile {
  targetGivens: number;
  maxLevel: number;
  minLevel: number;
}

const PROFILES: Record<Difficulty, Profile> = {
  'muy-facil': { targetGivens: 45, maxLevel: 1, minLevel: 0 },
  facil: { targetGivens: 37, maxLevel: 2, minLevel: 0 },
  medio: { targetGivens: 31, maxLevel: 3, minLevel: 2 },
  dificil: { targetGivens: 26, maxLevel: 4, minLevel: 3 },
};

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
  level: number;
}

function carve(solution: Grid, profile: Profile, rng: Rng): { puzzle: Grid; level: number } {
  const puzzle = solution.slice();
  // Se quitan casillas por parejas simétricas para que el tablero se vea armonioso.
  const order = shuffle(
    Array.from({ length: 41 }, (_, i) => i),
    rng,
  );
  let givens = 81;
  for (const i of order) {
    if (givens <= profile.targetGivens) break;
    const j = 80 - i;
    const vi = puzzle[i];
    const vj = puzzle[j];
    puzzle[i] = 0;
    puzzle[j] = 0;
    // Si se resuelve por lógica con las técnicas permitidas, la solución es única.
    if (gradePuzzle(puzzle, profile.maxLevel) === Infinity) {
      puzzle[i] = vi;
      puzzle[j] = vj;
    } else {
      givens -= i === j ? 1 : 2;
    }
  }
  return { puzzle, level: gradePuzzle(puzzle, profile.maxLevel) };
}

export function generatePuzzle(difficulty: Difficulty, rng: Rng = makeRng()): Puzzle {
  const profile = PROFILES[difficulty];
  let best: { puzzle: Grid; solution: Grid; level: number; givens: number } | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const solution = generateFullGrid(rng);
    const { puzzle, level } = carve(solution, profile, rng);
    const givens = puzzle.filter(Boolean).length;
    const okLevel = level >= profile.minLevel;
    const okGivens = givens <= profile.targetGivens + 2;
    if (okLevel && okGivens) return { puzzle, solution, difficulty, level };
    const score = (okLevel ? 0 : 100) + givens;
    const bestScore = best ? (best.level >= profile.minLevel ? 0 : 100) + best.givens : Infinity;
    if (score < bestScore) best = { puzzle, solution, level, givens };
  }
  return { puzzle: best!.puzzle, solution: best!.solution, difficulty, level: best!.level };
}
