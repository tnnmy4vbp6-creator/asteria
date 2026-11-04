const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
  '.ogg': 'audio/ogg',
  '.md': 'text/plain',
  '.txt': 'text/plain',
};
const port = Number(process.env.PORT || 8767);
http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const file = path.resolve(
        root,
        '.' +
          decodeURIComponent(
            url.pathname.endsWith('/')
              ? url.pathname + 'index.html'
              : url.pathname,
          ),
      );
      if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile())
        throw Error();
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('Introuvable');
    }
  })
  .listen(port, '127.0.0.1', () =>
    console.log('http://localhost:' + port + '/'),
  );
