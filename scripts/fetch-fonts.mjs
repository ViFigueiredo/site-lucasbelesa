// Fetch latin + latin-ext woff2 for the brand fonts and emit a local @font-face stylesheet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const OUT = process.argv[2] || '/home/viniciusfigueiredo/Documentos/Projetos/site-lucasbelesa/public';
const CSS =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700' +
  '&family=Montserrat:wght@600;700&family=Inter:wght@400&display=swap';
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

(async () => {
  const css = await (await fetch(CSS, { headers: { 'User-Agent': UA } })).text();

  // Split into @font-face blocks, keep only latin / latin-ext subsets.
  const blocks = css.split('@font-face').slice(1).map((b) => b.split('/*')[1] ? '/*' + b : b);
  const faces = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const subset = m[1];
    // PT-BR é coberto inteiramente pelo subset `latin` (inclui U+0000-00FF e U+2000-206F,
    // ou seja, acentos, travessões e aspas tipográficas). `latin-ext` não é usado.
    if (subset !== 'latin') continue;
    const body = m[2];
    const fam = /font-family:\s*'([^']+)'/.exec(body)[1];
    const weight = /font-weight:\s*(\d+)/.exec(body)[1];
    const url = /url\((https:[^)]+\.woff2)\)/.exec(body)[1];
    const range = /unicode-range:\s*([^;]+);/.exec(body)[1].trim();
    faces.push({ subset, fam, weight, url, range });
  }
  if (!faces.length) throw new Error('no faces parsed');

  fs.mkdirSync(path.join(OUT, 'assets/fonts'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'assets/css'), { recursive: true });

  const out = [
    '/* Fontes da identidade — baixadas do Google Fonts e servidas localmente.',
    '   Playfair Display Bold (títulos), Montserrat SemiBold/Bold (subtítulos e chamadas),',
    '   Inter Regular (corpo). Subsets latin + latin-ext. Gerado por scripts/fetch-fonts.mjs. */',
  ];
  const manifest = [];
  const byHash = new Map();
  for (const f of faces) {
    const res = await fetch(f.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`fetch ${f.url} -> ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    // O Google serve Montserrat como fonte variável: 600 e 700 apontam para o mesmo
    // arquivo. Deduplicar por hash evita publicar o mesmo woff2 duas vezes.
    let file = byHash.get(hash);
    if (!file) {
      file = `${slug(f.fam)}-${f.weight}-${f.subset}.woff2`;
      byHash.set(hash, file);
      fs.writeFileSync(path.join(OUT, 'assets/fonts', file), buf);
      manifest.push(`${file} ${(buf.length / 1024).toFixed(1)}KiB`);
    }
    out.push(
      '@font-face {',
      `  font-family: '${f.fam}';`,
      '  font-style: normal;',
      `  font-weight: ${f.weight};`,
      '  font-display: swap;',
      `  src: url('../fonts/${file}') format('woff2');`,
      `  unicode-range: ${f.range};`,
      '}'
    );
  }
  fs.writeFileSync(path.join(OUT, 'assets/css/fonts.css'), out.join('\n') + '\n');
  console.log(manifest.join('\n'));
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
