// Vérification de bout en bout : lance la présentation dans Chromium (Playwright),
// joue toutes les étapes au clavier, vérifie l'absence d'erreurs et capture chaque étape.
// Usage : npm run build && npx vite preview --port 4173 & node scripts/verify.mjs [url] [dossier-captures]
import { createRequire } from 'node:module';
// Playwright n'est pas une dépendance du projet : on utilise celui installé sur la machine
// (npm i -g playwright, ou npx playwright install chromium).
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'verify-shots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.addInitScript(() => localStorage.setItem('hc-help-seen', '1'));
await page.goto(url);
await page.waitForFunction(() => window.__engine);
const total = await page.evaluate(() => window.__engine.total);
console.log('étapes :', total);

const wait = (ms) => page.waitForTimeout(ms);
for (let i = 0; i < total; i++) {
  const st = await page.evaluate(() => window.__engine.state().current);
  await wait(i === 0 ? 3500 : 300);
  // on laisse jouer l'animation de l'étape (accélérée côté timeline)
  await page.evaluate(() => { const tl = window.__engine.tl; if (tl) tl.timeScale(3); });
  await wait(4000);
  await page.screenshot({ path: `${out}/${String(i + 1).padStart(2, '0')}-${st.actNumber}-${st.id}.png` });
  console.log(`${i + 1}/${total}  acte ${st.actNumber}  ${st.id}`);
  if (i < total - 1) await page.keyboard.press('ArrowRight');
}

// retour arrière, sauts d'acte, redémarrage, écran noir, mute
for (const k of ['ArrowLeft', 'ArrowLeft', '3', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'r', '4', 'w', 'e', 'w', '2', 'b', 'b', 'm', 'm', '1', '5']) {
  await page.keyboard.press(k);
  await wait(250);
}
const final = await page.evaluate(() => window.__engine.state().current.id);
console.log('après navigation :', final);

await browser.close();
if (errors.length) {
  console.error('\nERREURS :\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nOK — aucune erreur, ' + total + ' étapes jouées.');
