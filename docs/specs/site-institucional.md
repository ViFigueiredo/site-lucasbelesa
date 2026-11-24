# SDD — Site institucional de Lucas Belesa Chabudé (advogado)

Status: **aprovado para implementação**
Data: 2026-11-23
Escopo: site estático de página única, sem backend.

## 1. Objetivo

Presença institucional sóbria e premium para um advogado autônomo, com um único
objetivo de conversão: o visitante iniciar uma conversa no WhatsApp. O site não
capta lead por formulário próprio (não há backend) e não promete resultado.

Não-objetivos: blog, CMS, área logada, analytics de terceiros, captura de dados
em servidor, múltiplas páginas, i18n.

## 2. Identidade visual

Fonte da verdade: manual de identidade `/home/viniciusfigueiredo/Downloads/logo.pdf`
(8 páginas). Os valores abaixo foram **extraídos dos operadores de cor do próprio
PDF** (`rg`/`RG`), não copiados do briefing — e conferem com ele, com uma
divergência registrada:

| Papel | Token | Valor no PDF | Uso |
|---|---|---|---|
| Azul | `--azul` | `#173454` | fundos escuros dominantes, títulos |
| Vinho | `--vinho` | `#7A1B27` | botões de CTA e destaques |
| Cinza claro | `--cinza` | `#C9CACC` | cinzas neutros, bordas decorativas |
| Preto | `--preto` | `#111111` | corpo de texto |
| Bege | `--bege` | `#DCC7A1` | detalhes sutis (filetes sobre azul) |
| Off-white | `--offwhite` | `#F4F3F1` | fundo das seções claras |

> **Divergência registrada:** o briefing diz `#C8CACC`; o PDF implementa
> `#C9CACC` (`.7882 .7922 .8`). Vale o PDF, conforme a instrução de que a
> identidade do manual prevalece.

Tipografia (do manual — páginas 4 e 5):
- Títulos: **Playfair Display Bold** (700)
- Subtítulos: **Montserrat SemiBold** (600)
- Corpo: **Inter Regular** (400)
- Chamadas/destaques: **Montserrat Bold** (700)

Fontes servidas **localmente** em `public/assets/fonts/*.woff2`, subset `latin`
(cobre PT-BR integralmente, inclusive acentos, travessões e aspas tipográficas),
88 KiB no total. Montserrat é fonte variável: 600 e 700 compartilham o mesmo
arquivo (deduplicado por hash em `scripts/fetch-fonts.mjs`). Nenhuma requisição a
domínio externo em runtime.

### 2.1 Contraste (WCAG 2.1 AA) — medido, não estimado

Todos os pares de texto pretendidos foram medidos. Nenhum reprova.

| Frente | Fundo | Razão | Veredito |
|---|---|---|---|
| `#111111` | `#F4F3F1` | 17.03 | AA texto |
| `#173454` | `#F4F3F1` | 11.44 | AA texto |
| `#7A1B27` | `#F4F3F1` | 9.40 | AA texto |
| `#F4F3F1` | `#173454` | 11.44 | AA texto |
| `#FFFFFF` | `#7A1B27` | 10.43 | AA texto (botão CTA) |
| `#DCC7A1` | `#173454` | 7.69 | AA texto |
| `#C9CACC` | `#173454` | 7.73 | AA texto |
| `#4A5568` | `#F4F3F1` | 6.79 | AA texto (texto secundário) |

Consequências de projeto:
- `#C9CACC` **não** pode ser usado como texto sobre `#F4F3F1` (razão 1.48).
  Em fundo claro ele só aparece como borda decorativa, nunca como divisória
  essencial.
- O anel de foco precisa de ≥3:1 contra o fundo adjacente. Vinho sobre off-white
  = 9.40 (ok). Vinho sobre azul = 1.22 (**reprova**) — por isso as seções escuras
  usam o anel **bege** (`#DCC7A1`, 7.69 sobre azul). O anel é definido por
  variável CSS sobrescrita no escopo da seção.

### 2.2 Marcas

O monograma LB é o único ativo que **não** pode ser recriado por tipografia, então
é extraído do PDF por `scripts/build-brand-assets.sh`:

1. rasteriza a página 6 (prancha do MONOGRAMA) a 300 dpi com `gs`;
2. recorta o primeiro monograma a partir da bounding box medida na análise de
   componentes conexos (134×157 px a 72 dpi, em +244+309);
3. converte o fundo chapado `#E6E4E1` em transparente e ajusta ao desenho;
4. usa o **canal alfa como máscara** e repinta em cada cor da marca.

Repintar pela máscara (em vez de guardar 4 PNGs do manual) garante que todas as
variantes sejam o mesmo desenho, já que o manual traz o monograma em cores que não
são exatamente as cores de apoio. Verificação: a cobertura de alfa é idêntica
(0.4245) em todas as variantes e a cor de tinta bate exatamente.
Variantes: `monograma-azul`, `monograma-vinho`, `monograma-preto`,
`monograma-claro` (`#F4F3F1`, para fundo escuro).

**Lettering ("Lucas Belesa / ADVOGADO"):** no PDF ele não é contorno vetorial, é
**texto vivo** composto com as fontes do próprio manual (o dump dos content
streams mostra 376 operadores de texto e nenhum traçado de path). Recriá-lo em
HTML/CSS com Playfair Display Bold + Montserrat é, portanto, fiel ao manual e
melhor que rasterizá-lo: escala sem borrar, acompanha o leitor de tela e não pesa
bytes. O desenho do monograma é usado como PNG transparente.

Favicon = monograma. Gerados `favicon.ico` multi-resolução (16/32/48),
`favicon-16/32.png` e `apple-touch-icon.png` (180), sempre claro sobre o azul.
`og-image.png` 1200×630 também usa o monograma, sem texto.

## 3. Arquitetura de arquivos

```
site-lucasbelesa/
├── public/                     # raiz publicada no Cloudflare Pages
│   ├── index.html
│   ├── favicon.ico
│   ├── _headers
│   ├── robots.txt
│   └── assets/
│       ├── css/fonts.css       # @font-face gerado
│       ├── css/styles.css      # tokens + layout
│       ├── fonts/*.woff2
│       ├── img/                # monograma-*, favicon-*, og-image
│       └── js/
│           ├── config.js       # ÚNICO lugar dos dados pendentes
│           └── main.js
├── docs/specs/                 # este documento
├── scripts/                    # builds de ativo, servidor local, fetch de fontes
├── tests/check.mjs             # suíte de aceite, zero dependências
├── wrangler.toml
└── README.md
```

Decisão: a raiz publicada é `public/`, não a raiz do repositório, para que
`tests/`, `scripts/` e `docs/` **não** sejam publicados.

## 4. Contrato de conteúdo (texto literal)

Todo o conteúdo abaixo é literal e deve aparecer em `index.html`. Os testes
verificam presença do texto e a contagem de itens por grupo.

### 4.1 Áreas de atuação — 5 grupos, 3/7/5/3/6 itens

**1. Direito Civil** (3)
1. Elaboração e revisão de contratos
2. Ações de indenização por danos materiais e morais
3. Responsabilidade civil e cobranças

**2. Direito do Consumidor** (7)
1. Ações contra bancos, operadoras de telefonia, companhias aéreas, e-commerces e planos de saúde
2. Cobranças indevidas, cancelamentos não autorizados e falhas na prestação de serviços
3. Produtos não entregues ou entregues de forma incompleta
4. Atrasos e cancelamentos de voos
5. Empréstimos e descontos não reconhecidos
6. Revisão de financiamentos de veículos e imobiliários, seguros e tarifas embutidos
7. Reajustes abusivos de planos de saúde

**3. Direito de Família e Sucessões** (5)
1. Pensão alimentícia: fixação, revisão e cumprimento de sentença
2. Guarda e regulamentação de convivência
3. Acordos familiares
4. Curatela
5. Inventário e partilha

**4. Direito Penal** (3)
1. Defesa criminal em inquéritos e ações penais
2. Acompanhamento em delegacia e audiências
3. Recursos e pedidos de liberdade

**5. Direito Gamer** (6)
1. Contas banidas ou suspensas sem justificativa
2. Compras, itens e moedas virtuais pagos e não entregues
3. Golpes em negociação de contas, skins e itens
4. Pedidos de reembolso em lojas digitais e plataformas de jogos
5. Contratos de streamers, criadores de conteúdo, atletas e equipes de e-sports
6. Proteção de dados e vazamento de informações de jogadores

### 4.2 Como trabalho — 4 pilares

1. **Atendimento próximo:** você fala diretamente comigo
2. **Clareza:** explico o caso em linguagem simples
3. **Estratégia:** antes de entrar com uma ação, avalio os riscos e as teses possíveis e compartilho com você
4. **Transparência:** os honorários são combinados antes do início do trabalho

### 4.3 Ética profissional (OAB)

Restrições que o texto do site **não** pode violar — verificar na revisão:
sem promessa de resultado, sem "consulta grátis", sem preço, sem captação
agressiva, sem superlativo comparativo ("melhor advogado"), sem sensacionalismo.
Tom sóbrio, 1ª pessoa. Os textos correntes (hero, Sobre, Contato) são redigidos
nessa linha e não fazem parte do contrato literal, exceto onde indicado.

## 5. Configuração e dados pendentes

Dados ainda não informados ficam em **um único** arquivo, `public/assets/js/config.js`,
expostos como `window.SITE_CONFIG`. Nenhum dado pendente pode existir em outro
lugar do projeto (exceto na lista do README).

| Chave | Placeholder | Situação |
|---|---|---|
| `whatsapp` | `5500000000000` | PENDENTE — 13 dígitos, DDI+DDD+número |
| `email` | `contato@exemplo.com.br` | PENDENTE |
| `oab` | `OAB/UF 000000` | PENDENTE — inscrição e seccional |
| `cidade` | `Cidade/UF` | PENDENTE |
| `endereco` | `Rua Exemplo, 000 — Sala 0 — Cidade/UF` | PENDENTE |
| `instagram` | `https://instagram.com/exemplo` | PENDENTE |

`window.SITE_CONFIG.pendentes` lista as chaves ainda não confirmadas; os testes
usam essa lista e o README a reproduz em texto.

O placeholder do WhatsApp é **numérico** de propósito: assim o `href` gerado já é
um `https://wa.me/<digitos>?text=...` sintaticamente válido e o teste de CTA
verifica a forma do link, não o número. Trocar o valor em `config.js` ativa o
contato real sem tocar em HTML.

## 6. Comportamento (JS, sem dependências)

`main.js` é progressivo: com JS desligado o site continua legível e navegável.

1. **Hidratação de config:** preenche `[data-config="oab"]`, `[data-config="email"]`,
   `[data-config="cidade"]`, `[data-config="endereco"]`, `[data-config="instagram"]`
   via `textContent`/`href` (nunca `innerHTML` com dado de config).
2. **CTAs de WhatsApp:** todo `[data-whatsapp]` recebe
   `https://wa.me/<whatsapp>?text=<mensagem codificada>`, com a mensagem escolhida
   pelo atributo `data-whatsapp-msg`. `rel="noopener noreferrer"` e `target="_blank"`.
3. **Menu mobile:** botão com `aria-expanded`/`aria-controls`; fecha com `Esc`,
   com clique em link e ao passar para layout largo; foco retorna ao botão.
4. **Formulário → WhatsApp:** não há `action` de rede. No `submit`, o handler
   chama `preventDefault()`, compõe a mensagem a partir dos campos, codifica com
   `encodeURIComponent` e abre o `wa.me`. Feedback em região `role="status"`.
   Se o WhatsApp não abrir, o texto permanece visível para cópia.
5. **Foto ausente:** se `assets/foto-1.jpg` e `assets/foto-2.jpg` não carregarem (`onerror`), a moldura do
   hero troca para um bloco tipográfico (monograma + iniciais), sem quebrar o
   layout. O caminho e o `object-fit: cover; object-position: 50% 20%` ficam
   prontos para quando o arquivo existir.

Segurança em JS: nada de `innerHTML` com conteúdo de config ou de formulário;
nada de `eval`; nenhuma chave ou segredo no cliente (não há backend).

## 7. Acessibilidade

- `lang="pt-BR"`, `<!DOCTYPE html>`, landmarks `header`/`nav`/`main`/`footer`.
- Skip link "Pular para o conteúdo" como primeiro elemento focável.
- Cada `section` com `aria-labelledby` apontando para seu `h2`; hierarquia de
  headings sem salto (um `h1` no hero).
- Toda `img` com `alt` significativo; imagens decorativas com `alt=""` (os testes
  reprovam `img` sem atributo `alt`).
- Anel de foco visível (`:focus-visible`) em todos os interativos, com a cor
  trocada por seção conforme §2.1.
- Formulário: `label` associado a cada campo, `aria-describedby` nas dicas,
  `required` no que é obrigatório, erro anunciado em `role="alert"`,
  sucesso em `role="status"`.
- `prefers-reduced-motion: reduce` desliga transições e âncoras suaves.
- Alvos de toque ≥ 44px no menu e nos CTAs.

## 8. Responsividade

Mobile-first. Pontos de verificação obrigatórios: **360px, 768px, 1280px**.
- 360px: uma coluna, header compacto com menu hambúrguer, sem overflow horizontal.
- 768px: cards de áreas em 2 colunas, pilares em 2 colunas.
- 1280px: conteúdo limitado a ~1120px, cards em 3 colunas, hero em duas colunas.
Nenhum elemento pode causar scroll horizontal em 360px.

## 9. Deploy (Cloudflare Pages)

- `wrangler.toml`: `name = "site-lucasbelesa"`,
  `pages_build_output_dir = "public"`, `compatibility_date`.
- `public/_headers`: CSP restritiva (`default-src 'self'`), `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`,
  `object-src 'none'`, HSTS sem `includeSubDomains`, e cache longo/immutable para
  `/assets/fonts/*` e `/assets/img/*`.
- `public/robots.txt` liberando o site.
- README traz os passos manuais (não executar deploy nesta tarefa).

## 10. Critérios de aceite → testes

`tests/check.mjs` (Node puro, zero dependências) e a verificação manual:

| # | Critério | Como é verificado |
|---|---|---|
| A1 | 5 grupos de áreas, com 3/7/5/3/6 itens e texto literal | parsing dos cards em `index.html`, comparação item a item |
| A2 | 4 pilares com texto literal | presença dos 4 rótulos e das 4 descrições |
| A3 | Nenhuma `img` sem `alt` | varredura de todas as tags `img` |
| A4 | Contraste AA dos pares usados | recálculo WCAG sobre os tokens do CSS + tabela de pares em teste |
| A5 | Toda referência local (css/js/img/font) existe em disco | extração de `href`/`src`/`url()` e teste de existência |
| A6 | CTAs de WhatsApp com forma válida | `wa.me/<dígitos>?text=<urlencoded>` a partir da config |
| A7 | Formulário monta mensagem e não navega | inspeção do handler + execução isolada da função de composição |
| A8 | Config centralizada e placeholders listados no README | toda chave de `pendentes` aparece no README |
| A9 | Arquivos de deploy presentes e coerentes | `wrangler.toml` com `pages_build_output_dir`, `_headers` com CSP, `robots.txt` |
| A10 | Sem overflow horizontal / layout nos 3 tamanhos | verificação manual documentada (Lighthouse-ish) |
| A11 | Sem erros de console ao carregar | servir localmente e checar o log |
| A12 | Sem dependências externas em runtime | ausência de `http(s)://` em `src`/`href` de css/js/font |

A10 e A11 dependem de navegador e ficam registrados como **verificação manual**,
com o resultado relatado honestamente (não há Chrome headless garantido no host).

## 11. Riscos e decisões

| Risco | Decisão |
|---|---|
| Sem acesso visual ao PDF | geometria e cores obtidas por análise de pixels e dos content streams, com verificação numérica (bbox, cobertura de alfa, cor de tinta). Vieses possíveis: enquadramento do recorte do monograma. |
| Foto do advogado ausente | caminho pronto + fallback tipográfico, nunca imagem quebrada. |
| Dados de contato pendentes | centralizados em `config.js`, listados no README, nunca espalhados. |
| HSTS em domínio ainda não escolhido | HSTS sem `includeSubDomains` e documentado; remover se o domínio definitivo não for HTTPS-only. |
| Cópia fora da ética da OAB | §4.3 é item de revisão obrigatório. |
| Repositório não é git | a tarefa proíbe commit/push; isolamento por `git worktree` não é aplicável. Todo o trabalho fica em um diretório, sem risco de concorrência. Decisão registrada explicitamente. |
