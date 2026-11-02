// Acte 5 — One more thing. Extinction, révélation de l'application, livrables,
// phrase finale.
import gsap from 'gsap';
import { Act } from '../engine/Act.js';
import { asset, logoImg } from '../theme/theme.js';
import { sound } from '../engine/sound.js';

export class Act5 extends Act {
  build() {
    const d = this.data;
    const app = d.app;
    this.office = this.ctx.office();
    // mise en valeur des mots clés (compatible avec les accents : pas de \b)
    const highlight = (txt) => d.final.highlights.reduce(
      (acc, w) => acc.replace(new RegExp(`(^|[\\s,;:'’(])(${w})(?=[\\s,;:.!?)]|$)`, 'u'), '$1<em>$2</em>'), txt);
    this.layer.innerHTML = `
      <div class="a5-omt">${d.omt}</div>

      <div class="a5-scene">
        <svg class="a5-links" viewBox="0 0 1920 1080"></svg>
        <div class="a5-app tool-fiori">
          <div class="tf-shell"><span class="tf-logo">SAP</span><span class="tf-title">${app.title}</span><span class="tf-user">CFL</span></div>
          <div class="a5-media">
            <video class="a5-video" muted loop playsinline preload="auto"></video>
            <div class="a5-sim">
              <div class="tf-col tf-inbox">
                <div class="tf-h">Boîte de réception</div>
                <div class="tf-mail old"><b>noreply@cfl.lu</b><span>Rapport hebdomadaire</span></div>
                <div class="tf-mail old"><b>achats@cfl.lu</b><span>Commande 4500018199</span></div>
                <div class="tf-mail new"><b>${app.mail.from}</b><span>${app.mail.subject}</span><i class="tf-pdf">PDF · ${app.mail.attachment}</i></div>
              </div>
              <div class="tf-col tf-fields">
                <div class="tf-h">Lecture automatique</div>
                ${app.fields.map((f) => `<div class="tf-field"><span>${f.k}</span><b>${f.v}</b></div>`).join('')}
              </div>
              <div class="tf-col tf-flow">
                <div class="tf-h">Workflow</div>
                ${app.workflow.map((w, i) => `<div class="tf-step" style="--i:${i}"><i></i><span>${w}</span></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        ${d.deliverables.map((x, i) => `<div class="a5-deliv panel" data-i="${i}"><div class="panel-tag">${String(i + 1).padStart(2, '0')}</div><div class="a5-deliv-l">${x.label}</div><div class="a5-deliv-d">${x.detail}</div></div>`).join('')}
      </div>

      <div class="a5-final">
        <p class="a5-before">${d.final.before}</p>
        <p class="a5-now">${highlight(d.final.now)}</p>
        <div class="a5-logo"></div>
      </div>`;
    this.q = (s) => this.layer.querySelector(s);
    this.qa = (s) => [...this.layer.querySelectorAll(s)];
    this.q('.a5-logo').appendChild(logoImg('logo-img'));

    // vidéo réelle si présente (public/media/demo.mp4), sinon simulation animée
    this.video = this.q('.a5-video');
    this.hasVideo = false;
    this.video.addEventListener('loadeddata', () => {
      this.hasVideo = true;
      this.layer.classList.add('has-video');
    });
    this.video.addEventListener('error', () => { this.hasVideo = false; });
    this.video.src = asset(d.video);

    // positions des livrables autour de l'application (coordonnées scène)
    this.delivPos = [
      { x: 150, y: 190 }, { x: 150, y: 600 }, { x: 1470, y: 190 }, { x: 1470, y: 600 }, { x: 810, y: 870 },
    ];
    const svg = this.q('.a5-links');
    this.links = this.delivPos.map((p, i) => {
      const anchor = [
        [450, 255, 624, 330], [450, 670, 624, 590], [1470, 255, 1296, 330], [1470, 670, 1296, 590], [960, 870, 960, 650],
      ][i];
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', anchor[0]); l.setAttribute('y1', anchor[1]);
      l.setAttribute('x2', anchor[2]); l.setAttribute('y2', anchor[3]);
      l.setAttribute('class', 'a5-link');
      const len = Math.hypot(anchor[2] - anchor[0], anchor[3] - anchor[1]);
      l.style.strokeDasharray = len;
      l.dataset.len = len;
      svg.appendChild(l);
      return l;
    });
    this.qa('.a5-deliv').forEach((el, i) => { el.style.left = this.delivPos[i].x + 'px'; el.style.top = this.delivPos[i].y + 'px'; });
  }

  enter() {
    super.enter();
    this.ctx.scene = this.office.scene;
    this.ctx.camera = this.office.camera;
  }
  exit() {
    super.exit();
    this.ctx.scene = null;
    this.video.pause();
  }

  reset() {
    const o = this.office;
    o.resetAll({ colorAmount: 1, light: 0.35 });
    ['necati', 'clement', 'eden'].forEach((id) => o.setGlow(id, 0.45));
    o.rig.shift = 0;
    o.rig.zoom = 1.05;
    o.updateCamera();
    this.video.pause();
    try { this.video.currentTime = 0; } catch { /* vidéo absente */ }
    gsap.set(this.q('.a5-omt'), { opacity: 0, scale: 1 });
    gsap.set(this.q('.a5-scene'), { opacity: 1 });
    gsap.set(this.q('.a5-app'), { opacity: 0, scale: 3.4, x: 0, y: 0 });
    gsap.set(this.qa('.a5-deliv'), { opacity: 0, y: 16 });
    this.links.forEach((l) => { l.style.strokeDashoffset = l.dataset.len; });
    gsap.set(this.qa('.tf-mail.new'), { opacity: 0, x: -30 });
    gsap.set(this.qa('.tf-field'), { opacity: 0 });
    this.qa('.tf-step').forEach((s) => s.classList.remove('done', 'current'));
    gsap.set(this.q('.a5-final'), { opacity: 1 });
    gsap.set([this.q('.a5-before'), this.q('.a5-now')], { opacity: 0, y: 24 });
    gsap.set(this.q('.a5-logo'), { opacity: 0 });
    this.flowIndex = -1;
  }

  setFlow(k) {
    this.flowIndex = k;
    this.qa('.tf-step').forEach((s, i) => {
      s.classList.toggle('done', i < k);
      s.classList.toggle('current', i === k);
    });
  }

  transition(i) {
    const o = this.office;
    const tl = gsap.timeline();
    switch (this.stepIds[i]) {
      case 'noir':
        // le bureau s'éteint doucement : on croit que c'est fini
        o.light.v = 0.35;
        tl.fromTo(o.light, { v: 0.35 }, { v: 0, duration: 4.5, ease: 'power1.inOut', onUpdate: () => o.applyColor() }, 0);
        tl.to(['necati', 'clement', 'eden'].map((id) => o.glows[id].material), { opacity: 0, duration: 3.5 }, 0.5);
        tl.to(o.rig, { zoom: 0.9, duration: 5, ease: 'power1.inOut', onUpdate: () => o.updateCamera() }, 0);
        break;
      case 'omt':
        tl.fromTo(this.q('.a5-omt'), { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out', immediateRender: false }, 0.3);
        break;
      case 'app': {
        tl.to(this.q('.a5-omt'), { opacity: 0, duration: 0.7 }, 0);
        tl.to(this.q('.a5-app'), { opacity: 1, duration: 0.8 }, 0.5);
        tl.to(this.q('.a5-app'), { scale: 1, duration: 2.6, ease: 'power3.inOut' }, 0.5);
        tl.call(() => { if (this.hasVideo && !this.ctx.instant) this.video.play().catch(() => {}); }, null, 1.5);
        // simulation : la facture arrive par mail et part dans le bon workflow
        tl.to(this.q('.tf-mail.new'), { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 3.2);
        tl.call(() => sound.click(0.4), null, 3.2);
        tl.to(this.qa('.tf-field'), { opacity: 1, duration: 0.35, stagger: 0.35 }, 4.0);
        this.data.app.workflow.forEach((_, k) => tl.call(() => this.setFlow(k), null, 4.2 + k * 0.7));
        tl.call(() => this.setFlow(this.data.app.workflow.length), null, 4.2 + this.data.app.workflow.length * 0.7);
        break;
      }
      case 'livrables':
        tl.to(this.q('.a5-app'), { scale: 0.56, y: -40, duration: 1.4, ease: 'power3.inOut' }, 0);
        this.qa('.a5-deliv').forEach((el, k) => {
          const at = 1.3 + k * 0.8;
          tl.to(this.links[k], { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, at);
          tl.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, at + 0.25);
          tl.call(() => sound.click(0.45), null, at + 0.25);
        });
        break;
      case 'final':
        tl.to(this.q('.a5-scene'), { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
        tl.call(() => this.video.pause(), null, 1.2);
        tl.to(this.q('.a5-before'), { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, 1.6);
        tl.to(this.q('.a5-now'), { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, 3.4);
        tl.to(this.q('.a5-logo'), { opacity: 1, duration: 1.6 }, 5.6);
        break;
    }
    return tl;
  }

  update(t, dt) {
    this.office.update(t, dt);
    // pause vivante : l'étape courante du workflow respire
    const cur = this.q('.tf-step.current, .tf-step.done:last-of-type');
    if (cur) cur.style.setProperty('--pulse', (0.5 + 0.5 * Math.sin(t * 3)).toFixed(2));
  }
}
