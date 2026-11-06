# Le monde des bâtisseurs — 2.6.0

L’accueil « Construire & géométrie », le journal et le sac donnent accès aux outils.

## Construire

Choisir l’un des 16 matériaux, puis une des 7 formes. Les dimensions vont de 1 à 7 ; une pose ne dépasse pas 400 pièces. Les neuf motifs sont pièce, ligne, rectangle au sol, mur, pavé plein, portique, pyramide à étages, tour circulaire et toit à deux pentes. Les motifs pièce, ligne et mur utilisent la forme choisie ; les autres assemblent des cubes, ou des prismes pour les pentes du toit.

L’aperçu vert montre une pose disponible ; le rouge indique obstacle, zone protégée ou ressources insuffisantes. ＋ / B pose, ↻ / R tourne, ↶ / U annule. Les deux demi-blocs complémentaires du même matériau peuvent se réunir. La pose jumelle place deux pièces séparées par une case centrale. Les motifs peuvent être combinés pour créer des maisons, tours, escaliers ou jardins.

Un premier passage dans la palette donne 64 unités de chacun des matériaux, une seule fois par partie. Les recettes et la carrière permettent de renouveler des stocks ; le créatif permet de bâtir sans coût. L’annulation conserve les 10 dernières poses de la session et refuse les ensembles modifiés entre-temps. Elle rend le coût exact de la pose. Elle ne se conserve pas après fermeture et ne traverse pas les dimensions.

## Explorer et apprendre

- Parc des géomètres : six fondations et Mina, architecte. Les projets restent physiquement dans le monde.
- Atelier des bâtisseurs : Élio, un bâtiment visitable à toit en pente, établi, four et exposition des sept solides.
- Carrière des couleurs : Tess, bancs d’ardoise et de calcaire exploitables avec la pioche.
- Verger des verriers : Noé, arbres symétriques, bancs en demi-blocs et ornements sphériques.

La carte affiche leurs repères et des accès directs. Le village conserve ses cinq biomes, le moulin, les autres habitants, le temple et le portail. La superficie reste finie : 80 × 80 blocs pour le village et 80 × 80 pour les îles.

Les six projets exigent les bonnes cellules, les bonnes formes et l’absence de pièces supplémentaires dans le volume du chantier ; les matériaux peuvent varier. Après la vérification, un problème apporte l’explication et une récompense unique. Une construction peut se corriger avec la pioche ou l’annulation avant de vérifier de nouveau.

## Sauvegardes

Les formes utilisent des identifiants stables inférieurs à 256 et sont conservées dans chaque monde. Le choix des quatre sites est enregistré. Lors de la migration, un emplacement contenant des modifications du joueur est évité ; un second emplacement est essayé. Si les deux sont occupés, ce lieu n’est pas ajouté dans cette partie. Les outils libres restent disponibles. Les modifications ultérieures des nouveaux lieux sont réappliquées au chargement, hormis les fondations protégées. La sauvegarde reste de version 2 et les anciennes parties restent importables.

## Vérification

Les tests de géométrie contrôlent les identifiants, normales, collisions partielles, rayons, nombres de pièces et validation de sauvegarde. Le scénario navigateur construit réellement les six motifs via les commandes tactiles, essaie une mauvaise dimension et une mauvaise réponse, vérifie les remboursements et l’absence de récompense répétée. Il recharge les bâtiments, teste les demi-blocs avec le déplacement du joueur, la rotation et la migration d’un ancien bloc. Les essais Chrome incluent une reprise hors connexion. Les tests utilisent des navigateurs de bureau en émulation tactile ; une tablette physique reste à vérifier.
