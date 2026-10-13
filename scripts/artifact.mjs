// Convierte dist/index.html en una página publicable como Artifact:
// quita doctype/html/head/body (el visor añade su propio esqueleto) y conserva título, estilos y scripts.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
const titleMatch = keep.match(/<title>[\s\S]*?<\/title>/);
const rest = keep.replace(titleMatch[0], '');
writeFileSync('dist/mi-sudoku.html', `${titleMatch[0]}\n${rest.trim()}\n${body.trim()}\n`);
console.log('dist/mi-sudoku.html listo');
