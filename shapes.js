// Stable IDs: 1–26 belong to the original world; new materials start at 27.
const BUILD_MATERIALS = [
  { key: 'plank', id: 7, name: 'Chêne', color: '#bc925a', family: 'Bois' },
  {
    key: 'lightwood',
    id: 27,
    name: 'Bois clair',
    color: '#e0c99e',
    family: 'Bois',
  },
  {
    key: 'darkwood',
    id: 28,
    name: 'Bois sombre',
    color: '#654a40',
    family: 'Bois',
  },
  { key: 'stone', id: 3, name: 'Pierre', color: '#8d9691', family: 'Pierre' },
  {
    key: 'brick',
    id: 8,
    name: 'Briques de pierre',
    color: '#99a69c',
    family: 'Pierre',
  },
  { key: 'slate', id: 29, name: 'Ardoise', color: '#4f6278', family: 'Pierre' },
  {
    key: 'limestone',
    id: 30,
    name: 'Calcaire',
    color: '#ded5b5',
    family: 'Pierre',
  },
  {
    key: 'terracotta',
    id: 31,
    name: 'Terre cuite',
    color: '#bd694f',
    family: 'Décoration',
  },
  {
    key: 'mosaic',
    id: 32,
    name: 'Mosaïque',
    color: '#5bb4b1',
    family: 'Décoration',
  },
  {
    key: 'copperblock',
    id: 33,
    name: 'Cuivre décoratif',
    color: '#bb885e',
    family: 'Décoration',
  },
  {
    key: 'blueblock',
    id: 34,
    name: 'Céramique bleue',
    color: '#438dbc',
    family: 'Couleurs',
  },
  {
    key: 'redblock',
    id: 35,
    name: 'Céramique rouge',
    color: '#c05a64',
    family: 'Couleurs',
  },
  {
    key: 'yellowblock',
    id: 36,
    name: 'Céramique jaune',
    color: '#e7bf58',
    family: 'Couleurs',
  },
  {
    key: 'whiteblock',
    id: 37,
    name: 'Céramique blanche',
    color: '#e8e5df',
    family: 'Couleurs',
  },
  {
    key: 'greenblock',
    id: 38,
    name: 'Céramique verte',
    color: '#71a785',
    family: 'Couleurs',
  },
  {
    key: 'glass',
    id: 16,
    name: 'Verre',
    color: '#9acccf',
    family: 'Décoration',
  },
];
const BUILD_SHAPES = [
  {
    key: 'cube',
    name: 'Cube',
    turns: 1,
    lesson: '6 faces carrées, 12 arêtes et 8 sommets.',
  },
  {
    key: 'slab',
    name: 'Demi-bloc',
    turns: 2,
    lesson:
      'Deux demi-blocs remplissent le même volume qu’un cube. La rotation choisit la moitié basse ou haute.',
  },
  {
    key: 'stairs',
    name: 'Escalier',
    turns: 4,
    lesson: 'Deux marches de même hauteur : chacune mesure un demi-bloc.',
  },
  {
    key: 'wedge',
    name: 'Prisme triangulaire',
    turns: 4,
    lesson:
      'Deux faces triangulaires et trois faces à quatre côtés. Sa pente sert à construire un toit.',
  },
  {
    key: 'cylinder',
    name: 'Cylindre',
    turns: 1,
    lesson:
      'Deux bases circulaires et une surface courbe. Observe-le de dessus et de côté.',
  },
  {
    key: 'sphere',
    name: 'Sphère',
    turns: 1,
    lesson:
      'Une surface courbe, sans arête ni sommet : elle ressemble à une balle.',
  },
  {
    key: 'pyramid',
    name: 'Pyramide',
    turns: 1,
    lesson: 'Une base carrée, quatre faces triangulaires et cinq sommets.',
  },
];
const BUILD_BLOCKS = {},
  BUILD_LOOKUP = new Map();
let buildNextID = 39;
for (const m of BUILD_MATERIALS) {
  if (m.id >= 27)
    BUILD_BLOCKS[m.id] = {
      name: m.name,
      drop: m.key,
      color: m.color,
      hard: 0.65,
    };
  for (const s of BUILD_SHAPES)
    for (let rotation = 0; rotation < s.turns; rotation++) {
      const id = s.key === 'cube' ? m.id : buildNextID++;
      BUILD_LOOKUP.set(m.key + ':' + s.key + ':' + rotation, id);
      if (s.key !== 'cube')
        BUILD_BLOCKS[id] = {
          name: s.name + ' · ' + m.name,
          drop: m.key,
          color: m.color,
          hard: 0.55,
          shape: s.key,
          rotation,
          texture: m.id,
        };
    }
}
const BUILD_LIMIT = buildNextID; // 247, within Uint8 storage.
function validBuildVoxel(id) {
  return (
    Number.isInteger(id) &&
    id >= 0 &&
    (id < 24 || (id >= 27 && id < BUILD_LIMIT))
  );
}
function buildID(material, shape = 'cube', rotation = 0) {
  const s = BUILD_SHAPES.find((s) => s.key === shape);
  return BUILD_LOOKUP.get(material + ':' + shape + ':' + (rotation % s.turns));
}
const shapeCache = new Map();
function shapeGeometry(info) {
  const key = info.shape + ':' + info.rotation;
  if (shapeCache.has(key)) return shapeCache.get(key);
  let g;
  if (info.shape === 'slab')
    g = new THREE.BoxGeometry(1, 0.5, 1).translate(
      0.5,
      info.rotation ? 0.75 : 0.25,
      0.5,
    );
  if (info.shape === 'stairs') {
    const a = new THREE.BoxGeometry(1, 0.5, 1)
      .translate(0.5, 0.25, 0.5)
      .toNonIndexed();
    const b = new THREE.BoxGeometry(1, 0.5, 0.5)
      .translate(0.5, 0.75, 0.25)
      .toNonIndexed();
    g = new THREE.BufferGeometry();
    for (const attr of ['position', 'normal', 'uv'])
      g.setAttribute(
        attr,
        new THREE.Float32BufferAttribute(
          [...a.attributes[attr].array, ...b.attributes[attr].array],
          a.attributes[attr].itemSize,
        ),
      );
    a.dispose();
    b.dispose();
  }
  if (info.shape === 'wedge') {
    const v = [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 1],
        [0, 1, 0],
        [1, 1, 0],
      ],
      faces = [
        4, 5, 2, 4, 2, 3, 0, 3, 2, 0, 2, 1, 0, 1, 5, 0, 5, 4, 0, 4, 3, 1, 2, 5,
      ];
    for (let i = 0; i < faces.length; i += 3)
      [faces[i + 1], faces[i + 2]] = [faces[i + 2], faces[i + 1]];
    g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        faces.flatMap((i) => v[i]),
        3,
      ),
    );
    g.computeVertexNormals();
    g.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(
        faces.flatMap((i) => [v[i][0] || v[i][2], v[i][1]]),
        2,
      ),
    );
  }
  if (info.shape === 'cylinder')
    g = new THREE.CylinderGeometry(0.45, 0.45, 1, 16).translate(0.5, 0.5, 0.5);
  if (info.shape === 'sphere')
    g = new THREE.SphereGeometry(0.5, 16, 10).translate(0.5, 0.5, 0.5);
  if (info.shape === 'pyramid')
    g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4)
      .rotateY(Math.PI / 4)
      .translate(0.5, 0.5, 0.5);
  if (info.shape !== 'slab' && info.rotation)
    g.translate(-0.5, 0, -0.5)
      .rotateY((info.rotation * Math.PI) / 2)
      .translate(0.5, 0, 0.5);
  if (g.index) {
    const old = g;
    g = g.toNonIndexed();
    old.dispose();
  }
  shapeCache.set(key, g);
  return g;
}
function localShapeBox(info, lo, hi) {
  if (!info.rotation || info.shape === 'slab') return [lo, hi];
  const a = (info.rotation * Math.PI) / 2,
    c = Math.cos(a),
    s = Math.sin(a),
    xs = [],
    zs = [];
  for (const x of [lo[0], hi[0]])
    for (const z of [lo[2], hi[2]]) {
      xs.push(c * (x - 0.5) - s * (z - 0.5) + 0.5);
      zs.push(s * (x - 0.5) + c * (z - 0.5) + 0.5);
    }
  return [
    [Math.min(...xs), lo[1], Math.min(...zs)],
    [Math.max(...xs), hi[1], Math.max(...zs)],
  ];
}
function shapeIntersects(info, lo, hi) {
  if (hi.some((v, i) => v <= 0) || lo.some((v) => v >= 1)) return false;
  [lo, hi] = localShapeBox(info, lo, hi);
  const y = Math.max(0, lo[1]),
    z = Math.max(0, lo[2]);
  if (!info.shape) return true;
  if (info.shape === 'slab') return info.rotation ? hi[1] > 0.5 : lo[1] < 0.5;
  if (info.shape === 'stairs') return y < 0.5 || z < 0.5;
  if (info.shape === 'wedge') return y < 1 - z;
  const near = (i) => Math.max(lo[i], Math.min(0.5, hi[i])) - 0.5;
  if (info.shape === 'cylinder') return near(0) ** 2 + near(2) ** 2 < 0.45 ** 2;
  if (info.shape === 'sphere')
    return near(0) ** 2 + near(1) ** 2 + near(2) ** 2 < 0.25;
  if (info.shape === 'pyramid')
    return y < 1 - 2 * Math.max(Math.abs(near(0)), Math.abs(near(2)));
  return true;
}
function pickShape(info, origin, dir) {
  const p = shapeGeometry(info).attributes.position,
    ray = new THREE.Ray(origin, dir),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    out = new THREE.Vector3();
  let best = null;
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    if (ray.intersectTriangle(a, b, c, false, out)) {
      const d = origin.distanceTo(out);
      if (!best || d < best.d)
        best = {
          d,
          normal: b.clone().sub(a).cross(c.clone().sub(a)).normalize(),
        };
    }
  }
  return best;
}
function appendShape(info, x, y, z, pos, norm, uv, colors, indices, count) {
  const g = shapeGeometry(info),
    p = g.attributes.position,
    n = g.attributes.normal,
    t = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i),
      ny = n.getY(i),
      nz = n.getZ(i),
      face = ny > 0.5 ? 0 : ny < -0.5 ? 2 : 1,
      tile = (info.texture - 1) * 3 + face;
    pos.push(x + p.getX(i), y + p.getY(i), z + p.getZ(i));
    norm.push(nx, ny, nz);
    uv.push(
      ((tile % 16) + 0.01 + t.getX(i) * 0.98) / 16,
      1 - (Math.floor(tile / 16) + 0.01 + (1 - t.getY(i)) * 0.98) / 16,
    );
    const shade = 0.78 + 0.2 * Math.max(0, ny);
    colors.push(shade, shade, shade);
    indices.push(count++);
  }
  return count;
}
