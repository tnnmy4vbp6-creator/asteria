# Audit de la version 2.0, avant travaux

**48/100 comme produit commercial.** Appréciation de production sur cinq axes pondérés également. Liberté de jeu 12/20, mise en scène 9/20, apprentissage 11/20, expérience tablette 8/20, livraison et maintenance 8/20. L’enfant peut déjà transformer le village. La progression principale repose néanmoins sur quinze écrans d’épreuves et le contenu s’épuise sur une seule carte. La note concerne la base inspectée, sans panel d’enfants.

| Domaine | Existant | Qualité /10 | Problème observé | À conserver | À améliorer | À remplacer |
|---|---|---:|---|---|---|---|
| Architecture et dépendances | scripts classiques, Three r160 MIT, LinkeDOM en tests, concaténation | 5 | chemins de build extérieurs, état partagé | moteur voxel, suites de tests | frontières des systèmes | build couplé à outputs |
| Monde | 80 × 80 × 30, galerie et cinq régions, génération déterministe | 5 | mêmes lieux à chaque partie, 25 maillages résidents | coordonnées et sauvegardes | itinéraires, cavernes | résidence permanente des maillages |
| Rendu | atlas maison, ombres, ciel, cycle de 720 secondes | 5 | matières répétitives, petites figures à distance | faces cachées éliminées, fleurs instanciées | palette par habitat, silhouettes | textures les moins lisibles |
| Caméra | rotation, collision, saut, nage, visée centrale | 6 | la saisie du pointeur varie selon le périphérique | caméra à la première personne | sensibilité tactile | partage de la rotation entre doigts |
| Tactile | croix à quatre boutons, actions, menus HTML | 4 | croix discontinue, aide clavier affichée à proximité | glisser pour regarder et boutons séparés | deux pouces, petits écrans | déplacement par boutons |
| Minage et construction | extraction selon outil, pose à la face, coffre et lit | 6 | palettes limitées, aucune prévisualisation de la pose | modifications voxel persistantes | aperçu et rotation | — |
| Sac, commerce et recettes | piles numériques, huit raccourcis, quinze recettes | 6 | établi peu utile, navigation longue sur tablette | débits atomiques, progression des pioches | recherche de recette, commerce situé | — |
| Faune et personnages | six gardiens, onze animaux/créatures, dialogues et nourrissage | 5 | déplacements voisins, métiers surtout déclaratifs | rôles et coordonnées | modèles animés et observation | quelques silhouettes génériques |
| Quêtes et exploration | cinq sceaux, pont, coffres, portail final | 5 | enchaînement livraison puis trois épreuves | liens pont/minage/forge | conséquences dans la simulation | boucles d’épreuves répétées |
| Agriculture | six parcelles, houe, graines, récolte, eau | 5 | une culture, arrosage individuel immédiat | production puis fabrication | irrigation collective | — |
| Pédagogie | 48 entrées à choix, 15 épreuves variées, voix, trois difficultés | 5 | indices génériques, révisions aléatoires, récompense annoncée à tort si répétition | carnet, logique et mémoire | traces des essais, transfert en situation | sélection sans échéance |
| Audio | oscillateurs Web Audio et synthèse vocale facultative | 3 | pas de musique, matériaux sonores peu distincts | lecture volontaire | mix par lieu et appareil | sons uniformes des blocs |
| Sauvegarde | clé locale V2, validation, export/import | 5 | un seul profil, l’ancienne partie peut réécrire un import à la fermeture | format V2, inventaires et éditions | isolation aventure/créatif, restauration | écriture concurrente à la navigation |
| Performance | maillages par 16 × 16, plantes instanciées | 5 | torches nombreuses, rendu même en pause, reconstruction du HUD | atlas et géométrie par chunk | mesures sur appareil et budget de rendu | maillages éloignés en mémoire GPU |
| Livraison | un HTML, un ZIP et publication anonyme initiale | 3 | pas de cycle de mise à jour durable ni de PWA | simplicité de distribution | dépôt, tests et URL stable | déploiement temporaire |

## Exécution et inspection

Lancement réel de la V2 dans Chrome à 1024 × 768 avec événements tactiles. À l’arrivée, 25 maillages de terrain, 140 appels de rendu, 45 056 triangles, estimation du tas JS de 23,1 Mo. Délai navigation → bouton joué de 4,97 s dans cette session locale. Seulement 15 intervalles de trame en V2, dont un à 183 ms. Les mesures V2 et V2.1 portent sur deux vues et des conditions de chargement différentes. Elles ne constituent pas une comparaison de fluidité sur tablette physique.

Le monde tient dans un Uint8Array de 192 000 cellules. La lecture du jeu part de la sauvegarde validée, la simulation modifie l’état, le HUD le relit. Les fichiers data, engine, ui et main concentrent ces responsabilités. Les couleurs et les cadres de texte donnent une identité au village. Les édifices et les silhouettes se ressemblent d’une région à l’autre. En tactile, la carte et le panneau de quête prennent une part importante de la vue.

**Décision technique.** Conserver les indices de blocs, les identifiants de quêtes et les coordonnées de la V2. Extraire les données éditoriales, séparer les profils, charger les maillages proches et créer le prochain chapitre à partir des systèmes existants. Une future extension du terrain brut exigera un format de coordonnées versionné, des essais de migration et des tests de mémoire.

