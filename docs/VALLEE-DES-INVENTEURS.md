# Version 3.0 — La vallée des inventeurs

Depuis l'accueil, **Bâtir un village** ouvre le troisième monde. Les deux mondes
existants, les profils et leurs sauvegardes sont conservés. Le journal de la vallée
permet de rejoindre les lieux et de revenir à Astéria.

## Une progression qui utilise ce que l'enfant construit

1. **Maison** : construire un sol, deux niveaux de murs, une ouverture continue et
   un toit. Largeur et profondeur indépendantes, de 5 à 7 blocs ; porte sur n'importe
   quel côté, un ou deux blocs de large. L'intérieur doit rester accessible.
2. **Serre** : mêmes exigences, au moins six carreaux de verre. Maison et serre
   fonctionnelles permettent à Noé de produire six provisions par cycle arrosé.
3. **Dépôt** : au moins douze cases intérieures ; trois provisions de stockage par
   case. Une maison 5 × 5 contient 9 cases intérieures : elle ne suffit donc pas
   comme dépôt. Les habitants empruntent des chemins calculés dans le terrain réel.
4. **Port** : manipuler sacs et caisses pour atteindre les masses des chariots.
   Un départ consomme trois provisions et rapporte quatre pièces et douze planches.
   Le marché transforme les récoltes en matériaux. Les échanges sont atomiques.
5. **Expéditions** : guider June avec des consignes anglaises parlées, fouiller une
   coupe sédimentaire et classer ses traces, tourner des canaux, assembler les mots
   d'une consigne. Les découvertes alimentent matériaux, lingots et carnet.
6. **Veillée** : couvrir un trajet avec les lanternes, fermer un circuit sans
   dérivation et maintenir un abri habitable. Le veilleur emprunte les passages
   libres et évite les zones éclairées. Un échec ne retire aucun objet.

L'atelier agit directement sur les voxels : un geste pose un bloc, une rangée ou
un contour. L'enfant retire lui-même la porte et choisit les matériaux. Le mode
3D montre le résultat. La validation inspecte le terrain ; elle ne compare pas
une réponse chiffrée avec un modèle de maison unique. Retirer un morceau de toit
interrompt réellement la production. Les récompenses de bâtiment ne sont versées
qu'une fois. La palette libre à 16 matériaux et 7 formes reste disponible dans le
monde, pour compléter les toits, décors et constructions hors de ces trois terrains.

## Variantes et indices

84 variantes enregistrées : 18 cargaisons, 18 itinéraires, 18 réseaux de canaux,
18 coupes de fouille, 12 messages. Trois paliers ; les réussites autonomes font
monter progressivement le palier, les erreurs le réduisent. Utiliser un indice
empêche la promotion pour cet essai. Les consignes restent rejouables avec d'autres
valeurs ; les traces et les prochaines dates de révision apparaissent dans l'espace
parent. Ces scores décrivent le jeu, sans prétendre mesurer le niveau scolaire.

Les données sont générées hors du navigateur par `tools/generate_living.py` :
OR-Tools vérifie les répartitions entières des cargaisons ; NetworkX vérifie les
itinéraires et la connexion des lieux. Les vérifications complémentaires JS
rejouent les commandes, testent les canaux et invalident les contre-exemples.
Le navigateur charge des données statiques et fonctionne hors ligne.

## Sources pédagogiques

- Dépôt successif et âge relatif des strates non bouleversées :
  [USGS, Fossils, Rocks, and Time](https://pubs.usgs.gov/gip/fossils/rocks-layers.html)
  et [National Park Service, principes géologiques](https://www.nps.gov/subjects/geology/fundamental-geologic-principles.htm).
  Les séries du jeu sont fictives ; elles ne datent pas universellement les espèces.
- Différence magma/lave :
  [USGS, What is the difference between magma and lava?](https://www.usgs.gov/faqs/what-difference-between-magma-and-lava).
- Les masses, capacités, cycles de culture et circuits sont des règles simplifiées
  du jeu, et non une simulation agronomique ou électrique.

## Outils et médias

Three.js r160 conservé. Howler.js 2.2.4 gère les narrations locales et les ambiances
positionnées dans le monde. nipplejs 1.0.4 gère le joystick tactile, avec remise à
zéro à la pause et à la perte de focus. Piper génère onze répliques françaises et
anglaises avant publication. Onze modèles Kenney supplémentaires sont intégrés,
avec licences CC0 et empreintes dans le manifeste. Aucun asset propriétaire de
Minecraft n'est redistribué.

## Limites explicites

Ce chapitre est un monde fini de 80 × 80 blocs. Les bâtiments fonctionnels sont
des rectangles à deux niveaux de murs avec plafond continu ; les pièces libres
plus complexes ne sont pas toutes reconnues comme bâtiments. Les habitants ont
des routines simples, les expéditions sont des scènes conçues à la main et la
veillée reste un scénario court. Ce n'est ni la richesse complète de Minecraft,
ni une validation des cent sections du prompt initial, ni une certification de
qualité commerciale. Les tests sur moteurs de navigateur ne remplacent pas un
essai sur l'iPhone ou la tablette physique de la famille.
