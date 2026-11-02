import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import './theme/theme.css';
import './styles/base.css';
import './styles/acts.css';

import * as THREE from 'three';
import gsap from 'gsap';
import content from './content/content.json';
import { setupStage, STAGE_W, STAGE_H } from './engine/stage.js';
import { Engine } from './engine/engine.js';
import { Labels } from './engine/labels.js';
import { sound } from './engine/sound.js';
import { Office } from './scenes/office.js';
import { Act1 } from './acts/act1.js';
import { Act2 } from './acts/act2.js';
import { Act3 } from './acts/act3.js';
import { Act4 } from './acts/act4.js';
import { Act5 } from './acts/act5.js';
import { Hud } from './engine/hud.js';
import { Gestures } from './engine/gestures.js';
import { watchFictif } from './engine/fictif.js';

const params = new URLSearchParams(location.search);
const PREVIEW = params.has('preview'); // aperçu dans la vue présentateur
if (PREVIEW) document.body.classList.add('preview');

// ------------------------------------------------------------------ rendu
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !PREVIEW, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvas.style.width = STAGE_W + 'px';
canvas.style.height = STAGE_H + 'px';

const stage = setupStage((scale) => {
  // tampon de dessin = taille réellement affichée × dpr (plafonné pour tenir 60 i/s)
  const dpr = PREVIEW ? 0.5 : Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(STAGE_W * scale * dpr);
  const h = Math.round(STAGE_H * scale * dpr);
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
});

const ctx = {
  content,
  renderer,
  stage,
  preview: PREVIEW,
  layers: document.getElementById('layers'),
  overlays: document.getElementById('overlays'),
  labels: new Labels(document.getElementById('labels')),
  instant: false,
  scene: null,
  camera: null,
  _office: null,
  office() {
    if (!this._office) this._office = new Office(content.team);
    return this._office;
  },
  // durée : 0 en reconstruction instantanée
  d(x) { return this.instant ? 0 : x; },
};

watchFictif(document.getElementById('stage'));
const acts = [Act1, Act2, Act3, Act4, Act5].map((A, i) => new A(ctx, content.acts[i]));
const engine = new Engine(ctx, acts, content);
ctx.engine = engine;

// ------------------------------------------------------------------ boucle
let last = performance.now();
gsap.ticker.fps(PREVIEW ? 15 : 60);
gsap.ticker.lagSmoothing(500, 33);
gsap.ticker.add(() => {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  engine.current?.update(t, dt);
  if (ctx.scene && ctx.camera) {
    renderer.render(ctx.scene, ctx.camera);
    ctx.labels.update(ctx.camera);
  } else {
    renderer.clear();
  }
});

// ------------------------------------------------------------------ synchro
const channel = PREVIEW ? null : new BroadcastChannel('hello-claude');
let chronoStart = null;
let blackout = false;

function broadcast() {
  if (!channel) return;
  channel.postMessage({ type: 'state', ...engine.state(), chronoStart, blackout, muted: sound.muted, gestures: gestures?.enabled || false });
}

engine.onChange((st) => {
  if (!PREVIEW) history.replaceState(null, '', '#' + (st.index + 1));
  if (chronoStart === null && st.index > 0 && !PREVIEW) chronoStart = Date.now();
  hud?.update(st);
  broadcast();
});

const hud = PREVIEW ? null : new Hud(content, engine);
const gestures = PREVIEW ? null : new Gestures(ctx, (g) => engine.current?.onGesture(g), (on) => { hud.flash(on ? 'Gestes activés' : 'Gestes désactivés'); broadcast(); });

channel?.addEventListener('message', (e) => {
  const m = e.data;
  if (m.type === 'hello') broadcast();
  if (m.type === 'cmd') command(m.cmd, m.arg);
});

// ------------------------------------------------------------------ commandes
function setBlackout(v) {
  blackout = v;
  gsap.to('#blackout', { opacity: v ? 1 : 0, duration: 0.6, ease: 'power2.inOut' });
  broadcast();
}

function command(cmd, arg) {
  sound.unlock();
  switch (cmd) {
    case 'next': if (blackout) setBlackout(false); else engine.next(); break;
    case 'prev': engine.prev(); break;
    case 'goto': engine.go(arg, false); break;
    case 'act': engine.jumpToAct(arg); break;
    case 'restart': engine.restartAct(); break;
    case 'blackout': setBlackout(!blackout); break;
    case 'mute': hud.flash(sound.toggleMute() ? 'Son coupé' : 'Son activé'); broadcast(); break;
    case 'gestures': gestures.toggle(); break;
    case 'resetChrono': chronoStart = Date.now(); broadcast(); break;
  }
}

function openPresenter() {
  window.open('presenter.html', 'hello-claude-presenter', 'width=1280,height=800');
}

if (!PREVIEW) {
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (engine.current?.onKey(e)) { e.preventDefault(); return; }
    const k = e.key;
    let handled = true;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') command('next');
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') command('prev');
    else if (/^[1-5]$/.test(k)) command('act', Number(k) - 1);
    else if (k === 'b' || k === 'B' || k === '.') command('blackout');
    else if (k === 'r' || k === 'R') command('restart');
    else if (k === 'm' || k === 'M') command('mute');
    else if (k === 'g' || k === 'G') command('gestures');
    else if (k === 'p' || k === 'P') openPresenter();
    else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.();
    } else if (k === 'h' || k === 'H' || k === '?') hud.toggleHelp();
    else handled = false;
    if (handled) e.preventDefault();
  });

  document.getElementById('viewport').addEventListener('click', (e) => {
    sound.unlock();
    const pt = stage.toStage(e.clientX, e.clientY);
    if (engine.current?.onClick(pt, e)) return;
    if (e.target.closest('button, a, .interactive')) return;
    command('next');
  });
  document.getElementById('viewport').addEventListener('contextmenu', (e) => { e.preventDefault(); command('prev'); });

  // Téléphone / tablette : tap = suivant, balayage vers la gauche = suivant, vers la droite = précédent
  let touch = null;
  window.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    touch = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.preventDefault(); // pas de clic fantôme après un balayage
      command(dx < 0 ? 'next' : 'prev');
    }
  });
}

// ------------------------------------------------------------------ démarrage
function stepFromHash() {
  const n = parseInt(location.hash.replace('#', ''), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(engine.total - 1, n - 1)) : 0;
}

const start = stepFromHash();
if (PREVIEW) {
  sound.setMuted(true);
  engine.go(start, false);
  window.addEventListener('hashchange', () => engine.go(stepFromHash(), false));
} else {
  engine.go(start, start === 0);
}

window.__engine = engine;
engine.ctx = ctx; // pratique pour le débogage / les tests
