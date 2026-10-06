# Especificação Técnica: Otimização da Splash Screen e Navegação de Retorno (Propostas 1 + 4)

## 1. Contexto e Problema
Ao navegar no ZenVR, ao acessar a tela de cenários (`app/cenarios.html`) e retornar à tela inicial (`app/landing.html`) — seja clicando no botão de voltar do cabeçalho ou no item "Início" do bottom navigation — o usuário é repetidamente exposto à animação da **Splash Screen** de 2,5 segundos.

Essa repetição torna a usabilidade lenta e frustrante durante a navegação entre telas do aplicativo.

---

## 2. Objetivo
Implementar a combinação das **Propostas 1 e 4**:
1. **Proposta 1 (`sessionStorage`)**: Exibir a Splash Screen em `landing.html` apenas na primeira vez em que a sessão do app for aberta. Nas navegações seguintes dentro da mesma sessão, a splash screen deve ser totalmente suprimida (sem flashes/flicker).
2. **Proposta 4 (`history.back()` com fallback)**: Otimizar o botão de voltar em `cenarios.html` para usar o histórico do navegador (`history.back()`) se o usuário veio de uma página interna do app, evitando recarregamento desnecessário e aproveitando cache de navegação, mantendo fallback caso o usuário tenha entrado direto por link externo.

---

## 3. Arquivos Envolvidos
- [`app/landing.html`](file:///Users/sfortes/github.com/sebastiaofortes/rv-master/app/landing.html)
- [`app/cenarios.html`](file:///Users/sfortes/github.com/sebastiaofortes/rv-master/app/cenarios.html)

---

## 4. Detalhamento Técnico das Modificações

### 4.1. Modificações em `app/landing.html` (Proposta 1)

#### 4.1.1. Script de Prevenção Imediata (Head)
Inserir no `<head>` (logo no início, antes da renderização dos estilos e do body) uma verificação síncrona com `sessionStorage` para adicionar uma classe no `<html>` antes de qualquer pintura na tela, evitando flash da splash screen:

```html
<!-- Verificação antecipada de Splash Screen (evita flash) -->
<script>
  (function() {
    try {
      if (sessionStorage.getItem('zenvr_splash_shown')) {
        document.documentElement.classList.add('no-splash');
      } else {
        sessionStorage.setItem('zenvr_splash_shown', '1');
      }
    } catch (e) {
      // Caso cookies/storage estejam bloqueados
    }
  })();
</script>
```

#### 4.1.2. Regra CSS para ocultar a Splash
No bloco `<style>` existente de `landing.html`, logo acima ou junto da regra `.splash-screen`:

```css
.no-splash .splash-screen {
  display: none !important;
}
```

---

### 4.2. Modificações em `app/cenarios.html` (Proposta 4)

#### 4.2.1. Ajuste do Botão Voltar no Cabeçalho
Atualmente o botão está definido como:
```html
<a href="./landing.html" class="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition" aria-label="Voltar" data-i18n-attr="aria-label:scenes.back">
```

Alterar para interceptar o clique chamando uma função de retorno inteligente:
```html
<a href="./landing.html" onclick="handleGoBack(event)" class="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition" aria-label="Voltar" data-i18n-attr="aria-label:scenes.back">
```

#### 4.2.2. Implementação da Função `handleGoBack(event)`
Adicionar no bloco de scripts de `app/cenarios.html`:

```javascript
function handleGoBack(event) {
  // Se o histórico possuir entradas anteriores e o referer pertencer ao mesmo domínio/origem
  if (window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
    if (event) event.preventDefault();
    window.history.back();
  }
  // Caso contrário, deixa o comportamento padrão do href="./landing.html" acontecer
}
```



---

## 5. Critérios de Aceite e Testes

1. **Primeira abertura**:
   - Abrir `app/landing.html` em uma aba anônima (sessão limpa).
   - A Splash Screen deve ser exibida normalmente com sua animação padrão.
2. **Navegação para Cenários e Retorno pelo Botão Voltar**:
   - Clicar para ir a `cenarios.html`.
   - Clicar no botão de voltar superior esquerdo (`<`).
   - A tela inicial (`landing.html`) deve carregar instantaneamente, **sem** exibição da Splash Screen e sem piscar.
3. **Navegação pelo Bottom Navigation ("Início")**:
   - Em `cenarios.html`, clicar no item "Início" / "Home" da barra inferior.
   - A tela inicial deve abrir diretamente, **sem** exibição da Splash Screen.
4. **Fechamento de Aba / Nova Sessão**:
   - Fechar a aba e abrir novamente em nova aba/janela.
   - A Splash Screen deve aparecer apenas na primeira visualização da nova sessão.

---

## 6. Refinamento de Navegação: Resolução de Loop Hierárquico (Opção 1 + Opção 3)

### 6.1. Problema Identificado
Ao navegar da Home (`landing.html`) para a lista de cenários (`cenarios.html`), entrar em uma experiência imersiva e retornar para a lista de cenários, clicar no botão de voltar de `cenarios.html` fazia `history.back()` retornar para o cenário recém-fechado em vez da Home, prendendo o usuário em um looping.

### 6.2. Solução Implementada
1. **Hierarquia Pura em `cenarios.html` (Opção 1)**: O botão voltar da lista de cenários é estritamente hierárquico, apontando de forma determinística para `./landing.html`. Como a Home usa `sessionStorage`, a navegação é instantânea e livre de splash screen.
2. **Desempilhamento nos Cenários (Opção 3)**: Nos botões `#exitExperienceBtn` das páginas de experiência (`paisagem.html`, `respiracao.html`, `palavras.html`), o clique executa `history.back()` quando há histórico da mesma origem, desempilhando a experiência e voltando para `cenarios.html`, com fallback para `href="./cenarios.html?pagina=..."`.


