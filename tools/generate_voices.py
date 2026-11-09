"""Reproducible local narration; models stay in .qa, only WAVs are distributed."""
import json
import math
import wave
from pathlib import Path
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

root=Path(__file__).resolve().parents[1]
output=root/'assets/voices'
output.mkdir(parents=True,exist_ok=True)
lines={
    'fr':{
        'welcome':'Bienvenue dans la vallée des inventeurs. Construis un abri, une serre et un entrepôt. Tes découvertes feront vivre le village.',
        'building':'Choisis la taille de ton bâtiment. Pose le sol, puis deux couches de murs. Laisse une porte au même endroit dans les deux couches. Termine par un toit. Observe combien de cases restent libres à l’intérieur.',
        'cargo':'Les explorateurs attendent des vivres et du bois. Un sac pèse une unité. Une caisse de bois en pèse deux. Répartis les objets en respectant la masse de chaque chariot.',
        'forest':'June cherche une clairière. Écoute les indications en anglais. Avancer change de case. Tourner change la direction du regard.',
        'fossils':'Ces couches de roches n’ont pas été bouleversées. Fouille du haut vers le bas. Puis classe les traces du plus ancien au plus récent. La position de chaque découverte est conservée.',
        'volcano':'Tao répare le canal de son atelier. Tourne chaque pièce d’un quart de tour. Relie l’arrivée bleue à gauche à la sortie dorée à droite.',
        'grammar':'Prépare la consigne du convoi. Choisis les étiquettes et place-les dans l’ordre. Observe le sujet, le nombre et le temps. Certains mots ne conviennent pas.',
    },
    'en':{'forward':'Go forward.','left':'Turn left.','right':'Turn right.','arrived':'You found the clearing. Well done!'}
}
manifest=[]
for language, scripts in lines.items():
    voice=PiperVoice.load(str(root/f'.qa/voices/{language}.onnx'))
    for key,text in scripts.items():
        path=output/f'{key}.wav'
        with wave.open(str(path),'wb') as f:
            voice.synthesize_wav(text,f,syn_config=SynthesisConfig(length_scale=1.08))
        manifest.append({'file':f'assets/voices/{key}.wav','text':text,'language':language,'voice':'fr_FR-siwis-medium' if language=='fr' else 'en_US-ljspeech-medium','generator':'Piper 1.8.0'})

# Original generated ambience: quiet wind, flowing water and a low volcanic rumble.
rate=22050
t=np.arange(rate*8)/rate
rng=np.random.default_rng(277)
noise=rng.normal(size=len(t))
smoothed=np.convolve(noise,np.ones(121)/121,mode='same')
fade=np.minimum(1,np.minimum(t/0.6,(8-t)/0.6))
for name in ['forest','village','volcano']:
    if name=='forest':
        chirp=np.sin(2*np.pi*(1400*t+90*np.sin(t*2)))*np.maximum(0,np.sin(t*3))**24
        signal=smoothed*.2+chirp*.045
    elif name=='village':signal=smoothed*.25+np.sin(2*np.pi*260*t)*.007
    else:signal=smoothed*.25+np.sin(2*np.pi*53*t)*.06+np.sin(2*np.pi*81*t)*.025
    pcm=(np.clip(signal*fade,-1,1)*32767).astype('<i2')
    with wave.open(str(output/f'ambient-{name}.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(pcm.tobytes())
(output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(manifest)} narrated clips and 3 original ambient loops.')
