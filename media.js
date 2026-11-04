const terrainSkins={1:['grass','grass_side','dirt'],2:'dirt',3:'stone',4:['tree_top','tree','tree_top'],5:'leaves',6:'sand',7:'wood',8:'stone_brick',9:'mineral_coal',10:'mineral_iron',15:'snow',17:'brick',22:'cactus_side'};
async function dressTerrain(texture){
  const names=[...new Set(Object.values(terrainSkins).flat())];
  const images=new Map(await Promise.all(names.map(async name=>{
    const image=new Image();image.src='./assets/textures/'+name+'.png';await image.decode();return [name,image];
  })));
  const ctx=texture.image.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(const [key,skin] of Object.entries(terrainSkins)){
    const id=Number(key);
    for(let face=0;face<3;face++){
      const tile=(id-1)*3+face,x=tile%16*16,y=Math.floor(tile/16)*16;
      if(id===9||id===10)ctx.drawImage(images.get('stone'),x,y,16,16);
      if(id===1&&face===1)ctx.drawImage(images.get('dirt'),x,y,16,16);
      ctx.drawImage(images.get(Array.isArray(skin)?skin[face]:skin),x,y,16,16);
    }
  }
  texture.needsUpdate=true;
}
let villageMusic;
function updateMusic(active){
  if(!S.settings.music||!active){villageMusic?.pause();return}
  if(!villageMusic){villageMusic=new Audio('./assets/music/port-town.ogg');villageMusic.loop=true;villageMusic.volume=.14}
  villageMusic.play().catch(()=>{});
}
const samples=new Map();
let stepVariant=0;
function playSample(type){
  const sounds={mine:target?.id===4?'dig_choppy.1':'dig_cracky.1',place:'place_node.1',step:'grass_footstep.'+(1+stepVariant%2)};
  const name=sounds[type];if(!name||typeof Audio==='undefined')return false;
  if(type==='step')stepVariant++;
  if(!samples.has(name))samples.set(name,new Audio('./assets/sounds/'+name+'.ogg'));
  const a=samples.get(name);if(!a.canPlayType('audio/ogg'))return false;
  a.volume=type==='step'?.17:.35;a.currentTime=0;a.play().catch(()=>{});return true;
}

