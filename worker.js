const prefix='asteria:'+new URL(self.registration.scope).pathname+':';
const cacheName=prefix+/*VERSION*/;
const files=/*FILES*/;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files.map(file=>new Request(file,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
  const key=event.request.mode==='navigate'&&new URL(event.request.url).pathname.endsWith('/')?new URL('index.html',self.registration.scope).href:event.request;
  event.respondWith(caches.open(cacheName).then(async cache=>(await cache.match(key))||fetch(event.request)));
});

