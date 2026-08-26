#!/usr/bin/env python3
# Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Fold the whole chat into one file.

The app is normally four files that fetch each other. This produces one
self-contained HTML file with the stylesheet and the script written straight
into it, so it can be put on any web host, attached to an email, or carried on a
USB stick, and still be the real thing rather than a cut-down copy.

Why that matters: nothing here can be taken off the internet by taking one site
down. Anyone holding this file can put the app back up in the time it takes to
drag it onto a web host.

Run it with no arguments:

    python3 build-single-file.py

and it writes `digitalvalut-logos.html` next to the other files.

Two honest limits, both consequences of how browsers work rather than of this
script:

  * Opened with a double-click (a file:// address) it will run, but cameras and
    microphones stay unavailable — browsers only hand those out to pages served
    over https. Messages and files work; calls need it hosted.
  * It has no service worker, so it does not install as an app or keep working
    with the network off. Hosted properly, the ordinary four-file version does
    both.

The logo is embedded, because "a single file" has to mean it. It used to stay
out, on the reasoning that a missing icon costs nothing — which was true while
this build was only ever a curiosity you could host anywhere. It stopped being
true the moment the Android package started serving this file as the app: there
the logo is the app's own face on its first screen, and it came up as a broken
image. The 192px icon is used rather than the 512px one because it is displayed
small; that is about 40 KB apiece instead of 260.
"""

import base64
import hashlib
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "digitalvalut-logos.html"


def read(name):
    path = HERE / name
    if not path.exists():
        sys.exit(f"missing {name} — run this from the folder holding the app")
    return path.read_text(encoding="utf-8")


def data_uri(name):
    """The bytes of an image, folded into the page itself."""
    path = HERE / name
    if not path.exists():
        sys.exit(f"missing {name} — the logo has to be embedded, see the note at the top")
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def embed_the_logo(html):
    """Everything the page would otherwise go looking for beside itself.

    A relative path works on the website, where those files sit next to the
    HTML, and fails silently everywhere else — most visibly inside the Android
    package, where nothing exists beside this file at all.
    """
    logo = data_uri("modifica-icon-192.png")

    html, n_img = re.subn(r'src="modifica-icon-512\.png"', f'src="{logo}"', html)
    if n_img < 1:
        sys.exit("could not find the logo image in modifica.html")

    # Tab icons are cosmetic, and a second and third copy of the same 40 KB to
    # decorate a tab is not worth carrying. Dropped rather than left pointing at
    # files that are not there.
    html = re.sub(
        r'\n?[ \t]*<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*>',
        "",
        html,
    )

    # The licence sits beside the app in the repository, not beside this file.
    html = html.replace(
        'href="LICENSE"',
        'href="https://github.com/digitalvalut/logos-protocol/blob/main/LICENSE"',
    )
    return html, n_img


def check_version_matches():
    """The app reports the version it is running so a stale cached shell can be
    seen instead of guessed — but that only works while APP_VERSION in
    modifica.js and CACHE in modifica-sw.js say the same thing. Forgetting to
    bump one of them is the single mistake that has cost this project the most
    time, so the build refuses to produce anything until they agree."""
    js_v = re.search(r"APP_VERSION\s*=\s*'([^']+)'", read("modifica.js"))
    sw_v = re.search(r"CACHE\s*=\s*'([^']+)'", read("modifica-sw.js"))
    if not js_v or not sw_v:
        sys.exit("cannot find APP_VERSION in modifica.js or CACHE in modifica-sw.js")
    if js_v.group(1) != sw_v.group(1):
        sys.exit(
            f"version mismatch — modifica.js says {js_v.group(1)}, "
            f"modifica-sw.js says {sw_v.group(1)}. Bump both, then build again."
        )
    return js_v.group(1)


def main():
    version = check_version_matches()
    print(f"version {version} — modifica.js and modifica-sw.js agree")
    html = read("modifica.html")
    css = read("modifica.css")
    js = read("modifica.js")

    # The stylesheet and script are written in verbatim. Neither contains a
    # closing script tag, but a check costs nothing and a silently truncated
    # single-file build would be a miserable thing to debug months later.
    for name, body in (("modifica.css", css), ("modifica.js", js)):
        if "</script>" in body.lower():
            sys.exit(f"{name} contains a closing script tag — inlining it would cut the file short")

    # What goes between the tags, exactly — the Content-Security-Policy below is
    # a hash of these bytes, so they must not be rebuilt differently anywhere.
    style_body = "\n" + css + "\n"
    script_body = "\n" + js + "\n"

    html, n_css = re.subn(
        r'<link[^>]+rel="stylesheet"[^>]*>',
        lambda _: "<style>" + style_body + "</style>",
        html,
        count=1,
    )
    if n_css != 1:
        sys.exit("could not find the stylesheet link in modifica.html")

    html, n_js = re.subn(
        r'<script src="modifica\.js"></script>',
        lambda _: "<script>" + script_body + "</script>",
        html,
        count=1,
    )
    if n_js != 1:
        sys.exit("could not find the script tag in modifica.html")

    # The page refuses to run any script or stylesheet that is not its own file,
    # which is the whole point of having that policy — and which stops the
    # inlined copies dead. The fix is not to relax it to allow *any* inline code
    # (that would throw the protection away for the one build most likely to be
    # passed hand to hand) but to name these two exact blocks by their hash.
    # Anything else inline is still refused, and altering a single character of
    # the script makes the browser itself refuse to run it.
    style_hash = base64.b64encode(hashlib.sha256(style_body.encode()).digest()).decode()
    script_hash = base64.b64encode(hashlib.sha256(script_body.encode()).digest()).decode()

    html, n_pol = re.subn(
        r"script-src 'self';\s*\n\s*style-src 'self';",
        f"script-src 'self' 'sha256-{script_hash}';\n"
        f"  style-src 'self' 'sha256-{style_hash}';",
        html,
        count=1,
    )
    if n_pol != 1:
        sys.exit("could not find the security policy to update in modifica.html")

    # The service worker cannot be inlined — a browser will only register one
    # from a URL of its own — so the registration is removed rather than left to
    # fail against a file that is not there beside this one.
    html = html.replace(
        '<link rel="manifest" href="modifica-manifest.webmanifest">',
        "<!-- single-file build: no manifest, see build-single-file.py -->",
    )

    # The fingerprints panel needs no help: finding no separate files to fetch,
    # the app hashes the one file it has become instead. See selfSeal().

    html, n_logo = embed_the_logo(html)
    print(f"logo embedded in {n_logo} place(s); no file is looked for beside this one")

    # Nothing may be left pointing outside: this file has to stand alone, and a
    # relative path that survives here is a broken image on somebody's phone.
    stragglers = sorted(set(
        m.group(1) for m in re.finditer(r'(?:src|href)="((?!https?:|data:|#|mailto:)[^"{}$\']+)"', html)
    ))
    if stragglers:
        sys.exit("these would be looked for beside the file, and will not be there: "
                 + ", ".join(stragglers))

    OUT.write_text(html, encoding="utf-8")

    digest = hashlib.sha256(OUT.read_bytes()).hexdigest()
    size_kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT.name}  —  {size_kb:.0f} KB")
    print(f"sha256  {digest}")
    print()
    print("Put it on any web host and the app is back up. Opened by double-click it")
    print("still runs, but calls need it served over https — see the note at the top")
    print("of this script.")


if __name__ == "__main__":
    main()
