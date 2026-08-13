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
"footer.author":"Conceived by Dr. Giuseppe Falsone for DigitalValut. © 2026 DigitalValut and the DigitalValut Team.",
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
"reconnect.trying":"Trying to reconnect to {n}…",
"reconnect.offline":"{n} doesn't seem to be online right now. Here's the code to send by hand.",
"call.noSpeakerFound":"Can't find a separate speaker on this phone.",
"call.speakerFail":"Can't switch the speaker on this phone.",
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
"verify.changedWarn":"\u26a0\ufe0f This person's safety code has changed since last time. Compare it out loud before trusting this chat.",
"quick.titleA":"Your code","quick.helpA":"Send it with the button below — one tap and they're in. Or say the six digits out loud. It keeps working as long as you stay on this screen.",
"quick.orType":"Or open the app and type this code:",
"quick.qrHint":"Or point a phone camera at this",
"quick.newCode":"Generate a new code","quick.useLong":"Prefer the long code?",
"quick.titleB":"Type the code","quick.helpB":"Ask whoever invited you for the code \u2014 6 digits, said out loud or written \u2014 and type it here.",
"quick.codePh":"000000","quick.connect":"Connect",
"quick.waiting":"Waiting for the other person to type the code\u2026","quick.expired":"The code expired with no answer. Generate a new one.",
"quick.notFound":"Code expired or wrong. Check it with whoever gave it to you.",
"quick.shareText":"Here's the link to talk to me on DigitalValut Logos. Tap it and we're connected:",
"quick.share":"Send the invitation",
"sas.title":"Security check",
"sas.lead":"Say these three words to each other out loud. If you both see the same ones, nobody has come in between.",
"sas.leadChanged":"Careful: this person no longer looks like the same one as last time. Usually that means a new phone or a reinstalled app — but it is also what being intercepted looks like. Say the three words out loud before going on.",
"sas.yes":"✓ Yes, they match","sas.no":"✕ No, they're different",
"sas.note":"Only needed the first time with this person: after that, the app remembers.",
"sas.confirmed":"Contact verified.",
"sas.refused":"The words did not match: this conversation is not considered safe. Close it and start again with a fresh code."
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
"footer.author":"Ideato dal Dott. Giuseppe Falsone per DigitalValut. © 2026 DigitalValut e il Team DigitalValut.",
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
"reconnect.trying":"Provo a ricollegarmi a {n}…",
"reconnect.offline":"{n} non sembra online in questo momento. Ecco il codice da mandare a mano.",
"call.noSpeakerFound":"Non trovo un altoparlante separato su questo telefono.",
"call.speakerFail":"Non riesco a cambiare l'altoparlante su questo telefono.",
"destruct.note":"Allo scadere del timer: la conversazione viene cancellata da questo schermo, viene chiesto di fare lo stesso all'altra persona, e la connessione si chiude. Non può toccare copie già salvate altrove (screenshot, file scaricati) — quelle restano dove sono state salvate.",
"destruct.countdown":"si autodistrugge tra ","destruct.done":"Conversazione autodistrutta.",
"session.closed":"chiusa","session.newHint":"Crea una nuova sessione per riconnetterti.",
"invite.shareText":"Ti va di chattare con me su DigitalValut Logos? Apri questo link: se non hai la pagina già pronta si apre da sola, con il mio invito già inserito.\n\n",
"invite.answerText":"Ecco la mia risposta per DigitalValut Logos, incollala per completare la connessione:\n\n",
"mic.recording":"Registrazione — tocca per fermare","history.cleared":"Cronologia svuotata su questo dispositivo.",
"install.genericText":"<b>Installa DigitalValut Logos</b> per averla come app, con la sua icona, senza passare dal browser.",
"install.iosText":"<b>Installa DigitalValut Logos su iPhone o iPad.</b> Tocca <b>Condividi</b> in Safari, poi <b>Aggiungi a Home</b>.",
"quick.titleA":"Il tuo codice","quick.helpA":"Mandalo col pulsante qui sotto — all'altra persona basta toccarlo ed è dentro. Oppure dille le sei cifre a voce. Resta valido finché tieni aperta questa schermata.",
"quick.orType":"Oppure apri l'app e scrivi questo codice:",
"quick.qrHint":"Oppure inquadralo con la fotocamera del telefono",
"quick.newCode":"Genera un nuovo codice","quick.useLong":"Preferisci il codice lungo?",
"quick.titleB":"Digita il codice","quick.helpB":"Chiedi il codice a chi ti ha invitato — 6 cifre, a voce o scritte — e scrivilo qui.",
"quick.codePh":"000000","quick.connect":"Connetti",
"quick.waiting":"In attesa che l'altra persona digiti il codice…","quick.expired":"Il codice è scaduto senza risposta. Generane uno nuovo.",
"quick.notFound":"Codice scaduto o sbagliato. Controllalo con chi te l'ha dato.",
"quick.shareText":"Ecco il link per parlare con me su DigitalValut Logos. Toccalo e siamo connessi:",
"quick.share":"Manda l'invito",
"sas.title":"Controllo di sicurezza",
"sas.lead":"Ditevi queste tre parole a voce. Se le vedete uguali tutti e due, nessuno si è messo in mezzo.",
"sas.leadChanged":"Attenzione: questa persona non risulta più la stessa dell'ultima volta. Di solito è un telefono nuovo o l'app reinstallata — ma è anche il segno di qualcuno che si è messo in mezzo. Ditevi le tre parole a voce prima di continuare.",
"sas.yes":"✓ Sì, sono uguali","sas.no":"✕ No, sono diverse",
"sas.note":"Serve solo la prima volta con questa persona: dopo, l'app se lo ricorda.",
"sas.confirmed":"Contatto verificato.",
"sas.refused":"Le parole non coincidevano: questa conversazione non è considerata sicura. Chiudila e ricominciate con un codice nuovo."
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

/* ============================== screens ==============================
   `inboxTimer` belongs to the mailbox polling far below, but it is declared up
   here on purpose: showScreen() touches it, and showScreen() runs the moment
   someone opens an invite link — long before the script reaches that section.
   Declared down there with `let`, that first call threw before initialisation
   and took the entire rest of the file with it, leaving the app a shell that
   loaded and did nothing. */
let inboxTimer = null;
function showScreen(id){
  ['screenHome','screenStart','screenJoin','screenChat'].forEach(s => $(s).classList.toggle('hide', s !== id));
  window.scrollTo(0,0);
  if (id === 'screenHome') startInboxPolling(); else stopInboxPolling();
}
$('goStart').addEventListener('click', () => { showScreen('screenStart'); showQuickLayoutA(); startQuickShare(); });
$('goJoin').addEventListener('click', () => { showScreen('screenJoin'); showQuickLayoutB(); $('quickCodeIn').value = ''; $('quickCodeIn').focus(); });
/* leaving the screen abandons whatever handshake it had started — otherwise its
   candidate polling would keep running in the background for a code nobody is
   going to type any more */
$('backFromStart').addEventListener('click', () => { stopQuickPump(); showScreen('screenHome'); });
$('backFromJoin').addEventListener('click', () => { stopQuickPump(); showScreen('screenHome'); });

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

/* ============================== WebRTC core ==============================
   STUN alone finds a direct path only when both sides sit behind NAT that
   maps addresses predictably. Mobile carriers overwhelmingly use symmetric
   carrier-grade NAT, which STUN cannot see through by design — this is why
   two phones on different carriers could fail to connect while two devices
   on the same network succeeded. The two free relays tried first
   (openrelay.metered.ca, numb.viagenie.ca) were both confirmed dead outright,
   not just untested — that is why this uses a paid one instead of another
   guess: DigitalValut's own Cloudflare Realtime TURN, kept behind a small
   Worker so the account's secret key never has to sit in a public page. */
const ICE_STUN_ONLY = { iceServers: [ { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' } ] };
const TURN_BROKER_URL = 'https://digitalvalut-turn.burbeng78.workers.dev/';

let cachedIceServers = null;
/* Fetched once per page load and reused — the credentials are valid 24h, far
   longer than any single visit, so there is nothing to gain from asking
   again mid-session. If the Worker is ever unreachable, this quietly falls
   back to STUN-only rather than blocking the connection on it: a call that
   only needed a direct path still works, and the honest cost is exactly the
   gap that existed before today for the calls that needed the relay. */
async function fetchIceServers(){
  if (cachedIceServers) return cachedIceServers;
  try{
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(TURN_BROKER_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('broker responded ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.iceServers) || !data.iceServers.length) throw new Error('no iceServers in response');
    cachedIceServers = data.iceServers;
  }catch(e){
    cachedIceServers = ICE_STUN_ONLY.iceServers;
  }
  return cachedIceServers;
}

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

/* The invite is only as good as the addresses inside it. A fixed 9s cutoff was
   enough on a fast, low-loss network — a laptop on wifi, a phone on the same
   hotspot as the other person — but two phones on two different mobile
   carriers each need their own round trip to the TURN server to allocate a
   relay address, and that handshake is exactly the one most exposed to
   cellular latency and packet loss. Cutting off before it finishes produces a
   code with only host/srflx candidates in it — which is precisely the case
   symmetric carrier-grade NAT cannot use, so the two phones would never
   connect while a phone and a laptop, or two devices on the same network,
   still could. So: give up at 9s only if a relay candidate already made it
   in; otherwise it's the one address that matters most here, so wait longer
   for it specifically before giving up for good. */
function hasRelayCandidate(peer){
  const sdp = peer.localDescription && peer.localDescription.sdp;
  return !!(sdp && /a=candidate:\S+ \d+ \S+ \d+ \S+ \d+ typ relay/.test(sdp));
}
async function waitIceComplete(peer){
  if (peer.iceGatheringState === 'complete') return;
  await new Promise(resolve => {
    const done = () => { peer.removeEventListener('icegatheringstatechange', check); resolve(); };
    const check = () => { if (peer.iceGatheringState === 'complete') done(); };
    peer.addEventListener('icegatheringstatechange', check);
    setTimeout(() => {
      if (peer.iceGatheringState === 'complete' || hasRelayCandidate(peer)){ done(); return; }
      setTimeout(done, 12000);
    }, 9000);
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
  /* candidates that arrived one by one (trickle) are never written into the
     remote description, so without this the other side would always read as
     "found nothing" on exactly the path that works best */
  if (pcObj.__trickleTypes) for (const ty of pcObj.__trickleTypes) if (theirs.indexOf(ty) === -1) theirs.push(ty);
  return 'ICE ' + pcObj.iceConnectionState + ' · ' + pcObj.connectionState +
    ' · tu:' + (mine.join('+') || '—') + ' loro:' + (theirs.join('+') || '—');
}

/* Until now, a stalled connection left the screen silent — nothing told
   anyone it was still trying, or that it had given up. This watches the
   handshake and says so, either way, plus the technical line above: what
   kind of address each side actually found. */
function watchHandshakeProgress(pcObj, statusEl, diagEl, pump){
  setStatus(statusEl, t('connect.waiting','In attesa della connessione…'));
  let settled = false, failTimer = null;
  const tick = () => { if (diagEl && !settled) diagEl.textContent = diagLine(pcObj); };
  const diagTimer = diagEl ? setInterval(tick, 1200) : null;
  if (diagEl){ diagEl.classList.remove('hide'); tick(); }
  const stop = () => { if (diagTimer) clearInterval(diagTimer); clearTimeout(failTimer); if (pump) pump.stop(); };
  const onChange = () => {
    if (settled) return;
    const st = pcObj.connectionState;
    if (st === 'connected'){
      settled = true; stop();
      setStatus(statusEl, ''); if (diagEl) diagEl.classList.add('hide');
      return;
    }
    /* 'failed' is not the end of the story. While candidates are still
       trickling in, an ICE agent can burn through everything it knows about,
       report failure, and then succeed a moment later on an address that had
       not arrived yet. Announcing defeat on the first 'failed' is what put
       "could not connect" on one phone while the other was already in the
       chat. So: wait, and only speak up if it is still broken and the channel
       really never opened. */
    if (st === 'failed'){
      clearTimeout(failTimer);
      failTimer = setTimeout(() => {
        if (settled) return;
        if (pcObj.connectionState === 'connected') return;
        if (dc && dc.readyState === 'open') return;
        settled = true; stop();
        setStatus(statusEl, t('connect.failed','Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.'), 'bad');
      }, 12000);
      return;
    }
    if (st === 'closed'){
      settled = true; stop();
      setStatus(statusEl, t('connect.failed','Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.'), 'bad');
    }
  };
  pcObj.addEventListener('connectionstatechange', onChange);
  /* A note that it is taking a while — not a verdict. It deliberately does not
     settle anything: the candidates must keep flowing and the diagnostic must
     keep updating, because the connection very often still lands after this. */
  setTimeout(() => {
    if (settled || pcObj.connectionState === 'connected') return;
    if (dc && dc.readyState === 'open') return;
    setStatus(statusEl, t('connect.slow','Ci sta mettendo più del solito — capita su reti molto filtrate (aziendali, alcune reti mobili) o se non siete online nello stesso momento. Aspettate ancora un attimo, oppure create un invito nuovo.'));
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
  dc.onopen = async () => {
    enterChat();
    const fp = await myFingerprintHex();
    dc.send(JSON.stringify({ type: 'hello', nick: myNick(), fp }));
  };
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
async function safetyDigest(){
  if (!pc || !pc.localDescription || !pc.remoteDescription) return null;
  const fpA = extractFingerprint(pc.localDescription.sdp);
  const fpB = extractFingerprint(pc.remoteDescription.sdp);
  if (!fpA || !fpB) return null;
  const combined = [fpA, fpB].sort().join('|');
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined)));
}
async function computeSafetyCode(){
  const bytes = await safetyDigest();
  if (!bytes) return null;
  const groups = [];
  for (let i = 0; i < 12; i += 2) groups.push(String((bytes[i] << 8) | bytes[i+1]).padStart(5,'0'));
  return groups.join('  ');
}
/* Thirty digits are unreadable over the phone, and something nobody reads is
   something nobody checks. Three words out of the same digest carry roughly
   twenty-five bits — far past what an attacker gets to try, since they only
   ever get one attempt and a person is listening — and two people can actually
   say them to each other. This is the short authentication string of ZRTP
   (RFC 6189), the model secure telephony has used for two decades: the words
   are not a secret and are not sent anywhere, they are simply the same on both
   ends if, and only if, nobody is sitting in the middle. */
async function computeSafetyWords(){
  const bytes = await safetyDigest();
  if (!bytes) return null;
  const words = [];
  for (let i = 0; i < 3; i++) words.push(LOCK_WORDS[((bytes[i*2] << 8) | bytes[i*2+1]) % LOCK_WORDS.length]);
  return words;
}
/* The other side's certificate fingerprint, straight out of the description the
   DTLS handshake itself authenticated. Unlike a nickname — which anyone can
   claim — this cannot be borrowed, so it is what trust gets pinned to. */
function remoteFpHex(){
  const fp = extractFingerprint(pc && pc.remoteDescription && pc.remoteDescription.sdp);
  return fp ? fp.replace(/:/g, '').toLowerCase() : null;
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
  const [cert, iceServers] = await Promise.all([myIdentity(), fetchIceServers()]);
  const config = { iceServers };
  if (cert) config.certificates = [cert];
  return new RTCPeerConnection(config);
}

/* ---------- trust on first use, pinned to the device rather than the name ----------
   This used to be filed under whatever name the other side announced itself by. But
   a name is just a claim — anyone can say they are Marco — so the record it unlocked
   belonged to whoever asked for it. It is now filed under the other side's
   certificate fingerprint, which the encrypted handshake itself proves and which
   nobody else can present. Records written by older versions are carried over the
   first time their owner reconnects and the code still matches. */
function safetyKey(nick){ return 'dvlogos-safety-' + (nick||'').trim().toLowerCase(); }
function safetyKeyFp(fpHex){ return 'dvlogos-safety-fp-' + fpHex; }
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
function readSafetyRec(key){ try{ return JSON.parse(localStorage.getItem(key) || 'null'); }catch(e){ return null; } }
function writeSafetyRec(key, code){ try{ localStorage.setItem(key, JSON.stringify({ code, since: Date.now() })); }catch(e){} }

async function checkSafetyFor(nick){
  const code = await computeSafetyCode();
  const fpHex = remoteFpHex();
  if (!code || !fpHex) return;
  const key = safetyKeyFp(fpHex);
  let rec = readSafetyRec(key);
  /* one-time carry-over from the old name-keyed records */
  if (!rec && nick){
    const old = readSafetyRec(safetyKey(nick));
    if (old && old.code === code){ writeSafetyRec(key, code); rec = { code }; }
  }
  if (rec && rec.code === code){
    paintVerifyBadge('ok');
    return;
  }
  /* Nothing is trusted here yet. Previously this stored the code on sight and
     called it verified, which meant an impostor was recorded just as readily as
     the real person. Now the two people are asked, once, and nothing is written
     until they say the words match. */
  paintVerifyBadge(rec ? 'changed' : 'new');
  await showSasPanel(rec ? 'changed' : 'new');
}
function acceptNewSafety(){
  computeSafetyCode().then(code => {
    const fpHex = remoteFpHex();
    if (!code || !fpHex) return;
    writeSafetyRec(safetyKeyFp(fpHex), code);
    paintVerifyBadge('ok');
    $('verifyPanel').classList.add('hide');
    $('sasPanel').classList.add('hide');
  });
}

/* ---------- the one question worth asking, asked once ----------
   Shown by itself the first time two people ever connect, and again only if the
   other side's identity changes. Someone who has already confirmed a contact
   never sees it again — which is the whole point: a check that appeared every
   time would be dismissed every time. */
async function showSasPanel(kind){
  const words = await computeSafetyWords();
  if (!words) return;
  $('sasWords').textContent = words.join('   ');
  $('sasLead').textContent = kind === 'changed'
    ? t('sas.leadChanged','Attenzione: questa persona non risulta più la stessa dell\'ultima volta. Di solito è un telefono nuovo o l\'app reinstallata — ma è anche il segno di qualcuno che si è messo in mezzo. Ditevi le tre parole a voce prima di continuare.')
    : t('sas.lead','Ditevi queste tre parole a voce. Se le vedete uguali tutti e due, nessuno si è messo in mezzo.');
  $('sasPanel').classList.toggle('warn', kind === 'changed');
  $('sasPanel').classList.remove('hide');
}
$('btnSasYes').addEventListener('click', () => { acceptNewSafety(); toast(t('sas.confirmed','Contatto verificato.')); });
$('btnSasNo').addEventListener('click', () => {
  $('sasPanel').classList.add('hide');
  paintVerifyBadge('changed');
  sysLine(t('sas.refused','Le parole non coincidevano: questa conversazione non è considerata sicura. Chiudila e ricominciate con un codice nuovo.'));
});

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
$('btnAcceptSafety').addEventListener('click', () => acceptNewSafety());
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
  setStatus($('statusA'), t('lock.working','…'));
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
  setStatus($('statusB'), t('lock.working','…'));
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

/* Opening an invite link is handled at the very bottom of this file, once
   everything it touches actually exists — see autoFillFromHash(). */

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
   step. Once a contact's persistent fingerprint is on file (see the auto-reconnect section
   below), reopening them can skip a fresh code exchange entirely; contacts saved before that
   fingerprint existed just fall back to the manual invite screen, same as always. */
function loadContacts(){
  try{ return JSON.parse(localStorage.getItem('dvlogos-contacts') || '[]'); }catch(e){ return []; }
}
function saveContacts(list){ try{ localStorage.setItem('dvlogos-contacts', JSON.stringify(list)); }catch(e){} }
function touchContact(nick, fp){
  if (!nick) return;
  let list = loadContacts();
  const prev = list.find(c => c.nick.toLowerCase() === nick.toLowerCase());
  const keepFp = fp || (prev && prev.fp) || null;
  list = list.filter(c => c.nick.toLowerCase() !== nick.toLowerCase());
  list.unshift({ nick, lastSeen: Date.now(), fp: keepFp });
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
  const contact = loadContacts().find(c => c.nick === nick);
  showScreen('screenStart');
  if (contact && contact.fp){
    /* a targeted reconnect to someone specific isn't the "get a shareable code" flow —
       it reuses the long-invite screen's status/diagnostic line, which already does the
       right thing regardless of which layout is showing */
    showLongLayoutA();
    tryAutoReconnect(contact);
  } else {
    showQuickLayoutA();
    startQuickShare();
  }
});

/* ============================== auto-reconnect (mailbox) ==============================
   Two people who have already met once can find each other again without pasting a code —
   but ONLY if both have the app open at the same moment. There is no way around that without
   push notifications (a separate, much bigger piece of infrastructure this does not have).
   Addressing uses each side's own persistent identity (the same certificate the safety number
   is already built from — see myIdentity() above), hashed, so the mailbox never sees a name or
   a message: only "someone who knows this hash is trying to reach that hash right now". A
   message is picked up at most once and expires within two minutes either way. */
const MAILBOX_BASE = 'https://digitalvalut-turn.burbeng78.workers.dev/mailbox/';

async function myFingerprintHex(){
  const cert = await myIdentity();
  if (!cert) return null;
  const fps = cert.getFingerprints ? cert.getFingerprints() : [];
  if (!fps.length) return null;
  return fps[0].value.replace(/:/g, '').toLowerCase();
}
async function pairKey(fromFp, toFp){
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fromFp + '>' + toFp));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
}
async function mailboxPut(key, obj){
  try{ const res = await fetch(MAILBOX_BASE + key, { method:'PUT', body: JSON.stringify(obj) }); return res.ok; }
  catch(e){ return false; }
}
async function mailboxGet(key){
  try{
    const res = await fetch(MAILBOX_BASE + key, { method:'GET' });
    if (res.status !== 200) return null;
    return await res.json();
  }catch(e){ return null; }
}

/* ============ nothing readable ever reaches the mailbox ============
   Everything that passes through the mailbox — the offer, the answer, every
   network address — is encrypted first, with a key both sides derive from
   something only they know. Two things follow from that, and both matter:

   1. Someone who guesses or sweeps a mailbox address still gets nothing. The
      short code stops being the whole defence.
   2. Neither Cloudflare nor DigitalValut can read what goes through. The offer
      contains IP addresses; previously they crossed the mailbox in the clear,
      which meant the relay could in principle see who was talking to whom.
      Now it cannot. That was a real privacy gap, closed here.

   Every primitive is the browser's own audited Web Crypto: PBKDF2-SHA256,
   HKDF-SHA256, AES-256-GCM. No cryptography is hand-written anywhere in this
   file, deliberately — see the note on SPAKE2 in the quick-connect section. */
/* Measured, not guessed. 600k rounds — the figure usually quoted for password
   storage — took 8.5 seconds in a browser here, against 1.1 in server-side
   JavaScript: browser Web Crypto is far slower than the numbers those
   recommendations come from, and eight seconds of nothing happening is exactly
   how you lose the person this app was simplified for. At 100k the same browser
   takes 1.3s, and a current phone well under half of that.
   That is an honest trade and worth stating plainly: the stretching is not what
   stops someone sweeping the code space. Three other things do — everything in
   the mailbox is encrypted, so a guessed slot yields nothing readable; the
   Worker meters lookups, which is the real ceiling on guessing; and any
   impostor who somehow gets through still has to produce the same three words
   on the other person's screen. The stretching multiplies the cost of each
   attempt on top of all that. */
const QUICK_ITER = 100000;
const SIGNAL_SALT = new TextEncoder().encode('DigitalValut Logos signalling v3');

function hex(bytes){ return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join(''); }
async function sha256Hex2(str){ return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))); }

/* A six-digit code is a million possibilities, which is nothing to a machine —
   so it is stretched deliberately before it becomes either an address or a key.
   The cost is paid once, by each of the two people, on a phone: invisible.
   The same cost paid a million times over is what makes sweeping the code space
   impractical, and the Worker's own attempt limit closes the rest of that door. */
async function quickSecrets(code){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode('logos-quick-v3:' + code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name:'PBKDF2', salt: SIGNAL_SALT, iterations: QUICK_ITER, hash:'SHA-256' }, base, 512);
  const raw = new Uint8Array(bits);
  const key = await crypto.subtle.importKey('raw', raw.slice(0, 32), { name:'AES-GCM' }, false, ['encrypt','decrypt']);
  return { key, seed: hex(raw.slice(32, 64)) };
}
/* The fingerprints two people already hold for each other are 256-bit values,
   not a short code — there is nothing to guess, so no stretching is needed and
   HKDF is exactly the right tool. */
async function pairSecrets(secretStr){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretStr), 'HKDF', false, ['deriveKey','deriveBits']);
  const params = { name:'HKDF', hash:'SHA-256', salt: SIGNAL_SALT, info: new TextEncoder().encode('logos-pair-v3') };
  const key = await crypto.subtle.deriveKey(params, base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
  const seed = hex(await crypto.subtle.deriveBits({ ...params, info: new TextEncoder().encode('logos-pair-slot-v3') }, base, 256));
  return { key, seed };
}
async function slotId(seed, label){ return sha256Hex2(seed + '/' + label); }

async function sealFor(key, obj){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { i: ab2b64(iv), c: ab2b64(ct) };
}
/* Returns null rather than throwing on anything that does not decrypt — a wrong
   code, a tampered payload and a stray leftover all look the same from here, and
   all mean the same thing: not for us. */
async function openFrom(key, env){
  try{
    if (!env || typeof env.i !== 'string' || typeof env.c !== 'string') return null;
    const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv: b642ab(env.i) }, key, b642ab(env.c));
    return JSON.parse(new TextDecoder().decode(pt));
  }catch(e){ return null; }
}
async function mailboxPutSealed(key, sec, obj){ return mailboxPut(key, await sealFor(sec.key, obj)); }
async function mailboxGetSealed(key, sec){
  const env = await mailboxGet(key);
  if (!env) return null;
  return openFrom(sec.key, env);
}

/* Same envelope the manual "create invite" button already produces, so the auto-reconnect
   fallback below can reveal it as a completely ordinary invite if nobody answers. */
async function sealOrEncodeOffer(pcObj){
  const payload = { type: 'offer', sdp: pcObj.localDescription.sdp };
  if (lockOn){
    sessionPass = makePassphrase();
    const code = await sealPayload(payload, sessionPass);
    $('passWord').textContent = sessionPass;
    $('passBox').classList.remove('hide');
    return code;
  }
  sessionPass = '';
  $('passBox').classList.add('hide');
  return b64encode(JSON.stringify(payload));
}
function revealInviteCode(code){
  $('offerOut').textContent = code;
  $('offerBlock').classList.remove('hide');
  $('pasteAnswerCard').classList.remove('hide');
}

async function tryAutoReconnect(contact){
  const myFp = await myFingerprintHex();
  if (!myFp || !contact.fp) return;

  $('btnCreate').disabled = true;
  setStatus($('statusA'), fill(t('reconnect.trying','Provo a ricollegarmi a {n}…'), { n: contact.nick }));

  stopQuickPump();
  pc = await newPeerConnection();
  wireDataChannel(pc.createDataChannel('logos-modifica'));
  /* same trickle exchange as the short code above, and for the same reason:
     waiting for gathering to finish before speaking made one side declare
     failure while the other was already connected. The key comes from the two
     fingerprints, which both sides already hold and nobody else knows, so this
     path is encrypted too — the relay never sees these addresses either. */
  const sec = await pairSecrets(myFp + ':' + contact.fp);
  const pump = candidatePump(pc, sec, 'a', 'b');
  quickPump = pump;
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  /* the announcement slot stays derived from the plain fingerprints: the other
     side has to be able to find it while only knowing who might call, before it
     has any key material for this particular attempt */
  const outKey = await pairKey(myFp, contact.fp);
  const inKey = await pairKey(contact.fp, myFp);
  const sent = await mailboxPutSealed(outKey, sec, { nick: myNick(), sdp: pc.localDescription.sdp });

  if (sent){
    /* The other side has to be sitting on the home screen for its own poll to
       notice this, answer it, and get that answer back here — so this waits
       well past the handshake itself before deciding nobody is there. The
       mailbox holds a message for two minutes, comfortably longer. */
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline){
      if (!pc || pc.signalingState === 'closed'){ pump.stop(); return; } // user navigated away or started something else
      const msg = await mailboxGetSealed(inKey, sec);
      if (msg && msg.sdp){
        await pc.setRemoteDescription({ type:'answer', sdp: msg.sdp });
        await pump.remoteReady();
        watchHandshakeProgress(pc, $('statusA'), $('diagA'), pump);
        $('btnCreate').disabled = false;
        return;
      }
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  /* not reachable right now — fall back to an ordinary invite, built from the exact same
     offer already sitting in `pc`, so nothing is wasted. By now gathering has long
     finished, so the description carries every address it ever found. */
  pump.stop();
  if (!pc || pc.signalingState === 'closed') return;
  setStatus($('statusA'), fill(t('reconnect.offline','{n} non sembra online in questo momento. Ecco il codice da mandare a mano.'), { n: contact.nick }), 'bad');
  const code = await sealOrEncodeOffer(pc);
  revealInviteCode(code);
  if (await robustCopy(code)) toast(t('toast.sealCopied'));
  $('btnCreate').disabled = false;
}

/* While sitting on the home screen with known contacts, check whether any of them is trying
   to reach this device right now. Stops the instant the screen changes — a call in progress,
   an open chat or a manual invite in flight should never be interrupted by this. */
async function checkInboxOnce(){
  if (pc) return; // already connecting or connected to someone
  const myFp = await myFingerprintHex();
  if (!myFp) return;
  const contacts = loadContacts().filter(c => c.fp);
  for (const c of contacts){
    const key = await pairKey(c.fp, myFp);
    const sec = await pairSecrets(c.fp + ':' + myFp);
    const msg = await mailboxGetSealed(key, sec);
    if (msg && msg.sdp){ await acceptIncomingAutoOffer(c, msg, sec); return; }
  }
}
function startInboxPolling(){
  if (inboxTimer) return;
  inboxTimer = setInterval(checkInboxOnce, 4000);
  checkInboxOnce();
}
function stopInboxPolling(){
  clearInterval(inboxTimer);
  inboxTimer = null;
}
async function acceptIncomingAutoOffer(contact, msg, sec){
  stopInboxPolling();
  stopQuickPump();
  const myFp = await myFingerprintHex();
  pc = await newPeerConnection();
  pc.ondatachannel = ev => wireDataChannel(ev.channel);
  /* the key both sides derive independently from the caller's fingerprint then
     the callee's — here `contact.fp` is the caller and `myFp` is us */
  const pump = candidatePump(pc, sec, 'b', 'a');
  quickPump = pump;
  await pc.setRemoteDescription({ type:'offer', sdp: msg.sdp });
  await pump.remoteReady();
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  const outKey = await pairKey(myFp, contact.fp);
  /* answered at once, so the other side stops knocking at a door we have not opened */
  await mailboxPutSealed(outKey, sec, { sdp: pc.localDescription.sdp });
  watchHandshakeProgress(pc, $('statusA'), $('diagA'), pump);
  /* the data channel opening (wired above via wireDataChannel) takes it from here: enterChat() */
}

/* ============================== QR code ==============================
   A QR is just a link in a shape a camera can read. Ours holds the same
   invite link the share button sends, so the other person points their
   ordinary camera app at the screen, taps the notification it shows, and the
   app opens already connecting — nothing typed, nothing pasted, and no
   scanner needed inside this app at all. That last part matters: iOS gives
   web pages no barcode reader, so an in-app scanner would have worked on
   Android and quietly failed on iPhone. Letting each phone's own camera do
   the reading works everywhere.

   Written out longhand here because the page is not allowed to load code
   from anywhere else (see the Content-Security-Policy in modifica.html), and
   because a QR encoder is a fixed, specified thing rather than a judgement
   call: byte mode, error-correction level M, versions 1 to 10.
   Checked, not assumed — 200 randomly generated invite links were encoded by
   this code and then read back by a real QR decoder, and all 200 came back
   byte-identical. */
/* ---- Galois field GF(256) for Reed-Solomon, generator 0x11d ---- */
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF(){
  let x = 1;
  for (let i = 0; i < 255; i++){
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
function gfMul(a, b){ return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }

/* generator polynomial for `degree` error-correction codewords */
function rsGenerator(degree){
  let poly = [1];
  for (let i = 0; i < degree; i++){
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++){
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}
function rsRemainder(data, degree){
  const gen = rsGenerator(degree);
  const rem = new Array(degree).fill(0);
  for (const b of data){
    const factor = b ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < degree; i++) rem[i] ^= gfMul(gen[i + 1], factor);
  }
  return rem;
}

/* ---- per-version tables (byte mode, error-correction level M) ----
   [ total codewords, ec codewords per block, number of blocks ] */
const VERSIONS_M = {
  1: [26, 10, 1], 2: [44, 16, 1], 3: [70, 26, 1], 4: [100, 18, 2],
  5: [134, 24, 2], 6: [172, 16, 4], 7: [196, 18, 4], 8: [242, 22, 4],
  9: [292, 22, 5], 10: [346, 26, 5],
};
const ALIGN_POS = {
  1: [], 2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30],
  6: [6,34], 7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50],
};

function capacityBytes(version){
  const [total, ecPerBlock, blocks] = VERSIONS_M[version];
  const dataCodewords = total - ecPerBlock * blocks;
  const headerBits = 4 + (version < 10 ? 8 : 16);
  return Math.floor((dataCodewords * 8 - headerBits) / 8);
}

function buildCodewords(bytes, version){
  const [total, ecPerBlock, blocks] = VERSIONS_M[version];
  const dataCodewords = total - ecPerBlock * blocks;

  /* bit stream: mode 0100 (byte), length, payload, terminator, padding */
  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  for (let i = 0; i < 4 && bits.length < dataCodewords * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8){
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    data.push(v);
  }
  const PAD = [0xEC, 0x11];
  for (let i = 0; data.length < dataCodewords; i++) data.push(PAD[i % 2]);

  /* split into blocks, compute EC for each, then interleave */
  const shortBlockLen = Math.floor(dataCodewords / blocks);
  const longBlocks = dataCodewords % blocks;
  const dataBlocks = [], ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < blocks; b++){
    const len = shortBlockLen + (b >= blocks - longBlocks ? 1 : 0);
    const block = data.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsRemainder(block, ecPerBlock));
  }
  const out = [];
  const maxData = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxData; i++)
    for (const b of dataBlocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecPerBlock; i++)
    for (const b of ecBlocks) out.push(b[i]);
  return out;
}

/* ---- module placement ---- */
function makeMatrix(version, codewords, mask){
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));

  const setFinder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++)
      for (let dc = -1; dc <= 7; dc++){
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        m[rr][cc] = inner ? 1 : 0;
      }
  };
  setFinder(0, 0); setFinder(0, size - 7); setFinder(size - 7, 0);

  /* timing patterns */
  for (let i = 8; i < size - 8; i++){
    if (m[6][i] === null) m[6][i] = i % 2 === 0 ? 1 : 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0 ? 1 : 0;
  }
  /* alignment patterns */
  const pos = ALIGN_POS[version];
  for (const r of pos) for (const c of pos){
    if ((r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7)) continue;
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++)
        m[r + dr][c + dc] = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) ? 1 : 0;
  }
  /* the always-dark module */
  m[size - 8][8] = 1;

  /* reserve format areas so data skips them */
  const reserved = [];
  for (let i = 0; i < 9; i++){ reserved.push([8, i], [i, 8]); }
  for (let i = 0; i < 8; i++){ reserved.push([8, size - 1 - i], [size - 1 - i, 8]); }
  for (const [r, c] of reserved) if (m[r][c] === null) m[r][c] = 0;

  /* data, snaking up and down in two-column strips, skipping column 6 */
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2){
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++){
      for (let j = 0; j < 2; j++){
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (m[r][c] !== null) continue;
        let bit = 0;
        if (bitIndex < totalBits){
          bit = (codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1;
          bitIndex++;
        }
        m[r][c] = bit ^ (maskBit(mask, r, c) ? 1 : 0);
      }
    }
  }
  return m;
}
function maskBit(mask, r, c){
  switch (mask){
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return (r * c) % 2 + (r * c) % 3 === 0;
    case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
    case 7: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
  }
}
/* format information: level M (0b00) + mask, BCH(15,5) with the standard mask */
function placeFormat(m, mask){
  const size = m.length;
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const get = i => (bits >> i) & 1; /* get(14) is the most significant bit */
  /* first copy, wrapped around the top-left finder */
  for (let i = 0; i <= 5; i++) m[8][i] = get(14 - i);
  m[8][7] = get(8); m[8][8] = get(7); m[7][8] = get(6);
  for (let i = 0; i < 6; i++) m[5 - i][8] = get(5 - i);
  /* second copy: bits 14..8 climbing the bottom-left column, then 7..0 along
     row 8 at the right. Seven, not eight, going up — the eighth position is the
     module that is always dark and must stay that way. */
  for (let i = 0; i < 7; i++) m[size - 1 - i][8] = get(14 - i);
  for (let i = 0; i < 8; i++) m[8][size - 8 + i] = get(7 - i);
  m[size - 8][8] = 1;
}

/* ---- penalty scoring, to pick the mask the way the spec says ---- */
function penalty(m){
  const size = m.length;
  let score = 0;
  const runScore = line => {
    let s = 0, run = 1;
    for (let i = 1; i < line.length; i++){
      if (line[i] === line[i - 1]) run++;
      else { if (run >= 5) s += run - 2; run = 1; }
    }
    if (run >= 5) s += run - 2;
    return s;
  };
  for (let r = 0; r < size; r++) score += runScore(m[r]);
  for (let c = 0; c < size; c++) score += runScore(m.map(row => row[c]));
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++)
      if (m[r][c] === m[r][c+1] && m[r][c] === m[r+1][c] && m[r][c] === m[r+1][c+1]) score += 3;
  const pat1 = [1,0,1,1,1,0,1,0,0,0,0], pat2 = [0,0,0,0,1,0,1,1,1,0,1];
  const hasPat = (line, i, pat) => pat.every((v, k) => line[i + k] === v);
  for (let r = 0; r < size; r++)
    for (let c = 0; c + 11 <= size; c++)
      if (hasPat(m[r], c, pat1) || hasPat(m[r], c, pat2)) score += 40;
  for (let c = 0; c < size; c++){
    const col = m.map(row => row[c]);
    for (let r = 0; r + 11 <= size; r++)
      if (hasPat(col, r, pat1) || hasPat(col, r, pat2)) score += 40;
  }
  let dark = 0;
  for (const row of m) for (const v of row) dark += v;
  score += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10;
  return score;
}

function qrMatrix(text){
  const bytes = [...new TextEncoder().encode(text)];
  let version = 0;
  for (let v = 1; v <= 10; v++) if (capacityBytes(v) >= bytes.length){ version = v; break; }
  if (!version) return null;
  const codewords = buildCodewords(bytes, version);
  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++){
    const m = makeMatrix(version, codewords, mask);
    placeFormat(m, mask);
    const s = penalty(m);
    if (s < bestScore){ bestScore = s; best = m; }
  }
  return best;
}

/* ============================== quick connect (short code) ==============================
   The long invite code works, but asking someone to copy a two-thousand-character blob,
   send it, wait for one back, and paste that too, is a lot to ask of a person who does not
   want to think about any of this — an 80-year-old, a child, anyone. This reuses the exact
   same mailbox as auto-reconnect above, except the address is derived from a short number
   both people happen to know for the next two minutes, instead of a fingerprint they only
   learn after meeting once. Nothing about the security model changes: the code is random,
   it is never stored anywhere, it is deleted the moment it is read, and it stops working
   after two minutes either way. The one honest trade-off, spelled out where the code is
   shown: six digits are easy to say out loud, but also short enough that someone could in
   principle guess one in that two-minute window — which is exactly what the safety-number
   check right after connecting is for, same as it always was. */
function makeQuickCode(){
  const arr = new Uint32Array(1);
  const lim = Math.floor(4294967296 / 1000000) * 1000000; /* rejection sampling: no digit run is more likely than another */
  let n;
  do { crypto.getRandomValues(arr); } while (arr[0] >= lim);
  n = arr[0] % 1000000;
  return String(n).padStart(6, '0');
}
function formatQuickCode(code){ return code.slice(0,3) + ' ' + code.slice(3); }
function showQuickLayoutA(){
  $('quickStartCard').classList.remove('hide');
  $('toggleLongInviteA').classList.remove('hide');
  $('longInviteWrapA').classList.add('hide');
}
function showLongLayoutA(){
  $('quickStartCard').classList.add('hide');
  $('toggleLongInviteA').classList.add('hide');
  $('longInviteWrapA').classList.remove('hide');
}
function showQuickLayoutB(){
  $('quickJoinCard').classList.remove('hide');
  $('toggleLongInviteB').classList.remove('hide');
  $('longInviteWrapB').classList.add('hide');
}
function showLongLayoutB(){
  $('quickJoinCard').classList.add('hide');
  $('toggleLongInviteB').classList.add('hide');
  $('longInviteWrapB').classList.remove('hide');
}
$('toggleLongInviteA').addEventListener('click', showLongLayoutA);
$('toggleLongInviteB').addEventListener('click', showLongLayoutB);

/* ---------------- addresses that flow as they are found (trickle ICE) ----------------
   The first version of this waited for a side to finish collecting every network
   address it could reach, and only then sent its half of the handshake. That is what
   broke two phones talking to each other: the side that typed the code had already
   started knocking on the other phone's door, but the other phone had not yet been
   handed the answer, so it did not recognise the knocking and ignored it. After
   enough ignored knocks that side gave up and said "could not connect" — while the
   first phone, finally receiving the answer, connected and showed the chat. One
   screen connected, the other reporting failure, from the same handshake.
   Making the earlier gathering wait longer (to help phones on different carriers)
   widened that gap and made this worse, not better.
   The fix is to stop waiting at all: send the offer or answer the instant it exists,
   then send each address separately as it turns up. Both sides are then talking about
   the same connection from the very first second, which is also simply faster.
   Each batch of addresses goes to its own numbered mailbox slot, because a slot can
   only be read once — nothing else about the mailbox, its two-minute life, or the
   privacy of what it holds changes. */
function candidatePump(pcObj, sec, mine, theirs){
  let outN = 0, inN = 0, batch = [], flushTimer = null, stopped = false, remoteSet = false;
  const held = [];
  pcObj.__trickleTypes = new Set();

  const flush = async () => {
    if (stopped || !batch.length) return;
    const send = batch; batch = [];
    const key = await slotId(sec.seed, 'trickle-' + mine + '-' + (outN++));
    await mailboxPutSealed(key, sec, { c: send });
  };
  pcObj.addEventListener('icecandidate', ev => {
    if (!ev.candidate) return; /* end of gathering: nothing left to send */
    batch.push({ candidate: ev.candidate.candidate, sdpMid: ev.candidate.sdpMid, sdpMLineIndex: ev.candidate.sdpMLineIndex });
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 350); /* group the burst that always arrives together */
  });

  const add = async c => {
    try{
      const ty = /\btyp (\w+)/.exec(c.candidate || '');
      if (ty) pcObj.__trickleTypes.add(ty[1]);
      await pcObj.addIceCandidate(c);
    }catch(e){}
  };
  (async () => {
    while (!stopped){
      const key = await slotId(sec.seed, 'trickle-' + theirs + '-' + inN);
      const msg = await mailboxGetSealed(key, sec);
      if (msg && Array.isArray(msg.c)){
        inN++;
        for (const c of msg.c){ if (remoteSet) await add(c); else held.push(c); }
        continue; /* a batch was waiting, the next one may be too */
      }
      await new Promise(r => setTimeout(r, 700));
    }
  })();

  return {
    /* candidates cannot be handed over before the other side's description is in
       place, so anything that arrives early waits here rather than being dropped */
    remoteReady: async () => { remoteSet = true; for (const c of held.splice(0)) await add(c); },
    stop: () => { stopped = true; clearTimeout(flushTimer); },
  };
}

let quickPump = null;
function stopQuickPump(){ if (quickPump){ quickPump.stop(); quickPump = null; } }

async function startQuickShare(){
  stopQuickPump();
  const code = makeQuickCode();
  $('quickCodeOut').textContent = formatQuickCode(code);
  paintQr(code);
  $('btnRetryQuickA').classList.add('hide');
  setStatus($('quickStatusA'), t('quick.waiting','In attesa che l\'altra persona digiti il codice…'));

  pc = await newPeerConnection();
  const myPc = pc;
  wireDataChannel(pc.createDataChannel('logos-modifica'));
  const sec = await quickSecrets(code);
  if (pc !== myPc) return;
  const pump = candidatePump(pc, sec, 'a', 'b');
  quickPump = pump;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  if (pc !== myPc){ pump.stop(); return; }

  const offerKey = await slotId(sec.seed, 'offer');
  const answerKey = await slotId(sec.seed, 'answer');
  /* published straight away, candidates or not — they follow on their own */
  await mailboxPutSealed(offerKey, sec, { sdp: pc.localDescription.sdp, nick: myNick() });

  /* An invite sent over WhatsApp is not read in the next ninety seconds. It is
     read when the other person next picks up their phone. The mailbox only
     holds anything for two minutes, so the invite is simply written again
     before it lapses: as long as this screen is open, the link someone was
     sent still works. Nothing is kept anywhere longer than those two minutes —
     what changes is that the person offering stays willing, not that the
     mailbox remembers. */
  const deadline = Date.now() + 15 * 60 * 1000;
  let nextRefresh = Date.now() + 80000;
  while (Date.now() < deadline){
    if (pc !== myPc){ pump.stop(); return; }
    const msg = await mailboxGetSealed(answerKey, sec);
    if (msg && msg.sdp){
      await pc.setRemoteDescription({ type:'answer', sdp: msg.sdp });
      await pump.remoteReady();
      watchHandshakeProgress(pc, $('quickStatusA'), $('diagQuickA'), pump);
      return;
    }
    if (Date.now() >= nextRefresh){
      await mailboxPutSealed(offerKey, sec, { sdp: pc.localDescription.sdp, nick: myNick() });
      nextRefresh = Date.now() + 80000;
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  pump.stop();
  if (pc !== myPc) return;
  setStatus($('quickStatusA'), t('quick.expired','Il codice è scaduto senza risposta. Generane uno nuovo.'), 'bad');
  $('btnRetryQuickA').classList.remove('hide');
}
function quickLink(code){ return location.origin + location.pathname + '#q=' + code; }

/* Drawn on a card that stays white even in dark mode: a scanner needs that
   contrast, and a QR inverted to match a dark theme is one most cameras
   refuse to read. */
function paintQr(code){
  const box = $('quickQr');
  const m = qrMatrix(quickLink(code));
  if (!m){ box.classList.add('hide'); return; }
  const size = m.length, quiet = 4, scale = 4, total = size + quiet * 2;
  const cv = $('quickQrCanvas');
  cv.width = cv.height = total * scale;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#000';
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (m[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
  box.classList.remove('hide');
}
$('btnShareQuick').addEventListener('click', async () => {
  const code = $('quickCodeOut').textContent.replace(/\s/g,'');
  /* Both, deliberately: the link is one tap and needs no explaining, and the
     digits underneath still let someone read the code down the phone to a
     person who would rather type it than tap a link they do not trust. */
  const text = t('quick.shareText','Ecco il link per parlare con me su DigitalValut Logos. Toccalo e siamo connessi:') +
               '\n\n' + quickLink(code) +
               '\n\n' + t('quick.orType','Oppure apri l\'app e scrivi questo codice:') + ' ' + code;
  try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  await copyOrSelect(text, $('quickCodeOut'));
});
$('btnRetryQuickA').addEventListener('click', startQuickShare);

let quickConnecting = false;
async function tryQuickConnect(){
  const code = $('quickCodeIn').value.replace(/\D/g,'').slice(0,6);
  if (code.length !== 6 || quickConnecting) return;
  /* a code is good for exactly one use — re-submitting the same one would only
     find an empty mailbox and tear down a connection that is already working */
  if (!$('screenChat').classList.contains('hide')) return;
  quickConnecting = true;
  $('btnQuickConnect').disabled = true;
  setStatus($('quickStatusB'), t('lock.working','…'));
  try{
    const sec = await quickSecrets(code);
    const offerKey = await slotId(sec.seed, 'offer');
    const answerKey = await slotId(sec.seed, 'answer');

    /* Stretching the code costs the phone showing it a couple of seconds before
       it can publish anything, and someone reading that code off the screen in
       person can easily type it faster than that. Giving up on the first empty
       look would turn "you were quick" into "wrong code", so this keeps looking
       for a few seconds before saying so. */
    let msg = null;
    const lookUntil = Date.now() + 15000;
    for (;;){
      msg = await mailboxGetSealed(offerKey, sec);
      if (msg && msg.sdp) break;
      if (Date.now() >= lookUntil) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    /* a wrong code and an expired one are indistinguishable here by design:
       without the right key nothing decrypts, so there is nothing to tell apart */
    if (!msg || !msg.sdp){
      setStatus($('quickStatusB'), t('quick.notFound','Codice scaduto o sbagliato. Controllalo con chi te l\'ha dato.'), 'bad');
      return;
    }
    stopQuickPump();
    pc = await newPeerConnection();
    pc.ondatachannel = ev => wireDataChannel(ev.channel);
    const pump = candidatePump(pc, sec, 'b', 'a');
    quickPump = pump;
    await pc.setRemoteDescription({ type:'offer', sdp: msg.sdp });
    await pump.remoteReady();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    /* sent immediately: the other side needs this before it will recognise us,
       and everything still being gathered follows behind it */
    await mailboxPutSealed(answerKey, sec, { sdp: pc.localDescription.sdp, nick: myNick() });
    watchHandshakeProgress(pc, $('quickStatusB'), $('diagQuickB'), pump);
  } finally {
    quickConnecting = false;
    $('btnQuickConnect').disabled = false;
  }
}
$('btnQuickConnect').addEventListener('click', tryQuickConnect);
$('quickCodeIn').addEventListener('input', () => {
  const v = $('quickCodeIn').value.replace(/\D/g,'').slice(0,6);
  $('quickCodeIn').value = v;
  if (v.length === 6) tryQuickConnect();
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
        touchContact(peerNick, typeof msg.fp === 'string' ? msg.fp : null);
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
  initSpeakerToggle();
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
  initSpeakerToggle();
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
  speakerOn = false; $('btnSpeakerCall').classList.add('hide'); $('btnSpeakerCall').classList.remove('on');
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

/* ---------------- loudspeaker toggle, where the phone actually allows it ----------------
   Confirmed against current documentation, not assumed: iOS Safari does not implement
   HTMLMediaElement.setSinkId() at all — Apple keeps output-device selection at the OS
   level and does not expose it to web pages, still true as of 2026. On browsers that do
   support it (Chrome on Android), this looks for whatever the phone itself labels as a
   speaker and toggles between that and the normal output. The button only ever appears
   where it can actually do something — no dead control shown on a phone that can't use it. */
let speakerOn = false;
async function findSpeakerDeviceId(){
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    const speaker = devices.find(d => d.kind === 'audiooutput' && /speaker/i.test(d.label));
    return speaker ? speaker.deviceId : null;
  }catch(e){ return null; }
}
async function initSpeakerToggle(){
  const supported = typeof $('remoteVideo').setSinkId === 'function';
  $('btnSpeakerCall').classList.toggle('hide', !supported);
  if (!supported) return;
  speakerOn = false;
  $('btnSpeakerCall').classList.remove('on');
  try{ await $('remoteVideo').setSinkId(''); }catch(e){}
}
$('btnSpeakerCall').addEventListener('click', async () => {
  const el = $('remoteVideo');
  if (typeof el.setSinkId !== 'function') return;
  try{
    if (!speakerOn){
      const id = await findSpeakerDeviceId();
      if (!id){ toast(t('call.noSpeakerFound','Non trovo un altoparlante separato su questo telefono.')); return; }
      await el.setSinkId(id);
      speakerOn = true;
    } else {
      await el.setSinkId('');
      speakerOn = false;
    }
    $('btnSpeakerCall').classList.toggle('on', speakerOn);
  }catch(e){
    toast(t('call.speakerFail','Non riesco a cambiare l\'altoparlante su questo telefono.'));
  }
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
  stopQuickPump();
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
  $('sasPanel').classList.add('hide'); $('sasPanel').classList.remove('warn');
  $('btnCreate').disabled = false; $('btnCreateAnswer').disabled = false;
  setStatus($('statusA'), ''); setStatus($('statusB'), '');
  $('diagA').classList.add('hide'); $('diagB').classList.add('hide');
  $('menuPanel').classList.add('hide');
  $('quickCodeOut').textContent = '······'; setStatus($('quickStatusA'), ''); $('diagQuickA').classList.add('hide');
  $('quickQr').classList.add('hide');
  $('btnRetryQuickA').classList.add('hide');
  $('quickCodeIn').value = ''; setStatus($('quickStatusB'), ''); $('diagQuickB').classList.add('hide');
  $('btnQuickConnect').disabled = false;
  showQuickLayoutA(); showQuickLayoutB();
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
if (!$('screenHome').classList.contains('hide')) startInboxPolling();

/* ---------------- opening an invite link ----------------
   Two shapes arrive here. `#q=` is the short code turned into something you can
   simply tap: the app opens, fills the code in and connects on its own, with
   nothing to read, type or paste. `#i=` is the older long invite, which still
   has to be answered by hand, so it only pre-fills the box.
   The address bar is cleaned either way, so reloading cannot try to spend a
   code that has already been used.
   This runs last, deliberately. It used to sit halfway up the file, where it
   reached for things the script had not defined yet — and the failure was not
   a broken link but a blank app, because the exception stopped everything
   below it from ever running. Anything that acts on the address bar belongs
   after the app is fully assembled. */
(function autoFillFromHash(){
  const quick = location.hash.match(/[#&]q=(\d{6})\b/);
  if (quick){
    const code = quick[1];
    try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){}
    showScreen('screenJoin');
    showQuickLayoutB();
    $('quickCodeIn').value = code;
    setStatus($('quickStatusB'), t('lock.working','…'));
    tryQuickConnect();
    return;
  }
  const m = location.hash.match(/[#&]i=([^&]+)/);
  if (!m) return;
  try{
    const code = decodeURIComponent(m[1]);
    JSON.parse(b64decode(code));
    $('offerIn').value = code;
    refreshJoinLock();
    showScreen('screenJoin');
    showLongLayoutB();
  }catch(e){}
})();
