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

  test('reconnecting to a contact is refused while another attempt is already in flight', () => {
    /* $('contactsList') was the one route into tryAutoReconnect that never
       asked busyWithSomeone() first — tapping a contact while, say, a call
       was already up silently tore the working connection down to start a
       new one. goStart/goJoin already ask; this route has to as well. */
    const app = loadApp();
    app.run(`
      var reconnectCalled = false;
      window.tryAutoReconnect = async function(){ reconnectCalled = true; };
      saveContacts([{ nick: 'Giuseppe', fp: 'aa'.repeat(32), lastSeen: Date.now() }]);
      window.__row = document.createElement('div');
      window.__row.setAttribute('data-nick', 'Giuseppe');
      dc = { readyState: 'open' };
    `);
    app.run(`
      $('contactsList').listeners.click[0]({ target: {
        closest: sel => sel === '[data-rm]' ? null : sel === '.contactrow' ? window.__row : null
      } });
    `);
    assert.strictEqual(app.run('reconnectCalled'), false,
      'tapping a contact while something else holds the connection open must not tear it down');
    app.stop();
  });

  test('pasting a reply into a manual invite is refused once something else replaced the connection', () => {
    /* btnConnectAsA had nothing standing between it and applying a pasted
       answer but "if (!pc) return" — any route that replaced the global pc
       in between (a contact tap, an address auto-accept) left this button
       still willing to apply the reply, just to the wrong connection.
       manualInvitePc is the fix: it must refuse unless pc is still exactly
       the connection this invite was created for. */
    const app = loadApp();
    app.run(`
      manualInvitePc = new RTCPeerConnection();
      pc = new RTCPeerConnection();   /* something else replaced it */
      pc.applied = null;
      pc.setRemoteDescription = function(d){ this.applied = d; return Promise.resolve(); };
      $('answerIn').value = b64encode(JSON.stringify({ type: 'answer', sdp: 'v=0 not-for-this-connection' }));
    `);
    app.run("$('btnConnectAsA').listeners.click[0]();");
    assert.strictEqual(app.run('pc.applied'), null,
      'a pasted answer must never be applied to a connection other than the one the invite was created for');
    app.stop();
  });

  test('a dropped connection offers a direct way back, not just a hidden menu', () => {
    /* Before this, the only way out of a dead chat was finding "..." and then
       "Termina chat" — two taps behind a menu nobody thinks to open while
       staring at a conversation that stopped working. The fix puts the same
       exit right in the system message itself. */
    const app = loadApp();
    app.run(`
      $('screenChat').classList.remove('hide');
      pc = { close(){}, ontrack: null };
      window.__fakeChannel = { binaryType: '', send(){}, close(){}, addEventListener(){} };
      wireDataChannel(__fakeChannel);
    `);
    app.run('__fakeChannel.onclose();');
    const structure = JSON.parse(app.run(`
      JSON.stringify((() => {
        const line = $('msgs').children[$('msgs').children.length - 1];
        const btn = line.children[1];
        return { className: line.className, text: line.children[0].textContent,
          btnText: btn ? btn.textContent : null, btnTag: btn ? btn.tagName : null };
      })())
    `));
    assert.strictEqual(structure.className, 'sysline');
    assert.ok(!/riapri l'app/.test(structure.text),
      'should not tell people to reopen the app now that a real button does the job');
    assert.strictEqual(structure.btnText, 'Torna alla home');
    assert.strictEqual(structure.btnTag, 'BUTTON');
    /* the button must actually work, not just look like it does */
    app.run(`
      $('msgs').children[$('msgs').children.length - 1].children[1].listeners.click[0]();
    `);
    assert.strictEqual(app.run("$('screenChat').classList.contains('hide')"), true,
      'the button did not take the person back out of the dead chat');
    assert.strictEqual(app.run("$('screenHome').classList.contains('hide')"), false,
      'the button did not land on the home screen, where the next attempt actually starts');
    app.stop();
  });

  test('calling a saved permanent address is remembered, so the next call is one tap', () => {
    /* Before this, a contact record only ever held a fingerprint — useful for
       reconnecting to someone you had already talked to, but useless for
       calling a permanent address again unless it was still written down
       somewhere else. dialedAddress is only ever non-null here because the
       'hello' really did arrive over a connection dialAddress() itself
       opened and proved (see the comment by dialedAddrProven) — nothing
       about this test skips that proof, it just supplies its result. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection();
      dialedAddress = 'DV-AAAA-BBBB-CCCC';
      onDcMessage({ data: JSON.stringify({ type: 'hello', nick: 'Marco', fp: 'abc123' }) });
    `);
    const saved = JSON.parse(app.run('JSON.stringify(loadContacts())'));
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].nick, 'Marco');
    assert.strictEqual(saved[0].addr, 'DV-AAAA-BBBB-CCCC',
      'the address that was actually dialled and proven was not kept on the contact');
    /* that first call is over — same as hanging up — before trying the next
       one, otherwise busyWithSomeone() sees the still-open connection from
       above and refuses to start a second one, same as it would for real */
    app.run('pc = null;');
    /* tapping the saved contact afterwards must call that same address
       directly, not fall back to the fingerprint-reconnect path — a stub
       stands in for dialAddress so this checks what was called, not how the
       real call behaves (that path already has its own coverage) */
    app.run(`
      window.__dialedWith = null;
      dialAddress = function(a){ window.__dialedWith = a; };
    `);
    app.run(`
      $('contactsList').listeners.click[0]({
        target: { closest: sel => sel === '.contactrow' ? { getAttribute: () => 'Marco' } : null },
      });
    `);
    assert.strictEqual(app.run('window.__dialedWith'), 'DV-AAAA-BBBB-CCCC',
      'tapping a contact with a saved address must call that address, not start a fresh invite');
    app.stop();
  });

  test('a contact known two ways keeps both, instead of the second overwriting the first', () => {
    /* Someone reconnected to by invite (fingerprint only) and someone reached
       by dialling their address are not different people the second time
       they turn out to be the same nick — the record has to gain the address
       without losing the fingerprint it already had. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection();
      onDcMessage({ data: JSON.stringify({ type: 'hello', nick: 'Marco', fp: 'abc123' }) });
      dialedAddress = 'DV-AAAA-BBBB-CCCC';
      onDcMessage({ data: JSON.stringify({ type: 'hello', nick: 'Marco', fp: 'abc123' }) });
    `);
    const saved = JSON.parse(app.run('JSON.stringify(loadContacts())'));
    assert.strictEqual(saved.length, 1, 'the same person by nick must stay one contact, not become two');
    assert.strictEqual(saved[0].fp, 'abc123', 'the fingerprint learned the first time must not be lost');
    assert.strictEqual(saved[0].addr, 'DV-AAAA-BBBB-CCCC', 'the address learned the second time must be kept');
    /* and the other order matters just as much: a later reconnect that
       happens to arrive by invite rather than by dialling the address again
       carries no address of its own (dialedAddress is only ever set inside
       dialAddress()) — that must not read as "the address is gone now" and
       silently erase what an earlier call already proved. */
    app.run(`
      dialedAddress = null;
      onDcMessage({ data: JSON.stringify({ type: 'hello', nick: 'Marco', fp: 'abc123' }) });
    `);
    const savedAgain = JSON.parse(app.run('JSON.stringify(loadContacts())'));
    assert.strictEqual(savedAgain.length, 1);
    assert.strictEqual(savedAgain[0].addr, 'DV-AAAA-BBBB-CCCC',
      'a reconnect with no address of its own must not erase the address already on file');
    app.stop();
  });

  test('the simple-mode hint offers to turn it on right there, not just in settings', () => {
    /* The setting has existed for a while inside Impostazioni, reachable only
       by someone already comfortable enough to go looking for it — backwards
       from who it is actually for. This checks the home-screen offer exists
       by default, and that accepting it both turns the setting on for real
       and never asks again. */
    const app = loadApp();
    assert.strictEqual(app.run("$('easyHintBar').classList.contains('hide')"), false,
      'a fresh install with simple mode off should be offered the hint');
    app.run("$('easyHintBtn').listeners.click[0]();");
    assert.strictEqual(app.run('easyPref()'), true,
      'accepting the hint must actually turn simple mode on, not just hide the banner');
    assert.strictEqual(app.run("$('easyHintBar').classList.contains('hide')"), true);
    assert.strictEqual(app.run("$('easyRow').classList.contains('on')"), true,
      'the settings toggle itself must reflect it too, not just localStorage');
    app.stop();
  });

  test('closing the simple-mode hint without accepting it does not turn simple mode on', () => {
    const app = loadApp();
    app.run("$('easyHintClose').listeners.click[0]();");
    assert.strictEqual(app.run("$('easyHintBar').classList.contains('hide')"), true);
    assert.strictEqual(app.run('easyPref()'), false,
      'dismissing the hint must not be mistaken for accepting it');
    app.stop();
  });

  test('the simple-mode hint does not pile up on top of the install banner', () => {
    /* Both live in the same quiet strip on the home screen, on purpose — two
       notices stacked there at once would be exactly the stare that strip
       was designed to avoid (see the comment above it in modifica.html).
       The install banner can legitimately show up *after* the hint already
       has — beforeinstallprompt is an event that can fire well after the
       page finished loading — so the hint being first is not enough on its
       own; the install banner has to actively yield the spot back too. */
    const app = loadApp();
    assert.strictEqual(app.run("$('easyHintBar').classList.contains('hide')"), false,
      'sanity check: the hint should already be showing at this point, same as any fresh load');
    app.run("showInstallBar('test', false);");
    assert.strictEqual(app.run("$('easyHintBar').classList.contains('hide')"), true,
      'the install banner arriving later must take back the spot from the simple-mode hint');
    app.stop();
  });

  test('a message that arrives while looking at settings lights up a notice', () => {
    /* The connection already survives a trip to Impostazioni mid-conversation
       (settingsCameFrom exists for exactly that) — what was missing was any
       sign that something had actually happened there while away. */
    const app = loadApp();
    app.run(`
      $('screenChat').classList.add('hide');
      $('screenSettings').classList.remove('hide');
      onDcMessage({ data: JSON.stringify({ type: 'text', text: 'ciao' }) });
    `);
    assert.strictEqual(app.run("$('settingsNotice').classList.contains('hide')"), false,
      'a message arriving while the chat is not on screen should light up the notice');
    app.run("showScreen('screenChat');");
    assert.strictEqual(app.run("$('settingsNotice').classList.contains('hide')"), true,
      'going back to the chat must clear the notice, not leave it lit forever');
    app.stop();
  });

  test('a message that arrives while already looking at the chat does not light up the notice', () => {
    const app = loadApp();
    app.run(`
      $('screenChat').classList.remove('hide');
      onDcMessage({ data: JSON.stringify({ type: 'text', text: 'ciao' }) });
    `);
    assert.strictEqual(app.run("$('settingsNotice').classList.contains('hide')"), true,
      'the notice exists to say "something happened while you were elsewhere" — it must stay off when you were already looking');
    app.stop();
  });

  test('a file send that fails mid-transfer tells the sender, instead of vanishing silently', () => {
    /* Used to render nothing at all until the whole loop finished, so a
       channel that threw partway left no error, no bubble, no sign anything
       had gone wrong. A progress bubble now appears the moment the transfer
       starts (see the next test) — the guarantee that matters here is no
       longer "nothing appeared", it is "whatever appeared never claims the
       file actually arrived". */
    const app = loadApp();
    app.run(`
      dc = { readyState: 'open', send: function(){ throw new Error('channel closed'); } };
      sendFile({ name: 'x.txt', type: 'text/plain', size: 3 });
    `);
    const bubbleHtml = app.run("$('msgs').children[$('msgs').children.length - 1].children[0].innerHTML");
    assert.ok(!/filelink|<img|<video|<audio/.test(bubbleHtml),
      'a failed send must not claim the file was delivered');
    assert.ok(bubbleHtml.includes(app.run("t('file.sendFailed')")),
      'the bubble itself must say the send failed, not just a toast that can be missed');
    app.stop();
  });

  test('a file transfer shows progress instead of nothing until it finishes', () => {
    /* A large file used to render no sign of life until it was entirely sent —
       visually identical to having silently died. The bubble must exist from
       the first chunk, and the bar must actually reach 100% by the last one
       rather than stopping wherever the last throttled repaint happened to
       land. */
    const app = loadApp();
    /* The fake DOM's own Blob is a two-line stand-in with no real slice() or
       arrayBuffer() — and sendFile's success path ends by handing the file to
       the real URL.createObjectURL (window.URL is Node's own, not the fake
       one), which refuses anything that is not a genuine Blob instance. So a
       real one is built here, in this file's realm, and handed across —
       nothing before this test ever drove sendFile as far as that line. */
    /* application/pdf on purpose: image/video/audio each get their own inline
       preview, and the one this test means to reach — a plain download link —
       is what everything else falls through to. */
    const realFile = new Blob(['x'.repeat(40000)], { type: 'application/pdf' });
    realFile.name = 'documento.pdf';
    app.sandbox.__realFile = realFile;
    /* Reading the bar mid-transfer from outside is a timing gamble — the file
       is small and everything here is local, so it can finish before a test
       ever gets a turn to look. Caught by sabotaging paint() during writing:
       the earlier version of this test still passed with it disabled, because
       it only checked that the bar *existed*, never that it actually moved.
       Deterministic instead: the fake send() itself grabs a snapshot the
       instant 'file-end' goes out — which in the real code happens right
       after the loop's last, forced repaint and right before finish()
       overwrites the bubble — so what it captures is exactly the state the
       last chunk left behind, not a guess about scheduling. */
    app.run(`
      window.__capturedWidth = null; window.__capturedMeta = null;
      dc = { readyState: 'open', send: function(x){
        if (typeof x !== 'string') return;
        let m; try{ m = JSON.parse(x); }catch(e){ return; }
        if (m.type !== 'file-end') return;
        const bub = $('msgs').children[$('msgs').children.length - 1].children[0];
        window.__capturedWidth = bub.children[1].children[0].style.width;
        window.__capturedMeta = bub.children[2].textContent;
      } };
      window.__p = sendFile(__realFile);
    `);
    /* The fake DOM's innerHTML is only ever what was last assigned to it as a
       string — it does not serialise children added with appendChild, unlike
       a real browser. renderTransferBubble builds the "during" state from
       real nodes on purpose (see its own comment), so the bubble structure is
       inspected directly here rather than pattern-matched out of innerHTML. */
    const duringClasses = app.run(
      "$('msgs').children[$('msgs').children.length - 1].children[0].children.map(c => c.className)"
    );
    assert.ok(duringClasses.includes('xferbar'), 'no progress bar appeared once the transfer began: ' + duringClasses);
    const duringName = app.run(
      "$('msgs').children[$('msgs').children.length - 1].children[0].children[0].children[1].textContent"
    );
    assert.strictEqual(duringName, 'documento.pdf', 'the filename is not shown while it sends');
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('window.__capturedWidth'), '100%',
        'the bar never actually reached 100% before the file was marked sent');
      assert.ok(!/^0 B/.test(app.run('window.__capturedMeta')),
        'the progress label was still showing zero right before the file finished');
      const finalHtml = app.run("$('msgs').children[$('msgs').children.length - 1].children[0].innerHTML");
      assert.ok(!/xferbar/.test(finalHtml), 'the progress bar must be gone once the file is fully sent');
      assert.ok(/filelink/.test(finalHtml), 'a completed generic file must show the real download link');
      app.stop();
    });
  });

  test('several files picked or dropped at once are sent one at a time, in order', () => {
    /* Selecting or dropping thirty files used to mean pressing the send
       button thirty times — technically possible, never actually done. The
       real risk in fixing that is sending them in parallel instead: several
       progress bars updating out of sync, chunks from different files
       interleaved on the same channel for no benefit. This checks the
       ordering property directly — every file's file-end must be seen before
       the next file's file-start — rather than just that all three arrived. */
    const app = loadApp();
    const files = ['a.txt', 'b.txt', 'c.txt'].map(name => {
      const f = new Blob(['x'.repeat(20000)], { type: 'text/plain' });
      f.name = name;
      return f;
    });
    app.sandbox.__queueFiles = files;
    app.run(`
      window.__log = [];
      dc = { readyState: 'open', send: function(x){
        if (typeof x !== 'string') return;
        let m; try{ m = JSON.parse(x); }catch(e){ return; }
        if (m.type === 'file-start') window.__log.push('start:' + m.name);
        if (m.type === 'file-end') window.__log.push('end');
      } };
      window.__p = sendFilesQueue(__queueFiles);
    `);
    return app.run('window.__p').then(() => {
      /* JSON round-trip, not the cross-realm array directly: it holds the
         same values but deepStrictEqual also checks the constructor, and an
         Array built inside the sandbox's own realm is not === the calling
         context's Array even when every element matches. */
      assert.deepStrictEqual(JSON.parse(app.run('JSON.stringify(window.__log)')), [
        'start:a.txt', 'end', 'start:b.txt', 'end', 'start:c.txt', 'end',
      ], 'files were not sent strictly one after another, in the order given');
      app.stop();
    });
  });

  function fakeShareCache(app, entries){
    /* Mirrors what the real service worker leaves behind: a Cache whose keys
       are the shared files' URLs and whose responses carry the file's bytes
       and MIME type. A File constructor is added here too — nothing in the
       rest of this suite has needed one, since sendFile/sendFilesQueue only
       ever require a Blob-shaped object with a name on it, but the app's own
       share-recovery code calls `new File(...)` directly on what it reads
       back out of the cache. */
    app.sandbox.File = File;
    app.sandbox.__shareEntries = entries;
    app.run(`
      window.__shareStore = new Map(__shareEntries.map(function(e){ return [e.url, e]; }));
      window.caches = {
        open: function(){ return Promise.resolve({
          keys: function(){ return Promise.resolve(Array.from(window.__shareStore.keys()).map(function(u){ return { url: u }; })); },
          match: function(req){
            const e = window.__shareStore.get(req.url);
            if (!e) return Promise.resolve(undefined);
            return Promise.resolve({ blob: function(){ return Promise.resolve(e.blob); },
              headers: { get: function(k){ return k === 'Content-Type' ? e.type : null; } } });
          },
          delete: function(req){ window.__shareStore.delete(req.url); return Promise.resolve(true); },
        }); },
      };
    `);
  }

  test('a file shared in from another app waits if nobody is connected yet, instead of vanishing', () => {
    const app = loadApp();
    fakeShareCache(app, [
      { url: 'https://x/__shared/1/nota.txt', blob: new Blob(['ciao']), type: 'text/plain' },
    ]);
    app.run(`location.search = '?shared=1'; window.__p = checkForSharedFiles();`);
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('pendingSharedFiles.length'), 1,
        'a file shared in with no active chat should be held, not dropped');
      assert.strictEqual(app.run('pendingSharedFiles[0].name'), 'nota.txt',
        'the file lost its original name on the way out of the cache');
      /* The app calls history.replaceState() to drop ?shared=1 from the URL so a
         later reload can't re-import the same file — this fake DOM's
         replaceState is a no-op that never writes back to location, so that
         part is proven live in a real browser instead (verified separately),
         not here. */
      app.stop();
    });
  });

  test('a file shared in while a chat is already open goes straight out, not into the waiting pile', () => {
    const app = loadApp();
    fakeShareCache(app, [
      { url: 'https://x/__shared/1/foto.jpg', blob: new Blob(['x']), type: 'image/jpeg' },
    ]);
    app.run(`
      window.__sent = [];
      dc = { readyState: 'open', send: function(x){
        if (typeof x !== 'string') return;
        let m; try{ m = JSON.parse(x); }catch(e){ return; }
        if (m.type === 'file-start') window.__sent.push(m.name);
      } };
      location.search = '?shared=1';
      window.__p = checkForSharedFiles();
    `);
    return app.run('window.__p').then(() => {
      assert.deepStrictEqual(JSON.parse(app.run('JSON.stringify(window.__sent)')), ['foto.jpg'],
        'a file shared in mid-chat should be sent immediately, not left waiting for a connection that already exists');
      assert.strictEqual(app.run('pendingSharedFiles.length'), 0,
        'the file was sent, so it must not still be sitting in the waiting pile');
      app.stop();
    });
  });

  test('the code stretch and the connection are built at the same time, not one after the other', () => {
    /* Stretching a six-digit code is 100,000 rounds of PBKDF2 — a few hundred
       milliseconds on a laptop, one to two seconds on a cheap phone — and
       building the connection is a network round trip for relay credentials.
       Neither needs anything from the other, but they used to run end to end,
       and on this side the connection was only built *after* the offer had
       been found, with the other phone already up and waiting.
       Checked by order rather than by clock: both are kicked off before the
       first await, so if they really overlap the connection has already
       started while the stretch is still in flight. Run sequentially the
       second entry simply never appears. */
    const app = loadApp();
    app.run(`
      window.__order = [];
      quickSecrets = function(){
        window.__order.push('stretch-start');
        return new Promise(r => setTimeout(() => {
          window.__order.push('stretch-end');
          r({ key: {}, seed: 'deadbeef' });
        }, 50));
      };
      newPeerConnection = function(){
        window.__order.push('conn-start');
        return Promise.resolve(new RTCPeerConnection());
      };
      $('screenChat').classList.add('hide');   /* the harness builds elements bare, and a visible chat aborts early by design */
      $('quickCodeIn').value = '123456';
      tryQuickConnect();
    `);
    assert.deepStrictEqual(JSON.parse(app.run('JSON.stringify(window.__order)')),
      ['stretch-start', 'conn-start'],
      'the connection is not under way while the code is still being stretched — the two delays still run end to end');
    app.stop();
  });

  test('two connections starting together ask for relay credentials once, not twice', () => {
    /* Relay credentials are the only thing on this Worker that costs real
       money, and the route is metered far more tightly than the mailbox. The
       cache only ever held the finished answer, so two callers arriving
       together — which is now the normal case, with the screen warming this up
       just before a connection asks for it — both found it empty and both
       fired their own request. */
    const app = loadApp();
    app.sandbox.AbortController = AbortController;   /* the harness has no fetch to abort, so it carries no controller either */
    app.run(`
      window.__asked = 0;
      fetch = function(){
        window.__asked++;
        return new Promise(r => setTimeout(() => r({
          ok: true, json: () => Promise.resolve({ iceServers: [{ urls: 'turn:example' }] }),
        }), 20));
      };
      window.__both = Promise.all([fetchIceServers(), fetchIceServers()]);
    `);
    return app.run('window.__both').then(() => {
      assert.strictEqual(app.run('window.__asked'), 1,
        'the credentials were fetched more than once for two callers that arrived together');
      app.stop();
    });
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

  test('every attempt that creates a connection notices being superseded', () => {
    /* Each of these creates a connection, then waits — for a description, for
       candidates, for the mailbox — and afterwards published `pc.localDescription`,
       the global. Anything the person did meanwhile (tapping a contact,
       answering a second call) replaced that global underneath, so the answer
       for one attempt was built from a different connection and broke both.
       Only two of the eight guarded against it. */
    for (const fn of ['acceptAddrCall', 'tryAutoReconnect', 'acceptIncomingAutoOffer',
                      'tryQuickConnect', 'dialAddress', 'startQuickShare']){
      const start = SOURCE.indexOf(`async function ${fn}(`);
      assert.ok(start > 0, `${fn} not found`);
      const body = SOURCE.slice(start, SOURCE.indexOf('\n}\n', start));
      assert.match(body, /myPc/,
        `${fn} does not hold its own connection and can publish another one's description`);
      assert.ok(!/\bpc\.localDescription\b/.test(body),
        `${fn} still reads the global pc.localDescription after awaiting`);
    }
  });

  test('blob URLs are released when the messages holding them go', () => {
    /* Every photo and file made one, nothing ever released them, and the
       browser keeps the whole blob alive for as long as the URL exists — on a
       phone, a long photo-heavy chat ended as a dead tab. */
    assert.match(SOURCE, /function releaseObjectUrls/, 'nothing releases them');
    assert.ok(!/[^p]URL\.createObjectURL/.test(SOURCE.replace(/keepObjectUrl\(URL\.createObjectURL/g, 'keepObjectUrl(X')),
      'a blob URL is being created without being registered for release');
    const destroy = SOURCE.slice(SOURCE.indexOf('function destroyNow'));
    assert.match(destroy.slice(0, destroy.indexOf('\n}\n')), /releaseObjectUrls\(\)/,
      'self-destruct must not leave the photos it destroyed alive in memory');
  });

  test('the knock only reaches real push services', () => {
    /* Without this the route would POST to any https address on request:
       little to steal, but this Worker could be pointed at a stranger's
       server with the requests appearing to come from Cloudflare. */
    const worker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');
    assert.match(worker, /isKnownPushHost/, 'any host is still accepted');
    /* the classic mistake this must not make */
    assert.ok(!/includes\(\s*['"]googleapis/.test(worker),
      'a substring match would accept fcm.googleapis.com.attacker.example');
    assert.match(worker, /endsWith\(s\)/, 'suffixes must be anchored to the end of the host');
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
