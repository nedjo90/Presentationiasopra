// Vue présentateur : speech de l'étape, aperçu de l'étape suivante, n° d'étape, chrono.
// Synchronisée avec la fenêtre principale via BroadcastChannel (même navigateur).
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '../theme/theme.css';
import './presenter.css';
import content from '../content/content.json';

const ch = new BroadcastChannel('hello-claude');
const app = document.getElementById('app');
app.innerHTML = `
  <header>
    <div class="p-step"><span class="p-num">–</span><span class="p-total"></span></div>
    <div class="p-act"></div>
    <div class="p-status"></div>
    <div class="p-clock"><span class="p-chrono">00:00</span><span class="p-target">/ ${content.meta.targetMinutes}:00</span><button class="p-reset" title="Remettre le chrono à zéro">↺</button></div>
  </header>
  <main>
    <section class="p-current">
      <div class="p-label">Étape en cours</div>
      <h1 class="p-title"></h1>
      <div class="p-speech"></div>
      <div class="p-notes"></div>
    </section>
    <aside class="p-next">
      <div class="p-label">Étape suivante</div>
      <div class="p-preview"><iframe title="aperçu" tabindex="-1"></iframe><div class="p-preview-end">Fin de la présentation</div></div>
      <div class="p-next-title"></div>
      <div class="p-next-speech"></div>
    </aside>
  </main>
  <footer>
    <button data-cmd="prev">← Précédent</button>
    <button data-cmd="next" class="primary">Suivant →</button>
    <span class="sep"></span>
    ${content.acts.map((a, i) => `<button data-act="${i}">${a.number}. ${a.title}</button>`).join('')}
    <span class="sep"></span>
    <button data-cmd="blackout">Noir (B)</button>
    <button data-cmd="mute">Son (M)</button>
    <button data-cmd="gestures">Gestes (G)</button>
  </footer>
  <div class="p-offline">En attente de la fenêtre principale… (ouvrez index.html dans le même navigateur, puis touche P)</div>`;

const $ = (s) => app.querySelector(s);
const iframe = $('iframe');
let state = null;
let chronoStart = null;
let lastPreview = -1;

function send(cmd, arg) { ch.postMessage({ type: 'cmd', cmd, arg }); }

app.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => send(b.dataset.cmd)));
app.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => send('act', Number(b.dataset.act))));
$('.p-reset').addEventListener('click', () => send('resetChrono'));

// la télécommande peut aussi piloter depuis cette fenêtre
window.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') send('next');
  else if (k === 'ArrowLeft' || k === 'PageUp') send('prev');
  else if (/^[1-5]$/.test(k)) send('act', Number(k) - 1);
  else if (k === 'b' || k === 'B' || k === '.') send('blackout');
  else if (k === 'r' || k === 'R') send('restart');
  else if (k === 'm' || k === 'M') send('mute');
  else return;
  e.preventDefault();
});

ch.addEventListener('message', (e) => {
  const m = e.data;
  if (m.type !== 'state') return;
  state = m;
  chronoStart = m.chronoStart;
  render();
});

function render() {
  const s = state;
  document.body.classList.add('online');
  $('.p-num').textContent = s.index + 1;
  $('.p-total').textContent = ' / ' + s.total;
  const c = s.current;
  $('.p-act').textContent = `Acte ${c.actNumber} · ${c.actTitle} — étape ${c.local + 1}/${c.actSteps}`;
  $('.p-title').textContent = c.title;
  $('.p-speech').textContent = c.speech || '';
  $('.p-notes').textContent = c.notes || '';
  const silent = /silence/i.test(c.speech || '') || /silence/i.test(c.notes || '');
  $('.p-current').classList.toggle('silence', silent);
  $('.p-status').innerHTML = [
    s.blackout ? '<span class="warn">ÉCRAN NOIR</span>' : '',
    s.muted ? '<span>son coupé</span>' : '',
    s.gestures ? '<span>gestes actifs</span>' : '',
  ].join('');
  if (s.next) {
    $('.p-next-title').textContent = `${s.next.actNumber}.${s.next.local + 1} · ${s.next.title}`;
    $('.p-next-speech').textContent = s.next.speech || '';
    $('.p-preview').classList.remove('end');
    if (lastPreview !== s.next.index) {
      lastPreview = s.next.index;
      const url = `index.html?preview#${s.next.index + 1}`;
      if (!iframe.src) iframe.src = url;
      else iframe.contentWindow.location.hash = '#' + (s.next.index + 1);
    }
  } else {
    $('.p-next-title').textContent = '—';
    $('.p-next-speech').textContent = '';
    $('.p-preview').classList.add('end');
  }
}

function tick() {
  if (chronoStart) {
    const sec = Math.max(0, Math.floor((Date.now() - chronoStart) / 1000));
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    $('.p-chrono').textContent = `${mm}:${ss}`;
    $('.p-clock').classList.toggle('over', sec > content.meta.targetMinutes * 60);
  }
  requestAnimationFrame(tick);
}
tick();
ch.postMessage({ type: 'hello' });
setInterval(() => { if (!state) ch.postMessage({ type: 'hello' }); }, 1000);
