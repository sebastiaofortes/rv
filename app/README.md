# ZenVR - Versão App

Esta é uma versão alternativa da landing page do ZenVR com design focado em experiência mobile-first, simulando a interface de um aplicativo nativo.

## 🎨 Características de Design

### UX/UI Mobile-First
- **Cards Touch-Friendly**: Botões e cards grandes otimizados para toque
- **Bottom Navigation**: Navegação inferior típica de apps nativos
- **Splash Screen**: Tela de carregamento inicial animada
- **Glass Effect**: Efeitos de vidro fosco no header
- **Animações Suaves**: Transições e animações fluidas
- **Safe Areas**: Suporte para notches e áreas seguras de dispositivos modernos

### Paleta de Cores (Mantida da Versão Web)
- **Primária**: Indigo (#4F46E5, indigo-600/700)
- **Secundária**: Blue (#3B82F6, blue-400/600)
- **Terciária**: Purple (#9333EA, purple-600/700)
- **Background**: Gradientes suaves de indigo-50 a blue-50

## 📱 Elementos do App

### Componentes Principais
1. **Splash Screen** - Animação de entrada com logo
2. **Header Sticky** - Cabeçalho fixo com efeito glass
3. **Quick Stats** - Cards com estatísticas rápidas
4. **Featured Card** - Card principal destacado (Atenção Plena)
5. **Quick Actions Grid** - Grid 2x1 com ações rápidas
6. **Feature List** - Lista de benefícios com ícones
7. **How it Works** - Passo a passo numerado
8. **CTA Section** - Call-to-action final
9. **Bottom Navigation** - Navegação inferior fixa

### Interações
- Tap highlight desabilitado para experiência mais nativa
- Feedback visual em toques (scale 0.98)
- Animações de fade-in e slide-up
- Floating animation no splash screen
- Overscroll behavior controlado

## 🔗 Navegação

Todos os links mantêm compatibilidade com a estrutura existente:
- `/cenarios.html?pagina=paisagem` - Atenção Plena
- `/cenarios.html?pagina=respiracao` - Exercício de Respiração
- `/cenarios.html?pagina=palavras` - Chuva de Palavras

## 🚀 Como Usar

1. Acesse `/app/` ou `/app/landing.html` no navegador mobile
2. A experiência é otimizada para viewport mobile (375-428px)
3. Funciona em qualquer navegador moderno
4. PWA-ready (adicionar manifest.json para instalação)

## 📊 Diferenças da Versão Web

| Aspecto | Versão Web | Versão App |
|---------|------------|------------|
| Layout | Desktop-first | Mobile-first |
| Navegação | Menu superior | Bottom navigation |
| Cards | Médios | Grandes e touch-friendly |
| Animações | Básicas | Avançadas (splash, floating) |
| Vídeo Hero | Sim (fullscreen) | Não (foco em ação) |
| Safe Areas | Não | Sim (notch support) |
| Glass Effect | Não | Sim (header) |
| Splash Screen | Não | Sim |

## 🎯 Público-Alvo

Esta versão é ideal para:
- Usuários que acessam predominantemente via mobile
- Instalação como PWA (Progressive Web App)
- Experiência rápida e direta
- Menor consumo de dados (sem vídeo hero)

## 🔧 Melhorias Futuras

- [ ] Adicionar manifest.json para PWA
- [ ] Implementar service worker para cache
- [ ] Dark mode
- [ ] Histórico de sessões
- [ ] Notificações push
- [ ] Favoritos e playlists

