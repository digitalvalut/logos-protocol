/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 * Licensed under the Apache License, Version 2.0.
 */

/* ======================== NUMBERS THAT CANNOT GO STALE ========================
 *
 * The documents quote how many tests the project has. This checks the quote
 * against the suite that just ran, and fails if they disagree.
 *
 *     node --test --test-reporter=tap --test-reporter-destination=suite.tap
 *     node tools/controlla-numeri.js suite.tap
 *
 * Why it exists: on 28 Sep 2026 the README still said "473 automated tests",
 * a figure from 14 Sep, while the suite had 570. Nobody lied; the number just
 * sat there for two weeks while the code moved, and an outside reader found it
 * before we did. A number written by hand is a promise nobody keeps. This one
 * is kept by the build: add a test, and the push stays red until the documents
 * say so too.
 *
 * Only living documents are checked. DOSSIER-PER-AI.md is a dated snapshot
 * and says so at the top; holding it to today's numbers would be wrong.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tapFile = process.argv[2];
if (!tapFile) { console.error('usage: node tools/controlla-numeri.js <suite.tap>'); process.exit(2); }

const tap = fs.readFileSync(tapFile, 'utf8');
// The run's own totals are the last "# tests N" / "# suites N" lines of the report.
const last = (re) => { let m, v = null; const g = new RegExp(re.source, 'gm'); while ((m = g.exec(tap))) v = Number(m[1]); return v; };
const tests = last(/^# tests (\d+)$/);
const suites = last(/^# suites (\d+)$/);
const fail = last(/^# fail (\d+)$/);
if (tests == null || suites == null) {
  console.error(`No totals found in ${tapFile}: was it written with --test-reporter=tap?`);
  process.exit(2);
}

// Each claim: the file, a pattern that captures the quoted numbers, and what they must equal.
const claims = [
  { file: 'README.md', re: /(\d[\d,]*) automated tests/, want: [tests] },
  { file: 'CLAUDE.md', re: /(\d[\d,]*) tests, (\d[\d,]*) suites/, want: [tests, suites] },
];

let wrong = 0;
for (const c of claims) {
  const text = fs.readFileSync(path.join(ROOT, c.file), 'utf8');
  const m = text.match(c.re);
  if (!m) { console.error(`✗ ${c.file}: the sentence with the test count is gone (looked for ${c.re}).`); wrong++; continue; }
  const said = m.slice(1).map((s) => Number(s.replace(/,/g, '')));
  if (said.some((n, i) => n !== c.want[i])) {
    console.error(`✗ ${c.file} says "${m[0]}", but this run had ${tests} tests in ${suites} suites.`);
    wrong++;
  } else {
    console.log(`✓ ${c.file}: "${m[0]}" matches this run.`);
  }
}
if (fail) console.log(`(note: this run had ${fail} failing tests; the counts are compared anyway)`);
if (wrong) {
  console.error('\nUpdate the numbers above to what this run measured, with today\'s date where the text gives one.');
  process.exit(1);
}
