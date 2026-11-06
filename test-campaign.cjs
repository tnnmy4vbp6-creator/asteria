const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert'),
  path = require('path'),
  { parseHTML } = require('linkedom'),
  THREE = require('./three.min.js');
const { document, window } = parseHTML(
  fs.readFileSync(path.join(__dirname, 'shell.html'), 'utf8'),
);
window.HTMLElement.prototype.focus = function () {};
window.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({}, { get: () => () => {} });
};
document.exitPointerLock = () => {};
let timers = [],
  saved = new Map();
const math = Object.create(Math);
math.random = () => 0.3;
const ctx = {
  console,
  document,
  window,
  THREE,
  Math: math,
  localStorage: {
    getItem: (k) => saved.get(k) || null,
    setItem: (k, v) => saved.set(k, v),
  },
  setTimeout: (f, t) => {
    timers.push({ f, t });
    return timers.length;
  },
  clearTimeout() {},
  innerWidth: 1280,
  innerHeight: 800,
  location: { reload() {} },
  Blob,
  URL,
};
vm.createContext(ctx);
vm.runInContext(require('./content.cjs')(), ctx);
for (let file of [
  'shapes.js',
  'data.js',
  'engine.js',
  'builder.js',
  'learning.js',
  'media.js',
  'mill.js',
  'tablet.js',
  'ui.js',
  'ember.js',
])
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), ctx, {
    filename: file,
  });
let run = (s) => vm.runInContext(s, ctx);
run(
  'scene=new THREE.Scene();camera=new THREE.PerspectiveCamera();renderer={domElement:{focus(){}}};S.settings.sound=false;',
);
let $ = (id) => document.getElementById(id),
  click = (id) => {
    assert($(id), 'missing ' + id);
    assert.equal(typeof $(id).onclick, 'function', 'no handler ' + id);
    $(id).onclick({ preventDefault() {} });
  };
let tests = 0;
function check(name, f) {
  f();
  tests++;
  console.log('PASS ' + name);
}
check(
  'farming requires a hoe, consumes seeds, watering and maturity yield wheat',
  () => {
    run('playing=true;paused=false;nearObject={kind:"crop",id:0};interact()');
    assert.equal(run('Object.keys(S.crops).length'), 0);
    run('give({hoe:1});interact()');
    assert.equal(run('S.inv.seed'), 5);
    assert.equal(run('S.crops[0].watered'), false);
    run('interact()');
    assert.equal(run('S.crops[0].watered'), true);
    run('S.time+=36;interact()');
    assert.equal(run('S.inv.wheat'), 1);
    assert.equal(run('S.inv.seed'), 7);
    run('playing=false');
  },
);
check('treasure may be opened only once', () => {
  run(
    'playing=true;paused=false;nearObject={kind:"treasure",id:"test",loot:{rune:1},group:{visible:true}};interact();interact();',
  );
  assert.equal(run('S.inv.rune'), 1);
  run('playing=false');
});
check('storage deposits and retrieves full stacks', () => {
  run('chestUI({x:1,y:5,z:1})');
  document.querySelector('[data-deposit="wood"]').onclick();
  assert.equal(run('S.inv.wood'), 0);
  document.querySelector('[data-withdraw="wood"]').onclick();
  assert.equal(run('S.inv.wood'), 2);
});
check(
  'mining respects tool level and does not duplicate a removed block',
  () => {
    run(
      'playing=false;world.set(10,4,22,10);target={x:10,y:4,z:22,id:10};mine(5)',
    );
    assert.equal(run('world.get(10,4,22)'), 10);
    run('give({stonepick:1});mine(5)');
    assert.equal(run('world.get(10,4,22)'), 0);
    assert.equal(run('S.inv.ironOre'), 1);
    run('mine(5)');
    assert.equal(run('S.inv.ironOre'), 1);
  },
);
check('placing a block spends one item and cannot overwrite itself', () => {
  run(
    'playing=true;paused=false;player.pos.set(35.5,5,59.5);S.selected=1;target={prev:{x:36,y:6,z:60}};world.set(36,6,60,0);placeBlock()',
  );
  assert.equal(run('world.get(36,6,60)'), 4);
  assert.equal(run('S.inv.wood'), 1);
  run('placeBlock()');
  assert.equal(run('S.inv.wood'), 1);
  run('playing=false');
});
check('sleep restores energy and advances to morning', () => {
  run(
    'playing=true;paused=false;nearObject=null;target={id:23};S.health=40;S.energy=30;interact()',
  );
  assert.equal(run('S.health'), 100);
  assert.equal(run('S.energy'), 100);
  assert.equal(run('S.time%720'), 60);
  run('playing=false');
});
function solve(c) {
  switch (c.type) {
    case 'number':
      $('numberInput').value = String(c.answer);
      document.getElementById('numberForm').onsubmit({ preventDefault() {} });
      break;
    case 'choice':
      document.querySelector(`[data-choice="${c.answer}"]`).onclick();
      break;
    case 'order':
      for (let text of c.answer) {
        let b = [...document.querySelectorAll('[data-order]')].find(
          (b) => b.textContent === text,
        );
        assert(b);
        b.onclick();
      }
      break;
    case 'route':
      document.querySelector('[data-route="34"]').onclick();
      break;
    case 'circuit':
      for (let i of [0, 4, 8])
        document.querySelector(`[data-light="${i}"]`).onclick();
      break;
    case 'memory':
      click('replayMemory');
      let ts = timers;
      timers = [];
      ts.sort((a, b) => a.t - b.t).forEach((t) => t.f());
      for (let i = 0; i < 5; i++)
        document.querySelector('[data-mem="1"]').onclick();
      break;
    default:
      throw Error(c.type);
  }
  assert(
    !$('nextChallenge').classList.contains('hidden'),
    'challenge not solved: ' + c.title,
  );
  click('nextChallenge');
}
check(
  'wrong answer gives a hint without advancing or removing resources',
  () => {
    run('showChallenge(difficultyChallenge("garden"),()=>{},"TEST")');
    let before = run('JSON.stringify(S.inv)');
    $('numberInput').value = '1';
    document.getElementById('numberForm').onsubmit({ preventDefault() {} });
    assert($('feedback').textContent.length > 10);
    assert($('nextChallenge').classList.contains('hidden'));
    assert.equal(run('JSON.stringify(S.inv)'), before);
  },
);
check(
  'complete campaign: five deliveries, all fifteen puzzles, rewards and portal',
  () => {
    run(
      'S=freshState();S.settings.sound=false;give({hoe:1,wheat:3,iron:4,stonepick:1,furnace:1,plank:12,rune:3,ironpick:1,crystal:3});',
    );
    for (let i = 0; i < 5; i++) {
      run(`talk(NPCS[${i}])`);
      click('beginTrial');
      assert.equal(run(`S.quests[NPCS[${i}].id].started`), true);
      for (let j = 0; j < 3; j++) {
        let c = run(`difficultyChallenge(NPCS[${i}].puzzles[${j}])`);
        solve(c);
      }
      assert.equal(run(`S.quests[NPCS[${i}].id].done`), true);
      click('questContinue');
    }
    assert.equal(run('S.bridge'), true);
    assert.equal(run('S.journal.length'), 15);
    run('talk(NPCS[5])');
    click('awaken');
    assert.equal(run('S.won'), true);
    assert.equal(run('S.quests.atlas.done'), true);
  },
);
check('mission reopening never deducts the delivery twice', () => {
  run('S=freshState();S.settings.sound=false;give({plank:24});talk(NPCS[2])');
  click('beginTrial');
  assert.equal(run('S.inv.plank'), 12);
  run('closeModal();talk(NPCS[2])');
  click('beginTrial');
  assert.equal(run('S.inv.plank'), 12);
});
check('save roundtrip includes started quest stage', () => {
  run('saveGame(false)');
  let s = JSON.parse(saved.get('asteria-world-v2'));
  assert.equal(s.quests.nora.started, true);
  assert.equal(s.quests.nora.stage, 0);
  assert.equal(s.inv.plank, 12);
});
check('encyclopedia awards and records a discovery', () => {
  run('knowledgeQuestion("science")');
  document.querySelector('[data-choice="0"]').onclick();
  click('nextChallenge');
  assert.equal(run('S.learned.length'), 1);
  assert(run('S.inv.emerald') >= 1);
});
check('corrupt saves rejected', () => {
  assert.equal(run('validSave({...S,crops:{0:null}})'), false);
  assert.equal(run('validSave({...S,selected:9})'), false);
  assert.equal(run('validSave({...S,inv:{evil:4}})'), false);
  assert.equal(run('validSave({...S,chests:{x:{wood:-2}}})'), false);
});
console.log('Campaign tests passed: ' + tests);
