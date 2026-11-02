// Moteur d'étapes : l'écran suit le rythme du présentateur, jamais l'inverse.
import gsap from 'gsap';
import { sound } from './sound.js';

export class Engine {
  constructor(ctx, acts, content) {
    this.ctx = ctx;
    this.acts = acts;
    this.content = content;
    this.steps = [];
    acts.forEach((act, a) => {
      act.data.steps.forEach((s, local) => {
        this.steps.push({ act, actIndex: a, local, ...s, actTitle: act.data.title, actNumber: act.data.number });
      });
    });
    this.index = -1;
    this.current = null; // acte actif
    this.tl = null;
    this.listeners = [];
  }

  get total() { return this.steps.length; }
  onChange(fn) { this.listeners.push(fn); }

  next() { if (this.index < this.total - 1) this.go(this.index + 1, true); }
  prev() { if (this.index > 0) this.go(this.index - 1, false); }
  restartAct() { this.jumpToAct(this.steps[this.index].actIndex); }
  jumpToAct(a) {
    const i = this.steps.findIndex((s) => s.actIndex === a);
    if (i >= 0) this.go(i, true, true);
  }

  // animate=true : on joue la transition (si c'est l'étape suivante ou un début d'acte)
  // sinon : reconstruction instantanée de l'état final de l'étape.
  go(target, animate = true, forceRestart = false) {
    target = Math.max(0, Math.min(this.total - 1, target));
    const step = this.steps[target];
    const act = step.act;
    const prevIndex = this.index;
    const sameAct = this.current === act;

    if (this.tl) {
      // l'étape précédente se termine proprement avant d'enchaîner
      if (animate && target === prevIndex + 1 && sameAct) this.tl.progress(1);
      this.tl.kill();
      this.tl = null;
    }
    if (!sameAct) {
      this.current?.exit();
      act.enter();
      this.current = act;
    }

    const playable = animate && (
      (sameAct && target === prevIndex + 1 && !forceRestart) ||
      step.local === 0
    );

    if (playable && step.local === 0) act.reset();
    if (playable) {
      this.tl = act.transition(step.local) || gsap.timeline();
    } else {
      this.rebuild(act, step.local);
    }
    act.step = step.local;
    this.index = target;
    this.listeners.forEach((fn) => fn(this.state()));
  }

  rebuild(act, local) {
    this.ctx.instant = true;
    sound.setSilent(true);
    try {
      act.reset();
      for (let k = 0; k <= local; k++) {
        const tl = act.transition(k);
        if (tl) { tl.progress(1); tl.kill(); }
      }
    } finally {
      this.ctx.instant = false;
      sound.setSilent(false);
    }
  }

  state() {
    const s = this.steps[this.index];
    const n = this.steps[this.index + 1];
    const pick = (x) => x && ({
      index: this.steps.indexOf(x), id: x.id, title: x.title, speech: x.speech, notes: x.notes,
      actNumber: x.actNumber, actTitle: x.actTitle, local: x.local, actSteps: x.act.data.steps.length,
    });
    return { index: this.index, total: this.total, current: pick(s), next: pick(n) };
  }
}
