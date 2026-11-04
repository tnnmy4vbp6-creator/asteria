let stickInput = { x: 0, y: 0 };
function wireStick() {
  const base = $('joystick'),
    thumb = base.firstElementChild;
  let owner = null;
  function move(e) {
    if (e.pointerId !== owner) return;
    const rect = base.getBoundingClientRect();
    let x = (e.clientX - rect.left - rect.width / 2) / (rect.width * 0.35);
    let y = (e.clientY - rect.top - rect.height / 2) / (rect.height * 0.35);
    const len = Math.max(1, Math.hypot(x, y));
    x /= len;
    y /= len;
    stickInput = { x, y };
    thumb.style.transform = 'translate(' + x * 29 + 'px,' + y * 29 + 'px)';
  }
  function release() {
    owner = null;
    stickInput = { x: 0, y: 0 };
    thumb.style.transform = '';
  }
  base.onpointerdown = (e) => {
    if (owner !== null) return;
    e.preventDefault();
    owner = e.pointerId;
    base.setPointerCapture(owner);
    move(e);
  };
  base.onpointermove = move;
  base.onlostpointercapture = release;
  base.onpointercancel = release;
  base.onpointerup = (e) => {
    if (e.pointerId === owner) release();
  };
  window.addEventListener('blur', release);
}
function streamTerrain(force = false) {
  const cx = Math.floor(player.pos.x / 16),
    cz = Math.floor(player.pos.z / 16);
  const radius = graphicsTier() === 'low' ? 1 : 2;
  const stamp = [cx, cz, radius].join('/');
  if (!force && streamTerrain.last === stamp) return;
  streamTerrain.last = stamp;
  const wanted = new Set();
  for (let x = Math.max(0, cx - radius); x <= Math.min(4, cx + radius); x++) {
    for (let z = Math.max(0, cz - radius); z <= Math.min(4, cz + radius); z++) {
      if (Math.hypot(x - cx, z - cz) > radius + 0.45) continue;
      const key = x + ',' + z;
      wanted.add(key);
      if (!chunkMeshes.has(key)) world.dirty.add(key);
    }
  }
  for (const [key, mesh] of chunkMeshes) {
    if (wanted.has(key)) continue;
    chunkGroup.remove(mesh);
    mesh.geometry.dispose();
    chunkMeshes.delete(key);
  }
  streamTerrain.wanted = wanted;
}
function graphicsTier() {
  if (S.settings.quality !== 'auto') return S.settings.quality;
  return matchMedia('(pointer: coarse)').matches ? 'low' : 'medium';
}

let sampleSeconds = 0,
  sampleFrames = 0;
function adaptResolution(dt) {
  if (S.settings.quality !== 'auto' || graphicsTier() !== 'low' || dt > 0.25)
    return;
  sampleSeconds += dt;
  sampleFrames++;
  if (sampleSeconds < 2.5) return;
  const fps = sampleFrames / sampleSeconds;
  if (fps < 27 && renderer.getPixelRatio() > 0.65)
    renderer.setPixelRatio(Math.max(0.65, renderer.getPixelRatio() - 0.12));
  sampleSeconds = 0;
  sampleFrames = 0;
}
