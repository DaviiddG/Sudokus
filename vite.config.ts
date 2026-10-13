import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Se compila en un único index.html para poder publicarlo y abrirlo sin servidor.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  worker: { format: 'es' },
});
