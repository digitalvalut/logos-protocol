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
      assert.strictEqual(app.run('window.__sas'), 1,
        'it must fall through to the ordinary three words, like any other first contact');
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
      assert.strictEqual(app.run('window.__sas'), 1,
        'the three words are exactly what is left to tell them apart, so they must be offered');
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
      assert.strictEqual(app.run('window.__sas'), 1,
        'a first contact must be asked for the three words whatever route it arrived by — the proof is not a substitute for a person');
      assert.strictEqual(app.run('window.__kind'), 'new');
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
    let p = Promise.resolve();
    for (let giro = 0; giro < 10; giro++){
      p = p.then(() => { app.run('window.__g = checkInboxOnce();'); return app.run('window.__g'); })
           .then(() => new Promise(r => setTimeout(r, 5)));
    }
    return p.then(() => {
      const viste = Object.keys(JSON.parse(app.run('JSON.stringify(window.__viste)'))).length;
      assert.strictEqual(viste, 40,
        `dopo dieci giri sono stati guardati solo ${viste} contatti su 40: girando a turno non si deve perdere nessuno`);
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
