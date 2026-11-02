// Sons discrets synthétisés (WebAudio) : aucun fichier, fonctionne hors ligne.
// Coupables avec la touche M.
let ac = null;
let master = null;
let muted = false;
let silent = false; // vrai pendant les reconstructions instantanées d'étapes

function ensure() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.55;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function noiseBuffer(dur) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  return buf;
}

function canPlay() {
  return !muted && !silent && ensure();
}

export const sound = {
  unlock() { ensure(); },
  get muted() { return muted; },
  toggleMute() { muted = !muted; return muted; },
  setMuted(v) { muted = v; },
  setSilent(v) { silent = v; },

  // Déclic mécanique : transitoire de bruit filtré + petite résonance métallique
  click(vol = 1) {
    if (!canPlay()) return;
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(0.05);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 2.5;
    const g = ac.createGain(); g.gain.value = 0.9 * vol;
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    const o = ac.createOscillator();
    o.type = 'triangle'; o.frequency.setValueAtTime(1850, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.18 * vol, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og).connect(master); o.start(t); o.stop(t + 0.13);
  },

  // Frappe clavier : très court, légèrement aléatoire
  key(vol = 1) {
    if (!canPlay()) return;
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(0.025);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1800 + Math.random() * 1400;
    const g = ac.createGain(); g.gain.value = 0.35 * vol;
    src.connect(hp).connect(g).connect(master);
    src.start(t);
  },

  // Allumage d'écran : souffle grave très court
  power(vol = 1) {
    if (!canPlay()) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.25);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25 * vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.42);
  },
};
