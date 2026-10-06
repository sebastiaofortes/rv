/**
 * ZenVR i18n module
 * Lightweight runtime internationalization for ZenVR
 * Supports pt-BR (default), en, and es
 */
(function (window) {
  'use strict';

  var SUPPORTED_LANGS = ['pt-BR', 'en', 'es'];
  var DEFAULT_LANG = 'pt-BR';
  var STORAGE_KEY = 'zenvr_lang';

  var translations = {};
  var currentLang = DEFAULT_LANG;
  var initialized = false;

  function normalizeLang(lang) {
    if (!lang || typeof lang !== 'string') return null;
    var lower = lang.trim().toLowerCase();
    if (lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR';
    if (lower === 'en' || lower.startsWith('en-')) return 'en';
    if (lower === 'es' || lower.startsWith('es-')) return 'es';
    return null;
  }

  function detectLanguage() {
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var urlLang = normalizeLang(urlParams.get('lang'));
      if (urlLang && SUPPORTED_LANGS.indexOf(urlLang) !== -1) {
        try {
          localStorage.setItem(STORAGE_KEY, urlLang);
        } catch (e) {}
        return urlLang;
      }
    } catch (e) {}

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LANGS.indexOf(stored) !== -1) {
        return stored;
      }
    } catch (e) {}

    try {
      var navLangs = navigator.languages || [navigator.language || ''];
      for (var i = 0; i < navLangs.length; i++) {
        var norm = normalizeLang(navLangs[i]);
        if (norm && SUPPORTED_LANGS.indexOf(norm) !== -1) {
          return norm;
        }
      }
    } catch (e) {}

    return DEFAULT_LANG;
  }

  function loadLocale(lang) {
    if (translations[lang]) {
      return Promise.resolve(translations[lang]);
    }
    return fetch('./locales/' + lang + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        translations[lang] = data;
        return data;
      })
      .catch(function (err) {
        console.warn('[ZenVR i18n] Failed to load locale "' + lang + '":', err);
        translations[lang] = translations[lang] || {};
        return translations[lang];
      });
  }

  function getNested(obj, path) {
    if (!obj || !path) return undefined;
    var parts = path.split('.');
    var curr = obj;
    for (var i = 0; i < parts.length; i++) {
      if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
      curr = curr[parts[i]];
    }
    return curr;
  }

  function t(key, params) {
    if (!key) return '';

    var val = getNested(translations[currentLang], key);

    // Fallback to default language if key missing in current language
    if (val === undefined && currentLang !== DEFAULT_LANG) {
      val = getNested(translations[DEFAULT_LANG], key);
    }

    // Pluralization support
    if (params && typeof params.count === 'number') {
      try {
        var pr = new Intl.PluralRules(currentLang);
        var rule = pr.select(params.count); // 'one', 'other', etc.
        if (val && typeof val === 'object') {
          val = val[rule] || val.other || val;
        } else {
          var pluralVal = getNested(translations[currentLang], key + '.' + rule) ||
                          getNested(translations[DEFAULT_LANG], key + '.' + rule);
          if (pluralVal !== undefined) val = pluralVal;
        }
      } catch (e) {}
    }

    if (val === undefined || val === null) {
      return key;
    }

    if (typeof val === 'string' && params) {
      val = val.replace(/\{(\w+)\}/g, function (match, prop) {
        return params[prop] !== undefined ? params[prop] : match;
      });
    }

    return typeof val === 'string' ? val : key;
  }

  function applyTranslations(lang) {
    var targetLang = lang || currentLang;
    document.documentElement.lang = targetLang;

    // Page title and description
    var metaTitle = t('meta.title');
    if (metaTitle && metaTitle !== 'meta.title') {
      document.title = metaTitle;
    }
    var metaDesc = t('meta.description');
    if (metaDesc && metaDesc !== 'meta.description') {
      var descEl = document.querySelector('meta[name="description"]');
      if (descEl) descEl.setAttribute('content', metaDesc);
    }

    // [data-i18n] textContent
    var textEls = document.querySelectorAll('[data-i18n]');
    textEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      if (val && val !== key) {
        el.textContent = val;
      }
    });

    // [data-i18n-html] innerHTML
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    htmlEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t(key);
      if (val && val !== key) {
        el.innerHTML = val;
      }
    });

    // [data-i18n-attr] attributes: "attr:key,attr2:key2"
    var attrEls = document.querySelectorAll('[data-i18n-attr]');
    attrEls.forEach(function (el) {
      var mapping = el.getAttribute('data-i18n-attr');
      if (!mapping) return;
      mapping.split(',').forEach(function (item) {
        var parts = item.split(':');
        if (parts.length >= 2) {
          var attr = parts[0].trim();
          var key = parts.slice(1).join(':').trim();
          var val = t(key);
          if (val && val !== key) {
            el.setAttribute(attr, val);
          }
        }
      });
    });

    // Update active state on language buttons
    var langBtns = document.querySelectorAll('[data-lang-btn]');
    langBtns.forEach(function (btn) {
      var btnLang = btn.getAttribute('data-lang-btn');
      if (btnLang === targetLang) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
        btn.classList.remove('bg-gray-100', 'text-gray-600', 'hover:bg-gray-200');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
        btn.classList.add('bg-gray-100', 'text-gray-600', 'hover:bg-gray-200');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Update privacy policy links to match active language
    var privacyLinks = document.querySelectorAll('[data-i18n-privacy]');
    privacyLinks.forEach(function (link) {
      if (targetLang === 'en') {
        link.setAttribute('href', 'privacy-policy.en.html');
      } else if (targetLang === 'es') {
        link.setAttribute('href', 'privacy-policy.es.html');
      } else {
        link.setAttribute('href', 'privacy-policy.html');
      }
    });

    // Analytics integration
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('set', { language: targetLang });
      } catch (e) {}
    }

    // Custom event for reactive components (such as session history widget)
    window.dispatchEvent(new CustomEvent('zenvr:langchange', { detail: { lang: targetLang } }));
  }

  function setLanguage(lang) {
    var norm = normalizeLang(lang);
    if (!norm || SUPPORTED_LANGS.indexOf(norm) === -1) return Promise.resolve();

    currentLang = norm;
    try {
      localStorage.setItem(STORAGE_KEY, norm);
    } catch (e) {}

    var promises = [loadLocale(norm)];
    if (norm !== DEFAULT_LANG && !translations[DEFAULT_LANG]) {
      promises.push(loadLocale(DEFAULT_LANG));
    }

    return Promise.all(promises).then(function () {
      applyTranslations(norm);
    });
  }

  function formatWeekday(date, length) {
    try {
      var d = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(currentLang, { weekday: length || 'short' }).format(d);
    } catch (e) {
      return '';
    }
  }

  var initPromise = null;

  function init() {
    if (initPromise) return initPromise;

    var detected = detectLanguage();
    currentLang = detected;

    var promises = [loadLocale(detected)];
    if (detected !== DEFAULT_LANG) {
      promises.push(loadLocale(DEFAULT_LANG));
    }

    initPromise = Promise.all(promises).then(function () {
      applyTranslations(detected);
      return detected;
    });

    return initPromise;
  }

  window.ZenVR_i18n = {
    SUPPORTED_LANGS: SUPPORTED_LANGS,
    DEFAULT_LANG: DEFAULT_LANG,
    detectLanguage: detectLanguage,
    setLanguage: setLanguage,
    getLanguage: function () { return currentLang; },
    t: t,
    formatWeekday: formatWeekday,
    applyTranslations: applyTranslations,
    init: init
  };

  window.t = t;
  window.setLanguage = setLanguage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
