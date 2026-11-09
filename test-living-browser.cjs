const assert = require('node:assert/strict'),
  fs = require('node:fs');
const { chromium, webkit } = require('playwright-core');
const [engine = 'chrome', url = 'http://localhost:8775/'] =
  process.argv.slice(2);
(async () => {
  fs.mkdirSync('.qa', { recursive: true });
  const browser =
    engine === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({
          channel: process.env.CI ? undefined : 'chrome',
          args: ['--enable-unsafe-swiftshader'],
        });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [],
      failed = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.error('BROWSER', e.stack);
    });
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(r.url());
    });
    await page.goto(url);
    await page.waitForSelector('#title:not(.hidden)');
    if (engine === 'webkit')
      await page.evaluate(() => (S.settings.sound = false));
    const tap = async (s) => {
      await page.locator(s).scrollIntoViewIfNeeded();
      await page.locator(s).tap();
    };
    await tap('#titleLiving');
    await page.waitForFunction(() => living?.assetCount > 0);
    assert.equal(await page.evaluate(() => validSave(S)), true);
    await tap('#livingStart');
    // Actual touchscreen construction: rows, outlines, a two-cell high doorway.
    async function build(index, width, depth, wallMaterial, roofMaterial) {
      if (index)
        await page.evaluate((i) => {
          exitLivingFocus();
          openLivingBuild(i);
        }, index);
      await page.selectOption('#livingWidth', String(width));
      await page.selectOption('#livingDepth', String(depth));
      await tap('[data-material="3"]');
      await page.selectOption('#livingBrush', 'row');
      for (let z = 0; z < depth; z++) await tap(`[data-x="0"][data-z="${z}"]`);
      for (const layer of [1, 2]) {
        await tap(`[data-layer="${layer}"]`);
        await tap(`[data-material="${wallMaterial}"]`);
        await page.selectOption('#livingBrush', 'outline');
        await tap('[data-x="0"][data-z="0"]');
        await tap('[data-material="0"]');
        await page.selectOption('#livingBrush', 'one');
        await tap(`[data-x="2"][data-z="${depth - 1}"]`);
      }
      await tap('[data-layer="3"]');
      await tap(`[data-material="${roofMaterial}"]`);
      await page.selectOption('#livingBrush', 'row');
      for (let z = 0; z < depth; z++) await tap(`[data-x="0"][data-z="${z}"]`);
      await tap('#livingTest');
      if (!(await page.evaluate((i) => living.reports[i].ok, index))) {
        console.log(
          await page.evaluate(() => ({
            report: livingReports(),
            feedback: $('livingFeedback').textContent,
            layer: livingFocus.layer,
            material: livingFocus.material,
            brush: livingFocus.brush,
            inv: S.inv,
          })),
        );
        await page.screenshot({ path: '.qa/living-failed-build.png' });
      }
      assert.equal(
        await page.evaluate((i) => living.reports[i].ok, index),
        true,
      );
      const coins = await page.evaluate(() => S.living.stock.coins);
      await tap('#livingTest');
      assert.equal(await page.evaluate(() => S.living.stock.coins), coins);
    }
    await build(0, 5, 5, 7, 8);
    await page.screenshot({ path: `.qa/living-${engine}-home.png` });
    await build(1, 6, 5, 16, 16);
    await build(2, 5, 6, 7, 8);
    assert.equal(
      await page.evaluate(() => living.reports.every((r) => r.ok)),
      true,
    );
    assert.equal(await page.evaluate(() => S.living.stock.coins), 9);
    console.log(
      'PASS touch-built three functional buildings; one-time rewards',
    );
    // Inspect live world and all three form factors, with no overlapping UI regions.
    for (const [width, height] of [
      [390, 720],
      [844, 390],
      [1024, 768],
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        livingFocus.preview = false;
        renderLivingBuildGrid();
      });
      await page.waitForTimeout(100);
      const geometry = await page.evaluate(() => {
        const r = (id) => {
          const q = $(id).getBoundingClientRect();
          return { top: q.top, bottom: q.bottom, left: q.left, right: q.right };
        };
        const controls = r('livingTools'),
          stage = r('livingStage');
        return {
          controls,
          stage,
          footerTop: document
            .querySelector('.living-focus-footer')
            .getBoundingClientRect().top,
          cells: livingFocus.hit.map((h) => {
            const q = h.el.getBoundingClientRect();
            return { x: q.x, y: q.y, w: q.width, h: q.height };
          }),
        };
      });
      assert(
        geometry.controls.bottom <= geometry.footerTop - 2,
        'Tools must remain above the feedback panel',
      );
      for (const c of geometry.cells) {
        assert(
          c.x >= 0 &&
            c.y >= 0 &&
            c.x + c.w <= width + 1 &&
            c.y + c.h <= height + 1,
        );
        assert(c.w >= 23 && c.h >= 23);
        assert(
          c.x + c.w <= geometry.controls.left ||
            c.x >= geometry.controls.right ||
            c.y + c.h <= geometry.controls.top ||
            c.y >= geometry.controls.bottom,
          'A construction cell must not overlap its toolbar',
        );
      }
      await page.screenshot({ path: `.qa/living-${engine}-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await tap('#livingExit');
    await page.evaluate(() => {
      S.living.water = 90;
      for (let i = 0; i < 45; i++)
        livingProduction(S.living, living.reports, 1);
    });
    assert.equal(await page.evaluate(() => S.living.stock.food), 12);
    await page.evaluate(() => {
      world.set(44, 8, 43, 0, true);
      refreshLivingBuildings();
      for (let i = 0; i < 50; i++)
        livingProduction(S.living, living.reports, 1);
    });
    assert.equal(await page.evaluate(() => S.living.stock.food), 12);
    await page.evaluate(() => {
      world.set(44, 8, 43, 16, true);
      refreshLivingBuildings();
    });
    console.log(
      'PASS real roof edit stops production; repairs restore eligibility',
    );
    const original = await page.evaluate(() =>
      livingVillage.world.data.reduce(
        (hash, id) => Math.imul(hash ^ id, 16777619) >>> 0,
        2166136261,
      ),
    );
    await page.evaluate(() => {
      saveGame(false);
    });
    await page.reload();
    await page.waitForSelector('#title:not(.hidden)');
    await tap('#playButton');
    await page.waitForFunction(() => living?.reports.every((r) => r.ok));
    assert.equal(await page.evaluate(() => validSave(S)), true);
    // Chariots: an invalid departure retains stock, then buttons load a valid order.
    await page.evaluate(() => {
      livingTravel('cargo');
      startLivingChallenge('cargo');
    });
    await tap('#livingTest');
    assert.equal(await page.evaluate(() => S.living.rounds.cargo), 0);
    const cargo = await page.evaluate(() => livingFocus.challenge.solution);
    for (let i = 0; i < cargo.length; i++)
      for (let j = 0; j < 2; j++)
        for (let k = 0; k < cargo[i][j]; k++)
          await tap(`[data-cargo="${i},${j},1"]`);
    await page.screenshot({ path: `.qa/living-${engine}-cargo.png` });
    await tap('#livingTest');
    await page.waitForSelector('#livingExplore');
    assert.equal(await page.evaluate(() => S.living.rounds.cargo), 1);
    assert.equal(await page.evaluate(() => S.living.deliveries), 1);
    await tap('#livingExplore');
    // Follow English instructions through the 3D terrain using the actual controls.
    await page.evaluate(() => {
      livingTravel('forest');
      startLivingChallenge('forest');
    });
    const commands = await page.evaluate(() => livingFocus.challenge.commands);
    for (const command of commands) await tap(`[data-direction="${command}"]`);
    await page.screenshot({ path: `.qa/living-${engine}-forest.png` });
    await tap('#livingTest');
    assert.equal(await page.evaluate(() => S.living.rounds.forest), 1);
    await tap('#livingExplore');
    await page.evaluate(() => {
      livingTravel('fossils');
      startLivingChallenge('fossils');
    });
    const n = await page.evaluate(() => livingFocus.challenge.layers.length);
    for (let i = n - 1; i >= 0; i--)
      await tap(`button[aria-label="Fouiller la couche ${i + 1}"]`);
    for (let i = 0; i < n; i++) await tap(`[data-fossil="${i}"]`);
    await page.screenshot({ path: `.qa/living-${engine}-fossils.png` });
    await tap('#livingTest');
    assert.equal(await page.evaluate(() => S.living.rounds.fossils), 1);
    await tap('#livingExplore');
    await page.evaluate(() => {
      livingTravel('volcano');
      startLivingChallenge('volcano');
    });
    const rotations = await page.evaluate(() => livingFocus.rotations);
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < (4 - rotations[i]) % 4; j++)
        await tap(`button[aria-label="Tourner le canal ${i + 1}"]`);
    await page.screenshot({ path: `.qa/living-${engine}-volcano.png` });
    await tap('#livingTest');
    await page.waitForSelector('#livingExplore');
    assert.equal(await page.evaluate(() => S.living.stock.metal), 2);
    await tap('#livingExplore');
    await page.evaluate(() => {
      livingTravel('grammar');
      startLivingChallenge('grammar');
    });
    const words = await page.evaluate(() => livingFocus.challenge.words.length);
    for (let i = 0; i < words; i++) await tap(`[data-word="${i}"]`);
    await tap('#livingTest');
    assert.equal(await page.evaluate(() => S.living.rounds.grammar), 1);
    await tap('#livingExplore');
    console.log(
      'PASS cargo, English route, excavation, channel and grammar missions',
    );
    await page.evaluate(() => {
      livingTravel('home');
      S.living.lights.fill(true);
      S.living.gate = [true, true, false];
      startLivingNight();
    });
    await page.evaluate(() => {
      for (let i = 0; i < 310 && living.night; i++) animateLiving(0.1);
    });
    assert.equal(await page.evaluate(() => S.living.nightWon), true);
    await tap('#livingExplore');
    // Persist the chapter, leave, compare original terrain, enter again.
    await page.evaluate(() => {
      saveGame(false);
      leaveLiving();
    });
    assert.equal(
      await page.evaluate(() =>
        world.data.reduce(
          (hash, id) => Math.imul(hash ^ id, 16777619) >>> 0,
          2166136261,
        ),
      ),
      original,
    );
    assert.equal(await page.evaluate(() => S.living.active), false);
    await page.evaluate(() => enterLiving());
    assert.equal(
      await page.evaluate(() => living.reports.every((r) => r.ok)),
      true,
    );
    assert.equal(await page.evaluate(() => validSave(S)), true);
    console.log(
      'PASS protected night, chapter save/reload and original-world isolation',
    );
    await page.waitForFunction(() => living?.assetCount > 0);
    console.log(
      'Models and placements',
      await page.evaluate(() => ({
        models: living.models,
        placements: living.assetCount,
      })),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log('PASS no browser errors or failed assets');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
