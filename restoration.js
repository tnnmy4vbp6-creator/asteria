// A continuous village story. Answers are physical assemblies; no answer form is used.
const RESTORATION_CHAPTERS = [
  {
    title: 'Le passage des provisions',
    speaker: 'Mina',
    verb: 'Faire passer le chariot',
    story:
      'La crue a emporté le passage. Le chariot de graines de Lila attend sur cette rive. Il reste quatre blocs et quatre demi-blocs : reconstruis un tablier plat, sans trou.',
    lesson:
      'Deux demi-blocs superposés ont la même hauteur qu’un bloc. Quatre blocs et quatre moitiés couvrent six emplacements.',
    hints: [
      'Regarde où les roues s’arrêtent : les deux bandes du passage doivent être à la même hauteur.',
      'Une moitié ne suffit pas à rejoindre le bord. Retourne une autre moitié et superpose-les.',
    ],
    choices: [
      ['cube', 'Bloc entier'],
      ['slab', 'Demi-bloc'],
    ],
  },
  {
    title: 'Un toit pour les graines',
    speaker: 'Éloi',
    verb: 'Essayer avec l’eau',
    story:
      'Les graines sont arrivées, mais quatre morceaux du toit manquent. Pose les prismes pour prolonger les deux pentes. L’eau doit descendre vers les gouttières, de chaque côté.',
    lesson:
      'Un prisme triangulaire donne une pente. Les deux versants se répondent : leurs bords hauts se rejoignent au milieu, leurs bords bas conduisent l’eau dehors.',
    hints: [
      'Regarde les pans de toit déjà en place. Les pièces manquantes doivent prolonger ces surfaces.',
      'Tourne les prismes : bord haut vers la ligne centrale, bord bas vers la gouttière.',
    ],
    choices: [
      ['wedge', 'Prisme'],
      ['cube', 'Cube'],
    ],
  },
  {
    title: 'Le signal des deux rives',
    speaker: 'Aïna',
    verb: 'Envoyer le signal',
    story:
      'Lila attend le signal pour venir chercher les graines. Les trois pierres de droite ont disparu. Observe celles de gauche et reconstitue leur reflet de l’autre côté de la ligne dorée.',
    lesson:
      'Dans une symétrie, chaque objet possède un correspondant de l’autre côté de l’axe, à la même distance. La sphère, la pyramide et le cylindre gardent leur forme.',
    hints: [
      'Imagine la ligne dorée comme un miroir. Quelle pierre doit faire face à celle que tu observes ?',
      'Cherche les correspondances deux par deux : même forme, même distance à la ligne.',
    ],
    choices: [
      ['sphere', 'Sphère'],
      ['pyramid', 'Pyramide'],
      ['cylinder', 'Cylindre'],
      ['cube', 'Cube'],
    ],
  },
];
let restoration = null,
  restorationMode = null,
  restorationProps = [];
function restorationStock(pieces) {
  return {
    cube: 4 - pieces.reduce((n, c) => n + (c === 1), 0),
    slab:
      4 -
      pieces.reduce(
        (n, c) => n + (c === 4 ? 2 : c === 2 || c === 3 ? 1 : 0),
        0,
      ),
  };
}
function restorationSolved(index, pieces) {
  return index === 0
    ? pieces.every((c) => c === 1 || c === 4)
    : index === 1
      ? pieces.every((c, i) => c === (i % 2 === 0 ? 4 : 2))
      : pieces.every((c, i) => c === [1, 3, 2][i]);
}
function validRestoration(s) {
  return (
    s &&
    (s.site === null ||
      (Number.isInteger(s.site) && s.site >= -1 && s.site <= 1)) &&
    typeof s.started === 'boolean' &&
    typeof s.reward === 'boolean' &&
    Number.isInteger(s.stage) &&
    s.stage >= 0 &&
    s.stage <= 3 &&
    Array.isArray(s.pieces) &&
    s.pieces.length === 3 &&
    s.pieces.every(
      (p, i) =>
        Array.isArray(p) &&
        p.length === [6, 4, 3][i] &&
        p.every((c) => Number.isInteger(c) && c >= 0 && c <= [4, 5, 4][i]),
    ) &&
    ['tries', 'hints'].every(
      (k) =>
        Array.isArray(s[k]) &&
        s[k].length === 3 &&
        s[k].every((n) => Number.isInteger(n) && n >= 0 && n < 100000),
    ) &&
    Object.values(restorationStock(s.pieces[0])).every((n) => n >= 0) &&
    Array.from({ length: s.stage }, (_, i) => i).every((i) =>
      restorationSolved(i, s.pieces[i]),
    ) &&
    (!s.reward || s.stage === 3)
  );
}
function restorationID(index, code) {
  if (!code) return 0;
  if (index === 0)
    return code === 1 || code === 4
      ? 7
      : buildID('plank', 'slab', code === 3 ? 1 : 0);
  if (index === 1) return code === 5 ? 29 : buildID('slate', 'wedge', code - 1);
  return buildID(
    'blueblock',
    ['sphere', 'cylinder', 'pyramid', 'cube'][code - 1],
  );
}
function restorationSlots(index) {
  if (!restoration) return [];
  const { x, z } = restoration;
  if (index === 0)
    return Array.from({ length: 6 }, (_, i) => ({
      x: x + 8 + (i % 3),
      y: 5,
      z: z + 15 + Math.floor(i / 3),
    }));
  if (index === 1)
    return Array.from({ length: 4 }, (_, i) => ({
      x: x + 13 + (i % 2) * 4,
      y: 10,
      z: z + 14 + Math.floor(i / 2),
    }));
  return Array.from({ length: 3 }, (_, i) => ({
    x: x + 6,
    y: 7,
    z: z + 3 + i * 2,
  }));
}
function restorationReserved(x, y, z) {
  return (
    !world.isEmber &&
    restoration &&
    x >= restoration.x &&
    x < restoration.x + 21 &&
    z >= restoration.z &&
    z < restoration.z + 19 &&
    y >= 5 &&
    y <= 12
  );
}
function buildRestoration() {
  const s = S.restoration,
    park = builderSites[0];
  const candidates = [park ? [park.x, park.z] : null, [56, 0]];
  if (s.site === null) {
    s.site = candidates.findIndex(
      (c, i) =>
        c &&
        !(
          temple &&
          c[0] < temple.x + 15 &&
          c[0] + 21 > temple.x &&
          c[1] < temple.z + 18 &&
          c[1] + 19 > temple.z
        ) &&
        !builderSites.some(
          (b, k) =>
            b &&
            !(i === 0 && k === 0) &&
            c[0] < b.x + b.w &&
            c[0] + 21 > b.x &&
            c[1] < b.z + b.d &&
            c[1] + 19 > b.z,
        ) &&
        !Object.keys(S.edits).some((n) => {
          const x = +n % 80,
            z = Math.floor(+n / 80) % 80;
          return (
            x >= c[0] - 1 && x <= c[0] + 21 && z >= c[1] - 1 && z <= c[1] + 20
          );
        }),
    );
  }
  if (s.site < 0 || !candidates[s.site]) return;
  const [x, z] = candidates[s.site];
  restoration = {
    x,
    z,
    group: new THREE.Group(),
    cart: new THREE.Group(),
    signal: new THREE.Group(),
    rain: new THREE.Group(),
    markers: [],
    loaded: 0,
  };
  scene.add(restoration.group);
  // Never replace a previously edited plot. Older buildings remain in their original site.
  if (s.site === 0) {
    for (const o of interactive.filter(
      (o) =>
        o.kind === 'builderPlot' ||
        (o.kind === 'builder' && o.name?.startsWith('Mina')),
    ))
      o.group.removeFromParent();
    interactive = interactive.filter(
      (o) =>
        o.kind !== 'builderPlot' &&
        !(o.kind === 'builder' && o.name?.startsWith('Mina')),
    );
    characters = characters.filter((o) => !o.name?.startsWith('Mina'));
    builderSites[0].name = 'Hameau des deux rives';
  }
  const set = (a, y, b, id) => {
    world.set(x + a, y, z + b, id);
    world.protected.add(world.index(x + a, y, z + b));
  };
  world.trees = world.trees.filter(
    (t) => t.x < x || t.x >= x + 21 || t.z < z || t.z >= z + 19,
  );
  for (let a = 0; a < 21; a++)
    for (let b = 0; b < 19; b++) {
      for (let y = 1; y < 16; y++) set(a, y, b, y < 5 ? 3 : y === 5 ? 1 : 0);
      world.heights[x + a + (z + b) * 80] = 5;
      if (a >= 8 && a <= 10) {
        for (let y = 2; y <= 5; y++) set(a, y, b, 0);
        world.heights[x + a + (z + b) * 80] = 1;
      }
    }
  // A real watercourse, accessible banks and a grain store built from ordinary voxels.
  const stream = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 19),
    new THREE.MeshStandardMaterial({
      color: 0x4f9ba3,
      transparent: true,
      opacity: 0.8,
      roughness: 0.3,
    }),
  );
  stream.rotation.x = -Math.PI / 2;
  stream.position.set(x + 9.5, 3.6, z + 9.5);
  restoration.group.add(stream);
  for (let a = 1; a < 20; a++)
    for (const b of [15, 16]) if (a < 8 || a > 10) set(a, 5, b, 20);
  for (let a = 12; a <= 18; a++)
    for (let b = 11; b <= 17; b++) {
      set(a, 5, b, 30);
      for (let y = 6; y <= 8; y++)
        if (
          (a === 12 || a === 18 || b === 11 || b === 17) &&
          !(b === 17 && a >= 14 && a <= 16)
        )
          set(
            a,
            y,
            b,
            (a === 12 || a === 18) && y === 7 && b >= 13 && b <= 15 ? 16 : 27,
          );
    }
  for (let a = 12; a <= 18; a++)
    for (let b = 10; b <= 17; b++) {
      const y = 9 + Math.min(a - 12, 18 - a);
      set(a, y, b, a === 15 ? 29 : buildID('slate', 'wedge', a < 15 ? 3 : 1));
    }
  // Existing roof planes remain the visual reference on both sides.
  for (const a of [11, 19])
    for (let b = 10; b <= 17; b++)
      set(a, 8, b, buildID('copperblock', 'slab', 1));
  for (let a = 2; a <= 7; a++) for (let b = 1; b <= 9; b++) set(a, 5, b, 30);
  for (const a of [2, 6]) for (const b of [3, 5, 7]) set(a, 6, b, 8);
  for (let b = 1; b <= 9; b++) set(4, 5, b, 36);
  for (let i = 0; i < 3; i++)
    set(2, 7, 3 + i * 2, restorationID(2, [1, 3, 2][i]));
  for (let i = 0; i < 3; i++)
    restorationSlots(i).forEach((p, j) => {
      world.set(p.x, p.y, p.z, restorationID(i, s.pieces[i][j]));
      world.protected.add(world.index(p.x, p.y, p.z));
    });
  for (const [name, a, b, color] of [
    ['Mina', 5, 17, 0x457f91],
    ['Éloi', 17, 18, 0xb67a4e],
    ['Aïna', 4, 10, 0x6977ac],
  ]) {
    const npc = humanoid({
      id: 'rest-' + name,
      name,
      x: x + a,
      z: z + b,
      coat: color,
      hat: 0xd4bd85,
    });
    npc.kind = 'restoration';
    npc.label = 'Parler à ' + name;
    npc.action = () => restorationIntro();
  }
  const cart = restoration.cart;
  cart.position.set(x + (s.stage > 0 ? 12 : 6), 6, z + 15.5);
  restoration.group.add(cart);
  meshBox(cart, 0, 0.6, 0, 1.5, 0.25, 1.5, 0xb88a55);
  for (const dz of [-0.6, 0.6])
    for (const dx of [-0.5, 0.5]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.16, 12),
        new THREE.MeshStandardMaterial({ color: 0x554c45 }),
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(dx, 0.3, dz);
      cart.add(wheel);
    }
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.18, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffdf84,
      transparent: true,
      opacity: 0.45,
    }),
  );
  beam.position.set(x + 4.5, 14, z + 5.5);
  restoration.signal.add(beam);
  restoration.group.add(restoration.signal);
  restoration.signal.visible = s.stage === 3;
  const rainGeometry = new THREE.BufferGeometry(),
    positions = [];
  for (let i = 0; i < 28; i++) {
    const a = x + 14 + (i % 7) / 3,
      b = z + 14 + Math.floor(i / 7) / 2;
    positions.push(a, 11, b, a, 10.7, b);
  }
  rainGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  restoration.rain.add(
    new THREE.LineSegments(
      rainGeometry,
      new THREE.LineBasicMaterial({ color: 0x9de8ef }),
    ),
  );
  restoration.rain.visible = false;
  restoration.group.add(restoration.rain);
  // Imported models have a gameplay purpose: cargo, reserve, workshop and a revealed cache.
  restorationProps = [
    { name: 'box', parent: cart, x: -0.45, y: 0.75, z: 0, size: 0.8 },
    { name: 'box-open', parent: cart, x: 0.4, y: 0.75, z: 0, size: 0.7 },
    { name: 'resource-planks', x: x + 4, y: 6, z: z + 14, size: 1.3 },
    { name: 'tool-hammer', x: x + 4.8, y: 6, z: z + 14, size: 0.6 },
    { name: 'bucket', x: x + 17, y: 6, z: z + 15, size: 0.65 },
    { name: 'box-open', x: x + 14.5, y: 6, z: z + 14.5, size: 1.2 },
    { name: 'crop_carrot', x: x + 13, y: 6, z: z + 12, size: 0.5 },
    { name: 'crop_pumpkin', x: x + 17, y: 6, z: z + 12, size: 0.6 },
    { name: 'pot_small', x: x + 12.5, y: 6, z: z + 18, size: 0.7 },
    { name: 'workbench', x: x + 3, y: 6, z: z + 12, size: 1.3 },
    { name: 'tent-canvas', x: x + 15, y: 6, z: z + 4, size: 2.1 },
    { name: 'campfire-pit', x: x + 15, y: 6, z: z + 7, size: 0.9 },
  ];
  const cache = new THREE.Group();
  cache.position.set(x + 4.5, 6, z + 2);
  restoration.group.add(cache);
  restoration.cache = cache;
  restorationProps.push({
    name: 'chest',
    parent: cache,
    x: 0,
    y: 0,
    z: 0,
    size: 0.85,
  });
  cache.visible = s.stage === 3;
  interactive.push({
    kind: 'restoration',
    id: 'cache',
    pos: cache.position,
    group: cache,
    label: 'Ouvrir la cache du fanal',
    name: 'La cache retrouvée',
    nameHeight: 1.3,
    action: claimRestorationReward,
  });
  saveGame(false);
}
function restorationIntro() {
  if (ember) leaveEmber();
  S.builder.active = false;
  S.builder.project = -1;
  clearBuildPreview();
  if (!restoration) {
    modal(
      'Le hameau reste à découvrir',
      'CONSTRUCTIONS CONSERVÉES',
      '<p>Les emplacements disponibles contiennent déjà des constructions de cette partie. Elles restent intactes. Le hameau est accessible depuis un autre profil.</p><button class="primary" id="restFree">Ouvrir mes outils libres</button>',
    );
    $('restFree').onclick = builderPanel;
    return;
  }
  const i = Math.min(S.restoration.stage, 2),
    p = RESTORATION_CHAPTERS[i];
  modal(
    S.restoration.stage === 3 ? 'Le hameau reprend vie' : p.title,
    'LE HAMEAU DES DEUX RIVES',
    `<p class="speech"><b>${p.speaker}</b> — ${S.restoration.stage === 3 ? 'Le passage est ouvert, les graines sont au sec et notre signal brille ! La cache au pied du fanal s’est révélée. Viens la découvrir.' : p.story}</p><div class="rest-route">${RESTORATION_CHAPTERS.map((c, k) => `<span class="${k < S.restoration.stage ? 'done' : ''}">${k < S.restoration.stage ? restIcon('checkmark') : k + 1} ${c.title}</span>`).join('')}</div><div class="row"><button class="primary" id="restGo">${restIcon('target')} ${S.restoration.stage === 3 ? 'Rejoindre le fanal' : 'Rejoindre ' + p.speaker}</button><button class="secondary" id="restListen">Écouter</button><button class="secondary" id="restFree">${restIcon('wrench')} Construction libre</button></div>`,
  );
  $('restGo').onclick = () => visitRestoration(i);
  $('restListen').onclick = () => speak(p.story);
  $('restFree').onclick = builderPanel;
}
function visitRestoration(index) {
  if (!restoration) return;
  S.restoration.started = true;
  S.voyageGuide = false;
  const { x, z } = restoration,
    positions = [
      [6, 6, 18],
      [16, 6, 18],
      [4, 6, 10],
    ];
  const [a, y, b] = positions[index];
  player.pos.set(x + a, y, z + b);
  player.velY = 0;
  player.yaw = 0;
  player.pitch = -0.12;
  closeModal();
  streamTerrain(true);
  movePlayer(0);
  updateHUD();
  saveGame(false);
  if (S.restoration.stage < 3) startRestoration(index);
  else toast('Le coffre est au pied du fanal. Approche et utilise la main.');
}
function restIcon(name) {
  return `<img class="rest-icon" alt="" src="./assets/icons/kenney/${name}.png">`;
}
function startRestoration(index) {
  if (index > S.restoration.stage || !restoration) return;
  sfx('open');
  closeModal();
  stopInput();
  paused = true;
  S.builder.active = false;
  clearBuildPreview();
  restorationMode = {
    index,
    choice: RESTORATION_CHAPTERS[index].choices[0][0],
    turn: 0,
    selected: -1,
    view: 0,
    trial: null,
  };
  document.body.classList.add('restoring');
  $('restorationView').hidden = false;
  hand.visible = false;
  const p = RESTORATION_CHAPTERS[index];
  $('restorationView').innerHTML =
    `<div class="rest-heading"><div><small>${p.speaker} · LE HAMEAU DES DEUX RIVES</small><h2>${p.title}</h2></div><button id="restExit" aria-label="Retour dans le village">${restIcon('exit')} Quitter</button></div><p id="restSpeech">${p.story}</p><div id="restSlots"></div><div class="rest-console"><div id="restFeedback" aria-live="polite">Choisis une pièce, puis touche son emplacement dans le monde.</div><div id="restPieces"></div><div class="rest-actions"><button id="restTurn">↻ Tourner</button><button id="restRemove">${restIcon('return')} Retirer</button><button id="restHint">${restIcon('question')} Indice</button><button id="restRead" aria-label="Écouter la consigne">${restIcon('audioOn')}</button><button id="restTest" class="primary">${p.verb}</button><button id="restNext" hidden class="primary">Continuer l’histoire ${restIcon('next')}</button></div></div>`;
  $('restExit').onclick = exitRestoration;
  $('restTurn').onclick = () => {
    if (restorationMode.trial) return;
    restorationMode.turn = (restorationMode.turn + 1) % 4;
    restorationPalette();
    sfx('rotate');
  };
  $('restRemove').onclick = () =>
    editRestoration(restorationMode.selected, true);
  $('restHint').onclick = () => {
    const s = S.restoration;
    s.hints[index]++;
    $('restFeedback').textContent = p.hints[Math.min(s.hints[index] - 1, 1)];
    saveGame(false);
  };
  $('restRead').onclick = () =>
    speak(p.story + ' ' + $('restFeedback').textContent);
  $('restTest').onclick = testRestoration;
  $('restNext').onclick = () => {
    exitRestoration();
    restorationIntro();
  };
  restorationSlots(index).forEach((q, j) => {
    const b = document.createElement('button');
    b.className = 'rest-slot';
    b.dataset.slot = j;
    b.setAttribute('aria-label', 'Emplacement ' + (j + 1));
    b.textContent = String(j + 1);
    b.onclick = () => editRestoration(j);
    $('restSlots').appendChild(b);
  });
  restorationPalette();
  restorationCamera();
  renderer.render(scene, camera);
}
function exitRestoration() {
  if (!restorationMode) return;
  restoration.rain.visible = false;
  restoration.cart.position.x =
    restoration.x + (S.restoration.stage > 0 ? 12 : 6);
  restorationMode = null;
  camera.zoom = 1;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  $('restorationView').hidden = true;
  document.body.classList.remove('restoring');
  paused = false;
  stopInput();
  movePlayer(0);
  updateHUD();
  saveGame(false);
}
function restorationPalette() {
  const m = restorationMode;
  if (!m) return;
  const stock = restorationStock(S.restoration.pieces[0]);
  $('restPieces').innerHTML = RESTORATION_CHAPTERS[m.index].choices
    .map(
      ([shape, label]) =>
        `<button data-rest-piece="${shape}" aria-pressed="${shape === m.choice}">${shapeSVG(shape)}<span>${label}${m.index === 0 ? ' · ' + stock[shape] : ''}</span></button>`,
    )
    .join('');
  document.querySelectorAll('[data-rest-piece]').forEach(
    (b) =>
      (b.onclick = () => {
        if (m.trial) return;
        m.choice = b.dataset.restPiece;
        restorationPalette();
      }),
  );
  $('restTurn').disabled = m.index === 2 || m.choice === 'cube';
  $('restTurn').textContent =
    m.choice === 'slab'
      ? '↕ Moitié ' + (m.turn % 2 ? 'haute' : 'basse')
      : '↻ ' + m.turn * 90 + '°';
  const done = S.restoration.stage > m.index;
  $('restTest').hidden = done;
  $('restNext').hidden = !done;
  for (const b of document.querySelectorAll(
    '#restPieces button,#restTurn,#restRemove,#restSlots button',
  ))
    if (done) b.disabled = true;
}
function editRestoration(slot, remove = false) {
  const m = restorationMode;
  if (!m || m.trial || slot < 0 || S.restoration.stage > m.index) return;
  const s = S.restoration,
    pieces = s.pieces[m.index],
    old = pieces[slot];
  m.selected = slot;
  let code = remove
    ? 0
    : m.index === 0
      ? m.choice === 'cube'
        ? 1
        : 2 + (m.turn % 2)
      : m.index === 1
        ? m.choice === 'cube'
          ? 5
          : 1 + m.turn
        : { sphere: 1, cylinder: 2, pyramid: 3, cube: 4 }[m.choice];
  if (
    m.index === 0 &&
    old >= 2 &&
    old <= 3 &&
    code >= 2 &&
    code <= 3 &&
    old !== code
  )
    code = 4;
  if (remove && old === 4) code = 2;
  const next = pieces.slice();
  next[slot] = code;
  if (
    m.index === 0 &&
    Object.values(restorationStock(next)).some((v) => v < 0)
  ) {
    $('restFeedback').textContent =
      'Il ne reste plus de cette pièce. Retire une pièce du passage pour la réutiliser.';
    sfx('wrong');
    return;
  }
  pieces[slot] = code;
  const p = restorationSlots(m.index)[slot];
  world.set(p.x, p.y, p.z, restorationID(m.index, code));
  world.dirty.add(Math.floor(p.x / 16) + ',' + Math.floor(p.z / 16));
  document
    .querySelectorAll('#restSlots [data-slot]')
    .forEach((b) => b.classList.toggle('selected', +b.dataset.slot === slot));
  $('restFeedback').textContent = remove
    ? 'Pièce récupérée : tu peux la réutiliser.'
    : code === 4 && m.index === 0
      ? 'Les deux moitiés forment maintenant un bloc entier.'
      : 'Pièce posée. Observe, tourne une autre pièce ou essaie ton assemblage.';
  restorationPalette();
  saveGame(false);
  sfx(remove ? 'click' : 'place');
}
function testRestoration() {
  const m = restorationMode;
  if (!m || m.trial || S.restoration.stage > m.index) return;
  const pieces = S.restoration.pieces[m.index],
    success = restorationSolved(m.index, pieces);
  S.restoration.tries[m.index]++;
  recordPractice('rest:' + m.index, success);
  m.trial = { time: 0, success };
  restoration.rain.visible = m.index === 1;
  $('restFeedback').textContent = [
    'Mina pousse le chariot. Observe les roues…',
    'Éloi verse de l’eau sur les pentes. Observe où elle s’écoule…',
    'Aïna relie les pierres. Observe les correspondances…',
  ][m.index];
  $('restTest').disabled = true;
  saveGame(false);
}
function restorationCamera() {
  const m = restorationMode;
  if (!m) return;
  const { x, z } = restoration;
  const targets = [
      [9.5, 5.6, 16],
      [15.5, 10.5, 14.9],
      [4.5, 7.2, 5.4],
    ],
    v = targets[m.index],
    portrait = innerWidth < innerHeight;
  const distance = 12;
  const panelWidth = Math.min(340, innerWidth * 0.43);
  const centerX = portrait
    ? innerWidth / 2
    : (innerWidth - panelWidth - 24) / 2;
  const centerY = portrait ? innerHeight * 0.46 : innerHeight * 0.57;
  camera.zoom =
    (2 * Math.tan((camera.fov * Math.PI) / 360) * 13 * 58) / innerHeight;
  camera.setViewOffset(
    innerWidth,
    innerHeight,
    innerWidth / 2 - centerX,
    innerHeight / 2 - centerY,
    innerWidth,
    innerHeight,
  );
  camera.updateProjectionMatrix();
  camera.position.set(
    x + v[0],
    v[1] + (m.index === 2 ? 9 : distance),
    z + v[2] + (m.index === 2 ? 9 : 5),
  );
  camera.lookAt(x + v[0], v[1], z + v[2]);
  camera.updateMatrixWorld();
  restorationSlots(m.index).forEach((p, i) => {
    const v = new THREE.Vector3(p.x + 0.5, p.y + 1.05, p.z + 0.5).project(
      camera,
    );
    const b = document.querySelector(`#restSlots [data-slot="${i}"]`);
    b.style.left = (v.x * 0.5 + 0.5) * innerWidth + 'px';
    b.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 'px';
  });
}
function tickRestoration(dt) {
  const m = restorationMode;
  if (!m || world.isEmber) return;
  restorationCamera();
  if (!m.trial) return;
  const t = m.trial;
  t.time += dt;
  if (m.index === 0) {
    const p = S.restoration.pieces[0];
    let columns = 0;
    while (
      columns < 3 &&
      [p[columns], p[columns + 3]].every((c) => c === 1 || c === 4)
    )
      columns++;
    restoration.cart.position.x =
      restoration.x + 6 + Math.min(t.time * 2, t.success ? 6 : 1 + columns);
  }
  if (m.index === 1) {
    const positions = restoration.rain.children[0].geometry.attributes.position;
    const slots = restorationSlots(1);
    for (let i = 0; i < 28; i++) {
      const slot = i % 4,
        p = slots[slot],
        good = S.restoration.pieces[1][slot] === (slot % 2 ? 2 : 4);
      const phase = (t.time * 0.75 + Math.floor(i / 4) / 7) % 1;
      const side = slot % 2 ? 1 : -1;
      const px = p.x + 0.5 + (good ? side * phase * 2 : 0);
      const py = good ? 10.65 - phase * 2 : 10.65 - phase * 4.5;
      const pz = p.z + 0.22 + Math.floor(i / 4) * 0.08;
      positions.setXYZ(i * 2, px, py, pz);
      positions.setXYZ(i * 2 + 1, px + (good ? side * 0.18 : 0), py - 0.18, pz);
    }
    positions.needsUpdate = true;
    restoration.rain.children[0].geometry.computeBoundingSphere();
  }
  if (m.index === 2)
    restoration.signal.visible = t.success && Math.sin(t.time * 8) > 0;
  if (t.time < 3) return;
  restoration.rain.visible = false;
  m.trial = null;
  $('restTest').disabled = false;
  if (t.success) {
    S.restoration.stage = m.index + 1;
    S.xp += 30;
    S.journal.push('rest:' + m.index);
    restoration.signal.visible = S.restoration.stage === 3;
    restoration.cache.visible = S.restoration.stage === 3;
    $('restFeedback').textContent = [
      'Le chariot traverse ! Les graines arrivent à la réserve. Éloi t’appelle : il faut encore réparer son toit.',
      'L’eau coule dehors : les graines restent au sec ! Aïna attend près du fanal pour prévenir Lila.',
      'Le signal brille ! Le hameau est prêt. Une cache vient de se révéler au pied du fanal.',
    ][m.index];
    sfx('success');
    restorationPalette();
  } else {
    restoration.signal.visible = S.restoration.stage === 3;
    $('restFeedback').textContent = [
      'Le chariot s’arrête : une roue rencontre un trou ou une différence de hauteur. Reprends les pièces, elles ne sont pas perdues.',
      'De l’eau entre encore dans la réserve : une pièce manque ou une pente ne prolonge pas le toit. Compare les bords hauts et bas.',
      'Le signal s’interrompt : certaines pierres ne correspondent pas à leur reflet. Observe les formes de part et d’autre de la ligne.',
    ][m.index];
    sfx('wrong');
  }
  saveGame(false);
}
function claimRestorationReward() {
  if (S.restoration.stage < 3) return;
  if (S.restoration.reward) {
    toast(
      'La carte du hameau est dans ton carnet. Les graines sont déjà dans ton sac.',
    );
    return;
  }
  S.restoration.reward = true;
  give({ seed: 12, crystal: 3, glass: 16 });
  S.xp += 40;
  saveGame(false);
  modal(
    'Le message des anciens bâtisseurs',
    'LA CACHE DU FANAL',
    '<p>« Notre village tient grâce à ceux qui observent, essaient et s’entraident. »</p><p>Tu as rouvert le passage, protégé les graines et rétabli le signal. Lila te confie <b>12 graines</b> à planter ; le coffre contient aussi <b>3 cristaux et 16 blocs de verre</b> pour tes propres constructions.</p><p>Les trois découvertes sont conservées dans ton carnet. Le hameau et tes réparations restent visitables.</p><button class="primary" id="restFinish"><img class="rest-icon" alt="" src="./assets/icons/kenney/home.png"> Retourner explorer</button>',
  );
  $('restFinish').onclick = closeModal;
}
function restorationHUD() {
  if (
    !restoration ||
    world.isEmber ||
    !S.restoration.started ||
    restorationMode ||
    S.builder.active ||
    S.voyageGuide ||
    Math.hypot(
      player.pos.x - restoration.x - 10,
      player.pos.z - restoration.z - 10,
    ) > 25
  )
    return;
  if (S.restoration.stage < 3) {
    const p = RESTORATION_CHAPTERS[S.restoration.stage];
    $('trackedName').textContent = p.title;
    $('trackedText').textContent =
      'Le hameau a besoin de toi. Retrouve ' + p.speaker + '.';
    $('waypointText').textContent = '◈ Quêtes : poursuivre les réparations';
  }
}
