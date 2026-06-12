# Contexto de deploy — Site "Para Amanda — Arthur"

> Documento para outra sessão de Claude (ou qualquer dev) usar como contexto
> ao colocar este site online em um domínio próprio. Fale PT-BR com o usuário.

## 1. O que é o projeto
Site de carta de Dia dos Namorados (presente do Arthur para a Amanda). Página única,
longa, com várias seções: intro em carta (envelope), capa, "como tudo começou",
contador ao vivo, "Nossa história" (linha do tempo), galeria, player de música (vinil),
carta de declaração, carrossel de cartas de tarô ("por que eu te amo"), vídeo, fecho.
Tem também borboletas animadas (vídeo) voando no fundo.

## 2. Stack — IMPORTANTE: é um site 100% ESTÁTICO
- **Não há build/bundler.** Não rode `npm install`/`npm run build` — não existe `package.json`.
- HTML + CSS + JavaScript puro (vanilla).
- O painel de "Ajustes" (`tweaks-panel.jsx`) usa **React 18 + Babel Standalone via CDN (unpkg)**,
  compilado **no navegador** (`<script type="text/babel">`). Não precisa de Node pra rodar.
- Para publicar, basta **servir os arquivos estáticos**. Qualquer host de site estático serve.
- **Caminhos são relativos** (ex.: `para-amanda/styles.css`, `uploads/...`), sem barra inicial,
  então funciona tanto na raiz de um domínio quanto em subpasta (ex.: `usuario.github.io/vdg/`).

## 3. Estrutura de arquivos
```
index.html                      # página única (todas as seções + scripts inline)
para-amanda/
  styles.css                    # todo o CSS
  app.js                        # interações vanilla (contador, player, intro, carrossel, borboletas, etc.)
  tweaks-panel.jsx              # painel de ajustes (React, compilado no navegador via Babel)
uploads/                        # todas as imagens, músicas e vídeos
.gitignore                      # ignora .claude/ e arquivos de sistema
DEPLOY.md                       # este documento
```

## 4. Dependências externas (precisam de internet do visitante)
- **Google Fonts**: Cinzel, Cormorant Garamond, Caveat, Special Elite (`fonts.googleapis.com`).
- **unpkg CDN**: React 18.3.1, ReactDOM 18.3.1, @babel/standalone 7.29.0 (com `integrity`/SRI).
  - Obs: são os builds de **desenvolvimento** do React. Opcional para produção: trocar por
    `react.production.min.js` / `react-dom.production.min.js` (e atualizar os hashes `integrity`).
- Nenhuma chamada a backend/API própria. Não há servidor, banco, nem variáveis de ambiente.

## 5. Repositório Git
- Remoto: `https://github.com/ArthurGueler-dev/vdg.git`
- Branch: `main`
- O site está na **raiz** do repositório (index.html no topo).
- Regra do dono: **nunca co-autorar commits** (não adicionar trailer `Co-Authored-By`). Mensagens
  de commit podem ser em inglês.

## 6. Como colocar online num domínio próprio (escolha UMA opção)

O usuário tem um domínio próprio. As 3 opções abaixo são gratuitas, dão **HTTPS automático** e
**não exigem build**. Recomendo **Cloudflare Pages** ou **Netlify** pela facilidade de domínio próprio.

### Opção A — GitHub Pages (repo já existe)
1. No GitHub: repo `vdg` → **Settings → Pages**.
2. Em "Build and deployment" → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → Save.
3. Sai no ar em ~1 min em `https://arthurgueler-dev.github.io/vdg/`.
4. **Domínio próprio**: em Settings → Pages → "Custom domain", digite o domínio e salve
   (isso cria um arquivo `CNAME` no repo). Depois configure o DNS (ver seção 7).
   - Apex (ex.: `exemplo.com`): crie registros **A** apontando para os IPs do GitHub Pages
     (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
   - Subdomínio (ex.: `www` ou `nos.exemplo.com`): registro **CNAME** → `arthurgueler-dev.github.io`.
   - Marque "Enforce HTTPS" depois que o certificado for emitido.

### Opção B — Cloudflare Pages (recomendado se o domínio já estiver na Cloudflare)
1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → escolher `vdg`.
2. **Framework preset: None.** Build command: **(vazio)**. Output directory: **/** (raiz).
3. Deploy. Depois: **Custom domains → Set up a domain** → digitar o domínio (DNS é automático se já
   estiver na Cloudflare).

### Opção C — Netlify ou Vercel
1. Conectar o repo `vdg`. **Sem build command.** Publish directory: **raiz** (`.` / vazio).
2. Em Domain settings, adicionar o domínio e seguir as instruções de DNS que a plataforma mostrar
   (geralmente um CNAME para o subdomínio e/ou registros A/ALIAS para o apex).

### Alternativa sem Git
Como é estático, dá pra subir a pasta inteira por **arrastar-e-soltar** no Netlify Drop
(app.netlify.com/drop) ou por FTP em qualquer hospedagem. Mantenha a estrutura de pastas intacta.

## 7. DNS (resumo)
- **Subdomínio** (ex.: `www.exemplo.com`, `nos.exemplo.com`): registro **CNAME** → alvo que o host indicar.
- **Domínio apex/raiz** (ex.: `exemplo.com`): usar **A** (GitHub Pages) ou **ALIAS/ANAME/CNAME-flattening**
  (Cloudflare/Netlify) conforme o host.
- Propagação do DNS pode levar de minutos a algumas horas. HTTPS é emitido automaticamente pelos 3 hosts.

## 8. Cuidados / armadilhas conhecidas
- **Autoplay da música**: navegadores bloqueiam som automático. O site já contorna iniciando a
  música no **primeiro gesto** do usuário (clique/rolagem), começando em **00:57** (`START_AT` em `app.js`).
- **Borboleta `.webm` com fundo transparente**: funciona em Chrome/Edge/Firefox. No **Safari/iOS** a
  transparência de WebM pode não funcionar (pode aparecer fundo preto). Se for importante no iPhone,
  converter para **HEVC `.mov`/`.mp4` com canal alfa** (precisa de ffmpeg) e usar `<source>` duplo.
- **Arquivos grandes**: `uploads/musica.mp3` (~11 MB) e `uploads/9e04...720w.mp4` (~2,4 MB, NÃO usado).
  - `9e04effe74e8a7c9a547b8224b341d09_720w.mp4`, `the-lovers-1.jpg` e `the-lovers-5.jpg` **não são
    usados** no site (sobraram) — podem ser removidos para enxugar o repositório.
- **Música é de terceiros** (faixa comercial). Hospedar publicamente é decisão do dono; é um site
  pessoal/presente. Apenas registrando o fato.
- **`.claude/`** está no `.gitignore` (config local da ferramenta) — não publicar.
- **Não existe PWA** atualmente (manifest/service worker foram removidos). Se quiserem "instalar como
  app", dá pra readicionar manifest + service worker (lembrar que SW só funciona em HTTPS).

## 9. Como editar o conteúdo (referência rápida)
- **Datas** (namoro/conheceram) e **música**: painel de Ajustes ou os defaults em `index.html`
  (bloco `TWEAK_DEFAULTS` e `CONFIG` em `app.js`: `startDate`, `meetDate`, `songName`, `songArtist`).
- **Motivos do carrossel de tarô**: array `TAROT` em `para-amanda/app.js` (imagem + frase por carta).
- **Linha do tempo "Nossa história"**: marcos estáticos no `index.html` (seção `class="story"`),
  cada `<li class="st-item">` com foto (`uploads/hist-*`), data, título e frase.
- **Legendas da galeria / texto da carta**: direto no `index.html`.
- **Convenção**: classes CSS de seções novas devem ter nomes únicos. ATENÇÃO: o `<body>` tem
  `class="deck"` — nunca criar uma classe `.deck` no CSS (já quebrou o layout uma vez por isso).

## 10. Teste local
Abrir `index.html` direto no navegador funciona para a maior parte. Para evitar restrições de
`file://` (ex.: alguns navegadores com vídeo/áudio), servir localmente:
`python -m http.server` na pasta do projeto e acessar `http://localhost:8000`.
