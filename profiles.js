const slotLabels = ['Explorateur 1', 'Explorateur 2', 'Invité'];
function selectProfile() {
  modal(
    'Choisir une partie',
    'PROFILS SUR CET APPAREIL',
    '<p>Chaque explorateur a son aventure et un monde créatif séparé.</p>' +
      slotLabels
        .map(
          (name, i) =>
            '<section class="quest-card"><h3>' +
            name +
            '</h3><div class="row"><button class="secondary" data-profile="' +
            i +
            '" data-mode="adventure">Aventure</button><button class="secondary" data-profile="' +
            i +
            '" data-mode="creative">Créatif</button></div></section>',
        )
        .join(''),
  );
  document
    .querySelectorAll('[data-profile]')
    .forEach(
      (b) =>
        (b.onclick = () =>
          switchProfile(Number(b.dataset.profile), b.dataset.mode)),
    );
}
function switchProfile(slot, mode) {
  try {
    if (playing) saveGame(false);
    localStorage.setItem('asteria-profile', JSON.stringify({ slot, mode }));
    location.reload();
  } catch {
    toast('Le navigateur empêche de changer de profil.');
  }
}
