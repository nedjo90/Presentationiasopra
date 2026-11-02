// Bureau isométrique partagé par les actes 1 (gris), 4 (couleur) et 5 (extinction).
// Style minimaliste : dalle flottante, volumes simples, personnages sans visage.
import * as THREE from 'three';
import gsap from 'gsap';
import { color } from '../theme/theme.js';

const ISO_DIR = new THREE.Vector3(1, 0.82, 1).normalize();

// Couleurs « grises » de l'acte 1 (désaturées)
const GREY = {
  floor: new THREE.Color('#3a3a3c'),
  floorSide: new THREE.Color('#202022'),
  wall: new THREE.Color('#2c2c2e'),
  desk: new THREE.Color('#5a5a5d'),
  person: new THREE.Color('#8a8a8d'),
  head: new THREE.Color('#9a9a9d'),
  screen: new THREE.Color('#2a2a2c'),
  chair: new THREE.Color('#444446'),
};

export const SEATS = {
  necati: { desk: new THREE.Vector3(-5, 0, -3.2), facing: Math.PI },
  clement: { desk: new THREE.Vector3(-1, 0, -3.2), facing: Math.PI },
  eden: { desk: new THREE.Vector3(3, 0, -3.2), facing: Math.PI },
  nicolas: { desk: new THREE.Vector3(-5, 0, 1.8), facing: Math.PI },
  catherine: { desk: new THREE.Vector3(-1, 0, 1.8), facing: Math.PI },
};
export const MEETING = new THREE.Vector3(4.6, 0, 2.4);
export const DOOR = new THREE.Vector3(7.2, 0, -5.2);

export class Office {
  constructor(team) {
    this.team = team;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.colorables = []; // { mat, grey, color }
    this.people = {};
    this.desks = {};
    this.screens = {};
    this.glows = {};
    this.colorAmount = { v: 0 };
    this.light = { v: 1 };
    this.time = 0;

    const aspect = 16 / 9;
    const h = 19;
    this.frustum = { w: h * aspect, h };
    this.camera = new THREE.OrthographicCamera((-h * aspect) / 2, (h * aspect) / 2, h / 2, -h / 2, 0.1, 200);
    this.rig = { x: 0, y: 0, z: 0, zoom: 1, orbit: 0, shift: 0 };
    this.updateCamera();

    this.buildLights();
    this.buildRoom();
    this.buildDesks();
    this.buildPeople();
    this.buildMeeting();
    this.buildTickets();
    this.applyColor();
  }

  // ------------------------------------------------------------------ build
  mat(grey, col, opts = {}) {
    const m = new THREE.MeshStandardMaterial({ color: grey.clone(), roughness: 0.85, metalness: 0.0, flatShading: true, ...opts });
    this.colorables.push({ mat: m, grey: grey.clone(), color: col.clone() });
    return m;
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x1a1020, 1.4);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sun.position.set(6, 14, 9);
    this.scene.add(this.sun);
    this.fill = new THREE.DirectionalLight(0xffffff, 0.5);
    this.fill.position.set(-10, 6, 4);
    this.scene.add(this.fill);
  }

  buildRoom() {
    const g = new THREE.Group();
    const floorCol = color('--office-floor');
    const wallCol = color('--office-wall');
    // dalle flottante
    const slab = new THREE.Mesh(new THREE.BoxGeometry(18, 0.7, 12), [
      this.mat(GREY.floorSide, floorCol.clone().multiplyScalar(0.6)),
      this.mat(GREY.floorSide, floorCol.clone().multiplyScalar(0.6)),
      this.mat(GREY.floor, floorCol.clone().lerp(new THREE.Color('#ffffff'), 0.08)),
      this.mat(GREY.floorSide, floorCol),
      this.mat(GREY.floorSide, floorCol.clone().multiplyScalar(0.8)),
      this.mat(GREY.floorSide, floorCol.clone().multiplyScalar(0.8)),
    ]);
    slab.position.y = -0.35;
    g.add(slab);
    // murs bas en L
    const wallMat = this.mat(GREY.wall, wallCol);
    const back = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 0.3), wallMat);
    back.position.set(0, 1.6, -6.15);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 12.3), wallMat);
    left.position.set(-9.15, 1.6, 0);
    g.add(back, left);
    // fines lignes de construction sur le sol
    const lines = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(18, 0.7, 12)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
    );
    lines.position.y = -0.35;
    g.add(lines);
    this.edgeLines = lines;

    // porte « CFL » (cadre) dans le mur du fond
    const doorFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 2.5, 0.32)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })
    );
    doorFrame.position.set(DOOR.x, 1.25, -6.1);
    this.doorFrame = doorFrame;
    const doorPane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 2.4),
      new THREE.MeshBasicMaterial({ color: color('--ss-orange'), transparent: true, opacity: 0 })
    );
    doorPane.position.set(DOOR.x, 1.22, -5.98);
    this.doorPane = doorPane;
    g.add(doorFrame, doorPane);

    // tableau Jira sur le mur gauche
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.7, 3.2), this.mat(new THREE.Color('#3f3f42'), new THREE.Color('#e9e6ee')));
    board.position.set(-8.95, 1.7, 1.8);
    g.add(board);
    const cardCols = [color('--ss-red'), color('--ss-orange'), color('--ss-lavender'), color('--ss-plum')];
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 3; r++) {
        if ((c + r) % 3 === 2 && c !== 3) continue;
        const card = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.55), this.mat(new THREE.Color('#58585b'), cardCols[(c + r) % 4]));
        card.position.set(-8.88, 2.2 - r * 0.4, 0.6 + c * 0.8);
        g.add(card);
      }
    }
    this.board = board;
    this.scene.add(g);
    this.room = g;
  }

  buildDesks() {
    const deskCol = color('--office-desk');
    for (const [id, s] of Object.entries(SEATS)) {
      const grp = new THREE.Group();
      grp.position.copy(s.desk);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), this.mat(GREY.desk, deskCol.clone().lerp(new THREE.Color('#ffffff'), 0.15)));
      top.position.y = 1.0;
      const legMat = this.mat(GREY.desk, deskCol);
      for (const sx of [-1.1, 1.1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 1.1), legMat);
        leg.position.set(sx, 0.5, 0);
        grp.add(leg);
      }
      // écran : face vers +z (vers la personne, et donc vers la caméra)
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.78, 0.06), this.mat(new THREE.Color('#303033'), new THREE.Color('#1b1520')));
      monitor.position.set(0, 1.62, -0.35);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), legMat);
      stand.position.set(0, 1.18, -0.35);
      const screenMat = new THREE.MeshBasicMaterial({ color: GREY.screen.clone() });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.68), screenMat);
      screen.position.set(0, 1.62, -0.315);
      screen.userData.deskId = id;
      // lignes de « code » sur l'écran
      const codeGrp = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const w = 0.25 + ((i * 37) % 7) / 10;
        const ln = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.035), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
        ln.position.set(-0.5 + w / 2 + (i % 3 === 1 ? 0.1 : 0), 1.86 - i * 0.085, -0.31);
        codeGrp.add(ln);
      }
      // lueur Claude (acte 4)
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 1.35),
        new THREE.MeshBasicMaterial({ map: glowTexture(), color: color('--claude-glow'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.position.set(0, 1.62, -0.28);
      // chaise
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), this.mat(GREY.chair, color('--ss-purple').clone().lerp(new THREE.Color('#ffffff'), 0.1)));
      chair.position.set(0, 0.62, 1.0);
      const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), legMat);
      chairLeg.position.set(0, 0.3, 1.0);
      grp.add(top, monitor, stand, screen, codeGrp, glow, chair, chairLeg);
      grp.rotation.y = s.facing - Math.PI; // bureaux orientés vers -z
      this.scene.add(grp);
      this.desks[id] = grp;
      this.screens[id] = { mesh: screen, mat: screenMat, code: codeGrp };
      this.glows[id] = glow;
    }
  }

  buildPeople() {
    const pal = ['--person-1', '--person-2', '--person-3', '--person-4', '--person-5'];
    this.team.forEach((m, i) => {
      const col = color(pal[i % pal.length]);
      const p = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.55, 4, 10), this.mat(GREY.person, col));
      body.position.y = 0.65;
      const headPivot = new THREE.Group();
      headPivot.position.y = 1.2;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), this.mat(GREY.head, new THREE.Color('#f1ece8')));
      head.position.y = 0.22;
      headPivot.add(head);
      const armMat = this.mat(GREY.person, col.clone().multiplyScalar(0.8));
      const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.38, 3, 6), armMat);
      const armR = armL.clone();
      armL.position.set(-0.32, 0.8, -0.15);
      armR.position.set(0.32, 0.8, -0.15);
      armL.rotation.x = armR.rotation.x = -1.1;
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.3), this.mat(GREY.chair, col.clone().multiplyScalar(0.45)));
      legs.position.y = 0.25;
      p.add(body, headPivot, armL, armR, legs);
      p.userData = { id: m.id, headPivot, armL, armR, body, legs, mode: 'typing', phase: i * 1.3, walk: 0 };
      this.scene.add(p);
      this.people[m.id] = p;
      this.seat(m.id);
    });
  }

  buildMeeting() {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.85, 1.9, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(MEETING).setY(0.02);
    this.meetingRing = ring;
    this.scene.add(ring);
  }

  buildTickets() {
    this.tickets = [];
    const cols = [color('--ss-red'), color('--ss-orange'), color('--ss-lavender'), color('--ss-plum')];
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.6, transparent: true, opacity: 0 }));
      t.visible = true;
      this.scene.add(t);
      this.tickets.push(t);
    }
  }

  // ------------------------------------------------------------------ state
  seatPos(id) {
    const s = SEATS[id];
    return s.desk.clone().add(new THREE.Vector3(0, 0, 1.0));
  }
  seat(id) {
    const p = this.people[id];
    p.position.copy(this.seatPos(id));
    p.rotation.y = 0; // face à l'écran (avant = -z), dos à la caméra
    p.userData.mode = 'typing';
  }
  seatAll() { Object.keys(this.people).forEach((id) => this.seat(id)); }

  meetingSpot(i, n, r = 1.35) {
    const a = (i / n) * Math.PI * 2 + 0.4;
    return MEETING.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }

  // déplace une personne (tween ajouté à la timeline fournie)
  walkTo(tl, id, target, at = 0, dur = 1.6, faceTarget = null) {
    const p = this.people[id];
    const ud = p.userData;
    const proxy = { k: 0 };
    let from;
    tl.to(proxy, {
      k: 1, duration: dur, ease: 'power2.inOut',
      onStart: () => {
        from = p.position.clone();
        ud.mode = 'walking';
        const d = target.clone().sub(from);
        if (d.lengthSq() > 0.0001) p.rotation.y = Math.atan2(-d.x, -d.z);
      },
      onUpdate: () => { if (from) p.position.lerpVectors(from, target, proxy.k); },
      onComplete: () => {
        p.position.copy(target);
        ud.mode = 'standing';
        const look = faceTarget || MEETING;
        const d = look.clone().sub(target);
        p.rotation.y = Math.atan2(-d.x, -d.z);
      },
    }, at);
    return tl;
  }
  sitDown(tl, id, at = 0, dur = 1.6) {
    const target = this.seatPos(id);
    this.walkTo(tl, id, target, at, dur);
    tl.call(() => this.seat(id), null, at + dur);
    return tl;
  }

  applyColor() {
    const a = this.colorAmount.v;
    const l = this.light.v;
    for (const c of this.colorables) c.mat.color.copy(c.grey).lerp(c.color, a).multiplyScalar(Math.max(0.0, l));
    this.scene.visible = l > 0.003;
    const k = 1 - 0.25 * a; // un peu moins de lumière en couleur : teintes plus riches
    this.hemi.intensity = 1.4 * l * k;
    this.sun.intensity = 2.2 * l * k;
    this.fill.intensity = 0.5 * l;
    this.edgeLines.material.opacity = 0.12 * l;
    for (const [id, s] of Object.entries(this.screens)) {
      const base = GREY.screen.clone().lerp(new THREE.Color('#15101c'), a);
      s.mat.color.copy(base).multiplyScalar(l);
      s.code.children.forEach((ln) => (ln.material.opacity = 0.22 * l));
    }
  }

  setGlow(id, v) { this.glows[id].material.opacity = v; }

  updateCamera() {
    const r = this.rig;
    const dir = ISO_DIR.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), r.orbit);
    const target = new THREE.Vector3(r.x, r.y, r.z);
    this.camera.position.copy(target).addScaledVector(dir, 60);
    this.camera.lookAt(target);
    this.camera.zoom = r.zoom;
    // décalage horizontal de cadrage (en fraction de largeur d'écran)
    const { w, h } = this.frustum;
    const off = (r.shift * w) / r.zoom;
    this.camera.left = -w / 2 - off;
    this.camera.right = w / 2 - off;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
  }

  // tween caméra vers un point / zoom
  focus(tl, pos, zoom, at = 0, dur = 1.6, shift = 0) {
    tl.to(this.rig, { x: pos.x, y: pos.y ?? 0, z: pos.z, zoom, shift, duration: dur, ease: 'power3.inOut', onUpdate: () => this.updateCamera() }, at);
    return tl;
  }

  resetRig(zoom = 1) {
    Object.assign(this.rig, { x: 0, y: 0, z: 0, zoom, orbit: 0, shift: 0 });
    this.updateCamera();
  }

  // état de base commun (appelé par les reset() des actes)
  resetAll({ colorAmount = 0, light = 1 } = {}) {
    gsap.killTweensOf(this.rig);
    this.colorAmount.v = colorAmount;
    this.light.v = light;
    this.scene.position.y = 0;
    this.seatAll();
    Object.keys(this.glows).forEach((id) => this.setGlow(id, 0));
    this.meetingRing.material.opacity = 0;
    this.doorFrame.material.opacity = 0;
    this.doorPane.material.opacity = 0;
    this.tickets.forEach((t) => { t.material.opacity = 0; t.position.set(0, -50, 0); });
    this.resetRig();
    this.applyColor();
  }

  update(t, dt) {
    this.time = t;
    for (const p of Object.values(this.people)) {
      const ud = p.userData;
      const ph = t * 1 + ud.phase;
      if (ud.mode === 'typing') {
        ud.headPivot.rotation.x = -0.38 + Math.sin(ph * 0.7) * 0.04; // tête baissée
        ud.armL.rotation.x = -1.15 + Math.sin(ph * 14) * 0.08;
        ud.armR.rotation.x = -1.15 + Math.cos(ph * 15) * 0.08;
        ud.body.position.y = 0.65;
        p.position.y = 0;
      } else if (ud.mode === 'walking') {
        ud.headPivot.rotation.x = 0;
        ud.armL.rotation.x = Math.sin(t * 9) * 0.5;
        ud.armR.rotation.x = -Math.sin(t * 9) * 0.5;
        p.position.y = Math.abs(Math.sin(t * 9)) * 0.06;
      } else {
        ud.headPivot.rotation.x = Math.sin(ph * 0.8) * 0.05;
        ud.armL.rotation.x = 0.05;
        ud.armR.rotation.x = 0.05;
        p.position.y = 0;
      }
    }
    // lignes de code qui défilent doucement sur les écrans
    for (const s of Object.values(this.screens)) {
      s.code.children.forEach((ln, i) => {
        ln.scale.x = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.6 + i * 1.7 + s.mesh.position.x));
      });
    }
  }
}

let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

export { gsap };
