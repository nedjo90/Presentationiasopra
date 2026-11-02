// Mur de sessions (acte 4) : plusieurs terminaux Claude et éditeurs en parallèle,
// disposés en arc. Les lignes clés s'illuminent. Panneaux agrandissables / écartables.
// N'avance jamais la présentation : c'est un zoom à la demande.
import gsap from 'gsap';
import { sound } from '../engine/sound.js';

export class SessionWall {
  constructor(parent, data) {
    this.data = data;
    this.open = false;
    this.spread = 0;
    this.big = -1;
    this.el = document.createElement('div');
    this.el.className = 'wall interactive';
    this.el.innerHTML = `
      <div class="wall-backdrop"></div>
      <div class="wall-title"><span class="panel-tag">${data.title.toUpperCase()}</span></div>
      <div class="wall-stage">
        ${data.panels.map((p, i) => `
          <div class="wall-panel ${p.kind === 'terminal' ? 'tool-terminal' : 'tool-vscode'}" data-i="${i}">
            <div class="${p.kind === 'terminal' ? 'tt-bar' : 'tv-tab'}">${p.kind === 'terminal' ? '<i></i><i></i><i></i>' : ''}<span>${p.title}</span></div>
            <div class="wall-body">
              ${p.lines.map((l, k) => `<div class="wl ${p.highlight.includes(k) ? 'key' : ''} ${lineClass(p, l)}"><span class="wl-n">${k + 1}</span><span>${esc(l)}</span></div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div class="wall-hint">${data.hint}</div>`;
    parent.appendChild(this.el);
    this.panels = [...this.el.querySelectorAll('.wall-panel')];
    gsap.set(this.el, { display: 'none', opacity: 0 });
    this.layout(true);
  }

  // position de chaque panneau dans l'arc
  slot(i) {
    const cols = 3;
    const r = Math.floor(i / cols);
    const c = i % cols;
    const s = this.spread;
    const x = (c - 1) * (560 + s * 160);
    const y = (r - 0.5) * (370 + s * 60);
    const ry = (c - 1) * -(16 + s * 10);
    const z = c === 1 ? -40 : 0;
    return { x, y, ry, z };
  }

  layout(instant = false) {
    this.panels.forEach((p, i) => {
      const big = this.big === i;
      const dim = this.big >= 0 && !big;
      const sl = this.slot(i);
      const v = big
        ? { x: 0, y: 0, rotationY: 0, z: 260, scale: 1.55, opacity: 1, zIndex: 10 }
        : { x: sl.x, y: sl.y, rotationY: sl.ry, z: sl.z - (dim ? 300 : 0), scale: 1, opacity: dim ? 0.25 : 1, zIndex: 1 };
      if (instant) gsap.set(p, v);
      else gsap.to(p, { ...v, duration: 0.7, ease: 'power3.inOut' });
    });
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.big = -1;
    gsap.killTweensOf(this.el);
    gsap.set(this.el, { display: '' });
    gsap.to(this.el, { opacity: 1, duration: 0.5 });
    this.layout(true);
    gsap.fromTo(this.panels, { z: -900, opacity: 0 }, { z: (i) => this.slot(i).z, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' });
    sound.click(0.4);
  }
  close(instant = false) {
    if (!this.el) return;
    this.open = false;
    this.big = -1;
    gsap.killTweensOf(this.el);
    if (instant) gsap.set(this.el, { opacity: 0, display: 'none' });
    else gsap.to(this.el, { opacity: 0, duration: 0.4, onComplete: () => gsap.set(this.el, { display: 'none' }) });
  }
  toggle() { this.open ? this.close() : this.show(); }

  toggleSpread() {
    gsap.to(this, { spread: this.spread > 0.5 ? 0 : 1, duration: 0.8, ease: 'power3.inOut', onUpdate: () => this.layout(true) });
  }

  onClick(ev) {
    const p = ev.target.closest('.wall-panel');
    if (p) {
      const i = Number(p.dataset.i);
      this.big = this.big === i ? -1 : i;
      this.layout();
      sound.click(0.3);
    } else if (this.big >= 0) {
      this.big = -1;
      this.layout();
    } else {
      this.close();
    }
    return true;
  }

  onGesture(g) {
    if (g.type === 'spread') { this.spread = g.amount; this.layout(true); }
    if (g.type === 'rotate') {
      this.ry = Math.max(-25, Math.min(25, (this.ry || 0) + g.dx * 200));
      this.el.querySelector('.wall-stage').style.setProperty('--ry', `${this.ry.toFixed(1)}deg`);
    }
  }

  update(t) {
    if (!this.open) return;
    // illumination cyclique des lignes clés, panneau par panneau
    const n = this.panels.length;
    const active = Math.floor(t / 1.4) % n;
    if (active !== this.lastActive) {
      this.lastActive = active;
      this.panels.forEach((p, i) => p.classList.toggle('hot', i === active || i === (active + 3) % n));
    }
  }
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function lineClass(p, l) {
  if (p.kind !== 'terminal') return '';
  if (l.startsWith('>')) return 'u';
  if (l.startsWith('⏺')) return 'c';
  return 'o';
}
