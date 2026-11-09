import { Howl, Howler } from 'howler';
import nipplejs from 'nipplejs';

let narration = null,
  ambientSound = null,
  ambientRegion = '',
  voiceEpoch = 0;
export function audioStatus() {
  return {
    voice: narration?.state() || 'none',
    speaking: !!narration?.playing(),
    ambient: ambientRegion,
  };
}
export function stopVoice() {
  voiceEpoch++;
  const previous = narration;
  narration = null;
  previous?.off();
  previous?.unload();
}
export function voice(id, fallback) {
  stopVoice();
  const epoch = voiceEpoch;
  narration = new Howl({
    src: ['./assets/voices/' + id + '.wav'],
    volume: 0.8,
    preload: true,
    onload() {
      if (epoch === voiceEpoch) narration.play();
    },
    onloaderror() {
      if (epoch === voiceEpoch) fallback?.();
    },
    onplayerror() {
      if (epoch === voiceEpoch) fallback?.();
    },
  });
}
export function listener(x, y, z, yaw) {
  Howler.pos(x, y, z);
  Howler.orientation(-Math.sin(yaw), 0, -Math.cos(yaw), 0, 1, 0);
}
export function stopAmbient() {
  const previous = ambientSound;
  ambientSound = null;
  ambientRegion = '';
  previous?.off();
  previous?.unload();
}
export function ambient(active, [region, x, z]) {
  if (!active) {
    stopAmbient();
    return;
  }
  if (region === ambientRegion) return;
  stopAmbient();
  ambientRegion = region;
  const source =
    region === 'forest'
      ? [14, 5, 18]
      : region === 'volcano'
        ? [65, 5, 51]
        : [33, 5, 54];
  ambientSound = new Howl({
    src: ['./assets/voices/ambient-' + region + '.wav'],
    loop: true,
    volume: 0.11,
    pos: source,
    pannerAttr: {
      panningModel: 'equalpower',
      distanceModel: 'inverse',
      refDistance: 8,
      maxDistance: 60,
      rolloffFactor: 0.8,
    },
  });
  ambientSound.play();
}
export function joystick(zone, onMove) {
  const thumb = zone.firstElementChild;
  const manager = nipplejs.create({
    zone,
    mode: 'static',
    position: { left: '50%', top: '50%' },
    size: zone.getBoundingClientRect().width || 108,
    color: '#d4d8ab',
    threshold: 0.08,
    restOpacity: 0.65,
    multitouch: false,
    maxNumberOfJoysticks: 1,
    dataOnly: false,
    dynamicPage: true,
  });
  // Keep a measurable anchor while the title hides the HUD. In v1 dataOnly
  // anchors are intentionally skipped by reposition(), so they would stay at 0,0.
  // Astéria supplies the visible ring/thumb; nipplejs supplies input and ownership.
  manager.all.forEach((stick) => {
    stick.ui.back.style.visibility = 'hidden';
    stick.ui.front.style.visibility = 'hidden';
    stick.ui.el.style.pointerEvents = 'none';
  });
  const reset = () => {
    onMove(0, 0);
    if (thumb) thumb.style.transform = '';
  };
  manager.on('move', (event) => {
    const data = event.data,
      dead = data.force < 0.08,
      x = dead ? 0 : data.vector.x,
      y = dead ? 0 : -data.vector.y;
    onMove(x, y);
    if (thumb) thumb.style.transform = `translate(${x * 29}px,${y * 29}px)`;
  });
  manager.on('end removed', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset();
  });
  return { manager, reset };
}
