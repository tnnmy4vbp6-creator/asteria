const voyageSubjects = {
  anglais: { label: 'Anglais', npc: 'lila' },
  grammaire: { label: 'Grammaire', npc: 'soren' },
  calcul: { label: 'Mathématiques', npc: 'borin' },
  problemes: { label: 'Problèmes', npc: 'nora' },
  logique: { label: 'Logique', npc: 'atlas' },
  culture: { label: 'Culture générale', npc: 'selene' },
};
const blockWords = {
  1: 'grass',
  2: 'soil',
  3: 'stone',
  4: 'log',
  5: 'leaves',
  6: 'sand',
  7: 'planks',
  8: 'bricks',
  9: 'coal ore',
  10: 'iron ore',
  11: 'crystal',
  12: 'workbench',
  13: 'furnace',
  14: 'chest',
  15: 'snow',
  16: 'glass',
  20: 'path',
  21: 'torch',
  22: 'cactus',
  23: 'bed',
};
const fieldLessons = {
  wood: [
    'Le bois',
    'Une bûche se dit « a log » en anglais. Dans la recette du jeu, deux bûches donnent huit planches.',
  ],
  stone: [
    'Roches et minéraux',
    'Une roche peut contenir plusieurs minéraux. Le granite, par exemple, contient du quartz, du feldspath et du mica.',
  ],
  coal: [
    'Le charbon',
    'Le charbon est une roche formée à partir de végétaux enfouis et transformés pendant des millions d’années.',
  ],
  ironOre: [
    'Du minerai au métal',
    'Le fer est présent dans certains minéraux. On transforme le minerai pour en extraire le métal.',
  ],
  sand: [
    'Du sable au verre',
    'Le sable riche en silice sert à fabriquer du verre. Dans une verrerie, on le chauffe avec d’autres ingrédients.',
  ],
  snow: [
    'La neige',
    'Un flocon est formé de cristaux de glace. Ice veut dire « glace » en anglais, snow veut dire « neige ».',
  ],
  leaf: [
    'Dans une feuille',
    'Avec de la lumière, de l’eau et du dioxyde de carbone, une plante verte fabrique des sucres qui lui servent à grandir.',
  ],
  seedling: [
    'De la graine à la plantule',
    'Une graine a besoin d’eau, d’oxygène et d’une température favorable pour commencer à germer.',
  ],
  harvest: [
    'Du singulier au pluriel',
    'Un épi mûr, des épis mûrs : au pluriel, le nom et son adjectif prennent ici un s.',
  ],
};
function discoverWhilePlaying(id) {
  const entry = fieldLessons[id],
    key = 'terrain:' + id;
  if (!entry || S.journal.includes(key) || S.creative) return;
  S.journal.push(key);
  toast(entry[1]);
}

function craftBatch(recipe) {
  const batch = {
    ...recipe,
    n: 2 * recipe.n,
    cost: Object.fromEntries(
      Object.entries(recipe.cost).map(([k, n]) => [k, 2 * n]),
    ),
  };
  if (!canCraft(batch)) {
    inventory('craft');
    return;
  }
  const first = Object.keys(recipe.cost)[0];
  const per = recipe.cost[first];
  const question = {
    title: 'Préparer deux fabrications',
    type: 'number',
    story:
      'Une fabrication donne ' +
      recipe.n +
      ' × ' +
      itemName(recipe.out) +
      ' et demande ' +
      per +
      ' × ' +
      itemName(first) +
      '. Quelle quantité de ce matériau dois-tu sortir du sac pour deux fabrications ?',
    answer: 2 * per,
    hint: 'Compte le premier lot puis un deuxième lot identique.',
    hint2: 'Additionne ' + per + ' et ' + per + '.',
    explain:
      'Deux lots utilisent ' +
      2 * per +
      ' × ' +
      itemName(first) +
      ' et donnent ' +
      batch.n +
      ' × ' +
      itemName(recipe.out) +
      '.',
    practiceId: 'batch',
    onSolved: () => craft(batch),
  };
  showChallenge(
    question,
    () => inventory('craft'),
    'ATELIER · DOUBLER UNE RECETTE',
  );
}
const voyageKey = (v, s) => 'v:' + v.id + ':' + s.subject;
function remainingSteps(v) {
  return v.steps.filter((s) => !S.journal.includes(voyageKey(v, s)));
}
function nextJob(subject) {
  const v = VOYAGES.find((v) => remainingSteps(v).length);
  if (!v) return null;
  const steps = remainingSteps(v);
  const s = subject ? steps.find((s) => s.subject === subject) : steps[0];
  return s
    ? { v, s, npc: NPCS.find((n) => n.id === voyageSubjects[s.subject].npc) }
    : null;
}
function drawPackingTask(c, success, wrong) {
  let total = 0,
    finished = false;
  const puzzle = $('puzzle');
  puzzle.innerHTML =
    '<div class="parcel"><output aria-live="polite" id="packTotal"></output><div class="row">' +
    c.lots
      .map(
        (n) =>
          '<button class="secondary" data-lot="' +
          n +
          '">+ ' +
          n +
          ' ' +
          (n === 1 ? c.unit.replace(/s$/, '') : c.unit) +
          '</button>',
      )
      .join('') +
    '</div><div class="row"><button class="primary" id="packCheck">Livrer cette quantité</button><button class="secondary" id="packClear">Vider</button></div></div>';
  function display() {
    $('packTotal').textContent =
      'Préparé : ' +
      total +
      ' ' +
      (total < 2 ? c.unit.replace(/s$/, '') : c.unit);
  }
  display();
  puzzle.querySelectorAll('[data-lot]').forEach(
    (b) =>
      (b.onclick = () => {
        if (!finished) {
          total += Number(b.dataset.lot);
          display();
        }
      }),
  );
  $('packClear').onclick = () => {
    if (!finished) {
      total = 0;
      display();
    }
  };
  $('packCheck').onclick = () => {
    if (finished) return;
    if (total !== c.answer) {
      wrong(
        (total < c.answer ? 'Il en manque. ' : 'Il y en a trop. ') + c.hint,
      );
      return;
    }
    finished = true;
    puzzle.querySelectorAll('button').forEach((b) => (b.disabled = true));
    success();
  };
}
function doJob(v, s, review = false) {
  const id = voyageKey(v, s);
  const c = { ...s, practiceId: id };
  if (s.subject === 'anglais')
    c.story =
      'Lis le message puis choisis ce que tu vas faire.<br><strong lang="en">' +
      s.story +
      '</strong>';
  let shipment = false;
  c.onSolved = () => {
    if (review || S.journal.includes(id)) return;
    S.journal.push(id);
    S.xp += 8;
    shipment = remainingSteps(v).length === 0;
    if (shipment) {
      give(v.reward);
      refreshBoat();
    }
    if (!nextJob()) S.voyageGuide = false;
    // recordPractice persists the answer, shipment and reward together.
  };
  showChallenge(
    c,
    () => {
      if (review) {
        voyageBoard();
        return;
      }
      const next = nextJob();
      modal(
        shipment ? 'Commande expédiée !' : 'Étape accomplie',
        v.title,
        '<p>' +
          s.explain +
          '</p>' +
          (shipment
            ? '<p>Les six préparatifs sont terminés. Un fanion rejoint la barque et tu reçois ' +
              Object.entries(v.reward)
                .map(([k, n]) => n + ' × ' + itemName(k))
                .join(', ') +
              '.</p>'
            : '') +
          (next
            ? '<p>' +
              next.npc.name +
              ' t’attend pour « ' +
              next.s.title +
              ' ».</p><div class="row"><button class="primary" id="jobGo">Rejoindre ' +
              next.npc.name +
              '</button><button class="secondary" id="jobWalk">Y aller à pied</button></div>'
            : '<button class="primary" id="jobWalk">Retour au monde</button>'),
      );
      if ($('jobGo')) $('jobGo').onclick = () => goToJob(next);
      $('jobWalk').onclick = () => {
        closeModal();
        updateHUD();
      };
    },
    voyageSubjects[s.subject].label + ' · ' + v.title,
  );
  if (s.subject === 'anglais') {
    $('readQuestion').textContent = 'Écouter en anglais';
    $('readQuestion').onclick = () => speak(s.story, 'en-GB');
  }
  // In a solved screen the continuation can be skipped by closing the panel.
  // The delivery has already been recorded, so reloading cannot duplicate it.
}
function goToJob(job) {
  if (!job) return;
  S.voyageGuide = true;
  closeModal();
  const actor = characters.find((c) => c.npc.id === job.npc.id);
  for (const [dx, dz] of [
    [0, 2.1],
    [2.1, 0],
    [0, -2.1],
    [-2.1, 0],
    [1.6, 1.6],
    [-1.6, -1.6],
  ]) {
    const p = actor.pos.clone();
    p.x += dx;
    p.z += dz;
    if (
      collision(p.x, p.y, p.z) ||
      !world.solid(Math.floor(p.x), Math.floor(p.y) - 1, Math.floor(p.z))
    )
      continue;
    const eye = p.clone();
    eye.y += 1.4;
    const look = actor.pos.clone();
    look.y += 1.35;
    if (!clearSight(eye, look.sub(eye))) continue;
    player.pos.copy(p);
    player.yaw = Math.atan2(dx, dz);
    player.pitch = -0.08;
    player.velY = 0;
    streamTerrain(true);
    break;
  }
  updateHUD();
  saveGame(false);
  toast('Approche de ' + job.npc.name + ' et touche la main pour commencer.');
}
function voyageBoard() {
  const job = nextJob();
  const due = VOYAGES.flatMap((v) =>
    v.steps.map((s) => ({ v, s, id: voyageKey(v, s) })),
  )
    .filter((e) => S.journal.includes(e.id))
    .sort(
      (a, b) => (S.practice[a.id]?.next || 0) - (S.practice[b.id]?.next || 0),
    );
  const progress = VOYAGES.reduce(
    (n, v) => n + 6 - remainingSteps(v).length,
    0,
  );
  modal(
    job?.v.title || 'La flottille est prête',
    'LES COMMANDES DU VILLAGE · ' + progress + ' / 36',
    (job
      ? '<p>Six habitants préparent une cargaison. Chaque service rendu la rapproche du départ.</p><p><b>' +
        job.npc.name +
        ' · ' +
        voyageSubjects[job.s.subject].label +
        '</b><br>' +
        job.s.title +
        '</p><button class="primary" id="launchJob">Rejoindre ' +
        job.npc.name +
        '</button>'
      : '<p>Les six cargaisons ont été expédiées. Retrouve leurs explications dans le carnet.</p>') +
      (due.length
        ? '<p><button class="secondary" id="jobReview">Revoir · ' +
          due[0].s.title +
          '</button></p>'
        : '') +
      (S.voyageGuide
        ? '<p><button class="secondary" id="jobUntrack">Reprendre ma quête précédente</button></p>'
        : ''),
  );
  if (job) $('launchJob').onclick = () => goToJob(job);
  if (due.length)
    $('jobReview').onclick = () => doJob(due[0].v, due[0].s, true);
  if ($('jobUntrack'))
    $('jobUntrack').onclick = () => {
      S.voyageGuide = false;
      closeModal();
      updateHUD();
    };
}
const boatFlags = [];
function buildVoyageBoat() {
  const group = new THREE.Group();
  group.position.set(50.5, 3.85, 55.5);
  scene.add(group);
  meshBox(group, 0, 0.06, 0, 1.7, 0.33, 3.7, 0x724731);
  meshBox(group, 0, 0.25, 0, 1.45, 0.12, 3.45, 0xc59460);
  for (const x of [-0.8, 0.8])
    meshBox(group, x, 0.39, 0, 0.17, 0.34, 3.65, 0x326a66);
  meshBox(group, 0, 1.75, 0, 0.13, 3.5, 0.13, 0x805234);
  meshBox(group, 0, 3.36, 0, 0.14, 0.12, 3.35, 0xc39654);
  batchRigidParts(group);
  VOYAGES.forEach((v, i) => {
    const flag = meshBox(
      group,
      0,
      3.02,
      -1.36 + i * 0.54,
      0.08,
      0.59,
      0.46,
      [0xe5b857, 0x52a7a1, 0xc26b55, 0x7d87c1, 0xf1d38c, 0x83a75f][i],
    );
    boatFlags.push(flag);
  });
  refreshBoat();
}
function refreshBoat() {
  boatFlags.forEach(
    (flag, i) => (flag.visible = !remainingSteps(VOYAGES[i]).length),
  );
}
