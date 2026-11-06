# Médias et licences d’Astéria

Toutes les ressources de jeu sont distribuées avec le site. Les liens ci-dessous servent aux crédits. Les noms des PNG et OGG de Minetest ont perdu le préfixe default_. Les images sont assemblées à l’exécution, parfois superposées dans un atlas. Les contributions dérivées de ces textures partagent la licence CC BY-SA 3.0. Les sons restent dans leur encodage original.

| Asset local | Source | Auteur / attribution | URL | Licence | Utilisation |
|---|---|---|---|---|---|
| stone, leaves, tree, tree_top | Minetest Game | Cisoun | [Sources et crédits par fichier](https://github.com/luanti-org/minetest_game/tree/9e895af6e9feb98332fa1a778001442f5669bc20/mods/default) | CC BY-SA 3.0 | pierre et arbres |
| dirt | même distribution | random-geek et Neuromancer | [Crédits détaillés](licenses/Minetest-credits.md) | CC BY-SA 3.0 | terre, composition des faces enherbées |
| grass, grass_side | même distribution | TumeniNodes, paramat | [Crédits](licenses/Minetest-credits.md) | CC BY-SA 3.0 | pelouse et flanc |
| sand, wood, brick, stone_brick, snow | même distribution | VanessaE, BlockMen, Calinou, paramat, Gambit respectivement | [Crédits](licenses/Minetest-credits.md) | CC BY-SA 3.0 | bâtiments, désert, montagne |
| cactus_side, mineral_iron, mineral_coal | même distribution | crédits de la distribution, celeron55 pour les médias non répertoriés | [Crédits](licenses/Minetest-credits.md) | CC BY-SA 3.0 | cactus et filons superposés |
| grass_footstep.1/.2, place_node.1 | Minetest Game | Mito551 | [Crédits](licenses/Minetest-credits.md) | CC BY-SA 3.0 | marche, construction |
| dig_choppy.1 | Freesound via Minetest Game | Sheyvan | [Original](https://freesound.org/people/Sheyvan/sounds/476113/) | CC0 1.0 | coupe du bois |
| dig_cracky.1 | Freesound via Minetest Game | Benboncan | [Original](https://freesound.org/people/Benboncan/sounds/71823/) | CC BY 3.0 | coup de pioche |
| brume.glb, brume.png | Animated Characters 1 | Kenney | [Pack original](https://opengameart.org/content/animated-characters-1) · [Licence](licenses/Kenney-characters.txt) | CC0 | characterMedium, tenue zombieC et animations idle/run convertis en glTF |
| sandstone_brick, sandstone_block, desert_sandstone_block | Minetest Game | paramat (deux premiers), kaeza (grès ocre) | [Textures et notices de la distribution](https://github.com/luanti-org/minetest_game/tree/9e895af6e9feb98332fa1a778001442f5669bc20/mods/default) | CC BY-SA 3.0 | Cour, piliers, façade et dallage du Temple des éclipses. Fichiers PNG d’origine renommés. |
| Fox.glb | Khronos glTF Sample Assets | PixelMannen (modèle), tomkranis (rig et animations), AsoboStudio et scurest (conversion) | [Notice source](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox) | modèle CC0, animation et conversion CC BY 4.0 | deux renards, mise à l’échelle, orientation et cycle de marche à l’exécution |
| Port Town Loop | OpenGameArt | beardalaxy | [Fiche de l’œuvre](https://opengameart.org/content/port-town-loop) | CC0 1.0 | musique optionnelle, volume réduit |
| Three.js, GLTFLoader, SkeletonUtils | Three.js r160 | Three.js Authors | [Bibliothèque](https://github.com/mrdoob/three.js/tree/r160) | MIT | rendu et animation |
| Icône du cristal, Zoé, moulin, abeille, ammonite, lunelle | Astéria | création du projet | dépôt Astéria | créations du projet | PWA et chapitre du moulin |

[Conditions détaillées des médias Minetest](licenses/Minetest-media.txt) · [Attributions du renard et liens légaux](licenses/Fox.md) · [Three.js](licenses/Three.js-LICENSE.txt).

## Sélection pour les itérations suivantes

Le dragon des Îles de braise, ses ailes animées, les balises et les mécanismes de forge sont des géométries originales du projet, construites dans `ember.js`. Le sol et les fortifications réutilisent l’atlas de textures déjà crédité ci-dessus. Ce chapitre n’utilise pas de modèle, de texture ou de personnage extrait de Minecraft.

Castle Kit et Mini Characters restent des pistes, sans intégration revendiquée. Nature Kit et Game Icons sont désormais intégrés dans la 2.7.0, avec Survival Kit et Interface Sounds.

## Médias intégrés en 2.7.0

Les quatre packs ont été téléchargés depuis le site officiel Kenney. Les 30 modèles GLB sont réellement chargés et instanciés dans le village (56 placements dans la partie de référence). Le [manifeste](assets/kenney-manifest.json) donne les fichiers, sources, licences, tailles et empreintes des modèles. Les médias restent locaux et disponibles dans le cache hors connexion.

| Pack, auteur Kenney | Usage réel | Licence locale |
|---|---|---|
| [Nature Kit](https://kenney.nl/assets/nature-kit) | 17 modèles : fleurs, buissons, herbe, champignons, rochers, cultures, pot, bois empilé, canoë, pagaie et nénuphars | [CC0](licenses/Kenney-nature.txt) |
| [Survival Kit](https://kenney.nl/assets/survival-kit) | 13 modèles : caisses du chariot et de la réserve, outils, établi, enclume, ressources, coffre, tente et foyer ; colormap du pack conservée | [CC0](licenses/Kenney-survival.txt) |
| [Game Icons](https://kenney.nl/assets/game-icons) | Pictogrammes des commandes de réparation ; sélection détaillée dans le manifeste | [CC0](licenses/Kenney-icons.txt) |
| [Interface Sounds](https://kenney.nl/assets/interface-sounds) | 5 sons : sélection, rotation, ouverture, réussite et erreur ; OGG convertis en WAV PCM mono 22 050 Hz pour la distribution | [CC0](licenses/Kenney-sounds.txt) |

La géométrie des bâtiments et des pièces constructibles reste voxel pour permettre pose, minage et sauvegarde. Les grands accessoires fixes ont des collisions ; les petits végétaux suivent leur bloc support. Le village Sketchfab fourni par l’utilisateur a servi de référence visuelle d’architecture. Aucun fichier de ce modèle ni média propriétaire Minecraft n’a été importé. La quantité de packs importés n’est pas présentée comme une preuve de finition commerciale.


## Construction 2.6.0

Les sept solides, leurs pictogrammes SVG, les douze nouvelles textures de matériaux (bois, roches, mosaïque, cuivre et couleurs), les quatre lieux et les quatre personnages sont générés dans le code du projet. Les textures existantes utilisées par les nouveaux solides conservent leurs attributions ci-dessus. Aucun média propriétaire de Minecraft ni nouveau téléchargement externe n’a été ajouté pour cette extension.
