const { chromium, webkit } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path');
const url = process.argv[2] || 'http://localhost:8767/';
const engine = process.argv[3] || 'chrome';
async function run() {
  const b =
    engine === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({
          channel: 'chrome',
          args: ['--enable-unsafe-swiftshader'],
        });
  try {
    const ctx = await b.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 1024, height: 768 },
    });
    const p = await ctx.newPage(),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text() + ' ' + m.location().url);
    });
    const start = Date.now();
    await p.goto(url);
    await p.locator('#playButton').tap();
    const launchMs = Date.now() - start;
    await p.waitForFunction(() =>
      animals.filter((a) => a.type === 'fox').every((a) => a.mixer),
    );
    await p.waitForFunction(() => nearObject?.id === 'zoe');
    await p.locator('#touchUse').tap();
    await p.locator('#millGo').tap();
    assert.equal(await p.evaluate(() => S.mill.stage), 1);
    if (engine === 'chrome') {
      const stick = await p.locator('#joystick').boundingBox(),
        cdp = await ctx.newCDPSession(p);
      const before = await p.evaluate(() => player.pos.z);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: stick.x + stick.width / 2, y: stick.y + 18 }],
      });
      await p.waitForTimeout(550);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      assert((await p.evaluate(() => player.pos.z)) < before);
    }
    await p.locator('#bagButton').tap();
    await p.locator('[data-craft="0"]').tap();
    await p.locator('#modalClose').tap();
    assert.equal(await p.evaluate(() => S.inv.plank), 4);
    const sample = await p.evaluate(async () => {
      let last;
      const times = [];
      for (let i = 0; i < 91; i++)
        await new Promise((r) =>
          requestAnimationFrame((t) => {
            if (last) times.push(t - last);
            last = t;
            r();
          }),
        );
      times.sort((x, y) => x - y);
      return {
        fps: Math.round((1000 * times.length) / times.reduce((a, b) => a + b)),
        p95ms: times[85],
        heapMB: performance.memory?.usedJSHeapSize / 1e6,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        chunks: chunkMeshes.size,
      };
    });
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForFunction(() => !!navigator.serviceWorker.controller);
    await ctx.setOffline(true);
    await p.reload();
    await p.locator('#playButton').tap();
    assert.equal(await p.evaluate(() => S.mill.stage), 1);
    assert.equal(await p.evaluate(() => S.inv.plank), 4);
    await p.locator('#pauseButton').tap();
    await p.locator('#parentMenu').tap();
    assert.match(await p.locator('#modalBody').textContent(), /parcours/);
    await p.locator('#modalClose').tap();
    const dir = path.join(__dirname, '.qa');
    fs.mkdirSync(dir, { recursive: true });
    await p.screenshot({ path: path.join(dir, engine + '.jpg') });
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        engine,
        url,
        launchMs,
        ...sample,
        offline: true,
        pageErrors: errors,
      }),
    );
  } finally {
    await b.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
