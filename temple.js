// Local coordinates run east (+x) and south (+z). The receiver is in the north wall.
const templeSites = [
  [59, 53],
  [59, 35],
  [55, 1],
];
const mirrorTiles = [
  [9, 12],
  [9, 8],
  [4, 8],
];
const templeDiscovery = 'temple:eclipse';
let temple = null;

function traceTempleRay(mask) {
  let x = 0,
    z = 12,
    dx = 1,
    dz = 0;
  const points = [[x, z]],
    mirrors = [];
  for (let i = 0; i < 80; i++) {
    x += dx;
    z += dz;
    const index = mirrorTiles.findIndex(([a, b]) => a === x && b === z);
    if (index >= 0) {
      points.push([x, z]);
      mirrors.push(index);
      const sign = mask & (1 << index) ? -1 : 1;
      [dx, dz] = [sign * dz, sign * dx];
    } else if (x === 0 || x === 14 || z === 5 || z === 15) {
      points.push([x, z]);
      return { points, mirrors, solved: x === 4 && z === 5 };
    }
  }
  throw Error('Trajet optique sans issue');
}

function buildTemple() {
  const s = S.temple;
  if (s.site === -1) {
    // Pick untouched land on migration, including player-dug air blocks.
    const edits = Object.keys(S.edits).map(Number);
    s.site = templeSites.findIndex(
      ([x, z]) =>
        !edits.some((n) => {
          const a = n % VW,
            b = Math.floor(n / VW) % VD;
          return a >= x && a <= x + 14 && b >= z && b <= z + 17;
        }),
    );
  }
  if (s.site < 0) return;
  const [x, z] = templeSites[s.site];
  const group = new THREE.Group();
  group.position.set(x + 0.5, 6, z + 0.5);
  scene.add(group);
  temple = {
    x,
    z,
    group,
    mirrors: [],
    beams: [],
    moon: null,
    path: [],
    length: 0,
  };
  // A low open court leads to a vaulted, enclosed inner chamber.
  for (let a = 0; a <= 14; a++)
    for (let b = 0; b <= 17; b++) {
      if (b > 15 && (a < 5 || a > 9)) continue;
      const floor = b === 17 ? 4 : 5;
      world.heights[x + a + (z + b) * VW] = floor;
      for (let y = 1; y <= 12; y++) {
        const border = a === 1 || a === 13 || b === 6 || b === 14;
        let block = y <= floor ? (y === floor ? (border ? 26 : 25) : 6) : 0;
        const edge = a === 0 || a === 14 || b === 0 || b === 15;
        const pillar =
          edge &&
          ((a % 7 === 0 && b % 5 === 0) ||
            ((a === 0 || a === 14) && b % 4 === 0));
        if (b <= 15 && y > floor) {
          if (edge && y <= (b <= 5 || pillar ? 10 : 7))
            block = y === 9 ? 26 : 24;
          if (b === 15 && a >= 6 && a <= 8) block = y === 10 ? 26 : 0;
          if (b === 15 && (a === 5 || a === 9) && y <= 10) block = 24;
          if (b === 5 && y <= 10)
            block = a >= 6 && a <= 8 && y <= 8 ? (s.open ? 0 : 18) : 24;
          if (b <= 5 && y === 11) block = a >= 5 && a <= 9 && b <= 3 ? 16 : 25;
        }
        world.set(x + a, y, z + b, block);
        world.protected.add(world.index(x + a, y, z + b));
      }
    }
  const brass = 0xcb964c,
    teal = 0x277778;
  function part(a, y, b, w, h, d, color) {
    return meshBox(group, a, y, b, w, h, d, color);
  }
  function light(mesh, color) {
    mesh.material.emissive.setHex(color);
    mesh.material.emissiveIntensity = 0.9;
    return mesh;
  }
  function actor(id, label, a, b) {
    interactive.push({
      kind: 'temple',
      id,
      label,
      pos: new THREE.Vector3(x + a + 0.5, 6, z + b + 0.5),
      group,
    });
  }
  for (const a of [2, 12]) {
    for (const b of [1, 5, 15]) {
      part(a, 1.55, b, 0.55, 3.1, 0.55, teal);
      part(a, 3.1, b, 0.86, 0.24, 0.86, brass);
    }
  }
  for (let a = 1; a < 14; a++) {
    const star = part(a, 3.7, 5.55, 0.24, 0.24, 0.08, brass);
    star.rotation.z = Math.PI / 4;
  }
  // A stepped portal and a sun disc frame the chamber from the entrance.
  for (const a of [5.25, 8.75]) {
    part(a, 1.5, 5.65, 0.72, 3, 0.66, teal);
    for (const h of [0.18, 2.72, 3.05])
      part(a, h, 5.7, 0.96, 0.16, 0.85, brass);
  }
  part(7, 3.2, 5.73, 4.55, 0.25, 0.71, teal);
  part(7, 3.42, 5.73, 4.85, 0.17, 0.78, brass);
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const ray = part(
      7 + Math.cos(angle) * 0.84,
      4.48 + Math.sin(angle) * 0.84,
      5.78,
      i % 2 ? 0.31 : 0.59,
      0.095,
      0.12,
      brass,
    );
    ray.rotation.z = angle;
  }
  const sunDisc = part(7, 4.48, 5.8, 0.97, 0.97, 0.23, brass);
  sunDisc.rotation.z = Math.PI / 4;
  part(7, 4.48, 5.97, 0.65, 0.65, 0.12, teal);
  light(part(0.55, 1.45, 12, 0.4, 0.7, 0.7, brass), 0xffaa32);
  temple.receiver = light(part(4, 1.45, 5.52, 0.8, 0.8, 0.18, teal), 0x164745);
  mirrorTiles.forEach(([a, b], i) => {
    world.set(x + a, 6, z + b, 24);
    part(a, 1.01, b, 1.05, 0.09, 1.05, teal);
    part(a, 0.75, b, 0.32, 1.0, 0.32, brass);
    const frame = new THREE.Group();
    frame.position.set(a, 1.45, b);
    group.add(frame);
    meshBox(frame, 0, 0, 0, 1.24, 1.02, 0.13, brass);
    meshBox(frame, 0, 0, 0, 1.08, 0.86, 0.15, 0xa5dbe1);
    batchRigidParts(frame);
    temple.mirrors.push(frame);
    actor(i, 'Pivoter le miroir ' + (i + 1), a, b);
  });
  for (let i = 0; i < 4; i++)
    temple.beams.push(light(part(0, 1.45, 0, 1, 0.065, 1, 0xffe5a2), 0xffb735));
  temple.spark = light(part(0, 1.45, 12, 0.17, 0.17, 0.17, 0xfffbde), 0xffffa3);
  part(7, 0.25, 2, 2.8, 0.5, 2.8, teal);
  part(7, 0.77, 2, 0.46, 0.65, 0.46, brass);
  part(7, 1.15, 2, 0.58, 0.58, 0.58, 0x447fad);
  light(part(5.1, 1.15, 2, 0.78, 0.78, 0.78, brass), 0xffa339);
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    part(
      7 + Math.cos(angle),
      0.53,
      2 + Math.sin(angle),
      0.13,
      0.07,
      0.13,
      brass,
    );
  }
  temple.moon = part(7, 1.15, 3, 0.33, 0.33, 0.33, 0xe1dbcb);
  actor('moon', 'Tourner la Lune', 7, 2);
  actor('observe', 'Observer depuis la Terre', 10, 2);
  world.set(x + 10, 6, z + 2, 24);
  part(10, 1.15, 2, 0.32, 0.4, 0.32, brass);
  part(10, 1.49, 2, 1.15, 0.34, 0.36, teal);
  part(9.45, 1.49, 2, 0.12, 0.46, 0.47, brass);
  batchRigidParts(group, [temple.moon]);
  refreshTemple();
}

function refreshTemple() {
  const s = S.temple,
    ray = traceTempleRay(s.mask);
  temple.path = ray.points;
  temple.length = 0;
  temple.mirrors.forEach((frame, i) => {
    frame.rotation.y = ((s.mask & (1 << i) ? 1 : -1) * Math.PI) / 4;
  });
  temple.beams.forEach((beam, i) => {
    beam.visible = i < ray.points.length - 1;
    if (!beam.visible) return;
    const [x, z] = ray.points[i],
      [a, b] = ray.points[i + 1];
    temple.length += Math.abs(x - a) + Math.abs(z - b);
    beam.position.set((x + a) / 2, 1.45, (z + b) / 2);
    beam.scale.set(Math.abs(x - a) || 0.065, 0.065, Math.abs(z - b) || 0.065);
  });
  temple.receiver.material.emissive.setHex(s.open ? 0x60ffcf : 0x164745);
  const angle = (s.moon * Math.PI) / 4;
  temple.moon.position.set(7 + Math.sin(angle), 1.15, 2 + Math.cos(angle));
}

function animateTemple(time) {
  if (!temple) return;
  temple.group.visible =
    Math.abs(player.pos.x - temple.x - 7) < 52 &&
    Math.abs(player.pos.z - temple.z - 8) < 52;
  if (!temple.group.visible) return;
  let travel = (time * 3) % temple.length;
  for (let i = 1; i < temple.path.length; i++) {
    const [x, z] = temple.path[i - 1],
      [a, b] = temple.path[i];
    const length = Math.abs(x - a) + Math.abs(z - b);
    if (travel <= length) {
      temple.spark.position.set(
        x + ((a - x) * travel) / length,
        1.45,
        z + ((b - z) * travel) / length,
      );
      break;
    }
    travel -= length;
  }
}

function useTemple(id) {
  const s = S.temple;
  if (id === 'moon' || id === 'observe') {
    if (!s.open) return;
    if (S.journal.includes(templeDiscovery)) {
      toast('La boussole révèle les caches sur ta grande carte.');
      return;
    }
    if (id === 'moon') {
      s.moon = (s.moon + 1) % 8;
      toast(
        'Quand la Lune cache le Soleil à la Terre, vérifie avec la lunette.',
      );
    } else if (s.moon === 6) {
      S.journal.push(templeDiscovery);
      S.xp += 60;
      sfx('success');
      modal(
        'La boussole des caches',
        'OBSERVATOIRE · ÉCLIPSE SOLAIRE',
        '<p>La Lune passe entre le Soleil et la Terre. Son ombre atteint une partie de la Terre : depuis cet endroit, on voit une éclipse solaire.</p><p>Tu as réveillé la boussole. Sur ta grande carte, un losange doré marque chaque coffre ancien encore fermé.</p><button id="templeMap" class="primary">Déplier ma carte</button>',
      );
      $('templeMap').onclick = showMap;
    } else
      toast(
        s.moon === 2
          ? 'La Terre est au milieu ! Fais passer la Lune de l’autre côté.'
          : 'Le Soleil reste visible. Place la petite Lune entre le Soleil doré et la Terre bleue.',
      );
  } else if (!s.open) {
    s.mask ^= 1 << id;
    const ray = traceTempleRay(s.mask);
    if (ray.solved) {
      s.open = true;
      for (let a = 6; a <= 8; a++)
        for (let y = 6; y <= 8; y++) {
          world.set(temple.x + a, y, temple.z + 5, 0);
          world.dirty.add(
            Math.floor((temple.x + a) / 16) +
              ',' +
              Math.floor((temple.z + 5) / 16),
          );
        }
      toast('La porte de pierre s’ouvre. Entre et observe les trois astres.');
      sfx('success');
    } else {
      toast('Suis le rayon doré jusqu’au prochain miroir.');
      sfx('place');
    }
  } else {
    toast(
      'Le rayon maintient la porte ouverte. Passe sous les étoiles dorées.',
    );
    return;
  }
  refreshTemple();
  saveGame(false);
}

function visitTemple() {
  closeModal();
  player.pos.set(temple.x + 7.5, 6.1, temple.z + 14.9);
  player.yaw = 0;
  player.pitch = 0.08;
  player.velY = 0;
  streamTerrain(true);
  updateHUD();
  toast(
    'Suis le rayon doré. Avec la main, fais pivoter les miroirs vers le carré turquoise.',
  );
  saveGame(false);
}
