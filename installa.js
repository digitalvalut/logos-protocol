/* installa.html — due lingue. Il testo italiano sta nell'HTML; qui c'è
   l'inglese, e chi non ha l'italiano come lingua lo legge in inglese. La
   scelta segue quella della pagina principale (dvlogos-lang) e si può
   cambiare con i due link in alto.

   Le stringhe contengono i propri link e grassetti: sono testi nostri,
   scritti qui, non dati di nessuno — per questo si mettono con innerHTML. */
(function(){
  'use strict';
  const EN = {
    'top.back': '← DigitalValut Logos',
    'h.title': 'Logos on your phone and your computer',
    'h.lead': 'No number, no account, no permission to ask. Pick your device: three steps and your address is ready.',
    'nav.android': 'Android', 'nav.ios': 'iPhone and iPad', 'nav.pc': 'Computer', 'nav.max': 'If you want the most',

    'and.t': 'Android',
    'and.1': 'Download the file <strong>DigitalValut-Logos.apk</strong> with the button below.',
    'and.2': 'Open the file and tap <strong>Install</strong>. If the phone asks to allow "this source", allow it: that is the normal confirmation for any app that does not come from the Play Store.',
    'and.3': 'Open Logos, type your name, tap <strong>Start</strong>. Your address is ready.',
    'and.cta': 'Download for Android',
    'and.obt': 'Want it to update by itself? Install <a href="https://github.com/ImranR98/Obtainium">Obtainium</a> and add <code>https://github.com/digitalvalut/logos-protocol</code>: every new version arrives without you doing anything.',
    'and.sig': 'Want to be certain it is the genuine app? Every version is signed with the same key, whose fingerprint is published in the <a href="https://github.com/digitalvalut/logos-protocol#android-as-a-signed-apk">README</a>, and every version is rebuilt and checked by an independent computer before it is declared reproducible.',

    'ios.t': 'iPhone and iPad',
    'ios.1': 'Open <strong>Safari</strong> and go to <code>digitalvalut.github.io/logos-protocol/modifica.html</code>',
    'ios.2': 'Tap <strong>Share</strong> (the square with the arrow), then <strong>Add to Home Screen</strong>.',
    'ios.3': 'Open Logos from the Home Screen, type your name, tap <strong>Start</strong>.',
    'ios.cta': 'Open Logos in Safari',

    'pc.t': 'Computer — Windows, Mac, Linux',
    'pc.1': 'Open Chrome, Edge, Firefox or Safari and go to <code>digitalvalut.github.io/logos-protocol/modifica.html</code>',
    'pc.2': 'If the browser offers <strong>Install</strong>, accept: Logos becomes a program with its own icon, like any other.',
    'pc.3': 'Type your name, tap <strong>Start</strong>.',
    'pc.cta': 'Open Logos',

    'max.title': 'If you want the most',
    'max.lead': 'Logos, as it is, encrypts everything end to end: what you say is read only by you and the person you talk to. This part is not required. It is for those who want more, in levels: each one says what it gives you.',

    'l1.t': 'Level 1 — Six habits inside Logos',
    'l1.a': '<strong>Check the three words.</strong> Every contact has three safety words. Read them aloud with the person, once: from then on you know it is them and nobody else.',
    'l1.b': '<strong>With people you do not know, use a throwaway address.</strong> It is the teal tile on the first page: your real address goes only to whom you choose.',
    'l1.c': '<strong>Turn on "Protected screen"</strong> (Settings → More): no screenshots, no previews among open apps.',
    'l1.d': '<strong>Keep the app up to date:</strong> Obtainium on Android; elsewhere, just reopen the page.',
    'l1.e': '<strong>Keep only what you need:</strong> automatic history clean-up is in the settings.',
    'l1.f': '<strong>Print your QR.</strong> "Save the QR" (Settings → your address) gives you an image for a business card, a shop window, a notice board, with a caption you choose: whoever scans it calls you, without ever having your number. It works for a throwaway address too — the ad ends, you delete it, and whoever photographed it can no longer find you.',

    'l2.t': 'Level 2 — Nobody knows where you connect from: Tor',
    'l2.p1': 'With Tor on, not even your network address is visible: not to the relay, not to the person you talk to, not to anyone watching the connection. It is the choice of journalists, lawyers and anyone who needs to write without being located.',
    'l2.p2': '<strong>Why it is not inside Logos.</strong> Tor is a project of its own, with its own updates and its own rules. Logos contains not one external library, and stays that way: small, readable in full, verifiable. You turn Tor on when you need it, with the Tor project\'s official tools, and Logos works exactly as always.',
    'l2.p3': '<strong>When to use it.</strong> It is made for writing: messages, photos, files. For voice and video calls the normal connection is the right one, because Tor puts anonymity before speed.',
    'l2.and': 'Android',
    'l2.and1': 'Install <strong>Orbot</strong> from <a href="https://play.google.com/store/apps/details?id=org.torproject.android">Google Play</a> or from the <a href="https://guardianproject.info/apps/org.torproject.android/">Guardian Project</a> site (its developers).',
    'l2.and2': 'In Orbot choose <strong>VPN mode</strong>, then "Tor-enabled apps" and select <strong>Logos</strong>.',
    'l2.and3': 'Tap <strong>Start</strong>. When the onion turns green, open Logos as usual.',
    'l2.ios': 'iPhone and iPad',
    'l2.ios1': 'Install <strong>Orbot</strong> from the <a href="https://apps.apple.com/app/orbot/id1609461599">App Store</a>.',
    'l2.ios2': 'Tap <strong>Connect</strong>: Orbot protects the whole device, Safari included.',
    'l2.ios3': 'Open Logos from the Home Screen as usual.',
    'l2.pc': 'Computer',
    'l2.pc1': 'Download <strong>Tor Browser</strong> from <a href="https://www.torproject.org/download/">torproject.org</a> (Windows, Mac, Linux).',
    'l2.pc2': 'Open it and go to <code>digitalvalut.github.io/logos-protocol/modifica.html</code>',
    'l2.pc3': 'Use Logos inside Tor Browser. For calls, allow the microphone when asked.',

    'l3.t': 'Level 3 — The phone',
    'l3.p1': 'An app is worth as much as the phone it runs on. People who mean it use <a href="https://grapheneos.org/">GrapheneOS</a> on a Google Pixel: an Android without Google, with immediate updates and separate profiles. Logos runs on it with no compromise at all, because it depends on no Google service — by construction.',
    'l3.p2': 'Inside GrapheneOS: a profile dedicated to Logos, a long PIN, unlock without face recognition, automatic lock after a few minutes.',

    'l4.t': 'Level 4 — You',
    'l4.p1': 'Three habits are worth more than any technology: always lock the phone, do not open links from strangers, check the three words before saying important things. Encryption does the rest.',

    'close': 'None of this is required. Logos without any of it is already an end-to-end encrypted messenger, with no number and no account. The rest is for those who want more — and now know exactly what they get.',
  };

  const IT = {};   /* l'italiano e' nell'HTML: lo si mette da parte al primo giro */
  for (const el of document.querySelectorAll('[data-i18n]')) IT[el.getAttribute('data-i18n')] = el.innerHTML;

  function paint(lang){
    const dict = lang === 'it' ? IT : EN;
    for (const el of document.querySelectorAll('[data-i18n]')){
      const s = dict[el.getAttribute('data-i18n')];
      if (s !== undefined) el.innerHTML = s;
    }
    document.documentElement.lang = lang;
    document.title = (lang === 'it' ? 'Installa Logos' : 'Install Logos') + ' — DigitalValut Logos';
    document.getElementById('langIt').classList.toggle('on', lang === 'it');
    document.getElementById('langEn').classList.toggle('on', lang !== 'it');
    try{ localStorage.setItem('dvlogos-lang', lang === 'it' ? 'it' : 'en'); }catch(e){}
  }

  function preferred(){
    try{ const s = localStorage.getItem('dvlogos-lang'); if (s) return s === 'it' ? 'it' : 'en'; }catch(e){}
    for (const tag of (navigator.languages || [navigator.language || 'en'])){
      if (String(tag).slice(0, 2).toLowerCase() === 'it') return 'it';
    }
    return 'en';
  }

  document.getElementById('langIt').addEventListener('click', e => { e.preventDefault(); paint('it'); });
  document.getElementById('langEn').addEventListener('click', e => { e.preventDefault(); paint('en'); });
  paint(preferred());
})();
