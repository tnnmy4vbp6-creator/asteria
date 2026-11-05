import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export async function dressWatchers(watchers) {
  const [asset, skin] = await Promise.all([
    new GLTFLoader().loadAsync('./assets/models/brume.glb'),
    new THREE.TextureLoader().loadAsync('./assets/textures/brume.png'),
  ]);
  skin.colorSpace = THREE.SRGBColorSpace;
  skin.magFilter = THREE.NearestFilter;
  const material = new THREE.MeshStandardMaterial({ map: skin, roughness: 1 });
  for (const watcher of watchers) {
    const body = clone(asset.scene);
    watcher.mixer = new THREE.AnimationMixer(body);
    watcher.idle = watcher.mixer.clipAction(THREE.AnimationClip.findByName(asset.animations, 'idle'));
    watcher.run = watcher.mixer.clipAction(THREE.AnimationClip.findByName(asset.animations, 'run'));
    watcher.motion = watcher.idle.play();
    watcher.mixer.update(0);
    body.updateMatrixWorld(true);
    // The exported skin's bind-pose box differs from its posed vertices.
    const box = new THREE.Box3().setFromObject(body, true);
    const scale = 1.8 / (box.max.y - box.min.y);
    body.scale.setScalar(scale);
    body.position.set(-(box.min.x + box.max.x) * scale / 2, -box.min.y * scale,
      -(box.min.z + box.max.z) * scale / 2);
    body.traverse((part) => {
      if (part.isMesh) {
        part.material = material;
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    watcher.group.add(body);
  }
}

export async function dressFoxes(foxes) {
  const asset = await new GLTFLoader().loadAsync('./assets/models/Fox.glb');
  for (const fox of foxes) {
    const body = clone(asset.scene);
    const box = new THREE.Box3().setFromObject(body);
    const scale = 1.0 / (box.max.y - box.min.y);
    body.scale.setScalar(scale);
    body.position.y = -box.min.y * scale;
    // The GLB faces +Z, the same forward axis as animal movement.
    body.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    const mixer = new THREE.AnimationMixer(body);
    const walk = mixer.clipAction(
      asset.animations.find((clip) => clip.name.toLowerCase() === 'walk') ||
        asset.animations[0],
    );
    walk.play();
    fox.group.children.forEach((part) => {
      if (part.material) part.material.dispose();
    });
    fox.group.clear();
    fox.limbs = [];
    fox.group.add(body);
    fox.mixer = mixer;
  }
}
