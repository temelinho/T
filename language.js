(() => {
  'use strict';
  const copy = window.siteTranslations;
  const normalise = text => text.replace(/\s+/g, ' ').trim();
  const translations = new Map(Object.entries(copy).map(([tr, en]) => [normalise(tr), en]));
  const reverse = new Map([...translations].map(([tr, en]) => [normalise(en), tr]));
  const originals = new WeakMap();
  const attributes = ['aria-label', 'placeholder', 'alt', 'title', 'content'];
  const excluded = 'script, style, textarea, input, [data-no-translate]';
  const storageKey = 'tt_language';
  const requested = new URLSearchParams(location.search).get('lang');
  // The URL determines the language; stored preferences never hide a locale from crawlers.
  let language = ['tr', 'en'].includes(requested) ? requested : location.pathname.startsWith('/en/') ? 'en' : 'tr';
  if (['tr', 'en'].includes(requested)) {
    try { localStorage.setItem(storageKey, language); } catch (_) { /* Optional preference. */ }
  }

  function lookup(map, text) {
    const core = normalise(text);
    if (map.has(core)) return map.get(core);
    if (core.endsWith(' ↗') && map.has(core.slice(0, -2))) return map.get(core.slice(0, -2)) + ' ↗';
  }

  function t(text) {
    return language === 'en' ? lookup(translations, text) ?? text : text;
  }

  function localisedUrl(value, target = language) {
    const url = new URL(value, location.href);
    const base = url.pathname.replace(/^\/en(?=\/)/, '').replace(/\/index\.html$/, '/');
    url.pathname = (target === 'en' ? '/en' : '') + base;
    url.searchParams.delete('lang');
    return url;
  }

  if (['tr', 'en'].includes(requested)) history.replaceState(null, '', localisedUrl(location.href));

  // Remember each original separately so repeated English phrases restore correctly.
  function translated(owner, key, value) {
    let records = originals.get(owner);
    if (!records) { records = new Map(); originals.set(owner, records); }
    let record = records.get(key);
    if (!record || record.rendered !== value) {
      // Dialogs can copy text that has already been translated elsewhere.
      const source = lookup(reverse, value);
      record = {source: source ? value.replace(value.trim(), source) : value};
    }
    const english = lookup(translations, record.source);
    record.rendered = language === 'en' && english
      ? record.source.replace(record.source.trim(), english) : record.source;
    records.set(key, record);
    return record.rendered;
  }

  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement || node.parentElement.closest(excluded)) return;
      const value = translated(node, 'text', node.data);
      if (node.data !== value) node.data = value;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches('script, style, [data-no-translate]')) return;
    for (const attr of attributes) {
      if (!node.hasAttribute(attr)) continue;
      // Only human-readable metadata is translated; URLs and identifiers stay intact.
      const value = translated(node, attr, node.getAttribute(attr));
      if (node.getAttribute(attr) !== value) node.setAttribute(attr, value);
    }
    if (node.matches('meta[property="og:locale"]')) {
      const locale = language === 'en' ? 'en_US' : 'tr_TR';
      if (node.content !== locale) node.content = locale;
    }
    if (node.matches('meta[property="og:locale:alternate"]')) {
      const locale = language === 'en' ? 'tr_TR' : 'en_US';
      if (node.content !== locale) node.content = locale;
    }
    if (node.matches('a[href]')) {
      const href = node.getAttribute('href');
      if (node.dataset.language) {
        const url = localisedUrl(location.href, node.dataset.language);
        const value = url.pathname + url.search + url.hash;
        if (href !== value) node.setAttribute('href', value);
      } else if (href && !href.startsWith('#')) {
        const url = new URL(href, location.href);
        if (url.origin === location.origin && /(?:\/|\.html)$/.test(url.pathname)) {
          const localised = localisedUrl(url);
          const value = localised.pathname + localised.search + localised.hash;
          if (href !== value) node.setAttribute('href', value);
        } else if (url.hostname === 'wa.me' && url.searchParams.has('text')) {
          const text = translated(node, 'whatsapp-message', url.searchParams.get('text'));
          url.searchParams.set('text', text);
          if (href !== url.href) node.setAttribute('href', url.href);
        }
      }
    }
    node.childNodes.forEach(visit);
  }

  function apply() {
    document.documentElement.lang = language;
    visit(document.head);
    visit(document.body);
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-current', String(button.dataset.language === language));
    });
    const canonical = localisedUrl(location.href);
    canonical.search = ''; canonical.hash = '';
    const publicUrl = 'https://temeltechnology.com' + canonical.pathname;
    document.querySelector('link[rel="canonical"]').href = publicUrl;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = publicUrl;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      function localise(value, key) {
        if (Array.isArray(value)) return value.map(item => localise(item));
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,localise(v,k)]));
        if (typeof value !== 'string') return value;
        if (key === 'inLanguage') return language;
        if (['url','@id'].includes(key) && value.startsWith('https://temeltechnology.com/')) {
          return localisedUrl(value).href;
        }
        return lookup(language === 'en' ? translations : reverse, value) ?? value;
      }
      script.textContent = JSON.stringify(localise(JSON.parse(script.textContent)));
    });
  }

  window.siteI18n = {t, get language() { return language; }};
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      language = button.dataset.language;
      try { localStorage.setItem(storageKey, language); } catch (_) { /* Keep working without storage. */ }
      const url = localisedUrl(location.href);
      if (url.href !== location.href) history.pushState(null, '', url);
      apply();
      document.dispatchEvent(new Event('languagechange'));
    });
  });
  window.addEventListener('popstate', () => {
    language = location.pathname.startsWith('/en/') ? 'en' : 'tr';
    apply();
    document.dispatchEvent(new Event('languagechange'));
  });
  apply();
  // Translate new dialog content, validation errors and rotating hero captions too.
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(visit);
      else visit(record.target);
    }
  }).observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: [...attributes, 'href']
  });
})();
