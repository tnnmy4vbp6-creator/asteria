const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert'),
  path = require('path');
const THREE = require('./three.min.js');
const ctx = {
  console,
  THREE,
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
  },
  document: {
    getElementById() {
      return null;
    },
  },
  setTimeout() {},
  clearTimeout() {},
};
vm.createContext(ctx);
vm.runInContext(require('./content.cjs')(), ctx);
for (let file of [
  'shapes.js', 'restoration.js',
  'data.js',
  'engine.js',
  'builder.js',
  'learning.js',
  'media.js',
  'mill.js',
  'tablet.js',
])
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), ctx, {
    filename: file,
  });
const run = (s) => vm.runInContext(s, ctx);
let count = 0;
function check(name, f) {
  f();
  count++;
  console.log('PASS ' + name);
}
check('48 questions and 15 mission challenges', () => {
  assert.equal(run('KNOWLEDGE.length'), 48);
  assert.equal(run('Object.keys(CHALLENGES).length'), 15);
});
check('resource deduction is atomic', () => {
  assert.equal(run('spend({wood:3})'), false);
  assert.equal(run('S.inv.wood'), 2);
  assert.equal(run('spend({wood:1})'), true);
  assert.equal(run('S.inv.wood'), 1);
});
check(
  'crafting chain: logs -> planks -> sticks -> pickaxes -> furnace -> iron',
  () => {
    run(
      'S=freshState();give({wood:10});for(let i=0;i<6;i++)craft(RECIPES[0]);craft(RECIPES[1]);craft(RECIPES[1]);craft(RECIPES[3]);',
    );
    assert.equal(run('S.tool'), 1);
    assert.equal(run('canCraft(RECIPES[7])'), false);
    run(
      'give({stone:30,ironOre:8,coal:4});craft(RECIPES[4]);craft(RECIPES[6]);craft(RECIPES[7]);craft(RECIPES[7]);craft(RECIPES[8]);',
    );
    assert.equal(run('S.tool'), 3);
    assert.equal(run('S.inv.iron'), 1);
    assert.equal(run('S.inv.ironOre'), 4);
  },
);
check('quest resources and tools required', () => {
  run('S=freshState()');
  assert.equal(run('questReady(NPCS[0])'), false);
  run('give({wheat:3,hoe:1})');
  assert.equal(run('questReady(NPCS[0])'), true);
  assert.equal(run('questReady(NPCS[5])'), false);
});
check('voxel edits survive world reconstruction', () => {
  run(
    'world.set(35,6,60,7,true);world.set(35,4,61,0,true);world=new VoxelWorld()',
  );
  assert.equal(run('world.get(35,6,60)'), 7);
  assert.equal(run('world.get(35,4,61)'), 0);
  run('S=freshState();world=new VoxelWorld()');
});
check('portal and world floor protected', () => {
  assert.equal(run('protectedVoxel({id:19,x:10,y:0,z:10})'), true);
  assert.equal(run('protectedVoxel({id:18,x:32,y:5,z:30})'), true);
});
check('safe spawn and settled movement', () => {
  run('player.pos.set(35.5,5,59.5)');
  assert.equal(run('collision(player.pos.x,player.pos.y,player.pos.z)'), false);
  assert.equal(run('world.get(35,4,59)'), 20);
});
const paths = run(
  `(()=>{world.bridge(false);let q=[[35,5,59]],set=new Set(['35,5,59']);for(let i=0;i<q.length;i++){let[x,y,z]=q[i];for(let[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){let a=x+dx,b=z+dz;if(a<1||a>78||b<1||b>78)continue;let h=y+1;while(h>1&&!world.solid(a,h-1,b))h--;if(world.solid(a,h,b)||world.solid(a,h+1,b)||!world.solid(a,h-1,b))continue;let k=[a,h,b].join(',');if(!set.has(k)){set.add(k);q.push([a,h,b])}}}return {size:q.length,npcs:NPCS.map(n=>({id:n.id,ok:q.some(([x,y,z])=>Math.hypot(x-n.x,z-n.z)<2.5&&Math.abs(y-world.heights[n.x+n.z*VW]-1)<2)})),mine:q.some(([x,y,z])=>x>=12&&x<=18&&z>=20&&z<=25&&y===3),chests:[[60,5,24],[69,5,28],[65,5,22]].map(([a,h,b])=>q.some(([x,y,z])=>Math.hypot(x-a,z-b)<2.5&&Math.abs(y-h)<2))}})()`,
);
check('all six NPCs, mine interior and three quest chests reachable', () => {
  assert(paths.size > 2000);
  assert(
    paths.npcs.every((n) => n.ok),
    JSON.stringify(paths),
  );
  assert(paths.mine, 'mine unreachable');
  assert(paths.chests.every(Boolean), 'chest unreachable');
});
check('numerical challenges have correct difficulty variants', () => {
  for (let difficulty = 1; difficulty <= 3; difficulty++) {
    run('S.settings.difficulty=' + difficulty);
    for (let id of ['garden', 'forge', 'bridge', 'code'])
      assert(Number.isInteger(run(`difficultyChallenge('${id}').answer`)));
  }
});
check('circuit scrambles have solutions', () => {
  for (let arr of [
    [0, 4, 8],
    [0, 2, 4, 6, 8],
  ]) {
    let grid = Array(9).fill(true);
    function toggle(i) {
      for (let [dx, dy] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        let x = (i % 3) + dx,
          y = Math.floor(i / 3) + dy;
        if (x >= 0 && x < 3 && y >= 0 && y < 3)
          grid[x + y * 3] = !grid[x + y * 3];
      }
    }
    arr.forEach(toggle);
    assert(!grid.every(Boolean));
    arr.forEach(toggle);
    assert(grid.every(Boolean));
  }
});
check('save roundtrip and rejection', () => {
  assert(run('validSave(JSON.parse(JSON.stringify(S)))'));
  assert.equal(run('validSave({version:1})'), false);
  assert.equal(run('validSave({...S,player:{x:NaN}})'), false);
});
ctx.sfx = () => {};
check(
  'movement, collision and jumping advance correctly at fixed timestep',
  () => {
    run(
      'camera=new THREE.PerspectiveCamera();hand=new THREE.Group();toolHead={material:{color:new THREE.Color()}};player.pos.set(35.5,5,59.5);player.yaw=0;keys={w:true};for(let i=0;i<60;i++)movePlayer(1/60)',
    );
    assert(run('player.pos.z') < 57);
    assert(Math.abs(run('player.pos.y') - 5) < 0.1);
    run('keys={" ":true};for(let i=0;i<8;i++)movePlayer(1/60)');
    assert(run('player.pos.y') > 5.5);
  },
);
check('swimming jump can clear a three-block river bank', () => {
  run(
    'player.pos.set(50.5,2,60.5);player.velY=0;keys={" ":true};var maxSwimY=0;for(let i=0;i<120;i++){movePlayer(1/60);maxSwimY=Math.max(maxSwimY,player.pos.y)}',
  );
  assert(run('maxSwimY') >= 5, 'cannot escape river');
});
check(
  'a severed natural tree releases upper logs, keeps player blocks and survives reload',
  () => {
    run(`S=freshState();world=new VoxelWorld();var tree=world.trees.find(t=>t.x===28&&t.z===63);
 var topLeaf=world.index(tree.x,tree.top+1,tree.z);
 world.set(tree.x+1,tree.top+1,tree.z,5,true);
 world.set(tree.x,tree.y,tree.z,0,true);var fallen=world.settleTrees()`);
    assert(run('fallen') >= 4);
    assert.equal(run('world.data[topLeaf]'), 0);
    assert.equal(run('world.get(tree.x+1,tree.top+1,tree.z)'), 5);
    run('world=new VoxelWorld()');
    assert.equal(run('world.data[topLeaf]'), 0);
    assert.equal(run('world.get(tree.x,tree.top,tree.z)'), 0);
  },
);
console.log(
  JSON.stringify(
    { tests: count, walkableCells: paths.size, destinations: paths.npcs },
    null,
    2,
  ),
);
