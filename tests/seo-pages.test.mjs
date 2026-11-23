import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {renderEnglish} = require('../scripts/localize-static.cjs');
const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://temeltechnology.com';
const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'translations.js'),'utf8'),context);
const copy = context.window.siteTranslations;

test('each locale has visible HTML content, its own canonical and reciprocal language alternatives', () => {
  const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  for (const file of pages) {
    const tr = fs.readFileSync(path.join(root,file),'utf8');
    const en = renderEnglish(tr,copy);
    const suffix = file === 'index.html' ? '' : file;
    for (const [language,html,url] of [['tr',tr,origin+'/'+suffix],['en',en,origin+'/en/'+suffix]]) {
      assert.match(html,new RegExp(`<html lang="${language}"`));
      assert.equal((html.match(/<h1\b/g)||[]).length,1,file);
      assert.ok(html.includes(`rel="canonical" href="${url}"`),url);
      assert.ok(html.includes(`hreflang="tr" href="${origin}/${suffix}"`));
      assert.ok(html.includes(`hreflang="en" href="${origin}/en/${suffix}"`));
      assert.ok(sitemap.includes(`<loc>${url}</loc>`));
      assert.match(html,/<title>[^<]+<\/title>/);
      assert.match(html,/<meta name="description" content="[^"<>]+"/);
    }
    assert.ok(en.includes('<a href="'+origin+'/'+suffix+'" data-language="tr"'));
    assert.ok(en.includes('aria-current="true">EN</a>'));
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(en)[1];
    assert.doesNotMatch(h1.replaceAll('Alanya Klima Temizliği',''),/[çğıöşüÇĞİÖŞÜ]/);
    for (const match of en.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(match[1]);
      assert.equal(data.inLanguage,'en');
      assert.equal(data.url,origin+'/en/'+suffix);
      assert.doesNotMatch(data.description,/[çğıöşüÇĞİÖŞÜ]/);
    }
  }
});

test('English pages preserve form payloads and executable scripts while localising displayed copy', () => {
  const tr = fs.readFileSync(path.join(root,'teklif-formu.html'),'utf8');
  const en = renderEnglish(tr,copy);
  assert.match(en,/data-value="Kurumsal"/);
  assert.match(en,/data-resend-endpoint="\/api\/quote"/);
  assert.match(en,/data-endpoint="https:\/\/formspree\.io\/f\//);
  assert.match(en,/src="\/teklif-formu.js"/);
  assert.match(en,/placeholder="Your full name"/);
  const input='<script>const name="İletişim"; if (a < b) send();</script><style>.x{content:"Özel"}</style><h1>Özel Yazılım</h1>';
  const output=renderEnglish(input,copy);
  assert.ok(output.startsWith(input.slice(0,input.indexOf('<h1>'))));
  assert.ok(output.endsWith('<h1>Custom Software</h1>'));
});

test('English internal links and assets resolve without an English asset directory', () => {
  for (const file of pages) {
    const html=renderEnglish(fs.readFileSync(path.join(root,file),'utf8'),copy);
    for (const match of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) {
      const target=match[1].replace(/&amp;/g,'&');
      if (/^(?:[a-z]+:|#)/i.test(target)) continue;
      assert.ok(target.startsWith('/'),`${file}: ${target}`);
      const url=new URL(target,origin);
      const source=url.pathname.replace(/^\/en\//,'/').replace(/\/$/,'/index.html');
      assert.ok(fs.existsSync(path.join(root,source)),`${file}: missing ${source}`);
      assert.equal(url.searchParams.has('lang'),false);
    }
    for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
      for(const candidate of match[1].split(',')) assert.ok(candidate.trim().startsWith('/images/'));
    }
  }
});
