const assert = require('node:assert/strict'),
  { chromium } = require('playwright-core');
const url = process.argv[2] || 'http://localhost:8775/';
(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--enable-unsafe-swiftshader'],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 720 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('#title:not(.hidden)');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await page.locator('#titleLiving').tap();
    await page.waitForFunction(() => living?.assetCount > 0);
    await page.locator('#livingRead').tap();
    await page.waitForFunction(() => GamePlatform.audioStatus().speaking);
    // Replacing a playing voice and immediately closing a loading sound must be safe.
    await page.evaluate(() => {
      livingVoice('left', 'left');
      GamePlatform.stopVoice();
      livingVoice('right', 'right');
    });
    await page.waitForFunction(() => GamePlatform.audioStatus().speaking);
    await page.locator('#modalClose').tap();
    assert.equal(
      await page.evaluate(() => GamePlatform.audioStatus().speaking),
      false,
    );
    console.log(
      'PASS local narrated audio plays, replaces and stops without race',
    );
    const cdp = await context.newCDPSession(page);
    const box = await page.locator('#joystick').boundingBox();
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const before = await page.evaluate(() => player.pos.z);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x, y: y - 38 }],
    });
    await page.waitForTimeout(700);
    const moved = await page.evaluate(() => ({
      z: player.pos.z,
      input: { ...stickInput },
    }));
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    assert(moved.z < before - 0.6, JSON.stringify({ before, moved }));
    assert(moved.input.y < -0.5);
    assert.deepEqual(await page.evaluate(() => stickInput), { x: 0, y: 0 });
    // Two fingers: right finger turns the view, the left stick continues moving.
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x, y: y - 32 }],
    });
    const yaw = await page.evaluate(() => player.yaw);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x, y: y - 32 },
        { id: 2, x: 310, y: 300 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 1, x, y: y - 32 },
        { id: 2, x: 270, y: 300 },
      ],
    });
    assert.notEqual(await page.evaluate(() => player.yaw), yaw);
    await page.evaluate(() => settings());
    assert.deepEqual(await page.evaluate(() => stickInput), { x: 0, y: 0 });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    await page.locator('#modalClose').tap();
    console.log(
      'PASS real touch stick, simultaneous camera finger and pause reset',
    );
    await page.evaluate(() => openLivingBuild(0));
    for (let i = 0; i < 8; i++)
      await page.locator('[data-x="0"][data-z="0"]').tap();
    assert.equal(await page.evaluate(() => visualViewport.scale), 1);
    assert.equal(await page.evaluate(() => getSelection().toString()), '');
    assert.equal(await page.evaluate(() => world.get(25, 5, 42)), 7);
    assert.equal(await page.evaluate(() => S.inv.plank), 239);
    await page.locator('#livingExit').tap();
    await page.evaluate(() => saveGame(false));
    console.log(
      'PASS rapid construction taps do not zoom, select text or duplicate cost',
    );
    const original = await page.evaluate(() => JSON.stringify(S.living.edits));
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('#title:not(.hidden)');
    await page.locator('#playButton').tap();
    await page.waitForFunction(() => living?.assetCount > 0);
    assert.equal(
      await page.evaluate(() => JSON.stringify(S.living.edits)),
      original,
    );
    await page.evaluate(() => livingVoice('welcome', ''));
    await page.waitForFunction(() => GamePlatform.audioStatus().speaking);
    assert.equal(await page.evaluate(() => validSave(S)), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS offline reload preserves edits and plays cached narration and GLBs',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
