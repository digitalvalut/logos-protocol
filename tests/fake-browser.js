/* A browser, in about a hundred and fifty lines.

   Enough of one to load the whole app and then ask its functions questions
   directly — which is the only way to test the logic that has actually broken
   here, because every one of those faults was a decision made in a plain
   JavaScript function, not something you can see by looking at a screen.

   Written by hand on purpose. The usual answer is jsdom: three megabytes and
   several hundred packages, pulled in to check an app whose whole point is
   that it pulls in nothing. This file is short enough to read in one sitting,
   which is the same standard the app itself is held to. It is a test fixture
   and never ships. */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

/* The classes an element starts with are not decoration: `class="hide"` on the
   chat screen is how the app knows nobody is in a conversation. A fake page
   where every element starts bare would have the app believing it was mid-chat
   from the first instruction, and every answer after that would be worthless.
   So the real page is read, and each element begins life as it really does. */
function initialClasses(){
  const html = fs.readFileSync(path.join(__dirname, '..', 'modifica.html'), 'utf8');
  const found = new Map();
  for (const m of html.matchAll(/<[a-zA-Z][^>]*>/g)){
    const tag = m[0];
    const id = (tag.match(/\bid="([A-Za-z0-9_-]+)"/) || [])[1];
    if (!id) continue;
    found.set(id, {
      cls: (tag.match(/\bclass="([^"]*)"/) || [, ''])[1],
      tag: (tag.match(/^<([a-zA-Z0-9]+)/) || [, 'div'])[1],
    });
  }
  return found;
}

class FakeClassList {
  constructor(){ this.set = new Set(); }
  add(...c){ c.forEach(x => x && this.set.add(x)); }
  remove(...c){ c.forEach(x => this.set.delete(x)); }
  toggle(c, force){
    const on = force === undefined ? !this.set.has(c) : !!force;
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
  contains(c){ return this.set.has(c); }
  get value(){ return [...this.set].join(' '); }
  toString(){ return this.value; }
}

class FakeElement {
  constructor(tag = 'div', id = ''){
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.classList = new FakeClassList();
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.attributes = {};
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.listeners = {};
    this.options = [];
    this.parentNode = null;
  }
  get className(){ return this.classList.value; }
  set className(v){ this.classList = new FakeClassList(); String(v).split(/\s+/).forEach(c => c && this.classList.add(c)); }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  getAttribute(k){ return k in this.attributes ? this.attributes[k] : null; }
  removeAttribute(k){ delete this.attributes[k]; }
  hasAttribute(k){ return k in this.attributes; }
  appendChild(c){ c.parentNode = this; this.children.push(c); return c; }
  append(...c){ c.forEach(x => { x.parentNode = this; }); this.children.push(...c); }
  prepend(...c){ c.forEach(x => { x.parentNode = this; }); this.children.unshift(...c); }
  removeChild(c){ this.children = this.children.filter(x => x !== c); c.parentNode = null; return c; }
  /* Real replaceWith needs to find itself in a parent's own child list, which
     is why parentNode above is tracked at all — nothing else here reads it. */
  replaceWith(node){
    if (!this.parentNode) return;
    const i = this.parentNode.children.indexOf(this);
    if (i !== -1){ this.parentNode.children[i] = node; node.parentNode = this.parentNode; }
    this.parentNode = null;
  }
  remove(){ if (this.parentNode) this.parentNode.removeChild(this); }
  insertBefore(c){ c.parentNode = this; this.children.unshift(c); return c; }
  addEventListener(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); }
  removeEventListener(type, fn){
    if (this.listeners[type]) this.listeners[type] = this.listeners[type].filter(f => f !== fn);
  }
  /* lets a test press a button the way a finger would */
  dispatchEvent(ev){ (this.listeners[ev && ev.type] || []).forEach(fn => fn.call(this, ev)); return true; }
  click(){ this.dispatchEvent({ type: 'click', preventDefault(){}, stopPropagation(){} }); }
  focus(){} blur(){} scrollIntoView(){} select(){} play(){ return Promise.resolve(); } pause(){}
  /* Only the one form anything here has ever needed: "does this element carry
     this attribute". A real querySelector parses arbitrary CSS; this recognises
     exactly `[attr]` and nothing else, which is honest about how little of it
     exists rather than pretending to a generality nothing exercises. Walks
     `.children`, which is real and populated by appendChild/append — unlike
     `innerHTML`, which this fake DOM only ever stores as a string. */
  querySelectorAll(sel){
    const m = /^\[([a-zA-Z0-9_-]+)\]$/.exec(sel);
    if (!m) return [];
    const attr = m[1], out = [];
    const walk = node => { for (const c of node.children){ if (c.hasAttribute(attr)) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  querySelector(sel){ return this.querySelectorAll(sel)[0] || null; }
  closest(){ return null; }
  getBoundingClientRect(){ return { top:0, left:0, right:0, bottom:0, width:100, height:100 }; }
  getContext(){
    return { fillRect(){}, clearRect(){}, drawImage(){}, fillText(){}, beginPath(){}, arc(){}, fill(){}, stroke(){},
             set fillStyle(v){}, get fillStyle(){ return ''; } };
  }
  toDataURL(){ return 'data:,'; }
}

function makeStorage(){
  const map = new Map();
  return {
    getItem: k => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: k => { map.delete(String(k)); },
    clear: () => map.clear(),
    key: i => [...map.keys()][i] ?? null,
    get length(){ return map.size; },
  };
}

/* Every id the app asks for gets a real element back, created on demand. The
   separate test that checks those ids exist in the page is what stops this
   from hiding a typo. */
function buildSandbox(options = {}){
  const startsAs = initialClasses();
  const byId = new Map();
  const document = {
    documentElement: new FakeElement('html'),
    body: new FakeElement('body'),
    head: new FakeElement('head'),
    visibilityState: 'visible',
    hidden: false,
    title: '',
    listeners: {},
    getElementById(id){
      if (!byId.has(id)){
        const real = startsAs.get(id);
        const el = new FakeElement(real ? real.tag : 'div', id);
        if (real && real.cls) el.className = real.cls;
        byId.set(id, el);
      }
      return byId.get(id);
    },
    createElement: tag => new FakeElement(tag),
    createTextNode: text => ({ textContent: text }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); },
    removeEventListener(){},
    dispatchEvent(ev){ (this.listeners[ev && ev.type] || []).forEach(fn => fn(ev)); return true; },
    execCommand: () => true,
  };

  const sandbox = {
    document,
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    crypto: globalThis.crypto,
    TextEncoder, TextDecoder,
    fetch: () => Promise.reject(new TypeError('the tests do not touch the network')),
    queueMicrotask,
    console,
    Promise, Date, Math, JSON, Error, TypeError, Set, Map, Array, Object, String, Number, Boolean,
    Uint8Array, Uint16Array, Uint32Array, Int32Array, Float64Array, ArrayBuffer, DataView,
    MessageChannel,
    navigator: {
      userAgent: options.userAgent
        || 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      standalone: options.standalone === true ? true : undefined,
      language: 'it-IT', languages: ['it-IT'],
      onLine: true,
      clipboard: { writeText: () => Promise.resolve() },
      permissions: { query: () => Promise.reject(new Error('not supported here')) },
      mediaDevices: { enumerateDevices: () => Promise.resolve([]), getUserMedia: () => Promise.reject(new Error('no media in tests')) },
      serviceWorker: { register: () => Promise.resolve({}), ready: new Promise(() => {}), controller: null, addEventListener(){} },
    },
    location: { origin: 'https://digitalvalut.github.io', pathname: '/logos-protocol/modifica.html',
                protocol: 'https:', host: 'digitalvalut.github.io', hostname: 'digitalvalut.github.io',
                hash: '', search: '', href: 'https://digitalvalut.github.io/logos-protocol/modifica.html',
                reload(){}, replace(){}, assign(){} },
    history: { replaceState(){}, pushState(){} },
    /* how an installed app announces itself — the difference between having an
       address bar with a padlock in it and having no address bar at all */
    matchMedia: query => ({
      matches: options.standalone === true && /display-mode:\s*standalone/.test(String(query)),
      addEventListener(){}, addListener(){},
    }),
    scrollTo(){},
    /* enough of a peer connection to be created and inspected; the tests never
       carry a real handshake, they ask the app what it *thinks* about one */
    RTCPeerConnection: class {
      constructor(){ this.connectionState = 'new'; this.signalingState = 'stable'; this.iceConnectionState = 'new'; }
      createDataChannel(){ return { readyState: 'connecting', send(){}, close(){}, addEventListener(){} }; }
      createOffer(){ return Promise.resolve({ type: 'offer', sdp: 'v=0\r\n' }); }
      createAnswer(){ return Promise.resolve({ type: 'answer', sdp: 'v=0\r\n' }); }
      setLocalDescription(){ this.localDescription = { sdp: 'v=0\r\n' }; return Promise.resolve(); }
      setRemoteDescription(){ this.remoteDescription = { sdp: 'v=0\r\n' }; return Promise.resolve(); }
      addIceCandidate(){ return Promise.resolve(); }
      getStats(){ return Promise.resolve(new Map()); }
      addEventListener(){}
      close(){ this.connectionState = 'closed'; }
      static generateCertificate(){ return Promise.resolve({ getFingerprints: () => [{ value: 'AA:BB' }] }); }
    },
    RTCSessionDescription: class { constructor(o){ Object.assign(this, o); } },
    Notification: undefined,
    speechSynthesis: undefined,
    Image: FakeElement,
    /* The real things, not stand-ins: URL.createObjectURL rejects anything
       that is not an actual Blob, and nothing exercised a real file receipt
       through onDcMessage — the code that builds a Blob from received chunks
       runs inside this sandbox, so it needs a Blob that URL recognises as
       one — until media persistence needed to test that path end to end. */
    Blob: globalThis.Blob,
    File: globalThis.File,
    FileReader: class { readAsDataURL(){} },
    URL: globalThis.URL,
    AbortController: globalThis.AbortController,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    performance: globalThis.performance,
  };
  /* The app sets repeating timers the moment it loads — that is the whole
     point of it, it is listening for people. Left running they keep the test
     process alive for ever, so every one is remembered and can be switched
     off when the test finishes. */
  const timers = new Set();
  sandbox.setTimeout = (fn, ms, ...a) => { const h = setTimeout(fn, ms, ...a); timers.add(h); return h; };
  sandbox.setInterval = (fn, ms, ...a) => { const h = setInterval(fn, ms, ...a); timers.add(h); return h; };
  sandbox.clearTimeout = h => { clearTimeout(h); timers.delete(h); };
  sandbox.clearInterval = h => { clearInterval(h); timers.delete(h); };
  sandbox.__stopAllTimers = () => { for (const h of timers){ clearTimeout(h); clearInterval(h); } timers.clear(); };

  /* the window listens too — 'beforeinstallprompt', 'hashchange', 'online' and
     friends all hang off it, and a test can fire them by hand */
  sandbox.listeners = {};
  sandbox.addEventListener = function(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); };
  sandbox.removeEventListener = function(type, fn){
    if (this.listeners[type]) this.listeners[type] = this.listeners[type].filter(f => f !== fn);
  };
  sandbox.dispatchEvent = function(ev){ (this.listeners[ev && ev.type] || []).forEach(fn => fn(ev)); return true; };

  /* The bridge the Android package puts in front of the page, and the only way
     the app can ring with itself closed. Present only when a test asks for it,
     because that is the truth everywhere else: in a browser there is no such
     object, and the app has to carry on without one. Every call is written
     down, so a test can ask what the page actually handed over — the keys it
     said to watch matter more here than any return value. */
  if (options.androidRing){
    sandbox.__androidRingCalls = [];
    sandbox.AndroidRing = {
      available: () => true,
      watch(keys, base, title, body){
        sandbox.__androidRingCalls.push({ what: 'watch', keys, base, title, body });
      },
      stop(){ sandbox.__androidRingCalls.push({ what: 'stop' }); },
      /* From Android 14 taking over a locked screen is granted by hand. A test
         can say it was refused and check that the app admits it instead of
         leaving somebody believing they are reachable. */
      canTakeOverLockScreen: () => options.androidLockScreen !== false,
      askForLockScreen(){ sandbox.__androidRingCalls.push({ what: 'askForLockScreen' }); },
    };
  }

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

module.exports = { buildSandbox, FakeElement, FakeClassList };
