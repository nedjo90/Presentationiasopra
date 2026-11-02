# Charte Sopra Steria — fichiers officiels

Ce dossier accueille les fichiers officiels de la charte.

| Fichier | Origine | Usage |
|---|---|---|
| `logo-soprasteria.svg` | Extrait tel quel de https://www.soprasteria.com (`/ResourcePackages/Bootstrap4/assets/dist/logos/logo-soprasteria.svg`) | Fond clair |
| `logo-soprasteria-negatif.svg` | Même fichier, logotype passé de `#231F20` à `#FFFFFF` | Fond noir (utilisé par la présentation) |
| `fonts/` | **vide** — à remplir | Polices officielles |

## Polices officielles

Le site utilise **Hurme Geometric Sans 3 / 4** (texte) et **Albra Display** (titres éditoriaux).
Ce sont des polices commerciales : elles ne sont pas redistribuées dans ce dépôt public.
Si vous disposez de la licence, déposez les fichiers ici :

```
public/brand/fonts/HurmeGeometricSans3-Regular.woff2
public/brand/fonts/HurmeGeometricSans3-Bold.woff2
public/brand/fonts/HurmeGeometricSans4-SemiBold.woff2
```

Ils sont déclarés dans `src/theme/theme.css` et seront utilisés automatiquement ;
sinon la présentation retombe sur **Outfit** (géométrique, libre, embarquée hors ligne).

Pour remplacer toute la charte en une fois : modifier uniquement `src/theme/theme.css`.
