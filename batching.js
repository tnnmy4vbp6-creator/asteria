// Les pièces rigides partagent un draw call. Bras, jambes, sprites et objets animés restent indépendants.
const paintedSurface = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 1,
});
function batchRigidParts(group, keep = []) {
  const parts = group.children.filter(
    (part) =>
      part.isMesh &&
      part.geometry === CUBE &&
      !part.material.emissive?.getHex() &&
      !part.material.transparent &&
      !keep.includes(part),
  );
  if (parts.length < 2) return;
  const positions = [],
    normals = [],
    colors = [],
    indices = [];
  const vector = new THREE.Vector3(),
    normalMatrix = new THREE.Matrix3();
  const position = CUBE.getAttribute('position'),
    normal = CUBE.getAttribute('normal');
  for (const part of parts) {
    part.updateMatrix();
    normalMatrix.getNormalMatrix(part.matrix);
    const offset = positions.length / 3,
      color = part.material.color;
    for (let i = 0; i < position.count; i++) {
      vector.fromBufferAttribute(position, i).applyMatrix4(part.matrix);
      positions.push(vector.x, vector.y, vector.z);
      vector.fromBufferAttribute(normal, i).applyNormalMatrix(normalMatrix);
      normals.push(vector.x, vector.y, vector.z);
      colors.push(color.r, color.g, color.b);
    }
    for (const index of CUBE.index.array) indices.push(index + offset);
    group.remove(part);
    part.material.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  for (const [name, values] of [
    ['position', positions],
    ['normal', normals],
    ['color', colors],
  ])
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, paintedSurface);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}
function batchVillage() {
  for (const npc of characters)
    batchRigidParts(npc.group, [...npc.arms, ...npc.legs]);
  for (const a of animals)
    if (a.type !== 'fox') batchRigidParts(a.group, a.limbs);
  for (const cloud of clouds) batchRigidParts(cloud);
  for (const o of interactive)
    if (['mill', 'treasure'].includes(o.kind))
      batchRigidParts(o.group, [millStream]);
  if (millWheel) {
    // Les huit bras sont solidaires du même axe.
    for (const arm of [...millWheel.children]) {
      for (const part of [...arm.children]) {
        arm.updateMatrix();
        part.applyMatrix4(arm.matrix);
        millWheel.add(part);
      }
      millWheel.remove(arm);
    }
    batchRigidParts(millWheel);
  }
}
