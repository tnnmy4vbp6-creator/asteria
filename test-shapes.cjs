const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const ctx = vm.createContext({
  THREE: require('./three.min.js'),
  console,
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
for (const file of ['shapes.js', 'restoration.js', 'data.js', 'engine.js', 'builder.js'])
  vm.runInContext(fs.readFileSync(__dirname + '/' + file, 'utf8'), ctx);
const run = (s) => vm.runInContext(s, ctx);
assert.equal(run('BUILD_LIMIT'), 247);
assert.equal(run('new Set([...BUILD_LOOKUP.values()]).size'), 224);
assert(
  run(
    'BUILD_MATERIALS.every(m=>BUILD_SHAPES.every(s=>Array.from({length:s.turns},(_,r)=>buildID(m.key,s.key,r)).every(id=>BLOCKS[id]&&validBuildVoxel(id))))',
  ),
);
assert(
  run(
    "BUILD_SHAPES.filter(s=>s.key!=='cube').every(s=>shapeGeometry(BLOCKS[buildID('plank',s.key)]).attributes.position.array.every(Number.isFinite))",
  ),
);
assert(
  run(
    "shapeIntersects(BLOCKS[buildID('stone','slab')],[.1,.1,.1],[.9,.49,.9])&&!shapeIntersects(BLOCKS[buildID('stone','slab')],[.1,.6,.1],[.9,.9,.9])",
  ),
);
assert(
  run(
    "shapeIntersects(BLOCKS[buildID('stone','slab',1)],[.1,.6,.1],[.9,.9,.9])&&!shapeIntersects(BLOCKS[buildID('stone','slab',1)],[.1,.1,.1],[.9,.4,.9])",
  ),
);
assert(
  run(
    "shapeIntersects(BLOCKS[buildID('stone','stairs')],[.1,.6,.1],[.9,.9,.4])&&!shapeIntersects(BLOCKS[buildID('stone','stairs')],[.1,.6,.6],[.9,.9,.9])",
  ),
);
assert(
  run(
    "!shapeIntersects(BLOCKS[buildID('stone','cylinder')],[0,0,0],[.1,1,.1])&&shapeIntersects(BLOCKS[buildID('stone','cylinder')],[.4,0,.4],[.6,1,.6])",
  ),
);
assert(
  run("!shapeIntersects(BLOCKS[buildID('stone','sphere')],[0,0,0],[.1,.1,.1])"),
);
assert(
  run(
    "pickShape(BLOCKS[buildID('stone','slab')],new THREE.Vector3(.5,.75,2),new THREE.Vector3(0,0,-1))===null",
  ),
);
assert(
  run(
    "Math.abs(pickShape(BLOCKS[buildID('stone','slab')],new THREE.Vector3(.5,2,.5),new THREE.Vector3(0,-1,0)).d-1.5)<1e-5",
  ),
);
assert(
  run(
    "pickShape(BLOCKS[buildID('stone','wedge')],new THREE.Vector3(.5,2,.5),new THREE.Vector3(0,-1,0)).normal.y>.7",
  ),
);
assert.deepEqual(
  Array.from(
    run(
      "BUILD_PROJECTS.map(p=>builderCells({...p,shape:'cube',rotation:0,mirror:false},{x:0,y:0,z:0}).length)",
    ),
  ),
  [12, 11, 27, 35, 20, 62],
);
assert(
  run(
    '(()=>{const old=JSON.parse(JSON.stringify(S));delete old.builder;return validSave(old)&&validSave(S)})()',
  ),
);
assert(
  run(
    "(()=>{const s=JSON.parse(JSON.stringify(S));s.edits[7000]=buildID('mosaic','sphere');s.builder.material='mosaic';s.builder.shape='sphere';return validSave(s)})()",
  ),
);
assert(
  run(
    '(()=>{const s=JSON.parse(JSON.stringify(S));s.edits[7000]=255;return !validSave(s)})()',
  ),
);
console.log(
  'PASS stable shape IDs, geometry, partial collisions, precise ray hits, project counts and legacy saves',
);
