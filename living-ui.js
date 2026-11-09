function livingVoice(id, text) {
  if (!S.settings.sound) return;
  GamePlatform.voice(id, () => speak(text));
}
function livingRecord(kind, correct, helped = false) {
  livingAttempt(S.living, kind, correct, helped);
  recordPractice('living:' + kind, correct);
}
function livingWelcome() {
  modal(
    'La vallée des inventeurs',
    'NOUVEAU CHAPITRE',
    `<div class="living-cover"><span>III</span><h3>Un village à construire. Un monde à comprendre.</h3><p>Mila cherche un abri, Noé une serre et Sami un entrepôt. Tes constructions feront vivre les expéditions.</p></div><ol class="living-steps"><li>Construis directement sur le terrain : sol, murs, porte et toit.</li><li>Fais pousser les réserves et prépare les échanges au port.</li><li>Explore la forêt, les fossiles et le volcan. Prépare ensemble la veillée.</li></ol><p>Les matériaux de départ sont dans ton sac. Chaque mission propose des indices. Tu peux toujours revenir modifier ton travail.</p><div class="row"><button class="primary" id="livingStart">Rencontrer Mila</button><button class="secondary" id="livingRead">Écouter</button></div>`,
  );
  $('livingStart').onclick = () => {
    livingTravel('home');
    openLivingBuild(0);
  };
  $('livingRead').onclick = () =>
    livingVoice(
      'welcome',
      'Bienvenue dans la vallée des inventeurs. Construis un abri, une serre et un entrepôt. Tes découvertes feront vivre le village.',
    );
}
function livingJournal() {
  if (!living) {
    enterLiving();
    return;
  }
  refreshLivingBuildings();
  const s = S.living;
  modal(
    'La vallée des inventeurs',
    'CONSTRUIRE · PRODUIRE · EXPLORER',
    `<div class="living-stocks"><b>${s.stock.food} provisions / ${livingCapacity(living.reports)}</b><span>${s.stock.coins} pièces</span><span>${s.stock.metal} lingots</span></div><div class="living-cards">${LIVING_PLOTS.map((p, i) => `<button class="living-card" data-build="${i}"><small>${living.reports[i].ok ? 'EN SERVICE' : 'CHANTIER'}</small><b>${p.short}</b><span>${i === 0 ? 'Accueillir deux habitants' : i === 1 ? 'Cultiver six provisions par récolte' : 'Stocker trois provisions par case intérieure'}</span></button>`).join('')}</div><div class="living-route-list">${[
      ['cargo', 'Le port', 'Répartir les charges · échanger les récoltes'],
      ['forest', 'La forêt', 'Anglais oral · conduire l’expédition'],
      [
        'fossils',
        'La galerie des fossiles',
        'Fouiller les couches · reconstituer leur histoire',
      ],
      [
        'volcano',
        'Le volcan endormi',
        'Raccorder les canaux · obtenir des matériaux',
      ],
      ['grammar', 'Le bureau des messages', 'Écrire la consigne du convoi'],
      ['night', 'La veillée', 'Placer les lumières · régler la porte'],
    ]
      .map(
        ([id, name, goal]) =>
          `<button data-living-route="${id}"><b>${name}</b><span>${goal}</span><small>${s.rounds[id] || 0} mission${s.rounds[id] === 1 ? '' : 's'} réussie${s.rounds[id] === 1 ? '' : 's'} · ${livingTier(s, id)}/3</small></button>`,
      )
      .join(
        '',
      )}</div><p class="muted">Les chemins sont balisés sur la carte. Ces boutons permettent aussi de rejoindre un lieu avec la caravane.</p><div class="row"><button class="secondary" id="livingWater">Arroser la serre</button><button class="secondary" id="livingTrade">Échanger au port</button><button class="secondary" id="livingBack">Retour à Astéria</button></div>`,
  );
  document.querySelectorAll('[data-build]').forEach(
    (b) =>
      (b.onclick = () => {
        livingTravel(LIVING_PLOTS[+b.dataset.build].id);
        openLivingBuild(+b.dataset.build);
      }),
  );
  document.querySelectorAll('[data-living-route]').forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.livingRoute;
        livingTravel(id);
        livingInteract(id);
      }),
  );
  $('livingWater').onclick = livingWaterPanel;
  $('livingTrade').onclick = livingTradePanel;
  $('livingBack').onclick = leaveLiving;
}
function livingInteract(id) {
  if (id.startsWith('plot')) {
    openLivingBuild(+id.slice(4));
    return;
  }
  if (id.startsWith('lamp')) {
    const i = +id.slice(4);
    S.living.lights[i] = !S.living.lights[i];
    sfx('place');
    saveGame(false);
    return;
  }
  if (id === 'return') {
    leaveLiving();
    return;
  }
  if (id === 'mila') {
    livingJournal();
    return;
  }
  if (id === 'noe') {
    livingWaterPanel();
    return;
  }
  if (id === 'sami') {
    livingCargoIntro();
    return;
  }
  if (id === 'cargo') {
    livingCargoIntro();
    return;
  }
  if (id === 'night') {
    livingNightPanel();
    return;
  }
  if (['forest', 'fossils', 'volcano', 'grammar'].includes(id))
    startLivingChallenge(id);
}
function livingWaterPanel() {
  refreshLivingBuildings();
  const ready = living.reports[0].ok && living.reports[1].ok;
  modal(
    'Les cultures de Noé',
    'LA SERRE',
    `<p>${ready ? 'Noé peut habiter ici et travailler dans la serre. Arrose les semis : ils poussent pendant que tu construis ou explores.' : 'Noé attend une maison habitable et une serre lumineuse pour s’installer.'}</p><div class="living-growth"><i style="width:${(S.living.growth / 45) * 100}%"></i></div><p>${Math.floor(S.living.growth)} / 45 secondes de croissance · ${Math.ceil(S.living.water)} secondes d’eau en réserve.</p><p>Une récolte donne 6 provisions. Le dépôt augmente la capacité des réserves. Si tu ouvres un trou dans le toit, les cultures attendent la réparation.</p><button class="primary" id="waterLiving" ${ready ? '' : 'disabled'}>Arroser pour deux récoltes</button><button class="secondary" id="waterBack">Voir les chantiers</button>`,
  );
  $('waterLiving').onclick = () => {
    S.living.water = 90;
    closeModal();
    toast('Les cultures sont arrosées. Pars explorer : Noé s’en occupe.');
  };
  $('waterBack').onclick = livingJournal;
}
function livingTradePanel() {
  modal(
    'Le marché de Sami',
    'DES ÉCHANGES UTILES',
    `<p>Réserves : <b>${S.living.stock.food} provisions · ${S.living.stock.coins} pièces · ${S.living.stock.metal} lingots</b></p><div class="living-trades"><button id="sellFood" ${S.living.stock.food >= 3 ? '' : 'disabled'}>Donner 3 provisions → recevoir 2 pièces</button><button id="buyGlass" ${S.living.stock.coins >= 2 ? '' : 'disabled'}>Donner 2 pièces → recevoir 12 verres</button><button id="buyStone" ${S.living.stock.coins >= 1 ? '' : 'disabled'}>Donner 1 pièce → recevoir 16 pierres</button><button id="forgeTool" ${S.living.stock.metal >= 3 ? '' : 'disabled'}>Donner 3 lingots → fabriquer une pioche de fer</button></div><p>Les récoltes alimentent le marché. Les expéditions du volcan rapportent des lingots. Les quantités affichées sont réellement retirées et ajoutées.</p><button class="secondary" id="tradeCargo">Préparer le prochain convoi</button>`,
  );
  $('sellFood').onclick = () => {
    if (S.living.stock.food < 3) return;
    S.living.stock.food -= 3;
    S.living.stock.coins += 2;
    saveGame(false);
    livingTradePanel();
  };
  $('buyGlass').onclick = () => {
    if (S.living.stock.coins < 2) return;
    S.living.stock.coins -= 2;
    give({ glass: 12 });
    saveGame(false);
    livingTradePanel();
  };
  $('buyStone').onclick = () => {
    if (S.living.stock.coins < 1) return;
    S.living.stock.coins--;
    give({ stone: 16 });
    saveGame(false);
    livingTradePanel();
  };
  $('forgeTool').onclick = () => {
    if (S.living.stock.metal < 3) return;
    S.living.stock.metal -= 3;
    give({ ironpick: 1 });
    saveGame(false);
    livingTradePanel();
  };
  $('tradeCargo').onclick = livingCargoIntro;
}
function livingSuccess(kind, message, helped = false) {
  livingRecord(kind, true, helped);
  if (!S.living.discoveries.includes(kind)) S.living.discoveries.push(kind);
  if (!S.journal.includes('living:' + kind)) S.journal.push('living:' + kind);
  S.notes['living:' + kind] = message;
  S.xp += 15;
  sfx('success');
  saveGame(false);
  modal(
    'Une découverte qui sert au village',
    LIVING_SKILLS[kind],
    `<div class="living-result"><span>✓</span><p>${message}</p></div><p>Tu pourras revenir : le prochain trajet ou chargement changera. Les indices restent disponibles.</p><div class="row"><button class="primary" id="livingContinue">Voir la suite de l’aventure</button><button class="secondary" id="livingExplore">Continuer à explorer</button></div>`,
  );
  $('livingContinue').onclick = livingJournal;
  $('livingExplore').onclick = closeModal;
}
function livingFocusStart(kind, title, instruction) {
  closeModal();
  stopInput();
  paused = true;
  clearBuildPreview();
  S.builder.active = false;
  document.body.classList.add('living-focus');
  const view = $('livingView');
  view.hidden = false;
  view.innerHTML = `<header class="living-focus-head"><div><small>${kind === 'building' ? 'ATELIER DANS LE MONDE' : 'EXPÉDITION'}</small><h2>${title}</h2></div><button id="livingExit" aria-label="Revenir dans le monde">×</button></header><div class="living-instruction" id="livingInstruction">${instruction}</div><div id="livingStage"><div id="livingHitLayer"></div></div><aside id="livingTools"></aside><footer class="living-focus-footer"><p id="livingFeedback" role="status">${kind === 'building' ? 'Choisis une couche, un matériau et touche les cases du terrain.' : 'Observe le terrain. Chaque action change ce que tu vois.'}</p><div class="row"><button id="livingHint" class="secondary">Un indice</button><button id="livingListen" class="secondary">Écouter</button><button id="livingTest" class="primary">Vérifier</button></div></footer>`;
  livingFocus = {
    kind,
    helped: false,
    hints: 0,
    undo: [],
    camera: new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 90),
    group: new THREE.Group(),
    hit: [],
    busy: false,
  };
  scene.add(livingFocus.group);
  $('livingExit').onclick = exitLivingFocus;
  $('livingListen').onclick = () => livingVoice(kind, instruction);
  $('livingHint').onclick = () => livingHint();
  // Native text selection and double-tap zoom must never steal a construction tap.
  for (const event of [
    'contextmenu',
    'selectstart',
    'dblclick',
    'gesturestart',
    'gesturechange',
  ])
    view.addEventListener(event, (e) => e.preventDefault(), { passive: false });
}
function exitLivingFocus() {
  if (!livingFocus) return;
  const m = livingFocus;
  for (const o of m.hiddenActors || []) o.group.visible = true;
  scene.remove(m.group);
  m.group.traverse((o) => {
    if (o.geometry && o.geometry !== CUBE) o.geometry.dispose();
    if (o.material && !Array.isArray(o.material)) o.material.dispose();
  });
  renderer.clippingPlanes = [];
  livingFocus = null;
  $('livingView').hidden = true;
  document.body.classList.remove('living-focus');
  paused = false;
  stopInput();
  movePlayer(0);
  refreshLivingBuildings();
  updateHUD();
  saveGame(false);
  GamePlatform.stopVoice();
}
function livingFocusCamera() {
  const m = livingFocus;
  if (!m) return;
  const view = $('livingView');
  view.style.setProperty(
    '--living-bottom',
    view.querySelector('footer').getBoundingClientRect().height + 8 + 'px',
  );
  view.style.setProperty(
    '--living-tools-height',
    $('livingTools').getBoundingClientRect().height + 'px',
  );
  if (m.departAt)
    m.group.position.z = -Math.min(4, (performance.now() - m.departAt) / 250);
  const box = $('livingStage').getBoundingClientRect(),
    W = innerWidth,
    H = innerHeight;
  const plan = m.kind === 'building' ? S.living.plots[m.index] : null;
  const width = plan
    ? Math.max(plan.width, plan.depth) + (m.preview ? 3.2 : 1.7)
    : m.kind === 'forest'
      ? 7.5
      : m.kind === 'fossils'
        ? 7.8
        : 9;
  const scale = Math.min(
    box.width / width,
    box.height / (m.kind === 'fossils' ? 7 : width),
  );
  const camera = m.camera,
    halfW = W / (2 * scale),
    halfH = H / (2 * scale);
  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.setViewOffset(
    W,
    H,
    W / 2 - (box.left + box.width / 2),
    H / 2 - (box.top + box.height / 2),
    W,
    H,
  );
  const center = m.center || [38, 5, 39];
  camera.up.set(0, 0, -1);
  if (m.kind === 'fossils') {
    camera.up.set(0, 1, 0);
    camera.position.set(center[0], center[1] + 3, center[2] + 16);
    camera.lookAt(...center);
  } else if (m.preview) {
    camera.up.set(0, 1, 0);
    camera.position.set(center[0] + 9, center[1] + 11, center[2] + 12);
    camera.lookAt(center[0], center[1] + 1, center[2]);
  } else {
    camera.position.set(center[0], center[1] + 24, center[2] + 0.001);
    camera.lookAt(...center);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  for (const h of m.hit) {
    const p = new THREE.Vector3(...h.at).project(camera);
    h.el.style.left = (p.x * 0.5 + 0.5) * W + 'px';
    h.el.style.top = (-p.y * 0.5 + 0.5) * H + 'px';
    h.el.style.width = (h.size || 0.9) * scale + 'px';
    h.el.style.height = (h.size || 0.9) * scale + 'px';
    h.el.hidden = !!m.preview;
  }
  hand.visible = false;
  outline.visible = false;
}
function livingHit(label, at, size, action, className = 'living-cell') {
  const el = document.createElement('button');
  el.className = className;
  el.setAttribute('aria-label', label);
  el.onclick = action;
  $('livingHitLayer').appendChild(el);
  livingFocus.hit.push({ el, at, size });
  return el;
}
function openLivingBuild(index) {
  if (!living) return;
  const p = LIVING_PLOTS[index];
  S.living.guide = p.id;
  livingFocusStart('building', p.name, p.story);
  Object.assign(livingFocus, {
    index,
    layer: 0,
    material: 7,
    brush: 'one',
    center: [p.x + 3.5, 5, p.z + 3.5],
    preview: false,
  });
  $('livingTools').innerHTML =
    `<div class="living-size"><label>Largeur <select id="livingWidth">${[5, 6, 7].map((v) => `<option ${v === S.living.plots[index].width ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Profondeur <select id="livingDepth">${[5, 6, 7].map((v) => `<option ${v === S.living.plots[index].depth ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><div class="living-layers">${['1 · Sol', '2 · Murs', '3 · Murs', '4 · Toit'].map((t, i) => `<button data-layer="${i}" ${i === 0 ? 'aria-pressed="true"' : ''}>${t}</button>`).join('')}</div><div class="living-materials">${[
      [7, 'Bois'],
      [3, 'Pierre'],
      [16, 'Verre'],
      [8, 'Brique'],
      [0, 'Retirer'],
    ]
      .map(
        ([id, n]) =>
          `<button data-material="${id}" aria-pressed="${id === 7}"><i style="background:${id ? BLOCKS[id].color : '#294b51'}"></i>${n}</button>`,
      )
      .join(
        '',
      )}</div><label class="living-brush">Geste <select id="livingBrush"><option value="one">Un bloc</option><option value="row">Une rangée</option><option value="outline">Le contour</option></select></label><div class="row"><button id="livingUndo">Annuler</button><button id="livingPreview">Voir en 3D</button></div><p id="livingMeasure"></p>`;
  document.querySelectorAll('[data-layer]').forEach(
    (b) =>
      (b.onclick = () => {
        livingFocus.layer = +b.dataset.layer;
        livingFocus.preview = false;
        renderLivingBuildGrid();
      }),
  );
  document.querySelectorAll('[data-material]').forEach(
    (b) =>
      (b.onclick = () => {
        livingFocus.material = +b.dataset.material;
        renderLivingBuildGrid();
      }),
  );
  $('livingBrush').onchange = () =>
    (livingFocus.brush = $('livingBrush').value);
  $('livingWidth').onchange = $('livingDepth').onchange = () => {
    const cfg = S.living.plots[index],
      w = +$('livingWidth').value,
      d = +$('livingDepth').value;
    // Reducing the plan never silently deletes blocks or their resources.
    if (w < cfg.width || d < cfg.depth) {
      $('livingFeedback').textContent =
        'Les blocs hors du nouveau contour restent sur le terrain. Retire-les avec les outils libres si besoin.';
    }
    cfg.width = w;
    cfg.depth = d;
    renderLivingBuildGrid();
    saveGame(false);
  };
  $('livingPreview').onclick = () => {
    livingFocus.preview = !livingFocus.preview;
    renderLivingBuildGrid();
  };
  $('livingUndo').onclick = () => {
    const changes = livingFocus.undo.pop();
    if (!changes) return;
    for (const [x, y, z, old, id] of changes) {
      if (id) S.inv[BLOCKS[id].drop] = (S.inv[BLOCKS[id].drop] || 0) + 1;
      if (old) S.inv[BLOCKS[old].drop]--;
      world.set(x, y, z, old, true);
    }
    renderLivingBuildGrid();
    saveGame(false);
  };
  $('livingTest').onclick = testLivingBuild;
  renderLivingBuildGrid();
}
function renderLivingBuildGrid() {
  const m = livingFocus;
  if (m?.kind !== 'building') return;
  const p = LIVING_PLOTS[m.index],
    c = S.living.plots[m.index];
  m.hit = [];
  $('livingHitLayer').replaceChildren();
  m.center = [p.x + c.width / 2, 5, p.z + c.depth / 2];
  renderer.clippingPlanes = m.preview
    ? []
    : [new THREE.Plane(new THREE.Vector3(0, -1, 0), 6 + m.layer)];
  for (let z = 0; z < c.depth; z++)
    for (let x = 0; x < c.width; x++) {
      const id = world.get(p.x + x, 5 + m.layer, p.z + z),
        el = livingHit(
          `${['Sol', 'Mur bas', 'Mur haut', 'Toit'][m.layer]} : colonne ${x + 1}, rangée ${z + 1}${id ? ', ' + BLOCKS[id].name : ', vide'}`,
          [p.x + x + 0.5, 6 + m.layer, p.z + z + 0.5],
          0.94,
          () => editLivingCell(x, z),
        );
      el.dataset.x = x;
      el.dataset.z = z;
      el.classList.toggle('filled', !!id);
    }
  document
    .querySelectorAll('[data-layer]')
    .forEach((b) =>
      b.setAttribute('aria-pressed', +b.dataset.layer === m.layer),
    );
  document
    .querySelectorAll('[data-material]')
    .forEach((b) =>
      b.setAttribute('aria-pressed', +b.dataset.material === m.material),
    );
  $('livingPreview').textContent = m.preview ? 'Revenir au plan' : 'Voir en 3D';
  const report = inspectLivingPlot(m.index, c, (x, y, z) => world.get(x, y, z));
  $('livingMeasure').textContent =
    `${c.width} × ${c.depth} = ${report.area} cases au sol · ${report.perimeter} cases sur le contour · ${report.capacity} à l’intérieur. ${m.material ? `${S.inv[BLOCKS[m.material].drop] || 0} blocs disponibles.` : ''}`;
  livingFocusCamera();
}
function editLivingCell(x, z) {
  const m = livingFocus;
  if (m?.kind !== 'building' || m.preview) return;
  const p = LIVING_PLOTS[m.index],
    c = S.living.plots[m.index],
    points = [];
  if (m.brush === 'row') {
    for (let a = 0; a < c.width; a++) points.push([a, z]);
  } else if (m.brush === 'outline') {
    for (let b = 0; b < c.depth; b++)
      for (let a = 0; a < c.width; a++)
        if (a === 0 || b === 0 || a === c.width - 1 || b === c.depth - 1)
          points.push([a, b]);
  } else {
    points.push([x, z]);
  }
  const changes = points
    .map(([a, b]) => [
      p.x + a,
      5 + m.layer,
      p.z + b,
      world.get(p.x + a, 5 + m.layer, p.z + b),
      m.material,
    ])
    .filter((q) => q[3] !== q[4]);
  const costs = {};
  for (const q of changes) {
    if (q[4]) costs[BLOCKS[q[4]].drop] = (costs[BLOCKS[q[4]].drop] || 0) + 1;
    if (q[3]) costs[BLOCKS[q[3]].drop] = (costs[BLOCKS[q[3]].drop] || 0) - 1;
  }
  if (Object.entries(costs).some(([key, n]) => n > (S.inv[key] || 0))) {
    $('livingFeedback').textContent =
      'Il manque des matériaux. Récupère tes blocs ou échange des récoltes au port.';
    return;
  }
  for (const [key, n] of Object.entries(costs))
    S.inv[key] = (S.inv[key] || 0) - n;
  for (const [a, y, b, old, id] of changes) world.set(a, y, b, id, true);
  if (changes.length) m.undo.push(changes);
  S.stats.placed += changes.filter((q) => q[4]).length;
  $('livingFeedback').textContent =
    `${changes.length} bloc${changes.length > 1 ? 's' : ''} ${m.material ? 'posé' + (changes.length > 1 ? 's' : '') : 'retiré' + (changes.length > 1 ? 's' : '')}. ${m.layer === 1 || m.layer === 2 ? 'Laisse une ouverture au même endroit dans les deux couches de murs.' : ''}`;
  sfx('place');
  refreshLivingBuildings();
  renderLivingBuildGrid();
  saveGame(false);
}
function testLivingBuild() {
  const m = livingFocus,
    report = inspectLivingPlot(m.index, S.living.plots[m.index], (x, y, z) =>
      world.get(x, y, z),
    );
  $('livingFeedback').innerHTML = report.checks
    .map(
      (c) =>
        `<span class="living-check ${c.ok ? 'ok' : ''}">${c.ok ? '✓' : '○'} ${c.text}</span>`,
    )
    .join('');
  if (!report.ok) {
    livingRecord('building', false);
    sfx('wrong');
    return;
  }
  if (!S.living.plots[m.index].rewarded) {
    S.living.plots[m.index].rewarded = true;
    S.living.stock.coins += 3;
    S.xp += 25;
    livingRecord('building', true, m.helped);
  }
  refreshLivingBuildings();
  saveGame(false);
  sfx('success');
  $('livingFeedback').innerHTML =
    '<strong>✓ En service ! Les habitants peuvent utiliser ton bâtiment.</strong>' +
    report.checks
      .map((c) => `<span class="living-check ok">✓ ${c.text}</span>`)
      .join('');
  m.preview = true;
  renderLivingBuildGrid();
}
function livingHint() {
  const m = livingFocus;
  if (!m) return;
  m.helped = true;
  const n = ++m.hints;
  S.living.hints[m.kind] = (S.living.hints[m.kind] || 0) + 1;
  const hints = {
    building: [
      'Remplis le sol. Sur les deux couches suivantes, construis seulement le contour. Garde la même case vide pour la porte.',
      'Le toit recouvre la largeur et la profondeur. Pour la serre, remplace au moins six blocs de mur ou de toit par du verre. Pour le dépôt, choisis 5 × 6 ou davantage.',
    ],
    cargo: [
      'Pose d’abord le minimum de nourriture dans chaque chariot. Un sac pèse 1 unité et une caisse de bois 2.',
      'Regarde la masse restante : une caisse de bois remplit deux unités. Tu peux déplacer les objets entre les chariots sans rien perdre.',
    ],
    forest: [
      'Forward = avancer. Left = gauche. Right = droite. La direction dépend du regard du guide.',
      'Tourner change l’orientation ; avancer change la case. La flèche indique toujours où le guide regarde.',
    ],
    fossils: [
      'Explore une couche à la fois, du haut vers le bas. Note l’endroit où chaque fossile apparaît.',
      'Dans cette série non bouleversée, la couche du bas est la plus ancienne. Classe les trouvailles du bas vers le haut.',
    ],
    volcano: [
      'Chaque canal possède deux sorties. Tourne-le pour les faire rejoindre les canaux voisins.',
      'Pars de l’arrivée bleue à gauche. Suis le trajet case par case jusqu’à la sortie à droite.',
    ],
    grammar: [
      'Cherche le sujet : une personne, ou plusieurs ? Choisis le verbe qui correspond.',
      'Les correspond à plusieurs ; le verbe prend souvent -ent. Hier indique le passé ; demain indique le futur.',
    ],
  };
  $('livingFeedback').textContent =
    (hints[m.kind] || [])[Math.min(n - 1, 1)] ||
    'Observe le résultat de chaque action.';
  saveGame(false);
}
function livingCargoIntro() {
  modal(
    'Le prochain convoi',
    'SAMI · PORT DES ÉCHANGES',
    `<p>Les explorateurs attendent des vivres et du bois. Répartis la cargaison sans dépasser la masse prévue pour chaque chariot.</p><p>Le départ consomme <b>3 provisions</b> de ton village et rapporte <b>4 pièces et 12 planches</b>. La cargaison manipulée appartient à la caravane.</p><p>Réserves : ${S.living.stock.food} provisions.</p><div class="row"><button class="primary" id="cargoStart" ${S.living.stock.food >= 3 ? '' : 'disabled'}>Charger les chariots</button><button class="secondary" id="cargoMarket">Voir les échanges</button><button class="secondary" id="cargoGarden">Voir les cultures</button></div>`,
  );
  $('cargoStart').onclick = () => startLivingChallenge('cargo');
  $('cargoMarket').onclick = livingTradePanel;
  $('cargoGarden').onclick = livingWaterPanel;
}
function startLivingChallenge(kind) {
  if (!living) return;
  if (kind === 'cargo' && S.living.stock.food < 3) {
    livingCargoIntro();
    return;
  }
  const c = livingVariant(S.living, kind);
  const intros = {
    cargo: `Répartis ${c.food} sacs (masse 1) et ${c.wood} caisses de bois (masse 2). Chaque chariot doit recevoir au moins ${c.minimum} sacs.`,
    forest:
      'June cherche une clairière. Écoute les indications en anglais et conduis le guide avec les trois commandes.',
    fossils:
      'Ada examine des couches sédimentaires restées dans leur ordre de dépôt. Fouille du haut vers le bas, puis classe les fossiles du plus ancien au plus récent.',
    volcano:
      'Tao a besoin d’eau pour son atelier près du volcan. Tourne les canaux : relie l’arrivée bleue à gauche à la sortie dorée à droite.',
    grammar:
      'Sami doit envoyer une consigne au village. Assemble les étiquettes dans le bon ordre. Certaines étiquettes ne conviennent pas.',
  };
  livingFocusStart(kind, LIVING_SKILLS[kind].split(' · ')[1], intros[kind]);
  Object.assign(livingFocus, {
    challenge: c,
    center:
      kind === 'cargo'
        ? [13, 5, 61]
        : kind === 'forest'
          ? [14, 5, 18]
          : kind === 'fossils'
            ? [62, 7, 17]
            : kind === 'volcano'
              ? [63, 5, 61]
              : [38, 5, 34],
    completed: false,
  });
  livingFocus.hiddenActors = interactive.filter(
    (o) =>
      o.group.visible &&
      Math.hypot(
        o.pos.x - livingFocus.center[0],
        o.pos.z - livingFocus.center[2],
      ) < 9,
  );
  livingFocus.hiddenActors.forEach((o) => (o.group.visible = false));
  if (kind === 'cargo') setupLivingCargo();
  if (kind === 'forest') setupLivingForest();
  if (kind === 'fossils') setupLivingFossils();
  if (kind === 'volcano') setupLivingVolcano();
  if (kind === 'grammar') setupLivingGrammar();
  livingFocusCamera();
}
function finishLivingChallenge(message) {
  const m = livingFocus;
  if (!m || m.completed) return;
  m.completed = true;
  const { kind, helped } = m;
  if (kind === 'cargo') {
    if (S.living.stock.food < 3) {
      m.completed = false;
      return;
    }
    S.living.stock.food -= 3;
    S.living.stock.coins += 4;
    give({ plank: 12 });
    S.living.deliveries++;
  }
  if (kind === 'forest') give({ wood: 12, seed: 4 });
  if (kind === 'fossils') {
    give({ stone: 16, crystal: 2 });
  }
  if (kind === 'volcano') {
    S.living.stock.metal += 2;
    give({ brick: 12 });
  }
  if (kind === 'grammar') {
    S.living.stock.coins += 2;
  }
  exitLivingFocus();
  livingSuccess(kind, message, helped);
}
function setupLivingCargo() {
  const m = livingFocus,
    c = m.challenge;
  m.load = c.weights.map(() => [0, 0]);
  m.crates = new THREE.Group();
  m.group.add(m.crates);
  for (let i = 0; i < c.weights.length; i++) {
    const x = 10.5 + i * 2.5;
    meshBox(m.group, x, 5.3, 61, 1.8, 0.5, 2.8, 0x816142);
    for (const z of [60, 62])
      for (const dx of [-0.8, 0.8])
        meshBox(m.group, x + dx, 5.1, z, 0.2, 0.4, 0.4, 0x303c3c);
  }
  $('livingTools').innerHTML =
    `<p id="cargoRemaining"></p>${c.weights.map((w, i) => `<div class="living-load"><b>Chariot ${i + 1} · masse ${w}</b><span id="cargoWeight${i}"></span>${['Sac', 'Bois'].map((s, j) => `<div class="row"><button data-cargo="${i},${j},-1" aria-label="Retirer ${s} du chariot ${i + 1}">−</button><span id="cargoCount${i}${j}">0 ${s}</span><button data-cargo="${i},${j},1" aria-label="Ajouter ${s} au chariot ${i + 1}">+</button></div>`).join('')}</div>`).join('')}`;
  document.querySelectorAll('[data-cargo]').forEach(
    (b) =>
      (b.onclick = () => {
        const [i, j, dir] = b.dataset.cargo.split(',').map(Number),
          total = m.load.reduce((n, v) => n + v[j], 0),
          available = j ? c.wood : c.food;
        if ((dir < 0 && m.load[i][j] === 0) || (dir > 0 && total >= available))
          return;
        m.load[i][j] += dir;
        renderLivingCargo();
        sfx('place');
      }),
  );
  $('livingTest').onclick = () => {
    if (m.busy) return;
    if (livingCargoValid(c, m.load)) {
      m.busy = true;
      m.departAt = performance.now();
      $('livingFeedback').textContent =
        'Les masses sont respectées. Le convoi rejoint le village !';
      document
        .querySelectorAll('[data-cargo]')
        .forEach((b) => (b.disabled = true));
      setTimeout(() => {
        if (livingFocus === m)
          finishLivingChallenge(
            'Le chargement est équilibré selon les masses demandées. Les chariots partent : −3 provisions, +4 pièces et +12 planches. Tu as combiné des groupes de 1 et de 2.',
          );
      }, 1100);
    } else {
      livingRecord('cargo', false);
      $('livingFeedback').textContent =
        'Le convoi attend. Vérifie le minimum de sacs, la masse de chaque chariot et les objets restants.';
      sfx('wrong');
    }
  };
  renderLivingCargo();
}
function renderLivingCargo() {
  const m = livingFocus,
    c = m.challenge;
  m.crates.children.forEach((o) => o.material.dispose());
  m.crates.clear();
  m.load.forEach((load, i) => {
    const total = load[0] + 2 * load[1];
    $('cargoWeight' + i).textContent =
      `Masse chargée : ${total} / ${c.weights[i]}`;
    load.forEach((count, j) => {
      $('cargoCount' + i + j).textContent = `${count} ${j ? 'bois' : 'sacs'}`;
      for (let k = 0; k < count; k++)
        meshBox(
          m.crates,
          10.05 + i * 2.5 + j * 0.9,
          5.7 + Math.floor(k / 4) * 0.4,
          60.1 + (k % 4) * 0.55,
          0.65,
          0.36,
          0.45,
          j ? 0xac8053 : 0xb9be7c,
        );
    });
  });
  $('cargoRemaining').textContent =
    `À charger : ${c.food - m.load.reduce((n, v) => n + v[0], 0)} sacs et ${c.wood - m.load.reduce((n, v) => n + v[1], 0)} caisses.`;
}
function setupLivingForest() {
  const m = livingFocus,
    c = m.challenge;
  m.position = c.start.slice();
  m.facing = 0;
  m.command = 0;
  m.history = [];
  for (let z = 0; z < 5; z++)
    for (let x = 0; x < 5; x++) {
      const blocked = c.blocked.some((q) => q[0] === x && q[1] === z),
        end = c.end[0] === x && c.end[1] === z;
      meshBox(
        m.group,
        11.6 + x * 1.2,
        5.04,
        15.6 + z * 1.2,
        1.08,
        0.08,
        1.08,
        blocked ? 0x4b6951 : end ? 0xd8bf75 : 0xb9b68b,
      );
      if (blocked)
        meshBox(
          m.group,
          11.6 + x * 1.2,
          5.45,
          15.6 + z * 1.2,
          0.6,
          0.8,
          0.6,
          0x45684e,
        );
    }
  m.guide = new THREE.Group();
  m.group.add(m.guide);
  meshBox(m.guide, 0, 0.35, 0, 0.35, 0.7, 0.35, 0xe4c580);
  meshBox(m.guide, 0, 0.7, -0.22, 0.2, 0.15, 0.3, 0x315a5c);
  $('livingTools').innerHTML =
    '<div id="forestCommand" class="living-command"></div><div class="living-directions"><button data-direction="left">↶ Left</button><button data-direction="forward">↑ Forward</button><button data-direction="right">↷ Right</button></div><button id="forestReset">Repartir de la tente</button><p>La pointe sombre indique le regard du guide.</p>';
  document
    .querySelectorAll('[data-direction]')
    .forEach((b) => (b.onclick = () => livingForestMove(b.dataset.direction)));
  $('forestReset').onclick = () => {
    m.position = c.start.slice();
    m.facing = 0;
    m.command = 0;
    m.history = [];
    renderLivingForest();
  };
  $('livingListen').onclick = () =>
    livingVoice(
      c.commands[m.command] || 'arrived',
      c.commands[m.command] || 'Well done.',
    );
  $('livingTest').textContent = 'Vérifier l’arrivée';
  $('livingTest').onclick = () => {
    if (
      m.command === c.commands.length &&
      m.position.every((n, i) => n === c.end[i])
    )
      finishLivingChallenge(
        'June a trouvé la clairière. Forward signifie avancer ; left, gauche ; right, droite. +12 bûches et +4 graines pour le village.',
      );
    else
      $('livingFeedback').textContent =
        'Continue les indications jusqu’à la clairière dorée.';
  };
  renderLivingForest();
}
function livingForestMove(command) {
  const m = livingFocus,
    c = m.challenge;
  if (m.command >= c.commands.length) return;
  if (command !== c.commands[m.command]) {
    livingRecord('forest', false);
    $('livingFeedback').textContent =
      'June attend ce mouvement : ' +
      {
        left: 'Turn left. Tourne à gauche.',
        right: 'Turn right. Tourne à droite.',
        forward: 'Go forward. Avance.',
      }[c.commands[m.command]];
    m.helped = true;
    sfx('wrong');
    return;
  }
  if (command === 'left') m.facing = (m.facing + 3) % 4;
  else if (command === 'right') m.facing = (m.facing + 1) % 4;
  else {
    const [dx, dz] = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][m.facing];
    m.position = [m.position[0] + dx, m.position[1] + dz];
  }
  m.command++;
  m.history.push(command);
  renderLivingForest();
  sfx('step');
}
function renderLivingForest() {
  const m = livingFocus,
    c = m.challenge;
  m.guide.position.set(
    11.6 + m.position[0] * 1.2,
    5.1,
    15.6 + m.position[1] * 1.2,
  );
  m.guide.rotation.y = (-m.facing * Math.PI) / 2;
  const command = c.commands[m.command];
  $('forestCommand').textContent = command
    ? `${m.command + 1} / ${c.commands.length} · ${{ forward: 'Go forward.', left: 'Turn left.', right: 'Turn right.' }[command]}`
    : 'You found the clearing!';
  if (command) livingVoice(command, command);
  else
    $('livingFeedback').textContent =
      'La clairière est atteinte. Vérifie l’arrivée pour rapporter tes découvertes.';
}
function setupLivingFossils() {
  const m = livingFocus,
    c = m.challenge;
  m.exposed = c.layers.length - 1;
  m.found = [];
  m.order = [];
  m.layers = [];
  c.layers.forEach((name, i) => {
    const g = new THREE.Group();
    m.group.add(g);
    meshBox(
      g,
      62,
      5.4 + i * 0.8,
      17,
      5.5,
      0.75,
      1.5,
      new THREE.Color(c.colors[i]),
    );
    // A spiral imprint is embedded in the stratum, never floating in the cave.
    const curve = [];
    for (let a = 0; a < 8; a += 0.14) {
      const r = 0.035 * a;
      curve.push(
        new THREE.Vector3(
          62 + Math.cos(a) * r,
          5.4 + i * 0.8 + Math.sin(a) * r,
          17.76,
        ),
      );
    }
    g.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve),
        new THREE.LineBasicMaterial({ color: 0x3e4943 }),
      ),
    );
    m.layers.push(g);
    const el = livingHit(
      'Fouiller la couche ' + (i + 1),
      [62, 5.4 + i * 0.8, 18],
      1,
      () => livingExcavate(i),
      'living-fossil-hit',
    );
    el.textContent = 'Fouiller';
  });
  m.center = [62, 5.3 + c.layers.length * 0.4, 17];
  $('livingTools').innerHTML =
    '<p>Collection, du plus ancien au plus récent :</p><div id="fossilOrder"></div><div id="fossilFinds"></div><button id="fossilUndo">Retirer la dernière étiquette</button>';
  $('fossilUndo').onclick = () => {
    m.order.pop();
    renderLivingFossils();
  };
  $('livingTest').onclick = () => {
    if (m.order.length === c.layers.length && m.order.every((n, i) => n === i))
      finishLivingChallenge(
        'Tu as reconstitué l’ordre de dépôt : ici, les couches du bas sont les plus anciennes. Un fossile peut être un reste ou une trace d’un être vivant. +16 pierres et +2 cristaux pour le village.',
      );
    else {
      livingRecord('fossils', false);
      $('livingFeedback').textContent =
        'Regarde les positions notées lors de la fouille. Le classement demandé commence par la couche la plus ancienne, en bas.';
    }
  };
  renderLivingFossils();
}
function livingExcavate(index) {
  const m = livingFocus;
  if (index !== m.exposed) {
    $('livingFeedback').textContent =
      'Pour préserver les traces, retire d’abord la couche la plus haute encore présente.';
    return;
  }
  m.layers[index].visible = false;
  m.found.push(index);
  m.exposed--;
  const x = 59.8 + index * 1.1;
  meshBox(m.group, x, 5.2, 19.5, 0.95, 0.4, 0.8, 0x886b4e);
  meshBox(
    m.group,
    x,
    5.48,
    19.5,
    0.75,
    0.16,
    0.6,
    new THREE.Color(m.challenge.colors[index]),
  );
  // The recovered sample rests on its tray; its original layer remains on its label.
  const imprint = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.035, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a5f55 }),
  );
  imprint.rotation.x = -Math.PI / 2;
  imprint.position.set(x, 5.58, 19.5);
  m.group.add(imprint);
  $('livingFeedback').textContent =
    `Couche ${index + 1} depuis le bas : ${m.challenge.layers[index]}. Cette position est conservée sur son étiquette.`;
  renderLivingFossils();
  sfx('mine');
}
function renderLivingFossils() {
  const m = livingFocus,
    c = m.challenge;
  m.hit.forEach((h, i) => {
    h.el.disabled = i !== m.exposed;
    h.el.style.visibility = i > m.exposed ? 'hidden' : 'visible';
  });
  $('fossilFinds').innerHTML = m.found
    .filter((i) => !m.order.includes(i))
    .map(
      (i) =>
        `<button data-fossil="${i}">${c.layers[i]}<small>Couche ${i + 1} depuis le bas</small></button>`,
    )
    .join('');
  $('fossilOrder').innerHTML =
    m.order.map((i, j) => `<span>${j + 1}. ${c.layers[i]}</span>`).join('') ||
    '<span>Choisis les étiquettes après la fouille.</span>';
  document.querySelectorAll('[data-fossil]').forEach(
    (b) =>
      (b.onclick = () => {
        m.order.push(+b.dataset.fossil);
        renderLivingFossils();
      }),
  );
}
function setupLivingVolcano() {
  const m = livingFocus,
    c = m.challenge;
  m.rotations = c.rotations.slice();
  m.pipes = [];
  for (let z = 0; z < 3; z++)
    for (let x = 0; x < 3; x++) {
      const i = x + z * 3,
        g = new THREE.Group();
      g.position.set(60.6 + x * 2.4, 5.3, 58.6 + z * 2.4);
      m.group.add(g);
      m.pipes.push(g);
      meshBox(g, 0, -0.15, 0, 2.2, 0.3, 2.2, 0x93836c);
      meshBox(g, 0, 0.03, 0, 0.65, 0.16, 0.65, 0x779aa6);
      c.tiles[i].forEach((d) => {
        const [dx, dz] = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ][d];
        meshBox(
          g,
          dx * 0.65,
          0.04,
          dz * 0.65,
          dx ? 1.3 : 0.5,
          0.18,
          dz ? 1.3 : 0.5,
          0x779aa6,
        );
      });
      livingHit(
        'Tourner le canal ' + (i + 1),
        [g.position.x, 5.5, g.position.z],
        2.1,
        () => {
          m.rotations[i] = (m.rotations[i] + 1) % 4;
          renderLivingVolcano();
          sfx('click');
        },
        'living-pipe-hit',
      );
    }
  meshBox(m.group, 58.8, 5.3, 61, 1.1, 0.2, 0.6, 0x66d1eb);
  meshBox(m.group, 67.2, 5.3, 61, 1.1, 0.2, 0.6, 0xe0bd78);
  $('livingTools').innerHTML =
    '<p>Arrivée bleue → sortie dorée</p><p>Touche un canal pour le faire pivoter d’un quart de tour.</p><p>Dans le monde réel, le magma sortant à la surface devient de la lave. Ici, tu répares un canal d’eau pour l’atelier, à distance du cratère.</p>';
  $('livingTest').textContent = 'Faire couler l’eau';
  $('livingTest').onclick = () => {
    const result = livingTracePipes(c, m.rotations);
    m.pipes.forEach((g, i) =>
      g.children.forEach((o, j) => {
        if (j)
          o.material.color.setHex(
            result.path.includes(i) ? 0x62d2df : 0x779aa6,
          );
      }),
    );
    if (result.ok) {
      $('livingFeedback').textContent =
        'L’eau atteint l’atelier. Le trajet est continu !';
      m.busy = true;
      setTimeout(() => {
        if (livingFocus === m)
          finishLivingChallenge(
            'Le canal rejoint l’atelier. Tu as testé les connexions et les quarts de tour. Tao prépare +2 lingots et +12 briques. La lave est le nom du magma arrivé à la surface.',
          );
      }, 900);
    } else {
      livingRecord('volcano', false);
      $('livingFeedback').textContent =
        'L’eau s’arrête au premier raccord manquant. Suis les canaux devenus bleus et corrige la suite.';
    }
  };
  renderLivingVolcano();
}
function renderLivingVolcano() {
  const m = livingFocus;
  m.pipes.forEach((g, i) => (g.rotation.y = (-m.rotations[i] * Math.PI) / 2));
}
function setupLivingGrammar() {
  const m = livingFocus,
    c = m.challenge;
  m.words = [];
  m.tokens = [...c.words, ...c.distractors]
    .map((word, id) => ({ word, id }))
    .sort(
      (a, b) =>
        ((a.id * 7 + S.living.rounds.grammar * 3) % 11) -
        ((b.id * 7 + S.living.rounds.grammar * 3) % 11),
    );
  meshBox(m.group, 38, 5.6, 34, 6, 0.3, 3, 0x9d815c);
  meshBox(m.group, 38, 5.8, 34, 5.4, 0.08, 2.4, 0xe9dab6);
  $('livingTools').innerHTML =
    '<p id="grammarGoal">' +
    (c.words[0] === 'Hier,'
      ? 'Le message raconte ce qui s’est passé hier.'
      : c.words[0] === 'Demain,'
        ? 'Le message annonce ce qui se passera demain.'
        : 'Le message doit décrire le travail des habitants.') +
    '</p><div id="grammarSentence"></div><div id="grammarTokens"></div><button id="grammarUndo">Retirer le dernier mot</button>';
  $('grammarUndo').onclick = () => {
    m.words.pop();
    renderLivingGrammar();
  };
  $('livingTest').textContent = 'Envoyer le message';
  $('livingTest').onclick = () => {
    const text = m.words.map((id) => m.tokens.find((t) => t.id === id).word);
    if (text.join(' ') === c.words.join(' '))
      finishLivingChallenge(
        'Message transmis : « ' +
          text.join(' ') +
          ' » Le sujet, le verbe et les accords correspondent. Sami prépare le convoi et verse 2 pièces au village.',
      );
    else {
      livingRecord('grammar', false);
      $('livingFeedback').textContent =
        'Le destinataire hésite. Vérifie le sujet, le nombre et le temps indiqué. Tu peux retirer les mots sans recommencer toute la phrase.';
    }
  };
  renderLivingGrammar();
}
function renderLivingGrammar() {
  const m = livingFocus;
  $('grammarSentence').textContent =
    m.words.map((id) => m.tokens.find((t) => t.id === id).word).join(' ') ||
    'Ta consigne apparaîtra ici.';
  $('grammarTokens').innerHTML = m.tokens
    .filter((t) => !m.words.includes(t.id))
    .map((t) => `<button data-word="${t.id}">${t.word}</button>`)
    .join('');
  document.querySelectorAll('[data-word]').forEach(
    (b) =>
      (b.onclick = () => {
        m.words.push(+b.dataset.word);
        renderLivingGrammar();
        sfx('place');
      }),
  );
}
function livingNightPanel(feedback = '') {
  if (!living) return;
  refreshLivingBuildings();
  const s = S.living,
    ready = livingNightReady(living.reports, s.lights, s.gate);
  modal(
    'Préparer la veillée',
    'LUMIÈRE · CIRCUIT · ABRI',
    `<p>Les veilleurs approchent par l’est. Éclaire tout le chemin, ferme la porte et vérifie l’abri. Tu peux observer l’essai sans perdre ton inventaire.</p>${feedback ? `<p class="banner">${feedback}</p>` : ''}<div class="living-lamp-map"><span>Maison</span>${s.lights.map((on, i) => `<button data-lamp="${i}" aria-pressed="${on}">${on ? '☀' : '○'}<small>${LIVING_LAMPS[i][0]} m</small></button>`).join('')}<span>Porte</span></div><p>Une lanterne éclaire un rayon de 3,3 blocs. Les poteaux sont espacés de 4 blocs. Évite les trous entre leurs cercles.</p><div class="living-circuit"><span>Source →</span>${s.gate.map((on, i) => `<button data-gate="${i}" aria-pressed="${on}">${['A · alimentation', 'B · verrou', 'C · dérivation'][i]}<small>${on ? 'Fermé' : 'Ouvert'}</small></button>`).join('')}<span>→ Porte</span></div><p>Le courant doit passer par A puis B. C détourne le courant : garde cette dérivation ouverte.</p><ul class="living-checklist"><li>${ready.shelter ? '✓' : '○'} Maison habitable</li><li>${ready.covered ? '✓' : '○'} Chemin entièrement éclairé</li><li>${ready.circuit ? '✓' : '○'} Porte alimentée et fermée</li></ul><div class="row"><button class="primary" id="nightBegin">Observer la veillée</button><button class="secondary" id="nightWalk">Voir mes lanternes</button></div>`,
  );
  document.querySelectorAll('[data-lamp]').forEach(
    (b) =>
      (b.onclick = () => {
        s.lights[+b.dataset.lamp] = !s.lights[+b.dataset.lamp];
        saveGame(false);
        livingNightPanel();
      }),
  );
  document.querySelectorAll('[data-gate]').forEach(
    (b) =>
      (b.onclick = () => {
        s.gate[+b.dataset.gate] = !s.gate[+b.dataset.gate];
        saveGame(false);
        livingNightPanel();
      }),
  );
  $('nightBegin').onclick = startLivingNight;
  $('nightWalk').onclick = closeModal;
}
