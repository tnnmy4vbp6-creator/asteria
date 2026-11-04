import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';

export async function dressFoxes(foxes){
  const asset=await new GLTFLoader().loadAsync('./assets/models/Fox.glb');
  for(const fox of foxes){
    const body=clone(asset.scene);
    const box=new THREE.Box3().setFromObject(body);
    const scale=1.0/(box.max.y-box.min.y);
    body.scale.setScalar(scale);
    body.position.y=-box.min.y*scale;
    body.rotation.y=Math.PI;
    body.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}});
    const mixer=new THREE.AnimationMixer(body);
    const walk=mixer.clipAction(asset.animations.find(clip=>clip.name.toLowerCase()==='walk')||asset.animations[0]);
    walk.play();
    fox.group.children.forEach(part=>{if(part.material)part.material.dispose()});
    fox.group.clear();fox.limbs=[];fox.group.add(body);fox.mixer=mixer;
  }
}

