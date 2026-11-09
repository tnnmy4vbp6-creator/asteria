// Pure rules shared by the browser and regression tests. No clock, DOM or network.
const LIVING_PLOTS = [
  {
    id: 'home',
    name: 'La maison des voyageurs',
    short: 'Maison',
    x: 25,
    z: 42,
    min: 9,
    story:
      'Mila et Noé attendent un abri. Choisis la taille, les matériaux et la place de la porte. Ils doivent pouvoir entrer et dormir au sec.',
  },
  {
    id: 'garden',
    name: 'La serre de Noé',
    short: 'Serre',
    x: 43,
    z: 42,
    min: 9,
    story:
      'Les expéditions ont besoin de nourriture. Construis une serre lumineuse : au moins six carreaux de verre, un passage et un toit.',
  },
  {
    id: 'store',
    name: 'Le dépôt du port',
    short: 'Entrepôt',
    x: 34,
    z: 27,
    min: 12,
    story:
      'Sami prépare les livraisons. Il lui faut un local fermé avec au moins douze cases libres à l’intérieur. Plus il est grand, plus il contient de réserves.',
  },
];
const LIVING_SKILLS = {
  building: 'Géométrie · Surface, contour et espace intérieur',
  cargo: 'Calcul · Répartir une cargaison',
  forest: 'Anglais · Suivre un itinéraire',
  fossils: 'Sciences · Lire les couches de roches',
  volcano: 'Logique · Conduire l’eau',
  grammar: 'Grammaire · Rédiger une consigne',
  night: 'Logique · Protéger le chemin',
};
function freshLivingState() {
  return {
    active: false,
    supplied: false,
    edits: {},
    pose: null,
    plots: LIVING_PLOTS.map(() => ({ width: 5, depth: 5, rewarded: false })),
    stock: { food: 6, coins: 0, metal: 0 },
    water: 0,
    growth: 0,
    deliveries: 0,
    rounds: {
      cargo: 0,
      forest: 0,
      fossils: 0,
      volcano: 0,
      grammar: 0,
      night: 0,
    },
    mastery: {},
    hints: {},
    lights: [false, false, false, false, false],
    gate: [false, false, false],
    nightWon: false,
    nightCount: 0,
    visited: [],
    guide: 'home',
    discoveries: [],
  };
}
function validLiving(s) {
  const object = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const number = (v, max = 1e6) => Number.isFinite(v) && v >= 0 && v <= max;
  const integer = (v, max = 1e6) => number(v, max) && Number.isInteger(v);
  return (
    object(s) &&
    ['active', 'supplied', 'nightWon'].every(
      (k) => typeof s[k] === 'boolean',
    ) &&
    object(s.edits) &&
    Object.keys(s.edits).length < 30000 &&
    Object.entries(s.edits).every(
      ([k, v]) => integer(+k, 191999) && validBuildVoxel(v),
    ) &&
    (s.pose === null ||
      (object(s.pose) &&
        ['x', 'y', 'z', 'yaw', 'pitch'].every((k) =>
          Number.isFinite(s.pose[k]),
        ) &&
        s.pose.x >= 1 &&
        s.pose.x <= 79 &&
        s.pose.z >= 1 &&
        s.pose.z <= 79 &&
        s.pose.y >= 0 &&
        s.pose.y <= 30)) &&
    Array.isArray(s.plots) &&
    s.plots.length === 3 &&
    s.plots.every(
      (p) =>
        object(p) &&
        [p.width, p.depth].every((v) => [5, 6, 7].includes(v)) &&
        typeof p.rewarded === 'boolean',
    ) &&
    object(s.stock) &&
    ['food', 'coins', 'metal'].every((k) => integer(s.stock[k])) &&
    number(s.water, 120) &&
    number(s.growth, 45) &&
    integer(s.deliveries) &&
    integer(s.nightCount) &&
    object(s.rounds) &&
    ['cargo', 'forest', 'fossils', 'volcano', 'grammar', 'night'].every((k) =>
      integer(s.rounds[k]),
    ) &&
    object(s.mastery) &&
    Object.entries(s.mastery).every(
      ([k, v]) => k in LIVING_SKILLS && integer(v, 6),
    ) &&
    object(s.hints) &&
    Object.entries(s.hints).every(
      ([k, v]) => k in LIVING_SKILLS && integer(v),
    ) &&
    Array.isArray(s.lights) &&
    s.lights.length === 5 &&
    s.lights.every((v) => typeof v === 'boolean') &&
    Array.isArray(s.gate) &&
    s.gate.length === 3 &&
    s.gate.every((v) => typeof v === 'boolean') &&
    [s.visited, s.discoveries].every(
      (v) =>
        Array.isArray(v) &&
        v.length < 50 &&
        v.every((k) => typeof k === 'string' && k.length < 80),
    ) &&
    [
      'home',
      'garden',
      'store',
      'cargo',
      'forest',
      'fossils',
      'volcano',
      'grammar',
      'night',
    ].includes(s.guide)
  );
}
// Only whole, supporting cubes count as a floor/wall. Slopes, arches and slabs
// remain available for decoration and roof silhouettes in the free palette.
function livingFull(id) {
  return !!id && id !== 21 && !BLOCKS[id]?.shape;
}
function inspectLivingPlot(index, config, get) {
  const p = LIVING_PLOTS[index],
    w = config.width,
    d = config.depth;
  const at = (x, y, z) => get(p.x + x, y, p.z + z);
  let floor = 0,
    wall = 0,
    roof = 0,
    glass = 0,
    clear = 0,
    door = [],
    blockedDoor = false;
  const openings = [],
    perimeter = [];
  for (let z = 0; z < d; z++)
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || z === 0 || x === w - 1 || z === d - 1;
      if (livingFull(at(x, 5, z)) && livingFull(at(x, 4, z))) floor++;
      if (edge) {
        perimeter.push([x, z]);
        const lower = at(x, 6, z),
          upper = at(x, 7, z);
        if (livingFull(lower) && livingFull(upper)) wall++;
        else if (
          !lower &&
          !upper &&
          x + z > 0 &&
          !(x === w - 1 && z === d - 1) &&
          !(x === 0 && z === d - 1) &&
          !(z === 0 && x === w - 1)
        ) {
          openings.push([x, z]);
          const ox = x === 0 ? -1 : x === w - 1 ? w : x,
            oz = z === 0 ? -1 : z === d - 1 ? d : z;
          if (at(ox, 5, oz) || at(ox, 6, oz) || at(ox, 7, oz))
            blockedDoor = true;
        }
        if (lower === 16) glass++;
        if (upper === 16) glass++;
      } else if (!at(x, 6, z) && !at(x, 7, z)) clear++;
      // Roof must be joined to the walls through other roof cells (checked below).
      if (at(x, 8, z)) {
        roof++;
        if (at(x, 8, z) === 16) glass++;
      }
    }
  if (
    openings.length >= 1 &&
    openings.length <= 2 &&
    (openings.length === 1 ||
      Math.abs(openings[0][0] - openings[1][0]) +
        Math.abs(openings[0][1] - openings[1][1]) ===
        1)
  )
    door = openings;
  const reachable = new Set(),
    queue = door.map((q) => q.slice());
  for (const [x, z] of queue) reachable.add(x + ',' + z);
  for (let i = 0; i < queue.length; i++)
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const [x, z] = [queue[i][0] + dx, queue[i][1] + dz],
        key = x + ',' + z;
      if (
        x < 0 ||
        z < 0 ||
        x >= w ||
        z >= d ||
        reachable.has(key) ||
        at(x, 6, z) ||
        at(x, 7, z)
      )
        continue;
      reachable.add(key);
      queue.push([x, z]);
    }
  const capacity = (w - 2) * (d - 2);
  const checks = [
    {
      ok: floor === w * d,
      text: `Sol soutenu : ${floor} / ${w * d} cases (${w} × ${d})`,
    },
    {
      ok: wall + door.length === perimeter.length && !!door.length,
      text: `Contour : ${wall} murs, ${door.length} passage${door.length > 1 ? 's' : ''} de porte`,
    },
    {
      ok: clear === capacity && clear >= p.min,
      text: `Espace libre : ${clear} cases, au moins ${p.min}`,
    },
    {
      ok:
        !!door.length &&
        !blockedDoor &&
        reachable.size === capacity + door.length,
      text: 'Une porte de deux blocs de haut rejoint tout l’intérieur',
    },
    {
      ok: roof === w * d,
      text: `Toit continu à la couche 4 : ${roof} / ${w * d} cases`,
    },
  ];
  if (index === 1)
    checks.push({
      ok: glass >= 6,
      text: `Lumière : ${glass} carreaux de verre, au moins 6`,
    });
  return {
    ok: checks.every((c) => c.ok),
    checks,
    floor,
    wall,
    roof,
    glass,
    clear,
    capacity,
    door: door.map(([x, z]) => [p.x + x + 0.5, p.z + z + 0.5]),
    area: w * d,
    perimeter: perimeter.length,
  };
}
function livingTier(s, kind) {
  return Math.max(1, Math.min(3, 1 + Math.floor((s.mastery[kind] || 0) / 2)));
}
function livingVariant(s, kind) {
  const pool = LIVING_CONTENT.challenges[kind].filter(
    (c) => c.tier === livingTier(s, kind),
  );
  return pool[s.rounds[kind] % pool.length];
}
function livingAttempt(s, kind, correct, helped = false) {
  s.mastery[kind] = Math.max(
    0,
    Math.min(
      6,
      (s.mastery[kind] || 0) + (correct && !helped ? 1 : correct ? 0 : -1),
    ),
  );
  if (correct) s.rounds[kind]++;
}
function livingCargoValid(c, load) {
  if (load.length !== c.weights.length) return false;
  return (
    load.every(
      (v, i) =>
        v.length === 2 &&
        v.every((n) => Number.isInteger(n) && n >= 0) &&
        v[0] >= c.minimum &&
        v[0] + v[1] * 2 === c.weights[i],
    ) &&
    load.reduce((n, v) => n + v[0], 0) === c.food &&
    load.reduce((n, v) => n + v[1], 0) === c.wood
  );
}
function livingCapacity(reports) {
  return reports[2].ok ? reports[2].capacity * 3 : 12;
}
function livingProduction(s, reports, dt) {
  // Only active play contributes. Pauses, offline time and imports do not grow crops.
  if (
    !reports[0].ok ||
    !reports[1].ok ||
    !s.water ||
    s.stock.food >= livingCapacity(reports)
  )
    return false;
  const elapsed = Math.min(Math.max(dt, 0), 1),
    amount = Math.min(elapsed, s.water);
  s.water = Math.max(0, s.water - amount);
  s.growth = Math.min(45, s.growth + amount);
  if (s.growth < 45) return false;
  s.growth = 0;
  s.stock.food = Math.min(livingCapacity(reports), s.stock.food + 6);
  return true;
}
function livingPath(get, from, to, blocked = () => false) {
  const start = [Math.floor(from[0]), Math.floor(from[1])],
    end = [Math.floor(to[0]), Math.floor(to[1])];
  const queue = [start],
    prev = new Map([[start.join(','), null]]);
  for (let i = 0; i < queue.length && i < 6400; i++) {
    const [x, z] = queue[i];
    if (x === end[0] && z === end[1]) {
      const path = [];
      let key = end.join(',');
      while (key) {
        path.push(key.split(',').map((n) => +n + 0.5));
        key = prev.get(key);
      }
      return path.reverse().slice(1);
    }
    for (const [dx, dz] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const a = x + dx,
        b = z + dz,
        key = a + ',' + b;
      if (a < 1 || b < 1 || a > 78 || b > 78 || prev.has(key) || blocked(a, b))
        continue;
      // Ground is y=4, raised foundations y=5; roofs are never traversable shortcuts.
      const floor = get(a, 5, b) ? 6 : 5;
      if (!get(a, floor - 1, b) || get(a, floor, b) || get(a, floor + 1, b))
        continue;
      prev.set(key, x + ',' + z);
      queue.push([a, b]);
    }
  }
  return [];
}
const LIVING_LAMPS = [
  [30, 37],
  [34, 37],
  [38, 37],
  [42, 37],
  [46, 37],
];
function livingNightReady(reports, lights, gate) {
  const path = Array.from({ length: 13 }, (_, i) => [32 + i, 38]);
  const covered = path.every(([x, z]) =>
    lights.some(
      (v, i) =>
        v && Math.hypot(x - LIVING_LAMPS[i][0], z - LIVING_LAMPS[i][1]) <= 3.3,
    ),
  );
  // Two series switches, a third switch is a bypass that must remain open.
  return {
    shelter: reports[0].ok,
    covered,
    circuit: gate[0] && gate[1] && !gate[2],
    ok: reports[0].ok && covered && gate[0] && gate[1] && !gate[2],
  };
}
function livingTracePipes(c, rotations) {
  const steps = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ],
    seen = new Set(),
    path = [];
  let x = 0,
    z = 1,
    entry = 3;
  while (x >= 0 && z >= 0 && x < 3 && z < 3) {
    const i = x + 3 * z,
      edges = c.tiles[i].map((d) => (d + rotations[i]) % 4);
    if (seen.has(i) || !edges.includes(entry))
      return { ok: false, path, stop: i };
    seen.add(i);
    path.push(i);
    const exit = edges.find((d) => d !== entry),
      [dx, dz] = steps[exit];
    x += dx;
    z += dz;
    entry = (exit + 2) % 4;
  }
  return { ok: x === 3 && z === 1, path, stop: null };
}
