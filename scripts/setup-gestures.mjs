// Copie les fichiers WASM de MediaPipe dans public/mediapipe/wasm et télécharge
// le modèle de détection de mains (si absent) pour un fonctionnement hors ligne.
// Ne fait jamais échouer l'installation : les gestes sont optionnels.
import { cpSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const dst = resolve(root, 'public/mediapipe/wasm');
const model = resolve(root, 'public/mediapipe/hand_landmarker.task');
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

try {
  if (existsSync(src)) {
    mkdirSync(dst, { recursive: true });
    cpSync(src, dst, { recursive: true });
    console.log('[gestes] WASM MediaPipe copié dans public/mediapipe/wasm');
  }
} catch (e) {
  console.warn('[gestes] copie WASM impossible :', e.message);
}

try {
  if (!existsSync(model) || statSync(model).size < 1000) {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    writeFileSync(model, Buffer.from(await res.arrayBuffer()));
    console.log('[gestes] modèle hand_landmarker.task téléchargé');
  }
} catch (e) {
  console.warn('[gestes] modèle non téléchargé (' + e.message + ') — les gestes resteront indisponibles hors ligne.');
}
