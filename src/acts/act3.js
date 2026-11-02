// Acte 3 — La préparation. Vue éclatée façon dessin industriel :
// un noyau (Claude) et huit modules qui viennent s'emboîter un à un.
import * as THREE from 'three';
import gsap from 'gsap';
import { Act } from '../engine/Act.js';
import { color } from '../theme/theme.js';
import { sound } from '../engine/sound.js';

const R_IN = 2.35;
const R_OUT = 4.4;
const H = 0.5;
const SPAN = (Math.PI * 2) / 8;
const GAP = 0.05;

export class Act3 extends Act {
  build() {
    const d = this.data;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 200);
    this.cam = { r: 21, h: 12.5, look: 0.6, az: 0 };
    this.placeCamera();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x120a18, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 10, 7);
    const rim = new THREE.DirectionalLight(color('--ss-orange'), 1.2);
    rim.position.set(-8, 3, -6);
    this.scene.add(key, rim);

    this.assembly = new THREE.Group();
    this.scene.add(this.assembly);

    this.accents = [color('--ss-red'), color('--ss-orange'), color('--ss-lavender'), color('--ss-red-bright')];
    this.buildBase();
    this.buildCore();
    this.buildModules();

    // calque DOM : étiquettes, panneau d'exemple, phrase finale
    this.layer.innerHTML = `
      <div class="a3-head"><span class="a3-head-n">03</span><span>${d.title}</span></div>
      <div class="a3-caption"><div class="a3-cap-n"></div><div class="a3-cap-name"></div><div class="a3-cap-sub"></div></div>
      <div class="a3-closing">${d.closing}</div>
      <div class="a3-panel panel interactive"></div>
      <div class="a3-legend">O · exemple du module</div>`;
    this.q = (s) => this.layer.querySelector(s);
    this.panel = this.q('.a3-panel');
    this.panelOpen = false;

    this.coreLabel = document.createElement('div');
    this.coreLabel.className = 'a3-core-label';
    this.coreLabel.innerHTML = `<span><b>${d.core.label}</b></span>`;
    this.labelEls = d.modules.map((m, i) => {
      const el = document.createElement('div');
      el.className = 'a3-label';
      el.innerHTML = `<div class="a3-l-in"><span class="a3-num">${String(i + 1).padStart(2, '0')}</span><span class="a3-name">${m.label}</span></div>`;
      return el;
    });
    this.diamLabel = document.createElement('div');
    this.diamLabel.className = 'a3-dim-label';
    this.diamLabel.innerHTML = '<span>Ø 8.80 — configuration équipe</span>';
    this.raycaster = new THREE.Raycaster();
    this.spinSpeed = 0;
  }

  placeCamera() {
    const c = this.cam;
    this.camera.position.set(Math.sin(c.az) * c.r, c.h, Math.cos(c.az) * c.r);
    this.camera.lookAt(0, c.look, 0);
  }

  lineMat(col, opacity = 0.5, dashed = false) {
    return dashed
      ? new THREE.LineDashedMaterial({ color: col, transparent: true, opacity, dashSize: 0.18, gapSize: 0.12 })
      : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity });
  }

  circle(r, segs = 128, y = 0) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  buildBase() {
    const g = new THREE.Group();
    this.base = g;
    const white = new THREE.Color('#ffffff');
    // grands cercles de construction
    this.constructionMats = [];
    for (const [r, op, dashed] of [[R_IN, 0.35, false], [R_OUT, 0.35, false], [(R_IN + R_OUT) / 2, 0.18, true], [6.4, 0.1, true], [8.2, 0.06, false]]) {
      const m = this.lineMat(white, op, dashed);
      const l = new THREE.Line(this.circle(r, 160, -0.02), m);
      if (dashed) l.computeLineDistances();
      m.userData.base = op;
      this.constructionMats.push(m);
      g.add(l);
    }
    // rayons à 45° + axes
    const pts = [];
    for (let k = 0; k < 8; k++) {
      const a = k * SPAN - SPAN / 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 1.6, -0.02, Math.sin(a) * 1.6), new THREE.Vector3(Math.cos(a) * 6.6, -0.02, Math.sin(a) * 6.6));
    }
    pts.push(new THREE.Vector3(-9, -0.02, 0), new THREE.Vector3(9, -0.02, 0), new THREE.Vector3(0, -0.02, -9), new THREE.Vector3(0, -0.02, 9));
    const rm = this.lineMat(white, 0.09);
    rm.userData.base = 0.09;
    this.constructionMats.push(rm);
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), rm));
    // plaque de base sombre
    const plate = new THREE.Mesh(
      new THREE.RingGeometry(R_IN - 0.15, R_OUT + 0.25, 128),
      new THREE.MeshStandardMaterial({ color: '#141017', roughness: 0.9, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = -0.04;
    this.plate = plate;
    g.add(plate);
    // cote de diamètre (affichée à la fin)
    const dimPts = [
      new THREE.Vector3(-R_OUT, 0, 5.6), new THREE.Vector3(R_OUT, 0, 5.6),
      new THREE.Vector3(-R_OUT, 0, 5.3), new THREE.Vector3(-R_OUT, 0, 5.9),
      new THREE.Vector3(R_OUT, 0, 5.3), new THREE.Vector3(R_OUT, 0, 5.9),
      new THREE.Vector3(-R_OUT, 0, 0.2), new THREE.Vector3(-R_OUT, 0, 5.9),
      new THREE.Vector3(R_OUT, 0, 0.2), new THREE.Vector3(R_OUT, 0, 5.9),
    ];
    this.diamMat = this.lineMat(color('--ss-orange'), 0);
    this.diam = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(dimPts), this.diamMat);
    this.diamAnchor = new THREE.Object3D();
    this.diamAnchor.position.set(0, 0, 5.6);
    this.scene.add(this.diam, this.diamAnchor);
    this.assembly.add(g);
  }

  buildCore() {
    const g = new THREE.Group();
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, 1),
      new THREE.MeshStandardMaterial({ color: '#1c1420', emissive: color('--ss-orange'), emissiveIntensity: 0.18, roughness: 0.35, metalness: 0.6, flatShading: true, transparent: true })
    );
    inner.position.y = 0.9;
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.55, 1)),
      this.lineMat(color('--ss-orange'), 0.55)
    );
    wire.position.y = 0.9;
    const ring = new THREE.Line(this.circle(1.9, 96, 0.9), this.lineMat(new THREE.Color('#ffffff'), 0.35));
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 2.1, 0.3, 64),
      new THREE.MeshStandardMaterial({ color: '#221a28', roughness: 0.6, metalness: 0.4, transparent: true })
    );
    pedestal.position.y = 0.0;
    g.add(inner, wire, ring, pedestal);
    this.core = { group: g, inner, wire, ring, pedestal };
    this.coreAnchor = new THREE.Object3D();
    this.coreAnchor.position.set(0, 3.0, 0);
    g.add(this.coreAnchor);
    this.assembly.add(g);
  }

  sectorGeometry(a0, a1) {
    const s = new THREE.Shape();
    s.absarc(0, 0, R_OUT, a0, a1, false);
    s.absarc(0, 0, R_IN, a1, a0, true);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, curveSegments: 24 });
    geo.rotateX(-Math.PI / 2); // extrusion vers le haut (y)
    return geo;
  }

  buildModules() {
    this.modules = this.data.modules.map((m, i) => {
      // ordre de pose : on commence à l'avant (face caméra) et on tourne
      const mid = Math.PI / 2 - i * SPAN;
      const a0 = mid - SPAN / 2 + GAP;
      const a1 = mid + SPAN / 2 - GAP;
      const geo = this.sectorGeometry(-a1, -a0); // repère : z = -sin après rotation
      const acc = this.accents[i % this.accents.length];
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2a2230', roughness: 0.45, metalness: 0.55, flatShading: true, transparent: true, opacity: 1 }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), this.lineMat(acc, 0.85));
      // marque d'accent sur le dessus
      const markGeo = new THREE.BoxGeometry(0.9, 0.04, 0.12);
      const mark = new THREE.Mesh(markGeo, new THREE.MeshBasicMaterial({ color: acc, transparent: true }));
      const rMid = (R_IN + R_OUT) / 2;
      mark.position.set(Math.cos(mid) * rMid, H + 0.06, Math.sin(mid) * rMid);
      mark.rotation.y = -mid + Math.PI / 2;
      const grp = new THREE.Group();
      grp.add(mesh, edges, mark);
      // contour pointillé de l'emplacement (sur la base)
      const slot = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), this.lineMat(new THREE.Color('#ffffff'), 0.0, true));
      slot.computeLineDistances();
      slot.scale.y = 0.02;
      this.assembly.add(slot);

      const dir = new THREE.Vector3(Math.cos(mid), 0, Math.sin(mid));
      const explode = dir.clone().multiplyScalar(2.2 + (i % 2) * 0.5).add(new THREE.Vector3(0, 1.7 + (i % 3) * 0.45, 0));
      const anchor = new THREE.Object3D();
      anchor.position.copy(dir.clone().multiplyScalar(rMid)).add(new THREE.Vector3(0, H + 0.3, 0));
      grp.add(anchor);
      // cote radiale du module
      const dimPts = [
        dir.clone().multiplyScalar(R_IN).setY(H + 0.15), dir.clone().multiplyScalar(R_OUT).setY(H + 0.15),
      ];
      const dim = new THREE.Line(new THREE.BufferGeometry().setFromPoints(dimPts), this.lineMat(new THREE.Color('#ffffff'), 0));
      grp.add(dim);
      this.assembly.add(grp);
      return { data: m, grp, mesh, edges, mark, slot, explode, anchor, dim, acc, tilt: (i % 2 ? 1 : -1) * 0.18, fitted: false, phase: i * 0.8 };
    });
  }

  enter() {
    super.enter();
    this.ctx.scene = this.scene;
    this.ctx.camera = this.camera;
    const L = this.ctx.labels;
    L.add(this.coreLabel, this.coreAnchor);
    this.modules.forEach((m, i) => L.add(this.labelEls[i], m.anchor));
    L.add(this.diamLabel, this.diamAnchor, new THREE.Vector3(0, 0, 0.5));
  }
  exit() {
    super.exit();
    this.ctx.scene = null;
    this.ctx.labels.clear();
    this.closePanel(true);
  }

  setOpacity(obj, v) {
    obj.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = v; } });
  }

  reset() {
    gsap.killTweensOf(this.cam);
    Object.assign(this.cam, { r: 21, h: 12.5, look: 0.6, az: 0 });
    this.placeCamera();
    this.assembly.rotation.set(0, 0, 0);
    this.spinSpeed = 0;
    this.fade = { base: 0, core: 0, mods: 0 };
    this.applyFade();
    this.core.inner.material.emissiveIntensity = 0.18;
    this.modules.forEach((m) => {
      m.fitted = false;
      m.grp.position.copy(m.explode);
      m.grp.rotation.set(m.tilt, 0, m.tilt * 0.5);
      m.dim.material.opacity = 0;
      m.slot.material.opacity = 0;
      m.edges.material.opacity = 0.85;
    });
    this.diamMat.opacity = 0;
    this.labelEls.forEach((el) => { el.classList.remove('active', 'fitted'); el.style.opacity = 0; });
    this.coreLabel.style.opacity = 0;
    this.diamLabel.style.opacity = 0;
    gsap.set(this.q('.a3-closing'), { opacity: 0, y: 20 });
    gsap.killTweensOf(this.q('.a3-caption'));
    gsap.set(this.q('.a3-caption'), { opacity: 0 });
    gsap.set(this.q('.a3-head'), { opacity: 0 });
    gsap.set(this.q('.a3-legend'), { opacity: 0 });
    this.closePanel(true);
    this.lastFitted = -1;
  }

  applyFade() {
    const f = this.fade;
    this.constructionMats.forEach((m) => (m.opacity = m.userData.base * f.base));
    this.plate.material.opacity = 0.85 * f.base;
    this.setOpacity(this.core.group, f.core);
    this.core.wire.material.opacity = 0.55 * f.core;
    this.core.ring.material.opacity = 0.35 * f.core;
    this.modules.forEach((m) => {
      m.mesh.material.opacity = f.mods;
      m.mark.material.opacity = f.mods;
      m.edges.material.opacity = 0.85 * f.mods;
      if (!m.fitted) m.slot.material.opacity = 0.3 * f.base;
    });
    this.coreLabel.style.opacity = f.core;
    this.labelEls.forEach((el, i) => { if (!this.modules[i].fitted && !el.classList.contains('active')) el.style.opacity = 0.4 * f.mods; });
  }

  fit(tl, i, at = 0) {
    const m = this.modules[i];
    const el = this.labelEls[i];
    tl.call(() => {
      this.labelEls.forEach((e, k) => { if (e.classList.contains('active')) { e.classList.remove('active'); e.classList.add('fitted'); e.style.opacity = 0; } });
      el.classList.add('active');
      el.style.opacity = 0;
      this.setCaption(i);
      if (this.panelOpen) this.closePanel();
    }, null, at);
    // approche : alignement au-dessus de l'emplacement, puis descente précise
    tl.to(m.grp.position, { x: 0, z: 0, y: 1.4, duration: 1.0, ease: 'power3.inOut' }, at + 0.1);
    tl.to(m.grp.rotation, { x: 0, y: 0, z: 0, duration: 1.0, ease: 'power3.inOut' }, at + 0.1);
    tl.to(m.slot.material, { opacity: 0.9, duration: 0.4 }, at + 0.3);
    tl.to(m.grp.position, { y: 0, duration: 0.45, ease: 'power4.in' }, at + 1.15);
    tl.call(() => {
      m.fitted = true;
      this.lastFitted = i;
      sound.click(1);
    }, null, at + 1.6);
    // petit rebond mécanique
    tl.to(m.grp.position, { y: 0.035, duration: 0.07, ease: 'power1.out' }, at + 1.6);
    tl.to(m.grp.position, { y: 0, duration: 0.18, ease: 'bounce.out' }, at + 1.67);
    tl.fromTo(m.edges.material, { opacity: 1 }, { opacity: 0.55, duration: 1.2, immediateRender: false }, at + 1.6);
    tl.to(m.slot.material, { opacity: 0, duration: 0.3 }, at + 1.6);
    tl.fromTo(m.dim.material, { opacity: 0.9 }, { opacity: 0.25, duration: 2, immediateRender: false }, at + 1.65);
    tl.to(this.core.inner.material, { emissiveIntensity: 0.18 + (i + 1) * 0.04, duration: 0.8 }, at + 1.6);
    return tl;
  }

  setCaption(i) {
    const cap = this.q('.a3-caption');
    if (i < 0) { gsap.to(cap, { opacity: 0, duration: 0.4 }); return; }
    const m = this.data.modules[i];
    this.q('.a3-cap-n').textContent = `${String(i + 1).padStart(2, '0')} / ${String(this.data.modules.length).padStart(2, '0')}`;
    this.q('.a3-cap-name').textContent = m.label;
    this.q('.a3-cap-sub').textContent = m.sub;
    if (this.ctx.instant) gsap.set(cap, { opacity: 1, y: 0 });
    else gsap.fromTo(cap, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
  }

  transition(i) {
    const tl = gsap.timeline();
    const id = this.stepIds[i];
    if (id === 'noyau') {
      const f = this.fade;
      tl.to(this.q('.a3-head'), { opacity: 1, duration: 1 }, 0.2);
      tl.to(f, { base: 1, duration: 2, ease: 'power2.out', onUpdate: () => this.applyFade() }, 0.2);
      tl.to(f, { core: 1, duration: 1.6, ease: 'power2.out', onUpdate: () => this.applyFade() }, 0.8);
      tl.to(f, { mods: 1, duration: 1.8, ease: 'power2.out', onUpdate: () => this.applyFade() }, 1.6);
      tl.to(this.cam, { r: 19.5, duration: 4, ease: 'power2.out', onUpdate: () => this.placeCamera() }, 0);
      tl.to(this.q('.a3-legend'), { opacity: 1, duration: 1 }, 3);
    } else if (id.startsWith('m-')) {
      const k = this.data.modules.findIndex((m) => 'm-' + m.id === id);
      this.fit(tl, k, 0);
    } else if (id === 'rotation') {
      tl.call(() => {
        this.labelEls.forEach((e) => { e.classList.remove('active'); e.classList.add('fitted'); });
        if (this.panelOpen) this.closePanel();
        this.setCaption(-1);
      }, null, 0);
      tl.to(this.labelEls, { opacity: 0, duration: 0.8 }, 0);
      tl.to(this.cam, { r: 17, h: 8.5, look: 0.9, duration: 3, ease: 'power2.inOut', onUpdate: () => this.placeCamera() }, 0);
      tl.to(this.diamMat, { opacity: 0.8, duration: 1 }, 1.2);
      tl.to(this.diamLabel, { opacity: 1, duration: 1 }, 1.4);
      tl.to(this.core.inner.material, { emissiveIntensity: 0.65, duration: 2 }, 0.6);
      tl.to(this, { spinSpeed: 0.16, duration: 3, ease: 'power1.in' }, 0.8);
      tl.to(this.q('.a3-closing'), { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, 2.4);
      tl.to(this.q('.a3-legend'), { opacity: 0, duration: 0.6 }, 0);
    }
    return tl;
  }

  // ------------------------------------------------------------ panneau d'exemple
  openPanel(i) {
    const m = this.modules[i]?.data;
    if (!m) return;
    const ex = m.example;
    this.panel.innerHTML = `
      <div class="panel-tag">${String(i + 1).padStart(2, '0')} · ${m.label}</div>
      <div class="a3-panel-title">${ex.title}</div>
      <pre class="a3-panel-code ${ex.kind}">${ex.lines.map((l) => escapeHtml(l)).join('\n')}</pre>`;
    this.panelOpen = true;
    this.panelIndex = i;
    gsap.killTweensOf(this.panel);
    gsap.fromTo(this.panel, { opacity: 0, x: 40, scaleX: 0.9 }, { opacity: 1, x: 0, scaleX: 1, duration: 0.6, ease: 'power3.out' });
    sound.click(0.4);
  }
  closePanel(instant = false) {
    if (!this.panel) return;
    this.panelOpen = false;
    gsap.killTweensOf(this.panel);
    if (instant) gsap.set(this.panel, { opacity: 0 });
    else gsap.to(this.panel, { opacity: 0, x: 40, duration: 0.4, ease: 'power2.in' });
  }
  togglePanel(i = this.lastFitted >= 0 ? this.lastFitted : 0) {
    if (this.panelOpen && this.panelIndex === i) this.closePanel();
    else this.openPanel(i);
  }

  onKey(e) {
    if (e.key === 'o' || e.key === 'O') { this.togglePanel(); return true; }
    if (e.key === 'Escape' && this.panelOpen) { this.closePanel(); return true; }
    return false;
  }

  onClick(pt, ev) {
    if (ev.target.closest('.a3-panel')) { this.closePanel(); return true; }
    const ndc = new THREE.Vector2((pt.x / 1920) * 2 - 1, -(pt.y / 1080) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.modules.map((m) => m.mesh));
    if (hits.length) {
      const i = this.modules.findIndex((m) => m.mesh === hits[0].object);
      this.togglePanel(i);
      return true;
    }
    return false;
  }

  onGesture(g) {
    if (g.type === 'rotate') this.assembly.rotation.y += g.dx * 6;
    if (g.type === 'zoom') { this.cam.r = THREE.MathUtils.clamp(this.cam.r - g.dz * 40, 11, 24); this.placeCamera(); }
    if (g.type === 'spread' && g.amount > 0.7 && !this.panelOpen) this.togglePanel();
    if (g.type === 'open') this.togglePanel();
  }

  update(t, dt) {
    // pause vivante : le noyau respire, les modules non posés flottent
    const c = this.core;
    c.inner.rotation.y += dt * 0.25;
    c.wire.rotation.y -= dt * 0.12;
    c.wire.rotation.x = Math.sin(t * 0.3) * 0.08;
    this.modules.forEach((m) => {
      if (!m.fitted && !gsap.isTweening(m.grp.position)) {
        m.grp.position.y = m.explode.y + Math.sin(t * 0.8 + m.phase) * 0.12;
        m.grp.rotation.y = Math.sin(t * 0.4 + m.phase) * 0.05;
      }
    });
    if (this.spinSpeed > 0) this.assembly.rotation.y += dt * this.spinSpeed;
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
