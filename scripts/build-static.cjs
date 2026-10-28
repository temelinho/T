const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const output = path.join(root,'public');
const entryFiles = ['index.html','teklif-formu.html','web-tasarim.html','mobil-uygulama.html','dijital-reklam.html','hero.css','hero.js','theme.css','portfolio.css','portfolio.js','micro-slats.css','micro-slats.js','navigation.js','experience.css','experience.js','service-pages.css','mail-delivery.js','teklif-formu.js','sitemap.xml','robots.txt','kurumsal-teknoloji-hero-bg-v4.webp'];
const files = new Set(entryFiles);
files.add('contact-validation.js');
for (const file of entryFiles.filter(name=>/\.(html|css|js)$/.test(name))) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  for (const match of source.matchAll(/images\/[a-zA-Z0-9_./-]+/g)) {
    if (!match[0].endsWith('/') && path.extname(match[0])) files.add(match[0]);
  }
}
files.add('licenses/react-bits.txt');
files.add('images/SCREENSHOT-SOURCES.txt');
// Only this generated directory is replaced. No source or user attachment is removed.
if(path.dirname(output)!==root || path.basename(output)!=='public')throw new Error('Invalid output directory');
if(fs.existsSync(output)&&!fs.existsSync(path.join(output,'.generated-by-temel-build')))throw new Error('Refusing to overwrite an unmanaged public directory');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'.generated-by-temel-build'),'Generated static website.\n');
for(const relative of files){
  const source=path.resolve(root,relative),destination=path.resolve(output,relative);
  if(!source.startsWith(root+path.sep)||!destination.startsWith(output+path.sep))throw new Error('Invalid asset path');
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination);
}
console.log(`Static site built: ${files.size} files. Server code and secrets are excluded.`);
