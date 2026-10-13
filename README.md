# Mi Sudoku

Sudoku web pensado para personas mayores: números grandes, ayudas claras, sin prisas.

- `npm install` y `npm run dev` para desarrollar.
- `npm test` comprueba que el generador crea sudokus válidos con una sola solución en las 4 dificultades.
- `npm run build` genera `dist/index.html` (un único archivo). `npm run artifact` además crea `dist/mi-sudoku.html` para publicarlo.

## Publicar en Vercel

El repositorio ya trae `vercel.json` (Vite, `npm run build`, carpeta `dist`).
En https://vercel.com/new elija «Import» en el repositorio `DaviiddG/Sudokus` y pulse «Deploy»; no hace falta cambiar ningún ajuste.
Cada vez que se suba un cambio a `main`, Vercel publicará la nueva versión automáticamente.

Estructura:
- `src/sudoku/engine.ts`: generador y calificador (técnicas "humanas": únicos, bloqueados, parejas).
- `src/state/`: partida (reducer con deshacer, pistas, notas), guardado en el navegador y sonidos.
- `src/components/`: pantallas (inicio, partida, ajustes, tutorial, victoria).
- `src/remotion/`: animaciones hechas con Remotion (portada, tutorial de 6 pasos en versión horizontal y vertical, celebración).
