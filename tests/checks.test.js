/* ============================================================================
   The safety net.

   Every fault this app has shipped was found by a person using it, usually
   days later, and usually because somebody else said "non ti trovo". That is
   the most expensive way to find a bug and the worst way to hear about one.

   These checks run before anything is published. They deliberately need
   NOTHING installed: no npm, no node_modules, no test framework beyond the one
   built into Node itself. That is not laziness — this app's single strongest
   security property is that it loads no code written by anybody else, and a
   test suite that dragged in three hundred packages to check it would be a
   strange way to protect that.

   Run them with:   node --test tests/
   ========================================================================= */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

const JS = read('modifica.js');
const HTML = read('modifica.html');
const CSS = read('modifica.css');
const SW = read('modifica-sw.js');
const WORKER = read('turn-worker/worker.js');

/* ---------------------------------------------------------------- syntax -- */

test('every script actually parses', () => {
  for (const file of ['modifica.js', 'modifica-sw.js', 'turn-worker/worker.js']){
    execFileSync(process.execPath, ['--check', path.join(ROOT, file)]);
  }
});

/* ------------------------------------------------- the page and the code -- */
/* A renamed or deleted element does not fail loudly: $('...') simply returns
   null, and the line that touches it throws in the middle of something else,
   often somewhere that swallows it. This is the cheapest check in the file and
   it covers 169 separate ways to break the app silently. */

const idsInHtml = new Set([...HTML.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]));

test('every element the code reaches for exists in the page', () => {
  const asked = new Set([...JS.matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]));
  const missing = [...asked].filter(id => !idsInHtml.has(id)).sort();
  assert.deepStrictEqual(missing, [], `the code asks for elements the page does not have: ${missing.join(', ')}`);
});

test('every icon is placed on an element that exists', () => {
  const asked = [...JS.matchAll(/setIcon\('([A-Za-z0-9_-]+)'/g)].map(m => m[1]);
  const missing = asked.filter(id => !idsInHtml.has(id)).sort();
  assert.deepStrictEqual(missing, [], `setIcon points at elements that do not exist: ${missing.join(', ')}`);
});

test('no element is declared twice', () => {
  const all = [...HTML.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]);
  const seen = new Set(), twice = new Set();
  for (const id of all){ if (seen.has(id)) twice.add(id); seen.add(id); }
  assert.deepStrictEqual([...twice].sort(), [], `duplicate ids: ${[...twice].join(', ')}`);
});

/* ------------------------------------------------------------ the languages -- */
/* Thirteen languages is a promise to thirteen groups of people, and a missing
   key does not crash — it quietly shows Italian to somebody who does not read
   Italian, which is the kind of failure nobody reports. */

const LANGS = ['it','en','ar','bn','de','es','fr','hi','id','pt','ru','ur','zh'];

function loadDictionaries(){
  const start = JS.indexOf('const I18N');
  const lastAssign = JS.lastIndexOf('Object.assign(I18N.');
  const end = JS.indexOf('});', lastAssign) + 3;
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(JS.slice(start, end) + '\nthis.OUT = I18N;', sandbox);
  return sandbox.OUT;
}

test('all thirteen languages are present', () => {
  const I18N = loadDictionaries();
  assert.deepStrictEqual(Object.keys(I18N).sort(), [...LANGS].sort());
});

test('no language is missing a line, and none has one nobody asked for', () => {
  const I18N = loadDictionaries();
  const base = new Set(Object.keys(I18N.it));
  for (const lg of LANGS){
    const keys = new Set(Object.keys(I18N[lg]));
    const missing = [...base].filter(k => !keys.has(k)).sort();
    const extra = [...keys].filter(k => !base.has(k)).sort();
    assert.deepStrictEqual(missing, [], `${lg} is missing: ${missing.join(', ')}`);
    assert.deepStrictEqual(extra, [], `${lg} has lines nothing uses: ${extra.join(', ')}`);
  }
});

test('no translation is left empty', () => {
  const I18N = loadDictionaries();
  const empty = [];
  for (const lg of LANGS)
    for (const [k, v] of Object.entries(I18N[lg]))
      if (typeof v !== 'string' || !v.trim()) empty.push(`${lg}/${k}`);
  assert.deepStrictEqual(empty, [], `empty translations: ${empty.join(', ')}`);
});

test('every line the code or the page asks for has been written', () => {
  const I18N = loadDictionaries();
  const base = new Set(Object.keys(I18N.it));
  const asked = new Set();
  for (const m of JS.matchAll(/\bt\(\s*'([^']+)'/g)) asked.add(m[1]);
  for (const m of HTML.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)) asked.add(m[1]);
  for (const m of JS.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)) asked.add(m[1]);
  const unknown = [...asked].filter(k => !base.has(k)).sort();
  assert.deepStrictEqual(unknown, [], `asked for but never written: ${unknown.join(', ')}`);
});

test('a placeholder in one language is a placeholder in all of them', () => {
  /* {name} written in Italian and forgotten in Urdu shows a reader the raw
     word "{name}" — or worse, drops the only useful part of the sentence. */
  const I18N = loadDictionaries();
  const wrong = [];
  for (const key of Object.keys(I18N.it)){
    const want = (I18N.it[key].match(/\{\w+\}/g) || []).sort().join(',');
    for (const lg of LANGS){
      const got = (I18N[lg][key].match(/\{\w+\}/g) || []).sort().join(',');
      if (got !== want) wrong.push(`${key} — it has [${want}], ${lg} has [${got}]`);
    }
  }
  assert.deepStrictEqual(wrong, [], `placeholders do not match:\n${wrong.join('\n')}`);
});

/* ------------------------------------------------------------- the version -- */
/* The oldest trap in this project: publish a change, see the old app, conclude
   the change did not work, and go looking for a bug that is not there. */

test('the app and its service worker claim the same version', () => {
  const inJs = JS.match(/APP_VERSION\s*=\s*'([^']+)'/);
  const inSw = SW.match(/CACHE\s*=\s*'([^']+)'/);
  assert.ok(inJs, 'APP_VERSION not found in modifica.js');
  assert.ok(inSw, 'CACHE not found in modifica-sw.js');
  assert.strictEqual(inJs[1], inSw[1],
    `modifica.js says ${inJs[1]}, modifica-sw.js says ${inSw[1]} — bump both`);
});

/* -------------------------------------------------------------- the origins -- */
/* The app tells people "this copy is at an address the service refuses". It can
   only tell the truth about that while its own list matches the Worker's. */

test('the app knows exactly which origins the Worker answers for', () => {
  const inApp = [...(JS.match(/SERVICE_ORIGINS\s*=\s*\[([^\]]*)\]/) || [,''])[1]
    .matchAll(/'([^']+)'/g)].map(m => m[1]);
  const inWorker = [...(WORKER.match(/ALLOWED_ORIGINS\s*=\s*\[([^\]]*)\]/) || [,''])[1]
    .matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(inApp.length, 'SERVICE_ORIGINS not found in modifica.js');
  assert.deepStrictEqual(inApp.sort(), inWorker.sort(),
    'the app and the Worker disagree about which origins work');
});

/* --------------------------------------------------- nothing from outside -- */
/* Loading no code written by anybody else is this app's strongest security
   property. It is worth a test rather than a good intention. */

/* A <link rel="canonical"> names a page, it does not fetch one — only the rels
   below actually pull something down, and those are the ones that matter. */
const FETCHING_RELS = /\b(stylesheet|preload|prefetch|modulepreload|prerender|icon|apple-touch-icon|manifest)\b/i;

function loadsFromElsewhere(html){
  const offenders = [];
  for (const m of html.matchAll(/<(script|link)\b[^>]*>/gi)){
    const tag = m[0];
    const url = (tag.match(/(?:src|href)="([^"]+)"/i) || [])[1];
    if (!url) continue;
    if (!(/^https?:\/\//i.test(url) || url.startsWith('//'))) continue;
    const isScript = /^<script/i.test(tag);
    const rel = (tag.match(/\brel="([^"]*)"/i) || [, ''])[1];
    if (isScript || FETCHING_RELS.test(rel)) offenders.push(tag.trim());
  }
  return offenders;
}

test('the page loads no script, style or font from anywhere else', () => {
  const offenders = loadsFromElsewhere(HTML);
  assert.deepStrictEqual(offenders, [], `loaded from elsewhere:\n${offenders.join('\n')}`);
});

test('the security policy still forbids outside code', () => {
  const csp = (HTML.match(/Content-Security-Policy"\s*content="([\s\S]*?)"/) || [,''])[1];
  assert.match(csp, /default-src 'self'/, 'default-src is no longer self');
  assert.match(csp, /script-src 'self'/, 'script-src is no longer self');
  assert.ok(!/unsafe-inline|unsafe-eval/.test(csp),
    `the policy has been loosened: ${csp.replace(/\s+/g, ' ').trim()}`);
});

test('nothing in the page uses an inline style the policy would block', () => {
  const found = [...HTML.matchAll(/\sstyle="[^"]*"/g)].map(m => m[0].trim());
  assert.deepStrictEqual(found, [], `style attributes are blocked by the CSP:\n${found.join('\n')}`);
});

/* ------------------------------------------------------- what is cached -- */

test('the service worker caches every file the app is made of', () => {
  const cached = [...(SW.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/) || [,''])[1]
    .matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
  for (const needed of ['modifica.html', 'modifica.css', 'modifica.js']){
    assert.ok(cached.includes(needed), `${needed} is not in the offline cache`);
  }
  const missingOnDisk = cached.filter(f => !fs.existsSync(path.join(ROOT, f)));
  assert.deepStrictEqual(missingOnDisk, [],
    `the service worker caches files that do not exist: ${missingOnDisk.join(', ')}`);
});

/* ------------------------------------------------------- the front door -- */
/* The page somebody is sent before they have decided to care. It is held to
   the same standard as the app: thirteen languages, nothing loaded from
   anywhere else, and no promise the app cannot keep. */

const HOME_HTML = read('index.html');
const HOME_JS = read('index.js');

function homeDictionaries(){
  const out = {};
  for (const m of HOME_JS.matchAll(/^T\.(\w+) = \{([\s\S]*?)^\};/gm)){
    const keys = [...m[2].matchAll(/^\s*'([^']+)':/gm)].map(k => k[1]);
    out[m[1]] = keys;
  }
  return out;
}

test('the front door speaks the same thirteen languages as the app', () => {
  const dicts = homeDictionaries();
  assert.deepStrictEqual(Object.keys(dicts).sort(), [...LANGS].sort());
});

test('no language is missing a line on the front door', () => {
  const dicts = homeDictionaries();
  const base = new Set(dicts.it);
  for (const lg of LANGS){
    const missing = [...base].filter(k => !dicts[lg].includes(k)).sort();
    const extra = dicts[lg].filter(k => !base.has(k)).sort();
    assert.deepStrictEqual(missing, [], `the front door in ${lg} is missing: ${missing.join(', ')}`);
    assert.deepStrictEqual(extra, [], `the front door in ${lg} has spare lines: ${extra.join(', ')}`);
  }
});

test('every line the front door shows has been written', () => {
  const base = new Set(homeDictionaries().it);
  const asked = new Set([...HOME_HTML.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]));
  const unknown = [...asked].filter(k => !base.has(k)).sort();
  assert.deepStrictEqual(unknown, [], `the front door asks for lines nobody wrote: ${unknown.join(', ')}`);
});

test('the front door loads nothing from anywhere else either', () => {
  const offenders = loadsFromElsewhere(HOME_HTML);
  assert.deepStrictEqual(offenders, [], `the front door loads from elsewhere:\n${offenders.join('\n')}`);
});

test('the front door has no inline style or script the policy would block', () => {
  assert.deepStrictEqual([...HOME_HTML.matchAll(/\sstyle="[^"]*"/g)].map(m => m[0].trim()), []);
  assert.ok(!/<style[\s>]/i.test(HOME_HTML), 'an inline <style> block would be blocked by its own policy');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(HOME_HTML),
    'an inline <script> would be blocked by its own policy');
});

test('no page claims protection a <meta> policy cannot give', () => {
  /* frame-ancestors is silently ignored when the policy comes from a meta tag.
     Leaving it in looks like a defence and is only a console warning. */
  for (const [name, html] of [['index.html', HOME_HTML], ['modifica.html', HTML]]){
    const csp = (html.match(/Content-Security-Policy"\s*content="([\s\S]*?)"/) || [, ''])[1];
    assert.ok(!/frame-ancestors/.test(csp),
      `${name} declares frame-ancestors in a meta tag, where browsers ignore it`);
  }
});

test('the front door actually leads into the app', () => {
  assert.match(HOME_HTML, /href="modifica\.html"/, 'nothing on the front door opens the app');
});

test('the front door does not promise more than the app delivers', () => {
  /* The one line that must never soften: needing both people online at once is
     the real cost of having no server, and it belongs on the front page. */
  const dicts = homeDictionaries();
  for (const lg of LANGS){
    assert.ok(dicts[lg].includes('limits.body'),
      `the honest limits are missing from the front door in ${lg}`);
  }
  assert.match(HOME_HTML, /data-i18n="limits\.body"/, 'the limits are not shown on the page at all');
});

/* --------------------------------------------------------- the stylesheet -- */

test('every class the stylesheet styles for the health card is really used', () => {
  for (const cls of ['healthrow', 'healthdot']){
    assert.ok(CSS.includes('.' + cls), `.${cls} has no styling`);
    assert.ok(JS.includes(cls), `.${cls} is styled but never used`);
  }
});
