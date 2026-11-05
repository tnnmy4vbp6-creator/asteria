const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { chromium, webkit } = require('playwright-core');
const [engine = 'webkit', url = 'http://localhost:8775/'] = process.argv.slice(2);

async function verify() {
  const browser = engine === 'webkit' ? await webkit.launch() :
    await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 695 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#playButton').tap();
    await page.waitForFunction(() => animals.filter(a => a.type === 'watcher').length === 2 &&
      animals.filter(a => a.type === 'watcher').every(a => a.motion));
    const hotbar = page.locator('[data-slot="2"]'), bounds = await hotbar.boundingBox();
    const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
    for (let i = 0; i < 6; i++) await page.touchscreen.tap(x, y);
    if (engine === 'chrome') {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await new Promise(r => setTimeout(r, 750));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    assert.deepEqual(await page.evaluate(() => {
      const button = document.querySelector('[data-slot="2"] .count'), css = getComputedStyle(button);
      return [S.selected, visualViewport.scale, getSelection().toString(), css.touchAction, css.userSelect || css.webkitUserSelect,
        ...['contextmenu', 'selectstart', 'gesturestart'].map(type =>
          button.dispatchEvent(new Event(type, { bubbles: true, cancelable: true })))];
    }), [2, 1, '', 'none', 'none', false, false, false]);

    await page.locator('#pauseButton').tap();
    await page.locator('#peaceful').selectOption('false');
    await page.locator('#waitNight').tap();
    await page.waitForFunction(() => animals.some(a => a.type === 'watcher' && a.group.visible));
    await page.evaluate(() => {
      world.fill(27, 5, 60, 42, 10, 76, 0);
      world.fill(27, 4, 60, 42, 4, 76, 1);
      world.fill(35, 5, 63, 35, 7, 63, 8);
      player.pos.set(35.5, 5, 68.5);
      player.pitch = 0; player.yaw = 0;
      S.hotbar[2] = 'plank'; S.inv.plank = 4;
      movePlayer(0); camera.updateMatrixWorld(); updateHUD();
    });
    const plus = await page.locator('#touchPlace').boundingBox();
    for (let i = 0; i < 2; i++) await page.touchscreen.tap(plus.x + plus.width / 2, plus.y + plus.height / 2);
    assert.deepEqual(await page.evaluate(() => [S.inv.plank, visualViewport.scale, paused]), [2, 1, false]);

    const result = await page.evaluate(() => {
      const a = animals.find(a => a.type === 'watcher');
      a.pos.set(35.5, 5, 72); player.pos.set(35.5, 5, 67);
      refreshTorches();
      for (let i = 0; i < 10; i++) updateWatcher(a, 0.1, true);
      const followed = a.group.visible && a.pos.z < 71.5 && a.motion === a.run;
      world.fill(31, 5, 69, 39, 8, 69, 8);
      const before = a.pos.clone();
      for (let i = 0; i < 30; i++) updateWatcher(a, 0.1, true);
      const sheltered = before.equals(a.pos) && a.motion === a.idle;
      world.fill(31, 5, 69, 39, 8, 69, 0);
      S.hotbar[S.selected] = 'torch'; S.inv.torch = 1;
      target = {prev: {x:35,y:5,z:69}}; placeBlock();
      for (let i = 0; i < 10; i++) updateWatcher(a, 0.1, true);
      const fled = S.inv.torch === 0 && a.pos.z > before.z + 0.5;
      updateWatcher(a, 0.1, false); const day = !a.group.visible;
      S.settings.peaceful = true; updateWatcher(a, 0.1, true); const peaceful = !a.group.visible;
      S.settings.peaceful = false; S.creative = true; updateWatcher(a, 0.1, true); const creative = !a.group.visible;
      S.creative = false;
      // Face the watcher at dusk to inspect its textured, animated pose.
      player.pos.set(35.5, 5, 74.5); player.pitch = -0.16; player.yaw = 0;
      a.pos.set(35.5, 5, 70.5); a.angle = 0; a.group.rotation.y = 0;
      S.time = 348; movePlayer(0); animateWorld(0.016); camera.updateMatrixWorld();
      updateHUD(); updateTarget(); renderer.render(scene, camera);
      a.group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(a.group, true);
      const grounded = Math.abs(box.min.y - a.pos.y) < 0.2 && Math.abs(box.max.y - box.min.y - 1.8) < 0.2;
      return { followed, sheltered, fled, day, peaceful, creative, grounded };
    });
    assert(Object.values(result).every(Boolean), JSON.stringify(result));
    await page.evaluate(() => {
      const watcher = animals.find(a => a.type === 'watcher');
      watcher.pos.copy(player.pos);
      watcher.pos.z -= 1.9;
      watcher.cooldown = 0;
      updateTarget();
      if (nearObject !== watcher) throw Error('Veilleur hors de visée');
      window.touchLog = { starts: 0, ends: 0, clicks: 0 };
      for (const [type, key] of [['touchstart', 'starts'], ['touchend', 'ends']]) {
        window.addEventListener(type, e => { if (e.defaultPrevented) touchLog[key]++; });
      }
      $('touchUse').addEventListener('click', () => touchLog.clicks++);
    });
    const hand = await page.locator('#touchUse').boundingBox();
    for (let i = 0; i < 5; i++)
      await page.touchscreen.tap(hand.x + hand.width / 2, hand.y + hand.height / 2);
    assert.deepEqual(await page.evaluate(() => [
      touchLog, visualViewport.scale, animals.find(a => a.type === 'watcher').cooldown > 0,
    ]), [{ starts: 5, ends: 5, clicks: 5 }, 1, true]);
    await page.locator('#pauseButton').tap();
    await page.locator('#resume').waitFor({ state: 'visible' });
    const resume = await page.locator('#resume').boundingBox();
    await page.touchscreen.tap(resume.x + resume.width / 2, resume.y + resume.height / 2);
    await page.waitForFunction(() => !paused, null, { polling: 100, timeout: 5000 });
    mkdirSync('.qa', { recursive: true });
    await page.screenshot({ path: '.qa/veilleur-' + engine + '.png', timeout: 15000 });
    assert.deepEqual(errors, []);
    console.log(engine, 'double appui, construction, pause et veilleurs OK', result);
  } finally { await browser.close(); }
}
verify().catch(e => { console.error(e); process.exitCode = 1; });
