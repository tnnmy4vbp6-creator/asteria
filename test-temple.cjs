const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');
const [engine = 'chrome', url = 'http://localhost:8775/'] =
  process.argv.slice(2);

async function check() {
  const browser =
    engine === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({
          channel: 'chrome',
          args: ['--enable-unsafe-swiftshader'],
        });
  try {
    const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#playButton').tap();
    await page.locator('#questButton').tap();
    await page.locator('#visitTemple').tap();
    assert.equal(
      await page.evaluate(() => world.get(temple.x + 7, 6, temple.z + 5)),
      18,
    );
    assert.equal(
      await page.evaluate(() => collision(temple.x + 7.5, 6, temple.z + 5.5)),
      true,
    );
    await page.waitForFunction(() => world.dirty.size === 0);
    await page.screenshot({ path: '.qa/temple-' + engine + '.jpg' });
    // Place the test player within reach, then use the ordinary aiming and hand control.
    async function face(id) {
      await page.evaluate((id) => {
        const o = interactive.find((o) => o.kind === 'temple' && o.id === id);
        player.pos.copy(o.pos);
        player.pos.z += 1.65;
        player.yaw = 0;
        player.pitch = -0.31;
        movePlayer(0);
        camera.updateMatrixWorld();
        updateTarget();
        if (nearObject !== o) throw Error('Mauvaise cible ' + id);
      }, id);
    }
    async function tapHand() {
      await page.locator('#touchUse').tap();
    }
    await face(0);
    await tapHand();
    await page.reload();
    await page.locator('#playButton').tap();
    assert.equal(await page.evaluate(() => S.temple.mask), 7);
    await face(1);
    await tapHand();
    assert.equal(await page.evaluate(() => S.temple.open), false);
    await face(2);
    await tapHand();
    assert.equal(
      await page.evaluate(() => world.get(temple.x + 7, 6, temple.z + 5)),
      0,
    );
    // Walk through the open doorway with the same collision and movement code as the joystick.
    assert(
      await page.evaluate(() => {
        player.pos.set(temple.x + 7.5, 6, temple.z + 7);
        player.yaw = 0;
        keys.w = true;
        for (let i = 0; i < 50; i++) movePlayer(0.025);
        keys.w = false;
        return player.pos.z < temple.z + 5 && player.pos.y >= 5.9;
      }),
    );
    await face('observe');
    await tapHand();
    assert.equal(
      await page.evaluate(() => S.journal.includes('temple:eclipse')),
      false,
    );
    await face('moon');
    for (let i = 0; i < 6; i++) await tapHand();
    await face('observe');
    await tapHand();
    await page.locator('#templeMap').tap();
    assert.equal(await page.locator('#largeMap').count(), 1);
    await page.reload();
    await page.locator('#playButton').tap();
    const xp = await page.evaluate(() => S.xp);
    await face('moon');
    await tapHand();
    assert.deepEqual(
      await page.evaluate(() => [
        S.xp,
        S.journal.filter((k) => k === 'temple:eclipse').length,
        S.temple.open,
      ]),
      [xp, 1, true],
    );
    assert.deepEqual(errors, []);
    const weather = await page.evaluate(() => {
      const open = cropMeshes[0],
        covered = cropMeshes[1];
      for (const plot of [open, covered])
        S.crops[plot.id] = { at: 165, watered: false };
      world.set(Math.floor(covered.pos.x), 9, Math.floor(covered.pos.z), 16);
      S.time = 170;
      animateWeather();
      return [
        weatherAt(170, 32, 58),
        weatherAt(170, 32, 10),
        weatherAt(170, 66, 62),
        S.crops[open.id].watered,
        S.crops[covered.id].watered,
      ];
    });
    assert.deepEqual(weather, ['Pluie', 'Neige', '', true, false]);
    await page.evaluate(() => {
      // An older saved world with a player-built bench on the first candidate site.
      const legacy = freshState();
      delete legacy.temple;
      legacy.edits[world.index(60, 8, 59)] = 12;
      replacingSave = true;
      localStorage.setItem(SAVE_KEY, JSON.stringify(legacy));
    });
    await page.reload();
    await page.locator('#titleTemple').tap();
    assert.deepEqual(await page.evaluate(() => [
      S.temple.site, world.get(60, 8, 59), Math.floor(player.pos.x) - temple.x, playing, paused
    ]), [1, 12, 7, true, false]);
    assert.deepEqual(errors, []);
    console.log(
      engine,
      'OK: entry, aim, mirrors, gate collision, eclipse, map, reload, single reward.',
    );
  } finally {
    await browser.close();
  }
}
check().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
