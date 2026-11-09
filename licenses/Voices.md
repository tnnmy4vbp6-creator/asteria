# Voix et ambiances de la vallée

Les textes des dialogues sont écrits pour Astéria. Les fichiers WAV ont été
synthétisés localement par `tools/generate_voices.py`, avec Piper 1.8.0
([OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl), GPL-3.0).
Le moteur Piper et les modèles ONNX ne sont pas distribués dans le jeu.

- Français : modèle `fr_FR-siwis-medium` du dépôt
  [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium).
  Jeu de données **SIWIS French Speech Synthesis Database**, University of Edinburgh,
  [source et auteurs](https://datashare.ed.ac.uk/handle/10283/2353), CC BY 4.0.
  [Carte du modèle conservée](piper-siwis-model.txt).
- Anglais : modèle `en_US-ljspeech-medium` de
  [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/medium),
  entraîné par Bryce Beattie sur le [LJ Speech Dataset de Keith Ito et Linda Johnson](https://keithito.com/LJ-Speech-Dataset/),
  indiqué comme domaine public dans la [carte du modèle conservée](piper-ljspeech-model.txt).

Ces sorties sont des voix de synthèse, et non des enregistrements de comédiens
réalisés pour le jeu. L'inventaire des phrases se trouve dans
`assets/voices/manifest.json`. Les trois boucles d'ambiance sont des créations
procédurales originales (bruit filtré et oscillateurs), générées par le même script.

Lecture et spatialisation : [Howler.js](https://github.com/goldfire/howler.js),
MIT, [licence conservée](howler.txt).
Commande tactile : [nipplejs](https://github.com/yoannmoinet/nipplejs),
MIT, [licence conservée](nipplejs.txt).
