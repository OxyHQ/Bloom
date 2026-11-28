#!/usr/bin/env python3
"""Writes the bench's FixtureImages.bloom: the feed's pictures, either as picsum.photos URLs
(the committed form) or, with --inline, downloaded once and inlined as data: URLs, so both
builds decode the same bytes with no network in the measurement (ADR 0003, "Method").

    fixture_images.py examples/NativeBench/Sources/Feed/FixtureImages.bloom [--inline]
"""
import base64, sys, urllib.request

out = sys.argv[1]
inline = "--inline" in sys.argv
posts = [f"https://picsum.photos/id/{i}/480/360.jpg" for i in range(10, 22)]
avatars = [f"https://picsum.photos/id/{i + 60}/96/96.jpg" for i in range(1, 17)]

def src(url):
    if not inline:
        return url
    with urllib.request.urlopen(url) as r:
        return "data:image/jpeg;base64," + base64.b64encode(r.read()).decode()

def array(name, urls):
    items = ",\n".join(f'  "{src(u)}"' for u in urls)
    return f"let {name}: [String] = [\n{items},\n]\n"

with open(out, "w") as f:
    f.write("// The feed's pictures (crates/native/scripts/fixture_images.py writes this file; --inline\n")
    f.write("// inlines them as data: URLs for the device bench). Photos: picsum.photos (Unsplash licence).\n\n")
    f.write(array("postImages", posts) + "\n" + array("avatarImages", avatars))
