const dayMs = 86400000;
const skillNames = {
  batch: 'Mathématiques · Doubler une recette',
  'mill-flow': 'Régler le débit',
  cargo: 'Préparer les livraisons',
};
function recordPractice(id, correct, now = Date.now()) {
  const p = (S.practice[id] ??= {
    attempts: 0,
    successes: 0,
    errors: 0,
    level: 1,
    last: now,
    next: now,
  });
  p.attempts++;
  p.last = now;
  if (correct) {
    p.successes++;
    const recentError = p.errorAt && now - p.errorAt < 60000;
    p.level = recentError ? p.level : Math.min(5, p.level + 1);
    p.next =
      now + (recentError ? 10 * 60000 : [1, 2, 4, 7, 14][p.level - 1] * dayMs);
  } else {
    p.errors++;
    p.errorAt = now;
    p.level = Math.max(1, p.level - 1);
    p.next = now + 10 * 60000;
  }
  saveGame(false);
}
function skillTitle(id) {
  if (id.startsWith('v:')) {
    const [, route, subject] = id.split(':');
    const step = VOYAGES.find(v => v.id === route)?.steps.find(s => s.subject === subject);
    if (step) return voyageSubjects[subject].label + ' · ' + step.title;
  }
  if (id.startsWith('k:'))
    return KNOWLEDGE[Number(id.slice(2))]?.[2] || 'Découverte';
  if (id.startsWith('p:')) return CHALLENGES[id.slice(2)]?.title || 'Épreuve';
  return skillNames[id] || 'Découverte';
}
function parentPanel() {
  const list = Object.entries(S.practice).sort((a, b) => a[1].next - b[1].next);
  const topics = typeof voyageSubjects === 'undefined' ? [] : Object.entries(voyageSubjects).flatMap(([id, topic]) => {
    const records = list.filter(([key]) => key.startsWith('v:') && key.endsWith(':' + id));
    if (!records.length) return [];
    const completed = records.filter(([key]) => S.journal.includes(key)).length;
    const due = records.filter(([,p]) => p.next <= Date.now()).length;
    return ['<li><b>' + topic.label + '</b> · ' + completed + ' / 6 étapes terminées' + (due ? ' · à revoir : ' + due : '') + '</li>'];
  });
  const rows = list
    .map(
      ([id, p]) =>
        '<tr><th>' +
        escapeHTML(skillTitle(id)) +
        '</th><td>' +
        p.successes +
        ' / ' +
        p.attempts +
        '</td><td>' +
        p.errors +
        '</td><td>' +
        p.level +
        ' / 5</td><td>' +
        (p.next <= Date.now()
          ? 'À revoir'
          : new Date(p.next).toLocaleDateString('fr-FR')) +
        '</td></tr>',
    )
    .join('');
  modal(
    'Le parcours de votre enfant',
    'ESPACE PARENT',
    '<p>' +
      Math.floor(S.playSeconds / 60) +
      ' min de jeu actif · ' +
      S.stats.crafted +
      ' fabrications · ' +
      S.learned.length +
      ' découvertes de culture générale.</p>' +
      (topics.length ? '<h3>Les commandes du village</h3><ul>'+topics.join('')+'</ul>' : '') +
      (list.length
        ? '<div class="table-scroll"><table><thead><tr><th>Notion</th><th>Réussites / essais</th><th>Erreurs</th><th>Palier</th><th>Révision</th></tr></thead><tbody>' +
          rows +
          '</tbody></table></div>'
        : '<p>Les premières observations apparaîtront après une épreuve ou une manipulation du moulin.</p>') +
      '<p>Un palier décrit les essais dans ce jeu. Les chiffres concernent cette partie, sur cet appareil.</p>',
  );
}
// La commande change avec les livraisons réussies et le dernier palier observé.
function cargoOrder(level, serial) {
  const boxes = 2 + (serial % 3),
    per = 2 + (Math.floor(serial / 3) % 3),
    extra = 1 + (serial % 2);
  const forms = [
    [
      boxes +
        ' caisses attendent. Une autre arrive. Combien de caisses faut-il charger ?',
      boxes + 1,
      'Pose une caisse à côté de la première pile.',
      'Ajoute 1 au nombre de caisses.',
    ],
    [
      'Il y a ' +
        boxes +
        ' caisses rouges et ' +
        per +
        ' bleues. Combien envoies-tu de caisses ?',
      boxes + per,
      'Compte les deux groupes.',
      'Pars du groupe rouge et avance d’une unité par caisse bleue.',
    ],
    [
      boxes +
        ' paniers contiennent chacun ' +
        per +
        ' pommes. Combien en expédies-tu ?',
      boxes * per,
      'Dessine un groupe par panier.',
      'Additionne le même nombre une fois par panier.',
    ],
    [
      boxes +
        ' paniers de ' +
        per +
        ' pommes sont prêts. Zoé en garde ' +
        extra +
        ' pour le trajet. Combien partent au village ?',
      boxes * per - extra,
      'Calcule d’abord le contenu de tous les paniers.',
      'Retire ensuite les pommes de Zoé au total.',
    ],
    [
      'Le village attend ' +
        (boxes * per + extra) +
        ' pommes. Tu as déjà chargé ' +
        extra +
        ' pomme(s). Les paniers pleins contiennent ' +
        per +
        ' pommes chacun. Combien de paniers pleins dois-tu ajouter ?',
      boxes,
      'Trouve le nombre de pommes restant à charger.',
      'Fais des groupes de ' + per + ' avec le reste.',
    ],
  ];
  const [story, answer, hint, hint2] = forms[level - 1];
  return {
    type: 'number',
    title: 'Le quai des livraisons',
    story,
    answer,
    hint,
    hint2,
    explain: 'La commande demandait ' + answer + '. ' + hint2,
    practiceId: 'cargo',
  };
}
function dispatchCargo() {
  const p = S.practice.cargo,
    level = p?.level || 1;
  showChallenge(
    cargoOrder(level, p?.successes || 0),
    () => {
      give({ apple: 1 });
      saveGame(false);
      millMessage(
        'Livraison préparée',
        'La barque peut partir. Zoé te laisse une pomme pour la route.',
        'Retour sur la rive',
        closeModal,
      );
    },
    'COMMANDE DU VILLAGE · PALIER ' + level + ' / 5',
  );
}
