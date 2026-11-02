# Hello, Claude — présentation immersive

Présentation web pilotée en direct par le présentateur (Necati Han, Sopra Steria) :
un projet SAP full stack réel pour **CFL**, réalisé en équipe Scrum avec **Claude Code**.

5 actes · 38 étapes · ≈ 25–30 min · Vite + Three.js + GSAP · 16:9 · hors ligne.

> « Avant, il fallait que ça marche. Aujourd'hui, il faut que ça marche bien, vite,
> et avec une qualité qu'on n'a jamais délivrée. »

---

## Lancer

```bash
npm install      # une seule fois (copie aussi les fichiers des gestes)
npm start        # ouvre la présentation dans le navigateur
```

Version « salle » (fichiers optimisés, sans serveur de dev) :

```bash
npm run build && npm run serve
```

Une fois `npm install` fait, **aucun accès réseau n'est nécessaire** : polices, sons
(synthétisés), modèle de gestes et logo sont embarqués.

Pour **reprendre à une étape précise** (répétition) : ajouter `#N` à l'adresse,
par ex. `http://localhost:5173/#22` (étape 22 = début de l'acte 4).

## Contrôles

| Touche | Action |
|---|---|
| **→**, **Page Down**, **Espace**, **Entrée**, clic télécommande, clic souris | étape suivante |
| **←**, **Page Up**, clic droit | étape précédente |
| *Téléphone / tablette* : tap ou balayage vers la gauche / balayage vers la droite | suivante / précédente (tenir l'appareil à l'horizontale) |
| **1** à **5** | saut direct au début d'un acte (secours) |
| **R** | redémarrer l'acte en cours |
| **B** (ou **.**, touche « écran noir » des télécommandes) | écran noir — l'étape suivante le retire |
| **M** | couper / rétablir le son |
| **P** | ouvrir la vue présentateur |
| **F** | plein écran |
| **G** | activer / désactiver les gestes (webcam) |
| **H** ou **?** | aide des contrôles |
| **O** (acte 3) | ouvrir l'exemple concret du dernier module posé (ou clic sur un module) |
| **W** (acte 4) | mur de sessions (ou clic sur un poste) — dans le mur : clic = agrandir, **E** = écarter, **Échap** = fermer |

Règle d'or : **rien n'avance sans le clic**. Chaque étape joue son animation puis reste
en « pause vivante » (micro-animations en boucle) jusqu'au clic suivant. Si on clique
pendant une animation, elle se termine instantanément et l'étape suivante démarre.
Le retour arrière et les sauts reconstruisent l'état exact de l'étape.

## Vue présentateur

Touche **P** dans la fenêtre principale (ou ouvrir `presenter.html` dans le même navigateur).
Elle affiche, synchronisés via `BroadcastChannel` :

- le **speech** et les notes de l'étape en cours (les moments de silence sont en italique) ;
- un **aperçu réel de l'étape suivante** (mini-rendu en direct) et son speech ;
- le **numéro d'étape**, l'acte, et un **chrono** (démarre au premier clic, objectif 28 min, passe en rouge au-delà ; ↺ pour le remettre à zéro) ;
- des boutons de secours (précédent / suivant, actes, noir, son, gestes).

La télécommande fonctionne quelle que soit la fenêtre qui a le focus.
Configuration conseillée : écran étendu, fenêtre principale en plein écran (**F**) sur le
grand écran, vue présentateur sur le laptop.

## Modifier le contenu — `src/content/content.json`

Tous les textes, noms, chiffres, extraits de code et speechs sont dans ce fichier.
Le code n'a pas à être modifié.

- `meta` : titre, présentateur, client, durée cible (chrono).
- `team` : les cinq personnages. Les `id` (`necati`, `catherine`, `nicolas`, `clement`, `eden`) pilotent la scène 3D : ne pas les changer ; les noms, rôles et contributions oui.
- `acts[].steps[]` : pour chaque étape, `title`, `speech` (affiché dans la vue présentateur) et `notes`. **Ne pas changer les `id`** (ils sont liés aux animations).
- Acte 1 : textes d'ouverture, indicateurs, deadline.
- Acte 2 : les répliques du terminal.
- Acte 3 : les 8 modules (`label`, `sub`, et l'exemple montré dans le panneau : `example.lines`).
- Acte 4 : architecture, relais, question/réponse de Nicolas, revue de code, skill, board Jira, jauges, **chiffres** (`figures`), **leçons apprises** (`lessons`).
- Acte 5 : application (mail, champs, workflow), **livrables**, phrase finale (`final.highlights` = mots mis en couleur).
- `code` : faux code (ABAP, CDS, CAP, UI5) utilisé par la pluie de code.
- `sessionWall` : panneaux du mur de sessions (`highlight` = numéros de lignes, base 0, qui s'illuminent).

Tout texte contenant **`[FICTIF]`** est un placeholder : il s'affiche à l'écran avec un petit
badge « FICTIF » pour être repéré en répétition. Supprimer la mention fait disparaître le badge.

Après modification : `npm run check` vérifie la structure et compte les placeholders restants.

### Démo finale (acte 5)

Déposer la vidéo de l'application réelle dans **`public/media/demo.mp4`**.
Si elle est présente, elle est jouée (en boucle, muette) à l'étape « L'application » ;
sinon une simulation animée (mail → lecture → workflow) la remplace.

## Charte graphique — `src/theme/theme.css`

**Un seul fichier** centralise couleurs, polices et logo. Les effets 3D et la pluie de code
lisent ces mêmes variables : changer une valeur change toute la présentation.

Les valeurs ont été **extraites du site officiel https://www.soprasteria.com** (novembre 2026) :

| Élément | Valeur | Source |
|---|---|---|
| Rouge (symbole) | `#DE1823` | logo officiel du site |
| Orange (symbole) | `#F67200` | logo officiel du site |
| Gris logotype | `#231F20` | logo officiel du site |
| Violet profond | `#2A1449` | `style-ssg.css` (couleur la plus utilisée) |
| Rouge foncé / vif | `#A60726` / `#E4302D` | `style-ssg.css` |
| Orange web, prune, lavande | `#EF7D00`, `#8B1D82`, `#9179B1` | `style-ssg.css` |
| Police | Hurme Geometric Sans 3 / 4 | `style-ssg.css` |

Fichiers officiels : dossier **`public/brand/`** (voir son README) — logo d'origine et
sa version négative (logotype blanc) pour fond noir. Les polices Hurme Geometric Sans sont
commerciales et ne sont pas redistribuées : déposer les fichiers sous licence dans
`public/brand/fonts/` et elles seront utilisées automatiquement (sinon : **Outfit**, police
géométrique libre embarquée).

Exception voulue : les écrans qui montrent l'**outillage réel** (terminal Claude Code,
VS Code, Jira, application Fiori) gardent leur apparence d'origine (variables `--tool-*`).

## Gestes (optionnels)

Touche **G** : la webcam s'active (petit retour vidéo discret en bas à droite) et
MediaPipe Hands détecte les mains, entièrement en local.

| Geste | Effet |
|---|---|
| main ouverte qui glisse à gauche / droite | fait tourner la scène (acte 3 : l'assemblage ; acte 4 : le bureau ou le mur) |
| pincement pouce-index qui varie | zoom (acte 3) |
| deux mains qui s'écartent | écarte les panneaux du mur de sessions / ouvre le panneau d'exemple (acte 3) |
| main ouverte immobile ≈ 1 s | ouvre / ferme le panneau d'exemple (acte 3) ou le mur de sessions (acte 4) |

Aucun geste ne fait avancer la présentation : la télécommande reste le moyen principal.
Le modèle (`public/mediapipe/hand_landmarker.task`) est versionné ; les fichiers WASM sont
copiés depuis `node_modules` par `npm install`. La webcam demande une page servie en
`localhost` ou en HTTPS (c'est le cas avec `npm start`, `npm run serve` et GitHub Pages).

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie automatiquement à chaque
push sur `main`. À faire une fois : *Settings → Pages → Source : GitHub Actions*.
Les chemins sont relatifs (`base: './'`) : le dossier `dist/` fonctionne sous n'importe
quel sous-chemin.

## Vérification automatique

```bash
npm run build && npx vite preview --port 4173 &
npm run verify           # nécessite Playwright installé sur la machine
```

Le script joue les 38 étapes au clavier dans Chromium, capture chaque écran dans
`verify-shots/`, puis teste retour arrière, sauts d'acte, redémarrage, écran noir, son,
mur de sessions — et échoue à la moindre erreur JavaScript.

## Structure

```
index.html / presenter.html     fenêtre principale / vue présentateur
src/content/content.json        TOUT le contenu (textes, speechs, chiffres, code)
src/theme/theme.css             TOUTE la charte (couleurs, polices, logo)
src/engine/                     moteur d'étapes, sons, étiquettes 3D, gestes, HUD
src/scenes/office.js            bureau isométrique (actes 1, 4, 5)
src/acts/act1..5.js             les cinq actes ; sessionWall.js = mur de sessions
public/brand/                   fichiers officiels de la charte
public/media/                   vidéo de démo (à fournir)
scripts/                        vérification du contenu, test de bout en bout, setup gestes
```

Principe du moteur : chaque acte décrit ses étapes comme des transitions GSAP
(`transition(i)` : de la fin de l'étape i-1 à la fin de l'étape i). Jouer une étape =
lancer sa transition ; revenir ou sauter = réinitialiser l'acte et appliquer
instantanément toutes les transitions jusqu'à l'étape voulue.

---

## Choix faits

Décisions prises là où le cahier des charges laissait un détail ouvert :

1. **Écran d'ouverture** ajouté en tête de l'acte 1 (titre « Hello, Claude », présentateur, logo) pour l'apparition du logo « en ouverture ». Le logo revient sous la phrase finale (clôture).
2. **Acte 2, étape 1** : les cinq écrans s'allument en **séquence automatique** (un seul clic), option prévue par le cahier des charges.
3. **Pluie de code** : ≈ 10 s d'intensité, puis une bruine vivante jusqu'au clic (pour respecter « rien n'avance sans le clic ») ; l'arrêt net est l'étape suivante.
4. **Silences des étapes 4 et 7 de l'acte 2** : interprétés comme silence du présentateur (le terminal parle seul) ; la phrase « La question, ce n'était pas… » est placée sur l'étape 5 (après la réponse de Claude).
5. **Acte 3** : 10 étapes (noyau, 8 modules, configuration complète). Le module en cours de pose est présenté en grand en bas à gauche (une idée par écran) ; les panneaux d'exemple s'ouvrent à la demande (**O**, clic ou geste) et ne comptent pas comme étapes.
6. **Acte 4** : une étape d'introduction (« Le bureau reprend vie ») précède les 11 étapes prévues ; les chiffres fictifs sont affichés à la sprint review. La « lueur Claude » est une lueur orange de la charte sur l'écran des trois développeurs.
7. **Nicolas, pont métier** : la règle tranchée est un exemple fictif (« facture sans n° de commande »).
8. **Acte 5** : les livrables apparaissent un par un **au sein d'une même étape** (enchaînement automatique, un clic).
9. **Charte** : couleurs et logo extraits du site officiel ; polices officielles commerciales non redistribuées (remplacées par Outfit tant que les fichiers ne sont pas fournis). Logo sur fond noir : version négative générée (logotype `#231F20` → blanc), symbole inchangé.
10. **Sons** synthétisés en WebAudio (déclic mécanique, frappe clavier, allumage discret) : aucun fichier, aucun réseau. Le navigateur n'autorise le son qu'après une première interaction (clic ou touche).
11. **Clic souris** = étape suivante (les télécommandes envoient en général Page Down / flèches, également gérées) ; **clic droit** = étape précédente ; **Espace/Entrée** = suivante.
12. **Bureau isométrique** : dalle flottante, volumes simples, personnages sans visage ; gris désaturé à l'acte 1, couleurs de la charte à l'acte 4 (même scène, même équipe).
13. **Code affiché** : entièrement fictif, sur le thème générique « ingestion de factures par mail » (aucun code du projet client).
14. **Vue présentateur** : l'aperçu de l'étape suivante est un vrai rendu miniature (basse résolution, 15 i/s) pour ne pas pénaliser la fenêtre principale.
15. Les placeholders `[FICTIF]` s'affichent avec un badge discret plutôt qu'en texte brut, pour rester lisibles en répétition sans casser la mise en page.
