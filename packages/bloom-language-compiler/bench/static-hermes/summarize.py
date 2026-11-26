#!/usr/bin/env python3
"""summarize.py <results.txt>: medians of a session.sh run, one line per measure."""
import json, re, statistics as st, sys
rows, cold = {}, {}
for line in open(sys.argv[1]):
    m = re.match(r'^(hbc|sh|untyped|typed)\s+(\{.*\})\s*$', line)
    if m:
        j = json.loads(m.group(2))
        rows.setdefault(('json' if 'bytes' in j else 'notifications', m.group(1)), []).append(j)
    m = re.match(r'^(cold-hbc|cold-sh|empty-hbc|empty-sh)\s+(.*)$', line)
    if m:
        cold.setdefault(m.group(1), []).extend(int(x) for x in m.group(2).split())
med = lambda xs: round(st.median(xs), 1)
for (kind, form), runs in sorted(rows.items()):
    keys = ['updateUs', 'warmMountUs', 'moduleUs'] if kind == 'notifications' else ['parseUs', 'decodeUs', 'walkUs']
    print(kind, form, f'{len(runs)} runs', {k: med([r[k] for r in runs]) for k in keys})
for form, values in cold.items():
    print(form, f'{len(values)} runs', 'median us', med(values))
