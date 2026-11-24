# Site institucional — Lucas Belesa Chabudé (advogado)

Site estático de página única, sem backend e sem dependências em runtime.
HTML, CSS e JavaScript puros. Raiz publicada: `public/`.

Os dados de contato estão preenchidos. Todos vivem em **um único arquivo**
(`public/assets/js/config.js`) e nenhum deles aparece fixo no HTML.

## Dados de contato (`public/assets/js/config.js`)

| Chave | Valor atual |
|---|---|
| `whatsapp` | `5527992892844` (exibido como (27) 99289-2844) |
| `telefone` | `(27) 99289-2844` (não é mais exibido no site; o contato é feito pelos ícones do rodapé, que usam `whatsapp`) |
| `email` | `lucasbelesa.adv@gmail.com` |
| `oab` | `OAB/ES 44153` (seccional ES assumida, a confirmar) |
| `cidade` | `Vila Velha/ES` |
| `endereco` | `Vila Velha/ES` (sem rua, número ou CEP) |
| `instagram` | `https://www.instagram.com/lucasbelesa.adv/` |

Para trocar um dado, edite o valor no `config.js`. A lista `pendentes` serve
para marcar dados ainda faltando; ela está vazia. Se um dado voltar a ser
provisório, inclua a chave nela. Os testes conferem que as chaves de `pendentes`
existem no objeto e que nenhum valor de exemplo (ex.: `000000`, `exemplo`) sobrou.

## Foto do advogado

O hero alterna duas fotos em crossfade por CSS: `public/assets/foto-1.jpg`
(principal, com `alt`) e `public/assets/foto-2.jpg` (decorativa, `alt=""`).
Retrato, proporção ~4:5 (hoje 453×566 e 458×573). Se as duas falharem, o hero
cai para um bloco tipográfico com monograma e iniciais; se só uma carregar, ela
fica estática. Com `prefers-reduced-motion` só a foto 1 aparece.

O recorte usa `object-fit: cover` e `object-position: 50% 18%`; ajuste em
`public/assets/css/styles.css` (`.retrato__foto`) se o enquadramento não ficar
bom.

## Estrutura

```
public/                     # raiz publicada
├── index.html
├── _headers                # CSP, cache, headers de segurança (static assets)
├── robots.txt
├── favicon.ico
└── assets/
    ├── css/fonts.css       # @font-face local
    ├── css/styles.css      # tokens + layout
    ├── fonts/*.woff2       # Playfair Display, Montserrat, Inter (subset latin)
    ├── img/                # monograma, favicons, og-image
    ├── foto-1.jpg          # retrato principal (hero, crossfade)
    ├── foto-2.jpg          # retrato secundário (hero, crossfade)
    └── js/
        ├── boot.js         # remove o estado sem-JS antes da 1ª pintura
        ├── config.js       # ÚNICO lugar dos dados de contato
        └── main.js         # hidratação, menu, CTAs, formulário
docs/specs/                 # SDD (decisões de arquitetura e critérios)
scripts/                    # builds de ativo, servidor local, fetch de fontes
tests/check.mjs             # suíte de aceite (Node puro, zero dependências)
wrangler.toml
```

## Desenvolvimento local

Requer Node.js (a suíte usa apenas módulos nativos).

```bash
npm start          # servidor local em http://localhost:4173 (public/)
npm test           # roda tests/check.mjs
npm run assets     # regenera favicons/og-image a partir do PDF do manual
npm run fonts      # baixa e reescreve public/assets/css/fonts.css
```

Se o `node` do `PATH` estiver quebrado no seu host, use o binário do nvm
diretamente, por exemplo
`~/.nvm/versions/node/v22.23.4/bin/node tests/check.mjs`.

## Deploy no Cloudflare Workers (static assets)

Não há build: o site é publicado como está.

**Domínio principal:** `https://lucasbelesa.adv.br` (sem www). O canonical,
og:url, og:image, twitter:image e o `sitemap.xml` já apontam para ele.

**www → apex:** `https://www.lucasbelesa.adv.br` deve dar **301** para
`https://lucasbelesa.adv.br`. Isso **não** fica em `public/_headers` nem em
`public/_redirects` (não há `_redirects` no projeto): faça pelo painel da
Cloudflare, com uma **Redirect Rule** (ou Bulk Redirect):

- Expressão: `http.host eq "www.lucasbelesa.adv.br"`
- Destino (expressão dinâmica): `concat("https://lucasbelesa.adv.br", http.request.uri.path)`
- Status 301, com **Preserve query string** ligado.

1. Publique o Worker (a partir da raiz do repositório):

   ```bash
   npx wrangler login
   npx wrangler deploy
   ```

   O `wrangler.toml` declara `[assets] directory = "./public"`, então o deploy
   sobe a pasta `public/` como static assets. Não há build.

2. Domínios custom, depois que a zona estiver ativa na Cloudflare. Pelo painel:
   Workers & Pages → `site-lucasbelesa` → **Settings** → **Domains & Routes** →
   adicione `lucasbelesa.adv.br` e `www.lucasbelesa.adv.br`. Ou no
   `wrangler.toml`:

   ```toml
   routes = [
     { pattern = "lucasbelesa.adv.br", custom_domain = true },
     { pattern = "www.lucasbelesa.adv.br", custom_domain = true },
   ]
   ```

   O `www` só serve para receber o redirect abaixo.
3. Crie a Redirect Rule do `www` (acima) na zona `lucasbelesa.adv.br`.
4. Confira: `curl -sI https://www.lucasbelesa.adv.br` deve mostrar
   `301` e `location: https://lucasbelesa.adv.br/`.

Até o passo 2, o Worker responde só no endereço `workers.dev` padrão.

## Observações

- **HSTS sem `includeSubDomains`:** o cabeçalho está em `public/_headers` com
  `max-age` longo. Se o domínio definitivo não for HTTPS-only, revise antes.
- **Sem formulário com backend:** o botão do formulário monta a mensagem e abre
  o WhatsApp em outra aba. Nenhum dado é enviado a servidor.
- **Ética OAB:** o texto evita promessa de resultado, preço e captação agressiva.
  Revise qualquer alteração de copy à luz do Código de Ética e Disciplina da OAB.
