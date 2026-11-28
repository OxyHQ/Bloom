#!/usr/bin/env python3
"""sum.py <label>…: medians and p95 (nearest rank) of each run field, and of the toggle taps."""
import os, re, sys, statistics, pathlib, math
D = pathlib.Path(os.environ.get('BENCH_DIR', os.path.expanduser('~/.local/share/bloom-lang/nativebackend'))) / 'run'
def p95(xs):
    xs = sorted(xs); return xs[max(0, math.ceil(0.95 * len(xs)) - 1)]
for label in sys.argv[1:]:
    rows = [dict(re.findall(r'(\w+)=([0-9.]+)', l)) for l in (D / label / 'summary.txt').read_text().splitlines() if 'run' in l]
    out = []
    for k in ['total', 'shown', 'idlepss', 'frames', 'janky', 'p50', 'p90', 'p95', 'p99', 'pss']:
        xs = [float(r[k]) for r in rows if k in r]
        if xs: out.append(f"{k}={statistics.median(xs):g}/{p95(xs):g}")
    print(label, f"n={len(rows)}", ' '.join(out))
    taps = []
    for f in sorted((D / label).glob('*-toggle.txt')):
        taps += [float(x) for x in f.read_text().split()]
    if taps:
        print(label, f"toggle n={len(taps)} median={statistics.median(taps):.2f} p95={p95(taps):.2f} max={max(taps):.2f}")
    tg = (D / label / 'toggle.txt')
    if tg.exists(): print(tg.read_text().strip())
