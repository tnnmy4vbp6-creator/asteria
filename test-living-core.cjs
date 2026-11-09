const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const ctx = vm.createContext({
  console,
  THREE: require('./three.min.js'),
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
});
vm.runInContext(require('./content.cjs')(), ctx);
for (const file of [
  'shapes.js',
  'restoration.js',
  'living-rules.js',
  'data.js',
  'engine.js',
])
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
const run = (source) => vm.runInContext(source, ctx);
let tests = 0;
function check(name, fn) {
  fn();
  tests++;
  console.log('PASS ' + name);
}
run(`
 const valleyTestData=new Map();
 function testGet(x,y,z){return y===4?1:valleyTestData.get(x+','+y+','+z)||0;}
 function testSet(x,y,z,id){valleyTestData.set(x+','+y+','+z,id);}
 function exampleBuilding(i,w,d,doorSide=0){
   valleyTestData.clear();const p=LIVING_PLOTS[i],c={width:w,depth:d};
   for(let x=0;x<w;x++)for(let z=0;z<d;z++){
     testSet(p.x+x,5,p.z+z,3);testSet(p.x+x,8,p.z+z,i===1?16:7);
     if(x===0||z===0||x===w-1||z===d-1){testSet(p.x+x,6,p.z+z,7);testSet(p.x+x,7,p.z+z,8);}
   }
   const doors=[[2,d-1],[0,2],[w-1,2],[2,0]],q=doors[doorSide];
   for(let y=6;y<=7;y++)testSet(p.x+q[0],y,p.z+q[1],0);
   return inspectLivingPlot(i,c,testGet);
 }
`);
check('different sizes, materials and all four door sides remain valid', () => {
  for (let i = 0; i < 3; i++)
    for (const [w, d] of [
      [5, 6],
      [6, 5],
      [7, 7],
    ])
      for (let side = 0; side < 4; side++)
        assert.equal(run(`exampleBuilding(${i},${w},${d},${side}).ok`), true);
});
check(
  'floating floor, roof hole, blocked entrance, solid interior and dim greenhouse rejected',
  () => {
    assert.equal(
      run(
        `exampleBuilding(0,5,5);testSet(27,8,44,0);inspectLivingPlot(0,{width:5,depth:5},testGet).ok`,
      ),
      false,
    );
    assert.equal(
      run(
        `exampleBuilding(0,5,5);testSet(27,6,47,7);inspectLivingPlot(0,{width:5,depth:5},testGet).ok`,
      ),
      false,
    );
    assert.equal(
      run(
        `exampleBuilding(0,5,5);testSet(27,6,44,7);inspectLivingPlot(0,{width:5,depth:5},testGet).ok`,
      ),
      false,
    );
    assert.equal(
      run(
        `exampleBuilding(1,5,5);for(let x=43;x<48;x++)for(let z=42;z<47;z++)testSet(x,8,z,7);inspectLivingPlot(1,{width:5,depth:5},testGet).ok`,
      ),
      false,
    );
    assert.equal(
      run(
        `exampleBuilding(0,5,5);inspectLivingPlot(0,{width:5,depth:5},(x,y,z)=>y===4?0:testGet(x,y,z)).ok`,
      ),
      false,
    );
    assert.equal(run(`exampleBuilding(2,5,5).ok`), false);
  },
);
check(
  'all 18 solver-generated cargo variants validate, incorrect or negative loads fail',
  () => {
    assert.equal(run(`LIVING_CONTENT.challenges.cargo.length`), 18);
    assert.equal(
      run(
        `LIVING_CONTENT.challenges.cargo.every(c=>livingCargoValid(c,c.solution))`,
      ),
      true,
    );
    assert.equal(
      run(
        `LIVING_CONTENT.challenges.cargo.some(c=>livingCargoValid(c,c.solution.map(v=>[-1,v[1]])))`,
      ),
      false,
    );
    assert.equal(
      run(
        `LIVING_CONTENT.challenges.cargo.some(c=>livingCargoValid(c,c.solution.map(v=>[v[0]+1,v[1]])))`,
      ),
      false,
    );
  },
);
check(
  'English routes are walkable, commands reach the destination, all pipes have a solution',
  () => {
    assert.equal(
      run(
        `LIVING_CONTENT.challenges.forest.every(c=>{let p=c.start.slice(),f=0;for(const command of c.commands){if(command==='left')f=(f+3)%4;else if(command==='right')f=(f+1)%4;else{const q=[[0,-1],[1,0],[0,1],[-1,0]][f];p=p.map((n,i)=>n+q[i]);if(p.some(n=>n<0||n>4)||c.blocked.some(q=>q.join()==p.join()))return false;}}return p.join()===c.end.join();})`,
      ),
      true,
    );
    assert.equal(
      run(
        `LIVING_CONTENT.challenges.volcano.every(c=>livingTracePipes(c,Array(9).fill(0)).ok)`,
      ),
      true,
    );
    assert.equal(
      run(
        `LIVING_CONTENT.challenges.volcano.some(c=>livingTracePipes(c,c.rotations).ok)`,
      ),
      false,
    );
  },
);
check(
  'production needs water and functional buildings, has capacity and no offline fast forward',
  () => {
    run(
      `var ls=freshLivingState(),reports=[{ok:true,capacity:9},{ok:true,capacity:9},{ok:true,capacity:12}];ls.water=90;`,
    );
    assert.equal(run(`livingProduction(ls,reports,100000);ls.growth`), 1);
    run(`for(let i=0;i<44;i++)livingProduction(ls,reports,1);`);
    assert.equal(run('ls.stock.food'), 12);
    run(
      `reports[1].ok=false;for(let i=0;i<100;i++)livingProduction(ls,reports,1);`,
    );
    assert.equal(run('ls.stock.food'), 12);
    run(`reports[1].ok=true;ls.stock.food=36;livingProduction(ls,reports,1);`);
    assert.equal(run('ls.growth'), 0);
  },
);
check(
  'pathfinding uses the door and never crosses walls; sealed rooms are unreachable',
  () => {
    run('exampleBuilding(0,5,5)');
    assert(run(`livingPath(testGet,[27.5,49.5],[26.5,43.5]).length`) > 0);
    run('testSet(27,6,46,7)');
    assert.equal(run(`livingPath(testGet,[27.5,49.5],[26.5,43.5]).length`), 0);
  },
);
check('night demands shelter, continuous coverage and correct circuit', () => {
  assert.equal(
    run(
      'livingNightReady([{ok:true}], [true,true,true,true,true],[true,true,false]).ok',
    ),
    true,
  );
  for (const expr of [
    '[{ok:false}], [true,true,true,true,true],[true,true,false]',
    '[{ok:true}], [true,false,false,false,true],[true,true,false]',
    '[{ok:true}], [true,true,true,true,true],[true,true,true]',
  ])
    assert.equal(run('livingNightReady(' + expr + ').ok'), false);
});
check(
  'adaptation reaches three tiers, hints prevent automatic promotion, errors reduce level',
  () => {
    run(
      `ls=freshLivingState();for(let i=0;i<5;i++)livingAttempt(ls,'cargo',true);`,
    );
    assert.equal(run(`livingTier(ls,'cargo')`), 3);
    const before = run(`ls.mastery.cargo`);
    run(`livingAttempt(ls,'cargo',true,true)`);
    assert.equal(run(`ls.mastery.cargo`), before);
    run(`livingAttempt(ls,'cargo',false)`);
    assert.equal(run(`ls.mastery.cargo`), before - 1);
  },
);
check(
  'legacy saves migrate, new saves roundtrip, hostile fields and simultaneous worlds rejected',
  () => {
    assert.equal(run(`validSave(freshState())`), true);
    assert.equal(
      run(
        `(()=>{const s=freshState();delete s.living;return validSave(s);})()`,
      ),
      true,
    );
    assert.equal(
      run(
        `(()=>{const s=freshState();s.living.active=true;s.ember.active=true;return validSave(s);})()`,
      ),
      false,
    );
    for (const mutation of [
      's.living.edits[999999]=7',
      's.living.plots[0].width=99',
      's.living.stock.food=-1',
      's.living.pose={x:NaN,y:5,z:3,yaw:0,pitch:0}',
      's.living.mastery.bad=2',
    ])
      assert.equal(
        run(`(()=>{const s=freshState();${mutation};return validSave(s);})()`),
        false,
      );
  },
);
console.log(`${tests} valley rule suites passed.`);
