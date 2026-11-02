// Vérifie src/content/content.json après modification (npm run check).
import { readFileSync } from 'node:fs';

const EXPECTED = {
  avant: ['titre', 'bureau', 'indicateurs', 'extinction'],
  bascule: ['ecrans', 'pluie', 'terminal', 'hello', 'bonjour', 'question', 'reponse'],
  preparation: null, // noyau + m-<id module> + rotation
  sprint: ['reprise', 'planning', 'poc', 'clement', 'daily', 'eden', 'nicolas', 'revue', 'cerveau', 'catherine', 'review', 'lecons'],
  omt: ['noir', 'omt', 'app', 'livrables', 'final'],
};

let c;
try {
  c = JSON.parse(readFileSync(new URL('../src/content/content.json', import.meta.url), 'utf8'));
} catch (e) {
  console.error('✗ content.json illisible :', e.message);
  process.exit(1);
}
const errs = [];
const ids = (c.acts || []).map((a) => a.id);
if (ids.join() !== Object.keys(EXPECTED).join()) errs.push(`actes attendus : ${Object.keys(EXPECTED).join(', ')} — trouvés : ${ids.join(', ')}`);
for (const act of c.acts || []) {
  let exp = EXPECTED[act.id];
  if (act.id === 'preparation') exp = ['noyau', ...act.modules.map((m) => 'm-' + m.id), 'rotation'];
  const got = act.steps.map((s) => s.id);
  if (exp && got.join() !== exp.join()) errs.push(`acte « ${act.id} » : étapes attendues ${exp.join(', ')} — trouvées ${got.join(', ')}`);
  act.steps.forEach((s) => { if (!s.title) errs.push(`acte ${act.id}, étape ${s.id} : titre manquant`); });
}
const team = (c.team || []).map((m) => m.id).sort().join();
if (team !== 'catherine,clement,eden,necati,nicolas') errs.push('team : les identifiants necati, catherine, nicolas, clement, eden sont requis (ils pilotent la scène 3D)');
const fictif = JSON.stringify(c).match(/\[FICTIF\]/g)?.length || 0;

if (errs.length) {
  console.error('✗ ' + errs.join('\n✗ '));
  process.exit(1);
}
console.log(`✓ content.json valide — ${c.acts.reduce((n, a) => n + a.steps.length, 0)} étapes, ${fictif} placeholder(s) [FICTIF] restant(s).`);
