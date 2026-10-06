# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZenVR** é uma plataforma de meditação imersiva que combina PWA e experiências Android XR. Não há sistema de build — todo o código é HTML/CSS/JS estático servido diretamente.

## Running Locally

```bash
# Qualquer servidor HTTP funciona. Exemplos:
python3 -m http.server 8080
npx serve .

# Acesse: http://localhost:8080
```

WebXR requer HTTPS em produção. Para testes locais com headsets, use ngrok ou similar.

## Android Build (TWA via Bubblewrap)

```bash
# Pré-requisitos: Node.js 14+, Java JDK 11+
chmod +x scripts/build-android.sh
./scripts/build-android.sh

# Antes de usar, editar PWA_URL no script:
# PWA_URL="https://seu-dominio.com"
```

O script tem menu interativo: (1) inicializar TWA, (2) build APK/.aab, (3) atualizar manifest, (4) validar Digital Asset Links.

Guarda backup do `zenvr-android/android.keystore` — sem ele não é possível atualizar o app na Play Store.

## Architecture

### Dual Stack

```
Web PWA (/app/)                  Android XR (headsets)
├── app/cenarios.html            ├── respiracao-xr-hands.html
├── app/paisagem.html            ├── paisagem-xr.html
├── app/respiracao.html          ├── palavras-xr.html
└── app/palavras.html            └── video-xr.html
```

A pasta `app/` é a **fonte única da verdade** para a aplicação web PWA. As páginas correspondentes na raiz (`cenarios.html`, `paisagem.html`, `respiracao.html`, `palavras.html`) são redirecionamentos leves com `location.replace(...)` preservando parâmetros de busca e hash.

As versões `-xr` usam **Three.js** (v0.160.0) + **WebXR API** diretamente e consomem vídeos em `app/videos/`. As versões do app usam **A-Frame**. `xr-components.js` contém componentes A-Frame reutilizáveis para hand tracking e eye tracking.

### Navigation Flow

```
index.html  →  app/cenarios.html?pagina=<tipo>  →  app/<experiencia>.html
Raiz (cenarios.html, paisagem.html, etc.)  →  Redirects com location.replace para app/*
app/index.html  →  app/landing.html  (mobile/PWA entry point)
```

`app/cenarios.html` age como roteador: lê `?pagina=` e carrega o cenário correspondente com o vídeo 360° selecionado.

### Interaction Fallback Chain

Todas as experiências XR implementam degradação graciosa:

```
Hand Tracking (XRHand API)
    → Gaze / Raycasting da câmera
        → Mouse / Touch (desktop/mobile)
```

### XR Spatial UI Pattern

Botões e UI são objetos 3D posicionados no espaço (não overlays 2D). A interação usa raycasting a partir dos joints da mão (`index-finger-tip`) ou da câmera.

### PWA

- Entry point: `app/landing.html`
- Manifest: `app/manifest.json` (declara `xr_capabilities` para Android XR)
- Service worker: `app/service-worker.js` (cache-first para assets estáticos)
- Shortcuts do manifest apontam para `cenarios.html?pagina=<tipo>`

### Assets

- `app/cenarios/` — imagens panorâmicas canônicas (PNG)
- `app/videos/` — pasta física de vídeos 360° (MP4/WebM, H.265 preferido): `forest`, `waterfall`, `mountain`, `beach`, `cidade`
- `/slides/` — apresentações VR independentes (Three.js)

## Key Conventions

- **Internacionalização (i18n):**
  - O app principal (`app/`) é multi-idioma com suporte a **pt-BR** (padrão), **en** e **es**.
  - O runtime próprio (`app/i18n.js`) carrega os dicionários de `app/locales/{pt-BR,en,es}.json`.
  - Nenhuma string nova em `app/` deve ser adicionada hardcoded: use chaves nos arquivos de tradução e atributos `data-i18n`, `data-i18n-html` ou `data-i18n-attr`.
  - A preferência do usuário é persistida em `localStorage.zenvr_lang`.
  - Páginas estáticas de política de privacidade: `app/privacy-policy.html` (pt-BR), `app/privacy-policy.en.html` (en), `app/privacy-policy.es.html` (es).
  - A raiz do projeto e `slides/` permanecem em **pt-BR**, com as páginas originais de experiências atuando como redirecionadores para suas versões canônicas em `app/`.
- Sem framework de componentes — cada experiência é um arquivo HTML autocontido
- Tailwind CSS via CDN (não instalado localmente)
- Three.js carregado via CDN (`importmap` ou `<script type="module">`)
- Paleta: indigo `#4F46E5` (primária), blue `#3B82F6`, purple `#9333EA`
- Ciclo de respiração padrão: 6s total (3s inspirar, 3s expirar), com easing `easeInOutSine`
