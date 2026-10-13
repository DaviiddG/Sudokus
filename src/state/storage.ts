import type { Difficulty, Grid } from '../sudoku/engine';

export type Theme = 'claro' | 'oscuro' | 'contraste';
export type TextSize = 'normal' | 'grande' | 'muy-grande';

export interface Settings {
  theme: Theme;
  textSize: TextSize;
  showErrors: boolean;
  highlightSame: boolean;
  showTimer: boolean;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'claro',
  textSize: 'grande',
  showErrors: true,
  highlightSame: true,
  showTimer: true,
  sound: true,
};

export interface SavedGame {
  version: 1;
  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  values: Grid;
  notes: number[];
  hints: number[]; // casillas rellenadas con pista
  mistakes: number;
  hintsUsed: number;
  elapsedMs: number;
  completed: boolean;
}

export interface DifficultyStats {
  won: number;
  bestMs: number | null;
}
export type Stats = Record<Difficulty, DifficultyStats>;

const KEYS = {
  settings: 'sudoku.ajustes.v1',
  game: 'sudoku.partida.v1',
  stats: 'sudoku.resultados.v1',
  tutorialSeen: 'sudoku.tutorial.v1',
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando sin guardar */
  }
}

export const storage = {
  loadSettings: (): Settings => {
    const saved = read<Partial<Settings>>(KEYS.settings);
    // Primera visita: se respeta si el dispositivo está en modo oscuro.
    const prefersDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return { ...DEFAULT_SETTINGS, theme: prefersDark ? 'oscuro' : 'claro', ...(saved ?? {}) };
  },
  saveSettings: (s: Settings) => write(KEYS.settings, s),
  loadGame: (): SavedGame | null => {
    const g = read<SavedGame>(KEYS.game);
    return g && g.version === 1 && g.values?.length === 81 ? g : null;
  },
  saveGame: (g: SavedGame | null) => write(KEYS.game, g),
  loadStats: (): Stats => {
    const base: Stats = {
      'muy-facil': { won: 0, bestMs: null },
      facil: { won: 0, bestMs: null },
      medio: { won: 0, bestMs: null },
      dificil: { won: 0, bestMs: null },
    };
    return { ...base, ...(read<Partial<Stats>>(KEYS.stats) ?? {}) };
  },
  saveStats: (s: Stats) => write(KEYS.stats, s),
  tutorialSeen: () => read<boolean>(KEYS.tutorialSeen) === true,
  markTutorialSeen: () => write(KEYS.tutorialSeen, true),
};
