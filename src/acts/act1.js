// Acte 1 — L'avant. Bureau isométrique gris, indicateurs qui se vident, extinction.
import gsap from 'gsap';
import { Act } from '../engine/Act.js';
import { logoImg } from '../theme/theme.js';
import { sound } from '../engine/sound.js';

export class Act1 extends Act {
  build() {
    const d = this.data;
    this.office = this.ctx.office();
    this.layer.innerHTML = `
      <div class="a1-title">
        <div class="a1-kicker">${d.opening.kicker}</div>
        <h1 class="a1-h1">${d.opening.title}</h1>
        <div class="a1-rule"></div>
        <div class="a1-line">${d.opening.line}</div>
        <div class="a1-logo"></div>
      </div>
      <div class="a1-indicators panel">
        <div class="panel-tag">ÉTAT DU PROJET</div>
        ${d.indicators.map((it) => `
          <div class="a1-ind">
            <div class="a1-ind-label">${it.label}</div>
            <div class="a1-ind-val"><span class="v-before">${it.before}</span><span class="v-after">${it.after}</span></div>
            <div class="a1-ind-track"><div class="a1-ind-bar"></div></div>
          </div>`).join('')}
      </div>
      <div class="a1-deadline panel">
        <div class="panel-tag">${d.deadline.label.toUpperCase()}</div>
        <div class="a1-days"><span class="a1-j">J-</span><span class="a1-n">${d.deadline.startDays}</span></div>
        <div class="a1-ticks">${Array.from({ length: 30 }, () => '<i></i>').join('')}</div>
      </div>`;
    this.layer.querySelector('.a1-logo').appendChild(logoImg('logo-img'));
    this.q = (s) => this.layer.querySelector(s);
    this.qa = (s) => [...this.layer.querySelectorAll(s)];
    this.days = { v: d.deadline.startDays };
  }

  enter() {
    super.enter();
    this.ctx.scene = this.office.scene;
    this.ctx.camera = this.office.camera;
  }
  exit() {
    super.exit();
    this.ctx.scene = null;
  }

  reset() {
    const o = this.office;
    o.resetAll({ colorAmount: 0, light: 0 });
    o.rig.shift = 0.12;
    o.rig.zoom = 0.92;
    o.updateCamera();
    this.days.v = this.data.deadline.startDays;
    this.renderDays();
    gsap.set(this.q('.a1-title'), { opacity: 1 });
    gsap.set(this.qa('.a1-title > *'), { opacity: 0, y: 20 });
    gsap.set(this.q('.a1-rule'), { scaleX: 0 });
    gsap.set([this.q('.a1-indicators'), this.q('.a1-deadline')], { opacity: 0, x: 0 });
    gsap.set(this.qa('.a1-ind'), { opacity: 0, x: -16 });
    gsap.set(this.qa('.a1-ind-bar'), { scaleX: 0.78 });
    gsap.set(this.qa('.v-before'), { opacity: 1 });
    gsap.set(this.qa('.v-after'), { opacity: 0 });
    this.qa('.a1-ind').forEach((el) => el.classList.remove('emptied'));
    gsap.set(this.layer, { opacity: 1 });
    this.urgent = false;
  }

  renderDays() {
    const n = Math.round(this.days.v);
    this.q('.a1-n').textContent = n;
    const ticks = this.qa('.a1-ticks i');
    const ratio = n / this.data.deadline.startDays;
    ticks.forEach((t, i) => t.classList.toggle('on', i / ticks.length < ratio));
  }

  transition(i) {
    const o = this.office;
    const tl = gsap.timeline();
    const apply = () => o.applyColor();
    switch (this.stepIds[i]) {
      case 'titre':
        tl.to(this.qa('.a1-title > *'), { opacity: 1, y: 0, duration: 1.4, stagger: 0.25, ease: 'power3.out' }, 0.4);
        tl.to(this.q('.a1-rule'), { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, 0.9);
        break;
      case 'bureau':
        tl.to(this.q('.a1-title'), { opacity: 0, duration: 0.9, ease: 'power2.in' }, 0);
        tl.fromTo(o.scene.position, { y: -1.5 }, { y: 0, duration: 2.6, ease: 'power3.out' }, 0.6);
        tl.to(o.light, { v: 0.85, duration: 2.6, ease: 'power2.out', onUpdate: apply }, 0.6);
        tl.to(o.rig, { zoom: 1, duration: 3.2, ease: 'power2.out', onUpdate: () => o.updateCamera() }, 0.6);
        tl.to(this.q('.a1-deadline'), { opacity: 1, duration: 1, ease: 'power2.out' }, 2.4);
        tl.to(this.q('.a1-indicators'), { opacity: 1, duration: 1 }, 2.6);
        tl.to(this.qa('.a1-ind'), { opacity: 1, x: 0, duration: 0.8, stagger: 0.18, ease: 'power3.out' }, 2.7);
        break;
      case 'indicateurs': {
        const inds = this.qa('.a1-ind');
        inds.forEach((el, k) => {
          const at = 0.3 + k * 1.1;
          tl.to(el.querySelector('.a1-ind-bar'), { scaleX: 0, duration: 0.9, ease: 'power2.inOut' }, at);
          tl.to(el.querySelector('.v-before'), { opacity: 0, duration: 0.3 }, at + 0.5);
          tl.to(el.querySelector('.v-after'), { opacity: 1, duration: 0.4 }, at + 0.7);
          tl.call(() => { el.classList.add('emptied'); sound.click(0.5); }, null, at + 0.7);
        });
        tl.to(this.days, { v: this.data.deadline.endDays, duration: 4.2, ease: 'power2.in', onUpdate: () => this.renderDays() }, 0.2);
        tl.call(() => { this.urgent = true; }, null, 4.4);
        break;
      }
      case 'extinction':
        tl.to(this.layer, { opacity: 0, duration: 3.5, ease: 'power1.inOut' }, 0);
        tl.to(o.light, { v: 0, duration: 4.5, ease: 'power1.inOut', onUpdate: apply }, 0.3);
        tl.to(o.rig, { zoom: 1.08, duration: 4.8, ease: 'power1.inOut', onUpdate: () => o.updateCamera() }, 0);
        break;
    }
    return tl;
  }

  update(t, dt) {
    this.office.update(t, dt);
    // pause vivante : légère dérive de la caméra
    if (!this.ctx.instant) {
      this.office.rig.orbit = Math.sin(t * 0.15) * 0.025;
      this.office.updateCamera();
    }
    if (this.urgent) this.q('.a1-days').style.opacity = 0.65 + 0.35 * Math.abs(Math.sin(t * 2.2));
    else this.q('.a1-days').style.opacity = 1;
  }
}
