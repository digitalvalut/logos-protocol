# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Write to **burbeng78@gmail.com** with `[SECURITY]` in the subject line, or use
GitHub's private reporting: **Security → Report a vulnerability** on this
repository.

Include whatever you have — a description, the steps you took, a proof of
concept, or just a hunch you could not fully confirm. A partial report is worth
sending; several of the defects fixed in this project were found by somebody
simply using the app on a real phone and saying "this looks wrong".

## What to expect

DigitalValut is a small Italian nonprofit association (APS/ETS). There is no
company, no revenue and no security team behind this — reports are read by the
maintainer, so please allow a few days rather than a few hours.

- **Acknowledgement:** within 7 days.
- **An honest assessment:** whether we can reproduce it, how serious we think it
  is, and what we intend to do. If we disagree about the severity we will say so
  and explain why, rather than going quiet.
- **A fix, or a clear statement that there will not be one.** Some limits are
  accepted deliberately and documented as such; you deserve to be told which.
- **Credit**, if you want it. Say so in your report, and how you would like to
  be named.

## Coordinated disclosure

We ask for a **90-day** window before public disclosure, and we will usually be
much faster than that. If a fix is going to take longer, we will tell you why
and agree a date with you rather than let the deadline pass in silence.

Fixed problems are described openly — in the commit that fixes them and in the
release notes, in plain language. Problems that are still open are not published
until they are closed, which is the only reason this repository does not carry a
running list of them.

## Scope

**In scope**
- The web application (`modifica.html`, `modifica.js`, `modifica.css`,
  `modifica-sw.js`) and the Android app in `android/`.
- The Cloudflare Worker in `turn-worker/` that lets two devices find each other.
- The cryptographic design: the six-digit invite codes, the permanent
  `DV-…` addresses, the sealed letters, the three-word verification.

**Out of scope**
- Attacks that require physical access to an unlocked device.
- Weaknesses in Cloudflare, in the browser, or in the operating system — please
  report those to their vendors. If our *use* of them is what is wrong, that is
  in scope and we want to hear it.
- The absence of features. "It does not do X" is feedback, not a vulnerability;
  a normal issue is the right place for that.

## Things we already know

Being straight about this saves your time:

- **The six-digit code is a short secret.** Read aloud over a channel somebody is
  listening to, it can be attacked. The relay limits attempts, and the app shows
  three words for verification, but the code alone is not strong. A better design
  is planned; an earlier attempt was withdrawn because it broke people typing the
  digits by hand.
- **The local history is stored unencrypted** on the device. Whoever can read the
  device's storage can read past messages.
- **The free hosting tier is a real limit.** Logos runs on a free Cloudflare plan
  and can be exhausted by volume. Availability, not confidentiality: the relay
  only ever forwards material that is already encrypted, and never holds a key.

## What this project promises, and what it does not

Conversations are end-to-end encrypted and travel directly between the two
devices. The relay exists so that two devices can find each other, and it cannot
read anything that passes through it.

It has **not** been audited independently. An external review was received in
August 2026 and its findings are being worked through; until an independent audit
exists, please treat this as software written carefully by very few people rather
than as software that has been proven safe. If your safety depends on it, use
something that has been audited.
