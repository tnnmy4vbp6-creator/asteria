const prefix = 'asteria:' + new URL(self.registration.scope).pathname + ':';
const cacheName = prefix + "acf6bb9fab7439";
const files = ["assets/icons/icon-192.png","assets/icons/icon-512.png","assets/models/Fox.glb","assets/models/brume.glb","assets/music/port-town.ogg","assets/sounds/dig_choppy.1.ogg","assets/sounds/dig_cracky.1.ogg","assets/sounds/grass_footstep.1.ogg","assets/sounds/grass_footstep.2.ogg","assets/sounds/place_node.1.ogg","assets/textures/brick.png","assets/textures/brume.png","assets/textures/cactus_side.png","assets/textures/desert_sandstone_block.png","assets/textures/dirt.png","assets/textures/grass.png","assets/textures/grass_side.png","assets/textures/leaves.png","assets/textures/mineral_coal.png","assets/textures/mineral_iron.png","assets/textures/sand.png","assets/textures/sandstone_block.png","assets/textures/sandstone_brick.png","assets/textures/snow.png","assets/textures/stone.png","assets/textures/stone_brick.png","assets/textures/tree.png","assets/textures/tree_top.png","assets/textures/wood.png","batching.js?rev=4ad906cbdc74","content.js?rev=3314be56cb6c","data.js?rev=081ab7f2f9bd","engine.js?rev=2c7be44469ab","fauna.js?rev=6a74a27aba88","field.js?rev=2886f8c6dbeb","index.html","jouer.html","learning.js?rev=7afb65316a07","licenses/Fox.md","licenses/Kenney-characters.txt","licenses/Minetest-credits.md","licenses/Minetest-media.txt","licenses/Three.js-LICENSE.txt","main.js?rev=5be6b94232d0","manifest.webmanifest","media.js?rev=40a38a3bcf23","mill.js?rev=a5fb6122b235","profiles.js?rev=a5d0cdfd92f6","style.css?rev=e5ff2f753d6a","tablet.js?rev=56c432e60127","temple.js?rev=19f6c395e9bd","three.min.js?rev=170c6789f432","ui.js?rev=96e98cad0f55","voyage.js?rev=4a2de0d5d833","weather.js?rev=3c1caa56ff0b"];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>
        cache.addAll(
          files.map((file) => new Request(file, { cache: 'reload' })),
        ),
      )
      .then(() => self.skipWaiting()),
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
  const entry = new URL(event.request.url).pathname.slice(
    new URL(self.registration.scope).pathname.length,
  );
  if (
    event.request.mode === 'navigate' &&
    ['', 'jouer.html', 'index.html'].includes(entry)
  ) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request, { cache: 'no-cache' });
          if (response.ok) return response;
        } catch {
          /* The installed edition can run offline. */
        }
        return (
          (await (
            await caches.open(cacheName)
          ).match(new URL('index.html', self.registration.scope))) ||
          Response.error()
        );
      })(),
    );
    return;
  }
  const key = event.request;
  event.respondWith(
    caches
      .open(cacheName)
      .then(async (cache) => (await cache.match(key)) || fetch(event.request)),
  );
});
