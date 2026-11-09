# Astéria — Les gardiens du savoir

**Version 3.0.0 · La vallée des inventeurs.** Une aventure voxel en français pour explorer, bâtir et résoudre des problèmes dans le monde.

**[Jouer dans le navigateur](https://tnnmy4vbp6-creator.github.io/asteria/)** · [Code source](https://github.com/tnnmy4vbp6-creator/asteria) · [Nouveautés](CHANGELOG.md)

## Pour la famille

**Bâtir un village** ouvre la nouvelle vallée : trois bâtiments à construire sur le
terrain, des habitants qui s'y déplacent, des cultures, des réserves et des échanges.
La maison abrite, la serre produit, le dépôt augmente le stockage. Les expéditions
font manipuler cargaisons, itinéraires anglais parlés, strates géologiques, canaux
et messages. Préparer la veillée demande un abri, une couverture lumineuse et un
circuit de porte. **84 variantes**, trois paliers et des indices sont disponibles.
Les voix sont locales et les découvertes alimentent le carnet. [Parcours et limites](docs/VALLEE-DES-INVENTEURS.md).

Pour commencer : ouvrir le lien, toucher **Bâtir un village**, puis **Rencontrer
Mila**. L'atelier permet de poser des blocs, rangées et contours directement sur le
terrain. Le journal **◈** regroupe les chantiers, les cultures, le marché et les
destinations. Les anciennes aventures restent accessibles depuis l'accueil.

**Le hameau à sauver** ouvre une histoire continue : assembler un passage avec quatre cubes et quatre demi-blocs, orienter les quatre prismes du toit de la réserve, puis rétablir un signal symétrique. Les pièces se touchent directement dans le décor ; le chariot, l’eau et la lumière montrent le résultat. Les réparations restent dans le monde. Les indices et la lecture à voix haute sont disponibles. La construction libre conserve **16 matériaux, 7 formes et 9 motifs**, rotation, aperçu et annulation.

La carte indique quatre nouveaux lieux : parc des géomètres, atelier du charpentier, carrière exploitable et verger symétrique. Les boutons de la carte permettent de les rejoindre. Les emplacements alternatifs évitent de remplacer les constructions d’anciennes parties. [Détails et limites de la construction](docs/BATISSEURS.md).

**Portail & dragon** ouvre les **Îles de braise**, un second monde de 80 × 80 blocs. Le pont demande de calculer puis poser six rangées, la forge demande de combiner des débits, les balises se suivent en anglais. Dans la forteresse, trois épreuves de grammaire, sciences et problèmes chargent les rayons du duel. Sortir du cercle orange, viser le dragon lorsque son bouclier devient turquoise, puis toucher la main. Le mode accompagné, activé au départ, supprime les dégâts du souffle et élargit la visée. La difficulté du problème final suit le réglage du menu.

Le chapitre est accessible dès maintenant avec le passage prêté par Atlas, ainsi que depuis le portail du village ou le journal des quêtes. Le journal permet de rentrer ou de rejoindre le dernier passage sûr. Les constructions des deux mondes et les étapes du chapitre sont enregistrées séparément. Après un rechargement dans les îles, le personnage reprend au dernier passage sûr. La récompense finale est versée une seule fois.

**Jouer et apprendre** ouvre six commandes de village. Touchez **Rejoindre** puis la main face au personnage. Chaque commande mêle six matières. Les réponses et les explications restent dans le carnet et les essais apparaissent dans l’espace parent. Dans l’atelier, **Préparer 2 lots** permet de doubler une vraie recette avec ses matériaux.

Depuis l’accueil, **Explorer le temple** ouvre le chapitre des éclipses. Suivre le rayon doré et utiliser la main pour faire pivoter les miroirs. Lorsque la porte s’ouvre, entrer dans le planétaire. La lunette permet de vérifier l’alignement des astres. La boussole obtenue révèle les coffres anciens sur la grande carte. Depuis une partie en cours, l’accès se trouve aussi dans le journal des quêtes.

Ouvrir le lien sur la tablette en paysage et toucher **Commencer l’aventure**. Zoé porte une casquette brune, juste à côté du point de départ. Le pouce gauche déplace le personnage ; glisser sur le décor à droite oriente la caméra. La main sert à parler et à utiliser un mécanisme.

Dans Safari sur iPad, ouvrir le menu de partage puis **Sur l’écran d’accueil**. Dans Chrome sur Android, ouvrir le menu puis **Installer l’application** ou **Ajouter à l’écran d’accueil** selon la version du navigateur. Une première visite en ligne doit laisser le jeu charger ses ressources avant de jouer hors connexion.

L’accueil permet de choisir trois profils. Chaque profil a une aventure et un monde créatif. Le menu de pause contient l’espace parent et l’export/import. Pour reprendre une ancienne partie ouverte à une autre adresse, exporter depuis cette ancienne adresse puis importer le fichier ici. Le premier profil Aventure sait relire la sauvegarde V2 sur la même origine.

## Développer et tester

Node.js 22 ou 24, npm et Git.

```sh
npm ci
npm test
npm run build
npm start
```

Ouvrir http://localhost:8767/. Le serveur local écoute uniquement sur la boucle locale. La distribution de production est dans `dist/`. Tous les fichiers du jeu sont servis sur la même origine. Un changement de code ou de média change l’identifiant du cache lors du prochain build. Fermer les fenêtres du jeu puis rouvrir l’application pour activer une mise à jour mise en attente.

Pour tester le navigateur, installer Chrome. Pour le second moteur, exécuter `npx playwright-core install webkit`. Le jeu doit être servi avant de lancer ces scénarios.

```sh
node test-browser.cjs http://localhost:8767/ chrome
node test-browser.cjs http://localhost:8767/ webkit
node test-journey.cjs http://localhost:8767/
node test-ember.cjs chrome http://localhost:8767/
node test-ember.cjs webkit http://localhost:8767/
node test-builder.cjs chrome http://localhost:8767/
node test-builder.cjs webkit http://localhost:8767/
```

## Organisation

| Module | Responsabilité |
|---|---|
| content/*.json, content.cjs | données éditables et génération du script de contenu. Les positions de l’encyclopédie sont des identifiants de sauvegarde ; ajouter les nouvelles questions en fin de liste |
| shapes.js, builder.js | formes solides, collisions, palette, motifs, chantiers et nouveaux lieux |
| data.js, profiles.js | état, recettes, validation des imports, sauvegarde et profils |
| engine.js, tablet.js, batching.js | terrain et collisions, mouvement, joystick, distance de rendu, regroupement de géométries |
| mill.js, learning.js, field.js | moulin et vanne, livraisons et révisions, espace parent, observations de terrain |
| ui.js, main.js, style.css, shell.html | dialogues, artisanat, carnet, commandes et démarrage |
| fauna.mjs, media.js, assets/, licenses/ | renards animés, atlas, bruitages, musique et attributions |
| build.cjs, worker.js, manifest.webmanifest | distribution statique, cache par contenu et installation |
| test-*.cjs, TESTING.md | scénarios automatisés, résultats et validation restante |

Le monde brut de 80 × 80 est encore résident en mémoire CPU. Les maillages GPU sont créés et libérés selon la position et le profil graphique. La sauvegarde garde les changements par rapport au terrain initial.

## Publier une mise à jour

La branche `main` contient les sources. GitHub Pages sert la distribution depuis `gh-pages`. Après avoir poussé les sources validées, `npm run publish:pages` relance les tests, produit le site et pousse le résultat dans cette branche sans écraser son historique. Vérifier le déploiement GitHub et relancer les deux scénarios navigateur avec l’URL publique.

Le [workflow fourni](docs/workflows/pages.yml) automatise ces opérations depuis `main`. Son activation exige le droit GitHub `workflow`, le fichier dans `.github/workflows/pages.yml` et **Settings → Pages → GitHub Actions** comme source. [Guide officiel GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Documents de production

[Audit noté de la V2](docs/AUDIT.md) · [Vision et feuille de route](GAME_DESIGN.md) · [Conception pédagogique](EDUCATION_DESIGN.md) · [Tests et protocole enfant](TESTING.md) · [Provenance des médias](ASSETS.md)

