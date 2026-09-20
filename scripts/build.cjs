#!/usr/bin/env node
// Allowlist-only static release: never upload the checkout, secrets, tests, or tools.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const files = ['index.html', 'styles.css', 'app.js', '404.html', '_headers'];
const assetFiles = ['favicon.svg', 'fonts.css', 'world-data.js', 'country-data.js', 'audio-manifest.js', 'countries-source.json'];
for (const file of assetFiles) files.push('assets/' + file);
for (const file of fs.readdirSync(path.join(root, 'assets'))) if (file.endsWith('.ttf')) files.push('assets/' + file);
for (const [dir, suffix] of [['flags', '.svg'], ['audio', '.mp3'], ['licenses', '.txt']]) {
  for (const file of fs.readdirSync(path.join(root, 'assets', dir))) if (file.endsWith(suffix)) files.push(`assets/${dir}/${file}`);
}
let size = 0;
for (const file of files) {
  const source = path.join(root, file), dest = path.join(dist, file);
  const stats = fs.statSync(source);
  assert(stats.isFile() && !fs.lstatSync(source).isSymbolicLink(), 'Only regular files may ship: ' + file);
  assert(stats.size < 25 * 1024 * 1024, 'Cloudflare Pages 25 MiB asset limit: ' + file);
  if (/\.(?:html|css|js)$/.test(file)) {
    const content = fs.readFileSync(source, 'utf8');
    assert(!/localhost|127\.0\.0\.1|portless|ATLAS_CDP|speechSynthesis|SpeechSynthesisUtterance/.test(content), 'Development-only reference in ' + file);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest); size += stats.size;
}
const manifest = vm.runInNewContext(fs.readFileSync(path.join(dist, 'assets/audio-manifest.js'), 'utf8') + ';PIP_AUDIO;');
for (const clip of Object.values(manifest).flat()) assert(fs.existsSync(path.join(dist, clip)), 'Missing narration: ' + clip);
assert.equal(files.filter(f=>f.startsWith('assets/flags/')).length, 197);
assert.equal(files.filter(f=>f.startsWith('assets/audio/')).length, 287);
for (const denied of ['.env.local', 'package.json', 'node_modules', 'tests', 'serve.py', 'assets/audio/generation.json']) assert(!fs.existsSync(path.join(dist, denied)), 'Private/dev artifact included: ' + denied);
fs.mkdirSync(path.join(root,'evidence'), { recursive: true });
fs.writeFileSync(path.join(root, 'evidence/build.json'), JSON.stringify({version:require('../package.json').version,files:files.length,bytes:size,flags:197,audioClips:287,privateFilesExcluded:true,filesIncluded:files}, null, 2)+'\n');
console.log(`Built dist/: ${files.length} public files, ${(size / 1024 / 1024).toFixed(1)} MiB; 197 flags, 287 audio clips. No secrets or development tooling.`);
