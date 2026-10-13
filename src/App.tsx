import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { Difficulty } from './sudoku/engine';
import { fromSaved, gameReducer, newGame, toSaved, type GameAction, type GameState } from './state/game';
import { storage, type Settings, type Stats } from './state/storage';
import { sounds } from './state/sound';
import { LEVELS } from './labels';
import { Home } from './components/Home';
import { Game } from './components/Game';
import { SettingsDialog } from './components/SettingsDialog';
import { TutorialDialog } from './components/TutorialDialog';
import { VictoryDialog } from './components/VictoryDialog';
import { Confirm } from './components/Modal';

type RootAction = GameAction | { type: 'set'; game: GameState | null };
function rootReducer(s: GameState | null, a: RootAction): GameState | null {
  if (a.type === 'set') return a.game;
  return s ? gameReducer(s, a) : s;
}

type Screen = 'home' | 'game' | 'loading';

export default function App() {
  const [settings, setSettings] = useState<Settings>(storage.loadSettings);
  const [stats, setStats] = useState<Stats>(storage.loadStats);
  const [game, dispatch] = useReducer(rootReducer, null, () => {
    const saved = storage.loadGame();
    return saved && !saved.completed ? fromSaved(saved) : null;
  });
  const [screen, setScreen] = useState<Screen>('home');
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [loadingLevel, setLoadingLevel] = useState<Difficulty>('facil');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [confirmLevel, setConfirmLevel] = useState<Difficulty | null>(null);

  // Tema y tamaño de letra en el <html>.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.tema = settings.theme;
    root.dataset.size = settings.textSize;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', settings.theme === 'oscuro' ? '#11151d' : settings.theme === 'contraste' ? '#ffffff' : '#f4eee3');
    storage.saveSettings(settings);
  }, [settings]);

  // Guardado automático de la partida.
  useEffect(() => {
    if (game && !game.completed) storage.saveGame(toSaved(game));
  }, [game]);

  // Sonidos y victoria.
  const lastEvent = useRef<number | null>(null);
  useEffect(() => {
    const e = game?.event;
    if (!game || !e || e.id === lastEvent.current) return;
    lastEvent.current = e.id;
    const play = settings.sound;
    if (e.kind === 'place') {
      if (play) (e.completedUnits.length ? sounds.unit : sounds.place)();
    } else if (e.kind === 'hint') {
      if (play) (e.completedUnits.length ? sounds.unit : sounds.place)();
    } else if (e.kind === 'win') {
      if (play) sounds.win();
      const prev = stats[game.difficulty];
      const record = prev.bestMs === null || game.elapsedMs < prev.bestMs;
      const next: Stats = {
        ...stats,
        [game.difficulty]: { won: prev.won + 1, bestMs: record ? game.elapsedMs : prev.bestMs },
      };
      setStats(next);
      storage.saveStats(next);
      storage.saveGame(null);
      setIsRecord(record && prev.won > 0);
      window.setTimeout(() => {
        if (screenRef.current === 'game') setShowVictory(true);
      }, 900);
    }
  }, [game, settings.sound, stats]);

  const start = useCallback((d: Difficulty) => {
    setConfirmLevel(null);
    setShowVictory(false);
    setLoadingLevel(d);
    setScreen('loading');
    // Se deja pintar la pantalla de espera antes de generar.
    window.setTimeout(() => {
      dispatch({ type: 'set', game: newGame(d) });
      setScreen('game');
    }, 350);
  }, []);

  const requestNew = (d: Difficulty) => {
    const inProgress = game && !game.completed && game.values.some((v, i) => v && !game.puzzle[i]);
    if (inProgress) setConfirmLevel(d);
    else start(d);
  };

  // Teclado: flechas para moverse, números para escribir, Supr/Retroceso para borrar.
  const modalOpen = showSettings || showTutorial || showVictory || confirmLevel !== null;
  useEffect(() => {
    if (screen !== 'game' || modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          dispatch({ type: 'undo' });
        }
        return;
      }
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      if (moves[e.key]) {
        e.preventDefault();
        dispatch({ type: 'move', dr: moves[e.key][0], dc: moves[e.key][1] });
        return;
      }
      if (/^[1-9]$/.test(e.key)) dispatch({ type: 'input', digit: Number(e.key) });
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') dispatch({ type: 'erase' });
      else if (e.key.toLowerCase() === 'n') dispatch({ type: 'toggle-notes' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, modalOpen]);

  // Mantener el foco en la casilla seleccionada al moverse con el teclado.
  useEffect(() => {
    if (screen !== 'game' || game?.selected == null) return;
    const el = document.querySelector<HTMLButtonElement>('.cell[tabindex="0"]');
    if (el && document.activeElement?.classList.contains('cell')) el.focus({ preventScroll: true });
  }, [game?.selected, screen]);

  // Primera visita: se ofrece el tutorial automáticamente.
  useEffect(() => {
    if (!storage.tutorialSeen()) {
      const id = window.setTimeout(() => setShowTutorial(true), 700);
      return () => window.clearTimeout(id);
    }
  }, []);

  const closeTutorial = () => {
    storage.markTutorialSeen();
    setShowTutorial(false);
  };

  return (
    <>
      {screen === 'home' && (
        <Home
          saved={game ? toSaved(game) : null}
          stats={stats}
          onContinue={() => setScreen('game')}
          onNew={requestNew}
          onTutorial={() => setShowTutorial(true)}
          onSettings={() => setShowSettings(true)}
          unlimitedHints={settings.unlimitedHints}
        />
      )}
      {screen === 'loading' && (
        <div className="loading" role="status">
          <div>
            <p>Preparando un sudoku {LEVELS[loadingLevel].name.toLowerCase()}…</p>
          </div>
        </div>
      )}
      {screen === 'game' && game && (
        <Game
          game={game}
          settings={settings}
          dispatch={dispatch}
          paused={modalOpen}
          onHome={() => setScreen('home')}
          onTutorial={() => setShowTutorial(true)}
          onSettings={() => setShowSettings(true)}
        />
      )}

      <SettingsDialog open={showSettings} settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
      <TutorialDialog open={showTutorial} onClose={closeTutorial} />
      {game && (
        <VictoryDialog
          open={showVictory}
          game={game}
          isRecord={isRecord}
          unlimitedHints={settings.unlimitedHints}
          onAgain={() => start(game.difficulty)}
          onHome={() => {
            setShowVictory(false);
            dispatch({ type: 'set', game: null });
            setScreen('home');
          }}
        />
      )}
      <Confirm
        open={confirmLevel !== null}
        title="¿Empezar un sudoku nuevo?"
        message="Tiene una partida a medias. Si empieza una nueva, la partida actual se perderá."
        no="No, seguir con la mía"
        yes="Sí, empezar uno nuevo"
        onNo={() => setConfirmLevel(null)}
        onYes={() => confirmLevel && start(confirmLevel)}
      />
    </>
  );
}
