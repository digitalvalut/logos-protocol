"use strict";
const $ = id => document.getElementById(id);

/* ============================== i18n ============================== */
const LANGS = [['it','Italiano'],['en','English']];
let CURLANG = 'it';
const I18N = { it: {}, en: {} };

Object.assign(I18N.en, {
"topbar.sub":"Experimental chat",
"onboard.text":"<b>DigitalValut Logos</b> — free and open-source software (MIT license), owned by the Associazione di Promozione Sociale DigitalValut, a registered Italian nonprofit (Ente del Terzo Settore). Downloadable and usable free of charge by anyone, anywhere in the world.",
"install.btn":"Install",
"home.title":"Talk to anyone, wherever they are",
"home.sub":"Messages, photos, video, calls. No sign-up, no phone number, free forever.",
"home.nameLabel":"Your name",
"home.namePh":"Your name",
"home.startT":"Start a chat","home.startD":"Create an invite to send someone",
"home.joinT":"I got an invite","home.joinD":"Paste or open the link someone sent you",
"home.legalSummary":"How it works, in three technical lines",
"home.legalBody":"It reveals your network address (IP) to whoever you talk to; it needs both of you online at once, otherwise nothing arrives, and on heavily filtered networks calls may not connect; no website can prevent a screenshot, ever. For safety when it truly matters, use Signal, Session or Briar instead of this.",
"nav.back":"Back",
"start.title":"Create the invite","start.lead":"Generate a code, then send it to whoever you want to bring in — email, WhatsApp, in person.",
"start.create":"Create my invite",
"start.share":"Send the invite","btn.copyCode":"Copy the code",
"start.step2T":"Finish connecting","start.step2D":"When the other person sends back their reply code, paste it here.",
"start.pastePh":"Paste the reply code here…","btn.connect":"Connect",
"join.title":"Reply to the invite","join.lead":"Paste the code you received, or — if you opened the link — it's already filled in below.",
"join.pastePh":"Paste the invite code here…","join.generate":"Generate reply and connect",
"join.sendAnswer":"Send the reply",
"chat.someone":"Someone","chat.connected":"connected","chat.typePh":"Write a message…",
"call.hangup":"End","call.accept":"Answer","call.decline":"Decline",
"menu.title":"Tools","menu.arm":"Self-destruct","menu.disarm":"Cancel",
"menu.clearHistory":"Clear history","menu.endChat":"End chat",
"menu.historyNote":"History stays only on this device, tied to the name of the person you're talking to. No server keeps it.",
"footer.text":"free and open-source software (MIT license), a project of DigitalValut APS ETS.",
"footer.noserver":"No server: the connection is direct between the two browsers via WebRTC.",
"footer.license":"Read the open-source license","footer.source":"Source code on GitHub",
"verify.badge":"🔒 verify","verify.title":"Security code",
"verify.lead":"Compare it with the other person — out loud, by phone, or on a channel different from the one you used to exchange the invite code. If the two codes don't match exactly, someone may have inserted themselves into the connection: don't trust that chat.",
"verify.close":"Close","verify.unavailable":"Not ready yet — try again in a moment.",
"contacts.title":"Recent contacts",
"contacts.note":"One tap to see them again: what you said to each other stayed here. Each time needs a fresh invite, because no server keeps anyone connected for you.",
"toast.sealCopied":"Code copied","toast.copyFail":"Copy failed — select and copy by hand","toast.copySelected":"Copy failed — code selected for you, just press Ctrl/Cmd+C",
"call.busy":"didn't answer — busy on another call.","call.declinedBy":"declined the call.",
"call.joined":"joined the chat.","call.videoInvite":"is video calling you","call.audioInvite":"is calling you",
"call.inVideo":"Video call in progress…","call.inAudio":"Call in progress…","call.ringingVideo":"Video calling, waiting for answer…","call.ringingAudio":"Calling, waiting for answer…",
"call.micFail":"Microphone or camera unavailable, or permission denied.",
"call.micFailNotFound":"No microphone or camera found on this device.",
"call.micFailBusy":"Your microphone or camera is already being used by another app (Zoom, Teams, another tab…). Close it and try again.",
"call.micFailDenied":"The browser has blocked the microphone and camera for this site. Check the lock icon next to the address bar and allow access, then reload the page.",
"destruct.note":"When the timer runs out: the conversation is cleared from this screen, the other person is asked to do the same, and the connection closes. It cannot reach copies already saved elsewhere (screenshots, downloaded files) — those stay where they were saved.",
"destruct.countdown":"self-destructs in ","destruct.done":"Conversation self-destructed.",
"session.closed":"closed","session.newHint":"Create a new session to reconnect.",
"invite.shareText":"Want to chat with me on DigitalValut Logos? Open this link: if you don't have the page ready, it opens on its own with my invite already filled in.\n\n",
"invite.answerText":"Here's my reply for DigitalValut Logos, paste it to finish connecting:\n\n",
"mic.recording":"Recording — tap to stop","file.tooBig":"","history.cleared":"History cleared on this device.",
"install.genericText":"<b>Install DigitalValut Logos</b> to have it as an app, with its own icon, no browser needed.",
"install.iosText":"<b>Install DigitalValut Logos on iPhone or iPad.</b> Tap <b>Share</b> in Safari, then <b>Add to Home Screen</b>.",
"home.shareApp":"Tell someone about the app",
"start.s1":"Send the invite",
"start.s1help":"Press the orange button. The app prepares the invite and lets you choose how to send it: WhatsApp, a message, email \u2014 whatever you normally use.",
"start.s2":"Paste their reply",
"start.s2help":"They will send a message back. Copy it, come back here and press <b>Paste</b>. Then you go into the chat together.",
"start.create":"Prepare the invite",
"start.pastePh":"Paste the reply here\u2026",
"join.s1":"Open the invite",
"join.s1help":"If you opened the link they sent you, everything is ready: press the orange button. Otherwise press <b>Paste</b>.",
"join.s2":"Send the reply",
"join.s2help":"Last step: send this back to the person who invited you, and you are connected.",
"join.generate":"Open the invite",
"join.pastePh":"Paste the invite here\u2026",
"btn.connect":"Go into the chat",
"btn.paste":"Paste",
"btn.showCode":"Show the code",
"toast.clipboardEmpty":"There is nothing to paste.",
"toast.pasteManually":"Hold your finger on the box and choose Paste.",
"home.shareAppText":"Free, no account, works on any phone or computer — DigitalValut Logos:\n\n",
"lock.title":"🔐 Extra protection",
"lock.sub":"Locks the invite with a passphrase you say out loud. Worth turning on if the code travels over WhatsApp, email or SMS.",
"lock.passCap":"Passphrase",
"lock.passHint":"Say it out loud, or send it on a different channel from the code. Without it the code does not open.",
"lock.ask":"🔐 This invite is locked. Type the passphrase you were told out loud.",
"lock.askPh":"passphrase",
"lock.working":"Working…",
"lock.needPass":"Type the passphrase to open this invite.",
"lock.wrongPass":"Wrong passphrase. Check it and try again.",
"lock.badAnswer":"Invalid reply — or it was sealed with a different passphrase.",
"join.badCode":"This code is not valid. Check that you copied all of it.",
"connect.waiting":"Waiting for the connection…",
"connect.failed":"Could not connect. Make sure you are both online, then create a fresh invite — old codes cannot be reused.",
"connect.slow":"This is taking longer than usual — that happens on very restricted networks (workplaces, some mobile networks) or if you are not online at the same moment. Wait a bit more, or create a fresh invite.",
"footer.seal":"Fingerprints of this app (SHA-256):",
"verify.known":"verified",
"verify.changedShort":"code changed",
"verify.accept":"Accept the new code",
"verify.noteKnown":"Same code as last time: nobody has come in between since.",
"verify.noteNew":"First time with this person: compare the code out loud, then the app remembers it.",
"verify.noteChanged":"The code has changed. Usually that means a new phone or a reinstalled app — but it is also what being intercepted looks like. Compare it out loud before accepting it.",
"verify.changedWarn":"\u26a0\ufe0f This person's safety code has changed since last time. Compare it out loud before trusting this chat."
});
Object.assign(I18N.it, {
"topbar.sub":"Chat sperimentale",
"home.startT":"Inizia una chat","home.startD":"Crea un invito da mandare a qualcuno",
"home.joinT":"Ho ricevuto un invito","home.joinD":"Incolla o apri il link che ti hanno mandato",
"home.shareApp":"Fai conoscere l'app a qualcuno",
"start.s1":"Manda l'invito",
"start.s1help":"Premi il pulsante arancione. L'app prepara l'invito e ti fa scegliere come mandarlo: WhatsApp, messaggio, email \u2014 quello che usi di solito.",
"start.s2":"Incolla la sua risposta",
"start.s2help":"L'altra persona ti rimander\u00e0 un messaggio. Copialo, torna qui e premi <b>Incolla</b>. Poi entrate insieme nella chat.",
"start.create":"Prepara l'invito",
"start.pastePh":"Incolla qui la risposta\u2026",
"join.s1":"Apri l'invito",
"join.s1help":"Se hai aperto il link che ti hanno mandato, \u00e8 gi\u00e0 tutto pronto: premi il pulsante arancione. Altrimenti premi <b>Incolla</b>.",
"join.s2":"Manda la risposta",
"join.s2help":"Ultimo passo: rimanda questo alla persona che ti ha invitato, e siete connessi.",
"join.generate":"Apri l'invito",
"join.pastePh":"Incolla qui l'invito\u2026",
"btn.connect":"Entra nella chat",
"btn.paste":"Incolla",
"btn.showCode":"Mostra il codice",
"toast.clipboardEmpty":"Non c'\u00e8 niente da incollare.",
"toast.pasteManually":"Tieni premuto sul riquadro e scegli Incolla.",
"home.shareAppText":"Gratis, senza account, funziona su qualunque telefono o computer — DigitalValut Logos:\n\n",
"nav.back":"Indietro",
"start.share":"Manda l'invito","btn.copyCode":"Copia il codice",
"join.sendAnswer":"Manda la risposta",
"chat.someone":"Qualcuno","chat.connected":"connessa","chat.typePh":"Scrivi un messaggio…",
"call.hangup":"Chiudi","call.accept":"Rispondi","call.decline":"Rifiuta",
"menu.title":"Strumenti","menu.arm":"Autodistruzione","menu.disarm":"Annulla",
"menu.clearHistory":"Svuota cronologia","menu.endChat":"Termina chat",
"menu.historyNote":"La cronologia resta solo su questo dispositivo, legata al nome della persona con cui parli. Nessun server la conserva.",
"footer.text":"software libero e open source (licenza MIT), un progetto di DigitalValut APS ETS.",
"footer.noserver":"Nessun server: la connessione è diretta tra i due browser via WebRTC.",
"footer.license":"Leggi la licenza open source","footer.source":"Codice sorgente su GitHub",
"lock.title":"🔐 Protezione extra",
"lock.sub":"Chiude l'invito con una parola d'ordine che dirai a voce. Conviene se il codice passa da WhatsApp, email o SMS.",
"lock.passCap":"Parola d'ordine",
"lock.passHint":"Dilla a voce, o mandala su un canale diverso da quello del codice. Senza, il codice non si apre.",
"lock.ask":"🔐 Questo invito è chiuso a chiave. Scrivi la parola d'ordine che ti hanno detto a voce.",
"lock.askPh":"parola d'ordine",
"lock.working":"Un attimo…",
"lock.needPass":"Scrivi la parola d'ordine per aprire questo invito.",
"lock.wrongPass":"Parola d'ordine sbagliata. Controlla e riprova.",
"lock.badAnswer":"Risposta non valida — oppure è stata chiusa con una parola d'ordine diversa.",
"join.badCode":"Questo codice non è valido. Controlla di averlo copiato tutto.",
"connect.waiting":"In attesa della connessione…",
"connect.failed":"Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.",
"connect.slow":"Ci sta mettendo più del solito — capita su reti molto filtrate (aziendali, alcune reti mobili) o se non siete online nello stesso momento. Aspettate ancora un attimo, oppure create un invito nuovo.",
"footer.seal":"Impronte di questa app (SHA-256):",
"verify.known":"verificato",
"verify.changedShort":"codice cambiato",
"verify.accept":"Accetta il nuovo codice",
"verify.noteKnown":"Stesso codice dell'ultima volta: da allora nessuno si \u00e8 messo in mezzo.",
"verify.noteNew":"Prima volta con questa persona: confrontate il codice a voce, poi l'app se lo ricorda.",
"verify.noteChanged":"Il codice \u00e8 cambiato. Di solito vuol dire telefono nuovo o app reinstallata \u2014 ma \u00e8 anche il segno che qualcuno si \u00e8 messo in mezzo. Confrontatelo a voce prima di accettarlo.",
"verify.changedWarn":"\u26a0\ufe0f Il codice di sicurezza di questa persona \u00e8 cambiato rispetto all'ultima volta. Confrontatelo a voce prima di fidarti di questa chat.",
"verify.badge":"🔒 verifica","verify.close":"Chiudi",
"verify.unavailable":"Non ancora disponibile — riprova tra un istante.",
"toast.sealCopied":"Codice copiato","toast.copyFail":"Copia non riuscita — seleziona e copia a mano","toast.copySelected":"Copia non riuscita — l'ho selezionato per te, premi Ctrl/Cmd+C",
"call.busy":"non ha risposto — occupato in un'altra chiamata.","call.declinedBy":"ha rifiutato la chiamata.",
"call.joined":"si è unito alla chat.","call.videoInvite":"ti sta facendo una videochiamata","call.audioInvite":"ti sta chiamando",
"call.inVideo":"Videochiamata in corso…","call.inAudio":"Chiamata in corso…","call.ringingVideo":"Chiamata video in corso, in attesa di risposta…","call.ringingAudio":"Chiamata in corso, in attesa di risposta…",
"call.micFail":"Microfono o fotocamera non disponibili, o permesso negato.",
"call.micFailNotFound":"Non trovo un microfono o una fotocamera su questo dispositivo.",
"call.micFailBusy":"Il microfono o la fotocamera sono già in uso da un'altra app (Zoom, Teams, un'altra scheda…). Chiudila e riprova.",
"call.micFailDenied":"Il browser ha bloccato microfono e fotocamera per questo sito. Controlla l'icona del lucchetto vicino all'indirizzo e consenti l'accesso, poi ricarica la pagina.",
"destruct.note":"Allo scadere del timer: la conversazione viene cancellata da questo schermo, viene chiesto di fare lo stesso all'altra persona, e la connessione si chiude. Non può toccare copie già salvate altrove (screenshot, file scaricati) — quelle restano dove sono state salvate.",
"destruct.countdown":"si autodistrugge tra ","destruct.done":"Conversazione autodistrutta.",
"session.closed":"chiusa","session.newHint":"Crea una nuova sessione per riconnetterti.",
"invite.shareText":"Ti va di chattare con me su DigitalValut Logos? Apri questo link: se non hai la pagina già pronta si apre da sola, con il mio invito già inserito.\n\n",
"invite.answerText":"Ecco la mia risposta per DigitalValut Logos, incollala per completare la connessione:\n\n",
"mic.recording":"Registrazione — tocca per fermare","history.cleared":"Cronologia svuotata su questo dispositivo.",
"install.genericText":"<b>Installa DigitalValut Logos</b> per averla come app, con la sua icona, senza passare dal browser.",
"install.iosText":"<b>Installa DigitalValut Logos su iPhone o iPad.</b> Tocca <b>Condividi</b> in Safari, poi <b>Aggiungi a Home</b>."
});

function t(key, fallback){
  const v = I18N[CURLANG] && I18N[CURLANG][key];
  return v === undefined || v === null ? (fallback !== undefined ? fallback : key) : v;
}
function fill(str, vars){ return String(str).replace(/\{(\w+)\}/g, (m,k) => k in vars ? vars[k] : m); }

const ORIGINALS = new Map();
function initLang(){
  document.querySelectorAll('[data-i18n]').forEach(el => ORIGINALS.set(el, { key: el.getAttribute('data-i18n'), html: el.innerHTML }));
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    if (!ORIGINALS.has(el)) ORIGINALS.set(el, {});
    ORIGINALS.get(el).phKey = el.getAttribute('data-i18n-ph');
    ORIGINALS.get(el).ph = el.getAttribute('placeholder');
  });
  const sel = $('langSel');
  LANGS.forEach(([code,name]) => { const o=document.createElement('option'); o.value=code; o.textContent=name; sel.appendChild(o); });
  sel.addEventListener('change', () => applyLang(sel.value));
  let want = null;
  try{ want = localStorage.getItem('dvlogos-lang'); }catch(e){}
  if (!want){
    const codes = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language||'it'];
    for (const c of codes){ const base = String(c).toLowerCase().split('-')[0]; if (LANGS.some(l=>l[0]===base)){ want = base; break; } }
  }
  applyLang(want && LANGS.some(l=>l[0]===want) ? want : 'it');
}
function applyLang(code){
  CURLANG = code;
  document.documentElement.lang = code;
  const dict = I18N[code] || {};
  ORIGINALS.forEach((orig, el) => {
    if (orig.key){ const v = dict[orig.key]; el.innerHTML = v !== undefined ? v : orig.html; }
    if (orig.phKey){ const v = dict[orig.phKey]; el.setAttribute('placeholder', v !== undefined ? v : orig.ph); }
  });
  $('langSel').value = code;
  try{ localStorage.setItem('dvlogos-lang', code); }catch(e){}
}

/* ============================== screens ============================== */
function showScreen(id){
  ['screenHome','screenStart','screenJoin','screenChat'].forEach(s => $(s).classList.toggle('hide', s !== id));
  window.scrollTo(0,0);
}
$('goStart').addEventListener('click', () => showScreen('screenStart'));
$('goJoin').addEventListener('click', () => showScreen('screenJoin'));
$('backFromStart').addEventListener('click', () => showScreen('screenHome'));
$('backFromJoin').addEventListener('click', () => showScreen('screenHome'));

/* your name, remembered on this device */
try{ $('nickInput').value = localStorage.getItem('logos-modifica-nick') || ''; }catch(e){}
$('nickInput').addEventListener('input', () => {
  try{ localStorage.setItem('logos-modifica-nick', $('nickInput').value.trim()); }catch(e){}
});
function myNick(){ return $('nickInput').value.trim() || t('chat.someone','Qualcuno'); }

/* ============================== onboarding / install banners ============================== */
try{
  if (!localStorage.getItem('dvlogos-onboarded')) $('onboardBanner').classList.remove('hide');
}catch(e){}
$('onboardClose').addEventListener('click', () => {
  $('onboardBanner').classList.add('hide');
  try{ localStorage.setItem('dvlogos-onboarded','1'); }catch(e){}
});

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferredPrompt = null;
function showInstallBar(html, withButton){
  if (isStandalone) return;
  let dismissed = false; try{ dismissed = localStorage.getItem('dvlogos-install-dismissed') === '1'; }catch(e){}
  if (dismissed) return;
  $('installText').innerHTML = html;
  $('installBtn').classList.toggle('hide', !withButton);
  $('installBar').classList.remove('hide');
}
window.addEventListener('beforeinstallprompt', ev => {
  ev.preventDefault(); deferredPrompt = ev;
  showInstallBar(t('install.genericText'), true);
});
$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); try{ await deferredPrompt.userChoice; }catch(e){}
  deferredPrompt = null; $('installBar').classList.add('hide');
});
$('installClose').addEventListener('click', () => {
  $('installBar').classList.add('hide');
  try{ localStorage.setItem('dvlogos-install-dismissed','1'); }catch(e){}
});
if (isIOS && !isStandalone && location.protocol.startsWith('http')) showInstallBar(t('install.iosText'), false);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load', () => { navigator.serviceWorker.register('modifica-sw.js', { scope: './modifica.html' }).catch(()=>{}); });
}

/* ============================== WebRTC core ============================== */
const ICE = { iceServers: [ { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' } ] };
let pc = null, dc = null;
const CHUNK = 16 * 1024;

function b64encode(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64decode(str){ return decodeURIComponent(escape(atob(str))); }

/* ============ optional lock — a passphrase-sealed invite (off by default) ============
   With the lock on, the invite (and the reply that comes back) is encrypted with
   AES-GCM under a key derived from a spoken passphrase via PBKDF2-SHA256. It buys
   two concrete things: someone who intercepts the code cannot take the other
   person's place in the handshake, and the network addresses inside the blob stop
   being readable by whatever carries the message — a mail server, a chat provider,
   anyone in between. Every primitive here is the browser's own WebCrypto; nothing
   about the cryptography is hand-rolled.
   Honest limit: the strength is the passphrase's. That is why the app generates a
   random one instead of letting a person invent "1234" — roughly 42 bits, which,
   behind 250k PBKDF2 iterations, is far past what a guessing attack reaches in the
   minutes an invite is actually live. */
const LOCK_ITER = 250000;
const LOCK_WORDS = (
 'acqua albero amico ancora anello arco argento aria asse astro attimo aurora avena azzurro balena banco '+
 'barca basso bosco botte braccio bronzo bruco buio burro busta calma campo cane canto capra carta '+
 'casa cavallo cena cerchio chiave cielo cima cinema circo civetta collina colomba conchiglia corda corona corsa '+
 'costa cotone cresta cristallo croce cucina cupola danza dente deserto destino dito domenica dono duomo eco '+
 'edera elica erba fabbro faggio falco fango fardello faro favola felce ferro festa fiaba fibra fico '+
 'fiume foglia fondo fonte forma forno fortuna fossa fragola freccia fresco frutto fuoco gabbia gala galleria '+
 'gamba gatto gelo gemma ghiaccio giada giardino giglio ginepro giorno giostra globo gloria gola gomma gonna '+
 'grano grotta gruppo guanto guscio idea impero incenso indaco isola istante lago lampo lana lancia lastra '+
 'latte lauro lava legna lento leone lettera libro lido limone linea lino luce luna lupo maglia '+
 'mago mano mappa mare marmo maschera mattino medusa mela mente mercato miele miglio mimosa miniera mirto '+
 'monte mosaico mucca muro musica nastro natura nave nebbia neve nido nodo nome nord notte nube '+
 'nuvola oasi occhio olmo ombra onda opera orma oro orso orto ostrica ovest paese pagina palco '+
 'palma pane panno parco passo pasta patto pausa pepe pelle penna pera perla pesca pesce pianta '+
 'piazza piede pietra pino pioggia piuma poesia polvere ponte porta prato prugna pulce punto quaderno quercia '+
 'quiete radice ramo rana rete ricamo riso riva roccia rosa rovere rubino ruota sabbia sale salice '+
 'sasso scala scoglio sedia selva sentiero sera serpente sole sonno specchio spiga stagno stella strada suono'
).split(' ');

/* uniform draw, rejection-sampled so no word is more likely than another */
function pickWord(){
  const lim = Math.floor(256 / LOCK_WORDS.length) * LOCK_WORDS.length;
  const b = new Uint8Array(1);
  for(;;){ crypto.getRandomValues(b); if (b[0] < lim) return LOCK_WORDS[b[0] % LOCK_WORDS.length]; }
}
function makePassphrase(){
  const w = []; while (w.length < 4) w.push(pickWord());
  const n = new Uint16Array(1);
  for(;;){ crypto.getRandomValues(n); if (n[0] < 64000) break; }
  return w.join('-') + '-' + String(n[0] % 1000).padStart(3,'0');
}
/* forgiving on the typing side: case, spaces, dots and dashes all collapse to one form */
function normPass(s){ return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

function ab2b64(buf){ const b = new Uint8Array(buf); let s = ''; for (let i=0;i<b.length;i++) s += String.fromCharCode(b[i]); return btoa(s); }
function b642ab(s){ const bin = atob(s); const b = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) b[i] = bin.charCodeAt(i); return b; }

async function lockKey(pass, salt){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations: LOCK_ITER, hash:'SHA-256' },
    base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
}
async function sealPayload(obj, pass){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await lockKey(pass, salt);
  const ct   = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return b64encode(JSON.stringify({ v:2, e:1, t:obj.type, s:ab2b64(salt), i:ab2b64(iv), c:ab2b64(ct) }));
}
async function openPayload(env, pass){
  const key = await lockKey(pass, b642ab(env.s));
  const pt  = await crypto.subtle.decrypt({ name:'AES-GCM', iv: b642ab(env.i) }, key, b642ab(env.c));
  return JSON.parse(new TextDecoder().decode(pt));
}
/* People paste what they have: sometimes the bare code, more often the whole
   message their friend sent, link and greeting and all. Asking someone to pick
   out "just the code" is exactly the kind of instruction that loses a person, so
   the app digs the code out itself instead. */
function extractCode(raw){
  const s = (raw || '').trim();
  const link = s.match(/[#&]i=([^&\s]+)/);
  if (link){ try{ return decodeURIComponent(link[1]); }catch(e){ return link[1]; } }
  const runs = s.match(/[A-Za-z0-9+/=]{40,}/g);
  if (runs) return runs.reduce((a, b) => b.length > a.length ? b : a);
  return s;
}
function readEnvelope(raw){ return JSON.parse(b64decode(extractCode(raw))); }
function isLocked(env){ return !!(env && env.e === 1); }

let lockOn = false;      /* the switch on the create screen */
let sessionPass = '';    /* the passphrase in play, so the reply is sealed the same way */

/* The invite is only as good as the addresses inside it. Four seconds was
   enough on a quick network and not enough on a slow one, and a code sent
   before gathering finished is a code that simply never connects. */
async function waitIceComplete(peer){
  if (peer.iceGatheringState === 'complete') return;
  await new Promise(resolve => {
    const done = () => { peer.removeEventListener('icegatheringstatechange', check); resolve(); };
    const check = () => { if (peer.iceGatheringState === 'complete') done(); };
    peer.addEventListener('icegatheringstatechange', check);
    setTimeout(done, 9000);
  });
}
function setStatus(el, text, kind){ el.textContent = text; el.className = 'status' + (kind ? ' ' + kind : ''); }

/* getStats() turned out to be the wrong source for a connection diagnostic:
   on some browsers a candidate stat is only reported once it belongs to a
   pair that was actually tried, so "nothing gathered" and "gathered fine but
   no pair ever formed" read as the same empty result. The SDPs themselves
   don't have that ambiguity — every candidate a side gathers is written into
   its own description as plain text, and both stay exactly as they were even
   after the connection closes. */
function candidateTypesIn(sdp){
  if (!sdp) return [];
  const types = new Set();
  const re = /^a=candidate:\S+ \d+ \S+ \d+ \S+ \d+ typ (\w+)/gm;
  let m;
  while ((m = re.exec(sdp))) types.add(m[1]);
  return [...types];
}
function diagLine(pcObj){
  const mine = candidateTypesIn(pcObj.localDescription && pcObj.localDescription.sdp);
  const theirs = candidateTypesIn(pcObj.remoteDescription && pcObj.remoteDescription.sdp);
  return 'ICE ' + pcObj.iceConnectionState + ' · ' + pcObj.connectionState +
    ' · tu:' + (mine.join('+') || '—') + ' loro:' + (theirs.join('+') || '—');
}

/* Until now, a stalled connection left the screen silent — nothing told
   anyone it was still trying, or that it had given up. This watches the
   handshake and says so, either way, plus the technical line above: what
   kind of address each side actually found. */
function watchHandshakeProgress(pcObj, statusEl, diagEl){
  setStatus(statusEl, t('connect.waiting','In attesa della connessione…'));
  let settled = false;
  const tick = () => { if (diagEl && !settled) diagEl.textContent = diagLine(pcObj); };
  const diagTimer = diagEl ? setInterval(tick, 1200) : null;
  if (diagEl){ diagEl.classList.remove('hide'); tick(); }
  const stop = () => { if (diagTimer) clearInterval(diagTimer); };
  const onChange = () => {
    if (settled) return;
    const st = pcObj.connectionState;
    if (st === 'connected'){ settled = true; stop(); setStatus(statusEl, ''); if (diagEl) diagEl.classList.add('hide'); }
    else if (st === 'failed' || st === 'closed'){
      settled = true; stop();
      setStatus(statusEl, t('connect.failed','Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.'), 'bad');
    }
  };
  pcObj.addEventListener('connectionstatechange', onChange);
  setTimeout(() => {
    if (settled || pcObj.connectionState === 'connected') return;
    settled = true; stop();
    setStatus(statusEl, t('connect.slow','Ci sta mettendo più del solito — capita su reti molto filtrate (aziendali, alcune reti mobili) o se non siete online nello stesso momento. Aspettate ancora un attimo, oppure create un invito nuovo.'), 'bad');
  }, 25000);
}
function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--ink);'+
    'color:#0b0d10;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:700;z-index:50;box-shadow:var(--shadow)';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 2200);
}

let peerNick = '';
function wireDataChannel(channel){
  dc = channel;
  dc.binaryType = 'arraybuffer';
  pc.ontrack = ev => { if ($('remoteVideo').srcObject !== ev.streams[0]) $('remoteVideo').srcObject = ev.streams[0]; };
  dc.onopen = () => { enterChat(); dc.send(JSON.stringify({ type: 'hello', nick: myNick() })); };
  dc.onclose = () => { setStatus($('statusA'), t('session.newHint'), 'bad'); };
  dc.onmessage = onDcMessage;
}

/* ============================== safety number ==============================
   Every WebRTC connection is already encrypted with DTLS using a certificate
   each browser generates for that session — this doesn't add new cryptography,
   it only surfaces a fingerprint the browser already computed (via the
   standard, audited Web Crypto API) so two humans can compare it out of band.
   The offer/answer codes travel through an untrusted channel (WhatsApp, email,
   whatever); if someone intercepted and replaced them in transit, each side's
   local and remote certificates would not be the pair the two of you actually
   generated, and the codes below would not match. That mismatch is the only
   sign of that kind of tampering — nothing else in this page can detect it. */
function extractFingerprint(sdp){
  const m = sdp && sdp.match(/a=fingerprint:sha-256 ([0-9A-Fa-f:]+)/);
  return m ? m[1].toUpperCase() : null;
}
async function computeSafetyCode(){
  if (!pc || !pc.localDescription || !pc.remoteDescription) return null;
  const fpA = extractFingerprint(pc.localDescription.sdp);
  const fpB = extractFingerprint(pc.remoteDescription.sdp);
  if (!fpA || !fpB) return null;
  const combined = [fpA, fpB].sort().join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
  const bytes = new Uint8Array(digest);
  const groups = [];
  for (let i = 0; i < 12; i += 2) groups.push(String((bytes[i] << 8) | bytes[i+1]).padStart(5,'0'));
  return groups.join('  ');
}
/* ---------- a lasting identity, so verification can outlive one session ----------
   By default a browser mints a throwaway certificate for every connection, so the
   safety code would differ every time and "it changed" would mean nothing. Keeping
   one certificate makes the code stable for a given pair of people, which is what
   lets the app notice when it *does* change.
   The honest trade-off: a stable certificate is a stable identifier, so anyone you
   connect to can tell it is the same device again later. Since you only ever hand
   an invite to someone you chose, and they already know your name, that costs
   nothing here — and it is what buys real verification. */
const ID_DB = 'dvlogos-id';
function idbCert(mode, value){
  return new Promise(resolve => {
    let open;
    try{ open = indexedDB.open(ID_DB, 1); }catch(e){ return resolve(null); }
    open.onupgradeneeded = () => { try{ open.result.createObjectStore('kv'); }catch(e){} };
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      try{
        const store = open.result.transaction('kv', mode === 'get' ? 'readonly' : 'readwrite').objectStore('kv');
        if (mode === 'get'){
          const rq = store.get('cert');
          rq.onsuccess = () => resolve(rq.result || null);
          rq.onerror = () => resolve(null);
        } else {
          const rq = store.put(value, 'cert');
          rq.onsuccess = () => resolve(true);
          rq.onerror = () => resolve(null);
        }
      }catch(e){ resolve(null); }
    };
  });
}
let myCert = null;
async function myIdentity(){
  if (myCert) return myCert;
  const saved = await idbCert('get');
  /* a certificate about to expire would change the code on its own, so retire it early */
  if (saved && saved.expires && saved.expires > Date.now() + 7*24*3600*1000){ myCert = saved; return myCert; }
  try{
    myCert = await RTCPeerConnection.generateCertificate({
      name: 'ECDSA', namedCurve: 'P-256', expires: 365*24*3600*1000
    });
    await idbCert('put', myCert);
  }catch(e){ myCert = null; }   /* unsupported: fall back to a per-session certificate */
  return myCert;
}
async function newPeerConnection(){
  const cert = await myIdentity();
  return new RTCPeerConnection(cert ? Object.assign({}, ICE, { certificates: [cert] }) : ICE);
}

/* ---------- trust on first use: remember the code, speak up when it changes ---------- */
function safetyKey(nick){ return 'dvlogos-safety-' + (nick||'').trim().toLowerCase(); }
let safetyState = 'unknown';
function paintVerifyBadge(state){
  safetyState = state;
  const b = $('btnVerify');
  b.classList.remove('vok','vnew','vbad');
  if (state === 'ok')      { b.classList.add('vok');  b.textContent = '🔒 ' + t('verify.known','verificato'); }
  else if (state === 'new'){ b.classList.add('vnew'); b.textContent = t('verify.badge','🔒 verifica'); }
  else if (state === 'changed'){ b.classList.add('vbad'); b.textContent = '⚠️ ' + t('verify.changedShort','codice cambiato'); }
  else { b.textContent = t('verify.badge','🔒 verifica'); }
}
async function checkSafetyFor(nick){
  const code = await computeSafetyCode();
  if (!code || !nick) return;
  let rec = null;
  try{ rec = JSON.parse(localStorage.getItem(safetyKey(nick)) || 'null'); }catch(e){}
  if (!rec || !rec.code){
    try{ localStorage.setItem(safetyKey(nick), JSON.stringify({ code, since: Date.now() })); }catch(e){}
    paintVerifyBadge('new');
  } else if (rec.code === code){
    paintVerifyBadge('ok');
  } else {
    paintVerifyBadge('changed');
    sysLine(t('verify.changedWarn','⚠️ Il codice di sicurezza di questa persona è cambiato rispetto all\'ultima volta.'));
  }
}
function acceptNewSafety(nick){
  computeSafetyCode().then(code => {
    if (!code) return;
    try{ localStorage.setItem(safetyKey(nick), JSON.stringify({ code, since: Date.now() })); }catch(e){}
    paintVerifyBadge('ok');
    $('verifyPanel').classList.add('hide');
  });
}

$('btnVerify').addEventListener('click', async () => {
  $('menuPanel').classList.add('hide');
  $('safetyCodeText').textContent = '…';
  $('verifyPanel').classList.remove('hide');
  const code = await computeSafetyCode();
  $('safetyCodeText').textContent = code || t('verify.unavailable','Non ancora disponibile — riprova tra un istante.');

  let note = '', showAccept = false;
  if (safetyState === 'ok')      note = t('verify.noteKnown','Stesso codice dell\'ultima volta: nessuno si è messo in mezzo da allora.');
  else if (safetyState === 'new') note = t('verify.noteNew','Prima volta con questa persona: confrontate il codice a voce, poi l\'app se lo ricorda.');
  else if (safetyState === 'changed'){
    note = t('verify.noteChanged','Il codice è cambiato. Di solito vuol dire telefono nuovo o app reinstallata — ma è anche il segno che qualcuno si è messo in mezzo. Confrontatelo a voce prima di accettarlo.');
    showAccept = true;
  }
  $('verifyNote').textContent = note;
  $('btnAcceptSafety').classList.toggle('hide', !showAccept);
});
$('btnAcceptSafety').addEventListener('click', () => acceptNewSafety(peerNick));
$('btnCloseVerify').addEventListener('click', () => $('verifyPanel').classList.add('hide'));

function initials(name){
  const parts = (name||'').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function enterChat(){
  showScreen('screenChat');
  $('peerNameLbl').textContent = t('chat.someone');
  $('peerAvatar').textContent = '?';
  loadHistoryPlaceholder();
}

/* -------------------- side A: create the invite -------------------- */
/* The switch is the whole of the extra-security UI: off, the app behaves exactly
   as it always did; on, it costs the user one spoken passphrase and nothing else. */
$('lockRow').addEventListener('click', () => {
  lockOn = !lockOn;
  $('lockRow').classList.toggle('on', lockOn);
  $('lockRow').setAttribute('aria-pressed', lockOn ? 'true' : 'false');
});
$('lockRow').addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); $('lockRow').click(); }
});

$('btnCreate').addEventListener('click', async () => {
  $('btnCreate').disabled = true;
  setStatus($('statusA'), lockOn ? t('lock.working','…') : '');
  pc = await newPeerConnection();
  wireDataChannel(pc.createDataChannel('logos-modifica'));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitIceComplete(pc);
  const payload = { type: 'offer', sdp: pc.localDescription.sdp };
  let code;
  if (lockOn){
    sessionPass = makePassphrase();
    code = await sealPayload(payload, sessionPass);
    $('passWord').textContent = sessionPass;
    $('passBox').classList.remove('hide');
  } else {
    sessionPass = '';
    code = b64encode(JSON.stringify(payload));
    $('passBox').classList.add('hide');
  }
  setStatus($('statusA'), '');
  $('offerOut').textContent = code;
  $('offerBlock').classList.remove('hide');
  $('pasteAnswerCard').classList.remove('hide');
  if (await robustCopy(code)) toast(t('toast.sealCopied'));
});
function inviteLink(code){ return location.origin + location.pathname + '#i=' + encodeURIComponent(code); }

/* Copy that actually works: try the modern API, then a legacy textarea+execCommand
   fallback (not gated by the same permission/activation rules), and only if both
   fail, select the code on screen so a manual Ctrl/Cmd+C takes one keystroke. */
async function robustCopy(text){
  try{ await navigator.clipboard.writeText(text); return true; }catch(e){}
  try{
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) return true;
  }catch(e){}
  return false;
}
function selectCodeBox(el){
  try{
    /* the code now lives inside a collapsed "show the code" section; selecting
       text nobody can see would be a worse dead end than the failure itself */
    const box = el.closest('details');
    if (box) box.open = true;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.scrollIntoView({ behavior:'smooth', block:'center' });
  }catch(e){}
}
async function copyOrSelect(text, boxEl){
  if (await robustCopy(text)){ toast(t('toast.sealCopied')); return; }
  if (boxEl){ selectCodeBox(boxEl); toast(t('toast.copySelected', t('toast.copyFail'))); }
  else toast(t('toast.copyFail'));
}

/* Sharing the app itself — not an invite to a chat, just "here's where to get it" */
$('btnShareApp').addEventListener('click', async () => {
  const link = location.origin + location.pathname;
  const text = t('home.shareAppText') + link;
  try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  await copyOrSelect(text, null);
});
$('btnShareOffer').addEventListener('click', async () => {
  const link = inviteLink($('offerOut').textContent);
  const text = t('invite.shareText') + link;
  try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  await copyOrSelect(text, $('offerOut'));
});
$('btnCopyOffer').addEventListener('click', async () => {
  await copyOrSelect($('offerOut').textContent, $('offerOut'));
});
$('btnConnectAsA').addEventListener('click', async () => {
  if (!pc) return;
  try{
    const env = readEnvelope($('answerIn').value);
    /* the reply comes back sealed under the same passphrase we handed out */
    const parsed = isLocked(env) ? await openPayload(env, sessionPass) : env;
    if (parsed.type !== 'answer') throw new Error('bad');
    await pc.setRemoteDescription({ type: 'answer', sdp: parsed.sdp });
    watchHandshakeProgress(pc, $('statusA'), $('diagA'));
  }catch(e){ setStatus($('statusA'), t('lock.badAnswer','—'), 'bad'); }
});

/* -------------------- side B: accept the invite -------------------- */
/* The passphrase field appears by itself, only when the pasted code is actually
   locked — nobody has to know in advance which kind of invite they were sent. */
function refreshJoinLock(){
  let locked = false;
  try{ locked = isLocked(readEnvelope($('offerIn').value)); }catch(e){}
  $('passAsk').classList.toggle('hide', !locked);
}
$('offerIn').addEventListener('input', refreshJoinLock);

$('btnCreateAnswer').addEventListener('click', async () => {
  let env, parsed;
  try{ env = readEnvelope($('offerIn').value); }
  catch(e){ setStatus($('statusB'), t('join.badCode','—'), 'bad'); return; }

  if (isLocked(env)){
    const pass = normPass($('passIn').value);
    if (!pass){ setStatus($('statusB'), t('lock.needPass','—'), 'bad'); return; }
    setStatus($('statusB'), t('lock.working','…'));
    try{ parsed = await openPayload(env, pass); }
    catch(e){ setStatus($('statusB'), t('lock.wrongPass','—'), 'bad'); return; }
    sessionPass = pass;
  } else {
    parsed = env;
    sessionPass = '';
  }
  if (!parsed || parsed.type !== 'offer'){ setStatus($('statusB'), t('join.badCode','—'), 'bad'); return; }
  setStatus($('statusB'), '');
  $('btnCreateAnswer').disabled = true;
  pc = await newPeerConnection();
  pc.ondatachannel = ev => wireDataChannel(ev.channel);
  await pc.setRemoteDescription({ type: 'offer', sdp: parsed.sdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitIceComplete(pc);
  const reply = { type: 'answer', sdp: pc.localDescription.sdp };
  const code = sessionPass ? await sealPayload(reply, sessionPass) : b64encode(JSON.stringify(reply));
  $('answerOut').textContent = code;
  $('answerBlock').classList.remove('hide');
  if (await robustCopy(code)) toast(t('toast.sealCopied'));
  watchHandshakeProgress(pc, $('statusB'), $('diagB'));
});
$('btnShareAnswer').addEventListener('click', async () => {
  const text = t('invite.answerText') + $('answerOut').textContent;
  try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  await copyOrSelect(text, $('answerOut'));
});
$('btnCopyAnswer').addEventListener('click', async () => {
  await copyOrSelect($('answerOut').textContent, $('answerOut'));
});

/* opening a shared invite link pre-fills the code so the second person barely has to think */
(function autoFillFromHash(){
  const m = location.hash.match(/[#&]i=([^&]+)/);
  if (!m) return;
  try{
    const code = decodeURIComponent(m[1]);
    JSON.parse(b64decode(code));
    $('offerIn').value = code;
    refreshJoinLock();
    showScreen('screenJoin');
  }catch(e){}
})();

/* ============================== history (local, per contact name) ============================== */
function historyKey(nick){ return 'dvlogos-history-' + (nick||'').trim().toLowerCase(); }
function loadHistoryPlaceholder(){ $('msgs').innerHTML = ''; }
function loadHistoryFor(nick){
  $('msgs').innerHTML = '';
  let list = [];
  try{ list = JSON.parse(localStorage.getItem(historyKey(nick)) || '[]'); }catch(e){}
  if (list.length){
    const d = document.createElement('div'); d.className = 'daymark';
    d.textContent = (CURLANG==='it' ? 'Cronologia con ' : 'History with ') + nick;
    $('msgs').appendChild(d);
  }
  list.forEach(m => renderMsg(m.html, m.mine, false));
}
function saveToHistory(nick, html, mine){
  if (!nick) return;
  const key = historyKey(nick);
  let list = [];
  try{ list = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){}
  list.push({ html, mine, t: Date.now() });
  if (list.length > 300) list = list.slice(-300);
  try{ localStorage.setItem(key, JSON.stringify(list)); }catch(e){}
}
$('btnClearHistory').addEventListener('click', () => {
  if (peerNick) try{ localStorage.removeItem(historyKey(peerNick)); }catch(e){}
  $('msgs').innerHTML = '';
  toast(t('history.cleared'));
});

/* ============================== recent contacts (local only) ==============================
   Remembered automatically the moment someone's 'hello' arrives — no manual "add contact"
   step. This does not create any persistent connection or account: it is a shortcut back to
   the invite screen plus that person's saved history. A fresh code exchange is still needed
   every time, because nothing here runs a server that could keep anyone "always connected". */
function loadContacts(){
  try{ return JSON.parse(localStorage.getItem('dvlogos-contacts') || '[]'); }catch(e){ return []; }
}
function saveContacts(list){ try{ localStorage.setItem('dvlogos-contacts', JSON.stringify(list)); }catch(e){} }
function touchContact(nick){
  if (!nick) return;
  let list = loadContacts();
  list = list.filter(c => c.nick.toLowerCase() !== nick.toLowerCase());
  list.unshift({ nick, lastSeen: Date.now() });
  if (list.length > 40) list = list.slice(0, 40);
  saveContacts(list);
  renderContacts();
}
function relTime(ts){
  const mins = Math.round((Date.now() - ts) / 60000);
  if (CURLANG === 'it'){
    if (mins < 1) return 'adesso';
    if (mins < 60) return mins + ' min fa';
    if (mins < 24*60) return Math.round(mins/60) + ' h fa';
    return Math.round(mins/1440) + ' g fa';
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  if (mins < 24*60) return Math.round(mins/60) + ' h ago';
  return Math.round(mins/1440) + ' d ago';
}
function renderContacts(){
  const list = loadContacts();
  $('contactsCard').classList.toggle('hide', list.length === 0);
  $('contactsList').innerHTML = list.map(c => `
    <div class="contactrow" data-nick="${esc(c.nick)}">
      <div class="av">${esc(initials(c.nick))}</div>
      <div class="info"><b>${esc(c.nick)}</b><span>${esc(relTime(c.lastSeen))}</span></div>
      <button class="rm" data-rm="${esc(c.nick)}" title="Rimuovi" aria-label="Rimuovi">×</button>
    </div>`).join('');
}
$('contactsList').addEventListener('click', ev => {
  const rm = ev.target.closest('[data-rm]');
  if (rm){
    saveContacts(loadContacts().filter(c => c.nick !== rm.getAttribute('data-rm')));
    renderContacts();
    return;
  }
  const row = ev.target.closest('.contactrow');
  if (!row) return;
  const nick = row.getAttribute('data-nick');
  showScreen('screenStart');
  setStatus($('statusA'), (CURLANG==='it' ? 'Stai preparando un invito per ' : 'Preparing an invite for ') + nick + '…');
});

/* ============================== chat: text + files ============================== */
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function timeNow(){ return new Date().toLocaleTimeString(CURLANG==='it'?'it-IT':'en-US', {hour:'2-digit', minute:'2-digit'}); }
function renderMsg(bodyHtml, mine, persist){
  const row = document.createElement('div'); row.className = 'row ' + (mine ? 'me' : 'them');
  const bub = document.createElement('div'); bub.className = 'bub'; bub.innerHTML = bodyHtml;
  row.appendChild(bub);
  $('msgs').appendChild(row);
  $('msgs').scrollTop = $('msgs').scrollHeight;
  if (persist !== false) saveToHistory(peerNick, bodyHtml, mine);
}
function sysLine(text){
  const d = document.createElement('div'); d.className = 'sysline'; d.textContent = text;
  $('msgs').appendChild(d); $('msgs').scrollTop = $('msgs').scrollHeight;
}

async function sendWithBackpressure(channel, buf){
  const HIGH = 1 << 20;
  if (channel.bufferedAmount > HIGH){
    await new Promise(resolve => { const c=()=>{ if(channel.bufferedAmount<=HIGH) resolve(); else setTimeout(c,30); }; c(); });
  }
  channel.send(buf);
}

$('btnSend').addEventListener('click', sendText);
$('msgInput').addEventListener('keydown', ev => { if (ev.key === 'Enter') sendText(); });
function sendText(){
  const text = $('msgInput').value.trim();
  if (!text || !dc || dc.readyState !== 'open') return;
  dc.send(JSON.stringify({ type: 'text', text }));
  renderMsg(esc(text) + '<div class="meta">' + timeNow() + '</div>', true);
  $('msgInput').value = '';
}

async function sendFile(file){
  if (!file || !dc || dc.readyState !== 'open') return;
  const id = Math.random().toString(36).slice(2);
  dc.send(JSON.stringify({ type: 'file-start', id, name: file.name, mime: file.type, size: file.size }));
  let off = 0;
  while (off < file.size){
    const end = Math.min(off + CHUNK, file.size);
    const buf = await file.slice(off, end).arrayBuffer();
    const framed = new Uint8Array(buf.byteLength + 16);
    framed.set(new TextEncoder().encode(id.padEnd(16,' ').slice(0,16)), 0);
    framed.set(new Uint8Array(buf), 16);
    await sendWithBackpressure(dc, framed);
    off = end;
  }
  dc.send(JSON.stringify({ type: 'file-end', id }));
  const url = URL.createObjectURL(file);
  const isImg = file.type.startsWith('image/'), isVid = file.type.startsWith('video/'), isAud = file.type.startsWith('audio/');
  const preview = isImg ? '<img src="'+url+'">' : isVid ? '<video src="'+url+'" controls></video>'
                : isAud ? '<audio src="'+url+'" controls></audio>' : '<a href="'+url+'" download="'+esc(file.name)+'" class="filelink">📄 '+esc(file.name)+' ↓</a>';
  renderMsg(preview + '<div class="meta">' + timeNow() + '</div>', true);
}
$('btnAttach').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', () => { const f=$('fileInput').files[0]; $('fileInput').value=''; if (f) sendFile(f); });

/* voice messages */
let mediaRecorder = null, recordedChunks = [];
$('btnMic').addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording'){ mediaRecorder.stop(); return; }
  let stream;
  try{ stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch(e){ sysLine(micFailMessage(e)); return; }
  recordedChunks = [];
  const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
  mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  mediaRecorder.ondataavailable = ev => { if (ev.data.size > 0) recordedChunks.push(ev.data); };
  mediaRecorder.onstop = () => {
    stream.getTracks().forEach(tr => tr.stop());
    $('btnMic').textContent = '🎤';
    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    sendFile(new File([blob], 'vocale.webm', { type: blob.type }));
  };
  mediaRecorder.start();
  $('btnMic').textContent = '⏹';
  toast(t('mic.recording'));
});

/* emoji picker */
const EMOJI = ['😀','😂','😍','🥰','😎','🤔','😴','😭','😡','🙏','👍','👎','👏','🙌','💪','✌️','🤝','❤️','🔥','✨',
  '🎉','🎓','📚','☀️','🌙','🌧️','☕','🍕','🎵','⚽','🚀','💡','✅','❌','⏰','📎','📷','🎥','🎤','💬'];
$('emojiPop').innerHTML = EMOJI.map(e => '<button type="button">'+e+'</button>').join('');
$('btnEmoji').addEventListener('click', () => $('emojiPop').classList.toggle('hide'));
$('emojiPop').addEventListener('click', ev => {
  if (ev.target.tagName !== 'BUTTON') return;
  $('msgInput').value += ev.target.textContent;
  $('msgInput').focus();
});
document.addEventListener('click', ev => {
  if (!$('emojiPop').classList.contains('hide') && !$('emojiPop').contains(ev.target) && ev.target.id !== 'btnEmoji') $('emojiPop').classList.add('hide');
});

/* menu panel */
$('btnMenu').addEventListener('click', () => $('menuPanel').classList.toggle('hide'));

const incoming = {};
function onDcMessage(ev){
  if (typeof ev.data === 'string'){
    let msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
    /* everything past this point is data from the other side, so treat it as
       untrusted: anything without a proper type is dropped rather than trusted
       to have the shape the branches below expect */
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'hello'){
      peerNick = (msg.nick || '').trim();
      if (peerNick){
        $('connState').textContent = t('chat.connected');
        $('peerNameLbl').textContent = peerNick;
        $('peerAvatar').textContent = initials(peerNick);
        loadHistoryFor(peerNick);
        touchContact(peerNick);
        sysLine(peerNick + ' ' + t('call.joined'));
        checkSafetyFor(peerNick);
      }
    } else if (msg.type === 'text'){
      const label = peerNick ? '<span class="who">'+esc(peerNick)+'</span>' : '';
      renderMsg(label + esc(msg.text) + '<div class="meta">' + timeNow() + '</div>', false);
    } else if (msg.type === 'file-start'){
      incoming[msg.id] = { chunks: [], meta: msg };
    } else if (msg.type === 'file-end'){
      const rec = incoming[msg.id]; if (!rec) return;
      const blob = new Blob(rec.chunks, { type: rec.meta.mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const mime = rec.meta.mime || '';
      const isImg = mime.startsWith('image/'), isVid = mime.startsWith('video/'), isAud = mime.startsWith('audio/');
      let html = isImg ? '<img src="'+url+'">' : isVid ? '<video src="'+url+'" controls></video>'
               : isAud ? '<audio src="'+url+'" controls></audio>' : '<a href="'+url+'" download="'+esc(rec.meta.name)+'" class="filelink">📄 '+esc(rec.meta.name)+' ↓</a>';
      renderMsg(html + '<div class="meta">' + timeNow() + '</div>', false);
      delete incoming[msg.id];
    } else if (msg.type === 'wipe'){
      destroyNow(false);
    } else if (msg.type.indexOf('call-') === 0){
      handleCallSignal(msg);
    }
  } else {
    const bytes = new Uint8Array(ev.data);
    const id = new TextDecoder().decode(bytes.subarray(0,16)).trim();
    const rec = incoming[id];
    if (rec) rec.chunks.push(bytes.subarray(16));
  }
}

/* ============================== calls ============================== */
let localStream = null, callKind = null, callState = 'idle';
let micOn = true, camOn = true;
function sig(msg){ if (dc && dc.readyState === 'open') dc.send(JSON.stringify(msg)); }
function setCallStatus(text){ $('callStatus').textContent = text; }

/* "Permission denied" was covering three different problems with one message:
   no camera/mic ever found, one that's busy in another app right now, and one
   actually blocked by the browser. Each needs a different action from the
   person reading it, so each gets named. */
function micFailMessage(e){
  const name = e && e.name;
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError')
    return t('call.micFailNotFound','Non trovo un microfono o una fotocamera su questo dispositivo.');
  if (name === 'NotReadableError' || name === 'TrackStartError')
    return t('call.micFailBusy','Il microfono o la fotocamera sono già in uso da un\'altra app (Zoom, Teams, un\'altra scheda…). Chiudila e riprova.');
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError')
    return t('call.micFailDenied','Il browser ha bloccato microfono e fotocamera per questo sito. Controlla l\'icona del lucchetto vicino all\'indirizzo e consenti l\'accesso, poi ricarica la pagina.');
  return t('call.micFail','Microfono o fotocamera non disponibili, o permesso negato.');
}

/* ringtone: two-tone loop synthesised with Web Audio — no external audio file
   needed. Also vibrates on devices that support it (Android; iOS Safari has
   no Vibration API, a real platform limit, not something a page can add). */
let ringAudioCtx = null, ringTimer = null, vibrateTimer = null, callTimeoutTimer = null;
function playRingTone(loud){
  try{
    if (!ringAudioCtx) ringAudioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const ctx = ringAudioCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
    const now = ctx.currentTime;
    [ [480,0], [620,0.02] ].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const g = loud ? 0.11 : 0.05;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(g, now + delay + 0.05);
      gain.gain.setValueAtTime(g, now + delay + 0.9);
      gain.gain.linearRampToValueAtTime(0, now + delay + 1.0);
      osc.start(now + delay); osc.stop(now + delay + 1.05);
    });
  }catch(e){}
}
function startRing(loud){
  stopRing();
  playRingTone(loud);
  ringTimer = setInterval(() => playRingTone(loud), 2200);
  if (loud && navigator.vibrate){
    navigator.vibrate([500,300,500,1200]);
    vibrateTimer = setInterval(() => navigator.vibrate([500,300,500,1200]), 2500);
  }
}
function stopRing(){
  clearInterval(ringTimer); ringTimer = null;
  clearInterval(vibrateTimer); vibrateTimer = null;
  if (navigator.vibrate) navigator.vibrate(0);
}
function armCallTimeout(){
  clearTimeout(callTimeoutTimer);
  callTimeoutTimer = setTimeout(() => {
    if (callState === 'ringing-out' || callState === 'ringing-in'){
      const wasIncoming = callState === 'ringing-in';
      sig({ type: 'call-end' });
      endCall(false);
      sysLine(wasIncoming ? (peerNick||t('chat.someone')) + ' — ' + t('call.busy') : t('call.busy'));
    }
  }, 35000);
}
function disarmCallTimeout(){ clearTimeout(callTimeoutTimer); callTimeoutTimer = null; }

async function startCall(kind){
  if (callState !== 'idle' || !dc || dc.readyState !== 'open') return;
  callKind = kind; callState = 'ringing-out';
  try{ localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' }); }
  catch(e){ sysLine(micFailMessage(e)); callState = 'idle'; callKind = null; return; }
  $('callBox').classList.remove('hide');
  $('localVideo').classList.toggle('hide', kind !== 'video');
  $('localVideo').srcObject = localStream;
  setCallStatus(kind === 'video' ? t('call.ringingVideo') : t('call.ringingAudio'));
  startRing(false);
  armCallTimeout();
  sig({ type: 'call-invite', kind });
}
function handleCallSignal(msg){
  if (msg.type === 'call-invite'){
    if (callState !== 'idle'){ sig({ type: 'call-busy' }); return; }
    callKind = msg.kind; callState = 'ringing-in';
    $('incomingCallText').textContent = (peerNick || t('chat.someone')) + ' ' + (msg.kind === 'video' ? t('call.videoInvite') : t('call.audioInvite'));
    $('incomingCall').classList.remove('hide');
    startRing(true);
    armCallTimeout();
  } else if (msg.type === 'call-busy'){ stopRing(); disarmCallTimeout(); endCall(false); sysLine((peerNick||t('chat.someone')) + ' ' + t('call.busy'));
  } else if (msg.type === 'call-decline'){ stopRing(); disarmCallTimeout(); endCall(false); sysLine((peerNick||t('chat.someone')) + ' ' + t('call.declinedBy'));
  } else if (msg.type === 'call-accept'){ stopRing(); disarmCallTimeout(); onCallAccepted();
  } else if (msg.type === 'call-offer-sdp'){ onCallOfferSdp(msg.sdp);
  } else if (msg.type === 'call-answer-sdp'){ pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }).catch(()=>{});
  } else if (msg.type === 'call-end'){ stopRing(); disarmCallTimeout(); endCall(false); }
}
$('btnAcceptCall').addEventListener('click', async () => {
  stopRing(); disarmCallTimeout();
  $('incomingCall').classList.add('hide');
  try{ localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callKind === 'video' }); }
  catch(e){ sysLine(micFailMessage(e)); sig({ type: 'call-decline' }); callState = 'idle'; callKind = null; return; }
  localStream.getTracks().forEach(tr => pc.addTrack(tr, localStream));
  $('callBox').classList.remove('hide');
  $('localVideo').classList.toggle('hide', callKind !== 'video');
  $('localVideo').srcObject = localStream;
  setCallStatus(callKind === 'video' ? t('call.inVideo') : t('call.inAudio'));
  callState = 'active';
  sig({ type: 'call-accept' });
});
$('btnDeclineCall').addEventListener('click', () => {
  stopRing(); disarmCallTimeout();
  $('incomingCall').classList.add('hide'); sig({ type: 'call-decline' }); callState = 'idle'; callKind = null;
});
async function onCallAccepted(){
  localStream.getTracks().forEach(tr => pc.addTrack(tr, localStream));
  const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
  sig({ type: 'call-offer-sdp', sdp: pc.localDescription.sdp });
  setCallStatus(callKind === 'video' ? t('call.inVideo') : t('call.inAudio'));
  callState = 'active';
}
async function onCallOfferSdp(sdp){
  await pc.setRemoteDescription({ type: 'offer', sdp });
  const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
  sig({ type: 'call-answer-sdp', sdp: pc.localDescription.sdp });
}
function endCall(tellPeer){
  stopRing(); disarmCallTimeout();
  if (tellPeer) sig({ type: 'call-end' });
  if (localStream){ localStream.getTracks().forEach(tr => tr.stop()); localStream = null; }
  $('callBox').classList.add('hide'); $('incomingCall').classList.add('hide');
  $('remoteVideo').srcObject = null; $('localVideo').srcObject = null;
  callState = 'idle'; callKind = null; micOn = true; camOn = true;
  $('btnMuteCall').textContent = '🎤'; $('btnCamCall').textContent = '🎥';
}
$('btnCallAudio').addEventListener('click', () => startCall('audio'));
$('btnCallVideo').addEventListener('click', () => startCall('video'));
$('btnHangup').addEventListener('click', () => endCall(true));
$('btnMuteCall').addEventListener('click', () => {
  if (!localStream) return;
  micOn = !micOn; localStream.getAudioTracks().forEach(tr => tr.enabled = micOn);
  $('btnMuteCall').textContent = micOn ? '🎤' : '🔇';
});
$('btnCamCall').addEventListener('click', () => {
  if (!localStream) return;
  camOn = !camOn; localStream.getVideoTracks().forEach(tr => tr.enabled = camOn);
  $('btnCamCall').textContent = camOn ? '🎥' : '🚫';
});

/* ============================== self-destruct ============================== */
let destructTimer = null, destructDeadline = 0;
function destroyNow(tellPeer){
  clearInterval(destructTimer); destructTimer = null;
  if (tellPeer && dc && dc.readyState === 'open'){ try{ dc.send(JSON.stringify({ type:'wipe' })); }catch(e){} }
  endCall(false);
  $('msgs').innerHTML = '';
  sysLine(t('destruct.done'));
  if (dc) try{ dc.close(); }catch(e){}
  if (pc) try{ pc.close(); }catch(e){}
  dc = null; pc = null;
  $('destructCountdown').classList.add('hide');
  $('btnDisarmDestruct').classList.add('hide');
  $('connState').textContent = t('session.closed');
}
$('btnArmDestruct').addEventListener('click', () => {
  const minutes = parseInt($('destructMinutes').value, 10);
  destructDeadline = Date.now() + minutes * 60000;
  $('destructCountdown').classList.remove('hide');
  $('btnDisarmDestruct').classList.remove('hide');
  const tick = () => {
    const left = Math.max(0, destructDeadline - Date.now());
    if (left <= 0){ destroyNow(true); return; }
    const m = Math.floor(left/60000), s = Math.floor((left%60000)/1000);
    $('destructCountdown').textContent = t('destruct.countdown') + m + ':' + String(s).padStart(2,'0');
  };
  tick(); destructTimer = setInterval(tick, 1000);
});
$('btnDisarmDestruct').addEventListener('click', () => {
  clearInterval(destructTimer); destructTimer = null;
  $('destructCountdown').classList.add('hide'); $('btnDisarmDestruct').classList.add('hide');
});
$('btnNewSession').addEventListener('click', () => {
  clearInterval(destructTimer); destructTimer = null;
  $('destructCountdown').classList.add('hide'); $('btnDisarmDestruct').classList.add('hide');
  endCall(false);
  if (dc) try{ dc.close(); }catch(e){}
  if (pc) try{ pc.close(); }catch(e){}
  pc = null; dc = null; peerNick = '';
  $('msgs').innerHTML = '';
  $('offerBlock').classList.add('hide'); $('offerOut').textContent = '';
  $('answerBlock').classList.add('hide'); $('answerOut').textContent = '';
  $('pasteAnswerCard').classList.add('hide');
  $('offerIn').value = ''; $('answerIn').value = '';
  $('passBox').classList.add('hide'); $('passWord').textContent = '';
  $('passAsk').classList.add('hide'); $('passIn').value = ''; sessionPass = '';
  paintVerifyBadge('unknown'); $('verifyNote').textContent = ''; $('btnAcceptSafety').classList.add('hide');
  $('btnCreate').disabled = false; $('btnCreateAnswer').disabled = false;
  setStatus($('statusA'), ''); setStatus($('statusB'), '');
  $('diagA').classList.add('hide'); $('diagB').classList.add('hide');
  $('menuPanel').classList.add('hide');
  showScreen('screenHome');
});

/* ---------------- the app seals itself ----------------
   Encryption is worth nothing if someone can simply hand you a different app.
   The page hashes its own source and prints the fingerprint, so a tampered or
   substituted copy is visible: compare it with the published one, or compute it
   yourself with `shasum -a 256` on the downloaded file. Same idea as LOGOS,
   turned on the tool itself.
   The app is three files, so sealing only the page would prove nothing about the
   logic — that all lives in the script. Each file is hashed separately so any one
   of them can be checked on its own. */
async function sha256Hex(buf){
  const d = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2,'0')).join('');
}
(async function selfSeal(){
  try{
    const base = location.pathname.replace(/[^/]*$/, '');
    const rows = [];
    for (const f of ['modifica.html', 'modifica.css', 'modifica.js']){
      const res = await fetch(base + f, { cache: 'no-store' });
      if (!res.ok) return;
      rows.push(f + '  ' + await sha256Hex(await res.arrayBuffer()));
    }
    $('sealLine').textContent = t('footer.seal','SHA-256: ');
    for (const r of rows){
      const div = document.createElement('div');
      div.textContent = r;
      $('sealLine').appendChild(div);
    }
    $('sealLine').classList.remove('hide');
  }catch(e){ /* offline, or a browser that will not fetch its own files: stay quiet */ }
})();

/* ---------------- one tap instead of a long press ----------------
   Holding a finger on a box until a menu appears, then finding "Paste", is one
   of the places people give up. This is the same thing as a button. */
async function pasteInto(el){
  try{
    const text = await navigator.clipboard.readText();
    if (text && text.trim()){
      el.value = text.trim();
      el.dispatchEvent(new Event('input'));
      return;
    }
    toast(t('toast.clipboardEmpty','Non c\'è niente da incollare.'));
  }catch(e){
    /* permission refused, or a browser that will not read the clipboard */
    el.focus();
    toast(t('toast.pasteManually','Tieni premuto sul riquadro e scegli Incolla.'));
  }
}
$('btnPasteOffer').addEventListener('click', () => pasteInto($('offerIn')));
$('btnPasteAnswer').addEventListener('click', () => pasteInto($('answerIn')));

/* ---------------- bigger text, remembered ----------------
   The single most useful thing for eyes that are not twenty any more, and it
   costs nothing to anyone who never touches it. */
function applyTextSize(cls){
  document.documentElement.classList.remove('ts-l','ts-xl');
  if (cls) document.documentElement.classList.add(cls);
  for (const b of document.querySelectorAll('.textsize button')){
    b.classList.toggle('on', (b.dataset.ts || '') === (cls || ''));
  }
  try{ localStorage.setItem('dvlogos-textsize', cls || ''); }catch(e){}
}
for (const b of document.querySelectorAll('.textsize button')){
  b.addEventListener('click', () => applyTextSize(b.dataset.ts || ''));
}
applyTextSize((() => { try{ return localStorage.getItem('dvlogos-textsize') || ''; }catch(e){ return ''; } })());

initLang();
renderContacts();
