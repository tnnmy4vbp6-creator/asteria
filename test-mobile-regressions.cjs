const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright-core');

// Arrange the four photographed scenes in a disposable browser profile.
// All checks run against the built game, including the downloaded animated model.
async function verify() {
  const url = process.argv[2] || 'http://localhost:8772/';
  const engine = process.argv[3] || 'chrome';
  const browser =
    engine === 'webkit'
      ? await webkit.launch()
      : await chromium.launch({
          channel: 'chrome',
          args: ['--enable-unsafe-swiftshader'],
        });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 695 },
      hasTouch: true,
      isMobile: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#playButton').tap();
    await page.waitForFunction(() =>
      animals.filter((a) => a.type === 'fox').every((a) => a.mixer),
    );
    const fox = await page.evaluate(() => {
      const a = animals.find((a) => a.type === 'fox');
      // Build a wall across a flat piece of road.
      world.fill(29, 5, 64, 41, 10, 74, 0);
      world.fill(29, 4, 64, 41, 4, 74, 1);
      world.fill(29, 5, 70, 41, 8, 70, 8);
      a.pos.set(35.5, 5, 66);
      a.angle = 0;
      const p = new THREE.Vector3(),
        q = new THREE.Vector3();
      let minimumDot = 1,
        entered = false,
        furthest = 0;
      for (let i = 0; i < 260; i++) {
        const prev = a.pos.clone();
        const moved = walkAnimal(a, 0.1, 0.65);
        if (!moved) continue;
        a.mixer.update(0.045);
        a.group.updateMatrixWorld(true);
        const head = a.group.getObjectByName('b_Head_05').getWorldPosition(p);
        const tail = a.group
          .getObjectByName('b_Tail01_012')
          .getWorldPosition(q);
        head.sub(tail);
        head.y = 0;
        const delta = a.pos.clone().sub(prev).normalize();
        minimumDot = Math.min(minimumDot, head.normalize().dot(delta));
        furthest = Math.max(furthest, a.pos.z);
        if (a.pos.x > 29 && a.pos.x < 42) {
          const box = new THREE.Box3().setFromObject(a.group, true);
          if (box.max.z > 70 && box.min.z < 71) entered = true;
        }
      }
      return { minimumDot, entered, furthest };
    });
    assert(fox.minimumDot > 0.85, JSON.stringify(fox));
    assert(!fox.entered, JSON.stringify(fox));
    assert(fox.furthest > 68, JSON.stringify(fox));
    await page.evaluate(() => {
      const borin = characters.find((c) => c.npc.id === 'borin');
      player.pos.copy(borin.pos);
      player.pos.z += 2.5;
      player.yaw = 0;
      player.pitch = 0;
      const sheep = animals.find((a) => a.type === 'sheep');
      sheep.pos.copy(player.pos);
      sheep.pos.z += 1;
      movePlayer(0.016);
      camera.updateMatrixWorld();
      updateTarget();
      updateHUD();
      toast('Choisis un bloc dans la barre, ou équipe-le depuis ton sac.');
      toast('Choisis un bloc dans la barre, ou équipe-le depuis ton sac.');
    });
    await page.waitForFunction(() => nearObject?.npc?.id === 'borin');
    for (const viewport of [
      { width: 390, height: 695 },
      { width: 695, height: 320 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForFunction(
        () => innerWidth === document.documentElement.clientWidth,
      );
      await page.evaluate(() => {
        updateTarget();
        toast('Choisis un bloc dans la barre, ou équipe-le depuis ton sac.');
      });
      assert.equal(
        await page.locator('#worldName:visible').innerText(),
        'Borin',
      );
      assert.equal(
        await page.locator('#interactPrompt span').innerText(),
        'Parler à Borin',
      );
      assert.equal(await page.locator('.toast').count(), 1);
      const collisions = await page.evaluate(() => {
        const ids = [
          '#worldName',
          '#interactPrompt',
          '.toast',
          '#joystick',
          '.touch-actions',
          '#hotbar',
          '#questTrack',
          '#minimap',
        ];
        const overlap = [];
        ids.forEach((id, i) => {
          const a = document.querySelector(id).getBoundingClientRect();
          for (const other of ids.slice(i + 1)) {
            const b = document.querySelector(other).getBoundingClientRect();
            if (
              a.width &&
              b.width &&
              Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
              Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)
            )
              overlap.push(id + ' / ' + other);
          }
        });
        return overlap;
      });
      assert.deepEqual(collisions, [], JSON.stringify(viewport));
      if (viewport.width === 390) {
        fs.mkdirSync(path.join(__dirname, '.qa'), { recursive: true });
        await page.screenshot({
          path: path.join(__dirname, '.qa', 'portrait-' + engine + '.png'),
        });
      }
    }
    const flower = await page.evaluate(() => {
      const [key, parts] = [...world.floraColumns].find(
        ([, parts]) => parts.length === 2,
      );
      const x = key % VW,
        z = Math.floor(key / VW),
        y = parts[0].base - 1;
      target = { x, y, z, id: 1 };
      mine(3);
      const hidden = parts.every((p) => {
        const m = new THREE.Matrix4();
        p.mesh.getMatrixAt(p.index, m);
        return m.determinant() === 0;
      });
      saveGame(false);
      return { key, hidden };
    });
    assert(flower.hidden);
    await page.reload();
    await page.locator('#playButton').tap();
    assert(
      await page.evaluate((key) => !world.floraColumns.has(key), flower.key),
    );
    assert.deepEqual(errors, []);
    console.log(
      engine,
      url,
      'PASS facing, wall, readable name, aimed NPC, HUD at 3 sizes, flower mining and reload',
      fox,
    );
  } finally {
    await browser.close();
  }
}
verify().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
