// Lit les variables de src/theme/theme.css pour les effets dessinés en JS
// (Three.js, canvas). Une seule source de vérité : le fichier CSS.
import * as THREE from 'three';

const BASE = import.meta.env.BASE_URL || './';

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function color(name) {
  const v = cssVar(name);
  return new THREE.Color(v || '#ff00ff');
}

export function hex(name) {
  return '#' + color(name).getHexString();
}

// Résout une URL déclarée dans le thème (url('/brand/x.svg')) en tenant compte
// du chemin de déploiement (GitHub Pages).
export function themeUrl(name) {
  const raw = cssVar(name).replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
  return asset(raw.replace(/^(\.\.?\/)+/, ''));
}

export function asset(path) {
  return (BASE.endsWith('/') ? BASE : BASE + '/') + path.replace(/^\//, '');
}

export function logoImg(className = 'logo') {
  const img = document.createElement('img');
  img.src = themeUrl('--logo-on-dark');
  img.alt = 'Sopra Steria';
  img.className = className;
  return img;
}
