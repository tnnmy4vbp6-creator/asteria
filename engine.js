const VW = 80,
  VH = 30,
  VD = 80;
const BLOCKS = {
  1: { name: 'Herbe', drop: 'dirt', color: '#79904b', hard: 0.55 },
  2: { name: 'Terre', drop: 'dirt', color: '#8d6849', hard: 0.45 },
  3: { name: 'Pierre', drop: 'stone', color: '#8d9691', hard: 0.9, tool: 1 },
  4: { name: 'Bûche', drop: 'wood', color: '#806047', hard: 0.8 },
  5: { name: 'Feuillage', drop: 'leaf', color: '#557743', hard: 0.25 },
  6: { name: 'Sable', drop: 'sand', color: '#d4bc83', hard: 0.45 },
  7: { name: 'Planches', drop: 'plank', color: '#b08b5c', hard: 0.6 },
  8: { name: 'Briques', drop: 'brick', color: '#89968d', hard: 1, tool: 1 },
  9: {
    name: 'Minerai de charbon',
    drop: 'coal',
    color: '#626761',
    hard: 1,
    tool: 1,
  },
  10: {
    name: 'Minerai de fer',
    drop: 'ironOre',
    color: '#98867a',
    hard: 1.2,
    tool: 2,
  },
  11: {
    name: 'Cristal brut',
    drop: 'crystal',
    color: '#87b7b6',
    hard: 1.4,
    tool: 3,
  },
  12: { name: 'Établi', drop: 'bench', color: '#926b40', hard: 0.8 },
  13: { name: 'Four', drop: 'furnace', color: '#626e6b', hard: 1, tool: 1 },
  14: { name: 'Coffre', drop: 'chest', color: '#b48647', hard: 0.8 },
  15: { name: 'Neige', drop: 'snow', color: '#dee9df', hard: 0.4 },
  16: { name: 'Verre', drop: 'glass', color: '#a9d5d0', hard: 0.3 },
  17: {
    name: 'Toit de terre cuite',
    drop: 'brick',
    color: '#a9684c',
    hard: 0.8,
  },
  18: {
    name: 'Pierre du portail',
    color: '#606379',
    hard: 99,
    protected: true,
  },
  19: { name: 'Socle du monde', color: '#3b4542', hard: 99, protected: true },
  20: { name: 'Chemin', drop: 'sand', color: '#ab9d77', hard: 0.5 },
  21: { name: 'Torche', drop: 'torch', color: '#d7a85e', hard: 0.2 },
  22: { name: 'Cactus', drop: 'leaf', color: '#6f8d53', hard: 0.4 },
  23: { name: 'Lit', drop: 'bed', color: '#a76e68', hard: 0.5 },
};
const PLACE = {
  dirt: 2,
  stone: 3,
  wood: 4,
  leaf: 5,
  sand: 6,
  plank: 7,
  brick: 8,
  bench: 12,
  furnace: 13,
  chest: 14,
  snow: 15,
  glass: 16,
  torch: 21,
  bed: 23,
};
function rand(x, z, k = 0) {
  let n = Math.sin(x * 127.1 + z * 311.7 + k * 71.7) * 43758.5453;
  return n - Math.floor(n);
}
class VoxelWorld {
  constructor() {
    this.data = new Uint8Array(VW * VH * VD);
    this.heights = new Int8Array(VW * VD);
    this.trees = [];
    this.floraColumns = new Map();
    this.dirty = new Set();
    this.protected = new Set();
    this.generate();
  }
  index(x, y, z) {
    return x + VW * (z + VD * y);
  }
  inBounds(x, y, z) {
    return x >= 0 && x < VW && z >= 0 && z < VD && y >= 0 && y < VH;
  }
  get(x, y, z) {
    return this.inBounds(x, y, z) ? this.data[this.index(x, y, z)] : 0;
  }
  set(x, y, z, id, edit = false) {
    if (!this.inBounds(x, y, z)) return;
    this.data[this.index(x, y, z)] = id;
    if (edit) {
      S.edits[this.index(x, y, z)] = id;
      this.refreshFloraAt(x, z);
      for (let [dx, dz] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        let cx = Math.floor((x + dx) / 16),
          cz = Math.floor((z + dz) / 16);
        if (cx >= 0 && cx < 5 && cz >= 0 && cz < 5)
          this.dirty.add(cx + ',' + cz);
      }
    }
  }
  refreshFloraAt(x, z) {
    const parts = this.floraColumns.get(x + VW * z);
    if (!parts) return;
    for (const { mesh, index, matrix, base } of parts) {
      const grows =
        this.get(x, base - 1, z) === 1 && this.get(x, base, z) === 0;
      mesh.setMatrixAt(
        index,
        grows ? matrix : new THREE.Matrix4().makeScale(0, 0, 0),
      );
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  // Keep overlapping crowns if a neighbouring intact tree still carries them.
  settleTrees() {
    const supported = new Set(),
      detached = new Set();
    let fallenLogs = 0;
    for (const tree of this.trees) {
      let rooted = this.solid(tree.x, tree.y - 1, tree.z);
      for (let y = tree.y; y <= tree.top; y++) {
        const key = this.index(tree.x, y, tree.z);
        const log = this.get(tree.x, y, tree.z) === 4;
        if (!rooted && log && !Object.hasOwn(S.edits, key)) {
          this.set(tree.x, y, tree.z, 0, true);
          fallenLogs++;
        }
        rooted = rooted && log;
      }
      for (const key of tree.crown) (rooted ? supported : detached).add(key);
    }
    for (const key of detached) {
      if (
        !supported.has(key) &&
        this.data[key] === 5 &&
        !Object.hasOwn(S.edits, key)
      ) {
        this.set(
          key % VW,
          Math.floor(key / (VW * VD)),
          Math.floor(key / VW) % VD,
          0,
          true,
        );
      }
    }
    return fallenLogs;
  }
  solid(x, y, z) {
    let t = this.get(x, y, z);
    return t !== 0 && t !== 21;
  }
  top(x, z) {
    x = Math.max(0, Math.min(79, Math.floor(x)));
    z = Math.max(0, Math.min(79, Math.floor(z)));
    for (let y = VH - 1; y >= 0; y--)
      if (this.solid(x, y, z) && this.get(x, y, z) !== 5) return y + 1;
    return 1;
  }
  fill(x0, y0, z0, x1, y1, z1, id) {
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++)
        for (let y = y0; y <= y1; y++) this.set(x, y, z, id);
  }
  generate() {
    for (let x = 0; x < VW; x++)
      for (let z = 0; z < VD; z++) {
        let h =
            4 +
            Math.floor((Math.sin(x * 0.15) * Math.cos(z * 0.13) + 1) * 1.25),
          type = 1;
        if (x >= 22 && x <= 47 && z >= 31 && z <= 66) h = 4;
        if (x >= 55) {
          h =
            4 + Math.floor((Math.sin(x * 0.18) * Math.cos(z * 0.16) + 1) * 0.8);
          type = 6;
        }
        if (z < 22 && x < 54) {
          h =
            5 +
            Math.floor(
              Math.max(0, Math.sin(x * 0.14) + Math.cos(z * 0.22)) * 5,
            );
          type = h > 7 ? 15 : 1;
        }
        if (x >= 31 && x <= 37 && z < 35) {
          h = 4;
          type = z < 20 ? 15 : 20;
        }
        if (x >= 29 && x <= 40 && z >= 8 && z <= 16) {
          h = 4;
          type = 15;
        }
        let river = Math.abs(x - (50 + Math.sin(z * 0.12) * 1.3)) < 3;
        if (river) {
          h = 1;
          type = 6;
        }
        if (x >= 8 && x <= 22 && z >= 16 && z <= 30) {
          h = 9;
          type = 1;
        }
        if (x >= 12 && x <= 18 && z >= 29 && z <= 35) {
          h = z < 32 ? 2 : z < 34 ? 3 : 4;
          type = 3;
        }
        if (x > 57 && x < 74 && z > 18 && z < 34) {
          h = 4;
          type = 6;
        }
        this.heights[x + z * VW] = h;
        for (let y = 0; y <= h; y++) {
          let id = y === 0 ? 19 : y === h ? type : y > h - 3 ? 2 : 3;
          if (y > 0 && y < h - 1 && rand(x, z, y) > 0.965) id = 9;
          if (y > 0 && y < h - 2 && rand(x, z, y + 80) > 0.97) id = 10;
          this.set(x, y, z, id);
        }
      }
    // A real excavatable gallery with a broad entrance and visible mineral veins.
    this.fill(10, 3, 18, 20, 7, 29, 0);
    this.fill(13, 3, 27, 17, 9, 31, 0);
    for (let z = 19; z <= 28; z += 3) {
      this.set(10, 4, z, 10);
      this.set(10, 5, z, 10);
      this.set(20, 4, z, 9);
      this.set(19, 3, z, 11);
      this.set(19, 4, z, 11);
      this.set(18, 3, z, 11);
    }
    for (let z of [20, 25, 29]) {
      this.fill(11, 3, z, 11, 6, z, 4);
      this.fill(19, 3, z, 19, 6, z, 4);
      this.fill(11, 7, z, 19, 7, z, 7);
      this.set(12, 5, z, 21);
    }
    // A gentle path links the arrival, village, mine and snowy observatory.
    for (let x = 33; x <= 36; x++)
      for (let z = 16; z <= 66; z++) this.set(x, 4, z, 20);
    for (let x = 22; x <= 47; x++)
      for (let z = 43; z <= 45; z++) this.set(x, 4, z, 20);
    for (let x = 16; x <= 34; x++)
      for (let z = 33; z <= 35; z++) {
        this.fill(x, 0, z, x, 3, z, 3);
        this.set(x, 4, z, 20);
        this.fill(x, 5, z, x, 10, z, 0);
      }
    this.house(24, 37, 7, 7, 17);
    this.house(38, 49, 7, 7, 17);
    this.house(23, 55, 7, 6, 7);
    // Forge, market awning and well.
    this.set(40, 5, 50, 13);
    this.set(41, 5, 50, 12);
    this.set(26, 5, 38, 14);
    this.set(24, 5, 56, 23);
    for (let x of [39, 44])
      for (let z of [38, 41]) this.fill(x, 5, z, x, 7, z, 4);
    this.fill(39, 8, 38, 44, 8, 41, 7);
    for (let x = 39; x <= 44; x++) this.set(x, 8, 41, x % 2 ? 15 : 17);
    this.fill(39, 5, 39, 44, 5, 39, 7);
    for (let x = 29; x <= 31; x++)
      for (let z = 46; z <= 48; z++)
        if (x === 29 || x === 31 || z === 46 || z === 48) this.set(x, 5, z, 8);
    this.fill(29, 6, 47, 29, 8, 47, 4);
    this.fill(31, 6, 47, 31, 8, 47, 4);
    this.fill(28, 9, 46, 32, 9, 48, 7);
    // Garden soil: interactive plants are rendered separately.
    this.fill(25, 4, 48, 29, 4, 50, 2);
    // Ancient desert temple, open central courtyard and broken columns.
    this.fill(59, 4, 21, 71, 4, 31, 8);
    for (let x of [59, 62, 68, 71])
      for (let z of [21, 30]) {
        let h = rand(x, z) > 0.4 ? 5 : 3;
        this.fill(x, 5, z, x, 5 + h, z, 6);
        this.set(x, 6 + h, z, 8);
      }
    this.fill(59, 10, 21, 71, 10, 21, 6);
    this.fill(59, 5, 20, 71, 7, 20, 6);
    for (let x = 61; x <= 69; x++) this.set(x, 5, 20, 18);
    // Observatory dome suggested by stepped rings.
    this.fill(30, 4, 9, 39, 4, 15, 8);
    for (let x = 30; x <= 39; x++)
      for (let z = 9; z <= 15; z++)
        if (x === 30 || x === 39 || z === 9) {
          this.set(x, 5, z, 8);
          if ((x + z) % 3 === 0) this.set(x, 6, z, 8);
        }
    this.fill(31, 5, 9, 31, 8, 9, 8);
    this.fill(38, 5, 9, 38, 8, 9, 8);
    this.fill(31, 9, 9, 38, 9, 9, 8);
    // Portal arch; its stones cannot be removed.
    this.fill(32, 5, 30, 32, 10, 30, 18);
    this.fill(37, 5, 30, 37, 10, 30, 18);
    this.fill(33, 11, 30, 36, 11, 30, 18);
    this.fill(31, 4, 29, 38, 4, 31, 8);
    for (let x = 32; x <= 37; x++)
      for (let y = 5; y <= 11; y++) this.protected.add(this.index(x, y, 30));
    // Trees avoid buildings, paths and character positions.
    for (let x = 3; x < 77; x += 3)
      for (let z = 3; z < 77; z += 3) {
        if (
          (x > 46 && x < 55) ||
          (x > 21 && x < 47 && z > 28 && z < 68) ||
          (x >= 29 && x <= 40 && z < 24) ||
          (x >= 8 && x <= 23 && z >= 14 && z <= 36) ||
          (x > 56 && z > 17 && z < 35)
        )
          continue;
        if (rand(x, z) < (x < 23 ? 0.28 : 0.67)) continue;
        let y = this.heights[x + z * VW] + 1;
        if (x > 55) {
          if (rand(x, z) > 0.82) this.fill(x, y, z, x, y + 2, z, 22);
          continue;
        }
        let pine = z < 22;
        this.tree(x, y, z, pine);
      }
    this.tree(28, 5, 63, false);
    this.tree(43, 5, 61, false);
    this.tree(22, 5, 47, false);
    for (let [x, z] of [
      [32, 54],
      [37, 58],
      [32, 41],
      [37, 33],
      [27, 44],
      [44, 44],
    ]) {
      this.fill(x, 5, z, x, 7, z, 4);
      this.set(x, 8, z, 21);
    }
    if (S.bridge) this.bridge(false);
    for (let [k, v] of Object.entries(S.edits)) {
      let n = Number(k);
      if (
        Number.isInteger(n) &&
        n >= 0 &&
        n < this.data.length &&
        Number.isInteger(v) &&
        v >= 0 &&
        v <= 23 &&
        !this.protected.has(n) &&
        Math.floor(n / (VW * VD)) > 0
      )
        this.data[n] = v;
    }
    if (Object.keys(S.edits).length) this.settleTrees();
  }
  house(x, z, w, d, roof) {
    let y = 5;
    this.fill(x, y - 1, z, x + w - 1, y - 1, z + d - 1, 8);
    for (let a = x; a < x + w; a++)
      for (let b = z; b < z + d; b++)
        if (a === x || a === x + w - 1 || b === z || b === z + d - 1) {
          for (let h = y; h < y + 4; h++)
            this.set(
              a,
              h,
              b,
              (a === x || a === x + w - 1) && (b === z || b === z + d - 1)
                ? 4
                : 7,
            );
        }
    let door = x + Math.floor(w / 2);
    this.fill(door, y, z + d - 1, door, y + 2, z + d - 1, 0);
    for (let zz of [z + 2, z + d - 3]) {
      this.set(x, y + 2, zz, 16);
      this.set(x + w - 1, y + 2, zz, 16);
    }
    for (let s = 0; s < Math.ceil(w / 2); s++)
      this.fill(x + s - 1, y + 4 + s, z - 1, x + w - s, y + 4 + s, z + d, roof);
    this.set(x + 1, y, z + 1, 12);
    this.set(x + w - 2, y + 2, z + 1, 21);
  }
  tree(x, y, z, pine) {
    let h = pine ? 6 : 4;
    const tree = { x, y, z, top: y + h, crown: [] };
    this.trees.push(tree);
    const leaf = (a, b, c) => {
      if (this.inBounds(a, b, c)) {
        tree.crown.push(this.index(a, b, c));
        this.set(a, b, c, 5);
      }
    };
    this.fill(x, y, z, x, y + h, z, 4);
    if (pine) {
      for (let dy = 2; dy <= 7; dy++) {
        let r = dy < 4 ? 2 : dy < 6 ? 1 : 0;
        for (let a = -r; a <= r; a++)
          for (let b = -r; b <= r; b++)
            if (a || b || dy > h) leaf(x + a, y + dy, z + b);
      }
    } else {
      for (let dy = 2; dy <= 5; dy++) {
        let r = dy === 5 ? 1 : 2;
        for (let a = -r; a <= r; a++)
          for (let b = -r; b <= r; b++)
            if (
              (Math.abs(a) + Math.abs(b) < 4 || rand(x + a, z + b) > 0.45) &&
              (a || b || dy > h)
            )
              leaf(x + a, y + dy, z + b);
      }
    }
  }
  bridge(edit = true) {
    for (let x = 46; x <= 55; x++)
      for (let z = 40; z <= 42; z++) {
        this.set(x, 4, z, 7, edit);
        if (z === 40 || z === 42) {
          if (x % 2 === 0) this.set(x, 5, z, 4, edit);
        }
      }
  }
}
let world = new VoxelWorld(),
  scene,
  camera,
  renderer,
  sun,
  skyLight,
  water,
  portal,
  hand,
  toolHead,
  outline,
  chunkGroup,
  floraGroup,
  raycaster;
let chunkMeshes = new Map(),
  materials,
  atlas,
  clock3d,
  clouds = [],
  characters = [],
  animals = [],
  glimmers = [],
  interactive = [],
  cropMeshes = [],
  torchLights = [];
let player = {
    pos: new THREE.Vector3(S.player.x, S.player.y, S.player.z),
    velY: 0,
    yaw: S.player.yaw,
    pitch: S.player.pitch,
    grounded: false,
  },
  playing = false,
  paused = true,
  keys = {},
  mouseDown = false,
  miningFinger = null,
  dragging = null,
  lockPending = false,
  target = null,
  nearObject = null,
  mineTime = 0,
  mineKey = '',
  lastFrame = 0,
  elapsed = 0,
  lastSave = 0,
  stepTimer = 0,
  selectedItem = S.hotbar[S.selected] || 'pickaxe',
  viewDistance = 70;
const CUBE = new THREE.BoxGeometry(1, 1, 1),
  tmpMatrix = new THREE.Matrix4(),
  tmpColor = new THREE.Color();
function textureAtlas() {
  let c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  let g = c.getContext('2d');
  for (let id = 1; id <= 23; id++)
    for (let face = 0; face < 3; face++) {
      let tile = (id - 1) * 3 + face,
        tx = (tile % 16) * 16,
        ty = Math.floor(tile / 16) * 16,
        base = BLOCKS[id].color;
      g.fillStyle = base;
      g.fillRect(tx, ty, 16, 16);
      for (let x = 0; x < 16; x++)
        for (let y = 0; y < 16; y++) {
          let a = (rand(x + id * 33, y + face * 18) - 0.5) * 0.25;
          g.fillStyle =
            a > 0 ? `rgba(255,255,220,${a})` : `rgba(19,32,21,${-a})`;
          g.fillRect(tx + x, ty + y, 1, 1);
        }
      if (id === 1 && face !== 0) {
        g.fillStyle = '#806548';
        g.fillRect(tx, ty + 4, 16, 12);
        for (let k = 0; k < 20; k++) {
          g.fillStyle = k % 2 ? '#977554' : '#6f583e';
          g.fillRect(tx + ((k * 7) % 16), ty + 5 + ((k * 3) % 10), 2, 2);
        }
        g.fillStyle = '#718c44';
        for (let x = 0; x < 16; x++)
          g.fillRect(tx + x, ty + 3, 1, 1 + Math.floor(rand(x, id) * 3));
      }
      if (id === 4) {
        if (face === 0) {
          g.strokeStyle = '#a18357';
          for (let s = 2; s < 8; s += 2)
            g.strokeRect(tx + s, ty + s, 16 - 2 * s, 16 - 2 * s);
        } else {
          for (let x = 1; x < 16; x += 3) {
            g.fillStyle = '#553f2e';
            g.fillRect(tx + x, ty, 1, 16);
            g.fillStyle = '#9a7750';
            g.fillRect(tx + x + 1, ty, 1, 10);
          }
        }
      }
      if ([7, 12, 14].includes(id)) {
        g.strokeStyle = '#6d513c';
        for (let y = 3; y < 16; y += 4) {
          g.beginPath();
          g.moveTo(tx, ty + y + 0.5);
          g.lineTo(tx + 16, ty + y + 0.5);
          g.stroke();
        }
        if (id === 14) {
          g.fillStyle = '#665036';
          g.fillRect(tx, ty + 4, 16, 2);
          g.fillStyle = '#d7ba68';
          g.fillRect(tx + 7, ty + 5, 2, 4);
        }
        if (id === 12 && face === 0) {
          g.strokeStyle = '#4e3d2b';
          g.strokeRect(tx + 3, ty + 3, 10, 10);
          g.fillRect(tx + 7, ty, 2, 16);
        }
      }
      if ([8, 17, 18].includes(id)) {
        g.strokeStyle = id === 18 ? '#8d80a3' : '#596a5a';
        for (let y = 0; y < 16; y += 5) {
          g.beginPath();
          g.moveTo(tx, ty + y);
          g.lineTo(tx + 16, ty + y);
          g.stroke();
          g.beginPath();
          g.moveTo(tx + (y % 2 ? 4 : 10), ty + y);
          g.lineTo(tx + (y % 2 ? 4 : 10), ty + y + 5);
          g.stroke();
        }
      }
      if ([9, 10, 11].includes(id)) {
        g.fillStyle = id === 9 ? '#303934' : id === 10 ? '#c5a38b' : '#71e3e0';
        for (let k = 0; k < 8; k++)
          g.fillRect(
            tx + Math.floor(rand(id, k) * 13),
            ty + Math.floor(rand(k, id) * 13),
            2 + (k % 2),
            2,
          );
      }
      if (id === 13 && face !== 0) {
        g.fillStyle = '#283631';
        g.fillRect(tx + 3, ty + 7, 10, 6);
        g.fillStyle = '#c58d4e';
        g.fillRect(tx + 5, ty + 10, 6, 2);
      }
      if (id === 16) {
        g.strokeStyle = '#e4fff2';
        g.strokeRect(tx + 0.5, ty + 0.5, 15, 15);
        g.beginPath();
        g.moveTo(tx + 3, ty + 11);
        g.lineTo(tx + 10, ty + 4);
        g.stroke();
      }
      if (id === 23) {
        g.fillStyle = '#eee8d7';
        g.fillRect(tx, ty, 16, 5);
        g.fillStyle = '#765a3d';
        g.fillRect(tx, ty + 13, 16, 3);
      }
      if (id === 21) {
        g.fillStyle = '#754c31';
        g.fillRect(tx, ty + 6, 16, 10);
        g.fillStyle = '#ffdc73';
        g.fillRect(tx, ty, 16, 6);
      }
    }
  let tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapNearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
const FACES = [
  {
    n: [1, 0, 0],
    v: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    light: 0.82,
    f: 1,
  },
  {
    n: [-1, 0, 0],
    v: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    light: 0.68,
    f: 1,
  },
  {
    n: [0, 1, 0],
    v: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    light: 1,
    f: 0,
  },
  {
    n: [0, -1, 0],
    v: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    light: 0.55,
    f: 2,
  },
  {
    n: [0, 0, 1],
    v: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
    light: 0.88,
    f: 1,
  },
  {
    n: [0, 0, -1],
    v: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    light: 0.74,
    f: 1,
  },
];
function rebuildChunk(cx, cz) {
  let pos = [],
    norm = [],
    uv = [],
    colors = [],
    indices = [],
    count = 0;
  for (let x = cx * 16; x < Math.min(VW, (cx + 1) * 16); x++)
    for (let z = cz * 16; z < Math.min(VD, (cz + 1) * 16); z++)
      for (let y = 0; y < VH; y++) {
        let id = world.get(x, y, z);
        if (!id) continue;
        for (let face of FACES) {
          let [nx, ny, nz] = face.n,
            adj = world.get(x + nx, y + ny, z + nz);
          if (adj && adj !== 21 && !(adj === 16 && id !== 16)) continue;
          let tile = (id - 1) * 3 + face.f,
            u = (tile % 16) / 16,
            v = 1 - Math.floor(tile / 16) / 16,
            epsilon = 0.0003,
            sz = 1 / 16;
          let uvs = [
            [u + epsilon, v - sz + epsilon],
            [u + epsilon, v - epsilon],
            [u + sz - epsilon, v - epsilon],
            [u + sz - epsilon, v - sz + epsilon],
          ];
          if (face.f === 0)
            uvs = [
              [u + epsilon, v - sz + epsilon],
              [u + sz - epsilon, v - sz + epsilon],
              [u + sz - epsilon, v - epsilon],
              [u + epsilon, v - epsilon],
            ];
          for (let j = 0; j < 4; j++) {
            let p = face.v[j],
              px = x + p[0],
              py = y + p[1],
              pz = z + p[2];
            if (id === 21) {
              px = x + 0.4 + p[0] * 0.2;
              py = y + p[1] * 0.8;
              pz = z + 0.4 + p[2] * 0.2;
            }
            pos.push(px, py, pz);
            norm.push(nx, ny, nz);
            uv.push(...uvs[j]);
            let shade = face.light;
            // Corner ambient occlusion: neighbouring blocks darken sheltered vertices.
            let axes = [0, 1, 2].filter((a) => face.n[a] === 0),
              b = [x + nx, y + ny, z + nz],
              a1 = [...b],
              a2 = [...b];
            a1[axes[0]] += p[axes[0]] ? 1 : -1;
            a2[axes[1]] += p[axes[1]] ? 1 : -1;
            let ao =
              (world.solid(...a1) ? 1 : 0) + (world.solid(...a2) ? 1 : 0);
            shade *= 1 - ao * 0.11;
            let tint = 0.97 + rand(x, z) * 0.06;
            colors.push(shade * tint, shade, shade * 0.97);
          }
          indices.push(
            count,
            count + 1,
            count + 2,
            count,
            count + 2,
            count + 3,
          );
          count += 4;
        }
      }
  let key = cx + ',' + cz,
    old = chunkMeshes.get(key);
  if (old) {
    chunkGroup.remove(old);
    old.geometry.dispose();
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  let mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  chunkGroup.add(mesh);
  chunkMeshes.set(key, mesh);
}
function meshBox(parent, x, y, z, w, h, d, color) {
  let m = new THREE.Mesh(
    CUBE,
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  m.position.set(x, y, z);
  m.scale.set(w, h, d);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function humanoid(n) {
  let g = new THREE.Group(),
    giant = n.id === 'atlas',
    s = giant ? 1.4 : 1;
  let skin = giant ? 0xa4ae98 : 0xcda17b;
  meshBox(g, 0, 1.05, 0, 0.6, 0.75, 0.35, n.coat);
  let head = meshBox(g, 0, 1.68, 0, 0.48, 0.48, 0.47, skin);
  meshBox(g, 0, 1.96, 0, 0.55, 0.15, 0.53, n.hat);
  meshBox(g, -0.12, 1.73, 0.245, 0.07, 0.065, 0.025, 0x24372b);
  meshBox(g, 0.12, 1.73, 0.245, 0.07, 0.065, 0.025, 0x24372b);
  meshBox(g, 0, 1.57, 0.29, 0.12, 0.18, 0.16, giant ? 0x82927a : 0xb18762);
  meshBox(g, 0, 1.4, 0.205, 0.3, 0.13, 0.03, giant ? 0x6e9867 : 0x74543a);
  let arm1 = meshBox(g, -0.4, 1.01, 0, 0.2, 0.7, 0.26, n.coat),
    arm2 = meshBox(g, 0.4, 1.01, 0, 0.2, 0.7, 0.26, n.coat),
    leg1 = meshBox(g, -0.16, 0.35, 0, 0.25, 0.7, 0.3, 0x465044),
    leg2 = meshBox(g, 0.16, 0.35, 0, 0.25, 0.7, 0.3, 0x465044);
  if (n.id === 'lila') meshBox(g, 0.45, 0.65, 0.13, 0.25, 0.15, 0.35, 0xc8ad60);
  if (n.id === 'borin') {
    meshBox(g, 0, 0.95, 0.19, 0.36, 0.6, 0.04, 0x654b37);
    meshBox(g, 0.5, 0.75, 0.1, 0.15, 0.55, 0.12, 0x6e5037);
    meshBox(g, 0.5, 1.04, 0.1, 0.4, 0.18, 0.25, 0x8d9894);
  }
  if (n.id === 'nora') meshBox(g, 0, 1.1, 0.28, 0.5, 0.35, 0.06, 0xd2c29a);
  if (n.id === 'selene')
    meshBox(g, 0.25, 1.9, 0.29, 0.11, 0.11, 0.03, 0xe4c674);
  if (giant) {
    // A carved stone brow and an inlaid compass distinguish the portal keeper at dusk.
    for (const side of [-1, 1]) {
      meshBox(
        g,
        side * 0.13,
        1.8,
        0.245,
        0.2,
        0.055,
        0.07,
        0x778b79,
      ).rotation.z = side * 0.12;
      meshBox(g, side * 0.38, 1.3, 0, 0.32, 0.27, 0.48, 0x829582);
      meshBox(g, side * 0.4, 1.46, -0.02, 0.25, 0.08, 0.34, 0x80974c);
      meshBox(g, side * 0.19, 1.97, 0.02, 0.09, 0.24, 0.12, 0xc2aa72);
    }
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1),
      new THREE.MeshStandardMaterial({
        color: 0x95e2d6,
        emissive: 0x289d97,
        emissiveIntensity: 0.9,
        flatShading: true,
      }),
    );
    crystal.position.set(0, 1.05, 0.23);
    crystal.scale.set(0.14, 0.23, 0.08);
    g.add(crystal);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(CUBE, crystal.material);
      eye.position.set(side * 0.12, 1.73, 0.265);
      eye.scale.set(0.073, 0.038, 0.018);
      g.add(eye);
    }
  }
  g.scale.setScalar(s);
  let yy = world.heights[Math.floor(n.x) + Math.floor(n.z) * VW] + 1;
  g.position.set(n.x + 0.5, yy, n.z + 0.5);
  scene.add(g);
  let obj = {
    kind: 'npc',
    npc: n,
    group: g,
    pos: g.position,
    head,
    arms: [arm1, arm2],
    legs: [leg1, leg2],
    name: n.name,
    nameHeight: 2.12 * s,
  };
  characters.push(obj);
  interactive.push(obj);
  return obj;
}
function animalRadius(type) {
  if (type === 'watcher') return 0.55;
  return type === 'fox'
    ? 1.24
    : type === 'chicken'
      ? 0.46
      : type === 'slime'
        ? 0.65
        : 0.92;
}
function animalFits(type, x, y, z) {
  const r = animalRadius(type);
  if (x - r < 1 || x + r >= VW - 1 || z - r < 1 || z + r >= VD - 1)
    return false;
  for (let a = Math.floor(x - r); a <= Math.floor(x + r); a++) {
    for (let b = Math.floor(z - r); b <= Math.floor(z + r); b++) {
      for (let h = y; h < y + (type === 'chicken' ? 1 : 2); h++) {
        if (world.solid(a, h, b)) return false;
      }
    }
  }
  return true;
}
function findAnimalSpawn(type, x, z) {
  for (let ring = 0; ring < Math.max(VW, VD); ring++) {
    for (let dx = -ring; dx <= ring; dx++)
      for (let dz = -ring; dz <= ring; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
        const a = Math.floor(x) + dx,
          b = Math.floor(z) + dz;
        if (!world.inBounds(a, 0, b) || (a >= 47 && a <= 54)) continue;
        let y = world.heights[a + b * VW] + 1;
        while (y > 1 && !world.solid(a, y - 1, b)) y--;
        if (y <= 2 || !animalFits(type, a + 0.5, y, b + 0.5)) continue;
        return new THREE.Vector3(a + 0.5, y, b + 0.5);
      }
  }
  return null;
}
function walkAnimal(a, dt, speed) {
  const { x, y, z } = a.pos;
  if (
    !world.solid(Math.floor(x), y - 1, Math.floor(z)) &&
    animalFits(a.type, x, y - 1, z)
  ) {
    a.pos.y -= 1;
    return false;
  }
  if (speed <= 0) return false;
  for (const turn of [0, 0.65, -0.65, 1.35, -1.35, Math.PI]) {
    const angle = a.angle + turn,
      nx = x + Math.sin(angle) * dt * speed,
      nz = z + Math.cos(angle) * dt * speed;
    const xx = Math.floor(nx),
      zz = Math.floor(nz);
    if (world.heights[xx + zz * VW] === 1) continue;
    let floor = y;
    if (!world.solid(xx, y - 1, zz)) floor--;
    if (!world.solid(xx, floor - 1, zz) || !animalFits(a.type, nx, floor, nz))
      continue;
    a.angle = angle;
    a.group.rotation.y = angle;
    a.pos.set(nx, floor, nz);
    return true;
  }
  return false;
}
function animal(type, x, z) {
  let g = new THREE.Group(),
    color =
      type === 'sheep'
        ? 0xe3dece
        : type === 'pig'
          ? 0xce9691
          : type === 'fox'
            ? 0xb37949
            : type === 'chicken'
              ? 0xe8e5d7
              : 0x84ad69,
    limbs = [];
  if (type === 'watcher') {
    g.visible = false;
  } else if (type === 'slime') {
    let m = meshBox(g, 0, 0.45, 0, 0.9, 0.9, 0.9, color);
    m.material.transparent = true;
    m.material.opacity = 0.75;
    meshBox(g, -0.2, 0.55, 0.46, 0.14, 0.14, 0.02, 0x294e35);
    meshBox(g, 0.2, 0.55, 0.46, 0.14, 0.14, 0.02, 0x294e35);
  } else {
    let small = type === 'chicken';
    meshBox(
      g,
      0,
      small ? 0.45 : 0.7,
      0,
      small ? 0.4 : 0.65,
      small ? 0.45 : 0.6,
      small ? 0.55 : 1.05,
      color,
    );
    meshBox(
      g,
      0,
      small ? 0.78 : 0.9,
      small ? 0.22 : 0.6,
      small ? 0.28 : 0.4,
      small ? 0.36 : 0.4,
      small ? 0.28 : 0.4,
      color,
    );
    for (let xx of [-0.22, 0.22])
      for (let zz of [-0.32, 0.32]) {
        if (small && zz < 0) continue;
        limbs.push(
          meshBox(
            g,
            small ? xx * 0.6 : xx,
            0.2,
            small ? 0 : zz,
            small ? 0.07 : 0.13,
            0.4,
            small ? 0.09 : 0.16,
            small ? 0xc89f4b : 0x70675a,
          ),
        );
      }
    meshBox(
      g,
      -0.13,
      small ? 0.83 : 0.98,
      small ? 0.37 : 0.81,
      0.05,
      0.055,
      0.02,
      0x28392d,
    );
    meshBox(
      g,
      0.13,
      small ? 0.83 : 0.98,
      small ? 0.37 : 0.81,
      0.05,
      0.055,
      0.02,
      0x28392d,
    );
    if (type === 'pig') meshBox(g, 0, 0.85, 0.85, 0.25, 0.16, 0.15, 0xb77c79);
    if (type === 'chicken') {
      meshBox(g, 0, 0.73, 0.43, 0.15, 0.1, 0.15, 0xcb9f4a);
      meshBox(g, 0, 0.98, 0.22, 0.08, 0.12, 0.2, 0xaa5e47);
    }
    if (type === 'fox') {
      meshBox(g, 0, 0.75, -0.8, 0.22, 0.25, 0.65, 0xc4b9a1);
      meshBox(g, -0.15, 1.19, 0.6, 0.12, 0.23, 0.14, 0x7e5636);
      meshBox(g, 0.15, 1.19, 0.6, 0.12, 0.23, 0.14, 0x7e5636);
    }
  }
  const spawn = findAnimalSpawn(type, x, z);
  if (!spawn) return;
  x = spawn.x;
  z = spawn.z;
  let y = spawn.y;
  g.position.set(x, y, z);
  scene.add(g);
  let a = {
    kind: 'animal',
    type,
    group: g,
    pos: g.position,
    home: new THREE.Vector3(x, y, z),
    limbs,
    angle: rand(x, z) * Math.PI * 2,
    timer: rand(z, x) * 4,
    friendly: false,
    cooldown: 0,
  };
  animals.push(a);
  interactive.push(a);
  return a;
}
function addChest(x, y, z, id, loot) {
  let g = new THREE.Group();
  meshBox(g, 0, 0.35, 0, 0.8, 0.7, 0.65, 0xa58049);
  meshBox(g, 0, 0.45, 0.34, 0.82, 0.07, 0.03, 0x54442c);
  meshBox(g, 0, 0.45, 0.38, 0.13, 0.18, 0.05, 0xddbe69);
  g.position.set(x, y, z);
  scene.add(g);
  let obj = { kind: 'treasure', id, loot, group: g, pos: g.position };
  interactive.push(obj);
  if (S.opened.includes(id)) g.visible = false;
  return obj;
}
function addDetails() {
  NPCS.forEach(humanoid);
  [
    ['sheep', 31, 61],
    ['sheep', 40, 63],
    ['pig', 25, 65],
    ['pig', 41, 58],
    ['chicken', 28, 53],
    ['chicken', 32, 50],
    ['fox', 16, 49],
    ['fox', 12, 61],
    ['sheep', 39, 23],
    ['slime', 19, 37],
    ['slime', 57, 49],
    ['watcher', 40, 65],
    ['watcher', 21, 38],
  ].forEach((a) => animal(...a));
  addChest(60.5, 5, 24.5, 'ruin-west', { rune: 1, emerald: 2 });
  addChest(69.5, 5, 28.5, 'ruin-east', { rune: 1, iron: 2 });
  addChest(65.5, 5, 22.5, 'ruin-north', { rune: 1, bread: 2 });
  addChest(13.5, 3, 19.5, 'mine-cache', { coal: 4, torch: 4 });
  addChest(14.5, world.top(14, 55), 55.5, 'forest-cache', {
    seed: 4,
    apple: 3,
  });
  // Blocky flowers and tall grass use instancing to keep the world inexpensive to render.
  let stems = [],
    petals = [];
  for (let x = 2; x < 78; x++)
    for (let z = 25; z < 78; z++) {
      if (
        x > 46 ||
        (x > 21 && x < 47 && z < 64) ||
        (x < 24 && z < 37) ||
        rand(x, z, 55) < 0.86
      )
        continue;
      let y = world.heights[x + z * VW] + 1;
      if (world.get(x, y - 1, z) !== 1 || world.get(x, y, z)) continue;
      stems.push([x + 0.5, y + 0.22, z + 0.5, 0.07, 0.45, 0.07]);
      if (rand(z, x) > 0.65)
        petals.push([x + 0.5, y + 0.46, z + 0.5, 0.26, 0.16, 0.24]);
    }
  function instance(list, color) {
    if (!list.length) return;
    let m = new THREE.InstancedMesh(
      CUBE,
      new THREE.MeshStandardMaterial({ color, roughness: 1 }),
      list.length,
    );
    list.forEach((v, i) => {
      tmpMatrix.compose(
        new THREE.Vector3(...v.slice(0, 3)),
        new THREE.Quaternion(),
        new THREE.Vector3(...v.slice(3)),
      );
      m.setMatrixAt(i, tmpMatrix);
      const x = Math.floor(v[0]),
        z = Math.floor(v[2]),
        key = x + VW * z;
      if (!world.floraColumns.has(key)) world.floraColumns.set(key, []);
      world.floraColumns.get(key).push({
        mesh: m,
        index: i,
        matrix: tmpMatrix.clone(),
        base: Math.floor(v[1]),
      });
    });
    m.receiveShadow = true;
    scene.add(m);
  }
  instance(stems, 0x76934d);
  instance(petals, 0xd4ba79);
  for (let i = 0; i < 6; i++) {
    let x = 25.5 + (i % 3) * 1.5,
      z = 48.5 + Math.floor(i / 3) * 1.5,
      g = new THREE.Group();
    g.position.set(x, 5, z);
    scene.add(g);
    let o = { kind: 'crop', id: i, group: g, pos: g.position };
    interactive.push(o);
    cropMeshes.push(o);
  }
  refreshCrops();
  // A brass telescope, pointing into the northern sky.
  let telescope = new THREE.Group();
  meshBox(telescope, 0, 0.7, 0, 0.18, 1.4, 0.18, 0x735943);
  let tube = meshBox(telescope, 0, 1.5, 0, 0.36, 0.35, 1.8, 0xbba269);
  tube.rotation.x = -0.5;
  meshBox(telescope, 0, 1.9, -0.8, 0.44, 0.42, 0.12, 0x6ba6b0);
  telescope.position.set(36.5, 5, 11);
  scene.add(telescope);
  // Water geometry follows the river instead of flooding the village.
  let wp = [],
    wi = [],
    wn = [],
    wc = 0;
  for (let x = 0; x < VW; x++)
    for (let z = 0; z < VD; z++)
      if (world.heights[x + z * VW] === 1) {
        wp.push(x, 3.85, z, x + 1, 3.85, z, x + 1, 3.85, z + 1, x, 3.85, z + 1);
        wn.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        wi.push(wc, wc + 2, wc + 1, wc, wc + 3, wc + 2);
        wc += 4;
      }
  let wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
  wg.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3));
  wg.setIndex(wi);
  water = new THREE.Mesh(
    wg,
    new THREE.MeshStandardMaterial({
      color: 0x538f9d,
      transparent: true,
      opacity: 0.72,
      roughness: 0.23,
      metalness: 0.18,
      side: THREE.DoubleSide,
    }),
  );
  water.receiveShadow = true;
  scene.add(water);
  let well = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x5a9095, roughness: 0.25 }),
  );
  well.rotation.x = -Math.PI / 2;
  well.position.set(30.5, 5.1, 47.5);
  scene.add(well);
  portal = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 5.8),
    new THREE.MeshBasicMaterial({
      color: 0xa8a6e8,
      transparent: true,
      opacity: S.won ? 0.6 : 0.08,
      side: THREE.DoubleSide,
    }),
  );
  portal.position.set(35, 8, 30.5);
  scene.add(portal);
  interactive.push({
    kind: 'portal',
    pos: new THREE.Vector3(35, 5, 31.8),
    group: portal,
  });
  for (let i = 0; i < 12; i++) {
    let c = new THREE.Group();
    for (let j = 0; j < 3; j++)
      meshBox(
        c,
        j * 3,
        Math.floor(rand(i, j) * 2),
        0,
        4 + rand(j, i) * 5,
        1.3,
        3 + rand(i, j) * 3,
        0xf0f2e6,
      );
    c.position.set(rand(i, 2) * 100 - 10, 24 + rand(i, 3) * 8, rand(i, 8) * 90);
    scene.add(c);
    clouds.push(c);
  }
  let starGeo = new THREE.BufferGeometry(),
    starPos = [];
  for (let i = 0; i < 300; i++) {
    let a = rand(i, 5) * Math.PI * 2,
      b = rand(i, 6) * 1.4;
    starPos.push(
      40 + Math.cos(a) * Math.cos(b) * 120,
      10 + Math.sin(b) * 120,
      40 + Math.sin(a) * Math.cos(b) * 120,
    );
  }
  starGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPos, 3),
  );
  let stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xe5eddf,
      size: 0.35,
      transparent: true,
      opacity: 0,
    }),
  );
  stars.name = 'stars';
  scene.add(stars);
  for (let i = 0; i < 18; i++) {
    let g = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055),
      new THREE.MeshBasicMaterial({ color: 0xe6db8e }),
    );
    g.position.set(
      15 + rand(i, 1) * 30,
      6 + rand(i, 2) * 3,
      30 + rand(i, 3) * 30,
    );
    g.userData.base = g.position.clone();
    scene.add(g);
    glimmers.push(g);
  }
  refreshTorches();
}
function refreshCrops() {
  for (let c of cropMeshes) {
    while (c.group.children.length) {
      let child = c.group.children[0];
      c.group.remove(child);
      if (child.material) child.material.dispose();
    }
    let crop = S.crops[c.id];
    if (!crop) continue;
    let grown = S.time - crop.at >= (crop.watered ? 35 : 100),
      height = grown ? 0.95 : 0.3;
    for (let k = 0; k < 4; k++) {
      let x = (k % 2) * 0.28 - 0.14,
        z = Math.floor(k / 2) * 0.28 - 0.14;
      meshBox(
        c.group,
        x,
        height / 2,
        z,
        0.07,
        height,
        0.07,
        grown ? 0xbea254 : 0x7c9d56,
      );
      if (grown)
        meshBox(c.group, x, height - 0.08, z, 0.16, 0.25, 0.13, 0xd9bd70);
    }
  }
}
let torchSpots = [];
function refreshTorches() {
  for (let l of torchLights) scene.remove(l);
  torchLights = [];
  let spots = [];
  for (let x = 0; x < VW; x++)
    for (let z = 0; z < VD; z++)
      for (let y = 0; y < VH; y++)
        if (world.get(x, y, z) === 21) spots.push([x + 0.5, y + 0.8, z + 0.5]);
  torchSpots = spots;
  spots.sort(
    (a, b) =>
      Math.hypot(a[0] - player.pos.x, a[2] - player.pos.z) -
      Math.hypot(b[0] - player.pos.x, b[2] - player.pos.z),
  );
  for (let p of spots.slice(
    0,
    graphicsTier() === 'high' ? 8 : graphicsTier() === 'medium' ? 4 : 2,
  )) {
    let l = new THREE.PointLight(0xffc477, 8, 10, 2);
    l.position.set(...p);
    scene.add(l);
    torchLights.push(l);
  }
}
function initEngine() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7cdd0);
  scene.fog = new THREE.Fog(0xb7cdd0, 38, 100);
  camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 160);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  $('world').appendChild(renderer.domElement);
  skyLight = new THREE.HemisphereLight(0xd0e2e5, 0x607146, 2.3);
  scene.add(skyLight);
  sun = new THREE.DirectionalLight(0xffe2ad, 2.6);
  sun.position.set(16, 45, 28);
  sun.target.position.set(35, 4, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -36,
    right: 36,
    top: 36,
    bottom: -36,
    near: 1,
    far: 100,
  });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  scene.add(sun.target);
  atlas = textureAtlas();
  materials = new THREE.MeshStandardMaterial({
    map: atlas,
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });
  chunkGroup = new THREE.Group();
  scene.add(chunkGroup);
  streamTerrain(true);
  for (const key of world.dirty) {
    rebuildChunk(...key.split(',').map(Number));
  }
  world.dirty.clear();
  dressTerrain(atlas).catch(console.error);
  addDetails();
  buildMill();
  buildField();
  anchorVillageProps();
  batchVillage();
  ForestFauna.dressFoxes(animals.filter((a) => a.type === 'fox')).catch(
    console.error,
  );
  ForestFauna.dressWatchers(animals.filter((a) => a.type === 'watcher')).catch(console.error);
  raycaster = new THREE.Raycaster();
  outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006, 1.006, 1.006)),
    new THREE.LineBasicMaterial({
      color: 0xffe8b0,
      transparent: true,
      opacity: 0.75,
    }),
  );
  scene.add(outline);
  outline.visible = false;
  hand = new THREE.Group();
  meshBox(hand, 0.1, -0.3, 0, 0.21, 0.4, 0.23, 0xb59270);
  meshBox(hand, 0.1, -0.57, 0, 0.23, 0.25, 0.25, 0x657f6b);
  meshBox(hand, 0, 0, -0.05, 0.075, 0.6, 0.08, 0x796043);
  toolHead = meshBox(hand, 0, 0.28, -0.05, 0.5, 0.12, 0.13, 0x909e95);
  meshBox(hand, 0.24, 0.2, -0.05, 0.09, 0.2, 0.13, 0x909e95);
  hand.scale.setScalar(0.72);
  hand.position.set(0.43, -0.35, -0.8);
  hand.rotation.z = -0.35;
  camera.add(hand);
  scene.add(camera);
  applyQuality();
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  safePlayer();
  requestAnimationFrame(tick);
}
function applyQuality() {
  if (!renderer) return;
  let tier = graphicsTier(),
    low = tier === 'low';
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, low ? 0.9 : tier === 'medium' ? 1.25 : 1.6),
  );
  renderer.shadowMap.enabled = tier === 'high';
  scene.fog.far = low ? 24 : 42;
  scene.fog.near = low ? 12 : 22;
  streamTerrain(true);
}
function intersectsPlayer(x, y, z) {
  return (
    x < player.pos.x + 0.28 &&
    x + 1 > player.pos.x - 0.28 &&
    z < player.pos.z + 0.28 &&
    z + 1 > player.pos.z - 0.28 &&
    y < player.pos.y + 1.75 &&
    y + 1 > player.pos.y + 0.05
  );
}
function collision(x, y, z) {
  for (let a = Math.floor(x - 0.26); a <= Math.floor(x + 0.26); a++)
    for (let b = Math.floor(z - 0.26); b <= Math.floor(z + 0.26); b++)
      for (let h = Math.floor(y + 0.03); h <= Math.floor(y + 1.72); h++)
        if (world.solid(a, h, b)) return true;
  return false;
}
function safePlayer() {
  if (
    player.pos.x < 1 ||
    player.pos.x > 78 ||
    player.pos.z < 1 ||
    player.pos.z > 78 ||
    player.pos.y < 0.5 ||
    player.pos.y > VH ||
    collision(player.pos.x, player.pos.y, player.pos.z)
  ) {
    player.pos.set(35.5, 5, 59.5);
    player.velY = 0;
  }
}
function spawn() {
  player.pos.set(35.5, 5, 59.5);
  player.velY = 0;
  S.health = 100;
  S.energy = Math.max(S.energy, 60);
  toast('De retour au village. Ton inventaire est conservé.');
  saveGame(false);
}
function getVoxelRay() {
  let dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  let origin = camera.position;
  let prev = null;
  for (let t = 0.1; t < 5.6; t += 0.045) {
    let p = origin.clone().addScaledVector(dir, t),
      x = Math.floor(p.x),
      y = Math.floor(p.y),
      z = Math.floor(p.z),
      id = world.get(x, y, z);
    if (id) return { x, y, z, id, prev, d: t };
    prev = { x, y, z };
  }
  return null;
}
function clearSight(origin, delta) {
  const steps = Math.ceil(delta.length() * 5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (
      world.solid(
        Math.floor(origin.x + delta.x * t),
        Math.floor(origin.y + delta.y * t),
        Math.floor(origin.z + delta.z * t),
      )
    )
      return false;
  }
  return true;
}
function showWorldName(actor) {
  const label = $('worldName');
  label.hidden = true;
  if (!actor) return;
  const v = actor.pos.clone();
  v.y += actor.nameHeight;
  camera.updateMatrixWorld();
  v.project(camera);
  if (v.z < -1 || v.z >= 1 || Math.abs(v.x) > 1.05 || v.y < -1) return;
  // At arm's length the head can extend above the phone while the torso is visible.
  if (v.y > 1) {
    if (actor.pos.clone().project(camera).y > 1) return;
    v.y = 1;
  }
  label.textContent = actor.name;
  label.hidden = false;
  const w = label.offsetWidth,
    h = label.offsetHeight;
  const x = Math.max(
    4,
    Math.min(innerWidth - w - 4, ((v.x + 1) * innerWidth) / 2 - w / 2),
  );
  let y = Math.max(4, ((1 - v.y) * innerHeight) / 2 - h - 3);
  for (const selector of ['.hud-top', '#questTrack', '#minimap', '#compass']) {
    const rect = document.querySelector(selector).getBoundingClientRect();
    if (
      rect.width &&
      x < rect.right &&
      x + w > rect.left &&
      y < rect.bottom &&
      y + h > rect.top
    )
      y = rect.bottom + 4;
  }
  const rail = $('feedbackRail').getBoundingClientRect();
  if (rail.height && y + h >= rail.top && x < rail.right && x + w > rail.left) {
    label.hidden = true;
    return;
  }
  label.style.left = x + 'px';
  label.style.top = y + 'px';
}
function updateTarget() {
  target = getVoxelRay();
  outline.visible = !!target;
  if (target)
    outline.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  let best = null,
    score = -Infinity;
  const view = camera.getWorldDirection(new THREE.Vector3());
  let name = null,
    nameScore = -Infinity;
  for (let o of interactive) {
    if ((o.kind === 'field' || o.type === 'watcher') && !o.group.visible) continue;
    if (o.kind === 'treasure' && S.opened.includes(o.id)) continue;
    let d = Math.hypot(o.pos.x - player.pos.x, o.pos.z - player.pos.z);
    if (d > 14) continue;
    const visibleHeight =
      o.kind === 'animal'
        ? 0.65
        : o.kind === 'crop'
          ? 0.35
          : o.name
            ? o.nameHeight * 0.72
            : 1;
    const look = o.pos.clone();
    look.y += visibleHeight;
    look.sub(camera.position);
    const dot = look.clone().normalize().dot(view);
    if (dot < 0 || !clearSight(camera.position, look)) continue;
    const rank = dot * 3 - d * 0.07;
    if (o.name && rank > nameScore && dot > 0.65) {
      name = o;
      nameScore = rank;
    }
    if (d < 3.3 && Math.abs(o.pos.y - player.pos.y) < 3.2 && rank > score) {
      best = o;
      score = rank;
    }
  }
  nearObject = best;
  let text = '';
  if (best) {
    text =
      best.kind === 'field' || best.kind === 'mill'
        ? best.label
        : best.kind === 'npc'
          ? `Parler à ${best.npc.name}`
          : best.kind === 'animal'
            ? best.type === 'sheep'
              ? 'Nourrir le mouton'
              : best.type === 'watcher'
                ? 'Éloigner le veilleur'
              : best.type === 'slime'
                ? 'Repousser le lutin mousse'
                : 'Observer et nourrir'
            : best.kind === 'crop'
              ? !S.crops[best.id]
                ? 'Planter une graine'
                : S.time - S.crops[best.id].at >=
                    (S.crops[best.id].watered ? 35 : 100)
                  ? 'Récolter le blé'
                  : S.crops[best.id].watered
                    ? 'La culture grandit…'
                    : 'Arroser la culture'
              : best.kind === 'treasure'
                ? 'Ouvrir le coffre ancien'
                : 'Examiner le portail';
  } else if (target && [12, 13, 14, 23].includes(target.id))
    text =
      target.id === 23
        ? 'Dormir jusqu’au matin'
        : target.id === 14
          ? 'Ouvrir le coffre'
          : 'Utiliser l’atelier';
  $('interactPrompt').style.display = text ? 'flex' : 'none';
  $('interactPrompt').querySelector('span').textContent = text;
  showWorldName(best?.name ? best : name);
  $('targetLabel').textContent = !best && target ? BLOCKS[target.id].name : '';
}
function anchorVillageProps() {
  // Restore the footing even when loading an older, excavated village.
  for (const o of interactive) {
    if (!['crop', 'treasure', 'mill', 'npc', 'field'].includes(o.kind))
      continue;
    const x = Math.floor(o.pos.x),
      z = Math.floor(o.pos.z);
    let y = Math.floor(o.pos.y);
    while (y > 1 && !world.solid(x, y - 1, z)) y--;
    o.pos.y = y;
    world.protected.add(world.index(x, y - 1, z));
  }
}
function protectedVoxel(t) {
  return (
    BLOCKS[t.id]?.protected ||
    world.protected.has(world.index(t.x, t.y, t.z)) ||
    NPCS.some(
      (n) =>
        Math.hypot(t.x + 0.5 - n.x - 0.5, t.z + 0.5 - n.z - 0.5) < 1.5 &&
        t.y <= world.heights[n.x + n.z * VW],
    )
  );
}
function mine(dt) {
  if (!target) {
    mineTime = 0;
    return;
  }
  if (world.get(target.x, target.y, target.z) !== target.id) {
    target = null;
    mineTime = 0;
    return;
  }
  let k = target.x + ',' + target.y + ',' + target.z;
  if (k !== mineKey) {
    mineTime = 0;
    mineKey = k;
  }
  let b = BLOCKS[target.id];
  if (protectedVoxel(target)) {
    mineTime = 0;
    if (mouseDown && dt === 0) toast('Cette pierre protège un lieu important.');
    return;
  }
  if (b.tool > S.tool && !S.creative) {
    mineTime = 0;
    $('targetLabel').textContent =
      b.name +
      ' · ' +
      ['', 'pioche en bois', 'pioche en pierre', 'pioche en fer'][b.tool] +
      ' nécessaire';
    return;
  }
  mineTime += dt * (S.creative ? 10 : 1 + S.tool * 0.42);
  $('mineProgress').style.display = 'block';
  $('mineProgress').firstElementChild.style.width =
    Math.min(100, (mineTime / b.hard) * 100) + '%';
  if (mineTime >= b.hard) {
    let t = { ...target };
    world.set(t.x, t.y, t.z, 0, true);
    if (
      world.trees.some(
        (tree) =>
          tree.x === t.x &&
          tree.z === t.z &&
          t.y >= tree.y - 1 &&
          t.y <= tree.top,
      )
    ) {
      const logs = world.settleTrees();
      if (logs) give({ wood: logs });
    }
    give({ [b.drop]: 1 });
    if (t.id === 5 && Math.random() < 0.12) give({ apple: 1 });
    if (t.id === 5 && Math.random() < 0.15) give({ seed: 1 });
    if (t.id === 14) {
      let key = world.index(t.x, t.y, t.z),
        items = S.chests[key];
      if (items) {
        give(items);
        delete S.chests[key];
      }
    }
    S.stats.mined++;
    S.xp++;
    mineTime = 0;
    spawnParticles(t.x + 0.5, t.y + 0.5, t.z + 0.5, b.color);
    sfx('mine');
    if (t.id === 21) refreshTorches();
    updateHUD();
  }
}
let particles = [];
function spawnParticles(x, y, z, color) {
  for (let i = 0; i < 7; i++) {
    let p = new THREE.Mesh(CUBE, new THREE.MeshBasicMaterial({ color }));
    p.scale.setScalar(0.08 + Math.random() * 0.06);
    p.position.set(x, y, z);
    p.userData = {
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3,
      vz: (Math.random() - 0.5) * 3,
      life: 0.6,
    };
    scene.add(p);
    particles.push(p);
  }
}
function placeBlock() {
  if (paused || !playing) return;
  let k = S.hotbar[S.selected];
  if (k === 'apple' || k === 'bread') {
    eat(k);
    return;
  }
  let id = PLACE[k];
  if (!id) {
    toast('Choisis un bloc dans la barre, ou équipe-le depuis ton sac.');
    return;
  }
  if (!S.creative && !(S.inv[k] > 0)) {
    toast('Tu n’as plus de ' + itemName(k).toLowerCase() + '.');
    return;
  }
  if (!target?.prev) {
    toast('Vise une surface proche pour poser un bloc.');
    return;
  }
  let { x, y, z } = target.prev;
  if (
    !world.inBounds(x, y, z) ||
    world.get(x, y, z) !== 0 ||
    y < 1 ||
    y > 25 ||
    intersectsPlayer(x, y, z) ||
    interactive.some(
      (o) =>
        (o.type !== 'watcher' || o.group.visible) &&
        (o.kind === 'animal'
          ? Math.abs(o.pos.x - x - 0.5) < animalRadius(o.type) + 0.5 &&
            Math.abs(o.pos.z - z - 0.5) < animalRadius(o.type) + 0.5
          : Math.hypot(o.pos.x - x - 0.5, o.pos.z - z - 0.5) < 0.8) &&
        Math.abs(o.pos.y - y) < 2,
    )
  ) {
    toast('Cette place doit rester libre.');
    return;
  }
  world.set(x, y, z, id, true);
  if (!S.creative) S.inv[k]--;
  S.stats.placed++;
  sfx('place');
  if (id === 21) refreshTorches();
  updateHUD();
  saveGame(false);
}
function eat(k) {
  if (!S.inv[k]) {
    toast('Tu n’en as plus dans ton sac.');
    return;
  }
  if (S.energy >= 100 && S.health >= 100) {
    toast('Tu es déjà en pleine forme.');
    return;
  }
  S.inv[k]--;
  S.energy = Math.min(100, S.energy + (k === 'bread' ? 45 : 20));
  S.health = Math.min(100, S.health + 12);
  sfx('success');
  toast('Tu reprends des forces.');
  updateHUD();
  saveGame(false);
}
function movePlayer(dt) {
  let f =
      (keys.w || keys.z || keys.arrowup ? 1 : 0) -
      (keys.s || keys.arrowdown ? 1 : 0),
    r = (keys.d ? 1 : 0) - (keys.a || keys.q ? 1 : 0);
  f -= stickInput.y;
  r += stickInput.x;
  if (keys.arrowleft) player.yaw += dt * 1.7;
  if (keys.arrowright) player.yaw -= dt * 1.7;
  let len = Math.max(1, Math.hypot(f, r)),
    speed =
      (keys.shift && S.energy > 15 ? 6 : 3.6) * (player.pos.y < 3.7 ? 0.65 : 1);
  let dx =
      ((-Math.sin(player.yaw) * f + Math.cos(player.yaw) * r) * speed * dt) /
      len,
    dz =
      ((-Math.cos(player.yaw) * f - Math.sin(player.yaw) * r) * speed * dt) /
      len;
  function axis(v, a) {
    let x = player.pos.x + (a === 'x' ? v : 0),
      z = player.pos.z + (a === 'z' ? v : 0);
    if (x < 0.7 || z < 0.7 || x > 79.3 || z > 79.3) return;
    if (!collision(x, player.pos.y, z)) player.pos[a] += v;
    else if (
      player.grounded &&
      !collision(x, player.pos.y + 1.05, z) &&
      world.solid(Math.floor(x), Math.floor(player.pos.y), Math.floor(z))
    ) {
      player.pos.y += 1.01;
      player.pos[a] += v;
    }
  }
  axis(dx, 'x');
  axis(dz, 'z');
  let swimming =
    world.heights[Math.floor(player.pos.x) + Math.floor(player.pos.z) * VW] ===
      1 && player.pos.y < 3.9;
  if (keys[' '] && (player.grounded || swimming)) {
    player.velY = 7.2;
    player.grounded = false;
    if (!swimming) sfx('jump');
  }
  player.velY -= (swimming ? 7 : 21) * dt;
  let nextY = player.pos.y + player.velY * dt;
  if (collision(player.pos.x, nextY, player.pos.z)) {
    if (player.velY < 0) {
      player.pos.y = Math.ceil(nextY);
      player.grounded = true;
    } else player.pos.y = Math.floor(nextY + 1.72) - 1.73;
    player.velY = 0;
  } else {
    player.pos.y = nextY;
    player.grounded = false;
  }
  if (player.pos.y < 0.1) spawn();
  if (f || r) {
    stepTimer += dt;
    S.energy = Math.max(0, S.energy - dt * (keys.shift ? 0.13 : 0.04));
    if (stepTimer > 0.45 && player.grounded) {
      sfx('step');
      stepTimer = 0;
    }
  }
  if (S.energy > 60) S.health = Math.min(100, S.health + dt * 0.2);
  camera.position.copy(player.pos);
  camera.position.y +=
    1.62 + ((f || r) && player.grounded ? Math.sin(elapsed * 10) * 0.035 : 0);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(player.pitch, player.yaw, 0);
  hand.visible = true;
  hand.rotation.x = mouseDown || miningFinger !== null ? Math.sin(elapsed * 15) * 0.45 : 0;
  hand.position.y = -0.35 + (f || r ? Math.sin(elapsed * 8) * 0.025 : 0);
  toolHead.material.color.set(
    S.tool >= 3 ? 0xc6d2ce : S.tool >= 2 ? 0x9ba8a0 : 0xa78960,
  );
}
function nearestTorch(pos) {
  let closest = null, distance = 16;
  for (const spot of torchSpots) {
    const squared = (spot[0] - pos.x) ** 2 + (spot[1] - pos.y - 1) ** 2 + (spot[2] - pos.z) ** 2;
    if (squared < distance) {
      closest = spot;
      distance = squared;
    }
  }
  return closest;
}
function updateWatcher(a, dt, night) {
  if (!a.motion || !night || S.settings.peaceful || S.creative) {
    a.group.visible = false;
    return;
  }
  if (!a.group.visible && !animalFits(a.type, a.pos.x, a.pos.y, a.pos.z)) {
    const spot = findAnimalSpawn(a.type, a.pos.x, a.pos.z);
    if (!spot) return;
    a.pos.copy(spot);
  }
  a.group.visible = true;
  const delta = player.pos.clone().sub(a.pos);
  const distance = delta.length();
  const light = nearestTorch(a.pos);
  const seesPlayer = distance < 14 && clearSight(a.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), delta);
  let speed = 0;
  if (light) {
    a.angle = Math.atan2(a.pos.x - light[0], a.pos.z - light[2]);
    speed = 1.35;
  } else if (seesPlayer) {
    a.angle = Math.atan2(delta.x, delta.z);
    if (a.cooldown > 0) {
      a.angle += Math.PI;
      speed = 1.2;
    } else if (!nearestTorch(player.pos)) {
      speed = 0.95;
      if (distance < 1.35) {
        S.health -= 8;
        a.cooldown = 5;
        toast('Le veilleur te bouscule ! Pose une torche ou éloigne-le avec la main.');
        if (S.health <= 0) spawn();
      }
    }
  }
  const next = walkAnimal(a, dt, speed) ? a.run : a.idle;
  if (next !== a.motion) {
    next.reset().play();
    a.motion.crossFadeTo(next, 0.18, false);
    a.motion = next;
  }
  a.mixer.update(dt);
}
function animateWorld(dt) {
  let phase = (S.time % 720) / 720,
    hour = (phase * 24 + 6) % 24,
    day = Math.max(0.08, Math.sin(((hour - 6) / 12) * Math.PI)),
    night = day < 0.15;
  let sky = new THREE.Color().lerpColors(
    new THREE.Color(0x243951),
    new THREE.Color(0xb8d0d1),
    day,
  );
  scene.background.copy(sky);
  scene.fog.color.copy(sky);
  skyLight.intensity = 0.45 + day * 1.9;
  sun.intensity = 0.1 + day * 2.4;
  sun.position.set(player.pos.x - 22, 35 + day * 20, player.pos.z - 12);
  sun.target.position.set(player.pos.x, 3, player.pos.z - 10);
  scene.getObjectByName('stars').material.opacity = Math.max(0, 1 - day * 3);
  water.material.opacity = 0.65 + Math.sin(elapsed * 0.5) * 0.04;
  for (let c of clouds) {
    c.position.x += dt * 0.12;
    if (c.position.x > 100) c.position.x = -20;
  }
  for (let n of characters) {
    n.group.rotation.y = Math.atan2(
      player.pos.x - n.pos.x,
      player.pos.z - n.pos.z,
    );
    n.arms[0].rotation.x = Math.sin(elapsed * 1.3 + n.pos.x) * 0.04;
    n.arms[1].rotation.x = -Math.sin(elapsed * 1.3 + n.pos.x) * 0.04;
  }
  for (let a of animals) {
    a.timer -= dt;
    a.cooldown = Math.max(0, a.cooldown - dt);
    if (a.type === 'watcher') {
      updateWatcher(a, dt, night);
      continue;
    }
    let d = a.pos.distanceTo(player.pos);
    if (a.timer < 0) {
      a.angle += (Math.random() - 0.5) * 2;
      a.timer = 2 + Math.random() * 3;
    }
    if (a.friendly && d > 2 && d < 12)
      a.angle = Math.atan2(player.pos.x - a.pos.x, player.pos.z - a.pos.z);
    if (a.type === 'slime' && night && !S.settings.peaceful && d < 12)
      a.angle = Math.atan2(player.pos.x - a.pos.x, player.pos.z - a.pos.z);
    let speed = a.type === 'slime' ? 0.55 : 0.3;
    if (a.friendly && d < 2) speed = 0;
    const moved = walkAnimal(a, dt, speed);
    if (a.mixer && moved) a.mixer.update(dt * speed * 1.6);
    for (const [i, l] of a.limbs.entries())
      l.rotation.x = moved
        ? Math.sin(elapsed * 5 + (i % 2) * Math.PI) * 0.22
        : 0;
    if (a.type === 'slime') {
      a.group.scale.y = 1 + Math.sin(elapsed * 4) * 0.1;
      if (night && !S.settings.peaceful && d < 1.4 && a.cooldown === 0) {
        S.health -= 10;
        a.cooldown = 3;
        toast('Un lutin mousse te bouscule ! Clique pour le repousser.');
        if (S.health <= 0) spawn();
      }
    }
  }
  for (let [i, g] of glimmers.entries()) {
    g.position.y = g.userData.base.y + Math.sin(elapsed + i) * 0.4;
    g.material.opacity = night ? 0.9 : 0.3;
    g.visible = night;
  }
  animateField(night);
  if (millWheel && S.mill.stage === 3) millWheel.rotation.z -= dt * 1.6;
  portal.material.opacity = S.won ? 0.5 + Math.sin(elapsed * 2) * 0.12 : 0.07;
  for (let p of particles) {
    let d = p.userData;
    d.life -= dt;
    d.vy -= 9 * dt;
    p.position.x += d.vx * dt;
    p.position.y += d.vy * dt;
    p.position.z += d.vz * dt;
    p.rotation.x += dt * 3;
  }
  particles = particles.filter((p) => {
    if (p.userData.life <= 0) {
      scene.remove(p);
      p.material.dispose();
      return false;
    }
    return true;
  });
}
let frameCount = 0;
function tick(ts) {
  const frameSeconds = (ts - lastFrame) / 1000 || 0.016;
  let dt = Math.min(0.1, frameSeconds);
  lastFrame = ts;
  if (playing && !paused) adaptResolution(frameSeconds);
  elapsed += dt;
  if (playing && !paused) {
    const seconds = Math.min(1, (ts - (tick.realTime || ts)) / 1000);
    S.playSeconds += Math.max(0, seconds);
    if (
      Math.floor(S.playSeconds / 2100) >
      Math.floor((S.playSeconds - seconds) / 2100)
    )
      toast('Le village peut attendre. Une petite pause ?');
    S.time += dt;
    const steps = Math.ceil(dt / 0.032) || 1;
    for (let step = 0; step < steps; step++) movePlayer(dt / steps);
    if (++frameCount % 5 === 0) updateTarget();
    if (mouseDown || miningFinger !== null) mine(dt);
    else {
      mineTime = 0;
      $('mineProgress').style.display = 'none';
    }
    if (frameCount % 15 === 0) updateHUD();
    if (frameCount % 120 === 0) refreshCrops();
    if (S.time - lastSave > 20) {
      saveGame(false);
      lastSave = S.time;
    }
    animateWorld(dt);
  } else if (!playing) {
    let t = elapsed * 0.018;
    camera.position.set(46 + Math.sin(t) * 5, 17, 68);
    camera.lookAt(32, 7, 43);
    hand.visible = false;
    animateWorld(dt * 0.3);
  }
  if (playing) streamTerrain();
  if (world.dirty.size) {
    let key = world.dirty.values().next().value;
    world.dirty.delete(key);
    if (streamTerrain.wanted.has(key))
      rebuildChunk(...key.split(',').map(Number));
  }
  tick.realTime = ts;
  if (!paused || !playing || world.dirty.size) renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
