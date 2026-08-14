# Worker — deploy steps

The one small server this project needs, doing three things, none of which
ever sees or stores a message: handing out short-lived TURN relay
credentials, running the short-lived encrypted mailbox connections are
negotiated through, and relaying "someone wants to talk to you" push
notifications without ever knowing who anyone's contacts are. See the
comment at the top of `worker.js` for how each piece actually works.

**If you already deployed an earlier version of this Worker**, the code
below has changed since — the mailbox contents are now encrypted, there's a
rate limiter, and there's a new `/knock` route. Repeat step 2 (paste the
current `worker.js` and redeploy) even if steps 1, 3 and 5 are already done.

## 1. Create the TURN key (Cloudflare dashboard)

1. Search **"Realtime"** in the Cloudflare dashboard search bar.
2. Open the **TURN** section.
3. **Create a TURN key.** Name it anything (e.g. "digitalvalut-logos").
4. You'll be shown a **Key ID** and an **API Token** — copy both somewhere
   safe for a moment. The API Token is shown only once.

## 2. Create the Worker

1. In the Cloudflare dashboard sidebar, under **Compute**, open
   **Workers & Pages**.
2. **Create** → **Workers** → **Start from scratch** (skip any template).
3. Name it e.g. `digitalvalut-turn`, then **Deploy** (the placeholder code
   is fine for now — we'll replace it next).
4. Open the new Worker → **Edit code**. Delete everything in the editor and
   paste in the contents of `worker.js` from this folder. **Save and deploy.**

## 3. Add the secrets and the KV binding

On the Worker's page → **Settings** → **Variables and Secrets**, add:

| Name | Type | Value |
|---|---|---|
| `TURN_KEY_ID` | Secret | the Key ID from step 1 |
| `TURN_API_TOKEN` | Secret | the API Token from step 1 |
| `VAPID_PUBLIC_KEY` | Secret or plain text (it's not sensitive) | given to you separately — a long string starting with `B` |
| `VAPID_PRIVATE_JWK` | Secret | given to you separately — a block starting with `{"kty":"EC"...` |

All four must be added **exactly as shown**, then save / redeploy if asked.

Also make sure a **KV namespace** called `mailbox` is bound to the Worker
under **Settings → Bindings**, with the binding name `MAILBOX` (all
capitals). If it isn't there yet: **Storage & Databases → KV → Create**,
name it `mailbox`, then bind it to this Worker with variable name `MAILBOX`.

**After any of the above** — new code, a changed secret, or a new binding —
go to **Deployments** and **Promote to 100%** on the newest version. Saving
alone is not enough; this is the step that has caught us out before.

## 4. Give me the Worker's URL

The Worker's public address looks like:

```
https://digitalvalut-turn.<your-subdomain>.workers.dev
```

It's shown at the top of the Worker's page. **This URL itself is not
secret** — safe to share — the actual secret (the API Token) stays inside
Cloudflare and is never sent to the browser.

## 5. Billing

Cloudflare bills $0.05 per GB relayed through TURN — only for the calls that
actually need the relay (most calls between people on ordinary home networks
connect directly and cost nothing). Add a payment method under
**Manage account → Billing** if one isn't on the account yet, or the Worker
will get billing errors back from Cloudflare once real usage starts.

Once the URL is in hand, the chat's own code is updated to fetch fresh
credentials from it before each call/connection, with the existing
Google STUN servers kept as an always-available fallback if the Worker is
ever unreachable.
