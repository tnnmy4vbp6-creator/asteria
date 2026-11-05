const prefix = 'asteria:' + new URL(self.registration.scope).pathname + ':';
const cacheName = prefix + "ccb74f3b9ef1f7";
const files = ["assets/icons/icon-192.png","assets/icons/icon-512.png","assets/models/Fox.glb","assets/music/port-town.ogg","assets/sounds/dig_choppy.1.ogg","assets/sounds/dig_cracky.1.ogg","assets/sounds/grass_footstep.1.ogg","assets/sounds/grass_footstep.2.ogg","assets/sounds/place_node.1.ogg","assets/textures/brick.png","assets/textures/cactus_side.png","assets/textures/dirt.png","assets/textures/grass.png","assets/textures/grass_side.png","assets/textures/leaves.png","assets/textures/mineral_coal.png","assets/textures/mineral_iron.png","assets/textures/sand.png","assets/textures/snow.png","assets/textures/stone.png","assets/textures/stone_brick.png","assets/textures/tree.png","assets/textures/tree_top.png","assets/textures/wood.png","batching.js","content.js","data.js","engine.js","fauna.js","field.js","index.html","learning.js","licenses/Fox.md","licenses/Minetest-credits.md","licenses/Minetest-media.txt","licenses/Three.js-LICENSE.txt","main.js","manifest.webmanifest","media.js","mill.js","profiles.js","style.css","tablet.js","three.min.js","ui.js"];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>
        cache.addAll(
          files.map((file) => new Request(file, { cache: 'reload' })),
        ),
      ),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(prefix) && k !== cacheName)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.registration.scope)
  )
    return;
  const key =
    event.request.mode === 'navigate' &&
    new URL(event.request.url).pathname.endsWith('/')
      ? new URL('index.html', self.registration.scope).href
      : event.request;
  event.respondWith(
    caches
      .open(cacheName)
      .then(async (cache) => (await cache.match(key)) || fetch(event.request)),
  );
});
