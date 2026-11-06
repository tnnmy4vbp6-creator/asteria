const assert = require('node:assert/strict');
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
    const tap = async (s) => {
      if (engine !== 'webkit') return page.locator(s).tap();
      // The Windows WebKit port can stall in the protocol scroll command.
      // Scroll the real element, then send a native touch at its visible centre.
      await page.locator(s).waitFor({ state: 'visible' });
      const point = await page.locator(s).evaluate((el) => {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      assert(
        point.x >= 0 &&
          point.x <= page.viewportSize().width &&
          point.y >= 0 &&
          point.y <= page.viewportSize().height,
      );
      await page.touchscreen.tap(point.x, point.y);
    };
    await page.goto(url);
    await page.waitForSelector('#titleBuilder', { state: 'visible' });
    // Compatibility fixture for the retired six-project flow. The new public
    // entry point is covered by test-restoration.cjs, without a numeric quiz.
    await page.evaluate(() => {
      S.restoration.site = -1;
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
      replacingSave = true;
    });
    await page.reload();
    await page.evaluate(() => {
      builderJournal = legacyBuilderJournal;
      $('titleBuilder').onclick = () => { beginPlay(); legacyBuilderJournal(); };
    });
    assert(
      await page.evaluate(
        () =>
          document.querySelector('.title-content').getBoundingClientRect()
            .bottom <
          document.querySelector('.title-bottom').getBoundingClientRect().top,
      ),
      'title and footer do not overlap',
    );
    await tap('#titleBuilder');
    assert.deepEqual(await page.evaluate(() => S.builder.sites), [0, 0, 0, 0]);
    async function tools(i) {
      await tap('[data-project="' + i + '"]');
      await tap('#projectTools');
    }
    async function configure(pattern, w, d, h) {
      await page.locator('#buildPattern').selectOption(pattern);
      for (const [id, value] of [
        ['width', w],
        ['depth', d],
        ['height', h],
      ])
        if (await page.locator('#build-' + id).isEnabled())
          await page.locator('#build-' + id).fill(String(value));
      await tap('#buildStart');
    }
    await tools(0);
    await page.locator('#buildPattern').selectOption('floor');
    await page.locator('#build-width').fill('9');
    await tap('#buildStart');
    assert.equal(
      await page.locator('#buildStart').isVisible(),
      true,
      'invalid dimension stays in tools',
    );
    await configure('floor', 3, 3, 1);
    await tap('#touchPlace');
    assert.equal(await page.evaluate(() => inspectBuildProject(0).missing), 3);
    const afterWrong = await page.evaluate(() => S.inv.mosaic);
    await tap('#questButton');
    await tap('#verifyBuilding');
    assert.equal(await page.locator('#repairBuild').count(), 1);
    await tap('#modalClose');
    await tap('#buildUndo');
    assert.equal(await page.evaluate(() => S.inv.mosaic), afterWrong + 9);
    await tap('#buildPalette');
    await configure('floor', 4, 3, 1);
    await tap('#touchPlace');
    const after = await page.evaluate(() => S.inv.mosaic);
    await tap('#touchPlace');
    assert.equal(
      await page.evaluate(() => S.inv.mosaic),
      after,
      'repeat pose cannot spend twice',
    );
    for (let i = 0; i < 6; i++) {
      if (i) {
        await tap('#questButton');
        await tools(i);
        const p = await page.evaluate((i) => BUILD_PROJECTS[i], i);
        await configure(p.pattern, p.width, p.depth, p.height);
        await tap('#touchPlace');
      }
      assert.deepEqual(
        await page.evaluate((i) => {
          const c = inspectBuildProject(i);
          return [c.missing, c.extra];
        }, i),
        [0, 0],
        'physical construction ' + i,
      );
      await tap('#questButton');
      await tap('#verifyBuilding');
      if (i === 0) {
        await page.locator('#numberInput').fill('7');
        await tap('#numberForm button');
        assert.equal(await page.evaluate(() => S.builder.completed.length), 0);
      }
      await page
        .locator('#numberInput')
        .fill(String([12, 5, 27, 35, 20, 6][i]));
      await tap('#numberForm button');
      await tap('#nextChallenge');
      assert.equal(
        await page.evaluate(() => S.builder.completed.length),
        i + 1,
      );
      if (i === 2) {
        await page.reload();
        await page.evaluate(() => { builderJournal = legacyBuilderJournal; });
        await tap('#playButton');
        assert.equal(await page.evaluate(() => S.builder.completed.length), 3);
        assert.equal(
          await page.evaluate(() => inspectBuildProject(2).missing),
          0,
        );
      }
    }
    const xp = await page.evaluate(() => S.xp);
    await page.evaluate(() => checkBuildProject());
    assert.equal(await page.evaluate(() => S.xp), xp);
    await page.evaluate(() => {
      S.builder.active = false;
      paused = true;
      S.time = 180;
      animateWorld(0);
      updateHUD();
      player.pos.set(12, 15, 76);
      player.yaw = 0;
      player.pitch = -0.55;
      movePlayer(0);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
    });
    await page.waitForFunction(() => world.dirty.size === 0);
    await page.evaluate(() => renderer.render(scene, camera));
    await page.screenshot({
      path: '.qa/builder-park-' + engine + '.jpg',
      animations: 'disabled',
    });
    await page.evaluate(() => {
      paused = false;
    });
    // Exercise real geometry and movement on a controlled platform, without replacing the world.
    assert(
      await page.evaluate(() => {
        for (let x = 60; x < 66; x++)
          for (let z = 8; z < 14; z++)
            for (let y = 19; y < 25; y++) world.set(x, y, z, y === 19 ? 3 : 0);
        world.set(62, 20, 10, buildID('stone', 'slab'));
        player.pos.set(62.5, 22, 10.5);
        player.velY = 0;
        keys = {};
        for (let i = 0; i < 100; i++) movePlayer(0.016);
        return player.pos.y > 20.45 && player.pos.y < 20.51;
      }),
      'player stands on the actual half-height surface',
    );
    assert(
      await page.evaluate(() => {
        S.builder = {
          ...S.builder,
          active: true,
          project: -1,
          material: 'stone',
          pattern: 'single',
          shape: 'slab',
          rotation: 1,
          mirror: false,
        };
        player.pos.set(64.5, 20, 10.5);
        target = {
          x: 62,
          y: 20,
          z: 10,
          id: buildID('stone', 'slab'),
          prev: { x: 62, y: 21, z: 10 },
        };
        const count = S.inv.stone;
        placeBuild();
        const merged = world.get(62, 20, 10) === 3 && S.inv.stone === count - 1;
        undoBuild();
        return (
          merged &&
          world.get(62, 20, 10) === buildID('stone', 'slab') &&
          S.inv.stone === count
        );
      }),
      'two halves merge and undo restores the original half',
    );
    // Place a rotated slope in the normal editable log, then verify import and reload.
    await page.evaluate(() => {
      S.builder = { ...S.builder, shape: 'wedge', rotation: 2 };
      target = { id: 3, x: 64, y: 19, z: 12, prev: { x: 64, y: 20, z: 12 } };
      placeBuild();
      saveGame(false);
    });
    const id = await page.evaluate(() => world.get(64, 20, 12));
    assert.equal(id, await page.evaluate(() => buildID('stone', 'wedge', 2)));
    if (engine === 'chrome') {
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.waitForFunction(() => navigator.serviceWorker.controller);
      await page.context().setOffline(true);
    }
    await page.reload();
    await tap('#playButton');
    assert.equal(await page.evaluate(() => world.get(64, 20, 12)), id);
    if (engine === 'chrome') await page.context().setOffline(false);
    assert.equal(await page.evaluate(() => validSave(S)), true);
    // Every new material/shape must survive the same save validator, including the other dimension.
    assert(
      await page.evaluate(() => {
        const s = JSON.parse(JSON.stringify(S));
        for (const [i, id] of [...BUILD_LOOKUP.values()].entries())
          s.ember.edits[8000 + i] = id;
        return validSave(s);
      }),
    );
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => builderPanel());
    await page.locator('[data-shape="sphere"]').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: '.qa/builder-shapes-' + engine + '.jpg',
      animations: 'disabled',
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await tap('#modalClose');
    await page.evaluate(() => {
      S.builder.active = true;
      updateHUD();
    });
    assert(
      await page.evaluate(() => {
        const a = $('buildTools').getBoundingClientRect(),
          b = document.querySelector('#hotbar').getBoundingClientRect();
        return a.left >= 0 && a.right <= innerWidth && a.bottom <= b.top;
      }),
      'landscape toolbar fits above inventory',
    );
    // A legacy user's blocks in prospective landmarks must never be flattened by migration.
    await page.evaluate(() => {
      const s = freshState();
      delete s.builder;
      s.edits[10 + 80 * (60 + 80 * 6)] = 7;
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      replacingSave = true;
    });
    await page.reload();
    await tap('#playButton');
    assert.equal(await page.evaluate(() => world.get(10, 6, 60)), 7);
    assert.equal(await page.evaluate(() => S.builder.sites[0]), 1);
    assert.deepEqual(errors, []);
    console.log(
      engine +
        ': six real buildings, errors, undo, counts, halves, rotations, collision, reload, labels and migration PASS',
    );
  } finally {
    await browser.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
