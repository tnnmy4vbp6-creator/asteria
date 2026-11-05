let audioContext = null,
  modalToken = 0,
  lastFocus = null,
  equipPending = null,
  activeTab = 'craft',
  currentChallenge = null;
function sfx(type) {
  if (!S.settings.sound) return;
  if (playSample(type)) return;
  try {
    audioContext =
      audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    let o = audioContext.createOscillator(),
      g = audioContext.createGain();
    let f =
      {
        mine: 160,
        place: 230,
        step: 75,
        jump: 300,
        success: 650,
        click: 420,
        wrong: 210,
        harvest: 520,
      }[type] || 350;
    o.type = ['mine', 'step', 'place'].includes(type) ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(f, audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      f * (type === 'success' ? 1.5 : 0.65),
      audioContext.currentTime + 0.12,
    );
    g.gain.setValueAtTime(
      type === 'step' ? 0.018 : 0.055,
      audioContext.currentTime,
    );
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.17);
    o.connect(g);
    g.connect(audioContext.destination);
    o.start();
    o.stop(audioContext.currentTime + 0.18);
  } catch (e) {}
}
function speak(text) {
  if (!('speechSynthesis' in window)) {
    toast('La lecture vocale n’est pas disponible dans ce navigateur.');
    return;
  }
  speechSynthesis.cancel();
  let u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
function toast(text) {
  if ($('toasts').firstElementChild?.textContent === text) return;
  $('toasts').firstElementChild?.remove();
  let d = document.createElement('div');
  d.className = 'toast';
  d.textContent = text;
  $('toasts').appendChild(d);
  setTimeout(() => d.remove(), 4300);
}
function stopInput() {
  keys = {};
  mouseDown = false;
  mineTime = 0;
  dragging = null;
  document.exitPointerLock?.();
  if ($('mineProgress')) $('mineProgress').style.display = 'none';
}
function modal(title, eyebrow, html) {
  modalToken++;
  lastFocus = document.activeElement;
  paused = true;
  stopInput();
  $('modal').classList.remove('hidden');
  $('modalBody').innerHTML =
    `<div class="modal-head"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div><button class="close" id="modalClose" aria-label="Fermer">×</button></div><div class="modal-content">${html}</div>`;
  $('modalClose').onclick = closeModal;
  $('modalClose').focus();
  return modalToken;
}
function closeModal() {
  modalToken++;
  $('modal').classList.add('hidden');
  paused = !playing;
  stopInput();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (playing) {
    if (typeof Audio !== 'undefined') updateMusic(true);
    saveGame(false);
    renderer.domElement.focus();
  } else lastFocus?.focus?.();
}
function footerButtons() {
  return '<div class="row spread" style="margin-top:20px"><button class="secondary" id="readQuestion">🔊 Écouter</button><div class="row"><button class="secondary" id="hintButton">Un indice</button><button class="primary hidden" id="nextChallenge">Continuer →</button></div></div>';
}
function costHTML(cost) {
  return Object.entries(cost)
    .map(
      ([k, n]) =>
        `<span class="${(S.inv[k] || 0) < n ? 'missing' : ''}">${ITEMS[k].icon} ${n} ${itemName(k).toLowerCase()} (${S.inv[k] || 0})</span>`,
    )
    .join(' · ');
}
function updateHUD() {
  if (!playing) return;
  let n = NPCS.find((n) => n.id === S.tracked) || NPCS[0],
    p = questProgress(n),
    distance = Math.round(Math.hypot(player.pos.x - n.x, player.pos.z - n.z));
  $('trackedName').textContent = n.quest;
  $('trackedText').textContent = p.done
    ? 'Sceau retrouvé. Aide un autre gardien.'
    : p.started && p.stage < n.puzzles?.length
      ? 'Retourne voir ' + n.name + ' pour poursuivre l’épreuve.'
      : n.goal;
  $('waypointText').textContent = n.name + ' · ' + distance + ' m';
  $('biome').textContent =
    player.pos.x < 23 && player.pos.z < 32
      ? 'LES GALERIES DE CUIVRE'
      : player.pos.z < 22 && player.pos.x < 54
        ? 'LES CIMES DE NACRE'
        : player.pos.x > 55
          ? 'LES SABLES DU TEMPS'
          : player.pos.x < 23
            ? 'LA FORÊT DES MURMURES'
            : player.pos.z < 60
              ? 'LE VILLAGE D’ASTÉRIA'
              : 'LES PRAIRIES D’ÉMERAUDE';
  let hour = ((S.time % 720) / 30 + 6) % 24;
  $('clock').textContent =
    (hour >= 6 && hour < 19 ? '☀ ' : '☾ ') +
    String(Math.floor(hour)).padStart(2, '0') +
    ':' +
    String(Math.floor((hour % 1) * 60)).padStart(2, '0');
  $('day').textContent = 'Jour ' + (Math.floor(S.time / 720) + 1);
  $('health').textContent = '♥ '
    .repeat(Math.max(0, Math.ceil(S.health / 20)))
    .trim();
  $('food').textContent = '● '
    .repeat(Math.max(0, Math.ceil(S.energy / 20)))
    .trim();
  $('xpLabel').textContent =
    'EXPLORATEUR · NIVEAU ' + (1 + Math.floor(S.xp / 100));
  $('xpFill').style.width = (S.xp % 100) + '%';
  if (!S.millDismissed && S.mill.stage < 3) {
    const destination =
      millSites[S.mill.stage < 1 ? 0 : S.mill.stage === 1 ? 1 : 2];
    n = {
      x: Math.floor(destination.x),
      z: Math.floor(destination.z),
      name: ['Zoé', 'Roue', 'Vanne'][millSites.indexOf(destination)],
    };
    distance = Math.round(
      Math.hypot(player.pos.x - destination.x, player.pos.z - destination.z),
    );
    $('trackedName').textContent = millHeading();
    $('trackedText').textContent = [
      'Cherche la casquette brune près du chemin.',
      'Apporte 4 planches à la roue, à l’est.',
      'Remonte la rive vers le nord.',
    ][S.mill.stage];
    $('waypointText').textContent = n.name + ' · ' + distance + ' m';
  }
  let angle = ((((player.yaw * 180) / Math.PI) % 360) + 360) % 360;
  $('compassDir').textContent =
    angle < 45 || angle > 315
      ? 'N'
      : angle < 135
        ? 'O'
        : angle < 225
          ? 'S'
          : 'E';
  const barKey = JSON.stringify([
    S.hotbar,
    S.selected,
    S.tool,
    S.creative,
    S.hotbar.map((k) => S.inv[k] || 0),
  ]);
  if (barKey !== updateHUD.barKey) {
    updateHUD.barKey = barKey;
    $('hotbar').innerHTML = S.hotbar
      .map(
        (k, i) =>
          `<button class="slot ${i === S.selected ? 'selected' : ''}" data-slot="${i}" aria-label="Emplacement ${i + 1} : ${itemName(k)}, ${S.inv[k] || 0}"><span class="key">${i + 1}</span>${itemIcon(k)}<span class="count">${k === 'pickaxe' ? ['Main', 'Bois', 'Pierre', 'Fer'][S.tool] : S.creative && PLACE[k] ? '∞' : S.inv[k] || 0}</span></button>`,
      )
      .join('');
    document
      .querySelectorAll('[data-slot]')
      .forEach((b) => (b.onclick = () => selectSlot(+b.dataset.slot)));
  }
  drawMap($('minimap'));
  let v = new THREE.Vector3(
      n.x + 0.5,
      world.heights[n.x + n.z * VW] + 5,
      n.z + 0.5,
    ).project(camera),
    wp = $('waypoint');
  let facing =
    v.z < 1 && v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1 && distance > 5;
  wp.classList.toggle('hidden', !facing);
  if (facing) {
    wp.style.left = (v.x * 0.5 + 0.5) * innerWidth + 'px';
    wp.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 'px';
    wp.querySelector('b').textContent = n.name + ' · ' + distance + ' m';
  }
}
function selectSlot(i) {
  S.selected = i;
  if (equipPending) {
    S.hotbar[i] = equipPending;
    equipPending = null;
    toast('Objet équipé.');
  }
  selectedItem = S.hotbar[i];
  sfx('click');
  updateHUD();
}
let mapImage = null;
function drawMap(canvas, large = false) {
  let g = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height;
  if (!mapImage) {
    let c = document.createElement('canvas');
    c.width = 80;
    c.height = 80;
    let m = c.getContext('2d');
    for (let x = 0; x < 80; x++)
      for (let z = 0; z < 80; z++) {
        let ht = world.heights[x + z * 80];
        m.fillStyle =
          ht === 1
            ? '#5d939d'
            : z < 22 && x < 54
              ? '#d0d8c5'
              : x > 55
                ? '#c3ac75'
                : x < 23
                  ? '#577a48'
                  : '#7c925c';
        m.fillRect(x, z, 1, 1);
      }
    m.fillStyle = '#bca57a';
    m.fillRect(33, 17, 4, 49);
    m.fillRect(22, 43, 26, 3);
    m.fillStyle = '#915f47';
    m.fillRect(24, 37, 7, 7);
    m.fillRect(38, 49, 7, 7);
    m.fillRect(23, 55, 7, 6);
    m.fillStyle = '#6d6c60';
    m.fillRect(10, 18, 11, 12);
    m.fillStyle = '#ad9670';
    m.fillRect(59, 20, 13, 12);
    mapImage = c;
  }
  g.imageSmoothingEnabled = false;
  g.drawImage(mapImage, 0, 0, w, h);
  if (S.bridge) {
    g.fillStyle = '#c3a274';
    g.fillRect((46 / 80) * w, (40 / 80) * h, (10 / 80) * w, (3 / 80) * h);
  }
  let colors = [
    '#a2d379',
    '#e0ad7b',
    '#7cbbcf',
    '#ddbd79',
    '#b4a0d3',
    '#d4e2d2',
  ];
  NPCS.forEach((n, i) => {
    g.fillStyle = colors[i];
    let x = ((n.x + 0.5) / 80) * w,
      z = ((n.z + 0.5) / 80) * h;
    g.fillRect(x - 3, z - 3, 6, 6);
    if (large) {
      g.font = 'bold 12px Arial';
      g.fillStyle = '#263b30';
      g.fillText(n.name, x + 7, z + 4);
    }
  });
  for (const s of millSites) {
    let x = (s.x / 80) * w,
      z = (s.z / 80) * h;
    g.fillStyle = '#ffcf77';
    g.fillRect(x - 2, z - 2, 4, 4);
    if (large) {
      g.font = 'bold 12px Arial';
      g.fillStyle = '#2a342d';
      g.fillText(
        { zoe: 'Zoé', wheel: 'Roue', gate: 'Vanne' }[s.id],
        x + 4,
        z + 10,
      );
    }
  }
  g.save();
  g.translate((player.pos.x / 80) * w, (player.pos.z / 80) * h);
  g.rotate(-player.yaw);
  g.fillStyle = '#fff5d4';
  g.strokeStyle = '#2b4834';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -7);
  g.lineTo(5, 5);
  g.lineTo(0, 2);
  g.lineTo(-5, 5);
  g.closePath();
  g.stroke();
  g.fill();
  g.restore();
  g.fillStyle = '#fff4d4';
  g.font = 'bold 11px Arial';
  g.fillText('N ↑', 7, 15);
}
function inventory(tab = 'craft') {
  activeTab = tab;
  let items = Object.entries(S.inv).filter(([k, n]) => ITEMS[k] && n > 0);
  modal(
    'L’atelier de l’explorateur',
    'INVENTAIRE & FABRICATION',
    `<div class="tabs"><button id="craftTab" class="${tab === 'craft' ? 'active' : ''}">Fabrication</button><button id="buildTab" class="${tab === 'build' ? 'active' : ''}">Sac & équipement</button><button id="tradeTab" class="${tab === 'trade' ? 'active' : ''}">Marché du village</button></div>${
      tab === 'craft'
        ? `<div class="two-col"><div><h3>Tes matériaux</h3><div class="inventory">${items.map(([k, n]) => `<div class="inv-item">${itemIcon(k)}<small>${itemName(k)}</small><b>${n}</b></div>`).join('')}</div><p class="muted">La meilleure pioche fabriquée s’équipe automatiquement. Les outils ne se cassent pas.</p></div><div><h3>Le livre des recettes</h3>${RECIPES.map((r, i) => `<div class="recipe"><div class="name">${ITEMS[r.out].icon} ${r.n} × ${itemName(r.out)}</div><p>${r.desc}</p><div class="cost">${costHTML(r.cost)}${r.furnace && !S.inv.furnace && !Object.values(S.edits).includes(13) ? '<br><span class="missing">Un four est nécessaire</span>' : ''}</div><button class="secondary" data-craft="${i}" ${canCraft(r) ? '' : 'disabled'} style="margin-top:10px">Fabriquer</button></div>`).join('')}</div></div>`
        : tab === 'build'
          ? `<p>Clique sur un objet pour l’équiper dans l’emplacement actuellement sélectionné (${S.selected + 1}). La nourriture peut être mangée directement.</p><div class="inventory">${items.map(([k, n]) => `<button class="inv-item" data-equip="${k}">${itemIcon(k)}<small>${itemName(k)}</small><b>${n}</b></button>`).join('')}</div><div id="itemAction" style="margin-top:18px"></div>`
          : `<p>Les émeraudes gagnées en explorant et en aidant les gardiens servent aux échanges. Aucune monnaie réelle.</p><div class="banner">Le marché est accessible quand tu es près du village.</div><div class="two-col">${[
              { cost: { emerald: 1 }, gain: { apple: 3 } },
              { cost: { emerald: 1 }, gain: { seed: 6 } },
              { cost: { wheat: 3 }, gain: { emerald: 1 } },
              { cost: { wool: 2 }, gain: { emerald: 2 } },
              { cost: { emerald: 2 }, gain: { coal: 4 } },
              { cost: { emerald: 2 }, gain: { wood: 6 } },
            ]
              .map(
                (t, i) =>
                  `<div class="recipe"><h3>${Object.entries(t.gain)
                    .map(
                      ([k, n]) => ITEMS[k].icon + ' ' + n + ' ' + itemName(k),
                    )
                    .join(
                      '',
                    )}</h3><div class="cost">${costHTML(t.cost)}</div><button class="secondary" data-trade="${i}" ${has(t.cost) && player.pos.distanceTo(new THREE.Vector3(35, 5, 45)) < 22 ? '' : 'disabled'}>Échanger</button></div>`,
              )
              .join('')}</div>`
    }`,
  );
  $('craftTab').onclick = () => inventory('craft');
  $('buildTab').onclick = () => inventory('build');
  $('tradeTab').onclick = () => inventory('trade');
  document.querySelectorAll('[data-craft]').forEach(
    (b) =>
      (b.onclick = () => {
        let r = RECIPES[+b.dataset.craft];
        if (craft(r)) {
          sfx('success');
          toast(r.n + ' × ' + itemName(r.out) + ' fabriqué !');
          inventory('craft');
        }
      }),
  );
  document.querySelectorAll('[data-equip]').forEach(
    (b) =>
      (b.onclick = () => {
        let k = b.dataset.equip;
        $('itemAction').innerHTML =
          `<div class="row"><b>${itemName(k)}</b>${['bread', 'apple'].includes(k) ? '<button class="primary" id="eatItem">Manger</button>' : ''}<button class="secondary" id="equipItem">Équiper dans la case ${S.selected + 1}</button></div>`;
        $('equipItem').onclick = () => {
          S.hotbar[S.selected] = k;
          saveGame(false);
          closeModal();
          updateHUD();
          toast(itemName(k) + ' équipé.');
        };
        if ($('eatItem'))
          $('eatItem').onclick = () => {
            eat(k);
            inventory('build');
          };
      }),
  );
  let trades = [
    { cost: { emerald: 1 }, gain: { apple: 3 } },
    { cost: { emerald: 1 }, gain: { seed: 6 } },
    { cost: { wheat: 3 }, gain: { emerald: 1 } },
    { cost: { wool: 2 }, gain: { emerald: 2 } },
    { cost: { emerald: 2 }, gain: { coal: 4 } },
    { cost: { emerald: 2 }, gain: { wood: 6 } },
  ];
  document.querySelectorAll('[data-trade]').forEach(
    (b) =>
      (b.onclick = () => {
        let t = trades[+b.dataset.trade];
        if (
          player.pos.distanceTo(new THREE.Vector3(35, 5, 45)) < 22 &&
          spend(t.cost)
        ) {
          give(t.gain);
          sfx('success');
          saveGame(false);
          inventory('trade');
        }
      }),
  );
}
function quests() {
  modal(
    'Les cinq gardiens',
    'JOURNAL DE QUÊTES',
    `<article class="quest-card"><h3>Le moulin des deux rives</h3><b>${millHeading()}</b><p>${millClues[S.mill.stage]}</p></article><div class="banner">${NPCS.slice(0, 5).filter((n) => questProgress(n).done).length} / 5 sceaux réunis. Chaque mission associe une action dans le monde à une épreuve de réflexion.</div>${NPCS.map(
      (n) => {
        let p = questProgress(n);
        return `<div class="quest-card ${p.done ? 'complete' : ''}"><span class="tag">${p.done ? 'ACCOMPLIE' : p.started ? 'EN COURS' : 'À DÉCOUVRIR'} · ${n.name}</span><h3>${n.quest}</h3><p>${n.goal}</p>${
          n.id !== 'atlas'
            ? `<div class="requirements">${n.requires.map((k) => `<span class="${ownsItem(k) ? 'ok' : 'no'}">${ownsItem(k) ? '✓' : '○'} ${itemName(k)}</span>`).join('')}${Object.entries(
                n.req,
              )
                .map(
                  ([k, v]) =>
                    `<span class="${(S.inv[k] || 0) >= v ? 'ok' : 'no'}">${(S.inv[k] || 0) >= v ? '✓' : '○'} ${itemName(k)} : ${S.inv[k] || 0} / ${v}</span>`,
                )
                .join(
                  '',
                )}<span>Épreuves : ${p.stage} / ${n.puzzles.length}</span></div>`
            : ''
        }<button class="secondary" data-track="${n.id}">Suivre ${n.name} sur la carte</button></div>`;
      },
    ).join('')}`,
  );
  document.querySelectorAll('[data-track]').forEach(
    (b) =>
      (b.onclick = () => {
        S.millDismissed = true;
        S.tracked = b.dataset.track;
        closeModal();
        updateHUD();
        toast(
          'La direction du gardien est indiquée dans le monde et sur la carte.',
        );
      }),
  );
}
function showMap() {
  modal(
    'L’atlas d’Astéria',
    'EXPLORER & S’ORIENTER',
    `<canvas id="largeMap" class="map-large" width="640" height="640"></canvas><div class="map-legend"><span>◆ Gardiens</span><span>▲ Ta position</span><span>Nord : montagnes</span><span>Est : désert</span><span>Ouest : forêt et mine</span></div><p class="muted">Le chemin du village mène au nord à l’observatoire. La mine se trouve à l’ouest du portail. Le pont de Nora traverse la rivière à l’est.</p>`,
  );
  drawMap($('largeMap'), true);
}
function portrait(n) {
  return `<div class="portrait"><div class="pixel-person" style="--coat:#${n.coat.toString(16).padStart(6, '0')};--hat:#${n.hat.toString(16).padStart(6, '0')}"><div class="head"></div><div class="body"></div><div class="legs"></div></div></div>`;
}
function talk(n) {
  S.millDismissed = true;
  S.tracked = n.id;
  let p = questProgress(n),
    ready = questReady(n);
  if (n.id === 'atlas') {
    modal(
      'Atlas, gardien de pierre',
      'LE CŒUR D’ASTÉRIA',
      `<div class="dialogue">${portrait(n)}<div><div class="npc-role">${n.role}</div><p class="speech">${S.won ? 'Tu as réuni les savoirs. Ce monde est maintenant le tien : continue à bâtir, explorer et apprendre.' : n.intro}</p><div class="requirements">${NPCS.slice(
        0,
        5,
      )
        .map(
          (q) =>
            `<span class="${questProgress(q).done ? 'ok' : 'no'}">${questProgress(q).done ? '◆' : '◇'} Sceau ${q.crystal} — ${q.name}</span>`,
        )
        .join(
          '',
        )}</div><div class="row">${ready && !S.won ? '<button class="primary" id="awaken">Réveiller le portail</button>' : ''}<button class="secondary" id="atlasBook">Les défis du savoir</button></div></div></div>`,
    );
    if ($('awaken')) $('awaken').onclick = win;
    $('atlasBook').onclick = () => knowledgeQuestion();
    return;
  }
  modal(
    n.name + ', ' + n.role.split(' & ')[0].toLowerCase(),
    n.quest.toUpperCase(),
    `<div class="dialogue">${portrait(n)}<div><div class="npc-role">${n.role}</div><p class="speech">${p.done ? 'Ton aide a tout changé. Le savoir se cultive : veux-tu découvrir une nouvelle question ?' : p.started ? 'Tu as déjà commencé l’épreuve. Reprenons là où tu en étais.' : n.intro}</p>${
      !p.done
        ? `<p>${n.goal}</p><div class="requirements">${n.requires.map((k) => `<span class="${ownsItem(k) ? 'ok' : 'no'}">${ownsItem(k) ? '✓' : '○'} ${itemName(k)}</span>`).join('')}${Object.entries(
            n.req,
          )
            .map(
              ([k, v]) =>
                `<span class="${(S.inv[k] || 0) >= v ? 'ok' : 'no'}">${itemName(k)} : ${S.inv[k] || 0} / ${v}</span>`,
            )
            .join('')}</div>`
        : ''
    }<div class="row">${p.done ? '<button class="primary" id="npcLearn">Une nouvelle découverte</button>' : p.started || ready ? `<button class="primary" id="beginTrial">${p.started ? 'Continuer l’épreuve' : 'Livrer et commencer l’épreuve'}</button>` : '<button class="primary" id="acceptQuest">Je m’en occupe</button>'}<button class="secondary" id="readDialogue">🔊 Écouter</button></div>${!ready && !p.started && !p.done ? `<p class="muted">${n.id === 'lila' ? 'Les six petites parcelles sont juste à côté. Approche-toi et appuie sur E.' : n.id === 'borin' ? 'La mine est à l’ouest du village. Une pioche en bois suffit pour le charbon et la pierre ; le fer demande une pioche en pierre.' : n.id === 'nora' ? 'Une bûche donne 4 planches. La recette est dans l’atelier (I).' : n.id === 'soren' ? 'Trois coffres t’attendent dans la cour des ruines, près des colonnes.' : 'Les cristaux bleutés sont au fond de la caverne. Il faut une pioche en fer pour les extraire.'}</p>` : ''}</div></div>`,
  );
  $('readDialogue').onclick = () => speak(n.intro + ' ' + n.goal);
  if ($('acceptQuest'))
    $('acceptQuest').onclick = () => {
      closeModal();
      toast('Quête suivie : ' + n.quest);
    };
  if ($('npcLearn'))
    $('npcLearn').onclick = () =>
      knowledgeQuestion(
        ['nature', 'science', 'monde', 'histoire', 'espace'][NPCS.indexOf(n)],
      );
  if ($('beginTrial'))
    $('beginTrial').onclick = () => {
      if (!p.started) {
        if (!questReady(n) || !spend(n.req)) return;
        S.quests[n.id] = { started: true, stage: 0, done: false };
        if (n.id === 'nora') {
          S.bridge = true;
          world.bridge();
          toast('Le pont est reconstruit ! Le désert est accessible.');
        }
        saveGame(false);
      }
      beginQuestChallenge(n);
    };
}
function beginQuestChallenge(n) {
  let p = questProgress(n);
  if (p.stage >= n.puzzles.length) {
    finishQuest(n);
    return;
  }
  let id = n.puzzles[p.stage];
  showChallenge(
    { ...difficultyChallenge(id), practiceId: 'p:' + id },
    () => {
      if (!S.journal.includes('p:' + id)) S.journal.push('p:' + id);
      S.notes ??= {};
      S.notes['p:' + id] = difficultyChallenge(id).explain;
      S.quests[n.id].stage++;
      S.xp += 30;
      saveGame(false);
      beginQuestChallenge(n);
    },
    `${n.name} · ÉPREUVE ${p.stage + 1} / ${n.puzzles.length}`,
  );
}
function finishQuest(n) {
  if (questProgress(n).done) return;
  S.quests[n.id].done = true;
  give(n.reward);
  S.xp += 100;
  saveGame(false);
  sfx('success');
  modal(
    'Le sceau ' + n.crystal,
    'UNE NOUVELLE ALLIANCE',
    `<div style="text-align:center;padding:15px"><div style="font-size:70px;color:#8ea975">◆</div><h3>${n.name} te confie son sceau.</h3><p>Tu as exploré, construit et raisonné. Tes découvertes sont conservées dans le carnet.</p><div class="banner">${Object.entries(
      n.reward,
    )
      .map(([k, v]) => ITEMS[k].icon + ' ' + v + ' ' + itemName(k))
      .join(
        ' · ',
      )} · +100 expérience</div><button class="primary" id="questContinue">Continuer l’aventure</button></div>`,
  );
  $('questContinue').onclick = () => {
    let next = NPCS.find((q) => !questProgress(q).done && q.id !== 'atlas');
    S.tracked = next ? next.id : 'atlas';
    closeModal();
    updateHUD();
  };
}
function showChallenge(c, onNext, label = 'LE DÉFI DU SAVOIR') {
  let token = modal(
    c.title,
    label,
    `<p class="question-scene">${c.story}</p><div id="puzzle"></div><div id="feedback" aria-live="polite"></div>${footerButtons()}`,
  );
  let solved = false,
    attempts = 0,
    hints = 0;
  currentChallenge = c;
  $('readQuestion').onclick = () =>
    speak(c.story + (c.options ? '. ' + c.options.join('. ') : ''));
  $('hintButton').onclick = () => {
    $('feedback').className = 'feedback';
    $('feedback').textContent =
      (++hints > 1 && c.hint2) ||
      c.hint ||
      'Prends ton temps. Observe les informations utiles et essaie une étape à la fois.';
  };
  function success() {
    if (solved || modalToken !== token) return;
    solved = true;
    if (c.practiceId) recordPractice(c.practiceId, true);
    $('feedback').className = 'feedback';
    $('feedback').textContent = 'Bien raisonné ! ' + c.explain;
    $('nextChallenge').classList.remove('hidden');
    $('hintButton').classList.add('hidden');
    $('readQuestion').onclick = () => speak(c.explain);
    sfx('success');
    $('nextChallenge').onclick = () => onNext(attempts);
  }
  function wrong(msg) {
    attempts++;
    if (c.practiceId) recordPractice(c.practiceId, false);
    sfx('wrong');
    $('feedback').className = 'feedback';
    $('feedback').textContent = msg || 'Pas encore. ' + c.hint;
    if (attempts === 2 && c.hint2) $('feedback').textContent = c.hint2;
    if (attempts >= 3) $('feedback').textContent = c.explain;
  }
  if (c.type === 'choice') {
    $('puzzle').innerHTML =
      '<div class="answer-grid">' +
      shuffle(c.options.map((v, i) => ({ v, i })))
        .map(({ v, i }) => `<button data-choice="${i}">${v}</button>`)
        .join('') +
      '</div>';
    document.querySelectorAll('[data-choice]').forEach(
      (b) =>
        (b.onclick = () => {
          if (solved) return;
          if (+b.dataset.choice === c.answer) {
            b.classList.add('correct');
            document
              .querySelectorAll('[data-choice]')
              .forEach((b) => (b.disabled = true));
            success();
          } else {
            b.classList.add('wrong');
            b.disabled = true;
            wrong();
          }
        }),
    );
  }
  if (c.type === 'number') {
    $('puzzle').innerHTML =
      '<form id="numberForm" class="number-answer"><input type="number" id="numberInput" min="0" max="9999" step="1" aria-label="Ta réponse" required><button class="primary" type="submit">Vérifier</button></form>';
    $('numberForm').onsubmit = (e) => {
      e.preventDefault();
      if (solved) return;
      if (
        $('numberInput').value !== '' &&
        Number($('numberInput').value) === c.answer
      ) {
        success();
        $('numberInput').disabled = true;
      } else
        wrong(
          attempts >= 1
            ? c.hint2 ||
                'Reprends les données une par une et sépare les étapes.'
            : c.hint,
        );
    };
  }
  if (c.type === 'order') {
    let picked = [],
      choices = shuffle(c.items);
    $('puzzle').innerHTML =
      '<div class="order-line" id="orderLine">Touche les éléments dans le bon ordre.</div><div class="order-choices">' +
      choices
        .map((v, i) => `<button data-order="${i}">${v}</button>`)
        .join('') +
      '</div><button class="secondary" id="resetOrder">Recommencer l’ordre</button>';
    function reset() {
      picked = [];
      $('orderLine').textContent = 'Touche les éléments dans le bon ordre.';
      document
        .querySelectorAll('[data-order]')
        .forEach((b) => (b.disabled = false));
    }
    $('resetOrder').onclick = () => {
      if (!solved) reset();
    };
    document.querySelectorAll('[data-order]').forEach(
      (b) =>
        (b.onclick = () => {
          if (solved) return;
          let v = choices[+b.dataset.order];
          picked.push(v);
          b.disabled = true;
          $('orderLine').textContent = picked.join(' → ');
          if (picked.length === c.answer.length) {
            if (picked.every((v, i) => v === c.answer[i])) success();
            else {
              wrong();
              setTimeout(() => {
                if (modalToken === token && !solved) reset();
              }, 900);
            }
          }
        }),
    );
  }
  if (c.type === 'circuit') {
    let lights = Array(9).fill(true);
    function toggle(i) {
      let x = i % 3,
        y = Math.floor(i / 3);
      for (let [dx, dy] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        let a = x + dx,
          b = y + dy;
        if (a >= 0 && a < 3 && b >= 0 && b < 3)
          lights[a + b * 3] = !lights[a + b * 3];
      }
    }
    (S.settings.difficulty === 3 ? [0, 2, 4, 6, 8] : [0, 4, 8]).forEach(toggle);
    function draw() {
      if (modalToken !== token) return;
      $('puzzle').innerHTML =
        '<div class="circuit">' +
        lights
          .map(
            (v, i) =>
              `<button class="${v ? 'on' : ''}" data-light="${i}" aria-label="Lampe ${i + 1} ${v ? 'allumée' : 'éteinte'}">✦</button>`,
          )
          .join('') +
        '</div><p class="muted" style="text-align:center">Objectif : les 9 lampes allumées. Aucun nombre de coups imposé.</p>';
      document.querySelectorAll('[data-light]').forEach(
        (b) =>
          (b.onclick = () => {
            if (solved) return;
            toggle(+b.dataset.light);
            sfx('click');
            draw();
            if (lights.every(Boolean)) success();
          }),
      );
    }
    draw();
    $('hintButton').onclick = () => {
      let original = [...lights],
        solution = [];
      for (let mask = 0; mask < 512; mask++) {
        lights = [...original];
        let candidate = [];
        for (let i = 0; i < 9; i++)
          if (mask & (1 << i)) {
            toggle(i);
            candidate.push(i);
          }
        if (lights.every(Boolean)) {
          solution = candidate;
          break;
        }
      }
      lights = original;
      $('feedback').className = 'feedback';
      $('feedback').textContent = solution.length
        ? `Un coup utile : touche la lampe de la ligne ${Math.floor(solution[0] / 3) + 1}, colonne ${(solution[0] % 3) + 1}. Tu peux demander un autre indice ensuite.`
        : 'Les lampes sont déjà allumées.';
    };
  }
  if (c.type === 'route') {
    let size = 9,
      start = [4, 4],
      answer = [7, 3];
    $('puzzle').innerHTML =
      '<div style="text-align:center;font-size:12px">NORD ↑</div><div style="display:grid;grid-template-columns:repeat(9,1fr);gap:3px;max-width:390px;margin:10px auto">' +
      Array.from(
        { length: 81 },
        (_, i) =>
          `<button data-route="${i}" aria-label="Case colonne ${(i % 9) + 1}, ligne ${Math.floor(i / 9) + 1}" style="height:35px;background:${i === 40 ? '#a1bd83' : '#dce4ce'};color:#47623d;border:1px solid #bfcdaf">${i === 40 ? '⚑' : '·'}</button>`,
      ).join('') +
      '</div><p class="muted" style="text-align:center">OUEST ← · → EST · SUD ↓</p>';
    document.querySelectorAll('[data-route]').forEach(
      (b) =>
        (b.onclick = () => {
          if (solved) return;
          let i = +b.dataset.route;
          if (i % 9 === answer[0] && Math.floor(i / 9) === answer[1]) {
            b.style.background = '#a6c581';
            b.textContent = '✓';
            success();
          } else {
            b.style.background = '#e1cbb5';
            wrong();
          }
        }),
    );
  }
  if (c.type === 'memory') {
    let symbols = ['☀', '🌙', '◆', '✦'],
      len = S.settings.difficulty + 3,
      sequence = Array.from({ length: len }, () =>
        Math.floor(Math.random() * 4),
      ),
      at = 0,
      ready = false;
    $('puzzle').innerHTML =
      '<p id="memoryStatus">Observe la suite, puis reproduis-la. Tu peux la revoir autant de fois que tu veux.</p><div class="memory-grid">' +
      symbols
        .map(
          (s, i) =>
            `<button data-mem="${i}" aria-label="${['Soleil', 'Lune', 'Cristal', 'Étoile'][i]}">${s}</button>`,
        )
        .join('') +
      '</div><button class="secondary" id="replayMemory">Voir la suite</button>';
    let bs = [...document.querySelectorAll('[data-mem]')];
    function play() {
      if (solved) return;
      ready = false;
      at = 0;
      $('replayMemory').disabled = true;
      $('memoryStatus').textContent = 'Observe…';
      sequence.forEach((n, i) => {
        setTimeout(
          () => {
            if (modalToken !== token) return;
            bs[n].classList.add('lit');
            sfx('click');
          },
          400 + i * 850,
        );
        setTimeout(
          () => {
            if (modalToken === token) bs[n].classList.remove('lit');
          },
          950 + i * 850,
        );
      });
      setTimeout(
        () => {
          if (modalToken !== token) return;
          ready = true;
          $('replayMemory').disabled = false;
          $('replayMemory').textContent = 'Revoir la suite';
          $('memoryStatus').textContent =
            'À toi : ' + len + ' symboles à retrouver.';
        },
        500 + len * 850,
      );
    }
    $('replayMemory').onclick = play;
    bs.forEach(
      (b, i) =>
        (b.onclick = () => {
          if (!ready || solved) return;
          if (i === sequence[at]) {
            at++;
            sfx('click');
            $('memoryStatus').textContent = at + ' / ' + len;
            if (at === len) {
              ready = false;
              success();
            }
          } else {
            ready = false;
            wrong(
              'La suite est différente. Revois-la et essaie de regrouper les symboles par deux.',
            );
            $('memoryStatus').textContent = 'Rejoue la suite pour réessayer.';
          }
        }),
    );
  }
}
function knowledgeQuestion(category = null) {
  let available = KNOWLEDGE.map((q, i) => ({ q, i })).filter(
    ({ q, i }) => (!category || q[0] === category) && !S.learned.includes(i),
  );
  if (!available.length)
    available = KNOWLEDGE.map((q, i) => ({ q, i })).filter(
      ({ q }) => !category || q[0] === category,
    );
  let level = Math.max(1, Math.min(3, S.level)),
    closest = available.filter(({ q }) => Math.abs(q[1] - level) <= 0.5);
  let due = KNOWLEDGE.map((q, i) => ({ q, i }))
    .filter(
      ({ q, i }) =>
        (!category || category === q[0]) &&
        S.practice['k:' + i]?.next <= Date.now(),
    )
    .sort((a, b) => S.practice['k:' + a.i].next - S.practice['k:' + b.i].next);
  let pool = due.length ? [due[0]] : closest.length ? closest : available,
    { q, i } = pool[Math.floor(Math.random() * pool.length)];
  let c = {
    practiceId: 'k:' + i,
    type: 'choice',
    title: q[2],
    story:
      'Observe les trois propositions. Une seule répond le mieux à la question.',
    options: q[3],
    answer: q[4],
    hint: 'Élimine les propositions qui contredisent les observations. L’explication sera ajoutée à ton carnet.',
    explain: q[5],
  };
  showChallenge(
    c,
    (mistakes) => {
      let first = !S.learned.includes(i);
      if (first) {
        S.learned.push(i);
        S.journal.push('k:' + i);
        S.xp += 20;
        give({ emerald: 1 });
        S.streak = mistakes ? 0 : S.streak + 1;
        if (mistakes >= 2) S.level = Math.max(1, S.level - 1);
        if (S.streak > 0 && S.streak % 3 === 0 && S.settings.difficulty > 1)
          S.level = Math.min(3, S.level + 1);
      }
      saveGame(false);
      modal(
        'Une nouvelle découverte',
        'LE SAVOIR GRANDIT',
        `<p>${q[5]}</p><div class="banner">${first ? '+20 expérience · +1 émeraude' : 'Révision enregistrée'} · ${S.learned.length} / ${KNOWLEDGE.length} découvertes de l’encyclopédie</div><div class="row"><button class="primary" id="anotherQuestion">Un autre défi</button><button class="secondary" id="backWorld">Retour au monde</button></div>`,
      );
      $('anotherQuestion').onclick = () => knowledgeQuestion(category);
      $('backWorld').onclick = closeModal;
    },
    'CULTURE GÉNÉRALE · NIVEAU ' + q[1],
  );
  $('readQuestion').onclick = () => speak(q[2] + '. ' + q[3].join('. '));
}
function escapeHTML(t) {
  return String(t).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
}
function notebook() {
  let entries = S.journal
    .map((key) => {
      if (typeof key !== 'string') return null;
      let [type, id] = key.split(':');
      if (type === 'field') {
        const e = FIELD_GUIDE.find((e) => e.id === id);
        return e ? { title: e.name, text: e.story } : null;
      }
      if (type === 'p' && CHALLENGES[id])
        return {
          title: CHALLENGES[id].title,
          text: S.notes?.[key] || CHALLENGES[id].explain,
        };
      if (type === 'k' && KNOWLEDGE[+id])
        return { title: KNOWLEDGE[+id][2], text: KNOWLEDGE[+id][5] };
      return null;
    })
    .filter(Boolean);
  modal(
    'Le carnet des découvertes',
    'OBSERVER · COMPRENDRE · RETENIR',
    `<div class="row spread"><p>${entries.length} découvertes conservées.</p><button class="primary" id="learnMore">Un nouveau défi</button></div><div class="banner"><b>Le sentier des naturalistes</b><p>${FIELD_GUIDE.map((e) => (S.journal.includes('field:' + e.id) ? '✓ ' + e.name : 'À explorer : ' + e.place)).join('<br>')}</p></div>${entries.length ? entries.map((e) => `<article class="book-entry"><h3>${e.title}</h3><p>${escapeHTML(e.text)}</p></article>`).join('') : '<p>Les explications des épreuves et des défis apparaîtront ici. Elles restent disponibles après avoir quitté le jeu.</p>'}`,
  );
  $('learnMore').onclick = () => knowledgeQuestion();
}
function chestUI(t) {
  let key = world.index(t.x, t.y, t.z);
  S.chests[key] ??= {};
  let content = S.chests[key];
  modal(
    'Ton coffre',
    'RANGER & CONSERVER',
    `<div class="two-col"><div><h3>Dans ton sac</h3><p class="muted">Clique pour déposer toute la pile.</p><div class="inventory">${Object.entries(
      S.inv,
    )
      .filter(([k, n]) => n > 0 && ITEMS[k])
      .map(
        ([k, n]) =>
          `<button class="inv-item" data-deposit="${k}">${itemIcon(k)}<small>${itemName(k)}</small><b>${n}</b></button>`,
      )
      .join(
        '',
      )}</div></div><div><h3>Dans le coffre</h3><p class="muted">Clique pour récupérer toute la pile.</p><div class="inventory">${Object.entries(
      content,
    )
      .filter(([k, n]) => n > 0 && ITEMS[k])
      .map(
        ([k, n]) =>
          `<button class="inv-item" data-withdraw="${k}">${itemIcon(k)}<small>${itemName(k)}</small><b>${n}</b></button>`,
      )
      .join('')}</div></div></div>`,
  );
  document.querySelectorAll('[data-deposit]').forEach(
    (b) =>
      (b.onclick = () => {
        let k = b.dataset.deposit;
        content[k] = (content[k] || 0) + (S.inv[k] || 0);
        S.inv[k] = 0;
        updateTool();
        saveGame(false);
        chestUI(t);
      }),
  );
  document.querySelectorAll('[data-withdraw]').forEach(
    (b) =>
      (b.onclick = () => {
        let k = b.dataset.withdraw;
        give({ [k]: content[k] });
        delete content[k];
        saveGame(false);
        chestUI(t);
      }),
  );
}
function interact() {
  if (paused || !playing) return;
  let o = nearObject;
  if (!o) {
    if (target?.id === 23) {
      S.time = Math.floor(S.time / 720) * 720 + 780;
      S.health = 100;
      S.energy = 100;
      saveGame(false);
      toast('Une nuit réparatrice. Le soleil se lève sur Astéria.');
      sfx('success');
      updateHUD();
      return;
    }
    if (target && [12, 13].includes(target.id)) {
      inventory();
      return;
    }
    if (target?.id === 14) {
      chestUI(target);
      return;
    }
    toast('Approche-toi d’un habitant, d’une culture ou d’un coffre.');
    return;
  }
  if (o.kind === 'field') {
    observe(o.entry);
    return;
  }
  if (o.kind === 'mill') {
    if (o.id === 'wheel' && S.mill.stage === 3) dispatchCargo();
    else useMill(o.id);
    return;
  }
  if (o.kind === 'npc') {
    talk(o.npc);
    return;
  }
  if (o.kind === 'treasure') {
    if (S.opened.includes(o.id)) return;
    S.opened.push(o.id);
    give(o.loot);
    S.xp += 25;
    o.group.visible = false;
    sfx('success');
    toast(
      'Coffre découvert : ' +
        Object.entries(o.loot)
          .map(([k, n]) => n + ' ' + itemName(k))
          .join(', '),
    );
    saveGame(false);
    updateHUD();
    return;
  }
  if (o.kind === 'crop') {
    let crop = S.crops[o.id];
    if (!crop) {
      if (!S.inv.hoe) {
        toast('Fabrique une houe dans l’atelier pour préparer la terre.');
        return;
      }
      if (!S.inv.seed) {
        toast(
          'Il te faut des graines. Le marché en propose contre une émeraude.',
        );
        return;
      }
      S.inv.seed--;
      S.crops[o.id] = { at: S.time, watered: S.mill.stage === 3 };
      if (S.mill.stage === 3) toast('Graine plantée et arrosée par le moulin.');
      else toast('Graine plantée. Appuie encore sur E pour l’arroser.');
    } else if (S.time - crop.at >= (crop.watered ? 35 : 100)) {
      give({ wheat: 1, seed: 2 });
      S.stats.harvest++;
      S.xp += 8;
      delete S.crops[o.id];
      toast('+1 blé et +2 graines. Tu peux replanter.');
      sfx('harvest');
    } else if (!crop.watered) {
      crop.watered = true;
      toast(
        'Culture arrosée avec l’eau du puits. Elle sera mûre en 35 secondes après la plantation.',
      );
    } else
      toast(
        'Le blé grandit : encore ' +
          Math.max(1, Math.ceil(35 - (S.time - crop.at))) +
          ' secondes.',
      );
    refreshCrops();
    saveGame(false);
    return;
  }
  if (o.kind === 'animal') {
    if (o.type === 'slime') {
      o.angle += Math.PI;
      walkAnimal(o, 0.1, 3);
      o.cooldown = 5;
      toast('Le lutin mousse s’éloigne en bondissant.');
      sfx('place');
      return;
    }
    let food =
      o.type === 'chicken' ? 'seed' : o.type === 'sheep' ? 'wheat' : 'apple';
    if (o.cooldown > 0) {
      toast('Ton nouvel ami te suit un moment.');
      return;
    }
    if (!S.inv[food]) {
      toast(
        'Approche avec ' +
          itemName(food).toLowerCase() +
          ' dans ton sac pour le nourrir.',
      );
      return;
    }
    S.inv[food]--;
    o.friendly = true;
    o.cooldown = 40;
    if (o.type === 'sheep') {
      give({ wool: 1 });
      toast('Le mouton te confie une touffe de laine et te suit.');
    } else toast('Cet animal te fait confiance et te suit.');
    S.xp += 5;
    saveGame(false);
    return;
  }
  if (o.kind === 'portal') {
    if (S.won)
      modal(
        'Un monde ouvert',
        'LE PORTAIL EST RÉVEILLÉ',
        `<p>Les cinq savoirs sont réunis. Tu peux continuer les défis, construire librement et enrichir ton village.</p><div class="row"><button class="primary" id="portalBuild">Ouvrir le mode construction</button><button class="secondary" id="portalLearn">Un défi de plus</button></div>`,
      );
    else {
      talk(NPCS[5]);
      return;
    }
    if ($('portalBuild')) $('portalBuild').onclick = creativeMode;
    if ($('portalLearn')) $('portalLearn').onclick = () => knowledgeQuestion();
  }
}
function win() {
  if (!NPCS.slice(0, 5).every((n) => questProgress(n).done)) return;
  S.won = true;
  S.quests.atlas = { started: true, stage: 1, done: true };
  S.xp += 250;
  give({ emerald: 15 });
  saveGame(false);
  sfx('success');
  modal(
    'Tu as réveillé Astéria.',
    'LES GARDIENS TE REMERCIENT',
    `<div style="text-align:center"><div style="font-size:65px;color:#9b8eb4">✦</div><h3>La curiosité est ta plus grande force.</h3><p>Tu as cultivé, fabriqué, exploré et résolu les épreuves des cinq gardiens. Le portail brille à nouveau.</p><div class="two-col"><div class="banner">${S.stats.mined} blocs récoltés<br>${S.stats.crafted} fabrications<br>${S.stats.placed} blocs posés</div><div class="banner">5 sceaux retrouvés<br>${S.journal.length} découvertes<br>+250 expérience</div></div><p>L’histoire principale est terminée. Le monde reste ouvert pour tes constructions et les ${KNOWLEDGE.length} défis de l’encyclopédie.</p><div class="row" style="justify-content:center"><button class="primary" id="winExplore">Continuer à explorer</button><button class="secondary" id="winBuild">Construire sans limite de matériaux</button></div></div>`,
  );
  $('winExplore').onclick = closeModal;
  $('winBuild').onclick = creativeMode;
}
function creativeMode() {
  if (profile.mode !== 'creative') {
    switchProfile(profile.slot, 'creative');
    return;
  }
  S.creative = true;
  give(Object.fromEntries(Object.keys(PLACE).map((k) => [k, 64])));
  give({ ironpick: 1 });
  S.hotbar = [
    'pickaxe',
    'plank',
    'stone',
    'brick',
    'glass',
    'wood',
    'leaf',
    'torch',
  ];
  saveGame(false);
  closeModal();
  updateHUD();
  toast(
    'Construction libre : blocs illimités et minage rapide. Les quêtes restent disponibles.',
  );
}
function guide() {
  modal(
    'Bienvenue, explorateur',
    'LES PREMIERS PAS',
    `<div class="two-col"><div><h3>Ta première aventure</h3><p>1. Avance vers le village et parle aux habitants avec <kbd>E</kbd>.<br>2. Maintiens le clic sur une bûche pour récolter du bois.<br>3. Ouvre <kbd>I</kbd>, fabrique des planches, des bâtons puis une pioche.<br>4. Extrais de la pierre, améliore tes outils et aide les cinq gardiens.</p><p>La meilleure pioche s’utilise automatiquement. Pour le fer, il faut une pioche en pierre. Pour les cristaux, une pioche en fer.</p><h3>Construis ton refuge</h3><p>Choisis un bloc avec les touches <kbd>1</kbd> à <kbd>8</kbd>, puis fais un clic droit ou appuie sur <kbd>B</kbd> pour le poser. Dans le sac, tu peux choisir les objets de la barre.</p></div><div><h3>Les commandes</h3><div class="requirements"><span><kbd>ZQSD</kbd> / <kbd>WASD</kbd> : déplacements</span><span><kbd>↑ ↓</kbd> : avancer / reculer · <kbd>← →</kbd> : tourner</span><span>Souris : regarder après un clic dans le monde</span><span>Glisser le doigt ou la souris : regarder sans capture</span><span><kbd>Espace</kbd> : sauter · <kbd>Maj</kbd> : courir</span><span><kbd>E</kbd> : parler, ouvrir, planter, arroser</span><span><kbd>I</kbd> : fabrication et sac · <kbd>J</kbd> : quêtes</span><span><kbd>M</kbd> : carte · <kbd>L</kbd> : carnet</span><span><kbd>Échap</kbd> : menu / libérer la souris</span></div><p>Sur écran tactile, utilise les boutons et glisse au centre pour regarder. Maintiens ⛏ pour miner.</p><p class="muted">La partie se sauvegarde sur cet appareil. Le menu permet aussi de l’exporter. Une erreur dans une épreuve ne retire aucun objet ni point.</p></div></div><button class="primary" id="guideClose">J’ai compris</button>`,
  );
  $('guideClose').onclick = closeModal;
}
function settings() {
  modal(
    'Une pause au village',
    'MENU & OPTIONS',
    `<div class="row"><button class="primary" id="resume">Reprendre</button><button class="secondary" id="guide">Comment jouer</button><button class="secondary" id="parentMenu">Espace parent</button><button class="secondary" id="mapMenu">Carte</button></div><div class="settings-row"><label for="difficulty">Difficulté des énigmes<small>Curieux : accompagné · Aventurier : plusieurs étapes · Expert : défis plus exigeants</small></label><select id="difficulty"><option value="1">Curieux</option><option value="2">Aventurier</option><option value="3">Expert</option></select></div><div class="settings-row"><label for="peaceful">Créatures nocturnes<small>En mode paisible, les lutins mousse ne te bousculent pas.</small></label><select id="peaceful"><option value="true">Paisible</option><option value="false">Petite aventure</option></select></div><div class="settings-row"><label for="quality">Qualité graphique<small>Allégée : sans ombres, pour les appareils moins puissants.</small></label><select id="quality"><option value="auto">Automatique</option><option value="medium">Moyenne</option><option value="high">Élevée</option><option value="low">Allégée</option></select></div><div class="settings-row"><label for="music">Musique du village</label><select id="music"><option value="true">Activée</option><option value="false">Désactivée</option></select></div><div class="settings-row"><label for="sound">Effets sonores</label><select id="sound"><option value="true">Activés</option><option value="false">Désactivés</option></select></div><div class="settings-row"><label for="sensitivity">Sensibilité de la souris</label><select id="sensitivity"><option value="0.6">Douce</option><option value="1">Normale</option><option value="1.5">Rapide</option></select></div><div class="row" style="margin-top:25px"><button class="secondary" id="exportSave">Exporter la partie</button><button class="secondary" id="importButton">Importer une partie</button><button class="secondary" id="respawn">Retour au village</button><button class="secondary" id="freeBuild">${profile.mode === 'creative' ? 'Reprendre mon aventure' : 'Ouvrir mon monde créatif'}</button><button class="secondary danger" id="newGame">Nouvelle partie</button></div><p class="muted">Progression, inventaire, cultures et constructions sont sauvegardés localement. L’export permet de les garder ou de les transférer vers un autre navigateur.</p>`,
  );
  for (let k of [
    'difficulty',
    'peaceful',
    'quality',
    'sound',
    'music',
    'sensitivity',
  ]) {
    $(k).value = String(S.settings[k]);
    $(k).onchange = () => {
      S.settings[k] = ['difficulty', 'sensitivity'].includes(k)
        ? Number($(k).value)
        : ['sound', 'music', 'peaceful'].includes(k)
          ? $(k).value === 'true'
          : $(k).value;
      if (k === 'difficulty') {
        S.level = S.settings.difficulty;
        S.streak = 0;
      }
      if (k === 'quality') {
        applyQuality();
        refreshTorches();
      }
      if (k === 'music') updateMusic(true);
      saveGame(false);
    };
  }
  $('parentMenu').onclick = parentPanel;
  $('resume').onclick = closeModal;
  $('guide').onclick = guide;
  $('mapMenu').onclick = showMap;
  $('respawn').onclick = () => {
    spawn();
    closeModal();
  };
  $('exportSave').onclick = exportSave;
  $('importButton').onclick = () => $('importSave').click();
  $('freeBuild').onclick = () =>
    switchProfile(
      profile.slot,
      profile.mode === 'creative' ? 'adventure' : 'creative',
    );
  $('newGame').onclick = () =>
    modalConfirm(
      'Recommencer cette aventure ?',
      'Cette action remplace la partie locale. Exporte-la d’abord si tu veux garder tes constructions.',
      () => {
        S = freshState();
        localStorage.setItem(SAVE_KEY, JSON.stringify(S));
        replacingSave = true;
        location.reload();
      },
    );
}
function modalConfirm(title, text, callback) {
  modal(
    title,
    'CONFIRMATION',
    `<p>${text}</p><div class="row"><button class="primary" id="confirm">Confirmer</button><button class="secondary" id="cancel">Annuler</button></div>`,
  );
  $('confirm').onclick = callback;
  $('cancel').onclick = settings;
}
function exportSave() {
  saveGame(false);
  let blob = new Blob([JSON.stringify(S, null, 2)], {
      type: 'application/json',
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = 'Asteria-ma-partie.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Partie exportée dans un fichier JSON.');
}
function credits() {
  modal(
    'Un monde pour apprendre',
    'À PROPOS D’ASTÉRIA',
    `<p>Astéria est une aventure indépendante de construction et de découverte, inspirée du genre des jeux de blocs. Elle n’est ni un produit Minecraft, ni un jeu officiel de Mojang ou Microsoft.</p><p>Le moulin, le village et les personnages sont créés pour Astéria. Le renard est signé PixelMannen, tomkranis, AsoboStudio et scurest (<a href="./licenses/Fox.md">licences et adaptations</a>). La musique Port Town Loop est de beardalaxy (CC0). Les textures et bruitages de Minetest Game sont crédités dans les <a href="./licenses/Minetest-credits.md" target="_blank" rel="noopener">crédits des artistes</a>. Les conditions figurent dans les <a href="./licenses/Minetest-media.txt" target="_blank" rel="noopener">licences des médias</a>. Le moteur graphique utilise <b>Three.js r160</b>, sous licence MIT.</p><p>La construction et l’exploration libres s’inspirent des principes présentés sur le <a href="https://www.minecraft.net/en-us/about-minecraft" target="_blank" rel="noopener">site officiel de Minecraft</a>. Le rendu s’appuie sur la <a href="https://threejs.org/docs/" target="_blank" rel="noopener">documentation de Three.js</a>.</p><p>Les règles de fabrication et le temps de croissance des plantes sont simplifiés pour le jeu. Ils ne représentent pas des procédés réels à reproduire.</p><p class="muted">Version 2.1.1 — Solo, monde fini de 80 × 80 blocs. Pas de compte, pas de publicité, pas d’achat intégré. Le jeu n’envoie pas la progression à un serveur. Les voix de synthèse dépendent du navigateur et du système.</p>`,
  );
}
