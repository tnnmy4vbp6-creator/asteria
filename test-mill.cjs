const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {parseHTML}=require('linkedom'),THREE=require('./three.min.js');
const {document}=parseHTML(fs.readFileSync(__dirname+'/shell.html','utf8'));
document.defaultView.HTMLElement.prototype.focus=function(){};
const saved=new Map();
const ctx=vm.createContext({THREE,document,window:document.defaultView,console,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},setTimeout(){},clearTimeout(){}});
for(const file of ['data','engine','ui','mill','learning','media','tablet'])vm.runInContext(fs.readFileSync(__dirname+'/'+file+'.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),click=id=>document.getElementById(id).onclick();
function check(name,fn){fn();console.log('PASS '+name)}
run('S.settings.sound=false');
check('repair refuses missing planks, then charges four exactly once',()=>{
 run('useMill("zoe")');click('millGo');assert.equal(run('S.mill.stage'),1);
 run('useMill("wheel")');assert.match(document.getElementById('millGo').textContent,/recettes/);
 run('give({plank:4});useMill("wheel")');click('millGo');assert.equal(run('S.inv.plank'),0);assert.equal(run('S.mill.stage'),2);
});
check('incorrect flow persists an error and preserves inventory',()=>{
 run('useMill("gate")');click('testWheel');assert.equal(run('S.practice["mill-flow"].errors'),1);assert.equal(run('S.mill.stage'),2);
});
check('valves, irrigation, reward and restoration after reload',()=>{
 for(const i of [2,0])document.querySelector('[data-valve="'+i+'"]').onclick();
 run('S.crops[0]={watered:false,at:15}');click('testWheel');assert.equal(run('S.crops[0].watered'),true);assert.equal(run('S.mill.stage'),3);
 const data=JSON.parse(saved.get('asteria-world-v2'));assert.equal(data.inv.emerald,2);assert(run('validSave(S)'));run('useMill("gate")');assert.equal(run('S.inv.emerald'),2);
});
check('legacy saves and invalid expedition imports',()=>{
 assert(run('validSave({...S,mill:undefined,practice:undefined,playSeconds:undefined})'));assert(!run('validSave({...S,mill:{stage:5}})'));assert(!run('validSave({...S,practice:{cargo:{level:9}}})'));
});
check('five distinct cargo levels have correct solutions',()=>{
 for(let serial=0;serial<12;serial++){const boxes=2+serial%3,per=2+Math.floor(serial/3)%3,extra=1+serial%2;
 [boxes+1,boxes+per,boxes*per,boxes*per-extra,boxes].forEach((v,k)=>assert.equal(run('cargoOrder('+(k+1)+','+serial+').answer'),v))}
});
check('spaced review after error and recovery without instant promotion',()=>{
 run('recordPractice("cargo",false,10000);recordPractice("cargo",true,20000)');assert.equal(run('S.practice.cargo.next'),620000);assert.equal(run('S.practice.cargo.level'),1);
 run('recordPractice("cargo",true,700000)');assert.equal(run('S.practice.cargo.level'),2);assert.equal(run('S.practice.cargo.next'),700000+2*86400000);
});
check('far chunk meshes released and revisit queued after crossing world',()=>{
 run('S.settings.quality="low";chunkGroup=new THREE.Group();streamTerrain(true);world.dirty.clear();var old=new THREE.Mesh(new THREE.BoxGeometry());chunkMeshes.set("2,3",old);chunkGroup.add(old);player.pos.set(2,5,2);streamTerrain()');
 assert.equal(run('chunkMeshes.size'),0);assert(run('world.dirty.has("0,0")'));assert(!run('streamTerrain.wanted.has("2,3")'));
});

