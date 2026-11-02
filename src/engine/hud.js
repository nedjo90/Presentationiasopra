// Petit HUD discret : barre de progression fine, messages éphémères, aide clavier.
import gsap from 'gsap';

export class Hud {
  constructor(content, engine) {
    this.el = document.getElementById('hud');
    this.el.innerHTML = `
      <div class="hud-progress"><div class="hud-bar"></div></div>
      <div class="hud-flash"></div>
      <div class="hud-help">
        <div class="hud-help-inner">
          <div class="hud-help-title">Contrôles</div>
          ${content.ui.help.map(([k, v]) => `<div class="hud-row"><kbd>${k}</kbd><span>${v}</span></div>`).join('')}
          <div class="hud-help-foot">Vue présentateur : touche P · Gestes : touche G</div>
        </div>
      </div>`;
    this.bar = this.el.querySelector('.hud-bar');
    this.flashEl = this.el.querySelector('.hud-flash');
    this.help = this.el.querySelector('.hud-help');
    this.help.addEventListener('click', () => this.toggleHelp(false));
    this.engine = engine;
    // L'aide s'affiche une fois au premier lancement (disparaît au premier clic)
    try {
      const touch = matchMedia('(pointer: coarse)').matches; // pas d'aide clavier sur téléphone
      if (!touch && !localStorage.getItem('hc-help-seen')) {
        this.toggleHelp(true);
        localStorage.setItem('hc-help-seen', '1');
        setTimeout(() => this.toggleHelp(false), 6000);
      }
    } catch { /* stockage indisponible : on ignore */ }
  }
  update(st) {
    this.bar.style.width = ((st.index + 1) / st.total) * 100 + '%';
  }
  flash(msg) {
    this.flashEl.textContent = msg;
    gsap.killTweensOf(this.flashEl);
    gsap.fromTo(this.flashEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 });
    gsap.to(this.flashEl, { opacity: 0, duration: 0.6, delay: 1.6 });
  }
  toggleHelp(v) {
    const on = v ?? !this.help.classList.contains('on');
    this.help.classList.toggle('on', on);
  }
}
