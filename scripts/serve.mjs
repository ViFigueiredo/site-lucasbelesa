#!/usr/bin/env node
// Servidor estático mínimo para conferir o site localmente — zero dependências.
//
//   node scripts/serve.mjs            # http://localhost:4173
//   node scripts/serve.mjs --port 8080
//
// Serve `public/`. Não faz cache, não loga corpo, não expõe nada fora de public/.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public', import.meta.url));
const argPort = process.argv.indexOf('--port');
const PORT = Number(argPort > -1 ? process.argv[argPort + 1] : process.env.PORT || 4173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// Resolve a URL pedida para um caminho absoluto dentro de ROOT, ou null se escapar.
function resolver(urlPath) {
  let caminho = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const abs = normalize(join(ROOT, caminho));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null;
  return abs;
}

const server = createServer(async (req, res) => {
  const alvo = resolver(req.url || '/');
  if (!alvo) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('403');
    return;
  }
  let info;
  try {
    info = await stat(alvo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 — não encontrado');
    console.log(`404 ${req.url}`);
    return;
  }
  if (info.isDirectory()) {
    res.writeHead(302, { Location: `${req.url.replace(/\/?$/, '/')}index.html` }).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': TIPOS[extname(alvo).toLowerCase()] || 'application/octet-stream',
    'Content-Length': info.size,
  });
  console.log(`200 ${req.url}`);
  createReadStream(alvo).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Site em http://localhost:${PORT}  (raiz: ${ROOT})`);
});
