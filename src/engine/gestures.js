// Gestes (optionnels) via MediaPipe Hands et la webcam.
// Réservés aux moments « waouh » : aucun geste ne fait avancer la présentation.
//  - main ouverte qui se déplace horizontalement → { type: 'rotate', dx }
//  - pincement pouce/index qui varie            → { type: 'zoom', dz }
//  - deux mains qui s'écartent                   → { type: 'spread', amount } (0..1)
//  - main ouverte immobile 1 s                   → { type: 'open' }
import { asset } from '../theme/theme.js';

export class Gestures {
  constructor(ctx, onGesture, onToggle) {
    this.ctx = ctx;
    this.onGesture = onGesture;
    this.onToggle = onToggle;
    this.enabled = false;
    this.landmarker = null;
    this.video = null;
    this.prev = null;
    this.still = 0;
  }

  async toggle() {
    if (this.enabled) return this.stop();
    try {
      await this.start();
    } catch (e) {
      console.warn('[gestes] indisponibles :', e);
      this.enabled = false;
      this.onToggle(false);
    }
  }

  async start() {
    const vision = await import('@mediapipe/tasks-vision');
    if (!this.landmarker) {
      const fileset = await vision.FilesetResolver.forVisionTasks(asset('mediapipe/wasm'));
      this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: asset('mediapipe/hand_landmarker.task'), delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
    this.video = document.createElement('video');
    this.video.className = 'gesture-cam';
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = stream;
    document.body.appendChild(this.video);
    await this.video.play();
    this.enabled = true;
    this.onToggle(true);
    this.loop();
  }

  stop() {
    this.enabled = false;
    this.video?.srcObject?.getTracks().forEach((t) => t.stop());
    this.video?.remove();
    this.video = null;
    this.onToggle(false);
  }

  loop = () => {
    if (!this.enabled) return;
    if (this.video.readyState >= 2) {
      const res = this.landmarker.detectForVideo(this.video, performance.now());
      this.interpret(res.landmarks || []);
    }
    requestAnimationFrame(this.loop);
  };

  interpret(hands) {
    if (hands.length === 2) {
      const a = hands[0][9], b = hands[1][9];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      this.onGesture({ type: 'spread', amount: Math.max(0, Math.min(1, (dist - 0.15) / 0.5)) });
      this.prev = null;
      return;
    }
    if (hands.length !== 1) { this.prev = null; this.still = 0; return; }
    const h = hands[0];
    const palm = h[9];
    const pinch = Math.hypot(h[4].x - h[8].x, h[4].y - h[8].y);
    const open = pinch > 0.12;
    if (this.prev) {
      const dx = -(palm.x - this.prev.x); // image miroir
      const dz = pinch - this.prev.pinch;
      if (open && Math.abs(dx) > 0.004) this.onGesture({ type: 'rotate', dx });
      if (!open || Math.abs(dz) > 0.01) this.onGesture({ type: 'zoom', dz });
      if (open && Math.abs(dx) < 0.003) {
        this.still += 1;
        if (this.still === 30) this.onGesture({ type: 'open' });
      } else this.still = 0;
    }
    this.prev = { x: palm.x, pinch };
  }
}
