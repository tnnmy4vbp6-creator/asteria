// A separate voxel dimension. Village terrain and its edit log never change on travel.
let ember = null;
let emberVillage = null;
const emberRoute = ['north', 'east', 'west'];
const emberDirections = {
  north: [46, 34, 'Nord'],
  east: [50, 38, 'Est'],
  south: [46, 42, 'Sud'],
  west: [42, 38, 'Ouest'],
};
const emberLessons = [
  {
    type: 'choice',
    title: 'Le sceau des mots',
    story:
      'Deux dragons veillent sur les îles. Complète la phrase : « Les dragons … leurs ailes. »',
    options: ['déploie', 'déploient', 'déploies'],
    answer: 1,
    hint: 'Remplace « les dragons » par « ils ».',
    explain:
      'Ils déploient : avec ce sujet au pluriel, le verbe déployer prend la terminaison -ent.',
    practiceId: 'ember:grammar',
  },
  {
    type: 'choice',
    title: 'Le sceau du volcan',
    story:
      'Sous la surface, une roche fondue s’appelle du magma. Quel nom lui donne-t-on lorsqu’elle sort d’un volcan ?',
    options: ['La lave', 'La vapeur', 'Le charbon'],
    answer: 0,
    hint: 'Ce mot de quatre lettres commence par L.',
    explain:
      'À la surface, le magma qui s’écoule s’appelle de la lave. En refroidissant, elle forme une roche solide.',
    practiceId: 'ember:science',
  },
  {
    type: 'number',
    title: 'Le sceau des réserves',
    story:
      'Le dragon garde 3 coffres de 6 cristaux. Il utilise 4 cristaux pour chaque balise et allume 2 balises. Combien de cristaux lui reste-t-il ?',
    answer: 10,
    hint: 'Trouve d’abord le total des 3 coffres.',
    hint2: '3 × 6 = 18 cristaux. Les 2 balises utilisent 2 × 4 = 8 cristaux.',
    explain:
      '3 × 6 − 2 × 4 = 18 − 8 = 10 cristaux. On calcule séparément la réserve et ce qui a été utilisé.',
    practiceId: 'ember:problem',
  },
];

function emberIntro() {
  if (ember) {
    emberJournal();
    return;
  }
  modal(
    'Les Îles de braise',
    'CHAPITRE II · AU-DELÀ DU PORTAIL',
    `<div class="ember-cover"><span>✦</span><h3>Un dragon prisonnier de trois sceaux</h3><p>Une mer de lave sépare les anciennes forges. Construis un pont, règle les canaux de refroidissement et suis les indications anglaises pour rejoindre le dragon.</p></div>
    <p>${S.won ? 'Tes cinq sceaux ont réveillé le portail.' : 'Atlas peut ouvrir un passage accompagné dès maintenant. Les quêtes du village restent disponibles à ton retour.'} Le portail est déjà construit.</p>
    <div class="two-col"><div class="banner"><b>Explorer et apprendre</b><p>Calcul, logique, anglais, grammaire et sciences débloquent réellement les passages et les pouvoirs.</p></div><div class="banner"><b>Le duel</b><p>Observe le souffle orange, écarte-toi, puis vise le dragon et touche ✋ quand son bouclier devient turquoise. Chaque tir demande de charger un sceau.</p></div></div>
    <label class="ember-option"><input id="emberAssist" type="checkbox" ${S.ember.assisted ? 'checked' : ''}> Mode accompagné : visée plus large et souffle sans dégâts.</label>
    <div class="row"><button class="primary" id="enterEmber">${S.ember.hits === 3 ? 'Revisiter les îles' : 'Franchir le portail'}</button><button class="secondary" id="emberCancel">Rester au village</button></div>`,
  );
  $('enterEmber').onclick = () => {
    S.ember.assisted = $('emberAssist').checked;
    enterEmber();
  };
  $('emberCancel').onclick = closeModal;
}

function enterEmber() {
  if (ember) {
    closeModal();
    return;
  }
  // Save the village pose before switching worlds. Resume starts at a safe checkpoint.
  if (!S.ember.active) saveGame(false);
  emberVillage = {
    world,
    scene,
    chunkGroup,
    chunkMeshes,
    interactive,
    particles,
    mapImage,
  };
  world = Object.create(VoxelWorld.prototype);
  Object.assign(world, {
    data: new Uint8Array(VW * VH * VD),
    heights: new Int8Array(VW * VD),
    trees: [],
    floraColumns: new Map(),
    dirty: new Set(),
    protected: new Set(),
    isEmber: true,
  });
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x302740);
  scene.fog = new THREE.Fog(0x594355, 30, 75);
  scene.add(new THREE.HemisphereLight(0xc8cdff, 0xb25730, 2.8));
  const light = new THREE.DirectionalLight(0xffdab4, 2.4);
  light.position.set(18, 45, 50);
  scene.add(light);
  scene.add(camera);
  scene.add(outline);
  chunkGroup = new THREE.Group();
  scene.add(chunkGroup);
  chunkMeshes = new Map();
  interactive = [];
  particles = [];
  mapImage = null;
  ember = {
    time: 0,
    bossTime: 0,
    cycle: -1,
    fired: false,
    shotAt: -10,
    pulse: null,
    crystals: [],
    wings: [],
    embers: [],
    gate: [],
    bolts: [],
  };
  S.ember.active = true;
  document.body.classList.add('ember-world');
  buildEmberWorld();
  emberCheckpoint();
  streamTerrain(true);
  for (const key of world.dirty) rebuildChunk(...key.split(',').map(Number));
  world.dirty.clear();
  closeModal();
  updateHUD();
  toast(
    'Bienvenue aux Îles de braise. Le journal ◈ contient ta mission et le retour au village.',
  );
}

function leaveEmber() {
  if (!ember || !emberVillage) return;
  const old = scene;
  ({ world, scene, chunkGroup, chunkMeshes, interactive, particles, mapImage } =
    emberVillage);
  scene.add(camera);
  scene.add(outline);
  // Release dimension meshes; shared voxel atlas and cube geometry belong to the engine.
  const geometries = new Set(),
    mats = new Set();
  old.traverse((o) => {
    if (o.geometry && o.geometry !== CUBE) geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      if (m && m !== materials && m !== paintedSurface) mats.add(m);
  });
  geometries.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
  ember = null;
  emberVillage = null;
  S.ember.active = false;
  document.body.classList.remove('ember-world');
  player.pos.set(S.player.x, S.player.y, S.player.z);
  player.yaw = S.player.yaw;
  player.pitch = S.player.pitch;
  player.velY = 0;
  target = null;
  nearObject = null;
  outline.visible = false;
  safePlayer();
  movePlayer(0);
  streamTerrain(true);
  closeModal();
  updateHUD();
  toast('De retour à Astéria. Ta progression dans les îles est conservée.');
}

function emberCheckpoint() {
  const s = S.ember;
  const p =
    s.route === 3
      ? [38.5, 6, 27.5]
      : s.bridge === 6
        ? [36.5, 6, 46.5]
        : [36.5, 6, 65.5];
  player.pos.set(...p);
  player.velY = 0;
  player.yaw = 0;
  player.pitch = 0;
  movePlayer(0);
  target = null;
  nearObject = null;
  outline.visible = false;
}

function emberCollision(x, y, z) {
  if (y >= 7 || y + 1.72 <= 6) return false;
  return interactive.some(
    (o) =>
      o.kind === 'ember' &&
      o.id !== 'return' &&
      Math.abs(x - o.pos.x) < (o.id === 'forge' ? 1.5 : 0.65) + 0.26 &&
      Math.abs(z - o.pos.z) < (o.id === 'forge' ? 1.5 : 0.65) + 0.26,
  );
}

function emberPart(group, x, y, z, w, h, d, color, glow = false) {
  const m = meshBox(group, x, y, z, w, h, d, color);
  if (glow) {
    m.material.emissive.setHex(color);
    m.material.emissiveIntensity = 0.85;
  }
  return m;
}
function emberActor(id, label, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 6, z);
  scene.add(g);
  const names = {
    return: 'Portail d’Astéria',
    bridge: 'Chantier du pont',
    forge: 'Forge des braises',
    route: 'Boussole des îles',
    north: 'Nord · North',
    east: 'Est · East',
    west: 'Ouest · West',
    south: 'Sud · South',
    seal0: 'Sceau des mots',
    seal1: 'Sceau du volcan',
    seal2: 'Sceau des réserves',
  };
  interactive.push({
    kind: 'ember',
    id,
    label,
    name: names[id],
    nameHeight: id === 'return' ? 4.6 : 2.6,
    pos: g.position,
    group: g,
  });
  return g;
}

function buildEmberWorld() {
  const solid = (x, y, z, id = 18) => {
    world.set(x, y, z, id);
    world.protected.add(world.index(x, y, z));
  };
  for (let x = 0; x < 80; x++)
    for (let z = 0; z < 80; z++) {
      solid(x, 0, z, 19);
      const entry = x >= 27 && x <= 45 && z >= 54 && z <= 73;
      const forge = x >= 22 && x <= 53 && z >= 30 && z <= 47;
      const arena = Math.hypot((x - 38) / 1.14, z - 17) < 17 && z <= 29;
      if (entry || forge || arena) {
        world.heights[x + z * 80] = 5;
        for (let y = 1; y <= 5; y++)
          solid(x, y, z, y === 5 ? (entry ? 8 : 18) : 3);
      }
    }
  // Visible, supported basalt spires rise from the sea floor.
  for (const [x, z, h] of [
    [14, 54, 15],
    [57, 57, 19],
    [63, 28, 22],
    [9, 23, 17],
    [64, 9, 25],
    [20, 68, 11],
    [49, 70, 13],
  ]) {
    for (let a = -2; a <= 2; a++)
      for (let b = -2; b <= 2; b++)
        for (let y = 1; y < h - Math.abs(a) - Math.abs(b); y++)
          solid(x + a, y, z + b, 18);
    emberPart(scene, x + 0.5, h - 2, z + 0.5, 0.5, 2, 0.5, 0xffb863, true);
  }
  const lava = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xb33526,
      emissive: 0xee4820,
      emissiveIntensity: 0.65,
      roughness: 0.65,
    }),
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(40, 2.1, 40);
  scene.add(lava);
  ember.lava = lava;
  for (let i = 0; i < 42; i++) {
    const x = rand(i, 1) * 78 + 1,
      z = rand(i, 3) * 78 + 1;
    const p = emberPart(scene, x, 2.3, z, 0.045, 0.13, 0.045, 0xffce7b, true);
    p.userData = { x, z, phase: rand(i, 4) * 6 };
    ember.embers.push(p);
  }
  // Return arch and departure camp, both resting on the island.
  const ret = emberActor('return', 'Revenir au village', 36.5, 69.5);
  for (const x of [-2, 2]) emberPart(ret, x, 2, 0, 0.8, 4, 0.8, 0x393448);
  emberPart(ret, 0, 4, 0, 4.8, 0.8, 0.8, 0xb29063);
  emberPart(ret, 0, 2, 0, 3.2, 3.4, 0.12, 0x58bdc7, true);
  for (const [x, z] of [
    [30, 62],
    [43, 62],
    [24, 33],
    [52, 33],
  ]) {
    emberPart(scene, x, 7.3, z, 0.45, 2.6, 0.45, 0x68556a);
    emberPart(scene, x, 8.65, z, 0.65, 0.4, 0.65, 0xffb954, true);
  }
  const bridge = emberActor('bridge', 'Construire le pont', 34, 56.5);
  emberPart(bridge, 0, 0.6, 0, 1.5, 1.2, 1.2, 0x675369);
  emberPart(bridge, 0, 1.3, 0, 1.7, 0.15, 1.3, 0xe9b56f);
  for (let i = 0; i < S.ember.bridge; i++) buildEmberRow(i);
  const forge = emberActor('forge', 'Régler le refroidissement', 27.5, 40.5);
  emberPart(forge, 0, 0.6, 0, 3, 1.2, 3, 0x524451);
  emberPart(forge, 0, 1.5, 0, 1.7, 0.6, 1.7, 0xff783e, true);
  for (let i = 0; i < 3; i++) {
    emberPart(forge, -1.1 + i * 1.1, 2, -0.8, 0.18, 0.8, 0.18, 0xa6abbc);
    emberPart(forge, -1.1 + i * 1.1, 2.4, -0.8, 0.6, 0.15, 0.15, 0xe9c18a);
  }
  const channel = emberPart(
    scene,
    31.5,
    6.05,
    40.5,
    5,
    0.1,
    0.6,
    0x50cada,
    true,
  );
  ember.channel = channel;
  channel.visible = S.ember.cooled;
  const guide = emberActor('route', 'Lire la balise anglaise', 46, 45);
  emberPart(guide, 0, 0.7, 0, 0.8, 1.4, 0.8, 0x695570);
  emberPart(guide, 0, 1.5, 0, 1.6, 0.25, 1.2, 0x8fe2db, true);
  for (const [id, [x, z]] of Object.entries(emberDirections)) {
    const g = emberActor(
      id,
      'Activer la balise ' + emberDirections[id][2],
      x + 0.5,
      z + 0.5,
    );
    emberPart(g, 0, 0.35, 0, 1.2, 0.7, 1.2, 0x645367);
    const crystal = emberPart(g, 0, 1.2, 0, 0.45, 1, 0.45, 0x74b9cf, true);
    crystal.rotation.z = Math.PI / 6;
    ember.crystals.push({ id, mesh: crystal });
    // Large fixed lettering is drawn in the readable HUD when aiming at each plinth.
  }
  // Fortress front spans the island. The only ground-level passage is the central gate.
  for (let x = 22; x <= 53; x++)
    for (let y = 6; y <= 10; y++) {
      const gate = x >= 35 && x <= 41;
      if (gate && S.ember.route === 3) continue;
      solid(x, y, 29, 18);
      if (gate) ember.gate.push([x, y, 29]);
    }
  for (let x = 22; x <= 53; x += 3) solid(x, 11, 29, 18);
  for (let i = 0; i < 3; i++) {
    const g = emberActor(
      'seal' + i,
      'Charger le sceau ' + (i + 1),
      28.5 + i * 10,
      22.5,
    );
    emberPart(g, 0, 0.5, 0, 1.6, 1, 1.6, 0x5e4f6c);
    emberPart(g, 0, 1.2, 0, 0.45, 0.45, 0.45, 0xc0a1f5, true).rotation.z =
      Math.PI / 4;
  }
  // Side stones are mineable supplies; the route foundations remain protected.
  for (const [x, z] of [
    [29, 60],
    [43, 58],
    [24, 44],
    [51, 31],
  ])
    for (let y = 6; y < 8; y++) world.set(x, y, z, 3);
  for (const [index, id] of Object.entries(S.ember.edits)) {
    const n = +index,
      x = n % 80,
      z = Math.floor(n / 80) % 80,
      y = Math.floor(n / 6400);
    if (!world.protected.has(n) && !emberReserved(x, y, z))
      world.set(x, y, z, id);
  }
  makeEmberDragon();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 2.5, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffb660,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  ember.warning = ring;
  ember.flames = Array.from({ length: 12 }, () => {
    const flame = emberPart(scene, 0, 0, 0, 0.5, 0.5, 0.5, 0xffa040, true);
    flame.visible = false;
    return flame;
  });
}

function buildEmberRow(row) {
  const z = 53 - row;
  for (let x = 35; x <= 37; x++) {
    world.set(x, 5, z, 8);
    world.protected.add(world.index(x, 5, z));
    world.heights[x + z * 80] = 5;
  }
  // A physical parapet keeps inexperienced players on the crossing.
  for (const x of [34, 38]) {
    world.set(x, 5, z, 18);
    world.set(x, 6, z, 18);
    world.protected.add(world.index(x, 5, z));
    world.protected.add(world.index(x, 6, z));
  }
  world.dirty.add('2,3');
  world.dirty.add('2,2');
}
function emberReserved(x, y, z) {
  return (
    y < 5 ||
    (z >= 48 && z <= 53 && x >= 34 && x <= 38) ||
    (z === 29 && x >= 22 && x <= 53) ||
    (z < 29 && x >= 20 && x <= 57)
  );
}

function makeEmberDragon() {
  const g = new THREE.Group();
  g.position.set(38, 14, 16);
  scene.add(g);
  ember.dragon = g;
  const dark = 0x4d486d,
    scale = 0x7d759e,
    gold = 0xe0bd7e;
  emberPart(g, 0, 0, 0, 2.1, 1.55, 3.6, dark);
  emberPart(g, 0, -0.45, -0.1, 1.45, 0.6, 2.8, gold);
  emberPart(g, 0, 0.4, -2, 1.25, 1.6, 1.35, scale);
  emberPart(g, 0, 0.85, -3, 1.45, 1.1, 1.55, dark);
  emberPart(g, 0, 0.5, -3.9, 1.25, 0.5, 1.1, scale);
  for (const side of [-1, 1]) {
    emberPart(g, side * 0.73, 1, -3.5, 0.08, 0.24, 0.42, 0xa9ffdc, true);
    emberPart(g, side * 0.49, 1.03, -3.79, 0.24, 0.23, 0.1, 0xa9ffdc, true);
    emberPart(g, side * 0.48, 1.23, -3.81, 0.4, 0.15, 0.15, scale);
    emberPart(g, side * 0.4, 0.62, -4.45, 0.12, 0.15, 0.1, 0x252334);
    for (let i = 0; i < 3; i++)
      emberPart(g, side * 0.48, 0.22, -3.65 - i * 0.3, 0.12, 0.2, 0.12, gold);
    const horn = emberPart(g, side * 0.56, 1.85, -2.6, 0.25, 1, 0.3, gold);
    horn.rotation.z = -side * 0.25;
    for (const z of [-0.9, 1]) {
      const leg = emberPart(g, side * 0.9, -1.1, z, 0.45, 1.15, 0.55, scale);
      leg.rotation.x = 0.25;
      emberPart(g, side * 0.9, -1.65, z - 0.25, 0.65, 0.3, 0.9, gold);
    }
    const wing = new THREE.Group();
    wing.position.set(side * 0.9, 0.45, 0.3);
    g.add(wing);
    ember.wings.push(wing);
    const vertices = [
      0,
      0,
      -1,
      side * 3.2,
      0.75,
      -2.2,
      side * 6,
      0.1,
      0.5,
      side * 3.2,
      -0.4,
      2.5,
      side * 0.6,
      0,
      1.4,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
    geo.computeVertexNormals();
    wing.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: 0xae7189,
          side: THREE.DoubleSide,
          roughness: 0.9,
        }),
      ),
    );
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [0, 3],
    ]) {
      const p = new THREE.Vector3(...vertices.slice(a * 3, a * 3 + 3)),
        q = new THREE.Vector3(...vertices.slice(b * 3, b * 3 + 3));
      const bone = emberPart(
        wing,
        ...p.clone().add(q).multiplyScalar(0.5).toArray(),
        0.18,
        p.distanceTo(q),
        0.18,
        gold,
      );
      bone.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        q.sub(p).normalize(),
      );
    }
  }
  for (let i = 0; i < 6; i++) {
    const tail = emberPart(
      g,
      Math.sin(i * 0.45) * 0.5,
      -i * 0.09,
      2 + i * 0.65,
      1 - i * 0.13,
      0.75 - i * 0.09,
      0.9,
      dark,
    );
    tail.rotation.x = -0.12;
    emberPart(g, 0, 1, 1.4 - i * 0.6, 0.25, 0.5, 0.35, gold).rotation.z =
      Math.PI / 4;
  }
  const shield = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.5, 1),
    new THREE.MeshBasicMaterial({
      color: 0xb794ed,
      wireframe: true,
      transparent: true,
      opacity: 0.24,
    }),
  );
  g.add(shield);
  ember.shield = shield;
  batchRigidParts(g); // nested wings remain separate so they can flap.
}

function useEmber(id) {
  if (id === 'return') {
    leaveEmber();
    return;
  }
  if (id === 'bridge') {
    emberBridge();
    return;
  }
  if (id === 'forge') {
    emberForge();
    return;
  }
  if (id === 'route') {
    emberRouteHelp();
    return;
  }
  if (emberDirections[id]) {
    if (!S.ember.cooled) {
      toast('Refroidis d’abord la forge, à l’ouest.');
      return;
    }
    if (S.ember.route === 3) {
      toast(
        'Les trois balises sont actives. Entre dans la forteresse au nord.',
      );
      return;
    }
    const correct = id === emberRoute[S.ember.route];
    if (correct) S.ember.route++;
    else {
      S.ember.route = 0;
      toast('Repars du début : north = nord, east = est, west = ouest.');
    }
    if (S.ember.route === 3) {
      for (const [x, y, z] of ember.gate) {
        world.set(x, y, z, 0);
        world.dirty.add(Math.floor(x / 16) + ',' + Math.floor(z / 16));
      }
      S.journal.push('ember:route');
      S.xp += 30;
      toast(
        'North, east, west ! La porte s’ouvre. Les sceaux attendent dans l’arène.',
      );
    } else if (correct)
      toast(
        'Balise activée. Direction suivante : ' +
          emberRoute[S.ember.route] +
          '.',
      );
    recordPractice('ember:route', correct);
    updateHUD();
    return;
  }
  if (id.startsWith('seal')) {
    if (S.ember.route < 3) {
      toast('Active d’abord les trois balises.');
      return;
    }
    if (S.ember.hits === 3) {
      emberVictory();
      return;
    }
    const i = Number(id.slice(4));
    if (i !== S.ember.hits) {
      toast(
        'Cherche le sceau ' + (S.ember.hits + 1) + ' indiqué sur ta carte.',
      );
      return;
    }
    if (S.ember.charged) {
      toast(
        'Ton rayon est chargé. Vise le dragon quand son bouclier devient turquoise, puis touche ✋.',
      );
      return;
    }
    let c = { ...emberLessons[i] };
    if (i === 2 && S.settings.difficulty === 1)
      c = {
        ...c,
        story:
          'Le dragon possède 12 cristaux. Il en utilise 4 pour une balise. Combien lui reste-t-il ?',
        answer: 8,
        hint: 'Retire 4 à 12.',
        hint2: '12 − 4 = 8.',
        explain: 'Il reste 8 cristaux après en avoir utilisé 4.',
      };
    if (i === 2 && S.settings.difficulty === 3)
      c = {
        ...c,
        story:
          '4 coffres contiennent chacun 7 cristaux. Le dragon dépense 5 cristaux par balise pour 3 balises. Il partage le reste entre 2 nids et garde le cristal qui ne peut pas être partagé. Combien chaque nid reçoit-il ?',
        answer: 6,
        hint: 'Calcule la réserve, puis la dépense, puis partage ce qui reste.',
        hint2: '28 − 15 = 13. Partage 12 en deux groupes et garde 1.',
        explain:
          '4 × 7 − 3 × 5 = 13. Chaque nid reçoit 6 cristaux et le dragon en garde 1.',
      };
    showChallenge(
      {
        ...c,
        onSolved: () => {
          S.ember.charged = true;
          if (!S.journal.includes(c.practiceId)) S.journal.push(c.practiceId);
          S.notes[c.practiceId] = c.explain;
          saveGame(false);
        },
      },
      closeModal,
      'LE DRAGON · CHARGER LE SCEAU ' + (i + 1),
    );
  }
}

function emberBridge() {
  if (S.ember.bridge === 6) {
    toast('Le pont est terminé. Traverse puis rejoins la forge à gauche.');
    return;
  }
  const n = S.ember.bridge;
  if (!S.journal.includes('ember:plan')) {
    showChallenge(
      {
        type: 'number',
        title: 'Dessine le passage',
        story:
          'Le pont fait 6 rangées de long et 3 blocs de large. Combien de blocs faut-il préparer pour son sol ?',
        answer: 18,
        hint: 'Chaque rangée contient 3 blocs. Il y a 6 rangées.',
        hint2: '3 + 3 + 3 + 3 + 3 + 3 = 18.',
        explain:
          'Un rectangle de 6 rangées sur 3 colonnes contient 6 × 3 = 18 blocs.',
        practiceId: 'ember:bridge',
        onSolved: () => {
          S.journal.push('ember:plan');
          S.xp += 15;
          saveGame(false);
        },
      },
      emberBridge,
      'LE PONT · LONGUEUR ET LARGEUR',
    );
    return;
  }
  modal(
    'Le chantier du pont',
    'CONSTRUIRE · ' + n + ' / 6 RANGÉES',
    '<p>La réserve du chantier contient ' +
      (18 - 3 * n) +
      ' blocs. Chaque rangée en utilise 3. Pose les rangées une par une et observe le pont se construire.</p><div class="ember-plan">' +
      Array.from(
        { length: 6 },
        (_, row) =>
          '<div>' +
          Array.from(
            { length: 3 },
            () => '<i class="' + (row < n ? 'built' : '') + '"></i>',
          ).join('') +
          '</div>',
      ).join('') +
      '</div><button class="primary" id="emberRow">Poser une rangée de 3 blocs</button><p class="muted">Ces matériaux appartiennent au chantier. Ton inventaire est conservé.</p>',
  );
  $('emberRow').onclick = () => {
    if (S.ember.bridge >= 6) return;
    buildEmberRow(S.ember.bridge++);
    S.stats.placed += 3;
    if (S.ember.bridge === 6) S.xp += 20;
    saveGame(false);
    sfx('place');
    if (S.ember.bridge === 6) {
      closeModal();
      toast(
        '18 blocs posés : ton pont est praticable ! Traverse vers la forge.',
      );
    } else emberBridge();
  };
}

function emberForge() {
  if (S.ember.bridge < 6) {
    toast('Termine d’abord le pont au sud.');
    return;
  }
  if (S.ember.cooled) {
    emberRouteHelp();
    return;
  }
  let mask = 0;
  modal(
    'Refroidis la forge',
    'LOGIQUE · COMBINER DES DÉBITS',
    '<p>La forge demande exactement <b>6 litres par minute</b>. Les trois vannes fournissent 2, 3 et 4 litres par minute. Ouvre la bonne combinaison.</p><div class="answer-grid">' +
      [2, 3, 4]
        .map(
          (v, i) =>
            '<button data-valve="' +
            i +
            '" aria-pressed="false">' +
            v +
            ' L/min · fermée</button>',
        )
        .join('') +
      '</div><div class="banner" id="emberFlow">Débit : 0 / 6 L/min</div><div id="emberValveHint" aria-live="polite"></div><div class="row"><button class="primary" id="emberCool">Faire circuler l’eau</button><button class="secondary" id="emberValveHelp">Un indice</button></div>',
  );
  const total = () =>
    [2, 3, 4].reduce((sum, v, i) => sum + (mask & (1 << i) ? v : 0), 0);
  document.querySelectorAll('[data-valve]').forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.valve;
        mask ^= 1 << i;
        const on = !!(mask & (1 << i));
        b.setAttribute('aria-pressed', on);
        b.textContent =
          [2, 3, 4][i] + ' L/min · ' + (on ? 'ouverte' : 'fermée');
        $('emberFlow').textContent = 'Débit : ' + total() + ' / 6 L/min';
      }),
  );
  $('emberValveHelp').onclick = () => {
    $('emberValveHint').textContent =
      'Cherche deux nombres dont la somme vaut 6. Tu peux fermer une vanne en la touchant encore.';
  };
  $('emberCool').onclick = () => {
    const ok = total() === 6;
    if (ok) {
      S.ember.cooled = true;
      S.journal.push('ember:forge');
      S.xp += 25;
      ember.channel.visible = true;
    }
    recordPractice('ember:forge', ok);
    if (ok) {
      closeModal();
      toast(
        '2 + 4 = 6 L/min. L’eau refroidit la forge ! Rejoins la balise à l’est.',
      );
    } else
      $('emberValveHint').textContent =
        total() < 6
          ? 'Le débit est insuffisant. Essaie une autre combinaison.'
          : 'Le débit est trop fort. Ferme une vanne et compare les débits.';
  };
}

function emberRouteHelp() {
  modal(
    'La route des balises',
    'ANGLAIS · SE REPÉRER',
    '<p>Lis l’inscription, ferme ce panneau, puis marche vers les trois balises dans cet ordre et active-les avec ✋.</p><blockquote lang="en">First go north. Then go east. Finally go west.</blockquote><p>North = nord ↑ · East = est → · West = ouest ←. La carte garde le nord en haut. Les balises sont à droite de la forge.</p><div class="row"><button class="secondary" id="emberEnglish">Écouter en anglais</button><button class="primary" id="emberRouteGo">Chercher les balises</button></div>',
  );
  $('emberEnglish').onclick = () =>
    speak('First go north. Then go east. Finally go west.', 'en-GB');
  $('emberRouteGo').onclick = closeModal;
}

function emberStage() {
  const s = S.ember;
  if (s.bridge < 6)
    return {
      x: 34,
      z: 56,
      name: 'Chantier',
      title: 'Construis le pont',
      text: '6 rangées × 3 blocs. Examine le pupitre avec ✋.',
    };
  if (!s.cooled)
    return {
      x: 27,
      z: 40,
      name: 'Forge',
      title: 'Refroidis la forge',
      text: 'Traverse le pont. À gauche, combine les débits pour obtenir 6 L/min.',
    };
  if (s.route < 3)
    return {
      x: 46,
      z: 38,
      name: 'Balises',
      title: 'Suis les mots anglais',
      text: 'North → east → west. Balises activées : ' + s.route + ' / 3.',
    };
  if (s.hits < 3)
    return {
      x: 28 + s.hits * 10,
      z: 22,
      name: 'Sceau ' + (s.hits + 1),
      title: s.charged ? 'Libère le dragon' : 'Charge le sceau ' + (s.hits + 1),
      text: s.charged
        ? 'Évite le cercle orange. Vise le dragon turquoise et touche ✋.'
        : 'Entre au nord. Résous l’épreuve du sceau indiqué sur la carte.',
    };
  return {
    x: 36,
    z: 69,
    name: 'Portail',
    title: 'Le dragon est libre',
    text: 'Explore, construis ou retourne au village par le portail ou le journal ◈.',
  };
}
function emberHUD() {
  const n = emberStage();
  $('biome').textContent = 'LES ÎLES DE BRAISE';
  $('clock').textContent = '✦ Chapitre II';
  $('day').textContent = S.ember.assisted ? 'Accompagné' : 'Aventure';
  $('trackedName').textContent = n.title;
  $('trackedText').textContent = n.text;
  $('waypointText').textContent =
    S.ember.route === 3
      ? 'Entraves libérées : ' + S.ember.hits + ' / 3'
      : n.name +
        ' · ' +
        Math.round(Math.hypot(n.x - player.pos.x, n.z - player.pos.z)) +
        ' m';
  return n;
}
function emberAim(best) {
  if (S.ember.charged && player.pos.z < 30 && player.pitch > 0.12) {
    best = null;
    nearObject = null;
    showWorldName(null);
  }
  if (!best && S.ember.route === 3 && S.ember.hits < 3 && player.pos.z < 30) {
    $('interactPrompt').style.display = 'flex';
    $('interactPrompt').querySelector('span').textContent = S.ember.charged
      ? emberVulnerable()
        ? '✦ Vise le dragon · Libérer le rayon'
        : 'Bouclier fermé · Évite le souffle'
      : 'Charge le sceau ' + (S.ember.hits + 1);
  }
}
function emberJournal() {
  const n = emberStage();
  modal(
    'Les Îles de braise',
    'JOURNAL DE L’EXPÉDITION',
    '<div class="banner"><h3>' +
      n.title +
      '</h3><p>' +
      n.text +
      '</p></div><ol><li>Pont : ' +
      S.ember.bridge +
      ' / 6 rangées.</li><li>Forge : ' +
      (S.ember.cooled ? 'refroidie' : 'à régler') +
      '.</li><li>Balises : ' +
      S.ember.route +
      ' / 3.</li><li>Dragon : ' +
      S.ember.hits +
      ' / 3 entraves libérées.</li></ol><p>Au duel, un cercle orange annonce le souffle. Sors du cercle, puis tire lorsque le bouclier devient turquoise. Une erreur dans une énigme ne retire aucun objet. Si tu tombes, tu reviens au dernier passage sûr.</p><label class="ember-option"><input id="emberMode" type="checkbox" ' +
      (S.ember.assisted ? 'checked' : '') +
      '> Mode accompagné : souffle sans dégâts et visée plus large</label><div class="row"><button class="primary" id="emberContinue">Continuer</button><button class="secondary" id="emberHome">Revenir au village</button><button class="secondary" id="emberSafe">Rejoindre le dernier passage sûr</button></div>',
  );
  $('emberMode').onchange = () => {
    S.ember.assisted = $('emberMode').checked;
    saveGame(false);
  };
  $('emberContinue').onclick = closeModal;
  $('emberHome').onclick = leaveEmber;
  $('emberSafe').onclick = () => {
    emberCheckpoint();
    closeModal();
  };
}
function drawEmberMap(canvas, large) {
  const g = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height;
  g.fillStyle = '#663c40';
  g.fillRect(0, 0, w, h);
  for (let x = 0; x < 80; x++)
    for (let z = 0; z < 80; z++)
      if (world.heights[x + 80 * z] === 5) {
        g.fillStyle = '#81758e';
        g.fillRect(
          (x * w) / 80,
          (z * h) / 80,
          Math.ceil(w / 80),
          Math.ceil(h / 80),
        );
      }
  const n = emberStage();
  for (const [x, z, label] of [
    [36, 69, 'Portail'],
    [36, 56, 'Pont'],
    [27, 40, 'Forge'],
    [46, 38, 'Balises'],
    [38, 16, 'Dragon'],
  ]) {
    g.fillStyle = '#ffcf84';
    g.fillRect((x * w) / 80 - 2, (z * h) / 80 - 2, 4, 4);
    if (large) {
      g.font = 'bold 14px system-ui';
      g.textAlign = 'center';
      g.fillStyle = '#fff5de';
      g.fillText(label, (x * w) / 80, (z * h) / 80 - 7);
    }
  }
  g.strokeStyle = '#b6ffe9';
  g.lineWidth = 2;
  g.beginPath();
  g.arc((n.x * w) / 80, (n.z * h) / 80, 6, 0, Math.PI * 2);
  g.stroke();
  g.save();
  g.translate((player.pos.x * w) / 80, (player.pos.z * h) / 80);
  g.rotate(-player.yaw);
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(0, -5);
  g.lineTo(-3, 4);
  g.lineTo(3, 4);
  g.fill();
  g.restore();
  g.fillStyle = '#fff';
  g.font = '12px system-ui';
  g.textAlign = 'left';
  g.fillText('N ↑', 5, 15);
}

function emberVulnerable() {
  return ember && ember.bossTime % 12 >= 4 && ember.bossTime % 12 < 10;
}
function emberShoot() {
  if (S.ember.route < 3 || player.pos.z >= 30) {
    toast('Approche du pupitre ou d’une balise et vise-la avec la croix.');
    return;
  }
  if (S.ember.hits === 3) {
    emberVictory();
    return;
  }
  if (!S.ember.charged) {
    toast(
      'Charge le sceau ' + (S.ember.hits + 1) + ' avant de lancer un rayon.',
    );
    return;
  }
  if (!emberVulnerable()) {
    toast('Attends que le bouclier du dragon devienne turquoise.');
    return;
  }
  const aim = ember.dragon.position.clone().sub(camera.position),
    distance = aim.length();
  if (
    distance > 35 ||
    aim.clone().normalize().dot(camera.getWorldDirection(new THREE.Vector3())) <
      (S.ember.assisted ? 0.72 : 0.95) ||
    !clearSight(camera.position, aim)
  ) {
    toast('Place le dragon au centre de l’écran, sans mur devant toi.');
    return;
  }
  if (ember.time - ember.shotAt < 1) return;
  ember.shotAt = ember.time;
  const geo = new THREE.BufferGeometry().setFromPoints([
    camera.position.clone().add(new THREE.Vector3(0, -0.2, 0)),
    ember.dragon.position.clone(),
  ]);
  const bolt = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0xabfff1 }),
  );
  scene.add(bolt);
  ember.bolts.push({ mesh: bolt, life: 0.7 });
  S.ember.charged = false;
  S.ember.hits++;
  S.xp += 35;
  ember.bossTime = 0;
  ember.cycle = -1;
  sfx('success');
  if (S.ember.hits === 3) {
    S.xp += 100;
    give({ emerald: 12, crystal: 3 });
    saveGame(false);
    emberVictory();
  } else {
    saveGame(false);
    toast(
      'Une entrave se brise ! Rejoins maintenant le sceau ' +
        (S.ember.hits + 1) +
        '.',
    );
  }
  updateHUD();
}
function emberVictory() {
  modal(
    'Le dragon a retrouvé ses ailes',
    'LES ÎLES DE BRAISE · EXPÉDITION ACCOMPLIE',
    '<div class="ember-cover"><span>✦</span><h3>Les trois entraves sont brisées.</h3><p>Tu as utilisé les mathématiques pour construire, la logique pour refroidir, l’anglais pour te repérer et tes connaissances pour libérer le dragon.</p></div><p>Récompense de la première victoire : 100 points d’expérience, 12 émeraudes et 3 cristaux. Tu peux continuer à explorer les îles et retrouver tes constructions.</p><div class="row"><button class="primary" id="emberStay">Observer le dragon libre</button><button class="secondary" id="emberReturn">Revenir au village</button></div>',
  );
  $('emberStay').onclick = closeModal;
  $('emberReturn').onclick = leaveEmber;
}

function animateEmber(dt) {
  ember.time += dt;
  const s = S.ember,
    combat = s.route === 3 && s.hits < 3 && player.pos.z < 30;
  if (player.pos.y < 4.5) {
    emberCheckpoint();
    toast(
      'Le courant du portail te ramène sur la terre ferme. Ton sac est conservé.',
    );
  }
  if (combat) ember.bossTime += dt;
  const phase = ember.bossTime % 12,
    cycle = Math.floor(ember.bossTime / 12);
  if (combat && cycle !== ember.cycle) {
    ember.cycle = cycle;
    ember.fired = false;
    ember.warning.position.set(player.pos.x, 6.03, player.pos.z);
  }
  ember.warning.visible = combat && phase < 4;
  if (ember.warning.visible) {
    ember.warning.material.opacity =
      phase < 3 ? 0.3 + 0.25 * Math.sin(ember.time * 8) : 0.9;
  }
  if (combat && phase >= 3 && !ember.fired) {
    ember.fired = true;
    if (
      Math.hypot(
        player.pos.x - ember.warning.position.x,
        player.pos.z - ember.warning.position.z,
      ) < 2.5 &&
      !s.assisted
    ) {
      S.health = Math.max(0, S.health - 18);
      toast('Le souffle arrive ! Sors du cercle orange avant qu’il brille.');
      if (S.health === 0) {
        S.health = 100;
        emberCheckpoint();
        toast(
          'Tu reprends tes forces au passage sûr. Les sceaux libérés sont conservés.',
        );
      }
    }
  }
  const open = combat && emberVulnerable();
  const t = ember.time * 0.22;
  const attacking = combat && phase < 4;
  const dest = new THREE.Vector3(
    open || attacking ? 38 : 38 + Math.sin(t) * 9,
    open ? 11 : 14 + Math.sin(t * 2),
    open || attacking ? 12 : 16 + Math.cos(t) * 5,
  );
  ember.dragon.position.lerp(dest, Math.min(1, dt * 2.5));
  ember.dragon.rotation.y =
    open || attacking ? Math.PI : Math.atan2(-Math.cos(t), Math.sin(t) * 0.6);
  const mouth = new THREE.Vector3(0, 0.5, -4.4);
  ember.dragon.updateMatrixWorld();
  ember.dragon.localToWorld(mouth);
  ember.flames.forEach((flame, i) => {
    flame.visible = combat && phase >= 3 && phase < 4;
    if (flame.visible) {
      const a = (i + ((ember.time * 8) % 1)) / 12;
      flame.position.lerpVectors(mouth, ember.warning.position, a);
      flame.scale.setScalar(0.6 + a * 2);
      flame.rotation.set(ember.time + i, ember.time * 2, 0);
    }
  });
  ember.wings.forEach(
    (w, i) =>
      (w.rotation.z =
        (i === 0 ? -1 : 1) * (0.18 + Math.sin(ember.time * 3.4) * 0.3)),
  );
  ember.shield.visible = s.hits < 3;
  ember.shield.material.color.set(open ? 0x64ffe0 : 0xc294ff);
  ember.shield.material.opacity = open ? 0.85 : 0.24;
  ember.shield.material.toneMapped = false;
  ember.shield.rotation.y += dt * 0.6;
  ember.lava.material.emissiveIntensity =
    0.55 + Math.sin(ember.time * 0.6) * 0.12;
  for (const p of ember.embers)
    p.position.y = 2.3 + ((ember.time * 0.6 + p.userData.phase) % 5);
  for (const { id, mesh } of ember.crystals) {
    const on = emberRoute.slice(0, s.route).includes(id);
    mesh.material.color.set(on ? 0xafffe2 : 0x74b9cf);
    mesh.rotation.y += dt * 0.45;
  }
  for (const b of ember.bolts) b.life -= dt;
  ember.bolts = ember.bolts.filter((b) => {
    if (b.life > 0) return true;
    scene.remove(b.mesh);
    b.mesh.geometry.dispose();
    b.mesh.material.dispose();
    return false;
  });
  for (const p of particles) {
    p.userData.life -= dt;
    p.position.y += dt * p.userData.vy;
  }
  particles = particles.filter((p) => {
    if (p.userData.life > 0) return true;
    scene.remove(p);
    p.material.dispose();
    return false;
  });
}
