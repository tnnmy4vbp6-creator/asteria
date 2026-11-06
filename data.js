'use strict';
const $ = (id) => document.getElementById(id);
let profile = { slot: 0, mode: 'adventure' };
try {
  const v = JSON.parse(localStorage.getItem('asteria-profile'));
  if (
    v &&
    [0, 1, 2].includes(v.slot) &&
    ['adventure', 'creative'].includes(v.mode)
  )
    profile = v;
} catch {}
const SAVE_KEY =
  profile.slot === 0 && profile.mode === 'adventure'
    ? 'asteria-world-v2'
    : 'asteria-world-' + profile.slot + '-' + profile.mode;
let replacingSave = false;

function freshState() {
  return {
    version: 2,
    builder: { active:false, material:'plank', shape:'cube', rotation:0, pattern:'single', width:3, depth:3, height:3, mirror:false, supplied:false, completed:[], sites:null, project:-1 },
    ember: { active: false, bridge: 0, cooled: false, route: 0, hits: 0, charged: false, assisted: true, edits: {} },
    temple: { site: -1, mask: 6, open: false, moon: 0 },
    mill: { stage: 0, mask: 0, errors: 0 },
    practice: {},
    playSeconds: 0,
    voyageGuide: false,
    player: { x: 35.5, y: 6, z: 59.5, yaw: 0, pitch: 0 },
    inv: { wood: 2, apple: 4, seed: 6 },
    quests: {},
    edits: {},
    crops: {},
    notes: {},
    chests: {},
    opened: [],
    journal: [],
    learned: [],
    xp: 0,
    health: 100,
    energy: 100,
    time: 120,
    tracked: 'lila',
    hotbar: [
      'pickaxe',
      'wood',
      'plank',
      'stone',
      'dirt',
      'brick',
      'torch',
      'apple',
    ],
    selected: 0,
    tool: 0,
    bridge: false,
    won: false,
    creative: profile.mode === 'creative',
    settings: {
      difficulty: 2,
      sound: true,
      music: false,
      sensitivity: 1,
      quality: 'auto',
      peaceful: true,
    },
    stats: { mined: 0, placed: 0, crafted: 0, harvest: 0 },
    streak: 0,
    level: 2,
  };
}
let S = freshState(),
  loadNotice = '';
function validSave(s) {
  const obj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
    int = (v, max = 100000) => Number.isInteger(v) && v >= 0 && v < max;
  const bag = (v) =>
    obj(v) &&
    Object.entries(v).every(([k, n]) => Object.hasOwn(ITEMS, k) && int(n));
  try {
    return !!(
      s &&
      s.version === 2 &&
      (s.builder===undefined || (obj(s.builder) && ['active','mirror','supplied'].every(k=>typeof s.builder[k]==='boolean') && BUILD_MATERIALS.some(m=>m.key===s.builder.material) && BUILD_SHAPES.some(v=>v.key===s.builder.shape) && int(s.builder.rotation,4) && ['single','line','floor','wall','solid','arch','pyramid','tower','roof'].includes(s.builder.pattern) && ['width','depth','height'].every(k=>Number.isInteger(s.builder[k])&&s.builder[k]>=1&&s.builder[k]<=7) && Array.isArray(s.builder.completed) && s.builder.completed.every(i=>int(i,6)) && Number.isInteger(s.builder.project)&&s.builder.project>=-1&&s.builder.project<6 && (s.builder.sites===null || (Array.isArray(s.builder.sites)&&s.builder.sites.length===4&&s.builder.sites.every(i=>Number.isInteger(i)&&i>=-1&&i<2))))) &&
      (s.ember === undefined || (obj(s.ember) &&
        ['active','cooled','charged','assisted'].every(k => typeof s.ember[k] === 'boolean') &&
        int(s.ember.bridge, 7) && int(s.ember.route, 4) && int(s.ember.hits, 4) &&
        (!s.ember.cooled || s.ember.bridge === 6) && (!s.ember.route || s.ember.cooled) &&
        (!s.ember.hits || s.ember.route === 3) && (!s.ember.charged || (s.ember.route === 3 && s.ember.hits < 3)) &&
        obj(s.ember.edits) && Object.keys(s.ember.edits).length < 15000 &&
        Object.entries(s.ember.edits).every(([k,v]) => int(+k,192000) && (v===0 || BUILD_MATERIALS.some(m=>m.id===v) || (Number.isInteger(v)&&v>=39&&v<BUILD_LIMIT))))) &&
      (s.voyageGuide === undefined || typeof s.voyageGuide === 'boolean') &&
      obj(s.player) &&
      ['x', 'y', 'z', 'yaw', 'pitch'].every((k) =>
        Number.isFinite(s.player[k]),
      ) &&
      (s.temple === undefined || (obj(s.temple) && Number.isInteger(s.temple.site) && s.temple.site >= -1 && s.temple.site < 3 && int(s.temple.mask, 8) && int(s.temple.moon, 8) && typeof s.temple.open === 'boolean')) &&
      (s.mill === undefined ||
        (obj(s.mill) &&
          int(s.mill.stage, 4) &&
          int(s.mill.mask, 8) &&
          int(s.mill.errors, 1e9))) &&
      (s.playSeconds === undefined ||
        (Number.isFinite(s.playSeconds) && s.playSeconds >= 0)) &&
      (s.practice === undefined ||
        (obj(s.practice) &&
          Object.entries(s.practice).every(
            ([id, p]) =>
              (['mill-flow', 'cargo','batch','ember:bridge','ember:forge','ember:route','ember:grammar','ember:science','ember:problem'].includes(id) || /^build:[0-5]$/.test(id) ||
                VOYAGES.some(v => v.steps.some(step => id === 'v:' + v.id + ':' + step.subject)) ||
                /^k:\d+$/.test(id) ||
                (id.startsWith('p:') &&
                  Object.hasOwn(CHALLENGES, id.slice(2)))) &&
              obj(p) &&
              int(p.attempts, 1e9) &&
              int(p.successes, 1e9) &&
              int(p.errors, 1e9) &&
              p.successes + p.errors === p.attempts &&
              int(p.level, 6) &&
              p.level >= 1 &&
              Number.isFinite(p.last) &&
              Number.isFinite(p.next),
          ))) &&
      bag(s.inv) &&
      obj(s.quests) &&
      Object.entries(s.quests).every(
        ([k, q]) =>
          NPCS.some((n) => n.id === k) &&
          obj(q) &&
          typeof q.done === 'boolean' &&
          typeof q.started === 'boolean' &&
          int(q.stage, 4),
      ) &&
      obj(s.edits) &&
      Object.keys(s.edits).length < 50000 &&
      Object.entries(s.edits).every(
        ([k, v]) => int(+k, 192000) && validBuildVoxel(v),
      ) &&
      obj(s.crops) &&
      Object.entries(s.crops).every(
        ([k, c]) =>
          int(+k, 6) &&
          obj(c) &&
          Number.isFinite(c.at) &&
          typeof c.watered === 'boolean',
      ) &&
      obj(s.chests) &&
      Object.values(s.chests).every(bag) &&
      Array.isArray(s.opened) &&
      s.opened.every((k) => typeof k === 'string' && k.length < 100) &&
      Array.isArray(s.journal) &&
      s.journal.every((k) => typeof k === 'string' && k.length < 100) &&
      Array.isArray(s.learned) &&
      s.learned.every((k) => int(k, KNOWLEDGE.length)) &&
      Array.isArray(s.hotbar) &&
      s.hotbar.length === 8 &&
      s.hotbar.every((k) => Object.hasOwn(ITEMS, k)) &&
      int(s.selected, 8) &&
      Number.isFinite(s.time) &&
      s.time >= 0 &&
      s.time < 1e10 &&
      Number.isFinite(s.health) &&
      s.health >= 0 &&
      s.health <= 100 &&
      Number.isFinite(s.energy) &&
      s.energy >= 0 &&
      s.energy <= 100 &&
      Number.isFinite(s.xp) &&
      s.xp >= 0 &&
      obj(s.settings) &&
      [1, 2, 3].includes(s.settings.difficulty) &&
      ['high', 'low', 'medium', 'auto'].includes(s.settings.quality) &&
      [0.6, 1, 1.5].includes(s.settings.sensitivity) &&
      typeof s.settings.sound === 'boolean' &&
      typeof s.settings.peaceful === 'boolean' &&
      obj(s.stats) &&
      ['mined', 'placed', 'crafted', 'harvest'].every((k) =>
        int(s.stats[k], 1e9),
      ) &&
      NPCS.some((n) => n.id === s.tracked)
    );
  } catch (e) {
    return false;
  }
}
let hasSavedWorld = false;
try {
  let raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    let s = JSON.parse(raw);
    if (validSave(s)) {
      hasSavedWorld = true;
      S = {
        ...freshState(),
        ...s,
        settings: { ...freshState().settings, ...s.settings },
      };
    } else loadNotice = 'Une sauvegarde invalide a été ignorée.';
  }
} catch (e) {
  loadNotice =
    'La sauvegarde locale est indisponible. Tu peux exporter ta partie depuis le menu.';
}
let saveTimer;
function saveGame(show = true) {
  if (replacingSave) return;
  if (typeof player !== 'undefined' && player && !(typeof ember !== 'undefined' && ember)) {
    S.player = {
      x: player.pos.x,
      y: player.pos.y,
      z: player.pos.z,
      yaw: player.yaw,
      pitch: player.pitch,
    };
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    if (show && $('saveIndicator')) {
      $('saveIndicator').style.opacity = 1;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(
        () => ($('saveIndicator').style.opacity = 0),
        2000,
      );
    }
  } catch (e) {
    if (show && typeof toast === 'function')
      toast('Sauvegarde locale impossible : exporte ta partie depuis le menu.');
  }
}
function has(cost) {
  return Object.entries(cost).every(([k, n]) => (S.inv[k] || 0) >= n);
}
function spend(cost) {
  if (!has(cost)) return false;
  for (let [k, n] of Object.entries(cost)) S.inv[k] -= n;
  return true;
}
function give(items) {
  for (let [k, n] of Object.entries(items)) S.inv[k] = (S.inv[k] || 0) + n;
  updateTool();
}
function updateTool() {
  S.tool = S.inv.ironpick ? 3 : S.inv.stonepick ? 2 : S.inv.woodpick ? 1 : 0;
}
function canCraft(r) {
  return (
    has(r.cost) &&
    (!r.tool || S.tool >= r.tool) &&
    (!r.furnace || S.inv.furnace || Object.values(S.edits).includes(13))
  );
}
function craft(r) {
  if (!canCraft(r)) return false;
  spend(r.cost);
  give({ [r.out]: r.n });
  S.stats.crafted++;
  S.xp += 3;
  saveGame(false);
  return true;
}
function ownsItem(k) {
  return (
    (S.inv[k] || 0) > 0 ||
    (k === 'furnace' && Object.values(S.edits).includes(13))
  );
}
function questReady(n) {
  return n.id === 'atlas'
    ? NPCS.slice(0, 5).every((q) => S.quests[q.id]?.done)
    : has(n.req) && n.requires.every(ownsItem);
}
function questProgress(n) {
  return S.quests[n.id] || { started: false, stage: 0, done: false };
}
function itemName(k) {
  return ITEMS[k]?.name || k;
}
function itemIcon(k) {
  let i = ITEMS[k] || ITEMS.wood;
  return `<span class="item-icon" style="color:${i.color || 'inherit'}">${i.icon}</span>`;
}
function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function difficultyChallenge(id) {
  let c = { ...CHALLENGES[id] };
  if (S.settings.difficulty === 1 && c.easy) c = { ...c, ...c.easy };
  if (S.settings.difficulty === 3 && c.hard) c = { ...c, ...c.hard };
  return c;
}
updateTool();
