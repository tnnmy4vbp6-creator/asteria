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
    await page.goto(url);
    await page.locator('#titleVoyage').tap();
    await page.locator('#launchJob').tap();
    await page.locator('#touchUse').tap();
    await page.locator('[data-choice="1"]').tap();
    assert.match(await page.locator('#feedback').innerText(), /sème/);
    await page.locator('[data-choice="0"]').tap();
    // Exit during feedback: the stage and parent record must already be durable.
    await page.reload();
    await page.locator('#playButton').tap();
    assert.deepEqual(
      await page.evaluate(() => [
        nextJob().s.subject,
        S.practice['v:jardin:anglais'].errors,
      ]),
      ['grammaire', 1],
    );

    // Exercise the other stages with the actual travel, aiming, form and hand handlers.
    const result = await page.evaluate(() => {
      let count = 0;
      while (nextJob() && count++ < 36) {
        const job = nextJob();
        goToJob(job);
        movePlayer(0);
        camera.updateMatrixWorld();
        updateTarget();
        if (nearObject?.npc?.id !== job.npc.id)
          throw Error('Destination inaccessible : ' + job.npc.name);
        useAimedObject();
        const c = currentChallenge;
        if (c.practiceId !== voyageKey(job.v, job.s))
          throw Error('Commande inattendue');
        if (c.type === 'choice')
          document.querySelector('[data-choice="' + c.answer + '"]').click();
        if (c.type === 'number') {
          $('numberInput').value = c.answer;
          $('numberForm').requestSubmit();
        }
        if (c.type === 'write') {
          $('wordInput').value = c.answer;
          $('wordForm').requestSubmit();
        }
        if (c.type === 'pack') {
          let left = c.answer;
          for (const n of c.lots)
            while (left >= n) {
              document.querySelector('[data-lot="' + n + '"]').click();
              left -= n;
            }
          $('packCheck').click();
        }
        if (c.type === 'order')
          for (const v of c.answer)
            [...document.querySelectorAll('[data-order]')]
              .find((b) => b.textContent === v)
              .click();
        if (!S.journal.includes(c.practiceId))
          throw Error('Échec : ' + c.title);
        $('nextChallenge').click();
      }
      const checks = [
        count,
        boatFlags.filter((f) => f.visible).length,
        validSave(S),
        S.journal.filter((k) => k.startsWith('v:')).length,
      ];
      const xp = S.xp,
        seeds = S.inv.seed;
      doJob(VOYAGES[0], VOYAGES[0].steps[0], true);
      document.querySelector('[data-choice="0"]').click();
      checks.push(S.xp === xp && S.inv.seed === seeds);
      closeModal();
      inventory('craft');
      const before = S.inv.wood,
        planks = S.inv.plank || 0;
      document.querySelector('[data-batch="0"]').click();
      $('numberInput').value = '1';
      $('numberForm').requestSubmit();
      checks.push(S.inv.wood === before);
      $('numberInput').value = '2';
      $('numberForm').requestSubmit();
      checks.push(
        S.inv.wood === before - 2 && S.inv.plank === planks + 8,
        validSave(S),
      );
      return checks;
    });
    assert.deepEqual(result, [35, 6, true, 36, true, true, true, true]);
    await page.reload();
    await page.locator('#playButton').tap();
    assert.equal(
      await page.evaluate(() => boatFlags.filter((f) => f.visible).length),
      6,
    );
    assert.deepEqual(errors, []);
    console.log(
      engine,
      '36 étapes, six livraisons, révision, double recette et sauvegarde OK',
    );
  } finally {
    await browser.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
