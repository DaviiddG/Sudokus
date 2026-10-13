import type { Difficulty } from './sudoku/engine';

export const LEVELS: Record<Difficulty, { name: string; desc: string; color: string; dots: number }> = {
  'muy-facil': {
    name: 'Muy fácil',
    desc: 'Muchos números ya puestos. Ideal para empezar con calma.',
    color: '#13724a',
    dots: 1,
  },
  facil: {
    name: 'Fácil',
    desc: 'Un poco más de reto, sin trucos difíciles.',
    color: '#1f6a9e',
    dots: 2,
  },
  medio: {
    name: 'Medio',
    desc: 'Para quien ya conoce el juego y quiere pensar un rato.',
    color: '#8f5a10',
    dots: 3,
  },
  dificil: {
    name: 'Difícil',
    desc: 'Pocos números de partida. Un buen desafío.',
    color: '#a33a3a',
    dots: 4,
  },
};

export function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatTimeWords(ms: number) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  if (m) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  if (!h && (s || !m)) parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' y ');
}

export const positionLabel = (i: number) => `fila ${Math.floor(i / 9) + 1}, columna ${(i % 9) + 1}`;
