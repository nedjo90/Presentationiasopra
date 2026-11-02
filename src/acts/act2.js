// Acte 2 — La bascule. Cinq écrans, pluie de code aux couleurs de la charte,
// arrêt net, terminal unique : « Hello, Claude. »
import gsap from 'gsap';
import { Act } from '../engine/Act.js';
import { hex } from '../theme/theme.js';
import { sound } from '../engine/sound.js';
import { STAGE_W, STAGE_H } from '../engine/stage.js';

export class Act2 extends Act {
  build() {
    const { team } = this.ctx.content;
    const T = this.data.terminal;
    this.layer.innerHTML = `
      <div class="a2-screens">
        ${team.map((m, i) => `
          <div class="a2-screen" style="--i:${i};--z:${Math.abs(i - 2) * 30}px">
            <div class="a2-screen-inner">
              <div class="a2-screen-code"></div>
              <div class="a2-screen-id">
                <div class="a2-name">${m.name}</div>
                <div class="a2-role">${m.role}</div>
              </div>
            </div>
            <div class="a2-stand"></div>
          </div>`).join('')}
      </div>
      <canvas class="a2-rain" width="${STAGE_W}" height="${STAGE_H}"></canvas>
      <div class="a2-terminal tool-terminal">
        <div class="tt-bar"><i></i><i></i><i></i><span>${T.title}</span></div>
        <div class="tt-body">
          <div class="tt-welcome"><span class="tt-star">✻</span> Welcome to <b>Claude Code</b>!</div>
          <div class="tt-lines"></div>
        </div>
      </div>`;
    this.q = (s) => this.layer.querySelector(s);
    this.qa = (s) => [...this.layer.querySelectorAll(s)];
    this.canvas = this.q('.a2-rain');
    this.g = this.canvas.getContext('2d');
    this.rain = { intensity: 0, speed: 1 };

    // code des écrans (texte statique défilant)
    const code = this.ctx.content.code;
    const all = [...code.abap, ...code.cds, ...code.cap, ...code.ui5];
    this.qa('.a2-screen-code').forEach((el, i) => {
      const lines = all.slice((i * 7) % all.length).concat(all).slice(0, 18);
      el.textContent = lines.join('\n');
    });

    // colonnes de pluie : chaque colonne déroule une ligne de code verticalement
    this.cols = [];
    const fs = 20;
    this.fs = fs;
    const palette = ['--rain-1', '--rain-2', '--rain-3', '--rain-1', '--rain-2'].map(hex);
    this.head = hex('--rain-4');
    const n = Math.floor(STAGE_W / (fs * 0.95));
    for (let c = 0; c < n; c++) {
      this.cols.push({
        x: c * fs * 0.95 + 4,
        y: -Math.random() * STAGE_H,
        v: 260 + Math.random() * 520,
        text: all[(c * 5) % all.length].replace(/\s+/g, ' '),
        k: Math.floor(Math.random() * 40),
        color: palette[c % palette.length],
        acc: 0,
      });
    }
  }

  reset() {
    this.rain.intensity = 0;
    this.g.clearRect(0, 0, STAGE_W, STAGE_H);
    gsap.set(this.q('.a2-screens'), { opacity: 1 });
    this.qa('.a2-screen').forEach((s) => s.classList.remove('on'));
    gsap.set(this.qa('.a2-screen-inner'), { scaleY: 0.004, scaleX: 0, opacity: 0 });
    gsap.set(this.qa('.a2-stand'), { opacity: 0 });
    gsap.set(this.canvas, { opacity: 1 });
    gsap.set(this.q('.a2-terminal'), { opacity: 0, scale: 0.98 });
    this.q('.tt-lines').innerHTML = '';
    this.cursorLine = null;
  }

  // ajoute une ligne au terminal (créée au moment de l'appel dans la timeline)
  addLine(cls, prefix) {
    const line = document.createElement('div');
    line.className = 'tt-line ' + cls;
    line.innerHTML = `<span class="tt-prefix">${prefix}</span><span class="tt-content"><span class="tt-text"></span></span>`;
    this.q('.tt-lines').appendChild(line);
    this.moveCursor(line);
    return line;
  }
  moveCursor(line) {
    this.layer.querySelectorAll('.tt-cursor').forEach((c) => c.remove());
    if (!line) return;
    const c = document.createElement('span');
    c.className = 'tt-cursor';
    line.querySelector('.tt-content').appendChild(c);
  }

  type(tl, cls, prefix, text, at, cps = 22, keySound = true) {
    text = text.replace(/ ([?!:;»])/g, '\u00a0$1'); // typographie française
    let line = null;
    const proxy = { n: 0 };
    tl.call(() => { line = this.addLine(cls, prefix); }, null, at);
    tl.to(proxy, {
      n: text.length, duration: text.length / cps, ease: 'none',
      onUpdate: () => {
        if (!line) return;
        const el = line.querySelector('.tt-text');
        const n = Math.round(proxy.n);
        if (el.textContent.length !== n) {
          el.textContent = text.slice(0, n);
          if (keySound && n % 1 === 0 && text[n - 1] !== ' ') sound.key(0.8);
        }
      },
    }, at + 0.01);
    return at + 0.01 + text.length / cps;
  }

  transition(i) {
    const T = this.data.terminal;
    const tl = gsap.timeline();
    switch (this.stepIds[i]) {
      case 'ecrans':
        this.qa('.a2-screen').forEach((s, k) => {
          const inner = s.querySelector('.a2-screen-inner');
          const at = 0.5 + k * 0.75;
          tl.call(() => sound.power(0.7), null, at);
          tl.to(inner, { opacity: 1, scaleX: 1, duration: 0.25, ease: 'power2.out' }, at);
          tl.to(inner, { scaleY: 1, duration: 0.35, ease: 'power3.out' }, at + 0.22);
          tl.to(s.querySelector('.a2-stand'), { opacity: 1, duration: 0.4 }, at + 0.2);
          tl.call(() => s.classList.add('on'), null, at + 0.3);
        });
        break;
      case 'pluie':
        // ≈ 10 s de pluie intense, puis une bruine vivante jusqu'au clic
        tl.to(this.rain, { intensity: 1, duration: 1.4, ease: 'power2.in' }, 0);
        tl.to(this.qa('.a2-screen-id'), { opacity: 0.35, duration: 2 }, 1);
        tl.to(this.rain, { intensity: 0.4, duration: 2.5, ease: 'power1.inOut' }, 9.5);
        break;
      case 'terminal':
        // arrêt net
        tl.call(() => {
          this.rain.intensity = 0;
          this.g.clearRect(0, 0, STAGE_W, STAGE_H);
          sound.click(0.9);
        }, null, 0);
        tl.set(this.q('.a2-screens'), { opacity: 0 }, 0);
        tl.set(this.qa('.a2-screen-id'), { opacity: 1 }, 0);
        tl.to(this.q('.a2-terminal'), { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 1.2);
        tl.call(() => this.addLine('tt-user tt-prompt', '&gt;'), null, 1.2);
        break;
      case 'hello': {
        tl.call(() => { this.q('.tt-lines').lastChild?.remove(); }, null, 0);
        this.type(tl, 'tt-user', '&gt;', T.hello, 0, 9);
        break;
      }
      case 'bonjour': {
        tl.call(() => this.moveCursor(null), null, 0.2);
        const end = this.type(tl, 'tt-claude', '⏺', T.claude1, 0.9, 30, false);
        tl.call(() => this.addLine('tt-user tt-prompt', '&gt;'), null, end + 0.4);
        break;
      }
      case 'question': {
        tl.call(() => { this.q('.tt-lines').lastChild?.remove(); }, null, 0);
        this.type(tl, 'tt-user', '&gt;', T.presenter, 0, 26);
        break;
      }
      case 'reponse': {
        tl.call(() => this.moveCursor(null), null, 0.2);
        const end = this.type(tl, 'tt-claude tt-final', '⏺', T.claude2, 1.6, 9, false);
        tl.call(() => this.addLine('tt-user tt-prompt', '&gt;'), null, end + 1.2);
        break;
      }
    }
    return tl;
  }

  update(t, dt) {
    const g = this.g;
    const I = this.rain.intensity;
    if (I <= 0.001) return;
    // estompage des traînées (composite « destination-out » : fond transparent)
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = `rgba(0,0,0,${0.09 + (1 - I) * 0.08})`;
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.globalCompositeOperation = 'source-over';
    g.font = `500 ${this.fs}px 'JetBrains Mono', monospace`;
    g.textBaseline = 'top';
    const fs = this.fs;
    for (let c = 0; c < this.cols.length; c++) {
      const col = this.cols[c];
      // en bruine, seule une colonne sur trois est active
      if (I < 0.6 && c % 3 !== 0) continue;
      col.acc += col.v * dt * (0.35 + I * 0.9);
      while (col.acc >= fs) {
        col.acc -= fs;
        col.y += fs;
        col.k = (col.k + 1) % col.text.length;
        const ch = col.text[col.k];
        // caractère précédent recoloré, tête plus claire
        g.fillStyle = col.color;
        g.globalAlpha = Math.min(1, 0.55 + I * 0.45);
        g.fillText(ch, col.x, col.y - fs);
        g.fillStyle = this.head;
        g.globalAlpha = I;
        g.fillText(ch, col.x, col.y);
        g.globalAlpha = 1;
        if (col.y > STAGE_H + fs * 2) {
          col.y = -Math.random() * 300;
          col.v = 260 + Math.random() * 520;
        }
      }
    }
  }
}
