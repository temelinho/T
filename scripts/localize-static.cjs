const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const origin = 'https://temeltechnology.com';
const normalise = text => text.replace(/\s+/g, ' ').trim();
const entities = {amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:'\u00a0'};
const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, key) => {
  if (key.startsWith('#')) return String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2),16) : Number(key.slice(1)));
  return entities[key] ?? all;
});
const escape = text => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function englishPath(pathname) {
  const base = pathname.replace(/^\/en(?=\/)/, '').replace(/\/index\.html$/, '/');
  return '/en' + base;
}

function renderEnglish(html, copy) {
  const t = text => {
    const value = decode(text), key = normalise(value);
    const en = copy[key] ?? (key.endsWith(' ↗') && copy[key.slice(0,-2)] ? copy[key.slice(0,-2)] + ' ↗' : null);
    return en ? value.replace(value.trim(), en) : value;
  };
  function structured(value, key) {
    if (Array.isArray(value)) return value.map(item => structured(item));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, structured(v,k)]));
    if (typeof value !== 'string') return value;
    if (key === 'inLanguage') return 'en';
    if (['url','@id'].includes(key) && value.startsWith(origin)) {
      const url = new URL(value);
      url.pathname = englishPath(url.pathname);
      return url.href;
    }
    return t(value);
  }
  // Tokenise entire script/style blocks before tags; never translate executable code.
  return html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<[^>]+>|[^<]+/gi, token => {
    if (/^<!--|^<style\b/i.test(token)) return token;
    if (/^<script\b/i.test(token)) {
      if (/type="application\/ld\+json"/i.test(token)) return token.replace(/(>)([\s\S]*?)(<\/script)/i, (_,a,data,b) => a + JSON.stringify(structured(JSON.parse(data))) + b);
      return token.replace(/\bsrc="([^"/:][^"]*)"/g, (_,src) => `src="/${src}"`);
    }
    if (!token.startsWith('<')) return escape(t(token));
    const tag = /^<([a-z]+)/i.exec(token)?.[1]?.toLowerCase();
    if (tag === 'html') return token.replace('lang="tr"','lang="en"');
    const alternate = /rel="alternate"/.test(token);
    const switchLanguage = /data-language="(tr|en)"/.exec(token)?.[1];
    return token.replace(/([\w:-]+)="([^"]*)"/g, (all, attr, raw) => {
      let value = decode(raw);
      if (['aria-label','placeholder','alt','title'].includes(attr)) value = t(value);
      if (attr === 'content' && tag === 'meta') {
        if (/property="og:locale"/.test(token)) value = 'en_US';
        else if (/property="og:locale:alternate"/.test(token)) value = 'tr_TR';
        else if (/property="og:url"/.test(token)) { const url = new URL(value); url.pathname = englishPath(url.pathname); value = url.href; }
        else value = t(value);
      }
      if (attr === 'aria-pressed' && switchLanguage) value = String(switchLanguage === 'en');
      if (attr === 'aria-current' && switchLanguage) value = String(switchLanguage === 'en');
      if (attr === 'href' && /rel="canonical"/.test(token)) { const url = new URL(value); url.pathname = englishPath(url.pathname); value = url.href; }
      else if (['href','src','poster'].includes(attr) && !alternate && !/^(?:[a-z]+:|\/\/|#)/i.test(value)) {
        const url = new URL(value, origin + '/');
        if (tag === 'a' && /(?:\/|\.html)$/.test(url.pathname)) {
          const target = switchLanguage || 'en';
          url.pathname = target === 'en' ? englishPath(url.pathname) : url.pathname;
          url.searchParams.delete('lang');
        }
        value = url.pathname + url.search + url.hash;
      }
      return `${attr}="${escape(value)}"`;
    });
  });
}

function generateEnglish(root, output, pages) {
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'translations.js'),'utf8'), context);
  fs.mkdirSync(path.join(output,'en'), {recursive:true});
  for (const page of pages) {
    fs.writeFileSync(path.join(output,'en',page), renderEnglish(fs.readFileSync(path.join(root,page),'utf8'), context.window.siteTranslations));
  }
}

module.exports = {renderEnglish, generateEnglish};
