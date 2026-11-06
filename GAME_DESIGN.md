# Astéria • Le moulin des deux rives

**Évolution 2.7.0 — Le hameau des deux rives.** La construction guidée rejoint désormais l’histoire des provisions : Mina attend devant un passage détruit, Éloi doit protéger la réserve, Aïna rétablit le signal pour Lila. Chacune des trois manipulations change les blocs du même monde et débloque l’étape suivante. Le retour d’essai est visible dans la scène. Les anciennes fiches de six projets ne constituent plus l’entrée publique de la géométrie ; les constructions et données antérieures restent compatibles. La palette libre reste disponible.

Les nouveaux modèles Kenney habillent des lieux utiles : cargaison du chariot, réserve, atelier et coffre final. Les écoulements et déplacements de chariot sont des animations déterministes de résultat, pas un moteur universel de fluides ou de véhicules. Le monde reste fini. Cette livraison ne revendique ni la richesse intégrale de Minecraft ni la conformité totale aux 100 sections du cahier des charges.

**Promesse de jeu.** « La rivière est là, le jardin est à sec, et je peux changer ça de mes propres mains. » L’enfant entre dans le rôle d’un apprenti bâtisseur dans un village qui dépend de ses inventions. Le portail des cinq gardiens forme l’horizon de l’aventure.

**Les cinq premières minutes.** Une casquette brune et un repère signalent Zoé près du départ. L’enfant s’approche, touche la main pour lui parler, ouvre le sac et transforme l’une de ses deux bûches en quatre planches. Le repère pointe ensuite la roue à l’est. Une fois les deux pales réparées, il faut remonter la rive vers le nord et régler trois conduites. La roue tourne et les nouvelles parcelles sont arrosées à la plantation. Une fois réparé, le moulin prend des commandes de livraison.

**Boucles en parallèle.** L’agriculture fournit les repas et les marchandises. La mine fournit les minerais de la forge. Les outils donnent accès au cristal. Les trois haltes du sentier naturaliste font explorer jardin, galerie et observatoire à des heures différentes. Les découvertes peuvent être relues. Le monde créatif de chaque profil est dédié à la construction.

**Direction artistique.** Bois sombre, eau turquoise, laiton et terracotta pour les machines de la vallée. Les yeux et les poignées des objets importants doivent rester visibles à la distance d’interaction. Le renard du sous-bois utilise une animation articulée. La lunelle se reconnaît à la tache dorée de ses ailes.

## Roadmap de production

La version 2.5.0 ajoute le chapitre jouable des [Îles de braise](docs/ILES-DE-BRAISE.md) : portail vers une dimension séparée, pont à construire, forge à régler, indications anglaises et duel contre un dragon à trois entraves. L’archipel est fini et les acquis pédagogiques ne sont pas évalués hors du jeu. Le tableau ci-dessous conserve la trajectoire de production du village initial.

| Phase | Priorité | Livré ou décision prise | Prochaine validation |
|---|---|---|---|
| 1 Audit / architecture | P0 | audit V2, dépôt, contenu JSON, modules de la nouvelle aventure | découper moteur et UI historiques aux prochaines modifications |
| 2 Monde | P1 | maillages proches, sauvegarde des modifications conservée | étendre les régions par seed et chunks CPU avec migration V2 |
| 3 Sandbox / crafting | P1 | moulin, irrigation, commandes, créatif séparé | aperçu tactile de pose, cuivre puis atelier spécialisé |
| 4 Créatures / NPC | P1 | Zoé, renards animés, abeille, lunelle nocturne | habitats et déplacements testés, deuxième village |
| 5 Quêtes / histoire | P1 | un chapitre avec conséquence permanente, un sentier de terrain | donjon à mécanismes, lien entre portail et archipel |
| 6 Pédagogie | P1 | essais par notion, révisions encyclopédiques, cinq paliers de livraison | nouveaux indices spécifiques, lecture de messages et mesures dans le monde |
| 7 Assets / graphismes / son | P1 | 15 textures, 5 sons, un GLB, une musique ; sources documentées | météo sonore, végétation secondaire et architecture |
| 8 Tablette | P0 | joystick, profils, PWA, commandes séparées | valider caméra/deux pouces et boutons en présence d’un enfant |
| 9 Performance | P0 | profils auto, faible, moyen, élevé ; mesures en navigateur | relevés sur une tablette réelle durant 20 minutes |
| 10 QA | P0 | tests logiques, scénarios de campagne et essai navigateur hors ligne | tests physiques iPad/Android, import entre appareils |
| 11 GitHub / CI | P0 | sources Git et configuration de tests et de publication | vérifier Actions après autorisation workflow |
| 12 Publication | P0 | URL GitHub Pages et branche de distribution | suivre cache, mises à jour et restauration d’une ancienne partie |

La météo régionale, les grands donjons, le boss à mécanismes, la génération de vastes régions et les 300 à 500 situations sont des jalons ultérieurs. L’extension du contenu suit les observations en famille.


## Construction et monde — 2.6.0

La palette compte 16 matériaux et 7 formes, avec aperçu, rotation, pose groupée et annulation. Quatre lieux enrichissent le village existant sans augmenter sa superficie de 80 × 80. Six chantiers font manipuler les solides puis expliquer un résultat. Les sites alternatifs préservent les blocs des anciennes parties. Le détail livré et les limites sont dans [BATISSEURS.md](docs/BATISSEURS.md).
