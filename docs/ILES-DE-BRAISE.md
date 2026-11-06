# Les Îles de braise — version 2.5.0

## Ce qui est livré

Le portail ouvre un deuxième terrain voxel fini de 80 × 80 blocs, conservé séparément du village. Le chapitre est accessible depuis l’accueil, le journal et le portail, y compris avant la fin des cinq gardiens grâce au passage accompagné d’Atlas. Il ne modifie pas l’état des quêtes du village.

| Étape | Action et apprentissage | Conséquence dans le monde |
|---|---|---|
| Pont | Calculer 6 rangées de 3 blocs, puis poser les rangées | Un pont physique traverse les six cases de lave |
| Forge | Combiner les débits 2, 3, 4 pour obtenir 6 L/min | L’eau circule et les balises deviennent utilisables |
| Balises | Marcher vers north, east, west et les activer dans l’ordre | La porte de la forteresse s’ouvre ; une erreur remet la séquence à zéro |
| Sceau des mots | Accorder le verbe avec un sujet pluriel | Charger le premier rayon |
| Sceau du volcan | Distinguer magma et lave | Charger le deuxième rayon |
| Sceau des réserves | Résoudre un problème en plusieurs opérations, avec trois niveaux | Charger le dernier rayon |

Les trois rayons demandent de viser le dragon pendant une fenêtre de vulnérabilité. Un cercle au sol annonce le souffle avant son déclenchement. Le mode accompagné active une visée plus large et supprime les dégâts du souffle ; il conserve le déplacement, les mécanismes et les énigmes. En mode aventure, une esquive réussie évite les dégâts. Les épreuves suspendent le duel, sans chronomètre de réponse.

La première victoire donne 100 XP, 12 émeraudes et 3 cristaux, en plus de l’expérience des étapes. Revenir sur un mécanisme terminé ou revoir le panneau de victoire ne réattribue pas la récompense. Les explications restent dans le carnet ; les réussites et erreurs sont enregistrées dans l’espace parent.

## Sauvegarde et construction

`S.ember` stocke le pont, la forge, la séquence, les entraves, le rayon chargé, le mode accompagné et les modifications de terrain. `S.edits` et `S.player` restent consacrés au village. Les anciennes sauvegardes sans `ember` reçoivent la valeur initiale. Un rechargement dans les îles replace le joueur au dernier passage sûr, conserve le rayon chargé et reconstruit le terrain depuis les étapes et les modifications locales.

Le journal permet le retour au village et le retour au passage sûr. Une chute dans la lave ramène au passage sûr sans perte d’inventaire. On peut miner les réserves de pierre et bâtir en pierre, planches, briques ou verre en dehors du passage principal et de l’arène. Les matériaux du pont sont un stock de chantier dédié. Les fondations et les mécanismes sont protégés.

## Vérification

- `npm test` : les 33 contrôles de logique, campagne et moulin.
- `test-ember.cjs` : parcours sur Chrome et WebKit avec entrées tactiles, mauvaises réponses, pont et porte traversés avec le moteur de collision, trois sceaux et tirs, souffle, esquive, mode accompagné, récompense unique, construction, reprise et intégrité du village. Portrait 390 × 720 et paysage 844 × 390.
- Les tests WebKit utilisent des taps forcés pour éviter un blocage de l’attente de stabilité des animations dans le moteur Windows. Les événements tactiles et les gestionnaires réels du jeu sont exécutés.
- `test-touch-night.cjs chrome` : double appui, construction, pause et comportement des veilleurs.
- Reprise hors connexion vérifiée dans les deux moteurs après mise en cache. Les 36 étapes des commandes du village, leurs livraisons et la double fabrication passent aussi le scénario Chrome.
- `test-mobile-regressions.cjs` : noms lisibles, direction du renard, collisions, végétation et interface aux trois formats.
- Captures examinées : entrée des îles, dragon vulnérable et journal en paysage. Le journal défile verticalement sur écran bas.

Les positions et certaines phases du duel sont préparées par les scénarios automatisés pour vérifier les interactions de façon reproductible. Ces tests ne sont pas une séance complète avec un enfant ni un essai sur un iPhone ou une tablette physique. La fluidité et le confort des deux pouces sur ces appareils restent à observer. Ce chapitre ajoute une aventure finie ; il ne constitue pas une reproduction de toutes les dimensions et possibilités de Minecraft.
