// The valley owns its terrain, edit log, NPCs and scene. Travel never rewrites
// the original village or the islands of Ember.
let living = null,
  livingVillage = null,
  livingFocus = null;
const livingColors = [0xd9b478, 0x80ad7b, 0x86afbc];
function livingReports() {
  return LIVING_PLOTS.map((_, i) =>
    inspectLivingPlot(i, S.living.plots[i], (x, y, z) => world.get(x, y, z)),
  );
}
function livingActor(id, name, label, x, z, coat = 0x608f88) {
  const actor = humanoid({
    id: 'living-' + id,
    name,
    x: x - 0.5,
    z: z - 0.5,
    coat,
    hat: 0x9e8156,
  });
  Object.assign(actor, {
    kind: 'living',
    id,
    label,
    home: [x, z],
    path: [],
    routeAt: 0,
  });
  return actor;
}
function livingMarker(id, name, label, x, z, color = 0xd9c586) {
  const g = new THREE.Group();
  g.position.set(x, 5, z);
  scene.add(g);
  meshBox(g, 0, 0.65, 0, 0.12, 1.3, 0.12, 0x70503b);
  meshBox(g, 0, 1.25, 0, 1.3, 0.55, 0.14, color);
  const o = {
    kind: 'living',
    id,
    name,
    label,
    pos: g.position,
    group: g,
    nameHeight: 1.7,
  };
  interactive.push(o);
  return o;
}
function enterLiving() {
  if (living) {
    closeModal();
    livingJournal();
    return;
  }
  if (restorationMode) exitRestoration();
  if (ember) leaveEmber();
  clearBuildPreview();
  S.builder.active = false;
  S.builder.project = -1;
  if (!S.living.active) saveGame(false);
  livingVillage = {
    world,
    scene,
    chunkGroup,
    chunkMeshes,
    interactive,
    particles,
    mapImage,
    characters,
    animals,
    torchSpots,
  };
  world = Object.create(VoxelWorld.prototype);
  Object.assign(world, {
    data: new Uint8Array(VW * VH * VD),
    heights: new Int8Array(VW * VD),
    trees: [],
    floraColumns: new Map(),
    dirty: new Set(),
    protected: new Set(),
    isLiving: true,
  });
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbacdd0);
  scene.fog = new THREE.Fog(0xbacdd0, 28, 73);
  const sky = new THREE.HemisphereLight(0xdceaf4, 0x606a3b, 2.3),
    sunny = new THREE.DirectionalLight(0xffe4b4, 2.5);
  sunny.position.set(14, 42, 48);
  scene.add(sky, sunny, camera, outline);
  chunkGroup = new THREE.Group();
  scene.add(chunkGroup);
  chunkMeshes = new Map();
  interactive = [];
  particles = [];
  characters = [];
  animals = [];
  torchSpots = [];
  mapImage = null;
  living = {
    sky,
    sun: sunny,
    time: 0,
    lastReport: -2,
    reports: null,
    npcs: [],
    props: new THREE.Group(),
    plotProps: [],
    crops: [],
    lamps: [],
    watchers: [],
    night: null,
    colliders: [],
    routeNodes: [],
    focusObjects: [],
  };
  scene.add(living.props);
  S.living.active = true;
  document.body.classList.add('living-world');
  buildLivingWorld();
  if (!S.living.supplied) {
    give({
      plank: 240,
      stone: 200,
      glass: 140,
      brick: 100,
      torch: 12,
      stonepick: 1,
    });
    S.living.supplied = true;
  }
  if (S.living.pose) {
    const p = S.living.pose;
    player.pos.set(p.x, p.y, p.z);
    player.yaw = p.yaw;
    player.pitch = p.pitch;
  } else {
    player.pos.set(37.5, 5, 54.5);
    player.yaw = 0;
    player.pitch = 0;
  }
  livingSafePlayer();
  player.velY = 0;
  movePlayer(0);
  target = nearObject = null;
  outline.visible = false;
  streamTerrain(true);
  for (const k of world.dirty) rebuildChunk(...k.split(',').map(Number));
  world.dirty.clear();
  closeModal();
  updateHUD();
  saveGame(false);
  if (!S.living.visited.includes('welcome')) {
    S.living.visited.push('welcome');
    livingWelcome();
  }
}
function leaveLiving() {
  if (!living || !livingVillage) return;
  if (livingFocus) exitLivingFocus();
  saveGame(false);
  clearBuildPreview();
  S.builder.active = false;
  S.builder.project = -1;
  const old = scene,
    state = living;
  ({
    world,
    scene,
    chunkGroup,
    chunkMeshes,
    interactive,
    particles,
    mapImage,
    characters,
    animals,
    torchSpots,
  } = livingVillage);
  scene.add(camera, outline);
  old.remove(camera, outline);
  state.closed = true;
  const geometries = new Set(),
    mats = new Set(),
    textures = new Set();
  old.traverse((o) => {
    if (o.geometry && o.geometry !== CUBE) geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      if (m && m !== materials && m !== glassMaterial && m !== paintedSurface)
        mats.add(m);
  });
  mats.forEach((m) => {
    if (m.map && m.map !== atlas) textures.add(m.map);
    m.dispose();
  });
  geometries.forEach((g) => g.dispose());
  textures.forEach((t) => t.dispose());
  living = null;
  livingVillage = null;
  S.living.active = false;
  GamePlatform.stopVoice();
  GamePlatform.stopAmbient();
  document.body.classList.remove('living-world');
  player.pos.set(S.player.x, S.player.y, S.player.z);
  player.yaw = S.player.yaw;
  player.pitch = S.player.pitch;
  player.velY = 0;
  safePlayer();
  movePlayer(0);
  target = nearObject = null;
  outline.visible = false;
  streamTerrain(true);
  closeModal();
  updateHUD();
  saveGame(false);
}
function livingSafePlayer() {
  if (
    player.pos.x < 1 ||
    player.pos.z < 1 ||
    player.pos.x > 78 ||
    player.pos.z > 78 ||
    player.pos.y < 4 ||
    collision(player.pos.x, player.pos.y, player.pos.z)
  )
    player.pos.set(37.5, 5, 54.5);
}
function livingReserved(x, y, z) {
  if (!world.isLiving) return false;
  return (
    y <= 4 ||
    living.colliders.some(
      (b) =>
        x + 1 > b.x0 &&
        x < b.x1 &&
        z + 1 > b.z0 &&
        z < b.z1 &&
        y < b.y1 &&
        y + 1 > b.y0,
    ) ||
    interactive.some(
      (o) =>
        o.kind === 'living' &&
        !o.mobile &&
        Math.hypot(x + 0.5 - o.pos.x, z + 0.5 - o.pos.z) < 1 &&
        y < 8,
    )
  );
}
function livingCollision(x, y, z) {
  return (
    !!living &&
    living.colliders.some(
      (b) =>
        x + 0.26 > b.x0 &&
        x - 0.26 < b.x1 &&
        z + 0.26 > b.z0 &&
        z - 0.26 < b.z1 &&
        y + 1.72 > b.y0 &&
        y < b.y1,
    )
  );
}
function buildLivingWorld() {
  const landmarks = LIVING_CONTENT.landmarks;
  for (let x = 0; x < 80; x++)
    for (let z = 0; z < 80; z++) {
      const volcanic = x > 53 && z > 44,
        shore = x < 22 && z > 53;
      for (let y = 0; y <= 4; y++)
        world.set(
          x,
          y,
          z,
          y === 0
            ? 19
            : y === 4
              ? volcanic
                ? 3
                : shore
                  ? 6
                  : 1
              : y > 2
                ? 2
                : 3,
          false,
        );
      world.heights[x + z * 80] = 4;
      world.protected.add(world.index(x, 4, z));
    }
  function road(a, b) {
    let [x, z] = a;
    while (x !== b[0] || z !== b[1]) {
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++)
          world.set(x + dx, 4, z + dz, 20, false);
      if (x !== b[0]) x += Math.sign(b[0] - x);
      else z += Math.sign(b[1] - z);
    }
  }
  for (const [name, pos] of Object.entries(landmarks))
    if (name !== 'hub') road(landmarks.hub, pos);
  // The port has a real quay and water basin, bounded by a low rim.
  for (let x = 5; x < 19; x++)
    for (let z = 65; z < 75; z++) {
      world.set(x, 4, z, 0, false);
      world.set(x, 3, z, 6, false);
      if (x === 5 || x === 18 || z === 74) world.set(x, 4, z, 3, false);
    }
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshStandardMaterial({
      color: 0x4d9eaf,
      transparent: true,
      opacity: 0.78,
      roughness: 0.2,
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(12, 4.45, 69.5);
  scene.add(sea);
  living.sea = sea;
  // Layered fossil gallery, entrance opens south; strata continue through walls.
  for (let x = 55; x <= 69; x++)
    for (let z = 9; z <= 22; z++)
      for (let y = 5; y <= 12; y++) {
        if (z === 9 || x === 55 || x === 69 || y === 12)
          world.set(x, y, z, y % 3 === 0 ? 6 : y % 3 === 1 ? 8 : 3, false);
      }
  // Volcanic rim and a contained glowing lava pool; the playable route is safe.
  for (let x = 56; x <= 73; x++)
    for (let z = 46; z <= 58; z++) {
      const r = Math.hypot(x - 65, z - 51);
      if (r > 4 && r < 7)
        for (let y = 5; y < 5 + Math.floor(7 - r); y++)
          world.set(x, y, z, 3, false);
    }
  const lava = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 24),
    new THREE.MeshStandardMaterial({
      color: 0xd75d30,
      emissive: 0xa83914,
      emissiveIntensity: 0.65,
    }),
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(65, 5.03, 51);
  scene.add(lava);
  living.lava = lava;
  living.colliders.push({
    x0: 61.5,
    x1: 68.5,
    z0: 47.5,
    z1: 54.5,
    y0: 4,
    y1: 6,
  });
  // Hills give each region a horizon without obstructing the authored paths.
  for (let x = 1; x < 79; x++)
    for (let z = 1; z < 79; z++)
      if (x < 5 || z < 5 || x > 75 || z > 76) {
        const h = 2 + Math.floor(rand(x, z) * 5);
        for (let y = 5; y < 5 + h; y++)
          world.set(x, y, z, y === 4 + h ? 1 : 3, false);
      }
  for (const [key, id] of Object.entries(S.living.edits)) {
    const i = +key,
      x = i % 80,
      z = Math.floor(i / 80) % 80,
      y = Math.floor(i / 6400);
    if (y > 4 && !livingReserved(x, y, z)) world.set(x, y, z, id, false);
  }
  LIVING_PLOTS.forEach((p, i) => {
    livingMarker(
      'plot' + i,
      p.short,
      'Construire : ' + p.short,
      p.x + 3.5,
      p.z + 9,
      livingColors[i],
    );
    // Four low stakes mark the maximum plot. They never occupy usable cells.
    for (const [dx, dz] of [
      [-0.3, -0.3],
      [7.3, -0.3],
      [-0.3, 7.3],
      [7.3, 7.3],
    ])
      meshBox(
        living.props,
        p.x + dx,
        5.2,
        p.z + dz,
        0.12,
        0.4,
        0.12,
        livingColors[i],
      );
    const props = new THREE.Group();
    scene.add(props);
    living.plotProps.push(props);
  });
  living.npcs = [
    livingActor('mila', 'Mila', 'Parler à Mila', 33, 50, 0xb88960),
    livingActor('noe', 'Noé', 'Arroser avec Noé', 42, 50, 0x609865),
    livingActor('sami', 'Sami', 'Préparer une livraison', 14, 61, 0x628baf),
  ];
  living.npcs.forEach((o) => (o.mobile = true));
  livingActor('forest', 'June', 'Suivre June en anglais', 14, 18, 0x7a9d58);
  livingActor(
    'fossils',
    'Ada',
    'Explorer les couches de roches',
    62,
    18,
    0xbca16b,
  );
  livingActor(
    'volcano',
    'Tao',
    'Réparer le canal de refroidissement',
    63,
    61,
    0xb77353,
  );
  livingMarker(
    'grammar',
    'Le bureau des messages',
    'Préparer le message du convoi',
    38,
    34,
    0x8aafbd,
  );
  livingMarker(
    'night',
    'La porte du village',
    'Préparer la veillée',
    38,
    39,
    0x93b0a4,
  );
  livingMarker(
    'return',
    'Route d’Astéria',
    'Revenir à Astéria',
    37,
    57,
    0xb6a0bd,
  );
  for (const [i, [x, z]] of LIVING_LAMPS.entries()) {
    const g = new THREE.Group();
    g.position.set(x, 5, z);
    scene.add(g);
    meshBox(g, 0, 0.7, 0, 0.14, 1.4, 0.14, 0x866343);
    const globe = meshBox(g, 0, 1.45, 0, 0.4, 0.4, 0.4, 0x53636b);
    living.lamps.push(globe);
    interactive.push({
      kind: 'living',
      id: 'lamp' + i,
      name: 'Lanterne ' + (i + 1),
      label: 'Allumer ou éteindre',
      group: g,
      pos: g.position,
      nameHeight: 2,
    });
  }
  const gate = new THREE.Group();
  gate.position.set(48, 5, 38);
  scene.add(gate);
  living.gate = meshBox(gate, 0, 1, 0, 0.25, 2, 2.4, 0x6c7e68);
  const watcherGroup = new THREE.Group();
  watcherGroup.position.set(56, 5, 38.5);
  scene.add(watcherGroup);
  const watcher = {
    group: watcherGroup,
    pos: watcherGroup.position,
    path: [],
    angle: 0,
  };
  living.watchers.push(watcher);
  watcherGroup.visible = false;
  const fallback = meshBox(watcherGroup, 0, 0.9, 0, 0.6, 1.8, 0.6, 0x667b6c);
  ForestFauna.dressWatchers([watcher])
    .then(() => {
      fallback.visible = false;
    })
    .catch(() => {});
  living.reports = livingReports();
  refreshLivingBuildings();
  dressLivingValley(living);
}
async function dressLivingValley(state) {
  const p = [];
  function prop(model, x, z, size = 1, yaw = 0, y = 5) {
    p.push({ name: model, x, y: model === 'canoe' ? 4.42 : y, z, size, yaw });
  }
  // Ground-normalised, licensed meshes share instanced draw calls.
  for (let i = 0; i < 48; i++) {
    const x = 7 + rand(i, 42) * 41,
      z = 7 + rand(i, 51) * 20;
    if (
      world.get(Math.floor(x), 4, Math.floor(z)) === 20 ||
      Math.hypot(x - 14, z - 18) < 5 ||
      (x > 31 && z > 24)
    )
      continue;
    const model = ['tree_oak', 'tree_cone', 'tree_default'][i % 3],
      size = 3.2 + rand(i, 3) * 2;
    prop(model, x, z, size, i * 1.7);
    state.colliders.push({
      x0: x - 0.27,
      x1: x + 0.27,
      z0: z - 0.27,
      z1: z + 0.27,
      y0: 5,
      y1: 9,
    });
  }
  for (let i = 0; i < 60; i++) {
    const x = 8 + rand(i, 71) * 62,
      z = 8 + rand(i, 81) * 62;
    if (
      LIVING_PLOTS.some(
        (q) => x > q.x - 2 && x < q.x + 9 && z > q.z - 2 && z < q.z + 10,
      ) ||
      world.get(Math.floor(x), 4, Math.floor(z)) !== 1
    )
      continue;
    prop(
      ['flower_redA', 'flower_yellowA', 'flower_purpleA', 'grass_large'][i % 4],
      x,
      z,
      0.35 + rand(i, 7) * 0.3,
    );
  }
  [
    ['barrel', 9, 62, 1],
    ['barrel-open', 9, 64, 1],
    ['resource-planks', 17, 61, 1.4],
    ['canoe', 11, 68, 3.5],
    ['canoe', 15, 69, 3.1],
    ['canoe_paddle', 14, 64, 1.4],
    ['signpost', 21, 60, 1.8],
    ['tent-canvas', 10, 22, 3],
    ['workbench', 65, 23, 2],
    ['tool-pickaxe', 66, 22, 1.2],
    ['rock-a', 71, 60, 3],
    ['rock-b', 57, 56, 2.2],
    ['rock-c', 72, 48, 3],
    ['campfire-pit', 33, 54, 1.6],
    ['box-open', 36, 35, 1],
    ['fish', 8, 63, 0.7],
    ['fish-large', 9, 64, 0.8],
  ].forEach((a) => prop(...a));
  try {
    const result = await ForestFauna.dressVillageProps(p, state.props);
    for (const b of result.colliders)
      state.colliders.push({
        x0: b.min.x,
        x1: b.max.x,
        y0: b.min.y,
        y1: b.max.y,
        z0: b.min.z,
        z1: b.max.z,
      });
    state.assetCount = result.placements;
    state.models = result.models;
  } catch (e) {
    console.warn('Décor de la vallée indisponible', e);
  }
}
function refreshLivingBuildings() {
  if (!living) return;
  living.reports = livingReports();
  living.plotProps.forEach((g, i) => {
    const report = living.reports[i],
      p = LIVING_PLOTS[i],
      c = S.living.plots[i];
    const key = report.ok + ':' + c.width + ':' + c.depth;
    if (g.userData.key === key) return;
    g.userData.key = key;
    g.children.forEach((o) => o.material?.dispose());
    g.clear();
    if (!report.ok) return;
    if (i === 0) {
      for (let j = 0; j < 2; j++) {
        meshBox(
          g,
          p.x + 1.8 + j * 1.5,
          6.22,
          p.z + 2.7,
          1,
          0.44,
          1.8,
          0x755b48,
        );
        meshBox(
          g,
          p.x + 1.8 + j * 1.5,
          6.48,
          p.z + 2.7,
          0.95,
          0.1,
          1.7,
          j ? 0xb39464 : 0x668c94,
        );
        meshBox(
          g,
          p.x + 1.8 + j * 1.5,
          6.56,
          p.z + 2.15,
          0.8,
          0.12,
          0.45,
          0xe8dcc3,
        );
      }
    }
    if (i === 1)
      for (let x = 1; x < c.width - 1; x++)
        for (let z = 1; z < c.depth - 1; z++) {
          meshBox(
            g,
            p.x + x + 0.5,
            6.1,
            p.z + z + 0.5,
            0.7,
            0.2,
            0.7,
            0x77593e,
          );
          const plant = meshBox(
            g,
            p.x + x + 0.5,
            6.4,
            p.z + z + 0.5,
            0.2,
            0.5,
            0.2,
            0x75a648,
          );
          plant.userData.plant = true;
        }
    if (i === 2)
      for (let j = 0; j < Math.min(6, report.capacity); j++)
        meshBox(
          g,
          p.x + 1.6 + (j % (c.width - 2)),
          6.4,
          p.z + 1.6 + Math.floor(j / (c.width - 2)),
          0.7,
          0.8,
          0.7,
          0xae8655,
        );
  });
}
function livingNPCStep(o, dt) {
  if (!o.path?.length) return false;
  const [x, z] = o.path[0],
    dx = x - o.pos.x,
    dz = z - o.pos.z,
    d = Math.hypot(dx, dz),
    speed = Math.min(d, dt * 1.45),
    a = Math.atan2(dx, dz);
  const nx = o.pos.x + Math.sin(a) * speed,
    nz = o.pos.z + Math.cos(a) * speed;
  const y = world.get(Math.floor(nx), 5, Math.floor(nz)) ? 6 : 5;
  if (collision(nx, y, nz)) {
    o.path = [];
    o.routeAt = living.time + 1;
    return false;
  }
  o.pos.set(nx, y, nz);
  o.group.rotation.y = a;
  if (d < 0.05) o.path.shift();
  o.legs?.forEach(
    (leg, i) =>
      (leg.rotation.x = Math.sin(living.time * 7 + i * Math.PI) * 0.32),
  );
  return true;
}
function animateLiving(dt) {
  if (!living) return;
  living.time += dt;
  const state = S.living;
  if (living.time - living.lastReport > 1) {
    refreshLivingBuildings();
    living.lastReport = living.time;
  }
  const night = !!living.night;
  living.sky.intensity = night ? 1.2 : 2.3;
  living.sun.intensity = night ? 0.45 : 2.5;
  scene.background.setHex(night ? 0x536b80 : 0xbacdd0);
  scene.fog.color.copy(scene.background);
  advanceLivingProduction(dt);
  living.plotProps[1].children.forEach((o) => {
    if (o.userData.plant) {
      o.scale.y = 0.15 + (state.growth / 45) * 0.35;
      o.position.y = 6.2 + o.scale.y / 2;
    }
  });
  living.lamps.forEach((m, i) => {
    m.material.color.setHex(state.lights[i] ? 0xffdd8a : 0x53636b);
    m.material.emissive.setHex(state.lights[i] ? 0xa87a2c : 0);
  });
  const ready = livingNightReady(living.reports, state.lights, state.gate);
  living.gate.position.y = ready.circuit ? 1 : 3.5;
  for (const [i, o] of living.npcs.entries()) {
    if (!livingNPCStep(o, dt)) {
      o.legs.forEach((l) => (l.rotation.x = 0));
      if (living.time > o.routeAt) {
        const report =
          living.reports[night ? 0 : i === 0 ? 0 : i === 1 ? 1 : 2];
        const plotIndex = night ? 0 : i,
          site = LIVING_PLOTS[plotIndex];
        const dest =
          report.ok && report.door.length
            ? [
                site.x + 1.5 + (night ? i : 0),
                site.z +
                  (plotIndex === 2 ? S.living.plots[2].depth - 1.5 : 1.5),
              ]
            : o.home;
        // Alternate between the building entrance and work. A blocked path is
        // retried, never replaced by walking through a wall.
        o.shift = !o.shift;
        const goal = night ? dest : o.shift ? dest : o.home;
        o.path = livingPath(
          (x, y, z) => world.get(x, y, z),
          [o.pos.x, o.pos.z],
          goal,
          (x, z) => livingCollision(x + 0.5, 5, z + 0.5),
        );
        o.routeAt = living.time + 9;
      }
    }
  }
  if (night) tickLivingNight(dt, ready);
  if (GamePlatform) {
    GamePlatform.listener(
      player.pos.x,
      player.pos.y + 1.6,
      player.pos.z,
      player.yaw,
    );
    GamePlatform.ambient(!paused && S.settings.sound, [
      player.pos.x < 23
        ? 'forest'
        : player.pos.x > 53 && player.pos.z > 44
          ? 'volcano'
          : 'village',
      player.pos.x,
      player.pos.z,
    ]);
  }
}
function advanceLivingProduction(dt, quiet = false) {
  if (!living || !livingProduction(S.living, living.reports, dt)) return;
  S.stats.harvest++;
  S.xp += 2;
  if (!quiet) {
    toast('Noé a récolté 6 provisions. Le prochain convoi peut partir.');
    sfx('harvest');
  }
  saveGame(false);
}
function startLivingNight() {
  if (!living) return;
  closeModal();
  living.night = { elapsed: 0, blocked: false };
  const o = living.watchers[0];
  o.pos.set(55.5, 5, 38.5);
  o.group.visible = true;
  o.path = [];
  toast(
    'Veillée de 30 secondes : observe le veilleur et protège le trajet vers l’abri.',
  );
}
function tickLivingNight(dt, ready) {
  const n = living.night,
    o = living.watchers[0];
  n.elapsed += dt;
  // The creature stops at a lit square or a correctly locked gate.
  const blocked = (x, z) =>
    livingCollision(x + 0.5, 5, z + 0.5) ||
    (ready.circuit && x === 48 && z >= 36 && z <= 40) ||
    S.living.lights.some(
      (on, i) =>
        on &&
        Math.hypot(x + 0.5 - LIVING_LAMPS[i][0], z + 0.5 - LIVING_LAMPS[i][1]) <
          3.3,
    );
  if (!o.path.length && n.elapsed - (n.lastPath || -3) > 2) {
    o.path = livingPath(
      (x, y, z) => world.get(x, y, z),
      [o.pos.x, o.pos.z],
      [32.5, 38.5],
      blocked,
    );
    n.lastPath = n.elapsed;
  }
  if (o.path.length) {
    const next = o.path[0];
    if (blocked(Math.floor(next[0]), Math.floor(next[1]))) o.path = [];
    else livingNPCStep(o, dt * 0.6);
  }
  const moving = o.path.length > 0;
  if (o.mixer) {
    const action = moving ? o.run : o.idle;
    if (action !== o.motion) {
      action.reset().play();
      o.motion.crossFadeTo(action, 0.2, false);
      o.motion = action;
    }
    o.mixer.update(dt);
  }
  if (o.pos.x < 34 || n.elapsed >= 30) {
    const success = n.elapsed >= 30 && ready.ok;
    living.night = null;
    o.group.visible = false;
    S.living.nightCount++;
    if (success) {
      S.living.nightWon = true;
      S.living.stock.coins += 4;
      livingSuccess(
        'night',
        'La lumière couvre le chemin, le circuit ferme la porte et la maison offre un abri. Le village a passé la nuit ensemble.',
      );
    } else {
      livingRecord('night', false);
      livingNightPanel(
        'Le convoi attend à l’abri du port. Aucun objet n’est perdu. Vérifie les zones sans lumière, la porte et le toit avant une nouvelle veillée.',
      );
    }
  }
}
function livingTravel(id) {
  if (!living) return;
  if (livingFocus) exitLivingFocus();
  const p = LIVING_CONTENT.landmarks[id] || [38, 39];
  player.pos.set(p[0] + 0.5, 5, p[1] + 4.5);
  player.yaw = 0;
  player.pitch = 0;
  player.velY = 0;
  livingSafePlayer();
  movePlayer(0);
  S.living.guide = id;
  if (!S.living.visited.includes(id)) S.living.visited.push(id);
  streamTerrain(true);
  closeModal();
  updateHUD();
  saveGame(false);
}
function livingHUD() {
  if (!living) return null;
  const id = S.living.guide,
    p = LIVING_PLOTS.find((q) => q.id === id),
    report = p ? living.reports[LIVING_PLOTS.indexOf(p)] : null;
  const destination = LIVING_CONTENT.landmarks[id] || [38, 39];
  $('biome').textContent =
    player.pos.x < 23 && player.pos.z < 33
      ? 'LE BOIS DES EXPLORATEURS'
      : player.pos.x > 53 && player.pos.z < 30
        ? 'LA GALERIE DES FOSSILES'
        : player.pos.x > 53 && player.pos.z > 44
          ? 'LE VOLCAN ENDORMI'
          : player.pos.x < 23 && player.pos.z > 53
            ? 'LE PORT DES ÉCHANGES'
            : 'LA VALLÉE DES INVENTEURS';
  $('trackedName').textContent = living.night
    ? 'La veillée · ' + Math.ceil(30 - living.night.elapsed) + ' s'
    : p
      ? p.short
      : LIVING_SKILLS[id]?.split(' · ')[1] || 'Fais grandir le village';
  $('trackedText').textContent = p
    ? report?.ok
      ? 'Bâtiment en service. Tu peux l’agrandir ou partir en expédition.'
      : 'Approche le panneau. Construis puis vérifie les usages.'
    : 'Journal ◈ : itinéraires, réserves et missions. Chaque découverte aide le village.';
  $('waypointText').textContent =
    `Réserves : ${S.living.stock.food} provisions · ${S.living.stock.coins} pièces`;
  $('clock').textContent = living.night ? '☾ Veillée' : '☀ Journée';
  $('day').textContent =
    living.reports.filter((r) => r.ok).length + ' / 3 bâtiments en service';
  return { x: destination[0], z: destination[1], name: p?.short || 'Mission' };
}
function drawLivingMap(canvas) {
  const ctx = canvas.getContext('2d'),
    size = canvas.width,
    scale = size / 80;
  ctx.fillStyle = '#64815d';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#4c6c47';
  ctx.fillRect(5 * scale, 5 * scale, 38 * scale, 22 * scale);
  ctx.fillStyle = '#979078';
  ctx.fillRect(55 * scale, 9 * scale, 15 * scale, 14 * scale);
  ctx.fillStyle = '#785a4c';
  ctx.fillRect(54 * scale, 45 * scale, 22 * scale, 22 * scale);
  ctx.fillStyle = '#609da4';
  ctx.fillRect(5 * scale, 65 * scale, 14 * scale, 10 * scale);
  ctx.strokeStyle = '#d0b58b';
  ctx.lineWidth = 2 * scale;
  for (const p of Object.values(LIVING_CONTENT.landmarks)) {
    ctx.beginPath();
    ctx.moveTo(38 * scale, 39 * scale);
    ctx.lineTo(p[0] * scale, 39 * scale);
    ctx.lineTo(p[0] * scale, p[1] * scale);
    ctx.stroke();
  }
  LIVING_PLOTS.forEach((p, i) => {
    ctx.fillStyle = living.reports[i].ok ? '#f1dd9c' : '#466a6b';
    ctx.fillRect(p.x * scale, p.z * scale, 7 * scale, 7 * scale);
  });
  for (const [key, p] of Object.entries(LIVING_CONTENT.landmarks)) {
    if (key === 'hub') continue;
    ctx.fillStyle = key === S.living.guide ? '#ffe2a2' : '#f4eee0';
    ctx.beginPath();
    ctx.arc(p[0] * scale, p[1] * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(player.pos.x * scale, player.pos.z * scale);
  ctx.rotate(-player.yaw);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(-3, 4);
  ctx.lineTo(3, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
