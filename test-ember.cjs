const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require('playwright-core');
const [engine = 'chrome', url = 'http://localhost:8775/'] =
  process.argv.slice(2);
async function run() {
  const browser =
    engine === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({
          channel: 'chrome',
          args: ['--enable-unsafe-swiftshader'],
        });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 720 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#titleEmber').tap({ force: engine === 'webkit' });
    await page.locator('#enterEmber').tap({ force: engine === 'webkit' });
    await page.waitForFunction(() => ember && world.dirty.size === 0);
    fs.mkdirSync('.qa', { recursive: true });
    await page.screenshot({ path: '.qa/ember-entry-' + engine + '.jpg' });
    assert.equal(await page.evaluate(() => validSave(S)), true);
    const village = await page.evaluate(() => ({
      data: Array.from(emberVillage.world.data),
      edits: JSON.stringify(S.edits),
      player: JSON.stringify(S.player),
    }));
    async function face(id) {
      await page.evaluate((id) => {
        const o = interactive.find((o) => o.kind === 'ember' && o.id === id);
        const offset = [
          [0, 2.2],
          [2.2, 0],
          [0, -2.2],
          [-2.2, 0],
        ].find(([dx, dz]) => !collision(o.pos.x + dx, 6, o.pos.z + dz));
        if (!offset) throw Error('No reachable side of ' + id);
        player.pos.copy(o.pos);
        player.pos.x += offset[0];
        player.pos.z += offset[1];
        player.velY = 0;
        player.yaw = Math.atan2(offset[0], offset[1]);
        player.pitch = 0;
        movePlayer(0);
        camera.updateMatrixWorld();
        updateTarget();
        if (nearObject !== o)
          throw Error('Wrong interaction ' + id + ': ' + nearObject?.id);
      }, id);
    }
    const hand = () =>
      page.locator('#touchUse').tap({ force: engine === 'webkit' });
    async function number(n) {
      await page.locator('#numberInput').fill(String(n));
      await page
        .locator('#numberForm button')
        .tap({ force: engine === 'webkit' });
    }
    await face('bridge');
    await hand();
    await number(9);
    assert.equal(await page.evaluate(() => S.ember.bridge), 0);
    await number(18);
    await page.locator('#nextChallenge').tap({ force: engine === 'webkit' });
    for (let i = 0; i < 3; i++)
      await page.locator('#emberRow').tap({ force: engine === 'webkit' });
    // Close halfway, reload and finish the same construction without duplicate rewards.
    await page.locator('#modalClose').tap({ force: engine === 'webkit' });
    await page.reload();
    await page.locator('#playButton').tap({ force: engine === 'webkit' });
    assert.equal(await page.evaluate(() => S.ember.bridge), 3);
    await face('bridge');
    await hand();
    for (let i = 0; i < 3; i++)
      await page.locator('#emberRow').tap({ force: engine === 'webkit' });
    assert.equal(await page.evaluate(() => S.ember.bridge), 6);
    assert(
      await page.evaluate(() => {
        player.pos.set(36.5, 6, 55.5);
        player.yaw = 0;
        keys.w = true;
        for (let i = 0; i < 120; i++) movePlayer(0.025);
        keys.w = false;
        return player.pos.z < 48 && player.pos.y >= 5.9;
      }),
      'bridge must be physically walkable',
    );
    await face('forge');
    await hand();
    await page.locator('[data-valve="1"]').tap({ force: engine === 'webkit' });
    await page.locator('#emberCool').tap({ force: engine === 'webkit' });
    assert.equal(await page.evaluate(() => S.ember.cooled), false);
    await page.locator('[data-valve="1"]').tap({ force: engine === 'webkit' });
    await page.locator('[data-valve="0"]').tap({ force: engine === 'webkit' });
    await page.locator('[data-valve="2"]').tap({ force: engine === 'webkit' });
    await page.locator('#emberCool').tap({ force: engine === 'webkit' });
    assert.equal(await page.evaluate(() => S.ember.cooled), true);
    await face('south');
    await hand();
    assert.equal(await page.evaluate(() => S.ember.route), 0);
    for (const id of ['north', 'east', 'west']) {
      await face(id);
      await hand();
    }
    assert.equal(await page.evaluate(() => S.ember.route), 3);
    assert.equal(await page.evaluate(() => world.get(38, 6, 29)), 0);
    assert(
      await page.evaluate(() => {
        player.pos.set(38.5, 6, 31.5);
        player.yaw = 0;
        keys.w = true;
        for (let i = 0; i < 55; i++) movePlayer(0.025);
        keys.w = false;
        return player.pos.z < 29 && player.pos.y >= 5.9;
      }),
      'gate must be physically walkable',
    );
    assert(
      await page.evaluate(() => {
        S.ember.assisted = false;
        S.health = 100;
        player.pos.set(38.5, 6, 25.5);
        ember.bossTime = 1;
        ember.cycle = -1;
        animateEmber(0);
        ember.bossTime = 3;
        animateEmber(0);
        const damage = S.health === 82;
        S.health = 100;
        ember.bossTime = 13;
        ember.cycle = -1;
        animateEmber(0);
        player.pos.x += 4;
        ember.bossTime = 15;
        animateEmber(0);
        const dodge = S.health === 100;
        S.ember.assisted = true;
        ember.bossTime = 25;
        ember.cycle = -1;
        animateEmber(0);
        ember.bossTime = 27;
        animateEmber(0);
        return damage && dodge && S.health === 100;
      }),
      'telegraphed damage, dodge and assisted mode',
    );
    // Build with the ordinary placement control. Realm edits must not enter the village log.
    await page.evaluate(() => {
      player.pos.set(30.5, 6, 44.5);
      give({ stone: 2 });
      S.selected = 3;
      S.hotbar[3] = 'stone';
      target = { id: 18, x: 31, y: 5, z: 44, prev: { x: 31, y: 6, z: 44 } };
      placeBlock();
      if (world.get(31, 6, 44) !== 3) throw Error('Construction failed');
    });
    for (let i = 0; i < 3; i++) {
      await face('seal' + i);
      await hand();
      if (i < 2)
        await page
          .locator('[data-choice="' + (i === 0 ? 1 : 0) + '"]')
          .tap({ force: engine === 'webkit' });
      else await number(10);
      await page.locator('#nextChallenge').tap({ force: engine === 'webkit' });
      assert.equal(await page.evaluate(() => S.ember.charged), true);
      if (i === 0)
        assert(
          await page.evaluate(() => {
            player.pos.set(38.5, 6, 25.5);
            player.pitch = -1;
            movePlayer(0);
            ember.bossTime = 1;
            emberShoot();
            const shield = S.ember.hits === 0 && S.ember.charged;
            ember.bossTime = 5;
            emberShoot();
            return shield && S.ember.hits === 0 && S.ember.charged;
          }),
          'closed shield and missed aim must not consume a charge',
        );
      if (i === 0) {
        await page.reload();
        await page.locator('#playButton').tap({ force: engine === 'webkit' });
        assert.equal(await page.evaluate(() => S.ember.charged), true);
        assert.equal(await page.evaluate(() => world.get(31, 6, 44)), 3);
      }
      await page.evaluate(() => {
        player.pos.set(38.5, 6, 25.5);
        player.velY = 0;
        ember.bossTime = 5;
        animateEmber(1);
        movePlayer(0);
        const v = ember.dragon.position.clone().sub(camera.position);
        player.yaw = Math.atan2(-v.x, -v.z);
        player.pitch = Math.atan2(v.y, Math.hypot(v.x, v.z));
        movePlayer(0);
        camera.updateMatrixWorld();
        updateTarget();
      });
      if (i === 0) {
        await page.waitForFunction(() => world.dirty.size === 0);
        await page.screenshot({ path: '.qa/ember-dragon-' + engine + '.jpg' });
      }
      await hand();
      if ((await page.evaluate(() => S.ember.hits)) !== i + 1)
        console.log(
          await page.evaluate(() => ({
            stage: S.ember,
            phase: ember.bossTime,
            near: nearObject?.id,
            pitch: player.pitch,
            toast: $('toasts').textContent,
            paused,
          })),
        );
      assert.equal(
        await page.evaluate(() => S.ember.hits),
        i + 1,
        'a charged aimed ray breaks one seal',
      );
    }
    assert.equal(await page.evaluate(() => validSave(S)), true);
    const xp = await page.evaluate(() => S.xp);
    await page.locator('#emberStay').tap({ force: engine === 'webkit' });
    await hand();
    await page.locator('#emberStay').tap({ force: engine === 'webkit' });
    assert.equal(
      await page.evaluate(() => S.xp),
      xp,
      'victory cannot pay twice',
    );
    await page.locator('#questButton').tap({ force: engine === 'webkit' });
    await page.locator('#emberHome').tap({ force: engine === 'webkit' });
    assert.deepEqual(
      await page.evaluate(() => ({
        data: Array.from(world.data),
        edits: JSON.stringify(S.edits),
        player: JSON.stringify(S.player),
      })),
      village,
      'village must be unchanged after the expedition',
    );
    // Old saves still load. Completed expeditions survive a reload and a new crossing.
    await page.reload();
    await page.locator('#titleEmber').tap({ force: engine === 'webkit' });
    await page.locator('#enterEmber').tap({ force: engine === 'webkit' });
    assert.equal(await page.evaluate(() => S.ember.hits), 3);
    assert.equal(await page.evaluate(() => world.get(31, 6, 44)), 3);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.context().setOffline(true);
    await page.reload();
    await page.locator('#playButton').tap({ force: engine === 'webkit' });
    assert.equal(
      await page.evaluate(() => S.ember.hits),
      3,
      'realm resumes offline',
    );
    await page.context().setOffline(false);
    await face('return');
    await hand();
    assert.equal(await page.evaluate(() => ember === null), true, 'physical return portal');
    await page.locator('#questButton').tap({ force: engine === 'webkit' });
    await page.locator('#questEmber').tap({ force: engine === 'webkit' });
    await page.locator('#enterEmber').tap({ force: engine === 'webkit' });
    assert.equal(await page.evaluate(() => S.ember.hits), 3);
    const exported = await page.evaluate(() => JSON.stringify(S));
    assert.equal(
      await page.evaluate((raw) => {
        const s = JSON.parse(raw);
        delete s.ember;
        return validSave(s);
      }, exported),
      true,
    );
    assert.equal(
      await page.evaluate((raw) => {
        const s = JSON.parse(raw);
        s.ember.hits = 99;
        return validSave(s);
      }, exported),
      false,
    );
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('#questButton').tap({ force: engine === 'webkit' });
    await page.screenshot({
      path: '.qa/ember-journal-landscape-' + engine + '.jpg',
      animations: 'disabled',
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      engine +
        ': portal, physical bridge/gate, errors and learning, three dragon seals, construction, reload, rewards, village integrity and mobile layout PASS',
    );
  } finally {
    await browser.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
