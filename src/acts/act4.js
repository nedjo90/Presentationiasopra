// Acte 4 — Le sprint en relais. Le bureau revient, en couleur et vivant.
// Cérémonies Scrum, relais entre développeurs, revue, cerveau commun, Jira.
import * as THREE from 'three';
import gsap from 'gsap';
import { Act } from '../engine/Act.js';
import { sound } from '../engine/sound.js';
import { SEATS, MEETING, DOOR } from '../scenes/office.js';
import { SessionWall } from './sessionWall.js';

const DEVS = ['necati', 'clement', 'eden'];

export class Act4 extends Act {
  build() {
    const d = this.data;
    const C = this.ctx.content;
    this.office = this.ctx.office();
    this.team = C.team;

    // --------- calque DOM
    this.layer.innerHTML = `
      <div class="a4-head"><span class="a4-head-n">04</span><span>${d.title}</span><span class="a4-chip"></span></div>

      <div class="a4-panel panel" data-p="arch">
        <div class="panel-tag">POC · ARCHITECTURE</div>
        <div class="a4-title">${d.architecture.title}</div>
        <div class="a4-arch">
          ${d.architecture.nodes.map((n, i) => `<div class="a4-node" style="--i:${i}"><span class="a4-node-i">${String(i + 1).padStart(2, '0')}</span>${n}</div>`).join('<div class="a4-link"></div>')}
        </div>
      </div>

      <div class="a4-panel panel" data-p="clement">
        <div class="panel-tag">RELAIS · CLÉMENT</div>
        <div class="a4-title">${d.relayClement.title}</div>
        <ul class="a4-list mono">${d.relayClement.items.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>

      <div class="a4-panel panel" data-p="eden">
        <div class="panel-tag">RELAIS · EDEN</div>
        <div class="a4-title">${d.relayEden.title}</div>
        <ul class="a4-list">${d.relayEden.items.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>

      <div class="a4-review" data-p="review">
        <div class="tool-vscode a4-code">
          <div class="tv-tab">${d.review.file}</div>
          <div class="tv-body">${this.reviewCode()}</div>
        </div>
        <div class="tool-vscode a4-comments">
          <div class="tv-tab">Revue de code · 3 commentaires</div>
          <div class="tv-body">
            ${d.review.comments.map((c) => `<div class="a4-comment"><div class="a4-c-who"><b>${c.who}</b> · l.${c.line}</div><div>${c.text}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="a4-panel panel" data-p="brain">
        <div class="panel-tag">CERVEAU COMMUN</div>
        <div class="a4-title mono">${d.brain.skill}</div>
        <div class="a4-brain-ver"><span class="from">${d.brain.from}</span><span class="arrow">→</span><span class="to">${d.brain.to}</span></div>
        <div class="a4-brain-change mono">${d.brain.change}</div>
        <div class="a4-brain-devs">${DEVS.map((id) => `<span data-dev="${id}">${this.member(id).short}</span>`).join('')}</div>
      </div>

      <div class="a4-board tool-jira" data-p="board">
        <div class="tj-head"><span class="tj-logo">◆</span>${d.board.title}</div>
        <div class="tj-cols">
          ${d.board.columns.map((c) => `<div class="tj-col"><div class="tj-col-h">${c.name} <i>${c.cards.length}</i></div>${c.cards.map((x) => `<div class="tj-card">${x}</div>`).join('')}</div>`).join('')}
        </div>
      </div>
      <div class="a4-gauges panel" data-p="gauges">
        <div class="panel-tag">CADRE · CATHERINE</div>
        ${d.board.gauges.map((g) => `<div class="a4-gauge"><div class="a4-g-label">${g.label}</div><div class="a4-g-track"><div class="a4-g-bar" style="--v:${g.value}"></div></div><div class="a4-g-text">${g.text}</div></div>`).join('')}
      </div>

      <div class="a4-figures" data-p="figures">
        ${d.figures.map((f) => `<div class="a4-fig"><div class="a4-fig-v">${f.value}</div><div class="a4-fig-l">${f.label}</div></div>`).join('')}
      </div>

      <div class="a4-lessons" data-p="lessons">
        ${d.lessons.map((l, i) => `<div class="a4-lesson panel"><div class="panel-tag">${String(i + 1).padStart(2, '0')}</div><div class="a4-title">${l.title}</div><ul class="a4-list">${l.items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}
      </div>

      <div class="a4-hint">W · mur de sessions</div>`;
    this.q = (s) => this.layer.querySelector(s);
    this.qa = (s) => [...this.layer.querySelectorAll(s)];
    this.panels = this.qa('[data-p]');

    // --------- étiquettes ancrées (noms, bulles, badges)
    this.nameEls = {};
    this.team.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'a4-name';
      el.innerHTML = `<b>${m.short}</b><span>${m.role}</span>`;
      this.nameEls[m.id] = el;
    });
    this.bubble = document.createElement('div');
    this.bubble.className = 'a4-bubble anchor';
    this.doorLabel = document.createElement('div');
    this.doorLabel.className = 'a4-door-label';
    this.doorLabel.innerHTML = `<span>${d.nicolas.place}</span>`;
    this.doorAnchor = new THREE.Object3D();
    this.doorAnchor.position.set(DOOR.x, 2.9, -6);
    this.badges = {};
    DEVS.forEach((id) => {
      const el = document.createElement('div');
      el.className = 'a4-badge';
      el.innerHTML = `<span class="mono">${d.brain.to}</span>`;
      this.badges[id] = el;
    });

    // --------- lignes du cerveau commun (3D)
    const pts = DEVS.map((id) => SEATS[id].desk.clone().add(new THREE.Vector3(0, 2.15, -0.3)));
    const seg = [pts[0], pts[1], pts[1], pts[2], pts[0].clone().setY(2.6), pts[2].clone().setY(2.6)];
    this.brainLines = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(seg),
      new THREE.LineBasicMaterial({ color: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--ss-orange').trim()), transparent: true, opacity: 0 })
    );

    this.wall = new SessionWall(this.layer, C.sessionWall, C);
    this.raycaster = new THREE.Raycaster();
  }

  member(id) { return this.team.find((m) => m.id === id); }

  reviewCode() {
    const lines = this.ctx.content.sessionWall.panels[1].lines;
    const commented = new Set(this.data.review.comments.map((c) => c.line));
    // on numérote à partir de 1, avec quelques lignes de contexte
    const all = ['CLASS lhc_invoice IMPLEMENTATION.', '', ...lines.slice(0, 1), '    SELECT SINGLE * FROM zinv_settings INTO @DATA(ls_cfg).', ...lines.slice(1, 5), "      APPEND VALUE #( %msg = new_message_with_text( text = 'Commande manquante' ) )", ...lines.slice(5), 'ENDCLASS.'];
    return all.map((l, i) => `<div class="tv-line ${commented.has(i + 1) ? 'flag' : ''}"><span class="tv-n">${i + 1}</span><span class="tv-src">${hl(l)}</span></div>`).join('');
  }

  enter() {
    super.enter();
    const o = this.office;
    this.ctx.scene = o.scene;
    this.ctx.camera = o.camera;
    o.scene.add(this.brainLines);
    const L = this.ctx.labels;
    this.team.forEach((m) => L.add(this.nameEls[m.id], o.people[m.id], new THREE.Vector3(0, 2.25, 0)));
    L.add(this.doorLabel, this.doorAnchor);
    DEVS.forEach((id) => L.add(this.badges[id], o.desks[id], new THREE.Vector3(0, 2.45, -0.3)));
    this.bubbleItem = L.add(this.bubble, o.people.eden, new THREE.Vector3(0, 3.1, 0));
  }
  exit() {
    super.exit();
    this.office.scene.remove(this.brainLines);
    this.ctx.labels.clear();
    this.ctx.scene = null;
    this.wall.close(true);
  }

  reset() {
    const o = this.office;
    o.resetAll({ colorAmount: 0, light: 0 });
    o.rig.shift = -0.14;
    o.updateCamera();
    this.wall.close(true);
    gsap.set(this.panels, { opacity: 0, x: 40, display: 'none' });
    gsap.set(this.q('.a4-head'), { opacity: 0 });
    gsap.set(this.q('.a4-hint'), { opacity: 0 });
    this.q('.a4-chip').textContent = '';
    Object.values(this.nameEls).forEach((el) => (el.style.opacity = 0));
    this.bubble.style.opacity = 0;
    this.bubble.className = 'a4-bubble anchor';
    this.doorLabel.style.opacity = 0;
    Object.values(this.badges).forEach((el) => { el.style.opacity = 0; el.classList.remove('pulse'); });
    this.qa('.a4-brain-devs span').forEach((s) => s.classList.remove('on'));
    this.brainLines.material.opacity = 0;
    this.qa('.tv-line').forEach((l) => l.classList.remove('lit'));
    this.qa('.a4-comment').forEach((c) => (c.style.opacity = 0));
    this.qa('.a4-fig, .a4-lesson, .tj-card, .a4-node, .a4-link, .a4-list li').forEach((e) => (e.style.opacity = ''));
    this.glow = { necati: 0, clement: 0, eden: 0 };
  }

  // ----------------------------------------------------------------- helpers
  chip(tl, text, at = 0) {
    const el = this.q('.a4-chip');
    tl.to(el, { opacity: 0, duration: 0.2 }, at);
    tl.call(() => { el.textContent = text; }, null, at + 0.2);
    tl.to(el, { opacity: 1, duration: 0.4 }, at + 0.2);
  }
  showPanels(tl, names, at = 0) {
    const show = this.panels.filter((p) => names.includes(p.dataset.p));
    const hide = this.panels.filter((p) => !names.includes(p.dataset.p));
    tl.to(hide, { opacity: 0, x: -30, duration: 0.45, ease: 'power2.in' }, at);
    tl.set(hide, { display: 'none' }, at + 0.46);
    tl.set(show, { display: '' }, at + 0.46);
    tl.fromTo(show, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15, immediateRender: false }, at + 0.5);
    return at + 0.5;
  }
  focusDesk(tl, id, at = 0, zoom = 2.0, dur = 1.6) {
    const p = SEATS[id].desk.clone().add(new THREE.Vector3(0, 1.2, 0.4));
    this.office.focus(tl, p, zoom, at, dur, -0.2);
  }
  overview(tl, at = 0, zoom = 1, shift = -0.14, dur = 1.6) {
    this.office.focus(tl, new THREE.Vector3(0, 0, 0), zoom, at, dur, shift);
  }
  gather(tl, at, dur = 1.6, centerId = null) {
    const ids = this.team.map((m) => m.id).filter((id) => id !== centerId);
    ids.forEach((id, k) => this.office.walkTo(tl, id, this.office.meetingSpot(k, ids.length), at + k * 0.08, dur));
    if (centerId) this.office.walkTo(tl, centerId, MEETING.clone(), at, dur, MEETING.clone().add(new THREE.Vector3(1, 0, 1)));
    tl.to(this.office.meetingRing.material, { opacity: 0.35, duration: 0.8 }, at + 0.4);
  }
  disperse(tl, at, dur = 1.6) {
    this.team.forEach((m, k) => this.office.sitDown(tl, m.id, at + k * 0.06, dur));
    tl.to(this.office.meetingRing.material, { opacity: 0, duration: 0.8 }, at + 0.3);
  }
  setBubble(tl, at, text, cls, anchorId = 'eden') {
    tl.call(() => {
      this.bubble.innerHTML = `<span>${text}</span>`;
      this.bubble.className = 'a4-bubble anchor ' + cls;
      this.bubbleItem.target = this.office.people[anchorId];
    }, null, at);
    tl.fromTo(this.bubble, { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, at + 0.01);
  }

  // ----------------------------------------------------------------- étapes
  transition(i) {
    const o = this.office;
    const d = this.data;
    const tl = gsap.timeline();
    const apply = () => o.applyColor();
    switch (this.stepIds[i]) {
      case 'reprise':
        tl.to(o.light, { v: 1, duration: 2.2, ease: 'power2.out', onUpdate: apply }, 0.2);
        tl.to(o.colorAmount, { v: 1, duration: 2.6, ease: 'power2.inOut', onUpdate: apply }, 1.0);
        DEVS.forEach((id, k) => tl.to(o.glows[id].material, { opacity: 0.55, duration: 1.2, ease: 'power2.out' }, 2.4 + k * 0.35));
        tl.call(() => { this.glow = { necati: 0.55, clement: 0.55, eden: 0.55 }; }, null, 3.6);
        tl.to(Object.values(this.nameEls), { opacity: 1, duration: 0.8, stagger: 0.12 }, 2.8);
        tl.to(this.q('.a4-head'), { opacity: 1, duration: 1 }, 2.8);
        tl.to(this.q('.a4-hint'), { opacity: 1, duration: 1 }, 4);
        break;

      case 'planning': {
        this.chip(tl, 'Sprint planning', 0);
        this.gather(tl, 0.1, 1.8, 'necati');
        this.overview(tl, 0.2, 1.25, -0.06, 2);
        // distribution des tickets
        const others = ['clement', 'eden', 'nicolas', 'catherine'];
        others.forEach((id, k) => {
          const t = o.tickets[k];
          const at = 2.3 + k * 0.45;
          const p = { k: 0 };
          let a, b;
          tl.call(() => { a = o.people.necati.position.clone().setY(1.25); b = o.people[id].position.clone().setY(1.1); t.position.copy(a); }, null, at);
          tl.to(t.material, { opacity: 1, duration: 0.15 }, at);
          tl.to(p, {
            k: 1, duration: 0.7, ease: 'power2.inOut',
            onUpdate: () => { if (!a) return; t.position.lerpVectors(a, b, p.k); t.position.y += Math.sin(p.k * Math.PI) * 0.6; t.rotation.y = p.k * Math.PI; },
          }, at + 0.01);
          tl.call(() => sound.click(0.35), null, at + 0.7);
        });
        break;
      }

      case 'poc':
        this.chip(tl, 'Le POC', 0);
        tl.to(o.tickets.map((t) => t.material), { opacity: 0, duration: 0.4 }, 0);
        this.disperse(tl, 0.1, 1.6);
        this.focusDesk(tl, 'necati', 1.2, 2.0, 1.8);
        this.showPanels(tl, ['arch'], 1.6);
        tl.fromTo(this.qa('[data-p="arch"] .a4-node, [data-p="arch"] .a4-link'), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.12, immediateRender: false }, 2.3);
        tl.to(o.glows.necati.material, { opacity: 1, duration: 0.6, yoyo: true, repeat: 1 }, 2.2);
        break;

      case 'clement':
        this.chip(tl, 'Relais → Clément', 0);
        this.focusDesk(tl, 'clement', 0, 2.0, 1.6);
        this.showPanels(tl, ['clement'], 0.3);
        tl.fromTo(this.qa('[data-p="clement"] li'), { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.25, immediateRender: false }, 1.2);
        tl.to(o.glows.clement.material, { opacity: 1, duration: 0.6, yoyo: true, repeat: 1 }, 1.0);
        break;

      case 'daily':
        this.chip(tl, 'Daily · 15 min', 0);
        this.showPanels(tl, [], 0);
        this.overview(tl, 0, 1.15, -0.02, 1.4);
        this.gather(tl, 0.3, 1.3);
        tl.to({}, { duration: 1.6 }, 1.7); // le cercle tient quelques instants
        this.disperse(tl, 3.4, 1.3);
        tl.to(o.meetingRing.material, { opacity: 0, duration: 0.6 }, 3.6);
        break;

      case 'eden':
        this.chip(tl, 'Relais → Eden', 0);
        this.focusDesk(tl, 'eden', 0, 2.0, 1.6);
        this.showPanels(tl, ['eden'], 0.3);
        tl.fromTo(this.qa('[data-p="eden"] li'), { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.25, immediateRender: false }, 1.2);
        tl.to(o.glows.eden.material, { opacity: 1, duration: 0.6, yoyo: true, repeat: 1 }, 1.0);
        break;

      case 'nicolas': {
        this.chip(tl, 'Le pont métier', 0);
        this.showPanels(tl, [], 0);
        o.focus(tl, new THREE.Vector3(1.5, 0.5, -1.5), 1.35, 0, 1.6, -0.02);
        this.setBubble(tl, 0.8, d.nicolas.question, 'question');
        tl.call(() => (this.glow.eden = 0.15), null, 0.8);
        tl.to(o.glows.eden.material, { opacity: 0.15, duration: 0.5 }, 0.8);
        // Nicolas part vers la porte CFL
        tl.to(o.doorFrame.material, { opacity: 0.8, duration: 0.6 }, 1.4);
        tl.to(o.doorPane.material, { opacity: 0.12, duration: 0.6 }, 1.4);
        tl.to(this.doorLabel, { opacity: 1, duration: 0.6 }, 1.5);
        o.walkTo(tl, 'nicolas', DOOR.clone().add(new THREE.Vector3(0, 0, 0.9)), 1.6, 2.6, DOOR.clone().add(new THREE.Vector3(0, 0, -5)));
        tl.to(o.doorPane.material, { opacity: 0.35, duration: 0.3, yoyo: true, repeat: 1 }, 4.4);
        // retour avec la réponse
        o.walkTo(tl, 'nicolas', SEATS.eden.desk.clone().add(new THREE.Vector3(1.5, 0, 1.2)), 5.4, 2.2, o.seatPos('eden'));
        tl.to(this.bubble, { opacity: 0, duration: 0.3 }, 7.5);
        this.setBubble(tl, 7.8, d.nicolas.answer, 'answer');
        tl.to(o.glows.eden.material, { opacity: 0.55, duration: 0.8 }, 8.0);
        tl.call(() => (this.glow.eden = 0.55), null, 8.0);
        tl.to([o.doorFrame.material, o.doorPane.material], { opacity: 0, duration: 1 }, 7.6);
        tl.to(this.doorLabel, { opacity: 0, duration: 1 }, 7.6);
        break;
      }

      case 'revue':
        this.chip(tl, 'Revue de code', 0);
        tl.to(this.bubble, { opacity: 0, duration: 0.4 }, 0);
        o.sitDown(tl, 'nicolas', 0.1, 2.0);
        o.walkTo(tl, 'clement', SEATS.necati.desk.clone().add(new THREE.Vector3(1.0, 0, 1.25)), 0.3, 1.6, SEATS.necati.desk.clone());
        this.focusDesk(tl, 'necati', 0.4, 1.7, 1.6);
        this.showPanels(tl, ['review'], 1.0);
        this.qa('.a4-comment').forEach((c, k) => {
          const line = this.qa('.tv-line.flag')[k];
          tl.call(() => line?.classList.add('lit'), null, 2.2 + k * 0.9);
          tl.to(c, { opacity: 1, duration: 0.5 }, 2.25 + k * 0.9);
        });
        break;

      case 'cerveau': {
        this.chip(tl, 'Le cerveau commun', 0);
        o.sitDown(tl, 'clement', 0, 1.6);
        this.overview(tl, 0.2, 1.1, -0.14, 1.6);
        this.showPanels(tl, ['brain'], 0.4);
        // Eden améliore la skill…
        tl.to(this.badges.eden, { opacity: 1, duration: 0.3 }, 2.0);
        tl.call(() => { this.badges.eden.classList.add('pulse'); this.q('[data-dev="eden"]').classList.add('on'); sound.click(0.5); }, null, 2.0);
        tl.to(o.glows.eden.material, { opacity: 1.2, duration: 0.3 }, 2.0);
        // …et elle apparaît instantanément chez les deux autres
        tl.set(this.brainLines.material, { opacity: 0.7 }, 3.0);
        tl.set([this.badges.necati, this.badges.clement], { opacity: 1 }, 3.0);
        tl.call(() => {
          ['necati', 'clement'].forEach((id) => { this.badges[id].classList.add('pulse'); this.q(`[data-dev="${id}"]`).classList.add('on'); });
          sound.click(0.8);
        }, null, 3.0);
        tl.to([o.glows.necati.material, o.glows.clement.material], { opacity: 1.2, duration: 0.15 }, 3.0);
        tl.to(DEVS.map((id) => o.glows[id].material), { opacity: 0.55, duration: 1.4 }, 3.4);
        tl.to(this.brainLines.material, { opacity: 0.25, duration: 2 }, 3.6);
        break;
      }

      case 'catherine':
        this.chip(tl, 'Le cadre', 0);
        tl.to(Object.values(this.badges), { opacity: 0, duration: 0.5 }, 0);
        tl.to(this.brainLines.material, { opacity: 0, duration: 0.5 }, 0);
        this.focusDesk(tl, 'catherine', 0, 1.6, 1.6);
        this.showPanels(tl, ['board', 'gauges'], 0.3);
        tl.fromTo(this.qa('.tj-card'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07, immediateRender: false }, 1.0);
        tl.fromTo(this.qa('.a4-g-bar'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out', immediateRender: false }, 1.4);
        break;

      case 'review':
        this.chip(tl, 'Sprint review', 0);
        this.showPanels(tl, ['figures'], 0);
        this.gather(tl, 0.1, 1.8);
        this.overview(tl, 0.1, 1.15, -0.2, 1.8);
        tl.fromTo(this.qa('.a4-fig'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.3, ease: 'power3.out', immediateRender: false }, 1.6);
        break;

      case 'lecons':
        this.chip(tl, 'Leçons apprises', 0);
        this.showPanels(tl, ['lessons'], 0);
        tl.to(o.light, { v: 0.35, duration: 1.4, onUpdate: apply }, 0);
        tl.to(Object.values(this.nameEls), { opacity: 0, duration: 0.6 }, 0);
        this.disperse(tl, 0.2, 1.6);
        tl.fromTo(this.qa('.a4-lesson'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.35, ease: 'power3.out', immediateRender: false }, 0.6);
        break;
    }
    return tl;
  }

  // ------------------------------------------------------------- interactions
  onKey(e) {
    if (e.key === 'w' || e.key === 'W') { this.wall.toggle(); return true; }
    if (this.wall.open) {
      if (e.key === 'Escape') { this.wall.close(); return true; }
      if (e.key === 'e' || e.key === 'E') { this.wall.toggleSpread(); return true; }
    }
    return false;
  }
  onClick(pt, ev) {
    if (this.wall.open) return this.wall.onClick(ev);
    // clic sur un écran de poste → mur de sessions
    const ndc = new THREE.Vector2((pt.x / 1920) * 2 - 1, -(pt.y / 1080) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.office.camera);
    const targets = Object.values(this.office.desks);
    const hits = this.raycaster.intersectObjects(targets, true);
    if (hits.length) { this.wall.show(); return true; }
    return false;
  }
  onGesture(g) {
    if (g.type === 'open') this.wall.toggle();
    if (this.wall.open) this.wall.onGesture(g);
    else if (g.type === 'rotate') { this.office.rig.orbit += g.dx * 2; this.office.updateCamera(); }
  }

  update(t, dt) {
    this.office.update(t, dt);
    // pause vivante : respiration discrète des lueurs Claude
    DEVS.forEach((id, k) => {
      const base = this.glow?.[id] || 0;
      const m = this.office.glows[id].material;
      if (base > 0 && !gsap.isTweening(m)) m.opacity = base + Math.sin(t * 1.4 + k) * 0.08;
    });
    this.wall.update(t, dt);
  }
}

// coloration syntaxique ABAP minimaliste (apparence VS Code)
function hl(src) {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/('[^']*')/g, '<i class="s">$1</i>')
    .replace(/\b(CLASS|IMPLEMENTATION|ENDCLASS|METHOD|ENDMETHOD|READ|ENTITIES|OF|IN|LOCAL|MODE|ENTITY|FIELDS|WITH|CORRESPONDING|RESULT|DATA|LOOP|AT|INTO|WHERE|IS|INITIAL|APPEND|VALUE|TO|ENDLOOP|SELECT|SINGLE|FROM)\b/g, '<i class="k">$1</i>');
}
