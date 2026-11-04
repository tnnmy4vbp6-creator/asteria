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

