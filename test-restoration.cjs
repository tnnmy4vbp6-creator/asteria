const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require('playwright-core');
const [engine = 'chrome', url = 'http://localhost:8775/'] =
  process.argv.slice(2);
(async () => {
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
    page.setDefaultTimeout(15000);
    const errors = [],
      failed = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(r.url());
    });
    const tap = async (s) => {
      await page.locator(s).waitFor({ state: 'visible' });
      const p = await page.locator(s).evaluate((e) => {
        e.scrollIntoView({ block: 'nearest' });
        const r = e.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await page.touchscreen.tap(p.x, p.y);
    };
    const slot = (i) => tap(`#restSlots [data-slot="${i}"]`);
    const piece = (s) => tap(`[data-rest-piece="${s}"]`);
    const trial = async (stage) => {
      await tap('#restTest');
      await page.waitForFunction(() => !restorationMode.trial);
      assert.equal(await page.evaluate(() => S.restoration.stage), stage);
    };
    async function layout() {
      const r = await page.evaluate(() => {
        const rect = (e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        return {
          slots: [...document.querySelectorAll('#restSlots button')].map(rect),
          panels: [
            ...document.querySelectorAll(
              '.rest-heading,#restSpeech,.rest-console',
            ),
          ].map(rect),
          w: innerWidth,
          h: innerHeight,
        };
      });
      const overlaps = (a, b) =>
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
      for (let i = 0; i < r.slots.length; i++) {
        const a = r.slots[i];
        assert(
          a.x >= 0 && a.y >= 0 && a.x + a.w <= r.w && a.y + a.h <= r.h,
          'slot inside viewport',
        );
        for (const b of r.slots.slice(i + 1))
          assert(!overlaps(a, b), 'touch slots do not overlap');
        for (const p of r.panels)
          assert(!overlaps(a, p), 'slot outside text panels');
      }
      assert(
        !overlaps(r.panels[1], r.panels[2]),
        'story and controls do not overlap',
      );
    }
    await page.goto(url);
    // Windows WebKit's media backend can stall the harness after repeated sounds.
    // Exercise its touch/render path silently; Chrome covers the audio-enabled path.
    if (engine === 'webkit')
      await page.evaluate(() => {
        S.settings.sound = false;
      });
    await tap('#titleBuilder');
    await tap('#restGo');
    await page.evaluate(() => sceneryReady);
    assert(
      await page.evaluate(
        () =>
          sceneryColliders.length >= 3 &&
          sceneryColliders.every((b) =>
            sceneryCollision(
              (b.min.x + b.max.x) / 2,
              b.min.y,
              (b.min.z + b.max.z) / 2,
            ),
          ),
      ),
      'large props have collisions',
    );
    const assets = await page.evaluate(() => ({
      models: sceneryReport.models,
      placements: sceneryReport.placements,
    }));
    assert.equal(assets.models, 30);
    await layout();
    for (const size of [
      { width: 844, height: 390 },
      { width: 1280, height: 720 },
      { width: 390, height: 720 },
    ]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(150);
      await layout();
    }
    await trial(0);
    for (const i of [0, 1, 3, 4]) await slot(i);
    await slot(2);
    assert.equal(
      await page.evaluate(() => S.restoration.pieces[0][2]),
      0,
      'budget refuses fifth cube',
    );
    await piece('slab');
    await slot(2);
    await slot(5);
    await trial(0);
    await tap('#restTurn');
    await slot(2);
    await slot(5);
    await tap('#restRemove');
    assert.equal(
      await page.evaluate(() => restorationStock(S.restoration.pieces[0]).slab),
      1,
    );
    await slot(5);
    await trial(1);
    assert(
      await page.evaluate(() => validSave(S)),
      'completed bridge is valid save',
    );
    fs.mkdirSync('.qa', { recursive: true });
    await page.screenshot({ path: `.qa/restoration-${engine}-bridge.png` });
    await tap('#restNext');
    await tap('#restGo');
    await layout();
    for (let i = 0; i < 4; i++) await slot(i);
    await trial(1);
    for (let i = 0; i < 3; i++) await tap('#restTurn');
    await slot(0);
    await slot(2);
    for (let i = 0; i < 2; i++) await tap('#restTurn');
    await slot(1);
    await slot(3);
    await trial(2);
    await page.screenshot({ path: `.qa/restoration-${engine}-roof.png` });
    await tap('#restNext');
    await tap('#restGo');
    await layout();
    await piece('cube');
    for (let i = 0; i < 3; i++) await slot(i);
    await trial(2);
    for (const [i, s] of ['sphere', 'pyramid', 'cylinder'].entries()) {
      await piece(s);
      await slot(i);
    }
    await trial(3);
    assert(
      await page.evaluate(
        () => restoration.signal.visible && restoration.cache.visible,
      ),
    );
    await page.screenshot({ path: `.qa/restoration-${engine}-signal.png` });
    await tap('#restExit');
    assert(
      await page.evaluate(() => camera.zoom === 1 && !camera.view?.enabled),
      'normal camera restored',
    );
    // The reward handler must be idempotent even if an interaction is repeated.
    const reward = await page.evaluate(() => {
      const before = S.inv.seed;
      claimRestorationReward();
      claimRestorationReward();
      return {
        seed: S.inv.seed - before,
        reward: S.restoration.reward,
        notes: S.journal.filter((s) => s.startsWith('rest:')).length,
        valid: validSave(S),
      };
    });
    assert.deepEqual(reward, { seed: 12, reward: true, notes: 3, valid: true });
    if (engine === 'chrome') {
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.waitForFunction(() => navigator.serviceWorker.controller);
      await page.context().setOffline(true);
    }
    await page.reload();
    await tap('#titleBuilder');
    assert(
      await page.evaluate(
        () =>
          S.restoration.stage === 3 &&
          S.restoration.reward &&
          restorationSolved(0, S.restoration.pieces[0]),
      ),
      'save restored',
    );
    await page.evaluate(() => sceneryReady);
    if (engine === 'chrome') await page.context().setOffline(false);
    const invalid = await page.evaluate(() => {
      const bad = JSON.parse(JSON.stringify(S.restoration));
      bad.pieces[0] = [1, 1, 1, 1, 1, 1];
      return validRestoration(bad);
    });
    assert(!invalid, 'overdrawn stock rejected');
    for (const both of [false, true]) {
      await page.evaluate((both) => {
        const s = freshState();
        s.builder.sites = [0, 0, 0, 0];
        s.edits[10 + 80 * (60 + 80 * 6)] = 7;
        if (both) s.edits[60 + 80 * (5 + 80 * 6)] = 7;
        localStorage.setItem(SAVE_KEY, JSON.stringify(s));
        replacingSave = true;
      }, both);
      await page.reload();
      await tap('#titleBuilder');
      assert.equal(
        await page.evaluate(() => world.get(10, 6, 60)),
        7,
        'old construction preserved',
      );
      if (both) {
        assert.equal(await page.evaluate(() => world.get(60, 6, 5)), 7);
        assert.equal(
          await page.evaluate(() => restoration),
          null,
          'occupied sites never replaced',
        );
      } else
        assert.equal(
          await page.evaluate(() => S.restoration.site),
          1,
          'alternate site used',
        );
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log(
      JSON.stringify(
        {
          engine,
          assets,
          checks:
            'three physical repairs, errors and recovery, stock, undo, responsive touch geometry, rewards once, persistence, valid saves, assets loaded',
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
