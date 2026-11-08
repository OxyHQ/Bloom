"""Profile full-viewport fixture captures against each platform's own unlit surface.
Analysis-only dependencies: matplotlib3.10.7, Pillow12.0.0 (isolated venv).
"""
import argparse
import csv
import json
import math
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--web', type=Path, required=True)
parser.add_argument('--native', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
web = json.loads((args.web / 'report.json').read_text())
native = json.loads((args.native / 'layers.json').read_text())
density = native['density']
rows, summaries = [], []

def sample(im, x, y):
    x0, y0 = math.floor(x), math.floor(y)
    fx, fy = x-x0, y-y0
    return ((1-fx)*(1-fy)*im[y0, x0] + fx*(1-fy)*im[y0, x0+1]
            + (1-fx)*fy*im[y0+1, x0] + fx*fy*im[y0+1, x0+1])

def frame(platform, case):
    if platform == 'native':
        left, top, right, bottom = case['bounds']
        return left, top, right-left, bottom-top
    c = next(c for c in web['cases'] if c['variant'] == case['variant'] and c['theme'] == case['theme'])
    return c['x']*density, c['y']*density, c['width']*density, c['height']*density

for case in native['cases']:
    key = f"{case['theme']}-{case['variant']}"
    fig, axes = plt.subplots(4, 2, figsize=(10, 11), sharex='col', constrained_layout=True)
    for row, layer in enumerate(['all', 'bloom', 'glow', 'line']):
        for col, normal in enumerate(['red-straight', 'purple-curve45']):
            ax = axes[row, col]
            for platform, directory, color in [('web', args.web, '#2166ac'), ('native', args.native, '#d66020')]:
                im = np.asarray(Image.open(directory / f'{key}-{layer}.png').convert('RGB'), dtype=float)
                base = np.asarray(Image.open(directory / f'{key}-none.png').convert('RGB'), dtype=float)
                left, top, width, height = frame(platform, case)
                radius = 12*density if case['variant'] == 'corner-taper' else height/2
                distances = np.arange(0, (24 if col == 0 else 36)+.25, .5)
                magnitude = []
                for distance in distances:
                    d = distance*density
                    if col == 0:
                        x, y = left+.66*width, top+d
                    else:
                        x = left+width-radius+(radius-d)/math.sqrt(2)
                        y = top+radius-(radius-d)/math.sqrt(2)
                    delta = sample(im, x, y)-sample(base, x, y)
                    value = float(np.linalg.norm(delta))
                    magnitude.append(value)
                    rows.append([platform, case['theme'], case['variant'], layer, normal, float(distance), *map(float, delta), value, x, y])
                peak = max(magnitude)
                summaries.append(dict(platform=platform, theme=case['theme'], variant=case['variant'], layer=layer, normal=normal,
                    peakRGB=peak, areaRGBdp=float(np.trapezoid(magnitude, distances)), tailRGB=magnitude[-1],
                    lastAbove3dp=max((float(d) for d,v in zip(distances,magnitude) if v>3), default=0),
                    sampledToDp=float(distances[-1])))
                ax.plot(distances, magnitude, label=platform, color=color, linewidth=1.5)
            ax.set_title(f'{layer}: {normal}', fontsize=10)
            ax.set_ylim(bottom=0)
            ax.grid(alpha=.2)
            if col == 0: ax.set_ylabel('RGB8 difference from surface')
            if row == 3: ax.set_xlabel('Distance inward (dp)')
            if row == 0: ax.legend()
    fig.suptitle(f'Fixed physical phase 1s — {key}\nWeb vs grouped soft sigma ×0.7, crisp unchanged', fontsize=12)
    fig.savefig(args.out / f'{key}.png', dpi=140)
    fig.savefig(args.out / f'{key}.svg')
    plt.close(fig)
with (args.out/'profiles.csv').open('w') as file:
    writer = csv.writer(file)
    writer.writerow(['platform','theme','variant','layer','normal','distance_dp','delta_r','delta_g','delta_b','delta_rgb_norm','x_px','y_px'])
    writer.writerows(rows)
(args.out/'report.json').write_text(json.dumps(dict(
    method='Bilinear RGB8 sampling from full viewport captures; subtract same-platform same-geometry unlit Surface at the same pixel. Euclidean RGB magnitude is not contrast or perceptual delta-E. Curve is the upper-right arc at45degrees. Last-above3 describes only the sampled interval, not a perceptual visibility threshold.',
    matplotlib=matplotlib.__version__, nativeBuild=json.loads((args.native/'environment.json').read_text())['build'],
    webBrowser=web['browser'], density=density, geometryLimitation='Yoga and RNW onLayout round fractional geometry differently; raw frame coordinates are retained in CSV.', summaries=summaries), indent=2))
print(f'{len(rows)} samples and {len(native["cases"])} comparison figures: {args.out}')
