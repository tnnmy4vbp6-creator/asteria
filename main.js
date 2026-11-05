function beginPlay() {
  updateMusic(true);
  playing = true;
  paused = false;
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  renderer.domElement.tabIndex = 0;
  renderer.domElement.focus();
  safePlayer();
  updateHUD();
  sfx('success');
  if (loadNotice) toast(loadNotice);
  else if (!hasSavedWorld)
    toast(
      'Bienvenue au village ! Avance vers Zoé, près du chemin. Elle a besoin de toi au moulin.',
    );
}
function useAimedObject() {
  if (!playing || paused) return;
  updateTarget();
  interact();
}
function wireControls() {
  wireStick();
  let canvas = renderer.domElement;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    if (!playing || paused) return;
    canvas.focus();
    if (e.button === 2) {
      placeBlock();
      return;
    }
    if (dragging) return;
    dragging = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      type: e.pointerType,
    };
    if (e.pointerType !== 'touch') mouseDown = true;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (paused || !playing) return;
    let sensitivity = 0.0025 * S.settings.sensitivity;
    if (document.pointerLockElement === canvas) {
      player.yaw -= e.movementX * sensitivity;
      player.pitch = Math.max(
        -1.35,
        Math.min(1.35, player.pitch - e.movementY * sensitivity),
      );
    } else if (dragging && dragging.id === e.pointerId) {
      let dx = e.clientX - dragging.x,
        dy = e.clientY - dragging.y;
      player.yaw -= dx * sensitivity * 1.8;
      player.pitch = Math.max(
        -1.35,
        Math.min(1.35, player.pitch - dy * sensitivity * 1.8),
      );
      dragging.x = e.clientX;
      dragging.y = e.clientY;
      if (
        Math.hypot(e.clientX - dragging.startX, e.clientY - dragging.startY) > 5
      ) {
        dragging.moved = true;
        mouseDown = false;
      }
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (dragging && dragging.id !== e.pointerId) return;
    mouseDown = false;
    if (
      dragging &&
      !dragging.moved &&
      e.pointerType !== 'touch' &&
      e.button === 0 &&
      !document.pointerLockElement
    ) {
      try {
        canvas
          .requestPointerLock?.()
          ?.catch(() =>
            toast('Tu peux maintenir et glisser la souris pour regarder.'),
          );
      } catch (err) {}
    }
    dragging = null;
  });
  canvas.addEventListener('pointercancel', () => {
    mouseDown = false;
    dragging = null;
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (paused) return;
      e.preventDefault();
      S.selected = (S.selected + (e.deltaY > 0 ? 1 : 7)) % 8;
      updateHUD();
    },
    { passive: false },
  );
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && playing && !paused) settings();
  });
  addEventListener('keydown', (e) => {
    let key = e.key.toLowerCase();
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (key === 'tab' && !$('modal').classList.contains('hidden')) {
      let focusable = [
        ...$('modalBody').querySelectorAll(
          'button:not(:disabled),input:not(:disabled),select,a[href]',
        ),
      ].filter((el) => !el.closest('.hidden'));
      if (focusable.length) {
        if (e.shiftKey && document.activeElement === focusable[0]) {
          e.preventDefault();
          focusable.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === focusable.at(-1)) {
          e.preventDefault();
          focusable[0].focus();
        }
      }
      return;
    }
    if (
      [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) &&
      playing
    )
      e.preventDefault();
    if (key === 'escape') {
      e.preventDefault();
      if (!$('modal').classList.contains('hidden')) closeModal();
      else if (playing) settings();
      return;
    }
    if (paused || !playing) return;
    keys[key] = true;
    if (e.repeat) return;
    if (key === 'e') useAimedObject();
    if (key === 'i') inventory();
    if (key === 'j') quests();
    if (key === 'm') showMap();
    if (key === 'l') notebook();
    if (key === 'b') placeBlock();
    if (key === 'f') eat(S.inv.bread ? 'bread' : 'apple');
    if (/^[1-8]$/.test(key)) selectSlot(Number(key) - 1);
  });
  addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });
  addEventListener('blur', () => {
    keys = {};
    mouseDown = false;
    dragging = null;
    saveGame(false);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing && !paused) settings();
    updateMusic(!document.hidden && playing && !paused);
    saveGame(false);
  });
  addEventListener('beforeunload', () => saveGame(false));
  document.querySelectorAll('[data-move]').forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      keys[b.dataset.move] = true;
      b.setPointerCapture(e.pointerId);
    };
    b.onpointerup = b.onpointercancel = () => {
      keys[b.dataset.move] = false;
    };
  });
  $('touchJump').onpointerdown = (e) => {
    e.preventDefault();
    keys[' '] = true;
    e.target.setPointerCapture(e.pointerId);
  };
  $('touchJump').onpointerup = $('touchJump').onpointercancel = () =>
    (keys[' '] = false);
  $('touchMine').onpointerdown = (e) => {
    e.preventDefault();
    mouseDown = true;
    e.target.setPointerCapture(e.pointerId);
  };
  $('touchMine').onpointerup = $('touchMine').onpointercancel = () =>
    (mouseDown = false);
  $('touchUse').onclick = $('interactPrompt').onclick = useAimedObject;
  $('touchPlace').onclick = placeBlock;
  $('questButton').onclick = quests;
  $('bagButton').onclick = () => inventory();
  $('bookButton').onclick = notebook;
  $('pauseButton').onclick = settings;
  $('titleGuide').onclick = guide;
  $('profilesButton').onclick = selectProfile;
  $('profilesButton').textContent =
    slotLabels[profile.slot] +
    ' · ' +
    (profile.mode === 'creative' ? 'Créatif' : 'Aventure');
  $('creditsButton').onclick = credits;
  $('playButton').onclick = beginPlay;
  if (profile.mode === 'creative' && !S.inv.ironpick) {
    give(Object.fromEntries(Object.keys(PLACE).map((k) => [k, 64])));
    give({ ironpick: 1 });
    S.creative = true;
  }
  if (hasSavedWorld)
    $('playButton').innerHTML = 'Continuer l’aventure <span>→</span>';
  $('importSave').onchange = async (e) => {
    let file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 4e6) throw new Error('Fichier trop volumineux');
      let data = JSON.parse(await file.text());
      if (!validSave(data)) throw new Error('Format de sauvegarde invalide');
      modalConfirm(
        'Charger cette partie ?',
        'La partie locale sera remplacée par le fichier choisi. Exporte ta partie actuelle si tu veux la garder.',
        () => {
          try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            replacingSave = true;
            location.reload();
          } catch (err) {
            toast('Le navigateur ne permet pas de remplacer la sauvegarde.');
          }
        },
      );
    } catch (err) {
      toast('Ce fichier n’est pas une sauvegarde Astéria valide.');
    }
  };
}
try {
  initEngine();
  wireControls();
  $('loading').classList.add('hidden');
  $('title').classList.remove('hidden');
} catch (error) {
  console.error(error);
  $('loading').innerHTML =
    '<h1>ASTÉRIA</h1><p>Le moteur 3D n’a pas pu démarrer.</p><p>Ouvre ce fichier dans une version récente de Chrome ou Edge avec l’accélération graphique activée.</p><p style="font-size:12px;max-width:600px;text-align:center" id="startupError"></p>';
  $('startupError').textContent = error.message;
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker
    .register('./sw.js', { updateViaCache: 'none' })
    .catch((err) => console.warn('Mode hors ligne indisponible', err));
}
