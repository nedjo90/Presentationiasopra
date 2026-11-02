// Étiquettes DOM ancrées sur des objets 3D (projection → coordonnées scène 1920×1080).
import * as THREE from 'three';
import { STAGE_W, STAGE_H } from './stage.js';

const v = new THREE.Vector3();

export class Labels {
  constructor(container) {
    this.container = container;
    this.items = [];
  }
  add(el, target, offset = new THREE.Vector3()) {
    el.classList.add('anchor');
    this.container.appendChild(el);
    const item = { el, target, offset };
    this.items.push(item);
    return item;
  }
  remove(el) {
    this.items = this.items.filter((i) => i.el !== el);
    el.remove();
  }
  clear() {
    this.items.forEach((i) => i.el.remove());
    this.items = [];
  }
  update(camera) {
    for (const it of this.items) {
      if (it.target.isObject3D) it.target.getWorldPosition(v);
      else v.copy(it.target);
      v.add(it.offset).project(camera);
      const x = (v.x * 0.5 + 0.5) * STAGE_W;
      const y = (-v.y * 0.5 + 0.5) * STAGE_H;
      it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      it.x = x; it.y = y;
    }
  }
}
