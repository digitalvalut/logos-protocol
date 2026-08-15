/* ============================================================================
   The decisions, tested directly.

   Everything checked here is a plain judgement the app makes in a JavaScript
   function — "am I free to be reached?", "is this address written properly?",
   "is this connection actually working?" — and every serious fault this app
   has shipped was one of these getting the answer wrong. None of them is
   visible on a screen, which is exactly why they survived so long.

   The app is loaded whole, into the hand-written browser next door, and then
   asked. No mocking of the functions themselves: what runs here is the same
   code that runs on a phone.
   ========================================================================= */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildSandbox } = require('./fake-browser.js');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'modifica.js'), 'utf8');

/* One loaded app per test, so nothing carries over from the last one. */
function loadApp(options){
  const sandbox = buildSandbox(options);
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox, { filename: 'modifica.js' });
  const run = expr => vm.runInContext(expr, sandbox);
  run('stopAddrPolling(); stopInboxPolling();');
  sandbox.__stopAllTimers();
  return { sandbox, run, stop: () => sandbox.__stopAllTimers() };
}

test('the whole app loads without throwing', () => {
  const app = loadApp();
  assert.strictEqual(app.run('typeof busyWithSomeone'), 'function');
  app.stop();
});

/* ------------------------------------------------------------------------
   "Am I free to be reached?"

   This one function decides whether a call at your address, or a contact
   tapping your name, is allowed to get through. It answered wrongly for a
   long time and the symptom was invisible: the person affected saw a perfectly
   normal app, and only the people trying to reach them knew anything was wrong.
   ------------------------------------------------------------------------ */
test.describe('being reachable', () => {

  test('a fresh app is free', () => {
    const app = loadApp();
    assert.strictEqual(app.run('busyWithSomeone()'), false);
    app.stop();
  });

  test('an invite merely waiting does NOT block anyone — the original bug', () => {
    /* startQuickShare holds a connection for fifteen minutes while an invite
       waits for somebody to type the code, and resumes a saved one silently on
       every single app open. Treating that as "busy" made this device deaf. */
    const app = loadApp();
    app.run('pc = new RTCPeerConnection(); quickSharePc = pc;');
    assert.strictEqual(app.run('busyWithSomeone()'), false,
      'an invite on hold must not make this device unreachable');
    app.stop();
  });

  test('a connection belonging to something else does block', () => {
    const app = loadApp();
    app.run('pc = new RTCPeerConnection(); quickSharePc = null;');
    assert.strictEqual(app.run('busyWithSomeone()'), true);
    app.stop();
  });

  test('a connection nobody cleared away does not block for ever', () => {
    const app = loadApp();
    app.run('pc = new RTCPeerConnection(); quickSharePc = null; pc.connectionState = "failed";');
    assert.strictEqual(app.run('busyWithSomeone()'), false, 'a failed connection holds nothing open');
    app.run('pc.connectionState = "closed";');
    assert.strictEqual(app.run('busyWithSomeone()'), false, 'a closed connection holds nothing open');
    app.stop();
  });

  test('placing a call blocks, and stops blocking afterwards', () => {
    const app = loadApp();
    app.run('dialing = true;');
    assert.strictEqual(app.run('busyWithSomeone()'), true);
    app.run('dialing = false;');
    assert.strictEqual(app.run('busyWithSomeone()'), false);
    app.stop();
  });

  test('letting a known contact in blocks a second one arriving at once', () => {
    const app = loadApp();
    app.run('autoAccepting = true;');
    assert.strictEqual(app.run('busyWithSomeone()'), true);
    app.stop();
  });

  test('a call already ringing blocks another', () => {
    const app = loadApp();
    app.run('addrPending = { msg: {}, sec: {}, slot: 0 };');
    assert.strictEqual(app.run('busyWithSomeone()'), true);
    app.stop();
  });

  test('an open conversation blocks', () => {
    const app = loadApp();
    app.run('dc = { readyState: "open" };');
    assert.strictEqual(app.run('busyWithSomeone()'), true);
    app.stop();
  });

  test('both ways in ask the same question', () => {
    /* The fault existed twice because the rule was written out twice. If these
       two ever stop sharing one answer, it can happen a third time. */
    assert.ok(/async function addrCheckOnce\(\)\{\s*\n\s*if \(busyWithSomeone\(\)\) return;/.test(SOURCE),
      'the address check no longer asks busyWithSomeone()');
    assert.ok(/async function checkInboxOnce\(\)\{\s*\n\s*if \(busyWithSomeone\(\)\) return;/.test(SOURCE),
      'the contact check no longer asks busyWithSomeone()');
  });
});

/* ------------------------------------------------------------------------
   Addresses. These are read down a telephone and copied off screens by
   people who are not being careful, so what counts is what they survive.
   ------------------------------------------------------------------------ */
test.describe('addresses', () => {

  test('an address survives being written the way people write it', () => {
    const app = loadApp();
    const canonical = app.run("parseAddress('DV-K7M2-9QRT-X4WP')");
    assert.ok(canonical, 'a properly written address must be accepted');
    for (const written of ['dv-k7m2-9qrt-x4wp', 'K7M29QRTX4WP', ' DV K7M2 9QRT X4WP ', 'dv k7m29qrt x4wp']){
      assert.strictEqual(app.run(`parseAddress(${JSON.stringify(written)})`), canonical,
        `"${written}" should read as the same address`);
    }
    app.stop();
  });

  test('nonsense is refused rather than half-accepted', () => {
    const app = loadApp();
    for (const bad of ['', 'ciao', 'DV-K7M2-9QRT', 'K7M29QRTX4W', 'K7M29QRTX4WPX']){
      assert.strictEqual(app.run(`parseAddress(${JSON.stringify(bad)})`), null,
        `"${bad}" must not be accepted as an address`);
    }
    app.stop();
  });

  test('what is shown can be read back', () => {
    const app = loadApp();
    const shown = app.run("formatAddress('K7M29QRTX4WP')");
    assert.match(shown, /^DV-/, 'an address is shown with its DV- prefix');
    assert.strictEqual(app.run(`parseAddress(${JSON.stringify(shown)})`), 'K7M29QRTX4WP',
      'an address copied off the screen must go back in');
    app.stop();
  });
});

/* ------------------------------------------------------------------------
   Telling a working connection from a dead one. Getting this wrong printed
   "the connection failed" over a conversation that was running perfectly.
   ------------------------------------------------------------------------ */
test.describe('judging a connection', () => {

  test('a connected one with an open channel is working', () => {
    const app = loadApp();
    app.run('var probe = new RTCPeerConnection(); probe.connectionState = "connected"; probe.__dc = { readyState: "open" };');
    assert.strictEqual(app.run('connectionWorking(probe)'), true);
    app.stop();
  });

  test('a brand new one is not yet working', () => {
    const app = loadApp();
    app.run('var probe = new RTCPeerConnection();');
    assert.strictEqual(!!app.run('connectionWorking(probe)'), false);
    app.stop();
  });

  test('it judges the connection it was handed, not whatever is global', () => {
    /* the exact fault: one attempt failing printed its error over a different
       attempt that had actually succeeded */
    const app = loadApp();
    app.run('dc = { readyState: "open" };');
    app.run('var dead = new RTCPeerConnection(); dead.connectionState = "failed"; dead.__dc = { readyState: "closed" };');
    assert.strictEqual(!!app.run('connectionWorking(dead)'), false,
      'a dead connection must not look alive because some other one is');
    app.stop();
  });
});

/* ------------------------------------------------------------------------
   Which phone this is. Wrong answers here send somebody looking for a
   padlock that does not exist on their screen.
   ------------------------------------------------------------------------ */
test.describe('knowing the phone', () => {

  test('an installed Android app is not the same as Android in a browser', () => {
    const inBrowser = loadApp();
    assert.strictEqual(inBrowser.run('browserFamily()'), 'android',
      'in a browser it is plain Android');
    inBrowser.stop();

    /* loaded fresh rather than switched at runtime: a phone does not change
       its mind about being an installed app halfway through */
    const installed = loadApp({ standalone: true });
    assert.strictEqual(installed.run('browserFamily()'), 'android-app',
      'installed on the Home screen there is no address bar, so no padlock to tap');
    installed.stop();
  });
});

/* ------------------------------------------------------------------------
   The health card has to report what is true, including when the truth is
   "this copy of the app cannot work from here".
   ------------------------------------------------------------------------ */
test.describe('the app describing itself', () => {

  test('it refuses to pretend an unrecognised origin is fine', async () => {
    const app = loadApp();
    app.sandbox.location.origin = 'http://127.0.0.1:8934';
    const verdict = await app.run('brokerAlive()');
    assert.strictEqual(verdict, 'origin',
      'served from somewhere the Worker refuses, it must say so rather than blame the network');
    app.stop();
  });

  test('the report carries nothing about who anyone talks to', () => {
    const app = loadApp();
    app.run('healthRows = [["ok","Chi ha il tuo indirizzo","Ti puo chiamare adesso."]];');
    const report = app.run('healthReport()');
    assert.ok(report.includes('logos-modifica'), 'the version is what makes a report useful');
    assert.ok(!/DV-[A-Z0-9]{4}/.test(report), 'no address may appear in a report meant to be pasted to a stranger');
    app.stop();
  });
});
