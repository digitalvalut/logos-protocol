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
    /* La domanda dev'essere fatta SUBITO, non da qualche parte più in basso —
       ma "subito" non vuol dire "prima riga": checkInboxOnce ha acquisito una
       guardia di rientro che deve venire prima, altrimenti due passate
       sovrapposte chiedono entrambe e proseguono entrambe. Il vincolo che
       conta è che nessuna richiesta parta prima della domanda, quindi si
       guardano le prime righe invece di una sola. */
    for (const fn of ['addrCheckOnce', 'checkInboxOnce']){
      const at = SOURCE.indexOf(`async function ${fn}()`);
      assert.ok(at > 0, `${fn} non trovata`);
      const primeRighe = SOURCE.slice(at).split('\n').slice(1, 5).join('\n');
      assert.match(primeRighe, /if \(busyWithSomeone\(\)\) return;/,
        `${fn} non chiede più busyWithSomeone() fra le prime righe`);
    }
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

  /* ------------------------------------------------------------------
     The findings of the external review of 22 August 2026, each one turned
     into the test that would have caught it. Every one of these was verified
     by putting the original flaw back and watching it go red.
     ------------------------------------------------------------------ */

  test('a peer cannot make the three-word check disappear by sending a strange name', () => {
    /* msg.nick was the one field arriving from the other side that was never
       type-checked. `{}.trim()` threw, the throw took the rest of the 'hello'
       branch with it, and the safety check lives at the bottom of that branch
       — so a peer could skip verification entirely by sending a name that was
       not a string. Sending no name at all did the same thing more simply:
       the branch was guarded by `if (peerNick)`. */
    const app = loadApp();
    app.run(`
      window.__checked = 0;
      checkSafetyFor = function(){ window.__checked++; return Promise.resolve(); };
      showConnectedFlash = function(){ return Promise.resolve(); };
      pc = new RTCPeerConnection();
    `);
    app.run(`onDcMessage({ data: JSON.stringify({ type: 'hello', nick: {} }) });`);
    app.run(`onDcMessage({ data: JSON.stringify({ type: 'hello' }) });`);
    return new Promise(r => setTimeout(r, 0)).then(() => {
      assert.strictEqual(app.run('window.__checked'), 2,
        'verification must run whatever the other side calls itself — including when it sends no name, or a name that is not text');
      app.stop();
    });
  });

  test('a name arriving from the other side cannot be long enough to fill the phone', () => {
    const app = loadApp();
    app.run(`
      checkSafetyFor = function(){ return Promise.resolve(); };
      showConnectedFlash = function(){ return Promise.resolve(); };
      pc = new RTCPeerConnection();
      onDcMessage({ data: JSON.stringify({ type: 'hello', nick: 'x'.repeat(500000), fp: 'aa' }) });
    `);
    assert.ok(app.run('peerNick.length') <= 60,
      'an unbounded nick is written to localStorage and fills its quota, after which history and contacts fail to save in silence');
    app.stop();
  });

  test('a stranger claiming a name already in the address book does not take it over', () => {
    /* The safety records and the history were both moved off names and onto
       fingerprints long ago, for exactly this reason. The address book was
       left behind, and it was the worst place to leave it: overwriting the
       entry replaced the real person's fingerprint, wake-up subscription and
       callable address with the impostor's. */
    const app = loadApp();
    app.run(`touchContact('Mamma', 'fp-real', null, 'DV-AAAA-BBBB-CCCC');`);
    app.run(`touchContact('Mamma', 'fp-impostor', null, 'DV-ZZZZ-ZZZZ-ZZZZ');`);
    const saved = JSON.parse(app.run('JSON.stringify(loadContacts())'));
    const real = saved.filter(c => c.fp === 'fp-real');
    assert.strictEqual(real.length, 1, 'the real contact must survive');
    assert.strictEqual(real[0].nick, 'Mamma', 'the real contact must keep her own name');
    assert.strictEqual(real[0].addr, 'DV-AAAA-BBBB-CCCC',
      'her callable address must not have been replaced by the impostor\'s');
    assert.strictEqual(saved.length, 2, 'the newcomer belongs in the list too, under a name that says they are someone else');
    app.stop();
  });

  test('the same person reconnecting still updates their own entry rather than piling up copies', () => {
    const app = loadApp();
    app.run(`touchContact('Marco', 'fp-1', null, null);`);
    app.run(`touchContact('Marco', 'fp-1', null, 'DV-AAAA-BBBB-CCCC');`);
    const saved = JSON.parse(app.run('JSON.stringify(loadContacts())'));
    assert.strictEqual(saved.length, 1, 'one fingerprint is one person, however many times they call');
    assert.strictEqual(saved[0].addr, 'DV-AAAA-BBBB-CCCC');
    app.stop();
  });

  test('a file bigger than the other side will accept is refused here, not pushed into the void', () => {
    /* The receiving side has refused these in silence since August; this side
       never checked, so every byte went out, the bar reached 100%, and the
       preview appeared as if it had arrived. */
    const app = loadApp();
    app.run(`
      window.__sent = 0;
      dc = { readyState: 'open', send: function(){ window.__sent++; } };
      window.__p = sendFile({ name: 'enorme.mp4', size: MAX_INCOMING_BYTES + 1, type: 'video/mp4' });
    `);
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('window.__sent'), 0,
        'nothing at all should go on the wire for a file the far end is guaranteed to drop');
      app.stop();
    });
  });

  test('twenty transfers cannot add up to more memory than the phone has', () => {
    /* The per-transfer cap was the whole defence and multiplication went
       straight through it: twenty transfers of 512 MB each is ten gigabytes
       of chunks held in memory, which is not an error anyone can handle — the
       tab is simply killed. */
    const app = loadApp();
    app.run(`
      checkSafetyFor = function(){ return Promise.resolve(); };
      showConnectedFlash = function(){ return Promise.resolve(); };
      for (let i = 0; i < MAX_OPEN_TRANSFERS; i++){
        onDcMessage({ data: JSON.stringify({ type: 'file-start', id: 'id' + i, name: 'f' + i, size: MAX_INCOMING_BYTES }) });
      }
    `);
    const held = app.run(`(function(){ let n = 0; for (const k in incoming) n += incoming[k].cap; return n; })()`);
    assert.ok(held <= app.run('MAX_INCOMING_TOTAL'),
      'the sum of what all open transfers may hold must stay under one bound, not twenty separate ones');
    app.stop();
  });

  test('transfers that stall forever do not leave file receiving dead', () => {
    /* A record left `incoming` only by finishing or by overflowing. A peer
       that opened the maximum and then sent nothing made every later
       file-start be dropped in silence — receiving was over for the visit,
       with nothing on screen to say so. */
    const app = loadApp();
    app.run(`
      for (let i = 0; i < MAX_OPEN_TRANSFERS; i++){
        onDcMessage({ data: JSON.stringify({ type: 'file-start', id: 'z' + i, name: 'f', size: 10 }) });
      }
      for (const k in incoming) incoming[k].lastAt = Date.now() - (TRANSFER_IDLE_MS + 1000);
      onDcMessage({ data: JSON.stringify({ type: 'file-start', id: 'fresh', name: 'vero.jpg', size: 10 }) });
    `);
    assert.strictEqual(app.run("!!incoming['fresh']"), true,
      'a real file arriving after a peer wedged the table open must still be accepted');
    app.stop();
  });

  test('a half-arrived file is let go of when the conversation ends', () => {
    const app = loadApp();
    app.run(`
      onDcMessage({ data: JSON.stringify({ type: 'file-start', id: 'half', name: 'grande.mp4', size: 300000000 }) });
      endSession();
    `);
    assert.strictEqual(app.run('Object.keys(incoming).length'), 0,
      'chunks from an interrupted transfer stayed in memory for the rest of the visit, across every session after it');
    app.stop();
  });

  test('a link that vouches for itself no longer counts as having met in person', () => {
    /* The QR carried the sender's own fingerprint so the app could confirm the
       phone that answered was the one on the screen. But a QR and a tapped
       link arrive as the same URL — so anyone could write that parameter by
       hand, send it over WhatsApp, and have the app tell the person they had
       verified an impostor face to face. A check the attacker can satisfy
       about themselves prints a guarantee that is false. */
    const app = loadApp();
    app.run(`
      window.__sas = 0;
      showSasPanel = function(){ window.__sas++; return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      scannedFp = 'abcdef01';
      window.__p = checkSafetyFor('Marco');
    `);
    return app.run('window.__p').then(() => {
      assert.notStrictEqual(app.run('safetyState'), 'inperson',
        'a fingerprint that merely matches what the link itself claimed proves nothing about who is on the other end');
      /* ⚠️ AGGIORNATO il 31 ago 2026. Verificava che comparisse il pannello
         delle tre parole. Il pannello non compare piu' al primo contatto:
         chiedeva di confrontare le parole a chi, raggiunto per link, non ha
         nessun secondo canale per farlo. LA GARANZIA DIFESA DA QUESTO TEST E'
         INTATTA, e qui sotto e' verificata in modo piu' forte del pannello:
         nessuna fiducia viene registrata, e lo stato resta 'new'. Anzi, senza
         pannello nessuno puo' piu' premere "si, coincidono" senza aver
         confrontato niente. */
      assert.strictEqual(app.run("localStorage.getItem('dvlogos-safety-fp-abcdef0123456789')"), null,
        'no trust may be written down for a link that vouched for itself');
      assert.strictEqual(app.run('safetyState'), 'new',
        'it must be left plainly unverified, like any other first contact');
      app.stop();
    });
  });

  test('a link naming a phone that does not answer is still called out', () => {
    /* The half of that check which remains sound: a mismatch means the phone
       that answered is not the one the link named, and that is worth saying. */
    const app = loadApp();
    app.run(`
      window.__kind = null;
      showSasPanel = function(k){ window.__kind = k; return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'ffffffffffffffff'; };
      scannedFp = 'abcdef01';
      window.__p = checkSafetyFor('Marco');
    `);
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('safetyState'), 'changed');
      assert.strictEqual(app.run('window.__kind'), 'mismatch');
      app.stop();
    });
  });

  test('an address handed over by a stranger is not treated as a verified identity', () => {
    /* Anyone who knows your public address can leave a letter signed "Mamma"
       carrying their own address. Tapping "Richiama" reaches somebody who
       genuinely does own that address — the proof is sound — and the app used
       to answer with a badge reading "verified in person". The question was
       never who owns the address; it was who gave it to you. */
    const app = loadApp();
    app.run(`
      window.__sas = 0;
      showSasPanel = function(){ window.__sas++; return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      dialedAddress = 'DV-AAAA-BBBB-CCCC';
      dialedAddrProven = true;
      dialedAddrUnvouched = true;
      window.__p = checkSafetyFor('Mamma');
    `);
    return app.run('window.__p').then(() => {
      assert.notStrictEqual(app.run('safetyState'), 'inperson',
        'owning an address a stranger gave you says nothing about being the person they claimed to be');
      /* ⚠️ AGGIORNATO il 31 ago 2026. Verificava che comparisse il pannello
         delle tre parole. Il pannello non compare piu' al primo contatto:
         chiedeva di confrontare le parole a chi, raggiunto per link, non ha
         nessun secondo canale per farlo. LA GARANZIA DIFESA DA QUESTO TEST E'
         INTATTA, e qui sotto e' verificata in modo piu' forte del pannello:
         nessuna fiducia viene registrata, e lo stato resta 'new'. Anzi, senza
         pannello nessuno puo' piu' premere "si, coincidono" senza aver
         confrontato niente. */
      assert.strictEqual(app.run('safetyState'), 'new',
        'the three words are exactly what is left to tell them apart: it must be left unverified');
      app.stop();
    });
  });

  test('proving an address is reported, but never written down as trust on its own', () => {
    /* The proof is real: whoever answered holds the private key behind that
       address, and nobody can be in the middle of it. What it cannot show is
       that they are the person you meant to reach — owning an address says
       nothing about how the address got to you. "Sono Marco, chiamami qui"
       with a stranger's address in it produces a connection with no
       eavesdropper on it at all, straight to the wrong person.

       An earlier attempt drew the line at letters, on the reasoning that only
       a letter comes from a stranger. Four of the five routes here — a tapped
       link among them, which is how that message would actually arrive — sat
       on the trusting side of it. So there is no line: the proof is said out
       loud, and then the three words are asked for like anywhere else. */
    const app = loadApp();
    app.run(`
      window.__sas = 0; window.__lines = [];
      showSasPanel = function(k){ window.__sas++; window.__kind = k; return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      sysLine = function(txt){ window.__lines.push(txt); };
      /* the raw twelve characters parseAddress() yields, not the dashed form
         shown on screen — formatAddress() is what puts the dashes in, and
         feeding it an already-dashed string is not something the app does */
      dialedAddress = 'AAAABBBBCCCC';
      dialedAddrProven = true;
      dialedAddrUnvouched = false;
      window.__p = checkSafetyFor('Marco');
    `);
    return app.run('window.__p').then(() => {
      /* ⚠️ AGGIORNATO il 31 ago 2026. Verificava che comparisse il pannello
         delle tre parole. Il pannello non compare piu' al primo contatto:
         chiedeva di confrontare le parole a chi, raggiunto per link, non ha
         nessun secondo canale per farlo. LA GARANZIA DIFESA DA QUESTO TEST E'
         INTATTA, e qui sotto e' verificata in modo piu' forte del pannello:
         nessuna fiducia viene registrata, e lo stato resta 'new'. Anzi, senza
         pannello nessuno puo' piu' premere "si, coincidono" senza aver
         confrontato niente. */
      assert.strictEqual(app.run('safetyState'), 'new',
        'a first contact must be left unverified whatever route it arrived by — the proof is not a substitute');
      assert.strictEqual(app.run('safetyState'), 'new');
      assert.strictEqual(app.run("readSafetyRec(safetyKeyFp('abcdef0123456789'))"), null,
        'nothing may be written as trusted until two people have actually confirmed it');
      assert.ok(JSON.parse(app.run('JSON.stringify(window.__lines)')).some(l => l.indexOf('DV-AAAA-BBBB-CCCC') !== -1),
        'the proof still has to be told to the person — it is true, and it is the reason the connection is worth having');
      app.stop();
    });
  });

  test('a confirmation already given is still remembered, so the words are asked once and not every time', () => {
    /* The other half of the same rule: not writing trust automatically must
       not turn into asking forever. A record written by a real confirmation
       stays good. */
    const app = loadApp();
    app.run(`
      window.__sas = 0;
      showSasPanel = function(){ window.__sas++; return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      sysLine = function(){};
      writeSafetyRec(safetyKeyFp('abcdef0123456789'), '11111 22222');
      dialedAddress = 'AAAABBBBCCCC';
      dialedAddrProven = true;
      window.__p = checkSafetyFor('Marco');
    `);
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('safetyState'), 'ok');
      assert.strictEqual(app.run('window.__sas'), 0,
        'once two people have confirmed each other, asking again on every call would train them to tap past it');
      app.stop();
    });
  });

  /* ------------------------------------------------------------------
     v3.65 — media persists across reopening the same conversation, by
     decision of the app's owner: fewer choices to make beats a technically
     purer "download it or lose it" flow, as long as every place that already
     promises deletion actually reaches the photos too. These tests are what
     make that promise checkable instead of just asserted.
     ------------------------------------------------------------------ */

  test('receiving a file persists it and tags the bubble with its id, not a URL that will die', () => {
    const app = loadApp();
    app.run(`
      window.__puts = [];
      mediaPut = function(convKey, id, blob, t){ window.__puts.push({ convKey, id }); return Promise.resolve(); };
      peerNick = 'Marco';
      onDcMessage({ data: JSON.stringify({ type: 'file-start', id: 'ph1', name: 'gatto.jpg', mime: 'image/jpeg', size: 3 }) });
      const bytes = new Uint8Array(19);
      new TextEncoder().encode('ph1'.padEnd(16,' ')).forEach((b,i) => bytes[i] = b);
      bytes[16]=1; bytes[17]=2; bytes[18]=3;
      onDcMessage({ data: bytes.buffer });
      onDcMessage({ data: JSON.stringify({ type: 'file-end', id: 'ph1' }) });
    `);
    assert.strictEqual(app.run('window.__puts.length'), 1,
      'a received photo must be handed to the media store, not left to live only as long as the tab does');
    assert.strictEqual(app.run('window.__puts[0].id'), 'ph1');
    /* the fake DOM stores innerHTML only as a string — see the note by the
       screen-share progress-bar test above — so the id is read the same way
       every other bubble content is read here: out of that string */
    const bubbleHtml = app.run("$('msgs').children[$('msgs').children.length - 1].children[0].innerHTML");
    assert.match(bubbleHtml, /data-media-id="ph1"/,
      'the bubble must carry the id that will find the bytes again later, not just a URL good for this session only');
    app.stop();
  });

  test('sending a file persists it too, under the sender\'s own copy of the same conversation key', () => {
    const app = loadApp();
    app.run(`
      window.__puts = [];
      mediaPut = function(convKey, id, blob, t){ window.__puts.push({ convKey, id }); return Promise.resolve(); };
      peerNick = 'Marco';
      dc = { readyState: 'open', send: function(){} };
      window.__p = sendFile(new File([new Uint8Array([9,9,9])], 'foto.jpg', { type: 'image/jpeg' }));
    `);
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('window.__puts.length'), 1,
        'a file you send is exactly as much yours to lose as one you receive, and the sender needed no less protection than the receiver got');
      const bubbleHtml = app.run("$('msgs').children[$('msgs').children.length - 1].children[0].innerHTML");
      assert.match(bubbleHtml, /data-media-id="[^"]+"/);
      app.stop();
    });
  });

  test('rehydrateMedia replaces a stale URL with a fresh one built from the bytes actually on file', () => {
    /* loadHistoryFor's own round trip through localStorage cannot be driven
       from here — the fake DOM never parses innerHTML strings into real
       elements, on purpose, to stay the hundred-and-fifty lines its own
       header describes. That parsing, and this function's behaviour on the
       far side of it, is exactly what the live-browser check covers instead.
       What is tested here is rehydrateMedia's own logic in isolation, given
       real elements built the way renderMsg's callers actually build them:
       with document.createElement, not a parsed string. */
    const app = loadApp();
    app.run(`
      window.__fakeBlob = { fake: true };
      mediaGet = function(convKey, id){ return Promise.resolve(id === 'ph1' ? { blob: window.__fakeBlob } : null); };
      URL.createObjectURL = function(b){ return 'blob:fresh/' + (b === window.__fakeBlob ? 'match' : 'other'); };
      peerNick = 'Marco';
      window.__img = document.createElement('img');
      window.__img.setAttribute('data-media-id', 'ph1');
      window.__img.src = 'blob:stale/dead';
      $('msgs').appendChild(window.__img);
      window.__p = rehydrateMedia($('msgs'));
    `);
    return app.run('window.__p').then(() => {
      assert.strictEqual(app.run('window.__img.src'), 'blob:fresh/match',
        'a URL saved months ago is guaranteed dead — it must be overwritten with one built from the real bytes, never trusted as is');
      assert.strictEqual(app.run("window.__img.hasAttribute('data-media-id')"), false,
        'once rehydrated there is nothing left to look up again');
      app.stop();
    });
  });

  test('rehydrateMedia is honest when the bytes behind an id are genuinely gone', () => {
    /* Evicted by the browser under real storage pressure, or left over from
       before this device could keep media at all — either way, a broken
       image is worse than a plain sentence saying so. */
    const app = loadApp();
    app.run(`
      mediaGet = function(){ return Promise.resolve(null); };
      peerNick = 'Marco';
      window.__img = document.createElement('img');
      window.__img.setAttribute('data-media-id', 'gone1');
      $('msgs').appendChild(window.__img);
      window.__p = rehydrateMedia($('msgs'));
    `);
    return app.run('window.__p').then(() => {
      const kids = app.run("$('msgs').children.map(c => ({ tag: c.tagName, text: c.textContent }))");
      assert.strictEqual(kids.length, 1, 'the dead image must be replaced in place, not left alongside a message saying it is gone');
      assert.notStrictEqual(kids[0].tag, 'IMG', 'a dead image must not be left on screen pointing at nothing');
      assert.match(kids[0].text, /Foto/, 'what it was must still be legible, even though it is gone');
      app.stop();
    });
  });


  test('clearing or self-destructing a conversation deletes its media, not just its text', () => {
    const app = loadApp();
    app.run(`
      window.__deleted = [];
      mediaDeleteByConv = function(convKey){ window.__deleted.push(convKey); return Promise.resolve(); };
      forgetHistoryFor('Marco');
    `);
    assert.ok(app.run("window.__deleted.indexOf(historyKeyNow('Marco')) !== -1"),
      'the same call that erases the words must erase the photos, or "distrutto" is only half true');
    app.stop();
  });

  test('automatic cleanup by age reaches old media as well as old text', () => {
    const app = loadApp();
    app.run(`
      window.__cutoff = null;
      mediaDeleteOlderThan = function(cutoff){ window.__cutoff = cutoff; return Promise.resolve(); };
      setAutocleanPref(true);
      setAutocleanDays(7);
      runAutoclean();
    `);
    const cutoff = app.run('window.__cutoff');
    const expected = Date.now() - 7 * 24 * 3600 * 1000;
    assert.ok(cutoff !== null && Math.abs(cutoff - expected) < 5000,
      'media older than the same cutoff already applied to text must be reached by the same housekeeping pass');
    app.stop();
  });

  test('the time a message arrived belongs to the message, and an ordinary text message is untouched', () => {
    const app = loadApp();
    app.run(`
      peerNick = 'Marco';
      saveToHistory('Marco', '<img data-media-id="x" src="blob:http://x/abc"><div class="meta">10:30</div>', false);
      saveToHistory('Marco', 'ciao come stai<div class="meta">10:32</div>', true);
    `);
    const kept = JSON.parse(app.run("localStorage.getItem(historyKeyNow('Marco'))"));
    assert.match(kept[0].html, /10:30/);
    assert.match(kept[0].html, /data-media-id="x"/,
      'the id is what lets this photo be found again — it must survive being written to disk, not just the message around it');
    assert.strictEqual(kept[1].html, 'ciao come stai<div class="meta">10:32</div>',
      'a message with nothing to persist must be stored exactly as it was');
    app.stop();
  });

  test('the storage warning goes away once storage works again', () => {
    /* One failed write left the health card red for the whole visit, long
       after the phone had room again: a warning about a problem that had
       already gone is its own kind of wrong answer. */
    const app = loadApp();
    app.run(`
      historyBroken = true;
      saveToHistory('Marco', 'ciao<div class="meta">10:00</div>', true);
    `);
    assert.strictEqual(app.run('historyBroken'), false,
      'a write that succeeded is the proof the problem is over, and nothing else was ever going to clear it');
    app.stop();
  });

  /* ------------------------------------------------------------------
     v3.66 — i cinque difetti dell'audit ostile del 23 agosto che pesano su
     un'app gratuita: quelli che consumano la quota del piano su cui gira, e
     quello che rendeva falsa una promessa di sicurezza.
     ------------------------------------------------------------------ */

  test('every catch that cleans up a connection can actually see what it cleans', () => {
    /* Il difetto che ha motivato tutto il gruppo, e la ragione per cui i test
       non l'avevano visto. In acceptAddrCall e tryQuickConnect `myPc` era
       dichiarato con `const` DENTRO il try, e il catch faceva
       stopStrayPump(myPc): nel catch quel nome non esisteva, il gestore
       d'errore sollevava un ReferenceError proprio, inghiottiva l'errore vero
       e lasciava il pump acceso — cioè annullava esattamente la correzione che
       quella riga era.
       Controllato sul sorgente e non a runtime perché è una proprietà di
       AMBITO: vale per ogni ramo catch, compresi quelli che nessun test
       raggiunge. Il sabotaggio scritto a suo tempo provava stopStrayPump sul
       percorso felice, dove myPc è in ambito, e per costruzione non poteva
       vedere niente. */
    for (const fn of ['acceptAddrCall', 'tryQuickConnect', 'startQuickShare',
                      'dialAddress', 'acceptIncomingAutoOffer']){
      const start = SOURCE.indexOf(`async function ${fn}(`);
      assert.ok(start > 0, `${fn} non trovata`);
      const corpo = SOURCE.slice(start, SOURCE.indexOf('\n}\n', start));
      if (!/stopStrayPump\(myPc\)/.test(corpo)) continue;   /* non lo usa: niente da dire */
      const tryAt = corpo.indexOf('try{');
      const declAt = corpo.search(/\b(let|const)\s+myPc\b/);
      assert.ok(declAt > 0, `${fn}: usa myPc nel catch senza dichiararlo`);
      assert.ok(declAt < tryAt,
        `${fn}: myPc è dichiarato dentro il try ma letto nel catch — il gestore d'errore solleverà ReferenceError invece di ripulire`);
    }
  });

  test('a failure deep inside accepting an address call does not leave the mailbox being polled', () => {
    /* La stessa proprietà provata dal vivo, perché il controllo sul sorgente
       da solo direbbe solo che la riga è nel posto giusto. */
    const app = loadApp();
    app.run(`
      addrPending = { msg: { sdp: 'v=0', rid: 'r1' }, sec: { key:{}, seed:'s' }, slot: 0 };
      window.__err = null;
      sealWith = function(){ throw new Error('guasto dopo la creazione del pump'); };
      window.__p = acceptAddrCall().catch(function(e){ window.__err = String(e && e.message || e); });
    `);
    return app.run('window.__p').then(() => new Promise(r => setTimeout(r, 20))).then(() => {
      assert.strictEqual(app.run('window.__err'), null,
        'il catch stesso non deve sollevare: se solleva, inghiotte l\'errore vero e non ripulisce niente');
      assert.strictEqual(app.run('quickPump === null'), true,
        'un pump abbandonato interroga la cassetta due o tre volte al secondo per sempre, e la quota del piano gratuito è di tutti');
      app.stop();
    });
  });

  test('checking the inbox twice at once does not double the requests', () => {
    /* Senza guardia di rientro, una passata più lenta dei quattro secondi del
       timer si sovrappone alla successiva e ogni sovrapposizione aggiunge una
       scansione intera: misurato, N passate contemporanee facevano esattamente
       N volte le letture. Una spirale che si autoalimenta fino al 429. */
    const app = loadApp();
    app.run(`
      window.__letture = 0;
      mailboxGet = function(){ window.__letture++; return Promise.resolve(null); };
      let l = [];
      for (let i = 0; i < 10; i++) l.push({ nick:'C'+i, fp:'fp'+i, lastSeen: Date.now(), push:null, addr:null });
      saveContacts(l);
      window.__p = Promise.all([checkInboxOnce(), checkInboxOnce(), checkInboxOnce()]);
    `);
    return app.run('window.__p').then(() => new Promise(r => setTimeout(r, 30))).then(() => {
      const letture = app.run('window.__letture');
      const perGiro = app.run('INBOX_PER_GIRO');
      assert.ok(letture <= perGiro,
        `tre passate contemporanee hanno prodotto ${letture} letture, il tetto di un giro solo è ${perGiro}: la guardia di rientro non tiene`);
      app.stop();
    });
  });

  test('a full address book does not spend the whole minute\'s budget in one sweep', () => {
    /* Il tetto della rubrica è quaranta contatti, e a riempirla è il peer
       stesso mandando 'hello'. Una lookup per contatto ogni quattro secondi
       fa seicento letture al minuto contro un budget di trecento: nessun
       difetto, solo uso — e quando la quota finisce non si collega più
       nessuno. */
    const app = loadApp();
    app.run(`
      window.__letture = 0;
      mailboxGet = function(){ window.__letture++; return Promise.resolve(null); };
      let l = [];
      for (let i = 0; i < 40; i++) l.push({ nick:'C'+i, fp:'fp'+i, lastSeen: Date.now(), push:null, addr:null });
      saveContacts(l);
      window.__p = checkInboxOnce();
    `);
    return app.run('window.__p').then(() => new Promise(r => setTimeout(r, 30))).then(() => {
      const perGiro = app.run('window.__letture');
      const alMinuto = perGiro * 15;   /* il timer batte ogni 4 secondi */
      assert.ok(alMinuto <= 300,
        `${perGiro} letture per giro = ${alMinuto} al minuto, contro un budget di 300 per indirizzo IP`);
      app.stop();
    });
  });

  test('a full address book is still checked in full, just spread over several sweeps', () => {
    /* L'altra metà: girare a turno non deve significare dimenticare qualcuno.
       Senza questo, "consuma meno quota" si otterrebbe banalmente non
       guardando mai i contatti in fondo alla lista. */
    const app = loadApp();
    app.run(`
      window.__viste = {};
      pairKey = function(a, b){ window.__viste[a] = true; return Promise.resolve('k' + a); };
      mailboxGet = function(){ return Promise.resolve(null); };
      let l = [];
      for (let i = 0; i < 40; i++) l.push({ nick:'C'+i, fp:'fp'+i, lastSeen: Date.now(), push:null, addr:null });
      saveContacts(l);
    `);
    /* ⚠️ I GIRI SI CONTANO, NON SI SCRIVONO A MANO. Prima erano dieci, fissi,
       perche' dieci per otto fa quaranta — e il 1 set 2026, dimezzando il
       lotto a quattro per consumare meno quota, questo test e' diventato
       rosso pur restando la garanzia intatta. Un test che si rompe quando
       cambia il PASSO invece che la PROMESSA sta misurando il meccanismo, non
       cio' che conta: la promessa e' "nessuno viene dimenticato", e quanti
       giri servano e' un dettaglio che il test puo' ricavarsi da solo. */
    const perGiro = Number(app.run('INBOX_PER_GIRO'));
    assert.ok(perGiro > 0, 'INBOX_PER_GIRO deve esistere');
    const giri = Math.ceil(40 / perGiro) + 2;
    let p = Promise.resolve();
    for (let giro = 0; giro < giri; giro++){
      p = p.then(() => { app.run('window.__g = checkInboxOnce();'); return app.run('window.__g'); })
           .then(() => new Promise(r => setTimeout(r, 5)));
    }
    return p.then(() => {
      const viste = Object.keys(JSON.parse(app.run('JSON.stringify(window.__viste)'))).length;
      assert.strictEqual(viste, 40,
        `dopo ${giri} giri sono stati guardati solo ${viste} contatti su 40: girando a turno non si deve perdere nessuno`);
      app.stop();
    });
  });

  test('an armed self-destruct keeps photos off the disk too, not just words', () => {
    /* saveToHistory dichiara "an armed session never touches the disk at all".
       Da quando i media persistono quella frase era falsa: persistMedia è
       chiamata PRIMA di saveToHistory, e il cancello stava solo in
       quest'ultima. Chi arma l'autodistruzione lo fa perché di quella frase
       si fida. */
    const app = loadApp();
    app.run(`
      checkSafetyFor = function(){ return Promise.resolve(); };
      showConnectedFlash = function(){ return Promise.resolve(); };
      window.__put = 0;
      mediaPut = function(){ window.__put++; return Promise.resolve(); };
      peerNick = 'Marco';
      destructArmed = true;
      onDcMessage({ data: JSON.stringify({ type:'file-start', id:'p1', name:'f.jpg', mime:'image/jpeg', size:3 }) });
      const b = new Uint8Array(19);
      new TextEncoder().encode('p1'.padEnd(16,' ')).forEach(function(x,i){ b[i] = x; });
      onDcMessage({ data: b.buffer });
      onDcMessage({ data: JSON.stringify({ type:'file-end', id:'p1' }) });
    `);
    assert.strictEqual(app.run("localStorage.getItem(historyKeyNow('Marco'))"), null,
      'il testo non deve toccare il disco con il timer armato — questo funzionava già');
    assert.strictEqual(app.run('window.__put'), 0,
      'e nemmeno la foto: il cancello deve stare dentro persistMedia, non solo in saveToHistory');
    app.stop();
  });

  test('disarming the self-destruct lets media be kept again', () => {
    /* L'altra metà del cancello: spegnerlo deve riaprire la porta, o
       "autodistruzione" diventerebbe "non salvo più niente, mai". */
    const app = loadApp();
    app.run(`
      window.__put = 0;
      mediaPut = function(){ window.__put++; return Promise.resolve(); };
      peerNick = 'Marco';
      destructArmed = false;
      persistMedia('Marco', 'x1', {});
    `);
    assert.strictEqual(app.run('window.__put'), 1);
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

  function fakeVideoCallFixture(app){
    /* Enough of an active video call for useVideoTrack() to have somewhere
       real to swap a track into: a sender the connection would actually use,
       and a MediaStream that tracks additions and removals the way a real
       one does — not a mock that only records calls. */
    app.run(`
      callKind = 'video';
      window.__camTrack = { kind: 'video', stopped: false, stop(){ this.stopped = true; }, enabled: true };
      window.__tracks = [__camTrack];
      localStream = {
        getVideoTracks: function(){ return window.__tracks.slice(); },
        getAudioTracks: function(){ return []; },
        getTracks: function(){ return window.__tracks.slice(); },
        addTrack: function(t){ window.__tracks.push(t); },
        removeTrack: function(t){ const i = window.__tracks.indexOf(t); if (i >= 0) window.__tracks.splice(i, 1); },
      };
      window.__sender = { track: __camTrack, replaceTrack: function(t){ this.track = t; return Promise.resolve(); } };
      pc = { getSenders: function(){ return [window.__sender]; } };
    `);
  }

  test('screen sharing offers itself only when the browser can do it, and only on a video call', () => {
    const app = loadApp();
    assert.strictEqual(app.run('screenShareSupported()'), false,
      'the fake browser has no getDisplayMedia, same as a browser that genuinely lacks it');
    fakeVideoCallFixture(app);
    app.run('initScreenShare();');
    assert.strictEqual(app.run("$('btnScreenShare').classList.contains('hide')"), true,
      'must not offer screen sharing on a browser that cannot do it');
    app.run(`
      navigator.mediaDevices.getDisplayMedia = function(){ return Promise.resolve({ getVideoTracks: function(){ return []; } }); };
      initScreenShare();
    `);
    assert.strictEqual(app.run("$('btnScreenShare').classList.contains('hide')"), false,
      'a video call on a browser that supports it should be offered the button');
    app.run(`callKind = 'audio'; initScreenShare();`);
    assert.strictEqual(app.run("$('btnScreenShare').classList.contains('hide')"), true,
      'a voice call has no video track to swap, so the button has nothing to do there');
    app.stop();
  });

  test('starting screen share swaps the video track without touching the call, and stopping it swaps back', () => {
    const app = loadApp();
    fakeVideoCallFixture(app);
    app.run(`
      window.__screenTrack = { kind: 'video', stop(){}, enabled: true, onended: null };
      navigator.mediaDevices.getDisplayMedia = function(){ return Promise.resolve({ getVideoTracks: function(){ return [window.__screenTrack]; } }); };
      initScreenShare();
      window.__p1 = $('btnScreenShare').listeners.click[0]();
    `);
    return app.run('window.__p1').then(() => {
      assert.strictEqual(app.run('window.__sender.track === window.__screenTrack'), true,
        'the connection must actually be sending the screen once sharing starts');
      assert.strictEqual(app.run('window.__camTrack.stopped'), true,
        'the camera must be let go of, not left running unused behind the screen');
      assert.strictEqual(app.run('screenSharing'), true);
      assert.strictEqual(app.run("$('btnScreenShare').classList.contains('on')"), true);

      app.run(`
        window.__freshCam = { kind: 'video', stop(){}, enabled: true };
        navigator.mediaDevices.getUserMedia = function(){ return Promise.resolve({ getVideoTracks: function(){ return [window.__freshCam]; } }); };
        window.__p2 = $('btnScreenShare').listeners.click[0]();
      `);
      return app.run('window.__p2').then(() => {
        assert.strictEqual(app.run('window.__sender.track === window.__freshCam'), true,
          'stopping the share must hand the call a real camera track back, not just hide the button');
        assert.strictEqual(app.run('screenSharing'), false);
        assert.strictEqual(app.run("$('btnScreenShare').classList.contains('on')"), false);
        app.stop();
      });
    });
  });

  test('the call clock formats as mm:ss, and grows a leading hour once a call runs that long', () => {
    const app = loadApp();
    assert.strictEqual(app.run('formatCallDuration(5)'), '00:05');
    assert.strictEqual(app.run('formatCallDuration(65)'), '01:05');
    assert.strictEqual(app.run('formatCallDuration(3661)'), '1:01:01',
      'past an hour it must grow a third field rather than overflow the minutes');
    app.stop();
  });

  test('accepting a call starts a running clock in place of the static status text, and hanging up stops it', () => {
    /* The badge used to say "In videochiamata" for the whole call, true only
       for the instant it appeared. startCallTimer() overwrites it with a
       ticking clock; stopCallTimer() must leave nothing still running once
       the call has actually ended, or a stale interval would keep poking a
       DOM node from a call that is already over. */
    const app = loadApp();
    fakeVideoCallFixture(app);
    app.run('startCallTimer();');
    assert.strictEqual(app.run("$('callStatus').textContent"), '00:00',
      'the clock must replace the static text the instant the call goes active');
    app.run('callStartedAt = Date.now() - 65000; tickCallTimer();');
    assert.strictEqual(app.run("$('callStatus').textContent"), '01:05',
      'ticking must read elapsed time from callStartedAt, not just count up from zero on its own');
    app.run('stopCallTimer();');
    assert.strictEqual(app.run('callTimerInterval'), null,
      'stopping must actually clear the interval, not just stop caring about it');
    app.stop();
  });

  test('waiting loops check back fast at first, then settle to their normal pace', () => {
    /* v3.52 hand-tuned this once for a single wait; this is the shared helper
       that now gives every other wait the same fast start. Reads cost
       nothing extra on the free plan (the tight quota is on writes), so
       there is no reason the other waits should have missed out on it. */
    const app = loadApp();
    assert.strictEqual(app.run('pollGap(Date.now(), 1500)'), 400,
      'right at the start of a wait, the fast pace should apply');
    assert.strictEqual(app.run('pollGap(Date.now() - 5000, 1200)'), 400,
      'five seconds in is still inside the fast window');
    assert.strictEqual(app.run('pollGap(Date.now() - 20000, 1500)'), 1500,
      'once the fast window has passed, it must fall back to the normal pace given to it — not stay fast forever and spend requests for nothing');
    assert.strictEqual(app.run('pollGap(Date.now() - 20000, 700)'), 700,
      'the fallback is whatever pace that particular wait normally uses, not a fixed number');
    app.stop();
  });

  test('being told to slow down overrides the fast start, and eases off harder than the normal pace', () => {
    /* Before this, a 429 from the mailbox looked identical to an empty slot:
       brokerReachable stayed true and the loop kept polling at whatever pace
       it already had, fast window included — the one moment the app was
       told to back off was the one moment it structurally could not. */
    const app = loadApp();
    app.run('mailboxThrottled = true;');
    assert.strictEqual(app.run('pollGap(Date.now(), 1500)'), 4000,
      'a throttled response must not be answered with the fast pace, even right at the start of a wait');
    assert.strictEqual(app.run('pollGap(Date.now(), 700)'), 4000,
      'the backoff floor applies even to waits whose own normal pace is already slower than it');
    app.run('mailboxThrottled = false;');
    assert.strictEqual(app.run('pollGap(Date.now(), 1500)'), 400,
      'once no longer throttled, the fast start must work again — this must not get stuck on');
    app.stop();
  });

  test('a failed attempt to fetch relay credentials does not disable the relay for the rest of the visit', () => {
    /* The fake browser's fetch always rejects, so the first call falls back
       to STUN-only exactly like a real network blip would — the point being
       tested is what happens on the *next* call, not this one. */
    const app = loadApp();
    return app.run('fetchIceServers()').then(first => {
      const stunOnly = JSON.parse(app.run('JSON.stringify(ICE_STUN_ONLY.iceServers)'));
      assert.deepStrictEqual(JSON.parse(JSON.stringify(first)), stunOnly);
      assert.strictEqual(app.run('cachedIceServers'), null,
        'a failure must not be written into the cache as if it were a real answer — the very next attempt deserves a genuine second try');
      /* now let the connection genuinely succeed, as it would once whatever
         failed a moment ago has recovered */
      app.run(`
        window.__realServers = [{ urls: 'turn:example.test', username: 'u', credential: 'p' }];
        fetch = function(){ return Promise.resolve({ ok: true, json: function(){ return Promise.resolve({ iceServers: window.__realServers }); } }); };
      `);
      return app.run('fetchIceServers()').then(second => {
        const realServers = JSON.parse(app.run('JSON.stringify(window.__realServers)'));
        assert.deepStrictEqual(JSON.parse(JSON.stringify(second)), realServers,
          'a later attempt must get real credentials, not be stuck repeating the earlier failure forever');
        app.stop();
      });
    });
  });

  test('a connection that wobbles and does not come back offers a way out, instead of an indefinite silent wait', () => {
    /* 'disconnected' used to say "sto riprendendo" without anything actually
       trying to — this calls the real onConnectionStateChange/
       stillDisconnected functions directly (the fake RTCPeerConnection's
       addEventListener does not store listeners, so going through a real
       event never reaches them) and checks that after the grace period, the
       same recovery banner v3.53 already built for a fully dropped
       connection shows up here too — well before the browser's own much
       longer internal timeout would have said anything at all. */
    const app = loadApp();
    app.run(`
      $('screenChat').classList.remove('hide');
      window.__fakeConn = { connectionState: 'disconnected' };
      pc = window.__fakeConn;
      onConnectionStateChange(window.__fakeConn);
    `);
    assert.strictEqual(app.run("$('msgs').children.length"), 0,
      'nothing should be said the instant it wobbles — a brief blip deserves a real chance to recover quietly first');
    assert.strictEqual(app.run('!!window.__fakeConn.__disconnectTimer'), true,
      'a grace-period timer must actually be armed, not just a promise to check back never kept');
    /* fires the grace-period callback directly rather than waiting 8 real
       seconds — same reasoning as everywhere else this session that a timer
       fire is invoked, not slept through */
    app.run(`
      clearTimeout(window.__fakeConn.__disconnectTimer);
      stillDisconnected(window.__fakeConn);
    `);
    const line = JSON.parse(app.run(`
      JSON.stringify((() => {
        const l = $('msgs').children[$('msgs').children.length - 1];
        return { text: l.children[0].textContent, btnText: l.children[1].textContent };
      })())
    `));
    assert.strictEqual(line.btnText, 'Torna alla home');
    assert.ok(line.text.length > 0);
    app.stop();
  });

  test('a connection that recovers on its own before the grace period cancels the timer, and says nothing', () => {
    const app = loadApp();
    app.run(`
      $('screenChat').classList.remove('hide');
      window.__fakeConn = { connectionState: 'disconnected' };
      pc = window.__fakeConn;
      onConnectionStateChange(window.__fakeConn);
      window.__fakeConn.connectionState = 'connected';
      onConnectionStateChange(window.__fakeConn);
    `);
    assert.strictEqual(app.run('window.__fakeConn.__disconnectTimer'), null,
      'recovering must cancel the pending grace-period check, not leave it armed against a connection that is fine now');
    assert.strictEqual(app.run("$('msgs').children.length"), 0,
      'a connection that recovered on its own has nothing to announce');
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
      /* Un giro solo, non uno per chiamante. Con piu' relay un giro vale
         quante sono le liste — chiedere a tutti e' voluto — quindi il conto da
         difendere e' "un giro", non "una richiesta": due chiamanti che non si
         deduplicano ne farebbero il doppio. La misura resta esatta invece che
         diventare un "minore di", che avrebbe lasciato passare proprio il
         difetto che questo test esiste per prendere. */
      const giro = app.run('RELAYS.length');
      assert.strictEqual(app.run('window.__asked'), giro,
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
    /* tryAutoReconnectInner, not tryAutoReconnect: the outer half is only the
       try/catch wrapper added when it turned out an exception there left a
       mailbox pump polling forever. The connection is still built in the
       inner half, which is what this has to look at. */
    for (const fn of ['acceptAddrCall', 'tryAutoReconnectInner', 'acceptIncomingAutoOffer',
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

  test('ogni risorsa ha il suo bilancio, e il piu scarso e il piu stretto', () => {
    /* They exist for opposite reasons: a mailbox poll happens ~150 times per
       honest connection, credentials once per page load. Sharing one number
       would mean either starving the first or leaving the second wide open.

       ⚠️ ALLARGATO IL 1 SET 2026. Prima guardava due soli numeri, e non
       poteva vedere il difetto che ha quasi spento Logos: LE SCRITTURE NON
       AVEVANO UN BILANCIO PROPRIO. Pagavano da quello delle letture, che sul
       piano gratuito sono CENTO VOLTE piu abbondanti (100.000 contro 1.000 al
       giorno) — quindi il tetto era tarato sulla risorsa che avanza e lasciava
       scoperta quella che finisce. La regola generale, ed e' quella che il
       test fissa adesso: chi ha meno scorta deve avere il tetto piu basso. */
    const worker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');
    const num = re => Number((worker.match(re) || [])[1]);
    const letture   = num(/RL_MAX_READS\s*=\s*(\d+)/);
    const scritture = num(/RL_MAX_WRITES\s*=\s*(\d+)/);
    const turn      = num(/RL_TURN_MAX\s*=\s*(\d+)/);
    assert.ok(letture > 0 && scritture > 0 && turn > 0,
      'letture, scritture e credenziali devono avere ognuna il proprio tetto');
    assert.ok(turn < letture, `credenziali (${turn}) devono essere piu strette delle letture (${letture})`);
    assert.ok(scritture < letture,
      `scritture (${scritture}) devono essere piu strette delle letture (${letture}): ` +
      'sul piano gratuito sono cento volte piu scarse');

    /* E il fondo del secchio deve esistere: senza, cambiare indirizzo — cosa
       che una rete mobile fa da sola — aggira ogni limite per indirizzo. */
    assert.ok(/GLOBAL_MAX_WRITES\s*=\s*\d+/.test(worker) && /overGlobal\s*\(/.test(worker),
      'deve esistere un tetto che non guarda l indirizzo di chi chiede');
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

/* ------------------------------------------------------------------------
   Ringing like a real phone, without asking anything of anyone but the
   person already on this screen. No push, no external service — the switch
   itself is the whole mechanism, which is exactly why its edges matter:
   nothing else is going to catch a call this misses.
   ------------------------------------------------------------------------ */
test.describe('staying in listening mode', () => {

  test('the switch flips state, paints itself, and holds the screen awake only while it is on', () => {
    const app = loadApp();
    app.run(`
      window.__awake = 0, window.__slept = 0;
      keepScreenAwake = function(){ window.__awake++; return Promise.resolve(); };
      letScreenSleep = function(){ window.__slept++; };
    `);
    app.run("$('listenRow').listeners.click[0]();");
    assert.strictEqual(app.run('listenMode'), true);
    assert.strictEqual(app.run("$('listenRow').classList.contains('on')"), true);
    assert.strictEqual(app.run("$('listenRow').getAttribute('aria-pressed')"), 'true');
    assert.strictEqual(app.run("$('listenStatus').classList.contains('hide')"), false,
      'the honest status line must show while the mode is really on');
    assert.strictEqual(app.run('window.__awake'), 1);

    app.run("$('listenRow').listeners.click[0]();");
    assert.strictEqual(app.run('listenMode'), false);
    assert.strictEqual(app.run("$('listenStatus').classList.contains('hide')"), true);
    assert.strictEqual(app.run('window.__slept'), 1);
    app.stop();
  });

  test('turning it off mid-call does not let the screen sleep out from under the call', () => {
    const app = loadApp();
    app.run(`
      window.__slept = 0;
      letScreenSleep = function(){ window.__slept++; };
      listenMode = true; callState = 'active';
    `);
    app.run("$('listenRow').listeners.click[0]();");
    assert.strictEqual(app.run('window.__slept'), 0,
      'an active call already owns the wake lock — this switch turning off must not take it away from it');
    app.stop();
  });

  test('returning to the tab re-arms the wake lock on its own, without the person doing anything', () => {
    /* The lock is released by the browser itself the instant the tab is
       hidden — that part cannot be changed. What can be changed is whether
       coming back requires remembering to flip the switch again. */
    const app = loadApp();
    app.run(`
      window.__awake = 0;
      keepScreenAwake = function(){ window.__awake++; return Promise.resolve(); };
      listenMode = true;
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent({ type: 'visibilitychange' });
    `);
    assert.ok(app.run('window.__awake') >= 1,
      'listenMode alone, same as an active call, must be enough to ask for the screen again on return');
    app.stop();
  });

  test('an address call rings immediately in listening mode, and does nothing when the mode is off', () => {
    /* The real pipeline (mailbox, decryption, activeSlots) is exercised
       elsewhere; stubbed here down to exactly the shape addrCheckOnce reads,
       so what is under test is the one new line — whether listenMode gates
       the ring — and nothing about the crypto underneath it. */
    function fakeIncoming(app){
      app.run(`
        activeSlots = function(){ return [0]; };
        myAddress = function(){ return Promise.resolve('AAAABBBBCCCC'); };
        addrSlotSeed = function(){ return Promise.resolve('seed'); };
        mailboxGet = function(){ return Promise.resolve('raw'); };
        addrOpenIncoming = function(){ return Promise.resolve({
          obj: { sdp: 'v=0', rid: 'r1', nick: 'Marco' }, sec: { key:{}, seed:'s' }
        }); };
      `);
    }
    const on = loadApp();
    fakeIncoming(on);
    on.run('listenMode = true; window.__p = addrCheckOnce();');
    return on.run('window.__p').then(() => {
      assert.strictEqual(on.run('ringTimer !== null'), true,
        'listening mode must turn a silent incoming card into an actual ring');
      on.stop();

      const off = loadApp();
      fakeIncoming(off);
      off.run('listenMode = false; window.__p = addrCheckOnce();');
      return off.run('window.__p').then(() => {
        assert.strictEqual(off.run("$('addrIncoming').classList.contains('hide')"), false,
          'the card itself must still appear with the mode off — only the ring is gated');
        assert.strictEqual(off.run('ringTimer'), null,
          'without listening mode, nothing may start making noise on its own');
        off.stop();
      });
    });
  });

  test('accepting or ignoring the call silences a ring already in progress', () => {
    const app = loadApp();
    app.run(`
      addrPending = { msg: { sdp: 'v=0', rid: 'r1', nick: 'Marco' }, sec: { key:{}, seed:'s' }, slot: 0 };
      ringForIncomingAddr();
    `);
    assert.strictEqual(app.run('ringTimer !== null'), true, 'the setup must actually be ringing first');
    app.run("$('btnAddrIgnore').listeners.click[0]();");
    assert.strictEqual(app.run('ringTimer'), null, 'ignoring a call must not leave it ringing behind the closed card');
    app.stop();
  });

  test('a ring left unanswered stops itself, rather than running until the battery says otherwise', () => {
    const app = loadApp();
    app.run('ringForIncomingAddr();');
    assert.strictEqual(app.run('ringTimer !== null'), true);
    app.run(`clearTimeout(listenRingTimer); stopRing();`);   /* simulates the timeout firing, without a 45s real wait */
    assert.strictEqual(app.run('ringTimer'), null);
    app.stop();
  });
});

/* ------------------------------------------------------------------------
   A phone photo carries more than the picture — GPS, device model, the
   software that saved it. stripJpegMetadata/stripPngMetadata cut those
   wrapper segments out on-device before a file is ever sent, without
   touching a single pixel byte. These tests build tiny, real JPEG/PNG
   structures by hand (not decodable pictures — just correctly-framed
   markers/chunks, which is all the stripper ever looks at) so the guard
   can be checked precisely: the metadata segment must be gone, and every
   byte of what remains must be identical to the input, not merely similar.
   ------------------------------------------------------------------------ */
test.describe('taking the GPS and the device model back out of a photo', () => {

  test('stripJpegMetadata removes an EXIF (APP1) segment, byte-identical scan data', () => {
    const app = loadApp();
    const withExif = app.run(`
      window.__jpg = new Uint8Array([
        0xFF,0xD8,
        0xFF,0xE1,0x00,0x0A, 0x45,0x78,0x69,0x66,0x00,0x00,0xAA,0xBB,
        0xFF,0xDA, 0x01,0x02,0x03,
        0xFF,0xD9
      ]);
      Array.from(stripJpegMetadata(window.__jpg));
    `);
    assert.deepStrictEqual(withExif, [0xFF,0xD8, 0xFF,0xDA,0x01,0x02,0x03, 0xFF,0xD9],
      'the EXIF segment must be cut out whole, leaving SOI, SOS and the scan data exactly as they arrived');
    app.stop();
  });

  test('stripJpegMetadata leaves a JPEG with no metadata to strip completely unchanged', () => {
    const app = loadApp();
    const clean = app.run(`
      window.__jpg = new Uint8Array([0xFF,0xD8, 0xFF,0xDA,0x09,0x08,0x07, 0xFF,0xD9]);
      Array.from(stripJpegMetadata(window.__jpg));
    `);
    assert.deepStrictEqual(clean, [0xFF,0xD8, 0xFF,0xDA,0x09,0x08,0x07, 0xFF,0xD9],
      'nothing to remove means nothing may change, not even by one byte');
    app.stop();
  });

  test('stripJpegMetadata leaves an unrecognisable file untouched rather than guess', () => {
    const app = loadApp();
    const notAJpeg = app.run(`Array.from(stripJpegMetadata(new Uint8Array([1,2,3,4,5])))`);
    assert.deepStrictEqual(notAJpeg, [1,2,3,4,5],
      'a file that does not start with the JPEG signature must be returned exactly as given, never mangled on a guess');
    app.stop();
  });

  test('stripPngMetadata removes a tEXt chunk, keeps IHDR/IDAT/IEND intact', () => {
    const app = loadApp();
    const { before, after } = app.run(`
      function u32(n){ return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]; }
      function ascii(s){ return Array.from(s).map(c => c.charCodeAt(0)); }
      function chunk(type, data){ return [...u32(data.length), ...ascii(type), ...data, 0,0,0,0]; }
      const bytes = [
        0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
        ...chunk('IHDR', new Array(13).fill(0)),
        ...chunk('tEXt', ascii('GPS!!')),
        ...chunk('IDAT', [1,2,3]),
        ...chunk('IEND', []),
      ];
      window.__before = bytes;
      window.__after = Array.from(stripPngMetadata(new Uint8Array(bytes)));
      ({ before: window.__before, after: window.__after });
    `);
    assert.ok(!after.some((b,i) => 'tEXt'.split('').every((c,j) => after[i+j] === c.charCodeAt(0))),
      'the ASCII bytes "tEXt" must not appear anywhere in the output — the whole chunk is gone, not just renamed');
    assert.ok(before.length > after.length, 'stripping a real metadata chunk must actually shrink the file');
    const sig = after.slice(0, 8);
    assert.deepStrictEqual(sig, [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A], 'the PNG signature itself must survive untouched');
    app.stop();
  });

  test('stripFileMetadata passes through formats it does not yet cover, e.g. a video', () => {
    const app = loadApp();
    const same = app.run(`
      window.__f = new File([new Uint8Array([9,9,9])], 'clip.mp4', { type: 'video/mp4' });
      window.__p = stripFileMetadata(window.__f).then(r => r === window.__f);
    `);
    return app.run('window.__p').then(unchanged => {
      assert.strictEqual(unchanged, true,
        'a format the stripper does not parse must be sent through exactly as picked, never silently altered or dropped');
      app.stop();
    });
  });

  test('sendFile strips EXIF before the bytes ever reach the wire', () => {
    const app = loadApp();
    app.run(`
      window.__sent = [];
      dc = { readyState: 'open', send: function(m){ window.__sent.push(m); } };
      peerNick = 'Marco';
      mediaPut = function(){ return Promise.resolve(); };
      const withExif = new Uint8Array([
        0xFF,0xD8,
        0xFF,0xE1,0x00,0x0A, 0x45,0x78,0x69,0x66,0x00,0x00,0xAA,0xBB,
        0xFF,0xDA, 0x01,0x02,0x03,
        0xFF,0xD9
      ]);
      window.__p = sendFile(new File([withExif], 'foto.jpg', { type: 'image/jpeg' }));
    `);
    return app.run('window.__p').then(() => {
      const start = JSON.parse(app.run('window.__sent[0]'));
      assert.strictEqual(start.size, 9,
        'the size announced in file-start must be the stripped size (9 bytes), not the original one with EXIF still in it (20)');
      const framed = app.run('Array.from(new Uint8Array(window.__sent[1]))');
      const payload = framed.slice(16); // first 16 bytes are the transfer id
      assert.deepStrictEqual(payload, [0xFF,0xD8, 0xFF,0xDA,0x01,0x02,0x03, 0xFF,0xD9],
        'the bytes that actually cross the data channel must already be the metadata-free version');
      app.stop();
    });
  });
});

/* ------------------------------------------------------------------------
   A2 — la sordità per abbandono.

   Una procedura interrotta da un'eccezione lasciava la connessione in stato
   'new': né chiusa né fallita, quindi `busyWithSomeone()` la leggeva come
   "occupato" e il dispositivo restava irraggiungibile a chiunque, per sempre,
   fino a un ricaricamento. Invisibile a chi lo subisce — vede un'app normale —
   e innescabile da remoto da chi gli parla.

   È la quarta volta che questo progetto viene morso dalla stessa classe di
   difetto (v3.35, v3.36, v3.37, e questa). Per questo la correzione non è solo
   una toppa nei catch: ogni connessione viene marcata alla nascita, nell'unico
   punto da cui passano tutte, e l'età da sola basta a riconoscere un tentativo
   abbandonato — anche in codice che nessuno ha ancora scritto.
   ------------------------------------------------------------------------ */
test.describe('dove l app va a bussare', () => {

  /* Sei indirizzi che prima erano scritti a mano sei volte e adesso nascono da
     una lista sola. Il rischio del riordino e' silenzioso: un indirizzo che
     cambia di una lettera non fa errore da nessuna parte, l'app semplicemente
     non trova piu' nessuno. Qui sono inchiodati uno per uno. */
  const atteso = 'https://digitalvalut-turn.burbeng78.workers.dev';

  test('i sei indirizzi restano esattamente quelli di prima', () => {
    const app = loadApp();
    const r = app.run(`JSON.stringify({
      lista: RELAYS, uno: RELAY, porte: RELAY_PATH,
      knock: KNOCK_URL, mailbox: MAILBOX_BASE,
      key: PUBKEY_BASE, wake: WAKE_BASE, letter: LETTER_BASE,
    })`);
    return Promise.resolve(r).then(x => {
      const o = JSON.parse(x);
      /* Da qui in poi la lista ne contiene DUE, ed e' il punto di tutto il
         lavoro: per fermare Logos bisogna spegnerli entrambi insieme. Il primo
         resta quello storico, cosi' chi ha una versione vecchia continua a
         incontrare chi ha quella nuova. */
      /* ⚠️ UNO SOLO, e deve restare uno finche' il difetto non e' risolto.
         Due relay hanno rotto le connessioni su telefoni veri: la casella
         dell'appuntamento si svuota quando viene letta, quindi scriverla su
         due relay crea due messaggi indipendenti che si consumano in momenti
         diversi. Questo test e' qui per impedire che qualcuno rimetta il
         secondo relay senza aver prima cambiato il modo in cui i due lati
         scelgono dove incontrarsi. */
      assert.strictEqual(o.lista[0], atteso, 'il primo deve restare quello storico');
      assert.strictEqual(o.lista.length, 1,
        'UN RELAY SOLO: rimetterne due senza risolvere la casella read-once rompe le connessioni');
      assert.strictEqual(new Set(o.lista).size, o.lista.length, 'nessun doppione');
      assert.strictEqual(o.uno, atteso);
      assert.deepStrictEqual(o.porte, { turn:'/', knock:'/knock', mailbox:'/mailbox/',
                                        key:'/key/', wake:'/wake/', letter:'/letter/' },
        'le porte del servizio non devono cambiare nome');
      assert.strictEqual(o.knock,   atteso + '/knock');
      assert.strictEqual(o.mailbox, atteso + '/mailbox/');
      assert.strictEqual(o.key,     atteso + '/key/');
      assert.strictEqual(o.wake,    atteso + '/wake/');
      assert.strictEqual(o.letter,  atteso + '/letter/');
      app.stop();
    });
  });

  test('le credenziali di collegamento vengono chieste a TUTTI i relay', () => {
    /* La prima chiamata davvero convertita. Si controlla dove va a bussare,
       non solo che funzioni: un indirizzo giusto ma chiesto a un relay solo
       sarebbe indistinguibile da prima. */
    const app = loadApp();
    const r = app.run(`(async () => {
      window.__chiamate = [];
      fetch = (url) => { window.__chiamate.push(url);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ iceServers: [{ urls: 'turn:x' }] }) }); };
      RELAYS.length = 0; RELAYS.push('https://uno.example', 'https://due.example');
      const s = await fetchIceServers();
      return JSON.stringify({ dove: window.__chiamate, quanti: s.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.deepStrictEqual(o.dove.sort(), ['https://due.example/', 'https://uno.example/'],
        'deve chiederle a tutti e due, sulla porta giusta');
      app.stop();
    });
  });

  test('se nessun relay risponde, la chiamata parte lo stesso con STUN', () => {
    /* Il motivo per cui questa e la prima convertita: fallire qui non rompe
       niente che si veda. */
    const app = loadApp();
    const r = app.run(`(async () => {
      fetch = () => Promise.reject(new Error('tutti giu'));
      RELAYS.length = 0; RELAYS.push('https://uno.example', 'https://due.example');
      const s = await fetchIceServers();
      return JSON.stringify({ quanti: s.length, primo: s[0] && s[0].urls });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.ok(o.quanti > 0, 'deve ripiegare su qualcosa, non restare a mani vuote');
      assert.match(String(o.primo), /^stun:/, 'e quel qualcosa e STUN');
      app.stop();
    });
  });

  test('ogni relay della lista e autorizzato dalla regola della pagina', () => {
    /* Se un relay finisse nella lista senza essere anche in `connect-src`, il
       browser lo bloccherebbe e l'app fallirebbe SOLO in produzione, in
       silenzio: qui la lista e la regola vengono confrontate. */
    const fs = require('fs');
    const html = fs.readFileSync(__dirname + '/../modifica.html', 'utf8');
    const riga = (html.match(/connect-src[^;]*/) || [''])[0];
    assert.ok(riga, 'la regola connect-src deve esistere');
    const app = loadApp();
    const r = app.run('JSON.stringify(RELAYS)');
    return Promise.resolve(r).then(x => {
      for (const u of JSON.parse(x)){
        assert.ok(riga.indexOf(u) >= 0, 'relay non autorizzato dalla pagina: ' + u);
      }
      app.stop();
    });
  });

});

test.describe('parlare a piu relay insieme', () => {

  /* Una rete finta che si comporta come quella vera nei modi che contano: uno
     risponde, uno dice di no, uno resta MUTO — che e' il caso interessante,
     perche un servizio bloccato tace, non rifiuta. */
  const rete = (regole) => `
    window.__chiamate = [];
    fetch = (url, opts) => {
      window.__chiamate.push(url);
      const r = (${JSON.stringify(regole)}).find(x => url.indexOf(x.host) >= 0);
      if (!r || r.come === 'errore') return Promise.reject(new Error('rete giu'));
      if (r.come === 'muto') return new Promise((_, no) => {
        opts.signal.addEventListener('abort', () => no(new Error('scaduto')));
      });
      return Promise.resolve({ ok: r.come === 'si', status: r.come === 'si' ? 200 : 500,
                               json: () => Promise.resolve({ chi: r.host }) });
    };
    RELAYS.length = 0;
    RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
  `;

  test('chiede a tutti e tiene la prima risposta buona', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'no'},{host:'due',come:'si'},{host:'tre',come:'si'}])}
      const e = await askAnyRelay('/key/abc');
      const dati = e.res ? await e.res.json() : null;
      return JSON.stringify({ trovato: !!e.res, chi: dati && dati.chi, quanti: window.__chiamate.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.trovato, true, 'uno buono c era');
      assert.strictEqual(o.quanti, 3, 'li interroga tutti e tre insieme, non a turno');
      app.stop();
    });
  });

  test('IL CASO CHE CONTA: un relay bloccato non blocca gli altri', () => {
    /* Un servizio bloccato non risponde "no": tace. Se le richieste andassero
       in fila, il muto in cima alla lista farebbe aspettare tutti — cioe'
       renderebbe l'app inservibile senza spegnerla. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'muto'},{host:'due',come:'muto'},{host:'tre',come:'si'}])}
      const t0 = Date.now();
      const e = await askAnyRelay('/key/abc', {}, 20000);
      return JSON.stringify({ trovato: !!e.res, chi: e.res ? (await e.res.json()).chi : null, ms: Date.now() - t0 });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.trovato, true, 'il terzo doveva rispondere');
      assert.strictEqual(o.chi, 'tre');
      assert.ok(o.ms < 3000, 'non deve aspettare i muti: ha impiegato ' + o.ms + ' ms');
      app.stop();
    });
  });

  test('se tacciono tutti torna niente, senza restare appeso', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'muto'},{host:'due',come:'errore'},{host:'tre',come:'no'}])}
      const e = await askAnyRelay('/key/abc', {}, 400);
      return JSON.stringify({ trovato: !!e.res });
    })()`);
    return r.then(x => {
      assert.strictEqual(JSON.parse(x).trovato, false, 'deve dire di no, non aspettare per sempre');
      app.stop();
    });
  });

  test('il biglietto viene lasciato su tutti, non solo sul primo', () => {
    /* Lasciarlo su uno solo vuol dire che basta bloccare quello per farti
       sparire, anche se gli altri sono vivi. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'si'},{host:'due',come:'si'},{host:'tre',come:'si'}])}
      const e = await tellAllRelays('/key/abc', { method: 'PUT' });
      return JSON.stringify({ riusciti: e.riusciti, contattati: window.__chiamate.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.contattati, 3, 'deve scrivere su tutti e tre');
      assert.strictEqual(o.riusciti, 3);
      app.stop();
    });
  });

  test('e se solo uno accetta, lo dice invece di fingere che vada tutto bene', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'errore'},{host:'due',come:'no'},{host:'tre',come:'si'}])}
      const e = await tellAllRelays('/key/abc', { method: 'PUT' }, 400);
      return JSON.stringify({ riusciti: e.riusciti });
    })()`);
    return r.then(x => {
      assert.strictEqual(JSON.parse(x).riusciti, 1, 'uno su tre: chi chiama deve poterlo sapere');
      app.stop();
    });
  });

});

test.describe('la casella dove i due telefoni si danno appuntamento', () => {

  const rete = (regole) => `
    window.__chiamate = [];
    fetch = (url, opts) => {
      window.__chiamate.push({ url, come: (opts && opts.method) || 'GET' });
      const r = (${JSON.stringify(regole)}).find(x => url.indexOf(x.host) >= 0);
      if (!r || r.come === 'errore') return Promise.reject(new Error('rete giu'));
      if (r.come === 'muto') return new Promise((_, no) => {
        opts.signal.addEventListener('abort', () => no(new Error('scaduto')));
      });
      const st = r.come === 'si' ? 200 : (r.come === 'lento' ? 429 : 404);
      return Promise.resolve({ ok: st === 200, status: st, json: () => Promise.resolve({ chi: r.host }) });
    };
    RELAYS.length = 0;
    RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
  `;

  test('IL BIGLIETTO VIENE DAVVERO LASCIATO SU TUTTI, non solo spedito a tutti', () => {
    /* Contare le richieste non basta e me ne sono accorto sabotando: anche
       "chiedi a tutti e tieni il primo" ne manda tre — poi pero ANNULLA le
       altre due appena una risponde, e su quei due relay il biglietto non
       arriva mai. La differenza si vede solo guardando le richieste annullate.
       Un relay lento fa emergere il caso: se qualcuno tiene il conto solo di
       quante ne partono, il difetto passa. */
    const app = loadApp();
    const r = app.run(`(async () => {
      window.__chiamate = []; window.__annullate = [];
      fetch = (url, opts) => {
        window.__chiamate.push(url);
        const lento = url.indexOf('uno.example') >= 0;
        return new Promise((ok, no) => {
          if (opts && opts.signal) opts.signal.addEventListener('abort', () => {
            window.__annullate.push(url); no(new Error('annullata'));
          });
          setTimeout(() => ok({ ok: true, status: 200, json: () => Promise.resolve({}) }), lento ? 40 : 1);
        });
      };
      RELAYS.length = 0;
      RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
      const ok = await mailboxPut('a'.repeat(64), { ciao: 1 });
      await new Promise(r => setTimeout(r, 80));
      return JSON.stringify({ ok, partite: window.__chiamate.length, annullate: window.__annullate });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.ok, true);
      assert.strictEqual(o.partite, 3, 'deve partire verso tutti e tre');
      assert.deepStrictEqual(o.annullate, [],
        'NESSUNA deve essere annullata: un biglietto interrotto e un biglietto non lasciato');
      app.stop();
    });
  });

  test('leggendo invece si annullano le altre appena una risponde', () => {
    /* Il rovescio esatto, e va bene cosi: il biglietto e lo stesso ovunque, e
       una volta trovato tenere aperte le altre richieste e traffico buttato. */
    const app = loadApp();
    const r = app.run(`(async () => {
      window.__annullate = [];
      fetch = (url, opts) => {
        const lento = url.indexOf('uno.example') >= 0;
        return new Promise((ok, no) => {
          if (opts && opts.signal) opts.signal.addEventListener('abort', () => {
            window.__annullate.push(url); no(new Error('annullata'));
          });
          setTimeout(() => ok({ ok: true, status: 200, json: () => Promise.resolve({ x: 1 }) }), lento ? 40 : 1);
        });
      };
      RELAYS.length = 0;
      RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
      const letto = await mailboxGet('a'.repeat(64));
      await new Promise(r => setTimeout(r, 80));
      return JSON.stringify({ letto: !!letto, annullate: window.__annullate.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.letto, true);
      assert.ok(o.annullate >= 1, 'la lenta va fermata invece di restare appesa');
      app.stop();
    });
  });

  test('basta un relay vivo perche l appuntamento regga', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'errore'},{host:'due',come:'errore'},{host:'tre',come:'si'}])}
      const messo = await mailboxPut('a'.repeat(64), { ciao: 1 });
      const letto = await mailboxGet('a'.repeat(64));
      return JSON.stringify({ messo, letto: !!letto, raggiungibile: brokerReachable });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.messo, true, 'uno che lo prende basta');
      assert.strictEqual(o.letto, true, 'e uno che lo restituisce basta');
      assert.strictEqual(o.raggiungibile, true);
      app.stop();
    });
  });

  test('se sono giu tutti, lo dice invece di far finta', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'errore'},{host:'due',come:'errore'},{host:'tre',come:'errore'}])}
      const messo = await mailboxPut('a'.repeat(64), { ciao: 1 });
      const letto = await mailboxGet('a'.repeat(64));
      return JSON.stringify({ messo, letto, raggiungibile: brokerReachable, rallenta: mailboxThrottled });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.messo, false);
      assert.strictEqual(o.letto, null);
      assert.strictEqual(o.raggiungibile, false, 'il servizio non e raggiungibile e va detto');
      assert.strictEqual(o.rallenta, false, 'e non e "rallenta": e proprio giu, sono due cose diverse');
      app.stop();
    });
  });

  test('LA DISTINZIONE CHE ERA GIA COSTATA UN DIFETTO: "rallenta" non e "giu"', () => {
    /* Con un relay solo bastava guardare lo stato della risposta. Con molti va
       ricostruita: se tutti dicono 429 l app deve frenare, non credersi
       irraggiungibile e insistere allo stesso ritmo. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'lento'},{host:'due',come:'lento'},{host:'tre',come:'lento'}])}
      const letto = await mailboxGet('a'.repeat(64));
      return JSON.stringify({ letto, raggiungibile: brokerReachable, rallenta: mailboxThrottled });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.letto, null);
      assert.strictEqual(o.raggiungibile, true, 'hanno risposto: sono vivi');
      assert.strictEqual(o.rallenta, true, 'e hanno chiesto di rallentare');
      app.stop();
    });
  });

  test('se uno accetta, non si frena solo perche un altro dice di rallentare', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'lento'},{host:'due',come:'si'},{host:'tre',come:'lento'}])}
      await mailboxPut('a'.repeat(64), { ciao: 1 });
      return JSON.stringify({ rallenta: mailboxThrottled });
    })()`);
    return r.then(x => {
      assert.strictEqual(JSON.parse(x).rallenta, false, 'uno ha preso il biglietto: non c e motivo di frenare');
      app.stop();
    });
  });

  test('la casella vuota resta una risposta sana, non un guasto', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete([{host:'uno',come:'vuota'},{host:'due',come:'vuota'},{host:'tre',come:'vuota'}])}
      const letto = await mailboxGet('a'.repeat(64));
      return JSON.stringify({ letto, raggiungibile: brokerReachable, rallenta: mailboxThrottled });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.letto, null, 'niente dentro');
      assert.strictEqual(o.raggiungibile, true, 'ma il servizio e sanissimo');
      assert.strictEqual(o.rallenta, false);
      app.stop();
    });
  });

});

test.describe('trovare qualcuno dal suo indirizzo, con piu relay', () => {

  /* Un indirizzo Logos e' l'impronta della chiave pubblica che ci sta dietro:
     per questo una chiave sbagliata si riconosce da sola, e per questo un relay
     bugiardo non puo' sostituirla. Ma con piu' relay nasce un pericolo nuovo,
     che con uno solo non esisteva: un relay guasto che risponde per primo con
     spazzatura potrebbe far fallire la ricerca mentre gli altri avevano la
     risposta giusta. Questi test difendono proprio quello. */

  const conKey = (regole) => `
    window.__chiamate = [];
    const vera = await myPubB64();
    const indirizzo = await myAddress(0);
    /* La chiave dell'impostore non e' spazzatura: e' una chiave P-256 VERA,
       generata qui, che semplicemente appartiene a un altro. Una stringa a caso
       verrebbe scartata da importKey e il test passerebbe senza mai arrivare al
       controllo dell'indirizzo — che e' l'unica cosa che deve fermare questo
       attacco. Scoperto sabotando: tolto quel controllo, il test restava verde. */
    const altro = await crypto.subtle.generateKey({ name:'ECDH', namedCurve:'P-256' }, true, ['deriveBits']);
    const altroPub = ab2b64(await crypto.subtle.exportKey('raw', altro.publicKey));
    fetch = (url, opts) => {
      window.__chiamate.push(url);
      const r = (${JSON.stringify(regole)}).find(x => url.indexOf(x.host) >= 0);
      if (!r || r.come === 'errore') return Promise.reject(new Error('giu'));
      if (r.come === 'vuoto') return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
      const corpo = r.come === 'buona'
        ? { p: vera, n: 0 }
        : { p: altroPub, n: 0 };   /* chiave vera, ma di un altro: solo l'indirizzo la smaschera */
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) });
    };
    RELAYS.length = 0;
    RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
  `;

  test('IL PERICOLO NUOVO: un relay che risponde per primo con una chiave falsa non fa fallire la ricerca', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${conKey([{host:'uno',come:'falsa'},{host:'due',come:'falsa'},{host:'tre',come:'buona'}])}
      const k = await fetchAddrKey(indirizzo);
      return JSON.stringify({ trovata: !!k, slot: k && k.slot, interrogati: window.__chiamate.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.trovata, true, 'la chiave buona del terzo relay doveva vincere');
      assert.strictEqual(o.slot, 0);
      assert.strictEqual(o.interrogati, 3, 'li interroga tutti, non si ferma al primo che risponde');
      app.stop();
    });
  });

  test('se MENTONO TUTTI non si crede a nessuno', () => {
    /* Il controllo resta l ultima parola: nessun relay e creduto perche e
       arrivato primo, e tre bugie non fanno una verita. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${conKey([{host:'uno',come:'falsa'},{host:'due',come:'falsa'},{host:'tre',come:'falsa'}])}
      const k = await fetchAddrKey(indirizzo);
      return JSON.stringify({ trovata: !!k });
    })()`);
    return r.then(x => {
      assert.strictEqual(JSON.parse(x).trovata, false, 'una chiave che non ricalcola l indirizzo va buttata');
      app.stop();
    });
  });

  test('basta un relay vivo per essere ancora raggiungibili', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${conKey([{host:'uno',come:'errore'},{host:'due',come:'vuoto'},{host:'tre',come:'buona'}])}
      const k = await fetchAddrKey(indirizzo);
      return JSON.stringify({ trovata: !!k, raggiungibile: brokerReachable });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.trovata, true);
      assert.strictEqual(o.raggiungibile, true);
      app.stop();
    });
  });

  test('la chiave viene pubblicata su TUTTI i relay, non sul primo', () => {
    /* Se la tua chiave sta in un posto solo, basta bloccare quel posto perche
       chi conosce il tuo indirizzo non riesca piu a raggiungerti. */
    const app = loadApp();
    const r = app.run(`(async () => {
      window.__put = [];
      fetch = (url, opts) => {
        if (opts && opts.method === 'PUT') window.__put.push(url);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      };
      RELAYS.length = 0; RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
      const ok = await publishAddrKey(0);
      return JSON.stringify({ ok, dove: window.__put.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.ok, true);
      assert.strictEqual(o.dove, 3, 'deve pubblicarla su tutti e tre');
      app.stop();
    });
  });

});

test.describe('il rosso che compare mentre invece si sta collegando', () => {

  const scena = `
    window.__pompaFerma = false;
    const pompa = { stop(){ window.__pompaFerma = true; } };
    const stato = { textContent: '', className: '' };
    const diag = { textContent: '', classList: { add(){}, remove(){} } };
    setStatus = (el, testo) => { if (el) el.textContent = testo; };
    connectionWorking = () => false;
    const finto = {
      connectionState: 'connecting',
      __ascolta: null,
      addEventListener(_, f){ this.__ascolta = f; },
      vai(s){ this.connectionState = s; this.__ascolta(); },
    };
    window.__esiti = [];
    watchHandshakeProgress(finto, stato, diag, pompa, ok => window.__esiti.push(ok));
  `;

  test('IL DIFETTO VISTO SUL TELEFONO: dopo aver detto "non riuscita", una connessione che riesce toglie il rosso', () => {
    /* Prima il rosso restava sullo schermo mentre la chat si apriva sotto: chi
       guardava leggeva "non e stato possibile collegarsi" dentro una
       conversazione che funzionava benissimo. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      finto.vai('failed');
      await new Promise(r => setTimeout(r, FAIL_GRACE_MS + 200));
      const dopoIlRosso = stato.textContent;
      finto.vai('connected');
      return JSON.stringify({ dopoIlRosso, allaFine: stato.textContent, esiti: window.__esiti });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.match(o.dopoIlRosso, /ancora provando/,
        'a venti secondi si dice che si sta ancora provando, NON che e fallita: e la verita, e i candidati partono ancora');
      assert.doesNotMatch(o.dopoIlRosso, /Non è stato possibile/,
        'nessun verdetto finche c e qualcosa da tentare');
      assert.strictEqual(o.allaFine, '', 'MA UNA VOLTA COLLEGATA IL MESSAGGIO DEVE SPARIRE');
      /* UNA VOLTA SOLA, e con "e andata bene". Prima a venti secondi si
         annunciava il fallimento anche a chi ascolta: schermate che si
         chiudevano, pulsanti che tornavano attivi, tutto per una connessione
         che stava per riuscire. Ora a venti secondi si dice soltanto che si
         sta ancora provando, e nessuno viene avvisato di un fallimento che non
         c e stato. */
      assert.deepStrictEqual(o.esiti, [true],
        'nessuno deve sentirsi dire che e fallita mentre l app sta ancora provando');
      app.stop();
    });
  });

  test('IL VERDETTO ARRIVA SOLO QUANDO NON C E PIU NIENTE DA TENTARE', () => {
    /* Dire "non e stato possibile" mentre l app sta ancora lavorando e la cosa
       che fa sembrare rotto un prodotto che funziona: si legge il rosso e
       trenta secondi dopo ci si trova nella conversazione. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      finto.vai('failed');
      await new Promise(r => setTimeout(r, FAIL_GRACE_MS + 200));
      const a20 = stato.textContent;
      await new Promise(r => setTimeout(r, PUMP_BACKSTOP_MS + 400));
      return JSON.stringify({ a20, allaFine: stato.textContent, pompaFerma: window.__pompaFerma, esiti: window.__esiti });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.match(o.a20, /ancora provando/, 'a venti secondi: sto provando');
      assert.match(o.allaFine, /Non è stato possibile/, 'alla fine, quando non resta niente: il verdetto');
      assert.strictEqual(o.pompaFerma, true, 'e solo allora si smette di mandare candidati');
      assert.deepStrictEqual(o.esiti, [false], 'chi ascolta viene avvisato una volta sola, alla fine');
      app.stop();
    });
  });

  test('dopo il rosso i candidati CONTINUANO a partire', () => {
    /* Prima, dichiarando il fallimento, si fermava anche l invio dei candidati:
       si toglieva alla connessione proprio la cosa che le avrebbe permesso di
       riuscire, un istante dopo aver detto che non ci riusciva. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      finto.vai('failed');
      await new Promise(r => setTimeout(r, FAIL_GRACE_MS + 200));
      return JSON.stringify({ rosso: !!stato.textContent, pompaFerma: window.__pompaFerma });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.rosso, true);
      assert.strictEqual(o.pompaFerma, false, 'la pompa dei candidati NON va fermata quando si annuncia il fallimento');
      app.stop();
    });
  });

  test('se si collega prima dell attesa, il rosso non compare mai', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      finto.vai('failed');
      await new Promise(r => setTimeout(r, 300));
      finto.vai('connected');
      await new Promise(r => setTimeout(r, FAIL_GRACE_MS + 200));
      return JSON.stringify({ testo: stato.textContent, esiti: window.__esiti, pompaFerma: window.__pompaFerma });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.testo, '', 'nessun messaggio: e andata bene e basta');
      assert.deepStrictEqual(o.esiti, [true], 'e nessuno deve aver sentito dire che era fallita');
      assert.strictEqual(o.pompaFerma, true, 'a connessione riuscita la pompa si ferma');
      app.stop();
    });
  });

  test('una connessione chiusa resta chiusa: quello si dice e basta', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      finto.vai('closed');
      await new Promise(r => setTimeout(r, 200));
      return JSON.stringify({ testo: stato.textContent, pompaFerma: window.__pompaFerma });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.match(o.testo, /Non è stato possibile/, 'una chiusa e definitiva');
      assert.strictEqual(o.pompaFerma, true, 'e li la pompa va fermata');
      app.stop();
    });
  });

});

test.describe('il pezzo che tiene l app in memoria', () => {

  const sorgente = () => require('fs').readFileSync(__dirname + '/../modifica.js', 'utf8');

  test('su Android non si registra: quel file nel pacchetto NON esiste', () => {
    /* Il pacchetto Android contiene un file solo, assets/logos.html. La
       registrazione di modifica-sw.js falliva quindi a ogni avvio — in
       silenzio, perche l errore veniva raccolto e buttato, ma era una
       richiesta destinata a fallire ogni volta. */
    const src = sorgente();
    const i = src.indexOf("serviceWorker' in navigator");
    assert.ok(i > 0, 'la registrazione deve esistere');
    const blocco = src.slice(i, src.indexOf('\n}', i));
    assert.ok(blocco.indexOf("appassets.androidplatform.net") > 0,
      'su Android non si deve registrare niente');
  });

  test('IL DIFETTO VISTO SULLO SCHERMO: il controllo non deve passare dalla cache', () => {
    /* "Una parte dell app e ancora vecchia" restava anche premendo "Controlla
       di nuovo": senza updateViaCache il browser cercava la versione nuova
       guardando la propria copia vecchia, e non poteva accorgersi di niente. */
    const src = sorgente();
    const i = src.indexOf('.register(');
    const blocco = src.slice(i, i + 260);
    assert.ok(blocco.indexOf("updateViaCache: 'none'") > 0,
      'il controllo della versione non deve essere servito dalla cache del browser');
    assert.ok(blocco.indexOf('.update()') > 0,
      'e va chiesto subito, invece di aspettare che il browser ci pensi');
  });

  test('la pagina e il pezzo in memoria dichiarano la STESSA versione', () => {
    /* Se i due numeri non coincidono l app dice "una parte e ancora vecchia" —
       ed e vero. Ma se non coincidono nel repository, lo direbbe a tutti per
       sempre, per colpa di una svista al momento di pubblicare. */
    const fs = require('fs');
    const js = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    const sw = fs.readFileSync(__dirname + '/../modifica-sw.js', 'utf8');
    const a = (js.match(/const APP_VERSION = '([^']+)'/) || [])[1];
    const b = (sw.match(/const CACHE = '([^']+)'/) || [])[1];
    assert.ok(a, 'APP_VERSION deve esistere');
    assert.strictEqual(b, a, 'modifica-sw.js dichiara una versione diversa da modifica.js');
  });

});

test.describe('chi vince diventa la connessione attiva', () => {

  test('IL DIFETTO DELLE TRE PAROLE: il canale che si apre porta con se la sua connessione', () => {
    /* Due sintomi, una causa. Il canale veniva appeso alla connessione GLOBALE,
       che con piu di un tentativo in ballo puo non essere quella su cui il
       canale si e aperto davvero. Da li: le tre parole calcolate da una parte e
       non dall altra (safetyDigest legge le impronte dalla connessione globale,
       e su quella sbagliata non trova niente), e il rosso che restava scritto
       mentre la chat si apriva. */
    const app = loadApp();
    const r = app.run(`
      const perdente = { chiusa: false, close(){ this.chiusa = true; }, connectionState: 'failed' };
      const vincente = { connectionState: 'connected' };
      pc = perdente;
      const canale = { binaryType: '', readyState: 'open' };
      wireDataChannel(canale, vincente);
      JSON.stringify({
        attivaEQuellaCheHaVinto: pc === vincente,
        canaleAppesoAllaVincente: vincente.__dc === canale,
        perdenteChiusa: perdente.chiusa,
      });
    `);
    return Promise.resolve(r).then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.attivaEQuellaCheHaVinto, true,
        'la connessione su cui si e aperto il canale deve diventare quella dell app');
      assert.strictEqual(o.canaleAppesoAllaVincente, true);
      assert.strictEqual(o.perdenteChiusa, true,
        'la perdente va chiusa: aperta farebbe sembrare questo telefono occupato con qualcuno');
      app.stop();
    });
  });

  test('se ha vinto proprio quella attiva, non si tocca niente', () => {
    const app = loadApp();
    const r = app.run(`
      const sola = { chiusa: false, close(){ this.chiusa = true; }, connectionState: 'connected' };
      pc = sola;
      wireDataChannel({ binaryType: '', readyState: 'open' }, sola);
      JSON.stringify({ ancoraLei: pc === sola, chiusaPerSbaglio: sola.chiusa });
    `);
    return Promise.resolve(r).then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.ancoraLei, true);
      assert.strictEqual(o.chiusaPerSbaglio, false, 'non deve chiudere la connessione che sta usando');
      app.stop();
    });
  });

  test('entrando in chat ogni messaggio di fallimento viene spento', () => {
    /* Se sei nella chat, la connessione E riuscita: nessun rosso puo
       sopravvivere a questo momento, da qualunque strada tu ci sia arrivato. */
    const app = loadApp();
    const r = app.run(`
      for (const id of SCHERMI_DI_ATTESA){ const el = $(id); el.textContent = 'Non è stato possibile collegarsi.'; el.className = 'status bad'; }
      for (const id of SCHERMI_DIAGNOSTICI){ $(id).classList.remove('hide'); }
      silenziaGliErroriDiConnessione();
      JSON.stringify({
        testi: SCHERMI_DI_ATTESA.map(id => $(id).textContent),
        rossi: SCHERMI_DI_ATTESA.filter(id => /\bbad\b/.test($(id).className)).length,
      });
    `);
    return Promise.resolve(r).then(x => {
      const o = JSON.parse(x);
      assert.deepStrictEqual(o.testi, ['','','',''], 'nessun messaggio deve restare');
      assert.strictEqual(o.rossi, 0, 'e nemmeno il colore rosso');
      app.stop();
    });
  });

});

test.describe('il saluto che fa partire le tre parole', () => {

  const finta = (statoCanale) => `
    window.__inviati = [];
    const conn = { close(){}, connectionState: 'connected' };
    pc = conn;
    enterChat = () => { window.__entrato = true; };
    myFingerprintHex = async () => 'aabb';
    notifyPref = () => false;
    const canale = {
      binaryType: '', readyState: '${statoCanale}', onopen: null,
      send(x){ window.__inviati.push(JSON.parse(x).type); },
      apri(){ this.readyState = 'open'; if (this.onopen) this.onopen(); },
    };
    wireDataChannel(canale, conn);
  `;

  test('IL DIFETTO DI UN LATO SOLO: un canale gia aperto saluta lo stesso', () => {
    /* Il saluto parte quando il canale si apre. Ma un canale ARRIVATO puo
       essere gia aperto nel momento in cui gli si attacca l ascoltatore: quell
       avviso non arriva mai, il saluto non parte, e l altra parte non fa mai
       partire il confronto delle tre parole. Colpisce solo chi RICEVE il canale
       — cioe chi digita il codice — ed e per questo che le parole comparivano
       sempre e solo su un lato. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${finta('open')}
      await new Promise(r => setTimeout(r, 60));
      return JSON.stringify({ inviati: window.__inviati, entrato: !!window.__entrato });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.deepStrictEqual(o.inviati, ['hello'], 'il saluto deve partire anche se il canale era gia aperto');
      assert.strictEqual(o.entrato, true, 'e la chat deve aprirsi');
      app.stop();
    });
  });

  test('un canale che si apre dopo saluta una volta sola, non due', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${finta('connecting')}
      await new Promise(r => setTimeout(r, 40));
      const primaDiAprirsi = window.__inviati.length;
      canale.apri();
      await new Promise(r => setTimeout(r, 60));
      return JSON.stringify({ primaDiAprirsi, dopo: window.__inviati });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.primaDiAprirsi, 0, 'finche non e aperto non si saluta');
      assert.deepStrictEqual(o.dopo, ['hello'], 'e quando si apre si saluta UNA volta');
      app.stop();
    });
  });

});

test.describe('i testi dell app', () => {

  test('NESSUNA CHIAVE SCRITTA DUE VOLTE: la seconda vince in silenzio', () => {
    /* In un oggetto JavaScript, una chiave che compare due volte non da nessun
       errore: vince l ultima, e la prima sparisce senza un fiato. Aggiungendo un
       messaggio con un nome gia usato (connect.slow) mi sono ritrovato la frase
       nuova ignorata e quella vecchia mostrata al suo posto, senza il minimo
       segnale. L ha presa un test; da qui in poi la prende questo. */
    const fs = require('fs');
    const src = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    const lingue = ['it','en','ar','bn','de','es','fr','hi','id','pt','ru','ur','zh'];
    const doppie = [];
    for (const l of lingue){
      const m = new RegExp('Object\\.assign\\(I18N\\.' + l + ',\\s*\\{').exec(src);
      assert.ok(m, 'blocco della lingua ' + l + ' non trovato');
      const blocco = src.slice(m.index + m[0].length, src.indexOf('\n});', m.index));
      const viste = Object.create(null);
      for (const k of blocco.match(/"[a-zA-Z][a-zA-Z0-9.]*":/g) || []){
        if (viste[k]) doppie.push(l + ' ' + k);
        viste[k] = 1;
      }
    }
    assert.deepStrictEqual(doppie, [], 'chiavi scritte due volte nello stesso blocco lingua');
  });

  test('ogni lingua ha le stesse chiavi dell italiano', () => {
    /* Una chiave che manca in una lingua fa comparire il testo inglese di
       riserva in mezzo a una schermata italiana — o, peggio, il nome tecnico
       della chiave. */
    const fs = require('fs');
    const src = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    const chiavi = (l) => {
      const m = new RegExp('Object\\.assign\\(I18N\\.' + l + ',\\s*\\{').exec(src);
      const blocco = src.slice(m.index + m[0].length, src.indexOf('\n});', m.index));
      return new Set((blocco.match(/"[a-zA-Z][a-zA-Z0-9.]*":/g) || []).map(x => x.slice(1, -2)));
    };
    const base = chiavi('it');
    const mancanti = [];
    for (const l of ['en','ar','bn','de','es','fr','hi','id','pt','ru','ur','zh']){
      const q = chiavi(l);
      for (const k of base) if (!q.has(k)) mancanti.push(l + '/' + k);
    }
    assert.deepStrictEqual(mancanti.slice(0, 12), [], 'testi presenti in italiano e mancanti altrove');
  });

});

test.describe('il lasciapassare per il ponte', () => {

  /* H-04 dell audit esterno: il worker dava a chiunque, senza domande, un
     lasciapassare valido 24 ore. Chi ne raccoglieva a sufficienza poteva far
     passare traffico proprio a spese di chi ospita il servizio, o esaurirne la
     capacita finche le chiamate vere non passavano piu. */

  test('IL DIFETTO H-04: le credenziali durano minuti, non un giorno intero', () => {
    const fs = require('fs');
    const worker = fs.readFileSync(__dirname + '/../turn-worker/worker.js', 'utf8');
    const m = worker.match(/const TURN_TTL_SECONDS = (\d+);/);
    assert.ok(m, 'TURN_TTL_SECONDS deve esistere');
    const secondi = parseInt(m[1], 10);
    assert.ok(secondi <= 900, 'non piu di quindici minuti: erano 86400 (un giorno)');
    assert.ok(secondi >= 120, 'ma nemmeno cosi corte da non bastare a far partire una chiamata');
  });

  test('IL LEGAME DA NON ROMPERE: l app li tiene MENO di quanto durano', () => {
    /* Il difetto peggiore che questa correzione poteva introdurre: accorciare
       la durata senza toccare per quanto l app li tiene avrebbe lasciato chi
       tiene l app aperta a lungo con un lasciapassare scaduto in mano, e le
       chiamate avrebbero smesso di passare dal ponte IN SILENZIO. Questo test
       esiste perche fra sei mesi qualcuno cambiera un numero solo. */
    const fs = require('fs');
    const worker = fs.readFileSync(__dirname + '/../turn-worker/worker.js', 'utf8');
    const client = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    const dura = parseInt(worker.match(/const TURN_TTL_SECONDS = (\d+);/)[1], 10) * 1000;
    const tiene = eval(client.match(/const ICE_REUSE_MS = ([^;]+);/)[1]);
    assert.ok(tiene < dura,
      'l app tiene le credenziali (' + (tiene/60000) + ' min) piu a lungo di quanto durino (' + (dura/60000) + ' min)');
    assert.ok(dura - tiene >= 60000,
      'serve almeno un minuto di margine fra quando si smette di usarle e quando scadono');
  });

  test('le credenziali fresche si riusano, quelle vecchie si richiedono', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      window.__chieste = 0;
      fetch = () => { window.__chieste++;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ iceServers: [{ urls: 'turn:x' }] }) }); };
      RELAYS.length = 0; RELAYS.push('https://uno.example');
      await fetchIceServers();
      const dopoLaPrima = window.__chieste;
      await fetchIceServers();
      const riusate = window.__chieste;
      /* si finge che sia passato il tempo */
      iceServersUntil = Date.now() - 1;
      await fetchIceServers();
      return JSON.stringify({ dopoLaPrima, riusate, dopoLaScadenza: window.__chieste });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.dopoLaPrima, 1, 'la prima volta si chiedono');
      assert.strictEqual(o.riusate, 1, 'finche sono fresche NON si richiedono: costano denaro vero');
      assert.strictEqual(o.dopoLaScadenza, 2, 'ma quando invecchiano si rinnovano da sole');
      app.stop();
    });
  });

});

test.describe('dove vanno i secondi', () => {

  /* Misurare, non migliorare. "Ci mette troppo" e un sintomo: senza sapere
     QUALE tappa e lenta, qualunque correzione e un ipotesi. */

  test('le quattro tappe finiscono in una riga leggibile', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      tempiInizio();
      await new Promise(r => setTimeout(r, 30)); tempiSegna('preparazione');
      await new Promise(r => setTimeout(r, 30)); tempiSegna('attesa');
      await new Promise(r => setTimeout(r, 30)); tempiSegna('scambio');
      await new Promise(r => setTimeout(r, 30)); tempiSegna('rete');
      return tempiRiga();
    })()`);
    return r.then(riga => {
      for (const tappa of ['preparazione','attesa','scambio','rete']){
        assert.match(riga, new RegExp(tappa), 'manca la tappa ' + tappa);
      }
      assert.match(riga, /totale/, 'deve dire anche il totale');
      assert.match(riga, /\ds/, 'i tempi vanno scritti in secondi, non in millesimi');
      app.stop();
    });
  });

  test('senza aver misurato niente non inventa una riga', () => {
    const app = loadApp();
    const r = app.run('tempiRiga()');
    return Promise.resolve(r).then(x => {
      assert.strictEqual(x, '', 'meglio niente che un numero finto');
      app.stop();
    });
  });

  test('IL PATTO DI QUESTA MODIFICA: misura e basta, non cambia il comportamento', () => {
    /* La promessa fatta a chi usa l app era "rischio zero, aggiunge solo un
       numero". Questo test la tiene: i cronometri non devono decidere niente,
       non devono fermare niente, non devono spostare niente. Se un giorno
       qualcuno ci appende una decisione, questo test glielo ricorda. */
    const fs = require('fs');
    const src = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    for (const nome of ['tempiInizio','tempiSegna','tempiRiga']){
      const i = src.indexOf('function ' + nome);
      assert.ok(i > 0, nome + ' deve esistere');
      const corpo = src.slice(i, src.indexOf('\n}', i));
      assert.ok(corpo.indexOf('return ') < 0 || nome === 'tempiRiga',
        nome + ' non deve decidere niente per chi lo chiama');
      for (const vietato of ['pc.', 'mailbox', 'fetch(', 'setStatus', 'showScreen', 'close()']){
        assert.ok(corpo.indexOf(vietato) < 0,
          nome + ' tocca "' + vietato + '": deve solo misurare');
      }
    }
  });

  test('misurare due collegamenti di fila non mescola i tempi', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      tempiInizio(); await new Promise(r => setTimeout(r, 20)); tempiSegna('preparazione');
      const primo = tempiRiga();
      tempiInizio(); await new Promise(r => setTimeout(r, 20)); tempiSegna('preparazione');
      return JSON.stringify({ primo, secondo: tempiRiga() });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual((o.secondo.match(/preparazione/g) || []).length, 1,
        'il secondo collegamento deve ripartire da zero, non accodarsi al primo');
      app.stop();
    });
  });

});

test.describe('le tre parole: silenzio al primo contatto, allarme se cambia', () => {

  const scena = `
    window.__pannello = [];
    showSasPanel = async (tipo) => { window.__pannello.push(tipo); };
    window.__spilla = [];
    paintVerifyBadge = (s) => { window.__spilla.push(s); };
    computeSafetyCode = async () => 'codice-di-oggi';
    remoteFpHex = () => 'ffee';
    sysLine = () => {};
    scannedFp = null;
  `;

  test('PRIMO CONTATTO: nessun pannello, perche nessuno puo rispondere a quella domanda', () => {
    /* Confrontare le tre parole richiede un SECONDO canale — sentirsi a voce o
       essere nella stessa stanza. Con uno sconosciuto raggiunto per link quel
       canale non esiste, e il pannello chiedeva una cosa impossibile. Chi
       premeva "si, coincidono" senza aver confrontato niente si registrava
       come verificato: una spunta che non vuol dire niente e peggio di nessuna
       spunta. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      localStorage.removeItem('dvlogos-safety-fp-ffee');
      await checkSafetyFor('Sconosciuto');
      return JSON.stringify({ pannelli: window.__pannello, spilla: window.__spilla });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.deepStrictEqual(o.pannelli, [], 'nessun pannello al primo contatto');
      assert.deepStrictEqual(o.spilla, ['new'], 'ma la spilla dice che non e ancora verificato');
      app.stop();
    });
  });

  test("L ALLARME RESTA: un contatto che CAMBIA lo grida da solo", () => {
    /* Questo non e un invito a controllare: e un allarme. Va detto senza che
       nessuno debba chiederlo. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      localStorage.setItem('dvlogos-safety-fp-ffee', JSON.stringify({ code: 'un-altro-codice', since: 1 }));
      await checkSafetyFor('Giulia');
      return JSON.stringify({ pannelli: window.__pannello, spilla: window.__spilla });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.deepStrictEqual(o.pannelli, ['changed'], 'un contatto cambiato deve gridare');
      assert.deepStrictEqual(o.spilla, ['changed']);
      app.stop();
    });
  });

  test('un contatto gia verificato resta silenzioso', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${scena}
      localStorage.setItem('dvlogos-safety-fp-ffee', JSON.stringify({ code: 'codice-di-oggi', since: 1 }));
      await checkSafetyFor('Giulia');
      return JSON.stringify({ pannelli: window.__pannello, spilla: window.__spilla });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.deepStrictEqual(o.pannelli, [], 'chi e gia verificato non va disturbato');
      assert.deepStrictEqual(o.spilla, ['ok']);
      app.stop();
    });
  });

  test('IL CODICE RESTA RAGGIUNGIBILE: il tasto "verifica" esiste ancora', () => {
    /* Togliere il pannello non deve togliere il codice: quando due persone si
       sentono DAVVERO, devono poterlo confrontare — e allora quella spunta
       vale, perche l hanno fatta davvero. */
    const fs = require('fs');
    const html = fs.readFileSync(__dirname + '/../modifica.html', 'utf8');
    assert.ok(html.indexOf('id="btnVerify"') > 0, 'il tasto per vedere il codice deve restare');
    const js = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    assert.ok(js.indexOf("$('btnVerify').addEventListener") > 0, 'e deve fare ancora qualcosa');
  });

});

test.describe('il link porta un segreto lungo (audit H-01)', () => {

  /* Sei cifre sono un milione di combinazioni: chi puo osservare le caselle del
     servizio puo, in teoria, provarle tutte. La correzione non e allungare il
     codice — va dettato a voce — ma togliergli il SECONDO lavoro: le sei cifre
     dicono DOVE incontrarsi, il segreto lungo dice COME aprire. */

  test('IL PUNTO PIU DELICATO: il posto dell appuntamento NON cambia', () => {
    /* Se il segreto lungo spostasse anche la casella, chi ha una versione
       vecchia cercherebbe dove ha sempre cercato e i due non si troverebbero
       mai piu. Sarebbe la v17 daccapo: invisibile ai test, devastante sui
       telefoni. Il seme deve restare IDENTICO con e senza segreto. */
    const app = loadApp();
    const r = app.run(`(async () => {
      const senza = await quickSecrets('123456');
      const con   = await quickSecrets('123456', 'UnSegretoLungoDiEsempio1234');
      return JSON.stringify({ semeSenza: senza.seed, semeCon: con.seed });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.semeCon, o.semeSenza,
        'IL SEME DEVE RESTARE IDENTICO: e il posto dove i due si incontrano');
      app.stop();
    });
  });

  test('ma la chiave per aprire la busta CAMBIA', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      const senza = await quickSecrets('123456');
      const con   = await quickSecrets('123456', 'UnSegretoLungoDiEsempio1234');
      const busta = await sealWith(con, { testo: 'ciao' });
      /* chi ha solo le sei cifre non deve riuscire ad aprirla */
      const conLaChiaveSbagliata = await openFrom(senza.key, busta).catch(() => null);
      return JSON.stringify({ apertaConSbagliata: conLaChiaveSbagliata });
    })()`);
    return r.then(x => {
      assert.strictEqual(JSON.parse(x).apertaConSbagliata, null,
        'indovinare le sei cifre non deve piu bastare ad aprire');
      app.stop();
    });
  });

  test('LA COMPATIBILITA: un link vecchio senza segreto funziona ancora', () => {
    /* Chi ha la versione vecchia manda un link con le sole sei cifre. Deve
       collegarsi lo stesso, o questa correzione spezzerebbe in due chi usa
       l app. */
    const app = loadApp();
    const r = app.run(`(async () => {
      const a = await quickSecrets('654321');
      const b = await quickSecrets('654321', '');
      const busta = await sealWith(a, { testo: 'invito vecchio' });
      const aperta = await openFrom(b.key, busta);
      return JSON.stringify({ semiUguali: a.seed === b.seed, contenuto: aperta && aperta.testo });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.semiUguali, true, 'stessa casella');
      assert.strictEqual(o.contenuto, 'invito vecchio', 'e la busta si apre come sempre');
      app.stop();
    });
  });

  test('il segreto e lungo abbastanza da non potersi indovinare', () => {
    const app = loadApp();
    const r = app.run(`JSON.stringify({
      lunghezza: makeQuickSecret().length,
      byte: QUICK_SECRET_BYTES,
      diversi: new Set([makeQuickSecret(), makeQuickSecret(), makeQuickSecret()]).size,
      sicuroPerUrl: /^[A-Za-z0-9_-]+$/.test(makeQuickSecret()),
    })`);
    return Promise.resolve(r).then(x => {
      const o = JSON.parse(x);
      assert.ok(o.byte >= 16, 'almeno 128 bit, come indica l analisi');
      assert.strictEqual(o.diversi, 3, 'ogni invito ne genera uno nuovo');
      assert.strictEqual(o.sicuroPerUrl, true, 'deve stare in un link senza travestimenti');
      app.stop();
    });
  });

  test('il link lo porta con se, e senza segreto resta come prima', () => {
    const app = loadApp();
    const r = app.run(`
      quickLinkSecret = 'SegretoDiProvaLungoAbbastanza123';
      const conSegreto = quickLink('112233');
      quickLinkSecret = '';
      JSON.stringify({ conSegreto, senza: quickLink('112233') });
    `);
    return Promise.resolve(r).then(x => {
      const o = JSON.parse(x);
      assert.match(o.conSegreto, /#q=112233&s=SegretoDiProvaLungoAbbastanza123/,
        'il link deve portare sia il codice sia il segreto');
      assert.match(o.senza, /#q=112233$/, 'e senza segreto deve restare il link di prima');
      app.stop();
    });
  });

  test('digitare a mano azzera un segreto rimasto da un link precedente', () => {
    /* Se ne restasse uno attaccato, la chiave sarebbe sbagliata e il
       collegamento fallirebbe senza spiegazione. */
    const app = loadApp();
    const r = app.run(`
      /* Il finto browser non ha Event, quindi si chiama direttamente il
         gestore registrato: e lo stesso codice che gira quando una persona
         digita davvero. */
      quickJoinSecret = 'RestoDiUnLinkApertoPrima123456';
      tryQuickConnect = () => {};
      $('quickCodeIn').value = '99';
      const gestori = $('quickCodeIn').listeners && $('quickCodeIn').listeners['input'];
      if (gestori) gestori.forEach(f => f());
      quickJoinSecret;
    `);
    return Promise.resolve(r).then(x => {
      assert.strictEqual(x, '', 'digitare a mano vuol dire nessun segreto lungo');
      app.stop();
    });
  });

});

test.describe('le due strade devono restare compatibili', () => {

  /* ⚠️ IL TEST CHE MANCAVA IL 31 AGOSTO, e la cui assenza ha rotto i
     collegamenti veri. Avevo verificato che il seme non cambiasse e che la
     busta col segreto non si aprisse senza — ma NON avevo verificato il caso
     che conta di piu: chi mostra l invito non sa se l altro arrivera dal link
     o digitando le sei cifre a mano, e sigillando col segreto lungo rendeva
     impossibile la seconda strada. "Codice scaduto o sbagliato" su un codice
     giusto. Questo test tiene chiusa quella porta. */

  test('CHI DIGITA A MANO DEVE POTER APRIRE quello che chi mostra ha sigillato', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      /* chi mostra il codice prepara l invito */
      const chiMostra = await quickSecrets('458538');
      const busta = await sealWith(chiMostra, { sdp: 'offerta' });
      /* chi digita le sei cifre a mano: nessun segreto lungo */
      const chiDigita = await quickSecrets('458538');
      const aperta = await openFrom(chiDigita.key, busta);
      return JSON.stringify({
        stessaCasella: chiMostra.seed === chiDigita.seed,
        aperta: aperta && aperta.sdp,
      });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.stessaCasella, true, 'devono cercarsi nello stesso posto');
      assert.strictEqual(o.aperta, 'offerta',
        'CHI DIGITA A MANO DEVE APRIRE: se non ci riesce, le sei cifre non servono piu a niente');
      app.stop();
    });
  });

  test('e chi arriva dal link apre la stessa busta', () => {
    /* Finche il segreto lungo e inerte, entrambe le strade portano alla stessa
       chiave — ed e esattamente quello che rende il collegamento possibile. */
    const app = loadApp();
    const r = app.run(`(async () => {
      const chiMostra = await quickSecrets('458538');
      const busta = await sealWith(chiMostra, { sdp: 'offerta' });
      const dalLink = await quickSecrets('458538');
      const aperta = await openFrom(dalLink.key, busta);
      return aperta && aperta.sdp;
    })()`);
    return r.then(x => {
      assert.strictEqual(x, 'offerta', 'anche chi arriva dal link deve aprire');
      app.stop();
    });
  });

});

test.describe('pulisci tutto', () => {

  const pieno = `
    window.__store = new Map();
    mediaDeleteOlderThan = (cutoff) => {
      for (const [k, v] of [...window.__store]) if (v.t < cutoff) window.__store.delete(k);
      return Promise.resolve();
    };
    localStorage.setItem('dvlogos-contacts', JSON.stringify([{nick:'Giulia',fp:'aaaa'},{nick:'Marco',fp:'bbbb'}]));
    localStorage.setItem('dvlogos-history-fp-aaaa', JSON.stringify([{html:'parole di Giulia',mine:false,t:1}]));
    localStorage.setItem('dvlogos-history-fp-bbbb', JSON.stringify([{html:'parole di Marco',mine:false,t:1}]));
    localStorage.setItem('dvlogos-safety-fp-aaaa', JSON.stringify({code:'luna gatto pane',since:1}));
    localStorage.setItem('dvlogos-letters', JSON.stringify([{id:'x',testo:'un messaggio lasciato'}]));
    localStorage.setItem('dvlogos-burners', JSON.stringify([{n:3,name:'Divano usato'}]));
    /* quello che NON deve sparire: e chi sei, non cosa hai detto */
    localStorage.setItem('dvlogos-id', 'la-mia-identita');
    localStorage.setItem('dvlogos-nick', 'Giuseppe');
    localStorage.setItem('dvlogos-lang', 'it');
    localStorage.setItem('dvlogos-autoclean', '1');
    window.__store.set('foto1', { t: 1, blob: 'FOTO' });
    window.__store.set('foto2', { t: 1, blob: 'VIDEO' });
  `;

  test('cancella messaggi, contatti, verifiche, lettere e foto', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${pieno}
      await wipeEverything();
      return JSON.stringify({
        contatti: localStorage.getItem('dvlogos-contacts'),
        storiaG: localStorage.getItem('dvlogos-history-fp-aaaa'),
        storiaM: localStorage.getItem('dvlogos-history-fp-bbbb'),
        verifica: localStorage.getItem('dvlogos-safety-fp-aaaa'),
        lettere: localStorage.getItem('dvlogos-letters'),
        usaEGetta: localStorage.getItem('dvlogos-burners'),
        fotoRimaste: window.__store.size,
      });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.contatti, null, 'i contatti devono sparire');
      assert.strictEqual(o.storiaG, null, 'le conversazioni devono sparire');
      assert.strictEqual(o.storiaM, null, 'tutte, non una');
      assert.strictEqual(o.verifica, null, 'anche le verifiche a tre parole');
      assert.strictEqual(o.lettere, null, 'anche i messaggi lasciati da chi non ti ha trovato');
      assert.strictEqual(o.usaEGetta, null, 'anche gli indirizzi usa e getta');
      assert.strictEqual(o.fotoRimaste, 0, 'LE FOTO E I VIDEO DEVONO SPARIRE: cancellare le conversazioni e lasciare le immagini sarebbe la promessa mantenuta a meta');
      app.stop();
    });
  });

  test('IL RISCHIO PEGGIORE: non tocca il magazzino dell identita', () => {
    /* L identita del dispositivo NON sta in localStorage: sta in un magazzino
       IndexedDB tutto suo, `dvlogos-id`, separato da quello delle foto
       (`dvlogos-media`). Il mio primo test controllava localStorage e quindi
       non provava niente di vero. Se la pulizia toccasse quel magazzino, chi
       preme il pulsante perderebbe il proprio indirizzo e nessuno riuscirebbe
       piu a raggiungerlo — il danno peggiore possibile, da un pulsante che
       promette solo di cancellare messaggi. Verificato anche a mano in un
       browser vero: indirizzo identico prima e dopo. */
    const fs = require('fs');
    const src = fs.readFileSync(__dirname + '/../modifica.js', 'utf8');
    const i = src.indexOf('async function wipeEverything(){');
    const corpo = src.slice(i, src.indexOf('\n}', i));
    assert.ok(i > 0, 'wipeEverything deve esistere');
    assert.ok(corpo.indexOf('ID_DB') < 0, 'la pulizia non deve nominare il magazzino dell identita');
    assert.ok(corpo.indexOf('deleteDatabase') < 0, 'e non deve distruggere nessun magazzino intero');
    assert.ok(corpo.indexOf('mediaDeleteOlderThan') > 0, 'deve svuotare le foto, e solo quelle');
  });

  test('MA NON cancella le impostazioni: la lista di cio che resta', () => {
    /* Chi ha il tuo indirizzo deve continuare a trovarti. Cancellare anche
       l identita e una cosa diversa, e si fa dal pulsante suo: chi preme
       "pulisci tutto" vuole far sparire cio che ha detto, non sparire lui. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${pieno}
      await wipeEverything();
      return JSON.stringify({
        identita: localStorage.getItem('dvlogos-id'),
        nome: localStorage.getItem('dvlogos-nick'),
        lingua: localStorage.getItem('dvlogos-lang'),
        pulizia: localStorage.getItem('dvlogos-autoclean'),
      });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.identita, 'la-mia-identita', "l identita del dispositivo NON va toccata");
      assert.strictEqual(o.nome, 'Giuseppe', 'il tuo nome resta');
      assert.strictEqual(o.lingua, 'it', 'e le impostazioni pure');
      assert.strictEqual(o.pulizia, '1', 'compresa la pulizia automatica');
      app.stop();
    });
  });

  test('non tocca quello che non e suo', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${pieno}
      localStorage.setItem('roba-di-un-altro-sito', 'non toccare');
      await wipeEverything();
      return localStorage.getItem('roba-di-un-altro-sito');
    })()`);
    return r.then(x => {
      assert.strictEqual(x, 'non toccare', 'deve cancellare solo le proprie chiavi');
      app.stop();
    });
  });

  test('su un telefono gia vuoto non si lamenta', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      window.__store = new Map();
      mediaDeleteOlderThan = () => Promise.resolve();
      return await wipeEverything();
    })()`);
    return r.then(x => { assert.strictEqual(x, true); app.stop(); });
  });

});

test.describe('le lettere sigillate su piu relay', () => {

  /* Una rete finta che TIENE davvero le lettere, una cassetta per relay: cosi
     si controlla DOVE sono finite, non solo quante richieste sono partite.
     Quali relay sono spenti si cambia a caldo con window.__giu, senza svuotare
     le cassette — serve per il caso in cui una lettera arriva mentre uno e giu
     e viene raccolta dopo che e tornato su. */
  const rete = `
    window.__cassette = { 'uno.example': {}, 'due.example': {}, 'tre.example': {} };
    window.__giu = [];
    window.__manomette = null;
    fetch = (url, opts) => {
      const host = ['uno.example','due.example','tre.example'].find(h => url.indexOf(h) >= 0);
      if (!host || window.__giu.indexOf(host) >= 0) return Promise.reject(new Error('relay giu'));
      const pezzi = (url.split('/letter/')[1] || '').split('/');
      const box = pezzi[0], id = pezzi[1];
      const c = window.__cassette[host];
      if (opts && opts.method === 'PUT'){
        c[box] = c[box] || {};
        c[box][id] = opts.body;
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      }
      const dentro = c[box] ? Object.keys(c[box]).map(k => {
        const v = c[box][k];
        /* La manomissione deve cambiare DAVVERO il carattere: sostituirlo con
           una lettera fissa non manometteva niente quando era gia quella, e il
           test falliva a caso circa una volta su sessanta. */
        return window.__manomette === host
          ? v.replace(/"c":"(.)/, (m, c) => '"c":"' + (c === 'Z' ? 'Y' : 'Z')) : v;
      }) : [];
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(dentro) });
    };
    RELAYS.length = 0;
    RELAYS.push('https://uno.example', 'https://due.example', 'https://tre.example');
    const mioIndirizzo = await myAddress(0);
    const miaPub = await myPubB64();
    /* si finge di conoscere gia la chiave verificata dell indirizzo: e cio che
       letterPut pretende prima di sigillare qualunque cosa */
    fetchAddrKey = async () => ({
      key: await crypto.subtle.importKey('raw', b642ab(miaPub), { name:'ECDH', namedCurve:'P-256' }, false, []),
      slot: 0,
    });
    const quante = (h) => { const b = Object.keys(window.__cassette[h])[0];
                            return b ? Object.keys(window.__cassette[h][b]).length : 0; };
    const bustaDi = (h) => { const b = Object.keys(window.__cassette[h])[0]; if (!b) return null;
                             const k = Object.keys(window.__cassette[h][b])[0];
                             return k ? window.__cassette[h][b][k] : null; };
  `;

  test('PROPRIETA 1: la lettera viene depositata DAVVERO su tutti i relay, identica', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      const ok = await letterPut(mioIndirizzo, { testo: 'ci vediamo domani' });
      const b = ['uno.example','due.example','tre.example'].map(bustaDi);
      return JSON.stringify({
        ok, quante: ['uno.example','due.example','tre.example'].map(quante),
        identiche: b[0] === b[1] && b[1] === b[2] && !!b[0],
        inChiaro: !!(b[0] && b[0].indexOf('ci vediamo domani') >= 0),
      });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.ok, true, 'il deposito deve riuscire');
      assert.deepStrictEqual(o.quante, [1,1,1], 'la lettera deve esserci su tutti e tre');
      assert.strictEqual(o.identiche, true,
        'la busta deve essere IDENTICA ovunque: sigillata una volta sola, non una per relay');
      assert.strictEqual(o.inChiaro, false, 'il testo non deve comparire in chiaro nella busta');
      app.stop();
    });
  });

  test('PROPRIETA 2: raccogliendo da tre relay non nascono doppioni', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      await letterPut(mioIndirizzo, { testo: 'una sola volta' });
      const lette = await letterGet(mioIndirizzo);
      return JSON.stringify({ quante: lette.length, testo: lette[0] && lette[0].testo });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.quante, 1, 'una lettera su tre relay deve restare UNA, non tre');
      assert.strictEqual(o.testo, 'una sola volta');
      app.stop();
    });
  });

  test('PROPRIETA 3: un relay che manomette viene scartato, e la lettera arriva lo stesso', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      await letterPut(mioIndirizzo, { testo: 'contenuto autentico' });
      window.__manomette = 'uno.example';
      const lette = await letterGet(mioIndirizzo);
      return JSON.stringify({ quante: lette.length, testo: lette[0] && lette[0].testo });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.quante, 1, 'la manomessa va scartata e la sana deve restare');
      assert.strictEqual(o.testo, 'contenuto autentico', 'il contenuto non deve essere quello alterato');
      app.stop();
    });
  });

  test('PROPRIETA 3b: se manomettono TUTTI, non passa niente invece di passare spazzatura', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      await letterPut(mioIndirizzo, { testo: 'autentico' });
      const originale = fetch;
      fetch = (url, opts) => (opts && opts.method === 'PUT') ? originale(url, opts)
        : originale(url, opts).then(async res => {
            const d = await res.json();
            return { ok: true, status: 200,
                     json: () => Promise.resolve(d.map(v =>
                       v.replace(/"c":"(.)/, (m, c) => '"c":"' + (c === 'Z' ? 'Y' : 'Z')))) };
          });
      const lette = await letterGet(mioIndirizzo);
      return JSON.stringify({ quante: lette.length });
    })()`);
    return r.then(x => {
      assert.strictEqual(JSON.parse(x).quante, 0, 'meglio niente che un contenuto non autentico');
      app.stop();
    });
  });

  test('PROPRIETA 4: la scadenza dei 7 giorni non e stata toccata', () => {
    const worker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');
    assert.ok(/const LETTER_TTL_SECONDS = 7 \* 24 \* 3600;/.test(worker),
      'la settimana di conservazione e una promessa fatta a chi le usa');
    assert.ok(/expirationTtl: LETTER_TTL_SECONDS/.test(worker),
      'la scadenza deve restare applicata alla scrittura della lettera');
  });

  test('PROPRIETA 5: un relay spento non impedisce agli altri di funzionare', () => {
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      window.__giu = ['due.example'];
      const ok = await letterPut(mioIndirizzo, { testo: 'passa lo stesso' });
      const lette = await letterGet(mioIndirizzo);
      return JSON.stringify({ ok, quante: lette.length, testo: lette[0] && lette[0].testo });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.ok, true, 'due relay vivi bastano per depositare');
      assert.strictEqual(o.quante, 1);
      assert.strictEqual(o.testo, 'passa lo stesso');
      app.stop();
    });
  });

  test('PROPRIETA 5b: la lettera lasciata mentre gli altri erano giu NON va persa', () => {
    /* Il motivo per cui la raccolta unisce invece di fermarsi al primo che
       risponde: se un relay era spento quando la lettera e arrivata, quella
       lettera esiste soltanto sull altro — e sono proprio quelle lasciate nei
       momenti peggiori. Fermarsi al primo le farebbe sparire. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      window.__giu = ['uno.example','due.example'];
      await letterPut(mioIndirizzo, { testo: 'lasciata al buio' });
      window.__giu = [];                       /* tornano su, ma vuoti */
      const lette = await letterGet(mioIndirizzo);
      return JSON.stringify({
        quante: lette.length, testo: lette[0] && lette[0].testo,
        soloSuTre: quante('uno.example') === 0 && quante('due.example') === 0 && quante('tre.example') === 1,
      });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.soloSuTre, true, 'la lettera deve stare su un relay solo, per il senso della prova');
      assert.strictEqual(o.quante, 1, 'e deve essere trovata lo stesso');
      assert.strictEqual(o.testo, 'lasciata al buio');
      app.stop();
    });
  });

  test('PROPRIETA 6: senza chiave verificata la lettera NON parte, invece di partire in chiaro', () => {
    /* La garanzia piu importante: meglio non spedire che spedire leggibile.
       Il multi-relay non deve averla indebolita. */
    const app = loadApp();
    const r = app.run(`(async () => {
      ${rete}
      fetchAddrKey = async () => null;   /* nessuna chiave verificabile */
      const ok = await letterPut(mioIndirizzo, { testo: 'segreto' });
      const scritti = ['uno.example','due.example','tre.example'].filter(h => quante(h) > 0);
      return JSON.stringify({ ok, relayScritti: scritti.length });
    })()`);
    return r.then(x => {
      const o = JSON.parse(x);
      assert.strictEqual(o.ok, false, 'senza chiave verificata deve rifiutarsi');
      assert.strictEqual(o.relayScritti, 0, 'e non deve aver scritto NIENTE da nessuna parte');
      app.stop();
    });
  });

});

test.describe('una connessione abbandonata non rende sordo il telefono', () => {

  test("una 'connecting' piantata smette di bloccare, come una 'new'", () => {
    /* Segnalato da due telefoni che non si collegavano piu ne con l'indirizzo
       ne col codice, e che tornavano a funzionare solo ammazzando l'app. La
       scadenza copriva soltanto 'new', e un tentativo che arriva a 'connecting'
       e li si pianta e proprio come finisce una chiamata fra due dispositivi
       che non riescono a raggiungersi. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'connecting';
      pc.__bornAt = Date.now() - 10 * 60000;   /* dieci minuti fa */
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), false,
      "una 'connecting' di dieci minuti fa e un tentativo morto, non una chiamata");
    app.stop();
  });

  test("una 'connecting' appena nata continua a bloccare", () => {
    /* Il lato da non rompere: mentre una connessione si sta davvero stabilendo,
       un secondo tentativo deve ancora essere tenuto fuori. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'connecting';
      pc.__bornAt = Date.now();
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), true,
      'una connessione che si sta stabilendo adesso deve bloccarne una seconda');
    app.stop();
  });

  test('una chiamata vera non viene liberata dal passare del tempo', () => {
    /* La ragione per cui la scadenza non puo guardare solo l'eta: una
       conversazione in corso da un'ora e piu vecchia di qualunque soglia, ed e
       esattamente cio che deve continuare a contare come occupato. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'connected';
      pc.__lastOkAt = Date.now() - 60 * 60000;
      pc.__bornAt = Date.now() - 60 * 60000;   /* un'ora fa */
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), true,
      "una chiamata in corso da un'ora resta una chiamata in corso");
    app.stop();
  });

  test('una chiamata caduta un attimo fa blocca ancora: potrebbe tornare', () => {
    /* Un tunnel, un ascensore, il wifi che passa al 4G: torna da sola in
       qualche secondo, e strapparla di mano a chi sta parlando sarebbe peggio
       del difetto. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'disconnected';
      pc.__bornAt = Date.now() - 60 * 60000;
      pc.__lastOkAt = Date.now() - 5000;      /* funzionava cinque secondi fa */
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), true,
      'cinque secondi fa era viva: si aspetta che torni');
    app.stop();
  });

  test('una chiamata caduta e mai tornata smette di bloccare', () => {
    /* IL DIFETTO SEGNALATO. La correzione precedente esentava dalla scadenza
       qualunque connessione che fosse riuscita almeno una volta, e
       'disconnected' non e ne 'closed' ne 'failed': una chiamata caduta restava
       li per sempre. Il pannello diagnostico del telefono diceva "in pausa: sei
       gia in una conversazione" mentre il suo proprietario guardava le
       impostazioni, senza nessuna conversazione aperta. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'disconnected';
      pc.__bornAt = Date.now() - 60 * 60000;
      pc.__lastOkAt = Date.now() - 20 * 60000;   /* caduta venti minuti fa */
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), false,
      'caduta venti minuti fa e finita: non deve rendere sordo il telefono');
    app.stop();
  });

  test('una chiamata in corso non viene liberata per anzianita', () => {
    /* Il lato da non rompere: una conversazione che dura da un'ora e proprio
       cio che deve continuare a bloccarne una seconda. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'connected';
      pc.__bornAt = Date.now() - 60 * 60000;
      pc.__lastOkAt = Date.now() - 60 * 60000;
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), true,
      "una chiamata in corso da un'ora resta una chiamata in corso");
    app.stop();
  });

  test('un handshake davvero in corso continua a bloccarne un secondo', () => {
    /* Il lato da non rompere: se questo cede, due tentativi si calpestano a
       vicenda e la correzione sarebbe peggiore del difetto. */
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'new';
      pc.__bornAt = Date.now();          /* nato adesso: si sta costruendo davvero */
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), true,
      'una connessione appena creata sta legittimamente lavorando e deve bloccare');
    app.stop();
  });

  test("una 'new' più vecchia di qualunque costruzione onesta smette di bloccare", () => {
    const app = loadApp();
    app.run(`
      pc = new RTCPeerConnection(); quickSharePc = null;
      pc.connectionState = 'new';
      pc.__bornAt = Date.now() - (STALE_BUILD_MS + 1000);
    `);
    assert.strictEqual(app.run('busyWithSomeone()'), false,
      'dopo tre minuti in "new" non si sta costruendo piu niente: era un tentativo abbandonato');
    app.stop();
  });

  test('la soglia lascia margine alla piu lenta delle procedure legittime (45s)', () => {
    /* La costante non è un numero a caso: se qualcuno la abbassasse sotto i 45
       secondi di tryAutoReconnectInner, taglierebbe corto una riconnessione
       lecita. Il test esiste per accorgersene. */
    const app = loadApp();
    assert.ok(app.run('STALE_BUILD_MS') >= 45000 * 2,
      'la soglia deve stare almeno al doppio della piu lunga costruzione che arriva a quel controllo');
    app.stop();
  });

  test('ogni connessione viene marcata alla nascita, senza che nessuno se ne ricordi', () => {
    /* La proprietà che rende la correzione strutturale invece che una toppa:
       sta nella fabbrica, quindi vale anche per procedure non ancora scritte. */
    const app = loadApp();
    app.run(`
      myIdentity = function(){ return Promise.resolve(null); };
      fetchIceServers = function(){ return Promise.resolve([]); };
      window.__p = newPeerConnection();
    `);
    return app.run('window.__p').then(conn => {
      const stamped = app.run('window.__p.then(function(c){ return typeof c.__bornAt; })');
      return stamped.then(t => {
        assert.strictEqual(t, 'number',
          'senza marchio alla nascita l\'eta non e leggibile e il paracadute non esiste');
        app.stop();
      });
    });
  });

  test('accettare una chiamata che fallisce lascia il telefono raggiungibile', () => {
    /* Stessa iniezione di guasto gia usata per il pump abbandonato: il guasto
       arriva dopo che la connessione e stata creata e messa nel globale. */
    const app = loadApp();
    app.run(`
      addrPending = { msg: { sdp: 'v=0', rid: 'r1' }, sec: { key:{}, seed:'s' }, slot: 0 };
      sealWith = function(){ throw new Error('guasto dopo la creazione della connessione'); };
      window.__p = acceptAddrCall().catch(function(){});
    `);
    return app.run('window.__p').then(() => new Promise(r => setTimeout(r, 20))).then(() => {
      assert.strictEqual(app.run('busyWithSomeone()'), false,
        'dopo un fallimento il dispositivo deve tornare raggiungibile subito, non fra tre minuti');
      app.stop();
    });
  });
});

/* ------------------------------------------------------------------------
   A4 — due contatti identici a vedersi, e l'impostore in cima.

   La difesa costruita prima confrontava le impronte, quindi "Mamma" e "Mамма"
   (con lettere cirilliche) diventavano correttamente due persone diverse. E
   l'utente vedeva due righe identiche. Il suffisso di disambiguazione — che
   esisteva gia — scattava solo per nomi uguali byte per byte, quindi una sola
   lettera scambiata gli passava accanto, e `unshift` metteva il nuovo arrivato
   in cima: l'impostore sopra la voce vera, indistinguibile.

   Costo dell'attacco: mandare un saluto. Pubblico su cui funziona: esattamente
   quello dichiarato dall'app.
   ------------------------------------------------------------------------ */
test.describe('due nomi che sembrano lo stesso nome', () => {

  const OMOGLIFO = 'Mаmmа';        /* Mamma con due 'a' cirilliche */
  const INVISIBILE = 'Mam​ma';           /* Mamma con uno spazio a larghezza zero */

  test('riconosce come uguali i nomi che si leggono uguali', () => {
    const app = loadApp();
    const uguali = app.run(`[
      nickSkeleton('Mamma') === nickSkeleton('${OMOGLIFO}'),
      nickSkeleton('Mamma') === nickSkeleton('${INVISIBILE}'),
      nickSkeleton('Avvocato') === nickSkeleton('Аvvocato')
    ]`);
    assert.deepStrictEqual(JSON.parse(app.run('JSON.stringify(' + JSON.stringify(uguali) + ')')), [true,true,true],
      'una sola lettera scambiata non deve bastare a farsi passare per un altro');
    app.stop();
  });

  test('NON confonde due nomi genuinamente diversi', () => {
    /* Il lato da non rompere: se questo cede, la rubrica di chiunque diventa
       un elenco di finti duplicati e l'avviso perde ogni significato. */
    const app = loadApp();
    assert.strictEqual(app.run("nickSkeleton('Mamma') === nickSkeleton('Papa')"), false);
    assert.strictEqual(app.run("nickSkeleton('Anna') === nickSkeleton('Anno')"), false);
    app.stop();
  });

  test('un nome scritto in un altro alfabeto resta scritto com era', () => {
    /* Si normalizza per CONFRONTARE, mai per salvare: il nome vero di una
       persona puo legittimamente essere in cirillico, e riscriverglielo
       sarebbe un torto suo. */
    const app = loadApp();
    app.run(`
      saveContacts([]);
      touchContact('${OMOGLIFO}', 'fp-uno', null, null);
    `);
    assert.strictEqual(app.run('loadContacts()[0].nick'), OMOGLIFO,
      'il nome memorizzato deve restare quello che la persona ha scelto');
    app.stop();
  });

  test("l'impostore non puo piu presentarsi con un nome identico a vedersi", () => {
    const app = loadApp();
    app.run(`
      saveContacts([]);
      touchContact('Mamma', 'fp-vera', null, null);
      touchContact('${OMOGLIFO}', 'fp-attaccante', null, null);
    `);
    const nomi = JSON.parse(app.run('JSON.stringify(loadContacts().map(function(c){ return c.nick; }))'));
    assert.strictEqual(nomi.length, 2, 'restano due persone diverse: l\'impronta e cio che conta');
    assert.ok(nomi.some(n => /\(2\)/.test(n)),
      'il secondo che rivendica lo stesso nome deve portarne il segno: senza, le due righe si leggono identiche');
    app.stop();
  });

  test('la rubrica dice quale dei due e stato verificato a voce', () => {
    /* La parte che protegge davvero: "(2)" dice che sono due, non quale sia
       tua madre. Solo le tre parole dette a voce lo dicono, e l'app se le
       ricorda gia per impronta. */
    const app = loadApp();
    app.run(`
      saveContacts([]);
      writeSafetyRec(safetyKeyFp('fp-vera'), 'parola parola parola');   /* verificata a voce */
      touchContact('Mamma', 'fp-vera', null, null);
      touchContact('${OMOGLIFO}', 'fp-attaccante', null, null);
      renderContacts();
    `);
    const html = app.run("$('contactsList').innerHTML");
    assert.match(html, /ctrust ok/,   'la voce verificata deve essere riconoscibile');
    assert.match(html, /ctrust bad/,  'quella mai verificata deve essere segnalata');
    app.stop();
  });

  test('con un solo contatto non compare nessun avviso', () => {
    /* Un avviso su ogni riga sarebbe tappezzeria entro una settimana, e il
       giorno che conta nessuno lo vedrebbe. */
    const app = loadApp();
    app.run(`
      saveContacts([]);
      touchContact('Mamma', 'fp-vera', null, null);
      renderContacts();
    `);
    assert.doesNotMatch(app.run("$('contactsList').innerHTML"), /ctrust/,
      'senza collisione non c\'e niente da avvertire');
    app.stop();
  });

  test('due sconosciuti che non hanno scritto un nome non sono un finto allarme', () => {
    /* "Qualcuno" e cio che l'app scrive da sola quando l'altro non ha
       digitato niente — non un nome scelto per sembrare un altro. Trovato
       da un utente vero: due persone diverse, entrambe senza nome, finivano
       segnalate come un possibile impostore l'una dell'altra. */
    const app = loadApp();
    app.run(`
      saveContacts([]);
      touchContact('Qualcuno', 'fp-uno', null, null);
      touchContact('Qualcuno', 'fp-due', null, null);
      renderContacts();
    `);
    const html = app.run("$('contactsList').innerHTML");
    assert.doesNotMatch(html, /ctrust/,
      'due nomi vuoti non sono due impostori: nessun avviso deve comparire');
    const nomi = JSON.parse(app.run('JSON.stringify(loadContacts().map(function(c){ return c.nick; }))'));
    assert.strictEqual(nomi.length, 2, 'restano comunque due contatti distinti');
    assert.ok(nomi.some(n => /\(2\)/.test(n)),
      'il secondo resta comunque contrassegnato "(2)": senza, le due righe si leggono identiche in elenco');
    app.stop();
  });

  test('ma un nome VERO scelto per assomigliare a "Qualcuno" resta segnalato', () => {
    /* Il lato da non rompere: l'esclusione vale solo per il segnaposto
       automatico, non deve diventare una scappatoia — chi scrive davvero
       "Qualcuno" (o un suo omoglifo) come nome scelto resta sotto lo stesso
       controllo di sempre. */
    const app = loadApp();
    app.run(`
      saveContacts([]);
      touchContact('Mamma', 'fp-vera', null, null);
      touchContact('Mаmmа', 'fp-attaccante', null, null);
      renderContacts();
    `);
    assert.match(app.run("$('contactsList').innerHTML"), /ctrust bad/,
      'una collisione su un nome vero deve restare segnalata come prima');
    app.stop();
  });
});

/* ------------------------------------------------------------------------
   M4-M7 — i reperti MEDIO dell'audit ostile.
   Nessuno di questi rompe la cifratura o perde messaggi: sono uno stato che
   mente, una contabilita che non conta, un tetto tarato su una macchina che
   non esiste e un costo pagato a ogni messaggio per sempre.
   ------------------------------------------------------------------------ */
test.describe('le economie invisibili (M4-M7)', () => {

  /* ---- M7 ---- */
  test('M7 — un pump che muore smette di dire che sta girando', () => {
    /* Il ciclo era un fire-and-forget senza catch: moriva come rejection non
       raccolta e `stopped` restava falso, quindi `quickPump` puntava a un pump
       fermo. Il danno non e il pump morto — e lo stato che mente su di lui. */
    const app = loadApp();
    app.run(`
      slotId = function(){ throw new Error('guasto persistente'); };
      window.__p = candidatePump(new RTCPeerConnection(), { seed:'s', key:{} }, 'a', 'b');
    `);
    return new Promise(r => setTimeout(r, 40)).then(() => {
      assert.strictEqual(app.run('window.__p.isRunning()'), false,
        'dopo un\'eccezione il pump deve ammettere di essere fermo, non continuare a dichiararsi vivo');
      app.stop();
    });
  });

  test('M7 — un pump sano continua a dichiararsi vivo', () => {
    const app = loadApp();
    app.run(`window.__p = candidatePump(new RTCPeerConnection(), { seed:'s', key:{} }, 'a', 'b');`);
    assert.strictEqual(app.run('window.__p.isRunning()'), true);
    app.run('window.__p.stop();');
    assert.strictEqual(app.run('window.__p.isRunning()'), false, 'e fermarsi deve restare fermarsi');
    app.stop();
  });

  /* ---- M4 ---- */
  test('M4 — i file gia arrivati non escono piu dalla contabilita', () => {
    /* MAX_INCOMING_TOTAL sorvegliava solo i trasferimenti in corso. Un file
       finito usciva da li e restava vivo nel suo object URL, invisibile: 40
       file da 4 MB erano 160 MB che il conteggio giurava fossero zero. */
    const app = loadApp();
    assert.strictEqual(app.run('heldMediaBytes()'), 0);
    app.run(`keepObjectUrl('blob:finto-1', 4 * 1024 * 1024);
             keepObjectUrl('blob:finto-2', 4 * 1024 * 1024);`);
    assert.strictEqual(app.run('heldMediaBytes()'), 8 * 1024 * 1024,
      'cio che e trattenuto in memoria deve comparire nel conteggio');
    app.run('releaseObjectUrls();');
    assert.strictEqual(app.run('heldMediaBytes()'), 0, 'e sparire quando viene davvero rilasciato');
    app.stop();
  });

  test('M4 — un file rifiutato per mancanza di memoria viene DETTO', () => {
    /* Era un `return` nudo: il file non arrivava e basta, nessuna bolla,
       nessuna riga, su nessuno dei due lati. La stessa perdita silenziosa che
       il lato mittente considera il peggiore dei guasti possibili. */
    const app = loadApp();
    app.run(`
      peerNick = 'Marco';
      keepObjectUrl('blob:enorme', MAX_INCOMING_TOTAL);   /* memoria gia piena */
      onDcMessage({ data: JSON.stringify({ type:'file-start', id:'x1', name:'foto.jpg', mime:'image/jpeg', size: 1024 }) });
    `);
    assert.strictEqual(app.run('Object.keys(incoming).length'), 0, 'il trasferimento non deve partire');
    const testo = app.run("$('msgs').children.map(function(r){ return r.textContent || ''; }).join(' ')");
    assert.match(testo, /foto\.jpg/,
      'chi riceve deve sapere che un file e stato rifiutato, e quale: il silenzio era il difetto');
    app.stop();
  });

  /* ---- M5 ---- */
  test('M5 — il tetto della memoria e piu basso di quanto un telefono sopporta', () => {
    /* 768 MB difendevano da un muro che il dispositivo raggiunge molto prima:
       una scheda su telefono viene uccisa fra i 200 e i 400 MB. */
    const app = loadApp();
    const tetto = app.run('MAX_INCOMING_TOTAL');
    assert.ok(tetto <= 768 * 1024 * 1024, 'non deve mai superare il valore storico');
    assert.ok(tetto >= 128 * 1024 * 1024, 'ne scendere cosi tanto da rifiutare un uso normale');
    app.stop();
  });

  test('M5 — la misura vera batte la forma del dispositivo, in tutti i casi', () => {
    /* Difetto mio, trovato dalla prova dal vivo e non dai test: `isIOS` conta
       apposta anche un Mac che dichiara punti di tocco, perche e cosi che un
       iPad si annuncia da iPadOS 13 in poi. Chiesto per primo, metteva un
       desktop con 8 GB sullo stesso budget di un telefono. Questo test esiste
       perche quell'ordine non torni a invertirsi. */
    const app = loadApp();
    const f = 'tightMemoryDevice';
    assert.strictEqual(app.run(f + '(8, true)'),  false, 'un Mac con 8 GB non e un dispositivo stretto, anche se isIOS dice di si');
    assert.strictEqual(app.run(f + '(4, false)'), true,  '4 GB o meno lo e, misurato');
    assert.strictEqual(app.run(f + '(undefined, true)'),  true,  'senza misura, un iPhone/iPad e stretto');
    assert.strictEqual(app.run(f + '(undefined, false)'), false, 'senza misura, un desktop non lo e');
    app.stop();
  });

  /* ---- M6 ---- */
  test('M6 — la cronologia ha un tetto in byte, non solo in voci', () => {
    /* Trecento voci ordinarie sono qualche decina di kilobyte; trecento voci
       lunghe sono megabyte, riserializzati per intero a ogni messaggio. */
    const app = loadApp();
    app.run(`
      destructArmed = false; historyBroken = false; lastHistoryTry = 0;
      for (var i = 0; i < 40; i++) saveToHistory('Marco', new Array(20000).join('x'), true);
    `);
    const peso = app.run("(localStorage.getItem(historyKeyNow('Marco')) || '').length");
    assert.ok(peso <= app.run('MAX_HISTORY_BYTES') * 1.5, 'la cronologia di una conversazione non puo crescere senza limite: ' + peso);
    assert.ok(app.run("JSON.parse(localStorage.getItem(historyKeyNow('Marco'))).length") >= 1,
      'e l\'ultimo messaggio deve comunque esserci');
    app.stop();
  });

  test('M6 — a memoria piena non si ritenta una scrittura a ogni messaggio', () => {
    /* Misurato dall'audit: 30ms per messaggio, spesi per una scrittura che
       poteva solo fallire, per il resto della visita. */
    const app = loadApp();
    app.run(`
      destructArmed = false;
      window.__tentativi = 0;
      const vero = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(k, v){
        if (String(k).indexOf('dvlogos-history-') === 0){ window.__tentativi++; throw new Error('quota piena'); }
        return vero(k, v);
      };
      historyBroken = false; lastHistoryTry = 0;
      for (var i = 0; i < 10; i++) saveToHistory('Marco', 'ciao', true);
    `);
    assert.strictEqual(app.run('historyBroken'), true, 'il guasto va comunque registrato');
    assert.strictEqual(app.run('window.__tentativi'), 1,
      'dieci messaggi non devono costare dieci scritture destinate a fallire');
    app.stop();
  });
});

/* ------------------------------------------------------------------------
   Squillare a telefono chiuso.

   In una pagina questo è impossibile: chiusa la scheda non resta nessuno ad
   aspettare, e l'unico modo che il web offre per svegliare un telefono passa
   dai server di Google. Dentro il pacchetto Android c'è invece un servizio che
   può stare sveglio, e la pagina gli consegna dove guardare.

   Quello che si prova qui è la consegna, che è la parte che può sbagliare in
   silenzio: consegnare le caselle sbagliate, o consegnarle quando l'utente ha
   detto di no, o dimenticarsi di fermare il servizio. Un errore qui non si
   vede su nessuno schermo — si vede solo dal fatto che il telefono non squilla
   più, o che squilla quando non doveva.
   ------------------------------------------------------------------------ */
test.describe('il telefono che squilla anche ad app chiusa', () => {

  function withAndroid(){
    const app = loadApp({ androidRing: true });
    app.run(`
      activeSlots = function(){ return [0]; };
      myAddress = function(){ return Promise.resolve('AAAABBBBCCCC'); };
      addrSlotSeed = function(){ return Promise.resolve('seed'); };
      slotId = function(){ return Promise.resolve('a'.repeat(64)); };
    `);
    return app;
  }
  const calls = app => app.sandbox.__androidRingCalls;

  test('in un browser normale non esiste nessun ponte, e la pagina non ci prova nemmeno', () => {
    const app = loadApp();
    assert.strictEqual(app.run('androidRing'), null,
      'fuori dal pacchetto Android non deve esistere alcun ponte');
    return app.run('handOverWatchToAndroid()').then(() => {
      assert.strictEqual(app.run('typeof AndroidRing'), 'undefined');
      app.stop();
    });
  });

  test('acceso, consegna le caselle da sorvegliare, il relay e le parole giuste', () => {
    const app = withAndroid();
    app.run('listenMode = true; window.__p = handOverWatchToAndroid();');
    return app.run('window.__p').then(() => {
      const c = calls(app);
      assert.strictEqual(c.length, 1, 'una sola consegna');
      assert.strictEqual(c[0].what, 'watch');
      assert.strictEqual(c[0].keys, 'a'.repeat(64),
        'deve consegnare la casella davvero calcolata dall indirizzo');
      assert.ok(/^https:\/\/.*\/mailbox\/$/.test(c[0].base),
        'il relay va consegnato dalla pagina, non scritto dentro il telefono: ' + c[0].base);
      assert.ok(c[0].title && c[0].title.length > 3, 'la schermata bloccata deve avere un titolo');
      app.stop();
    });
  });

  test('spento, il servizio va fermato — non semplicemente lasciato andare', () => {
    const app = withAndroid();
    app.run('listenMode = false; window.__p = handOverWatchToAndroid();');
    return app.run('window.__p').then(() => {
      const c = calls(app);
      assert.deepStrictEqual(c.map(x => x.what), ['stop'],
        'spegnere l interruttore deve fermare davvero il servizio');
      app.stop();
    });
  });

  test('senza nessun indirizzo attivo non si tiene acceso un servizio a guardare il nulla', () => {
    const app = withAndroid();
    app.run('activeSlots = function(){ return []; };');
    app.run('listenMode = true; window.__p = handOverWatchToAndroid();');
    return app.run('window.__p').then(() => {
      assert.deepStrictEqual(calls(app).map(x => x.what), ['stop'],
        'nessun indirizzo da sorvegliare deve spegnere, non accendere');
      app.stop();
    });
  });

  test('la consegna si rifa quando la pagina sparisce, non solo una volta all avvio', () => {
    const app = withAndroid();
    app.run('listenMode = true;');
    app.run(`
      document.visibilityState = 'hidden';
      (document.listeners['visibilitychange'] || []).forEach(function(f){ f(); });
    `);
    return new Promise(r => setTimeout(r, 30)).then(() => {
      assert.ok(calls(app).some(x => x.what === 'watch'),
        'uscire dall app e il momento esatto in cui il telefono deve prendere in mano l ascolto');
      app.stop();
    });
  });

  test('se Android nega lo schermo bloccato lo dice, invece di lasciar credere di essere raggiungibili', () => {
    const app = loadApp({ androidRing: true, androidLockScreen: false });
    app.run(`
      activeSlots = function(){ return [0]; };
      myAddress = function(){ return Promise.resolve('AAAABBBBCCCC'); };
      addrSlotSeed = function(){ return Promise.resolve('seed'); };
      slotId = function(){ return Promise.resolve('a'.repeat(64)); };
      listenMode = true; window.__p = handOverWatchToAndroid();
    `);
    return app.run('window.__p').then(() => {
      const c = app.sandbox.__androidRingCalls.map(x => x.what);
      assert.ok(c.includes('watch'), 'l ascolto va acceso comunque: una striscia e meglio di niente');
      assert.ok(c.includes('askForLockScreen'),
        'senza quel permesso un telefono bloccato non mostra nulla, e va detto invece che taciuto');
      app.stop();
    });
  });

  test('quando invece il permesso c e, non si disturba nessuno', () => {
    const app = withAndroid();
    app.run('listenMode = true; window.__p = handOverWatchToAndroid();');
    return app.run('window.__p').then(() => {
      const c = app.sandbox.__androidRingCalls.map(x => x.what);
      assert.ok(!c.includes('askForLockScreen'),
        'chiedere un permesso gia concesso e solo un fastidio');
      app.stop();
    });
  });

  test('rispondere dallo schermo bloccato fa leggere la busta alla pagina, non al servizio', () => {
    const app = withAndroid();
    app.run('window.__letto = 0; addrCheckOnce = function(){ window.__letto++; };');
    assert.strictEqual(app.run('typeof window.dvAndroidCall'), 'function',
      'Android deve avere un modo per dire alla pagina che una chiamata aspetta');
    app.run('window.dvAndroidCall();');
    assert.strictEqual(app.run('window.__letto'), 1,
      'la lettura e la decifratura restano della pagina: il servizio non apre mai la busta');
    app.stop();
  });
});

/* ------------------------------------------------------------------------
   Un invito mandato da dentro l'app deve poterlo aprire qualcun altro.

   Dentro il pacchetto Android l'app è servita da appassets.androidplatform.net,
   che esiste dentro quella WebView su quel telefono e in nessun altro posto al
   mondo. Un invito costruito da lì non è un link: chi lo riceve legge
   ERR_NAME_NOT_RESOLVED e non c'è niente che possa farci.

   Se ne è accorto chi usava l'app, mandandosi un invito dal telefono al proprio
   computer, non i test — che davano tutti verde perché stavano sempre e solo
   in piedi su un sito. Da qui la possibilità di spostarli.
   ------------------------------------------------------------------------ */

const DENTRO_APP = { location: {
  origin: 'https://appassets.androidplatform.net',
  pathname: '/assets/logos.html',
  host: 'appassets.androidplatform.net',
  hostname: 'appassets.androidplatform.net',
  href: 'https://appassets.androidplatform.net/assets/logos.html',
} };

test.describe('un invito mandato dall\'app si apre anche altrove', () => {

  test('nessun link generato dentro l\'app nomina l\'indirizzo interno', () => {
    const app = loadApp(DENTRO_APP);
    const links = {
      invito: app.run("inviteLink('ABC123')"),
      indirizzo: app.run("addrLink('XK7Y9HDWH3SH')"),
      codice: app.run("quickLink('443351')"),
    };
    for (const [nome, url] of Object.entries(links)){
      assert.ok(!/appassets\.androidplatform\.net/.test(url),
        `il link "${nome}" punta a un indirizzo che esiste solo dentro l'app: ${url}`);
      assert.ok(/^https:\/\/digitalvalut\.github\.io\//.test(url),
        `il link "${nome}" non punta al sito pubblico: ${url}`);
    }
    app.stop();
  });

  test('il pezzo dopo il cancelletto resta quello giusto', () => {
    const app = loadApp(DENTRO_APP);
    assert.match(app.run("quickLink('443351')"), /#q=443351$/);
    assert.match(app.run("addrLink('XK7Y9HDWH3SH')"), /#a=XK7Y9HDWH3SH$/);
    assert.match(app.run("inviteLink('ABC123')"), /#i=ABC123$/);
    app.stop();
  });


  /* Chi riceve un invito resta su quello che gli è arrivato. Finché il
     messaggio nominava soltanto il sito, l'app Android era invisibile a
     chiunque fosse entrato per quella porta: nessuno gli diceva mai che per
     lui esisteva una copia che sopravvive al sito bloccato. */
  test('il messaggio di condivisione offre sia il sito sia l\'app', async () => {
    const app = loadApp(DENTRO_APP);
    /* Si chiama la funzione vera e si legge cosa consegna davvero al telefono.
       La prima versione di questo test ricomponeva il messaggio da sé, pezzo
       per pezzo: restava verde anche dopo aver tolto il link dell'app da
       shareTheApp, perché quella funzione non la guardava mai. Un test che non
       si accorge del guasto che sorveglia è peggio di nessun test: dice che va
       tutto bene. */
    app.run("window.__condiviso = null;"
          + "navigator.share = async (d) => { window.__condiviso = d.text; };");
    await app.run('shareTheApp()');
    const testo = app.run('window.__condiviso');
    assert.ok(testo, 'shareTheApp non ha consegnato nessun messaggio');
    assert.ok(/digitalvalut\.github\.io/.test(testo),
      'manca il link del sito, che è l\'unico che funziona su iPhone');
    assert.ok(/releases\/latest\/download\/DigitalValut-Logos\.apk/.test(testo),
      'manca il link dell\'app Android');
    assert.ok(!/appassets\.androidplatform\.net/.test(testo),
      'il messaggio nomina l\'indirizzo interno, che fuori da quel telefono non esiste');
    app.stop();
  });

  test('il link dell\'app non invecchia a ogni versione', () => {
    const app = loadApp();
    const url = app.run('ANDROID_APP_URL');
    /* "latest" più un nome di file fisso: un invito mandato oggi consegna
       l'ultima versione anche fra un anno. Con il numero di versione dentro,
       ogni pubblicazione lascerebbe in giro link morti in mano alla gente. */
    assert.ok(!/-v\d+\.apk/.test(url),
      `il link porta il numero di versione e morirà alla prossima: ${url}`);
    assert.match(url, /\/releases\/latest\/download\//);
    app.stop();
  });
  test('su un sito vero i link restano quelli di quel sito', () => {
    const app = loadApp();
    /* la correzione non deve dirottare altrove chi sta già su una pagina
       raggiungibile: una copia legittima su un altro host resta padrona
       dei propri link */
    assert.strictEqual(app.run("quickLink('443351')"),
      'https://digitalvalut.github.io/logos-protocol/modifica.html#q=443351');
    app.stop();
  });

});

/* ------------------------------------------------------------------------
   La pompa dei candidati non va spenta mentre la connessione sta salendo.

   È l'unica cosa che porta i candidati di rete dell'altro lato. Fermarla
   perché la connessione "non funziona ancora" toglie di mezzo proprio ciò
   che la farebbe funzionare: i candidati non arrivano mai, nessuna coppia
   viene formata, e la connessione resta a `connecting` finché non ci si
   arrende. Si vede solo quando i due non sono sulla stessa rete — su una
   scrivania con due macchine accanto è invisibile.
   ------------------------------------------------------------------------ */

test.describe('la pompa dei candidati sopravvive alla stretta di mano', () => {

  test('mentre la connessione sale, la pompa resta viva', () => {
    const app = loadApp();
    app.run(`
      window.__pc = new RTCPeerConnection();
      quickPump = candidatePump(window.__pc, { seed:'s', key:{} }, 'a', 'b');
      quickPumpOwner = window.__pc;
      window.__pc.connectionState = 'connecting';
      stopPumpOnceSettled(window.__pc);
    `);
    assert.strictEqual(app.run('quickPump !== null'), true,
      'la pompa e stata fermata mentre la stretta di mano era in corso: i candidati dell altro lato non arriveranno mai');
    app.stop();
  });

  test('quando la connessione fallisce, la pompa viene fermata', () => {
    const app = loadApp();
    app.run(`
      window.__pc = new RTCPeerConnection();
      quickPump = candidatePump(window.__pc, { seed:'s', key:{} }, 'a', 'b');
      quickPumpOwner = window.__pc;
      window.__pc.connectionState = 'connecting';
      stopPumpOnceSettled(window.__pc);
      window.__pc.__become('failed');
    `);
    assert.strictEqual(app.run('quickPump === null'), true,
      'una connessione fallita lascia dietro una pompa che interroga la cassetta per sempre');
    app.stop();
  });

  test('quando la connessione riesce, la pompa non viene buttata via', () => {
    const app = loadApp();
    app.run(`
      window.__pc = new RTCPeerConnection();
      quickPump = candidatePump(window.__pc, { seed:'s', key:{} }, 'a', 'b');
      quickPumpOwner = window.__pc;
      window.__pc.connectionState = 'connecting';
      stopPumpOnceSettled(window.__pc);
      window.__pc.__become('connected');
    `);
    assert.strictEqual(app.run('quickPump !== null'), true,
      'la pompa e stata fermata su una connessione riuscita');
    app.stop();
  });

});
