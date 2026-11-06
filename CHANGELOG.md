# Versions

## 2.5.0 — Les Îles de braise

- Le portail ouvre un second monde avec lave, îles, forge, forteresse et dragon animé.
- Un pont de 6 × 3 blocs se construit après un calcul ; les rangées deviennent traversables. Les vannes de la forge et les balises anglaises ouvrent la forteresse.
- Trois sceaux de grammaire, sciences et problèmes chargent les rayons du duel. Souffle annoncé au sol, esquive, fenêtre de tir et mode accompagné sans dégâts.
- Accès depuis l’accueil, le journal ou le portail. Retour au village, passages sûrs et reprise des étapes après rechargement. Les constructions sont enregistrées séparément pour chaque monde.
- Explications dans le carnet, essais dans l’espace parent, récompense finale unique.
- Nouveau scénario de navigateur test-ember.cjs couvrant progression, erreurs, collisions des passages, combat, reprise et intégrité du village.


## v2.4.1 — Trouver la mine

- L’entrée de la mine possède un repère sur les cartes et un nom lisible sur la grande carte. Les indications expliquent l’accès aux cristaux bruts et l’outil nécessaire.

## v2.4.0 — Les commandes du village

- Six expéditions relient 36 situations d’anglais, grammaire, mathématiques, problèmes, logique et culture générale à six habitants. Les consignes anglaises peuvent être prononcées en anglais. Les missions alternent choix, saisie de mots, quantités à préparer, problèmes et mises en ordre.
- Chaque cargaison terminée fournit des matériaux et ajoute un fanion sur la barque du moulin. Les étapes se sauvegardent dès la réussite. Les indices, explications et révisions sont accessibles dans la partie et l’espace parent suit chaque notion.
- La visée nomme les blocs courants en français et en anglais. Miner, semer et récolter enrichissent le carnet. L’atelier permet de calculer les quantités pour fabriquer deux lots en une fois.

## v2.3.0 — Le Temple des éclipses

- Une cour de grès dans le désert et une chambre à verrière, accessibles depuis l’accueil, le journal ou le monde. Le temple choisit une parcelle libre parmi trois emplacements pour préserver les constructions des anciennes parties.
- Le rayon lumineux se réfléchit selon l’orientation réelle de trois miroirs. Atteindre le récepteur ouvre le passage. Dans la chambre, aligner la Lune sur le Soleil et observer depuis la Terre permet de découvrir une éclipse.
- La boussole gagnée marque sur la grande carte les coffres anciens encore fermés. Le carnet conserve l’explication et la partie garde les réglages du temple.
- Trois textures de grès de Minetest Game, attribuées dans le registre des médias.
- Une averse traverse la vallée chaque jour. Elle arrose les parcelles exposées, tombe en neige sur les cimes et épargne le désert. Un toit protège la culture située dessous.

## v2.2.1 — Double appui pendant une rencontre

- Le jeu prend en charge le toucher dès que le doigt se pose, y compris pendant un message ou sur la main. Une pression relâchée sur la même commande effectue une action. Les menus conservent leur défilement.

## v2.2.0 — Les veilleurs de brume

- Les commandes de jeu et l’inventaire bloquent la sélection de texte et le zoom par double appui. Chaque appui sur Construire vise à nouveau la surface.
- En Petite aventure, deux veilleurs nocturnes suivent les joueurs à découvert. Une torche les repousse et un mur coupe leur vue. Le mode Paisible reste le réglage initial.

## v2.1.2 — Reprendre sa partie sur téléphone

- L’entrée jouer.html charge les scripts et la feuille de style identifiés par leur contenu, même en présence de la version hors ligne précédente.
- La version figure à l’accueil. À la reprise, la quête suivie conserve la priorité sur le tutoriel de Zoé.
- Le prénom du personnage regardé utilise une taille de 22 pixels CSS, y compris de près. Atlas possède un plastron et des yeux de cristal visibles au crépuscule.

## v2.1.1 — Correctifs téléphone et monde

- Prénom lisible au-dessus du personnage regardé, y compris sur téléphone en portrait. La visée et les obstacles interviennent dans le choix de l’interaction.
- Un seul message de retour et une zone distincte des commandes tactiles. Le suivi de quête est compact sur les petits écrans.
- Orientation du renard alignée sur la direction de marche. Les animaux vérifient leur encombrement et changent de direction devant les blocs.
- Les fleurs disparaissent quand leur support est miné. Abattre un tronc naturel récupère le bois détaché et retire les feuilles privées de support. Les fondations des objets de quête sont protégées.
- Nouveau scénario de régression en Chrome et WebKit, fondé sur les quatre situations photographiées.

## v2.1.0 — Le moulin des deux rives

- Nouvelle aventure accessible au point de départ. Zoé demande deux pales, la roue consomme quatre planches et les conduites contrôlent l’irrigation. Le moulin réparé ouvre des commandes de livraison à cinq paliers.
- Sentier naturaliste au jardin, dans la mine et à l’observatoire après le coucher du soleil. Les trois observations entrent dans le carnet.
- Quinze textures externes, deux renards animés, cinq sons de terrain et une musique facultative. [Artistes et licences](ASSETS.md).
- Joystick tactile, caméra séparée, maillages proches du joueur, regroupement des pièces rigides et qualité automatique.
- Profils locaux et mondes créatifs séparés, espace parent, révisions de l’encyclopédie et suivi des essais. Correction de la perte d’un import lors du rechargement de la page.
- Nouveau site installable et jouable hors ligne après mise en cache. Publication sur GitHub Pages et conservation du format des sauvegardes antérieures.

**Limites connues.** Monde de 80 × 80, entités mobiles principalement simulées dans la zone centrale, absence de météo dans cette version. Sur le moteur WebKit de test, la cadence peut descendre sous 30 i/s. Certaines anciennes énigmes gardent des indices génériques. La voix et la lecture OGG dépendent du navigateur. Les scénarios de test physiques iPad/Android et le test avec un enfant restent à mener. [Rapport de tests](TESTING.md).

## v2.0.0 — Les gardiens du savoir

Base importée du jeu livré : cinq gardiens et un portail, cinq biomes, minage et construction, outils, cultures, marchés, animaux, 15 épreuves de campagne et 48 découvertes de culture générale.

