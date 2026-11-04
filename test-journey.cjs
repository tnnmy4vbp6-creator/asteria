const { chromium } = require('playwright-core'),
  assert = require('node:assert/strict');
const url = process.argv[2] || 'http://localhost:8767/';
async function visit() {
  const b = await chromium.launch({
    channel: 'chrome',
    args: ['--enable-unsafe-swiftshader'],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('#playButton').click();
    await p.waitForFunction(() => nearObject?.id === 'zoe');
    await p.keyboard.press('e');
    await p.locator('#millGo').click();
    await p.keyboard.press('i');
    await p.locator('[data-craft="0"]').click();
    await p.keyboard.press('Escape');
    async function walk(key, axis, limit, sign) {
      await p.keyboard.down(key);
      try {
        await p.waitForFunction(
          ([a, n, s]) => player.pos[a] * s >= n * s,
          [axis, limit, sign],
          { timeout: 16000 },
        );
      } finally {
        await p.keyboard.up(key);
      }
    }
    await walk('d', 'x', 46, 1);
    await walk('w', 'z', 57, -1);
    await p.waitForFunction(() => nearObject?.id === 'wheel');
    await p.keyboard.press('e');
    await p.locator('#millGo').click();
    assert.equal(await p.evaluate(() => S.mill.stage), 2);
    await walk('w', 'z', 46.8, -1);
    await p.waitForFunction(() => nearObject?.id === 'gate');
    await p.keyboard.press('e');
    await p.locator('#testWheel').click();
    assert.match(await p.locator('#flow').textContent(), /manque/);
    await p.locator('[data-valve="2"]').click();
    await p.locator('[data-valve="0"]').click();
    await p.locator('#testWheel').click();
    assert.equal(await p.evaluate(() => S.mill.stage), 3);
    await p.locator('#millGo').click();
    await p.keyboard.press('Escape');
    const download = p.waitForEvent('download');
    await p.locator('#exportSave').click();
    const file = await (await download).path();
    await p.locator('#freeBuild').click();
    await p.locator('#playButton').click();
    assert.equal(await p.evaluate(() => profile.mode), 'creative');
    assert.equal(await p.evaluate(() => S.mill.stage), 0);
    await p.keyboard.press('Escape');
    await p.locator('#freeBuild').click();
    await p.locator('#playButton').click();
    assert.equal(await p.evaluate(() => S.mill.stage), 3);
    await p.reload();
    await p.locator('#profilesButton').click();
    await p.locator('[data-profile="1"][data-mode="adventure"]').click();
    await p.locator('#playButton').click();
    assert.equal(await p.evaluate(() => S.mill.stage), 0);
    await p.keyboard.press('Escape');
    await p.locator('#importSave').setInputFiles(file);
    await p.locator('#confirm').click();
    await p.locator('#playButton').click();
    assert.equal(await p.evaluate(() => S.mill.stage), 3);
    assert.equal(await p.evaluate(() => profile.slot), 1);
    assert.deepEqual(errors, []);
    console.log(
      'PASS parcours PC du départ à la vanne, mauvaise combinaison, irrigation, export, séparation créative, import dans un second profil : ' +
        url,
    );
  } finally {
    await b.close();
  }
}
visit().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
