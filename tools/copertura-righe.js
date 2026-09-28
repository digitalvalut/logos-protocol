/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 * Licensed under the Apache License, Version 2.0.
 */

/* ============================ LINE COVERAGE ============================
 *
 * How many lines of modifica.js the test suite actually executes.
 *
 *     node tools/copertura-righe.js            (Node 22; runs the whole suite, ~4 min)
 *
 * Why not `node --test --experimental-test-coverage`: the tests load modifica.js
 * into a sandbox with vm.runInContext, and Node's built-in report only lists
 * files loaded as modules. Measured 28 Sep 2026: it printed an empty table with
 * "100.00" for every column, which is a number about nothing. So this reads
 * V8's raw coverage (NODE_V8_COVERAGE) directly, where the sandboxed script
 * appears under the filename the tests give it.
 *
 * The rule, the same one v8-to-istanbul uses: a line is covered if any of its
 * characters ran at least once. Blank lines and comment-only lines are not
 * counted, in either direction. Each test file runs in its own process and may
 * load the app more than once; a character counts as covered if it ran in any
 * of them. No dependency, as everywhere else in this project.
 */

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'modifica.js');

function measure(dir, text) {
  const covered = new Uint8Array(text.length);
  let scripts = 0;
  for (const f of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const s of data.result) {
      if (!/(^|\/)modifica\.js$/.test(s.url)) continue;
      scripts++;
      const ranges = [];
      for (const fn of s.functions) for (const r of fn.ranges) ranges.push(r);
      // Outer ranges first, inner ones after: the innermost count wins.
      ranges.sort((a, b) => (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset));
      const count = new Int32Array(text.length).fill(-1);
      for (const r of ranges) {
        for (let i = r.startOffset; i < Math.min(r.endOffset, text.length); i++) count[i] = r.count;
      }
      for (let i = 0; i < text.length; i++) if (count[i] > 0) covered[i] = 1;
    }
  }
  let off = 0, inBlock = false, code = 0;
  const uncovered = [];
  text.split('\n').forEach((line, n) => {
    const start = off; off += line.length + 1;
    const t = line.trim();
    let comment = false;
    if (inBlock) { comment = true; if (t.includes('*/')) inBlock = false; }
    else if (t.startsWith('//')) comment = true;
    else if (t.startsWith('/*')) { comment = true; if (!t.includes('*/')) inBlock = true; }
    if (!t || comment) return;
    code++;
    const a = start + (line.length - line.trimStart().length);
    const b = start + line.trimEnd().length;
    let ran = false;
    for (let i = a; i < b; i++) if (covered[i]) { ran = true; break; }
    if (!ran) uncovered.push(n + 1);
  });
  return { scripts, code, uncovered };
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-v8cov-'));
const run = spawnSync(process.execPath, ['--test'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, NODE_V8_COVERAGE: dir },
});
if (run.status !== 0) {
  console.error('\nThe suite did not pass: a coverage number over a red suite means nothing.');
  process.exit(1);
}
const { scripts, code, uncovered } = measure(dir, fs.readFileSync(SOURCE, 'utf8'));
fs.rmSync(dir, { recursive: true, force: true });
if (!scripts) {
  console.error('\nNo coverage data for modifica.js: the tests may no longer load it by that name.');
  process.exit(1);
}
const pct = (100 * (code - uncovered.length) / code).toFixed(1);
console.log(`\nmodifica.js: ${code - uncovered.length} of ${code} code lines executed (${pct}%).`);
console.log(`Not executed: ${uncovered.length} lines.`);
