/**
 * ZenVR Bottom Navigation Component (<zen-bottom-nav>)
 * Native Web Component (Custom Element) providing consistent bottom navigation
 * across all ZenVR app pages.
 * Supports active item highlight, safe-area insets, and runtime i18n.
 */

(function () {
  'use strict';

  // Inject styles for safe-area and body padding reservation
  var STYLE_ID = 'zen-bottom-nav-styles';
  function ensureStyles() {
    if (!document.getElementById(STYLE_ID)) {
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = [
        '.safe-bottom {',
        '  padding-bottom: env(safe-area-inset-bottom, 0px);',
        '}',
        'body.has-zen-bottom-nav {',
        '  padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    }
  }

  // Icons configuration with SVG paths matching ZenVR app design
  var NAV_ITEMS = [
    {
      id: 'home',
      aliases: ['inicio', 'index'],
      labelKey: 'nav.home',
      fallbackLabel: 'Início',
      relativeUrl: 'landing.html',
      isSvgFilled: true,
      svgViewBox: '0 0 20 20',
      svgPath: '<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />'
    },
    {
      id: 'paisagem',
      aliases: ['mindfulness', 'atencao'],
      labelKey: 'nav.mindfulness',
      fallbackLabel: 'Atenção',
      relativeUrl: 'cenarios.html?pagina=paisagem',
      isSvgFilled: false,
      svgViewBox: '0 0 24 24',
      svgPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />'
    },
    {
      id: 'respiracao',
      aliases: ['breathing', 'respirar'],
      labelKey: 'nav.breathing',
      fallbackLabel: 'Respiração',
      relativeUrl: 'cenarios.html?pagina=respiracao',
      isSvgFilled: false,
      svgViewBox: '0 0 24 24',
      svgPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />'
    },
    {
      id: 'palavras',
      aliases: ['words', 'visualizar'],
      labelKey: 'nav.words',
      fallbackLabel: 'Palavras',
      relativeUrl: 'cenarios.html?pagina=palavras',
      isSvgFilled: false,
      svgViewBox: '0 0 24 24',
      svgPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />'
    }
  ];

  function getBasePrefix() {
    // Detect whether current page is inside /app/ or at project root
    var pathname = window.location.pathname || '';
    var isApp = /\/app(\/|$)/.test(pathname);
    return isApp ? './' : './app/';
  }

  function getTranslation(key, fallback) {
    if (window.ZenVR_i18n && typeof window.ZenVR_i18n.t === 'function') {
      var val = window.ZenVR_i18n.t(key);
      if (val && val !== key) return val;
    }
    if (typeof window.t === 'function') {
      var valT = window.t(key);
      if (valT && valT !== key) return valT;
    }
    return fallback;
  }

  class ZenBottomNav extends HTMLElement {
    static get observedAttributes() {
      return ['active'];
    }

    constructor() {
      super();
      this._onLangChange = this._onLangChange.bind(this);
    }

    connectedCallback() {
      ensureStyles();
      document.body.classList.add('has-zen-bottom-nav');
      this.render();
      window.addEventListener('zenvr:langchange', this._onLangChange);
    }

    disconnectedCallback() {
      window.removeEventListener('zenvr:langchange', this._onLangChange);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this.render();
      }
    }

    _onLangChange() {
      this.updateLabels();
    }

    determineActive() {
      var explicit = this.getAttribute('active');
      if (explicit) return explicit.toLowerCase();

      try {
        var params = new URLSearchParams(window.location.search);
        var pagina = params.get('pagina');
        if (pagina) return pagina.toLowerCase();
      } catch (e) {}

      var pathname = window.location.pathname || '';
      if (pathname.indexOf('cenarios.html') !== -1) {
        return 'paisagem';
      }

      return 'home';
    }

    render() {
      var activeKey = this.determineActive();
      var prefix = getBasePrefix();

      var nav = document.createElement('nav');
      nav.className = 'safe-bottom fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50';
      nav.setAttribute('aria-label', getTranslation('nav.aria', 'Navegação principal'));

      var container = document.createElement('div');
      container.className = 'flex justify-around items-center px-4 py-3';

      NAV_ITEMS.forEach(function (item) {
        var isActive = (item.id === activeKey) || (item.aliases && item.aliases.indexOf(activeKey) !== -1);
        var a = document.createElement('a');
        a.href = prefix + item.relativeUrl;
        a.className = isActive
          ? 'flex flex-col items-center space-y-1 text-indigo-600'
          : 'flex flex-col items-center space-y-1 text-gray-400 hover:text-indigo-500 transition-colors';

        if (isActive) {
          a.setAttribute('aria-current', 'page');
        }

        var fillAttr = item.isSvgFilled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor"';
        var label = getTranslation(item.labelKey, item.fallbackLabel);

        a.innerHTML = [
          '<svg class="w-6 h-6" ' + fillAttr + ' viewBox="' + item.svgViewBox + '" aria-hidden="true">',
          '  ' + item.svgPath,
          '</svg>',
          '<span class="text-xs ' + (isActive ? 'font-semibold' : 'font-medium') + '" data-i18n="' + item.labelKey + '"></span>'
        ].join('\n');

        var span = a.querySelector('span');
        if (span) {
          span.textContent = label;
        }

        container.appendChild(a);
      });

      nav.appendChild(container);
      this.innerHTML = '';
      this.appendChild(nav);
    }

    updateLabels() {
      var nav = this.querySelector('nav');
      if (nav) {
        nav.setAttribute('aria-label', getTranslation('nav.aria', 'Navegação principal'));
      }
      var spans = this.querySelectorAll('[data-i18n]');
      spans.forEach(function (span) {
        var key = span.getAttribute('data-i18n');
        if (key) {
          var item = NAV_ITEMS.find(function (i) { return i.labelKey === key; });
          var fallback = item ? item.fallbackLabel : span.textContent;
          span.textContent = getTranslation(key, fallback);
        }
      });
    }
  }

  if (!customElements.get('zen-bottom-nav')) {
    customElements.define('zen-bottom-nav', ZenBottomNav);
  }
})();
