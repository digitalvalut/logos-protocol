/* ============================================================================
   IL WORKER, IN UNA STANZA CHIUSA — Fase E.

   Il brief chiede `wrangler dev`. Wrangler non è installato qui, e il vincolo
   1 vieta dipendenze nuove — wrangler ne porta centinaia. Fra installarlo
   contro un vincolo esplicito e saltare la fase, c'è una terza strada: il
   Worker è `export default { async fetch(request, env) }`, cioè una funzione
   pura da Request a Response, e Node 22 ha Request, Response, Headers e
   crypto.subtle nativi. Si carica il file COM'È e lo si interroga.

   COSA QUESTO PROVA: la logica del Worker, riga per riga, sulla sorgente
   vera — instradamento, validazioni, il controllo anti-calpestio su /key,
   lettura unica della cassetta, tetto delle lettere, limiti di frequenza.

   COSA NON PROVA, e va detto perché è metà del valore di un audit:
     · la semantica reale di KV (consistenza finale, TTL applicati davvero)
     · il comportamento fra isolate diversi — i limiti di frequenza sono
       tenuti in memoria, e qui c'è un solo isolate, quindi risultano più
       severi di quanto siano in produzione
     · i limiti di CPU e memoria dell'ambiente Cloudflare
     · qualunque cosa dipenda dalla rete vera

   Nessuna richiesta lascia questa macchina. Il Worker di produzione non
   viene toccato: è il vincolo 2, e costa soldi veri.
   ========================================================================= */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SORGENTE = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');

/* ---------------------------------------------------------------- KV finto ---
   Vuoto a ogni prova, come chiede il brief. Registra le scritture con il loro
   TTL: il TTL non viene applicato davvero (nessun orologio finto arriva
   dentro KV), ma poterlo LEGGERE è ciò che permette di verificare che il
   Worker chieda le scadenze giuste — che è la parte sotto il suo controllo. */
function kvVuoto(){
  const m = new Map();
  const log = [];
  return {
    _m: m, _log: log,
    /* ⚠️ LE LETTURE NON VENIVANO REGISTRATE, ed è sembrato un dettaglio finché
       non è costato un test falso. Non lo è: le letture sono la quota che si
       consuma per prima nell'uso normale (100.000 al giorno) ed erano l'unica
       operazione che questo log NON vedeva. Un test che contasse "quante
       operazioni ha speso il Worker" leggeva quindi un numero sistematicamente
       più basso del vero, e un difetto che sprecasse SOLO letture sarebbe
       stato invisibile. Trovato il 1 set 2026 sabotando un test che restava
       verde. Stessa famiglia delle altre bugie del banco di prova
       (localStorage non enumerabile, IndexedDB assente): mentiva lo strumento
       di misura, non il codice misurato. */
    async get(k){ const v = m.get(k); log.push({ op: 'get', k }); return v === undefined ? null : v.valore; },
    async put(k, valore, opts){
      m.set(k, { valore, ttl: opts && opts.expirationTtl });
      log.push({ op: 'put', k, ttl: opts && opts.expirationTtl, bytes: String(valore).length });
    },
    async delete(k){ m.delete(k); log.push({ op: 'delete', k }); },
    async list(opts){
      const prefix = (opts && opts.prefix) || '';
      const limit = (opts && opts.limit) || 1000;
      const keys = [...m.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(name => ({ name }));
      log.push({ op: 'list', prefix, restituite: keys.length });
      return { keys, list_complete: true };
    },
  };
}

/* Carica il Worker in un contesto isolato. `Date` è sostituibile per poter
   provare le finestre dei limiti di frequenza senza aspettare un minuto. */
function caricaWorker(opts){
  const o = opts || {};
  const orologio = { t: o.tempoIniziale || 1_700_000_000_000 };
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a){ if (a.length === 0) super(orologio.t); else super(...a); }
    static now(){ return orologio.t; }
  }

  const sandbox = {
    Request, Response, Headers, URL, URLSearchParams,
    crypto: globalThis.crypto,
    TextEncoder, TextDecoder,
    fetch: o.fetch || (() => Promise.reject(new TypeError('nessuna rete in questa stanza'))),
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    Date: FakeDate, Math, JSON, Error, TypeError, Promise,
    Map, Set, Array, Object, String, Number, Boolean,
    Uint8Array, ArrayBuffer, DataView,
    console,
    setTimeout, clearTimeout,
  };
  sandbox.globalThis = sandbox;

  /* `export default` non gira in un vm normale: la riga viene trasformata in
     un assegnamento. È l'unica modifica alla sorgente, è meccanica, ed è
     limitata a quella riga — il resto del file è byte per byte l'originale.

     `o.sorgente` esiste per i mutanti della Fase F: la copia guasta arriva
     come stringa e il file su disco non viene mai toccato, che è il vincolo 3
     del brief. */
  const codice = (o.sorgente || SORGENTE).replace(/export\s+default\s*\{/, 'globalThis.__worker = {');
  vm.createContext(sandbox);
  vm.runInContext(codice, sandbox, { filename: 'worker.js' });

  const env = { MAILBOX: kvVuoto(), TURN_API_TOKEN: 'finto', TURN_KEY_ID: 'finto',
                VAPID_PUBLIC: 'finto', VAPID_PRIVATE: 'finto', VAPID_SUBJECT: 'mailto:x@y.z' };
  Object.assign(env, o.env || {});

  return {
    sandbox, env, orologio,
    /* Ogni richiesta parte da un IP: i limiti di frequenza sono per indirizzo,
       quindi senza questo header ogni prova sarebbe un cliente diverso e
       nessun limite scatterebbe mai. */
    async chiama(metodo, percorso, { body, origin, ip } = {}){
      const headers = { 'CF-Connecting-IP': ip || '203.0.113.7' };
      if (origin !== undefined && origin !== null) headers['Origin'] = origin;
      const req = new Request('https://worker.example' + percorso, { method: metodo, headers, body });
      const res = await sandbox.__worker.fetch(req, env);
      let corpo = null;
      const testo = await res.text();
      try{ corpo = JSON.parse(testo); }catch(e){ corpo = testo; }
      return { status: res.status, corpo, headers: res.headers };
    },
  };
}

/* ------------------------------------------------- materiale crittografico ---
   Il controllo più importante del Worker è che una chiave pubblica possa
   essere pubblicata SOLO nello slot che le appartiene. Per provarlo serve una
   chiave vera e lo slot vero che ne deriva.

   Lo slot NON viene ricalcolato qui: si chiedono al Worker le sue stesse
   funzioni, prese dalla sandbox. La prima stesura riscriveva la formula a
   mano e la sbagliava in tre punti — prefisso, separatore e codifica — e una
   prova costruita su una formula sbagliata avrebbe dichiarato rotto un
   controllo sano. Che client e Worker concordino sulla derivazione è una
   proprietà diversa, già coperta dalla suite di produzione. */
async function chiaveVera(){
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  return { p: Buffer.from(raw).toString('base64'), kp };
}
async function sha256Hex(s){
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
/* lo slot che il Worker stesso considera legittimo per questa chiave */
async function slotLegittimo(w, p, n){
  return w.sandbox.sha256Hex('logos-pubkey-v2:' + await w.sandbox.addressFromPub(p, n | 0));
}

module.exports = { caricaWorker, kvVuoto, chiaveVera, sha256Hex, slotLegittimo, SORGENTE };
