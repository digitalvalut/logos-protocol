# TURN credential broker — deploy steps

This is the one small server this project now needs: not for messages or files,
only to hand out short-lived (24h) TURN relay credentials so two phones on
different mobile networks can find each other. It never sees or stores
anything about who is chatting.

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

## 3. Add the two secrets

1. On the Worker's page → **Settings** → **Variables and Secrets**.
2. Add a secret named `TURN_KEY_ID` — paste the Key ID from step 1.
3. Add a secret named `TURN_API_TOKEN` — paste the API Token from step 1.
4. Both must be added as **Secret** (encrypted), not plain text variables.
5. Save / redeploy if asked.

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
