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
   Findings from the August 2026 audit. Each of these was a real behaviour of
   the shipped app, proved by running it, before it was fixed — so each test
   here is the exact experiment that caught it.
   ------------------------------------------------------------------------ */
test.describe('what the audit found', () => {

  test('self-destruct actually destroys, instead of only clearing the screen', () => {
    /* It used to say "conversation self-destructed" while a full copy stayed
       in storage and came back the next time the same person connected. */
    const app = loadApp();
    app.run('peerNick = "Maria"; renderMsg("un segreto", true);');
    assert.ok(app.run('(localStorage.getItem("dvlogos-history-maria")||"").length') > 0,
      'the message should have been saved in the first place');
    app.run('destroyNow(false);');
    assert.strictEqual(app.run('(localStorage.getItem("dvlogos-history-maria")||"").length'), 0,
      'saying it self-destructed while keeping a copy is the one lie this app must not tell');
    app.stop();
  });

  test('nothing is written to the phone at all while the timer is running', () => {
    const app = loadApp();
    app.run('peerNick = "Giulia"; destructArmed = true; renderMsg("detto sotto il timer", true);');
    assert.strictEqual(app.run('(localStorage.getItem("dvlogos-history-giulia")||"").length'), 0,
      'writing it and deleting it later is not the same as never writing it');
    app.stop();
  });

  test('a peer that sends more than it declared is cut off', () => {
    /* declared ten bytes, then pushed megabytes: every chunk was accepted */
    const app = loadApp();
    app.run(`onDcMessage({ data: JSON.stringify({ type:'file-start', id:'x', name:'a', mime:'', size: 10 }) });`);
    app.run(`
      var big = new Uint8Array(16 + 4096);
      big.set(new TextEncoder().encode('x'.padEnd(16,' ')), 0);
      for (var i = 0; i < 50; i++) onDcMessage({ data: big.buffer });
    `);
    assert.strictEqual(app.run('incoming["x"] ? 1 : 0'), 0,
      'a transfer that overruns what it promised must be abandoned, not accumulated');
    app.stop();
  });

  test('a peer cannot open unlimited transfers and never finish them', () => {
    const app = loadApp();
    app.run(`for (var i = 0; i < 500; i++) onDcMessage({ data: JSON.stringify({ type:'file-start', id:'f'+i, name:'x', mime:'', size:1 }) });`);
    const open = app.run('Object.keys(incoming).length');
    assert.ok(open <= 20, `unbounded open transfers exhaust the phone's memory (found ${open})`);
    app.stop();
  });

  test('sending is refused while the other side is not who they were', () => {
    /* the app said "this may be somebody stepping into the middle" and then
       let the conversation carry on regardless.
       Tested through the buttons a person actually presses, not through the
       helper they call: a check nothing consults is not a check. */
    const app = loadApp();
    app.run('var sent = 0; dc = { readyState: "open", send: function(){ sent++; } };');
    app.run('$("msgInput").value = "un messaggio";');

    app.run('safetyState = "changed";');
    app.run('sendText();');
    assert.strictEqual(app.run('sent'), 0, 'nothing may leave while the identity is in doubt');

    app.run('safetyState = "ok"; $("msgInput").value = "un messaggio";');
    app.run('sendText();');
    assert.strictEqual(app.run('sent'), 1, 'and it must send normally once it is not');
    app.stop();
  });

  test('history is filed under the certificate, not under a name anyone can claim', () => {
    /* Checked by behaviour: with a known peer certificate the conversation must
       land under a key derived from that certificate, and an impostor claiming
       the same name must not be handed it. */
    const app = loadApp();
    app.run('remoteFpHex = function(){ return "abc123"; };');
    app.run('peerNick = "Maria"; renderMsg("solo per la vera Maria", true);');
    const underFingerprint = app.run('(localStorage.getItem("dvlogos-history-fp-abc123")||"").length');
    const underName = app.run('(localStorage.getItem("dvlogos-history-maria")||"").length');
    assert.ok(underFingerprint > 0, 'the conversation should be filed under the certificate');
    assert.strictEqual(underName, 0, 'filing it under the name hands it to anyone who claims the name');

    /* an impostor: same name, different device */
    app.run('remoteFpHex = function(){ return "999impostore"; };');
    app.run('safetyState = "new"; loadHistoryFor("Maria");');
    assert.ok(!app.run('$("msgs").textContent').includes('solo per la vera Maria'),
      'somebody else claiming the name must not be shown the real one\'s conversation');
    app.stop();
  });

  test('turning notifications on after the address republishes it', async () => {
    /* publishAddress() refuses to write anything while notifications are off
       — there is no subscription yet. The natural order is address first,
       then this switch, and nothing used to redo that write once a
       subscription existed: whoever dialled the address in between knocked at
       a door that had never left word of where it lived, until the app
       happened to be closed and reopened. */
    const app = loadApp();
    /* Module load fires off its own async work (paintAddrCard and friends) that
       is still settling at this point. The first version of this test stubbed
       publishAddress() immediately and passed even against the unfixed code —
       one of those still-pending calls resolved into the stub by coincidence
       of timing and called it anyway, which is not the same as the click
       handler having called it. Letting things settle first closes that gap. */
    await app.run('new Promise(r => setTimeout(r, 20))');
    app.run(`
      setAddrOn(true);
      window.enableNotifications = async function(){ return true; };
      window.__published = 0;
      window.publishAddress = async function(){ window.__published++; return true; };
    `);
    /* invoked directly rather than through .click(), so the real promise the
       listener returns can be awaited from the Node side instead of racing it */
    await app.run(`$('notifyRow').listeners.click[0]()`);
    assert.ok(app.run('window.__published') >= 1,
      'the address must be republished once a subscription actually exists');
    app.stop();
  });

  test('reconnecting to a known contact hides the create-a-new-invite controls', () => {
    /* Tapping a contact reused the manual-invite screen for its status line
       and left everything else on it visible too: a passphrase toggle, a
       "prepare the invite" button, a box to paste a code that was never
       coming. All of it looked like something to do while the real work
       already happening quietly underneath. */
    const app = loadApp();
    app.run(`
      window.tryAutoReconnect = async function(){};
      saveContacts([{ nick: 'Giuseppe', fp: 'aa'.repeat(32), lastSeen: Date.now() }]);
      /* the fake DOM's closest() is a stub — a real click bubbling from a
         child would resolve it properly, so a hand-built target reproduces
         exactly what the handler receives without needing that machinery */
      window.__row = document.createElement('div');
      window.__row.setAttribute('data-nick', 'Giuseppe');
    `);
    app.run(`
      $('contactsList').listeners.click[0]({ target: {
        closest: sel => sel === '[data-rm]' ? null : sel === '.contactrow' ? window.__row : null
      } });
    `);
    assert.strictEqual(app.run("$('manualInviteCard').classList.contains('hide')"), true,
      '"Protezione extra" and "Prepara l\'invito" have nothing to do with reconnecting');
    assert.strictEqual(app.run("$('pasteAnswerForm').classList.contains('hide')"), true,
      'nothing was ever going to arrive to paste');
    assert.strictEqual(app.run("$('pasteAnswerCard').classList.contains('hide')"), false,
      'the status line the reconnect actually writes to must stay visible');
    app.stop();
  });

  test('the Worker meters writes, not only reads', () => {
    const worker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');
    assert.ok(!/request\.method === 'GET' && overRateLimit/.test(worker),
      'an unmetered write lets anyone holding an address bury the calls meant for it');
    assert.ok(/if \(overRateLimit\(request\)\)/.test(worker), 'the mailbox no longer meters at all');
  });

  test('the Worker meters the credentials route too', () => {
    /* The only route that spends money when abused, and the only one that
       had no limit at all: credentials handed out here are usable for a day
       of real relay capacity, billed to this account. */
    const worker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');
    const turnRoute = worker.slice(worker.indexOf("url.pathname === '/turn'"));
    const untilNextRoute = turnRoute.slice(0, turnRoute.indexOf('mailbox'));
    assert.match(untilNextRoute, /overTurnLimit\(request\)/,
      'harvesting TURN credentials must cost the harvester something');
    assert.match(worker, /RL_TURN_MAX\s*=\s*\d+/, 'the credentials budget is gone');
  });

  test('the credentials budget is tighter than the mailbox budget', () => {
    /* They exist for opposite reasons: a mailbox poll happens ~150 times per
       honest connection, credentials once per page load. Sharing one number
       would mean either starving the first or leaving the second wide open. */
    const worker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');
    const mail = Number((worker.match(/RL_MAX_LOOKUPS\s*=\s*(\d+)/) || [])[1]);
    const turn = Number((worker.match(/RL_TURN_MAX\s*=\s*(\d+)/) || [])[1]);
    assert.ok(mail > 0 && turn > 0, 'both budgets must be set');
    assert.ok(turn < mail, `credentials (${turn}) should be metered tighter than lookups (${mail})`);
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
