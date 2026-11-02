import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Les pages d'entrée sont dans app/, le site construit sort dans docs/ (versionné).
// GitHub Pages en mode « Deploy from a branch » (main) sert ce dossier docs/ :
// soit directement (dossier /docs), soit via la redirection de l'index.html racine.
// base './' : chemins relatifs → fonctionne sous n'importe quel sous-chemin.
const dir = import.meta.dirname;
export default defineConfig({
  root: resolve(dir, 'app'),
  publicDir: resolve(dir, 'public'),
  base: './',
  build: {
    outDir: resolve(dir, 'docs'),
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: resolve(dir, 'app/index.html'),
        presenter: resolve(dir, 'app/presenter.html'),
      },
    },
  },
  server: { host: true },
  preview: { host: true },
});
