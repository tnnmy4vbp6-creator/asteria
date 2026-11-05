const prefix = 'asteria:' + new URL(self.registration.scope).pathname + ':';
const cacheName = prefix + VERSION_TOKEN;
const files = FILES_TOKEN;
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
