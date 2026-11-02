import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' : chemins relatifs → déployable tel quel sur GitHub Pages
// (https://<user>.github.io/<repo>/) ou servi depuis n'importe quel dossier.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        presenter: resolve(import.meta.dirname, 'presenter.html'),
      },
    },
  },
  server: { host: true },
});
