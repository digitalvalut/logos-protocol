#!/usr/bin/env python3
"""
LOGOS - The Unbreakable Truth Protocol (command line edition)

Seal any file with mathematics. No account, no server, no permission needed.
Produces exactly the same seals as LOGOS.html - the two are interchangeable.

    python3 logos.py seal evidence.mp4 --author "Jane Doe" --statement "Recorded on..."
    python3 logos.py verify evidence.mp4
    python3 logos.py anchor evidence.mp4.logos.json
    python3 logos.py hash evidence.mp4

Created and conceived by Dr. Giuseppe Falsone for DigitalValut.
(c) 2026 DigitalValut and the DigitalValut Team. MIT License. Donated to humanity.
Standard library only: it runs on any machine with Python 3.6+, forever, offline.
"""

import argparse
import datetime
import hashlib
import json
import os
import sys

VERSION = "1.0"
CHUNK = 4 * 1024 * 1024

# Free public OpenTimestamps calendars. No account, no wallet, no payment.
CALENDARS = [
    "https://a.pool.opentimestamps.org",
    "https://b.pool.opentimestamps.org",
    "https://a.pool.eternitywall.com",
    "https://ots.btc.catallaxy.com",
]
OTS_MAGIC = (b"\x00" + b"OpenTimestamps" + b"\x00\x00" + b"Proof" +
             b"\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94")


# --------------------------------------------------------------------------
# hashing
# --------------------------------------------------------------------------

def hash_file(path, progress=True):
    """Stream the file once, computing both fingerprints. Any size, any format."""
    size = os.path.getsize(path)
    h3 = hashlib.sha3_512()
    h2 = hashlib.sha256()
    done = 0
    with open(path, "rb") as fh:
        while True:
            block = fh.read(CHUNK)
            if not block:
                break
            h3.update(block)
            h2.update(block)
            done += len(block)
            if progress and size and sys.stderr.isatty():
                sys.stderr.write("\r  sealing... %5.1f%%" % (100.0 * done / size))
                sys.stderr.flush()
    if progress and size and sys.stderr.isatty():
        sys.stderr.write("\r                    \r")
        sys.stderr.flush()
    return {"sha3-512": h3.hexdigest(), "sha256": h2.hexdigest()}


def compute_seal_id(seal):
    """SHA-256 of a fixed plain-text record. Identical in every implementation."""
    record = "\n".join([
        "LOGOS/1",
        "sha3-512:" + seal["hash"]["sha3-512"],
        "sha256:" + seal["hash"]["sha256"],
        "size:" + str(seal["file"]["size"]),
        "name:" + seal["file"]["name"],
        "sealed:" + seal["sealed_utc"],
        "author:" + (seal.get("author") or ""),
        "statement-sha256:" + hashlib.sha256(
            (seal.get("statement") or "").encode("utf-8")).hexdigest(),
    ])
    return hashlib.sha256(record.encode("utf-8")).hexdigest()


def iso_utc(ts=None):
    """JavaScript-compatible ISO 8601 UTC, milliseconds: 2026-08-10T21:00:00.000Z"""
    dt = datetime.datetime.utcfromtimestamp(ts) if ts is not None \
        else datetime.datetime.utcnow()
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + "%03dZ" % (dt.microsecond // 1000)


# --------------------------------------------------------------------------
# Bitcoin anchoring (OpenTimestamps)
# --------------------------------------------------------------------------

def anchor_sha256(digest_hex, out_path, quiet=False):
    """Send only the 32-byte fingerprint to independent calendars.
    Writes a standard .ots proof file. Returns the record, or None on failure."""
    import urllib.request

    digest = bytes.fromhex(digest_hex)
    branches, used = [], []
    for url in CALENDARS:
        try:
            req = urllib.request.Request(
                url + "/digest", data=digest,
                headers={"Accept": "application/vnd.opentimestamps.v1",
                         "User-Agent": "logos/" + VERSION})
            body = urllib.request.urlopen(req, timeout=25).read()
            if len(body) < 8:
                raise ValueError("short reply")
            branches.append(body)
            used.append(url)
            if not quiet:
                print("  ok    %s" % url)
        except Exception as exc:                                  # noqa: BLE001
            if not quiet:
                print("  fail  %s  (%s)" % (url, exc))

    if not branches:
        return None

    # .ots = magic | version 1 | op sha256 (0x08) | digest | timestamp branches
    blob = OTS_MAGIC + bytes([0x01, 0x08]) + digest
    for i, branch in enumerate(branches):
        if i < len(branches) - 1:
            blob += b"\xff"
        blob += branch
    with open(out_path, "wb") as fh:
        fh.write(blob)

    return {
        "standard": "OpenTimestamps",
        "anchored_utc": iso_utc(),
        "binds": "sha256",
        "calendars": used,
        "status": "pending - confirmed in the Bitcoin blockchain within a few hours",
        "proof_file": os.path.basename(out_path),
        "verify": "ots upgrade %s && ots verify %s" % (
            os.path.basename(out_path), os.path.basename(out_path)),
    }


# --------------------------------------------------------------------------
# commands
# --------------------------------------------------------------------------

def cmd_seal(args):
    path = args.file
    if not os.path.isfile(path):
        sys.exit("logos: no such file: %s" % path)

    stat = os.stat(path)
    seal = {
        "logos": VERSION,
        "type": "seal",
        "file": {
            "name": os.path.basename(path),
            "size": stat.st_size,
            "mime": "application/octet-stream",
            "modified_utc": iso_utc(stat.st_mtime),
        },
        "hash": hash_file(path),
        "sealed_utc": iso_utc(),
        "sealed_local": datetime.datetime.now().strftime("%a %b %d %Y %H:%M:%S"),
        "timezone": str(datetime.datetime.now().astimezone().tzinfo),
        "author": args.author or "",
        "statement": args.statement or "",
        "seal_id": "",
        "note": ("Verify with LOGOS, or with any standard tool: "
                 "sha256sum / openssl dgst -sha3-512"),
    }
    seal["seal_id"] = compute_seal_id(seal)

    if args.anchor:
        print("Anchoring the fingerprint to Bitcoin (no wallet, no account, free):")
        record = anchor_sha256(seal["hash"]["sha256"], path + ".ots")
        if record:
            seal["bitcoin_anchor"] = record
            print("  proof written to %s - keep it next to your file" % (path + ".ots"))
        else:
            print("  no calendar reachable; the seal is still valid, anchor later with:")
            print("    python3 logos.py anchor %s" % (path + ".logos.json"))

    out = args.out or path + ".logos.json"
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(seal, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print_seal(seal)
    print("Seal written to %s" % out)
    print("Keep it, copy it, publish it. Every copy is the original.")


def print_seal(seal):
    print("")
    print("  LOGOS SEAL")
    print("  file       %s" % seal["file"]["name"])
    print("  size       %s bytes" % seal["file"]["size"])
    print("  sha3-512   %s" % seal["hash"]["sha3-512"])
    print("  sha256     %s" % seal["hash"]["sha256"])
    print("  sealed     %s UTC" % seal["sealed_utc"])
    if seal.get("author"):
        print("  author     %s" % seal["author"])
    if seal.get("statement"):
        print("  statement  %s" % seal["statement"])
    print("  seal id    %s" % seal["seal_id"])
    print("")


def load_seal(path):
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    try:
        return json.loads(text)
    except ValueError:
        import re
        found = re.search(
            r"<script[^>]*id=[\"']logos-seal[\"'][^>]*>([\s\S]*?)</script>",
            text, re.I)
        if found:
            return json.loads(found.group(1))
        raise


def cmd_verify(args):
    seal_path, file_path = args.seal, args.file
    # allow: verify FILE  (finds FILE.logos.json by itself)
    if file_path is None:
        if os.path.isfile(seal_path + ".logos.json"):
            seal_path, file_path = seal_path + ".logos.json", seal_path
        else:
            sys.exit("logos: usage: logos.py verify SEAL FILE   (or: verify FILE)")

    try:
        seal = load_seal(seal_path)
    except Exception as exc:                                      # noqa: BLE001
        sys.exit("logos: %s is not a LOGOS seal (%s)" % (seal_path, exc))
    if not os.path.isfile(file_path):
        sys.exit("logos: no such file: %s" % file_path)

    got = hash_file(file_path)
    ok3 = (got["sha3-512"] == seal["hash"]["sha3-512"]) if seal["hash"].get("sha3-512") else None
    ok2 = got["sha256"] == seal["hash"]["sha256"]
    try:
        okid = compute_seal_id(seal) == seal.get("seal_id")
    except Exception:                                             # noqa: BLE001
        okid = None

    mark = lambda v: "MATCH" if v else "DIFFERENT"                # noqa: E731
    print("")
    print("  file       %s" % file_path)
    print("  sha3-512   %s" % ("not in seal" if ok3 is None else mark(ok3)))
    print("  sha256     %s" % mark(ok2))
    print("  seal       %s" % ("no seal id" if okid is None else
                               ("INTACT" if okid else "TAMPERED - the seal file was edited")))
    print("  sealed     %s UTC" % seal.get("sealed_utc", "unknown"))
    if seal.get("author"):
        print("  author     %s" % seal["author"])
    if seal.get("statement"):
        print("  statement  %s" % seal["statement"])
    if seal.get("bitcoin_anchor"):
        print("  bitcoin    %s" % seal["bitcoin_anchor"].get("status", "anchored"))
    print("")

    if ok2 and ok3 is not False:
        print("  AUTHENTIC - this file is bit for bit the file that was sealed.")
        print("")
        print("  Note: the sealing time comes from the device that made the seal.")
        print("  It is independently proven only if the seal was published or")
        print("  anchored to Bitcoin at that time.")
        sys.exit(0)
    else:
        print("  ALTERED - this is NOT the file that was sealed.")
        print("  expected sha256  %s" % seal["hash"]["sha256"])
        print("  computed sha256  %s" % got["sha256"])
        sys.exit(1)


def cmd_anchor(args):
    target = args.target
    if target.endswith(".logos.json") or target.endswith(".html"):
        seal = load_seal(target)
        digest = seal["hash"]["sha256"]
        base = seal["file"]["name"]
        out = os.path.join(os.path.dirname(os.path.abspath(target)), base + ".ots")
        print("Anchoring the fingerprint of %s to Bitcoin:" % base)
        record = anchor_sha256(digest, out)
        if not record:
            sys.exit("logos: no calendar could be reached - check your connection")
        seal["bitcoin_anchor"] = record
        if target.endswith(".logos.json"):
            with open(target, "w", encoding="utf-8") as fh:
                json.dump(seal, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
            print("  seal updated: %s" % target)
    else:
        if not os.path.isfile(target):
            sys.exit("logos: no such file: %s" % target)
        digest = hash_file(target)["sha256"]
        out = target + ".ots"
        print("Anchoring the fingerprint of %s to Bitcoin:" % os.path.basename(target))
        record = anchor_sha256(digest, out)
        if not record:
            sys.exit("logos: no calendar could be reached - check your connection")

    print("  proof written to %s" % out)
    print("")
    print("  Keep this .ots file next to your original file.")
    print("  After a few hours, confirm it with the official free client:")
    print("      pip install opentimestamps-client")
    print("      ots upgrade %s" % os.path.basename(out))
    print("      ots verify  %s" % os.path.basename(out))


def cmd_hash(args):
    if not os.path.isfile(args.file):
        sys.exit("logos: no such file: %s" % args.file)
    got = hash_file(args.file)
    print("sha3-512  %s" % got["sha3-512"])
    print("sha256    %s" % got["sha256"])


def main():
    parser = argparse.ArgumentParser(
        prog="logos",
        description="LOGOS - seal any file with mathematics. "
                    "No account, no server, no permission needed.",
        epilog="Created and conceived by Dr. Giuseppe Falsone for DigitalValut. "
               "(c) 2026 DigitalValut and the DigitalValut Team. "
               "MIT License. Donated to humanity.")
    parser.add_argument("--version", action="version", version="LOGOS " + VERSION)
    sub = parser.add_subparsers(dest="cmd")

    p = sub.add_parser("seal", help="seal a file and write its proof")
    p.add_argument("file")
    p.add_argument("--author", help="who is sealing this")
    p.add_argument("--statement", help="what this file is, and why it matters")
    p.add_argument("--anchor", action="store_true",
                   help="also anchor the fingerprint to Bitcoin (needs internet)")
    p.add_argument("--out", help="where to write the seal (default: FILE.logos.json)")
    p.set_defaults(func=cmd_seal)

    p = sub.add_parser("verify", help="check a file against its seal")
    p.add_argument("seal", help="the .logos.json seal, or the file itself")
    p.add_argument("file", nargs="?", help="the original file")
    p.set_defaults(func=cmd_verify)

    p = sub.add_parser("anchor", help="anchor an existing seal or file to Bitcoin")
    p.add_argument("target", help="a .logos.json seal, or a file")
    p.set_defaults(func=cmd_anchor)

    p = sub.add_parser("hash", help="print the fingerprints of a file")
    p.add_argument("file")
    p.set_defaults(func=cmd_hash)

    args = parser.parse_args()
    if not getattr(args, "func", None):
        parser.print_help()
        sys.exit(0)
    args.func(args)


if __name__ == "__main__":
    main()
