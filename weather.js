// The weather front crosses the valley at a different time each day.
function weatherAt(time, x, z) {
  const day = Math.floor(time / 720);
  const start = 165 + ((day * 47) % 180);
  const age = (time % 720) - start;
  if (age < 0 || age >= 105 || x >= 55) return '';
  return z < 22 && x < 54 ? 'Neige' : 'Pluie';
}

function roofAt(x, z) {
  for (let y = VH - 1; y > 0; y--) {
    if (world.solid(x, y, z)) return y + 1;
  }
  return 0;
}

let precipitation,
  lastWeatherSecond = -1;
function animateWeather() {
  const second = Math.floor(S.time);
  if (playing && second !== lastWeatherSecond) {
    lastWeatherSecond = second;
    let changed = false;
    for (const plot of cropMeshes) {
      const crop = S.crops[plot.id];
      if (
        !crop ||
        crop.watered ||
        weatherAt(S.time, plot.pos.x, plot.pos.z) !== 'Pluie'
      )
        continue;
      if (
        roofAt(Math.floor(plot.pos.x), Math.floor(plot.pos.z)) >
        plot.pos.y + 0.1
      )
        continue;
      crop.watered = true;
      changed = true;
    }
    if (changed) {
      refreshCrops();
      saveGame(false);
    }
  }
  const weather = playing && weatherAt(S.time, player.pos.x, player.pos.z);
  if (!weather) {
    if (precipitation) precipitation.visible = false;
    return;
  }
  const count = 96;
  if (!precipitation) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(count * 6), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    precipitation = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0xe3efff,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    precipitation.frustumCulled = false;
    scene.add(precipitation);
  }
  precipitation.visible = true;
  const snow = weather === 'Neige';
  const drops = precipitation.geometry.attributes.position;
  const cx = Math.floor(player.pos.x),
    cz = Math.floor(player.pos.z);
  for (let i = 0; i < count; i++) {
    // Tile the positions in world space so the shower stays still when the player walks.
    const wrap = (v) => ((v % 14) + 14) % 14;
    const x =
      cx - 7 + wrap(i * 5.753 - cx) + (snow ? Math.sin(elapsed + i) * 0.22 : 0);
    const z = cz - 7 + wrap(i * 3.317 - cz);
    const fall = (elapsed * (snow ? 1.1 : 7.2) + i * 1.471) % 9;
    const y = player.pos.y + 8 - fall;
    const aboveGround = y >= roofAt(Math.floor(x), Math.floor(z));
    drops.setXYZ(i * 2, x, y, z);
    drops.setXYZ(
      i * 2 + 1,
      x + (aboveGround ? 0.035 : 0),
      y + (aboveGround ? (snow ? 0.05 : 0.36) : 0),
      z,
    );
  }
  drops.needsUpdate = true;
  sun.intensity *= 0.68;
  scene.background.multiplyScalar(0.85);
  scene.fog.color.copy(scene.background);
}
