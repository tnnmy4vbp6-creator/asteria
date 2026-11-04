const fieldActors=[];
function buildField(){
 for(const entry of FIELD_GUIDE){
  const g=new THREE.Group();
  const y=entry.id==='fossil'?3:world.heights[Math.floor(entry.x)+VW*Math.floor(entry.z)]+1;
  g.position.set(entry.x,y,entry.z);scene.add(g);
  const body=new THREE.Group();g.add(body);
  let wings=[];
  if(entry.id==='fossil'){
    meshBox(body,0,.24,0,.82,.46,.6,0x75634f);
    for(let i=0;i<11;i++){
      const angle=i*.63,r=.035+i*.019;
      meshBox(body,r*Math.cos(angle),.27+r*Math.sin(angle),.315,.085,.08,.04,0xe4c590);
    }
  }else{
    const moth=entry.id==='moth';
    meshBox(body,0,0,0,.22,.22,moth?.47:.42,moth?0x9fada2:0xe7b441);
    if(!moth)for(const z of [-.11,.08])meshBox(body,0,0,z,.225,.225,.061,0x59472c);
    for(const side of [-1,1]){
      const wing=new THREE.Group();body.add(wing);wings.push(wing);
      meshBox(wing,side*(moth?.28:.13),.06,0,moth?.55:.28,.035,moth?.36:.22,moth?0x92d4cd:0xc5e9e2);
      if(moth)meshBox(wing,side*.46,.085,-.02,.1,.035,.12,0xe4ca85);
    }
  }
  const actor={kind:'field',id:entry.id,entry,group:g,pos:g.position,body,wings,label:entry.action};
  interactive.push(actor);fieldActors.push(actor);
 }
}
function animateField(night){
 for(const a of fieldActors){
   a.group.visible=a.id!=='moth'||night;
   if(!a.wings.length)continue;
   a.body.position.set(Math.sin(elapsed*.85)*.7,1.25+Math.cos(elapsed*1.8)*.2,Math.cos(elapsed*.8)*.45);
   a.body.rotation.y=elapsed*.7;
   a.wings.forEach((wing,i)=>wing.rotation.z=Math.sin(elapsed*13)*(i?1:-1)*.6);
 }
}
function observe(entry){
 const key='field:'+entry.id,first=!S.journal.includes(key);
 if(first){S.journal.push(key);S.xp+=12;saveGame(false);sfx('success')}
 const count=FIELD_GUIDE.filter(e=>S.journal.includes('field:'+e.id)).length;
 modal(entry.name,'CARNET DE TERRAIN · '+count+' / '+FIELD_GUIDE.length,'<p class="speech">'+entry.story+'</p><div class="row"><button class="primary" id="fieldReturn">Revenir au monde</button><button class="secondary" id="fieldRead">Écouter</button></div>');
 $('fieldReturn').onclick=closeModal;$('fieldRead').onclick=()=>speak(entry.story);
}

