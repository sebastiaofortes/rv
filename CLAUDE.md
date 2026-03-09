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
Web (qualquer browser)           Android XR (headsets)
├── cenarios.html                ├── respiracao-xr-hands.html
├── paisagem.html                ├── paisagem-xr.html
├── respiracao.html              ├── palavras-xr.html
└── palavras.html                └── video-xr.html
```

As versões `-xr` usam **Three.js** (v0.160.0) + **WebXR API** diretamente. As versões legadas usam **A-Frame**. `xr-components.js` contém componentes A-Frame reutilizáveis para hand tracking e eye tracking.

### Navigation Flow

```
index.html  →  cenarios.html?pagina=<tipo>  →  <experiencia>.html
app/index.html  →  app/landing.html  (mobile/PWA entry point)
```

`cenarios.html` age como roteador: lê `?pagina=` e carrega o cenário correspondente com o vídeo 360° selecionado.

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

- `/cenarios/` — imagens panorâmicas (PNG)
- `/videos/` — vídeos 360° (MP4/WebM, H.265 preferido): `forest`, `waterfall`, `mountain`, `beach`, `cidade`
- `/slides/` — apresentações VR independentes (Three.js)

## Key Conventions

- Idioma do projeto: **pt-BR** (interface e documentação)
- Sem framework de componentes — cada experiência é um arquivo HTML autocontido
- Tailwind CSS via CDN (não instalado localmente)
- Three.js carregado via CDN (`importmap` ou `<script type="module">`)
- Paleta: indigo `#4F46E5` (primária), blue `#3B82F6`, purple `#9333EA`
- Ciclo de respiração padrão: 6s total (3s inspirar, 3s expirar), com easing `easeInOutSine`
