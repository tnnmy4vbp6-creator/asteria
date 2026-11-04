// Le moulin relie la fabrication, le repérage sur la rive et les cultures de Lila.
const millSites = [
  {id:'zoe', x:37.5, z:57.5, label:'Parler à Zoé'},
  {id:'wheel', x:46.4, z:56.5, label:'Examiner la roue'},
  {id:'gate', x:46.2, z:46.5, label:'Régler la vanne'}
];
let millWheel, millStream;
function buildMill() {
  for (const site of millSites) {
    const group = new THREE.Group();
    group.position.set(site.x, world.heights[Math.floor(site.x)+VW*Math.floor(site.z)]+1, site.z);
    scene.add(group);
    interactive.push({kind:'mill', id:site.id, pos:group.position, group, label:site.label});
    const brass=0xd39b4e, timber=0x73503e, blue=0x347b86;
    if(site.id==='zoe') {
      meshBox(group,0,.91,0,.57,.73,.38,blue);
      for (const x of [-.17,.17]) {
        meshBox(group,x,.31,0,.21,.62,.29,timber);
        meshBox(group,x*2.2,.96,0,.15,.6,.22,blue);
        meshBox(group,x,1.58,.25,.12,.11,.07,brass);
      }
      meshBox(group,0,1.55,0,.48,.49,.48,0x9e704f);
      meshBox(group,0,1.82,0,.62,.14,.57,0x854d39);
      meshBox(group,.42,.69,.15,.18,.25,.15,brass);
      const name=textSprite('Zoé · mécanicienne','#ffe1a4',2.6); name.position.y=2.25;group.add(name);
    } else if (site.id==='wheel') {
      for(const z of [-1.1,1.1]) meshBox(group,0,.85,z,.35,2.6,.35,timber);
      meshBox(group,0,2.25,0,.44,.35,2.7,timber);
      meshBox(group,0,1.09,0,.36,.36,2.65,brass);
      millWheel=new THREE.Group();millWheel.position.y=1.09;group.add(millWheel);
      for(let i=0;i<8;i++){
        const arm=new THREE.Group();arm.rotation.z=i*Math.PI/4;millWheel.add(arm);
        meshBox(arm,0,.64,0,.16,1.28,.2,timber);
        meshBox(arm,0,1.18,0,.5,.14,1.23,i%2?brass:blue);
      }
      millStream=meshBox(group,.8,-.02,0,1.8,.07,4,0x60bec7);
      millStream.visible=S.mill.stage===3;
    } else {
      for(const x of [-.8,.8]) meshBox(group,x,.85,0,.25,1.7,.4,timber);
      meshBox(group,0,.88,0,1.5,.85,.26,blue);
      meshBox(group,0,1.62,0,1.95,.2,.55,brass);
      for(const x of [-.44,0,.44]) meshBox(group,x,1.9,0,.13,.55,.12,brass);
    }
  }
}
const millClues = [
 'Zoé porte une casquette brune. Elle attend près du chemin du village.',
 'Une bûche donne quatre planches. Fabrique quatre planches et apporte-les à la roue, sur la rive est du village.',
 'Depuis la roue, remonte la rive vers le nord. La vanne a trois poignées dorées.',
 'Le moulin tourne. Les nouvelles graines de Lila sont arrosées dès la plantation.'
];
function millHeading(){return ['Trouve Zoé','Répare la roue','Ouvre la vanne','Le moulin irrigue le jardin'][S.mill.stage]}
function millMessage(title,text,action,fn){
 modal(title,'LE MOULIN DES DEUX RIVES','<p class="speech">'+text+'</p><div class="row"><button class="primary" id="millGo">'+action+'</button><button class="secondary" id="millRead">Écouter</button></div>');
 $('millGo').onclick=fn;$('millRead').onclick=()=>speak(text);
}
function useMill(id) {
 const m=S.mill;S.millDismissed=false;
 if(id==='zoe'){
   const story=m.stage===0?'Je suis Zoé. Le moulin s’est arrêté cette nuit ! Sans sa roue, l’eau de la rivière n’arrive plus au jardin. Tu peux m’aider ?':millClues[m.stage];
   millMessage('Zoé, mécanicienne du village',story,m.stage===0?'Aider Zoé':'Retour au village',()=>{
     if(m.stage===0)m.stage=1;
     closeModal();updateHUD();toast(millClues[m.stage]);
   });return;
 }
 if(id==='wheel'&&m.stage===1){
   millMessage('Les pales fendues','Deux pales ont cassé. Chacune demande deux planches. Ton sac contient '+(S.inv.plank||0)+' planche(s).',
   has({plank:4})?'Fixer les deux pales':'Ouvrir les recettes',()=>{
     if(!has({plank:4})){inventory();return}
     if(m.stage!==1||!spend({plank:4}))return;
     m.stage=2;closeModal();updateHUD();sfx('place');toast(millClues[2]);
   });return;
 }
 if(id==='gate'&&m.stage===2){gatePanel();return}
 millMessage(id==='gate'?'La vanne de la rivière':'La roue du moulin',millClues[m.stage],'Compris',closeModal);
}
function gatePanel(){
 const m=S.mill,values=[1,2,4];
 modal('Partager le courant','VANNE DE LA RIVIÈRE','<p>Les trois conduites apportent 1, 2 ou 4 seaux par tour. La roue en demande exactement 5. Ouvre les conduites utiles, puis essaie la roue.</p><div class="valves">'+values.map((n,i)=>'<button class="secondary" data-valve="'+i+'" aria-pressed="'+Boolean(m.mask & (1<<i))+'">'+n+' '+(n===1?'seau':'seaux')+'<br>'+((m.mask & (1<<i))?'Ouverte':'Fermée')+'</button>').join('')+'</div><p id="flow" aria-live="polite"></p><div class="row"><button class="primary" id="testWheel">Essayer la roue</button><button class="secondary" id="readGate">Écouter</button></div>');
 const total=values.reduce((v,n,i)=>v+((m.mask & (1<<i))?n:0),0);
 $('flow').textContent='Débit actuel : '+total+' / 5 seaux par tour.';
 $('readGate').onclick=()=>speak($('modalBody').textContent);
 document.querySelectorAll('[data-valve]').forEach(b=>b.onclick=()=>{m.mask^=1<<Number(b.dataset.valve);sfx('click');saveGame(false);gatePanel()});
 $('testWheel').onclick=()=>{
   if(m.stage!==2)return;
   recordPractice('mill-flow',total===5);
   if(total!==5){m.errors++;$('flow').textContent=m.errors>=3?'Essaie la grande conduite de 4 avec la petite de 1.':m.errors===2?'Pars de 4 seaux. Combien en manque-t-il pour arriver à 5 ?':total<5?'La roue hésite. Il manque de l’eau.':'La roue déborde. Ferme une conduite.';saveGame(false);return}
   m.stage=3;Object.values(S.crops).forEach(c=>c.watered=true);give({seed:4,emerald:2});S.xp+=60;
   if(millStream)millStream.visible=true;
   saveGame(false);sfx('success');
   millMessage('L’eau revient au jardin !','La rivière fait tourner la roue. Les quatre graines de Zoé sont dans ton sac. Au jardin de Lila, le moulin arrose maintenant chaque nouvelle plantation.','Voir le moulin tourner',closeModal);
 };
}

