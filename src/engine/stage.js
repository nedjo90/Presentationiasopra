// Scène logique 1920×1080 (16:9), mise à l'échelle et centrée dans la fenêtre.
export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function setupStage(onResize) {
  const stage = document.getElementById('stage');
  let scale = 1;
  function fit() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    scale = Math.min(w / STAGE_W, h / STAGE_H);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    onResize?.(scale);
  }
  window.addEventListener('resize', fit);
  fit();
  return {
    el: stage,
    get scale() { return scale; },
    // coordonnées fenêtre → coordonnées scène
    toStage(clientX, clientY) {
      const r = stage.getBoundingClientRect();
      return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
    },
  };
}
