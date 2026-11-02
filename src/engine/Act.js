// Classe de base d'un acte.
// Un acte = une liste d'étapes. Chaque étape i est décrite par transition(i),
// qui renvoie une timeline GSAP allant de « fin de l'étape i-1 » à « fin de l'étape i ».
// Le moteur peut ainsi :
//  - jouer une étape (timeline animée),
//  - reconstruire instantanément n'importe quelle étape (reset() puis toutes les
//    timelines jusqu'à i, avancées à 100 %) → retour arrière et sauts fiables.
// Entre deux clics, update() fait vivre la scène (micro-animations en boucle).
import gsap from 'gsap';

export class Act {
  constructor(ctx, data) {
    this.ctx = ctx;
    this.data = data;
    this.stepIds = data.steps.map((s) => s.id);
    this.layer = document.createElement('div');
    this.layer.className = `layer act-${data.id}`;
    this.layer.style.display = 'none';
    ctx.layers.appendChild(this.layer);
    this.built = false;
    this.active = false;
    this.step = -1;
  }
  get id() { return this.data.id; }

  ensureBuilt() {
    if (!this.built) { this.build(); this.built = true; }
  }
  build() {}
  enter() {
    this.ensureBuilt();
    this.active = true;
    this.layer.style.display = '';
  }
  exit() {
    this.active = false;
    this.layer.style.display = 'none';
  }
  reset() {}
  // à surcharger : renvoie une timeline
  transition(i) { return gsap.timeline(); }
  update(t, dt) {}
  onKey(e) { return false; }
  onClick(pt, ev) { return false; }
  onGesture(g) {}

  // utilitaire : son seulement en lecture animée
  tl(opts) { return gsap.timeline({ paused: false, ...opts }); }
}
