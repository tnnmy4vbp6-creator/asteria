const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium, webkit } = require('playwright-core');
const [engine = 'webkit', target] = process.argv.slice(2);

// Serve two genuine releases on the same origin, retaining the old worker,
// open tab and storage across the deployment. Alternatively inspect a live URL.
async function verify() {
  const live = /^https?:/.test(target);
  let directory = live ? null : path.resolve(target);
  let server;
  let base = target;
  if (!live) {
    const types = {
      '.js': 'text/javascript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.png': 'image/png',
      '.ogg': 'audio/ogg',
      '.glb': 'model/gltf-binary',
      '.webmanifest': 'application/manifest+json',
    };
    server = http.createServer((req, res) => {
      const name =
        new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
      const file = path.resolve(directory, name);
      if (!file.startsWith(directory + path.sep) || !fs.existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'text/plain',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(file).pipe(res);
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = 'http://127.0.0.1:' + server.address().port + '/';
  }
  const browser =
    engine === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({
          channel: 'chrome',
          args: ['--enable-unsafe-swiftshader'],
        });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 695 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const p = await ctx.newPage();
    await p.goto(base);
    await p.locator('#playButton').tap();
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForFunction(() => !!navigator.serviceWorker.controller);
    await p.evaluate(() => {
      const atlas = characters.find((c) => c.npc.id === 'atlas');
      player.pos.copy(atlas.pos);
      player.pos.z += 2.8;
      player.yaw = 0;
      player.pitch = 0.14;
      S.tracked = 'borin';
      S.millDismissed = true;
      S.time = 396.5;
      S.inv.wood = 9;
      S.inv.plank = 19;
      saveGame(false);
    });
    if (!live) {
      assert.equal(await p.locator('#worldName').count(), 0);
      directory = path.join(__dirname, 'dist');
    }
    // Navigate the same client without clearing anything or closing Safari.
    await p.goto(
      new URL('jouer.html?v=' + require('./package.json').version, base).href,
    );
    assert.equal(await p.locator('.edition').innerText(), 'ASTÉRIA · VERSION ' + require('./package.json').version);
    await p.locator('#playButton').tap();
    await p.waitForFunction(
      () =>
        nearObject?.npc?.id === 'atlas' &&
        !document.querySelector('#worldName').hidden,
    );
    assert.equal(await p.locator('#worldName').innerText(), 'Atlas');
    const info = await p.evaluate(() => {
      const name = document.querySelector('#worldName'),
        r = name.getBoundingClientRect();
      return {
        name: name.textContent,
        size: parseFloat(getComputedStyle(name).fontSize),
        inside:
          r.left >= 0 &&
          r.top >= 0 &&
          r.right <= innerWidth &&
          r.bottom <= innerHeight,
        wood: S.inv.wood,
        planks: S.inv.plank,
        quest: S.tracked,
      };
    });
    assert(info.inside && info.size >= 22);
    assert.equal(info.wood, 9);
    assert.equal(info.planks, 19);
    assert.equal(info.quest, 'borin');
    fs.mkdirSync(path.join(__dirname, '.qa'), { recursive: true });
    await p.screenshot({
      path: path.join(__dirname, '.qa', 'Atlas-' + engine + '.png'),
    });
    await p.waitForFunction(async () => {
      const r = await navigator.serviceWorker.ready;
      return (
        !!r.active &&
        (
          await Promise.all(
            (await caches.keys()).map(
              async (k) =>
                !!(await (
                  await caches.open(k)
                ).match(new URL('jouer.html', location.href))),
            ),
          )
        ).some(Boolean)
      );
    });
    await ctx.setOffline(true);
    await p.reload();
    await p.locator('#playButton').tap();
    await p.waitForFunction(
      () => document.querySelector('#worldName')?.textContent === 'Atlas',
    );
    console.log(
      engine,
      live ? 'HTTPS' : 'mise à jour depuis 2.1.0',
      JSON.stringify(info),
      'offline OK',
    );
  } finally {
    await browser.close();
    if (server) server.close();
  }
}
verify().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
