const BUILD_PATTERNS = {
  single: 'Une pièce',
  line: 'Ligne',
  floor: 'Rectangle au sol',
  wall: 'Mur',
  solid: 'Pavé plein',
  arch: 'Portique',
  pyramid: 'Pyramide à étages',
  tower: 'Tour circulaire',
  roof: 'Toit à deux pentes',
};
const BUILD_PROJECTS = [
  {
    name: 'Le tapis de mosaïque',
    pattern: 'floor',
    width: 4,
    depth: 3,
    height: 1,
    question:
      'Ton rectangle mesure 4 blocs sur 3. Combien de carrés recouvrent son sol ?',
    answer: 12,
    explain:
      '4 rangées de 3 carrés donnent 12 carrés. C’est l’aire du rectangle, exprimée ici en carrés de un bloc.',
    hint: 'Compte les carrés d’une rangée, puis les rangées.',
    material: 'mosaic',
  },
  {
    name: 'La porte symétrique',
    pattern: 'arch',
    width: 5,
    depth: 1,
    height: 4,
    question:
      'Une ouverture de 3 blocs sépare deux piliers de 1 bloc de large. Quelle est la largeur totale de ton portique ?',
    answer: 5,
    explain:
      '1 + 3 + 1 = 5 blocs. Les deux côtés se correspondent de part et d’autre de l’axe central : c’est une symétrie.',
    hint: 'Ajoute les deux piliers à la largeur de l’ouverture.',
    material: 'limestone',
  },
  {
    name: 'Le cube des volumes',
    pattern: 'solid',
    width: 3,
    depth: 3,
    height: 3,
    question:
      'Ton cube contient 3 couches. Chaque couche mesure 3 blocs sur 3. Combien de petits cubes contient-il ?',
    answer: 27,
    explain:
      'Une couche contient 3 × 3 = 9 cubes. Les trois couches contiennent 9 × 3 = 27 cubes. Les cubes cachés à l’intérieur comptent aussi.',
    hint: 'Compte une couche, puis additionne trois couches.',
    material: 'blueblock',
  },
  {
    name: 'La pyramide des nombres',
    pattern: 'pyramid',
    width: 5,
    depth: 5,
    height: 3,
    question:
      'Les trois étages de ta pyramide contiennent 25, 9 et 1 cubes. Combien as-tu posé de cubes en tout ?',
    answer: 35,
    explain:
      '25 + 9 + 1 = 35 cubes. Les côtés des étages mesurent 5, puis 3, puis 1 bloc : ils diminuent de 2 à chaque étage.',
    hint: 'Commence par 25 + 9, puis ajoute le sommet.',
    material: 'terracotta',
  },
  {
    name: 'Le toit du charpentier',
    pattern: 'roof',
    width: 5,
    depth: 4,
    height: 3,
    question:
      'Ton toit avance sur 4 rangées. Chaque rangée contient 5 pièces. Combien de pièces composent le toit ?',
    answer: 20,
    explain:
      '4 × 5 = 20 pièces. Les prismes triangulaires donnent les deux pentes. Vu de face, le toit dessine un triangle ; vu de dessus, un rectangle.',
    hint: 'Additionne 5 quatre fois.',
    material: 'slate',
  },
  {
    name: 'La tour du belvédère',
    pattern: 'tower',
    width: 5,
    depth: 5,
    height: 4,
    question:
      'La base de ta tour mesure 5 blocs de diamètre. Un autre cercle a un rayon de 3 blocs. Quel est son diamètre ?',
    answer: 6,
    explain:
      'Le rayon relie le centre au bord. Le diamètre traverse le centre et vaut deux rayons : 3 + 3 = 6. Dans le monde de blocs, le contour de la tour approche un cercle.',
    hint: 'Place deux rayons bout à bout.',
    material: 'lightwood',
  },
];
let builderSites = [],
  buildPreview = null,
  buildPreviewKey = '',
  buildUndo = [],
  buildOrigin = null;
const builderLandmarks = [
  {
    name: 'Parc des géomètres',
    candidates: [
      [1, 53, 21, 23],
      [56, 0, 21, 19],
    ],
  },
  {
    name: 'Atelier des bâtisseurs',
    candidates: [
      [26, 68, 19, 11],
      [56, 36, 21, 14],
    ],
  },
  {
    name: 'Carrière des couleurs',
    candidates: [
      [2, 38, 11, 12],
      [2, 2, 12, 12],
    ],
  },
  {
    name: 'Verger des verriers',
    candidates: [
      [57, 36, 21, 15],
      [2, 2, 20, 12],
    ],
  },
];

function builderCells(config, origin) {
  const w = config.width,
    d = config.depth,
    h = config.height,
    points = [];
  const shape =
    config.pattern === 'single' ||
    config.pattern === 'line' ||
    config.pattern === 'wall'
      ? config.shape
      : 'cube';
  const add = (x, y, z, kind = shape, turn = 0) =>
    points.push({
      x,
      y,
      z,
      id: buildID(config.material, kind, (config.rotation + turn) % 4),
    });
  if (config.pattern === 'single') add(0, 0, 0);
  if (config.pattern === 'line') for (let x = 0; x < w; x++) add(x, 0, 0);
  if (config.pattern === 'floor' || config.pattern === 'solid')
    for (let x = 0; x < w; x++)
      for (let z = 0; z < d; z++)
        for (let y = 0; y < (config.pattern === 'floor' ? 1 : h); y++)
          add(x, y, z);
  if (config.pattern === 'wall')
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) add(x, y, 0);
  if (config.pattern === 'arch') {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (x === 0 || x === w - 1 || y === h - 1) add(x, y, 0);
  }
  if (config.pattern === 'pyramid')
    for (let y = 0; y < Math.ceil(w / 2); y++)
      for (let x = y; x < w - y; x++)
        for (let z = y; z < w - y; z++) add(x, y, z);
  if (config.pattern === 'tower') {
    const r = w / 2,
      c = (w - 1) / 2;
    for (let x = 0; x < w; x++)
      for (let z = 0; z < w; z++) {
        const r2 = (x - c) ** 2 + (z - c) ** 2;
        if (r2 <= r * r && r2 >= Math.max(0, r - 1.1) ** 2)
          for (let y = 0; y < h; y++)
            if (!(x === Math.floor(c) && z === w - 1 && y < 2)) add(x, y, z);
      }
  }
  if (config.pattern === 'roof')
    for (let x = 0; x < w; x++)
      for (let z = 0; z < d; z++) {
        const y = Math.min(x, w - 1 - x);
        add(
          x,
          y,
          z,
          x === (w - 1) / 2 ? 'cube' : 'wedge',
          x < (w - 1) / 2 ? 3 : 1,
        );
      }
  const result = new Map();
  for (const p of points) {
    const copies =
      config.mirror && config.pattern === 'single'
        ? [p, { ...p, x: -p.x - 2 }]
        : [p];
    for (const copy of copies) {
      let { x, y, z } = copy;
      for (let i = 0; i < config.rotation; i++) [x, z] = [z, -x];
      const q = { ...copy, x: x + origin.x, y: y + origin.y, z: z + origin.z };
      result.set(q.x + ',' + q.y + ',' + q.z, q);
    }
  }
  return [...result.values()];
}
function builderAnchor() {
  if (S.builder.project >= 0 && !world.isEmber) {
    const p = buildPlot(S.builder.project);
    return p ? { x: p.x, y: 6, z: p.z } : null;
  }
  if (target && S.builder.pattern === 'single' && S.builder.shape === 'slab') {
    const piece = {
      x: target.x,
      y: target.y,
      z: target.z,
      id: buildID(S.builder.material, 'slab', S.builder.rotation),
    };
    if (canJoinHalves(piece)) return { x: target.x, y: target.y, z: target.z };
  }
  return target?.prev || null;
}
function canJoinHalves(p) {
  const old = BLOCKS[world.get(p.x, p.y, p.z)],
    next = BLOCKS[p.id];
  return (
    old?.shape === 'slab' &&
    next?.shape === 'slab' &&
    old.drop === next.drop &&
    old.rotation !== next.rotation
  );
}
function builderConflict(cells) {
  if (!cells.length || cells.length > 400)
    return 'Le motif doit contenir entre 1 et 400 pièces.';
  for (const p of cells) {
    if (!world.inBounds(p.x, p.y, p.z) || p.y < 1 || p.y > 25)
      return 'Ce motif dépasse les limites constructibles.';
    if (world.get(p.x, p.y, p.z) !== 0 && !canJoinHalves(p))
      return 'Des blocs occupent déjà cet emplacement. Décale le motif ou retire-les.';
    if (world.protected.has(world.index(p.x, p.y, p.z)))
      return 'Ce lieu doit rester libre.';
    if (
      world.isEmber
        ? emberReserved(p.x, p.y, p.z)
        : temple &&
          p.x >= temple.x &&
          p.x <= temple.x + 14 &&
          p.z >= temple.z &&
          p.z <= temple.z + 15 &&
          p.y >= 5 &&
          p.y <= 12
    )
      return 'Ce lieu est réservé à une épreuve.';
    if (intersectsPlayer(p.x, p.y, p.z))
      return 'Recule un peu : tu es dans le volume à construire.';
    if (
      interactive.some(
        (o) =>
          o.kind !== 'builderPlot' &&
          (o.type !== 'watcher' || o.group.visible) &&
          Math.hypot(o.pos.x - p.x - 0.5, o.pos.z - p.z - 0.5) < 0.85 &&
          Math.abs(o.pos.y - p.y) < 2,
      )
    )
      return 'Laisse de la place autour du personnage ou du mécanisme.';
  }
  if (!S.creative && (S.inv[S.builder.material] || 0) < cells.length)
    return (
      'Il faut ' +
      cells.length +
      ' pièces de ce matériau. Le sac contient ' +
      (S.inv[S.builder.material] || 0) +
      '.'
    );
  return '';
}
function clearBuildPreview() {
  if (buildPreview) {
    buildPreview.parent?.remove(buildPreview);
    buildPreview.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    buildPreview = null;
  }
  buildPreviewKey = '';
}
function updateBuildPreview() {
  if (!S.builder.active) {
    clearBuildPreview();
    return;
  }
  const origin = builderAnchor();
  if (!origin) {
    clearBuildPreview();
    return;
  }
  const cells = builderCells(S.builder, origin),
    problem = builderConflict(cells),
    key = JSON.stringify([S.builder, origin, problem, world.isEmber]);
  if (cells.every((p) => world.get(p.x, p.y, p.z) === p.id)) {
    clearBuildPreview();
    $('buildStatus').textContent = '✓ ' + cells.length + ' pièces posées';
    return;
  }
  if (key === buildPreviewKey) return;
  clearBuildPreview();
  buildPreviewKey = key;
  buildOrigin = origin;
  buildPreview = new THREE.Group();
  scene.add(buildPreview);
  const groups = new Map();
  for (const p of cells) {
    if (!groups.has(p.id)) groups.set(p.id, []);
    groups.get(p.id).push(p);
  }
  for (const [id, parts] of groups) {
    const info = BLOCKS[id];
    const geometry = info.shape
      ? shapeGeometry(info).clone()
      : new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
    const mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: problem ? 0xf17f72 : 0x70e7ca,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
      parts.length,
    );
    parts.forEach((p, i) =>
      mesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)),
    );
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    buildPreview.add(mesh);
  }
  $('buildStatus').textContent =
    (problem ? '✕ ' : '＋ ') +
    cells.length +
    ' pièce' +
    (cells.length > 1 ? 's' : '') +
    ' · ' +
    BUILD_PATTERNS[S.builder.pattern];
}
function placeBuild() {
  const anchor = builderAnchor();
  if (!anchor) {
    toast('Vise une surface proche pour placer l’aperçu.');
    return;
  }
  const cells = builderCells(S.builder, anchor),
    problem = builderConflict(cells);
  if (problem) {
    toast(problem);
    return;
  }
  const cost = S.creative ? 0 : cells.length;
  if (cost) S.inv[S.builder.material] -= cost;
  for (const p of cells) {
    p.before = world.get(p.x, p.y, p.z);
    p.after = canJoinHalves(p) ? BLOCKS[p.id].texture : p.id;
    world.set(p.x, p.y, p.z, p.after, true);
  }
  S.stats.placed += cells.length;
  buildUndo.push({ world, cells, cost, material: S.builder.material });
  if (buildUndo.length > 10) buildUndo.shift();
  saveGame(false);
  sfx('place');
  clearBuildPreview();
  updateHUD();
  toast(cells.length + ' pièces posées. Tu peux annuler avec ↶.');
}
function undoBuild() {
  const last = buildUndo.at(-1);
  if (!last || last.world !== world) {
    toast('Aucune pose à annuler dans ce monde pendant cette session.');
    return;
  }
  if (last.cells.some((p) => world.get(p.x, p.y, p.z) !== p.after)) {
    toast(
      'Cette construction a changé depuis sa pose. Retire ses pièces avec la pioche.',
    );
    return;
  }
  for (const p of last.cells) world.set(p.x, p.y, p.z, p.before, true);
  if (last.cost) give({ [last.material]: last.cost });
  S.stats.placed = Math.max(0, S.stats.placed - last.cells.length);
  buildUndo.pop();
  saveGame(false);
  clearBuildPreview();
  updateHUD();
  sfx('click');
}
function rotateBuild() {
  S.builder.rotation = (S.builder.rotation + 1) % 4;
  clearBuildPreview();
  saveGame(false);
  toast(
    S.builder.shape === 'slab' && S.builder.pattern === 'single'
      ? S.builder.rotation % 2
        ? 'Demi-bloc supérieur'
        : 'Demi-bloc inférieur'
      : 'Rotation : ' + S.builder.rotation * 90 + '°',
  );
}
function buildKit() {
  if (S.builder.supplied) return;
  give(Object.fromEntries(BUILD_MATERIALS.map((m) => [m.key, 64])));
  S.builder.supplied = true;
  saveGame(false);
}
function builderPanel() {
  buildKit();
  const s = S.builder,
    material = BUILD_MATERIALS.find((m) => m.key === s.material),
    shape = BUILD_SHAPES.find((v) => v.key === s.shape);
  const count = builderCells(s, { x: 0, y: 0, z: 0 }).length;
  modal(
    'L’atelier des bâtisseurs',
    'CONSTRUIRE · OBSERVER · COMPRENDRE',
    `<div class="build-tabs"><button class="primary" id="buildLibrary">Matériaux et formes</button><button class="secondary" id="buildMissions">Les 6 chantiers</button></div>
    <p>Un kit de départ de 64 pièces par matériau a été ajouté une seule fois à ton sac. ${S.creative ? 'Les matériaux sont illimités dans cette partie créative.' : 'Les poses utilisent les pièces de ton sac ; annuler les rend.'}</p>
    <h3>1 · Matériau</h3><div class="build-palette">${BUILD_MATERIALS.map((m) => `<button data-material="${m.key}" aria-pressed="${m.key === s.material}" title="${m.family}"><i style="background:${m.color}"></i><span>${m.name}</span><small>${S.creative ? '∞' : S.inv[m.key] || 0}</small></button>`).join('')}</div>
    <h3>2 · Forme d’une pièce</h3><div class="build-shapes">${BUILD_SHAPES.map((v) => `<button data-shape="${v.key}" aria-pressed="${v.key === s.shape}">${shapeSVG(v.key)}<span>${v.name}</span></button>`).join('')}</div><p class="banner" id="shapeLesson">${shape.lesson}</p>
    <h3>3 · Construire pièce par pièce ou assembler un motif</h3><label for="buildPattern">Motif</label><select id="buildPattern">${Object.entries(
      BUILD_PATTERNS,
    )
      .map(
        ([key, name]) =>
          `<option value="${key}" ${s.pattern === key ? 'selected' : ''}>${name}</option>`,
      )
      .join('')}</select>
    <div class="build-measures">${[
      ['width', 'Largeur'],
      ['depth', 'Profondeur'],
      ['height', 'Hauteur'],
    ]
      .map(
        ([key, name]) =>
          `<label>${name}<input id="build-${key}" type="number" min="1" max="7" value="${s[key]}"></label>`,
      )
      .join('')}</div>
    <p class="muted">Les dimensions grisées sont calculées par le motif. La largeur détermine le côté de la pyramide, le diamètre de la tour et la hauteur des deux pentes du toit. Les motifs utilisent des cubes, sauf le toit qui combine cubes et prismes. « Une pièce », « Ligne » et « Mur » utilisent la forme choisie. Maximum 400 pièces par pose.</p>
    <label class="ember-option"><input id="buildMirror" type="checkbox" ${s.mirror ? 'checked' : ''}> En pose d’une pièce, ajouter sa jumelle à deux cases : une case centrale reste libre.</label>
    <div class="banner"><b id="buildCount">${count} pièces · ${material.name}</b><p>L’aperçu vert indique une place libre ; le rouge signale un obstacle ou un manque de matériaux. Tourne avec ↻ ou R, pose avec ＋ ou B, annule avec ↶.</p></div>
    <div class="row"><button class="primary" id="buildStart">Construire dans le monde</button><button class="secondary" id="buildFree">Viser librement</button><button class="secondary" id="buildStop">Ranger les outils</button></div>`,
  );
  $('buildLibrary').onclick = builderPanel;
  $('buildMissions').onclick = builderJournal;
  document.querySelectorAll('[data-material]').forEach(
    (b) =>
      (b.onclick = () => {
        s.material = b.dataset.material;
        builderPanel();
      }),
  );
  document.querySelectorAll('[data-shape]').forEach(
    (b) =>
      (b.onclick = () => {
        s.shape = b.dataset.shape;
        s.pattern = 'single';
        builderPanel();
      }),
  );
  const change = () => {
    let valid = true;
    s.pattern = $('buildPattern').value;
    const adjustable = {
      single: [],
      line: ['width'],
      floor: ['width', 'depth'],
      wall: ['width', 'height'],
      solid: ['width', 'depth', 'height'],
      arch: ['width', 'height'],
      pyramid: ['width'],
      tower: ['width', 'height'],
      roof: ['width', 'depth'],
    }[s.pattern];
    for (const key of ['width', 'depth', 'height']) {
      $('build-' + key).disabled = !adjustable.includes(key);
      if (!adjustable.includes(key)) continue;
      const value = Number($('build-' + key).value);
      if (Number.isInteger(value) && value >= 1 && value <= 7) s[key] = value;
      else valid = false;
    }
    if (s.pattern === 'single') s.width = s.depth = s.height = 1;
    if (s.pattern === 'line') s.depth = s.height = 1;
    if (s.pattern === 'floor') s.height = 1;
    if (['wall', 'arch'].includes(s.pattern)) s.depth = 1;
    if (['tower', 'pyramid'].includes(s.pattern)) s.depth = s.width;
    if (['pyramid', 'roof'].includes(s.pattern))
      s.height = Math.ceil(s.width / 2);
    for (const key of ['width', 'depth', 'height'])
      if (!adjustable.includes(key)) $('build-' + key).value = s[key];
    s.mirror = $('buildMirror').checked;
    $('buildCount').textContent = !valid
      ? 'Choisis des dimensions entières entre 1 et 7.'
      : builderCells(s, { x: 0, y: 0, z: 0 }).length +
        ' pièces · ' +
        BUILD_MATERIALS.find((m) => m.key === s.material).name;
    saveGame(false);
    return valid;
  };
  $('buildPattern').onchange = change;
  $('buildMirror').onchange = change;
  for (const key of ['width', 'depth', 'height'])
    $('build-' + key).oninput = change;
  change();
  $('buildStart').onclick = () => {
    if (!change()) return;
    s.active = true;
    closeModal();
    updateHUD();
    toast(
      s.project >= 0
        ? 'Le motif est ancré au chantier. Pose avec ＋, puis vérifie depuis le journal.'
        : 'Vise le sol, vérifie l’aperçu, puis pose avec ＋.',
    );
  };
  $('buildFree').onclick = () => {
    if (!change()) return;
    s.project = -1;
    s.active = true;
    closeModal();
    updateHUD();
  };
  $('buildStop').onclick = () => {
    s.active = false;
    s.project = -1;
    clearBuildPreview();
    closeModal();
    updateHUD();
  };
}
function shapeSVG(shape) {
  const shapes = {
    cube: '<path d="M9 16 30 5 51 16 51 40 30 52 9 40Z M9 16 30 28 51 16 M30 28V52"/>',
    slab: '<path d="M8 29 32 16 53 27 53 39 29 52 8 41Z M8 29 29 40 53 27 M29 40V52"/>',
    stairs: '<path d="M9 44V31H22V18H37V7H50V44Z"/>',
    wedge:
      '<path d="M9 44 9 12 38 44Z M9 12 22 5 52 35 38 44 M52 35 52 44 38 51 9 51 9 44"/>',
    cylinder:
      '<ellipse cx="30" cy="13" rx="20" ry="8"/><path d="M10 13V43C10 54 50 54 50 43V13 M10 43C10 32 50 32 50 43"/>',
    sphere:
      '<circle cx="30" cy="30" r="23"/><ellipse cx="30" cy="30" rx="10" ry="23"/><ellipse cx="30" cy="30" rx="23" ry="9"/>',
    pyramid: '<path d="M30 5 7 42 30 54 53 42Z M30 5V54 M7 42 30 31 53 42"/>',
  };
  return (
    '<svg viewBox="0 0 60 60" aria-hidden="true" fill="#b9d5ca" stroke="#355f5a" stroke-width="2" stroke-linejoin="round">' +
    shapes[shape] +
    '</svg>'
  );
}
function buildPlot(i) {
  const site = builderSites[0];
  return site
    ? { x: site.x + 1 + (i % 3) * 7, z: site.z + 2 + Math.floor(i / 3) * 9 }
    : null;
}
function builderJournal() {
  modal(
    'Le parc des géomètres',
    'SIX CONSTRUCTIONS À INVENTER',
    '<p>Lis les dimensions, choisis un matériau, règle le motif et construis sur le chantier. La vérification observe les pièces réellement présentes. Tes bâtiments restent dans le monde.</p>' +
      (!builderSites[0]
        ? '<p class="banner">Les emplacements du parc sont déjà occupés par tes constructions. Elles ont été conservées. L’atelier libre reste disponible dans cette partie ; les chantiers sont accessibles dans un autre profil.</p>'
        : '') +
      '<div class="two-col">' +
      BUILD_PROJECTS.map(
        (p, i) =>
          `<article class="quest-card"><h3>${i + 1} · ${p.name} ${S.builder.completed.includes(i) ? '✓' : ''}</h3><p>${BUILD_PATTERNS[p.pattern]} · ${p.width} de large × ${p.depth} de profondeur × ${p.height} de haut.</p><div class="row"><button class="secondary" data-project="${i}" ${builderSites[0] ? '' : 'disabled'}>Rejoindre le chantier</button>${S.builder.project === i ? '<button class="primary" id="verifyBuilding">Vérifier ma construction</button>' : ''}</div></article>`,
      ).join('') +
      '</div><div class="row"><button class="primary" id="backBuilder">Ouvrir l’atelier libre</button><button class="secondary" id="builderMap">Carte des nouveaux lieux</button><button class="secondary" id="builderQuests">Quêtes du village</button></div>',
  );
  document
    .querySelectorAll('[data-project]')
    .forEach((b) => (b.onclick = () => visitBuildProject(+b.dataset.project)));
  if ($('verifyBuilding')) $('verifyBuilding').onclick = checkBuildProject;
  $('backBuilder').onclick = builderPanel;
  $('builderMap').onclick = showMap;
  $('builderQuests').onclick = () => {
    S.builder.project = -1;
    S.builder.active = false;
    clearBuildPreview();
    updateHUD();
    quests();
  };
}
function visitBuildProject(i) {
  if (ember) leaveEmber();
  const p = buildPlot(i);
  if (!p) return;
  S.builder.project = i;
  S.builder.active = false;
  S.builder.rotation = 0;
  S.builder.mirror = false;
  // Leave the dimensions for the child to choose; supply only the recommended material.
  S.builder.material = BUILD_PROJECTS[i].material;
  player.pos.set(p.x + 2.5, 6, p.z + 6.6);
  player.velY = 0;
  player.yaw = 0;
  player.pitch = -0.15;
  streamTerrain(true);
  closeModal();
  updateHUD();
  modal(
    BUILD_PROJECTS[i].name,
    'LE PLAN DU CHANTIER',
    `<p>Construis un <b>${BUILD_PATTERNS[BUILD_PROJECTS[i].pattern].toLowerCase()}</b> de <b>${BUILD_PROJECTS[i].width} blocs de large, ${BUILD_PROJECTS[i].depth} de profondeur et ${BUILD_PROJECTS[i].height} de haut</b>.</p><p>Choisis le motif et règle ses dimensions dans l’atelier. L’aperçu sera placé sur ce chantier. Tu peux aussi poser les pièces une par une en choisissant « Viser librement ».</p><div class="row"><button class="primary" id="projectTools">Choisir les formes et dimensions</button><button class="secondary" id="projectCheck">Vérifier les blocs déjà posés</button></div>`,
  );
  $('projectTools').onclick = builderPanel;
  $('projectCheck').onclick = () => {
    S.builder.project = i;
    checkBuildProject();
  };
  saveGame(false);
}
function inspectBuildProject(i) {
  const plot = buildPlot(i),
    p = BUILD_PROJECTS[i];
  if (!plot) return { missing: 1, extra: 0 };
  const expected = builderCells(
      { ...p, shape: 'cube', rotation: 0, mirror: false },
      { x: plot.x, y: 6, z: plot.z },
    ),
    map = new Map(expected.map((v) => [v.x + ',' + v.y + ',' + v.z, v]));
  let missing = 0,
    extra = 0;
  for (const q of expected) {
    const actual = BLOCKS[world.get(q.x, q.y, q.z)],
      want = BLOCKS[q.id];
    if (
      !actual ||
      actual.protected ||
      (actual.shape || 'cube') !== (want.shape || 'cube') ||
      (actual.rotation || 0) !== (want.rotation || 0)
    )
      missing++;
  }
  for (let x = plot.x; x < plot.x + 6; x++)
    for (let z = plot.z; z < plot.z + 6; z++)
      for (let y = 6; y < 14; y++)
        if (world.get(x, y, z) && !map.has(x + ',' + y + ',' + z)) extra++;
  return { missing, extra, count: expected.length };
}
function checkBuildProject() {
  const i = S.builder.project;
  if (i < 0 || world.isEmber) return;
  const p = BUILD_PROJECTS[i],
    check = inspectBuildProject(i);
  if (check.missing || check.extra) {
    modal(
      'Observe ton chantier',
      'LA CONSTRUCTION N’EST PAS ENCORE CONFORME',
      `<p>${check.missing} emplacement(s) manquent ou ont une forme différente. ${check.extra} pièce(s) dépassent le modèle demandé.</p><p>Le plan demande ${p.width} × ${p.depth} × ${p.height} blocs. Vérifie la largeur, la profondeur, la hauteur et l’orientation. Annule la dernière pose avec ↶ si tu veux la reprendre.</p><button class="primary" id="repairBuild">Retour aux outils</button>`,
    );
    $('repairBuild').onclick = builderPanel;
    return;
  }
  if (S.builder.completed.includes(i)) {
    toast('Ce chantier est déjà réussi. Ton bâtiment reste à visiter.');
    closeModal();
    return;
  }
  S.builder.active = false;
  clearBuildPreview();
  showChallenge(
    {
      type: 'number',
      title: p.name,
      story: p.question,
      answer: p.answer,
      hint: p.hint,
      explain: p.explain,
      practiceId: 'build:' + i,
      onSolved: () => {
        if (!S.builder.completed.includes(i)) {
          S.builder.completed.push(i);
          S.journal.push('build:' + i);
          S.xp += 35;
          give({ emerald: 3, [p.material]: 24 });
          saveGame(false);
        }
      },
    },
    () => {
      closeModal();
      toast('Chantier réussi ! +35 expérience, 3 émeraudes et 24 matériaux.');
    },
    'LA GÉOMÉTRIE DE TA CONSTRUCTION',
  );
}
function builderHUD() {
  $('buildTools').hidden = !S.builder.active;
  document.body.classList.toggle('building', S.builder.active);
  if (!S.builder.active) clearBuildPreview();
  if (!world.isEmber) {
    const site = builderSites.find(
      (s) =>
        s &&
        player.pos.x >= s.x &&
        player.pos.x < s.x + s.w &&
        player.pos.z >= s.z &&
        player.pos.z < s.z + s.d,
    );
    if (site) $('biome').textContent = site.name.toLocaleUpperCase('fr');
  }
  if (!world.isEmber && S.builder.project >= 0) {
    const p = BUILD_PROJECTS[S.builder.project],
      plot = buildPlot(S.builder.project);
    if (plot) {
      $('trackedName').textContent = p.name;
      $('trackedText').textContent =
        BUILD_PATTERNS[p.pattern] +
        ' · ' +
        p.width +
        ' × ' +
        p.depth +
        ' × ' +
        p.height;
      $('waypointText').textContent = '◈ Chantiers : vérifier ma construction';
    }
  }
}

function enrichBuildersWorld() {
  const chosen = [],
    edits = Object.keys(S.edits).map(Number);
  const overlaps = (a, b) =>
    a[0] < b[0] + b[2] + 1 &&
    a[0] + a[2] + 1 > b[0] &&
    a[1] < b[1] + b[3] + 1 &&
    a[1] + a[3] + 1 > b[1];
  if (S.builder.sites === null)
    S.builder.sites = builderLandmarks.map((def) => {
      const index = def.candidates.findIndex(
        (area) =>
          !chosen.some((other) => overlaps(area, other)) &&
          !(temple && overlaps(area, [temple.x, temple.z, 15, 18])) &&
          !edits.some((n) => {
            const x = n % 80,
              z = Math.floor(n / 80) % 80;
            return (
              x >= area[0] - 2 &&
              x <= area[0] + area[2] + 2 &&
              z >= area[1] - 2 &&
              z <= area[1] + area[3] + 2
            );
          }),
      );
      if (index >= 0) chosen.push(def.candidates[index]);
      return index;
    });
  builderSites = builderLandmarks.map((def, i) => {
    const area = def.candidates[S.builder.sites[i]];
    return area
      ? { name: def.name, x: area[0], z: area[1], w: area[2], d: area[3] }
      : null;
  });
  const set = (x, y, z, id, protect = false) => {
    world.set(x, y, z, id);
    if (protect) world.protected.add(world.index(x, y, z));
  };
  for (const site of builderSites) {
    if (!site) continue;
    world.trees = world.trees.filter((t) => {
      if (
        t.x < site.x ||
        t.x >= site.x + site.w ||
        t.z < site.z ||
        t.z >= site.z + site.d
      )
        return true;
      for (const n of t.crown)
        if (!Object.hasOwn(S.edits, n)) world.data[n] = 0;
      return false;
    });
    for (let x = site.x; x < site.x + site.w; x++)
      for (let z = site.z; z < site.z + site.d; z++) {
        world.heights[x + z * 80] = 5;
        for (let y = 1; y < 26; y++)
          set(x, y, z, y < 5 ? 3 : y === 5 ? 1 : 0, y === 5);
      }
  }
  const park = builderSites[0];
  if (park) {
    for (let i = 0; i < 6; i++) {
      const p = buildPlot(i);
      for (let x = 0; x < 6; x++)
        for (let z = 0; z < 6; z++)
          set(p.x + x, 5, p.z + z, (x + z) % 2 ? 30 : 37, true);
      const g = new THREE.Group();
      g.position.set(p.x + 5.5, 6, p.z + 6.3);
      scene.add(g);
      meshBox(g, 0, 0.6, 0, 0.12, 1.2, 0.12, 0x856744);
      meshBox(g, 0, 1.15, 0, 0.9, 0.5, 0.12, 0xc4a769);
      interactive.push({
        kind: 'builderPlot',
        id: i,
        label: 'Lire le chantier ' + (i + 1),
        name: i + 1 + ' · ' + BUILD_PROJECTS[i].name,
        nameHeight: 1.9,
        pos: g.position,
        group: g,
      });
    }
    for (let x = park.x; x < park.x + park.w; x++)
      for (const z of [park.z, park.z + park.d - 1]) set(x, 5, z, 20, true);
    const npc = humanoid({
      id: 'mina',
      name: 'Mina · Architecte',
      x: park.x + 10,
      z: park.z,
      coat: 0x478d89,
      hat: 0xe6bb61,
    });
    npc.kind = 'builder';
    npc.label = 'Les chantiers de Mina';
    npc.action = builderJournal;
  }
  const workshop = builderSites[1];
  if (workshop) {
    const { x, z } = workshop;
    for (let a = 1; a < workshop.w - 1; a++)
      for (let b = 1; b < workshop.d - 1; b++) set(x + a, 5, z + b, 20, true);
    // A real walk-in workshop with contrasting timber, a triangular roof and skylight.
    const ox = x + 10,
      oz = z + 2;
    for (let a = 0; a < 7; a++)
      for (let b = 0; b < 7; b++) {
        set(ox + a, 5, oz + b, 30, true);
        for (let y = 6; y < 10; y++)
          if (a === 0 || a === 6 || b === 0 || b === 6) {
            if (b === 6 && a >= 2 && a <= 4 && y < 9) continue;
            set(
              ox + a,
              y,
              oz + b,
              y === 8 && (a === 0 || a === 6)
                ? 16
                : a % 6 === 0 && b % 6 === 0
                  ? 28
                  : 27,
            );
          }
      }
    for (const p of builderCells(
      {
        pattern: 'roof',
        width: 7,
        depth: 7,
        height: 4,
        material: 'slate',
        shape: 'cube',
        rotation: 0,
        mirror: false,
      },
      { x: ox, y: 10, z: oz },
    ))
      set(p.x, p.y, p.z, p.id);
    set(ox + 1, 6, oz + 1, 12);
    set(ox + 5, 6, oz + 1, 13);
    for (let i = 0; i < 7; i++) {
      set(x + 2 + i, 5, z + 3, 30, true);
      set(
        x + 2 + i,
        6,
        z + 3,
        buildID(BUILD_MATERIALS[i + 8].key, BUILD_SHAPES[i].key),
      );
    }
    const npc = humanoid({
      id: 'elio',
      name: 'Élio · Charpentier',
      x: x + 5,
      z: z + 7,
      coat: 0xb66b46,
      hat: 0x453c43,
    });
    npc.kind = 'builder';
    npc.label = 'Ouvrir l’atelier d’Élio';
    npc.action = builderPanel;
  }
  const quarry = builderSites[2];
  if (quarry) {
    const { x, z } = quarry;
    for (let a = 1; a < quarry.w - 1; a++)
      for (let b = 1; b < quarry.d - 1; b++) {
        const h = 1 + Math.floor((a - 1) / 3);
        for (let y = 6; y < 6 + h; y++) set(x + a, y, z + b, b % 3 ? 29 : 30);
      }
    for (let b = 1; b < quarry.d - 1; b++) set(x, 5, z + b, 20, true);
    const npc = humanoid({
      id: 'tess',
      name: 'Tess',
      x: x + 1,
      z: z + quarry.d - 1,
      coat: 0x7189a5,
      hat: 0xd6b56e,
    });
    npc.kind = 'builder';
    npc.label = 'Découvrir la carrière';
    npc.action = () => {
      modal(
        'Des roches pour bâtir',
        'LA CARRIÈRE DE TESS',
        '<p>Les bancs bleu-gris donnent de l’ardoise, les blocs clairs du calcaire. Récolte-les avec la pioche pour tes toits, colonnes et façades.</p><p>Un même matériau peut prendre plusieurs formes. Dans l’atelier, compare le cube, le prisme et le cylindre.</p><button class="primary" id="quarryTools">Choisir une forme</button>',
      );
      $('quarryTools').onclick = builderPanel;
    };
  }
  const orchard = builderSites[3];
  if (orchard) {
    const { x, z } = orchard;
    for (let b = 0; b < orchard.d; b++)
      for (let a = 9; a <= 11; a++) set(x + a, 5, z + b, 20, true);
    for (const a of [3, 16])
      for (const b of [3, 9]) {
        if (b >= orchard.d - 2) continue;
        world.tree(x + a, 6, z + b, false);
        for (const dx of [-1, 1]) set(x + a + dx, 8, z + b + 1, 35);
      }
    for (const a of [6, 14]) {
      for (let b = 5; b <= 7; b++)
        set(x + a, 6, z + b, buildID('lightwood', 'slab'));
      set(x + a, 7, z + 5, buildID('lightwood', 'slab', 1));
    }
    for (let a = 8; a <= 12; a++) {
      set(x + a, 6, z + orchard.d - 2, buildID('limestone', 'slab'));
      if (a === 8 || a === 12)
        set(x + a, 7, z + orchard.d - 2, buildID('greenblock', 'sphere'));
    }
    const npc = humanoid({
      id: 'noe',
      name: 'Noé · Jardinier',
      x: x + 10,
      z: z + 2,
      coat: 0x7a9d57,
      hat: 0xdfb96a,
    });
    npc.kind = 'builder';
    npc.label = 'Observer le jardin symétrique';
    npc.action = () => {
      modal(
        'Un jardin qui se répond',
        'LE VERGER DES VERRIERS',
        '<p>Regarde les arbres des deux côtés du chemin. Imagine que le chemin est un miroir : un arbre à gauche a un correspondant à droite.</p><p>Tu peux reproduire cette idée avec la pose jumelle de l’atelier. Les bancs utilisent des demi-blocs, les ornements des sphères.</p><button class="primary" id="orchardTools">Construire avec la symétrie</button>',
      );
      $('orchardTools').onclick = builderPanel;
    };
  }
  // Site choice is persistent. Reapply the player's later work after regenerating the landmarks.
  for (const [key, id] of Object.entries(S.edits)) {
    const n = +key;
    if (validBuildVoxel(id) && !world.protected.has(n) && n >= 6400)
      world.data[n] = id;
  }
  if (Object.keys(S.edits).length) world.settleTrees();
}
function drawBuilderMap(g, w, h, large) {
  if (world.isEmber) return;
  for (const site of builderSites) {
    if (!site) continue;
    const x = ((site.x + site.w / 2) * w) / 80,
      z = ((site.z + site.d / 2) * h) / 80;
    g.fillStyle = '#e0aa49';
    g.fillRect(x - 3, z - 3, 6, 6);
    if (large) {
      g.font = 'bold 12px system-ui';
      g.textAlign = 'center';
      g.fillStyle = '#283b36';
      const half = g.measureText(site.name).width / 2;
      g.fillText(
        site.name,
        Math.max(half + 4, Math.min(w - half - 4, x)),
        z + 15,
      );
    }
  }
}
function visitBuilderLandmark(i) {
  if (ember) leaveEmber();
  const site = builderSites[i];
  if (!site) return;
  const actor = interactive.find(
    (o) =>
      o.kind === 'builder' &&
      o.pos.x >= site.x &&
      o.pos.x < site.x + site.w &&
      o.pos.z >= site.z &&
      o.pos.z < site.z + site.d,
  );
  if (!actor) return;
  for (const [dx, dz] of [
    [0, 2.4],
    [2.4, 0],
    [0, -2.4],
    [-2.4, 0],
  ]) {
    const x = actor.pos.x + dx,
      z = actor.pos.z + dz,
      y = actor.pos.y;
    if (
      collision(x, y, z) ||
      !world.solid(Math.floor(x), Math.floor(y) - 1, Math.floor(z))
    )
      continue;
    S.builder.active = false;
    S.builder.project = -1;
    clearBuildPreview();
    player.pos.set(x, y, z);
    player.velY = 0;
    player.yaw = Math.atan2(dx, dz);
    player.pitch = -0.08;
    closeModal();
    streamTerrain(true);
    updateHUD();
    saveGame(false);
    toast('Approche de ' + actor.name + ' et utilise la main.');
    return;
  }
  toast(
    'Les abords sont occupés par des constructions. Rejoins ce lieu à pied.',
  );
}
