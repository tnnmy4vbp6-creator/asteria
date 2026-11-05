# Astéria 2.2.1 · Relecture des 100 rubriques du cahier des charges

État du jeu examiné le 5 novembre 2026. Le texte original numérote ses rubriques de 1 à 100. Le constat porte sur le code de la [version examinée](https://github.com/tnnmy4vbp6-creator/asteria/tree/a78311affd3df5a5e659014820b08bb7ec74c2d4), ses données, les tests et les retours de jeu sur téléphone.

**24 points établis · 62 partiels · 2 absents · 9 à valider en usage · 3 conditionnels.** Une rubrique compte une fois. Ces nombres décrivent la couverture des demandes. Une adresse HTTPS et une campagne d’aventure entière comptent chacune pour une rubrique malgré des efforts et des effets très différents.

**Établi** signifie que l’exigence principale a une preuve dans le produit ou sa documentation. **Partiel** indique ce qui fonctionne et ce qui manque. **Absent** indique qu’aucun système correspondant n’a été trouvé. **À valider** réserve le jugement lorsqu’il dépend surtout d’une observation sur l’appareil cible ou avec un enfant. **Conditionnel** reprend une option explicitement laissée au projet dans le prompt.

## De l’audit aux outils

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 1 | Audit de départ | Établi | L’audit de la V2 couvre le monde, le tactile, la pédagogie et la sauvegarde. Sa note de 48/100 concernait cette ancienne version. |
| 2 | Analyse du code | Établi | Les dépendances, la mémoire du terrain, la circulation de l’état et les contraintes de migration sont documentées. |
| 3 | Vision du jeu | Partiel | Le moulin offre une suite complète de décisions de fabrication et d’irrigation. La campagne des gardiens dépend encore de fenêtres d’épreuves. |
| 4 | Monde ouvert | Partiel | Cinq régions sur une carte de 80 × 80 blocs. Les parcours et les lieux d’intérêt varient peu d’une partie à l’autre. |
| 5 | Génération procédurale | Partiel | Le terrain est généré de façon déterministe. Le joueur retrouve le même village, la même mine et les mêmes ruines. |
| 6 | Chargement par zones | Partiel | Les maillages éloignés sont libérés. Les 192 000 cellules du terrain brut restent en mémoire. |
| 7 | Minage | Partiel | La pierre, le charbon, le fer et le cristal servent à progresser. La gamme de filons et d’usages demandée est plus large. |
| 8 | Outils | Partiel | Les pioches ont trois niveaux de matériau et il existe une houe. Les alliages, la durabilité et les familles d’outils restent à développer. |

## Du village aux quêtes

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 9 | Fabrication | Partiel | 15 recettes incluent pioches, établi, four, torches, nourriture et blocs. Peu d’équipement spécialisé pour explorer. |
| 10 | Construction | Partiel | Les blocs se posent sur la face visée, se cassent et se sauvegardent. Il manque un aperçu tactile de la pose et davantage d’objets manipulables. |
| 11 | Inventaire | Partiel | Huit raccourcis, équipement, piles et coffres. Le sac ne propose pas le glisser-déposer et le tri demandés. |
| 12 | Agriculture | Partiel | La houe, le blé, l’arrosage et le moulin fonctionnent ensemble. Il reste à diversifier les cultures et à leur donner des cycles distincts. |
| 13 | Animaux | Partiel | Moutons, cochons, poules et renards se déplacent. Le nourrissage et l’observation existent. Les habitats et les comportements par espèce restent simples. |
| 14 | Créatures originales | Partiel | Lutin mousse, lunelle et veilleur de brume ont des rôles différents. Les espèces rares, légendaires et protectrices restent à développer. |
| 15 | Personnages | Partiel | Six gardiens et Zoé ont des rôles identifiables. Les relations entre habitants et les histoires personnelles sont peu développées. |
| 16 | Villages | Partiel | Un village habité accueille l’aventure. Il manque d’autres communautés avec leur architecture et leurs besoins. |
| 17 | Histoire | Partiel | Le portail donne une conclusion à la quête des cinq sceaux. La campagne reste courte et comporte peu de révélations. |
| 18 | Quêtes | Partiel | Livraisons, étapes, récompenses et suivi sont jouables. Peu d’événements changent les quêtes d’une partie à l’autre. |

## Apprendre en explorant

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 19 | Donjons | Partiel | Mine, ruines et coffres sont visitables. Il manque un donjon complet avec salles liées, mécanismes, découverte puis résolution finale. |
| 20 | Énigmes | Partiel | Ordre, calcul, circuit, mémoire et réglage des vannes sont présents. Beaucoup d’épreuves se résolvent encore dans une fenêtre. |
| 21 | Culture générale | Partiel | 48 questions, huit dans chacune des six catégories. Les observations du sentier ajoutent des connaissances acquises sur place. |
| 22 | Français CE1 | Partiel | L’enfant lit dialogues, indices et consignes. Il manque une progression en grammaire, orthographe, conjugaison et production de phrases. |
| 23 | Mathématiques | Partiel | Livraisons et débit d’eau font manipuler nombres et groupements. La progression en mesures, géométrie et lecture de l’heure reste limitée. |
| 24 | Difficulté | Partiel | Les commandes du quai ont cinq paliers. L’encyclopédie en utilise trois. La difficulté réelle pour un enfant de sept ans reste à observer. |
| 25 | Gestion des erreurs | Partiel | Les vannes et certaines épreuves proposent des indices successifs. Les 48 questions d’encyclopédie partagent encore une consigne d’aide générique. |
| 26 | Révision espacée | Partiel | Essais, réussites, erreurs, palier, dernière tentative et échéance sont stockés. La révision libre de toutes les épreuves de quête manque encore. |
| 27 | Encyclopédie | Partiel | Le carnet conserve les explications débloquées et les trois observations du sentier. Les familles de fiches restent peu développées. |
| 28 | Collections | Partiel | Le carnet compte les découvertes. Sceaux, cristaux et fossile offrent un début de collection, avec peu de séries à compléter. |
| 29 | Progression multiple | Partiel | Un niveau d’explorateur et des paliers par notion existent. Les six carrières demandées restent à développer. |

## Créatures, atmosphère et médias

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 30 | Combat adapté | Établi | Le joueur peut choisir Paisible. En Petite aventure, la main, un mur et une torche permettent de se protéger du veilleur. |
| 31 | Boss | Absent | Aucune rencontre de boss où l’enfant utilise le décor et son raisonnement. |
| 32 | Jour et nuit | Partiel | Éclairage, étoiles, lit, lunelle et veilleurs changent la vie nocturne. Les événements et les ambiances sonores restent limités. |
| 33 | Météo | Absent | Nuages de décor et brouillard de distance sont visibles. Aucun système ne fait évoluer le temps entre pluie, neige et orage. |
| 34 | Graphismes | Partiel | Textures du terrain, ciel, éclairage et modèles animés existent. Le niveau de finition et la diversité des décors restent en dessous de l’ambition exprimée. |
| 35 | Réutilisation de médias Web | Partiel | 15 textures de terrain, cinq sons, une musique, le renard et le veilleur animé sont intégrés. Bâtiments, végétation et icônes restent peu variés. |
| 36 | Recherche de médias | Partiel | Le registre distingue les packs utilisés et les candidats repérés. La sélection ne documente pas une comparaison approfondie pour chaque famille de décors. |
| 37 | Licences | Établi | Les médias tiers intégrés ont une source et une licence documentées, avec des notices distribuées dans le jeu. |
| 38 | Registre des médias | Établi | ASSETS.md attribue les textures, sons, modèles, animations et musique et explique leurs usages. |
| 39 | Stockage des médias | Établi | Les ressources de jeu sont servies depuis le projet et entrent dans le cache hors ligne. |
| 40 | Cohérence visuelle | Partiel | Une palette et des matériaux communs sont définis. Les silhouettes détaillées importées et les habitants en blocs restent sensiblement différents. |
| 41 | Modèles 3D | Partiel | Le renard et le veilleur sont distribués en GLB. Le coût de ces modèles sur une tablette cible reste à mesurer. |
| 42 | Compression | Conditionnel | Les formats avancés sont suggérés si leur gain justifie leur coût. Aucune comparaison sur tablette ne permet de trancher. |
| 43 | Animations | Établi | Le renard utilise un cycle de marche et les veilleurs des animations d’attente et de course réutilisées sous licence. |
| 44 | Bruitages | Partiel | Pas, pose et extraction ont des sons. Les ambiances distinctes de forêt, d’eau, de grotte et de faune sont limitées. |
| 45 | Musique | Établi | Une boucle sous licence CC0 est activable. La variation par biome évoquée en option reste ouverte. |
| 46 | Lecture vocale | Établi | Des boutons permettent d’écouter à la demande. La disponibilité des voix dépend de l’appareil. |

## Jouer sur les appareils de la famille

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 47 | Interface enfant | À valider | Les prénoms, les messages et les commandes ont été repris après les captures du téléphone. L’autonomie de lecture et de navigation reste à observer. |
| 48 | Priorité tablette | À valider | Les essais tactiles en navigateur sont documentés. La version actuelle attend une validation sur iPad et tablette Android physiques. |
| 49 | Commandes tactiles | Partiel | Joystick, caméra, main, saut, minage, construction, sac et dialogues sont disponibles. Les doubles appuis sur iPhone ont nécessité deux corrections. |
| 50 | Mode paysage | À valider | Le manifeste privilégie le paysage et la disposition a été testée en navigateur. Le confort sur tablette tenue à deux mains reste à observer. |
| 51 | PC | Établi | Clavier et souris permettent de jouer. Le parcours du moulin possède un scénario navigateur. |
| 52 | Adaptation aux écrans | Partiel | Les tests couvrent plusieurs dimensions. Les captures de l’iPhone ont révélé les limites de l’émulation pour le zoom et la lisibilité. |
| 53 | Application Web installable | Établi | Manifeste, icônes, affichage autonome, cache et reprise hors connexion après un premier chargement. |
| 54 | Installation sur tablette | À valider | La procédure d’ajout à l’écran d’accueil est documentée. La séquence complète reste à confirmer sur les deux plateformes physiques. |
| 55 | Sauvegarde | Partiel | Les modifications, le sac, les quêtes et les connaissances sont conservés par profil. Le stockage saturé et les longues parties restent à éprouver. |
| 56 | Export et import | Établi | Un fichier JSON permet de transférer une partie. Le parcours automatisé vérifie l’import dans un autre profil. |
| 57 | Profils | Établi | Trois profils locaux séparent les aventures et les constructions créatives. |
| 58 | Espace parent | Partiel | Le parent voit le temps, les essais, les erreurs, les paliers et les notions à revoir. Une vue synthétique par matière reste à développer. |
| 59 | Temps de jeu | Établi | Le jeu suit le temps actif et propose discrètement une pause toutes les 35 minutes. |
| 60 | Accessibilité | Partiel | Lecture vocale et réglages du son et de la musique existent. La taille du texte, le contraste et les effets demandent des réglages et essais supplémentaires. |
| 61 | Performances tablette | À valider | Chargement des maillages proches et résolution adaptative sont en place. La fluidité sur une tablette moyenne reste à mesurer dans la durée. |
| 62 | Profils graphiques | Établi | Les réglages Automatique, Allégée, Moyenne et Élevée sont disponibles. |

## Développer et publier

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 63 | Architecture | Partiel | Données, moulin, apprentissage, médias et contrôles sont séparés. Le moteur et l’interface concentrent encore de nombreuses responsabilités. |
| 64 | Dépôt GitHub | Établi | Sources, médias, licences, scripts et documentation sont versionnés dans le dépôt du jeu. |
| 65 | Versions Git | Partiel | Les commits, tags et versions distribuées sont présents. Le dernier tag vérifié est v2.2.0, alors que le jeu publié affiche 2.2.1. |
| 66 | GitHub Pages | Établi | La distribution statique est publiée en HTTPS depuis la branche gh-pages. |
| 67 | Autres hébergements | Conditionnel | La comparaison était demandée si Pages devenait limitant. La version examinée fonctionne sur Pages. |
| 68 | Déploiement automatique | Partiel | Un script teste, construit et publie le jeu. Le workflow fourni en exemple reste à activer pour publier à chaque poussée de code. |
| 69 | Lien durable | Établi | L’adresse publique du projet est réutilisée à chaque version. |
| 70 | Domaine personnalisé | Conditionnel | Le prompt le réserve explicitement pour plus tard. Le jeu utilise le domaine GitHub Pages. |
| 71 | Facilité de modification | Partiel | Objets, recettes, gardiens, épreuves et découvertes ont des fichiers JSON. Les biomes et plusieurs comportements exigent encore une modification du moteur. |
| 72 | Données pédagogiques | Partiel | Les questions comportent thème, niveau, propositions et explication. Les entrées encyclopédiques dépendent de leur position dans le fichier et ne possèdent pas chacune leurs propres indices. |

## Contenu, découverte et qualité

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 73 | Volume pédagogique | Partiel | 48 questions de culture générale, 15 épreuves de mission et des situations de terrain. Les variantes chiffrées du quai ne constituent pas autant de situations originales. La cible à terme est de 300 à 500. |
| 74 | Interactions entre systèmes | Partiel | Réparer le moulin irrigue les parcelles et ouvre les livraisons. Poser une torche repousse un veilleur. Peu de chaînes comparables ouvrent ensuite de nouveaux territoires. |
| 75 | Secrets | Partiel | La mine, la forêt et les ruines contiennent des caches. Les passages et les quêtes secrètes restent peu développés. |
| 76 | Rejouabilité | Partiel | Construction libre, révisions et livraisons renouvelables sont disponibles. La carte et les grandes étapes de campagne se répètent. |
| 77 | Mode créatif | Établi | Chaque profil possède deux sauvegardes distinctes pour l’aventure et la construction libre. |
| 78 | Tutoriel | Partiel | Zoé introduit l’interaction, la fabrication et les repères du moulin. Les huit gestes du prompt ne sont pas tous enseignés et exercés en situation. |
| 79 | Premières minutes | À valider | Le premier objectif est balisé. Compréhension spontanée et plaisir au démarrage demandent une observation avec un enfant. |
| 80 | Qualité commerciale | À valider | Les retours sur la lisibilité, les déplacements et le zoom montrent que les tests de bureau ont laissé passer des défauts visibles en famille. |
| 81 | Tests automatisés | Établi | 33 tests de logique couvrent notamment recettes, sauvegardes, monde, campagne et moulin. Des scénarios de navigateur complètent ces tests. |
| 82 | Essais manuels | Partiel | Captures et parcours ont permis de corriger plusieurs défauts. Il manque une campagne complète sur appareils physiques et anciennes sauvegardes en conditions réelles. |
| 83 | Mesures de performance | Partiel | Des mesures de cadence, mémoire JavaScript, lancement et poids sont documentées avec leurs conditions. Il manque des séries comparables sur matériel cible pour cette version. |
| 84 | Test avec un enfant | À valider | Un protocole de jeu en famille existe. Aucun compte rendu structuré avec durée, difficultés, autonomie et envie de rejouer n’a été trouvé. |

## Conception, livraison et validation

| Nº | Demande | État | Constat sur la version examinée |
|---:|---|---|---|
| 85 | Autonomie de conception | Partiel | Le moulin, les gardiens et les veilleurs ont été conçus et implémentés. Plusieurs problèmes d’usage ont dû être signalés à répétition. |
| 86 | Profondeur des améliorations | Partiel | La rencontre nocturne relie lumière, construction et poursuite. La profondeur des autres systèmes, notamment les animaux et les villages, reste inégale. |
| 87 | Feuille de route | Établi | Les douze phases figurent dans le document de conception. Le moulin, l’irrigation, les profils et les veilleurs ont été livrés. |
| 88 | Priorités | Partiel | La feuille de route distingue P0 et P1. Les validations tactiles critiques restent ouvertes et les niveaux P2 et P3 sont peu détaillés. |
| 89 | Livrables de version | Partiel | Jeu, lien, dépôt, historique, licences et résultats existent. Les tests propres à chaque correctif et les validations restantes sont dispersés. |
| 90 | Documentation | Partiel | Les cinq documents principaux existent. Certaines descriptions du rendu, des médias et des tests reflètent encore des versions antérieures. |
| 91 | Sécurité enfant | Établi | Le jeu fonctionne en solo avec progression locale. Aucun mécanisme de publicité, achat intégré ou messagerie publique repéré dans les sources examinées. |
| 92 | Pratiques de monétisation | Établi | Aucune boutique payante, récompense payante aléatoire ni offre commerciale à durée limitée repérée dans le jeu. |
| 93 | Identité d’Astéria | Partiel | Les cinq gardiens, le moulin et la lunelle lui donnent des repères propres. Les histoires, les architectures et les technologies restent à diversifier. |
| 94 | Première mission de production | Partiel | Audit initial, exécution, recherche de médias, intégration, tests et publication sont documentés. L’automatisation depuis la branche principale et les validations matérielles restent ouvertes. |
| 95 | Validation avant livraison | Partiel | La logique et plusieurs parcours de navigateur sont couverts. Un succès en émulation n’a pas suffi à prévoir le comportement constaté sur iPhone. |
| 96 | Résultat attendu en famille | À valider | Le lien et les principales actions existent. Autonomie, envie de rejouer et progrès en lecture ou en raisonnement demandent des observations dans la durée. |
| 97 | Méthode de développement | Partiel | Médias sous licence, modules et données éditables facilitent l’évolution. Le couplage du moteur et le peu d’essais matériels limitent encore cette démarche. |
| 98 | Choix des médias pour chaque fonctionnalité | Partiel | Les choix du renard et du veilleur sont traçables. Une recherche préalable pour chaque décor, interface ou autre ajout ne peut pas être attestée. |
| 99 | Hébergement de référence | Établi | L’URL HTTPS de la version 2.2.1 répond et le jeu se lance dans le navigateur. |
| 100 | Objectif ultime | Partiel | Le jeu permet déjà de construire, d’explorer et d’apprendre. La variété du monde, les décisions offertes à l’enfant et la validation sur tablette restent les principaux écarts. |

## Éléments consultables

- [Contenu du jeu](../content/) et [conception pédagogique](../EDUCATION_DESIGN.md).
- [Registre des médias et des licences](../ASSETS.md).
- [Audit initial](AUDIT.md), [feuille de route](../GAME_DESIGN.md) et [conditions des essais](../TESTING.md).
- [Scénario de campagne](../test-campaign.cjs), [parcours du moulin](../test-journey.cjs) et [essai des gestes en rencontre nocturne](../test-touch-night.cjs).
