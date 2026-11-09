# Vérification de la 3.0.0

Vérifications locales du 10 novembre 2026 :

Le scénario de plateforme a également passé sur l'URL publique de la 3.0.0 :
lecture des voix, contacts simultanés, doubles appuis, coût unique, chargement
des modèles et reprise hors ligne avec conservation des modifications.
Le parcours complet a ensuite passé sur l'URL publique finale sous Chrome et
WebKit, avec contrôle du terrain original sur ses 192 000 cellules, des trois
bâtiments, des cinq missions, de la veillée et des ressources chargées sans erreur.

- `npm test` : suites existantes et 9 nouvelles suites de règles (dimensions et quatre côtés de porte, contre-exemples, cargaisons, routes, canaux, production, navigation, nuit, adaptation et imports).
- `test-living-browser.cjs` : parcours complet par commandes tactiles sous Chrome et WebKit ; trois bâtiments, récompenses uniques, toit cassé et réparation, cinq missions, veillée, sauvegarde et retour entre mondes. Captures à 390 × 720, 844 × 390 et 1024 × 768.
- `test-living-platform.cjs` : Chrome, voix réellement en lecture, remplacement/arrêt, deux contacts simultanés (manche et caméra), remise à zéro à la pause, doubles appuis, absence de sélection/zoom, coût unique, reprise hors ligne avec modèles et narration en cache.
- Régressions Chrome : photos de bugs mobiles (noms, renard, murs, fleurs), doubles appuis et veilleurs, les trois réparations du hameau, portail et dragon.

Les tests WebKit tournent avec le son coupé : ils ne valident pas le rendu sonore Safari sur un iPhone physique. Le test de son est exécuté sous Chrome, son activé. Aucun essai sur téléphone ou tablette physique n'est revendiqué. Le workflow de qualité est fourni dans `docs/workflows/quality.yml` ; il n'est pas activé sur GitHub, les identifiants disponibles n'ayant pas le droit `workflow`.

# Vérification de la 2.7.0

`npm test` : 33 vérifications de moteur/campagne/moulin et la suite des solides passent. `test-restoration.cjs chrome` joue les trois réparations par contacts tactiles, avec essais incorrects, stock épuisé, retrait et recomposition de moitiés, orientations de toit, correspondances de solides, récompense unique et sauvegarde/reprise hors connexion. Il charge les 30 modèles Kenney (56 placements dans le profil neuf), contrôle les collisions des gros accessoires et l’absence de réponse HTTP en erreur. Les emplacements tactiles et panneaux ne se recouvrent pas à 390 × 720, 844 × 390 et 1280 × 720. Les deux scénarios de migration vérifient le site alternatif puis le refus de remplacement lorsque les deux sites sont occupés.

Le même parcours WebKit passe avec le son désactivé dans le profil de test. Le backend multimédia du WebKit Windows utilisé par le banc peut bloquer après plusieurs sons ; cela empêche de déclarer son parcours audio validé. Chrome est testé avec le son activé. Les nouveaux bruitages sont distribués en WAV PCM, avec leurs sources et transformations dans le manifeste. Ni iPad/iPhone physique ni panel d’enfants testé pour cette livraison.

Les régressions Chrome `test-mobile-regressions.cjs`, `test-touch-night.cjs`, `test-temple.cjs`, `test-ember.cjs`, `test-voyages.cjs` passent : direction et murs du renard, prénoms, ciblage des personnages, interface, double appui, veilleurs, temple, portail, dragon et 36 étapes pédagogiques. `test-builder.cjs chrome` conserve une fixture explicite de l’ancien parcours pour vérifier anciennes constructions, collisions, pose et annulation ; l’entrée publique est testée par la nouvelle suite.

Captures de référence : `.qa/restoration-chrome-bridge.png`, `-roof.png`, `-signal.png` et équivalents WebKit. Leur inspection vérifie la continuité du toit, la position des pièces et la lisibilité. Les essais du chariot et de l’eau sont des animations de résultat, pas une simulation générale de véhicules ou de fluides. Aucun objectif de fréquence d’image sur matériel mobile n’est revendiqué sans mesure sur appareil.

# Vérification de la 2.6.0

Les 33 tests de logique existants et la suite de solides passent. La suite supplémentaire vérifie 224 identifiants matériau/forme/orientation, géométries finies, normale du toit, rayons traversant le vide d’un demi-bloc, collisions, quantités des six projets et anciennes sauvegardes.

Le scénario test-builder.cjs utilise Chrome et WebKit en émulation tactile à 390 × 720 puis 844 × 390. Il contrôle l’accueil sans recouvrement, refuse une dimension invalide et un sol trop petit, annule avec remboursement, construit les six modèles via la palette et le bouton ＋, refuse une réponse fausse et vérifie une récompense unique. Il recharge les constructions, teste la hauteur réelle d’un demi-bloc avec le déplacement du joueur, la réunion de deux moitiés et son annulation, les rotations, les variantes dans la sauvegarde du second monde et la migration préservant un bloc ancien. Chrome reprend aussi une forme hors connexion. Les captures ont été inspectées : palette, parc construit, toit de l’atelier et verger.

Le port WebKit de Windows a parfois bloqué dans la commande de défilement automatique de Playwright. Le scénario fait donc défiler le vrai bouton dans le DOM puis envoie un toucher natif à son centre visible. Il n’appelle pas directement le gestionnaire de clic. Les manipulations de géométrie/collision et la mise en place de la sauvegarde ancienne sont explicites dans le scénario.

Régressions Chrome passées : temple, 36 étapes des commandes, îles/dragon, double appui nocturne, prénoms/renard/collisions/messages/fleur. Aucun essai sur tablette physique n’a été effectué dans cette session. Le contrôle de la version publique utilise le même scénario de construction.

# Vérification de la 2.2.0

`node test-touch-night.cjs webkit URL` et `node test-touch-night.cjs chrome URL` démarrent une partie en portrait à 390 × 695. Six appuis successifs sur l’inventaire doivent laisser le zoom à 100 % et la sélection vide. Chrome exerce aussi l’appui prolongé. Après un passage par le menu, deux appuis sur Construire doivent poser deux blocs. Le scénario vérifie la poursuite du veilleur, la coupure de sa ligne de vue, sa réaction à une torche posée, sa hauteur sur le sol et son absence en journée, en créatif et en mode paisible. Les navigateurs utilisent une émulation tactile sur ordinateur.

# Vérification de la 2.1.2

Le scénario `test-atlas-upgrade.cjs` démarre un serveur avec la distribution publiée 2.1.0 (commit 5be2f2b de gh-pages), attend que son service worker contrôle la page, puis enregistre une partie devant Atlas au crépuscule avec la quête de Borin et des quantités connues de bois et de planches. Il remplace la distribution sur la même origine, suit le nouveau lien dans le même onglet et contrôle le prénom, sa taille effective, le cadrage et la progression conservée. Il recharge enfin la page hors connexion. Exécuter avec `node test-atlas-upgrade.cjs webkit CHEMIN_DISTRIBUTION_2.1.0` ou remplacer webkit par chrome. Passer l’URL en deuxième argument pour le contrôle de la version publique. [Capture du test en portrait](docs/Atlas-portrait.png).

# Vérification de la 2.1.1

En plus des 33 tests de logique, `node test-mobile-regressions.cjs URL chrome` et `node test-mobile-regressions.cjs URL webkit` rejouent les situations signalées. Les tests placent le joueur et les acteurs dans un profil jetable, puis utilisent le moteur et le modèle GLB de la distribution. Ils vérifient le sens tête–queue pendant 260 pas, l’absence de contact du modèle avec un mur, le ciblage de Borin avec un mouton derrière le joueur, les rectangles de l’interface à 390 × 695, 695 × 320 et 1024 × 768, ainsi que le retrait d’une fleur au minage et après rechargement. Les essais utilisent des navigateurs de bureau en émulation tactile. Le parcours existant du moulin est également rejoué.

# Vérification de la 2.1.0

**Adresse testée** : https://tnnmy4vbp6-creator.github.io/asteria/. GitHub Pages a publié la branche gh-pages. Tests réalisés sur le poste Windows le 5 novembre 2026. Les contextes tactiles de bureau ne sont pas des appareils physiques.

## Résultats reproductibles

| Vérification | Résultat |
|---|---|
| Installation et build | `npm ci`, `npm test` et `npm run build` réussissent. 45 ressources dans le jeu mis en cache, 1 774 415 octets hors en-têtes HTTP et worker, dont 831 218 octets de médias dans assets/ |
| 13 tests de moteur | coûts atomiques, chaînes de recettes, éditions du terrain, collisions, saut, nage, six gardiens accessibles, galerie et coffres, épreuves et sauvegarde |
| 12 tests de campagne | culture et récolte, coffre, minage et pose, lit, indices, 15 épreuves et portail, récompense unique, reprise de quête, carnet et imports corrompus |
| 7 tests du moulin et de la progression | débit incorrect, réparation et coût, réglage réussi et irrigation, migration V2, calculs de cinq paliers, révision après erreur, déchargement des maillages |
| Navigateur PC depuis HTTPS | rejoindre Zoé, fabriquer les planches et marcher réellement jusqu’à la roue et la vanne. Essayer un mauvais débit, régler 4 + 1, recevoir l’irrigation. Exporter, passer en créatif, reprendre l’aventure et importer dans un deuxième profil |
| Chrome tactile émulé | démarrage, toucher pour parler à Zoé, joystick avec événements tactiles natifs du navigateur, fabrication, renards chargés, reprise de progression après rechargement hors ligne, espace parent. Aucune erreur de page ou de console dans ce scénario |
| WebKit tactile émulé | mêmes étapes de dialogue, interface tactile, fabrication, cache et reprise hors ligne. Le scénario de glissement multipoint par CDP est spécifique à Chromium. Aucune erreur de page ou de console dans ce scénario |

## Mesures

Vue de jeu à 1024 × 768 CSS, après conversation avec Zoé et fabrication, 90 intervalles entre images. Chaque moteur a été mesuré séparément avec le scénario `test-browser.cjs`. Les vues diffèrent légèrement car le scénario Chrome inclut un déplacement. Le délai de lancement inclut navigation, chargement et interaction avec le bouton. Les chiffres varient avec le poste et le réseau.

| Mesure depuis l’URL de la version publiée | Chrome | WebKit pour Windows |
|---|---:|---:|
| Navigation → entrée en jeu | 2,25 s | 1,66 s |
| Cadence moyenne | 60 i/s | 20 i/s |
| 95e centile du temps entre images | 17,2 ms | 56 ms |
| Appels de rendu dans l’image relevée | 80 | 90 |
| Triangles dans l’image relevée | 16 768 | 19 126 |
| Maillages de terrain résidents | 9 | 9 |
| Tas JS indicatif | 22,8 Mo | non exposé |

Les essais WebKit montrent une limite de cadence malgré le regroupement des pièces rigides. La mémoire GPU et la consommation totale de l’appareil restent à mesurer. L’application utilise un premier réglage automatique basé sur le type de pointeur et ajuste la résolution sur les configurations tactiles lentes.

## À tester en famille

1. **Nouvelle partie, sans explication.** Ouvrir le lien en paysage et laisser l’enfant choisir son chemin pendant cinq minutes. Noter s’il trouve Zoé, la rotation de caméra et le bouton d’interaction. Observer avant d’intervenir.
2. **Moulin.** Noter si l’enfant comprend les deux pales, choisit une recette, se repère à l’est et au nord et modifie la vanne après un essai raté. Lui demander de montrer ce qui a changé dans le jardin.
3. **Exploration libre, dix minutes.** Observer le premier objectif qu’il choisit seul, les moments d’hésitation, ses constructions et ses découvertes. Demander « Qu’as-tu envie d’essayer ensuite ? ».
4. **Reprise le lendemain.** Lui proposer une livraison ou une nouvelle observation ; noter s’il réutilise une stratégie sans aide. Éviter de déduire une compétence scolaire d’une seule bonne réponse.
5. **Sur les deux plateformes.** Relever modèle, OS et navigateur, orientation, lisibilité au soleil, marche et rotation simultanées, température après vingt minutes et cadence dans la mine et le village. Ajouter l’icône à l’accueil, rouvrir en mode avion, puis exporter et importer entre appareils.

Restent aussi à vérifier sur la durée : mises à jour avec plusieurs onglets, manque d’espace disque, croissance de très grandes sauvegardes et imports à la limite de taille. Le sac utilise des piles sans capacité maximale de cases en jeu. Les scénarios de sac plein, météo et boss seront à écrire lors de l’introduction de ces systèmes.
# Vérification de la 2.3.0

Le scénario `node test-temple.cjs chrome URL` (ou `webkit`) joue le chapitre sur écran tactile émulé en paysage. Il rejoint le temple depuis les quêtes, place le joueur à portée des mécanismes, utilise le bouton main, recharge une partie avant la résolution, vérifie la collision de la porte puis la traverse avec le moteur de déplacement. Il essaie une observation incorrecte, aligne la Lune et ouvre la carte depuis la récompense. Un second chargement contrôle la découverte, la porte et l’attribution unique de l’expérience. La validation avec un enfant sur tablette physique reste ouverte.
# Vérification de la 2.4.0

`node test-voyages.cjs chrome URL` ou `node test-voyages.cjs webkit URL` démarre une partie tactile en portrait depuis **Jouer et apprendre**. Le scénario touche la main, essaie une réponse anglaise incorrecte, lit son indice, réussit puis recharge avant de poursuivre. Il exerce ensuite les commandes de voyage, visée et formulaires pour les 35 étapes suivantes. Il contrôle les six fanions, le carnet, la validité de la sauvegarde, la révision sans double récompense et le calcul d’une vraie recette avant débit du sac.
