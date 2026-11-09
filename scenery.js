let sceneryAnchors = [],
  sceneryColliders = [],
  sceneryReady = null,
  sceneryReport = null;
function dressVillageScenery() {
  const objects = [...restorationProps];
  const add = (name, x, z, size, y = null, yaw = 0) => {
    const gx = Math.floor(x),
      gz = Math.floor(z),
      base = world.top(gx, gz);
    if (y === null && world.get(gx, base, gz)) return;
    objects.push({
      name,
      x,
      z,
      y: y === null ? base : y,
      size,
      yaw,
      anchor:
        y === null ? [gx, base - 1, gz, world.get(gx, base - 1, gz)] : null,
    });
  };
  // A consistent small-prop layer complements the editable voxel architecture.
  const flowers = [
    'flower_redA',
    'flower_yellowA',
    'flower_purpleA',
    'grass_large',
    'plant_bushSmall',
    'plant_bushDetailed',
    'mushroom_redGroup',
    'mushroom_tanGroup',
    'rock_smallA',
    'rock_smallB',
  ];
  for (let x = 3; x < 78; x += 4)
    for (let z = 3; z < 78; z += 5) {
      if (rand(x, z, 451) < 0.64 || restorationReserved(x, 6, z)) continue;
      const y = world.top(x, z);
      if (
        world.get(x, y - 1, z) !== 1 ||
        world.get(x, y, z) ||
        interactive.some((o) => Math.hypot(o.pos.x - x, o.pos.z - z) < 2)
      )
        continue;
      const name = flowers[Math.floor(rand(x, z, 95) * flowers.length)];
      add(
        name,
        x + 0.5,
        z + 0.5,
        name.startsWith('plant') ? 0.7 : name.startsWith('rock') ? 0.4 : 0.45,
      );
    }
  add('workbench-anvil', 41, 51, 1.2, 6);
  add('tool-pickaxe', 39.8, 51.5, 0.65);
  add('tool-axe', 26.5, 39.5, 0.7);
  add('resource-wood', 28, 41, 1.3);
  add('log_stack', 22, 52, 1.4);
  add('bucket', 32, 47, 0.6);
  add('canoe', 52, 59, 2.8, 3.4);
  add('canoe_paddle', 52.2, 59, 1.5, 3.65);
  for (const [x, z] of [
    [49, 39],
    [50, 31],
    [51, 23],
  ])
    add('lily_small', x, z, 0.6, 3.42);
  const parent = new THREE.Group();
  parent.name = 'village-licensed-props';
  scene.add(parent);
  sceneryReady = ForestFauna.dressVillageProps(objects, parent)
    .then((report) => {
      sceneryReport = report;
      sceneryColliders = report.colliders;
      sceneryAnchors = report.anchors;
      for (const a of sceneryAnchors)
        refreshSceneryAt(a.anchor[0], a.anchor[2]);
      return report;
    })
    .catch((e) => {
      console.error('Décors :', e);
      throw e;
    });
  sceneryReady.catch(() => {});
}
function sceneryCollision(x, y, z) {
  if (world.isEmber || world.isLiving) return false;
  return sceneryColliders.some(
    (b) =>
      x + 0.26 > b.min.x &&
      x - 0.26 < b.max.x &&
      y + 0.03 < b.max.y &&
      y + 1.72 > b.min.y &&
      z + 0.26 > b.min.z &&
      z - 0.26 < b.max.z,
  );
}
function refreshSceneryAt(x, z) {
  if (world.isEmber || world.isLiving) return;
  for (const a of sceneryAnchors) {
    const [gx, y, gz, id] = a.anchor;
    if (gx !== x || gz !== z) continue;
    const supported = world.get(gx, y, gz) === id && !world.get(gx, y + 1, gz);
    a.mesh.setMatrixAt(
      a.index,
      supported ? a.matrix : new THREE.Matrix4().makeScale(0, 0, 0),
    );
    a.mesh.instanceMatrix.needsUpdate = true;
  }
}
