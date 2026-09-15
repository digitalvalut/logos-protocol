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
package io.github.digitalvalut.logos;

import android.util.Base64;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.security.MessageDigest;
import java.security.SecureRandom;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/**
 * Il filo aperto: un client WebSocket scritto a mano (RFC 6455), il minimo
 * che serve per tenere UNA presa aperta con il relay e ricevere un
 * messaggio quando arriva una busta.
 *
 * ⚠️ NATO IL 16 SETTEMBRE 2026 (v49). Fino a qui il campanello bussava alla
 * cassetta ogni 5/45/90 secondi: lo squillo arrivava fra 2 e 92 secondi dopo
 * la chiamata. Con il filo il relay tira dall'altra parte nell'istante in cui
 * la busta e' scritta, e il campanello va a guardare subito.
 *
 * Perche' scritto a mano e non con una libreria: Logos non porta codice di
 * altri, ne' nell'app ne' qui. Il protocollo, nella parte che ci serve, e'
 * piccolo: una stretta di mano HTTP, cornici con lunghezza e maschera, tre
 * tipi di cornice (testo, ping/pong, chiusura). Tutto il resto del RFC
 * (frammentazione, estensioni, sotto-protocolli) non si usa e non si accetta.
 *
 * Cosa NON fa: non parla. Dal telefono al relay passa solo la parola «ping»,
 * ogni PING_EVERY_MS, per tenere viva la linea attraverso i NAT delle reti
 * mobili (il relay risponde «pong» senza svegliare nessuno). Dal relay al
 * telefono arriva `{"busta":1}`, e basta: «vai a guardare». Niente chiavi,
 * niente contenuti, niente nomi: e' un campanello, non una posta.
 *
 * Chi lo usa (RingService) lo tiene in un thread suo, e se il filo cade
 * torna a bussare come prima: il filo e' un miglioramento, non un requisito.
 */
final class Filo {

    interface Ascoltatore {
        /** La stretta di mano e' riuscita: il filo e' aperto. */
        void aperto();
        /** Il relay ha tirato il filo: c'e' una busta. */
        void busta();
        /** Una fase del filo, per il registro: «connetto», «101», «chiuso da noi»… */
        void fase(String cosa);
    }

    /* un ping ogni quattro minuti: sotto i cinque che i NAT mobili tengono.
       La lettura scade con lo stesso passo: allo scadere si manda «ping»; se
       anche la lettura successiva scade senza che sia arrivato niente (il
       «pong», o una busta), il filo e' morto e si ricomincia. */
    static final long PING_EVERY_MS = 4 * 60000;
    static final int READ_TIMEOUT_MS = (int) PING_EVERY_MS;
    static final int CONNECT_TIMEOUT_MS = 10000;
    /* una busta e' un messaggio corto: una cornice piu' lunga non e' del relay */
    static final int MAX_FRAME_BYTES = 4096;

    private static final String GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

    private final SecureRandom random = new SecureRandom();
    private SSLSocket socket;
    private InputStream in;
    private OutputStream out;
    private volatile boolean aperto;

    /**
     * Apre il filo verso `wssUrl` (wss://host/ascolta/<chiave>) e resta in
     * ascolto finche' il filo non cade o non viene chiuso. Torna quando il
     * filo e' finito, per qualunque motivo. Solleva se la stretta di mano
     * fallisce (relay senza il pezzo dei fili: 404 -> chi chiama torna a
     * bussare).
     */
    void ascolta(String wssUrl, Ascoltatore ascoltatore) throws IOException {
        URI u = URI.create(wssUrl);
        if (!"wss".equals(u.getScheme())) throw new IOException("solo wss");
        String host = u.getHost();
        int port = u.getPort() > 0 ? u.getPort() : 443;
        String path = u.getRawPath();

        ascoltatore.fase("connetto " + host);
        SSLSocketFactory f = (SSLSocketFactory) SSLSocketFactory.getDefault();
        socket = (SSLSocket) f.createSocket();
        socket.connect(new java.net.InetSocketAddress(host, port), CONNECT_TIMEOUT_MS);
        socket.setSoTimeout(READ_TIMEOUT_MS);
        socket.setKeepAlive(true);
        socket.startHandshake();
        in = new BufferedInputStream(socket.getInputStream());
        out = socket.getOutputStream();

        /* la stretta di mano HTTP */
        byte[] nonce = new byte[16];
        random.nextBytes(nonce);
        String key = Base64.encodeToString(nonce, Base64.NO_WRAP);
        String req = "GET " + path + " HTTP/1.1\r\n"
            + "Host: " + host + "\r\n"
            + "Upgrade: websocket\r\n"
            + "Connection: Upgrade\r\n"
            + "Sec-WebSocket-Key: " + key + "\r\n"
            + "Sec-WebSocket-Version: 13\r\n"
            + "Origin: https://appassets.androidplatform.net\r\n"
            + "\r\n";
        ascoltatore.fase("tls ok, chiedo il filo");
        out.write(req.getBytes("US-ASCII"));
        out.flush();

        String status = leggiRiga();
        ascoltatore.fase("risposta: " + status);
        if (status == null || !status.startsWith("HTTP/1.1 101")) throw new IOException("non aperto: " + status);
        String accept = null;
        for (String line = leggiRiga(); line != null && !line.isEmpty(); line = leggiRiga()) {
            int i = line.indexOf(':');
            if (i > 0 && line.substring(0, i).trim().equalsIgnoreCase("Sec-WebSocket-Accept")) accept = line.substring(i + 1).trim();
        }
        /* la prova che dall'altra parte c'e' un WebSocket vero e non un proxy
           che ha risposto 101 a caso: SHA-1 della chiave + GUID del protocollo */
        String atteso;
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            atteso = Base64.encodeToString(sha1.digest((key + GUID).getBytes("US-ASCII")), Base64.NO_WRAP);
        } catch (Exception e) { throw new IOException("sha1"); }
        if (accept == null || !atteso.equals(accept)) throw new IOException("stretta di mano sbagliata");

        aperto = true;
        ascoltatore.aperto();
        boolean attesaPong = false;
        try {
            ascoltatore.fase("in ascolto");
            while (aperto) {
                int[] cornice;
                try {
                    cornice = leggiIntestazione();
                } catch (java.net.SocketTimeoutException t) {
                    /* niente da PING_EVERY_MS: si tira la linea con un ping;
                       se non torna niente nemmeno dopo, il filo e' morto */
                    if (attesaPong) throw new IOException("nessuna risposta al ping");
                    mandaTesto("ping");
                    attesaPong = true;
                    continue;
                }
                if (cornice == null) { ascoltatore.fase("filo caduto (fine flusso)"); break; }
                attesaPong = false;                               /* qualcosa e' arrivato: la linea e' viva */
                ascoltatore.fase("cornice " + cornice[0] + " (" + cornice[1] + " byte)");
                int opcode = cornice[0], len = cornice[1];
                if (len > MAX_FRAME_BYTES) throw new IOException("cornice troppo lunga");
                byte[] payload = leggiEsatti(len);
                if (payload == null) break;
                switch (opcode) {
                    case 0x1: {                                     /* testo */
                        String s = new String(payload, "UTF-8");
                        if (s.contains("\"busta\"")) ascoltatore.busta();
                        /* «pong» e qualunque altra cosa: si ignora */
                        break;
                    }
                    case 0x9: mandaCornice(0xA, payload); break;    /* ping -> pong */
                    case 0xA: break;                                /* pong */
                    case 0x8: aperto = false; break;                /* chiusura */
                    default: break;                                 /* binario, continuazione: non nostri */
                }
            }
        } catch (IOException e) {
            /* chiuso da noi (chiudi()): non e' un guasto, e' la fine voluta */
            if (aperto) throw e;
            ascoltatore.fase("chiuso da noi");
        } finally {
            chiudi();
        }
    }

    /** Chiude il filo da fuori (a servizio fermato). Sicuro da chiamare due volte. */
    void chiudi() {
        aperto = false;
        try { if (socket != null) socket.close(); } catch (Exception ignored) {}
        socket = null;
    }

    boolean aperto() { return aperto; }

    /* ---- cornici ---- */

    /** Legge opcode e lunghezza. null se il filo e' finito. */
    private int[] leggiIntestazione() throws IOException {
        int b1 = in.read();
        if (b1 < 0) return null;
        int b2 = in.read();
        if (b2 < 0) return null;
        int opcode = b1 & 0x0F;
        boolean fin = (b1 & 0x80) != 0;
        if (!fin) throw new IOException("frammentazione non ammessa");
        if ((b2 & 0x80) != 0) throw new IOException("il relay non maschera");
        long len = b2 & 0x7F;
        if (len == 126) {
            byte[] x = leggiEsatti(2);
            if (x == null) return null;
            len = ((x[0] & 0xFF) << 8) | (x[1] & 0xFF);
        } else if (len == 127) {
            byte[] x = leggiEsatti(8);
            if (x == null) return null;
            len = 0;
            for (byte b : x) len = (len << 8) | (b & 0xFF);
        }
        if (len > Integer.MAX_VALUE) throw new IOException("lunghezza assurda");
        return new int[] { opcode, (int) len };
    }

    private byte[] leggiEsatti(int n) throws IOException {
        byte[] buf = new byte[n];
        int got = 0;
        while (got < n) {
            int r = in.read(buf, got, n - got);
            if (r < 0) return null;
            got += r;
        }
        return buf;
    }

    private String leggiRiga() throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        int prev = -1, c;
        while ((c = in.read()) >= 0) {
            if (prev == '\r' && c == '\n') {
                byte[] b = bo.toByteArray();
                return new String(b, 0, Math.max(0, b.length - 1), "US-ASCII");
            }
            bo.write(c);
            prev = c;
            if (bo.size() > 8192) throw new IOException("riga troppo lunga");
        }
        return null;
    }

    private void mandaTesto(String s) throws IOException { mandaCornice(0x1, s.getBytes("UTF-8")); }

    /** Le cornici dal client vanno mascherate: lo dice il protocollo, e i
        server rifiutano quelle nude. */
    private synchronized void mandaCornice(int opcode, byte[] payload) throws IOException {
        if (out == null) return;
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        bo.write(0x80 | opcode);
        int len = payload.length;
        if (len < 126) bo.write(0x80 | len);
        else if (len < 65536) { bo.write(0x80 | 126); bo.write((len >> 8) & 0xFF); bo.write(len & 0xFF); }
        else throw new IOException("mai cosi' lungo");
        byte[] mask = new byte[4];
        random.nextBytes(mask);
        bo.write(mask, 0, 4);
        for (int i = 0; i < len; i++) bo.write(payload[i] ^ mask[i & 3]);
        out.write(bo.toByteArray());
        out.flush();
    }
}
