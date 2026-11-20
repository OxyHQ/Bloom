#!/usr/bin/env python3
"""Fail when any crates.io package in Cargo.lock is younger than the quarantine.

Cargo has no stable equivalent of bun's `minimumReleaseAge` (`--publish-time`
is still unstable), so the lockfile is checked after resolution instead.

Usage: scripts/audit-crate-ages.py [Cargo.lock] [--days 7]
"""
import datetime
import json
import sys
import time
import tomllib
import urllib.request

lock_path = next((a for a in sys.argv[1:] if not a.startswith("--")), "Cargo.lock")
days = int(sys.argv[sys.argv.index("--days") + 1]) if "--days" in sys.argv else 7
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)

with open(lock_path, "rb") as handle:
    packages = [
        p for p in tomllib.load(handle)["package"]
        if p.get("source", "").startswith("registry+")
    ]

too_new = []
for package in packages:
    url = f"https://crates.io/api/v1/crates/{package['name']}/{package['version']}"
    request = urllib.request.Request(url, headers={"User-Agent": "crate-age-audit"})
    with urllib.request.urlopen(request) as response:
        created = json.load(response)["version"]["created_at"]
    published = datetime.datetime.fromisoformat(created.replace("Z", "+00:00"))
    if published > cutoff:
        too_new.append(f"{package['name']} {package['version']} ({created[:10]})")
    time.sleep(0.05)  # crates.io asks crawlers for at most a few requests a second

print(f"{len(packages)} registry crates checked against a {days}-day quarantine")
if too_new:
    print("Too new:\n  " + "\n  ".join(too_new))
    sys.exit(1)
