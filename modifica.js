/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
const $ = id => document.getElementById(id);

/* ============================== drawn icons ==============================
   Everywhere a functional button showed a raw emoji — phone, camera, mic,
   speaker, paperclip, send, copy, trash, flame — it rendered as a different
   picture, a different size and a different colour on every phone, next to
   icons that were already drawn as consistent inline SVG (the gear, the two
   home buttons). Half a design system reads as no design system.
   One small set, same stroke weight and viewBox as those, used everywhere a
   button *acts* rather than *expresses* — the emoji picker's own smiley face
   and the reaction grid stay exactly as they are, because showing an emoji
   is correct there; it is the point of the button. */
const ICONS = {
  phone:'<path d="M6.6 10.8c1.4 2.9 3.7 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.7c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1z"/>',
  video:'<rect x="3" y="7" width="12.5" height="10" rx="2.2"/><path d="M15.5 11.2 21 8v8l-5.5-3.2"/>',
  videoOff:'<path d="M3 3l18 18"/><path d="M15.5 11.2 21 8v8l-5.5-3.2"/><path d="M15.3 7H5.2C4 7 3 8 3 9.2v5.6c0 .7.3 1.3.9 1.7"/><path d="M9.3 7h3l2.7 2.7"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M8.5 21h7"/>',
  micOff:'<path d="M3 3l18 18"/><path d="M15 9.5V6a3 3 0 0 0-5.9-.8"/><path d="M9 9v2a3 3 0 0 0 4.3 2.7"/><path d="M5.5 11a6.5 6.5 0 0 0 9.3 5.9"/><path d="M12 17.5V21M8.5 21h7"/>',
  speakerLow:'<path d="M4 9.5v5h3.3L12 18V6L7.3 9.5H4z"/><path d="M16 9.5a4 4 0 0 1 0 5"/>',
  speakerLoud:'<path d="M4 9.5v5h3.3L12 18V6L7.3 9.5H4z"/><path d="M16 8.2a5.8 5.8 0 0 1 0 7.6M18.6 6.2a9.4 9.4 0 0 1 0 11.6"/>',
  flip:'<path d="M17 2.5 20 5.5 17 8.5"/><path d="M4 12a8 8 0 0 1 13.9-5.4L20 5.5"/><path d="M7 21.5 4 18.5 7 15.5"/><path d="M20 12a8 8 0 0 1-13.9 5.4L4 18.5"/>',
  attach:'<path d="M15.5 6.5 8 14a3 3 0 0 0 4.2 4.2l7.6-7.6a5 5 0 0 0-7.1-7.1L4.9 11.3a7 7 0 0 0 9.9 9.9"/>',
  send:'<path d="M3.5 11.5 20 4l-6.5 16-3-6.5-6.5-2z"/><path d="M13.5 13.5 20 4"/>',
  copy:'<rect x="8.5" y="8.5" width="12" height="12" rx="2.2"/><path d="M15.5 8.5V5.7A2.2 2.2 0 0 0 13.3 3.5H5.7A2.2 2.2 0 0 0 3.5 5.7v7.6a2.2 2.2 0 0 0 2.2 2.2h2.8"/>',
  trash:'<path d="M4.5 7h15"/><path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2"/><path d="M6.5 7l1 12.2A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.8L17.5 7"/><path d="M10.2 11v6M13.8 11v6"/>',
  flame:'<path d="M12 2.5c1 3 3.5 3.6 3.5 7a3.5 3.5 0 0 1-7 0c0-1 .3-1.6.8-2.3.4.9 1.2 1.3 1.2 1.3-.6-2.5.3-4 1.5-6z"/><path d="M8.3 12.5a5.7 5.7 0 0 0 7.4 5.4A6 6 0 0 0 19 12.8c0-1.6-.5-2.6-1.2-3.6.1 1.6-.5 2.6-1.3 3.2"/>',
  plus:'<path d="M12 4.5v15M4.5 12h15"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.3"/>',
  link:'<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5l1.3-1.3a3.7 3.7 0 0 1 5.2 5.2L16 12"/><path d="M13 17.5l-1.3 1.3a3.7 3.7 0 0 1-5.2-5.2L8 12"/>',
  lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  bolt:'<path d="M12.5 3 5 13.5h5.5L11 21l7.5-10.5H13z"/>',
  idcard:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><circle cx="8.3" cy="12.3" r="2"/><path d="M13 10.3h5M13 14.3h3.5"/>',
  smile:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 10.2h.01M15.5 10.2h.01"/><path d="M8.3 14.2a5 5 0 0 0 7.4 0"/>',
  bell:'<path d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5v3.2c0 .7-.2 1.4-.7 2l-1 1.3c-.5.7 0 1.7.9 1.7h12.6c.9 0 1.4-1 .9-1.7l-1-1.3c-.5-.6-.7-1.3-.7-2V9a5.5 5.5 0 0 0-5.5-5.5z"/><path d="M9.5 20a2.5 2.5 0 0 0 5 0"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
  xmark:'<path d="M6 6l12 12M18 6L6 18"/>',
  warning:'<path d="M12 3.5 21.5 20h-19z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  dots:'<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
};
function svgIcon(name, cls){
  return '<svg class="btnicon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
}
function setIcon(id, name){ const el = $(id); if (el) el.innerHTML = svgIcon(name); }

/* ============================== i18n ==============================
   The same 13 languages LOGOS.html already ships, same codes, so the two
   apps read as one project rather than two half-translated ones. */
const LANGS = [
  ['it','Italiano'],['en','English'],['ar','العربية'],['bn','বাংলা'],['de','Deutsch'],
  ['es','Español'],['fr','Français'],['hi','हिन्दी'],['id','Bahasa Indonesia'],
  ['pt','Português'],['ru','Русский'],['ur','اردو'],['zh','中文']
];
const RTL = ['ar','ur'];
let CURLANG = 'it';
const I18N = { it: {}, en: {}, ar: {}, bn: {}, de: {}, es: {}, fr: {}, hi: {}, id: {}, pt: {}, ru: {}, ur: {}, zh: {} };

Object.assign(I18N.en, {
"onboard.text":"<b>DigitalValut Logos</b> — free and open-source software (Apache 2.0 license), owned by the Associazione di Promozione Sociale DigitalValut, a registered Italian nonprofit (Ente del Terzo Settore). Downloadable and usable free of charge by anyone, anywhere in the world.",
"install.btn":"Install",
"home.title":"Talk to anyone, wherever they are",
"home.sub":"Messages, photos, video, calls. No sign-up, no phone number, free forever.",
"home.nameLabel":"Your name",
"home.namePh":"Your name",


"home.legalSummary":"How it works, in three technical lines",
"home.legalBody":"It reveals your network address (IP) to whoever you talk to; it needs both of you online at once, otherwise nothing arrives, and on heavily filtered networks calls may not connect; no website can prevent a screenshot, ever.",
"nav.back":"Back",
"start.share":"Send the invite","btn.copyCode":"Copy the code",
"join.sendAnswer":"Send the reply",
"chat.someone":"Someone","chat.connected":"connected","chat.typePh":"Write a message…","chat.dropHere":"Drop them here to send",
"call.hangup":"End","call.accept":"Answer","call.decline":"Decline",
"menu.title":"Tools","menu.arm":"Self-destruct","menu.disarm":"Cancel",
"menu.clearHistory":"Clear history","menu.endChat":"End chat",
"menu.historyNote":"History stays only on this device, tied to the name of the person you're talking to. No server keeps it.",
"footer.text":"free and open-source software (Apache 2.0 license), a project of DigitalValut APS ETS.",
"footer.noserver":"No server: the connection is direct between the two browsers via WebRTC.",
"footer.author":"Conceived by Dr. Giuseppe Falsone for DigitalValut. © 2026 DigitalValut and the DigitalValut Team.",
"footer.license":"Read the open-source license","footer.source":"Source code on GitHub",
"verify.badge":"verify","verify.title":"Security code",
"verify.lead":"Compare it with the other person — out loud, by phone, or on a channel different from the one you used to exchange the invite code. If the two codes don't match exactly, someone may have inserted themselves into the connection: don't trust that chat.",
"verify.close":"Close","verify.unavailable":"Not ready yet — try again in a moment.",
"contacts.title":"Recent contacts",
"contacts.note":"One tap to see them again: what you said to each other stayed here. Each time needs a fresh invite, because no server keeps anyone connected for you.",
"toast.sealCopied":"Code copied","toast.copyFail":"Copy failed — select and copy by hand","toast.copySelected":"Copy failed — code selected for you, just press Ctrl/Cmd+C",
"call.busy":"didn't answer — busy on another call.","call.declinedBy":"declined the call.","call.connectFailed":"The call didn't connect. Try again.",
"call.joined":"joined the chat.","call.videoInvite":"is video calling you","call.audioInvite":"is calling you",
"call.inVideo":"Video call in progress…","call.inAudio":"Call in progress…","call.ringingVideo":"Video calling, waiting for answer…","call.ringingAudio":"Calling, waiting for answer…",
"call.micFail":"Microphone or camera unavailable, or permission denied.",
"call.micFailNotFound":"No microphone or camera found on this device.",
"call.micFailBusy":"Your microphone or camera is already being used by another app (Zoom, Teams, another tab…). Close it and try again.",
"call.micFailDenied":"The browser has blocked the microphone and camera for this site. Follow the steps below, then reload the page.",
"reconnect.trying":"Trying to reconnect to {n}…",
"reconnect.offline":"{n} doesn't seem to be online right now. Here's the code to send by hand.",
"call.noSpeakerFound":"Can't find a separate speaker on this phone.",
"call.speakerFail":"Can't switch the speaker on this phone.",
"destruct.countdown":"self-destructs in ","destruct.done":"Conversation self-destructed.",
"session.closed":"closed","session.newHint":"Create a new session to reconnect.",
"invite.shareText":"Want to chat with me on DigitalValut Logos? Open this link: if you don't have the page ready, it opens on its own with my invite already filled in.\n\n",
"invite.answerText":"Here's my reply for DigitalValut Logos, paste it to finish connecting:\n\n",
"mic.recording":"Recording — tap to stop","history.cleared":"History cleared on this device.",
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
"home.shareAppText":"Free, no account, works on any phone or computer, sends real files and photos at full quality — DigitalValut Logos:\n\n",
"lock.title":"Extra protection",
"lock.sub":"Locks the invite with a passphrase you say out loud. Worth turning on if the code travels over WhatsApp, email or SMS.",
"lock.passCap":"Passphrase",
"lock.passHint":"Say it out loud, or send it on a different channel from the code. Without it the code does not open.",
"lock.ask":"This invite is locked. Type the passphrase you were told out loud.",
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
"notify.title":"Let me know when someone's looking for me",
"notify.sub":"A notification if a contact tries to reach you and you don't have the app open — no name, no message, just a heads-up.",
"notify.iosHint":"On iPhone this only works once you've added the app to your Home Screen first: tap <b>Share</b> in Safari, then <b>Add to Home Screen</b>, and open the app from there.",
"notify.blocked":"Notifications blocked by the browser. Check the site's settings.",
"sas.title":"Security check",
"sas.lead":"Say these three words to each other out loud. If you both see the same ones, nobody has come in between.",
"sas.leadChanged":"Careful: this person no longer looks like the same one as last time. Usually that means a new phone or a reinstalled app — but it is also what being intercepted looks like. Say the three words out loud before going on.",
"sas.yes":"Yes, they match","sas.no":"No, they're different",
"sas.note":"Only needed the first time with this person: after that, the app remembers.",
"sas.confirmed":"Contact verified.",
"sas.refused":"The words did not match: this conversation is not considered safe. Close it and start again with a fresh code.",
"connect.bigTitle":"Connecting…","connect.bigHint":"Don't close the app — it only takes a few seconds.",
"autoclean.title":"Automatic cleanup","autoclean.sub":"Deletes conversations older than a set number of days on its own, so they don't keep taking up space on your phone. Off by default: nothing is ever deleted on its own unless you turn this on.","autoclean.after":"Delete conversations older than:","autoclean.d7":"7 days","autoclean.d30":"30 days","autoclean.d90":"90 days","autoclean.d365":"1 year",
"wake.waitsNote":"You can close the app: I'll let you know when they open the invite.","wake.calling":"Letting {name} know…","wake.callingHint":"Their phone has been buzzed. The moment they open the app you're connected — you can wait here.","wake.noAnswer":"They've been alerted but haven't opened the app yet. Try again later.",
"quick.helpAWaits":"Send it with the button below — the other person just taps it and they're in. Or read them the six digits out loud.",
"verify.inPerson":"verified in person","verify.inPersonDone":"Verified in person: you scanned the code off this person's own screen, so nobody can have got in between. There is no need to read the three words.","sas.leadMismatch":"Careful: whoever answered is not the phone whose code you scanned. It may be a mistake, but it is also exactly what you would see if someone had got in between. Don't write anything until you have read the three words aloud to each other.",
"easy.title":"Simple mode","easy.sub":"Just two big buttons and nothing else around them. For anyone who would rather not think about any of it — or for whoever is setting the phone up for them.","easy.voiceTitle":"Say it out loud","easy.voiceSub":"The app tells you what to do in your own language. For anyone who finds the screen hard to read.","easy.voiceOn":"All right. From now on I'll tell you what to do out loud.","easy.sayHome":"Tap the first button to start a chat. Tap the second one if someone sent you an invite.","easy.sayStart":"This is your code. Press the orange button to send it to whoever you like.","easy.sayJoin":"Type the six digits you were given.","easy.sayChat":"You're connected. You can talk now.",
"broker.down":"The service that helps you find each other isn't responding. The long code below still works: it goes through no server at all.",
"flash.title":"Connected","flash.titleWith":"Connected with {name}","flash.direct":"A direct link between your two phones","flash.relay":"Linked through an encrypted bridge — your network wouldn't allow a direct one","flash.noserver":"No server can read what you say to each other","flash.time":"In {s} seconds, without signing up to anything",
"viral.title":"That worked.","viral.sub":"If it was useful, pass it on: it's free, it asks for no account, and it keeps nothing about anyone.","viral.btn":"Tell someone about it",
"media.title":"Microphone and camera","media.warnDenied":"This browser is blocking the microphone: you won't be able to make or take calls.","media.warnFix":"How to fix it","media.retry":"Try again","media.close":"Close","media.nowOk":"Microphone is on. You can call now.","media.peerNoMic":"{name} answered, but their browser won't let them turn the microphone on. They did not refuse you.","media.peerNoCam":"{name} answered, but their browser won't let them turn the camera and microphone on. Try an audio-only call, or ask them to unblock them.","media.stepsIos":"Open <b>Settings</b> on your iPhone|Scroll down and tap <b>Safari</b>|Tap <b>Microphone</b>, then <b>Camera</b>: set them to <b>Ask</b> or <b>Allow</b>|Come back here and reload the page","media.stepsAndroid":"Tap the <b>padlock</b> next to the address at the top|Tap <b>Permissions</b>|Turn on <b>Microphone</b> and <b>Camera</b>|Reload the page","media.stepsChrome":"Click the <b>padlock</b> to the left of the address|Turn on <b>Microphone</b> and <b>Camera</b>|Reload the page","media.stepsSafariMac":"In the menu bar open <b>Safari</b> › <b>Settings for This Website</b>|Set <b>Microphone</b> and <b>Camera</b> to <b>Allow</b>|Reload the page","media.stepsFirefox":"Click the <b>padlock</b> to the left of the address|Clear the block next to <b>Use the Microphone</b> and <b>Use the Camera</b>|Reload the page","media.stepsOther":"Open your browser's settings for this site|Allow <b>Microphone</b> and <b>Camera</b>|Reload the page",
"addr.title":"Your permanent address","addr.sub":"Give this out instead of a phone number. Anyone holding it can reach you whenever they like, without knowing your name or your number. Off by default.","addr.qrHint":"Scanning it calls you directly","addr.share":"Send your address","addr.showQr":"Show the QR","addr.reachNote":"So people can reach you with the app closed too, turn on notifications below.","addr.dialLabel":"Got someone's address?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Call it","addr.badFormat":"That address isn't written right. It's 12 characters, like DV-K7M2-9QRT-X4WP.","addr.itsYou":"That's your own address.","addr.callingTitle":"Calling…","addr.callingHint":"If their app is closed I'll ring their phone. It can take a moment.","addr.noAnswer":"No answer. They've been alerted — try again later.","addr.dialFailed":"I couldn't call that address.","addr.noKey":"That address doesn't seem to be active any more. Ask the person to reopen the app and send it to you again: addresses changed with the latest update.","addr.noBroker":"I couldn't even start the call: the service that puts you in touch didn't answer. If you're using a copy of the app at a different address, open the official one.","addr.incomingTitle":"Someone is looking for you","addr.incomingSub":"The name and the reason were written by whoever is calling: until you accept, nobody can prove they really are that person.","addr.incomingToast":"Someone is calling your address.","addr.accept":"Accept","addr.ignore":"Ignore","addr.verified":"Verified: whoever answered really does own the address {a}. Nobody can have got in between.","addr.blockedIn":"A call from someone you turned away: ignored.","addr.shareText":"You can reach me here, without my phone number. My DigitalValut Logos address is {a}\n\nTap to call me:",
"addr.incomingAt":"through “{name}”","burn.title":"Throwaway addresses","burn.help":"One per listing, one per stranger. Delete it when you're done and that person can't reach you any more — they never had your real one.","burn.namePh":"What for? e.g. Second-hand sofa","burn.add":"Create","burn.send":"Send this address","burn.delete":"Delete","burn.deleted":"“{name}” deleted. That address no longer answers.","burn.made":"“{name}” created. You can hand it out now.","burn.needName":"Give it a name, so you know who you gave it to.","burn.full":"You can have {n} at a time. Delete one to make another.","burn.untitled":"Unnamed",
"knock.title":"You are contacting","knock.nameLabel":"What's your name?","knock.namePh":"Your name","knock.msgLabel":"What do you need? (optional)","knock.msgPh":"e.g. Do you have size 42 shoes?","knock.go":"Call","knock.note":"Your name and this line are seen only by the person you're calling. No server can read them.",
"letter.title":"Messages left for you","letter.noneTitle":"Nobody is answering right now.","letter.noneSub":"I've already let them know you tried to reach them. If you want to say more, write it here.","letter.ph":"Write your message here","letter.leave":"Leave the message","letter.cancel":"Never mind","letter.needText":"Write a line or two, so they know what you wanted.","letter.left":"Message left. They'll find it when they open the app.","letter.failed":"I couldn't leave the message. Try again.","letter.callBack":"Call back","letter.dismiss":"Done",
"home.bigStart":"Talk to someone","home.bigStartD":"Create an invite to send","home.bigJoin":"I have a code","home.bigJoinD":"Someone sent me an invite","set.lang":"Language","set.textsize":"Text size","conn.direct":"A direct link between the two phones","conn.directShort":"connected directly","conn.relay":"A safe link, through an encrypted bridge","conn.relayShort":"connected (bridge)","conn.down":"Connection lost","conn.downShort":"lost","conn.working":"Connecting","conn.wobbly":"The link wobbled — trying to pick it back up","conn.wobblyShort":"reconnecting","chat.linkLost":"The connection dropped. Nothing was lost — reopen the app and reconnect from Recent contacts.",
"call.flipFail":"I can't switch camera on this phone.",
"call.flipBusy":"The camera is in use by another app. Close it and try again.","call.flipDenied":"The browser has blocked the camera for this site.","call.flipOnlyOne":"This device has only one camera.",
"home.alreadyTalking":"You're already in a conversation. To start another, close this one first.","home.stillCalling":"I'm still calling. Wait for an answer, or cancel the call.","home.busyReconnect":"You're busy right now. Finish or close the current connection before trying again.",
"letter.missed":"Wanted to talk to you.",
"sas.blocked":"Say the three words out loud first: this person is no longer the same one.",
"file.tooBig":"An incoming file was stopped: it did not match what was declared.","file.sendFailed":"Send interrupted: the connection closed partway through.","file.progress":"{sent} of {total}",
"share.pending":"{n} file ready to send — they'll go the moment you connect",
"health.storage":"Phone storage",
"health.storageFull":"Full: conversations are no longer being saved. Free up space on the phone.",
"addr.lifespan":"This address does not expire. It stays valid as long as the app's data stays on this phone.",
"health.addrLife":"Safety words",
"health.addrLifeOk":"Stable for about {n} more days.",
"health.addrLifeSoon":"In about {n} days they change by themselves. Your contacts will be asked to check them with you again — it is not a sign of anything wrong.","health.addrKeyBad":"They cannot reach you: this phone has not managed to publish the key its address is built on. Check your connection and reopen the app.",
"health.title":"How the app is doing",
"health.sub":"If someone can't reach you, the reason is below.",
"health.recheck":"Check again",
"health.copy":"Copy the report",
"health.copied":"Report copied.",
"health.checking":"Checking…",
"health.busy":"Paused: you're already in a conversation.",
"health.stopped":"I'm not listening. Close the app and open it again.",
"health.addr":"Anyone holding your address",
"health.addrOk":"Can call you right now.",
"health.addrOff":"Your address is off. Turn it on above.",
"health.contacts":"Your contacts",
"health.contactsOk":"They can find you again right now.",
"health.contactsNone":"You have no contacts yet.",
"health.broker":"The service that introduces you",
"health.brokerOk":"Answering.",
"health.brokerBad":"Not answering. The long codes still work: they go through no server at all.",
"health.brokerOrigin":"This copy of the app is at an address the service doesn't recognise: it won't work from here. Open the official one.",
"health.closed":"With the app closed",
"health.closedOk":"They can make your phone ring.",
"health.closedOff":"They can't reach you. Turn on notifications above.",
"health.closedDenied":"The browser is blocking notifications: with the app closed, nobody reaches you.",
"health.closedIos":"On iPhone you first have to add the app to the Home screen.",
"health.mic":"Microphone",
"health.micOk":"Available.",
"health.micBad":"Blocked by the browser: you won't be able to make or take calls.",
"health.micUnknown":"I can't tell until you try a call.",
"health.version":"Version in use",
"health.versionOld":"Part of the app is still the old one. Close it and open it again.",
"media.stepsAndroidApp":"Go back to your phone's Home screen|Press and hold the <b>DigitalValut Logos</b> icon|Tap <b>App info</b> (or the ⓘ icon)|Tap <b>Permissions</b>, then turn on <b>Microphone</b> and <b>Camera</b>|Reopen the app"
});
Object.assign(I18N.it, {
"onboard.text":"<b>DigitalValut Logos</b> — software libero e open source (licenza Apache 2.0), di proprietà dell'Associazione di Promozione Sociale DigitalValut, Ente del Terzo Settore. Scaricabile e utilizzabile gratis da chiunque, ovunque nel mondo.",
"install.btn":"Installa",
"home.title":"Parla con chi vuoi, ovunque sia",
"home.sub":"Messaggi, foto, video, chiamate. Senza registrarsi, senza numero di telefono, gratis per sempre.",
"home.nameLabel":"Come ti chiami","home.namePh":"Il tuo nome",
"home.legalSummary":"Come funziona, in tre righe tecniche",
"home.legalBody":"Rivela il tuo indirizzo di rete (IP) a chi parli con te; serve che siate online insieme, altrimenti non arriva nulla, e su reti molto filtrate le chiamate possono non collegarsi; nessun sito web può impedire uno screenshot, a nessuno.",
"contacts.title":"Contatti recenti",
"contacts.note":"Un tocco per rivederli: quello che vi siete detti è rimasto qui. Ogni volta serve un invito nuovo, perché nessun server tiene nessuno collegato al posto vostro.",
"verify.title":"Codice di sicurezza",
"verify.lead":"Confrontalo con l'altra persona — a voce, per telefono, o su un altro canale che non sia quello con cui vi siete scambiati il codice d'invito. Se i due codici non combaciano esattamente, qualcuno potrebbe essersi inserito nella connessione: non fidarti di quella chat.",


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
"home.shareAppText":"Gratis, senza account, funziona su qualunque telefono o computer, manda foto e file veri senza comprimerli — DigitalValut Logos:\n\n",
"nav.back":"Indietro",
"start.share":"Manda l'invito","btn.copyCode":"Copia il codice",
"join.sendAnswer":"Manda la risposta",
"chat.someone":"Qualcuno","chat.connected":"connessa","chat.typePh":"Scrivi un messaggio…","chat.dropHere":"Lascia qui per mandarli",
"call.hangup":"Chiudi","call.accept":"Rispondi","call.decline":"Rifiuta",
"menu.title":"Strumenti","menu.arm":"Autodistruzione","menu.disarm":"Annulla",
"menu.clearHistory":"Svuota cronologia","menu.endChat":"Termina chat",
"menu.historyNote":"La cronologia resta solo su questo dispositivo, legata al nome della persona con cui parli. Nessun server la conserva.",
"footer.text":"software libero e open source (licenza Apache 2.0), un progetto di DigitalValut APS ETS.",
"footer.noserver":"Nessun server: la connessione è diretta tra i due browser via WebRTC.",
"footer.author":"Ideato dal Dott. Giuseppe Falsone per DigitalValut. © 2026 DigitalValut e il Team DigitalValut.",
"footer.license":"Leggi la licenza open source","footer.source":"Codice sorgente su GitHub",
"lock.title":"Protezione extra",
"lock.sub":"Chiude l'invito con una parola d'ordine che dirai a voce. Conviene se il codice passa da WhatsApp, email o SMS.",
"lock.passCap":"Parola d'ordine",
"lock.passHint":"Dilla a voce, o mandala su un canale diverso da quello del codice. Senza, il codice non si apre.",
"lock.ask":"Questo invito è chiuso a chiave. Scrivi la parola d'ordine che ti hanno detto a voce.",
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
"verify.badge":"verifica","verify.close":"Chiudi",
"verify.unavailable":"Non ancora disponibile — riprova tra un istante.",
"toast.sealCopied":"Codice copiato","toast.copyFail":"Copia non riuscita — seleziona e copia a mano","toast.copySelected":"Copia non riuscita — l'ho selezionato per te, premi Ctrl/Cmd+C",
"call.busy":"non ha risposto — occupato in un'altra chiamata.","call.declinedBy":"ha rifiutato la chiamata.","call.connectFailed":"La chiamata non si è collegata. Riprova.",
"call.joined":"si è unito alla chat.","call.videoInvite":"ti sta facendo una videochiamata","call.audioInvite":"ti sta chiamando",
"call.inVideo":"Videochiamata in corso…","call.inAudio":"Chiamata in corso…","call.ringingVideo":"Chiamata video in corso, in attesa di risposta…","call.ringingAudio":"Chiamata in corso, in attesa di risposta…",
"call.micFail":"Microfono o fotocamera non disponibili, o permesso negato.",
"call.micFailNotFound":"Non trovo un microfono o una fotocamera su questo dispositivo.",
"call.micFailBusy":"Il microfono o la fotocamera sono già in uso da un'altra app (Zoom, Teams, un'altra scheda…). Chiudila e riprova.",
"call.micFailDenied":"Il browser ha bloccato microfono e fotocamera per questo sito. Segui i passaggi qui sotto, poi ricarica la pagina.",
"reconnect.trying":"Provo a ricollegarmi a {n}…",
"reconnect.offline":"{n} non sembra online in questo momento. Ecco il codice da mandare a mano.",
"call.noSpeakerFound":"Non trovo un altoparlante separato su questo telefono.",
"call.speakerFail":"Non riesco a cambiare l'altoparlante su questo telefono.",
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
"notify.title":"Avvisami quando qualcuno mi cerca",
"notify.sub":"Una notifica se un contatto prova a raggiungerti e non hai l'app aperta — nessun nome, nessun messaggio, solo un avviso.",
"notify.iosHint":"Su iPhone funziona solo se prima aggiungi l'app alla schermata Home: tocca <b>Condividi</b> in Safari, poi <b>Aggiungi a Home</b>, e apri l'app da lì.",
"notify.blocked":"Notifiche bloccate dal browser. Controlla le impostazioni del sito.",
"sas.title":"Controllo di sicurezza",
"sas.lead":"Ditevi queste tre parole a voce. Se le vedete uguali tutti e due, nessuno si è messo in mezzo.",
"sas.leadChanged":"Attenzione: questa persona non risulta più la stessa dell'ultima volta. Di solito è un telefono nuovo o l'app reinstallata — ma è anche il segno di qualcuno che si è messo in mezzo. Ditevi le tre parole a voce prima di continuare.",
"sas.yes":"Sì, sono uguali","sas.no":"No, sono diverse",
"sas.note":"Serve solo la prima volta con questa persona: dopo, l'app se lo ricorda.",
"sas.confirmed":"Contatto verificato.",
"sas.refused":"Le parole non coincidevano: questa conversazione non è considerata sicura. Chiudila e ricominciate con un codice nuovo.",
"connect.bigTitle":"Connessione in corso…","connect.bigHint":"Non chiudere l'app — ci vogliono pochi secondi.",
"autoclean.title":"Pulizia automatica","autoclean.sub":"Cancella da sola le conversazioni più vecchie di tot giorni, per non far crescere lo spazio occupato sul telefono. Spenta di base: senza attivarla, non si cancella mai nulla da solo.","autoclean.after":"Cancella le conversazioni più vecchie di:","autoclean.d7":"7 giorni","autoclean.d30":"30 giorni","autoclean.d90":"90 giorni","autoclean.d365":"1 anno",
"wake.waitsNote":"Puoi chiudere l'app: quando aprono l'invito ti avviso io.","wake.calling":"Sto avvisando {name}…","wake.callingHint":"Ho fatto squillare il suo telefono. Appena apre l'app siete connessi — puoi aspettare qui.","wake.noAnswer":"L'ho avvisata ma non ha ancora aperto l'app. Riprova più tardi.",
"quick.helpAWaits":"Mandalo col pulsante qui sotto — all'altra persona basta toccarlo ed è dentro. Oppure dille le sei cifre a voce.",
"verify.inPerson":"verificato di persona","verify.inPersonDone":"Verificato di persona: hai inquadrato il codice sullo schermo di questa persona, quindi nessuno può essersi messo in mezzo. Non serve dirsi le tre parole.","sas.leadMismatch":"Attenzione: chi ha risposto non è il telefono del codice che hai inquadrato. Può essere un errore, ma è anche esattamente ciò che si vedrebbe se qualcuno si fosse messo in mezzo. Non scrivere nulla finché non vi siete detti le tre parole a voce.",
"easy.title":"Modalità semplice","easy.sub":"Solo due pulsanti grandi e nient'altro attorno. Per chi non vuole pensare a niente — o per chi prepara il telefono a qualcun altro.","easy.voiceTitle":"Dillo ad alta voce","easy.voiceSub":"L'app dice a voce cosa fare, nella tua lingua. Serve a chi fa fatica a leggere lo schermo.","easy.voiceOn":"Va bene. Da adesso ti dico a voce cosa fare.","easy.sayHome":"Tocca il primo pulsante per iniziare una chat. Tocca il secondo se ti hanno mandato un invito.","easy.sayStart":"Questo è il tuo codice. Premi il pulsante arancione per mandarlo a chi vuoi.","easy.sayJoin":"Scrivi le sei cifre che ti hanno dato.","easy.sayChat":"Siete connessi. Ora potete parlare.",
"broker.down":"Il servizio che vi fa incontrare non risponde. Il codice lungo qui sotto funziona lo stesso: non passa da nessun server.",
"flash.title":"Connessi","flash.titleWith":"Connessi con {name}","flash.direct":"Collegamento diretto tra i vostri due telefoni","flash.relay":"Collegamento tramite ponte cifrato — la vostra rete non permetteva quello diretto","flash.noserver":"Nessun server può leggere quello che vi dite","flash.time":"In {s} secondi, senza registrarsi a niente",
"viral.title":"Ha funzionato.","viral.sub":"Se è stato utile, passalo a qualcun altro: è gratis, non chiede account e non tiene niente di nessuno.","viral.btn":"Fallo sapere a qualcuno",
"media.title":"Microfono e fotocamera","media.warnDenied":"Microfono bloccato da questo browser: non potrai fare né ricevere chiamate.","media.warnFix":"Come si sistema","media.retry":"Riprova","media.close":"Chiudi","media.nowOk":"Microfono attivo. Ora puoi chiamare.","media.peerNoMic":"{name} ha risposto, ma il suo browser blocca il microfono: non è un rifiuto.","media.peerNoCam":"{name} ha risposto, ma il suo browser blocca fotocamera e microfono: non è un rifiuto. Provate con una chiamata solo audio.","media.stepsIos":"Apri <b>Impostazioni</b> sull'iPhone|Scendi e tocca <b>Safari</b>|Tocca <b>Microfono</b> e poi <b>Fotocamera</b>: metti <b>Chiedi</b> o <b>Consenti</b>|Torna qui e ricarica la pagina","media.stepsAndroid":"Tocca il <b>lucchetto</b> vicino all'indirizzo, in alto|Tocca <b>Autorizzazioni</b>|Attiva <b>Microfono</b> e <b>Fotocamera</b>|Ricarica la pagina","media.stepsChrome":"Clicca il <b>lucchetto</b> a sinistra dell'indirizzo|Attiva <b>Microfono</b> e <b>Fotocamera</b>|Ricarica la pagina","media.stepsSafariMac":"Nella barra in alto apri <b>Safari</b> › <b>Impostazioni per questo sito web</b>|Metti <b>Microfono</b> e <b>Fotocamera</b> su <b>Consenti</b>|Ricarica la pagina","media.stepsFirefox":"Clicca il <b>lucchetto</b> a sinistra dell'indirizzo|Togli il blocco accanto a <b>Usa il microfono</b> e <b>Usa la fotocamera</b>|Ricarica la pagina","media.stepsOther":"Apri le impostazioni del browser per questo sito|Consenti <b>Microfono</b> e <b>Fotocamera</b>|Ricarica la pagina",
"addr.title":"Il tuo indirizzo permanente","addr.sub":"Da dare al posto del numero di telefono. Chi ce l'ha può cercarti quando vuole, senza sapere il tuo nome né il tuo numero. Spento di base.","addr.qrHint":"Chi lo inquadra ti chiama direttamente","addr.share":"Manda il tuo indirizzo","addr.showQr":"Mostra il QR","addr.reachNote":"Perché ti possano raggiungere anche con l'app chiusa, accendi gli avvisi qui sotto.","addr.dialLabel":"Hai l'indirizzo di qualcuno?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Chiamalo","addr.badFormat":"Questo indirizzo non è scritto bene. Sono 12 caratteri, tipo DV-K7M2-9QRT-X4WP.","addr.itsYou":"Questo è il tuo indirizzo.","addr.callingTitle":"Sto chiamando…","addr.callingHint":"Se la persona ha l'app chiusa le faccio squillare il telefono. Può volerci qualche istante.","addr.noAnswer":"Non ha risposto. L'ho avvisata: riprova più tardi.","addr.dialFailed":"Non sono riuscito a chiamare questo indirizzo.","addr.noKey":"Questo indirizzo non risulta più attivo. Chiedi alla persona di riaprire l'app e di rimandartelo: gli indirizzi sono cambiati con l'ultimo aggiornamento.","addr.noBroker":"Non sono riuscito nemmeno a far partire la chiamata: il servizio che vi fa incontrare non ha risposto. Se stai usando una copia dell'app su un altro indirizzo, apri quella ufficiale.","addr.incomingTitle":"Qualcuno ti sta cercando","addr.incomingSub":"Il nome e il motivo li ha scritti chi ti cerca: finché non accetti, nessuno può dimostrare di essere davvero quella persona.","addr.incomingToast":"Qualcuno ti sta cercando al tuo indirizzo.","addr.accept":"Accetta","addr.ignore":"Ignora","addr.verified":"Verificato: chi ha risposto possiede davvero l'indirizzo {a}. Nessuno può essersi messo in mezzo.","addr.blockedIn":"Chiamata da un contatto che avevi rifiutato: ignorata.","addr.shareText":"Puoi cercarmi qui, senza il mio numero di telefono. Il mio indirizzo su DigitalValut Logos è {a}\n\nTocca per chiamarmi:",
"addr.incomingAt":"tramite «{name}»","burn.title":"Indirizzi usa e getta","burn.help":"Uno per ogni annuncio o sconosciuto. Quando hai finito lo cancelli e quella persona non ti trova più — il tuo indirizzo vero non l'ha mai avuto.","burn.namePh":"Per cosa? es. Divano usato","burn.add":"Crea","burn.send":"Manda questo indirizzo","burn.delete":"Cancella","burn.deleted":"«{name}» cancellato. Quell'indirizzo non risponde più.","burn.made":"«{name}» creato. Ora puoi darlo a chi vuoi.","burn.needName":"Dagli un nome, così sai a chi l'hai dato.","burn.full":"Puoi averne al massimo {n} insieme. Cancellane uno per farne un altro.","burn.untitled":"Senza nome",
"knock.title":"Stai contattando","knock.nameLabel":"Come ti chiami?","knock.namePh":"Il tuo nome","knock.msgLabel":"Cosa ti serve? (se vuoi)","knock.msgPh":"es. Avete le scarpe numero 42?","knock.go":"Chiama","knock.note":"Il tuo nome e questa frase li vede solo la persona che stai chiamando. Nessun server può leggerli.",
"letter.title":"Messaggi lasciati per te","letter.noneTitle":"Non risponde nessuno adesso.","letter.noneSub":"Le ho già segnato che l'hai cercata. Se vuoi dirle qualcosa in più, scrivilo qui.","letter.ph":"Scrivi qui il tuo messaggio","letter.leave":"Lascia il messaggio","letter.cancel":"Lascia perdere","letter.needText":"Scrivi due parole, così sa cosa volevi.","letter.left":"Messaggio lasciato. Lo troverà appena apre l'app.","letter.failed":"Non sono riuscito a lasciare il messaggio. Riprova.","letter.callBack":"Richiama","letter.dismiss":"Fatto",
"home.bigStart":"Parla con qualcuno","home.bigStartD":"Crea un invito da mandare","home.bigJoin":"Ho un codice","home.bigJoinD":"Mi hanno mandato un invito","set.lang":"Lingua","set.textsize":"Dimensione del testo","conn.direct":"Collegamento diretto fra i due telefoni","conn.directShort":"collegata direttamente","conn.relay":"Collegamento sicuro, attraverso un ponte cifrato","conn.relayShort":"collegata (ponte)","conn.down":"Connessione caduta","conn.downShort":"caduta","conn.working":"Collegamento in corso","conn.wobbly":"Il collegamento ha vacillato — sto riprendendolo","conn.wobblyShort":"sto riprendendo","chat.linkLost":"Il collegamento è caduto. Non si è perso niente — riapri l'app e ricollegati da Contatti recenti.",
"call.flipFail":"Non riesco a cambiare fotocamera su questo telefono.",
"call.flipBusy":"La fotocamera è occupata da un'altra app. Chiudila e riprova.","call.flipDenied":"Il browser ha bloccato la fotocamera per questo sito.","call.flipOnlyOne":"Questo dispositivo ha una sola fotocamera.",
"home.alreadyTalking":"Sei già in una conversazione. Per iniziarne un'altra, chiudi prima questa.","home.stillCalling":"Sto ancora chiamando. Aspetta la risposta, o annulla la chiamata.","home.busyReconnect":"Sei occupato al momento. Chiudi o completa la connessione in corso prima di riprovare.",
"letter.missed":"Voleva parlarti.",
"sas.blocked":"Prima dite le tre parole a voce: questa persona non risulta più la stessa.",
"file.tooBig":"Un file in arrivo è stato interrotto: non corrispondeva a quanto dichiarato.","file.sendFailed":"Invio interrotto: la connessione si è chiusa a metà.","file.progress":"{sent} di {total}",
"share.pending":"{n} file pronti da mandare — arrivano appena ti colleghi",
"health.storage":"Memoria del telefono",
"health.storageFull":"Piena: le conversazioni non vengono più salvate. Libera spazio sul telefono.",
"addr.lifespan":"Questo indirizzo non scade. Resta valido finché i dati dell'app restano su questo telefono.",
"health.addrLife":"Parole di sicurezza",
"health.addrLifeOk":"Stabili per altri {n} giorni circa.",
"health.addrLifeSoon":"Fra circa {n} giorni cambieranno da sole. Ai tuoi contatti verrà chiesto di ricontrollarle con te: non è segno che ci sia qualcosa di sbagliato.","health.addrKeyBad":"Non ti possono raggiungere: questo telefono non è riuscito a pubblicare la chiave su cui è costruito il suo indirizzo. Controlla la connessione e riapri l'app.",
"health.title":"Come sta l'app",
"health.sub":"Se qualcuno non riesce a raggiungerti, qui sotto c'è il motivo.",
"health.recheck":"Controlla di nuovo",
"health.copy":"Copia il resoconto",
"health.copied":"Resoconto copiato.",
"health.checking":"Sto controllando…",
"health.busy":"In pausa: sei già in una conversazione.",
"health.stopped":"Non sto ascoltando. Chiudi e riapri l'app.",
"health.addr":"Chi ha il tuo indirizzo",
"health.addrOk":"Ti può chiamare adesso.",
"health.addrOff":"Il tuo indirizzo è spento. Accendilo qui sopra.",
"health.contacts":"I tuoi contatti",
"health.contactsOk":"Ti possono ritrovare adesso.",
"health.contactsNone":"Non hai ancora nessun contatto.",
"health.broker":"Il servizio che vi fa incontrare",
"health.brokerOk":"Risponde.",
"health.brokerBad":"Non risponde. Restano i codici lunghi, che non passano da nessun server.",
"health.brokerOrigin":"Questa copia dell'app è su un indirizzo che il servizio non riconosce: da qui non funzionerà. Apri quella ufficiale.",
"health.closed":"Con l'app chiusa",
"health.closedOk":"Ti possono far squillare il telefono.",
"health.closedOff":"Non ti raggiungono. Accendi gli avvisi qui sopra.",
"health.closedDenied":"Il browser blocca gli avvisi: con l'app chiusa non ti raggiunge nessuno.",
"health.closedIos":"Su iPhone serve prima aggiungere l'app alla schermata Home.",
"health.mic":"Microfono",
"health.micOk":"Disponibile.",
"health.micBad":"Bloccato dal browser: non potrai fare né ricevere chiamate.",
"health.micUnknown":"Non posso saperlo finché non provi una chiamata.",
"health.version":"Versione in uso",
"health.versionOld":"Una parte dell'app è ancora vecchia. Chiudila e riaprila.",
"media.stepsAndroidApp":"Torna alla schermata Home del telefono|Tieni premuta l'icona di <b>DigitalValut Logos</b>|Tocca <b>Informazioni app</b> (o l'icona ⓘ)|Tocca <b>Autorizzazioni</b>, poi attiva <b>Microfono</b> e <b>Fotocamera</b>|Riapri l'app"
});

Object.assign(I18N.fr, {
"onboard.text":"<b>DigitalValut Logos</b> — logiciel libre et open source (licence Apache 2.0), propriété de l'Associazione di Promozione Sociale DigitalValut, une association à but non lucratif italienne enregistrée (Ente del Terzo Settore). Téléchargeable et utilisable gratuitement par tous, partout dans le monde.",
"install.btn":"Installer",
"home.title":"Parlez à qui vous voulez, où qu'il soit",
"home.sub":"Messages, photos, vidéos, appels. Sans inscription, sans numéro de téléphone, gratuit pour toujours.",
"home.nameLabel":"Votre nom","home.namePh":"Votre nom",


"home.legalSummary":"Comment ça marche, en trois lignes techniques",
"home.legalBody":"Cela révèle votre adresse réseau (IP) à votre interlocuteur ; il faut que vous soyez tous les deux en ligne en même temps, sinon rien n'arrive, et sur des réseaux très filtrés les appels peuvent ne pas se connecter ; aucun site web ne peut jamais empêcher une capture d'écran.",
"nav.back":"Retour",
"start.create":"Préparer l'invitation","start.share":"Envoyer l'invitation","btn.copyCode":"Copier le code",
"start.pastePh":"Collez la réponse ici…","btn.connect":"Entrer dans la discussion",
"join.pastePh":"Collez l'invitation ici…","join.generate":"Ouvrir l'invitation",
"join.sendAnswer":"Envoyer la réponse",
"chat.someone":"Quelqu'un","chat.connected":"connecté(e)","chat.typePh":"Écrivez un message…","chat.dropHere":"Déposez-les ici pour les envoyer",
"call.hangup":"Terminer","call.accept":"Répondre","call.decline":"Refuser",
"menu.title":"Outils","menu.arm":"Autodestruction","menu.disarm":"Annuler",
"menu.clearHistory":"Effacer l'historique","menu.endChat":"Terminer la discussion",
"menu.historyNote":"L'historique reste uniquement sur cet appareil, lié au nom de la personne avec qui vous parlez. Aucun serveur ne le conserve.",
"footer.text":"logiciel libre et open source (licence Apache 2.0), un projet de DigitalValut APS ETS.",
"footer.noserver":"Aucun serveur : la connexion est directe entre les deux navigateurs via WebRTC.",
"footer.author":"Conçu par le Dr Giuseppe Falsone pour DigitalValut. © 2026 DigitalValut et l'équipe DigitalValut.",
"footer.license":"Lire la licence open source","footer.source":"Code source sur GitHub",
"verify.badge":"vérifier","verify.title":"Code de sécurité",
"verify.lead":"Comparez-le avec l'autre personne — à voix haute, par téléphone, ou sur un canal différent de celui utilisé pour échanger le code d'invitation. Si les deux codes ne correspondent pas exactement, quelqu'un s'est peut-être inséré dans la connexion : ne faites pas confiance à cette discussion.",
"verify.close":"Fermer","verify.unavailable":"Pas encore prêt — réessayez dans un instant.",
"contacts.title":"Contacts récents",
"contacts.note":"Un tap pour les revoir : ce que vous vous êtes dit est resté ici. Chaque fois, une nouvelle invitation est nécessaire, car aucun serveur ne garde personne connecté à votre place.",
"toast.sealCopied":"Code copié","toast.copyFail":"Échec de la copie — sélectionnez et copiez à la main","toast.copySelected":"Échec de la copie — le code a été sélectionné pour vous, appuyez juste sur Ctrl/Cmd+C",
"call.busy":"n'a pas répondu — occupé sur un autre appel.","call.declinedBy":"a refusé l'appel.","call.connectFailed":"L'appel ne s'est pas connecté. Réessayez.",
"call.joined":"a rejoint la discussion.","call.videoInvite":"vous appelle en visio","call.audioInvite":"vous appelle",
"call.inVideo":"Appel vidéo en cours…","call.inAudio":"Appel en cours…","call.ringingVideo":"Appel vidéo en cours, en attente de réponse…","call.ringingAudio":"Appel en cours, en attente de réponse…",
"call.micFail":"Microphone ou caméra indisponible, ou permission refusée.",
"call.micFailNotFound":"Aucun microphone ou caméra trouvé sur cet appareil.",
"call.micFailBusy":"Votre microphone ou caméra est déjà utilisé par une autre application (Zoom, Teams, un autre onglet…). Fermez-la et réessayez.",
"call.micFailDenied":"Le navigateur a bloqué le microphone et la caméra pour ce site. Suivez les étapes ci-dessous, puis rechargez la page.",
"reconnect.trying":"Tentative de reconnexion à {n}…",
"reconnect.offline":"{n} ne semble pas en ligne pour le moment. Voici le code à envoyer à la main.",
"call.noSpeakerFound":"Impossible de trouver un haut-parleur séparé sur ce téléphone.",
"call.speakerFail":"Impossible de changer de haut-parleur sur ce téléphone.",
"destruct.countdown":"autodestruction dans ","destruct.done":"Conversation autodétruite.",
"session.closed":"fermée","session.newHint":"Créez une nouvelle session pour vous reconnecter.",
"invite.shareText":"Envie de discuter avec moi sur DigitalValut Logos ? Ouvrez ce lien : si vous n'avez pas la page prête, elle s'ouvre toute seule avec mon invitation déjà remplie.\n\n",
"invite.answerText":"Voici ma réponse pour DigitalValut Logos, collez-la pour terminer la connexion :\n\n",
"mic.recording":"Enregistrement — touchez pour arrêter","history.cleared":"Historique effacé sur cet appareil.",
"install.genericText":"<b>Installez DigitalValut Logos</b> pour l'avoir comme application, avec sa propre icône, sans passer par le navigateur.",
"install.iosText":"<b>Installez DigitalValut Logos sur iPhone ou iPad.</b> Touchez <b>Partager</b> dans Safari, puis <b>Sur l'écran d'accueil</b>.",
"home.shareApp":"Faire connaître l'appli à quelqu'un",
"start.s1":"Envoyez l'invitation",
"start.s1help":"Appuyez sur le bouton orange. L'appli prépare l'invitation et vous laisse choisir comment l'envoyer : WhatsApp, un message, un e-mail — ce que vous utilisez d'habitude.",
"start.s2":"Collez leur réponse",
"start.s2help":"Ils vous renverront un message. Copiez-le, revenez ici et appuyez sur <b>Coller</b>. Puis vous entrez ensemble dans la discussion.",
"join.s1":"Ouvrez l'invitation",
"join.s1help":"Si vous avez ouvert le lien qu'on vous a envoyé, tout est prêt : appuyez sur le bouton orange. Sinon appuyez sur <b>Coller</b>.",
"join.s2":"Envoyez la réponse",
"join.s2help":"Dernière étape : renvoyez ceci à la personne qui vous a invité, et vous êtes connectés.",
"btn.paste":"Coller","btn.showCode":"Afficher le code",
"toast.clipboardEmpty":"Il n'y a rien à coller.","toast.pasteManually":"Maintenez le doigt sur la case et choisissez Coller.",
"home.shareAppText":"Gratuit, sans compte, fonctionne sur tout téléphone ou ordinateur, envoie photos et fichiers en qualité originale — DigitalValut Logos :\n\n",
"lock.title":"Protection supplémentaire",
"lock.sub":"Verrouille l'invitation avec une phrase secrète que vous dites à voix haute. Utile si le code passe par WhatsApp, e-mail ou SMS.",
"lock.passCap":"Phrase secrète",
"lock.passHint":"Dites-la à voix haute, ou envoyez-la sur un canal différent du code. Sans elle, le code ne s'ouvre pas.",
"lock.ask":"Cette invitation est verrouillée. Tapez la phrase secrète qu'on vous a dite à voix haute.",
"lock.askPh":"phrase secrète","lock.working":"Un instant…",
"lock.needPass":"Tapez la phrase secrète pour ouvrir cette invitation.",
"lock.wrongPass":"Phrase secrète incorrecte. Vérifiez-la et réessayez.",
"lock.badAnswer":"Réponse invalide — ou elle a été scellée avec une phrase secrète différente.",
"join.badCode":"Ce code n'est pas valide. Vérifiez que vous l'avez copié en entier.",
"connect.waiting":"En attente de la connexion…",
"connect.failed":"Impossible de se connecter. Assurez-vous d'être tous les deux en ligne, puis créez une nouvelle invitation — les anciens codes ne peuvent pas être réutilisés.",
"connect.slow":"Cela prend plus de temps que d'habitude — cela arrive sur des réseaux très filtrés (entreprises, certains réseaux mobiles) ou si vous n'êtes pas en ligne au même moment. Attendez encore un peu, ou créez une nouvelle invitation.",
"footer.seal":"Empreintes de cette application (SHA-256) :",
"verify.known":"vérifié","verify.changedShort":"code changé","verify.accept":"Accepter le nouveau code",
"verify.noteKnown":"Même code que la dernière fois : personne ne s'est interposé depuis.",
"verify.noteNew":"Première fois avec cette personne : comparez le code à voix haute, puis l'appli s'en souvient.",
"verify.noteChanged":"Le code a changé. Cela signifie généralement un nouveau téléphone ou une appli réinstallée — mais c'est aussi ce à quoi ressemble une interception. Comparez-le à voix haute avant de l'accepter.",
"quick.titleA":"Votre code",
"quick.helpA":"Envoyez-le avec le bouton ci-dessous — un tap et c'est fait. Ou dites les six chiffres à voix haute. Ça continue de fonctionner tant que vous restez sur cet écran.",
"quick.orType":"Ou ouvrez l'appli et tapez ce code :","quick.qrHint":"Ou pointez une caméra de téléphone ici",
"quick.newCode":"Générer un nouveau code","quick.useLong":"Vous préférez le code long ?",
"quick.titleB":"Tapez le code",
"quick.helpB":"Demandez le code à la personne qui vous a invité — 6 chiffres, dits à voix haute ou écrits — et tapez-le ici.",
"quick.codePh":"000000","quick.connect":"Connecter",
"quick.waiting":"En attente que l'autre personne tape le code…","quick.expired":"Le code a expiré sans réponse. Générez-en un nouveau.",
"quick.notFound":"Code expiré ou incorrect. Vérifiez-le avec la personne qui vous l'a donné.",
"quick.shareText":"Voici le lien pour discuter avec moi sur DigitalValut Logos. Touchez-le et nous sommes connectés :",
"quick.share":"Envoyer l'invitation",
"notify.title":"Prévenez-moi quand quelqu'un me cherche",
"notify.sub":"Une notification si un contact essaie de vous joindre et que vous n'avez pas l'appli ouverte — aucun nom, aucun message, juste un signal.",
"notify.iosHint":"Sur iPhone, cela ne fonctionne que si vous avez d'abord ajouté l'appli à votre écran d'accueil : touchez <b>Partager</b> dans Safari, puis <b>Sur l'écran d'accueil</b>, et ouvrez l'appli depuis là.",
"notify.blocked":"Notifications bloquées par le navigateur. Vérifiez les paramètres du site.",
"sas.title":"Contrôle de sécurité",
"sas.lead":"Dites-vous ces trois mots à voix haute. Si vous voyez tous les deux les mêmes, personne ne s'est interposé.",
"sas.leadChanged":"Attention : cette personne ne semble plus être la même que la dernière fois. Cela signifie généralement un nouveau téléphone ou une appli réinstallée — mais c'est aussi ce à quoi ressemble une interception. Dites les trois mots à voix haute avant de continuer.",
"sas.yes":"Oui, ils correspondent","sas.no":"Non, ils sont différents",
"sas.note":"Nécessaire seulement la première fois avec cette personne : après, l'appli s'en souvient.",
"sas.confirmed":"Contact vérifié.",
"sas.refused":"Les mots ne correspondaient pas : cette conversation n'est pas considérée comme sûre. Fermez-la et recommencez avec un nouveau code.",
"connect.bigTitle":"Connexion en cours…","connect.bigHint":"Ne fermez pas l'appli — cela ne prend que quelques secondes.",
"autoclean.title":"Nettoyage automatique","autoclean.sub":"Supprime tout seul les discussions plus anciennes qu'un certain nombre de jours, pour qu'elles n'occupent pas d'espace sur votre téléphone. Désactivé par défaut : rien n'est jamais supprimé tout seul sans que vous l'activiez.","autoclean.after":"Supprimer les discussions plus anciennes que :","autoclean.d7":"7 jours","autoclean.d30":"30 jours","autoclean.d90":"90 jours","autoclean.d365":"1 an",
"wake.waitsNote":"Vous pouvez fermer l'application : je vous préviens quand l'invitation sera ouverte.","wake.calling":"J'préviens {name}…","wake.callingHint":"Son téléphone a sonné. Dès qu'elle ouvre l'application, vous êtes connectés — vous pouvez attendre ici.","wake.noAnswer":"Elle a été prévenue mais n'a pas encore ouvert l'application. Réessayez plus tard.",
"quick.helpAWaits":"Envoyez-le avec le bouton ci-dessous — l'autre personne n'a qu'à le toucher et elle est connectée. Ou dictez-lui les six chiffres à voix haute.",
"verify.inPerson":"vérifié en personne","verify.inPersonDone":"Vérifié en personne : vous avez scanné le code sur l'écran de cette personne, donc personne n'a pu s'interposer. Inutile de vous dire les trois mots.","sas.leadMismatch":"Attention : la personne qui a répondu n'est pas le téléphone dont vous avez scanné le code. Cela peut être une erreur, mais c'est aussi exactement ce que l'on verrait si quelqu'un s'était interposé. N'écrivez rien avant de vous être dit les trois mots à voix haute.",
"easy.title":"Mode simple","easy.sub":"Deux grands boutons et rien d'autre autour. Pour qui préfère ne penser à rien — ou pour qui prépare le téléphone de quelqu'un d'autre.","easy.voiceTitle":"Dis-le à voix haute","easy.voiceSub":"L'application dit à voix haute quoi faire, dans votre langue. Pour qui a du mal à lire l'écran.","easy.voiceOn":"D'accord. À partir de maintenant je vous dis quoi faire à voix haute.","easy.sayHome":"Touchez le premier bouton pour commencer une discussion. Touchez le second si on vous a envoyé une invitation.","easy.sayStart":"Voici votre code. Appuyez sur le bouton orange pour l'envoyer à qui vous voulez.","easy.sayJoin":"Tapez les six chiffres qu'on vous a donnés.","easy.sayChat":"Vous êtes connectés. Vous pouvez parler.",
"broker.down":"Le service qui vous aide à vous trouver ne répond pas. Le code long ci-dessous fonctionne quand même : il ne passe par aucun serveur.",
"flash.title":"Connectés","flash.titleWith":"Connectés avec {name}","flash.direct":"Une liaison directe entre vos deux téléphones","flash.relay":"Liaison via un pont chiffré — votre réseau n'autorisait pas la liaison directe","flash.noserver":"Aucun serveur ne peut lire ce que vous vous dites","flash.time":"En {s} secondes, sans inscription",
"viral.title":"Ça a marché.","viral.sub":"Si ça vous a servi, faites passer : c'est gratuit, sans compte, et ça ne conserve rien sur personne.","viral.btn":"En parler à quelqu'un",
"media.title":"Microphone et caméra","media.warnDenied":"Ce navigateur bloque le microphone : vous ne pourrez ni passer ni recevoir d'appels.","media.warnFix":"Comment corriger","media.retry":"Réessayer","media.close":"Fermer","media.nowOk":"Microphone activé. Vous pouvez appeler.","media.peerNoMic":"{name} a répondu, mais son navigateur bloque le microphone : ce n'est pas un refus.","media.peerNoCam":"{name} a répondu, mais son navigateur bloque la caméra et le microphone : ce n'est pas un refus. Essayez un appel audio.","media.stepsIos":"Ouvrez <b>Réglages</b> sur l'iPhone|Descendez et touchez <b>Safari</b>|Touchez <b>Microphone</b> puis <b>Appareil photo</b> : mettez <b>Demander</b> ou <b>Autoriser</b>|Revenez ici et rechargez la page","media.stepsAndroid":"Touchez le <b>cadenas</b> près de l'adresse, en haut|Touchez <b>Autorisations</b>|Activez <b>Microphone</b> et <b>Caméra</b>|Rechargez la page","media.stepsChrome":"Cliquez sur le <b>cadenas</b> à gauche de l'adresse|Activez <b>Microphone</b> et <b>Caméra</b>|Rechargez la page","media.stepsSafariMac":"Dans la barre de menus ouvrez <b>Safari</b> › <b>Réglages pour ce site web</b>|Mettez <b>Microphone</b> et <b>Caméra</b> sur <b>Autoriser</b>|Rechargez la page","media.stepsFirefox":"Cliquez sur le <b>cadenas</b> à gauche de l'adresse|Retirez le blocage à côté de <b>Utiliser le microphone</b> et <b>Utiliser la caméra</b>|Rechargez la page","media.stepsOther":"Ouvrez les réglages du navigateur pour ce site|Autorisez <b>Microphone</b> et <b>Caméra</b>|Rechargez la page",
"addr.title":"Votre adresse permanente","addr.sub":"À donner à la place du numéro de téléphone. Qui la possède peut vous joindre quand il veut, sans connaître ni votre nom ni votre numéro. Désactivée par défaut.","addr.qrHint":"La scanner vous appelle directement","addr.share":"Envoyer votre adresse","addr.showQr":"Afficher le QR","addr.reachNote":"Pour qu'on puisse vous joindre même l'application fermée, activez les notifications ci-dessous.","addr.dialLabel":"Vous avez l'adresse de quelqu'un ?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"L'appeler","addr.badFormat":"Cette adresse est mal écrite. Ce sont 12 caractères, comme DV-K7M2-9QRT-X4WP.","addr.itsYou":"C'est votre propre adresse.","addr.callingTitle":"J'appelle…","addr.callingHint":"Si son application est fermée, je fais sonner son téléphone. Cela peut prendre un instant.","addr.noAnswer":"Pas de réponse. La personne a été prévenue : réessayez plus tard.","addr.dialFailed":"Je n'ai pas pu appeler cette adresse.","addr.noKey":"Cette adresse ne semble plus active. Demandez à la personne de rouvrir l'application et de vous la renvoyer : les adresses ont changé avec la dernière mise à jour.","addr.noBroker":"Je n'ai même pas pu lancer l'appel : le service qui vous met en relation n'a pas répondu. Si vous utilisez une copie de l'application à une autre adresse, ouvrez l'officielle.","addr.incomingTitle":"Quelqu'un vous cherche","addr.incomingSub":"Le nom et le motif ont été écrits par la personne qui appelle : tant que vous n'acceptez pas, rien ne prouve qu'elle soit vraiment celle-là.","addr.incomingToast":"Quelqu'un appelle votre adresse.","addr.accept":"Accepter","addr.ignore":"Ignorer","addr.verified":"Vérifié : la personne qui a répondu possède bien l'adresse {a}. Personne n'a pu s'interposer.","addr.blockedIn":"Appel d'une personne que vous aviez écartée : ignoré.","addr.shareText":"Vous pouvez me joindre ici, sans mon numéro de téléphone. Mon adresse DigitalValut Logos est {a}\n\nTouchez pour m'appeler :",
"addr.incomingAt":"via « {name} »","burn.title":"Adresses jetables","burn.help":"Une par annonce, une par inconnu. Supprimez-la une fois terminé et cette personne ne peut plus vous joindre — elle n'a jamais eu la vraie.","burn.namePh":"Pour quoi ? ex. Canapé d'occasion","burn.add":"Créer","burn.send":"Envoyer cette adresse","burn.delete":"Supprimer","burn.deleted":"« {name} » supprimée. Cette adresse ne répond plus.","burn.made":"« {name} » créée. Vous pouvez la donner.","burn.needName":"Donnez-lui un nom, pour savoir à qui vous l'avez donnée.","burn.full":"Vous pouvez en avoir {n} à la fois. Supprimez-en une pour en créer une autre.","burn.untitled":"Sans nom",
"knock.title":"Vous contactez","knock.nameLabel":"Comment vous appelez-vous ?","knock.namePh":"Votre nom","knock.msgLabel":"Que vous faut-il ? (facultatif)","knock.msgPh":"ex. Avez-vous des chaussures en 42 ?","knock.go":"Appeler","knock.note":"Votre nom et cette phrase ne sont vus que par la personne appelée. Aucun serveur ne peut les lire.",
"letter.title":"Messages laissés pour vous","letter.noneTitle":"Personne ne répond pour le moment.","letter.noneSub":"Je lui ai déjà fait savoir que vous avez essayé de la joindre. Si vous voulez en dire plus, écrivez-le ici.","letter.ph":"Écrivez votre message ici","letter.leave":"Laisser le message","letter.cancel":"Laisser tomber","letter.needText":"Écrivez deux mots, qu'elle sache ce que vous vouliez.","letter.left":"Message laissé. La personne le trouvera en ouvrant l'application.","letter.failed":"Je n'ai pas pu laisser le message. Réessayez.","letter.callBack":"Rappeler","letter.dismiss":"Terminé",
"home.bigStart":"Parler à quelqu'un","home.bigStartD":"Créer une invitation à envoyer","home.bigJoin":"J'ai un code","home.bigJoinD":"On m'a envoyé une invitation","set.lang":"Langue","set.textsize":"Taille du texte","conn.direct":"Liaison directe entre les deux téléphones","conn.directShort":"connectée directement","conn.relay":"Liaison sûre, via un pont chiffré","conn.relayShort":"connectée (pont)","conn.down":"Connexion perdue","conn.downShort":"perdue","conn.working":"Connexion en cours","conn.wobbly":"La liaison a vacillé — je la reprends","conn.wobblyShort":"je reprends","chat.linkLost":"La connexion est tombée. Rien n'est perdu — rouvrez l'application et reconnectez-vous depuis Contacts récents.",
"call.flipFail":"Je n'arrive pas à changer de caméra sur ce téléphone.",
"call.flipBusy":"La caméra est utilisée par une autre application. Fermez-la et réessayez.","call.flipDenied":"Le navigateur a bloqué la caméra pour ce site.","call.flipOnlyOne":"Cet appareil n'a qu'une seule caméra.",
"home.alreadyTalking":"Vous êtes déjà dans une conversation. Pour en commencer une autre, fermez d'abord celle-ci.","home.stillCalling":"J'appelle encore. Attendez la réponse, ou annulez l'appel.","home.busyReconnect":"Vous êtes occupé pour le moment. Terminez ou fermez la connexion en cours avant de réessayer.",
"letter.missed":"Voulait vous parler.",
"sas.blocked":"Dites d'abord les trois mots à voix haute : cette personne n'est plus la même.",
"file.tooBig":"Un fichier entrant a été interrompu : il ne correspondait pas à ce qui était annoncé.","file.sendFailed":"Envoi interrompu : la connexion s'est fermée en cours de route.","file.progress":"{sent} sur {total}",
"share.pending":"{n} fichier(s) prêt(s) à envoyer — ils partent dès que vous êtes connectés",
"health.storage":"Mémoire du téléphone",
"health.storageFull":"Pleine : les conversations ne sont plus enregistrées. Libérez de l'espace sur le téléphone.",
"addr.lifespan":"Cette adresse n'expire pas. Elle reste valable aussi longtemps que les données de l'application restent sur ce téléphone.",
"health.addrLife":"Mots de sécurité",
"health.addrLifeOk":"Stables encore environ {n} jours.",
"health.addrLifeSoon":"Dans environ {n} jours, ils changeront tout seuls. Vos contacts devront les revérifier avec vous : ce n'est pas le signe d'un problème.","health.addrKeyBad":"Ils ne peuvent pas vous joindre : ce téléphone n'a pas réussi à publier la clé sur laquelle repose son adresse. Vérifiez la connexion et rouvrez l'application.",
"health.title":"État de l'application",
"health.sub":"Si quelqu'un n'arrive pas à vous joindre, la raison est ci-dessous.",
"health.recheck":"Vérifier à nouveau",
"health.copy":"Copier le rapport",
"health.copied":"Rapport copié.",
"health.checking":"Vérification…",
"health.busy":"En pause : vous êtes déjà dans une conversation.",
"health.stopped":"Je n'écoute pas. Fermez l'application et rouvrez-la.",
"health.addr":"Qui possède votre adresse",
"health.addrOk":"Peut vous appeler maintenant.",
"health.addrOff":"Votre adresse est désactivée. Activez-la ci-dessus.",
"health.contacts":"Vos contacts",
"health.contactsOk":"Ils peuvent vous retrouver maintenant.",
"health.contactsNone":"Vous n'avez encore aucun contact.",
"health.broker":"Le service qui vous met en relation",
"health.brokerOk":"Répond.",
"health.brokerBad":"Ne répond pas. Les codes longs fonctionnent encore : ils ne passent par aucun serveur.",
"health.brokerOrigin":"Cette copie de l'application est à une adresse que le service ne reconnaît pas : elle ne marchera pas d'ici. Ouvrez l'officielle.",
"health.closed":"Application fermée",
"health.closedOk":"Ils peuvent faire sonner votre téléphone.",
"health.closedOff":"Ils ne vous joignent pas. Activez les notifications ci-dessus.",
"health.closedDenied":"Le navigateur bloque les notifications : application fermée, personne ne vous joint.",
"health.closedIos":"Sur iPhone, il faut d'abord ajouter l'application à l'écran d'accueil.",
"health.mic":"Microphone",
"health.micOk":"Disponible.",
"health.micBad":"Bloqué par le navigateur : vous ne pourrez ni passer ni recevoir d'appels.",
"health.micUnknown":"Je ne peux pas le savoir tant que vous n'essayez pas un appel.",
"health.version":"Version utilisée",
"health.versionOld":"Une partie de l'application est encore l'ancienne. Fermez-la et rouvrez-la.",
"media.stepsAndroidApp":"Retournez à l'écran d'accueil du téléphone|Appuyez longuement sur l'icône <b>DigitalValut Logos</b>|Touchez <b>Infos sur l'appli</b> (ou l'icône ⓘ)|Touchez <b>Autorisations</b>, puis activez <b>Microphone</b> et <b>Caméra</b>|Rouvrez l'application"
});

Object.assign(I18N.de, {
"onboard.text":"<b>DigitalValut Logos</b> — freie Open-Source-Software (Apache 2.0-Lizenz), im Besitz der Associazione di Promozione Sociale DigitalValut, einer eingetragenen italienischen Non-Profit-Organisation (Ente del Terzo Settore). Kostenlos herunterladbar und nutzbar von jedem, überall auf der Welt.",
"install.btn":"Installieren",
"home.title":"Sprich mit jedem, wo immer er ist",
"home.sub":"Nachrichten, Fotos, Video, Anrufe. Keine Anmeldung, keine Telefonnummer, für immer kostenlos.",
"home.nameLabel":"Dein Name","home.namePh":"Dein Name",


"home.legalSummary":"Wie es funktioniert, in drei technischen Zeilen",
"home.legalBody":"Es zeigt deine Netzwerkadresse (IP) demjenigen, mit dem du sprichst; ihr müsst beide gleichzeitig online sein, sonst kommt nichts an, und in stark gefilterten Netzwerken verbinden sich Anrufe möglicherweise nicht; keine Website kann jemals einen Screenshot verhindern.",
"nav.back":"Zurück",
"start.create":"Einladung vorbereiten","start.share":"Einladung senden","btn.copyCode":"Code kopieren",
"start.pastePh":"Antwort hier einfügen…","btn.connect":"In den Chat gehen",
"join.pastePh":"Einladung hier einfügen…","join.generate":"Einladung öffnen",
"join.sendAnswer":"Antwort senden",
"chat.someone":"Jemand","chat.connected":"verbunden","chat.typePh":"Nachricht schreiben…","chat.dropHere":"Hier ablegen, um sie zu senden",
"call.hangup":"Beenden","call.accept":"Annehmen","call.decline":"Ablehnen",
"menu.title":"Werkzeuge","menu.arm":"Selbstzerstörung","menu.disarm":"Abbrechen",
"menu.clearHistory":"Verlauf löschen","menu.endChat":"Chat beenden",
"menu.historyNote":"Der Verlauf bleibt nur auf diesem Gerät, verknüpft mit dem Namen der Person, mit der du sprichst. Kein Server speichert ihn.",
"footer.text":"freie Open-Source-Software (Apache 2.0-Lizenz), ein Projekt von DigitalValut APS ETS.",
"footer.noserver":"Kein Server: Die Verbindung ist direkt zwischen den beiden Browsern über WebRTC.",
"footer.author":"Konzipiert von Dr. Giuseppe Falsone für DigitalValut. © 2026 DigitalValut und das DigitalValut-Team.",
"footer.license":"Open-Source-Lizenz lesen","footer.source":"Quellcode auf GitHub",
"verify.badge":"verifizieren","verify.title":"Sicherheitscode",
"verify.lead":"Vergleiche ihn mit der anderen Person — laut, per Telefon, oder über einen anderen Kanal als den, über den ihr den Einladungscode ausgetauscht habt. Wenn die beiden Codes nicht genau übereinstimmen, hat sich möglicherweise jemand in die Verbindung eingeschaltet: vertraue diesem Chat nicht.",
"verify.close":"Schließen","verify.unavailable":"Noch nicht bereit — versuche es gleich noch einmal.",
"contacts.title":"Letzte Kontakte",
"contacts.note":"Ein Tipp, um sie wiederzusehen: was ihr euch gesagt habt, ist hier geblieben. Jedes Mal braucht es eine neue Einladung, weil kein Server jemanden für dich verbunden hält.",
"toast.sealCopied":"Code kopiert","toast.copyFail":"Kopieren fehlgeschlagen — von Hand auswählen und kopieren","toast.copySelected":"Kopieren fehlgeschlagen — Code für dich ausgewählt, drücke einfach Strg/Cmd+C",
"call.busy":"hat nicht geantwortet — beschäftigt mit einem anderen Anruf.","call.declinedBy":"hat den Anruf abgelehnt.","call.connectFailed":"Der Anruf konnte nicht verbunden werden. Versuche es erneut.",
"call.joined":"ist dem Chat beigetreten.","call.videoInvite":"ruft dich per Video an","call.audioInvite":"ruft dich an",
"call.inVideo":"Videoanruf läuft…","call.inAudio":"Anruf läuft…","call.ringingVideo":"Videoanruf, warte auf Antwort…","call.ringingAudio":"Anruf läuft, warte auf Antwort…",
"call.micFail":"Mikrofon oder Kamera nicht verfügbar, oder Berechtigung verweigert.",
"call.micFailNotFound":"Kein Mikrofon oder Kamera auf diesem Gerät gefunden.",
"call.micFailBusy":"Dein Mikrofon oder deine Kamera wird bereits von einer anderen App verwendet (Zoom, Teams, ein anderer Tab…). Schließe sie und versuche es erneut.",
"call.micFailDenied":"Der Browser hat Mikrofon und Kamera für diese Seite blockiert. Folge den Schritten unten, lade dann die Seite neu.",
"reconnect.trying":"Verbinde erneut mit {n}…",
"reconnect.offline":"{n} scheint gerade nicht online zu sein. Hier ist der Code zum manuellen Versenden.",
"call.noSpeakerFound":"Kein separater Lautsprecher auf diesem Telefon gefunden.",
"call.speakerFail":"Lautsprecher auf diesem Telefon kann nicht gewechselt werden.",
"destruct.countdown":"Selbstzerstörung in ","destruct.done":"Unterhaltung selbstzerstört.",
"session.closed":"geschlossen","session.newHint":"Erstelle eine neue Sitzung, um dich erneut zu verbinden.",
"invite.shareText":"Lust, mit mir auf DigitalValut Logos zu chatten? Öffne diesen Link: falls du die Seite nicht bereit hast, öffnet sie sich von selbst mit meiner Einladung schon ausgefüllt.\n\n",
"invite.answerText":"Hier ist meine Antwort für DigitalValut Logos, füge sie ein, um die Verbindung abzuschließen:\n\n",
"mic.recording":"Aufnahme läuft — zum Stoppen tippen","history.cleared":"Verlauf auf diesem Gerät gelöscht.",
"install.genericText":"<b>Installiere DigitalValut Logos</b>, um es als App mit eigenem Symbol zu haben, ganz ohne Browser.",
"install.iosText":"<b>Installiere DigitalValut Logos auf iPhone oder iPad.</b> Tippe in Safari auf <b>Teilen</b>, dann auf <b>Zum Home-Bildschirm</b>.",
"home.shareApp":"Jemandem von der App erzählen",
"start.s1":"Einladung senden",
"start.s1help":"Drücke den orangen Button. Die App bereitet die Einladung vor und lässt dich wählen, wie du sie sendest: WhatsApp, eine Nachricht, E-Mail — was auch immer du normalerweise benutzt.",
"start.s2":"Ihre Antwort einfügen",
"start.s2help":"Sie schicken dir eine Nachricht zurück. Kopiere sie, komm hierher zurück und drücke <b>Einfügen</b>. Dann geht ihr gemeinsam in den Chat.",
"join.s1":"Einladung öffnen",
"join.s1help":"Wenn du den dir geschickten Link geöffnet hast, ist alles bereit: drücke den orangen Button. Andernfalls drücke <b>Einfügen</b>.",
"join.s2":"Antwort senden",
"join.s2help":"Letzter Schritt: schicke dies an die Person zurück, die dich eingeladen hat, und ihr seid verbunden.",
"btn.paste":"Einfügen","btn.showCode":"Code anzeigen",
"toast.clipboardEmpty":"Es gibt nichts zum Einfügen.","toast.pasteManually":"Halte den Finger auf das Feld und wähle Einfügen.",
"home.shareAppText":"Kostenlos, ohne Konto, funktioniert auf jedem Telefon oder Computer, sendet Fotos und Dateien in Originalqualität — DigitalValut Logos:\n\n",
"lock.title":"Zusätzlicher Schutz",
"lock.sub":"Sperrt die Einladung mit einer Passphrase, die du laut sagst. Sinnvoll, wenn der Code über WhatsApp, E-Mail oder SMS reist.",
"lock.passCap":"Passphrase",
"lock.passHint":"Sag sie laut, oder sende sie über einen anderen Kanal als den Code. Ohne sie öffnet sich der Code nicht.",
"lock.ask":"Diese Einladung ist gesperrt. Gib die Passphrase ein, die dir laut gesagt wurde.",
"lock.askPh":"Passphrase","lock.working":"Einen Moment…",
"lock.needPass":"Gib die Passphrase ein, um diese Einladung zu öffnen.",
"lock.wrongPass":"Falsche Passphrase. Prüfe sie und versuche es erneut.",
"lock.badAnswer":"Ungültige Antwort — oder sie wurde mit einer anderen Passphrase versiegelt.",
"join.badCode":"Dieser Code ist ungültig. Prüfe, ob du ihn vollständig kopiert hast.",
"connect.waiting":"Warte auf die Verbindung…",
"connect.failed":"Verbindung nicht möglich. Stellt sicher, dass ihr beide online seid, und erstellt dann eine neue Einladung — alte Codes können nicht wiederverwendet werden.",
"connect.slow":"Das dauert länger als gewöhnlich — das passiert bei stark gefilterten Netzwerken (Firmen, manche Mobilfunknetze) oder wenn ihr nicht zur gleichen Zeit online seid. Wartet noch etwas, oder erstellt eine neue Einladung.",
"footer.seal":"Fingerabdrücke dieser App (SHA-256):",
"verify.known":"verifiziert","verify.changedShort":"Code geändert","verify.accept":"Neuen Code akzeptieren",
"verify.noteKnown":"Gleicher Code wie letztes Mal: seitdem hat sich niemand dazwischengeschaltet.",
"verify.noteNew":"Erstes Mal mit dieser Person: vergleicht den Code laut, dann merkt die App ihn sich.",
"verify.noteChanged":"Der Code hat sich geändert. Das bedeutet normalerweise ein neues Telefon oder eine neu installierte App — aber genau so sieht auch ein Abhören aus. Vergleicht ihn laut, bevor ihr ihn akzeptiert.",
"quick.titleA":"Dein Code",
"quick.helpA":"Sende ihn mit dem Button unten — ein Tipp und sie sind drin. Oder sag die sechs Ziffern laut. Er funktioniert weiter, solange du auf diesem Bildschirm bleibst.",
"quick.orType":"Oder öffne die App und gib diesen Code ein:","quick.qrHint":"Oder richte eine Handykamera darauf",
"quick.newCode":"Neuen Code erzeugen","quick.useLong":"Lieber den langen Code?",
"quick.titleB":"Code eingeben",
"quick.helpB":"Frag die Person, die dich eingeladen hat, nach dem Code — 6 Ziffern, laut gesagt oder geschrieben — und gib ihn hier ein.",
"quick.codePh":"000000","quick.connect":"Verbinden",
"quick.waiting":"Warte darauf, dass die andere Person den Code eingibt…","quick.expired":"Der Code ist ohne Antwort abgelaufen. Erzeuge einen neuen.",
"quick.notFound":"Code abgelaufen oder falsch. Prüfe ihn mit der Person, die ihn dir gegeben hat.",
"quick.shareText":"Hier ist der Link, um mit mir auf DigitalValut Logos zu sprechen. Tippe ihn an, und wir sind verbunden:",
"quick.share":"Einladung senden",
"notify.title":"Benachrichtige mich, wenn mich jemand sucht",
"notify.sub":"Eine Benachrichtigung, wenn ein Kontakt versucht dich zu erreichen und du die App nicht offen hast — kein Name, keine Nachricht, nur ein Hinweis.",
"notify.iosHint":"Auf dem iPhone funktioniert das nur, wenn du die App zuerst zum Home-Bildschirm hinzugefügt hast: tippe in Safari auf <b>Teilen</b>, dann auf <b>Zum Home-Bildschirm</b>, und öffne die App von dort.",
"notify.blocked":"Benachrichtigungen vom Browser blockiert. Prüfe die Einstellungen der Seite.",
"sas.title":"Sicherheitsprüfung",
"sas.lead":"Sagt euch diese drei Wörter laut. Wenn ihr beide dieselben seht, hat sich niemand dazwischengeschaltet.",
"sas.leadChanged":"Vorsicht: diese Person sieht nicht mehr wie dieselbe wie letztes Mal aus. Das bedeutet normalerweise ein neues Telefon oder eine neu installierte App — aber genau so sieht auch ein Abhören aus. Sagt die drei Wörter laut, bevor ihr weitermacht.",
"sas.yes":"Ja, sie stimmen überein","sas.no":"Nein, sie sind unterschiedlich",
"sas.note":"Nur beim ersten Mal mit dieser Person nötig: danach merkt die App es sich.",
"sas.confirmed":"Kontakt verifiziert.",
"sas.refused":"Die Wörter stimmten nicht überein: dieses Gespräch gilt nicht als sicher. Schließe es und beginne erneut mit einem neuen Code.",
"connect.bigTitle":"Verbindung wird hergestellt…","connect.bigHint":"Schließe die App nicht — es dauert nur ein paar Sekunden.",
"autoclean.title":"Automatische Bereinigung","autoclean.sub":"Löscht von selbst Unterhaltungen, die älter als eine festgelegte Anzahl Tage sind, damit sie nicht weiter Speicherplatz auf deinem Telefon belegen. Standardmäßig aus: Ohne dass du das hier einschaltest, wird nie von selbst etwas gelöscht.","autoclean.after":"Unterhaltungen löschen, die älter sind als:","autoclean.d7":"7 Tage","autoclean.d30":"30 Tage","autoclean.d90":"90 Tage","autoclean.d365":"1 Jahr",
"wake.waitsNote":"Du kannst die App schließen: Ich sage dir Bescheid, wenn die Einladung geöffnet wird.","wake.calling":"Ich benachrichtige {name}…","wake.callingHint":"Das Telefon hat gebrummt. Sobald die App geöffnet wird, seid ihr verbunden — du kannst hier warten.","wake.noAnswer":"Die Person wurde benachrichtigt, hat die App aber noch nicht geöffnet. Versuch es später noch einmal.",
"quick.helpAWaits":"Schick ihn mit der Schaltfläche unten — die andere Person tippt einfach darauf und ist drin. Oder sag ihr die sechs Ziffern laut vor.",
"verify.inPerson":"persönlich bestätigt","verify.inPersonDone":"Persönlich bestätigt: Du hast den Code vom Bildschirm dieser Person selbst gescannt, also kann sich niemand dazwischengeschoben haben. Die drei Wörter braucht ihr nicht.","sas.leadMismatch":"Achtung: Wer geantwortet hat, ist nicht das Telefon, dessen Code du gescannt hast. Das kann ein Versehen sein — es ist aber auch genau das, was man sähe, wenn sich jemand dazwischengeschoben hätte. Schreib nichts, bevor ihr euch die drei Wörter laut vorgelesen habt.",
"easy.title":"Einfacher Modus","easy.sub":"Nur zwei große Schaltflächen und sonst nichts. Für alle, die über nichts nachdenken möchten — oder für die Person, die das Telefon für sie einrichtet.","easy.voiceTitle":"Laut vorlesen","easy.voiceSub":"Die App sagt dir in deiner Sprache, was zu tun ist. Für alle, denen das Lesen am Bildschirm schwerfällt.","easy.voiceOn":"In Ordnung. Ab jetzt sage ich dir laut, was zu tun ist.","easy.sayHome":"Tippe auf die erste Schaltfläche, um einen Chat zu beginnen. Auf die zweite, wenn dir jemand eine Einladung geschickt hat.","easy.sayStart":"Das ist dein Code. Drück die orange Schaltfläche, um ihn zu verschicken.","easy.sayJoin":"Tippe die sechs Ziffern ein, die man dir gegeben hat.","easy.sayChat":"Ihr seid verbunden. Jetzt könnt ihr reden.",
"broker.down":"Der Dienst, über den ihr euch findet, antwortet nicht. Der lange Code unten funktioniert trotzdem: Er läuft über gar keinen Server.",
"flash.title":"Verbunden","flash.titleWith":"Verbunden mit {name}","flash.direct":"Eine direkte Verbindung zwischen euren beiden Telefonen","flash.relay":"Verbunden über eine verschlüsselte Brücke — euer Netz ließ keine direkte zu","flash.noserver":"Kein Server kann mitlesen, was ihr euch schreibt","flash.time":"In {s} Sekunden, ganz ohne Anmeldung",
"viral.title":"Es hat funktioniert.","viral.sub":"Wenn es nützlich war, gib es weiter: kostenlos, ohne Konto, und es behält nichts über niemanden.","viral.btn":"Jemandem davon erzählen",
"media.title":"Mikrofon und Kamera","media.warnDenied":"Dieser Browser blockiert das Mikrofon: Du kannst weder anrufen noch Anrufe annehmen.","media.warnFix":"So geht's","media.retry":"Erneut versuchen","media.close":"Schließen","media.nowOk":"Mikrofon ist an. Du kannst jetzt anrufen.","media.peerNoMic":"{name} hat abgenommen, aber der Browser lässt das Mikrofon nicht zu. Die Person hat dich nicht abgewiesen.","media.peerNoCam":"{name} hat abgenommen, aber der Browser lässt Kamera und Mikrofon nicht zu. Versucht es mit einem reinen Audioanruf, oder bittet sie, die Sperre aufzuheben.","media.stepsIos":"Öffne <b>Einstellungen</b> auf dem iPhone|Scrolle nach unten und tippe auf <b>Safari</b>|Tippe auf <b>Mikrofon</b> und dann <b>Kamera</b>: stelle auf <b>Fragen</b> oder <b>Erlauben</b>|Komm hierher zurück und lade die Seite neu","media.stepsAndroid":"Tippe oben auf das <b>Schloss</b> neben der Adresse|Tippe auf <b>Berechtigungen</b>|Schalte <b>Mikrofon</b> und <b>Kamera</b> ein|Lade die Seite neu","media.stepsChrome":"Klicke auf das <b>Schloss</b> links neben der Adresse|Schalte <b>Mikrofon</b> und <b>Kamera</b> ein|Lade die Seite neu","media.stepsSafariMac":"Öffne in der Menüleiste <b>Safari</b> › <b>Einstellungen für diese Website</b>|Stelle <b>Mikrofon</b> und <b>Kamera</b> auf <b>Erlauben</b>|Lade die Seite neu","media.stepsFirefox":"Klicke auf das <b>Schloss</b> links neben der Adresse|Entferne die Sperre neben <b>Mikrofon verwenden</b> und <b>Kamera verwenden</b>|Lade die Seite neu","media.stepsOther":"Öffne die Browsereinstellungen für diese Seite|Erlaube <b>Mikrofon</b> und <b>Kamera</b>|Lade die Seite neu",
"addr.title":"Deine dauerhafte Adresse","addr.sub":"Gib sie statt einer Telefonnummer weiter. Wer sie hat, erreicht dich jederzeit, ohne deinen Namen oder deine Nummer zu kennen. Standardmäßig aus.","addr.qrHint":"Wer ihn scannt, ruft dich direkt an","addr.share":"Adresse senden","addr.showQr":"QR anzeigen","addr.reachNote":"Damit man dich auch bei geschlossener App erreicht, schalte unten die Hinweise ein.","addr.dialLabel":"Hast du die Adresse von jemandem?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Anrufen","addr.badFormat":"Diese Adresse ist falsch geschrieben. Es sind 12 Zeichen, etwa DV-K7M2-9QRT-X4WP.","addr.itsYou":"Das ist deine eigene Adresse.","addr.callingTitle":"Ich rufe an…","addr.callingHint":"Ist die App dort geschlossen, lasse ich das Telefon klingeln. Das kann einen Moment dauern.","addr.noAnswer":"Keine Antwort. Die Person wurde benachrichtigt — versuch es später.","addr.dialFailed":"Ich konnte diese Adresse nicht anrufen.","addr.noKey":"Diese Adresse scheint nicht mehr aktiv zu sein. Bitte die Person, die App neu zu öffnen und sie dir noch einmal zu schicken: die Adressen haben sich mit dem letzten Update geändert.","addr.noBroker":"Ich konnte den Anruf nicht einmal starten: der Dienst, der euch zusammenbringt, hat nicht geantwortet. Wenn du eine Kopie der App unter einer anderen Adresse benutzt, öffne die offizielle.","addr.incomingTitle":"Jemand sucht dich","addr.incomingSub":"Name und Grund hat die anrufende Person selbst geschrieben: bis du annimmst, kann niemand beweisen, dass sie das wirklich ist.","addr.incomingToast":"Jemand ruft deine Adresse an.","addr.accept":"Annehmen","addr.ignore":"Ignorieren","addr.verified":"Bestätigt: wer geantwortet hat, besitzt die Adresse {a} wirklich. Niemand kann sich dazwischengeschoben haben.","addr.blockedIn":"Anruf von jemandem, den du abgewiesen hattest: ignoriert.","addr.shareText":"Hier erreichst du mich, ganz ohne meine Telefonnummer. Meine DigitalValut-Logos-Adresse ist {a}\n\nZum Anrufen tippen:",
"addr.incomingAt":"über „{name}“","burn.title":"Wegwerf-Adressen","burn.help":"Eine pro Anzeige, eine pro Fremdem. Löschst du sie, kommt diese Person nicht mehr an dich heran — deine echte hatte sie nie.","burn.namePh":"Wofür? z. B. Gebrauchtes Sofa","burn.add":"Anlegen","burn.send":"Diese Adresse senden","burn.delete":"Löschen","burn.deleted":"„{name}“ gelöscht. Diese Adresse antwortet nicht mehr.","burn.made":"„{name}“ angelegt. Du kannst sie jetzt weitergeben.","burn.needName":"Gib ihr einen Namen, damit du weißt, wem du sie gegeben hast.","burn.full":"Du kannst {n} gleichzeitig haben. Lösche eine, um eine neue anzulegen.","burn.untitled":"Ohne Namen",
"knock.title":"Du kontaktierst","knock.nameLabel":"Wie heißt du?","knock.namePh":"Dein Name","knock.msgLabel":"Was brauchst du? (optional)","knock.msgPh":"z. B. Habt ihr Schuhe in Größe 42?","knock.go":"Anrufen","knock.note":"Deinen Namen und diesen Satz sieht nur die angerufene Person. Kein Server kann sie lesen.",
"letter.title":"Nachrichten für dich","letter.noneTitle":"Gerade antwortet niemand.","letter.noneSub":"Ich habe ihr schon mitgeteilt, dass du sie erreichen wolltest. Wenn du mehr sagen willst, schreib es hier.","letter.ph":"Schreib deine Nachricht hier","letter.leave":"Nachricht hinterlassen","letter.cancel":"Doch nicht","letter.needText":"Schreib zwei Zeilen, damit sie weiß, worum es ging.","letter.left":"Nachricht hinterlassen. Sie wird sie beim Öffnen der App finden.","letter.failed":"Ich konnte die Nachricht nicht hinterlassen. Versuch es nochmal.","letter.callBack":"Zurückrufen","letter.dismiss":"Erledigt",
"home.bigStart":"Mit jemandem sprechen","home.bigStartD":"Eine Einladung erstellen","home.bigJoin":"Ich habe einen Code","home.bigJoinD":"Mir wurde eine Einladung geschickt","set.lang":"Sprache","set.textsize":"Textgröße","conn.direct":"Direkte Verbindung zwischen den beiden Telefonen","conn.directShort":"direkt verbunden","conn.relay":"Sichere Verbindung über eine verschlüsselte Brücke","conn.relayShort":"verbunden (Brücke)","conn.down":"Verbindung verloren","conn.downShort":"verloren","conn.working":"Verbindung wird aufgebaut","conn.wobbly":"Die Verbindung hat gewackelt — ich hole sie zurück","conn.wobblyShort":"verbinde neu","chat.linkLost":"Die Verbindung ist abgebrochen. Nichts ist verloren — öffne die App neu und verbinde dich über Letzte Kontakte.",
"call.flipFail":"Ich kann auf diesem Telefon nicht zur anderen Kamera wechseln.",
"call.flipBusy":"Die Kamera wird von einer anderen App benutzt. Schließe sie und versuch es nochmal.","call.flipDenied":"Der Browser hat die Kamera für diese Seite blockiert.","call.flipOnlyOne":"Dieses Gerät hat nur eine Kamera.",
"home.alreadyTalking":"Du bist schon in einem Gespräch. Um ein neues zu beginnen, beende zuerst dieses.","home.stillCalling":"Ich rufe noch an. Warte auf die Antwort oder brich den Anruf ab.","home.busyReconnect":"Du bist gerade beschäftigt. Beende oder schließe die aktuelle Verbindung, bevor du es erneut versuchst.",
"letter.missed":"Wollte mit dir sprechen.",
"sas.blocked":"Sagt euch zuerst die drei Wörter laut: diese Person ist nicht mehr dieselbe.",
"file.tooBig":"Eine eingehende Datei wurde gestoppt: sie stimmte nicht mit dem Angekündigten überein.","file.sendFailed":"Senden unterbrochen: die Verbindung wurde mittendrin geschlossen.","file.progress":"{sent} von {total}",
"share.pending":"{n} Datei(en) bereit zum Senden — sie gehen raus, sobald ihr verbunden seid",
"health.storage":"Speicher des Telefons",
"health.storageFull":"Voll: Unterhaltungen werden nicht mehr gespeichert. Schaff Platz auf dem Telefon.",
"addr.lifespan":"Diese Adresse läuft nicht ab. Sie bleibt gültig, solange die Daten der App auf diesem Telefon bleiben.",
"health.addrLife":"Sicherheitswörter",
"health.addrLifeOk":"Noch etwa {n} Tage stabil.",
"health.addrLifeSoon":"In etwa {n} Tagen ändern sie sich von selbst. Deine Kontakte werden sie erneut mit dir vergleichen müssen — das ist kein Zeichen für ein Problem.","health.addrKeyBad":"Sie können dich nicht erreichen: dieses Telefon konnte den Schlüssel nicht veröffentlichen, auf dem seine Adresse beruht. Prüfe die Verbindung und öffne die App neu.",
"health.title":"Wie es der App geht",
"health.sub":"Wenn dich jemand nicht erreicht, steht der Grund hier unten.",
"health.recheck":"Erneut prüfen",
"health.copy":"Bericht kopieren",
"health.copied":"Bericht kopiert.",
"health.checking":"Ich prüfe…",
"health.busy":"Pausiert: du bist schon in einem Gespräch.",
"health.stopped":"Ich höre nicht zu. Schließe die App und öffne sie neu.",
"health.addr":"Wer deine Adresse hat",
"health.addrOk":"Kann dich jetzt anrufen.",
"health.addrOff":"Deine Adresse ist aus. Schalte sie oben ein.",
"health.contacts":"Deine Kontakte",
"health.contactsOk":"Sie können dich jetzt wiederfinden.",
"health.contactsNone":"Du hast noch keine Kontakte.",
"health.broker":"Der Dienst, der euch zusammenbringt",
"health.brokerOk":"Antwortet.",
"health.brokerBad":"Antwortet nicht. Die langen Codes gehen weiter: sie laufen über keinen Server.",
"health.brokerOrigin":"Diese Kopie der App liegt auf einer Adresse, die der Dienst nicht kennt: von hier aus geht es nicht. Öffne die offizielle.",
"health.closed":"Bei geschlossener App",
"health.closedOk":"Sie können dein Telefon klingeln lassen.",
"health.closedOff":"Sie erreichen dich nicht. Schalte oben die Hinweise ein.",
"health.closedDenied":"Der Browser blockiert Hinweise: bei geschlossener App erreicht dich niemand.",
"health.closedIos":"Auf dem iPhone musst du die App zuerst zum Home-Bildschirm hinzufügen.",
"health.mic":"Mikrofon",
"health.micOk":"Verfügbar.",
"health.micBad":"Vom Browser blockiert: du kannst weder anrufen noch Anrufe annehmen.",
"health.micUnknown":"Das weiß ich erst, wenn du einen Anruf versuchst.",
"health.version":"Verwendete Version",
"health.versionOld":"Ein Teil der App ist noch der alte. Schließe sie und öffne sie neu.",
"media.stepsAndroidApp":"Geh zurück zum Startbildschirm deines Telefons|Halte das Symbol von <b>DigitalValut Logos</b> gedrückt|Tippe auf <b>App-Info</b> (oder das Symbol ⓘ)|Tippe auf <b>Berechtigungen</b> und schalte dann <b>Mikrofon</b> und <b>Kamera</b> ein|Öffne die App erneut"
});

Object.assign(I18N.es, {
"onboard.text":"<b>DigitalValut Logos</b> — software libre y de código abierto (licencia Apache 2.0), propiedad de la Associazione di Promozione Sociale DigitalValut, una organización sin fines de lucro italiana registrada (Ente del Terzo Settore). Descargable y utilizable gratis por cualquiera, en cualquier parte del mundo.",
"install.btn":"Instalar",
"home.title":"Habla con quien quieras, esté donde esté",
"home.sub":"Mensajes, fotos, vídeo, llamadas. Sin registro, sin número de teléfono, gratis para siempre.",
"home.nameLabel":"Tu nombre","home.namePh":"Tu nombre",


"home.legalSummary":"Cómo funciona, en tres líneas técnicas",
"home.legalBody":"Revela tu dirección de red (IP) a quien hables; hace falta que ambos estéis en línea a la vez, si no, no llega nada, y en redes muy filtradas las llamadas pueden no conectarse; ninguna web puede impedir jamás una captura de pantalla.",
"nav.back":"Atrás",
"start.create":"Preparar la invitación","start.share":"Enviar la invitación","btn.copyCode":"Copiar el código",
"start.pastePh":"Pega aquí la respuesta…","btn.connect":"Entrar en el chat",
"join.pastePh":"Pega aquí la invitación…","join.generate":"Abrir la invitación",
"join.sendAnswer":"Enviar la respuesta",
"chat.someone":"Alguien","chat.connected":"conectado","chat.typePh":"Escribe un mensaje…","chat.dropHere":"Suéltalos aquí para enviarlos",
"call.hangup":"Terminar","call.accept":"Responder","call.decline":"Rechazar",
"menu.title":"Herramientas","menu.arm":"Autodestrucción","menu.disarm":"Cancelar",
"menu.clearHistory":"Borrar historial","menu.endChat":"Terminar chat",
"menu.historyNote":"El historial queda solo en este dispositivo, vinculado al nombre de la persona con quien hablas. Ningún servidor lo guarda.",
"footer.text":"software libre y de código abierto (licencia Apache 2.0), un proyecto de DigitalValut APS ETS.",
"footer.noserver":"Sin servidor: la conexión es directa entre los dos navegadores mediante WebRTC.",
"footer.author":"Concebido por el Dr. Giuseppe Falsone para DigitalValut. © 2026 DigitalValut y el equipo DigitalValut.",
"footer.license":"Leer la licencia de código abierto","footer.source":"Código fuente en GitHub",
"verify.badge":"verificar","verify.title":"Código de seguridad",
"verify.lead":"Compáralo con la otra persona — en voz alta, por teléfono, o en un canal distinto al que usasteis para intercambiar el código de invitación. Si los dos códigos no coinciden exactamente, alguien podría haberse insertado en la conexión: no confíes en ese chat.",
"verify.close":"Cerrar","verify.unavailable":"Aún no está listo — inténtalo de nuevo en un momento.",
"contacts.title":"Contactos recientes",
"contacts.note":"Un toque para volver a verlos: lo que os dijisteis se quedó aquí. Cada vez hace falta una invitación nueva, porque ningún servidor mantiene a nadie conectado por vosotros.",
"toast.sealCopied":"Código copiado","toast.copyFail":"Copia fallida — selecciona y copia a mano","toast.copySelected":"Copia fallida — código seleccionado para ti, solo pulsa Ctrl/Cmd+C",
"call.busy":"no respondió — ocupado en otra llamada.","call.declinedBy":"rechazó la llamada.","call.connectFailed":"La llamada no se conectó. Inténtalo de nuevo.",
"call.joined":"se unió al chat.","call.videoInvite":"te está haciendo una videollamada","call.audioInvite":"te está llamando",
"call.inVideo":"Videollamada en curso…","call.inAudio":"Llamada en curso…","call.ringingVideo":"Videollamada, esperando respuesta…","call.ringingAudio":"Llamando, esperando respuesta…",
"call.micFail":"Micrófono o cámara no disponibles, o permiso denegado.",
"call.micFailNotFound":"No se encontró micrófono ni cámara en este dispositivo.",
"call.micFailBusy":"Tu micrófono o cámara ya están siendo usados por otra aplicación (Zoom, Teams, otra pestaña…). Ciérrala e inténtalo de nuevo.",
"call.micFailDenied":"El navegador ha bloqueado el micrófono y la cámara para este sitio. Sigue los pasos de abajo y luego recarga la página.",
"reconnect.trying":"Intentando reconectar con {n}…",
"reconnect.offline":"{n} no parece estar en línea ahora mismo. Aquí tienes el código para enviarlo a mano.",
"call.noSpeakerFound":"No se encuentra un altavoz independiente en este teléfono.",
"call.speakerFail":"No se puede cambiar el altavoz en este teléfono.",
"destruct.countdown":"se autodestruye en ","destruct.done":"Conversación autodestruida.",
"session.closed":"cerrada","session.newHint":"Crea una nueva sesión para reconectarte.",
"invite.shareText":"¿Te apetece chatear conmigo en DigitalValut Logos? Abre este enlace: si no tienes la página lista, se abre sola con mi invitación ya rellenada.\n\n",
"invite.answerText":"Aquí está mi respuesta para DigitalValut Logos, pégala para terminar de conectar:\n\n",
"mic.recording":"Grabando — toca para detener","history.cleared":"Historial borrado en este dispositivo.",
"install.genericText":"<b>Instala DigitalValut Logos</b> para tenerla como app, con su propio icono, sin necesidad de navegador.",
"install.iosText":"<b>Instala DigitalValut Logos en iPhone o iPad.</b> Toca <b>Compartir</b> en Safari, luego <b>Añadir a inicio</b>.",
"home.shareApp":"Contarle a alguien sobre la app",
"start.s1":"Envía la invitación",
"start.s1help":"Pulsa el botón naranja. La app prepara la invitación y te deja elegir cómo enviarla: WhatsApp, un mensaje, correo — lo que uses normalmente.",
"start.s2":"Pega su respuesta",
"start.s2help":"Te devolverán un mensaje. Cópialo, vuelve aquí y pulsa <b>Pegar</b>. Luego entráis juntos en el chat.",
"join.s1":"Abre la invitación",
"join.s1help":"Si abriste el enlace que te enviaron, todo está listo: pulsa el botón naranja. Si no, pulsa <b>Pegar</b>.",
"join.s2":"Envía la respuesta",
"join.s2help":"Último paso: envía esto de vuelta a quien te invitó, y estaréis conectados.",
"btn.paste":"Pegar","btn.showCode":"Mostrar el código",
"toast.clipboardEmpty":"No hay nada que pegar.","toast.pasteManually":"Mantén el dedo sobre el recuadro y elige Pegar.",
"home.shareAppText":"Gratis, sin cuenta, funciona en cualquier teléfono u ordenador, envía fotos y archivos en calidad original — DigitalValut Logos:\n\n",
"lock.title":"Protección extra",
"lock.sub":"Bloquea la invitación con una frase secreta que dices en voz alta. Útil si el código viaja por WhatsApp, correo o SMS.",
"lock.passCap":"Frase secreta",
"lock.passHint":"Dila en voz alta, o envíala por un canal distinto al del código. Sin ella, el código no se abre.",
"lock.ask":"Esta invitación está bloqueada. Escribe la frase secreta que te dijeron en voz alta.",
"lock.askPh":"frase secreta","lock.working":"Un momento…",
"lock.needPass":"Escribe la frase secreta para abrir esta invitación.",
"lock.wrongPass":"Frase secreta incorrecta. Compruébala e inténtalo de nuevo.",
"lock.badAnswer":"Respuesta no válida — o fue sellada con una frase secreta distinta.",
"join.badCode":"Este código no es válido. Comprueba que lo copiaste entero.",
"connect.waiting":"Esperando la conexión…",
"connect.failed":"No se pudo conectar. Aseguraos de estar ambos en línea, luego cread una invitación nueva — los códigos antiguos no se pueden reutilizar.",
"connect.slow":"Esto está tardando más de lo habitual — pasa en redes muy filtradas (empresas, algunas redes móviles) o si no estáis en línea al mismo tiempo. Esperad un poco más, o cread una invitación nueva.",
"footer.seal":"Huellas de esta app (SHA-256):",
"verify.known":"verificado","verify.changedShort":"código cambiado","verify.accept":"Aceptar el nuevo código",
"verify.noteKnown":"Mismo código que la última vez: nadie se ha interpuesto desde entonces.",
"verify.noteNew":"Primera vez con esta persona: comparad el código en voz alta, luego la app lo recuerda.",
"verify.noteChanged":"El código ha cambiado. Normalmente significa un teléfono nuevo o la app reinstalada — pero también es lo que parece una interceptación. Comparadlo en voz alta antes de aceptarlo.",
"quick.titleA":"Tu código",
"quick.helpA":"Envíalo con el botón de abajo — un toque y ya está. O di los seis dígitos en voz alta. Sigue funcionando mientras te quedes en esta pantalla.",
"quick.orType":"O abre la app y escribe este código:","quick.qrHint":"O apunta la cámara de un teléfono aquí",
"quick.newCode":"Generar un código nuevo","quick.useLong":"¿Prefieres el código largo?",
"quick.titleB":"Escribe el código",
"quick.helpB":"Pide el código a quien te invitó — 6 dígitos, dichos en voz alta o escritos — y escríbelo aquí.",
"quick.codePh":"000000","quick.connect":"Conectar",
"quick.waiting":"Esperando a que la otra persona escriba el código…","quick.expired":"El código expiró sin respuesta. Genera uno nuevo.",
"quick.notFound":"Código expirado o incorrecto. Compruébalo con quien te lo dio.",
"quick.shareText":"Aquí tienes el enlace para hablar conmigo en DigitalValut Logos. Tócalo y estaremos conectados:",
"quick.share":"Enviar la invitación",
"notify.title":"Avísame cuando alguien me busque",
"notify.sub":"Una notificación si un contacto intenta contactarte y no tienes la app abierta — sin nombre, sin mensaje, solo un aviso.",
"notify.iosHint":"En iPhone esto solo funciona si primero añadiste la app a tu pantalla de inicio: toca <b>Compartir</b> en Safari, luego <b>Añadir a inicio</b>, y abre la app desde ahí.",
"notify.blocked":"Notificaciones bloqueadas por el navegador. Comprueba los ajustes del sitio.",
"sas.title":"Comprobación de seguridad",
"sas.lead":"Decíos estas tres palabras en voz alta. Si ambos veis las mismas, nadie se ha interpuesto.",
"sas.leadChanged":"Cuidado: esta persona ya no parece la misma que la última vez. Normalmente significa un teléfono nuevo o la app reinstalada — pero también es lo que parece una interceptación. Decid las tres palabras en voz alta antes de continuar.",
"sas.yes":"Sí, coinciden","sas.no":"No, son diferentes",
"sas.note":"Solo hace falta la primera vez con esta persona: después, la app lo recuerda.",
"sas.confirmed":"Contacto verificado.",
"sas.refused":"Las palabras no coincidían: esta conversación no se considera segura. Ciérrala y empezad de nuevo con un código nuevo.",
"connect.bigTitle":"Conectando…","connect.bigHint":"No cierres la app — solo tarda unos segundos.",
"autoclean.title":"Limpieza automática","autoclean.sub":"Borra por sí sola las conversaciones más antiguas que un número determinado de días, para que no sigan ocupando espacio en tu teléfono. Desactivado por defecto: nada se borra solo a menos que actives esto.","autoclean.after":"Borrar conversaciones más antiguas que:","autoclean.d7":"7 días","autoclean.d30":"30 días","autoclean.d90":"90 días","autoclean.d365":"1 año",
"wake.waitsNote":"Puedes cerrar la aplicación: te aviso cuando abran la invitación.","wake.calling":"Estoy avisando a {name}…","wake.callingHint":"Su teléfono ha sonado. En cuanto abra la aplicación estaréis conectados — puedes esperar aquí.","wake.noAnswer":"Le he avisado pero aún no ha abierto la aplicación. Inténtalo más tarde.",
"quick.helpAWaits":"Envíalo con el botón de abajo — a la otra persona le basta con tocarlo y ya está dentro. O dile las seis cifras en voz alta.",
"verify.inPerson":"verificado en persona","verify.inPersonDone":"Verificado en persona: has escaneado el código en la pantalla de esta persona, así que nadie ha podido meterse en medio. No hace falta deciros las tres palabras.","sas.leadMismatch":"Atención: quien ha respondido no es el teléfono cuyo código escaneaste. Puede ser un error, pero también es exactamente lo que se vería si alguien se hubiera metido en medio. No escribas nada hasta que os hayáis dicho las tres palabras en voz alta.",
"easy.title":"Modo sencillo","easy.sub":"Solo dos botones grandes y nada más alrededor. Para quien prefiere no pensar en nada — o para quien le prepara el teléfono a otra persona.","easy.voiceTitle":"Dilo en voz alta","easy.voiceSub":"La aplicación te dice en voz alta qué hacer, en tu idioma. Para quien le cuesta leer la pantalla.","easy.voiceOn":"De acuerdo. A partir de ahora te digo en voz alta qué hacer.","easy.sayHome":"Toca el primer botón para empezar una conversación. Toca el segundo si te han mandado una invitación.","easy.sayStart":"Este es tu código. Pulsa el botón naranja para mandárselo a quien quieras.","easy.sayJoin":"Escribe las seis cifras que te han dado.","easy.sayChat":"Estáis conectados. Ya podéis hablar.",
"broker.down":"El servicio que os ayuda a encontraros no responde. El código largo de abajo funciona igualmente: no pasa por ningún servidor.",
"flash.title":"Conectados","flash.titleWith":"Conectados con {name}","flash.direct":"Un enlace directo entre vuestros dos teléfonos","flash.relay":"Enlazados por un puente cifrado — vuestra red no permitía el directo","flash.noserver":"Ningún servidor puede leer lo que os decís","flash.time":"En {s} segundos, sin registrarse en nada",
"viral.title":"Ha funcionado.","viral.sub":"Si te ha servido, pásalo: es gratis, no pide cuenta y no guarda nada de nadie.","viral.btn":"Contárselo a alguien",
"media.title":"Micrófono y cámara","media.warnDenied":"Este navegador está bloqueando el micrófono: no podrás hacer ni recibir llamadas.","media.warnFix":"Cómo arreglarlo","media.retry":"Reintentar","media.close":"Cerrar","media.nowOk":"Micrófono activado. Ya puedes llamar.","media.peerNoMic":"{name} ha contestado, pero su navegador no le deja activar el micrófono. No es que te haya rechazado.","media.peerNoCam":"{name} ha contestado, pero su navegador no le deja activar la cámara y el micrófono. Probad con una llamada solo de audio, o pedidle que los desbloquee.","media.stepsIos":"Abre <b>Ajustes</b> en el iPhone|Baja y toca <b>Safari</b>|Toca <b>Micrófono</b> y luego <b>Cámara</b>: ponlos en <b>Preguntar</b> o <b>Permitir</b>|Vuelve aquí y recarga la página","media.stepsAndroid":"Toca el <b>candado</b> junto a la dirección, arriba|Toca <b>Permisos</b>|Activa <b>Micrófono</b> y <b>Cámara</b>|Recarga la página","media.stepsChrome":"Haz clic en el <b>candado</b> a la izquierda de la dirección|Activa <b>Micrófono</b> y <b>Cámara</b>|Recarga la página","media.stepsSafariMac":"En la barra de menús abre <b>Safari</b> › <b>Ajustes para esta web</b>|Pon <b>Micrófono</b> y <b>Cámara</b> en <b>Permitir</b>|Recarga la página","media.stepsFirefox":"Haz clic en el <b>candado</b> a la izquierda de la dirección|Quita el bloqueo junto a <b>Usar el micrófono</b> y <b>Usar la cámara</b>|Recarga la página","media.stepsOther":"Abre los ajustes del navegador para este sitio|Permite <b>Micrófono</b> y <b>Cámara</b>|Recarga la página",
"addr.title":"Tu dirección permanente","addr.sub":"Dala en lugar del número de teléfono. Quien la tenga puede buscarte cuando quiera, sin saber tu nombre ni tu número. Desactivada por defecto.","addr.qrHint":"Quien lo escanea te llama directamente","addr.share":"Enviar tu dirección","addr.showQr":"Mostrar el QR","addr.reachNote":"Para que puedan localizarte también con la aplicación cerrada, activa los avisos aquí abajo.","addr.dialLabel":"¿Tienes la dirección de alguien?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Llamarla","addr.badFormat":"Esa dirección está mal escrita. Son 12 caracteres, como DV-K7M2-9QRT-X4WP.","addr.itsYou":"Esa es tu propia dirección.","addr.callingTitle":"Llamando…","addr.callingHint":"Si tiene la aplicación cerrada, le hago sonar el teléfono. Puede tardar un momento.","addr.noAnswer":"No ha contestado. Ya se le ha avisado: inténtalo más tarde.","addr.dialFailed":"No he podido llamar a esa dirección.","addr.noKey":"Esa dirección ya no parece activa. Pídele a la persona que vuelva a abrir la aplicación y te la envíe otra vez: las direcciones han cambiado con la última actualización.","addr.noBroker":"No he podido ni iniciar la llamada: el servicio que os pone en contacto no ha respondido. Si estás usando una copia de la aplicación en otra dirección, abre la oficial.","addr.incomingTitle":"Alguien te está buscando","addr.incomingSub":"El nombre y el motivo los ha escrito quien llama: hasta que no aceptes, nadie puede demostrar que sea esa persona de verdad.","addr.incomingToast":"Alguien está llamando a tu dirección.","addr.accept":"Aceptar","addr.ignore":"Ignorar","addr.verified":"Verificado: quien ha respondido posee de verdad la dirección {a}. Nadie ha podido meterse en medio.","addr.blockedIn":"Llamada de alguien a quien habías rechazado: ignorada.","addr.shareText":"Puedes buscarme aquí, sin mi número de teléfono. Mi dirección en DigitalValut Logos es {a}\n\nToca para llamarme:",
"addr.incomingAt":"a través de «{name}»","burn.title":"Direcciones de usar y tirar","burn.help":"Una por anuncio, una por desconocido. Cuando termines la borras y esa persona ya no puede localizarte — nunca tuvo la de verdad.","burn.namePh":"¿Para qué? p. ej. Sofá de segunda mano","burn.add":"Crear","burn.send":"Enviar esta dirección","burn.delete":"Borrar","burn.deleted":"«{name}» borrada. Esa dirección ya no responde.","burn.made":"«{name}» creada. Ya puedes darla.","burn.needName":"Ponle un nombre, así sabes a quién se la diste.","burn.full":"Puedes tener {n} a la vez. Borra una para crear otra.","burn.untitled":"Sin nombre",
"knock.title":"Estás contactando con","knock.nameLabel":"¿Cómo te llamas?","knock.namePh":"Tu nombre","knock.msgLabel":"¿Qué necesitas? (opcional)","knock.msgPh":"p. ej. ¿Tenéis zapatos del 42?","knock.go":"Llamar","knock.note":"Tu nombre y esta frase solo los ve la persona a la que llamas. Ningún servidor puede leerlos.",
"letter.title":"Mensajes que te han dejado","letter.noneTitle":"Ahora mismo no contesta nadie.","letter.noneSub":"Ya le he avisado de que has intentado localizarla. Si quieres decirle algo más, escríbelo aquí.","letter.ph":"Escribe aquí tu mensaje","letter.leave":"Dejar el mensaje","letter.cancel":"Déjalo","letter.needText":"Escribe dos palabras, así sabrá qué querías.","letter.left":"Mensaje dejado. Lo encontrará al abrir la aplicación.","letter.failed":"No he podido dejar el mensaje. Inténtalo otra vez.","letter.callBack":"Devolver la llamada","letter.dismiss":"Hecho",
"home.bigStart":"Hablar con alguien","home.bigStartD":"Crea una invitación para enviar","home.bigJoin":"Tengo un código","home.bigJoinD":"Me han enviado una invitación","set.lang":"Idioma","set.textsize":"Tamaño del texto","conn.direct":"Enlace directo entre los dos teléfonos","conn.directShort":"conectada directamente","conn.relay":"Enlace seguro, por un puente cifrado","conn.relayShort":"conectada (puente)","conn.down":"Conexión perdida","conn.downShort":"perdida","conn.working":"Conectando","conn.wobbly":"La conexión ha vacilado — la estoy recuperando","conn.wobblyShort":"recuperando","chat.linkLost":"La conexión se ha caído. No se ha perdido nada — vuelve a abrir la aplicación y reconéctate desde Contactos recientes.",
"call.flipFail":"No puedo cambiar de cámara en este teléfono.",
"call.flipBusy":"La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.","call.flipDenied":"El navegador ha bloqueado la cámara para este sitio.","call.flipOnlyOne":"Este dispositivo solo tiene una cámara.",
"home.alreadyTalking":"Ya estás en una conversación. Para empezar otra, cierra antes esta.","home.stillCalling":"Todavía estoy llamando. Espera la respuesta o cancela la llamada.","home.busyReconnect":"Estás ocupado ahora mismo. Termina o cierra la conexión actual antes de volver a intentarlo.",
"letter.missed":"Quería hablar contigo.",
"sas.blocked":"Decíos antes las tres palabras en voz alta: esta persona ya no es la misma.",
"file.tooBig":"Se ha detenido un archivo entrante: no coincidía con lo declarado.","file.sendFailed":"Envío interrumpido: la conexión se cerró a mitad de camino.","file.progress":"{sent} de {total}",
"share.pending":"{n} archivo(s) listos para enviar — se envían en cuanto os conectéis",
"health.storage":"Memoria del teléfono",
"health.storageFull":"Llena: las conversaciones ya no se guardan. Libera espacio en el teléfono.",
"addr.lifespan":"Esta dirección no caduca. Sigue siendo válida mientras los datos de la aplicación permanezcan en este teléfono.",
"health.addrLife":"Palabras de seguridad",
"health.addrLifeOk":"Estables durante unos {n} días más.",
"health.addrLifeSoon":"En unos {n} días cambiarán solas. A tus contactos se les pedirá que las vuelvan a comprobar contigo: no es señal de que algo vaya mal.","health.addrKeyBad":"No pueden localizarte: este teléfono no ha conseguido publicar la clave sobre la que se construye su dirección. Comprueba la conexión y vuelve a abrir la aplicación.",
"health.title":"Cómo está la aplicación",
"health.sub":"Si alguien no consigue localizarte, aquí abajo está el motivo.",
"health.recheck":"Comprobar de nuevo",
"health.copy":"Copiar el informe",
"health.copied":"Informe copiado.",
"health.checking":"Comprobando…",
"health.busy":"En pausa: ya estás en una conversación.",
"health.stopped":"No estoy escuchando. Cierra la aplicación y vuelve a abrirla.",
"health.addr":"Quien tenga tu dirección",
"health.addrOk":"Puede llamarte ahora mismo.",
"health.addrOff":"Tu dirección está apagada. Actívala aquí arriba.",
"health.contacts":"Tus contactos",
"health.contactsOk":"Pueden volver a encontrarte ahora.",
"health.contactsNone":"Todavía no tienes ningún contacto.",
"health.broker":"El servicio que os pone en contacto",
"health.brokerOk":"Responde.",
"health.brokerBad":"No responde. Quedan los códigos largos, que no pasan por ningún servidor.",
"health.brokerOrigin":"Esta copia de la aplicación está en una dirección que el servicio no reconoce: desde aquí no funcionará. Abre la oficial.",
"health.closed":"Con la aplicación cerrada",
"health.closedOk":"Pueden hacer sonar tu teléfono.",
"health.closedOff":"No te localizan. Activa los avisos aquí arriba.",
"health.closedDenied":"El navegador bloquea los avisos: con la aplicación cerrada no te localiza nadie.",
"health.closedIos":"En iPhone hay que añadir antes la aplicación a la pantalla de inicio.",
"health.mic":"Micrófono",
"health.micOk":"Disponible.",
"health.micBad":"Bloqueado por el navegador: no podrás hacer ni recibir llamadas.",
"health.micUnknown":"No puedo saberlo hasta que pruebes una llamada.",
"health.version":"Versión en uso",
"health.versionOld":"Una parte de la aplicación sigue siendo la antigua. Ciérrala y vuelve a abrirla.",
"media.stepsAndroidApp":"Vuelve a la pantalla de inicio del teléfono|Mantén pulsado el icono de <b>DigitalValut Logos</b>|Toca <b>Información de la app</b> (o el icono ⓘ)|Toca <b>Permisos</b> y activa <b>Micrófono</b> y <b>Cámara</b>|Vuelve a abrir la app"
});

Object.assign(I18N.pt, {
"onboard.text":"<b>DigitalValut Logos</b> — software livre e de código aberto (licença Apache 2.0), propriedade da Associazione di Promozione Sociale DigitalValut, uma organização sem fins lucrativos italiana registada (Ente del Terzo Settore). Pode ser descarregado e utilizado gratuitamente por qualquer pessoa, em qualquer lugar do mundo.",
"install.btn":"Instalar",
"home.title":"Fale com quem quiser, onde quer que esteja",
"home.sub":"Mensagens, fotos, vídeo, chamadas. Sem registo, sem número de telefone, grátis para sempre.",
"home.nameLabel":"O seu nome","home.namePh":"O seu nome",


"home.legalSummary":"Como funciona, em três linhas técnicas",
"home.legalBody":"Revela o seu endereço de rede (IP) a quem fala consigo; é preciso que ambos estejam online ao mesmo tempo, senão nada chega, e em redes muito filtradas as chamadas podem não ligar; nenhum site pode impedir uma captura de ecrã, nunca.",
"nav.back":"Voltar",
"start.create":"Preparar o convite","start.share":"Enviar o convite","btn.copyCode":"Copiar o código",
"start.pastePh":"Cole aqui a resposta…","btn.connect":"Entrar na conversa",
"join.pastePh":"Cole aqui o convite…","join.generate":"Abrir o convite",
"join.sendAnswer":"Enviar a resposta",
"chat.someone":"Alguém","chat.connected":"ligado","chat.typePh":"Escreva uma mensagem…","chat.dropHere":"Largue-os aqui para enviar",
"call.hangup":"Terminar","call.accept":"Atender","call.decline":"Recusar",
"menu.title":"Ferramentas","menu.arm":"Autodestruição","menu.disarm":"Cancelar",
"menu.clearHistory":"Limpar histórico","menu.endChat":"Terminar conversa",
"menu.historyNote":"O histórico fica apenas neste dispositivo, ligado ao nome da pessoa com quem fala. Nenhum servidor o guarda.",
"footer.text":"software livre e de código aberto (licença Apache 2.0), um projeto da DigitalValut APS ETS.",
"footer.noserver":"Sem servidor: a ligação é direta entre os dois navegadores via WebRTC.",
"footer.author":"Concebido pelo Dr. Giuseppe Falsone para a DigitalValut. © 2026 DigitalValut e a Equipa DigitalValut.",
"footer.license":"Ler a licença de código aberto","footer.source":"Código-fonte no GitHub",
"verify.badge":"verificar","verify.title":"Código de segurança",
"verify.lead":"Compare-o com a outra pessoa — em voz alta, por telefone, ou num canal diferente daquele que usaram para trocar o código de convite. Se os dois códigos não corresponderem exatamente, alguém pode ter-se inserido na ligação: não confie nessa conversa.",
"verify.close":"Fechar","verify.unavailable":"Ainda não está pronto — tente novamente daqui a pouco.",
"contacts.title":"Contactos recentes",
"contacts.note":"Um toque para os rever: o que disseram um ao outro ficou aqui. Cada vez é preciso um convite novo, porque nenhum servidor mantém ninguém ligado por si.",
"toast.sealCopied":"Código copiado","toast.copyFail":"Falha ao copiar — selecione e copie manualmente","toast.copySelected":"Falha ao copiar — código selecionado para si, basta premir Ctrl/Cmd+C",
"call.busy":"não atendeu — ocupado noutra chamada.","call.declinedBy":"recusou a chamada.","call.connectFailed":"A chamada não ligou. Tente novamente.",
"call.joined":"entrou na conversa.","call.videoInvite":"está a fazer-lhe uma videochamada","call.audioInvite":"está a ligar-lhe",
"call.inVideo":"Videochamada em curso…","call.inAudio":"Chamada em curso…","call.ringingVideo":"Videochamada, a aguardar resposta…","call.ringingAudio":"A chamar, a aguardar resposta…",
"call.micFail":"Microfone ou câmara indisponíveis, ou permissão negada.",
"call.micFailNotFound":"Nenhum microfone ou câmara encontrados neste dispositivo.",
"call.micFailBusy":"O seu microfone ou câmara já estão a ser usados por outra aplicação (Zoom, Teams, outro separador…). Feche-a e tente novamente.",
"call.micFailDenied":"O navegador bloqueou o microfone e a câmara para este site. Siga os passos abaixo e depois recarregue a página.",
"reconnect.trying":"A tentar reconectar a {n}…",
"reconnect.offline":"{n} não parece estar online neste momento. Aqui está o código para enviar manualmente.",
"call.noSpeakerFound":"Não foi encontrado um altifalante separado neste telemóvel.",
"call.speakerFail":"Não é possível mudar o altifalante neste telemóvel.",
"destruct.countdown":"autodestrói-se em ","destruct.done":"Conversa autodestruída.",
"session.closed":"fechada","session.newHint":"Crie uma nova sessão para se reconectar.",
"invite.shareText":"Apetece-lhe conversar comigo no DigitalValut Logos? Abra este link: se não tiver a página pronta, ela abre-se sozinha com o meu convite já preenchido.\n\n",
"invite.answerText":"Aqui está a minha resposta para o DigitalValut Logos, cole-a para terminar de ligar:\n\n",
"mic.recording":"A gravar — toque para parar","history.cleared":"Histórico apagado neste dispositivo.",
"install.genericText":"<b>Instale o DigitalValut Logos</b> para o ter como aplicação, com o seu próprio ícone, sem precisar do navegador.",
"install.iosText":"<b>Instale o DigitalValut Logos no iPhone ou iPad.</b> Toque em <b>Partilhar</b> no Safari, depois em <b>Adicionar ao ecrã principal</b>.",
"home.shareApp":"Dar a conhecer a app a alguém",
"start.s1":"Envie o convite",
"start.s1help":"Prima o botão laranja. A app prepara o convite e deixa-o escolher como enviá-lo: WhatsApp, uma mensagem, e-mail — o que costuma usar.",
"start.s2":"Cole a resposta deles",
"start.s2help":"Eles enviam-lhe uma mensagem de volta. Copie-a, volte aqui e prima <b>Colar</b>. Depois entram juntos na conversa.",
"join.s1":"Abra o convite",
"join.s1help":"Se abriu o link que lhe enviaram, está tudo pronto: prima o botão laranja. Caso contrário, prima <b>Colar</b>.",
"join.s2":"Envie a resposta",
"join.s2help":"Último passo: envie isto de volta para quem o convidou, e ficam ligados.",
"btn.paste":"Colar","btn.showCode":"Mostrar o código",
"toast.clipboardEmpty":"Não há nada para colar.","toast.pasteManually":"Mantenha o dedo na caixa e escolha Colar.",
"home.shareAppText":"Grátis, sem conta, funciona em qualquer telemóvel ou computador, envia fotos e ficheiros na qualidade original — DigitalValut Logos:\n\n",
"lock.title":"Proteção extra",
"lock.sub":"Bloqueia o convite com uma frase-passe que diz em voz alta. Vale a pena ativar se o código passar por WhatsApp, e-mail ou SMS.",
"lock.passCap":"Frase-passe",
"lock.passHint":"Diga-a em voz alta, ou envie-a por um canal diferente do código. Sem ela, o código não abre.",
"lock.ask":"Este convite está bloqueado. Escreva a frase-passe que lhe disseram em voz alta.",
"lock.askPh":"frase-passe","lock.working":"Um momento…",
"lock.needPass":"Escreva a frase-passe para abrir este convite.",
"lock.wrongPass":"Frase-passe incorreta. Verifique-a e tente novamente.",
"lock.badAnswer":"Resposta inválida — ou foi selada com uma frase-passe diferente.",
"join.badCode":"Este código não é válido. Verifique se o copiou todo.",
"connect.waiting":"A aguardar a ligação…",
"connect.failed":"Não foi possível ligar. Certifiquem-se de que ambos estão online, depois criem um convite novo — códigos antigos não podem ser reutilizados.",
"connect.slow":"Isto está a demorar mais do que o habitual — acontece em redes muito filtradas (empresas, algumas redes móveis) ou se não estiverem online ao mesmo tempo. Esperem mais um pouco, ou criem um convite novo.",
"footer.seal":"Impressões digitais desta app (SHA-256):",
"verify.known":"verificado","verify.changedShort":"código alterado","verify.accept":"Aceitar o novo código",
"verify.noteKnown":"Mesmo código da última vez: ninguém se interpôs desde então.",
"verify.noteNew":"Primeira vez com esta pessoa: comparem o código em voz alta, depois a app lembra-se dele.",
"verify.noteChanged":"O código mudou. Normalmente significa um telemóvel novo ou a app reinstalada — mas também é o que parece uma interceção. Comparem-no em voz alta antes de aceitar.",
"quick.titleA":"O seu código",
"quick.helpA":"Envie-o com o botão abaixo — um toque e está feito. Ou diga os seis dígitos em voz alta. Continua a funcionar enquanto ficar neste ecrã.",
"quick.orType":"Ou abra a app e escreva este código:","quick.qrHint":"Ou aponte a câmara de um telemóvel aqui",
"quick.newCode":"Gerar um código novo","quick.useLong":"Prefere o código longo?",
"quick.titleB":"Escreva o código",
"quick.helpB":"Peça o código a quem o convidou — 6 dígitos, ditos em voz alta ou escritos — e escreva-o aqui.",
"quick.codePh":"000000","quick.connect":"Ligar",
"quick.waiting":"A aguardar que a outra pessoa escreva o código…","quick.expired":"O código expirou sem resposta. Gere um novo.",
"quick.notFound":"Código expirado ou errado. Verifique-o com quem lho deu.",
"quick.shareText":"Aqui está o link para falar comigo no DigitalValut Logos. Toque nele e ficamos ligados:",
"quick.share":"Enviar o convite",
"notify.title":"Avise-me quando alguém me procurar",
"notify.sub":"Uma notificação se um contacto tentar chegar até si e não tiver a app aberta — sem nome, sem mensagem, apenas um aviso.",
"notify.iosHint":"No iPhone isto só funciona se primeiro adicionar a app ao seu ecrã principal: toque em <b>Partilhar</b> no Safari, depois em <b>Adicionar ao ecrã principal</b>, e abra a app a partir daí.",
"notify.blocked":"Notificações bloqueadas pelo navegador. Verifique as definições do site.",
"sas.title":"Verificação de segurança",
"sas.lead":"Digam estas três palavras um ao outro em voz alta. Se ambos virem as mesmas, ninguém se interpôs.",
"sas.leadChanged":"Cuidado: esta pessoa já não parece a mesma da última vez. Normalmente significa um telemóvel novo ou a app reinstalada — mas também é o que parece uma interceção. Digam as três palavras em voz alta antes de continuar.",
"sas.yes":"Sim, correspondem","sas.no":"Não, são diferentes",
"sas.note":"Só é necessário na primeira vez com esta pessoa: depois, a app lembra-se.",
"sas.confirmed":"Contacto verificado.",
"sas.refused":"As palavras não coincidiram: esta conversa não é considerada segura. Feche-a e recomecem com um código novo.",
"connect.bigTitle":"A ligar…","connect.bigHint":"Não feche a app — demora apenas alguns segundos.",
"autoclean.title":"Limpeza automática","autoclean.sub":"Apaga sozinha as conversas mais antigas do que um certo número de dias, para não continuarem a ocupar espaço no seu telemóvel. Desativado por predefinição: nada é apagado sozinho a menos que ative isto.","autoclean.after":"Apagar conversas mais antigas do que:","autoclean.d7":"7 dias","autoclean.d30":"30 dias","autoclean.d90":"90 dias","autoclean.d365":"1 ano",
"wake.waitsNote":"Pode fechar a aplicação: eu aviso-o quando abrirem o convite.","wake.calling":"A avisar {name}…","wake.callingHint":"O telemóvel tocou. Assim que abrir a aplicação ficam ligados — pode esperar aqui.","wake.noAnswer":"Já foi avisada mas ainda não abriu a aplicação. Tente mais tarde.",
"quick.helpAWaits":"Envie-o com o botão abaixo — a outra pessoa só tem de tocar nele e está ligada. Ou diga-lhe os seis algarismos em voz alta.",
"verify.inPerson":"verificado presencialmente","verify.inPersonDone":"Verificado presencialmente: leu o código no ecrã desta pessoa, portanto ninguém se pode ter metido pelo meio. Não é preciso dizerem as três palavras.","sas.leadMismatch":"Atenção: quem respondeu não é o telemóvel cujo código leu. Pode ser um engano, mas é também exatamente o que se veria se alguém se tivesse metido pelo meio. Não escreva nada enquanto não disserem as três palavras em voz alta.",
"easy.title":"Modo simples","easy.sub":"Apenas dois botões grandes e mais nada à volta. Para quem prefere não pensar em nada — ou para quem prepara o telemóvel a outra pessoa.","easy.voiceTitle":"Diz em voz alta","easy.voiceSub":"A aplicação diz em voz alta o que fazer, na sua língua. Para quem tem dificuldade em ler o ecrã.","easy.voiceOn":"Muito bem. A partir de agora digo-lhe em voz alta o que fazer.","easy.sayHome":"Toque no primeiro botão para começar uma conversa. Toque no segundo se lhe enviaram um convite.","easy.sayStart":"Este é o seu código. Carregue no botão laranja para o enviar a quem quiser.","easy.sayJoin":"Escreva os seis algarismos que lhe deram.","easy.sayChat":"Estão ligados. Já podem falar.",
"broker.down":"O serviço que vos ajuda a encontrarem-se não responde. O código longo abaixo funciona na mesma: não passa por servidor nenhum.",
"flash.title":"Ligados","flash.titleWith":"Ligados com {name}","flash.direct":"Uma ligação direta entre os vossos dois telemóveis","flash.relay":"Ligados através de uma ponte cifrada — a vossa rede não permitia a ligação direta","flash.noserver":"Nenhum servidor consegue ler o que dizem um ao outro","flash.time":"Em {s} segundos, sem se registar em nada",
"viral.title":"Funcionou.","viral.sub":"Se foi útil, passe adiante: é grátis, não pede conta e não guarda nada de ninguém.","viral.btn":"Contar a alguém",
"media.title":"Microfone e câmara","media.warnDenied":"Este navegador está a bloquear o microfone: não vai conseguir fazer nem receber chamadas.","media.warnFix":"Como resolver","media.retry":"Tentar de novo","media.close":"Fechar","media.nowOk":"Microfone ativo. Já pode ligar.","media.peerNoMic":"{name} atendeu, mas o navegador está a bloquear o microfone: não é uma recusa.","media.peerNoCam":"{name} atendeu, mas o navegador está a bloquear a câmara e o microfone: não é uma recusa. Tentem uma chamada só de áudio.","media.stepsIos":"Abra <b>Definições</b> no iPhone|Desça e toque em <b>Safari</b>|Toque em <b>Microfone</b> e depois <b>Câmara</b>: ponha <b>Perguntar</b> ou <b>Permitir</b>|Volte aqui e recarregue a página","media.stepsAndroid":"Toque no <b>cadeado</b> ao lado do endereço, em cima|Toque em <b>Permissões</b>|Ative <b>Microfone</b> e <b>Câmara</b>|Recarregue a página","media.stepsChrome":"Clique no <b>cadeado</b> à esquerda do endereço|Ative <b>Microfone</b> e <b>Câmara</b>|Recarregue a página","media.stepsSafariMac":"Na barra de menus abra <b>Safari</b> › <b>Definições para este site</b>|Ponha <b>Microfone</b> e <b>Câmara</b> em <b>Permitir</b>|Recarregue a página","media.stepsFirefox":"Clique no <b>cadeado</b> à esquerda do endereço|Retire o bloqueio ao lado de <b>Usar o microfone</b> e <b>Usar a câmara</b>|Recarregue a página","media.stepsOther":"Abra as definições do navegador para este site|Permita <b>Microfone</b> e <b>Câmara</b>|Recarregue a página",
"addr.title":"O seu endereço permanente","addr.sub":"Dê este em vez do número de telefone. Quem o tiver pode procurá-lo quando quiser, sem saber o seu nome nem o seu número. Desativado por predefinição.","addr.qrHint":"Quem o ler chama-o diretamente","addr.share":"Enviar o seu endereço","addr.showQr":"Mostrar o QR","addr.reachNote":"Para que o possam alcançar mesmo com a aplicação fechada, ative os avisos aqui em baixo.","addr.dialLabel":"Tem o endereço de alguém?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Ligar","addr.badFormat":"Esse endereço está mal escrito. São 12 caracteres, como DV-K7M2-9QRT-X4WP.","addr.itsYou":"Esse é o seu próprio endereço.","addr.callingTitle":"A ligar…","addr.callingHint":"Se tiver a aplicação fechada, faço tocar o telemóvel. Pode demorar um instante.","addr.noAnswer":"Não atendeu. Já foi avisada: tente mais tarde.","addr.dialFailed":"Não consegui ligar para esse endereço.","addr.noKey":"Esse endereço já não parece ativo. Peça à pessoa para reabrir a aplicação e enviá-lo de novo: os endereços mudaram com a última atualização.","addr.noBroker":"Não consegui sequer iniciar a chamada: o serviço que vos põe em contacto não respondeu. Se está a usar uma cópia da aplicação noutro endereço, abra a oficial.","addr.incomingTitle":"Alguém está à sua procura","addr.incomingSub":"O nome e o motivo foram escritos por quem liga: enquanto não aceitar, ninguém pode provar que é mesmo essa pessoa.","addr.incomingToast":"Alguém está a ligar para o seu endereço.","addr.accept":"Aceitar","addr.ignore":"Ignorar","addr.verified":"Verificado: quem respondeu possui mesmo o endereço {a}. Ninguém se pode ter metido pelo meio.","addr.blockedIn":"Chamada de alguém que tinha recusado: ignorada.","addr.shareText":"Pode encontrar-me aqui, sem o meu número de telefone. O meu endereço no DigitalValut Logos é {a}\n\nToque para me ligar:",
"addr.incomingAt":"através de «{name}»","burn.title":"Endereços descartáveis","burn.help":"Um por anúncio, um por desconhecido. Quando acabar, apaga-o e essa pessoa deixa de o encontrar — nunca teve o verdadeiro.","burn.namePh":"Para quê? ex. Sofá usado","burn.add":"Criar","burn.send":"Enviar este endereço","burn.delete":"Apagar","burn.deleted":"«{name}» apagado. Esse endereço já não responde.","burn.made":"«{name}» criado. Já o pode dar.","burn.needName":"Dê-lhe um nome, para saber a quem o deu.","burn.full":"Pode ter {n} ao mesmo tempo. Apague um para criar outro.","burn.untitled":"Sem nome",
"knock.title":"Está a contactar","knock.nameLabel":"Como se chama?","knock.namePh":"O seu nome","knock.msgLabel":"Do que precisa? (opcional)","knock.msgPh":"ex. Têm sapatos do 42?","knock.go":"Ligar","knock.note":"O seu nome e esta frase só são vistos pela pessoa a quem liga. Nenhum servidor os consegue ler.",
"letter.title":"Mensagens deixadas para si","letter.noneTitle":"Ninguém está a responder agora.","letter.noneSub":"Já lhe avisei de que tentou contactá-la. Se quiser dizer mais alguma coisa, escreva aqui.","letter.ph":"Escreva aqui a sua mensagem","letter.leave":"Deixar a mensagem","letter.cancel":"Deixe estar","letter.needText":"Escreva duas palavras, para saber o que queria.","letter.left":"Mensagem deixada. Vai encontrá-la ao abrir a aplicação.","letter.failed":"Não consegui deixar a mensagem. Tente de novo.","letter.callBack":"Ligar de volta","letter.dismiss":"Feito",
"home.bigStart":"Falar com alguém","home.bigStartD":"Criar um convite para enviar","home.bigJoin":"Tenho um código","home.bigJoinD":"Enviaram-me um convite","set.lang":"Idioma","set.textsize":"Tamanho do texto","conn.direct":"Ligação direta entre os dois telemóveis","conn.directShort":"ligada diretamente","conn.relay":"Ligação segura, por uma ponte cifrada","conn.relayShort":"ligada (ponte)","conn.down":"Ligação perdida","conn.downShort":"perdida","conn.working":"A ligar","conn.wobbly":"A ligação vacilou — estou a retomá-la","conn.wobblyShort":"a retomar","chat.linkLost":"A ligação caiu. Não se perdeu nada — reabra a aplicação e volte a ligar-se a partir de Contactos recentes.",
"call.flipFail":"Não consigo mudar de câmara neste telemóvel.",
"call.flipBusy":"A câmara está a ser usada por outra aplicação. Feche-a e tente de novo.","call.flipDenied":"O navegador bloqueou a câmara para este site.","call.flipOnlyOne":"Este dispositivo só tem uma câmara.",
"home.alreadyTalking":"Já está numa conversa. Para começar outra, feche primeiro esta.","home.stillCalling":"Ainda estou a ligar. Espere pela resposta, ou cancele a chamada.","home.busyReconnect":"Está ocupado neste momento. Termine ou feche a ligação atual antes de tentar novamente.",
"letter.missed":"Queria falar consigo.",
"sas.blocked":"Digam primeiro as três palavras em voz alta: esta pessoa já não é a mesma.",
"file.tooBig":"Um ficheiro recebido foi interrompido: não correspondia ao que foi declarado.","file.sendFailed":"Envio interrompido: a ligação fechou a meio.","file.progress":"{sent} de {total}",
"share.pending":"{n} ficheiro(s) prontos para enviar — partem assim que se ligarem",
"health.storage":"Memória do telemóvel",
"health.storageFull":"Cheia: as conversas já não são guardadas. Liberte espaço no telemóvel.",
"addr.lifespan":"Este endereço não expira. Mantém-se válido enquanto os dados da aplicação permanecerem neste telemóvel.",
"health.addrLife":"Palavras de segurança",
"health.addrLifeOk":"Estáveis por cerca de mais {n} dias.",
"health.addrLifeSoon":"Dentro de cerca de {n} dias mudam sozinhas. Aos seus contactos será pedido que as verifiquem de novo consigo — não é sinal de que algo esteja errado.","health.addrKeyBad":"Não o conseguem alcançar: este telemóvel não conseguiu publicar a chave em que o seu endereço se baseia. Verifique a ligação e reabra a aplicação.",
"health.title":"Como está a aplicação",
"health.sub":"Se alguém não consegue alcançá-lo, o motivo está aqui em baixo.",
"health.recheck":"Verificar de novo",
"health.copy":"Copiar o relatório",
"health.copied":"Relatório copiado.",
"health.checking":"A verificar…",
"health.busy":"Em pausa: já está numa conversa.",
"health.stopped":"Não estou à escuta. Feche a aplicação e volte a abri-la.",
"health.addr":"Quem tem o seu endereço",
"health.addrOk":"Pode ligar-lhe agora mesmo.",
"health.addrOff":"O seu endereço está desligado. Ligue-o aqui em cima.",
"health.contacts":"Os seus contactos",
"health.contactsOk":"Podem reencontrá-lo agora.",
"health.contactsNone":"Ainda não tem nenhum contacto.",
"health.broker":"O serviço que vos põe em contacto",
"health.brokerOk":"Responde.",
"health.brokerBad":"Não responde. Restam os códigos longos, que não passam por nenhum servidor.",
"health.brokerOrigin":"Esta cópia da aplicação está num endereço que o serviço não reconhece: daqui não vai funcionar. Abra a oficial.",
"health.closed":"Com a aplicação fechada",
"health.closedOk":"Podem fazer o seu telemóvel tocar.",
"health.closedOff":"Não o alcançam. Ative os avisos aqui em cima.",
"health.closedDenied":"O navegador bloqueia os avisos: com a aplicação fechada, ninguém o alcança.",
"health.closedIos":"No iPhone é preciso primeiro adicionar a aplicação ao ecrã principal.",
"health.mic":"Microfone",
"health.micOk":"Disponível.",
"health.micBad":"Bloqueado pelo navegador: não poderá fazer nem receber chamadas.",
"health.micUnknown":"Não posso saber até que tente uma chamada.",
"health.version":"Versão em uso",
"health.versionOld":"Uma parte da aplicação ainda é a antiga. Feche-a e volte a abri-la.",
"media.stepsAndroidApp":"Volte ao ecrã principal do telemóvel|Mantenha premido o ícone do <b>DigitalValut Logos</b>|Toque em <b>Informações da app</b> (ou no ícone ⓘ)|Toque em <b>Autorizações</b> e ative <b>Microfone</b> e <b>Câmara</b>|Reabra a aplicação"
});

Object.assign(I18N.ru, {
"onboard.text":"<b>DigitalValut Logos</b> — бесплатное программное обеспечение с открытым исходным кодом (лицензия Apache 2.0), принадлежит Associazione di Promozione Sociale DigitalValut, зарегистрированной итальянской некоммерческой организации (Ente del Terzo Settore). Доступно для скачивания и бесплатного использования кем угодно и где угодно в мире.",
"install.btn":"Установить",
"home.title":"Говорите с кем хотите, где бы они ни были",
"home.sub":"Сообщения, фото, видео, звонки. Без регистрации, без номера телефона, бесплатно навсегда.",
"home.nameLabel":"Ваше имя","home.namePh":"Ваше имя",


"home.legalSummary":"Как это работает, в трёх технических строках",
"home.legalBody":"Это раскрывает ваш сетевой адрес (IP) собеседнику; нужно, чтобы вы оба были онлайн одновременно, иначе ничего не дойдёт, а в сильно фильтруемых сетях звонки могут не соединиться; ни один сайт никогда не может предотвратить скриншот.",
"nav.back":"Назад",
"start.create":"Подготовить приглашение","start.share":"Отправить приглашение","btn.copyCode":"Скопировать код",
"start.pastePh":"Вставьте ответ сюда…","btn.connect":"Войти в чат",
"join.pastePh":"Вставьте приглашение сюда…","join.generate":"Открыть приглашение",
"join.sendAnswer":"Отправить ответ",
"chat.someone":"Кто-то","chat.connected":"на связи","chat.typePh":"Напишите сообщение…","chat.dropHere":"Перетащите сюда, чтобы отправить",
"call.hangup":"Завершить","call.accept":"Ответить","call.decline":"Отклонить",
"menu.title":"Инструменты","menu.arm":"Самоуничтожение","menu.disarm":"Отмена",
"menu.clearHistory":"Очистить историю","menu.endChat":"Завершить чат",
"menu.historyNote":"История остаётся только на этом устройстве, привязана к имени собеседника. Ни один сервер её не хранит.",
"footer.text":"бесплатное программное обеспечение с открытым исходным кодом (лицензия Apache 2.0), проект DigitalValut APS ETS.",
"footer.noserver":"Без сервера: соединение напрямую между двумя браузерами через WebRTC.",
"footer.author":"Разработано доктором Джузеппе Фальсоне для DigitalValut. © 2026 DigitalValut и команда DigitalValut.",
"footer.license":"Прочитать лицензию с открытым исходным кодом","footer.source":"Исходный код на GitHub",
"verify.badge":"проверить","verify.title":"Код безопасности",
"verify.lead":"Сравните его с собеседником — вслух, по телефону, или по каналу, отличному от того, которым вы обменялись кодом приглашения. Если два кода не совпадают точно, возможно, кто-то вклинился в соединение: не доверяйте этому чату.",
"verify.close":"Закрыть","verify.unavailable":"Ещё не готово — попробуйте снова через мгновение.",
"contacts.title":"Недавние контакты",
"contacts.note":"Одно касание, чтобы увидеть их снова: то, что вы сказали друг другу, осталось здесь. Каждый раз нужно новое приглашение, потому что ни один сервер не держит никого на связи за вас.",
"toast.sealCopied":"Код скопирован","toast.copyFail":"Не удалось скопировать — выделите и скопируйте вручную","toast.copySelected":"Не удалось скопировать — код выделен за вас, просто нажмите Ctrl/Cmd+C",
"call.busy":"не ответил(а) — занят(а) другим звонком.","call.declinedBy":"отклонил(а) звонок.","call.connectFailed":"Звонок не удалось установить. Попробуйте снова.",
"call.joined":"присоединился(лась) к чату.","call.videoInvite":"видеозвонит вам","call.audioInvite":"звонит вам",
"call.inVideo":"Идёт видеозвонок…","call.inAudio":"Идёт звонок…","call.ringingVideo":"Видеозвонок, ожидание ответа…","call.ringingAudio":"Звонок, ожидание ответа…",
"call.micFail":"Микрофон или камера недоступны, либо доступ запрещён.",
"call.micFailNotFound":"На этом устройстве не найден микрофон или камера.",
"call.micFailBusy":"Ваш микрофон или камера уже используются другим приложением (Zoom, Teams, другая вкладка…). Закройте его и попробуйте снова.",
"call.micFailDenied":"Браузер заблокировал микрофон и камеру для этого сайта. Выполните шаги ниже, затем перезагрузите страницу.",
"reconnect.trying":"Пытаемся снова соединиться с {n}…",
"reconnect.offline":"{n}, похоже, сейчас не в сети. Вот код, чтобы отправить вручную.",
"call.noSpeakerFound":"Не удаётся найти отдельный динамик на этом телефоне.",
"call.speakerFail":"Не удаётся переключить динамик на этом телефоне.",
"destruct.countdown":"самоуничтожится через ","destruct.done":"Разговор самоуничтожен.",
"session.closed":"закрыт","session.newHint":"Создайте новую сессию, чтобы переподключиться.",
"invite.shareText":"Хочешь пообщаться со мной в DigitalValut Logos? Открой эту ссылку: если у тебя ещё не готова страница, она откроется сама с моим приглашением, уже заполненным.\n\n",
"invite.answerText":"Вот мой ответ для DigitalValut Logos, вставь его, чтобы завершить соединение:\n\n",
"mic.recording":"Идёт запись — нажмите, чтобы остановить","history.cleared":"История удалена на этом устройстве.",
"install.genericText":"<b>Установите DigitalValut Logos</b>, чтобы иметь его как приложение, со своей иконкой, без браузера.",
"install.iosText":"<b>Установите DigitalValut Logos на iPhone или iPad.</b> Нажмите <b>Поделиться</b> в Safari, затем <b>На экран «Домой»</b>.",
"home.shareApp":"Рассказать кому-то о приложении",
"start.s1":"Отправьте приглашение",
"start.s1help":"Нажмите оранжевую кнопку. Приложение подготовит приглашение и даст выбрать, как его отправить: WhatsApp, сообщение, почта — что вы обычно используете.",
"start.s2":"Вставьте их ответ",
"start.s2help":"Вам пришлют сообщение в ответ. Скопируйте его, вернитесь сюда и нажмите <b>Вставить</b>. Затем вы вместе войдёте в чат.",
"join.s1":"Откройте приглашение",
"join.s1help":"Если вы открыли присланную вам ссылку, всё уже готово: нажмите оранжевую кнопку. Иначе нажмите <b>Вставить</b>.",
"join.s2":"Отправьте ответ",
"join.s2help":"Последний шаг: отправьте это обратно тому, кто вас пригласил, и вы будете на связи.",
"btn.paste":"Вставить","btn.showCode":"Показать код",
"toast.clipboardEmpty":"Нечего вставить.","toast.pasteManually":"Удерживайте палец на поле и выберите Вставить.",
"home.shareAppText":"Бесплатно, без аккаунта, работает на любом телефоне или компьютере, отправляет фото и файлы в исходном качестве — DigitalValut Logos:\n\n",
"lock.title":"Дополнительная защита",
"lock.sub":"Блокирует приглашение кодовой фразой, которую вы произносите вслух. Стоит включить, если код проходит через WhatsApp, почту или SMS.",
"lock.passCap":"Кодовая фраза",
"lock.passHint":"Произнесите её вслух или отправьте по каналу, отличному от кода. Без неё код не откроется.",
"lock.ask":"Это приглашение заблокировано. Введите кодовую фразу, которую вам сказали вслух.",
"lock.askPh":"кодовая фраза","lock.working":"Секунду…",
"lock.needPass":"Введите кодовую фразу, чтобы открыть это приглашение.",
"lock.wrongPass":"Неверная кодовая фраза. Проверьте и попробуйте снова.",
"lock.badAnswer":"Недействительный ответ — или он запечатан другой кодовой фразой.",
"join.badCode":"Этот код недействителен. Проверьте, что скопировали его полностью.",
"connect.waiting":"Ожидание соединения…",
"connect.failed":"Не удалось соединиться. Убедитесь, что вы оба онлайн, затем создайте новое приглашение — старые коды нельзя использовать повторно.",
"connect.slow":"Это занимает больше времени, чем обычно — так бывает в сильно фильтруемых сетях (на работе, в некоторых мобильных сетях) или если вы не в сети одновременно. Подождите ещё немного или создайте новое приглашение.",
"footer.seal":"Отпечатки этого приложения (SHA-256):",
"verify.known":"проверено","verify.changedShort":"код изменился","verify.accept":"Принять новый код",
"verify.noteKnown":"Тот же код, что и в прошлый раз: с тех пор никто не вклинился.",
"verify.noteNew":"Первый раз с этим человеком: сравните код вслух, затем приложение его запомнит.",
"verify.noteChanged":"Код изменился. Обычно это означает новый телефон или переустановленное приложение — но так же выглядит и перехват. Сравните его вслух, прежде чем принять.",
"quick.titleA":"Ваш код",
"quick.helpA":"Отправьте его кнопкой ниже — одно касание, и он у них. Или произнесите шесть цифр вслух. Он продолжает работать, пока вы остаётесь на этом экране.",
"quick.orType":"Или откройте приложение и введите этот код:","quick.qrHint":"Или наведите камеру телефона сюда",
"quick.newCode":"Создать новый код","quick.useLong":"Предпочитаете длинный код?",
"quick.titleB":"Введите код",
"quick.helpB":"Спросите код у того, кто вас пригласил — 6 цифр, сказанных вслух или написанных — и введите его здесь.",
"quick.codePh":"000000","quick.connect":"Соединиться",
"quick.waiting":"Ожидание, пока собеседник введёт код…","quick.expired":"Срок кода истёк без ответа. Создайте новый.",
"quick.notFound":"Код истёк или неверен. Проверьте его у того, кто вам его дал.",
"quick.shareText":"Вот ссылка, чтобы поговорить со мной в DigitalValut Logos. Нажмите на неё, и мы будем на связи:",
"quick.share":"Отправить приглашение",
"notify.title":"Сообщите мне, когда меня кто-то ищет",
"notify.sub":"Уведомление, если контакт пытается связаться с вами, а приложение у вас не открыто — ни имени, ни сообщения, только сигнал.",
"notify.iosHint":"На iPhone это работает только если вы сначала добавили приложение на главный экран: нажмите <b>Поделиться</b> в Safari, затем <b>На экран «Домой»</b>, и открывайте приложение оттуда.",
"notify.blocked":"Уведомления заблокированы браузером. Проверьте настройки сайта.",
"sas.title":"Проверка безопасности",
"sas.lead":"Произнесите друг другу эти три слова вслух. Если вы оба видите одинаковые, никто не вклинился.",
"sas.leadChanged":"Осторожно: этот человек больше не выглядит тем же, что и в прошлый раз. Обычно это означает новый телефон или переустановленное приложение — но так же выглядит и перехват. Произнесите три слова вслух, прежде чем продолжить.",
"sas.yes":"Да, совпадают","sas.no":"Нет, отличаются",
"sas.note":"Нужно только в первый раз с этим человеком: потом приложение запомнит.",
"sas.confirmed":"Контакт подтверждён.",
"sas.refused":"Слова не совпали: этот разговор не считается безопасным. Закройте его и начните заново с новым кодом.",
"connect.bigTitle":"Идёт подключение…","connect.bigHint":"Не закрывайте приложение — это займёт всего несколько секунд.",
"autoclean.title":"Автоматическая очистка","autoclean.sub":"Сама удаляет разговоры старше указанного числа дней, чтобы они не занимали место на телефоне. По умолчанию выключено: ничего не удаляется само, пока вы это не включите.","autoclean.after":"Удалять разговоры старше:","autoclean.d7":"7 дней","autoclean.d30":"30 дней","autoclean.d90":"90 дней","autoclean.d365":"1 года",
"wake.waitsNote":"Можно закрыть приложение: я сообщу, когда приглашение откроют.","wake.calling":"Сообщаю {name}…","wake.callingHint":"Телефон уже звонит. Как только приложение откроют, вы соединитесь — можно подождать здесь.","wake.noAnswer":"Я сообщил, но приложение ещё не открыли. Попробуйте позже.",
"quick.helpAWaits":"Отправьте её кнопкой ниже — другому человеку достаточно нажать, и он внутри. Или продиктуйте шесть цифр вслух.",
"verify.inPerson":"проверено лично","verify.inPersonDone":"Проверено лично: вы отсканировали код прямо с экрана этого человека, значит никто не мог вклиниться между вами. Три слова произносить не нужно.","sas.leadMismatch":"Внимание: ответил не тот телефон, чей код вы отсканировали. Возможно, это ошибка, но именно так выглядело бы и вклинивание постороннего. Ничего не пишите, пока не произнесёте друг другу три слова вслух.",
"easy.title":"Простой режим","easy.sub":"Только две большие кнопки и больше ничего. Для тех, кто не хочет ни о чём думать — или для того, кто настраивает телефон другому.","easy.voiceTitle":"Говорить вслух","easy.voiceSub":"Приложение вслух подсказывает, что делать, на вашем языке. Для тех, кому трудно читать с экрана.","easy.voiceOn":"Хорошо. Теперь я буду говорить вслух, что делать.","easy.sayHome":"Нажмите первую кнопку, чтобы начать разговор. Вторую — если вам прислали приглашение.","easy.sayStart":"Это ваш код. Нажмите оранжевую кнопку, чтобы отправить его кому хотите.","easy.sayJoin":"Введите шесть цифр, которые вам дали.","easy.sayChat":"Вы соединены. Теперь можно говорить.",
"broker.down":"Служба, которая помогает вам найти друг друга, не отвечает. Длинный код ниже работает всё равно: он не проходит ни через какой сервер.",
"flash.title":"Соединены","flash.titleWith":"Соединены с {name}","flash.direct":"Прямая связь между вашими телефонами","flash.relay":"Связь через зашифрованный мост — ваша сеть не допустила прямую","flash.noserver":"Ни один сервер не может прочитать то, что вы пишете","flash.time":"За {s} секунды, без всякой регистрации",
"viral.title":"Получилось.","viral.sub":"Если пригодилось — передайте дальше: это бесплатно, без регистрации и ничего ни о ком не хранит.","viral.btn":"Рассказать кому-нибудь",
"media.title":"Микрофон и камера","media.warnDenied":"Этот браузер блокирует микрофон: вы не сможете ни звонить, ни принимать звонки.","media.warnFix":"Как исправить","media.retry":"Ещё раз","media.close":"Закрыть","media.nowOk":"Микрофон включён. Теперь можно звонить.","media.peerNoMic":"{name}: звонок принят, но браузер не даёт включить микрофон. Это не отказ.","media.peerNoCam":"{name}: звонок принят, но браузер не даёт включить камеру и микрофон. Это не отказ — попробуйте только голосовой звонок.","media.stepsIos":"Откройте <b>Настройки</b> на iPhone|Прокрутите вниз и нажмите <b>Safari</b>|Нажмите <b>Микрофон</b>, затем <b>Камера</b>: поставьте <b>Спрашивать</b> или <b>Разрешить</b>|Вернитесь сюда и перезагрузите страницу","media.stepsAndroid":"Нажмите на <b>замок</b> рядом с адресом вверху|Нажмите <b>Разрешения</b>|Включите <b>Микрофон</b> и <b>Камеру</b>|Перезагрузите страницу","media.stepsChrome":"Нажмите на <b>замок</b> слева от адреса|Включите <b>Микрофон</b> и <b>Камеру</b>|Перезагрузите страницу","media.stepsSafariMac":"В строке меню откройте <b>Safari</b> › <b>Настройки для этого сайта</b>|Поставьте <b>Микрофон</b> и <b>Камеру</b> на <b>Разрешить</b>|Перезагрузите страницу","media.stepsFirefox":"Нажмите на <b>замок</b> слева от адреса|Снимите блокировку рядом с <b>Использовать микрофон</b> и <b>Использовать камеру</b>|Перезагрузите страницу","media.stepsOther":"Откройте настройки браузера для этого сайта|Разрешите <b>Микрофон</b> и <b>Камеру</b>|Перезагрузите страницу",
"addr.title":"Ваш постоянный адрес","addr.sub":"Давайте его вместо номера телефона. Тот, у кого он есть, сможет связаться с вами в любой момент, не зная ни вашего имени, ни номера. По умолчанию выключено.","addr.qrHint":"Кто его отсканирует, сразу позвонит вам","addr.share":"Отправить адрес","addr.showQr":"Показать QR","addr.reachNote":"Чтобы вас могли застать и при закрытом приложении, включите уведомления ниже.","addr.dialLabel":"Есть чей-то адрес?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Позвонить","addr.badFormat":"Адрес записан неверно. Это 12 символов, например DV-K7M2-9QRT-X4WP.","addr.itsYou":"Это ваш собственный адрес.","addr.callingTitle":"Звоню…","addr.callingHint":"Если приложение закрыто, я заставлю телефон зазвонить. Это может занять момент.","addr.noAnswer":"Ответа нет. Я предупредил — попробуйте позже.","addr.dialFailed":"Не удалось позвонить на этот адрес.","addr.noKey":"Похоже, этот адрес больше не активен. Попросите человека заново открыть приложение и прислать адрес ещё раз: адреса изменились с последним обновлением.","addr.noBroker":"Я даже не смог начать звонок: служба, которая вас соединяет, не ответила. Если вы используете копию приложения по другому адресу, откройте официальную.","addr.incomingTitle":"Вас ищут","addr.incomingSub":"Имя и причину написал тот, кто звонит: пока вы не примете, никто не может доказать, что это действительно он.","addr.incomingToast":"Кто-то звонит на ваш адрес.","addr.accept":"Принять","addr.ignore":"Пропустить","addr.verified":"Проверено: ответивший действительно владеет адресом {a}. Никто не мог вклиниться.","addr.blockedIn":"Звонок от того, кому вы уже отказали: пропущен.","addr.shareText":"Со мной можно связаться здесь, без номера телефона. Мой адрес в DigitalValut Logos — {a}\n\nНажмите, чтобы позвонить:",
"addr.incomingAt":"через «{name}»","burn.title":"Одноразовые адреса","burn.help":"По одному на объявление, по одному на незнакомца. Удалите — и этот человек больше вас не найдёт: настоящего у него никогда не было.","burn.namePh":"Для чего? напр. Диван б/у","burn.add":"Создать","burn.send":"Отправить этот адрес","burn.delete":"Удалить","burn.deleted":"«{name}» удалён. Этот адрес больше не отвечает.","burn.made":"«{name}» создан. Можно раздавать.","burn.needName":"Дайте ему имя, чтобы помнить, кому отдали.","burn.full":"Одновременно можно иметь {n}. Удалите один, чтобы создать новый.","burn.untitled":"Без имени",
"knock.title":"Вы связываетесь с","knock.nameLabel":"Как вас зовут?","knock.namePh":"Ваше имя","knock.msgLabel":"Что вам нужно? (не обязательно)","knock.msgPh":"напр. Есть обувь 42 размера?","knock.go":"Позвонить","knock.note":"Ваше имя и эту фразу видит только тот, кому вы звоните. Ни один сервер их не прочтёт.",
"letter.title":"Оставленные вам сообщения","letter.noneTitle":"Сейчас никто не отвечает.","letter.noneSub":"Я уже сообщил ей, что вы пытались до неё дозвониться. Если хотите сказать больше, напишите здесь.","letter.ph":"Напишите сообщение здесь","letter.leave":"Оставить сообщение","letter.cancel":"Не надо","letter.needText":"Напишите пару слов, чтобы было понятно, зачем вы звонили.","letter.left":"Сообщение оставлено. Его увидят при открытии приложения.","letter.failed":"Не удалось оставить сообщение. Попробуйте ещё раз.","letter.callBack":"Перезвонить","letter.dismiss":"Готово",
"home.bigStart":"Поговорить с кем-то","home.bigStartD":"Создать приглашение","home.bigJoin":"У меня есть код","home.bigJoinD":"Мне прислали приглашение","set.lang":"Язык","set.textsize":"Размер текста","conn.direct":"Прямая связь между двумя телефонами","conn.directShort":"соединено напрямую","conn.relay":"Надёжная связь через зашифрованный мост","conn.relayShort":"соединено (мост)","conn.down":"Связь потеряна","conn.downShort":"потеряна","conn.working":"Соединение","conn.wobbly":"Связь дрогнула — восстанавливаю","conn.wobblyShort":"восстанавливаю","chat.linkLost":"Соединение прервалось. Ничего не потеряно — откройте приложение заново и подключитесь через «Недавние контакты».",
"call.flipFail":"На этом телефоне не удаётся переключить камеру.",
"call.flipBusy":"Камера занята другим приложением. Закройте его и попробуйте снова.","call.flipDenied":"Браузер заблокировал камеру для этого сайта.","call.flipOnlyOne":"У этого устройства только одна камера.",
"home.alreadyTalking":"Вы уже в разговоре. Чтобы начать другой, сначала завершите этот.","home.stillCalling":"Я всё ещё звоню. Дождитесь ответа или отмените звонок.","home.busyReconnect":"Сейчас вы заняты. Завершите или закройте текущее соединение, прежде чем пробовать снова.",
"letter.missed":"Хотел(а) с вами поговорить.",
"sas.blocked":"Сначала произнесите три слова вслух: это уже не тот же человек.",
"file.tooBig":"Входящий файл остановлен: он не соответствовал заявленному.","file.sendFailed":"Отправка прервана: соединение закрылось на середине.","file.progress":"{sent} из {total}",
"share.pending":"Готово к отправке: {n} файл(ов) — уйдут, как только соединитесь",
"health.storage":"Память телефона",
"health.storageFull":"Заполнена: разговоры больше не сохраняются. Освободите место на телефоне.",
"addr.lifespan":"Этот адрес не истекает. Он остаётся действительным, пока данные приложения хранятся на этом телефоне.",
"health.addrLife":"Слова безопасности",
"health.addrLifeOk":"Стабильны ещё примерно {n} дней.",
"health.addrLifeSoon":"Примерно через {n} дней они изменятся сами. Ваших собеседников попросят проверить их с вами снова — это не признак проблемы.","health.addrKeyBad":"Они не могут вас найти: этот телефон не смог опубликовать ключ, на котором построен его адрес. Проверьте соединение и откройте приложение заново.",
"health.title":"Как работает приложение",
"health.sub":"Если кто-то не может до вас дозвониться, причина ниже.",
"health.recheck":"Проверить снова",
"health.copy":"Скопировать отчёт",
"health.copied":"Отчёт скопирован.",
"health.checking":"Проверяю…",
"health.busy":"Пауза: вы уже в разговоре.",
"health.stopped":"Я не слушаю. Закройте приложение и откройте снова.",
"health.addr":"Тот, у кого есть ваш адрес",
"health.addrOk":"Может позвонить вам прямо сейчас.",
"health.addrOff":"Ваш адрес выключен. Включите его выше.",
"health.contacts":"Ваши контакты",
"health.contactsOk":"Они могут найти вас прямо сейчас.",
"health.contactsNone":"У вас пока нет контактов.",
"health.broker":"Служба, которая вас соединяет",
"health.brokerOk":"Отвечает.",
"health.brokerBad":"Не отвечает. Остаются длинные коды — они не проходят ни через один сервер.",
"health.brokerOrigin":"Эта копия приложения находится по адресу, который служба не признаёт: отсюда работать не будет. Откройте официальную.",
"health.closed":"При закрытом приложении",
"health.closedOk":"Они могут заставить ваш телефон зазвонить.",
"health.closedOff":"Они до вас не достучатся. Включите уведомления выше.",
"health.closedDenied":"Браузер блокирует уведомления: при закрытом приложении до вас никто не достучится.",
"health.closedIos":"На iPhone нужно сначала добавить приложение на экран «Домой».",
"health.mic":"Микрофон",
"health.micOk":"Доступен.",
"health.micBad":"Заблокирован браузером: вы не сможете ни звонить, ни принимать звонки.",
"health.micUnknown":"Я не могу это узнать, пока вы не попробуете позвонить.",
"health.version":"Используемая версия",
"health.versionOld":"Часть приложения всё ещё старая. Закройте его и откройте снова.",
"media.stepsAndroidApp":"Вернитесь на главный экран телефона|Нажмите и удерживайте значок <b>DigitalValut Logos</b>|Нажмите <b>О приложении</b> (или значок ⓘ)|Нажмите <b>Разрешения</b>, включите <b>Микрофон</b> и <b>Камеру</b>|Откройте приложение снова"
});

Object.assign(I18N.zh, {
"onboard.text":"<b>DigitalValut Logos</b> — 免费开源软件（Apache 2.0 许可证），归意大利注册非营利组织 Associazione di Promozione Sociale DigitalValut（第三部门实体）所有。任何人在世界任何地方都可以免费下载和使用。",
"install.btn":"安装",
"home.title":"随时随地，和你想聊的人聊天",
"home.sub":"消息、照片、视频、通话。无需注册，无需电话号码，永久免费。",
"home.nameLabel":"你的名字","home.namePh":"你的名字",


"home.legalSummary":"工作原理，三句技术说明",
"home.legalBody":"它会向和你聊天的人显示你的网络地址（IP）；需要双方同时在线，否则无法送达，在过滤严格的网络上通话可能无法连接；任何网站都无法阻止截图，永远不能。",
"nav.back":"返回",
"start.create":"准备邀请","start.share":"发送邀请","btn.copyCode":"复制代码",
"start.pastePh":"在此粘贴回复…","btn.connect":"进入聊天",
"join.pastePh":"在此粘贴邀请…","join.generate":"打开邀请",
"join.sendAnswer":"发送回复",
"chat.someone":"某人","chat.connected":"已连接","chat.typePh":"写一条消息…","chat.dropHere":"拖到这里发送",
"call.hangup":"结束","call.accept":"接听","call.decline":"拒绝",
"menu.title":"工具","menu.arm":"自毁","menu.disarm":"取消",
"menu.clearHistory":"清除记录","menu.endChat":"结束聊天",
"menu.historyNote":"记录只保存在这台设备上，与和你聊天的人的名字绑定。没有服务器保存它。",
"footer.text":"免费开源软件（Apache 2.0 许可证），DigitalValut APS ETS 的项目。",
"footer.noserver":"无服务器：两个浏览器之间通过 WebRTC 直接连接。",
"footer.author":"由 Giuseppe Falsone 博士为 DigitalValut 构思。© 2026 DigitalValut 及 DigitalValut 团队。",
"footer.license":"阅读开源许可证","footer.source":"GitHub 上的源代码",
"verify.badge":"验证","verify.title":"安全码",
"verify.lead":"和对方核对——用语音、电话，或用一个不同于你们交换邀请码的渠道。如果两个代码不完全一致，可能有人插入了连接：不要信任这个聊天。",
"verify.close":"关闭","verify.unavailable":"还没准备好——稍后再试。",
"contacts.title":"最近联系人",
"contacts.note":"轻触即可再次查看：你们说过的话保留在这里。每次都需要一个新邀请，因为没有服务器替你们保持连接。",
"toast.sealCopied":"代码已复制","toast.copyFail":"复制失败——请手动选择并复制","toast.copySelected":"复制失败——已为你选中代码，按 Ctrl/Cmd+C 即可",
"call.busy":"未接听——正在通话中。","call.declinedBy":"拒绝了通话。","call.connectFailed":"通话未能连接。请重试。",
"call.joined":"加入了聊天。","call.videoInvite":"正在给你打视频电话","call.audioInvite":"正在给你打电话",
"call.inVideo":"视频通话进行中…","call.inAudio":"通话进行中…","call.ringingVideo":"视频呼叫中，等待接听…","call.ringingAudio":"呼叫中，等待接听…",
"call.micFail":"麦克风或摄像头不可用，或权限被拒绝。",
"call.micFailNotFound":"此设备未找到麦克风或摄像头。",
"call.micFailBusy":"你的麦克风或摄像头已被另一个应用占用（Zoom、Teams、另一个标签页……）。请关闭它后重试。",
"call.micFailDenied":"浏览器已阻止此网站使用麦克风和摄像头。请按以下步骤操作，然后重新加载页面。",
"reconnect.trying":"正在尝试重新连接 {n}…",
"reconnect.offline":"{n} 目前似乎不在线。这是可以手动发送的代码。",
"call.noSpeakerFound":"在此手机上找不到独立扬声器。",
"call.speakerFail":"无法在此手机上切换扬声器。",
"destruct.countdown":"将在以下时间后自毁：","destruct.done":"对话已自毁。",
"session.closed":"已关闭","session.newHint":"创建新会话以重新连接。",
"invite.shareText":"想在 DigitalValut Logos 上和我聊天吗？打开这个链接：如果你还没准备好页面，它会自动打开并已填好我的邀请。\n\n",
"invite.answerText":"这是我在 DigitalValut Logos 上的回复，粘贴它以完成连接：\n\n",
"mic.recording":"录音中——点击停止","history.cleared":"此设备上的记录已清除。",
"install.genericText":"<b>安装 DigitalValut Logos</b>，将其作为一个带有独立图标的应用，无需浏览器。",
"install.iosText":"<b>在 iPhone 或 iPad 上安装 DigitalValut Logos。</b>在 Safari 中点击<b>分享</b>，然后点击<b>添加到主屏幕</b>。",
"home.shareApp":"告诉别人这个应用",
"start.s1":"发送邀请",
"start.s1help":"按下橙色按钮。应用会准备好邀请，并让你选择发送方式：WhatsApp、短信、邮件——你平常使用的方式。",
"start.s2":"粘贴对方的回复",
"start.s2help":"对方会回复一条消息给你。复制它，回到这里按<b>粘贴</b>。然后你们一起进入聊天。",
"join.s1":"打开邀请",
"join.s1help":"如果你打开了对方发给你的链接，一切已经准备好：按下橙色按钮。否则按<b>粘贴</b>。",
"join.s2":"发送回复",
"join.s2help":"最后一步：把这个发回给邀请你的人，你们就连接上了。",
"btn.paste":"粘贴","btn.showCode":"显示代码",
"toast.clipboardEmpty":"没有可粘贴的内容。","toast.pasteManually":"按住方框并选择粘贴。",
"home.shareAppText":"免费，无需账号，可在任何手机或电脑上使用，发送照片和文件保持原画质——DigitalValut Logos：\n\n",
"lock.title":"额外保护",
"lock.sub":"用你口头说出的密语锁定邀请。如果代码通过 WhatsApp、邮件或短信传送，值得开启。",
"lock.passCap":"密语",
"lock.passHint":"大声说出来，或通过与代码不同的渠道发送。没有它，代码无法打开。",
"lock.ask":"此邀请已锁定。输入对方口头告诉你的密语。",
"lock.askPh":"密语","lock.working":"请稍候…",
"lock.needPass":"输入密语以打开此邀请。",
"lock.wrongPass":"密语错误。请检查后重试。",
"lock.badAnswer":"回复无效——或使用了不同的密语加密。",
"join.badCode":"此代码无效。请检查是否完整复制。",
"connect.waiting":"正在等待连接…",
"connect.failed":"无法连接。请确保双方都在线，然后创建一个新邀请——旧代码不能重复使用。",
"connect.slow":"这比平常花的时间更长——这种情况常发生在过滤严格的网络（公司、部分移动网络）上，或者你们不在同一时间在线。请再等一会儿，或创建一个新邀请。",
"footer.seal":"此应用的指纹（SHA-256）：",
"verify.known":"已验证","verify.changedShort":"代码已更改","verify.accept":"接受新代码",
"verify.noteKnown":"和上次相同的代码：此后没有人插入其中。",
"verify.noteNew":"第一次和此人连接：口头核对代码，之后应用会记住它。",
"verify.noteChanged":"代码已更改。通常意味着换了新手机或重装了应用——但这也可能是被拦截的迹象。接受之前请口头核对。",
"quick.titleA":"你的代码",
"quick.helpA":"用下面的按钮发送——轻触一下对方就进来了。或者大声说出这六位数字。只要你留在这个屏幕上，它就一直有效。",
"quick.orType":"或者打开应用并输入这个代码：","quick.qrHint":"或用手机摄像头对准这里",
"quick.newCode":"生成新代码","quick.useLong":"更喜欢长代码？",
"quick.titleB":"输入代码",
"quick.helpB":"向邀请你的人索要代码——6位数字，口头告知或写下——然后在此输入。",
"quick.codePh":"000000","quick.connect":"连接",
"quick.waiting":"正在等待对方输入代码…","quick.expired":"代码已过期且无人应答。请生成一个新代码。",
"quick.notFound":"代码已过期或错误。请向给你代码的人核实。",
"quick.shareText":"这是在 DigitalValut Logos 上和我聊天的链接。点击它，我们就连接上了：",
"quick.share":"发送邀请",
"notify.title":"有人找我时通知我",
"notify.sub":"当联系人试图联系你而你没有打开应用时发送通知——没有姓名，没有消息内容，只是一个提醒。",
"notify.iosHint":"在 iPhone 上，只有先将应用添加到主屏幕后才能使用此功能：在 Safari 中点击<b>分享</b>，然后点击<b>添加到主屏幕</b>，并从那里打开应用。",
"notify.blocked":"通知被浏览器阻止。请检查网站设置。",
"sas.title":"安全检查",
"sas.lead":"互相大声说出这三个词。如果你们看到的一样，说明没有人插入其中。",
"sas.leadChanged":"注意：此人看起来和上次不一样了。通常意味着换了新手机或重装了应用——但这也可能是被拦截的迹象。继续之前请大声说出这三个词核对。",
"sas.yes":"是的，一致","sas.no":"不，不一致",
"sas.note":"只有第一次和此人连接时才需要：之后应用会记住。",
"sas.confirmed":"联系人已验证。",
"sas.refused":"词语不匹配：此对话不被视为安全。请关闭它，用新代码重新开始。",
"connect.bigTitle":"正在连接…","connect.bigHint":"请不要关闭应用——只需几秒钟。",
"autoclean.title":"自动清理","autoclean.sub":"自动删除超过设定天数的对话，这样它们就不会一直占用手机空间。默认关闭：除非你自己打开此项，否则不会自动删除任何内容。","autoclean.after":"删除早于以下时间的对话：","autoclean.d7":"7 天","autoclean.d30":"30 天","autoclean.d90":"90 天","autoclean.d365":"1 年",
"wake.waitsNote":"你可以关闭应用：邀请被打开时我会通知你。","wake.calling":"正在通知 {name}…","wake.callingHint":"对方的手机已经响了。只要对方打开应用，你们就会连接上——可以在这里等待。","wake.noAnswer":"已经通知过了，但对方还没有打开应用。请稍后再试。",
"quick.helpAWaits":"用下面的按钮发送——对方只要点一下就连上了。或者把这六位数字念给对方听。",
"verify.inPerson":"已当面验证","verify.inPersonDone":"已当面验证：你是从对方本人的屏幕上扫的码，所以不可能有人插在中间。不需要再核对那三个词。","sas.leadMismatch":"注意：应答的并不是你扫码的那部手机。这可能是个误会，但如果真有人插在中间，看到的也正是这样。在你们当面核对完那三个词之前，不要写任何内容。",
"easy.title":"简单模式","easy.sub":"只有两个大按钮，周围什么都没有。给不想操心的人——也给替别人设置手机的人。","easy.voiceTitle":"读出来","easy.voiceSub":"应用会用你的语言把该做的事读出来。适合看屏幕吃力的人。","easy.voiceOn":"好的。从现在起我会把该做的事读给你听。","easy.sayHome":"点第一个按钮开始聊天。如果别人给你发了邀请，就点第二个。","easy.sayStart":"这是你的号码。按橙色按钮把它发给你想发的人。","easy.sayJoin":"输入别人给你的六位数字。","easy.sayChat":"已经连上了。现在可以说话了。",
"broker.down":"帮你们互相找到对方的服务没有响应。下面的长号码照样能用：它完全不经过任何服务器。",
"flash.title":"已连接","flash.titleWith":"已与 {name} 连接","flash.direct":"你们两台手机之间的直接连接","flash.relay":"通过加密中转连接——你们的网络不允许直接连接","flash.noserver":"没有任何服务器能读取你们的对话","flash.time":"用时 {s} 秒，无需注册任何账号",
"viral.title":"成功了。","viral.sub":"如果觉得有用，就传给别人吧：免费、无需账号，也不保存任何人的任何信息。","viral.btn":"告诉别人",
"media.title":"麦克风和摄像头","media.warnDenied":"此浏览器阻止了麦克风：你将无法拨打或接听通话。","media.warnFix":"如何解决","media.retry":"重试","media.close":"关闭","media.nowOk":"麦克风已开启，现在可以通话了。","media.peerNoMic":"{name} 已经接听了，但对方的浏览器不允许开启麦克风。不是对方拒绝了你。","media.peerNoCam":"{name} 已经接听了，但对方的浏览器不允许开启摄像头和麦克风。可以改用语音通话，或者请对方解除限制。","media.stepsIos":"在 iPhone 上打开<b>设置</b>|向下滑动并点按 <b>Safari 浏览器</b>|点按<b>麦克风</b>，再点按<b>相机</b>：设为<b>询问</b>或<b>允许</b>|回到这里并重新加载页面","media.stepsAndroid":"点按地址栏旁边顶部的<b>锁形图标</b>|点按<b>权限</b>|开启<b>麦克风</b>和<b>相机</b>|重新加载页面","media.stepsChrome":"点击地址左侧的<b>锁形图标</b>|开启<b>麦克风</b>和<b>摄像头</b>|重新加载页面","media.stepsSafariMac":"在菜单栏打开 <b>Safari 浏览器</b> › <b>此网站的设置</b>|将<b>麦克风</b>和<b>摄像头</b>设为<b>允许</b>|重新加载页面","media.stepsFirefox":"点击地址左侧的<b>锁形图标</b>|清除<b>使用麦克风</b>和<b>使用摄像头</b>旁边的阻止|重新加载页面","media.stepsOther":"打开浏览器中此网站的设置|允许<b>麦克风</b>和<b>摄像头</b>|重新加载页面",
"addr.title":"你的永久地址","addr.sub":"把它给别人，代替电话号码。拿到它的人随时都能找到你，而不必知道你的名字或号码。默认关闭。","addr.qrHint":"扫一下就能直接呼叫你","addr.share":"发送你的地址","addr.showQr":"显示二维码","addr.reachNote":"想让别人在应用关闭时也能找到你，请打开下面的通知。","addr.dialLabel":"有别人的地址吗？","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"呼叫","addr.badFormat":"这个地址写得不对。它是 12 个字符，例如 DV-K7M2-9QRT-X4WP。","addr.itsYou":"这是你自己的地址。","addr.callingTitle":"正在呼叫…","addr.callingHint":"如果对方的应用关着，我会让手机响起来。可能需要一点时间。","addr.noAnswer":"没有回应。已经通知过对方了，稍后再试。","addr.dialFailed":"无法呼叫这个地址。","addr.noKey":"这个地址似乎已经失效。请让对方重新打开应用并再发一次：地址在最近一次更新中变了。","addr.noBroker":"我连呼叫都没能发出：帮你们牵线的服务没有回应。如果你用的是放在别处的应用副本，请打开官方的那个。","addr.incomingTitle":"有人在找你","addr.incomingSub":"名字和理由是呼叫方自己写的：在你接受之前，没有人能证明他确实是那个人。","addr.incomingToast":"有人正在呼叫你的地址。","addr.accept":"接受","addr.ignore":"忽略","addr.verified":"已验证：应答的一方确实拥有地址 {a}。不可能有人插在中间。","addr.blockedIn":"来自你已拒绝过的人的呼叫：已忽略。","addr.shareText":"你可以在这里找到我，不需要我的电话号码。我的 DigitalValut Logos 地址是 {a}\n\n点一下就能呼叫我：",
"addr.incomingAt":"通过“{name}”","burn.title":"一次性地址","burn.help":"每条广告一个，每个陌生人一个。用完删掉，那个人就再也找不到你——他从来没拿到过你真正的地址。","burn.namePh":"用来做什么？例如：二手沙发","burn.add":"创建","burn.send":"发送这个地址","burn.delete":"删除","burn.deleted":"“{name}”已删除。该地址不再应答。","burn.made":"“{name}”已创建，可以发给别人了。","burn.needName":"给它起个名字，这样你知道给了谁。","burn.full":"最多同时保留 {n} 个。删掉一个才能再建。","burn.untitled":"未命名",
"knock.title":"你正在联系","knock.nameLabel":"你叫什么名字？","knock.namePh":"你的名字","knock.msgLabel":"你需要什么？（可不填）","knock.msgPh":"例如：有42码的鞋吗？","knock.go":"呼叫","knock.note":"你的名字和这句话只有被叫的人能看到。任何服务器都读不到。",
"letter.title":"留给你的消息","letter.noneTitle":"现在没有人接听。","letter.noneSub":"我已经告诉对方你找过她了。如果你想多说几句，可以写在这里。","letter.ph":"在这里写下你的消息","letter.leave":"留下消息","letter.cancel":"算了","letter.needText":"写上一两句，让对方知道你想说什么。","letter.left":"消息已留下。对方打开应用就会看到。","letter.failed":"没能留下消息，请再试一次。","letter.callBack":"回拨","letter.dismiss":"完成",
"home.bigStart":"和某人聊天","home.bigStartD":"创建一个邀请发送","home.bigJoin":"我有一个码","home.bigJoinD":"有人给我发了邀请","set.lang":"语言","set.textsize":"文字大小","conn.direct":"两台手机之间的直接连接","conn.directShort":"已直接连接","conn.relay":"安全连接，经由加密中转","conn.relayShort":"已连接（中转）","conn.down":"连接已断开","conn.downShort":"已断开","conn.working":"正在连接","conn.wobbly":"连接不稳，正在恢复","conn.wobblyShort":"正在恢复","chat.linkLost":"连接已断开。什么都没丢——重新打开应用，从「最近联系人」重新连接。",
"call.flipFail":"无法在这台手机上切换摄像头。",
"call.flipBusy":"摄像头正被其他应用占用。请关闭后重试。","call.flipDenied":"浏览器已阻止此网站使用摄像头。","call.flipOnlyOne":"此设备只有一个摄像头。",
"home.alreadyTalking":"你已经在一个对话中。要开始新的，请先结束这个。","home.stillCalling":"还在呼叫中。请等对方回应，或取消这次呼叫。","home.busyReconnect":"您现在正忙。请先完成或关闭当前连接，再重试。",
"letter.missed":"想跟你说说话。",
"sas.blocked":"请先把三个词念出来核对：这个人已经不是原来那位了。",
"file.tooBig":"一个接收中的文件已被中止：它与声明的不符。","file.sendFailed":"发送中断：连接在传输过程中关闭了。","file.progress":"{sent} / {total}",
"share.pending":"{n} 个文件已准备好发送——一连接就会发送",
"health.storage":"手机存储",
"health.storageFull":"已满：对话不再被保存。请清理手机空间。",
"addr.lifespan":"这个地址不会过期。只要应用的数据还在这台手机上，它就一直有效。",
"health.addrLife":"安全词",
"health.addrLifeOk":"还会稳定大约 {n} 天。",
"health.addrLifeSoon":"大约 {n} 天后它们会自动更换。你的联系人会被要求和你重新核对一次——这不代表出了什么问题。","health.addrKeyBad":"他们找不到你：这台手机没能发布其地址所依赖的密钥。请检查网络并重新打开应用。",
"health.title":"应用运行状况",
"health.sub":"如果有人联系不上你，原因就在下面。",
"health.recheck":"重新检查",
"health.copy":"复制报告",
"health.copied":"报告已复制。",
"health.checking":"正在检查…",
"health.busy":"已暂停：你已经在一个对话中。",
"health.stopped":"我没有在监听。请关闭应用后重新打开。",
"health.addr":"拿到你地址的人",
"health.addrOk":"现在就能呼叫你。",
"health.addrOff":"你的地址是关闭的。请在上面打开它。",
"health.contacts":"你的联系人",
"health.contactsOk":"他们现在就能重新找到你。",
"health.contactsNone":"你还没有联系人。",
"health.broker":"帮你们牵线的服务",
"health.brokerOk":"有回应。",
"health.brokerBad":"没有回应。长代码仍然可用：它们不经过任何服务器。",
"health.brokerOrigin":"这份应用副本所在的地址不被服务认可：从这里无法工作。请打开官方的那个。",
"health.closed":"应用关闭时",
"health.closedOk":"他们能让你的手机响起来。",
"health.closedOff":"他们找不到你。请在上面打开通知。",
"health.closedDenied":"浏览器阻止了通知：应用关闭时没人能找到你。",
"health.closedIos":"在 iPhone 上需要先把应用添加到主屏幕。",
"health.mic":"麦克风",
"health.micOk":"可用。",
"health.micBad":"被浏览器阻止：你将无法拨打或接听呼叫。",
"health.micUnknown":"在你尝试呼叫之前我无法知道。",
"health.version":"正在使用的版本",
"health.versionOld":"应用的一部分还是旧的。请关闭后重新打开。",
"media.stepsAndroidApp":"返回手机主屏幕|长按 <b>DigitalValut Logos</b> 图标|点按<b>应用信息</b>（或 ⓘ 图标）|点按<b>权限</b>，然后开启<b>麦克风</b>和<b>摄像头</b>|重新打开应用"
});

Object.assign(I18N.ar, {
"onboard.text":"<b>DigitalValut Logos</b> — برنامج حر ومفتوح المصدر (رخصة Apache 2.0)، مملوك لجمعية Associazione di Promozione Sociale DigitalValut، وهي منظمة إيطالية غير ربحية مسجّلة (Ente del Terzo Settore). يمكن تنزيله واستخدامه مجانًا من قِبل أي شخص، في أي مكان في العالم.",
"install.btn":"تثبيت",
"home.title":"تحدّث مع من تريد، أينما كان",
"home.sub":"رسائل، صور، فيديو، مكالمات. بلا تسجيل، بلا رقم هاتف، مجانًا للأبد.",
"home.nameLabel":"اسمك","home.namePh":"اسمك",


"home.legalSummary":"كيف يعمل هذا، في ثلاثة أسطر تقنية",
"home.legalBody":"يكشف هذا عنوان شبكتك (IP) لمن تتحدث معه؛ يتطلب أن تكونا متصلَين في الوقت نفسه، وإلا لن يصل شيء، وفي الشبكات شديدة التصفية قد لا تتصل المكالمات؛ لا يمكن لأي موقع أن يمنع لقطة شاشة، أبدًا.",
"nav.back":"رجوع",
"start.create":"تجهيز الدعوة","start.share":"إرسال الدعوة","btn.copyCode":"نسخ الرمز",
"start.pastePh":"الصق الرد هنا…","btn.connect":"ادخل إلى المحادثة",
"join.pastePh":"الصق الدعوة هنا…","join.generate":"فتح الدعوة",
"join.sendAnswer":"إرسال الرد",
"chat.someone":"شخص ما","chat.connected":"متصل","chat.typePh":"اكتب رسالة…","chat.dropHere":"أفلتها هنا لإرسالها",
"call.hangup":"إنهاء","call.accept":"رد","call.decline":"رفض",
"menu.title":"أدوات","menu.arm":"تدمير ذاتي","menu.disarm":"إلغاء",
"menu.clearHistory":"مسح السجل","menu.endChat":"إنهاء المحادثة",
"menu.historyNote":"يبقى السجل فقط على هذا الجهاز، مرتبطًا باسم الشخص الذي تتحدث معه. لا يحتفظ به أي خادم.",
"footer.text":"برنامج حر ومفتوح المصدر (رخصة Apache 2.0)، مشروع تابع لـ DigitalValut APS ETS.",
"footer.noserver":"بلا خادم: الاتصال مباشر بين المتصفحين عبر WebRTC.",
"footer.author":"صمّمه الدكتور جوزيبي فالسوني لصالح DigitalValut. © 2026 DigitalValut وفريق DigitalValut.",
"footer.license":"اقرأ رخصة المصدر المفتوح","footer.source":"الكود المصدري على GitHub",
"verify.badge":"تحقّق","verify.title":"رمز الأمان",
"verify.lead":"قارنه مع الشخص الآخر — بصوت عالٍ، عبر الهاتف، أو عبر قناة مختلفة عن تلك التي تبادلتما بها رمز الدعوة. إذا لم يتطابق الرمزان تمامًا، فقد يكون شخص ما قد تدخّل في الاتصال: لا تثق بتلك المحادثة.",
"verify.close":"إغلاق","verify.unavailable":"غير جاهز بعد — أعد المحاولة بعد لحظة.",
"contacts.title":"جهات الاتصال الأخيرة",
"contacts.note":"لمسة واحدة لرؤيتهم مجددًا: ما قلتماه لبعضكما بقي هنا. في كل مرة تحتاجان إلى دعوة جديدة، لأن لا خادم يبقي أحدًا متصلًا نيابة عنكما.",
"toast.sealCopied":"تم نسخ الرمز","toast.copyFail":"فشل النسخ — حدّد وانسخ يدويًا","toast.copySelected":"فشل النسخ — تم تحديد الرمز لك، فقط اضغط Ctrl/Cmd+C",
"call.busy":"لم يرد — مشغول في مكالمة أخرى.","call.declinedBy":"رفض المكالمة.","call.connectFailed":"لم يتم توصيل المكالمة. حاول مرة أخرى.",
"call.joined":"انضم إلى المحادثة.","call.videoInvite":"يتصل بك بالفيديو","call.audioInvite":"يتصل بك",
"call.inVideo":"مكالمة فيديو جارية…","call.inAudio":"مكالمة جارية…","call.ringingVideo":"اتصال فيديو، في انتظار الرد…","call.ringingAudio":"اتصال جارٍ، في انتظار الرد…",
"call.micFail":"الميكروفون أو الكاميرا غير متاحين، أو تم رفض الإذن.",
"call.micFailNotFound":"لم يُعثر على ميكروفون أو كاميرا على هذا الجهاز.",
"call.micFailBusy":"الميكروفون أو الكاميرا قيد الاستخدام بالفعل من تطبيق آخر (Zoom، Teams، تبويب آخر…). أغلقه وأعد المحاولة.",
"call.micFailDenied":"حظر المتصفح الميكروفون والكاميرا لهذا الموقع. اتبع الخطوات أدناه، ثم أعد تحميل الصفحة.",
"reconnect.trying":"جارٍ محاولة إعادة الاتصال بـ {n}…",
"reconnect.offline":"{n} لا يبدو متصلًا الآن. إليك الرمز لإرساله يدويًا.",
"call.noSpeakerFound":"تعذّر العثور على مكبر صوت منفصل على هذا الهاتف.",
"call.speakerFail":"تعذّر تبديل مكبر الصوت على هذا الهاتف.",
"destruct.countdown":"سيُدمَّر ذاتيًا خلال ","destruct.done":"تم تدمير المحادثة ذاتيًا.",
"session.closed":"مغلقة","session.newHint":"أنشئ جلسة جديدة لإعادة الاتصال.",
"invite.shareText":"هل تودّ الدردشة معي على DigitalValut Logos؟ افتح هذا الرابط: إذا لم تكن الصفحة جاهزة لديك، ستُفتح من تلقاء نفسها مع دعوتي معبأة بالفعل.\n\n",
"invite.answerText":"إليك ردّي على DigitalValut Logos، الصقه لإتمام الاتصال:\n\n",
"mic.recording":"جارٍ التسجيل — اضغط للإيقاف","history.cleared":"تم مسح السجل على هذا الجهاز.",
"install.genericText":"<b>ثبّت DigitalValut Logos</b> لتحصل عليه كتطبيق، بأيقونته الخاصة، دون الحاجة إلى متصفح.",
"install.iosText":"<b>ثبّت DigitalValut Logos على آيفون أو آيباد.</b> اضغط <b>مشاركة</b> في سفاري، ثم <b>إضافة إلى الشاشة الرئيسية</b>.",
"home.shareApp":"أخبر أحدهم عن التطبيق",
"start.s1":"أرسل الدعوة",
"start.s1help":"اضغط الزر البرتقالي. يُجهّز التطبيق الدعوة ويتيح لك اختيار طريقة إرسالها: واتساب، رسالة، بريد إلكتروني — ما تستخدمه عادة.",
"start.s2":"الصق ردّهم",
"start.s2help":"سيرسلون إليك رسالة ردًا. انسخها، عد إلى هنا واضغط <b>لصق</b>. ثم تدخلان معًا إلى المحادثة.",
"join.s1":"افتح الدعوة",
"join.s1help":"إذا فتحت الرابط الذي أرسلوه لك، فكل شيء جاهز: اضغط الزر البرتقالي. وإلا اضغط <b>لصق</b>.",
"join.s2":"أرسل الردّ",
"join.s2help":"الخطوة الأخيرة: أرسل هذا مرة أخرى إلى من دعاك، وستكونان متصلَين.",
"btn.paste":"لصق","btn.showCode":"إظهار الرمز",
"toast.clipboardEmpty":"لا يوجد شيء للصقه.","toast.pasteManually":"اضغط مطولًا على المربع واختر لصق.",
"home.shareAppText":"مجاني، بلا حساب، يعمل على أي هاتف أو كمبيوتر، يرسل الصور والملفات بجودتها الأصلية — DigitalValut Logos:\n\n",
"lock.title":"حماية إضافية",
"lock.sub":"يقفل الدعوة بعبارة سرية تنطقها بصوت عالٍ. يستحق التفعيل إذا مرّ الرمز عبر واتساب أو البريد الإلكتروني أو الرسائل النصية.",
"lock.passCap":"العبارة السرية",
"lock.passHint":"انطقها بصوت عالٍ، أو أرسلها عبر قناة مختلفة عن الرمز. بدونها لن يُفتح الرمز.",
"lock.ask":"هذه الدعوة مقفلة. اكتب العبارة السرية التي قيلت لك بصوت عالٍ.",
"lock.askPh":"العبارة السرية","lock.working":"لحظة واحدة…",
"lock.needPass":"اكتب العبارة السرية لفتح هذه الدعوة.",
"lock.wrongPass":"عبارة سرية خاطئة. تحقق منها وأعد المحاولة.",
"lock.badAnswer":"ردّ غير صالح — أو تم إغلاقه بعبارة سرية مختلفة.",
"join.badCode":"هذا الرمز غير صالح. تحقق من أنك نسخته كاملًا.",
"connect.waiting":"في انتظار الاتصال…",
"connect.failed":"تعذّر الاتصال. تأكدا من أن كليكما متصل بالإنترنت، ثم أنشئا دعوة جديدة — لا يمكن إعادة استخدام الرموز القديمة.",
"connect.slow":"هذا يستغرق وقتًا أطول من المعتاد — يحدث هذا في الشبكات شديدة التصفية (أماكن العمل، بعض شبكات الجوال) أو إذا لم تكونا متصلَين في الوقت نفسه. انتظرا قليلًا بعد، أو أنشئا دعوة جديدة.",
"footer.seal":"بصمات هذا التطبيق (SHA-256):",
"verify.known":"تم التحقق","verify.changedShort":"تغيّر الرمز","verify.accept":"قبول الرمز الجديد",
"verify.noteKnown":"نفس الرمز كالمرة السابقة: لم يتدخّل أحد منذ ذلك الحين.",
"verify.noteNew":"أول مرة مع هذا الشخص: قارنا الرمز بصوت عالٍ، ثم يتذكره التطبيق.",
"verify.noteChanged":"تغيّر الرمز. عادةً ما يعني ذلك هاتفًا جديدًا أو تطبيقًا أُعيد تثبيته — لكنه أيضًا ما يبدو عليه الاعتراض. قارناه بصوت عالٍ قبل قبوله.",
"quick.titleA":"رمزك",
"quick.helpA":"أرسله بالزر أدناه — لمسة واحدة وسيدخلان. أو انطق الأرقام الستة بصوت عالٍ. يستمر بالعمل طالما بقيت في هذه الشاشة.",
"quick.orType":"أو افتح التطبيق واكتب هذا الرمز:","quick.qrHint":"أو وجّه كاميرا هاتف إلى هنا",
"quick.newCode":"إنشاء رمز جديد","quick.useLong":"تفضّل الرمز الطويل؟",
"quick.titleB":"اكتب الرمز",
"quick.helpB":"اطلب الرمز ممن دعاك — 6 أرقام، منطوقة بصوت عالٍ أو مكتوبة — واكتبه هنا.",
"quick.codePh":"٠٠٠٠٠٠","quick.connect":"اتصال",
"quick.waiting":"في انتظار أن يكتب الشخص الآخر الرمز…","quick.expired":"انتهت صلاحية الرمز بلا رد. أنشئ رمزًا جديدًا.",
"quick.notFound":"الرمز منتهي الصلاحية أو خاطئ. تحقق منه مع من أعطاك إياه.",
"quick.shareText":"إليك الرابط للتحدث معي على DigitalValut Logos. المسه وسنكون متصلَين:",
"quick.share":"إرسال الدعوة",
"notify.title":"أعلمني عندما يبحث عني أحد",
"notify.sub":"إشعار إذا حاول أحد جهات اتصالك الوصول إليك ولم يكن التطبيق مفتوحًا لديك — بلا اسم، بلا رسالة، مجرد تنبيه.",
"notify.iosHint":"على آيفون، يعمل هذا فقط بعد إضافة التطبيق إلى شاشتك الرئيسية أولًا: اضغط <b>مشاركة</b> في سفاري، ثم <b>إضافة إلى الشاشة الرئيسية</b>، وافتح التطبيق من هناك.",
"notify.blocked":"حظر المتصفح الإشعارات. تحقق من إعدادات الموقع.",
"sas.title":"فحص الأمان",
"sas.lead":"انطقا هذه الكلمات الثلاث لبعضكما بصوت عالٍ. إذا رأيتما نفس الكلمات، فلم يتدخّل أحد.",
"sas.leadChanged":"احذر: هذا الشخص لم يعد يبدو نفسه كالمرة السابقة. عادةً ما يعني ذلك هاتفًا جديدًا أو تطبيقًا أُعيد تثبيته — لكنه أيضًا ما يبدو عليه الاعتراض. انطقا الكلمات الثلاث بصوت عالٍ قبل المتابعة.",
"sas.yes":"نعم، متطابقة","sas.no":"لا، مختلفة",
"sas.note":"مطلوب فقط في المرة الأولى مع هذا الشخص: بعدها، يتذكره التطبيق.",
"sas.confirmed":"تم التحقق من جهة الاتصال.",
"sas.refused":"الكلمات غير متطابقة: لا تُعتبر هذه المحادثة آمنة. أغلقها وابدآ من جديد برمز جديد.",
"connect.bigTitle":"جارٍ الاتصال…","connect.bigHint":"لا تغلق التطبيق — يستغرق الأمر ثوانٍ قليلة فقط.",
"autoclean.title":"تنظيف تلقائي","autoclean.sub":"يحذف تلقائيًا المحادثات الأقدم من عدد معين من الأيام، حتى لا تستمر في شغل مساحة على هاتفك. متوقف افتراضيًا: لا يُحذف شيء تلقائيًا أبدًا ما لم تفعّل هذا بنفسك.","autoclean.after":"حذف المحادثات الأقدم من:","autoclean.d7":"7 أيام","autoclean.d30":"30 يومًا","autoclean.d90":"90 يومًا","autoclean.d365":"سنة واحدة",
"wake.waitsNote":"يمكنك إغلاق التطبيق: سأخبرك عندما تُفتح الدعوة.","wake.calling":"أُبلغ {name}…","wake.callingHint":"لقد رنّ هاتفه. بمجرد فتح التطبيق ستكونان متصلين — يمكنك الانتظار هنا.","wake.noAnswer":"تم إبلاغه لكنه لم يفتح التطبيق بعد. حاول لاحقًا.",
"quick.helpAWaits":"أرسله بالزر أدناه — يكفي أن يلمسه الشخص الآخر ليدخل. أو اقرأ له الأرقام الستة بصوت عالٍ.",
"verify.inPerson":"تم التحقق شخصيًا","verify.inPersonDone":"تم التحقق شخصيًا: لقد مسحت الرمز من شاشة هذا الشخص نفسه، فلا يمكن لأحد أن يكون قد توسّط بينكما. لا حاجة لقول الكلمات الثلاث.","sas.leadMismatch":"انتبه: من ردّ ليس الهاتف الذي مسحت رمزه. قد يكون خطأً، لكنه أيضًا بالضبط ما كنت ستراه لو تدخّل أحد بينكما. لا تكتب شيئًا قبل أن تتبادلا الكلمات الثلاث بصوت مسموع.",
"easy.title":"الوضع البسيط","easy.sub":"زرّان كبيران فقط ولا شيء آخر حولهما. لمن لا يريد التفكير في شيء — أو لمن يُعدّ الهاتف لشخص آخر.","easy.voiceTitle":"قُلها بصوت عالٍ","easy.voiceSub":"يقول لك التطبيق بصوت عالٍ ما عليك فعله، بلغتك. لمن يجد صعوبة في قراءة الشاشة.","easy.voiceOn":"حسنًا. من الآن سأقول لك بصوت عالٍ ما عليك فعله.","easy.sayHome":"المس الزر الأول لبدء محادثة. والمس الثاني إذا أرسل لك أحدهم دعوة.","easy.sayStart":"هذا هو رمزك. اضغط الزر البرتقالي لإرساله لمن تشاء.","easy.sayJoin":"اكتب الأرقام الستة التي أُعطيت لك.","easy.sayChat":"تم الاتصال. يمكنكما التحدث الآن.",
"broker.down":"الخدمة التي تساعدكما على إيجاد بعضكما لا تستجيب. الرمز الطويل بالأسفل يعمل رغم ذلك: فهو لا يمر عبر أي خادم إطلاقًا.",
"flash.title":"تم الاتصال","flash.titleWith":"تم الاتصال بـ {name}","flash.direct":"اتصال مباشر بين هاتفيكما","flash.relay":"اتصال عبر جسر مشفَّر — شبكتكما لم تسمح بالاتصال المباشر","flash.noserver":"لا يستطيع أي خادم قراءة ما تتبادلانه","flash.time":"خلال {s} ثانية، دون التسجيل في أي شيء",
"viral.title":"نجح الأمر.","viral.sub":"إن كان مفيدًا، مرّره لغيرك: مجاني، لا يطلب حسابًا، ولا يحتفظ بشيء عن أحد.","viral.btn":"أخبر شخصًا عنه",
"media.title":"الميكروفون والكاميرا","media.warnDenied":"هذا المتصفح يحجب الميكروفون: لن تتمكن من إجراء المكالمات أو استقبالها.","media.warnFix":"كيف تُصلحها","media.retry":"أعد المحاولة","media.close":"إغلاق","media.nowOk":"الميكروفون يعمل. يمكنك الاتصال الآن.","media.peerNoMic":"{name}: تم الرد، لكن المتصفح يمنع تشغيل الميكروفون. ليس رفضًا.","media.peerNoCam":"{name}: تم الرد، لكن المتصفح يمنع تشغيل الكاميرا والميكروفون. ليس رفضًا — جرّبا مكالمة صوتية فقط.","media.stepsIos":"افتح <b>الإعدادات</b> على الآيفون|انزل واضغط <b>Safari</b>|اضغط <b>الميكروفون</b> ثم <b>الكاميرا</b>: اجعلهما <b>اسأل</b> أو <b>اسمح</b>|عُد إلى هنا وأعد تحميل الصفحة","media.stepsAndroid":"اضغط على <b>القفل</b> بجوار العنوان في الأعلى|اضغط <b>الأذونات</b>|فعّل <b>الميكروفون</b> و<b>الكاميرا</b>|أعد تحميل الصفحة","media.stepsChrome":"اضغط على <b>القفل</b> يسار العنوان|فعّل <b>الميكروفون</b> و<b>الكاميرا</b>|أعد تحميل الصفحة","media.stepsSafariMac":"من شريط القوائم افتح <b>Safari</b> › <b>إعدادات هذا الموقع</b>|اجعل <b>الميكروفون</b> و<b>الكاميرا</b> على <b>السماح</b>|أعد تحميل الصفحة","media.stepsFirefox":"اضغط على <b>القفل</b> يسار العنوان|أزل الحجب بجوار <b>استخدام الميكروفون</b> و<b>استخدام الكاميرا</b>|أعد تحميل الصفحة","media.stepsOther":"افتح إعدادات المتصفح لهذا الموقع|اسمح بـ<b>الميكروفون</b> و<b>الكاميرا</b>|أعد تحميل الصفحة",
"addr.title":"عنوانك الدائم","addr.sub":"أعطِه بدلًا من رقم هاتفك. من يملكه يستطيع الوصول إليك متى شاء، دون معرفة اسمك ولا رقمك. متوقف افتراضيًا.","addr.qrHint":"من يمسحه يتصل بك مباشرة","addr.share":"أرسل عنوانك","addr.showQr":"أظهر رمز QR","addr.reachNote":"لكي يصلوا إليك حتى والتطبيق مغلق، فعّل التنبيهات في الأسفل.","addr.dialLabel":"هل لديك عنوان أحدهم؟","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"اتصل به","addr.badFormat":"هذا العنوان مكتوب بشكل خاطئ. إنه 12 حرفًا، مثل DV-K7M2-9QRT-X4WP.","addr.itsYou":"هذا عنوانك أنت.","addr.callingTitle":"جارٍ الاتصال…","addr.callingHint":"إن كان تطبيقه مغلقًا سأجعل هاتفه يرن. قد يستغرق الأمر لحظة.","addr.noAnswer":"لم يردّ. لقد نبّهته: حاول لاحقًا.","addr.dialFailed":"لم أتمكن من الاتصال بهذا العنوان.","addr.noKey":"لا يبدو أن هذا العنوان لا يزال نشطًا. اطلب من الشخص أن يعيد فتح التطبيق ويرسله إليك مرة أخرى: تغيّرت العناوين مع التحديث الأخير.","addr.noBroker":"لم أتمكن حتى من بدء الاتصال: الخدمة التي تجمعكما لم تُجب. إذا كنت تستخدم نسخة من التطبيق على عنوان آخر، فافتح النسخة الرسمية.","addr.incomingTitle":"أحدهم يبحث عنك","addr.incomingSub":"الاسم والسبب كتبهما من يتصل بك: إلى أن تقبل، لا أحد يستطيع إثبات أنه فعلًا ذلك الشخص.","addr.incomingToast":"أحدهم يتصل بعنوانك.","addr.accept":"اقبل","addr.ignore":"تجاهل","addr.verified":"تم التحقق: من ردّ يملك فعلًا العنوان {a}. لا يمكن لأحد أن يكون قد توسّط.","addr.blockedIn":"اتصال من شخص سبق أن رفضته: تم تجاهله.","addr.shareText":"يمكنك الوصول إليّ هنا، دون رقم هاتفي. عنواني على DigitalValut Logos هو {a}\n\nاضغط للاتصال بي:",
"addr.incomingAt":"عبر «{name}»","burn.title":"عناوين للاستعمال مرة واحدة","burn.help":"واحد لكل إعلان، وواحد لكل غريب. احذفه عند الانتهاء فلا يعود ذلك الشخص يصل إليك — لم يحصل على عنوانك الحقيقي أصلًا.","burn.namePh":"لماذا؟ مثلًا: أريكة مستعملة","burn.add":"إنشاء","burn.send":"أرسل هذا العنوان","burn.delete":"احذف","burn.deleted":"تم حذف «{name}». هذا العنوان لم يعد يردّ.","burn.made":"تم إنشاء «{name}». يمكنك إعطاؤه الآن.","burn.needName":"أعطه اسمًا لتعرف لمن أعطيته.","burn.full":"يمكنك الاحتفاظ بـ {n} في وقت واحد. احذف واحدًا لإنشاء آخر.","burn.untitled":"بلا اسم",
"knock.title":"أنت تتواصل مع","knock.nameLabel":"ما اسمك؟","knock.namePh":"اسمك","knock.msgLabel":"ماذا تحتاج؟ (اختياري)","knock.msgPh":"مثلًا: هل لديكم حذاء مقاس 42؟","knock.go":"اتصل","knock.note":"اسمك وهذه الجملة لا يراهما إلا الشخص الذي تتصل به. لا يستطيع أي خادم قراءتهما.",
"letter.title":"رسائل تُركت لك","letter.noneTitle":"لا أحد يردّ الآن.","letter.noneSub":"أخبرتها بالفعل أنك حاولت الوصول إليها. إذا أردت أن تقول المزيد، اكتبه هنا.","letter.ph":"اكتب رسالتك هنا","letter.leave":"اترك الرسالة","letter.cancel":"لا بأس","letter.needText":"اكتب كلمتين ليعرف ماذا أردت.","letter.left":"تُركت الرسالة. سيجدها عند فتح التطبيق.","letter.failed":"لم أتمكن من ترك الرسالة. حاول مرة أخرى.","letter.callBack":"عاود الاتصال","letter.dismiss":"تم",
"home.bigStart":"تحدّث مع أحدهم","home.bigStartD":"أنشئ دعوة لإرسالها","home.bigJoin":"لديّ رمز","home.bigJoinD":"أرسل لي أحدهم دعوة","set.lang":"اللغة","set.textsize":"حجم النص","conn.direct":"اتصال مباشر بين الهاتفين","conn.directShort":"متصل مباشرة","conn.relay":"اتصال آمن عبر جسر مشفَّر","conn.relayShort":"متصل (جسر)","conn.down":"انقطع الاتصال","conn.downShort":"منقطع","conn.working":"جارٍ الاتصال","conn.wobbly":"تذبذب الاتصال — أحاول استعادته","conn.wobblyShort":"جارٍ الاستعادة","chat.linkLost":"انقطع الاتصال. لم يُفقد شيء — أعد فتح التطبيق وأعد الاتصال من جهات الاتصال الأخيرة.",
"call.flipFail":"لا أستطيع تبديل الكاميرا على هذا الهاتف.",
"call.flipBusy":"الكاميرا مستخدَمة من تطبيق آخر. أغلقه ثم حاول مجددًا.","call.flipDenied":"حظر المتصفح الكاميرا لهذا الموقع.","call.flipOnlyOne":"هذا الجهاز به كاميرا واحدة فقط.",
"home.alreadyTalking":"أنت بالفعل في محادثة. لبدء أخرى، أغلق هذه أولًا.","home.stillCalling":"ما زلت أتصل. انتظر الرد، أو ألغِ الاتصال.","home.busyReconnect":"أنت مشغول الآن. أنهِ الاتصال الحالي أو أغلقه قبل المحاولة مرة أخرى.",
"letter.missed":"أراد التحدث إليك.",
"sas.blocked":"قولا الكلمات الثلاث بصوت عالٍ أولًا: هذا الشخص لم يعد نفسه.",
"file.tooBig":"تم إيقاف ملف وارد: لم يطابق ما تم الإعلان عنه.","file.sendFailed":"توقف الإرسال: أُغلق الاتصال في المنتصف.","file.progress":"{sent} من {total}",
"share.pending":"{n} ملف جاهز للإرسال — سُيرسل بمجرد الاتصال",
"health.storage":"ذاكرة الهاتف",
"health.storageFull":"ممتلئة: لم تعد المحادثات تُحفظ. أفرغ بعض المساحة في الهاتف.",
"addr.lifespan":"هذا العنوان لا تنتهي صلاحيته. يبقى صالحًا ما دامت بيانات التطبيق على هذا الهاتف.",
"health.addrLife":"كلمات الأمان",
"health.addrLifeOk":"مستقرة لنحو {n} يومًا أخرى.",
"health.addrLifeSoon":"بعد نحو {n} يومًا ستتغيّر من تلقاء نفسها. سيُطلب من معارفك التحقق منها معك مرة أخرى — وهذا ليس دليلًا على وجود خطأ.","health.addrKeyBad":"لا يستطيعون الوصول إليك: لم يتمكّن هذا الهاتف من نشر المفتاح الذي يُبنى عليه عنوانه. تحقّق من الاتصال وأعد فتح التطبيق.",
"health.title":"حالة التطبيق",
"health.sub":"إذا لم يستطع أحدهم الوصول إليك، فالسبب مذكور أدناه.",
"health.recheck":"تحقّق مرة أخرى",
"health.copy":"انسخ التقرير",
"health.copied":"تم نسخ التقرير.",
"health.checking":"جارٍ التحقق…",
"health.busy":"متوقف مؤقتًا: أنت بالفعل في محادثة.",
"health.stopped":"لست أستمع. أغلق التطبيق ثم افتحه من جديد.",
"health.addr":"من يملك عنوانك",
"health.addrOk":"يستطيع الاتصال بك الآن.",
"health.addrOff":"عنوانك مُطفأ. فعّله في الأعلى.",
"health.contacts":"جهات اتصالك",
"health.contactsOk":"يستطيعون إيجادك الآن.",
"health.contactsNone":"ليس لديك جهات اتصال بعد.",
"health.broker":"الخدمة التي تجمعكما",
"health.brokerOk":"يستجيب.",
"health.brokerBad":"لا يستجيب. تبقى الرموز الطويلة، وهي لا تمر بأي خادم.",
"health.brokerOrigin":"هذه النسخة من التطبيق على عنوان لا تعرفه الخدمة: لن تعمل من هنا. افتح النسخة الرسمية.",
"health.closed":"والتطبيق مغلق",
"health.closedOk":"يمكنهم جعل هاتفك يرن.",
"health.closedOff":"لا يصلون إليك. فعّل التنبيهات في الأعلى.",
"health.closedDenied":"المتصفح يحجب التنبيهات: والتطبيق مغلق لن يصل إليك أحد.",
"health.closedIos":"على iPhone عليك أولًا إضافة التطبيق إلى الشاشة الرئيسية.",
"health.mic":"الميكروفون",
"health.micOk":"متاح.",
"health.micBad":"محجوب من المتصفح: لن تتمكن من إجراء المكالمات ولا تلقّيها.",
"health.micUnknown":"لا أستطيع معرفة ذلك حتى تجرّب مكالمة.",
"health.version":"النسخة المستخدمة",
"health.versionOld":"جزء من التطبيق ما زال قديمًا. أغلقه ثم افتحه من جديد.",
"media.stepsAndroidApp":"ارجع إلى الشاشة الرئيسية للهاتف|اضغط مطولًا على أيقونة <b>DigitalValut Logos</b>|اضغط <b>معلومات التطبيق</b> (أو أيقونة ⓘ)|اضغط <b>الأذونات</b>، ثم فعّل <b>الميكروفون</b> و<b>الكاميرا</b>|أعد فتح التطبيق"
});

Object.assign(I18N.ur, {
"onboard.text":"<b>DigitalValut Logos</b> — مفت اور اوپن سورس سافٹ ویئر (Apache 2.0 لائسنس)، جو Associazione di Promozione Sociale DigitalValut کی ملکیت ہے، ایک رجسٹرڈ اطالوی غیر منافع بخش تنظیم (Ente del Terzo Settore)۔ دنیا میں کہیں بھی، کوئی بھی اسے مفت ڈاؤن لوڈ اور استعمال کر سکتا ہے۔",
"install.btn":"انسٹال کریں",
"home.title":"جس سے چاہیں بات کریں، وہ جہاں بھی ہو",
"home.sub":"پیغامات، تصاویر، ویڈیو، کالز۔ کوئی سائن اپ نہیں، کوئی فون نمبر نہیں، ہمیشہ کے لیے مفت۔",
"home.nameLabel":"آپ کا نام","home.namePh":"آپ کا نام",


"home.legalSummary":"یہ کیسے کام کرتا ہے، تین تکنیکی سطروں میں",
"home.legalBody":"یہ آپ کا نیٹ ورک ایڈریس (IP) اس شخص کو ظاہر کرتا ہے جس سے آپ بات کر رہے ہیں؛ دونوں کا ایک ہی وقت میں آن لائن ہونا ضروری ہے، ورنہ کچھ نہیں پہنچے گا، اور سخت فلٹر شدہ نیٹ ورکس پر کالز کنیکٹ نہیں ہو سکتیں؛ کوئی ویب سائٹ کبھی بھی اسکرین شاٹ نہیں روک سکتی۔",
"nav.back":"واپس",
"start.create":"دعوت تیار کریں","start.share":"دعوت بھیجیں","btn.copyCode":"کوڈ کاپی کریں",
"start.pastePh":"جواب یہاں پیسٹ کریں…","btn.connect":"چیٹ میں جائیں",
"join.pastePh":"دعوت یہاں پیسٹ کریں…","join.generate":"دعوت کھولیں",
"join.sendAnswer":"جواب بھیجیں",
"chat.someone":"کوئی","chat.connected":"منسلک","chat.typePh":"ایک پیغام لکھیں…","chat.dropHere":"بھیجنے کے لیے یہاں چھوڑیں",
"call.hangup":"ختم کریں","call.accept":"جواب دیں","call.decline":"مسترد کریں",
"menu.title":"ٹولز","menu.arm":"خود کار تباہی","menu.disarm":"منسوخ کریں",
"menu.clearHistory":"تاریخ صاف کریں","menu.endChat":"چیٹ ختم کریں",
"menu.historyNote":"تاریخ صرف اس ڈیوائس پر رہتی ہے، اس شخص کے نام سے منسلک جس سے آپ بات کر رہے ہیں۔ کوئی سرور اسے محفوظ نہیں رکھتا۔",
"footer.text":"مفت اور اوپن سورس سافٹ ویئر (Apache 2.0 لائسنس)، DigitalValut APS ETS کا ایک منصوبہ۔",
"footer.noserver":"کوئی سرور نہیں: کنکشن WebRTC کے ذریعے دونوں براؤزرز کے درمیان براہ راست ہے۔",
"footer.author":"ڈاکٹر جوزیپے فالسونے نے DigitalValut کے لیے تصور کیا۔ © 2026 DigitalValut اور DigitalValut ٹیم۔",
"footer.license":"اوپن سورس لائسنس پڑھیں","footer.source":"GitHub پر سورس کوڈ",
"verify.badge":"تصدیق کریں","verify.title":"سیکیورٹی کوڈ",
"verify.lead":"اسے دوسرے شخص سے موازنہ کریں — بلند آواز میں، فون پر، یا کسی ایسے ذریعے پر جو دعوتی کوڈ کے تبادلے سے مختلف ہو۔ اگر دونوں کوڈز بالکل میل نہ کھائیں، تو ہو سکتا ہے کسی نے کنکشن میں مداخلت کی ہو: اس چیٹ پر بھروسہ نہ کریں۔",
"verify.close":"بند کریں","verify.unavailable":"ابھی تیار نہیں — تھوڑی دیر میں دوبارہ کوشش کریں۔",
"contacts.title":"حالیہ رابطے",
"contacts.note":"دوبارہ دیکھنے کے لیے ایک ٹچ: جو کچھ آپ نے ایک دوسرے سے کہا وہ یہاں رہا۔ ہر بار ایک نئی دعوت درکار ہوتی ہے، کیونکہ کوئی سرور آپ کی جگہ کسی کو منسلک نہیں رکھتا۔",
"toast.sealCopied":"کوڈ کاپی ہو گیا","toast.copyFail":"کاپی ناکام — دستی طور پر منتخب کریں اور کاپی کریں","toast.copySelected":"کاپی ناکام — کوڈ آپ کے لیے منتخب کر دیا گیا، بس Ctrl/Cmd+C دبائیں",
"call.busy":"جواب نہیں دیا — کسی اور کال میں مصروف۔","call.declinedBy":"کال مسترد کر دی۔","call.connectFailed":"کال منسلک نہیں ہو سکی۔ دوبارہ کوشش کریں۔",
"call.joined":"چیٹ میں شامل ہو گیا۔","call.videoInvite":"آپ کو ویڈیو کال کر رہا ہے","call.audioInvite":"آپ کو کال کر رہا ہے",
"call.inVideo":"ویڈیو کال جاری ہے…","call.inAudio":"کال جاری ہے…","call.ringingVideo":"ویڈیو کال ہو رہی ہے، جواب کا انتظار…","call.ringingAudio":"کال ہو رہی ہے، جواب کا انتظار…",
"call.micFail":"مائیکروفون یا کیمرا دستیاب نہیں، یا اجازت مسترد کر دی گئی۔",
"call.micFailNotFound":"اس ڈیوائس پر کوئی مائیکروفون یا کیمرا نہیں ملا۔",
"call.micFailBusy":"آپ کا مائیکروفون یا کیمرا پہلے سے کسی اور ایپ کے زیر استعمال ہے (Zoom، Teams، ایک اور ٹیب…)۔ اسے بند کریں اور دوبارہ کوشش کریں۔",
"call.micFailDenied":"براؤزر نے اس سائٹ کے لیے مائیکروفون اور کیمرا بلاک کر دیا ہے۔ نیچے دیے گئے مراحل پر عمل کریں، پھر صفحہ دوبارہ لوڈ کریں۔",
"reconnect.trying":"{n} سے دوبارہ رابطہ کرنے کی کوشش ہو رہی ہے…",
"reconnect.offline":"{n} ابھی آن لائن نظر نہیں آتا۔ یہ ہے دستی طور پر بھیجنے کے لیے کوڈ۔",
"call.noSpeakerFound":"اس فون پر الگ اسپیکر نہیں مل سکا۔",
"call.speakerFail":"اس فون پر اسپیکر تبدیل نہیں ہو سکتا۔",
"destruct.countdown":"اتنی دیر میں خود کار تباہی: ","destruct.done":"گفتگو خود بخود تباہ ہو گئی۔",
"session.closed":"بند","session.newHint":"دوبارہ رابطے کے لیے نیا سیشن بنائیں۔",
"invite.shareText":"کیا آپ DigitalValut Logos پر مجھ سے بات کرنا چاہیں گے؟ یہ لنک کھولیں: اگر صفحہ تیار نہیں ہے، تو یہ خود بخود کھل جائے گا اور میری دعوت پہلے سے بھری ہوگی۔\n\n",
"invite.answerText":"یہ ہے DigitalValut Logos کے لیے میرا جواب، کنکشن مکمل کرنے کے لیے اسے پیسٹ کریں:\n\n",
"mic.recording":"ریکارڈنگ جاری — روکنے کے لیے ٹچ کریں","history.cleared":"اس ڈیوائس پر تاریخ صاف کر دی گئی۔",
"install.genericText":"<b>DigitalValut Logos انسٹال کریں</b> تاکہ یہ اپنے آئیکن کے ساتھ ایک ایپ کے طور پر ہو، بغیر براؤزر کی ضرورت کے۔",
"install.iosText":"<b>آئی فون یا آئی پیڈ پر DigitalValut Logos انسٹال کریں۔</b> سفاری میں <b>شیئر</b> پر ٹچ کریں، پھر <b>ہوم اسکرین پر شامل کریں</b>۔",
"home.shareApp":"کسی کو ایپ کے بارے میں بتائیں",
"start.s1":"دعوت بھیجیں",
"start.s1help":"نارنجی بٹن دبائیں۔ ایپ دعوت تیار کرتی ہے اور آپ کو منتخب کرنے دیتی ہے کہ اسے کیسے بھیجنا ہے: واٹس ایپ، ایک پیغام، ای میل — جو بھی آپ عام طور پر استعمال کرتے ہیں۔",
"start.s2":"ان کا جواب پیسٹ کریں",
"start.s2help":"وہ آپ کو واپس ایک پیغام بھیجیں گے۔ اسے کاپی کریں، یہاں واپس آئیں اور <b>پیسٹ</b> دبائیں۔ پھر آپ دونوں ساتھ چیٹ میں داخل ہوں گے۔",
"join.s1":"دعوت کھولیں",
"join.s1help":"اگر آپ نے وہ لنک کھولا جو آپ کو بھیجا گیا تھا، تو سب کچھ تیار ہے: نارنجی بٹن دبائیں۔ ورنہ <b>پیسٹ</b> دبائیں۔",
"join.s2":"جواب بھیجیں",
"join.s2help":"آخری مرحلہ: یہ اس شخص کو واپس بھیجیں جس نے آپ کو مدعو کیا، اور آپ منسلک ہو جائیں گے۔",
"btn.paste":"پیسٹ کریں","btn.showCode":"کوڈ دکھائیں",
"toast.clipboardEmpty":"پیسٹ کرنے کے لیے کچھ نہیں ہے۔","toast.pasteManually":"باکس پر انگلی دبائے رکھیں اور پیسٹ منتخب کریں۔",
"home.shareAppText":"مفت، بغیر اکاؤنٹ کے، کسی بھی فون یا کمپیوٹر پر کام کرتا ہے، تصاویر اور فائلیں اصل کوالٹی میں بھیجتا ہے — DigitalValut Logos:\n\n",
"lock.title":"اضافی تحفظ",
"lock.sub":"دعوت کو ایک پاس فریز سے لاک کرتا ہے جو آپ بلند آواز میں کہتے ہیں۔ اگر کوڈ واٹس ایپ، ای میل یا SMS سے گزرتا ہے تو اسے آن کرنا فائدہ مند ہے۔",
"lock.passCap":"پاس فریز",
"lock.passHint":"اسے بلند آواز میں کہیں، یا کوڈ سے مختلف ذریعے پر بھیجیں۔ اس کے بغیر کوڈ نہیں کھلے گا۔",
"lock.ask":"یہ دعوت مقفل ہے۔ وہ پاس فریز ٹائپ کریں جو آپ کو بلند آواز میں بتائی گئی۔",
"lock.askPh":"پاس فریز","lock.working":"ایک لمحہ…",
"lock.needPass":"اس دعوت کو کھولنے کے لیے پاس فریز ٹائپ کریں۔",
"lock.wrongPass":"غلط پاس فریز۔ اسے چیک کریں اور دوبارہ کوشش کریں۔",
"lock.badAnswer":"غلط جواب — یا اسے مختلف پاس فریز سے سیل کیا گیا تھا۔",
"join.badCode":"یہ کوڈ درست نہیں ہے۔ چیک کریں کہ آپ نے اسے مکمل کاپی کیا ہے۔",
"connect.waiting":"کنکشن کا انتظار ہو رہا ہے…",
"connect.failed":"کنکٹ نہیں ہو سکا۔ یقینی بنائیں کہ آپ دونوں آن لائن ہیں، پھر ایک نئی دعوت بنائیں — پرانے کوڈز دوبارہ استعمال نہیں ہو سکتے۔",
"connect.slow":"اس میں معمول سے زیادہ وقت لگ رہا ہے — ایسا سخت فلٹر شدہ نیٹ ورکس (دفاتر، بعض موبائل نیٹ ورکس) پر ہوتا ہے یا اگر آپ ایک ہی وقت میں آن لائن نہیں ہیں۔ تھوڑی دیر مزید انتظار کریں، یا ایک نئی دعوت بنائیں۔",
"footer.seal":"اس ایپ کے فنگرپرنٹس (SHA-256):",
"verify.known":"تصدیق شدہ","verify.changedShort":"کوڈ تبدیل ہو گیا","verify.accept":"نیا کوڈ قبول کریں",
"verify.noteKnown":"پچھلی بار جیسا ہی کوڈ: تب سے کسی نے مداخلت نہیں کی۔",
"verify.noteNew":"اس شخص کے ساتھ پہلی بار: کوڈ کا بلند آواز میں موازنہ کریں، پھر ایپ اسے یاد رکھے گی۔",
"verify.noteChanged":"کوڈ تبدیل ہو گیا ہے۔ عام طور پر اس کا مطلب ہے نیا فون یا دوبارہ انسٹال کی گئی ایپ — لیکن یہ مداخلت کی علامت بھی ہو سکتی ہے۔ قبول کرنے سے پہلے اس کا بلند آواز میں موازنہ کریں۔",
"quick.titleA":"آپ کا کوڈ",
"quick.helpA":"نیچے دیے گئے بٹن سے اسے بھیجیں — ایک ٹچ اور وہ اندر آ جائیں گے۔ یا چھ ہندسے بلند آواز میں بتائیں۔ جب تک آپ اس اسکرین پر رہیں گے یہ کام کرتا رہے گا۔",
"quick.orType":"یا ایپ کھولیں اور یہ کوڈ ٹائپ کریں:","quick.qrHint":"یا فون کیمرا یہاں دکھائیں",
"quick.newCode":"نیا کوڈ بنائیں","quick.useLong":"لمبا کوڈ ترجیح دیتے ہیں؟",
"quick.titleB":"کوڈ ٹائپ کریں",
"quick.helpB":"جس نے آپ کو مدعو کیا اس سے کوڈ مانگیں — 6 ہندسے، بلند آواز میں بتائے گئے یا لکھے گئے — اور یہاں ٹائپ کریں۔",
"quick.codePh":"000000","quick.connect":"کنیکٹ کریں",
"quick.waiting":"دوسرے شخص کے کوڈ ٹائپ کرنے کا انتظار ہو رہا ہے…","quick.expired":"کوڈ بغیر جواب کے ختم ہو گیا۔ ایک نیا بنائیں۔",
"quick.notFound":"کوڈ ختم ہو گیا یا غلط ہے۔ جس نے آپ کو دیا اس سے چیک کریں۔",
"quick.shareText":"یہ ہے DigitalValut Logos پر مجھ سے بات کرنے کا لنک۔ اسے ٹچ کریں اور ہم منسلک ہو جائیں گے:",
"quick.share":"دعوت بھیجیں",
"notify.title":"مجھے بتائیں جب کوئی مجھے ڈھونڈے",
"notify.sub":"اگر کوئی رابطہ آپ تک پہنچنے کی کوشش کرے اور آپ کی ایپ کھلی نہ ہو تو ایک اطلاع — کوئی نام نہیں، کوئی پیغام نہیں، بس ایک اشارہ۔",
"notify.iosHint":"آئی فون پر یہ صرف اس وقت کام کرتا ہے جب آپ پہلے ایپ کو اپنی ہوم اسکرین پر شامل کر چکے ہوں: سفاری میں <b>شیئر</b> پر ٹچ کریں، پھر <b>ہوم اسکرین پر شامل کریں</b>، اور وہاں سے ایپ کھولیں۔",
"notify.blocked":"براؤزر نے اطلاعات بلاک کر دیں۔ سائٹ کی سیٹنگز چیک کریں۔",
"sas.title":"سیکیورٹی چیک",
"sas.lead":"یہ تین الفاظ ایک دوسرے کو بلند آواز میں بتائیں۔ اگر آپ دونوں ایک جیسے الفاظ دیکھیں، تو کسی نے مداخلت نہیں کی۔",
"sas.leadChanged":"احتیاط: یہ شخص اب پچھلی بار جیسا نظر نہیں آتا۔ عام طور پر اس کا مطلب ہے نیا فون یا دوبارہ انسٹال کی گئی ایپ — لیکن یہ مداخلت کی علامت بھی ہو سکتی ہے۔ جاری رکھنے سے پہلے تینوں الفاظ بلند آواز میں بتائیں۔",
"sas.yes":"ہاں، میل کھاتے ہیں","sas.no":"نہیں، مختلف ہیں",
"sas.note":"صرف اس شخص کے ساتھ پہلی بار درکار ہے: اس کے بعد، ایپ اسے یاد رکھتی ہے۔",
"sas.confirmed":"رابطہ تصدیق شدہ۔",
"sas.refused":"الفاظ میل نہیں کھاتے: یہ گفتگو محفوظ نہیں سمجھی جاتی۔ اسے بند کریں اور نئے کوڈ کے ساتھ دوبارہ شروع کریں۔",
"connect.bigTitle":"رابطہ قائم ہو رہا ہے…","connect.bigHint":"ایپ بند نہ کریں — اس میں صرف چند سیکنڈ لگتے ہیں۔",
"autoclean.title":"خودکار صفائی","autoclean.sub":"ایک مقررہ تعداد کے دنوں سے پرانی گفتگو کو خود بخود حذف کرتا ہے، تاکہ وہ آپ کے فون پر جگہ گھیرتی نہ رہیں۔ بطور ڈیفالٹ بند: جب تک آپ خود اسے آن نہ کریں، کچھ بھی خود بخود حذف نہیں ہوتا۔","autoclean.after":"اس سے پرانی گفتگو حذف کریں:","autoclean.d7":"7 دن","autoclean.d30":"30 دن","autoclean.d90":"90 دن","autoclean.d365":"1 سال",
"wake.waitsNote":"آپ ایپ بند کر سکتے ہیں: جب دعوت کھولی جائے گی تو میں آپ کو بتا دوں گا۔","wake.calling":"{name} کو اطلاع دی جا رہی ہے…","wake.callingHint":"ان کا فون بج چکا ہے۔ جیسے ہی وہ ایپ کھولیں گے آپ جڑ جائیں گے — آپ یہاں انتظار کر سکتے ہیں۔","wake.noAnswer":"انہیں اطلاع دے دی گئی ہے لیکن انہوں نے ابھی تک ایپ نہیں کھولی۔ بعد میں دوبارہ کوشش کریں۔",
"quick.helpAWaits":"نیچے دیے گئے بٹن سے بھیجیں — دوسرے شخص کو بس اسے چھونا ہے اور وہ اندر ہے۔ یا انہیں چھ ہندسے بول کر بتا دیں۔",
"verify.inPerson":"بالمشافہ تصدیق شدہ","verify.inPersonDone":"بالمشافہ تصدیق شدہ: آپ نے کوڈ اسی شخص کی اپنی اسکرین سے اسکین کیا ہے، لہٰذا کوئی درمیان میں نہیں آ سکتا۔ تین الفاظ کہنے کی ضرورت نہیں۔","sas.leadMismatch":"خبردار: جواب دینے والا وہ فون نہیں جس کا کوڈ آپ نے اسکین کیا تھا۔ یہ غلطی ہو سکتی ہے، لیکن اگر کوئی درمیان میں آ گیا ہوتا تو بھی بالکل ایسا ہی دکھائی دیتا۔ جب تک آپ ایک دوسرے کو تین الفاظ بول کر نہ بتا لیں، کچھ نہ لکھیں۔",
"easy.title":"آسان موڈ","easy.sub":"صرف دو بڑے بٹن اور ان کے ارد گرد کچھ نہیں۔ اُن کے لیے جو کچھ سوچنا نہیں چاہتے — یا اُس کے لیے جو کسی اور کا فون تیار کر رہا ہے۔","easy.voiceTitle":"بول کر بتاؤ","easy.voiceSub":"ایپ آپ کی زبان میں بول کر بتاتی ہے کہ کیا کرنا ہے۔ اُن کے لیے جنہیں اسکرین پڑھنا مشکل لگتا ہے۔","easy.voiceOn":"ٹھیک ہے۔ اب سے میں بول کر بتاؤں گا کہ کیا کرنا ہے۔","easy.sayHome":"بات چیت شروع کرنے کے لیے پہلا بٹن دبائیں۔ اگر کسی نے آپ کو دعوت بھیجی ہے تو دوسرا دبائیں۔","easy.sayStart":"یہ آپ کا کوڈ ہے۔ جسے چاہیں بھیجنے کے لیے نارنجی بٹن دبائیں۔","easy.sayJoin":"جو چھ ہندسے آپ کو دیے گئے ہیں وہ لکھیں۔","easy.sayChat":"رابطہ ہو گیا۔ اب آپ بات کر سکتے ہیں۔",
"broker.down":"وہ سروس جو آپ کو ایک دوسرے تک پہنچاتی ہے جواب نہیں دے رہی۔ نیچے دیا گیا لمبا کوڈ پھر بھی کام کرتا ہے: یہ کسی سرور سے نہیں گزرتا۔",
"flash.title":"منسلک ہو گئے","flash.titleWith":"{name} سے منسلک ہو گئے","flash.direct":"آپ کے دونوں فونز کے درمیان براہِ راست رابطہ","flash.relay":"خفیہ پل کے ذریعے رابطہ — آپ کے نیٹ ورک نے براہِ راست رابطے کی اجازت نہیں دی","flash.noserver":"کوئی سرور آپ کی باتیں نہیں پڑھ سکتا","flash.time":"{s} سیکنڈ میں، کہیں رجسٹر ہوئے بغیر",
"viral.title":"یہ کام کر گیا۔","viral.sub":"اگر مفید رہا تو آگے پہنچائیں: یہ مفت ہے، اکاؤنٹ نہیں مانگتا، اور کسی کا کچھ محفوظ نہیں رکھتا۔","viral.btn":"کسی کو بتائیں",
"media.title":"مائیکروفون اور کیمرہ","media.warnDenied":"یہ براؤزر مائیکروفون کو روک رہا ہے: آپ نہ کال کر سکیں گے نہ وصول۔","media.warnFix":"کیسے ٹھیک کریں","media.retry":"دوبارہ کوشش کریں","media.close":"بند کریں","media.nowOk":"مائیکروفون چل رہا ہے۔ اب آپ کال کر سکتے ہیں۔","media.peerNoMic":"{name} نے جواب دیا، لیکن ان کا براؤزر مائیکروفون آن نہیں کرنے دیتا۔ انہوں نے آپ کو انکار نہیں کیا۔","media.peerNoCam":"{name} نے جواب دیا، لیکن ان کا براؤزر کیمرہ اور مائیکروفون آن نہیں کرنے دیتا۔ صرف آواز والی کال آزمائیں، یا ان سے کہیں کہ پابندی ہٹا دیں۔","media.stepsIos":"آئی فون پر <b>ترتیبات</b> کھولیں|نیچے جا کر <b>Safari</b> پر ٹیپ کریں|<b>مائیکروفون</b> پھر <b>کیمرہ</b> پر ٹیپ کریں: <b>پوچھیں</b> یا <b>اجازت دیں</b> پر رکھیں|یہاں واپس آ کر صفحہ دوبارہ لوڈ کریں","media.stepsAndroid":"اوپر پتے کے پاس <b>تالے</b> پر ٹیپ کریں|<b>اجازتیں</b> پر ٹیپ کریں|<b>مائیکروفون</b> اور <b>کیمرہ</b> آن کریں|صفحہ دوبارہ لوڈ کریں","media.stepsChrome":"پتے کے بائیں طرف <b>تالے</b> پر کلک کریں|<b>مائیکروفون</b> اور <b>کیمرہ</b> آن کریں|صفحہ دوبارہ لوڈ کریں","media.stepsSafariMac":"مینو بار میں <b>Safari</b> › <b>اس ویب سائٹ کی ترتیبات</b> کھولیں|<b>مائیکروفون</b> اور <b>کیمرہ</b> کو <b>اجازت دیں</b> پر رکھیں|صفحہ دوبارہ لوڈ کریں","media.stepsFirefox":"پتے کے بائیں طرف <b>تالے</b> پر کلک کریں|<b>مائیکروفون استعمال کریں</b> اور <b>کیمرہ استعمال کریں</b> کے ساتھ پابندی ہٹائیں|صفحہ دوبارہ لوڈ کریں","media.stepsOther":"اس سائٹ کے لیے براؤزر کی ترتیبات کھولیں|<b>مائیکروفون</b> اور <b>کیمرہ</b> کی اجازت دیں|صفحہ دوبارہ لوڈ کریں",
"addr.title":"آپ کا مستقل پتہ","addr.sub":"فون نمبر کے بجائے یہ دیں۔ جس کے پاس یہ ہو وہ جب چاہے آپ تک پہنچ سکتا ہے، آپ کا نام یا نمبر جانے بغیر۔ بطور ڈیفالٹ بند۔","addr.qrHint":"جو اسے اسکین کرے سیدھا آپ کو کال کرے گا","addr.share":"اپنا پتہ بھیجیں","addr.showQr":"QR دکھائیں","addr.reachNote":"تاکہ ایپ بند ہونے پر بھی لوگ آپ تک پہنچ سکیں، نیچے اطلاعات آن کریں۔","addr.dialLabel":"کیا آپ کے پاس کسی کا پتہ ہے؟","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"کال کریں","addr.badFormat":"یہ پتہ صحیح نہیں لکھا۔ یہ 12 حروف کا ہوتا ہے، جیسے DV-K7M2-9QRT-X4WP۔","addr.itsYou":"یہ تو آپ کا اپنا پتہ ہے۔","addr.callingTitle":"کال کی جا رہی ہے…","addr.callingHint":"اگر ان کی ایپ بند ہو تو میں ان کا فون بجا دوں گا۔ اس میں کچھ لمحے لگ سکتے ہیں۔","addr.noAnswer":"کوئی جواب نہیں۔ میں نے اطلاع دے دی ہے: بعد میں کوشش کریں۔","addr.dialFailed":"میں اس پتے پر کال نہیں کر سکا۔","addr.noKey":"یہ پتہ اب فعال نہیں لگتا۔ اس شخص سے کہیں کہ ایپ دوبارہ کھولے اور یہ دوبارہ بھیجے: تازہ اپ ڈیٹ کے ساتھ پتے بدل گئے ہیں۔","addr.noBroker":"میں کال شروع تک نہ کر سکا: جو سروس آپ کو ملاتی ہے اس نے جواب نہیں دیا۔ اگر آپ ایپ کی کوئی نقل کسی اور پتے پر استعمال کر رہے ہیں تو سرکاری والی کھولیں۔","addr.incomingTitle":"کوئی آپ کو ڈھونڈ رہا ہے","addr.incomingSub":"نام اور وجہ کال کرنے والے نے خود لکھی ہے: جب تک آپ قبول نہ کریں، کوئی ثابت نہیں کر سکتا کہ وہ واقعی وہی شخص ہے۔","addr.incomingToast":"کوئی آپ کے پتے پر کال کر رہا ہے۔","addr.accept":"قبول کریں","addr.ignore":"نظرانداز کریں","addr.verified":"تصدیق ہو گئی: جواب دینے والا واقعی پتے {a} کا مالک ہے۔ کوئی درمیان میں نہیں آ سکتا تھا۔","addr.blockedIn":"اس شخص کی کال جسے آپ پہلے رد کر چکے تھے: نظرانداز کر دی گئی۔","addr.shareText":"آپ مجھ تک یہاں پہنچ سکتے ہیں، میرے فون نمبر کے بغیر۔ DigitalValut Logos پر میرا پتہ {a} ہے\n\nمجھے کال کرنے کے لیے ٹیپ کریں:",
"addr.incomingAt":"«{name}» کے ذریعے","burn.title":"ایک بار استعمال ہونے والے پتے","burn.help":"ہر اشتہار کے لیے ایک، ہر اجنبی کے لیے ایک۔ کام ختم ہو تو حذف کر دیں، وہ شخص پھر آپ تک نہیں پہنچ سکتا — اصل پتہ تو اُس کے پاس تھا ہی نہیں۔","burn.namePh":"کس لیے؟ مثلاً: پرانا صوفہ","burn.add":"بنائیں","burn.send":"یہ پتہ بھیجیں","burn.delete":"حذف کریں","burn.deleted":"«{name}» حذف ہو گیا۔ وہ پتہ اب جواب نہیں دیتا۔","burn.made":"«{name}» بن گیا۔ اب آپ اسے دے سکتے ہیں۔","burn.needName":"اسے نام دیں تاکہ یاد رہے کسے دیا تھا۔","burn.full":"ایک وقت میں زیادہ سے زیادہ {n} رکھ سکتے ہیں۔ نیا بنانے کے لیے ایک حذف کریں۔","burn.untitled":"بے نام",
"knock.title":"آپ رابطہ کر رہے ہیں","knock.nameLabel":"آپ کا نام کیا ہے؟","knock.namePh":"آپ کا نام","knock.msgLabel":"آپ کو کیا چاہیے؟ (اختیاری)","knock.msgPh":"مثلاً: کیا آپ کے پاس 42 نمبر کے جوتے ہیں؟","knock.go":"کال کریں","knock.note":"آپ کا نام اور یہ جملہ صرف وہی شخص دیکھتا ہے جسے آپ کال کر رہے ہیں۔ کوئی سرور انہیں نہیں پڑھ سکتا۔",
"letter.title":"آپ کے لیے چھوڑے گئے پیغامات","letter.noneTitle":"ابھی کوئی جواب نہیں دے رہا۔","letter.noneSub":"میں انہیں پہلے ہی بتا چکا ہوں کہ آپ نے رابطہ کرنے کی کوشش کی۔ اگر مزید کچھ کہنا ہے تو یہاں لکھیں۔","letter.ph":"اپنا پیغام یہاں لکھیں","letter.leave":"پیغام چھوڑیں","letter.cancel":"رہنے دیں","letter.needText":"دو لفظ لکھ دیں تاکہ انہیں معلوم ہو آپ کیا چاہتے تھے۔","letter.left":"پیغام چھوڑ دیا گیا۔ ایپ کھولتے ہی مل جائے گا۔","letter.failed":"میں پیغام نہیں چھوڑ سکا۔ دوبارہ کوشش کریں۔","letter.callBack":"واپس کال کریں","letter.dismiss":"ہو گیا",
"home.bigStart":"کسی سے بات کریں","home.bigStartD":"بھیجنے کے لیے دعوت بنائیں","home.bigJoin":"میرے پاس کوڈ ہے","home.bigJoinD":"مجھے کسی نے دعوت بھیجی ہے","set.lang":"زبان","set.textsize":"متن کا سائز","conn.direct":"دونوں فونز کے درمیان براہِ راست رابطہ","conn.directShort":"براہِ راست منسلک","conn.relay":"خفیہ پل کے ذریعے محفوظ رابطہ","conn.relayShort":"منسلک (پل)","conn.down":"رابطہ منقطع ہو گیا","conn.downShort":"منقطع","conn.working":"رابطہ ہو رہا ہے","conn.wobbly":"رابطہ لڑکھڑایا — دوبارہ جوڑ رہا ہوں","conn.wobblyShort":"دوبارہ جوڑ رہا ہوں","chat.linkLost":"رابطہ منقطع ہو گیا۔ کچھ ضائع نہیں ہوا — ایپ دوبارہ کھولیں اور حالیہ رابطوں سے دوبارہ جڑیں۔",
"call.flipFail":"اس فون پر کیمرہ تبدیل نہیں کر سکتا۔",
"call.flipBusy":"کیمرہ کسی دوسری ایپ کے زیرِ استعمال ہے۔ اسے بند کر کے دوبارہ کوشش کریں۔","call.flipDenied":"براؤزر نے اس سائٹ کے لیے کیمرہ روک دیا ہے۔","call.flipOnlyOne":"اس آلے میں صرف ایک کیمرہ ہے۔",
"home.alreadyTalking":"آپ پہلے ہی ایک گفتگو میں ہیں۔ نئی شروع کرنے کے لیے پہلے اسے بند کریں۔","home.stillCalling":"میں ابھی بھی کال کر رہا ہوں۔ جواب کا انتظار کریں، یا کال منسوخ کریں۔","home.busyReconnect":"آپ ابھی مصروف ہیں۔ دوبارہ کوشش کرنے سے پہلے موجودہ کنکشن مکمل کریں یا بند کریں۔",
"letter.missed":"آپ سے بات کرنا چاہتا تھا۔",
"sas.blocked":"پہلے تینوں الفاظ بول کر ملائیں: یہ شخص اب وہی نہیں رہا۔",
"file.tooBig":"ایک آنے والی فائل روک دی گئی: یہ اعلان کردہ سے مطابقت نہیں رکھتی تھی۔","file.sendFailed":"بھیجنا رک گیا: کنکشن درمیان میں بند ہو گیا۔","file.progress":"{sent} از {total}",
"share.pending":"{n} فائل بھیجنے کے لیے تیار ہیں — جیسے ہی رابطہ ہو، چلی جائیں گی",
"health.storage":"فون کی میموری",
"health.storageFull":"بھری ہوئی ہے: گفتگو اب محفوظ نہیں ہو رہی۔ فون میں جگہ خالی کریں۔",
"addr.lifespan":"یہ پتہ ختم نہیں ہوتا۔ جب تک ایپ کا ڈیٹا اس فون پر رہے، یہ کارآمد رہتا ہے۔",
"health.addrLife":"سلامتی کے الفاظ",
"health.addrLifeOk":"مزید تقریباً {n} دن مستحکم۔",
"health.addrLifeSoon":"تقریباً {n} دن میں یہ خود بدل جائیں گے۔ آپ کے رابطوں سے کہا جائے گا کہ دوبارہ آپ کے ساتھ ملا کر دیکھیں — یہ کسی خرابی کی علامت نہیں۔","health.addrKeyBad":"وہ آپ تک نہیں پہنچ سکتے: یہ فون وہ کلید شائع نہیں کر سکا جس پر اس کا پتہ بنا ہے۔ کنکشن دیکھیں اور ایپ دوبارہ کھولیں۔",
"health.title":"ایپ کی حالت",
"health.sub":"اگر کوئی آپ تک نہیں پہنچ پا رہا تو وجہ نیچے لکھی ہے۔",
"health.recheck":"دوبارہ جانچیں",
"health.copy":"رپورٹ کاپی کریں",
"health.copied":"رپورٹ کاپی ہو گئی۔",
"health.checking":"جانچ رہا ہوں…",
"health.busy":"وقفہ: آپ پہلے ہی ایک گفتگو میں ہیں۔",
"health.stopped":"میں سن نہیں رہا۔ ایپ بند کر کے دوبارہ کھولیں۔",
"health.addr":"جس کے پاس آپ کا پتہ ہے",
"health.addrOk":"ابھی آپ کو کال کر سکتا ہے۔",
"health.addrOff":"آپ کا پتہ بند ہے۔ اوپر سے اسے آن کریں۔",
"health.contacts":"آپ کے رابطے",
"health.contactsOk":"وہ ابھی آپ کو دوبارہ پا سکتے ہیں۔",
"health.contactsNone":"ابھی آپ کا کوئی رابطہ نہیں ہے۔",
"health.broker":"جو سروس آپ کو ملاتی ہے",
"health.brokerOk":"جواب دے رہی ہے۔",
"health.brokerBad":"جواب نہیں دے رہی۔ لمبے کوڈ اب بھی کام کرتے ہیں: وہ کسی سرور سے نہیں گزرتے۔",
"health.brokerOrigin":"ایپ کی یہ نقل ایسے پتے پر ہے جسے سروس نہیں پہچانتی: یہاں سے کام نہیں کرے گی۔ سرکاری والی کھولیں۔",
"health.closed":"ایپ بند ہونے پر",
"health.closedOk":"وہ آپ کا فون بجا سکتے ہیں۔",
"health.closedOff":"وہ آپ تک نہیں پہنچ سکتے۔ اوپر اطلاعات آن کریں۔",
"health.closedDenied":"براؤزر اطلاعات روک رہا ہے: ایپ بند ہو تو کوئی آپ تک نہیں پہنچے گا۔",
"health.closedIos":"آئی فون پر پہلے ایپ کو ہوم اسکرین میں شامل کرنا ہوگا۔",
"health.mic":"مائیکروفون",
"health.micOk":"دستیاب ہے۔",
"health.micBad":"براؤزر نے روک رکھا ہے: آپ نہ کال کر سکیں گے نہ وصول۔",
"health.micUnknown":"جب تک آپ کال آزما نہ لیں، میں نہیں جان سکتا۔",
"health.version":"زیرِ استعمال ورژن",
"health.versionOld":"ایپ کا ایک حصہ اب بھی پرانا ہے۔ اسے بند کر کے دوبارہ کھولیں۔",
"media.stepsAndroidApp":"فون کی ہوم اسکرین پر واپس جائیں|<b>DigitalValut Logos</b> آئیکن کو دبائے رکھیں|<b>ایپ کی معلومات</b> (یا ⓘ آئیکن) پر ٹیپ کریں|<b>اجازتیں</b> پر ٹیپ کریں، پھر <b>مائیکروفون</b> اور <b>کیمرہ</b> آن کریں|ایپ دوبارہ کھولیں"
});

Object.assign(I18N.hi, {
"onboard.text":"<b>DigitalValut Logos</b> — मुफ़्त और ओपन-सोर्स सॉफ़्टवेयर (Apache 2.0 लाइसेंस), Associazione di Promozione Sociale DigitalValut का स्वामित्व, एक पंजीकृत इतालवी गैर-लाभकारी संस्था (Ente del Terzo Settore)। दुनिया में कहीं भी, कोई भी इसे मुफ़्त में डाउनलोड और उपयोग कर सकता है।",
"install.btn":"इंस्टॉल करें",
"home.title":"जिससे चाहें बात करें, वे कहीं भी हों",
"home.sub":"संदेश, फ़ोटो, वीडियो, कॉल। कोई साइन-अप नहीं, कोई फ़ोन नंबर नहीं, हमेशा के लिए मुफ़्त।",
"home.nameLabel":"आपका नाम","home.namePh":"आपका नाम",


"home.legalSummary":"यह कैसे काम करता है, तीन तकनीकी पंक्तियों में",
"home.legalBody":"यह आपका नेटवर्क पता (IP) उस व्यक्ति को दिखाता है जिससे आप बात कर रहे हैं; ज़रूरी है कि आप दोनों एक ही समय पर ऑनलाइन हों, वरना कुछ नहीं पहुँचेगा, और भारी फ़िल्टर वाले नेटवर्क पर कॉल कनेक्ट नहीं हो सकतीं; कोई भी वेबसाइट कभी स्क्रीनशॉट नहीं रोक सकती।",
"nav.back":"वापस",
"start.create":"निमंत्रण तैयार करें","start.share":"निमंत्रण भेजें","btn.copyCode":"कोड कॉपी करें",
"start.pastePh":"जवाब यहाँ पेस्ट करें…","btn.connect":"चैट में जाएं",
"join.pastePh":"निमंत्रण यहाँ पेस्ट करें…","join.generate":"निमंत्रण खोलें",
"join.sendAnswer":"जवाब भेजें",
"chat.someone":"कोई","chat.connected":"जुड़ा हुआ","chat.typePh":"एक संदेश लिखें…","chat.dropHere":"भेजने के लिए यहाँ छोड़ें",
"call.hangup":"समाप्त करें","call.accept":"जवाब दें","call.decline":"अस्वीकार करें",
"menu.title":"उपकरण","menu.arm":"स्व-विनाश","menu.disarm":"रद्द करें",
"menu.clearHistory":"इतिहास साफ़ करें","menu.endChat":"चैट समाप्त करें",
"menu.historyNote":"इतिहास केवल इस डिवाइस पर रहता है, उस व्यक्ति के नाम से जुड़ा जिससे आप बात कर रहे हैं। कोई सर्वर इसे नहीं रखता।",
"footer.text":"मुफ़्त और ओपन-सोर्स सॉफ़्टवेयर (Apache 2.0 लाइसेंस), DigitalValut APS ETS की एक परियोजना।",
"footer.noserver":"कोई सर्वर नहीं: कनेक्शन WebRTC के ज़रिए दोनों ब्राउज़रों के बीच सीधा है।",
"footer.author":"DigitalValut के लिए डॉ. जुज़ेप्पे फ़ाल्सोने द्वारा परिकल्पित। © 2026 DigitalValut और DigitalValut टीम।",
"footer.license":"ओपन-सोर्स लाइसेंस पढ़ें","footer.source":"GitHub पर सोर्स कोड",
"verify.badge":"सत्यापित करें","verify.title":"सुरक्षा कोड",
"verify.lead":"इसे दूसरे व्यक्ति से मिलाएं — ज़ोर से बोलकर, फ़ोन पर, या निमंत्रण कोड के आदान-प्रदान से अलग किसी माध्यम पर। अगर दोनों कोड बिल्कुल मेल नहीं खाते, तो हो सकता है किसी ने कनेक्शन में दखल दिया हो: उस चैट पर भरोसा न करें।",
"verify.close":"बंद करें","verify.unavailable":"अभी तैयार नहीं — थोड़ी देर में फिर कोशिश करें।",
"contacts.title":"हाल के संपर्क",
"contacts.note":"उन्हें फिर से देखने के लिए एक टैप: आपने एक-दूसरे से जो कहा वह यहाँ रह गया। हर बार एक नए निमंत्रण की ज़रूरत होती है, क्योंकि कोई सर्वर आपकी जगह किसी को जुड़ा हुआ नहीं रखता।",
"toast.sealCopied":"कोड कॉपी हो गया","toast.copyFail":"कॉपी विफल — हाथ से चुनें और कॉपी करें","toast.copySelected":"कॉपी विफल — कोड आपके लिए चुन दिया गया है, बस Ctrl/Cmd+C दबाएं",
"call.busy":"जवाब नहीं दिया — किसी और कॉल में व्यस्त।","call.declinedBy":"कॉल अस्वीकार कर दी।","call.connectFailed":"कॉल कनेक्ट नहीं हो सकी। फिर से कोशिश करें।",
"call.joined":"चैट में शामिल हुआ।","call.videoInvite":"आपको वीडियो कॉल कर रहा है","call.audioInvite":"आपको कॉल कर रहा है",
"call.inVideo":"वीडियो कॉल जारी है…","call.inAudio":"कॉल जारी है…","call.ringingVideo":"वीडियो कॉल हो रही है, जवाब का इंतज़ार…","call.ringingAudio":"कॉल हो रही है, जवाब का इंतज़ार…",
"call.micFail":"माइक्रोफ़ोन या कैमरा उपलब्ध नहीं, या अनुमति अस्वीकृत।",
"call.micFailNotFound":"इस डिवाइस पर कोई माइक्रोफ़ोन या कैमरा नहीं मिला।",
"call.micFailBusy":"आपका माइक्रोफ़ोन या कैमरा पहले से किसी और ऐप द्वारा उपयोग में है (Zoom, Teams, कोई और टैब…)। इसे बंद करें और फिर कोशिश करें।",
"call.micFailDenied":"ब्राउज़र ने इस साइट के लिए माइक्रोफ़ोन और कैमरा ब्लॉक कर दिया है। नीचे दिए स्टेप्स फ़ॉलो करें, फिर पेज रीलोड करें।",
"reconnect.trying":"{n} से फिर से जुड़ने की कोशिश हो रही है…",
"reconnect.offline":"{n} अभी ऑनलाइन नहीं लग रहा। यह रहा हाथ से भेजने के लिए कोड।",
"call.noSpeakerFound":"इस फ़ोन पर अलग स्पीकर नहीं मिल सका।",
"call.speakerFail":"इस फ़ोन पर स्पीकर बदला नहीं जा सकता।",
"destruct.countdown":"इतनी देर में स्व-नष्ट होगा: ","destruct.done":"बातचीत स्व-नष्ट हो गई।",
"session.closed":"बंद","session.newHint":"फिर से जुड़ने के लिए एक नया सत्र बनाएं।",
"invite.shareText":"DigitalValut Logos पर मुझसे चैट करना चाहेंगे? यह लिंक खोलें: अगर आपके पास पेज तैयार नहीं है, तो यह अपने आप खुल जाएगा और मेरा निमंत्रण पहले से भरा होगा।\n\n",
"invite.answerText":"यह रहा DigitalValut Logos के लिए मेरा जवाब, कनेक्शन पूरा करने के लिए इसे पेस्ट करें:\n\n",
"mic.recording":"रिकॉर्डिंग हो रही है — रोकने के लिए टैप करें","history.cleared":"इस डिवाइस पर इतिहास साफ़ कर दिया गया।",
"install.genericText":"<b>DigitalValut Logos इंस्टॉल करें</b> ताकि यह अपने आइकन के साथ एक ऐप की तरह हो, बिना ब्राउज़र की ज़रूरत के।",
"install.iosText":"<b>iPhone या iPad पर DigitalValut Logos इंस्टॉल करें।</b> Safari में <b>शेयर</b> टैप करें, फिर <b>होम स्क्रीन पर जोड़ें</b>।",
"home.shareApp":"किसी को ऐप के बारे में बताएं",
"start.s1":"निमंत्रण भेजें",
"start.s1help":"नारंगी बटन दबाएं। ऐप निमंत्रण तैयार करता है और आपको चुनने देता है कि इसे कैसे भेजें: WhatsApp, एक संदेश, ईमेल — जो भी आप आमतौर पर उपयोग करते हैं।",
"start.s2":"उनका जवाब पेस्ट करें",
"start.s2help":"वे आपको वापस एक संदेश भेजेंगे। उसे कॉपी करें, यहाँ वापस आएं और <b>पेस्ट</b> दबाएं। फिर आप दोनों साथ चैट में प्रवेश करते हैं।",
"join.s1":"निमंत्रण खोलें",
"join.s1help":"अगर आपने वह लिंक खोला जो आपको भेजा गया था, तो सब तैयार है: नारंगी बटन दबाएं। नहीं तो <b>पेस्ट</b> दबाएं।",
"join.s2":"जवाब भेजें",
"join.s2help":"आखिरी कदम: इसे उस व्यक्ति को वापस भेजें जिसने आपको आमंत्रित किया, और आप जुड़ जाएंगे।",
"btn.paste":"पेस्ट करें","btn.showCode":"कोड दिखाएं",
"toast.clipboardEmpty":"पेस्ट करने के लिए कुछ नहीं है।","toast.pasteManually":"बॉक्स पर उंगली दबाए रखें और पेस्ट चुनें।",
"home.shareAppText":"मुफ़्त, बिना खाते के, किसी भी फ़ोन या कंप्यूटर पर काम करता है, फ़ोटो और फ़ाइलें असली क्वालिटी में भेजता है — DigitalValut Logos:\n\n",
"lock.title":"अतिरिक्त सुरक्षा",
"lock.sub":"निमंत्रण को एक पासफ़्रेज़ से लॉक करता है जिसे आप ज़ोर से बोलते हैं। अगर कोड WhatsApp, ईमेल या SMS से गुज़रता है तो इसे चालू करना फ़ायदेमंद है।",
"lock.passCap":"पासफ़्रेज़",
"lock.passHint":"इसे ज़ोर से बोलें, या कोड से अलग माध्यम पर भेजें। इसके बिना कोड नहीं खुलेगा।",
"lock.ask":"यह निमंत्रण लॉक है। वह पासफ़्रेज़ टाइप करें जो आपको ज़ोर से बताई गई थी।",
"lock.askPh":"पासफ़्रेज़","lock.working":"एक पल…",
"lock.needPass":"इस निमंत्रण को खोलने के लिए पासफ़्रेज़ टाइप करें।",
"lock.wrongPass":"ग़लत पासफ़्रेज़। इसे जांचें और फिर कोशिश करें।",
"lock.badAnswer":"अमान्य जवाब — या यह किसी अलग पासफ़्रेज़ से सील किया गया था।",
"join.badCode":"यह कोड मान्य नहीं है। जांचें कि आपने इसे पूरा कॉपी किया है।",
"connect.waiting":"कनेक्शन का इंतज़ार हो रहा है…",
"connect.failed":"कनेक्ट नहीं हो सका। सुनिश्चित करें कि आप दोनों ऑनलाइन हैं, फिर एक नया निमंत्रण बनाएं — पुराने कोड फिर से उपयोग नहीं किए जा सकते।",
"connect.slow":"इसमें सामान्य से ज़्यादा समय लग रहा है — यह भारी फ़िल्टर वाले नेटवर्क (दफ़्तर, कुछ मोबाइल नेटवर्क) पर होता है या अगर आप एक ही समय पर ऑनलाइन नहीं हैं। थोड़ा और इंतज़ार करें, या एक नया निमंत्रण बनाएं।",
"footer.seal":"इस ऐप के फ़िंगरप्रिंट (SHA-256):",
"verify.known":"सत्यापित","verify.changedShort":"कोड बदल गया","verify.accept":"नया कोड स्वीकार करें",
"verify.noteKnown":"पिछली बार जैसा ही कोड: तब से किसी ने दखल नहीं दिया।",
"verify.noteNew":"इस व्यक्ति के साथ पहली बार: कोड को ज़ोर से मिलाएं, फिर ऐप इसे याद रखेगा।",
"verify.noteChanged":"कोड बदल गया है। आमतौर पर इसका मतलब है नया फ़ोन या फिर से इंस्टॉल किया गया ऐप — लेकिन यह दखलंदाज़ी जैसा भी दिख सकता है। स्वीकार करने से पहले इसे ज़ोर से मिलाएं।",
"quick.titleA":"आपका कोड",
"quick.helpA":"इसे नीचे दिए बटन से भेजें — एक टैप और वे अंदर आ जाएंगे। या छह अंक ज़ोर से बोलें। जब तक आप इस स्क्रीन पर रहेंगे यह काम करता रहेगा।",
"quick.orType":"या ऐप खोलें और यह कोड टाइप करें:","quick.qrHint":"या यहाँ फ़ोन कैमरा दिखाएं",
"quick.newCode":"नया कोड बनाएं","quick.useLong":"लंबा कोड पसंद करेंगे?",
"quick.titleB":"कोड टाइप करें",
"quick.helpB":"जिसने आपको आमंत्रित किया उससे कोड मांगें — 6 अंक, ज़ोर से बोले या लिखे गए — और यहाँ टाइप करें।",
"quick.codePh":"000000","quick.connect":"कनेक्ट करें",
"quick.waiting":"दूसरे व्यक्ति के कोड टाइप करने का इंतज़ार हो रहा है…","quick.expired":"कोड बिना जवाब के समाप्त हो गया। एक नया बनाएं।",
"quick.notFound":"कोड समाप्त हो गया या ग़लत है। जिसने आपको दिया उससे जांचें।",
"quick.shareText":"यह रहा DigitalValut Logos पर मुझसे बात करने का लिंक। इसे टैप करें और हम जुड़ जाएंगे:",
"quick.share":"निमंत्रण भेजें",
"notify.title":"जब कोई मुझे ढूंढे तो बताएं",
"notify.sub":"अगर कोई संपर्क आपसे जुड़ने की कोशिश करे और आपका ऐप खुला न हो तो एक सूचना — कोई नाम नहीं, कोई संदेश नहीं, बस एक इशारा।",
"notify.iosHint":"iPhone पर यह तभी काम करता है जब आपने पहले ऐप को अपनी होम स्क्रीन पर जोड़ा हो: Safari में <b>शेयर</b> टैप करें, फिर <b>होम स्क्रीन पर जोड़ें</b>, और वहां से ऐप खोलें।",
"notify.blocked":"ब्राउज़र ने सूचनाएं ब्लॉक कर दीं। साइट की सेटिंग्स जांचें।",
"sas.title":"सुरक्षा जांच",
"sas.lead":"एक-दूसरे को ये तीन शब्द ज़ोर से बताएं। अगर आप दोनों एक जैसे शब्द देखें, तो किसी ने दखल नहीं दिया।",
"sas.leadChanged":"सावधान: यह व्यक्ति अब पिछली बार जैसा नहीं लग रहा। आमतौर पर इसका मतलब है नया फ़ोन या फिर से इंस्टॉल किया गया ऐप — लेकिन यह दखलंदाज़ी जैसा भी दिख सकता है। जारी रखने से पहले तीनों शब्द ज़ोर से बोलें।",
"sas.yes":"हां, मेल खाते हैं","sas.no":"नहीं, अलग हैं",
"sas.note":"इस व्यक्ति के साथ केवल पहली बार ज़रूरी: उसके बाद, ऐप इसे याद रखता है।",
"sas.confirmed":"संपर्क सत्यापित।",
"sas.refused":"शब्द मेल नहीं खाए: यह बातचीत सुरक्षित नहीं मानी जाती। इसे बंद करें और एक नए कोड के साथ फिर से शुरू करें।",
"connect.bigTitle":"कनेक्ट हो रहा है…","connect.bigHint":"ऐप बंद न करें — इसमें बस कुछ सेकंड लगते हैं।",
"autoclean.title":"अपने आप सफ़ाई","autoclean.sub":"एक तय दिनों से पुरानी बातचीत अपने आप हटा देता है, ताकि वे आपके फ़ोन पर जगह घेरती न रहें। डिफ़ॉल्ट रूप से बंद: जब तक आप इसे खुद चालू न करें, कुछ भी अपने आप नहीं हटता।","autoclean.after":"इससे पुरानी बातचीत हटाएं:","autoclean.d7":"7 दिन","autoclean.d30":"30 दिन","autoclean.d90":"90 दिन","autoclean.d365":"1 साल",
"wake.waitsNote":"आप ऐप बंद कर सकते हैं: जब वे निमंत्रण खोलेंगे तो मैं आपको बता दूंगा।","wake.calling":"{name} को बता रहा हूँ…","wake.callingHint":"उनका फ़ोन बज चुका है। जैसे ही वे ऐप खोलेंगे, आप जुड़ जाएंगे — आप यहाँ इंतज़ार कर सकते हैं।","wake.noAnswer":"उन्हें बता दिया गया है लेकिन उन्होंने अभी तक ऐप नहीं खोला। बाद में फिर कोशिश करें।",
"quick.helpAWaits":"नीचे दिए बटन से भेजें — दूसरे व्यक्ति को बस उसे छूना है और वे अंदर हैं। या उन्हें छह अंक बोलकर बता दें।",
"verify.inPerson":"आमने-सामने सत्यापित","verify.inPersonDone":"आमने-सामने सत्यापित: आपने कोड इसी व्यक्ति की स्क्रीन से स्कैन किया है, इसलिए कोई बीच में नहीं आ सकता। तीन शब्द बोलने की ज़रूरत नहीं।","sas.leadMismatch":"सावधान: जिसने जवाब दिया वह वह फ़ोन नहीं है जिसका कोड आपने स्कैन किया था। यह ग़लती हो सकती है, लेकिन अगर कोई बीच में आ गया होता तो भी ठीक ऐसा ही दिखता। जब तक आप एक-दूसरे को तीन शब्द बोलकर न बता लें, कुछ न लिखें।",
"easy.title":"आसान मोड","easy.sub":"बस दो बड़े बटन और आसपास कुछ नहीं। उनके लिए जो कुछ सोचना नहीं चाहते — या जो किसी और का फ़ोन तैयार कर रहे हैं।","easy.voiceTitle":"बोलकर बताओ","easy.voiceSub":"ऐप आपकी भाषा में बोलकर बताता है कि क्या करना है। उनके लिए जिन्हें स्क्रीन पढ़ना मुश्किल लगता है।","easy.voiceOn":"ठीक है। अब से मैं बोलकर बताऊंगा कि क्या करना है।","easy.sayHome":"बातचीत शुरू करने के लिए पहला बटन दबाएं। अगर किसी ने आपको निमंत्रण भेजा है तो दूसरा दबाएं।","easy.sayStart":"यह आपका कोड है। जिसे चाहें भेजने के लिए नारंगी बटन दबाएं।","easy.sayJoin":"आपको दिए गए छह अंक लिखें।","easy.sayChat":"जुड़ गए। अब आप बात कर सकते हैं।",
"broker.down":"जो सेवा आपको एक-दूसरे तक पहुँचाती है वह जवाब नहीं दे रही। नीचे दिया लंबा कोड फिर भी काम करता है: यह किसी सर्वर से नहीं गुज़रता।",
"flash.title":"जुड़ गए","flash.titleWith":"{name} से जुड़ गए","flash.direct":"आपके दोनों फ़ोन के बीच सीधा संपर्क","flash.relay":"एन्क्रिप्टेड पुल के ज़रिए जुड़े — आपके नेटवर्क ने सीधा संपर्क नहीं होने दिया","flash.noserver":"कोई सर्वर आपकी बातें नहीं पढ़ सकता","flash.time":"{s} सेकंड में, कहीं रजिस्टर हुए बिना",
"viral.title":"यह काम कर गया।","viral.sub":"अगर काम आया हो तो आगे बढ़ाएं: यह मुफ़्त है, कोई खाता नहीं मांगता, और किसी का कुछ नहीं रखता।","viral.btn":"किसी को बताएं",
"media.title":"माइक्रोफ़ोन और कैमरा","media.warnDenied":"यह ब्राउज़र माइक्रोफ़ोन रोक रहा है: आप न कॉल कर पाएंगे, न कॉल ले पाएंगे।","media.warnFix":"इसे कैसे ठीक करें","media.retry":"फिर कोशिश करें","media.close":"बंद करें","media.nowOk":"माइक्रोफ़ोन चालू है। अब आप कॉल कर सकते हैं।","media.peerNoMic":"{name} ने उठाया, लेकिन उनका ब्राउज़र माइक्रोफ़ोन चालू नहीं करने देता। उन्होंने मना नहीं किया है।","media.peerNoCam":"{name} ने उठाया, लेकिन उनका ब्राउज़र कैमरा और माइक्रोफ़ोन चालू नहीं करने देता। सिर्फ़ आवाज़ वाली कॉल आज़माएं, या उनसे रोक हटाने को कहें।","media.stepsIos":"iPhone पर <b>सेटिंग्स</b> खोलें|नीचे जाकर <b>Safari</b> पर टैप करें|<b>माइक्रोफ़ोन</b> फिर <b>कैमरा</b> पर टैप करें: <b>पूछें</b> या <b>अनुमति दें</b> पर रखें|यहाँ लौटकर पेज फिर से लोड करें","media.stepsAndroid":"ऊपर पते के पास <b>ताले</b> पर टैप करें|<b>अनुमतियाँ</b> पर टैप करें|<b>माइक्रोफ़ोन</b> और <b>कैमरा</b> चालू करें|पेज फिर से लोड करें","media.stepsChrome":"पते के बाईं ओर <b>ताले</b> पर क्लिक करें|<b>माइक्रोफ़ोन</b> और <b>कैमरा</b> चालू करें|पेज फिर से लोड करें","media.stepsSafariMac":"मेनू बार में <b>Safari</b> › <b>इस वेबसाइट के लिए सेटिंग्स</b> खोलें|<b>माइक्रोफ़ोन</b> और <b>कैमरा</b> को <b>अनुमति दें</b> पर रखें|पेज फिर से लोड करें","media.stepsFirefox":"पते के बाईं ओर <b>ताले</b> पर क्लिक करें|<b>माइक्रोफ़ोन इस्तेमाल करें</b> और <b>कैमरा इस्तेमाल करें</b> के आगे की रोक हटाएं|पेज फिर से लोड करें","media.stepsOther":"इस साइट के लिए ब्राउज़र सेटिंग्स खोलें|<b>माइक्रोफ़ोन</b> और <b>कैमरा</b> की अनुमति दें|पेज फिर से लोड करें",
"addr.title":"आपका स्थायी पता","addr.sub":"फ़ोन नंबर की जगह यह दें। जिसके पास यह हो वह जब चाहे आप तक पहुँच सकता है, आपका नाम या नंबर जाने बिना। डिफ़ॉल्ट रूप से बंद।","addr.qrHint":"जो इसे स्कैन करे सीधे आपको कॉल करेगा","addr.share":"अपना पता भेजें","addr.showQr":"QR दिखाएं","addr.reachNote":"ताकि ऐप बंद होने पर भी लोग आप तक पहुँच सकें, नीचे सूचनाएं चालू करें।","addr.dialLabel":"किसी का पता है आपके पास?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"कॉल करें","addr.badFormat":"यह पता ठीक से नहीं लिखा है। यह 12 अक्षरों का होता है, जैसे DV-K7M2-9QRT-X4WP।","addr.itsYou":"यह तो आपका अपना पता है।","addr.callingTitle":"कॉल किया जा रहा है…","addr.callingHint":"अगर उनका ऐप बंद है तो मैं उनका फ़ोन बजा दूंगा। इसमें थोड़ा समय लग सकता है।","addr.noAnswer":"कोई जवाब नहीं। मैंने बता दिया है: बाद में कोशिश करें।","addr.dialFailed":"मैं इस पते पर कॉल नहीं कर सका।","addr.noKey":"यह पता अब सक्रिय नहीं लगता। उस व्यक्ति से कहें कि ऐप दोबारा खोलें और इसे फिर भेजें: पिछले अपडेट के साथ पते बदल गए हैं।","addr.noBroker":"मैं कॉल शुरू तक नहीं कर सका: जो सेवा आपको मिलाती है उसने जवाब नहीं दिया। अगर आप ऐप की कोई नकल किसी और पते पर इस्तेमाल कर रहे हैं, तो आधिकारिक वाली खोलें।","addr.incomingTitle":"कोई आपको ढूंढ रहा है","addr.incomingSub":"नाम और कारण कॉल करने वाले ने खुद लिखे हैं: जब तक आप स्वीकार न करें, कोई साबित नहीं कर सकता कि वह सचमुच वही व्यक्ति है।","addr.incomingToast":"कोई आपके पते पर कॉल कर रहा है।","addr.accept":"स्वीकार करें","addr.ignore":"अनदेखा करें","addr.verified":"सत्यापित: जिसने जवाब दिया वह सचमुच पते {a} का मालिक है। कोई बीच में नहीं आ सकता था।","addr.blockedIn":"उस व्यक्ति की कॉल जिसे आपने पहले मना कर दिया था: अनदेखी की गई।","addr.shareText":"आप मुझ तक यहाँ पहुँच सकते हैं, मेरे फ़ोन नंबर के बिना। DigitalValut Logos पर मेरा पता {a} है\n\nमुझे कॉल करने के लिए टैप करें:",
"addr.incomingAt":"«{name}» के ज़रिए","burn.title":"इस्तेमाल करके फेंकने वाले पते","burn.help":"हर विज्ञापन के लिए एक, हर अजनबी के लिए एक। काम पूरा हो तो मिटा दें और वह व्यक्ति आप तक नहीं पहुँच सकता — असली पता उसके पास कभी था ही नहीं।","burn.namePh":"किस लिए? जैसे: पुराना सोफ़ा","burn.add":"बनाएं","burn.send":"यह पता भेजें","burn.delete":"मिटाएं","burn.deleted":"«{name}» मिटा दिया। वह पता अब जवाब नहीं देता।","burn.made":"«{name}» बन गया। अब आप इसे दे सकते हैं।","burn.needName":"इसे नाम दें, ताकि पता रहे किसे दिया था।","burn.full":"एक साथ ज़्यादा से ज़्यादा {n} रख सकते हैं। नया बनाने के लिए एक मिटाएं।","burn.untitled":"बिना नाम",
"knock.title":"आप संपर्क कर रहे हैं","knock.nameLabel":"आपका नाम क्या है?","knock.namePh":"आपका नाम","knock.msgLabel":"आपको क्या चाहिए? (वैकल्पिक)","knock.msgPh":"जैसे: क्या 42 नंबर के जूते हैं?","knock.go":"कॉल करें","knock.note":"आपका नाम और यह वाक्य सिर्फ़ वही व्यक्ति देखता है जिसे आप कॉल कर रहे हैं। कोई सर्वर इन्हें नहीं पढ़ सकता।",
"letter.title":"आपके लिए छोड़े गए संदेश","letter.noneTitle":"अभी कोई जवाब नहीं दे रहा।","letter.noneSub":"मैं उसे पहले ही बता चुका हूँ कि आपने संपर्क करने की कोशिश की। अगर कुछ और कहना है तो यहाँ लिखें।","letter.ph":"अपना संदेश यहाँ लिखें","letter.leave":"संदेश छोड़ें","letter.cancel":"रहने दें","letter.needText":"दो शब्द लिख दें, ताकि उन्हें पता चले आप क्या चाहते थे।","letter.left":"संदेश छोड़ दिया। ऐप खोलते ही उन्हें मिल जाएगा।","letter.failed":"मैं संदेश नहीं छोड़ सका। फिर कोशिश करें।","letter.callBack":"वापस कॉल करें","letter.dismiss":"हो गया",
"home.bigStart":"किसी से बात करें","home.bigStartD":"भेजने के लिए निमंत्रण बनाएं","home.bigJoin":"मेरे पास कोड है","home.bigJoinD":"मुझे किसी ने निमंत्रण भेजा है","set.lang":"भाषा","set.textsize":"टेक्स्ट का आकार","conn.direct":"दोनों फ़ोन के बीच सीधा संपर्क","conn.directShort":"सीधे जुड़ा","conn.relay":"एन्क्रिप्टेड पुल से सुरक्षित संपर्क","conn.relayShort":"जुड़ा (पुल)","conn.down":"संपर्क टूट गया","conn.downShort":"टूटा","conn.working":"जुड़ रहा है","conn.wobbly":"कनेक्शन डगमगाया — फिर से जोड़ रहा हूँ","conn.wobblyShort":"फिर जोड़ रहा है","chat.linkLost":"कनेक्शन टूट गया। कुछ खोया नहीं — ऐप दोबारा खोलें और हाल के संपर्कों से फिर जुड़ें।",
"call.flipFail":"इस फ़ोन पर कैमरा नहीं बदल सकता।",
"call.flipBusy":"कैमरा किसी दूसरे ऐप में इस्तेमाल हो रहा है। उसे बंद करके फिर कोशिश करें।","call.flipDenied":"ब्राउज़र ने इस साइट के लिए कैमरा रोक दिया है।","call.flipOnlyOne":"इस डिवाइस में सिर्फ़ एक कैमरा है।",
"home.alreadyTalking":"आप पहले से एक बातचीत में हैं। दूसरी शुरू करने के लिए पहले इसे बंद करें।","home.stillCalling":"मैं अभी भी कॉल कर रहा हूँ। जवाब का इंतज़ार करें, या कॉल रद्द करें।","home.busyReconnect":"आप अभी व्यस्त हैं। दोबारा कोशिश करने से पहले मौजूदा कनेक्शन पूरा करें या बंद करें।",
"letter.missed":"आपसे बात करना चाहता था।",
"sas.blocked":"पहले तीनों शब्द बोलकर मिलाएँ: यह व्यक्ति अब वही नहीं रहा।",
"file.tooBig":"एक आती हुई फ़ाइल रोक दी गई: वह घोषित के अनुरूप नहीं थी।","file.sendFailed":"भेजना बीच में रुक गया: कनेक्शन बीच में बंद हो गया।","file.progress":"{sent} में से {total}",
"share.pending":"{n} फ़ाइलें भेजने के लिए तैयार — जुड़ते ही चली जाएंगी",
"health.storage":"फ़ोन की मेमोरी",
"health.storageFull":"भरी हुई है: बातचीत अब सहेजी नहीं जा रही। फ़ोन में जगह खाली करें।",
"addr.lifespan":"यह पता समाप्त नहीं होता। जब तक ऐप का डेटा इस फ़ोन पर है, यह मान्य रहता है।",
"health.addrLife":"सुरक्षा शब्द",
"health.addrLifeOk":"लगभग {n} दिन और स्थिर।",
"health.addrLifeSoon":"लगभग {n} दिनों में ये अपने आप बदल जाएंगे। आपके संपर्कों से इन्हें आपके साथ फिर मिलाने को कहा जाएगा — यह किसी गड़बड़ी का संकेत नहीं है।","health.addrKeyBad":"वे आप तक नहीं पहुँच सकते: यह फ़ोन उस कुंजी को प्रकाशित नहीं कर सका जिस पर उसका पता बना है। कनेक्शन जाँचें और ऐप दोबारा खोलें।",
"health.title":"ऐप की स्थिति",
"health.sub":"अगर कोई आप तक नहीं पहुँच पा रहा, तो कारण नीचे लिखा है।",
"health.recheck":"फिर से जाँचें",
"health.copy":"रिपोर्ट कॉपी करें",
"health.copied":"रिपोर्ट कॉपी हो गई।",
"health.checking":"जाँच रहा हूँ…",
"health.busy":"रुका हुआ: आप पहले से एक बातचीत में हैं।",
"health.stopped":"मैं सुन नहीं रहा। ऐप बंद करके दोबारा खोलें।",
"health.addr":"जिसके पास आपका पता है",
"health.addrOk":"अभी आपको कॉल कर सकता है।",
"health.addrOff":"आपका पता बंद है। ऊपर से इसे चालू करें।",
"health.contacts":"आपके संपर्क",
"health.contactsOk":"वे अभी आपको दोबारा पा सकते हैं।",
"health.contactsNone":"आपका अभी कोई संपर्क नहीं है।",
"health.broker":"जो सेवा आपको मिलाती है",
"health.brokerOk":"जवाब दे रही है।",
"health.brokerBad":"जवाब नहीं दे रही। लंबे कोड अब भी चलते हैं: वे किसी सर्वर से नहीं गुज़रते।",
"health.brokerOrigin":"ऐप की यह नकल ऐसे पते पर है जिसे सेवा नहीं पहचानती: यहाँ से काम नहीं करेगी। आधिकारिक वाली खोलें।",
"health.closed":"ऐप बंद होने पर",
"health.closedOk":"वे आपका फ़ोन बजा सकते हैं।",
"health.closedOff":"वे आप तक नहीं पहुँच सकते। ऊपर सूचनाएं चालू करें।",
"health.closedDenied":"ब्राउज़र सूचनाएं रोक रहा है: ऐप बंद होने पर कोई आप तक नहीं पहुँचेगा।",
"health.closedIos":"iPhone पर पहले ऐप को होम स्क्रीन में जोड़ना होगा।",
"health.mic":"माइक्रोफ़ोन",
"health.micOk":"उपलब्ध है।",
"health.micBad":"ब्राउज़र ने रोक रखा है: आप न कॉल कर सकेंगे न ले सकेंगे।",
"health.micUnknown":"जब तक आप कॉल आज़मा नहीं लेते, मैं नहीं जान सकता।",
"health.version":"इस्तेमाल हो रहा संस्करण",
"health.versionOld":"ऐप का एक हिस्सा अब भी पुराना है। इसे बंद करके दोबारा खोलें।",
"media.stepsAndroidApp":"फ़ोन की होम स्क्रीन पर वापस जाएं|<b>DigitalValut Logos</b> आइकन को दबाकर रखें|<b>ऐप की जानकारी</b> (या ⓘ आइकन) पर टैप करें|<b>अनुमतियां</b> पर टैप करें, फिर <b>माइक्रोफ़ोन</b> और <b>कैमरा</b> चालू करें|ऐप फिर से खोलें"
});

Object.assign(I18N.bn, {
"onboard.text":"<b>DigitalValut Logos</b> — বিনামূল্যে এবং ওপেন-সোর্স সফ্টওয়্যার (Apache 2.0 লাইসেন্স), Associazione di Promozione Sociale DigitalValut-এর মালিকানাধীন, একটি নিবন্ধিত ইতালীয় অলাভজনক সংস্থা (Ente del Terzo Settore)। বিশ্বের যে কোনো জায়গা থেকে, যে কেউ এটি বিনামূল্যে ডাউনলোড এবং ব্যবহার করতে পারেন।",
"install.btn":"ইনস্টল করুন",
"home.title":"যার সাথে চান কথা বলুন, তিনি যেখানেই থাকুন",
"home.sub":"বার্তা, ছবি, ভিডিও, কল। কোনো সাইন-আপ নেই, কোনো ফোন নম্বর নেই, চিরকালের জন্য বিনামূল্যে।",
"home.nameLabel":"আপনার নাম","home.namePh":"আপনার নাম",


"home.legalSummary":"এটি কীভাবে কাজ করে, তিনটি প্রযুক্তিগত লাইনে",
"home.legalBody":"এটি আপনি যার সাথে কথা বলছেন তাকে আপনার নেটওয়ার্ক ঠিকানা (IP) দেখায়; আপনাদের দুজনকেই একই সময়ে অনলাইনে থাকতে হবে, নাহলে কিছুই পৌঁছাবে না, এবং অত্যন্ত ফিল্টার করা নেটওয়ার্কে কল সংযুক্ত নাও হতে পারে; কোনো ওয়েবসাইট কখনও স্ক্রিনশট আটকাতে পারে না।",
"nav.back":"পিছনে",
"start.create":"আমন্ত্রণ প্রস্তুত করুন","start.share":"আমন্ত্রণ পাঠান","btn.copyCode":"কোড কপি করুন",
"start.pastePh":"উত্তর এখানে পেস্ট করুন…","btn.connect":"চ্যাটে প্রবেশ করুন",
"join.pastePh":"আমন্ত্রণ এখানে পেস্ট করুন…","join.generate":"আমন্ত্রণ খুলুন",
"join.sendAnswer":"উত্তর পাঠান",
"chat.someone":"কেউ একজন","chat.connected":"সংযুক্ত","chat.typePh":"একটি বার্তা লিখুন…","chat.dropHere":"পাঠাতে এখানে ছাড়ুন",
"call.hangup":"শেষ করুন","call.accept":"উত্তর দিন","call.decline":"প্রত্যাখ্যান করুন",
"menu.title":"সরঞ্জাম","menu.arm":"স্ব-ধ্বংস","menu.disarm":"বাতিল করুন",
"menu.clearHistory":"ইতিহাস মুছুন","menu.endChat":"চ্যাট শেষ করুন",
"menu.historyNote":"ইতিহাস শুধুমাত্র এই ডিভাইসে থাকে, আপনি যার সাথে কথা বলছেন তার নামের সাথে যুক্ত। কোনো সার্ভার এটি রাখে না।",
"footer.text":"বিনামূল্যে এবং ওপেন-সোর্স সফ্টওয়্যার (Apache 2.0 লাইসেন্স), DigitalValut APS ETS-এর একটি প্রকল্প।",
"footer.noserver":"কোনো সার্ভার নেই: WebRTC-এর মাধ্যমে দুটি ব্রাউজারের মধ্যে সংযোগ সরাসরি।",
"footer.author":"DigitalValut-এর জন্য ড. জিউসেপ্পে ফালসোনে দ্বারা পরিকল্পিত। © 2026 DigitalValut এবং DigitalValut টিম।",
"footer.license":"ওপেন-সোর্স লাইসেন্স পড়ুন","footer.source":"GitHub-এ সোর্স কোড",
"verify.badge":"যাচাই করুন","verify.title":"নিরাপত্তা কোড",
"verify.lead":"অন্য ব্যক্তির সাথে এটি মিলিয়ে দেখুন — জোরে বলে, ফোনে, অথবা আমন্ত্রণ কোড বিনিময়ের চেয়ে আলাদা কোনো মাধ্যমে। যদি দুটি কোড ঠিক না মেলে, তাহলে কেউ সংযোগে ঢুকে পড়তে পারে: সেই চ্যাটে বিশ্বাস করবেন না।",
"verify.close":"বন্ধ করুন","verify.unavailable":"এখনও প্রস্তুত নয় — একটু পরে আবার চেষ্টা করুন।",
"contacts.title":"সাম্প্রতিক পরিচিতি",
"contacts.note":"তাদের আবার দেখতে একটি ট্যাপ: আপনারা একে অপরকে যা বলেছেন তা এখানে থেকে গেছে। প্রতিবার একটি নতুন আমন্ত্রণ প্রয়োজন, কারণ কোনো সার্ভার আপনার হয়ে কাউকে সংযুক্ত রাখে না।",
"toast.sealCopied":"কোড কপি হয়েছে","toast.copyFail":"কপি ব্যর্থ — হাতে নির্বাচন করে কপি করুন","toast.copySelected":"কপি ব্যর্থ — আপনার জন্য কোড নির্বাচিত হয়েছে, শুধু Ctrl/Cmd+C চাপুন",
"call.busy":"উত্তর দেননি — অন্য কলে ব্যস্ত।","call.declinedBy":"কল প্রত্যাখ্যান করেছেন।","call.connectFailed":"কলটি সংযুক্ত হয়নি। আবার চেষ্টা করুন।",
"call.joined":"চ্যাটে যোগ দিয়েছেন।","call.videoInvite":"আপনাকে ভিডিও কল করছেন","call.audioInvite":"আপনাকে কল করছেন",
"call.inVideo":"ভিডিও কল চলছে…","call.inAudio":"কল চলছে…","call.ringingVideo":"ভিডিও কল হচ্ছে, উত্তরের অপেক্ষায়…","call.ringingAudio":"কল হচ্ছে, উত্তরের অপেক্ষায়…",
"call.micFail":"মাইক্রোফোন বা ক্যামেরা উপলব্ধ নয়, বা অনুমতি প্রত্যাখ্যাত।",
"call.micFailNotFound":"এই ডিভাইসে কোনো মাইক্রোফোন বা ক্যামেরা পাওয়া যায়নি।",
"call.micFailBusy":"আপনার মাইক্রোফোন বা ক্যামেরা ইতিমধ্যে অন্য একটি অ্যাপ ব্যবহার করছে (Zoom, Teams, অন্য একটি ট্যাব…)। এটি বন্ধ করে আবার চেষ্টা করুন।",
"call.micFailDenied":"ব্রাউজার এই সাইটের জন্য মাইক্রোফোন এবং ক্যামেরা ব্লক করেছে। নিচের ধাপগুলো অনুসরণ করুন, তারপর পৃষ্ঠাটি পুনরায় লোড করুন।",
"reconnect.trying":"{n}-এর সাথে আবার সংযোগের চেষ্টা হচ্ছে…",
"reconnect.offline":"{n} এখন অনলাইনে আছেন বলে মনে হচ্ছে না। হাতে পাঠানোর জন্য এই কোডটি রইল।",
"call.noSpeakerFound":"এই ফোনে আলাদা স্পিকার পাওয়া যাচ্ছে না।",
"call.speakerFail":"এই ফোনে স্পিকার পরিবর্তন করা যাচ্ছে না।",
"destruct.countdown":"এত সময়ে স্ব-ধ্বংস হবে: ","destruct.done":"কথোপকথন স্ব-ধ্বংস হয়েছে।",
"session.closed":"বন্ধ","session.newHint":"আবার সংযোগের জন্য একটি নতুন সেশন তৈরি করুন।",
"invite.shareText":"DigitalValut Logos-এ আমার সাথে চ্যাট করতে চান? এই লিঙ্কটি খুলুন: যদি আপনার পৃষ্ঠা প্রস্তুত না থাকে, এটি নিজে থেকেই খুলবে এবং আমার আমন্ত্রণ আগে থেকেই পূরণ করা থাকবে।\n\n",
"invite.answerText":"এই রইল DigitalValut Logos-এর জন্য আমার উত্তর, সংযোগ শেষ করতে এটি পেস্ট করুন:\n\n",
"mic.recording":"রেকর্ডিং চলছে — থামাতে ট্যাপ করুন","history.cleared":"এই ডিভাইসে ইতিহাস মুছে ফেলা হয়েছে।",
"install.genericText":"<b>DigitalValut Logos ইনস্টল করুন</b> যাতে এটি নিজস্ব আইকন সহ একটি অ্যাপ হিসেবে থাকে, ব্রাউজারের প্রয়োজন ছাড়াই।",
"install.iosText":"<b>iPhone বা iPad-এ DigitalValut Logos ইনস্টল করুন।</b> Safari-তে <b>শেয়ার</b>-এ ট্যাপ করুন, তারপর <b>হোম স্ক্রিনে যোগ করুন</b>।",
"home.shareApp":"কাউকে অ্যাপ সম্পর্কে বলুন",
"start.s1":"আমন্ত্রণ পাঠান",
"start.s1help":"কমলা বোতাম চাপুন। অ্যাপটি আমন্ত্রণ প্রস্তুত করে এবং আপনাকে বেছে নিতে দেয় কীভাবে এটি পাঠাবেন: WhatsApp, একটি বার্তা, ইমেল — আপনি সাধারণত যা ব্যবহার করেন।",
"start.s2":"তাদের উত্তর পেস্ট করুন",
"start.s2help":"তারা আপনাকে একটি বার্তা ফেরত পাঠাবে। এটি কপি করুন, এখানে ফিরে আসুন এবং <b>পেস্ট</b> চাপুন। তারপর আপনারা একসাথে চ্যাটে প্রবেশ করবেন।",
"join.s1":"আমন্ত্রণ খুলুন",
"join.s1help":"আপনি যদি আপনাকে পাঠানো লিঙ্কটি খুলে থাকেন, তাহলে সবকিছু প্রস্তুত: কমলা বোতাম চাপুন। নাহলে <b>পেস্ট</b> চাপুন।",
"join.s2":"উত্তর পাঠান",
"join.s2help":"শেষ ধাপ: যিনি আপনাকে আমন্ত্রণ জানিয়েছেন তার কাছে এটি ফেরত পাঠান, এবং আপনারা সংযুক্ত হয়ে যাবেন।",
"btn.paste":"পেস্ট করুন","btn.showCode":"কোড দেখান",
"toast.clipboardEmpty":"পেস্ট করার মতো কিছু নেই।","toast.pasteManually":"বাক্সের উপর আঙুল ধরে রাখুন এবং পেস্ট নির্বাচন করুন।",
"home.shareAppText":"বিনামূল্যে, অ্যাকাউন্ট ছাড়াই, যেকোনো ফোন বা কম্পিউটারে কাজ করে, ছবি ও ফাইল আসল মানে পাঠায় — DigitalValut Logos:\n\n",
"lock.title":"অতিরিক্ত সুরক্ষা",
"lock.sub":"আপনি জোরে বলা একটি পাসফ্রেজ দিয়ে আমন্ত্রণ লক করে। কোডটি WhatsApp, ইমেল বা SMS-এর মাধ্যমে গেলে এটি চালু করা মূল্যবান।",
"lock.passCap":"পাসফ্রেজ",
"lock.passHint":"এটি জোরে বলুন, অথবা কোডের থেকে আলাদা মাধ্যমে পাঠান। এটি ছাড়া কোড খুলবে না।",
"lock.ask":"এই আমন্ত্রণটি লক করা আছে। আপনাকে জোরে বলা পাসফ্রেজটি টাইপ করুন।",
"lock.askPh":"পাসফ্রেজ","lock.working":"একটু অপেক্ষা করুন…",
"lock.needPass":"এই আমন্ত্রণ খুলতে পাসফ্রেজ টাইপ করুন।",
"lock.wrongPass":"ভুল পাসফ্রেজ। এটি পরীক্ষা করে আবার চেষ্টা করুন।",
"lock.badAnswer":"অবৈধ উত্তর — অথবা এটি ভিন্ন পাসফ্রেজ দিয়ে সিল করা হয়েছিল।",
"join.badCode":"এই কোডটি বৈধ নয়। আপনি এটি সম্পূর্ণ কপি করেছেন কিনা পরীক্ষা করুন।",
"connect.waiting":"সংযোগের অপেক্ষায়…",
"connect.failed":"সংযোগ করা যায়নি। নিশ্চিত করুন আপনারা দুজনেই অনলাইনে আছেন, তারপর একটি নতুন আমন্ত্রণ তৈরি করুন — পুরানো কোড পুনরায় ব্যবহার করা যায় না।",
"connect.slow":"এটি স্বাভাবিকের চেয়ে বেশি সময় নিচ্ছে — এটি অত্যন্ত ফিল্টার করা নেটওয়ার্কে (কর্মক্ষেত্র, কিছু মোবাইল নেটওয়ার্ক) অথবা আপনারা একই সময়ে অনলাইনে না থাকলে ঘটে। আরেকটু অপেক্ষা করুন, অথবা একটি নতুন আমন্ত্রণ তৈরি করুন।",
"footer.seal":"এই অ্যাপের ফিঙ্গারপ্রিন্ট (SHA-256):",
"verify.known":"যাচাইকৃত","verify.changedShort":"কোড পরিবর্তিত হয়েছে","verify.accept":"নতুন কোড গ্রহণ করুন",
"verify.noteKnown":"গত বারের মতো একই কোড: তারপর থেকে কেউ ঢুকে পড়েনি।",
"verify.noteNew":"এই ব্যক্তির সাথে প্রথমবার: কোডটি জোরে মিলিয়ে দেখুন, তারপর অ্যাপ এটি মনে রাখবে।",
"verify.noteChanged":"কোড পরিবর্তিত হয়েছে। সাধারণত এর অর্থ একটি নতুন ফোন বা পুনরায় ইনস্টল করা অ্যাপ — তবে এটি বাধাদানের মতোও দেখাতে পারে। গ্রহণ করার আগে এটি জোরে মিলিয়ে দেখুন।",
"quick.titleA":"আপনার কোড",
"quick.helpA":"নিচের বোতাম দিয়ে এটি পাঠান — একটি ট্যাপ এবং তারা ঢুকে যাবে। অথবা ছয়টি সংখ্যা জোরে বলুন। আপনি এই স্ক্রিনে থাকা পর্যন্ত এটি কাজ করতে থাকবে।",
"quick.orType":"অথবা অ্যাপ খুলুন এবং এই কোডটি টাইপ করুন:","quick.qrHint":"অথবা এখানে ফোনের ক্যামেরা ধরুন",
"quick.newCode":"একটি নতুন কোড তৈরি করুন","quick.useLong":"দীর্ঘ কোড পছন্দ করেন?",
"quick.titleB":"কোড টাইপ করুন",
"quick.helpB":"যিনি আপনাকে আমন্ত্রণ জানিয়েছেন তার কাছে কোড চান — ৬টি সংখ্যা, জোরে বলা বা লেখা — এবং এখানে টাইপ করুন।",
"quick.codePh":"000000","quick.connect":"সংযোগ করুন",
"quick.waiting":"অন্য ব্যক্তি কোড টাইপ করার অপেক্ষায়…","quick.expired":"কোডের মেয়াদ উত্তর ছাড়াই শেষ হয়ে গেছে। একটি নতুন তৈরি করুন।",
"quick.notFound":"কোডের মেয়াদ শেষ বা ভুল। যিনি আপনাকে দিয়েছেন তার সাথে এটি পরীক্ষা করুন।",
"quick.shareText":"DigitalValut Logos-এ আমার সাথে কথা বলার লিঙ্ক এই রইল। এটি ট্যাপ করুন এবং আমরা সংযুক্ত হয়ে যাব:",
"quick.share":"আমন্ত্রণ পাঠান",
"notify.title":"কেউ আমাকে খুঁজলে আমাকে জানান",
"notify.sub":"কোনো পরিচিতি আপনার কাছে পৌঁছানোর চেষ্টা করলে এবং আপনার অ্যাপ খোলা না থাকলে একটি বিজ্ঞপ্তি — কোনো নাম নেই, কোনো বার্তা নেই, শুধু একটি ইঙ্গিত।",
"notify.iosHint":"iPhone-এ এটি তখনই কাজ করে যখন আপনি প্রথমে অ্যাপটি আপনার হোম স্ক্রিনে যোগ করেছেন: Safari-তে <b>শেয়ার</b>-এ ট্যাপ করুন, তারপর <b>হোম স্ক্রিনে যোগ করুন</b>, এবং সেখান থেকে অ্যাপ খুলুন।",
"notify.blocked":"ব্রাউজার বিজ্ঞপ্তি ব্লক করেছে। সাইটের সেটিংস পরীক্ষা করুন।",
"sas.title":"নিরাপত্তা পরীক্ষা",
"sas.lead":"একে অপরকে এই তিনটি শব্দ জোরে বলুন। আপনারা দুজনেই একই শব্দ দেখলে, কেউ ঢুকে পড়েনি।",
"sas.leadChanged":"সতর্ক থাকুন: এই ব্যক্তি আর গতবারের মতো একই ব্যক্তি বলে মনে হচ্ছে না। সাধারণত এর অর্থ একটি নতুন ফোন বা পুনরায় ইনস্টল করা অ্যাপ — তবে এটি বাধাদানের মতোও দেখাতে পারে। চালিয়ে যাওয়ার আগে তিনটি শব্দ জোরে বলুন।",
"sas.yes":"হ্যাঁ, মিলছে","sas.no":"না, আলাদা",
"sas.note":"এই ব্যক্তির সাথে শুধুমাত্র প্রথমবার প্রয়োজন: তারপর, অ্যাপ এটি মনে রাখে।",
"sas.confirmed":"পরিচিতি যাচাই করা হয়েছে।",
"sas.refused":"শব্দগুলো মেলেনি: এই কথোপকথনটি নিরাপদ বলে বিবেচিত হয় না। এটি বন্ধ করুন এবং একটি নতুন কোড দিয়ে আবার শুরু করুন।",
"connect.bigTitle":"সংযোগ হচ্ছে…","connect.bigHint":"অ্যাপ বন্ধ করবেন না — এতে মাত্র কয়েক সেকেন্ড লাগে।",
"autoclean.title":"স্বয়ংক্রিয় পরিষ্কার","autoclean.sub":"নির্দিষ্ট সংখ্যক দিনের চেয়ে পুরনো কথোপকথন নিজে থেকেই মুছে ফেলে, যাতে সেগুলো আপনার ফোনে জায়গা দখল করে না রাখে। ডিফল্টভাবে বন্ধ: আপনি নিজে চালু না করা পর্যন্ত কিছুই নিজে থেকে মুছে যায় না।","autoclean.after":"এর চেয়ে পুরনো কথোপকথন মুছুন:","autoclean.d7":"৭ দিন","autoclean.d30":"৩০ দিন","autoclean.d90":"৯০ দিন","autoclean.d365":"১ বছর",
"wake.waitsNote":"আপনি অ্যাপটি বন্ধ করতে পারেন: আমন্ত্রণ খোলা হলে আমি আপনাকে জানাব।","wake.calling":"{name}-কে জানানো হচ্ছে…","wake.callingHint":"তাঁর ফোন বেজে উঠেছে। তিনি অ্যাপ খোলামাত্র আপনারা যুক্ত হয়ে যাবেন — আপনি এখানে অপেক্ষা করতে পারেন।","wake.noAnswer":"তাঁকে জানানো হয়েছে কিন্তু তিনি এখনও অ্যাপ খোলেননি। পরে আবার চেষ্টা করুন।",
"quick.helpAWaits":"নিচের বোতাম দিয়ে পাঠান — অন্য ব্যক্তিকে শুধু সেটিতে চাপ দিতে হবে, ব্যস। অথবা তাঁকে ছয়টি সংখ্যা মুখে বলে দিন।",
"verify.inPerson":"সামনাসামনি যাচাই করা","verify.inPersonDone":"সামনাসামনি যাচাই করা: আপনি কোডটি এই ব্যক্তিরই স্ক্রিন থেকে স্ক্যান করেছেন, তাই কেউ মাঝখানে ঢুকতে পারেনি। তিনটি শব্দ বলার দরকার নেই।","sas.leadMismatch":"সাবধান: যে সাড়া দিয়েছে সেটি আপনার স্ক্যান করা কোডের ফোন নয়। এটি ভুল হতে পারে, কিন্তু কেউ মাঝখানে ঢুকে পড়লেও ঠিক এমনটাই দেখা যেত। একে অপরকে মুখে তিনটি শব্দ না বলা পর্যন্ত কিছু লিখবেন না।",
"easy.title":"সহজ মোড","easy.sub":"শুধু দুটি বড় বোতাম, আশেপাশে আর কিছু নেই। যাঁরা কিছু ভাবতে চান না তাঁদের জন্য — বা যিনি অন্য কারও ফোন গুছিয়ে দিচ্ছেন তাঁর জন্য।","easy.voiceTitle":"জোরে বলে দাও","easy.voiceSub":"অ্যাপটি আপনার ভাষায় বলে দেয় কী করতে হবে। যাঁদের পর্দা পড়তে কষ্ট হয় তাঁদের জন্য।","easy.voiceOn":"ঠিক আছে। এখন থেকে আমি বলে দেব কী করতে হবে।","easy.sayHome":"কথা শুরু করতে প্রথম বোতামে চাপ দিন। কেউ আমন্ত্রণ পাঠিয়ে থাকলে দ্বিতীয়টিতে চাপ দিন।","easy.sayStart":"এটি আপনার কোড। যাকে চান পাঠাতে কমলা বোতামে চাপ দিন।","easy.sayJoin":"আপনাকে দেওয়া ছয়টি সংখ্যা লিখুন।","easy.sayChat":"যুক্ত হয়ে গেছে। এখন কথা বলতে পারেন।",
"broker.down":"যে পরিষেবা আপনাদের একে অপরকে খুঁজে পেতে সাহায্য করে সেটি সাড়া দিচ্ছে না। নিচের লম্বা কোডটি তবুও কাজ করে: এটি কোনো সার্ভারের মধ্য দিয়ে যায় না।",
"flash.title":"সংযুক্ত","flash.titleWith":"{name}-এর সঙ্গে সংযুক্ত","flash.direct":"আপনাদের দুই ফোনের মধ্যে সরাসরি সংযোগ","flash.relay":"এনক্রিপ্টেড সেতুর মাধ্যমে সংযুক্ত — আপনাদের নেটওয়ার্ক সরাসরি সংযোগ দেয়নি","flash.noserver":"কোনও সার্ভার আপনাদের কথা পড়তে পারে না","flash.time":"{s} সেকেন্ডে, কোথাও নিবন্ধন না করেই",
"viral.title":"এটা কাজ করেছে।","viral.sub":"কাজে লেগে থাকলে অন্যকেও জানান: এটি বিনামূল্যে, কোনও অ্যাকাউন্ট চায় না, কারও কিছুই রাখে না।","viral.btn":"কাউকে জানান",
"media.title":"মাইক্রোফোন ও ক্যামেরা","media.warnDenied":"এই ব্রাউজার মাইক্রোফোন আটকে রেখেছে: আপনি কল করতে বা ধরতে পারবেন না।","media.warnFix":"কীভাবে ঠিক করবেন","media.retry":"আবার চেষ্টা করুন","media.close":"বন্ধ করুন","media.nowOk":"মাইক্রোফোন চালু। এখন কল করতে পারেন।","media.peerNoMic":"{name} ধরেছেন, কিন্তু তাঁর ব্রাউজার মাইক্রোফোন চালু করতে দিচ্ছে না। তিনি আপনাকে ফিরিয়ে দেননি।","media.peerNoCam":"{name} ধরেছেন, কিন্তু তাঁর ব্রাউজার ক্যামেরা ও মাইক্রোফোন চালু করতে দিচ্ছে না। শুধু অডিও কল চেষ্টা করুন, বা তাঁকে বাধা সরাতে বলুন।","media.stepsIos":"আইফোনে <b>সেটিংস</b> খুলুন|নিচে নেমে <b>Safari</b> ট্যাপ করুন|<b>মাইক্রোফোন</b> তারপর <b>ক্যামেরা</b> ট্যাপ করুন: <b>জিজ্ঞাসা করুন</b> বা <b>অনুমতি দিন</b> রাখুন|এখানে ফিরে এসে পাতাটি আবার লোড করুন","media.stepsAndroid":"উপরে ঠিকানার পাশে <b>তালা</b> ট্যাপ করুন|<b>অনুমতি</b> ট্যাপ করুন|<b>মাইক্রোফোন</b> ও <b>ক্যামেরা</b> চালু করুন|পাতাটি আবার লোড করুন","media.stepsChrome":"ঠিকানার বাঁ পাশে <b>তালায়</b> ক্লিক করুন|<b>মাইক্রোফোন</b> ও <b>ক্যামেরা</b> চালু করুন|পাতাটি আবার লোড করুন","media.stepsSafariMac":"মেনু বারে <b>Safari</b> › <b>এই ওয়েবসাইটের সেটিংস</b> খুলুন|<b>মাইক্রোফোন</b> ও <b>ক্যামেরা</b> <b>অনুমতি দিন</b>-এ রাখুন|পাতাটি আবার লোড করুন","media.stepsFirefox":"ঠিকানার বাঁ পাশে <b>তালায়</b> ক্লিক করুন|<b>মাইক্রোফোন ব্যবহার</b> ও <b>ক্যামেরা ব্যবহার</b>-এর পাশের বাধা সরান|পাতাটি আবার লোড করুন","media.stepsOther":"এই সাইটের জন্য ব্রাউজারের সেটিংস খুলুন|<b>মাইক্রোফোন</b> ও <b>ক্যামেরা</b> অনুমতি দিন|পাতাটি আবার লোড করুন",
"addr.title":"আপনার স্থায়ী ঠিকানা","addr.sub":"ফোন নম্বরের বদলে এটি দিন। যার কাছে এটি আছে সে যখন খুশি আপনার সঙ্গে যোগাযোগ করতে পারবে, আপনার নাম বা নম্বর না জেনেই। ডিফল্টভাবে বন্ধ।","addr.qrHint":"যে এটি স্ক্যান করবে সরাসরি আপনাকে ডাকবে","addr.share":"আপনার ঠিকানা পাঠান","addr.showQr":"QR দেখান","addr.reachNote":"অ্যাপ বন্ধ থাকলেও যাতে আপনাকে পাওয়া যায়, নিচের বিজ্ঞপ্তি চালু করুন।","addr.dialLabel":"কারও ঠিকানা আছে?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"ডাকুন","addr.badFormat":"এই ঠিকানাটি ঠিকভাবে লেখা হয়নি। এটি ১২টি অক্ষরের, যেমন DV-K7M2-9QRT-X4WP।","addr.itsYou":"এটি তো আপনার নিজের ঠিকানা।","addr.callingTitle":"ডাকা হচ্ছে…","addr.callingHint":"তাঁর অ্যাপ বন্ধ থাকলে আমি ফোন বাজিয়ে দেব। একটু সময় লাগতে পারে।","addr.noAnswer":"সাড়া নেই। জানিয়ে দিয়েছি: পরে চেষ্টা করুন।","addr.dialFailed":"এই ঠিকানায় ডাকতে পারিনি।","addr.noKey":"এই ঠিকানাটি আর সক্রিয় বলে মনে হচ্ছে না। ওই ব্যক্তিকে অ্যাপটি আবার খুলে ঠিকানাটি আবার পাঠাতে বলুন: সর্বশেষ হালনাগাদে ঠিকানা বদলে গেছে।","addr.noBroker":"আমি কলটা শুরুই করতে পারিনি: যে সেবা আপনাদের যোগাযোগ করিয়ে দেয় সেটি সাড়া দেয়নি। আপনি যদি অ্যাপের কোনো কপি অন্য ঠিকানায় ব্যবহার করেন, তবে আসলটি খুলুন।","addr.incomingTitle":"কেউ আপনাকে খুঁজছে","addr.incomingSub":"নাম আর কারণ যিনি ডাকছেন তিনিই লিখেছেন: আপনি গ্রহণ না করা পর্যন্ত কেউ প্রমাণ করতে পারে না যে তিনি সত্যিই সেই ব্যক্তি।","addr.incomingToast":"কেউ আপনার ঠিকানায় ডাকছে।","addr.accept":"গ্রহণ করুন","addr.ignore":"উপেক্ষা করুন","addr.verified":"যাচাই হয়েছে: যিনি সাড়া দিয়েছেন তিনি সত্যিই {a} ঠিকানার মালিক। কেউ মাঝখানে ঢুকতে পারেনি।","addr.blockedIn":"আপনি আগে ফিরিয়ে দিয়েছেন এমন কারও ডাক: উপেক্ষা করা হয়েছে।","addr.shareText":"আমাকে এখানে পাওয়া যাবে, আমার ফোন নম্বর ছাড়াই। DigitalValut Logos-এ আমার ঠিকানা {a}\n\nআমাকে ডাকতে ট্যাপ করুন:",
"addr.incomingAt":"«{name}»-এর মাধ্যমে","burn.title":"একবার ব্যবহারের ঠিকানা","burn.help":"প্রতিটি বিজ্ঞাপনের জন্য একটি, প্রতিটি অপরিচিতের জন্য একটি। কাজ শেষে মুছে দিন, সেই ব্যক্তি আর আপনাকে পাবে না — আসলটি তার কাছে কখনও ছিলই না।","burn.namePh":"কীসের জন্য? যেমন: পুরনো সোফা","burn.add":"তৈরি করুন","burn.send":"এই ঠিকানা পাঠান","burn.delete":"মুছুন","burn.deleted":"«{name}» মোছা হয়েছে। ওই ঠিকানা আর সাড়া দেয় না।","burn.made":"«{name}» তৈরি হয়েছে। এখন দিতে পারেন।","burn.needName":"একটি নাম দিন, যাতে মনে থাকে কাকে দিয়েছেন।","burn.full":"একসঙ্গে সর্বোচ্চ {n}টি রাখতে পারেন। নতুন বানাতে একটি মুছুন।","burn.untitled":"নামহীন",
"knock.title":"আপনি যোগাযোগ করছেন","knock.nameLabel":"আপনার নাম কী?","knock.namePh":"আপনার নাম","knock.msgLabel":"আপনার কী দরকার? (ইচ্ছা হলে)","knock.msgPh":"যেমন: ৪২ সাইজের জুতো আছে?","knock.go":"ডাকুন","knock.note":"আপনার নাম আর এই বাক্যটি কেবল যাকে ডাকছেন তিনিই দেখেন। কোনও সার্ভার সেগুলি পড়তে পারে না।",
"letter.title":"আপনার জন্য রাখা বার্তা","letter.noneTitle":"এখন কেউ সাড়া দিচ্ছে না।","letter.noneSub":"আমি তাকে আগেই জানিয়ে দিয়েছি যে আপনি তার সঙ্গে যোগাযোগের চেষ্টা করেছেন। আরও কিছু বলতে চাইলে এখানে লিখুন।","letter.ph":"আপনার বার্তা এখানে লিখুন","letter.leave":"বার্তা রাখুন","letter.cancel":"থাক","letter.needText":"দু-এক কথা লিখুন, যাতে বোঝেন আপনি কী চেয়েছিলেন।","letter.left":"বার্তা রাখা হয়েছে। অ্যাপ খুললেই দেখতে পাবেন।","letter.failed":"বার্তা রাখতে পারিনি। আবার চেষ্টা করুন।","letter.callBack":"ফিরে ডাকুন","letter.dismiss":"হয়েছে",
"home.bigStart":"কারও সঙ্গে কথা বলুন","home.bigStartD":"পাঠানোর জন্য আমন্ত্রণ তৈরি করুন","home.bigJoin":"আমার কাছে কোড আছে","home.bigJoinD":"কেউ আমাকে আমন্ত্রণ পাঠিয়েছে","set.lang":"ভাষা","set.textsize":"লেখার আকার","conn.direct":"দুই ফোনের মধ্যে সরাসরি সংযোগ","conn.directShort":"সরাসরি যুক্ত","conn.relay":"এনক্রিপ্টেড সেতুর মাধ্যমে নিরাপদ সংযোগ","conn.relayShort":"যুক্ত (সেতু)","conn.down":"সংযোগ বিচ্ছিন্ন","conn.downShort":"বিচ্ছিন্ন","conn.working":"সংযোগ হচ্ছে","conn.wobbly":"সংযোগ টলে গেছে — আবার জুড়ছি","conn.wobblyShort":"আবার জুড়ছি","chat.linkLost":"সংযোগ বিচ্ছিন্ন হয়েছে। কিছুই হারায়নি — অ্যাপটি আবার খুলে সাম্প্রতিক পরিচিতি থেকে আবার যুক্ত হোন।",
"call.flipFail":"এই ফোনে ক্যামেরা বদলাতে পারছি না।",
"call.flipBusy":"ক্যামেরা অন্য অ্যাপ ব্যবহার করছে। সেটি বন্ধ করে আবার চেষ্টা করুন।","call.flipDenied":"ব্রাউজার এই সাইটের জন্য ক্যামেরা আটকে রেখেছে।","call.flipOnlyOne":"এই ডিভাইসে একটিই ক্যামেরা আছে।",
"home.alreadyTalking":"আপনি ইতিমধ্যে একটি কথোপকথনে আছেন। আরেকটি শুরু করতে আগে এটি বন্ধ করুন।","home.stillCalling":"আমি এখনও ডাকছি। সাড়ার জন্য অপেক্ষা করুন, বা ডাকটি বাতিল করুন।","home.busyReconnect":"আপনি এখন ব্যস্ত আছেন। আবার চেষ্টা করার আগে বর্তমান সংযোগটি শেষ করুন বা বন্ধ করুন।",
"letter.missed":"আপনার সঙ্গে কথা বলতে চেয়েছিলেন।",
"sas.blocked":"আগে তিনটি শব্দ মুখে বলে মিলিয়ে নিন: এই ব্যক্তি আর আগের জন নন।",
"file.tooBig":"একটি আসন্ন ফাইল থামানো হয়েছে: এটি ঘোষিত তথ্যের সঙ্গে মেলেনি।","file.sendFailed":"পাঠানো বন্ধ হয়ে গেছে: সংযোগ মাঝপথে বন্ধ হয়ে গেছে।","file.progress":"{total}-এর মধ্যে {sent}",
"share.pending":"{n}টি ফাইল পাঠানোর জন্য প্রস্তুত — সংযুক্ত হলেই চলে যাবে",
"health.storage":"ফোনের মেমোরি",
"health.storageFull":"পূর্ণ: কথোপকথন আর সংরক্ষিত হচ্ছে না। ফোনে জায়গা খালি করুন।",
"addr.lifespan":"এই ঠিকানার মেয়াদ শেষ হয় না। অ্যাপের তথ্য এই ফোনে থাকা পর্যন্ত এটি বৈধ থাকে।",
"health.addrLife":"নিরাপত্তা শব্দ",
"health.addrLifeOk":"আরও প্রায় {n} দিন স্থির।",
"health.addrLifeSoon":"প্রায় {n} দিনের মধ্যে এগুলি নিজে থেকেই বদলে যাবে। আপনার পরিচিতদের আবার আপনার সঙ্গে মিলিয়ে দেখতে বলা হবে — এটি কোনো সমস্যার লক্ষণ নয়।","health.addrKeyBad":"তাঁরা আপনার কাছে পৌঁছাতে পারবেন না: এই ফোনটি তার ঠিকানার ভিত্তি হওয়া কি-টি প্রকাশ করতে পারেনি। সংযোগ দেখে অ্যাপটি আবার খুলুন।",
"health.title":"অ্যাপ কেমন চলছে",
"health.sub":"কেউ যদি আপনার কাছে পৌঁছাতে না পারে, কারণটি নিচে দেওয়া আছে।",
"health.recheck":"আবার দেখুন",
"health.copy":"রিপোর্ট কপি করুন",
"health.copied":"রিপোর্ট কপি হয়েছে।",
"health.checking":"পরীক্ষা করছি…",
"health.busy":"বিরতি: আপনি ইতিমধ্যে একটি কথোপকথনে আছেন।",
"health.stopped":"আমি শুনছি না। অ্যাপটি বন্ধ করে আবার খুলুন।",
"health.addr":"যার কাছে আপনার ঠিকানা আছে",
"health.addrOk":"এখনই আপনাকে ডাকতে পারে।",
"health.addrOff":"আপনার ঠিকানা বন্ধ। উপরে গিয়ে চালু করুন।",
"health.contacts":"আপনার পরিচিতরা",
"health.contactsOk":"তাঁরা এখনই আপনাকে আবার খুঁজে পেতে পারেন।",
"health.contactsNone":"আপনার এখনও কোনো পরিচিত নেই।",
"health.broker":"যে সেবা আপনাদের যোগাযোগ করায়",
"health.brokerOk":"সাড়া দিচ্ছে।",
"health.brokerBad":"সাড়া দিচ্ছে না। লম্বা কোডগুলো এখনও চলে: সেগুলো কোনো সার্ভার দিয়ে যায় না।",
"health.brokerOrigin":"অ্যাপের এই কপিটি এমন ঠিকানায় আছে যা সেবাটি চেনে না: এখান থেকে কাজ করবে না। আসলটি খুলুন।",
"health.closed":"অ্যাপ বন্ধ থাকলে",
"health.closedOk":"তাঁরা আপনার ফোন বাজাতে পারেন।",
"health.closedOff":"তাঁরা আপনার কাছে পৌঁছাতে পারবেন না। উপরে বিজ্ঞপ্তি চালু করুন।",
"health.closedDenied":"ব্রাউজার বিজ্ঞপ্তি আটকাচ্ছে: অ্যাপ বন্ধ থাকলে কেউ আপনার কাছে পৌঁছাবে না।",
"health.closedIos":"আইফোনে আগে অ্যাপটি হোম স্ক্রিনে যোগ করতে হবে।",
"health.mic":"মাইক্রোফোন",
"health.micOk":"পাওয়া যাচ্ছে।",
"health.micBad":"ব্রাউজার আটকে রেখেছে: আপনি ডাকতেও পারবেন না, ধরতেও পারবেন না।",
"health.micUnknown":"আপনি একবার ডাকার চেষ্টা না করলে আমি জানতে পারব না।",
"health.version":"ব্যবহৃত সংস্করণ",
"health.versionOld":"অ্যাপের একটি অংশ এখনও পুরোনো। বন্ধ করে আবার খুলুন।",
"media.stepsAndroidApp":"ফোনের হোম স্ক্রিনে ফিরে যান|<b>DigitalValut Logos</b> আইকনটি চেপে ধরে রাখুন|<b>অ্যাপ তথ্য</b> (বা ⓘ আইকন) ট্যাপ করুন|<b>অনুমতি</b> ট্যাপ করুন, তারপর <b>মাইক্রোফোন</b> ও <b>ক্যামেরা</b> চালু করুন|অ্যাপটি আবার খুলুন"
});

Object.assign(I18N.id, {
"onboard.text":"<b>DigitalValut Logos</b> — perangkat lunak bebas dan sumber terbuka (lisensi Apache 2.0), dimiliki oleh Associazione di Promozione Sociale DigitalValut, sebuah organisasi nirlaba Italia terdaftar (Ente del Terzo Settore). Dapat diunduh dan digunakan secara gratis oleh siapa saja, di mana saja di dunia.",
"install.btn":"Pasang",
"home.title":"Bicara dengan siapa pun yang Anda mau, di mana pun mereka berada",
"home.sub":"Pesan, foto, video, panggilan. Tanpa pendaftaran, tanpa nomor telepon, gratis selamanya.",
"home.nameLabel":"Nama Anda","home.namePh":"Nama Anda",


"home.legalSummary":"Cara kerjanya, dalam tiga baris teknis",
"home.legalBody":"Ini mengungkapkan alamat jaringan (IP) Anda kepada lawan bicara Anda; Anda berdua harus online bersamaan, jika tidak tidak ada yang sampai, dan pada jaringan yang sangat difilter panggilan mungkin tidak tersambung; tidak ada situs web yang bisa mencegah tangkapan layar, tidak pernah.",
"nav.back":"Kembali",
"start.create":"Siapkan undangan","start.share":"Kirim undangan","btn.copyCode":"Salin kode",
"start.pastePh":"Tempel balasan di sini…","btn.connect":"Masuk ke obrolan",
"join.pastePh":"Tempel undangan di sini…","join.generate":"Buka undangan",
"join.sendAnswer":"Kirim balasan",
"chat.someone":"Seseorang","chat.connected":"tersambung","chat.typePh":"Tulis pesan…","chat.dropHere":"Lepaskan di sini untuk mengirim",
"call.hangup":"Akhiri","call.accept":"Jawab","call.decline":"Tolak",
"menu.title":"Alat","menu.arm":"Penghancuran diri","menu.disarm":"Batal",
"menu.clearHistory":"Hapus riwayat","menu.endChat":"Akhiri obrolan",
"menu.historyNote":"Riwayat hanya tersimpan di perangkat ini, terkait dengan nama orang yang Anda ajak bicara. Tidak ada server yang menyimpannya.",
"footer.text":"perangkat lunak bebas dan sumber terbuka (lisensi Apache 2.0), sebuah proyek DigitalValut APS ETS.",
"footer.noserver":"Tanpa server: koneksi langsung antara dua browser melalui WebRTC.",
"footer.author":"Digagas oleh Dr. Giuseppe Falsone untuk DigitalValut. © 2026 DigitalValut dan Tim DigitalValut.",
"footer.license":"Baca lisensi sumber terbuka","footer.source":"Kode sumber di GitHub",
"verify.badge":"verifikasi","verify.title":"Kode keamanan",
"verify.lead":"Bandingkan dengan orang lain — dengan suara keras, lewat telepon, atau di saluran yang berbeda dari yang Anda gunakan untuk bertukar kode undangan. Jika kedua kode tidak cocok persis, seseorang mungkin telah menyisipkan diri ke dalam koneksi: jangan percaya obrolan itu.",
"verify.close":"Tutup","verify.unavailable":"Belum siap — coba lagi sebentar lagi.",
"contacts.title":"Kontak terbaru",
"contacts.note":"Satu ketukan untuk melihat mereka lagi: apa yang kalian katakan satu sama lain tetap di sini. Setiap kali membutuhkan undangan baru, karena tidak ada server yang menjaga siapa pun tetap terhubung untuk Anda.",
"toast.sealCopied":"Kode disalin","toast.copyFail":"Gagal menyalin — pilih dan salin secara manual","toast.copySelected":"Gagal menyalin — kode telah dipilihkan untuk Anda, cukup tekan Ctrl/Cmd+C",
"call.busy":"tidak menjawab — sedang sibuk di panggilan lain.","call.declinedBy":"menolak panggilan.","call.connectFailed":"Panggilan tidak tersambung. Coba lagi.",
"call.joined":"bergabung ke obrolan.","call.videoInvite":"menelepon video Anda","call.audioInvite":"meneleponi Anda",
"call.inVideo":"Panggilan video sedang berlangsung…","call.inAudio":"Panggilan sedang berlangsung…","call.ringingVideo":"Panggilan video, menunggu jawaban…","call.ringingAudio":"Memanggil, menunggu jawaban…",
"call.micFail":"Mikrofon atau kamera tidak tersedia, atau izin ditolak.",
"call.micFailNotFound":"Tidak ditemukan mikrofon atau kamera di perangkat ini.",
"call.micFailBusy":"Mikrofon atau kamera Anda sudah digunakan oleh aplikasi lain (Zoom, Teams, tab lain…). Tutup aplikasi itu dan coba lagi.",
"call.micFailDenied":"Peramban telah memblokir mikrofon dan kamera untuk situs ini. Ikuti langkah di bawah, lalu muat ulang halaman.",
"reconnect.trying":"Mencoba menyambung kembali ke {n}…",
"reconnect.offline":"{n} sepertinya sedang tidak online. Ini kodenya untuk dikirim secara manual.",
"call.noSpeakerFound":"Tidak dapat menemukan speaker terpisah di ponsel ini.",
"call.speakerFail":"Tidak dapat mengganti speaker di ponsel ini.",
"destruct.countdown":"akan hancur sendiri dalam ","destruct.done":"Percakapan telah hancur sendiri.",
"session.closed":"ditutup","session.newHint":"Buat sesi baru untuk menyambung kembali.",
"invite.shareText":"Ingin mengobrol dengan saya di DigitalValut Logos? Buka tautan ini: jika Anda belum siap dengan halamannya, tautan akan terbuka sendiri dengan undangan saya yang sudah terisi.\n\n",
"invite.answerText":"Ini balasan saya untuk DigitalValut Logos, tempel untuk menyelesaikan koneksi:\n\n",
"mic.recording":"Sedang merekam — ketuk untuk berhenti","history.cleared":"Riwayat dihapus di perangkat ini.",
"install.genericText":"<b>Pasang DigitalValut Logos</b> agar memilikinya sebagai aplikasi, dengan ikonnya sendiri, tanpa perlu browser.",
"install.iosText":"<b>Pasang DigitalValut Logos di iPhone atau iPad.</b> Ketuk <b>Bagikan</b> di Safari, lalu <b>Tambah ke Layar Utama</b>.",
"home.shareApp":"Beri tahu seseorang tentang aplikasi ini",
"start.s1":"Kirim undangan",
"start.s1help":"Tekan tombol oranye. Aplikasi menyiapkan undangan dan membiarkan Anda memilih cara mengirimkannya: WhatsApp, pesan, email — apa pun yang biasa Anda gunakan.",
"start.s2":"Tempel balasan mereka",
"start.s2help":"Mereka akan mengirimkan pesan balasan. Salin, kembali ke sini dan tekan <b>Tempel</b>. Lalu Anda berdua masuk ke obrolan bersama.",
"join.s1":"Buka undangan",
"join.s1help":"Jika Anda membuka tautan yang dikirim ke Anda, semuanya sudah siap: tekan tombol oranye. Jika tidak, tekan <b>Tempel</b>.",
"join.s2":"Kirim balasan",
"join.s2help":"Langkah terakhir: kirim ini kembali ke orang yang mengundang Anda, dan Anda pun tersambung.",
"btn.paste":"Tempel","btn.showCode":"Tampilkan kode",
"toast.clipboardEmpty":"Tidak ada yang bisa ditempel.","toast.pasteManually":"Tahan jari pada kotak dan pilih Tempel.",
"home.shareAppText":"Gratis, tanpa akun, berfungsi di ponsel atau komputer mana pun, mengirim foto dan berkas dalam kualitas asli — DigitalValut Logos:\n\n",
"lock.title":"Perlindungan ekstra",
"lock.sub":"Mengunci undangan dengan frasa sandi yang Anda ucapkan dengan suara keras. Berguna diaktifkan jika kode melewati WhatsApp, email, atau SMS.",
"lock.passCap":"Frasa sandi",
"lock.passHint":"Ucapkan dengan suara keras, atau kirim lewat saluran yang berbeda dari kode. Tanpa itu kode tidak akan terbuka.",
"lock.ask":"Undangan ini terkunci. Ketik frasa sandi yang diberitahukan kepada Anda dengan suara keras.",
"lock.askPh":"frasa sandi","lock.working":"Sebentar…",
"lock.needPass":"Ketik frasa sandi untuk membuka undangan ini.",
"lock.wrongPass":"Frasa sandi salah. Periksa dan coba lagi.",
"lock.badAnswer":"Balasan tidak valid — atau disegel dengan frasa sandi yang berbeda.",
"join.badCode":"Kode ini tidak valid. Periksa apakah Anda menyalinnya secara lengkap.",
"connect.waiting":"Menunggu koneksi…",
"connect.failed":"Tidak dapat terhubung. Pastikan Anda berdua online, lalu buat undangan baru — kode lama tidak dapat digunakan lagi.",
"connect.slow":"Ini memakan waktu lebih lama dari biasanya — hal ini terjadi pada jaringan yang sangat difilter (kantor, beberapa jaringan seluler) atau jika Anda tidak online pada saat yang sama. Tunggu sebentar lagi, atau buat undangan baru.",
"footer.seal":"Sidik jari aplikasi ini (SHA-256):",
"verify.known":"terverifikasi","verify.changedShort":"kode berubah","verify.accept":"Terima kode baru",
"verify.noteKnown":"Kode sama seperti terakhir kali: tidak ada yang menyisip sejak itu.",
"verify.noteNew":"Pertama kali dengan orang ini: bandingkan kode dengan suara keras, lalu aplikasi akan mengingatnya.",
"verify.noteChanged":"Kode telah berubah. Biasanya ini berarti ponsel baru atau aplikasi terpasang ulang — tetapi ini juga seperti apa penyadapan terlihat. Bandingkan dengan suara keras sebelum menerimanya.",
"quick.titleA":"Kode Anda",
"quick.helpA":"Kirim dengan tombol di bawah — satu ketukan dan mereka masuk. Atau ucapkan enam angka dengan suara keras. Ini akan terus berfungsi selama Anda tetap di layar ini.",
"quick.orType":"Atau buka aplikasi dan ketik kode ini:","quick.qrHint":"Atau arahkan kamera ponsel ke sini",
"quick.newCode":"Buat kode baru","quick.useLong":"Lebih suka kode panjang?",
"quick.titleB":"Ketik kode",
"quick.helpB":"Minta kode dari orang yang mengundang Anda — 6 angka, diucapkan dengan suara keras atau ditulis — dan ketik di sini.",
"quick.codePh":"000000","quick.connect":"Sambungkan",
"quick.waiting":"Menunggu orang lain mengetik kode…","quick.expired":"Kode kedaluwarsa tanpa jawaban. Buat yang baru.",
"quick.notFound":"Kode kedaluwarsa atau salah. Periksa dengan orang yang memberikannya kepada Anda.",
"quick.shareText":"Ini tautan untuk berbicara dengan saya di DigitalValut Logos. Ketuk dan kita akan tersambung:",
"quick.share":"Kirim undangan",
"notify.title":"Beri tahu saya saat seseorang mencari saya",
"notify.sub":"Notifikasi jika kontak mencoba menghubungi Anda dan Anda tidak membuka aplikasi — tanpa nama, tanpa pesan, hanya sebuah tanda.",
"notify.iosHint":"Di iPhone ini hanya berfungsi jika Anda sudah menambahkan aplikasi ke Layar Utama terlebih dahulu: ketuk <b>Bagikan</b> di Safari, lalu <b>Tambah ke Layar Utama</b>, dan buka aplikasi dari sana.",
"notify.blocked":"Notifikasi diblokir oleh browser. Periksa pengaturan situs.",
"sas.title":"Pemeriksaan keamanan",
"sas.lead":"Ucapkan tiga kata ini satu sama lain dengan suara keras. Jika Anda berdua melihat kata yang sama, tidak ada yang menyisip.",
"sas.leadChanged":"Hati-hati: orang ini tampaknya bukan orang yang sama seperti terakhir kali. Biasanya ini berarti ponsel baru atau aplikasi terpasang ulang — tetapi ini juga seperti apa penyadapan terlihat. Ucapkan tiga kata dengan suara keras sebelum melanjutkan.",
"sas.yes":"Ya, cocok","sas.no":"Tidak, berbeda",
"sas.note":"Hanya diperlukan pertama kali dengan orang ini: setelah itu, aplikasi akan mengingatnya.",
"sas.confirmed":"Kontak terverifikasi.",
"sas.refused":"Kata-kata tidak cocok: percakapan ini tidak dianggap aman. Tutup dan mulai lagi dengan kode baru.",
"connect.bigTitle":"Menyambungkan…","connect.bigHint":"Jangan tutup aplikasi — hanya perlu beberapa detik.",
"autoclean.title":"Pembersihan otomatis","autoclean.sub":"Menghapus sendiri percakapan yang lebih lama dari jumlah hari tertentu, agar tidak terus memakan ruang di ponsel Anda. Nonaktif secara default: tidak ada yang terhapus sendiri kecuali Anda mengaktifkan ini.","autoclean.after":"Hapus percakapan yang lebih lama dari:","autoclean.d7":"7 hari","autoclean.d30":"30 hari","autoclean.d90":"90 hari","autoclean.d365":"1 tahun",
"wake.waitsNote":"Anda boleh menutup aplikasi: saya akan memberi tahu saat undangan dibuka.","wake.calling":"Memberi tahu {name}…","wake.callingHint":"Ponselnya sudah berdering. Begitu aplikasi dibuka, Anda langsung terhubung — Anda bisa menunggu di sini.","wake.noAnswer":"Sudah diberi tahu tetapi aplikasinya belum dibuka. Coba lagi nanti.",
"quick.helpAWaits":"Kirim dengan tombol di bawah — orang lain tinggal menyentuhnya dan langsung masuk. Atau bacakan enam angkanya dengan suara.",
"verify.inPerson":"terverifikasi langsung","verify.inPersonDone":"Terverifikasi langsung: Anda memindai kode dari layar orang ini sendiri, jadi tidak ada yang bisa menyelip di tengah. Tidak perlu menyebutkan tiga kata itu.","sas.leadMismatch":"Hati-hati: yang menjawab bukan ponsel yang kodenya Anda pindai. Bisa jadi kekeliruan, tetapi itu juga persis yang akan terlihat jika ada yang menyelip di tengah. Jangan menulis apa pun sebelum kalian saling menyebutkan tiga kata itu dengan suara.",
"easy.title":"Mode sederhana","easy.sub":"Hanya dua tombol besar dan tidak ada apa-apa lagi di sekelilingnya. Untuk siapa pun yang tidak ingin memikirkan apa pun — atau untuk yang menyiapkan ponsel bagi orang lain.","easy.voiceTitle":"Bacakan dengan suara","easy.voiceSub":"Aplikasi memberi tahu apa yang harus dilakukan dengan suara, dalam bahasa Anda. Untuk yang kesulitan membaca layar.","easy.voiceOn":"Baik. Mulai sekarang saya akan memberi tahu dengan suara apa yang harus dilakukan.","easy.sayHome":"Sentuh tombol pertama untuk memulai obrolan. Sentuh yang kedua jika ada yang mengirimi Anda undangan.","easy.sayStart":"Ini kode Anda. Tekan tombol oranye untuk mengirimkannya kepada siapa pun.","easy.sayJoin":"Ketik enam angka yang diberikan kepada Anda.","easy.sayChat":"Sudah terhubung. Sekarang Anda bisa bicara.",
"broker.down":"Layanan yang membantu kalian saling menemukan tidak merespons. Kode panjang di bawah tetap berfungsi: ia tidak melewati server mana pun.",
"flash.title":"Terhubung","flash.titleWith":"Terhubung dengan {name}","flash.direct":"Sambungan langsung antara kedua ponsel Anda","flash.relay":"Tersambung lewat jembatan terenkripsi — jaringan Anda tidak mengizinkan sambungan langsung","flash.noserver":"Tidak ada server yang bisa membaca percakapan Anda","flash.time":"Dalam {s} detik, tanpa mendaftar apa pun",
"viral.title":"Berhasil.","viral.sub":"Kalau bermanfaat, teruskan ke orang lain: gratis, tanpa akun, dan tidak menyimpan apa pun tentang siapa pun.","viral.btn":"Beri tahu seseorang",
"media.title":"Mikrofon dan kamera","media.warnDenied":"Peramban ini memblokir mikrofon: Anda tidak bisa menelepon maupun menerima panggilan.","media.warnFix":"Cara memperbaikinya","media.retry":"Coba lagi","media.close":"Tutup","media.nowOk":"Mikrofon aktif. Sekarang Anda bisa menelepon.","media.peerNoMic":"{name} sudah menjawab, tetapi perambannya tidak mengizinkan mikrofon menyala. Bukan dia yang menolak.","media.peerNoCam":"{name} sudah menjawab, tetapi perambannya tidak mengizinkan kamera dan mikrofon menyala. Coba panggilan suara saja, atau minta dia membuka blokirnya.","media.stepsIos":"Buka <b>Pengaturan</b> di iPhone|Gulir ke bawah dan ketuk <b>Safari</b>|Ketuk <b>Mikrofon</b> lalu <b>Kamera</b>: setel ke <b>Tanya</b> atau <b>Izinkan</b>|Kembali ke sini dan muat ulang halaman","media.stepsAndroid":"Ketuk <b>gembok</b> di sebelah alamat, di atas|Ketuk <b>Izin</b>|Aktifkan <b>Mikrofon</b> dan <b>Kamera</b>|Muat ulang halaman","media.stepsChrome":"Klik <b>gembok</b> di kiri alamat|Aktifkan <b>Mikrofon</b> dan <b>Kamera</b>|Muat ulang halaman","media.stepsSafariMac":"Di bilah menu buka <b>Safari</b> › <b>Pengaturan untuk Situs Web Ini</b>|Setel <b>Mikrofon</b> dan <b>Kamera</b> ke <b>Izinkan</b>|Muat ulang halaman","media.stepsFirefox":"Klik <b>gembok</b> di kiri alamat|Hapus blokir di sebelah <b>Gunakan Mikrofon</b> dan <b>Gunakan Kamera</b>|Muat ulang halaman","media.stepsOther":"Buka pengaturan peramban untuk situs ini|Izinkan <b>Mikrofon</b> dan <b>Kamera</b>|Muat ulang halaman",
"addr.title":"Alamat permanen Anda","addr.sub":"Berikan ini sebagai ganti nomor telepon. Siapa pun yang memilikinya bisa menghubungi Anda kapan saja, tanpa tahu nama maupun nomor Anda. Nonaktif secara default.","addr.qrHint":"Yang memindainya langsung menelepon Anda","addr.share":"Kirim alamat Anda","addr.showQr":"Tampilkan QR","addr.reachNote":"Agar orang bisa menghubungi Anda meski aplikasi tertutup, aktifkan pemberitahuan di bawah.","addr.dialLabel":"Punya alamat seseorang?","addr.dialPh":"DV-XXXX-XXXX-XXXX","addr.dial":"Telepon","addr.badFormat":"Alamat itu salah tulis. Panjangnya 12 karakter, seperti DV-K7M2-9QRT-X4WP.","addr.itsYou":"Itu alamat Anda sendiri.","addr.callingTitle":"Menelepon…","addr.callingHint":"Kalau aplikasinya tertutup, saya akan membunyikan ponselnya. Bisa perlu sejenak.","addr.noAnswer":"Tidak ada jawaban. Sudah diberi tahu: coba lagi nanti.","addr.dialFailed":"Saya tidak bisa menelepon alamat itu.","addr.noKey":"Alamat itu sepertinya sudah tidak aktif. Minta orangnya membuka aplikasi lagi dan mengirimkannya kembali: alamat berubah pada pembaruan terakhir.","addr.noBroker":"Saya bahkan tidak bisa memulai panggilan: layanan yang mempertemukan Anda tidak menjawab. Kalau Anda memakai salinan aplikasi di alamat lain, buka yang resmi.","addr.incomingTitle":"Ada yang mencari Anda","addr.incomingSub":"Nama dan alasannya ditulis sendiri oleh si penelepon: sampai Anda menerima, tidak ada yang bisa membuktikan dia memang orang itu.","addr.incomingToast":"Ada yang menelepon alamat Anda.","addr.accept":"Terima","addr.ignore":"Abaikan","addr.verified":"Terverifikasi: yang menjawab benar-benar pemilik alamat {a}. Tidak mungkin ada yang menyusup di tengah.","addr.blockedIn":"Panggilan dari orang yang pernah Anda tolak: diabaikan.","addr.shareText":"Anda bisa menghubungi saya di sini, tanpa nomor telepon saya. Alamat DigitalValut Logos saya adalah {a}\n\nKetuk untuk menelepon saya:",
"addr.incomingAt":"lewat “{name}”","burn.title":"Alamat sekali pakai","burn.help":"Satu untuk tiap iklan, satu untuk tiap orang asing. Hapus kalau sudah selesai, dan orang itu tak bisa menghubungi Anda lagi — alamat asli Anda tak pernah dia pegang.","burn.namePh":"Untuk apa? mis. Sofa bekas","burn.add":"Buat","burn.send":"Kirim alamat ini","burn.delete":"Hapus","burn.deleted":"“{name}” dihapus. Alamat itu tidak menjawab lagi.","burn.made":"“{name}” dibuat. Sekarang bisa Anda berikan.","burn.needName":"Beri nama, supaya Anda ingat sudah memberikannya ke siapa.","burn.full":"Maksimal {n} sekaligus. Hapus satu untuk membuat yang baru.","burn.untitled":"Tanpa nama",
"knock.title":"Anda menghubungi","knock.nameLabel":"Siapa nama Anda?","knock.namePh":"Nama Anda","knock.msgLabel":"Anda perlu apa? (boleh kosong)","knock.msgPh":"mis. Ada sepatu ukuran 42?","knock.go":"Telepon","knock.note":"Nama Anda dan kalimat ini hanya dilihat oleh orang yang Anda telepon. Tidak ada server yang bisa membacanya.",
"letter.title":"Pesan yang ditinggalkan untuk Anda","letter.noneTitle":"Sekarang tidak ada yang menjawab.","letter.noneSub":"Saya sudah memberi tahu dia bahwa Anda mencoba menghubunginya. Kalau mau bilang lebih banyak, tulis di sini.","letter.ph":"Tulis pesan Anda di sini","letter.leave":"Tinggalkan pesan","letter.cancel":"Tidak jadi","letter.needText":"Tulis satu dua kalimat, supaya dia tahu apa yang Anda mau.","letter.left":"Pesan ditinggalkan. Dia akan menemukannya saat membuka aplikasi.","letter.failed":"Saya tidak bisa meninggalkan pesan. Coba lagi.","letter.callBack":"Telepon balik","letter.dismiss":"Selesai",
"home.bigStart":"Bicara dengan seseorang","home.bigStartD":"Buat undangan untuk dikirim","home.bigJoin":"Saya punya kode","home.bigJoinD":"Seseorang mengirimi saya undangan","set.lang":"Bahasa","set.textsize":"Ukuran teks","conn.direct":"Sambungan langsung antara kedua ponsel","conn.directShort":"tersambung langsung","conn.relay":"Sambungan aman lewat jembatan terenkripsi","conn.relayShort":"tersambung (jembatan)","conn.down":"Sambungan terputus","conn.downShort":"terputus","conn.working":"Menyambungkan","conn.wobbly":"Sambungan goyah — sedang dipulihkan","conn.wobblyShort":"memulihkan","chat.linkLost":"Sambungan terputus. Tidak ada yang hilang — buka lagi aplikasinya dan sambung ulang dari Kontak terbaru.",
"call.flipFail":"Tidak bisa mengganti kamera di ponsel ini.",
"call.flipBusy":"Kamera sedang dipakai aplikasi lain. Tutup dan coba lagi.","call.flipDenied":"Peramban memblokir kamera untuk situs ini.","call.flipOnlyOne":"Perangkat ini hanya punya satu kamera.",
"home.alreadyTalking":"Anda sudah dalam percakapan. Untuk memulai yang lain, tutup dulu yang ini.","home.stillCalling":"Saya masih menelepon. Tunggu jawabannya, atau batalkan panggilan.","home.busyReconnect":"Anda sedang sibuk sekarang. Selesaikan atau tutup koneksi yang sedang berlangsung sebelum mencoba lagi.",
"letter.missed":"Ingin bicara dengan Anda.",
"sas.blocked":"Ucapkan dulu ketiga kata itu: orang ini bukan lagi orang yang sama.",
"file.tooBig":"Sebuah berkas masuk dihentikan: isinya tidak sesuai dengan yang dinyatakan.","file.sendFailed":"Pengiriman terputus: koneksi tertutup di tengah jalan.","file.progress":"{sent} dari {total}",
"share.pending":"{n} berkas siap dikirim — akan terkirim begitu tersambung",
"health.storage":"Penyimpanan ponsel",
"health.storageFull":"Penuh: percakapan tidak lagi disimpan. Kosongkan ruang di ponsel.",
"addr.lifespan":"Alamat ini tidak kedaluwarsa. Ia tetap berlaku selama data aplikasi masih ada di ponsel ini.",
"health.addrLife":"Kata keamanan",
"health.addrLifeOk":"Stabil sekitar {n} hari lagi.",
"health.addrLifeSoon":"Sekitar {n} hari lagi kata-kata ini berubah sendiri. Kontak Anda akan diminta memeriksanya lagi bersama Anda — ini bukan tanda ada yang salah.","health.addrKeyBad":"Mereka tidak bisa menghubungi Anda: ponsel ini belum berhasil menerbitkan kunci yang menjadi dasar alamatnya. Periksa koneksi lalu buka ulang aplikasi.",
"health.title":"Kondisi aplikasi",
"health.sub":"Kalau ada yang tidak bisa menghubungi Anda, alasannya ada di bawah.",
"health.recheck":"Periksa lagi",
"health.copy":"Salin laporan",
"health.copied":"Laporan disalin.",
"health.checking":"Sedang memeriksa…",
"health.busy":"Dijeda: Anda sudah dalam percakapan.",
"health.stopped":"Saya tidak mendengarkan. Tutup aplikasi lalu buka lagi.",
"health.addr":"Siapa pun yang punya alamat Anda",
"health.addrOk":"Bisa menelepon Anda sekarang.",
"health.addrOff":"Alamat Anda mati. Nyalakan di atas.",
"health.contacts":"Kontak Anda",
"health.contactsOk":"Mereka bisa menemukan Anda lagi sekarang.",
"health.contactsNone":"Anda belum punya kontak.",
"health.broker":"Layanan yang mempertemukan Anda",
"health.brokerOk":"Menjawab.",
"health.brokerBad":"Tidak menjawab. Kode panjang masih bisa: itu tidak melewati server mana pun.",
"health.brokerOrigin":"Salinan aplikasi ini ada di alamat yang tidak dikenali layanan: dari sini tidak akan jalan. Buka yang resmi.",
"health.closed":"Saat aplikasi tertutup",
"health.closedOk":"Mereka bisa membunyikan ponsel Anda.",
"health.closedOff":"Mereka tidak bisa menghubungi Anda. Nyalakan pemberitahuan di atas.",
"health.closedDenied":"Peramban memblokir pemberitahuan: saat aplikasi tertutup, tidak ada yang bisa menghubungi Anda.",
"health.closedIos":"Di iPhone Anda harus menambahkan aplikasi ke layar Utama dulu.",
"health.mic":"Mikrofon",
"health.micOk":"Tersedia.",
"health.micBad":"Diblokir peramban: Anda tidak akan bisa menelepon atau menerima panggilan.",
"health.micUnknown":"Saya tidak bisa tahu sampai Anda mencoba menelepon.",
"health.version":"Versi yang dipakai",
"health.versionOld":"Sebagian aplikasi masih yang lama. Tutup lalu buka lagi.",
"media.stepsAndroidApp":"Kembali ke layar Utama ponsel|Tekan lama ikon <b>DigitalValut Logos</b>|Ketuk <b>Info aplikasi</b> (atau ikon ⓘ)|Ketuk <b>Izin</b>, lalu aktifkan <b>Mikrofon</b> dan <b>Kamera</b>|Buka lagi aplikasinya"
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
  document.documentElement.dir = RTL.indexOf(code) >= 0 ? 'rtl' : 'ltr';
  const dict = I18N[code] || {};
  ORIGINALS.forEach((orig, el) => {
    if (orig.key){ const v = dict[orig.key]; el.innerHTML = v !== undefined ? v : orig.html; }
    if (orig.phKey){ const v = dict[orig.phKey]; el.setAttribute('placeholder', v !== undefined ? v : orig.ph); }
  });
  $('langSel').value = code;
  try{ localStorage.setItem('dvlogos-lang', code); }catch(e){}
  /* its own icon+text are painted by state, not by the generic pass above —
     repainted here so a language switch mid-chat keeps the real state (say,
     "codice cambiato") instead of reverting to the generic default */
  if (typeof paintVerifyBadge === 'function') paintVerifyBadge(safetyState);
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
  ['screenHome','screenSettings','screenStart','screenJoin','screenChat'].forEach(s => $(s).classList.toggle('hide', s !== id));
  window.scrollTo(0,0);
  /* Warmed a few seconds early rather than at the moment of truth. Fetching the
     relay credentials is a network round trip, it is kept for the rest of the
     visit, and these two screens exist only because somebody is about to
     connect — so by the time a code is typed the answer is usually already
     here. Nothing waits on it: if it has not landed, building the connection
     fetches it exactly as before.
     Guarded on purpose. showScreen() can run the moment an invite link is
     opened, before the rest of the file has finished initialising — see the
     note above this function for what that cost the last time — so a warm-up
     that cannot happen yet is skipped rather than allowed to throw. */
  if (id === 'screenStart' || id === 'screenJoin'){
    try{ fetchIceServers().catch(()=>{}); }catch(e){}
  }
  /* Both ways in are re-armed on every screen change rather than tied to one
     screen: being reachable is not a property of which page someone happens to
     be looking at. Both are idempotent and both check for themselves whether
     this is a good moment, so calling them here is free. */
  startInboxPolling();
  startAddrPolling();
  sayScreen(id);
}

/* ============================== saying it out loud ==============================
   Written instructions assume two things this app should not: that reading a
   phone screen is easy, and that the person holding it can read at all. Both
   fail for a lot of people, and they are exactly the people who most need a way
   to talk to their family that asks nothing of them.
   This uses the voice already built into every phone and computer — nothing is
   downloaded, nothing is sent anywhere, and it says only what is already
   written on the screen in front of them. Off unless someone asks for it. */
const SPEECH_LANG = {
  it:'it-IT', en:'en-US', ar:'ar-SA', bn:'bn-BD', de:'de-DE', es:'es-ES', fr:'fr-FR',
  hi:'hi-IN', id:'id-ID', pt:'pt-PT', ru:'ru-RU', ur:'ur-PK', zh:'zh-CN',
};
function voicePref(){ try{ return localStorage.getItem('dvlogos-voice') === '1'; }catch(e){ return false; } }
function easyPref(){ try{ return localStorage.getItem('dvlogos-easy') === '1'; }catch(e){ return false; } }

function speak(text){
  if (!voicePref() || !text) return;
  if (typeof speechSynthesis === 'undefined') return;
  try{
    speechSynthesis.cancel(); /* never let two instructions talk over each other */
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[CURLANG] || CURLANG;
    u.rate = 0.92; /* a shade slower than default: this is being read to someone, not narrated */
    speechSynthesis.speak(u);
  }catch(e){}
}
/* written out one per line rather than looked up from a table, so that the
   check which makes sure all thirteen languages are complete can see them */
function sayScreen(id){
  if (id === 'screenHome')  speak(t('easy.sayHome','Tocca il primo pulsante per iniziare una chat. Tocca il secondo se ti hanno mandato un invito.'));
  else if (id === 'screenStart') speak(t('easy.sayStart','Questo è il tuo codice. Premi il pulsante arancione per mandarlo a chi vuoi.'));
  else if (id === 'screenJoin')  speak(t('easy.sayJoin','Scrivi le sei cifre che ti hanno dato.'));
  else if (id === 'screenChat')  speak(t('easy.sayChat','Siete connessi. Ora potete parlare.'));
}

function applyEasy(on){
  document.documentElement.classList.toggle('easy', on);
  $('easyRow').classList.toggle('on', on);
  $('easyRow').setAttribute('aria-pressed', on ? 'true' : 'false');
}
function paintVoiceToggle(on){
  $('voiceRow').classList.toggle('on', on);
  $('voiceRow').setAttribute('aria-pressed', on ? 'true' : 'false');
}
applyEasy(easyPref());
paintVoiceToggle(voicePref());
if (typeof speechSynthesis === 'undefined') $('voiceRow').classList.add('hide');

$('easyRow').addEventListener('click', () => {
  const on = !$('easyRow').classList.contains('on');
  try{ localStorage.setItem('dvlogos-easy', on ? '1' : '0'); }catch(e){}
  applyEasy(on);
});
$('voiceRow').addEventListener('click', () => {
  const on = !$('voiceRow').classList.contains('on');
  try{ localStorage.setItem('dvlogos-voice', on ? '1' : '0'); }catch(e){}
  paintVoiceToggle(on);
  /* say something immediately: the only honest way to show what it does */
  if (on) speak(t('easy.voiceOn','Va bene. Da adesso ti dico a voce cosa fare.'));
  else if (typeof speechSynthesis !== 'undefined'){ try{ speechSynthesis.cancel(); }catch(e){} }
});
for (const id of ['easyRow','voiceRow']){
  $(id).addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); $(id).click(); }
  });
}
/* Everything that is a choice rather than an action lives one tap away, so
   the home can be the two things someone actually came to do. */
/* Back has to mean back. Sending it to the home screen no matter where it was
   opened from looked, to anyone who tapped the gear during a call, exactly like
   the line dropping: the call was still running, but it was off screen — and
   the first thing offered on the home screen starts a new connection, which
   really would have ended it. */
let settingsCameFrom = 'screenHome';
$('btnSettings').addEventListener('click', () => {
  settingsCameFrom = ['screenHome','screenStart','screenJoin','screenChat']
    .find(s => !$(s).classList.contains('hide')) || 'screenHome';
  showScreen('screenSettings');
  /* measured when the screen is opened, not cached from earlier: a stale
     "everything is fine" would be worse than saying nothing at all */
  runHealth();
});
$('backFromSettings').addEventListener('click', () => showScreen(settingsCameFrom));

/* Creating an invite builds a new connection over the top of whatever was
   there, which would silently end a conversation still in progress — and
   nothing said so. Anyone who wandered back to the home screen mid-call and
   pressed the obvious orange button lost the call and never learned why.
   Now it takes you back to the conversation instead, and ending it stays a
   deliberate act on the chat's own "end chat" button. */
/* A call placed to an address is still being set up for up to three minutes,
   and for most of that there is no open channel yet — so the check above saw
   "nothing running" and started a second connection straight over the top of
   it. From the outside that is exactly the reported fault: go back, touch
   anything, and the call you were waiting on is gone. */
function busyElsewhere(){
  if (dc && dc.readyState === 'open'){
    showScreen('screenChat');
    toast(t('home.alreadyTalking','Sei già in una conversazione. Per iniziarne un\'altra, chiudi prima questa.'));
    return true;
  }
  if (dialing){
    showScreen('screenJoin');
    toast(t('home.stillCalling','Sto ancora chiamando. Aspetta la risposta, o annulla la chiamata.'));
    return true;
  }
  return false;
}
$('goStart').addEventListener('click', () => {
  if (busyElsewhere()) return;
  showScreen('screenStart'); showQuickLayoutA(); startQuickShare();
});
$('goJoin').addEventListener('click', () => {
  if (busyElsewhere()) return;
  showScreen('screenJoin'); showQuickLayoutB(); $('quickCodeIn').value = ''; $('quickCodeIn').focus();
});
/* leaving the screen abandons whatever handshake it had started — otherwise its
   candidate polling would keep running in the background for a code nobody is
   going to type any more */
/* leaving mid-connection abandons the attempt — the big "connecting" state
   would otherwise still be showing next time this screen opens */
$('backFromStart').addEventListener('click', () => { stopQuickPump(); $('bigConnectingA').classList.add('hide'); showScreen('screenHome'); });
$('backFromJoin').addEventListener('click', () => { stopQuickPump(); $('bigConnectingB').classList.add('hide'); showScreen('screenHome'); });

/* your name, remembered on this device */
try{ $('nickInput').value = localStorage.getItem('logos-modifica-nick') || ''; }catch(e){}
$('nickInput').addEventListener('input', () => {
  try{ localStorage.setItem('logos-modifica-nick', $('nickInput').value.trim()); }catch(e){}
});
function myNick(){ return $('nickInput').value.trim() || t('chat.someone','Qualcuno'); }

/* ============================== install banner ==============================
   The licence notice used to live here too, shown once on the home screen with
   a dismiss button. It now sits in the settings, always on, with nothing to
   dismiss — the footer already carries the same statement on every screen, so
   on the home it was six lines of duplicate standing between a new person and
   the only two things they could do. */

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
/* A translated sentence alone was easy to skim past without ever spotting
   which real icon it means — someone who does not recognise the word
   "Condividi"/"Share" has nothing else to go on. This draws Safari's actual
   share icon (a box with an arrow leaving the top) right next to the text,
   the same shape in every language, so there is something to *look for* in
   the toolbar, not just read about. */
const IOS_SHARE_ICON = '<svg class="shareicon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15.5V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4.5 12.5v7a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7"/></svg>';
if (isIOS && !isStandalone && location.protocol.startsWith('http')) showInstallBar(IOS_SHARE_ICON + t('install.iosText'), false);
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
let iceServersPromise = null;
async function fetchIceServers(){
  if (cachedIceServers) return cachedIceServers;
  /* The promise is held, not just the result — the same fix, for the same
     reason, as myIdentity() and myKeyPair() further down. Two callers arriving
     together (the screen warming this up, and the connection that needs it a
     moment later) both saw an empty cache and both fired their own request,
     against the one budget on this Worker that costs real money. */
  if (iceServersPromise) return iceServersPromise;
  iceServersPromise = (async () => {
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
  })();
  return iceServersPromise;
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
/* `onSettle`, when given, fires exactly once — with `true` if the connection
   actually came up, `false` if it didn't — and not a moment before either is
   really known. Callers that disable a button while connecting should re-enable
   it from here, not the instant this function is called: the handshake itself
   still runs for several seconds after that, and a button re-enabled early is
   a button a second, impatient tap can fire into a mailbox slot the first
   attempt already emptied — a frightening "wrong code" while the real
   connection quietly succeeds underneath it. Found exactly that happening on
   a real device. */
/* The one question every failure path has to ask before it opens its mouth.
   A phone telling someone the code was wrong, or that it could not connect,
   while the other phone is sitting in the conversation, is the worst thing this
   app can do: it is not a cosmetic slip, it makes a working product look
   broken and sends people back to WhatsApp. So no failure is ever announced
   without checking, at that exact moment, whether the thing actually worked —
   the chat being open, this connection reporting itself connected, or its own
   data channel being live. Its own: the global one can belong to a different
   attempt entirely. */
function connectionWorking(pcObj){
  if (!$('screenChat').classList.contains('hide')) return true;
  if (pcObj){
    if (pcObj.connectionState === 'connected') return true;
    if (pcObj.__dc && pcObj.__dc.readyState === 'open') return true;
  }
  return false;
}

function watchHandshakeProgress(pcObj, statusEl, diagEl, pump, onSettle){
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
      if (onSettle) onSettle(true);
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
        if (connectionWorking(pcObj)) return;
        settled = true; stop();
        setStatus(statusEl, t('connect.failed','Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.'), 'bad');
        if (onSettle) onSettle(false);
      }, 12000);
      return;
    }
    /* 'closed' had no guard at all, unlike 'failed' — it spoke the instant it
       arrived. But a connection closes for ordinary reasons too (the session
       being reset, a second attempt taking over), and announcing defeat for
       those printed a failure over a conversation that was fine. */
    if (st === 'closed'){
      if (connectionWorking(pcObj)) return;
      settled = true; stop();
      setStatus(statusEl, t('connect.failed','Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.'), 'bad');
      if (onSettle) onSettle(false);
    }
  };
  pcObj.addEventListener('connectionstatechange', onChange);
  /* A note that it is taking a while — not a verdict. It deliberately does not
     settle anything: the candidates must keep flowing and the diagnostic must
     keep updating, because the connection very often still lands after this. */
  setTimeout(() => {
    if (settled || connectionWorking(pcObj)) return;
    setStatus(statusEl, t('connect.slow','Ci sta mettendo più del solito — capita su reti molto filtrate (aziendali, alcune reti mobili) o se non siete online nello stesso momento. Aspettate ancora un attimo, oppure create un invito nuovo.'));
  }, 25000);
  /* A safety net, not a verdict either: connectionState can in principle sit in
     'checking' without ever formally reaching 'failed', which — before this —
     could leave a disabled button disabled forever with no way out but a
     reload. This only ever fires if nothing else already has. */
  setTimeout(() => {
    if (settled) return;
    if (connectionWorking(pcObj)) return;
    settled = true; stop();
    setStatus(statusEl, t('connect.failed','Non è stato possibile collegarsi. Controllate di essere online entrambi, poi create un invito nuovo — i vecchi codici non si possono riusare.'), 'bad');
    if (onSettle) onSettle(false);
  }, 60000);
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
  /* Also hung on the connection it belongs to. The failure checks used to ask
     the global `dc` whether the channel was open, which is a different question
     from "is *this* connection working" the moment there is more than one
     attempt in play — and answering the wrong question is how a phone ends up
     announcing a failure that never happened. */
  if (pc) pc.__dc = channel;
  pc.ontrack = ev => attachRemoteStream(ev.streams[0]);
  dc.onopen = async () => {
    enterChat();
    const fp = await myFingerprintHex();
    const push = notifyPref() ? await ensurePushSubscription() : null;
    dc.send(JSON.stringify({ type: 'hello', nick: myNick(), fp, push }));
    if (pendingSharedFiles.length){
      const files = pendingSharedFiles; pendingSharedFiles = [];
      sendFilesQueue(files);
    }
  };
  /* Said inside the conversation, not only on statusA. statusA lives on the
     start screen, and somebody whose line drops mid-chat is looking at the
     chat — so until now the whole thing simply stopped working with nothing
     said anywhere they could actually see it. The coloured dot in the header
     turning red is a signal, not an explanation, and it never said the one
     thing that stops a person panicking: the conversation is still here and
     nothing was lost. */
  dc.onclose = () => {
    setStatus($('statusA'), t('session.newHint'), 'bad');
    paintConnDot();
    if (!$('screenChat').classList.contains('hide')){
      sysLine(t('chat.linkLost','Il collegamento è caduto. Non si è perso niente — riapri l\'app e ricollegati da Contatti recenti.'));
    }
  };
  dc.onmessage = onDcMessage;
}

/* ============================== the moment it connects ==============================
   The one thing this app can say that the big ones cannot is that the two
   phones are talking to each other and nothing is in between. That is worth
   saying out loud exactly once, at the only moment it is felt — and then
   getting out of the way.
   Nothing here is decoration over a guess. The route is read out of the
   connection's own statistics, so "direct" is only ever claimed when the
   selected pair really has no relay in it; when a hostile network forced the
   relay, it says so instead, because a tool that flatters itself on that point
   is a tool you cannot trust on any other. */
async function connectionRoute(){
  try{
    if (!pc || !pc.getStats) return null;
    const stats = await pc.getStats();
    let pair = null;
    stats.forEach(r => {
      if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || r.selected)) pair = r;
    });
    if (!pair) return null;
    const local = stats.get(pair.localCandidateId);
    const remote = stats.get(pair.remoteCandidateId);
    const types = [local && local.candidateType, remote && remote.candidateType];
    return types.indexOf('relay') >= 0 ? 'relay' : 'direct';
  }catch(e){ return null; }
}

/* The same measurement the arrival card makes, kept on screen for as long as
   the conversation lasts. Nothing here is decorative: "direct" is only ever
   shown when the selected candidate pair really has no relay in it. */
async function paintConnDot(){
  const dot = $('connDot'), lbl = $('connState');
  if (!dot) return;
  dot.classList.remove('direct','relay','down');
  if (!pc || pc.connectionState === 'closed' || pc.connectionState === 'failed'){
    dot.classList.add('down');
    dot.setAttribute('aria-label', t('conn.down','Connessione caduta'));
    lbl.textContent = t('conn.downShort','caduta');
    return;
  }
  /* 'disconnected' is not 'failed', and the difference is worth showing. It
     means the path between the two phones stopped answering for a moment — a
     lift, a tunnel, wifi handing over to mobile data — and it very often comes
     back on its own within seconds. Until now this state fell through to the
     generic "connecting", which told somebody watching a stalled conversation
     nothing at all. Amber, and words that say what is really happening. */
  if (pc.connectionState === 'disconnected'){
    dot.classList.add('relay');   /* amber: not green, but not dead either */
    dot.setAttribute('aria-label', t('conn.wobbly','Il collegamento ha vacillato — sto riprendendolo'));
    lbl.textContent = t('conn.wobblyShort','sto riprendendo');
    return;
  }
  const route = await connectionRoute();
  if (route === 'relay'){
    dot.classList.add('relay');
    dot.setAttribute('aria-label', t('conn.relay','Collegamento sicuro, attraverso un ponte cifrato'));
    lbl.textContent = t('conn.relayShort','collegata (ponte)');
  } else if (route === 'direct'){
    dot.classList.add('direct');
    dot.setAttribute('aria-label', t('conn.direct','Collegamento diretto fra i due telefoni'));
    lbl.textContent = t('conn.directShort','collegata direttamente');
  } else {
    dot.setAttribute('aria-label', t('conn.working','Collegamento in corso'));
    lbl.textContent = t('chat.connected','connessa');
  }
}

function showConnectedFlash(nick){
  return new Promise(async resolve => {
    const box = $('connectedFlash');
    if (!box) return resolve();

    $('flashTitle').textContent = nick
      ? fill(t('flash.titleWith','Connessi con {name}'), { name: nick })
      : t('flash.title','Connessi');

    /* If the route could not be read, the row is dropped rather than filled in
       with the flattering half. Claiming "direct" without having checked would
       be the one kind of lie this screen exists not to tell. */
    const route = await connectionRoute();
    const routeRow = $('flashRoute');
    routeRow.classList.toggle('hide', !route);
    routeRow.classList.toggle('direct', route === 'direct');
    if (route){
      routeRow.querySelector('span:last-child').textContent = route === 'relay'
        ? t('flash.relay','Collegamento tramite ponte cifrato — la vostra rete non permetteva quello diretto')
        : t('flash.direct','Collegamento diretto tra i vostri due telefoni');
    }

    /* only shown when it means something: an invite left out for three hours
       and picked up later would otherwise report a three-hour "connection" */
    const ms = connectStartedAt ? Date.now() - connectStartedAt : 0;
    const timeRow = $('flashTime');
    if (ms > 250 && ms < 120000){
      const secs = (ms / 1000).toLocaleString(CURLANG, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      timeRow.querySelector('span:last-child').textContent =
        fill(t('flash.time','In {s} secondi, senza registrarsi a niente'), { s: secs });
      timeRow.classList.remove('hide');
    } else {
      timeRow.classList.add('hide');
    }

    box.classList.remove('hide', 'out');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      box.removeEventListener('click', finish);
      box.classList.add('out');
      setTimeout(() => { box.classList.add('hide'); box.classList.remove('out'); resolve(); }, 300);
    };
    const timer = setTimeout(finish, 2800);
    box.addEventListener('click', finish);
  });
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
/* Takes the record name because there are two of them now: the DTLS
   certificate that makes the safety words stable, and the ECDH key pair the
   address is built from. Both have to outlive a reload and neither may ever
   leave the device, which is the whole reason this is IndexedDB and not
   localStorage — a CryptoKey can be stored here without ever being readable
   as bytes. */
function idbKV(mode, name, value){
  return new Promise(resolve => {
    let open;
    try{ open = indexedDB.open(ID_DB, 1); }catch(e){ return resolve(null); }
    open.onupgradeneeded = () => { try{ open.result.createObjectStore('kv'); }catch(e){} };
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      try{
        const store = open.result.transaction('kv', mode === 'get' ? 'readonly' : 'readwrite').objectStore('kv');
        if (mode === 'get'){
          const rq = store.get(name);
          rq.onsuccess = () => resolve(rq.result || null);
          rq.onerror = () => resolve(null);
        } else {
          const rq = store.put(value, name);
          rq.onsuccess = () => resolve(true);
          rq.onerror = () => resolve(null);
        }
      }catch(e){ resolve(null); }
    };
  });
}
function idbCert(mode, value){ return idbKV(mode, 'cert', value); }
/* The in-flight promise, for the same reason as the key pair below it — this
   had the identical race, and had had it all along: two callers arriving
   together (a connection being built while the fingerprint is read, or two
   attempts at once) both found nothing cached and both minted a certificate.
   Two certificates means the safety words change under the people comparing
   them, and the conversation gets filed under the wrong one. */
let myCertPromise = null;
function myIdentity(){
  if (!myCertPromise) myCertPromise = (async () => {
    const saved = await idbCert('get');
    /* a certificate about to expire would change the code on its own, so retire it early */
    if (saved && saved.expires && saved.expires > Date.now() + 7*24*3600*1000) return saved;
    try{
      const cert = await RTCPeerConnection.generateCertificate({
        name: 'ECDSA', namedCurve: 'P-256', expires: 365*24*3600*1000
      });
      await idbCert('put', cert);
      return cert;
    }catch(e){ return null; }   /* unsupported: fall back to a per-session certificate */
  })();
  return myCertPromise;
}
/* ============ the key the address is actually made of ============
   The flaw this closes, stated plainly: an address used to BE the key. The
   envelope waiting at an address was encrypted with a key derived from the
   address string itself, and an address is public by definition — printed on a
   shop window, posted in an advert. So anybody who had ever been given one
   could read every call arriving at it: who was calling, what they wrote, and
   the network addresses inside the offer. Recipient and eavesdropper held
   exactly the same secret, which means there was no secret.

   So the address stops being the key and becomes a *commitment to* one. This
   device keeps an ECDH key pair whose private half can never be read back out
   (`extractable: false` — the browser will do arithmetic with it and refuse to
   hand it over, even to this code). The address is the hash of the public
   half. Whoever calls fetches that public key, checks its hash really is the
   address they dialled — that check is what authenticates it, because a
   substituted key would hash to a different address — and encrypts to it.
   Only the private half can open the result.

   Anyone holding the address can still find the slot and drop something in;
   slots were always findable that way and the Worker's request limit is what
   answers that. What they can no longer do is read.

   P-256 for the same reason as everywhere else in this file: it is what the
   browser's own audited Web Crypto offers, and no cryptography here is
   hand-written.

   Why the in-flight promise is what gets cached below, and not the result.
   Written first as `if (myKeys) return myKeys;` wrapped around an await, which
   is a race with teeth: two callers arriving before the first had finished both
   found nothing cached and both generated a key pair. Two key pairs means two
   different addresses for the same slot — one published to the Worker, the
   other kept — so on a device's very first run the app could hand out an
   address it did not own a moment later, and stay undiallable until the next
   reload. Holding the promise means every caller waits on the same one and
   exactly one key pair is ever made. Caught by counting what actually reached
   the Worker and finding two keys for slot 0 from a single device. */
let myKeysPromise = null;
function myKeyPair(){
  if (!myKeysPromise) myKeysPromise = (async () => {
    const saved = await idbKV('get', 'ecdh');
    if (saved && saved.privateKey && saved.publicKey) return saved;
    try{
      const kp = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits']);
      /* stored as CryptoKey objects, not as bytes: the private half has no byte
         form this code could write down even by mistake */
      await idbKV('put', 'ecdh', { privateKey: kp.privateKey, publicKey: kp.publicKey });
      return kp;
    }catch(e){ return null; }
  })();
  return myKeysPromise;
}
let myPubPromise = null;
function myPubB64(){
  if (!myPubPromise) myPubPromise = (async () => {
    const kp = await myKeyPair();
    if (!kp) return null;
    try{ return ab2b64(await crypto.subtle.exportKey('raw', kp.publicKey)); }
    catch(e){ return null; }
  })();
  return myPubPromise;
}

/* Started here because this is the one place every kind of attempt passes
   through — short code, long code, QR, reconnect — so the number shown at the
   end is the real wait, not one route's guess at it. */
let connectStartedAt = 0;
async function newPeerConnection(){
  connectStartedAt = Date.now();
  const [cert, iceServers] = await Promise.all([myIdentity(), fetchIceServers()]);
  const config = { iceServers };
  if (cert) config.certificates = [cert];
  const conn = new RTCPeerConnection(config);
  /* the dot follows the connection rather than a guess about it */
  conn.addEventListener('connectionstatechange', () => { if (pc === conn) paintConnDot(); });
  return conn;
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
  if (state === 'inperson'){ b.classList.add('vok');  b.innerHTML = svgIcon('check') + t('verify.inPerson','verificato di persona'); }
  else if (state === 'ok') { b.classList.add('vok');  b.innerHTML = svgIcon('lock') + t('verify.known','verificato'); }
  else if (state === 'new'){ b.classList.add('vnew'); b.innerHTML = svgIcon('lock') + t('verify.badge','verifica'); }
  else if (state === 'changed'){ b.classList.add('vbad'); b.innerHTML = svgIcon('warning') + t('verify.changedShort','codice cambiato'); }
  else { b.innerHTML = svgIcon('lock') + t('verify.badge','verifica'); }
}
function readSafetyRec(key){ try{ return JSON.parse(localStorage.getItem(key) || 'null'); }catch(e){ return null; } }
function writeSafetyRec(key, code){ try{ localStorage.setItem(key, JSON.stringify({ code, since: Date.now() })); }catch(e){} }

/* Set only by opening a QR that was scanned off someone's screen in person —
   see the note above paintQr for why a link never sets it. */
let scannedFp = null;

async function checkSafetyFor(nick){
  const code = await computeSafetyCode();
  const fpHex = remoteFpHex();
  if (!code || !fpHex) return;
  const key = safetyKeyFp(fpHex);
  let rec = readSafetyRec(key);

  /* What proves the phone that answered really owns the address it was dialled
     at. Under the first version of addressing this hashed the answering
     certificate and compared it to the address — the address was a hash of that
     certificate, so the two had to agree.

     An address is now a hash of an ECDH public key instead, which the DTLS
     certificate knows nothing about, so that comparison no longer exists. What
     replaced it is stronger: the reply came back sealed under a secret that
     only the private half behind the published key could derive, and the
     address is a hash of that key. Opening it *is* the proof — a live
     demonstration of holding the key, rather than two hashes matching.

     Not fooled by reflecting the caller's own envelope back at it, either: the
     reply slot is named from a random 64-bit id that travels inside the sealed
     offer, so nobody who cannot open the offer can even find the slot to write
     to, let alone know what to put there. */
  if (dialedAddress){
    const expected = dialedAddress;
    const proven = dialedAddrProven;
    dialedAddress = null; dialedSlot = 0; dialedAddrProven = false;
    if (proven){
      writeSafetyRec(key, code);
      paintVerifyBadge('inperson');
      sysLine(fill(t('addr.verified','Verificato: chi ha risposto possiede davvero l\'indirizzo {a}. Nessuno può essersi messo in mezzo.'),
                   { a: formatAddress(expected) }));
      return;
    }
    paintVerifyBadge('changed');
    await showSasPanel('mismatch');
    return;
  }

  /* The QR said which phone would answer. Check what actually did. */
  if (scannedFp){
    const expected = scannedFp;
    scannedFp = null; /* answers for this connection only */
    if (fpHex.slice(0, expected.length) === expected){
      writeSafetyRec(key, code);
      paintVerifyBadge('inperson');
      sysLine(t('verify.inPersonDone','Verificato di persona: hai inquadrato il codice sullo schermo di questa persona, quindi nessuno può essersi messo in mezzo. Non serve dirsi le tre parole.'));
      return;
    }
    /* Not who the QR promised. Nothing here is trusted, and this is said as
       plainly as it deserves. */
    paintVerifyBadge('changed');
    await showSasPanel('mismatch');
    return;
  }


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
  $('sasLead').textContent =
      kind === 'mismatch' ? t('sas.leadMismatch','Attenzione: chi ha risposto non è il telefono del codice che hai inquadrato. Può essere un errore, ma è anche esattamente ciò che si vedrebbe se qualcuno si fosse messo in mezzo. Non scrivere nulla finché non vi siete detti le tre parole a voce.')
    : kind === 'changed'  ? t('sas.leadChanged','Attenzione: questa persona non risulta più la stessa dell\'ultima volta. Di solito è un telefono nuovo o l\'app reinstallata — ma è anche il segno di qualcuno che si è messo in mezzo. Ditevi le tre parole a voce prima di continuare.')
    :                       t('sas.lead','Ditevi queste tre parole a voce. Se le vedete uguali tutti e due, nessuno si è messo in mezzo.');
  $('sasPanel').classList.toggle('warn', kind === 'changed' || kind === 'mismatch');
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
  /* whatever invite got us here has done its job — leaving it pending would put
     a dead code back on the air at every app open for the next day */
  clearPendingInvite();
  showScreen('screenChat');
  $('mediaHelp').classList.add('hide');
  /* found now, while there is time to fix it, rather than while a phone rings */
  checkMicPermissionEarly();
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
  /* An inline handler, not a named function — which is exactly why this one
     was missed the first time every other connection-creating function was
     checked for this bug: nothing here matched "function" at the start of a
     line. Held locally from here on for the same reason as everywhere else:
     the four awaits below are four chances for the person to tap something
     that replaces the global underneath this attempt. */
  const myPc = pc;
  manualInvitePc = myPc;
  wireDataChannel(myPc.createDataChannel('logos-modifica'));
  const offer = await myPc.createOffer();
  await myPc.setLocalDescription(offer);
  await waitIceComplete(myPc);
  if (pc !== myPc){ return; }   /* superseded during the awaits above */
  const payload = { type: 'offer', sdp: myPc.localDescription.sdp };
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
async function shareTheApp(){
  const link = location.origin + location.pathname;
  const text = t('home.shareAppText') + link;
  try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  await copyOrSelect(text, null);
}
$('btnShareApp').addEventListener('click', shareTheApp);

/* ---------------- passing it on, but only once it has earned that ----------------
   Asking someone to recommend an app before they have seen it do anything is
   asking them to vouch for a stranger. This waits for a conversation that
   actually happened — a real person on the other end, not just a screen that
   opened — offers once, and takes no for an answer permanently. */
let hadRealChat = false;
function viralDismissed(){ try{ return localStorage.getItem('dvlogos-viral-off') === '1'; }catch(e){ return false; } }
function dismissViral(){ try{ localStorage.setItem('dvlogos-viral-off', '1'); }catch(e){} }
function maybeShowViralCard(){
  if (!hadRealChat || viralDismissed()) return;
  hadRealChat = false; /* offered for this conversation, not for every trip home */
  $('viralCard').classList.remove('hide');
}
$('btnViralShare').addEventListener('click', async () => {
  $('viralCard').classList.add('hide');
  dismissViral(); /* they said yes: never ask again */
  await shareTheApp();
});
$('viralClose').addEventListener('click', () => {
  $('viralCard').classList.add('hide');
  dismissViral();
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
  /* checked against manualInvitePc, not just against pc: pc alone would still
     say "yes, apply it" to whatever connection anything else — a contact tap,
     an address auto-accept — replaced it with in the meantime. The pasted
     answer belongs to one specific invite, and only that one. */
  if (!pc || pc !== manualInvitePc) return;
  const myPc = pc;
  try{
    const env = readEnvelope($('answerIn').value);
    /* the reply comes back sealed under the same passphrase we handed out */
    const parsed = isLocked(env) ? await openPayload(env, sessionPass) : env;
    if (parsed.type !== 'answer') throw new Error('bad');
    if (pc !== myPc){ return; }   /* superseded while that was in flight */
    await myPc.setRemoteDescription({ type: 'answer', sdp: parsed.sdp });
    showBigConnectingA();
    watchHandshakeProgress(myPc, $('statusA'), $('diagA'), null, ok => { if (!ok) hideBigConnectingA(false); });
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
  /* same inline-handler gap as the "prepare the invite" button above, and the
     same fix: held locally, checked once the five awaits below have all had
     their chance to let the global be replaced from underneath */
  const myPc = pc;
  myPc.ondatachannel = ev => wireDataChannel(ev.channel);
  await myPc.setRemoteDescription({ type: 'offer', sdp: parsed.sdp });
  const answer = await myPc.createAnswer();
  await myPc.setLocalDescription(answer);
  await waitIceComplete(myPc);
  if (pc !== myPc){ return; }   /* superseded during the awaits above */
  const reply = { type: 'answer', sdp: myPc.localDescription.sdp };
  const code = sessionPass ? await sealPayload(reply, sessionPass) : b64encode(JSON.stringify(reply));
  $('answerOut').textContent = code;
  $('answerBlock').classList.remove('hide');
  if (await robustCopy(code)) toast(t('toast.sealCopied'));
  watchHandshakeProgress(myPc, $('statusB'), $('diagB'));
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
/* A name is a claim: anyone can say they are Maria, and the conversation filed
   under that name would be handed to them. The safety records learned this
   lesson already and moved to the certificate fingerprint, which the handshake
   itself proves; the history was left behind and is caught up here. The
   name-keyed form is still read once, so nobody loses what they had. */
function historyKey(nick){ return 'dvlogos-history-' + (nick||'').trim().toLowerCase(); }
function historyKeyFp(fpHex){ return 'dvlogos-history-fp-' + fpHex; }
/* whichever key this conversation should be using right now */
function historyKeyNow(nick){
  const fp = remoteFpHex();
  return fp ? historyKeyFp(fp) : historyKey(nick);
}
function loadHistoryPlaceholder(){ $('msgs').innerHTML = ''; }
function loadHistoryFor(nick){
  $('msgs').innerHTML = '';
  let list = [];
  const key = historyKeyNow(nick);
  try{ list = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){}
  /* one-time carry-over from the old name-keyed form, and only for a device
     whose safety code is already the one we trust for this person — an
     impostor claiming the name gets nothing */
  if (!list.length && key !== historyKey(nick) && safetyState === 'ok'){
    try{
      const old = JSON.parse(localStorage.getItem(historyKey(nick)) || '[]');
      if (old.length){
        list = old;
        localStorage.setItem(key, JSON.stringify(old));
        localStorage.removeItem(historyKey(nick));
      }
    }catch(e){}
  }
  if (list.length){
    const d = document.createElement('div'); d.className = 'daymark';
    d.textContent = (CURLANG==='it' ? 'Cronologia con ' : 'History with ') + nick;
    $('msgs').appendChild(d);
  }
  list.forEach(m => renderMsg(m.html, m.mine, false));
}
function saveToHistory(nick, html, mine){
  if (!nick) return;
  /* A conversation with a timer on it is one somebody wants gone. Writing it to
     disk and deleting it afterwards is not the same thing as never writing it:
     a deleted key can survive in the browser's own storage internals, and the
     moment between the two is a moment where the phone holds it. So an armed
     session never touches the disk at all. */
  if (destructArmed) return;
  const key = historyKeyNow(nick);
  let list = [];
  try{ list = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){}
  list.push({ html, mine, t: Date.now() });
  if (list.length > 300) list = list.slice(-300);
  try{ localStorage.setItem(key, JSON.stringify(list)); }
  catch(e){
    /* the phone is full, or storage is refused. Saying nothing meant the
       history quietly stopped being kept and the only way to find out was to
       notice it missing later. */
    historyBroken = true;
  }
}
/* Declared here, beside the function that reads them, rather than next to the
   self-destruct button far below: this runs on every message and must never
   depend on how far down the file has been reached. */
let historyBroken = false, destructArmed = false;

/* Everything this device kept about one person. Used by the self-destruct,
   which until now cleared only what was on the screen — so the app said
   "conversation self-destructed" while a full copy sat on the phone and came
   back the next time the same person connected. */
function forgetHistoryFor(nick){
  /* both forms: the one in use now and the older name-keyed one, so a
     conversation cannot survive the destruction by hiding under the other */
  try{ localStorage.removeItem(historyKeyNow(nick)); }catch(e){}
  if (nick) try{ localStorage.removeItem(historyKey(nick)); }catch(e){}
}
$('btnClearHistory').addEventListener('click', () => {
  forgetHistoryFor(peerNick);
  $('msgs').innerHTML = '';
  releaseObjectUrls();   /* nothing on screen is pointing at them any more */
  toast(t('history.cleared'));
});

/* ============================== automatic cleanup (opt-in, off by default) ==============================
   Separate from self-destruct on purpose: self-destruct is something you arm for one
   conversation, right now, and it ends the session for both sides. This is quieter and
   only ever touches this device — a housekeeping choice ("don't let old chats pile up on
   my phone forever"), not a privacy action taken on someone else's behalf. Nothing here
   is on unless the person switches it on themselves, and every message already carries
   its own timestamp, so this needed no new bookkeeping to build. */
function autocleanPref(){ try{ return localStorage.getItem('dvlogos-autoclean') === '1'; }catch(e){ return false; } }
function setAutocleanPref(on){ try{ localStorage.setItem('dvlogos-autoclean', on ? '1' : '0'); }catch(e){} }
function autocleanDays(){ try{ return parseInt(localStorage.getItem('dvlogos-autoclean-days'), 10) || 30; }catch(e){ return 30; } }
function setAutocleanDays(days){ try{ localStorage.setItem('dvlogos-autoclean-days', String(days)); }catch(e){} }

function runAutoclean(){
  if (!autocleanPref()) return;
  const cutoff = Date.now() - autocleanDays() * 24 * 3600 * 1000;
  let keys = [];
  try{ keys = Object.keys(localStorage); }catch(e){ return; }
  for (const key of keys){
    if (key.indexOf('dvlogos-history-') !== 0) continue;
    let list;
    try{ list = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){ continue; }
    const kept = list.filter(m => m.t && m.t >= cutoff);
    try{
      if (kept.length) localStorage.setItem(key, JSON.stringify(kept));
      else localStorage.removeItem(key); /* nothing left worth keeping the key for */
    }catch(e){}
  }
}

function paintAutocleanToggle(on){
  $('autocleanRow').classList.toggle('on', on);
  $('autocleanRow').setAttribute('aria-pressed', on ? 'true' : 'false');
  $('autocleanOpts').classList.toggle('hide', !on);
}
$('autocleanDays').value = String(autocleanDays());
paintAutocleanToggle(autocleanPref());
$('autocleanRow').addEventListener('click', () => {
  const on = !$('autocleanRow').classList.contains('on');
  setAutocleanPref(on);
  paintAutocleanToggle(on);
  if (on) runAutoclean(); /* takes effect on old conversations right away, not only from now on */
});
$('autocleanRow').addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); $('autocleanRow').click(); }
});
$('autocleanDays').addEventListener('change', () => {
  setAutocleanDays(parseInt($('autocleanDays').value, 10) || 30);
  if (autocleanPref()) runAutoclean();
});
runAutoclean(); /* once per app open is enough — nobody's chat needs pruning mid-session */

/* ============================== recent contacts (local only) ==============================
   Remembered automatically the moment someone's 'hello' arrives — no manual "add contact"
   step. Once a contact's persistent fingerprint is on file (see the auto-reconnect section
   below), reopening them can skip a fresh code exchange entirely; contacts saved before that
   fingerprint existed just fall back to the manual invite screen, same as always. */
function loadContacts(){
  try{ return JSON.parse(localStorage.getItem('dvlogos-contacts') || '[]'); }catch(e){ return []; }
}
function saveContacts(list){ try{ localStorage.setItem('dvlogos-contacts', JSON.stringify(list)); }catch(e){} }
function touchContact(nick, fp, push){
  if (!nick) return;
  let list = loadContacts();
  const prev = list.find(c => c.nick.toLowerCase() === nick.toLowerCase());
  const keepFp = fp || (prev && prev.fp) || null;
  /* `push` arrives fresh on every 'hello', which is exactly right: if someone
     reinstalled the app or switched devices their old subscription is dead
     anyway, and the only way to learn the new one is to hear it from them
     directly, the same as everything else this app trusts. undefined (not
     sent this message) keeps whatever was already on file; null clears it. */
  const keepPush = push !== undefined ? push : (prev && prev.push) || null;
  list = list.filter(c => c.nick.toLowerCase() !== nick.toLowerCase());
  list.unshift({ nick, lastSeen: Date.now(), fp: keepFp, push: keepPush });
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
  /* a tap here creates or replaces pc just like goStart/goJoin do, and was
     the one entry point that never asked busyWithSomeone() first: tapping a
     contact while a manual invite or another attempt was already mid-flight
     silently tore it down, out from under whatever was waiting on it */
  if (busyWithSomeone()){
    toast(t('home.busyReconnect','Sei occupato al momento. Chiudi o completa la connessione in corso prima di riprovare.'));
    return;
  }
  const nick = row.getAttribute('data-nick');
  const contact = loadContacts().find(c => c.nick === nick);
  showScreen('screenStart');
  if (contact && contact.fp){
    /* a targeted reconnect to someone specific isn't the "get a shareable code"
       flow — it reuses this screen's status/diagnostic line, with everything
       that belongs to creating a fresh invite hidden rather than just left
       sitting there, disabled but still looking like something to press */
    showContactReconnectLayout();
    tryAutoReconnect(contact);
  } else {
    showQuickLayoutA();
    startQuickShare();
  }
});

/* ============================== knock (push notifications) ==============================
   The one real limit left in reconnecting to a known contact: both people have to have the
   app open at the same moment, because nothing here polls for you in the background. A knock
   removes that, without adding the thing this app has avoided from the start — a server that
   knows who your contacts are. Nobody's subscription is ever stored anywhere but the two
   phones involved: it travels in the same 'hello' handshake as the safety fingerprint, over
   the already-encrypted connection, the first time two people talk. Reaching someone later
   means handing the Worker a subscription you already hold from that exchange; the Worker
   signs a Web Push request with the project's key and forwards it, and forgets it immediately
   after. The push itself says nothing — not a name, not a message — only "someone you have
   met before wants to talk"; opening the app is what actually finds out who, over the mailbox,
   the same as always.
   iOS only allows this for a PWA added to the Home Screen (a real Apple restriction, not a
   choice made here) — the toggle only appears where it can actually work. */
const VAPID_PUBLIC_KEY = 'BM4QXIv3U4bOctmAoYQShEuxagG_99NF8QRRKqdwAo9XsabHFSmux_BRF2tY0c0TT_YxzUHs3lBb13PFAmTtKGY';
const KNOCK_URL = 'https://digitalvalut-turn.burbeng78.workers.dev/knock';

function sanitizePushSub(sub){
  if (!sub || typeof sub !== 'object') return null;
  if (typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) return null;
  if (sub.endpoint.length > 1024) return null;
  return { endpoint: sub.endpoint };
}
function pushSupported(){
  /* standalone check matters only on iOS — Safari refuses Web Push from an
     ordinary browser tab regardless of permission, but Chrome/Android and
     desktop browsers support it in a plain tab too */
  if (isIOS) return isStandalone && 'serviceWorker' in navigator && 'PushManager' in window;
  return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
}
function notifyPref(){ try{ return localStorage.getItem('dvlogos-notify') === '1'; }catch(e){ return false; } }
function setNotifyPref(on){ try{ localStorage.setItem('dvlogos-notify', on ? '1' : '0'); }catch(e){} }

let myPushSub = null;
async function ensurePushSubscription(){
  if (myPushSub) return myPushSub;
  if (!pushSupported()) return null;
  try{
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });
    myPushSub = sub.toJSON();
    return myPushSub;
  }catch(e){ return null; }
}
async function enableNotifications(){
  if (!pushSupported()) return false;
  try{
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }catch(e){ return false; }
  const sub = await ensurePushSubscription();
  if (sub) setNotifyPref(true);
  return !!sub;
}
function disableNotifications(){
  setNotifyPref(false);
  navigator.serviceWorker && navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription())
    .then(sub => sub && sub.unsubscribe()).catch(()=>{});
  myPushSub = null;
}
/* fire-and-forget: a knock is a nice-to-have on top of the mailbox poll that
   already runs, never something the connection flow waits on or fails without */
function knockEndpoint(endpoint){
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) return;
  try{
    fetch(KNOCK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(()=>{});
  }catch(e){}
}
function sendKnock(contact){
  if (!contact || !contact.push) return;
  knockEndpoint(contact.push.endpoint);
}

function paintNotifyToggle(on){
  $('notifyRow').classList.toggle('on', on);
  $('notifyRow').setAttribute('aria-pressed', on ? 'true' : 'false');
}
function initNotifyUI(){
  if (pushSupported()){
    $('notifyCard').classList.remove('hide');
    $('notifyIosHint').classList.add('hide');
    paintNotifyToggle(notifyPref() && Notification.permission === 'granted');
  } else if (isIOS && !isStandalone && 'serviceWorker' in navigator){
    /* explains itself instead of offering a switch that cannot work yet —
       the same approach already used for the iOS install banner */
    $('notifyCard').classList.remove('hide');
    $('notifyIosHint').classList.remove('hide');
    $('notifyRow').classList.add('hide');
  }
  /* anything else (a browser with no Push API at all) shows nothing, rather
     than a control that can only ever fail */
}
$('notifyRow').addEventListener('click', async () => {
  const goingOn = !$('notifyRow').classList.contains('on');
  if (goingOn){
    paintNotifyToggle(true);
    const ok = await enableNotifications();
    if (!ok){ paintNotifyToggle(false); toast(t('notify.blocked','Notifiche bloccate dal browser. Controlla le impostazioni del sito.')); }
    else if (activeSlots().length){
      /* publishAddress() refuses to write anything at all while notifications
         are off — there is no subscription yet to write. The natural order is
         address first, then this switch, and nothing used to redo that write
         once a subscription existed: the address stayed reachable only while
         the app itself was open, silently, until it happened to be closed and
         reopened. Whoever dialled it in between knocked at a door that had
         never actually left word of where it lived. */
      publishAddress();
    }
  } else {
    disableNotifications();
    paintNotifyToggle(false);
  }
});
$('notifyRow').addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); $('notifyRow').click(); }
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
/* The Worker answers for these origins and refuses every other one outright.
   Kept here as well so the app can say *why* nothing works when it is being
   served from somewhere else — a local test server, or a copy someone put on
   their own host — instead of leaving a spinner running and then blaming the
   person who was called. Must match ALLOWED_ORIGINS in turn-worker/worker.js. */
const SERVICE_ORIGINS = ['https://digitalvalut.github.io', 'https://logos.digitalvalut.it'];

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
/* ---------------- knowing the difference between "empty" and "unreachable" ----------------
   An empty mailbox and a mailbox that cannot be reached at all look identical
   from the calling code — both are "nothing came back" — and the app used to
   treat them the same, which produced the worst possible message: someone
   whose helper Worker was down was told their code was wrong. It was not.
   Nothing was wrong with it; there was simply nothing on the other end to hold
   it. Worth separating, because the honest answer has a way out attached: the
   long invite code passes through no server whatsoever, so it keeps working
   when everything here does not. */
let brokerReachable = true;
async function mailboxPut(key, obj){
  try{
    const res = await fetch(MAILBOX_BASE + key, { method:'PUT', body: JSON.stringify(obj) });
    brokerReachable = true;
    return res.ok;
  }catch(e){ brokerReachable = false; return false; }
}
async function mailboxGet(key){
  try{
    const res = await fetch(MAILBOX_BASE + key, { method:'GET' });
    brokerReachable = true; /* a 404 is a perfectly healthy answer: the slot is empty */
    if (res.status !== 200) return null;
    return await res.json();
  }catch(e){ brokerReachable = false; return null; }
}

/* Says what actually happened and hands over the thing that still works,
   rather than leaving someone poking at a code that was never the problem. */
function brokerDownFallback(side){
  if (side === 'A'){
    hideBigConnectingA(false); /* false: reveal the long-code layout */
    setStatus($('statusA'), t('broker.down','Il servizio che vi fa incontrare non risponde. Il codice lungo qui sotto funziona lo stesso: non passa da nessun server.'), 'bad');
  } else {
    hideBigConnectingB(false);
    setStatus($('statusB'), t('broker.down','Il servizio che vi fa incontrare non risponde. Il codice lungo qui sotto funziona lo stesso: non passa da nessun server.'), 'bad');
  }
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
/* Every sealed thing goes out through here, so the one-time public key an
   address envelope needs is attached in exactly one place. The six-digit and
   fingerprint paths carry no `epk` and are untouched by it. */
async function sealWith(sec, obj){
  const env = await sealFor(sec.key, obj);
  /* Travels in the clear beside the envelope, and is meant to: it is a public
     key, and it is what lets the address's private half derive the same secret
     and open what follows. */
  if (sec.epk) env.e = sec.epk;
  return env;
}
async function mailboxPutSealed(key, sec, obj){ return mailboxPut(key, await sealWith(sec, obj)); }
async function mailboxGetSealed(key, sec){
  const env = await mailboxGet(key);
  if (!env) return null;
  return openFrom(sec.key, env);
}

/* ============ ECIES: encrypting to an address instead of with it ============
   Three functions and one rule. The rule: the slot an envelope sits in is
   derived from the address, and the key it is sealed with is not.

   Slot names have to stay address-derived, and that is not the flaw being
   fixed. Whoever dials needs to know where to leave the offer, and whoever is
   being dialled needs to know where to look, and neither holds a shared secret
   yet at that point — so the address is the only thing that can name the
   place. What answers a swept slot is the Worker's request limit, which is what
   it always was. The flaw was that the *key* came from the same public string,
   so finding the slot meant reading it too. Now finding it means finding a
   sealed envelope and nothing else. */
const PUBKEY_BASE = 'https://digitalvalut-turn.burbeng78.workers.dev/key/';

async function addrSlotSeed(addr){ return sha256Hex2('logos-addr-slot-v2:' + addr); }

/* HKDF over the raw ECDH output rather than using it as a key directly: the
   shared value is a curve coordinate, not uniform key material, and turning
   one into the other is exactly what HKDF is for. */
async function eciesKeyFromShared(sharedBits){
  const base = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'HKDF', hash:'SHA-256', salt: SIGNAL_SALT, info: new TextEncoder().encode('logos-addr-v2') },
    base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
}

/* Publishes the public key one of this device's addresses is made of. Refused
   by the Worker unless the key really does hash to the address that owns the
   slot, so this cannot be used to trample on anybody else's. */
async function publishAddrKey(slot){
  const pub = await myPubB64();
  const addr = await myAddress(slot);
  if (!pub || !addr) return false;
  try{
    const res = await fetch(PUBKEY_BASE + await keySlotFor(addr), {
      method: 'PUT', body: JSON.stringify({ p: pub, n: slot | 0 })
    });
    return res.ok;
  }catch(e){ return false; }
}

/* Fetches the public key behind an address and refuses to believe it until it
   hashes back to that same address. This check is the whole security of the
   scheme: without it the Worker could hand out its own key and read everything
   afterwards. With it, a substituted key produces a different address and is
   thrown away.

   The record carries the slot number as well as the key, and it has to: whoever
   dials knows only the address, never which of the owner's slots it is — that
   is the owner's business and none of the caller's. So the record says, and the
   hash check authenticates the pair rather than just the key. Tampering with
   either half moves the address, which is what gets caught.

   Forging a second (key, slot) pair that lands on the same address means a
   60-bit second preimage: with 256 slot numbers to play with, around 2^52
   generated key pairs. That is the same wall as before and it still holds. */
async function fetchAddrKey(addr){
  let rec;
  try{
    const res = await fetch(PUBKEY_BASE + await keySlotFor(addr), { method: 'GET' });
    brokerReachable = true;
    if (res.status !== 200) return null;
    rec = await res.json();
  }catch(e){ brokerReachable = false; return null; }
  if (!rec || typeof rec.p !== 'string') return null;
  const n = rec.n | 0;
  if (n < 0 || n > 255) return null;
  if (await addressFromPub(rec.p, n) !== addr) return null;
  try{
    const key = await crypto.subtle.importKey('raw', b642ab(rec.p), { name:'ECDH', namedCurve:'P-256' }, false, []);
    return { key, slot: n };
  }catch(e){ return null; }
}

/* Caller side. A one-time key pair per call, so two calls to the same address
   share nothing: whoever recorded the first cannot read the second even if the
   address's own key were later lost. Returns null when the address published
   no key, or published one that does not match it — the caller must say so
   rather than press on and hang. */
async function addrDialSecrets(addr){
  const found = await fetchAddrKey(addr);
  if (!found) return null;
  try{
    const eph = await crypto.subtle.generateKey({ name:'ECDH', namedCurve:'P-256' }, true, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name:'ECDH', public: found.key }, eph.privateKey, 256);
    return {
      key: await eciesKeyFromShared(bits),
      seed: await addrSlotSeed(addr),
      epk: ab2b64(await crypto.subtle.exportKey('raw', eph.publicKey)),
      slot: found.slot,
    };
  }catch(e){ return null; }
}

/* ---- the one thing an address holder can still read, and why ----
   The wake slot holds "here is how to make my phone ring", written by the
   owner of the address for whoever dials it to pick up. It cannot be sealed to
   the caller, because when it is written there is no caller yet — that is the
   entire purpose of it. So it stays sealed under a key derived from the
   address, exactly as everything used to be, and anyone holding the address can
   read it.

   Stated plainly rather than glossed over: what leaks is a push endpoint, to
   people who by definition already hold your address and are therefore already
   entitled to make your phone ring. It carries no message and no name. That is
   a far smaller thing than what P2 was about — who is calling you, what they
   wrote, and their network address — and unlike those it cannot be closed
   without a server that knows who your contacts are, which this app exists not
   to have. */
async function addrWakeSecrets(addr){ return pairSecrets('logos-addr-wake-v2:' + addr); }

/* Recipient side. The envelope names the one-time key it was sealed to, so the
   secret comes from that plus this device's private half — which never leaves
   the browser and has no byte form this code could read. The secret is handed
   back along with the contents because everything after it (the answer, every
   ICE candidate) travels under the same one, with no second exchange.

   That the envelope opens at all is the proof of identity: only the private
   half behind the published key could have produced this secret, and that key
   is what the address is a hash of. It replaces v1's trick of hashing the
   answering certificate, and it is a stronger claim — a live demonstration of
   holding the key rather than a match between two hashes. */
async function addrOpenIncoming(env, seed){
  if (!env || typeof env.e !== 'string') return null;
  const kp = await myKeyPair();
  if (!kp) return null;
  let key;
  try{
    const theirEph = await crypto.subtle.importKey('raw', b642ab(env.e), { name:'ECDH', namedCurve:'P-256' }, false, []);
    const bits = await crypto.subtle.deriveBits({ name:'ECDH', public: theirEph }, kp.privateKey, 256);
    key = await eciesKeyFromShared(bits);
  }catch(e){ return null; }
  const obj = await openFrom(key, env);
  if (!obj) return null;
  return { obj, sec: { key, seed } };
}

/* ============================== an invite that waits ==============================
   Until now both people had to be looking at their screens within the same two
   minutes, because that is how long the mailbox holds anything. That is not how
   an invite sent over WhatsApp is actually read: it is read when the other
   person next picks up their phone, which might be three hours later.

   So alongside the invite, the app leaves one sealed note in a slot that lives a
   day and is not consumed by being read. The note says only how to buzz the
   person who made the invite — nothing else, sealed with the same key derived
   from the invite code, so the Worker holding it cannot read it any more than it
   can read a message.

   What that buys: the person who made the invite can close the app entirely.
   Whoever opens the invite later finds no live offer, reads the note, and rings
   them. Their phone buzzes, they open the app, the invite quietly goes live
   again on the same code, and the two connect. Nobody had to be waiting. */
const WAKE_BASE = 'https://digitalvalut-turn.burbeng78.workers.dev/wake/';

async function wakePut(key, obj){
  try{ const res = await fetch(WAKE_BASE + key, { method:'PUT', body: JSON.stringify(obj) }); return res.ok; }
  catch(e){ return false; }
}
async function wakeGet(key){
  try{
    const res = await fetch(WAKE_BASE + key, { method:'GET' });
    if (res.status !== 200) return null;
    return await res.json();
  }catch(e){ return null; }
}
async function wakePutSealed(key, sec, obj){ return wakePut(key, await sealFor(sec.key, obj)); }
async function wakeGetSealed(key, sec){
  const env = await wakeGet(key);
  if (!env) return null;
  return openFrom(sec.key, env);
}

/* ============================== the letterbox ==============================
   Everything else here needs both people awake at once. A shop at eleven at
   night is not, and neither is anyone with a life, so a call to an address
   nobody answered used to simply evaporate — "try later", and whatever the
   person wanted to say was gone.

   A letter is sealed with the key derived from the address, exactly like every
   other thing that passes through the Worker, and collected the next time the
   owner opens the app. What is new, and worth saying plainly rather than
   burying: this is the one thing that is kept for more than two minutes. The
   Worker holds a sealed envelope for up to a week, under a name that is a
   hash, and deletes it the moment it is collected. It cannot open it, and it
   has no idea who wrote it or who will read it — but it is holding something,
   and that is a smaller promise than "nothing is kept anywhere". */
const LETTER_BASE = 'https://digitalvalut-turn.burbeng78.workers.dev/letter/';

/* Sealed to the address's public key, like a call is. This is the change that
   matters most of the whole of P2: a letter is the one thing here that sits on
   a server for days, and under the old scheme anyone who had ever been given
   the address could read a week of them. Now only the phone that owns the
   address can, and the Worker holds envelopes it has no way into. */
async function letterPut(addr, obj){
  try{
    const sec = await addrDialSecrets(addr);
    if (!sec) return false;   /* no verified key: better nothing than in the clear */
    const box = await slotId(sec.seed, 'letterbox');
    const rand = hex(crypto.getRandomValues(new Uint8Array(8)));
    const res = await fetch(LETTER_BASE + box + '/' + rand, {
      method: 'PUT', body: JSON.stringify(await sealWith(sec, obj))
    });
    return res.ok;
  }catch(e){ return false; }
}
/* Collecting empties the box, so whatever comes back is kept on this device
   from here on — the server will not have it to give a second time.
   Each letter names the one-time key it was sealed to, so each is opened on its
   own: they come from different people, on different days, and share nothing
   but the box they were left in. */
async function letterGet(addr){
  try{
    const seed = await addrSlotSeed(addr);
    const box = await slotId(seed, 'letterbox');
    const res = await fetch(LETTER_BASE + box, { method: 'GET' });
    if (res.status !== 200) return [];
    const raw = await res.json();
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const s of raw){
      try{
        const opened = await addrOpenIncoming(JSON.parse(s), seed);
        if (opened && opened.obj) out.push(opened.obj);
      }catch(e){}
    }
    return out;
  }catch(e){ return []; }
}

function storedLetters(){ try{ return JSON.parse(localStorage.getItem('dvlogos-letters') || '[]'); }catch(e){ return []; } }
function saveLetters(l){ try{ localStorage.setItem('dvlogos-letters', JSON.stringify(l.slice(-40))); }catch(e){} }
function dropLetter(id){ saveLetters(storedLetters().filter(x => x.id !== id)); }

/* Only ever written if this device can actually be reached — an invite that
   promises to ring someone who has notifications switched off would be a lie
   told to the person opening it. */
async function publishWakeSlot(sec){
  if (!notifyPref()) return false;
  const clean = sanitizePushSub(await ensurePushSubscription());
  if (!clean) return false;
  try{
    await wakePutSealed(await slotId(sec.seed, 'wake'), sec, { push: clean, nick: myNick() });
    return true;
  }catch(e){ return false; }
}

/* The code of an invite that is still out there somewhere, so that opening the
   app can put it back on the air on the *same* code — a different one would
   leave whoever is holding the link waiting at an address nobody is at. */
const PENDING_KEY = 'dvlogos-pending-invite';
const PENDING_MAX_AGE = 24 * 3600 * 1000; /* matches the wake slot's own life */
function savePendingInvite(code){
  try{ localStorage.setItem(PENDING_KEY, JSON.stringify({ code, at: Date.now() })); }catch(e){}
}
function readPendingInvite(){
  try{
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    if (!p || !p.code || !p.at) return null;
    if (Date.now() - p.at > PENDING_MAX_AGE){ clearPendingInvite(); return null; }
    return p;
  }catch(e){ return null; }
}
function clearPendingInvite(){ try{ localStorage.removeItem(PENDING_KEY); }catch(e){} }

/* ============================== the permanent address ==============================
   Everything above reaches someone you are already talking to, or someone you
   are about to. This is the other half: something you can print on a shop
   window, put in an email signature, or give to a person you just met — and be
   reachable at, later, without ever having handed over a phone number or a
   name.

   The difference from the messengers that now offer usernames is not a detail.
   They still make you register a phone number with them; a username only hides
   it from other users, while the company keeps it. Here there is no
   registration at all. The address is computed on this device from the
   certificate this device already generated for itself, and it is never sent
   anywhere to be reserved, claimed or listed. There is no directory — not
   here, not on the Worker, not at DigitalValut — so there is nothing that can
   be leaked, sold or handed over.

   Sixty bits, written as twelve characters. Not a secret, but far past what
   anyone could sweep for: finding one address by guessing means about a
   billion billion attempts against a Worker that refuses more than three
   hundred a minute.

   And it verifies itself. The address is a one-way hash of the certificate, so
   whoever answers can be checked against the address that was dialled. Nobody
   can answer for an address they do not hold the key to — which is what makes
   it safe to paint on a shop window. */

/* Crockford's alphabet: no I, L, O or U, so nothing looks like anything else
   when read down a phone or copied off a business card. */
const ADDR_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ADDR_LEN = 12;

/* One device, many addresses — slot 0 is the lasting one, 1..255 are the ones
   meant to be burned.

   Why a small number and not a name like "sofa". The address is what proves who
   answered: a stranger who wanted to answer in your place would have to find
   something that hashes to it. With a free-text label they could simply try
   labels — cheap hashing, sixty bits, days of work on ordinary hardware, and
   your address is forged. With a number capped at 255 they get 256 tries per
   certificate and have to go back to generating certificates, which is tens of
   thousands of times slower and puts the same attack past a human lifetime.
   The friendly name still exists; it just stays on the phone, where it cannot
   be used as a lever.

   Slot 0 deliberately hashes exactly what the first version hashed, so every
   address already given out keeps working. */
/* The 60 bits of an address, packed into twelve of Crockford's characters.
   Shared by both address versions so the two can never drift apart in the
   packing while differing only where they are meant to: what gets hashed. */
async function addressFromMaterial(material){
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material)));
  let bin = '';
  for (let i = 0; i < 8; i++) bin += d[i].toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < ADDR_LEN; i++) out += ADDR_ALPHABET[parseInt(bin.slice(i * 5, i * 5 + 5), 2)];
  return out;
}
async function addressFromFp(fpHex, slot){
  if (!fpHex) return null;
  const n = slot | 0;
  return addressFromMaterial('logos-address-v1:' + fpHex + (n ? '/' + n : ''));
}
/* v2: the address commits to the ECDH public key instead of to the DTLS
   certificate. The slot number is always written out, unlike v1's special case
   for slot 0 — there is no compatibility left to keep here, and the Worker has
   to reproduce this exact string to check that a published key belongs to the
   address claiming it, so one rule with no exceptions is worth more than one
   saved character. Kept in step with `addressFromPub` in turn-worker/worker.js;
   a test holds the two to the same answers. */
async function addressFromPub(pubB64, slot){
  if (!pubB64) return null;
  return addressFromMaterial('logos-address-v2:' + pubB64 + '/' + (slot | 0));
}
/* Where a device publishes the public key for one of its addresses. Derived
   from the address, so anyone holding the address can find it — that is the
   point, it is public key material. */
async function keySlotFor(addr){ return sha256Hex2('logos-pubkey-v2:' + addr); }
const myAddrCache = {};
async function myAddress(slot){
  const n = slot | 0;
  if (myAddrCache[n]) return myAddrCache[n];
  myAddrCache[n] = await addressFromPub(await myPubB64(), n);
  return myAddrCache[n];
}

/* ---------------- the burnable ones ----------------
   An address handed to a stranger is a stranger who can reach you forever —
   the same trap as a phone number, wearing a different coat. These are made to
   be thrown away: one for the sofa you are selling, deleted the day it is
   sold, and the person who bought it never had anything else. */
const BURNER_MAX = 8;
function burners(){ try{ return JSON.parse(localStorage.getItem('dvlogos-burners') || '[]'); }catch(e){ return []; } }
function saveBurners(l){ try{ localStorage.setItem('dvlogos-burners', JSON.stringify(l)); }catch(e){} }
function addBurner(name){
  const l = burners();
  if (l.length >= BURNER_MAX) return null;
  const used = l.map(b => b.n);
  let n = 1;
  while (used.indexOf(n) >= 0 && n < 256) n++;
  if (n > 255) return null;
  const rec = { n, name: String(name || '').trim().slice(0, 40), at: Date.now() };
  l.push(rec); saveBurners(l);
  return rec;
}
function removeBurner(n){ saveBurners(burners().filter(b => b.n !== n)); }
/* every slot this device answers at: the lasting one plus whatever is alive */
function activeSlots(){ return (addrOn() ? [0] : []).concat(burners().map(b => b.n)); }
function formatAddress(a){
  return a ? 'DV-' + a.slice(0,4) + '-' + a.slice(4,8) + '-' + a.slice(8,12) : '';
}
/* Someone reading an address aloud will say "oh" for zero and "eye" for one,
   and whoever writes it down will write the letter. Those never appear in a
   real address, so folding them back costs nothing and saves the call. */
function parseAddress(s){
  let up = String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  /* Both D and V are perfectly good address characters, so about one address
     in a thousand begins with "DV" of its own accord. Stripping the prefix on
     sight would have quietly made exactly those addresses impossible to dial;
     the length is what tells a prefix apart from an address's own first two
     characters. */
  if (up.length === ADDR_LEN + 2 && up.slice(0, 2) === 'DV') up = up.slice(2);
  up = up.replace(/[IL]/g, '1').replace(/O/g, '0').replace(/U/g, 'V');
  return up.length === ADDR_LEN && [...up].every(c => ADDR_ALPHABET.indexOf(c) >= 0) ? up : null;
}
/* `addrSecrets(addr)` used to live here, and its removal is the whole of P2:
   it derived the encryption key from the address string, so holding an address
   — a public thing, printed on shop windows — meant being able to read every
   call arriving at it. What replaced it: addrSlotSeed for *where* things sit
   (public, and always was), addrDialSecrets / addrOpenIncoming for the ECDH key
   that actually seals them, and addrWakeSecrets for the one slot that still has
   to be readable by whoever holds the address, with the reasons written there. */

function addrOn(){ try{ return localStorage.getItem('dvlogos-addr-on') === '1'; }catch(e){ return false; } }
function setAddrOn(on){ try{ localStorage.setItem('dvlogos-addr-on', on ? '1' : '0'); }catch(e){} }
function addrBlocked(){ try{ return JSON.parse(localStorage.getItem('dvlogos-addr-blocked') || '[]'); }catch(e){ return []; } }
function blockFp(fp){
  if (!fp) return;
  const l = addrBlocked();
  if (l.indexOf(fp) < 0){ l.push(fp); try{ localStorage.setItem('dvlogos-addr-blocked', JSON.stringify(l)); }catch(e){} }
}
function isBlockedFp(fp){ return !!fp && addrBlocked().indexOf(fp) >= 0; }

function addrLink(addr){ return location.origin + location.pathname + '#a=' + addr; }

/* Left where anyone holding the address can find it, so they can ring this
   phone rather than hope it happens to be open. It says only "buzz here" —
   the same contentless knock used everywhere else. */
async function publishAddress(){
  const clean = sanitizePushSub(notifyPref() ? await ensurePushSubscription() : null);
  if (!clean) return false;
  let any = false;
  for (const n of activeSlots()){
    const addr = await myAddress(n);
    if (!addr) continue;
    const sec = await addrWakeSecrets(addr);
    try{ await wakePutSealed(await slotId(sec.seed, 'addr-wake'), sec, { push: clean }); any = true; }
    catch(e){}
  }
  return any;
}

/* Deliberately NOT part of publishAddress above, which gives up the moment it
   finds notifications switched off. The key is what makes an address dialable
   at all: tying it to a setting most people never touch would have made every
   address belonging to somebody with notifications off silently undiallable —
   the same shape of fault as the one where switching notifications on *after*
   the address never republished it, and a worse one, because it would be
   everyone's default rather than one unlucky order of taps. Runs whenever an
   address exists, on every open, and asks nothing of the person. */
async function publishAddrKeys(){
  let any = false;
  for (const n of activeSlots()){
    if (await publishAddrKey(n)) any = true;
  }
  return any;
}

/* Asked by the health card: is every address this device answers at actually
   dialable? Fetched back rather than assumed, and through the same check a
   caller makes — so a key that reached the Worker but does not hash to the
   address counts as not published, which is exactly what it is worth to
   whoever tries to ring it.
   Every active slot, not just the permanent one. Checking only slot 0 was
   wrong in a way that would have shown a red "nobody can reach you" to
   somebody perfectly reachable: the permanent address can be switched off
   while throwaway ones answer, which activeSlots() supports on purpose, and
   slot 0's key is then rightly absent. */
async function addrKeysPublished(){
  for (const n of activeSlots()){
    const addr = await myAddress(n);
    if (!addr) return false;
    if (!await fetchAddrKey(addr)) return false;
  }
  return true;
}

/* ---------------- being called at any of the addresses ---------------- */
let addrPollTimer = null, addrPending = null;
/* the connection an invite is merely *waiting* on, "we are the caller", and
   "a known contact is being let in right now" */
let quickSharePc = null, dialing = false, autoAccepting = false;
/* the connection a manually-created invite (btnCreate) is waiting on someone
   to paste an answer back into — distinct from quickSharePc, which waits on a
   *typed* code instead of a pasted one. btnConnectAsA checks this before
   applying whatever is in the paste box, so a stale click (or one fired after
   something else quietly replaced pc underneath it) can't hand a connection
   the wrong remote description */
let manualInvitePc = null;

/* ---- the one question every way of being reached has to ask ----
   A connection object exists for several different reasons, and only some of
   them mean "not now". The one that broke this: startQuickShare holds a
   connection open for a quarter of an hour while an invite waits for someone
   to type the code — and it resumes a saved invite *in the background* every
   single time the app opens, with nothing on screen to say so. Counting that
   as "busy" made the address deaf for fifteen minutes at a stretch, so anyone
   who had ever created an invite quietly stopped being reachable at the
   address they had handed out, and no amount of moving between screens would
   bring them back.
   Standing down is right for a conversation already running, or a call being
   set up. It was never right for an invite merely on hold — that one gives
   way by itself the moment a call is accepted.
   Deliberately ONE function, asked by every route in: the same mistake was
   written out twice, independently, for addresses and for known contacts, and
   fixing one of them left the other just as deaf. There is now a single place
   where "am I free to be reached?" is answered, and anything new that lets
   somebody in has to ask it here. */
function busyWithSomeone(){
  if (addrPending) return true;                                  /* already ringing */
  if (dialing) return true;                                      /* we are the one calling */
  if (autoAccepting) return true;                                /* letting a contact in */
  if (!$('screenChat').classList.contains('hide')) return true;  /* talking already */
  if (dc && dc.readyState === 'open') return true;               /* talking already */
  if (!pc) return false;
  if (pc === quickSharePc) return false;                         /* an invite merely on hold */
  /* a connection nobody cleared away holds nothing open and should block
     nothing: attempts that failed or were closed used to sit in this variable
     indefinitely, and every one of them was a permanently deaf address */
  const st = pc.connectionState;
  return st !== 'closed' && st !== 'failed';
}

async function addrCheckOnce(){
  if (busyWithSomeone()) return;
  const slots = activeSlots();
  if (!slots.length) return;
  for (const n of slots){
    const addr = await myAddress(n);
    if (!addr) continue;
    /* The slot is still worked out from the address — both sides have to agree
       on where to look before either holds a secret. What has changed is that
       finding it is no longer the same as being able to read it: the envelope
       is sealed to this device's ECDH key, and only its private half opens it.
       The secret that comes back out is kept and used for the reply and every
       ICE candidate after it, so there is no second exchange. */
    const seed = await addrSlotSeed(addr);
    const raw = await mailboxGet(await slotId(seed, 'addr-offer'));
    if (!raw) continue;
    const got = await addrOpenIncoming(raw, seed);
    if (!got) continue;   /* not sealed to us, or not sealed at all */
    const { obj: msg, sec } = got;
    if (!msg || !msg.sdp || !msg.rid) continue;
    /* a caller already turned away stays turned away, and is not announced again */
    if (isBlockedFp(msg.fp)) continue;
    addrPending = { msg, sec, slot: n };
    /* who, and why — read out of the sealed envelope, which is the only place
       either could have come from: the notification itself carries nothing */
    const chi = (msg.nick || '').trim();
    $('addrIncomingWho').textContent = chi || t('chat.someone','Qualcuno');
    const intro = typeof msg.intro === 'string' ? msg.intro.trim().slice(0, 140) : '';
    $('addrIncomingMsg').textContent = intro;
    $('addrIncomingMsg').classList.toggle('hide', !intro);
    const label = n ? (burners().find(b => b.n === n) || {}).name : '';
    $('addrIncomingWhich').textContent = label
      ? fill(t('addr.incomingAt','tramite «{name}»'), { name: label })
      : '';
    $('addrIncomingWhich').classList.toggle('hide', !label);
    $('addrIncoming').classList.remove('hide');
    $('addrIncoming').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    toast(t('addr.incomingToast','Qualcuno ti sta cercando al tuo indirizzo.'));
    return;
  }
}
/* Paused whenever the page is not being looked at. A tab left open in the
   background used to keep asking the mailbox every five seconds forever, which
   is pure waste — nobody is there to answer, and the free quota is not
   infinite. It picks straight back up the moment the page is shown again. */
function startAddrPolling(){
  if (addrPollTimer || !activeSlots().length || document.visibilityState === 'hidden') return;
  addrPollTimer = setInterval(addrCheckOnce, 5000);
  addrCheckOnce();
}
function stopAddrPolling(){ clearInterval(addrPollTimer); addrPollTimer = null; }
/* Reachable on whichever screen is open, not only Home — sending the address
   itself usually means switching away to WhatsApp or Messages first, which is
   exactly what makes the tab go hidden and stop here. It has to pick back up
   wherever the app was left, not only if that happened to be Home. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden'){ stopAddrPolling(); stopInboxPolling(); }
  else {
    startAddrPolling(); startInboxPolling();
    /* The screen lock is dropped by the system every time this page is
       hidden, and is not given back on its own. Without this line the
       protection lasted only until the first glance at another app, and the
       rest of the call ran with the screen free to sleep again — which is the
       failure it was added to prevent. */
    if (callState === 'active') keepScreenAwake();
  }
});

async function acceptAddrCall(){
  if (!addrPending) return;
  const { msg, sec, slot } = addrPending;
  addrPending = null;
  $('addrIncoming').classList.add('hide');
  showScreen('screenStart');
  showBigConnectingA();
  try{
    stopQuickPump();
    pc = await newPeerConnection();
    /* Held locally and used instead of the global from here on. Everything
       below waits — for the description, for candidates, for the mailbox —
       and anything the person does meanwhile (tapping a contact, answering a
       second call) replaces the global underneath. Reading it afterwards
       published this call's answer built from a different connection, which
       broke both of them. */
    const myPc = pc;
    quickSharePc = null;   /* answering supersedes any invite that was on hold */
    myPc.ondatachannel = ev => wireDataChannel(ev.channel);
    const pump = candidatePump(myPc, sec, 'ab', 'ac');
    quickPump = pump;
    await myPc.setRemoteDescription({ type:'offer', sdp: msg.sdp });
    await pump.remoteReady();
    const answer = await myPc.createAnswer();
    await myPc.setLocalDescription(answer);
    if (pc !== myPc){ pump.stop(); return; }   /* superseded while we waited */
    /* Sealed under the secret that came out of the caller's envelope, which is
       the whole point: only the private half behind this address's published
       key could have derived it, so a reply that opens on their side proves who
       answered. Nothing extra to arrange — the same secret was already in hand
       from reading the offer.
       The slot number rides along as a courtesy for the caller's own display;
       it is not what anything is verified against any more. */
    await mailboxPutSealed(await slotId(sec.seed, 'addr-answer-' + msg.rid), sec,
      { sdp: myPc.localDescription.sdp, nick: myNick(), slot: slot | 0 });
    watchHandshakeProgress(myPc, $('quickStatusA'), $('diagQuickA'), pump, ok => {
      if (!ok) hideBigConnectingA(true);
    });
  }catch(e){ hideBigConnectingA(true); }
}

/* ---------------- saying who you are before you ring ----------------
   Arriving from a QR used to start a call immediately, before the person had
   typed anything, so the far end was rung by "Qualcuno" with no reason given
   and no way to judge whether to answer. One screen fixes it, and the name and
   the line of text ride inside the same sealed envelope as everything else —
   the Worker carries them without ever being able to read them. */
let knockTarget = null, outgoingIntro = '';

function showKnockCard(addr){
  knockTarget = addr;
  $('knockWho').textContent = formatAddress(addr);
  $('knockName').value = $('nickInput').value.trim();
  $('knockMsg').value = '';
  $('knockCard').classList.remove('hide');
  $('knockCard').scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(() => { if (!$('knockName').value) $('knockName').focus(); }, 350);
}
function hideKnockCard(){ $('knockCard').classList.add('hide'); knockTarget = null; }

$('btnKnockGo').addEventListener('click', () => {
  const addr = knockTarget;
  if (!addr) return;
  const name = $('knockName').value.trim();
  if (name) $('nickInput').value = name;   /* one name, used everywhere from here on */
  outgoingIntro = $('knockMsg').value.trim().slice(0, 140);
  hideKnockCard();
  dialAddress(addr);
});
$('knockMsg').addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); $('btnKnockGo').click(); }
});

/* ---------------- calling an address ---------------- */
let dialedAddress = null, dialedSlot = 0;
/* Set only when a reply from the dialled address actually opened under the
   ECDH-derived secret — see the note in checkSafetyFor. Never set from
   anything the caller could have produced by itself. */
let dialedAddrProven = false;

async function dialAddress(raw){
  const addr = parseAddress(raw);
  if (!addr){
    setStatus($('addrDialStatus'), t('addr.badFormat','Questo indirizzo non è scritto bene. Sono 12 caratteri, tipo DV-K7M2-9QRT-X4WP.'), 'bad');
    return;
  }
  if (addr === await myAddress()){
    setStatus($('addrDialStatus'), t('addr.itsYou','Questo è il tuo indirizzo.'), 'bad');
    return;
  }
  setStatus($('addrDialStatus'), '');
  showScreen('screenJoin');
  showBigConnectingB();
  setBigConnectingText('B',
    t('addr.callingTitle','Sto chiamando…'),
    t('addr.callingHint','Se la persona ha l\'app chiusa le faccio squillare il telefono. Può volerci qualche istante.'));
  dialing = true;
  let myPc = null;
  try{
    /* Fetches the key this address is a hash of, and checks it really is. Null
       means one of two honest answers, and both have to be said out loud rather
       than turning into three minutes of "sto chiamando…": either nothing was
       ever published there — an address from before this changed, or one whose
       owner has not opened the app since — or something was published that does
       not hash to this address, which is the case worth refusing outright. */
    const sec = await addrDialSecrets(addr);
    if (!sec){
      dialing = false;
      hideBigConnectingB(true);
      showScreen('screenHome');
      setStatus($('addrDialStatus'), brokerReachable
        ? t('addr.noKey','Questo indirizzo non risulta più attivo. Chiedi alla persona di riaprire l\'app e di rimandartelo: gli indirizzi sono cambiati con l\'ultimo aggiornamento.')
        : t('addr.noBroker','Non sono riuscito nemmeno a far partire la chiamata: il servizio che vi fa incontrare non ha risposto. Se stai usando una copia dell\'app su un altro indirizzo, apri quella ufficiale.'), 'bad');
      return;
    }
    const rid = hex(crypto.getRandomValues(new Uint8Array(8)));
    stopQuickPump();
    pc = await newPeerConnection();
    myPc = pc;
    quickSharePc = null;   /* whatever invite was on hold, this call supersedes it */
    wireDataChannel(myPc.createDataChannel('logos-modifica'));
    const pump = candidatePump(myPc, sec, 'ac', 'ab');
    quickPump = pump;
    const offer = await myPc.createOffer();
    await myPc.setLocalDescription(offer);
    if (pc !== myPc){ pump.stop(); return; }   /* superseded during the awaits above */
    /* our own address travels with it: it is what lets the other side turn a
       nuisance away for good, and it is theirs to check the same way */
    const published = await mailboxPutSealed(await slotId(sec.seed, 'addr-offer'), sec,
      { sdp: myPc.localDescription.sdp, nick: myNick(), rid, fp: await myFingerprintHex(), intro: outgoingIntro });
    /* Nothing was ever put anywhere for anyone to find. Waiting three minutes
       and then saying "non ha risposto" blames a person who was never rung —
       the commonest cause is this copy of the app being served from somewhere
       the meeting service does not answer for, and no amount of waiting fixes
       that. */
    if (!published && !brokerReachable){
      pump.stop();
      hideBigConnectingB(true);
      showScreen('screenHome');
      setStatus($('addrDialStatus'), t('addr.noBroker','Non sono riuscito nemmeno a far partire la chiamata: il servizio che vi fa incontrare non ha risposto. Se stai usando una copia dell\'app su un altro indirizzo, apri quella ufficiale.'), 'bad');
      return;
    }

    /* whoever owns this address left word on how to be woken. Read with the
       address-derived key rather than the ECDH one, and deliberately: it was
       written before any caller existed, so it could not have been sealed to
       this one. See addrWakeSecrets for what that does and does not expose. */
    const wakeSec = await addrWakeSecrets(addr);
    const wake = await wakeGetSealed(await slotId(wakeSec.seed, 'addr-wake'), wakeSec);
    if (wake && wake.push) knockEndpoint(wake.push.endpoint);

    /* proven further down, the moment a reply actually opens under the secret
       only this address's private half could derive */
    dialedAddress = addr;

    const answerKey = await slotId(sec.seed, 'addr-answer-' + rid);
    const offerKey = await slotId(sec.seed, 'addr-offer');
    const until = Date.now() + 180000;
    /* The mailbox holds anything for two minutes, and someone whose phone was
       just buzzed takes longer than that to fish it out of a pocket. Without
       this the offer would quietly rot at the two-minute mark while the caller
       sat watching a spinner for a third minute — reachable in theory, never
       in practice. So it is written again before it lapses, for as long as
       this side is still waiting. */
    let nextRefresh = Date.now() + 80000;
    let got = null;
    while (Date.now() < until){
      if (!$('screenChat').classList.contains('hide')) return;
      /* something else took the connection over — accepting an incoming call,
         or a new invite started from the home screen. Carrying on would set
         this call's answer onto *their* connection and break both. */
      if (pc !== myPc){ pump.stop(); return; }
      got = await mailboxGetSealed(answerKey, sec);
      if (got && got.sdp) break;
      if (pc !== myPc){ pump.stop(); return; }   /* superseded while waiting on the mailbox */
      if (Date.now() >= nextRefresh){
        await mailboxPutSealed(offerKey, sec,
          { sdp: myPc.localDescription.sdp, nick: myNick(), rid, fp: await myFingerprintHex(), intro: outgoingIntro });
        nextRefresh = Date.now() + 80000;
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    if (!got || !got.sdp){
      dialedAddress = null; dialedSlot = 0;
      pump.stop();
      hideBigConnectingB(true);
      showScreen('screenHome');
      setStatus($('addrDialStatus'), t('addr.noAnswer','Non ha risposto. L\'ho avvisata: riprova più tardi.'), 'bad');
      /* Left automatically, with whatever was already typed on the way in —
         so a call that nobody happened to answer within three minutes still
         leaves a trace, instead of vanishing the moment somebody closes this
         screen without a second thought. The panel below still offers to add
         more, but reaching the other person no longer depends on it. */
      leaveMissedCallNote(addr);
      offerToLeaveLetter(addr);
      return;
    }
    resetBigConnectingText('B');
    /* The reply came back and it opened. Nothing but the private half behind
       this address's published key could have produced a secret that opens it,
       and the address is a hash of that key — so this is the moment the address
       is proven, and it is the only place this flag is ever set.
       Cannot be a reply we made ourselves: the slot it arrived in is named from
       `rid`, sixty-four random bits that only ever travelled inside the sealed
       offer, so nobody who could not open that offer could find this slot. */
    dialedAddrProven = true;
    dialedSlot = sec.slot | 0;   /* known from the verified record, not taken on trust from the reply */
    await myPc.setRemoteDescription({ type:'answer', sdp: got.sdp });
    await pump.remoteReady();
    if (pc !== myPc) return;   /* superseded during the awaits just above */
    watchHandshakeProgress(myPc, $('quickStatusB'), $('diagQuickB'), pump, ok => {
      if (!ok){ dialedAddress = null; dialedSlot = 0; dialedAddrProven = false; hideBigConnectingB(true); }
    });
  }catch(e){
    dialedAddress = null; dialedSlot = 0; dialedAddrProven = false;
    hideBigConnectingB(true);
    showScreen('screenHome');
    setStatus($('addrDialStatus'), t('addr.dialFailed','Non sono riuscito a chiamare questo indirizzo.'), 'bad');
  } finally {
    /* whatever happened, this side has stopped dialling — leaving it set would
       keep the address deaf for good */
    dialing = false;
  }
}

/* ---------------- the address card ---------------- */
/* ---------------- letters waiting ---------------- */
async function collectLetters(){
  const slots = activeSlots();
  if (!slots.length) return;
  let kept = storedLetters(), changed = false;
  for (const n of slots){
    const addr = await myAddress(n);
    if (!addr) continue;
    for (const l of await letterGet(addr)){
      kept.push({
        id: hex(crypto.getRandomValues(new Uint8Array(6))),
        nick: (l.nick || '').toString().slice(0, 30),
        text: (l.text || '').toString().slice(0, 300),
        from: typeof l.from === 'string' ? parseAddress(l.from) : null,
        slot: n,
        at: Date.now(),
      });
      changed = true;
    }
  }
  if (changed){ saveLetters(kept); renderLetters(); }
}

function renderLetters(){
  const all = storedLetters();
  const box = $('lettersCard'), list = $('lettersList');
  box.classList.toggle('hide', !all.length);
  list.innerHTML = '';
  for (const l of all.slice().reverse()){
    const row = document.createElement('div');
    row.className = 'letterrow';

    const top = document.createElement('div');
    top.className = 'top';
    const nm = document.createElement('b');
    nm.textContent = l.nick || t('chat.someone','Qualcuno');
    const when = document.createElement('time');
    when.textContent = relTime(l.at);
    top.appendChild(nm); top.appendChild(when);

    const p = document.createElement('p');
    p.textContent = l.text;

    const acts = document.createElement('div');
    acts.className = 'acts';
    if (l.from){
      const back = document.createElement('button');
      back.className = 'go';
      back.textContent = t('letter.callBack','Richiama');
      back.addEventListener('click', () => { dropLetter(l.id); renderLetters(); showKnockCard(l.from); });
      acts.appendChild(back);
    }
    const del = document.createElement('button');
    del.textContent = t('letter.dismiss','Fatto');
    del.addEventListener('click', () => { dropLetter(l.id); renderLetters(); });
    acts.appendChild(del);

    row.appendChild(top); row.appendChild(p); row.appendChild(acts);
    list.appendChild(row);
  }
}

/* ---------------- the trace a missed call leaves on its own ----------------
   Reaching this point used to depend entirely on somebody choosing, a second
   time, to write something down — and closing the panel without a thought,
   which is the easiest thing in the world to do after three minutes of
   watching a spinner, meant the person who was called never learned anyone
   had tried. Nothing new is asked of the caller: the name and the reason were
   already typed once, on the knock card, before the call ever went out. */
async function leaveMissedCallNote(addr){
  try{
    const text = (outgoingIntro || '').trim().slice(0, 300) || t('letter.missed','Voleva parlarti.');
    const mine = addrOn() ? await myAddress(0) : null;
    await letterPut(addr, { nick: myNick(), text, from: mine });
  }catch(e){}   /* best effort: a failed background note should not block the panel below */
}

/* ---------------- leaving one ---------------- */
let letterTarget = null;
function offerToLeaveLetter(addr){
  letterTarget = addr;
  $('letterText').value = outgoingIntro || '';
  setStatus($('letterStatus'), '');
  $('leaveLetter').classList.remove('hide');
  $('leaveLetter').scrollIntoView({ block: 'center', behavior: 'smooth' });
}
$('btnLeaveCancel').addEventListener('click', () => {
  $('leaveLetter').classList.add('hide'); letterTarget = null;
});
$('btnLeaveLetter').addEventListener('click', async () => {
  const text = $('letterText').value.trim().slice(0, 300);
  if (!text || !letterTarget){
    setStatus($('letterStatus'), t('letter.needText','Scrivi due parole, così sa cosa volevi.'), 'bad');
    return;
  }
  $('btnLeaveLetter').disabled = true;
  setStatus($('letterStatus'), t('lock.working','…'));
  /* our own address travels with it only if we actually have one switched on:
     without it there is nowhere to answer, and promising a reply that cannot
     come would be worse than saying nothing */
  const mine = addrOn() ? await myAddress(0) : null;
  const ok = await letterPut(letterTarget, { nick: myNick(), text, from: mine });
  $('btnLeaveLetter').disabled = false;
  if (ok){
    $('leaveLetter').classList.add('hide');
    letterTarget = null; outgoingIntro = '';
    toast(t('letter.left','Messaggio lasciato. Lo troverà appena apre l\'app.'));
  } else {
    setStatus($('letterStatus'), t('letter.failed','Non sono riuscito a lasciare il messaggio. Riprova.'), 'bad');
  }
});

async function renderBurners(){
  const list = $('burnerList');
  list.innerHTML = '';
  for (const b of burners()){
    const addr = await myAddress(b.n);
    const row = document.createElement('div');
    row.className = 'burnerrow';

    const who = document.createElement('div');
    who.className = 'who';
    const nm = document.createElement('b');
    nm.textContent = b.name || t('burn.untitled','Senza nome');
    const cd = document.createElement('code');
    cd.textContent = formatAddress(addr);
    who.appendChild(nm); who.appendChild(cd);

    const send = document.createElement('button');
    send.textContent = '📤';
    send.title = t('burn.send','Manda questo indirizzo');
    send.addEventListener('click', async () => {
      const text = fill(t('addr.shareText',''), { a: formatAddress(addr) }).replace('{a}', formatAddress(addr))
                 + '\n' + addrLink(addr);
      try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
      await copyOrSelect(text, cd);
    });

    const kill = document.createElement('button');
    kill.className = 'kill';
    kill.textContent = '🗑';
    kill.title = t('burn.delete','Cancella');
    kill.addEventListener('click', async () => {
      /* no confirmation dialog: this is the whole point of a burner, and the
         cost of an accidental tap is making a new one */
      removeBurner(b.n);
      await paintAddrCard();
      toast(fill(t('burn.deleted','«{name}» cancellato. Quell\'indirizzo non risponde più.'), { name: b.name || '' }));
    });

    row.appendChild(who); row.appendChild(send); row.appendChild(kill);
    list.appendChild(row);
  }
  const full = burners().length >= BURNER_MAX;
  $('btnBurnerAdd').disabled = full;
  $('burnerName').disabled = full;
  if (full) setStatus($('burnerStatus'), fill(t('burn.full','Puoi averne al massimo {n} insieme. Cancellane uno per farne un altro.'), { n: BURNER_MAX }));
  else setStatus($('burnerStatus'), '');
}

/* How many days until this device's own identity — and with it, the address
   derived from it — renews itself. Left unfixed on purpose (see myIdentity()):
   the app does not try to make the address last forever, only tells the truth
   about the year it actually lasts, before that becomes "nobody answers any
   more" instead of a sentence on this screen. */
async function addressDaysLeft(){
  const cert = await myIdentity();
  if (!cert || !cert.expires) return null;
  return Math.max(0, Math.ceil((cert.expires - Date.now()) / (24*3600*1000)));
}
const ADDR_RENEW_SOON_DAYS = 60;

async function paintAddrCard(){
  const on = addrOn();
  $('addrRow').classList.toggle('on', on);
  $('addrRow').setAttribute('aria-pressed', on ? 'true' : 'false');
  $('addrOn').classList.toggle('hide', !on);
  if (on){
    $('addrMine').textContent = formatAddress(await myAddress(0));
    /* an address nobody can ring while the app is shut is half an address, and
       saying so here is more use than discovering it later */
    $('addrReachNote').classList.toggle('hide', notifyPref());
    /* No countdown here any more, and this is a real change worth naming: the
       address used to be a hash of the DTLS certificate, which expires once a
       year, so it genuinely did renew itself and saying so was the honest thing
       to do. It is now a hash of an ECDH key that has no expiry, so the address
       does not change on its own at all — and repeating the old sentence would
       have turned a truth into a lie without a line of code being wrong.
       What can still take it away is losing the key: clearing the app's data,
       or uninstalling. That is what the line says now, because that is what is
       actually true. The yearly certificate rotation has not gone anywhere, but
       what it moves is the safety words, and it is reported where it belongs —
       in "Come sta l'app". */
    const life = $('addrLifespan');
    life.classList.remove('hide');
    life.classList.remove('warn');   /* nothing left to warn about: it does not expire */
    life.textContent = t('addr.lifespan','Questo indirizzo non scade. Resta valido finché i dati dell\'app restano su questo telefono.');
  } else {
    $('addrQr').classList.add('hide');
  }
  await renderBurners();
  /* burners answer whether or not the lasting address is switched on: someone
     may want to be reachable only through throwaways, which is a perfectly
     sensible thing to want */
  /* the key first, and unconditionally: without it published nobody can dial
     this device at all, whereas the wake slot only decides whether their call
     also rings a closed app */
  if (activeSlots().length){ publishAddrKeys(); publishAddress(); startAddrPolling(); collectLetters(); }
  else stopAddrPolling();
}
$('btnBurnerAdd').addEventListener('click', async () => {
  const name = $('burnerName').value.trim();
  if (!name){ setStatus($('burnerStatus'), t('burn.needName','Dagli un nome, così sai a chi l\'hai dato.'), 'bad'); return; }
  const rec = addBurner(name);
  if (!rec){ setStatus($('burnerStatus'), fill(t('burn.full',''), { n: BURNER_MAX }), 'bad'); return; }
  $('burnerName').value = '';
  await paintAddrCard();
  toast(fill(t('burn.made','«{name}» creato. Ora puoi darlo a chi vuoi.'), { name: rec.name }));
});
$('burnerName').addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); $('btnBurnerAdd').click(); }
});
$('addrRow').addEventListener('click', async () => {
  const on = !$('addrRow').classList.contains('on');
  setAddrOn(on);
  await paintAddrCard();
});
$('addrRow').addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); $('addrRow').click(); }
});
$('btnAddrShare').addEventListener('click', async () => {
  const addr = await myAddress();
  const text = t('addr.shareText','Puoi cercarmi qui, senza il mio numero di telefono. Il mio indirizzo su DigitalValut Logos è {a}\n\nTocca per chiamarmi:').replace('{a}', formatAddress(addr)) + '\n' + addrLink(addr);
  try{ if (navigator.share){ await navigator.share({ title: 'DigitalValut Logos', text }); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  await copyOrSelect(text, $('addrMine'));
});
$('btnAddrQr').addEventListener('click', async () => {
  const box = $('addrQr');
  if (!box.classList.contains('hide')){ box.classList.add('hide'); return; }
  const m = qrMatrix(addrLink(await myAddress()));
  if (!m) return;
  const size = m.length, quiet = 4, scale = 4;
  const cv = $('addrQrCanvas');
  cv.width = cv.height = (size + quiet * 2) * scale;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#000';
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (m[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
  box.classList.remove('hide');
});
/* typed by hand or tapped from a link, the same screen comes first: the far
   end deserves to know who is ringing either way */
$('btnAddrDial').addEventListener('click', () => {
  const a = parseAddress($('addrDialIn').value);
  if (!a){ setStatus($('addrDialStatus'), t('addr.badFormat',''), 'bad'); return; }
  setStatus($('addrDialStatus'), '');
  showKnockCard(a);
});
$('addrDialIn').addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); $('btnAddrDial').click(); }
});
$('btnAddrAccept').addEventListener('click', acceptAddrCall);
$('btnAddrIgnore').addEventListener('click', () => {
  /* turned away for good: an address given out publicly is one a nuisance can
     hold too, and "ignore" that only lasts a minute is not a defence */
  if (addrPending && addrPending.msg) blockFp(addrPending.msg.fp);
  addrPending = null;
  $('addrIncoming').classList.add('hide');
});

/* ============================== how the app is doing ==============================
   A bug once left this device unreachable by every route at once — the address
   and the contact list both — and stayed invisible for days, because nothing
   anywhere on any screen said so. The only symptom was other people saying
   "non ti trovo", which is the one symptom the person affected cannot see.
   So the app now answers, in the same plain words as everything else: can
   people reach you right now, and if not, what do you do about it. Every
   check here is measured, never assumed — and where it genuinely cannot be
   known (a microphone nobody has asked for yet) it says that instead of
   guessing. */
const APP_VERSION = 'logos-modifica-3.52';

/* what is *actually* running, not what this file thinks should be: the page is
   fetched network-first so the code is always current, but the cached shell
   behind it may not be, and that gap is the oldest trap in this project */
async function swVersion(){
  try{
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return null;
    return await new Promise(res => {
      const ch = new MessageChannel();
      const bail = setTimeout(() => res(null), 1500);
      ch.port1.onmessage = e => { clearTimeout(bail); res(e.data); };
      navigator.serviceWorker.controller.postMessage({ type: 'version' }, [ch.port2]);
    });
  }catch(e){ return null; }
}

async function brokerAlive(){
  /* asked before the network is touched: a copy served from anywhere else is
     refused by the Worker outright, and no amount of retrying changes it */
  if (SERVICE_ORIGINS.indexOf(location.origin) < 0) return 'origin';
  try{
    /* any answer at all means it is there — a 404 on an empty slot is the
       healthy case, and even a "too many requests" proves it is alive */
    await Promise.race([
      fetch(MAILBOX_BASE + '0'.repeat(64), { method: 'GET', cache: 'no-store' }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 6000)),
    ]);
    return 'ok';
  }catch(e){ return 'bad'; }
}

async function micHealth(){
  try{
    if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
    const st = await navigator.permissions.query({ name: 'microphone' });
    return st.state === 'granted' ? 'ok' : st.state === 'denied' ? 'bad' : 'unknown';
  }catch(e){ return 'unknown'; }   /* several browsers refuse the question entirely */
}

function reachableWhenClosed(){
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone) return 'ios';
  if (typeof Notification === 'undefined') return 'off';
  if (Notification.permission === 'denied') return 'denied';
  if (!notifyPref() || Notification.permission !== 'granted') return 'off';
  return 'ok';
}

let healthRows = [];
async function runHealth(){
  const list = $('healthList');
  if (!list) return;
  list.textContent = t('health.checking', 'Sto controllando…');

  const rows = [];
  /* 1 — the address */
  if (!activeSlots().length) rows.push(['off', t('health.addr'), t('health.addrOff')]);
  else if (busyWithSomeone()) rows.push(['warn', t('health.addr'), t('health.busy')]);
  else if (!addrPollTimer) rows.push(['bad', t('health.addr'), t('health.stopped')]);
  else {
    /* Listening is only half of being reachable, and the half this row used to
       check on its own. The other half is new: an address is a hash of a key,
       and it can only be dialled if that key actually reached the Worker. If
       the write failed — no connection at the moment the app opened, a request
       limit hit — then the address is on, the polling is running, this row was
       green, and not one person on earth could call you. Exactly the silent
       fault this card exists to catch, so it is asked the only way that means
       anything: fetch the key back and check it is really the one this address
       belongs to.
       Deliberately the same row rather than a second one. Two lines answering
       "can people reach me?" with half an answer each is how a person ends up
       reading neither. */
    rows.push(await addrKeysPublished()
      ? ['ok', t('health.addr'), t('health.addrOk')]
      : ['bad', t('health.addr'), t('health.addrKeyBad','Non ti possono raggiungere: questo telefono non è riuscito a pubblicare la chiave su cui è costruito il suo indirizzo. Controlla la connessione e riapri l\'app.')]);
  }

  /* 1b — the yearly certificate rotation, reported for what it actually moves.
     It has nothing to do with the address any more (see paintAddrCard), but it
     does change the three safety words, and a contact who has compared them
     before will be shown "this person is not the same any more" — which now
     blocks sending until they compare again. Worth a warning in advance rather
     than a fright on the day. */
  if (activeSlots().length || loadContacts().some(c => c.fp)){
    const days = await addressDaysLeft();
    if (days !== null){
      rows.push(days <= ADDR_RENEW_SOON_DAYS
        ? ['warn', t('health.addrLife'), fill(t('health.addrLifeSoon','Fra circa {n} giorni cambieranno da sole.'), { n: days })]
        : ['ok', t('health.addrLife'), fill(t('health.addrLifeOk','Stabili per altri {n} giorni circa.'), { n: days })]);
    }
  }

  /* 1d — the phone refusing to store anything, which until now failed in
     complete silence: the history simply stopped being kept */
  if (historyBroken) rows.push(['bad', t('health.storage'), t('health.storageFull')]);

  /* 2 — people already known */
  const known = loadContacts().filter(c => c.fp).length;
  if (!known) rows.push(['off', t('health.contacts'), t('health.contactsNone')]);
  else if (busyWithSomeone()) rows.push(['warn', t('health.contacts'), t('health.busy')]);
  else if (!inboxTimer) rows.push(['bad', t('health.contacts'), t('health.stopped')]);
  else rows.push(['ok', t('health.contacts'), t('health.contactsOk')]);

  /* 3 — the thing that introduces two people */
  const broker = await brokerAlive();
  rows.push(broker === 'ok' ? ['ok', t('health.broker'), t('health.brokerOk')]
          : broker === 'origin' ? ['bad', t('health.broker'), t('health.brokerOrigin')]
          : ['bad', t('health.broker'), t('health.brokerBad')]);

  /* 4 — with the app shut */
  const closed = reachableWhenClosed();
  rows.push(closed === 'ok' ? ['ok', t('health.closed'), t('health.closedOk')]
          : closed === 'ios' ? ['warn', t('health.closed'), t('health.closedIos')]
          : closed === 'denied' ? ['bad', t('health.closed'), t('health.closedDenied')]
          : ['warn', t('health.closed'), t('health.closedOff')]);

  /* 5 — being able to speak */
  const mic = await micHealth();
  rows.push(mic === 'ok' ? ['ok', t('health.mic'), t('health.micOk')]
          : mic === 'bad' ? ['bad', t('health.mic'), t('health.micBad')]
          : ['off', t('health.mic'), t('health.micUnknown')]);

  /* 6 — is the copy running actually the current one */
  const running = await swVersion();
  rows.push(!running ? ['off', t('health.version'), APP_VERSION]
          : running === APP_VERSION ? ['ok', t('health.version'), APP_VERSION]
          : ['warn', t('health.version'), t('health.versionOld')]);

  healthRows = rows;
  list.textContent = '';
  for (const [state, title, detail] of rows){
    const row = document.createElement('div');
    row.className = 'healthrow' + (state === 'bad' ? ' bad' : '');
    const dot = document.createElement('div');
    dot.className = 'healthdot' + (state === 'off' ? '' : ' ' + state);
    const box = document.createElement('div');
    box.className = 'ht';
    const name = document.createElement('b');
    name.textContent = title;
    const why = document.createElement('span');
    why.textContent = detail;
    box.appendChild(name); box.appendChild(why);
    row.appendChild(dot); row.appendChild(box);
    list.appendChild(row);
  }
}

/* Something a person can paste into a message when they ask for help, so the
   answer does not have to start with ten questions. Deliberately carries
   nothing about who they talk to: no addresses, no names, no contacts —
   only whether each part of the machinery is working. */
function healthReport(){
  const lines = ['DigitalValut Logos — ' + APP_VERSION, location.origin, navigator.userAgent, ''];
  for (const [state, title, detail] of healthRows) lines.push('[' + state + '] ' + title + ' — ' + detail);
  return lines.join('\n');
}

$('btnHealthCheck').addEventListener('click', runHealth);
$('btnHealthCopy').addEventListener('click', async () => {
  await copyOrSelect(healthReport(), $('healthList'));
  toast(t('health.copied', 'Resoconto copiato.'));
});

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
  /* used instead of the global for the rest of this attempt: everything below
     waits, and whatever the person does meanwhile replaces the global */
  const myPc = pc;
  wireDataChannel(myPc.createDataChannel('logos-modifica'));
  /* same trickle exchange as the short code above, and for the same reason:
     waiting for gathering to finish before speaking made one side declare
     failure while the other was already connected. The key comes from the two
     fingerprints, which both sides already hold and nobody else knows, so this
     path is encrypted too — the relay never sees these addresses either. */
  const sec = await pairSecrets(myFp + ':' + contact.fp);
  const pump = candidatePump(myPc, sec, 'a', 'b');
  quickPump = pump;
  const offer = await myPc.createOffer();
  await myPc.setLocalDescription(offer);
  if (pc !== myPc){ pump.stop(); return; }   /* superseded while we waited */

  /* the announcement slot stays derived from the plain fingerprints: the other
     side has to be able to find it while only knowing who might call, before it
     has any key material for this particular attempt */
  const outKey = await pairKey(myFp, contact.fp);
  const inKey = await pairKey(contact.fp, myFp);
  const sent = await mailboxPutSealed(outKey, sec, { nick: myNick(), sdp: myPc.localDescription.sdp });
  /* does nothing if this contact never shared a subscription, or shared one
     before notifications existed — silently a no-op, same as it always was */
  sendKnock(contact);

  if (sent){
    /* The other side has to be sitting on the home screen for its own poll to
       notice this, answer it, and get that answer back here — so this waits
       well past the handshake itself before deciding nobody is there. The
       mailbox holds a message for two minutes, comfortably longer. */
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline){
      /* both conditions: the connection closing, and something else having
         taken the global over — the second is invisible to the first */
      if (pc !== myPc || myPc.signalingState === 'closed'){ pump.stop(); return; }
      const msg = await mailboxGetSealed(inKey, sec);
      if (msg && msg.sdp){
        if (pc !== myPc){ pump.stop(); return; }
        await myPc.setRemoteDescription({ type:'answer', sdp: msg.sdp });
        await pump.remoteReady();
        /* re-enabled only once the handshake actually settles — see the note
           on watchHandshakeProgress; enabling it the instant an answer was
           found, while the connection itself was still several seconds from
           done, was the same bug as the quick-connect button */
        showBigConnectingA();
        watchHandshakeProgress(myPc, $('statusA'), $('diagA'), pump, ok => {
          $('btnCreate').disabled = false;
          if (!ok) hideBigConnectingA(false);
        });
        return;
      }
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  /* not reachable right now — fall back to an ordinary invite, built from the exact same
     offer already sitting in `pc`, so nothing is wasted. By now gathering has long
     finished, so the description carries every address it ever found. */
  pump.stop();
  if (pc !== myPc || myPc.signalingState === 'closed') return;
  setStatus($('statusA'), fill(t('reconnect.offline','{n} non sembra online in questo momento. Ecco il codice da mandare a mano.'), { n: contact.nick }), 'bad');
  const code = await sealOrEncodeOffer(myPc);
  revealInviteCode(code);
  if (await robustCopy(code)) toast(t('toast.sealCopied'));
  $('btnCreate').disabled = false;
}

/* Whether any known contact is trying to reach this device right now.
   This used to say `if (pc) return` and to run only while the home screen was
   showing — the identical mistake made for addresses, written out a second
   time here. Both together meant a person could be sitting with the app open,
   looking at their own settings, with an invite quietly resumed in the
   background, and be unreachable by every route at once while the screen said
   nothing at all. Same question as the address, asked in the same place. */
async function checkInboxOnce(){
  if (busyWithSomeone()) return;
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
  if (inboxTimer || document.visibilityState === 'hidden') return;
  inboxTimer = setInterval(checkInboxOnce, 4000);
  checkInboxOnce();
}
function stopInboxPolling(){
  clearInterval(inboxTimer);
  inboxTimer = null;
}
async function acceptIncomingAutoOffer(contact, msg, sec){
  /* This used to stop the polling outright to keep itself from being entered
     twice. That worked, but any failure below then left the timer switched off
     for good and this device silently unreachable until the next navigation —
     the same silent deafness, arrived at from a different direction. A flag
     stops the second entry; nothing stops the listening. */
  if (autoAccepting) return;
  autoAccepting = true;
  let myPc = null;
  try{
    stopQuickPump();
    const myFp = await myFingerprintHex();
    pc = await newPeerConnection();
    /* held locally and used instead of the global for the rest of this: the
       waits below give anything the person does time to replace it */
    myPc = pc;
    quickSharePc = null;   /* a contact getting through supersedes a waiting invite */
    myPc.ondatachannel = ev => wireDataChannel(ev.channel);
    /* the key both sides derive independently from the caller's fingerprint then
       the callee's — here `contact.fp` is the caller and `myFp` is us */
    const pump = candidatePump(myPc, sec, 'b', 'a');
    quickPump = pump;
    await myPc.setRemoteDescription({ type:'offer', sdp: msg.sdp });
    await pump.remoteReady();
    const answer = await myPc.createAnswer();
    await myPc.setLocalDescription(answer);
    if (pc !== myPc){ pump.stop(); return; }   /* superseded while we waited */
    const outKey = await pairKey(myFp, contact.fp);
    /* answered at once, so the other side stops knocking at a door we have not opened */
    const sent = await mailboxPutSealed(outKey, sec, { sdp: myPc.localDescription.sdp });
    if (!sent){
      /* proceeding here left the caller waiting on a reply that had never
         left this device — silent until their own long timeout finally gave
         up. This side can say so right away instead. */
      pump.stop();
      if (pc === myPc){ try{ pc.close(); }catch(_){} pc = null; }
      setStatus($('statusA'), t('broker.down','Il servizio che vi fa incontrare non risponde. Il codice lungo qui sotto funziona lo stesso: non passa da nessun server.'), 'bad');
      return;
    }
    watchHandshakeProgress(myPc, $('statusA'), $('diagA'), pump);
    /* the data channel opening (wired above via wireDataChannel) takes it from here: enterChat() */
  }catch(e){
    /* a half-built connection left in the global would read as "busy" forever
       and close this device off to everyone */
    if (pc === myPc){ try{ pc.close(); }catch(_){} pc = null; }
  } finally { autoAccepting = false; }
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
  /* back to the ordinary state in case a contact reconnect hid these last */
  $('manualInviteCard').classList.remove('hide');
  $('pasteAnswerForm').classList.remove('hide');
}
/* Reconnecting to somebody already in the address book reuses this screen's
   status line — the same measurement, "provo a ricollegarmi", the caller
   already trusts — but showed the rest of it too: a passphrase toggle, a
   "prepare the invite" button, a box to paste a code that was never going to
   arrive. All of it looked like something to do, while the real work was
   already happening quietly underneath. Nothing here is created new, so
   nothing here is shown. */
function showContactReconnectLayout(){
  $('quickStartCard').classList.add('hide');
  $('toggleLongInviteA').classList.add('hide');
  $('longInviteWrapA').classList.remove('hide');
  $('manualInviteCard').classList.add('hide');
  $('pasteAnswerCard').classList.remove('hide');
  $('pasteAnswerForm').classList.add('hide');
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

/* ---------------- "connecting", shown so it cannot be missed ----------------
   Found on a real device: someone opening an invite still saw the ordinary
   code box and Connetti button sitting right there while the handshake ran
   underneath — nothing wrong was happening, but a button that just sits there
   reads as "stuck", and a nervous tap is a natural response to that. This
   replaces the whole form with one big, unambiguous state for exactly as long
   as a connection attempt is actually running, on both sides, everywhere one
   can start: the short code, the long code, and reconnecting to a contact. */
/* The same big card says two different things depending on what is actually
   happening — "hold on, this is connecting" and "I have rung them, they are not
   here yet" are very different waits, and a wait you understand is bearable. */
function setBigConnectingText(side, title, hint){
  $('bigTitle' + side).textContent = title;
  $('bigHint' + side).textContent = hint;
}
function resetBigConnectingText(side){
  setBigConnectingText(side,
    t('connect.bigTitle','Connessione in corso…'),
    t('connect.bigHint','Non chiudere l\'app — ci vogliono pochi secondi.'));
}
function showBigConnectingA(){
  resetBigConnectingText('A');
  $('quickStartCard').classList.add('hide');
  $('longInviteWrapA').classList.add('hide');
  $('toggleLongInviteA').classList.add('hide');
  $('bigConnectingA').classList.remove('hide');
}
function hideBigConnectingA(restoreQuick){
  $('bigConnectingA').classList.add('hide');
  if (restoreQuick) showQuickLayoutA(); else showLongLayoutA();
}
function showBigConnectingB(){
  resetBigConnectingText('B');
  $('quickJoinCard').classList.add('hide');
  $('longInviteWrapB').classList.add('hide');
  $('toggleLongInviteB').classList.add('hide');
  $('bigConnectingB').classList.remove('hide');
}
function hideBigConnectingB(restoreQuick){
  $('bigConnectingB').classList.add('hide');
  if (restoreQuick) showQuickLayoutB(); else showLongLayoutB();
}

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

/* `existingCode` puts a specific invite back on the air instead of minting a new
   one — used when someone has been rung about an invite they left out there, and
   the code in that person's hands has to keep working.
   `quiet` means "do this in the background": the app was opened for some other
   reason and there is no need to drag anyone to the invite screen unless it turns
   out somebody is genuinely waiting at the other end. */
let sharing = false;
async function startQuickShare(existingCode, quiet){
  /* Two of these running at once means two codes published and only the second
     one listened to — so a code shown on screen, or already photographed off a
     QR, could belong to the attempt that has quietly been abandoned. Cheap to
     prevent, and impossible to debug from the outside if it happens. */
  if (sharing && !existingCode) return;
  sharing = true;
  try{
  stopQuickPump();
  const code = existingCode || makeQuickCode();
  $('quickCodeOut').textContent = formatQuickCode(code);
  paintQr(code).catch(()=>{}); /* the QR is a convenience: never hold the invite up for it */
  $('btnRetryQuickA').classList.add('hide');
  /* both start from "this invite dies with the screen" and are corrected below
     only once the app has confirmed it really can ring for this person */
  $('inviteWaitsNote').classList.add('hide');
  $('quickHelpA').textContent = t('quick.helpA');
  setStatus($('quickStatusA'), t('quick.waiting','In attesa che l\'altra persona digiti il codice…'));

  /* Started here rather than where its result is first needed. Stretching the
     code is 100,000 rounds of PBKDF2 — a few hundred milliseconds on a laptop,
     one to two seconds on a cheap phone — and it needs nothing but the code
     itself. Run in sequence it sat in front of building the connection, which
     is a network round trip for the relay credentials and needs nothing from
     the stretch either, so the person watching paid for both end to end. Now
     they overlap and the pair costs whichever is slower. Identical work and
     identical iterations: nothing is weakened to buy the time. */
  const secReady = quickSecrets(code);
  secReady.catch(()=>{});   /* awaited below; this only silences the unhandled-rejection warning if the setup throws first */
  pc = await newPeerConnection();
  /* Every operation below targets this, the connection this call actually
     made, never the bare global — the guards further down catch most of the
     ways the global gets replaced from underneath, but every single one of
     them is followed by another await, which is one more chance for a guard
     to have already passed and the read to happen anyway. Reading `myPc`
     throughout means even a missed guard cannot mix two attempts together;
     at worst this attempt keeps talking to its own, now-abandoned
     connection, rather than silently completing someone else's. */
  const myPc = pc;
  /* marked as "an invite on hold" so being reachable at the address carries on
     regardless: this one waits fifteen minutes, and it used to take the
     address down with it for the whole of them */
  quickSharePc = myPc;
  wireDataChannel(myPc.createDataChannel('logos-modifica'));
  const sec = await secReady;
  if (pc !== myPc) return;
  const pump = candidatePump(myPc, sec, 'a', 'b');
  quickPump = pump;

  const offer = await myPc.createOffer();
  await myPc.setLocalDescription(offer);
  if (pc !== myPc){ pump.stop(); return; }

  const offerKey = await slotId(sec.seed, 'offer');
  const answerKey = await slotId(sec.seed, 'answer');
  /* published straight away, candidates or not — they follow on their own */
  const published = await mailboxPutSealed(offerKey, sec, { sdp: myPc.localDescription.sdp, nick: myNick() });
  if (!published && !brokerReachable){
    /* nothing to wait for: no code was ever put anywhere for anyone to find */
    pump.stop();
    clearPendingInvite();
    if (!quiet) brokerDownFallback('A');
    return;
  }

  /* the note that lets this invite outlive the screen it was made on, and the
     code itself so that opening the app again can resume this exact invite */
  savePendingInvite(code);
  publishWakeSlot(sec).then(ok => {
    if (quiet) return;
    $('inviteWaitsNote').classList.toggle('hide', !ok);
    /* "valid as long as you keep this screen open" stops being true the moment
       the invite can ring for itself, and two sentences contradicting each
       other on the same card are worse than either of them alone */
    $('quickHelpA').textContent = ok ? t('quick.helpAWaits') : t('quick.helpA');
  }).catch(()=>{});

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
    if (pc !== myPc){ pump.stop(); return; }   /* superseded while that was in flight */
    if (msg && msg.sdp){
      await myPc.setRemoteDescription({ type:'answer', sdp: msg.sdp });
      await pump.remoteReady();
      if (pc !== myPc){ pump.stop(); return; }   /* likewise, across these two */
      /* somebody answered — the code has done its job, so it and the share
         button give way to one clear "connecting" state instead of just
         sitting there looking like nothing happened */
      /* in the background case this is the moment it stops being background:
         someone is genuinely at the other end, so bring the screen with it */
      if (quiet && $('screenStart').classList.contains('hide')) showScreen('screenStart');
      quickSharePc = null;   /* no longer "on hold": this is a real connection now */
      showBigConnectingA();
      watchHandshakeProgress(myPc, $('quickStatusA'), $('diagQuickA'), pump, ok => {
        if (!ok) hideBigConnectingA(true);
      });
      return;
    }
    if (Date.now() >= nextRefresh){
      await mailboxPutSealed(offerKey, sec, { sdp: myPc.localDescription.sdp, nick: myNick() });
      nextRefresh = Date.now() + 80000;
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  pump.stop();
  if (pc !== myPc) return;
  /* nothing came of it: stop offering to resume an invite nobody took up, and
     say so only on a screen someone is actually looking at */
  if (readPendingInvite() && readPendingInvite().code === code) clearPendingInvite();
  if (quiet) return;
  if (connectionWorking(myPc)) return;   /* somebody did answer after all */
  setStatus($('quickStatusA'), t('quick.expired','Il codice è scaduto senza risposta. Generane uno nuovo.'), 'bad');
  $('btnRetryQuickA').classList.remove('hide');
  } finally { sharing = false; }
}
function quickLink(code){ return location.origin + location.pathname + '#q=' + code; }

/* ---------------- a QR held out in person is an authenticated channel ----------------
   Everything else here has to assume the invite travelled through something
   untrustworthy — WhatsApp, email, a scrap of paper — which is exactly why two
   people are asked to read three words to each other afterwards.
   A QR scanned off someone's screen while standing in front of them is different
   in kind: the bytes went from their phone to your camera and through nothing
   else. Nobody can substitute themselves in the middle of two metres of air.
   So the QR — and only the QR — carries the fingerprint of the certificate that
   phone will actually connect with. If what answers presents that same
   fingerprint, it is provably that phone, and the spoken check has nothing left
   to add. If it does not, that is not a hiccup: it is the one thing the spoken
   check exists to catch, and it is said loudly.
   Deliberately never added to the shared text link. A link arrives through a
   channel nobody can vouch for, and anyone able to tamper with the link could
   put their own fingerprint in it just as easily — auto-verifying that would
   turn a real check into a rubber stamp. */
const QR_FP_CHARS = 24; /* 96 bits of the fingerprint: far past forging, still a small QR */

/* Drawn on a card that stays white even in dark mode: a scanner needs that
   contrast, and a QR inverted to match a dark theme is one most cameras
   refuse to read. */
async function paintQr(code){
  const box = $('quickQr');
  const fp = await myFingerprintHex();
  const url = fp ? quickLink(code) + '&v=' + fp.slice(0, QR_FP_CHARS) : quickLink(code);
  const m = qrMatrix(url);
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
/* wrapped, not passed directly: the click event would otherwise arrive as the
   code to resume, and the app would try to put an Event object on the air */
$('btnRetryQuickA').addEventListener('click', () => startQuickShare());

/* A keyboard set to Arabic, Urdu, Hindi or Bengali often types its own digits
   by default — ٠-٩, ۰-۹ or ०-९ or ০-৯ — not 0-9. Those never matched \D and
   were silently dropped, so someone reading six digits aloud in their own
   script could type all six and watch the box stay stubbornly not-quite-full
   with no explanation why. Normalised to ASCII before anything else touches
   the code, so every script types the same six digits. */
function normalizeDigits(s){
  return String(s).replace(/[٠-٩۰-۹०-९০-৯]/g, ch => {
    const cp = ch.codePointAt(0);
    if (cp >= 0x0660 && cp <= 0x0669) return String(cp - 0x0660); // Arabic-Indic
    if (cp >= 0x06F0 && cp <= 0x06F9) return String(cp - 0x06F0); // Extended Arabic-Indic (Urdu/Persian)
    if (cp >= 0x0966 && cp <= 0x096F) return String(cp - 0x0966); // Devanagari (Hindi)
    if (cp >= 0x09E6 && cp <= 0x09EF) return String(cp - 0x09E6); // Bengali
    return ch;
  });
}

let quickConnecting = false;
async function tryQuickConnect(){
  const code = normalizeDigits($('quickCodeIn').value).replace(/\D/g,'').slice(0,6);
  if (code.length !== 6 || quickConnecting) return;
  /* a code is good for exactly one use — re-submitting the same one would only
     find an empty mailbox and tear down a connection that is already working */
  if (!$('screenChat').classList.contains('hide')) return;
  quickConnecting = true;
  $('btnQuickConnect').disabled = true;
  setStatus($('quickStatusB'), t('lock.working','…'));
  showBigConnectingB();
  /* Both started at once, before either is needed, for the same reason as on
     the side showing the code — except here the pay-off is bigger. Stretching
     the code blocked the first look at the mailbox, and building the
     connection then happened *after* the offer had already been found, which
     put a network round trip at the worst possible moment: the other phone is
     up, waiting, and this one goes off to fetch relay credentials. Now the
     connection is built and warm before it is asked for, and the stretch runs
     alongside it instead of in front of it. */
  const secReady = quickSecrets(code);
  const pcReady = newPeerConnection();
  secReady.catch(()=>{}); pcReady.catch(()=>{});
  /* held until it is either handed over to `pc` or closed: a connection warmed
     up for a code that turns out to be wrong must not be left open */
  let warmPc = null;
  try{
    const sec = await secReady;
    warmPc = await pcReady;
    const offerKey = await slotId(sec.seed, 'offer');
    const answerKey = await slotId(sec.seed, 'answer');

    /* Stretching the code costs the phone showing it a couple of seconds before
       it can publish anything, and someone reading that code off the screen in
       person can easily type it faster than that. Giving up on the first empty
       look would turn "you were quick" into "wrong code", so this keeps looking
       for a few seconds before saying so. */
    let msg = null;
    const lookUntil = Date.now() + 15000;
    /* The first few looks come quickly, then settle back. The offer normally
       appears within a second of the other phone finishing its own stretch, and
       a flat one-second gap threw most of that second away doing nothing at
       exactly the moment somebody is staring at the screen. This adds three
       extra lookups against a budget of three hundred a minute, so it cannot
       push a real connection into the rate limit it depends on. */
    const FIRST_LOOKS = [250, 350, 500, 700];
    let look = 0;
    for (;;){
      msg = await mailboxGetSealed(offerKey, sec);
      if (msg && msg.sdp) break;
      if (Date.now() >= lookUntil) break;
      const gap = look < FIRST_LOOKS.length ? FIRST_LOOKS[look++] : 1000;
      await new Promise(r => setTimeout(r, gap));
    }
    /* Nobody is sitting on the invite screen — which, for an invite sent over
       WhatsApp and read three hours later, is the normal case rather than the
       sad one. If whoever made it left word on how to be reached, ring them and
       keep the line open: they open the app, the invite goes back on the air on
       this very code, and the two connect without either having had to wait. */
    let knocked = false;
    if (!msg || !msg.sdp){
      const wake = await wakeGetSealed(await slotId(sec.seed, 'wake'), sec);
      if (wake && wake.push && wake.push.endpoint){
        knockEndpoint(wake.push.endpoint);
        knocked = true;
        setBigConnectingText('B',
          fill(t('wake.calling','Sto avvisando {name}…'), { name: wake.nick || t('chat.someone','Qualcuno') }),
          t('wake.callingHint','Ho fatto squillare il suo telefono. Appena apre l\'app siete connessi — puoi aspettare qui.'));
        const waitUntil = Date.now() + 180000;
        while (Date.now() < waitUntil){
          await new Promise(r => setTimeout(r, 1500));
          if (!$('screenChat').classList.contains('hide')){
            /* something else got there first — but leaving the flag set would
               disable the button until the page was reloaded */
            quickConnecting = false; $('btnQuickConnect').disabled = false;
            return;
          }
          msg = await mailboxGetSealed(offerKey, sec);
          if (msg && msg.sdp) break;
        }
      }
    }

    /* a wrong code and an expired one are indistinguishable here by design:
       without the right key nothing decrypts, so there is nothing to tell apart */
    if (!msg || !msg.sdp){
      quickConnecting = false;
      $('btnQuickConnect').disabled = false;
      /* Never over the top of a conversation that is already working. The
         mailbox is read-once, so a second look at a code that has already been
         spent finds nothing and looks exactly like a wrong one — which is how
         a phone came to announce a bad code while the other phone was in the
         chat. Nothing was wrong; the question was asked twice. */
      if (connectionWorking(pc)) return;
      /* the code was never the problem if there was nothing there to ask */
      if (!brokerReachable){ brokerDownFallback('B'); return; }
      hideBigConnectingB(true);
      setStatus($('quickStatusB'), knocked
        ? t('wake.noAnswer','L\'ho avvisata ma non ha ancora aperto l\'app. Riprova più tardi.')
        : t('quick.notFound','Codice scaduto o sbagliato. Controllalo con chi te l\'ha dato.'), 'bad');
      return;
    }
    /* back to the ordinary wording for the handshake that is about to run */
    resetBigConnectingText('B');
    stopQuickPump();
    /* The handshake starts here, not when the button was tapped. Everything up
       to this point was spent waiting for the other person to be there at all,
       and counting that would report a three-minute wake-up as a three-minute
       connection on the very card that says how fast it was. */
    connectStartedAt = Date.now();
    pc = warmPc;
    warmPc = null;   /* handed over: the cleanup below must not close it now */
    /* used instead of the global from here on: the waits below give anything
       the person does time to replace it underneath */
    const myPc = pc;
    myPc.ondatachannel = ev => wireDataChannel(ev.channel);
    const pump = candidatePump(myPc, sec, 'b', 'a');
    quickPump = pump;
    await myPc.setRemoteDescription({ type:'offer', sdp: msg.sdp });
    await pump.remoteReady();
    const answer = await myPc.createAnswer();
    await myPc.setLocalDescription(answer);
    if (pc !== myPc){ pump.stop(); return; }   /* superseded while we waited */
    /* sent immediately: the other side needs this before it will recognise us,
       and everything still being gathered follows behind it */
    await mailboxPutSealed(answerKey, sec, { sdp: myPc.localDescription.sdp, nick: myNick() });
    /* the button stays disabled for the whole handshake now, not just until
       the offer was found — see the note on watchHandshakeProgress for why
       re-enabling it any earlier was a real bug, not a style choice */
    watchHandshakeProgress(myPc, $('quickStatusB'), $('diagQuickB'), pump, ok => {
      quickConnecting = false;
      $('btnQuickConnect').disabled = false;
      if (!ok) hideBigConnectingB(true); /* on success the screen is about to change to the chat anyway */
    });
  }catch(e){
    quickConnecting = false;
    $('btnQuickConnect').disabled = false;
    if (connectionWorking(pc)) return;
    hideBigConnectingB(true);
  }finally{
    /* Every way out of here that never got as far as handing the warmed-up
       connection over — a wrong code, an expired one, a throw — closes it
       rather than leaving it holding a relay allocation nobody will use. */
    if (warmPc){ try{ warmPc.close(); }catch(e){} }
  }
}
$('btnQuickConnect').addEventListener('click', tryQuickConnect);
$('quickCodeIn').addEventListener('input', () => {
  const v = normalizeDigits($('quickCodeIn').value).replace(/\D/g,'').slice(0,6);
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
  return bub;   /* callers that only send text never look at this; a transfer
                   in progress needs it, to keep updating the same bubble
                   instead of one appearing per chunk */
}
/* A transfer bubble the caller can keep repainting as bytes move. Built from
   real nodes kept in hand, deliberately not from a string handed to innerHTML
   and re-found afterwards with an id or a selector — a bubble is exactly the
   kind of thing this app already renders through innerHTML, so a second
   element sharing an id with anything else on screen would silently become
   ambiguous. Holding the actual nodes has no such failure mode. */
function renderTransferBubble(name, size, mine){
  const row = document.createElement('div'); row.className = 'row ' + (mine ? 'me' : 'them');
  const bub = document.createElement('div'); bub.className = 'bub';
  const head = document.createElement('div'); head.className = 'xferrow';
  const icon = document.createElement('span'); icon.className = 'ic'; icon.innerHTML = svgIcon('attach','sm');
  const nameEl = document.createElement('span'); nameEl.className = 'xfername'; nameEl.textContent = name;
  head.appendChild(icon); head.appendChild(nameEl);
  const track = document.createElement('div'); track.className = 'xferbar';
  const bar = document.createElement('i'); bar.style.width = '0%';
  track.appendChild(bar);
  const meta = document.createElement('div'); meta.className = 'xfermeta';
  const totalTxt = humanSize(size);
  meta.textContent = fill(t('file.progress','{sent} di {total}'), { sent: humanSize(0), total: totalTxt });
  bub.appendChild(head); bub.appendChild(track); bub.appendChild(meta);
  row.appendChild(bub);
  $('msgs').appendChild(row);
  $('msgs').scrollTop = $('msgs').scrollHeight;
  let lastPaint = 0;
  return {
    bub,
    fail(text){ bub.innerHTML = '<span class="faintlink">'+esc(text)+'</span>'; },
    paint(sent, force){
      const now = Date.now();
      if (!force && now - lastPaint <= 120) return;
      lastPaint = now;
      bar.style.width = (size ? Math.floor(sent / size * 100) : 100) + '%';
      meta.textContent = fill(t('file.progress','{sent} di {total}'), { sent: humanSize(sent), total: totalTxt });
    },
    finish(html){ bub.innerHTML = html; },
  };
}
/* "1,3 MB", not "1372450 byte". Below 1 KB shown as plain bytes — a voice
   note or a tiny file never needs a decimal to be readable. */
function humanSize(n){
  if (n < 1024) return n + ' B';
  const units = ['KB','MB','GB'];
  let v = n / 1024, i = 0;
  while (v >= 1024 && i < units.length - 1){ v /= 1024; i++; }
  return v.toFixed(v < 10 ? 1 : 0).replace('.', ',') + ' ' + units[i];
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
  if (blockedBySafety()) return;
  dc.send(JSON.stringify({ type: 'text', text }));
  renderMsg(esc(text) + '<div class="meta">' + timeNow() + '</div>', true);
  $('msgInput').value = '';
}

/* The one case where the app should stand in the way rather than merely warn.
   "changed" means the person on the other end is not the device that was here
   last time — usually a new phone, sometimes exactly what somebody stepping
   into the middle would look like. The app already said so in words and then
   let the conversation carry on regardless, which made the warning decorative.
   First contact is different and stays advisory: there is nothing yet to
   contradict, and a check that blocks every first message would be dismissed
   every time. */
/* Every photo, video and file that crosses the chat gets a blob URL, and the
   browser keeps the whole blob alive for as long as that URL exists. Nothing
   ever released them, so a long conversation full of photos grew in memory
   until the tab was closed — on a phone, that is the tab dying.
   They cannot be released the moment they are made: the <img> on screen is
   still using it. They are released when the messages themselves go, which is
   the only moment nothing can be pointing at them any more. */
const liveObjectUrls = new Set();
function keepObjectUrl(url){ liveObjectUrls.add(url); return url; }
function releaseObjectUrls(){
  for (const u of liveObjectUrls){ try{ URL.revokeObjectURL(u); }catch(e){} }
  liveObjectUrls.clear();
}

function blockedBySafety(){
  if (safetyState !== 'changed') return false;
  $('sasPanel').classList.remove('hide');
  $('sasPanel').scrollIntoView({ block: 'center', behavior: 'smooth' });
  toast(t('sas.blocked','Prima dite le tre parole a voce: questa persona non risulta più la stessa.'));
  return true;
}

async function sendFile(file){
  if (!file || !dc || dc.readyState !== 'open') return;
  if (blockedBySafety()) return;
  const id = Math.random().toString(36).slice(2);
  /* A transfer used to render nothing at all until it finished — a 500MB
     video sat for two minutes with no sign of life on screen, indistinguishable
     from having silently died. The bubble now appears immediately, with a bar
     this same function keeps painting as chunks go out, and is only replaced
     with the real preview once the last one has actually left. */
  const xfer = renderTransferBubble(file.name, file.size, true);
  try{
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
      /* repainting on every 16KB chunk would be thousands of DOM writes for a
         large file; paint() throttles on its own, except on the very last
         chunk (forced) so the bar actually reaches 100% instead of stopping
         wherever the last throttled paint happened to land */
      xfer.paint(off, off === file.size);
    }
    dc.send(JSON.stringify({ type: 'file-end', id }));
  }catch(e){
    /* left in the chat rather than only a toast, which vanishes and leaves no
       trace of what happened to the file that was mid-transfer */
    xfer.fail(t('file.sendFailed','Invio interrotto: la connessione si è chiusa a metà.'));
    return;
  }
  const url = keepObjectUrl(URL.createObjectURL(file));
  const isImg = file.type.startsWith('image/'), isVid = file.type.startsWith('video/'), isAud = file.type.startsWith('audio/');
  const preview = isImg ? '<img src="'+url+'">' : isVid ? '<video src="'+url+'" controls></video>'
                : isAud ? '<audio src="'+url+'" controls></audio>'
                : '<a href="'+url+'" download="'+esc(file.name)+'" class="filelink">'+svgIcon('attach','sm')+esc(file.name)+' ↓</a>';
  const finalHtml = preview + '<div class="meta">' + timeNow() + '</div>';
  xfer.finish(finalHtml);
  saveToHistory(peerNick, finalHtml, true);
}
/* Selecting or dropping thirty files used to mean pressing the same button
   thirty times — the feature existed, but nobody would ever actually reach
   for it that way, so in practice it went unused. One at a time, in the order
   given: not because the channel couldn't take more at once, but because
   parallel transfers would mean several progress bars updating out of sync
   with none of them meaningfully readable, for no real gain — a single 16KB
   chunk in flight either way. */
async function sendFilesQueue(files){
  for (const f of files) await sendFile(f);
}

/* ---------------- share target: arriving from another app's "share" ----------------
   The service worker already pulled the real files out of the POST and left
   them in a scratch Cache — this only ever reads that cache back out, never
   the network request itself, so it works the same whether the share landed
   moments ago or the app was slow to boot. If nobody is connected yet the
   files just wait in memory; there is nowhere else for them to go without
   inventing storage this app has deliberately never had. */
let pendingSharedFiles = [];
async function checkForSharedFiles(){
  if (!/[?&]shared=1\b/.test(location.search)) return;
  try{ history.replaceState(null, '', location.pathname + location.hash); }catch(e){}
  if (!('caches' in window)) return;
  try{
    const cache = await caches.open('logos-modifica-share-temp');
    const keys = await cache.keys();
    for (const req of keys){
      if (req.url.indexOf('/__shared/') === -1) continue;
      const res = await cache.match(req);
      if (!res) continue;
      const blob = await res.blob();
      const name = decodeURIComponent(req.url.split('/').pop());
      const type = res.headers.get('Content-Type') || blob.type;
      pendingSharedFiles.push(new File([blob], name, { type }));
      await cache.delete(req);
    }
  }catch(e){}
  if (!pendingSharedFiles.length) return;
  if (dc && dc.readyState === 'open'){
    const files = pendingSharedFiles; pendingSharedFiles = [];
    sendFilesQueue(files);
  }else{
    toast(fill(t('share.pending','{n} file pronti da mandare — arrivano appena ti colleghi'), { n: pendingSharedFiles.length }));
  }
}
checkForSharedFiles();
$('btnAttach').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', () => {
  const files = Array.from($('fileInput').files);
  $('fileInput').value = '';
  if (files.length) sendFilesQueue(files);
});

/* ---------------- drag and drop, desktop only in practice ----------------
   A touch device raises no drag events at all, so this never has to ask
   whether it is one — nothing here fires on a phone regardless. Counted
   rather than toggled on enter/leave: the overlay is a sibling of #msgs, and
   dragging across the messages beneath it fires leave-then-enter on every
   pixel boundary between them, which without a counter flickers the overlay
   on and off continuously instead of holding it steady for the whole drag. */
let dragDepth = 0;
$('chatArea').addEventListener('dragenter', ev => {
  ev.preventDefault();
  dragDepth++;
  $('dropOverlay').classList.remove('hide');
});
$('chatArea').addEventListener('dragover', ev => ev.preventDefault());
$('chatArea').addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) $('dropOverlay').classList.add('hide');
});
$('chatArea').addEventListener('drop', ev => {
  ev.preventDefault();
  dragDepth = 0;
  $('dropOverlay').classList.add('hide');
  const files = Array.from(ev.dataTransfer.files || []);
  if (files.length) sendFilesQueue(files);
});

/* voice messages */
let mediaRecorder = null, recordedChunks = [];
$('btnMic').addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording'){ mediaRecorder.stop(); return; }
  let stream;
  try{ stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch(e){ showMediaHelp(e); return; }
  recordedChunks = [];
  const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
  mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  mediaRecorder.ondataavailable = ev => { if (ev.data.size > 0) recordedChunks.push(ev.data); };
  mediaRecorder.onstop = () => {
    stream.getTracks().forEach(tr => tr.stop());
    setIcon('btnMic','mic');
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
/* Generous for anything anybody actually sends by hand, and far below what it
   takes to exhaust a phone's memory. A real transfer never approaches either. */
const MAX_INCOMING_BYTES = 512 * 1024 * 1024;
const MAX_OPEN_TRANSFERS = 20;

function onDcMessage(ev){
  if (typeof ev.data === 'string'){
    let msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
    /* everything past this point is data from the other side, so treat it as
       untrusted: anything without a proper type is dropped rather than trusted
       to have the shape the branches below expect */
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'hello'){
      /* Someone turned away at the public address stays turned away. Checked
         against the fingerprint the handshake itself proved, not the name or
         the address they chose to claim — those are theirs to write. */
      if (typeof msg.fp === 'string' && isBlockedFp(msg.fp)){
        try{ dc.close(); }catch(e){}
        try{ pc.close(); }catch(e){}
        pc = null; dc = null;
        showScreen('screenHome');
        toast(t('addr.blockedIn','Chiamata da un contatto che avevi rifiutato: ignorata.'));
        return;
      }
      peerNick = (msg.nick || '').trim();
      if (peerNick){
        paintConnDot();
        $('peerNameLbl').textContent = peerNick;
        $('peerAvatar').textContent = initials(peerNick);
        loadHistoryFor(peerNick);
        touchContact(peerNick, typeof msg.fp === 'string' ? msg.fp : null, sanitizePushSub(msg.push));
        sysLine(peerNick + ' ' + t('call.joined'));
        hadRealChat = true; /* someone is genuinely at the other end */
        /* the safety check follows the moment rather than fighting it for the
           screen — it is the more important of the two and deserves an
           uncluttered one */
        showConnectedFlash(peerNick).then(() => checkSafetyFor(peerNick));
      }
    } else if (msg.type === 'text'){
      const label = peerNick ? '<span class="who">'+esc(peerNick)+'</span>' : '';
      renderMsg(label + esc(msg.text) + '<div class="meta">' + timeNow() + '</div>', false);
    } else if (msg.type === 'file-start'){
      /* The other side declares what it is about to send. Until now nothing
         ever checked that declaration against what actually arrived: a peer
         could announce ten bytes and then push megabytes, or open thousands of
         transfers and finish none, until the phone ran out of memory. Both are
         now bounded — and a peer that does either is not sending you a file. */
      if (typeof msg.id !== 'string' || !msg.id) return;
      if (Object.keys(incoming).length >= MAX_OPEN_TRANSFERS) return;
      const declared = Number(msg.size);
      if (!(declared >= 0) || declared > MAX_INCOMING_BYTES) return;
      /* Same reasoning as the sending side: nothing used to appear until the
         whole thing had arrived, so a large incoming file looked identical to
         nothing happening at all. */
      const xfer = renderTransferBubble(msg.name || '', declared, false);
      incoming[msg.id] = {
        chunks: [], got: 0, meta: msg, cap: Math.min(declared, MAX_INCOMING_BYTES), xfer,
      };
    } else if (msg.type === 'file-end'){
      const rec = incoming[msg.id]; if (!rec) return;
      const blob = new Blob(rec.chunks, { type: rec.meta.mime || 'application/octet-stream' });
      const url = keepObjectUrl(URL.createObjectURL(blob));
      const mime = rec.meta.mime || '';
      const isImg = mime.startsWith('image/'), isVid = mime.startsWith('video/'), isAud = mime.startsWith('audio/');
      let html = isImg ? '<img src="'+url+'">' : isVid ? '<video src="'+url+'" controls></video>'
               : isAud ? '<audio src="'+url+'" controls></audio>'
               : '<a href="'+url+'" download="'+esc(rec.meta.name)+'" class="filelink">'+svgIcon('attach','sm')+esc(rec.meta.name)+' ↓</a>';
      const finalHtml = html + '<div class="meta">' + timeNow() + '</div>';
      rec.xfer.finish(finalHtml);
      saveToHistory(peerNick, finalHtml, false);
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
    if (!rec) return;
    const piece = bytes.subarray(16);
    /* more than was promised: the transfer is abandoned rather than trusted,
       because whatever this is, it is not the file that was announced */
    if (rec.got + piece.byteLength > rec.cap){
      /* the bubble stayed on screen forever, stuck mid-bar, if this was left
         at only a system line — nothing tied the abandonment back to it */
      rec.xfer.fail(t('file.tooBig','Un file in arrivo è stato interrotto: non corrispondeva a quanto dichiarato.'));
      delete incoming[id];
      return;
    }
    rec.got += piece.byteLength;
    rec.chunks.push(piece);
    rec.xfer.paint(rec.got, rec.got === rec.cap);
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
    /* Deliberately says nothing about *where* the fix lives — it used to name
       the padlock icon here, unconditionally, which was flatly wrong advice on
       an iPhone and impossible advice on an installed Android app, where there
       is no address bar to hold one. Where the fix actually is depends on the
       browser and, on Android, on whether the app was installed — that
       distinction is what the numbered steps below exist for. */
    return t('call.micFailDenied','Il browser ha bloccato microfono e fotocamera per questo sito. Segui i passaggi qui sotto, poi ricarica la pagina.');
  return t('call.micFail','Microfono o fotocamera non disponibili, o permesso negato.');
}

/* ---------------- when the microphone will not open ----------------
   Three separate failures were being handled as one small line in the chat:
   a device that does not exist, one another app is holding, and one the
   browser has been told to refuse. Only the last is common, and it is the
   only one a person can actually fix — but not from generic advice, because
   the fix lives somewhere completely different on each browser. On iPhone it
   is in the Settings app, two levels down, and no amount of looking at the
   web page will ever reveal it.
   So: name the problem, then give the steps for the browser actually in
   front of them, in a panel that cannot be scrolled past. */
function browserFamily(){
  const ua = navigator.userAgent;
  if (isIOS) return 'ios';
  /* An Android app added to the Home Screen has no address bar at all, so
     "tap the padlock" is not a harder version of the fix — it is impossible
     to follow, full stop. Reported directly: someone declined a call, got
     told to tap a padlock that was not on their screen, and had no way back
     in. An installed PWA on Android is wrapped in its own Android package
     (a WebAPK), which is why it gets its own entry in the phone's own App
     info screen — a completely different, and completely reachable, path. */
  if (/Android/.test(ua)) return isStandalone ? 'android-app' : 'android';
  /* Chrome and Edge both put it behind the padlock, and both say they are
     Safari in the user agent, so Safari has to be what is left over */
  if (/Edg\//.test(ua) || /Chrome\//.test(ua) || /Chromium/.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}

function mediaHelpSteps(){
  switch (browserFamily()){
    case 'ios': return t('media.stepsIos',
      'Apri <b>Impostazioni</b> sull\'iPhone|Scendi e tocca <b>Safari</b>|Tocca <b>Microfono</b> e poi <b>Fotocamera</b>: metti <b>Chiedi</b> o <b>Consenti</b>|Torna qui e ricarica la pagina');
    case 'android': return t('media.stepsAndroid',
      'Tocca il <b>lucchetto</b> vicino all\'indirizzo, in alto|Tocca <b>Autorizzazioni</b>|Attiva <b>Microfono</b> e <b>Fotocamera</b>|Ricarica la pagina');
    case 'android-app': return t('media.stepsAndroidApp',
      'Torna alla schermata Home del telefono|Tieni premuta l\'icona di <b>DigitalValut Logos</b>|Tocca <b>Informazioni app</b> (o l\'icona ⓘ)|Tocca <b>Autorizzazioni</b>, poi attiva <b>Microfono</b> e <b>Fotocamera</b>|Riapri l\'app');
    case 'chrome': return t('media.stepsChrome',
      'Clicca il <b>lucchetto</b> a sinistra dell\'indirizzo|Attiva <b>Microfono</b> e <b>Fotocamera</b>|Ricarica la pagina');
    case 'safari': return t('media.stepsSafariMac',
      'Nella barra in alto apri <b>Safari</b> › <b>Impostazioni per questo sito web</b>|Metti <b>Microfono</b> e <b>Fotocamera</b> su <b>Consenti</b>|Ricarica la pagina');
    case 'firefox': return t('media.stepsFirefox',
      'Clicca il <b>lucchetto</b> a sinistra dell\'indirizzo|Togli il blocco accanto a <b>Usa il microfono</b> e <b>Usa la fotocamera</b>|Ricarica la pagina');
    default: return t('media.stepsOther',
      'Apri le impostazioni del browser per questo sito|Consenti <b>Microfono</b> e <b>Fotocamera</b>|Ricarica la pagina');
  }
}

/* The steps arrive as one translated string split on "|" so that thirteen
   languages need one entry each rather than four. */
function showMediaHelp(err){
  $('mediaWhat').textContent = micFailMessage(err);
  const list = $('mediaSteps');
  list.innerHTML = '';
  const blocked = !err || ['NotAllowedError','PermissionDeniedError','SecurityError'].indexOf(err.name) >= 0;
  if (blocked){
    for (const step of mediaHelpSteps().split('|')){
      const li = document.createElement('li');
      li.innerHTML = step; /* the bolding is ours, from the translation table */
      list.appendChild(li);
    }
  }
  $('mediaHelp').classList.remove('hide');
  /* the small warning was only ever a pointer to this panel — with the panel
     open it would be the same sentence twice */
  $('mediaWarn').classList.add('hide');
  $('mediaHelp').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
$('btnMediaClose').addEventListener('click', () => $('mediaHelp').classList.add('hide'));
$('btnMediaRetry').addEventListener('click', async () => {
  try{
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach(tr => tr.stop());
    $('mediaHelp').classList.add('hide');
    $('mediaWarn').classList.add('hide');
    toast(t('media.nowOk','Microfono attivo. Ora puoi chiamare.'));
  }catch(e){ showMediaHelp(e); }
});
$('btnMediaWarnFix').addEventListener('click', () => showMediaHelp(null));

/* Asked on arrival rather than mid-call. Safari does not implement this query
   at all, so a browser that cannot answer is simply left alone — better a
   missing warning than a wrong one. */
async function checkMicPermissionEarly(){
  try{
    if (!navigator.permissions || !navigator.permissions.query) return;
    const st = await navigator.permissions.query({ name: 'microphone' });
    $('mediaWarn').classList.toggle('hide', st.state !== 'denied');
    st.onchange = () => $('mediaWarn').classList.toggle('hide', st.state !== 'denied');
  }catch(e){ /* unsupported: say nothing */ }
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

/* ---------------- keeping the screen awake during a call ----------------
   Reported from real use: a call that drops while the two people are still
   talking. The commonest cause is not the network at all — it is the phone's
   own screen timeout. Once the screen goes dark a mobile browser throttles
   the page hard, and a WebRTC connection it is no longer showing anybody is
   one of the first things to suffer.

   A phone call from the dialler app keeps the screen policy under control
   because the operating system knows a call is happening. A web page has to
   say so, and this is how: navigator.wakeLock, which asks the system to keep
   the display on for as long as the lock is held.

   Two things worth knowing, both handled below. The lock is released
   automatically whenever the page is hidden, so it has to be taken again on
   the way back — otherwise the first time somebody glances at another app the
   protection is gone for the rest of the call. And it is not supported
   everywhere (Safari gained it late, some browsers still lack it): every call
   is wrapped, and a browser without it simply behaves as it did before rather
   than throwing. */
let screenLock = null;
async function keepScreenAwake(){
  if (screenLock) return;
  try{
    if (!navigator.wakeLock) return;
    screenLock = await navigator.wakeLock.request('screen');
    /* the system can take it back on its own (battery saver, a call from the
       dialler); noticing means the next visibility change can ask again */
    screenLock.addEventListener('release', () => { screenLock = null; });
  }catch(e){ screenLock = null; }
}
function letScreenSleep(){
  if (!screenLock) return;
  try{ screenLock.release(); }catch(e){}
  screenLock = null;
}

async function startCall(kind){
  if (callState !== 'idle' || !dc || dc.readyState !== 'open') return;
  callKind = kind; callState = 'ringing-out';
  try{ localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' }); }
  catch(e){ showMediaHelp(e); callState = 'idle'; callKind = null; return; }
  $('callBox').classList.remove('hide');
  $('callBox').classList.toggle('voice', kind !== 'video');
  $('remoteVideo').classList.toggle('hide', kind !== 'video');
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
  } else if (msg.type === 'call-nomedia'){
    stopRing(); disarmCallTimeout(); endCall(false);
    sysLine(fill(msg.kind === 'video'
      ? t('media.peerNoCam','{name} ha risposto, ma il suo browser blocca fotocamera e microfono: non è un rifiuto. Provate con una chiamata solo audio.')
      : t('media.peerNoMic','{name} ha risposto, ma il suo browser blocca il microfono: non è un rifiuto.'),
      { name: peerNick || t('chat.someone') }));
  } else if (msg.type === 'call-accept'){ stopRing(); disarmCallTimeout(); onCallAccepted();
  } else if (msg.type === 'call-offer-sdp'){ onCallOfferSdp(msg.sdp);
  } else if (msg.type === 'call-answer-sdp'){
    pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }).catch(() => {
      /* the call already looks "active" from onCallAccepted() onward — left
         silent, a failure here meant both people staring at a live-looking
         call neither could actually hear */
      endCall(true);
      sysLine(t('call.connectFailed','La chiamata non si è collegata. Riprova.'));
    });
  } else if (msg.type === 'call-end'){ stopRing(); disarmCallTimeout(); endCall(false); }
}
$('btnAcceptCall').addEventListener('click', async () => {
  stopRing(); disarmCallTimeout();
  $('incomingCall').classList.add('hide');
  try{ localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callKind === 'video' }); }
  catch(e){
    showMediaHelp(e);
    /* NOT 'call-decline'. Sending that told the caller "they refused you",
       which is a lie: they pressed answer, and their browser refused. Being
       left to conclude the other person is ignoring you — or that the app is
       broken — was the worst part of this bug. */
    sig({ type: 'call-nomedia', kind: callKind });
    callState = 'idle'; callKind = null; return;
  }
  localStream.getTracks().forEach(tr => pc.addTrack(tr, localStream));
  $('callBox').classList.remove('hide');
  $('callBox').classList.toggle('voice', callKind !== 'video');
  $('remoteVideo').classList.toggle('hide', callKind !== 'video');
  $('localVideo').classList.toggle('hide', callKind !== 'video');
  $('localVideo').srcObject = localStream;
  setCallStatus(callKind === 'video' ? t('call.inVideo') : t('call.inAudio'));
  callState = 'active';
  keepScreenAwake();
  initSpeakerToggle();
  initFlipCam();
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
  keepScreenAwake();
  initSpeakerToggle();
  initFlipCam();
}
async function onCallOfferSdp(sdp){
  await pc.setRemoteDescription({ type: 'offer', sdp });
  const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
  sig({ type: 'call-answer-sdp', sdp: pc.localDescription.sdp });
}
function endCall(tellPeer){
  stopRing(); disarmCallTimeout();
  letScreenSleep();
  if (tellPeer) sig({ type: 'call-end' });
  if (localStream){ localStream.getTracks().forEach(tr => tr.stop()); localStream = null; }
  $('callBox').classList.add('hide'); $('incomingCall').classList.add('hide');
  $('remoteVideo').srcObject = null; $('localVideo').srcObject = null;
  $('remoteAudio').srcObject = null; $('remoteVideo').classList.remove('hide');
  $('callBox').classList.remove('voice');
  $('btnFlipCam').classList.add('hide'); facing = 'user';
  callState = 'idle'; callKind = null; micOn = true; camOn = true;
  setIcon('btnMuteCall','mic'); setIcon('btnCamCall','video');
  speakerOn = false; $('btnSpeakerCall').classList.add('hide'); $('btnSpeakerCall').classList.remove('on');
}
$('btnCallAudio').addEventListener('click', () => startCall('audio'));
$('btnCallVideo').addEventListener('click', () => startCall('video'));
$('btnHangup').addEventListener('click', () => endCall(true));
$('btnMuteCall').addEventListener('click', () => {
  if (!localStream) return;
  micOn = !micOn; localStream.getAudioTracks().forEach(tr => tr.enabled = micOn);
  setIcon('btnMuteCall', micOn ? 'mic' : 'micOff');
});
$('btnCamCall').addEventListener('click', () => {
  if (!localStream) return;
  camOn = !camOn; localStream.getVideoTracks().forEach(tr => tr.enabled = camOn);
  setIcon('btnCamCall', camOn ? 'video' : 'videoOff');
});

/* ---------------- front camera or back camera ----------------
   Swapping the track on the sender rather than rebuilding the call: the
   connection, the encryption and the agreed format all stay exactly as they
   were, so the other side simply starts seeing the other camera with nothing
   to renegotiate and no gap in the call.
   The button only appears where there is genuinely a second camera to turn to,
   which is asked of the device rather than guessed from it being a phone. */
let facing = 'user';
async function haveTwoCameras(){
  try{
    const d = await navigator.mediaDevices.enumerateDevices();
    return d.filter(x => x.kind === 'videoinput').length > 1;
  }catch(e){ return false; }
}
async function initFlipCam(){
  const show = callKind === 'video' && await haveTwoCameras();
  $('btnFlipCam').classList.toggle('hide', !show);
}
/* Why this is not simply "ask for the other camera".
   Most phones will not open a second camera while the first one is still
   running — the request comes back with the device busy, which is exactly what
   the first version of this hit. Asking politely first and only taking the
   camera away if that fails is the wrong order here: the polite path has to be
   the one that does not need a second camera at all.
   So: try to turn the camera the app already holds; if the phone will not do
   that, let go of it and pick a different one by name; and if even that fails,
   take the original back so nobody is left with a dead picture in the middle of
   a call. */
async function otherCameraId(currentId){
  try{
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    if (cams.length < 2) return null;
    const other = cams.find(c => c.deviceId && c.deviceId !== currentId);
    return other ? other.deviceId : null;
  }catch(e){ return null; }
}
function flipFailReason(e){
  const n = e && e.name;
  if (n === 'NotReadableError' || n === 'TrackStartError')
    return t('call.flipBusy','La fotocamera è occupata da un\'altra app. Chiudila e riprova.');
  if (n === 'NotAllowedError' || n === 'SecurityError')
    return t('call.flipDenied','Il browser ha bloccato la fotocamera per questo sito.');
  if (n === 'OverconstrainedError' || n === 'NotFoundError')
    return t('call.flipOnlyOne','Questo dispositivo ha una sola fotocamera.');
  return t('call.flipFail','Non riesco a cambiare fotocamera su questo telefono.');
}

async function useVideoTrack(track){
  const sender = pc && pc.getSenders().find(s => s.track && s.track.kind === 'video');
  if (sender) await sender.replaceTrack(track);
  for (const old of localStream.getVideoTracks()){
    if (old === track) continue;
    localStream.removeTrack(old); old.stop();
  }
  if (localStream.getVideoTracks().indexOf(track) < 0) localStream.addTrack(track);
  track.enabled = camOn;
  $('localVideo').srcObject = localStream;
}

$('btnFlipCam').addEventListener('click', async () => {
  if (!localStream || !pc || callKind !== 'video') return;
  const current = localStream.getVideoTracks()[0];
  if (!current) return;
  const want = facing === 'user' ? 'environment' : 'user';
  $('btnFlipCam').disabled = true;
  let lastErr = null;

  /* 1 — ask the track already in hand to turn round. No second camera is
     opened, so nothing can be busy, and the picture never drops. */
  try{
    await current.applyConstraints({ facingMode: { exact: want } });
    const got = current.getSettings().facingMode;
    if (!got || got === want){ facing = want; $('btnFlipCam').disabled = false; return; }
  }catch(e){ lastErr = e; }

  /* 2 — let go of this camera first, then open the other one by name. */
  const currentId = (current.getSettings() || {}).deviceId;
  const otherId = await otherCameraId(currentId);
  const before = { id: currentId, facing };
  try{
    current.stop();
    const wanted = otherId ? { deviceId: { exact: otherId } } : { facingMode: { exact: want } };
    const fresh = await navigator.mediaDevices.getUserMedia({ video: wanted, audio: false });
    const track = fresh.getVideoTracks()[0];
    if (!track) throw new Error('no camera');
    await useVideoTrack(track);
    facing = want;
    $('btnFlipCam').disabled = false;
    return;
  }catch(e){ lastErr = e; }

  /* 3 — it did not work and the old camera is already gone, so take it back
     rather than leave a call with a dead picture in it. */
  try{
    const back = await navigator.mediaDevices.getUserMedia({
      video: before.id ? { deviceId: { exact: before.id } } : { facingMode: { ideal: before.facing } },
      audio: false
    });
    const t2 = back.getVideoTracks()[0];
    if (t2) await useVideoTrack(t2);
  }catch(e){}
  toast(flipFailReason(lastErr));
  $('btnFlipCam').disabled = false;
});

/* ---------------- which thing the far end's voice comes out of ----------------
   A voice call was being played through the <video> element, which is how the
   app told the phone "this is media" — and media plays out of the loudspeaker.
   The result was a private conversation broadcast to whoever was in the room,
   every time, without anyone choosing it. For an app whose whole point is that
   nobody else hears you, that was the worst possible default.
   Voice-only calls now get their own <audio> element. A page still cannot
   command a phone to use the earpiece — no web API exists for that — but it can
   stop claiming to be a video, which is what was causing the wrong answer. */
function remoteMediaEl(){ return callKind === 'video' ? $('remoteVideo') : $('remoteAudio'); }

function attachRemoteStream(stream){
  const el = remoteMediaEl(), other = el === $('remoteVideo') ? $('remoteAudio') : $('remoteVideo');
  /* only ever one of the two holds it, or the voice arrives twice */
  if (other.srcObject) other.srcObject = null;
  if (el.srcObject !== stream) el.srcObject = stream;
  /* a voice call had been showing an empty black rectangle where the picture
     would be, which reads as something broken rather than as "no video".
     The box switches layout with it: without the video there is nothing to
     hold it open, and the controls inside would be clipped away. */
  const voice = callKind !== 'video';
  $('remoteVideo').classList.toggle('hide', voice);
  $('callBox').classList.toggle('voice', voice);
  applySpeakerChoice();
}

/* ---------------- loudspeaker, where the phone actually allows it ----------------
   Confirmed against current documentation, not assumed: iOS Safari does not implement
   HTMLMediaElement.setSinkId() at all — Apple keeps output-device selection at the OS
   level and does not expose it to web pages, still true as of 2026. Where it does exist
   (Chrome on Android), this asks the phone for the earpiece by default and the
   loudspeaker only when someone chooses it. The button only ever appears where it can
   actually do something — no dead control on a phone that cannot use it. */
let speakerOn = false;
function speakerPref(){ try{ return localStorage.getItem('dvlogos-speaker') === '1'; }catch(e){ return false; } }
function setSpeakerPref(on){ try{ localStorage.setItem('dvlogos-speaker', on ? '1' : '0'); }catch(e){} }

/* Phones label these differently and most do not expose them at all, so both
   lookups are allowed to come back empty and the caller falls back to whatever
   the system considers default. */
async function findOutputId(which){
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    const re = which === 'speaker' ? /speaker|speakerphone|loud/i : /earpiece|receiver|handset/i;
    const d = devices.find(x => x.kind === 'audiooutput' && re.test(x.label));
    return d ? d.deviceId : null;
  }catch(e){ return null; }
}

async function applySpeakerChoice(){
  const el = remoteMediaEl();
  if (typeof el.setSinkId !== 'function') return;
  try{
    const id = await findOutputId(speakerOn ? 'speaker' : 'earpiece');
    await el.setSinkId(id || '');
  }catch(e){}
}

async function initSpeakerToggle(){
  const supported = typeof remoteMediaEl().setSinkId === 'function';
  $('btnSpeakerCall').classList.toggle('hide', !supported);
  if (!supported) return;
  /* whatever was chosen last time, because someone who put it on speaker for a
     reason usually still has that reason on the next call */
  speakerOn = speakerPref();
  $('btnSpeakerCall').classList.toggle('on', speakerOn);
  setIcon('btnSpeakerCall', speakerOn ? 'speakerLoud' : 'speakerLow');
  await applySpeakerChoice();
}
$('btnSpeakerCall').addEventListener('click', async () => {
  const el = remoteMediaEl();
  if (typeof el.setSinkId !== 'function') return;
  const want = !speakerOn;
  try{
    const id = await findOutputId(want ? 'speaker' : 'earpiece');
    if (want && !id){ toast(t('call.noSpeakerFound','Non trovo un altoparlante separato su questo telefono.')); return; }
    await el.setSinkId(id || '');
    speakerOn = want;
    setSpeakerPref(speakerOn);   /* remembered for the next call */
    $('btnSpeakerCall').classList.toggle('on', speakerOn);
    setIcon('btnSpeakerCall', speakerOn ? 'speakerLoud' : 'speakerLow');
  }catch(e){
    toast(t('call.speakerFail','Non riesco a cambiare l\'altoparlante su questo telefono.'));
  }
});

/* ============================== self-destruct ============================== */
let destructTimer = null, destructDeadline = 0;
function destroyNow(tellPeer){
  clearInterval(destructTimer); destructTimer = null;
  destructArmed = false;
  if (tellPeer && dc && dc.readyState === 'open'){ try{ dc.send(JSON.stringify({ type:'wipe' })); }catch(e){} }
  endCall(false);
  /* The whole point, and until now the one thing it did not do: emptying the
     screen is not destroying anything. Whatever was written down about this
     person goes with it, or the sentence below is a lie. */
  forgetHistoryFor(peerNick);
  $('msgs').innerHTML = '';
  /* the photos and files that crossed this conversation go out of memory with
     it: keeping them alive would be its own quiet contradiction of the word
     "destroyed" */
  releaseObjectUrls();
  sysLine(t('destruct.done'));
  if (dc) try{ dc.close(); }catch(e){}
  if (pc) try{ pc.close(); }catch(e){}
  dc = null; pc = null;
  $('destructCountdown').classList.add('hide');
  $('btnDisarmDestruct').classList.add('hide');
  $('connState').textContent = t('session.closed');
  paintConnDot();
}
$('btnArmDestruct').addEventListener('click', () => {
  const minutes = parseInt($('destructMinutes').value, 10);
  destructDeadline = Date.now() + minutes * 60000;
  /* from this moment nothing more is written to the phone, and what is already
     written for this person goes now rather than at the end — arming it is the
     decision; the countdown is only how long you still have to read it */
  destructArmed = true;
  forgetHistoryFor(peerNick);
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
  /* saving resumes from here on. What was said while the timer was running was
     never written down and is not recovered — which is what was asked for. */
  destructArmed = false;
  $('destructCountdown').classList.add('hide'); $('btnDisarmDestruct').classList.add('hide');
});
$('btnNewSession').addEventListener('click', () => {
  clearInterval(destructTimer); destructTimer = null;
  /* the timer belonged to the conversation that just ended: leaving it armed
     would silently stop this device saving anything, for ever */
  destructArmed = false;
  $('destructCountdown').classList.add('hide'); $('btnDisarmDestruct').classList.add('hide');
  stopQuickPump();
  endCall(false);
  if (dc) try{ dc.close(); }catch(e){}
  if (pc) try{ pc.close(); }catch(e){}
  pc = null; dc = null; peerNick = '';
  $('msgs').innerHTML = '';
  releaseObjectUrls();
  $('offerBlock').classList.add('hide'); $('offerOut').textContent = '';
  $('answerBlock').classList.add('hide'); $('answerOut').textContent = '';
  $('pasteAnswerCard').classList.add('hide');
  /* undoes showContactReconnectLayout(), in case the reset happens mid-reconnect */
  $('manualInviteCard').classList.remove('hide'); $('pasteAnswerForm').classList.remove('hide');
  $('offerIn').value = ''; $('answerIn').value = '';
  $('passBox').classList.add('hide'); $('passWord').textContent = '';
  $('passAsk').classList.add('hide'); $('passIn').value = ''; sessionPass = '';
  paintVerifyBadge('unknown'); $('verifyNote').textContent = ''; $('btnAcceptSafety').classList.add('hide');
  $('sasPanel').classList.add('hide'); $('sasPanel').classList.remove('warn');
  $('mediaHelp').classList.add('hide'); $('mediaWarn').classList.add('hide');
  $('addrIncoming').classList.add('hide'); addrPending = null; dialedAddress = null; dialedSlot = 0; dialedAddrProven = false;
  dialing = false; quickSharePc = null; manualInvitePc = null;
  hideKnockCard(); outgoingIntro = '';
  $('leaveLetter').classList.add('hide'); letterTarget = null;
  setStatus($('addrDialStatus'), ''); $('addrDialIn').value = '';
  startAddrPolling(); /* back on the home screen: listening at the address again */
  $('btnCreate').disabled = false; $('btnCreateAnswer').disabled = false;
  setStatus($('statusA'), ''); setStatus($('statusB'), '');
  $('diagA').classList.add('hide'); $('diagB').classList.add('hide');
  $('menuPanel').classList.add('hide');
  $('quickCodeOut').textContent = '······'; setStatus($('quickStatusA'), ''); $('diagQuickA').classList.add('hide');
  $('quickQr').classList.add('hide');
  $('btnRetryQuickA').classList.add('hide');
  $('quickCodeIn').value = ''; setStatus($('quickStatusB'), ''); $('diagQuickB').classList.add('hide');
  $('btnQuickConnect').disabled = false;
  $('bigConnectingA').classList.add('hide'); $('bigConnectingB').classList.add('hide');
  showQuickLayoutA(); showQuickLayoutB();
  showScreen('screenHome');
  /* deliberately only on this path. Self-destruct also lands on the home
     screen, and asking someone to recommend the app seconds after they wiped
     a conversation would read as tone-deaf, because it would be. */
  maybeShowViralCard();
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
      if (!res.ok){ rows.length = 0; break; }
      rows.push(f + '  ' + await sha256Hex(await res.arrayBuffer()));
    }
    /* The single-file build has no separate files to fetch, and a page that
       cannot check itself is exactly the page nobody should trust. So it hashes
       the one file it is: same guarantee, one line instead of three. */
    if (!rows.length){
      const self = await fetch(location.href, { cache: 'no-store' });
      if (!self.ok) return;
      const name = location.pathname.replace(/^.*\//, '') || 'index.html';
      rows.push(name + '  ' + await sha256Hex(await self.arrayBuffer()));
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

/* static icons that never toggle — set once, here, rather than baked into the
   HTML, so the markup and the icon set stay defined in exactly one place */
setIcon('btnCallAudio','phone'); setIcon('btnCallVideo','video');
setIcon('btnMuteCall','mic'); setIcon('btnCamCall','video'); setIcon('btnFlipCam','flip');
setIcon('btnAttach','attach'); setIcon('btnMic','mic'); setIcon('btnEmoji','smile'); setIcon('btnSend','send');
setIcon('btnMenu','dots');

initLang();
renderContacts();
initNotifyUI();
paintAddrCard();
renderLetters();
/* not "only if the home screen happens to be showing": whichever screen the
   app opens on, a known contact must still be able to get through */
startInboxPolling();

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
/* ---------------- picking an invite back up ----------------
   Someone left an invite out there and closed the app. Whoever opens it later
   rings them, and this is what happens when they answer that ring: the same
   invite goes quietly back on the air, on the same code, without dragging
   anyone to a screen they did not ask for. If nobody is actually waiting,
   nothing visible happens at all and it lapses on its own. The moment an
   answer does arrive, startQuickShare brings the screen with it.
   Deliberately skipped when the app was opened *by* an invite link: that is
   the other side of this same conversation, and it has its own flow below. */
(function resumePendingInvite(){
  if (/[#&][qia]=/.test(location.hash)) return;
  const pending = readPendingInvite();
  if (!pending) return;
  /* startQuickShare is async: a synchronous try/catch here only ever caught
     an error thrown before its first await, which in practice is none of
     them — everything past that point became an unhandled promise rejection
     instead, invisible to this catch. Caught properly now; still silent by
     design (see the note above this function) rather than alarming someone
     over a resume that may simply have nobody waiting on the other end. */
  startQuickShare(pending.code, true).catch(() => {});
})();

function autoFillFromHash(){
  /* an address QR scanned, or an address link tapped */
  const dial = location.hash.match(/[#&]a=([0-9A-Za-z]{12})\b/);
  if (dial){
    const a = parseAddress(dial[1]);
    try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){}
    if (a){ $('addrDialIn').value = formatAddress(a); showScreen('screenHome'); showKnockCard(a); return; }
  }
  const quick = location.hash.match(/[#&]q=(\d{6})\b/);
  if (quick){
    const code = quick[1];
    /* only a QR carries this, and only a QR was ever held out in person */
    const vouch = location.hash.match(/[#&]v=([0-9a-f]{8,64})\b/);
    scannedFp = vouch ? vouch[1] : null;
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
}
autoFillFromHash();

/* An invite tapped while the app is already open changes only the part of the
   address after the '#', and a browser treats that as staying on the same page:
   nothing reloads, so none of the above would run again and the tap would
   appear to do nothing at all. That case is now the common one rather than the
   exotic one — the whole point of the wake slot is that people leave this app
   installed and come back to it — so the same handling runs again on its own. */
window.addEventListener('hashchange', () => {
  if (!/[#&][qia]=/.test(location.hash)) return;
  autoFillFromHash();
});
