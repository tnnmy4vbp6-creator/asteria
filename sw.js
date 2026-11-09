const prefix = 'asteria:' + new URL(self.registration.scope).pathname + ':';
const cacheName = prefix + "975a05bb291492";
const files = ["assets/icons/icon-192.png","assets/icons/icon-512.png","assets/icons/kenney/audioOn.png","assets/icons/kenney/checkmark.png","assets/icons/kenney/exit.png","assets/icons/kenney/home.png","assets/icons/kenney/next.png","assets/icons/kenney/question.png","assets/icons/kenney/return.png","assets/icons/kenney/target.png","assets/icons/kenney/wrench.png","assets/kenney-manifest.json","assets/models/Fox.glb","assets/models/brume.glb","assets/models/kenney/Textures/colormap.png","assets/models/kenney/barrel-open.glb","assets/models/kenney/barrel.glb","assets/models/kenney/box-open.glb","assets/models/kenney/box.glb","assets/models/kenney/bucket.glb","assets/models/kenney/campfire-pit.glb","assets/models/kenney/canoe.glb","assets/models/kenney/canoe_paddle.glb","assets/models/kenney/chest.glb","assets/models/kenney/crop_carrot.glb","assets/models/kenney/crop_pumpkin.glb","assets/models/kenney/fish-large.glb","assets/models/kenney/fish.glb","assets/models/kenney/flower_purpleA.glb","assets/models/kenney/flower_redA.glb","assets/models/kenney/flower_yellowA.glb","assets/models/kenney/grass_large.glb","assets/models/kenney/lily_small.glb","assets/models/kenney/log_stack.glb","assets/models/kenney/mushroom_redGroup.glb","assets/models/kenney/mushroom_tanGroup.glb","assets/models/kenney/plant_bushDetailed.glb","assets/models/kenney/plant_bushSmall.glb","assets/models/kenney/pot_small.glb","assets/models/kenney/resource-planks.glb","assets/models/kenney/resource-wood.glb","assets/models/kenney/rock-a.glb","assets/models/kenney/rock-b.glb","assets/models/kenney/rock-c.glb","assets/models/kenney/rock_smallA.glb","assets/models/kenney/rock_smallB.glb","assets/models/kenney/signpost.glb","assets/models/kenney/tent-canvas.glb","assets/models/kenney/tool-axe.glb","assets/models/kenney/tool-hammer.glb","assets/models/kenney/tool-pickaxe.glb","assets/models/kenney/tree_cone.glb","assets/models/kenney/tree_default.glb","assets/models/kenney/tree_oak.glb","assets/models/kenney/workbench-anvil.glb","assets/models/kenney/workbench.glb","assets/music/port-town.ogg","assets/sounds/click_003.wav","assets/sounds/confirmation_002.wav","assets/sounds/dig_choppy.1.ogg","assets/sounds/dig_cracky.1.ogg","assets/sounds/error_006.wav","assets/sounds/grass_footstep.1.ogg","assets/sounds/grass_footstep.2.ogg","assets/sounds/open_002.wav","assets/sounds/place_node.1.ogg","assets/sounds/switch_003.wav","assets/textures/brick.png","assets/textures/brume.png","assets/textures/cactus_side.png","assets/textures/desert_sandstone_block.png","assets/textures/dirt.png","assets/textures/grass.png","assets/textures/grass_side.png","assets/textures/leaves.png","assets/textures/mineral_coal.png","assets/textures/mineral_iron.png","assets/textures/sand.png","assets/textures/sandstone_block.png","assets/textures/sandstone_brick.png","assets/textures/snow.png","assets/textures/stone.png","assets/textures/stone_brick.png","assets/textures/tree.png","assets/textures/tree_top.png","assets/textures/wood.png","assets/voices/ambient-forest.wav","assets/voices/ambient-village.wav","assets/voices/ambient-volcano.wav","assets/voices/arrived.wav","assets/voices/building.wav","assets/voices/cargo.wav","assets/voices/forest.wav","assets/voices/forward.wav","assets/voices/fossils.wav","assets/voices/grammar.wav","assets/voices/left.wav","assets/voices/manifest.json","assets/voices/right.wav","assets/voices/volcano.wav","assets/voices/welcome.wav","batching.js?rev=4ad906cbdc74","builder.js?rev=ee960e26ec0e","content.js?rev=77a6c38a40f4","data.js?rev=b8fa80779d52","ember.js?rev=83cd4cce0353","engine.js?rev=987ffea1face","fauna.js?rev=39dafafe8682","field.js?rev=2886f8c6dbeb","index.html","jouer.html","learning.js?rev=3ae0eb50b7c2","licenses/Fox.md","licenses/Kenney-characters.txt","licenses/Kenney-icons.txt","licenses/Kenney-nature.txt","licenses/Kenney-sounds.txt","licenses/Kenney-survival.txt","licenses/Minetest-credits.md","licenses/Minetest-media.txt","licenses/Three.js-LICENSE.txt","licenses/Voices.md","licenses/howler.txt","licenses/nipplejs.txt","licenses/piper-ljspeech-model.txt","licenses/piper-siwis-model.txt","living-rules.js?rev=b9902dd2f9cf","living-ui.js?rev=4806c199f91e","living-world.js?rev=550b02b5d010","main.js?rev=296c9cbfcd41","manifest.webmanifest","media.js?rev=74e5c9786ced","mill.js?rev=a5fb6122b235","platform.js?rev=600b4e9bcea4","profiles.js?rev=a5d0cdfd92f6","restoration.js?rev=111de696d49d","scenery.js?rev=24081917f46a","shapes.js?rev=61d695989825","style.css?rev=184258f44608","tablet.js?rev=6749b1f435f6","temple.js?rev=eae71ecb6352","three.min.js?rev=170c6789f432","ui.js?rev=583b562cf077","voyage.js?rev=fcf187ec7dc0","weather.js?rev=3c1caa56ff0b"];
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
