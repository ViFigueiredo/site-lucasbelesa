#!/usr/bin/env node
// Suíte de aceite do site institucional — zero dependências.
//
//   node tests/check.mjs
//
// Cobre A1–A9 e A12 do §10 de docs/specs/site-institucional.md.
// A10 (layout nos 3 tamanhos) e A11 (console limpo) exigem navegador e ficam
// como verificação manual documentada.
//
// Regras desta suíte:
//  - arquivo ausente é FALHA DE TESTE, nunca crash (o RED precisa ser legível);
//  - nenhum teste deixa de rodar por causa de outro (queremos o quadro inteiro);
//  - nada de rede, nada de dependência externa.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(RAIZ, 'public');

// ---------------------------------------------------------------- utilidades

function ler(abs, rotulo) {
  try {
    return readFileSync(abs, 'utf8');
  } catch {
    throw new Error(`arquivo ausente ou ilegível: ${rotulo}\n  esperado em: ${abs}`);
  }
}

const html = () => ler(join(PUBLIC, 'index.html'), 'public/index.html');
const css = () => ler(join(PUBLIC, 'assets/css/styles.css'), 'public/assets/css/styles.css');
const jsConfig = () => ler(join(PUBLIC, 'assets/js/config.js'), 'public/assets/js/config.js');
const jsMain = () => ler(join(PUBLIC, 'assets/js/main.js'), 'public/assets/js/main.js');

/** Texto visível de um trecho de HTML: remove tags, resolve entidades, colapsa espaço. */
function texto(fragmento) {
  return fragmento
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Executa config.js + main.js num contexto isolado (sem DOM) e devolve o sandbox. */
function carregarScripts() {
  const sandbox = { window: {}, console };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(jsConfig(), ctx, { filename: 'config.js' });
  vm.runInContext(jsMain(), ctx, { filename: 'main.js' });
  return sandbox.window;
}

function falhar(msg, detalhes = []) {
  const corpo = detalhes.length ? `\n  - ${detalhes.join('\n  - ')}` : '';
  throw new Error(msg + corpo);
}

function iguais(obtido, esperado, oQue) {
  if (obtido !== esperado) {
    throw new Error(`${oQue}\n  esperado: ${JSON.stringify(esperado)}\n  obtido:   ${JSON.stringify(obtido)}`);
  }
}

// ---------------------------------------------------------------- contraste

function hexParaRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`cor inválida: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminancia(hex) {
  const [r, g, b] = hexParaRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [claro, escuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (escuro + 0.05);
}

// ---------------------------------------------------------------- contrato literal (§4)

const AREAS = [
  {
    id: 'civil',
    titulo: 'Direito Civil',
    itens: [
      'Elaboração e revisão de contratos',
      'Ações de indenização por danos materiais e morais',
      'Responsabilidade civil e cobranças',
    ],
  },
  {
    id: 'consumidor',
    titulo: 'Direito do Consumidor',
    itens: [
      'Ações contra bancos, operadoras de telefonia, companhias aéreas, e-commerces e planos de saúde',
      'Cobranças indevidas, cancelamentos não autorizados e falhas na prestação de serviços',
      'Produtos não entregues ou entregues de forma incompleta',
      'Atrasos e cancelamentos de voos',
      'Empréstimos e descontos não reconhecidos',
      'Revisão de financiamentos de veículos e imobiliários, seguros e tarifas embutidos',
      'Reajustes abusivos de planos de saúde',
    ],
  },
  {
    id: 'familia',
    titulo: 'Direito de Família e Sucessões',
    itens: [
      'Pensão alimentícia: fixação, revisão e cumprimento de sentença',
      'Guarda e regulamentação de convivência',
      'Acordos familiares',
      'Curatela',
      'Inventário e partilha',
    ],
  },
  {
    id: 'penal',
    titulo: 'Direito Penal',
    itens: [
      'Defesa criminal em inquéritos e ações penais',
      'Acompanhamento em delegacia e audiências',
      'Recursos e pedidos de liberdade',
    ],
  },
  {
    id: 'gamer',
    titulo: 'Direito Gamer',
    itens: [
      'Contas banidas ou suspensas sem justificativa',
      'Compras, itens e moedas virtuais pagos e não entregues',
      'Golpes em negociação de contas, skins e itens',
      'Pedidos de reembolso em lojas digitais e plataformas de jogos',
      'Contratos de streamers, criadores de conteúdo, atletas e equipes de e-sports',
      'Proteção de dados e vazamento de informações de jogadores',
    ],
  },
];

const PILARES = [
  { id: 'atendimento', titulo: 'Atendimento próximo', descricao: 'você fala diretamente comigo' },
  { id: 'clareza', titulo: 'Clareza', descricao: 'explico o caso em linguagem simples' },
  {
    id: 'estrategia',
    titulo: 'Estratégia',
    descricao:
      'antes de entrar com uma ação, avalio os riscos e as teses possíveis e compartilho com você',
  },
  {
    id: 'transparencia',
    titulo: 'Transparência',
    descricao: 'os honorários são combinados antes do início do trabalho',
  },
];

const TOKENS = {
  '--azul': '#173454',
  '--vinho': '#7A1B27',
  '--cinza': '#C9CACC',
  '--preto': '#111111',
  '--bege': '#DCC7A1',
  '--offwhite': '#F4F3F1',
};

const PARES = [
  ['#111111', '#F4F3F1', 'texto sobre off-white'],
  ['#173454', '#F4F3F1', 'azul sobre off-white'],
  ['#7A1B27', '#F4F3F1', 'vinho sobre off-white'],
  ['#F4F3F1', '#173454', 'claro sobre azul'],
  ['#FFFFFF', '#7A1B27', 'branco sobre vinho (CTA)'],
  ['#DCC7A1', '#173454', 'bege sobre azul'],
  ['#C9CACC', '#173454', 'cinza sobre azul'],
  ['#4A5568', '#F4F3F1', 'texto secundário sobre off-white'],
];

// ---------------------------------------------------------------- runner

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

// ---------------------------------------------------------------- A1

teste('A1 · 5 grupos de áreas, com 3/7/5/3/6 itens e texto literal', () => {
  const doc = html();
  const encontrados = new Map();
  const re = /<article\b[^>]*data-area="([a-z-]+)"[^>]*>([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(doc))) encontrados.set(m[1], m[2]);

  const faltando = AREAS.filter((a) => !encontrados.has(a.id)).map(
    (a) => `grupo "${a.titulo}" (data-area="${a.id}") não encontrado`,
  );
  if (faltando.length) falhar('grupos de áreas ausentes:', faltando);

  iguais(encontrados.size, 5, 'quantidade de grupos de áreas');

  for (const area of AREAS) {
    const corpo = encontrados.get(area.id);
    const titulo = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(corpo);
    iguais(titulo ? texto(titulo[1]) : null, area.titulo, `título do grupo ${area.id}`);

    const itens = [...corpo.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((x) => texto(x[1]));
    if (itens.length !== area.itens.length) {
      falhar(
        `${area.titulo}: esperados ${area.itens.length} itens, encontrados ${itens.length}`,
        itens,
      );
    }
    area.itens.forEach((esperado, i) => iguais(itens[i], esperado, `${area.titulo} — item ${i + 1}`));
  }
});

// ---------------------------------------------------------------- A2

teste('A2 · 4 pilares com rótulo e descrição literais', () => {
  const doc = html();
  const encontrados = new Map();
  const re = /<article\b[^>]*data-pilar="([a-z-]+)"[^>]*>([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(doc))) encontrados.set(m[1], m[2]);

  const faltando = PILARES.filter((p) => !encontrados.has(p.id)).map(
    (p) => `pilar "${p.titulo}" (data-pilar="${p.id}") não encontrado`,
  );
  if (faltando.length) falhar('pilares ausentes:', faltando);
  iguais(encontrados.size, 4, 'quantidade de pilares');

  for (const pilar of PILARES) {
    const corpo = encontrados.get(pilar.id);
    const titulo = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(corpo);
    iguais(titulo ? texto(titulo[1]) : null, pilar.titulo, `rótulo do pilar ${pilar.id}`);
    const desc = /<p\b[^>]*>([\s\S]*?)<\/p>/.exec(corpo);
    iguais(desc ? texto(desc[1]) : null, pilar.descricao, `descrição do pilar ${pilar.id}`);
  }
});

// ---------------------------------------------------------------- A3

teste('A3 · toda <img> tem atributo alt', () => {
  const doc = html();
  const imgs = [...doc.matchAll(/<img\b[^>]*>/g)].map((x) => x[0]);
  if (!imgs.length) falhar('nenhuma <img> encontrada em index.html');
  const semAlt = imgs.filter((tag) => !/\balt\s*=/.test(tag));
  if (semAlt.length) falhar(`${semAlt.length} <img> sem alt:`, semAlt);
});

// ---------------------------------------------------------------- A4

teste('A4 · tokens da marca conferem e todos os pares de texto passam em AA', () => {
  const folha = css();
  for (const [token, esperado] of Object.entries(TOKENS)) {
    const m = new RegExp(`${token}\\s*:\\s*(#[0-9a-fA-F]{6})`).exec(folha);
    if (!m) throw new Error(`token ${token} não declarado em styles.css`);
    iguais(m[1].toUpperCase(), esperado, `token ${token}`);
  }

  const reprovados = [];
  for (const [frente, fundo, rotulo] of PARES) {
    const razao = contraste(frente, fundo);
    if (razao < 4.5) reprovados.push(`${rotulo}: ${frente}/${fundo} = ${razao.toFixed(2)} (< 4.5)`);
  }
  if (reprovados.length) falhar('pares abaixo de AA:', reprovados);
});

// ---------------------------------------------------------------- A5

teste('A5 · toda referência local em href/src/url() existe em public/', () => {
  const doc = html();
  const folha = css();
  const faltando = [];
  const externa = (u) => /^(?:[a-z]+:|\/\/|#|$)/i.test(u);

  const refsHtml = [...doc.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
  for (const ref of refsHtml) {
    if (externa(ref) || ref.startsWith('mailto:') || ref.startsWith('tel:')) continue;
    const alvo = join(PUBLIC, ref.split('?')[0].split('#')[0]);
    try {
      readFileSync(alvo);
    } catch {
      faltando.push(`index.html → ${ref}`);
    }
  }

  const refsCss = [...folha.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]);
  for (const ref of refsCss) {
    if (/^(?:[a-z]+:|\/\/|data:)/i.test(ref)) continue;
    const alvo = join(PUBLIC, 'assets/css', ref.split('?')[0].split('#')[0]);
    try {
      readFileSync(alvo);
    } catch {
      faltando.push(`styles.css → ${ref}`);
    }
  }

  if (faltando.length) falhar('referências locais quebradas:', faltando);
});

// ---------------------------------------------------------------- A6

teste('A6 · CTAs de WhatsApp geram wa.me/digitos?text= e abrem com segurança', () => {
  const doc = html();
  const janela = carregarScripts();
  const api = janela.SITE_MAIN;
  if (!api || typeof api.montarLinkWhatsApp !== 'function') {
    throw new Error('main.js não expõe window.SITE_MAIN.montarLinkWhatsApp');
  }

  const link = api.montarLinkWhatsApp('5527992892844', 'Olá, preciso de orientação jurídica.');
  const esperado =
    'https://wa.me/5527992892844?text=' + encodeURIComponent('Olá, preciso de orientação jurídica.');
  iguais(link, esperado, 'link de WhatsApp com número e mensagem');

  // número com máscara precisa ser reduzido a dígitos
  const mascarado = api.montarLinkWhatsApp('+55 (11) 99999-8888', 'oi');
  iguais(mascarado, 'https://wa.me/5511999998888?text=oi', 'link com número mascarado');

  // número inválido não pode virar link quebrado
  const invalido = api.montarLinkWhatsApp('abc', 'oi');
  iguais(invalido, null, 'link com número sem dígitos');

  const ancoras = [...doc.matchAll(/<a\b[^>]*data-whatsapp[^>]*>/g)].map((m) => m[0]);
  if (!ancoras.length) falhar('nenhum <a data-whatsapp> encontrado em index.html');
  for (const tag of ancoras) {
    if (!/\btarget\s*=\s*"_blank"/.test(tag)) falhar('CTA sem target="_blank":', [tag]);
    if (!/\brel\s*=\s*"[^"]*noopener[^"]*"/.test(tag)) falhar('CTA sem rel=noopener:', [tag]);
  }

  if (!/Fale Comigo/.test(texto(doc))) throw new Error('CTA "Fale Comigo" ausente');
  if (/Fale com um Advogado|Olá, Lucas\.|hora marcada/.test(doc)) falhar('texto antigo ainda presente (CTA, saudação ou "hora marcada")');
});

// ---------------------------------------------------------------- A7

teste('A7 · formulário não navega, compõe mensagem e não chama rede', () => {
  const doc = html();
  const mainSrc = jsMain();

  const form = /<form\b[^>]*>/.exec(doc);
  if (!form) throw new Error('nenhum <form> encontrado em index.html');
  if (/\baction\s*=/.test(form[0])) falhar('o formulário não deve ter action de rede:', [form[0]]);
  if (!/\bmethod\s*=\s*"post"/i.test(form[0])) {
    throw new Error('o formulário deve declarar method="post" (sem action, nunca envia)');
  }

  if (!/preventDefault\s*\(/.test(mainSrc)) throw new Error('main.js não chama preventDefault()');
  if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(mainSrc)) {
    throw new Error('main.js faz requisição de rede — o site não tem backend');
  }

  const janela = carregarScripts();
  const api = janela.SITE_MAIN;
  if (!api || typeof api.montarMensagemContato !== 'function') {
    throw new Error('main.js não expõe window.SITE_MAIN.montarMensagemContato');
  }
  const msg = api.montarMensagemContato({
    nome: 'Maria Souza',
    email: 'maria@exemplo.com',
    assunto: 'Direito do Consumidor',
    mensagem: 'Cobrança indevida no cartão.',
  });
  for (const trecho of ['Maria Souza', 'maria@exemplo.com', 'Direito do Consumidor', 'Cobrança indevida']) {
    if (!msg.includes(trecho)) throw new Error(`mensagem do formulário não contém "${trecho}":\n${msg}`);
  }

  if (!/role\s*=\s*"status"/.test(doc)) throw new Error('falta região role="status" para o retorno do formulário');
});

// ---------------------------------------------------------------- A8

teste('A8 · config centralizada e placeholders documentados no README', () => {
  const janela = carregarScripts();
  const cfg = janela.SITE_CONFIG;
  if (!cfg || typeof cfg !== 'object') throw new Error('config.js não define window.SITE_CONFIG');

  const obrigatorias = ['whatsapp', 'email', 'oab', 'cidade', 'endereco', 'instagram', 'pendentes'];
  const faltando = obrigatorias.filter((k) => !(k in cfg));
  if (faltando.length) falhar('chaves ausentes em SITE_CONFIG:', faltando);
  if (!Array.isArray(cfg.pendentes)) {
    throw new Error('SITE_CONFIG.pendentes deve ser uma lista (pode ser vazia)');
  }
  // nenhum placeholder de exemplo pode ter sobrado nos dados
  const marcadores = ['000000', '00000000', 'exemplo', 'seudominio', 'Cidade/UF', 'UF 0', 'Rua Exemplo'];
  for (const chave of obrigatorias.slice(0, 6)) {
    const valor = String(cfg[chave] ?? '');
    const achado = marcadores.find((m) => valor.includes(m));
    if (achado) throw new Error(`SITE_CONFIG.${chave} ainda contém placeholder ("${achado}")`);
  }
  const desconhecidas = cfg.pendentes.filter((k) => !(k in cfg));
  if (desconhecidas.length) falhar('pendentes listam chaves que não existem:', desconhecidas);

  const readme = ler(join(RAIZ, 'README.md'), 'README.md');
  const naoDocumentadas = cfg.pendentes.filter((k) => !readme.includes(k));
  if (naoDocumentadas.length) falhar('placeholders não listados no README:', naoDocumentadas);

  // nenhum dado pendente pode viver fora do config.js
  const doc = html();
  for (const chave of cfg.pendentes) {
    const valor = String(cfg[chave] ?? '');
    if (valor && doc.includes(valor)) {
      throw new Error(`valor pendente de "${chave}" aparece fixo em index.html — deve vir do config.js`);
    }
  }
});

// ---------------------------------------------------------------- A9

teste('A9 · arquivos de deploy presentes e coerentes', () => {
  const wrangler = ler(join(RAIZ, 'wrangler.toml'), 'wrangler.toml');
  if (!/^\s*name\s*=\s*"[^"]+"/m.test(wrangler)) throw new Error('wrangler.toml sem "name"');
  if (!/^\s*\[assets\]\s*$[\s\S]*?^\s*directory\s*=\s*"\.\/public"\s*$/m.test(wrangler)) {
    throw new Error('wrangler.toml deve declarar [assets] directory = "./public"');
  }

  const headers = ler(join(PUBLIC, '_headers'), 'public/_headers');
  const exigidos = [
    [/Content-Security-Policy/i, 'Content-Security-Policy'],
    [/default-src\s+'self'/, "default-src 'self'"],
    [/object-src\s+'none'/, "object-src 'none'"],
    [/frame-ancestors\s+'none'/, "frame-ancestors 'none'"],
    [/X-Content-Type-Options\s*:\s*nosniff/i, 'X-Content-Type-Options: nosniff'],
    [/Referrer-Policy\s*:/i, 'Referrer-Policy'],
    [/Permissions-Policy\s*:/i, 'Permissions-Policy'],
  ];
  const ausentes = exigidos.filter(([re]) => !re.test(headers)).map(([, nome]) => nome);
  if (ausentes.length) falhar('_headers incompleto:', ausentes);

  const robots = ler(join(PUBLIC, 'robots.txt'), 'public/robots.txt');
  if (/^\s*Disallow:\s*\/\s*$/m.test(robots) && !/^\s*Allow:\s*\//m.test(robots)) {
    throw new Error('robots.txt bloqueia o site inteiro');
  }
});

// ---------------------------------------------------------------- A12

teste('A12 · nenhuma dependência externa em runtime', () => {
  const doc = html();
  const folha = css();
  const fontes = ler(join(PUBLIC, 'assets/css/fonts.css'), 'public/assets/css/fonts.css');

  const externos = [];
  for (const m of doc.matchAll(/<(?:link|script|img)\b[^>]*\b(?:href|src)\s*=\s*"([^"]+)"/gi)) {
    if (/\brel\s*=\s*"canonical"/.test(m[0])) continue; // canonical é metadado, não carrega recurso
    if (/^https?:\/\//i.test(m[1])) externos.push(`index.html → ${m[1]}`);
  }
  for (const [nome, src] of [
    ['styles.css', folha],
    ['fonts.css', fontes],
  ]) {
    for (const m of src.matchAll(/url\(\s*['"]?(https?:[^'")]+)/gi)) externos.push(`${nome} → ${m[1]}`);
    for (const m of src.matchAll(/@import\s+(?:url\()?['"]?(https?:[^'");]+)/gi)) {
      externos.push(`${nome} → @import ${m[1]}`);
    }
  }
  if (externos.length) falhar('recursos carregados de domínio externo:', externos);
});

// ---------------------------------------------------------------- extra: estrutura

teste('Extra · documento acessível e semântico', () => {
  const doc = html();
  const exigencias = [
    [/^<!DOCTYPE html>/i, 'DOCTYPE html'],
    [/<html\b[^>]*\blang\s*=\s*"pt-BR"/i, 'lang="pt-BR"'],
    [/<header\b/, '<header>'],
    [/<nav\b/, '<nav>'],
    [/<main\b/, '<main>'],
    [/<footer\b/, '<footer>'],
    [/Pular para o conteúdo/i, 'skip link'],
    [/<main\b[^>]*\bid\s*=\s*"conteudo"/i, 'main com id="conteudo" (alvo do skip link)'],
  ];
  const ausentes = exigencias.filter(([re]) => !re.test(doc)).map(([, nome]) => nome);
  if (ausentes.length) falhar('estrutura ausente:', ausentes);

  const h1 = [...doc.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
  if (h1.length !== 1) throw new Error(`esperado exatamente 1 <h1>, encontrados ${h1.length}`);

  const secoes = [...doc.matchAll(/<section\b([^>]*)>/g)].map((m) => m[1]);
  const semLabel = secoes.filter((attrs) => !/aria-labelledby\s*=/.test(attrs));
  if (semLabel.length) falhar('section sem aria-labelledby:', semLabel);

  for (const m of doc.matchAll(/<a\b[^>]*href\s*=\s*"https?:\/\/[^"]*"[^>]*>/gi)) {
    if (/\btarget\s*=\s*"_blank"/.test(m[0]) && !/noopener/.test(m[0])) {
      throw new Error(`link externo em nova aba sem rel=noopener: ${m[0]}`);
    }
  }
});

// ---------------------------------------------------------------- A13

teste('A13 · rodapé com 3 ícones (Instagram, WhatsApp, e-mail) e links vindos do config', () => {
  const janela = carregarScripts();
  const cfg = janela.SITE_CONFIG;
  iguais(janela.SITE_MAIN.montarLinkWhatsApp(cfg.whatsapp, ''), 'https://wa.me/5527992892844', 'link wa.me');
  iguais(cfg.instagram, 'https://www.instagram.com/lucasbelesa.adv/', 'SITE_CONFIG.instagram');
  iguais(cfg.email, 'lucasbelesa.adv@gmail.com', 'SITE_CONFIG.email');

  const doc = html();
  const rodape = /<footer\b[\s\S]*?<\/footer>/.exec(doc);
  if (!rodape) throw new Error('rodapé <footer> não encontrado');
  const icones = [...rodape[0].matchAll(/<a\b[^>]*aria-label="[^"]*"[^>]*>/g)].map((m) => m[0]);
  const rotulos = icones.map((t) => /aria-label="([^"]*)"/.exec(t)[1]);
  iguais(rotulos.join(' | '), 'Instagram de Lucas Belesa | WhatsApp | E-mail', 'rótulos dos ícones do rodapé');

  const fontes = ['data-link="instagram"', 'data-whatsapp', 'data-link="email"'];
  icones.forEach((tag, i) => {
    if (!tag.includes(fontes[i])) falhar(`ícone "${rotulos[i]}" sem a fonte de href esperada`, [tag]);
    if (/\bhref\s*=\s*"https?:\/\//.test(tag)) falhar(`ícone "${rotulos[i]}" com href fixo no HTML`, [tag]);
    if (/\btarget\s*=\s*"_blank"/.test(tag) && !/rel\s*=\s*"noopener noreferrer"/.test(tag)) {
      throw new Error(`ícone "${rotulos[i]}" em nova aba sem rel="noopener noreferrer"`);
    }
  });

  // sem contato em texto no rodapé: só ícones (e a identificação profissional)
  const textoRodape = texto(rodape[0]);
  for (const proibido of [cfg.email, '(27)', '99289-2844', '@']) {
    if (textoRodape.includes(proibido)) falhar(`rodapé repete contato em texto: "${proibido}"`);
  }
  // OAB e endereço são preenchidos pelo config.js (data-config), não fixos no HTML
  if (/data-config="cidade"/.test(doc)) falhar('data-config="cidade" não deve mais aparecer na ficha (Atuação é texto estático)');
  for (const chave of ['oab', 'endereco']) {
    if (!rodape[0].includes(`data-config="${chave}"`)) throw new Error(`rodapé sem data-config="${chave}"`);
  }
});

// ---------------------------------------------------------------- A14

teste('A14 · contato: formulário único e centralizado, sem coluna lateral', () => {
  const doc = html();
  const secao = /<section\b[^>]*id="contato"[\s\S]*?<\/section>/.exec(doc);
  if (!secao) throw new Error('section#contato não encontrada');
  if (/contato__lado|contato__lista/.test(doc)) falhar('restos da coluna lateral removida no HTML');
  if (/contato__lado|contato__lista|contato__rotulo|contato__valor/.test(css())) {
    falhar('restos da coluna lateral removida no CSS');
  }
  if (!/class="formulario"/.test(secao[0])) throw new Error('formulário fora da seção de contato');

  const posForm = secao[0].indexOf('class="formulario"');
  const posObs = secao[0].indexOf('class="contato__obs"');
  if (posObs < posForm) throw new Error('nota de privacidade deve ficar abaixo do formulário');
  if (!/\.contato__grade\s*\{[^}]*max-width:\s*680px[^}]*margin-inline:\s*auto/.test(css())) {
    throw new Error('.contato__grade deve ser centralizado (max-width 680px, margin-inline auto)');
  }
});

// ---------------------------------------------------------------- SEO e publicação no domínio principal

const DOMINIO = 'https://lucasbelesa.adv.br';

teste('SEO · canonical aponta para o domínio principal (sem www)', () => {
  const doc = html();
  const m = /<link\b[^>]*\brel\s*=\s*"canonical"[^>]*>/i.exec(doc);
  if (!m) throw new Error('falta <link rel="canonical">');
  iguais(/\bhref\s*=\s*"([^"]+)"/.exec(m[0])?.[1], `${DOMINIO}/`, 'canonical com href errado');
});

teste('SEO · og:image e twitter:image são URL absoluta do domínio principal e o arquivo existe', () => {
  const doc = html();
  const alvo = `${DOMINIO}/assets/img/og-image.png`;
  for (const prop of ['og:image', 'twitter:image']) {
    const re = new RegExp(`<meta\\b[^>]*\\b(?:property|name)\\s*=\\s*"${prop}"[^>]*>`, 'i');
    const tag = re.exec(doc)?.[0];
    if (!tag) throw new Error(`falta <meta ${prop}>`);
    iguais(/\bcontent\s*=\s*"([^"]+)"/.exec(tag)?.[1], alvo, `${prop} deve ser URL absoluta`);
  }
  // O arquivo existe em public/ (o caminho é o mesmo, sem o domínio).
  ler(join(PUBLIC, 'assets/img/og-image.png'), 'public/assets/img/og-image.png');
});

teste('SEO · sitemap.xml existe e lista só a URL principal', () => {
  const xml = ler(join(PUBLIC, 'sitemap.xml'), 'public/sitemap.xml');
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);
  iguais(JSON.stringify(locs), JSON.stringify([`${DOMINIO}/`]), 'sitemap.xml deve ter só <loc> da URL principal');
});

teste('SEO · robots.txt declara o sitemap e mantém as regras', () => {
  const robots = ler(join(PUBLIC, 'robots.txt'), 'public/robots.txt');
  if (!/^\s*Sitemap:\s*https:\/\/lucasbelesa\.adv\.br\/sitemap\.xml\s*$/m.test(robots)) {
    throw new Error('robots.txt sem "Sitemap: https://lucasbelesa.adv.br/sitemap.xml"');
  }
  if (!/^\s*User-agent:\s*\*\s*$/m.test(robots) || !/^\s*Allow:\s*\/\s*$/m.test(robots)) {
    throw new Error('robots.txt perdeu as regras User-agent: * / Allow: /');
  }
});

teste('SEO · JSON-LD válido com LegalService e dados de contato', () => {
  const doc = html();
  const m = /<script\b[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i.exec(doc);
  if (!m) throw new Error('falta bloco application/ld+json');
  let dados;
  try {
    dados = JSON.parse(m[1]);
  } catch (erro) {
    throw new Error(`JSON-LD inválido: ${erro.message}`);
  }
  iguais(dados['@type'], 'LegalService', 'JSON-LD @type');
  iguais(dados.url, `${DOMINIO}/`, 'JSON-LD url');
  iguais(dados.telephone, '+5527992892844', 'JSON-LD telephone');
  iguais(dados.email, 'lucasbelesa.adv@gmail.com', 'JSON-LD email');
});

// ---------------------------------------------------------------- carrossel de áreas

teste('Carrossel · viewport acessível, 5 slides com 3/7/5/3/6 itens, botões com aria-label e 5 pontos', () => {
  const doc = html();
  const viewport = /<div\b[^>]*data-carrossel\b[^>]*>/.exec(doc)?.[0];
  if (!viewport) throw new Error('viewport do carrossel (data-carrossel) não encontrado');
  for (const attr of ['tabindex="0"', 'role="region"', 'aria-roledescription="carrossel"', 'aria-label="Áreas de atuação"']) {
    if (!viewport.includes(attr)) falhar(`viewport do carrossel sem ${attr}:`, [viewport]);
  }

  const slides = [...doc.matchAll(/<article\b[^>]*\bclass="area"[^>]*>([\s\S]*?)<\/article>/g)];
  iguais(slides.length, 5, 'quantidade de slides');
  slides.forEach((m, i) => {
    const tag = /<article\b[^>]*>/.exec(m[0])[0];
    if (!tag.includes('role="group"') || !tag.includes('aria-roledescription="slide"')) {
      falhar(`slide ${i + 1} sem role="group" / aria-roledescription="slide"`, [tag]);
    }
    iguais(/aria-label="([^"]*)"/.exec(tag)?.[1], `${i + 1} de 5`, `aria-label do slide ${i + 1}`);
    const itens = [...m[1].matchAll(/<li\b[^>]*>/g)].length;
    iguais(itens, AREAS[i].itens.length, `itens do slide ${i + 1} (${AREAS[i].titulo})`);
  });

  if (!/<div\b[^>]*class="areas__faixa"[^>]*data-carrossel-faixa/.test(doc)) throw new Error('faixa (areas__faixa / data-carrossel-faixa) não encontrada');

  const anterior = /<button\b[^>]*data-carrossel-anterior[^>]*>/.exec(doc)?.[0];
  const proximo = /<button\b[^>]*data-carrossel-proximo[^>]*>/.exec(doc)?.[0];
  if (!anterior || !/aria-label="Área anterior"/.test(anterior)) throw new Error('botão anterior sem aria-label="Área anterior"');
  if (!proximo || !/aria-label="Próxima área"/.test(proximo)) throw new Error('botão próximo sem aria-label="Próxima área"');
  if (/data-carrossel-(anterior|proximo)[^>]*\bdisabled\b/.test(doc)) throw new Error('botões do carrossel não podem nascer desabilitados (loop)');
  const pontos = [...doc.matchAll(/<button\b[^>]*data-carrossel-ponto[^>]*>/g)].length;
  iguais(pontos, 5, 'quantidade de pontos (indicadores)');

  const folha = css();
  const bloco = (seletor) => new RegExp(`${seletor.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`).exec(folha)?.[1] ?? '';
  const viewportCss = bloco('.areas');
  for (const trecho of ['overflow-x: auto', 'scroll-snap-type: x mandatory']) {
    if (!viewportCss.includes(trecho)) throw new Error(`.areas sem "${trecho}" (base sem JS)`);
  }
  if (!/scroll-snap-align:\s*start/.test(bloco('.area'))) throw new Error('.area sem scroll-snap-align: start');
  if (!/flex:\s*0 0 var\(--largura\)/.test(bloco('.area'))) throw new Error('.area sem largura por variável --largura');
  if (!/@media \(min-width:\s*600px\)\s*\{\s*\.areas\s*\{\s*--visiveis:\s*2;/.test(folha)) throw new Error('2 cards por tela a partir de 600px não declarado');
  if (!/@media \(min-width:\s*900px\)\s*\{\s*\.areas\s*\{\s*--visiveis:\s*3;/.test(folha)) throw new Error('3 cards por tela a partir de 900px não declarado');

  const js = jsMain();
  for (const trecho of ['aria-hidden', 'inert', 'translate3d', 'transitionend', 'pointerdown', 'prefers-reduced-motion', 'ArrowLeft', 'ArrowRight']) {
    if (!js.includes(trecho)) throw new Error(`main.js sem "${trecho}"`);
  }
});

teste('_headers · CSS com no-cache (revalida por ETag, sem cache de 24h)', () => {
  const headers = ler(join(PUBLIC, '_headers'), 'public/_headers');
  const cabecalho = (caminho) => new RegExp(`^${caminho.replace(/[./]/g, '\\$&')}\\s*\\n\\s*Cache-Control:\\s*([^\\n]+)`, 'm').exec(headers)?.[1]?.trim();
  iguais(cabecalho('/assets/css/styles.css'), 'no-cache', 'Cache-Control de /assets/css/styles.css');
  iguais(cabecalho('/assets/css/fonts.css'), 'no-cache', 'Cache-Control de /assets/css/fonts.css');
});

// ---------------------------------------------------------------- hero · fotos

teste('Hero · duas fotos existem, são referenciadas, com alt corretos; foto antiga removida', () => {
  const doc = html();
  for (const arq of ['foto-1.jpg', 'foto-2.jpg']) {
    ler(join(PUBLIC, 'assets', arq), `public/assets/${arq}`);
  }
  let antiga = true;
  try {
    ler(join(PUBLIC, 'assets/foto.jpg'), 'public/assets/foto.jpg');
  } catch {
    antiga = false;
  }
  if (antiga) falhar('foto antiga public/assets/foto.jpg ainda existe');
  if (/assets\/foto\.jpg/.test(doc + css() + jsMain())) falhar('referência à foto antiga (assets/foto.jpg) ainda presente');

  const imgs = [...doc.matchAll(/<img\b[^>]*class="retrato__foto[^"]*"[^>]*>/g)].map((m) => m[0]);
  iguais(imgs.length, 2, 'imagens .retrato__foto no hero');
  const f1 = imgs.find((t) => t.includes('assets/foto-1.jpg'));
  const f2 = imgs.find((t) => t.includes('assets/foto-2.jpg'));
  if (!f1 || !f2) falhar('hero precisa de assets/foto-1.jpg e assets/foto-2.jpg', imgs);
  iguais(/\salt="([^"]*)"/.exec(f1)?.[1], 'Retrato do advogado Lucas Belesa Chabudé', 'alt da foto 1');
  iguais(/\salt="([^"]*)"/.exec(f2)?.[1], '', 'alt da foto 2 (decorativa)');
  if (!/aria-hidden="true"/.test(f2)) falhar('foto 2 sem aria-hidden="true"', [f2]);
  if (!/loading="eager"/.test(f1) || !/fetchpriority="high"/.test(f1)) falhar('foto 1 sem loading="eager" e fetchpriority="high"', [f1]);
  if (!/loading="eager"/.test(f2)) falhar('foto 2 sem loading="eager" (sem piscar no 1º ciclo)', [f2]);
});

teste('Hero · crossfade por CSS, proporção 4:5, reduced-motion mostra só a foto 1, fallbacks no JS', () => {
  const folha = css();
  const bloco = (seletor) => new RegExp(`${seletor.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`).exec(folha)?.[1] ?? '';
  if (!/@keyframes troca-foto\s*\{/.test(folha)) throw new Error('falta @keyframes troca-foto');
  if (!/animation:\s*troca-foto\s+10s/.test(bloco('.retrato__foto'))) throw new Error('.retrato__foto sem animação troca-foto de 10s');
  if (!/animation-delay:\s*-5s/.test(bloco('.retrato__foto--2'))) throw new Error('segunda foto sem animation-delay de -5s (meio ciclo)');
  if (!/aspect-ratio:\s*4 \/ 5/.test(bloco('.retrato'))) throw new Error('moldura .retrato sem aspect-ratio 4 / 5');

  const reduzido = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)$/.exec(folha)?.[1] ?? '';
  if (!/\.retrato__foto--2\s*\{\s*display:\s*none/.test(reduzido)) throw new Error('reduced-motion não esconde a foto 2');
  if (!/\.retrato__foto\s*\{\s*animation:\s*none/.test(reduzido)) throw new Error('reduced-motion não desliga a animação da foto');

  if (!/\.retrato\[data-uma-foto='true'\] \.retrato__foto\s*\{\s*animation:\s*none/.test(folha)) {
    throw new Error('com só uma foto carregada ela deve ficar sem animação');
  }

  const js = jsMain();
  for (const trecho of ['data-falhou', 'data-uma-foto', 'data-sem-foto']) {
    if (!js.includes(trecho)) throw new Error(`main.js sem "${trecho}" (fallback das duas fotos)`);
  }
});

// ---------------------------------------------------------------- carrossel · início

teste('Carrossel · início no card 01 por CSS (sem medir), scroll zerado e reposição em load/pageshow', () => {
  const folha = css();
  const bloco = (seletor) => new RegExp(`${seletor.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`).exec(folha)?.[1] ?? '';
  if (!/--largura:\s*85%/.test(bloco('.areas'))) throw new Error('.areas sem --largura base (85%)');
  if (!/overflow-anchor:\s*none/.test(bloco('.areas'))) throw new Error('.areas sem overflow-anchor: none');

  const js = jsMain();
  if (/passo\s*\(/.test(js)) throw new Error('main.js ainda mede a distância entre cards (passo())');
  if (!js.includes('var(--largura) + var(--gap)')) throw new Error('offset do carrossel deve usar var(--largura) + var(--gap)');
  if (!js.includes('viewport.scrollLeft = 0')) throw new Error('main.js não zera o scroll nativo do viewport');
  if (!/addEventListener\('pageshow'/.test(js)) throw new Error('main.js sem pageshow (voltar do cache)');
  if (!/addEventListener\('load'/.test(js) || !js.includes('document.fonts.ready')) throw new Error('main.js sem reposição após load + document.fonts.ready');
  if (!/var pos = COPIAS;|pos = COPIAS;/.test(js)) throw new Error('posição inicial não é o card 01 (COPIAS)');
  if (/addEventListener\('resize'/.test(js)) throw new Error('resize não deveria recalcular em JS (o CSS cuida disso)');
});

// ---------------------------------------------------------------- execução

let falhas = 0;
for (const { nome, fn } of testes) {
  try {
    fn();
    console.log(`✔ ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`✘ ${nome}`);
    console.log(String(erro.message).split('\n').map((l) => `    ${l}`).join('\n'));
  }
}

console.log('');
console.log(`${testes.length - falhas}/${testes.length} testes passaram, ${falhas} falharam.`);
process.exit(falhas ? 1 : 0);