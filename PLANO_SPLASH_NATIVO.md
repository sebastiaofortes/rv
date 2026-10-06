# Plano de Implementação: Remoção do Splash HTML e Adoção do Splash Nativo (Opção 3)

## 1. Contexto e Motivação
No ambiente atual, o ZenVR opera como um PWA / TWA (Android Trusted Web Activity empacotado via Bubblewrap).
O sistema operacional Android e os motores de navegadores modernos (Chrome/Edge/Samsung Internet) já geram automaticamente uma **Splash Screen nativa** durante a inicialização do app a partir do arquivo [`manifest.json`](file:///Users/sfortes/github.com/sebastiaofortes/rv-master/app/manifest.json) (usando `name`, `icons`, `background_color` e `theme_color`).

Por conta disso, a existência de uma Splash Screen artificial em HTML/CSS dentro de [`landing.html`](file:///Users/sfortes/github.com/sebastiaofortes/rv-master/app/landing.html) causa dois problemas graves de UX:
1. **Duplo Splash**: O usuário visualiza o splash nativo do sistema e, logo em seguida, um segundo splash em HTML de 2,5 segundos.
2. **Splash em Navegações Internas**: Toda vez que o usuário retorna para a tela inicial (via botão voltar ou menu de navegação inferior), a animação roda novamente.

A **Opção 3** propõe eliminar completamente a camada artificial de Splash Screen do código Web, confiando 100% no ciclo de vida nativo da plataforma e entregando renderização instantânea do conteúdo ao navegar.

---

## 2. Escopo das Alterações

### 2.1. Arquivo: `app/landing.html`
Remover todos os artefatos visuais, regras de estilo e animações atrelados ao splash artificial.

1. **Remoção do Markup HTML**:
   Excluir o bloco HTML do splash:
   ```html
   <!-- Splash Screen -->
   <div class="splash-screen">
     <div class="text-center">
       <div class="w-24 h-24 mx-auto mb-6 rounded-3xl shadow-2xl overflow-hidden floating">
         <img src="./header-icon.png" alt="ZenVR Logo" data-i18n-attr="alt:common.logoAlt" class="w-full h-full object-cover" />
       </div>
       <h1 class="text-4xl font-bold text-white mb-2">ZenVR</h1>
       <p class="text-white text-opacity-90" data-i18n="splash.subtitle">Meditação Imersiva</p>
     </div>
   </div>
   ```

2. **Remoção do CSS correspondente**:
   Localizar no bloco `<style>` e remover:
   ```css
   .splash-screen {
     position: fixed;
     inset: 0;
     z-index: 9999;
     display: flex;
     align-items: center;
     justify-content: center;
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     animation: fadeOut 0.5s ease-in 2s forwards;
   }

   @keyframes fadeOut {
     to {
       opacity: 0;
       pointer-events: none;
     }
   }
   ```
   *(Atenção: preservar classes utilitárias não relacionadas, como `.safe-top`, `.safe-bottom`, etc.)*

3. **Limpeza de Scripts/Classes Temporárias**:
   - Garantir que não restem seletores ou lógicas JS tentando manipular `.splash-screen`.
   *(Nota: a chave de internacionalização `splash.subtitle` ainda é usada no modal "Sobre" e deve ser mantida nos arquivos de tradução).*

---

### 2.2. Arquivo: `app/manifest.json` (Validação e Ajustes do Splash Nativo)
Garantir que a configuração de Splash Nativo esteja perfeita para Android / PWA:

1. **Cores de Inicialização**:
   - `background_color`: `#4F46E5` (cor de fundo exibida instantaneamente enquanto o app carrega).
   - `theme_color`: `#4F46E5` (cor da barra de status).
2. **Ícones**:
   - Confirmar a presença de ícones com propósito `any maskable` nos tamanhos `192x192` e `512x512`, permitindo que o Android recorte e centralize o ícone nativamente sem distorções.

---

### 2.3. Arquivo: `app/cenarios.html` (Opcional / Recomendado)
Garantir que o botão voltar (`<`) tenha uma experiência fluida:
- Pode-se manter o link direto `<a href="./landing.html">` ou utilizar `window.history.back()` com fallback para voltar instantaneamente usando o cache de página do navegador (bfcache).

---

## 3. Passo a Passo de Execução para o Agente

1. **Etapa 1 - Limpeza de `app/landing.html`**:
   - Deletar o elemento `<div class="splash-screen">...</div>`.
   - Deletar as regras `.splash-screen` e `@keyframes fadeOut` do CSS.
   - Se houver script inserido anteriormente de verificação de `sessionStorage` para splash, removê-lo para manter o código limpo.

2. **Etapa 2 - Conferência do `app/manifest.json`**:
   - Inspecionar `background_color`, `theme_color` e os ícones definidos em `app/manifest.json`.

3. **Etapa 3 - Validação Visual**:
   - Executar servidor local e verificar se `app/landing.html` abre diretamente com o cabeçalho e conteúdo principal, sem atraso de 2,5 segundos.
   - Navegar para `app/cenarios.html` e voltar para `app/landing.html`: a transição deve ser imediata e sem tela intermediária.

---

## 4. Critérios de Aceite

- [ ] **Abertura Direta**: Ao abrir `app/landing.html`, o conteúdo da home é exibido imediatamente, sem overlay e sem atrasos artificiais de animação.
- [ ] **Navegação de Retorno Limpa**: Ao estar em `app/cenarios.html` e clicar em voltar (ou selecionar "Início" no bottom navigation), o usuário cai na tela inicial instantaneamente.
- [ ] **Sem Efeitos Colaterais**: O modal "Sobre" (`aboutModal`) continua funcionando normalmente com seus estilos e textos íntegros.
- [ ] **PWA / Android**: No app instalado via TWA/PWA, apenas a tela de inicialização nativa do sistema operacional é apresentada na abertura fria.
